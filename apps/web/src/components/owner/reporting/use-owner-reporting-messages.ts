import { useI18n } from "@/i18n/provider";

import {
	ownerReportingMessages,
	ownerReportingWeekdays,
	ownerReportingWeekdaysShort,
} from "./messages";

export function useOwnerReportingMessages() {
	const { locale } = useI18n();
	return ownerReportingMessages[locale];
}

export function useOwnerReportingWeekdays() {
	const { locale } = useI18n();
	return {
		full: ownerReportingWeekdays[locale],
		short: ownerReportingWeekdaysShort[locale],
	};
}
