# Light study (Owner r04, Round 2 lighting test)

Concept only, with synthetic data. Nothing is selected. This is one static Arabic RTL page at
1440×900 that renders one of three red light recipes: `index.html?recipe=a|b|c`. The composition
and the light geometry are identical in all three; only the colours change.

The data logic is reused from `../backlight/app.js`: the seeded simulation, the day constants and
the monotone interpolation. Everything else is new.

## The three recipes

Each light runs outward from its hottest point through the stops `kc, k0, k1, k2, k3`. It fades
over a neutral card (`rgba(15,14,15,.94)` on page `#070707`). The dim stops lean slightly warmer
than FITWAY red because a dark red mix drifts toward rose. Measured on the frames, every visibly
coloured pixel sits at OKLCH hue 18-28 (FITWAY red `#E51935` is 22).

- **A: Deep.** Saturated FITWAY red that only fades toward black.
  `kc rgba(229,25,53,.95)`, `k0 rgba(229,27,50,.9)`, `k1 rgba(212,24,40,.7)`,
  `k2 rgba(176,18,26,.38)`, `k3 rgba(124,12,12,.13)`. Rim: `rgba(255,58,80,.95)` to
  `rgba(229,27,46,.34)`. Wash: `rgba(229,27,50,.74)`, `rgba(200,20,34,.34)`, `rgba(134,12,14,.11)`.
- **B: Warm core.** Only the hottest point leans orange-red, so it can glow brighter without going
  pink. By a quarter of the way out it is FITWAY bright red again.
  `kc rgba(255,70,46,1)`, `k0 rgba(255,43,62,.94)`, `k1 rgba(234,28,44,.72)`,
  `k2 rgba(184,20,28,.4)`, `k3 rgba(126,12,12,.13)`. Rim: `rgba(255,96,66,1)` to
  `rgba(240,34,46,.38)`. Wash: `rgba(255,58,50,.8)`, `rgba(216,24,38,.36)`, `rgba(138,12,14,.11)`.
- **C: Red with neutral frost.** A's red, slightly lower, plus a separate grey-white veil,
  `rgba(232,225,212,.09 / .04)`. The veil is a hair warm so the mix never leans rose; on its own it
  measures neutral (chroma 0.002). It sits only where the red is strong, or just past the small
  light's sharp edge, where it reads as a milky charcoal lift. It never covers a dim red tail,
  where the mix turned dusty brown in testing. The rim gets a neutral sheen,
  `rgba(238,232,222,.26)`, just past its red part.
  `kc rgba(229,25,53,.9)`, `k0 rgba(229,27,50,.86)`, `k1 rgba(210,24,40,.64)`,
  `k2 rgba(174,18,26,.33)`, `k3 rgba(124,12,12,.1)`.

The chart line (`#FF2946`, 3px) and the red active rail tile (`#E51935`) are the same in all three.

## Light geometry (same in every recipe)

Each light belongs to an element. It is clipped to that element and scrolls with it; none is fixed
to the viewport.

- **Page wash.** Owned by `.page`, which is absolutely positioned and clipped by the page. It hugs
  the top edge from the top-right (inline-start) corner. It is an 880×150 ellipse at the corner
  (the stops `w0` to 16%, `w1` 48%, `w2` 74%, clear at 100%), plus a 300×230 corner ellipse. The
  rail is glass (`rgba(12,12,15,.7)`, blur 22px), so the wash tints its top, and its rim catches it.
- **Inside-now card, bottom-left (inline-end) corner.** A compact 150×112 ellipse centred 16px in and
  12px below the corner. It has a solid core (`kc` to `k0` by 26%) and a short, distinct fall-off
  (`k1` 56%, `k2` 73%, `k3` 85%, clear by 94%). The other three cards are unlit.
- **Chart card, bottom edge.** It is softer than the small light. A 620×240 ellipse at the
  bottom-left corner (`k0`, then `k1` 14%, `k2` 40%, `k3` 70%) lies over a 980×104 band along the
  whole bottom edge and a 420×160 lift at the bottom-right corner.
- **Rim.** A `::after` ring is masked to the 1px border. It carries the same ellipses a little
  larger, so the border brightens where the light touches it.
- **Structure.** Each lit card has a `.lamp` child clipped to the padding box: `::before` is the
  glow and `::after` is the grain.

## Grain

This is an inline SVG `feTurbulence` fractal noise tile: 180px, `baseFrequency .95`, 3 octaves,
greyscale, with contrast raised around a 50% grey. It is blended with `mix-blend-mode: overlay` at
opacity .26 for A and B and .3 for C. It is masked by the same gradient as the glow, so it appears
only inside lit areas; flat surfaces stay clean.

## Chart

The line passes through the reading every 30 minutes and the true peak (62 at 6:29 PM). It also
passes through three points that keep the line honest: the last zero minute, both edges of the
missing span, and the latest reading.

- **Line:** monotone interpolation, with no overshoot; the capture log checks that the drawn maximum
  equals the peak.
- **Hairlines:** vertical lines every 6px run from the line and fade out halfway down.
- **Grid:** faint horizontal lines.
- **Usual line:** the dashed "usual Wednesday" line stops at now.
- **Missing span (2:14-2:31 PM):** round caps, no hairlines inside, and 4 dots in the time axis.
- **After now:** nothing is drawn.
- **Tooltip:** static, at the peak.

## Capture

From PowerShell at the worktree root:

```
node design-research/owner-composition-exploration-r04/directions/light-study/capture.mjs
```

The script serves the folder on `127.0.0.1:3172`. It uses `@playwright/test` chromium with
reducedMotion `reduce`. It takes three 1x frames, then a 2x crop of the lower half of each chart
card. It logs fonts (Readex Pro 400/500), overflow, errors, figures and line checks to
`evidence/capture-log.json`.

## Checks not run

- **Not covered:** English, mobile, other states (delayed, closed, loading, no history),
  interactions (hover, keyboard, rail expand) and the details panel. All are out of scope for this
  test.
- **Automated suites:** no accessibility audit, contrast audit or repository verification.
  `pnpm check:design-context` passed at the start.
- **Displays:** the colours were checked only on these frames, in sRGB. They were not checked on a
  wide-gamut or HDR display, or on a phone screen.
- **Browsers:** Chromium only.
