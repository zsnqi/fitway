import type { CanonicalAuthContext } from "@fitway/auth";
import { call, ORPCError } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

import { appRouter } from "../../routers/index";

const common = {
	principalId: "00000000-0000-4000-8000-000000000001",
	sessionId: "00000000-0000-4000-8000-000000000002",
	expiresAt: new Date("2026-08-15T00:00:00.000Z"),
	active: true,
} as const;
const staff: CanonicalAuthContext = {
	...common,
	principalKind: "shared_staff",
	role: "staff",
};
const owner: CanonicalAuthContext = {
	...common,
	principalKind: "owner",
	role: "owner",
};
const range = {
	startBusinessDay: "2026-08-10",
	endBusinessDay: "2026-08-10",
};

async function rejectedCode(operation: Promise<unknown>) {
	try {
		await operation;
	} catch (error) {
		if (error instanceof ORPCError) return error.code;
		throw error;
	}
	return null;
}

describe("admin analytics CSV transport", () => {
	it("allows only active owners without starting rejected streams", async () => {
		const streamCsv = vi.fn(async function* () {
			yield "header\r\n";
		});

		for (const auth of [null, { ...owner, active: false }] as const) {
			expect(
				await rejectedCode(
					call(appRouter.admin.analytics.csv, range, {
						context: { auth, streamCsv },
					}),
				),
			).toBe("UNAUTHORIZED");
		}
		expect(
			await rejectedCode(
				call(appRouter.admin.analytics.csv, range, {
					context: { auth: staff, streamCsv },
				}),
			),
		).toBe("FORBIDDEN");
		expect(streamCsv).not.toHaveBeenCalled();

		const iterator = await call(appRouter.admin.analytics.csv, range, {
			context: { auth: owner, streamCsv },
		});
		expect(await iterator.next()).toEqual({ done: false, value: "header\r\n" });
		expect(streamCsv).toHaveBeenCalledOnce();
		expect(streamCsv).toHaveBeenCalledWith(range, undefined);
	});

	it("rejects invalid ranges before streaming and accepts both inclusive boundaries", async () => {
		const streamCsv = vi.fn(async function* () {
			yield "header\r\n";
		});
		const invalidInputs: unknown[] = [
			undefined,
			null,
			"2026-08-10",
			["2026-08-10", "2026-08-10"],
			{},
			{ startBusinessDay: "2026-08-10" },
			{ endBusinessDay: "2026-08-10" },
			{ ...range, extra: true },
			{ ...range, startBusinessDay: 20260810 },
			{ ...range, startBusinessDay: "2026-02-29" },
			{
				startBusinessDay: "2026-08-11",
				endBusinessDay: "2026-08-10",
			},
			{
				startBusinessDay: "2024-01-01",
				endBusinessDay: "2025-01-01",
			},
		];

		for (const input of invalidInputs) {
			await expect(
				call(appRouter.admin.analytics.csv, input as never, {
					context: { auth: owner, streamCsv },
				}),
			).rejects.toBeDefined();
		}
		expect(streamCsv).not.toHaveBeenCalled();

		for (const input of [
			range,
			{
				startBusinessDay: "2024-01-01",
				endBusinessDay: "2024-12-31",
			},
		]) {
			const iterator = await call(appRouter.admin.analytics.csv, input, {
				context: { auth: owner, streamCsv },
			});
			expect(await iterator.next()).toMatchObject({ done: false });
			await iterator.return();
		}
		expect(streamCsv).toHaveBeenCalledTimes(2);
	});

	it("delivers ordered chunks lazily and completes cleanly", async () => {
		const requested: string[] = [];
		const streamCsv = vi.fn(async function* () {
			requested.push("header");
			yield "header\r\n";
			requested.push("row-one");
			yield "row-one\r\n";
			requested.push("row-two");
			yield "row-two\r\n";
			requested.push("complete");
		});

		const iterator = await call(appRouter.admin.analytics.csv, range, {
			context: { auth: owner, streamCsv },
		});
		expect(requested).toEqual([]);
		expect(await iterator.next()).toEqual({
			done: false,
			value: "header\r\n",
		});
		expect(requested).toEqual(["header"]);
		expect(await iterator.next()).toEqual({
			done: false,
			value: "row-one\r\n",
		});
		expect(await iterator.next()).toEqual({
			done: false,
			value: "row-two\r\n",
		});
		expect(await iterator.next()).toEqual({ done: true, value: undefined });
		expect(requested).toEqual(["header", "row-one", "row-two", "complete"]);
	});

	it("forwards iterator return and runs cleanup exactly once", async () => {
		let cleanupCount = 0;
		const source = (async function* () {
			try {
				yield "header\r\n";
				yield "row\r\n";
			} finally {
				cleanupCount += 1;
			}
		})();
		const sourceReturn = vi.spyOn(source, "return");
		const streamCsv = vi.fn(() => source);
		const iterator = await call(appRouter.admin.analytics.csv, range, {
			context: { auth: owner, streamCsv },
		});

		expect(await iterator.next()).toMatchObject({
			done: false,
			value: "header\r\n",
		});
		await iterator.return();
		await iterator.return();

		expect(sourceReturn).toHaveBeenCalledOnce();
		expect(cleanupCount).toBe(1);
	});

	it("forwards AbortSignal cancellation and runs cleanup exactly once", async () => {
		let cleanupCount = 0;
		const source = (async function* () {
			try {
				yield "header\r\n";
				yield "row\r\n";
			} finally {
				cleanupCount += 1;
			}
		})();
		const sourceReturn = vi.spyOn(source, "return");
		const streamCsv = vi.fn(() => source);
		const controller = new AbortController();
		const iterator = await call(appRouter.admin.analytics.csv, range, {
			context: { auth: owner, streamCsv },
			signal: controller.signal,
		});

		expect(await iterator.next()).toMatchObject({
			done: false,
			value: "header\r\n",
		});
		controller.abort();
		await vi.waitFor(() => expect(cleanupCount).toBe(1));
		await iterator.return();

		expect(sourceReturn).toHaveBeenCalledOnce();
		expect(cleanupCount).toBe(1);
	});

	it("forwards the exact request AbortSignal to the CSV repository", async () => {
		const streamCsv = vi.fn(async function* () {
			yield "header\r\n";
		});
		const controller = new AbortController();
		const iterator = await call(appRouter.admin.analytics.csv, range, {
			context: { auth: owner, streamCsv },
			signal: controller.signal,
		});

		expect(await iterator.next()).toMatchObject({ done: false });
		expect(streamCsv).toHaveBeenCalledWith(range, controller.signal);
	});

	it("preserves a producer failure when iterator cleanup also rejects", async () => {
		const producerError = new Error("producer failed");
		const cleanupError = new Error("cleanup failed");
		const sourceReturn = vi.fn().mockRejectedValue(cleanupError);
		const source: AsyncIterable<string> = {
			[Symbol.asyncIterator]() {
				return {
					next: vi.fn().mockRejectedValue(producerError),
					return: sourceReturn,
				};
			},
		};
		const iterator = await call(appRouter.admin.analytics.csv, range, {
			context: { auth: owner, streamCsv: () => source },
		});

		await expect(iterator.next()).rejects.toBe(producerError);
		expect(sourceReturn).toHaveBeenCalledOnce();
	});

	it("validates every yielded CSV event lazily", async () => {
		const streamCsv = vi.fn(async function* () {
			yield 42 as never;
		});
		const iterator = await call(appRouter.admin.analytics.csv, range, {
			context: { auth: owner, streamCsv },
		});

		expect(streamCsv).toHaveBeenCalledOnce();
		expect(await rejectedCode(iterator.next())).toBe(
			"EVENT_ITERATOR_VALIDATION_FAILED",
		);
	});
});
