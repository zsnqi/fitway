import type { OccupancyTransaction } from "@fitway/api/occupancy/engine";
import type {
	PublicPayloadRepository,
	PublicPayloadSettings,
} from "@fitway/api/public/payload-builder";
import { db } from "@fitway/db";
import {
	currentState,
	edgeCurrentHealth,
	edgeDevices,
	occupancyMinutes,
	settingsVersions,
} from "@fitway/db/schema/application";
import { desc, eq, lte, sql } from "drizzle-orm";
import { createCommandQueueForTransaction } from "./command-repository";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Database = typeof db;

function normalizeDatabaseTime(value: string): string {
	return value.length === 5 ? value : value.slice(0, 8);
}

function mapSettings(
	row: typeof settingsVersions.$inferSelect,
): PublicPayloadSettings {
	return {
		version: row.version,
		capacity: row.capacity,
		quietMaxPercent: row.quietMaxPercent,
		moderateMaxPercent: row.moderateMaxPercent,
		busyMaxPercent: row.busyMaxPercent,
		timezone: row.timezone,
		timeZone: row.timezone,
		businessDayBoundary: normalizeDatabaseTime(row.businessDayBoundary),
		pushIntervalSeconds: row.pushIntervalSeconds,
		freshForSeconds: row.freshForSeconds,
		operationalStaleAfterSeconds: row.operationalStaleAfterSeconds,
		publicPollSeconds: row.publicPollSeconds,
		weeklySchedule: {
			sun: scheduleHours(row.scheduleSunOpen, row.scheduleSunClose),
			mon: scheduleHours(row.scheduleMonOpen, row.scheduleMonClose),
			tue: scheduleHours(row.scheduleTueOpen, row.scheduleTueClose),
			wed: scheduleHours(row.scheduleWedOpen, row.scheduleWedClose),
			thu: scheduleHours(row.scheduleThuOpen, row.scheduleThuClose),
			fri: scheduleHours(row.scheduleFriOpen, row.scheduleFriClose),
			sat: scheduleHours(row.scheduleSatOpen, row.scheduleSatClose),
		},
	};
}

async function latestSettings(
	client: Pick<typeof db, "select">,
): Promise<PublicPayloadSettings | null> {
	const [row] = await client
		.select()
		.from(settingsVersions)
		.orderBy(desc(settingsVersions.version))
		.limit(1);
	return row ? mapSettings(row) : null;
}

async function settingsEffectiveAt(
	client: Pick<typeof db, "select">,
	at: Date,
): Promise<PublicPayloadSettings | null> {
	const [row] = await client
		.select()
		.from(settingsVersions)
		.where(lte(settingsVersions.effectiveFrom, at))
		.orderBy(
			desc(settingsVersions.effectiveFrom),
			desc(settingsVersions.version),
		)
		.limit(1);
	return row ? mapSettings(row) : null;
}

function scheduleHours(open: string | null, close: string | null) {
	if (open === null && close === null) return null;
	return {
		open: open ? normalizeDatabaseTime(open) : "",
		close: close ? normalizeDatabaseTime(close) : "",
	};
}

function transactionAdapter(tx: Transaction): OccupancyTransaction {
	return {
		commandQueue: createCommandQueueForTransaction(tx),
		async lockDevice(deviceId) {
			const result = await tx.execute<{
				id: string;
				enabled: boolean;
				last_sequence: string;
			}>(
				sql`select id, enabled, last_sequence from edge_devices where id = ${deviceId} for update`,
			);
			const row = result.rows[0];
			return row
				? {
						id: row.id,
						enabled: row.enabled,
						lastSequence: Number(row.last_sequence),
					}
				: null;
		},
		loadLatestSettings: () => latestSettings(tx),
		loadSettingsEffectiveAt: (at) => settingsEffectiveAt(tx, at),
		async upsertMinute(value) {
			await tx
				.insert(occupancyMinutes)
				.values(value)
				.onConflictDoUpdate({
					target: [occupancyMinutes.deviceId, occupancyMinutes.minuteStartUtc],
					set: {
						businessDay: value.businessDay,
						count: value.count,
						entries: value.entries,
						exits: value.exits,
						band: value.band,
						capacitySnapshot: value.capacitySnapshot,
						settingsVersion: value.settingsVersion,
						source: value.source,
						updatedAt: value.updatedAt,
					},
				});
		},
		async updateCurrent(value) {
			const rows = await tx
				.update(currentState)
				.set(value)
				.where(eq(currentState.id, 1))
				.returning({ id: currentState.id });
			if (rows.length !== 1) throw new Error("Current singleton is missing");
		},
		async advanceDevice(deviceId, sequence, receivedAt) {
			const rows = await tx
				.update(edgeDevices)
				.set({
					lastSequence: sequence,
					lastSeenAt: receivedAt,
					updatedAt: receivedAt,
				})
				.where(eq(edgeDevices.id, deviceId))
				.returning({ id: edgeDevices.id });
			if (rows.length !== 1) throw new Error("Locked device disappeared");
		},
		async upsertCurrentHealth(value) {
			await tx
				.insert(edgeCurrentHealth)
				.values(value)
				.onConflictDoUpdate({
					target: edgeCurrentHealth.deviceId,
					set: {
						sequence: value.sequence,
						processStatus: value.processStatus,
						cameraStatus: value.cameraStatus,
						feedStatus: value.feedStatus,
						detectorFps: value.detectorFps,
						edgeObservedAt: value.edgeObservedAt,
						receivedAt: value.receivedAt,
						updatedAt: value.updatedAt,
					},
				});
		},
	};
}

export function createOccupancyEngineDatabase(database: Database) {
	return {
		transaction<T>(work: (tx: OccupancyTransaction) => Promise<T>): Promise<T> {
			return database.transaction((tx) => work(transactionAdapter(tx)));
		},
	};
}

export function createPublicPayloadRepository(
	database: Database,
): PublicPayloadRepository {
	return {
		async readCurrentAndLatestSettings() {
			const [settings, rows] = await Promise.all([
				latestSettings(database),
				database
					.select({
						currentCount: currentState.currentCount,
						band: currentState.band,
						source: currentState.source,
						lastPushReceivedAt: currentState.lastPushReceivedAt,
						activeDeviceEnabled: edgeDevices.enabled,
					})
					.from(currentState)
					.leftJoin(
						edgeDevices,
						eq(currentState.activeDeviceId, edgeDevices.id),
					)
					.where(eq(currentState.id, 1))
					.limit(1),
			]);
			return { current: rows[0] ?? null, settings };
		},
	};
}

export const occupancyEngineDatabase = createOccupancyEngineDatabase(db);
export const publicPayloadRepository = createPublicPayloadRepository(db);

export function createFindDeviceByTokenHash(database: Database) {
	return async (tokenHash: string) => {
		const [device] = await database
			.select({
				id: edgeDevices.id,
				name: edgeDevices.name,
				enabled: edgeDevices.enabled,
			})
			.from(edgeDevices)
			.where(eq(edgeDevices.tokenHash, tokenHash))
			.limit(1);
		return device ?? null;
	};
}

export const findDeviceByTokenHash = createFindDeviceByTokenHash(db);
