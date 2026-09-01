import { describe, expect, it } from "vitest";
import {
	buildDemoProfile,
	profileFingerprint,
	riyadhBusinessDay,
} from "./seed";

describe("desktop demo seed profile", () => {
	it("anchors 28 deterministic days to the Riyadh business day", () => {
		const beforeBoundary = new Date("2026-09-01T00:30:00.000Z"); // 03:30 Riyadh
		const afterBoundary = new Date("2026-09-01T01:30:00.000Z"); // 04:30 Riyadh
		expect(
			new Date(riyadhBusinessDay(beforeBoundary)).toISOString().slice(0, 10),
		).toBe("2026-08-31");
		expect(
			new Date(riyadhBusinessDay(afterBoundary)).toISOString().slice(0, 10),
		).toBe("2026-09-01");
		const profile = buildDemoProfile(afterBoundary);
		expect(profile.days).toBe(28);
		expect(profile.historyStartUtc).toBe("2026-08-05T01:00:00.000Z");
		expect(profile.observedThroughUtc).toBe("2026-09-01T01:00:00.000Z");
		expect(profileFingerprint(profile)).toBe(
			profileFingerprint(buildDemoProfile(afterBoundary)),
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
});
