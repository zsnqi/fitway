/* Eclipse v3 light tuner. A working tool for tuning the lights, not part of the product design.
 * Classic script (no modules, no fetch), so it works when index.html is opened from file://.
 * Every light reads CSS custom properties on <html>; the defaults in style.css are the Recommended preset,
 * and this panel overrides them live with inline styles on <html>.
 *   ?tuner=0                   the tuner is off entirely: no panel, and no stored tuning is applied
 *   ?preset=v2|a-like|recommended   start from that preset (not stored); with tuner=0 it applies the preset
 *                                   and shows no panel, which is how the preset evidence frames are captured
 * The panel also has a Motion group (Round 6; Round 7 step 2 adds the hover speed, step 3 the intro speed and
 * "Replay intro") that drives app.js's window.__eclipse.motion and window.__eclipse.intro. */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const OFF = params.get("tuner") === "0";
  const PRESET_PARAM = { v2: "v2", "a-like": "aLike", alike: "aLike", recommended: "recommended" }[(params.get("preset") || "").toLowerCase()] || null;
  if (OFF && !PRESET_PARAM) return;

  const root = document.documentElement;
  const STORE = "fitway.eclipse.v3.lights";
  const HUE_MIN = 21, HUE_MAX = 29; // OKLCH hues of FITWAY reds (#FF2946 is 21.6, #E51935 is 22.9); lower drifts toward crimson and rose, higher toward orange

  /* ------------------------------------------------ FITWAY-red core colour (OKLCH hue only) */
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  function toOklch(r, g, b) {
    r = lin(r); g = lin(g); b = lin(b);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360 };
  }
  function fromOklch(L, C, h) {
    const hr = (h * Math.PI) / 180;
    for (let c = C; c >= 0; c -= 0.002) {
      const A = c * Math.cos(hr), B = c * Math.sin(hr);
      const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
      const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
      const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
      const rgb = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
      ];
      if (rgb.every((v) => v >= -0.0005 && v <= 1.0005)) return rgb.map((v) => Math.round(Math.min(1, Math.max(0, gam(Math.max(0, v)))) * 255));
    }
    return [229, 25, 53];
  }
  const cssDefault = (v) => getComputedStyle(root).getPropertyValue(v).trim();
  const baseCore = cssDefault("--now-core").split(/\s+/).map(Number); // FITWAY red #E51935
  const baseLch = toOklch(...baseCore);
  const round = (v, step) => { const d = String(step).split(".")[1]?.length || 0; return Number((Math.round(v / step) * step).toFixed(d)); };
  const coreFor = (hue) => fromOklch(baseLch.L, baseLch.C, hue);
  const hex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;

  /* ------------------------------------------------------------------ controls */
  const pct = (v) => `${Math.round(v * 100)}%`;
  const num = (d) => (v) => String(Number(v).toFixed(d));
  const CONTROLS = [
    { g: "now", key: "nowInt", v: "--now-int", ar: "شدة الضوء", en: "Intensity", min: 0, max: 1.6, step: 0.05, out: pct },
    { g: "now", key: "nowHue", v: "--now-core", ar: "لون القلب", en: "Core colour", min: HUE_MIN, max: HUE_MAX, step: 0.1, hue: true, out: (v) => hex(coreFor(v)) },
    { g: "now", key: "nowDiscSize", v: "--now-disc-size", ar: "حجم القرص", en: "Disc size", min: 40, max: 140, step: 1, out: (v) => `${v}%` },
    { g: "now", key: "nowDiscX", v: "--now-disc-x", ar: "موضع القرص", en: "Disc position", min: 30, max: 110, step: 1, out: (v) => `${v}%` },
    { g: "now", key: "nowSoft", v: "--now-soft", ar: "نعومة حافة القرص", en: "Edge softness", min: 0, max: 48, step: 1, out: (v) => `${v}px` },
    { g: "now", key: "nowRim", v: "--now-rim", ar: "سُمك الحافة", en: "Rim thickness", min: -25, max: 12, step: 0.5, out: (v) => `${v}%` },
    { g: "now", key: "nowHot", v: "--now-hot", ar: "توهج الزاوية المضاءة", en: "Lit-corner glow", min: 0, max: 2, step: 0.05, out: pct },
    { g: "now", key: "nowHotSize", v: "--now-hot-size", ar: "حجم توهج الزاوية", en: "Glow size", min: 40, max: 250, step: 5, out: (v) => `${v}%` },
    { g: "now", key: "nowFar", v: "--now-far", ar: "توهج الزاوية البعيدة", en: "Far-corner glow", min: 0, max: 1.6, step: 0.05, out: pct },
    { g: "now", key: "nowEnd", v: "--now-end", ar: "تلاشي طرف الحلقة", en: "Ring-end fade", min: 0, max: 60, step: 1, out: (v) => `${v}%` },
    { g: "chart", key: "chartInt", v: "--chart-int", ar: "الشدة", en: "Intensity", min: 0, max: 2, step: 0.05, out: pct },
    { g: "chart", key: "chartFade", v: "--chart-fade", ar: "مسافة التلاشي", en: "Fade distance", min: 4, max: 40, step: 0.5, out: (v) => `${v}%` },
    { g: "chart", key: "chartSide", v: "--chart-side", ar: "ارتفاع الجانبين", en: "Side height", min: 8, max: 80, step: 0.5, out: (v) => `${v}%` },
    { g: "chart", key: "chartBalance", v: "--chart-balance", ar: "توازن الزاويتين", en: "Corner balance", min: -1, max: 1, step: 0.05, out: num(2) },
    { g: "chart", key: "chartSoft", v: "--chart-soft", ar: "نعومة الحافة", en: "Edge softness", min: 0, max: 260, step: 1, out: (v) => `${v}px` },
    { g: "page", key: "washInt", v: "--wash-int", ar: "الإضاءة العلوية", en: "Page wash", min: 0, max: 1.6, step: 0.05, out: pct },
    { g: "page", key: "grain", v: "--grain-o", ar: "الحبيبات", en: "Grain", min: 0, max: 0.4, step: 0.01, out: num(2) },
  ];
  const GROUPS = [
    { g: "now", ar: "داخل الصالة الآن", en: "Inside now" },
    { g: "chart", ar: "المخطط", en: "Chart card" },
    { g: "page", ar: "الصفحة", en: "Page" },
  ];

  // Recommended = the CSS defaults, read before any override is applied.
  const RECOMMENDED = {};
  CONTROLS.forEach((c) => { RECOMMENDED[c.key] = c.hue ? round(baseLch.h, c.step) : Number(cssDefault(c.v)); });

  /* Presets. v2: the closest the new controls get to Eclipse v2's lights. A-like: the chart card as close to
   * light-study A as measured (its strong inline-end corner included); the other lights stay Recommended. */
  const PRESETS = {
    v2: {
      nowInt: 1.6, nowHue: RECOMMENDED.nowHue, nowDiscSize: 61, nowDiscX: 83, nowSoft: 40, nowRim: -22, nowHot: 1, nowHotSize: 100, nowFar: 0, nowEnd: 18,
      chartInt: 0.55, chartFade: 40, chartSide: 48, chartBalance: 0, chartSoft: 260, washInt: 1, grain: 0.15,
    },
    aLike: {
      ...RECOMMENDED,
      chartInt: 1.1, chartFade: 16, chartSide: 36, chartBalance: 0.95, chartSoft: 48,
    },
    recommended: { ...RECOMMENDED },
  };
  const PRESET_NAMES = [
    { id: "v2", ar: "v2", en: "Eclipse v2" },
    { id: "aLike", ar: "قريب من A", en: "A-like" },
    { id: "recommended", ar: "المقترح", en: "Recommended" },
  ];

  /* ------------------------------------------------------------------- state */
  let values = { ...RECOMMENDED };
  const clampTo = (c, v) => Math.min(c.max, Math.max(c.min, v));
  function sanitize(obj) {
    const out = { ...RECOMMENDED };
    if (obj && typeof obj === "object") CONTROLS.forEach((c) => { const v = Number(obj[c.key]); if (Number.isFinite(v)) out[c.key] = clampTo(c, v); });
    return out;
  }
  function cssValue(c, v) { return c.hue ? (v === RECOMMENDED[c.key] ? baseCore.join(" ") : coreFor(v).join(" ")) : String(v); }
  function apply() {
    CONTROLS.forEach((c) => {
      // Values equal to Recommended fall back to the stylesheet, so Recommended is exactly the CSS defaults.
      if (values[c.key] === RECOMMENDED[c.key]) root.style.removeProperty(c.v);
      else root.style.setProperty(c.v, cssValue(c, values[c.key]));
    });
  }
  const same = (a, b) => CONTROLS.every((c) => Math.abs(a[c.key] - b[c.key]) < 1e-9);
  const activePreset = () => (PRESET_NAMES.find((p) => same(values, PRESETS[p.id])) || { id: "custom" }).id;
  function save() { try { localStorage.setItem(STORE, JSON.stringify(values)); } catch (e) { /* storage unavailable: the page still works */ } }
  function load() { try { const raw = localStorage.getItem(STORE); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function snapshot() {
    const css = {};
    CONTROLS.forEach((c) => { css[c.v] = cssValue(c, values[c.key]); });
    return { concept: "FITWAY Eclipse v3 light tuner (concept, synthetic data)", preset: activePreset(), values: { ...values }, css };
  }

  values = PRESET_PARAM ? { ...PRESETS[PRESET_PARAM] } : sanitize(load());
  apply();
  if (OFF) return;

  /* ------------------------------------------------------------------- panel */
  const el = (tag, attrs = {}, html = "") => { const n = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (html) n.innerHTML = html; return n; };
  const wrap = el("div", { class: "tuner", dir: "rtl", lang: "ar" });
  const toggle = el("button", { class: "tuner-toggle", type: "button", "aria-expanded": "false", "aria-controls": "tuner-panel" },
    `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg><span>الإضاءة</span><span class="t-en" lang="en" dir="ltr">Lights</span>`);
  const panel = el("section", { class: "tuner-panel", id: "tuner-panel", "aria-labelledby": "tuner-title", hidden: "" });
  const head = el("header", { class: "tuner-head" },
    `<h2 id="tuner-title">ضبط الإضاءة <span class="t-en" lang="en" dir="ltr">Light tuner</span></h2><p class="tuner-sub">أداة عمل، ليست جزءًا من التصميم</p>`);
  const close = el("button", { class: "tuner-x", type: "button", "aria-label": "إغلاق أداة الضبط" }, `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 7l10 10M17 7 7 17"/></svg>`);
  const grip = el("button", { class: "tuner-grip", type: "button", "aria-label": "تحريك الأداة: اسحبها أو استخدم الأسهم، وHome للموضع الأصلي", title: "اسحب لتحريك الأداة · Drag to move" },
    `<svg viewBox="0 0 14 14" aria-hidden="true" focusable="false"><circle cx="4.5" cy="3" r="1.3"/><circle cx="9.5" cy="3" r="1.3"/><circle cx="4.5" cy="7" r="1.3"/><circle cx="9.5" cy="7" r="1.3"/><circle cx="4.5" cy="11" r="1.3"/><circle cx="9.5" cy="11" r="1.3"/></svg>`);
  head.prepend(grip);
  head.append(close);
  const presets = el("div", { class: "tuner-presets", role: "group", "aria-label": "إعدادات جاهزة" });
  const presetBtns = PRESET_NAMES.map((p) => {
    const b = el("button", { type: "button", "data-preset": p.id, "aria-pressed": "false" }, `<span>${p.ar}</span>${p.ar === "v2" ? "" : `<span class="t-en" lang="en" dir="ltr">${p.en}</span>`}`);
    b.addEventListener("click", () => { values = { ...PRESETS[p.id] }; apply(); sync(); save(); });
    presets.append(b);
    return b;
  });
  const cols = el("div", { class: "tuner-cols" });
  const colA = el("div"), colB = el("div");
  cols.append(colA, colB);
  const inputs = {};
  GROUPS.forEach((grp) => {
    const fs = el("fieldset", { class: "tuner-group" });
    fs.append(el("legend", {}, `${grp.ar} <span class="t-en" lang="en" dir="ltr">${grp.en}</span>`));
    CONTROLS.filter((c) => c.g === grp.g).forEach((c) => {
      const id = `t-${c.key}`;
      const row = el("div", { class: "t-row" });
      const label = el("label", { for: id }, `<span>${c.ar}</span><span class="t-en" lang="en" dir="ltr">${c.en}</span>`);
      const input = el("input", { type: "range", id, min: String(c.min), max: String(c.max), step: String(c.step) });
      const out = el("output", { for: id, dir: "ltr" });
      if (c.hue) out.classList.add("t-hue");
      input.addEventListener("input", () => { values[c.key] = clampTo(c, Number(input.value)); apply(); syncRow(c); syncPresets(); save(); });
      row.append(label, input, out);
      fs.append(row);
      inputs[c.key] = { input, out };
    });
    (grp.g === "now" ? colA : colB).append(fs);
  });
  /* ------------------------------------------------------------ motion group
   * Drives app.js's motion (window.__eclipse.motion; Round 6): a simulated new reading, a simulated crowd-level
   * change on the Inside now card (across the nearest level boundary, up or down), the Motion switch, (Round 7
   * step 2) the hover speed of the chart marker's follow, and (Round 7 step 3) the first-open intro's speed and a
   * "Replay intro" button. app.js keeps the switch and both speeds in their own localStorage key
   * (fitway.eclipse.v3.motion), separate from the light values, and ignores them with ?tuner=0. */
  const MO = window.__eclipse && window.__eclipse.motion;
  let syncMotion = () => {};
  const motionGroup = el("fieldset", { class: "tuner-group tuner-motion" });
  if (MO) {
    const tb = (ar, en) => el("button", { type: "button", class: "t-btn" }, `<span>${ar}</span><span class="t-en" lang="en" dir="ltr">${en}</span>`);
    motionGroup.append(el("legend", {}, `الحركة <span class="t-en" lang="en" dir="ltr">Motion</span>`));
    const acts = el("div", { class: "t-motion-acts" });
    const stepBtn = tb("قراءة جديدة", "New reading");
    const backBtn = tb("إعادة القراءات", "Reset readings");
    const latest = el("span", { class: "t-latest", role: "status" });
    acts.append(stepBtn, backBtn, latest);
    const crowd = el("div", { class: "t-motion-acts", role: "group", "aria-labelledby": "t-crowd-label" });
    const upBtn = tb("مستوى أعلى", "Level up");
    const downBtn = tb("مستوى أدنى", "Level down");
    crowd.append(el("span", { class: "t-label", id: "t-crowd-label" }, `مستوى الازدحام <span class="t-en" lang="en" dir="ltr">Crowd level</span>`), upBtn, downBtn);
    const lab = el("label", { class: "t-check", for: "t-mo-motion" });
    const box = el("input", { type: "checkbox", id: "t-mo-motion" });
    box.addEventListener("change", () => { MO.set({ motion: box.checked }); syncMotion(); });
    lab.append(box);
    lab.insertAdjacentHTML("beforeend", `<span>الحركة</span><span class="t-en" lang="en" dir="ltr">Motion</span>`);
    // Hover speed: a multiplier on the follow's timing; 1 is the reference clip's feel (settled in about 400 ms).
    const speedRow = el("div", { class: "t-row t-speed" });
    const speedLabel = el("label", { for: "t-mo-speed" }, `<span>سرعة انتقال العلامة</span><span class="t-en" lang="en" dir="ltr">Hover speed</span>`);
    const speed = el("input", { type: "range", id: "t-mo-speed", min: "0.5", max: "2", step: "0.05" });
    const speedOut = el("output", { for: "t-mo-speed", dir: "ltr" });
    const speedReset = el("button", { type: "button", class: "t-mini", "aria-label": "سرعة انتقال العلامة الافتراضية" }, `<span>الافتراضي</span><span class="t-en" lang="en" dir="ltr">Default</span>`);
    const showSpeed = (v) => { speed.value = String(v); speedOut.textContent = `${Number(v).toFixed(2)}× · ${Math.round(400 / v)} ms`; speedReset.disabled = Number(v) === MO.defaults.hoverSpeed; };
    speed.addEventListener("input", () => { MO.set({ hoverSpeed: Number(speed.value) }); showSpeed(MO.options.hoverSpeed); });
    speedReset.addEventListener("click", () => { MO.set({ hoverSpeed: MO.defaults.hoverSpeed }); showSpeed(MO.options.hoverSpeed); });
    speedRow.append(speedLabel, speedOut, speedReset, speed);
    // The first-open intro (Round 7 step 3): its speed (a multiplier on every intro duration; 1 is the designed
    // length, about 1171 ms) and a button that replays it on the page as it is now. The speed is kept in the same
    // motion key and ignored with ?tuner=0.
    const IN = window.__eclipse.intro;
    const introRow = el("div", { class: "t-row t-speed t-intro-speed" });
    const introLabel = el("label", { for: "t-mo-intro" }, `<span>سرعة المقدمة</span><span class="t-en" lang="en" dir="ltr">Intro speed</span>`);
    const introSpeed = el("input", { type: "range", id: "t-mo-intro", min: "0.5", max: "2", step: "0.05" });
    const introOut = el("output", { for: "t-mo-intro", dir: "ltr" });
    const introReset = el("button", { type: "button", class: "t-mini", "aria-label": "سرعة المقدمة الافتراضية" }, `<span>الافتراضي</span><span class="t-en" lang="en" dir="ltr">Default</span>`);
    const showIntro = (v) => { introSpeed.value = String(v); introOut.textContent = `${Number(v).toFixed(2)}× · ${Math.round(IN.totalMs(Number(v)))} ms`; introReset.disabled = Number(v) === MO.defaults.introSpeed; };
    introSpeed.addEventListener("input", () => { MO.set({ introSpeed: Number(introSpeed.value) }); showIntro(MO.options.introSpeed); });
    introReset.addEventListener("click", () => { MO.set({ introSpeed: MO.defaults.introSpeed }); showIntro(MO.options.introSpeed); });
    introRow.append(introLabel, introOut, introReset, introSpeed);
    const introActs = el("div", { class: "t-motion-acts" });
    const replayBtn = tb("إعادة المقدمة", "Replay intro");
    replayBtn.id = "t-mo-replay";
    replayBtn.addEventListener("click", () => { IN.replay(); });
    introActs.append(replayBtn);
    const note = el("p", { class: "t-note" });
    motionGroup.append(acts, crowd, lab, speedRow, introRow, introActs, note);
    const say = (s) => { latest.textContent = s; };
    stepBtn.addEventListener("click", () => {
      const r = MO.step();
      say(!r ? "انتهى اليوم" : r.reading ? `آخر قراءة ${MO.latest}` : `لم تصل قراءة · آخر قراءة ${MO.latest}`);
      syncMotion();
    });
    backBtn.addEventListener("click", () => { MO.reset(); say(`آخر قراءة ${MO.latest}`); syncMotion(); });
    const crowdBy = (dir) => { const r = MO.crowd(dir); if (r) say(`داخل الصالة ${r.to} · ${r.level}`); syncMotion(); };
    upBtn.addEventListener("click", () => crowdBy(1));
    downBtn.addEventListener("click", () => crowdBy(-1));
    syncMotion = () => {
      const blocked = MO.urlOff || MO.systemReduced;
      box.checked = !blocked && Boolean(MO.options.motion);
      box.disabled = blocked;
      upBtn.disabled = downBtn.disabled = !MO.canCrowd;
      showSpeed(MO.options.hoverSpeed);
      showIntro(MO.options.introSpeed);
      replayBtn.disabled = !MO.on; // no intro with reduced motion, ?motion=off or the Motion switch off
      backBtn.disabled = MO.atStart;
      note.innerHTML = MO.urlOff ? "الحركة متوقفة بالرابط (motion=off)" : MO.systemReduced ? "النظام يطلب حركة أقل، فالحركة متوقفة"
        : !MO.canCrowd ? `بطاقة «آخر قراءة» ثابتة ما دامت البيانات متأخرة <span class="t-en" lang="en" dir="ltr">Fixed while delayed</span>` : "";
      note.hidden = !note.textContent;
      if (!latest.textContent) say(`آخر قراءة ${MO.latest}`);
    };
    syncMotion();
  }

  const actions = el("div", { class: "tuner-actions" });
  const copyBtn = el("button", { type: "button", class: "t-btn" }, `<span>نسخ القيم</span><span class="t-en" lang="en" dir="ltr">Copy values</span>`);
  const resetBtn = el("button", { type: "button", class: "t-btn" }, `<span>إعادة المقترح</span><span class="t-en" lang="en" dir="ltr">Reset to Recommended</span>`);
  const status = el("span", { class: "tuner-status", role: "status" });
  actions.append(copyBtn, resetBtn, status);
  const jsonBox = el("textarea", { class: "tuner-json", readonly: "", rows: "7", "aria-label": "القيم بصيغة JSON", dir: "ltr", hidden: "" });
  panel.append(head, presets, cols, ...(MO ? [motionGroup] : []), actions, jsonBox);
  wrap.append(toggle, panel);
  document.body.append(wrap);

  function syncRow(c) {
    const { input, out } = inputs[c.key];
    input.value = String(values[c.key]);
    out.textContent = c.out(values[c.key]);
    if (c.hue) out.style.setProperty("--sw", hex(coreFor(values[c.key])));
  }
  function syncPresets() {
    const a = activePreset();
    presetBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === a)));
  }
  function sync() { CONTROLS.forEach(syncRow); syncPresets(); }
  sync();

  /* ------------------------------------------------------------------- moving
   * The toggle and the panel move together. Drag the toggle or the panel's header (not its buttons); the grip
   * button also takes the arrow keys (Shift for bigger steps) and Home, and a double-click on the header returns
   * the tuner to its original spot. The position is measured from the page's inline-start edge (right in Arabic,
   * left in English) so the toggle stays put when the panel opens, is kept inside the viewport, and is
   * remembered in localStorage when available. */
  const POS_STORE = "fitway.eclipse.v3.tuner-pos";
  const rtlPage = root.getAttribute("dir") !== "ltr";
  let pos = null; // { edge, top } in px, or null for the stylesheet's default spot
  try { const p = JSON.parse(localStorage.getItem(POS_STORE)); if (p && Number.isFinite(p.edge) && Number.isFinite(p.top)) pos = p; } catch (e) { /* no stored spot */ }
  const savePos = () => { try { if (pos) localStorage.setItem(POS_STORE, JSON.stringify(pos)); else localStorage.removeItem(POS_STORE); } catch (e) { /* storage unavailable */ } };
  const viewport = () => ({ w: root.clientWidth || innerWidth, h: root.clientHeight || innerHeight });
  const current = () => { const r = wrap.getBoundingClientRect(); return { edge: rtlPage ? viewport().w - r.right : r.left, top: r.top }; };
  function place() {
    if (!pos) { wrap.style.removeProperty("left"); wrap.style.removeProperty("right"); wrap.style.removeProperty("top"); return; }
    const r = wrap.getBoundingClientRect(), v = viewport(), m = 4;
    pos = { edge: Math.round(Math.min(Math.max(m, pos.edge), Math.max(m, v.w - r.width - m))), top: Math.round(Math.min(Math.max(m, pos.top), Math.max(m, v.h - r.height - m))) };
    wrap.style.top = `${pos.top}px`;
    wrap.style.setProperty(rtlPage ? "right" : "left", `${pos.edge}px`);
    wrap.style.setProperty(rtlPage ? "left" : "right", "auto");
  }
  const moveBy = (dx, dy) => { const c = pos || current(); pos = { edge: c.edge + (rtlPage ? -dx : dx), top: c.top + dy }; place(); savePos(); };
  const resetPos = () => { pos = null; place(); savePos(); };
  let drag = null, suppressClick = false;
  function startDrag(e) {
    if (e.button !== 0) return;
    if (e.currentTarget === head && e.target.closest("button:not(.tuner-grip)")) return;
    const c = pos || current();
    drag = { x: e.clientX, y: e.clientY, edge: c.edge, top: c.top, moved: false, el: e.currentTarget, id: e.pointerId };
    // Follow the pointer wherever it goes until it is released, not only while it is over the handle.
    addEventListener("pointermove", moveDrag);
    addEventListener("pointerup", endDrag);
    addEventListener("pointercancel", endDrag);
  }
  function moveDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      wrap.classList.add("is-dragging");
      try { drag.el.setPointerCapture(drag.id); } catch (err) { /* capture is optional */ }
    }
    pos = { edge: drag.edge + (rtlPage ? -dx : dx), top: drag.top + dy };
    place();
  }
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved) { savePos(); suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); }
    wrap.classList.remove("is-dragging");
    removeEventListener("pointermove", moveDrag);
    removeEventListener("pointerup", endDrag);
    removeEventListener("pointercancel", endDrag);
    drag = null;
  }
  [toggle, head].forEach((h) => h.addEventListener("pointerdown", startDrag));
  // A drag that ends on a button must not also press it.
  wrap.addEventListener("click", (e) => { if (suppressClick) { suppressClick = false; e.stopPropagation(); e.preventDefault(); } }, true);
  head.addEventListener("dblclick", (e) => { if (!e.target.closest(".tuner-x")) resetPos(); });
  grip.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 60 : 12;
    const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (k) { e.preventDefault(); moveBy(...k); } else if (e.key === "Home") { e.preventDefault(); resetPos(); }
  });
  addEventListener("resize", () => { if (pos) place(); });
  place();

  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    wrap.classList.toggle("is-open", open);
    if (pos) place(); // opening near an edge moves the tuner back inside the viewport
  };
  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => { setOpen(false); toggle.focus(); });
  panel.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); toggle.focus(); } });
  resetBtn.addEventListener("click", () => { values = { ...RECOMMENDED }; apply(); sync(); save(); status.textContent = "عادت القيم المقترحة"; });
  copyBtn.addEventListener("click", () => {
    const text = JSON.stringify(snapshot(), null, 2);
    const fallback = () => {
      jsonBox.value = text;
      jsonBox.hidden = false;
      jsonBox.focus();
      jsonBox.select();
      status.textContent = "تعذّر النسخ، انسخ القيم من المربع";
    };
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) { fallback(); return; }
      navigator.clipboard.writeText(text).then(() => { jsonBox.hidden = true; status.textContent = "نُسخت القيم"; }, fallback);
    } catch (e) { fallback(); }
  });

  window.__tuner = { controls: CONTROLS.map((c) => ({ key: c.key, v: c.v })), presets: PRESETS, get values() { return { ...values }; }, snapshot, setOpen,
    set(obj) { values = sanitize({ ...values, ...obj }); apply(); sync(); }, syncMotion: () => syncMotion() };
})();
