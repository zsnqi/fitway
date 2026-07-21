import type { StaffWebMessages } from "@/components/staff/messages";
import { staffWeb as arStaffWeb } from "@/i18n/messages/ar";
import { staffWeb as enStaffWeb } from "@/i18n/messages/en";
import { useI18n } from "@/i18n/provider";

export function useStaffMessages(): StaffWebMessages {
	const { locale } = useI18n();
	return locale === "ar" ? arStaffWeb : enStaffWeb;
}
