// FITWAY public crowd page (public-redesign-r01): where a text's strokes stand, which its box does not say. Concept
// only, synthetic data. Moved out of public.js by responsibility (review fixes, Error's room). public.js calls it once,
// before anything is built, with the page's direction, and uses what it returns: measure, lead and strokes.
window.FitwayPublicInk = function (rtl) {
  "use strict";
  var pad = null;
  // A text as it is drawn, at 200 px: in the face it is drawn in, in the page's direction (canvas).
  function measure(node) {
    if (!pad) pad = document.createElement("canvas").getContext("2d");
    var cs = getComputedStyle(node);
    pad.font = cs.fontWeight + " 200px " + cs.fontFamily;
    pad.direction = rtl ? "rtl" : "ltr";
    pad.textAlign = rtl ? "right" : "left";
    return pad.measureText(node.textContent);
  }
  // The word's first stroke stands on the facts' start edge. A word's first letter has a side bearing of its own
  // (in English "B", "M", "N", "P" twice that of "C" or "Q"; in Arabic the first letter at the right, «م», «ه», «ش»,
  // «ع», «ت» each its own), so it is measured in the face the word is drawn in, in the word's direction, and taken back
  // (canvas). A placeholder is flat, so it starts on the edge itself (public.js, fitWord).
  function lead(word) {
    var m = measure(word);
    return -(rtl ? m.actualBoundingBoxRight : m.actualBoundingBoxLeft) / 200;
  }
  // Where a text's strokes start and end: its box, less what the face keeps over the highest and under the lowest.
  function strokes(node) {
    var m = measure(node), box = document.createRange(), at = parseFloat(getComputedStyle(node).fontSize) / 200;
    box.selectNodeContents(node);
    var b = box.getBoundingClientRect();
    return { top: b.top + (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent) * at, bottom: b.bottom - (m.fontBoundingBoxDescent - m.actualBoundingBoxDescent) * at };
  }
  return { measure: measure, lead: lead, strokes: strokes };
};
