// Controls alter only a disposable served page. Measurements and analyzers are unchanged.
export async function plantPage(page, check) {
  if (!check || check === 'quality' || check === 'guard') return;
  await page.evaluate(check => {
    const E = window.__eclipse, ch = E.chart, tip = document.querySelector('#tip');
    const originalSelect = ch.select.bind(ch), originalStep = E.motion.step.bind(E.motion);
    const V = window.__vt, originalTick = V?.tick.bind(V);
    if (check === 'rest') ch.select = key => {
      const result = originalSelect(key);
      if (!tip.hidden) {
        const dot = document.querySelector('#end-dot');
        tip.style.left = `${Number(dot.getAttribute('cx')) - 5}px`;
        tip.style.top = `${Number(dot.getAttribute('cy')) - 5}px`;
      }
      return result;
    };
    if (check === 'readings') E.motion.step = () => { const r = originalStep(); E.motion.settle(); return r; };
    if (check === 'hover' || check === 'gap') {
      let pending = null;
      ch.select = key => {
        const from = ch.selected, wasVisible = !tip.hidden, l = tip.style.left, t = tip.style.top;
        const r = originalSelect(key);
        if (wasVisible && from !== key && (check === 'hover' || from === 'gap' || key === 'gap')) {
          pending = { l, t, frames: 0 }; tip.style.left = l; tip.style.top = t;
        }
        return r;
      };
      V.tick = async ms => {
        await originalTick(ms);
        if (!pending) return;
        if (++pending.frames < 3) { tip.style.left = pending.l; tip.style.top = pending.t; }
        else { E.motion.settle(); pending = null; }
      };
    }
    if (check === 'width') {
      let remaining = 0, applied = false;
      E.motion.step = () => {
        const before = ch.tipWidth.widthPx, r = originalStep();
        if (before !== ch.tipWidth.widthPx) remaining = 6;
        return r;
      };
      V.tick = async ms => {
        if (applied) { tip.style.left = `${parseFloat(tip.style.left) - 2}px`; applied = false; }
        await originalTick(ms);
        if (remaining-- > 0 && !tip.hidden) { tip.style.left = `${parseFloat(tip.style.left) + 2}px`; applied = true; }
      };
    }
    if (check === 'nohist') {
      if (E.state === 'nohistory') setTimeout(() => { throw new Error('Planted no-history page error'); }, 0);
      const wrong = () => { if (!tip.hidden) tip.textContent = 'PLANTED WRONG STOP'; };
      document.querySelector('#plot-hit').addEventListener('pointermove', wrong);
      document.querySelector('#plot-hit').addEventListener('keydown', wrong);
    }
    if (check === 'layout') {
      const measure = () => {
        const b = tip.getBoundingClientRect(), c = document.querySelector('#sel .sg-core')?.getBoundingClientRect();
        if (!c) return null;
        const x = c.left + c.width / 2, y = c.top + c.height / 2;
        const distance = Math.hypot(Math.max(b.left - x, 0, x - b.right), Math.max(b.top - y, 0, y - b.bottom));
        return { distance, radius: c.width / 2, clearance: distance - c.width / 2 - 2 };
      };
      ch.clear(); originalSelect('h0'); const before = measure();
      ch.select = key => {
        const r = originalSelect(key), c = document.querySelector('#sel .sg-core')?.getBoundingClientRect();
        if (c && !tip.hidden) {
          const pr = document.querySelector('#plot').getBoundingClientRect(), b = tip.getBoundingClientRect();
          tip.style.left = `${c.left + c.width / 2 - pr.left - b.width / 2}px`;
          tip.style.top = `${c.top + c.height / 2 - pr.top - b.height / 2}px`;
        }
        return r;
      };
      ch.clear(); ch.select('h0'); const after = measure(); ch.clear();
      window.__plantEvidence = { before, after, detected: before?.clearance > 0 && after?.clearance < 0 };
    }
  }, check);
}
