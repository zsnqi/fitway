// Verifier: the marker switch. Tuner control and labels (AR, EN), live switch with a shown marker, persistence in its
// own key across a reload, ?tuner=0 ignores the stored choice, ?marker=a|b (not stored), default A, the API, keyboard.
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const BASE = "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const R = {};
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", colorScheme: "dark", deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errors = []; p.on("pageerror", (e) => errors.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const go = async (q) => { await p.goto(`${BASE}?${q}`, { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300); };
const state = () => p.evaluate(() => ({
  marker: window.__eclipse.chart.marker, fromUrl: window.__eclipse.chart.markerFromUrl, key: window.__eclipse.chart.markerStore,
  shown: document.querySelector("#sel .sg-mark")?.dataset.marker ?? null, selected: window.__eclipse.chart.selected,
  storage: Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k).slice(0, 80)])),
  buttons: [...document.querySelectorAll(".tuner-marker button")].map((x) => ({ m: x.dataset.marker, pressed: x.getAttribute("aria-pressed"), text: x.innerText.replace(/\s+/g, " ").trim() })),
  legend: document.querySelector(".tuner-marker legend")?.innerText.replace(/\s+/g, " ").trim() ?? null,
  groupLabel: document.querySelector(".tuner-marker .t-seg")?.getAttribute("aria-label") ?? null,
  tunerPresent: Boolean(document.querySelector(".tuner-toggle")),
}));
await go("lang=ar"); R.freshDefault = await state();
await p.evaluate(() => window.__eclipse.chart.select("h660"));
R.selectedBefore = await state();
await p.click(".tuner-toggle"); await p.waitForTimeout(300);
const grp = await p.evaluate(() => { const r = document.querySelector(".tuner-marker").getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; });
await p.screenshot({ path: `${OUT}/tuner-marker-ar-2x.png`, clip: grp });
await p.click(".tuner-marker button[data-marker='b']"); await p.waitForTimeout(200);
R.afterClickB = await state();
const plotClip = await p.evaluate(() => { const m = document.querySelector("#sel .sg-mark").getBoundingClientRect(); return { x: m.x - 60, y: m.y - 60, width: 130, height: 130 }; });
await p.screenshot({ path: `${OUT}/live-switch-b-2x.png`, clip: plotClip });
await p.click(".tuner-marker button[data-marker='a']"); await p.waitForTimeout(200);
R.afterClickA = await state();
await p.screenshot({ path: `${OUT}/live-switch-a-2x.png`, clip: plotClip });
// keyboard: focus the B button and press Space
await p.focus(".tuner-marker button[data-marker='b']"); await p.keyboard.press("Space"); await p.waitForTimeout(150);
R.afterKeyboardB = await state();
// Reset to Recommended (the tuner's own reset): does it touch the marker?
const resetBtn = await p.$$eval(".tuner-actions button", (bs) => bs.findIndex((x) => /Reset/.test(x.textContent)));
if (resetBtn >= 0) { await p.click(`.tuner-actions button >> nth=${resetBtn}`); await p.waitForTimeout(150); }
R.afterReset = await state();
await go("lang=ar"); R.reloadKeepsB = await state();
await go("lang=en"); R.enReload = await state();
await p.click(".tuner-toggle"); await p.waitForTimeout(300);
const grp2 = await p.evaluate(() => { const r = document.querySelector(".tuner-marker").getBoundingClientRect(); return { x: r.x - 6, y: r.y - 6, width: r.width + 12, height: r.height + 12 }; });
await p.screenshot({ path: `${OUT}/tuner-marker-en-2x.png`, clip: grp2 });
await go("lang=ar&tuner=0"); R.tuner0IgnoresStored = await state();
await go("lang=ar&marker=a"); R.urlAWins = await state();
await go("lang=ar&tuner=0&marker=b"); R.tuner0UrlB = await state();
await go("lang=ar&marker=B"); R.urlUpper = await state();
await go("lang=ar&marker=c"); R.urlInvalid = await state();
// mid-glide switch (motion on page)
await p.evaluate(() => localStorage.clear());
const ctx2 = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark" });
const p2 = await ctx2.newPage();
await p2.goto(`${BASE}?lang=ar&marker=b`, { waitUntil: "networkidle" }); await p2.waitForTimeout(300);
R.freshUrlB = await p2.evaluate(() => ({ marker: window.__eclipse.chart.marker, stored: localStorage.getItem("fitway.eclipse.v3.marker"), pressed: [...document.querySelectorAll(".tuner-marker button")].map((x) => x.getAttribute("aria-pressed")) }));
R.midGlide = await p2.evaluate(async () => {
  window.__eclipse.chart.select("h600"); await new Promise((r) => setTimeout(r, 300));
  window.__eclipse.chart.select("h630"); const g = window.__eclipse.chart.glideActive;
  await new Promise((r) => setTimeout(r, 40));
  window.__eclipse.chart.setMarker("a", false);
  const mid = { glideActive: window.__eclipse.chart.glideActive, shown: document.querySelector("#sel .sg-mark")?.dataset.marker, under: document.getElementById("sel-under").childElementCount };
  await new Promise((r) => setTimeout(r, 300));
  return { glideStarted: g, mid, rest: { shown: document.querySelector("#sel .sg-mark")?.dataset.marker, selected: window.__eclipse.chart.selected, stored: localStorage.getItem("fitway.eclipse.v3.marker") } };
});
await ctx2.close();
// fresh context: ?tuner=0 default, and default with no storage
const ctx3 = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", colorScheme: "dark" });
const p3 = await ctx3.newPage();
await p3.goto(`${BASE}?lang=en&tuner=0`, { waitUntil: "networkidle" });
R.freshTuner0 = await p3.evaluate(() => ({ marker: window.__eclipse.chart.marker, tuner: Boolean(document.querySelector(".tuner-toggle")), keys: Object.keys(localStorage) }));
await ctx3.close();
R.errors = errors;
await ctx.close(); await b.close();
writeFileSync(`${OUT}/switch.json`, JSON.stringify(R, null, 1));
const s = (x) => JSON.stringify({ marker: x.marker, fromUrl: x.fromUrl, shown: x.shown, sel: x.selected, stored: x.storage?.["fitway.eclipse.v3.marker"] ?? null, pressed: x.buttons?.map((b) => b.pressed).join("/") });
for (const [k, v] of Object.entries(R)) if (v && v.marker !== undefined && v.buttons) console.log(k, s(v)); else console.log(k, JSON.stringify(v));
console.log("labels AR", JSON.stringify(R.freshDefault.legend), JSON.stringify(R.freshDefault.buttons.map((b) => b.text)), "group", R.freshDefault.groupLabel);
console.log("storage keys after click", Object.keys(R.afterClickB.storage));
