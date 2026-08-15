import { useI18n } from "@/i18n/provider";

import { ownerAuditMessages } from "./messages";

export function useOwnerAuditMessages() {
	const { locale } = useI18n();
	return ownerAuditMessages[locale];
}
