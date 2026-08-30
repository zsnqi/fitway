/** The exact visual/UI states of the form, in one closed union. */
export type OwnerSettingsUiState =
	| "clean"
	| "dirty-valid"
	| "dirty-invalid"
	| "saving"
	| "saved"
	| "failed"
	| "conflict";

/**
 * Component-owned bilingual copy for the owner Settings section.
 *
 * Paper-approved strings (labels, helpers, locked-timing copy, the clean/
 * unsaved/saving/saved/failure states) are taken verbatim from the accepted
 * fresh successor frames. Runtime-only messages (loading, retry, validation,
 * version conflict, announcements) are native Arabic, never transliteration.
 *
 * Numeric ranges use a plain hyphen in Arabic and Latin values such as
 * `Asia/Riyadh`, `20 s`, and `HH:mm` are rendered inside `bdi` isolation by
 * the view, so the bidi algorithm cannot reverse a Western-digit run inside
 * an RTL sentence.
 */
export const ownerSettingsMessages = {
	en: {
		title: "Settings",
		intro:
			"Versioned owner configuration. Changes apply prospectively and never rewrite history.",

		loading: "Loading settings",
		loadingDescription: "Preparing the current settings version.",
		errorTitle: "Settings could not be loaded",
		errorDescription:
			"No values have been substituted. Check the connection and try again.",
		retry: "Try again",

		currentVersion: "Current version",
		save: "Save settings",
		saveShort: "Saving…",
		discard: "Discard changes",

		stateShort: {
			clean: "Clean",
			dirty: "Unsaved",
			invalid: "Unsaved",
			saving: "Saving",
			saved: "Saved",
			failed: "Not saved",
			conflict: "Changed",
		},
		cleanState: "Clean · no unsaved changes",
		unsavedState: "Unsaved changes",
		savingState: "Saving settings…",
		savedState: "Saved",

		savedAnnouncement: "Settings version {version} created.",
		savedDetail:
			"The current values are now clean. No secret or credential is recorded.",
		failureAnnouncement:
			"Nothing was changed. Your entered values remain in the form; try saving again.",
		conflictAnnouncement:
			"Settings changed elsewhere. Discard reloads the current values; your draft is not applied.",
		invalidAnnouncement:
			"Check the highlighted fields. Save stays locked until they are fixed.",

		foundationsTitle: "Editable gym rules",
		foundationsHelper:
			"All fields are private owner settings. Required fields keep persistent labels.",
		capacityLabel: "Capacity",
		capacityUnit: "people",
		boundaryLabel: "Business-day boundary",
		boundaryUnit: (timezone: string) => `${timezone} time`,
		resetLabel: "Reset buffer",
		resetUnit: "minutes",

		thresholdsTitle: "Crowd band thresholds",
		thresholdsHelper:
			"Enter ordered percentage boundaries. Packed begins above Busy.",
		quietLabel: "Quiet ends at",
		moderateLabel: "Moderate ends at",
		busyLabel: "Busy ends at",

		weeklyTitle: "Weekly gym hours",
		weeklyHelper:
			"Each day has an open/close pair. Past-midnight closing stays with the opening day.",
		columnDay: "Day",
		columnOpens: "Opens",
		columnCloses: "Closes",
		columnState: "Closed",
		opensSub: "Opens",
		closesSub: "Closes",
		weekdays: {
			sun: "Sunday",
			mon: "Monday",
			tue: "Tuesday",
			wed: "Wednesday",
			thu: "Thursday",
			fri: "Friday",
			sat: "Saturday",
		},
		open: "Open",
		closed: "Closed",
		closesNextDay: "Closes next day",
		closedDayMessage: "Open and close unavailable while closed",

		lockedTitle: "Operational timing · locked",
		lockedTitleMobile: "◇ Operational timing · locked",
		lockedHelper:
			"Copied forward unchanged into the new settings version and managed by the system.",
		lockedHelperMobile: "System-managed · copied forward unchanged.",
		lockedBadge: "◇ Read-only",
		timezoneLabel: "Timezone",
		pushLabel: "Edge push",
		freshLabel: "Fresh through",
		staleLabel: "Operational stale",
		pollLabel: "Public poll",
		lockedFooterLong:
			"Saving creates a new settings version and one existing settings audit entry. No secret values appear here.",
		lockedFooterShort:
			"New settings version + existing settings audit · no secrets.",

		errors: {
			required: "This field is required.",
			capacity: {
				required: "Enter a capacity.",
				invalid: "Capacity must be a whole number.",
				range: "Capacity must be between 1 and 2147483647.",
			},
			reset: {
				required: "Enter a reset buffer.",
				invalid: "The reset buffer must be a whole number.",
				range: "The reset buffer must be between 0 and 2147483647.",
			},
			wallTime: {
				required: "Enter a time.",
				invalid: "Use a 24-hour time as HH:mm.",
			},
			threshold: {
				required: "Enter a percentage.",
				invalid: "The percentage must be a whole number.",
				range: "The percentage must be between 0 and 100.",
			},
			moderateOrder: (quiet: number) =>
				`Moderate must be greater than Quiet (${quiet}%).`,
			busyOrder: (moderate: number) =>
				`Busy must be greater than Moderate (${moderate}%).`,
		} satisfies {
			required: string;
			capacity: Record<"required" | "invalid" | "range", string>;
			reset: Record<"required" | "invalid" | "range", string>;
			wallTime: Record<"required" | "invalid", string>;
			threshold: Record<"required" | "invalid" | "range", string>;
			moderateOrder: (quiet: number) => string;
			busyOrder: (moderate: number) => string;
		},
	},
	ar: {
		title: "الإعدادات",
		intro:
			"إعدادات مالك بإصدارات. تنطبق التغييرات مستقبلاً ولا تعيد كتابة السجل.",

		loading: "جارٍ تحميل الإعدادات",
		loadingDescription: "جارٍ تجهيز إصدار الإعدادات الحالي.",
		errorTitle: "تعذر تحميل الإعدادات",
		errorDescription: "لم نستبدل أي قيمة. تحقق من الاتصال ثم أعد المحاولة.",
		retry: "إعادة المحاولة",

		currentVersion: "الإصدار الحالي",
		save: "حفظ الإعدادات",
		saveShort: "جارٍ الحفظ…",
		discard: "تجاهل التغييرات",

		stateShort: {
			clean: "نظيف",
			dirty: "غير محفوظ",
			invalid: "غير محفوظ",
			saving: "جارٍ الحفظ",
			saved: "تم الحفظ",
			failed: "لم يتم الحفظ",
			conflict: "تغيّرت",
		},
		cleanState: "نظيف · لا تغييرات غير محفوظة",
		unsavedState: "تغييرات غير محفوظة",
		savingState: "جارٍ حفظ الإعدادات…",
		savedState: "تم الحفظ",

		savedAnnouncement: "تم إنشاء إصدار الإعدادات {version}.",
		savedDetail:
			"القيم الحالية نظيفة الآن، ولا تُسجَّل أي أسرار أو بيانات اعتماد.",
		failureAnnouncement:
			"لم يتغير شيء. تبقى القيم التي أدخلتها في النموذج؛ حاول الحفظ مجدداً.",
		conflictAnnouncement:
			"تغيّرت الإعدادات من مكان آخر. تجاهل التغييرات يعيد تحميل القيم الحالية، ولا تُطبَّق مسودتك.",
		invalidAnnouncement: "راجع الحقول المظللة. يبقى الحفظ مقفلاً حتى تُصحَّح.",

		foundationsTitle: "قواعد النادي القابلة للتعديل",
		foundationsHelper: "كل الحقول إعدادات خاصة بالمالك، مع تسميات ظاهرة دائماً.",
		capacityLabel: "السعة",
		capacityUnit: "شخص",
		boundaryLabel: "حد يوم العمل",
		boundaryUnit: (timezone: string) => `بتوقيت ${timezone}`,
		resetLabel: "مهلة إعادة الضبط",
		resetUnit: "دقيقة",

		thresholdsTitle: "حدود نطاقات الازدحام",
		thresholdsHelper: "أدخل ثلاث نسب مرتبة. يبدأ النطاق ممتلئ بعد نهاية مزدحم.",
		quietLabel: "نهاية النطاق الهادئ",
		moderateLabel: "نهاية النطاق المتوسط",
		busyLabel: "نهاية النطاق المزدحم",

		weeklyTitle: "ساعات النادي الأسبوعية",
		weeklyHelper:
			"لكل يوم وقت فتح وإغلاق. الإغلاق بعد منتصف الليل يبقى مع يوم الفتح.",
		columnDay: "اليوم",
		columnOpens: "يفتح",
		columnCloses: "يغلق",
		columnState: "مغلق",
		opensSub: "يفتح",
		closesSub: "يغلق",
		weekdays: {
			sun: "الأحد",
			mon: "الإثنين",
			tue: "الثلاثاء",
			wed: "الأربعاء",
			thu: "الخميس",
			fri: "الجمعة",
			sat: "السبت",
		},
		open: "مفتوح",
		closed: "مغلق",
		closesNextDay: "يغلق في اليوم التالي",
		closedDayMessage: "وقتا الفتح والإغلاق غير متاحين عند الإغلاق",

		lockedTitle: "التوقيت التشغيلي · مقفل",
		lockedTitleMobile: "◇ التوقيت التشغيلي · مقفل",
		lockedHelper:
			"ينسخه النظام دون تغيير إلى إصدار الإعدادات الجديد ويديره مركزياً.",
		lockedHelperMobile: "يديرها النظام · تُنسخ دون تغيير.",
		lockedBadge: "◇ للقراءة فقط",
		timezoneLabel: "المنطقة الزمنية",
		pushLabel: "فاصل دفع التحديثات الطرفية",
		freshLabel: "مدة حداثة البيانات",
		staleLabel: "حد التقادم التشغيلي",
		pollLabel: "فاصل تحديث العرض العام",
		lockedFooterLong:
			"ينشئ الحفظ إصدار إعدادات جديداً وسجل تدقيق الإعدادات الحالي فقط. لا تظهر أي قيم سرية هنا.",
		lockedFooterShort:
			"إصدار إعدادات جديد + سجل تدقيق الإعدادات الحالي · بلا أسرار.",

		errors: {
			required: "هذا الحقل مطلوب.",
			capacity: {
				required: "أدخل السعة.",
				invalid: "يجب أن تكون السعة رقماً صحيحاً.",
				range: "يجب أن تكون السعة بين 1 و2147483647.",
			},
			reset: {
				required: "أدخل مهلة إعادة الضبط.",
				invalid: "يجب أن تكون المهلة رقماً صحيحاً.",
				range: "يجب أن تكون المهلة بين 0 و2147483647.",
			},
			wallTime: {
				required: "أدخل الوقت.",
				invalid: "استخدم توقيت 24 ساعة بالصيغة HH:mm.",
			},
			threshold: {
				required: "أدخل النسبة.",
				invalid: "يجب أن تكون النسبة رقماً صحيحاً.",
				range: "يجب أن تكون النسبة بين 0 و100.",
			},
			moderateOrder: (quiet: number) =>
				`يجب أن يكون متوسط أكبر من هادئ (${quiet}%).`,
			busyOrder: (moderate: number) =>
				`يجب أن يكون مزدحم أكبر من متوسط (${moderate}%).`,
		} satisfies {
			required: string;
			capacity: Record<"required" | "invalid" | "range", string>;
			reset: Record<"required" | "invalid" | "range", string>;
			wallTime: Record<"required" | "invalid", string>;
			threshold: Record<"required" | "invalid" | "range", string>;
			moderateOrder: (quiet: number) => string;
			busyOrder: (moderate: number) => string;
		},
	},
} as const;

export type OwnerSettingsMessages =
	(typeof ownerSettingsMessages)[keyof typeof ownerSettingsMessages];
