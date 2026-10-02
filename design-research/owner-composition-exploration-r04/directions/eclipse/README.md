# Eclipse (Owner r04)

Concept only, built on synthetic data. Nothing is selected.
`index.html` is Daily; `reports.html` is Reports; `components.html` renders the component rules.
Arabic RTL is the default; English LTR is available with `?lang=en`.
`DESIGN-SPEC.md` holds the rules; this contract describes the current build.
`HISTORY.md` holds the rounds, evidence and superseded wording behind it.

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
- **Measurements:** the tables below record the first Recommended values; see `HISTORY.md`, "Light model (v3)", for those defaults.

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
  - **Disc:** an ellipse 0.7 as tall as it is wide, in pixels (`--now-disc-aspect`). Its radius is 77% of
    the card width, and its centre is 67% of the width from the lit side. Its lowest point sits 8% of the
    card height above the bottom edge, which is the continuous rim.
  - **Edge:** the feather is 34px along the card (23.8px across) and eased (0, .16, .5, .84, 1), centred on
    the nominal edge. It reads as one clean arc.

  - **Ring ends:** up the lit side, a fade mask anchored where the disc meets the side (computed in CSS
    with `sqrt()`/`pow()`) takes the ring to transparent over 19% of the card height. Toward the far end,
    the band dims on its own before the far-corner glow, which fades up the far side.

- **Chart card: a U around a dark disc.**
  - The disc is 54cqw wide (just past both sides). Its lowest point is `--chart-fade` (11.5%) above the
    bottom, its edge meets the sides at `--chart-side` (48.5%), and its feather is 260px.

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
    - The defaults are strength 0.05 and size 110%.
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
  - «إعادة المقدمة» "Replay intro" plays the current reading again only when the page is ready and has a reading.
    It is disabled with reduced motion, `?motion=off` or the Motion switch off. In loading, error, closed or
    unavailable states it does nothing, even if the button remains enabled.

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

## Line, cards and states

- **The line:** a centred 30-minute average (15 minutes before and after, triangular weights). The window
  is cut at opening, at the missing span and at the latest reading, and the zero span stays 0. The crest is
  at 6:31 PM, 2 minutes after the 6:29 PM peak. The true-peak ring «الذروة 62» sits above it.
- **Usual Wednesday:** dashed, and fainter after now.
- **Comparison chip:** it shows only for a clear difference, so today (about usual) shows nothing.
- **Entries:** «مرات الدخول», with «المعتاد 318» below it.
- **States:** `?state=live|delayed|nohistory|loading|closed|unavailable|error`, `?lang=ar|en`.
  Delayed has an amber header status, an Inside now card titled "Last reading", a muted value and stale-grey
  level bars, and a grey end point without a halo or pulse. Both card lights are out.
  Loading holds the value slots, then a static skeleton from 300 ms for at least 400 ms; a load reaching 10 s
  becomes Error. Closed, unavailable and error have no current count, level or card light.
  See `DESIGN-SPEC.md`, "2.4 State grammar", for each state's content and arrival.

- **Hover:** Round 6 changed the chart's hover. It snaps to stops and shows the line's own value; see "Motion".

## Motion

**Principle:** motion carries information, and decoration never moves. The page is an instrument: its frame
is complete at first paint, and something moves only when the data really changes or the owner acts. The first-open
intro (11 below) reveals the readings inside the still surfaces once per tab, on their first eligible arrival.

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
| Intro: the answers | a tab's first eligible Daily reading reveal (rule 11) | transform: each answer's value enters its final place from below, inside the digits' ink box (the digit roll) | 400 ms, from the start | `cubic-bezier(0.25, 1, 0.5, 1)` |
| Intro: the line | the same | `stroke-dasharray` of today's line parts, by minutes since open; one clip uncovers the fine lines under it | 914 ms, from the start | `cubic-bezier(0.3, 0.2, 0.4, 1)` |
| Intro: the end point and the peak | the same, when the line arrives | SVG transform: the live end point and its halo, and the peak ring, scale from 0.34 to 1; the peak's drop and label appear at once | 257 ms, from 914 ms | `cubic-bezier(0.25, 1, 0.5, 1)` |

The intro's durations are at 1×; the tuner's intro speed divides them. Nothing else animates: the lights, the wash, the
hover colours of the rail tiles and buttons, the details chevron, and the jump to "View details" are all instant.

**1. Load: the first-open intro only (the changed first-paint rule).**

- Without an intro (reduced motion, `?motion=off`, the Motion switch off, or a return after the tab's intro flag)
  values arrive at once. The frame is complete at first paint; loading holds its slots. No font-loading hide is
  added; Chromium can hold paint for pending early-loaded fonts.

- The first inline script sets language, direction and state; the second starts both weights of the CSS font faces. app.js
  decides the intro through ordered render-blocking scripts; the local Arabic and Latin files cover both weights.
- The chart renders at once. It is measured again when the fonts arrive, because the header's text sets its height,
  and again whenever its box changes.
- **The rule the capture checks now:** on a first open the intro plays and ends identical to the still frame (the live
  pulse hidden), with the DOM equal to the `?motion=off` DOM and only the pulse running after it (nothing while delayed);
  a reload in the same tab has no intro at all and is the still frame at once, with only the pulse on load.

**2. Lights are static, always.**

- The tuned light values in `:root` apply when light is shown. Stale, loading, closed, unavailable and error cards are plain.

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
- **Missing span (2:14-2:31 PM):** one stop, "No readings" («لا قراءات»), then "from 2:14 PM to 2:31 PM"
  («من 2:14 م إلى 2:31 م»), one sentence on two lines in the same type and colour. There is no normal stop
  inside it, and the line is never bridged.

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
  - The screen-reader text names the average, for example «6:00 م، معدّل الموجودين 46، الازدحام متوسط، المعتاد 46».
    The latest stop is the exception: it is the reading, never called an average.

**6. The marker: form B, the hollow ring (Round 7 step 2).**

- **Common to every stop:**
  - Nothing above the point: no guide line, no level ticks. The one exception (the lane round) is the tooltip's
    connector, which is drawn behind the ring, in `#conn` and not in `#sel` (see "Tooltip lane").
  - Below the point, that moment's own thin red hairline runs down to the time axis. It starts 10px below the point.
  - The marker sits on what its tooltip describes (measurements: `HISTORY.md`, "Motion", rule 5).
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
- **Tooltip lane:** the box lives in a fixed band at the top of the plot.
  - **The lane:** its top is 2 px below the plot's top (`LANE.top`). Its height is measured with the width
    on hidden copies, including a probe of the tallest tooltip any state can show: the delayed latest reading,
    with its age and the usual row. Rounded up, it is **107 px in every state** at Daily's type, so the scale
    stays in one place. `window.__eclipse.chart.lane` reports the numbers.
  - **Reserved:** nothing but the tooltip is drawn in it: not the data, markers, hairlines, peak tag,
    end point, pulse, grid or labels. The highest scale label starts `LANE.gap` = 8 px below the lane;
    the scale's top line is at 126 px from the plot's top.

  - **Sideways:** the box's left is its stop's x less half its width, kept 2 px inside the plot's sides (the closing stop is
    6 px from the plot's edge, so the box stands at 2 px and the stop is 4 px inside its end, under its rounded corner). The
    box is placed by \	ransform: translateX\ from a fixed \left: 0\, so moving it never lays anything out (no layout shift).

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

- **Tooltip layout (2026-09-26):** one start-aligned arrangement for every tooltip. Every row starts at the same
  inline-start edge (right in Arabic, left in English), and nothing is pushed to the far edge.
  - At the peak and the latest reading (live and delayed), the label chip comes first, then the time. The number then
    comes first and its crowd-level word after it, as at every other stop («62 مزدحم», "62 Busy").
  - The usual comparison and the delayed age stay below, start-aligned, as before.

- **One tooltip width that follows the chart (follow-up round after step 3, 2026-09-27; the user's decisions):**

  - **Width formula:** `app.js` measures the widest numbered tooltip among the chart's current stops, adds 2 px,
    rounds up and sets `--tip-w`. A numbered tooltip has a value or a usual row; the missing span and, without
    history, still-ahead and no-reading-yet stops are excluded. Within one snapshot these tooltips have one width,
    and their start-aligned rows keep one distance from the stop's hairline wherever the plot's sides allow centring.

  - **When it is measured:** whenever the stops or their text can change: the first render, a new reading, a state
    change, a resize, a language switch (which reloads the page), and when a web font finishes loading, which replaces
    a measurement made with the fallback font. The width changes only then, at the moment the content changes anyway.

  - **At the page's own 7:42 PM snapshot:** 131 px in Arabic live and no history; 130 px in Arabic delayed
    and English. The formula above sets the width; these snapshot widths are not fixed defaults.

  - **The missing-span stop may grow:** it has no numbered value or usual row, so it may be wider for its
    sentence: 159.9 px in Arabic and 197.1 px in English at Daily's type, 62.5 px tall (CHT-12).

  - **No wrap and no clip:** the text never wraps (`white-space: nowrap`). `min-width: max-content` lets any content
    wider than the width grow the box rather than clip it. Every row is one line at every stop, in both fonts.
  - **The lane uses the real width:** `placeTip` measures the box's rendered width (unrounded) whenever its content or width
    changes, including a new reading that rewrites a selected tooltip, and centres the box on its stop with it.
  - The capture's `chart` check measures the tooltip at every stop (see "Open and capture").

**6b. The smooth follow.**

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

- **Track changes and long jumps:**
  - **Where no drawn track joins two stops, the ring moves at once and the tooltip eases sideways.** This covers crossing the
    missing span, going from the latest reading into the future, and going onto or off the gap stop.
    - The ring is never drawn off the line, and the line is never bridged.
    - The tooltip keeps where it was drawn, with its velocity, and eases sideways into its new place on the same curve
      (the connector stays vertical at the ring's x, under the box); farther than half the box's width, it moves with the ring.
  - **Long jumps:** beyond 6 hours along the time axis the ring moves at once. The tooltip moves with it
    when its new place is more than half its width away; smaller sideways jumps ease on the follow curve.

    - A sweep of the pointer never reaches this limit, because the ring trails the pointer by far less. PageUp and
      PageDown (2 hours) follow.

- **Held frames:** `window.__eclipse.chart.seekFollow(ms)` holds the follow at a time after its latest target, and
  `releaseFollow()` lets it go on. `followActive`, `follow` and `response()` report its state and its curve.

**7. Live update.**
- **Extend, never redraw.** A new reading morphs only the tail of the line that the centred average legitimately
  changes (the last 15-30 minutes), in 280 ms. Everything earlier stays exactly as drawn. The changed digits roll and
  the level bars change at the same moment.
- **With the marker on the tail:** a marker selected on the moving tail, or on the latest reading, rides the line
  during the morph.

- **The pulse:** a 1px ring every 5 s, at 40% at most, reaching 28px. There is no pulse while delayed.

- **Delayed:** a minute passes with no reading. The line does not move, and only "minutes ago" rolls.

**8. Rail.** It uses transforms and clips, with surface and shadow opacity, at 240 ms open and 200 ms close.
- The width still switches at once.
- The names no longer fade. A clip on each name keeps 12px inside the moving edge, on the same timing and curve, so
  the edge uncovers them.

**9. Tuner.** See "Light tuner" above: the Motion group now has New reading, Reset readings, the crowd-level buttons,
the Motion switch, (Round 7 step 2) the hover speed and (Round 7 step 3) the intro speed and "Replay intro".

**10. Motion off.** Motion is off with `prefers-reduced-motion: reduce`, with `?motion=off`, or with the tuner's
Motion switch; every change is then instant, and there is no intro. See `HISTORY.md`, "Evidence", for the static guard.

**11. The first-open intro (Round 7 step 3).** Round 7, decision 4. It is "the first-open intro" part of the motion
section in `app.js`.

- **When it plays:** once per browser tab at the first eligible Daily reading reveal.
  - A flag in `sessionStorage` (`fitway.eclipse.v3.intro`) marks that reveal. It is interface state, never visitor data.
  - On a ready live, delayed or no-history open, the flag is set even with motion off. Later reloads and language
    links in that tab have no intro. A fresh tab with empty storage is eligible.
  - Loading waits for the payload; the intro never plays over the skeleton. A failed first payload leaves the first
    successful retry eligible. Closed and unavailable opens do not consume the flag.
  - A tab opened by `window.open`, duplicated, or restored by Chrome may inherit storage and skip the intro;
    this remains the accepted session-storage limit.

  - If session storage is unavailable, there is no intro (fail safe).
  - There is none with reduced motion, `?motion=off` or the tuner's Motion switch off (`?tuner=0` ignores the stored
    switch, as before).
  - A tab opened in the background keeps its intro waiting until the tab is first shown.
- **What is still:** every surface (the glass cards and their lights when shown, the wash, the rail), labels,
  units, times, reference values, level chips and the chart's frame. When readings are already available they are
  complete at first paint; during loading the frame holds its slots, and the lights and usual line appear at arrival.

- **What moves, in order (at 1×):**
  1. **The answers**, 0-400 ms: Inside now, Today's peak, Entries and Busiest time roll into place with the page's own
     digit roll, from below into the digits' ink box, all together. Each value is one slot: «6-7 م» rolls with its own
     «م», which is part of the time, unlike a unit such as «تقريبًا».

  2. **Today's line**, 0-914 ms: it draws once by minutes since open, from opening to the latest reading, with a firm
     start, an even day and a soft landing into now. The fine vertical lines under it are uncovered with it.
  3. **The landing**, 914-1171 ms: the end point swells out of the line's tip (from the tip's own size, 0.34, to 1) with
     its halo; the peak ring swells in the same way, and its dotted drop and label appear with it. The pulse then starts.
- **Truthful at every instant:** it is a reveal of the current reading, not a count-up.
  - Each value enters its final place. No zero or intermediate value is ever drawn, so nothing false can be read.
  - The DOM text is final before the intro starts; a loading arrival fills it first. Only its position in the clip changes.
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
  - Each ends exactly at its still frame (see `HISTORY.md`, "Evidence").
- **How it yields:** it never blocks, and nothing meets a half-drawn page. It settles at once to the still page on:
  - any pointer press or key anywhere, or the wheel (capture phase, before the action is handled);
  - a hover, tap, key or focus on the chart; the rail; a new reading; a crowd change; a resize; leaving the tab; motion
    switched off.
  - The action then happens as it would have anyway: the hover shows its stop, the rail opens with its own motion, and a
    new reading lands with its roll and tail. A reading during the intro is never lost.
- **Screen readers:** nothing leaves the accessibility tree during the intro. The answers' text is final before
  the intro starts. The peak's label («الذروة 62», "Peak 62") waits out of sight by an empty clip until the line
  arrives, never by `visibility` or opacity. The intro itself adds no announcement; payload arrival announces the figures once.

- **Transform, clip and draw only:** no glyph changes opacity, and no element's box changes (the slot holds the final
  value in flow). At the end every element, attribute and style the intro added is removed.
- **Fonts and performance:** the readings must have arrived, both weights of Readex Pro must be loaded for both
  scripts, and the tab must be visible. It starts after first paint and a frame for final geometry, so no font swaps mid-intro.

  - Both weights share each subset's local variable font file. All four Google subsets retain their unchanged
    face rules and font bytes. After the blocking stylesheets, an inline script loads the Arabic and Latin CSS
    faces at both weights (Arabic digits need Latin); subsequent text and app loads reuse those faces. There is
    no separate preload fetch, including from file pages, and no Google request. Missing faces keep the fallback.

  - A later font arrival within the cap may swap visible fallback text to Readex Pro; the user accepts this
    (2026-09-29), provided the swap paints before the intro starts. The app adds no suppression to avoid the swap;
    Chromium may hold the first paint, and the existing intro clips still apply to its answers.
  - Until then the answers wait out of sight and the line is not drawn.
  - **On an initially ready page the font cap is 200 ms from first paint**, after render-blocking scripts
    complete. When it expires the still page needs a frame to paint; this is a font-wait budget, not a guarantee
    of a painted answer by 200 ms. Measurements are in `HISTORY.md`, "Motion", 11.
  - **On loading or retry arrival**, fonts are checked immediately: if they are not ready there is no intro;
    if ready, the final geometry paints before it starts. There is no additional 200 ms wait at that arrival.

  - **When fonts miss the ready-page cap**, there is no intro. The owner sees the whole line and final
    numbers in the fallback font until Readex Pro arrives. The tab's flag is set, so a reload in that tab has no intro.

  - The cap counts from first paint, so script loading does not consume its budget. A tab opened in the background
    waits until it is first shown.
  - When the fonts arrive in time, their final geometry paints before the intro; there is no header-fill page drop.
  - Each frame sets a few attributes; the arc lengths come from the page's own path tables.
- **Tuner:** intro speed (0.5× to 2×) divides every duration; "Replay intro" replays a ready page with a reading.
  See "Light tuner" for the motion gates and no-op states.

## Open and capture

Open `index.html` directly or through an HTTP preview. Fonts load from `fonts/` in either case; the inline script starts
the CSS faces for both first-screen subsets, and text shares those fetches on HTTP and file pages. To capture, run this
from PowerShell at the worktree root:

```
node design-research/owner-composition-exploration-r04/directions/eclipse/capture.mjs [outDir]
```

It serves the folder on `127.0.0.1:3173` and uses a fresh Playwright chromium context per frame. Frames are at
deviceScaleFactor 1, and 2 for the crops. The still frames use reducedMotion "reduce", and the motion part uses
"no-preference". It writes the frames described in `HISTORY.md`, "Evidence", and `capture-log.json` into `outDir`
(default `evidence/`), and takes about five minutes. It exits with code 1 if any check below fails.

- **The intro (Round 7 step 3):** every fresh context is a new tab, so with motion on its first open plays the intro.
  `open()` waits for the intro to end, so every older check starts from the still page, as before.
  - Every context reads the local font files from this page's origin. No Google URL cache or warm-up is needed.
    Each main-document navigation resets a per-file counter; a second font request fails the run, even in a
    secondary tab. All console message types and page errors are recorded. A repeated-fetch control recorded
    one duplicate per navigation and two over a reload; the ordinary capture requires no duplicates.
  - Capture uses no-store HTTP, still reduced motion and full-motion intro checks, AR/EN at 1440x900, and
    live 1280x800 overflow checks. Its file checks cover the tuner and motion. The four-size, three-state,
    header, reload and file font matrices are separate probes; capture does not check that complete matrix.
  - The slow-font check holds each local woff2 response for 50 or 600 ms; the local stylesheet is not held.
    Its log requires both first-screen font URLs, no external request, and at least two
    actual holds of the requested duration, so the font-wait gates cannot pass on an unused route.
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
- **Fonts:** the four Readex Pro woff2 subsets and their OFL licence sit beside `fonts/readex-pro.css`. The
  stylesheet keeps Google's exact weights, display and ranges, replacing only source URLs; no font request leaves
  the page's origin. Both HTTP and file pages start the CSS faces without a separate preload fetch.

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
    - `held`: held 2x frames (live 0-1086 ms, delayed and no history 0 and 457 ms, AR and EN). At every held frame no box
      moves, the answers' text is final, the live region is silent, the chart's text is final, no glyph animates
      opacity, text moves by transform only, and the line has its two parts. Two ends are judged against the 2x
      reduced-motion frame, and both set the exit code: an intro that plays by itself, and (since the intro fix round)

  - **`chart`** (Round 7 step 2: form B, in AR and EN, each live, delayed and without history):
    - every stop, with the half-hour coverage, the gap stop and the two line segments (no bridge);
    - at every stop, the marker's distance to its target, its form, that nothing is drawn above the point, the tooltip,
      and the screen-reader text;
    - pointer snapping (7 probes) and keyboard stepping;
    - that the latest stop shows the latest reading and its screen-reader text never calls it an average;
    - the tooltip at every stop: one width on the page except the
      missing-span stop, which may only be wider (and never narrower than its content); that width is the widest
      tooltip that shows a number, plus 2 px, rounded up, and the page reports the same (`measuredByPage`); no row
      wrapped or clipped (`tooltip` per page, and `tooltipWidth` across pages, where widths are 131 px in Arabic
      live and no history and 130 px in Arabic delayed and English at the 7:42 PM snapshot);

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

## Reports

### What it answers

Daily asks "how is today going right now?"; Reports asks "how does my gym usually behave, and which way is it going?".
The page keeps the Daily page's frame and material:
- **Header:** the title and the period's dates; a custom period adds its length, and incomplete coverage is
  named. The controls row below holds the period control (Last 7 days, Last 28 days, Custom…) at its start
  and "Export minute data" at its far end.
- **At a glance:** one plain card holds Average inside, Highest peak with its day and time, and Entries with
  the daily average; a separate plain "Last 7 days" card compares the last seven complete days with the seven
  before, whatever the chosen period. Entries are named entries only, with no caption.

- **Busy times** (lit with the chart light while it has readings): from 1280 px, the weekday × hour pattern,
  average inside, 7 days × 19 hours (6 AM to the 12 AM hour), on the red light ramp, with a "Numbers" switch.
  Below 1280 px it shows one day at a time: seven weekday radio buttons, one bar per day's busiest hour, then
  the selected day's hours on one scale for the week, each printing its value, with no bar edge. It opens on
  the busiest weekday. Hours are columns from 721 px and labelled horizontal bars on a phone.
- **Day by day:** from 721 px, a sortable table of each day's peak and time, average and entries, with gaps
  in words and the highest-peak row tinted, with no "Highest" flag. Below 721 px it is a two-line list, seven
  days then "Show all days", with a native sort select and no dated week heads. "Export table" saves these rows.
- Details stay on request: the pattern's readout (hover, keyboard or tap), the grid's numbers switch, and
  the day table or list below the first screen.

### The data (synthetic, deterministic)

- **The same gym as the Daily page:** capacity 80 (owner-private; only in the CSV's `capacity_snapshot`), the same crowd
  levels, Riyadh time (UTC+3), business-day boundary 4:00 AM. Hours are 6:00 AM to 1:00 AM, and **Friday 2:00 PM to
  1:00 AM** (a choice for this concept).
- **Business days** run from Sunday 2 August to Tuesday 22 September 2026, the last complete day before the Daily page's
  Wednesday 23 September. Reports shows complete days only, so nothing on it is live.
- **The simulation** is the Daily page's own minute process (Poisson entries, Binomial(occupancy, 1/64) exits), with
  a shape per weekday. The four Wednesdays the Daily page averages as "usual" (26 August and 2, 9, 16 September) use
  the Daily page's seeds and shapes, so they are the same days here.
- **Closed:** outside the hours (Friday before 2 PM; 1 to 6 AM is outside every day's hours and has no column).
- **Genuine zero:** every day's first ten minutes are empty, as on the Daily page, and on Saturday nobody comes
  before 7:00 AM, so the Saturday 6-7 AM hour averages exactly 0.
- **Missing:** a camera gap on Thursday 17 September, 10:00 AM to 1:59 PM, and a short one on Monday 31 August,
  10:12 to 10:40 AM.
- **Week over week** (the reporting domain's rule): the last seven complete days (16-22 Sep) against the seven before
  (9-15 Sep), compared only when both have readings for at least 80% of their open minutes. Full history gives
  +9% average inside ("Busier"; the chip needs at least 5%) and +3% entries.

### States and how to open it

Open `reports.html` directly, or from any static server (with `Cache-Control: no-store` or no cache header). From the
Daily page, the rail's Reports item. Query parameters:

| URL | Shows |
| --- | --- |
| `reports.html` (`?state=full`) | Last 28 days, 26 Aug - 22 Sep: comparable week over week; the pattern's closed Friday mornings and zero Saturday 6 AM |
| `?state=short` | Readings since Sunday 13 Sep (the Daily page's no-history state has one past Wednesday, 16 Sep): week over week shows "Not enough history yet" and no value; the pattern distinguishes closed, no readings and zero; days before 13 Sep form one "No readings yet" row or list sentence |
| `?range=7d` | Last 7 days, 16 - 22 Sep: Thursday 10 AM - 2 PM reads as no data |
| `?from=YYYY-MM-DD&to=YYYY-MM-DD` | A custom period (up to 366 days, ending by 22 Sep), for example `from=2026-09-01&to=2026-09-10` |
| `?from=2026-07-01&to=2026-07-31` | A period before the readings began: the period's figures say "No readings"; "Last 7 days" keeps its own span and comparison; below 1280 px the busy-times card says the empty sentence once with the way back and day by day steps aside; from 1280 px the pattern and the day table are plain |
| `?dialog=range` / `?dialog=export` | Opens the date-range or the export dialog at load |
| `?export=fail` | The first export attempt fails (then "Try again" succeeds) |
| `?lang=ar|en`, `?motion=off` | As on the Daily page |

The period is kept in the URL, so a reload and the language link keep it. The Daily page's Reports link and Reports'
Daily link carry `lang` (and `motion=off`).

### The table, form and dialog system

Every part is built here, in `reports.css` and `reports.js`, for Activity Log, Access and Settings to reuse.
Controls are 44 px tall (the design guide's minimum), focus is a 2 px chalk ring, and hover colours change at once, as
on the Daily page.

| Part | Built as | States |
| --- | --- | --- |
| **Data table** (`.table`) | a real `<table>` with a caption, `th scope`, and explicit ARIA roles; sticky header row; numeric columns and their headers share the physical right edge in both languages, with tabular figures | default; hover (the row lifts); focus (the sortable header); selected (`aria-sort`, announced); empty (a sentence and the way back); gaps in words; highest-peak row tinted with no flag; days before the readings began merged into one row; a firmer line closes each week; Reports uses a list below 721 px |
| **Sortable header** (`.sort`) | the whole header is a button; the arrow shows on the sorted column and on hover or focus, except on a phone where only the sorted column shows its arrow | default, hover, focus, selected (ascending or descending) |
| **Segmented control** (`.seg`) | a group of toggle buttons (`aria-pressed`), one Tab stop each; the last one opens a dialog | default, hover, focus, selected (lifted in chalk) |
| **Switch** (`.switch`) | `role="switch"`, `aria-checked`; the thumb slides 200 ms on the roll easing | off, hover, focus, on |
| **Buttons** (`.rbtn`, `.rbtn-primary`, `.icon-btn`) | secondary (outline) and primary (chalk). Red stays the brand's and the data's; a destructive action (Access, later) gets its own treatment | default, hover, focus, disabled (working) |
| **Date field** (`.field`) | a labelled text field (day/month/year, Western digits; Arabic-Indic digits typed on an Arabic keyboard are read as Western), a shared hint, and its own error, tied with `aria-describedby` and `aria-invalid`; a valid date is tidied on leaving the field | default, hover, focus, invalid with its message (no date, wrong form, a date that does not exist, after the last full day, the end before the start, more than 366 days), disabled |
| **Dialog** (`.dlg`) | `<dialog>` with `showModal` (the page behind is inert), a scrim and a glass panel; a bottom sheet at 720 px and below | focus goes in (the first field, or the primary action when the dates are already set), Tab and Shift+Tab wrap inside, Escape and the scrim close it (Escape also stops a running export), focus returns to the control that opened it |
| **Export** (in the dialog) | a real CSV built in the page from the synthetic minutes and saved with a download link; nothing leaves the page | ready; invalid; working (the button says "Preparing…" at once, the fields and the button are disabled, focus moves to Cancel, `aria-busy`; the progress line appears only after 300 ms and a shown working state lasts at least 400 ms); done (focus on "Save file", announced); failed (`role="alert"`, focus on "Try again", the dates kept) |
| **Readout** (`.heat-tip`) | the Daily page's tooltip box; appears, changes and leaves at once | hover, keyboard focus (the grid's one Tab stop, arrow keys, Home and End, Escape) and a tap show the same readout |

**The CSV** follows the reporting domain's shape (`packages/api/src/analytics/reporting/contracts.ts`): a UTF-8 byte
order mark, CRLF lines, the header `business_day,minute_start_utc,minute_start_local,time_zone,state,count,entries,exits,band,capacity_snapshot,settings_version,source`,
and 1440 rows per business day from the 4:00 AM boundary, each with UTC and gym-time columns. Closed and missing minutes
keep their state and leave the value columns empty. Western digits only. The file is named
`fitway-minutes-<from>-to-<to>.csv`.

**Accessible equivalent of the pattern:** from 1280 px the pattern is a table (a grid), with weekday row
headers, hour column headers and each cell's value and level, "0, Empty", "Closed" or "No readings"; closed and
missing runs are merged. Below 1280 px the weekday radio buttons name each day's busiest hour, and the selected
day's bars print their values; closed and missing runs are worded. Keyboard and tap reach the same readout.

Contrast measurements from the Reports round: `HISTORY.md`, "Reports (run `owner_reports_r04_s10`)", "The table, form and dialog system".


**Motion:** no load motion and no intro. The dialog's panel rises 14 px (a phone sheet slides up) in 240 ms on the rail's
opening easing and leaves in 200 ms on its closing easing; the scrim fades; no glyph changes opacity. The switch's thumb
slides 200 ms. The rail is the Daily page's, unchanged. Under reduced motion or `?motion=off` nothing animates.

**Loading (out of scope on Reports):** a later skeleton must hold the current responsive form: the week
grid from 1280 px, one day at a time below, and the day table from 721 px or the phone list (see `DESIGN-SPEC.md`, "4.2 Reports").

### Capture

```
node design-research/owner-composition-exploration-r04/directions/eclipse/reports-capture.mjs <outDir> [--port=3176]
```

It serves this folder on `127.0.0.1:3176` (never 3173, which is `capture.mjs`'s, or 3174), renders the Reports frames in
fresh contexts with reduced motion, and writes `frames/`, `sheets/` and `reports-log.json` into `outDir`, which must be
outside the repository. It exits 1 on a console message or page error, a font file fetched twice in one load, an
off-origin request, a horizontal page scroll, a layout shift after the first paint (input-driven shifts excluded), a
clipped or spilling element, a day table wider than its card on a phone, or a dialog panel outside the viewport.
`capture.mjs` is unchanged and still covers the Daily page only.
