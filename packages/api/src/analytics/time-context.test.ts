import { describe, expect, it } from "vitest";

import {
	analyticsTimeContextInputSchema,
	analyticsTimeContextOutputSchema,
} from "./time-context";

describe("owner analytics time context transport", () => {
	it("accepts only unique positive safe settings versions", () => {
		expect(
			analyticsTimeContextInputSchema.parse({ settingsVersions: [7, 2] }),
		).toEqual({ settingsVersions: [7, 2] });
		for (const input of [
			{ settingsVersions: [1, 1] },
			{ settingsVersions: [0] },
			{ settingsVersions: [Number.MAX_SAFE_INTEGER + 1] },
			{ settingsVersions: [1], unexpected: true },
		]) {
			expect(analyticsTimeContextInputSchema.safeParse(input).success).toBe(
				false,
			);
		}
	});

	it("keeps the current and historical mappings strict", () => {
		const output = {
			current: { settingsVersion: 9, timeZone: "Europe/London" },
			versions: [
				{ settingsVersion: 2, timeZone: "Asia/Riyadh" },
				{ settingsVersion: 7, timeZone: "America/New_York" },
			],
		};
		expect(analyticsTimeContextOutputSchema.parse(output)).toEqual(output);
		expect(
			analyticsTimeContextOutputSchema.safeParse({
				...output,
				current: { ...output.current, unexpected: true },
			}).success,
		).toBe(false);
		expect(
			analyticsTimeContextOutputSchema.safeParse({
				...output,
				current: { settingsVersion: 9, timeZone: "Not/A_Zone" },
			}).success,
		).toBe(false);
	});
});
