// Harness contract checks; all fixtures stay under guarded PROBE_OUT.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, readdir, symlink, unlink } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { E, OUT, WORKTREE, ORIGIN, SRV, SERVER_LOG, startServer, outputPath, assertOutsideGit, armFp, holdProof, launch, newPage, holdBySubset, introSettled } from "./lib.mjs";

const exports = Object.keys(await import("./lib.mjs")).sort();
const readme = await readFile(new URL("./README.md", import.meta.url), "utf8");
const documented = [...readme.matchAll(/^- `([\w]+)(?:\([^`]*\))?`:/gm)].map((match) => match[1]).sort();
assert.deepEqual(documented, exports);
console.log(`PASS export inventory: ${exports.length} exports, each documented once in README`);

await outputPath("checks-placeholder");
const fixture = await mkdtemp(resolve(OUT, "checks-"));
const nested = resolve(fixture, "nested-repo");
await mkdir(nested);
execFileSync("git", ["init", "--quiet", nested], { windowsHide: true });
assert.throws(() => assertOutsideGit(resolve(nested, "absent/frame.png")), /Refusing output/);
assert.throws(() => assertOutsideGit(resolve(WORKTREE, "absent/frame.png")), /Refusing output/);
await assert.rejects(outputPath("../escape.png"), /inside PROBE_OUT/);
const link = resolve(fixture, "repo-link");
await symlink(WORKTREE, link, process.platform === "win32" ? "junction" : "dir");
try { await assert.rejects(outputPath(resolve(link, "absent/frame.png")), /Refusing output/); }
finally { await unlink(link); }
const dangling = resolve(fixture, "dangling-repo-link");
await symlink(resolve(WORKTREE, "absent-probe-directory"), dangling, process.platform === "win32" ? "junction" : "dir");
try { await assert.rejects(outputPath(resolve(dangling, "frame.png")), /Refusing output/); }
finally { await unlink(dangling); }
const rejected = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(new URL("./lib.mjs", import.meta.url).href)})`], { cwd: WORKTREE, env: { ...process.env, PROBE_OUT: resolve(WORKTREE, "absent-probe-output") }, windowsHide: true, encoding: "utf8" });
assert.notEqual(rejected.status, 0);
assert.match(rejected.stderr, /Refusing output inside git working tree/);
console.log("PASS output guards: enclosing and unrelated git trees, junction, dangling link, traversal, import refusal");

const variants = {};
for (const name of ["base", "new"]) {
  variants[name] = resolve(fixture, name);
  await mkdir(variants[name]);
  await writeFile(resolve(variants[name], "index.html"), `<title>${name}</title>`, "utf8");
}
const saved = { ...SRV };
let server, browser;
try {
  server = await startServer({ variants });
  for (const name of Object.keys(variants)) assert.equal(await (await fetch(`${ORIGIN}/${name}/`)).text(), `<title>${name}</title>`);
  let response = await fetch(`${ORIGIN}/index.html`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await fetch(`${ORIGIN}/reports.html`)).status, 200);
  SRV.cc = "none";
  assert.equal((await fetch(`${ORIGIN}/index.html`)).headers.get("cache-control"), null);
  SRV.cc = "max-age=3600";
  SRV.cond = true;
  response = await fetch(`${ORIGIN}/index.html`);
  assert.equal(response.headers.get("cache-control"), "max-age=3600");
  assert.equal((await fetch(`${ORIGIN}/index.html`, { headers: { "if-none-match": response.headers.get("etag") } })).status, 304);
  SRV.cond = "lm";
  response = await fetch(`${ORIGIN}/index.html`);
  assert.equal(response.headers.get("etag"), null);
  assert.equal((await fetch(`${ORIGIN}/index.html`, { headers: { "if-modified-since": response.headers.get("last-modified") } })).status, 304);
  SRV.cond = "etag";
  response = await fetch(`${ORIGIN}/index.html`);
  assert.equal(response.headers.get("last-modified"), null);
  assert.equal((await fetch(`${ORIGIN}/index.html`, { headers: { "if-modified-since": new Date().toUTCString() } })).status, 200);
  SRV.cond = false;
  SRV.cc = "no-store";
  assert.equal((await fetch(`${ORIGIN}/%2e%2e%5cpackage.json`)).status, 403);
  assert.equal((await fetch(`${ORIGIN}/other.html`)).status, 200);
  const font = (await readdir(resolve(E, "fonts"))).find((name) => name.endsWith(".woff2"));
  assert.ok(font);
  const subset = /readex-pro-([\w-]+)\.woff2/.exec(font)[1];
  for (const hold of [30, { [subset]: 30 }, { afterFp: 30 }]) {
    SRV.fontHold = hold;
    if (hold.afterFp) armFp().resolve(performance.now() + performance.timeOrigin);
    assert.equal((await fetch(`${ORIGIN}/fonts/${font}`)).status, 200);
    assert.ok(SERVER_LOG.at(-1).heldMs >= 28, JSON.stringify(SERVER_LOG.at(-1)));
  }
  SRV.fontHold = null;
  SRV.scriptDelay = 30;
  assert.equal((await fetch(`${ORIGIN}/app.js`)).status, 200);
  assert.ok(SERVER_LOG.at(-1).heldMs >= 28);
  SRV.scriptDelay = 0;
  SRV.hook = (path) => path === "/forced" ? "404" : path === "/hung" ? "hang" : null;
  assert.equal((await fetch(`${ORIGIN}/forced`)).status, 404);
  SRV.hook = null;
  assert.equal(holdProof([], { arabic: 30 }).ok, false);
  assert.equal(holdProof([], {}).ok, false);
  browser = await launch();
  const { context, page, heldLog } = await newPage(browser, { motion: false, fontCache: false, fontDelayMs: holdBySubset({ [subset]: 30 }) });
  try {
    await page.goto(`${ORIGIN}/index.html?lang=ar&tuner=0`, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await introSettled(page);
    assert.equal(holdProof(heldLog, { [subset]: 30 }).ok, true, JSON.stringify(heldLog));
  } finally { await context.close(); }
  console.log("PASS server contracts: variant isolation, cache switches, 304s, traversal, three font holds, script delay, hook, route hold proof");
  let routeAccepted;
  const routeStarted = new Promise((done) => { routeAccepted = done; });
  const routeHeld = await newPage(browser, { motion: false, fontDelayMs: () => { routeAccepted(); return 60000; } });
  const navigation = routeHeld.page.goto(`${ORIGIN}/index.html?lang=ar&tuner=0`).catch(() => null);
  await routeStarted;
  const routeCloseAt = performance.now();
  await routeHeld.context.close();
  await navigation;
  assert.ok(performance.now() - routeCloseAt < 1500, "Route hold cleanup was slow");
  console.log("PASS route cleanup: context closed during a 60000ms font hold");
  let accepted;
  const pending = new Promise((done) => { accepted = done; });
  SRV.hook = (path) => { if (path === "/hung") { accepted(); return "hang"; } return null; };
  const hungRequest = fetch(`${ORIGIN}/hung`).then(() => false, () => true);
  await pending;
  if (browser) { await browser.close(); browser = null; }
  await new Promise((done, reject) => server.close((error) => error ? reject(error) : done()));
  server = null;
  assert.equal(await hungRequest, true);
  console.log("PASS shutdown: pending response and browser cleaned up");
  for (const resource of [`fonts/${font}`, "app.js"]) {
    let holdAccepted;
    const holdStarted = new Promise((done) => { holdAccepted = done; });
    const behavior = { ...saved, cc: "no-store" };
    Object.defineProperty(behavior, resource === "app.js" ? "scriptDelay" : "fontHold", { get() { holdAccepted(); return 60000; } });
    server = await startServer({ behavior });
    const heldRequest = fetch(`${ORIGIN}/${resource}`).then(() => false, () => true);
    await holdStarted;
    const closeAt = performance.now();
    await new Promise((done) => server.close(done));
    server = null;
    assert.equal(await heldRequest, true);
    assert.ok(performance.now() - closeAt < 1500, "Server hold cleanup was slow");
  }
  console.log("PASS server cleanup: cancelled 60000ms font and script holds");
  const variantRoot = resolve(fixture, "extracted");
  const variantDir = resolve(variantRoot, "configured", relative(WORKTREE, E));
  await mkdir(variantDir, { recursive: true });
  await writeFile(resolve(variantDir, "index.html"), "<title>configured</title>", "utf8");
  const configured = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import assert from 'node:assert/strict';
    import { readdir } from 'node:fs/promises';
    import { resolve } from 'node:path';
    const m = await import(${JSON.stringify(new URL("./lib.mjs", import.meta.url).href)});
    assert.equal(m.PORT, 3179);
    assert.equal(m.E, ${JSON.stringify(E)});
    assert.equal(m.OUT, ${JSON.stringify(OUT)});
    const server = await m.startServer();
    try {
      assert.equal((await fetch(m.ORIGIN+'/index.html')).status, 200);
      assert.equal((await fetch(m.ORIGIN+'/reports.html')).status, 200);
      const font = (await readdir(resolve(m.E, 'fonts'))).find(name => name.endsWith('.woff2'));
      assert.equal((await fetch(m.ORIGIN+'/fonts/'+font)).status, 200);
      assert.equal(await (await fetch(m.ORIGIN+'/configured/')).text(), '<title>configured</title>');
      console.log('PASS configured folders/port: PROBE_ECLIPSE, PROBE_OUT, PROBE_PORT=3179, PROBE_VARIANTS_ROOT; direct fonts + implicit variant');
    } finally { await new Promise(done => server.close(done)); }
  `], { cwd: fixture, env: { ...process.env, PROBE_ECLIPSE: E, PROBE_OUT: OUT, PROBE_PORT: "3179", PROBE_VARIANTS_ROOT: variantRoot }, windowsHide: true, encoding: "utf8", timeout: 10000 });
  assert.equal(configured.status, 0, configured.stderr);
  process.stdout.write(configured.stdout);
} finally {
  Object.assign(SRV, saved);
  if (browser) await browser.close();
  if (server) await new Promise((done) => server.close(done));
}
