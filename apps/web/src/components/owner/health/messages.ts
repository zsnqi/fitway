type ArabicNoticeOutcome = "delivered" | "failed" | "unconfirmed";

function arabicNoticeSummary(count: number, formatted: string): string {
	switch (new Intl.PluralRules("ar").select(count)) {
		case "zero":
			return "لم تُرسل تنبيهات في هذه الفترة";
		case "one":
			return "أُرسل إشعار واحد عن أعطال هذه الفترة";
		case "two":
			return "أُرسل إشعاران عن أعطال هذه الفترة";
		case "few":
			return `أُرسلت ${formatted} إشعارات عن أعطال هذه الفترة`;
		case "many":
			return `أُرسل ${formatted} إشعاراً عن أعطال هذه الفترة`;
		default:
			return `أُرسل ${formatted} إشعار عن أعطال هذه الفترة`;
	}
}

function arabicNoticeDelivered(count: number, formatted: string): string {
	switch (new Intl.PluralRules("ar").select(count)) {
		case "zero":
			return "لم تصل أي تنبيهات في هذه الفترة";
		case "one":
			return "وصل إشعار واحد عن أعطال هذه الفترة";
		case "two":
			return "وصل إشعاران عن أعطال هذه الفترة";
		case "few":
			return `وصلت ${formatted} إشعارات عن أعطال هذه الفترة`;
		case "many":
			return `وصل ${formatted} إشعاراً عن أعطال هذه الفترة`;
		default:
			return `وصل ${formatted} إشعار عن أعطال هذه الفترة`;
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
		title: "Operations & incidents",
		description: "Counter uptime and incidents over the last business days",
		timeZoneLabel: "Gym timezone",
		windowLabel: "Period",
		windowDays: "business days",

		loading: "Loading the operations summary",
		loadingDescription: "Preparing the recent uptime and incident history.",
		errorTitle: "The operations summary could not be loaded",
		errorDescription: "Check the connection and try again.",
		retry: "Try again",

		unmonitoredTitle: "No monitoring record for this period",
		unmonitoredDescription:
			"Without a monitoring record, uptime cannot be shown. This is not the same as a period with no downtime.",

		uptimeLabel: "Uptime during open hours",
		uptimeUnknown: "Not measurable",
		uptimeUnknownDetail: "There were no open minutes in this period.",
		uptimeOfflineDetail: (duration: string) =>
			`${duration} without readings in this period.`,

		coverageLabel: "Data coverage",
		coverageOf: "recorded minutes",
		coverageComplete: "Every scheduled open minute was recorded.",
		coverageUnknownDetail:
			"There are no scheduled open minutes in this period.",
		coverageSince: "Monitoring history begins",

		noticesLabel: "Alerts sent to maintenance",
		noticesSummary: (count: number, formatted: string) =>
			count === 0
				? "No alerts were sent in this period."
				: `${formatted} ${count === 1 ? "notice" : "notices"} about this period’s incidents`,
		noticesAllDelivered: (count: number, formatted: string) =>
			count === 1
				? "1 notice delivered about this period’s incidents."
				: `${formatted} notices delivered about this period’s incidents.`,
		noticesBreakdown: "delivered · failed to send · unconfirmed",
		deliveredSummary: (_count: number, formatted: string) =>
			`${formatted} delivered`,
		failedSummary: (_count: number, formatted: string) =>
			`${formatted} failed to send`,
		unconfirmedSummary: (_count: number, formatted: string) =>
			`${formatted} unconfirmed`,

		offlineTitle: "Offline periods",
		offlineDescription: "Periods when readings paused, including closed hours.",
		offlineRegion: "Offline periods",
		offlineEmptyTitle: "No offline period in this window",
		offlineEmptyDescription:
			"The counter stayed connected throughout this period.",
		offlineColumnStarted: "Started",
		offlineColumnEnded: "Recovered",
		offlineColumnLength: "Length",
		offlineColumnOpen: "Open minutes affected",
		offlineOngoing: "Not yet recovered",
		offlineClosedOnly: "None — gym closed throughout",
		offlineShown: "Periods shown",
		offlineOf: "of",

		incidentsTitle: "Incidents",
		incidentsDescription:
			"Each incident, when it started, and how alerts were delivered.",
		incidentsRegion: "Incidents",
		incidentsEmptyTitle: "No incident in this window",
		incidentsEmptyDescription: "Nothing went wrong in this period.",
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
			"Uptime covers open hours only, so a failure while the gym is closed does not lower it. Closed-hour alerts are held until shortly before opening and are not listed above. A notice that failed to send does not mean extra downtime.",
		hoursShort: "h",
		minutesShort: "m",
		none: "None",
	},
	ar: {
		title: "التشغيل والأعطال",
		description: "تشغيل جهاز العد والأعطال خلال أيام العمل الأخيرة",
		timeZoneLabel: "توقيت الصالة",
		windowLabel: "الفترة",
		windowDays: "يوم عمل",

		loading: "جارٍ تحميل ملخص التشغيل",
		loadingDescription: "جارٍ تجهيز سجل التشغيل والأعطال الأخير.",
		errorTitle: "تعذر تحميل ملخص التشغيل",
		errorDescription: "تحقق من الاتصال ثم أعد المحاولة.",
		retry: "إعادة المحاولة",

		unmonitoredTitle: "لا يوجد سجل مراقبة لهذه الفترة",
		unmonitoredDescription:
			"بدون سجل مراقبة لا يمكن عرض نسبة التشغيل. وهذا ليس مثل فترة بلا انقطاع.",

		uptimeLabel: "التشغيل خلال ساعات العمل",
		uptimeUnknown: "غير قابل للقياس",
		uptimeUnknownDetail: "لم تكن هناك دقائق عمل في هذه الفترة.",
		uptimeOfflineDetail: (duration: string) =>
			`${duration} بلا قراءات في هذه الفترة.`,

		coverageLabel: "تغطية البيانات",
		coverageOf: "دقيقة مسجّلة",
		coverageComplete: "تم تسجيل كل دقائق العمل المجدولة.",
		coverageUnknownDetail: "لا توجد دقائق عمل مجدولة في هذه الفترة.",
		coverageSince: "يبدأ سجل المراقبة",

		noticesLabel: "التنبيهات المرسلة للصيانة",
		noticesSummary: arabicNoticeSummary,
		noticesAllDelivered: arabicNoticeDelivered,
		noticesBreakdown: "وصل · فشل الإرسال · غير مؤكد",
		deliveredSummary: (count: number, formatted: string) =>
			arabicOutcomeSummary(count, formatted, "delivered"),
		failedSummary: (count: number, formatted: string) =>
			arabicOutcomeSummary(count, formatted, "failed"),
		unconfirmedSummary: (count: number, formatted: string) =>
			arabicOutcomeSummary(count, formatted, "unconfirmed"),

		offlineTitle: "فترات الانقطاع",
		offlineDescription:
			"الفترات التي توقفت فيها القراءات، بما فيها ساعات الإغلاق.",
		offlineRegion: "فترات الانقطاع",
		offlineEmptyTitle: "لا توجد فترة انقطاع في هذه الفترة",
		offlineEmptyDescription: "بقي جهاز العد متصلاً طوال هذه الفترة.",
		offlineColumnStarted: "البداية",
		offlineColumnEnded: "التعافي",
		offlineColumnLength: "المدة",
		offlineColumnOpen: "دقائق العمل المتأثرة",
		offlineOngoing: "لم يتعافَ بعد",
		offlineClosedOnly: "لا شيء — الصالة مغلقة طوال الفترة",
		offlineShown: "الفترات المعروضة",
		offlineOf: "من",

		incidentsTitle: "الأعطال",
		incidentsDescription: "كل عطل ووقت بدايته وكيف وصلت التنبيهات.",
		incidentsRegion: "الأعطال",
		incidentsEmptyTitle: "لا توجد أعطال في هذه الفترة",
		incidentsEmptyDescription: "لم يحدث أي عطل في هذه الفترة.",
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
			"تحتسب نسبة التشغيل دقائق العمل فقط، فلا يخفضها عطل يقع أثناء الإغلاق. وتُؤجَّل تنبيهات ساعات الإغلاق إلى ما قبل الافتتاح ولا تظهر أعلاه. وفشل إرسال إشعار لا يعني انقطاعاً إضافياً.",
		hoursShort: "س",
		minutesShort: "د",
		none: "لا شيء",
	},
} as const;

export type OwnerHealthMessages =
	(typeof ownerHealthMessages)[keyof typeof ownerHealthMessages];
