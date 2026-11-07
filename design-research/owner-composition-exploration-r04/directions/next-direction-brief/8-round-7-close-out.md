<!-- Part of NEXT-DIRECTION-BRIEF.md; the index and the rule for editing are in NEXT-DIRECTION-BRIEF.md. -->

## Round 7 close-out and the screen plan (agreed 2026-09-26)

### Step 2 and the tooltip (user-agreed)

- **Step 2 is closed in principle.** The user finds marker B, the follow and the hover speed excellent. This closes
  their review of step 2. It is not the formal visual acceptance of the page.
- **Tooltip layout:** the two-edge layout of `04984e9` is rejected. Nothing lined up, the number was split from its
  word, and the number jumped between ends when the marker crossed the peak or the latest reading.
- **The approved layout:** one start-aligned arrangement for every tooltip. For peak and latest, the label chip comes
  first and then the time; the number comes first and then its crowd word, as at ordinary stops. The user approved it
  from a rendered comparison of the real page (a DOM-only mock).
- **Order:** the tooltip fix, then step 3 (the first-open intro, decision 4), each with a fresh independent verifier.

### Screen plan (user-agreed)

*Superseded by "The design-phase plan" (2026-09-30): each screen is designed at every size in its own round, and the
tests come once, after every screen and size. The early mobile check below was done in the Reports round (`31a40d6`).*

- **Desktop first:** finish every screen in "After the Daily page" at desktop, and review them together.
- **One early mobile check:** when the table, form and dialog system is designed, on the first screen that needs it
  (Reports), check quickly that the system works at 390 px and 320 px. This is a feasibility check of that system
  only, not a mobile design. The reason is that tables are the hardest part on a phone; finding late that the system
  fails there would mean reworking every screen.
- **Then:** mobile at 390 px, 320 px and 200% reflow for every screen, and the polish.
- **Then:** the formal, human-approved authority record that makes this direction the design reference, as in
  "Authority intent" above.

### Follow-up after step 3 (agreed 2026-09-26)

A small separate round after the intro, so that the intro's verifier judges the intro alone and no two writers share
`capture.mjs`:

1. **Tooltip width (reviewed 2026-09-27; the user chose the narrower width, see "Decisions after the step 3 report"):**
   in English the number still moves about 9 px on screen
   between the peak and 7:00 PM. The tooltip widens (108 to 117.4 px) and is anchored at the hairline. The proposal is
   one fixed tooltip width, the widest content in either language, so the number never moves. The user will judge it
   from a before/after comparison before it is kept.
2. **Capture noise (user-agreed):** Chromium's glyph raster is not always byte-identical between runs, so the static
   guard can fail spuriously. The guard stays exact: a frame that differs is captured again, and it counts as a
   difference only if it differs in two consecutive attempts. No tolerance threshold is added.
3. **README wording (low):** `eclipse/HISTORY.md`, "Motion", rule 11 ("The first-open intro"), records the font-wait wording: the answers are hidden "for at most 200 ms". The re-check saw
   the still page at 195-231 ms after first paint, which is inside the 250 ms gate. Correct the wording to the
   measured range.

### Decisions on the step 3 intro (user-agreed 2026-09-26)

1. **Font wait capped at 200 ms.** The intro needs the fonts ready before it starts, so the numbers are hidden until
   then. That can conflict with Round 6 §1, "content is never hidden while fonts load". If the fonts are not ready
   within 200 ms, the intro is skipped and the still page shows at once. The numbers are therefore hidden for at most
   200 ms, and only on a first open. This replaces the designer's 1 s cap.
2. **Session restore is a known limit.** When Chrome's "continue where you left off" restores a tab's session storage
   after a restart, the intro probably does not replay. The browser treats that as the same session. This is accepted
   and no workaround is added.
3. **The 200 ms cap stays (user decision, 2026-09-27; asked 2026-09-26).** With the cap, a cold first visit fetches
   the Google fonts in about 0.4-1 s, so the intro plays only once the browser has the fonts cached, which means later
   new tabs. The user left the choice to the coordinator, who keeps 200 ms for the concept. Production will host its
   own fonts, and the cap can be revisited then. The rejected alternative was a higher cap, such as 500 ms, which
   hides the numbers longer on slow networks.

### Decisions after the step 3 report (user-agreed 2026-09-27)

- **The follow-up round goes ahead** with all three items of "Follow-up after step 3". The fixed tooltip width is
  still kept only after the user's before/after review.
- **Tooltip width (user review, 2026-09-27):** the first fixed width, 138 px, was set by the missing-span stop, which
  shows no number. It made ordinary tooltips 20-30 px wider, with empty space at their end, and moved 7:30 AM and
  11:00 PM to the other side. The user chose the coordinator's proposal instead: the widest tooltip that shows a
  number sets the width (about 127 px, set by the latest reading), and only the missing-span stop may grow beyond it.
  Placement uses each box's real width, so the grown box keeps its 12 px gap from the hairline. The number still
  never moves. The user sees the same before/after comparison before it is kept.
- **Kept, then made to follow the chart (user decisions, 2026-09-27):** the user kept 127 px from the before/after.
  Independent verification then found that 127 px fits only the page's 7:42 PM snapshot: later readings lengthen the
  latest-reading time ("10:42 PM", "12:12 AM"), about 131 px in English after 10 PM and about 141 px in Arabic after
  midnight, and the Arabic «شديد الازدحام» needs about 132 px, so the number moved again. The user chose the
  coordinator's proposal over a fixed 144 px and over keeping 127 px: the same rule is measured from the chart's
  current stops whenever they change (first render, a new reading, a state change, a resize, a language switch, the
  fonts loading). Within one snapshot the width never changes, so the number never moves between stops at any hour;
  it is 127 px for most of the day and wider only late at night.
- **The box never covers "now" (user-agreed 2026-09-27).** A second independent verification found that a stop after
  now near the end of the day flips toward now and covers today's end point: from about 8:40 PM with the wider boxes,
  and already in `622cd0b` from about 10:40 PM. The coordinator's first idea, lifting the box over the end point, was
  dropped after inspection, because in Arabic it would cover the recent line instead and float far from its own point.
  The agreed rule:
  - The box keeps a distance of at least 11 px from the end point's centre (its 9 px halo plus 2 px).
  - Every placement that already satisfies this stays exactly as it is.
  - Only where the current placement covers the end point does the box sit centred above its own point (below if
    there is no room), and, only if still needed, shift vertically by the smallest amount that clears it.
  - Changes of placement ease on the follow's curve.
  - The latest-reading tooltip, which sits over the last stretch of the line by approved design, is unaffected.
- **The screen plan is confirmed:** desktop first, in the order of "After the Daily page", with the one early mobile
  check at 390 px and 320 px on Reports.
- **Merge proposals:** the user answered "excellent" to a summary that listed the two merge proposals (contextual
  history, and Operations as a header status) as pending. Asked again, the user confirmed both explicitly on
  2026-09-27: each screen shows its own recent history in place, beside the full Activity Log page, and Operations
  becomes a persistent header status that opens a detail page, with no primary rail slot.
- **The intro is too fast (user review, 2026-09-27).** The user opened the page and finds the intro "very fast"; it
  should be a little slower. The user tried the tuner's «سرعة المقدمة» "Intro speed" at the coordinator's suggested
  **0.70×** and approved it. The designed intro becomes 0.70× of today's timing: every intro duration and delay is
  divided by 0.70, so the whole intro lasts about 1171 ms instead of 820 ms (the answers about 400 ms instead of
  280 ms, the line about 914 ms instead of 640 ms). The easing curves, the order and every rule of "Decisions on the
  step 3 intro" stay as they are. The new timing is the tuner's 1× (the default), so the tuner still spans 0.5× to
  2× around it. This is done in a separate round after the follow-up round, because both change `eclipse/` and each
  round has one writer.

### The tooltip moves to a top lane (user decision, 2026-09-28)

**Why.** The tooltip floated freely near its point, and every repair fixed one case and broke another. Most failures
came near "now", which moves with every reading. The coordinator judged that the floating concept, not the code, was
at fault. The user agreed, and does not want more time spent patching it while the design is still being built.

**The decision.** The same box, with the same content and the start-aligned layout approved at `5b9bae7`, lives in a
fixed lane at the top of the plot.
- **Sideways only:** the box moves only sideways, centred on its stop and stopped at the plot's edges.
- **The connector:** a thin line joins the box to its ring.
- **The reserved lane:** no line, ring, marker, label or "now" ever enters it.

**Supersedes:**
- every floating-placement rule above: side, flip, clamp, above and below;
- the 12 px gap from the hairline;
- "never cover now" as a placement cascade (the lane satisfies it by construction);
- "the latest-reading tooltip sits over the last stretch of the line";
- round P's brief, which is withdrawn.

**Unchanged:**
- the box's look and content;
- the width rule measured from the chart;
- the follow's curve and speed, now horizontal only;
- text changing at once;
- the intro, and every truthfulness rule.

**Rejected alternatives:**
- **A fixed readout beside the chart title:** the user found it too far from the eye.
- **The user's own variant, a box that rides just above the lines under it:** at 10:00 PM with the 11:00 PM stop it
  reproduces the placement the user had rejected, over "now". Fixing that needs the sideways-shift rules again. The
  user chose the lane alone.

