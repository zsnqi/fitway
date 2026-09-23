/*
 * FITWAY Owner — "Redline" exploration concept (r04).
 * Concept-only artifact with synthetic data. It changes no production code, token, or authority.
 */
(() => {
	/* ---------- Synthetic gym day (gym-local time) ---------- */

	const OPEN = 6 * 60; // opens 6:00 AM
	const SPAN = 17 * 60; // closes 11:00 PM
	const NOW = 850; // current time 8:10 PM, as minutes since opening
	const YMAX = 70;
	const SCHEDULED = SPAN;
	const SECTIONS = [
		"daily",
		"reports",
		"access",
		"activity",
		"operations",
		"settings",
	];

	// Half-hour observations plus the exact peak and latest minutes: [minutes since open, approx. present]
	const BASE = [
		[0, 4],
		[30, 13],
		[60, 26],
		[90, 35],
		[120, 38],
		[150, 31],
		[180, 24],
		[210, 19],
		[240, 16],
		[270, 15],
		[300, 16],
		[330, 19],
		[360, 24],
		[390, 27],
		[420, 25],
		[450, 20],
		[480, 16],
		[510, 14],
		[540, 15],
		[570, 19],
		[600, 26],
		[630, 34],
		[660, 43],
		[690, 51],
		[720, 57],
		[740, 60],
		[750, 59],
		[780, 54],
		[810, 45],
		[840, 37],
		[850, 34],
	];

	const toPoint = ([m, v]) => ({ m, v });

	function buildPreview(kind) {
		if (kind === "gap") {
			const before = BASE.filter(([m]) => m <= 480)
				.map(toPoint)
				.concat({ m: 485, v: 15 });
			const after = [{ m: 520, v: 14 }].concat(
				BASE.filter(([m]) => m >= 540).map(toPoint),
			);
			return {
				segments: [before, after],
				gaps: [{ from: 485, to: 520 }],
				wait: null,
				missingKeys: [{ m: 510, missing: true }],
				entries: 396,
			};
		}
		if (kind === "delayed") {
			const points = BASE.filter(([m]) => m <= 810)
				.map(toPoint)
				.concat({ m: 812, v: 44 });
			return {
				segments: [points],
				gaps: [],
				wait: { from: 812, to: NOW },
				missingKeys: [],
				entries: 377,
			};
		}
		return {
			segments: [BASE.map(toPoint)],
			gaps: [],
			wait: null,
			missingKeys: [],
			entries: 412,
		};
	}

	function summarize(preview) {
		const all = preview.segments.flat();
		const peak = all.reduce((best, p) => (p.v > best.v ? p : best));
		const morning = all
			.filter((p) => p.m < 300)
			.reduce((best, p) => (p.v > best.v ? p : best));
		const segments = preview.segments;
		const latest = segments.at(-1).at(-1);
		let area = 0;
		let minutes = 0;
		for (const seg of segments) {
			for (let i = 0; i < seg.length - 1; i += 1) {
				const dt = seg[i + 1].m - seg[i].m;
				area += ((seg[i].v + seg[i + 1].v) / 2) * dt;
				minutes += dt;
			}
		}
		const missing = preview.gaps.reduce((sum, g) => sum + (g.to - g.from), 0);
		const waiting = preview.wait ? preview.wait.to - preview.wait.from : 0;
		const recorded = latest.m - missing;
		const keys = all.concat(preview.missingKeys).sort((a, b) => a.m - b.m);
		return {
			peak,
			morning,
			latest,
			keys,
			average: area / minutes,
			recorded,
			missing,
			waiting,
			ahead: SPAN - NOW,
		};
	}

	/* ---------- Copy ---------- */

	const COPY = {
		en: {
			docTitle: "FITWAY Owner — Redline · exploration concept",
			skip: "Skip to content",
			workspaceLabel: "Workspace",
			workspaceMgmt: "Management",
			workspaceMon: "Monitoring",
			navLabel: "Sections",
			sections: {
				daily: "Daily",
				reports: "Reports",
				access: "Access",
				activity: "Activity Log",
				operations: "Operations",
				settings: "Settings",
			},
			language: "العربية",
			languageLabel: "Switch to Arabic",
			signOut: "Sign out",
			menu: "Menu",
			concept: "Exploration concept · synthetic data",
			live: "Live",
			delayed: "Delayed",
			delayedSince: (t) => `since ${t}`,
			today: "Today",
			dateLine: "Wednesday, 23 September",
			openLine: `Open ${"6:00 AM"} - ${"11:00 PM"}`,
			latestReading: "Latest reading",
			lastKnown: "Last known reading",
			approx: "≈",
			present: "present",
			bands: {
				quiet: "Quiet",
				moderate: "Moderate",
				busy: "Busy",
				packed: "Packed",
			},
			trendFalling: (t) => `easing off since the <bdi>${t}</bdi> peak`,
			trendRising: "still rising",
			trendDelayed: (t) =>
				`no new readings since <bdi>${t}</bdi>, so this is not live`,
			legendLine: "Observed",
			legendAhead: "Still ahead",
			legendGap: "No readings",
			legendWait: "Waiting for readings",
			peakTag: "Peak",
			morningTag: "Morning high",
			avg: "Avg",
			aheadRegion: (t) => `Still ahead · until <bdi>${t}</bdi>`,
			aheadShort: "Ahead",
			gapLabel: (n) => `<bdi>${n}</bdi> min<br>no readings`,
			waitLabel: (t) => `Waiting<br>since <bdi>${t}</bdi>`,
			chartLabel: "People present through the day",
			chartHint:
				"Hover, tap, or focus the curve and use the arrow keys to read any point.",
			readoutPresent: (n) => `≈ ${n} present`,
			readoutMissing: "No readings",
			readoutMissingNote: "Missing observation, not zero",
			ledgerPeak: "Peak level",
			ledgerPeakNote: (t) => `at <bdi>${t}</bdi>`,
			ledgerAvg: "Average occupancy",
			ledgerAvgNote: (n) => `across <bdi>${n}</bdi> recorded minutes`,
			ledgerEntries: "Total entries",
			ledgerEntriesNote: (h) => `most around <bdi>${h}</bdi>`,
			ledgerCoverage: "Data coverage",
			ledgerCoverageOf: (n) => `/ <bdi>${n}</bdi> min`,
			ledgerCoverageNote: (ahead, missing, waiting) =>
				[
					missing ? `<bdi>${missing}</bdi> min missing` : "",
					waiting ? `<bdi>${waiting}</bdi> min waiting` : "",
					`<bdi>${ahead}</bdi> min still ahead`,
				]
					.filter(Boolean)
					.join(" · "),
			details: "Reading details",
			detailsNote: "every 30 minutes, gym-local time",
			colTime: "Gym-local time",
			colState: "State",
			colCount: "Approx. present",
			colBand: "Crowd band",
			observed: "Observed",
			missing: "Missing observation",
			states: "Preview states (concept only)",
			stLive: "Live day",
			stGap: "Missing stretch",
			stDelayed: "Delayed feed",
			placeholderSub: "Owner workspace",
			placeholder:
				"Not drawn in this early concept. After you choose a direction, this section would follow the same rail, open stage, hairline ledger, and icon family.",
			monitoringTitle: "Monitoring",
			monitoringText:
				"Monitoring is the front-desk live view. It sits outside this Owner concept.",
		},
		ar: {
			docTitle: "فت واي للمالك — الخط الأحمر · مفهوم استكشافي",
			skip: "الانتقال إلى المحتوى",
			workspaceLabel: "مساحة العمل",
			workspaceMgmt: "الإدارة",
			workspaceMon: "المراقبة",
			navLabel: "الأقسام",
			sections: {
				daily: "اليومي",
				reports: "التقارير",
				access: "الوصول",
				activity: "سجل النشاط",
				operations: "التشغيل",
				settings: "الإعدادات",
			},
			language: "English",
			languageLabel: "التبديل إلى اللغة الإنجليزية",
			signOut: "تسجيل الخروج",
			menu: "القائمة",
			concept: "مفهوم استكشافي · بيانات تجريبية",
			live: "مباشر",
			delayed: "متأخر",
			delayedSince: (t) => `منذ <bdi>${t}</bdi>`,
			today: "اليوم",
			dateLine: "الأربعاء 23 سبتمبر",
			openLine: "ساعات العمل <bdi>6:00 ص</bdi> - <bdi>11:00 م</bdi>",
			latestReading: "آخر قراءة",
			lastKnown: "آخر قراءة معروفة",
			approx: "نحو",
			present: "حاضرًا",
			bands: {
				quiet: "هادئ",
				moderate: "متوسط",
				busy: "مزدحم",
				packed: "شديد الازدحام",
			},
			trendFalling: (t) => `يتراجع منذ ذروة <bdi>${t}</bdi>`,
			trendRising: "ما زال في ارتفاع",
			trendDelayed: (t) =>
				`لا قراءات جديدة منذ <bdi>${t}</bdi>، لذا فهي ليست مباشرة`,
			legendLine: "مرصود",
			legendAhead: "لم يحن بعد",
			legendGap: "بلا قراءات",
			legendWait: "بانتظار القراءات",
			peakTag: "الذروة",
			morningTag: "ذروة الصباح",
			avg: "المتوسط",
			aheadRegion: (t) => `لم يحن بعد · حتى <bdi>${t}</bdi>`,
			aheadShort: "متبقٍ",
			gapLabel: (n) => `<bdi>${n}</bdi> دقيقة<br>بلا قراءات`,
			waitLabel: (t) => `بانتظار القراءات<br>منذ <bdi>${t}</bdi>`,
			chartLabel: "عدد الموجودين خلال اليوم",
			chartHint:
				"مرّر المؤشر أو المس المنحنى، أو ركّز عليه واستخدم الأسهم لقراءة أي نقطة.",
			readoutPresent: (n) => `نحو ${n} حاضرًا`,
			readoutMissing: "بلا قراءات",
			readoutMissingNote: "رصد مفقود، وليس صفرًا",
			ledgerPeak: "مستوى الذروة",
			ledgerPeakNote: (t) => `عند <bdi>${t}</bdi>`,
			ledgerAvg: "متوسط الازدحام",
			ledgerAvgNote: (n) => `خلال <bdi>${n}</bdi> دقيقة مسجّلة`,
			ledgerEntries: "إجمالي الدخول",
			ledgerEntriesNote: (h) => `ذروة الدخول عند <bdi>${h}</bdi>`,
			ledgerCoverage: "تغطية البيانات",
			ledgerCoverageOf: (n) => `من <bdi>${n}</bdi> دقيقة`,
			ledgerCoverageNote: (ahead, missing, waiting) =>
				[
					missing ? `<bdi>${missing}</bdi> دقيقة مفقودة` : "",
					waiting ? `<bdi>${waiting}</bdi> دقيقة بالانتظار` : "",
					`<bdi>${ahead}</bdi> دقيقة لم تحن بعد`,
				]
					.filter(Boolean)
					.join(" · "),
			details: "تفاصيل القراءات",
			detailsNote: "كل 30 دقيقة، بتوقيت الصالة",
			colTime: "الوقت المحلي للصالة",
			colState: "الحالة",
			colCount: "العدد التقريبي",
			colBand: "مستوى الازدحام",
			observed: "مرصود",
			missing: "رصد مفقود",
			states: "حالات المعاينة (للمفهوم فقط)",
			stLive: "يوم مباشر",
			stGap: "فترة مفقودة",
			stDelayed: "تغذية متأخرة",
			placeholderSub: "مساحة المالك",
			placeholder:
				"لم يُرسم هذا القسم في المفهوم المبكر. بعد اختيارك للاتجاه، يتبع القسم نفس الشريط الجانبي والمساحة المفتوحة والسجل بخطوطه الرفيعة ونفس عائلة الأيقونات.",
			monitoringTitle: "المراقبة",
			monitoringText:
				"المراقبة هي العرض المباشر لمكتب الاستقبال، وهي خارج نطاق مفهوم المالك هذا.",
		},
	};

	const LOG_COPY = {
		en: {
			title: "Activity Log",
			sub: "Owner and staff actions · gym-local time",
			ownerOnly: "Owner only",
			filtersLabel: "Filter Activity Log",
			action: "Action",
			actor: "Actor",
			from: "From day",
			to: "To day",
			reason: "Reason contains",
			any: "Any",
			clear: "Clear filters",
			colTime: "Time",
			colAction: "Action",
			colActor: "Actor",
			colTarget: "Target",
			colChange: "Previous → new",
			colReason: "Reason",
			noReason: "No reason given",
			shown: (n) => `${n} records shown · End of Activity Log`,
			empty: "No activity records match these filters.",
			days: [
				{ label: "Today", date: "Wednesday, 23 September" },
				{ label: "Yesterday", date: "Tuesday, 22 September" },
				{ label: "Monday", date: "21 September" },
			],
			actions: {
				settings_updated: "Settings updated",
				staff_pin_rotated: "Staff PIN changed",
				staff_pin_provisioned: "Staff PIN created",
				staff_pin_deactivated: "Staff PIN deactivated",
				credential_reset: "Sign-in details reset",
				owner_reactivated: "Owner reactivated",
			},
			actors: {
				owner: "Owner",
				shared_staff: "Front desk",
				system: "Automatic system",
			},
			fromValue: "21 Sep 2026",
			toValue: "23 Sep 2026",
		},
		ar: {
			title: "سجل النشاط",
			sub: "إجراءات المالك والموظفين · بتوقيت الصالة",
			ownerOnly: "للمالك فقط",
			filtersLabel: "تصفية سجل النشاط",
			action: "الإجراء",
			actor: "المنفِّذ",
			from: "من يوم",
			to: "إلى يوم",
			reason: "السبب يحتوي على",
			any: "الكل",
			clear: "مسح التصفية",
			colTime: "الوقت",
			colAction: "الإجراء",
			colActor: "المنفِّذ",
			colTarget: "المستهدف",
			colChange: "السابق ← الجديد",
			colReason: "السبب",
			noReason: "بدون سبب",
			shown: (n) => `عدد السجلات المعروضة ${n} · نهاية سجل النشاط`,
			empty: "لا توجد سجلات مطابقة لعوامل التصفية.",
			days: [
				{ label: "اليوم", date: "الأربعاء 23 سبتمبر" },
				{ label: "أمس", date: "الثلاثاء 22 سبتمبر" },
				{ label: "الاثنين", date: "21 سبتمبر" },
			],
			actions: {
				settings_updated: "تحديث الإعدادات",
				staff_pin_rotated: "تغيير رمز موظف الاستقبال",
				staff_pin_provisioned: "إنشاء رمز موظف الاستقبال",
				staff_pin_deactivated: "تعطيل رمز موظف الاستقبال",
				credential_reset: "إعادة تعيين بيانات الدخول",
				owner_reactivated: "إعادة تفعيل حساب مالك",
			},
			actors: {
				owner: "المالك",
				shared_staff: "مكتب الاستقبال",
				system: "النظام التلقائي",
			},
			fromValue: "21 سبتمبر 2026",
			toValue: "23 سبتمبر 2026",
		},
	};

	// Synthetic records. No names, emails, or credential values: roles and targets only.
	const RECORDS = [
		{
			day: 0,
			t: 19 * 60 + 42,
			action: "settings_updated",
			actor: "owner",
			target: { en: "Opening hours", ar: "ساعات العمل" },
			change: {
				en: ["Fri 11:00 PM", "Fri 10:00 PM"],
				ar: ["الجمعة 11:00 م", "الجمعة 10:00 م"],
			},
			reason: { en: "Shorter Friday evenings", ar: "تقليص مساء الجمعة" },
		},
		{
			day: 0,
			t: 15 * 60 + 5,
			action: "staff_pin_rotated",
			actor: "owner",
			target: { en: "Front desk PIN", ar: "رمز مكتب الاستقبال" },
			change: null,
			reason: { en: "Routine monthly change", ar: "تغيير شهري معتاد" },
		},
		{
			day: 0,
			t: 9 * 60 + 12,
			action: "credential_reset",
			actor: "owner",
			target: { en: "Second owner account", ar: "حساب المالك الثاني" },
			change: null,
			reason: null,
		},
		{
			day: 1,
			t: 22 * 60 + 48,
			action: "staff_pin_deactivated",
			actor: "owner",
			risk: true,
			target: { en: "Previous front desk PIN", ar: "رمز الاستقبال السابق" },
			change: { en: ["Active", "Inactive"], ar: ["مفعّل", "معطّل"] },
			reason: { en: "Old tablet retired", ar: "إيقاف الجهاز اللوحي القديم" },
		},
		{
			day: 1,
			t: 22 * 60 + 46,
			action: "staff_pin_provisioned",
			actor: "owner",
			target: { en: "Front desk PIN", ar: "رمز مكتب الاستقبال" },
			change: null,
			reason: { en: "New front desk tablet", ar: "جهاز لوحي جديد للاستقبال" },
		},
		{
			day: 1,
			t: 18 * 60 + 15,
			action: "settings_updated",
			actor: "owner",
			target: { en: "Capacity", ar: "السعة" },
			change: { en: ["80", "90"], ar: ["80", "90"] },
			reason: { en: "Second floor opened", ar: "افتتاح الطابق الثاني" },
		},
		{
			day: 2,
			t: 11 * 60 + 20,
			action: "owner_reactivated",
			actor: "owner",
			target: { en: "Second owner account", ar: "حساب المالك الثاني" },
			change: { en: ["Inactive", "Active"], ar: ["معطّل", "مفعّل"] },
			reason: { en: "Back from leave", ar: "العودة من الإجازة" },
		},
		{
			day: 2,
			t: 8 * 60 + 40,
			action: "settings_updated",
			actor: "owner",
			target: { en: "Opening hours", ar: "ساعات العمل" },
			change: {
				en: ["Sun 7:00 AM", "Sun 6:00 AM"],
				ar: ["الأحد 7:00 ص", "الأحد 6:00 ص"],
			},
			reason: null,
		},
	];

	/* ---------- Icons: one 24px line family, 1.7 stroke ---------- */

	const ICONS = {
		daily:
			'<path d="M3 17.5c2.2 0 3-6.5 5.6-6.5 2.4 0 2.6 4 5 4 2.7 0 3.4-8.5 7.4-8.5"/>',
		reports:
			'<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v3M16 3v3M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2"/>',
		access:
			'<circle cx="8" cy="15.5" r="3.8"/><path d="M10.8 12.8 19.5 4.1M16.2 7.4l2.4 2.4M13.8 9.8l1.8 1.8"/>',
		activity:
			'<path d="M9.5 6.5h10M9.5 12h10M9.5 17.5h10"/><path d="M4.4 6.5h1.2M4.4 12h1.2M4.4 17.5h1.2"/>',
		operations: '<path d="M3 12.5h3.6l2.2-5.5 3.6 11 2.4-7 1.6 1.5H21"/>',
		settings:
			'<path d="M4 7.5h8.5M16.5 7.5H20M4 16.5h3.5M11.5 16.5H20"/><circle cx="14.5" cy="7.5" r="2"/><circle cx="9.5" cy="16.5" r="2"/>',
		globe:
			'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5Z"/>',
		signout:
			'<path d="M9.5 19.5H6a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2h3.5M15 16l4-4-4-4M19 12H9"/>',
		chevron: '<path d="m6 9 6 6 6-6"/>',
		menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
		lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
		user: '<circle cx="12" cy="8.5" r="3.6"/><path d="M4.5 20c.9-3.8 3.9-6 7.5-6s6.6 2.2 7.5 6"/>',
		rotate: '<path d="M20 12a8 8 0 1 1-2.4-5.7M20 4.5v5h-5"/>',
		ban: '<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>',
		key: '<circle cx="8" cy="15.5" r="3.8"/><path d="M10.8 12.8 19.5 4.1M16.2 7.4l2.4 2.4M13.8 9.8l1.8 1.8"/>',
	};
	const ACTION_ICON = {
		settings_updated: "settings",
		staff_pin_rotated: "key",
		staff_pin_provisioned: "key",
		staff_pin_deactivated: "ban",
		credential_reset: "rotate",
		owner_reactivated: "user",
	};
	const icon = (name, extra = "") =>
		`<svg class="icon ${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

	/* ---------- State ---------- */

	const params = new URLSearchParams(location.search);
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	const state = {
		lang: params.get("lang") === "ar" ? "ar" : "en",
		section: SECTIONS.includes(params.get("section"))
			? params.get("section")
			: "daily",
		preview: ["live", "gap", "delayed"].includes(params.get("state"))
			? params.get("state")
			: "live",
		workspace: "management",
		selected: null,
		filters: { action: "", actor: "", reason: "" },
	};
	const motionAllowed = () =>
		params.get("motion") !== "off" && !reduced.matches;

	const t = () => COPY[state.lang];
	const rtl = () => state.lang === "ar";

	function clock(min, compact = false) {
		const total = OPEN + min;
		const h24 = Math.floor(total / 60) % 24;
		const mm = total % 60;
		const h12 = ((h24 + 11) % 12) + 1;
		const pm = h24 >= 12;
		const suffix = state.lang === "ar" ? (pm ? "م" : "ص") : pm ? "PM" : "AM";
		const body =
			compact && mm === 0 ? `${h12}` : `${h12}:${String(mm).padStart(2, "0")}`;
		return `${body} ${suffix}`;
	}
	function dayClock(minOfDay) {
		return clock(minOfDay - OPEN);
	}
	function fmt(n, digits = 0) {
		return new Intl.NumberFormat(
			state.lang === "ar" ? "ar-u-nu-latn" : "en-US",
			{
				minimumFractionDigits: digits,
				maximumFractionDigits: digits,
			},
		).format(n);
	}
	function band(v) {
		if (v < 16) return "quiet";
		if (v < 36) return "moderate";
		if (v < 56) return "busy";
		return "packed";
	}

	/* ---------- Shell ---------- */

	const app = document.getElementById("app");

	function navItems() {
		return SECTIONS.map(
			(s) =>
				`<button type="button" class="nav__item" data-section="${s}">${icon(s)}<span>${t().sections[s]}</span></button>`,
		).join("");
	}

	function statusChip(extraClass = "") {
		const c = t();
		if (state.preview === "delayed") {
			return `<span class="chip chip--delayed ${extraClass}"><span class="status-dot status-dot--delayed" aria-hidden="true"></span><strong>${c.delayed}</strong> ${c.delayedSince(clock(812))}</span>`;
		}
		return `<span class="chip ${extraClass}"><span class="status-dot status-dot--live" aria-hidden="true"></span><strong>${c.live}</strong></span>`;
	}

	function workspaceSwitch() {
		const c = t();
		return `<div class="workspace" role="group" aria-label="${c.workspaceLabel}">
			<button type="button" data-workspace="management" aria-pressed="${state.workspace === "management"}">${c.workspaceMgmt}</button>
			<button type="button" data-workspace="monitoring" aria-pressed="${state.workspace === "monitoring"}">${c.workspaceMon}</button>
		</div>`;
	}

	function renderShell() {
		const c = t();
		const other = state.lang === "ar" ? "en" : "ar";
		document.documentElement.lang = state.lang;
		document.documentElement.dir = rtl() ? "rtl" : "ltr";
		document.title = c.docTitle;
		app.innerHTML = `
			<a class="skip" href="#main">${c.skip}</a>
			<div class="shell">
				<aside class="rail">
					<div class="brand"><span class="brand__word">FITWAY</span><span class="brand__dot" aria-hidden="true"></span></div>
					<div class="rail__workspace">${workspaceSwitch()}</div>
					<nav class="nav" aria-label="${c.navLabel}">
						<p class="nav__label">${c.navLabel}</p>
						<span class="nav__indicator" aria-hidden="true"></span>
						${navItems()}
					</nav>
					<div class="rail__foot">
						<button type="button" class="rail__action" data-action="language" aria-label="${c.languageLabel}">${icon("globe")}<span lang="${other}">${c.language}</span></button>
						<button type="button" class="rail__action" data-action="signout">${icon("signout", "icon--dir")}<span>${c.signOut}</span></button>
					</div>
				</aside>
				<div class="column">
					<header class="topbar">
						<div class="brand"><span class="brand__word">FITWAY</span><span class="brand__dot" aria-hidden="true"></span></div>
						<div class="topbar__end">
							<span class="topbar__status">${statusChip()}</span>
							<button type="button" class="icon-button" data-action="menu" aria-expanded="false" aria-controls="menu" aria-label="${c.menu}">${icon("menu")}</button>
						</div>
					</header>
					<nav class="strip" aria-label="${c.navLabel}">${navItems()}</nav>
					<main class="main" id="main" tabindex="-1"><div class="view"></div></main>
				</div>
			</div>
			<div class="menu" id="menu" role="dialog" aria-label="${c.menu}">
				${workspaceSwitch()}
				<button type="button" class="rail__action" data-action="language" aria-label="${c.languageLabel}">${icon("globe")}<span lang="${other}">${c.language}</span></button>
				<button type="button" class="rail__action" data-action="signout">${icon("signout", "icon--dir")}<span>${c.signOut}</span></button>
			</div>`;
		const indicator = app.querySelector(".nav__indicator");
		indicator.style.transition = "none";
		updateNav();
		requestAnimationFrame(() => {
			indicator.style.transition = "";
		});
	}

	function updateNav() {
		for (const button of app.querySelectorAll("[data-section]")) {
			const active =
				state.workspace === "management" &&
				button.dataset.section === state.section;
			if (active) button.setAttribute("aria-current", "page");
			else button.removeAttribute("aria-current");
		}
		for (const button of app.querySelectorAll("[data-workspace]")) {
			button.setAttribute(
				"aria-pressed",
				String(button.dataset.workspace === state.workspace),
			);
		}
		const indicator = app.querySelector(".nav__indicator");
		const activeRail = app.querySelector('.rail [aria-current="page"]');
		if (indicator) {
			indicator.style.opacity = activeRail ? "1" : "0";
			if (activeRail)
				indicator.style.transform = `translateY(${activeRail.offsetTop}px)`;
		}
		const strip = app.querySelector(".strip");
		const activeStrip = app.querySelector('.strip [aria-current="page"]');
		if (strip && activeStrip && strip.offsetParent !== null) {
			const stripRect = strip.getBoundingClientRect();
			const itemRect = activeStrip.getBoundingClientRect();
			const delta =
				itemRect.left +
				itemRect.width / 2 -
				(stripRect.left + stripRect.width / 2);
			strip.scrollBy({
				left: delta,
				behavior: motionAllowed() ? "smooth" : "auto",
			});
		}
	}

	/* ---------- Views ---------- */

	function conceptHead(title, sub, extra = "") {
		return `<div class="head">
			<div><h1 class="head__title" id="view-title">${title}</h1><p class="head__sub">${sub}</p></div>
			<div class="head__end"><span class="chip chip--concept">${t().concept}</span>${extra}</div>
		</div>`;
	}

	function dailyView() {
		const c = t();
		const preview = buildPreview(state.preview);
		const s = summarize(preview);
		const delayed = state.preview === "delayed";
		const bandName = c.bands[band(s.latest.v)];
		const trend = delayed
			? c.trendDelayed(clock(s.latest.m))
			: s.latest.m > s.peak.m && s.latest.v < s.peak.v
				? c.trendFalling(clock(s.peak.m))
				: c.trendRising;
		const pct = (n) => `${((n / SCHEDULED) * 100).toFixed(2)}%`;
		const rows = [];
		for (let m = 0; m <= s.latest.m; m += 30) {
			const point = s.keys.find((p) => p.m === m);
			if (!point) continue;
			rows.push(
				point.missing
					? `<tr><td><bdi>${clock(m)}</bdi></td><td class="is-missing">${c.missing}</td><td class="is-missing">—</td><td class="is-missing">—</td></tr>`
					: `<tr><td><bdi>${clock(m)}</bdi></td><td>${c.observed}</td><td class="num">${fmt(point.v)}</td><td>${c.bands[band(point.v)]}</td></tr>`,
			);
		}
		return `<section aria-labelledby="view-title">
			${conceptHead(c.today, `${c.dateLine} · ${c.openLine}`, statusChip("chip--live-desktop"))}
			<div class="stage-wrap">
				<div class="lead ${delayed ? "lead--delayed" : ""}">
					<p class="lead__label"><span class="status-dot ${delayed ? "status-dot--delayed" : "status-dot--live"}" aria-hidden="true"></span>${delayed ? c.lastKnown : c.latestReading} · <bdi>${clock(s.latest.m)}</bdi></p>
					<p class="lead__value"><span class="lead__approx">${c.approx}</span><span class="lead__number num">${fmt(s.latest.v)}</span><span class="lead__unit">${c.present}</span></p>
					<p class="lead__trend"><strong>${bandName}</strong> · ${trend}</p>
				</div>
				<figure class="stage">
					<figcaption class="visually-hidden">${c.chartLabel}</figcaption>
					<div class="stage__plot" tabindex="0" role="slider" aria-label="${c.chartLabel}" aria-valuemin="0" aria-valuemax="${s.keys.length - 1}"></div>
					<div class="stage__foot">
						<p class="stage__hint">${c.chartHint}</p>
						<div class="legend" aria-hidden="true">
							<span><i class="swatch-line"></i>${c.legendLine}</span>
							${preview.gaps.length ? `<span><i class="swatch-gap"></i>${c.legendGap}</span>` : ""}
							${preview.wait ? `<span><i class="swatch-wait"></i>${c.legendWait}</span>` : ""}
							<span><i class="swatch-ahead"></i>${c.legendAhead}</span>
						</div>
					</div>
				</figure>
			</div>
			<div class="ledger">
				<div class="ledger__item">
					<p class="ledger__label">${c.ledgerPeak}</p>
					<p class="ledger__value num">${fmt(s.peak.v)}</p>
					<p class="ledger__note">${c.ledgerPeakNote(clock(s.peak.m))}</p>
				</div>
				<div class="ledger__item">
					<p class="ledger__label">${c.ledgerAvg}</p>
					<p class="ledger__value num">${fmt(s.average, 1)}</p>
					<p class="ledger__note">${c.ledgerAvgNote(fmt(s.recorded))}</p>
				</div>
				<div class="ledger__item">
					<p class="ledger__label">${c.ledgerEntries}</p>
					<p class="ledger__value num">${fmt(preview.entries)}</p>
					<p class="ledger__note">${c.ledgerEntriesNote(clock(660, true))}</p>
				</div>
				<div class="ledger__item">
					<p class="ledger__label">${c.ledgerCoverage}</p>
					<p class="ledger__value num">${fmt(s.recorded)} <small>${c.ledgerCoverageOf(fmt(SCHEDULED))}</small></p>
					<div class="coverage" aria-hidden="true">
						<i class="coverage__rec" style="width:${pct(s.recorded)}"></i>
						${s.missing ? `<i class="coverage__gap" style="width:${pct(s.missing)}"></i>` : ""}
						${s.waiting ? `<i class="coverage__wait" style="width:${pct(s.waiting)}"></i>` : ""}
					</div>
					<p class="ledger__note">${c.ledgerCoverageNote(fmt(s.ahead), s.missing && fmt(s.missing), s.waiting && fmt(s.waiting))}</p>
				</div>
			</div>
			<details class="details">
				<summary>${c.details} <span>${c.detailsNote}</span>${icon("chevron")}</summary>
				<div class="table-wrap" role="region" aria-label="${c.details}" tabindex="0">
					<table>
						<thead><tr><th scope="col">${c.colTime}</th><th scope="col">${c.colState}</th><th scope="col">${c.colCount}</th><th scope="col">${c.colBand}</th></tr></thead>
						<tbody>${rows.join("")}</tbody>
					</table>
				</div>
			</details>
			<div class="states">
				<span id="states-label">${c.states}</span>
				<div class="segmented" role="group" aria-labelledby="states-label">
					<button type="button" data-preview="live" aria-pressed="${state.preview === "live"}">${c.stLive}</button>
					<button type="button" data-preview="gap" aria-pressed="${state.preview === "gap"}">${c.stGap}</button>
					<button type="button" data-preview="delayed" aria-pressed="${state.preview === "delayed"}">${c.stDelayed}</button>
				</div>
			</div>
		</section>`;
	}

	function activityView() {
		const l = LOG_COPY[state.lang];
		const f = state.filters;
		const options = (entries, selected) =>
			`<option value="">${l.any}</option>` +
			entries
				.map(
					([value, label]) =>
						`<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`,
				)
				.join("");
		return `<section aria-labelledby="view-title">
			${conceptHead(l.title, l.sub, `<span class="chip">${icon("lock")}${l.ownerOnly}</span>`)}
			<button type="button" class="filter-toggle" data-action="toggle-filters" aria-expanded="false" aria-controls="log-filters">${icon("settings")}${l.filtersLabel}</button>
			<form class="filters" id="log-filters" role="search" aria-label="${l.filtersLabel}">
				<div class="field"><label for="f-action">${l.action}</label><select id="f-action" class="control" data-filter="action">${options(Object.entries(l.actions), f.action)}</select></div>
				<div class="field"><label for="f-actor">${l.actor}</label><select id="f-actor" class="control" data-filter="actor">${options(Object.entries(l.actors), f.actor)}</select></div>
				<div class="field"><label for="f-from">${l.from}</label><input id="f-from" class="control control--date" value="${l.fromValue}" readonly /></div>
				<div class="field"><label for="f-to">${l.to}</label><input id="f-to" class="control control--date" value="${l.toValue}" readonly /></div>
				<div class="field field--wide"><label for="f-reason">${l.reason}</label><input id="f-reason" class="control control--text" data-filter="reason" value="${f.reason}" autocomplete="off" /></div>
				<button type="button" class="filters__clear" data-action="clear-filters">${l.clear}</button>
			</form>
			<div class="log" id="log-results">${logResults()}</div>
		</section>`;
	}

	function logResults() {
		const l = LOG_COPY[state.lang];
		const f = state.filters;
		const lang = state.lang;
		const matches = RECORDS.filter(
			(r) =>
				(!f.action || r.action === f.action) &&
				(!f.actor || r.actor === f.actor) &&
				(!f.reason ||
					r.reason?.[lang].toLowerCase().includes(f.reason.toLowerCase())),
		);
		if (!matches.length) return `<p class="log__count">${l.empty}</p>`;
		const arrow = lang === "ar" ? "←" : "→";
		let html = "";
		l.days.forEach((d, dayIndex) => {
			const records = matches.filter((r) => r.day === dayIndex);
			if (!records.length) return;
			const first = html === "";
			html += `<h2 class="log__day">${d.label} <span>${d.date}</span></h2>
			<table>
				<colgroup><col style="width:112px"><col style="width:25%"><col style="width:10%"><col style="width:19%"><col style="width:19%"><col></colgroup>
				<thead class="${first ? "" : "visually-hidden"}"><tr>
					<th scope="col">${l.colTime}</th><th scope="col">${l.colAction}</th><th scope="col">${l.colActor}</th>
					<th scope="col">${l.colTarget}</th><th scope="col">${l.colChange}</th><th scope="col">${l.colReason}</th>
				</tr></thead>
				<tbody>${records
					.map(
						(r) => `<tr>
					<td class="log__time num"><bdi>${dayClock(r.t)}</bdi></td>
					<td><span class="log__action"><span class="log__glyph ${r.risk ? "log__glyph--risk" : ""}">${icon(ACTION_ICON[r.action])}</span>${l.actions[r.action]}</span></td>
					<td class="log__actor">${l.actors[r.actor]}</td>
					<td class="log__target">${r.target[lang]}</td>
					<td class="log__change ${r.change ? "" : "is-empty"}">${r.change ? `<bdi>${r.change[lang][0]}</bdi> ${arrow} <bdi>${r.change[lang][1]}</bdi>` : ""}</td>
					<td class="log__reason ${r.reason ? "" : "is-empty"}">${r.reason ? r.reason[lang] : l.noReason}</td>
				</tr>`,
					)
					.join("")}</tbody>
			</table>`;
		});
		return `${html}<p class="log__count">${l.shown(matches.length)}</p>`;
	}

	function placeholderView() {
		const c = t();
		if (state.workspace === "monitoring") {
			return `<section aria-labelledby="view-title">${conceptHead(c.monitoringTitle, c.placeholderSub)}
				<div class="placeholder">${icon("operations")}<p>${c.monitoringText}</p></div></section>`;
		}
		return `<section aria-labelledby="view-title">${conceptHead(c.sections[state.section], c.placeholderSub)}
			<div class="placeholder">${icon(state.section)}<p>${c.placeholder}</p></div></section>`;
	}

	function renderMain({ enter = false, draw = false } = {}) {
		const view = app.querySelector(".view");
		const isDaily =
			state.workspace === "management" && state.section === "daily";
		const isLog =
			state.workspace === "management" && state.section === "activity";
		view.innerHTML = isDaily
			? dailyView()
			: isLog
				? activityView()
				: placeholderView();
		if (enter && motionAllowed()) {
			view.classList.add("is-entering");
			view.classList.remove("is-leaving");
			requestAnimationFrame(() =>
				requestAnimationFrame(() => view.classList.remove("is-entering")),
			);
		} else {
			view.classList.remove("is-entering", "is-leaving");
		}
		const statusSlot = app.querySelector(".topbar__status");
		if (statusSlot) statusSlot.innerHTML = statusChip();
		if (isDaily) mountChart(draw && motionAllowed());
	}

	/* ---------- Chart ---------- */

	let chart = null;
	let resizeObserver = null;

	// Shape-preserving cubic (Steffen): passes through every observation, never overshoots them.
	function curvePath(points, X, Y) {
		const n = points.length;
		if (n === 1) return `M${X(points[0].m)},${Y(points[0].v)}`;
		const h = [];
		const s = [];
		for (let i = 0; i < n - 1; i += 1) {
			h[i] = points[i + 1].m - points[i].m;
			s[i] = (points[i + 1].v - points[i].v) / h[i];
		}
		const m = new Array(n);
		m[0] = s[0];
		m[n - 1] = s[n - 2];
		for (let i = 1; i < n - 1; i += 1) {
			if (s[i - 1] * s[i] <= 0) m[i] = 0;
			else {
				const p = (s[i - 1] * h[i] + s[i] * h[i - 1]) / (h[i - 1] + h[i]);
				m[i] =
					(Math.sign(s[i - 1]) + Math.sign(s[i])) *
					Math.min(Math.abs(s[i - 1]), Math.abs(s[i]), 0.5 * Math.abs(p));
			}
		}
		const f = (x) => x.toFixed(2);
		let d = `M${f(X(points[0].m))},${f(Y(points[0].v))}`;
		for (let i = 0; i < n - 1; i += 1) {
			const a = points[i];
			const b = points[i + 1];
			const third = h[i] / 3;
			d += ` C${f(X(a.m + third))},${f(Y(a.v + m[i] * third))} ${f(X(b.m - third))},${f(Y(b.v - m[i + 1] * third))} ${f(X(b.m))},${f(Y(b.v))}`;
		}
		return d;
	}

	function mountChart(animate) {
		const plot = app.querySelector(".stage__plot");
		if (!plot) return;
		const preview = buildPreview(state.preview);
		chart = { plot, preview, summary: summarize(preview), geo: null };
		state.selected = null;
		const start = () => {
			if (!plot.isConnected) return;
			drawChart(animate);
			if (resizeObserver) resizeObserver.disconnect();
			let lastWidth = plot.clientWidth;
			let lastHeight = plot.clientHeight;
			resizeObserver = new ResizeObserver(() => {
				if (plot.clientWidth === lastWidth && plot.clientHeight === lastHeight)
					return;
				lastWidth = plot.clientWidth;
				lastHeight = plot.clientHeight;
				drawChart(false);
			});
			resizeObserver.observe(plot);
			bindChart(plot);
		};
		// The lead figure overlays the chart on wide screens; measure it only after Cairo is ready.
		if (document.fonts && document.fonts.status !== "loaded")
			document.fonts.ready.then(start);
		else start();
	}

	function leadBox(plot) {
		const lead = app.querySelector(".lead");
		if (!lead || getComputedStyle(lead).position !== "absolute") return null;
		const l = lead.getBoundingClientRect();
		const p = plot.getBoundingClientRect();
		return {
			left: l.left - p.left,
			right: l.right - p.left,
			top: l.top - p.top,
			bottom: l.bottom - p.top,
		};
	}

	function drawChart(animate) {
		const { plot, preview, summary: s } = chart;
		const c = t();
		const w = plot.clientWidth;
		const h = plot.clientHeight;
		const narrow = w < 560;
		const pad = {
			top: narrow ? 40 : 54,
			bottom: 30,
			start: narrow ? 34 : 40,
			end: narrow ? 22 : 84,
		};
		const isRtl = rtl();
		const padL = isRtl ? pad.end : pad.start;
		const padR = isRtl ? pad.start : pad.end;
		const pw = w - padL - padR;
		const ph = h - pad.top - pad.bottom;
		const X = (m) =>
			isRtl ? w - padR - (m / SPAN) * pw : padL + (m / SPAN) * pw;
		const Y = (v) => pad.top + ph - (v / YMAX) * ph;
		const base = Y(0);
		const lead = leadBox(plot);
		chart.geo = {
			w,
			h,
			padL,
			padR,
			pw,
			ph,
			X,
			Y,
			base,
			isRtl,
			narrow,
			lead,
			top: pad.top,
		};

		const band = (from, to, cls) => {
			const x1 = Math.min(X(from), X(to));
			return `<rect class="${cls}" x="${x1}" y="${pad.top - 8}" width="${Math.abs(X(to) - X(from))}" height="${base - pad.top + 8}"/>`;
		};
		// Gridlines step around the overlaid lead figure instead of striking through it.
		const underLead = (y) => lead && y > lead.top - 8 && y < lead.bottom + 8;
		const grid = [0, 20, 40, 60]
			.map((v) => {
				let x1 = padL;
				let x2 = w - padR;
				if (underLead(Y(v))) {
					if (isRtl) x2 = Math.min(x2, lead.left - 28);
					else x1 = Math.max(x1, lead.right + 28);
				}
				return `<line class="grid-line ${v === 0 ? "grid-line--base" : ""}" x1="${x1}" x2="${x2}" y1="${Y(v)}" y2="${Y(v)}"/>`;
			})
			.join("");
		const paths = preview.segments.map((seg) => curvePath(seg, X, Y));
		const areas = preview.segments
			.map(
				(seg, i) =>
					`<path class="area" d="${paths[i]} L${X(seg.at(-1).m)},${base} L${X(seg[0].m)},${base} Z" fill="url(#area)"/>`,
			)
			.join("");
		const latest = s.latest;
		const lx = X(latest.m);
		const ly = Y(latest.v);

		const svg = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false">
			<defs>
				<filter id="glow" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="5.5"/></filter>
				<linearGradient id="area" gradientUnits="userSpaceOnUse" x1="0" y1="${Y(s.peak.v)}" x2="0" y2="${base}">
					<stop offset="0" stop-color="#e51935" stop-opacity="0.5"/>
					<stop offset="0.45" stop-color="#b3102b" stop-opacity="0.22"/>
					<stop offset="1" stop-color="#4d0713" stop-opacity="0.02"/>
				</linearGradient>
				<pattern id="ahead-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<line x1="0" y1="0" x2="0" y2="7" stroke="rgba(245,243,242,0.045)" stroke-width="1.2"/>
				</pattern>
				<pattern id="gap-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<line x1="0" y1="0" x2="0" y2="6" stroke="rgba(154,160,170,0.32)" stroke-width="1.4"/>
				</pattern>
				<pattern id="wait-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
					<line x1="0" y1="0" x2="0" y2="6" stroke="rgba(217,164,0,0.3)" stroke-width="1.4"/>
				</pattern>
			</defs>
			${grid}
			${band(NOW, SPAN, "ahead-band")}
			<line class="ahead-edge" x1="${X(NOW)}" x2="${X(NOW)}" y1="${pad.top - 8}" y2="${base}"/>
			${preview.gaps.map((g) => band(g.from, g.to, "gap-band")).join("")}
			${preview.wait ? band(preview.wait.from, preview.wait.to, "wait-band") : ""}
			<line class="avg-line" x1="${padL}" x2="${w - padR}" y1="${Y(s.average)}" y2="${Y(s.average)}"/>
			<g class="areas">${areas}</g>
			<g class="glows">${paths.map((d) => `<path class="curve-glow" d="${d}"/>`).join("")}</g>
			<g class="curves">${paths.map((d) => `<path class="curve" d="${d}"/>`).join("")}</g>
			<g class="marks">
				<line class="drop-line" x1="${lx}" x2="${lx}" y1="${ly + 8}" y2="${base}"/>
				<circle class="marker-soft" cx="${X(s.morning.m)}" cy="${Y(s.morning.v)}" r="3"/>
				<circle class="marker-peak" cx="${X(s.peak.m)}" cy="${Y(s.peak.v)}" r="5"/>
				<circle class="marker-now" cx="${lx}" cy="${ly}" r="7.5"/>
				<circle class="marker-now-core" cx="${lx}" cy="${ly}" r="2.6"/>
			</g>
			<g class="selection" visibility="hidden">
				<line class="cross-line" y1="${pad.top - 8}" y2="${base}"/>
				<circle class="marker-select" r="6"/>
			</g>
		</svg>`;

		// HTML overlay labels keep Cairo shaping and bidi isolation correct.
		const labels = [];
		const side = isRtl ? "right" : "left";
		const far = isRtl ? "left" : "right";
		for (const v of [0, 20, 40, 60]) {
			if (underLead(Y(v))) continue;
			labels.push(
				`<span class="axis-y num" style="top:${Y(v)}px;${side}:0;width:${pad.start - 10}px;text-align:${far}">${fmt(v)}</span>`,
			);
		}
		const ticks = narrow
			? [0, 240, 480, SPAN]
			: [0, 180, 360, 540, 720, 900, SPAN];
		const nowGap = narrow ? 46 : 60;
		for (const m of ticks) {
			if (Math.abs(X(m) - X(NOW)) < nowGap) continue;
			// Edge ticks align inward so neither end clips.
			const edge = m === 0 ? "axis-x--first" : m === SPAN ? "axis-x--last" : "";
			labels.push(
				`<span class="axis-x ${edge}" style="left:${X(m)}px;top:${base + 10}px"><bdi>${clock(m, true)}</bdi></span>`,
			);
		}
		labels.push(
			`<span class="axis-x axis-x--now" style="left:${X(NOW)}px;top:${base + 10}px"><bdi>${clock(NOW)}</bdi></span>`,
		);
		const avgText = `${c.avg} <bdi class="num">${fmt(s.average, 1)}</bdi>`;
		if (narrow) {
			labels.push(
				`<span class="axis-avg axis-avg--inside" style="top:${Y(s.average) + 11}px;${far}:${(isRtl ? padL : padR) + 2}px">${avgText}</span>`,
			);
		} else {
			labels.push(
				`<span class="axis-avg" style="top:${Y(s.average)}px;${far}:0;width:${pad.end - 12}px;text-align:${side}">${avgText}</span>`,
			);
		}
		labels.push(
			`<span class="tag tag--peak reveal" data-anchor="${X(s.peak.m)}" style="left:${X(s.peak.m)}px;top:${Y(s.peak.v) - 12}px">${c.peakTag} <strong class="num">${fmt(s.peak.v)}</strong> · <bdi>${clock(s.peak.m)}</bdi></span>`,
		);
		labels.push(
			`<span class="tag tag--soft reveal" style="left:${X(s.morning.m)}px;top:${Y(s.morning.v) - 10}px">${narrow ? "" : `${c.morningTag} `}<strong class="num">${fmt(s.morning.v)}</strong></span>`,
		);
		const regionX = X(NOW) + (isRtl ? -8 : 8);
		labels.push(
			narrow
				? `<span class="tag tag--region reveal" style="left:${regionX}px;top:${base - 20}px">${c.aheadShort}</span>`
				: `<span class="tag tag--region reveal" style="left:${regionX}px;top:${pad.top - 4}px">${c.aheadRegion(clock(SPAN))}</span>`,
		);
		for (const g of preview.gaps) {
			labels.push(
				`<span class="tag tag--gap reveal" style="left:${(X(g.from) + X(g.to)) / 2}px;top:${pad.top - 34}px">${c.gapLabel(fmt(g.to - g.from))}</span>`,
			);
		}
		if (preview.wait && !narrow) {
			labels.push(
				`<span class="tag tag--wait reveal" style="left:${(X(preview.wait.from) + X(preview.wait.to)) / 2}px;top:${base - 44}px">${c.waitLabel(clock(preview.wait.from))}</span>`,
			);
		}

		plot.innerHTML = `${svg}${labels.join("")}<div class="readout" hidden><p class="readout__time"></p><p class="readout__value"></p><p class="readout__band"></p></div>`;

		// Keep the peak label on the observed side of the "now" line.
		const peakTag = plot.querySelector(".tag--peak");
		if (peakTag) {
			const half = peakTag.offsetWidth / 2;
			const limit = X(NOW) + (isRtl ? 10 + half : -10 - half);
			let center = X(s.peak.m);
			center = isRtl ? Math.max(center, limit) : Math.min(center, limit);
			center = Math.min(Math.max(center, half + 4), w - half - 4);
			peakTag.style.left = `${center}px`;
		}

		if (state.selected !== null) select(state.selected);
		else updateAria(s.keys.length - 1);

		if (animate) animateDraw(plot, preview);
	}

	function animateDraw(plot, preview) {
		const segments = preview.segments;
		const last = segments.at(-1).at(-1).m;
		const total = 1500;
		const curves = plot.querySelectorAll(".curve");
		const glows = plot.querySelectorAll(".curve-glow");
		segments.forEach((seg, i) => {
			const delay = (seg[0].m / last) * total;
			const duration = Math.max(
				200,
				((seg.at(-1).m - seg[0].m) / last) * total,
			);
			for (const path of [curves[i], glows[i]]) {
				const length = path.getTotalLength();
				path.style.strokeDasharray = `${length}`;
				path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
					duration,
					delay,
					easing:
						segments.length > 1 ? "linear" : "cubic-bezier(0.45, 0.05, 0.2, 1)",
					fill: "backwards",
				});
			}
		});
		// The fill follows the pen, so it never reveals the shape of time the line has not drawn yet.
		plot.querySelector(".areas").animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 600,
			delay: total * 0.8,
			easing: "ease-out",
			fill: "backwards",
		});
		for (const el of plot.querySelectorAll(".marks, .reveal, .axis-x--now")) {
			el.animate([{ opacity: 0 }, { opacity: 1 }], {
				duration: 320,
				delay: total - 80,
				easing: "ease-out",
				fill: "backwards",
			});
		}
	}

	function valueText(point) {
		const c = t();
		const sep = state.lang === "ar" ? "، " : ", ";
		if (point.missing) return [clock(point.m), c.readoutMissingNote].join(sep);
		return [
			clock(point.m),
			c.readoutPresent(point.v),
			c.bands[band(point.v)],
		].join(sep);
	}

	function updateAria(index) {
		const point = chart.summary.keys[index];
		chart.plot.setAttribute("aria-valuenow", String(index));
		chart.plot.setAttribute("aria-valuetext", valueText(point));
	}

	function select(index) {
		const { plot, summary: s, geo } = chart;
		state.selected = index;
		plot.classList.add("is-inspecting");
		const point = s.keys[index];
		const x = geo.X(point.m);
		const group = plot.querySelector(".selection");
		const line = group.querySelector(".cross-line");
		const dot = group.querySelector(".marker-select");
		line.setAttribute("x1", x);
		line.setAttribute("x2", x);
		if (point.missing) dot.setAttribute("visibility", "hidden");
		else {
			dot.setAttribute("visibility", "visible");
			dot.setAttribute("cx", x);
			dot.setAttribute("cy", geo.Y(point.v));
		}
		group.setAttribute("visibility", "visible");
		const c = t();
		const readout = plot.querySelector(".readout");
		readout.hidden = false;
		readout.querySelector(".readout__time").innerHTML =
			`<bdi>${clock(point.m)}</bdi>`;
		readout.querySelector(".readout__value").textContent = point.missing
			? c.readoutMissing
			: c.readoutPresent(fmt(point.v));
		readout.querySelector(".readout__band").textContent = point.missing
			? c.readoutMissingNote
			: c.bands[band(point.v)];
		const rw = readout.offsetWidth;
		const rh = readout.offsetHeight;
		const half = rw / 2;
		const left = Math.min(Math.max(x, half + 6), geo.w - half - 6);
		const anchorY = point.missing ? geo.base - 40 : geo.Y(point.v);
		// Prefer above the point; drop below it near the top edge or where the lead figure sits.
		let above = anchorY - 16 - rh > 4;
		if (above && geo.lead) {
			const top = anchorY - 16 - rh;
			const overlapsLead =
				left + half > geo.lead.left &&
				left - half < geo.lead.right &&
				top < geo.lead.bottom;
			if (overlapsLead) above = false;
		}
		readout.style.left = `${left}px`;
		readout.style.top = `${anchorY}px`;
		readout.style.transform = above ? "" : "translate(-50%, 18px)";
		updateAria(index);
	}

	function clearSelection() {
		if (!chart) return;
		state.selected = null;
		chart.plot.classList.remove("is-inspecting");
		chart.plot
			.querySelector(".selection")
			?.setAttribute("visibility", "hidden");
		const readout = chart.plot.querySelector(".readout");
		if (readout) readout.hidden = true;
		updateAria(chart.summary.keys.length - 1);
	}

	function nearestIndex(clientX) {
		const { plot, summary: s, geo } = chart;
		const rect = plot.getBoundingClientRect();
		const px = clientX - rect.left;
		const ratio = geo.isRtl
			? (geo.w - geo.padR - px) / geo.pw
			: (px - geo.padL) / geo.pw;
		const minute = Math.max(0, Math.min(SPAN, ratio * SPAN));
		let best = 0;
		let bestDistance = Number.POSITIVE_INFINITY;
		s.keys.forEach((p, i) => {
			const d = Math.abs(p.m - minute);
			if (d < bestDistance) {
				bestDistance = d;
				best = i;
			}
		});
		return best;
	}

	function bindChart(plot) {
		plot.addEventListener("pointermove", (event) => {
			if (event.pointerType === "touch" && event.buttons === 0) return;
			select(nearestIndex(event.clientX));
		});
		plot.addEventListener("pointerdown", (event) =>
			select(nearestIndex(event.clientX)),
		);
		plot.addEventListener("pointerleave", (event) => {
			if (event.pointerType === "mouse" && document.activeElement !== plot)
				clearSelection();
		});
		plot.addEventListener("focus", () => {
			if (state.selected === null) select(chart.summary.keys.length - 1);
		});
		plot.addEventListener("blur", clearSelection);
		plot.addEventListener("keydown", (event) => {
			const count = chart.summary.keys.length;
			const current = state.selected ?? count - 1;
			const forward = rtl() ? "ArrowLeft" : "ArrowRight";
			const backward = rtl() ? "ArrowRight" : "ArrowLeft";
			let next = null;
			if (event.key === forward) next = Math.min(count - 1, current + 1);
			else if (event.key === backward) next = Math.max(0, current - 1);
			else if (event.key === "Home") next = 0;
			else if (event.key === "End") next = count - 1;
			else if (event.key === "Escape") {
				clearSelection();
				return;
			}
			if (next !== null) {
				event.preventDefault();
				select(next);
			}
		});
	}

	/* ---------- Navigation and events ---------- */

	function syncUrl() {
		try {
			const next = new URLSearchParams(location.search);
			next.set("lang", state.lang);
			next.set("section", state.section);
			next.set("state", state.preview);
			history.replaceState(null, "", `?${next.toString()}`);
		} catch {
			/* file:// pages may refuse URL updates; the concept still works. */
		}
	}

	function go(section) {
		if (section === state.section && state.workspace === "management") return;
		closeMenu();
		const view = app.querySelector(".view");
		const wasDaily =
			state.section === "daily" && state.workspace === "management";
		state.section = section;
		state.workspace = "management";
		updateNav();
		syncUrl();
		const swap = () =>
			renderMain({ enter: true, draw: section === "daily" && !wasDaily });
		if (motionAllowed()) {
			view.classList.add("is-leaving");
			setTimeout(swap, 150);
		} else swap();
	}

	function setWorkspace(workspace) {
		if (workspace === state.workspace) return;
		closeMenu();
		state.workspace = workspace;
		updateNav();
		renderMain({
			enter: true,
			draw: workspace === "management" && state.section === "daily",
		});
	}

	function toggleLanguage() {
		state.lang = state.lang === "ar" ? "en" : "ar";
		renderShell();
		renderMain();
		syncUrl();
	}

	function closeMenu() {
		const menu = app.querySelector(".menu");
		const button = app.querySelector('[data-action="menu"]');
		menu?.classList.remove("is-open");
		button?.setAttribute("aria-expanded", "false");
	}

	document.addEventListener("click", (event) => {
		const target = event.target.closest(
			"[data-section], [data-action], [data-preview], [data-workspace]",
		);
		if (!target) {
			if (!event.target.closest(".menu")) closeMenu();
			return;
		}
		if (target.dataset.section) go(target.dataset.section);
		else if (target.dataset.workspace) setWorkspace(target.dataset.workspace);
		else if (target.dataset.preview) {
			state.preview = target.dataset.preview;
			syncUrl();
			renderMain({ draw: false });
		} else if (target.dataset.action === "language") toggleLanguage();
		else if (target.dataset.action === "menu") {
			const menu = app.querySelector(".menu");
			const open = !menu.classList.contains("is-open");
			menu.classList.toggle("is-open", open);
			target.setAttribute("aria-expanded", String(open));
			if (open) menu.querySelector("button")?.focus();
		} else if (target.dataset.action === "toggle-filters") {
			const form = app.querySelector("#log-filters");
			const open = !form.classList.contains("is-open");
			form.classList.toggle("is-open", open);
			target.setAttribute("aria-expanded", String(open));
		} else if (target.dataset.action === "clear-filters") {
			state.filters = { action: "", actor: "", reason: "" };
			renderMain();
		}
	});

	document.addEventListener("input", (event) => {
		const key = event.target.dataset?.filter;
		if (!key) return;
		state.filters[key] = event.target.value;
		const results = app.querySelector("#log-results");
		if (results) results.innerHTML = logResults();
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			const menu = app.querySelector(".menu.is-open");
			if (menu) {
				closeMenu();
				app.querySelector('[data-action="menu"]')?.focus();
			}
		}
	});

	window.addEventListener("resize", () => updateNav());

	renderShell();
	renderMain({ draw: true });
	document.fonts?.ready.then(() => updateNav());
})();
