import type { StaffWebMessages } from "@/components/staff/messages";
import type { MessageCatalog } from "../catalog";

const isolate = (value: string) => `\u2068${value}\u2069`;

export const staffWeb = {
	common: {
		operations: "العمليات المباشرة",
		admin: "منطقة المالك",
		languageSwitchLabel: "التبديل إلى اللغة الإنجليزية",
		languageSwitchText: "English",
		logout: "تسجيل الخروج",
		loggingOut: "جارٍ تسجيل الخروج",
		skipToContent: "الانتقال إلى الحالة التشغيلية",
	},
	login: {
		eyebrow: "دخول مكتب الاستقبال",
		title: "فتح العمليات المباشرة",
		description:
			"أدخل الرقم السري المشترك للموظفين لعرض الحالة التشغيلية للنادي.",
		pinLabel: "الرقم السري للموظفين",
		pinHint: (minimum, maximum) =>
			`استخدم من ${isolate(minimum)} إلى ${isolate(maximum)} أرقام غربية.`,
		pinInvalid: (minimum, maximum) =>
			`أدخل رقماً سرياً من ${isolate(minimum)} إلى ${isolate(maximum)} أرقام غربية.`,
		submit: "دخول العمليات",
		submitting: "جارٍ فتح العمليات",
		invalidCredentials:
			"تعذر تسجيل الدخول. تحقق من الرقم السري وحاول مرة أخرى.",
		rateLimited: (seconds) =>
			`محاولات كثيرة. حاول مرة أخرى بعد ${isolate(seconds)} ثانية.`,
		serviceError: "تسجيل الدخول غير متاح مؤقتاً. حاول مرة أخرى.",
	},
	staff: {
		eyebrow: "مكتب الاستقبال",
		title: "العمليات المباشرة",
		description: "حالة الإشغال وصحة النظام الآن في عرض تشغيلي واحد.",
		loading: "جارٍ تحميل الحالة التشغيلية",
		loadErrorTitle: "تعذر تحميل الحالة التشغيلية",
		loadErrorDescription:
			"فشل الطلب. لا نعرض القراءة المفقودة على أنها حالة غير متاحة.",
		retry: "إعادة المحاولة",
		retrying: "جارٍ إعادة المحاولة",
		occupancyTitle: "القراءة الحالية",
		openNow: "النادي مفتوح الآن",
		closedNow: "النادي مغلق الآن",
		live: "قراءة مباشرة",
		stale: "آخر قراءة معروفة",
		staleDescription: "التحديثات المباشرة متأخرة. هذه آخر قيم معروفة.",
		unavailable: "الإشغال غير متاح",
		unavailableDescription: "لا توجد قراءة إشغال صالحة للعرض.",
		crowdLevel: "مستوى الازدحام",
		approximateCount: "العدد التقريبي",
		capacity: "السعة المضبوطة",
		source: "مصدر القراءة",
		sources: { edge: "جهاز الحافة", manual: "قراءة يدوية" },
		lastUpdated: (time) => `آخر تحديث ${isolate(time)}`,
		nextOpen: (time) => `يفتح لاحقاً ${isolate(time)}`,
		computed: (time) => `حُسبت اللقطة ${isolate(time)}`,
		schemaVersion: "إصدار مخطط اللقطة",
		healthTitle: "صحة النظام",
		healthDescription: "حداثة الجهاز وحالته كما قيّمهما الخادم.",
		healthFreshness: "حداثة بيانات الصحة",
		healthCondition: "الحالة العامة",
		process: "عملية العد",
		camera: "الكاميرا",
		feed: "بث الفيديو",
		detectorFps: "معدل الكاشف",
		edgeObservedAt: "الرصد عند الحافة",
		receivedAt: "الاستلام في الخادم",
		lastSeenAt: "آخر اتصال بالجهاز",
		staleAt: "حد التأخر",
		notAvailable: "غير متاح",
		framesPerSecond: (value) => `${isolate(value)} إطار/ثانية`,
		freshness: {
			current: "حالية",
			stale: "متأخرة",
			unavailable: "غير متاحة",
		},
		conditions: {
			healthy: "سليمة",
			degraded: "متراجعة",
			failed: "فاشلة",
			unknown: "غير معروفة",
		},
		deviceStates: {
			ok: "سليم",
			degraded: "متراجع",
			failed: "فاشل",
			unknown: "غير معروف",
		},
		bands: {
			quiet: "هادئ",
			moderate: "متوسط",
			busy: "مزدحم",
			packed: "ممتلئ جدًا",
		},
	},
	admin: {
		eyebrow: "دخول المالك",
		title: "منطقة المالك",
		description: "تنقل مخصص للمالك لعمليات فت واي وحوكمتها.",
		placeholderTitle: "تنقل المالك جاهز",
		placeholderDescription:
			"تصل أقسام التحليلات والإعدادات والحسابات وسجل التدقيق والصحة في مراحلها المحددة.",
		wrongRoleTitle: "يلزم دخول المالك",
		wrongRoleDescription:
			"يمكن لجلسة الموظف هذه استخدام العمليات المباشرة، ولا يمكنها فتح منطقة المالك.",
		backToOperations: "العودة إلى العمليات المباشرة",
	},
} satisfies StaffWebMessages;

export const ar = {
	metadata: {
		title: "فت واي | حالة الازدحام المباشرة",
		description: "تحقق من حالة الازدحام الحالية في فت واي قبل زيارتك.",
	},
	common: {
		brandName: "FITWAY",
		languageSwitchLabel: "التبديل إلى اللغة الإنجليزية",
		languageSwitchText: "English",
		skipToContent: "الانتقال إلى حالة الازدحام",
	},
	publicPage: {
		eyebrow: "حالة النادي الآن",
		open: "النادي مفتوح الآن",
		crowdLevel: "مستوى الازدحام",
		approximateCount: "العدد التقريبي",
		closedTitle: "مغلق الآن",
		opensAt: (time) => `يفتح ${time}`,
		closedSummary: (opening) =>
			opening ? `النادي مغلق الآن. ${opening}.` : "النادي مغلق الآن.",
		unavailableTitle: "التحديث المباشر غير متاح الآن",
		unavailableDescription:
			"لا نعرض عدداً قديماً على أنه مباشر. يرجى المحاولة مرة أخرى لاحقاً.",
		errorTitle: "تعذر تحميل حالة الازدحام",
		errorDescription:
			"تحقق من الاتصال ثم حاول مرة أخرى. لن نعرض بيانات قديمة على أنها مباشرة.",
		retry: "إعادة المحاولة",
		retrying: "جارٍ إعادة المحاولة",
		loading: "جارٍ تحميل حالة الازدحام",
		bands: {
			quiet: "هادئ",
			moderate: "متوسط",
			busy: "مزدحم",
			packed: "ممتلئ جدًا",
		},
		fresh: "تحديث مباشر",
		stale: "آخر تحديث معروف",
		staleStatus: "التحديثات المباشرة متأخرة",
		lastKnownCrowdLevel: "آخر مستوى ازدحام معروف",
		lastKnownApproximateCount: "آخر عدد تقريبي معروف",
		currentLevel: "المستوى الحالي",
		lastKnownLevel: "آخر مستوى معروف",
		lastUpdatedAt: (absolute) => `آخر تحديث ${absolute}`,
		staleWarning: (count, time) =>
			`كان آخر عدد تقريبي معروف ${count} عند ${time}. التحديثات المباشرة متأخرة.`,
		crowdScaleLabel: "مقياس مستوى الازدحام",
		crowdScaleValue: (band, completed, pending) =>
			`مستوى الازدحام: ${band}. المستويات المكتملة: ${completed || "لا يوجد"}. المستويات الأعلى: ${pending || "لا يوجد"}.`,
		summary: (band, count, open, freshness, time) =>
			`${freshness}. ${open}. مستوى الازدحام: ${band}. العدد التقريبي: ${count}. آخر تحديث ${time}.`,
	},
	login: {
		title: "تسجيل الدخول",
		description: "دخول موظفي وإدارة فت واي",
		emailLabel: "البريد الإلكتروني",
		passwordLabel: "كلمة المرور",
		submit: "تسجيل الدخول",
		submitting: "جارٍ تسجيل الدخول",
		loading: "جارٍ تحميل صفحة تسجيل الدخول",
		emailInvalid: "أدخل بريداً إلكترونياً صحيحاً.",
		passwordTooShort: (minimum) =>
			`يجب ألا تقل كلمة المرور عن ${minimum} أحرف.`,
		authError: "تعذر تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.",
	},
} satisfies MessageCatalog;
