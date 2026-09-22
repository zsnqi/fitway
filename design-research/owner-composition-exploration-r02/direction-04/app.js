// Concept-only deterministic fixtures. No request, visitor record, or live claim is made.
const params = new URLSearchParams(location.search);
const locale = params.get("lang") === "ar" ? "ar" : "en";
const scenarios = new Set([
	"populated",
	"closed",
	"no-readings",
	"loading",
	"error",
	"stale",
	"unavailable",
]);
const scenario = scenarios.has(params.get("state"))
	? params.get("state")
	: "populated";
document.documentElement.lang = locale;
document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
document.title =
	locale === "ar" ? "FITWAY — الملف المفتوح" : "FITWAY — The Black Folio";

const copy = {
	en: {
		skip: "Skip to content",
		owner: "Owner",
		overview: "Overview",
		reports: "Reports",
		system: "System status",
		language: "العربية",
		preview: "Concept preview · illustrative data",
		title: "A clear view of the floor.",
		date: "Tuesday, 22 September 2026 · gym time",
		nowOpen: "The floor is open.",
		nowClosed: "The floor is closed.",
		nowStale: "The last reading is delayed.",
		nowUnavailable: "Current occupancy is unavailable.",
		nowLoading: "Checking the floor.",
		nowError: "We could not reach the floor.",
		quiet: "Quiet",
		about: "about 18 people",
		lastKnown: "last known: about 18 people",
		freshDetail: "Current estimate · last updated 11:41 AM",
		staleDetail: "Last known estimate from 11:12 AM. Updates are delayed.",
		closedDetail: "Scheduled closure. Next opening is shown when known.",
		unavailableDetail: "No usable current estimate is available.",
		loadingDetail: "Waiting for the current reading.",
		errorDetail: "The request failed. Try again to check current status.",
		fresh: "Current reading",
		stale: "Delayed reading",
		closed: "Closed by schedule",
		unavailable: "No current reading",
		loading: "Loading",
		error: "Request failed",
		retry: "Try again",
		nowEvidence: "Latest check at 11:41 AM.",
		today: "Today's recorded hours",
		through: "Selected readings through 11:42 AM",
		noToday: "No readings for today",
		closedToday: "No scheduled open hours today",
		todayLoading: "Loading today's record",
		todayError: "Today's record could not load",
		dayGlance: "A quiet opening, then a late-morning rise.",
		peak: "Peak observed",
		peakValue: "31 people",
		peakTime: "10:00 AM",
		coverage: "Displayed checkpoints",
		coverageValue: "10 of 12 observed",
		coverageHint: "through 11:42 AM",
		explore: "Explore today's record",
		separate: "Today's curve is history, not the current floor.",
		synthetic: "Illustrative values for concept review only.",
		record: "Read the day",
		recordIntro:
			"Follow only observed hours. The unfinished part of the scheduled day is outside this record.",
		recordTitle: "Selected readings",
		recordSubtitle:
			"Gym-local time · historical observations, not a live signal",
		observed: "Observed",
		missing: "No reading",
		scheduled: "Scheduled closed",
		from: "5:30 AM",
		to: "11:42 AM",
		recordFoot:
			"A true zero is an observed count. An absent reading breaks the line; scheduled closure has its own interval. These selected checkpoints do not stand in for every minute of the day.",
		tableShow: "Show reading table",
		tableHide: "Hide reading table",
		time: "Time",
		state: "State",
		count: "Approx. count",
		investigate: "Follow a question",
		investigateIntro:
			"Open one part of the record at a time. Detail waits until you need it.",
		qPeak: "When was the floor busiest?",
		qCoverage: "Where is the record incomplete?",
		qReports: "What should I review next?",
		aPeakTitle: "The late-morning high",
		aPeak:
			"The highest selected observation was at 10:00 AM. It describes that moment only, not the whole hour or the current floor.",
		aCoverageTitle: "One gap in the observed hours",
		aCoverage:
			"Two displayed checkpoints have no reading. The curve stops through that interval and resumes only when an observation returns.",
		aReportsTitle: "Move from this day to a broader pattern",
		aReports:
			"Reports compare days and hours using their own historical coverage. A single day should not be treated as a forecast.",
		observedAt: "selected observation",
		missingAt: "8:30–9:00 AM",
		review: "Reports can show the wider pattern",
		next: "Continue beyond this day",
		nextIntro:
			"Reports, system status, and access settings stay separate from the first-glance overview.",
		nextItems: [
			"Reporting and exports",
			"System health and incidents",
			"Access and settings",
		],
		foot: "FITWAY Owner · concept-only exploration",
		foot2: "Illustrative states · no production data",
		noReadingDetail:
			"There are scheduled open hours, but no usable observations have arrived. No count, trend, or peak is inferred.",
		closedDayDetail:
			"There are no scheduled open minutes today. No count or trend is shown.",
		loadingDayDetail:
			"Waiting for the historical record. No trend is shown yet.",
		errorDayDetail:
			"The historical request failed. No retained record is presented as current.",
		noDataQuestion: "What can be concluded?",
		noDataAnswer:
			"There is no usable historical trend for this view. Check again when the record is available.",
		statusUnavailable:
			"Current occupancy is unavailable. Today's observed record below remains historical.",
		statusStale:
			"The value is last known, not current. Today's record remains historical.",
		statusClosed:
			"The gym is closed by schedule; no current occupancy is shown.",
	},
	ar: {
		skip: "تجاوز إلى المحتوى",
		owner: "المالك",
		overview: "نظرة عامة",
		reports: "التقارير",
		system: "حالة النظام",
		language: "English",
		preview: "تصور مبدئي · بيانات توضيحية",
		title: "صورة واضحة عن الصالة.",
		date: "الثلاثاء، 22 سبتمبر 2026 · بتوقيت الصالة",
		nowOpen: "الصالة مفتوحة.",
		nowClosed: "الصالة مغلقة.",
		nowStale: "آخر قراءة متأخرة.",
		nowUnavailable: "الإشغال الحالي غير متاح.",
		nowLoading: "جارٍ التحقق من الصالة.",
		nowError: "تعذر الوصول إلى حالة الصالة.",
		quiet: "هادئ",
		about: "نحو 18 شخصًا",
		lastKnown: "آخر قيمة معروفة: نحو 18 شخصًا",
		freshDetail: "تقدير حالي · آخر تحديث 11:41 ص",
		staleDetail: "آخر تقدير معروف عند 11:12 ص. التحديثات متأخرة.",
		closedDetail: "إغلاق حسب الجدول. يظهر موعد الفتح القادم عندما يكون معروفًا.",
		unavailableDetail: "لا يتوفر تقدير حالي صالح للاستخدام.",
		loadingDetail: "بانتظار القراءة الحالية.",
		errorDetail: "فشل الطلب. حاول مرة أخرى للتحقق من الحالة.",
		fresh: "قراءة حالية",
		stale: "قراءة متأخرة",
		closed: "مغلق حسب الجدول",
		unavailable: "لا توجد قراءة حالية",
		loading: "جارٍ التحميل",
		error: "فشل الطلب",
		retry: "إعادة المحاولة",
		nowEvidence: "آخر تحقق عند 11:41 ص.",
		today: "الساعات المسجلة اليوم",
		through: "قراءات مختارة حتى 11:42 ص",
		noToday: "لا توجد قراءات لليوم",
		closedToday: "لا توجد ساعات فتح مجدولة اليوم",
		todayLoading: "جارٍ تحميل سجل اليوم",
		todayError: "تعذر تحميل سجل اليوم",
		dayGlance: "بداية هادئة، ثم ارتفاع قبيل الظهر.",
		peak: "أعلى قراءة",
		peakValue: "31 شخصًا",
		peakTime: "10:00 ص",
		coverage: "النقاط المعروضة",
		coverageValue: "10 من 12 مرصودة",
		coverageHint: "حتى 11:42 ص",
		explore: "استكشف سجل اليوم",
		separate: "منحنى اليوم تاريخي، ولا يصف حالة الصالة الآن.",
		synthetic: "قيم توضيحية لمراجعة التصور فقط.",
		record: "اقرأ اليوم",
		recordIntro:
			"اتبع الساعات المرصودة فقط. ما تبقى من اليوم المجدول خارج هذا السجل.",
		recordTitle: "قراءات مختارة",
		recordSubtitle: "بتوقيت الصالة · مشاهدات تاريخية وليست إشارة مباشرة",
		observed: "مرصود",
		missing: "لا توجد قراءة",
		scheduled: "إغلاق مجدول",
		from: "5:30 ص",
		to: "11:42 ص",
		recordFoot:
			"الصفر الحقيقي قراءة مرصودة. تنقطع الخطوط عند غياب القراءة، ويظهر الإغلاق المجدول منفصلًا. هذه النقاط المختارة لا تمثل كل دقيقة من اليوم.",
		tableShow: "عرض جدول القراءات",
		tableHide: "إخفاء جدول القراءات",
		time: "الوقت",
		state: "الحالة",
		count: "العدد التقريبي",
		investigate: "تابع سؤالًا",
		investigateIntro:
			"افتح جزءًا واحدًا من السجل في كل مرة. التفاصيل تظهر عند الحاجة.",
		qPeak: "متى كانت الصالة أكثر ازدحامًا؟",
		qCoverage: "أين تنقص القراءات؟",
		qReports: "ماذا أراجع بعد ذلك؟",
		aPeakTitle: "أعلى قراءة قبيل الظهر",
		aPeak:
			"كانت أعلى قراءة مختارة عند 10:00 ص. تصف تلك اللحظة فقط، ولا تصف الساعة كلها أو حالة الصالة الآن.",
		aCoverageTitle: "فجوة في الساعات المرصودة",
		aCoverage:
			"لا توجد قراءة لنقطتين معروضتين. ينقطع المنحنى خلال هذه الفترة ولا يُستأنف إلا عند عودة القراءة.",
		aReportsTitle: "من هذا اليوم إلى نمط أوسع",
		aReports:
			"تقارن التقارير الأيام والساعات مع مراعاة تغطية البيانات التاريخية. لا يُعد يوم واحد توقعًا للمستقبل.",
		observedAt: "قراءة مختارة",
		missingAt: "8:30–9:00 ص",
		review: "يمكن للتقارير إظهار النمط الأوسع",
		next: "تابع لما بعد هذا اليوم",
		nextIntro:
			"تبقى التقارير وحالة النظام وإعدادات الوصول منفصلة عن النظرة الأولى.",
		nextItems: [
			"التقارير والتصدير",
			"صحة النظام والحوادث",
			"الوصول والإعدادات",
		],
		foot: "FITWAY للمالك · تصور للاستكشاف فقط",
		foot2: "حالات توضيحية · دون بيانات إنتاج",
		noReadingDetail:
			"توجد ساعات فتح مجدولة، لكن لم تصل قراءات صالحة. لا يُستنتج عدد أو اتجاه أو ذروة.",
		closedDayDetail: "لا توجد دقائق فتح مجدولة اليوم. لا يظهر عدد أو اتجاه.",
		loadingDayDetail: "بانتظار السجل التاريخي. لا يظهر اتجاه بعد.",
		errorDayDetail:
			"فشل طلب السجل التاريخي. لا تُعرض بيانات محفوظة وكأنها حالية.",
		noDataQuestion: "ما الذي يمكن استنتاجه؟",
		noDataAnswer:
			"لا يتوفر اتجاه تاريخي صالح لهذه الصفحة. تحقق مرة أخرى عند توفر السجل.",
		statusUnavailable:
			"الإشغال الحالي غير متاح. يظل سجل اليوم المرصود أدناه تاريخيًا.",
		statusStale: "هذه آخر قيمة معروفة وليست حالية. يظل سجل اليوم تاريخيًا.",
		statusClosed: "الصالة مغلقة حسب الجدول، ولا يظهر إشغال حالي.",
	},
}[locale];

const checkpoints = [
	{ time: "5:30", ar: "5:30 ص", state: "closed", count: null },
	{ time: "6:00", ar: "6:00 ص", state: "value", count: 0 },
	{ time: "6:30", ar: "6:30 ص", state: "value", count: 4 },
	{ time: "7:00", ar: "7:00 ص", state: "value", count: 12 },
	{ time: "7:30", ar: "7:30 ص", state: "value", count: 22 },
	{ time: "8:00", ar: "8:00 ص", state: "value", count: 26 },
	{ time: "8:30", ar: "8:30 ص", state: "missing", count: null },
	{ time: "9:00", ar: "9:00 ص", state: "missing", count: null },
	{ time: "9:30", ar: "9:30 ص", state: "value", count: 24 },
	{ time: "10:00", ar: "10:00 ص", state: "value", count: 31 },
	{ time: "10:30", ar: "10:30 ص", state: "value", count: 25 },
	{ time: "11:00", ar: "11:00 ص", state: "value", count: 18 },
	{ time: "11:42", ar: "11:42 ص", state: "value", count: 18 },
];
const dailyState =
	scenario === "closed"
		? "closed"
		: scenario === "no-readings"
			? "no-readings"
			: scenario === "loading"
				? "loading"
				: scenario === "error"
					? "error"
					: "populated";
const snapshotState =
	scenario === "no-readings"
		? "unavailable"
		: scenario === "populated"
			? "fresh"
			: scenario;
const arrow =
	'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
function query(next) {
	const q = new URLSearchParams(location.search);
	Object.entries(next).forEach(([k, v]) => {
		q.set(k, v);
	});
	return `?${q}`;
}
function snapshot() {
	const s = snapshotState;
	const titles = {
		fresh: copy.nowOpen,
		stale: copy.nowStale,
		closed: copy.nowClosed,
		unavailable: copy.nowUnavailable,
		loading: copy.nowLoading,
		error: copy.nowError,
	};
	const detail = {
		fresh: copy.freshDetail,
		stale: copy.staleDetail,
		closed: copy.closedDetail,
		unavailable: copy.unavailableDetail,
		loading: copy.loadingDetail,
		error: copy.errorDetail,
	};
	const status = {
		fresh: copy.fresh,
		stale: copy.stale,
		closed: copy.closed,
		unavailable: copy.unavailable,
		loading: copy.loading,
		error: copy.error,
	};
	const readable = s === "fresh" || s === "stale";
	const support =
		s === "fresh"
			? copy.nowEvidence
			: s === "stale"
				? copy.statusStale
				: s === "closed"
					? copy.statusClosed
					: s === "error"
						? `<a href="${query({ state: "populated" })}">${copy.retry}</a>`
						: s === "loading"
							? copy.loadingDetail
							: copy.statusUnavailable;
	return `<section class="now" aria-labelledby="now-title"><div><h2 id="now-title" class="now-title">${titles[s]}</h2>${readable ? `<div class="now-context"><span class="band">${copy.quiet}</span><i class="dot" aria-hidden="true"></i><span>${s === "stale" ? copy.lastKnown : copy.about}</span></div>` : ""}<p class="now-copy">${detail[s]}</p></div><div class="now-freshness" role="status"><span class="status-symbol" aria-hidden="true">${s === "fresh" ? "✓" : s === "loading" ? "…" : "!"}</span><b>${status[s]}</b><span>${support}</span></div></section>`;
}
function xAt(i, w = 1000) {
	const x = 40 + i * (920 / (checkpoints.length - 1));
	return locale === "ar" ? w - x : x;
}
function yAt(count, h = 240) {
	return h - 32 - count * 5.1;
}
function runs() {
	const out = [];
	let run = [];
	checkpoints.forEach((point, i) => {
		if (point.state === "value") run.push([i, point.count]);
		else if (run.length) {
			out.push(run);
			run = [];
		}
	});
	if (run.length) out.push(run);
	return out;
}
function pathFor(run, h = 240) {
	return run
		.map(
			([i, n], k) =>
				`${k ? "L" : "M"}${xAt(i).toFixed(1)} ${yAt(n, h).toFixed(1)}`,
		)
		.join(" ");
}
function svgTimeline(small = false) {
	const h = small ? 160 : 240;
	const y = (n) => yAt(n, h);
	const line = runs()
		.map(
			(run) =>
				`<path class="${small ? "trace-line" : "timeline-line"}" d="${pathFor(run, h)}"/>`,
		)
		.join("");
	const zero = checkpoints
		.map((p, i) =>
			p.state === "value" && p.count === 0
				? `<circle class="${small ? "trace-point" : "timeline-zero"}" cx="${xAt(i)}" cy="${y(0)}" r="${small ? 4 : 7}"/>`
				: "",
		)
		.join("");
	if (small)
		return `<svg class="glance-trace" viewBox="0 0 1000 160" preserveAspectRatio="none" aria-hidden="true"><line class="trace-guide" x1="40" x2="960" y1="132" y2="132"/>${line}${zero}</svg>`;
	const missingStart = Math.min(xAt(6), xAt(7)) - 24;
	const closeStart = Math.min(xAt(0), xAt(1)) - 24;
	return `<svg class="timeline" viewBox="0 0 1000 240" preserveAspectRatio="none" role="img" aria-label="${copy.recordFoot}"><rect class="timeline-open" x="${closeStart}" y="15" width="${Math.abs(xAt(0) - xAt(1)) + 48}" height="193"/><rect class="timeline-missing" x="${missingStart}" y="15" width="${Math.abs(xAt(6) - xAt(7)) + 48}" height="193"/><line class="timeline-grid" x1="40" x2="960" y1="208" y2="208"/><line class="timeline-grid" x1="40" x2="960" y1="112" y2="112"/>${line}${zero}</svg>`;
}
function dayGlance() {
	if (dailyState !== "populated") {
		const title = {
			closed: copy.closedToday,
			"no-readings": copy.noToday,
			loading: copy.todayLoading,
			error: copy.todayError,
		}[dailyState];
		const description = {
			closed: copy.closedDayDetail,
			"no-readings": copy.noReadingDetail,
			loading: copy.loadingDayDetail,
			error: copy.errorDayDetail,
		}[dailyState];
		return `<section class="record-glance" aria-labelledby="glance-title"><div class="record-top"><h2 id="glance-title">${title}</h2></div>${dailyState === "loading" ? '<div class="skeleton" aria-hidden="true"><i></i><i></i><i></i></div>' : ""}<p class="now-copy">${description}</p></section>`;
	}
	return `<section class="record-glance" aria-labelledby="glance-title"><div class="record-top"><h2 id="glance-title">${copy.today}</h2><span>${copy.through}</span></div>${svgTimeline(true)}<div class="record-times"><span><bdi>${copy.from}</bdi></span><span><bdi>${copy.to}</bdi></span></div><div class="record-summary"><div><small>${copy.peak}</small><strong>${copy.peakValue}</strong><span><bdi>${copy.peakTime}</bdi></span></div><div><small>${copy.coverage}</small><strong>${copy.coverageValue}</strong><span>${copy.coverageHint}</span></div></div><a class="explore" href="#record">${copy.explore}${arrow}</a></section>`;
}
function record() {
	const head = `<div class="section-heading"><h2 id="record-title">${copy.record}</h2><p>${copy.recordIntro}</p></div>`;
	if (dailyState !== "populated") {
		const title = {
			closed: copy.closedToday,
			"no-readings": copy.noToday,
			loading: copy.todayLoading,
			error: copy.todayError,
		}[dailyState];
		const description = {
			closed: copy.closedDayDetail,
			"no-readings": copy.noReadingDetail,
			loading: copy.loadingDayDetail,
			error: copy.errorDayDetail,
		}[dailyState];
		return `<section class="page-section" id="record" aria-labelledby="record-title">${head}<div class="empty-sheet" role="status"><h3>${title}</h3><p>${description}</p></div></section>`;
	}
	const rows = checkpoints
		.map(
			(p) =>
				`<tr><td><bdi>${locale === "ar" ? p.ar : p.time + (Number(p.time.split(":")[0]) < 12 ? " AM" : " PM")}</bdi></td><td>${p.state === "value" ? copy.observed : p.state === "closed" ? copy.scheduled : copy.missing}</td><td>${p.state === "value" ? p.count : "—"}</td></tr>`,
		)
		.join("");
	return `<section class="page-section" id="record" aria-labelledby="record-title">${head}<div class="day-sheet"><div class="day-sheet-head"><div><h3>${copy.recordTitle}</h3><p>${copy.recordSubtitle}</p></div><div class="legend"><span><i></i>${copy.observed}</span><span class="missing"><i></i>${copy.missing}</span><span class="closed"><i></i>${copy.scheduled}</span></div></div>${svgTimeline()}<div class="axis"><span><bdi>${copy.from}</bdi></span><span><bdi>${copy.to}</bdi></span></div><div class="record-foot"><p>${copy.recordFoot}</p><button id="table-toggle" type="button" aria-expanded="false" aria-controls="reading-table">${copy.tableShow}</button></div><div class="semantic-table" id="reading-table" tabindex="0" role="region" aria-label="${copy.recordTitle}" hidden><table><thead><tr><th scope="col">${copy.time}</th><th scope="col">${copy.state}</th><th scope="col">${copy.count}</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>`;
}
function questionAnswer(index) {
	if (dailyState !== "populated")
		return `<h3>${copy.noDataQuestion}</h3><p>${copy.noDataAnswer}</p>`;
	const choices = [
		`<h3>${copy.aPeakTitle}</h3><p>${copy.aPeak}</p><div class="answer-data"><strong>${copy.peakValue}</strong><span>${copy.observedAt} · <bdi>${copy.peakTime}</bdi></span></div>`,
		`<h3>${copy.aCoverageTitle}</h3><p>${copy.aCoverage}</p><div class="answer-data"><strong><bdi>${copy.missingAt}</bdi></strong><span>${copy.missing}</span></div>`,
		`<h3>${copy.aReportsTitle}</h3><p>${copy.aReports}</p><span class="answer-link">${copy.review} ${locale === "ar" ? "←" : "→"}</span>`,
	];
	return choices[index];
}
function investigate() {
	const labels =
		dailyState === "populated"
			? [copy.qPeak, copy.qCoverage, copy.qReports]
			: [copy.noDataQuestion];
	return `<section class="investigate" aria-labelledby="investigate-title"><div class="section-heading investigate-heading"><h2 id="investigate-title">${copy.investigate}</h2><p>${copy.investigateIntro}</p></div><div class="question-layout"><div class="question-list" role="group" aria-label="${copy.investigate}">${labels.map((s, i) => `<button class="question" type="button" data-question="${i}" aria-controls="answer" aria-expanded="${i === 0}"><span>${s}</span>${arrow}</button>`).join("")}</div><div id="answer" class="answer" role="region" aria-live="polite">${questionAnswer(0)}</div></div></section>`;
}
document.querySelector("#app").innerHTML =
	`<header class="site-head"><div class="shell head-inner"><div class="brand"><i class="brand-mark" aria-hidden="true"></i>FITWAY<small>${copy.owner}</small></div><nav class="head-actions" aria-label="${copy.owner}"><a href="#main" aria-current="page">${copy.overview}</a><button class="lang" type="button" id="lang" aria-label="${locale === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}">${copy.language}</button></nav></div></header><main id="main" tabindex="-1"><div class="shell"><p class="concept-note"><i aria-hidden="true"></i>${copy.preview}</p><div class="intro"><h1>${copy.title}</h1><p>${copy.date}</p></div><div class="folio"><div class="folio-main">${snapshot()}${dayGlance()}</div></div><div class="orientation-note"><p>${copy.separate}</p><p>${copy.synthetic}</p></div>${record()}${investigate()}<section class="next" id="end" aria-labelledby="next-title"><div><h2 id="next-title">${copy.next}</h2><p>${copy.nextIntro}</p></div><div class="next-links" aria-label="${copy.next}">${copy.nextItems.map((s) => `<span>${s}</span>`).join("")}</div></section></div></main><footer class="site-foot"><div class="shell"><span>${copy.foot}</span><span>${copy.foot2}</span></div></footer>`;
document.querySelector(".skip").textContent = copy.skip;
document.querySelector("#lang").addEventListener("click", () => {
	location.href = query({ lang: locale === "ar" ? "en" : "ar" });
});
document.querySelectorAll(".question").forEach((button) => {
	button.addEventListener("click", () => {
		const i = Number(button.dataset.question);
		document.querySelectorAll(".question").forEach((b) => {
			b.setAttribute("aria-expanded", String(b === button));
		});
		document.querySelector("#answer").innerHTML = questionAnswer(i);
	});
});
const tableToggle = document.querySelector("#table-toggle");
if (tableToggle)
	tableToggle.addEventListener("click", () => {
		const table = document.querySelector("#reading-table");
		table.hidden = !table.hidden;
		tableToggle.setAttribute("aria-expanded", String(!table.hidden));
		tableToggle.textContent = table.hidden ? copy.tableShow : copy.tableHide;
	});
