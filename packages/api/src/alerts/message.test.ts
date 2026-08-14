import { describe, expect, it } from "vitest";
import { formatAlertMessage } from "./message";
import { ALERT_CONDITION_TYPES, type AlertNotice } from "./types";

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

describe("alert message", () => {
	it("produces a distinct deterministic message for every condition and kind", () => {
		const messages = new Set<string>();
		for (const condition of ALERT_CONDITION_TYPES) {
			for (const noticeKind of ["alert", "recovery"] as const) {
				const subject = notice({
					condition,
					noticeKind,
					recoveryOfAlertId: noticeKind === "recovery" ? 42 : null,
				});
				const text = formatAlertMessage(subject);
				expect(formatAlertMessage(subject)).toBe(text);
				messages.add(text);
			}
		}
		expect(messages.size).toBe(ALERT_CONDITION_TYPES.length * 2);
	});

	it("carries the device and the condition start, in Western digits and UTC", () => {
		const text = formatAlertMessage(notice());
		expect(text).toContain("11111111-2222-3333-4444-555555555555");
		expect(text).toContain("2026-07-17T09:57:00.000Z");
		expect(text).toContain("2026-07-17T10:00:00.000Z");
		expect(text).toMatch(/^[\S\s]*$/);
		expect(text).not.toMatch(/[٠-٩۰-۹]/);
	});

	it("distinguishes an alert from a recovery in the leading line", () => {
		const alert = formatAlertMessage(notice()).split("\n")[0];
		const recovery = formatAlertMessage(
			notice({ noticeKind: "recovery", recoveryOfAlertId: 7 }),
		).split("\n")[0];
		expect(alert).not.toBe(recovery);
		expect(alert?.toLowerCase()).toContain("alert");
		expect(recovery?.toLowerCase()).toContain("recover");
	});

	it("names each failure condition distinguishably", () => {
		const texts = ALERT_CONDITION_TYPES.map((condition) =>
			formatAlertMessage(notice({ condition })).toLowerCase(),
		);
		expect(texts[0]).toContain("push");
		expect(texts[1]).toContain("process");
		expect(texts[2]).toContain("camera");
		expect(texts[3]).toContain("feed");
	});

	it("carries no credential, session, PIN, or visitor data", () => {
		for (const condition of ALERT_CONDITION_TYPES) {
			for (const noticeKind of ["alert", "recovery"] as const) {
				const text = formatAlertMessage(
					notice({
						condition,
						noticeKind,
						recoveryOfAlertId: noticeKind === "recovery" ? 1 : null,
					}),
				).toLowerCase();
				for (const forbidden of [
					"token",
					"secret",
					"pin",
					"password",
					"session",
					"cookie",
					"bot",
					"chat_id",
					"authorization",
					"count",
					"occupancy",
					"visitor",
					"capacity",
				]) {
					expect(text).not.toContain(forbidden);
				}
			}
		}
	});

	it("rejects an invalid instant rather than emitting one", () => {
		expect(() =>
			formatAlertMessage(notice({ sentAt: new Date(Number.NaN) })),
		).toThrow(RangeError);
	});
});
