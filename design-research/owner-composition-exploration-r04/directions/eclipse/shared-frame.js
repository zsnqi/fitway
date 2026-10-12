/* Eclipse: the Owner frame shared by every page. Page scripts provide copy,
 * links and the genuinely different Operations states; this file owns the
 * shell, rail, layers, labels and status rendering. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ICONS = {
    clock: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M12 7.6V12l3 2"/></svg>`,
    offline: `<svg class="ico ico-off" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.2"/><path d="M6.3 17.7 17.7 6.3"/></svg>`,
    error: `<svg class="ico ico-err" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.4"/><path d="M12 7.6v5.4M12 16.2v.2"/></svg>`,
  };
  const EASE = { rail: "cubic-bezier(0.22, 1, 0.36, 1)", railClose: "cubic-bezier(0.4, 0, 0.2, 1)" };
  const T = { railOpen: 240, railClose: 200, railDist: 156, railReveal: 12 };
  const f2 = (n) => Number(n).toFixed(2);
  const FRAME_COPY = {
    ar: {
      skip: "انتقل إلى المحتوى", railLabel: "الأقسام", brand: "FITWAY، أسماء الأقسام", railTip: "أسماء الأقسام",
      nav: { daily: "اليوم", reports: "التقارير", access: "الوصول", activity: "سجل النشاط", operations: "التشغيل", monitoring: "شاشة المراقبة", lang: "English", settings: "الإعدادات", signout: "تسجيل الخروج" },
      tabs: { daily: "اليوم", reports: "التقارير", activity: "النشاط", access: "الوصول", settings: "الإعدادات" },
      opsTitle: "حالة التشغيل", more: "المزيد", langAria: "التبديل إلى اللغة الإنجليزية", langGlyph: "EN",
      live: "مباشر", delayed: "متأخر", lastReading: "آخر قراءة", hours: "ساعات العمل", closed: "مغلق", closedWord: "مغلق", offline: "غير متصل", noCount: "لا عدّ حاليًا", errorWord: "خطأ", errorLine: "تعذّر التحميل",
    },
    en: {
      skip: "Skip to content", railLabel: "Sections", brand: "FITWAY, section names", railTip: "Section names",
      nav: { daily: "Today", reports: "Reports", access: "Access", activity: "Activity log", operations: "Operations", monitoring: "Monitoring", lang: "العربية", settings: "Settings", signout: "Sign out" },
      tabs: { daily: "Today", reports: "Reports", activity: "Activity", access: "Access", settings: "Settings" },
      opsTitle: "Operations status", more: "More", langAria: "Switch to Arabic", langGlyph: "AR",
      live: "Live", delayed: "Delayed", lastReading: "Last reading", hours: "Open", closed: "Closed", closedWord: "Closed", offline: "Offline", noCount: "No current count", errorWord: "Error", errorLine: "Couldn't load",
    },
  };

  function init(ctx) {
    const { L: supplied, RTL, motionOn, Motion = window.EclipseMotion, URL_OFF = false } = ctx;
    const L = Object.assign(supplied, FRAME_COPY[RTL ? "ar" : "en"]);
    const root = document.documentElement;
    const frameState = { railOpen: false, openLayer: null };
    const rail = $("#rail"), brand = $("#brand");
    document.title = L.docTitle;
    $$("[data-t]").forEach((el) => { const v = L[el.dataset.t]; if (typeof v === "string") el.innerHTML = v; });
    $$("[data-t-label]").forEach((el) => el.setAttribute("aria-label", L[el.dataset.tLabel]));
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

    const langLink = $("#lang-link"), menuLang = $("#menu-lang");
    const langQuery = () => {
      const p = new URLSearchParams(location.search);
      p.set("lang", RTL ? "en" : "ar");
      return p;
    };
    for (const el of [langLink, menuLang]) {
      el.setAttribute("hreflang", RTL ? "en" : "ar");
      el.setAttribute("href", `?${langQuery()}`);
    }
    $(".rail-name", langLink).setAttribute("lang", RTL ? "en" : "ar");
    $("#menu-lang-glyph").textContent = L.langGlyph;
    $("#menu-lang-glyph").setAttribute("lang", "en");
    $("#menu-lang-name").textContent = L.nav.lang;
    $("#menu-lang-name").setAttribute("lang", RTL ? "en" : "ar");
    $("#menu-signout-name").textContent = L.nav.signout;
    $("#menu-monitoring-name").textContent = L.nav.monitoring;
    $("#ops-link-name").textContent = L.nav.operations;

    for (const [key, href] of Object.entries(ctx.links || {})) {
      const selector = `[data-nav="${key}"], [data-tab="${key}"]`;
      $$(selector).forEach((a) => a.setAttribute("href", href));
    }
    if (ctx.extraLinks) {
      for (const [selector, href] of Object.entries(ctx.extraLinks)) {
        const el = $(selector);
        if (el) el.setAttribute("href", href);
      }
    }

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
    const railRun = { anims: [], surface: null, open: false };
    const finishRail = () => {
      if (!railRun.surface) return;
      const anims = railRun.anims;
      railRun.anims = [];
      anims.forEach((a) => a.cancel());
      railRun.surface.remove();
      railRun.surface = null;
      rail.classList.remove("is-morph");
      rail.dataset.open = String(railRun.open);
    };
    const animateRail = (open) => {
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
    };
    const setRail = (open) => {
      if (open === frameState.railOpen) return;
      ctx.beforeRail?.();
      frameState.railOpen = open;
      ctx.onRailState?.(open);
      brand.setAttribute("aria-expanded", String(open));
      setRailModal(open && mqTablet.matches);
      animateRail(open);
    };
    brand.addEventListener("click", () => setRail(!frameState.railOpen));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && frameState.railOpen && !ctx.isDialogOpen?.()) { setRail(false); brand.focus(); } });
    document.addEventListener("pointerdown", (e) => { if (frameState.railOpen && !rail.contains(e.target)) setRail(false); });
    rail.addEventListener("focusout", (e) => { if (frameState.railOpen && !railModal && e.relatedTarget && !rail.contains(e.relatedTarget)) setRail(false); });
    rail.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !railModal) return;
      const f = railFocusables(), i = f.indexOf(document.activeElement);
      const next = e.shiftKey ? (i <= 0 ? f[f.length - 1] : null) : (i === f.length - 1 ? f[0] : null);
      if (next) { e.preventDefault(); next.focus(); }
    });

    const layers = { ops: { btn: $("#ops-btn"), pop: $("#ops-pop") }, menu: { btn: $("#menu-btn"), pop: $("#menu-pop") } };
    const menuItems = () => [...layers.menu.pop.querySelectorAll('[role="menuitem"]')];
    const showLayer = (name, focus = "first") => {
      if (frameState.openLayer && frameState.openLayer !== name) hideLayer(frameState.openLayer, false, true);
      const { btn, pop } = layers[name];
      frameState.openLayer = name;
      ctx.onLayerState?.(name);
      pop.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      if (name === "menu") { const it = menuItems(); (focus === "last" ? it[it.length - 1] : it[0]).focus(); } else pop.focus();
      Motion.popOpen(pop);
    };
    const hideLayer = (name, returnFocus, instant = false) => {
      const { btn, pop } = layers[name];
      if (pop.hidden) return;
      if (!instant) Motion.popClose(pop);
      pop.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (frameState.openLayer === name) { frameState.openLayer = null; ctx.onLayerState?.(null); }
      if (returnFocus) btn.focus();
    };
    for (const [name, { btn, pop }] of Object.entries(layers)) {
      btn.addEventListener("click", () => (pop.hidden ? showLayer(name) : hideLayer(name, true)));
      pop.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); hideLayer(name, true); } });
      pop.addEventListener("focusout", (e) => { if (!pop.hidden && !pop.contains(e.relatedTarget) && e.relatedTarget !== btn && e.relatedTarget) hideLayer(name, false); });
    }
    layers.menu.btn.addEventListener("keydown", (e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); showLayer("menu", e.key === "ArrowUp" ? "last" : "first"); } });
    layers.menu.pop.addEventListener("keydown", (e) => {
      const it = menuItems(), i = it.indexOf(document.activeElement);
      const go = (j) => { e.preventDefault(); it[(j + it.length) % it.length].focus(); };
      if (e.key === "ArrowDown") go(i + 1); else if (e.key === "ArrowUp") go(i - 1); else if (e.key === "Home") go(0); else if (e.key === "End") go(it.length - 1); else if (e.key === "Tab") hideLayer("menu", true); else if (e.key === " ") { e.preventDefault(); document.activeElement.click(); }
    });
    $("#menu-signout").addEventListener("click", (e) => e.preventDefault());
    $("#menu-monitoring").addEventListener("click", (e) => e.preventDefault());
    $("#ops-link").addEventListener("click", (e) => e.preventDefault());
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && frameState.openLayer && !ctx.isDialogOpen?.()) hideLayer(frameState.openLayer, true); });
    document.addEventListener("pointerdown", (e) => {
      if (!frameState.openLayer) return;
      const { btn, pop } = layers[frameState.openLayer];
      if (!pop.contains(e.target) && !btn.contains(e.target)) hideLayer(frameState.openLayer, false, Object.values(layers).some((l) => l.btn.contains(e.target)));
    });
    const onFrameChange = () => { if (frameState.railOpen) setRail(false); setRailModal(false); if (frameState.openLayer) hideLayer(frameState.openLayer, false, true); };
    mqTablet.addEventListener("change", onFrameChange);
    mqPhone.addEventListener("change", onFrameChange);
    layers.menu.btn.setAttribute("aria-label", L.more);
    $("#tabbar").setAttribute("aria-label", L.railLabel);
    $$(".tb-item[data-tab]").forEach((a) => { const key = a.dataset.tab; $(".tb-name", a).textContent = L.tabs[key]; a.setAttribute("aria-label", L.nav[key]); if (a.hasAttribute("data-inert")) a.addEventListener("click", (e) => e.preventDefault()); });

    const status = ctx.status;
    if (status) {
      let statusLoad = null;
      const words = (x) => `${x.mark}<span class="hb-word">${x.word}</span><span class="hb-line"><span class="sr-only">${RTL ? "، " : ", "}</span><span aria-hidden="true">· </span>${x.line}</span>`;
      const renderStatus = () => {
        const phase = status.phase(), loading = status.loading ? status.loading(phase) : phase === "loading";
        const btn = layers.ops.btn;
        if (loading && !statusLoad) { statusLoad = Object.assign(document.createElement("span"), { className: "hb-load", textContent: status.loadingWord || L.loadingWord }); btn.before(statusLoad); }
        if (!loading && statusLoad) { statusLoad.remove(); statusLoad = null; }
        btn.hidden = loading;
        const key = status.key(phase), state = status.states[key]();
        btn.className = `hbadge${state.cls ? ` ${state.cls}` : ""}`;
        if (status.buttonAria === false) btn.removeAttribute("aria-label");
        $("#ops-btn-state").innerHTML = `<span class="sr-only">${L.opsTitle}: </span>${words(state)}`;
        const minute = status.reserveMinute ?? 284;
        $("#ops-res").innerHTML = Object.values(status.states).map((f) => `<span class="hb-r">${words(f(minute))}<svg class="hb-chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 10l5 5 5-5"/></svg></span>`).join("");
        $("#ops-state").className = `ops-state${state.cls ? ` ${state.cls}` : ""}`;
        $("#ops-state").innerHTML = `${state.mark}<span>${state.word}</span>`;
        $("#ops-last").innerHTML = status.detail ? status.detail(state) : state.detail || state.line;
        $("#ops-hours").innerHTML = status.hours();
      };
      renderStatus();
      new MutationObserver(renderStatus).observe(root, { attributes: true, attributeFilter: ["data-phase"] });
    }
    return { state: frameState, layers, mqPhone, mqTablet, icons: ICONS, setRail, hideLayer, finishRail, refreshLanguage: () => { const q = langQuery(); langLink.setAttribute("href", `?${q}`); menuLang.setAttribute("href", `?${q}`); } };
  }

  window.EclipseFrame = Object.freeze({ init, icons: ICONS, timings: T, easings: EASE, copy: FRAME_COPY });
})();
