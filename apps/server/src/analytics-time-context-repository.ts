import {
	type AnalyticsTimeContext,
	assertIanaTimeZone,
} from "@fitway/api/analytics/time-context";
import { businessDayFor } from "@fitway/api/occupancy/business-day";
import type { db } from "@fitway/db";
import { settingsVersions } from "@fitway/db/schema/application";
import { asc } from "drizzle-orm";
import { createAnalyticsRepository } from "./analytics-repository";

type Database = typeof db;

export type AnalyticsTimeSettingsRow = {
	version: number;
	effectiveFrom: Date;
	timeZone: string;
	businessDayBoundary: string;
};

export type ResolvedAnalyticsTimeContext = AnalyticsTimeContext & {
	businessDayBoundary: string;
};

export function resolveAnalyticsTimeContext(
	rows: readonly AnalyticsTimeSettingsRow[],
	requestedVersions: readonly number[],
	now: Date,
): ResolvedAnalyticsTimeContext {
	if (!Number.isFinite(now.getTime())) throw new Error("Server now is invalid");
	const sorted = [...rows].sort(
		(left, right) =>
			left.effectiveFrom.getTime() - right.effectiveFrom.getTime() ||
			left.version - right.version,
	);
	const current = sorted.reduce<AnalyticsTimeSettingsRow | null>(
		(result, row) =>
			row.effectiveFrom.getTime() <= now.getTime() ? row : result,
		null,
	);
	if (!current) throw new Error("No effective settings exist at server now");

	const rowsByVersion = new Map(sorted.map((row) => [row.version, row]));
	const requestedRows = requestedVersions.map((version) => {
		const row = rowsByVersion.get(version);
		if (!row) throw new Error(`Settings version ${version} cannot be resolved`);
		return row;
	});
	for (const row of [current, ...requestedRows])
		assertIanaTimeZone(row.timeZone);

	return {
		current: {
			settingsVersion: current.version,
			timeZone: current.timeZone,
		},
		versions: requestedRows.map((row) => ({
			settingsVersion: row.version,
			timeZone: row.timeZone,
		})),
		businessDayBoundary: current.businessDayBoundary,
	};
}

export type AnalyticsTimeContextRepository = {
	readTimeContext(
		settingsVersions: readonly number[],
		at?: Date,
	): Promise<ResolvedAnalyticsTimeContext>;
};

export function createAnalyticsTimeContextRepository(
	database: Database,
	now: () => Date = () => new Date(),
): AnalyticsTimeContextRepository {
	return {
		async readTimeContext(requestedVersions, at = now()) {
			const rows = await database
				.select({
					version: settingsVersions.version,
					effectiveFrom: settingsVersions.effectiveFrom,
					timeZone: settingsVersions.timezone,
					businessDayBoundary: settingsVersions.businessDayBoundary,
				})
				.from(settingsVersions)
				.orderBy(
					asc(settingsVersions.effectiveFrom),
					asc(settingsVersions.version),
				);
			return resolveAnalyticsTimeContext(
				rows.map((row) => ({
					...row,
					businessDayBoundary:
						row.businessDayBoundary.length === 5
							? row.businessDayBoundary
							: row.businessDayBoundary.slice(0, 8),
				})),
				requestedVersions,
				at,
			);
		},
	};
}

export function createOwnerAnalyticsReaders(
	database: Database,
	now: () => Date = () => new Date(),
) {
	const dailyRepository = createAnalyticsRepository(database);
	const timeRepository = createAnalyticsTimeContextRepository(database, now);
	return {
		async readDailyAnalytics(businessDay?: string) {
			let resolvedBusinessDay = businessDay;
			if (!resolvedBusinessDay) {
				const evaluationTime = now();
				const current = await timeRepository.readTimeContext(
					[],
					evaluationTime,
				);
				resolvedBusinessDay = businessDayFor(
					evaluationTime,
					current.current.timeZone,
					current.businessDayBoundary,
				);
			}
			return dailyRepository.readDailyAnalytics(resolvedBusinessDay);
		},
		async readAnalyticsTimeContext(settingsVersionIds: readonly number[]) {
			const { businessDayBoundary: _boundary, ...context } =
				await timeRepository.readTimeContext(settingsVersionIds);
			return context;
		},
	};
}
