// From the installed ui-forensics skill, scripts/web/_sheet.mjs.
// A browser-built contact sheet: an HTML grid of images with captions (Arabic and RTL shaped by the browser), row
// labels (before / after) and column headers (states), screenshotted to PNG. Used by sheet.mjs and motion.mjs.
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" };
const FONT_STACK = `system-ui, "Segoe UI", "Noto Sans", "Noto Sans Arabic", "Noto Naskh Arabic", "Geeza Pro", Tahoma, Arial, sans-serif`;
const text = (s) => escapeHtml(s ?? "").replace(/\n/g, "<br>");

// spec: { title, notes, dir: "ltr"|"rtl", lang, columns: [..headers], rows: [{ label, cells: [cell] }] }
//   or: { title, cols: n, cells: [cell] }.  cell: { img: path | buf: Buffer, caption, zoom, width }
// options: cellWidth (px, images wider are scaled down; the scale is printed under each image), zoom (nearest-neighbour
// enlargement for tiny crops), background, baseDir (for relative image paths).
export async function renderSheet(browser, spec, outPath, { baseDir = process.cwd(), htmlPath = null } = {}) {
  const rows = spec.rows ? spec.rows : chunk(spec.cells || [], Math.max(1, spec.cols || 3)).map((cells) => ({ cells }));
  const nCols = Math.max(1, ...rows.map((r) => r.cells.length), (spec.columns || []).length);
  const hasLabels = rows.some((r) => r.label);
  const missing = [];
  const cellHtml = async (c) => {
    if (!c) return `<div class="cell empty"></div>`;
    let src = null;
    if (c.buf) src = `data:image/png;base64,${Buffer.from(c.buf).toString("base64")}`;
    else if (c.img) {
      const p = path.resolve(baseDir, c.img);
      if (existsSync(p)) src = `data:${MIME[path.extname(p).toLowerCase()] || "image/png"};base64,${(await readFile(p)).toString("base64")}`;
      else missing.push(c.img);
    }
    const zoom = c.zoom || spec.zoom || 1, width = c.width || spec.cellWidth || null;
    const style = [width ? `width:${width}px` : "", zoom !== 1 ? `zoom:${zoom}` : "", zoom > 1 || spec.pixelated ? "image-rendering:pixelated" : ""].filter(Boolean).join(";");
    const img = src ? `<img src="${src}" style="${style}" data-zoom="${zoom}">` : `<div class="missing">missing image<br>${text(c.img || "")}</div>`;
    return `<figure class="cell">${img}<div class="under"><div class="scale"></div>${c.caption ? `<figcaption dir="auto">${text(c.caption)}</figcaption>` : ""}</div></figure>`;
  };
  let grid = "";
  if (spec.columns && spec.columns.length) grid += (hasLabels ? `<div class="corner"></div>` : "") + spec.columns.map((h) => `<div class="colhead" dir="auto">${text(h)}</div>`).join("") + `<div class="pad"></div>`.repeat(nCols - spec.columns.length);
  for (const r of rows) {
    if (hasLabels) grid += `<div class="rowhead" dir="auto">${text(r.label || "")}</div>`;
    for (let i = 0; i < nCols; i++) grid += await cellHtml(r.cells[i]);
  }
  const html = `<!doctype html><html lang="${escapeHtml(spec.lang || "en")}" dir="${spec.dir === "rtl" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 20px; background: ${spec.background || "#1b1b1b"}; color: #e8e8e8; font: 15px/1.4 ${FONT_STACK}; width: max-content; }
  h1 { margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #fff; max-width: 1600px; unicode-bidi: plaintext; }
  .notes { margin: 0 0 14px; color: #b8b8b8; max-width: 1600px; white-space: pre-wrap; unicode-bidi: plaintext; }
  .grid { display: grid; grid-template-columns: ${hasLabels ? "max-content " : ""}repeat(${nCols}, max-content); gap: 14px 14px; align-items: start; }
  .colhead { font-weight: 600; color: #fff; padding-bottom: 2px; border-bottom: 1px solid #555; unicode-bidi: plaintext; }
  .rowhead { font-weight: 600; color: #fff; writing-mode: horizontal-tb; max-width: 160px; padding-top: 4px; unicode-bidi: plaintext; }
  img { display: block; outline: 1px solid #555; background: repeating-conic-gradient(#2a2a2a 0 25%, #333 0 50%) 0 0 / 16px 16px; }
  .scale { font-size: 12px; color: #9a9a9a; margin-top: 3px; direction: ltr; text-align: start; }
  figure { margin: 0; width: max-content; min-width: ${spec.captionMinWidth || 160}px; }
  .under { width: 0; min-width: 100%; }
  figcaption { margin-top: 3px; white-space: normal; overflow-wrap: anywhere; unicode-bidi: plaintext; }
  .missing { width: 200px; height: 80px; display: grid; place-items: center; color: #ff6b6b; border: 1px dashed #ff6b6b; font-size: 12px; text-align: center; }
  </style></head><body><h1 dir="auto">${text(spec.title || "Contact sheet")}</h1>${spec.notes ? `<p class="notes" dir="auto">${text(spec.notes)}</p>` : ""}<div class="grid">${grid}</div>
</body></html>`;
  const context = await browser.newContext({ viewport: { width: 1200, height: 200 }, deviceScaleFactor: 1, colorScheme: "dark" });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => document.fonts.ready));
  await page.evaluate(() => document.querySelectorAll("img").forEach((img) => { const z = Number(img.dataset.zoom) || 1; const shown = img.getBoundingClientRect().width; const s = img.naturalWidth ? shown / img.naturalWidth : 0; img.nextElementSibling.firstElementChild.textContent = `${img.naturalWidth} x ${img.naturalHeight} px, shown at ${Math.round(s * 1000) / 1000}x`; }));
  const size = await page.evaluate(() => { const r = document.body.getBoundingClientRect(); return { width: Math.max(200, Math.ceil(r.right)), height: Math.max(100, Math.ceil(r.bottom)) }; });
  const checks = await page.evaluate(() => [...document.querySelectorAll("figcaption, .colhead, .rowhead, h1")].filter((e) => /[֐-ࣿ]/.test(e.textContent)).map((e) => {
    // RTL evidence for captions holding Arabic or Hebrew: the resolved direction, and the visual order of the first
    // and last strong RTL characters (the first must lie to the right of the last when they share a line).
    const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); let n, first = null, last = null;
    while ((n = walker.nextNode())) for (let i = 0; i < n.data.length; i++) if (/[֐-ࣿ]/.test(n.data[i])) { if (!first) first = [n, i]; last = [n, i]; }
    const rectOf = ([node, i]) => { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 1); return r.getBoundingClientRect(); };
    const a = rectOf(first), b = rectOf(last);
    return { text: e.textContent.trim().slice(0, 60), direction: getComputedStyle(e).direction, firstRightOfLast: Math.abs(a.top - b.top) < 2 ? a.left > b.left : null };
  }));
  if (htmlPath) { const { writeFile } = await import("node:fs/promises"); await writeFile(htmlPath, html); }
  await page.setViewportSize({ width: Math.min(size.width, 16000), height: Math.min(size.height, 16000) });
  await page.screenshot({ path: outPath, fullPage: true });
  await context.close();
  return { out: outPath, width: size.width, height: size.height, rows: rows.length, cols: nCols, missing, rtlChecks: checks };
}
function chunk(a, n) { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; }
