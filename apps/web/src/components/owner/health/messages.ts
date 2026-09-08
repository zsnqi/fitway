type ArabicNoticeOutcome = "delivered" | "failed" | "unconfirmed";

function arabicNoticeSummary(count: number, formatted: string): string {
	switch (new Intl.PluralRules("ar").select(count)) {
		case "zero":
			return "لم يُرسل أي إشعار في هذه الفترة";
		case "one":
			return "أُرسل إشعار واحد في هذه الفترة";
		case "two":
			return "أُرسل إشعاران في هذه الفترة";
		case "few":
			return `أُرسلت ${formatted} إشعارات في هذه الفترة`;
		case "many":
			return `أُرسل ${formatted} إشعاراً في هذه الفترة`;
		default:
			return `أُرسل ${formatted} إشعار في هذه الفترة`;
	}
}

function arabicOutcomeSummary(
	count: number,
	formatted: string,
	outcome: ArabicNoticeOutcome,
): string {
	const plural = new Intl.PluralRules("ar").select(count);
	if (outcome === "delivered") {
		if (plural === "one") return "وصل إشعار واحد";
		if (plural === "two") return "وصل إشعاران";
		if (plural === "few") return `${formatted} إشعارات وصلت`;
		if (plural === "many") return `${formatted} إشعاراً وصل`;
		return `${formatted} إشعار وصل`;
	}
	if (outcome === "failed") {
		if (plural === "one") return "فشل إرسال إشعار واحد";
		if (plural === "two") return "فشل إرسال إشعارين";
		if (plural === "few") return `فشل إرسال ${formatted} إشعارات`;
		if (plural === "many") return `فشل إرسال ${formatted} إشعاراً`;
		return `فشل إرسال ${formatted} إشعار`;
	}
	if (plural === "one") return "إشعار واحد غير مؤكد";
	if (plural === "two") return "إشعاران غير مؤكدين";
	if (plural === "few") return `${formatted} إشعارات غير مؤكدة`;
	if (plural === "many") return `${formatted} إشعاراً غير مؤكد`;
	return `${formatted} إشعار غير مؤكد`;
}

/**
 * Component-owned bilingual copy for the owner incident and uptime summary.
 *
 * Every figure that has a denominator names it in the copy rather than leaving the
 * reader to assume one, and the closed-hours note says plainly that a suppressed
 * condition was never an incident the owner was exposed to.
 *
 * No device name, device identifier, or per-visitor wording exists in this catalog.
 */
export const ownerHealthMessages = {
	en: {
		title: "Uptime and incidents",
		description:
			"What maintenance has been keeping running, over the last business days",
		timeZoneLabel: "Gym timezone",
		windowLabel: "Period",
		windowDays: "business days",

		loading: "Loading the uptime summary",
		loadingDescription: "Preparing the recent incident and uptime history.",
		errorTitle: "The uptime summary could not be loaded",
		errorDescription: "Check the connection and try again.",
		retry: "Try again",

		unmonitoredTitle: "No health history has been recorded yet",
		unmonitoredDescription:
			"Uptime cannot be reported for a period with no recorded health transition. This is not the same as a period with no downtime.",

		uptimeLabel: "Uptime during open hours",
		uptimeOf: "monitored open minutes online",
		uptimeUnknown: "Not measurable",
		uptimeUnknownDetail: "No monitored open minute exists in this period.",

		coverageLabel: "Monitoring coverage",
		coverageOf: "scheduled open minutes monitored",
		coverageSince: "Health history begins",

		noticesLabel: "Alerts sent to maintenance",
		noticesSummary: (count: number, formatted: string) =>
			`${formatted} ${count === 1 ? "notice" : "notices"} sent in this period`,
		noticesBreakdown: "delivered · failed to send · unconfirmed",
		deliveredSummary: (_count: number, formatted: string) =>
			`${formatted} delivered`,
		failedSummary: (_count: number, formatted: string) =>
			`${formatted} failed to send`,
		unconfirmedSummary: (_count: number, formatted: string) =>
			`${formatted} unconfirmed`,

		offlineTitle: "Offline periods",
		offlineDescription: "Connection interruptions, including closed hours.",
		offlineRegion: "Offline periods",
		offlineEmptyTitle: "No offline period in this window",
		offlineEmptyDescription:
			"The edge stayed connected for every monitored minute of this period.",
		offlineColumnStarted: "Started",
		offlineColumnEnded: "Recovered",
		offlineColumnLength: "Length",
		offlineColumnOpen: "Open minutes affected",
		offlineOngoing: "Not yet recovered",
		offlineClosedOnly: "None — gym closed throughout",
		offlineShown: "Periods shown",
		offlineOf: "of",

		incidentsTitle: "Incidents the maintainer was alerted to",
		incidentsDescription:
			"One row per condition, re-alerted at most every 30 minutes.",
		incidentsRegion: "Incidents",
		incidentsEmptyTitle: "No incident in this window",
		incidentsEmptyDescription:
			"No alert condition was raised over this period. Conditions suppressed during closed hours never reach this list.",
		incidentsColumnCondition: "Condition",
		incidentsColumnStarted: "Started",
		incidentsColumnRecovered: "Recovered",
		incidentsColumnNotices: "Alerts sent",
		incidentsColumnDelivery: "Delivery",
		incidentsShown: "Incidents shown",
		incidentsOngoing: "Not yet recovered",

		stale_push: "Counter connection lost",
		process_failure: "Counter issue",
		camera_failure: "Camera issue",
		feed_failure: "Camera feed interrupted",

		delivered: "delivered",
		failed: "failed to send",
		unconfirmed: "unconfirmed",
		deliveryAllDelivered: "All delivered",

		scrollHint: "This table scrolls sideways to reveal every column.",
		footnote:
			"Uptime counts open minutes only, so a failure entirely outside opening hours does not reduce it. Alerting suppresses closed-hours conditions until shortly before opening, so such a condition is not an incident the gym was exposed to and does not appear above. A notice that failed to send is a messaging failure, not extra downtime.",
		hoursShort: "h",
		minutesShort: "m",
		none: "None",
	},
	ar: {
		title: "التشغيل والأعطال",
		description: "ما الذي أبقته الصيانة يعمل خلال أيام العمل الأخيرة",
		timeZoneLabel: "توقيت الصالة",
		windowLabel: "الفترة",
		windowDays: "يوم عمل",

		loading: "جارٍ تحميل ملخص التشغيل",
		loadingDescription: "جارٍ تجهيز سجل الأعطال ونسبة التشغيل الأخيرة.",
		errorTitle: "تعذر تحميل ملخص التشغيل",
		errorDescription: "تحقق من الاتصال ثم أعد المحاولة.",
		retry: "إعادة المحاولة",

		unmonitoredTitle: "لا يوجد سجل حالة حتى الآن",
		unmonitoredDescription:
			"لا يمكن احتساب نسبة التشغيل لفترة لا تحتوي على أي تغيّر حالة مسجَّل. هذا ليس مثل فترة بلا انقطاع.",

		uptimeLabel: "التشغيل خلال ساعات العمل",
		uptimeOf: "من دقائق العمل المراقَبة كانت متصلة",
		uptimeUnknown: "غير قابل للقياس",
		uptimeUnknownDetail: "لا توجد دقيقة عمل مراقَبة ضمن هذه الفترة.",

		coverageLabel: "تغطية المراقبة",
		coverageOf: "من دقائق العمل المجدولة كانت مراقَبة",
		coverageSince: "يبدأ سجل الحالة",

		noticesLabel: "التنبيهات المرسلة للصيانة",
		noticesSummary: arabicNoticeSummary,
		noticesBreakdown: "وصل · فشل الإرسال · غير مؤكد",
		deliveredSummary: (count: number, formatted: string) =>
			arabicOutcomeSummary(count, formatted, "delivered"),
		failedSummary: (count: number, formatted: string) =>
			arabicOutcomeSummary(count, formatted, "failed"),
		unconfirmedSummary: (count: number, formatted: string) =>
			arabicOutcomeSummary(count, formatted, "unconfirmed"),

		offlineTitle: "فترات الانقطاع",
		offlineDescription:
			"كل فترة مسجَّلة بلا بيانات، سواء كانت الصالة مفتوحة حينها أم لا.",
		offlineRegion: "فترات الانقطاع",
		offlineEmptyTitle: "لا توجد فترة انقطاع في هذه الفترة",
		offlineEmptyDescription: "بقي الجهاز متصلاً في كل دقيقة مراقَبة من الفترة.",
		offlineColumnStarted: "البداية",
		offlineColumnEnded: "التعافي",
		offlineColumnLength: "المدة",
		offlineColumnOpen: "دقائق العمل المتأثرة",
		offlineOngoing: "لم يتعافَ بعد",
		offlineClosedOnly: "لا شيء — الصالة مغلقة طوال الفترة",
		offlineShown: "الفترات المعروضة",
		offlineOf: "من",

		incidentsTitle: "الأعطال التي نُبِّهت إليها الصيانة",
		incidentsDescription:
			"سطر واحد لكل حالة، مع إعادة التنبيه كل 30 دقيقة على الأكثر.",
		incidentsRegion: "الأعطال",
		incidentsEmptyTitle: "لا توجد أعطال في هذه الفترة",
		incidentsEmptyDescription:
			"لم تُرصد أي حالة تنبيه خلال الفترة. الحالات المكبوتة أثناء الإغلاق لا تظهر في هذه القائمة أصلاً.",
		incidentsColumnCondition: "الحالة",
		incidentsColumnStarted: "البداية",
		incidentsColumnRecovered: "التعافي",
		incidentsColumnNotices: "التنبيهات المرسلة",
		incidentsColumnDelivery: "الإرسال",
		incidentsShown: "الأعطال المعروضة",
		incidentsOngoing: "لم تتعافَ بعد",

		stale_push: "انقطع اتصال جهاز العد",
		process_failure: "خلل في جهاز العد",
		camera_failure: "خلل في الكاميرا",
		feed_failure: "انقطع بث الكاميرا",

		delivered: "وصل",
		failed: "فشل الإرسال",
		unconfirmed: "غير مؤكد",
		deliveryAllDelivered: "وصلت كلها",

		scrollHint: "يمكن تمرير هذا الجدول أفقياً لعرض بقية الأعمدة.",
		footnote:
			"تحتسب نسبة التشغيل دقائق العمل فقط، لذا لا يخفضها عطل يقع كاملاً خارج ساعات العمل. ويكبت نظام التنبيه حالات الإغلاق حتى ما قبل الافتتاح، فلا تُعد تلك الحالة عطلاً تعرّضت له الصالة ولا تظهر أعلاه. وفشل إرسال إشعار هو فشل في المراسلة لا انقطاع إضافي.",
		hoursShort: "س",
		minutesShort: "د",
		none: "لا شيء",
	},
} as const;

export type OwnerHealthMessages =
	(typeof ownerHealthMessages)[keyof typeof ownerHealthMessages];
