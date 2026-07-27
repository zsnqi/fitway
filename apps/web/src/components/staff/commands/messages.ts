import { useI18n } from "@/i18n/provider";

export type StaffCommandMessages = typeof en;

const en = {
	eyebrow: "Action area",
	title: "Count correction controls",
	description:
		"Review the current reading, then send a clear command to the edge counter.",
	edgeAuthority:
		"The displayed count changes only after the edge applies the command and reports a new reading.",
	adjustmentTitle: "Adjust the current count",
	adjustmentDescription:
		"Use the stepper for a small correction, then apply it explicitly.",
	currentCount: "Current count",
	currentUnavailable: "No usable current count",
	adjustment: "Adjustment",
	decrease: "Decrease the adjustment by 1",
	increase: "Increase the adjustment by 1",
	result: "Count after application",
	applyAdjustment: "Apply adjustment",
	applying: "Queuing command…",
	deltaUnavailable:
		"A step correction needs a usable current count. Use direct entry instead.",
	directTitle: "Set the count directly",
	directDescription:
		"Use a whole number when the correction is too large for the stepper.",
	directLabel: "New count",
	directHint: "Enter a whole number from 0 to 2147483647 using Western digits.",
	directPlaceholder: "For example, 37",
	setDirect: "Set count",
	reasonLabel: "Short reason (optional)",
	reasonPlaceholder: "For example, door recount",
	reasonHint: "Up to 240 characters.",
	reasonTooLong: "Keep the reason to 240 characters or fewer.",
	directRequired: "Enter the new count.",
	directWestern: "Use Western digits only, without signs or decimal points.",
	directRange: "Enter a count from 0 to 2147483647.",
	resetEyebrow: "Destructive action",
	resetTitle: "Reset the count to 0",
	resetDescription:
		"Use only after confirming that the gym count should return to zero.",
	openReset: "Reset to 0",
	resetDialogTitle: "Confirm reset to 0",
	resetConsequence:
		"This queues a reset command for the edge counter. The displayed reading will not change until the edge applies it.",
	cancel: "Cancel",
	confirmReset: "Queue reset",
	historyEyebrow: "Command lifecycle",
	historyTitle: "Recent command lifecycle",
	historyDescription:
		"Status is read from the server. Delivery time is metadata, not a lifecycle state.",
	historyEmpty: "No recent commands are available.",
	historyLoading: "Loading recent command lifecycle…",
	historyUnavailable:
		"Recent command lifecycle could not be loaded. Status is unavailable until the server responds.",
	statuses: {
		pending: "Waiting for edge application",
		applied: "Applied by the edge",
		superseded: "Superseded by a newer command",
	},
	setTo: "Set count to",
	resetToZero: "Reset count to 0",
	command: "Command",
	reason: "Reason",
	commandAccepted: (status: string) => `Command ${status}.`,
	badRequest:
		"The command could not be queued. Refresh the operational state and check the values.",
	forbidden: "This session is not allowed to issue staff commands.",
	sessionExpired: "Your staff session expired. Sign in again.",
	serviceError:
		"The command service is unavailable. Try again without reloading the page.",
};

const ar: StaffCommandMessages = {
	eyebrow: "منطقة الإجراءات",
	title: "أدوات تصحيح العدد",
	description: "راجع القراءة الحالية، ثم أرسل أمرًا واضحًا إلى جهاز العد.",
	edgeAuthority:
		"لا يتغير العدد المعروض إلا بعد أن يطبّق جهاز العد الأمر ويرسل قراءة جديدة.",
	adjustmentTitle: "تعديل العدد الحالي",
	adjustmentDescription:
		"استخدم أزرار التعديل للتصحيح البسيط، ثم طبّق التعديل بوضوح.",
	currentCount: "العدد الحالي",
	currentUnavailable: "لا توجد قراءة حالية صالحة",
	adjustment: "قيمة التعديل",
	decrease: "إنقاص قيمة التعديل بمقدار 1",
	increase: "زيادة قيمة التعديل بمقدار 1",
	result: "العدد بعد التطبيق",
	applyAdjustment: "تطبيق التعديل",
	applying: "جارٍ وضع الأمر في قائمة الانتظار…",
	deltaUnavailable:
		"يتطلب التصحيح التدريجي قراءة حالية صالحة. استخدم الإدخال المباشر بدلًا منه.",
	directTitle: "تعيين العدد مباشرة",
	directDescription:
		"استخدم عددًا صحيحًا عندما يكون التصحيح أكبر من أن يُجرى تدريجيًا.",
	directLabel: "العدد الجديد",
	directHint: "أدخل عددًا صحيحًا من 0 إلى 2147483647 بالأرقام الغربية.",
	directPlaceholder: "مثال: 37",
	setDirect: "تعيين العدد",
	reasonLabel: "سبب مختصر (اختياري)",
	reasonPlaceholder: "مثال: إعادة العد عند الباب",
	reasonHint: "بحد أقصى 240 حرفًا.",
	reasonTooLong: "اجعل السبب 240 حرفًا أو أقل.",
	directRequired: "أدخل العدد الجديد.",
	directWestern: "استخدم الأرقام الغربية فقط، دون إشارات أو كسور عشرية.",
	directRange: "أدخل عددًا من 0 إلى 2147483647.",
	resetEyebrow: "إجراء خطِر",
	resetTitle: "إعادة ضبط العدد إلى 0",
	resetDescription:
		"استخدمه فقط بعد التأكد من وجوب إعادة عدد الموجودين في النادي إلى الصفر.",
	openReset: "إعادة الضبط إلى 0",
	resetDialogTitle: "تأكيد إعادة الضبط إلى 0",
	resetConsequence:
		"سيُوضع أمر إعادة الضبط في قائمة انتظار جهاز العد. لن تتغير القراءة المعروضة حتى يطبّقه الجهاز.",
	cancel: "إلغاء",
	confirmReset: "وضع أمر إعادة الضبط",
	historyEyebrow: "دورة حياة الأمر",
	historyTitle: "دورة حياة الأوامر الأخيرة",
	historyDescription:
		"تُقرأ الحالة من الخادم. وقت التسليم بيانات وليس حالة في دورة الحياة.",
	historyEmpty: "لا توجد أوامر أخيرة متاحة.",
	historyLoading: "جارٍ تحميل دورة حياة الأوامر الأخيرة…",
	historyUnavailable:
		"تعذر تحميل دورة حياة الأوامر الأخيرة. الحالة غير متاحة حتى يستجيب الخادم.",
	statuses: {
		pending: "بانتظار تطبيق جهاز العد",
		applied: "طبّقه جهاز العد",
		superseded: "تجاوزه أمر أحدث",
	},
	setTo: "تعيين العدد إلى",
	resetToZero: "إعادة ضبط العدد إلى 0",
	command: "الأمر",
	reason: "السبب",
	commandAccepted: (status: string) => `حالة الأمر: ${status}.`,
	badRequest:
		"تعذر وضع الأمر في قائمة الانتظار. حدّث الحالة التشغيلية وتحقق من القيم.",
	forbidden: "لا تسمح هذه الجلسة بإصدار أوامر الموظفين.",
	sessionExpired: "انتهت جلسة الموظفين. سجّل الدخول مرة أخرى.",
	serviceError: "خدمة الأوامر غير متاحة. حاول مرة أخرى دون إعادة تحميل الصفحة.",
};

export function useStaffCommandMessages(): StaffCommandMessages {
	const { locale } = useI18n();
	return locale === "ar" ? ar : en;
}
