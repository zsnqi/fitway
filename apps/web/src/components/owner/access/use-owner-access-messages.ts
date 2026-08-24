import { useI18n } from "@/i18n/provider";

import { ownerAccessMessages } from "./messages";

export function useOwnerAccessMessages() {
	const { locale } = useI18n();
	return ownerAccessMessages[locale];
}
