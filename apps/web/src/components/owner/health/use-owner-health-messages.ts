import { useI18n } from "@/i18n/provider";

import { ownerHealthMessages } from "./messages";

export function useOwnerHealthMessages() {
	const { locale } = useI18n();
	return ownerHealthMessages[locale];
}
