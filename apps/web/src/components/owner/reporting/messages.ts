/**
 * Component-owned bilingual copy for the owner reporting extension: the
 * weekday-by-hour heatmap, the week-over-week comparison, and the CSV export.
 *
 * Three rules shaped this catalog.
 *
 * Closed, missing, and a genuine zero are three different facts, so each one owns its
 * own words here and none of them is ever phrased as another. "Closed" says the gym was
 * not open; "no data" says nothing was recorded; "zero" says the gym was open and empty.
 *
 * Every figure that has a denominator states it. An average is stated over the minutes
 * it was measured on, and coverage over the minutes that were scheduled.
 *
 * Arabic numeric ranges use a plain hyphen. An en dash between two numbers is a neutral
 * character, so `30-60` in a right-to-left run renders as `60-30` and the range reverses
 * itself in front of the reader.
 */
export const ownerReportingMessages = {
	en: {
		pageTitle: "Analytics",
		title: "Busiest times and direction",
		description:
			"How the week actually fills, by weekday and gym-local hour · every average is measured on observed open minutes only",
		timeZoneLabel: "Gym timezone",
		windowLabel: "Window",
		windowDays: "Business days",

		rangeLegend: "Reporting window",
		rangeHint: "Up to 31 business days, so every weekday has enough samples.",
		startLabel: "First business day",
		endLabel: "Last business day",
		apply: "Update",
		restoreDefault: "Last 28 days",
		problemIncomplete: "Choose both a first and a last business day.",
		problemMalformed: "That is not a real calendar day.",
		problemInverted: "The last day comes before the first day.",
		problemTooLong: "This window is longer than 31 business days.",
		problemCsvTooLong: "An export covers at most 366 business days.",

		loading: "Loading the reporting window",
		loadingDescription: "Preparing the weekday averages and the comparison.",
		errorTitle: "The reporting window could not be loaded",
		errorDescription:
			"No figure has been substituted. Check the connection and try again.",
		comparisonErrorTitle: "The comparison could not be loaded",
		retry: "Try again",

		heatmapTitle: "Weekday by hour",
		heatmapDescription:
			"Average occupancy in each gym-local hour, across every occurrence of that weekday in the window.",
		heatmapRegion: "Weekday by hour heatmap",
		heatmapHint:
			"Select a cell to read its figures. Arrow keys move between cells.",
		hourAxis: "Gym-local hour",
		weekdayAxis: "Weekday",
		legendLabel: "Cell meaning",
		legendQuiet: "Quieter",
		legendBusy: "Busier",
		legendZero: "Open and empty",
		legendClosed: "Closed",
		legendMissing: "No data",

		selectedTitle: "Selected hour",
		selectedAverage: "Average occupancy",
		selectedObserved: "Observed open minutes",
		selectedExpected: "Scheduled open minutes",
		selectedSamples: "Weekdays measured",
		selectedNoValue: "No average — nothing was observed in this hour.",
		selectedClosed: "The gym was not open in this hour.",
		selectedMissing: "No history was recorded for this hour.",

		tableSummary: "Read the heatmap as a table",
		tableRegion: "Weekday by hour figures",
		columnWeekday: "Weekday",
		columnHour: "Hour",
		columnState: "State",
		columnAverage: "Average occupancy",
		columnObserved: "Observed open minutes",
		columnExpected: "Scheduled open minutes",
		columnSamples: "Weekdays measured",

		stateValue: "Observed",
		stateZero: "Open and empty",
		stateClosed: "Closed",
		stateMissing: "No data",

		comparisonTitle: "Week over week",
		comparisonDescription:
			"The last complete week against the week before it, both resolved from the gym's own business days.",
		comparisonCurrent: "Latest week",
		comparisonPrior: "Week before",
		comparisonAverage: "Average occupancy",
		comparisonCrossings: "Estimated entrance crossings",
		comparisonCoverage: "Observed coverage",
		comparisonChange: "Change",
		comparisonUp: "up",
		comparisonDown: "down",
		comparisonFlat: "unchanged",
		comparisonNoAverage: "Not measurable",
		comparisonCrossingsNote:
			"Entrance crossings are counted at the door; they are not unique members.",

		insufficientTitle: "Not enough comparable history yet",
		insufficientDescription:
			"Both weeks must be observed for at least this much of their scheduled open minutes before a direction can be stated. The figures below are shown as they stand, without a comparison.",
		insufficientMinimum: "Coverage a week must reach",
		current_week_no_expected_open_minutes:
			"The latest week had no scheduled open minutes at all.",
		current_week_coverage_below_minimum:
			"The latest week was observed for too little of its scheduled open minutes.",
		prior_week_no_expected_open_minutes:
			"The week before had no scheduled open minutes at all.",
		prior_week_coverage_below_minimum:
			"The week before was observed for too little of its scheduled open minutes.",

		csvTitle: "Export per-minute history",
		csvDescription:
			"One row per minute, with both the UTC instant and the gym-local time. UTF-8 and spreadsheet-safe.",
		csvLegend: "Export window",
		csvHint: "Up to 366 business days per export.",
		csvExport: "Prepare export",
		csvAbort: "Stop the export",
		csvDownload: "Download the file",
		csvExporting: "Preparing the export",
		csvRows: "Rows prepared",
		csvReadyTitle: "The export is ready",
		csvReadyDescription:
			"The file covers the whole window you chose. Nothing was summarised or rounded on the way out.",
		csvAbortedTitle: "The export was stopped",
		csvAbortedDescription:
			"Nothing was kept. A stopped export is a partial file, and a partial file would not be the window you asked for.",
		csvRangeErrorTitle: "That export window cannot be used",
		csvTransportErrorTitle: "The export could not be completed",
		csvTransportErrorDescription:
			"No partial file was kept. Check the connection and start the export again.",
		csvStartOver: "Start over",
		csvPrivacyNote:
			"The file carries occupancy history only: no device, no account, and nothing about an individual visitor.",

		scrollHint: "This grid scrolls sideways to reveal every hour.",
		footnote:
			"An average is taken over the minutes that were actually observed, so an outage lowers the coverage figure rather than quietly lowering the average. Closed hours are excluded from every average instead of being counted as empty. Band and capacity come from the snapshot stored on each minute, so changing a setting today never rewrites what last month looked like.",
		of: "of",
		none: "None",
	},
	ar: {
		pageTitle: "التحليلات",
		title: "أوقات الذروة والاتجاه",
		description:
			"كيف يمتلئ الأسبوع فعلياً، بحسب اليوم والساعة بتوقيت الصالة · كل متوسط محسوب على دقائق العمل المرصودة وحدها",
		timeZoneLabel: "المنطقة الزمنية للصالة",
		windowLabel: "الفترة",
		windowDays: "أيام العمل",

		rangeLegend: "فترة التقرير",
		rangeHint: "حتى 31 يوم عمل، لتكفي العينات لكل يوم من أيام الأسبوع.",
		startLabel: "أول يوم عمل",
		endLabel: "آخر يوم عمل",
		apply: "تحديث",
		restoreDefault: "آخر 28 يوماً",
		problemIncomplete: "اختر أول يوم عمل وآخر يوم عمل معاً.",
		problemMalformed: "هذا ليس تاريخاً صحيحاً.",
		problemInverted: "آخر يوم يسبق أول يوم.",
		problemTooLong: "هذه الفترة أطول من 31 يوم عمل.",
		problemCsvTooLong: "يغطي التصدير 366 يوم عمل على الأكثر.",

		loading: "جارٍ تحميل فترة التقرير",
		loadingDescription: "جارٍ تجهيز متوسطات الأيام والمقارنة.",
		errorTitle: "تعذر تحميل فترة التقرير",
		errorDescription: "لم نستبدل أي رقم. تحقق من الاتصال ثم أعد المحاولة.",
		comparisonErrorTitle: "تعذر تحميل المقارنة",
		retry: "إعادة المحاولة",

		heatmapTitle: "اليوم مقابل الساعة",
		heatmapDescription:
			"متوسط الإشغال في كل ساعة بتوقيت الصالة، عبر كل تكرار لذلك اليوم ضمن الفترة.",
		heatmapRegion: "خريطة اليوم مقابل الساعة",
		heatmapHint: "اختر خانة لقراءة أرقامها. تنقل بين الخانات بمفاتيح الأسهم.",
		hourAxis: "الساعة بتوقيت الصالة",
		weekdayAxis: "اليوم",
		legendLabel: "دلالة الخانة",
		legendQuiet: "أهدأ",
		legendBusy: "أزحم",
		legendZero: "مفتوحة وفارغة",
		legendClosed: "مغلقة",
		legendMissing: "لا توجد بيانات",

		selectedTitle: "الساعة المختارة",
		selectedAverage: "متوسط الإشغال",
		selectedObserved: "دقائق العمل المرصودة",
		selectedExpected: "دقائق العمل المجدولة",
		selectedSamples: "الأيام المقيسة",
		selectedNoValue: "لا يوجد متوسط — لم يُرصد شيء في هذه الساعة.",
		selectedClosed: "لم تكن الصالة مفتوحة في هذه الساعة.",
		selectedMissing: "لم يُسجَّل أي تاريخ لهذه الساعة.",

		tableSummary: "اقرأ الخريطة كجدول",
		tableRegion: "أرقام اليوم مقابل الساعة",
		columnWeekday: "اليوم",
		columnHour: "الساعة",
		columnState: "الحالة",
		columnAverage: "متوسط الإشغال",
		columnObserved: "دقائق العمل المرصودة",
		columnExpected: "دقائق العمل المجدولة",
		columnSamples: "الأيام المقيسة",

		stateValue: "مرصودة",
		stateZero: "مفتوحة وفارغة",
		stateClosed: "مغلقة",
		stateMissing: "لا توجد بيانات",

		comparisonTitle: "أسبوع مقابل أسبوع",
		comparisonDescription:
			"آخر أسبوع مكتمل مقابل الأسبوع الذي سبقه، وكلاهما محسوب بأيام عمل الصالة نفسها.",
		comparisonCurrent: "الأسبوع الأخير",
		comparisonPrior: "الأسبوع السابق",
		comparisonAverage: "متوسط الإشغال",
		comparisonCrossings: "عبور الباب التقديري",
		comparisonCoverage: "نسبة الرصد",
		comparisonChange: "التغيّر",
		comparisonUp: "ارتفاع",
		comparisonDown: "انخفاض",
		comparisonFlat: "بلا تغيّر",
		comparisonNoAverage: "غير قابل للقياس",
		comparisonCrossingsNote:
			"يُحتسب عبور الباب عند المدخل، وهو ليس عدد الأعضاء المختلفين.",

		insufficientTitle: "لا يوجد سجل كافٍ للمقارنة بعد",
		insufficientDescription:
			"يجب أن يُرصد كلا الأسبوعين بهذا القدر على الأقل من دقائق عملهما المجدولة قبل تحديد أي اتجاه. الأرقام أدناه معروضة كما هي، بلا مقارنة.",
		insufficientMinimum: "الحد الأدنى لنسبة الرصد",
		current_week_no_expected_open_minutes:
			"لم تكن للأسبوع الأخير أي دقائق عمل مجدولة أصلاً.",
		current_week_coverage_below_minimum:
			"رُصد من الأسبوع الأخير قدر أقل من اللازم من دقائق عمله المجدولة.",
		prior_week_no_expected_open_minutes:
			"لم تكن للأسبوع السابق أي دقائق عمل مجدولة أصلاً.",
		prior_week_coverage_below_minimum:
			"رُصد من الأسبوع السابق قدر أقل من اللازم من دقائق عمله المجدولة.",

		csvTitle: "تصدير السجل بالدقيقة",
		csvDescription:
			"سطر لكل دقيقة، يحمل اللحظة بتوقيت UTC وتوقيت الصالة معاً. بترميز UTF-8 وصالح لبرامج الجداول.",
		csvLegend: "فترة التصدير",
		csvHint: "حتى 366 يوم عمل في كل تصدير.",
		csvExport: "تجهيز التصدير",
		csvAbort: "إيقاف التصدير",
		csvDownload: "تنزيل الملف",
		csvExporting: "جارٍ تجهيز التصدير",
		csvRows: "الأسطر المجهّزة",
		csvReadyTitle: "التصدير جاهز",
		csvReadyDescription:
			"يغطي الملف كامل الفترة التي اخترتها. لم نلخّص أو نقرّب أي رقم فيه.",
		csvAbortedTitle: "أُوقف التصدير",
		csvAbortedDescription:
			"لم نحتفظ بشيء. التصدير الموقوف ملف ناقص، والملف الناقص ليس الفترة التي طلبتها.",
		csvRangeErrorTitle: "لا يمكن استخدام فترة التصدير هذه",
		csvTransportErrorTitle: "تعذر إكمال التصدير",
		csvTransportErrorDescription:
			"لم نحتفظ بأي ملف ناقص. تحقق من الاتصال ثم ابدأ التصدير من جديد.",
		csvStartOver: "ابدأ من جديد",
		csvPrivacyNote:
			"يحمل الملف سجل الإشغال فقط: لا جهاز، ولا حساب، ولا أي شيء عن زائر بعينه.",

		scrollHint: "يمكن تمرير هذه الشبكة أفقياً لعرض بقية الساعات.",
		footnote:
			"يُحسب المتوسط على الدقائق المرصودة فعلاً، فالانقطاع يخفض نسبة الرصد بدل أن يخفض المتوسط بصمت. وتُستبعد ساعات الإغلاق من كل متوسط بدل احتسابها فارغة. وتأتي الفئة والسعة من اللقطة المحفوظة مع كل دقيقة، فتغيير إعداد اليوم لا يعيد كتابة صورة الشهر الماضي.",
		of: "من",
		none: "لا شيء",
	},
} as const;

export type OwnerReportingMessages =
	(typeof ownerReportingMessages)[keyof typeof ownerReportingMessages];

/** Weekday names in the reader's language, keyed exactly as the contract keys them. */
export const ownerReportingWeekdays = {
	en: {
		sun: "Sunday",
		mon: "Monday",
		tue: "Tuesday",
		wed: "Wednesday",
		thu: "Thursday",
		fri: "Friday",
		sat: "Saturday",
	},
	ar: {
		sun: "الأحد",
		mon: "الاثنين",
		tue: "الثلاثاء",
		wed: "الأربعاء",
		thu: "الخميس",
		fri: "الجمعة",
		sat: "السبت",
	},
} as const;

/** The short forms the heatmap row headers use where the full name cannot fit. */
export const ownerReportingWeekdaysShort = {
	en: {
		sun: "Sun",
		mon: "Mon",
		tue: "Tue",
		wed: "Wed",
		thu: "Thu",
		fri: "Fri",
		sat: "Sat",
	},
	ar: {
		sun: "أحد",
		mon: "إثنين",
		tue: "ثلاثاء",
		wed: "أربعاء",
		thu: "خميس",
		fri: "جمعة",
		sat: "سبت",
	},
} as const;
