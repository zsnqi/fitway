import type { AlertNotice } from "@fitway/api/alerts/types";
import { describe, expect, it, vi } from "vitest";
import { createTelegramAlertNotifier } from "./alert-notifier";

const BOT_TOKEN = "111222333:synthetic-test-token-value-not-a-credential";
const CHAT_ID = "-1000000000001";

function notice(overrides: Partial<AlertNotice> = {}): AlertNotice {
	return {
		deviceId: "11111111-2222-3333-4444-555555555555",
		condition: "stale_push",
		noticeKind: "alert",
		conditionStartedAt: new Date("2026-07-17T09:57:00.000Z"),
		sentAt: new Date("2026-07-17T10:00:00.000Z"),
		recoveryOfAlertId: null,
		...overrides,
	};
}

function okResponse(body: unknown = { ok: true }) {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { "content-type": "application/json" },
	});
}

function notifierWith(fetchImplementation: typeof fetch) {
	return createTelegramAlertNotifier({
		botToken: BOT_TOKEN,
		chatId: CHAT_ID,
		fetch: fetchImplementation,
	});
}

describe("telegram alert notifier", () => {
	it("posts one message to the bot sendMessage endpoint for the chat", async () => {
		const fetchSpy = vi.fn<typeof fetch>(async () => okResponse());
		await notifierWith(fetchSpy)(notice());

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		const [url, init] = fetchSpy.mock.calls[0] ?? [];
		expect(String(url)).toBe(
			`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
		);
		expect(init?.method).toBe("POST");
		expect(new Headers(init?.headers).get("content-type")).toContain(
			"application/json",
		);
		const payload = JSON.parse(String(init?.body));
		expect(payload.chat_id).toBe(CHAT_ID);
		expect(typeof payload.text).toBe("string");
		expect(payload.text.length).toBeGreaterThan(0);
		expect(payload.text).toContain("11111111-2222-3333-4444-555555555555");
	});

	it("uses no ambient network transport", async () => {
		const ambient = vi.spyOn(globalThis, "fetch");
		const fetchSpy = vi.fn<typeof fetch>(async () => okResponse());
		await notifierWith(fetchSpy)(notice());
		expect(ambient).not.toHaveBeenCalled();
		ambient.mockRestore();
	});

	it.each([
		["non-2xx", async () => new Response("nope", { status: 500 })],
		[
			"4xx",
			async () => new Response(JSON.stringify({ ok: false }), { status: 400 }),
		],
		["telegram ok:false", async () => okResponse({ ok: false })],
		[
			"malformed body",
			async () => new Response("<html>not json", { status: 200 }),
		],
		[
			"thrown transport error",
			async () => {
				throw new TypeError("fetch failed");
			},
		],
		[
			"timeout",
			async () => {
				throw new DOMException("The operation was aborted.", "AbortError");
			},
		],
	])("rejects on %s", async (_label, implementation) => {
		const notifier = notifierWith(vi.fn<typeof fetch>(implementation));
		await expect(notifier(notice())).rejects.toThrow();
	});

	it("never leaks the bot token through a rejection", async () => {
		const failures: (typeof fetch)[] = [
			async () => new Response("nope", { status: 500 }),
			async () => okResponse({ ok: false }),
			async () => new Response("<html>not json", { status: 200 }),
			async () => {
				throw new Error(
					`connect ECONNREFUSED https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
				);
			},
		];
		for (const implementation of failures) {
			const notifier = notifierWith(vi.fn<typeof fetch>(implementation));
			const error = await notifier(notice()).then(
				() => null,
				(reason: unknown) => reason,
			);
			expect(error).toBeInstanceOf(Error);
			const exposed = [
				(error as Error).message,
				(error as Error).stack ?? "",
				String(error),
				JSON.stringify(error, Object.getOwnPropertyNames(error)),
			].join("\n");
			expect(exposed).not.toContain(BOT_TOKEN);
			expect((error as Error).cause).toBeUndefined();
		}
	});

	it("never leaks the bot token through the console", async () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
		const error = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

		await notifierWith(vi.fn<typeof fetch>(async () => okResponse()))(notice());
		await notifierWith(
			vi.fn<typeof fetch>(async () => new Response("nope", { status: 500 })),
		)(notice()).catch(() => undefined);

		for (const spy of [log, error, warn]) {
			expect(spy).not.toHaveBeenCalled();
			spy.mockRestore();
		}
	});

	it("resolves to undefined on success, matching the AlertNotifier contract", async () => {
		const result = await notifierWith(
			vi.fn<typeof fetch>(async () => okResponse()),
		)(notice());
		expect(result).toBeUndefined();
	});

	it("rejects an empty bot token or chat id at construction", () => {
		expect(() =>
			createTelegramAlertNotifier({
				botToken: "",
				chatId: CHAT_ID,
				fetch: vi.fn<typeof fetch>(),
			}),
		).toThrow(RangeError);
		expect(() =>
			createTelegramAlertNotifier({
				botToken: BOT_TOKEN,
				chatId: "",
				fetch: vi.fn<typeof fetch>(),
			}),
		).toThrow(RangeError);
	});
});
