# Eclipse v3 (Owner r04, full Daily page)

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

## Thesis

The structure is familiar: the rail, a header, four small cards and one chart card. The finish is where
the craft goes. There are only three lights on the page: the page wash, the chart card and the Inside
now card. Each card light is a light behind the glass with a large dark disc in front of it, so light shows
only around the disc's edge. Everything else is a near-black card with a thin border.

## Colours

- **Page and cards:** page `#070707`, cards `rgba(15,14,15,.94)` with 1px `rgba(255,255,255,.075)`
  borders.
- **Text:** chalk `#F5F3F2`, `#C9C3C4` and `#AAA4A6`. Status colours are live `#4BE29B` and delayed
  `#D9A400`.
- **Line:** `#FF2946`.
- **Light ramp (Round 4, unchanged):**

| Colour | Step |
| --- | --- |
| obsidian `#08090A` | the base every light fades into |
| oxblood `#4D0713` | broad and outer areas |
| FITWAY red `#E51935` | the core |
| `#FF2946` | only the hottest point, just inside the lit card's corner |

## Light model (v3)

Every setting is a plain number on `:root` in `style.css` (`--now-*`, `--chart-*`, `--wash-int`, `--grain-o`).
These are the Recommended values. The lighting section turns them into geometry, and the tuner overrides them
live on `<html>`.

**The user's tuning is now the default (2026-09-25).**
- **Source:** the user tuned the lights in the tuner and sent the "Copy values" JSON. The coordinator made
  those values the `:root` defaults, so Recommended is now the user's tuning.
- **Values:**
  - **Inside now:** intensity 0.7, core `#E51935`, disc size 77, position 67, softness 34px, rim 8%, lit-corner
    glow 0.05 at size 110%, far glow 0.9, ring-end fade 19.
  - **Chart:** intensity 0.95, fade 11.5, sides 48.5, balance 0, softness 260px.
  - **Page:** wash 1, grain 0.15.
- **Check:** the page with these defaults and no stored tuning is pixel-identical to the user's stored tuning
  on the old defaults, in AR and EN.
- **Measurements:** the tables under "Measurements" below were taken on the designer's first Recommended
  values, not on the user's tuning. The coordinator's measurements of the user's tuning are in the handoff.
- **The designer's first Recommended values:**
  - **Inside now:** intensity 1, disc 76, position 69, softness 10px, rim 3%, lit-corner glow 1 at 100%, far
    glow 1.15, ring-end fade 18.
  - **Chart:** intensity 1.1, fade 17, sides 35, balance 0, softness 48px.

- **Structure:** each lit card owns a `.lamp`. It covers the border box, is clipped to the card's outer
  radius, and is a size container, so the geometry is in `cqw`/`cqh` of the card.
  - `.lamp-in` is masked by the disc: a radial gradient, transparent inside and opaque outside. Where the
    disc sits you see the card's own base, never a painted patch.
  - `::before` is the light. `::after` is the grain, masked by the light, so grain shows only where lit.
  - `.lamp-rim` is the 1px border, brightened where the light touches it. It sits under the same disc.
  - Positions are measured from the lit (inline-end) side, so everything mirrors in LTR.
- **Inside now: a dark disc in front of a light.**
  - **Light:** a hot point (`#FF2946`) just inside the inline-end bottom corner, a FITWAY-red core that
    steps down to oxblood, a flat band along the whole bottom edge that feeds the rim, and a small glow in
    the far bottom corner.
  - **Disc:** an ellipse 0.7 as tall as it is wide, in pixels (`--now-disc-aspect`). Its radius is 76% of
    the card width, and its centre is 69% of the width from the lit side. Its lowest point sits 3% of the
    card height above the bottom edge, which is the thin continuous rim.
  - **Edge:** the feather is 10px along the card (7px across) and eased (0, .16, .5, .84, 1), and centred on
    the nominal edge. It reads as one clean arc.
  - **Ring ends:** up the lit side, a fade mask anchored where the disc meets the side (computed in CSS
    with `sqrt()`/`pow()`) takes the ring to transparent over 18% of the card height. Toward the far end,
    the band dims on its own before the far-corner glow, which fades up the far side.
- **Chart card: a U around a dark disc.**
  - The disc is 54cqw wide (just past both sides). Its lowest point is `--chart-fade` (17%) above the
    bottom, its edge meets the sides at `--chart-side` (35%), and its feather is 48px.
  - The light is an oxblood band along the bottom, with a steep fall-off, plus two wide corner glows, red
    only near the corners. `--chart-balance` weights the two corners (0 = equal).
- **Page wash:** unchanged geometry. `--wash-int` scales its alpha.
- **Grain:** unchanged texture. `--grain-o` is 0.15.

## Light tuner

`tuner.js` is a classic script (no modules, no fetch), so it works when `index.html` is opened from `file://`.
It is a working tool, not part of the design.

- **Look and place:** a small dashed "الإضاءة · Lights" button at the top, 452px in from the inline-start
  edge, with the panel opening directly below it. It is Arabic-first and right-to-left, with short English
  secondary labels.
- **Moving it (added by the coordinator on 2026-09-25, at the user's request):**
  - The button and the panel move together as one unit.
  - Drag the button, or drag the panel's header by its title or its ⠿ grip.
  - Dragging never presses the button. Opening the panel near an edge pulls the unit back inside the
    viewport.
  - The spot is kept in `localStorage` (`fitway.eclipse.v3.tuner-pos`), separate from the light values, and
    is measured from the page's inline-start edge.
  - On the grip, the arrow keys move the unit 12px, or 60px with Shift. Home, or a double-click on the
    header, returns it to its original spot.
- **Access:** keyboard operable, with native range inputs, labels and outputs. Escape closes the panel and
  returns focus to the button.
- **Controls:**
  - Inside now: intensity, core colour, disc size, disc position, edge softness, rim thickness, lit-corner
    glow and its size, far-corner glow, and ring-end fade.
  - The coordinator added the lit-corner glow controls on 2026-09-25, at the user's request:
    - `--now-hot` sets the strength and `--now-hot-size` the size of the `#FF2946` hot spot just inside
      the lit corner.
    - It is the bottom-left in Arabic and the bottom-right in English.
    - The defaults (1 and 100%) render exactly as before.
  - Core colour is an OKLCH hue slider limited to 21-29 at FITWAY red's own lightness and chroma, so it cannot
    reach pink or purple. `#FF2946` is hue 21.6 and `#E51935` is 22.9.
  - Chart: intensity, fade distance, side height, corner balance and edge softness. Edge softness is one
    control beyond the brief. It is needed to reproduce v2's haze.
  - Page: wash and grain.
- **Presets:**
  - **v2** is the closest the new controls get to Eclipse v2.
  - **A-like** changes only the chart, and is fitted to light-study A.
  - **Recommended** is the CSS defaults. The tuner reads its Recommended values from the stylesheet.
- **Buttons:** "Copy values" copies `{preset, values, css}` as JSON. If the clipboard fails, a selectable
  textarea shows the JSON. "Reset to Recommended" removes every override.
- **Storage:** tuning is kept in `localStorage` (`fitway.eclipse.v3.lights`). Every access is wrapped in
  try/catch.
- **Marker group:** step 1's «علامة المخطط: A / B» switch is gone with form A (Round 7 step 2).
- **Motion group** (Round 6):
  - «قراءة جديدة» "New reading": the next minute of the same simulated day. «إعادة القراءات» "Reset readings".
  - «مستوى الازدحام» "Crowd level": «مستوى أعلى» "Level up" and «مستوى أدنى» "Level down" simulate a crowd-level change
    on the Inside now card. Each crosses the nearest level boundary by the smallest step, so Busy 49 goes down to
    Moderate 48 or up to Packed 69. It changes the card only, and "New reading" or "Reset readings" clears it. It is
    off while delayed, because a stale card never moves, and a short note says so in both languages.
  - «الحركة» "Motion": one switch, kept in its own `localStorage` key (`fitway.eclipse.v3.motion`), separate from the
    light values, and ignored with `?tuner=0`.
  - «سرعة انتقال العلامة» "Hover speed" (Round 7 step 2): a range from 0.5× to 2×, default 1× (the reference clip's feel),
    with a small «الافتراضي» "Default" button. It divides the follow's time constants; the output shows the multiplier
    and the settle time, for example "1.00× · 400 ms".
    - It is kept in the same key as the Motion switch (`{ motion, hoverSpeed, introSpeed }`), which app.js already owns
      and ignores with `?tuner=0`. The light values' key and "Copy values" stay about lights only.
  - «سرعة المقدمة» "Intro speed" (Round 7 step 3): a range from 0.5× to 2×, default 1×, with its own «الافتراضي»
    "Default" button. It divides every duration of the first-open intro; the output shows the multiplier and the
    intro's length, for example "1.00× · 1171 ms". It is kept in the same key and ignored with `?tuner=0`. A new speed
    applies to the next intro, never to one that is playing.
  - «إعادة المقدمة» "Replay intro" (Round 7 step 3): plays the intro again on the page as it is now (the current
    reading). It is disabled with reduced motion, `?motion=off` or the Motion switch off, because there is no intro then.
  - Removed in Round 6: "Replay load", "switch on at load", "follow the pointer" (and "chart card too"), and "light
    follows crowd" with its level preview.
  - Scripts reach the same actions on `window.__eclipse.motion`: `step()`, `reset()`, `crowd(1 | -1)`,
    `set({ motion, hoverSpeed, introSpeed })` and `settle()`. The intro has its own `window.__eclipse.intro`: `state`,
    `played`, `reason`, `yieldedBy`, `timings`, `replay()`, `seek(ms)`, `release()` and `settle()`.
- **URL:**
  - `?tuner=0` means no panel and no stored tuning.
  - `?preset=v2|a-like|recommended` starts from that preset without storing it.
  - With `tuner=0`, a preset still applies, with no panel. The preset frames are captured this way.

## Measurements

These are measured in `capture.mjs` on light-only 1x captures, with the card content hidden. The values are
OKLab L relative to each card's own base (L 0.161). The 1px border is excluded. Peaks and fade heights use a
5×5 blur.

**Chart card:**

| | Pure dark | Haze (+.02 to +.10) | Lit | Fades to black (% of height) | Lower corner peak L (inline-end / inline-start) |
| --- | --- | --- | --- | --- | --- |
| Recommended | 79.7% | 13.5% | 6.8% | 14.1-32.5 (middle 14.3, corners 31.6 / 31.5) | 0.471 / 0.471 |
| A-like | 81.5% | 12.1% | 6.4% | 13.3-33.7 (middle 13.6) | 0.570 / 0.321 |
| v2 preset | 66.6% | 30.0% | 3.5% | 25.9-43.9 (middle 28.8) | 0.347 / 0.347 |
| light-study A, same method | 80.4% | 13.0% | 6.6% | 12.0-33.5 (middle 13.0) | 0.535 / 0.311 |
| true v2, same method (scratch rebuild, pixel-identical to the v2 frame) | 64.7% | 33.6% | 1.8% | 28.1-44.3 | 0.365 / 0.364 |

My method reads A a little lower in the middle than the coordinator's (13.0 against 15, with 79/13/8 for
the areas). Recommended's middle, 14.3, is above A's 13.0 on the same method.

**Inside now, Recommended, RTL.** The rows run from the far corner to the lit corner:

| Row | L values |
| --- | --- |
| y = 0.98 | .41 .32 .26 .24 .23 .21 .23 .23 .23 .25 .26 .27 .28 .29 .34 .43 .51 .57 .61 .63 |
| y = 0.95 | .37 .29 .21 .17 .16 .16 .16 .16 .17 .19 .24 .26 .26 .27 .32 .41 .47 .55 .60 .63 |

- **Side column:** the inline-end side column is base down to y≈0.45, then 0.21 at 0.50, 0.33 at 0.55 and
  0.63 at the corner.
- **Reference:** the reference is .45 at the far corner, .19-.30 in the middle and .74-.79 at the lit
  corner, with a dark middle at y = .95.
- **Lit corner:** it stops at L 0.63, because FITWAY red is L 0.589 and `#FF2946` is L 0.645. Going paler
  would turn pink.
- **LTR:** the LTR profile mirrors this within 0.03 (grain).

## Line, cards and states (unchanged from v2)

- **The line:** a centred 30-minute average (15 minutes before and after, triangular weights). The window
  is cut at opening, at the missing span and at the latest reading, and the zero span stays 0. The crest is
  at 6:31 PM, 2 minutes after the 6:29 PM peak. The true-peak ring «الذروة 62» sits above it.
- **Usual Wednesday:** dashed, and fainter after now.
- **Comparison chip:** it shows only for a clear difference, so today (about usual) shows nothing.
- **Entries:** «مرات الدخول», with «المعتاد 318» below it.
- **States:** `?state=live|delayed|nohistory`, `?lang=ar|en`. Delayed shows only in the header status and
  the Inside now card. Its lights stay as they are, as Round 2 allows.
- **Hover:** Round 6 changed the chart's hover. It snaps to stops and shows the line's own value; see "Motion".

## Motion

Round 6 (`../NEXT-DIRECTION-BRIEF.md`, decisions 1-10) replaced the Round 5 motion.

**Principle:** motion carries information, and decoration never moves. The page is an instrument: it is complete at
first paint, and something moves only when the data really changes or the owner acts. Round 7 (decision 4) makes one
exception, the first-open intro (11 below): once per browser tab, the content inside the still surfaces arrives.

The motion lives in the "motion" section of `app.js`, which uses the Web Animations API. The few pieces it needs are
in the motion section of `style.css`. No glyph ever changes opacity, anywhere:
- numbers roll inside a clip;
- words swap at once;
- the tooltip appears, changes and leaves at once;
- the rail's names are uncovered, never faded.

At rest no inline style, attribute or extra element from the motion remains. The one exception is the live pulse,
and only while live.

**What moves, and when**

| What | When | Moves | Lasts | Easing |
| --- | --- | --- | --- | --- |
| Changed digits | a number changes (a new reading, a level change, a minute passing while delayed) | transform: the new digit rolls in, the old one rolls out | 280 ms | `cubic-bezier(0.25, 1, 0.5, 1)` |
| A level bar | the crowd level changes | transform: scaleY of a red fill, from the bottom | 200 ms, then 50 ms between bars | same |
| The chart's marker (form B) | the owner moves between stops (pointer or keys) | SVG geometry each frame, along the drawn path; the lit hairline and the tooltip follow (the smooth follow, Round 7 step 2) | settled in about 400 ms, whatever the distance | two lags in series, 90 ms and 15 ms (divided by the hover speed) |
| The line's tail | a new reading | SVG path of the last 15-30 minutes, end point, the tail's fine lines, the now clip | 280 ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Live pulse | while live only; none while delayed | a thin ring, opacity 0.4 to 0 and scale 0.34 to 1, from inside the end point to just past its halo | every 5 s, visible for the first 48% | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| Rail | the logo is pressed | transforms: the end cap slides and the middle scales; the darker surface layers and the shadow fade (no text); each name is uncovered by a clip | 240 ms open, 200 ms close | `cubic-bezier(0.22, 1, 0.36, 1)` open, `cubic-bezier(0.4, 0, 0.2, 1)` close |
| Intro: the answers | a tab's first open only (Round 7 step 3) | transform: each answer's value enters its final place from below, inside the digits' ink box (the digit roll) | 400 ms, from the start | `cubic-bezier(0.25, 1, 0.5, 1)` |
| Intro: the line | the same | `stroke-dasharray` of today's line parts, by minutes since open; one clip uncovers the fine lines under it | 914 ms, from the start | `cubic-bezier(0.3, 0.2, 0.4, 1)` |
| Intro: the end point and the peak | the same, when the line arrives | SVG transform: the live end point and its halo, and the peak ring, scale from 0.34 to 1; the peak's drop and label appear at once | 257 ms, from 914 ms | `cubic-bezier(0.25, 1, 0.5, 1)` |

The intro's durations are at 1×; the tuner's intro speed divides them. Nothing else animates: the lights, the wash, the
hover colours of the rail tiles and buttons, the details chevron, and the jump to "View details" are all instant.

**1. Load: the first-open intro only (the changed first-paint rule).**
- Round 6 had no load motion. Round 7 (decision 4) amends that with the first-open intro (11 below), and only that:
  there is still no stagger, rise, light entrance or wash drift, and the surfaces are complete at first paint.
- Without an intro (a reload, a return in the same tab, reduced motion, `?motion=off`, the Motion switch off) the page is
  complete at first paint, as before, and nothing is hidden while the fonts load.
- With an intro, the four answers wait out of sight and today's line is not drawn until the fonts are in (the cap is
  200 ms, counted from the first paint entry or earlier; with slow fonts the still page's answers were in view 153-231 ms
  after the first paint across the recorded runs; 11 below). Everything else is complete at first paint.
- The inline script in `index.html` sets only language, direction and state. app.js decides the intro before the first
  paint.
- The chart renders at once. It is measured again when the fonts arrive, because the header's text sets its height,
  and again whenever its box changes.
- **The rule the capture checks now:** on a first open the intro plays and ends identical to the still frame (the live
  pulse hidden), with the DOM equal to the `?motion=off` DOM and only the pulse running after it (nothing while delayed);
  a reload in the same tab has no intro at all and is the still frame at once, with only the pulse on load.

**2. Lights are static, always.**
- The entrance, the pointer-follow light and the crowd-dependent light are gone, with their code and CSS, including
  the light layers' `--lp` overscan.
- The tuned light values in `:root` are untouched, and the lights render exactly as before.

**3. Digits roll (odometer, option A).**
- **Where:**
  - Inside now;
  - Entries and its usual value;
  - the header's "Last reading" time and the Inside now card's time;
  - the delayed card's "minutes ago";
  - Today's peak value and time;
  - the busiest time and its average.
- **How:** only the digits that change move. They roll up when the value rises and down when it falls. Times roll
  forward with the clock.
- **Rest form:** for the roll only, the number becomes a numeric run and a slot per changed digit.
  - The numeric run is an LTR isolate, so bidi order holds in Arabic, for example «قبل 14 دقيقة».
  - Each slot holds the new digit and the old one; the old one is hidden from assistive technology.
  - At the end the element gets back exactly its plain markup.
- **The window is the digits' own ink box:** the cap line to the baseline, plus 0.08em, not the taller line box.
  - The baseline is measured in place, and the digits' ascent and descent come from the font.
  - A digit therefore enters at the baseline and leaves at the cap line, and the two digits never overlap.
- **Words** change at once. Examples are «دقائق» to «دقيقة», and the level word.
- **Screen readers:** one polite live region (`#live-say`) announces the new figures once per reading or level
  change, for example «داخل الصالة الآن 48 تقريبًا، متوسط. مرات الدخول 332.».
- **Reduced motion or motion off:** every value swaps at once.

**4. The crowd level never cross-fades.**
- Each bar that changes fills or empties with its own red fill (scaleY from the bottom).
- Lower bars fill first when the level rises, and upper bars empty first when it falls.
- The level word swaps at once. The comparison chip appears or leaves at once.

**5. The chart's hover snaps to stops.**
- **Stops:**
  - every half hour from opening, 6:00 AM, to closing, 1:00 AM, on the drawn line;
  - two of their own: the true peak (62 at 6:29 PM) and the latest reading (7:42 PM).
- **Folding:** a half-hour stop within 10 minutes of either special stop is folded into it. The peak takes the
  6:30 PM stop, and while delayed the latest reading (7:29 PM) takes 7:30 PM. The live page has 40 stops.
- **Missing span (2:14-2:31 PM):** one stop, "no reading" («لا قراءة»), with the range. There is no normal stop inside
  it, and the line is never bridged.
- **Values:**
  - Each stop on the line shows the line's own value, the centred average rounded to a whole person, with its level
    and the usual value. The raw minute stays in "View details".
  - The peak stop shows the true peak, because its marker is the true reading.
  - The latest stop shows the latest reading itself (Round 7 step 2): 49 · Busy, the Inside now card's number; see 6.
  - The zero stop at 6:00 AM shows 0 and «الصالة خالية» "Empty".
  - After now, a stop shows «لم يحن بعد» "Still ahead" and the usual value.
- **Pointer:** it takes the nearest stop, but the peak or the latest reading wins whenever the pointer is within
  10px of it. More than 16px beyond the first or last stop, nothing is selected.
- **Keyboard:** the page's convention is kept. In Arabic, ArrowLeft and ArrowUp go later and ArrowRight and
  ArrowDown go earlier; English mirrors it.
  - Each arrow moves one stop, and PageUp or PageDown moves four.
  - Home goes to opening and End to the latest reading. Focus starts on the latest reading, and Escape clears.
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

- **Common to every stop:**
  - Nothing above the point: no guide line, no level ticks. The one exception (the lane round) is the tooltip's
    connector, which is drawn behind the ring, in `#conn` and not in `#sel` (see "Tooltip lane").
  - Below the point, that moment's own thin red hairline runs down to the time axis. It starts 10px below the point.
  - The marker sits on what its tooltip describes (see "Measured" above).
- **The ring:** 6.5px radius, a 1.5px `#FF2946` edge and a dark centre (the card's own `#0F0E0F`). The line passes behind
  it and stops at its edge. A soft red glow (the edge, blurred, at 55%) surrounds the edge. There is never a dot inside
  the ring: a ring with a dot, or two rings, would read as a target.
- **Variants:**

| Stop | Marker |
| --- | --- |
| On the line | the ring, with the line behind it |
| The peak (on the peak ring) | the ring takes the peak ring's place (it covers it); no dot inside |
| The latest reading, live | the ring sits on the end point; the end point's thin halo steps aside (see "Marks the ring replaces") |
| The latest reading, delayed | stale, so the ring's edge is the end point's neutral grey `#8F898B`, with no glow; the hairline is chalk |
| Still ahead (on the usual line) | a hollow chalk ring at the same size, never red and without glow; a dashed chalk hairline below |
| Still ahead, no history | no marker (there is no usual line), only a short chalk tick on the time axis |
| The missing span | never a point: the dotted mark on the axis lights up in chalk (brighter dots, a faint chalk light). This is form A's variant; B's capsule outline is gone. |

- **Marks the ring replaces (the verifier's H1 and H2):** the chalk peak ring and the end point's thin halo.
  - Each steps aside at once, with no fade, on the first frame at which the ring's outer edge would touch or overlap the
    mark's outer extent. That is when the centre distance is below 7.25 px (the ring's outer radius) plus the mark's
    outer radius: 5.6 px for the peak ring, 9.5 px for the halo.
  - It comes back on the first frame the distance is beyond that, or when the selection clears.
  - It works the same both ways, during the follow, with keys and during a live update.
  - One case is left as drawn: a mark wholly under the ring's opaque centre, which is the peak ring when the ring sits
    on it. That mark cannot show, and leaving it keeps the peak hover exactly as before.
  - At rest this also hides the halo at the 7:30 PM stop, whose ring is 12.6 px from the end point.
  - The end point's solid core is never hidden. While the ring approaches or leaves the end point, the core shows beside
    the ring's edge for about 170 ms.
- **Tags:** the ring's group is `data-marker="b"`; the missing span's lit dots are `data-marker="gap"`.
- **Scripts:** `window.__eclipse.chart.marker` reports `"b"`. The chart API (`stops`, `select`, `clear`, `selected`) is
  unchanged.
- **The latest stop shows the latest reading (Round 7, decision 1):**
  - Live, it shows 7:42 PM, 49 · Busy, the same as the Inside now card, not the line's 47 · Moderate. The ring still sits
    on the line's end point.
  - While delayed, it shows the delayed card's reading (7:29 PM, 46 · Moderate), treated as the card treats it: a muted
    number and «قبل 13 دقيقة» "13 min ago" in the delayed colour, with the clock icon.
  - After a simulated new reading, it shows the new reading.
  - The screen-reader text never calls it an average: «7:42 م، آخر قراءة، 49 داخل الصالة، الازدحام مزدحم، المعتاد 45».
    While delayed it adds how old it is: «آخر قراءة قبل 13 دقيقة».
  - The tuner's simulated crowd-level change still changes the card only, as before; the latest stop keeps the reading.
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
  - **Sideways:** the box's left is its stop's x less half its width, kept 2 px inside the plot's sides (the closing stop is
    6 px from the plot's edge, so the box stands at 2 px and the stop is 4 px inside its end, under its rounded corner). The
    box is placed by \	ransform: translateX\ from a fixed \left: 0\, so moving it never lays anything out (no layout shift).
    At rest its left is within 0.001 px of that at every stop. Centred on its stop, the box's number starts at one place
    against the stop's hairline at every stop the plot's sides do not stop (a spread of 0.001 px in AR and EN, live,
    delayed and without history, in both fonts, at 7:42 PM, 10:00 PM, 12:05 AM and closing).
  - **The connector:** a thin vertical line from the box's bottom edge to the top of the mark, ending in a small solid
    pointer (5.4 px wide, 4.2 px tall) whose tip touches the mark's outer edge. It is chalk, never red, and quieter than
    any data line. It runs behind the usual line and today's line and under the ring, so where it crosses the usual line the
    data draws over it. Its style says what the mark is:
    - solid (1 px, 36% chalk) for a reading on today's line: the ring, the peak, the latest reading live and delayed;
    - dashed (2 px dashes, 30% chalk, the gap fitted to the length within 2.5-3.5 px, nominally 3), like the marker's own
      hairline below it, for the hollow chalk ring on the usual line;
    - dotted (1.6 px round dots, 34% chalk, the pitch fitted to the length within 3.5-4.5 px, nominally 4), like the axis's
      dots, for no reading: the missing span's lit dots and the axis tick of a stop still ahead without history. It cannot
      read as a value or bridge the gap.
    - **The pattern is fitted to the length** (lane fix round, run `owner_lane_fix_r04_s04`): a dash, or a dot with its round
      cap, is painted at both ends, at the pointer's base and at the box's bottom edge (straight, or up the rounded corner).
      The count of periods comes from the length and the gap is stretched evenly, each time `paintConnector` runs, so also at
      every frame of a follow. At the missing-span stop the connector's column is the lit dot nearest the stop's centre (at
      most 2 px from it) and the pointer's tip touches that dot's top; at 390 px the span is narrower than 4 px, has no lit
      dot, and the column stays on the stop's centre with the tip where a dot's top would be.
    - **At the peak** it passes behind the peak's tag: the line is cut 3 px above the tag's box and the pointer sits in the
      few pixels between the tag and the ring. The tag stays whole and always shown.
    - Where the stop is near a plot side (the closing stop, 4 px from the box's end) the line starts on the box's rounded
      corner, up to 3 px above the box's bounding rectangle.
    - It sits on the pixel column that holds the marker's x (up to 0.5 px from its centre).
  - **Motion:** the box's top never changes. Its x follows the ring: while the ring follows a route, the box is centred on
    the ring itself, so it moves on the follow's curve with its timing and hover speed. Where the ring moves at once (across
    the missing span, into the future, onto or off the gap stop) the box eases sideways to its new place on the same curve;
    if that place is farther than half the box's width (less 4 px), the box moves with the ring, as it does for Home and
    End, and never trails across the plot. The ring stays under the box, at least 4 px inside its ends, at every frame. The
    text changes at once. A width change while the box eases (the missing-span stop is wider in English) advances the box's
    centre by half of it in the direction it is going, so no edge turns back; otherwise a new width centres the box again at
    once (or pins it at the plot's side). Reduced motion and `?motion=off` show the rest place at once.
  - **New readings, a resize, a language switch and a state change** place the box by the same rules: a reading eases it
    from where it is drawn (the ring is on its stop at once), a resize or a page load places it at rest.
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
- **Tooltip layout (2026-09-26):** one start-aligned arrangement for every tooltip. Every row starts at the same
  inline-start edge (right in Arabic, left in English), and nothing is pushed to the far edge.
  - At the peak and the latest reading (live and delayed), the label chip comes first, then the time. The number then
    comes first and its crowd-level word after it, as at every other stop («62 مزدحم», "62 Busy").
  - The usual comparison and the delayed age stay below, start-aligned, as before.
  - It replaces the two-edge layout of `04984e9`, which the user rejected: nothing lined up, the number was split from
    its word, and the number jumped between ends when the marker crossed the peak or the latest stop.
  - The user approved this layout on 2026-09-26 from a rendered comparison.
  - Values, words, placement, marker B, the follow and the chart's screen-reader text are unchanged.
- **One tooltip width that follows the chart (follow-up round after step 3, 2026-09-27; the user's decisions):**
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
  - **When it is measured:** whenever the stops or their text can change: the first render, a new reading, a state
    change, a resize, a language switch (which reloads the page), and when a web font finishes loading, which replaces
    a measurement made with the fallback font. The width changes only then, at the moment the content changes anyway.
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
  - **No wrap and no clip:** the text never wraps (`white-space: nowrap`). `min-width: max-content` lets any content
    wider than the width grow the box rather than clip it. Every row is one line at every stop, in both fonts.
  - **The lane uses the real width:** `placeTip` measures the box's rendered width (unrounded) whenever its content or width
    changes, including a new reading that rewrites a selected tooltip, and centres the box on its stop with it.
  - The capture's `chart` check measures the tooltip at every stop (see "Open and capture").

**6b. The smooth follow (Round 7 step 2).** It replaces the Round 6 glide (120-150 ms, at most 150 ms). It is the
"follow" part of the motion section in `app.js`.

- **What moves:** the ring and its hairline follow the drawn curve. The tooltip (in its lane since 2026-09-28, sideways
  only) is centred on the ring, so its x follows the same curve; where the ring moves at once, the box eases sideways to
  its place on the same response, starting at its displayed position and velocity, or moves with the ring if that place is
  more than half its width away. The box and the ring meet at the selected stop at rest. See "Tooltip lane" in 6.
  - The route runs along today's line (or the usual line) by arc length. Between the line and the peak ring it runs
    along the line to 6:29 PM, then up the peak's dotted drop onto the ring.
  - The ring's elements are moved in place each frame, not rebuilt. At rest the marker is drawn exactly as without
    motion.
- **The feel, from the reference clip:** two first-order lags in series (an overdamped spring), with time constants of
  90 ms and 15 ms. It is time-based, so any distance takes the same time.
  - From rest it covers 0.19 of a step at 33 ms, 0.43 at 66, 0.60 at 100, 0.73 at 133, 0.87 at 200, 0.94 at 266 and
    0.99 at 400 ms. The clip's figures are 0.19, 0.43, 0.60, 0.72, 0.87, 0.95 and settled. This is the least-squares fit
    to them; the largest difference is 0.012.
  - Positions are exact functions of the time since the last target, so the frame rate never changes the path.
- **No restart:** a new target keeps the current position and velocity; only the target moves. A quick sweep over
  several stops is one continuous movement. Approaching a target, it never overshoots it.
- **Text:** the tooltip's text changes at once when the stop changes, and then the tooltip travels. No glyph fades.
- **Keys:** the arrow keys, PageUp/PageDown and Home/End use the same follow.
- **Reduced motion, `?motion=off` or the Motion switch:** it jumps, as before.
- **Hover speed:** the tuner's «سرعة انتقال العلامة» "Hover speed" divides both time constants (0.5× to 2×; 1× is the
  clip's feel). See "Light tuner".
- **Choices the brief left open, with the reason:**
  - **First appearance: at once.** On the first hover the tooltip and the ring appear at once, as in Round 6, not over
    60-100 ms like the clip.
    - A fade would change glyph opacity, which the page never does.
    - The only other ways to appear gradually are a clip or a scale. At 100 ms or less they read as a flicker, not as
      softness.
    - The follow already gives the hover its smoothness. The tooltip also leaves at once.
  - **Where no drawn track joins two stops, the ring moves at once and the tooltip eases sideways.** This covers crossing the
    missing span, going from the latest reading into the future, and going onto or off the gap stop.
    - The ring is never drawn off the line, and the line is never bridged.
    - The tooltip keeps where it was drawn, with its velocity, and eases sideways into its new place on the same curve
      (the connector stays vertical at the ring's x, under the box); farther than half the box's width, it moves with the ring.
  - **The old 240 px "move at once" limit is replaced by a 6-hour limit, measured along the time axis.**
    - The old limit would now trigger in the middle of fast sweeps on steep parts of the line, where the arc length
      between the ring and the pointer grows.
    - Beyond 6 hours of the day (about 380 px), the ring moves at once, and so does the tooltip, which is then more than
      half its width from its new place and moves with the ring (before the lane it eased across the plot and trailed the
      ring). That is Home or End from far away. Without the limit, the ring would race across the whole day in 400 ms.
    - A sweep of the pointer never reaches this limit, because the ring trails the pointer by far less. PageUp and
      PageDown (2 hours) follow.
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
- **Held frames:** `window.__eclipse.chart.seekFollow(ms)` holds the follow at a time after its latest target, and
  `releaseFollow()` lets it go on. `followActive`, `follow` and `response()` report its state and its curve.

**7. Live update.**
- **Extend, never redraw.** A new reading morphs only the tail of the line that the centred average legitimately
  changes (the last 15-30 minutes), in 280 ms. Everything earlier stays exactly as drawn. The changed digits roll and
  the level bars change at the same moment.
- **With the marker on the tail:** a marker selected on the moving tail, or on the latest reading, rides the line
  during the morph.
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
- **Delayed:** a minute passes with no reading. The line does not move, and only "minutes ago" rolls.

**8. Rail.** It is transform-only and quicker than Round 5, at 240 ms open and 200 ms close instead of 300 and 240 ms.
- The width still switches at once.
- The names no longer fade. A clip on each name keeps 12px inside the moving edge, on the same timing and curve, so
  the edge uncovers them.

**9. Tuner.** See "Light tuner" above: the Motion group now has New reading, Reset readings, the crowd-level buttons,
the Motion switch, (Round 7 step 2) the hover speed and (Round 7 step 3) the intro speed and "Replay intro".

**10. Motion off.** Motion is off with `prefers-reduced-motion: reduce`, with `?motion=off`, or with the tuner's
Motion switch; every change is then instant, and there is no intro. See "Evidence" for the static guard.

**11. The first-open intro (Round 7 step 3).** Round 7, decision 4. It is "the first-open intro" part of the motion
section in `app.js`.

- **When it plays:** only on the first open of the page in a browser tab.
  - A flag in `sessionStorage` (`fitway.eclipse.v3.intro`) marks the tab. It is interface state, never visitor data.
  - So F5, a reload, the language link and any other return in the same tab have no intro.
  - A tab the owner opens plays it: a new tab, a typed address, or a link opened in a new tab. These start with empty
    session storage.
  - Some tabs inherit session storage and so probably do not play it: a tab the page opens with `window.open`, a
    duplicated tab, and a tab Chrome restores after a restart. This is the known limit the user accepted on 2026-09-26;
    there is no workaround.
  - The flag is set on every open, also with motion off, so the intro belongs to the tab's first open only.
  - If session storage is unavailable, there is no intro (fail safe).
  - There is none with reduced motion, `?motion=off` or the tuner's Motion switch off (`?tuner=0` ignores the stored
    switch, as before).
  - A tab opened in the background keeps its intro waiting until the tab is first shown.
- **What is still from the first paint:** every surface (the glass cards and their lights, the wash, the rail), every
  label, unit, time of day and reference value (the usual entries, the average), the level chips, the header's status,
  and the chart's grid, axes, legend and usual Wednesday line.
- **What moves, in order (at 1×):**
  1. **The answers**, 0-400 ms: Inside now, Today's peak, Entries and Busiest time roll into place with the page's own
     digit roll, from below into the digits' ink box, all together. Each value is one slot: «6-8 م» rolls with its own
     «م», which is part of the time, unlike a unit such as «تقريبًا».
  2. **Today's line**, 0-914 ms: it draws once by minutes since open, from opening to the latest reading, with a firm
     start, an even day and a soft landing into now. The fine vertical lines under it are uncovered with it.
  3. **The landing**, 914-1171 ms: the end point swells out of the line's tip (from the tip's own size, 0.34, to 1) with
     its halo; the peak ring swells in the same way, and its dotted drop and label appear with it. The pulse then starts.
- **Truthful at every instant:** it is a reveal of the current reading, not a count-up.
  - Each value enters its final place. No zero or intermediate value is ever drawn, so nothing false can be read.
  - The DOM text is the final value from the first paint; only its position in the clip changes.
- **Geometry:** the line is each drawn part's own path, drawn as a dash as long as the path is to that minute, so its front
  is the line's round-capped tip.
  - It draws in time order, so right to left in Arabic and left to right in English.
  - The missing span stays a gap throughout: the two parts are separate paths and are never joined.
- **States:**
  - **Live:** all of the above.
  - **Delayed:** the three other answers roll and the line draws to 7:29 PM. The stale Inside now number and its age are
    still from the first paint, because a stale card never moves. The grey end point appears at once when the line
    arrives, with no swell and no pulse.
  - **No history:** as live, without the usual line.
  - Each ends exactly at its still frame (see "Evidence").
- **How it yields:** it never blocks, and nothing meets a half-drawn page. It settles at once to the still page on:
  - any pointer press or key anywhere, or the wheel (capture phase, before the action is handled);
  - a hover, tap, key or focus on the chart; the rail; a new reading; a crowd change; a resize; leaving the tab; motion
    switched off.
  - The action then happens as it would have anyway: the hover shows its stop, the rail opens with its own motion, and a
    new reading lands with its roll and tail. A reading during the intro is never lost.
- **Screen readers:** nothing leaves the accessibility tree during the intro. The answers' text is final from the first
  paint. The peak's label («الذروة 62», "Peak 62") waits out of sight by an empty clip until the line arrives, never by
  `visibility` or opacity, so it stays in the tree. The intro announces nothing (the live region stays empty).
  - Checked: the accessibility tree held at 0, 200 and 500 ms equals the still page's, in AR and EN, live, delayed and
    no history (Chromium's full tree over CDP). Before this fix, «الذروة» / "Peak" and «62» were missing for 0-640 ms.
- **Transform, clip and draw only:** no glyph changes opacity, and no element's box changes (the slot holds the final
  value in flow). At the end every element, attribute and style the intro added is removed.
- **Fonts and performance:** it starts only once both weights of Readex Pro are loaded for both scripts, and the tab is
  visible, so no font swaps mid-intro.
  - Until then the answers wait out of sight and the line is not drawn.
  - **The cap is 200 ms from the first paint** (user decision, 2026-09-26). It replaces the designer's 1 s cap, because
    Round 6 said content is never hidden while the fonts load. So the answers wait only on a first open, and the cap is
    200 ms, counted from the first paint entry (or from when app.js runs, if that is earlier). The still page then
    needs one more frame or so to paint. With each font file held 600 ms, the answers were in view 153-231 ms after
    the first paint across the recorded runs, inside the capture's 250 ms gate: 153-211 ms in the intro fix round,
    195-231 ms in its verifier's re-check, 179-203 ms in the follow-up round, 157-220 ms in its verifier's check (the
    committed log of `92398dc` has 174 and 215 ms), and 203-222 ms in repair 1's two runs. So it can land either side
    of 200 ms (see "Measured").
  - **When the fonts are late,** there is no intro. The owner sees the still page at once: the numbers in the fallback
    font until Readex Pro arrives (as on a page without an intro), and the line whole. The tab's flag is already set,
    so a reload in that tab has no intro either.
  - The cap counts from the first paint, or from when app.js runs if that is earlier, so it never runs longer. For a
    tab opened in the background, it counts from when the tab is first shown.
  - When the fonts are in time, nothing changes.
  - Each frame sets a few attributes; the arc lengths come from the page's own path tables.
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
    paint across the recorded runs. With a warm browser cache this is a frame or two; see "Measured".
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

Open `index.html` directly. Fonts load from Google Fonts. To capture, run this from PowerShell at the
worktree root:

```
node design-research/owner-composition-exploration-r04/directions/eclipse/capture.mjs [outDir]
```

It serves the folder on `127.0.0.1:3173` and uses a fresh Playwright chromium context per frame. Frames are at
deviceScaleFactor 1, and 2 for the crops. The still frames use reducedMotion "reduce", and the motion part uses
"no-preference". It writes everything under "Evidence" and `capture-log.json` into `outDir` (default `evidence/`), and
takes about five minutes. It exits with code 1 if any check below fails.

- **The intro (Round 7 step 3):** every fresh context is a new tab, so with motion on its first open plays the intro.
  `open()` waits for the intro to end, so every older check starts from the still page, as before.
  - The intro part serves the Google Fonts files from the capture's own memory after their first network fetch (the same
    bytes), as a browser cache does for a returning owner. Without it, a fresh context's font fetch (390-1010 ms here)
    would miss the intro's 200 ms font cap.
  - The slow-font check holds each font file (fonts.gstatic.com) from that cache for a set time. The Google Fonts
    stylesheet is not held, because it blocks rendering, so holding it would only delay the first paint.
  - `--intro-frames=<dir>` also writes every full-size held 2x intro frame to that folder. They are large and are not
    evidence.
- **Recapture on a difference (the follow-up round after step 3, user-agreed):** Chromium's glyph raster is not always
  byte-identical between runs, so a single exact-hash difference can be noise.
  - Every exact-hash comparison now captures a frame that differs once more, the same way, in a fresh context. It counts
    as a difference only if the next attempt differs too. The comparison stays exact; there is no tolerance.
  - This covers the static guard (reduced motion and `?motion=off`), the intro's end and the reload, the slow-font end,
    the replay's end, the rail and resize yields, the settled open rail, the held 2x intro ends and the level maps.
  - **Both sides (repair 1):** when a comparison's reference was rendered in the same run (the `?motion=off` frames
    compared with this run's still frame, the intro's end and reload where there is no pre-motion frame, the resize
    yields against a fresh 1280×800 page, and the held 2x intro ends against the 2x still), a difference renders the
    reference and the compared frame again, each in a fresh context, and the new pair is compared. Comparisons with a
    committed hash render only the compared frame again. Before, a reference rendered once could itself be the noisy
    side and fail a run with nothing wrong.
  - Frames that change by design are not recaptured. A level map is computed again from its 2x crop, in a fresh
    context, on a difference.
  - The log records every comparison in `motion.recaptures`, with each attempt's expected and actual hash
    (`perAttempt`) and whether its reference was committed or rendered in this run: `noise` lists what differed once
    and then matched, `differedTwice` what failed, and `sameRunReferences` the comparisons with a same-run reference.
    Each frame's entry in `identity` also has its `attempts`.
  - `--plant=always|once` is a negative control: it paints a 1px chalk dot at (720, 450), or the nearest pixel inside
    a smaller frame, into the compared frame of every exact comparison, never into a reference, so a same-run
    reference stays clean and those comparisons are exercised too. `once` plants only the first attempt, so the
    recapture is clean (the noise path). A planted run requires an explicit local-drive `outDir`; it checks that
    folder and `--intro-frames` against the path returned by `os.tmpdir()`, resolving existing links and short names.
    TEMP or TMP can direct that path, so the guard also rejects every output whose real path is inside this repository
    worktree, regardless of their values. UNC, device, and relative paths are refused before any output is written.
    Runs without `--plant` retain their usual output behaviour.

- **Other machines:** the static guard compares with `evidence/pre-motion-hashes.json`, which was rendered on the
  original Windows machine. Fonts render differently elsewhere, so on another machine pass a scratch `outDir`, expect
  that guard (and the checks built on the same hashes: the intro's end state, the reload and the settled rail) to fail,
  and never let such a run rewrite `evidence/`.
- **Fonts:** Readex Pro loads from Google Fonts over verified TLS. In a fresh cloud container, the proxy's CA must first be
  in Chromium's NSS store (`~/.pki/nssdb`).
- **Round 7 step 2:** it was first run only in the cloud container, into a scratch folder. Every check not built on the
  Windows hashes passed, including `chart`, `follow`, `marker`, `roll`, `delayed`, `live` and the tuner. The hash-based
  ones failed as expected. On 2026-09-26 it was run on the original Windows machine into `evidence/` (see "Evidence").

The log records:

- **Still frames:** fonts, overflow, spill, errors, Western digits, en dashes in Arabic, and the line checks, plus the
  1280×800 overflow checks and the light measurements per preset.
- **Calibration:** light-study A, rendered read-only from `file://`.
- **The tuner from `file://`:**
  - keyboard, presets, drag, copy (both paths), persistence, `?tuner=0` and reset;
  - the Motion group: no obsolete controls, New reading, the crowd buttons, the switch persisting in its own key, and
    (Round 7 step 3) the intro speed and "Replay intro", disabled with reduced motion;
  - (in `marker`) the hover speed: its row, its storage with the switch, a reload, and `?tuner=0`;
  - a crowd change with motion on: the number rolls, the bars change, no light moves and no glyph fades.
- **`motion` (Round 6):**
  - **Static guard:** `identity.staticFrames` and `identity.motionOffFrames`. The frames that change by design are
    compared with this run's reduced-motion frame. Since the lane round these are 17 frames, every one that shows the plot
    (each with its reason in `EXPECTED_TO_CHANGE`); each is also compared with 8ae88f3's committed frame outside the plot
    element (`evidence/lane-outside-plot.json`: the frame's pixels with the plot's box zeroed, and, with the rail open, the
    rail's box too, because its glass blurs the plot behind it), and the run fails if one differs (16 of 16 are identical;
    the level map has no such comparison).
  - **First paint (Round 7 step 3, the changed rule):** `identity.firstOpen` and `identity.reload`, in AR and EN, live,
    delayed and no history. A first open plays the intro and ends identical to the still frame (the pre-motion frame, or
    this run's reduced-motion frame for EN delayed and no history), with the DOM equal to the `?motion=off` DOM, only
    the pulse running after it, no long task and no font load during it. A reload in the same tab has no intro (no
    rolling slot or line dash appears at any time), is the still frame, and runs only the pulse on load.
  - **Surfaces at the first frames (intro fix round):** at the first frame after app.js runs (the first paint) and at
    the intro's first frame, every surface (`.card`, `.lamp` and its layers, `.wash` and its light, `.rail`) has its
    rest display, visibility, opacity, transform, clip and filter. Nothing runs but the intro's content transforms (a
    transform on an answer's rolling digits, or the intro's clocks, which have no target and no keyframes) and the
    pulse. It replaces the base's `hiddenCards` probe and is part of each first open's pass.
  - **`intro`** (Round 7 step 3):
    - `slowFonts` (intro fix round; AR and EN, live): with each font file held 600 ms there is no intro
      (`yieldedBy: "fonts late"`), the answers are in view within 250 ms of the first paint, and once the fonts are in
      the DOM equals the `?motion=off` DOM and the page is the still frame. Held 50 ms, the intro plays and completes.
    - `whenItPlays`: a new tab plays it; a reload, the language link in the same tab, reduced motion, `?motion=off` and a
      new tab with the Motion switch off do not; a second tab does; `?tuner=0` ignores the stored switch. "Replay intro"
      plays it at 1×, 0.5× and 2× (measured against 1171, 2342 and 586 ms) and ends at the still frame; the speed is
      stored, kept on a reload and ignored with `?tuner=0`.
    - `yields`: a hover, keys, the rail, a tap, a new reading and a resize, each at 100 and 400 ms into it. It settles at
      once; the hover, tap and keys select their stop with the marker on the line; the rail settles at the still
      rail-open frame; the reading is not lost (7:43 PM, Entries 333, the canonical DOM); the resize equals a fresh
      1280×800 page.
    - `held`: held 2x frames (live 0-760 ms, delayed and no history 0 and 320 ms, AR and EN). At every held frame no box
      moves, the answers' text is final, the live region is silent, the chart's text is final, no glyph animates
      opacity, text moves by transform only, and the line has its two parts. Two ends are judged against the 2x
      reduced-motion frame, and both set the exit code: an intro that plays by itself, and (since the intro fix round)
      the end after the holds. At 2x one glyph («6-8») rasterizes in one of two ways on this machine, with no intro
      too. So if an end differs, one more still and one more of that end are rendered, and the end must equal one of
      the still renderings.
  - **`chart`** (Round 7 step 2: form B, in AR and EN, each live, delayed and without history):
    - every stop, with the half-hour coverage, the gap stop and the two line segments (no bridge);
    - at every stop, the marker's distance to its target, its form, that nothing is drawn above the point, the tooltip,
      and the screen-reader text;
    - pointer snapping (7 probes) and keyboard stepping;
    - that the latest stop shows the latest reading and its screen-reader text never calls it an average;
    - (the follow-up round after step 3; repair 1) the tooltip at every stop: one width on the page except the
      missing-span stop, which may only be wider (and never narrower than its content); that width is the widest
      tooltip that shows a number, plus 2 px, rounded up, and the page reports the same (`measuredByPage`); no row
      wrapped or clipped (`tooltip` per page, and `tooltipWidth` across pages, where it is 127 px on every page at the
      7:42 PM snapshot);
    - (the lane round) the lane's rules at each page's own snapshot (`tooltip.lane` per page, and `tooltipLane` across
      pages): the box's top is the lane's top at every stop (±0.01 px); its left is its stop's x less half its width, kept
      2 px inside the plot (±0.01 px); it lies inside the plot and the card and its lane; its connector meets the box and the
      mark (0.5 px, measured on the painted extent: the first and last dash or dot with its cap against the box's painted
      bottom edge, and the pointer's tip against the ring's outer edge, the nearest lit dot or the tick; and the dash gap
      within 2.5-3.5 px, the dot pitch within 3.5-4.5 px); and nothing else is painted in the lane (the smallest gap from the
      lane's bottom to the top edge of every painted mark, the lines sampled every 1 px and the selected marker's glow is
      not below 0). They replace the side and the number's start against the hairline of the floating placement. The other
      snapshots, the other viewports, the fonts and the motion are swept by the lane round's probes, outside this file.
  - **`marker`** (Round 7 step 2): B's variants sheet; that form A is gone (no Marker group, `?marker=a` ignored, no
    `setMarker`); and the hover speed.
  - **`follow`** (Round 7 step 2, AR and EN): the follow's own curve against the clip's figures (within 0.07); the
    marker held at 33, 66, 100, 200 and 400 ms after a new target stays on the line, the usual line or straight above
    the peak on the drop, with nothing above the point, and it is not a straight hop. Across the gap and into the
    future the marker is on its new stop at once and only the tooltip eases.
  - **`roll`** (AR and EN):
    - every animation of a crowd change down and up and of a new reading, with direction and properties;
    - no glyph opacity, the digits that moved, and the bars;
    - the live region's text, and the rest markup afterwards.
  - **`live`:** the tail morph. **`delayed`:** no pulse, nothing running, and only "minutes ago" rolls.
  - **`rail`:** the animated properties, the names by clip only, and the settled open rail against the still frame.

## Evidence

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
  - `intro-contact-sheet`: live, AR and EN side by side, 1440×900 at 2x, held at 0, 60, 120, 200, 350, 500 and 700 ms
    and at the settled end.
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
