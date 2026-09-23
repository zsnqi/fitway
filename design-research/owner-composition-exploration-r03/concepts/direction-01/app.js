// FITWAY Owner Observatory: static, deterministic concept data only.
const path = new URLSearchParams(location.search);
const savedLanguage = (() => {
	try {
		return localStorage.getItem("fitway-concept-language");
	} catch {
		return null;
	}
})();
const state = {
	lang:
		path.get("lang") === "en" || path.get("lang") === "ar"
			? path.get("lang")
			: savedLanguage || "ar",
	view: [
		"daily",
		"reports",
		"access",
		"activity",
		"operations",
		"settings",
	].includes(path.get("view"))
		? path.get("view")
		: "daily",
	reading: "fresh",
	selected: 14,
	filter: "all",
	detail: null,
	table: false,
	feedback: "",
};

const sample = [8, 11, 17, 26, 33, 38, 45, null, 52, 47, 61, 64, 55, 48, 37];
const times = sample.map((_, i) => `${String(i + 6).padStart(2, "0")}:00`);
const events = [
	{
		time: "20:24",
		kind: "access",
		event: "pinRotated",
		actor: "ownerRole",
		target: "staffPin",
		detail: "pinDetail",
	},
	{
		time: "19:41",
		kind: "settings",
		event: "hoursSaved",
		actor: "ownerRole",
		target: "hours",
		detail: "hoursDetail",
	},
	{
		time: "17:10",
		kind: "reports",
		event: "exportPrepared",
		actor: "ownerRole",
		target: "csv",
		detail: "exportDetail",
	},
	{
		time: "14:06",
		kind: "operations",
		event: "feedRecovered",
		actor: "systemRole",
		target: "edge",
		detail: "feedDetail",
	},
	{
		time: "13:02",
		kind: "operations",
		event: "coverageGap",
		actor: "systemRole",
		target: "coverage",
		detail: "gapDetail",
	},
	{
		time: "09:18",
		kind: "access",
		event: "accountDisabled",
		actor: "ownerRole",
		target: "account",
		detail: "accountDetail",
	},
];

const copy = {
	en: {
		skip: "Skip to content",
		workspace: "Owner workspace",
		concept: "Concept exploration · sample data",
		daily: "Daily",
		reports: "Reports",
		access: "Access",
		activity: "Activity log",
		operations: "Operations",
		settings: "Settings",
		introDaily:
			"A clear reading of the current state, then the full shape of this gym business day.",
		introActivity:
			"Operational decisions and system events in readable, complete records.",
		introOther:
			"A composition sketch for this destination. No production workflow is connected.",
		gymDay: "Illustrative gym business day · 23 Sep 2026",
		stateLabel: "Preview data state",
		fresh: "Sample · open",
		delayed: "Sample · delayed",
		closed: "Sample · closed",
		unavailable: "Sample · unavailable",
		error: "Sample · error",
		loading: "Sample · loading",
		freshLine: "Illustrative reading · open · last update 20:00 gym time",
		delayedLine:
			"Illustrative last-known reading · updates delayed since 20:00",
		closedLine: "Closed in this preview",
		unavailableLine: "Occupancy unavailable in this preview",
		errorLine: "Reading request failed in this preview",
		loadingLine: "Loading illustrative reading",
		moderate: "Moderate",
		approx: "approximate occupancy",
		now: "at 20:00",
		lastKnown: "last known",
		closedText: "Closed",
		unavailableText: "Unavailable",
		errorText: "Unable to show occupancy",
		loadingText: "Loading reading",
		retry: "Retry preview",
		chart: "Today’s observed curve",
		chartSub: "Approximate count across the gym business day",
		chartLast: "Last-known day curve · not live",
		observed: "Observed",
		missing: "No reading",
		chartLabel:
			"Illustrative approximate occupancy by gym hour. One hour is missing.",
		coverageMetric: "Coverage 14 / 15 hours",
		coverageText:
			"13:00 has no reading; the line stops instead of inventing a value.",
		selected: "selected hour",
		approxCount: "approximate count",
		noReading: "no reading",
		howRead: "How to read this day",
		howReadBody:
			"The red line connects only observed hours. The neutral break at 13:00 is missing data, not zero occupancy. This illustration does not describe the real gym.",
		tableLabel: "Data table",
		tableHint:
			"Every plotted value and the missing interval are available as text.",
		viewTable: "Show hourly values",
		hideTable: "Hide hourly values",
		hour: "Hour",
		value: "Approx. count",
		status: "Status",
		illustrative:
			"All values and events on this page are deterministic illustrations. There is no live feed or visitor-level data.",
		todayEvents: "illustrative records",
		filterLabel: "Filter records",
		all: "All",
		filterAccess: "Access",
		filterSettings: "Settings",
		filterOps: "Operations",
		filterReports: "Reports",
		filterCount: "{n} records shown",
		time: "Time",
		event: "Event",
		actor: "Actor",
		subject: "Subject",
		details: "Details",
		ownerRole: "Owner role",
		systemRole: "System",
		staffPin: "Staff PIN credential",
		hours: "Weekly hours",
		csv: "CSV export",
		edge: "Edge feed",
		coverage: "Coverage",
		account: "Owner account",
		pinRotated: "Staff PIN rotated",
		hoursSaved: "Opening hours saved",
		exportPrepared: "History CSV prepared",
		feedRecovered: "Feed recovered",
		coverageGap: "Reading gap recorded",
		accountDisabled: "Owner account deactivated",
		pinDetail:
			"A credential rotation was recorded. This concept never displays the PIN or a one-time secret.",
		hoursDetail:
			"The weekly schedule changed. The saved value would be shown in the production record.",
		exportDetail:
			"An export was prepared for the requested range. No file is generated by this concept.",
		feedDetail:
			"The edge feed resumed after a delayed interval. Uptime and reading coverage remain separate measures.",
		gapDetail:
			"The 13:00 interval has no usable reading. It is not interpreted as zero or an outage.",
		accountDetail:
			"An owner account was deactivated. This illustration omits identity fields.",
		reportTitle: "Reports as a ledger",
		reportBody:
			"Begin with the selected business-day range and a single heatmap field; keep coverage and comparison beside the chart. The CSV action belongs next to the exact range it exports.",
		reportAside: "Range · heatmap · export",
		accessTitle: "Access as controlled records",
		accessBody:
			"Show accounts and shared PIN credentials as separate record types. Routine actions stay quiet; rotation and deactivation open explicit confirmation and one-time reveal states.",
		accessAside: "Accounts · credentials · history",
		operationsTitle: "Operations as independent signals",
		operationsBody:
			"Place uptime, reading coverage, and alert delivery on three aligned tracks. Incidents attach to a timestamped track and never turn a missing reading into an outage claim.",
		operationsAside: "Uptime · coverage · alerts",
		settingsTitle: "Settings as one staged form",
		settingsBody:
			"Group capacity and crowd thresholds, weekly hours, and technical timing into clear chapters. Keep dirty state, save feedback, and discard within reach of the active chapter.",
		settingsAside: "Thresholds · hours · timing",
		projected: "Concept-only destination",
		footer:
			"FITWAY Owner concept 01 · visual exploration only · no production data",
	},
	ar: {
		skip: "تجاوز إلى المحتوى",
		workspace: "مساحة المالك",
		concept: "استكشاف تصميم · بيانات توضيحية",
		daily: "اليوم",
		reports: "التقارير",
		access: "الوصول",
		activity: "سجل النشاط",
		operations: "التشغيل",
		settings: "الإعدادات",
		introDaily: "قراءة واضحة للحالة الحالية، ثم صورة اليوم التشغيلي كاملة.",
		introActivity:
			"قرارات التشغيل وأحداث النظام في سجلات مكتملة وسهلة القراءة.",
		introOther: "تصور لتركيب هذه الوجهة. لا توجد عملية إنتاجية متصلة.",
		gymDay: "يوم تشغيلي توضيحي · 23 سبتمبر 2026",
		stateLabel: "معاينة حالة البيانات",
		fresh: "مثال · مفتوح",
		delayed: "مثال · متأخر",
		closed: "مثال · مغلق",
		unavailable: "مثال · غير متاح",
		error: "مثال · خطأ",
		loading: "مثال · تحميل",
		freshLine: "قراءة توضيحية · مفتوح · آخر تحديث 20:00 بتوقيت النادي",
		delayedLine: "آخر قراءة توضيحية معروفة · التحديث متأخر منذ 20:00",
		closedLine: "مغلق في هذه المعاينة",
		unavailableLine: "الإشغال غير متاح في هذه المعاينة",
		errorLine: "تعذر طلب القراءة في هذه المعاينة",
		loadingLine: "جارٍ تحميل قراءة توضيحية",
		moderate: "متوسط",
		approx: "العدد التقريبي",
		now: "عند 20:00",
		lastKnown: "آخر قيمة معروفة",
		closedText: "مغلق",
		unavailableText: "غير متاح",
		errorText: "تعذر عرض الإشغال",
		loadingText: "جارٍ تحميل القراءة",
		retry: "إعادة محاولة المعاينة",
		chart: "منحنى اليوم المرصود",
		chartSub: "العدد التقريبي خلال اليوم التشغيلي",
		chartLast: "منحنى آخر يوم معروف · ليس مباشرًا",
		observed: "قراءة مرصودة",
		missing: "لا توجد قراءة",
		chartLabel: "إشغال تقريبي توضيحي حسب ساعة النادي. توجد ساعة بلا قراءة.",
		coverageMetric: "التغطية 14 / 15 ساعة",
		coverageText: "لا توجد قراءة عند 13:00؛ ينقطع الخط بدل اختراع قيمة.",
		selected: "الساعة المحددة",
		approxCount: "العدد التقريبي",
		noReading: "لا توجد قراءة",
		howRead: "كيف نقرأ هذا اليوم",
		howReadBody:
			"يصل الخط الأحمر بين الساعات المرصودة فقط. الفجوة المحايدة عند 13:00 تعني غياب البيانات، لا أن الإشغال صفر. هذا المثال لا يصف النادي الحقيقي.",
		tableLabel: "جدول البيانات",
		tableHint: "كل قيمة مرسومة والفترة الناقصة متاحتان كنص.",
		viewTable: "عرض القيم بالساعة",
		hideTable: "إخفاء القيم بالساعة",
		hour: "الساعة",
		value: "العدد التقريبي",
		status: "الحالة",
		illustrative:
			"كل القيم والأحداث في هذه الصفحة أمثلة ثابتة. لا يوجد بث مباشر أو بيانات تخص زائرًا.",
		todayEvents: "سجلات توضيحية",
		filterLabel: "تصفية السجلات",
		all: "الكل",
		filterAccess: "الوصول",
		filterSettings: "الإعدادات",
		filterOps: "التشغيل",
		filterReports: "التقارير",
		filterCount: "المعروض {n} سجلات",
		time: "الوقت",
		event: "الحدث",
		actor: "الفاعل",
		subject: "الموضوع",
		details: "التفاصيل",
		ownerRole: "دور المالك",
		systemRole: "النظام",
		staffPin: "بيانات PIN للموظفين",
		hours: "ساعات العمل الأسبوعية",
		csv: "تصدير CSV",
		edge: "تغذية الجهاز",
		coverage: "التغطية",
		account: "حساب مالك",
		pinRotated: "تدوير PIN الموظفين",
		hoursSaved: "حفظ ساعات العمل",
		exportPrepared: "تجهيز CSV للسجل",
		feedRecovered: "استعادة التغذية",
		coverageGap: "تسجيل فجوة قراءة",
		accountDisabled: "تعطيل حساب مالك",
		pinDetail:
			"سُجل تدوير بيانات الدخول. لا تعرض هذه الفكرة رمز PIN أو سرًا يظهر مرة واحدة.",
		hoursDetail:
			"تغير الجدول الأسبوعي. ستظهر القيمة المحفوظة في السجل الإنتاجي.",
		exportDetail: "جُهز التصدير للفترة المطلوبة. لا تنشئ هذه الفكرة ملفًا.",
		feedDetail:
			"عادت تغذية الجهاز بعد تأخر. يظل وقت التشغيل وتغطية القراءات مقياسين منفصلين.",
		gapDetail:
			"لا توجد قراءة صالحة عند 13:00. لا تعني صفرًا ولا تثبت انقطاع الجهاز.",
		accountDetail: "عُطل حساب مالك. يحذف هذا المثال حقول الهوية.",
		reportTitle: "التقارير كسجل مرئي",
		reportBody:
			"تبدأ بالفترة المختارة وخريطة كثافة واحدة، مع التغطية والمقارنة بجانب الرسم. يبقى إجراء CSV ملاصقًا للفترة التي سيصدرها.",
		reportAside: "الفترة · الكثافة · التصدير",
		accessTitle: "الوصول كسجلات محكومة",
		accessBody:
			"تظهر حسابات المالك وبيانات PIN المشتركة كنوعين منفصلين. الإجراءات العادية هادئة؛ التدوير والتعطيل يفتحان تأكيدًا واضحًا وحالة كشف لمرة واحدة.",
		accessAside: "الحسابات · الاعتمادات · التاريخ",
		operationsTitle: "التشغيل كإشارات مستقلة",
		operationsBody:
			"يُعرض وقت التشغيل وتغطية القراءات وإيصال التنبيهات في ثلاثة مسارات متحاذية. يرتبط الحادث بوقته ولا تتحول القراءة المفقودة إلى ادعاء انقطاع.",
		operationsAside: "التشغيل · التغطية · التنبيهات",
		settingsTitle: "الإعدادات كنموذج مرحلي",
		settingsBody:
			"تُجمع السعة وحدود الازدحام والساعات الأسبوعية والتوقيت التقني في فصول واضحة. تظل حالة التعديل والحفظ والتراجع قريبة من الفصل النشط.",
		settingsAside: "الحدود · الساعات · التوقيت",
		projected: "وجهة توضيحية فقط",
		footer: "فكرة FITWAY للمالك 01 · استكشاف بصري فقط · بلا بيانات إنتاجية",
	},
};

const icons = {
	daily: '<path d="M3 17.5h4l3-6 3 3 3-8 5 2"/><path d="M3 21h18"/>',
	reports: '<path d="M4 19V5h16v14H4Z"/><path d="M8 15l3-4 3 2 3-5"/>',
	access:
		'<circle cx="9" cy="9" r="3"/><path d="M3.5 19c.5-3 2.4-5 5.5-5s5 2 5.5 5M17 11h4m-2-2v4"/>',
	activity: '<path d="M5 4h14v16H5zM9 8h6M9 12h6M9 16h4"/>',
	operations:
		'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2M12 2v2M22 12h-2"/>',
	settings:
		'<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="#1a1519"/><circle cx="15" cy="12" r="2" fill="#1a1519"/><circle cx="10" cy="17" r="2" fill="#1a1519"/>',
};
const icon = (name) =>
	`<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">${icons[name]}</svg>`;
const brandMark = `<svg class="brand-mark" viewBox="0 0 36 36" aria-hidden="true"><path fill="#f42a45" d="M2 8h32l-4 6H6zM6 17h24l-4 6H10zM11 26h14l-4 6h-6z"/></svg>`;
const c = () => copy[state.lang];
const order = [
	"daily",
	"reports",
	"access",
	"activity",
	"operations",
	"settings",
];
const timeBdi = (text) => `<bdi>${text}</bdi>`;

function shell() {
	const t = c();
	document.documentElement.lang = state.lang;
	document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
	document.querySelector(".skip").textContent = t.skip;
	document.title = `FITWAY · ${t[state.view]} · Concept 01`;
	document.querySelector("#app").innerHTML = `<div class="app">
    <nav class="rail" aria-label="${t.workspace}"><a class="brand" href="?view=daily&lang=${state.lang}" aria-label="FITWAY ${t.workspace}">${brandMark}<span class="brand-letter">FW</span></a><div class="rail-links">${order.map((v) => `<button type="button" class="rail-link ${state.view === v ? "active" : ""}" data-view="${v}" ${state.view === v ? 'aria-current="page"' : ""}>${icon(v)}<span>${t[v]}</span></button>`).join("")}</div><div class="rail-end">OWNER<br>01</div></nav>
    <div class="workspace"><header class="topline"><div class="top-left"><span class="wordmark">FITWAY</span><span class="top-divider"></span><span class="workspace-label">${t.workspace}</span></div><div class="top-actions"><span class="concept-note">${t.concept}</span><button class="language" id="language" type="button" aria-label="${state.lang === "en" ? "العربية" : "English"}">${state.lang === "en" ? "العربية" : "EN"}</button></div></header><main id="main" tabindex="-1">${state.view === "daily" ? daily() : state.view === "activity" ? activity() : projected()}</main><footer class="foot-note">${t.footer}</footer></div></div>`;
	bind();
}

function pageHead(title, intro, aside = "") {
	return `<div class="page-head"><div><h1>${title}</h1><p>${intro}</p></div>${aside}</div>`;
}
function stateControl() {
	const t = c();
	return `<label class="sr-only" for="reading-state">${t.stateLabel}</label><span class="state-select-wrap"><select id="reading-state" class="state-select" aria-label="${t.stateLabel}">${["fresh", "delayed", "closed", "unavailable", "error", "loading"].map((k) => `<option value="${k}" ${state.reading === k ? "selected" : ""}>${t[k]}</option>`).join("")}</select></span>`;
}
function daily() {
	const t = c();
	const visible = state.reading === "fresh" || state.reading === "delayed";
	const status =
		state.reading === "fresh"
			? t.freshLine
			: state.reading === "delayed"
				? t.delayedLine
				: t[`${state.reading}Line`];
	const stateClass =
		state.reading === "fresh"
			? ""
			: state.reading === "delayed"
				? "delayed"
				: "neutral";
	const title = visible ? t.moderate : t[`${state.reading}Text`];
	const readout = `<div class="readout"><div><div class="current-meta ${stateClass}"><i class="live-dot" aria-hidden="true"></i>${status}</div><div class="readout-title">${visible ? `<strong>${title}</strong><span class="readout-sub">${state.reading === "delayed" ? t.lastKnown : t.now}</span>` : `<span class="readout-empty">${title}</span>`}</div></div>${visible ? `<div class="readout-number"><strong>${timeBdi("37")}</strong><span>${t.approx}</span></div>` : ""}</div>`;
	return `<section class="view" aria-labelledby="daily-heading">${pageHead(`<span id="daily-heading">${t.daily}</span>`, t.introDaily, `<div class="head-aside"><span class="stamp">${t.gymDay}</span>${stateControl()}</div>`)}<div class="observatory">${readout}${visible ? `<div class="horizon-top"><div><h2>${state.reading === "delayed" ? t.chartLast : t.chart}</h2><p>${t.chartSub}</p></div><div class="legend"><span class="legend-item"><i class="legend-swatch"></i>${t.observed}</span><span class="legend-item"><i class="legend-swatch gap"></i>${t.missing}</span></div></div><div class="horizon">${chart()}</div><div class="horizon-foot"><div class="coverage"><strong>${t.coverageMetric}</strong><span>${t.coverageText}</span><span class="coverage-track" aria-hidden="true">${sample.map((v) => `<i class="${v === null ? "missing" : ""}"></i>`).join("")}</span></div><div class="selected-reading" aria-live="polite"><strong>${timeBdi(times[state.selected])}</strong><span>${sample[state.selected] === null ? t.noReading : `${timeBdi(sample[state.selected])} · ${t.approxCount}`}</span></div></div>` : `<div class="truth-banner" role="status">${status}. ${t.illustrative}${state.reading === "error" ? `<button id="retry-preview" type="button">${t.retry}</button>` : ""}</div>`}</div>${visible ? `<div class="below"><div class="explain"><h3>${t.howRead}</h3><p>${t.howReadBody}</p></div><div class="table-panel"><h3>${t.tableLabel}</h3><p>${t.tableHint}</p><button class="table-toggle" id="table-toggle" type="button" aria-expanded="${state.table}">${state.table ? t.hideTable : t.viewTable}</button>${state.table ? table() : ""}</div></div>` : ""}<p class="foot-note">${t.illustrative}</p></section>`;
}

function chart() {
	const t = c();
	const rtl = state.lang === "ar";
	const mobile = matchMedia("(max-width: 600px)").matches;
	const left = mobile ? 30 : 48;
	const right = mobile ? 330 : 944;
	const svgWidth = mobile ? 360 : 992;
	const x = (i) => left + ((rtl ? 14 - i : i) * (right - left)) / 14;
	const y = (v) => 194 - v * 2.35;
	const segments = [];
	let current = [];
	sample.forEach((v, i) => {
		if (v === null) {
			if (current.length) segments.push(current);
			current = [];
		} else current.push([i, v]);
	});
	if (current.length) segments.push(current);
	const lines = segments
		.map(
			(points) =>
				`<polyline class="chart-line" points="${points.map(([i, v]) => `${x(i)},${y(v)}`).join(" ")}"/>`,
		)
		.join("");
	const fills = segments
		.map(
			(points) =>
				`<path class="chart-fill" d="M${x(points[0][0])} 194 L${points.map(([i, v]) => `${x(i)} ${y(v)}`).join(" L")} L${x(points.at(-1)[0])} 194Z"/>`,
		)
		.join("");
	const gapX = x(7);
	const nowX = x(14);
	const points = sample
		.map((v, i) =>
			v === null
				? ""
				: `<circle class="chart-point ${state.selected === i ? "selected" : ""}" data-point="${i}" role="button" tabindex="0" aria-label="${times[i]}: ${v} ${t.approxCount}" aria-pressed="${state.selected === i}" cx="${x(i)}" cy="${y(v)}" r="4.5"><title>${times[i]} · ${v}</title></circle>`,
		)
		.join("");
	const labels = [0, 3, 6, 9, 12, 14]
		.map(
			(i) =>
				`<text class="chart-axis" x="${x(i)}" y="225" text-anchor="middle">${times[i]}</text>`,
		)
		.join("");
	return `<svg class="chart-svg" viewBox="0 0 ${svgWidth} 238" role="group" aria-label="${t.chartLabel}"><defs><linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e72d4b" stop-opacity=".31"/><stop offset="100%" stop-color="#e72d4b" stop-opacity="0"/></linearGradient></defs><g aria-hidden="true"><line class="chart-grid" x1="${left}" x2="${right}" y1="194" y2="194"/><line class="chart-guide" x1="${left}" x2="${right}" y1="100" y2="100"/><line class="chart-guide" x1="${left}" x2="${right}" y1="29" y2="29"/><text class="chart-label" x="${rtl ? right - 5 : left + 5}" y="91" text-anchor="${rtl ? "end" : "start"}">40</text><text class="chart-label" x="${rtl ? right - 5 : left + 5}" y="20" text-anchor="${rtl ? "end" : "start"}">70</text><rect class="chart-gap" x="${gapX - (mobile ? 11 : 23)}" y="19" width="${mobile ? 22 : 46}" height="175" rx="3"/><line class="chart-gap-edge" x1="${gapX}" x2="${gapX}" y1="19" y2="194"/><line class="chart-now" x1="${nowX}" x2="${nowX}" y1="22" y2="194"/>${fills}${lines}${labels}<text class="chart-now-label" x="${nowX + (rtl ? 18 : -18)}" y="20" text-anchor="${rtl ? "start" : "end"}">${t.now}</text></g>${points}</svg>`;
}
function table() {
	const t = c();
	return `<table class="data-table"><thead><tr><th>${t.hour}</th><th>${t.value}</th><th>${t.status}</th></tr></thead><tbody>${sample.map((v, i) => `<tr><td>${timeBdi(times[i])}</td><td>${v === null ? "—" : timeBdi(v)}</td><td>${v === null ? t.missing : t.observed}</td></tr>`).join("")}</tbody></table>`;
}

function activity() {
	const t = c();
	const filtered = events
		.map((e, i) => ({ ...e, i }))
		.filter((e) => state.filter === "all" || e.kind === state.filter);
	const buttons = [
		["all", t.all],
		["access", t.filterAccess],
		["settings", t.filterSettings],
		["operations", t.filterOps],
		["reports", t.filterReports],
	];
	return `<section class="view" aria-labelledby="activity-heading">${pageHead(`<span id="activity-heading">${t.activity}</span>`, t.introActivity, `<div class="head-aside"><span class="stamp">${t.gymDay}</span></div>`)}<div class="log-summary"><strong>${timeBdi(filtered.length)}</strong><span>${t.todayEvents}</span></div><div class="filter-row"><div class="filters" role="group" aria-label="${t.filterLabel}">${buttons.map(([key, label]) => `<button type="button" class="filter ${state.filter === key ? "active" : ""}" data-filter="${key}" aria-pressed="${state.filter === key}">${label}</button>`).join("")}</div><div class="filter-feedback" aria-live="polite">${t.filterCount.replace("{n}", filtered.length)}</div></div><div class="record-heading"><span>${t.time}</span><span>${t.event}</span><span>${t.actor}</span><span>${t.subject}</span><span></span></div><div class="records">${filtered.length ? filtered.map((e) => `<div class="record-group"><button type="button" class="record" data-detail="${e.i}" aria-expanded="${state.detail === e.i}" aria-controls="detail-${e.i}"><time datetime="2026-09-23T${e.time}:00">${e.time}</time><span class="record-action">${t[e.event]}<small>${t[e.kind === "access" ? "filterAccess" : e.kind === "settings" ? "filterSettings" : e.kind === "reports" ? "filterReports" : "filterOps"]}</small></span><span class="record-actor">${t[e.actor]}</span><span class="record-target">${t[e.target]}</span><svg class="chevron" aria-hidden="true" viewBox="0 0 16 16"><path fill="none" stroke="currentColor" stroke-width="1.6" d="m3 6 5 5 5-5"/></svg></button>${state.detail === e.i ? `<div class="record-detail" id="detail-${e.i}"><strong>${t.details} · ${t[e.target]}</strong><p>${t[e.detail]}</p></div>` : ""}</div>`).join("") : `<p class="no-records">${t.noRecords}</p>`}</div><p class="foot-note">${t.illustrative}</p></section>`;
}

function projected() {
	const t = c();
	const map = {
		reports: ["reportTitle", "reportBody", "reportAside"],
		access: ["accessTitle", "accessBody", "accessAside"],
		operations: ["operationsTitle", "operationsBody", "operationsAside"],
		settings: ["settingsTitle", "settingsBody", "settingsAside"],
	};
	const [title, body, aside] = map[state.view];
	return `<section class="view" aria-labelledby="other-heading">${pageHead(`<span id="other-heading">${t[state.view]}</span>`, t.introOther)}<div class="projected"><div><h2>${t[title]}</h2><p>${t[body]}</p></div><div class="mini-rail"><strong>${t.projected}</strong><span>${t[aside]}</span></div></div><p class="foot-note">${t.illustrative}</p></section>`;
}

function updateURL() {
	history.replaceState(null, "", `?view=${state.view}&lang=${state.lang}`);
}
function bind() {
	document.querySelectorAll("[data-view]").forEach((btn) => {
		btn.addEventListener("click", () => {
			state.view = btn.dataset.view;
			state.detail = null;
			updateURL();
			shell();
			document.querySelector("#main").focus({ preventScroll: true });
			window.scrollTo({
				top: 0,
				behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
					? "instant"
					: "smooth",
			});
		});
	});
	document.querySelector("#language").addEventListener("click", () => {
		state.lang = state.lang === "en" ? "ar" : "en";
		try {
			localStorage.setItem("fitway-concept-language", state.lang);
		} catch {}
		updateURL();
		shell();
		document.querySelector("#language").focus();
	});
	document.querySelector("#reading-state")?.addEventListener("change", (e) => {
		state.reading = e.target.value;
		state.table = false;
		shell();
		document.querySelector("#reading-state").focus();
	});
	document.querySelector("#retry-preview")?.addEventListener("click", () => {
		state.reading = "fresh";
		shell();
		document.querySelector("#reading-state").focus();
	});
	document.querySelector("#table-toggle")?.addEventListener("click", () => {
		state.table = !state.table;
		shell();
		document.querySelector("#table-toggle").focus();
	});
	document.querySelectorAll("[data-filter]").forEach((btn) => {
		btn.addEventListener("click", () => {
			state.filter = btn.dataset.filter;
			state.detail = null;
			shell();
			document.querySelector(`[data-filter="${state.filter}"]`).focus();
		});
	});
	document.querySelectorAll("[data-detail]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const n = Number(btn.dataset.detail);
			state.detail = state.detail === n ? null : n;
			shell();
			document.querySelector(`[data-detail="${n}"]`).focus();
		});
	});
	document.querySelectorAll("[data-point]").forEach((point) => {
		const select = () => {
			state.selected = Number(point.dataset.point);
			document.querySelectorAll("[data-point]").forEach((p) => {
				p.classList.toggle("selected", p === point);
				p.setAttribute("aria-pressed", String(p === point));
			});
			const selected = document.querySelector(".selected-reading");
			const t = c();
			selected.innerHTML = `<strong>${timeBdi(times[state.selected])}</strong><span>${timeBdi(sample[state.selected])} · ${t.approxCount}</span>`;
		};
		point.addEventListener("click", select);
		point.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				select();
			}
		});
	});
}

shell();
