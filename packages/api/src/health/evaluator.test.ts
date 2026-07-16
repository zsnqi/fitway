import { describe, expect, it } from "vitest";
import {
	type EdgeHealthProjection,
	type EdgeHealthStatus,
	evaluateOperationalHealth,
} from "./evaluator";

const now = new Date("2026-07-16T12:00:00.000Z");

function projection(
	overrides: Partial<EdgeHealthProjection> = {},
): EdgeHealthProjection {
	return {
		deviceId: "11111111-1111-1111-1111-111111111111",
		sequence: 5,
		processStatus: "ok",
		cameraStatus: "ok",
		feedStatus: "ok",
		detectorFps: 4.8,
		edgeObservedAt: new Date("2026-07-16T11:59:58.000Z"),
		receivedAt: new Date("2026-07-16T11:59:00.000Z"),
		updatedAt: new Date("2026-07-16T11:59:00.000Z"),
		...overrides,
	};
}

const enabledDevice = {
	enabled: true,
	lastSeenAt: new Date("2026-07-16T11:59:00.000Z"),
};

describe("evaluateOperationalHealth freshness", () => {
	it("is current when trusted age is strictly below the threshold", () => {
		const health = evaluateOperationalHealth({
			device: enabledDevice,
			projection: projection({
				receivedAt: new Date(now.getTime() - 179_000),
			}),
			operationalStaleAfterSeconds: 180,
			now,
		});
		expect(health.freshness).toBe("current");
		expect(health.condition).toBe("healthy");
		expect(health.process).toBe("ok");
		expect(health.detectorFps).toBe(4.8);
		expect(health.staleAt).toBe(
			new Date(now.getTime() - 179_000 + 180_000).toISOString(),
		);
	});

	it("is stale exactly at the threshold boundary", () => {
		const health = evaluateOperationalHealth({
			device: enabledDevice,
			projection: projection({
				receivedAt: new Date(now.getTime() - 180_000),
			}),
			operationalStaleAfterSeconds: 180,
			now,
		});
		expect(health.freshness).toBe("stale");
	});

	it("is stale beyond the threshold but never erases the last-known flags", () => {
		const health = evaluateOperationalHealth({
			device: enabledDevice,
			projection: projection({
				receivedAt: new Date(now.getTime() - 600_000),
				processStatus: "degraded",
				cameraStatus: "ok",
				feedStatus: "ok",
				detectorFps: 2.5,
			}),
			operationalStaleAfterSeconds: 180,
			now,
		});
		expect(health.freshness).toBe("stale");
		expect(health.condition).toBe("degraded");
		expect(health.process).toBe("degraded");
		expect(health.detectorFps).toBe(2.5);
		expect(health.receivedAt).toBe(
			new Date(now.getTime() - 600_000).toISOString(),
		);
	});

	it("treats a future trusted receipt as current", () => {
		const health = evaluateOperationalHealth({
			device: enabledDevice,
			projection: projection({ receivedAt: new Date(now.getTime() + 5_000) }),
			operationalStaleAfterSeconds: 180,
			now,
		});
		expect(health.freshness).toBe("current");
	});

	it("preserves a null detectorFps as unknown rather than zero", () => {
		const health = evaluateOperationalHealth({
			device: enabledDevice,
			projection: projection({ detectorFps: null }),
			operationalStaleAfterSeconds: 180,
			now,
		});
		expect(health.detectorFps).toBeNull();
	});
});

describe("evaluateOperationalHealth condition precedence", () => {
	const cases: Array<{
		flags: [EdgeHealthStatus, EdgeHealthStatus, EdgeHealthStatus];
		condition: string;
	}> = [
		{ flags: ["ok", "failed", "degraded"], condition: "failed" },
		{ flags: ["degraded", "ok", "unknown"], condition: "degraded" },
		{ flags: ["ok", "unknown", "ok"], condition: "unknown" },
		{ flags: ["ok", "ok", "ok"], condition: "healthy" },
	];
	for (const { flags, condition } of cases) {
		it(`resolves ${flags.join("/")} to ${condition}`, () => {
			const health = evaluateOperationalHealth({
				device: enabledDevice,
				projection: projection({
					receivedAt: new Date(now.getTime() - 1_000),
					processStatus: flags[0],
					cameraStatus: flags[1],
					feedStatus: flags[2],
				}),
				operationalStaleAfterSeconds: 180,
				now,
			});
			expect(health.condition).toBe(condition);
		});
	}
});

describe("evaluateOperationalHealth unavailable", () => {
	const nulledRaw = {
		condition: "unknown",
		process: null,
		camera: null,
		feed: null,
		detectorFps: null,
		edgeObservedAt: null,
		receivedAt: null,
		staleAt: null,
	};

	it("is unavailable with a nulled block when there is no projection", () => {
		const health = evaluateOperationalHealth({
			device: enabledDevice,
			projection: null,
			operationalStaleAfterSeconds: 180,
			now,
		});
		expect(health).toMatchObject({ freshness: "unavailable", ...nulledRaw });
		expect(health.lastSeenAt).toBe(enabledDevice.lastSeenAt.toISOString());
	});

	it("is unavailable with no known lastSeenAt when there is no active device", () => {
		const health = evaluateOperationalHealth({
			device: null,
			projection: projection(),
			operationalStaleAfterSeconds: 180,
			now,
		});
		expect(health).toMatchObject({
			freshness: "unavailable",
			lastSeenAt: null,
			...nulledRaw,
		});
	});

	it("is unavailable for a disabled device yet still surfaces lastSeenAt", () => {
		const health = evaluateOperationalHealth({
			device: {
				enabled: false,
				lastSeenAt: new Date("2026-07-16T10:00:00.000Z"),
			},
			projection: projection({ processStatus: "failed" }),
			operationalStaleAfterSeconds: 180,
			now,
		});
		expect(health).toMatchObject({ freshness: "unavailable", ...nulledRaw });
		expect(health.lastSeenAt).toBe("2026-07-16T10:00:00.000Z");
	});

	it("is unavailable when the stale threshold is unusable", () => {
		expect(
			evaluateOperationalHealth({
				device: enabledDevice,
				projection: projection(),
				operationalStaleAfterSeconds: null,
				now,
			}).freshness,
		).toBe("unavailable");
	});
});
