import { describe, expect, it } from "vitest";

import {
	editableOwnerSettingsSchema,
	operationalOwnerSettingsSchema,
	ownerSettingsSnapshotSchema,
	ownerSettingsUpdateInputSchema,
	ownerSettingsUpdateOutputSchema,
} from "./contracts";

const alwaysOpenSchedule = {
	sun: { open: "06:00", close: "23:00" },
	mon: { open: "06:00", close: "23:00" },
	tue: { open: "06:00", close: "23:00" },
	wed: { open: "06:00", close: "23:00" },
	thu: { open: "06:00", close: "23:00" },
	fri: { open: "13:00", close: "01:00" },
	sat: null,
};

const editable = {
	capacity: 220,
	thresholds: {
		quietMaxPercent: 30,
		moderateMaxPercent: 55,
		busyMaxPercent: 80,
	},
	weeklySchedule: alwaysOpenSchedule,
	businessDayBoundary: "04:00",
	resetBufferMinutes: 15,
};

const operational = {
	timezone: "Asia/Riyadh",
	pushIntervalSeconds: 20,
	freshForSeconds: 90,
	operationalStaleAfterSeconds: 180,
	publicPollSeconds: 60,
};

const snapshot = {
	version: 7,
	effectiveFromUtc: "2026-08-30T12:00:00.000Z",
	editable,
	operational,
};

describe("editable owner settings contract", () => {
	it("accepts the five editable axes with same-day, next-day, and equal-time sessions", () => {
		expect(
			editableOwnerSettingsSchema.safeParse({
				...editable,
				weeklySchedule: {
					...alwaysOpenSchedule,
					sun: { open: "06:00", close: "23:00" },
					mon: { open: "06:00", close: "06:00" },
					tue: { open: "22:00", close: "04:00" },
				},
			}).success,
		).toBe(true);
	});

	it("rejects unknown keys at every level", () => {
		expect(
			editableOwnerSettingsSchema.safeParse({
				...editable,
				timezone: "Asia/Riyadh",
			}).success,
		).toBe(false);
		expect(
			editableOwnerSettingsSchema.safeParse({
				...editable,
				thresholds: {
					...editable.thresholds,
					extra: 1,
				},
			}).success,
		).toBe(false);
		expect(
			editableOwnerSettingsSchema.safeParse({
				...editable,
				weeklySchedule: {
					...alwaysOpenSchedule,
					sun: { open: "06:00", close: "23:00", seconds: 0 },
				},
			}).success,
		).toBe(false);
	});

	it("rejects update input carrying operational, metadata, actor, or reason fields", () => {
		const forbiddenExtras: Array<Record<string, unknown>> = [
			{ timezone: "Asia/Riyadh" },
			{ pushIntervalSeconds: 20 },
			{ freshForSeconds: 90 },
			{ operationalStaleAfterSeconds: 180 },
			{ publicPollSeconds: 60 },
			{ version: 8 },
			{ effectiveFromUtc: "2026-08-30T12:00:00.000Z" },
			{ actorPrincipalId: "someone" },
			{ reason: "because" },
		];
		for (const extra of forbiddenExtras) {
			expect(
				ownerSettingsUpdateInputSchema.safeParse({
					expectedVersion: 7,
					editable,
					...extra,
				}).success,
			).toBe(false);
		}
		// A reason key inside the editable axes is an unknown key there too.
		expect(
			ownerSettingsUpdateInputSchema.safeParse({
				expectedVersion: 7,
				editable: { ...editable, reason: null },
			}).success,
		).toBe(false);
	});

	it("requires expectedVersion to be a positive safe integer", () => {
		for (const expectedVersion of [0, -1, 1.5, Number.NaN, 2 ** 53]) {
			expect(
				ownerSettingsUpdateInputSchema.safeParse({ expectedVersion, editable })
					.success,
			).toBe(false);
		}
	});

	it("applies the PostgreSQL integer storage boundary to capacity and reset buffer", () => {
		for (const capacity of [0, -1, 0.5, 2_147_483_648, Number.NaN]) {
			expect(
				editableOwnerSettingsSchema.safeParse({ ...editable, capacity })
					.success,
			).toBe(false);
		}
		expect(
			editableOwnerSettingsSchema.safeParse({ ...editable, capacity: 1 })
				.success,
		).toBe(true);
		expect(
			editableOwnerSettingsSchema.safeParse({
				...editable,
				capacity: 2_147_483_647,
			}).success,
		).toBe(true);
		for (const resetBufferMinutes of [-1, 0.5, 2_147_483_648]) {
			expect(
				editableOwnerSettingsSchema.safeParse({
					...editable,
					resetBufferMinutes,
				}).success,
			).toBe(false);
		}
		expect(
			editableOwnerSettingsSchema.safeParse({
				...editable,
				resetBufferMinutes: 0,
			}).success,
		).toBe(true);
		expect(
			editableOwnerSettingsSchema.safeParse({
				...editable,
				resetBufferMinutes: 2_147_483_647,
			}).success,
		).toBe(true);
	});

	it("rejects every threshold permutation that is not strictly ascending within 0..100", () => {
		const permutations: Array<[number, number, number]> = [
			[-1, 55, 80],
			[30, 30, 80],
			[55, 30, 80],
			[30, 80, 55],
			[80, 30, 55],
			[30, 55, 30],
			[30, 55, 101],
			[0, 1, 100],
		];
		for (const [
			quietMaxPercent,
			moderateMaxPercent,
			busyMaxPercent,
		] of permutations) {
			const accepted =
				quietMaxPercent === 0 &&
				moderateMaxPercent === 1 &&
				busyMaxPercent === 100;
			expect(
				editableOwnerSettingsSchema.safeParse({
					...editable,
					thresholds: { quietMaxPercent, moderateMaxPercent, busyMaxPercent },
				}).success,
			).toBe(accepted);
		}
	});

	it("requires exactly seven known weekdays and rejects partial or invalid days", () => {
		const { weeklySchedule: _omitted, ...withoutSchedule } = editable;
		for (const broken of [
			undefined,
			{ ...alwaysOpenSchedule, extra: null },
			{ ...alwaysOpenSchedule, mon: undefined },
			{ ...alwaysOpenSchedule, mon: { open: "06:00" } },
			{ ...alwaysOpenSchedule, mon: {} },
		]) {
			expect(
				editableOwnerSettingsSchema.safeParse({
					...withoutSchedule,
					weeklySchedule: broken as unknown,
				}).success,
			).toBe(false);
		}
	});

	it("rejects non-canonical or out-of-range clock values with Western digits only", () => {
		for (const bad of [
			"24:00",
			"07:60",
			"7:00",
			"07:0",
			"07:00:00",
			"07:00 ",
			" 07:00",
			"٠7:00",
			"07:00PM",
			"",
		]) {
			expect(
				editableOwnerSettingsSchema.safeParse({
					...editable,
					weeklySchedule: {
						...alwaysOpenSchedule,
						mon: { open: bad, close: "23:00" },
					},
				}).success,
			).toBe(false);
			expect(
				editableOwnerSettingsSchema.safeParse({
					...editable,
					businessDayBoundary: bad,
				}).success,
			).toBe(false);
		}
	});
});

describe("owner settings snapshot contract", () => {
	it("accepts the canonical read/update output shapes", () => {
		expect(ownerSettingsSnapshotSchema.safeParse(snapshot).success).toBe(true);
		expect(
			ownerSettingsUpdateOutputSchema.safeParse({
				settings: snapshot,
				auditId: 12,
			}).success,
		).toBe(true);
		expect(
			ownerSettingsUpdateOutputSchema.safeParse({ settings: snapshot }).success,
		).toBe(false);
	});

	it("requires a canonical YYYY-MM-DDTHH:mm:ss.sssZ effective instant", () => {
		for (const effectiveFromUtc of [
			"2026-08-30T12:00:00Z",
			"2026-08-30 12:00:00",
			"2026-08-30T12:00:00.000+03:00",
			"2026-08-30T12:00:00",
		]) {
			expect(
				ownerSettingsSnapshotSchema.safeParse({ ...snapshot, effectiveFromUtc })
					.success,
			).toBe(false);
		}
	});

	it("keeps operational timings positive and staleness after freshness", () => {
		expect(operationalOwnerSettingsSchema.safeParse(operational).success).toBe(
			true,
		);
		for (const broken of [
			{ ...operational, pushIntervalSeconds: 0 },
			{ ...operational, freshForSeconds: 0 },
			{ ...operational, publicPollSeconds: -5 },
			{
				...operational,
				freshForSeconds: 180,
				operationalStaleAfterSeconds: 180,
			},
			{
				...operational,
				freshForSeconds: 200,
				operationalStaleAfterSeconds: 180,
			},
			{ ...operational, timezone: "" },
		]) {
			expect(operationalOwnerSettingsSchema.safeParse(broken).success).toBe(
				false,
			);
		}
	});

	it("rejects unknown keys in the snapshot and a non-positive version", () => {
		expect(
			ownerSettingsSnapshotSchema.safeParse({ ...snapshot, extra: 1 }).success,
		).toBe(false);
		expect(
			ownerSettingsSnapshotSchema.safeParse({ ...snapshot, version: 0 })
				.success,
		).toBe(false);
		expect(
			ownerSettingsSnapshotSchema.safeParse({ ...snapshot, version: 1.5 })
				.success,
		).toBe(false);
	});
});
