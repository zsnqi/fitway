// Verifier: motion-on first paint (after network idle, pulse hidden) against the pre-motion still frames, AR and EN
// (plus delayed and no-history), with the animations running at load.
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const BASE = process.env.BASE ?? "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const REF = "C:/Users/PCFORC~1/AppData/Local/Temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/d329255d-7158-42d6-8349-b9c7d39168a4/scratchpad/eclipse-v3-user-copy/evidence";
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const rows = [];
for (const [name, q] of [["daily-ar-1440x900", "lang=ar&tuner=0"], ["daily-en-1440x900", "lang=en&tuner=0"], ["daily-ar-1440x900-delayed", "lang=ar&state=delayed&tuner=0"], ["daily-ar-1440x900-nohistory", "lang=ar&state=nohistory&tuner=0"]]) {
  for (const wait of [400, 2500]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark" });
    const p = await ctx.newPage();
    const errors = []; p.on("pageerror", (e) => errors.push(String(e))); p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await p.goto(`${BASE}?${q}`, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(wait);
    const anims = await p.evaluate(() => document.getAnimations().map((a) => `${a.constructor.name}:${a.animationName ?? ""}:${a.effect?.target?.className?.baseVal ?? a.effect?.target?.className ?? ""}:${a.playState}`));
    await p.addStyleTag({ content: ".ping{visibility:hidden!important}" }); await p.waitForTimeout(150);
    const file = `${OUT}/fp-${name}-${wait}.png`;
    await p.screenshot({ path: file });
    rows.push({ mode: `motion-on-${wait}`, name, file, ref: `${REF}/${name}.png`, errors, anims });
    await ctx.close();
  }
}
await b.close();
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(rows, null, 1));
console.log("done", rows.length);
