import type { OwnerSettingsSnapshot } from "@fitway/api/settings/contracts";
import type { settingsVersions } from "@fitway/db/schema/application";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import {
	createSettingsRepository,
	mapSettingsRow,
	SettingsInvariantError,
	SettingsVersionConflictError,
} from "./settings-repository";

type SettingsRow = typeof settingsVersions.$inferSelect;

const capturedInstant = new Date("2026-08-30T12:00:00.000Z");

function rowFixture(overrides: Partial<SettingsRow> = {}): SettingsRow {
	return {
		version: 7,
		capacity: 100,
		quietMaxPercent: 25,
		moderateMaxPercent: 50,
		busyMaxPercent: 75,
		timezone: "Asia/Riyadh",
		businessDayBoundary: "04:00:00",
		pushIntervalSeconds: 20,
		freshForSeconds: 90,
		operationalStaleAfterSeconds: 180,
		publicPollSeconds: 60,
		resetBufferMinutes: 30,
		scheduleSunOpen: "06:00:00",
		scheduleSunClose: "23:00:00",
		scheduleMonOpen: "06:00:00",
		scheduleMonClose: "23:00:00",
		scheduleTueOpen: "06:00:00",
		scheduleTueClose: "23:00:00",
		scheduleWedOpen: "06:00:00",
		scheduleWedClose: "23:00:00",
		scheduleThuOpen: "06:00:00",
		scheduleThuClose: "23:00:00",
		scheduleFriOpen: "13:00:00",
		scheduleFriClose: "01:00:00",
		scheduleSatOpen: null,
		scheduleSatClose: null,
		effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
		createdAt: new Date("2026-07-01T00:00:00.000Z"),
		createdBy: null,
		...overrides,
	};
}

const editableFixture = {
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
} as const;

describe("settings row mapping", () => {
	it("normalizes database wall times to canonical HH:mm at the boundary", () => {
		const snapshot = mapSettingsRow(rowFixture());
		expect(snapshot.effectiveFromUtc).toBe("2026-07-01T00:00:00.000Z");
		expect(snapshot.editable.businessDayBoundary).toBe("04:00");
		expect(snapshot.editable.weeklySchedule.sun).toEqual({
			open: "06:00",
			close: "23:00",
		});
		expect(snapshot.editable.weeklySchedule.fri).toEqual({
			open: "13:00",
			close: "01:00",
		});
		expect(snapshot.editable.weeklySchedule.sat).toBeNull();
	});

	it("fails a partial stored schedule pair instead of repairing it", () => {
		expect(() =>
			mapSettingsRow(
				rowFixture({ scheduleSatOpen: null, scheduleSatClose: "10:00:00" }),
			),
		).toThrow(SettingsInvariantError);
	});

	it("fails a malformed stored wall time instead of defaulting it", () => {
		expect(() =>
			mapSettingsRow(rowFixture({ businessDayBoundary: "bad" })),
		).toThrow(SettingsInvariantError);
	});
});

type Database = Parameters<typeof createSettingsRepository>[0]["database"];
type RecordedCall = { kind: "execute" | "clock" | "insert" | "select" };

const actorPrincipalId = "owner-1";

/**
 * A minimal fake client that records the operation order the specification
 * cares about: the advisory lock executes before the clock is read, the clock
 * is read exactly once, and the inserted values copy the locked row forward.
 */
function fakeRepository(options: {
	currentRows: SettingsRow[];
	insertResults: Array<Record<string, unknown>[]>;
}) {
	const calls: RecordedCall[] = [];
	const insertedValues: Array<Record<string, unknown>> = [];
	const executedSql: string[] = [];

	const selectChain = (rows: unknown[]) => {
		const chain: Record<string, unknown> = {};
		for (const method of ["from", "where", "orderBy"]) {
			chain[method] = () => chain;
		}
		chain.limit = () => Promise.resolve(rows);
		return chain;
	};

	const makeClient = () => ({
		select: () => {
			calls.push({ kind: "select" });
			return {
				from: () => {
					const row = options.currentRows.shift();
					return selectChain(row ? [row] : []);
				},
			};
		},
		insert: () => ({
			values: (value: Record<string, unknown>) => {
				calls.push({ kind: "insert" });
				insertedValues.push(value);
				return {
					returning: () => Promise.resolve(options.insertResults.shift() ?? []),
				};
			},
		}),
		execute: (statement: unknown) => {
			calls.push({ kind: "execute" });
			executedSql.push(new PgDialect().sqlToQuery(statement as never).sql);
			return Promise.resolve({ rows: [] });
		},
	});

	const now = vi.fn(() => {
		calls.push({ kind: "clock" });
		return capturedInstant;
	});

	const database = {
		...makeClient(),
		transaction: async <T>(work: (tx: unknown) => Promise<T>): Promise<T> =>
			work(makeClient()),
	};

	return {
		repository: createSettingsRepository({
			database: database as unknown as Database,
			now: now as () => Date,
		}),
		calls,
		insertedValues,
		executedSql,
	};
}

describe("settings repository update", () => {
	it("locks first, then captures the clock exactly once", async () => {
		const fake = fakeRepository({
			currentRows: [rowFixture()],
			insertResults: [
				[
					{
						...rowFixture({ version: 8 }),
						effectiveFrom: capturedInstant,
						createdAt: capturedInstant,
					},
				],
				// The audit append shares the transaction and resolves second.
				[{ id: 42 }],
			],
		});
		await fake.repository.updateSnapshot({
			actorPrincipalId,
			expectedVersion: 7,
			editable: editableFixture as never,
		});
		const kinds = fake.calls.map((call) => call.kind);
		expect(kinds.indexOf("execute")).toBeLessThan(kinds.indexOf("clock"));
		expect(fake.calls.filter((call) => call.kind === "clock")).toHaveLength(1);
		expect(fake.executedSql[0]).toContain("pg_advisory_xact_lock");
	});

	it("conflicts on a stale expected version before any insert", async () => {
		const fake = fakeRepository({
			currentRows: [rowFixture({ version: 9 })],
			insertResults: [],
		});
		await expect(
			fake.repository.updateSnapshot({
				actorPrincipalId,
				expectedVersion: 7,
				editable: editableFixture as never,
			}),
		).rejects.toBeInstanceOf(SettingsVersionConflictError);
		expect(fake.insertedValues).toHaveLength(0);
		expect(fake.calls.some((call) => call.kind === "insert")).toBe(false);
	});

	it("appends one complete snapshot copying the locked operational values forward", async () => {
		const locked = rowFixture({
			timezone: "Europe/Berlin",
			pushIntervalSeconds: 33,
			freshForSeconds: 111,
			operationalStaleAfterSeconds: 444,
			publicPollSeconds: 77,
		});
		const fake = fakeRepository({
			currentRows: [locked],
			insertResults: [
				[
					{
						...rowFixture({ version: 8 }),
						effectiveFrom: capturedInstant,
						createdAt: capturedInstant,
						createdBy: actorPrincipalId,
					},
				],
				[{ id: 42 }],
			],
		});
		const output = await fake.repository.updateSnapshot({
			actorPrincipalId,
			expectedVersion: 7,
			editable: editableFixture as never,
		});
		const values = fake.insertedValues[0];
		if (!values) throw new Error("No settings insert was recorded");
		expect(values.timezone).toBe("Europe/Berlin");
		expect(values.pushIntervalSeconds).toBe(33);
		expect(values.freshForSeconds).toBe(111);
		expect(values.operationalStaleAfterSeconds).toBe(444);
		expect(values.publicPollSeconds).toBe(77);
		expect(values.capacity).toBe(220);
		expect(values.resetBufferMinutes).toBe(15);
		expect(values.createdBy).toBe(actorPrincipalId);
		expect(values.effectiveFrom).toBe(capturedInstant);
		expect(values.createdAt).toBe(capturedInstant);
		expect(values.scheduleSatOpen).toBeNull();
		expect(values.scheduleFriOpen).toBe("13:00");
		// One settings insert plus one audit insert in the same transaction.
		expect(fake.insertedValues).toHaveLength(2);
		expect(output.settings.version).toBe(8);
		expect(output.settings.effectiveFromUtc).toBe("2026-08-30T12:00:00.000Z");
		expect(output.auditId).toBeGreaterThan(0);
	});

	it("fails without fabricating a snapshot when history is missing", async () => {
		const fake = fakeRepository({ currentRows: [], insertResults: [] });
		await expect(fake.repository.readCurrentSnapshot()).rejects.toBeInstanceOf(
			SettingsInvariantError,
		);
	});

	it("reads the current effective snapshot with one clock call and no lock", async () => {
		const fake = fakeRepository({
			currentRows: [rowFixture()],
			insertResults: [],
		});
		const snapshot: OwnerSettingsSnapshot =
			await fake.repository.readCurrentSnapshot();
		expect(snapshot.version).toBe(7);
		expect(fake.calls.map((call) => call.kind)).toEqual(["clock", "select"]);
	});
});
