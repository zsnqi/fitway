import { describe, expect, it } from "vitest";
import {
	buildDemoProfile,
	demoOccupancyCount,
	demoSimulatorSeed,
	profileFingerprint,
	riyadhBusinessDay,
	shapeDemoHistory,
} from "./seed";

describe("desktop demo seed profile", () => {
	it("anchors 28 days to a reproducible five-minute Riyadh snapshot", () => {
		const beforeBoundary = new Date("2026-09-01T00:30:00.000Z"); // 03:30 Riyadh
		const afterBoundary = new Date("2026-09-01T01:31:00.000Z"); // 04:31 Riyadh
		expect(
			new Date(riyadhBusinessDay(beforeBoundary)).toISOString().slice(0, 10),
		).toBe("2026-08-31");
		expect(
			new Date(riyadhBusinessDay(afterBoundary)).toISOString().slice(0, 10),
		).toBe("2026-09-01");
		const profile = buildDemoProfile(afterBoundary);
		const sameSnapshot = buildDemoProfile(new Date("2026-09-01T01:34:59.000Z"));
		const nextSnapshot = buildDemoProfile(new Date("2026-09-01T01:35:00.000Z"));
		expect(profile.days).toBe(28);
		expect(profile.historyStartUtc).toBe("2026-08-05T01:00:00.000Z");
		expect(profile.observedThroughUtc).toBe("2026-09-01T01:30:00.000Z");
		expect(sameSnapshot).toEqual(profile);
		expect(nextSnapshot.observedThroughUtc).toBe("2026-09-01T01:35:00.000Z");
		expect(profileFingerprint(profile)).not.toBe(
			profileFingerprint(nextSnapshot),
		);
		const row = {
			minuteStartUtc: new Date("2026-08-05T01:00:00.000Z"),
			businessDay: "2026-08-05",
			count: 12,
			entries: 1,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 120,
			settingsVersion: 2,
			source: "live",
		};
		expect(profileFingerprint(profile, [row])).toBe(
			profileFingerprint(profile, [row]),
		);
		expect(profileFingerprint(profile, [row])).not.toBe(
			profileFingerprint(profile, [{ ...row, count: 13 }]),
		);
	});

	it("builds a varied gym-shaped curve and coherent minute movements", () => {
		const businessDay = "2026-09-01";
		const overnight = demoOccupancyCount(
			new Date("2026-09-01T23:00:00.000Z"),
			businessDay,
		);
		const morning = demoOccupancyCount(
			new Date("2026-09-01T04:00:00.000Z"),
			businessDay,
		);
		const evening = demoOccupancyCount(
			new Date("2026-09-01T16:00:00.000Z"),
			businessDay,
		);
		expect(morning).toBeGreaterThan(overnight);
		expect(evening).toBeGreaterThan(morning);
		expect([overnight, morning, evening]).toEqual(
			expect.arrayContaining([
				expect.any(Number),
				expect.any(Number),
				expect.any(Number),
			]),
		);
		for (const count of [overnight, morning, evening]) {
			expect(count).toBeGreaterThanOrEqual(2);
			expect(count).toBeLessThanOrEqual(120);
		}

		const shaped = shapeDemoHistory([
			{
				minuteStartUtc: new Date("2026-09-01T15:59:00.000Z"),
				businessDay,
				settingsVersion: 2,
			},
			{
				minuteStartUtc: new Date("2026-09-01T16:00:00.000Z"),
				businessDay,
				settingsVersion: 2,
			},
		]);
		expect(shaped.every((row) => row.source === "backfill")).toBe(true);
		expect(
			(shaped[1]?.entries ?? 0) + (shaped[1]?.exits ?? 0),
		).toBeGreaterThanOrEqual(0);
		expect(Math.abs((shaped[1]?.count ?? 0) - (shaped[0]?.count ?? 0))).toBe(
			(shaped[1]?.entries ?? 0) + (shaped[1]?.exits ?? 0),
		);
	});

	it("derives a stable per-day simulator seed for a coherent live tail", () => {
		const first = demoSimulatorSeed("2026-09-01");
		expect(demoSimulatorSeed("2026-09-01")).toBe(first);
		expect(demoSimulatorSeed("2026-09-02")).not.toBe(first);
		for (const seed of [first, demoSimulatorSeed("2026-09-02")]) {
			expect(Number.isSafeInteger(seed)).toBe(true);
			expect(seed).toBeGreaterThanOrEqual(0);
			expect(seed).toBeLessThan(2_147_483_647);
		}
	});
});
