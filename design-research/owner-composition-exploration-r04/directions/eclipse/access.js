/* Eclipse Access: FITWAY Owner Access concept (the fourth Eclipse page). Synthetic data only; not production.
 * It answers "who can get in, and how do I change that safely": the front desk's one shared code (view only), then the
 * owner accounts (full access), and from 721 px, beside them, the latest access records with the way to all of them in
 * Activity log (DECISIONS item 34, the skeleton). Every change sits on the row it changes, its buttons under its name;
 * a row keeps its place after a change until the page loads again, so the done sentence stands where the owner acted.
 * The two removals offer an optional reason (at most 240 characters, what the log stores).
 * The owner types the front desk's code (8 to 16 English letters or digits; no generator, no weak-code rule), and it
 * changes in two steps: the code typed, then its one-time view with a copy control, where the old code keeps working;
 * only "I've saved it" makes the new one take effect and signs the front desk out, and "Cancel change" leaves the old
 * code as it was (DECISIONS items 33, 34). After a change, one quiet sentence on that row says it is done and links to
 * Activity log, and the change's record tops the records card; a refusal says exactly what happened and keeps the form
 * as typed. Complete at first paint: no intro, no rolling digits (item 4). Nothing is lit (LGT-6 allows none): the page
 * holds who can get in, not a reading.
 * The data follows the owner access contract (packages/api/src/access/contracts.ts) with the amendments DESIGN-SPEC.md §4.4
 * names: one shared front-desk principal (its code never set, active or deactivated; typed by an owner, shown once,
 * never readable again), and owner principals (a display name stored once, shown the same in both languages; an email;
 * active or not). The signed-in owner is the session's principal (admin.session), so the page marks their row without
 * a new field. The access records are Activity log's (activity.js), with its record ids.
 * Secrets: a typed code exists only in its field and its one-time view, and leaves the page when the view closes; a
 * password is never shown once a change succeeds, and no hash, session or staff email exists anywhere on the page.
 * Query: lang=ar|en; state=loading|error; arrive=<ms>|never (with state=loading); pin=none|off (the code never set, or
 * deactivated; default active); owners=last|many (only the signed-in owner active; eight owners); case=long|short (the
 * longest name and email the contract allows, or short ones); records=none|error (no access record yet; the records
 * could not be loaded); refuse=<code> (the first action that can return that refusal returns it); fail=1 (the first
 * action fails); hold=1 (an action keeps working); ops=delayed|closed|offline (the frame's status, for review);
 * motion=off; refuse=unauthorized simulates a 401 when the owner's session ended elsewhere.
 * Western digits only: numbers are printed with String(), never Intl or toLocaleString. A classic script (no modules
 * and no fetch), so the page works from file:// too. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const LANG = root.lang === "en" ? "en" : "ar";
  const RTL = LANG === "ar";
  const params = new URLSearchParams(location.search);
  // A middle dot between two parts of a line is silent; a screen reader hears this comma instead (decision 25).
  const SR_SEP = `<span class="sr-only">${RTL ? "، " : ", "}</span>`;
  const PAGE = root.dataset.page || "live";
  // The first payload: "ready", "loading", "error", or "retrying" (the error's one retry running).
  let phase = PAGE === "loading" ? "loading" : PAGE === "error" ? "error" : "ready";

  /* ------------------------------------------------------------------ copy */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const bdi = (s) => `<bdi>${s}</bdi>`;
  const nw = (html) => `<span class="nw">${html}</span>`;
  const COPY = {
    ar: {
      skip: "انتقل إلى المحتوى",
      railLabel: "الأقسام",
      brand: "FITWAY، أسماء الأقسام",
      railTip: "أسماء الأقسام",
      nav: { daily: "اليوم", reports: "التقارير", activity: "سجل النشاط", access: "الوصول", operations: "التشغيل", monitoring: "شاشة المراقبة", lang: "English", settings: "الإعدادات", signout: "تسجيل الخروج" },
      tabs: { daily: "اليوم", reports: "التقارير", activity: "النشاط", access: "الوصول", settings: "الإعدادات" },
      opsTitle: "حالة التشغيل",
      more: "المزيد",
      live: "مباشر",
      lastReading: "آخر قراءة",
      hours: "ساعات العمل",
      langAria: "التبديل إلى اللغة الإنجليزية",
      langGlyph: "EN",
      docTitle: "الوصول · FITWAY (مفهوم)",
      title: "الوصول",
      history: "سجل الوصول",
      historyName: "سجل الوصول في سجل النشاط",
      // The access records card (from 721 px): the latest access records, each opening its own record in Activity log.
      recTitle: "سجل الوصول",
      recAll: "عرض الكل",
      recAllName: "عرض كل سجلات الوصول في سجل النشاط",
      recEmpty: "لا سجلات وصول بعد",
      recError: "تعذّر تحميل سجل الوصول",
      today: "اليوم",
      yesterday: "أمس",
      months: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
      // A record in the log's own words (activity.js); the change of one's own password is an amendment (AMD-C1).
      rec: {
        pinCreate: () => "إنشاء رمز مكتب الاستقبال",
        pinChange: () => "تغيير رمز مكتب الاستقبال",
        pinOff: () => "تعطيل رمز مكتب الاستقبال",
        add: (n) => `إنشاء حساب ${n}`,
        off: (n) => `تعطيل حساب ${n}`,
        on: (n) => `إعادة تفعيل حساب ${n}`,
        reset: (n) => `إعادة تعيين كلمة مرور ${n}`,
        mine: (n) => `تغيير كلمة مرور ${n}`,
      },
      // The front desk: one shared principal; its code is its only way in.
      desk: "مكتب الاستقبال",
      deskCap: ["مشاهدة فقط", "رمز مشترك"],
      pinState: { active: "مفعّل", off: "معطّل", none: "لم يُنشأ بعد" },
      pinChange: "تغيير الرمز",
      pinOff: "تعطيل الرمز",
      pinCreate: "إنشاء رمز",
      // The owners.
      owners: "المالكون",
      ownersCap: "كل الصلاحيات",
      add: "إضافة مالك",
      you: "أنت",
      onlyActive: "المالك المفعّل الوحيد",
      deactivated: "معطّل",
      act: { mine: "تغيير كلمة المرور", reset: "تعيين كلمة مرور", off: "تعطيل الحساب", on: "إعادة التفعيل" },
      // A row's buttons say the person to assistive technology, after their visible words (WCAG 2.5.3).
      actSr: (act, n) => `، ${n}`,
      // The dialogs.
      cancel: "إلغاء",
      close: "إغلاق",
      // The code: the owner types it (8 to 16 English letters or digits), then sees it once, with a copy control; the
      // change takes effect only at "I've saved it" (DECISIONS item 34).
      codeChangeTitle: "تغيير رمز مكتب الاستقبال",
      codeCreateTitle: "إنشاء رمز لمكتب الاستقبال",
      codeKeeps: "يبقى الرمز الحالي يعمل حتى تحفظ الجديد.",
      codeNew: "الرمز الجديد",
      codeField: "الرمز",
      codeHint: "من 8 إلى 16 حرفًا إنجليزيًا أو رقمًا",
      next: "متابعة",
      changing: "جارٍ التغيير…",
      pinOffTitle: "تعطيل رمز مكتب الاستقبال؟",
      pinOffDesc: "يُسجَّل خروج مكتب الاستقبال فورًا، ولا يعمل الرمز بعدها.",
      offing: "جارٍ التعطيل…",
      viewTitle: "الرمز الجديد لمكتب الاستقبال",
      viewNote: "احفظ الرمز الآن، فلن يظهر مرة أخرى.",
      viewCommitChange: "عند «حفظتُ الرمز» يعمل الرمز الجديد ويُسجَّل خروج مكتب الاستقبال.",
      viewCommitCreate: "عند «حفظتُ الرمز» يعمل الرمز.",
      viewSaved: "حفظتُ الرمز",
      viewSaving: "جارٍ الحفظ…",
      viewUndoChange: "إلغاء التغيير",
      viewUndoCreate: "إلغاء",
      // The code, read character by character to assistive technology.
      viewPinSay: (d) => `الرمز: ${d}`,
      copy: "نسخ",
      copied: "نُسخ",
      copyName: "نسخ الرمز",
      copySay: "نُسخ الرمز",
      copyFail: "تعذّر النسخ",
      addTitle: "إضافة مالك",
      name: "الاسم",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      newPassword: "كلمة المرور الجديدة",
      currentPassword: "كلمة المرور الحالية",
      pwHint: "12 حرفًا على الأقل",
      show: "إظهار كلمة المرور",
      addDo: "إضافة المالك",
      adding: "جارٍ الإضافة…",
      resetTitle: (n) => `كلمة مرور جديدة لحساب ${n}`,
      // The title names the person; the sentence says what happens to the account, so a long name is never said twice.
      resetDesc: () => "يُسجَّل خروج الحساب فورًا، ولا تعمل كلمة المرور السابقة.",
      resetDo: "حفظ كلمة المرور",
      saving: "جارٍ الحفظ…",
      offTitle: (n) => `تعطيل حساب ${n}؟`,
      offDesc: () => "يُسجَّل خروج الحساب فورًا، ولا يعمل حتى يُعاد تفعيله.",
      onTitle: (n) => `إعادة تفعيل حساب ${n}؟`,
      onDesc: "يعود الحساب للعمل فورًا بكلمة المرور السابقة.",
      oning: "جارٍ التفعيل…",
      mineTitle: "تغيير كلمة المرور",
      mineDesc: "يُسجَّل خروجك من أجهزتك الأخرى، وتبقى مسجّلًا على هذا الجهاز.",
      reason: "السبب (اختياري)",
      // The reason's remaining characters, from 200 typed (the log keeps 240).
      left: (n) => (n === 0 ? "لم يبق أي حرف" : n === 1 ? "بقي حرف واحد" : n === 2 ? "بقي حرفان" : n <= 10 ? `بقيت ${n} أحرف` : `بقي ${n} حرفًا`),
      err: {
        name: "اكتب الاسم",
        email: "اكتب البريد الإلكتروني",
        emailBad: `اكتب بريدًا إلكترونيًا صحيحًا، مثل ${bdi("name@example.com")}`,
        pwShort: "اكتب 12 حرفًا على الأقل",
        current: "اكتب كلمة المرور الحالية",
        code: "اكتب الرمز",
        codeShort: "اكتب 8 أحرف أو أرقام على الأقل",
        codeChars: "استخدم حروفًا إنجليزية وأرقامًا فقط",
      },
      // Each refusal the contract can return, in the words of the action it answers (packages/auth/src/access.ts).
      refuse: {
        staff_pin_already_active: () => "لمكتب الاستقبال رمز مفعّل الآن. غيّره بدل إنشاء رمز جديد.",
        staff_pin_not_active: (a) => (a === "pinOff" ? "رمز مكتب الاستقبال معطّل بالفعل." : "لم يعد لمكتب الاستقبال رمز مفعّل. أنشئ رمزًا جديدًا."),
        owner_self_deactivation: () => "لا يمكنك تعطيل حسابك. يستطيع ذلك مالك مفعّل آخر.",
        owner_last_active: () => "هذا آخر حساب مالك مفعّل، وتعطيله يترك الصالة بلا من يديرها.",
        // The dialog's title names the person, so its refusal says "this account", as its sentence does.
        owner_already_inactive: (a) => (a === "reset" ? "هذا الحساب معطّل. أعد تفعيله أولًا، ثم عيّن كلمة المرور." : "هذا الحساب معطّل بالفعل."),
        owner_already_active: () => "هذا الحساب مفعّل بالفعل.",
        owner_email_taken: (a, n, off) => (n ? (off ? `هذا البريد لحساب ${n} المعطّل. أعد تفعيله بدل إضافة حساب جديد.` : `هذا البريد لحساب ${n}.`) : "هذا البريد مستخدم في حساب مالك آخر."),
        not_an_owner: () => "هذا الحساب ليس حساب مالك، فلا يُطبّق عليه هذا الإجراء.",
        unauthorized: () => "سُجّل خروجك. سجّل الدخول مجددًا للمتابعة.",
        // An amendment beyond the contract ("Change my password"): its one refusal.
        current_password_incorrect: () => "كلمة المرور الحالية غير صحيحة.",
      },
      failed: "تعذّر تنفيذ التغيير، ولم يتغيّر شيء.",
      // After a change: one quiet sentence, in the log's own words, and the way to the record.
      done: {
        pinCreate: () => "أُنشئ رمز مكتب الاستقبال.",
        pinChange: () => "غُيّر رمز مكتب الاستقبال.",
        pinOff: () => "عُطّل رمز مكتب الاستقبال.",
        add: (n) => `أُنشئ حساب ${n}.`,
        off: (n) => `عُطّل حساب ${n}.`,
        on: (n) => `أُعيد تفعيل حساب ${n}.`,
        reset: (n) => `أُعيد تعيين كلمة مرور ${n}.`,
        mine: () => "غُيّرت كلمة مرورك.",
      },
      doneLink: "عرض في سجل النشاط",
      // The page's states: the status words are every page's (STW-1, STW-2).
      errorWord: "خطأ",
      errorLine: "تعذّر التحميل",
      errorFull: "تعذّر تحميل مكتب الاستقبال والمالكين",
      errorHint: "تحقّق من الاتصال، ثم أعد المحاولة.",
      retry: "إعادة المحاولة",
      retrying: "جارٍ المحاولة…",
      loadingWord: "جارٍ التحميل…",
      loadingSay: "جارٍ تحميل مكتب الاستقبال والمالكين",
      arrivedSay: "حُمّل مكتب الاستقبال والمالكون",
    },
    en: {
      skip: "Skip to content",
      railLabel: "Sections",
      brand: "FITWAY, section names",
      railTip: "Section names",
      nav: { daily: "Today", reports: "Reports", activity: "Activity log", access: "Access", operations: "Operations", monitoring: "Monitoring", lang: "العربية", settings: "Settings", signout: "Sign out" },
      tabs: { daily: "Today", reports: "Reports", activity: "Activity", access: "Access", settings: "Settings" },
      opsTitle: "Operations status",
      more: "More",
      live: "Live",
      lastReading: "Last reading",
      hours: "Open",
      langAria: "Switch to Arabic",
      langGlyph: "AR",
      docTitle: "Access · FITWAY (concept)",
      title: "Access",
      history: "Access history",
      historyName: "Access history in the Activity log",
      recTitle: "Access history",
      recAll: "View all",
      recAllName: "View all access records in the Activity log",
      recEmpty: "No access records yet",
      recError: "Couldn't load the access history",
      today: "Today",
      yesterday: "Yesterday",
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      // The log's words, with DECISIONS item 34's English pair (Deactivate / Reactivate) and "code", since it may hold
      // letters; Activity log's English follows in its own round.
      rec: {
        pinCreate: () => "Front desk code created",
        pinChange: () => "Front desk code changed",
        pinOff: () => "Front desk code deactivated",
        add: (n) => `Account created for ${n}`,
        off: (n) => `Account deactivated for ${n}`,
        on: (n) => `Account reactivated for ${n}`,
        reset: (n) => `Password reset for ${n}`,
        mine: (n) => `Password changed by ${n}`,
      },
      desk: "Front desk",
      deskCap: ["View only", "Shared code"],
      pinState: { active: "Active", off: "Deactivated", none: "Not created yet" },
      pinChange: "Change code",
      pinOff: "Deactivate code",
      pinCreate: "Create code",
      owners: "Owners",
      ownersCap: "Full access",
      add: "Add owner",
      you: "You",
      onlyActive: "The only active owner",
      deactivated: "Deactivated",
      act: { mine: "Change password", reset: "Reset password", off: "Deactivate", on: "Reactivate" },
      actSr: (act, n) => (act === "reset" ? ` for ${n}` : ` the account for ${n}`),
      cancel: "Cancel",
      close: "Close",
      codeChangeTitle: "Change the front desk code",
      codeCreateTitle: "Create a front desk code",
      codeKeeps: "The current code keeps working until you save the new one.",
      codeNew: "New code",
      codeField: "Code",
      codeHint: "8 to 16 English letters or digits",
      next: "Continue",
      changing: "Changing…",
      pinOffTitle: "Deactivate the front desk code?",
      pinOffDesc: "The front desk is signed out at once, and the code stops working.",
      offing: "Deactivating…",
      viewTitle: "New front desk code",
      viewNote: "Save this code now. It won't be shown again.",
      viewCommitChange: "“I've saved it” turns on the new code and signs the front desk out.",
      viewCommitCreate: "“I've saved it” turns on the code.",
      viewSaved: "I've saved it",
      viewSaving: "Saving…",
      viewUndoChange: "Cancel change",
      viewUndoCreate: "Cancel",
      viewPinSay: (d) => `Code: ${d}`,
      copy: "Copy",
      copied: "Copied",
      copyName: "Copy the code",
      copySay: "Code copied",
      copyFail: "Couldn't copy",
      addTitle: "Add an owner",
      name: "Name",
      email: "Email",
      password: "Password",
      newPassword: "New password",
      currentPassword: "Current password",
      pwHint: "At least 12 characters",
      show: "Show password",
      addDo: "Add owner",
      adding: "Adding…",
      resetTitle: (n) => `New password for ${n}`,
      resetDesc: () => "This signs the account out at once, and the old password stops working.",
      resetDo: "Save password",
      saving: "Saving…",
      offTitle: (n) => `Deactivate the account for ${n}?`,
      offDesc: () => "This signs the account out at once, and it stops working until it's reactivated.",
      onTitle: (n) => `Reactivate the account for ${n}?`,
      onDesc: "The account works again at once, with its previous password.",
      oning: "Reactivating…",
      mineTitle: "Change your password",
      mineDesc: "You're signed out on your other devices; this one stays signed in.",
      reason: "Reason (optional)",
      left: (n) => (n === 0 ? "No characters left" : n === 1 ? "1 character left" : `${n} characters left`),
      err: {
        name: "Enter a name",
        email: "Enter an email address",
        emailBad: "Enter an email address like name@example.com",
        pwShort: "Use at least 12 characters",
        current: "Enter your current password",
        code: "Enter the code",
        codeShort: "Use at least 8 letters or digits",
        codeChars: "Use only English letters and digits",
      },
      refuse: {
        staff_pin_already_active: () => "The front desk already has an active code. Change it instead of creating one.",
        staff_pin_not_active: (a) => (a === "pinOff" ? "The front desk code is already deactivated." : "The front desk no longer has an active code. Create a new one."),
        owner_self_deactivation: () => "You can't deactivate your own account. Another active owner can.",
        owner_last_active: () => "This is the last active owner account. Deactivating it would leave no one to manage the gym.",
        owner_already_inactive: (a) => (a === "reset" ? "This account is deactivated. Reactivate it first, then set the password." : "This account is already deactivated."),
        owner_already_active: () => "This account is already active.",
        owner_email_taken: (a, n, off) => (n ? (off ? `This email belongs to the deactivated account for ${n}. Reactivate it instead of adding a new one.` : `This email belongs to the account for ${n}.`) : "Another owner account already uses this email."),
        not_an_owner: () => "This account isn't an owner account. Only owner accounts can be changed here.",
        unauthorized: () => "You've been signed out. Sign in again to continue.",
        current_password_incorrect: () => "That isn't your current password.",
      },
      failed: "Couldn't make the change. Nothing was changed.",
      done: {
        pinCreate: () => "Front desk code created.",
        pinChange: () => "Front desk code changed.",
        pinOff: () => "Front desk code deactivated.",
        add: (n) => `Account created for ${n}.`,
        off: (n) => `Account deactivated for ${n}.`,
        on: (n) => `Account reactivated for ${n}.`,
        reset: (n) => `Password reset for ${n}.`,
        mine: () => "Your password was changed.",
      },
      doneLink: "View in Activity log",
      errorWord: "Error",
      errorLine: "Couldn't load",
      errorFull: "Couldn't load the front desk and the owners",
      errorHint: "Check the connection, then try again.",
      retry: "Try again",
      retrying: "Trying again…",
      loadingWord: "Loading…",
      loadingSay: "Loading the front desk and the owners",
      arrivedSay: "Front desk and owners loaded",
    },
  };
  const L = COPY[LANG];

  /* ------------------------------------------------------------ the gym's access (synthetic, from the contract)
   * Owners: the signed-in owner «فهد», «نورة», and a deactivated owner whose name was typed in Latin letters. A name is
   * the one string the owner typed, shown the same in both languages (DECISIONS item 32); emails are Latin and on the
   * reserved example domains. ?case=long gives the longest values the contract allows (a 120-character name in each
   * script, a 254-character email); ?case=short short ones. ?owners=last leaves the signed-in owner the only active one;
   * ?owners=many shows eight. The front desk's code: active by default; ?pin=none never set; ?pin=off deactivated. */
  const ME = "o1";
  const LONG_AR = "نورة بنت عبد الله بن عبد الرحمن العبد اللطيف، مديرة العمليات والمرافق في فرعي شمال الرياض والدرعية وفرع الخرج للنساء فقط";
  const LONG_EN = "Abdulrahman bin Abdulaziz Alqahtani, Operations and Facilities Manager, the North Riyadh, Diriyah, and Al Kharj branches";
  const LONG_MAIL = "noura.bint.abdullah.alabdullatif.operations.facilities.riyadh001@north-riyadh-and-diriyah-womens-branches-operations-department.facilities-management-and-member-services-administration-team.riyadh-diriyah-and-al-kharj-shared-owner-accounts-groups.example";
  const P = (id, name, email, active) => ({ id, name, email, active });
  const OWNERS0 = (() => {
    const set = params.get("owners");
    const base = [P("o1", "فهد", "fahad@example.com", true), P("o2", "نورة", "noura@example.com", set !== "last"), P("o3", "Omar Alharbi", "omar.alharbi@example.com", false)];
    if (set === "many") {
      base.push(P("o4", "ريم", "reem.alotaibi@example.com", true), P("o5", "Khalid Alqahtani", "khalid@example.com", true), P("o6", "عبدالله الشهري", "a.alshehri@example.com", true),
        P("o7", "سلطان", "sultan.almutairi@example.com", false), P("o8", "Mona Alzahrani", "mona.z@example.com", false));
    }
    const c = params.get("case");
    if (c === "long") { base[1].name = LONG_AR; base[1].email = LONG_MAIL; base[2].name = LONG_EN; base[2].email = "omar.alharbi.facilities.and.operations@riyadh-north.example.com"; }
    if (c === "short") { base[1].name = "لين"; base[1].email = "l@example.com"; base[2].name = "Bo"; base[2].email = "bo@example.com"; }
    return base;
  })();
  const data = {
    desk: { state: ["none", "off"].includes(params.get("pin")) ? params.get("pin") : "active" },
    owners: OWNERS0.map((o) => ({ ...o })),
  };
  const ownerOf = (id) => data.owners.find((o) => o.id === id);
  const activeCount = () => data.owners.filter((o) => o.active).length;
  // As loaded: the signed-in owner first, then the other active owners as created, then the deactivated ones, quieter,
  // at the end. A row keeps its place after a change until the page loads again (review V15), so a deactivated or
  // reactivated owner never jumps away from the click, and its done sentence stands where the owner acted; a new owner
  // takes the place it will have on the next load, after the active ones.
  const sorted = () => [ownerOf(ME), ...data.owners.filter((o) => o.id !== ME && o.active), ...data.owners.filter((o) => o.id !== ME && !o.active)].filter(Boolean);
  let order = sorted().map((o) => o.id);
  const ordered = () => order.map(ownerOf).filter(Boolean);
  function placeNew(id) {
    const shown = ordered();
    let at = 0;
    shown.forEach((o, i) => { if (o.active) at = i + 1; });
    order.splice(at, 0, id);
  }

  /* The access records (Activity log's, activity.js): the owners' changes to access, newest first, with the record ids
   * Activity log gives them, so a record here opens the same record there (?record=<id>; Activity log's arrival by id
   * is AMD-C2). The front desk writes no record (ADR-008). A change made on this page writes its record, which tops the
   * card at once. ?records=none: no access record yet; ?records=error: the records could not be loaded. */
  const REC_N = 8;                             // the card's records: the latest eight
  const RECORDS_MODE = ["none", "error"].includes(params.get("records")) ? params.get("records") : "ok";
  const RECORDS0 = [
    [54, "2026-09-22", 555, "o1", "pinCreate"], [52, "2026-09-21", 1082, "o1", "pinOff"], [42, "2026-09-14", 800, "o2", "pinChange"],
    [34, "2026-09-07", 571, "o1", "reset", "o2"], [33, "2026-09-07", 568, "o1", "on", "o2"], [20, "2026-08-27", 843, "o1", "off", "o2"],
    [9, "2026-08-17", 614, "o1", "pinChange"], [6, "2026-06-01", 588, "o1", "pinChange"], [3, "2025-12-30", 1265, "o1", "add", "o2"],
    [1, "2025-12-28", 972, "o1", "pinCreate"],
  ].map(([id, date, mins, by, act, target]) => ({ id, date, mins, by, act, target }));
  const LOG_NAMES = { o1: "فهد", o2: "نورة" };  // the names the log stores (activity.js), as typed
  // The records agree with the code's state the page shows: a code never set has no code records; a deactivated one
  // was last deactivated (21 September), not created again.
  const loadedRecords = () => RECORDS0.filter((r) => (data.desk.state === "none" ? !r.act.startsWith("pin") : data.desk.state === "off" ? r.id !== 54 : true));
  const records = { phase: RECORDS_MODE === "error" ? "error" : "ready", list: RECORDS_MODE === "none" ? [] : loadedRecords() };
  let nextRecordId = 57;                       // after the original sample's 1-56; reserved historical ids are skipped
  // A stored name, isolated so it keeps its own direction in either language; an email, left to right, breakable only
  // after its "@" and dots (and anywhere, as a last resort, for the longest the contract allows).
  const nm = (o) => bdi(esc(o.name));
  const mailHTML = (o) => `<bdi dir="ltr">${esc(o.email).replace(/([@.])/g, "$1<wbr>")}</bdi>`;

  /* ---------------------------------------------------------------- motion */
  const URL_OFF = params.get("motion") === "off";
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  const motionOn = () => !URL_OFF && !mqReduce.matches;
  root.dataset.motion = motionOn() ? "on" : "off";
  const EASE = { rail: "cubic-bezier(0.22, 1, 0.36, 1)", railClose: "cubic-bezier(0.4, 0, 0.2, 1)" };
  const T = { railOpen: 240, railClose: 200, railDist: 156, railReveal: 12, dlgOpen: 240, dlgClose: 200 };
  const f2 = (n) => n.toFixed(2);

  /* ---------------------------------------------------------------- shell */
  document.title = L.docTitle;
  document.querySelectorAll("[data-t]").forEach((el) => { const v = L[el.dataset.t]; if (typeof v === "string") el.innerHTML = v; });
  const rail = $("#rail"), brand = $("#brand");
  rail.setAttribute("aria-label", L.railLabel);
  brand.setAttribute("aria-label", L.brand);
  $$(".rail-item[data-nav]").forEach((a) => {
    const key = a.dataset.nav, name = L.nav[key];
    $(".rail-name", a).textContent = name;
    a.setAttribute("aria-label", key === "lang" ? L.langAria : name);
    if (a.hasAttribute("data-inert")) a.addEventListener("click", (e) => e.preventDefault());
  });
  $("#lang-glyph").textContent = L.langGlyph;
  $("#lang-glyph").setAttribute("lang", "en");
  // Today, Reports and Activity log keep the language (and ?motion=off), as their own links to each other do; the way to
  // the access records opens Activity log on the access kind (OWN-A9).
  const keep = new URLSearchParams({ lang: LANG });
  if (URL_OFF) keep.set("motion", "off");
  for (const id of ["#daily-link", "#tab-daily"]) $(id).setAttribute("href", `index.html?${keep}`);
  for (const id of ["#reports-link", "#tab-reports"]) $(id).setAttribute("href", `reports.html?${keep}`);
  for (const id of ["#activity-link", "#tab-activity"]) $(id).setAttribute("href", `activity.html?${keep}`);
  const LOG_HREF = `activity.html?kind=access&${keep}`;
  const historyLink = $("#history-link");
  historyLink.setAttribute("href", LOG_HREF);
  historyLink.setAttribute("aria-label", L.historyName);
  const langLink = $("#lang-link"), menuLang = $("#menu-lang");
  for (const el of [langLink, menuLang]) el.setAttribute("hreflang", RTL ? "en" : "ar");
  $(".rail-name", langLink).setAttribute("lang", RTL ? "en" : "ar");
  {
    // The other language keeps every review switch.
    const p = new URLSearchParams(location.search);
    p.set("lang", RTL ? "en" : "ar");
    langLink.setAttribute("href", `?${p}`);
    menuLang.setAttribute("href", `?${p}`);
  }

  /* ---- rail: the Daily page's rail and its motion (app.js "rail"), as every Owner page takes it. */
  let railOpen = false;
  let openDlg = null;
  const railRun = { anims: [], surface: null, open: false };
  function finishRail() {
    if (!railRun.surface) return;
    const anims = railRun.anims;
    railRun.anims = [];
    anims.forEach((a) => a.cancel());
    railRun.surface.remove();
    railRun.surface = null;
    rail.classList.remove("is-morph");
    rail.dataset.open = String(railRun.open);
  }
  function animateRail(open) {
    finishRail();
    if (!motionOn()) { rail.dataset.open = String(open); return; }
    const s = document.createElement("i");
    s.className = "rail-surface";
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<i class="rs-shadow"></i><i class="rs-start"><i></i></i><i class="rs-mid"><i></i></i><i class="rs-end"><i></i></i>';
    rail.prepend(s);
    rail.classList.add("is-morph");
    rail.dataset.open = "true";
    railRun.surface = s;
    railRun.open = open;
    const [shadow, start, mid, end] = s.children;
    const d = (RTL ? -1 : 1) * T.railDist;
    const o = open ? { duration: T.railOpen, easing: EASE.rail, fill: "both" } : { duration: T.railClose, easing: EASE.railClose, fill: "both" };
    const kf = (a, b) => (open ? [a, b] : [b, a]);
    const an = [];
    an.push(end.animate(kf({ transform: "translateX(0px)" }, { transform: `translateX(${d}px)` }), o));
    an.push(mid.animate(kf({ transform: "scaleX(0)" }, { transform: "scaleX(1)" }), o));
    an.push(shadow.animate(kf({ opacity: 0 }, { opacity: 1 }), o));
    [start, mid, end].forEach((p) => an.push(p.firstElementChild.animate(kf({ opacity: 0 }, { opacity: 1 }), o)));
    const rr = rail.getBoundingClientRect(), closedW = rr.width - T.railDist;
    rail.querySelectorAll(".rail-name").forEach((n) => {
      const bx = n.getBoundingClientRect();
      const a = RTL ? rr.right - bx.right : bx.left - rr.left, w = bx.width;
      const p0 = Math.min(1, Math.max(0, (a + T.railReveal - closedW) / T.railDist));
      const p1 = Math.min(1, Math.max(p0, (a + w + T.railReveal - closedW) / T.railDist));
      const clip = (hidden) => { const e = f2(hidden ? w + 8 : -8); return RTL ? `inset(-8px -8px -8px ${e}px)` : `inset(-8px ${e}px -8px -8px)`; };
      const frames = [{ offset: 0, clipPath: clip(1) }, { offset: p0, clipPath: clip(1) }, { offset: p1, clipPath: clip(0) }, { offset: 1, clipPath: clip(0) }];
      an.push(n.animate(open ? frames : frames.map((k) => ({ ...k, offset: 1 - k.offset })).reverse(), o));
    });
    railRun.anims = an;
    Promise.all(an.map((x) => x.finished)).then(() => { if (railRun.anims === an) finishRail(); }).catch(() => {});
  }

  /* ---- the frame (every Owner page's): the desktop rail at 1024 px and wider; the same rail from 721 to 1023 px as a
   * modal layer; at 720 px and below the bar and the compact header, whose menu holds Monitoring, the language and sign
   * out. At every size the header's status opens Operations' details. */
  const mqTablet = matchMedia("(min-width: 721px) and (max-width: 1023px)");
  const mqPhone = matchMedia("(max-width: 720px)");
  const scrim = $("#rail-scrim");
  const railFocusables = () => [...rail.querySelectorAll("button, a[href]")];
  let railModal = false, scrimFade = null;
  const setRailModal = (on) => {
    if (on === railModal) return;
    railModal = on;
    for (const el of [$("#main"), $(".skip")]) el.inert = on;
    if (scrimFade) { scrimFade.cancel(); scrimFade = null; }
    scrim.style.pointerEvents = on ? "" : "none";
    if (on) scrim.hidden = false;
    if (!motionOn() || scrim.hidden) { scrim.hidden = !on; return; }
    const run = scrim.animate(on ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }],
      on ? { duration: T.railOpen, easing: EASE.rail } : { duration: T.railClose, easing: EASE.railClose, fill: "forwards" });
    scrimFade = run;
    run.finished.then(() => { if (scrimFade !== run) return; scrimFade = null; if (!on) { scrim.hidden = true; run.cancel(); } }).catch(() => {});
  };
  const setRail = (open) => {
    if (open === railOpen) return;
    railOpen = open;
    brand.setAttribute("aria-expanded", String(open));
    setRailModal(open && mqTablet.matches);
    animateRail(open);
  };
  brand.addEventListener("click", () => setRail(!railOpen));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && railOpen && !openDlg) { setRail(false); brand.focus(); } });
  document.addEventListener("pointerdown", (e) => { if (railOpen && !rail.contains(e.target)) setRail(false); });
  rail.addEventListener("focusout", (e) => { if (railOpen && !railModal && e.relatedTarget && !rail.contains(e.relatedTarget)) setRail(false); });
  rail.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || !railModal) return;
    const f = railFocusables(), i = f.indexOf(document.activeElement);
    const next = e.shiftKey ? (i <= 0 ? f[f.length - 1] : null) : (i === f.length - 1 ? f[0] : null);
    if (next) { e.preventDefault(); next.focus(); }
  });

  const layers = { ops: { btn: $("#ops-btn"), pop: $("#ops-pop") }, menu: { btn: $("#menu-btn"), pop: $("#menu-pop") } };
  let openLayer = null;
  const menuItems = () => [...layers.menu.pop.querySelectorAll('[role="menuitem"]')];
  function showLayer(name, focus = "first") {
    if (openLayer && openLayer !== name) hideLayer(openLayer, false);
    const { btn, pop } = layers[name];
    openLayer = name;
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    if (name === "menu") { const it = menuItems(); (focus === "last" ? it[it.length - 1] : it[0]).focus(); }
    else pop.focus();
  }
  function hideLayer(name, returnFocus) {
    const { btn, pop } = layers[name];
    if (pop.hidden) return;
    pop.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    if (openLayer === name) openLayer = null;
    if (returnFocus) btn.focus();
  }
  for (const [name, { btn, pop }] of Object.entries(layers)) {
    btn.addEventListener("click", () => (pop.hidden ? showLayer(name) : hideLayer(name, true)));
    pop.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); hideLayer(name, true); } });
    pop.addEventListener("focusout", (e) => { if (!pop.hidden && !pop.contains(e.relatedTarget) && e.relatedTarget !== btn && e.relatedTarget) hideLayer(name, false); });
  }
  layers.menu.btn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); showLayer("menu", e.key === "ArrowUp" ? "last" : "first"); }
  });
  layers.menu.pop.addEventListener("keydown", (e) => {
    const it = menuItems(), i = it.indexOf(document.activeElement);
    const go = (j) => { e.preventDefault(); it[(j + it.length) % it.length].focus(); };
    if (e.key === "ArrowDown") go(i + 1);
    else if (e.key === "ArrowUp") go(i - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(it.length - 1);
    else if (e.key === "Tab") hideLayer("menu", true);
    else if (e.key === " ") { e.preventDefault(); document.activeElement.click(); }
  });
  for (const id of ["#menu-signout", "#menu-monitoring", "#ops-link"]) $(id).addEventListener("click", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && openLayer && !openDlg) hideLayer(openLayer, true); });
  document.addEventListener("pointerdown", (e) => {
    if (!openLayer) return;
    const { btn, pop } = layers[openLayer];
    if (!pop.contains(e.target) && !btn.contains(e.target)) hideLayer(openLayer, false);
  });
  const onFrameChange = () => { if (railOpen) setRail(false); setRailModal(false); if (openLayer) hideLayer(openLayer, false); };
  mqTablet.addEventListener("change", onFrameChange);
  mqPhone.addEventListener("change", onFrameChange);
  layers.menu.btn.setAttribute("aria-label", L.more);
  $("#menu-lang-glyph").textContent = L.langGlyph;
  $("#menu-lang-glyph").setAttribute("lang", "en");
  $("#menu-lang-name").textContent = L.nav.lang;
  $("#menu-lang-name").setAttribute("lang", RTL ? "en" : "ar");
  $("#menu-signout-name").textContent = L.nav.signout;
  $("#menu-monitoring-name").textContent = L.nav.monitoring;
  $("#ops-link-name").textContent = L.nav.operations;
  $("#tabbar").setAttribute("aria-label", L.railLabel);
  $$(".tb-item[data-tab]").forEach((a) => {
    const key = a.dataset.tab;
    $(".tb-name", a).textContent = L.tabs[key];
    a.setAttribute("aria-label", L.nav[key]);
    if (a.hasAttribute("data-inert")) a.addEventListener("click", (e) => e.preventDefault());
  });

  /* The frame's status (STW-1): the gym's Operations status, as on every screen; in the concept, live with its last
   * reading at 7:42 PM. While the page loads the status is not known (STW-2); a first load that fails says Error, as
   * Reports' and Activity log's do (DECISIONS item 14). */
  const NOW_MIN = 19 * 60 + 42, DAY_OPEN = 360, DAY_CLOSE = 60;   // 7:42 PM; open 6:00 AM to 1:00 AM
  const DASH = "–";
  const fmtClock = (mins) => {
    const h = Math.floor(mins / 60) % 24, m = mins % 60;
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${RTL ? (h >= 12 ? "م" : "ص") : h >= 12 ? "PM" : "AM"}`;
  };
  const timeText = (mins) => nw(bdi(fmtClock(mins)));
  const SVG_ERR = `<svg class="ico ico-err" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/></svg>`;
  const SVG_CLOCK = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/></svg>`;
  const SVG_OFF = `<svg class="ico ico-off" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M6.3 17.7 17.7 6.3"/></svg>`;
  const OPS_STATES = {
    live: (m = NOW_MIN) => ({ cls: "", mark: `<span class="dot" aria-hidden="true"></span>`, word: L.live, line: `${L.lastReading} ${timeText(m)}` }),
    delayed: (m = NOW_MIN - 13) => ({ cls: "is-delayed", mark: SVG_CLOCK, word: RTL ? "متأخر" : "Delayed", line: `${L.lastReading} ${timeText(m)}` }),
    closed: () => ({ cls: "is-closed", mark: `<span class="dot ring" aria-hidden="true"></span>`, word: RTL ? "مغلق" : "Closed", line: RTL ? `يفتح ${timeText(DAY_OPEN)}` : `Opens ${timeText(DAY_OPEN)}` }),
    offline: () => ({ cls: "is-off", mark: SVG_OFF, word: RTL ? "غير متصل" : "Offline", line: RTL ? "لا عدّ حاليًا" : "No current count" }),
    error: () => ({ cls: "is-err", mark: SVG_ERR, word: L.errorWord, line: L.errorLine, detail: `${L.errorFull}. ${L.errorHint}` }),
  };
  const OPS = ["delayed", "closed", "offline"].includes(params.get("ops")) ? params.get("ops") : "live";
  let statusLoad = null;
  function renderStatus() {
    const btn = layers.ops.btn;
    const loading = phase === "loading";
    if (loading && !statusLoad) { statusLoad = Object.assign(document.createElement("span"), { className: "hb-load", textContent: L.loadingWord }); btn.before(statusLoad); }
    if (!loading && statusLoad) { statusLoad.remove(); statusLoad = null; }
    btn.hidden = loading;
    const s = OPS_STATES[phase === "error" || phase === "retrying" ? "error" : OPS]();
    btn.className = `hbadge${s.cls ? ` ${s.cls}` : ""}`;
    const words = (x) => `${x.mark}<span class="hb-word">${x.word}</span>` +
      `<span class="hb-line"><span class="sr-only">${RTL ? "، " : ", "}</span><span aria-hidden="true">· </span>${x.line}</span>`;
    $("#ops-btn-state").innerHTML = `<span class="sr-only">${L.opsTitle}: </span>${words(s)}`;
    // The slot holds every status's width with the verified widest time, 10:44 AM (decision 24), as on every page.
    $("#ops-res").innerHTML = Object.values(OPS_STATES).map((f) => `<span class="hb-r">${words(f(644))}<svg class="hb-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 10l5 5 5-5"/></svg></span>`).join("");
    $("#ops-state").className = `ops-state${s.cls ? ` ${s.cls}` : ""}`;
    $("#ops-state").innerHTML = `${s.mark}<span>${s.word}</span>`;
    $("#ops-last").innerHTML = s.detail || s.line;
    $("#ops-hours").innerHTML = `${L.hours} ${nw(`${bdi(fmtClock(DAY_OPEN))} ${DASH} ${bdi(fmtClock(DAY_CLOSE))}`)}`;
  }

  const say = (text) => { const el = $("#say"); el.textContent = ""; requestAnimationFrame(() => { el.textContent = text; }); };

  /* ---------------------------------------------------------------- icons (ICO-1: a 24 grid, round, currentColor) */
  const svg = (cls, body) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
  const ICON = {
    plus: svg("", '<path d="M12 5.5v13M5.5 12h13"/>'),
    close: svg("", '<path d="M7 7l10 10M17 7 7 17"/>'),
    check: svg("done-ico", '<path d="M5.5 12.5 10 17l8.5-9.5"/>'),
    alert: svg("ico", '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/>'),
    // Show and hide a password: the eye, and the eye struck through (it shows a password is visible now).
    eye: svg("pw-ico eye", '<path d="M2.8 12s3.4-6.2 9.2-6.2 9.2 6.2 9.2 6.2-3.4 6.2-9.2 6.2S2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.8"/>'),
    eyeOff: svg("pw-ico eye-off", '<path d="M2.8 12s3.4-6.2 9.2-6.2 9.2 6.2 9.2 6.2-3.4 6.2-9.2 6.2S2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.8"/><path d="M4.5 19.5 19.5 4.5"/>'),
    // The one-time view's note: shown now, never again.
    once: svg("sec-ico", '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.6V12l2.8 1.8"/>'),
    // Copy (two sheets), and copied (a check) in its place.
    copy: svg("cp-ico cp-copy", '<rect x="8.6" y="8.6" width="11" height="11" rx="2.6"/><path d="M15.4 5.6A2.4 2.4 0 0 0 13 4.4H6.8a2.4 2.4 0 0 0-2.4 2.4V13a2.4 2.4 0 0 0 1.2 2.1"/>'),
    copied: svg("cp-ico cp-done", '<path d="M5.5 12.5 10 17l8.5-9.5"/>'),
  };

  /* ---------------------------------------------------------------- the page's state */
  // One notice at a time (DECISIONS item 33): after a change, its done sentence on the row it changed; on the front
  // desk card, (unused since the code is typed in a dialog) an alert. A new action takes it away.
  let notice = null;          // { at: "desk" | <owner id>, kind: "done" | "alert", html }
  const stack = (a, b, showB) => `<span class="rb-stack"><span class="rb-l"${showB ? ' aria-hidden="true"' : ""}>${a}</span><span class="rb-l"${showB ? "" : ' aria-hidden="true"'}>${b}</span></span>`;
  function noticeHTML(at) {
    if (!notice || notice.at !== at) return "";
    if (notice.kind === "alert") return `<div class="alert acc-alert" id="notice" role="alert" tabindex="-1">${ICON.alert}<span>${notice.html}</span></div>`;
    return `<p class="done" id="notice" tabindex="-1">${ICON.check}<span class="done-t">${notice.html}</span> <a class="done-a" href="${recHref(notice.recordId)}">${L.doneLink}</a></p>`;
  }

  /* ---- the front desk: its name, what it can do, its code's state, and the actions that state allows, under its name.
   * The code itself is never on the page (the server keeps only a hash); a new one is shown once, in its own view. */
  const deskEl = $("#desk"), ownersEl = $("#owners"), recEl = $("#records"), gridEl = $("#grid");
  function deskHTML() {
    const s = data.desk.state, loading = phase === "loading";
    const mark = loading ? `<i class="ph-box acc-ph-mk" aria-hidden="true"></i>` : `<span class="mk ${s === "active" ? "mk-on" : "mk-off"}">${L.pinState[s]}</span>`;
    let acts = "";
    if (!loading) {
      acts = s === "active"
        ? `<button class="rbtn" type="button" data-act="pinChange" data-key="pinChange" aria-haspopup="dialog">${L.pinChange}</button>` +
          `<button class="rbtn rbtn-quiet" type="button" data-act="pinOff" data-key="pinOff" aria-haspopup="dialog">${L.pinOff}</button>`
        : `<button class="rbtn rbtn-primary" type="button" data-act="pinCreate" data-key="pinCreate" aria-haspopup="dialog">${L.pinCreate}</button>`;
    }
    return `<div class="acc-head">
      <div class="acc-id">
        <h2 class="acc-title" id="desk-title" tabindex="-1"><span class="acc-name">${L.desk}</span>${loading ? "" : SR_SEP}${mark}</h2>
        <p class="acc-cap">${L.deskCap[0]}<span class="sep" aria-hidden="true">·</span>${SR_SEP}${L.deskCap[1]}</p>
      </div>
      <div class="acc-acts${loading ? " is-ph" : ""}">${acts}</div>
    </div>${noticeHTML("desk")}`;
  }

  /* ---- the owners: a person per row (name, the marks that apply, email), its actions at the row's end. The signed-in
   * owner's row is theirs: no deactivate and no reset, and "Change password" (an amendment beyond the contract). A
   * deactivated owner stays in the list, quieter, with "Reactivate". */
  function actBtn(act, o) {
    const cls = act === "off" ? "rbtn rbtn-quiet" : "rbtn";
    const sr = act === "mine" ? "" : `<span class="sr-only">${L.actSr(act, nm(o))}</span>`;
    return `<button class="${cls}" type="button" data-act="${act}" data-id="${o.id}" data-key="${act}:${o.id}" aria-haspopup="dialog">${L.act[act]}${sr}</button>`;
  }
  function rowHTML(o) {
    const me = o.id === ME, off = !o.active;
    // The last active owner is the one row no one may deactivate; in a list that is up to date that is always the
    // signed-in owner, so the reason is said there, in words.
    const only = me && o.active && activeCount() === 1;
    const marks = (me ? `<span class="mk mk-you">${L.you}</span>` : "") + (off ? `<span class="mk mk-off">${L.deactivated}</span>` : "");
    const acts = me ? actBtn("mine", o) : off ? actBtn("on", o) : actBtn("reset", o) + actBtn("off", o);
    return `<li class="prs${off ? " is-off" : ""}${me ? " is-me" : ""}" data-id="${o.id}">
      <div class="prs-id">
        <p class="prs-line"><span class="prs-name" id="name-${o.id}" tabindex="-1">${nm(o)}</span>${marks ? SR_SEP + marks : ""}</p>
        <p class="prs-mail">${mailHTML(o)}</p>
        ${only ? `<p class="prs-note">${L.onlyActive}</p>` : ""}
      </div>
      <div class="prs-acts">${acts}</div>
      ${noticeHTML(o.id)}
    </li>`;
  }
  // The skeleton (STA-10, PH-1…3): three rows, each awaited value a flat bar in its own slot; the actions keep their line.
  const ph = (cls, w) => `<i class="ph-bar ${cls}" style="--w:${w}px" aria-hidden="true"></i>`;
  function skeletonRows() {
    const W = RTL ? [[40, 132], [44, 140], [92, 176]] : [[48, 132], [52, 140], [100, 176]];
    return W.map(([n, m]) => `<li class="prs is-ph"><div class="prs-id"><p class="prs-line">${ph("ph-name", n)}</p><p class="prs-mail">${ph("ph-mail", m)}</p></div><div class="prs-acts is-ph"></div></li>`).join("");
  }
  function ownersHTML() {
    const loading = phase === "loading";
    return `<div class="acc-head">
      <div class="acc-id">
        <h2 class="acc-title" id="owners-title" tabindex="-1"><span class="acc-name">${L.owners}</span></h2>
        <p class="acc-cap">${L.ownersCap}</p>
      </div>
      <div class="acc-acts"><button class="rbtn" type="button" data-act="add" data-key="add" aria-haspopup="dialog"${loading ? " disabled" : ""}>${ICON.plus}<span>${L.add}</span></button></div>
    </div>
    <ul class="ppl" id="people"${loading ? ' aria-hidden="true"' : ""}>${loading ? skeletonRows() : ordered().map(rowHTML).join("")}</ul>`;
  }

  /* ---- the access records card (OWN-C15, from 721 px): its title and the way to every access record at its head's
   * end, as "Add owner" stands at the owners' (a list's action in the list's head; a key's actions under its name). Then
   * the latest eight records, newest first, each in the log's words over who did it and when, and each opening its own
   * record in Activity log. Its states: loading (the rows' bars), none yet, and its own failure with a retry. */
  const DAY0 = Date.UTC(2026, 8, 23) / 864e5;                  // the concept's today: 23 September 2026 (Daily's)
  const dayOf = (iso) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
  function whenHTML(r) {
    const d = dayOf(r.date), t = timeText(r.mins);
    if (d === DAY0) return nw(`${L.today} ${t}`);
    if (d === DAY0 - 1) return nw(`${L.yesterday} ${t}`);
    const y = +r.date.slice(0, 4), m = +r.date.slice(5, 7) - 1, day = +r.date.slice(8, 10);
    return nw(`${bdi(day)} ${L.months[m]}${y !== 2026 ? ` ${bdi(y)}` : ""}`);
  }
  const nameIn = (id) => esc(ownerOf(id)?.name ?? LOG_NAMES[id] ?? "");
  const recHref = (id) => {
    const p = new URLSearchParams(keep);
    // Name-range review fixtures must describe the same stored names on both sides of this link.
    if (["long", "short"].includes(params.get("case"))) p.set("case", params.get("case"));
    return `activity.html?kind=access&record=${id}&${p}`;
  };
  function recordHTML(r) {
    const what = L.rec[r.act](r.target ? bdi(nameIn(r.target)) : bdi(nameIn(r.by)));
    return `<li class="rec-row"><a class="rec-a" href="${recHref(r.id)}" data-record="${r.id}">` +
      `<span class="rec-txt"><span class="rec-what">${what}</span>` +
      `<span class="rec-meta">${SR_SEP}${bdi(nameIn(r.by))}<span class="sep" aria-hidden="true">·</span>${SR_SEP}${whenHTML(r)}</span></span>` +
      `<svg class="rec-go mirror" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 7l5 5-5 5"/></svg></a></li>`;
  }
  function recSkeleton() {
    const W = RTL ? [[168, 96], [150, 88], [176, 96], [196, 92], [160, 88], [150, 96], [176, 88], [150, 96]] : [[176, 104], [168, 96], [184, 104], [204, 100], [176, 96], [168, 104], [184, 96], [168, 104]];
    return W.map(([a, b]) => `<li class="rec-row is-ph"><span class="rec-a"><span class="rec-txt"><span class="rec-what">${ph("ph-name", a)}</span><span class="rec-meta">${ph("ph-mail", b)}</span></span></span></li>`).join("");
  }
  function recordsHTML() {
    const loading = phase === "loading";
    const head = `<div class="acc-head rec-head">
      <h2 class="acc-title" id="rec-title" tabindex="-1"><span class="acc-name">${L.recTitle}</span></h2>
      <a class="acc-all" id="rec-all" href="${LOG_HREF}" aria-label="${L.recAllName}"><span>${L.recAll}</span><svg class="mirror" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M10 7l5 5-5 5"/></svg></a>
    </div>`;
    if (loading) return `${head}<ol class="rec-list" aria-hidden="true">${recSkeleton()}</ol>`;
    if (records.phase === "error" || records.phase === "retrying") {
      const trying = records.phase === "retrying";
      return `${head}<div class="rec-msg"><p class="rec-say">${SVG_ERR}<span>${L.recError}</span></p>` +
        `<button class="rbtn" id="rec-retry" type="button"${trying ? ' aria-disabled="true" aria-busy="true"' : ""}>${stack(L.retry, L.retrying, trying)}</button></div>`;
    }
    if (!records.list.length) return `${head}<p class="rec-none">${L.recEmpty}</p>`;
    return `${head}<ol class="rec-list">${records.list.slice(0, REC_N).map(recordHTML).join("")}</ol>`;
  }
  // A change made here writes its record: it tops the card at once, as the log has it (today, now, by the signed-in owner).
  function addRecord(act, target, reason = "") {
    // Activity log reserves these two ids for Omar's older sample records.
    while ([1001, 1002].includes(nextRecordId)) nextRecordId++;
    records.list.unshift({ id: nextRecordId++, date: "2026-09-23", mins: NOW_MIN, by: ME, act, target, reason: reason || null });
  }
  function recRetry() {
    if (records.phase !== "error") return;
    records.phase = "retrying";
    recEl.innerHTML = recordsHTML();
    $("#rec-retry").focus();
    setTimeout(() => {
      records.phase = "ready";
      records.list = loadedRecords();
      const hadFocus = document.activeElement?.id === "rec-retry";
      recEl.innerHTML = recordsHTML();
      if (hadFocus) $("#rec-title").focus({ preventScroll: true });
    }, LOAD.retry);
  }
  document.addEventListener("click", (e) => { if (e.target.closest("#rec-retry") && e.target.closest("#rec-retry").getAttribute("aria-disabled") !== "true") recRetry(); });

  /* ---- the first load failed (Reports' option C, Activity log's form): one message in place of the cards, the mark,
   * one sentence that names what is missing, and the one retry, focused. */
  let retryBtn = null, focusAlert = phase === "error";
  function paintError() {
    gridEl.hidden = true;
    let msg = $("#page-msg");
    if (!msg) {
      msg = Object.assign(document.createElement("section"), { className: "card acc-msg", id: "page-msg" });
      gridEl.after(msg);
    }
    const trying = phase === "retrying";
    msg.innerHTML = `<p class="acc-say" aria-hidden="true">${SVG_ERR}<span>${L.errorFull}</span></p><span class="sr-only" id="err-say" role="alert"></span>` +
      `<button class="rbtn rbtn-primary" id="retry" type="button"${trying ? ' aria-disabled="true" aria-busy="true"' : ""}>${stack(L.retry, L.retrying, trying)}</button>`;
    retryBtn = $("#retry", msg);
    retryBtn.addEventListener("click", retry);
    const sayEl = $("#err-say", msg);
    if (!trying) setTimeout(() => { if (sayEl.isConnected) sayEl.textContent = L.errorFull; }, 50);
    if (focusAlert) { retryBtn.focus(); focusAlert = false; }
  }
  function renderCards() {
    if (phase === "error" || phase === "retrying") { paintError(); return; }
    $("#page-msg")?.remove();
    gridEl.hidden = false;
    deskEl.innerHTML = deskHTML();
    ownersEl.innerHTML = ownersHTML();
    recEl.innerHTML = recordsHTML();
    for (const el of [deskEl, ownersEl, recEl]) el.toggleAttribute("aria-busy", phase === "loading");
  }
  function renderAll() {
    renderCards();
    renderStatus();
    root.dataset.phase = phase;
  }
  // The control that stands for an action, after a render: by its key, or the row's name when the row lost it (an owner
  // deactivated in the meantime has "Reactivate" where "Deactivate" stood).
  const byKey = (key) => (key ? $(`[data-key="${CSS.escape(key)}"]`) : null);
  function backTo(key, id) {
    return byKey(key) || (id ? $(`#name-${id}`) : null) || (key && key.startsWith("pin") ? $("#desk-title") : null) || $("#owners-title");
  }

  /* ---------------------------------------------------------------- the dialog system (Reports')
   * showModal (the page behind is inert), a scrim and a panel; a bottom sheet at 720 px and below (DLG-5). Tab wraps;
   * Escape and the scrim close it, except the code's one-time view, which only its two actions close; focus returns to
   * the control that opened it, or to the change's done sentence. */
  const dlgRun = { anims: [] };
  const isSheet = () => mqPhone.matches;
  const panelOf = (dlg) => $$(".dlg-panel", dlg).find((p) => !p.hidden);
  const focusables = (el) => $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', el)
    .filter((x) => !x.disabled && x.tabIndex >= 0 && !x.closest("[hidden]") && x.getClientRects().length && x.getAttribute("type") !== "hidden" && !x.classList.contains("acc-user"));
  function finishDlgAnims() { dlgRun.anims.forEach((a) => a.cancel()); dlgRun.anims = []; }
  function openDialog(dlg, opener, first, { animate = true } = {}) {
    if (openDlg) closeDialog(openDlg.dlg, { instant: true, back: null, quiet: true });
    if (railOpen) setRail(false);
    if (openLayer) hideLayer(openLayer, false);
    openDlg = { dlg, opener };
    dlg.showModal();
    dlg.classList.add("is-open");
    finishDlgAnims();
    if (animate && motionOn()) {
      const panel = panelOf(dlg), sc = $(".dlg-scrim", dlg);
      const o = { duration: T.dlgOpen, easing: EASE.rail };
      dlgRun.anims = [
        sc.animate([{ opacity: 0 }, { opacity: 1 }], o),
        panel.animate(isSheet() ? [{ transform: "translateY(100%)" }, { transform: "none" }] : [{ transform: "translateY(14px)" }, { transform: "none" }], o),
      ];
      const run = dlgRun.anims;
      Promise.all(run.map((a) => a.finished)).then(() => { if (dlgRun.anims === run) finishDlgAnims(); }).catch(() => {});
    }
    (first || focusables(panelOf(dlg))[0]).focus();
  }
  function closeDialog(dlg, { instant = false, back = null, quiet = false } = {}) {
    if (!openDlg || openDlg.dlg !== dlg) return;
    clearPasswords(dlg);
    const { opener } = openDlg;
    openDlg = null;
    finishDlgAnims();
    const done = () => {
      finishDlgAnims();
      dlg.classList.remove("is-open");
      if (dlg.open) dlg.close();
      if (quiet) return;
      const to = back || (opener && opener.isConnected ? opener : backTo(opener?.dataset?.key, opener?.dataset?.id));
      (to || $("#main")).focus();
    };
    if (instant || !motionOn()) { done(); return; }
    const panel = panelOf(dlg), sc = $(".dlg-scrim", dlg);
    const o = { duration: T.dlgClose, easing: EASE.railClose, fill: "forwards" };
    dlgRun.anims = [
      sc.animate([{ opacity: 1 }, { opacity: 0 }], o),
      panel.animate(isSheet() ? [{ transform: "none" }, { transform: "translateY(100%)" }] : [{ transform: "none" }, { transform: "translateY(10px)" }], o),
    ];
    Promise.all(dlgRun.anims.map((a) => a.finished)).then(done).catch(done);
  }
  const isLocked = (dlg) => dlg.dataset.locked === "true";
  const isBusy = (dlg) => dlg.dataset.busy === "true";

  /* ---- the dialogs' parts: a head (the title, and a close button unless the panel may not be closed), a body, a foot
   * (Cancel, then the panel's one action at the inline end, DLG-2). A field is FLD-1's (a label above, 44 px); a
   * password field adds show and hide (aria-pressed) inside its inline end; the reason is a text area capped at 240. */
  const closeBtnHTML = `<button class="icon-btn dlg-x" type="button" data-close aria-label="${L.close}">${ICON.close}</button>`;
  function panelHTML({ id, title, desc, body = "", act, actCls = "rbtn-primary", noClose = false, form = true }) {
    const tag = form ? "form" : "div";
    return `<${tag} class="dlg-panel acc-panel" id="${id}"${form ? " novalidate" : ""}>
      <header class="dlg-head"><h2 id="${id}-title" tabindex="-1"></h2>${noClose ? "" : closeBtnHTML}</header>
      <div class="dlg-body">
        ${desc ? `<p class="dlg-desc" id="${id}-desc"></p>` : ""}
        ${body}
        <div class="alert acc-dlg-alert" id="${id}-alert" role="alert" hidden></div>
      </div>
      <footer class="dlg-foot">
        ${noClose ? "" : `<button class="rbtn acc-cancel" type="button" data-close>${stack(L.cancel, L.close, false)}</button>`}
        <button class="rbtn ${actCls} acc-do" type="${form ? "submit" : "button"}">${stack(act[0], act[1], false)}</button>
      </footer>
    </${tag}>`;
  }
  function fieldHTML({ id, label, type = "text", ltr = false, auto = "off", hint = "", max = 0, pw = false, code = false }) {
    return `<div class="field acc-field${pw ? " is-pw" : ""}${code ? " is-code" : ""}" data-field="${id}">
      <label class="field-label" for="${id}">${label}</label>
      <div class="acc-box">
        <input class="field-input" id="${id}" name="${id}" type="${pw ? "password" : type}"${ltr ? ' dir="ltr"' : ""} autocomplete="${auto}" spellcheck="false" autocapitalize="none"${code ? ' autocorrect="off"' : ""}${max ? ` maxlength="${max}"` : ""}${hint ? ` aria-describedby="${id}-hint"` : ""}>
        ${pw ? `<button class="icon-btn pw-eye" type="button" aria-controls="${id}" aria-pressed="false" aria-label="${L.show}">${ICON.eye}${ICON.eyeOff}</button>` : ""}
      </div>
      <p class="field-err" id="${id}-err" hidden></p>
      ${hint ? `<p class="field-hint" id="${id}-hint">${hint}</p>` : ""}
    </div>`;
  }
  const reasonHTML = (id) => `<div class="field acc-field is-reason" data-field="${id}">
      <label class="field-label" for="${id}">${L.reason}</label>
      <textarea class="field-input acc-reason" id="${id}" name="${id}" rows="3" maxlength="240" dir="auto" spellcheck="true"></textarea>
      <p class="field-err" id="${id}-err" hidden></p>
      <p class="acc-left" id="${id}-left" hidden></p>
    </div>`;

  const D = {
    pin: $("#dlg-pin"), pinoff: $("#dlg-pinoff"), add: $("#dlg-add"), reset: $("#dlg-reset"),
    off: $("#dlg-off"), on: $("#dlg-on"), mine: $("#dlg-mine"),
  };
  const scrimHTML = `<div class="dlg-scrim" data-close></div>`;
  // The code's dialog, two panels in one dialog, so the view takes the form's place without the scrim leaving: the code
  // the owner types (to create the front desk's code, or to change it; the current one keeps working), then its
  // one-time view, with a copy control, where "I've saved it" makes it take effect and "Cancel change" (or "Cancel"
  // when creating) leaves everything as it was (DECISIONS item 34).
  D.pin.innerHTML = scrimHTML +
    panelHTML({ id: "pin-confirm", title: 1, desc: 1,
      body: fieldHTML({ id: "pin-code", label: L.codeNew, ltr: true, auto: "off", hint: L.codeHint, max: 16, code: true }),
      act: [L.next, L.next] }) +
    `<div class="dlg-panel acc-panel acc-sec-panel" id="pin-view" hidden>
      <header class="dlg-head"><h2 id="pin-view-title" tabindex="-1"></h2></header>
      <div class="dlg-body">
        <div class="acc-sec" id="pin-secret"></div>
        <p class="field-err acc-copy-fail" id="pin-copy-fail" hidden>${ICON.alert}<span>${L.copyFail}</span></p>
        <p class="acc-sec-note" id="pin-view-note">${ICON.once}<span></span></p>
        <p class="dlg-desc acc-sec-commit" id="pin-view-desc"></p>
        <div class="alert acc-dlg-alert" id="pin-view-alert" role="alert" hidden></div>
      </div>
      <footer class="dlg-foot">
        <button class="rbtn acc-cancel acc-undo" type="button" id="pin-undo">${stack(L.viewUndoChange, L.close, false)}</button>
        <button class="rbtn rbtn-primary acc-do acc-saved" type="button" id="pin-saved">${stack(L.viewSaved, L.viewSaving, false)}</button>
      </footer>
    </div>`;
  D.pinoff.innerHTML = scrimHTML + panelHTML({ id: "pinoff", title: 1, desc: 1, body: reasonHTML("pinoff-reason"), act: [L.pinOff, L.offing], actCls: "rbtn-danger" });
  D.add.innerHTML = scrimHTML + panelHTML({
    id: "add", title: 1,
    body: fieldHTML({ id: "add-name", label: L.name, auto: "off", max: 120 }) +
      fieldHTML({ id: "add-email", label: L.email, type: "email", ltr: true, auto: "off", max: 254 }) +
      fieldHTML({ id: "add-pw", label: L.password, pw: true, ltr: true, auto: "new-password", hint: L.pwHint, max: 200 }),
    act: [L.addDo, L.adding],
  });
  D.reset.innerHTML = scrimHTML + panelHTML({ id: "reset", title: 1, desc: 1, body: fieldHTML({ id: "reset-pw", label: L.newPassword, pw: true, ltr: true, auto: "new-password", hint: L.pwHint, max: 200 }), act: [L.resetDo, L.saving] });
  D.off.innerHTML = scrimHTML + panelHTML({ id: "off", title: 1, desc: 1, body: reasonHTML("off-reason"), act: [L.act.off, L.offing], actCls: "rbtn-danger" });
  D.on.innerHTML = scrimHTML + panelHTML({ id: "on", title: 1, desc: 1, act: [L.act.on, L.oning] });
  // Change my password: the account's email, unseen, so a password manager updates the right entry.
  D.mine.innerHTML = scrimHTML + panelHTML({
    id: "mine", title: 1, desc: 1,
    body: `<input class="acc-user" type="text" name="username" autocomplete="username" tabindex="-1" aria-hidden="true" readonly>` +
      fieldHTML({ id: "mine-current", label: L.currentPassword, pw: true, ltr: true, auto: "current-password", max: 200 }) +
      fieldHTML({ id: "mine-new", label: L.newPassword, pw: true, ltr: true, auto: "new-password", hint: L.pwHint, max: 200 }),
    act: [L.act.mine, L.changing],
  });
  // The words the dialogs never change.
  for (const [dlg, panel, title, desc] of [[D.pinoff, "pinoff", L.pinOffTitle, L.pinOffDesc], [D.add, "add", L.addTitle, ""], [D.on, "on", "", L.onDesc], [D.mine, "mine", L.mineTitle, L.mineDesc]]) {
    if (title) $(`#${panel}-title`, dlg).textContent = title;
    if (desc) $(`#${panel}-desc`, dlg).textContent = desc;
  }
  $("#pin-view-title").textContent = L.viewTitle;
  $("#pin-view-note span").textContent = L.viewNote;

  // Each dialog's accessible name and description follow its visible panel.
  function labelDialog(dlg) {
    const p = panelOf(dlg);
    dlg.setAttribute("aria-labelledby", `${p.id}-title`);
    const desc = (p.id === "pin-view" ? [$("#pin-say"), $("#pin-view-note"), $("#pin-view-desc")] : [$(`#${p.id}-desc`, p)]).filter((e) => e && !e.hidden).map((e) => e.id).join(" ");
    if (desc) dlg.setAttribute("aria-describedby", desc); else dlg.removeAttribute("aria-describedby");
    if (p.id === "pin-view") dlg.setAttribute("role", "alertdialog"); else dlg.removeAttribute("role");
  }

  /* ---- a dialog's states (DLG-4): ready, invalid (FLD-4 on the field), working (STA-9: its words change at once, it
   * keeps its width and focus; the fields and Cancel wait, since a change already sent cannot be called back), done
   * (the dialog closes and the done sentence takes focus), refused (the refusal's sentence: on its field when a field
   * can fix it, otherwise the alert, the form kept as typed), failed (EMP-2: nothing changed; the action again is the
   * retry). */
  // A field is described by what it shows under it: its message, its hint, the reason's remaining characters.
  function syncDescribed(input) {
    const box = input.closest(".field");
    const ids = $$(".field-err, .field-hint, .acc-left", box).filter((x) => !x.hidden).map((x) => x.id);
    if (ids.length) input.setAttribute("aria-describedby", ids.join(" ")); else input.removeAttribute("aria-describedby");
  }
  function setFieldError(field, html) {
    const box = field.closest(".field"), err = $(".field-err", box), input = $(".field-input", box);
    box.classList.toggle("is-invalid", Boolean(html));
    err.hidden = !html;
    err.innerHTML = html ? `${ICON.alert}<span>${html}</span>` : "";
    // The hint steps aside while the message stands: they would say the same rule twice.
    const hint = $(".field-hint", box);
    if (hint) hint.hidden = Boolean(html);
    if (html) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    syncDescribed(input);
  }
  function clearDialog(panel) {
    $$(".field", panel).forEach((f) => setFieldError($(".field-input", f), ""));
    const a = $(".acc-dlg-alert", panel);
    if (a) { a.hidden = true; a.innerHTML = ""; }
    const doBtn = $(".acc-do", panel), cancel = $(".acc-cancel", panel);
    if (doBtn) { doBtn.hidden = false; setLabels(doBtn, false); doBtn.removeAttribute("aria-disabled"); doBtn.removeAttribute("aria-busy"); }
    if (cancel) { setLabels(cancel, false); cancel.removeAttribute("aria-disabled"); }
  }
  function resetFields(panel) {
    $$(".pw-eye", panel).forEach((b) => setEye(b, false));
    $$(".acc-left", panel).forEach((l) => { l.hidden = true; l.textContent = ""; });
    $$("input.field-input, textarea", panel).forEach((i) => { i.value = ""; i.readOnly = false; delete i.dataset.said; syncDescribed(i); });
  }
  function clearPasswords(dlg) {
    $$(".pw-eye", dlg).forEach((b) => setEye(b, false));
    $$(".is-pw input", dlg).forEach((i) => { i.value = ""; });
  }
  // A button's two labels share one cell (its width is the wider's); only the current one is seen and read.
  const setLabels = (btn, second) => {
    const [a, b] = btn.querySelectorAll(".rb-l");
    if (!a || !b) return;
    if (second) { a.setAttribute("aria-hidden", "true"); b.removeAttribute("aria-hidden"); }
    else { a.removeAttribute("aria-hidden"); b.setAttribute("aria-hidden", "true"); }
  };
  function setWorking(dlg, on) {
    const panel = panelOf(dlg), doBtn = $(".acc-do", panel), cancel = $(".acc-cancel", panel);
    dlg.dataset.busy = String(on);
    setLabels(doBtn, on);
    if (on) doBtn.setAttribute("aria-busy", "true"); else doBtn.removeAttribute("aria-busy");
    if (on) doBtn.setAttribute("aria-disabled", "true"); else doBtn.removeAttribute("aria-disabled");
    if (cancel) { if (on) cancel.setAttribute("aria-disabled", "true"); else cancel.removeAttribute("aria-disabled"); }
    $$(".dlg-x", panel).forEach((x) => { if (on) x.setAttribute("aria-disabled", "true"); else x.removeAttribute("aria-disabled"); });
    $$("input.field-input, textarea", panel).forEach((i) => { i.readOnly = on; });
  }
  // A refusal the form cannot fix (the state changed under it): the alert says what happened, the action is set aside
  // and Cancel becomes Close, the only way on; the page behind already shows the change.
  function showAlert(dlg, html, { moot = false } = {}) {
    const panel = panelOf(dlg), a = $(".acc-dlg-alert", panel);
    a.innerHTML = `${ICON.alert}<span>${html}</span>`;
    a.hidden = false;
    if (moot) {
      const doBtn = $(".acc-do", panel), cancel = $(".acc-cancel", panel);
      doBtn.hidden = true;
      setLabels(cancel, true);
      cancel.removeAttribute("aria-disabled");
      cancel.focus();
    }
  }

  // Show and hide: the field's own text, while the owner types it; a password is never shown once a change succeeds
  // (the field is emptied then). Submitting hides it again.
  function setEye(btn, shown) {
    btn.setAttribute("aria-pressed", String(shown));
    const input = $(`#${btn.getAttribute("aria-controls")}`);
    input.type = shown ? "text" : "password";
  }
  document.addEventListener("click", (e) => {
    const eye = e.target.closest(".pw-eye");
    if (!eye) return;
    const dlg = eye.closest("dialog");
    if (dlg && isBusy(dlg)) return;
    setEye(eye, eye.getAttribute("aria-pressed") !== "true");
  });

  // The reason: its remaining characters from 200 typed, said to assistive technology at 40, 20, 10 and none left.
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.matches?.(".acc-reason")) {
      const left = 240 - t.value.length, el = $(`#${t.id}-left`);
      el.hidden = left > 40;
      el.textContent = left <= 40 ? L.left(left) : "";
      if ([40, 20, 10, 0].includes(left) && t.dataset.said !== String(left)) { t.dataset.said = String(left); say(L.left(left)); }
      syncDescribed(t);
    }
    if (t.matches?.(".field-input") && t.closest(".field.is-invalid") && t.value.trim()) setFieldError(t, "");
  });

  $$(".dlg").forEach((dlg) => {
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); if (!isLocked(dlg) && !isBusy(dlg)) closeDialog(dlg); });
    dlg.addEventListener("click", (e) => {
      const c = e.target.closest("[data-close]");
      if (!c) return;
      e.preventDefault();
      if (isLocked(dlg) || isBusy(dlg) || c.getAttribute("aria-disabled") === "true") return;
      closeDialog(dlg);
    });
    dlg.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const list = focusables(panelOf(dlg));
      if (!list.length) return;
      const first = list[0], last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dlg.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !dlg.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    });
    // The one-time view never closes but by its two actions: should the browser close it anyway (a second Escape that
    // the page did not see), it opens again at once, with the code still there. Any other close of the code's dialog
    // (after a refusal lifted the lock) takes the code off the page.
    dlg.addEventListener("close", () => {
      if (isLocked(dlg)) { dlg.showModal(); dlg.classList.add("is-open"); $("#pin-view-title").focus(); return; }
      clearPasswords(dlg);
      if (dlg === D.pin) { $("#pin-secret").textContent = ""; $("#pin-code").value = ""; pin = null; }
    });
  });
  // Escape is never the view's: it is stopped before the browser's own dialog handling sees it.
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && (isLocked(D.pin) || (openDlg && isBusy(openDlg.dlg)))) { e.preventDefault(); e.stopPropagation(); } }, true);
  // Leaving the page while the code shows would drop it (nothing changes): the browser asks first.
  window.addEventListener("beforeunload", (e) => { if (isLocked(D.pin)) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------------------------------------------------------------- the actions
   * Synthetic answers from the contract: success by default; ?refuse=<code> makes the first action that can return that
   * code return it, once; ?fail=1 makes the first action fail, once; ?hold=1 keeps it working. A taken email is refused
   * whenever it matches an owner already in the list, as the server would. Working shows for at least 400 ms (STA-9). */
  const REFUSE = params.get("refuse"), FAIL = params.get("fail") === "1", HOLD = params.get("hold") === "1";
  const CAN = {
    pinCreate: ["staff_pin_already_active"],
    pinChange: ["staff_pin_not_active"],
    pinOff: ["staff_pin_not_active"],
    add: ["owner_email_taken"],
    off: ["owner_self_deactivation", "owner_already_inactive", "owner_last_active", "not_an_owner"],
    on: ["owner_already_active", "not_an_owner"],
    reset: ["owner_already_inactive", "not_an_owner"],
    mine: ["current_password_incorrect"],
  };
  let refuseUsed = false, failUsed = false;
  const LATENCY = 700;
  function answer(act, extra = {}) {
    if (act === "add") {
      const hit = data.owners.find((o) => o.email.toLowerCase() === extra.email.toLowerCase());
      if (hit) return { refuse: "owner_email_taken", hit };
    }
    if (REFUSE && !refuseUsed && (REFUSE === "unauthorized" || CAN[act].includes(REFUSE))) { refuseUsed = true; return { refuse: REFUSE }; }
    if (FAIL && !failUsed) { failUsed = true; return { fail: true }; }
    return { ok: true };
  }
  const run = (fn) => { if (HOLD) return; setTimeout(fn, LATENCY); };
  const clearNotice = () => { notice = null; };
  function finishWithDone(at, html, key) {
    notice = { at, kind: "done", html, recordId: records.list[0].id };
    renderCards();
    const n = $("#notice");
    return n || backTo(key, at === "desk" ? null : at);
  }
  // A state the refusal reveals, drawn behind the dialog (production asks for the list again after a refusal).
  function applyTruth(code, act, id) {
    if (code === "staff_pin_already_active") data.desk.state = "active";
    if (code === "staff_pin_not_active") data.desk.state = "off";
    const o = id ? ownerOf(id) : null;
    if (o && code === "owner_already_inactive") o.active = false;
    if (o && code === "owner_already_active") o.active = true;
    renderCards();
  }
  const FIELD_REFUSALS = { owner_email_taken: "add-email", current_password_incorrect: "mine-current" };

  /* ---- the code: create or change it in two steps (DECISIONS item 34), and deactivate it (a confirmation with its
   * reason). Step one, the owner types the code (8 to 16 English letters or digits; Arabic-Indic digits become Western
   * as they are typed). Step two, its one-time view: the code with a copy control, and the two ways out. Until
   * "I've saved it" nothing has been sent, so the current code keeps working and an accident (a closed browser, a lost
   * connection) changes nothing; "I've saved it" sends the code, which takes effect at once and, on a change, signs the
   * front desk out; "Cancel change" closes the view and changes nothing. Neither Escape nor a tap outside closes the
   * view: a code the owner may already have handed to the desk is never thrown away by accident. */
  let pin = null, viewAfter = null, codeMode = null;
  let viewShownAt = -Infinity, savedDownAt = -Infinity;   // when the view appeared; when a press on "I've saved it" began
  const CODE_OK = /^[A-Za-z0-9]+$/;
  const CODE_MIN = 8, CODE_MAX = 16;
  const toWestern = (s) => s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  function openCode(mode, opener) {
    clearNotice();
    renderCards();
    codeMode = mode;
    const p = $("#pin-confirm"), desc = $("#pin-confirm-desc");
    clearDialog(p);
    resetFields(p);
    $("#pin-confirm-title").textContent = mode === "create" ? L.codeCreateTitle : L.codeChangeTitle;
    desc.textContent = mode === "change" ? L.codeKeeps : "";
    desc.hidden = mode !== "change";
    $('label[for="pin-code"]').textContent = mode === "create" ? L.codeField : L.codeNew;
    p.hidden = false;
    $("#pin-view").hidden = true;
    $("#pin-secret").textContent = "";
    D.pin.dataset.locked = "false";
    labelDialog(D.pin);
    openDialog(D.pin, byKey(mode === "create" ? "pinCreate" : "pinChange") || opener, $("#pin-code"));
  }
  $("#pin-confirm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (isBusy(D.pin)) return;
    const p = $("#pin-confirm"), f = $("#pin-code");
    clearDialog(p);
    const v = f.value;
    const err = !v ? L.err.code : !CODE_OK.test(v) ? L.err.codeChars : v.length < CODE_MIN ? L.err.codeShort : "";
    if (err) { setFieldError(f, err); f.focus(); return; }
    showPinView(v, codeMode === "create" ? "pinCreate" : "pinChange");
    // The code leaves its field: from here it lives only in the view, and leaves the page with it.
    f.value = "";
    $("#pin-view-title").focus();
  });
  // Arabic-Indic digits typed into the code become Western digits at once (Western digits only, NUM-1).
  $("#pin-code").addEventListener("input", (e) => {
    const t = e.target, w = toWestern(t.value);
    if (w !== t.value) { const at = t.selectionStart; t.value = w; t.setSelectionRange(at, at); }
  });

  // The copy control's two words share one cell, so it keeps its width: Copy, then Copied with a check.
  const copyHTML = () => `<button class="rbtn acc-copy" type="button" id="pin-copy" data-state="0">${ICON.copy}${ICON.copied}` +
    `<span class="rb-stack"><span class="rb-l">${L.copy}</span><span class="rb-l" aria-hidden="true">${L.copied}</span></span></button>`;
  function setCopy(state) {
    const b = $("#pin-copy");
    if (!b) return;
    b.dataset.state = String(state);
    b.querySelectorAll(".rb-l").forEach((l, i) => { if (i === state) l.removeAttribute("aria-hidden"); else l.setAttribute("aria-hidden", "true"); });
  }
  function showPinView(code, after) {
    pin = code;
    viewAfter = after;
    viewShownAt = performance.now();
    // The code as typed, left to right in both languages, in the code's face sized to its length; read character by
    // character to assistive technology.
    $("#pin-secret").innerHTML = `<span class="sr-only" id="pin-say">${L.viewPinSay(esc(code.split("").join(" ")))}</span>` +
      `<span class="acc-code" id="pin-code-shown" aria-hidden="true" dir="ltr" style="--n:${code.length}">${esc(code)}</span>${copyHTML()}` +
      `<span class="sr-only" id="pin-copy-say" aria-live="polite"></span>`;
    $("#pin-copy-fail").hidden = true;
    $("#pin-view-note").hidden = false;
    $("#pin-view-desc").hidden = false;
    $("#pin-view-desc").textContent = after === "pinCreate" ? L.viewCommitCreate : L.viewCommitChange;
    $("#pin-undo").innerHTML = stack(after === "pinCreate" ? L.viewUndoCreate : L.viewUndoChange, L.close, false);
    clearDialog($("#pin-view"));
    $("#pin-confirm").hidden = true;
    $("#pin-view").hidden = false;
    fitCode();
    D.pin.dataset.locked = "true";
    D.pin.dataset.busy = "false";
    labelDialog(D.pin);
  }
  // The code on one line: measured at 40 px and set smaller to fit its room, before the view's first paint; again when
  // the plate's width changes (a phone turned) and when the code's face arrives late. From 721 px the copy control
  // shares the code's line; where the code would need less than 22 px there, the control goes under it (is-under) and
  // the code takes the plate's width. Where one line would still need less than 22 px, the code takes two even lines,
  // broken only at its middle, each as large as fits: never a lone character on a second line. A copy by selection
  // keeps it one word (the break is a <wbr>).
  const CODE_MIN_PX = 22;
  function fitCode() {
    const el = $("#pin-code-shown");
    if (!el || !el.getClientRects().length || !pin) return;
    const plate = $("#pin-secret");
    plate.classList.remove("is-under");
    el.textContent = pin;
    // A text's width on one line at 40 px, measured out of the flow (a line that cannot wrap would widen the sheet).
    const width40 = (text) => {
      const m = document.createElement("span");
      m.textContent = text;
      m.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font-size:40px;letter-spacing:0";
      el.append(m);
      const w = m.getBoundingClientRect().width;
      m.remove();
      return w;
    };
    const w40 = width40(pin);
    const fit = (need) => Math.min(40, Math.floor((40 * (el.clientWidth - 2)) / need));
    let one = fit(w40);
    if (one < CODE_MIN_PX && getComputedStyle(plate).flexDirection === "row") { plate.classList.add("is-under"); one = fit(w40); }
    if (one >= CODE_MIN_PX) { el.style.fontSize = `${one}px`; return; }
    const mid = Math.ceil(pin.length / 2), a = pin.slice(0, mid), b = pin.slice(mid);
    el.innerHTML = `${esc(a)}<wbr>${esc(b)}`;
    el.style.fontSize = `${Math.max(16, fit(Math.max(width40(a), width40(b))))}px`;
  }
  new ResizeObserver(() => fitCode()).observe($("#pin-secret"));
  document.fonts.addEventListener("loadingdone", () => fitCode());
  async function copyCode() {
    const b = $("#pin-copy");
    if (!pin || !b || isBusy(D.pin) || b.getAttribute("aria-disabled") === "true") return;
    let ok = false;
    try { await navigator.clipboard.writeText(pin); ok = true; }
    catch {
      // Without the clipboard's API (a browser that refuses it here), the older command, from inside the dialog.
      try {
        const ta = Object.assign(document.createElement("textarea"), { value: pin, readOnly: true });
        ta.style.cssText = "position:fixed;inset-block-start:0;opacity:0;pointer-events:none";
        panelOf(D.pin).append(ta);
        ta.select();
        ok = document.execCommand("copy");
        ta.remove();
        b.focus();
      } catch { ok = false; }
    }
    // Copied: the control says so, with a check. Not copied (a browser that allows neither way): the control stays, a
    // line under the plate says so, and the code is selected, ready for the system's own copy.
    setCopy(ok ? 1 : 0);
    $("#pin-copy-fail").hidden = ok;
    if (!ok) { const r = document.createRange(); r.selectNodeContents($("#pin-code-shown")); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }
    const s = $("#pin-copy-say");
    if (s) { s.textContent = ""; requestAnimationFrame(() => { s.textContent = ok ? L.copySay : L.copyFail; }); }
  }
  // Closing the view: the code leaves the page.
  function dropCode() {
    $("#pin-secret").textContent = "";
    $("#pin-copy-fail").hidden = true;
    pin = null;
    D.pin.dataset.locked = "false";
    D.pin.removeAttribute("aria-describedby");
  }
  // A double tap never commits a code. "I've saved it" stands where "Continue" stood, so the second tap of a double tap
  // on "Continue" (a phone's double tap, a mouse's double click) would land on it and save a code the owner never saw,
  // signing the desk out. A press that begins within 500 ms of the view's appearing (longer than a double tap's
  // interval, shorter than anyone reads a code) is that second tap, and is ignored: it changes nothing and shows
  // nothing. A held Enter never reaches it either: the view opens with focus on its title. Any later press is
  // deliberate, and begins Working in the same frame.
  const DOUBLE_TAP_MS = 500;
  $("#pin-saved").addEventListener("pointerdown", (e) => { savedDownAt = e.timeStamp; });
  function onSaved(e) {
    // A pointer's press begins at its pointerdown; a keyboard's (detail 0) at the click itself.
    const began = e.detail && savedDownAt >= viewShownAt ? savedDownAt : e.timeStamp;
    savedDownAt = -Infinity;
    // Ignored, the press also leaves focus where the view put it, on its title.
    if (began - viewShownAt < DOUBLE_TAP_MS) { if (document.activeElement === e.currentTarget) $("#pin-view-title").focus(); return; }
    savedPin();
  }
  function savedPin() {
    // Every Save begins Working in the same frame. Busy prevents repeated submits; opening focus remains on
    // the view's title, so Continue's Enter cannot submit the next step.
    if (isBusy(D.pin) || !pin) return;
    const after = viewAfter;
    clearDialog($("#pin-view"));
    setWorking(D.pin, true);
    $("#pin-copy")?.setAttribute("aria-disabled", "true");
    run(() => {
      const r = answer(after);
      setWorking(D.pin, false);
      $("#pin-copy")?.removeAttribute("aria-disabled");
      if (r.refuse) {
        // The state changed under the view: the code can no longer be used as asked. The view's lock lifts, the copy
        // control and the action step aside, and Close is the way on.
        applyTruth(r.refuse, after);
        D.pin.dataset.locked = "false";
        $("#pin-copy")?.remove();
        // What the view promised ("save it now", what "I've saved it" does) no longer holds: only the refusal stays.
        $("#pin-view-note").hidden = true;
        $("#pin-view-desc").hidden = true;
        labelDialog(D.pin);
        showAlert(D.pin, L.refuse[r.refuse](after), { moot: true });
        return;
      }
      // Nothing was changed: the code stays shown, and "I've saved it" again is the retry.
      if (r.fail) { showAlert(D.pin, L.failed); return; }
      data.desk.state = "active";
      addRecord(after);
      dropCode();
      const back = finishWithDone("desk", L.done[after](), after);
      closeDialog(D.pin, { back });
    });
  }
  function undoCode() {
    if (isBusy(D.pin) || $("#pin-undo").getAttribute("aria-disabled") === "true") return;
    dropCode();
    closeDialog(D.pin);
  }
  $("#pin-saved").addEventListener("click", onSaved);
  $("#pin-undo").addEventListener("click", undoCode);
  document.addEventListener("click", (e) => { if (e.target.closest("#pin-copy")) copyCode(); });

  function openPinOff(opener) {
    clearNotice();
    renderCards();
    const p = $("#pinoff");
    clearDialog(p);
    resetFields(p);
    labelDialog(D.pinoff);
    openDialog(D.pinoff, byKey("pinOff") || opener, $("#pinoff-reason"));
  }
  $("#pinoff").addEventListener("submit", (e) => {
    e.preventDefault();
    if (isBusy(D.pinoff)) return;
    const p = $("#pinoff"), reason = $("#pinoff-reason");
    clearDialog(p);
    setWorking(D.pinoff, true);
    run(() => {
      const r = answer("pinOff");
      setWorking(D.pinoff, false);
      if (r.refuse) { applyTruth(r.refuse, "pinOff"); showAlert(D.pinoff, L.refuse[r.refuse]("pinOff"), { moot: true }); return; }
      if (r.fail) { showAlert(D.pinoff, L.failed); return; }
      data.desk.state = "off";
      addRecord("pinOff", undefined, reason.value.trim());
      resetFields(p);
      const back = finishWithDone("desk", L.done.pinOff(), "pinOff");
      closeDialog(D.pinoff, { back });
    });
  });

  /* ---- the owners: add, reset another owner's password, deactivate (with the reason), reactivate (a confirmation: the
   * account works again at once with its previous password), and change my own password. */
  let target = null;            // the owner a row's dialog is about
  function openAdd(opener) {
    clearNotice();
    renderCards();
    const p = $("#add");
    clearDialog(p);
    resetFields(p);
    labelDialog(D.add);
    openDialog(D.add, byKey("add") || opener, $("#add-name"));
  }
  const EMAIL_OK = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  $("#add").addEventListener("submit", (e) => {
    e.preventDefault();
    if (isBusy(D.add)) return;
    const p = $("#add"), name = $("#add-name"), email = $("#add-email"), pw = $("#add-pw");
    clearDialog(p);
    const bad = [];
    if (!name.value.trim()) { setFieldError(name, L.err.name); bad.push(name); }
    if (!email.value.trim()) { setFieldError(email, L.err.email); bad.push(email); }
    else if (!EMAIL_OK.test(email.value.trim())) { setFieldError(email, L.err.emailBad); bad.push(email); }
    if (pw.value.length < 12) { setFieldError(pw, L.err.pwShort); bad.push(pw); }
    $$(".pw-eye", p).forEach((b) => setEye(b, false));
    if (bad.length) { bad[0].focus(); return; }
    setWorking(D.add, true);
    run(() => {
      const r = answer("add", { email: email.value.trim() });
      setWorking(D.add, false);
      if (r.refuse === "owner_email_taken") {
        const hit = r.hit;
        setFieldError(email, L.refuse.owner_email_taken("add", hit ? nm(hit) : null, hit && !hit.active));
        email.focus();
        return;
      }
      if (r.refuse) { showAlert(D.add, L.refuse[r.refuse]("add"), { moot: true }); return; }
      if (r.fail) { showAlert(D.add, L.failed); return; }
      const id = `n${data.owners.length + 1}`;
      // A display name is trimmed and stored as typed (1-120 characters); an email as typed, trimmed.
      data.owners.push({ id, name: name.value.trim(), email: email.value.trim(), active: true });
      placeNew(id);
      addRecord("add", id);
      const html = L.done.add(nm(ownerOf(id)));
      resetFields(p);
      const back = finishWithDone(id, html, `reset:${id}`);
      closeDialog(D.add, { back });
    });
  });
  function openRow(act, id, opener) {
    const o = ownerOf(id);
    if (!o) return;
    target = id;
    clearNotice();
    renderCards();
    const dlg = { reset: D.reset, off: D.off, on: D.on, mine: D.mine }[act];
    const p = panelOf(dlg);
    clearDialog(p);
    resetFields(p);
    if (act === "reset") { $("#reset-title").innerHTML = L.resetTitle(nm(o)); $("#reset-desc").innerHTML = L.resetDesc(nm(o)); }
    if (act === "off") { $("#off-title").innerHTML = L.offTitle(nm(o)); $("#off-desc").innerHTML = L.offDesc(nm(o)); }
    if (act === "on") $("#on-title").innerHTML = L.onTitle(nm(o));
    if (act === "mine") $(".acc-user", p).value = o.email;
    labelDialog(dlg);
    const first = { reset: "#reset-pw", off: "#off-reason", mine: "#mine-current" }[act];
    // A confirmation without a field focuses Cancel: the action that gives access back is never one Enter away.
    openDialog(dlg, byKey(`${act}:${id}`) || opener, first ? $(first) : $(".acc-cancel", p));
  }
  function rowSubmit(act, dlg, check, after) {
    const p = panelOf(dlg);
    p.addEventListener("submit", (e) => {
      e.preventDefault();
      if (isBusy(dlg)) return;
      clearDialog(p);
      const firstBad = check(p);
      $$(".pw-eye", p).forEach((b) => setEye(b, false));
      if (firstBad) { firstBad.focus(); return; }
      setWorking(dlg, true);
      const id = target;
      run(() => {
        const r = answer(act);
        setWorking(dlg, false);
        const o = ownerOf(id);
        if (r.refuse && r.refuse in FIELD_REFUSALS) {
          const f = $(`#${FIELD_REFUSALS[r.refuse]}`);
          setFieldError(f, L.refuse[r.refuse](act, nm(o)));
          f.focus();
          return;
        }
        if (r.refuse) { applyTruth(r.refuse, act, id); showAlert(dlg, L.refuse[r.refuse](act, nm(o)), { moot: true }); return; }
        if (r.fail) { showAlert(dlg, L.failed); return; }
        after(o);
        addRecord(act, id, act === "off" ? $("#off-reason").value.trim() : "");
        resetFields(p);
        const back = finishWithDone(id, L.done[act](nm(o)), `${act === "off" ? "on" : act === "on" ? "reset" : act}:${id}`);
        closeDialog(dlg, { back });
      });
    });
  }
  const needPw = (sel) => (p) => { const f = $(sel, p); if (f.value.length < 12) { setFieldError(f, L.err.pwShort); return f; } return null; };
  rowSubmit("reset", D.reset, needPw("#reset-pw"), () => {});
  rowSubmit("off", D.off, () => null, (o) => { o.active = false; });
  rowSubmit("on", D.on, () => null, (o) => { o.active = true; });
  rowSubmit("mine", D.mine, (p) => {
    const cur = $("#mine-current", p), nu = $("#mine-new", p);
    let first = null;
    if (!cur.value) { setFieldError(cur, L.err.current); first = cur; }
    if (nu.value.length < 12) { setFieldError(nu, L.err.pwShort); first = first || nu; }
    return first;
  }, () => {});

  // One listener for every action on the page.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || !document.querySelector("#main").contains(b) || b.disabled || b.getAttribute("aria-disabled") === "true") return;
    const act = b.dataset.act;
    if (act === "pinCreate") openCode("create", b);
    else if (act === "pinChange") openCode("change", b);
    else if (act === "pinOff") openPinOff(b);
    else if (act === "add") openAdd(b);
    else openRow(act, b.dataset.id, b);
  });

  /* ---------------------------------------------------------------- the page's states
   *   loading  0-300 ms the slots wait empty (data-load="wait"); from 300 ms the skeleton, at least 400 ms; one
   *            announcement at 1 s; the 10 s ceiling turns it into Error. ?arrive=<ms> brings the payload that many ms
   *            after the page opened; ?arrive=never lets the ceiling run; without it the skeleton is held, for review.
   *            The names of both cards, what each can do, the way to the log and the frame are real from the first paint.
   *   error    the first payload could not be loaded: the header's Error, and one message for the page in place of the
   *            cards (Reports' option C), the one retry focused; it runs as an action (STA-9), then arrives. */
  const LOAD = { delay: 300, min: 400, say: 1000, ceiling: 10000, retry: 1200 };
  const ARRIVE = (() => { const a = params.get("arrive"); if (a === "never") return "never"; const n = Number(a); return a != null && a !== "" && Number.isFinite(n) && n >= 0 ? n : null; })();
  const load = { shownAt: null, timers: [] };
  const later = (ms, fn) => load.timers.push(setTimeout(fn, Math.max(0, ms)));
  const clearTimers = () => { load.timers.splice(0).forEach(clearTimeout); };
  function startLoading(arriveAfter) {
    clearTimers();
    phase = "loading";
    root.dataset.load = "wait";
    load.shownAt = null;
    renderAll();
    later(LOAD.delay, () => { if (phase === "loading") { root.dataset.load = "shown"; load.shownAt = performance.now(); } });
    later(LOAD.say, () => { if (phase === "loading") say(L.loadingSay); });
    if (typeof arriveAfter === "number" && arriveAfter < LOAD.ceiling) later(arriveAfter, arrive);
    if (arriveAfter === "never" || typeof arriveAfter === "number") later(LOAD.ceiling, fail);
  }
  function arrive() {
    if (phase !== "loading" && phase !== "retrying") return false;
    const now = performance.now();
    if (phase === "loading" && load.shownAt != null && now - load.shownAt < LOAD.min) { later(load.shownAt + LOAD.min - now, arrive); return false; }
    clearTimers();
    const hadFocus = Boolean(retryBtn && document.activeElement === retryBtn);
    phase = "ready";
    delete root.dataset.load;
    renderAll();
    // After a retry, focus goes where the page begins, with its ring: the front desk's name.
    if (hadFocus) $("#desk-title").focus({ preventScroll: true });
    say(L.arrivedSay);
    return true;
  }
  function fail() {
    if (phase !== "loading" && phase !== "retrying") return false;
    clearTimers();
    phase = "error";
    delete root.dataset.load;
    focusAlert = true;
    renderAll();
    return true;
  }
  function retry() {
    if (phase !== "error") return false;
    phase = "retrying";
    const [idle, busy] = retryBtn.querySelectorAll(".rb-l");
    idle.setAttribute("aria-hidden", "true");
    busy.removeAttribute("aria-hidden");
    retryBtn.setAttribute("aria-disabled", "true");
    retryBtn.setAttribute("aria-busy", "true");
    later(LOAD.retry, arrive);
    later(LOAD.ceiling, fail);
    return true;
  }

  /* ---------------------------------------------------------------- start */
  renderAll();
  if (phase === "loading") startLoading(ARRIVE);
  // Hooks for the capture script. They expose state; never the code, and never a password.
  window.__access = {
    ready: true,
    get phase() { return phase; },
    get viewOpen() { return isLocked(D.pin); },
    get notice() { return notice ? { at: notice.at, kind: notice.kind } : null; },
    get desk() { return data.desk.state; },
    get owners() { return ordered().map((o) => ({ id: o.id, active: o.active, me: o.id === ME })); },
    get records() { return { phase: records.phase, ids: records.list.slice(0, REC_N).map((r) => r.id), acts: records.list.slice(0, REC_N).map((r) => r.act) }; },
    arrive, fail, retry,
  };
})();
