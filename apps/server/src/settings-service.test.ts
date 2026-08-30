import type { OwnerSettingsSnapshot } from "@fitway/api/settings/contracts";
import { describe, expect, it, vi } from "vitest";

import { createSettingsService } from "./settings-service";

const snapshot: OwnerSettingsSnapshot = {
	version: 3,
	effectiveFromUtc: "2026-08-30T12:00:00.000Z",
	editable: {
		capacity: 10,
		thresholds: {
			quietMaxPercent: 10,
			moderateMaxPercent: 20,
			busyMaxPercent: 30,
		},
		weeklySchedule: {
			sun: null,
			mon: null,
			tue: null,
			wed: null,
			thu: null,
			fri: null,
			sat: null,
		},
		businessDayBoundary: "00:00",
		resetBufferMinutes: 0,
	},
	operational: {
		timezone: "Asia/Riyadh",
		pushIntervalSeconds: 20,
		freshForSeconds: 90,
		operationalStaleAfterSeconds: 180,
		publicPollSeconds: 60,
	},
};

describe("settings service", () => {
	it("delegates the read to the repository unchanged", async () => {
		const readCurrentSnapshot = vi.fn().mockResolvedValue(snapshot);
		const service = createSettingsService({
			repository: {
				readCurrentSnapshot,
				updateSnapshot: vi.fn(),
			},
		});
		await expect(service.readOwnerSettings()).resolves.toBe(snapshot);
		expect(readCurrentSnapshot).toHaveBeenCalledOnce();
	});

	it("delegates the update with its actor and input unchanged", async () => {
		const updateSnapshot = vi.fn().mockResolvedValue({
			settings: snapshot,
			auditId: 5,
		});
		const service = createSettingsService({
			repository: {
				readCurrentSnapshot: vi.fn(),
				updateSnapshot,
			},
		});
		const input = {
			actorPrincipalId: "owner-1",
			expectedVersion: 3,
			editable: snapshot.editable,
		} as const;
		const output = await service.updateOwnerSettings(input);
		expect(output).toEqual({ settings: snapshot, auditId: 5 });
		expect(updateSnapshot).toHaveBeenCalledOnce();
		expect(updateSnapshot).toHaveBeenCalledWith(input);
	});

	it("carries no clock of its own: timing is entirely the repository's concern", () => {
		const service = createSettingsService({
			repository: { readCurrentSnapshot: vi.fn(), updateSnapshot: vi.fn() },
		});
		for (const key of Object.keys(service)) {
			expect(key.toLowerCase()).not.toContain("now");
		}
	});
});
