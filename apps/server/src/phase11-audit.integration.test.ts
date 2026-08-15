/**
 * Phase 11 owner audit history over the real oRPC transport, real authentication,
 * and disposable Postgres.
 *
 * The fixture deliberately mixes two provenances: two corrections written through
 * the frozen Phase 5 command service, and hand-placed rows with controlled server
 * instants (including a deliberate timestamp tie, a system reset, and a null prior)
 * that a live clock cannot produce on demand.
 */
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import type { CommandService } from "@fitway/api/commands/service";
import { AuthService, type CanonicalAuthContext } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	auditLog,
	currentState,
	edgeCommands,
	edgeDevices,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { asc, eq } from "drizzle-orm";
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

const alwaysOpen = {
	scheduleSunOpen: "00:00",
	scheduleSunClose: "00:00",
	scheduleMonOpen: "00:00",
	scheduleMonClose: "00:00",
	scheduleTueOpen: "00:00",
	scheduleTueClose: "00:00",
	scheduleWedOpen: "00:00",
	scheduleWedClose: "00:00",
	scheduleThuOpen: "00:00",
	scheduleThuClose: "00:00",
	scheduleFriOpen: "00:00",
	scheduleFriClose: "00:00",
	scheduleSatOpen: "00:00",
	scheduleSatClose: "00:00",
} as const;

const TIE = "2026-08-10T09:15:30.250Z";
const OLDER = "2026-08-09T18:00:00.000Z";
const OLDEST = "2026-08-08T04:30:00.000Z";

type AuditEntryPayload = {
	id: number;
	action: string;
	actor: {
		principalId: string | null;
		kind: string;
		role: string | null;
		displayName: string | null;
	};
	priorValue: number | null;
	effectiveValue: number;
	requestedDelta: number | null;
	requestedValue: number | null;
	reason: string | null;
	createdAtUtc: string;
};
type AuditListPayload = {
	entries: AuditEntryPayload[];
	nextCursor: { createdAtUtc: string; id: number } | null;
};

let server: ReturnType<typeof serve>;
let baseUrl = "";
let staffCookie = "";
let ownerCookie = "";
let ownerEmail = "";
let deviceId = "";
let staffPrincipalId = "";
let ownerPrincipalId = "";
let commands: CommandService;
/** Newest-first identities the read surface must produce for the whole fixture. */
let expectedOrder: number[] = [];
let seededIds: Record<string, number> = {};

function cookiePair(response: Response) {
	return (response.headers.getSetCookie()[0] ?? "").split(";", 1)[0] ?? "";
}

async function rpcRaw(json: unknown, cookie?: string): Promise<Response> {
	return fetch(`${baseUrl}/rpc/admin/audit/list`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json }),
	});
}

async function list(json: unknown): Promise<AuditListPayload> {
	const response = await rpcRaw(json, ownerCookie);
	expect(response.status).toBe(200);
	const body = (await response.json()) as { json: AuditListPayload };
	return body.json;
}

async function actorFor(
	principalKind: "shared_staff" | "owner",
): Promise<CanonicalAuthContext> {
	const [principal] = await database
		.select()
		.from(authSchema.authPrincipals)
		.where(eq(authSchema.authPrincipals.principalKind, principalKind));
	if (!principal) throw new Error(`${principalKind} principal is missing`);
	return {
		principalId: principal.id,
		principalKind,
		role: principalKind === "owner" ? "owner" : "staff",
		sessionId: randomUUID(),
		expiresAt: new Date(Date.now() + 60_000),
		active: true,
	};
}

/** Places a command plus its audit row at an exact server instant. */
async function seedAuditRow(value: {
	issuerClass: "human" | "system";
	commandType: "set_count" | "reset_zero";
	targetValue: number | null;
	principalId: string | null;
	kind: "shared_staff" | "owner" | "system";
	role: "staff" | "owner" | null;
	action: "correction_delta" | "correction_absolute" | "reset";
	priorValue: number | null;
	requestedDelta: number | null;
	requestedValue: number | null;
	effectiveValue: number;
	reason: string | null;
	createdAt: string;
}): Promise<number> {
	const [command] = await database
		.insert(edgeCommands)
		.values({
			deviceId,
			type: value.commandType,
			targetValue: value.targetValue,
			issuerClass: value.issuerClass,
			issuedByPrincipalId: value.principalId,
			reason: value.reason,
		})
		.returning({ id: edgeCommands.id });
	if (!command) throw new Error("Command fixture was not created");
	const [row] = await database
		.insert(auditLog)
		.values({
			actorPrincipalId: value.principalId,
			actorPrincipalKind: value.kind,
			actorRole: value.role,
			commandId: command.id,
			commandIssuerClass: value.issuerClass,
			action: value.action,
			priorValue: value.priorValue,
			requestedDelta: value.requestedDelta,
			requestedValue: value.requestedValue,
			effectiveValue: value.effectiveValue,
			reason: value.reason,
			createdAt: new Date(value.createdAt),
		})
		.returning({ id: auditLog.id });
	if (!row) throw new Error("Audit fixture was not created");
	return row.id;
}

async function auditSnapshot() {
	return JSON.stringify(
		await database.select().from(auditLog).orderBy(asc(auditLog.id)),
	);
}

beforeAll(async () => {
	const { createApp } = await import("./index");
	const { createCommandServiceDatabase } = await import("./command-repository");
	await database.execute("drop schema if exists drizzle cascade");
	await database.execute("drop schema if exists public cascade");
	await database.execute("create schema public");
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await database.delete(settingsVersions);
	const [settings] = await database
		.insert(settingsVersions)
		.values({
			capacity: 100,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
			timezone: "Asia/Riyadh",
			businessDayBoundary: "04:00",
			effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
			...alwaysOpen,
		})
		.returning({ version: settingsVersions.version });
	if (!settings) throw new Error("Settings fixture was not created");
	const [device] = await database
		.insert(edgeDevices)
		.values({ name: "phase11-audit", tokenHash: "c".repeat(64) })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Device fixture was not created");
	deviceId = device.id;

	const ownerPassword = randomBytes(18).toString("base64url");
	ownerEmail = `phase11-${randomUUID()}@fitway.example`;
	await authService.provisionOwner({
		email: ownerEmail,
		displayName: "Real owner",
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

	const staffActor = await actorFor("shared_staff");
	const ownerActor = await actorFor("owner");
	staffPrincipalId = staffActor.principalId;
	ownerPrincipalId = ownerActor.principalId;

	seededIds = {
		oldestAbsoluteNullPrior: await seedAuditRow({
			issuerClass: "human",
			commandType: "set_count",
			targetValue: 0,
			principalId: ownerPrincipalId,
			kind: "owner",
			role: "owner",
			action: "correction_absolute",
			priorValue: null,
			requestedDelta: null,
			requestedValue: 0,
			effectiveValue: 0,
			reason: null,
			createdAt: OLDEST,
		}),
		systemReset: await seedAuditRow({
			issuerClass: "system",
			commandType: "reset_zero",
			targetValue: null,
			principalId: null,
			kind: "system",
			role: null,
			action: "reset",
			priorValue: 18,
			requestedDelta: null,
			requestedValue: 0,
			effectiveValue: 0,
			reason: "Scheduled post-close reset",
			createdAt: OLDER,
		}),
		tieStaffDelta: await seedAuditRow({
			issuerClass: "human",
			commandType: "set_count",
			targetValue: 0,
			principalId: staffPrincipalId,
			kind: "shared_staff",
			role: "staff",
			action: "correction_delta",
			priorValue: 2,
			requestedDelta: -9,
			requestedValue: null,
			effectiveValue: 0,
			reason: "Miscount at 60% capacity",
			createdAt: TIE,
		}),
		tieOwnerAbsolute: await seedAuditRow({
			issuerClass: "human",
			commandType: "set_count",
			targetValue: 12,
			principalId: ownerPrincipalId,
			kind: "owner",
			role: "owner",
			action: "correction_absolute",
			priorValue: 41,
			requestedDelta: null,
			requestedValue: 12,
			effectiveValue: 12,
			reason: "Recount after the door jam",
			createdAt: TIE,
		}),
	};

	// Two rows through the frozen Phase 5 append path, at the live server clock.
	commands = createCommandServiceDatabase(
		database as unknown as typeof import("@fitway/db").db,
	);
	await commands.issueCorrection(staffActor, {
		absolute: 30,
		reason: "  opening count  ",
	});
	// A delta needs an observed cloud count; the edge, not the command, supplies it.
	await database
		.update(currentState)
		.set({
			currentCount: 30,
			band: "quiet",
			source: "edge",
			lastPushReceivedAt: new Date(),
			lastEdgeReportedAt: new Date(),
			activeDeviceId: deviceId,
			settingsVersion: settings.version,
		})
		.where(eq(currentState.id, 1));
	await commands.issueCorrection(ownerActor, { delta: -4 });

	const rows = await database
		.select({ id: auditLog.id, createdAt: auditLog.createdAt })
		.from(auditLog);
	expectedOrder = [...rows]
		.sort(
			(left, right) =>
				right.createdAt.getTime() - left.createdAt.getTime() ||
				right.id - left.id,
		)
		.map((row) => row.id);
	expect(rows).toHaveLength(6);
}, 40_000);

afterAll(async () => {
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
	await pool.end();
});

describe.sequential("Phase 11 owner audit history transport", () => {
	it("answers 401 without a session and 403 for staff", async () => {
		expect((await rpcRaw({})).status).toBe(401);
		expect((await rpcRaw({}, "fitway_session=expired.invalid")).status).toBe(
			401,
		);
		expect((await rpcRaw({}, staffCookie)).status).toBe(403);
		expect((await rpcRaw({}, ownerCookie)).status).toBe(200);
	});

	it("rejects loose input rather than widening the page or the filters", async () => {
		for (const invalid of [
			{ page: 2 },
			{ limit: 0 },
			{ limit: 101 },
			{ limit: 2.5 },
			{ filters: { unknown: true } },
			{ filters: { actions: [] } },
			{ filters: { actions: ["settings_change"] } },
			{ filters: { priorValue: -1 } },
			{ filters: { reason: " untrimmed" } },
			{ filters: { reason: "x".repeat(241) } },
			{
				filters: {
					occurredFrom: "2026-08-31T00:00:00.000Z",
					occurredTo: "2026-08-01T00:00:00.000Z",
				},
			},
			{ cursor: { createdAtUtc: "2026-08-10T09:15:30Z", id: 1 } },
			{ cursor: { createdAtUtc: TIE, id: 0 } },
		]) {
			const response = await rpcRaw(invalid, ownerCookie);
			expect({ invalid, status: response.status }).toEqual({
				invalid,
				status: 400,
			});
		}
	});

	it("returns newest-first rows and breaks a timestamp tie by descending identity", async () => {
		const page = await list({ limit: 100 });
		expect(page.entries.map((entry) => entry.id)).toEqual(expectedOrder);
		expect(page.nextCursor).toBeNull();

		const tied = page.entries.filter((entry) => entry.createdAtUtc === TIE);
		expect(tied.map((entry) => entry.id)).toEqual([
			seededIds.tieOwnerAbsolute,
			seededIds.tieStaffDelta,
		]);
		expect(seededIds.tieOwnerAbsolute).toBeGreaterThan(
			seededIds.tieStaffDelta ?? 0,
		);
	});

	it("walks stable keyset pages with no duplicate and no skipped row", async () => {
		const walked: number[] = [];
		let cursor: AuditListPayload["nextCursor"] = null;
		let pages = 0;
		do {
			const page: AuditListPayload = await list({ limit: 2, cursor });
			expect(page.entries.length).toBeLessThanOrEqual(2);
			walked.push(...page.entries.map((entry) => entry.id));
			cursor = page.nextCursor;
			pages += 1;
			expect(pages).toBeLessThanOrEqual(6);
		} while (cursor);

		expect(walked).toEqual(expectedOrder);
		expect(new Set(walked).size).toBe(walked.length);
		expect(pages).toBe(3);
	});

	it("applies every one of the six filters, including a missing prior", async () => {
		const staffOnly = await list({
			limit: 100,
			filters: { actorPrincipalId: staffPrincipalId },
		});
		expect(staffOnly.entries.length).toBeGreaterThanOrEqual(2);
		expect(
			staffOnly.entries.every(
				(entry) => entry.actor.principalId === staffPrincipalId,
			),
		).toBe(true);

		const systemOnly = await list({
			limit: 100,
			filters: { actorKind: "system" },
		});
		expect(systemOnly.entries.map((entry) => entry.id)).toEqual([
			seededIds.systemReset,
		]);

		const resets = await list({ limit: 100, filters: { actions: ["reset"] } });
		expect(resets.entries.map((entry) => entry.action)).toEqual(["reset"]);
		const corrections = await list({
			limit: 100,
			filters: { actions: ["correction_delta", "correction_absolute"] },
		});
		expect(corrections.entries).toHaveLength(5);

		const missingPrior = await list({
			limit: 100,
			filters: { priorValue: null },
		});
		// Both the seeded row and the real absolute correction issued before any
		// edge observation have no recorded prior. Null is a state, not a zero.
		expect(missingPrior.entries.map((entry) => entry.id)).toContain(
			seededIds.oldestAbsoluteNullPrior,
		);
		expect(
			missingPrior.entries.every((entry) => entry.priorValue === null),
		).toBe(true);
		const zeroPrior = await list({ limit: 100, filters: { priorValue: 0 } });
		expect(zeroPrior.entries).toHaveLength(0);
		for (const id of missingPrior.entries.map((entry) => entry.id)) {
			expect(zeroPrior.entries.map((entry) => entry.id)).not.toContain(id);
		}

		const exactPrior = await list({ limit: 100, filters: { priorValue: 41 } });
		expect(exactPrior.entries.map((entry) => entry.id)).toEqual([
			seededIds.tieOwnerAbsolute,
		]);
		const exactEffective = await list({
			limit: 100,
			filters: { effectiveValue: 12 },
		});
		expect(exactEffective.entries.map((entry) => entry.id)).toEqual([
			seededIds.tieOwnerAbsolute,
		]);

		const range = await list({
			limit: 100,
			filters: {
				occurredFrom: OLDER,
				occurredTo: "2026-08-10T09:15:30.250Z",
			},
		});
		expect(range.entries.map((entry) => entry.id).sort()).toEqual(
			[
				seededIds.systemReset,
				seededIds.tieStaffDelta,
				seededIds.tieOwnerAbsolute,
			].sort(),
		);

		const reasonMatch = await list({ limit: 100, filters: { reason: "DOOR" } });
		expect(reasonMatch.entries.map((entry) => entry.id)).toEqual([
			seededIds.tieOwnerAbsolute,
		]);
		const noReason = await list({ limit: 100, filters: { reason: null } });
		expect(noReason.entries.map((entry) => entry.id)).toContain(
			seededIds.oldestAbsoluteNullPrior,
		);
		expect(noReason.entries.every((entry) => entry.reason === null)).toBe(true);
		// "%" is a literal character in a reason, not a wildcard: only the row whose
		// reason actually contains a percent sign matches.
		const patternLiteral = await list({ limit: 100, filters: { reason: "%" } });
		expect(patternLiteral.entries.map((entry) => entry.id)).toEqual([
			seededIds.tieStaffDelta,
		]);
		expect(patternLiteral.entries[0]?.reason).toContain("60% capacity");
	});

	it("labels the real shared staff and owner principals and never a synthetic identity", async () => {
		const page = await list({ limit: 100 });
		const staffEntry = page.entries.find(
			(entry) => entry.actor.kind === "shared_staff",
		);
		const ownerEntry = page.entries.find(
			(entry) => entry.actor.kind === "owner",
		);
		const systemEntry = page.entries.find(
			(entry) => entry.actor.kind === "system",
		);
		expect(staffEntry?.actor).toEqual({
			principalId: staffPrincipalId,
			kind: "shared_staff",
			role: "staff",
			displayName: "Shared front desk",
		});
		expect(ownerEntry?.actor).toEqual({
			principalId: ownerPrincipalId,
			kind: "owner",
			role: "owner",
			displayName: "Real owner",
		});
		expect(systemEntry?.actor).toEqual({
			principalId: null,
			kind: "system",
			role: null,
			displayName: null,
		});
	});

	it("reflects the frozen Phase 5 append path without altering its rows", async () => {
		const before = await auditSnapshot();
		const page = await list({ limit: 100 });

		const written = page.entries.filter(
			(entry) => !Object.values(seededIds).includes(entry.id),
		);
		expect(written).toHaveLength(2);
		const absolute = written.find(
			(entry) => entry.action === "correction_absolute",
		);
		const delta = written.find((entry) => entry.action === "correction_delta");
		expect(absolute?.requestedValue).toBe(absolute?.effectiveValue);
		expect(absolute?.reason).toBe("opening count");
		expect(delta?.requestedDelta).toBe(-4);
		expect(delta?.priorValue).toBe(30);
		expect(delta?.effectiveValue).toBe(26);
		expect(delta?.reason).toBeNull();

		await list({ limit: 1 });
		await list({ limit: 100, filters: { actions: ["reset"] } });
		expect(await auditSnapshot()).toBe(before);
	});

	it("emits an exact non-sensitive shape with no credential or session data", async () => {
		const response = await rpcRaw({ limit: 100 }, ownerCookie);
		const text = await response.text();
		const payload = (JSON.parse(text) as { json: AuditListPayload }).json;

		for (const entry of payload.entries) {
			expect(Object.keys(entry).sort()).toEqual(
				[
					"action",
					"actor",
					"createdAtUtc",
					"effectiveValue",
					"id",
					"priorValue",
					"reason",
					"requestedDelta",
					"requestedValue",
				].sort(),
			);
			expect(Object.keys(entry.actor).sort()).toEqual(
				["displayName", "kind", "principalId", "role"].sort(),
			);
			expect(entry.createdAtUtc).toMatch(
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
			);
		}
		expect(text).not.toContain(ownerEmail);
		expect(text).not.toMatch(/@/);
		expect(text).not.toMatch(/pinHash|pin_hash|passwordHash|password_salt/i);
		expect(text).not.toMatch(/sessionId|session_id|token|credential/i);
		expect(text).not.toMatch(/commandId|command_id|issuerClass/i);

		const [credential] = await database
			.select()
			.from(authSchema.authStaffCredentials);
		expect(credential?.pinHash).toBeTruthy();
		expect(text).not.toContain(credential?.pinHash ?? "unreachable");
	});
});
