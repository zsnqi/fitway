// Iron & Chalk — concept-only Owner exploration with synthetic data.
// Query parameters: lang=ar|en, section=daily|history|access|audit|health|settings,
// state=live|delayed|closed|empty|loading|error, motion=off, select=<minute index>.
(() => {
	"use strict";

	/* ───────────────────────── Constants ───────────────────────── */

	const SECTIONS = ["daily", "history", "access", "audit", "health", "settings"];
	const DAY_STATES = ["live", "delayed", "closed", "empty", "loading", "error"];
	const OPEN_MIN = 6 * 60; // 6:00 AM gym-local
	const DAY_LEN = 19 * 60; // closes 1:00 AM next day
	const NOW = 822; // 7:42 PM
	const DELAYED_LAST = 801; // 7:21 PM
	const GAP = [494, 511]; // 2:14 PM – 2:31 PM, 18 minutes missing
	const ZERO_UNTIL = 9; // 6:00–6:09 AM open and genuinely empty
	const YMAX = 80;
	const THRESHOLDS = { quiet: 24, moderate: 48, busy: 68 }; // this day's rows
	const PAGE = 60;
	const narrowQuery = matchMedia("(max-width: 720px)");

	/* ───────────────────────── Copy ───────────────────────── */

	const COPY = {
		en: {
			skip: "Skip to operational status",
			monitoring: "Monitoring",
			management: "Management",
			appNav: "Monitoring and management",
			langText: "العربية",
			langLabel: "Switch to Arabic",
			signOut: "Sign out",
			noop: "Not part of this concept",
			concept: "Exploration concept · synthetic data",
			group: "Management sections",
			sections: {
				daily: "Daily",
				history: "Reports",
				access: "Access",
				audit: "Activity Log",
				health: "Operations",
				settings: "Settings",
			},
			eyebrow: "Daily analytics",
			businessDay: "Business day",
			dayTitle: "Wednesday 23 September",
			hours: "Open 6:00 AM – 1:00 AM next day",
			gymTime: "Gym time: Riyadh",
			live: "Live",
			updated: (t) => `Updated ${t}`,
			delayed: "Delayed",
			noReadingSince: (t) => `No reading since ${t}`,
			closedToday: "Closed today",
			noReadingsYet: "No readings yet",
			peak: "Peak level",
			average: "Average occupancy",
			crossings: "Total entries",
			coverage: "Data coverage",
			at: (t) => `at ${t}`,
			across: (n) => `Across ${n} recorded minutes`,
			crossingsNote: "Estimated entrance crossings, not unique members.",
			busiestEntry: (t) => `Most entries around ${t}`,
			of: (n) => `of ${n}`,
			coverageCap: "Recorded open minutes of the scheduled minutes so far",
			asOf: (t) => `Last-known figures, as of ${t}`,
			chartTitle: "People present through the day",
			legendPeople: "Observed value",
			legendZero: "Genuine zero",
			legendMissing: "Missing observation",
			legendAhead: "Still ahead",
			legendWait: "Waiting for readings",
			bands: {
				quiet: "Quiet",
				moderate: "Moderate",
				busy: "Busy",
				packed: "Packed",
			},
			nowFlag: (t) => `Now · ${t}`,
			peakFlag: (n, t) => `Peak <b>${n}</b> · ${t}`,
			approx: (n) => `≈ ${n}`,
			present: (n) => `≈ ${n} present`,
			gapFlag: (n) => `Missing · ${n} min`,
			aheadFlag: (t) => `Still ahead · until ${t}`,
			waitFlag: (t) => `No readings since ${t}`,
			chartLabel: "Interactive occupancy curve",
			chartHint:
				"Focus the chart and use Left or Right Arrow to inspect observed points. Hover or tap also selects a point.",
			selected: "Selected reading",
			latestReading: "Latest",
			lastKnown: "Last known",
			sourceLive: "Live",
			missingState: "Missing observation",
			zeroState: "Genuine zero",
			minutesWord: (n) => `${n} min`,
			tableSummary: "Minute details",
			tableCaption: (a, b) => `Showing ${a} to ${b}`,
			prevPage: "Previous 60 minutes",
			nextPage: "Next 60 minutes",
			tableRegion: "Minute-by-minute analytics data",
			colTime: "Gym-local time",
			colState: "State",
			colCount: "Approximate occupancy",
			colBand: "Crowd band",
			colSource: "Source",
			observed: "Observed",
			loading: "Loading today's readings",
			loadingDescription: "Loading the daily analytics summary and chart.",
			errorTitle: "Today's readings didn't load",
			errorDescription: "We couldn’t load today’s readings. Please try again.",
			retry: "Try again",
			closedTitle: "FITWAY is closed today",
			closedDescription:
				"FITWAY is closed today on the published schedule, so no readings are expected. Daily analytics resumes with the first reading after the gym reopens.",
			emptyTitle: "No readings yet today",
			emptyDescription: "Today’s chart will appear when readings are available.",
			// Reports
			reportsEyebrow: "Reports",
			reportsTitle: "Busiest times and direction",
			reportsDescription:
				"How the week actually fills, by weekday and gym-local hour",
			windowLine: "26 Aug – 22 Sep 2026 · 28 business days",
			rangeLegend: "Reporting range",
			rangeHint: "Up to 31 days",
			start: "Start",
			end: "End",
			presets: "Quick ranges",
			last7: "Last 7 days",
			last28: "Last 28 days",
			last31: "Last 31 days",
			apply: "Apply",
			applied: "Report window applied",
			heatmapTitle: "Occupancy by weekday and hour",
			heatmapDescription:
				"How busy the gym usually is at each hour of the working day",
			heatmapRegion: "Weekday by hour heatmap",
			heatmapHint:
				"Select a cell to read its figures. Arrow keys move between cells.",
			legendQuiet: "Quieter",
			legendBusy: "Busier",
			legendOpenEmpty: "Open and empty",
			legendClosed: "Closed",
			legendNoData: "No data",
			weekdayAxis: "Weekday",
			closedUntil: (t) => `Closed until ${t}`,
			selectedHour: "Selected hour",
			selAverage: "Average occupancy",
			selObserved: "Observed open minutes",
			selSamples: "Weekdays measured",
			selClosed: "The gym was not open in this hour.",
			selMissing: "No history was recorded for this hour.",
			selZero: "Open and empty: the gym was open, and nobody was counted.",
			stateValue: "Observed",
			stateZero: "Open and empty",
			stateClosed: "Closed",
			stateMissing: "No data",
			hourlySummary: "Hourly detail",
			hourlyRegion: "Weekday by hour figures",
			colWeekday: "Weekday",
			colHour: "Hour",
			colAverage: "Average occupancy",
			colObserved: "Observed open minutes",
			colExpected: "Scheduled open minutes",
			colSamples: "Weekdays measured",
			comparisonTitle: "Weekly comparison",
			comparisonDescription: "Last 2 complete weeks",
			metric: "Metric",
			latestWeek: "Latest week",
			weekBefore: "Week before",
			latestWeekRange: "13-19 Sep",
			weekBeforeRange: "6-12 Sep",
			change: "Change",
			up: "up",
			down: "down",
			flat: "unchanged",
			pts: "pts",
			csvTitle: "CSV export range",
			csvDescription:
				"Download minute-by-minute occupancy history for your selected dates.",
			csvHint: "Up to 366 days",
			csvExport: "Export CSV",
			csvPrivacy:
				"The file carries occupancy history only: no device, no account, and nothing about an individual visitor.",
			footnote:
				"An average is taken over the minutes that were actually observed, so an outage lowers the data coverage rather than quietly lowering the average. Closed hours are excluded from every average instead of being counted as empty. Changing a setting today never rewrites what last month looked like.",
			none: "None",
			// Placeholders
			phEyebrow: (n) => `Management section ${n}`,
			phDescriptions: {
				access: "Staff PIN and owner accounts",
				audit: "Owner and staff actions",
				health: "Counter uptime and incidents over the last business days",
				settings:
					"Set capacity, crowd levels, business day, and weekly hours. Changes apply from now on and never rewrite past reports.",
			},
			phTitles: {
				access: "Access",
				audit: "Activity Log",
				health: "Operations & incidents",
				settings: "Settings",
			},
			phNote:
				"Not designed in this early look. The section keeps its place so the navigation stays whole; it would follow the same Iron & Chalk grammar if you take this direction further.",
		},
		ar: {
			skip: "الانتقال إلى الحالة التشغيلية",
			monitoring: "المراقبة",
			management: "الإدارة",
			appNav: "المراقبة والإدارة",
			langText: "English",
			langLabel: "التبديل إلى اللغة الإنجليزية",
			signOut: "تسجيل الخروج",
			noop: "ليس جزءاً من هذا المفهوم",
			concept: "مفهوم استكشافي · بيانات تجريبية",
			group: "أقسام الإدارة",
			sections: {
				daily: "اليومي",
				history: "التقارير",
				access: "الوصول",
				audit: "سجل النشاط",
				health: "التشغيل",
				settings: "الإعدادات",
			},
			eyebrow: "التحليلات اليومية",
			businessDay: "يوم العمل",
			dayTitle: "الأربعاء 23 سبتمبر",
			hours: "يفتح 6:00 ص ويغلق 1:00 ص في اليوم التالي",
			gymTime: "توقيت الصالة: الرياض",
			live: "مباشر",
			updated: (t) => `آخر تحديث ${t}`,
			delayed: "متأخر",
			noReadingSince: (t) => `لا قراءة منذ ${t}`,
			closedToday: "مغلق اليوم",
			noReadingsYet: "لا توجد قراءات بعد",
			peak: "مستوى الذروة",
			average: "متوسط الازدحام",
			crossings: "إجمالي الدخول",
			coverage: "تغطية البيانات",
			at: (t) => `عند ${t}`,
			across: (n) => `خلال ${n} دقيقة مسجّلة`,
			crossingsNote: "عبور تقديري للمدخل، لا عدد أعضاء مختلفين.",
			busiestEntry: (t) => `ذروة الدخول عند ${t}`,
			of: (n) => `من ${n}`,
			coverageCap: "دقائق العمل المسجّلة من الدقائق المجدولة حتى الآن",
			asOf: (t) => `آخر أرقام معروفة، حتى ${t}`,
			chartTitle: "عدد الموجودين خلال اليوم",
			legendPeople: "قيمة مرصودة",
			legendZero: "صفر فعلي",
			legendMissing: "رصد مفقود",
			legendAhead: "لم يحن بعد",
			legendWait: "بانتظار القراءات",
			bands: {
				quiet: "هادئ",
				moderate: "متوسط",
				busy: "مزدحم",
				packed: "شديد الازدحام",
			},
			nowFlag: (t) => `الآن · ${t}`,
			peakFlag: (n, t) => `الذروة <b>${n}</b> · ${t}`,
			approx: (n) => `نحو ${n}`,
			present: (n) => `نحو ${n} حاضرًا`,
			gapFlag: (n) => `رصد مفقود · ${n} دقيقة`,
			aheadFlag: (t) => `لم يحن بعد · حتى ${t}`,
			waitFlag: (t) => `لا قراءات منذ ${t}`,
			chartLabel: "منحنى إشغال تفاعلي",
			chartHint:
				"ركّز على المخطط واستخدم سهم اليمين أو اليسار لاستعراض النقاط المرصودة. ويمكنك أيضاً التحديد بالتمرير أو اللمس.",
			selected: "القراءة المحددة",
			latestReading: "آخر قراءة",
			lastKnown: "آخر قراءة معروفة",
			sourceLive: "مباشر",
			missingState: "رصد مفقود",
			zeroState: "صفر فعلي",
			minutesWord: (n) => `${n} دقيقة`,
			tableSummary: "تفاصيل الدقائق",
			tableCaption: (a, b) => `المعروض من ${a} إلى ${b}`,
			prevPage: "الدقائق الستون السابقة",
			nextPage: "الدقائق الستون التالية",
			tableRegion: "بيانات التحليلات لكل دقيقة",
			colTime: "الوقت المحلي للصالة",
			colState: "الحالة",
			colCount: "الإشغال التقريبي",
			colBand: "مستوى الازدحام",
			colSource: "المصدر",
			observed: "مرصود",
			loading: "جارٍ تحميل قراءات اليوم",
			loadingDescription: "جارٍ تحميل ملخص التحليلات اليومية ومخططها.",
			errorTitle: "تعذر تحميل قراءات اليوم",
			errorDescription: "تعذر تحميل قراءات اليوم. يرجى إعادة المحاولة.",
			retry: "إعادة المحاولة",
			closedTitle: "الصالة مغلقة اليوم",
			closedDescription:
				"الصالة مغلقة اليوم حسب الجدول المعلن، لذلك لا توجد قراءات متوقعة. تعود التحليلات اليومية مع أول قراءة بعد إعادة الفتح.",
			emptyTitle: "لا توجد قراءات اليوم بعد",
			emptyDescription: "سيظهر مخطط اليوم عند توفر القراءات.",
			reportsEyebrow: "التقارير",
			reportsTitle: "أوقات الذروة والاتجاه",
			reportsDescription:
				"كيف يمتلئ الأسبوع فعلياً، بحسب اليوم والساعة بتوقيت الصالة",
			windowLine: "26 أغسطس - 22 سبتمبر 2026 · 28 يوم عمل",
			rangeLegend: "نطاق التقرير",
			rangeHint: "حتى 31 يوماً",
			start: "البداية",
			end: "النهاية",
			presets: "فترات سريعة",
			last7: "آخر 7 أيام",
			last28: "آخر 28 يوماً",
			last31: "آخر 31 يوماً",
			apply: "تطبيق",
			applied: "تم تطبيق فترة التقرير",
			heatmapTitle: "الإشغال حسب اليوم والساعة",
			heatmapDescription: "الزحمة المعتادة في كل ساعة من أيام العمل",
			heatmapRegion: "خريطة اليوم مقابل الساعة",
			heatmapHint: "اختر خانة لقراءة أرقامها. تنقل بين الخانات بمفاتيح الأسهم.",
			legendQuiet: "أهدأ",
			legendBusy: "أزحم",
			legendOpenEmpty: "مفتوحة وفارغة",
			legendClosed: "مغلقة",
			legendNoData: "لا توجد بيانات",
			weekdayAxis: "اليوم",
			closedUntil: (t) => `مغلقة حتى ${t}`,
			selectedHour: "الساعة المختارة",
			selAverage: "متوسط الازدحام",
			selObserved: "دقائق العمل التي توفرت فيها قراءات",
			selSamples: "عدد الأيام التي توفرت فيها قراءات",
			selClosed: "لم تكن الصالة مفتوحة في هذه الساعة.",
			selMissing: "لم يُسجَّل أي تاريخ لهذه الساعة.",
			selZero: "مفتوحة وفارغة: كانت الصالة مفتوحة ولم يُحتسب أحد.",
			stateValue: "مرصودة",
			stateZero: "مفتوحة وفارغة",
			stateClosed: "مغلقة",
			stateMissing: "لا توجد بيانات",
			hourlySummary: "تفاصيل الساعات",
			hourlyRegion: "أرقام اليوم مقابل الساعة",
			colWeekday: "اليوم",
			colHour: "الساعة",
			colAverage: "متوسط الازدحام",
			colObserved: "دقائق العمل التي توفرت فيها قراءات",
			colExpected: "دقائق العمل المجدولة",
			colSamples: "عدد الأيام التي توفرت فيها قراءات",
			comparisonTitle: "المقارنة الأسبوعية",
			comparisonDescription: "آخر أسبوعين مكتملين",
			metric: "المؤشر",
			latestWeek: "الأسبوع الأخير",
			weekBefore: "الأسبوع السابق",
			latestWeekRange: "13-19 سبتمبر",
			weekBeforeRange: "6-12 سبتمبر",
			change: "التغيّر",
			up: "ارتفاع",
			down: "انخفاض",
			flat: "بلا تغيّر",
			pts: "نقطة",
			csvTitle: "نطاق تصدير CSV",
			csvDescription: "تنزيل سجل الإشغال لكل دقيقة خلال الفترة المحددة.",
			csvHint: "366 يوماً كحد أقصى",
			csvExport: "تصدير CSV",
			csvPrivacy:
				"يحمل الملف سجل الإشغال فقط: لا جهاز، ولا حساب، ولا أي شيء عن زائر بعينه.",
			footnote:
				"يُحسب المتوسط على الدقائق التي توفرت فيها قراءات فعلاً، فالانقطاع يخفض تغطية البيانات بدل أن يخفض المتوسط بصمت. وتُستبعد ساعات الإغلاق من كل متوسط بدل احتسابها فارغة. وتغيير أي إعداد اليوم لا يعيد كتابة صورة الشهر الماضي.",
			none: "لا شيء",
			phEyebrow: (n) => `قسم الإدارة ${n}`,
			phDescriptions: {
				access: "رمز الموظفين وحسابات المالكين",
				audit: "إجراءات المالك والموظفين",
				health: "تشغيل جهاز العد والأعطال خلال أيام العمل الأخيرة",
				settings:
					"اضبط السعة ومستويات الازدحام ويوم العمل وساعات الأسبوع. تنطبق التغييرات من الآن ولا تعيد كتابة التقارير السابقة.",
			},
			phTitles: {
				access: "الوصول",
				audit: "سجل النشاط",
				health: "التشغيل والأعطال",
				settings: "الإعدادات",
			},
			phNote:
				"لم يُصمَّم هذا القسم في هذه النظرة الأولى. بقي في مكانه ليكتمل التنقل، وسيتبع لغة «حديد وطباشير» نفسها إن اخترت المضي في هذا التوجه.",
		},
	};

	const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
	const WEEKDAY_NAMES = {
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
	};
	const WEEKDAY_SHORT = {
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
	};

	/* ───────────────────────── State ───────────────────────── */

	const params = new URLSearchParams(location.search);
	const reduceMotion =
		params.get("motion") === "off" ||
		matchMedia("(prefers-reduced-motion: reduce)").matches;
	const state = {
		lang: params.get("lang") === "en" ? "en" : "ar",
		section: SECTIONS.includes(params.get("section"))
			? params.get("section")
			: "daily",
		dayState: DAY_STATES.includes(params.get("state"))
			? params.get("state")
			: "live",
		sel: null,
		pinned: false,
		page: null,
		hm: { d: 1, h: 13 },
		revealed: reduceMotion,
		visited: new Set(),
	};
	if (params.has("select")) {
		const m = Number(params.get("select"));
		if (Number.isInteger(m)) {
			state.sel = m;
			state.pinned = true;
		}
	}
	if (params.has("cell")) {
		const [d, h] = params.get("cell").split(",").map(Number);
		if (Number.isInteger(d) && Number.isInteger(h)) state.hm = { d, h };
	}
	if (reduceMotion) document.documentElement.classList.add("no-motion");

	const t = () => COPY[state.lang];

	/* ───────────────────────── Formatting ───────────────────────── */

	const bdi = (s) => `<bdi>${s}</bdi>`;
	const esc = (s) =>
		String(s).replace(
			/[&<>"]/g,
			(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
		);
	const nf = (n, d = 0) =>
		n.toLocaleString("en-US", {
			minimumFractionDigits: d,
			maximumFractionDigits: d,
		});

	function clock(minuteOfDay, withMinutes = true) {
		const mm = ((minuteOfDay % 1440) + 1440) % 1440;
		const h = Math.floor(mm / 60);
		const m = mm % 60;
		const pm = h >= 12;
		const h12 = h % 12 === 0 ? 12 : h % 12;
		const suffix = state.lang === "ar" ? (pm ? "م" : "ص") : pm ? "PM" : "AM";
		return withMinutes
			? `${h12}:${String(m).padStart(2, "0")} ${suffix}`
			: `${h12} ${suffix}`;
	}
	const at = (i) => clock(OPEN_MIN + i);

	function bandOf(v) {
		if (v <= THRESHOLDS.quiet) return "quiet";
		if (v <= THRESHOLDS.moderate) return "moderate";
		if (v <= THRESHOLDS.busy) return "busy";
		return "packed";
	}
	const BAND_LEVEL = { quiet: 1, moderate: 2, busy: 3, packed: 4 };
	function bandTag(band) {
		const level = BAND_LEVEL[band];
		const bars = [1, 2, 3, 4]
			.map((n) => `<i class="${n <= level ? "on" : ""}"></i>`)
			.join("");
		return `<span class="band"><span class="band__glyph" aria-hidden="true">${bars}</span>${t().bands[band]}</span>`;
	}

	/* ───────────────────────── Synthetic data ───────────────────────── */

	function mulberry32(seed) {
		let a = seed;
		return () => {
			a = (a + 0x6d2b79f5) | 0;
			let r = Math.imul(a ^ (a >>> 15), 1 | a);
			r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
			return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
		};
	}

	// People present is simulated as a count of entrance crossings in and out, one minute at a
	// time, so the line moves in whole-person steps and the entries figure comes from the same run.
	const { day, entriesByMinute } = (() => {
		const rand = mulberry32(20260923);
		const poisson = (lambda) => {
			const limit = Math.exp(-lambda);
			let k = 0;
			let p = 1;
			do {
				k++;
				p *= rand();
			} while (p > limit);
			return k - 1;
		};
		const STAY = 64;
		const g = (h, mu, s, a) => a * Math.exp(-0.5 * ((h - mu) / s) ** 2);
		const target = (m) => {
			const h = m / 60;
			return (
				(3 +
					g(h, 1.4, 0.8, 30) +
					g(h, 7.0, 1.2, 12) +
					g(h, 12.2, 1.3, 42) +
					g(h, 14.2, 1.8, 18)) *
				(1 - Math.exp(-Math.max(0, m - ZERO_UNTIL) / 25))
			);
		};
		const values = new Array(DAY_LEN).fill(null);
		const entries = new Array(DAY_LEN).fill(0);
		let occ = 0;
		for (let m = 0; m <= NOW; m++) {
			if (m <= ZERO_UNTIL) {
				values[m] = 0;
				continue;
			}
			const now = target(m);
			const lambdaIn = Math.max(0, now / STAY + (target(m + 1) - now));
			const ins = poisson(lambdaIn);
			let outs = 0;
			for (let i = 0; i < occ; i++) if (rand() < 1 / STAY) outs++;
			occ = Math.max(0, occ + ins - outs);
			values[m] = occ;
			entries[m] = ins;
		}
		for (let m = GAP[0]; m <= GAP[1]; m++) {
			values[m] = null;
			entries[m] = 0;
		}
		return { day: values, entriesByMinute: entries };
	})();

	function entriesUpTo(last) {
		let total = 0;
		const byHour = new Map();
		for (let m = 0; m <= last; m++) {
			total += entriesByMinute[m];
			const hour = Math.floor((OPEN_MIN + m) / 60);
			byHour.set(hour, (byHour.get(hour) ?? 0) + entriesByMinute[m]);
		}
		let busiest = 0;
		let most = -1;
		for (const [hour, n] of byHour) {
			if (n > most) {
				most = n;
				busiest = hour;
			}
		}
		return { total, busiest };
	}

	function daySummary(last) {
		let sum = 0;
		let count = 0;
		let peak = -1;
		let peakAt = 0;
		for (let m = 0; m <= last; m++) {
			const v = day[m];
			if (v == null) continue;
			sum += v;
			count++;
			if (v > peak) {
				peak = v;
				peakAt = m;
			}
		}
		return { avg: sum / count, count, peak, peakAt, latest: day[last] };
	}

	const reports = (() => {
		const rand = mulberry32(8260926);
		const g = (h, mu, s, a) => a * Math.exp(-0.5 * ((h - mu) / s) ** 2);
		const factor = {
			sun: 1.04,
			mon: 1.12,
			tue: 1.0,
			wed: 1.04,
			thu: 0.86,
			fri: 0.94,
			sat: 0.92,
		};
		const rows = WEEKDAYS.map((wd) =>
			Array.from({ length: 19 }, (_, idx) => {
				const hc = idx + 0.5;
				if (wd === "fri" && idx < 8)
					return { kind: "closed", avg: null, observed: 0, expected: 0, samples: 0 };
				if (wd === "sat" && idx === 0)
					return { kind: "zero", avg: 0, observed: 240, expected: 240, samples: 4 };
				if (wd === "tue" && idx === 4)
					return { kind: "missing", avg: null, observed: 0, expected: 240, samples: 0 };
				let base =
					4 + g(hc, 1.4, 0.9, 22) + g(hc, 7, 1.3, 9) + g(hc, 13, 1.7, 43) + g(hc, 15.6, 1.8, 12);
				if (wd === "fri") base = 6 + g(hc, 15.2, 1.9, 44);
				const avg = Math.max(0.6, base * factor[wd] + (rand() - 0.5) * 3);
				let observed = 240 - Math.floor(rand() * 3) * 4;
				if (wd === "wed" && idx === 8) observed = 212;
				return {
					kind: "value",
					avg: Math.round(avg * 10) / 10,
					observed,
					expected: 240,
					samples: 4,
				};
			}),
		);
		let max = 0;
		for (const row of rows) for (const c of row) if (c.avg != null) max = Math.max(max, c.avg);
		return { rows, scale: Math.ceil(max / 10) * 10 };
	})();

	const WEEK = {
		latest: { avg: 31.4, entries: 2316, coverage: 98.6 },
		prior: { avg: 29.0, entries: 2187, coverage: 97.9 },
	};

	/* ───────────────────────── Icons ───────────────────────── */

	const ICON_OUT = `<svg class="flip" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M8 4H4v12h4M12 6l4 4-4 4M16 10H7"/></svg>`;
	const ICON_LOCK = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="9" width="12" height="8"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>`;

	/* ───────────────────────── Shell ───────────────────────── */

	const app = document.getElementById("app");

	function renderShell() {
		const c = t();
		const tabs = SECTIONS.map((s, i) => {
			const selected = s === state.section;
			return `<button type="button" role="tab" class="tab" id="tab-${s}" aria-controls="panel-${s}" aria-selected="${selected}" tabindex="${selected ? 0 : -1}" data-section="${s}"><span class="tab__num" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="tab__label">${c.sections[s]}</span></button>`;
		}).join("");
		const panels = SECTIONS.map(
			(s) =>
				`<section class="page" role="tabpanel" id="panel-${s}" aria-labelledby="tab-${s}" tabindex="-1" ${s === state.section ? "" : "hidden"}></section>`,
		).join("");
		app.innerHTML = `
			<a class="skip" href="#main">${c.skip}</a>
			<header class="mast">
				<div class="mast__in">
					<a class="brand" href="#" data-noop aria-label="FITWAY · ${c.monitoring}"><span class="brand__plate" aria-hidden="true"></span><span>FITWAY</span></a>
					<nav class="appnav" aria-label="${c.appNav}">
						<a href="#" data-noop title="${c.noop}">${c.monitoring}</a>
						<a href="?section=${state.section}&amp;lang=${state.lang}" aria-current="page">${c.management}</a>
					</nav>
					<div class="mast__end">
						<button type="button" class="mbtn" id="lang-toggle" aria-label="${c.langLabel}" lang="${state.lang === "ar" ? "en" : "ar"}"><bdi>${c.langText}</bdi></button>
						<button type="button" class="mbtn mbtn--out" id="sign-out" title="${c.signOut}" data-noop>${ICON_OUT}<span class="mbtn__txt">${c.signOut}</span></button>
					</div>
				</div>
			</header>
			<nav class="index" aria-label="${c.group}">
				<div class="index__in" role="tablist" aria-label="${c.group}">${tabs}</div>
			</nav>
			<main id="main" tabindex="-1">${panels}</main>`;
		renderSection(false);
	}

	function renderSection(animate) {
		const panel = document.getElementById(`panel-${state.section}`);
		for (const p of document.querySelectorAll(".page")) p.hidden = p !== panel;
		if (state.section === "daily") renderDaily(panel);
		else if (state.section === "history") renderReports(panel);
		else renderPlaceholder(panel, state.section);
		if (animate && !reduceMotion) {
			panel.classList.remove("is-entering");
			void panel.offsetWidth;
			panel.classList.add("is-entering");
		}
		state.visited.add(state.section);
	}

	function syncUrl() {
		const next = new URLSearchParams(location.search);
		next.set("lang", state.lang);
		next.set("section", state.section);
		history.replaceState(null, "", `?${next.toString()}`);
	}

	function selectSection(section, focusTab) {
		if (section === state.section) return;
		state.section = section;
		for (const tab of document.querySelectorAll('[role="tab"]')) {
			const on = tab.dataset.section === section;
			tab.setAttribute("aria-selected", String(on));
			tab.tabIndex = on ? 0 : -1;
			if (on && focusTab) tab.focus();
		}
		const current = document.querySelector('.appnav [aria-current="page"]');
		if (current) current.setAttribute("href", `?section=${section}&lang=${state.lang}`);
		renderSection(true);
		syncUrl();
	}

	app.addEventListener("click", (event) => {
		const noop = event.target.closest("[data-noop]");
		if (noop) {
			event.preventDefault();
			return;
		}
		const tab = event.target.closest('[role="tab"]');
		if (tab) {
			selectSection(tab.dataset.section, false);
			return;
		}
		if (event.target.closest("#lang-toggle")) {
			state.lang = state.lang === "ar" ? "en" : "ar";
			applyLang();
			renderShell();
			syncUrl();
			document.getElementById("lang-toggle")?.focus();
		}
	});

	app.addEventListener("keydown", (event) => {
		const tab = event.target.closest('[role="tab"]');
		if (!tab) return;
		const rtl = state.lang === "ar";
		const i = SECTIONS.indexOf(tab.dataset.section);
		let next = null;
		if (event.key === "ArrowRight") next = rtl ? i - 1 : i + 1;
		else if (event.key === "ArrowLeft") next = rtl ? i + 1 : i - 1;
		else if (event.key === "Home") next = 0;
		else if (event.key === "End") next = SECTIONS.length - 1;
		if (next === null) return;
		event.preventDefault();
		next = (next + SECTIONS.length) % SECTIONS.length;
		selectSection(SECTIONS[next], true);
	});

	function applyLang() {
		document.documentElement.lang = state.lang;
		document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
	}

	/* ───────────────────────── Daily ───────────────────────── */

	function dailyStatus() {
		const c = t();
		if (state.dayState === "delayed")
			return `<div class="status status--delayed"><span class="status__sig"><span class="status__mark" aria-hidden="true"></span>${c.delayed}</span><span class="status__time">${c.noReadingSince(bdi(at(DELAYED_LAST)))}</span></div>`;
		if (state.dayState === "closed")
			return `<div class="status status--closed"><span class="status__sig"><span class="status__mark" aria-hidden="true"></span>${c.closedToday}</span></div>`;
		if (state.dayState === "empty")
			return `<div class="status status--closed"><span class="status__sig"><span class="status__mark" aria-hidden="true"></span>${c.noReadingsYet}</span></div>`;
		if (state.dayState !== "live") return "";
		return `<div class="status"><span class="status__sig"><span class="status__mark" aria-hidden="true"></span>${c.live}</span><span class="status__time">${c.updated(bdi(at(NOW)))}</span></div>`;
	}

	function dailyHead() {
		const c = t();
		return `
			<header class="phead">
				<div>
					<p class="eyebrow"><span>${c.eyebrow} · ${c.businessDay}</span><span class="tag">${c.concept}</span></p>
					<h1 class="h1">${c.dayTitle}</h1>
					<p class="lede"><span>${c.hours.replace(/(\d{1,2}:\d{2} (?:AM|PM|ص|م))/g, "<bdi>$1</bdi>")}</span><span>${c.gymTime}</span></p>
				</div>
				${dailyStatus()}
			</header>`;
	}

	function renderDaily(panel) {
		const c = t();
		if (state.dayState === "loading") {
			panel.setAttribute("aria-busy", "true");
			panel.innerHTML = `${dailyHead()}
				<p class="visually-hidden" role="status">${c.loading}</p>
				<div class="board" aria-hidden="true">${[0, 1, 2, 3]
					.map(
						() =>
							`<div class="fig"><span class="skel" style="width:40%;height:12px"></span><span class="skel" style="width:60%;height:64px;margin-top:14px"></span><span class="skel skel--dim" style="width:80%;height:12px;margin-top:12px"></span></div>`,
					)
					.join("")}</div>
				<div class="chart" aria-hidden="true"><span class="skel" style="width:30%;height:18px"></span><span class="skel skel--dim" style="width:100%;height:340px;margin-top:14px"></span></div>`;
			return;
		}
		panel.removeAttribute("aria-busy");
		if (state.dayState === "error") {
			panel.innerHTML = `${dailyHead()}
				<div class="notice" role="alert"><span class="notice__mark" aria-hidden="true">!</span><div><h2>${c.errorTitle}</h2><p>${c.errorDescription}</p><button type="button" class="btn btn--solid" id="retry">${c.retry}</button></div></div>`;
			panel.querySelector("#retry").addEventListener("click", () => {
				state.dayState = "live";
				renderSection(false);
				panel.querySelector(".plot")?.focus();
			});
			return;
		}
		if (state.dayState === "closed" || state.dayState === "empty") {
			const closed = state.dayState === "closed";
			panel.innerHTML = `${dailyHead()}
				<div class="notice"><span class="notice__mark" aria-hidden="true">${closed ? "—" : "0"}</span><div><h2>${closed ? c.closedTitle : c.emptyTitle}</h2><p>${closed ? c.closedDescription : c.emptyDescription}</p></div></div>`;
			return;
		}

		const delayed = state.dayState === "delayed";
		const last = delayed ? DELAYED_LAST : NOW;
		const s = daySummary(last);
		const entries = entriesUpTo(last);
		const scheduled = NOW + 1;
		const board = `
			<div class="board" role="group" aria-label="${c.eyebrow}">
				<div class="fig fig--peak">
					<p class="fig__label">${c.peak}</p>
					<p class="fig__value num">${s.peak}</p>
					<p class="fig__cap">${bandTag(bandOf(s.peak))} · ${c.at(bdi(at(s.peakAt)))}</p>
				</div>
				<div class="fig">
					<p class="fig__label">${c.average}</p>
					<p class="fig__value num">${nf(s.avg, 1)}</p>
					<p class="fig__cap">${c.across(bdi(nf(s.count)))}</p>
				</div>
				<div class="fig">
					<p class="fig__label">${c.crossings}</p>
					<p class="fig__value num">${nf(entries.total)}</p>
					<p class="fig__cap">${c.crossingsNote} <strong>${c.busiestEntry(bdi(clock(entries.busiest * 60, false)))}</strong></p>
				</div>
				<div class="fig">
					<p class="fig__label">${c.coverage}</p>
					<p class="fig__value num">${nf(s.count)} <small>${c.of(bdi(nf(scheduled)))}</small></p>
					<p class="fig__cap">${delayed ? `<strong>${c.asOf(bdi(at(DELAYED_LAST)))}</strong>` : c.coverageCap}</p>
				</div>
			</div>`;
		// Wide screens lead with the figures; phones lead with the day's shape. The DOM follows
		// the visual order in both, so reading order never disagrees with what is seen.
		const narrow = narrowQuery.matches;
		panel.innerHTML = `${dailyHead()}
			${narrow ? "" : board}
			<section class="chart" aria-labelledby="chart-title">
				<div class="chart__head">
					<h2 class="h2" id="chart-title">${c.chartTitle}</h2>
					<ul class="legend">
						<li><span class="sw sw--red" aria-hidden="true"></span>${c.legendPeople}</li>
						<li><span class="sw sw--zero" aria-hidden="true"></span>${c.legendZero}</li>
						<li><span class="sw sw--missing" aria-hidden="true"></span>${c.legendMissing}</li>
						${delayed ? `<li><span class="sw sw--wait" aria-hidden="true"></span>${c.legendWait}</li>` : ""}
						<li><span class="sw sw--ahead" aria-hidden="true"></span>${c.legendAhead}</li>
					</ul>
				</div>
				<div class="plot" role="slider" tabindex="0" aria-label="${c.chartLabel}" aria-describedby="chart-hint" aria-valuemin="0" aria-valuemax="${last}"></div>
				<div class="chart__foot">
					<span aria-live="polite" id="chart-live"></span>
					<span class="hint" id="chart-hint">${c.chartHint}</span>
				</div>
			</section>
			${narrow ? board : ""}
			<details class="disc" id="minutes">
				<summary>${c.tableSummary}</summary>
				<div class="disc__body"></div>
			</details>`;

		const plot = panel.querySelector(".plot");
		const ctx = { last, delayed, summary: s };
		drawChart(plot, ctx);
		bindChart(plot, ctx);
		updateSelection(plot, ctx, false);
		const details = panel.querySelector("#minutes");
		details.addEventListener("toggle", () => {
			if (details.open) renderMinutes(details, ctx);
		});
	}

	function geometry(plot) {
		const W = plot.clientWidth;
		const H = plot.clientHeight;
		const mobile = W < 640;
		const rtl = state.lang === "ar";
		const padS = mobile ? 26 : 40;
		const padE = mobile ? 6 : 132;
		const padT = mobile ? 38 : 44;
		const padB = mobile ? 38 : 42;
		const plotW = W - padS - padE;
		const plotH = H - padT - padB;
		const X = (m) => {
			const x = padS + (m / DAY_LEN) * plotW;
			return rtl ? W - x : x;
		};
		const Y = (v) => padT + plotH - (v / YMAX) * plotH;
		const invert = (px) => {
			const x = rtl ? W - px : px;
			return Math.floor(((x - padS) / plotW) * DAY_LEN);
		};
		return { W, H, mobile, rtl, padS, padE, padT, padB, plotW, plotH, X, Y, invert };
	}

	function runs(last) {
		const out = [];
		let start = null;
		for (let m = 0; m <= last + 1; m++) {
			const has = m <= last && day[m] != null;
			if (has && start === null) start = m;
			if (!has && start !== null) {
				out.push([start, m - 1]);
				start = null;
			}
		}
		return out;
	}

	function drawChart(plot, ctx) {
		const c = t();
		const G = geometry(plot);
		const { W, H, X, Y, padT, plotH, mobile, rtl } = G;
		const base = Y(0);
		const endX = X(DAY_LEN);
		const lastX = X(ctx.last + 1);
		const nowX = X(NOW + 1);
		const L = (a, b) => Math.min(a, b);
		const Wd = (a, b) => Math.abs(b - a);

		// Silhouette: exact per-minute steps, no interpolation.
		let mass = "";
		for (const [a, b] of runs(ctx.last)) {
			let d = `M${X(a).toFixed(2)} ${base.toFixed(2)}`;
			for (let m = a; m <= b; m++) {
				d += `V${Y(day[m]).toFixed(2)}H${X(m + 1).toFixed(2)}`;
			}
			d += `V${base.toFixed(2)}Z`;
			mass += `<path d="${d}" fill="var(--red)"/>`;
		}

		const bandLines = Object.values(THRESHOLDS)
			.map(
				(v) =>
					`<line x1="${X(0)}" x2="${endX}" y1="${Y(v)}" y2="${Y(v)}" stroke="#111113" stroke-opacity=".38" stroke-dasharray="3 4"/>`,
			)
			.join("");
		const yTicks = [0, ...Object.values(THRESHOLDS)]
			.map((v) => {
				const x = rtl ? W - G.padS + 8 : G.padS - 8;
				return `<text x="${x}" y="${Y(v) + 4}" text-anchor="end" class="num">${v}</text>`;
			})
			.join("");

		const tickEvery = mobile ? 240 : 120;
		let xTicks = "";
		for (let m = 0; m <= DAY_LEN; m += tickEvery) {
			const anchor = m === 0 ? "start" : m >= DAY_LEN ? "end" : "middle";
			xTicks += `<line x1="${X(m)}" x2="${X(m)}" y1="${base + 12}" y2="${base + 16}" stroke="#111113" stroke-opacity=".5"/>`;
			xTicks += `<text x="${X(m)}" y="${base + 32}" text-anchor="${anchor}">${clock(OPEN_MIN + m, false)}</text>`;
		}
		if (!mobile) {
			xTicks += `<text x="${endX}" y="${base + 32}" text-anchor="end">${clock(OPEN_MIN + DAY_LEN, false)}</text>`;
		} else {
			xTicks += `<text x="${endX}" y="${base + 32}" text-anchor="end">${clock(OPEN_MIN + DAY_LEN, false)}</text>`;
		}

		// Coverage track under the baseline: recorded (iron), missing (hatch), waiting (amber), ahead (dots).
		const trackY = base + 4;
		let track = "";
		for (const [a, b] of runs(ctx.last)) {
			track += `<rect x="${L(X(a), X(b + 1))}" y="${trackY}" width="${Wd(X(a), X(b + 1))}" height="5" fill="#111113"/>`;
		}
		track += `<rect x="${L(X(GAP[0]), X(GAP[1] + 1))}" y="${trackY}" width="${Wd(X(GAP[0]), X(GAP[1] + 1))}" height="5" fill="url(#ic-hatch)"/>`;
		if (ctx.delayed) {
			track += `<rect x="${L(lastX, nowX)}" y="${trackY}" width="${Wd(lastX, nowX)}" height="5" fill="url(#ic-hatch-amber)"/>`;
		}
		track += `<rect x="${L(nowX, endX)}" y="${trackY}" width="${Wd(nowX, endX)}" height="5" fill="url(#ic-dots)"/>`;

		const zeroBar = `<rect x="${L(X(0), X(ZERO_UNTIL + 1))}" y="${base - 3}" width="${Wd(X(0), X(ZERO_UNTIL + 1))}" height="3" fill="#111113"/>`;

		const gapRect = `<rect x="${L(X(GAP[0]), X(GAP[1] + 1))}" y="${padT}" width="${Wd(X(GAP[0]), X(GAP[1] + 1))}" height="${plotH}" fill="url(#ic-hatch)"/>`;
		const waitRect = ctx.delayed
			? `<rect x="${L(lastX, nowX)}" y="${padT}" width="${Wd(lastX, nowX)}" height="${plotH}" fill="url(#ic-hatch-amber)"/>`
			: "";
		const aheadRect = `<rect x="${L(nowX, endX)}" y="${padT}" width="${Wd(nowX, endX)}" height="${plotH}" fill="#e3ded6" fill-opacity=".62"/>`;

		const baseline = `<line x1="${X(0)}" x2="${nowX}" y1="${base}" y2="${base}" stroke="#111113" stroke-width="1.5"/>`;
		const nowRule = `<line x1="${nowX}" x2="${nowX}" y1="${padT - 14}" y2="${base + 10}" stroke="#111113" stroke-width="2"/>`;
		const peakX = (X(ctx.summary.peakAt) + X(ctx.summary.peakAt + 1)) / 2;
		const peakMark = `<path d="M${peakX - 5} ${Y(ctx.summary.peak) - 12}h10l-5 7z" fill="#111113"/>`;
		const lastTopX = (X(ctx.last) + X(ctx.last + 1)) / 2;
		const latestMark = ctx.delayed
			? ""
			: `<rect x="${lastTopX - 4}" y="${Y(ctx.summary.latest) - 4}" width="8" height="8" fill="#111113" stroke="#f2efea" stroke-width="2"/>`;

		const svgBase = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
			<defs>
				<pattern id="ic-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#111113" stroke-opacity=".42" stroke-width="1.6"/></pattern>
				<pattern id="ic-hatch-amber" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#f7efdc"/><line x1="0" y1="0" x2="0" y2="6" stroke="#a87000" stroke-opacity=".75" stroke-width="1.6"/></pattern>
				<pattern id="ic-dots" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#e3ded6"/><circle cx="2.5" cy="2.5" r="1" fill="#111113" fill-opacity=".5"/></pattern>
			</defs>
			${aheadRect}${waitRect}${gapRect}
			${bandLines}
			${yTicks}${xTicks}
			${track}
		</svg>`;
		const svgMass = `<svg class="mass" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${mass}${zeroBar}</svg>`;
		const svgTop = `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${baseline}${nowRule}${peakMark}${latestMark}<line class="sel-line" x1="0" x2="0" y1="${padT}" y2="${base}" stroke="#111113" stroke-width="1" visibility="hidden"/><rect class="sel-dot" width="9" height="9" fill="#f2efea" stroke="#111113" stroke-width="2" visibility="hidden"/></svg>`;

		// HTML overlays for labels, so bidi and text metrics stay native.
		const pos = (x, y, anchor) => {
			// anchor: "start" extends toward later time; "end" toward earlier time; "mid" centered.
			const towardLater = rtl ? "translateX(-100%)" : "";
			const towardEarlier = rtl ? "" : "translateX(-100%)";
			const tx =
				anchor === "mid"
					? "translateX(-50%)"
					: anchor === "start"
						? towardLater
						: towardEarlier;
			return `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;transform:${tx}`;
		};
		let ov = "";
		ov += `<div class="ov ov--flag" style="${pos(nowX, 2, "start")}">${c.nowFlag(bdi(at(NOW)))}</div>`;
		ov += `<div class="ov ov--peak ov--late" style="${pos(peakX - (rtl ? -8 : 8), Y(ctx.summary.peak) - 34, "end")}">${c.peakFlag(bdi(ctx.summary.peak), bdi(at(ctx.summary.peakAt)))}</div>`;
		if (!ctx.delayed) {
			ov += `<div class="ov ov--latest ov--late" style="${pos(nowX + (rtl ? -8 : 8), Y(ctx.summary.latest) - 10, "start")}">${bdi(c.approx(ctx.summary.latest))}</div>`;
		} else {
			ov += `<div class="ov ov--wait" style="${pos(nowX + (rtl ? -8 : 8), padT + 10, "start")}">${c.waitFlag(bdi(at(DELAYED_LAST)))}</div>`;
		}
		const gapMid = (X(GAP[0]) + X(GAP[1] + 1)) / 2;
		// Phones label the gap inside its own empty column, clear of the peak label above it.
		const gapY = mobile ? Y(40) : padT - 22;
		ov += `<div class="ov ov--note" style="${pos(gapMid, gapY, "mid")}">${c.gapFlag(bdi(GAP[1] - GAP[0] + 1))}</div>`;
		const aheadMid = (nowX + endX) / 2;
		if (!mobile) {
			ov += `<div class="ov ov--note" style="${pos(aheadMid, base - 30, "mid")}">${c.aheadFlag(bdi(clock(OPEN_MIN + DAY_LEN)))}</div>`;
		}
		// Crowd-level zones: margin on desktop, inside the still-ahead region on mobile.
		const zones = [
			["quiet", 0, THRESHOLDS.quiet],
			["moderate", THRESHOLDS.quiet, THRESHOLDS.moderate],
			["busy", THRESHOLDS.moderate, THRESHOLDS.busy],
			["packed", THRESHOLDS.busy, YMAX],
		];
		for (const [band, lo, hi] of zones) {
			// Phones hang each name from the top of its zone, leaving the zone's middle to the latest value.
			const y = mobile ? Y(hi) + 3 : (Y(lo) + Y(hi)) / 2 - 9;
			const x = mobile ? endX + (rtl ? 4 : -4) : endX + (rtl ? -14 : 14);
			const anchor = mobile ? "end" : "start";
			ov += `<div class="ov ov--zone" style="${pos(x, y, anchor)}">${c.bands[band]}</div>`;
		}

		plot.innerHTML = `${svgBase}${svgMass}${svgTop}${ov}<div class="readout" hidden></div>`;
		plot._geo = G;
		if (!state.revealed) {
			plot.classList.add("is-revealing");
			state.revealed = true;
			setTimeout(() => plot.classList.remove("is-revealing"), 1100);
		}
	}

	function describeMinute(m, ctx) {
		const c = t();
		if (m >= GAP[0] && m <= GAP[1]) {
			return {
				kind: "gap",
				time: `${bdi(at(GAP[0]))} - ${bdi(at(GAP[1]))}`,
				big: c.missingState,
				meta: c.minutesWord(GAP[1] - GAP[0] + 1),
				text: `${at(GAP[0])} - ${at(GAP[1])}, ${c.missingState}, ${c.minutesWord(GAP[1] - GAP[0] + 1)}`,
			};
		}
		const v = day[m];
		const band = bandOf(v);
		const src = ctx.delayed ? c.lastKnown : c.sourceLive;
		if (v === 0) {
			return {
				kind: "zero",
				time: bdi(at(m)),
				big: bdi("0"),
				meta: `${c.zeroState} · ${c.sourceLive}`,
				text: `${at(m)}, 0, ${c.zeroState}`,
			};
		}
		return {
			kind: "value",
			time: bdi(at(m)),
			big: bdi(c.approx(v)),
			meta: `${c.bands[band]} · ${c.sourceLive}`,
			text: `${at(m)}, ${c.present(v)}, ${c.bands[band]}`,
			src,
		};
	}

	function updateSelection(plot, ctx, announce) {
		const c = t();
		const G = plot._geo;
		const live = document.getElementById("chart-live");
		const line = plot.querySelector(".sel-line");
		const dot = plot.querySelector(".sel-dot");
		const box = plot.querySelector(".readout");
		const m = state.sel;
		if (m == null || m < 0 || m > ctx.last) {
			line.setAttribute("visibility", "hidden");
			dot.setAttribute("visibility", "hidden");
			box.hidden = true;
			const d = describeMinute(ctx.last, ctx);
			plot.setAttribute("aria-valuenow", String(ctx.last));
			plot.setAttribute("aria-valuetext", d.text);
			live.innerHTML = `${ctx.delayed ? c.lastKnown : c.latestReading}: ${d.time} · ${d.big} · ${d.meta.split(" · ")[0]}`;
			return;
		}
		const d = describeMinute(m, ctx);
		const inGap = d.kind === "gap";
		const x = inGap
			? (G.X(GAP[0]) + G.X(GAP[1] + 1)) / 2
			: (G.X(m) + G.X(m + 1)) / 2;
		line.setAttribute("x1", x);
		line.setAttribute("x2", x);
		line.setAttribute("visibility", "visible");
		if (!inGap) {
			dot.setAttribute("x", x - 4.5);
			dot.setAttribute("y", G.Y(day[m]) - 4.5);
			dot.setAttribute("visibility", "visible");
		} else {
			dot.setAttribute("visibility", "hidden");
		}
		box.hidden = false;
		box.innerHTML = `<span>${d.time}</span><strong>${d.big}</strong><span class="readout__meta">${d.meta}</span>`;
		const bw = box.offsetWidth;
		const room = G.rtl ? x : G.W - x;
		const later = room > bw + 16;
		let left = later === !G.rtl ? x + 10 : x - 10 - bw;
		left = Math.max(0, Math.min(G.W - bw, left));
		box.style.left = `${left}px`;
		box.style.top = `${G.padT + 4}px`;
		plot.setAttribute("aria-valuenow", String(m));
		plot.setAttribute("aria-valuetext", d.text);
		if (announce) live.innerHTML = `${c.selected}: ${d.time} · ${d.big} · ${d.meta}`;
		else live.innerHTML = `${c.selected}: ${d.time} · ${d.big} · ${d.meta}`;
	}

	function bindChart(plot, ctx) {
		const pick = (event) => {
			const rect = plot.getBoundingClientRect();
			let m = plot._geo.invert(event.clientX - rect.left);
			if (m < 0) m = 0;
			if (m > ctx.last) m = ctx.last;
			return m;
		};
		plot.addEventListener("pointermove", (event) => {
			if (event.pointerType !== "mouse" || state.pinned) return;
			state.sel = pick(event);
			updateSelection(plot, ctx, false);
		});
		plot.addEventListener("pointerleave", (event) => {
			if (event.pointerType !== "mouse" || state.pinned) return;
			state.sel = null;
			updateSelection(plot, ctx, false);
		});
		plot.addEventListener("pointerdown", (event) => {
			state.sel = pick(event);
			state.pinned = true;
			updateSelection(plot, ctx, true);
		});
		plot.addEventListener("keydown", (event) => {
			const rtl = state.lang === "ar";
			let m = state.sel ?? ctx.last;
			const step = event.shiftKey ? 10 : 1;
			const forward = rtl ? "ArrowLeft" : "ArrowRight";
			const back = rtl ? "ArrowRight" : "ArrowLeft";
			if (event.key === forward || event.key === "ArrowUp") m += step;
			else if (event.key === back || event.key === "ArrowDown") m -= step;
			else if (event.key === "PageUp") m += 60;
			else if (event.key === "PageDown") m -= 60;
			else if (event.key === "Home") m = 0;
			else if (event.key === "End") m = ctx.last;
			else if (event.key === "Escape") {
				state.sel = null;
				state.pinned = false;
				updateSelection(plot, ctx, true);
				return;
			} else return;
			event.preventDefault();
			// A missing stretch is one stop, never a run of fake points.
			if (m >= GAP[0] && m <= GAP[1] && state.sel != null && !(state.sel >= GAP[0] && state.sel <= GAP[1])) {
				m = GAP[0];
			} else if (state.sel != null && state.sel >= GAP[0] && state.sel <= GAP[1] && m >= GAP[0] && m <= GAP[1]) {
				m = m > state.sel ? GAP[1] + 1 : GAP[0] - 1;
			}
			state.sel = Math.max(0, Math.min(ctx.last, m));
			state.pinned = true;
			updateSelection(plot, ctx, true);
		});
		let raf = 0;
		const ro = new ResizeObserver(() => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				if (!plot.isConnected) return ro.disconnect();
				if (plot._geo && Math.abs(plot._geo.W - plot.clientWidth) < 1) return;
				drawChart(plot, ctx);
				updateSelection(plot, ctx, false);
			});
		});
		ro.observe(plot);
	}

	function renderMinutes(details, ctx) {
		const c = t();
		const body = details.querySelector(".disc__body");
		const pages = Math.floor(ctx.last / PAGE) + 1;
		if (state.page == null)
			state.page = Math.floor((state.sel ?? ctx.last) / PAGE);
		const p = Math.max(0, Math.min(pages - 1, state.page));
		const from = p * PAGE;
		const to = Math.min(ctx.last, from + PAGE - 1);
		let rows = "";
		for (let m = from; m <= to; m++) {
			const v = day[m];
			const missing = v == null;
			const stateLabel = missing ? c.missingState : v === 0 ? c.zeroState : c.observed;
			rows += `<tr><td>${bdi(at(m))}</td><td>${stateLabel}</td><td class="num">${missing ? "—" : bdi(c.approx(v))}</td><td>${missing ? "—" : c.bands[bandOf(v)]}</td><td>${missing ? "—" : c.sourceLive}</td></tr>`;
		}
		body.innerHTML = `
			<div class="pager">
				<button type="button" class="btn" data-page="-1" ${p === 0 ? "disabled" : ""}>${c.prevPage}</button>
				<button type="button" class="btn" data-page="1" ${p >= pages - 1 ? "disabled" : ""}>${c.nextPage}</button>
				<span aria-live="polite">${c.tableCaption(bdi(at(from)), bdi(at(to)))}</span>
			</div>
			<div class="scroller" role="region" aria-label="${c.tableRegion}" tabindex="0">
				<table class="tbl"><thead><tr><th scope="col">${c.colTime}</th><th scope="col">${c.colState}</th><th scope="col">${c.colCount}</th><th scope="col">${c.colBand}</th><th scope="col">${c.colSource}</th></tr></thead><tbody>${rows}</tbody></table>
			</div>`;
		for (const btn of body.querySelectorAll("[data-page]")) {
			btn.addEventListener("click", () => {
				state.page = p + Number(btn.dataset.page);
				const dir = btn.dataset.page;
				renderMinutes(details, ctx);
				const again = body.querySelector(`[data-page="${dir}"]`);
				(again && !again.disabled ? again : body.querySelector("[data-page]:not([disabled])"))?.focus();
			});
		}
	}

	/* ───────────────────────── Reports ───────────────────────── */

	function cellText(d, h) {
		const c = t();
		const cell = reports.rows[d][h];
		const where = `${WEEKDAY_NAMES[state.lang][WEEKDAYS[d]]}, ${clock((6 + h) * 60, false)} - ${clock((7 + h) * 60, false)}`;
		if (cell.kind === "closed") return `${where}: ${c.stateClosed}`;
		if (cell.kind === "missing") return `${where}: ${c.stateMissing}`;
		if (cell.kind === "zero") return `${where}: ${c.stateZero}, 0`;
		return `${where}: ${c.selAverage} ${nf(cell.avg, 1)}`;
	}

	function renderReports(panel) {
		const c = t();
		const narrow = narrowQuery.matches;
		panel.innerHTML = `
			<header class="phead">
				<div>
					<p class="eyebrow"><span>${c.reportsEyebrow}</span><span class="tag">${c.concept}</span></p>
					<h1 class="h1">${c.reportsTitle}</h1>
					<p class="lede"><span>${c.reportsDescription}</span></p>
				</div>
				<div class="status"><span class="status__text">${c.windowLine}</span><span class="status__time">${c.gymTime}</span></div>
			</header>
			<div class="range" role="group" aria-labelledby="range-label">
				<p class="range__label" id="range-label">${c.rangeLegend}<small>${c.rangeHint}</small></p>
				<div class="field"><label for="r-start">${c.start}</label><input id="r-start" dir="ltr" inputmode="numeric" value="2026-08-26" /></div>
				<div class="field"><label for="r-end">${c.end}</label><input id="r-end" dir="ltr" inputmode="numeric" value="2026-09-22" /></div>
				<div class="presets" role="group" aria-label="${c.presets}">
					<button type="button" class="btn" aria-pressed="false">${c.last7}</button>
					<button type="button" class="btn" aria-pressed="true">${c.last28}</button>
					<button type="button" class="btn" aria-pressed="false">${c.last31}</button>
				</div>
				<div class="range__apply"><span role="status">${c.applied}</span><button type="button" class="btn btn--solid">${c.apply}</button></div>
			</div>
			<section class="hm-block" aria-labelledby="hm-title">
				<div class="hm-head">
					<div>
						<h2 class="h2" id="hm-title">${c.heatmapTitle}</h2>
						<p class="sub">${c.heatmapDescription}</p>
					</div>
					<ul class="hm-legend">
						<li><span>${c.legendQuiet}</span><span class="stair" aria-hidden="true"><i style="height:4px"></i><i style="height:8px"></i><i style="height:12px"></i><i style="height:16px"></i></span><span>${c.legendBusy}</span></li>
						<li><span class="sw sw--zero" aria-hidden="true"></span>${c.legendOpenEmpty}</li>
						<li><span class="sw sw--closed" aria-hidden="true"></span>${c.legendClosed}</li>
						<li><span class="sw sw--missing" aria-hidden="true"></span>${c.legendNoData}</li>
					</ul>
				</div>
				<p class="visually-hidden" id="hm-hint">${c.heatmapHint}</p>
				<div class="hm" role="grid" aria-label="${c.heatmapRegion}" aria-describedby="hm-hint"></div>
				<div class="readbar" aria-live="polite"></div>
			</section>
			<div class="lower">
				${comparisonHtml()}
				${csvHtml()}
			</div>
			<details class="disc" id="hourly">
				<summary>${c.hourlySummary}</summary>
				<div class="disc__body"></div>
			</details>
			<p class="foot">${c.footnote}</p>`;
		const grid = panel.querySelector(".hm");
		drawHeatmap(grid, narrow);
		updateReadbar(panel);
		bindHeatmap(panel, grid);
		const details = panel.querySelector("#hourly");
		details.addEventListener("toggle", () => {
			if (details.open) renderHourly(details);
		});
	}

	function drawHeatmap(grid, transposed) {
		const c = t();
		const names = transposed ? WEEKDAY_SHORT[state.lang] : WEEKDAY_NAMES[state.lang];
		// Every item is placed explicitly, so an overlay label can never push a cell out of its hour.
		const at2 = (row, col) => `grid-row:${row};grid-column:${col}`;
		const cellHtml = (d, h, row, col) => {
			const cell = reports.rows[d][h];
			const sel = d === state.hm.d && h === state.hm.h;
			const v = cell.avg == null ? 0 : cell.avg / reports.scale;
			const bar =
				cell.kind === "value"
					? `<span class="hm__bar" style="--v:${v.toFixed(3)}"></span>`
					: "";
			return `<div role="gridcell" class="hm__cell hm__cell--${cell.kind}" style="${at2(row, col)}" data-d="${d}" data-h="${h}" tabindex="${sel ? 0 : -1}" aria-selected="${sel}" aria-label="${esc(cellText(d, h))}">${bar}</div>`;
		};
		let html = "";
		if (!transposed) {
			grid.style.setProperty("--cols", "19");
			html += `<div role="row" class="hm__row"><span role="columnheader" class="hm__colhead hm__colhead--corner" style="${at2(1, 1)}">${c.weekdayAxis}</span>`;
			for (let h = 0; h < 19; h++)
				html += `<span role="columnheader" class="hm__colhead" style="${at2(1, h + 2)}">${bdi(clock((6 + h) * 60, false))}</span>`;
			html += "</div>";
			for (let d = 0; d < 7; d++) {
				html += `<div role="row" class="hm__row"><span role="rowheader" class="hm__rowhead" style="${at2(d + 2, 1)}">${names[WEEKDAYS[d]]}</span>`;
				for (let h = 0; h < 19; h++) html += cellHtml(d, h, d + 2, h + 2);
				html += "</div>";
			}
			// Friday's closed morning reads as one block, not eight blank cells.
			html += `<span class="hm__span" aria-hidden="true" style="grid-row:7;grid-column:2 / span 8"><span>${c.closedUntil(bdi(clock(14 * 60, false)))}</span></span>`;
		} else {
			grid.style.setProperty("--cols", "7");
			html += `<div role="row" class="hm__row"><span role="columnheader" class="hm__colhead hm__colhead--corner" style="${at2(1, 1)}"><span class="visually-hidden">${c.colHour}</span></span>`;
			for (let d = 0; d < 7; d++)
				html += `<span role="columnheader" class="hm__colhead" style="${at2(1, d + 2)}">${names[WEEKDAYS[d]]}</span>`;
			html += "</div>";
			for (let h = 0; h < 19; h++) {
				html += `<div role="row" class="hm__row"><span role="rowheader" class="hm__rowhead" style="${at2(h + 2, 1)}">${bdi(clock((6 + h) * 60, false))}</span>`;
				for (let d = 0; d < 7; d++) html += cellHtml(d, h, h + 2, d + 2);
				html += "</div>";
			}
		}
		grid.innerHTML = html;
		grid.dataset.transposed = String(transposed);
	}

	function updateReadbar(panel) {
		const c = t();
		const bar = panel.querySelector(".readbar");
		const { d, h } = state.hm;
		const cell = reports.rows[d][h];
		const which = `${WEEKDAY_NAMES[state.lang][WEEKDAYS[d]]} · ${bdi(clock((6 + h) * 60, false))} - ${bdi(clock((7 + h) * 60, false))}`;
		const head = `<div><p class="readbar__label">${c.selectedHour}</p><p class="readbar__which">${which}</p></div>`;
		if (cell.kind === "closed" || cell.kind === "missing") {
			bar.innerHTML = `${head}<p class="readbar__msg">${cell.kind === "closed" ? c.selClosed : c.selMissing}</p>`;
			return;
		}
		const avg = cell.kind === "zero" ? "0" : nf(cell.avg, 1);
		bar.innerHTML = `${head}
			<div><p class="readbar__label">${c.selAverage}</p><p class="readbar__val readbar__val--red">${bdi(avg)}</p></div>
			<div><p class="readbar__label">${c.selObserved}</p><p class="readbar__val">${bdi(nf(cell.observed))} <small>${c.of(bdi(nf(cell.expected)))}</small></p></div>
			<div><p class="readbar__label">${c.selSamples}</p><p class="readbar__val">${bdi(cell.samples)}</p></div>
			${cell.kind === "zero" ? `<p class="readbar__msg">${c.selZero}</p>` : ""}`;
	}

	function bindHeatmap(panel, grid) {
		const choose = (d, h, focus) => {
			state.hm = { d, h };
			for (const el of grid.querySelectorAll('[role="gridcell"]')) {
				const on = Number(el.dataset.d) === d && Number(el.dataset.h) === h;
				el.setAttribute("aria-selected", String(on));
				el.tabIndex = on ? 0 : -1;
				if (on && focus) el.focus();
			}
			updateReadbar(panel);
		};
		grid.addEventListener("click", (event) => {
			const cell = event.target.closest('[role="gridcell"]');
			if (cell) choose(Number(cell.dataset.d), Number(cell.dataset.h), true);
		});
		grid.addEventListener("keydown", (event) => {
			const cell = event.target.closest('[role="gridcell"]');
			if (!cell) return;
			const rtl = state.lang === "ar";
			const tr = grid.dataset.transposed === "true";
			let { d, h } = state.hm;
			const inline = (n) => {
				if (tr) d += n;
				else h += n;
			};
			const block = (n) => {
				if (tr) h += n;
				else d += n;
			};
			if (event.key === "ArrowRight") inline(rtl ? -1 : 1);
			else if (event.key === "ArrowLeft") inline(rtl ? 1 : -1);
			else if (event.key === "ArrowDown") block(1);
			else if (event.key === "ArrowUp") block(-1);
			else if (event.key === "Home") tr ? (d = 0) : (h = 0);
			else if (event.key === "End") tr ? (d = 6) : (h = 18);
			else return;
			event.preventDefault();
			d = Math.max(0, Math.min(6, d));
			h = Math.max(0, Math.min(18, h));
			choose(d, h, true);
		});
	}

	function comparisonHtml() {
		const c = t();
		const row = (label, a, b, fmt, unit, pct) => {
			const max = Math.max(a, b);
			let glyph;
			let word;
			let delta;
			if (pct) {
				const diff = a - b;
				delta = `${diff >= 0 ? "+" : "−"}${nf(Math.abs(diff), 1)} ${c.pts}`;
			} else {
				const diff = ((a - b) / b) * 100;
				delta = `${nf(Math.abs(diff), 1)}%`;
			}
			if (Math.abs(a - b) < 0.05) {
				glyph = "—";
				word = c.flat;
			} else if (a > b) {
				glyph = "▲";
				word = c.up;
			} else {
				glyph = "▼";
				word = c.down;
			}
			return `<tr>
				<th scope="row">${label}</th>
				<td data-label="${c.latestWeek}"><div class="cmp__v"><span class="cmp__num">${bdi(fmt(a))}${unit}</span><span class="cmp__bar" style="--w:${(a / max).toFixed(3)}" aria-hidden="true"></span></div></td>
				<td data-label="${c.weekBefore}"><div class="cmp__v"><span class="cmp__num">${bdi(fmt(b))}${unit}</span><span class="cmp__bar cmp__bar--prior" style="--w:${(b / max).toFixed(3)}" aria-hidden="true"></span></div></td>
				<td class="cmp__chg" data-label="${c.change}"><span class="chg"><span class="chg__glyph" aria-hidden="true">${glyph}</span><span>${word} ${bdi(delta)}</span></span></td>
			</tr>`;
		};
		return `<section class="cmp" aria-labelledby="cmp-title">
			<h2 class="h2" id="cmp-title">${c.comparisonTitle}</h2>
			<p class="sub">${c.comparisonDescription}</p>
			<table class="cmp__tbl">
				<thead><tr><th scope="col">${c.metric}</th><th scope="col">${c.latestWeek}<small>${bdi(c.latestWeekRange)}</small></th><th scope="col">${c.weekBefore}<small>${bdi(c.weekBeforeRange)}</small></th><th scope="col">${c.change}</th></tr></thead>
				<tbody>
					${row(c.average, WEEK.latest.avg, WEEK.prior.avg, (n) => nf(n, 1), "", false)}
					${row(c.crossings, WEEK.latest.entries, WEEK.prior.entries, (n) => nf(n), "", false)}
					${row(c.coverage, WEEK.latest.coverage, WEEK.prior.coverage, (n) => `${nf(n, 1)}%`, "", true)}
				</tbody>
			</table>
		</section>`;
	}

	function csvHtml() {
		const c = t();
		return `<section class="csv" aria-labelledby="csv-title">
			<div>
				<h2 class="h2" id="csv-title">${c.csvTitle}</h2>
				<p class="sub">${c.csvDescription}</p>
			</div>
			<div class="csv__fields">
				<div class="field"><label for="c-start">${c.start}</label><input id="c-start" dir="ltr" inputmode="numeric" value="2026-09-01" /></div>
				<div class="field"><label for="c-end">${c.end}</label><input id="c-end" dir="ltr" inputmode="numeric" value="2026-09-22" /></div>
			</div>
			<p class="sub">${c.csvHint}</p>
			<button type="button" class="btn btn--solid">${c.csvExport}</button>
			<p class="csv__note">${ICON_LOCK}<span>${c.csvPrivacy}</span></p>
		</section>`;
	}

	function renderHourly(details) {
		const c = t();
		let rows = "";
		for (let d = 0; d < 7; d++) {
			for (let h = 0; h < 19; h++) {
				const cell = reports.rows[d][h];
				const st =
					cell.kind === "closed"
						? c.stateClosed
						: cell.kind === "missing"
							? c.stateMissing
							: cell.kind === "zero"
								? c.stateZero
								: c.stateValue;
				const avg = cell.kind === "value" ? nf(cell.avg, 1) : cell.kind === "zero" ? "0" : "—";
				rows += `<tr><td>${WEEKDAY_NAMES[state.lang][WEEKDAYS[d]]}</td><td>${bdi(clock((6 + h) * 60, false))}</td><td>${st}</td><td>${bdi(avg)}</td><td>${bdi(nf(cell.observed))}</td><td>${bdi(nf(cell.expected))}</td><td>${bdi(cell.samples)}</td></tr>`;
			}
		}
		details.querySelector(".disc__body").innerHTML = `
			<div class="scroller" role="region" aria-label="${c.hourlyRegion}" tabindex="0">
				<table class="tbl"><thead><tr><th scope="col">${c.colWeekday}</th><th scope="col">${c.colHour}</th><th scope="col">${c.colState}</th><th scope="col">${c.colAverage}</th><th scope="col">${c.colObserved}</th><th scope="col">${c.colExpected}</th><th scope="col">${c.colSamples}</th></tr></thead><tbody>${rows}</tbody></table>
			</div>`;
	}

	/* ───────────────────────── Placeholders ───────────────────────── */

	function renderPlaceholder(panel, section) {
		const c = t();
		const n = String(SECTIONS.indexOf(section) + 1).padStart(2, "0");
		panel.innerHTML = `
			<header class="phead">
				<div>
					<p class="eyebrow"><span>${c.phEyebrow(bdi(n))}</span><span class="tag">${c.concept}</span></p>
					<h1 class="h1">${c.phTitles[section]}</h1>
					<p class="lede"><span>${c.phDescriptions[section]}</span></p>
				</div>
			</header>
			<div class="ph"><span class="ph__num" aria-hidden="true">${n}</span><p>${c.phNote}</p></div>`;
	}

	/* ───────────────────────── Boot ───────────────────────── */

	narrowQuery.addEventListener("change", () => {
		if (document.getElementById(`panel-${state.section}`)) renderSection(false);
	});

	applyLang();
	const boot = () => {
		renderShell();
		syncUrl();
	};
	if (document.fonts?.ready) {
		Promise.race([
			document.fonts.ready,
			new Promise((r) => setTimeout(r, 1500)),
		]).then(boot);
	} else boot();
})();
