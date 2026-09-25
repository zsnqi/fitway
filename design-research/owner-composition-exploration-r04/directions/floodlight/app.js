/* FITWAY Owner · Floodlight — exploration concept, synthetic data only.
 * No build step, no dependencies. Everything on this page is deterministic:
 * the minute series comes from a seeded count process (see simulate()). */
(() => {
	"use strict";

	/* ---------------------------------------------------------------- query */
	const q = new URLSearchParams(location.search);
	const LANG = q.get("lang") === "en" ? "en" : "ar";
	const SECTION_KEYS = ["daily", "history", "access", "audit", "health", "settings"];
	const SECTION = SECTION_KEYS.includes(q.get("section")) ? q.get("section") : "daily";
	const STATE_KEYS = ["live", "delayed", "closed", "empty", "loading", "error"];
	const STATE = STATE_KEYS.includes(q.get("state")) ? q.get("state") : "live";
	const MOTION_OFF = q.get("motion") === "off";
	const reduceMq = matchMedia("(prefers-reduced-motion: reduce)");
	const MOTION = !MOTION_OFF && !reduceMq.matches;
	const RTL = LANG === "ar";

	const root = document.documentElement;
	root.lang = LANG;
	root.dir = RTL ? "rtl" : "ltr";
	root.classList.toggle("motion", MOTION);

	/* ----------------------------------------------------------------- copy */
	const COPY = {
		en: {
			am: "AM",
			pm: "PM",
			docTitle: "FITWAY · Management",
			skip: "Skip to operational status",
			brandSub: "Management",
			workspace: "Workspace",
			monitoring: "Monitoring",
			management: "Management",
			monitoringNote: "Monitoring is outside this exploration concept.",
			langLabel: "Switch to Arabic",
			langText: "العربية",
			logout: "Sign out",
			logoutNote: "Sign-out is not active in this exploration concept.",
			concept: "Exploration concept · synthetic data",
			sectionsGroup: "Management sections",
			sec: {
				daily: "Daily",
				history: "Reports",
				access: "Access",
				audit: "Activity Log",
				health: "Operations",
				settings: "Settings",
			},
			weekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			weekdayShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			// Daily
			eyebrow: "Owner analytics",
			title: "Daily analytics",
			description: "Your gym day, with times shown in the gym’s timezone",
			businessDay: "Business day",
			hours: "Opening hours",
			nextDay: "next day",
			tz: "Gym timezone",
			tzName: "Riyadh",
			live: "Live",
			delayed: "Delayed",
			closedToday: "Closed today",
			noReadingsYet: "No readings yet",
			loading: "Loading today's readings",
			loadingDescription: "Loading the daily analytics summary and chart.",
			errorTitle: "Today's readings didn't load",
			errorDescription: "We couldn’t load today’s readings. Please try again.",
			retry: "Try again",
			latest: "Latest reading",
			lastKnownReading: "Last-known reading",
			staleDescription: "Live updates are delayed. These values are last known.",
			nowAt: "Now",
			presentPrefix: "≈",
			presentSuffix: "present",
			peak: "Peak level",
			average: "Average occupancy",
			crossings: "Total entries",
			coverage: "Data coverage",
			atTime: "at",
			capacityOf: "of {c} capacity",
			recordedMinutes: "Across {n} recorded minutes",
			entriesNote: "Estimated entrance crossings, not unique members",
			busiestEntryHour: "Most entries around",
			entriesInHour: "{n} entries in that hour",
			coverageLine: "Observed {a} of {b} scheduled minutes so far",
			awaitingMinutes: "{n} minutes awaiting readings",
			lastKnownBanner: "Last known · figures as of {t}",
			lastKnownTag: "Last known",
			noReadingValue: "—",
			closedDayTitle: "FITWAY is closed today",
			closedDayDescription:
				"FITWAY is closed today on the published schedule, so no readings are expected. Daily analytics resumes with the first reading after the gym reopens.",
			noObservedTitle: "No readings yet today",
			noObservedDescription: "Today’s chart will appear when readings are available.",
			// chart
			chartTitle: "People present through the day",
			binRule: "Each column is 10 minutes. Its height is the highest count observed in those minutes; the minute table below keeps every reading.",
			chartLabel: "Occupancy columns, 10 minutes each",
			chartHint:
				"Focus the chart and use Left or Right Arrow to move between columns. Home and End jump to the first and latest column. Hover or tap also selects a column.",
			chartKey: "Chart key",
			legendObserved: "Observed · highest in the column",
			legendZero: "Genuine zero",
			legendMissing: "Missing observation",
			legendWaiting: "Awaiting readings",
			legendAhead: "Still ahead",
			capacity: "Capacity",
			stillAhead: "Still ahead",
			untilClose: "until {t}",
			waitingSince: "Awaiting readings since {t}",
			missingTag: "Missing · {n} min",
			peakTag: "Peak",
			selectedReading: "Selected column",
			highest: "Highest",
			lowest: "Lowest",
			minutesObserved: "{a} of {b} minutes observed",
			minuteMissing: "Missing",
			minuteWaiting: "Awaiting",
			minuteAhead: "Ahead",
			columnMissing: "No observation in this column.",
			columnWaiting: "Readings for this column have not arrived yet.",
			columnPartialMissing: "{n} minutes in this column are missing, so the true highest may be higher.",
			columnPartialWaiting: "{n} minutes in this column are still awaiting readings.",
			columnInProgress: "This column is still in progress.",
			columnZero: "Open and empty: every observed minute was a genuine zero.",
			// minute table
			tableSummary: "Minute details",
			tableCaption: "Minute-by-minute analytics data, grouped by the chart's 10-minute columns",
			previousPage: "Previous 60 minutes",
			nextPage: "Next 60 minutes",
			minuteRange: "Showing",
			minuteOf: "of",
			minutesUnit: "minutes",
			time: "Gym-local time",
			count: "Approximate occupancy",
			band: "Crowd band",
			state: "State",
			source: "Source",
			observed: "Observed",
			zeroState: "Observed · genuine zero",
			missing: "Missing observation",
			waitingState: "Awaiting reading",
			sourceLive: "Live",
			groupHead: "Column {r} · highest {v}",
			groupHeadMissing: "Column {r} · no observation",
			groupHeadWaiting: "Column {r} · awaiting readings",
			bands: { quiet: "Quiet", moderate: "Moderate", busy: "Busy", packed: "Packed" },
			// Reports
			rPageTitle: "Reports",
			rTitle: "Busiest times and direction",
			rDescription: "How the week actually fills, by weekday and gym-local hour",
			windowLabel: "Window",
			windowDays: "Business days",
			rangeLegend: "Reporting range",
			rangeHint: "Up to 31 days",
			startLabel: "Start",
			endLabel: "End",
			apply: "Apply",
			presetsLegend: "Quick ranges",
			presetLast7: "Last 7 days",
			presetLast28: "Last 28 days",
			presetLast31: "Last 31 days",
			rangePending: "Changes not applied yet",
			rangeApplied: "Report window applied",
			rangeConceptOnly: "Concept only: the synthetic data covers 26 Aug-22 Sep 2026, so the grid stays on that window.",
			problemIncomplete: "Choose both a first and a last business day.",
			problemMalformed: "That is not a real calendar day.",
			problemInverted: "The last day comes before the first day.",
			problemTooLong: "This window is longer than 31 business days.",
			problemCsvTooLong: "An export covers at most 366 business days.",
			dateFormat: "YYYY-MM-DD",
			heatmapTitle: "Occupancy by weekday and hour",
			heatmapDescription: "How busy the gym usually is at each hour of the working day",
			heatmapHint: "Select a cell to read its figures. Arrow keys move between cells.",
			hourAxis: "Gym-local hour",
			weekdayAxis: "Weekday",
			legendLabel: "Cell meaning",
			legendQuiet: "Quieter",
			legendBusy: "Busier",
			legendZeroCell: "Open and empty",
			legendClosed: "Closed",
			legendNoData: "No data",
			cellNumbers: "Numbers are average people present, rounded.",
			closedUntil: "Closed until {t}",
			selectedTitle: "Selected hour",
			selectedAverage: "Average occupancy",
			selectedObserved: "Observed open minutes",
			selectedExpected: "Scheduled open minutes",
			selectedSamples: "Weekdays measured",
			selectedNoValue: "No average — nothing was observed in this hour.",
			selectedClosed: "The gym was not open in this hour.",
			selectedMissing: "No history was recorded for this hour.",
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
			comparisonCoverage: "Data coverage",
			comparisonChange: "Change",
			comparisonUp: "up",
			comparisonDown: "down",
			comparisonFlat: "unchanged",
			points: "pts",
			csvTitle: "CSV export range",
			csvDescription: "Download minute-by-minute occupancy history for your selected dates.",
			csvLegend: "Export window",
			csvHint: "Up to 366 days",
			csvExport: "Export CSV",
			csvConcept: "Exploration concept: no file is created.",
			csvPrivacyNote:
				"The file carries occupancy history only: no device, no account, and nothing about an individual visitor.",
			footnote:
				"An average is taken over the minutes that were actually observed, so an outage lowers the data coverage rather than quietly lowering the average. Closed hours are excluded from every average instead of being counted as empty. Changing a setting today never rewrites what last month looked like.",
			hTableSummary: "Hourly detail",
			hTableDescription: "Hourly readings",
			columnWeekday: "Weekday",
			columnHour: "Hour",
			columnState: "State",
			columnAverage: "Average occupancy",
			columnObserved: "Observed open minutes",
			columnExpected: "Scheduled open minutes",
			columnSamples: "Weekdays measured",
			rLoading: "Loading the reporting window",
			rErrorTitle: "The reporting window could not be loaded",
			rErrorDescription: "Check the connection and try again.",
			// placeholders
			ph: {
				access: ["Access", "Staff PIN and owner accounts"],
				audit: ["Activity Log", "Owner and staff actions"],
				health: ["Operations & incidents", "Counter uptime and incidents over the last business days"],
				settings: [
					"Settings",
					"Set capacity, crowd levels, business day, and weekly hours. Changes apply from now on and never rewrite past reports.",
				],
			},
			notDesigned: "Not designed in this early look",
			notDesignedBody: "This board stays switched off. Only Daily and Reports are designed in this exploration.",
			boardOff: "Board off",
		},
		ar: {
			am: "ص",
			pm: "م",
			docTitle: "FITWAY · الإدارة",
			skip: "الانتقال إلى الحالة التشغيلية",
			brandSub: "الإدارة",
			workspace: "مساحة العمل",
			monitoring: "المراقبة",
			management: "الإدارة",
			monitoringNote: "المراقبة خارج هذا المفهوم الاستكشافي.",
			langLabel: "التبديل إلى اللغة الإنجليزية",
			langText: "English",
			logout: "تسجيل الخروج",
			logoutNote: "تسجيل الخروج غير مفعّل في هذا المفهوم الاستكشافي.",
			concept: "مفهوم استكشافي · بيانات تجريبية",
			sectionsGroup: "أقسام الإدارة",
			sec: {
				daily: "اليومي",
				history: "التقارير",
				access: "الوصول",
				audit: "سجل النشاط",
				health: "التشغيل",
				settings: "الإعدادات",
			},
			weekday: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
			weekdayShort: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"],
			months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
			monthsShort: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
			eyebrow: "تحليلات المالك",
			title: "التحليلات اليومية",
			description: "يوم صالتك، مع عرض الأوقات بتوقيت الصالة",
			businessDay: "يوم العمل",
			hours: "ساعات العمل",
			nextDay: "اليوم التالي",
			tz: "توقيت الصالة",
			tzName: "الرياض",
			live: "مباشر",
			delayed: "متأخر",
			closedToday: "مغلق اليوم",
			noReadingsYet: "لا توجد قراءات بعد",
			loading: "جارٍ تحميل قراءات اليوم",
			loadingDescription: "جارٍ تحميل ملخص التحليلات اليومية ومخططها.",
			errorTitle: "تعذر تحميل قراءات اليوم",
			errorDescription: "تعذر تحميل قراءات اليوم. يرجى إعادة المحاولة.",
			retry: "إعادة المحاولة",
			latest: "آخر قراءة",
			lastKnownReading: "آخر قراءة معروفة",
			staleDescription: "التحديثات المباشرة متأخرة. هذه آخر قيم معروفة.",
			nowAt: "الآن",
			presentPrefix: "نحو",
			presentSuffix: "حاضرًا",
			peak: "مستوى الذروة",
			average: "متوسط الازدحام",
			crossings: "إجمالي الدخول",
			coverage: "تغطية البيانات",
			atTime: "عند",
			capacityOf: "من سعة {c}",
			recordedMinutes: "خلال {n} دقيقة مسجّلة",
			entriesNote: "تقدير لمرات العبور من المدخل، لا لعدد الأعضاء",
			busiestEntryHour: "ذروة الدخول عند",
			entriesInHour: "{n} دخولًا في تلك الساعة",
			coverageLine: "رُصدت {a} من {b} دقيقة مجدولة حتى الآن",
			awaitingMinutes: "{n} دقيقة بانتظار القراءات",
			lastKnownBanner: "آخر قيم معروفة · حتى {t}",
			lastKnownTag: "آخر معروف",
			noReadingValue: "—",
			closedDayTitle: "الصالة مغلقة اليوم",
			closedDayDescription:
				"الصالة مغلقة اليوم حسب الجدول المعلن، لذلك لا توجد قراءات متوقعة. تعود التحليلات اليومية مع أول قراءة بعد إعادة الفتح.",
			noObservedTitle: "لا توجد قراءات اليوم بعد",
			noObservedDescription: "سيظهر مخطط اليوم عند توفر القراءات.",
			chartTitle: "عدد الموجودين خلال اليوم",
			binRule: "كل عمود يغطي 10 دقائق، وارتفاعه أعلى عدد رُصد خلالها. ويحتفظ جدول الدقائق أدناه بكل قراءة.",
			chartLabel: "أعمدة الإشغال، كل عمود 10 دقائق",
			chartHint:
				"ركّز على المخطط واستخدم سهم اليمين أو اليسار للتنقل بين الأعمدة. يقفز مفتاح Home إلى أول عمود ومفتاح End إلى آخر عمود. ويمكنك أيضاً التحديد بالتمرير أو اللمس.",
			chartKey: "مفتاح المخطط",
			legendObserved: "مرصود · أعلى قيمة في العمود",
			legendZero: "صفر فعلي",
			legendMissing: "رصد مفقود",
			legendWaiting: "بانتظار القراءات",
			legendAhead: "لم يحن بعد",
			capacity: "السعة",
			stillAhead: "لم يحن بعد",
			untilClose: "حتى {t}",
			waitingSince: "بانتظار القراءات منذ {t}",
			missingTag: "رصد مفقود · {n} دقيقة",
			peakTag: "الذروة",
			selectedReading: "العمود المحدد",
			highest: "أعلى قيمة",
			lowest: "أدنى قيمة",
			minutesObserved: "رُصدت {a} من {b} دقائق",
			minuteMissing: "مفقود",
			minuteWaiting: "بانتظار",
			minuteAhead: "لاحقًا",
			columnMissing: "لا يوجد رصد في هذا العمود.",
			columnWaiting: "لم تصل قراءات هذا العمود بعد.",
			columnPartialMissing: "فُقدت {n} دقائق من هذا العمود، فقد تكون القيمة الأعلى الفعلية أكبر.",
			columnPartialWaiting: "ما زالت {n} دقائق من هذا العمود بانتظار القراءات.",
			columnInProgress: "هذا العمود لم يكتمل بعد.",
			columnZero: "مفتوحة وفارغة: كل دقيقة مرصودة كانت صفرًا فعليًا.",
			tableSummary: "تفاصيل الدقائق",
			tableCaption: "بيانات التحليلات لكل دقيقة، مجمّعة حسب أعمدة المخطط ذات الدقائق العشر",
			previousPage: "الدقائق الستون السابقة",
			nextPage: "الدقائق الستون التالية",
			minuteRange: "المعروض",
			minuteOf: "من",
			minutesUnit: "دقيقة",
			time: "الوقت المحلي للصالة",
			count: "الإشغال التقريبي",
			band: "مستوى الازدحام",
			state: "الحالة",
			source: "المصدر",
			observed: "مرصود",
			zeroState: "مرصود · صفر فعلي",
			missing: "رصد مفقود",
			waitingState: "بانتظار القراءة",
			sourceLive: "مباشر",
			groupHead: "العمود {r} · أعلى قيمة {v}",
			groupHeadMissing: "العمود {r} · لا يوجد رصد",
			groupHeadWaiting: "العمود {r} · بانتظار القراءات",
			bands: { quiet: "هادئ", moderate: "متوسط", busy: "مزدحم", packed: "شديد الازدحام" },
			rPageTitle: "التقارير",
			rTitle: "أوقات الذروة والاتجاه",
			rDescription: "كيف يمتلئ الأسبوع فعلياً، بحسب اليوم والساعة بتوقيت الصالة",
			windowLabel: "الفترة",
			windowDays: "أيام العمل",
			rangeLegend: "نطاق التقرير",
			rangeHint: "حتى 31 يوماً",
			startLabel: "البداية",
			endLabel: "النهاية",
			apply: "تطبيق",
			presetsLegend: "فترات سريعة",
			presetLast7: "آخر 7 أيام",
			presetLast28: "آخر 28 يوماً",
			presetLast31: "آخر 31 يوماً",
			rangePending: "تغييرات لم تُطبق بعد",
			rangeApplied: "تم تطبيق فترة التقرير",
			rangeConceptOnly: "مفهوم فقط: البيانات التجريبية تغطي 26 أغسطس - 22 سبتمبر 2026، لذلك تبقى الشبكة على هذه الفترة.",
			problemIncomplete: "اختر أول يوم عمل وآخر يوم عمل معاً.",
			problemMalformed: "هذا ليس تاريخاً صحيحاً.",
			problemInverted: "آخر يوم يسبق أول يوم.",
			problemTooLong: "هذه الفترة أطول من 31 يوم عمل.",
			problemCsvTooLong: "يغطي التصدير 366 يوم عمل على الأكثر.",
			dateFormat: "YYYY-MM-DD",
			heatmapTitle: "الإشغال حسب اليوم والساعة",
			heatmapDescription: "الزحمة المعتادة في كل ساعة من أيام العمل",
			heatmapHint: "اختر خانة لقراءة أرقامها. تنقل بين الخانات بمفاتيح الأسهم.",
			hourAxis: "الساعة بتوقيت الصالة",
			weekdayAxis: "اليوم",
			legendLabel: "دلالة الخانة",
			legendQuiet: "أهدأ",
			legendBusy: "أزحم",
			legendZeroCell: "مفتوحة وفارغة",
			legendClosed: "مغلقة",
			legendNoData: "لا توجد بيانات",
			cellNumbers: "الأرقام متوسط عدد الموجودين، مقرّبًا.",
			closedUntil: "مغلقة حتى {t}",
			selectedTitle: "الساعة المختارة",
			selectedAverage: "متوسط الازدحام",
			selectedObserved: "دقائق العمل التي توفرت فيها قراءات",
			selectedExpected: "دقائق العمل المجدولة",
			selectedSamples: "عدد الأيام التي توفرت فيها قراءات",
			selectedNoValue: "لا يوجد متوسط — لم يُرصد شيء في هذه الساعة.",
			selectedClosed: "لم تكن الصالة مفتوحة في هذه الساعة.",
			selectedMissing: "لم يُسجَّل أي تاريخ لهذه الساعة.",
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
			comparisonCoverage: "تغطية البيانات",
			comparisonChange: "التغيّر",
			comparisonUp: "ارتفاع",
			comparisonDown: "انخفاض",
			comparisonFlat: "بلا تغيّر",
			points: "نقطة",
			csvTitle: "نطاق تصدير CSV",
			csvDescription: "تنزيل سجل الإشغال لكل دقيقة خلال الفترة المحددة.",
			csvLegend: "فترة التصدير",
			csvHint: "366 يوماً كحد أقصى",
			csvExport: "تصدير CSV",
			csvConcept: "مفهوم استكشافي: لا يُنشأ أي ملف.",
			csvPrivacyNote: "يحمل الملف سجل الإشغال فقط: لا جهاز، ولا حساب، ولا أي شيء عن زائر بعينه.",
			footnote:
				"يُحسب المتوسط على الدقائق التي توفرت فيها قراءات فعلاً، فالانقطاع يخفض تغطية البيانات بدل أن يخفض المتوسط بصمت. وتُستبعد ساعات الإغلاق من كل متوسط بدل احتسابها فارغة. وتغيير أي إعداد اليوم لا يعيد كتابة صورة الشهر الماضي.",
			hTableSummary: "تفاصيل الساعات",
			hTableDescription: "قراءات كل ساعة",
			columnWeekday: "اليوم",
			columnHour: "الساعة",
			columnState: "الحالة",
			columnAverage: "متوسط الازدحام",
			columnObserved: "دقائق العمل التي توفرت فيها قراءات",
			columnExpected: "دقائق العمل المجدولة",
			columnSamples: "عدد الأيام التي توفرت فيها قراءات",
			rLoading: "جارٍ تحميل فترة التقرير",
			rErrorTitle: "تعذر تحميل فترة التقرير",
			rErrorDescription: "تحقق من الاتصال ثم أعد المحاولة.",
			ph: {
				access: ["الوصول", "رمز الموظفين وحسابات المالكين"],
				audit: ["سجل النشاط", "إجراءات المالك والموظفين"],
				health: ["التشغيل والأعطال", "تشغيل جهاز العد والأعطال خلال أيام العمل الأخيرة"],
				settings: [
					"الإعدادات",
					"اضبط السعة ومستويات الازدحام ويوم العمل وساعات الأسبوع. تنطبق التغييرات من الآن ولا تعيد كتابة التقارير السابقة.",
				],
			},
			notDesigned: "لم يُصمَّم في هذه النظرة الأولى",
			notDesignedBody: "تبقى هذه اللوحة مطفأة. صُمّم القسمان اليومي والتقارير فقط في هذا الاستكشاف.",
			boardOff: "اللوحة مطفأة",
		},
	};
	const C = COPY[LANG];
	document.title = `${C.docTitle} · ${C.sec[SECTION]}`;

	/* -------------------------------------------------------------- helpers */
	const $ = (sel, el = document) => el.querySelector(sel);
	const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));
	const esc = (s) =>
		String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
	const B = (s) => `<bdi>${esc(s)}</bdi>`;
	/** Escapes the template, then drops in values that are already HTML. */
	const tpl = (s, vars) => esc(s).replace(/\{(\w+)\}/g, (_, k) => vars[k]);
	/** Plain-text fill for attributes and live-region text. */
	const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);
	const int = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const one = (n) => (Math.round(n * 10) / 10).toFixed(1);
	const pct = (a, b) => `${(Math.round((a / b) * 1000) / 10).toFixed(1)}%`;

	const OPEN_H = 6;
	const DAY_MIN = 19 * 60; // 6:00 AM → 1:00 AM next day
	const BIN = 10;
	const NB = DAY_MIN / BIN; // 114 columns
	const CAPACITY = 80;
	const MISS0 = 494; // 2:14 PM
	const MISS1 = 511; // 2:31 PM

	function clock(m) {
		const t = OPEN_H * 60 + m;
		const h24 = Math.floor(t / 60) % 24;
		const mm = t % 60;
		const h12 = h24 % 12 || 12;
		return `${h12}:${String(mm).padStart(2, "0")} ${h24 >= 12 ? C.pm : C.am}`;
	}
	function clockBare(m) {
		const t = OPEN_H * 60 + m;
		const h12 = (Math.floor(t / 60) % 24) % 12 || 12;
		return `${h12}:${String(t % 60).padStart(2, "0")}`;
	}
	/** Scoreboard-size time: the AM/PM marker is set smaller than the digits. */
	function clockBig(m) {
		const t = OPEN_H * 60 + m;
		const h24 = Math.floor(t / 60) % 24;
		return `<bdi>${esc(clockBare(m))} <span class="ampm">${esc(h24 >= 12 ? C.pm : C.am)}</span></bdi>`;
	}
	function hourLabel(hIdx) {
		const h24 = (OPEN_H + hIdx) % 24;
		return `${h24 % 12 || 12} ${h24 >= 12 ? C.pm : C.am}`;
	}
	const range = (a, b) => `${B(a)} - ${B(b)}`; // plain hyphen, never an en dash
	const bandOf = (v) => (v <= 24 ? "quiet" : v <= 48 ? "moderate" : v <= 68 ? "busy" : "packed");
	const bandLevel = { quiet: 1, moderate: 2, busy: 3, packed: 4 };
	const meter = (band) =>
		`<span class="meter" data-level="${bandLevel[band]}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
	const dateLong = (y, mo, d, wd) => `${esc(C.weekday[wd])} ${B(d)} ${esc(C.months[mo])} ${B(y)}`;

	/* ----------------------------------------------------- minute simulation
	 * People present, simulated as a count process around a target curve.
	 * Each minute: entries ~ Poisson(lambda), exits ~ Binomial(present, 1/64).
	 * lambda = target/64 + target slope, so the process tracks the target.
	 * mulberry32 with seed 2413 makes the day identical on every load. */
	function mulberry32(a) {
		return () => {
			a |= 0;
			a = (a + 0x6d2b79f5) | 0;
			let t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	}
	const KEYS = [
		[0, 0], [10, 0], [30, 12], [80, 30], [150, 16], [240, 8], [330, 7], [420, 15], [480, 8], [570, 9],
		[630, 20], [690, 45], [735, 61], [750, 63], [765, 60], [795, 54], [822, 50], [900, 44],
	];
	function target(m) {
		for (let i = 1; i < KEYS.length; i++) {
			const [m1, v1] = KEYS[i];
			const [m0, v0] = KEYS[i - 1];
			if (m <= m1) return v0 + ((v1 - v0) * (m - m0)) / (m1 - m0);
		}
		return KEYS[KEYS.length - 1][1];
	}
	function simulate(seed, until) {
		const rnd = mulberry32(seed);
		const occ = [];
		const ent = [];
		let o = 0;
		for (let m = 0; m <= until; m++) {
			const lambda = m < 10 ? 0 : Math.max(0, target(m) / 64 + (target(m + 1) - target(m)));
			let e = 0;
			if (lambda > 0) {
				const L = Math.exp(-lambda);
				let p = 1;
				let k = 0;
				do {
					k++;
					p *= rnd();
				} while (p > L);
				e = k - 1;
			}
			let x = 0;
			for (let i = 0; i < o; i++) if (rnd() < 1 / 64) x++;
			o = o + e - x;
			occ.push(o);
			ent.push(e);
		}
		return { occ, ent };
	}

	function buildDay(state) {
		const sim = simulate(2413, 822);
		let now = 822; // 7:42 PM
		let last = 822;
		if (state === "delayed") last = 801; // 7:21 PM
		if (state === "empty") {
			now = 0;
			last = -1;
		}
		const kind = new Array(DAY_MIN);
		const val = new Array(DAY_MIN).fill(null);
		for (let m = 0; m < DAY_MIN; m++) {
			if (m > now) kind[m] = "ahead";
			else if (m > last) kind[m] = "wait";
			else if (m >= MISS0 && m <= MISS1) kind[m] = "miss";
			else {
				kind[m] = "obs";
				val[m] = sim.occ[m];
			}
		}
		const bins = [];
		for (let i = 0; i < NB; i++) {
			const b = { i, m0: i * BIN, m1: i * BIN + BIN - 1, obs: 0, miss: 0, wait: 0, ahead: 0, max: null, min: null };
			for (let m = b.m0; m <= b.m1; m++) {
				b[kind[m]]++;
				if (kind[m] === "obs") {
					if (b.max === null || val[m] > b.max) b.max = val[m];
					if (b.min === null || val[m] < b.min) b.min = val[m];
				}
			}
			b.kind = b.obs ? (b.max === 0 ? "zero" : "obs") : b.miss ? "miss" : b.wait ? "wait" : "ahead";
			b.rest = b.obs ? (b.miss ? "miss" : b.wait ? "wait" : b.ahead ? "ahead" : null) : null;
			bins.push(b);
		}
		let obs = 0;
		let sum = 0;
		let peak = -1;
		let peakAt = -1;
		let entries = 0;
		const byHour = new Array(19).fill(0);
		for (let m = 0; m <= last; m++) {
			if (kind[m] !== "obs") continue;
			obs++;
			sum += val[m];
			if (val[m] > peak) {
				peak = val[m];
				peakAt = m;
			}
			entries += sim.ent[m];
			byHour[Math.floor(m / 60)] += sim.ent[m];
		}
		let busiest = 0;
		for (let h = 1; h < 19; h++) if (byHour[h] > byHour[busiest]) busiest = h;
		let waiting = 0;
		for (let m = 0; m <= now; m++) if (kind[m] === "wait") waiting++;
		return {
			now,
			last,
			kind,
			val,
			bins,
			obs,
			scheduled: now + 1,
			waiting,
			avg: obs ? sum / obs : null,
			peak,
			peakAt,
			entries,
			busiest,
			busiestCount: byHour[busiest],
			latest: last >= 0 ? val[last] : null,
			nowBin: Math.floor(now / BIN),
		};
	}

	/* ------------------------------------------------------------- shell */
	function link(params) {
		const p = new URLSearchParams(location.search);
		for (const [k, v] of Object.entries(params)) {
			if (v === null) p.delete(k);
			else p.set(k, v);
		}
		return `?${p.toString()}`;
	}

	function renderShell() {
		$("#skip").textContent = C.skip;
		$("#masthead").innerHTML = `
			<div class="brand">
				<span class="brand-word" lang="en">FITWAY</span>
				<span class="brand-sub">${esc(C.brandSub)}</span>
			</div>
			<div class="appswitch" role="group" aria-label="${esc(C.workspace)}">
				<button type="button" class="appswitch-item" data-note="monitoring">${esc(C.monitoring)}</button>
				<a class="appswitch-item" aria-current="page" href="${link({ section: "daily", state: null })}">${esc(C.management)}</a>
			</div>
			<div class="mast-end">
				<span class="concept-tag"><span class="concept-dot" aria-hidden="true"></span><span>${esc(C.concept)}</span></span>
				<a class="mast-btn" href="${link({ lang: LANG === "ar" ? "en" : "ar" })}" aria-label="${esc(C.langLabel)}"><span lang="${LANG === "ar" ? "en" : "ar"}">${esc(C.langText)}</span></a>
				<button type="button" class="mast-btn mast-out" data-note="logout">
					<svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M8 3H4v14h4M12 6l4 4-4 4M16 10H8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg>
					<span>${esc(C.logout)}</span>
				</button>
			</div>
			<nav class="keypad" aria-label="${esc(C.sectionsGroup)}">
				<p class="keypad-label" aria-hidden="true">${esc(C.sectionsGroup)}</p>
				<ul class="keys">
					${SECTION_KEYS.map(
						(k) =>
							`<li><a class="key${k === SECTION ? " is-on" : ""}" href="${link({ section: k })}"${
								k === SECTION ? ' aria-current="page"' : ""
							}><span class="key-lamp" aria-hidden="true"></span><span class="key-text">${esc(C.sec[k])}</span></a></li>`,
					).join("")}
				</ul>
			</nav>`;
		$$("[data-note]").forEach((b) =>
			b.addEventListener("click", () => toast(b.dataset.note === "monitoring" ? C.monitoringNote : C.logoutNote)),
		);
	}

	let toastTimer = 0;
	function toast(msg) {
		const t = $("#toast");
		t.textContent = msg;
		t.classList.add("is-on");
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => t.classList.remove("is-on"), 3200);
	}

	/* ================================================================ DAILY */
	const DAY = { y: 2026, mo: 8, d: 23, wd: 3 };

	function statusBlock(day) {
		const dayLine = `<p class="dayline"><span class="dl-item"><span class="dl-k">${esc(C.businessDay)}</span> <span class="dl-v">${dateLong(DAY.y, DAY.mo, DAY.d, DAY.wd)}</span></span>
			<span class="dl-item"><span class="dl-k">${esc(C.hours)}</span> <span class="dl-v">${
				STATE === "closed" ? esc(C.closedToday) : `${range(clock(0), clock(DAY_MIN))} <span class="dl-note">(${esc(C.nextDay)})</span>`
			}</span></span>
			<span class="dl-item"><span class="dl-k">${esc(C.tz)}</span> <span class="dl-v">${esc(C.tzName)}</span></span></p>`;

		let lamp = "";
		let clockHtml = "";
		let side = "";
		if (STATE === "live") {
			lamp = `<span class="lamp lamp-live" aria-hidden="true"></span><span class="lamp-word">${esc(C.live)}</span>`;
			clockHtml = `<span class="clk-cap">${esc(C.latest)}</span><span class="clk-time num">${clockBig(day.last)}</span>`;
			const band = bandOf(day.latest);
			side = `<span class="clk-present"><span class="clk-pre">${esc(C.presentPrefix)}</span><span class="num clk-count">${B(day.latest)}</span><span class="clk-suf">${esc(C.presentSuffix)}</span></span>
				<span class="band-chip band-chip-dark">${meter(band)}<span>${esc(C.bands[band])}</span></span>`;
		} else if (STATE === "delayed") {
			lamp = `<span class="lamp lamp-delayed" aria-hidden="true"></span><span class="lamp-word">${esc(C.delayed)}</span>`;
			clockHtml = `<span class="clk-cap">${esc(C.lastKnownReading)}</span><span class="clk-time num is-stale">${clockBig(day.last)}</span>`;
			side = `<span class="clk-stale-note">${esc(C.staleDescription)}</span>
				<span class="clk-now"><span>${esc(C.nowAt)}</span> ${B(clock(day.now))}</span>`;
		} else if (STATE === "empty") {
			lamp = `<span class="lamp lamp-off" aria-hidden="true"></span><span class="lamp-word">${esc(C.noReadingsYet)}</span>`;
			clockHtml = `<span class="clk-cap">${esc(C.nowAt)}</span><span class="clk-time num is-stale">${clockBig(day.now)}</span>`;
			side = `<span class="clk-stale-note">${esc(C.noObservedDescription)}</span>`;
		} else if (STATE === "closed") {
			lamp = `<span class="lamp lamp-closed" aria-hidden="true"></span><span class="lamp-word">${esc(C.closedToday)}</span>`;
		} else if (STATE === "loading") {
			lamp = `<span class="lamp lamp-off" aria-hidden="true"></span><span class="lamp-word">${esc(C.loading)}</span>`;
		} else {
			lamp = `<span class="lamp lamp-error" aria-hidden="true"></span><span class="lamp-word">${esc(C.errorTitle)}</span>`;
		}
		return `
		<div class="field-head">
			<div class="title-block">
				<p class="eyebrow">${esc(C.eyebrow)}</p>
				<h1 class="page-title">${esc(C.title)}</h1>
				<p class="page-desc">${esc(C.description)}</p>
			</div>
			<div class="clock clock-${STATE}" role="status">
				<div class="clk-lamp">${lamp}</div>
				${clockHtml ? `<div class="clk-main">${clockHtml}</div>` : ""}
				${side ? `<div class="clk-side">${side}</div>` : ""}
			</div>
			${dayLine}
		</div>`;
	}

	function towerDaily(day) {
		if (STATE === "error") return `<div class="tower"><p class="tower-note">${esc(C.errorDescription)}</p></div>`;
		if (STATE === "closed")
			return `<div class="tower"><section class="fig fig-closed" aria-label="${esc(C.closedToday)}">
				<p class="closed-plate"><span class="lamp lamp-closed" aria-hidden="true"></span><span>${esc(C.closedToday)}</span></p>
				<p class="fig-sub">${esc(C.closedDayDescription)}</p></section></div>`;
		if (STATE === "loading")
			return `<div class="tower" aria-busy="true"><p class="sr-only">${esc(C.loadingDescription)}</p>
				<div class="fig fig-peak is-skel" aria-hidden="true"><span class="skel skel-l"></span><span class="skel skel-xl"></span></div>
				${[1, 2, 3].map(() => `<div class="fig is-skel" aria-hidden="true"><span class="skel skel-l"></span><span class="skel skel-m"></span></div>`).join("")}
			</div>`;
		const stale = STATE === "delayed";
		if (STATE === "empty") {
			const dash = `<span class="num fig-num is-none">${esc(C.noReadingValue)}</span>`;
			return `<div class="tower">
				<section class="fig fig-peak is-none" aria-labelledby="f-peak"><h2 class="fig-label" id="f-peak">${esc(C.peak)}</h2>
					<div class="peak-row"><span class="num peak-num is-none">${esc(C.noReadingValue)}</span></div><p class="fig-sub">${esc(C.noReadingsYet)}</p></section>
				${[C.average, C.crossings, C.coverage]
					.map(
						(l, i) =>
							`<section class="fig" aria-labelledby="f-${i}"><div class="fig-row"><h2 class="fig-label" id="f-${i}">${esc(l)}</h2>${dash}</div><p class="fig-sub">${esc(C.noReadingsYet)}</p></section>`,
					)
					.join("")}
			</div>`;
		}
		const tag = stale ? `<span class="lk-tag">${esc(C.lastKnownTag)}</span>` : "";
		const banner = stale
			? `<p class="lk-banner"><span class="lamp lamp-delayed" aria-hidden="true"></span><span>${tpl(C.lastKnownBanner, { t: B(clock(day.last)) })}</span></p>`
			: "";
		const band = bandOf(day.peak);
		return `<div class="tower${stale ? " is-stale" : ""}">
			${banner}
			<section class="fig fig-peak" aria-labelledby="f-peak">
				<h2 class="fig-label" id="f-peak"><span>${esc(C.peak)}</span>${tag}</h2>
				<div class="peak-row">
					<span class="num peak-num">${B(day.peak)}</span>
					<span class="band-chip">${meter(band)}<span>${esc(C.bands[band])}</span></span>
				</div>
				<p class="fig-sub"><span>${esc(C.atTime)} ${B(clock(day.peakAt))}</span><span class="sep" aria-hidden="true">·</span><span>${tpl(C.capacityOf, { c: B(CAPACITY) })}</span></p>
			</section>
			<section class="fig" aria-labelledby="f-avg">
				<div class="fig-row"><h2 class="fig-label" id="f-avg"><span>${esc(C.average)}</span>${tag}</h2><span class="num fig-num">${B(one(day.avg))}</span></div>
				<p class="fig-sub">${tpl(C.recordedMinutes, { n: B(int(day.obs)) })}</p>
			</section>
			<section class="fig" aria-labelledby="f-ent">
				<div class="fig-row"><h2 class="fig-label" id="f-ent"><span>${esc(C.crossings)}</span>${tag}</h2><span class="num fig-num">${B(int(day.entries))}</span></div>
				<p class="fig-sub">${esc(C.entriesNote)}</p>
				<p class="fig-sub fig-sub-strong"><span>${esc(C.busiestEntryHour)} ${B(hourLabel(day.busiest))}</span><span class="sep" aria-hidden="true">·</span><span>${tpl(C.entriesInHour, { n: B(day.busiestCount) })}</span></p>
			</section>
			<section class="fig" aria-labelledby="f-cov">
				<div class="fig-row"><h2 class="fig-label" id="f-cov"><span>${esc(C.coverage)}</span>${tag}</h2><span class="num fig-num">${B(pct(day.obs, day.scheduled))}</span></div>
				<p class="fig-sub">${tpl(C.coverageLine, { a: B(int(day.obs)), b: B(int(day.scheduled)) })}</p>
				${day.waiting ? `<p class="fig-sub">${tpl(C.awaitingMinutes, { n: B(day.waiting) })}</p>` : ""}
			</section>
		</div>`;
	}

	function legendDaily() {
		const items = [
			["obs", C.legendObserved],
			["zero", C.legendZero],
			["miss", C.legendMissing],
		];
		if (STATE === "delayed") items.push(["wait", C.legendWaiting]);
		items.push(["ahead", C.legendAhead]);
		return `<ul class="legend" aria-label="${esc(C.chartKey)}">${items
			.map(([k, l]) => `<li><span class="sw sw-${k}" aria-hidden="true"></span><span>${esc(l)}</span></li>`)
			.join("")}</ul>`;
	}

	function renderDaily() {
		const day = buildDay(STATE);
		const main = $("#main");
		let body = "";
		if (STATE === "error") {
			body = `<section class="panel panel-error" role="alert"><h2 class="panel-title">${esc(C.errorTitle)}</h2><p>${esc(C.errorDescription)}</p>
				<a class="btn btn-primary" href="${link({ state: null })}">${esc(C.retry)}</a></section>`;
		} else if (STATE === "closed") {
			body = `<section class="panel panel-closed" aria-labelledby="closed-t"><div class="shutter" aria-hidden="true"></div>
				<h2 class="panel-title" id="closed-t">${esc(C.closedDayTitle)}</h2><p>${esc(C.closedDayDescription)}</p></section>`;
		} else if (STATE === "loading") {
			body = `<section class="chart-sec" aria-busy="true" aria-labelledby="chart-t">
				<div class="sec-head"><h2 class="sec-title" id="chart-t">${esc(C.chartTitle)}</h2></div>
				<div class="chart-shell"><div class="chart" id="chart" aria-hidden="true"></div>
				<p class="chart-overlay" role="status">${esc(C.loading)}</p></div></section>`;
		} else if (STATE === "empty") {
			body = `<section class="chart-sec" aria-labelledby="chart-t">
				<div class="sec-head sec-head-row sec-head-chart"><div><h2 class="sec-title" id="chart-t">${esc(C.chartTitle)}</h2><p class="bin-rule">${esc(C.binRule)}</p></div>${legendDaily()}</div>
				<div class="chart-shell"><div class="chart" id="chart" aria-hidden="true"></div>
				<div class="chart-overlay"><p class="ov-title">${esc(C.noObservedTitle)}</p><p>${esc(C.noObservedDescription)}</p></div></div>
				</section>`;
		} else {
			body = `<section class="chart-sec" aria-labelledby="chart-t">
				<div class="sec-head sec-head-row sec-head-chart">
					<div>
						<h2 class="sec-title" id="chart-t">${esc(C.chartTitle)}</h2>
						<p class="bin-rule" id="bin-rule">${esc(C.binRule)}</p>
					</div>
					${legendDaily()}
				</div>
				<div class="chart-shell">
					<div class="chart" id="chart" tabindex="0" role="slider" aria-label="${esc(C.chartLabel)}" aria-describedby="chart-hint bin-rule" aria-orientation="horizontal"></div>
				</div>
				<section class="readout" id="readout" aria-labelledby="ro-t">
					<h3 class="sr-only" id="ro-t">${esc(C.selectedReading)}</h3>
					<div class="ro-body" id="ro-body"></div>
					<p class="sr-only" id="ro-live" aria-live="polite"></p>
				</section>
				<p class="hint chart-hint" id="chart-hint">${esc(C.chartHint)}</p>
			</section>
			<section class="minutes" aria-labelledby="min-t">
				<div class="sec-head sec-head-row">
					<h2 class="sec-title" id="min-t">${esc(C.tableSummary)}</h2>
					<div class="pager" id="pager"></div>
				</div>
				<div class="table-wrap" id="min-table"></div>
			</section>`;
		}
		main.innerHTML = `${statusBlock(day)}${towerDaily(day)}<div class="field-body">${body}</div>`;

		if (["live", "delayed", "empty", "loading"].includes(STATE)) {
			const cs = {
				day,
				sel: STATE === "delayed" ? Math.floor(day.last / BIN) : day.nowBin,
				interactive: STATE === "live" || STATE === "delayed",
				page: -1,
			};
			drawChart(cs, true);
			let raf = 0;
			addEventListener("resize", () => {
				cancelAnimationFrame(raf);
				raf = requestAnimationFrame(() => drawChart(cs, false));
			});
			if (cs.interactive) {
				wireChart(cs);
				selectBin(cs, cs.sel, { announce: false });
			}
		}
	}

	/* ------------------------------------------------------------- chart */
	function drawChart(cs, first) {
		const { day } = cs;
		const wrap = $("#chart");
		if (!wrap) return;
		const W = Math.max(320, wrap.clientWidth);
		const gutter = 34;
		const pitch = Math.max(4, Math.floor((W - gutter) / NB));
		const gap = pitch >= 7 ? 2 : 1;
		const colW = pitch - gap;
		const plotW = pitch * NB;
		const padTop = 54;
		const plotH = 276;
		const below = 48;
		const H = padTop + plotH + below;
		const base = padTop + plotH;
		const xStart = RTL ? W - gutter : gutter; // the 6:00 AM edge
		const colX = (i) => (RTL ? xStart - (i + 1) * pitch + gap : xStart + i * pitch);
		const colC = (i) => colX(i) + colW / 2;
		const edgeX = (i) => (RTL ? xStart - i * pitch + gap / 2 : xStart + i * pitch - gap / 2);
		const y = (v) => base - (v / CAPACITY) * plotH;
		const plotL = RTL ? xStart - plotW : xStart;
		const plotR = RTL ? xStart : xStart + plotW;
		cs.geo = { W, pitch, colX, colW, xStart, plotL, plotR, padTop, plotH, base };

		const s = [];
		s.push(`<svg class="chart-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">`);
		s.push(`<defs>
			<pattern id="p-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#0b0b0c"/><rect width="2" height="6" fill="#4a4a50"/></pattern>
			<pattern id="p-dots" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#0b0b0c"/><rect x="1" y="1" width="1.6" height="1.6" fill="#8d8d94"/></pattern>
		</defs>`);

		const bandTop = { quiet: 24, moderate: 48, busy: 68, packed: 80 };
		for (const v of [24, 48, 68]) s.push(`<rect x="${plotL}" y="${y(v)}" width="${plotW}" height="1" fill="#26262b"/>`);
		s.push(`<rect x="${plotL}" y="${y(80)}" width="${plotW}" height="1" fill="#3b3b42"/>`);
		// SVG text inherits the page direction, so "start"/"end" are already logical:
		// start = the opening-hour edge in both locales.
		const gx = RTL ? W - 2 : 2;
		for (const v of [0, 24, 48, 68, 80])
			s.push(`<text class="t-axis" x="${gx}" y="${y(v) + 5}" text-anchor="start">${v}</text>`);
		const cx = RTL ? plotL + 2 : plotR - 2;
		s.push(`<text class="t-cap" x="${cx}" y="${y(80) - 8}" text-anchor="end">${esc(C.capacity)} ${CAPACITY}</text>`);

		const loading = STATE === "loading";
		for (const b of day.bins) {
			const x = colX(b.i);
			const bank = Math.floor(b.i / 6);
			const cls = first && MOTION && !loading ? ` class="lamp-on" style="animation-delay:${bank * 32}ms"` : "";
			if (loading || b.kind === "ahead") {
				s.push(`<rect x="${x}" y="${padTop}" width="${colW}" height="${plotH}" fill="#131316"/>`);
				continue;
			}
			if (b.kind === "miss") {
				s.push(`<rect x="${x}" y="${padTop}" width="${colW}" height="${plotH}" fill="url(#p-hatch)"/>`);
				continue;
			}
			if (b.kind === "wait") {
				s.push(`<rect x="${x}" y="${padTop}" width="${colW}" height="${plotH}" fill="url(#p-dots)"/>`);
				continue;
			}
			const top = b.kind === "zero" ? base - 3 : Math.min(y(b.max), base - 2);
			if (b.rest) {
				const f = b.rest === "miss" ? "url(#p-hatch)" : b.rest === "wait" ? "url(#p-dots)" : "#131316";
				s.push(`<rect x="${x}" y="${padTop}" width="${colW}" height="${Math.max(0, top - padTop - 2)}" fill="${f}"/>`);
			}
			if (b.kind === "zero") {
				s.push(`<g${cls}><rect x="${x}" y="${base - 3}" width="${colW}" height="3" fill="#f2f2ee"/></g>`);
				s.push(`<text class="t-zero" x="${colC(b.i)}" y="${base - 9}" text-anchor="middle">0</text>`);
			} else {
				s.push(`<g${cls}><rect x="${x}" y="${top}" width="${colW}" height="${base - top}" fill="#E51935"/></g>`);
			}
		}
		s.push(`<rect x="${plotL}" y="${base}" width="${plotW}" height="1" fill="#55555c"/>`);
		for (let h = 0; h <= 19; h++) {
			const ex = h === 19 ? (RTL ? plotL : plotR) : edgeX(h * 6);
			const major = h % 3 === 0 || h === 19;
			s.push(`<rect x="${Math.round(ex)}" y="${base + 1}" width="1" height="${major ? 9 : 5}" fill="${major ? "#6a6a72" : "#3c3c42"}"/>`);
			s.push(`<text class="t-hour${major ? " is-major" : ""}" x="${ex}" y="${base + 27}" text-anchor="middle">${esc(hourLabel(h))}</text>`);
		}
		// band names sit on top of the columns, at the opening edge, just under each rule
		const bx = RTL ? xStart - 7 : xStart + 7;
		for (const k of ["quiet", "moderate", "busy", "packed"])
			s.push(`<text class="t-band halo" x="${bx}" y="${y(bandTop[k]) + 16}" text-anchor="start">${esc(C.bands[k])}</text>`);
		// the selection frame sits under the annotation tags
		if (cs.interactive) s.push(`<g id="sel-mark"></g>`);

		if (!loading && STATE !== "empty") {
			const aheadFrom = day.bins.findIndex((b) => b.kind === "ahead");
			if (aheadFrom > 0) {
				const a0 = colX(aheadFrom);
				const a1 = colX(NB - 1);
				const mid = (Math.min(a0, a1) + Math.max(a0, a1) + colW) / 2;
				const ly = padTop + plotH * 0.44;
				s.push(`<text class="t-region halo" x="${mid}" y="${ly}" text-anchor="middle">${esc(C.stillAhead)}</text>`);
				s.push(`<text class="t-region-sub halo" x="${mid}" y="${ly + 21}" text-anchor="middle">${esc(fill(C.untilClose, { t: clock(DAY_MIN) }))}</text>`);
			}
			const missBins = day.bins.filter((b) => b.kind === "miss" || b.rest === "miss");
			if (missBins.length) {
				const xs = missBins.map((b) => colX(b.i));
				const mid = (Math.min(...xs) + Math.max(...xs) + colW) / 2;
				const ly = y(38);
				s.push(`<text class="t-miss halo" x="${mid}" y="${ly}" text-anchor="middle">${esc(fill(C.missingTag, { n: MISS1 - MISS0 + 1 }))}</text>`);
			}
			if (STATE === "delayed") {
				const wb = day.bins.filter((b) => b.kind === "wait" || b.rest === "wait");
				const xs = wb.map((b) => colX(b.i));
				const lastX = RTL ? xStart - ((day.last + 1) / BIN) * pitch : xStart + ((day.last + 1) / BIN) * pitch;
				const mid = (Math.min(...xs) + Math.max(...xs) + colW) / 2;
				const label = fill(C.waitingSince, { t: clock(day.last) });
				const tw = label.length * 7 + 24;
				const tx = RTL ? Math.max(plotL + tw / 2, Math.min(mid, xStart - tw / 2)) : Math.min(plotR - tw / 2, Math.max(mid, xStart + tw / 2));
				s.push(`<rect x="${tx - tw / 2}" y="${padTop - 50}" width="${tw}" height="24" fill="#000" stroke="#a4a4aa" stroke-dasharray="3 3"/>`);
				s.push(`<text class="t-wait" x="${tx}" y="${padTop - 33}" text-anchor="middle">${esc(label)}</text>`);
				s.push(`<rect x="${Math.round(lastX)}" y="${padTop - 26}" width="1" height="${plotH + 26}" fill="#a4a4aa"/>`);
			} else {
				const nx = RTL ? xStart - ((day.now + 1) / BIN) * pitch : xStart + ((day.now + 1) / BIN) * pitch;
				const label = `${C.nowAt} ${clock(day.now)}`;
				const tw = label.length * 7.4 + 22;
				s.push(`<rect x="${nx - tw / 2}" y="${padTop - 50}" width="${tw}" height="24" fill="#f2f2ee"/>`);
				s.push(`<text class="t-now" x="${nx}" y="${padTop - 33}" text-anchor="middle">${esc(label)}</text>`);
				s.push(`<path d="M${nx - 5} ${padTop - 26} L${nx + 5} ${padTop - 26} L${nx} ${padTop - 20} Z" fill="#f2f2ee"/>`);
				s.push(`<rect x="${Math.round(nx) - 1}" y="${padTop - 20}" width="2" height="${plotH + 20}" fill="#f2f2ee"/>`);
			}
			if (day.peakAt >= 0) {
				const pb = Math.floor(day.peakAt / BIN);
				const px = colC(pb);
				let hi = 0;
				for (let i = Math.max(0, pb - 4); i <= Math.min(NB - 1, pb + 4); i++) if (day.bins[i].max !== null) hi = Math.max(hi, day.bins[i].max);
				const ty = y(hi) - 32;
				const label = `${C.peakTag} ${day.peak}`;
				const tw = label.length * 7.2 + 20;
				s.push(`<rect x="${px - tw / 2}" y="${ty}" width="${tw}" height="22" fill="#000" stroke="#f2f2ee" stroke-width="1.5"/>`);
				s.push(`<text class="t-peak" x="${px}" y="${ty + 16}" text-anchor="middle">${esc(label)}</text>`);
				s.push(`<rect x="${Math.round(px) - 1}" y="${ty + 22}" width="2" height="${Math.max(0, y(day.bins[pb].max) - ty - 24)}" fill="#f2f2ee"/>`);
			}
		}
		s.push(`</svg>`);
		wrap.innerHTML = s.join("");
		if (cs.interactive) paintSelection(cs);
	}

	function paintSelection(cs) {
		const g = $("#sel-mark");
		if (!g) return;
		const { colX, colW, padTop, plotH, base } = cs.geo;
		const x = colX(cs.sel);
		g.innerHTML = `<rect x="${x - 3}" y="${padTop - 4}" width="${colW + 6}" height="${plotH + 8}" fill="none" stroke="#f2f2ee" stroke-width="2"/>
			<path d="M${x + colW / 2 - 7} ${base + 46} L${x + colW / 2 + 7} ${base + 46} L${x + colW / 2} ${base + 35} Z" fill="#f2f2ee"/>`;
	}

	const binRange = (b) => range(clock(b.m0), clock(b.m1));
	const binRangeText = (b) => `${clock(b.m0)} - ${clock(b.m1)}`;

	function selectBin(cs, i, { announce = true } = {}) {
		const max = cs.day.nowBin;
		i = Math.max(0, Math.min(max, i));
		cs.sel = i;
		paintSelection(cs);
		const b = cs.day.bins[i];
		const chart = $("#chart");
		chart.setAttribute("aria-valuemin", "0");
		chart.setAttribute("aria-valuemax", String(max));
		chart.setAttribute("aria-valuenow", String(i));
		chart.setAttribute("aria-valuetext", binRangeText(b));
		renderReadout(cs, b);
		if (announce) liveSay(binSummary(b));
		const page = Math.floor(b.m0 / 60);
		if (page !== cs.page) renderMinutes(cs, page);
		else $$("#min-table tbody.grp").forEach((g) => g.classList.toggle("is-sel", +g.dataset.bin === i));
	}

	function binSummary(b) {
		const r = binRangeText(b);
		const cov = fill(C.minutesObserved, { a: b.obs, b: BIN });
		if (b.kind === "miss") return `${r}. ${C.legendMissing}.`;
		if (b.kind === "wait") return `${r}. ${C.legendWaiting}.`;
		if (b.kind === "zero") return `${r}. ${C.legendZero}. ${cov}.`;
		return `${r}. ${C.highest} ${b.max}, ${C.bands[bandOf(b.max)]}. ${C.lowest} ${b.min}. ${cov}.`;
	}

	let liveTimer = 0;
	function liveSay(text) {
		clearTimeout(liveTimer);
		liveTimer = setTimeout(() => {
			const el = $("#ro-live");
			if (el) el.textContent = text;
		}, 300);
	}

	function renderReadout(cs, b) {
		const { day } = cs;
		const cells = [];
		for (let m = b.m0; m <= b.m1; m++) {
			const k = day.kind[m];
			const v = day.val[m];
			let cls = `mc mc-${k}`;
			let valHtml;
			if (k === "obs") {
				if (v === b.max && b.max > 0) cls += " is-max";
				if (v === 0) cls += " is-zero";
				valHtml = `<span class="mc-v num">${B(v)}</span>`;
			} else if (k === "miss") valHtml = `<span class="mc-w">${esc(C.minuteMissing)}</span>`;
			else if (k === "wait") valHtml = `<span class="mc-w">${esc(C.minuteWaiting)}</span>`;
			else valHtml = `<span class="mc-w">${esc(C.minuteAhead)}</span>`;
			cells.push(`<li class="${cls}"><span class="mc-t">${B(clockBare(m))}</span>${valHtml}</li>`);
		}
		let figs = "";
		let note = "";
		const cov = `<div class="ro-fig ro-cov"><span class="ro-k">${tpl(C.minutesObserved, { a: B(b.obs), b: B(BIN) })}</span></div>`;
		if (b.kind === "obs") {
			const band = bandOf(b.max);
			figs = `<div class="ro-fig ro-hi"><span class="ro-k">${esc(C.highest)}</span><span class="num ro-v">${B(b.max)}</span><span class="band-chip band-chip-dark">${meter(band)}<span>${esc(C.bands[band])}</span></span></div>
				<div class="ro-fig"><span class="ro-k">${esc(C.lowest)}</span><span class="num ro-v ro-v-sm">${B(b.min)}</span></div>${cov}`;
		} else if (b.kind === "zero") {
			figs = `<div class="ro-fig ro-hi"><span class="ro-k">${esc(C.highest)}</span><span class="num ro-v">${B(0)}</span><span class="band-chip band-chip-dark"><span>${esc(C.legendZero)}</span></span></div>${cov}`;
			note = C.columnZero;
		} else if (b.kind === "miss") {
			figs = `<div class="ro-fig ro-hi"><span class="ro-k">${esc(C.legendMissing)}</span><span class="num ro-v is-none">${esc(C.noReadingValue)}</span></div>${cov}`;
			note = C.columnMissing;
		} else if (b.kind === "wait") {
			figs = `<div class="ro-fig ro-hi"><span class="ro-k">${esc(C.legendWaiting)}</span><span class="num ro-v is-none">${esc(C.noReadingValue)}</span></div>`;
			note = C.columnWaiting;
		}
		if (b.kind === "obs" || b.kind === "zero") {
			if (b.rest === "miss") note = fill(C.columnPartialMissing, { n: b.miss });
			else if (b.rest === "wait") note = fill(C.columnPartialWaiting, { n: b.wait });
			else if (b.rest === "ahead") note = C.columnInProgress;
		}
		$("#ro-body").innerHTML = `
			<div class="ro-head">
				<p class="ro-title"><span class="ro-label">${esc(C.selectedReading)}</span><span class="ro-range num">${binRange(b)}</span></p>
				<div class="ro-figs">${figs}</div>
			</div>
			<ol class="mstrip">${cells.join("")}</ol>
			${note ? `<p class="ro-note">${esc(note)}</p>` : ""}`;
	}

	function wireChart(cs) {
		const chart = $("#chart");
		const pickFromX = (clientX) => {
			const r = chart.getBoundingClientRect();
			const x = clientX - r.left;
			const { pitch, xStart } = cs.geo;
			const i = RTL ? Math.floor((xStart - x) / pitch) : Math.floor((x - xStart) / pitch);
			return Math.max(0, Math.min(cs.day.nowBin, i));
		};
		chart.addEventListener("pointermove", (e) => {
			if (e.pointerType !== "mouse") return;
			const i = pickFromX(e.clientX);
			if (i !== cs.sel) selectBin(cs, i);
		});
		chart.addEventListener("click", (e) => selectBin(cs, pickFromX(e.clientX)));
		chart.addEventListener("keydown", (e) => {
			const later = RTL ? "ArrowLeft" : "ArrowRight";
			const earlier = RTL ? "ArrowRight" : "ArrowLeft";
			let i = cs.sel;
			if (e.key === later || e.key === "ArrowUp") i++;
			else if (e.key === earlier || e.key === "ArrowDown") i--;
			else if (e.key === "PageUp") i += 6;
			else if (e.key === "PageDown") i -= 6;
			else if (e.key === "Home") i = 0;
			else if (e.key === "End") i = cs.day.nowBin;
			else return;
			e.preventDefault();
			selectBin(cs, i);
		});
	}

	/* ------------------------------------------------------ minute table */
	function renderMinutes(cs, page) {
		const { day } = cs;
		const lastPage = Math.floor(day.now / 60);
		page = Math.max(0, Math.min(lastPage, page));
		const pager = $("#pager");
		const focused = document.activeElement && pager.contains(document.activeElement) ? document.activeElement.dataset.pg : null;
		cs.page = page;
		const m0 = page * 60;
		const m1 = Math.min(page * 60 + 59, day.now);
		pager.innerHTML = `
			<button type="button" class="btn btn-ghost" data-pg="prev" ${page === 0 ? "disabled" : ""}><svg class="chev" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M10 3 L5 8 L10 13" fill="none" stroke="currentColor" stroke-width="2"/></svg><span>${esc(C.previousPage)}</span></button>
			<p class="pg-state" aria-live="polite"><span>${esc(C.minuteRange)}</span> ${range(clock(m0), clock(m1))} <span class="pg-of">${esc(C.minuteOf)} ${B(int(day.scheduled))} ${esc(C.minutesUnit)}</span></p>
			<button type="button" class="btn btn-ghost" data-pg="next" ${page === lastPage ? "disabled" : ""}><span>${esc(C.nextPage)}</span><svg class="chev" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M6 3 L11 8 L6 13" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>`;
		const prev = $('[data-pg="prev"]', pager);
		const next = $('[data-pg="next"]', pager);
		prev.addEventListener("click", () => renderMinutes(cs, cs.page - 1));
		next.addEventListener("click", () => renderMinutes(cs, cs.page + 1));
		if (focused) {
			const want = focused === "prev" ? prev : next;
			(want.disabled ? (want === prev ? next : prev) : want).focus();
		}

		const groups = [];
		for (let bi = Math.floor(m0 / BIN); bi <= Math.floor(m1 / BIN); bi++) {
			const bin = day.bins[bi];
			const rows = [];
			for (let m = Math.max(bin.m0, m0); m <= Math.min(bin.m1, m1); m++) {
				const k = day.kind[m];
				const v = day.val[m];
				const none = esc(C.noReadingValue);
				if (k === "obs") {
					rows.push(
						`<tr${v === bin.max && v > 0 ? ' class="is-max"' : ""}><td class="c-time">${B(clock(m))}</td><td class="c-num num">${B(v)}</td><td>${esc(C.bands[bandOf(v)])}</td><td>${esc(v === 0 ? C.zeroState : C.observed)}</td><td>${esc(C.sourceLive)}</td></tr>`,
					);
				} else if (k === "miss") {
					rows.push(`<tr class="r-miss"><td class="c-time">${B(clock(m))}</td><td class="c-num">${none}</td><td>${none}</td><td>${esc(C.missing)}</td><td>${none}</td></tr>`);
				} else if (k === "wait") {
					rows.push(`<tr class="r-wait"><td class="c-time">${B(clock(m))}</td><td class="c-num">${none}</td><td>${none}</td><td>${esc(C.waitingState)}</td><td>${none}</td></tr>`);
				}
			}
			const r = binRange(bin);
			const head =
				bin.kind === "obs" || bin.kind === "zero"
					? tpl(C.groupHead, { r, v: B(bin.max) })
					: bin.kind === "miss"
						? tpl(C.groupHeadMissing, { r })
						: tpl(C.groupHeadWaiting, { r });
			groups.push(
				`<tbody class="grp${bi === cs.sel ? " is-sel" : ""}" data-bin="${bi}"><tr class="grp-head"><th scope="rowgroup" colspan="5"><span class="gh-mark" aria-hidden="true"></span>${head}</th></tr>${rows.join("")}</tbody>`,
			);
		}
		$("#min-table").innerHTML = `<table class="mtable">
			<caption class="sr-only">${esc(C.tableCaption)}</caption>
			<thead><tr><th scope="col">${esc(C.time)}</th><th scope="col">${esc(C.count)}</th><th scope="col">${esc(C.band)}</th><th scope="col">${esc(C.state)}</th><th scope="col">${esc(C.source)}</th></tr></thead>
			${groups.join("")}
		</table>`;
	}

	/* ============================================================== REPORTS */
	function hash(a, b) {
		let h = (a * 374761393 + b * 668265263) >>> 0;
		h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
		return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
	}
	function buildReports() {
		const base = [6, 27, 19, 11, 8, 8, 11, 15, 9, 10, 18, 35, 57, 55, 44, 31, 21, 13, 6];
		const mul = [1.03, 1.06, 0.97, 1.0, 0.92];
		const fri = [null, null, null, null, null, null, null, null, 9, 11, 15, 21, 29, 37, 47, 53, 45, 31, 15];
		const sat = [0, 10, 16, 22, 26, 24, 20, 18, 14, 14, 22, 30, 38, 40, 34, 26, 18, 10, 5];
		const cells = [];
		for (let d = 0; d < 7; d++) {
			for (let h = 0; h < 19; h++) {
				const c = { d, h, state: "value", avg: null, observed: 0, scheduled: 240, samples: 4 };
				const noise = (hash(d + 1, h + 1) - 0.5) * 4;
				if (d === 5 && fri[h] === null) {
					c.state = "closed";
					c.scheduled = 0;
					c.samples = 0;
				} else if (d === 2 && h === 4) {
					c.state = "missing";
					c.samples = 0;
				} else if (d === 6 && h === 0) {
					c.state = "zero";
					c.avg = 0;
					c.observed = 236;
				} else {
					const b = d === 5 ? fri[h] : d === 6 ? sat[h] : base[h] * mul[d];
					c.avg = Math.max(1.2, Math.round((b + noise) * 10) / 10);
					c.observed = d === 3 && h === 8 ? 212 : 240 - Math.floor(hash(h + 11, d + 7) * 13);
				}
				cells.push(c);
			}
		}
		return cells;
	}
	const rampStep = (v) => (v < 10 ? 1 : v < 20 ? 2 : v < 30 ? 3 : v < 40 ? 4 : v < 50 ? 5 : 6);

	function renderReports() {
		const cells = buildReports();
		const main = $("#main");
		const windowLine = `<p class="dayline"><span class="dl-item"><span class="dl-k">${esc(C.windowLabel)}</span> <span class="dl-v">${range(
			`26 ${C.monthsShort[7]}`,
			`22 ${C.monthsShort[8]} 2026`,
		)}</span></span><span class="dl-item"><span class="dl-k">${esc(C.windowDays)}</span> <span class="dl-v">${B(28)}</span></span><span class="dl-item"><span class="dl-k">${esc(C.tz)}</span> <span class="dl-v">${esc(C.tzName)}</span></span></p>`;
		const head = `<div class="field-head field-head-r">
			<div class="title-block"><p class="eyebrow">${esc(C.rPageTitle)}</p><h1 class="page-title">${esc(C.rTitle)}</h1><p class="page-desc">${esc(C.rDescription)}</p></div>
			${windowLine}</div>`;

		if (STATE === "loading" || STATE === "error") {
			const isErr = STATE === "error";
			main.innerHTML = `${head}<div class="tower">${rangeForm()}</div><div class="field-body">
				<section class="panel${isErr ? " panel-error" : ""}" ${isErr ? 'role="alert"' : 'role="status" aria-busy="true"'}>
				<h2 class="panel-title">${esc(isErr ? C.rErrorTitle : C.rLoading)}</h2>${
					isErr ? `<p>${esc(C.rErrorDescription)}</p><a class="btn btn-primary" href="${link({ state: null })}">${esc(C.retry)}</a>` : ""
				}</section></div>`;
			wireRange();
			return;
		}

		let best = cells[0];
		for (const c of cells) if (c.avg !== null && c.avg > (best.avg ?? -1)) best = c;

		const hourHeads = Array.from(
			{ length: 19 },
			(_, h) => `<span role="columnheader" class="hm-h${h % 3 === 0 ? " is-major" : ""}" style="grid-column:${h + 2}">${B(hourLabel(h))}</span>`,
		).join("");
		const rows = [];
		for (let d = 0; d < 7; d++) {
			const rc = cells.filter((c) => c.d === d);
			const cellsHtml = rc
				.map((c) => {
					let cls = "cell";
					let inner = "";
					if (c.state === "value") {
						cls += ` s-${rampStep(c.avg)}`;
						inner = `<span class="cv num">${B(Math.round(c.avg))}</span>`;
					} else if (c.state === "zero") {
						cls += " s-zero";
						inner = `<span class="cv num">${B(0)}</span>`;
					} else if (c.state === "closed") cls += " s-closed";
					else {
						cls += " s-missing";
						inner = `<span class="cv cv-none" aria-hidden="true">${esc(C.noReadingValue)}</span>`;
					}
					const sel = c === best;
					return `<span role="gridcell" class="${cls}${sel ? " is-sel" : ""}" style="grid-column:${c.h + 2}" tabindex="${sel ? 0 : -1}" aria-selected="${sel}" data-d="${c.d}" data-h="${c.h}" aria-label="${esc(cellLabel(c))}">${inner}</span>`;
				})
				.join("");
			const closedRun =
				d === 5
					? `<span class="hm-closed-run" style="grid-column:2 / span 8" aria-hidden="true"><span>${tpl(C.closedUntil, { t: B(hourLabel(8)) })}</span></span>`
					: "";
			rows.push(
				`<div role="row" class="hm-row"><span role="rowheader" class="hm-wd" style="grid-column:1"><span aria-hidden="true">${esc(C.weekdayShort[d])}</span><span class="sr-only">${esc(C.weekday[d])}</span></span>${cellsHtml}${closedRun}</div>`,
			);
		}
		const legend = `<div class="hm-legend" role="group" aria-label="${esc(C.legendLabel)}">
			<span class="lg-end">${esc(C.legendQuiet)}</span>
			<ul class="ramp">${[
				["1-9", 1],
				["10-19", 2],
				["20-29", 3],
				["30-39", 4],
				["40-49", 5],
				["50+", 6],
			]
				.map(([t, s]) => `<li><span class="rs s-${s}" aria-hidden="true"></span><span class="rs-t">${B(t)}</span></li>`)
				.join("")}</ul>
			<span class="lg-end">${esc(C.legendBusy)}</span>
			<ul class="lg-states">
				<li><span class="rs s-zero" aria-hidden="true">0</span><span>${esc(C.legendZeroCell)}</span></li>
				<li><span class="rs s-closed" aria-hidden="true"></span><span>${esc(C.legendClosed)}</span></li>
				<li><span class="rs s-missing" aria-hidden="true"></span><span>${esc(C.legendNoData)}</span></li>
			</ul>
		</div>`;

		const cmp = [
			[C.comparisonAverage, "31.4", "29.0", 2.4, one(2.4)],
			[C.comparisonCrossings, "2,316", "2,187", 129, int(129)],
			[C.comparisonCoverage, "98.6%", "97.9%", 0.7, `${one(0.7)} ${C.points}`],
		];
		const upIcon = `<svg class="chg-g" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M6 1 L11.5 11 L0.5 11 Z" fill="currentColor"/></svg>`;
		const downIcon = `<svg class="chg-g" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M6 11 L11.5 1 L0.5 1 Z" fill="currentColor"/></svg>`;
		const flatIcon = `<svg class="chg-g" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><rect x="1" y="5" width="10" height="2" fill="currentColor"/></svg>`;
		const cmpRows = cmp
			.map(([k, a, b, dlt, dTxt]) => {
				const dir = dlt > 0 ? "up" : dlt < 0 ? "down" : "flat";
				const word = dir === "up" ? C.comparisonUp : dir === "down" ? C.comparisonDown : C.comparisonFlat;
				const icon = dir === "up" ? upIcon : dir === "down" ? downIcon : flatIcon;
				return `<tr><th scope="row">${esc(k)}</th><td class="v-now num">${B(a)}</td><td class="v-prev num">${B(b)}</td><td><span class="chg chg-${dir}">${icon}<span class="chg-w">${esc(word)}</span><span class="num chg-n">${B(dTxt)}</span></span></td></tr>`;
			})
			.join("");
		const monSep = C.monthsShort[8];
		const versus = `<section class="versus" aria-labelledby="cmp-t">
			<div class="sec-head"><h2 class="sec-title" id="cmp-t">${esc(C.comparisonTitle)}</h2><p class="sec-desc">${esc(C.comparisonDescription)}</p></div>
			<table class="vtable">
				<thead><tr><th scope="col">${esc(C.comparisonMetric)}</th>
				<th scope="col" class="vh-now"><span class="vh-t">${esc(C.comparisonCurrent)}</span><span class="vh-d">${B("13-19")} ${esc(monSep)}</span></th>
				<th scope="col"><span class="vh-t">${esc(C.comparisonPrior)}</span><span class="vh-d">${B("6-12")} ${esc(monSep)}</span></th>
				<th scope="col">${esc(C.comparisonChange)}</th></tr></thead>
				<tbody>${cmpRows}</tbody>
			</table></section>`;

		const csv = `<section class="csv" aria-labelledby="csv-t">
			<div class="sec-head"><h2 class="sec-title" id="csv-t">${esc(C.csvTitle)}</h2><p class="sec-desc">${esc(C.csvDescription)}</p></div>
			<form class="csv-form" id="csv-form" novalidate>
				<fieldset class="bare"><legend class="sr-only">${esc(C.csvLegend)}</legend>
				<div class="date-pair">
					<label class="field"><span class="field-l">${esc(C.startLabel)}</span><input class="inp num" dir="ltr" inputmode="numeric" name="cs" value="2026-09-01" aria-describedby="csv-hint csv-msg" autocomplete="off" spellcheck="false"></label>
					<label class="field"><span class="field-l">${esc(C.endLabel)}</span><input class="inp num" dir="ltr" inputmode="numeric" name="ce" value="2026-09-22" aria-describedby="csv-hint csv-msg" autocomplete="off" spellcheck="false"></label>
				</div></fieldset>
				<div class="csv-go">
					<button type="submit" class="btn btn-primary">
						<svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M10 3v10M6 9l4 4 4-4M4 16h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>
						<span>${esc(C.csvExport)}</span></button>
					<p class="hint" id="csv-hint"><span>${esc(C.csvHint)}</span> · <span dir="ltr">${esc(C.dateFormat)}</span></p>
				</div>
				<p class="form-msg" id="csv-msg" aria-live="polite"></p>
			</form>
			<p class="privacy"><svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M10 2 L16.5 4.5 V9.5 C16.5 13.5 13.5 16.5 10 18 C6.5 16.5 3.5 13.5 3.5 9.5 V4.5 Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 10 L9.2 12.2 L13.2 8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg><span>${esc(C.csvPrivacyNote)}</span></p>
		</section>`;

		const tableRows = cells
			.map(
				(c) =>
					`<tr class="st-${c.state}"><th scope="row">${esc(C.weekday[c.d])}</th><td>${range(hourLabel(c.h), hourLabel(c.h + 1))}</td><td>${esc(stateWord(c))}</td><td class="num">${
						c.avg === null ? esc(C.noReadingValue) : B(one(c.avg))
					}</td><td class="num">${B(c.observed)}</td><td class="num">${B(c.scheduled)}</td><td class="num">${B(c.samples)}</td></tr>`,
			)
			.join("");

		main.innerHTML = `${head}
			<div class="tower">${rangeForm()}<section class="selhour" id="selhour" aria-labelledby="sh-t" aria-live="polite"></section></div>
			<div class="field-body">
				<section class="heat" aria-labelledby="hm-t">
					<div class="sec-head sec-head-row">
						<div><h2 class="sec-title" id="hm-t">${esc(C.heatmapTitle)}</h2><p class="sec-desc">${esc(C.heatmapDescription)}</p></div>
						<p class="hint" id="hm-hint"><span>${esc(C.heatmapHint)}</span> <span class="hint-soft">${esc(C.cellNumbers)}</span></p>
					</div>
					<div class="hm" role="grid" aria-labelledby="hm-t" aria-describedby="hm-hint" id="hm">
						<div role="row" class="hm-row hm-head"><span role="columnheader" class="hm-corner" style="grid-column:1"><span class="sr-only">${esc(C.weekdayAxis)}</span></span>${hourHeads}</div>
						${rows.join("")}
					</div>
					<div class="hm-foot"><span class="hm-axis">${esc(C.hourAxis)}</span>${legend}</div>
				</section>
				<div class="duo">${versus}${csv}</div>
				<p class="footnote">${esc(C.footnote)}</p>
				<details class="htable">
					<summary><span class="sum-t">${esc(C.hTableSummary)}</span><span class="sum-d">${esc(C.hTableDescription)} · ${B(133)}</span></summary>
					<div class="table-wrap"><table class="mtable">
						<caption class="sr-only">${esc(C.hTableDescription)}</caption>
						<thead><tr><th scope="col">${esc(C.columnWeekday)}</th><th scope="col">${esc(C.columnHour)}</th><th scope="col">${esc(C.columnState)}</th><th scope="col">${esc(C.columnAverage)}</th><th scope="col">${esc(C.columnObserved)}</th><th scope="col">${esc(C.columnExpected)}</th><th scope="col">${esc(C.columnSamples)}</th></tr></thead>
						<tbody>${tableRows}</tbody></table></div>
				</details>
			</div>`;

		wireRange();
		const hm = $("#hm");
		const setSel = (el, focus) => {
			const prev = $(".cell.is-sel", hm);
			if (prev && prev !== el) {
				prev.classList.remove("is-sel");
				prev.setAttribute("aria-selected", "false");
				prev.tabIndex = -1;
			}
			el.classList.add("is-sel");
			el.setAttribute("aria-selected", "true");
			el.tabIndex = 0;
			if (focus) el.focus();
			renderSelHour(cells.find((x) => x.d === +el.dataset.d && x.h === +el.dataset.h));
		};
		hm.addEventListener("click", (e) => {
			const el = e.target.closest(".cell");
			if (el) setSel(el, true);
		});
		hm.addEventListener("keydown", (e) => {
			const el = e.target.closest(".cell");
			if (!el) return;
			let d = +el.dataset.d;
			let h = +el.dataset.h;
			const later = RTL ? "ArrowLeft" : "ArrowRight";
			const earlier = RTL ? "ArrowRight" : "ArrowLeft";
			if (e.key === later) h++;
			else if (e.key === earlier) h--;
			else if (e.key === "ArrowDown") d++;
			else if (e.key === "ArrowUp") d--;
			else if (e.key === "Home") {
				h = 0;
				if (e.ctrlKey) d = 0;
			} else if (e.key === "End") {
				h = 18;
				if (e.ctrlKey) d = 6;
			} else if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				setSel(el, false);
				return;
			} else return;
			e.preventDefault();
			d = Math.max(0, Math.min(6, d));
			h = Math.max(0, Math.min(18, h));
			const next = $(`.cell[data-d="${d}"][data-h="${h}"]`, hm);
			if (next) setSel(next, true);
		});
		renderSelHour(best);
	}

	function stateWord(c) {
		return c.state === "value" ? C.stateValue : c.state === "zero" ? C.stateZero : c.state === "closed" ? C.stateClosed : C.stateMissing;
	}
	function cellLabel(c) {
		const when = `${C.weekday[c.d]}, ${hourLabel(c.h)} - ${hourLabel(c.h + 1)}`;
		if (c.state === "closed") return `${when}: ${C.stateClosed}`;
		if (c.state === "missing") return `${when}: ${C.stateMissing}. ${C.selectedObserved} 0 / ${c.scheduled}`;
		const st = c.state === "zero" ? `${C.stateZero}. ` : "";
		return `${when}: ${st}${C.selectedAverage} ${one(c.avg)}. ${C.selectedObserved} ${c.observed} / ${c.scheduled}. ${C.selectedSamples} ${c.samples}`;
	}

	function renderSelHour(c) {
		const el = $("#selhour");
		const when = `<p class="sh-when"><span>${esc(C.weekday[c.d])}</span> <span class="num">${range(hourLabel(c.h), hourLabel(c.h + 1))}</span></p>`;
		const dl = `<dl class="sh-dl">
			<div><dt>${esc(C.selectedObserved)}</dt><dd class="num">${B(c.observed)}</dd></div>
			<div><dt>${esc(C.selectedExpected)}</dt><dd class="num">${B(c.scheduled)}</dd></div>
			<div><dt>${esc(C.selectedSamples)}</dt><dd class="num">${B(c.samples)}</dd></div></dl>`;
		let body = "";
		let mod = "";
		if (c.state === "value") {
			mod = "sh-value";
			body = `<p class="sh-big"><span class="num sh-num">${B(one(c.avg))}</span><span class="sh-k">${esc(C.selectedAverage)}</span></p>${dl}`;
		} else if (c.state === "zero") {
			mod = "sh-zero";
			body = `<p class="sh-big"><span class="num sh-num">${B(one(0))}</span><span class="sh-k">${esc(C.stateZero)}</span></p>${dl}`;
		} else if (c.state === "closed") {
			mod = "sh-closed";
			body = `<p class="sh-msg"><span class="lamp lamp-closed" aria-hidden="true"></span><span>${esc(C.selectedClosed)}</span></p>`;
		} else {
			mod = "sh-missing";
			body = `<p class="sh-msg">${esc(C.selectedMissing)}</p><p class="sh-sub">${esc(C.selectedNoValue)}</p>${dl}`;
		}
		el.className = `selhour ${mod}`;
		el.innerHTML = `<h2 class="sh-title" id="sh-t">${esc(C.selectedTitle)}</h2>${when}${body}`;
	}

	function rangeForm() {
		return `<form class="range" id="range-form" novalidate aria-labelledby="rg-t">
			<div class="range-head"><h2 class="tw-title" id="rg-t">${esc(C.rangeLegend)}</h2><span class="range-hint" id="rg-hint">${esc(C.rangeHint)}</span></div>
			<div class="date-pair">
				<label class="field"><span class="field-l">${esc(C.startLabel)}</span><input class="inp num" dir="ltr" inputmode="numeric" name="rs" value="2026-08-26" aria-describedby="rg-hint rg-msg" autocomplete="off" spellcheck="false"></label>
				<label class="field"><span class="field-l">${esc(C.endLabel)}</span><input class="inp num" dir="ltr" inputmode="numeric" name="re" value="2026-09-22" aria-describedby="rg-hint rg-msg" autocomplete="off" spellcheck="false"></label>
			</div>
			<fieldset class="presets"><legend class="field-l">${esc(C.presetsLegend)}</legend>
				<div class="preset-row">
					<button type="button" class="preset" data-n="7" aria-pressed="false">${esc(C.presetLast7)}</button>
					<button type="button" class="preset" data-n="28" aria-pressed="true">${esc(C.presetLast28)}</button>
					<button type="button" class="preset" data-n="31" aria-pressed="false">${esc(C.presetLast31)}</button>
				</div>
			</fieldset>
			<div class="range-go"><button type="submit" class="btn btn-primary btn-apply">${esc(C.apply)}</button>
			<p class="form-msg" id="rg-msg" aria-live="polite"><span class="msg-ok">${esc(C.rangeApplied)}</span></p></div>
		</form>`;
	}

	function parseISO(s) {
		const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
		if (!m) return null;
		const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
		if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
		return d;
	}
	const iso = (d) => d.toISOString().slice(0, 10);

	function validateRange(a, b, maxDays, tooLongMsg) {
		if (!String(a).trim() || !String(b).trim()) return C.problemIncomplete;
		const da = parseISO(a);
		const db = parseISO(b);
		if (!da || !db) return C.problemMalformed;
		if (db < da) return C.problemInverted;
		if ((db - da) / 86400000 + 1 > maxDays) return tooLongMsg;
		return null;
	}

	function wireRange() {
		const form = $("#range-form");
		if (form) {
			const msg = $("#rg-msg");
			const rs = form.elements.rs;
			const re = form.elements.re;
			const setPending = () => {
				msg.innerHTML = `<span class="msg-pending">${esc(C.rangePending)}</span>`;
				[rs, re].forEach((i) => i.removeAttribute("aria-invalid"));
			};
			$$(".preset", form).forEach((p) =>
				p.addEventListener("click", () => {
					const end = parseISO(re.value) || parseISO("2026-09-22");
					const start = new Date(end.getTime() - (+p.dataset.n - 1) * 86400000);
					rs.value = iso(start);
					re.value = iso(end);
					$$(".preset", form).forEach((x) => x.setAttribute("aria-pressed", String(x === p)));
					setPending();
				}),
			);
			[rs, re].forEach((i) =>
				i.addEventListener("input", () => {
					$$(".preset", form).forEach((x) => x.setAttribute("aria-pressed", "false"));
					setPending();
				}),
			);
			form.addEventListener("submit", (e) => {
				e.preventDefault();
				const problem = validateRange(rs.value, re.value, 31, C.problemTooLong);
				if (problem) {
					msg.innerHTML = `<span class="msg-err">${esc(problem)}</span>`;
					[rs, re].forEach((i) => i.setAttribute("aria-invalid", "true"));
					return;
				}
				const same = rs.value.trim() === "2026-08-26" && re.value.trim() === "2026-09-22";
				msg.innerHTML = same ? `<span class="msg-ok">${esc(C.rangeApplied)}</span>` : `<span class="msg-pending">${esc(C.rangeConceptOnly)}</span>`;
			});
		}
		const csv = $("#csv-form");
		if (csv) {
			csv.addEventListener("submit", (e) => {
				e.preventDefault();
				const problem = validateRange(csv.elements.cs.value, csv.elements.ce.value, 366, C.problemCsvTooLong);
				$("#csv-msg").innerHTML = problem ? `<span class="msg-err">${esc(problem)}</span>` : `<span class="msg-pending">${esc(C.csvConcept)}</span>`;
			});
		}
	}

	/* ========================================================= PLACEHOLDER */
	function renderPlaceholder() {
		const [title, desc] = C.ph[SECTION];
		const lamps = Array.from({ length: 6 * 38 }, () => "<i></i>").join("");
		$("#main").innerHTML = `
			<div class="field-head"><div class="title-block"><p class="eyebrow">${esc(C.sec[SECTION])}</p><h1 class="page-title">${esc(title)}</h1><p class="page-desc">${esc(desc)}</p></div></div>
			<div class="tower"><p class="tower-note"><span class="lamp lamp-off" aria-hidden="true"></span><span>${esc(C.notDesigned)}</span></p></div>
			<div class="field-body">
				<section class="board-off" aria-labelledby="off-t">
					<div class="off-grid" aria-hidden="true">${lamps}</div>
					<div class="off-plate"><p class="off-k">${esc(C.boardOff)}</p><h2 class="off-t" id="off-t">${esc(C.notDesigned)}</h2><p class="off-d">${esc(C.notDesignedBody)}</p></div>
				</section>
			</div>`;
	}

	/* ----------------------------------------------------------------- boot */
	renderShell();
	if (SECTION === "daily") renderDaily();
	else if (SECTION === "history") renderReports();
	else renderPlaceholder();
	const markReady = () => root.setAttribute("data-ready", "1");
	if (document.fonts && document.fonts.ready)
		document.fonts.ready.then(() => {
			if (SECTION === "daily") window.dispatchEvent(new Event("resize"));
			requestAnimationFrame(() => requestAnimationFrame(markReady));
		});
	else markReady();
})();
