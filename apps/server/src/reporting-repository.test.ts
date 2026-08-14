import { describe, expect, it, vi } from "vitest";
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
	const releaseArguments: (boolean | undefined)[] = [];
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
		release(destroy?: boolean) {
			released = true;
			releaseArguments.push(destroy);
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
		releaseArguments,
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
		expect(fake.releaseArguments).toEqual([undefined]);
		expect(csv.startsWith("\uFEFFbusiness_day,")).toBe(true);
		expect(csv).toContain(
			"2026-07-16,2026-07-16T00:00:00.000Z,2026-07-16T00:00:00,UTC,value,0,1,0,quiet,80,1,live\r\n",
		);
		expect(csv).not.toMatch(/device|token/i);
	});

	it("installs only the parameterized transaction-local CSV statement timeout before reporting reads", async () => {
		for (const [csvStatementTimeoutMs, expected] of [
			[undefined, "30000"],
			[250, "250"],
		] as const) {
			const fake = fakeDatabase({ cursorRows: [observedRow] });
			const repository = createReportingRepository(fake.database, {
				csvFetchBatchSize: 1,
				...(csvStatementTimeoutMs === undefined
					? {}
					: { csvStatementTimeoutMs }),
			});
			for await (const _chunk of repository.streamCsv({
				startBusinessDay: "2026-07-16",
				endBusinessDay: "2026-07-16",
			})) {
				// Drain the stream to exercise the complete query order.
			}

			expect(fake.queries.slice(0, 3)).toEqual([
				"BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY",
				{
					text: "SELECT set_config('statement_timeout', $1, true)",
					values: [expected],
				},
				expect.stringContaining("FROM settings_versions"),
			]);
		}
	});

	it("rejects every CSV statement-timeout injection except 250 or 30000 ms", () => {
		const fake = fakeDatabase({});
		for (const csvStatementTimeoutMs of [
			0,
			249,
			251,
			30_001,
			Number.NaN,
			1.5,
		]) {
			expect(() =>
				createReportingRepository(fake.database, { csvStatementTimeoutMs }),
			).toThrow(/250 or 30000/);
		}
		expect(() =>
			createReportingRepository(fake.database, { csvStatementTimeoutMs: 250 }),
		).not.toThrow();
		expect(() =>
			createReportingRepository(fake.database, {
				csvStatementTimeoutMs: 30_000,
			}),
		).not.toThrow();
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
		expect(fake.releaseArguments).toEqual([undefined]);
	});

	it("destroys the client once when abort interrupts a pending FETCH", async () => {
		const queries: QueryRecord[] = [];
		const queryError = new Error("query destroyed");
		const abortReason = new Error("request aborted");
		const onCsvDiagnostic = vi.fn();
		let rejectFetch: ((error: Error) => void) | undefined;
		const release = vi.fn((destroy?: boolean) => {
			if (destroy) rejectFetch?.(queryError);
		});
		const client = {
			async query(query: QueryRecord) {
				queries.push(query);
				const text = typeof query === "string" ? query : query.text;
				if (text.includes("FROM settings_versions")) {
					return { rows: [settingsRow] };
				}
				if (/^FETCH FORWARD/u.test(text)) {
					return new Promise((_resolve, reject) => {
						rejectFetch = reject;
					});
				}
				return { rows: [] };
			},
			release,
		};
		const database = {
			$client: { connect: vi.fn().mockResolvedValue(client) },
		};
		const controller = new AbortController();
		const stream = createReportingRepository(database as never, {
			csvFetchBatchSize: 1,
			onCsvDiagnostic,
		})
			.streamCsv(
				{
					startBusinessDay: "2026-07-16",
					endBusinessDay: "2026-07-16",
				},
				controller.signal,
			)
			[Symbol.asyncIterator]();

		expect(await stream.next()).toMatchObject({ done: false });
		const pending = stream.next();
		await vi.waitFor(() =>
			expect(
				queries.some((query) =>
					/^FETCH FORWARD/u.test(
						typeof query === "string" ? query : query.text,
					),
				),
			).toBe(true),
		);
		controller.abort(abortReason);
		const outcome = await Promise.race([
			pending.then(
				(value) => ({ status: "resolved" as const, value }),
				(error) => ({ status: "rejected" as const, error }),
			),
			new Promise((resolve) =>
				setTimeout(() => resolve({ status: "timeout" as const }), 100),
			),
		]);

		expect(outcome).toEqual({ status: "rejected", error: abortReason });
		expect(release).toHaveBeenCalledOnce();
		expect(release).toHaveBeenCalledWith(true);
		expect(onCsvDiagnostic).toHaveBeenCalledOnce();
		expect(onCsvDiagnostic).toHaveBeenCalledWith("csv_abort");
		expect(
			queries.map((query) => (typeof query === "string" ? query : query.text)),
		).not.toEqual(
			expect.arrayContaining([expect.stringMatching(/^(CLOSE|ROLLBACK)/u)]),
		);
	});

	it("opens no database connection for an already-aborted export", async () => {
		const connect = vi.fn();
		const controller = new AbortController();
		const abortReason = new Error("already aborted");
		controller.abort(abortReason);
		const stream = createReportingRepository({ $client: { connect } } as never)
			.streamCsv(
				{
					startBusinessDay: "2026-07-16",
					endBusinessDay: "2026-07-16",
				},
				controller.signal,
			)
			[Symbol.asyncIterator]();

		await expect(stream.next()).rejects.toBe(abortReason);
		expect(connect).not.toHaveBeenCalled();
	});

	it("rejects an aborted pending acquisition promptly and destroys the late client", async () => {
		const abortReason = new Error("acquisition aborted");
		const query = vi.fn();
		const release = vi.fn();
		let resolveConnect:
			| ((client: { query: typeof query; release: typeof release }) => void)
			| undefined;
		let waitingCount = 1;
		const connect = vi.fn(
			() =>
				new Promise<{ query: typeof query; release: typeof release }>(
					(resolve) => {
						resolveConnect = (client) => {
							waitingCount = 0;
							resolve(client);
						};
					},
				),
		);
		const controller = new AbortController();
		const stream = createReportingRepository({ $client: { connect } } as never)
			.streamCsv(
				{
					startBusinessDay: "2026-07-16",
					endBusinessDay: "2026-07-16",
				},
				controller.signal,
			)
			[Symbol.asyncIterator]();
		const pending = stream.next();
		await vi.waitFor(() => expect(connect).toHaveBeenCalledOnce());

		controller.abort(abortReason);
		const outcome = await Promise.race([
			pending.then(
				(value) => ({ status: "resolved" as const, value }),
				(error) => ({ status: "rejected" as const, error }),
			),
			new Promise((resolve) =>
				setTimeout(() => resolve({ status: "timeout" as const }), 100),
			),
		]);
		expect(waitingCount).toBe(1);
		resolveConnect?.({ query, release });
		await vi.waitFor(() => expect(waitingCount).toBe(0));

		expect(outcome).toEqual({ status: "rejected", error: abortReason });
		await vi.waitFor(() => expect(release).toHaveBeenCalledOnce());
		expect(release).toHaveBeenCalledWith(true);
		expect(query).not.toHaveBeenCalled();
	});

	it("consumes a late acquisition rejection after returning the abort reason", async () => {
		const abortReason = new Error("acquisition aborted");
		const lateConnectError = new Error("late connection failure");
		let rejectConnect: ((error: Error) => void) | undefined;
		let waitingCount = 1;
		const connect = vi.fn(
			() =>
				new Promise<never>((_resolve, reject) => {
					rejectConnect = (error) => {
						waitingCount = 0;
						reject(error);
					};
				}),
		);
		const controller = new AbortController();
		const stream = createReportingRepository({ $client: { connect } } as never)
			.streamCsv(
				{
					startBusinessDay: "2026-07-16",
					endBusinessDay: "2026-07-16",
				},
				controller.signal,
			)
			[Symbol.asyncIterator]();
		const pending = stream.next();
		await vi.waitFor(() => expect(connect).toHaveBeenCalledOnce());

		controller.abort(abortReason);
		await expect(pending).rejects.toBe(abortReason);
		expect(waitingCount).toBe(1);
		rejectConnect?.(lateConnectError);
		await vi.waitFor(() => expect(waitingCount).toBe(0));
	});

	it("preserves SQLSTATE 57014 and reports only the timeout category without abort", async () => {
		const timeoutError = Object.assign(
			new Error("canceling statement due to statement timeout"),
			{ code: "57014" },
		);
		const queries: QueryRecord[] = [];
		const onCsvDiagnostic = vi.fn();
		const release = vi.fn();
		const client = {
			async query(query: QueryRecord) {
				queries.push(query);
				const text = typeof query === "string" ? query : query.text;
				if (/^FETCH FORWARD/u.test(text)) throw timeoutError;
				if (text.includes("FROM settings_versions")) {
					return { rows: [settingsRow] };
				}
				return { rows: [] };
			},
			release,
		};
		const stream = createReportingRepository(
			{ $client: { connect: vi.fn().mockResolvedValue(client) } } as never,
			{ csvFetchBatchSize: 1, csvStatementTimeoutMs: 250, onCsvDiagnostic },
		)
			.streamCsv({
				startBusinessDay: "2026-07-16",
				endBusinessDay: "2026-07-16",
			})
			[Symbol.asyncIterator]();

		expect(await stream.next()).toMatchObject({
			done: false,
			value: expect.stringMatching(/^\uFEFFbusiness_day,/),
		});
		await expect(stream.next()).rejects.toBe(timeoutError);
		expect(onCsvDiagnostic).toHaveBeenCalledOnce();
		expect(onCsvDiagnostic).toHaveBeenCalledWith("csv_statement_timeout");
		const renderedQueries = queries.map((query) =>
			typeof query === "string" ? query : query.text,
		);
		expect(renderedQueries).toEqual(
			expect.arrayContaining([expect.stringMatching(/^CLOSE /u), "ROLLBACK"]),
		);
		expect(renderedQueries).not.toContain("COMMIT");
		expect(release).toHaveBeenCalledOnce();
		expect(release).toHaveBeenCalledWith();
	});

	it("preserves a query failure when rollback and release also fail", async () => {
		const queryError = new Error("settings query failed");
		const rollbackError = new Error("rollback failed");
		const releaseError = new Error("release failed");
		const release = vi.fn(() => {
			throw releaseError;
		});
		const client = {
			async query(query: QueryRecord) {
				const text = typeof query === "string" ? query : query.text;
				if (text.includes("FROM settings_versions")) throw queryError;
				if (text === "ROLLBACK") throw rollbackError;
				return { rows: [] };
			},
			release,
		};
		const stream = createReportingRepository({
			$client: { connect: vi.fn().mockResolvedValue(client) },
		} as never)
			.streamCsv({
				startBusinessDay: "2026-07-16",
				endBusinessDay: "2026-07-16",
			})
			[Symbol.asyncIterator]();

		await expect(stream.next()).rejects.toBe(queryError);
		expect(release).toHaveBeenCalledOnce();
		expect(release).toHaveBeenCalledWith();
	});
});
