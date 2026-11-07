// Run from anywhere: node <eclipse>/tools/check-press-layer.mjs [concept-folder]
// A control's own shadow lists the press layer last. Forced colours suppress it.
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const classes = new Set("rbtn btn band-btn hbadge hbtn icon-btn seg-b wk-b switch sort ac-sel dl-sort ac-dates ac-find rail-item tb-item fw-mi rec-a acc-all dp-day dp-n skip tile tb-tile cx-btn cx-icon-btn cx-seg-b cx-switch cx-sort cx-ri cx-tile cx-skip".split(" "));

// Split only outside selector functions, attributes and quoted values.
function split(text, separator) {
  let depth = 0, quote = "", start = 0;
  const parts = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "\\") { i++; continue; }
    if (quote) { if (c === quote) quote = ""; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (!depth && separator.test(c)) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start));
  return parts.filter((p) => p.trim());
}

function pressSubject(selector) {
  // Expand :is/:where, but discard :not/:has: those name other/absent elements.
  const match = /:(is|where|not|has)\(/.exec(selector);
  if (match) {
    const start = match.index + match[0].length;
    let depth = 1, end = start;
    for (; end < selector.length && depth; end++) {
      if (selector[end] === "(") depth++;
      if (selector[end] === ")") depth--;
    }
    const choices = /^(is|where)$/.test(match[1]) ? split(selector.slice(start, end - 1), /,/) : [""];
    return choices.some((choice) => pressSubject(selector.slice(0, match.index) + choice + selector.slice(end)));
  }
  const subject = split(selector, /[\s>+~]/).at(-1) || "";
  if (subject.includes("::")) return false;
  // These states are explicitly outside the press contract; their shadow must stay unlit.
  if (/:disabled\b|\.(?:is-disabled|is-off|is-still)\b|\[aria-disabled\s*=\s*["']?true["']?\]/.test(subject)) return false;
  return /\[data-press(?:\s|[=\]])/.test(subject) || [...subject.matchAll(/\.([\w-]+)/g)].some((m) => classes.has(m[1]));
}

export function inspectCss(source, file = "style.css") {
  // Blank comments without changing offsets, so diagnostics retain source lines.
  const css = source.replace(/\/\*[\s\S]*?\*\//g, (s) => s.replace(/[^\r\n]/g, " "));
  const findings = [];
  function blocks(start, end, forced = false, keyframes = false) {
    let cursor = start;
    while (cursor < end) {
      const open = css.indexOf("{", cursor);
      if (open < 0 || open >= end) return;
      // Semicolon at-rules (@import, @charset, @layer ordering) have no block.
      const header = (split(css.slice(cursor, open), /;/).at(-1) || "").trim();
      let close = open + 1, depth = 1, quote = "";
      for (; close < end && depth; close++) {
        const c = css[close];
        if (c === "\\") { close++; continue; }
        if (quote) { if (c === quote) quote = ""; continue; }
        if (c === '"' || c === "'") { quote = c; continue; }
        if (c === "{") depth++;
        if (c === "}") depth--;
      }
      if (header.startsWith("@")) {
        blocks(open + 1, close - 1, forced || /forced-colors\s*:\s*active/.test(header), keyframes || /keyframes\b/.test(header));
      } else if (!forced && !keyframes && split(header, /,/).some(pressSubject)) {
        const body = css.slice(open + 1, close - 1);
        for (const declaration of body.matchAll(/(?:^|;)\s*box-shadow\s*:\s*([^;{}]+)/gi)) {
          const value = declaration[1].replace(/\s*!important\s*$/, "").trim();
          // Exact target reset: a chosen day fades its whole shadow back to none.
          const dayReset = header === ":where(.dp-day.is-end .dp-n)" && value === "none";
          const layers = split(value, /,/);
          if (!dayReset && !(/\binset\b/.test(layers.at(-1) || "") && /\bvar\(\s*--press-light\s*(?:,|\))/.test(layers.at(-1) || ""))) {
            const offset = open + 1 + declaration.index + declaration[0].toLowerCase().indexOf("box-shadow");
            findings.push(`${file}:${css.slice(0, offset).split("\n").length}: box-shadow must list the --press-light inset layer last (${header})`);
          }
        }
      }
      cursor = close;
    }
  }
  blocks(0, css.length);
  return findings;
}

export function checkFolder(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) return checkFolder(path);
    return entry.name.endsWith(".css") ? inspectCss(readFileSync(path, "utf8"), path) : [];
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const folder = resolve(process.argv[2] || fileURLToPath(new URL("../", import.meta.url)));
  const findings = checkFolder(folder);
  for (const finding of findings) console.error(finding);
  console.log(`PRESS-LAYER ${findings.length ? "FAIL" : "PASS"}: ${findings.length} omissions`);
  process.exitCode = findings.length ? 1 : 0;
}
