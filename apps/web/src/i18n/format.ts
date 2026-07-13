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

export function formatGymTime(value: Date | number, locale: Locale): string {
	return formatDate(value, locale, {
		timeZone: "Asia/Riyadh",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

export function formatRelativeTime(
	value: Date | number,
	now: Date | number,
	locale: Locale,
): string {
	const seconds = Math.round(
		(new Date(value).getTime() - new Date(now).getTime()) / 1_000,
	);
	const [amount, unit]: [number, Intl.RelativeTimeFormatUnit] =
		Math.abs(seconds) < 60
			? [seconds, "second"]
			: Math.abs(seconds) < 3600
				? [Math.round(seconds / 60), "minute"]
				: [Math.round(seconds / 3600), "hour"];
	return new Intl.RelativeTimeFormat(localeConfig[locale].intl, {
		numeric: "auto",
	}).format(amount, unit);
}
