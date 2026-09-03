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
		errorDescription:
			"No figure has been substituted. Check the connection and try again.",
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
		noticesOf: "notices sent in this period",
		noticesBreakdown: "delivered · failed to send · unconfirmed",

		offlineTitle: "Offline periods",
		offlineDescription:
			"Every recorded stretch with no accepted push, whether or not the gym was open at the time.",
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
			"One row per condition, not one per message: a single unresolved condition is re-alerted at most every 30 minutes, and each notice is written twice.",
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

		stale_push: "Edge stopped pushing",
		process_failure: "Device reported a process failure",
		camera_failure: "Device reported a camera failure",
		feed_failure: "Device reported a feed failure",

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
		errorDescription: "لم نستبدل أي رقم. تحقق من الاتصال ثم أعد المحاولة.",
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
		noticesOf: "إشعاراً أُرسل في هذه الفترة",
		noticesBreakdown: "وصل · فشل الإرسال · غير مؤكد",

		offlineTitle: "فترات الانقطاع",
		offlineDescription:
			"كل فترة مسجَّلة لم يصل فيها أي إرسال مقبول، سواء كانت الصالة مفتوحة حينها أم لا.",
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
			"سطر واحد لكل حالة، لا لكل رسالة: تُعاد التنبيهات للحالة غير المُعالَجة كل 30 دقيقة على الأكثر، ويُكتب كل إشعار مرتين.",
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

		stale_push: "توقف الجهاز عن الإرسال",
		process_failure: "أبلغ الجهاز عن تعطل التشغيل",
		camera_failure: "أبلغ الجهاز عن تعطل الكاميرا",
		feed_failure: "أبلغ الجهاز عن تعطل البث",

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
