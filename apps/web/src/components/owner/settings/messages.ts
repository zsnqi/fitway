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
			"Set capacity, crowd levels, business day, and weekly hours. Changes apply from now on and never rewrite past reports.",

		loading: "Loading settings",
		loadingDescription: "Loading your gym settings.",
		errorTitle: "Settings could not be loaded",
		errorDescription: "Check the connection and try again.",
		retry: "Try again",

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

		savedAnnouncement:
			"Settings saved. The change is recorded in Activity Log.",
		savedDetail: "Your settings have been saved.",
		failureAnnouncement:
			"Nothing was changed. Your entered values remain in the form; try saving again.",
		conflictAnnouncement:
			"Settings changed elsewhere. Discard reloads the current values; your draft is not applied.",
		invalidAnnouncement:
			"Check the highlighted fields. Save stays locked until they are fixed.",

		foundationsTitle: "Gym settings",
		foundationsHelper: "Your private gym settings.",
		capacityLabel: "Capacity",
		capacityUnit: "people",
		boundaryLabel: "Day starts at",
		boundaryUnit: (timezone: string) =>
			timezone === "Asia/Riyadh" ? "Riyadh time" : `${timezone} time`,
		timePlaceholder: "04:00",
		resetLabel: "Count reset delay",
		resetUnit: "minutes",

		thresholdsTitle: "Crowd levels",
		thresholdsHelper:
			"Enter three ordered percentages that set the crowd levels. Packed begins above Busy.",
		quietLabel: "Quiet ends at",
		moderateLabel: "Moderate ends at",
		busyLabel: "Busy ends at",

		weeklyTitle: "Weekly gym hours",
		weeklyHelper:
			"Each day has an open/close pair. Past-midnight closing stays with the opening day.",
		columnDay: "Day",
		columnOpens: "Opens",
		columnCloses: "Closes",
		columnState: "Status",
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

		lockedTitle: "Technical settings",
		lockedTitleMobile: "◇ Technical settings",
		lockedHelper: "Managed automatically. You cannot change these here.",
		lockedHelperMobile: "Managed automatically · read-only",
		lockedBadge: "◇ Read-only",
		timezoneLabel: "Timezone",
		pushLabel: "Counter update interval",
		freshLabel: "Reading stays live for",
		staleLabel: "Warning after no update for",
		pollLabel: "Public page refresh",
		timezoneValue: (timezone: string) =>
			timezone === "Asia/Riyadh" ? `Riyadh time (${timezone})` : timezone,
		secondsValue: (value: number) => `${value} seconds`,
		lockedFooterLong: "Saving records the change in Activity Log.",
		lockedFooterShort: "Changes are recorded in Activity Log.",

		errors: {
			required: "This field is required.",
			capacity: {
				required: "Enter a capacity.",
				invalid: "Capacity must be a whole number.",
				range: "Enter a number of people.",
			},
			reset: {
				required: "Enter a reset buffer.",
				invalid: "The reset buffer must be a whole number.",
				range: "Enter a number of minutes.",
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
			"اضبط السعة ومستويات الازدحام ويوم العمل وساعات الأسبوع. تنطبق التغييرات من الآن ولا تعيد كتابة التقارير السابقة.",

		loading: "جارٍ تحميل الإعدادات",
		loadingDescription: "جارٍ تحميل إعدادات الصالة.",
		errorTitle: "تعذر تحميل الإعدادات",
		errorDescription: "تحقق من الاتصال ثم أعد المحاولة.",
		retry: "إعادة المحاولة",

		save: "حفظ الإعدادات",
		saveShort: "جارٍ الحفظ…",
		discard: "تجاهل التغييرات",

		stateShort: {
			clean: "محفوظ",
			dirty: "غير محفوظ",
			invalid: "غير محفوظ",
			saving: "جارٍ الحفظ",
			saved: "تم الحفظ",
			failed: "لم يُحفظ",
			conflict: "تغيّرت",
		},
		cleanState: "كل التغييرات محفوظة",
		unsavedState: "تغييرات غير محفوظة",
		savingState: "جارٍ حفظ الإعدادات…",
		savedState: "تم الحفظ",

		savedAnnouncement: "تم حفظ الإعدادات. سُجّل التغيير في سجل النشاط.",
		savedDetail: "تم حفظ إعداداتك.",
		failureAnnouncement:
			"لم يتغير شيء. تبقى القيم التي أدخلتها في النموذج؛ حاول الحفظ مجدداً.",
		conflictAnnouncement:
			"تغيّرت الإعدادات من مكان آخر. تجاهل التغييرات يعيد تحميل القيم الحالية، ولا تُطبَّق مسودتك.",
		invalidAnnouncement: "راجع الحقول المظللة. يبقى الحفظ مقفلاً حتى تُصحَّح.",

		foundationsTitle: "إعدادات الصالة",
		foundationsHelper: "إعدادات صالتك الخاصة.",
		capacityLabel: "السعة",
		capacityUnit: "شخص",
		boundaryLabel: "بداية يوم العمل",
		boundaryUnit: (timezone: string) =>
			timezone === "Asia/Riyadh" ? "بتوقيت الرياض" : `بتوقيت ${timezone}`,
		timePlaceholder: "04:00",
		resetLabel: "مهلة تصفير العداد",
		resetUnit: "دقيقة",

		thresholdsTitle: "مستويات الازدحام",
		thresholdsHelper: "أدخل ثلاث نسب مرتبة تحدد مستويات الازدحام.",
		quietLabel: "نهاية النطاق الهادئ",
		moderateLabel: "نهاية النطاق المتوسط",
		busyLabel: "نهاية النطاق المزدحم",

		weeklyTitle: "ساعات الصالة الأسبوعية",
		weeklyHelper:
			"لكل يوم وقت فتح وإغلاق. الإغلاق بعد منتصف الليل يبقى مع يوم الفتح.",
		columnDay: "اليوم",
		columnOpens: "يفتح",
		columnCloses: "يغلق",
		columnState: "الحالة",
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

		lockedTitle: "إعدادات فنية",
		lockedTitleMobile: "◇ إعدادات فنية",
		lockedHelper: "تُدار تلقائياً ولا يمكن تغييرها من هنا.",
		lockedHelperMobile: "تُدار تلقائياً · للقراءة فقط",
		lockedBadge: "◇ للقراءة فقط",
		timezoneLabel: "المنطقة الزمنية",
		pushLabel: "الفاصل بين تحديثات جهاز العد",
		freshLabel: "مدة بقاء القراءة مباشرة",
		staleLabel: "التحذير بعد توقف التحديث",
		pollLabel: "تحديث الصفحة العامة",
		timezoneValue: (timezone: string) =>
			timezone === "Asia/Riyadh" ? `توقيت الرياض (${timezone})` : timezone,
		secondsValue: (value: number) => `${value} ثانية`,
		lockedFooterLong: "سيُسجَّل التغيير في سجل النشاط عند الحفظ.",
		lockedFooterShort: "يُسجَّل التغيير في سجل النشاط.",

		errors: {
			required: "هذا الحقل مطلوب.",
			capacity: {
				required: "أدخل السعة.",
				invalid: "يجب أن تكون السعة رقماً صحيحاً.",
				range: "أدخل عدداً من الأشخاص.",
			},
			reset: {
				required: "أدخل مهلة إعادة الضبط.",
				invalid: "يجب أن تكون المهلة رقماً صحيحاً.",
				range: "أدخل عدداً من الدقائق.",
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
