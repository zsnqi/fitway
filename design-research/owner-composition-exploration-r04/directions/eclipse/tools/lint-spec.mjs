// Spec lint for DESIGN-SPEC.md and its parts (first written for run owner_spec_r04_s12): from §1 to §7, every table row carries exactly
// one label (R, C, K, P) in its "L" column, and every table with measured values has a source column. Prints counts and
// problems; a problem is named by its part and line. Run from anywhere: node <eclipse>/tools/lint-spec.mjs
import { readIndexHead, readParts, specs } from "./spec-parts.mjs";
// The spec is DESIGN-SPEC.md's own lines before its parts list, then each part's moved text, in order; each line keeps its place.
const located = [];
const add = (file, source, first) => source.split(/\r?\n/).slice(0, -1).forEach((line, i) => located.push({ line, at: `${file} line ${i + first}` }));
add(specs.design.file, readIndexHead("design"), 1);
for (const { path, line, text } of readParts("design")) add(path, text, line);
const lines = located.map(({ line }) => line);
const text = lines.join("\n");
let section = 0, header = null, lcol = -1, srcCol = -1;
const counts = { R: 0, C: 0, K: 0, P: 0 }, problems = [], ids = new Map();
let rows = 0, noSrc = [];
for (const [i, line] of lines.entries()) {
  const at = located[i].at;
  const m = /^## (\d)\./.exec(line);
  if (m) { section = +m[1]; header = null; continue; }
  if (!line.startsWith("|")) { header = null; continue; }
  const cells = line.split("|").slice(1, -1).map((c) => c.trim());
  if (!header) { header = cells; lcol = cells.indexOf("L"); srcCol = cells.findIndex((c) => /^Src|Designed on/.test(c)); continue; }
  if (/^-+$/.test(cells[0].replace(/ /g, "")) || cells.every((c) => /^-+$/.test(c))) continue;
  if (section < 1 || section > 7) continue;
  rows++;
  if (lcol < 0) { problems.push(`${at}: table without an L column`); continue; }
  const l = cells[lcol];
  if (!/^[RCKP]$/.test(l)) problems.push(`${at}: label "${l}"`);
  else counts[l]++;
  const id = cells[0];
  if (ids.has(id) && /^[A-Z]{2,4}-/.test(id)) problems.push(`${at}: duplicate id ${id} (also ${ids.get(id)})`);
  ids.set(id, at);
  if (srcCol >= 0 && !cells[srcCol]) noSrc.push(`${id} (${at})`);
}
// Every id cited anywhere exists.
const cited = new Set(text.match(/\b(?:K-\d{2}|[A-Z]{3}-\d{1,2})\b/g));
const missing = [...cited].filter((c) => !ids.has(c) && !/^(SPC-7|TYP-3)$/.test(c) === false ? false : !ids.has(c));
console.log(JSON.stringify({ rows, counts, problems, emptySource: noSrc, citedButUndefined: [...cited].filter((c) => !ids.has(c)) }, null, 1));
