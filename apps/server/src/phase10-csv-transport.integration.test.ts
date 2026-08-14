import { randomBytes, randomInt, randomUUID } from "node:crypto";
import path from "node:path";
import { AuthService } from "@fitway/auth";
import * as applicationSchema from "@fitway/db/schema/application";
import {
	edgeDevices,
	occupancyMinutes,
	settingsVersions,
} from "@fitway/db/schema/application";
import * as authSchema from "@fitway/db/schema/auth";
import { serve } from "@hono/node-server";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool, type PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PinRateLimiter } from "./auth/pin-rate-limiter";
import { PostgresAuthRepository } from "./auth/postgres-auth-repository";
import { createReportingRepository } from "./reporting-repository";
import { assertDisposableIntegrationDatabase } from "./test-support/integration-database-safety";

const connectionString = process.env.TEST_DATABASE_URL;
assertDisposableIntegrationDatabase({
	connectionString,
	resetMarker: process.env.FITWAY_INTEGRATION_RESET_DATABASE,
	runId: process.env.FITWAY_RUN_ID,
});
const secret = randomBytes(32).toString("base64url");
process.env.BETTER_AUTH_SECRET = secret;
process.env.BETTER_AUTH_URL = "http://127.0.0.1/api/auth";
process.env.CORS_ORIGIN = "http://127.0.0.1";
process.env.NODE_ENV = "test";

const pool = new Pool({ connectionString });
const database = drizzle(pool, {
	schema: { ...applicationSchema, ...authSchema },
});
const authService = new AuthService({
	repository: new PostgresAuthRepository(
		database as unknown as typeof import("@fitway/db").db,
	),
	pepper: secret,
	cookieSecret: secret,
});
const runtime = {
	service: authService,
	staffPinLimiter: new PinRateLimiter(),
	ownerLoginLimiter: new PinRateLimiter(),
};
let server: ReturnType<typeof serve>;
let baseUrl = "";
let staffCookie = "";
let ownerCookie = "";
let historicalSettingsVersion = 0;
let ownerEmail = "";

const csvRange = {
	startBusinessDay: "2026-08-10",
	endBusinessDay: "2026-08-10",
} as const;
const csvHeader =
	"business_day,minute_start_utc,minute_start_local,time_zone,state,count,entries,exits,band,capacity_snapshot,settings_version,source";
const privateDeviceName = "phase10-private-device-name";
const privateTokenHash = "f".repeat(64);
const oneMinuteWindowSchedule = {
	scheduleSunOpen: "04:00",
	scheduleSunClose: "04:03",
	scheduleMonOpen: "04:00",
	scheduleMonClose: "04:03",
	scheduleTueOpen: "04:00",
	scheduleTueClose: "04:03",
	scheduleWedOpen: "04:00",
	scheduleWedClose: "04:03",
	scheduleThuOpen: "04:00",
	scheduleThuClose: "04:03",
	scheduleFriOpen: "04:00",
	scheduleFriClose: "04:03",
	scheduleSatOpen: "04:00",
	scheduleSatClose: "04:03",
} as const;

type SseReader = {
	reader: ReadableStreamDefaultReader<Uint8Array>;
	decode: (value: Uint8Array) => string;
	buffer: string;
};

function openSse(response: Response): SseReader {
	if (!response.body) throw new Error("CSV RPC response has no body");
	const decoder = new TextDecoder();
	return {
		reader: response.body.getReader(),
		decode: (value) => decoder.decode(value, { stream: true }),
		buffer: "",
	};
}

async function nextSseEvent(
	stream: SseReader,
): Promise<{ event: string; data?: unknown } | null> {
	while (true) {
		const boundary = stream.buffer.indexOf("\n\n");
		if (boundary >= 0) {
			const frame = stream.buffer.slice(0, boundary);
			stream.buffer = stream.buffer.slice(boundary + 2);
			const lines = frame.split("\n");
			const event = lines
				.find((line) => line.startsWith("event: "))
				?.slice("event: ".length);
			const data = lines
				.filter((line) => line.startsWith("data: "))
				.map((line) => line.slice("data: ".length))
				.join("\n");
			if (!event) continue;
			return { event, ...(data ? { data: JSON.parse(data) } : {}) };
		}

		const result = await stream.reader.read();
		if (result.done) return null;
		stream.buffer += stream.decode(result.value).replaceAll("\r\n", "\n");
	}
}

async function nextCsvChunk(stream: SseReader): Promise<string | null> {
	while (true) {
		const event = await nextSseEvent(stream);
		if (!event || event.event === "done") return null;
		if (event.event === "error") {
			throw new Error(
				`CSV RPC emitted an error event: ${JSON.stringify(event.data)}`,
			);
		}
		if (event.event !== "message") continue;
		const chunk = (event.data as { json?: unknown })?.json;
		if (typeof chunk !== "string") {
			throw new TypeError("CSV RPC message did not contain a string chunk");
		}
		return chunk;
	}
}

async function readCsv(response: Response): Promise<string> {
	const stream = openSse(response);
	let csv = "";
	while (true) {
		const chunk = await nextCsvChunk(stream);
		if (chunk === null) return csv;
		csv += chunk;
	}
}

const POLL_INTERVAL_MS = 25;
const CSV_TEST_STATEMENT_TIMEOUT_MS = 250;
const POST_TIMEOUT_OBSERVATION_MS = 1_500;
const BACKEND_DISAPPEARANCE_DEADLINE_MS =
	CSV_TEST_STATEMENT_TIMEOUT_MS + POST_TIMEOUT_OBSERVATION_MS;

async function pollUntil<T>(
	read: () => Promise<T>,
	matches: (value: T) => boolean,
	description: string,
	budgetMs = 5_000,
): Promise<T> {
	const deadline = Date.now() + budgetMs;
	let lastValue: T | undefined;
	while (Date.now() < deadline) {
		const value = await read();
		lastValue = value;
		if (matches(value)) return value;
		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
	}
	throw new Error(
		`Timed out waiting for ${description}; last value: ${JSON.stringify(lastValue)}`,
	);
}

function cookiePair(response: Response) {
	return (response.headers.getSetCookie()[0] ?? "").split(";", 1)[0] ?? "";
}

function rpc(input: unknown, cookie?: string, signal?: AbortSignal) {
	return fetch(`${baseUrl}/rpc/admin/analytics/csv`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(cookie ? { Cookie: cookie } : {}),
		},
		body: JSON.stringify({ json: input }),
		signal,
	});
}

beforeAll(async () => {
	await database.execute("drop schema if exists drizzle cascade");
	await database.execute("drop schema if exists public cascade");
	await database.execute("create schema public");
	await migrate(database, {
		migrationsFolder: path.resolve("packages/db/src/migrations"),
	});
	await database.delete(settingsVersions);
	const [historicalSettings] = await database
		.insert(settingsVersions)
		.values({
			capacity: 80,
			quietMaxPercent: 25,
			moderateMaxPercent: 50,
			busyMaxPercent: 75,
			timezone: "Asia/Riyadh",
			businessDayBoundary: "04:00",
			effectiveFrom: new Date("2026-07-01T00:00:00.000Z"),
			...oneMinuteWindowSchedule,
		})
		.returning({ version: settingsVersions.version });
	if (!historicalSettings)
		throw new Error("Historical settings were not created");
	historicalSettingsVersion = historicalSettings.version;
	await database.insert(settingsVersions).values({
		capacity: 250,
		quietMaxPercent: 10,
		moderateMaxPercent: 40,
		busyMaxPercent: 90,
		timezone: "Europe/London",
		businessDayBoundary: "03:30",
		effectiveFrom: new Date("2026-08-12T00:00:00.000Z"),
		...oneMinuteWindowSchedule,
	});
	const [device] = await database
		.insert(edgeDevices)
		.values({ name: privateDeviceName, tokenHash: privateTokenHash })
		.returning({ id: edgeDevices.id });
	if (!device) throw new Error("CSV device fixture was not created");
	await database.insert(occupancyMinutes).values([
		{
			deviceId: device.id,
			minuteStartUtc: new Date("2026-08-10T01:00:00.000Z"),
			businessDay: "2026-08-10",
			count: 0,
			entries: 0,
			exits: 0,
			band: "quiet",
			capacitySnapshot: 80,
			settingsVersion: historicalSettings.version,
			source: "live",
		},
		{
			deviceId: device.id,
			minuteStartUtc: new Date("2026-08-10T01:02:00.000Z"),
			businessDay: "2026-08-10",
			count: 17,
			entries: 4,
			exits: 1,
			band: "quiet",
			capacitySnapshot: 80,
			settingsVersion: historicalSettings.version,
			source: "live",
		},
	]);

	const staffPin = `${randomInt(0, 1_000_000)}`.padStart(6, "0");
	await authService.setSharedStaffPin(staffPin);
	const ownerPassword = randomBytes(18).toString("base64url");
	ownerEmail = `phase10-csv-${randomUUID()}@fitway.example`;
	await authService.provisionOwner({
		email: ownerEmail,
		displayName: "Phase 10 CSV owner",
		password: ownerPassword,
	});

	const { createApp } = await import("./index");
	const app = createApp("test", runtime);
	await new Promise<void>((resolve, reject) => {
		server = serve(
			{ fetch: app.fetch, hostname: "127.0.0.1", port: 0 },
			(info) => {
				baseUrl = `http://127.0.0.1:${info.port}`;
				resolve();
			},
		);
		server.once("error", reject);
	});

	staffCookie = cookiePair(
		await fetch(`${baseUrl}/api/auth/staff/pin`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ pin: staffPin }),
		}),
	);
	ownerCookie = cookiePair(
		await fetch(`${baseUrl}/api/auth/owner/password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
		}),
	);
}, 30_000);

afterAll(async () => {
	await new Promise<void>((resolve, reject) =>
		server.close((error) => (error ? reject(error) : resolve())),
	);
	await pool.end();
});

describe("Phase 10 owner CSV raw transport", () => {
	it("enforces owner auth and canonical wire validation statuses", async () => {
		expect((await rpc(csvRange)).status).toBe(401);
		expect((await rpc(csvRange, staffCookie)).status).toBe(403);

		for (const invalid of [
			{ ...csvRange, extra: true },
			{
				startBusinessDay: "2024-01-01",
				endBusinessDay: "2025-01-01",
			},
			{ ...csvRange, startBusinessDay: "2026-02-29" },
		]) {
			const response = await rpc(invalid, ownerCookie);
			expect(response.status).toBe(400);
			expect(response.headers.get("content-type")).toContain(
				"application/json",
			);
		}
	});

	it("streams the raw header as its own first event before historical rows", async () => {
		const response = await rpc(csvRange, ownerCookie);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");
		const stream = openSse(response);
		const firstEvent = await nextCsvChunk(stream);
		expect(firstEvent).toBe(`\uFEFF${csvHeader}\r\n`);
		expect(firstEvent).not.toContain("2026-08-10");
		expect(firstEvent?.match(/\uFEFF/g)).toHaveLength(1);
		let csv = firstEvent ?? "";
		while (true) {
			const chunk = await nextCsvChunk(stream);
			if (chunk === null) break;
			csv += chunk;
		}
		const lines = csv.slice(1).split("\r\n");

		expect(csv.startsWith(`\uFEFF${csvHeader}\r\n`)).toBe(true);
		expect(csv.match(/\uFEFF/g)).toHaveLength(1);
		expect(csv.replaceAll("\r\n", "")).not.toContain("\n");
		expect(lines.slice(0, 5)).toEqual([
			csvHeader,
			`2026-08-10,2026-08-10T01:00:00.000Z,2026-08-10T04:00:00,Asia/Riyadh,value,0,0,0,quiet,80,${historicalSettingsVersion},live`,
			"2026-08-10,2026-08-10T01:01:00.000Z,2026-08-10T04:01:00,Asia/Riyadh,missing,,,,,,,",
			`2026-08-10,2026-08-10T01:02:00.000Z,2026-08-10T04:02:00,Asia/Riyadh,value,17,4,1,quiet,80,${historicalSettingsVersion},live`,
			"2026-08-10,2026-08-10T01:03:00.000Z,2026-08-10T04:03:00,Asia/Riyadh,closed,,,,,,,",
		]);
		expect(csv).not.toContain(",250,");
		for (const privateValue of [
			privateDeviceName,
			privateTokenHash,
			ownerEmail,
			"device_id",
			"member",
			"principal",
			"camera",
			"detector",
		]) {
			expect(csv).not.toContain(privateValue);
		}
	});

	it("aborts a raw CSV stream without poisoning the next export", async () => {
		const controller = new AbortController();
		const abortedResponse = await rpc(csvRange, ownerCookie, controller.signal);
		expect(abortedResponse.status).toBe(200);
		expect(abortedResponse.headers.get("content-type")).toContain(
			"text/event-stream",
		);
		const abortedStream = openSse(abortedResponse);
		expect(await nextCsvChunk(abortedStream)).toBe(`\uFEFF${csvHeader}\r\n`);
		controller.abort();
		await expect(abortedStream.reader.read()).rejects.toMatchObject({
			name: "AbortError",
		});

		const retryResponse = await rpc(csvRange, ownerCookie);
		expect(retryResponse.status).toBe(200);
		const retryCsv = await readCsv(retryResponse);
		expect(retryCsv.startsWith(`\uFEFF${csvHeader}\r\n`)).toBe(true);
		expect(retryCsv).toContain(
			`2026-08-10,2026-08-10T01:02:00.000Z,2026-08-10T04:02:00,Asia/Riyadh,value,17,4,1,quiet,80,${historicalSettingsVersion},live\r\n`,
		);
	});

	it("destroys the exact lock-waiting export backend and permits a fresh export", async () => {
		const applicationName = `fitway-p10-csv-${randomUUID()}`;
		const blockerPool = new Pool({ connectionString, max: 1 });
		const exportPool = new Pool({
			connectionString,
			max: 1,
			application_name: applicationName,
		});
		const exportDatabase = drizzle(exportPool, {
			schema: { ...applicationSchema, ...authSchema },
		});
		// The export pool itself names the repository-owned backend; the test
		// never pre-borrows a guessed client and production issues no PID query.
		const acquiredPids: number[] = [];
		exportPool.on("acquire", (client) => {
			const pid = (client as unknown as { processID?: number }).processID;
			if (typeof pid === "number") acquiredPids.push(pid);
		});
		const controller = new AbortController();
		let blocker: PoolClient | undefined;
		let stream: AsyncIterator<string, void, undefined> | undefined;
		try {
			blocker = await blockerPool.connect();
			const observer = blocker;
			await observer.query("BEGIN");
			await observer.query(
				"LOCK TABLE settings_versions IN ACCESS EXCLUSIVE MODE",
			);

			stream = createReportingRepository(exportDatabase as never, {
				csvStatementTimeoutMs: CSV_TEST_STATEMENT_TIMEOUT_MS,
			})
				.streamCsv(csvRange, controller.signal)
				[Symbol.asyncIterator]();
			const pending = stream.next().then(
				(value) => ({ status: "resolved" as const, value }),
				(error) => ({ status: "rejected" as const, error }),
			);

			const exportBackendPid = await pollUntil(
				async () => acquiredPids[0],
				(pid) => typeof pid === "number",
				"the export pool to acquire its repository-owned backend",
			);
			const waiting = await pollUntil(
				async () =>
					observer.query<{
						pid: number;
						backendStart: Date;
						state: string;
						waitEventType: string | null;
						applicationName: string;
					}>(
						`SELECT pid,
						        backend_start AS "backendStart",
						        state,
						        wait_event_type AS "waitEventType",
						        application_name AS "applicationName"
						 FROM pg_stat_activity WHERE pid = $1`,
						[exportBackendPid],
					),
				(result) =>
					result.rows[0]?.state === "active" &&
					result.rows[0]?.waitEventType === "Lock",
				"the exact export backend to wait on the settings lock",
			);
			expect(waiting.rows[0]).toMatchObject({
				pid: exportBackendPid,
				state: "active",
				waitEventType: "Lock",
				applicationName,
			});
			const backendStart = waiting.rows[0]?.backendStart;
			expect(backendStart).toBeInstanceOf(Date);

			const abortedAt = Date.now();
			controller.abort();
			expect(await pending).toMatchObject({ status: "rejected" });
			await pollUntil(
				async () =>
					observer.query<{ present: boolean }>(
						`SELECT EXISTS (
						   SELECT 1 FROM pg_stat_activity
						   WHERE pid = $1 AND backend_start = $2
						 ) AS present`,
						[exportBackendPid, backendStart],
					),
				(result) => result.rows[0]?.present === false,
				"the exact (pid, backend_start) export backend to disappear",
				Math.max(0, abortedAt + BACKEND_DISAPPEARANCE_DEADLINE_MS - Date.now()),
			);
			// The blocker is still held, so disappearance cannot be explained by
			// the export finishing its work.
			expect((await observer.query("SELECT 1 AS held")).rows[0]).toMatchObject({
				held: 1,
			});

			await observer.query("ROLLBACK");
			observer.release();
			blocker = undefined;

			let retryCsv = "";
			for await (const chunk of createReportingRepository(
				exportDatabase as never,
			).streamCsv(csvRange)) {
				retryCsv += chunk;
			}
			expect(retryCsv.startsWith(`\uFEFF${csvHeader}\r\n`)).toBe(true);
			expect(retryCsv).toContain(
				`2026-08-10,2026-08-10T01:02:00.000Z,2026-08-10T04:02:00,Asia/Riyadh,value,17,4,1,quiet,80,${historicalSettingsVersion},live\r\n`,
			);
		} finally {
			controller.abort();
			await stream?.return?.().catch(() => undefined);
			if (blocker) {
				await blocker.query("ROLLBACK").catch(() => undefined);
				blocker.release();
			}
			await exportPool.end();
			await blockerPool.end();
		}
	}, 20_000);
});
