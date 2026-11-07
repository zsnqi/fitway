// FITWAY public crowd page (public-redesign-r01): a picked day's movement on screen. Concept only, synthetic data.
// Moved out of public.js by responsibility (run final-fixes-45). public.js calls it once, before anything is built,
// with the hours' span (SPAN0 to SPAN1, every slot the bars hold) and the strong ease-out it shares with the labels'
// fades, and uses what it returns: seen, moving, stopSlide and slide, and the two timings, SLIDE and SLIDE_ON.
window.FitwayPublicSlide = function (SPAN0, SPAN1, EASE_OUT) {
  "use strict";
  // A picked day reflows the bars as one movement on screen, 280 ms on a strong ease in and out (STANDARDS.md):
  // heights glide (their transitions, CSS), and every hour goes from where it is seen to its new place and width
  // (FLIP: a translate on the bar and on its label, a scale on the bar's body, so the ring over it never bends). A
  // closed hour stands folded to nothing at the day's edge (flex 0), so an hour that opens unfolds from that edge as it
  // rises, and an hour that closes folds into it as it sinks. Measured from the screen, so it runs the same way in
  // either direction, and a second pick in the middle of a movement carries on from where the bars are: already
  // moving, it eases out from there (the strong ease-out, 280 ms: motion review F2), never restarting from rest. Under
  // reduced motion, or from a key, the new day stands at once.
  var SLIDE = { duration: 280, easing: "cubic-bezier(0.77, 0, 0.175, 1)", id: "slide" };
  var SLIDE_ON = { duration: 280, easing: EASE_OUT, id: "slide" };
  function seen(B) {
    var m = {};
    for (var h = SPAN0; h < SPAN1; h++) {
      var r = B.slots[h].querySelector(".body").getBoundingClientRect();
      m[h] = { c: r.left + r.width / 2, w: r.width };
    }
    return m;
  }
  // Whether the bars are moving: a slide, or a height still gliding (a pick's, or the arrival's).
  function moving(B) {
    return B.bars.getAnimations({ subtree: true }).some(function (a) {
      return a.playState === "running" && (a.id === "slide" || a.transitionProperty === "translate");
    });
  }
  function stopSlide(B) {
    B.bars.querySelectorAll(".bar, .body, .t").forEach(function (n) {
      n.getAnimations().forEach(function (a) { if (a.id === "slide" || a.id === "open") a.cancel(); });
    });
    B.bars.querySelectorAll("[data-leaving]").forEach(function (s) { s.removeAttribute("data-leaving"); s.style.removeProperty("--bw"); });
  }
  function folded(slot, body) {
    return function () {
      slot.removeAttribute("data-leaving");
      slot.style.removeProperty("--bw");
      body.getAnimations().forEach(function (a) { if (a.id === "slide") a.cancel(); });
    };
  }
  function slide(B, before, opts) {
    for (var h = SPAN0; h < SPAN1; h++) {
      var s = B.slots[h], o = before[h], open = !s.hasAttribute("data-closed");
      if (!open && o.w < 0.5) continue; // folded before and after
      var bar = s.querySelector(".bar"), body = s.querySelector(".body"), t = s.querySelector(".t");
      if (!open) { s.setAttribute("data-leaving", ""); s.style.setProperty("--bw", o.w + "px"); }
      var r = bar.getBoundingClientRect(), dx = o.c - (r.left + r.width / 2);
      var from = "translateX(" + dx.toFixed(2) + "px)";
      if (!open) {
        bar.animate([{ transform: from }, { transform: "none" }], opts);
        body.animate([{ transform: "none" }, { transform: "scaleX(0)" }], Object.assign({ fill: "forwards" }, opts)).onfinish = folded(s, body);
        continue;
      }
      var sx = r.width > 0 ? o.w / r.width : 1;
      if (Math.abs(dx) >= 0.5) {
        bar.animate([{ transform: from }, { transform: "none" }], opts);
        // An opening hour's label rides out with it from the edge, but shows only once the hours have room.
        if (t.textContent) {
          if (o.w < 0.5) t.animate([{ transform: from, opacity: 0 }, { opacity: 0, offset: 0.6 }, { transform: "none", opacity: 1 }], Object.assign({}, opts, { id: "open" }));
          else t.animate([{ transform: from }, { transform: "none" }], opts);
        }
      }
      if (Math.abs(sx - 1) >= 0.005) body.animate([{ transform: "scaleX(" + sx.toFixed(4) + ")" }, { transform: "none" }], opts);
    }
  }
  return { SLIDE: SLIDE, SLIDE_ON: SLIDE_ON, seen: seen, moving: moving, stopSlide: stopSlide, slide: slide };
};
