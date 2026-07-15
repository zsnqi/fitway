import type { MessageCatalog } from "../catalog";

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
