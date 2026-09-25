// Verifier: the live pulse with the marker resting on the latest reading (motion on), held at phases of its 5 s cycle,
// 3x crops for A and B (AR), tooltip hidden. Also the end halo during the first frames of a new reading (held morph).
import { chromium } from "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/node_modules/@playwright/test/index.mjs";
import { mkdirSync } from "node:fs";
const BASE = "file:///D:/Projects/fitway-worktrees/owner-design-exploration-r04/design-research/owner-composition-exploration-r04/directions/eclipse/index.html";
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
for (const form of ["a", "b"]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference", colorScheme: "dark", deviceScaleFactor: 3 });
  const p = await ctx.newPage();
  await p.goto(`${BASE}?lang=ar&tuner=0&marker=${form}`, { waitUntil: "networkidle" }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.addStyleTag({ content: ".tip{visibility:hidden!important}" });
  await p.evaluate(() => window.__eclipse.chart.select("latest")); await p.waitForTimeout(400);
  const c = await p.evaluate(() => { const s = document.querySelector("#plot-svg svg").getBoundingClientRect(); const e = document.getElementById("end-dot"); return { x: s.x + +e.getAttribute("cx"), y: s.y + +e.getAttribute("cy") }; });
  const clip = { x: Math.round(c.x - 25), y: Math.round(c.y - 25), width: 50, height: 50 };
  for (const ms of [1000, 1300, 1600, 1900, 2300, 2900, 4000]) { // animation delay is 1 s; ring visible for the first 48% of each cycle
    await p.evaluate((ms) => document.getAnimations().forEach((a) => { if (a.animationName === "ping") { a.pause(); a.currentTime = ms; } }), ms);
    await p.waitForTimeout(60);
    await p.screenshot({ path: `${OUT}/pulse-${form}-${String(ms).padStart(4, "0")}.png`, clip });
  }
  // a new reading, held at the start of the morph (halo state)
  await p.evaluate(() => document.getAnimations().forEach((a) => { if (a.animationName === "ping") { a.pause(); a.currentTime = 4000; } }));
  await p.evaluate(() => window.__eclipse.motion.step());
  for (const f of [0.05, 0.15, 0.3]) {
    await p.evaluate((f) => window.__eclipse.motion.seekLive(f), f); await p.waitForTimeout(60);
    await p.screenshot({ path: `${OUT}/morph-${form}-${f}.png`, clip });
  }
  await ctx.close();
}
await b.close();
console.log("done");
