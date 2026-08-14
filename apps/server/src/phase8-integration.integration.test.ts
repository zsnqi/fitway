import path from "node:path";
import { createCompositeCronRunner } from "@fitway/api/cron/runner";
import { createScheduledResetRunner } from "@fitway/api/reset/runner";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	alertLog,
	auditLog,
	currentState,
	edgeCommands,
	edgeCurrentHealth,
	edgeDevices,
	edgeHealthLog,
	occupancyMinutes,
	scheduledResetIssuances,
	settingsVersions,
} from "@fitway/db/schema/application";
import { asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { createRetentionRepository } from "./retention-repository";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});
const cronSecret = process.env.CRON_SECRET;
if (!cronSecret || cronSecret.length < 32) {
	throw new Error(
		"CRON_SECRET must be supplied to the Phase 8 integration test",
	);
}

const pool = new Pool({ connectionString });
const database = drizzle(pool, { schema: applicationSchema });
const repository = createRetentionRepository(
	database as typeof import("@fitway/db").db,
);

/**
 * Retention is proved here rather than in the unit suite because every property
 * below is enforced by PostgreSQL: the `alert_log` self-referencing foreign key,
 * real `timestamptz` comparison at millisecond distance, and the fact that a
 * repeat run touches nothing. The stubbed-driver unit suite enforces no
 * constraint and can prove none of it.
 */
const runAt = new Date("2026-08-14T12:00:00.000Z");
const laterSameDay = new Date("2026-08-14T23:59:59.999Z");
const cutoff = new Date("2025-08-14T00:00:00.000Z");
const DAY = 86_400_000;

/** An instant relative to the retention cutoff. */
function at(offsetMs: number) {
	return new Date(cutoff.getTime() + offsetMs);
}

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

let deviceId = "";
let pinnedParentId = 0;
let retainedRecoveryId = 0;
let expiredParentId = 0;
let expiredRecoveryId = 0;
let boundaryAlertId = 0;
let expiredAlertId = 0;
let boundaryAuditId = 0;
let boundaryHealthId = 0;

/** Every table retention must never touch, in a stable order. */
async function untouchedTables() {
	return JSON.stringify({
		occupancy: await database
			.select()
			.from(occupancyMinutes)
			.orderBy(asc(occupancyMinutes.minuteStartUtc)),
		settings: await database
			.select()
			.from(settingsVersions)
			.orderBy(asc(settingsVersions.version)),
		current: await database
			.select()
			.from(currentState)
			.orderBy(asc(currentState.id)),
		devices: await database
			.select()
			.from(edgeDevices)
			.orderBy(asc(edgeDevices.id)),
		commands: await database
			.select()
			.from(edgeCommands)
			.orderBy(asc(edgeCommands.id)),
		issuances: await database
			.select()
			.from(scheduledResetIssuances)
			.orderBy(asc(scheduledResetIssuances.businessDay)),
	});
}

async function retentionTables() {
	return JSON.stringify({
		audit: await database.select().from(auditLog).orderBy(asc(auditLog.id)),
		health: await database
			.select()
			.from(edgeHealthLog)
			.orderBy(asc(edgeHealthLog.id)),
		alerts: await database.select().from(alertLog).orderBy(asc(alertLog.id)),
	});
}

async function alertIds() {
	const rows = await database
		.select({ id: alertLog.id })
		.from(alertLog)
		.orderBy(asc(alertLog.id));
	return rows.map((row) => row.id);
}

beforeAll(async () => {
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
			pushIntervalSeconds: 20,
			freshForSeconds: 90,
			operationalStaleAfterSeconds: 180,
			publicPollSeconds: 60,
			effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
			...alwaysOpen,
		})
		.returning({ version: settingsVersions.version });
	if (!settings) throw new Error("Retention settings were not created");

	const [device] = await database
		.insert(edgeDevices)
		.values({ name: "phase-8-retention", tokenHash: "b".repeat(64) })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Retention device was not created");
	deviceId = device.id;

	// audit_log is a child of edge_commands through a composite key, so each
	// audit row needs its own command. edge_commands is itself not a retention
	// target, so that key is never stressed by a retention run.
	const commands = await database
		.insert(edgeCommands)
		.values([
			// `pending` is the one status the lifecycle check allows without
			// delivery/apply timestamps; the command's own lifecycle is irrelevant
			// to retention, which never reads or writes this table.
			{
				deviceId,
				type: "reset_zero",
				status: "pending",
				issuerClass: "system",
			},
			{
				deviceId,
				type: "reset_zero",
				status: "pending",
				issuerClass: "system",
			},
			{
				deviceId,
				type: "reset_zero",
				status: "pending",
				issuerClass: "system",
			},
		])
		.returning({ id: edgeCommands.id });
	const [expiredCommand, boundaryCommand, issuanceCommand] = commands;
	if (!expiredCommand || !boundaryCommand || !issuanceCommand) {
		throw new Error("Retention commands were not created");
	}

	const systemActor = {
		actorPrincipalId: null,
		actorPrincipalKind: "system",
		actorRole: null,
		commandIssuerClass: "system",
		action: "reset",
		priorValue: 5,
		requestedDelta: null,
		requestedValue: 0,
		effectiveValue: 0,
	} as const;
	const audits = await database
		.insert(auditLog)
		.values([
			{ ...systemActor, commandId: expiredCommand.id, createdAt: at(-1) },
			{ ...systemActor, commandId: boundaryCommand.id, createdAt: at(0) },
		])
		.returning({ id: auditLog.id });
	if (audits.length !== 2 || !audits[1]) {
		throw new Error("Retention audit rows were not created");
	}
	boundaryAuditId = audits[1].id;

	const health = await database
		.insert(edgeHealthLog)
		.values([
			{ deviceId, transitionType: "offline", occurredAt: at(-1) },
			{
				deviceId,
				transitionType: "online",
				processStatus: "ok",
				cameraStatus: "ok",
				feedStatus: "ok",
				occurredAt: at(0),
			},
		])
		.returning({ id: edgeHealthLog.id });
	if (health.length !== 2 || !health[1]) {
		throw new Error("Retention health rows were not created");
	}
	boundaryHealthId = health[1].id;

	// Two alert/recovery pairs. The first recovers *after* the cutoff, so its
	// expired parent is pinned. The second recovers before it, so parent and
	// child expire together and must go in the same statement.
	const [pinnedParent] = await database
		.insert(alertLog)
		.values({
			deviceId,
			condition: "camera_failure",
			noticeKind: "alert",
			conditionStartedAt: at(-10 * DAY),
			sentAt: at(-10 * DAY),
			deliveryOutcome: "delivered",
		})
		.returning({ id: alertLog.id });
	const [expiredParent] = await database
		.insert(alertLog)
		.values({
			deviceId,
			condition: "feed_failure",
			noticeKind: "alert",
			conditionStartedAt: at(-20 * DAY),
			sentAt: at(-20 * DAY),
			deliveryOutcome: "delivered",
		})
		.returning({ id: alertLog.id });
	if (!pinnedParent || !expiredParent) {
		throw new Error("Retention alert parents were not created");
	}
	pinnedParentId = pinnedParent.id;
	expiredParentId = expiredParent.id;

	const recoveries = await database
		.insert(alertLog)
		.values([
			{
				deviceId,
				condition: "camera_failure",
				noticeKind: "recovery",
				conditionStartedAt: at(-10 * DAY),
				sentAt: at(DAY),
				deliveryOutcome: "delivered",
				recoveryOfAlertId: pinnedParentId,
			},
			{
				deviceId,
				condition: "feed_failure",
				noticeKind: "recovery",
				conditionStartedAt: at(-20 * DAY),
				sentAt: at(-15 * DAY),
				deliveryOutcome: "delivered",
				recoveryOfAlertId: expiredParentId,
			},
		])
		.returning({ id: alertLog.id });
	const [retainedRecovery, expiredRecovery] = recoveries;
	if (!retainedRecovery || !expiredRecovery) {
		throw new Error("Retention recoveries were not created");
	}
	retainedRecoveryId = retainedRecovery.id;
	expiredRecoveryId = expiredRecovery.id;

	const unlinked = await database
		.insert(alertLog)
		.values([
			{
				deviceId,
				condition: "stale_push",
				noticeKind: "alert",
				conditionStartedAt: at(-1),
				sentAt: at(-1),
				deliveryOutcome: "failed",
			},
			{
				deviceId,
				condition: "process_failure",
				noticeKind: "alert",
				conditionStartedAt: at(0),
				sentAt: at(0),
				deliveryOutcome: "claimed",
			},
		])
		.returning({ id: alertLog.id });
	const [expiredAlert, boundaryAlert] = unlinked;
	if (!expiredAlert || !boundaryAlert) {
		throw new Error("Retention unlinked alerts were not created");
	}
	expiredAlertId = expiredAlert.id;
	boundaryAlertId = boundaryAlert.id;

	await database.insert(occupancyMinutes).values({
		deviceId,
		minuteStartUtc: new Date("2026-08-01T10:00:00.000Z"),
		businessDay: "2026-08-01",
		count: 5,
		entries: 5,
		exits: 0,
		band: "quiet",
		capacitySnapshot: 100,
		settingsVersion: settings.version,
		source: "live",
	});
	await database.insert(scheduledResetIssuances).values({
		businessDay: "2026-08-01",
		issuanceKey: "scheduled-reset:2026-08-01",
		settingsVersion: settings.version,
		scheduledClose: new Date("2026-08-01T21:00:00.000Z"),
		dueAt: new Date("2026-08-01T21:30:00.000Z"),
		commandId: issuanceCommand.id,
		commandIssuerClass: "system",
		commandType: "reset_zero",
		issuedAt: new Date("2026-08-01T21:30:00.000Z"),
	});
	await database.update(currentState).set({
		currentCount: 5,
		band: "quiet",
		source: "edge",
		lastPushReceivedAt: new Date("2026-08-01T10:00:00.000Z"),
		lastEdgeReportedAt: new Date("2026-08-01T09:59:59.000Z"),
		activeDeviceId: deviceId,
		settingsVersion: settings.version,
	});
}, 30_000);

afterAll(async () => pool.end());

describe("Phase 8 retention cleanup", () => {
	it("deletes only rows strictly older than the day-quantized cutoff, and keeps any parent a retained recovery still references", async () => {
		expect(await alertIds()).toHaveLength(6);
		const untouchedBefore = await untouchedTables();

		await repository.purgeExpired(runAt);

		// audit_log and edge_health_log are referenced by no other table, so the
		// boundary row alone survives in each.
		expect(
			(await database.select({ id: auditLog.id }).from(auditLog)).map(
				(row) => row.id,
			),
		).toEqual([boundaryAuditId]);
		expect(
			(await database.select({ id: edgeHealthLog.id }).from(edgeHealthLog)).map(
				(row) => row.id,
			),
		).toEqual([boundaryHealthId]);

		const survivors = await alertIds();
		// Pinned: sent 10 days before the cutoff, but its recovery is retained.
		expect(survivors).toContain(pinnedParentId);
		expect(survivors).toContain(retainedRecoveryId);
		// Exactly at the cutoff is retained; one millisecond older is not.
		expect(survivors).toContain(boundaryAlertId);
		expect(survivors).not.toContain(expiredAlertId);
		// An expired parent and its equally expired recovery go together, in one
		// statement, because the self-key is checked at end of statement.
		expect(survivors).not.toContain(expiredParentId);
		expect(survivors).not.toContain(expiredRecoveryId);
		expect(survivors).toHaveLength(3);

		// The pinned parent survived intact rather than being nulled or orphaned.
		const [pinned] = await database
			.select()
			.from(alertLog)
			.orderBy(asc(alertLog.id))
			.limit(1);
		expect(pinned?.id).toBe(pinnedParentId);
		expect(pinned?.noticeKind).toBe("alert");
		expect(pinned?.recoveryOfAlertId).toBeNull();

		expect(await untouchedTables()).toBe(untouchedBefore);
	});

	it("changes nothing on a second or later run in the same UTC day", async () => {
		const retentionBefore = await retentionTables();
		const untouchedBefore = await untouchedTables();

		await repository.purgeExpired(runAt);
		await repository.purgeExpired(laterSameDay);

		// The cutoff is quantized to the UTC day, so it is constant from the day's
		// first invocation to its last. Every later minutely run is inherently a
		// no-op with no gate, no marker row, and no in-process state.
		expect(await retentionTables()).toBe(retentionBefore);
		expect(await untouchedTables()).toBe(untouchedBefore);
	});

	it("expires the pinned parent once its recovery also falls out of the window", async () => {
		// The recovery was sent one day after the original cutoff, so a run two
		// days later expires it and unpins its parent. This proves the guard is a
		// genuine dependency on the recovery's own age rather than a permanent
		// exemption for parent rows. The boundary alert expires on the same
		// advance, so nothing is left.
		await repository.purgeExpired(new Date(runAt.getTime() + 2 * DAY));

		const survivors = await alertIds();
		expect(survivors).not.toContain(pinnedParentId);
		expect(survivors).not.toContain(retainedRecoveryId);
		expect(survivors).not.toContain(boundaryAlertId);
		expect(survivors).toEqual([]);
	});
});

/**
 * The composed cron seam, exercised through the real authenticated route.
 *
 * Everything below runs the production composition from `createApp`: the real
 * alert repository, the real Telegram notifier, the real retention repository,
 * and the real scheduled-reset runner against disposable PostgreSQL. The single
 * substitution is `globalThis.fetch`, which the injected bounded fetch calls —
 * no test may open an ambient socket to Telegram.
 */

/** Riyadh is UTC+3, so the 08:00-22:00 local schedule is 05:00-19:00 UTC. */
const OPEN_HOURS = new Date("2026-08-14T12:00:00.000Z");
/** Exactly the 30-minute pre-open window before 05:00 UTC. */
const PRE_OPEN_BOUNDARY = new Date("2026-08-14T04:30:00.000Z");
/** Three hours before opening: outside the window, so alerts are suppressed. */
const DEEP_CLOSED = new Date("2026-08-14T02:00:00.000Z");
const EXPIRED_AUDIT_AT = new Date("2024-01-01T00:00:00.000Z");
const RETAINED_AUDIT_AT = new Date("2026-08-01T00:00:00.000Z");

const businessHours = {
	scheduleSunOpen: "08:00",
	scheduleSunClose: "22:00",
	scheduleMonOpen: "08:00",
	scheduleMonClose: "22:00",
	scheduleTueOpen: "08:00",
	scheduleTueClose: "22:00",
	scheduleWedOpen: "08:00",
	scheduleWedClose: "22:00",
	scheduleThuOpen: "08:00",
	scheduleThuClose: "22:00",
	scheduleFriOpen: "08:00",
	scheduleFriClose: "22:00",
	scheduleSatOpen: "08:00",
	scheduleSatClose: "22:00",
} as const;

type CronFixture = {
	deviceId: string;
	settingsVersion: number;
	expiredAuditId: number;
	retainedAuditId: number;
};

let cronFixture: CronFixture;
let telegramFetch: ReturnType<typeof vi.spyOn>;

function telegramOk() {
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "content-type": "application/json" },
	});
}

async function seedCronFixture(options: {
	now: Date;
	priorOfflineAt?: Date;
	priorAlertSentAt?: Date;
}): Promise<CronFixture> {
	// Children first, then the rows they reference. current_state is a checked
	// singleton, so its device and settings references are cleared together.
	await database.update(currentState).set({
		currentCount: null,
		band: null,
		source: null,
		lastPushReceivedAt: null,
		lastEdgeReportedAt: null,
		activeDeviceId: null,
		settingsVersion: null,
	});
	await database.delete(occupancyMinutes);
	await database.delete(auditLog);
	await database.delete(scheduledResetIssuances);
	await database.delete(alertLog);
	await database.delete(edgeHealthLog);
	await database.delete(edgeCurrentHealth);
	await database.delete(edgeCommands);
	await database.delete(edgeDevices);
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
			resetBufferMinutes: 30,
			pushIntervalSeconds: 20,
			freshForSeconds: 90,
			operationalStaleAfterSeconds: 180,
			publicPollSeconds: 60,
			effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
			...businessHours,
		})
		.returning({ version: settingsVersions.version });
	if (!settings) throw new Error("Cron settings were not created");

	const [device] = await database
		.insert(edgeDevices)
		.values({ name: "phase-8-cron", tokenHash: "c".repeat(64) })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Cron device was not created");

	// A stale projection: the last accepted push is an hour old against a
	// 180-second staleness window, so `stale_push` is the active condition.
	const lastPushAt = new Date(options.now.getTime() - 3_600_000);
	await database.insert(edgeCurrentHealth).values({
		deviceId: device.id,
		sequence: 1,
		processStatus: "ok",
		cameraStatus: "ok",
		feedStatus: "ok",
		edgeObservedAt: lastPushAt,
		receivedAt: lastPushAt,
	});
	await database.update(currentState).set({
		currentCount: 5,
		band: "quiet",
		source: "edge",
		lastPushReceivedAt: lastPushAt,
		lastEdgeReportedAt: lastPushAt,
		activeDeviceId: device.id,
		settingsVersion: settings.version,
	});

	if (options.priorOfflineAt) {
		await database.insert(edgeHealthLog).values({
			deviceId: device.id,
			transitionType: "offline",
			processStatus: "ok",
			cameraStatus: "ok",
			feedStatus: "ok",
			occurredAt: options.priorOfflineAt,
		});
	}
	if (options.priorAlertSentAt) {
		await database.insert(alertLog).values({
			deviceId: device.id,
			condition: "stale_push",
			noticeKind: "alert",
			conditionStartedAt: options.priorAlertSentAt,
			sentAt: options.priorAlertSentAt,
			deliveryOutcome: "delivered",
		});
	}

	// audit_log is a child of edge_commands through a composite key, so each
	// retention row needs its own command.
	const commands = await database
		.insert(edgeCommands)
		.values([
			{
				deviceId: device.id,
				type: "reset_zero",
				status: "pending",
				issuerClass: "system",
			},
			{
				deviceId: device.id,
				type: "reset_zero",
				status: "pending",
				issuerClass: "system",
			},
		])
		.returning({ id: edgeCommands.id });
	const [expiredCommand, retainedCommand] = commands;
	if (!expiredCommand || !retainedCommand) {
		throw new Error("Cron commands were not created");
	}
	const systemActor = {
		actorPrincipalId: null,
		actorPrincipalKind: "system",
		actorRole: null,
		commandIssuerClass: "system",
		action: "reset",
		priorValue: 5,
		requestedDelta: null,
		requestedValue: 0,
		effectiveValue: 0,
	} as const;
	const audits = await database
		.insert(auditLog)
		.values([
			{
				...systemActor,
				commandId: expiredCommand.id,
				createdAt: EXPIRED_AUDIT_AT,
			},
			{
				...systemActor,
				commandId: retainedCommand.id,
				createdAt: RETAINED_AUDIT_AT,
			},
		])
		.returning({ id: auditLog.id });
	const [expiredAudit, retainedAudit] = audits;
	if (!expiredAudit || !retainedAudit) {
		throw new Error("Cron audit rows were not created");
	}

	return {
		deviceId: device.id,
		settingsVersion: settings.version,
		expiredAuditId: expiredAudit.id,
		retainedAuditId: retainedAudit.id,
	};
}

async function invokeCron(options: {
	now: Date;
	runner?: { run: () => Promise<unknown> };
}) {
	const { createApp } = await import("./index");
	const app = createApp("test", undefined, () => options.now, options.runner);
	return app.fetch(
		new Request("http://localhost/cron", {
			headers: { Authorization: `Bearer ${cronSecret}` },
		}),
	);
}

async function healthSurfaces() {
	return JSON.stringify({
		current: await database
			.select()
			.from(currentState)
			.orderBy(asc(currentState.id)),
		projection: await database
			.select()
			.from(edgeCurrentHealth)
			.orderBy(asc(edgeCurrentHealth.deviceId)),
		transitions: await database
			.select()
			.from(edgeHealthLog)
			.orderBy(asc(edgeHealthLog.id)),
	});
}

async function alertRows() {
	return database.select().from(alertLog).orderBy(asc(alertLog.id));
}

describe("Phase 8 composed cron seam", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("evaluates alerts, issues the scheduled reset, and purges retention in one authenticated invocation", async () => {
		cronFixture = await seedCronFixture({ now: PRE_OPEN_BOUNDARY });
		telegramFetch = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(telegramOk());

		const response = await invokeCron({ now: PRE_OPEN_BOUNDARY });

		expect(response.status).toBe(200);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(await response.json()).toEqual({ status: "ok" });

		// Alerting: exactly one claimed row inside the transaction and one
		// delivered outcome row after it, for the one active condition.
		const alerts = await alertRows();
		expect(alerts).toHaveLength(2);
		expect(alerts.map((row) => row.deliveryOutcome)).toEqual([
			"claimed",
			"delivered",
		]);
		expect(new Set(alerts.map((row) => row.condition))).toEqual(
			new Set(["stale_push"]),
		);
		expect(new Set(alerts.map((row) => row.noticeKind))).toEqual(
			new Set(["alert"]),
		);

		// Delivery: exactly one bounded outbound call, to Telegram only.
		expect(telegramFetch).toHaveBeenCalledTimes(1);
		const [endpoint, init] = telegramFetch.mock.calls[0] as [
			string,
			RequestInit,
		];
		expect(endpoint.startsWith("https://api.telegram.org/bot")).toBe(true);
		// The carried-forward Stage A finding: a hung delivery must not be able to
		// consume the whole invocation.
		expect(init.signal).toBeInstanceOf(AbortSignal);

		// Health: one connection transition, recorded regardless of the schedule.
		const transitions = await database
			.select()
			.from(edgeHealthLog)
			.orderBy(asc(edgeHealthLog.id));
		expect(transitions).toHaveLength(1);
		expect(transitions[0]?.transitionType).toBe("offline");

		// Scheduled reset: the previous business day closed at 19:00 UTC and its
		// 30-minute buffer elapsed before this invocation.
		const issuances = await database
			.select()
			.from(scheduledResetIssuances)
			.orderBy(asc(scheduledResetIssuances.businessDay));
		expect(issuances).toHaveLength(1);
		expect(issuances[0]?.businessDay).toBe("2026-08-13");

		// Retention: the same invocation purged the expired audit row and kept the
		// one inside the window.
		const auditIds = (
			await database.select({ id: auditLog.id }).from(auditLog)
		).map((row) => row.id);
		expect(auditIds).not.toContain(cronFixture.expiredAuditId);
		expect(auditIds).toContain(cronFixture.retainedAuditId);
	});

	it("suppresses a closed-hour failure and escalates it exactly at the pre-open boundary", async () => {
		cronFixture = await seedCronFixture({ now: DEEP_CLOSED });
		telegramFetch = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(telegramOk());

		const closed = await invokeCron({ now: DEEP_CLOSED });

		expect(closed.status).toBe(200);
		// Three hours before opening is outside the 30-minute window, so nothing is
		// sent and nothing is claimed.
		expect(await alertRows()).toEqual([]);
		expect(telegramFetch).not.toHaveBeenCalled();
		// The health transition is not schedule-gated and is still recorded.
		expect(await database.select().from(edgeHealthLog)).toHaveLength(1);

		const escalated = await invokeCron({ now: PRE_OPEN_BOUNDARY });

		expect(escalated.status).toBe(200);
		const alerts = await alertRows();
		expect(alerts).toHaveLength(2);
		expect(alerts.map((row) => row.deliveryOutcome)).toEqual([
			"claimed",
			"delivered",
		]);
		expect(alerts[0]?.sentAt.toISOString()).toBe(
			PRE_OPEN_BOUNDARY.toISOString(),
		);
		expect(telegramFetch).toHaveBeenCalledTimes(1);
		// The offline transition was already recorded, so the escalation adds none.
		expect(await database.select().from(edgeHealthLog)).toHaveLength(1);
	});

	it("records a delivery failure durably and leaves device health byte-identical", async () => {
		// A prior offline transition and a prior alert older than the 30-minute
		// re-alert interval: the invocation therefore emits a re-alert and no
		// health transition at all, so every health surface must come out unchanged.
		cronFixture = await seedCronFixture({
			now: OPEN_HOURS,
			priorOfflineAt: new Date(OPEN_HOURS.getTime() - 3_600_000),
			priorAlertSentAt: new Date(OPEN_HOURS.getTime() - 3_600_000),
		});
		telegramFetch = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response("upstream failure", { status: 500 }));
		const healthBefore = await healthSurfaces();

		const response = await invokeCron({ now: OPEN_HOURS });

		// A transport outage is a durable `failed` row, not a failing cron: it must
		// never turn into a 500 that would also mask the scheduled reset.
		expect(response.status).toBe(200);
		const alerts = await alertRows();
		expect(alerts).toHaveLength(3);
		expect(alerts.map((row) => row.deliveryOutcome)).toEqual([
			"delivered",
			"claimed",
			"failed",
		]);
		expect(telegramFetch).toHaveBeenCalledTimes(1);

		expect(await healthSurfaces()).toBe(healthBefore);
	});

	it("still issues the scheduled reset when alert evaluation faults", async () => {
		cronFixture = await seedCronFixture({ now: PRE_OPEN_BOUNDARY });
		telegramFetch = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(telegramOk());
		const { commandService } = await import("./command-repository");
		const { createResetRepository } = await import("./reset-repository");
		const applicationDatabase = database as typeof import("@fitway/db").db;
		// Real scheduled reset and real retention; only alert evaluation is forced
		// to fault, which is the fault the frozen contract exists to isolate.
		const runner = createCompositeCronRunner({
			now: () => PRE_OPEN_BOUNDARY,
			runScheduledReset: () =>
				createScheduledResetRunner({
					now: () => PRE_OPEN_BOUNDARY,
					...createResetRepository(applicationDatabase),
					issueScheduledReset: (decision) =>
						commandService.issueScheduledReset(decision),
				}).run(),
			evaluateAlerts: async () => {
				throw new TypeError("private alert fault detail");
			},
			purgeExpired: (now) =>
				createRetentionRepository(applicationDatabase).purgeExpired(now),
		});

		const response = await invokeCron({ now: PRE_OPEN_BOUNDARY, runner });

		// The aggregate error surfaces as the existing fixed no-store 500.
		expect(response.status).toBe(500);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(await response.json()).toEqual({ error: "cron_failed" });

		// Both components after the fault still ran.
		const issuances = await database
			.select()
			.from(scheduledResetIssuances)
			.orderBy(asc(scheduledResetIssuances.businessDay));
		expect(issuances).toHaveLength(1);
		expect(issuances[0]?.businessDay).toBe("2026-08-13");
		const auditIds = (
			await database.select({ id: auditLog.id }).from(auditLog)
		).map((row) => row.id);
		expect(auditIds).not.toContain(cronFixture.expiredAuditId);
		expect(auditIds).toContain(cronFixture.retainedAuditId);
		// The faulting component wrote nothing.
		expect(await alertRows()).toEqual([]);
	});
});
