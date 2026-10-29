// The film's words. Every string comes from FILM.COPY (timeline.js); one role and one anchor for the whole film (lower
// left, x 160, baseline 950, Readex Pro 500 at 80 px, chalk), after reference A's caption that never moves.
//   c1  two halves close on one baseline at a fixed junction, the upper from above and the lower from below (the clamp)
//   c2, c3  each word rises out of its own mask; nothing fades in, nothing slides across the frame
//   exits reverse the entrance: the words sink back into their masks, the halves part
//   holds creep 2% about the anchor (alive, never frozen; at most 0.15 px/f at the line's far end)
//   w   FITWAY, the one hero word allowed to move letter by letter: its gaps close to Eclipse's 0.12 em
const { E, clamp, prog, arriving, departing, fd } = window.MOTION;
const { COPY, COPY_SET } = window.FILM;

const ANCHOR = { x: 160, baseline: 950, size: 80 };
const RISE = arriving(E.outSoft); // vertical text snaps to whole pixels: end the rise while it still travels
const SINK = departing(E.exit);
let lines = {};

function metrics(text, size, weight = 500) {
  const c = document.createElement('canvas').getContext('2d');
  c.font = `${weight} ${size}px "Readex Pro"`;
  return c.measureText(text);
}

/** Build every copy element once, after the face has loaded. */
export function buildCopy(layer) {
  const asc = metrics('Hg', ANCHOR.size);
  const A = asc.fontBoundingBoxAscent, D = asc.fontBoundingBoxDescent;
  const lineBox = A + D;
  for (const c of COPY) {
    if (c.id === 'w') continue;
    const line = document.createElement('div');
    line.className = 'copy';
    line.dataset.text = c.id; // the layout audit measures every [data-text] box
    line.style.top = `${(ANCHOR.baseline - A).toFixed(2)}px`;
    line.style.left = `${ANCHOR.x}px`;
    line.style.height = `${lineBox.toFixed(2)}px`;
    line.style.transformOrigin = `0px ${A.toFixed(2)}px`;
    const words = c.text.split(' ');
    const groups = c.id === 'c1' ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : words; // c1: the two halves
    groups.forEach((g, i) => {
      const mask = document.createElement('span');
      mask.className = 'mask';
      const w = document.createElement('span');
      w.className = 'w';
      w.textContent = g;
      mask.append(w);
      line.append(mask);
      if (i < groups.length - 1) line.append(document.createTextNode(' '));
    });
    layer.append(line);
    lines[c.id] = { c, line, words: [...line.querySelectorAll('.w')], masks: [...line.querySelectorAll('.mask')] };
  }
}

/** Copy on frame f. */
export function renderCopy(f) {
  for (const id of Object.keys(lines)) {
    if (id === 'w') continue;
    const { c, line, words } = lines[id];
    const exitEnd = c.out + COPY_SET.exit;
    if (f < c.in || f >= exitEnd) { line.style.visibility = 'hidden'; continue; }
    line.style.visibility = 'visible';
    // the hold: a 2% creep about the anchor from resolved to the end of the exit
    const creep = 1 + 0.02 * prog(f, c.resolved, exitEnd, E.linear);
    line.style.transform = `scale(${creep.toFixed(5)})`;
    const q = prog(f, c.out, exitEnd, E.linear); // the exit's progress
    words.forEach((w, i) => {
      let y; // in % of the word's own box
      if (id === 'c1') {
        const p = prog(f, c.in, c.in + COPY_SET.clamp, (u) => u);
        const inY = (1 - RISE(p)) * 140 * (i === 0 ? -1 : 1); // the upper half from above, the lower from below (clear of the mask's room)
        const outY = SINK(q) * 150 * (i === 0 ? -1 : 1);
        y = f < c.out ? inY : outY;
      } else {
        const s = c.in + i * COPY_SET.maskStagger;
        const p = prog(f, s, s + COPY_SET.maskWord, (u) => u);
        const qi = prog(f, c.out + i * 2, exitEnd, (u) => u);
        y = f < c.out ? (1 - RISE(p)) * 140 : SINK(qi) * 150; // from below and back down, clear of the mask's descender room
      }
      w.style.transform = `translateY(${y.toFixed(3)}%)`;
    });
  }
}

/** The wordmark in the lockup: placed by the mark's lockup geometry, pushed with it, letter gaps closing (tau 14.6 f). */
export function buildWordmark(layer, LOCK) {
  const wrap = document.createElement('div');
  wrap.className = 'layer';
  wrap.id = 'wordmark-layer';
  wrap.style.transformOrigin = '960px 540px';
  const el = document.createElement('div');
  el.className = 'wordmark';
  el.dataset.text = 'w';
  el.style.fontSize = `${LOCK.size}px`;
  const m = metrics('FITWAY', LOCK.size);
  const A = m.fontBoundingBoxAscent;
  el.style.left = `${LOCK.wordX}px`;
  el.style.top = `${(LOCK.baseline - A).toFixed(2)}px`;
  const c = COPY.find((x) => x.id === 'w');
  [...c.text].forEach((ch) => { const s = document.createElement('span'); s.className = 'ltr'; s.textContent = ch; el.append(s); });
  wrap.append(el);
  layer.append(wrap);
  lines.w = { wrap, el, c, letters: [...el.querySelectorAll('.ltr')] };
}

export function renderWordmark(f, place) {
  const W = lines.w;
  if (!W) return;
  const { wrap, letters, c } = W;
  if (f < c.in) { wrap.style.visibility = 'hidden'; return; }
  wrap.style.visibility = 'visible';
  wrap.style.transform = `scale(${place.push.toFixed(5)})`;
  // the gaps close from 0.62 em to Eclipse's 0.12 em: an exponential with a 14.6 f time constant, no overshoot
  const t = Math.max(0, f - (c.in - 1));
  const extra = 0.5 * Math.exp(-t / 14.6) * (1 - prog(f, c.in + 60, c.in + 90, E.smooth)); // lands exactly on 0
  const op = prog(f, c.in - 1, c.in + 10, E.smooth);
  letters.forEach((s, i) => {
    s.style.transform = `translateX(${(i * extra * 112).toFixed(3)}px)`;
    s.style.opacity = op.toFixed(4);
  });
}

export const copyAnchor = ANCHOR;
export { fd };
