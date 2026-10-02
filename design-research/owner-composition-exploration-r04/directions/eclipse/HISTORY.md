# Eclipse v3 (Owner r04, full Daily page)

Current build: `README.md`. Rules: `DESIGN-SPEC.md`.

**Design spec, first draft (2026-09-30, run `owner_spec_r04_s12`):** read `DESIGN-SPEC.md` instead of this file for the
rules, compositions, known issues and open questions, measured from Daily and Reports at `31a40d6`; it stays a draft
until the authority record. `components.html` renders every component in its rule form, AR and EN (not linked from the
rail). This file stays the build history.

**Reports round (2026-09-30, run `owner_reports_r04_s10`):** Eclipse gains its second page, `reports.html`, at desktop,
and the table, form and dialog system that Activity Log, Access and Settings will reuse. The Daily page changes in one
place only: its rail's Reports item is now a link that keeps the language, and Reports links back. See "Reports" at the
end of this file.

**Single-fetch repair (2026-09-30, run `owner_fonts_r04_s09_r1`):** the blocking stylesheets are followed by early
loads of the registered CSS faces, so text shares one fetch per subset on HTTP and file pages, including reloads.
All 800 cache/header, size, language, motion and delay cases passed; all 56 compared still frames equal 4568bac.
The accepted Chromium paint hold remains about 100 ms; the pre-existing narrow busy-note movement is recorded
below for the phone phase (resume amendment), with no intro, font-byte, face-rule or accessibility change.

**Self-hosted font round (2026-09-30, run `owner_fonts_r04_s09`):** Readex Pro loads from `fonts/` with Google's
identical four woff2 subsets and eight face rules, with the OFL licence. HTTP/HTTPS preloads Arabic and Latin for both
weights; direct file opening uses the same CSS faces without rejected preloads or console messages. Normal first
opens and reloads have no swap or shift; slow fonts retain Chromium's measured roughly 100 ms paint hold, the
first-paint 200 ms cap, the accepted swap before the intro and the still page when the cap expires.

**First-paint round (2026-09-29, run `owner_introfix_r04_s08`):** the late Latin font swap
changed text widths, and app.js filled the empty header after paint, dropping the cards and chart.
Both Readex Pro subsets (covering both weights and stylesheet URL forms) are preloaded; ordered render-blocking scripts
complete the text before first paint; the 200 ms cap counts from that paint and the extra frame keeps final geometry still.
The user accepts fallback text swapping to Readex Pro before the intro starts (decision of 2026-09-29); the
200 ms font cap, intro timings and still frames are unchanged.

**Intro speed round (2026-09-29, run `owner_introspeed_r04_s05`; the user's decision of 2026-09-27):** the first-open intro now lasts about 1171 ms at the tuner's 1x (0.70x of the earlier design): the answers roll in 400 ms, the line draws in 914 ms, and the end point and the peak land in 257 ms from 914 ms. This supersedes the 820 ms stated in the earlier entries below, which stay as recorded. The live digit roll on a new reading (`T.roll`, 280 ms) and every non-intro timing are unchanged; the intro has its own `INTRO_T.roll`. The tuner's range (0.5x-2x) and default (1x) are unchanged.

**Lane round (2026-09-28, run `owner_lane_r04_s04`; the user's decision):** the tooltip no longer floats near its point.
The same box (content, start-aligned layout, colours and width rule unchanged) lives in a fixed lane at the top of the
plot. It moves sideways only, is centred on its stop and stopped 2 px inside the plot's sides, and a thin connector joins
it to the mark it describes. Nothing else is ever drawn in the lane, so the scale starts lower: 94 px lower while live
(option (a), chosen; see "Tooltip lane" under "Motion", 6). Every frame that shows the plot changes, and nothing outside
the plot element does. This supersedes every floating-placement rule (side, flip, clamp, above and below, the 12 px
gap from the hairline, the 11 px end-point clearance with its alternatives, the peak tag's covered state) and round P
(withdrawn); Repairs 1-4 below, the follow-up round's placement lines and the tooltip-placement numbers under "Evidence"
describe the floating placement and stay only as history. The follow's curve and speed (now horizontal only), text
changing at once, the intro and every truthfulness rule are unchanged.

**Repair 4 (2026-09-28):** gap and no-history moves now use their actual reduced-motion rest anchors. A width
change applies immediately away from the pinned edge; a placement-mode change eases. The box's existing ease
continues through a morph's end, and delayed minute ticks use the reading path. Planted output is also refused inside
any Git working tree, regardless of TEMP/TMP. The full before/after measurements and limits are in "Evidence" below.

**Repair 3 (2026-09-27):** the selected box now uses the follow curve for a side change, a change among the
above/below/shifted rest placements, or a new reading. The curve starts at the box's displayed position and
velocity. Clearance is measured on its rendered rectangle at rest; the route no longer projects the moving box to a
different point. Planted capture output is refused inside this worktree even if TEMP or TMP names it. Measurements for
this repair are in "Evidence" below.

This is a concept only, built on synthetic data. Nothing is selected. It is the full Daily page at desktop
1440×900, in Arabic RTL (the default) and English LTR. It evolves `../light-study/` recipe A, and the data
logic (seeded simulation, day constants and monotone interpolation) comes from there. v3 applies Round 5 §1-§3
of `../NEXT-DIRECTION-BRIEF.md`: a new "Inside now" light, a chart light back toward light-study A, and a live
light tuner. Its motion is Round 6 (the motion reset and chart hover; see "Motion" below): the lights never move, and
something moves only when the data changes or the owner acts. The one exception is Round 7's first-open intro (see
"Motion", 11): on the first open in a browser tab the answers roll into place and the line draws once, and then the
page is exactly its still self. With reduced motion or `?motion=off` every still frame is pixel-identical to the frames
before motion was added, except the hover and tuner frames, which change by design. Everything that is not a light layer, motion or the chart's hover is
unchanged from v2: the layout, rail, copy, data simulation, centred average, chip rule, states and details panel.

**Round 7 step 2:** the chart marker is form B, the hollow ring, only (with form A's lit dots at the missing span); it
follows its stop along the curve with the reference clip's feel, with a hover speed in the tuner; the latest stop shows
the latest reading (49 · Busy); and the verifier's F2 (a halo flash on a live update) and F5 (a long task on the first
move into the future) are fixed. See "Motion", 6 and 6b, and "Evidence".

**Round 7 step 3 (this version):** the first-open intro (Round 7, decision 4). On a tab's first open the four answers roll
into place and today's line draws once from opening to now, then the end point and the peak land: about 820 ms in all.
It never plays on a reload, on a return in the same tab or with motion off, and it settles at once when the owner acts.
The tuner gains an intro speed and "Replay intro". See "Motion", 11, and "Evidence".

**Intro fix round (Round 7 step 3, run `owner_intro_r04_s03_fix`):** the wait for the fonts is capped at 200 ms from the
first paint, and a late font means no intro (user decision, 2026-09-26). The peak's label stays in the accessibility tree
while it waits. The capture gains three gates: the surfaces at the first frames, the end after the held frames, and
slow fonts. What moves, its order and its timings are unchanged.

**Follow-up round after step 3 (run `owner_followup_r04_s04`, 2026-09-27):**
- **Tooltip width:** at any moment every tooltip that shows a number has one width, in both languages, so its number
  no longer moves against the hairline between stops. The width follows the chart (the user's decision,
  2026-09-27, repair 1): the widest tooltip that shows a number among the chart's current stops, plus 2 px, rounded
  up, measured again whenever the stops or their text change. At the page's own 7:42 PM snapshot it is 127 px, the
  width the user chose over the first 138 px after a before/after review. Only the missing-span stop, which shows no
  number, may grow past it. See "Motion", 6.
- **Capture noise:** a frame whose hash differs from its expected value is captured again, and counts as a difference
  only if it differs twice. When the expected value is a reference rendered in the same run, that reference is
  rendered again too. The comparison stays exact. See "Open and capture".
- **Wording:** the font wait's cap is 200 ms, counted from the first paint entry, or from when app.js runs if that is
  earlier. With the font files held 600 ms, the still page's answers were in view 153-231 ms after the first paint
  across the recorded runs (see "Measured").

**Repair 2 (2026-09-27):** a tooltip near closing could flip across today's end point. The original
`622cd0b` did so late at night; the wider chart-following box in `6123863` started doing so earlier. This repair
keeps every already-clear placement and moves only boxes that breach the 11 px clearance around the end point.
Its plant guard checked output folders against Node's temp path, and a selected box is placed again
during each frame of a live-reading morph. The full-day sweep and capture evidence are recorded below.

Nothing else changes.

## Light model (v3)

- **Check:** the page with these defaults and no stored tuning is pixel-identical to the user's stored tuning
  on the old defaults, in AR and EN.
- **Measurements:** the tables under "Measurements" below were taken on the designer's first Recommended
  values, not on the user's tuning. The coordinator's measurements of the user's tuning are in the handoff.
- **The designer's first Recommended values:**
  - **Inside now:** intensity 1, disc 76, position 69, softness 10px, rim 3%, lit-corner glow 1 at 100%, far
    glow 1.15, ring-end fade 18.
  - **Chart:** intensity 1.1, fade 17, sides 35, balance 0, softness 48px.
  - **Disc:** an ellipse 0.7 as tall as it is wide, in pixels (`--now-disc-aspect`). Its radius is 76% of
    the card width, and its centre is 69% of the width from the lit side. Its lowest point sits 3% of the
    card height above the bottom edge, which is the thin continuous rim.
  - **Edge:** the feather is 10px along the card (7px across) and eased (0, .16, .5, .84, 1), and centred on
    the nominal edge. It reads as one clean arc.
  - **Ring ends:** up the lit side, a fade mask anchored where the disc meets the side (computed in CSS
    with `sqrt()`/`pow()`) takes the ring to transparent over 18% of the card height. Toward the far end,
    the band dims on its own before the far-corner glow, which fades up the far side.
  - The disc is 54cqw wide (just past both sides). Its lowest point is `--chart-fade` (17%) above the
    bottom, its edge meets the sides at `--chart-side` (35%), and its feather is 48px.

## Light tuner

    - The defaults (1 and 100%) render exactly as before.
- **Marker group:** step 1's «علامة المخطط: A / B» switch is gone with form A (Round 7 step 2).
  - «إعادة المقدمة» "Replay intro" (Round 7 step 3): plays the intro again on the page as it is now (the current
    reading). It is disabled with reduced motion, `?motion=off` or the Motion switch off, because there is no intro then.
  - Removed in Round 6: "Replay load", "switch on at load", "follow the pointer" (and "chart card too"), and "light
    follows crowd" with its level preview.
## Line, cards and states (unchanged from v2)
- **States:** `?state=live|delayed|nohistory`, `?lang=ar|en`. Delayed shows only in the header status and
  the Inside now card. Its lights stay as they are, as Round 2 allows.

## Motion

Round 6 (`../NEXT-DIRECTION-BRIEF.md`, decisions 1-10) replaced the Round 5 motion.

**Principle:** motion carries information, and decoration never moves. The page is an instrument: it is complete at
first paint, and something moves only when the data really changes or the owner acts. Round 7 (decision 4) makes one
exception, the first-open intro (11 below): once per browser tab, the content inside the still surfaces arrives.
| Intro: the answers | a tab's first open only (Round 7 step 3) | transform: each answer's value enters its final place from below, inside the digits' ink box (the digit roll) | 400 ms, from the start | `cubic-bezier(0.25, 1, 0.5, 1)` |

**1. Load: the first-open intro only (the changed first-paint rule).**

- Round 6 had no load motion. Round 7 (decision 4) amends that with the first-open intro (11 below), and only that:
  there is still no stagger, rise, light entrance or wash drift, and the surfaces and text are complete at first paint.
- Without an intro (a reload, a return in the same tab, reduced motion, `?motion=off`, the Motion switch off) the page is
  complete at first paint. No font-loading hide is added; Chromium can hold paint for pending early-loaded fonts.
- With an intro, the four answers wait out of sight and today's line is not drawn until the fonts are in (the cap is
  200 ms, counted from the first paint entry; with slow fonts the still page's answers were in view 153-231 ms
  after the first paint across the recorded runs; 11 below). Every final text value is in the DOM at first paint, and
  everything outside the intro's clips is complete.

**2. Lights are static, always.**

- The entrance, the pointer-follow light and the crowd-dependent light are gone, with their code and CSS, including
  the light layers' `--lp` overscan.
- The tuned light values in `:root` are untouched, and the lights render exactly as before.

**5. The chart's hover snaps to stops.**

- **Missing span (2:14-2:31 PM):** one stop, "no reading" («لا قراءة»), with the range. There is no normal stop inside
  it, and the line is never bridged.
  - The screen-reader text says the value is an average, for example «6:00 م، 46 داخل الصالة في المتوسط، الازدحام
    متوسط، المعتاد 46». The latest stop is the exception: it is the reading, never called an average.
- **Measured:** the marker sits on what it describes at every stop, in AR and EN, live, delayed and without history.
  - The check runs against the SVG path's own geometry: an arc-length search with `getPointAtLength`, not a formula.
  - The largest distance is 0.004 px on the line, and 0 px on the peak ring, the usual line and the gap mark.
  - Round 7 step 2 (form B only; in this cloud container): AR and EN, each live, delayed and without history (6 runs),
    the largest distance is 0.004 px on the line and 0 px elsewhere.


**6. The marker: form B, the hollow ring (Round 7 step 2).**

The user rejected Round 6's "reading sight" (a red core with chalk level ticks and a guide above): it read as a shooter
game's crosshair. Step 1 offered two forms, A (a lit bead) and B (a hollow ring), with a tuner switch. The user chose B.
Step 2 removed form A everywhere: its drawing code, the tuner's A/B switch, the `fitway.eclipse.v3.marker` key, `?marker=`
and `setMarker`. The one part of A that stays is its missing-span variant, the lit dots. The marker is drawn in
`paintMarker()` in `app.js`.

  - The marker sits on what its tooltip describes (see "Measured" above).
- **Tooltip lane (the user's decision, 2026-09-28; run `owner_lane_r04_s04`).** The box lives in a fixed band at the top of
  the plot. It replaces the floating placement (side, flip, clamp, above and below, the 12 px gap, the 11 px end-point
  clearance, the centred and shifted alternatives, the peak tag's covered state) and round P.
  - **The lane:** its top is 2 px below the plot's top (`LANE.top`) at every stop, snapshot, state, language and font;
    its height is the tallest tooltip among the chart's current stops, measured with the width on the same hidden copies
    and rounded up to a whole pixel: **89 px live** (the peak and the latest reading, which have the label chip), **109 px
    delayed** (the latest reading also has the age row) and **69 px without history** (no tooltip has the usual row).
    Heights come from the line height, so they are the same in Arabic and English and in Readex Pro and the fallback font.
    If a font swap ever changes the height, the chart is drawn again. `window.__eclipse.chart.lane` reports the numbers.
  - **Reserved:** nothing but the tooltip is drawn in it, in any case: not today's line or its caps, the usual line, the
    marker ring and its glow, the hairlines, the peak ring, drop and tag, the end point, its halo and the pulse, nor the
    scale's and axes' labels and grid. The scale starts `LANE.gap` = 8 px below the lane: the "80" label's box (18 px tall)
    is the highest mark, its top 8 px below the lane's bottom, so the scale's top line is at 108 px (live), 128 px (delayed)
    or 88 px (no history) from the plot's top, where it was 14 px.
  - **What it costs (option (a), the smallest change that reserves the lane):** the same scale (0 to 80) is drawn shorter.
    Live, it loses 94 px of 454 at 1440×900 (20.7%), of 354 at 1280×800 (26.6%) and of 306 at 1024×640 (30.7%); delayed
    114 px (25.1%, 32.2%, 37.3%; 39.9% in English at 1024×640, where the plot is 20 px shorter); without history 74 px
    (16.3%, 20.9%, 24.2%). At rest, with nothing selected, the lane is an empty band above the chart.
  - **Option (b), tighter spacing in the box, was measured and not taken.** It cannot reserve the lane alone: the top mark
    is 5 px below the plot's top and the box is 89 px tall. It only shortens the lane, and changes the approved box: padding
    9/10 to 7/8 and row gaps 4/5 to 3/4 saves 6 px live (7 delayed); 6/7 and 2/3 saves 10 (12); 5/6 and 1/2 saves 14 (17).
    The lane does not need it.
    At rest its left is within 0.001 px of that at every stop. Centred on its stop, the box's number starts at one place
    against the stop's hairline at every stop the plot's sides do not stop (a spread of 0.001 px in AR and EN, live,
    delayed and without history, in both fonts, at 7:42 PM, 10:00 PM, 12:05 AM and closing).
  - **Deleted with the floating placement:** `tipPlacement` (side, flip, clamp, `center-above`/`center-below`,
    `shift-up`/`shift-down`, the 11 px clearance), `tipPin` and the 12 px gap, the vertical part of the tooltip's ease, `tipAnchor`,
    `tipForce`, `follow.tipTarget`, the peak tag's `is-covered` toggle and its CSS.
  - **Measured (Windows machine, headless Chromium, run `owner_lane_r04_s04`; the probes are outside the repository):**
    - **Rest sweep:** every snapshot from 7:42 PM to closing (318), every stop, AR and EN, live, delayed and without history,
      web and fallback fonts, at 1440×900, 1280×800, 1024×640 and 390×844: 149,776 tooltips per viewport. The box's top was
      2.000 px in all of them (at 8ae88f3 it took 976 to 4,632 distinct values per viewport), its left within 0.0006 px of the
      rule, and it lay inside the plot and the card, with no wrap and no clip. Nothing was painted in the lane: the smallest
      gap from the lane's bottom to the highest mark (the "80" label's box) was 8.00 px in every one, and the lines sampled
      every 1 px never came nearer. The tooltip text, `aria-valuetext`, the box's width and `tipWidth` equal 8ae88f3's in
      every one.
    - **Motion (virtual 60 fps clock):** 360 runs, 291,624 frames (pointer sweeps at 3, 10 and 30 px per frame both ways, keys
      including Page keys, Home and End, onto and off the missing span, and 40 new readings with each of seven stops
      selected), AR and EN, three states, four viewports, both fonts. The box never moved vertically (0.00 px, against up to
      368 px at 8ae88f3). Its x reversed 0 times in a monotonic sweep (96 times at 8ae88f3). On Home and End the box moves
      with the ring in the same frame (at 8ae88f3 it took 37-38 frames to arrive, up to 963 px behind the ring; now its
      centre is at most 26 px from the ring's). Every settled frame equals the reduced-motion rest (0.001 px). The connector's
      path met the box and the ring in all 291,624 frames, and its x stayed inside the box. **Corrected by the lane fix
      round:** that read the path's endpoints, not what is painted; the last dash or dot of the dashed and dotted forms
      stopped short of the box by up to 2.94 px (dashed) and 3.46 px (dotted), and the missing-span pointer's tip was up to
      1.06 px from the nearest lit dot. See "Lane fix round" below. The box follows the ring's curve: at 1×, one stop along the line takes 100, 283 and 517 ms to cover 50%, 90% and
      99% of the step, the same as the ring (0.5×: 183, 550, 1033 ms; 2×: 50, 150, 267 ms).
    - **Held at the plot's side:** while the ring is between the plot's edge and the point where the box, standing at its 2 px
      margin, would be centred on it, the box stands still (it is clamped), and then follows the ring at its speed. The literal
      rule "at least 2 frames under 0.05 px while more than 1 px from rest, then a frame over 3 px" flags this 66 times in 360
      runs (all at the plot's side, none elsewhere; the longest stand is 8 frames). In each the box's step is at most 0.98 of
      the ring's step in that frame, so the box is following the ring, not catching up.
    - **Quality (real time):** 0 console or page errors in the six states; 0 long-animation-frames and 0 long tasks; the
      largest frame gap was 50.1 ms (8ae88f3: 50.1 ms, twice, in its own run); layout shift went from 0.022-0.033 to 0.00001 or
      less at desktop (1440×900 and 1280×800 only; at 390×844 see "Lane fix round"), because the box is placed by transform. There is no horizontal page scroll at 1440×900 and 1280×800; at 1024×640
      (22 px) and 390×844 (387 px) the page already scrolls sideways at 8ae88f3, by the same amount.
    - **Accessibility tree:** identical to 8ae88f3's in 32 of 36 snapshots (six pages, six phases each). It differs in the focus
      phase for live and delayed, in both languages: the peak's label «الذروة 62» / "Peak 62" is in the tree, as it is in every
      other phase. At 8ae88f3 the peak tag was hidden (`visibility: hidden`, which also takes it out of the tree) whenever a
      box lay over it; the box no longer can, so that toggle is deleted.
  - It replaces the two-edge layout of `04984e9`, which the user rejected: nothing lined up, the number was split from
    its word, and the number jumped between ends when the marker crossed the peak or the latest stop.
  - The user approved this layout on 2026-09-26 from a rendered comparison.
  - Values, words, placement, marker B, the follow and the chart's screen-reader text are unchanged.
  - **Before:** the width followed the content, from 108 px up to 135.3 px, and the tooltip is anchored at the
    hairline. So its start-aligned number moved against the hairline between stops. In English it moved 9.0 px between
    the peak (117.4 px wide) and 7:00 PM (108 px); in Arabic, 1.35 px.
  - **First fix (`645bd70`):** every tooltip was 138 px wide, set by the widest content anywhere, the English
    missing-span stop («2:14 PM – 2:31 PM», "No reading", 135.3 px in Readex Pro, 133.6 px in Segoe UI, the fallback).
  - **Second (`92398dc`, the user's decision after the before/after review):** every tooltip that shows a number was
    a fixed 127 px: the widest of them at the 7:42 PM snapshot (the Arabic latest reading, 124.84 px in Readex Pro),
    plus 2 px, rounded up. With later readings the latest reading's tooltip grows ("10:42 PM", "12:12 AM"), so a fixed
    127 px fitted only that snapshot, and the box grew again at the latest stop.
  - **Now (the user's decision, 2026-09-27, repair 1): the width follows the chart.** `app.js` measures, from the
    chart's current stops, the widest tooltip that shows a number, adds 2 px, rounds up to a whole pixel and sets it
    as `--tip-w` on the tooltip. A tooltip shows a number when it has a value or the usual row: every stop but the
    missing span, and, without history, still ahead and no reading yet. So within one snapshot every numbered tooltip
    has one width, and the number and every row sit at the same place inside the box at every numbered stop: since the lane
    round the box is centred on its stop, so the number keeps one distance from the stop's hairline at every stop the
    plot's sides do not stop (before, on each side of the hairline). The start-aligned layout above is unchanged.
    It is measured on hidden copies of the tooltips in one size-contained, `aria-hidden`, `visibility: hidden` box,
    out of the accessibility tree, never on the live tooltip, so nothing on screen moves. One measurement takes at most
    7.2 ms (about 40 copies), with no long task and no layout shift; an unchanged set of stops is not measured again.
  - **At the page's own 7:42 PM snapshot** it is 127 px in AR and EN, live, delayed and no history, as before; the
    widest is the latest reading (124.84 px in Arabic, 124.72 px in English, Readex Pro). With the fallback font
    (Segoe UI) it is 122 px until Readex Pro loads, then 127 px.
  - **Through the day** (a scratch check: "New reading" stepped from 7:42 PM to closing): the width moves with the
    latest reading, in Readex Pro 125-129 px before 10 PM, 131-135 px from 10 PM, and after midnight 142-145 px in
    Arabic and 132-135 px in English; in the fallback font 122-137 px. At every step, in AR and EN, live, delayed and
    no history, every numbered tooltip had that one width, and the number's start edge against its stop's x spread by
    at most 0.024 px per side. With the fixed 127 px of `92398dc` it was the same until 10 PM, then up to 5.6 px in
    English and 15.4 px in Arabic.
  - **The missing-span stop may grow:** it shows no number, so it alone may be wider where its content needs it: in
    English 135.27 px in Readex Pro and 133.59 px in the fallback; in Arabic it fits (111.0 px). No other stop grows,
    in either font.

**6b. The smooth follow (Round 7 step 2).** It replaces the Round 6 glide (120-150 ms, at most 150 ms). It is the
"follow" part of the motion section in `app.js`.

- **Choices the brief left open, with the reason:**
  - **First appearance: at once.** On the first hover the tooltip and the ring appear at once, as in Round 6, not over
    60-100 ms like the clip.
    - A fade would change glyph opacity, which the page never does.
    - The only other ways to appear gradually are a clip or a scale. At 100 ms or less they read as a flicker, not as
      softness.
    - The follow already gives the hover its smoothness. The tooltip also leaves at once.
  - **The old 240 px "move at once" limit is replaced by a 6-hour limit, measured along the time axis.**
    - The old limit would now trigger in the middle of fast sweeps on steep parts of the line, where the arc length
      between the ring and the pointer grows.
    - Beyond 6 hours of the day (about 380 px), the ring moves at once, and so does the tooltip, which is then more than
      half its width from its new place and moves with the ring (before the lane it eased across the plot and trailed the
      ring). That is Home or End from far away. Without the limit, the ring would race across the whole day in 400 ms.
- **Measured (in this cloud container, Chromium headless, 1440×900):**
  - **rAF sampling:** a mutation observer logged the ring's position at every paint, on six half-hour steps each in AR
    and EN. The covered arc length was, on average:

| After | 33 ms | 66 ms | 100 ms | 133 ms | 200 ms | 266 ms | 400 ms |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Clip (the brief) | 0.19 | 0.43 | 0.60 | 0.72 | 0.87 | 0.95 | settled |
| Model | 0.191 | 0.426 | 0.605 | 0.726 | 0.870 | 0.938 | 0.986 |
| rAF, AR (6 steps) | 0.188 | 0.414 | 0.599 | 0.721 | 0.868 | 0.937 | 0.986 |
| rAF, EN (6 steps) | 0.189 | 0.414 | 0.597 | 0.719 | 0.867 | 0.936 | 0.986 |
| Video, AR (4 steps) | 0.215 | 0.433 | 0.604 | 0.731 | 0.865 | 0.930 | 0.984 |
| Video, EN (4 steps) | 0.211 | 0.426 | 0.617 | 0.737 | 0.870 | 0.933 | 0.990 |

  - **Video:** real-time Playwright `recordVideo` recordings. A test-only strip in the corner carried the page's clock
    into every frame, so each frame is timed on the page's own clock from the key press. The ring was found by the red
    it adds to the page.
  - **On the curve:** at every sampled frame the ring's centre was within 0.0064 px of the drawn path. This was measured
    with `getPointAtLength`, independently of the page's own table.
  - **Sweeps:** a two-key sweep (the second key 55 ms after the first) and a four-stop pointer sweep each moved in one
    direction only, with no stop between stops.
  - **Timing:** 99% of a step is covered at about 450 ms; the last sub-pixel paint is at about 550-650 ms.

**7. Live update.**

- **F2, fixed (Round 7 step 2):** with the latest stop selected, the end point's halo used to flash for about 50-75 ms at
  the start of a live update.
  - The cause: whether the ring sat on the end point was tested against the new reading's end point, while the morph
    still drew the end point at its old place.
  - The test now uses the end point as drawn, so the halo stays aside for the whole morph.
  - Held frames and frame logs show no halo in any frame, AR and EN. The step-1 copy, as a control, shows it for the
    first 10-15% of the morph.
- **F5, fixed (Round 7 step 2):** the first move into the future used to block the main thread for about 180 ms.
  - The cause: the usual line's lookup table was sampled lazily with about 1,000 `getPointAtLength` calls.
  - Every path's table is now read from its own `d` and evaluated as the same cubic Béziers the browser draws, in well
    under a millisecond.
  - A point for a given time is solved on the curve itself, not interpolated.
  - With a long-task observer, the first move into the future shows no long task in AR or EN. The step-1 copy, as a
    control, shows one of 412-430 ms on this machine.
- **The pulse is calmer:** a 1px ring every 5 s, at 40% at most, reaching 28px. Round 5 used 3.6 s, 70% and 32px.
  There is no pulse while delayed.
**8. Rail.** It is transform-only and quicker than Round 5, at 240 ms open and 200 ms close instead of 300 and 240 ms.

**10. Motion off.** Motion is off with `prefers-reduced-motion: reduce`, with `?motion=off`, or with the tuner's

Motion switch; every change is then instant, and there is no intro. See "Evidence" for the static guard.

**11. The first-open intro (Round 7 step 3).** Round 7, decision 4. It is "the first-open intro" part of the motion

- **When it plays:** only on the first open of the page in a browser tab.
  - A flag in `sessionStorage` (`fitway.eclipse.v3.intro`) marks the tab. It is interface state, never visitor data.
  - So F5, a reload, the language link and any other return in the same tab have no intro.
  - A tab the owner opens plays it: a new tab, a typed address, or a link opened in a new tab. These start with empty
    session storage.
  - Some tabs inherit session storage and so probably do not play it: a tab the page opens with `window.open`, a
    duplicated tab, and a tab Chrome restores after a restart. This is the known limit the user accepted on 2026-09-26;
    there is no workaround.
  - The flag is set on every open, also with motion off, so the intro belongs to the tab's first open only.
- **What is still from the first paint:** every surface (the glass cards and their lights, the wash, the rail), every
  label, unit, time of day and reference value (the usual entries, the average), the level chips, the header's status,
  and the chart's grid, axes, legend and usual Wednesday line.
  1. **The answers**, 0-400 ms: Inside now, Today's peak, Entries and Busiest time roll into place with the page's own
     digit roll, from below into the digits' ink box, all together. Each value is one slot: «6-8 م» rolls with its own
     «م», which is part of the time, unlike a unit such as «تقريبًا».
  - The DOM text is the final value from the first paint; only its position in the clip changes.
  - Each ends exactly at its still frame (see "Evidence").
- **Screen readers:** nothing leaves the accessibility tree during the intro. The answers' text is final from the first
  paint. The peak's label («الذروة 62», "Peak 62") waits out of sight by an empty clip until the line arrives, never by
  `visibility` or opacity, so it stays in the tree. The intro announces nothing (the live region stays empty).
  - Checked: the accessibility tree held at 0, 200 and 500 ms equals the still page's, in AR and EN, live, delayed and
    no history (Chromium's full tree over CDP). Before this fix, «الذروة» / "Peak" and «62» were missing for 0-640 ms.
- **Fonts and performance:** it starts only once both weights of Readex Pro are loaded for both scripts, and the tab is
  visible, after the first paint and a frame for the final geometry, so no font swaps mid-intro.
    No-store, no-cache, max-age and no-header servers each showed one request per file on first opens and reloads;
    the old no-store script-delay cases fetched each twice. Missing Latin logged one error in all 20 cases;
    BASE logged two in 3/4 no-store cases.
  - The approximately 100 ms Chromium first-paint font hold remains. With fonts held 600 ms, first-paint
    medians were 232/220 ms AR/EN, versus 128/124 ms without the early-load script (three runs per condition),
    a 104/96 ms difference. A scratch RenderBlockingFonts-disabled control gave 132/136 ms; ordinary runs use
    unchanged browser flags. No application content-hiding rule is added.
  - **The cap is 200 ms from the first paint** (user decision, 2026-09-26). It replaces the designer's 1 s cap, because
    Round 6 said content is never hidden while the fonts load. So the answers wait only on a first open, and the cap is
    200 ms, counted from the first paint entry, after the render-blocking scripts complete. The still page then
    needs one more frame or so to paint. In this round, 600 ms local holds showed answers 205.7-224.4 ms after
    first paint (20 runs); capture measured 225/223 ms AR/EN. Paint-aligned 230/600 ms releases also stayed
    inside 250 ms. In earlier rounds,
    with each font file held 600 ms, the answers were in view 153-231 ms after
    the first paint across the recorded runs, inside the capture's 250 ms gate: 153-211 ms in the intro fix round,
    195-231 ms in its verifier's re-check, 179-203 ms in the follow-up round, 157-220 ms in its verifier's check (the
    committed log of `92398dc` has 174 and 215 ms), and 203-222 ms in repair 1's two runs. So it can land either side
    of 200 ms (see "Measured").
  - **When the fonts miss the cap,** there is no intro. The owner sees the still page at once: the numbers in the fallback
    font until Readex Pro arrives (as on a page without an intro), and the line whole. The tab's flag is already set,
    so a reload in that tab has no intro either.
- **Tuner:** the intro speed (0.5× to 2×) divides every duration; "Replay intro" plays it again on the current page. See
  "Light tuner".
- **Choices the brief left open, with the reason:**
  - **Only the four answers roll.** They answer the owner's first question. Times of day, the usual entries, the average
    and the level chips are context, and less motion is the page's default.
  - **The numbers and the line start together.** The numbers settle by 400 ms, well before the line (914 ms), so they
    are read first without a delay that would lengthen the whole.
  - **Grid, axes and the usual line are still.** They are the instrument's frame and the reference that today's line is
    drawn against, not today's data.
  - **The landing:** the live end point grows out of the pen's tip, so the drawing ends on it. The peak ring uses the same
    swell, and its label appears at once, because text never fades.
  - **Delayed:** the stale number stays still and the grey end point simply appears, so nothing stale gains an arrival.
  - **Yielding:** settle at once rather than hurry, so a hover or a new reading always meets the real page.
  - **Waiting for the fonts:** the answers are hidden (by the slot's clip, never opacity) for as long as the fonts take,
    up to the 200 ms cap from the first paint; with slow fonts the answers were in view 153-231 ms after the first
    paint across the earlier recorded runs. Local fonts are normally ready at first paint; see this round under
    "Evidence". The browser may first hold paint for a pending preload, as measured above.
  - **The peak's label while it waits** (intro fix round): an empty clip (`inset(50%)`, like the page's `.sr-only`),
    so it is out of sight but stays in the accessibility tree. It is the only text the intro hides. The answers already
    wait by a clip. The line's parts, the end point and the peak ring keep SVG `visibility`, because the chart's SVG is
    `aria-hidden` and carries no text.
- **Measured (on the original Windows machine, headless Chromium, 1440×900):**
  - **capture.mjs:** each first open played and settled in 849-876 ms from its start (the 820 ms design plus a frame to
    start and a frame to finish). No long task (> 50 ms) and no font load ran during any intro, in AR and EN, live,
    delayed and no history.
  - **Real-time recordings** (Playwright `recordVideo`, decoded frames timed on the page's own clock):
    - AR: the answers show from 24 ms and are settled by 220 ms; the line starts at about 50-100 ms, reaches now at
      663 ms, and the end point and the peak ring are whole by 814 ms.
    - EN: the answers show from 26 ms and are settled by 338 ms (the next decoded frame after 285 ms); the line reaches
      now at 645 ms, and the end point and the peak ring are whole by 772 ms.
    - The recordings hold about 22 frames in the intro (headless Chromium paints at about 30 frames per second).
  - **Font wait:** 17-28 ms with a warm cache (a second tab, or the capture's font cache); 390-1010 ms for a cold
    network fetch in a fresh context in the step 3 runs.
  - **Re-measured in the intro fix round** (capture.mjs, two runs into `evidence/`, the 200 ms cap):
    - Each first open with the font cache played and settled in 846-883 ms from its start, with a font wait of
      17-28 ms. No long task and no font load ran during any intro. The recordings above were not re-made; the intro's
      motion is unchanged, and the held 2x frames at 0, 120, 350 and 700 ms equal `d4d019a`'s pixel for pixel (AR and EN).
    - A cold network fetch now misses the cap: the capture's first AR page had no intro in both runs (font wait 205 and
      212 ms, `fonts late`).
    - With each font file held 600 ms: no intro, and the answers are in view 153-211 ms after the first paint (the cap,
      plus the frame that paints the settled page). Held 50 ms: the intro plays; font wait 62-69 ms.
    - With the files held 600 and 1400 ms (a scratch check), the page at 100 ms after the first paint still has its
      answers out of sight and today's line undrawn. From 200 ms it is the still page, in the fallback font, and once
      the fonts arrive it equals the still frame.

**Deviations from the brief, and choices it left open**

- **No tabular figures:** Readex Pro has none. Its digit widths are the same with and without `tabular-nums`, for
  example 0 is 28.9px and 1 is 24.0px at 46px.
  - Fixed-width digit boxes, or another font for numbers, would change the page at rest, which must stay
    pixel-identical.
  - So each rolling slot eases its width from the old digit's to the new digit's over the same 280 ms. The width
    glides a few pixels instead of jumping.
- **Rolls direct, not through intermediate digits:** a digit rolls straight from old to new; 2 to 5 does not spin
  through 3 and 4. This is calmer and stays legible at 280 ms.
- **One live region:** a single polite region announces the whole update once, rather than a region on each number,
  so two numbers never compete.
  - While delayed, the minute passing is not announced, because no reading arrived and the header already says
    delayed.
- **Tooltip timing:** the tooltip appears and leaves at once, with no fade, to keep the no-opacity-on-glyphs rule. It
  then travels with the marker (Round 7 step 2; see 6b).

## Open and capture

It serves the folder on `127.0.0.1:3173` and uses a fresh Playwright chromium context per frame. Frames are at
deviceScaleFactor 1, and 2 for the crops. The still frames use reducedMotion "reduce", and the motion part uses
"no-preference". It writes everything under "Evidence" and `capture-log.json` into `outDir` (default `evidence/`), and
takes about five minutes. It exits with code 1 if any check below fails.
- **Fonts:** the four Readex Pro woff2 subsets and their OFL licence sit beside `fonts/readex-pro.css`. The
  stylesheet keeps Google's exact weights, display and ranges, replacing only source URLs; no font request leaves
  the page's origin. The CSS faces also load directly from file; preloads are inserted only for HTTP/HTTPS.
- **Round 7 step 2:** it was first run only in the cloud container, into a scratch folder. Every check not built on the
  Windows hashes passed, including `chart`, `follow`, `marker`, `roll`, `delayed`, `live` and the tuner. The hash-based
  ones failed as expected. On 2026-09-26 it was run on the original Windows machine into `evidence/` (see "Evidence").
      the end after the holds. At 2x one glyph («6-8») rasterizes in one of two ways on this machine, with no intro
      too. So if an end differs, one more still and one more of that end are rendered, and the end must equal one of
      the still renderings.
    - (the follow-up round after step 3; repair 1) the tooltip at every stop: one width on the page except the
      missing-span stop, which may only be wider (and never narrower than its content); that width is the widest
      tooltip that shows a number, plus 2 px, rounded up, and the page reports the same (`measuredByPage`); no row
      wrapped or clipped (`tooltip` per page, and `tooltipWidth` across pages, where it is 127 px on every page at the
      7:42 PM snapshot);
## Evidence

- **Single-fetch repair (2026-09-30), run `owner_fonts_r04_s09_r1`:** Chromium 149.0.7827.55; fresh serial probes
  are in D:/fitway-scratch/introspeed/fixq4/r1/resume/. The design-context check passed, and the frozen-lockfile
  install was unchanged. Scope stays inside Eclipse; production, authority, pre-motion hashes and .impeccable
  stay unchanged.
  - 800/800 cases: no-store, no-cache, max-age, no header and file; AR/EN; 1440x900, 1280x800, 1024x640, 390x844;
    reduced/full motion; first open/reload; normal, 40/150/600 ms font holds and 100 ms app.js delay. Each expected
    Arabic/Latin file was requested once, complete text was present at first paint, and console/errors/external requests
    were zero. All observers were supported; sampling continued at least 550 ms after the intro end.
  - Normal/40 ms/script-delay cases have no shifts apart from the amended narrow busy note. 150 ms readiness has
    a complete final-font frame before running; intro shifts, long tasks and glyph-opacity records are zero. All
    40 full-motion first opens with 600 ms fonts skip the intro: expiry +199.8-215.0 ms from first paint; answers
    are in view +199.3-228.2 ms. The 200 ms cap and both frame waits are unchanged.
  - 16 HTTP and 4 actual file missing-font cases log exactly one error/request. In 6/6 no-store script-delay BASE
    comparisons, both files were requested twice; the candidate requests each once. Missing Latin in BASE logs
    two errors in 3/4 cases, one in the fourth. Other server headers were never changed to make a check pass.
  - 56/56 still pairs, including EN delayed 1024x640, are byte-identical to BASE, with equal rects, DOM and AX.
    These cover both languages, all three states, all four sizes and both motion preferences, plus rail, hover,
    details and tuner states at desktop. Primary /root inspected the 56 exact frames named in resume/inspection.json
    through their downscaled views. This is font-regression inspection, not concept selection or visual promotion.
    Full AX comparisons at first paint and rest pass all 6 language/state pairs; final text agrees and the live
    region stays silent. Interactive Browser checks cover details, chart End and locale reload, with zero logs.
  - Controls: postpaint width change 2/2; duplicate fetch 2/2; long task/opacity 2/2; preserved plantQ 2/2 (90 ms
    tasks, 3 shifts, 5 opacity records and a page error); cap raised to 1000 ms plays 2/2 at 600 ms; pixel plant
    differs by exactly 1 px; AX-label plant caught. The harness catches duplicates on first open/reload and
    console log/warn/error/pageerror/secondary-tab messages. Removing both frame waits catches 3/10 aligned
    late starts; this control is timing-sensitive. A CRLF-sensitive plant and wrong terminal-state expectation
    were corrected in scratch; fixture fonts were fulfilled locally from the existing files.
  - Intro API totals stay 1171/2342/585.5 ms at 1x/0.5x/2x (400/914/257 ms at 1x), with unchanged easings/order.
    Observed replays are 1212.9-1213.6 / 2378.5-2379.8 / 627.6-628.7 ms including scheduling frames; the live
    roll stays 280 ms. No intro task/opacity regression occurs. There are 206 prepaint tasks of 50-66 ms in the
    800-case matrix; the matching timing sample has BASE 9/60 (52-60 ms), candidate 6/60 (54-61 ms). A trace
    attributes initial app.js evaluation to 48.49 ms, including a 26.783 ms forced layout; app.js is byte-unchanged.
  - The retained font paint hold is 104/96 ms AR/EN against the no-early-load control; a feature-disabled control
    also removes most of it. Ordinary probes and capture use unchanged browser flags. No content-hiding rule is added.
  - The sole standalone capture exited 0, with zero duplicateFontRequests. Its 86 exact comparisons passed;
    6/6 intro ends and 6/6 reloads equal stills; motion-off 9/9 matches. Capture replays measured 1191/2358/612 ms
    at 1x/0.5x/2x. The file tuner, local font holds, chart, follow, roll, rail and yield checks all pass.
    Raw output is committed as written: capture-log.json changes timestamp, real-time measurements and the new
    empty duplicate counter; intro-yield-ar.png differs in 47,712 pixels (box 115,172 to 1818,1049), from measured
    settle-time captions and the in-flight rail phase. Settled rail stills are byte-equal; all other generated
    images are byte-identical to BASE. The inherited live-update raster mismatch remains (DOM equal), as recorded below.
  - First paint and font-geometry swap medians below are milliseconds from navigation, 3 runs per cell, BASE to
    candidate. Geometry can change before first paint; these times do not claim a visible postpaint swap. Full
    medians/ranges, final-font frame and intro-start times are in resume/summary.json.

  | Server / condition | First paint AR | First paint EN | Geometry swap AR | Geometry swap EN |
  | --- | --- | --- | --- | --- |
  | no-store / normal | 116 to 120 | 108 to 108 | none to none | none to none |
  | no-store / font 40 | 120 to 120 | 108 to 112 | none to none | none to none |
  | no-store / font 150 | 200 to 200 | 200 to 200 | 173.5 to 180.1 | 176.3 to 183.1 |
  | no-store / font 600 | 236 to 232 | 204 to 216 | 619.2 to 626.9 | 619.8 to 633.1 |
  | no-store / app 100 | 212 to 188 | 196 to 188 | 181.1 to none | 162.7 to none |
  | none / normal | 124 to 124 | 108 to 108 | none to none | none to none |
  | none / font 40 | 120 to 120 | 112 to 112 | none to none | none to none |
  | none / font 150 | 204 to 212 | 200 to 200 | 178.1 to 189.6 | 175.4 to 189.1 |
  | none / font 600 | 228 to 212 | 212 to 220 | 619.2 to 628 | 633.8 to 627.4 |
  | none / app 100 | 192 to 196 | 192 to 180 | none to none | none to none |

- **Self-hosted font round (2026-09-30), run `owner_fonts_r04_s09`:** Chromium 149.0.7827.55; serial probes on
  3176 and the sole evidence capture on 3173, exit 0. Four downloads match Google byte for byte (93,204 bytes);
  the eight face rules match exactly. The OFL wording is intact; one upstream trailing space at line 21 is removed
  for the repository whitespace gate. Arabic and Latin supply the first screen (54,292 bytes).
  Six natural HTTP origin/preload checks have zero external requests, warnings and errors. Both file-origin
  languages load both weights/subsets without warnings or errors; capture's file tuner/crowd/marker errors are 0/0/0.
  First-paint medians (ranges), AR/EN, normal: 120 (116-124) / 110 (104-120) ms; `a6cfde8`: 100 (56-120) /
  96 (60-104) ms, 20 first opens each. Natural un-routed local responses also pass 10 opens per language.
  Normal 20/20 and 40 ms/script-delay 10/10 intros per language play without shifts; reloads 10/10 stay still.
  Independent box sampling also shows zero geometry drift for normal, 40 ms and 100 ms script delay (5 each).
  Request-held 150 ms fonts swap in all 20 runs, 41.3-82.5 ms before the intro; intro shifts, overlapping long
  tasks, glyph opacity and errors are zero. Paint-aligned +150 ms releases play 6/6, with final-width callbacks
  11.6-16.7 ms before start. The cap's directly recorded anchor equals first paint in 24/24 paint-aligned runs.
  Request-held 600 ms fonts play no intro in 20/20 runs; answers appear at +205.7-224.4 ms. +180 ms readiness
  straddles the cap (4/6 play); +230/+600 ms releases play 0/12, with answers within 250 ms. A later font swap
  remains allowed after the still page appears. Capture's local holds are 51-615 ms; its 600 ms answers appear
  at +225/+223 ms AR/EN. All hold checks require actual local font requests and measured holds.
  Full first-paint/rest accessibility trees and DOM text match AR/EN × live/delayed/nohistory (6/6); the live
  region stays silent. Intro effects remain 400/914/257 ms; timing checks pass 178/178 on both versions.
  Candidate first opens last 1187.2-1201.5 ms; 1×/0.5×/2× replay readouts remain 1171/2342/586 ms, with measured
  durations 1191.2-1194.9 / 2358.3-2360 / 608.3-610.4 ms. Live digit and morph effects remain 280 ms.
  Normal candidate pre-paint long tasks: zero. Slow-font load probes record 19 pre-paint tasks of 54-62 ms;
  separate traces measure app.js initialization at 43.4-49.7 ms, including 22.0-26.9 ms forced layouts, but do
  not reproduce those >50 ms tasks. No long task overlaps an unplanted intro.
  Controls: literal one-frame +120 px text-box width change 6/6; planted long task/opacity 6/6; plantQ's
  shift/long task/opacity/error 6/6; 1000 ms cap 6/6; false DOM/full AX value 2/2; 1 px bar plant changes 80 pixels.
  An inherited width plant targeted an absent selector and produced errors; the literal-width control above
  replaces it. Removing both pre-intro frames detects 12/12 swaps: 7 occur during the intro, 5 precede it by
  6.2-7.1 ms (CLS 0.0003904962 AR / 0.0007713565 EN). Those 5 change width 76.625→75.71875 while pending,
  then keep width 75.71875 throughout running frames. Historical 3 misses likewise preceded start by 6.8-7.3 ms.
  Still matrix: 59 frames, AR/EN × 3 states × 4 sizes × 1×/2×, 8 action frames and 3 presets. 57 equal `a6cfde8`
  byte for byte. Only EN delayed 1024×640 differs: 70 pixels at 1×, 252 at 2×; all 354 body-element rects match
  after excluding the predecessor's non-rendered script nodes (including all 8 bars). Exact-rect overlay
  differences are 0 here versus 70/252 at baseline; paint bottoms are 266/532 versus 267/534. Each local 600 ms
  hold reproduces its baseline PNG byte for byte (0 pixels). Rounded bar corners retain normal raster coverage.
  Codex personally inspected exact `file2-frames/{lang}-{state}-{size}@1x.png` frames for AR/EN at 1440×900,
  1280×800, 1024×640 and 390×844, all action/preset frames, both exception triptychs, and first-paint 1440/390
  captures in `D:/fitway-scratch/introspeed/fixq4/work/results/`. A separate rendered reviewer inspected desktop,
  mobile states, both exception triptychs and corrected normal-intro first-paint frames; this is preservation
  evidence, not mobile visual approval. Normal first-paint screenshot panel 0 uses the incumbent intro's clips.
  Capture changed only its log and 3 PNGs: intro-yield-ar (52,799 pixels, natural capture phase), motion-contact-sheet
  (164 pixels) and motion-roll-ar-2x (486 pixels, raster variation). Four repeat sequences per version give
  identical hash sets for all 8 held-roll cells; the 4 varying cells each have the same 2 rasters on both versions.
  Codex also inspected exact evidence/intro-yield-ar.png, motion-contact-sheet.png and motion-roll-ar-2x.png
  downscaled. All static files and intro held sheets are unchanged. The legacy live-update canonical comparison remains
  false, identically at 1,149 pixels by 1/255, with equal DOM; it is not a new failure and its gate is unchanged.
  Existing mobile overflow remains 662 px AR / 709 px EN at 390 px; compact 1024 age/meta clipping also remains.
  Firefox, Safari, real network throttling and a human screen-reader pass were not run. No gate was relaxed.

- **Repair 4 (2026-09-28), scope and method:** before is `a14009f`; the R5 reference is `3b1c3da`, and the
  ordinary-hover reference is `6123863`. Probes extend the repair-3 scratch probes, served on 3176 with repository
  Playwright on this Windows host. Readex Pro is loaded for web-font runs; Google Fonts requests are blocked for
  fallback runs. Every state/language/font combination is covered unless a row explicitly narrows it. Fake-clock
  frame steps are compared with the largest 16 ms fraction from `chart.response()`, times anchor distance, plus
  0.5 px. Same-mode immediate width growth is excluded from anchor travel, as required; mode changes use box
  travel. Rest equality uses the rendered rectangle and a 0.01 px limit. The still-at-end check uses the first
  rendered frame after the 280 ms morph, not a new target beginning on the last pre-end frame.

  | Row | `a14009f` before | Repair 4 after |
  | --- | --- | --- |
  | S | 599,104 boxes; minimum 11.0000 px; 0 below 11 | Same 599,104 boxes; 0 changed rectangles/modes; maximum coordinate/size delta 0 px; 0 below 11 |
  | GAP | 720 moves; 2,578 over-allowance frames; 360 stall-then-jumps; largest step 95.8907 px | 720 moves; 0 over-allowance frames, stalls, errors or settled-rest failures |
  | NH | 640 selections; 88 page errors and 88 wrong resting boxes; selected text itself matched | 640 selections; 0 page errors, wrong boxes or text mismatches |
  | R5 | 11,762 bad cases of 24,187; 67,962 bad frames; edge range -1 to 14.390625 px | 0 bad cases/frames of 24,187/1,547,968; edge range 11.546875-12.390625 px; `3b1c3da` also has 0 violations on the same set |
  | M1 | 16,310 changed-rest cases; 12,425 over-allowance cases; 40 still frames at morph ends; 0 settled-rest failures | Same 16,310 cases; 0 over-allowance cases, morph-end still frames or settled-rest failures |
  | M2 | 2,708 ordinary-stop transitions; 0 stalls; median 434 ms in all 12 combinations; p90 live/delayed/no-history 484/517/467 ms | Every per-case result equals before; median/p90 no slower than `6123863`; see the comparison limit below |
  | E | Both committed 7:42 PM hover PNGs equal `6123863` byte for byte | Both remain byte-identical |
  | G | 14 of 17 refusals; 3 main-checkout paths accepted with TEMP/TMP=`D:/Projects` | 17/17 refused before any write; real scratch accepted; `--plant=once` exit 0, `--plant=always` exit 1 |
  | I | Committed baseline; old repair-3 report records two exit-0 captures | Two final captures exit 0; 70 exact comparisons each; 0 persistent differences |
  | J | Quality sequences: 16 no-history page errors; 0 long frames/tasks, rAF gaps over 50 ms or non-input shifts | 0 errors/long frames/tasks/gaps/non-input shifts; 12/12 initial accessibility trees equal before; 24/24 planted busy-loop controls detected |

  - **S:** all 318 snapshots and every stop, AR/EN, live/delayed/no-history, both fonts, at each of 1440×900,
    1280×800, 1024×640 and 390×844 with reduced motion: 48 combinations. This is a rendered rest check, not a
    claim about clearance along a moving path.
  - **GAP:** five snapshots (8:43 PM, 9:30 PM, 10:00 PM, 10:42 PM and 12:05 AM), one/two/three stops away,
    both directions, onto and off the gap. The before failure is the positive control for stall/jump detection.
  - **NH:** every 40-stop no-history snapshot by actual pointer sweep and slider keyboard stepping, motion on/off,
    AR/EN and both fonts. The before failures occur only with motion on. Selecting a future stop now uses its own
    no-history fallback anchor and settles at the same box and text as reduced motion.
  - **R5:** web fonts, all three states, every width-changing reading and selected ordinary side placement that
    retains its mode throughout the 64 sampled frames. The live-only range after is 11.984985-12.015015 px;
    the wider all-state range includes the no-history axis tick's rendered centre. Fallback runs also had zero
    violations on their 294 stable-mode cases. A mode change is measured by M1, not assigned a fixed edge gap.
  - **M1:** full-day discovery tests every selected stop before/after every minute. Changed-box counts by web/fallback:
    AR live 1,671/653, delayed 0/0, no-history 1,276/372; EN live 5,663/704, delayed 28/0, no-history 5,515/428.
    The 28 delayed EN web boxes at the 7:59 PM tick change their corner through immediate width growth; their
    pinned anchors stay put, as the width rule requires. Actual anchor changes take the reading ease path.
    An earlier broad end-window diagnostic flagged AR fallback minute 186/h1080 at 272 ms: that is a new mode
    target before the morph ends. Its next two frames move 1.671875 and 3.0625 px; it is not a stopped end frame.
  - **M2 comparison limit:** "as in repair 3" uses each combination's median and p90 settle time (within 1 px of
    rest), plus stall count, on the same ordinary-track transition set. Against `6123863`, live p90 is 484 versus
    500 ms, delayed median is 434 versus 450 ms (p90 517 in both), and no-history p90 is 467 versus 484 ms;
    other medians are 434 in both. No combination is slower by those summaries. Per-transition equality with
    `6123863` is not claimed: 144/2,708 cases take 17-100 ms longer, inherited unchanged from `a14009f`.
    The ordinary follow's 90/15 ms response and displayed-velocity start are preserved.
  - **G:** the Git query starts at the output path's nearest existing directory before mkdir. It also checks
    parents when Git cannot report a work-tree root from inside `.git`; junctions and short names are canonicalised.
    Tests include all 14 previous refusals plus new/main-existing/`.git` paths in `D:/Projects/fitway` with TEMP/TMP
    pointed at `D:/Projects`. Refusal tests execute the exact extracted guard without any output write; the two
    plant controls are real capture runs into scratch.
  - **I, exact changed-frame justification against `a14009f`:** final run 1 has 68 immediate matches of 70;
    final run 2 has 67 immediate matches and one single-attempt AR no-history static noise. Neither run has a
    persistent difference. `intro-yield-ar.png` changes 52,444/54,991 pixels: action-time captions, in-progress rail
    width, selected tooltip text placement and rolling reading digits (the intro implementation is unchanged).
    `motion-contact-sheet.png` changes 565/299 pixels inside its follow/rolling-digit thumbnails.
    `motion-follow-ar-2x.png` changes 11,565 text pixels in run 1 with a 0.5-0.75 physical-pixel subpixel translation,
    while box/marker geometry is unchanged; run 2 is byte-identical to before. AR/EN `motion-roll-*-2x.png` are
    identical in run 1 and change 466/529 pixels in run 2, confined to mid-roll digits (0.25/-0.5 px translation).
    Every other PNG is byte-identical in both final captures. Two live intro-end hash flags remain false because of
    raster variation, while the canonical DOM flags and the exact same-run recapture gate pass; no tolerance was added.
  - **J:** observers start after font/intro settlement. Each of 24 before/after contexts covers End, four arrow
    selections, Home and one minute step at 1440×900. Expected blocked-font resource messages are excluded in
    fallback runs; other console messages and every page error are captured. A 90 ms `setTimeout` busy loop is
    recorded by the long-work observer and rAF-gap control in every context. All layout-shift entries have recent
    input, with no new source and CLS 0 before/after. Tooltip movement produces input-associated entries; the count
    is not zero: AR live web/fallback 53→53/52→51, delayed 52→54/53→51, no-history 21→52/20→50;
    EN live 51→54/51→55, delayed 56→54/55→55, no-history 22→52/22→52. The no-history increase accompanies
    the repaired box movement. Accessibility equality is the initial whole-body tree at the same selected stop,
    normalised only for ephemeral local ports; it is not a claim that erroneous before interactions had equal trees.
  - **Personal rendered inspection (Codex):** all six before/after strips were inspected:
    `gap-0843-{ar,en}.png`, `nohistory-0742-{ar,en}.png`, `width-1000-{ar,en}.png`, at 1440×900, web fonts,
    with captions pre/0/16/48/96/192/288/400/640/656/800 ms. The width example is h570 at 9:59→10:00 PM.
    Also inspected all 24 exact `rest-{ar,en}-{live,delayed,nohistory}-{1440x900,1280x800,1024x640,390x844}.png`
    frames (latest selection, 7:42 PM, web fonts), and every changed capture sheet in both final runs beside before.
    Existing narrow-screen clipping/overflow remains visible and outside this repair; this is not mobile visual
    acceptance or a selection of Eclipse for production.
  - **Reproduction files:** all scripts, raw JSON, final run-1 PNGs, pixel analyses and strips are outside the repo at
    `C:/Users/PCFORC~1/AppData/Local/Temp/claude/D--Projects-fitway-worktrees-owner-design-exploration-r04/f8e879d9-0fb6-4b39-948b-2404e2518cd5/scratchpad/repair4/work/`.
    `rest-probe.mjs`, `repair-probe.mjs`, `quality.mjs`, `guards.mjs`, `strips-final.mjs`, `report-numbers.json`,
    `motion-before.json`, `motion-final.json`, `readings-before-final.json`, `readings-after-fallback-final.json`,
    `r5-reference.json`, `nh-{before,after}.json`, `m2-{612,before,after}.json`, `guard-results.json`, `quality.json`,
    `capture-final{1,2}.txt`, `capture-pixel-summary.json` and `strips/manifest.json` record the exact scope.
    Browser controls: 25/25 ui-forensics selftests; image controls: 37/37 selftests. Impeccable detect returned `[]`
    for the changed JavaScript. These are corroborating prototype probes, not repository fast/phase/full verification.
    The brief excludes the known unrelated fast-ladder failure. No intro, light tokens, protected baseline hashes,
    `.impeccable` files, production files or coordinator-owned ledger files changed.

- **Repair 3 (2026-09-27), S and V:** the reduced-motion sweep from 7:42 PM to closing selected every stop at
  all 318 minutes, AR/EN, live/delayed/no-history, web and fallback fonts at 1440×900; the web-font live sweep also
  covered 1280×800, 1024×640 and 390×844 in both languages. Of 224,902 measured boxes, `6123863` had 15,317
  below 11 px and this repair has zero. Every placement clear at `6123863` is unchanged within 0.01 px. The changed
  boxes are 6,267 centred above, 6,930 centred above then shifted, 2,098 centred with a shift across the selected
  point's height, and 22 centred below then shifted (the sweep probe's `CA`, `CAS`, `CXS`, `CBS` classes). The
  largest move is 90.2034 px. The minimum rendered clearance is 11.0015 px at 1440×900, 11.0066 at 1280×800,
  11.0031 at 1024×640 and 11.0000 at 390×844. The centred-above gap from the rendered marker differs from 10 px
  by at most 0.082 px across these sizes.
- **Repair 3, M1 and M2 (historical, narrow probes):** the former "18 new-reading changes per combination"
  counted only a selected placement-mode class, 72 cases in four live language/font combinations. It was not a
  full-day count of changed resting boxes. The full repair-4 sweep above finds 16,310 such cases across the 12
  state/language/font combinations (including 28 delayed width-only changes), with 372-5,663 per live/no-history
  combination. The old 257-transition live ordinary-stop hover set had zero stalls; that claim did not cover the gap
  stop or still-ahead stops without history. At `a14009f`, the broader gap set has 360 stalls and the no-history
  pointer/keyboard set has 88 page errors. The unqualified zero-stall/error claims are withdrawn. The original
  ordinary-hover summaries were medians 434/445/443/444 ms and p90 498/496/497/497 ms, versus `6123863`
  medians 448/448/448/447 and p90 510/500/500/501 ms; these were live-only, direct after-frame fake-clock samples.
- **Repair 3, E/G/I/J and visual checks:** the two 7:42 PM hover PNGs are byte-identical to `6123863`. The planted
  guard refused 14 tested path spellings and overrides before writing, including paths in this worktree, relative,
  UNC and device paths, an invalid `--intro-frames` path, TEMP/TMP set to `E/` or the worktree root, and a temp
  junction into `E/`; a real temp scratch output ran successfully. `--plant=once` exited 0 and `--plant=always`
  exited 1. Two unplanted captures into `evidence/` exited 0, each with 70 exact comparisons and no persistent
  differences. Against `3b1c3da`, only the log, intro-yield AR sheet (timing), motion contact sheet (tooltip
  translation), and motion-follow AR crop (tooltip movement) changed; both hover stills and every other PNG stayed
  byte-identical. Those narrow repair-3 quality runs recorded zero errors, long animation frames, long tasks or rAF
  gaps over 50 ms and detected a planted 90 ms busy loop. They did not exercise the failing no-history future sweep;
  the current all-state results and input-associated shift counts are recorded above. In those narrow historical
  sequences tooltip-sourced shifts fell from 11 to 8 in AR and 11 to 9 in EN, with no new source. The AR and EN accessibility trees matched after normalising the ephemeral local
  port. Timed before/after strips for the 10:52 and 11:47 PM readings and a near-now hover were inspected in both
  languages at 1440×900. The 390×844 AR/EN frames were also inspected; the existing horizontal overflow remains
  outside this repair's scope. These checks measure behaviour, not human visual acceptance.
- **Repair 2 (2026-09-27), exact full-day sweep at 1440×900:** 318 snapshots and every available stop in
  Arabic/English, live/delayed/no-history, Readex Pro and blocked Google Fonts: 149,776 selections. At `622cd0b`,
  422 live selections per language and font covered the end point; the other eight combinations had zero. At
  `6123863`, the live counts were AR 588 and EN 589 with Readex Pro, AR/EN 569 each with fallback; the other eight
  combinations had zero. After repair, all 12 combinations have zero violations, and the minimum measured distance
  is 11.0019 px. Exactly those 2,315 failing boxes changed; every already-clear rectangle stayed within 0.01 px.
  The changed choices were 938 centred above, 1,365 shifted upward and 12 shifted downward; none needed centred
  below. The largest vertical shift was 48.53 px. The number's start-edge spread within a snapshot and placement
  mode stayed at most 0.024 px.
- **Repair 2 motion checks (historical at `3b1c3da`):** at seven settled snapshots per combination, 3,284 selected
  stops had no clearance violation.
  Three real-time placement-mode changes began with 0 px jump; 64 adjacent-stop follow transitions sampled frame by
  frame in both languages never covered the end point (minimum 11.0019 px). A selected box during a width-changing
  live morph (127 to 128 px, AR/EN, a stationary stop and the moving latest stop) kept a 11.987–12.013 px edge gap
  and at most 0.014 px number-offset spread over those four examples of the 280 ms morph. This was not an
  all-reading claim and did not survive repair 3; the full repair-4 R5 sweep above supersedes it.
- **Repair 2 plant and quality probes (historical, limited sequences):** 14 path forms were refused before writing,
  including UNC admin shares, device paths,
  short names and junctions; a scratch temp outDir was accepted. `--plant=once` exited 0 with 68 one-attempt noises
  and no persistent differences; `--plant=always` exited 1 with 68 persistent differences. In a same-run browser
  probe, the normal repair path made no long-animation-frame entries and no rAF gap over 50 ms; the planted 90 ms
  loop registered a 103–120 ms long animation frame and an 83–100 ms rAF gap. A planted 120 px prepend produced a
  0.0833 layout shift. Existing tooltip-sourced shifts were fewer after the repair (AR 28 versus 33; EN 30 versus
  32); no new shift source appeared. The AR and EN accessibility trees matched `6123863`, and no console errors
  appeared in those sequences. This does not assert that repair 3 had no errors in every state or interaction.
  These checks measure behavior and provenance, not visual acceptance.
- **Repair 2 captures into `evidence/`:** two unplanted runs exited 0. Each made 70 exact comparisons with zero
  persistent differences (68 matched on their first attempt). Both 7:42 PM hover frames are byte-identical to
  `6123863`. Against that commit, run 1 changed `capture-log.json`, `intro-yield-ar.png` (26,468 pixels),
  `motion-contact-sheet.png` (245), `motion-follow-ar-2x.png` (1,975), and `motion-roll-ar-2x.png` (466). Run 2
  changed the log, `intro-yield-ar.png` (20,987), `motion-contact-sheet.png` (108), and
  `motion-follow-ar-2x.png` (1,975). The intro sheet samples 50 ms after actions, so captions and in-progress rail,
  hover, and chart cells vary with action timing. The contact and follow changes are tooltip text glyph raster only;
  the box and marker geometry is unchanged. The AR roll change was confined to a mid-roll digit and returned to the
  committed pixels in run 2. No other frame changed.
- **Personal frame inspection (Codex):** the exact AR/EN 1440×900 frames at 8:43 PM and the five-case before/after
  2× crops per language show the box clear of today's end point. Exact 390×844 AR/EN frames were also inspected;
  this concept's existing mobile horizontal overflow remains outside this 1440×900 repair (document width 662 px
  in Arabic, 709 px in English). This repair is not mobile visual acceptance.

- **Still frames, 1440×900, Recommended:**
  - `daily-ar-1440x900` and `daily-en-1440x900`
  - `daily-ar-1440x900-hover` and `daily-en-1440x900-hover`: the peak stop with marker B, the hollow ring, and the
    start-aligned tooltip (label chip then time; number then word)
  - `-rail-open` (AR and EN)
  - `-delayed`, `-nohistory` and `-details` (full page), in AR
  - `daily-ar-1440x900-tuner-open`, with the Round 6 Motion group, the Round 7 step 2 hover speed and the Round 7 step 3
    intro speed and "Replay intro" (disabled here, with reduced motion). The panel is now taller than the frame and
    scrolls; its Copy values and Reset row sits at the fold.
- **The first-open intro (Round 7 step 3;** every `intro-*` sheet is rewritten on each run, and older ones are deleted
  first):
  - `intro-contact-sheet`: live, AR and EN side by side, 1440×900 at 2x, held at 0, 86, 171, 286, 500, 714 and
    1000 ms and at the settled end.
  - `intro-states-2x`: delayed and no history, AR and EN, 2x, at the start, the middle (457 ms) and the end.
  - `intro-detail-ar-2x`: 2x details in AR: the four answers at 0, 86, 171, 286 and 400 ms, and the line landing at 857,
    914, 943, 1000 and 1086 ms and at the end.
  - `intro-yield-ar`: 1x, the page 50 ms after a hover, keys, the rail, a tap, a new reading and a resize at 100 and
    400 ms into the intro. It is taken in real time, so it depends on timing and can differ between runs (for example,
    the digit roll of a new reading is caught at another point).
- **`marker-variants-ar-3x.png` (Round 7 step 2):** marker B only, tight 3x crops of the real AR page at rest, the
  tooltip hidden: on the line (5:00 PM), the peak, the latest reading live and delayed, still ahead (9:00 PM), the
  missing span (the lit dots), and still ahead without history.
- **Per preset (`v2`, `a-like`, `recommended`):** `preset-<id>-ar-1440x900`, `-nowcard-2x`, `-chart-2x`, and the
  light-only 1x captures `-nowcard-light` and `-chart-light`.
- **Other:** `daily-en-nowcard-2x`, `levels-nowcard` and `levels-chart`.
- **Motion** (every `motion-*` frame is rewritten on each run, and older ones are deleted first):
  - `motion-roll-ar-2x` and `motion-roll-en-2x`: held digit rolls. Inside now 49 to 48 at 30, 70 and 140 ms and at
    rest; 49 to 69 (only the tens digit moves); Entries 332 to 333; and the header time 7:42 to 7:43.
  - `motion-bars-ar-2x`: the third and fourth level bars filling, enlarged 4x, with the chip before and after.
  - `motion-follow-ar-2x` (Round 7 step 2): marker B following its stop along the curve, held at 33, 66, 100, 200 and
    400 ms after a new target. There is one fixed crop per run. It replaces the Round 6 glide frames
    (`motion-glide-ar-a-2x` and `motion-glide-ar-b-2x`), which are gone.
  - `motion-live-ar-tail-2x`: the line's tail around the end point, before, at 70 and 140 ms, and after (enlarged 3x).
  - `motion-rail-ar-open-0100ms`, `motion-rail-ar-close-0090ms` and `motion-rail-en-open-0100ms`.
  - `motion-contact-sheet`: all of them on one page. Its title now points to the intro's own sheet.
- **Round 5 frames:** the `motion-load-*`, `motion-light-*` and `motion-glide-ar-0090ms` frames are gone with the
  motion they showed. `motion-follow-ar-2x` reuses an old Round 5 name for the new follow frame.
- **Re-rendered on 2026-09-26 (tooltip layout close-out):** `capture.mjs` was run on the original Windows machine into
  `evidence/`, after the tooltip layout change. It exited with code 0.
  - Changed by design: the AR and EN hover frames (the tooltip layout). `daily-ar-1440x900-tuner-open` and
    `capture-log.json` now show step 2 (the hover speed, no Marker group); they had not been re-rendered since step 1.
  - Changed with no change in behaviour: `motion-contact-sheet` and `motion-roll-*-2x`, which differ between runs only
    by glyph raster and mid-roll timing noise.
  - New: `marker-variants-ar-3x.png` and `motion-follow-ar-2x.png`.
  - Removed, because `capture.mjs` no longer writes them: `daily-ar-1440x900-hover-b.png`,
    `daily-en-1440x900-hover-b.png`, `marker-compare-ar-3x.png`, `motion-glide-ar-a-2x.png` and
    `motion-glide-ar-b-2x.png`.
  - Every other PNG was rewritten byte-identically.
  - Base and candidate were also rendered with one script on this machine, from `file://`, in reduced motion and
    with `?motion=off`: 28 of 28 still frames without a tooltip (AR and EN, live, delayed and without history, the
    rail, details, the tuner open in AR and EN, each preset) and 452 of 452 frames at every stop other than the peak
    and the latest are identical. The 24 peak and latest frames differ, by design. The tooltip's words and the chart's
    screen-reader text are the same at all 476 stops.
- **Round 7 step 2, identity (in the cloud container):**
  - The step-1 folder and this step were rendered with the same script on the same machine, and compared pixel for
    pixel, with reduced motion and with `?motion=off`.
  - All 23 still frames are identical in both modes.
  - The peak hover with B is identical to step 1's `-hover-b`, in AR and EN, in both modes.
  - The missing-span stop is identical to step 1's form A there. The 5:00 PM and 9:00 PM stops, with and without
    history, are identical too.
  - Only the tuner-open frame and the latest stop (its new value) differ, by design.
  - With motion on, a hover that has followed and settled matches the still hover frame, except for a few faint
    raster differences on anti-aliased edges (at most 42/255 in AR). Step 1 shows the same kind with its glide.
- **Re-rendered for Round 7 step 3 (the intro), on the original Windows machine into `evidence/`, four runs:**
  - **Run 1, exit 1:** in AR delayed the fonts came over the network in 1007 ms, past the 1 s cap, so that page settled
    at once without an intro (its end still equalled the still frame). And the AR 2x end after the held frames differed
    from the 2x still in 142 fringe pixels on the «8» of «6-8 م» (max 32/255). Repair 1: the intro part got its font
    cache, and the 2x end is judged on an intro that plays by itself.
  - **Run 2, exit 1:** every intro check passed; the static guard flagged `preset-a-like-ar-1440x900`, a reduced-motion
    frame with no intro, by 67 fringe pixels on the same «6-8» (max 84/255): the known glyph-fringe noise.
  - **Run 3, unchanged, exit 1:** the static guard passed; in AR no history, both the natural and the held 2x ends
    differed from the 2x still by the same 144 fringe pixels on «6-8», so the still was the odd raster. Repair 2: when
    they differ, one more still and one more natural end are rendered and the end must equal one of the stills.
  - **Run 4, exit 0:** these files. No second rendering was needed.
  - Scratch checks behind repair 2: with no intro, the held sequence of clipped 2x screenshots left the page identical
    8 of 8 times; intros that played by themselves ended identical at 2x 11 of 11 times; held intros with clipped
    screenshots 4 of 5 times.
  - Changed by design: `daily-ar-1440x900-tuner-open` (the intro rows) and `capture-log.json`.
  - Changed with no change in behaviour: `motion-contact-sheet` (its title) and `motion-roll-en-2x` (mid-roll timing
    noise).
  - New: the four `intro-*` sheets. Every other PNG was rewritten byte-identically.
- **Re-rendered for the intro fix round, on the original Windows machine into `evidence/`, two runs, both exit 0:**
  - Every gate passed in both runs, including the new ones. Surfaces at the first frames: 6 of 6 first opens. Slow
    fonts: 4 of 4. The end after the held frames: 6 of 6, with no second rendering needed.
  - Static guard, both runs: reduced motion 25 of 27 pre-motion frames identical (the other two change by design), and
    `?motion=off` 9 of 9.
  - These files are run 2's. Changed by design: `capture-log.json` (the new gates).
  - Changed with no change in behaviour, compared with `d4d019a`:
    - `intro-yield-ar` (timing), `motion-contact-sheet` and `motion-roll-ar-2x` (mid-roll timing and glyph raster).
      `motion-roll-en-2x` differed in run 1 only.
    - `motion-follow-ar-2x`: it differed in both runs, the same way. A scratch check rendered the capture's follow
      sequence 8 times, on `d4d019a` and on this version, with cold and warm fonts. The crops fell into three
      renderings with no relation to the version or the fonts: `d4d019a` and this version each gave more than one,
      and they shared them. So it is the follow sheet's own run-to-run variation, not this change.
  - Every other PNG, including the three held intro sheets, was rewritten byte-identically.
  - Each new gate was shown to fail on a planted defect in a scratch copy, and to pass on the unchanged copy:
    - an outline left on the peak's label after a release fails the held end (6 of 6), while the natural end passes;
    - a light at half opacity until the start fails the first-paint probe, and a wash animation at the start fails the
      intro's first frame (6 of 6 each);
    - the old 1 s cap fails the slow-font check (the intro plays with the fonts held 600 ms).
- **Re-rendered for the follow-up round after step 3, on the original Windows machine into `evidence/`, two runs,
  both exit 0:**
  - Changed by design (the fixed tooltip width): `daily-ar-1440x900-hover` and `daily-en-1440x900-hover` (the same
    bytes in both runs), `motion-follow-ar-2x` and `motion-contact-sheet` (the follow's tooltip), `intro-yield-ar`
    (the hover, tap and keys cells show the tooltip; it is also timing-dependent), and `capture-log.json`.
  - Changed with no change in behaviour: `motion-roll-en-2x`, by 529 pixels in the two mid-roll cells (30 and 70 ms),
    the known mid-roll timing noise; it has no tooltip. `motion-roll-ar-2x` differed in run 1 only.
  - Every other PNG was rewritten byte-identically to `622cd0b`. `pre-motion-hashes.json` is unchanged: the AR hover
    frame was already listed as changing by design, and the EN hover frame has no pre-motion hash.
  - Recaptures: 70 exact comparisons in each run; 68 matched at the first attempt, none was noise and none differed
    twice. The other two are the frames that change by design (the AR hover and the tuner), which are not recaptured.
  - Tooltip: 138 px on every page; the widest content 135.27 px (the English missing-span stop, live, delayed and no
    history); at rest the number's start edge keeps one distance from its stop's hairline on each side, within
    0.01-0.02 px, in AR and EN, live, delayed and no history.
  - Slow fonts (this round): with each font file held 600 ms, the answers were in view 179-203 ms after the first
    paint (inside the 250 ms gate).
  - **Negative control** (scratch folders, not evidence): `--plant=always` put a 1px dot at (720, 450) into every
    page. The 39 comparisons whose frames hold that point differed twice and failed, and the run exited 1.
    `--plant=once` planted it only in the first attempt: the same 39 were reported as noise, and the run exited 0.
  - Scratch checks: keyboard (Home, then every stop) and pointer (onto every stop), AR and EN, reduced motion and motion
    on (read once the follow had settled). At all 40 stops the width was 138 px and the number's start edge against
    the stop's x spread by at most 0.024 px per side. Against the drawn 1 px hairline, which snaps to whole pixels, the
    spread is up to 0.95 px (each stop within 0.5 px); the tooltip is anchored at the stop's own x, as before.
- **Re-rendered for the 127 px width (the user's decision after the before/after review), on the original Windows
  machine into `evidence/`, two runs, both exit 0:**
  - Changed against `645bd70`: `daily-ar-1440x900-hover`, `daily-en-1440x900-hover`, `motion-follow-ar-2x`,
    `motion-contact-sheet`, `intro-yield-ar` (each shows the tooltip) and `capture-log.json`. Against `622cd0b` the same,
    plus `motion-roll-en-2x`, which was already the known mid-roll noise of the 138 px round and is unchanged here.
    Every other frame without a tooltip is byte-identical to `622cd0b`; the exception is `motion-roll-en-2x`, whose
    two mid-roll cells (30 and 70 ms) are the known mid-roll timing noise. `pre-motion-hashes.json` is unchanged.
  - Recaptures: 70 exact comparisons in each run; 68 matched at the first attempt, none was noise and none differed
    twice (the other two change by design and are not recaptured).
  - Tooltip: 127 px on every page, the missing-span stop aside (135.27 px in English; 127 px in Arabic); the widest
    numbered content 124.84 px (the Arabic latest reading, live and no history). The number's start edge against its
    stop's hairline spreads by at most 0.02 px per side, in AR and EN, live, delayed and no history.
  - Scratch checks: keyboard and pointer through all 40 stops, AR and EN, reduced motion and motion on (after the
    follow): the number's start edge against the stop's x spread by at most 0.024 px per side; between the peak and
    7:00 PM it drifts 0.01 px (AR) and -0.01 px (EN). The missing-span box keeps a 12 px gap from its stop in both
    languages and both fonts (EN: 12.00 px at 135.27 px and 133.59 px wide; AR: 11.98 px at 127 px). No stop's side
    changed against the 138 px round.
- **Re-rendered for repair 1 (the width follows the chart; both sides recaptured), on the original Windows machine
  into `evidence/`, two runs, both exit 0:**
  - `daily-ar-1440x900-hover` and `daily-en-1440x900-hover` are byte-identical to `92398dc` (127 px at the 7:42 PM
    snapshot, as before), and so is every other still frame.
  - Changed against `92398dc`, with no change in behaviour: `capture-log.json`; `intro-yield-ar` (its cells are
    50 ms after an action, mid-motion, and its captions carry the settle times; runs 1 and 2 also differ from each
    other); `motion-follow-ar-2x` and `motion-contact-sheet` (glyph raster of the held follow's tooltip text, in a
    different row in each run; the box and its place are the same; the follow sheet's known run-to-run variation).
    `motion-roll-ar-2x` differed in run 1 only (466 pixels in the mid-roll cells, the known mid-roll timing noise).
  - Recaptures: 70 exact comparisons in each run; 68 matched at the first attempt, none was noise and none differed
    twice (the AR hover and the tuner change by design and are not recaptured). 20 of them have a reference rendered
    in the same run.
  - Tooltip: 127 px on every page at 7:42 PM, AR and EN, live, delayed and no history (the page's own measurement and
    the capture's agree); the number's start edge spreads by at most 0.02 px per side.
  - Slow fonts: with each font file held 600 ms, the answers were in view 203-222 ms after the first paint.
  - **Negative control** (scratch folders): the dot is now painted into the compared frame only, so it reaches all
    70 exact comparisons, including the 20 with a same-run reference and the crops that do not hold (720, 450).
    `--plant=once`: 68 noise, 0 differed twice, exit 0. `--plant=always`: 68 differed twice, exit 1. The other two
    (the AR hover and the tuner) differ at their single attempt, as frames that change by design. The comparisons that
    are not exact-hash comparisons (`pixelDiff`, and `liveUpdateEndsAtCanonical`'s pixel check) are not reached.
    `--plant` refused `evidence/`, a folder inside it, `EVIDENCE\`, `evidence/../evidence` and a missing outDir.
  - Scratch checks: "New reading" stepped from 7:42 PM to closing (318 steps), AR and EN, live, delayed and no
    history, Readex Pro and the fallback, reduced motion and motion on: at every step one width for every numbered
    tooltip, the number's start edge within 0.024 px per side, the gap 11.98-12.02 px; no long task; the layout shifts
    were the cards' own (the same sources as `92398dc`, 0-27 per sweep), none from the tooltip or the measuring box. The
    widest crowd word at the latest stop («شديد الازدحام» with 75, measured on a copy) would need 142.39 px in Arabic
    and 132.69 px in English after midnight (a width of 145 and 135 px). With the font files held and then released,
    the width went from 122 px (fallback) to 127 px once, with no long task; a tooltip open during the swap moved
    once with the swap itself.
- **Static guard (step 3 run 4, exit code 0):**
  - Reduced motion: 25 of 27 pre-motion frames are identical. The other two, the AR hover and the tuner frames,
    change by design.
  - `?motion=off`: 9 of 9 frames are identical (the pre-motion frame, or this run's still frame for the frames that
    change by design and for the EN hover frame).
  - **The intro's end state:** 6 of 6 first opens (AR and EN, live, delayed and no history) played and ended identical to
    the still frame, with the DOM equal to the `?motion=off` DOM and only the pulse running after it. 6 of 6 same-tab
    reloads had no intro and were the still frame. At 2x, 6 of 6 ends that played by themselves equalled the 2x still
    frame, and so did 6 of 6 ends after the held frames.
  - When it plays, the 12 yields and every held-frame check passed.
  - Every `chart`, `follow`, `marker`, `roll`, `delayed`, `rail` and tuner check passed.
- **Videos:** the designer's real-time recordings (1440×900) are outside the repository and are not evidence here. The
  step 2 recordings are in the builder's scratch folder; the step 3 recordings, their decoded frames and their strips are
  in the step 3 designer's scratch folder.

## Checks not run

### Known limits, single-fetch repair

- **Phone phase, inherited (resume amendment):** below 1024 px, the intro-end movement of `#busy-note` stays
  as at 4568bac. At 390x844 AR/EN it moves 71.5 px, with no other intro-end element moving. Twenty BASE and twenty
  candidate repeats record the shift at +1.0-1.3 / +0.8-1.6 ms from `endedAt`; both restore the same markup during
  endIntro, 0.1-0.2 ms before that timestamp. The broad matrix has one frame-delayed entry at +18.7 ms; its element
  and distance are identical. At 768x1024 EN the same note moves 14.75 px, at about +1.1-1.4 ms, on both versions;
  AR there and all tested widths >=1024 have no intro-end shift. Existing mobile clipping remains for the phone phase.

- **Audits:** no accessibility or contrast audit.
  - There was no screen-reader pass. The live region and the chart's screen-reader text were checked only as text.
  - The tuner was checked only for keyboard use, labels and Escape.
- **Browsers:** Chromium only, sRGB only.
  - The lights need `container-type: size`, cq units, `sqrt()`/`pow()` in `calc()`, `mask-composite: intersect`
    and `rgb(... / calc())`.
  - The motion needs the Web Animations API, keyframe offsets on eased progress (for the rail's name clip), and
    `translate` alongside `transform`.
  - None of this was tried in Firefox or Safari.
- **Motion:**
  - It was judged from held frames and from the designer's real-time Playwright recordings, decoded frame by frame
    (about 25 frames per second). It was not judged on a real display.
  - Frame pacing and jank were not measured. Pointer and keys came from Playwright, not a real touchpad or keyboard.
  - Touch was tried only as a Playwright tap during the intro (it settles, and the tap pins its stop); a tap pins the
    reading, as before.
- **Marker and follow (Round 7 step 2):**
  - The follow was judged from rAF logs, held frames and real-time Playwright recordings in headless Chromium, which
    paints at about 30 frames per second there (the recordings hold about 20 distinct frames per second). It was not
    seen on a real display at 60 or 120 Hz.
  - The live pulse still runs from the end point while the ring sits on it (the user kept it); it was not judged in
    motion.
  - The ring's blur filter was not profiled for frame cost; the ring's elements are moved, not rebuilt, each frame.
- **The intro (Round 7 step 3):**
  - It was judged from held 2x frames, the capture's checks and two real-time Playwright recordings in headless
    Chromium (about 22 frames in the intro). It was not seen on a real display at 60 or 120 Hz, and not by the user.
  - A new browser session was tried only as a fresh browser context. A tab Chrome restores after a restart, a
    duplicated tab and a tab opened with `window.open` inherit session storage and probably do not replay it (the
    accepted limit); none of them was tried.
  - A tab opened in the background (the intro waits until it is first shown) and leaving the tab mid-intro (it settles)
    are in the code but were not exercised.
  - The 200 ms font cap was tested only with font files held by route interception (50, 600 and 1400 ms) and on cold
    fetches in fresh contexts. A slow real network, and a cap that ends while the page is busy, were not tried.
  - The pre-intro wait hides the answers (a clip) while the fonts load: a frame or two with a warm cache, otherwise up
    to the 200 ms cap from the first paint (the answers in view 153-231 ms after it across the recorded runs), on a first open only (the user's decision on Round 6 §1, 2026-09-26).
  - No screen-reader pass. The accessibility tree was compared as Chromium exposes it over CDP. The live region was
    checked as text only.
  - The surface probe reads computed styles at two frames, not pixels. The frames in between are covered by the held
    frames' checks.
  - At 2x the raster of «6-8» in Arabic is bistable on this machine (two variants, a few dozen fringe pixels), with and
    without the intro; see "Evidence".
- **Known differences:**
  - After a simulated live update settles, the page's DOM and geometry equal the canonical page, measured to 0.001px.
  - But Chromium rasterizes the header chip's text differently: about 1,100 pixels, up to 84/255 on glyph edges.
  - It happens once anything positioned or animated has existed inside that chip. Even a plain `top` animation on a
    span does it, so it is a raster state, not a layout change.
  - The cards' text is not affected (their layers are already composited).
  - A new reading that lands during the intro ends at the canonical page's DOM; its pixels differed from it by at most
    1/255 in 1,149 header-chip pixels once (at 100 ms) and not at all once (at 400 ms).
  - **Known limit (pre-existing):** for the same reason, the capture's `liveUpdateEndsAtCanonical` pixel comparison
    (`identicalWithPulseHidden`) is always false, in `92398dc` and after repair 1. It does not affect the exit code;
    only its `domEqual` does. It is recorded as it is and was not changed.
- **Scope:** no English still frames for delayed, no history or details (the intro's sheets have English delayed and no
  history). Mobile is out of scope.
- **Repository:** no repository verification. `pnpm check:design-context` passed at the start of Round 7 (step 1) and
  of step 3, and in the intro fix round; it was not run for step 2.
- **Intro fix round:** the accessibility-tree comparison, the slow-font frames at 100-400 ms and the planted defects
  were run as scratch checks outside the repository. The accessibility tree is not a capture gate. No verifier has
  checked this round yet.
- **Follow-up round after step 3:** the user reviewed the width (the before/after sheets are in the round's scratch
  folder), chose the narrower width, and then decided it follows the chart (repair 1). Only Readex Pro and Segoe UI
  (the Windows fallback) were measured; a wider fallback grows the box rather than clipping. The widest crowd word
  («شديد الازدحام», "Packed") never reaches the latest stop in this page's data; it was measured on a copy of the latest
  tooltip only. The through-the-day sweep, the font swap and the negative control were scratch checks. No verifier
  has checked repair 1 yet.

## Lane fix round (run `owner_lane_fix_r04_s04`)

Base `9404bb1`. The verifier found that the connector's dash pattern was anchored at the mark end, so the last dash or dot
stopped short of the box, and that the missing-span pointer's tip sat between two lit dots. `capture.mjs` had reported
"connector to box 0 px" because it read the path's endpoints, not the painted dashes.

- **Change (`app.js`, `paintConnector` and the gap branch of `paintMarker`):** the dash pattern is fitted to the connector's
  length on every paint, so also at every frame of a follow. Dashed: 2 px dashes, the count of periods from the length, the
  gap stretched evenly (2.5-3.5 px in every state and viewport measured; nominal 3). Dotted: 1.6 px round dots, the path
  stopped a cap's radius (0.8 px) short of each end so the painted edge of the first and last dot touches the pointer's base
  and the box (pitch 3.5-4.5 px; nominal 4). The dashed and dotted forms read the box's rounded corner at the column they are
  drawn on. At the missing-span stop the column is the lit dot nearest the stop's centre (2 px from it at 1440×900, at most 2.00
  px at 1280×800, 0 at 1024×640) and the tip touches that dot's top; the dots do not move. Solid connectors, the box, the
  lane, the marks and the geometry are untouched; `style.css` gained a comment only (the `.tip` note now describes the lane).
- **Phone-phase note:** the pattern fit in `paintConnector` (`app.js` about 1021-1032) falls back to the unfitted pattern when `n < 2`, which happens only for a dashed connector under about 27 px or a dotted span under about 14 px. The tested viewports do not reach it (the shortest rest connector is about 100 px); the phone phase checks it.
- **Check (`capture.mjs`, `measureTip` and the lane block of `chartChecks`):** the connector is measured as painted: every dash
  or dot from the path, the dash pattern and the cap; the topmost against the box's painted bottom edge at the connector's
  column (straight, or up the rounded corner); the lowest against the pointer's base; the pointer's tip against the ring's
  outer edge, the nearest lit dot, or the tick; and the dash gap (2.5-3.5 px) and the dot pitch (3.5-4.5 px). Each is at most
  0.5 px, and the peak's cut connector, which has no segment at the pointer's base, has no base to meet. **Positive control:**
  the same check on `9404bb1`'s `app.js` fails in all six pages (connectorMeets false): 1440×900, AR live 2.41 px to the
  box, EN live 2.41, AR/EN delayed 2.19, AR no history 1.74, EN no history 2.123; the pointer's base 0.8 px (the dots
  overlapped it); the missing-span tip 0.925 px (AR) and 0.933 px (EN) from the nearest lit dot.
- **Painted gaps, all stops, AR and EN, live, delayed and without history, at rest** (worst; before at `9404bb1`, after):

  | Form | 1440×900 | 1280×800 | 1024×640 | 390×844 |
  |---|---|---|---|---|
  | dashed, to the box | 2.410, 0.003 | 2.910, 0.003 | 2.783, 0.005 | 2.940, 0.004 |
  | dotted, to the box | 2.123, 0.010 | 2.373, 0.010 | 2.543, 0.010 | 3.459, 0.014 |
  | missing-span tip to a lit dot | 0.933, 0 | 1.058, 0 | 0.075, 0 | no lit dot (see below) |

  The pointer's base is met by a dash or dot at every stop (before, the dotted form overlapped it by 0.8 px). The dashed gap
  is 2.898-3.099 px and the dotted pitch 3.972-4.035 px. A follow through every stop and back (5,390-5,530 frames per page
  under a virtual clock, 1440×900, AR and EN, live, delayed and without history, including onto and off the 11:00 PM stop and
  the missing-span stop) is at most 0.01 px from the box for the dotted form and 0.007 px for the dashed form, at most 0.023
  px from the ring, the dashed gap 2.931-3.071 px and the dotted pitch 3.983-4.02 px; at `9404bb1` the same sweep gives up to
  3.00 px (dashed) and 2.123 px (dotted).
- **At 390×844 the missing span has no lit dot:** the span is narrower than 4 px, so neither the axis nor the marker draws a
  dot, only the glow. The connector's column stays on the stop's centre and its tip stays where a dot's top would be. This
  is declared, not changed.
- **Frames.** `capture.mjs` ran alone and exited 0 with its summary lines unchanged apart from the connector numbers (11 of 28
  pre-motion frames identical; 17 change by design, none of them new). Only `marker-variants-ar-3x.png` changed on account of
  the fit (it shows dashed and dotted connectors; the difference is confined to them). `intro-yield-ar.png`,
  `motion-contact-sheet.png` and `motion-roll-ar-2x.png` also differed after the run, by real-time timing only (the captions'
  "settled at N ms", and the reading's digits mid-roll; no connector lies in the differing pixels), so their `9404bb1`
  versions were kept. `capture-log.json` was rewritten by the run; its connector fields hold the painted measurement. No
  static frame is dashed or dotted, so `EXPECTED_TO_CHANGE` gained nothing. Fresh-page screenshots of every stop of the plot
  at 1440×900 and 390×844 (AR and EN, three states) against `9404bb1`: all 332 solid-form frames are identical, and every
  dashed and dotted frame differs only in the connector's column (and, at the missing-span stop, the two columns).
- **Facts the second verifier found (declared, no behaviour changed):**
  - **The peak's dotted drop** (`app.js` about line 607, `if (ly - py > 14)`, the `pk-drop` path): the shorter scale reduces
    the peak dot's gap to the line at 1440×900 from 17.84 px to 13.36 px delayed, 14.22 px live and 14.98 px without
    history. The drop is therefore no longer drawn in the delayed state at 1440×900, AR and EN; at 1280×800, 1024×640 and
    390×844 it was already absent at `8ae88f3`. Live at 1440×900 (where `ly - py` is 14.10 in the page's own numbers, just over the 14 px threshold) it is drawn as a path 3.10 px long (`M x,196.00 V 199.10`,
    `stroke-dasharray 1.5 3`, round caps, 1 px wide): one 1.5 px dash with its caps, 2.5 px painted, that is one short chalk
    tick under the ring rather than a dotted line (without history the path is 3.89 px, the same single tick).
  - **Layout shift:** the claim "0.00001 or less" holds at desktop only. At 390×844 the candidate has 0.02-0.05 in live and
    without history, all from the stat cards reflowing on new readings (`#now-foot`, `.unit`, `#entries-usual`), which
    `8ae88f3` also has.
  - **Unguarded evidence:** the motion and held sheets that change with the shorter scale but are not in
    `EXPECTED_TO_CHANGE` are changed by design and unguarded: `intro-contact-sheet`, `intro-detail-ar-2x`,
    `intro-states-2x`, `intro-yield-ar`, `marker-variants-ar-3x`, `motion-contact-sheet`, `motion-follow-ar-2x`,
    `motion-live-ar-tail-2x`, `motion-roll-ar-2x`, `motion-roll-en-2x` and `motion-rail-*`; so is `levels-chart`, a derived
    brightness map with differences outside the plot by construction. The real-time ones also differ from run to run by
    timing.
- **Not run:** the `checks/` harness, and any repository verification.

## Checks

The `checks/` harness encoded the superseded floating-placement rules and was removed; it remains in history at `ee2b399`.

## Reports (run `owner_reports_r04_s10`)

Files: `reports.html`, `reports.css` (loaded after `style.css`, scoped to the Reports page, so it never touches a Daily
rule), `reports.js` (a classic script) and `reports-capture.mjs`. The Daily page's `index.html` and `app.js` change only
for the rail link. Concept only, synthetic data; the "Exploration concept · synthetic data" label stays visible.

### What it answers
The page keeps the Daily page's structure and look (the rail, the header, four glass cards and one lit card below):
- **Header:** the title, the period and its length, and the period control (Last 7 days, Last 28 days, Custom…).
- **Four cards:** week over week (plain in every period: Reports' only light is the pattern's), the average inside
  with its crowd level, the highest peak with its day and time, and entries with the daily average. Entries are named
  entries only, with no caption.
- **Busy times** (lit with the chart light): the weekday × hour pattern, average inside, 7 days × 19 hours (6 AM to the
  12 AM hour), coloured on one red ramp taken from the light ramp (oxblood, FITWAY red, `#FF2946`). The busiest hour is
  named in the subtitle and marked with a small chalk point. A "Numbers" switch prints every value in its cell.
- **Day by day:** a sortable table of each day's peak (with its time), daily average and entries, with exceptions in
  words (a camera gap, the period's highest peak). "Export CSV" sits here, with the data.
- Details stay on request: the pattern's readout (hover, keyboard or tap), the numbers switch, and the table below the
  first screen.

### States and how to open it

| `?state=short` | Readings since Sunday 13 Sep (the Daily page's no-history state has one past Wednesday, 16 Sep): week over week shows "Not enough history yet" and no value; the pattern shows closed, no data (the only Thursday's camera gap) and zero together; days before 13 Sep are one merged "No readings yet" row |
| `?from=2026-07-01&to=2026-07-31` | A period before the readings began: every figure says "No readings", the pattern is closed or no data, and the table's empty state offers the last 28 days |

### The table, form and dialog system

| **Data table** (`.table`) | a real `<table>` with a caption, `th scope`, and explicit ARIA roles, so a narrow-screen recomposition never drops the semantics; sticky header row; numbers aligned at the end with tabular figures | default; hover (the row lifts); focus (the sortable header's button); selected (the sorted column: chalk header, arrow, `aria-sort`, announced); empty (a sentence and the way back); exceptions in words (a camera gap, the highest peak row tinted red with a "Highest" flag); days before the readings began merged into one row; a firmer line closes each week |
| **Sortable header** (`.sort`) | the whole header is a button; the arrow shows on the sorted column and on hover or focus | default, hover, focus, selected (ascending or descending) |
**Accessible equivalent of the pattern:** the pattern is itself a table (a grid): weekday row headers, hour column headers,
and every cell's text is its value with its level ("52, Busy"), "0, Empty", "Closed" or "No data" (closed and no-data
runs are merged cells). Parity is by construction.
**Contrast:** measured on rendered pixels (each text run against the lightest and darkest background pixel under it,
with the glyphs made transparent), every visible text run in 14 states is at least 4.79:1. FITWAY red is a middle
luminance where neither chalk nor dark 13 px text reaches 4.5:1, so with numbers on every value cell is the ramp mixed
80% with the card's base (the order is unchanged). Field edges and the pressed segment's edge are at least 3:1.
**Loading (out of scope):** every box has a fixed or data-derived geometry known before the data arrives (the cards'
height, the 7 × 19 grid, one 48 px row per day of the period), so a later skeleton can hold the exact layout.
### The early phone check (390 and 320 px)

Only the table, the date-range form and the export dialog were checked, at 390×844 and 320×568 (isMobile, 2x), in AR and
EN. **Verdict: the system holds, with named changes** (all below 721 px; the desktop is unchanged):
- **Table:** it recomposes instead of scrolling. The notes column folds into a row of its own under its day, the weekday
  sits over the date, the peak's time under its value, headers may wrap, and only the sorted column shows its arrow.
  Cell padding is 8 px, or 6 px (4 px at the table's edges) at 400 px and below. Four columns fit in 270 px at 320.
- **Form:** the segmented control spans the width in equal segments; the two date fields stack at 400 px and below.
- **Dialog:** a bottom sheet with its actions sharing the width.
- No horizontal page scroll in any phone frame, every checked control is at least 44 × 44 px, and the table fits its
  card. The rail is set aside below 721 px and the pattern scrolls sideways in its own box, only so that nothing
  overflows the document; neither is a phone design.
- A text-heavy table (Activity Log) was not tried. The rule to carry: fold secondary columns into the row first; only a
  table that still cannot fit becomes a labelled, keyboard-scrollable region with a sticky first column.

### Known limits (Reports round)

- The Daily page's stat-card headers already overflow at 1024 px (for example "Busiest time" with its meta, 227 px in
  168 px), at `8926193` too; unchanged here. Reports' cards go two by two below 1200 px, and their titles tighten
  slightly in a narrow four-column card (a container query), so nothing clips at 1280 or 1024.
- The rail's opening has an input-driven layout shift of 0.009 at 1440×900 in Arabic, identical on the Daily page at
  `8926193`; it is not a shift after the first paint.
- No screen-reader pass; the accessibility tree and the live region were checked as text. Chromium only.
- The date fields take typed dates only (no calendar picker), to keep Western digits under any browser locale.
- The export's "working" state is visible only for long periods or when held (`window.__reports.export.hold`); a
  4-week file is ready in well under the 300 ms before the progress line would show.

## Step 3: the frame and the Daily page at every size (run `owner_daily_r04_s17`)

The frame (phase A, `d76972c`) and the Daily page at 1440, 1024, 768, 390 and 320 and the 200% zoom (phase B). The
reference is `DESIGN-SPEC.md` (§1.11, §3.11, §3.13, §4.1, §7, §8), not this file. Breakpoints: the desktop rail at
1024 px and wider, the same rail as a modal layer from 721 to 1023 px, and the bar and the compact header at 720 px and
below. Daily takes the spec's rules on its own components (`body.dl`; Reports keeps the base rules until step 4), fixes
every step-3 known issue, and builds the proposals for Q1 (a ring key) and Q2 (one lane for every state, one rhythm on
the time axis) for the user's decision. `capture.mjs` retires the 8ae88f3 outside-the-plot comparison for the frames
step 3 changes (`STEP3_FRAMES`), holds the tooltip's width per page, and adds overflow-only frames at 1024, 768, 390 and
320.
## Step 3, second part: Daily's states (run `owner_states_r04_s19`)

Loading, closed, unavailable and error on the Daily page, at every size, AR and EN: `index.html?state=loading` (the
skeleton, held for review), `?state=loading&arrive=1800` (its arrival into live, with the intro on a tab's first open),
`?state=loading&arrive=never` (the 10 s ceiling into error), `?state=closed`, `?state=unavailable` and `?state=error`
(its retry arrives into live). Unavailable keeps today's earlier real readings (user 2026-10-01, proposal 4): the live line from opening to 3:00 PM, plain, then the dotted missing span to now, «بانتظار القراءات» / "Waiting for readings"; Today's peak and Entries say «قيد الانتظار» / "Pending". The reference is `DESIGN-SPEC.md` (STA-10…14, §3.14 and the entries they name), not this
file. One skeleton, five truths: every state keeps the page's slots and heights, so the arrival moves nothing; no state
shows a green dot, a pulse or a light. Live, delayed, no history and Reports keep their pixels. `components.html` gains
the section "Daily's states".

## Step 4, phase A: the frame's Operations change, and Reports at 1440 (run `owner_reports_r04_s20`)

The reference is `DESIGN-SPEC.md` (RAI-1, HDR-3…7, BDG-1…4, STW-1…2, CRD-11, §4.2, §7 and §8 Q12-Q16), not this file.

- **The frame (both pages).** Operations has no section in the rail (user 2026-10-01). At every size the header's status
  is one control, `#ops-btn`, that opens Operations' details: from 721 px it reads in full ("● Live · Last reading
  7:42 PM ⌄"), boxless at rest; on a phone it is the badge it was. The details hang under it at its inline end. The
  header keeps its height (60.25 px; 90.25 on a phone) and a status change moves nothing else. At 721-1023 px the hours
  leave Daily's subtitle for the details. Apart from that, Daily is unchanged: its seven states at 390 match `d2cf1a3`
  pixel for pixel but for 8 antialiased pixels (error and loading, English, at most 6 levels), and at 1440 they differ
  only in the header's status and the rail's removed tile.
- **Reports takes the frame** (`body[data-frame]`): the rail, the tablet's modal rail, the phone's bar, compact header
  and menu, ported from `app.js` into `reports.js`. Its old phone placeholder is gone; its content below 1024 px only
  reflows until phase B.
- **Reports at 1440, recomposed.** Under the header the page's controls: the period and "Export minute data". At a
  glance, one card of the period's three figures under the period control, and "Last 7 days" in its own card at the
  row's end, plain. The pattern lit across the page, hatched where a slot has fewer than 3
  days. Day by day with "Export table", which exports its own rows. Every review fix assigned to step 4 is in (§7).
- **Open and capture.** `reports.html` takes `lang`, `state` (`full`, `short`), `range` (`7d`, `28d`) or `from`/`to`,
  `dialog`, `export` and `motion`, as before. `capture.mjs` and `reports-capture.mjs` follow the renamed elements
  (`#ops-btn`, `#card-trend`, `#table-export`). The round's probes and frames are in `/tmp/fitway-scratch/reports/`.

## Step 4, phase B: three refinements at 1440, and Reports at 768 and 390

The reference is `DESIGN-SPEC.md` (HDR-4, HDR-7, TBL-10, TRU-7, PAT-12, OWN-R2, OWN-R3, OWN-R8…R11, K-29, K-38 and §8
Q17-Q22), not this file. Brief: `step4-reports-phase-b.md`.

- **1440, the user's three refinements (2026-10-01).** The period control stands alone at the start of the controls row,
  and "Export minute data" moves to its far end (the left in Arabic). "Last 7 days" names its baseline beside its value:
  the measure, then «مقابل 9 – 15 سبتمبر» / "vs 9 – 15 Sep", stacked, the card still 166 px. A preset's subtitle is its
  dates alone; a custom period keeps its length, and fewer days with readings keep that fact. Nothing else moved.
- **768 (721-1023 px).** The glance stacks; the period's figures are 1 : 1.25 : 1 so the peak's day and time keep one
  line under its name. The pattern keeps 1440's form, the switch at the end of its title's row.
- **390 (720 px and below).** The period across the width, the minute export at the row's far end on its own line.
  Average inside and the highest peak side by side, entries under them. (Superseded by step 4's build, below: the user
  rejected this phone as compressed.) The pattern transposed into a week calendar
  (`reports.js` draws `.pattern.is-t` at 720 px and below and redraws it when the breakpoint is crossed): a column per
  weekday, a row per hour, the same slots, marks, words and keyboard, its axes turned. Day by day in TBL-8's form.
- **Checked.** 320 (the figures stack; "Su" … "Sa"), 1024 and 720 × 450 (the 200% zoom). The export dialog's file name
  breaks only between its parts. Daily is unchanged: its files are as at `9b6ae63`, and its seven states at 1440, 768
  and 390 render byte for byte the same but for antialiasing noise that also appears between two renders of `9b6ae63`.
- **Probes and frames** are in `/tmp/fitway-scratch/reports-b/` (`R4b`).

## Step 4, the build: one day at a time below 1024 px (the user's pick of 2026-10-01, option B)

The reference is `DESIGN-SPEC.md` (PAT-12…14, OWN-R3…R5, OWN-R9…R13, TRU-7, TBL-10, DAT-4, K-29, K-39 and §8 Q17, Q20-Q22),
not this file. Brief: `step4-reports-phone-build.md`. The user rejected phase B's phone (`9309382`) as compressed; the
options round (`aa509b9`) drew three answers behind `?opt=a|b|c`, and the user picked B. A, C and the `?opt` switch are
gone (`reports-phone-options.js`, `reports-phone-options.css` and `reports-options-capture.mjs` removed); B is the page.

- **The pattern below 1024 px** (`#pattern[data-form="day"]`, `reports.js` `renderDay`): a week strip of 7 radio buttons
  (one Tab stop, the arrow keys between days, mirrored in Arabic) chooses the weekday; the chosen day's 19 hours are bars
  on one scale for the whole week, each printing its number, closed and no-reading hours one worded row each, the range
  first. It opens on the busiest weekday (in 7 days, on the day of the highest peak). Each day in the strip carries its
  own hours in miniature on the bars' scale, so the strip compares the days where they differ (when they fill, Friday's
  late opening, Saturday's lower evening); every bar keeps a 1 px FITWAY-red edge so a quiet hour still shows its length.
  (Changed in the fix round, below: one bar a day in the strip, no edge, one day at a time up to 1279 px.)
  On the tablet the hours stand as columns, every third hour labelled, and the card ends inside the 768 × 1024 first
  screen. From 1024 px the grid is 1440's, unchanged.
- **Day by day at 720 px and below** (`#days[data-form="list"]`, `renderList`): a two-line list, 7 days and then "Show all
  days", sorted with a native select; in date order every 7 days from the period's last day open with their dates (gone
  in the fix round, below: one plain run of days). From
  721 px the table keeps phase B's form (cells pad 8 where its card is under 540 px, so it fits at 721).
- **An empty period below 1024 px** says its sentence once, in the busy-times card with the way back (EMP-1); day by day
  steps aside until the period has readings.
- **"Last 7 days" at every size** loses «مقابل 9 – 15 سبتمبر» / "vs 9 – 15 Sep" (Q17, rejected by the user): the value and
  its measure, as before phase B. Reports at 1440 differs from `aa509b9` only inside that card.
- **Also fixed:** a custom empty period's subtitle on a phone ran "No readings31 days" together (its inner separator was
  hidden with the parts' one); the options round's list carried the list element's default 40 px indent.
- **Open and capture.** `reports.html` takes the same parameters as before (`lang`, `state`, `range` or `from`/`to`,
  `dialog`, `export`, `motion`); `?opt` no longer exists. `window.__reports` gains `day`, `pickDay(wd)` and
  `showAllDays()`. `reports-build-capture.mjs <outDir> --phaseb=<9309382 copy> --before=<aa509b9 copy>` renders,
  measures and compares the round and composes its sheets (`R4c`).

## Step 4, the fix round: the user's decisions on the phone build (2026-10-01)

The reference is `DESIGN-SPEC.md` (PAT-1, PAT-2, PAT-12…14, OWN-R8, OWN-R12, OWN-R13, TBL-12, CHT-12, DAT-4, K-39 and §8
Q11, Q18, Q19), not this file. Brief: `step4-reports-phone-fixes.md`. The user reviewed the build (`ff0e922`) one
decision at a time.

- **The week strip: one bar a day** (decision 1, the options round's form). Each weekday is one bar, its busiest hour on
  the bars' scale in its ramp colour (`reports.js` `dayBar`, `.wk-col`, `.wk-bar`); the miniature of each day's hours
  (`miniDay`, `.md`, the `md-ramp` gradient) is gone.
- **The hour bars: no edge** (decision 2). The 1 px FITWAY-red edge leaves every bar and the key's swatches; the number
  printed at a bar's end carries a quiet hour's value.
- **The day list: one plain run of days** (decision 3). The dated 7-day heads (`.dl-chunk`) and their firmer line are
  gone; "Show all days" stays one tap for the whole period (decision 5).
- **One day at a time up to 1279 px** (decision 6, K-39 closed). The pattern's form switches at 1280 px
  (`matchMedia("(min-width: 1280px)")`), so from 1024 to 1279 px the busy-times card is the tablet's form, the hours as
  columns (the CSS from 721 px already drew it); the day table keeps its form there, and an empty period is said once
  in the busy-times card (decision 4). From 1280 px the week grid is unchanged.
- **A span in words is one sentence, the words first** (decision 8): «لا قراءات من 10:00 ص إلى 2:00 م» / "No readings
  from 10:00 AM to 2:00 PM", and a closed span «مغلق من 6 ص إلى 2 م» / "Closed from 6 AM to 2 PM", in Reports (the
  hour rows and columns, the day table's notes and full-width rows, the day list), in Daily (the minute table, the
  gap's tooltip and its readout) and on the components page. `spanNote` builds it in each script: the words (`.w`),
  then each end with its preposition (`.nw`, never broken), each part keeping the size and colour it had (since the
  wording round, decision 9, one size and one colour for the whole sentence; below). The dotted
  mark before the words is gone; the chart's dotted axis mark stays. In a tooltip the sentence keeps the box's two lines
  and its height: the words, then «من … إلى …» in the caption line. The header's «لا قراءات · 31 يومًا» keeps its middle
  dot (decision 7).
- **Also fixed:** «عرض آخر 28 يومًا» on the empty period's button had 8 px gaps around «28» (each run of text in the
  flex button was its own item); the label is one span now.
- **Capture.** `reports-fixes-capture.mjs <outDir> --before=<ff0e922 copy>` measures the round at 1440, 1279, 1200,
  1024, 768, 720, 390 and 320 (AR and EN), compares Daily and Reports at 1440 with `ff0e922` pixel by pixel, each
  difference located inside a span's phrase, and composes one numbered before-and-after image per decision (`R4d`).

## Step 4, the wording round: the user's picks on the phone fixes (2026-10-02)

The reference is `DESIGN-SPEC.md` (TBL-12, CHT-12, CHT-21, STA-12, OWN-D11, OWN-R12, DAT-4 and §8 "Decided 2026-10-02"),
not this file. Brief: `step4-reports-wording-fixes.md`. The user picked from rendered options (decisions 9-13).

- **One size and one colour for the whole sentence** (decision 9). A span's ends (`.rg`) no longer carry their own type
  and colour (`style.css` `.gapnote .rg` keeps only tabular figures and `nowrap`): they take the style the words have
  where the sentence stands. Reports' full-width rows, the day list's run of days before the readings and the hour
  rows' runs are caption type `--ink-3` throughout (a closed run `--stale`, `.hb-run.is-closed .gapnote`); the
  components page's full-width rows the same. Daily's minute table was already one style at `e8461a5`, the cell's
  13.5 px `--ink-2`: the caption rule written for that row (`.minutes-table td.none`) never matched, because the class
  is on the row; the dead rule is removed and the row is unchanged. In every tooltip the second line («من … إلى …»,
  «منذ …») is a second `.tip-main.tip-span` line in the word's type and colour (`tipLines` in `app.js` and
  `components.js`; `reports.js` `tipHTML`).
- **A single day without readings keeps its date in its place** (decisions 10 and 11). `reports.js` `dayNoneRow` (from
  721 px: the date as the row header, the words in one cell across the other four columns) and `dayNoneItem` (720 px
  and below: the date in `.dl-day`, the words in `.dl-more`), with «لا قراءات» / "No readings" inside the readings and
  «لا قراءات بعد» / "No readings yet" for the one day before they began. `spanOn` («يوم» / "on") is gone. A run of days
  before the readings keeps its sentence. The concept's data has no whole day without readings; the capture serves
  `reports.js` with 17 September's gap set to the whole day, in memory.
- **Daily's waiting tooltip** (decision 12): «بانتظار القراءات» then «منذ 3:00 م» / "Waiting for readings", "since
  3:00 PM" (`waitTip`), and «بانتظار القراءات منذ 3:00 م» in the plot's `aria-valuetext` and the chart summary
  (`waitText`); the current time is not printed. The components page's offline plot the same.
- **Daily's coverage list** (decision 13): each span's value is «من 2:14 م إلى 2:31 م (18 دقيقة)» / "from 2:14 PM to
  2:31 PM (18 min)" (`covSpan`), without a duration «من 6:00 ص إلى 6:09 ص», in the label's `--ink-2` (`dd.is-span`);
  «792 من 810 دقيقة» and the two description rows are unchanged. The value wraps only between its groups; where its
  widest group does not fit beside the label (320 px in English, "Open, nobody inside"), it takes the line under the
  label.
- **Capture.** `wording-capture.mjs <outDir> --before=<e8461a5 copy>` measures the round at 1440, 1279, 1200, 1024,
  768, 720, 390 and 320 (AR and EN), measures each changed sentence's contrast from rendered pixels, compares Daily and
  Reports with `e8461a5` frame by frame, each difference located inside a changed sentence, row or list, and composes
  one numbered before-and-after image per decision (`R4e`).

## Step 4, two final fixes (2026-10-02)

The reference is `DESIGN-SPEC.md` (OWN-D11, OWN-R9 and §8 decision 14), not this file.

- **Daily's coverage list** (decision 14): a span's value is the range with its en dash and the duration in brackets,
  «2:14 م – 2:31 م (18 دقيقة)» / "2:14 PM – 2:31 PM (18 min)", without «من … إلى …» (`covSpan` uses `timeRange`). The
  range is one `nowrap` group; the duration may drop to the next line as one unit. The colour, the label column and
  «792 من 810 دقيقة» are unchanged; the no-readings sentences elsewhere keep «لا قراءات من … إلى …». The components
  page does not show this list, so it is unchanged.
- **The Arabic tablet peak cell** (721-1023 px): the stacked value, time and flag sat on the column's left in RTL
  (`align-items: flex-end`); `reports.css` adds `[dir="rtl"] .pk { align-items: flex-start; }` in the same block, so
  they end on the column's right edge with «الذروة» (0 px; `3e5b997` left the value 28.67 px inside it).
- **Capture.** `final-capture.mjs` in the scratch folder named by `F14` (a copy of `wording-capture.mjs` with a peak-cell
  probe) measures both at 1440, 1279, 1200, 1024, 1023, 768, 721, 720, 390 and 320 and compares every frame with
  `3e5b997`.

## Step 4, decisions 15-17 (2026-10-02)

The reference is `DESIGN-SPEC.md` (OWN-R9, OWN-D11, TBL-6, TBL-8, TBL-11, CHP-7, OWN-R12 and §8 decisions 15-17), not
this file.

- **The peak time beside its value at 721-1023 px** (decision 15): `reports.css` no longer stacks `.pk` in the
  `max-width: 1023px` block, so the cell takes its 1024 form (one line, `align-items: baseline`, gap 8). The stacked
  form and its RTL `align-items: flex-start` now live in the `max-width: 720px` block only, so nothing below 721
  changes. Removing the RTL `flex-start` from 721-1023 is the fix for the preview's Arabic time sitting 2 px high:
  every number in a row shares one baseline (0 px).
- **Daily's coverage list** (decision 16): `covSpan` writes the range, then «· 18 دقيقة» as a second `nowrap` group;
  the dot is `aria-hidden`, a screen reader hears a comma. The components page does not show this list.
- **No «الأعلى» / "Highest" flag** (decision 17): gone from Reports' table and day list, the components page's table
  and its flags specimen, with its CSS (`.flag`, `.cx-flag.is-red`) and its strings. The row tint stays.
- **Capture.** `cap.mjs`, `crops.mjs` and `cov.mjs` in the scratch folder named by `B15` measure Reports, Daily's
  coverage list and the components page against `ca70f44`.
