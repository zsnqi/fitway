// Probe: why does the motion-on first paint differ from the still frame? Vary the wait and how the pulse is hidden.
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync } from "node:fs";
const BASE = "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const REF = "C:/Users/PCFORC~1/AppData/Local/Temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/d329255d-7158-42d6-8349-b9c7d39168a4/scratchpad/eclipse-v3-user-copy/evidence";
const OUT = process.argv[2];
const b = await chromium.launch();
const rows = [];
const variants = [
  ["vis-400", 400, ".ping{visibility:hidden!important}"],
  ["vis-2500", 2500, ".ping{visibility:hidden!important}"],
  ["none-400", 400, ".ping{display:none!important}"],
  ["none-2500", 2500, ".ping{display:none!important}"],
  ["remove-2500", 2500, "remove"],
];
for (const [lang, name] of [["ar", "daily-ar-1440x900"], ["en", "daily-en-1440x900"]]) for (let rep = 0; rep < 2; rep++) for (const [v, wait, css] of variants) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark" });
  const p = await ctx.newPage();
  await p.goto(`${BASE}?lang=${lang}&tuner=0`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(wait);
  if (css === "remove") await p.evaluate(() => document.querySelector(".ping")?.remove()); else await p.addStyleTag({ content: css });
  await p.waitForTimeout(150);
  const file = `${OUT}/probe-${name}-${v}-${rep}.png`;
  await p.screenshot({ path: file });
  rows.push({ mode: `${v}-${rep}`, name, file, ref: `${REF}/${name}.png`, errors: [] });
  await ctx.close();
}
await b.close();
writeFileSync(`${OUT}/probe.json`, JSON.stringify(rows, null, 1));
