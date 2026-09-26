# Eclipse v3 (Owner r04, full Daily page)

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
    intro's length, for example "1.00× · 820 ms". It is kept in the same key and ignored with `?tuner=0`. A new speed
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
| Intro: the answers | a tab's first open only (Round 7 step 3) | transform: each answer's value enters its final place from below, inside the digits' ink box (the digit roll) | 280 ms, from the start | `cubic-bezier(0.25, 1, 0.5, 1)` |
| Intro: the line | the same | `stroke-dasharray` of today's line parts, by minutes since open; one clip uncovers the fine lines under it | 640 ms, from the start | `cubic-bezier(0.3, 0.2, 0.4, 1)` |
| Intro: the end point and the peak | the same, when the line arrives | SVG transform: the live end point and its halo, and the peak ring, scale from 0.34 to 1; the peak's drop and label appear at once | 180 ms, from 640 ms | `cubic-bezier(0.25, 1, 0.5, 1)` |

The intro's durations are at 1×; the tuner's intro speed divides them. Nothing else animates: the lights, the wash, the
hover colours of the rail tiles and buttons, the details chevron, and the jump to "View details" are all instant.

**1. Load: the first-open intro only (the changed first-paint rule).**
- Round 6 had no load motion. Round 7 (decision 4) amends that with the first-open intro (11 below), and only that:
  there is still no stagger, rise, light entrance or wash drift, and the surfaces are complete at first paint.
- Without an intro (a reload, a return in the same tab, reduced motion, `?motion=off`, the Motion switch off) the page is
  complete at first paint, as before, and nothing is hidden while the fonts load.
- With an intro, the four answers wait out of sight and today's line is not drawn until the fonts are in (at most
  200 ms from the first paint; 11 below). Everything else is complete at first paint.
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
  - Nothing above the point: no guide line, no level ticks.
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
- **Tooltip placement:** after now the tooltip sits on the later side of the hairline, so it never covers the end of
  today's line, unless it would not fit there: the last stops of the day (11:30 PM to 1:00 AM) flip to the earlier
  side. Over the gap it sits above both ends of the line.
- **Tooltip layout (2026-09-26):** one start-aligned arrangement for every tooltip. Every row starts at the same
  inline-start edge (right in Arabic, left in English), and nothing is pushed to the far edge.
  - At the peak and the latest reading (live and delayed), the label chip comes first, then the time. The number then
    comes first and its crowd-level word after it, as at every other stop («62 مزدحم», "62 Busy").
  - The usual comparison and the delayed age stay below, start-aligned, as before.
  - It replaces the two-edge layout of `04984e9`, which the user rejected: nothing lined up, the number was split from
    its word, and the number jumped between ends when the marker crossed the peak or the latest stop.
  - The user approved this layout on 2026-09-26 from a rendered comparison.
  - Values, words, placement, marker B, the follow and the chart's screen-reader text are unchanged.

**6b. The smooth follow (Round 7 step 2).** It replaces the Round 6 glide (120-150 ms, at most 150 ms). It is the
"follow" part of the motion section in `app.js`.

- **What moves:** the ring, its hairline and the tooltip chase their target along the drawn curve itself, x and y
  together. They never take a straight hop between two points on the line.
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
  - **Where no drawn track joins two stops, the ring moves at once and the tooltip eases.** This covers crossing the
    missing span, going from the latest reading into the future, and going onto or off the gap stop.
    - The ring is never drawn off the line, and the line is never bridged.
    - The tooltip keeps where it was drawn, with its velocity, and eases into its new place on the same curve.
    - The same easing takes the tooltip across when it changes side: after now it moves to the later side, and it flips
      near the chart's edges.
  - **The old 240 px "move at once" limit is replaced by a 6-hour limit, measured along the time axis.**
    - The old limit would now trigger in the middle of fast sweeps on steep parts of the line, where the arc length
      between the ring and the pointer grows.
    - Beyond 6 hours of the day (about 380 px), the ring and the tooltip both move at once, as on a first appearance.
      That is Home or End from far away. Without the limit, the ring would race across the whole day in 400 ms.
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
  1. **The answers**, 0-280 ms: Inside now, Today's peak, Entries and Busiest time roll into place with the page's own
     digit roll, from below into the digits' ink box, all together. Each value is one slot: «6-8 م» rolls with its own
     «م», which is part of the time, unlike a unit such as «تقريبًا».
  2. **Today's line**, 0-640 ms: it draws once by minutes since open, from opening to the latest reading, with a firm
     start, an even day and a soft landing into now. The fine vertical lines under it are uncovered with it.
  3. **The landing**, 640-820 ms: the end point swells out of the line's tip (from the tip's own size, 0.34, to 1) with
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
    Round 6 said content is never hidden while the fonts load. The answers are therefore hidden for at most 200 ms, and
    only on a first open.
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
  - **The numbers and the line start together.** The numbers settle by 280 ms, well before the line (640 ms), so they
    are read first without a delay that would lengthen the whole.
  - **Grid, axes and the usual line are still.** They are the instrument's frame and the reference that today's line is
    drawn against, not today's data.
  - **The landing:** the live end point grows out of the pen's tip, so the drawing ends on it. The peak ring uses the same
    swell, and its label appears at once, because text never fades.
  - **Delayed:** the stale number stays still and the grey end point simply appears, so nothing stale gains an arrival.
  - **Yielding:** settle at once rather than hurry, so a hover or a new reading always meets the real page.
  - **Waiting for the fonts:** the answers are hidden (by the slot's clip, never opacity) for as long as the fonts take,
    at most 200 ms. With a warm browser cache this is a frame or two; see "Measured".
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
    compared with this run's reduced-motion frame.
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
      plays it at 1×, 0.5× and 2× (measured against 820, 1640 and 410 ms) and ends at the still frame; the speed is
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
    - that the latest stop shows the latest reading and its screen-reader text never calls it an average.
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
  - `intro-states-2x`: delayed and no history, AR and EN, 2x, at the start, the middle (320 ms) and the end.
  - `intro-detail-ar-2x`: 2x details in AR: the four answers at 0, 60, 120, 200 and 280 ms, and the line landing at 600,
    640, 660, 700 and 760 ms and at the end.
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
  - The pre-intro wait hides the answers (a clip) while the fonts load: a frame or two with a warm cache, at most
    200 ms otherwise, on a first open only (the user's decision on Round 6 §1, 2026-09-26).
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
- **Scope:** no English still frames for delayed, no history or details (the intro's sheets have English delayed and no
  history). Mobile is out of scope.
- **Repository:** no repository verification. `pnpm check:design-context` passed at the start of Round 7 (step 1) and
  of step 3, and in the intro fix round; it was not run for step 2.
- **Intro fix round:** the accessibility-tree comparison, the slow-font frames at 100-400 ms and the planted defects
  were run as scratch checks outside the repository. The accessibility tree is not a capture gate. No verifier has
  checked this round yet.
