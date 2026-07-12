import type { Locale } from "./catalog";
import { localeConfig } from "./locale";

export function formatNumber(value: number, locale: Locale): string {
	return new Intl.NumberFormat(localeConfig[locale].intl).format(value);
}

export function formatDate(
	value: Date | number,
	locale: Locale,
	options: Intl.DateTimeFormatOptions = {},
): string {
	return new Intl.DateTimeFormat(localeConfig[locale].intl, options).format(
		value,
	);
}
