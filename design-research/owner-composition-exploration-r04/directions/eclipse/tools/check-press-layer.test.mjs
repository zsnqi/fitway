// No files are mutated: the planted defect is a source copy with one layer removed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inspectCss, checkFolder } from "./check-press-layer.mjs";
import { fileURLToPath } from "node:url";

const folder = fileURLToPath(new URL("../", import.meta.url));
assert.deepEqual(checkFolder(folder), []);
const source = readFileSync(new URL("../activity.css", import.meta.url), "utf8");
const layer = ", inset 0 0 0 100vmax var(--press-light, transparent)";
assert.ok(source.includes(layer));
const planted = source.replace(layer, "");
const findings = inspectCss(planted, "planted/activity.css");
assert.equal(findings.length, 1);
assert.match(findings[0], /^planted\/activity\.css:\d+: box-shadow/);
console.log(`PLANTED-DEFECT PASS: ${findings[0]}`);

for (const selector of [".rbtn:hover", "[data-press]", '[data-press="chalk"]:active', ":is(.other, .seg-b[aria-pressed=true])", ":where(.ac-sel):hover", ".dp-day .dp-n"]) {
  assert.equal(inspectCss(`${selector} { box-shadow: 0 0 2px red; }`).length, 1, selector);
  assert.equal(inspectCss(`${selector} { box-shadow: inset 0 0 0 100vmax var(--press-light), 0 0 2px red; }`).length, 1, `${selector}: layer must be last`);
  assert.equal(inspectCss(`${selector} { box-shadow: 0 0 2px red, inset 0 0 0 100vmax var(--press-light, transparent); }`).length, 0, selector);
}
for (const selector of [".rbtn .other", ".other:not(.rbtn)", ".other:has(.rbtn)", ".rbtn::before", ".seg-b + .other", ".dl-sort.is-disabled:hover", '.rbtn[aria-disabled="true"]']) {
  assert.equal(inspectCss(`${selector} { box-shadow: 0 0 2px red; }`).length, 0, selector);
}
assert.deepEqual(inspectCss("@media (forced-colors: active) { .rbtn { box-shadow: none; } }"), []);
assert.equal(inspectCss('@import url("other.css"); .rbtn { box-shadow: none; }').length, 1);
assert.equal(inspectCss('@charset "UTF-8"; @layer base, screen; .rbtn { BOX-SHADOW: none; }').length, 1);
assert.equal(inspectCss("/* .rbtn { box-shadow: red; } */\n@media (hover: hover) { .rbtn {\n box-shadow: none; } }", "nested.css")[0].startsWith("nested.css:3:"), true);
console.log("PRESS-LAYER TEST PASS: folder, planted omission, subjects, layer order, comments and media");
