import type { OwnerAccessRefusalCode } from "@/hooks/use-owner-access";

/**
 * Component-owned bilingual copy for the owner access section.
 *
 * Three rules shaped this catalog.
 *
 * The action vocabulary is pinned to the audit trail's own labels
 * (`components/owner/audit/messages.ts`): an owner who reads "staff PIN
 * provisioned" here must see the same words a moment later in the audit
 * history, in both locales.
 *
 * The nine refusals are keyed by the hook's imported `OwnerAccessRefusalCode`
 * union and forced 1:1 with `satisfies` — a code added or removed from the
 * union breaks this file at compile time rather than surfacing to the owner as
 * a bare, unexplained error.
 *
 * Arabic numeric ranges use a plain hyphen. An en dash is `Other Neutral` in
 * the bidi algorithm, so `6–12` in a right-to-left run resolves as `12–6` and
 * the range reverses in front of the reader; a hyphen is a European separator
 * and keeps the run whole.
 */
export const ownerAccessMessages = {
	en: {
		title: "Access",
		description: "Staff PIN and owner accounts",

		loading: "Loading access",
		loadingDescription: "Preparing the front-desk PIN and the owner accounts.",
		errorTitle: "Access could not be loaded",
		errorDescription:
			"No account state has been substituted. Check the connection and try again.",
		retry: "Try again",
		emptyTitle: "No accounts to manage",
		emptyDescription:
			"There is no front-desk PIN and no owner account on record. Provision an owner to begin.",
		failedToApply:
			"The change could not be applied. Check the connection and try again.",

		staffPinTitle: "Staff access PIN",
		staffPinDescription: "Shared · staff monitoring",
		staffPinDetail: "6-12 digits",
		staffPinStateLabel: "Current state",
		staffPinActive: "Active",
		staffPinInactive: "Deactivated",
		staffPinNotProvisioned: "Not provisioned",
		provisionStaffPin: "Provision staff PIN",
		rotateStaffPin: "Rotate staff PIN",
		deactivateStaffPin: "Deactivate staff PIN",
		staffPinReasonHint: "Why the front-desk PIN is being deactivated",

		ownersTitle: "Owner access",
		ownersDescription: "Owner only",
		ownersBoardTitle: "Owners",
		activeCountLabel: "active",
		inactiveCountLabel: "deactivated",
		accountsCountLabel: "accounts",
		provisionOwner: "Provision owner",
		ownerFormLegend: "New owner",
		ownerEmailLabel: "Email",
		ownerDisplayNameLabel: "Display name",
		ownerPasswordLabel: "Initial password",
		ownerPasswordHint:
			"At least 12 characters. It is stored only as a hash and never shown again.",
		ownerPasswordErrors: {
			required: "Enter a password before continuing.",
			min: "Use at least 12 characters.",
			max: "Use no more than 200 characters.",
		},
		ownerCreatedTitle: "Owner created.",
		ownerCreatedDescription: "No credential returned.",
		done: "Done",
		ownerColumnLabel: "Owner",
		ownerStatusLabel: "Status",
		ownerActionsLabel: "Actions",
		ownerActive: "Active",
		ownerInactive: "Deactivated",
		deactivateOwner: "Deactivate",
		reactivateOwner: "Reactivate",
		resetCredential: "Reset credential",
		resetPasswordLabel: "New password",
		resetPasswordHint: "At least 12 characters.",

		reasonLabel: "Reason",
		reasonHint: "Required — this action is recorded in the audit history.",
		confirm: "Confirm",
		cancel: "Cancel",

		revealTitle: "Staff PIN ready",
		revealWarning:
			"Record it now. It is shown once and cannot be retrieved again — the system keeps only a hash.",
		revealPinLabel: "PIN",
		revealDismiss: "Dismiss",

		refusals: {
			staff_pin_already_active:
				"A staff PIN is already active. Rotate it instead of provisioning a new one.",
			staff_pin_not_active:
				"There is no active staff PIN to change. Provision one first.",
			owner_self_deactivation:
				"You cannot deactivate your own account. Ask another active owner to do it.",
			owner_last_active:
				"That owner is the last active owner. Deactivating them would leave the gym with no one able to manage it.",
			owner_already_inactive: "That owner is already deactivated.",
			owner_already_active: "That owner is already active.",
			owner_email_taken: "An owner already exists for that email address.",
			not_an_owner:
				"That account is not an owner account, so this action cannot be applied to it.",
			reason_required:
				"This action requires a reason. Enter one before confirming.",
		} satisfies Record<OwnerAccessRefusalCode, string>,
	},
	ar: {
		title: "الوصول",
		description: "رمز الموظفين وحسابات المالكين",

		loading: "جارٍ تحميل الوصول",
		loadingDescription: "جارٍ تجهيز رمز موظف الاستقبال وحسابات المالكين.",
		errorTitle: "تعذر تحميل الوصول",
		errorDescription: "لم نستبدل أي حالة. تحقق من الاتصال ثم أعد المحاولة.",
		retry: "إعادة المحاولة",
		emptyTitle: "لا توجد حسابات لإدارتها",
		emptyDescription:
			"لا يوجد رمز موظف استقبال ولا حساب مالك مسجَّل. وفّر حساب مالك للبدء.",
		failedToApply: "تعذر تطبيق التغيير. تحقق من الاتصال ثم أعد المحاولة.",

		staffPinTitle: "رمز دخول الموظفين",
		staffPinDescription: "مشترك · لوحة المراقبة",
		staffPinDetail: "6-12 رقماً",
		staffPinStateLabel: "الحالة الحالية",
		staffPinActive: "مفعّل",
		staffPinInactive: "معطّل",
		staffPinNotProvisioned: "لم يُفعَّل بعد",
		provisionStaffPin: "توفير رمز موظف الاستقبال",
		rotateStaffPin: "تغيير رمز موظف الاستقبال",
		deactivateStaffPin: "تعطيل رمز موظف الاستقبال",
		staffPinReasonHint: "لماذا يُعطَّل رمز موظف الاستقبال",

		ownersTitle: "وصول المالكين",
		ownersDescription: "للمالك فقط",
		ownersBoardTitle: "المالكون",
		activeCountLabel: "نشط",
		inactiveCountLabel: "معطّل",
		accountsCountLabel: "حسابات",
		provisionOwner: "توفير حساب مالك",
		ownerFormLegend: "مالك جديد",
		ownerEmailLabel: "البريد الإلكتروني",
		ownerDisplayNameLabel: "اسم العرض",
		ownerPasswordLabel: "كلمة المرور الأولية",
		ownerPasswordHint: "12 حرفاً على الأقل. تُحفظ كبصمة فقط ولا تُعرض مجدداً.",
		ownerPasswordErrors: {
			required: "أدخل كلمة المرور قبل المتابعة.",
			min: "استخدم 12 حرفاً على الأقل.",
			max: "استخدم 200 حرف كحد أقصى.",
		},
		ownerCreatedTitle: "تم إنشاء المالك.",
		ownerCreatedDescription: "لم تُعَد أي بيانات دخول.",
		done: "تم",
		ownerColumnLabel: "المالك",
		ownerStatusLabel: "الحالة",
		ownerActionsLabel: "الإجراءات",
		ownerActive: "مفعّل",
		ownerInactive: "معطّل",
		deactivateOwner: "تعطيل",
		reactivateOwner: "إعادة تفعيل",
		resetCredential: "إعادة تعيين بيانات الدخول",
		resetPasswordLabel: "كلمة المرور الجديدة",
		resetPasswordHint: "12 حرفاً على الأقل.",

		reasonLabel: "السبب",
		reasonHint: "مطلوب — يُسجَّل هذا الإجراء في سجل المراجعة.",
		confirm: "تأكيد",
		cancel: "إلغاء",

		revealTitle: "رمز موظف الاستقبال جاهز",
		revealWarning:
			"سجّله الآن. يُعرض مرة واحدة ولا يمكن استرجاعه — يحتفظ النظام ببصمة فقط.",
		revealPinLabel: "الرمز",
		revealDismiss: "إغلاق",

		refusals: {
			staff_pin_already_active:
				"يوجد رمز موظف استقبال مفعّل بالفعل. غيّره بدل توفير رمز جديد.",
			staff_pin_not_active: "لا يوجد رمز موظف استقبال مفعّل لتغييره. وفّره أولاً.",
			owner_self_deactivation:
				"لا يمكنك تعطيل حسابك أنت. اطلب من مالك مفعّل آخر القيام بذلك.",
			owner_last_active:
				"هذا المالك هو آخر مالك مفعّل. تعطيله سيترك الصالة بلا من يستطيع إدارتها.",
			owner_already_inactive: "هذا المالك معطّل بالفعل.",
			owner_already_active: "هذا المالك مفعّل بالفعل.",
			owner_email_taken: "يوجد مالك بالفعل بهذا البريد الإلكتروني.",
			not_an_owner:
				"هذا الحساب ليس حساب مالك، فلا يمكن تطبيق هذا الإجراء عليه.",
			reason_required: "يتطلب هذا الإجراء سبباً. أدخل سبباً قبل التأكيد.",
		} satisfies Record<OwnerAccessRefusalCode, string>,
	},
} as const;

export type OwnerAccessMessages =
	(typeof ownerAccessMessages)[keyof typeof ownerAccessMessages];
