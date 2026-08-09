import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
	EDGE_PUSH_INTERNAL_PATH,
	type EdgePushRequest,
	edgePushRequestSchema,
	edgePushResponseSchema,
} from "@fitway/api/edge-push";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	currentState,
	edgeCommands,
	edgeCurrentHealth,
	edgeDevices,
	occupancyMinutes,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { and, eq, gt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Hono } from "hono";
import { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createEdgePushHandler } from "./edge-push";
import {
	createFindDeviceByTokenHash,
	createOccupancyEngineDatabase,
} from "./occupancy-repositories";
import { generateOpenApiDocument } from "./openapi";
import { DeviceRateLimiter } from "./rate-limiter";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});

const pool = new Pool({ connectionString });
const database = drizzle(pool, {
	schema: { ...applicationSchema, ...authSchema },
});
const rawDeviceToken = `p6_${"d".repeat(40)}`;
const app = new Hono();
let deviceId = "";
let actorId = "";
let initialSettingsVersion = 0;

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

function minuteFor(value: Date) {
	return new Date(Math.floor(value.getTime() / 60_000) * 60_000).toISOString();
}

function fixture(name: string) {
	return JSON.parse(
		readFileSync(
			new URL(`../../../edge/fixtures/${name}`, import.meta.url),
			"utf8",
		),
	);
}

function addMinuteOrderingKeyword(ajv: Ajv2020) {
	ajv.addKeyword({
		keyword: "x-fitway-sorted-unique-minute-starts",
		type: "array",
		schemaType: "boolean",
		validate: (_schema: boolean, value: unknown) => {
			if (!Array.isArray(value)) return false;
			const starts = value.map((item) =>
				typeof item === "object" && item !== null && "minuteStart" in item
					? item.minuteStart
					: undefined,
			);
			const stringStarts = starts.filter(
				(start): start is string => typeof start === "string",
			);
			return (
				stringStarts.length === starts.length &&
				stringStarts.every(
					(start, index) =>
						index === 0 || start > (stringStarts[index - 1] ?? ""),
				)
			);
		},
	});
}

function livePush(
	sequence: number,
	currentCount: number,
	appliedCommandId: number | null,
	observedAt = new Date(Date.now() - 1_000),
): EdgePushRequest {
	return {
		schemaVersion: 2,
		mode: "live",
		sequence,
		observedAt: observedAt.toISOString(),
		currentCount,
		minutes: [
			{
				minuteStart: minuteFor(observedAt),
				count: currentCount,
				entries: 0,
				exits: 0,
			},
		],
		health: {
			process: "ok",
			camera: "ok",
			feed: "ok",
			detectorFps: 4.8,
		},
		appliedCommandId,
	};
}

function backfillPush(
	sequence: number,
	minuteStart: string,
	count: number,
	entries: number,
): EdgePushRequest {
	return {
		schemaVersion: 2,
		mode: "backfill",
		sequence,
		minutes: [{ minuteStart, count, entries, exits: 0 }],
		appliedCommandId: null,
	};
}

async function push(input: EdgePushRequest) {
	const response = await app.request(EDGE_PUSH_INTERNAL_PATH, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${rawDeviceToken}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});
	return {
		status: response.status,
		body: (await response.json()) as Record<string, unknown>,
	};
}

beforeAll(async () => {
	await database.execute(sql`drop schema if exists drizzle cascade`);
	await database.execute(sql`drop schema if exists public cascade`);
	await database.execute(sql`create schema public`);
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	const [initialSettings] = await database
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
			effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
			...alwaysOpen,
		})
		.returning({ version: settingsVersions.version });
	if (!initialSettings)
		throw new Error("Initial Phase 6 settings were not created");
	initialSettingsVersion = initialSettings.version;
	const [device] = await database
		.insert(edgeDevices)
		.values({
			name: "phase-6-offline",
			tokenHash: createHash("sha256").update(rawDeviceToken).digest("hex"),
		})
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("Phase 6 device was not created");
	deviceId = device.id;
	const [actor] = await database
		.insert(authSchema.authPrincipals)
		.values({
			principalKind: "shared_staff",
			role: "staff",
			displayName: "Phase 6 internal fixture actor",
		})
		.returning({ id: authSchema.authPrincipals.id });
	if (!actor) throw new Error("Phase 6 fixture actor was not created");
	actorId = actor.id;

	const engine = createOccupancyEngineDatabase(
		database as unknown as typeof import("@fitway/db").db,
	);
	app.post(
		EDGE_PUSH_INTERNAL_PATH,
		createEdgePushHandler({
			findDeviceByHash: createFindDeviceByTokenHash(
				database as unknown as typeof import("@fitway/db").db,
			),
			limiter: new DeviceRateLimiter(Date.now, 100),
			engine,
		}),
	);
}, 40_000);

beforeEach(async () => {
	await database.delete(edgeCommands);
	await database.delete(edgeCurrentHealth);
	await database.delete(occupancyMinutes);
	await database
		.update(currentState)
		.set({
			currentCount: null,
			band: null,
			source: null,
			lastPushReceivedAt: null,
			lastEdgeReportedAt: null,
			activeDeviceId: null,
			settingsVersion: null,
			updatedAt: new Date(),
		})
		.where(eq(currentState.id, 1));
	await database
		.delete(settingsVersions)
		.where(gt(settingsVersions.version, initialSettingsVersion));
	await database
		.update(edgeDevices)
		.set({ lastSequence: 0, lastSeenAt: null, updatedAt: new Date() })
		.where(eq(edgeDevices.id, deviceId));

	expect((await push(livePush(1, 12, null))).body).toMatchObject({
		schemaVersion: 2,
		accepted: true,
		highestProcessedSequence: 1,
	});
});

afterAll(async () => pool.end());

describe.sequential("Phase 6 offline reconciliation over authenticated HTTP and disposable Postgres", () => {
	it("keeps the frozen schema-v2 OpenAPI contract in parity with shared Python fixtures", async () => {
		const document = await generateOpenApiDocument();
		const operation = document.paths?.["/edge/push"]?.post;
		const requestMedia =
			operation?.requestBody && "content" in operation.requestBody
				? operation.requestBody.content?.["application/json"]
				: undefined;
		const success = operation?.responses?.["200"];
		const responseMedia =
			success && "content" in success
				? success.content?.["application/json"]
				: undefined;
		if (!requestMedia?.schema || !responseMedia?.schema) {
			throw new Error("Phase 6 OpenAPI contract is missing");
		}

		const ajv = new Ajv2020({ strict: true });
		addFormats(ajv);
		addMinuteOrderingKeyword(ajv);
		const validateRequest = ajv.compile(requestMedia.schema);
		const validateResponse = ajv.compile(responseMedia.schema);
		for (const name of ["push.json", "backfill.json"]) {
			const value = fixture(name);
			expect(edgePushRequestSchema.safeParse(value).success).toBe(true);
			expect(
				validateRequest(value),
				JSON.stringify(validateRequest.errors),
			).toBe(true);
		}
		for (const name of ["acknowledgement.json", "commands-pending.json"]) {
			const value = fixture(name);
			expect(edgePushResponseSchema.safeParse(value).success).toBe(true);
			expect(
				validateResponse(value),
				JSON.stringify(validateResponse.errors),
			).toBe(true);
		}
	});

	it("upserts duplicate buffered minutes without moving current or health authority", async () => {
		const backfillMinute = minuteFor(new Date(Date.now() - 10 * 60_000));
		const [currentBefore] = await database.select().from(currentState);
		const [healthBefore] = await database.select().from(edgeCurrentHealth);

		expect(
			(await push(backfillPush(2, backfillMinute, 9, 1))).body,
		).toMatchObject({
			schemaVersion: 2,
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 2,
		});
		expect((await database.select().from(currentState))[0]).toEqual(
			currentBefore,
		);
		expect((await database.select().from(edgeCurrentHealth))[0]).toEqual(
			healthBefore,
		);
		await database.insert(settingsVersions).values({
			capacity: 50,
			quietMaxPercent: 20,
			moderateMaxPercent: 40,
			busyMaxPercent: 70,
			timezone: "UTC",
			businessDayBoundary: "00:00",
			pushIntervalSeconds: 30,
			freshForSeconds: 90,
			operationalStaleAfterSeconds: 180,
			publicPollSeconds: 60,
			effectiveFrom: new Date(new Date(backfillMinute).getTime() + 60_000),
			...alwaysOpen,
		});

		expect(
			(await push(backfillPush(3, backfillMinute, 8, 2))).body,
		).toMatchObject({
			accepted: true,
			highestProcessedSequence: 3,
		});
		const rows = await database
			.select()
			.from(occupancyMinutes)
			.where(
				and(
					eq(occupancyMinutes.deviceId, deviceId),
					eq(occupancyMinutes.minuteStartUtc, new Date(backfillMinute)),
				),
			);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			count: 8,
			entries: 2,
			capacitySnapshot: 100,
			settingsVersion: initialSettingsVersion,
			source: "backfill",
		});

		const beforeRejected = JSON.stringify({
			current: await database.select().from(currentState),
			health: await database.select().from(edgeCurrentHealth),
			minutes: await database.select().from(occupancyMinutes),
		});
		expect(
			(await push(backfillPush(3, backfillMinute, 99, 9))).body,
		).toMatchObject({
			accepted: false,
			reason: "replay",
			highestProcessedSequence: 3,
		});
		expect(
			(await push(backfillPush(5, backfillMinute, 99, 9))).body,
		).toMatchObject({
			accepted: false,
			reason: "sequence_gap",
			highestProcessedSequence: 3,
		});
		expect(
			JSON.stringify({
				current: await database.select().from(currentState),
				health: await database.select().from(edgeCurrentHealth),
				minutes: await database.select().from(occupancyMinutes),
			}),
		).toBe(beforeRejected);
	});

	it("settles stale live history, drains backfill, then restores authority only with fresh live", async () => {
		const [currentBefore] = await database.select().from(currentState);
		const [healthBefore] = await database.select().from(edgeCurrentHealth);
		const staleObservedAt = new Date(Date.now() - 20 * 60_000);
		expect(
			(await push(livePush(2, 99, null, staleObservedAt))).body,
		).toMatchObject({
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 2,
		});
		expect((await database.select().from(currentState))[0]).toEqual(
			currentBefore,
		);
		expect((await database.select().from(edgeCurrentHealth))[0]).toEqual(
			healthBefore,
		);

		const bufferedMinute = minuteFor(new Date(Date.now() - 15 * 60_000));
		expect(
			(await push(backfillPush(3, bufferedMinute, 10, 1))).body,
		).toMatchObject({
			accepted: true,
			highestProcessedSequence: 3,
		});
		expect((await database.select().from(currentState))[0]).toEqual(
			currentBefore,
		);

		expect((await push(livePush(4, 14, null))).body).toMatchObject({
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 4,
		});
		expect((await database.select().from(currentState))[0]).toMatchObject({
			currentCount: 14,
			source: "edge",
		});
		expect((await database.select().from(edgeCurrentHealth))[0]).toMatchObject({
			sequence: 4,
		});
	});

	it("applies a pending command before the reconnecting live sequence resumes authority", async () => {
		const [command] = await database
			.insert(edgeCommands)
			.values({
				deviceId,
				type: "set_count",
				targetValue: 4,
				issuedByPrincipalId: actorId,
				reason: "phase 6 reconnect fixture",
			})
			.returning({ id: edgeCommands.id });
		if (!command) throw new Error("Pending command was not created");
		const [currentBefore] = await database.select().from(currentState);
		const [healthBefore] = await database.select().from(edgeCurrentHealth);

		const blocked = await push(livePush(2, 99, null));
		expect(blocked.body).toMatchObject({
			schemaVersion: 2,
			accepted: false,
			reason: "commands_pending",
			highestProcessedSequence: 1,
			commands: [{ id: command.id, targetValue: 4 }],
		});
		expect((await database.select().from(currentState))[0]).toEqual(
			currentBefore,
		);
		expect((await database.select().from(edgeCurrentHealth))[0]).toEqual(
			healthBefore,
		);
		expect(
			(
				await database
					.select()
					.from(edgeDevices)
					.where(eq(edgeDevices.id, deviceId))
			)[0]?.lastSequence,
		).toBe(1);

		expect((await push(livePush(2, 4, command.id))).body).toMatchObject({
			accepted: true,
			reason: "processed",
			highestProcessedSequence: 2,
			commands: [],
		});
		expect((await database.select().from(currentState))[0]).toMatchObject({
			currentCount: 4,
			source: "edge",
		});
		expect((await database.select().from(edgeCurrentHealth))[0]).toMatchObject({
			sequence: 2,
		});
		expect(
			(
				await database
					.select()
					.from(edgeCommands)
					.where(eq(edgeCommands.id, command.id))
			)[0],
		).toMatchObject({ status: "applied" });
	});

	it("rolls back command acknowledgement when minute settings are unavailable", async () => {
		const deliveredAt = new Date(Date.now() - 1_000);
		const [command] = await database
			.insert(edgeCommands)
			.values({
				deviceId,
				type: "reset_zero",
				issuedByPrincipalId: actorId,
				reason: "phase 6 rollback fixture",
				deliveredAt,
			})
			.returning({ id: edgeCommands.id });
		if (!command) throw new Error("Rollback command was not created");
		const [currentBefore] = await database.select().from(currentState);
		const minuteStart = "2025-12-31T23:59:00.000Z";
		const input = livePush(2, 0, command.id);
		input.minutes = [{ minuteStart, count: 0, entries: 0, exits: 0 }];

		expect(await push(input)).toMatchObject({
			status: 500,
			body: { error: "internal_error" },
		});
		expect(
			(
				await database
					.select()
					.from(edgeCommands)
					.where(eq(edgeCommands.id, command.id))
			)[0],
		).toMatchObject({ status: "pending", appliedAt: null, deliveredAt });
		expect(
			(
				await database
					.select()
					.from(edgeDevices)
					.where(eq(edgeDevices.id, deviceId))
			)[0]?.lastSequence,
		).toBe(1);
		expect((await database.select().from(currentState))[0]).toEqual(
			currentBefore,
		);
	});
});
