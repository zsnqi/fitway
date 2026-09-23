const copy = {
	en: {
		sections: {
			daily: "Daily",
			reports: "Reports",
			access: "Access",
			activity: "Activity Log",
			operations: "Operations",
			settings: "Settings",
		},
		workspace: "Owner workspace",
		menu: "Switch workspace",
		menuFoot: "Concept exploration · no production data",
		demo: "ILLUSTRATIVE",
		language: "العربية",
		languageLabel: "Switch to Arabic",
		navLabel: "Owner workspace sections",
		closeMenu: "Close workspace switcher",
		footer: "Direction 04 · Evidence Desk / Signal Wall",
		skip: "Skip to content",
		daily: {
			title: "The day has a gap. Keep it visible.",
			intro:
				"Wednesday, 23 September 2026 · a completed illustrative business day in gym local time.",
			stamp: "Sample record · not live",
			statusTitle: "11 hours observed",
			statusBody:
				"Of 12 scheduled open hours, one has no usable reading. This is coverage of history, not system uptime.",
			ratioLabel: "scheduled hours represented",
			ratioA11y: "11 of 12 scheduled hours",
			gap: "12:00–13:00 has no data. It is not zero and is excluded from observed averages.",
			signalTitle: "Observed by hour",
			signalHelp: "Choose an hour to inspect its exact value or missing state.",
			chooseHour: "Hourly readings · scroll to choose",
			signalStamp: "06:00–18:00 · sample schedule",
			selected: "Selected interval",
			count: "approximate people",
			missing: "No data",
			zero: "Observed zero",
			observed: "observed",
			absent: "missing",
			selectedTime: "Gym local time",
			peak: "Peak observed",
			peakNote: "54 at 16:00 · illustrative",
			coverage: "History coverage",
			coverageValue: "660 / 720",
			coverageUnit: "min",
			coverageNote: "Observed / expected open minutes",
			crossings: "Estimated entrance crossings",
			crossingsValue: "148",
			crossingsNote: "Not unique members · illustrative",
			timeHead: "Time",
			valueHead: "Approximate count or state",
		},
		activity: {
			title: "Changes have a trace.",
			intro:
				"The complete record leads. Open any event to inspect its before and after values, actor, and reason.",
			stamp: "Sample audit history",
			list: "Recent activity",
			count7: "3 sample events",
			count30: "4 sample events",
			console: "Inspect a wider range",
			consoleText: "Keep the events in view while you change the sample scope.",
			seven: "7 days",
			thirty: "30 days",
			feedback7: "Showing the past 7 days.",
			feedback30: "Showing the past 30 days.",
			governance: "Record integrity",
			governanceNote:
				"These are synthetic role records. No member, visitor, image, or biometric data is represented.",
			actor: "Actor",
			from: "Before",
			to: "After",
			reason: "Reason",
			events: [
				{
					date: "23 Sep",
					time: "14:08",
					title: "Opening hours revised",
					meta: "Settings · Wednesday schedule",
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
					meta: "Settings · pilot configuration",
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
					meta: "Access · account status",
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
					meta: "Operations · freshness",
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
				title: "Reports / Evidence fields",
				intro:
					"Heatmap and comparisons use calibrated occupancy measures with coverage in the same field.",
				rows: [
					"Closed, missing and observed zero remain distinct",
					"Historical settings version accompanies each aggregate",
					"CSV export is a separate, named action",
				],
			},
			access: {
				title: "Access / Role records",
				intro:
					"Account status and role lead; routine changes and destructive changes use different emphasis.",
				rows: [
					"Accounts as complete role records",
					"One-time credential reveal only in its authorized flow",
					"Changes reveal risk and confirmation where required",
				],
			},
			operations: {
				title: "Operations / Condition board",
				intro:
					"Uptime, observation coverage and alert delivery are separately evidenced.",
				rows: [
					"Health transitions with timestamps",
					"No reading does not imply an outage",
					"Alert delivery outcomes paired with conditions",
				],
			},
			settings: {
				title: "Settings / Versioned controls",
				intro:
					"Editable groups keep their values, local save/discard state and timing meaning together.",
				rows: [
					"Schedule preview before day edits",
					"Thresholds grouped by decision",
					"Save and discard anchored to the active group",
				],
			},
		},
	},
	ar: {
		sections: {
			daily: "اليوم",
			reports: "التقارير",
			access: "الوصول",
			activity: "سجل النشاط",
			operations: "التشغيل",
			settings: "الإعدادات",
		},
		workspace: "مساحة المالك",
		menu: "تبديل القسم",
		menuFoot: "استكشاف تصميم · بلا بيانات إنتاج",
		demo: "قيم توضيحية",
		language: "English",
		languageLabel: "التبديل إلى الإنجليزية",
		navLabel: "أقسام مساحة المالك",
		closeMenu: "إغلاق قائمة الأقسام",
		footer: "التوجه 04 · مكتب الأدلة والإشارات",
		skip: "تخطّ إلى المحتوى",
		daily: {
			title: "في اليوم فجوة. نُظهرها.",
			intro:
				"الأربعاء، 23 سبتمبر 2026 · يوم تشغيل توضيحي مكتمل حسب توقيت النادي المحلي.",
			stamp: "سجل نموذجي · ليس مباشرًا",
			statusTitle: "11 ساعة مرصودة",
			statusBody:
				"من أصل 12 ساعة فتح متوقعة، لا توجد قراءة صالحة لساعة واحدة. هذه تغطية السجل وليست جاهزية النظام.",
			ratioLabel: "ساعة ممثلة من الجدول",
			ratioA11y: "11 من 12 ساعة مجدولة",
			gap: "لا توجد بيانات من 12:00 إلى 13:00. ليست صفرًا ولا تدخل في متوسط المرصود.",
			signalTitle: "القراءات حسب الساعة",
			signalHelp: "اختر ساعة لمعرفة القيمة الدقيقة أو حالة غياب البيانات.",
			chooseHour: "القراءات بالساعة · مرّر للاختيار",
			signalStamp: "06:00–18:00 · جدول توضيحي",
			selected: "الفترة المختارة",
			count: "شخصًا تقريبًا",
			missing: "لا بيانات",
			zero: "صفر مرصود",
			observed: "مرصود",
			absent: "مفقود",
			selectedTime: "توقيت النادي المحلي",
			peak: "أعلى عدد مرصود",
			peakNote: "54 عند 16:00 · توضيحي",
			coverage: "تغطية السجل",
			coverageValue: "660 / 720",
			coverageUnit: "دقيقة",
			coverageNote: "دقائق مرصودة / متوقعة أثناء الفتح",
			crossings: "عبور دخول مقدّر",
			crossingsValue: "148",
			crossingsNote: "ليس عدد أعضاء فريدين · توضيحي",
			timeHead: "الوقت",
			valueHead: "العدد التقريبي أو الحالة",
		},
		activity: {
			title: "لكل تغيير أثر.",
			intro:
				"تظهر الأحداث أولًا. افتح أي حدث لقراءة قيمتي قبل وبعد التغيير والمنفذ والسبب.",
			stamp: "سجل تدقيق نموذجي",
			list: "النشاط الأخير",
			count7: "3 أحداث نموذجية",
			count30: "4 أحداث نموذجية",
			console: "توسيع نطاق القراءة",
			consoleText: "تبقى الأحداث في الواجهة عند تغيير الفترة النموذجية.",
			seven: "7 أيام",
			thirty: "30 يومًا",
			feedback7: "تعرض الشاشة آخر 7 أيام.",
			feedback30: "تعرض الشاشة آخر 30 يومًا.",
			governance: "سلامة السجل",
			governanceNote:
				"هذه سجلات أدوار اصطناعية. لا تتضمن بيانات أعضاء أو زوار أو صورًا أو معلومات حيوية.",
			actor: "المنفذ",
			from: "قبل",
			to: "بعد",
			reason: "السبب",
			events: [
				{
					date: "23 سبتمبر",
					time: "14:08",
					title: "تعديل ساعات الفتح",
					meta: "الإعدادات · جدول الأربعاء",
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
					meta: "الإعدادات · إعدادات التجربة",
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
					meta: "الوصول · حالة الحساب",
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
					meta: "التشغيل · حد تحديث البيانات",
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
				title: "التقارير / حقول الأدلة",
				intro:
					"تعرض خريطة الأوقات والمقارنات مقاييس الإشغال مع التغطية في الحقل نفسه.",
				rows: [
					"الإغلاق وغياب البيانات والصفر المرصود حالات منفصلة",
					"نسخة الإعدادات التاريخية ترافق كل نتيجة مجمعة",
					"تصدير CSV إجراء مستقل ومسمى",
				],
			},
			access: {
				title: "الوصول / سجلات الأدوار",
				intro:
					"تسبق حالة الحساب ودوره الإجراءات، وتختلف شدة الأفعال الاعتيادية عن الخطرة.",
				rows: [
					"الحسابات كسجلات دور مكتملة",
					"كشف السر لمرة واحدة في المسار المصرح فقط",
					"إظهار المخاطرة والتأكيد عند الحاجة",
				],
			},
			operations: {
				title: "التشغيل / لوحة الشروط",
				intro: "للجاهزية وتغطية الرصد وتسليم التنبيهات أدلة مستقلة.",
				rows: [
					"تحولات الصحة مع توقيتها",
					"غياب القراءة لا يعني انقطاعًا",
					"نتائج تسليم التنبيهات مع شروطها",
				],
			},
			settings: {
				title: "الإعدادات / ضوابط بنسخ",
				intro:
					"تجمع مجموعات التعديل قيمها وحفظها أو التراجع عنها ودلالة التوقيت في الموضع نفسه.",
				rows: [
					"معاينة الجدول قبل تعديل الأيام",
					"الحدود مجمعة بحسب القرار",
					"الحفظ والتراجع بجانب المجموعة النشطة",
				],
			},
		},
	},
};
const hours = [
	{ time: "06:00", value: 0 },
	{ time: "07:00", value: 12 },
	{ time: "08:00", value: 25 },
	{ time: "09:00", value: 37 },
	{ time: "10:00", value: 31 },
	{ time: "11:00", value: 28 },
	{ time: "12:00", missing: true },
	{ time: "13:00", value: 29 },
	{ time: "14:00", value: 34 },
	{ time: "15:00", value: 46 },
	{ time: "16:00", value: 54 },
	{ time: "17:00", value: 41 },
];
const order = [
	"daily",
	"reports",
	"access",
	"activity",
	"operations",
	"settings",
];
const icons = {
	daily: "signal",
	reports: "report",
	access: "access",
	activity: "activity",
	operations: "ops",
	settings: "settings",
};
const p = new URLSearchParams(location.search);
let language = p.get("lang") === "en" ? "en" : "ar";
let section = order.includes(p.get("section")) ? p.get("section") : "daily";
let selectedHour = 10;
let range = 7;
let openEvent = 0;
let menuOpen = false;
const byId = (id) => document.getElementById(id);
const svg = (name) => `<svg aria-hidden="true"><use href="#ic-${name}"/></svg>`;
const safe = (value) =>
	String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
function setLocation() {
	const next = new URLSearchParams();
	next.set("section", section);
	next.set("lang", language);
	history.replaceState(null, "", `?${next}`);
}
function menuMarkup() {
	const t = copy[language];
	return order
		.map(
			(key) =>
				`<button type="button" class="menu-link" data-section="${key}" ${key === section ? 'aria-current="page"' : ""}>${svg(icons[key])}<span>${safe(t.sections[key])}</span></button>`,
		)
		.join("");
}
function closeWorkspace(restore = false) {
	menuOpen = false;
	byId("workspaceMenu").hidden = true;
	byId("workspaceButton").setAttribute("aria-expanded", "false");
	if (restore) byId("workspaceButton").focus();
}
function pageHead(title, intro, stamp) {
	return `<div class="page-head"><div><h1>${safe(title)}</h1><p>${safe(intro)}</p></div><div class="head-meta">${safe(stamp)}</div></div>`;
}
function daily() {
	const t = copy[language].daily;
	const bars = hours
		.map((hour, index) => {
			const h = hour.missing
				? 30
				: Math.max(4, Math.round((hour.value / 60) * 216));
			const label = hour.missing
				? `${hour.time}: ${t.missing}`
				: `${hour.time}: ${hour.value} ${t.count}`;
			return `<button type="button" class="bar-slot ${hour.missing ? "missing" : ""}" data-hour="${index}" aria-label="${safe(label)}" aria-pressed="${index === selectedHour}" style="--bar:${h}px"><span class="bar-fill"></span><span class="hour"><bdi>${hour.time.slice(0, 2)}</bdi></span></button>`;
		})
		.join("");
	const mobileBars = hours
		.map((hour, index) => {
			const h = hour.missing
				? 25
				: Math.max(4, Math.round((hour.value / 60) * 138));
			return `<span class="mobile-bar ${hour.missing ? "missing" : ""} ${index === selectedHour ? "selected" : ""}" style="--mobile-bar:${h}px"><i></i></span>`;
		})
		.join("");
	const hourChoices = hours
		.map((hour, index) => {
			const label = hour.missing
				? `${hour.time}: ${t.missing}`
				: `${hour.time}: ${hour.value} ${t.count}`;
			return `<button type="button" class="hour-choice ${hour.missing ? "missing" : ""}" data-hour="${index}" aria-label="${safe(label)}" aria-pressed="${index === selectedHour}"><bdi>${hour.time.slice(0, 2)}</bdi><span aria-hidden="true">${hour.missing ? "—" : ""}</span></button>`;
		})
		.join("");
	const desktopChart = `<div class="bar-chart" role="group" aria-label="${safe(t.signalTitle)}">${bars}</div>`;
	const mobileChart = `<div class="mobile-signal-chart" aria-hidden="true"><div class="mobile-bars">${mobileBars}</div><div class="mobile-times"><bdi>06:00</bdi><bdi>12:00</bdi><bdi>17:00</bdi></div></div><div class="hour-selector-label">${safe(t.chooseHour)}</div><div class="hour-selector" role="group" aria-label="${safe(t.chooseHour)}">${hourChoices}</div>`;
	const chosen = hours[selectedHour];
	const detail = chosen.missing
		? t.missing
		: chosen.value === 0
			? t.zero
			: `${chosen.value} ${t.count}`;
	const markup =
		pageHead(t.title, t.intro, t.stamp) +
		`<div class="daily-wall"><section class="status-bay" aria-labelledby="coverage-title">${svg("signal")}<h2 id="coverage-title">${safe(t.statusTitle)}</h2><p>${safe(t.statusBody)}</p><div class="big-ratio" aria-label="${safe(t.ratioA11y)}"><bdi dir="ltr">11<small>/</small>12</bdi></div><div class="ratio-label">${safe(t.ratioLabel)}</div><div class="coverage-track" aria-hidden="true">${hours.map((h) => `<span class="${h.missing ? "missing" : ""}"></span>`).join("")}</div><div class="status-foot">${svg("gap")}<span>${safe(t.gap)}</span></div></section><section class="signal-bay" aria-labelledby="signal-title"><div class="signal-top"><div><h2 id="signal-title">${safe(t.signalTitle)}</h2><p>${safe(t.signalHelp)}</p></div><span class="sample-stamp"><bdi>${safe(t.signalStamp)}</bdi></span></div><div class="bar-chart" role="group" aria-label="${safe(t.signalTitle)}">${bars}</div><div class="signal-detail"><div class="detail-copy"><span>${safe(t.selected)}</span><strong><bdi>${chosen.time}</bdi></strong></div><div class="detail-value">${safe(detail)}<small>${safe(t.selectedTime)}</small></div></div><div class="signal-legend"><div class="legend-items"><span><i></i>${safe(t.observed)}</span><span><i class="gap-icon"></i>${safe(t.absent)}</span></div><p>${safe(t.count)}</p></div></section></div><div class="evidence-strip"><div class="evidence-item"><strong><bdi>54</bdi></strong><span>${safe(t.peak)}</span><p>${safe(t.peakNote)}</p></div><div class="evidence-item"><strong><bdi dir="ltr">${safe(t.coverageValue)}</bdi> <small>${safe(t.coverageUnit)}</small></strong><span>${safe(t.coverage)}</span><p>${safe(t.coverageNote)}</p></div><div class="evidence-item"><strong><bdi>${safe(t.crossingsValue)}</bdi></strong><span>${safe(t.crossings)}</span><p>${safe(t.crossingsNote)}</p></div></div><div class="sr-only"><table><caption>${safe(t.signalTitle)}</caption><thead><tr><th>${safe(t.timeHead)}</th><th>${safe(t.valueHead)}</th></tr></thead><tbody>${hours.map((h) => `<tr><td>${h.time}</td><td>${h.missing ? safe(t.missing) : h.value}</td></tr>`).join("")}</tbody></table></div>`;
	return markup.replace(desktopChart, `${desktopChart}${mobileChart}`);
}
function activity() {
	const t = copy[language].activity;
	const items = t.events.filter((item) => item.days <= range);
	return (
		pageHead(t.title, t.intro, t.stamp) +
		`<div class="activity-layout"><section class="record-well" aria-label="${safe(t.list)}"><div class="well-heading"><strong>${safe(t.list)}</strong><span>${safe(range === 7 ? t.count7 : t.count30)}</span></div>${items
			.map((event, index) => {
				const expanded = openEvent === index;
				return `<article class="event"><button type="button" class="event-button" data-event="${index}" aria-expanded="${expanded}" aria-controls="event-detail-${index}"><span class="event-time"><bdi>${event.time}</bdi><bdi>${safe(event.date)}</bdi></span><span><span class="event-title">${safe(event.title)}</span><span class="event-meta">${safe(event.meta)}</span></span>${svg("down")}</button><div class="event-detail" id="event-detail-${index}" ${expanded ? "" : "hidden"}><div class="detail-field"><span>${safe(t.actor)}</span><strong>${safe(event.actor)}</strong></div><div class="detail-field"><span>${safe(t.from)}</span><strong><bdi>${safe(event.from)}</bdi></strong></div><div class="detail-field"><span>${safe(t.to)}</span><strong><bdi>${safe(event.to)}</bdi></strong></div><div class="detail-field reason"><span>${safe(t.reason)}</span><strong>${safe(event.reason)}</strong></div></div></article>`;
			})
			.join(
				"",
			)}</section><aside class="activity-console"><div><h2>${safe(t.console)}</h2><p>${safe(t.consoleText)}</p></div><div class="range-switch" role="group" aria-label="${safe(t.console)}"><button type="button" data-range="7" aria-pressed="${range === 7}">${safe(t.seven)}</button><button type="button" data-range="30" aria-pressed="${range === 30}">${safe(t.thirty)}</button></div><div class="range-feedback" id="rangeFeedback" aria-live="polite"></div><div class="console-bottom"><strong>${safe(t.governance)}</strong><p>${safe(t.governanceNote)}</p></div></aside></div>`
	);
}
function stub() {
	const t = copy[language].stubs[section];
	return `<div class="stub"><div class="stub-intro"><h1>${safe(t.title)}</h1><p>${safe(t.intro)}</p></div><div class="stub-body"><h2>${safe(copy[language].sections[section])}</h2>${t.rows.map((row) => `<div class="stub-row">${svg(icons[section])}<span>${safe(row)}</span></div>`).join("")}</div></div>`;
}
function render() {
	const t = copy[language];
	document.documentElement.lang = language;
	document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
	document.title = `FITWAY / ${t.sections[section]} · Evidence Desk`;
	document.querySelector(".skip").textContent = t.skip;
	byId("workspaceButton").innerHTML =
		`${svg("switch")}<span class="slash">${safe(t.workspace)} / </span><span class="current">${safe(t.sections[section])}</span>${svg("down")}`;
	byId("workspaceButton").setAttribute(
		"aria-label",
		`${t.menu}: ${t.sections[section]}`,
	);
	byId("menuTitle").textContent = t.menu;
	byId("closeMenu").setAttribute("aria-label", t.closeMenu);
	byId("menuFoot").textContent = t.menuFoot;
	byId("menuLinks").setAttribute("aria-label", t.navLabel);
	byId("menuLinks").innerHTML = menuMarkup();
	byId("demoFlag").textContent = t.demo;
	byId("langButton").textContent = t.language;
	byId("langButton").setAttribute("aria-label", t.languageLabel);
	byId("footerCopy").textContent = t.footer;
	byId("main").innerHTML =
		section === "daily"
			? daily()
			: section === "activity"
				? activity()
				: stub();
	const hourSelector = byId("main").querySelector(".hour-selector");
	if (hourSelector && matchMedia("(max-width: 720px)").matches) {
		const active = hourSelector.querySelector('[aria-pressed="true"]');
		const area = hourSelector.getBoundingClientRect();
		const target = active.getBoundingClientRect();
		hourSelector.scrollLeft +=
			target.left + target.width / 2 - (area.left + area.width / 2);
	}
	closeWorkspace();
	setLocation();
}
document.addEventListener("click", (event) => {
	const nav = event.target.closest("[data-section]");
	if (nav) {
		section = nav.dataset.section;
		openEvent = 0;
		range = 7;
		render();
		byId("workspaceButton").focus();
		scrollTo({
			top: 0,
			behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
				? "instant"
				: "smooth",
		});
		byId("announce").textContent = copy[language].sections[section];
		return;
	}
	const bar = event.target.closest("[data-hour]");
	if (bar) {
		selectedHour = Number(bar.dataset.hour);
		const label = bar.getAttribute("aria-label");
		render();
		byId("main")
			.querySelector(
				matchMedia("(max-width: 720px)").matches
					? `.hour-choice[data-hour="${selectedHour}"]`
					: `.bar-slot[data-hour="${selectedHour}"]`,
			)
			.focus();
		byId("main")
			.querySelector(".signal-detail")
			.classList.add("selection-enter");
		byId("announce").textContent = label;
		return;
	}
	const eventButton = event.target.closest("[data-event]");
	if (eventButton) {
		const index = Number(eventButton.dataset.event);
		openEvent = openEvent === index ? -1 : index;
		render();
		byId("main").querySelector(`[data-event="${index}"]`).focus();
		if (openEvent === index)
			byId(`event-detail-${index}`).classList.add("selection-enter");
		return;
	}
	const rangeButton = event.target.closest("[data-range]");
	if (rangeButton) {
		range = Number(rangeButton.dataset.range);
		openEvent = 0;
		render();
		byId("main").querySelector(`[data-range="${range}"]`).focus();
		const message =
			range === 7
				? copy[language].activity.feedback7
				: copy[language].activity.feedback30;
		byId("rangeFeedback").textContent = message;
		byId("announce").textContent = message;
	}
});
byId("workspaceButton").addEventListener("click", () => {
	menuOpen = !menuOpen;
	byId("workspaceMenu").hidden = !menuOpen;
	byId("workspaceButton").setAttribute("aria-expanded", String(menuOpen));
	if (menuOpen) byId("menuLinks").querySelector("[aria-current=page]").focus();
});
byId("closeMenu").addEventListener("click", () => closeWorkspace(true));
byId("langButton").addEventListener("click", () => {
	language = language === "ar" ? "en" : "ar";
	render();
	byId("announce").textContent = copy[language].sections[section];
});
document.addEventListener("keydown", (event) => {
	if (event.key === "Escape" && menuOpen) closeWorkspace(true);
});
render();
