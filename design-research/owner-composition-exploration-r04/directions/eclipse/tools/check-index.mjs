// Index regression checks use disposable source/index files outside all Git trees.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { outputPath } from "./probes/lib.mjs";

const source = await readFile(new URL("./build-index.mjs", import.meta.url), "utf8");
const scriptEntries = runInNewContext(`${source.slice(source.indexOf("const identifier"), source.indexOf("\nfunction shortTitle"))}\nscriptEntries;`);
const fixture = `(() => {
// let comment = () => {};
const literal = "var fake = function() {}", pattern = /let fake = () => {}/;
function declared() { const nested = () => {}; }
class Example { method() {} }
const constant = () => {};
let mutable = () => {}, expression = function inner() {}, asyncArrow = async x => x;
var generator = function* named() {}, asyncExpression = async function() {};
let parenthesized = (async () => {}), immediate = (() => {})(), number = 1;
const factoryResult = function factory() {}();
})()\n`;
const entries = scriptEntries(fixture);
assert.deepEqual(Array.from(entries, (entry) => entry.name), ["declared", "Example", "constant", "mutable", "expression", "asyncArrow", "generator", "asyncExpression", "parenthesized"]);
assert.equal(entries.find((entry) => entry.name === "mutable").line, 7);
assert.equal(entries.find((entry) => entry.name === "generator").line, 8);
assert.equal(entries.find((entry) => entry.name === "constant").title, "function constant");
assert.equal(entries.find((entry) => entry.name === "mutable").title, "function binding (let)");
assert.equal(entries.find((entry) => entry.name === "generator").title, "function binding (var)");
console.log("PASS index bindings: const/let/var, comma declarations, async/generator/parenthesized functions, source lines; nested/literal/IIFE-result controls excluded");

const root = await mkdtemp(await outputPath("index-fixture-"));
const runner = resolve(root, "tools/build-index.mjs");
await mkdir(resolve(root, "tools"), { recursive: true });
await writeFile(runner, source, "utf8");
// The fixture holds every script the generator reads, taken from its own list, so a file added there never breaks this check.
const filesLine = source.slice(source.indexOf("const files"), source.indexOf("\n", source.indexOf("const files")));
const generatorFiles = runInNewContext(`${filesLine}\nfiles;`);
const scripts = Array.from(generatorFiles).filter((name) => name.endsWith(".js"));
assert.ok(scripts.includes("access.js") && scripts.at(-1) === "tuner.js", `unexpected generator file list: ${scripts.join(", ")}`);
for (const name of scripts) await writeFile(resolve(root, name), fixture, "utf8");
await writeFile(resolve(root, "DESIGN-SPEC.md"), "# Spec\n| STA-10 | K | Short title |\n```\n# Ignored\n```\n", "utf8");
const run = (...args) => spawnSync(process.execPath, [runner, ...args], { cwd: root, windowsHide: true, encoding: "utf8", timeout: 10000 });
let result = run("--check");
assert.equal(result.status, 1);
assert.match(result.stderr, /INDEX.md missing; first stale entry/);
result = run(); assert.equal(result.status, 0, result.stderr);
const first = await readFile(resolve(root, "INDEX.md"));
result = run(); assert.equal(result.status, 0, result.stderr);
assert.deepEqual(await readFile(resolve(root, "INDEX.md")), first);
assert.equal(first.includes(13), false, "Index must use LF");
assert.equal(first.subarray(0, 3).equals(Buffer.from([239, 187, 191])), false, "No BOM");
result = run("--check"); assert.equal(result.status, 0, result.stderr);
await writeFile(resolve(root, "tuner.js"), `${fixture}let freshBinding = () => {};\n`, "utf8");
result = run("--check"); assert.equal(result.status, 1);
assert.match(result.stderr, /INDEX.md stale.*first stale entry: expected - tuner.js:12.*freshBinding/);
console.log(`PASS index freshness: missing/stale exit=1 with first stale entry; current exit=0; byte-identical LF/no-BOM regeneration; ${result.stderr.trim()}`);
