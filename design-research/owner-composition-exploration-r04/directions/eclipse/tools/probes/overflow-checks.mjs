// Real-browser regression fixture; the measured pages and all outputs stay in OUT.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { dirname } from "node:path";
import { OUT, ORIGIN, outputPath, startServer, launch, newPage, shot, overflowProbe, writeJson } from "./lib.mjs";

const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 2 && args[0] === "--legacy"), "Usage: overflow-checks.mjs [--legacy absolute-saved-probe.js]");
const legacy = args.length ? await readFile(args[1], "utf8") : null;
const fixture = await outputPath("overflow-fixture/index.html");
await mkdir(new URL("./", pathToFileURL(fixture)), { recursive: true });
await writeFile(fixture, `<!doctype html><html lang="en"><meta charset="utf-8"><title>Planted text spills</title>
<style>
body { margin: 24px; font: 20px/1.5 Arial, sans-serif; }
#cases { display: grid; grid-template-columns: repeat(4, 300px); gap: 12px; }
.box { display: block; width: 48px; white-space: nowrap; border: 1px solid #c22; }
#rtl { margin-left: 220px; direction: rtl; }
#nested { width: 48px; }
#clipped { overflow: hidden; }
#vertical { writing-mode: vertical-rl; height: 48px; width: 32px; }
#fit, #near-fit { width: 280px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 700px) { #cases { grid-template-columns: 300px; } }
</style><h1>Planted text spills</h1><div id="cases">
${Array.from({ length: 32 }, (_, i) => `<div class="box" id="word-${i}">UnbreakableOverflowWord</div>`).join("\n")}
<span class="box" id="span">UnbreakableOverflowWord</span>
<bdi class="box" id="bdi">UnbreakableOverflowWord</bdi>
<div class="box" id="rtl" lang="ar">كلمةطويلةتتجاوزحدودالصندوق</div>
<div class="box" id="nested"><span>UnbreakableOverflowWord</span></div>
<div class="box" id="clipped">UnbreakableOverflowWord</div>
<div class="box stat-head" id="legacy-class">UnbreakableOverflowWord</div>
<div class="box" id="vertical">UnbreakableOverflowWord</div>
<div id="fit">Fits</div><div id="near-fit">Fits</div>
<div hidden id="hidden">UnbreakableOverflowWord</div>
<div style="display:none" id="none"><span>UnbreakableOverflowWord</span></div>
<div style="visibility:hidden" id="invisible">UnbreakableOverflowWord</div>
<span class="sr-only" id="accessible">UnbreakableOverflowWord</span>
</div></html>`, "utf8");

let server, browser;
try {
  server = await startServer({ dir: dirname(fixture) });
  browser = await launch();
  const results = [];
  for (const transport of ["file", "http"]) for (const width of [1440, 390]) {
    const { context, page } = await newPage(browser, { width, height: 900, motion: false });
    try {
      await page.goto(transport === "file" ? pathToFileURL(fixture).href : `${ORIGIN}/index.html`);
      await page.evaluate(() => {
        const el = document.querySelector("#near-fit"), range = document.createRange();
        range.selectNodeContents(el);
        el.style.width = `${range.getBoundingClientRect().width - 0.75}px`;
      });
      const result = await page.evaluate(overflowProbe);
      const text = result.problems.filter((problem) => problem.textOverflow);
      const find = (id) => text.find((problem) => problem.el.endsWith(`#${id}`));
      assert.equal(result.hScroll, false, "Planted words must stay inside the viewport");
      for (let i = 0; i < 32; i++) assert.ok(find(`word-${i}`)?.textOverflow.right > 1, `Missing word-${i}`);
      for (const id of ["span", "bdi", "nested", "clipped", "legacy-class"]) assert.ok(find(id)?.textOverflow.right > 1, `Missing ${id}`);
      assert.ok(find("rtl")?.textOverflow.left > 1, "Missing leftward RTL spill");
      assert.ok(find("vertical")?.textOverflow.bottom > 1, "Missing vertical inline spill");
      for (const id of ["fit", "near-fit", "hidden", "none", "invisible", "accessible"]) assert.equal(find(id), undefined, `False positive ${id}`);
      if (legacy) {
        const before = await page.evaluate((source) => (0, eval)(`${source}; legacyOverflowProbe()`), legacy);
        for (const problem of before.problems) assert.ok(result.problems.some((actual) => JSON.stringify(actual) === JSON.stringify(problem)), `Lost legacy result ${JSON.stringify(problem)}`);
        assert.equal(before.problems.some((problem) => problem.el.includes("word-")), false);
      }
      const frame = `overflow-${transport}-${width}x900`;
      await shot(page, frame, { fullPage: true });
      results.push({ transport, width, frame, ...result });
      console.log(`PASS overflow ${transport} ${width}x900: 39 planted text spills; ${find("word-0").el} right=${find("word-0").textOverflow.right}px; ${find("rtl").el} left=${find("rtl").textOverflow.left}px; ${find("vertical").el} bottom=${find("vertical").textOverflow.bottom}px; hScroll=false; fitting/hidden controls=clean${legacy ? "; legacy results retained" : ""}`);
      // Explicitly retain viewport-edge reporting, independently of text ranges.
      await page.evaluate(() => {
        const el = document.createElement("div");
        el.id = "edge-control"; el.style.cssText = "position:absolute;left:1600px;width:20px;height:20px";
        document.body.append(el);
      });
      const edge = await page.evaluate(overflowProbe);
      assert.ok(edge.problems.some((problem) => problem.el.startsWith("#edge-control") && problem.spill));
      assert.equal(edge.hScroll, true);
    } finally { await context.close(); }
  }
  await writeJson("overflow-checks.json", results);
  console.log(`PASS overflow contracts: generic elements, nested text, RTL, vertical writing, clipping, viewport edges, >20 results; output=${OUT}`);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((done) => server.close(done));
}
