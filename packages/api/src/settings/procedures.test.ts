import type { CanonicalAuthContext } from "@fitway/auth";
import { call, ORPCError } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

import type { Context } from "../context";
import type { OwnerSettingsSnapshot } from "./contracts";
import { adminSettingsProcedures } from "./procedures";

const snapshot: OwnerSettingsSnapshot = {
	version: 7,
	effectiveFromUtc: "2026-08-30T12:00:00.000Z",
	editable: {
		capacity: 220,
		thresholds: {
			quietMaxPercent: 30,
			moderateMaxPercent: 55,
			busyMaxPercent: 80,
		},
		weeklySchedule: {
			sun: { open: "06:00", close: "23:00" },
			mon: { open: "06:00", close: "23:00" },
			tue: { open: "06:00", close: "23:00" },
			wed: { open: "06:00", close: "23:00" },
			thu: { open: "06:00", close: "23:00" },
			fri: { open: "13:00", close: "01:00" },
			sat: null,
		},
		businessDayBoundary: "04:00",
		resetBufferMinutes: 15,
	},
	operational: {
		timezone: "Asia/Riyadh",
		pushIntervalSeconds: 20,
		freshForSeconds: 90,
		operationalStaleAfterSeconds: 180,
		publicPollSeconds: 60,
	},
};

const ownerAuth = {
	principalId: "owner-1",
	principalKind: "owner",
	role: "owner",
	sessionId: "session-1",
	expiresAt: new Date("2026-08-30T13:00:00.000Z"),
	active: true,
} as CanonicalAuthContext;

const staffAuth = {
	...ownerAuth,
	principalId: "staff-1",
	principalKind: "shared_staff",
	role: "staff",
} as CanonicalAuthContext;

function contextFor(options: {
	auth: CanonicalAuthContext | null;
	readOwnerSettings?: Context["readOwnerSettings"];
	updateOwnerSettings?: Context["updateOwnerSettings"];
}) {
	return {
		context: {
			auth: options.auth,
			readOwnerSettings: options.readOwnerSettings,
			updateOwnerSettings: options.updateOwnerSettings,
		},
	};
}

function readerStub(
	value: OwnerSettingsSnapshot,
): Context["readOwnerSettings"] {
	return vi
		.fn()
		.mockResolvedValue(value) as unknown as Context["readOwnerSettings"];
}

function updaterStub(
	value: unknown,
): Context["updateOwnerSettings"] & ReturnType<typeof vi.fn> {
	return vi
		.fn()
		.mockResolvedValue(value) as unknown as Context["updateOwnerSettings"] &
		ReturnType<typeof vi.fn>;
}

function rejectingUpdater(error: unknown): Context["updateOwnerSettings"] {
	return vi
		.fn()
		.mockRejectedValue(error) as unknown as Context["updateOwnerSettings"];
}

const updateInput = {
	expectedVersion: 7,
	editable: snapshot.editable,
};

describe("admin.settings.read", () => {
	it("requires an authenticated owner", async () => {
		await expect(
			call(adminSettingsProcedures.read, undefined, contextFor({ auth: null })),
		).rejects.toThrow(ORPCError);
		await expect(
			call(
				adminSettingsProcedures.read,
				undefined,
				contextFor({ auth: staffAuth }),
			),
		).rejects.toThrow(ORPCError);
	});

	it("returns the current snapshot through the injected reader", async () => {
		const readOwnerSettings = readerStub(snapshot);
		const output = await call(
			adminSettingsProcedures.read,
			undefined,
			contextFor({ auth: ownerAuth, readOwnerSettings }),
		);
		expect(output).toEqual(snapshot);
		expect(readOwnerSettings).toHaveBeenCalledOnce();
	});

	it("stays a generic 500 when no reader is wired", async () => {
		await expect(
			call(
				adminSettingsProcedures.read,
				undefined,
				contextFor({ auth: ownerAuth }),
			),
		).rejects.toThrow(ORPCError);
	});
});

describe("admin.settings.update", () => {
	it("requires an authenticated owner", async () => {
		await expect(
			call(
				adminSettingsProcedures.update,
				updateInput,
				contextFor({ auth: null }),
			),
		).rejects.toThrow(ORPCError);
		await expect(
			call(
				adminSettingsProcedures.update,
				updateInput,
				contextFor({ auth: staffAuth }),
			),
		).rejects.toThrow(ORPCError);
	});

	it("passes the context actor, never a caller-supplied one", async () => {
		const updateOwnerSettings = updaterStub({ settings: snapshot, auditId: 1 });
		await call(
			adminSettingsProcedures.update,
			updateInput,
			contextFor({ auth: ownerAuth, updateOwnerSettings }),
		);
		expect(updateOwnerSettings).toHaveBeenCalledWith({
			actorPrincipalId: "owner-1",
			...updateInput,
		});
	});

	it("maps the typed settings conflict to a stable CONFLICT code", async () => {
		const conflict = Object.assign(
			new Error("Settings were updated by someone else"),
			{
				name: "SettingsVersionConflictError",
				code: "settings_version_conflict",
			},
		);
		await expect(
			call(
				adminSettingsProcedures.update,
				updateInput,
				contextFor({
					auth: ownerAuth,
					updateOwnerSettings: rejectingUpdater(conflict),
				}),
			),
		).rejects.toMatchObject({
			code: "CONFLICT",
			data: { code: "settings_version_conflict" },
		});
	});

	it("propagates unexpected failures unmapped for the transport's generic 500", async () => {
		// The procedure deliberately does not catch-and-rewrite unexpected
		// failures: only the typed conflict is mapped, and the oRPC transport
		// converts everything else to a generic 500 with no internals exposed.
		// The wire-level 500 is proven by the real-transport integration test.
		await expect(
			call(
				adminSettingsProcedures.update,
				updateInput,
				contextFor({
					auth: ownerAuth,
					updateOwnerSettings: rejectingUpdater(
						new Error("insert failed: secrets"),
					),
				}),
			),
		).rejects.toThrow("insert failed");
	});

	it("rejects malformed input before any writer runs", async () => {
		const updateOwnerSettings = updaterStub({ settings: snapshot, auditId: 1 });
		await expect(
			call(
				adminSettingsProcedures.update,
				{ expectedVersion: 7, editable: { ...snapshot.editable, capacity: 0 } },
				contextFor({ auth: ownerAuth, updateOwnerSettings }),
			),
		).rejects.toThrow(ORPCError);
		expect(updateOwnerSettings).not.toHaveBeenCalled();
	});
});
