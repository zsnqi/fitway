import * as applicationSchema from "@fitway/db/schema/application";
import { drizzle } from "drizzle-orm/pg-proxy";
import { describe, expect, it, vi } from "vitest";
import { createResetRepository } from "./reset-repository";

describe("reset repository", () => {
	it("preserves the complete settings history, maps reset buffers, and reads issuance command status", async () => {
		const settingsOrder = vi.fn(async () => [
			{
				version: 1,
				effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
				timezone: "Asia/Riyadh",
				businessDayBoundary: "04:00:00",
				resetBufferMinutes: 30,
				scheduleSunOpen: null,
				scheduleSunClose: null,
				scheduleMonOpen: null,
				scheduleMonClose: null,
				scheduleTueOpen: null,
				scheduleTueClose: null,
				scheduleWedOpen: null,
				scheduleWedClose: null,
				scheduleThuOpen: null,
				scheduleThuClose: null,
				scheduleFriOpen: null,
				scheduleFriClose: null,
				scheduleSatOpen: null,
				scheduleSatClose: null,
			},
			{
				version: 2,
				effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
				timezone: "Asia/Riyadh",
				businessDayBoundary: "04:00:00",
				resetBufferMinutes: 45,
				scheduleSunOpen: "10:00:00",
				scheduleSunClose: "21:00:00",
				scheduleMonOpen: null,
				scheduleMonClose: null,
				scheduleTueOpen: null,
				scheduleTueClose: null,
				scheduleWedOpen: null,
				scheduleWedClose: null,
				scheduleThuOpen: null,
				scheduleThuClose: null,
				scheduleFriOpen: "12:00:00",
				scheduleFriClose: "18:00:00",
				scheduleSatOpen: null,
				scheduleSatClose: null,
			},
		]);
		const issuanceOrder = vi.fn(async () => [
			{ businessDay: "2026-07-03", commandId: 71, status: "superseded" },
		]);
		const database = {
			select: vi
				.fn()
				.mockReturnValueOnce({
					from: vi.fn(() => ({ orderBy: settingsOrder })),
				})
				.mockReturnValueOnce({
					from: vi.fn(() => ({
						innerJoin: vi.fn(() => ({ orderBy: issuanceOrder })),
					})),
				}),
		};
		const repository = createResetRepository(database as never);

		await expect(repository.readSettingsVersions()).resolves.toEqual([
			{
				version: 1,
				effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
				timeZone: "Asia/Riyadh",
				businessDayBoundary: "04:00:00",
				resetBufferMinutes: 30,
				weeklySchedule: {
					sun: null,
					mon: null,
					tue: null,
					wed: null,
					thu: null,
					fri: null,
					sat: null,
				},
			},
			{
				version: 2,
				effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
				timeZone: "Asia/Riyadh",
				businessDayBoundary: "04:00:00",
				resetBufferMinutes: 45,
				weeklySchedule: {
					sun: { open: "10:00:00", close: "21:00:00" },
					mon: null,
					tue: null,
					wed: null,
					thu: null,
					fri: { open: "12:00:00", close: "18:00:00" },
					sat: null,
				},
			},
		]);
		await expect(repository.readPriorIssuances()).resolves.toEqual([
			{ businessDay: "2026-07-03", commandId: 71, status: "superseded" },
		]);
		expect(settingsOrder).toHaveBeenCalledOnce();
		expect(issuanceOrder).toHaveBeenCalledOnce();
	});

	it("orders the full history by effective time then ascending version", async () => {
		const statements: string[] = [];
		const database = drizzle(
			async (sql) => {
				statements.push(sql);
				return { rows: [] };
			},
			{ schema: applicationSchema },
		);
		const repository = createResetRepository(
			database as unknown as typeof import("@fitway/db").db,
		);

		await expect(repository.readSettingsVersions()).resolves.toEqual([]);
		expect(statements).toHaveLength(1);
		expect(statements[0]?.replaceAll(/\s+/g, " ")).toMatch(
			/order by "settings_versions"\."effective_from" asc, "settings_versions"\."version" asc$/u,
		);
	});
});
