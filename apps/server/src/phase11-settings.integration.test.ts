/**
 * Phase 11 owner Settings over the real oRPC transport, real authentication,
 * and disposable Postgres.
 *
 * The fixture deliberately places rows a live clock cannot produce on demand:
 * an equal-effectiveFrom version tie, a future-dated row that must stay
 * invisible, non-default operational timings that must copy forward, a stored
 * occupancy minute whose historical snapshot must never be rewritten, and a
 * scheduled-reset issuance whose close-owning version must stay frozen.
 */
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import { PUBLIC_OCCUPANCY_INTERNAL_PATH } from "@fitway/api/public-occupancy";
import { AuthService } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	auditLog,
	currentState,
	edgeCommands,
	edgeDevices,
	occupancyMinutes,
	scheduledResetIssuances,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PinRateLimiter } from "./auth/pin-rate-limiter";
import { PostgresAuthRepository } from "./auth/postgres-auth-repository";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});

const secret = randomBytes(32).toString("base64url");
process.env.BETTER_AUTH_SECRET = secret;
process.env.BETTER_AUTH_URL = "http://127.0.0.1/api/auth";
process.env.CORS_ORIGIN = "http://127.0.0.1";
process.env.NODE_ENV = "test";

const pool = new Pool({ connectionString });
const database = drizzle(pool, {
	schema: { ...applicationSchema, ...authSchema },
});
const authService = new AuthService({
	repository: new PostgresAuthRepository(
		database as unknown as typeof import("@fitway/db").db,
	),
	pepper: secret,
	cookieSecret: secret,
});
const runtime = {
	service: authService,
	staffPinLimiter: new PinRateLimiter(),
	ownerLoginLimiter: new PinRateLimiter(),
};

/** Friday closes 01:00 next day; Saturday is closed. */
const fixtureSchedule = {
	scheduleSunOpen: "06:00",
	scheduleSunClose: "23:00",
	scheduleMonOpen: "06:00",
	scheduleMonClose: "23:00",
	scheduleTueOpen: "06:00",
	scheduleTueClose: "23:00",
	scheduleWedOpen: "06:00",
	scheduleWedClose: "23:00",
	scheduleThuOpen: "06:00",
	scheduleThuClose: "23:00",
	scheduleFriOpen: "13:00",
	scheduleFriClose: "01:00",
	scheduleSatOpen: null,
	scheduleSatClose: null,
} as const;

/** Deliberately non-default: a defaulted copy-forward would pass these tests. */
const lockedOperational = {
	timezone: "Asia/Riyadh",
	pushIntervalSeconds: 25,
	freshForSeconds: 111,
	operationalStaleAfterSeconds: 333,
	publicPollSeconds: 77,
} as const;

const OLDEST = "2026-07-01T00:00:00.000Z";
const FUTURE = "2027-01-01T00:00:00.000Z";
const HISTORIC_MINUTE = "2026-07-01T05:30:00.000Z";

let server: ReturnType<typeof serve>;
let baseUrl = "";
let staffCookie = "";
let ownerCookie = "";
let deviceId = "";
let ownerPrincipalId = "";
/** Identity values are generated, so the fixture records what it received. */
let fixtureVersions = { tieOlder: 0, tieCurrent: 0 };
/** The version the successful update appended; later tests derive from it. */
let appendedVersion = 0;

function cookiePair(response: Response) {
	return (response.headers.getSetCookie()[0] ?? "").split(";", 1)[0] ?? "";
}

async function rpc(
	path: string,
	json: unknown,
	cookie?: string,
): Promise<Response> {
	return fetch(`${baseUrl}/rpc/admin/settings/${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json }),
	});
}

type SnapshotPayload = {
	version: number;
	effectiveFromUtc: string;
	editable: {
		capacity: number;
		thresholds: {
			quietMaxPercent: number;
			moderateMaxPercent: number;
			busyMaxPercent: number;
		};
		weeklySchedule: Record<string, { open: string; close: string } | null>;
		businessDayBoundary: string;
		resetBufferMinutes: number;
	};
	operational: {
		timezone: string;
		pushIntervalSeconds: number;
		freshForSeconds: number;
		operationalStaleAfterSeconds: number;
		publicPollSeconds: number;
	};
};

async function readSettings(cookie: string): Promise<SnapshotPayload> {
	const response = await rpc("read", undefined, cookie);
	expect(response.status).toBe(200);
	const body = (await response.json()) as { json: SnapshotPayload };
	return body.json;
}

const editableForUpdate = {
	capacity: 220,
	thresholds: {
		quietMaxPercent: 30,
		moderateMaxPercent: 55,
		busyMaxPercent: 80,
	},
	weeklySchedule: {
		sun: { open: "00:00", close: "00:00" },
		mon: { open: "00:00", close: "00:00" },
		tue: { open: "00:00", close: "00:00" },
		wed: { open: "00:00", close: "00:00" },
		thu: { open: "00:00", close: "00:00" },
		fri: { open: "00:00", close: "00:00" },
		sat: { open: "00:00", close: "00:00" },
	},
	businessDayBoundary: "03:30",
	resetBufferMinutes: 45,
} as const;

beforeAll(async () => {
	const { createApp } = await import("./index");
	await database.execute("drop schema if exists drizzle cascade");
	await database.execute("drop schema if exists public cascade");
	await database.execute("create schema public");
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	// The migrations seed a baseline settings row and the current_state
	// singleton; the fixture replaces both so version identities and the tie
	// are exactly the ones this test reasons about.
	await database.delete(currentState);
	await database.delete(settingsVersions);

	// v1 and v2 share one effectiveFrom: the tie must resolve to the greater
	// version. v3 is future-dated and must stay invisible to every reader.
	const [v1] = await database
		.insert(settingsVersions)
		.values({
			capacity: 100,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
			...lockedOperational,
			...fixtureSchedule,
			effectiveFrom: new Date(OLDEST),
		})
		.returning({ version: settingsVersions.version });
	if (!v1) throw new Error("Settings fixture v1 was not created");
	const [v2] = await database
		.insert(settingsVersions)
		.values({
			capacity: 120,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
			...lockedOperational,
			...fixtureSchedule,
			effectiveFrom: new Date(OLDEST),
		})
		.returning({ version: settingsVersions.version });
	if (!v2) throw new Error("Settings fixture v2 was not created");
	await database.insert(settingsVersions).values({
		capacity: 999,
		quietMaxPercent: 25,
		moderateMaxPercent: 50,
		busyMaxPercent: 75,
		...lockedOperational,
		...fixtureSchedule,
		effectiveFrom: new Date(FUTURE),
	});
	fixtureVersions = { tieOlder: v1.version, tieCurrent: v2.version };

	const [device] = await database
		.insert(edgeDevices)
		.values({ name: "phase11-settings", tokenHash: "d".repeat(64) })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Device fixture was not created");
	deviceId = device.id;

	await database.insert(occupancyMinutes).values({
		deviceId,
		minuteStartUtc: new Date(HISTORIC_MINUTE),
		businessDay: "2026-07-01",
		count: 150,
		entries: 40,
		exits: 12,
		band: "packed",
		capacitySnapshot: 120,
		settingsVersion: v2.version,
		source: "live",
	});

	// A scheduled-reset issuance frozen to the close-owning version.
	const [resetCommand] = await database
		.insert(edgeCommands)
		.values({
			deviceId,
			type: "reset_zero",
			issuerClass: "system",
		})
		.returning({ id: edgeCommands.id });
	if (!resetCommand) throw new Error("Reset command fixture was not created");
	await database.insert(scheduledResetIssuances).values({
		businessDay: "2026-07-01",
		issuanceKey: "scheduled-reset:2026-07-01",
		settingsVersion: v2.version,
		scheduledClose: new Date("2026-07-01T21:00:00.000Z"),
		dueAt: new Date("2026-07-01T21:30:00.000Z"),
		commandId: resetCommand.id,
		issuedAt: new Date("2026-07-01T21:31:00.000Z"),
	});

	// Persisted current state: count 150 against capacity 120 is "packed".
	await database.insert(currentState).values({
		id: 1,
		currentCount: 150,
		band: "packed",
		source: "edge",
		lastPushReceivedAt: new Date(),
		lastEdgeReportedAt: new Date(),
		activeDeviceId: deviceId,
		settingsVersion: v2.version,
	});

	const ownerPassword = randomBytes(18).toString("base64url");
	const ownerEmail = `phase11-${randomUUID()}@fitway.example`;
	await authService.provisionOwner({
		email: ownerEmail,
		displayName: "Settings owner",
		password: ownerPassword,
	});
	const staffPin = `${randomInt(0, 1_000_000)}`.padStart(6, "0");
	await authService.setSharedStaffPin(staffPin);

	const app = createApp("test", runtime);
	await new Promise<void>((resolve, reject) => {
		server = serve(
			{ fetch: app.fetch, hostname: "127.0.0.1", port: 0 },
			(info) => {
				baseUrl = `http://127.0.0.1:${info.port}`;
				resolve();
			},
		);
		server.once("error", reject);
	});
	staffCookie = cookiePair(
		await fetch(`${baseUrl}/api/auth/staff/pin`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ pin: staffPin }),
		}),
	);
	ownerCookie = cookiePair(
		await fetch(`${baseUrl}/api/auth/owner/password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
		}),
	);
	const [ownerPrincipal] = await database
		.select({ id: authSchema.authPrincipals.id })
		.from(authSchema.authPrincipals)
		.where(eq(authSchema.authPrincipals.principalKind, "owner"));
	if (!ownerPrincipal) throw new Error("Owner principal is missing");
	ownerPrincipalId = ownerPrincipal.id;
});

afterAll(async () => {
	await new Promise<void>((resolve) => {
		server.close(() => resolve());
	});
	await pool.end();
});

describe("owner settings access control", () => {
	it("denies anonymous and staff callers on both leaves", async () => {
		expect((await rpc("read", undefined)).status).toBe(401);
		expect(
			(
				await rpc("update", {
					expectedVersion: fixtureVersions.tieCurrent,
					editable: editableForUpdate,
				})
			).status,
		).toBe(401);
		expect((await rpc("read", undefined, staffCookie)).status).toBe(403);
		expect(
			(
				await rpc(
					"update",
					{
						expectedVersion: fixtureVersions.tieCurrent,
						editable: editableForUpdate,
					},
					staffCookie,
				)
			).status,
		).toBe(403);
	});
});

describe("owner settings read", () => {
	it("resolves the current-effective version through the tie, ignoring the future row", async () => {
		const snapshot = await readSettings(ownerCookie);
		expect(snapshot.version).toBe(fixtureVersions.tieCurrent);
		expect(snapshot.effectiveFromUtc).toMatch(
			/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
		);
		expect(snapshot.effectiveFromUtc).toBe(OLDEST);
		expect(snapshot.editable.capacity).toBe(120);
		expect(snapshot.editable.businessDayBoundary).toBe("04:00");
		expect(snapshot.editable.weeklySchedule.fri).toEqual({
			open: "13:00",
			close: "01:00",
		});
		expect(snapshot.editable.weeklySchedule.sat).toBeNull();
		expect(snapshot.operational).toEqual(lockedOperational);
	});

	it("rejects unknown keys and malformed times over the real transport", async () => {
		const withExtraKey = {
			expectedVersion: fixtureVersions.tieCurrent,
			editable: { ...editableForUpdate, timezone: "Asia/Riyadh" },
		};
		expect((await rpc("update", withExtraKey, ownerCookie)).status).toBe(400);
		const withBadTime = {
			expectedVersion: fixtureVersions.tieCurrent,
			editable: {
				...editableForUpdate,
				weeklySchedule: {
					...editableForUpdate.weeklySchedule,
					sun: { open: "24:00", close: "00:00" },
				},
			},
		};
		expect((await rpc("update", withBadTime, ownerCookie)).status).toBe(400);
	});
});

describe("owner settings update", () => {
	it("appends one immediately effective snapshot and exactly one linked audit row", async () => {
		const before = await readSettings(ownerCookie);
		expect(before.version).toBe(fixtureVersions.tieCurrent);
		const response = await rpc(
			"update",
			{
				expectedVersion: fixtureVersions.tieCurrent,
				editable: editableForUpdate,
			},
			ownerCookie,
		);
		expect(response.status).toBe(200);
		const body = (await response.json()) as {
			json: { settings: SnapshotPayload; auditId: number };
		};
		expect(body.json.settings.version).toBeGreaterThan(
			fixtureVersions.tieCurrent,
		);
		appendedVersion = body.json.settings.version;
		expect(body.json.auditId).toBeGreaterThan(0);
		expect(body.json.settings.effectiveFromUtc).not.toBe(OLDEST);
		expect(body.json.settings.editable.businessDayBoundary).toBe("03:30");
		expect(body.json.settings.operational).toEqual(lockedOperational);

		const [appended] = await database
			.select()
			.from(settingsVersions)
			.where(eq(settingsVersions.version, body.json.settings.version));
		if (!appended) throw new Error("Appended settings row is missing");
		expect(appended.capacity).toBe(220);
		expect(appended.quietMaxPercent).toBe(30);
		expect(appended.moderateMaxPercent).toBe(55);
		expect(appended.busyMaxPercent).toBe(80);
		expect(appended.businessDayBoundary).toBe("03:30:00");
		expect(appended.resetBufferMinutes).toBe(45);
		// Every operational timing is copied from the locked row, not defaulted.
		expect(appended.timezone).toBe("Asia/Riyadh");
		expect(appended.pushIntervalSeconds).toBe(25);
		expect(appended.freshForSeconds).toBe(111);
		expect(appended.operationalStaleAfterSeconds).toBe(333);
		expect(appended.publicPollSeconds).toBe(77);
		expect(appended.scheduleSatOpen).toBe("00:00:00");
		expect(appended.scheduleSatClose).toBe("00:00:00");
		expect(appended.effectiveFrom.getTime()).toBe(appended.createdAt.getTime());
		expect(appended.createdBy).toBe(ownerPrincipalId);

		const auditRows = await database
			.select()
			.from(auditLog)
			.where(eq(auditLog.eventClass, "settings"));
		expect(auditRows).toHaveLength(1);
		const auditRow = auditRows[0];
		if (!auditRow) throw new Error("Audit row is missing");
		expect(auditRow.action).toBe("settings_updated");
		expect(auditRow.reason).toBeNull();
		expect(auditRow.actorPrincipalId).toBe(ownerPrincipalId);
		expect(auditRow.settingsVersion).toBe(body.json.settings.version);
		expect(auditRow.id).toBe(body.json.auditId);
	});

	it("makes the new version visible to the public and operational readers without a new push", async () => {
		const { createApp } = await import("./index");
		const app = createApp("test", runtime);
		const publicResponse = await app.request(PUBLIC_OCCUPANCY_INTERNAL_PATH);
		expect(publicResponse.status).toBe(200);
		const payload = (await publicResponse.json()) as Record<string, unknown>;
		// All days are 00:00-00:00 (equal times, a 24-hour session), so the gym
		// is open at any instant and the band is derived at response time.
		expect(["fresh", "stale"]).toContain(payload.freshness);
		expect(payload.count).toBe(150);
		expect(payload.band).toBe("busy");
		// The private Settings data must not leak through the public payload.
		expect(Object.keys(payload).sort()).toEqual([
			"band",
			"computedAt",
			"count",
			"freshUntil",
			"freshness",
			"lastUpdatedAt",
			"schemaVersion",
			"source",
			"timeZone",
			"trend",
		]);

		const staffSnapshotResponse = await fetch(
			`${baseUrl}/rpc/staff/operationalSnapshot`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json", Cookie: staffCookie },
				body: JSON.stringify({}),
			},
		);
		expect(staffSnapshotResponse.status).toBe(200);
		const staffBody = (await staffSnapshotResponse.json()) as {
			json: { occupancy: Record<string, unknown>; capacity: number | null };
		};
		expect(staffBody.json.occupancy.band).toBe("busy");
		expect(staffBody.json.capacity).toBe(220);
		expect(staffBody.json.occupancy).not.toHaveProperty("capacity");

		// The persisted projection is untouched by the Settings append.
		const [state] = await database.select().from(currentState);
		if (!state) throw new Error("Current state row is missing");
		expect(state.currentCount).toBe(150);
		expect(state.band).toBe("packed");
		expect(state.settingsVersion).toBe(fixtureVersions.tieCurrent);
	});

	it("keeps historical occupancy snapshots and reset issuance ownership frozen", async () => {
		const minutes = await database.select().from(occupancyMinutes);
		expect(minutes).toHaveLength(1);
		const minute = minutes[0];
		if (!minute) throw new Error("Historic minute is missing");
		expect(minute.capacitySnapshot).toBe(120);
		expect(minute.settingsVersion).toBe(fixtureVersions.tieCurrent);
		expect(minute.band).toBe("packed");

		const issuances = await database.select().from(scheduledResetIssuances);
		expect(issuances).toHaveLength(1);
		const issuance = issuances[0];
		if (!issuance) throw new Error("Reset issuance is missing");
		expect(issuance.settingsVersion).toBe(fixtureVersions.tieCurrent);
		expect(issuance.dueAt.toISOString()).toBe("2026-07-01T21:30:00.000Z");
	});

	it("rejects a stale expected version without writing either table", async () => {
		const beforeSettings = await database.select().from(settingsVersions);
		const beforeAudit = await database.select().from(auditLog);
		const response = await rpc(
			"update",
			{
				expectedVersion: fixtureVersions.tieCurrent,
				editable: editableForUpdate,
			},
			ownerCookie,
		);
		expect(response.status).toBe(409);
		const bodyText = JSON.stringify(await response.json());
		expect(bodyText).toContain("settings_version_conflict");
		expect(await database.select().from(settingsVersions)).toHaveLength(
			beforeSettings.length,
		);
		expect(await database.select().from(auditLog)).toHaveLength(
			beforeAudit.length,
		);
	});

	it("yields exactly one success and one conflict for two concurrent updates from one version", async () => {
		const beforeSettings = await database.select().from(settingsVersions);
		const beforeAudit = await database.select().from(auditLog);
		const results = await Promise.allSettled([
			rpc(
				"update",
				{ expectedVersion: appendedVersion, editable: editableForUpdate },
				ownerCookie,
			),
			rpc(
				"update",
				{
					expectedVersion: appendedVersion,
					editable: {
						...editableForUpdate,
						capacity: 200,
					},
				},
				ownerCookie,
			),
		]);
		const statuses = results.map((result) =>
			result.status === "fulfilled" ? result.value.status : "rejected",
		);
		expect(statuses.filter((status) => status === 200)).toHaveLength(1);
		expect(statuses.filter((status) => status === 409)).toHaveLength(1);
		// Exactly one settings row and one audit row were appended.
		expect(await database.select().from(settingsVersions)).toHaveLength(
			beforeSettings.length + 1,
		);
		expect(await database.select().from(auditLog)).toHaveLength(
			beforeAudit.length + 1,
		);
	});

	it("rolls back both tables when the settings insert fails", async () => {
		await database.execute(
			sql`create function p11_fail_settings_insert() returns trigger as $$ begin raise exception 'forced settings insert failure'; end $$ language plpgsql`,
		);
		await database.execute(
			sql`create trigger p11_fail_settings before insert on settings_versions for each row execute function p11_fail_settings_insert()`,
		);
		try {
			const beforeSettings = await database.select().from(settingsVersions);
			const beforeAudit = await database.select().from(auditLog);
			const current = await readSettings(ownerCookie);
			const response = await rpc(
				"update",
				{ expectedVersion: current.version, editable: editableForUpdate },
				ownerCookie,
			);
			expect(response.status).toBe(500);
			expect(await database.select().from(settingsVersions)).toHaveLength(
				beforeSettings.length,
			);
			expect(await database.select().from(auditLog)).toHaveLength(
				beforeAudit.length,
			);
		} finally {
			await database.execute(
				sql`drop trigger if exists p11_fail_settings on settings_versions`,
			);
			await database.execute(
				sql`drop function if exists p11_fail_settings_insert()`,
			);
		}
	});

	it("rolls back the settings append when the audit insert fails", async () => {
		await database.execute(
			sql`create function p11_fail_settings_audit() returns trigger as $$ begin if new.action::text = 'settings_updated' then raise exception 'forced audit insert failure'; end if; return new; end $$ language plpgsql`,
		);
		await database.execute(
			sql`create trigger p11_fail_settings_audit before insert on audit_log for each row execute function p11_fail_settings_audit()`,
		);
		try {
			const beforeSettings = await database.select().from(settingsVersions);
			const beforeAudit = await database.select().from(auditLog);
			const current = await readSettings(ownerCookie);
			const response = await rpc(
				"update",
				{ expectedVersion: current.version, editable: editableForUpdate },
				ownerCookie,
			);
			expect(response.status).toBe(500);
			expect(await database.select().from(settingsVersions)).toHaveLength(
				beforeSettings.length,
			);
			expect(await database.select().from(auditLog)).toHaveLength(
				beforeAudit.length,
			);
		} finally {
			await database.execute(
				sql`drop trigger if exists p11_fail_settings_audit on audit_log`,
			);
			await database.execute(
				sql`drop function if exists p11_fail_settings_audit()`,
			);
		}
	});

	it("fails with a generic internal error when no settings row is effective", async () => {
		await database.execute(
			sql`update settings_versions set effective_from = '2030-01-01T00:00:00Z'`,
		);
		const response = await rpc("read", undefined, ownerCookie);
		expect(response.status).toBe(500);
		const updateResponse = await rpc(
			"update",
			{
				expectedVersion: fixtureVersions.tieCurrent,
				editable: editableForUpdate,
			},
			ownerCookie,
		);
		expect(updateResponse.status).toBe(500);
	});
});
