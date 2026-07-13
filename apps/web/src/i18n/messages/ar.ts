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
	},
	publicPage: {
		eyebrow: "حالة النادي الآن",
		unavailableTitle: "التحديث المباشر غير متاح الآن",
		unavailableDescription:
			"لا نعرض عدداً قديماً على أنه مباشر. يرجى المحاولة مرة أخرى لاحقاً.",
		loading: "جارٍ تحميل حالة الازدحام",
		around: "حوالي",
		people: "شخصًا",
		percentFull: (percent) => `ممتلئ بنسبة ${percent}%`,
		bands: {
			quiet: "هادئ",
			moderate: "متوسط",
			busy: "مزدحم",
			packed: "ممتلئ جدًا",
		},
		fresh: "تحديث مباشر",
		stale: "آخر تحديث معروف",
		lastUpdated: (absolute, relative) => `آخر تحديث ${absolute} · ${relative}`,
		lastKnown: "آخر عدد معروف",
		staleWarning: (count, time) =>
			`كان آخر عدد معروف حوالي ${count} في ${time}. التحديثات المباشرة متأخرة.`,
		meterLabel: "مستوى الإشغال",
		meterValue: (percent, band) => `ممتلئ بنسبة ${percent}%، ${band}`,
		summary: (band, count, percent, freshness, time) =>
			`${freshness}. ${band}. حوالي ${count} شخصًا، ممتلئ بنسبة ${percent}%. آخر تحديث ${time}.`,
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
