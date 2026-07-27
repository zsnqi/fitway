import { useI18n } from "@/i18n/provider";

import { ownerAnalyticsMessages } from "./messages";

export function useOwnerAnalyticsMessages() {
	const { locale } = useI18n();
	return ownerAnalyticsMessages[locale];
}
