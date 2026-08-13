import { readFile } from "node:fs/promises";
import { request as requestHttp } from "node:http";
import type { AddressInfo } from "node:net";
import { SESSION_COOKIE_NAMES } from "@fitway/auth";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { createCronHandler } from "./cron";

const cronSecret = process.env.CRON_SECRET;
if (!cronSecret || cronSecret.length < 32) {
	throw new Error("CRON_SECRET must be supplied to the cron test process");
}
const run = vi.fn<() => Promise<unknown>>();
const logRequest = vi.fn();
const logError = vi.fn<(errorName: string) => void>();

const app = new Hono();
app.get(
	"/cron",
	createCronHandler({
		secret: cronSecret,
		runner: { run },
		logger: { request: logRequest, error: logError },
	}),
);

let server: ReturnType<typeof serve>;
let baseUrl = "";

type RawResponse = {
	status: number;
	headers: Record<string, string | string[] | undefined>;
	body: string;
};

async function rawRequest(input: {
	method?: string;
	path?: string;
	base?: string;
	authorization?: string | string[];
	cookie?: string;
	body?: string;
}): Promise<RawResponse> {
	const body = input.body ?? "";
	return new Promise((resolve, reject) => {
		const request = requestHttp(
			`${input.base ?? baseUrl}${input.path ?? "/cron"}`,
			{
				method: input.method ?? "GET",
				headers: {
					...(input.authorization
						? { Authorization: input.authorization }
						: {}),
					...(input.cookie ? { Cookie: input.cookie } : {}),
					...(body
						? {
								"Content-Length": Buffer.byteLength(body),
								"Content-Type": "application/json",
							}
						: {}),
				},
			},
			(response) => {
				const chunks: Buffer[] = [];
				response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
				response.on("end", () => {
					resolve({
						status: response.statusCode ?? 0,
						headers: response.headers,
						body: Buffer.concat(chunks).toString("utf8"),
					});
				});
			},
		);
		request.once("error", reject);
		if (body) request.write(body);
		request.end();
	});
}

beforeAll(async () => {
	await new Promise<void>((resolve, reject) => {
		server = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 0 });
		server.once("listening", () => {
			const address = server.address() as AddressInfo;
			baseUrl = `http://127.0.0.1:${address.port}`;
			resolve();
		});
		server.once("error", reject);
	});
});

afterAll(async () => {
	await new Promise<void>((resolve, reject) => {
		server.close((error) => (error ? reject(error) : resolve()));
	});
});

beforeEach(() => {
	run.mockReset().mockResolvedValue(undefined);
	logRequest.mockReset();
	logError.mockReset();
});

describe("internal cron handler", () => {
	it.each([
		["missing", undefined, undefined, undefined, undefined],
		["malformed", "Basic value", undefined, undefined, undefined],
		["wrong", `Bearer ${"w".repeat(32)}`, undefined, undefined, undefined],
		["query secret", undefined, `?secret=${cronSecret}`, undefined, undefined],
		[
			"body secret",
			undefined,
			undefined,
			undefined,
			JSON.stringify({ secret: cronSecret }),
		],
		[
			"staff cookie",
			undefined,
			undefined,
			"fitway_staff_session=signed-value",
			undefined,
		],
		[
			"owner cookie",
			undefined,
			undefined,
			"fitway_owner_session=signed-value",
			undefined,
		],
	])("returns the same no-store 401 for %s without running work", async (_label, authorization, query, cookie, body) => {
		const response = await rawRequest({
			authorization,
			path: `/cron${query ?? ""}`,
			cookie,
			body,
		});

		expect(response).toMatchObject({
			status: 401,
			body: JSON.stringify({ error: "unauthorized" }),
		});
		expect(response.headers["cache-control"]).toBe("no-store");
		expect(run).not.toHaveBeenCalled();
		expect(logRequest).toHaveBeenCalledExactlyOnceWith({
			method: "GET",
			path: "/cron",
			status: 401,
		});
		expect(logError).not.toHaveBeenCalled();
	});

	it("rejects duplicate bearer headers without running work", async () => {
		const response = await rawRequest({
			authorization: [`Bearer ${cronSecret}`, `Bearer ${cronSecret}`],
		});

		expect(response.status).toBe(401);
		expect(response.headers["cache-control"]).toBe("no-store");
		expect(response.body).toBe(JSON.stringify({ error: "unauthorized" }));
		expect(run).not.toHaveBeenCalled();
		expect(logRequest).toHaveBeenCalledExactlyOnceWith({
			method: "GET",
			path: "/cron",
			status: 401,
		});
		expect(logError).not.toHaveBeenCalled();
	});

	it("runs a canonical bearer GET exactly once", async () => {
		const response = await rawRequest({
			authorization: `Bearer ${cronSecret}`,
		});

		expect(response).toMatchObject({
			status: 200,
			body: JSON.stringify({ status: "ok" }),
		});
		expect(response.headers["cache-control"]).toBe("no-store");
		expect(run).toHaveBeenCalledTimes(1);
		expect(logRequest).toHaveBeenCalledExactlyOnceWith({
			method: "GET",
			path: "/cron",
			status: 200,
		});
		expect(logError).not.toHaveBeenCalled();
	});

	it("returns a fixed no-store 500 and logs only the error name", async () => {
		run.mockRejectedValueOnce(new TypeError("private failure detail"));

		const response = await rawRequest({
			authorization: `Bearer ${cronSecret}`,
		});

		expect(response).toMatchObject({
			status: 500,
			body: JSON.stringify({ error: "cron_failed" }),
		});
		expect(response.headers["cache-control"]).toBe("no-store");
		expect(run).toHaveBeenCalledTimes(1);
		expect(logRequest).toHaveBeenCalledExactlyOnceWith({
			method: "GET",
			path: "/cron",
			status: 500,
		});
		expect(logError).toHaveBeenCalledExactlyOnceWith("TypeError");
	});

	it("returns an empty no-store 405 for authenticated HEAD without running work", async () => {
		const response = await rawRequest({
			method: "HEAD",
			authorization: `Bearer ${cronSecret}`,
		});

		expect(response.status).toBe(405);
		expect(response.headers["cache-control"]).toBe("no-store");
		expect(response.body).toBe("");
		expect(run).not.toHaveBeenCalled();
		expect(logRequest).toHaveBeenCalledExactlyOnceWith({
			method: "HEAD",
			path: "/cron",
			status: 405,
		});
		expect(logError).not.toHaveBeenCalled();
	});

	it("rejects secrets below the environment and handler minimum", async () => {
		const { cronSecretSchema } = await import("@fitway/env/server");
		expect(cronSecretSchema.safeParse("").success).toBe(false);
		expect(cronSecretSchema.safeParse("s".repeat(31)).success).toBe(false);
		expect(cronSecretSchema.safeParse("s".repeat(32)).success).toBe(true);
		expect(() =>
			createCronHandler({
				secret: "short",
				runner: { run: async () => undefined },
				logger: { request: () => undefined, error: () => undefined },
			}),
		).toThrowError(RangeError);
	});

	it("keeps the production services and rewrites with exactly one minutely cron", async () => {
		const config = JSON.parse(
			await readFile(new URL("../../../vercel.json", import.meta.url), "utf8"),
		);

		expect(config.crons).toEqual([
			{ path: "/api/cron", schedule: "* * * * *" },
		]);
		expect(config.services).toEqual({
			web: {
				root: "apps/web",
				framework: "vite",
				installCommand: "cd ../.. && pnpm install",
				buildCommand: "VITE_SERVER_URL=/api pnpm run build",
				rewrites: [{ source: "/(.*)", destination: "/index.html" }],
			},
			server: {
				root: "apps/server",
				framework: "hono",
				entrypoint: "src/index.ts",
				installCommand: "cd ../.. && pnpm install",
				routes: [
					{
						src: "/api/((?!auth(?:/|$)).*)",
						transforms: [
							{
								type: "request.path",
								op: "set",
								args: "/$1",
							},
						],
					},
				],
			},
		});
		expect(config.rewrites).toEqual([
			{ source: "/api/(.*)", destination: { service: "server" } },
			{ source: "/(.*)", destination: { service: "web" } },
		]);
	});

	it("preserves actual production method topology outside the cron GET handler", async () => {
		const productionRun = vi.fn(async () => undefined);
		const consoleLog = vi
			.spyOn(console, "log")
			.mockImplementation(() => undefined);
		const consoleError = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const { createApp } = await import("./index");
		const productionApp = createApp("production", undefined, undefined, {
			run: productionRun,
		});
		let productionServer: ReturnType<typeof serve> | undefined;
		let productionUrl = "";
		try {
			await new Promise<void>((resolve, reject) => {
				const startedServer = serve({
					fetch: productionApp.fetch,
					hostname: "127.0.0.1",
					port: 0,
				});
				productionServer = startedServer;
				startedServer.once("listening", () => {
					const address = startedServer.address() as AddressInfo;
					productionUrl = `http://127.0.0.1:${address.port}`;
					resolve();
				});
				startedServer.once("error", reject);
			});

			const requestProduction = async (
				method: string,
				input: Omit<Parameters<typeof rawRequest>[0], "method" | "base"> = {},
			) => {
				return rawRequest({
					base: productionUrl,
					method,
					authorization: `Bearer ${cronSecret}`,
					...input,
				});
			};

			for (const invalid of [
				{},
				{ authorization: "Basic value" },
				{ authorization: `Bearer ${"w".repeat(32)}` },
				{ authorization: [`Bearer ${cronSecret}`, `Bearer ${cronSecret}`] },
				{ path: `/cron?secret=${encodeURIComponent(cronSecret)}` },
				{ body: JSON.stringify({ secret: cronSecret }) },
				{ cookie: `${SESSION_COOKIE_NAMES.staff}=signed-value` },
				{ cookie: `${SESSION_COOKIE_NAMES.owner}=signed-value` },
			]) {
				const response = await requestProduction("GET", {
					authorization: undefined,
					...invalid,
				});
				expect(response.status).toBe(401);
				expect(response.headers["cache-control"]).toBe("no-store");
				expect(response.body).toBe(JSON.stringify({ error: "unauthorized" }));
			}
			expect(productionRun).not.toHaveBeenCalled();
			expect(consoleLog.mock.calls).toEqual(
				Array.from({ length: 8 }, () => ["GET", "/cron", 401]),
			);
			expect(consoleError).not.toHaveBeenCalled();
			consoleLog.mockClear();

			const success = await requestProduction("GET");
			expect(success.status).toBe(200);
			expect(success.headers["cache-control"]).toBe("no-store");
			expect(success.body).toBe(JSON.stringify({ status: "ok" }));
			expect(productionRun).toHaveBeenCalledTimes(1);
			expect(consoleLog.mock.calls).toEqual([["GET", "/cron", 200]]);
			expect(consoleError).not.toHaveBeenCalled();
			productionRun.mockClear();
			consoleLog.mockClear();

			productionRun.mockRejectedValueOnce(
				new TypeError("private cron failure detail"),
			);
			const failure = await requestProduction("GET");
			expect(failure.status).toBe(500);
			expect(failure.headers["cache-control"]).toBe("no-store");
			expect(failure.body).toBe(JSON.stringify({ error: "cron_failed" }));
			expect(productionRun).toHaveBeenCalledTimes(1);
			expect(consoleLog.mock.calls).toEqual([["GET", "/cron", 500]]);
			expect(consoleError.mock.calls).toEqual([["TypeError"]]);
			productionRun.mockReset().mockResolvedValue(undefined);
			consoleLog.mockClear();
			consoleError.mockClear();

			const head = await requestProduction("HEAD");
			expect(head.status).toBe(405);
			expect(head.headers["cache-control"]).toBe("no-store");
			expect(head.body).toBe("");
			expect(productionRun).not.toHaveBeenCalled();
			expect(consoleLog.mock.calls).toEqual([["HEAD", "/cron", 405]]);
			expect(consoleError).not.toHaveBeenCalled();
			consoleLog.mockClear();

			for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
				const response = await requestProduction(method, {
					path: `/cron?secret=${encodeURIComponent(cronSecret)}`,
					cookie: `${SESSION_COOKIE_NAMES.staff}=signed-value`,
					body: JSON.stringify({ secret: cronSecret }),
				});
				expect(response.status).toBe(404);
				expect(response.headers["cache-control"]).toBeUndefined();
			}
			const options = await requestProduction("OPTIONS");
			expect(options.status).toBe(204);
			expect(options.headers["access-control-allow-methods"]).toBe(
				"GET,POST,OPTIONS",
			);
			expect(productionRun).not.toHaveBeenCalled();
			expect(consoleLog).not.toHaveBeenCalled();
			expect(consoleError).not.toHaveBeenCalled();
		} finally {
			const serverToClose = productionServer;
			if (serverToClose) {
				await new Promise<void>((resolve, reject) => {
					serverToClose.close((error) => (error ? reject(error) : resolve()));
				});
			}
			consoleLog.mockRestore();
			consoleError.mockRestore();
		}
	});
});
