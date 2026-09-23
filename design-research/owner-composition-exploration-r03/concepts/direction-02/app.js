const data = {
	en: {
		journal: "Owner journal",
		demo: "ILLUSTRATIVE DATA",
		switch: "العربية",
		switchLabel: "Switch to Arabic",
		skipLink: "Skip to content",
		sectionsLabel: "Owner sections",
		railLabel: "FITWAY Owner workspace",
		openSections: "Open sections",
		closeSections: "Close sections",
		edition: "OWNER / JOURNAL",
		railTop: "Operational record",
		railBottom: "Concept exploration · synthetic data",
		footer: "Direction 02 — Editorial operations journal",
		sections: {
			daily: "Daily",
			reports: "Reports",
			access: "Access",
			log: "Activity Log",
			operations: "Operations",
			settings: "Settings",
		},
		daily: {
			chapter: "Business day record",
			title: "A day, read in full.",
			intro:
				"Wednesday, 23 September 2026. A sample operating day shown as a sequence of observations, with the missing interval left visible.",
			aside1: "Completed sample day",
			aside1b: "No live reading is implied.",
			aside2: "Gym local time",
			aside2b: "06:00–18:00 · illustrative schedule",
			chartTitle: "Occupancy across the day",
			chartSub: "Approximate people observed",
			chartHeading: "The day in intervals",
			chartDescription:
				"Select a point to read its time, value and data state.",
			mobileChartHint: "Full day above · scroll hourly readings below",
			dotLegend: "Dot = observed count",
			gapLegend: "Dash = no data",
			timeHead: "Time",
			valueHead: "Value",
			selected: "Selected observation",
			count: "approximate people",
			missing: "No reading for this interval",
			zero: "Observed zero",
			noData: "No data",
			measure1: "Peak observed",
			measure1n: "At 16:00 · illustrative",
			measure2: "History coverage",
			measure2v: "660 / 720",
			measure2n: "Observed / expected open minutes. One hour has no data.",
			measure3: "Estimated entrance crossings",
			measure3n: "Not unique members. Illustrative count.",
			annotation:
				"Missing history is not zero. The gap remains unconnected and is excluded from observed averages.",
			closingTitle: "Reading the day",
			closingText:
				"The interval marks preserve each observed value. A missing hour interrupts the record; the chart does not infer a value through it.",
			step1: "06:00 · observed zero",
			step2: "12:00 · no data",
			step3: "16:00 · observed peak",
		},
		log: {
			chapter: "Governance record",
			title: "Every change, in context.",
			intro:
				"Complete event summaries come first. Scope controls follow the record, so the action, actor, before and after values, and reason can be read together.",
			aside1: "Append-only view",
			aside1b: "Sample entries for concept review.",
			aside2: "Gym local time",
			aside2b: "Dates and times are illustrative.",
			head: "Activity",
			count7: "3 sample events",
			count30: "4 sample events",
			filterTitle: "Reading scope",
			filterCopy: "Change the example time range. The records update in place.",
			scope7: "Past 7 days",
			scope30: "Past 30 days",
			scopeUpdated7: "Showing the past 7 days.",
			scopeUpdated30: "Showing the past 30 days.",
			note: "The concept uses roles and synthetic values only. It displays no member or visitor data.",
			before: "Before",
			after: "After",
			reason: "Reason",
			actor: "Actor",
			records: [
				{
					date: "23 Sep",
					time: "14:08",
					title: "Opening hours revised",
					tag: "SETTINGS",
					actor: "Owner role",
					from: "06:00–18:00",
					to: "06:00–19:00",
					reason: "Wednesday hours updated",
					days: 7,
				},
				{
					date: "22 Sep",
					time: "09:42",
					title: "Capacity setting revised",
					tag: "SETTINGS",
					actor: "Owner role",
					from: "75",
					to: "80",
					reason: "Pilot configuration review",
					days: 7,
				},
				{
					date: "20 Sep",
					time: "18:16",
					title: "Account access changed",
					tag: "ACCESS",
					actor: "Owner role",
					from: "Active",
					to: "Disabled",
					reason: "Access review",
					days: 7,
				},
				{
					date: "15 Sep",
					time: "07:30",
					title: "Alert threshold revised",
					tag: "OPERATIONS",
					actor: "Owner role",
					from: "180 s",
					to: "210 s",
					reason: "Maintenance review",
					days: 30,
				},
			],
		},
		stubs: {
			reports: {
				title: "Reports as a reading room",
				text: "A day-by-hour heatmap and comparison narratives would follow this chapter grammar. Closed, missing and observed zero cells remain distinct; export stays a separate, labeled action.",
				rows: [
					"Busiest times in the primary reading field",
					"Coverage beside every aggregate",
					"CSV export in a quiet action rail",
				],
			},
			access: {
				title: "Access with measured risk",
				text: "Accounts appear as complete role records. Routine access edits stay quiet; sensitive one-time reveals and destructive changes receive their own protected interaction.",
				rows: [
					"Role and status before actions",
					"One-time secret reveal only in its authorized flow",
					"Risk color reserved for destructive changes",
				],
			},
			operations: {
				title: "Operations as evidence",
				text: "Uptime, history coverage and alert delivery receive distinct measures. An absent observation never becomes an outage claim.",
				rows: [
					"Health transitions as a dated sequence",
					"Coverage separate from uptime",
					"Alert delivery outcome beside its condition",
				],
			},
			settings: {
				title: "Settings in chapters",
				text: "Schedule, thresholds and technical timing use separate editorial sections. Save and discard stay adjacent to the current edit group, with clear pending feedback.",
				rows: [
					"Week pattern summarized before day edits",
					"Persistent labels and explicit time semantics",
					"Versioned changes and save state kept visible",
				],
			},
		},
	},
	ar: {
		journal: "سجل المالك",
		demo: "بيانات توضيحية",
		switch: "English",
		switchLabel: "التبديل إلى الإنجليزية",
		skipLink: "تخطَّ إلى المحتوى",
		sectionsLabel: "أقسام مساحة المالك",
		railLabel: "مساحة مالك FITWAY",
		openSections: "فتح الأقسام",
		closeSections: "إغلاق الأقسام",
		edition: "المالك / السجل",
		railTop: "سجل التشغيل",
		railBottom: "استكشاف تصميم · بيانات اصطناعية",
		footer: "التوجه 02 — سجل تشغيل تحريري",
		sections: {
			daily: "اليوم",
			reports: "التقارير",
			access: "الوصول",
			log: "سجل النشاط",
			operations: "التشغيل",
			settings: "الإعدادات",
		},
		daily: {
			chapter: "سجل يوم التشغيل",
			title: "اليوم كما حدث.",
			intro:
				"الأربعاء، 23 سبتمبر 2026. يوم تشغيل نموذجي نقرؤه على مراحل، مع إظهار الساعة التي لا تتوفر لها بيانات.",
			aside1: "يوم نموذجي مكتمل",
			aside1b: "لا تشير الشاشة إلى قراءة حية.",
			aside2: "التوقيت المحلي للنادي",
			aside2b: "06:00–18:00 · جدول توضيحي",
			chartTitle: "الإشغال خلال اليوم",
			chartSub: "عدد تقريبي مرصود",
			chartHeading: "مراحل اليوم",
			chartDescription: "اختر نقطة لقراءة وقتها وقيمتها وحالة بياناتها.",
			mobileChartHint: "اليوم كاملًا أعلاه · مرّر القراءات بالساعة أدناه",
			dotLegend: "النقطة = عدد مرصود",
			gapLegend: "الشرطة = لا بيانات",
			timeHead: "الوقت",
			valueHead: "القيمة",
			selected: "القراءة المختارة",
			count: "شخصًا تقريبًا",
			missing: "لا توجد قراءة لهذه الفترة",
			zero: "صفر مرصود",
			noData: "لا بيانات",
			measure1: "أعلى عدد مرصود",
			measure1n: "عند 16:00 · قيمة توضيحية",
			measure2: "تغطية السجل",
			measure2v: "660 / 720",
			measure2n: "دقائق مرصودة / متوقعة خلال الفتح. ساعة بلا بيانات.",
			measure3: "عبور دخول مقدّر",
			measure3n: "ليس عدد أعضاء فريدين. قيمة توضيحية.",
			annotation:
				"غياب البيانات ليس صفرًا. تبقى الفجوة منفصلة وتُستبعد من متوسط القراءات المرصودة.",
			closingTitle: "قراءة اليوم",
			closingText:
				"تحفظ النقاط كل قيمة مرصودة. الساعة الناقصة تقطع السجل؛ لا يستنتج الرسم قيمة خلالها.",
			step1: "06:00 · صفر مرصود",
			step2: "12:00 · لا بيانات",
			step3: "16:00 · أعلى قراءة",
		},
		log: {
			chapter: "سجل الحوكمة",
			title: "كل تغيير في سياقه.",
			intro:
				"تظهر الأحداث مكتملة أولًا، ثم أدوات تحديد النطاق. يمكنك قراءة الفعل والمنفذ والقيمة قبل التغيير وبعده والسبب معًا.",
			aside1: "سجل تراكمي",
			aside1b: "أحداث نموذجية لمراجعة المفهوم.",
			aside2: "التوقيت المحلي للنادي",
			aside2b: "التواريخ والأوقات توضيحية.",
			head: "النشاط",
			count7: "3 أحداث نموذجية",
			count30: "4 أحداث نموذجية",
			filterTitle: "نطاق القراءة",
			filterCopy: "غيّر الفترة النموذجية. تتحدث السجلات في موضعها.",
			scope7: "آخر 7 أيام",
			scope30: "آخر 30 يومًا",
			scopeUpdated7: "تعرض الشاشة آخر 7 أيام.",
			scopeUpdated30: "تعرض الشاشة آخر 30 يومًا.",
			note: "يستخدم المفهوم أدوارًا وقيمًا اصطناعية فقط. لا يعرض بيانات أعضاء أو زوار.",
			before: "قبل",
			after: "بعد",
			reason: "السبب",
			actor: "المنفذ",
			records: [
				{
					date: "23 سبتمبر",
					time: "14:08",
					title: "تعديل ساعات الفتح",
					tag: "إعدادات",
					actor: "دور المالك",
					from: "06:00–18:00",
					to: "06:00–19:00",
					reason: "تحديث ساعات الأربعاء",
					days: 7,
				},
				{
					date: "22 سبتمبر",
					time: "09:42",
					title: "تعديل السعة المحددة",
					tag: "إعدادات",
					actor: "دور المالك",
					from: "75",
					to: "80",
					reason: "مراجعة إعدادات التجربة",
					days: 7,
				},
				{
					date: "20 سبتمبر",
					time: "18:16",
					title: "تغيير صلاحية حساب",
					tag: "وصول",
					actor: "دور المالك",
					from: "نشط",
					to: "معطل",
					reason: "مراجعة الوصول",
					days: 7,
				},
				{
					date: "15 سبتمبر",
					time: "07:30",
					title: "تعديل حد التنبيه",
					tag: "تشغيل",
					actor: "دور المالك",
					from: "180 ث",
					to: "210 ث",
					reason: "مراجعة الصيانة",
					days: 30,
				},
			],
		},
		stubs: {
			reports: {
				title: "التقارير كمساحة قراءة",
				text: "تتبع خريطة اليوم والساعة والمقارنات السردية لغة هذا الفصل. تبقى ساعات الإغلاق والفجوات والصفر المرصود حالات منفصلة، والتصدير إجراء مستقلًا.",
				rows: [
					"أوقات الذروة في مساحة القراءة الأساسية",
					"تغطية السجل بجانب كل نتيجة مجمعة",
					"تصدير CSV في مسار إجراء هادئ",
				],
			},
			access: {
				title: "الوصول حسب مستوى المخاطرة",
				text: "تظهر الحسابات كسجلات دور مكتملة. تعديلات الوصول الاعتيادية هادئة، أما الكشف لمرة واحدة والتغييرات الخطرة فلها تفاعل محمي.",
				rows: [
					"الدور والحالة قبل الإجراءات",
					"كشف السر لمرة واحدة في مساره المصرح فقط",
					"لون التحذير للتغييرات الخطرة",
				],
			},
			operations: {
				title: "التشغيل بوصفه أدلة",
				text: "لكل من الجاهزية وتغطية السجل وتسليم التنبيهات مقياس مستقل. غياب القراءة لا يتحول إلى ادعاء انقطاع.",
				rows: [
					"تحولات الصحة في تسلسل مؤرخ",
					"التغطية مستقلة عن الجاهزية",
					"نتيجة تسليم التنبيه بجانب حالته",
				],
			},
			settings: {
				title: "الإعدادات في فصول",
				text: "الجدول والحدود والتوقيت التقني أقسام مستقلة. الحفظ والتراجع قريبان من مجموعة التعديل، مع تغذية راجعة واضحة.",
				rows: [
					"ملخص الأسبوع قبل تعديل الأيام",
					"تسميات ثابتة ودلالة وقت واضحة",
					"نسخ التغييرات وحالة الحفظ ظاهرتان",
				],
			},
		},
	},
};
const sections = [
	"daily",
	"reports",
	"access",
	"log",
	"operations",
	"settings",
];
const icons = {
	daily: "daily",
	reports: "reports",
	access: "access",
	log: "log",
	operations: "operations",
	settings: "settings",
};
const observations = [
	{ time: "06:00", value: 0 },
	{ time: "07:00", value: 12 },
	{ time: "08:00", value: 25 },
	{ time: "09:00", value: 37 },
	{ time: "10:00", value: 31 },
	{ time: "11:00", value: 28 },
	{ time: "12:00", state: "missing" },
	{ time: "13:00", value: 29 },
	{ time: "14:00", value: 34 },
	{ time: "15:00", value: 46 },
	{ time: "16:00", value: 54 },
	{ time: "17:00", value: 41 },
];
const params = new URLSearchParams(location.search);
let lang = params.get("lang") === "ar" ? "ar" : "en";
let section = sections.includes(params.get("section"))
	? params.get("section")
	: "daily";
let selected = 3;
let scope = 7;
let mobileOpen = false;
const el = (id) => document.getElementById(id);
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const esc = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
function setUrl() {
	const p = new URLSearchParams();
	p.set("section", section);
	p.set("lang", lang);
	history.replaceState(null, "", `?${p}`);
}
function navMarkup() {
	const t = data[lang];
	return sections
		.map(
			(key, i) =>
				`<button type="button" class="nav-link ${key === section ? "is-active" : ""}" data-section="${key}" ${key === section ? 'aria-current="page"' : ""}>${icon(icons[key])}<span>${t.sections[key]}</span><span class="nav-index">${String(i + 1).padStart(2, "0")}</span></button>`,
		)
		.join("");
}
function closeMenu() {
	mobileOpen = false;
	el("mobileNav").hidden = true;
	el("menuBtn").setAttribute("aria-expanded", "false");
	el("menuBtn").setAttribute("aria-label", data[lang].openSections);
	el("menuBtn").innerHTML = icon("menu");
}
function hero(chapter, title, intro, aside1, aside1b, aside2, aside2b) {
	return `<section class="hero" aria-labelledby="page-title"><div><div class="section-label"><span class="chapter-rule"></span><span>${esc(chapter)}</span></div><h1 id="page-title">${esc(title)}</h1><p class="hero-intro">${esc(intro)}</p></div><div class="hero-aside"><div class="aside-line">${icon("check")}<div><strong>${esc(aside1)}</strong><span>${esc(aside1b)}</span></div></div><div class="aside-line">${icon("clock")}<div><strong>${esc(aside2)}</strong><span><bdi>${esc(aside2b)}</bdi></span></div></div></div></section>`;
}
function dailyMarkup() {
	const t = data[lang].daily;
	const overview = observations
		.map((o) => {
			const h = o.state ? 0 : Math.max(3, Math.round((o.value / 60) * 22));
			return `<span class="overview-cell ${o.state || ""}" style="--mini-height:${h}px"><i></i></span>`;
		})
		.join("");
	const cols = observations
		.map((o, i) => {
			const h = o.state ? 0 : Math.max(4, Math.round((o.value / 60) * 180));
			const label = o.state
				? `${o.time}: ${t.noData}`
				: `${o.time}: ${o.value} ${t.count}`;
			return `<button type="button" class="plot-column ${o.state || ""} ${i === selected ? "is-selected" : ""}" data-point="${i}" style="--height:${h}px" aria-label="${esc(label)}" aria-pressed="${i === selected}"><span class="interval"></span><span class="point"></span></button>`;
		})
		.join("");
	const o = observations[selected];
	const detail = o.state
		? `<span class="detail-state">${esc(t.noData)}</span>`
		: `<span><strong><bdi>${o.value}</bdi></strong> ${esc(o.value === 0 ? t.zero : t.count)}</span>`;
	return (
		hero(
			t.chapter,
			t.title,
			t.intro,
			t.aside1,
			t.aside1b,
			t.aside2,
			t.aside2b,
		) +
		`<section class="daily-story" aria-label="${esc(t.chartTitle)}"><div class="story-main"><div class="story-heading"><h2>${esc(t.chartHeading)}</h2><p>${esc(t.chartDescription)}</p></div><div class="plot"><div class="plot-head"><strong>${esc(t.chartTitle)}</strong><span>${esc(t.chartSub)}</span></div><div class="plot-overview-wrap" aria-hidden="true"><div class="plot-overview">${overview}</div><div class="overview-axis"><bdi>06:00</bdi><bdi>12:00</bdi><bdi>17:00</bdi></div></div><p class="mobile-chart-hint">${esc(t.mobileChartHint)}</p><div class="plot-body" role="group" aria-label="${esc(t.chartTitle)}">${cols}</div><div class="plot-axis"><bdi>06:00</bdi><bdi>12:00</bdi><bdi>17:00</bdi></div><p class="plot-explain"><span class="legend-dot"></span>${esc(t.dotLegend)} &nbsp; — ${esc(t.gapLegend)}</p><div class="plot-detail"><span>${esc(t.selected)} · <bdi>${o.time}</bdi></span>${detail}</div></div><p class="annotation">${icon("info")}<span>${esc(t.annotation)}</span></p></div><aside class="story-sidebar" aria-label="${esc(t.measure2)}"><div class="side-measure"><span>${esc(t.measure1)}</span><strong><bdi>54</bdi></strong><p>${esc(t.measure1n)}</p></div><div class="side-measure coverage"><span>${esc(t.measure2)}</span><strong><bdi dir="ltr">${esc(t.measure2v)}</bdi></strong><p>${esc(t.measure2n)}</p></div><div class="side-measure"><span>${esc(t.measure3)}</span><strong><bdi>148</bdi></strong><p>${esc(t.measure3n)}</p></div></aside></section><section class="continuation"><h2>${esc(t.closingTitle)}</h2><div><p>${esc(t.closingText)}</p><div class="day-steps"><span class="day-step"><bdi>${esc(t.step1)}</bdi></span><span class="day-step"><bdi>${esc(t.step2)}</bdi></span><span class="day-step"><bdi>${esc(t.step3)}</bdi></span></div></div></section><div class="sr-only"><table><caption>${esc(t.chartTitle)} · ${esc(t.chartSub)}</caption><thead><tr><th>${esc(t.timeHead)}</th><th>${esc(t.valueHead)}</th></tr></thead><tbody>${observations.map((o) => `<tr><td>${o.time}</td><td>${o.state ? esc(t.noData) : o.value}</td></tr>`).join("")}</tbody></table></div>`
	);
}
function logMarkup() {
	const t = data[lang].log;
	const records = t.records.filter((r) => r.days <= scope);
	return (
		hero(
			t.chapter,
			t.title,
			t.intro,
			t.aside1,
			t.aside1b,
			t.aside2,
			t.aside2b,
		) +
		`<section class="log-layout"><div class="log-column"><div class="log-head"><h2>${esc(t.head)}</h2><span>${esc(scope === 7 ? t.count7 : t.count30)}</span></div><div class="records">${records.map((r) => `<article class="record"><div class="record-time"><strong><bdi>${esc(r.time)}</bdi></strong><bdi>${esc(r.date)}</bdi></div><div><div class="record-title"><h3>${esc(r.title)}</h3><span class="record-type">${esc(r.tag)}</span></div><p class="record-body">${esc(t.actor)}: ${esc(r.actor)}</p><div class="record-change"><span>${esc(t.before)}</span><bdi>${esc(r.from)}</bdi>${icon("arrow")}<span>${esc(t.after)}</span><bdi>${esc(r.to)}</bdi></div><p class="record-reason">${esc(t.reason)}: ${esc(r.reason)}</p></div></article>`).join("")}</div></div><aside class="log-aside"><h2>${esc(t.filterTitle)}</h2><p>${esc(t.filterCopy)}</p><button class="scope-btn" type="button" id="scopeBtn"><span>${esc(scope === 7 ? t.scope7 : t.scope30)}</span>${icon("chevron")}</button><p class="scope-note" id="scopeNote" aria-live="polite"></p><p class="small-print">${esc(t.note)}</p></aside></section>`
	);
}
function stubMarkup() {
	const t = data[lang].stubs[section];
	return (
		hero(
			data[lang].sections[section],
			t.title,
			t.text,
			data[lang].log.aside1,
			data[lang].log.aside1b,
			data[lang].log.aside2,
			data[lang].log.aside2b,
		) +
		`<section class="stub"><h2>${esc(data[lang].sections[section])}</h2><p>${esc(t.text)}</p><div class="stub-list">${t.rows.map((row) => `<div class="stub-row">${icon(icons[section])}<span>${esc(row)}</span></div>`).join("")}</div></section>`
	);
}
function render() {
	const t = data[lang];
	document.documentElement.lang = lang;
	document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
	document.title = `FITWAY / ${t.sections[section]} — Direction 02`;
	document.querySelector(".skip-link").textContent = t.skipLink;
	document.querySelector(".rail").setAttribute("aria-label", t.railLabel);
	el("desktopNav").setAttribute("aria-label", t.sectionsLabel);
	el("mobileNav").setAttribute("aria-label", t.sectionsLabel);
	el("edition").textContent = t.edition;
	el("railFootTop").textContent = t.railTop;
	el("railFootBottom").textContent = t.railBottom;
	el("topbarContext").textContent = t.journal;
	el("topbarSection").textContent = t.sections[section];
	el("demoMark").textContent = t.demo;
	el("langBtn").textContent = t.switch;
	el("langBtn").setAttribute("aria-label", t.switchLabel);
	el("footerText").textContent = t.footer;
	el("desktopNav").innerHTML = navMarkup();
	el("mobileNav").innerHTML = navMarkup();
	el("main").innerHTML =
		section === "daily"
			? dailyMarkup()
			: section === "log"
				? logMarkup()
				: stubMarkup();
	closeMenu();
	setUrl();
}
document.addEventListener("click", (event) => {
	const nav = event.target.closest("[data-section]");
	if (nav) {
		const fromMobile = Boolean(nav.closest("#mobileNav"));
		section = nav.dataset.section;
		scope = 7;
		render();
		if (fromMobile) el("menuBtn").focus();
		else el("desktopNav").querySelector(`[data-section="${section}"]`).focus();
		el("main").querySelector(".hero").classList.add("chapter-enter");
		scrollTo({
			top: 0,
			behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
				? "instant"
				: "smooth",
		});
		el("announce").textContent = data[lang].sections[section];
		return;
	}
	const point = event.target.closest("[data-point]");
	if (point) {
		selected = Number(point.dataset.point);
		const label = point.getAttribute("aria-label");
		render();
		el("main").querySelector(`[data-point="${selected}"]`).focus();
		el("main").querySelector(".plot-detail").classList.add("detail-enter");
		el("announce").textContent = label;
		return;
	}
	if (event.target.closest("#scopeBtn")) {
		scope = scope === 7 ? 30 : 7;
		render();
		el("scopeBtn").focus();
		const msg =
			scope === 7
				? data[lang].log.scopeUpdated7
				: data[lang].log.scopeUpdated30;
		el("scopeNote").textContent = msg;
		el("announce").textContent = msg;
	}
});
el("langBtn").addEventListener("click", () => {
	lang = lang === "en" ? "ar" : "en";
	render();
	el("announce").textContent = data[lang].sections[section];
});
el("menuBtn").addEventListener("click", () => {
	mobileOpen = !mobileOpen;
	el("mobileNav").hidden = !mobileOpen;
	el("menuBtn").setAttribute("aria-expanded", String(mobileOpen));
	el("menuBtn").setAttribute(
		"aria-label",
		mobileOpen ? data[lang].closeSections : data[lang].openSections,
	);
	el("menuBtn").innerHTML = icon(mobileOpen ? "close" : "menu");
});
document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && mobileOpen) {
		closeMenu();
		el("menuBtn").focus();
	}
});
render();
