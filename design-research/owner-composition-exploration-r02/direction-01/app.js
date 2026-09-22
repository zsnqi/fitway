const labels = {
	en: {
		skip: "Skip to content",
		owner: "OWNER",
		navLabel: "Owner sections",
		overview: "Overview",
		dayRecord: "Day record",
		nextSteps: "Next steps",
		previewState: "Preview state",
		conceptNote: "Concept preview · sample data",
		date: "22 Sep",
		gymTime: "gym time",
		trustHeading: "What we know now",
		dayHeading: "Today, as observed",
		daySub: "Recorded hours, with gaps shown clearly.",
		chartTitle: "Recorded occupancy across open hours",
		observed: "Observed",
		missing: "No data",
		tableSummary: "Show recorded values and hourly states",
		tableRegion: "Historical reading table; scroll horizontally if needed",
		tableCaption: "Illustrative historical readings",
		time: "Time",
		state: "State",
		recordedCount: "Recorded occupancy",
		nextHeading: "From orientation to decision",
		nextIntro: "Go deeper after the data state and today's record are clear.",
		reports: "Reports",
		reportsDesc:
			"Compare equivalent days and review the export range before downloading.",
		operations: "Operations",
		operationsDesc: "Inspect device health and alerts in the operational view.",
		governance: "Governance",
		governanceDesc:
			"Review access, settings, and activity in their dedicated areas.",
		footer: "Concept preview · sample data",
		populated: "Recorded day",
		current: "Sample reading",
		closed: "Closed",
		noReadings: "No readings",
		loading: "Loading",
		error: "Error",
		openBySchedule: "OPEN BY SCHEDULE",
		closedBySchedule: "CLOSED BY SCHEDULE",
		scheduleUnknown: "SCHEDULE NOT YET CHECKED",
		populatedTitle: "Open by schedule. Current crowd unknown.",
		currentTitle: "Open by schedule. A recent sample reading is available.",
		closedTitle: "Closed today. No current crowd reading.",
		noReadingsTitle: "Open by schedule. No readings yet.",
		loadingTitle: "Checking the day’s record.",
		errorTitle: "The day’s record could not load.",
		populatedExplain:
			"Today's chart shows recorded readings, not a current crowd count.",
		currentExplain:
			"This separate sample reading was observed at 21:14. The chart below still shows the recorded day.",
		closedExplain:
			"The sample schedule marks this period closed. Occupancy and crowd band are withheld.",
		noReadingsExplain:
			"The gym is scheduled open, but no readings were recorded. An empty chart does not mean zero.",
		loadingExplain:
			"Checking the schedule and today's record. No crowd value is shown yet.",
		errorExplain:
			"Today's record could not load. No older value is shown as current.",
		unavailable: "Unavailable",
		unavailableDetail: "",
		noValue: "No current value",
		closedDetail: "Closed periods have no count or crowd band.",
		pending: "Pending",
		pendingDetail: "No reading is shown while data loads.",
		errorValue: "Unavailable",
		errorDetail: "Current crowd is also unknown.",
		currentBand: "Moderate",
		currentApprox: "approximate count",
		currentDetail: "Sample checked at 21:15.",
		currentSource: "",
		dailySource: "",
		closedSource: "",
		noReadingsSource: "",
		loadingSource: "",
		errorSource: "",
		businessDay: "Business day · 22 Sep 2026",
		closedDay: "Scheduled closed period · 22 Sep 2026",
		noReadingsDay: "Open period · 22 Sep 2026",
		loadingDay: "Checking today's record",
		errorDay: "Today's record unavailable",
		coverage: "Observed coverage",
		coverageValue: "240 of 300 open minutes",
		coverageNote: "80% of scheduled open minutes; gaps remain visible.",
		peak: "Recorded peak",
		peakValue: "68 at 19:00",
		peakNote: "Historical peak within observed minutes.",
		gap: "Unobserved interval",
		gapValue: "20:00–20:59",
		gapNote: "Missing history is distinct from a recorded zero.",
		chartEmptyClosed: "Closed period — no occupancy curve",
		chartEmptyMissing: "No observed minutes to chart",
		chartEmptyError: "The chart is unavailable while the request has failed",
		chartEmptyLoading: "Loading recorded hours",
		selectPoint: "Select a point to read its recorded value.",
		pointDetail: (time, count) => `${time} · recorded occupancy ${count}`,
		pointAria: (time, count) =>
			`${time}, recorded occupancy ${count}. Select for details.`,
		valueState: "Observed",
		missingState: "No data",
		closedState: "Closed",
		dash: "—",
		switchLanguage: "Switch to Arabic",
		notAvailable: "Not available",
		noPeak: "No observed peak",
		noCoverage: "0 of 300 open minutes",
		none: "No observed interval",
		errorEvidence: "No historical summary while the request has failed",
		loadingEvidence: "Historical summary pending",
		sourceLabel: "Today's record",
	},
	ar: {
		skip: "انتقل إلى المحتوى",
		owner: "المالك",
		navLabel: "أقسام المالك",
		overview: "نظرة عامة",
		dayRecord: "سجل اليوم",
		nextSteps: "المتابعة",
		previewState: "حالة المعاينة",
		conceptNote: "تصوّر · بيانات توضيحية",
		date: "22 سبتمبر",
		gymTime: "بتوقيت النادي",
		trustHeading: "ما الذي نعرفه الآن",
		dayHeading: "اليوم كما رُصد",
		daySub: "الساعات المرصودة مع إظهار الفجوات بوضوح.",
		chartTitle: "الإشغال المرصود عبر ساعات العمل",
		observed: "مرصود",
		missing: "لا توجد بيانات",
		tableSummary: "عرض القيم المرصودة والحالات حسب الساعة",
		tableRegion: "جدول القراءات التاريخية؛ يمكن تمريره أفقيًا عند الحاجة",
		tableCaption: "قراءات تاريخية توضيحية",
		time: "الوقت",
		state: "الحالة",
		recordedCount: "الإشغال المرصود",
		nextHeading: "من النظرة إلى القرار",
		nextIntro: "تفاصيل أعمق عند الحاجة، بعد وضوح حالة البيانات وسجل اليوم.",
		reports: "التقارير",
		reportsDesc: "قارن الأيام المتماثلة وراجع نطاق التصدير قبل تنزيل التقرير.",
		operations: "التشغيل",
		operationsDesc: "افحص صحة الأجهزة والتنبيهات في المسار التشغيلي.",
		governance: "الإدارة",
		governanceDesc: "راجع الوصول والإعدادات وسجل النشاط في مواضعها المخصصة.",
		footer: "معاينة تصورية · بيانات توضيحية",
		populated: "يوم مرصود",
		current: "قراءة توضيحية",
		closed: "مغلق",
		noReadings: "لا قراءات",
		loading: "جارٍ التحميل",
		error: "خطأ",
		openBySchedule: "مفتوح حسب الجدول",
		closedBySchedule: "مغلق حسب الجدول",
		scheduleUnknown: "لم يُتحقق من الجدول بعد",
		populatedTitle: "مفتوح حسب الجدول. الازدحام الحالي غير معروف.",
		currentTitle: "مفتوح حسب الجدول. تتوفر قراءة توضيحية حديثة.",
		closedTitle: "مغلق اليوم. لا توجد قراءة حالية للازدحام.",
		noReadingsTitle: "مفتوح حسب الجدول. لا توجد قراءات بعد.",
		loadingTitle: "جارٍ التحقق من سجل اليوم.",
		errorTitle: "تعذّر تحميل سجل اليوم.",
		populatedExplain: "يعرض مخطط اليوم قراءات سابقة، ولا يبيّن الازدحام الحالي.",
		currentExplain:
			"رُصدت هذه القراءة التوضيحية المنفصلة عند 21:14. يبقى المخطط سجلًا لليوم.",
		closedExplain:
			"يشير الجدول التوضيحي إلى إغلاق هذه الفترة. لا يُعرض عدد إشغال أو مستوى ازدحام.",
		noReadingsExplain:
			"النادي مفتوح حسب الجدول، لكن لا توجد قراءات مرصودة. غياب القراءات لا يعني أن العدد صفر.",
		loadingExplain: "جارٍ التحقق من الجدول وسجل اليوم. لا تُعرض قيمة ازدحام بعد.",
		errorExplain: "تعذّر تحميل سجل اليوم. لا تُعرض قراءة أقدم على أنها حالية.",
		unavailable: "غير متاح",
		unavailableDetail: "",
		noValue: "لا توجد قيمة حالية",
		closedDetail: "لا يحمل وقت الإغلاق عددًا أو مستوى ازدحام.",
		pending: "قيد الانتظار",
		pendingDetail: "لا تُعرض قراءة أثناء التحميل.",
		errorValue: "غير متاح",
		errorDetail: "الازدحام الحالي غير معروف أيضًا.",
		currentBand: "متوسط",
		currentApprox: "عدد تقريبي",
		currentDetail: "قراءة توضيحية تم التحقق منها عند 21:15.",
		currentSource: "",
		dailySource: "",
		closedSource: "",
		noReadingsSource: "",
		loadingSource: "",
		errorSource: "",
		businessDay: "يوم العمل · 22 سبتمبر 2026",
		closedDay: "فترة مغلقة حسب الجدول · 22 سبتمبر 2026",
		noReadingsDay: "فترة عمل · 22 سبتمبر 2026",
		loadingDay: "جارٍ التحقق من سجل اليوم",
		errorDay: "سجل اليوم غير متاح",
		coverage: "تغطية الرصد",
		coverageValue: "240 من 300 دقيقة عمل",
		coverageNote: "80% من دقائق العمل المجدولة؛ تبقى الفجوات ظاهرة.",
		peak: "الذروة المرصودة",
		peakValue: "68 عند 19:00",
		peakNote: "ذروة تاريخية ضمن الدقائق المرصودة.",
		gap: "فترة بلا رصد",
		gapValue: "20:00–20:59",
		gapNote: "غياب البيانات يختلف عن قيمة صفر مرصودة.",
		chartEmptyClosed: "فترة مغلقة — لا منحنى إشغال",
		chartEmptyMissing: "لا توجد دقائق مرصودة لعرضها",
		chartEmptyError: "المخطط غير متاح بعد فشل الطلب",
		chartEmptyLoading: "جارٍ تحميل المشاهدات التاريخية",
		selectPoint: "اختر نقطة لقراءة قيمتها المرصودة.",
		pointDetail: (time, count) => `${time} · الإشغال المرصود ${count}`,
		pointAria: (time, count) =>
			`${time}، الإشغال المرصود ${count}. اختر لإظهار التفاصيل.`,
		valueState: "مرصود",
		missingState: "لا توجد بيانات",
		closedState: "مغلق",
		dash: "—",
		switchLanguage: "Switch to English",
		notAvailable: "غير متاح",
		noPeak: "لا توجد ذروة مرصودة",
		noCoverage: "0 من 300 دقيقة عمل",
		none: "لا توجد فترة مرصودة",
		errorEvidence: "لا ملخص تاريخي بعد فشل الطلب",
		loadingEvidence: "ملخص السجل التاريخي قيد التحميل",
		sourceLabel: "سجل اليوم",
	},
};

// Daily Analytics is historical. The optional "current" state is a separate,
// explicitly illustrative staff.operationalSnapshot fixture.
const timeline = [
	{ time: "16:00", state: "value", count: 18 },
	{ time: "17:00", state: "value", count: 32 },
	{ time: "18:00", state: "value", count: 49 },
	{ time: "19:00", state: "value", count: 68 },
	{ time: "20:00", state: "missing", count: null },
	{ time: "21:00", state: "value", count: 41 },
];
const params = new URLSearchParams(location.search);
let lang = params.get("lang") === "en" ? "en" : "ar";
let fixture = [
	"populated",
	"current",
	"closed",
	"noReadings",
	"loading",
	"error",
].includes(params.get("state"))
	? params.get("state")
	: "populated";
const $ = (id) => document.getElementById(id);
function syncUrl() {
	const u = new URL(location.href);
	u.searchParams.set("lang", lang);
	u.searchParams.set("state", fixture);
	history.replaceState(null, "", u);
}
function evidenceRow(label, value, note) {
	return `<div class="evidence-row"><span>${label}</span><strong>${value}</strong><p>${note}</p></div>`;
}
function setText(id, value) {
	$(id).textContent = value;
}
function renderChart(t) {
	const region = $("chart-region");
	if (fixture === "loading") {
		region.innerHTML =
			'<div class="skeleton one"></div><div class="skeleton two"></div><div class="skeleton three"></div>';
		setText("point-note", "");
		return;
	}
	if (fixture === "closed" || fixture === "noReadings" || fixture === "error") {
		const key =
			fixture === "closed"
				? "chartEmptyClosed"
				: fixture === "error"
					? "chartEmptyError"
					: "chartEmptyMissing";
		region.innerHTML = `<div class="empty-chart">${t[key]}</div>`;
		setText("point-note", "");
		return;
	}
	const compact = matchMedia("(max-width: 720px)").matches;
	const canvasWidth = compact ? 320 : 720;
	const step = compact ? 54.4 : 120;
	const edge = compact ? 24 : 58;
	const x = (i) =>
		lang === "ar" ? canvasWidth - edge - i * step : edge + i * step;
	const y = (count) => 185 - (count / 80) * 150;
	const first = timeline.slice(0, 4);
	const points = first.map((p, i) => `${x(i)},${y(p.count)}`).join(" ");
	const fill = `M${x(0)} 185 L${first.map((p, i) => `${x(i)} ${y(p.count)}`).join(" L")} L${x(3)} 185 Z`;
	const svg = [];
	svg.push(
		`<svg viewBox="0 0 ${canvasWidth} 235" role="group" aria-label="${t.chartTitle}">`,
	);
	svg.push(
		`<path class="guide" d="M12 45H${canvasWidth - 12} M12 115H${canvasWidth - 12}"/><path class="axis" d="M12 185H${canvasWidth - 12}"/>`,
	);
	svg.push(
		`<rect class="missing-zone" x="${x(4) - (compact ? 23 : 48)}" y="22" width="${compact ? 46 : 96}" height="163"/><path class="missing-mark" d="M${x(4)} 35V185"/>`,
	);
	svg.push(
		`<path class="fill" d="${fill}"/><polyline class="line" points="${points}"/>`,
	);
	timeline.forEach((p, i) => {
		const px = x(i);
		if (p.state === "value") {
			const py = y(p.count);
			svg.push(
				`<g role="button" tabindex="0" data-point="${i}" aria-label="${t.pointAria(p.time, p.count)}"><circle class="focus-ring" cx="${px}" cy="${py}" r="14" fill="none" stroke="none"/><circle class="point" cx="${px}" cy="${py}" r="7"/><circle cx="${px}" cy="${py}" r="23" fill="transparent"/></g>`,
			);
		}
		svg.push(`<text x="${px}" y="219" text-anchor="middle">${p.time}</text>`);
	});
	svg.push("</svg>");
	region.innerHTML = svg.join("");
	setText("point-note", t.selectPoint);
	region.querySelectorAll("[data-point]").forEach((node) => {
		const activate = () => {
			const p = timeline[Number(node.dataset.point)];
			setText("point-note", t.pointDetail(p.time, p.count));
		};
		node.addEventListener("click", activate);
		node.addEventListener("focus", activate);
		node.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				activate();
			}
		});
	});
}
function render() {
	const t = labels[lang];
	document.documentElement.lang = lang;
	document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
	document.title =
		lang === "ar" ? "FITWAY — خط الدليل" : "FITWAY — The Evidence Line";
	document.querySelectorAll("[data-i18n]").forEach((el) => {
		el.textContent = t[el.dataset.i18n];
	});
	document.querySelectorAll("[data-aria-i18n]").forEach((el) => {
		el.setAttribute("aria-label", t[el.dataset.ariaI18n]);
	});
	const select = $("fixture");
	select.innerHTML = [
		"populated",
		"current",
		"closed",
		"noReadings",
		"loading",
		"error",
	]
		.map((s) => `<option value="${s}">${t[s]}</option>`)
		.join("");
	select.value = fixture;
	select.setAttribute("aria-label", t.previewState);
	const language = $("language");
	language.textContent = lang === "ar" ? "EN" : "العربية";
	language.setAttribute("aria-label", t.switchLanguage);
	const stateKey =
		fixture === "closed"
			? "closedBySchedule"
			: fixture === "loading" || fixture === "error"
				? "scheduleUnknown"
				: "openBySchedule";
	setText("schedule-state", t[stateKey]);
	$("state-symbol").dataset.kind = fixture;
	setText("orientation-title", t[fixture + "Title"]);
	setText("orientation-explain", t[fixture + "Explain"]);
	if (fixture === "current") {
		$("current-reading").innerHTML =
			`<div class="reading-count"><strong>42</strong><span>${t.currentBand}</span></div><p class="reading-detail">${t.currentApprox} · ${t.currentDetail}</p>`;
	} else {
		const valueKey =
			fixture === "closed"
				? "noValue"
				: fixture === "loading"
					? "pending"
					: fixture === "error"
						? "errorValue"
						: "unavailable";
		const detailKey =
			fixture === "closed"
				? "closedDetail"
				: fixture === "loading"
					? "pendingDetail"
					: fixture === "error"
						? "errorDetail"
						: "unavailableDetail";
		$("current-reading").innerHTML =
			`<p class="reading-value">${t[valueKey]}</p>${t[detailKey] ? `<p class="reading-detail">${t[detailKey]}</p>` : ""}`;
	}
	const sourceKey = {
		populated: "dailySource",
		current: "currentSource",
		closed: "closedSource",
		noReadings: "noReadingsSource",
		loading: "loadingSource",
		error: "errorSource",
	}[fixture];
	setText("current-source", t[sourceKey]);
	$("current-source").hidden = !t[sourceKey];
	const contextKey =
		fixture === "closed"
			? "closedDay"
			: fixture === "noReadings"
				? "noReadingsDay"
				: fixture === "loading"
					? "loadingDay"
					: fixture === "error"
						? "errorDay"
						: "businessDay";
	setText("day-context", t[contextKey]);
	renderChart(t);
	const evidence = $("evidence-side");
	if (fixture === "populated" || fixture === "current")
		evidence.innerHTML =
			evidenceRow(t.coverage, t.coverageValue, t.coverageNote) +
			evidenceRow(t.peak, t.peakValue, t.peakNote) +
			evidenceRow(t.gap, t.gapValue, t.gapNote);
	else if (fixture === "noReadings")
		evidence.innerHTML =
			evidenceRow(t.coverage, t.noCoverage, t.noReadingsExplain) +
			evidenceRow(t.peak, t.noPeak, t.dash);
	else if (fixture === "closed")
		evidence.innerHTML = evidenceRow(
			t.coverage,
			t.notAvailable,
			t.closedDetail,
		);
	else
		evidence.innerHTML = evidenceRow(
			t.sourceLabel,
			t[fixture === "loading" ? "loadingEvidence" : "errorEvidence"],
			t[fixture === "loading" ? "loadingSource" : "errorSource"],
		);
	const rows =
		fixture === "populated" || fixture === "current"
			? timeline
			: fixture === "closed"
				? timeline.map((p) => ({ ...p, state: "closed", count: null }))
				: fixture === "noReadings"
					? timeline.map((p) => ({ ...p, state: "missing", count: null }))
					: [];
	$("table-body").innerHTML = rows
		.map(
			(p) =>
				`<tr><td><bdi>${p.time}</bdi></td><td>${t[p.state + "State"]}</td><td>${p.count === null ? t.dash : p.count}</td></tr>`,
		)
		.join("");
	$("table-disclosure").hidden = rows.length === 0;
	syncUrl();
}
$("fixture").addEventListener("change", (e) => {
	fixture = e.target.value;
	render();
});
$("language").addEventListener("click", () => {
	lang = lang === "ar" ? "en" : "ar";
	render();
});
render();
