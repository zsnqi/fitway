import path from "node:path";
import type { AlertNotice } from "@fitway/api/alerts/types";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	alertLog,
	currentState,
	edgeCurrentHealth,
	edgeDevices,
	edgeHealthLog,
	occupancyMinutes,
	settingsVersions,
} from "@fitway/db/schema/application";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAlertRepository } from "./alert-repository";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});

const pool = new Pool({ connectionString });
const database = drizzle(pool, { schema: applicationSchema });
const repository = createAlertRepository(
	database as typeof import("@fitway/db").db,
);
const notices: AlertNotice[] = [];
const fixedNow = new Date("2026-07-17T10:00:00.000Z");
let deviceId = "";

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

async function preexistingState() {
	return JSON.stringify({
		current: await database.select().from(currentState),
		minutes: await database.select().from(occupancyMinutes),
		health: await database.select().from(edgeCurrentHealth),
		devices: await database.select().from(edgeDevices),
		settings: await database.select().from(settingsVersions),
	});
}

async function evaluate(now: Date) {
	return repository.evaluateAndNotify({
		now,
		preOpenWindowMs: 30 * 60 * 1_000,
		reAlertIntervalMs: 30 * 60 * 1_000,
		notifier: async (notice) => {
			notices.push(notice);
		},
	});
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
			effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
			...alwaysOpen,
		})
		.returning({ version: settingsVersions.version });
	if (!settings) throw new Error("Alert settings were not created");
	const [device] = await database
		.insert(edgeDevices)
		.values({ name: "phase-8-alert", tokenHash: "a".repeat(64) })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Alert device was not created");
	deviceId = device.id;
	await database.update(currentState).set({
		currentCount: 12,
		band: "moderate",
		source: "edge",
		lastPushReceivedAt: new Date(fixedNow.getTime() - 180_000),
		lastEdgeReportedAt: new Date(fixedNow.getTime() - 181_000),
		activeDeviceId: deviceId,
		settingsVersion: settings.version,
	});
	await database.insert(edgeCurrentHealth).values({
		deviceId,
		sequence: 1,
		processStatus: "ok",
		cameraStatus: "failed",
		feedStatus: "ok",
		detectorFps: 4,
		edgeObservedAt: new Date(fixedNow.getTime() - 181_000),
		receivedAt: new Date(fixedNow.getTime() - 180_000),
		updatedAt: new Date(fixedNow.getTime() - 180_000),
	});
}, 30_000);

afterAll(async () => pool.end());

describe("Phase 8 alert evaluator repository", () => {
	it("writes only append-only logs, suppresses/re-alerts from them, and links recovery", async () => {
		const beforeInitial = await preexistingState();
		const initial = await evaluate(fixedNow);
		expect(initial.notices.map((notice) => notice.condition)).toEqual([
			"stale_push",
			"camera_failure",
		]);
		expect(notices).toHaveLength(2);
		expect(await preexistingState()).toBe(beforeInitial);
		const initialLogs = await database.select().from(alertLog);
		expect(initialLogs).toHaveLength(4);
		expect(
			initialLogs.filter((row) => row.deliveryOutcome === "delivered"),
		).toMatchObject([
			{
				condition: "stale_push",
				noticeKind: "alert",
				deliveryOutcome: "delivered",
			},
			{
				condition: "camera_failure",
				noticeKind: "alert",
				deliveryOutcome: "delivered",
			},
		]);
		expect(
			initialLogs.find(
				(row) =>
					row.condition === "camera_failure" &&
					row.deliveryOutcome === "delivered",
			)?.conditionStartedAt,
		).toEqual(new Date(fixedNow.getTime() - 180_000));
		expect(
			(await database.select().from(edgeHealthLog)).map(
				(row) => row.transitionType,
			),
		).toEqual(["offline"]);

		const beforeSuppressed = await preexistingState();
		expect((await evaluate(fixedNow)).notices).toEqual([]);
		expect(await preexistingState()).toBe(beforeSuppressed);
		expect(notices).toHaveLength(2);

		const reAlertAt = new Date(fixedNow.getTime() + 30 * 60 * 1_000);
		await database
			.update(edgeCurrentHealth)
			.set({
				sequence: 2,
				edgeObservedAt: new Date(reAlertAt.getTime() - 60_000),
				receivedAt: new Date(reAlertAt.getTime() - 60_000),
				updatedAt: new Date(reAlertAt.getTime() - 60_000),
			})
			.where(eq(edgeCurrentHealth.deviceId, deviceId));
		const beforeReAlert = await preexistingState();
		const reAlerts = await evaluate(reAlertAt);
		expect(reAlerts.notices.map((notice) => notice.condition)).toEqual([
			"stale_push",
			"camera_failure",
		]);
		expect(await preexistingState()).toBe(beforeReAlert);
		expect(
			reAlerts.notices.find((notice) => notice.condition === "camera_failure")
				?.conditionStartedAt,
		).toEqual(new Date(fixedNow.getTime() - 180_000));
		expect(await database.select().from(alertLog)).toHaveLength(8);

		await database
			.update(currentState)
			.set({
				lastPushReceivedAt: reAlertAt,
				lastEdgeReportedAt: reAlertAt,
			})
			.where(eq(currentState.id, 1));
		await database
			.update(edgeCurrentHealth)
			.set({
				sequence: 3,
				cameraStatus: "ok",
				edgeObservedAt: reAlertAt,
				receivedAt: reAlertAt,
				updatedAt: reAlertAt,
			})
			.where(eq(edgeCurrentHealth.deviceId, deviceId));
		const beforeRecovery = await preexistingState();
		const recovery = await evaluate(reAlertAt);
		expect(recovery.notices).toMatchObject([
			{ condition: "stale_push", noticeKind: "recovery" },
			{ condition: "camera_failure", noticeKind: "recovery" },
		]);
		expect(await preexistingState()).toBe(beforeRecovery);
		const alerts = await database.select().from(alertLog);
		expect(alerts).toHaveLength(12);
		expect(
			alerts
				.slice(-2)
				.every(
					(row) =>
						row.noticeKind === "recovery" && row.recoveryOfAlertId !== null,
				),
		).toBe(true);
		expect(
			(await database.select().from(edgeHealthLog)).map(
				(row) => row.transitionType,
			),
		).toEqual(["offline", "online", "reported_flags_changed"]);
	});

	it("isolates another device's unresolved alert and recovery history", async () => {
		await database.delete(alertLog);
		await database.delete(edgeHealthLog);
		const [otherDevice] = await database
			.insert(edgeDevices)
			.values({ name: "phase-8-alert-other", tokenHash: "b".repeat(64) })
			.returning({ id: edgeDevices.id });
		if (!otherDevice) throw new Error("Second alert device was not created");
		const [otherAlert] = await database
			.insert(alertLog)
			.values({
				deviceId: otherDevice.id,
				condition: "stale_push",
				noticeKind: "alert",
				conditionStartedAt: new Date(fixedNow.getTime() - 600_000),
				sentAt: new Date(fixedNow.getTime() - 600_000),
				deliveryOutcome: "delivered",
				recoveryOfAlertId: null,
			})
			.returning({ id: alertLog.id });
		if (!otherAlert) throw new Error("Other-device alert was not created");
		await database.insert(alertLog).values({
			deviceId: otherDevice.id,
			condition: "stale_push",
			noticeKind: "recovery",
			conditionStartedAt: new Date(fixedNow.getTime() - 600_000),
			sentAt: new Date(fixedNow.getTime() - 300_000),
			deliveryOutcome: "delivered",
			recoveryOfAlertId: otherAlert.id,
		});
		await database
			.update(currentState)
			.set({ lastPushReceivedAt: new Date(fixedNow.getTime() - 180_000) })
			.where(eq(currentState.id, 1));
		await database
			.update(edgeCurrentHealth)
			.set({ processStatus: "ok", cameraStatus: "ok", feedStatus: "ok" })
			.where(eq(edgeCurrentHealth.deviceId, deviceId));
		const before = await preexistingState();
		const result = await evaluate(fixedNow);
		expect(result.notices).toEqual([
			expect.objectContaining({ deviceId, condition: "stale_push" }),
		]);
		expect(await preexistingState()).toBe(before);
		const otherRows = (await database.select().from(alertLog)).filter(
			(row) => row.deviceId === otherDevice.id,
		);
		expect(otherRows).toHaveLength(2);
	});

	it("claims one concurrent delivery and appends its final outcome without other mutations", async () => {
		await database.delete(alertLog);
		await database.delete(edgeHealthLog);
		await database
			.update(currentState)
			.set({ lastPushReceivedAt: new Date(fixedNow.getTime() - 180_000) })
			.where(eq(currentState.id, 1));
		await database
			.update(edgeCurrentHealth)
			.set({ processStatus: "ok", cameraStatus: "ok", feedStatus: "ok" })
			.where(eq(edgeCurrentHealth.deviceId, deviceId));
		const before = await preexistingState();
		let releaseNotifier: () => void = () => undefined;
		const release = new Promise<void>((resolve) => {
			releaseNotifier = resolve;
		});
		let notifierStarted: () => void = () => undefined;
		const started = new Promise<void>((resolve) => {
			notifierStarted = resolve;
		});
		let notifierCalls = 0;
		const delayedNotifier = async () => {
			notifierCalls += 1;
			notifierStarted();
			await release;
		};
		const first = repository.evaluateAndNotify({
			now: fixedNow,
			preOpenWindowMs: 30 * 60 * 1_000,
			reAlertIntervalMs: 30 * 60 * 1_000,
			notifier: delayedNotifier,
		});
		await started;
		const second = await repository.evaluateAndNotify({
			now: fixedNow,
			preOpenWindowMs: 30 * 60 * 1_000,
			reAlertIntervalMs: 30 * 60 * 1_000,
			notifier: delayedNotifier,
		});
		releaseNotifier();
		const firstResult = await first;
		expect(firstResult.notices).toHaveLength(1);
		expect(second.notices).toEqual([]);
		expect(notifierCalls).toBe(1);
		expect(await preexistingState()).toBe(before);
		const rows = await database.select().from(alertLog);
		expect(rows).toHaveLength(2);
		expect(rows.map((row) => row.deliveryOutcome)).toEqual([
			"claimed",
			"delivered",
		]);
	});
});
