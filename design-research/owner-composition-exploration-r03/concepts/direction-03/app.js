/* FITWAY Owner concept 03. Deterministic, illustrative data only. */
const labels = {
	en: {
		skip: "Skip to content",
		concept: "Owner concept 03 · illustrative data",
		demo: "Static sample · never a live feed",
		language: "العربية",
		signout: "Owner workspace concept",
		daily: "Daily",
		reports: "Reports",
		access: "Access",
		activity: "Activity log",
		operations: "Operations",
		settings: "Settings",
		current: "Current reading",
		open: "Gym open",
		moderate: "Moderate",
		approx: "approximate occupancy",
		observedAt: "Observed 15:07 · Tue 21 July 2026",
		sampleNotice:
			"Sample snapshot for design review. Nothing here is connected to the gym.",
		day: "Today's signal",
		daySub: "Observed intervals of the gym business day, through 15:07.",
		coverage: "Coverage",
		coverageValue: "75%",
		coverageExplain:
			"of expected minute readings through 15:07; gaps are unobserved, not zero.",
		peak: "Observed peak",
		peakValue: "57",
		peakExplain: "at 14:30",
		entrance: "Estimated entries",
		entranceValue: "59",
		entranceExplain: "crossings, not unique members",
		intervals: "Period readings",
		periodHint: "Select a period for observed values and gaps.",
		noReading: "No reading",
		future: "Not yet observed",
		chartPoint: "Select period",
		period0: "Early",
		period1: "Late morning",
		period2: "Midday",
		period3: "Afternoon",
		period0time: "06–09",
		period1time: "09–12",
		period2time: "12–15",
		period3time: "15–18",
		period0detail: "Mostly quiet. 5 observed readings, 1 missing.",
		period1detail: "Gradual rise. 6 observed readings.",
		period2detail: "Peak 57 at 14:30. 5 observed readings, 1 missing.",
		period3detail:
			"37 at 15:07. Later intervals have not happened in this sample.",
		selected: "Selected period",
		observed: "Observed",
		missing: "Missing",
		notYet: "Future",
		reportsTitle: "Reports",
		reportsSub: "Week at a glance · illustrative historical readings",
		matrixTitle: "Hour × day",
		matrixSub:
			"Typical observed occupancy by sampled hour. Select a cell to read it precisely.",
		matrixCoverage: "Coverage: 39 of 42 cells observed",
		week: "14–20 July 2026 · sample week",
		showTable: "Show values table",
		hideTable: "Hide values table",
		cellDetails: "Selected cell",
		reportControl: "Prepare sample CSV",
		reportFeedback:
			"Sample preview prepared locally. No export or account action occurred.",
		reportNote:
			"This matrix is historical illustration. Missing cells mean no usable reading; they are not zero.",
		mon: "Mon",
		tue: "Tue",
		wed: "Wed",
		thu: "Thu",
		fri: "Fri",
		sat: "Sat",
		sun: "Sun",
		closed: "Closed",
		missingCell: "Missing reading",
		people: "approx. people",
		hour: "Hour",
		dayColumn: "Day",
		accessTitle: "Access",
		accessDesc:
			"Provision, rotate, and deactivate credentials in separate risk bands. A one-time PIN reveal stays scoped to its own action.",
		activityTitle: "Activity log",
		activityDesc:
			"A compact event ledger puts time, action, actor role, and target together on mobile; filters open on demand.",
		operationsTitle: "Operations",
		operationsDesc:
			"Separate uptime, observation coverage, and alert delivery. A missing count does not become an outage.",
		settingsTitle: "Settings",
		settingsDesc:
			"Group hours, crowd bands, and technical timing by task; keep save and discard beside the edited group.",
		conceptOnly: "Exploration only · no production changes",
		active: "Current section",
	},
	ar: {
		skip: "تجاوز إلى المحتوى",
		concept: "تصوّر المالك 03 · بيانات توضيحية",
		demo: "عينة ثابتة · ليست بثًا مباشرًا",
		language: "English",
		signout: "تصوّر مساحة المالك",
		daily: "اليومي",
		reports: "التقارير",
		access: "الوصول",
		activity: "سجل النشاط",
		operations: "التشغيل",
		settings: "الإعدادات",
		current: "القراءة الحالية",
		open: "الصالة مفتوحة",
		moderate: "متوسط",
		approx: "عدد تقريبي للموجودين",
		observedAt: "رُصدت 15:07 · الثلاثاء 21 يوليو 2026",
		sampleNotice:
			"لقطة توضيحية لمراجعة التصميم. هذه البيانات غير متصلة بالصالة.",
		day: "إشارة اليوم",
		daySub: "الفترات المرصودة من يوم العمل حتى 15:07.",
		coverage: "تغطية البيانات",
		coverageValue: "75%",
		coverageExplain:
			"من قراءات الدقيقة المتوقعة حتى 15:07؛ الفجوات غير مرصودة وليست صفرًا.",
		peak: "الذروة المرصودة",
		peakValue: "57",
		peakExplain: "عند 14:30",
		entrance: "الدخول التقديري",
		entranceValue: "59",
		entranceExplain: "مرات عبور، وليست أعضاءً فريدين",
		intervals: "قراءات الفترات",
		periodHint: "اختر فترة لعرض القيم والفجوات.",
		noReading: "لا قراءة",
		future: "لم تُرصد بعد",
		chartPoint: "اختر الفترة",
		period0: "البداية",
		period1: "آخر الصباح",
		period2: "منتصف اليوم",
		period3: "بعد الظهر",
		period0time: "06–09",
		period1time: "09–12",
		period2time: "12–15",
		period3time: "15–18",
		period0detail: "هدوء غالبًا. 5 قراءات مرصودة وفجوة واحدة.",
		period1detail: "ارتفاع تدريجي. 6 قراءات مرصودة.",
		period2detail: "الذروة 57 عند 14:30. 5 قراءات مرصودة وفجوة واحدة.",
		period3detail: "37 عند 15:07. بقية الفترة لم تحدث في هذه العينة.",
		selected: "الفترة المختارة",
		observed: "مرصود",
		missing: "مفقود",
		notYet: "لاحق",
		reportsTitle: "التقارير",
		reportsSub: "الأسبوع بنظرة واحدة · قراءات تاريخية توضيحية",
		matrixTitle: "الساعة × اليوم",
		matrixSub:
			"العدد التقريبي المرصود في ساعات العينة. اختر خانة لقراءتها بدقة.",
		matrixCoverage: "التغطية: 39 من 42 خانة مرصودة",
		week: "14–20 يوليو 2026 · أسبوع توضيحي",
		showTable: "عرض جدول القيم",
		hideTable: "إخفاء جدول القيم",
		cellDetails: "الخانة المختارة",
		reportControl: "تجهيز ملف CSV توضيحي",
		reportFeedback: "جُهزت معاينة محلية فقط. لم يحدث تصدير أو إجراء على الحساب.",
		reportNote:
			"هذه المصفوفة توضيح تاريخي. الخانات المفقودة تعني غياب قراءة صالحة، لا قيمة صفر.",
		mon: "الإثنين",
		tue: "الثلاثاء",
		wed: "الأربعاء",
		thu: "الخميس",
		fri: "الجمعة",
		sat: "السبت",
		sun: "الأحد",
		closed: "مغلق",
		missingCell: "قراءة مفقودة",
		people: "شخصًا تقريبًا",
		hour: "الساعة",
		dayColumn: "اليوم",
		accessTitle: "الوصول",
		accessDesc:
			"ترتيب منح الصلاحية وتدويرها وتعطيلها حسب درجة المخاطرة، مع عرض الرقم السري مرة واحدة ضمن إجراء مستقل.",
		activityTitle: "سجل النشاط",
		activityDesc:
			"سجل مكثف يجمع الوقت والإجراء ودور الفاعل والهدف في قراءة واحدة على الهاتف؛ وتُفتح المرشحات عند الحاجة.",
		operationsTitle: "التشغيل",
		operationsDesc:
			"فصل مدة التشغيل عن تغطية الرصد ووصول التنبيهات. غياب القراءة لا يعني انقطاع النظام.",
		settingsTitle: "الإعدادات",
		settingsDesc:
			"تجميع ساعات العمل وحدود الازدحام والتوقيت التقني بحسب المهمة، مع الحفظ والتراجع بجوار المجموعة المعدلة.",
		conceptOnly: "استكشاف فقط · لا تغييرات إنتاجية",
		active: "القسم الحالي",
	},
};

const icons = {
	daily: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12l4.5-3.5M7 15h10"/>',
	reports:
		'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
	access:
		'<circle cx="8.5" cy="10" r="4"/><path d="M12 10h9v3h-3v3h-3v-3h-3"/>',
	activity:
		'<path d="M5 5h14M5 12h14M5 19h14"/><circle cx="3" cy="5" r=".8" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r=".8" fill="currentColor" stroke="none"/><circle cx="3" cy="19" r=".8" fill="currentColor" stroke="none"/>',
	operations: '<path d="M2 12h4l2-6 4 12 3-8 2 2h5"/>',
	settings:
		'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="#171116"/><circle cx="16" cy="12" r="2" fill="#171116"/><circle cx="11" cy="18" r="2" fill="#171116"/>',
	arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
	check: '<path d="m4 12 5 5L20 6"/>',
};
function icon(name) {
	return (
		'<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
		icons[name] +
		"</svg>"
	);
}
const sections = [
	"daily",
	"reports",
	"access",
	"activity",
	"operations",
	"settings",
];
const params = new URLSearchParams(location.search);
let lang = params.get("lang") === "en" ? "en" : "ar";
let section = sections.includes(params.get("section"))
	? params.get("section")
	: "daily";
let selectedPeriod = 2;
let selectedCell = [2, 3];
let tableVisible = false;
let feedback = false;
const periods = [
	[8, 12, null, 22, 19, 17],
	[20, 25, 30, 33, 31, 26],
	[24, 29, 36, 34, null, 57],
	[37, undefined, undefined, undefined, undefined, undefined],
];
const matrix = [
	[12, 24, 31, 38, 46, 29],
	[9, 20, 33, 41, 52, 35],
	[11, 23, 36, 44, 57, 37],
	[8, 19, 30, 39, 49, 33],
	[null, 16, 25, 31, 42, 28],
	[14, 27, 35, 40, 51, null],
	[10, 21, 28, 34, null, 24],
];
const hours = ["06", "09", "12", "15", "18", "21"];
function t(key) {
	return labels[lang][key];
}
function syncUrl() {
	history.replaceState(null, "", "?lang=" + lang + "&section=" + section);
}
function header() {
	return `<header class="topbar">
    <div class="brand"><span class="brand-mark">F<span class="brand-slash">/</span>W</span><span class="brand-name">FITWAY</span><span class="brand-separator"></span><span class="owner-name">${t("signout")}</span></div>
    <div class="top-actions"><span class="sample-indicator"><i></i>${t("demo")}</span><button class="language-button" type="button" data-action="language" aria-label="${t("language")}">${t("language")}</button></div>
  </header>`;
}
function nav() {
	return `<nav class="instrument-nav" aria-label="${lang === "ar" ? "أقسام المالك" : "Owner sections"}">
  <div class="nav-shell">${sections.map((s) => `<button class="nav-item ${section === s ? "is-active" : ""}" type="button" data-section="${s}" aria-current="${section === s ? "page" : "false"}">${icon(s)}<span>${t(s)}</span></button>`).join("")}</div>
  </nav>`;
}
function lead(title, desc) {
	return `<div class="page-lead"><div><h1 tabindex="-1">${title}</h1><p>${desc}</p><span class="mobile-truth">${t("demo")}</span></div><div class="concept-stamp">${t("concept")}</div></div>`;
}
function daily() {
	return `<div class="daily-layout">
    ${lead(t("day"), t("daySub"))}
    <section class="cockpit" aria-label="${t("current")}">
      <div class="readout">
        <div class="readout-top"><span class="open-status"><i class="status-symbol" aria-hidden="true"></i>${t("open")}</span><span class="readout-label">${t("current")}</span></div>
        <div class="readout-body"><div class="count"><strong>37</strong><span>${t("approx")}</span></div><div class="crowd-band"><span class="band-dashes" aria-hidden="true"><b></b><b></b><b></b><b></b></span><strong>${t("moderate")}</strong></div></div>
        <p class="observed-time">${t("observedAt")}</p>
      </div>
      <div class="telemetry">
        <div class="telemetry-row"><div><span class="telemetry-label">${t("coverage")}</span><strong>${t("coverageValue")}</strong></div><p>${t("coverageExplain")}</p></div>
        <div class="telemetry-pair"><div><span class="telemetry-label">${t("peak")}</span><strong>${t("peakValue")}</strong><small>${t("peakExplain")}</small></div><div><span class="telemetry-label">${t("entrance")}</span><strong>${t("entranceValue")}</strong><small>${t("entranceExplain")}</small></div></div>
      </div>
    </section>
    <section class="period-section" aria-labelledby="period-title">
      <div class="section-heading"><div><h2 id="period-title">${t("intervals")}</h2><p>${t("periodHint")}</p></div><div class="legend"><span><i class="legend-observed"></i>${t("observed")}</span><span><i class="legend-missing"></i>${t("missing")}</span><span><i class="legend-future"></i>${t("notYet")}</span></div></div>
      <div class="period-track">${periods
				.map(
					(
						values,
						i,
					) => `<button type="button" class="period ${selectedPeriod === i ? "is-selected" : ""}" data-period="${i}" aria-pressed="${selectedPeriod === i}">
        <span class="period-name">${t("period" + i)}</span><span class="period-time" dir="ltr">${t("period" + i + "time")}</span>
        <span class="bars" aria-hidden="true">${values.map((v) => `<i class="${v === null ? "gap" : v === undefined ? "future" : "value"}" style="--h:${v ? Math.max(12, v * 1.5) : 12}%"></i>`).join("")}</span>
        <span class="period-foot">${values.filter((v) => typeof v === "number").length}/6 ${t("observed")}</span>
      </button>`,
				)
				.join("")}</div>
      <div class="detail-strip" role="status" aria-live="polite"><span>${t("selected")}: <strong>${t("period" + selectedPeriod)} <bdi dir="ltr">${t("period" + selectedPeriod + "time")}</bdi></strong></span><p>${t("period" + selectedPeriod + "detail")}</p></div>
      <p class="truth-note">${t("sampleNotice")}</p>
    </section>
  </div>`;
}
function cellName(day, hour, value) {
	return (
		t(["mon", "tue", "wed", "thu", "fri", "sat", "sun"][day]) +
		" " +
		hours[hour] +
		":00 — " +
		(value === null ? t("missingCell") : value + " " + t("people"))
	);
}
function reports() {
	const [d, h] = selectedCell;
	const value = matrix[d][h];
	return `<div class="reports-layout">
    ${lead(t("reportsTitle"), t("reportsSub"))}
    <section class="matrix-panel" aria-labelledby="matrix-title">
      <div class="matrix-heading"><div><h2 id="matrix-title">${t("matrixTitle")}</h2><p>${t("matrixSub")}</p></div><div class="matrix-date"><span>${t("week")}</span><strong>${t("matrixCoverage")}</strong></div></div>
      <div class="matrix-shell"><div class="matrix-axis"><span></span>${hours.map((hour) => `<span dir="ltr">${hour}:00</span>`).join("")}</div>
      ${matrix.map((row, i) => `<div class="matrix-row"><strong>${t(["mon", "tue", "wed", "thu", "fri", "sat", "sun"][i])}</strong>${row.map((v, j) => `<button type="button" class="heat-cell ${v === null ? "is-missing" : ""} ${d === i && h === j ? "is-selected" : ""}" data-cell="${i}-${j}" aria-label="${cellName(i, j, v)}" aria-pressed="${d === i && h === j}" style="--level:${v === null ? 0 : (0.13 + v / 80).toFixed(2)}"><span>${v === null ? "—" : v}</span></button>`).join("")}</div>`).join("")}</div>
      <div class="matrix-bottom"><span>0</span><div class="ramp" aria-hidden="true"></div><span>57</span><span class="ramp-label">${t("people")}</span><span class="missing-key"><i>—</i>${t("missing")}</span></div>
      <div class="cell-detail" aria-live="polite"><span>${t("cellDetails")}</span><strong>${cellName(d, h, value)}</strong><span>${t("reportNote")}</span></div>
      <div class="report-actions"><button class="text-action" type="button" data-action="table" aria-expanded="${tableVisible}">${tableVisible ? t("hideTable") : t("showTable")} ${icon("arrow")}</button><button class="csv-action" type="button" data-action="export">${t("reportControl")}</button></div>
      <div class="table-wrap ${tableVisible ? "" : "visually-hidden-table"}" id="values-table"><table><caption>${t("matrixTitle")} — ${t("week")}</caption><thead><tr><th scope="col">${t("dayColumn")}</th>${hours.map((hour) => `<th scope="col" dir="ltr">${hour}:00</th>`).join("")}</tr></thead><tbody>${matrix.map((row, i) => `<tr><th scope="row">${t(["mon", "tue", "wed", "thu", "fri", "sat", "sun"][i])}</th>${row.map((v) => `<td>${v === null ? t("missingCell") : v}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    </section>
    ${feedback ? `<div class="feedback" role="status">${icon("check")}<span>${t("reportFeedback")}</span></div>` : ""}
  </div>`;
}
function placeholder() {
	return `<div class="placeholder-layout">${lead(t(section + "Title"), t(section + "Desc"))}<div class="preview-note"><span class="preview-glyph">${icon(section)}</span><div><strong>${t(section + "Title")}</strong><p>${t(section + "Desc")}</p></div></div><p class="truth-note">${t("conceptOnly")}</p></div>`;
}
function render() {
	document.documentElement.lang = lang;
	document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
	document.querySelector(".skip-link").textContent = t("skip");
	document.title = "FITWAY — " + t(section) + " · concept 03";
	document.getElementById("app").innerHTML =
		`${header()}<main id="main" tabindex="-1">${section === "daily" ? daily() : section === "reports" ? reports() : placeholder()}</main>${nav()}<div class="sr-only" id="announcer" aria-live="polite"></div>`;
	syncUrl();
}
document.addEventListener("click", (event) => {
	const target = event.target.closest("button");
	if (!target) return;
	if (target.dataset.section) {
		section = target.dataset.section;
		feedback = false;
		render();
		document.querySelector("h1").focus?.();
		return;
	}
	if (target.dataset.period) {
		selectedPeriod = Number(target.dataset.period);
		render();
		document.querySelector('[data-period="' + selectedPeriod + '"]').focus();
		return;
	}
	if (target.dataset.cell) {
		selectedCell = target.dataset.cell.split("-").map(Number);
		render();
		document.querySelector('[data-cell="' + target.dataset.cell + '"]').focus();
		return;
	}
	if (target.dataset.action === "language") {
		lang = lang === "en" ? "ar" : "en";
		render();
		document.querySelector(".language-button").focus();
		return;
	}
	if (target.dataset.action === "table") {
		tableVisible = !tableVisible;
		render();
		document.querySelector('[data-action="table"]').focus();
		return;
	}
	if (target.dataset.action === "export") {
		feedback = true;
		render();
		document.querySelector('[data-action="export"]').focus();
	}
});
render();
