import { useI18n } from "@/i18n/provider";

export type StaffCommandMessages = typeof en;

const en = {
	eyebrow: "Staff actions",
	title: "Correct the count",
	description:
		"Send a correction to the edge device. The reading changes only after the device applies it.",
	adjustmentTitle: "Adjust by steps",
	adjustment: "Adjustment",
	decrease: "Decrease the adjustment by 1",
	increase: "Increase the adjustment by 1",
	adjustmentIdle: "Step up or down, then apply.",
	projected: (value: string) => `Sets the count to ${value}.`,
	applyAdjustment: "Apply adjustment",
	applying: "Sending…",
	deltaUnavailable: "Steps need a current reading. Set an exact count instead.",
	directTitle: "Set an exact count",
	directLabel: "New count",
	directHint: "Whole numbers, Western digits only.",
	directPlaceholder: "For example, 37",
	setDirect: "Set count",
	reasonLabel: "Reason (optional)",
	reasonPlaceholder: "For example, door recount",
	reasonRemaining: (count: string) => `${count} characters left.`,
	reasonTooLong: "Keep the reason to 240 characters or fewer.",
	directRequired: "Enter the new count.",
	directWestern: "Use Western digits only, without signs or decimal points.",
	directRange: "Enter a count from 0 to 2147483647.",
	resetEyebrow: "Destructive",
	resetTitle: "Reset the count to 0",
	resetDescription: "Use only when the gym is empty.",
	openReset: "Reset to 0",
	resetDialogTitle: "Confirm reset to 0",
	resetConsequence:
		"This sends a reset to the edge device. The reading changes only after the device applies it.",
	cancel: "Cancel",
	confirmReset: "Send reset",
	historyTitle: "Recent commands",
	historyDescription: "The edge device reports each status. Newest first.",
	historyEmpty: "No recent commands.",
	historyLoading: "Loading recent commands…",
	historyUnavailable: "Recent commands could not be loaded.",
	statuses: {
		pending: "Waiting for the edge device",
		applied: "Applied by the edge device",
		superseded: "Replaced by a newer command",
	},
	setTo: "Set count to",
	resetToZero: "Reset count to 0",
	// Spoken-only label; the visible reason is marked up as a quotation.
	reason: "Reason:",
	commandAccepted: (status: string) => `Command ${status}.`,
	badRequest:
		"The command was not accepted. Refresh the reading and check the values.",
	forbidden: "This session is not allowed to issue staff commands.",
	sessionExpired: "Your staff session expired. Sign in again.",
	serviceError:
		"The command service is unavailable. Try again without reloading the page.",
};

const ar: StaffCommandMessages = {
	eyebrow: "إجراءات الموظفين",
	title: "تصحيح العدد",
	description:
		"أرسل تصحيحًا إلى جهاز العد. لا تتغير القراءة إلا بعد أن يطبّقه الجهاز.",
	adjustmentTitle: "التعديل بالخطوات",
	adjustment: "قيمة التعديل",
	decrease: "إنقاص قيمة التعديل بمقدار 1",
	increase: "زيادة قيمة التعديل بمقدار 1",
	adjustmentIdle: "زد القيمة أو أنقصها، ثم طبّق التعديل.",
	projected: (value: string) => `سيصبح العدد ${value}.`,
	applyAdjustment: "تطبيق التعديل",
	applying: "جارٍ الإرسال…",
	deltaUnavailable:
		"يحتاج التعديل بالخطوات إلى قراءة حالية. عيّن عددًا محددًا بدلًا من ذلك.",
	directTitle: "تعيين عدد محدد",
	directLabel: "العدد الجديد",
	directHint: "أعداد صحيحة بالأرقام الغربية فقط.",
	directPlaceholder: "مثال: 37",
	setDirect: "تعيين العدد",
	reasonLabel: "السبب (اختياري)",
	reasonPlaceholder: "مثال: إعادة العد عند الباب",
	reasonRemaining: (count: string) => `بقي ${count} حرفًا.`,
	reasonTooLong: "اجعل السبب 240 حرفًا أو أقل.",
	directRequired: "أدخل العدد الجديد.",
	directWestern: "استخدم الأرقام الغربية فقط، دون إشارات أو كسور عشرية.",
	directRange: "أدخل عددًا من 0 إلى 2147483647.",
	resetEyebrow: "إجراء خطِر",
	resetTitle: "إعادة ضبط العدد إلى 0",
	resetDescription: "استخدمه فقط عندما يكون النادي خاليًا.",
	openReset: "إعادة الضبط إلى 0",
	resetDialogTitle: "تأكيد إعادة الضبط إلى 0",
	resetConsequence:
		"سيُرسَل أمر إعادة الضبط إلى جهاز العد. لا تتغير القراءة إلا بعد أن يطبّقه الجهاز.",
	cancel: "إلغاء",
	confirmReset: "إرسال إعادة الضبط",
	historyTitle: "الأوامر الأخيرة",
	historyDescription: "يبلّغ جهاز العد عن حالة كل أمر. الأحدث أولًا.",
	historyEmpty: "لا توجد أوامر أخيرة.",
	historyLoading: "جارٍ تحميل الأوامر الأخيرة…",
	historyUnavailable: "تعذر تحميل الأوامر الأخيرة.",
	statuses: {
		pending: "بانتظار جهاز العد",
		applied: "طبّقه جهاز العد",
		superseded: "استبدله أمر أحدث",
	},
	setTo: "تعيين العدد إلى",
	resetToZero: "إعادة ضبط العدد إلى 0",
	reason: "السبب:",
	commandAccepted: (status: string) => `حالة الأمر: ${status}.`,
	badRequest: "لم يُقبل الأمر. حدّث القراءة وتحقق من القيم.",
	forbidden: "لا تسمح هذه الجلسة بإصدار أوامر الموظفين.",
	sessionExpired: "انتهت جلسة الموظفين. سجّل الدخول مرة أخرى.",
	serviceError: "خدمة الأوامر غير متاحة. حاول مرة أخرى دون إعادة تحميل الصفحة.",
};

export function useStaffCommandMessages(): StaffCommandMessages {
	const { locale } = useI18n();
	return locale === "ar" ? ar : en;
}
