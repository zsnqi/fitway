# Next Owner direction — agreed brief

Agreed with the user on 2026-09-24 in discussion. Concept-only, with synthetic data. No direction
is selected. The attempts from this brief are `backlight/`, `light-study/`, and `eclipse/`, the
current one. The user's decisions after each are in "Round 2" to "Round 7", in order. Where a later
round differs from an earlier section, the later round wins, and each passage a later round
replaced carries an italic note naming its replacement. Follow the replacement, not the passage.

## Scope

- One direction, **Daily page only**, **desktop 1440×900**. Arabic RTL and English LTR frames.
  *Widened by "The design-phase plan" (2026-09-30): every Owner screen at 1440, 768 and 390, then Staff and Public.*
- One writer subagent at a time, each followed by a fresh independent verifier (Round 7, "Work
  plan"). `CLAUDE.md` lists the Owner-direction agent definitions and their effort levels. The
  coordinator personally inspects the frames before showing the user.
- Folder: `design-research/owner-composition-exploration-r04/directions/<name>/`.

## What the user wants

- **Clarity:** clear, beautiful, calm, and premium. **Not complex.** Put the creativity in details
  and finish, not in an unusual page structure; the structure should feel familiar at first
  glance. The previous dark directions (Floodlight, Chronograph, Pit Wall) were good but too
  creative and complex in overall form.
- **Plain language:** not technical, because the gym owner is not technical. Keep text minimal;
  the interface should explain itself.
- **Low cognitive load:** essentials first. Show details only on request (hover, click, or
  "View details").
- **First questions to answer:** how is today going right now; is today busier or quieter than
  usual; and when are the peak times.
- **Feel:** calm, premium, and clear. A touch of sporty liveliness is fine. No dense analytics.
  Large numbers are welcome where they help.
- **Treatment:** **dark**, with **glass cards** (frosted, soft rounded corners) and a **soft, dim
  FITWAY-red light behind the glass**. The identity is black and FITWAY red. The red must read as
  FITWAY red, never pink or purple. Cairo is excluded.

## Reference (feel only — do not copy)

The reference is Behance, "FINANCIA – Finance CRM & SaaS UI/UX Dashboard Design":
https://www.behance.net/gallery/248793029/FINANCIA-Finance-CRM-SaaS-UIUX-Dashboard-Design

What the user likes:

- the calm glass UI
- the **chart card**: a smooth line, a dashed comparison line, fine vertical lines under the
  curve, and a hover guide with a value tooltip
- the slim icon sidebar with tooltips, which can expand to show labels

It is another designer's work. Take its spirit and quality bar, not its layout, assets, or
styling.

## Agreed layout ideas

- **Navigation:**
  - A slim side rail on the inline-start: the **right in Arabic**, the left in English.
  - **Icons only.** Hover shows only a clear hover state on the icon itself. The user explicitly
    does **not** want a name tooltip on hover.
  - Section names appear only when the rail is expanded.
  - Each icon still needs a localized accessible name (`aria-label`).
  - `DESIGN_GUIDE.md` §11 asks for tooltips where an icon's purpose is not obvious. Propose a
    quiet way to meet that, for example showing the name on keyboard focus only. Surface it to
    the user rather than silently adding hover tooltips.
  - The **FITWAY logo** (`brand/fitway-logo.png`: a circular emblem with a chevron) sits at the
    top of the rail. **Clicking it expands the rail** to show the section names, and clicking it
    again collapses the rail.
  - The user allows redrawing the logo cleanly and refining it while keeping its basic shape.
  - Sections: Daily, Reports, Access, Activity Log, Operations, and Settings, plus
    Monitoring/Management, the language switch, and sign out.
  - The overall structure need not copy the reference.
- **Main card:**
  - Today's occupancy as a **smooth red line**. It stays honest: shape-preserving, passes through
    the observations, and never invents peaks or dips.
  - A **dashed "usual for this weekday" line**, for example the average of the last 4
    Wednesdays.
  - Hover, focus, or tap shows the time, the count, and the crowd level.
  - **Open:** what to show when there isn't enough history for the "usual" line. Design an honest
    state for it. The comparison idea itself is tentative until the user sees it.
- **3–4 small cards:**
  - now: approximate count, live status, and crowd level
  - today's peak
  - today's entries (estimated entrance crossings)
  - possibly the busiest times this week

  The design settles the final set.
- **Details hidden until asked:** the minute table, the weekly heatmap, and data coverage, behind
  "View details".

## Binding (unchanged)

Product/Spec truth still holds:

- **Distinct states:** live, delayed, missing, genuine zero, closed, and still ahead are distinct,
  and nothing stale looks live.
- **Language:** Western digits; Arabic RTL and English LTR; `<bdi>` isolation, and a plain hyphen
  in Arabic ranges.
- **Accessibility:** a text equivalent for the chart, keyboard inspection, visible focus, and
  reduced motion.
- **Labeling:** a visible "Exploration concept · synthetic data" label.
- **Protected work:** no production, canonical, Paper, or authority change, and no edits to
  Redline or the other directions.

## Shared synthetic data

- **The day:** business day Wednesday 23 September 2026, gym time Riyadh. Open 6:00 AM–1:00 AM
  next day. Now is 7:42 PM, and the latest reading is 7:42 PM.
- **Minute series:** simulate a whole-person count process. Each minute, entries follow a Poisson
  distribution and exits follow Binomial(occupancy, 1/64), with a seeded PRNG. Shape: a morning
  bump of ~30 around 7:20 AM, a small midday bump of ~15, and an evening peak of ~60–64 around
  6:30 PM, then ~50 at 7:42 PM. Entries come from the same simulation.
- **Special spans:** a genuine zero from 6:00–6:09 AM, and a missing observation from 2:14–2:31 PM.
  Everything after now is still ahead.
- **Crowd levels:** Quiet ≤ 24, Moderate ≤ 48, Busy ≤ 68, Packed above. Capacity 80, owner-private.
- **"Usual Wednesday":** a synthetic average of the last 4 Wednesdays, labeled as such.

## Round 2 — after Backlight (agreed 2026-09-24)

The user reviewed `backlight/`. The structure was right, but the finish did not reach the
reference's quality or feel. Nothing is selected. The user does not want a copy of the reference;
the goal is its precision, quality, and feel, in FITWAY black and red.

### Reference study

The Behance page is a presentation. Its designer (Maruf Hassan) posted clear, flat 1600×1200
screens on Dribbble. Use these for feel only; never copy their layout, assets, or styling:

- Main page: https://dribbble.com/shots/27382937-Finance-Dashboard-Design
- Navigation: https://dribbble.com/shots/27558213-Dashboard-Left-Navigation-Menu-Design
- Analytics: https://dribbble.com/shots/27452143-Finance-Analytics-Dashboard
- Transactions: https://dribbble.com/shots/27411273-Financial-Dashboard-Transaction-Page

What the flat screens show:

- **Light is rare and owned.** The main page has one wide, soft wash in the page's top corner that
  runs along the top edge. It also has a few small lights, each belonging to one element and
  sitting on its bottom edge or corner: the chart card's bottom, the gauge, one small card's
  corner, and a thin line under a list. The twin card beside the lit one has no light. On the
  Analytics page no card is lit at all.
- **A small light has a shape.** It is a large, soft ellipse that rises from an edge or corner and
  is clipped inside its element. Its curved edge is fairly distinct, it is brightest at the edge,
  and it fades quickly. The element's 1px border brightens where the light touches it. It is never
  a blurry circle floating behind the page.
- **Glass comes from light, not transparency.** Plain cards are almost the page color (about
  `#10111A` on `#05060F`) with a quiet 1px border. The quality comes from a rhythm of thin borders,
  boxes within boxes: table headers, chips, and icon tiles.
- **Fine film grain.** A very fine grain sits inside the lit gradients only. Flat surfaces are
  clean.
- **Chart.** The line is thick (about 3px) and is the brightest thing in the card. Dense, fine
  vertical lines (about every 6px) run down from the line and fade out halfway. Horizontal grid
  lines are very faint. The chart has only a title, two axes, and one small tooltip with a thin
  border.

### Decisions (user-agreed)

1. **Light.** Use one wide wash in the page's top corner, plus two or three small lights at most.
   Each small light belongs to one element, sits on its edge or corner, and moves with it. Most
   cards have no light. Light is never fixed to the viewport, so it cannot be cut off or appear
   in the wrong place when the page grows.
2. **Glass.** Cards are near-opaque and dark. The glass feel comes from an inner gradient where
   light touches, a 1px rim that is brighter on the lit side, generous radii, and a rhythm of
   nested thin borders.
3. **Red.** The reference's pale lavender light cannot be copied in red, because red turns pink
   as it gets lighter. The red light stays deep and saturated and fades toward black, never toward
   white. Any milky, frosted feel comes from a neutral haze, never from paler red. This must be
   tested before a page is built (see "Lighting test").
4. **Grain.** Add a fine film grain inside lit areas only.
5. **Chart.** Use a thick, bright FITWAY-red line, fine fading vertical lines, faint horizontals,
   and one small tooltip. Remove the band ruler, the capacity line, the dotted "still ahead"
   texture, and the heavy legend row.
6. **Line points.** Plot the reading every 30 minutes, plus the true peak as its own point. The
   full minute detail stays available on hover and in "View details". *Superseded by Round 3 §4
   and Round 4 §1: the line is a centered 30-minute average, with the true peak as its own marker.*
7. **Missing span.** The line ends with a round cap and resumes after the gap. There are no
   vertical lines inside the gap, only a short dotted mark on the time axis, with the explanation
   on hover. There is no full-height hatched column, and the line never bridges the gap.
8. **Rail.** Every icon, the logo, Settings, and Sign out each sits in its own square tile with a
   thin border. The active section is a solid FITWAY-red tile. There is no side indicator bar.
   When expanded, the tiles stay and names appear beside them, with no whole-row highlight. The
   language switch reads "EN"/"AR" or uses a language icon, not a lone "ع". Expanding the rail
   must not animate width or margin.
9. **Delay** is shown once: in the header status and on the "Inside now" card only.
10. **Light in delayed or closed states** may stay as it is.
11. **Busier or quieter than usual** needs a difference of at least 3 people and at least 10%.
    "Busiest time" is the busiest 2-hour window over the last 7 days.
12. **Deferred to polish:** keyboard focus names on rail icons, and fine precision in the details
    panel (such as the weekly heatmap's current-hour mark).

### Lighting test (done: `light-study/`, see Round 3)

The test settles the red light before a whole page is built.

- **Frames.** Arabic RTL only, desktop 1440×900, static. The three frames share one minimal
  composition:
  - the collapsed rail with tiles;
  - the page title;
  - a row of small cards, where exactly one is lit at a corner or edge and the others are unlit;
  - the Daily chart card, lit from its bottom edge, using the chart decisions above and a static
    tooltip at the peak;
  - the page's top-corner wash.
- **Three recipes.** Only the light recipe changes between frames; the geometry stays the same.
  - **A — Deep:** saturated FITWAY red that fades only toward black.
  - **B — Warm core:** the brightest core leans slightly warm (toward orange-red) so it can glow
    brighter without turning pink.
  - **C — Red with neutral frost:** deep red, plus a neutral grey-white haze for a milky, frosted
    feel.
- **Evidence.** Three frames and a 2× crop of each chart card's lower half. The user picks a
  recipe, or asks for another. Only then is a full Daily page built.

## Round 3 — after the lighting test (agreed 2026-09-24)

The test is `light-study/`. What the user liked and wants to keep: the rail tiles (a solid red
active tile, no side bar, "EN"), owned and clipped lights, the quieter chart with fine fading
vertical lines, and the missing-span treatment (round caps and a short dotted mark on the axis).

### Decisions (user-agreed)

1. **Recipe A.** Use deep, saturated FITWAY red that fades only toward black. It is calm and
   dim, and reads as pure red. B's light was too strong, and C's haze did not read as red.
2. **Lighter grain.** The grain in the test was a little too strong. Make it finer and fainter,
   and keep it inside lit areas only.
3. **Light shape: an eclipse, not a bulb.** A brightness map of the reference shows that none of
   its lights is a round blob. Each one is light *wrapping around a large dark ellipse*:
   - **Where the light is:** it is brightest along the element's edges and corners, and
     brightest of all just inside the far corner.
   - **The inner edge:** where the light meets the dark ellipse, the edge is a clean,
     softly-feathered curve. The dark shape pushes into the light; the light never bulges into
     the content.
   - **The rim:** the element's border brightens where the light touches it.
   - **Lit small card** (reference light 4): the light hugs the bottom edge. It is thin at the
     far end, thickens into the corner, and rises partway up the side.
   - **Chart card** (reference light 2): a U shape hugs the bottom and both sides around a dark
     center, so the two lower corners are the brightest.
   - **Page wash** (reference light 1): an arc along the top edge, from the corner.
   - **In CSS:** one way to build this is a light gradient anchored at the edge, masked by a
     large radial ellipse set in the element's interior (transparent inside, opaque outside).
   - In the test, the lit card's light was a round blob bulging into the card. That is what the
     user rejected.
4. **Line = a 30-minute moving average, plus the true peak.**
   - **The line:** it shows the 30-minute moving average and is drawn smooth and
     shape-preserving. Say what it is in plain words, for example «متوسط كل 30 دقيقة».
     *Refined by Round 4 §1: the average is centered.*
   - **The peak:** a separate marker shows the true highest reading (62 at 6:29 PM), with its
     label. The line itself does not need to touch it.
   - **Truth rules still hold:** the line still stops at both edges of the missing span and at
     now, and the genuine zero stays visible.
   - **Where the minute truth lives:** the "Inside now" card shows the latest reading. Hover and
     "View details" keep the minute detail.
   - **The user's view:** the user judges that the average plus the true-peak marker keeps the
     truth, and intends to amend `DESIGN_GUIDE.md` §12 to allow it. That amendment is a separate
     step outside this concept packet.
5. **Settings icon.** Use a gear, not a sun, because a sun reads as a brightness or theme control.
6. **Fonts.** Cairo is not required. Readex Pro (from the test) is approved.
7. **The usual line continues after now.** The dashed "usual Wednesday" line runs faintly to
   closing time, so the owner sees when the gym usually gets busy or quiet later tonight. There
   is no "not a forecast" caption; the legend just names it «الأربعاء المعتاد».
8. **No explaining inside the design.** The owner will explain the page to the gym, so the page
   carries names and values, not explanatory captions. The entries figure has no caption
   either. The user had `SPEC.md` amended on 2026-09-24 so that the figure is named as entries
   («مرات الدخول» / "Entries"), never as members or unique visitors.

### Next step: the full Daily page (done: `eclipse/`, see Round 4)

Build the full Daily page at desktop 1440×900, in Arabic RTL and English LTR, from all rounds of
this brief:

- **Lights:** the page wash, the chart card, and one small card (for example "Inside now").
  Every other card is unlit, with thin borders.
- **Detail kept minimal:** "View details" can open a simple, truthful panel. Keyboard focus
  names and fine polish of the details panel remain deferred.

## Round 4 — after Eclipse (agreed 2026-09-24)

The full page is `eclipse/`. The coordinator measured its lights against the reference: OKLab
lightness and chroma along set lines, plus color strips. It found three causes of the
difference:

1. **Distribution.** The reference concentrates the lit card's light in the corner third; the
   bottom edge stays dark for more than half its length. Eclipse spread the light along the whole
   bottom edge.
2. **Edge.** The reference has a full, bright area, then a quick but smooth fall-off. Eclipse had
   a hard cut followed by a faint red tail.
3. **Color.** The reference's light is pale and almost grey (chroma about 0.04–0.10). Eclipse's is
   saturated red (0.15–0.21). In the chart card, position and lightness were already close to
   the reference; the large area of saturated red is what made it feel much stronger than
   light-study A. Pale red turns pink, so the reference's milky light cannot be copied in red.
   What carries over is the distribution, the edge, and the stepped gradation.

### Decisions (user-agreed)

1. **Centered average.**
   - The line is a *centered* 30-minute average: 15 minutes before and 15 minutes after each
     point.
   - The window is cut short at opening, at both edges of the missing span, and at now, so it
     never reads across the gap or into the future.
   - The genuine zero span stays exactly zero.
   - The curve's crest aligns with the true peak time.
2. **Lit card.**
   - Concentrate the light in the corner third.
   - Give it a full, bright area near the corner, then a quick, smooth fall-off, with no hard cut
     and no tail.
3. **A four-step ramp from FITWAY's own palette.** It mirrors the reference's four steps:
   - obsidian `#08090A` for the base;
   - oxblood `#4D0713` for the broad and outer areas;
   - FITWAY red `#E51935` for the core;
   - bright red `#FF2946` only at the hottest point.

   Use the same ramp for the page wash.
4. **Chart card.**
   - Keep the U shape.
   - Move the broad areas (both sides and the middle of the bottom) down to oxblood.
   - Keep red only near the two lower corners.
   - Overall, the chart card should be about as strong as light-study A, or quieter.
5. **Comparison chip.** Hide it when today is about usual. Show it only for a clear difference:
   "busier than usual" or "quieter than usual".
6. **Entries card.** Add one small secondary value: the usual entries by this time, taken from
   the last 4 Wednesdays (for example «المعتاد 310»). It sits quietly, like "Average 48" in the
   Busiest-time card, and adds no explanation.

## Round 5 — after Eclipse v2 (agreed 2026-09-24)

Eclipse v2 applied Round 4: a centered, center-weighted average; the "Inside now" light
concentrated in the corner; an oxblood chart light; the chip hidden when today is about usual;
and «المعتاد 318». The user likes it overall. Two light fixes, a tuner, and motion remain.

### 1. The "Inside now" light: a disc in front of a light

The user pointed out that the reference (light 4) reads like a **dark disc (قرص) sitting inside a
lit card**. Light shows only around the disc's edge. The coordinator's measurements agree. On
the reference's bottom row (y = 0.98 of the card height), OKLab L is 0.45 at the far corner,
0.19–0.30 across the middle, and 0.74–0.79 at the lit corner. Just above, at y = 0.95, the middle
is dark (0.15).

- **Build.** Layer 1 is a light background inside the card, brightest at the inline-end bottom
  corner. Layer 2 is a large dark ellipse on top of it, with a clean edge that is lightly
  feathered.
- **Visible result.**
  - The main crescent sits at the lit corner.
  - A thin rim of light, about 2–4% of the card height, runs along the entire bottom edge.
  - A small glow shows at the far bottom corner, because a disc cannot cover a rectangle's
    corners.
  - The disc's edge reads as one continuous, clean arc.
- **The ring fades out at its ends** (user note). Where the light climbs the inline-end side, and
  where the thin rim runs toward the far end, it fades smoothly to transparent. It never stops
  abruptly.
- Eclipse v2's blob, with its soft diagonal edge, is what to avoid. The coordinator's
  `disc-model.png` sketch only explains the principle. The target look is the reference's detail,
  in FITWAY red.

### 2. Chart card: back toward light-study A

The user prefers A because its light ends in clean black sooner. Measured on the chart card
(OKLab L relative to the card base):

| | Light-study A | Eclipse v2 |
| --- | --- | --- |
| Pure dark | 79% | 64% |
| Dim haze (+0.02 to +0.10) | 13% | 33% |
| Visibly lit (≥ +0.10) | 8% | 3% |
| Height the light takes to fade to black | 15–35% | 32–42% |

**Targets:**
- about 75% or more pure dark;
- 15% or less dim haze;
- the light fades to black within about 15–35% of the card height.

A's inline-end bottom corner was a little too strong (L 0.52 against about 0.30 elsewhere).
Balance the two corners.

### 3. A live light tuner

The page's light layers read CSS custom properties, and a small, collapsible, floating panel
changes them live:

- **"Inside now" card:** light intensity, core color, disc size, disc position, disc edge
  softness, rim thickness, far-corner glow, and ring-end fade.
- **Chart card:** intensity, fade distance, corner balance, and side height.
- **Page:** wash intensity and grain.
- **Presets:** v2, A-like, and Recommended.
- **"Copy values":** copies the settings as JSON.

It works from `file://`. The user tunes the lights, and the chosen values become the defaults.

*The lights are now tuned: the user's values in `:root` do not change (Round 6 §10). Round 6 §9
and Round 7 changed the tuner's controls.*

### 4. Motion (after the lights are settled)

*Superseded by Round 6 (the motion reset) and Round 7 §4 (the first-open intro). The user judged
this motion cliché; it stays here only as the record of what was tried.*

The user has only seen still frames so far, and wants the motion to be excellent too. Motion
must stay truthful:

- **Load.** Cards and the chart enter once with a short, calm stagger. The line draws from
  opening to now, then the peak marker appears.
- **Live.** A new reading extends the line; it does not redraw. The live dot pulses slowly only
  while live, and stops when delayed.
- **Numbers.** Update with a quick cross-fade. They never count up.
- **Interaction.** The tooltip and guide line follow smoothly. The rail opens with transform and
  opacity only.
- **Lights.** The user asked whether the lights can be interactive, only subtly. **User decision
  (2026-09-24):** try both the "switch on at load" and the "follow the pointer" behaviors in the
  motion step, starting with "follow the pointer". The coordinator's proposals:
  - **Proposed:** after the cards appear on load, the lights "switch on" once with a slow, calm
    fade.
  - **Proposed:** on desktop hover over a lit card, the light shifts a few pixels toward the
    pointer. It should feel as if the light peeks around the disc. This is off for touch and
    reduced motion.
  - **Optional, to try in the tuner as a toggle:** the "Inside now" light is dimmer when the gym
    is quiet and stronger when it is busy. The number and the level label still carry the truth.
  - **Not recommended:** a continuous "breathing" light. On a dashboard left open all day, it
    distracts.
- **Reduced motion.** `prefers-reduced-motion` and `motion=off` show final states.
- **How the user judges motion.** The user opens the page themselves (`index.html` directly).
  The designer verifies motion in Playwright, for example with time-stepped frames or a
  recording for its own inspection. Videos for the user are optional.

## Round 6 — motion reset and chart hover (agreed 2026-09-25)

The user reviewed the Round 5 §4 motion (see `eclipse/README.md`, "Motion") and judged it cliché and
below the visual quality of the page. They disliked the number cross-fade (including on the small
crowd-level bars) and the lights' entrance. The coordinator's diagnosis, which the user agreed with:

- **Frequency:** the Daily page is opened many times a day. Motion that plays on every open soon feels
  slow and tiresome.
- **Generic vocabulary:** fade, rise, and stagger is every template's default, and it clashes with a
  distinctive static design.
- **Wrong subject:** animating the decorative lights pulls attention from the data.
- **Cross-fading numbers:** two glyph sets overlapping at partial opacity ghost and look muddy.
- **Uniform motion:** one easing and long durations (1.1–1.7 s) give expressive motion in a working tool.
- **Line draw on load:** redrawing the line on every load is a decorative reveal, not a transition between
  two real states.

**Principle:** motion carries information and decoration never moves. The page is an instrument. It is
complete at first paint, and something moves only when data really changes or the user acts.

The coordinator's research sources include:
- Emil Kowalski, "You don't need animations" and "Great animations";
- Rauno Freiberg, "Invisible details of interaction design";
- the Vercel Web Interface Guidelines;
- IBM Carbon's productive and expressive motion;
- Apple HIG Motion and SwiftUI `numericText`;
- NumberFlow;
- Jake Archibald on cross-fading DOM elements;
- Heer & Robertson (2007) on animated transitions;
- Highcharts and Observable Plot on pointer snapping.

### Decisions (user-agreed)

1. **No load motion.**
   - The page appears complete: no card stagger or rise, no line draw, no light entrance, no wash drift, no
     end-point or peak entrance.
   - Content is never hidden while fonts load.
   - *Amended by Round 7 §4 (a first-open intro) and by "Decisions on the step 3 intro" §1 (on a
     first open, the numbers are hidden for at most 200 ms while fonts load). Further amended by the user's decisions
     of 2026-09-29 and 2026-09-30, recorded in the r04 activation handoff: a font that arrives late shows the fallback
     at the first paint and swaps to Readex Pro before the intro starts, and the intro never moves. When the font files
     are slow, Chromium's first-paint hold of about 100 ms (measured 108-124 ms) is accepted.*
2. **Lights are static, always.**
   - Remove the lights' entrance, the pointer-follow light, and the crowd-dependent light option.
   - The user sees no value in the crowd-dependent light, and it is not visible anyway.
3. **Numbers roll by digit** (option A, odometer style) wherever a number changes live. This includes
   "Inside now" and "Entries".
   - Only the digits that change move: up when the value rises, down when it falls. Each roll takes about
     250–300 ms with ease-out.
   - Use tabular figures, so the width never jumps. Never cross-fade.
   - Screen readers hear the new total once, through a polite live region on the number, not per digit.
   - With reduced motion, the value swaps instantly.
4. **The crowd-level indicator never cross-fades.**
   - The small bars change individually, for example a bar filling or emptying with a short `scaleY`, or
     instantly.
   - The level word swaps without ghosting.
5. **Chart hover snaps to half-hour stops.**
   - The stops are aligned with the drawn line, from opening to 1:00 AM.
   - The tooltip shows the time, the line's own value at that stop (the centred average, never the raw
     minute), the crowd level, and the usual value. *Except at the latest-reading stop, which shows the
     latest reading (Round 7 §1).*
   - **Extra stops:** the true peak (62 at 6:29 PM) and now (the latest reading).
   - **The marker always sits on what it describes:** on the line, or on the peak marker.
   - **Missing span:** it has no normal stop. It is either skipped or shown as one clearly labelled
     "no reading" stop, and the line is never bridged.
   - **After now:** stops show "still ahead" with the usual value, as today.
   - **Keyboard:** the arrow keys step one stop.
   - **Detail:** minute-level detail stays in "View details".
6. **A new hover marker.**
   - *Superseded by Round 7 §2–§3 and "Decisions after step 1": the marker is form B, the hollow ring,
     and it follows with the clip-derived easing, settling in about 400 ms.*
   - The user wants a better marker than the current ring in the chart, with pleasing motion as it moves.
   - The designer proposes its form. It must feel precise and premium in FITWAY red and chalk, not a
     generic ring.
   - **Coordinator's suggestion:** between stops, the marker glides *along the curve itself*, not in a
     straight hop, in about 120–160 ms. The guide line and the tooltip follow.
   - Tooltip text and numbers change without a cross-fade.
7. **Live update.**
   - Keep "extend, never redraw", with the tail morph that the centred average needs. Make it short, about
     250–300 ms.
   - The live pulse stays, because it carries "live", but it becomes calmer and subtler. There is none when
     delayed.
8. **Other motion.**
   - Tooltip and guide motion stays short (≤ 150 ms). *Replaced by Round 7 §3 for the marker, the
     guide, and the tooltip.*
   - The rail keeps its transform-only open and may be quicker.
   - Nothing else animates.
9. **Tuner.**
   - Remove the "replay load", "follow the pointer", "switch on at load", and crowd-light toggles.
   - Keep "simulate a new reading" and "motion on/off". Add a way to simulate a crowd-level change, so the
     bars can be judged.
10. **Acceptance.**
    - With reduced motion and with `?motion=off`, every static frame must stay pixel-identical to
      `eclipse/evidence/pre-motion-hashes.json`.
    - The only exceptions are the tuner-open frame and the hover frame, which change by design because of
      the new marker and the tooltip value.
    - The user's tuned light values in `:root` do not change.

### After the Daily page (user-agreed plan)

- **Screen order:**
  1. Reports: weekday/hour pattern, week-over-week comparison, date range, CSV export.
  2. Activity Log.
  3. Access: staff PINs, with provision, rotate, and deactivate.
  4. Settings: capacity, thresholds, hours, time zone, feed geometry, and transparency wording.
  5. Operations: sensor and feed health.
  6. Mobile: 390 px, 320 px, and 200% reflow. *Replaced by "The design-phase plan" (2026-09-30): each screen is
     designed at every size in its own round, and Staff and Public follow the Owner screens.*

  The table, form, and dialog system is designed early, on the first screen that needs it, because it
  shapes the rest. The user welcomes proposals to merge screens.
- **Merge proposals from the coordinator** (*agreed in Round 7 §6 and confirmed on 2026-09-27*):
  - **Contextual history:** keep the full Activity Log page, but also show each screen's own recent
    history in place. For example, Access shows its latest PIN changes and Settings its latest changes.
  - **Operations as a header status:** make Operations a persistent status in the header, for data
    freshness and sensor health, that opens a detail page. It would then need no primary rail slot, since
    the owner needs it mainly when something is wrong.
  - **Daily and Reports:** keep them separate. They answer different questions: now against patterns.
- **Style (user, 2026-09-28):**
  - The remaining screens follow the Daily page's current Eclipse style. Their content may change, as the next point
    says, but their look does not.
  - The direction becomes the reference only after the user approves all of it, including its motion, having seen
    it.
  - *Clarified on 2026-09-30 ("The design-phase plan", §2): the visual language carries over, not the Daily page's
    composition. Each screen decides its own arrangement and where the red light goes, if anywhere.*
- **Content freedom:**
  - The remaining screens need not copy the production screens' current content or structure. The
    designer proposes what is most useful to the owner and what should change.
  - Some changes may touch a locked Product/Spec decision, such as data semantics, privacy, security,
    roles, or audit truth. Such a change is surfaced explicitly and recorded as an amendment before
    anything relies on it, as with the 2026-09-24 `SPEC.md` entries amendment.
- **Authority intent:**
  - Once this direction is finished and polished, the user intends it to become the primary reference
    for the interfaces. Paper and the older designs would then be withdrawn as references, because the
    user has had many problems with them.
  - This needs a formal, human-approved authority record later. That record also confirms the exact
    scope: Owner only, or Staff and Public too. It supersedes ADR-007 and ADR-009 where it applies, and
    updates the register and the manifest.
    *Scope decided on 2026-09-30: Staff and Public are redesigned too, and the record covers all three surfaces
    ("The design-phase plan").*
  - Nothing is withdrawn yet.
- **Production:**
  - The user will use Codex to implement production.
  - The coordinator will later prepare the plan and the environment for Codex: the authority record,
    task packets, reference frames and specifications, and verification routes.
  - *Refined on 2026-09-30: Codex starts with one bounded part as a pilot, which measures how faithfully it carries
    the reference into production, before the rest ("The design-phase plan", step 11).*

## Round 7 — after the Round 6 review (agreed 2026-09-25)

The user reviewed Round 6 in the browser.
- **Kept as is:** the digit roll and its motion ("excellent").
- **Disliked:** the "reading sight" marker, which looks like a shooter game's crosshair, and its movement
  between stops, which is too fast and does not feel smooth.
- **Reference clip:** the user supplied `D:\Projects\LLM_HANDOFFS\FITWAY\20260317-1837-34.2222242.mp4` as a
  reference for smooth hover motion. It is feel only; do not copy it.
- **The coordinator's measurement of the clip:**
  - It runs at 30 fps.
  - The tooltip follows the pointer with a fast start and a long, soft landing: about 60% of the distance in
    about 100 ms, and settled in about 350–400 ms.
  - The remaining distance shrinks by about 0.7 per 33 ms frame, which is exponential or critically damped.
  - Text changes at once.
  - The old ring shrinks away, and a new ring appears at the new point.

### Decisions (user-agreed)

1. **The latest-reading stop shows the latest reading** (49 · Busy at 7:42 PM), the same as the Inside now
   card. It no longer shows the line's value (47 · Moderate). The marker stays on the line's end point.
2. **Marker: two candidate forms, and the user chooses.**
   - **A, a lit bead:** a solid FITWAY-red dot with a thin light rim, and a soft red glow that lights the line
     around it.
   - **B, a hollow ring:** a dark centre and a red edge, with a soft glow. It is close to the reference clip.
   - **Common to both:**
     - no level ticks, and nothing above the point: no guide line over the marker;
     - the thin red hairline from the point down to the time axis stays;
     - after now, the marker is a hollow chalk ring on the usual line;
     - with no history, there is no marker after now (confirmed);
     - the peak and missing-span stops get a fitting variant of each form.
   - **Choosing:** a tuner switch changes between A and B on the real page, and an enlarged side-by-side
     comparison is rendered. A third form (a lit segment of the line) was dropped by the user.
   - *Settled in "Decisions after step 1" §1: form B, with A's missing-span variant. Form A is removed.*
3. **Marker motion: a smooth follow.** This replaces the Round 6 glide of 120–150 ms, and the ≤ 150 ms limit in
   Round 6 §8 for the marker, guide, and tooltip.
   - The marker chases its target along the curve itself, with a fast start and a soft landing, settling in
     about 350–400 ms like the reference.
   - It never restarts at each stop: a new target mid-motion is taken up smoothly. A quick pass over several
     stops is one continuous movement.
   - The tooltip moves with the marker, and its text still changes at once.
   - The arrow keys use the same motion. With reduced motion, it jumps.
4. **A first-open intro.** This amends Round 6 §1, "No load motion".
   - **When:** only on the first open in a browser tab. It does not play on F5 or a reload, or when returning in
     the same tab session, and it plays again in a new tab or after the browser restarts.
   - **What is still:** the surfaces are present and still from the first paint: the glass cards, the lights,
     the wash, and the rail. The lights never move.
   - **What moves:** only the content inside the surfaces.
     - The numbers roll into place with the same digit roll.
     - The line draws once, from opening to now, and then the end point and the peak appear.
   - **Length:** short, about 1 s or less in total. The numbers settle first and quickly, because they answer
     the owner's first question. The line takes longer, because it tells the day's story. *The user later
     approved a slower intro, about 1.17 s in total ("Decisions after the step 3 report").*
   - **The end state** is the still page, pixel for pixel. There is no intro with reduced motion or
     `?motion=off`.
   - **Tuner:** an "intro speed" control and a "replay intro" button. The tuner is a tool, not part of the
     design.
5. **Unchanged:**
   - no load motion beyond decision 4;
   - static lights;
   - the digit roll, the level bars, the live tail and the pulse, and the rail;
   - every still frame (the pixel-identity rule of Round 6 §10 still holds, except the frames the marker
     changes by design).
6. **Merge proposals from "After the Daily page":**
   - **Contextual history is agreed.** The full Activity Log page stays, and each screen also shows a small
     "Latest changes" list of its own last 3–5 changes, for example PIN changes in Access and value changes
     in Settings.
   - **Operations becomes a header status** for data freshness and sensor health. It opens a detail page and
     has no primary rail slot. This is agreed.
   - **Daily and Reports stay separate.** This is agreed.

### Work plan (user-agreed)

- **Order:** fresh, bounded designer agents, one after another, all confined to `eclipse/`:
  1. the marker forms A and B with a tuner switch, then the user chooses;
  2. the smooth follow on the chosen form, the latest-stop fix, and removing the other form;
  3. the first-open intro.
- **Verification:** after each designer, a fresh, independent verifier agent (`xhigh`) checks the work from the
  brief, the code, and rendered and executed evidence. It does not use the designer's reasoning. The
  coordinator reviews the verifier's evidence (its frames and numbers), not only its claims, before showing
  the user.
- **Later, a separate task:** define this independent-verifier role in `docs/WORKFLOW.md`, with the user's
  approval.

### Decisions after step 1 (user-agreed 2026-09-25)

Step 1 delivered forms A and B with a tuner switch, and an independent verifier passed all ten checks. The user
tried both.

1. **Form B, the hollow ring, is chosen.** Form A is removed, with one exception: **the missing-span stop uses
   A's variant**, the dotted mark on the time axis lit in chalk with its soft light. B's capsule outline is
   dropped.
2. **The live pulse stays as it is,** including when B sits on the latest reading. The verifier's F1, the pulse
   drawing a ring inside B every 5 s, was put to the user, and they chose to keep it.
3. **Marker motion (decision 3), now specified from the reference clip.** The coordinator tracked the clip's
   tooltip frame by frame, at 30 fps.
   - **Text:** it changes at once when the stop changes, and then the tooltip travels.
   - **Easing:** fast start, long soft landing. About 20% of the distance is covered in the first 33 ms, about
     60% by 100 ms, and about 90% by 230 ms. It is settled at about 400 ms. The remaining distance shrinks by
     about 0.7 per 33 ms, which is exponential or critically damped.
   - **Path:** it moves in x and y together, following the line's height.
   - **Appearing:** on first hover the tooltip appears quickly, in about 60–100 ms.
   - **In the clip, the ring does not travel:** the old ring shrinks away and the new one appears. **The user
     chose instead that B glides along the curve itself, together with the tooltip, on the same easing.** A
     new target mid-motion is taken up smoothly, with no restart at each stop. The arrow keys use the same
     motion. With reduced motion, it jumps.
   - **Tuner:** a "hover speed" control, so the user can tune the feel.
   - **Step size (the user's note):** the clip's stops are hourly (11:00, 12:00). Every one-hour jump in the
     clip, about 140 video px, settles in about 12 frames (400 ms). Once, the pointer moved two hours quickly,
     and the motion took up the new target without restarting. **The user confirmed that the stops stay
     half-hourly** (Round 6 §5). The follow is time-based, so the same feel applies to the shorter half-hour
     steps.
4. **Carried into step 2 from the verifier:**
   - **F2:** when a live update arrives with the latest stop selected, the end halo flashes for 50–75 ms. Fix it.
   - **F5:** the first move into the future blocks the main thread for about 180 ms, because the usual line's
     sampling table is built lazily. Build it ahead of time, or make it cheap, so the follow is never janky.
   - **F3 (A's glow at the peak)** no longer applies, because A is removed.
5. **Step 2 therefore covers:**
   - form B only, with A's missing-span variant;
   - the clip-derived follow and its speed control;
   - the latest stop showing the latest reading (decision 1: 49 · Busy);
   - F2 and F5.
   Step 3, the first-open intro, stays as decision 4.

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
3. **README wording (low):** `eclipse/README.md` says the answers are hidden "for at most 200 ms". The re-check saw
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

## The design-phase plan (user-agreed 2026-09-30)

The user reviewed Reports at `31a40d6` and found it beautiful and excellent: the designer understood the direction and
built the page whole, almost in one attempt. There is room to improve, above all on the phone and the other sizes.
This plan replaces "Screen plan (user-agreed)" and the "Mobile" step of "After the Daily page".

### 1. The goal, as the user confirmed it

- Eclipse becomes the single design reference for FITWAY's interfaces, replacing Paper and the older designs. Whoever
  builds from it later, Codex in production included, builds from one clear reference and never guesses.
- To be that reference, it is complete: every screen, at every size, in every state. An incomplete reference leaves
  the builder to improvise, and that is what went wrong before.
- The phone is designed with each screen from the start, so the designer places the content well once instead of
  patching it later.
- **The language carries over; the composition does not.** Dark, glass, the FITWAY red light, Readex Pro, the calm
  premium feel and the finish stay. Each screen composes its own page and decides where the light goes, if anywhere;
  the Daily page's arrangement, such as which card is lit, is not a template.
- A written spec sheet turns the design from pictures into exact rules and numbers.
- The tests come at the end, once every screen and size is settled, so nothing that will still change gets tested.
- Every task goes to a fresh agent with a small context.
- The user sees and discusses each screen before the next one starts.

### 2. Sizes

- **Designed:** desktop 1440×900, tablet 768×1024 and phone 390×844, the Product anchors.
- **Checked only, so nothing breaks:** 320 px, 1024 px and 200% zoom reflow.

### 3. Navigation and header across sizes (user-agreed)

- **Desktop:** unchanged: the slim icon rail.
- **Tablet (768):** the same slim rail. Pressing the logo opens it over the content, and the content reflows to two
  columns.
- **Phone:** the rail becomes a glass bar at the bottom with five items: Daily, Reports, Activity Log, Access and
  Settings. Each item has a short label under its icon, arranged neatly.
  - The header becomes compact: the title, the Operations status as a small badge that opens its details, and a
    menu holding the language and sign out.
  - Page controls, such as Reports' period, sit under the title at full width.
  - No hamburger menu: it hides the navigation and adds a tap, and five sections fit at the bottom even at 320 px.
- The designer builds it in step 3, and the user sees it before it is adopted.

### 4. The spec sheet

- It is written from the pages as built, and grows with every screen.
- **Four safeguards,** so that nothing weak becomes a rule:
  1. before it is written, a fresh design reviewer critiques the built pages, and the user picks which findings are
     right;
  2. every entry is one of three kinds: a **rule** to follow, a **page composition** that stays free, or a **known
     issue** that is never copied and has a round that fixes it (for example, the Daily page's 38 px buttons are an
     issue; the rule is 44 px);
  3. every number is measured from the rendered page and checked against `DESIGN_GUIDE.md`, Product and the
     accessibility rules. What fails is recorded as a known issue, not as a rule;
  4. the user reviews it. It stays a draft until the end, and before the authority record the tests compare it with
     the final pages.
- **Structure:** shared foundations for all three surfaces, then a section for each surface.
- A page that renders every component in each of its states goes with it.
- It becomes a reference only through the authority record in step 10.

### 5. The steps

1. A design review of Daily and Reports. The user picks from its findings.
2. The spec sheet, first version, with its components page.
3. Daily at every size and in every state, including loading. This round settles the navigation and header for every
   screen. It also takes in the 1024 px card-header overflow, the `#busy-note` jump on narrow screens, and 44 px
   controls (moved here from the polish, user decision 2026-09-30, because the phone needs 44 px targets anyway).
4. Reports at every size, with the review findings the user picked.
5. The other Owner screens, one at a time, each at every size and in every state: Activity Log, then Access, then
   Settings, then Operations.
6. Staff, with the PIN sign-in screen. It reuses much of the Owner surface.
7. Public. Product keeps it mobile-first, light, and free of any control or personal data, so its design starts from
   the phone.
8. The final polish across all screens: consistency, details and motion, which show only when every screen sits side
   by side.
9. The tests and the independent verification: a fixed suite across every screen, size and language, with other
   browsers checked. Codex makes the repairs.
10. The authority record: an ADR that makes Eclipse the reference for all three surfaces and withdraws Paper, with the
    final spec sheet and named reference frames for every screen and size. The user approves it.
11. Production: Codex starts with one bounded part as a pilot, measuring how faithfully it carries the reference into
    production, before the rest.

**Every design round:**
- a fresh designer;
- then a fresh design reviewer who proposes improvements;
- the coordinator inspects the frames;
- the user decides;
- whatever is new is added to the spec sheet.

Each round ends in a state the user is happy with, so the final polish refines and does not repair.

### 6. Process notes

- Staff and Public lie outside this milestone's scope, which is the Owner surface. Each opens as its own milestone
  when the plan reaches it.
- Between rounds, light checks stay:
  - each designer proves that the earlier pages did not change;
  - the coordinator inspects the frames before the user sees them.
- The user's decisions on the Reports proposals:
  - 44 px controls, as in step 3;
  - no intro on Reports, and no rolling digits on a period change, both pending the user's final view in step 4.
