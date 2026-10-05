/* Eclipse motion: the interaction motion every Owner page shares (DECISIONS item 36, 2026-10-05).
 *
 * Every page loads this file before its own script and takes its interaction motion from here, so the screens still to
 * come (Settings, Operations, Monitoring) take the same. It moves only what the owner's own action changes, with three
 * verbs the pages already use:
 *   uncover  a surface opens from the edge it belongs to, and its words are uncovered by the moving edge, never faded
 *            (the rail's names, MOT-8): a dialog unfolds from its title, a popover from its control, a sheet slides up
 *            from the screen's bottom edge; a dialog whose content changes settles its edges around the new content;
 *   roll     a word that replaces a word rolls up through its own line, as changed digits do (MOT-2): a button's
 *            label, Working, Retry, Close, Copied;
 *   draw     a done mark draws its stroke, as the intro draws the line (MOT-10), and the words beside it rise into
 *            their line, as the intro's answers do.
 * No glyph ever changes opacity (MOT-1): only a scrim and a shadow fade. Nothing here plays on load. With
 * prefers-reduced-motion, ?motion=off or a page's own switch (Daily's tuner) every change is instant and ends exactly
 * where the movement would. Focus and announcements never wait for a movement: a dialog that closes is closed at once
 * (its picture leaves as an inert copy), and a done line's words are in place for assistive technology from the start.
 * At rest nothing this file added remains: no inline style, attribute or element.
 *
 * Built on the Web Animations API, from transforms, clip-path, stroke-dashoffset and the opacity of surfaces only, so
 * each movement maps onto CSS transitions on Base UI's data-starting-style / data-ending-style in production (Base UI
 * keeps a leaving popup mounted, so the exit copy is not needed there); a dialog's settling and the page's blocks making
 * room (layout animations), the label roll and the done mark need more than a transition (README "Motion", 12). */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const URL_OFF = params.get("motion") === "off";
  const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
  let pageGate = () => true;
  const on = () => !URL_OFF && !mqReduce.matches && pageGate();

  /* The page's curves (README "Motion"): arrive is MOT-8's opening (small surfaces: a popover); settle a calmer
   * deceleration for a surface that uncovers a lot (a dialog unfolding, a panel settling: a quarter of the way at
   * 33 ms, three quarters at 100 ms); leave MOT-8's closing; roll MOT-2's; sheet the long slide of a bottom sheet;
   * draw a pen's stroke (slow in, slow out). */
  const EASE = {
    arrive: "cubic-bezier(0.22, 1, 0.36, 1)",
    settle: "cubic-bezier(0.3, 0.75, 0.2, 1)",
    leave: "cubic-bezier(0.4, 0, 0.2, 1)",
    roll: "cubic-bezier(0.25, 1, 0.5, 1)",
    sheet: "cubic-bezier(0.32, 0.72, 0, 1)",
    draw: "cubic-bezier(0.65, 0, 0.35, 1)",
  };
  const T = {
    dlgIn: 340, dlgOut: 220, dlgRise: 12, dlgSink: 8,  // a dialog from 721 px: unfolds from its title, folds back
    sheetIn: 340, sheetOut: 240,                        // a bottom sheet at 720 px and below
    popIn: 200, popOut: 140, popDrop: 6,                // the status's details and the phone's menu
    roll: 280,                                          // a word that replaces a word (as digits roll, MOT-2)
    reflowMin: 300, reflowMax: 420,                     // a dialog's edges settling around changed content
    ring: 380, check: 260, checkAt: 260, rise: 300, riseAt: 140,  // the done mark and its words (the export's done)
    doneAfterReflow: 140,                               // ...once its dialog has mostly settled
    cutBy: 0.9,                                         // a block cut away is gone at 90% of the settling (variant 2)
    doneWithSettle: { ringEase: EASE.settle, riseAt: 80, checkAt: 200 },  // the done mark with the settling (variant 1)
    lineCheck: 260, lineCheckAt: 80, lineRise: 300,     // a done line on the page
    lineAfterClose: 150,                                // ...which waits until its dialog's scrim has mostly gone
    lineAfterHold: 100,                                 // ...or after a held change, once the rows below mostly made room
  };

  /* ---- bookkeeping. Every animation goes through anim(), so a review can freeze them on their first frame and seek
   * through them (the capture's filmstrips), and each running movement is kept under a key (the element it belongs
   * to) so it can be continued or finished. */
  const cap = { freeze: false, frozen: [] };
  function anim(el, frames, opts) {
    const a = el.animate(frames, opts);
    if (cap.freeze) { a.pause(); a.currentTime = 0; cap.frozen.push(a); }
    return a;
  }
  const runs = new Map();                 // key -> { anims, end }
  function own(key, anims, end) {
    const run = { anims, end };
    runs.set(key, run);
    Promise.all(anims.map((a) => a.finished)).then(() => { if (runs.get(key) === run) finish(key); }).catch(() => {});
    return run;
  }
  function finish(key) {
    const run = key && runs.get(key);
    if (!run) return;
    runs.delete(key);
    run.anims.forEach((a) => a.cancel());
    if (run.end) run.end();
  }
  // How far through its time a movement is (0 to 1), from its longest animation.
  const progressOf = (key) => {
    const run = runs.get(key);
    if (!run) return 1;
    return Math.max(0, Math.min(1, ...run.anims.map((a) => a.effect.getComputedTiming().progress ?? 1)));
  };
  const px = (n) => `${Math.round(n * 100) / 100}px`;
  const visible = (el) => Boolean(el && !el.hidden && !el.closest("[hidden]") && el.getClientRects().length);
  const panelOf = (dlg) => [...dlg.querySelectorAll(":scope > .dlg-panel")].find(visible) || null;
  const isSheet = () => matchMedia("(max-width: 720px)").matches;
  // A surface's corners as clip-path's "round" (a sheet's are rounded at the top only).
  const roundOf = (el) => {
    const cs = getComputedStyle(el);
    return `round ${cs.borderTopLeftRadius} ${cs.borderTopRightRadius} ${cs.borderBottomRightRadius} ${cs.borderBottomLeftRadius}`;
  };
  // Where a moving surface is now: its transform and clip.
  const pose = (el) => {
    const cs = getComputedStyle(el);
    return { transform: cs.transform === "none" ? "translateY(0px)" : cs.transform, clipPath: cs.clipPath === "none" ? null : cs.clipPath };
  };
  // An inert, unseen copy (a "ghost") that carries a closing surface's picture while the real one is already closed:
  // focus, the page and assistive technology move on at once. Ids stay, so the same rules draw it, and it comes after
  // the real element, so every lookup still finds the real one. Typed values are copied, never a password's; a secret
  // (data-m-secret) keeps its box and loses its text, so it never comes back to the page.
  function ghostOf(el) {
    // A movement still running inside (a label rolling, a done mark drawing) ends first, so the copy is a still picture.
    for (const k of [...runs.keys()]) if (k instanceof Element && k !== el && el.contains(k)) finish(k);
    const g = el.cloneNode(true);
    g.classList.add("m-ghost");
    g.setAttribute("aria-hidden", "true");
    g.inert = true;
    g.removeAttribute("hidden");
    const src = el.querySelectorAll("input, textarea"), dst = g.querySelectorAll("input, textarea");
    src.forEach((s, i) => { if (dst[i] && s.type !== "password" && !/password/.test(s.autocomplete) && !s.closest("[data-m-secret]")) dst[i].value = s.value; });
    const sec = el.querySelectorAll("[data-m-secret]"), gs = g.querySelectorAll("[data-m-secret]");
    sec.forEach((s, i) => {
      if (!gs[i]) return;
      const r = s.getBoundingClientRect();
      gs[i].style.width = px(r.width);
      gs[i].style.height = px(r.height);
      gs[i].textContent = "";
    });
    return g;
  }
  // A surface's shadow lies outside it, so a clip would cut it: while the surface moves, a copy of the shadow under it
  // fades and grows with it, and the surface's own shadow is off.
  function shadeFor(surface) {
    const s = document.createElement("i");
    s.className = "m-shade";
    s.setAttribute("aria-hidden", "true");
    const cs = getComputedStyle(surface);
    s.style.cssText = `left:${px(surface.offsetLeft)};top:${px(surface.offsetTop)};width:${px(surface.offsetWidth)};height:${px(surface.offsetHeight)};` +
      `border-radius:${cs.borderRadius};box-shadow:${cs.boxShadow};z-index:${cs.zIndex === "auto" ? "auto" : (+cs.zIndex || 1) - 1}`;
    surface.before(s);
    surface.classList.add("m-noshadow");
    return s;
  }

  /* ------------------------------------------------------------------ dialogs (MOT-9, DLG-1, DLG-5)
   * From 721 px a dialog unfolds from its title: its bottom edge runs down from the title's line and uncovers the body
   * and the actions in reading order, while the panel rises 12 px into place; the scrim and the panel's shadow fade
   * with it. Closing folds it back up into its title's line as it sinks 8 px, a little faster. At 720 px and below the
   * bottom sheet slides up from the screen's bottom edge and back down. A dialog closed while it opens, or opened while
   * it closes, continues from where it is. Pages call dialogOpen right after showModal (focus has already moved into
   * the dialog) and dialogClose right before close (focus moves out at once; the ghost carries the picture out). */
  const closedPose = (panel, sheet, dy) => (sheet ? { transform: "translateY(100%)" }
    : { transform: `translateY(${dy}px)`, clipPath: `inset(0px 0px 100% 0px ${roundOf(panel)})` });
  const openPose = (panel, sheet) => (sheet ? { transform: "translateY(0px)" }
    : { transform: "translateY(0px)", clipPath: `inset(0px 0px 0px 0px ${roundOf(panel)})` });
  const GHOSTS = new WeakMap();           // dlg -> its leaving copy
  const REFLOWS = new WeakMap();          // dlg -> the key of its running reflow
  function dialogOpen(dlg) {
    const panel = panelOf(dlg), scrim = dlg.querySelector(":scope > .dlg-scrim");
    finish(dlg);
    let from = null, k0 = 0;
    const ghost = GHOSTS.get(dlg);
    if (ghost) {
      // Opened again while its picture was still leaving: continue from that picture.
      const gp = panelOf(ghost);
      if (gp) { from = pose(gp); k0 = 1 - progressOf(ghost); }
      finish(ghost);
    }
    if (!on() || !panel) return;
    const sheet = isSheet();
    const dur = Math.round((sheet ? T.sheetIn : T.dlgIn) * Math.max(0.3, 1 - k0));
    const o = { duration: dur, easing: sheet ? EASE.sheet : EASE.settle };
    const start = from ? (sheet ? { transform: from.transform } : { transform: from.transform, clipPath: from.clipPath || openPose(panel, false).clipPath })
      : closedPose(panel, sheet, T.dlgRise);
    const anims = [anim(panel, [start, openPose(panel, sheet)], o)];
    if (scrim) anims.push(anim(scrim, [{ opacity: k0 }, { opacity: 1 }], o));
    let shade = null;
    if (!sheet) {
      shade = shadeFor(panel);
      anims.push(anim(shade, [{ opacity: k0, transform: `translateY(${px(T.dlgRise * (1 - k0))}) scaleY(${k0})` }, { opacity: 1, transform: "translateY(0px) scaleY(1)" }], o));
    }
    own(dlg, anims, () => { if (shade) { shade.remove(); panel.classList.remove("m-noshadow"); } });
  }
  function dialogClose(dlg, { instant = false } = {}) {
    const panel = panelOf(dlg), scrim = dlg.querySelector(":scope > .dlg-scrim");
    const opening = runs.has(dlg);
    const k0 = opening ? progressOf(dlg) : 1;
    const from = opening && panel ? pose(panel) : null;
    finish(dlg);
    finish(REFLOWS.get(dlg));
    finish(GHOSTS.get(dlg));
    if (instant || !on() || !panel || !dlg.open || k0 < 0.02) return;
    const sheet = isSheet();
    const g = ghostOf(dlg);
    g.classList.add("m-ghost-dlg");
    g.setAttribute("open", "");
    document.body.append(g);
    GHOSTS.set(dlg, g);
    const gp = panelOf(g), gs = g.querySelector(":scope > .dlg-scrim");
    if (!gp) { g.remove(); GHOSTS.delete(dlg); return; }
    const dur = Math.round((sheet ? T.sheetOut : T.dlgOut) * Math.max(0.3, k0));
    const o = { duration: dur, easing: EASE.leave, fill: "forwards" };
    const start = from ? (sheet ? { transform: from.transform } : { transform: from.transform, clipPath: from.clipPath || openPose(gp, false).clipPath })
      : openPose(gp, sheet);
    const anims = [anim(gp, [start, closedPose(gp, sheet, T.dlgSink)], o)];
    if (gs) anims.push(anim(gs, [{ opacity: k0 }, { opacity: 0 }], o));
    if (!sheet) {
      const shade = shadeFor(gp);
      anims.push(anim(shade, [{ opacity: k0, transform: `scaleY(${k0})` }, { opacity: 0, transform: `translateY(${T.dlgSink}px) scaleY(0)` }], o));
    }
    own(g, anims, () => { g.remove(); if (GHOSTS.get(dlg) === g) GHOSTS.delete(dlg); });
  }

  /* ------------------------------------------------------------------ a dialog's content changes (reflow)
   * When an open dialog's content changes (the export's progress line, its done state or its failure; an alert; a
   * field's message; the code's second step), a centred panel would jump at both edges. Instead its edges settle
   * around the new content: the panel's surface is drawn for the movement by three pieces (the top with its corners,
   * the middle, the bottom with its corners) that move with transforms only; the title stays with the top edge and the
   * actions with the bottom edge; a block that stays slides to its new place; a block that is new is uncovered as the
   * space opens; one that leaves leaves at once. pairs: [[before, after]] lets one block stand for another (the
   * export's file line, which stays the file the owner asked for). own: blocks with their own entrance (the done
   * state). The mutation runs at once: focus, text and announcements are final before anything moves.
   * cut (the export's done, variant 2 of DECISIONS item 38): { leave, into, ride }. The blocks in leave (before the
   * change) do not leave at once: an inert copy keeps their picture in place and the window's moving edges cut it away,
   * uncovering in reverse. The lower edge is the top of what follows them (into, after the change): it rises from
   * their bottom to into's top, and the blocks in ride (into's first lines, the done mark and its words) rise with it.
   * On a bottom sheet (the bottom edge still) the copy stays still and the top edge coming down cuts it away; from
   * 721 px it rides with the top edge and the rising lower edge cuts it away. */
  function reflow(dlg, mutate, { own: owned = [], pairs = [], cut = null } = {}) {
    const p0 = dlg.open ? panelOf(dlg) : null;
    if (!on() || !p0) { finish(REFLOWS.get(dlg)); mutate(); return; }
    finish(dlg);                                          // an opening ends first: its edges are where this starts
    const prevKey = REFLOWS.get(dlg);
    const surf = prevKey ? dlg.querySelector(":scope > .m-surface") : null;
    // Where things are now, as seen; a reflow still running is continued from its current picture.
    let B;
    if (surf) {
      const t = surf.querySelector(".m-top").getBoundingClientRect(), b = surf.querySelector(".m-bot").getBoundingClientRect();
      B = { top: t.top, bottom: b.bottom };
    } else { const r = p0.getBoundingClientRect(); B = { top: r.top, bottom: r.bottom }; }
    const blocksOf = (p) => {
      const list = [];
      const head = p.querySelector(":scope > .dlg-head"), body = p.querySelector(":scope > .dlg-body"), foot = p.querySelector(":scope > .dlg-foot");
      if (head) list.push({ el: head, edge: "top" });
      if (body) [...body.children].forEach((c) => list.push({ el: c, edge: "body" }));
      if (foot) [...foot.children].forEach((c) => list.push({ el: c, edge: "bottom" }));
      return list;
    };
    const scrolls = (p) => { const body = p && p.querySelector(":scope > .dlg-body"); return Boolean(body && (body.scrollHeight > body.clientHeight + 1 || body.scrollTop > 0)); };
    // A body that scrolled (a short sheet) showed only part of its blocks: one scrolled out of sight is not where it
    // starts from (it is treated as new).
    const body0 = p0.querySelector(":scope > .dlg-body"), seen0 = scrolls(p0) && body0 ? body0.getBoundingClientRect() : null;
    const inSight = (r) => !seen0 || (r.top >= seen0.top - 1 && r.bottom <= seen0.bottom + 1);
    const before = new Map();
    for (const b of blocksOf(p0)) if (visible(b.el)) { const r = b.el.getBoundingClientRect(); if (b.edge !== "body" || inSight(r)) before.set(b.el, r); }
    pairs.forEach(([a]) => { if (visible(a)) { const r = a.getBoundingClientRect(); if (inSight(r)) before.set(a, r); } });
    // Blocks cut away instead of leaving at once: their picture, taken as seen now.
    const leaving = cut ? (cut.leave || []).map((f) => (typeof f === "function" ? f() : f)).filter((el) => visible(el) && inSight(el.getBoundingClientRect()))
      .map((el) => ({ r: el.getBoundingClientRect(), g: ghostOf(el) })) : [];
    finish(prevKey);
    mutate();
    const p1 = panelOf(dlg);
    // While the panel settles, its labels change with it at once: one movement per moment (rollStack). The label
    // observer's notice for this mutation was queued by the mutation itself, so it runs before these marks come off.
    const quiet = () => { QUIET.add(p0); if (p1) QUIET.add(p1); queueMicrotask(() => { QUIET.delete(p0); if (p1) QUIET.delete(p1); }); };
    // A body that scrolls after the change (a short sheet) keeps its scroll: its change is instant.
    if (!p1 || scrolls(p1)) return;
    const A = p1.getBoundingClientRect();
    const dTop = B.top - A.top, dBot = B.bottom - A.bottom;
    // The cut's lower edge: from the leaving blocks' bottom (D0) to the top of what follows them (D1), measured before
    // anything moves; the blocks that ride with it, by where they end.
    let cutPlan = null;
    if (leaving.length) {
      const into = typeof cut.into === "function" ? cut.into() : cut.into;
      if (into && visible(into)) {
        const riders = (typeof cut.ride === "function" ? cut.ride() : cut.ride || []).filter((el) => el && visible(el));
        cutPlan = { D0: Math.max(...leaving.map((l) => l.r.bottom)), D1: into.getBoundingClientRect().top, riders, still: Math.abs(dBot) < 0.5 };
      }
    }
    const ownedEls = owned.map((o) => (typeof o === "function" ? o() : o)).filter(Boolean);
    owned = ownedEls;
    const pairOf = new Map(pairs.map(([a, b]) => [typeof b === "function" ? b() : b, a]).filter(([b]) => b));
    const moves = [];
    for (const b of blocksOf(p1)) {
      if (!visible(b.el) || owned.includes(b.el)) continue;
      const r1 = b.el.getBoundingClientRect();
      const src = pairOf.get(b.el);
      const r0 = before.get(src || b.el);
      let dx = 0, dy;
      if (r0) { dx = r0.left - r1.left; dy = r0.top - r1.top; }
      else if (b.edge === "top") dy = dTop;
      else if (b.edge === "bottom") dy = dBot;
      else { moves.push({ el: b.el, reveal: true, h: r1.height }); continue; }
      moves.push({ el: b.el, dx, dy });
    }
    // A pair's new block inside a block of its own (the file line inside the done state) slides from its pair too.
    for (const [b, a] of pairOf) {
      if (moves.some((m) => m.el === b) || !visible(b) || !before.has(a)) continue;
      const r0 = before.get(a), r1 = b.getBoundingClientRect();
      const dx = r0.left - r1.left, dy = r0.top - r1.top;
      moves.push({ el: b, dx, dy });
    }
    if (Math.abs(dTop) < 0.5 && Math.abs(dBot) < 0.5 && !moves.some((m) => !m.reveal && (Math.abs(m.dx) > 0.5 || Math.abs(m.dy) > 0.5))) {
      // Nothing moved: a new block is still uncovered, quickly, where it stands.
      const r = moves.filter((m) => m.reveal);
      if (!r.length) return;
      const o = { duration: T.reflowMin, easing: EASE.settle };
      const key = {};
      REFLOWS.set(dlg, key);
      own(key, r.map((m) => anim(m.el, [{ clipPath: `inset(-4px -8px ${px(m.h + 4)} -8px)` }, { clipPath: "inset(-4px -8px -4px -8px)" }], o)),
        () => { if (REFLOWS.get(dlg) === key) REFLOWS.delete(dlg); });
      return;
    }
    quiet();
    const dist = Math.max(Math.abs(dTop), Math.abs(dBot), ...moves.map((m) => Math.abs(m.dy || 0)));
    // A block keeps its place on screen at the first frame: the panel's transform carries it by dTop, so it moves by
    // the rest (its own layout change less dTop), on the same curve.
    const dur = Math.round(Math.min(T.reflowMax, Math.max(T.reflowMin, 260 + dist * 0.5)));
    const o = { duration: dur, easing: EASE.settle };
    // The surface: three pieces at the panel's new place, drawn at its old edges on the first frame.
    const cs = getComputedStyle(p1);
    const rTop = parseFloat(cs.borderTopLeftRadius) || 0, rBot = parseFloat(cs.borderBottomLeftRadius) || 0;
    const s = document.createElement("i");
    s.className = "m-surface";
    s.setAttribute("aria-hidden", "true");
    s.style.cssText = `left:${px(p1.offsetLeft)};top:${px(p1.offsetTop)};width:${px(p1.offsetWidth)};height:${px(p1.offsetHeight)};` +
      `--m-rt:${px(rTop)};--m-rb:${px(rBot)};--m-bb:${cs.borderBottomWidth};--m-bg:${cs.backgroundColor};--m-line:${cs.borderTopColor};--m-shadow:${cs.boxShadow}`;
    s.innerHTML = '<i class="m-sh"></i><i class="m-top"></i><i class="m-mid"></i><i class="m-bot"></i>';
    p1.before(s);
    p1.classList.add("m-reflow");
    const [sh, top, mid, bot] = s.children;
    const hA = p1.offsetHeight, hB = B.bottom - B.top;
    const midA = Math.max(1, hA - rTop - rBot), midB = Math.max(1, hB - rTop - rBot);
    const R = roundOf(p1);
    const anims = [
      anim(top, [{ transform: `translateY(${px(dTop)})` }, { transform: "translateY(0px)" }], o),
      anim(bot, [{ transform: `translateY(${px(dBot)})` }, { transform: "translateY(0px)" }], o),
      anim(mid, [{ transform: `translateY(${px(dTop)}) scaleY(${midB / midA})` }, { transform: "translateY(0px) scaleY(1)" }], o),
      anim(sh, [{ transform: `translateY(${px(dTop)}) scaleY(${hB / hA})` }, { transform: "translateY(0px) scaleY(1)" }], o),
      // The panel's own box starts where its top edge was (so its place never jumps, not even in layout), and its
      // content is seen only inside the moving surface; its blocks move relative to it.
      anim(p1, [{ transform: `translateY(${px(dTop)})`, clipPath: `inset(0px 0px ${px(dTop - dBot)} 0px ${R})` }, { transform: "translateY(0px)", clipPath: `inset(0px 0px 0px 0px ${R})` }], o),
    ];
    for (const m of moves) {
      if (m.reveal) anims.push(anim(m.el, [{ clipPath: `inset(-4px -8px ${px(m.h + 4)} -8px)` }, { clipPath: "inset(-4px -8px -4px -8px)" }], o));
      else if (Math.abs(m.dx) > 0.5 || Math.abs(m.dy - dTop) > 0.5) anims.push(anim(m.el, [{ transform: `translate(${px(m.dx)}, ${px(m.dy - dTop)})` }, { transform: "translate(0px, 0px)" }], o));
    }
    // The cut: each leaving block's copy sits in the panel where the block was, and its cutting edge has passed all of
    // it at T.cutBy of the movement (90%), so no sliver of it lingers in the settling's slow end. Every edge and place
    // is linear in the movement's eased progress, so each is one keyframe pair on the movement's own curve.
    const ghosts = [];
    if (cutPlan) {
      const { D0, D1, riders, still } = cutPlan, E = T.cutBy;
      for (const { r, g } of leaving) {
        g.classList.add("m-cut");
        g.style.cssText += `;position:absolute;left:${px(r.left - A.left - p1.clientLeft)};top:${px(r.top - A.top - dTop - p1.clientTop)};` +
          `width:${px(r.width)};height:${px(r.height)};margin:0;box-sizing:border-box`;
        p1.append(g);
        ghosts.push(g);
        if (still) {
          // A sheet: the copy keeps its place on screen (the panel carries it by -dTop, it moves back by dTop) and the top
          // edge coming down cuts it away from above, to its last line (so its last sliver is the calendar's quiet last
          // row, not the chosen day's white mark where the two edges would meet).
          anims.push(anim(g, [{ transform: "translateY(0px)", clipPath: "inset(0px -24px 0px -24px)" },
            { transform: `translateY(${px(dTop)})`, clipPath: `inset(${px(r.height / E)} -24px 0px -24px)` }], o));
        } else {
          // From 721 px: the copy rides with the top edge (as the title does); the rising lower edge cuts it.
          anims.push(anim(g, [{ clipPath: "inset(0px -24px 0px -24px)" }, { clipPath: `inset(0px -24px ${px(r.height / E)} -24px)` }], o));
        }
      }
      // What rides with the lower edge starts D0 - D1 below where it ends (the panel carries it by dTop meanwhile); it
      // keeps at least 8 px below the cut.
      for (const el of riders) anims.push(anim(el, [{ transform: `translateY(${px(D0 - D1 - dTop)})` }, { transform: "translateY(0px)" }], o));
    } else leaving.forEach((l) => l.g.remove());
    const key = {};
    REFLOWS.set(dlg, key);
    own(key, anims, () => { s.remove(); ghosts.forEach((g) => g.remove()); p1.classList.remove("m-reflow"); if (REFLOWS.get(dlg) === key) REFLOWS.delete(dlg); });
  }

  /* ------------------------------------------------------------------ the page's blocks make room (FLIP)
   * When a change on the page adds or takes away a line (a done line arriving under a row; a row that gains a note),
   * the blocks below it would jump. Instead each block that stays slides from where it was to where it now is, with
   * transforms only, while the new line arrives in the space as it opens. collect() names the blocks, as [key, element]
   * pairs, before and after the change (a re-render makes new elements: the key pairs them). A block inside another
   * moving block moves only by the difference.
   * wait and hold (Access's row, option 1 of DECISIONS item 38): the change is made at once (focus and announcements are
   * final), but the blocks in hold keep their old picture, as an inert copy over each, for wait ms (until the window has
   * gone); the changed blocks are hidden meanwhile. Then the copies go, the changed blocks show, the blocks that moved
   * slide from where they were, and a held block that grew has its bottom edge slide down with them.
   * list (Access's records card, DECISIONS item 38): a list whose newest row arrives at its top in the same movement
   * (listSeen and listPlan below). */
  let flipKey = null;
  // Positions in the document (a scroll between the two measurements moves nothing).
  const docRect = (el) => { const r = el.getBoundingClientRect(); return { left: r.left + scrollX, top: r.top + scrollY }; };
  function flip(collect, mutate, { wait = 0, hold = [], list = null } = {}) {
    if (!on()) { finish(flipKey); if (list) endList(list.box); mutate(); return; }
    const before = new Map();
    for (const [k, el] of collect()) if (visible(el)) before.set(k, docRect(el));
    const seen = list ? listSeen(list) : null;
    finish(flipKey);
    // The held blocks' pictures, placed over them before the change (an absolutely placed copy takes no room).
    const held = wait > 0 ? hold.filter(visible).map((el) => {
      const r = el.getBoundingClientRect(), g = ghostOf(el);
      g.classList.add("m-held");
      g.style.cssText += `;position:absolute;left:0px;top:0px;width:${px(r.width)};height:${px(r.height)};margin:0;box-sizing:border-box`;
      el.after(g);
      const at = g.getBoundingClientRect();
      g.style.left = px(r.left - at.left);
      g.style.top = px(r.top - at.top);
      return { el, g, h: r.height };
    }) : [];
    mutate();
    // The slide starts once the change's own task is over: a focus that moves into the changed place (and the scroll it
    // may take) lands where it would without motion.
    queueMicrotask(() => {
      const moves = [];
      for (const [k, el] of collect()) {
        const r0 = before.get(k);
        if (!r0 || !visible(el)) continue;
        const r1 = docRect(el);
        moves.push({ el, dx: r0.left - r1.left, dy: r0.top - r1.top });
      }
      for (const m of moves) {
        let anc = null;
        for (const o of moves) if (o !== m && o.el.contains(m.el) && (!anc || anc.el.contains(o.el))) anc = o;
        m.rx = m.dx - (anc ? anc.dx : 0);
        m.ry = m.dy - (anc ? anc.dy : 0);
      }
      const move = moves.filter((m) => Math.abs(m.rx) > 0.5 || Math.abs(m.ry) > 0.5);
      const grown = held.map((h) => ({ el: h.el, d: h.el.getBoundingClientRect().height - h.h })).filter((g) => g.d > 0.5);
      const plan = seen ? listPlan(list, seen) : null;
      if (!move.length && !held.length && !plan) return;
      const dist = Math.max(0, ...move.map((m) => Math.abs(m.ry)), ...grown.map((g) => g.d), plan ? plan.dist : 0);
      // Held, the slide starts as the copies go (a block outside the held ones keeps its old place until then).
      const o = { duration: Math.round(Math.min(T.reflowMax, Math.max(T.reflowMin, 260 + dist * 0.5))), easing: EASE.settle, ...(wait ? { delay: wait, fill: "backwards" } : {}) };
      // The list's new row says its words when the done line says its own (MOT-17): one moment in two places.
      if (plan) plan.start(o, wait ? wait + T.lineAfterHold : T.lineAfterClose);
      // The swap at wait, inside each animation's time (so a review that seeks through it sees it): the copy is cut away
      // whole and the changed block shown whole, in one frame.
      const all = wait + o.duration, f = wait / all, swap = "steps(1, start)";
      const holding = held.flatMap(({ el, g }) => [
        anim(el, [{ offset: 0, clipPath: "inset(50%)" }, { offset: f, clipPath: "inset(50%)", easing: swap }, { offset: 1, clipPath: "inset(-200px)" }], { duration: all }),
        anim(g, [{ offset: 0, clipPath: "inset(0px)" }, { offset: f, clipPath: "inset(0px)", easing: swap }, { offset: 1, clipPath: "inset(50%)" }], { duration: all, fill: "forwards" }),
      ]);
      const key = {};
      flipKey = key;
      own(key, [
        ...holding,
        ...move.map((m) => anim(m.el, [{ transform: `translate(${px(m.rx)}, ${px(m.ry)})` }, { transform: "translate(0px, 0px)" }], o)),
        // A held block that grew: its bottom edge, with its corners, slides down to its new place with the blocks below.
        ...grown.map((g) => { const R = roundOf(g.el); return anim(g.el, [{ clipPath: `inset(0px 0px ${px(g.d)} 0px ${R})` }, { clipPath: `inset(0px 0px 0px 0px ${R})` }], { ...o, fill: "none" }); }),
      ], () => { held.forEach((h) => h.g.remove()); if (flipKey === key) flipKey = null; });
    });
  }

  /* ---- a list whose newest row arrives at its top (flip's list: Access's records card, OWN-C15, DECISIONS item 38)
   * A change that writes a record shows it at the top of its list in the same movement as the change's done line, so
   * the owner sees the record their action wrote while the done line stands on the row they changed. The rows below
   * slide down to make room; the new row is uncovered as the space opens (its window's lower edge rides on the top of
   * the row below it, so nothing crosses a rule); its words rise into place on the done line's own timing (from 150 ms,
   * or 100 ms after a held change). The oldest row leaves at the box's bottom edge: an inert copy rides down with the
   * rows and is cut by a line inside the box's bottom padding, where its rule ends, so it is gone as the rows settle.
   * When the new row and the leaving one differ in height (a record that wraps) the box's bottom edge moves with them:
   * a clip lets it down when it grows; a copy of its lower corners, under the rows, carries it up when it shrinks. A
   * first row into an empty list replaces the "none yet" line, whose words roll up out of their line as the row's rise
   * in (the label roll's way, MOT-14). Rows still moving from a previous arrival keep moving from where they are seen;
   * a copy still leaving goes on leaving. Nothing fades.
   * list: { box (the card; its bottom edge cuts), rows: () => [[key, row]] newest first, words: the selector of a
   * row's parts that rise, empty: the selector of the "none yet" line }. */
  const LISTS = new WeakMap();            // box -> { key, edge(), ghosts }
  const tyOf = (el) => { const t = getComputedStyle(el).transform; return t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0; };
  const insetBottom = (el) => { const m = /inset\(([^)]*)\)/.exec(getComputedStyle(el).clipPath || ""); return m ? parseFloat(m[1].split(/\s+/)[2] || "0") : null; };
  function endList(box) {
    const st = box && LISTS.get(box);
    if (!st) return;
    finish(st.key);
    [...st.ghosts].forEach(finish);
    LISTS.delete(box);
  }
  // Before the change: each row as seen (a row still sliding is seen where it is drawn), its words' rise and its window
  // if it is still arriving, the "none yet" line, and the box's bottom edge as seen.
  function listSeen(list) {
    const box = list.box;
    if (!visible(box)) return null;
    const rows = new Map(), nodes = [];
    for (const [k, el] of list.rows()) {
      nodes.push(el);
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect(), w = el.querySelector(list.words);
      const ib = insetBottom(el);
      rows.set(k, { el, top: r.top + scrollY, left: r.left + scrollX, w: r.width, h: r.height, ty: w ? tyOf(w) : 0, win: ib == null ? null : r.height - ib });
    }
    const emptyEl = list.empty ? box.querySelector(list.empty) : null;
    const st = LISTS.get(box);
    const b = box.getBoundingClientRect();
    // The "none yet" line's words start below its rule and padding (measured now: it is gone after the change).
    const ecs = emptyEl && getComputedStyle(emptyEl);
    return { rows, nodes, empty: emptyEl && visible(emptyEl) ? { el: emptyEl, r: emptyEl.getBoundingClientRect(), top: parseFloat(ecs.borderTopWidth) + parseFloat(ecs.paddingTop) } : null,
      bottom: b.bottom + scrollY + (st ? st.edge() : 0) };
  }
  // After the change: what stayed, what is new, what left; returns the plan, started by flip with the movement's timing.
  function listPlan(list, seen) {
    const box = list.box;
    const st = LISTS.get(box);
    if (st) for (const g of st.ghosts) if (!g.isConnected) box.append(g);   // a copy still leaving outlives a repaint
    const after = list.rows().filter(([, el]) => visible(el));
    if (after.length === seen.nodes.length && after.every(([, el], i) => el === seen.nodes[i])) return null;  // not repainted
    if (st) finish(st.key);
    const bb = box.getBoundingClientRect(), B = { left: bb.left + scrollX + box.clientLeft, top: bb.top + scrollY + box.clientTop };
    const stay = [], enter = [];
    after.forEach(([k, el], i) => {
      const r1 = docRect(el), h = el.getBoundingClientRect().height, s = seen.rows.get(k);
      if (s) stay.push({ el, s, i, dy: s.top - r1.top, top: r1.top, h });
      else enter.push({ el, i, top: r1.top, h });
    });
    const keysAfter = new Set(after.map(([k]) => k));
    const leave = [...seen.rows].filter(([k, s]) => !keysAfter.has(k) && !s.el.isConnected).map(([, s]) => s);
    const emptyGone = seen.empty && !seen.empty.el.isConnected && enter.length ? seen.empty : null;
    // How far the rows move down: what the new rows take (the copy that leaves rides with them).
    const shift = Math.max(0, ...stay.map((m) => -m.dy));
    const edge = bb.bottom + scrollY - seen.bottom;    // the box's bottom edge: + down (it grows), - up (it shrinks)
    if (!enter.length && !leave.length && !emptyGone && Math.abs(edge) < 0.5 && !stay.some((m) => Math.abs(m.dy) > 0.5 || m.s.ty || m.s.win != null)) return null;
    const dist = Math.max(shift, Math.abs(edge));
    return {
      dist,
      start(o, wordsAt) {
        const anims = [], made = [];
        const R = roundOf(box);
        // The next row's top, as seen on the first frame and at rest: a new row's window opens to it.
        const next = (i) => stay.find((m) => m.i === i + 1);
        for (const m of stay) {
          if (Math.abs(m.dy) > 0.5) anims.push(anim(m.el, [{ transform: `translateY(${px(m.dy)})` }, { transform: "translateY(0px)" }], o));
          // A row that was still arriving: its window keeps riding on the row below, its words go on rising.
          if (m.s.win != null) {
            const n = next(m.i), w0 = n ? n.s.top - m.s.top : m.s.win, w1 = n ? n.top - m.top : m.h;
            anims.push(anim(m.el, [{ clipPath: `inset(0px -16px ${px(m.h - w0)} -16px)` }, { clipPath: `inset(0px -16px ${px(m.h - w1)} -16px)` }], o));
          }
          if (m.s.ty) m.el.querySelectorAll(list.words).forEach((w) => anims.push(anim(w, [{ transform: `translateY(${px(m.s.ty)})` }, { transform: "translateY(0px)" }], o)));
        }
        for (const e of enter) {
          // Its window opens from its top (its rule drawn by the row it pushes down until then; by itself into an empty
          // list, where the "none yet" line's copy keeps no rule) to the top of the row below it, as that row slides.
          const n = next(e.i), w0 = n ? n.s.top - e.top : emptyGone ? 1 : 0, w1 = n ? n.top - e.top : e.h;
          anims.push(anim(e.el, [{ clipPath: `inset(0px -16px ${px(e.h - w0)} -16px)` }, { clipPath: `inset(0px -16px ${px(e.h - w1)} -16px)` }], o));
          const rb = e.el.getBoundingClientRect(), parts = [...e.el.querySelectorAll(list.words)];
          // The row's parts rise as one piece, from just under its window.
          const d = Math.ceil(Math.max(0, ...parts.map((w) => rb.bottom + 8 - w.getBoundingClientRect().top)));
          const ro = { duration: T.lineRise, delay: wordsAt, easing: EASE.roll, fill: "backwards" };
          parts.forEach((w) => anims.push(anim(w, [{ transform: `translateY(${d}px)` }, { transform: "translateY(0px)" }], ro)));
        }
        // The "none yet" line: a copy where it stood, without its rule; its words roll up out of their line.
        if (emptyGone) {
          const r = emptyGone.r, g = ghostOf(emptyGone.el), top = emptyGone.top;
          g.innerHTML = `<span class="m-roll-out" style="display:block">${g.innerHTML}</span>`;
          g.style.cssText += `;position:absolute;left:${px(r.left + scrollX - B.left)};top:${px(r.top + scrollY - B.top)};width:${px(r.width)};height:${px(r.height)};` +
            `margin:0;box-sizing:border-box;border-color:transparent;clip-path:inset(${px(top - 3)} -12px -3px -12px)`;
          box.append(g);
          made.push(g);
          const lh = r.height - top;
          anims.push(anim(g.firstChild, [{ transform: "translateY(0px)" }, { transform: `translateY(${px(-(lh + 6))})` }],
            { duration: T.lineRise, delay: wordsAt, easing: EASE.roll, fill: "both" }));
        }
        // The box's bottom edge, when the list's height changes.
        let edgeNow = () => 0;
        if (edge > 0.5) {
          anims.push(anim(box, [{ clipPath: `inset(0px 0px ${px(edge)} 0px ${R})` }, { clipPath: `inset(0px 0px 0px 0px ${R})` }], o));
          edgeNow = () => -(insetBottom(box) || 0);
        } else if (edge < -0.5) {
          const sk = document.createElement("i"), cs = getComputedStyle(box), d = -edge;
          sk.className = "m-skirt";
          sk.setAttribute("aria-hidden", "true");
          const rb = parseFloat(cs.borderBottomLeftRadius) || 0;
          // Under the rows (z-index -1 in the box's own stacking context), the box's own colour and border.
          sk.style.cssText = `position:absolute;display:block;pointer-events:none;z-index:-1;box-sizing:border-box;` +
            `left:${px(-box.clientLeft)};right:${px(-box.clientLeft)};bottom:${px(-box.clientTop - d)};height:${px(rb + d + box.clientTop)};` +
            `border-radius:0 0 ${cs.borderBottomRightRadius} ${cs.borderBottomLeftRadius};background:${cs.backgroundColor};border:${cs.borderBottomWidth} solid ${cs.borderBottomColor};border-top:0`;
          box.append(sk);
          made.push(sk);
          anims.push(anim(sk, [{ transform: "translateY(0px)" }, { transform: `translateY(${px(-d)})` }], { ...o, fill: "both" }));
          edgeNow = () => (sk.isConnected ? d + tyOf(sk) : 0);
        }
        const key = {};
        const state = { key, edge: () => edgeNow(), ghosts: st ? st.ghosts : new Set() };
        // The state goes once its own movement and every copy still leaving have ended.
        const tidy = () => { const cur = LISTS.get(box); if (cur && !cur.key && !cur.ghosts.size) LISTS.delete(box); };
        // The rows that leave: each a copy in a window from where it was drawn down to the line its rule reaches, riding
        // down with the rows; a movement of its own, so a later arrival does not cut it short.
        for (const s of leave) {
          // A plain block that takes the list's look (no marker), so the copy is drawn exactly as the row was.
          const win = document.createElement("div"), g = ghostOf(s.el), travel = Math.max(1, shift);
          win.className = "m-edge";
          win.setAttribute("aria-hidden", "true");
          win.style.cssText = `position:absolute;left:0px;right:0px;top:${px(s.top - B.top)};height:${px(travel)};overflow:clip;pointer-events:none;list-style:none`;
          g.style.cssText += `;position:absolute;left:${px(s.left - B.left)};top:0px;width:${px(s.w)};height:${px(s.h)};margin:0;box-sizing:border-box`;
          win.append(g);
          box.append(win);
          state.ghosts.add(win);
          own(win, [anim(g, [{ transform: "translateY(0px)" }, { transform: `translateY(${px(travel)})` }], { ...o, fill: "both" })],
            () => { win.remove(); state.ghosts.delete(win); tidy(); });
        }
        LISTS.set(box, state);
        if (!anims.length) { made.forEach((m) => m.remove()); state.key = null; tidy(); return; }
        own(key, anims, () => { made.forEach((m) => m.remove()); state.key = null; tidy(); });
      },
    };
  }

  /* ------------------------------------------------------------------ popovers (MOT-12, BDG-2, MNU-2)
   * The status's details and the phone's menu unroll from their control: the bottom edge runs down from the top edge
   * and uncovers the words in reading order while the panel drops 6 px into place; closing rolls it back up toward the
   * control, faster. The status's chevron turns with it (style.css). Keys inside a menu move at once. Pages call
   * popOpen right after showing it (focus is already inside) and popClose right before hiding it. */
  const POPGHOST = new WeakMap();
  function popOpen(pop) {
    finish(pop);
    let from = null, k0 = 0;
    const g = POPGHOST.get(pop);
    if (g) { from = pose(g); k0 = 1 - progressOf(g); finish(g); }
    if (!on() || !visible(pop)) return;
    const R = roundOf(pop);
    const o = { duration: Math.round(T.popIn * Math.max(0.3, 1 - k0)), easing: EASE.arrive };
    const start = from && from.clipPath ? from : { transform: `translateY(${-T.popDrop}px)`, clipPath: `inset(0px 0px 100% 0px ${R})` };
    const shade = shadeFor(pop);
    own(pop, [
      anim(pop, [start, { transform: "translateY(0px)", clipPath: `inset(0px 0px 0px 0px ${R})` }], o),
      anim(shade, [{ opacity: k0, transform: `translateY(${px(-T.popDrop * (1 - k0))}) scaleY(${k0})` }, { opacity: 1, transform: "translateY(0px) scaleY(1)" }], o),
    ], () => { shade.remove(); pop.classList.remove("m-noshadow"); });
  }
  function popClose(pop) {
    const opening = runs.has(pop);
    const k0 = opening ? progressOf(pop) : 1;
    const from = opening ? pose(pop) : null;
    finish(pop);
    finish(POPGHOST.get(pop));
    if (!on() || !visible(pop) || k0 < 0.02) return;
    const R = roundOf(pop);
    const g = ghostOf(pop);
    g.classList.add("m-ghost-pop");
    pop.after(g);
    POPGHOST.set(pop, g);
    const start = from && from.clipPath ? from : { transform: "translateY(0px)", clipPath: `inset(0px 0px 0px 0px ${R})` };
    const o = { duration: Math.round(T.popOut * Math.max(0.3, k0)), easing: EASE.leave, fill: "forwards" };
    const shade = shadeFor(g);
    own(g, [
      anim(g, [start, { transform: `translateY(${-T.popDrop}px)`, clipPath: `inset(0px 0px 100% 0px ${R})` }], o),
      anim(shade, [{ opacity: k0, transform: `scaleY(${k0})` }, { opacity: 0, transform: `translateY(${-T.popDrop}px) scaleY(0)` }], o),
    ], () => { shade.remove(); g.remove(); if (POPGHOST.get(pop) === g) POPGHOST.delete(pop); });
  }

  /* ------------------------------------------------------------------ a label that changes rolls (BTN-9, DLG-9)
   * A button keeps its width with its labels in one cell (.rb-stack: every label in the same grid cell, only the
   * current one seen and read). When the current label changes, the old one rolls up out of its line and the new one
   * rolls in from below, as changed digits do; the window is the line itself, a few pixels taller for Arabic's marks.
   * Pages only switch aria-hidden on the labels, as before; the movement follows from here. A label that changes again
   * while it rolls continues from where it is. */
  const ROLLS = new WeakMap();            // stack -> the label rolling in
  const QUIET = new Set();                // panels settling in a reflow: their labels change at once
  function rollStack(stack, leaving, entering) {
    if (!on() || !stack.isConnected || !stack.getClientRects().length) return;
    for (const p of QUIET) if (p.contains(stack)) return;
    let fromY = 0;
    if (runs.has(stack)) {
      if (ROLLS.get(stack) === leaving) fromY = new DOMMatrixReadOnly(getComputedStyle(leaving).transform).m42;
      finish(stack);
    }
    const d = stack.getBoundingClientRect().height + 6;
    // Only the two labels that change are seen while they roll (a cell may hold more: the export's three).
    stack.classList.add("m-rolling");
    leaving.classList.add("m-roll");
    entering.classList.add("m-roll");
    ROLLS.set(stack, entering);
    const o = { duration: T.roll, easing: EASE.roll };
    own(stack, [
      anim(leaving, [{ transform: `translateY(${px(fromY)})` }, { transform: `translateY(${px(-d)})` }], { ...o, fill: "forwards" }),
      anim(entering, [{ transform: `translateY(${px(d)})` }, { transform: "translateY(0px)" }], o),
    ], () => {
      stack.classList.remove("m-rolling");
      leaving.classList.remove("m-roll");
      entering.classList.remove("m-roll");
      ROLLS.delete(stack);
    });
  }
  new MutationObserver((records) => {
    if (!on()) return;
    const stacks = new Map();
    for (const r of records) {
      const l = r.target;
      if (!l.classList || !l.classList.contains("rb-l")) continue;
      const stack = l.parentElement;
      if (!stack || !stack.classList.contains("rb-stack")) continue;
      const now = l.getAttribute("aria-hidden") === "true", was = r.oldValue === "true";
      if (now === was) continue;
      const e = stacks.get(stack) || {};
      if (now) e.leaving = e.leaving || l; else e.entering = l;
      stacks.set(stack, e);
    }
    for (const [stack, { leaving, entering }] of stacks) if (leaving && entering) rollStack(stack, leaving, entering);
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["aria-hidden"], attributeOldValue: true });

  /* ------------------------------------------------------------------ done (DLG-4, the export; Access's done lines)
   * The reward of a finished task, played only after the task really finished (item 8). A done mark draws itself:
   * .m-ring (an SVG circle) from its top in the reading direction, then .m-check from its short stroke to its long
   * one. The words (.m-rise, inside their window, .m-win or the parent) rise into their line from below, as the intro's
   * answers do. A done line on the page (line: true) waits until its dialog's scrim has mostly gone (delay). The words
   * are in the DOM, final, from the start: a screen reader, a focus move or a copy never wait for them. */
  function stroke(el, delay, duration, easing = EASE.draw) {
    const len = el.getTotalLength ? el.getTotalLength() : 0;
    if (!len) return null;
    // The dash lies wholly before the path's start until it draws, so a round cap never shows as a dot.
    const L = Math.ceil(len), off = L + 3;
    return anim(el, [{ strokeDasharray: `${L} ${off + 3}`, strokeDashoffset: `${off}` }, { strokeDasharray: `${L} ${off + 3}`, strokeDashoffset: "0" }],
      { duration, delay, easing, fill: "backwards" });
  }
  function rise(win, inner, delay, duration) {
    const w = win.getBoundingClientRect(), r = inner.getBoundingClientRect();
    const d = Math.ceil(w.bottom + 8 - r.top);
    const clip = "inset(-6px -8px -6px -8px)";
    return [
      anim(win, [{ clipPath: clip }, { clipPath: clip }], { duration: delay + duration }),
      anim(inner, [{ transform: `translateY(${d}px)` }, { transform: "translateY(0px)" }], { duration, delay, easing: EASE.roll, fill: "backwards" }),
    ];
  }
  function done(el, { line = false, delay = 0, times = null } = {}) {
    if (!on() || !visible(el)) return;
    finish(el);
    const anims = [];
    const t = times ? { ...T, ...times } : T;
    const ring = el.querySelector(".m-ring"), check = el.querySelector(".m-check");
    if (line) {
      const inner = el.querySelector(".m-rise");
      if (inner) anims.push(...rise(inner.closest(".m-win") || el, inner, delay, t.lineRise));
      const a = check && stroke(check, delay + t.lineCheckAt, t.lineCheck);
      if (a) anims.push(a);
    } else {
      const a = ring && stroke(ring, delay, t.ring, t.ringEase || EASE.draw);
      if (a) anims.push(a);
      const b = check && stroke(check, delay + t.checkAt, t.check);
      if (b) anims.push(b);
      el.querySelectorAll(".m-rise").forEach((inner) => anims.push(...rise(inner.closest(".m-win") || inner.parentElement, inner, delay + t.riseAt, t.rise)));
    }
    if (anims.length) own(el, anims, null);
  }

  /* ------------------------------------------------------------------ for review: a trial switch (DECISIONS item 38)
   * Where the user compares variants of a moment on the live site, the page shows a small switch: a working tool, not
   * part of the design (as the light tuner on Daily): neutral greys, a dashed edge, fixed in the window's bottom
   * inline-end corner (on a phone, at the end of the page, so it never covers the moment it switches), in the page's
   * language, with one line saying what the chosen variant does. The choice is kept in localStorage (store);
   * ?<param>=<value> chooses for one load without keeping it and shows no switch, for captures. While motion is off
   * every variant is the first (the page as built) and the switch is not shown. options: [{ value, label, note }], the
   * first the page as built. */
  function trial({ id, param, store, label, options }) {
    const values = options.map((o) => o.value);
    const q = params.get(param);
    const forced = q == null ? null : values.includes(q) ? q : values[0];
    let value = forced;
    if (value == null) { try { const s = localStorage.getItem(store); value = values.includes(s) ? s : values[0]; } catch (e) { value = values[0]; } }
    const api = { get value() { return on() ? value : values[0]; } };
    if (forced != null || !document.body) return api;
    const box = document.createElement("div");
    box.className = "m-trial";
    box.id = id;
    box.setAttribute("role", "group");
    box.setAttribute("aria-labelledby", `${id}-label`);
    box.innerHTML = `<div class="m-trial-row"><span class="m-trial-label" id="${id}-label">${label}</span><span class="m-trial-seg">${options
      .map((o) => `<button type="button" data-v="${o.value}">${o.label}</button>`).join("")}</span></div><p class="m-trial-note" aria-live="polite"></p>`;
    const paint = () => {
      box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === value)));
      box.querySelector(".m-trial-note").textContent = options.find((o) => o.value === value).note;
    };
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-v]");
      if (!b || b.dataset.v === value) return;
      value = b.dataset.v;
      try { localStorage.setItem(store, value); } catch (e2) { /* storage unavailable: kept for this load */ }
      paint();
    });
    const show = () => { box.hidden = !on(); };
    mqReduce.addEventListener("change", show);
    paint();
    show();
    (document.getElementById("main") || document.body).append(box);
    return api;
  }

  /* ------------------------------------------------------------------ for review: freeze and seek every movement */
  // Cancelled animations (a movement continued by another) are left alone: seeking one would bring it back.
  function seek(ms) {
    cap.frozen = cap.frozen.filter((a) => a.playState !== "idle");
    cap.frozen.forEach((a) => { const end = a.effect.getComputedTiming().endTime || 0; a.currentTime = Math.max(0, Math.min(ms, end - 0.01)); });
  }
  // Moves every held movement on by ms from where it is, so one that began later (an action taken while another
  // movement still runs) keeps its own time.
  function advance(ms) {
    cap.frozen = cap.frozen.filter((a) => a.playState !== "idle");
    cap.frozen.forEach((a) => { const end = a.effect.getComputedTiming().endTime || 0; a.currentTime = Math.max(0, Math.min((a.currentTime || 0) + ms, end - 0.01)); });
  }
  function release() { const f = cap.frozen.splice(0).filter((a) => a.playState !== "idle"); cap.freeze = false; f.forEach((a) => a.play()); }
  function settleAll() { [...runs.keys()].forEach(finish); }
  // Leaving the tab ends every movement at once.
  document.addEventListener("visibilitychange", () => { if (document.hidden) settleAll(); });

  window.EclipseMotion = {
    on,
    setGate(fn) { pageGate = typeof fn === "function" ? fn : () => true; },
    EASE, T,
    dialogOpen, dialogClose, reflow, flip, popOpen, popClose, done, trial,
    settle: settleAll,
    get running() { return runs.size; },
    capture: {
      freeze(v = true) { cap.freeze = Boolean(v); },
      get frozen() { return cap.frozen.length; },
      seek, advance, release,
    },
  };
})();
