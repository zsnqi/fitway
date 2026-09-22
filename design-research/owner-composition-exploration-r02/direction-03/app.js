/* Concept-only deterministic fixtures. No network requests or visitor data. */
const app = document.getElementById("app");
const params = new URLSearchParams(location.search);
let lang = params.get("lang") === "ar" ? "ar" : "en";
let dayState = ["populated", "closed", "empty", "loading", "error"].includes(
	params.get("day"),
)
	? params.get("day")
	: "populated";
let currentState = [
	"fresh",
	"stale",
	"closed",
	"unavailable",
	"loading",
	"error",
].includes(params.get("current"))
	? params.get("current")
	: "fresh";
let selectedHour = 16;

const copy = {
	en: {
		owner: "Owner workspace",
		concept: "Exploration concept",
		sample: "Illustrative data only",
		lang: "العربية",
		dayExample: "Day example",
		currentExample: "Current example",
		populated: "Recorded day",
		closed: "Closed day",
		empty: "No readings",
		loading: "Loading",
		error: "Error",
		fresh: "Fresh",
		stale: "Delayed",
		unavailable: "Unavailable",
		day: "Monday, 21 September 2026",
		title: "The day, recorded",
		intro:
			"The observed pattern and gaps of this completed illustrative gym day.",
		currentLabel: "Current view · separate sample",
		currentSource:
			"Current view uses a separate operational snapshot. The daily record below is historical.",
		curFresh: "Open · Quiet · about 18 present",
		curFreshSub:
			"Sample reading at 18:02 gym time · current at 18:04 in this fixture.",
		curStale: "Open · last known: about 18 present",
		curStaleSub:
			"Sample reading at 18:02 gym time. Updates are delayed; this is not a current count.",
		curClosed: "Closed on schedule",
		curClosedSub: "No current crowd band or count is shown while closed.",
		curUnavailable: "Current occupancy unavailable",
		curUnavailableSub: "There is no usable current reading in this sample.",
		curLoading: "Loading current view",
		curLoadingSub: "The current snapshot has not resolved.",
		curError: "Current view did not load",
		curErrorSub: "The snapshot request failed. No current reading is retained.",
		recordTitle: "Observation record",
		recordSub: "Selected business day · gym-local time",
		coverage: "recorded open minutes",
		context: "Observed pattern",
		contextSub: "Each hour keeps its reading and its missing minutes together.",
		time: "Hour",
		pattern: "Recorded minutes",
		average: "Avg.",
		range: "Range",
		zero: "Genuine zero",
		recorded: "recorded",
		missing: "missing",
		preClosed: "Closed before 12:00",
		postClosed: "Closed after 18:00",
		expected: "360 scheduled open minutes",
		peak: "Highest observed",
		peakAt: "38 people at 16:42",
		mean: "Daily average",
		meanValue: "17 people",
		crossing: "Estimated entrance crossings",
		crossingValue: "94",
		noteTitle: "What the record supports",
		note: "Coverage is completeness of the scheduled open period. It is not a confidence score. A missing minute has no count; a recorded zero is an observed value.",
		legend: "Read the marks",
		observed: "Observed minute",
		gap: "Missing observation",
		closure: "Scheduled closure",
		source: "Source",
		device: "Device reading",
		backfill: "Recorded later",
		manual: "Entered manually",
		footA: "318 of 360 open minutes recorded",
		footB: "42 missing minutes remain visible in the record.",
		detailTitle: "Minute evidence",
		detailIntro:
			"Choose an hour above, then open its minute record. Times use the gym timezone.",
		detailSummary: "Inspect selected hour",
		minute: "Minute",
		state: "State",
		count: "Approx. occupancy",
		noCount: "—",
		selected: "Selected hour",
		pathways: "Continue elsewhere",
		reports: "Reports & export",
		governance: "Settings & access",
		activity: "Activity history",
		health: "System health",
		closer: "Concept-only Owner exploration · no production connection",
		closedTitle: "Closed on the illustrative schedule",
		closedBody:
			"No open minutes were scheduled for this business day. No occupancy line or zero count is invented.",
		closedCoverage: "No open minutes scheduled",
		emptyTitle: "No readings for this day",
		emptyBody:
			"The illustrative schedule contains 360 open minutes, but none has a recorded value. Missing history is not shown as zero.",
		emptyCoverage: "0 of 360 minutes recorded",
		loadingTitle: "Loading the day record",
		loadingBody:
			"The historical day has not resolved. No prior values are shown as if they belong to this request.",
		errorTitle: "The day record did not load",
		errorBody:
			"The historical request failed. Try another example or retry the day record.",
		retry: "Retry sample",
		statusObserved: "Observed",
		statusMissing: "Missing observation",
		statusClosed: "Scheduled closed",
		sampleNav: "Concept destinations only",
	},
	ar: {
		owner: "مساحة المالك",
		concept: "تصور استكشافي",
		sample: "بيانات توضيحية فقط",
		lang: "English",
		dayExample: "مثال اليوم",
		currentExample: "مثال الحالة الحالية",
		populated: "يوم مسجّل",
		closed: "مغلق",
		empty: "بلا قراءات",
		loading: "تحميل",
		error: "خطأ",
		fresh: "حديثة",
		stale: "متأخرة",
		unavailable: "غير متاحة",
		day: "الاثنين، 21 سبتمبر 2026",
		title: "اليوم كما سُجّل",
		intro: "النمط المرصود وفجوات هذا اليوم التوضيحي المكتمل في الصالة.",
		currentLabel: "الحالة الحالية · عينة منفصلة",
		currentSource:
			"تأتي الحالة الحالية من لقطة تشغيل منفصلة. سجل اليوم أدناه تاريخي.",
		curFresh: "مفتوح · هادئ · نحو 18 حاضرًا",
		curFreshSub:
			"قراءة توضيحية عند 18:02 بتوقيت الصالة، وكانت حديثة عند 18:04 في هذه العينة.",
		curStale: "مفتوح · آخر قيمة معروفة: نحو 18 حاضرًا",
		curStaleSub:
			"قراءة توضيحية عند 18:02 بتوقيت الصالة. التحديثات متأخرة، وهذا ليس عددًا حاليًا.",
		curClosed: "مغلق حسب الجدول",
		curClosedSub: "لا نعرض مستوى ازدحام أو عددًا حاليًا أثناء الإغلاق.",
		curUnavailable: "الإشغال الحالي غير متاح",
		curUnavailableSub: "لا توجد قراءة حالية قابلة للاستخدام في هذه العينة.",
		curLoading: "جارٍ تحميل الحالة الحالية",
		curLoadingSub: "لم تصل اللقطة الحالية بعد.",
		curError: "تعذر تحميل الحالة الحالية",
		curErrorSub: "فشل طلب اللقطة. لا نعرض قراءة حالية محفوظة.",
		recordTitle: "سجل الرصد",
		recordSub: "يوم العمل المحدد · بتوقيت الصالة",
		coverage: "دقيقة عمل مسجّلة",
		context: "النمط المرصود",
		contextSub: "تظهر قراءة كل ساعة مع الدقائق المفقودة منها.",
		time: "الساعة",
		pattern: "الدقائق المسجّلة",
		average: "المتوسط",
		range: "المدى",
		zero: "صفر فعلي",
		recorded: "مسجّلة",
		missing: "مفقودة",
		preClosed: "مغلق قبل 12:00",
		postClosed: "مغلق بعد 18:00",
		expected: "360 دقيقة عمل مجدولة",
		peak: "أعلى قيمة مرصودة",
		peakAt: "38 شخصًا عند 16:42",
		mean: "المتوسط اليومي",
		meanValue: "17 شخصًا",
		crossing: "عبور دخول تقديري",
		crossingValue: "94",
		noteTitle: "ما يثبته السجل",
		note: "تبيّن التغطية اكتمال الرصد خلال ساعات العمل المجدولة، وليست درجة ثقة. الدقيقة المفقودة بلا عدد؛ أما الصفر المسجّل فهو قيمة مرصودة.",
		legend: "دلالة العلامات",
		observed: "دقيقة مرصودة",
		gap: "رصد مفقود",
		closure: "إغلاق مجدول",
		source: "المصدر",
		device: "قراءة الجهاز",
		backfill: "سُجّلت لاحقًا",
		manual: "أُدخلت يدويًا",
		footA: "سُجّلت 318 من 360 دقيقة عمل",
		footB: "تبقى 42 دقيقة مفقودة ظاهرة في السجل.",
		detailTitle: "دليل الدقائق",
		detailIntro: "اختر ساعة أعلاه ثم افتح سجل دقائقها. الأوقات بتوقيت الصالة.",
		detailSummary: "افحص الساعة المحددة",
		minute: "الدقيقة",
		state: "الحالة",
		count: "الإشغال التقريبي",
		noCount: "—",
		selected: "الساعة المحددة",
		pathways: "انتقل إلى قسم آخر",
		reports: "التقارير والتصدير",
		governance: "الإعدادات والصلاحيات",
		activity: "سجل النشاط",
		health: "حالة النظام",
		closer: "تصور استكشافي للمالك · غير مرتبط بالإنتاج",
		closedTitle: "مغلق حسب الجدول التوضيحي",
		closedBody:
			"لا توجد دقائق عمل مجدولة في هذا اليوم. لا نختلق منحنى إشغال أو عددًا يساوي صفرًا.",
		closedCoverage: "لا توجد دقائق عمل مجدولة",
		emptyTitle: "لا توجد قراءات لهذا اليوم",
		emptyBody:
			"يتضمن الجدول التوضيحي 360 دقيقة عمل، لكن لم تُسجّل أي قيمة. لا نعرض السجل المفقود كصفر.",
		emptyCoverage: "0 من 360 دقيقة مسجّلة",
		loadingTitle: "جارٍ تحميل سجل اليوم",
		loadingBody:
			"لم تصل بيانات اليوم التاريخية بعد. لا نعرض قيمًا سابقة على أنها تخص هذا الطلب.",
		errorTitle: "تعذر تحميل سجل اليوم",
		errorBody: "فشل طلب السجل التاريخي. اختر مثالًا آخر أو أعد المحاولة.",
		retry: "إعادة تجربة العينة",
		statusObserved: "مرصود",
		statusMissing: "رصد مفقود",
		statusClosed: "إغلاق مجدول",
		sampleNav: "وجهات توضيحية فقط",
	},
};

const windows = [
	{ hour: 12, observed: 54, base: 0, spread: 0 },
	{ hour: 13, observed: 60, base: 9, spread: 3 },
	{ hour: 14, observed: 40, base: 17, spread: 3 },
	{ hour: 15, observed: 60, base: 24, spread: 3 },
	{ hour: 16, observed: 44, base: 33, spread: 5 },
	{ hour: 17, observed: 60, base: 20, spread: 4 },
];
function minuteData(window) {
	return Array.from({ length: 60 }, (_, minute) => {
		if (minute >= window.observed)
			return { minute, state: "missing", count: null, source: null };
		const count =
			window.spread === 0
				? 0
				: window.base +
					Math.round(Math.sin((minute + window.hour * 3) / 7) * window.spread);
		const source =
			window.hour === 14 && minute < 29
				? "backfill"
				: window.hour === 16 && minute >= 40
					? "manual"
					: "device";
		return {
			minute,
			state: "value",
			count:
				window.hour === 16 ? (minute === 42 ? 38 : Math.min(count, 37)) : count,
			source,
		};
	});
}
const hours = windows.map((window) => ({
	...window,
	minutes: minuteData(window),
}));
const pad = (n) => String(n).padStart(2, "0");
function number(n) {
	return new Intl.NumberFormat(`${lang}-u-nu-latn`, {
		maximumFractionDigits: 0,
	}).format(n);
}
function option(value, label, selected) {
	return `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`;
}
function setParams() {
	const next = new URLSearchParams({
		lang,
		day: dayState,
		current: currentState,
	});
	history.replaceState(null, "", `?${next}`);
}
function renderCurrent(t) {
	const table = {
		fresh: ["curFresh", "curFreshSub"],
		stale: ["curStale", "curStaleSub"],
		closed: ["curClosed", "curClosedSub"],
		unavailable: ["curUnavailable", "curUnavailableSub"],
		loading: ["curLoading", "curLoadingSub"],
		error: ["curError", "curErrorSub"],
	};
	const [main, sub] = table[currentState];
	const klass = ["stale", "closed"].includes(currentState)
		? "is-muted"
		: ["unavailable", "loading", "error"].includes(currentState)
			? "is-empty"
			: "";
	return `<aside class="current ${klass}" aria-label="${t.currentLabel}"><div class="current-label">${t.currentLabel}</div><div class="current-main">${t[main]}</div><div class="current-sub">${t[sub]}</div><div class="current-source">${t.currentSource}</div></aside>`;
}
function hourRow(w, t) {
	const counts = w.minutes
		.filter((x) => x.state === "value")
		.map((x) => x.count);
	const avg = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);
	const min = Math.min(...counts);
	const max = Math.max(...counts);
	const gap = 60 - w.observed;
	const sources = [
		...new Set(w.minutes.filter((x) => x.source).map((x) => x.source)),
	]
		.map((s) => t[s])
		.join(" · ");
	return `<button type="button" class="hour${avg === 0 ? " lane-zero" : ""}" data-hour="${w.hour}" aria-pressed="${selectedHour === w.hour}" aria-label="${pad(w.hour)}:00, ${w.observed} ${t.recorded}, ${gap} ${t.missing}, ${t.average} ${avg}"><time datetime="${pad(w.hour)}:00">${pad(w.hour)}:00</time><span class="lane" aria-hidden="true"><span class="lane-fill" style="--coverage:${(w.observed / 60) * 100}%"></span><span class="lane-gap" style="--gap:${(gap / 60) * 100}%"></span></span><span class="hour-reading"><strong>${number(avg)}</strong><small>${t.average}</small></span><span class="hour-meta"><span><bdi dir="ltr">${number(w.observed)} / 60</bdi> ${t.recorded}${gap ? ` · <b class="gap">${number(gap)} ${t.missing}</b>` : ""}</span><span>${min === 0 && max === 0 ? t.zero : `${t.range} <bdi dir="ltr">${number(min)}–${number(max)}</bdi>`} · ${sources}</span></span></button>`;
}
function renderRecord(t) {
	if (dayState !== "populated") {
		const kinds = {
			closed: ["closedTitle", "closedBody", "closedCoverage"],
			empty: ["emptyTitle", "emptyBody", "emptyCoverage"],
			loading: ["loadingTitle", "loadingBody", null],
			error: ["errorTitle", "errorBody", null],
		};
		const [title, body, coverage] = kinds[dayState];
		return `<section class="record"><div class="record-top"><div><h2>${t.recordTitle}</h2><p>${t.recordSub}</p></div></div><div class="record-${dayState === "closed" ? "closed" : "empty"}" role="status"><h3>${t[title]}</h3><p>${t[body]}</p>${coverage ? `<p><strong>${t[coverage]}</strong></p>` : ""}${dayState === "error" ? `<button class="tool" id="retry">${t.retry}</button>` : ""}</div></section>`;
	}
	return `<section class="record" aria-label="${t.recordTitle}"><div class="record-top"><div><h2>${t.recordTitle}</h2><p>${t.recordSub}</p></div><div class="coverage-number"><strong><bdi dir="ltr">318 / 360</bdi></strong><span>${t.coverage}</span></div></div><div class="record-context"><strong>${t.context}</strong><span>${t.contextSub}</span></div><div class="grid-head"><span>${t.time}</span><span>${t.pattern}</span><span>${t.average}</span></div><div class="closed-band">${t.preClosed}</div><div class="hour-list">${hours.map((w) => hourRow(w, t)).join("")}</div><div class="closed-band">${t.postClosed}</div><div class="record-foot"><span><b>${t.footA}</b></span><span>${t.footB}</span></div></section>`;
}
function renderMargin(t) {
	if (dayState !== "populated")
		return `<aside class="margin"><section class="margin-section"><h2>${t.noteTitle}</h2><p>${t[dayState === "closed" ? "closedBody" : dayState === "empty" ? "emptyBody" : dayState === "loading" ? "loadingBody" : "errorBody"]}</p></section></aside>`;
	return `<aside class="margin"><section class="margin-section"><h2>${t.noteTitle}</h2><div class="evidence-number"><bdi dir="ltr">318 <small>/ 360</small></bdi></div><p>${t.coverage}. ${t.note}</p><div class="fact"><span>${t.peak}</span><b>${t.peakAt}</b></div><div class="fact"><span>${t.mean}</span><b>${t.meanValue}</b></div><div class="fact"><span>${t.crossing}</span><b>${t.crossingValue}</b></div></section><section class="margin-section"><h2>${t.legend}</h2><div class="key"><div class="key-item"><i class="key-swatch"></i>${t.observed}</div><div class="key-item"><i class="key-swatch gap"></i>${t.gap}</div><div class="key-item"><i class="key-swatch closed"></i>${t.closure}</div><div class="key-item"><i class="key-swatch zero"></i>${t.zero}</div></div><p class="key-text">${t.source}: ${t.device} · ${t.backfill} · ${t.manual}</p></section></aside>`;
}
function renderMinutes(t) {
	const w = hours.find((x) => x.hour === selectedHour);
	return `<div class="table-scroll"><table class="minute-table"><caption class="sr-only">${t.selected} ${pad(w.hour)}:00</caption><thead><tr><th scope="col">${t.minute}</th><th scope="col">${t.state}</th><th scope="col">${t.count}</th><th scope="col">${t.source}</th></tr></thead><tbody>${w.minutes.map((m) => `<tr><td><bdi>${pad(w.hour)}:${pad(m.minute)}</bdi></td><td>${m.state === "value" ? t.statusObserved : t.statusMissing}</td><td>${m.count === null ? t.noCount : number(m.count)}</td><td>${m.source ? t[m.source] : t.noCount}</td></tr>`).join("")}</tbody></table></div>`;
}
function render() {
	const t = copy[lang];
	document.documentElement.lang = lang;
	document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
	document.title = `${t.title} — FITWAY`;
	app.innerHTML = `<div class="shell"><header class="mast"><a class="brand" href="#top" aria-label="FITWAY"><span class="brand-mark" aria-hidden="true"></span>FITWAY</a><div class="mast-note">${t.owner}</div><div class="tools"><label class="sr-only" for="day-state">${t.dayExample}</label><span class="select-wrap"><select class="tool" id="day-state">${["populated", "closed", "empty", "loading", "error"].map((x) => option(x, t[x], dayState)).join("")}</select></span><label class="sr-only" for="current-state">${t.currentExample}</label><span class="select-wrap"><select class="tool" id="current-state">${["fresh", "stale", "closed", "unavailable", "loading", "error"].map((x) => option(x, t[x], currentState)).join("")}</select></span><button class="tool" id="language" type="button">${t.lang}</button></div></header><div class="concept-note"><span><b>${t.concept}</b> · ${t.sample}</span><span>${t.sampleNav}</span></div><main id="top"><section class="head">${renderCurrent(t)}<div class="head-intro"><span class="day">${t.day}</span><h1>${t.title}</h1><p>${t.intro}</p></div></section><div class="body-grid">${renderRecord(t)}${renderMargin(t)}</div><div class="below"><section><h2>${t.detailTitle}</h2><p>${t.detailIntro}</p>${dayState === "populated" ? `<details class="disclosure"><summary>${t.detailSummary}: <bdi>${pad(selectedHour)}:00</bdi></summary>${renderMinutes(t)}</details>` : ""}</section><section><h2>${t.pathways}</h2><nav class="nav-list" aria-label="${t.pathways}"><a href="#reports">${t.reports}<span aria-hidden="true">↗</span></a><a href="#governance">${t.governance}<span aria-hidden="true">↗</span></a><a href="#activity">${t.activity}<span aria-hidden="true">↗</span></a><a href="#health">${t.health}<span aria-hidden="true">↗</span></a></nav><p class="mini-note">${t.sampleNav}</p></section></div></main><footer class="end"><span>FITWAY · ${t.owner}</span><span>${t.closer}</span></footer></div>`;
	document.querySelectorAll(".nav-list a").forEach((a) => {
		a.removeAttribute("href");
		a.setAttribute("aria-disabled", "true");
	});
	document.getElementById("language").addEventListener("click", () => {
		lang = lang === "en" ? "ar" : "en";
		setParams();
		render();
	});
	document.getElementById("day-state").addEventListener("change", (e) => {
		dayState = e.target.value;
		setParams();
		render();
	});
	document.getElementById("current-state").addEventListener("change", (e) => {
		currentState = e.target.value;
		setParams();
		render();
	});
	document.querySelectorAll("[data-hour]").forEach((el) => {
		el.addEventListener("click", () => {
			selectedHour = Number(el.dataset.hour);
			const open = document.querySelector(".disclosure")?.open;
			render();
			if (open) document.querySelector(".disclosure").open = true;
		});
	});
	document.getElementById("retry")?.addEventListener("click", () => {
		dayState = "populated";
		setParams();
		render();
	});
}
render();
