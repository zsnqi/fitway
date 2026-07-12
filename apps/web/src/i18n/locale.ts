import type { Locale } from "./catalog";
import { ar } from "./messages/ar";
import { en } from "./messages/en";

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_STORAGE_KEY = "fitway.locale";

export const localeConfig = {
	ar: { dir: "rtl", intl: "ar-SA-u-nu-latn", messages: ar },
	en: { dir: "ltr", intl: "en-SA-u-nu-latn", messages: en },
} as const;

export function isLocale(value: unknown): value is Locale {
	return value === "ar" || value === "en";
}

type StorageReader = Pick<Storage, "getItem">;

export function readStoredLocale(storage?: StorageReader | null): Locale {
	if (!storage) return DEFAULT_LOCALE;

	try {
		const value = storage.getItem(LOCALE_STORAGE_KEY);
		return isLocale(value) ? value : DEFAULT_LOCALE;
	} catch {
		return DEFAULT_LOCALE;
	}
}

export function getInitialLocale(): Locale {
	if (
		typeof document !== "undefined" &&
		isLocale(document.documentElement.lang)
	) {
		return document.documentElement.lang;
	}

	return readStoredLocale(
		typeof window === "undefined" ? undefined : window.localStorage,
	);
}

export function applyDocumentLocale(
	locale: Locale,
	target: Document = document,
) {
	const config = localeConfig[locale];
	target.documentElement.lang = locale;
	target.documentElement.dir = config.dir;
	target.title = config.messages.metadata.title;

	const description = target.querySelector<HTMLMetaElement>(
		'meta[name="description"]',
	);
	if (description) {
		description.content = config.messages.metadata.description;
	}
}

export function getOppositeLocale(locale: Locale): Locale {
	return locale === "ar" ? "en" : "ar";
}
