import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { E, OUT, PORT, WORKTREE, startServer, launch, open, shot, writeJson, outputPath, assertOutsideGit, overflowProbe, geometryProbe, accessibilityProbe } from "./lib.mjs";

let server, browser;
const result = { eclipse: E, output: OUT, port: PORT, frames: [], probes: {} };
try {
  assert.throws(() => assertOutsideGit(WORKTREE), /Refusing output inside git working tree/);
  console.log(`CONFIG Eclipse=${E} output=${OUT} port=${PORT}; git-output refusal=PASS`);
  server = await startServer();
  browser = await launch();
  for (const transport of ["file", "http"]) for (const pg of ["index.html", "reports.html"]) {
    const { context, page, errors, requests } = await open(browser, { page: pg, transport, lang: "ar", width: 1440, height: 900 });
    try {
      assert.deepEqual(await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir]), ["ar", "rtl"]);
      assert.equal(errors.length, 0, errors.join("\n"));
      assert.equal(requests.some((url) => !url.startsWith("file:") && !url.startsWith(`http://127.0.0.1:${PORT}/`)), false, "External request");
      const name = `${transport}-${pg === "index.html" ? "daily" : "reports"}-ar-1440x900`;
      await shot(page, name);
      const path = await outputPath(`${name}.png`);
      assert.ok((await stat(path)).size > 0);
      result.frames.push({ name, url: page.url(), path });
      console.log(`FRAME ${name}.png`);
      if (transport === "http" && pg === "index.html") {
        result.probes.overflow = await page.evaluate(overflowProbe);
        result.probes.geometry = await page.evaluate(geometryProbe);
        result.probes.accessibility = await accessibilityProbe(page);
        assert.equal(result.probes.overflow.hScroll, false);
        assert.equal(result.probes.overflow.problems.length, 0, JSON.stringify(result.probes.overflow.problems));
        assert.ok(result.probes.geometry.W > 0 && result.probes.geometry.H > 0 && result.probes.geometry.hs.length > 0);
        assert.equal(result.probes.accessibility.control.detected, true);
        console.log(`PROBES overflow=0 geometry=${result.probes.geometry.W}x${result.probes.geometry.H} stops=${result.probes.geometry.hs.length} a11y-control=detected`);
      }
    } finally { await context.close(); }
  }
  await writeJson("smoke.json", result);
  console.log("PASS Eclipse probe kit: 4 Arabic 1440x900 frames (file + HTTP); overflow, geometry, accessibility each ran once");
} catch (error) { console.error(`FAIL Eclipse probe kit: ${error.stack}`); process.exitCode = 1; }
finally {
  if (browser) await browser.close();
  if (server) await new Promise((done, reject) => server.close((error) => error ? reject(error) : done()));
}
