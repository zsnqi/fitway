import { describe, expect, it } from "vitest";
import { createReportingRepository } from "./reporting-repository";

const closedWeek = {
	scheduleSunOpen: null,
	scheduleSunClose: null,
	scheduleMonOpen: null,
	scheduleMonClose: null,
	scheduleTueOpen: null,
	scheduleTueClose: null,
	scheduleWedOpen: null,
	scheduleWedClose: null,
	scheduleThuOpen: "00:00:00",
	scheduleThuClose: "00:01:00",
	scheduleFriOpen: null,
	scheduleFriClose: null,
	scheduleSatOpen: null,
	scheduleSatClose: null,
};

const settingsRow = {
	version: 1,
	effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
	timeZone: "UTC",
	businessDayBoundary: "00:00:00",
	...closedWeek,
};

const observedRow = {
	minuteStartUtc: new Date("2026-07-16T00:00:00.000Z"),
	businessDay: "2026-07-16",
	count: 0,
	entries: 1,
	exits: 0,
	band: "quiet" as const,
	capacitySnapshot: 80,
	settingsVersion: 1,
	source: "live" as const,
};

type QueryRecord = string | { text: string; values?: unknown[] };

function fakeDatabase(options: {
	cursorRows?: readonly (typeof observedRow)[];
	minuteRows?: readonly (typeof observedRow)[];
}) {
	const counters = { settingsReads: 0, occupancyReads: 0, connections: 0 };
	const queries: QueryRecord[] = [];
	let fetchCount = 0;
	let released = false;
	const client = {
		async query(query: QueryRecord) {
			queries.push(query);
			const text = (
				typeof query === "string" ? query : query.text
			).toLowerCase();
			if (text.includes("from settings_versions")) {
				return { rows: [settingsRow] };
			}
			if (text.startsWith("fetch forward")) {
				fetchCount += 1;
				return {
					rows: fetchCount === 1 ? [...(options.cursorRows ?? [])] : [],
				};
			}
			return { rows: [] };
		},
		release() {
			released = true;
		},
	};
	const database = {
		$client: {
			async connect() {
				counters.connections += 1;
				return client;
			},
		},
		select(selection: Record<string, unknown>) {
			if ("minuteStartUtc" in selection) {
				counters.occupancyReads += 1;
				return {
					from() {
						return {
							where() {
								return {
									orderBy() {
										return Promise.resolve([...(options.minuteRows ?? [])]);
									},
								};
							},
						};
					},
				};
			}
			counters.settingsReads += 1;
			return {
				from() {
					return {
						orderBy() {
							return Promise.resolve([settingsRow]);
						},
					};
				},
			};
		},
	};
	return {
		database: database as never,
		counters,
		queries,
		wasReleased: () => released,
	};
}

describe("reporting repository", () => {
	it("uses one bounded occupancy range read and partitions in memory", async () => {
		const fake = fakeDatabase({ minuteRows: [observedRow] });
		const repository = createReportingRepository(fake.database);
		const report = await repository.readRange({
			startBusinessDay: "2026-07-16",
			endBusinessDay: "2026-07-16",
		});

		expect(fake.counters).toMatchObject({
			settingsReads: 1,
			occupancyReads: 1,
			connections: 0,
		});
		expect(report).toMatchObject({
			observedOpenMinutes: 1,
			expectedOpenMinutes: 1,
			averageOccupancy: 0,
			estimatedEntranceCrossings: 1,
		});
	});

	it("builds heatmap output from one repository range read", async () => {
		const fake = fakeDatabase({ minuteRows: [observedRow] });
		const heatmap = await createReportingRepository(fake.database).readHeatmap({
			startBusinessDay: "2026-07-16",
			endBusinessDay: "2026-07-16",
		});

		expect(fake.counters.occupancyReads).toBe(1);
		expect(
			heatmap.cells.find(
				(cell) => cell.weekday === "thu" && cell.localHour === 0,
			),
		).toMatchObject({
			state: "value",
			averageOccupancy: 0,
			observedOpenMinutes: 1,
			expectedOpenMinutes: 1,
			sampleDayCount: 1,
		});
	});

	it("enforces the CSV cap before opening a database connection", () => {
		const fake = fakeDatabase({});
		const repository = createReportingRepository(fake.database);
		expect(() =>
			repository.streamCsv({
				startBusinessDay: "2026-01-01",
				endBusinessDay: "2027-01-02",
			}),
		).toThrow(/366/);
		expect(fake.counters.connections).toBe(0);
	});

	it("streams a read-only cursor in bounded batches and releases it", async () => {
		const fake = fakeDatabase({ cursorRows: [observedRow] });
		const repository = createReportingRepository(fake.database, {
			csvFetchBatchSize: 1,
		});
		let csv = "";
		for await (const chunk of repository.streamCsv({
			startBusinessDay: "2026-07-16",
			endBusinessDay: "2026-07-16",
		})) {
			csv += chunk;
		}

		const renderedQueries = fake.queries.map((query) =>
			typeof query === "string" ? query : query.text,
		);
		const declaration = fake.queries.find(
			(query): query is { text: string; values?: unknown[] } =>
				typeof query !== "string" && /^declare /i.test(query.text.trim()),
		);
		expect(renderedQueries).toEqual(
			expect.arrayContaining([
				expect.stringMatching(/^begin transaction .*read only$/i),
				expect.stringMatching(/^fetch forward 1 /i),
				expect.stringMatching(/^close /i),
				"COMMIT",
			]),
		);
		expect(declaration?.values).toEqual(["2026-07-16", "2026-07-16"]);
		expect(fake.wasReleased()).toBe(true);
		expect(csv.startsWith("\uFEFFbusiness_day,")).toBe(true);
		expect(csv).toContain(
			"2026-07-16,2026-07-16T00:00:00.000Z,2026-07-16T00:00:00,UTC,value,0,1,0,quiet,80,1,live\r\n",
		);
		expect(csv).not.toMatch(/device|token/i);
	});

	it("closes and rolls back the cursor when the CSV consumer stops early", async () => {
		const fake = fakeDatabase({ cursorRows: [observedRow] });
		const stream = createReportingRepository(fake.database, {
			csvFetchBatchSize: 1,
		})
			.streamCsv({
				startBusinessDay: "2026-07-16",
				endBusinessDay: "2026-07-16",
			})
			[Symbol.asyncIterator]();

		expect(await stream.next()).toMatchObject({
			done: false,
			value: expect.stringMatching(/^\uFEFFbusiness_day,/),
		});
		await stream.return?.();

		const renderedQueries = fake.queries.map((query) =>
			typeof query === "string" ? query : query.text,
		);
		expect(renderedQueries).toEqual(
			expect.arrayContaining([expect.stringMatching(/^close /i), "ROLLBACK"]),
		);
		expect(renderedQueries).not.toContain("COMMIT");
		expect(fake.wasReleased()).toBe(true);
	});
});
