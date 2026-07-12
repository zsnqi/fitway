import { describe, expect, it } from "vitest";

import { formatDate, formatNumber } from "./format";
import {
	applyDocumentLocale,
	DEFAULT_LOCALE,
	LOCALE_STORAGE_KEY,
	localeConfig,
	readStoredLocale,
} from "./locale";

const EASTERN_DIGITS = /[\u0660-\u0669\u06f0-\u06f9]/u;

function catalogPaths(value: unknown, prefix = ""): string[] {
	if (!value || typeof value !== "object") return [prefix];
	return Object.entries(value).flatMap(([key, child]) =>
		catalogPaths(child, prefix ? `${prefix}.${key}` : key),
	);
}

describe("locale foundation", () => {
	it("defaults safely and accepts only supported persisted locales", () => {
		expect(DEFAULT_LOCALE).toBe("ar");
		expect(readStoredLocale(null)).toBe("ar");
		expect(readStoredLocale({ getItem: () => "fr" })).toBe("ar");
		expect(readStoredLocale({ getItem: () => "en" })).toBe("en");
		expect(LOCALE_STORAGE_KEY).toBe("fitway.locale");
	});

	it("keeps Arabic and English catalog keys in parity", () => {
		expect(catalogPaths(localeConfig.ar.messages).sort()).toEqual(
			catalogPaths(localeConfig.en.messages).sort(),
		);
	});

	it("applies direction, language, and localized metadata together", () => {
		const meta = { content: "" };
		const target = {
			documentElement: { lang: "ar", dir: "rtl" },
			title: "",
			querySelector: () => meta,
		} as unknown as Document;

		applyDocumentLocale("en", target);

		expect(target.documentElement.lang).toBe("en");
		expect(target.documentElement.dir).toBe("ltr");
		expect(target.title).toBe(localeConfig.en.messages.metadata.title);
		expect(meta.content).toBe(localeConfig.en.messages.metadata.description);
	});

	it("formats Western digits in both languages", () => {
		for (const locale of ["ar", "en"] as const) {
			const number = formatNumber(1234567890, locale);
			const date = formatDate(new Date("2026-07-13T10:30:00.000Z"), locale, {
				timeZone: "Asia/Riyadh",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "numeric",
				minute: "2-digit",
			});
			expect(number).not.toMatch(EASTERN_DIGITS);
			expect(date).not.toMatch(EASTERN_DIGITS);
			expect(number).toMatch(/[0-9]/u);
			expect(date).toMatch(/[0-9]/u);
		}
	});
});
