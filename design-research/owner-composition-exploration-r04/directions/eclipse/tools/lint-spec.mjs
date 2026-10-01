// Spec lint for DESIGN-SPEC.md (first written for run owner_spec_r04_s12): from §1 to §7, every table row carries exactly
// one label (R, C, K, P) in its "L" column, and every table with measured values has a source column. Prints counts and
// problems. Run from anywhere: node <eclipse>/tools/lint-spec.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const text = readFileSync(fileURLToPath(new URL("../DESIGN-SPEC.md", import.meta.url)), "utf8");
const lines = text.split(/\r?\n/);
let section = 0, header = null, lcol = -1, srcCol = -1;
const counts = { R: 0, C: 0, K: 0, P: 0 }, problems = [], ids = new Map();
let rows = 0, noSrc = [];
for (const [i, line] of lines.entries()) {
  const m = /^## (\d)\./.exec(line);
  if (m) { section = +m[1]; header = null; continue; }
  if (!line.startsWith("|")) { header = null; continue; }
  const cells = line.split("|").slice(1, -1).map((c) => c.trim());
  if (!header) { header = cells; lcol = cells.indexOf("L"); srcCol = cells.findIndex((c) => /^Src|Designed on/.test(c)); continue; }
  if (/^-+$/.test(cells[0].replace(/ /g, "")) || cells.every((c) => /^-+$/.test(c))) continue;
  if (section < 1 || section > 7) continue;
  rows++;
  if (lcol < 0) { problems.push(`line ${i + 1}: table without an L column`); continue; }
  const l = cells[lcol];
  if (!/^[RCKP]$/.test(l)) problems.push(`line ${i + 1}: label "${l}"`);
  else counts[l]++;
  const id = cells[0];
  if (ids.has(id) && /^[A-Z]{2,4}-/.test(id)) problems.push(`line ${i + 1}: duplicate id ${id} (also line ${ids.get(id)})`);
  ids.set(id, i + 1);
  if (srcCol >= 0 && !cells[srcCol]) noSrc.push(`${id} (line ${i + 1})`);
}
// Every id cited anywhere exists.
const cited = new Set(text.match(/\b(?:K-\d{2}|[A-Z]{3}-\d{1,2})\b/g));
const missing = [...cited].filter((c) => !ids.has(c) && !/^(SPC-7|TYP-3)$/.test(c) === false ? false : !ids.has(c));
console.log(JSON.stringify({ rows, counts, problems, emptySource: noSrc, citedButUndefined: [...cited].filter((c) => !ids.has(c)) }, null, 1));
