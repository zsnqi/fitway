import type {
	PriorSystemResetIssuance,
	ResetScheduleSettingsVersion,
} from "@fitway/api/reset/types";
import type { db } from "@fitway/db";
import {
	edgeCommands,
	scheduledResetIssuances,
	settingsVersions,
} from "@fitway/db/schema/application";
import { asc, eq } from "drizzle-orm";

type Database = typeof db;

function scheduleHours(open: string | null, close: string | null) {
	if (open === null && close === null) return null;
	if (open === null || close === null) {
		throw new Error("Stored reset schedule has an incomplete weekday pair");
	}
	return { open, close };
}

function mapSettings(
	row: typeof settingsVersions.$inferSelect,
): ResetScheduleSettingsVersion {
	return {
		version: row.version,
		effectiveFrom: row.effectiveFrom,
		timeZone: row.timezone,
		businessDayBoundary: row.businessDayBoundary,
		resetBufferMinutes: row.resetBufferMinutes,
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

export type ResetRepository = {
	readSettingsVersions: () => Promise<readonly ResetScheduleSettingsVersion[]>;
	readPriorIssuances: () => Promise<readonly PriorSystemResetIssuance[]>;
};

export function createResetRepository(database: Database): ResetRepository {
	return {
		async readSettingsVersions() {
			const rows = await database
				.select()
				.from(settingsVersions)
				.orderBy(
					asc(settingsVersions.effectiveFrom),
					asc(settingsVersions.version),
				);
			return rows.map(mapSettings);
		},

		async readPriorIssuances() {
			const rows = await database
				.select({
					businessDay: scheduledResetIssuances.businessDay,
					commandId: scheduledResetIssuances.commandId,
					status: edgeCommands.status,
				})
				.from(scheduledResetIssuances)
				.innerJoin(
					edgeCommands,
					eq(scheduledResetIssuances.commandId, edgeCommands.id),
				)
				.orderBy(
					asc(scheduledResetIssuances.businessDay),
					asc(scheduledResetIssuances.commandId),
				);
			return rows;
		},
	};
}
