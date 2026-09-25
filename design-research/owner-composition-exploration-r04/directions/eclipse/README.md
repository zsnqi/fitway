# Eclipse v3 (Owner r04, full Daily page)

This is a concept only, built on synthetic data. Nothing is selected. It is the full Daily page at desktop
1440×900, in Arabic RTL (the default) and English LTR. It evolves `../light-study/` recipe A, and the data
logic (seeded simulation, day constants and monotone interpolation) comes from there. v3 applies Round 5 §1-§3
of `../NEXT-DIRECTION-BRIEF.md`: a new "Inside now" light, a chart light back toward light-study A, and a live
light tuner. It then adds the motion of §4 (see "Motion" below); with reduced motion or `?motion=off` the page is
pixel-identical to the still frames. Everything that is not a light layer or motion is unchanged from v2: the
layout, rail, copy, data simulation, centred average, chip rule, states and details panel.

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
- **Motion group** (added with the motion): "Replay load", "New reading" (the next minute of the same simulated
  day), "Reset readings", and switches for motion, "switch on at load" (the lights' entrance), "follow the pointer"
  (and "chart card too"), and "light follows crowd" with a level preview. The switches are kept in their own
  `localStorage` key (`fitway.eclipse.v3.motion`), separate from the light values, and are ignored with `?tuner=0`.
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

## Motion

Round 5 §4. Everything is in `app.js` (the "motion" section: Web Animations, held and replayed as one timeline),
the motion section at the end of `style.css`, and the inline script in `index.html`, which hides what is about to
enter before the first paint. Motion changes only transform and opacity, except the line (its drawn length and,
on a live update, the shape of its last 15-30 minutes), which is SVG geometry by nature. Every animation runs out
to exactly the still page: once settled, the AR, EN, delayed and no-history pages are pixel-identical to the
still frames (with the live pulse hidden; one rare exception is under "Checks not run"), and their DOM equals the
`?motion=off` DOM.

**Load, once (and on "Replay load").** The whole load takes 2,160 ms.

| What | Starts | Lasts | Easing | Moves |
| --- | --- | --- | --- | --- |
| Four small cards, in reading order | 0, 60, 120, 180 ms | 620 ms | `cubic-bezier(0.22, 1, 0.36, 1)` | opacity 0 to 1, rise 14px |
| Chart card | 200 ms | 700 ms | same | opacity 0 to 1, rise 18px |
| Page wash drifts in from its corner | 60 ms | 1,700 ms | same | `.wash-light` from 120px out and 60px up (toward its own corner) to rest; `.wash` opacity 0, 0.5 at 30% of the way, 0.85 at 60%, 1 |
| The rail's rim catches the wash | 270 ms | 1,700 ms | same | opacity 0, 0.45 at 35%, 0.9 at 70%, 1 |
| Inside now light slides in | 380 ms | 1,400 ms | same | the light layer and its grain, from 105px out past the lit side and 91px below the bottom (the corner-to-disc axis, outward) to rest; no fade |
| Inside now lit border | 470 ms | 1,400 ms | same | opacity along the rims' curve |
| Line draws from opening to now | 560 ms | 1,100 ms | `cubic-bezier(0.5, 0, 0.2, 1)` | drawn length; the fine vertical lines appear 36px behind the head |
| Chart light rises with the line | 560 ms | 1,350 ms | the line's curve | the light layer and its grain, from 297px (half the card) below to rest; opacity 0, 0.8 at 25%, 1 |
| Chart lit border | 650 ms | 1,350 ms | the line's curve | opacity along the rims' curve |
| End point | 1,660 ms | 320 ms | `cubic-bezier(0.22, 1, 0.36, 1)` | opacity, scale 0.4 to 1 |
| Peak marker | 1,740 ms | 420 ms | same | opacity; ring scale 0.5 to 1; label rises 5px |

- **The lights' entrance** (the user's note: the old one was a plain fade). Each light now arrives by moving,
  behind a disc that stays still, which is the same mechanism as the pointer-follow light. Transform only, except
  the fades listed above.
  - **Inside now:** the light and its grain start beyond the lit bottom corner, on the axis that runs from that
    corner to the disc's centre, and slide along it into place. The crescent grows out of the lit corner along the
    disc's arc, the thin bottom rim and the far-corner glow arrive with it, and the disc's edge takes shape as the
    light reaches it. The border catches the light 90 ms later. The start is decisive and the settle long (quint
    out), with no overshoot. The offset follows the disc settings, so a tuned disc keeps the same path.
  - **Chart card:** the U rises from under the bottom edge, starting with the line and on the line's own curve, so
    light and data arrive together; the light settles 250 ms after the line reaches now.
  - **Page wash:** it drifts in from the corner while it brightens, and the rail's rim catches it.
  - **Overscan:** while it moves, the Inside now light layer is larger than the card by `--lp` (148px) on every
    side, and every position in the light moves by the same `--lp`, so no edge of the layer is ever exposed. At
    rest the class (`.is-entering`) is removed and the light is exactly the still geometry.
- **One change from the brief.** The coordinator proposed starting the light displaced toward the disc's centre.
  Measured, that light passes over the crescent on its way out, so the crescent is brighter than at rest during
  the slide. The AR check, with the offset at 34% of the way, finds 9,532 pixels brighter than rest (up to +0.176
  L). With its opacity rising along the way it is still 6,827 pixels (up to +0.087 L). To avoid it, the light
  would have to stay under about 20% opacity for most of the slide (a probe in this session, not repeated by
  `capture.mjs`), which is a fade again. Starting beyond the lit corner on the same axis, no pixel is ever
  brighter than at rest. The motion matches the brief's description (the crescent grows from the lit corner along
  the arc), but the light does not come from behind the disc.
- **Brightness check** (`capture.mjs`, `motion.brightness` in the log). Each light is captured every 40 ms,
  content hidden, and compared with its rest frame after a 7x7 blur (the grain moves with the light), as the cube
  root of luminance, which is close to OKLab L. In AR and EN, no pixel of the Inside now light, the chart light or
  the wash is ever more than +0.01 brighter than at rest. The largest difference is +0.004 to +0.006, which is grain
  noise.
- **The line** now draws with `cubic-bezier(0.5, 0, 0.2, 1)` over 1,100 ms. The previous designer's curve was
  `(0.65, 0, 0.35, 1)` over 1,150 ms, which barely moved for the first 300 ms. The new curve is under way at once and
  eases long into now, so the chart light can share it.

**Live.**
- **Pulse:** a slow ring from the line's end point, only while live. It is an HTML layer above the chart: opacity
  0.7 to 0 and scale 0.28 to 1 over the first 62% of a 3.6 s cycle, repeating, with
  `cubic-bezier(0.22, 0.61, 0.36, 1)`. There is none while delayed, not even during the load.
- **New reading** (the tuner's "New reading"): the line extends to the new minute. Only its last 15-30 minutes
  morph, because the centred average legitimately changes there; everything earlier stays exactly as drawn. The
  end point, the tail's fine lines and the "now" clip move with it. It lasts 700 ms with
  `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Delayed:** a minute passes with no reading. The line does not move, and only the "minutes ago" text
  cross-fades.

**Numbers:** a quick cross-fade, never a count. The new value fades in over 200 ms with
`cubic-bezier(0.2, 0.7, 0.2, 1)`, and a copy of the old one fades out over 140 ms.

**Interaction.**
- **Tooltip and guide:** they glide to the new minute, for the pointer and the keyboard. The move lasts 140 ms
  plus 0.12 ms per pixel, at most 320 ms, with `cubic-bezier(0.22, 1, 0.36, 1)`. The tooltip fades in over 120 ms
  and out over 90 ms.
- **Rail:** the width switches at once and is never animated. For the change, the rail's surface steps aside for
  three pieces: a fixed start cap, a middle that scales from the inline-start, and an end cap that slides 156px.
  Opening takes 300 ms with `cubic-bezier(0.22, 1, 0.36, 1)`. Closing takes 240 ms with
  `cubic-bezier(0.4, 0, 0.2, 1)`. The names fade in over 240 ms after 80 ms.
  - **Changed from the previous designer:** the pieces now keep the rail's own blur (22px). Before, the rail lost
    its blur for the transition, so the page's text showed through the moving rail as sharp ghost text, and the
    first frame jumped from the collapsed rail.
- **Lights follow the pointer** (desktop, fine pointer, Inside now only by default): the light layer shifts at most
  10px by 7px toward the pointer (the chart card, if switched on, 6px by 4px). It uses a 900 ms transition with
  `cubic-bezier(0.22, 1, 0.36, 1)` and returns to rest on leave. It never runs during the load entrance.
  - **Changed from the previous designer:** the transform is a plain 2D translate with no `will-change`. With
    the old `translate3d` and `will-change`, a pointer at the card's centre (offset 0) re-rendered about 5,000
    pixels of the 2x card (mostly by 1/255, up to 35 at one icon pixel; measured in this session).
  - **Now:** at offset 0, the 2x EN card is identical to the card at rest. The 2x AR card differs at one pixel by
    1/255, which is not a shift. After the pointer leaves, both are identical to the still frame.
- **Light follows crowd** (a tuner toggle, off by default): the Inside now light is 0.42 of its strength when
  Quiet, 0.7 when Moderate, and full when Busy or Packed. It uses a 1.2 s opacity transition. The number and the
  level chip still carry the truth.

**Toggles and reduced motion.**
- **Motion is off** with `prefers-reduced-motion: reduce`, with `?motion=off`, or with the tuner's Motion switch.
  The page then shows final states at once.
- **Pixel identity:** in both the reduced-motion and `?motion=off` cases, every still evidence frame except
  tuner-open is pixel-identical to `evidence/pre-motion-hashes.json` (26 reduced-motion frames and 8 `?motion=off`
  frames).
- **"Switch on at load"** (on by default) switches the lights' entrance. When it is off, the cards and the line
  still enter, and the lights are simply there.
- **Font preload:** the page now also fetches the other script's subset of Readex Pro up front. This fixes a flaky
  still frame: opening the rail in English wrote «العربية» in a subset that was not loaded yet. It changes no
  pixel.

## Open and capture

Open `index.html` directly. Fonts load from Google Fonts. To capture, run this from PowerShell at the
worktree root:

```
node design-research/owner-composition-exploration-r04/directions/eclipse/capture.mjs
```

It serves the folder on `127.0.0.1:3173` and uses a fresh Playwright chromium context per frame, at
deviceScaleFactor 1 (2 for the crops). The still frames use reducedMotion "reduce"; the motion part uses
"no-preference". It writes everything below and `evidence/capture-log.json`, and takes about four minutes. It
exits with code 1 if the static guard or a tuner check fails.

The log records:

- fonts, overflow, spill, errors, Western digits, en dashes in Arabic, and the line checks;
- the keyboard steps and the 1280×800 overflow checks;
- the light measurements per preset;
- the light-study A calibration, rendered read-only from `file://`;
- the `file://` tuner check. It changes one control by keyboard and confirms the custom property and the
  rendered pixels change. It checks that Copy values gives valid JSON on both paths, that the value persists
  across a reload, that `?tuner=0` shows no tuner and ignores storage, and that Reset works. It also applies the v2
  and Recommended presets and drags the tuner 200px by 120px (Home on the grip brings it back). The Motion group
  switches show the page's own defaults (`window.__eclipse.motion.defaults`), "New reading" advances one minute, and
  two switches persist in their own key and are ignored with `?tuner=0`. With motion on, still from `file://`,
  "Replay load" runs the lights' entrance again. All of it passes.
- `motion` (the motion part):
  - the static guard: `staticFramesIdentical`, `motionOffFramesIdentical`, and the settled motion pages;
  - `spec` (every motion as built) and `loadAnimationsAsRun` (every load animation as the browser runs it: target,
    properties, delay, duration, easing, keyframes);
  - `brightness`, the lights-never-brighter check, including the counterfactual;
  - `follow` (rest, zero offset and after leave, AR and EN), `live`, `rail`, `glide`, `delayed` and
    `switchOnAtLoad`.

## Evidence

- **1440×900, Recommended:**
  - `daily-ar-1440x900`
  - `daily-en-1440x900`
  - `-hover`
  - `-rail-open` (AR and EN)
  - `-delayed`
  - `-nohistory`
  - `-details` (full page)
  - `daily-ar-1440x900-tuner-open`
- **Per preset (`v2`, `a-like`, `recommended`):**
  - `preset-<id>-ar-1440x900`
  - `preset-<id>-nowcard-2x`
  - `preset-<id>-chart-2x`
  - `preset-<id>-nowcard-light`, 1x with content hidden
  - `preset-<id>-chart-light`, 1x with content hidden
- **Other:**
  - `daily-en-nowcard-2x`, the LTR mirror
  - `levels-nowcard` and `levels-chart`, the level maps of the Recommended 2x crops
- **Removed:** v2's `daily-ar-chart-2x` and `daily-ar-nowcard-2x` are replaced by the
  `preset-recommended-*-2x` crops.
- **Motion** (every `motion-*` frame is rewritten on each run; frames from earlier motion runs are deleted first):
  - `motion-load-ar-<ms>` at 0, 150, 300, 450, 600, 800, 1000, 1200, 1400, 1700, 2000 and 2160 ms (the end, which
    is identical to the still frame), and `motion-load-en-<ms>` at 300, 600, 1000, 1400 and 2160 ms;
  - `motion-light-nowcard-ar-2x` and `-en-2x`: the Inside now light at 0, 150, 300, 500, 800 and 1200 ms after it
    starts, and final;
  - `motion-light-chart-corners-ar-2x` and `-en-2x`: the chart card's two lower corners at 0, 200, 400, 600, 900
    and 1300 ms after its light starts, and final;
  - `motion-live-ar-cards-*` and `motion-live-ar-tail-*-2x`: a new reading before, at 100 ms, at 350 ms and after;
  - `motion-follow-now-rest-2x`, `-a-2x` and `-b-2x`: the light following the pointer;
  - `motion-rail-ar-open-0120ms`, `motion-rail-ar-close-0110ms` and `motion-rail-en-open-0120ms`;
  - `motion-glide-ar-0090ms`;
  - `motion-contact-sheet`: all of them on one page.

## Checks not run

- **Audits:** no accessibility or contrast audit, and no screen-reader pass. The tuner was checked only for
  keyboard use, labels and Escape.
- **Browsers:** Chromium only, sRGB only. The lights need `container-type: size`, cq units, `sqrt()`/`pow()`
  in `calc()`, `mask-composite: intersect` and `rgb(... / calc())`. The motion needs the Web Animations API with
  `pseudoElement`. None of this was tested in Firefox or Safari.
- **Motion:**
  - It was judged from held frames only, not from a recording or from real-time playback on a real display.
  - Frame pacing and jank were not measured.
  - The pointer-follow and rail were checked with Playwright's mouse, not a real touchpad.
  - Touch devices were not tried (follow is off there by design).
- **Known differences:**
  - After a simulated live update settles, the page's DOM equals the canonical page, but some pixels differ by
    1/255 (`liveUpdateEndsAtCanonical`). This comes from compositing after the cross-fades and was already there
    before this session.
  - With the pointer at the card's centre, one 2x AR pixel differs by 1/255.
  - In one of four full capture runs, the settled delayed page differed from its still frame by at most 2/255 in
    the chart's lower inline-end corner, where the rising light had just been composited. Six separate repeats of
    that check were identical, and so were the other runs. It looks like timing in the capture, not a difference
    in geometry.
- **Scope:** no English frames for hover, delayed, nohistory or details. Mobile is out of scope.
- **Repository:** no repository verification. `pnpm check:design-context` passed at the start of v3 and again at
  the start of the motion work.
