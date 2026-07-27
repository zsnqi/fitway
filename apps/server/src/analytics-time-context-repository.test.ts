import { describe, expect, it } from "vitest";

import { resolveAnalyticsTimeContext } from "./analytics-time-context-repository";

describe("analytics time context resolution", () => {
	const rows = [
		{
			version: 4,
			effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
			timeZone: "Asia/Riyadh",
			businessDayBoundary: "04:00:00",
		},
		{
			version: 8,
			effectiveFrom: new Date("2026-07-20T00:00:00.000Z"),
			timeZone: "Europe/London",
			businessDayBoundary: "03:30:00",
		},
		{
			version: 9,
			effectiveFrom: new Date("2026-07-20T00:00:00.000Z"),
			timeZone: "America/New_York",
			businessDayBoundary: "02:00:00",
		},
	];

	it("chooses current by effective time then version and preserves request order", () => {
		expect(
			resolveAnalyticsTimeContext(
				rows,
				[8, 4],
				new Date("2026-07-22T00:00:00.000Z"),
			),
		).toEqual({
			current: { settingsVersion: 9, timeZone: "America/New_York" },
			versions: [
				{ settingsVersion: 8, timeZone: "Europe/London" },
				{ settingsVersion: 4, timeZone: "Asia/Riyadh" },
			],
			businessDayBoundary: "02:00:00",
		});
	});

	it("fails rather than inventing missing or invalid timezone mappings", () => {
		const first = rows[0];
		if (!first) throw new Error("Timezone fixture is missing");
		expect(() =>
			resolveAnalyticsTimeContext(rows, [99], new Date("2026-07-22T00:00:00Z")),
		).toThrow(/settings version 99/i);
		expect(() =>
			resolveAnalyticsTimeContext(
				[{ ...first, timeZone: "Not/A_Zone" }],
				[4],
				new Date("2026-07-22T00:00:00Z"),
			),
		).toThrow(/IANA timezone/i);
		expect(() =>
			resolveAnalyticsTimeContext(rows, [], new Date("2026-06-01T00:00:00Z")),
		).toThrow(/effective settings/i);
	});
});
