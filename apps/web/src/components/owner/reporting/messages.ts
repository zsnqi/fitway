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
		pageTitle: "Reports",
		gymTime: "Gym time",
		title: "Busiest times and direction",
		description: "How the week actually fills, by weekday and gym-local hour",
		timeZoneLabel: "Gym timezone",
		windowLabel: "Window",
		windowDays: "Business days",

		rangeLegend: "Reporting range",
		rangeHint: "Up to 31 days",
		startLabel: "Start",
		endLabel: "End",
		apply: "Apply",
		restoreDefault: "Last 28 days",
		problemIncomplete: "Choose both a first and a last business day.",
		problemMalformed: "That is not a real calendar day.",
		problemInverted: "The last day comes before the first day.",
		problemTooLong: "This window is longer than 31 business days.",
		problemCsvTooLong: "An export covers at most 366 business days.",

		loading: "Loading the reporting window",
		loadingDescription: "Preparing the weekday averages and the comparison.",
		errorTitle: "The reporting window could not be loaded",
		errorDescription: "Check the connection and try again.",
		comparisonErrorTitle: "The comparison could not be loaded",
		retry: "Try again",

		heatmapTitle: "Occupancy by weekday and hour",
		heatmapDescription:
			"How busy the gym usually is at each hour of the working day",
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

		tableSummary: "Hourly detail",
		tableDescription: "Hourly readings",
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

		comparisonTitle: "Weekly comparison",
		comparisonDescription: "Last 2 complete weeks",
		comparisonMetric: "Metric",
		comparisonCurrent: "Latest week",
		comparisonPrior: "Week before",
		comparisonAverage: "Average occupancy",
		comparisonCrossings: "Total entries",
		comparisonCoverage: "Observed coverage",
		comparisonChange: "Change",
		comparisonUp: "up",
		comparisonDown: "down",
		comparisonFlat: "unchanged",
		comparisonNoAverage: "Not measurable",

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

		csvTitle: "CSV export range",
		csvDescription:
			"Download minute-by-minute occupancy history for your selected dates.",
		csvLegend: "Export window",
		csvHint: "Up to 366 days",
		csvExport: "Export CSV",
		csvAbort: "Stop the export",
		csvDownload: "Download the file",
		csvExporting: "Preparing the export",
		csvRows: "Rows prepared",
		csvReadyTitle: "The export is ready",
		csvReadyDescription:
			"Your selected occupancy history is ready to download.",
		csvAbortedTitle: "The export was stopped",
		csvAbortedDescription:
			"Start again when you’re ready to download the file.",
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
		pageTitle: "التقارير",
		gymTime: "توقيت الصالة",
		title: "أوقات الذروة والاتجاه",
		description: "كيف يمتلئ الأسبوع فعلياً، بحسب اليوم والساعة بتوقيت الصالة",
		timeZoneLabel: "المنطقة الزمنية للصالة",
		windowLabel: "الفترة",
		windowDays: "أيام العمل",

		rangeLegend: "نطاق التقرير",
		rangeHint: "حتى 31 يوماً",
		startLabel: "البداية",
		endLabel: "النهاية",
		apply: "تطبيق",
		restoreDefault: "آخر 28 يوماً",
		problemIncomplete: "اختر أول يوم عمل وآخر يوم عمل معاً.",
		problemMalformed: "هذا ليس تاريخاً صحيحاً.",
		problemInverted: "آخر يوم يسبق أول يوم.",
		problemTooLong: "هذه الفترة أطول من 31 يوم عمل.",
		problemCsvTooLong: "يغطي التصدير 366 يوم عمل على الأكثر.",

		loading: "جارٍ تحميل فترة التقرير",
		loadingDescription: "جارٍ تجهيز متوسطات الأيام والمقارنة.",
		errorTitle: "تعذر تحميل فترة التقرير",
		errorDescription: "تحقق من الاتصال ثم أعد المحاولة.",
		comparisonErrorTitle: "تعذر تحميل المقارنة",
		retry: "إعادة المحاولة",

		heatmapTitle: "الإشغال حسب اليوم والساعة",
		heatmapDescription: "الزحمة المعتادة في كل ساعة من أيام العمل",
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
		selectedAverage: "متوسط الازدحام",
		selectedObserved: "دقائق العمل التي توفرت فيها قراءات",
		selectedExpected: "دقائق العمل المجدولة",
		selectedSamples: "عدد الأيام التي توفرت فيها قراءات",
		selectedNoValue: "لا يوجد متوسط — لم يُرصد شيء في هذه الساعة.",
		selectedClosed: "لم تكن الصالة مفتوحة في هذه الساعة.",
		selectedMissing: "لم يُسجَّل أي تاريخ لهذه الساعة.",

		tableSummary: "تفاصيل الساعات",
		tableDescription: "كل الأرقام كنص",
		tableRegion: "أرقام اليوم مقابل الساعة",
		columnWeekday: "اليوم",
		columnHour: "الساعة",
		columnState: "الحالة",
		columnAverage: "متوسط الازدحام",
		columnObserved: "دقائق العمل التي توفرت فيها قراءات",
		columnExpected: "دقائق العمل المجدولة",
		columnSamples: "عدد الأيام التي توفرت فيها قراءات",

		stateValue: "مرصودة",
		stateZero: "مفتوحة وفارغة",
		stateClosed: "مغلقة",
		stateMissing: "لا توجد بيانات",

		comparisonTitle: "المقارنة الأسبوعية",
		comparisonDescription: "آخر أسبوعين مكتملين",
		comparisonMetric: "المؤشر",
		comparisonCurrent: "الأسبوع الأخير",
		comparisonPrior: "الأسبوع السابق",
		comparisonAverage: "متوسط الازدحام",
		comparisonCrossings: "إجمالي الدخول",
		comparisonCoverage: "نسبة الوقت الذي توفرت فيه قراءات",
		comparisonChange: "التغيّر",
		comparisonUp: "ارتفاع",
		comparisonDown: "انخفاض",
		comparisonFlat: "بلا تغيّر",
		comparisonNoAverage: "غير قابل للقياس",

		insufficientTitle: "لا يوجد سجل كافٍ للمقارنة بعد",
		insufficientDescription:
			"يجب أن يُرصد كلا الأسبوعين بهذا القدر على الأقل من دقائق عملهما المجدولة قبل تحديد أي اتجاه. الأرقام أدناه معروضة كما هي، بلا مقارنة.",
		insufficientMinimum: "الحد الأدنى لنسبة الوقت الذي توفرت فيها قراءات",
		current_week_no_expected_open_minutes:
			"لم تكن للأسبوع الأخير أي دقائق عمل مجدولة أصلاً.",
		current_week_coverage_below_minimum:
			"رُصد من الأسبوع الأخير قدر أقل من اللازم من دقائق عمله المجدولة.",
		prior_week_no_expected_open_minutes:
			"لم تكن للأسبوع السابق أي دقائق عمل مجدولة أصلاً.",
		prior_week_coverage_below_minimum:
			"رُصد من الأسبوع السابق قدر أقل من اللازم من دقائق عمله المجدولة.",

		csvTitle: "نطاق تصدير CSV",
		csvDescription: "تنزيل سجل الإشغال لكل دقيقة خلال الفترة المحددة.",
		csvLegend: "فترة التصدير",
		csvHint: "366 يوماً كحد أقصى",
		csvExport: "تصدير CSV",
		csvAbort: "إيقاف التصدير",
		csvDownload: "تنزيل الملف",
		csvExporting: "جارٍ تجهيز التصدير",
		csvRows: "الأسطر المجهّزة",
		csvReadyTitle: "التصدير جاهز",
		csvReadyDescription: "سجل الإشغال للفترة المحددة جاهز للتنزيل.",
		csvAbortedTitle: "أُوقف التصدير",
		csvAbortedDescription: "يمكنك بدء التصدير مجددًا عندما تريد تنزيل الملف.",
		csvRangeErrorTitle: "لا يمكن استخدام فترة التصدير هذه",
		csvTransportErrorTitle: "تعذر إكمال التصدير",
		csvTransportErrorDescription:
			"لم نحتفظ بأي ملف ناقص. تحقق من الاتصال ثم ابدأ التصدير من جديد.",
		csvStartOver: "ابدأ من جديد",
		csvPrivacyNote:
			"يحمل الملف سجل الإشغال فقط: لا جهاز، ولا حساب، ولا أي شيء عن زائر بعينه.",

		scrollHint: "يمكن تمرير هذه الشبكة أفقياً لعرض بقية الساعات.",
		footnote:
			"يُحسب المتوسط على الدقائق التي توفرت فيها قراءات فعلاً، فالانقطاع يخفض نسبة الوقت الذي توفرت فيه قراءات بدل أن يخفض المتوسط بصمت. وتُستبعد ساعات الإغلاق من كل متوسط بدل احتسابها فارغة. وتأتي الفئة والسعة من اللقطة المحفوظة مع كل دقيقة، فتغيير إعداد اليوم لا يعيد كتابة صورة الشهر الماضي.",
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
