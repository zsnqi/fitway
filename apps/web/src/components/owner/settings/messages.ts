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
 * Numeric ranges use a plain hyphen in Arabic. Exact timezone identifiers and
 * localized operational values are isolated by
 * the view, so the bidi algorithm cannot reverse a Western-digit run inside
 * an RTL sentence.
 */
export const ownerSettingsMessages = {
	en: {
		title: "Settings",
		intro:
			"Versioned owner configuration. Changes apply prospectively and never rewrite history.",

		loading: "Loading settings",
		loadingDescription: "Loading your gym settings.",
		errorTitle: "Settings could not be loaded",
		errorDescription: "Check the connection and try again.",
		retry: "Try again",

		currentVersion: "Current version",
		save: "Save settings",
		saveShort: "Saving…",
		discard: "Discard changes",

		stateShort: {
			clean: "Saved",
			dirty: "Unsaved",
			invalid: "Unsaved",
			saving: "Saving",
			saved: "Saved",
			failed: "Not saved",
			conflict: "Changed",
		},
		cleanState: "All changes saved",
		unsavedState: "Unsaved changes",
		savingState: "Saving settings…",
		savedState: "Saved",

		savedAnnouncement: "Settings version {version} created.",
		savedDetail: "Your settings have been saved.",
		failureAnnouncement:
			"Nothing was changed. Your entered values remain in the form; try saving again.",
		conflictAnnouncement:
			"Settings changed elsewhere. Discard reloads the current values; your draft is not applied.",
		invalidAnnouncement:
			"Check the highlighted fields. Save stays locked until they are fixed.",

		foundationsTitle: "Gym settings",
		foundationsHelper:
			"All fields are private owner settings. Required fields keep persistent labels.",
		capacityLabel: "Capacity",
		capacityUnit: "people",
		boundaryLabel: "Day starts at",
		boundaryUnit: (timezone: string) =>
			timezone === "Asia/Riyadh" ? "Riyadh time" : `${timezone} time`,
		timePlaceholder: "04:00",
		resetLabel: "Reset buffer",
		resetUnit: "minutes",

		thresholdsTitle: "Crowd levels",
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

		lockedTitle: "System timing",
		lockedTitleMobile: "◇ System timing",
		lockedHelper:
			"Copied forward unchanged into the new settings version and managed by the system.",
		lockedHelperMobile: "System-managed · copied forward unchanged.",
		lockedBadge: "◇ Read-only",
		timezoneLabel: "Timezone",
		pushLabel: "Counter updates",
		freshLabel: "Live reading limit",
		staleLabel: "Connection warning after",
		pollLabel: "Public refresh",
		timezoneValue: (timezone: string) =>
			timezone === "Asia/Riyadh" ? `Riyadh time (${timezone})` : timezone,
		secondsValue: (value: number) => `${value} seconds`,
		lockedFooterLong:
			"Saving creates a new settings version and a Settings entry in Activity Log. No secret values appear here.",
		lockedFooterShort:
			"New settings version + Settings entry in Activity Log · no secrets.",

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
				invalid: "Use 24-hour time, for example 04:00.",
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
		loadingDescription: "جارٍ تحميل إعدادات النادي.",
		errorTitle: "تعذر تحميل الإعدادات",
		errorDescription: "تحقق من الاتصال ثم أعد المحاولة.",
		retry: "إعادة المحاولة",

		currentVersion: "الإصدار الحالي",
		save: "حفظ الإعدادات",
		saveShort: "جارٍ الحفظ…",
		discard: "تجاهل التغييرات",

		stateShort: {
			clean: "محفوظ",
			dirty: "غير محفوظ",
			invalid: "غير محفوظ",
			saving: "جارٍ الحفظ",
			saved: "تم الحفظ",
			failed: "لم يتم الحفظ",
			conflict: "تغيّرت",
		},
		cleanState: "كل التغييرات محفوظة",
		unsavedState: "تغييرات غير محفوظة",
		savingState: "جارٍ حفظ الإعدادات…",
		savedState: "تم الحفظ",

		savedAnnouncement: "تم إنشاء إصدار الإعدادات {version}.",
		savedDetail: "تم حفظ إعداداتك.",
		failureAnnouncement:
			"لم يتغير شيء. تبقى القيم التي أدخلتها في النموذج؛ حاول الحفظ مجدداً.",
		conflictAnnouncement:
			"تغيّرت الإعدادات من مكان آخر. تجاهل التغييرات يعيد تحميل القيم الحالية، ولا تُطبَّق مسودتك.",
		invalidAnnouncement: "راجع الحقول المظللة. يبقى الحفظ مقفلاً حتى تُصحَّح.",

		foundationsTitle: "إعدادات النادي",
		foundationsHelper: "كل الحقول إعدادات خاصة بالمالك، مع تسميات ظاهرة دائماً.",
		capacityLabel: "السعة",
		capacityUnit: "شخص",
		boundaryLabel: "بداية يوم العمل",
		boundaryUnit: (timezone: string) =>
			timezone === "Asia/Riyadh" ? "بتوقيت الرياض" : `بتوقيت ${timezone}`,
		timePlaceholder: "04:00",
		resetLabel: "مهلة إعادة الضبط",
		resetUnit: "دقيقة",

		thresholdsTitle: "مستويات الازدحام",
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

		lockedTitle: "توقيت النظام",
		lockedTitleMobile: "◇ توقيت النظام",
		lockedHelper:
			"ينسخه النظام دون تغيير إلى إصدار الإعدادات الجديد ويديره مركزياً.",
		lockedHelperMobile: "يديرها النظام · تُنسخ دون تغيير.",
		lockedBadge: "◇ للقراءة فقط",
		timezoneLabel: "المنطقة الزمنية",
		pushLabel: "تحديث جهاز العد",
		freshLabel: "مدة القراءة المباشرة",
		staleLabel: "التنبيه عن تأخر الاتصال",
		pollLabel: "تحديث العرض العام",
		timezoneValue: (timezone: string) =>
			timezone === "Asia/Riyadh" ? `توقيت الرياض (${timezone})` : timezone,
		secondsValue: (value: number) => `${value} ثانية`,
		lockedFooterLong:
			"ينشئ الحفظ إصدار إعدادات جديداً وسجلاً للإعدادات في سجل النشاط. لا تظهر أي قيم سرية هنا.",
		lockedFooterShort:
			"إصدار إعدادات جديد + سجل للإعدادات في سجل النشاط · بلا أسرار.",

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
				invalid: "استخدم نظام 24 ساعة، مثلاً 04:00.",
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
