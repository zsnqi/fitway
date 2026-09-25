# Backlight — FITWAY Owner Daily (exploration concept)

**Exploration concept · synthetic data.** Round r04, one direction, the Daily page only, desktop
1440×900, Arabic RTL (default) and English LTR. Nothing here is selected, accepted, or production.
It changes no production code, token, canonical, Paper file, or authority record.

## Thesis

Smoked glass lit from behind by one dim FITWAY-red light: a familiar page (a rail, four small cards,
one chart) where the finish does the talking and the numbers stay calm and honest.

## Key choices

**Palette**

| Role | Value |
| --- | --- |
| Page field | `#070708` |
| Glass | `rgba(18,18,21,0.5)` plus `backdrop-filter: blur(28px) saturate(170%)`, 1px edge `rgba(255,255,255,0.07)`, top rim `rgba(255,255,255,0.075)` |
| Text | `#F4F2F1` primary, `#BDB7B8` secondary, `#928C8E` captions |
| FITWAY red | `#E51935`: logo chevron, active rail item, crowd-level ruler, heatmap ramp |
| Data line | `#F2283B` (same family, a little purer so a 2.4px stroke stays red on black) |
| Light behind the glass | core `rgb(236,34,34)`, falloff `rgb(232,30,34)`. The hue is nudged slightly warm on purpose: dim crimson drifts toward wine or pink on near-black and through blur, and this keeps it reading as red |
| Live | `#45D98F` (a dot with the word "Live", never alone) |
| Delayed | `#E3A21A` (with a clock icon and words) |
| No reading | neutral hatch `rgba(200,202,210,0.36)` |

The light is static CSS: two radial gradients, one behind the "Inside now" card (the first answer) and
one low behind the chart's lower edge, blurred. No canvas, no animation. A 5% grain overlay stops banding.
Glass tint is dark neutral, not white, so red seen through it does not turn pink.

**Type.** Alexandria (Google Fonts) 400/500/600 for both scripts: one family with a matched Arabic and
Latin, clear at 12–13px, with tabular figures. Cairo is not used. Arabic is never letter-spaced; only
the Latin `FITWAY` wordmark and English numerals get tracking.

**Composition.** Floating glass rail at the inline start (right in Arabic). Header: title, date and
opening hours, the live status pill, and the concept label. Four cards: Inside now (wider and lit),
Today's peak, Entries so far, Busiest time (last 7 days). One large chart card. Details sit below and
appear only after "View details".

**Chart.** A smooth red line through the readings, a dashed "usual Wednesday" line, fine vertical lines
under the curve at every plotted reading, and a faint red fade under the line. Horizontal guides sit at
the crowd-level limits (24, 48, 68) with a small level ruler and the level names at the inline end; the
top line is capacity 80. The rest of the day is a dotted zone labelled "Still ahead". Hover, focus, or
tap shows a guide, a ringed point (shape, not colour alone), and a small glass readout with the time,
count, crowd level, and the usual value.

**Rail.** Icons only by default. Hover changes only the icon tile (brighter icon, neutral tile); there
is no name tooltip and no `title` attribute. Each item has a localized `aria-label`. The redrawn logo
(clean inline SVG of the circular emblem: outer ring with its lower-left gap, inner arc wrapped round the
dot, and the chevron in FITWAY red) is a button with `aria-expanded` and the name "FITWAY, section
names"; it toggles the rail between icons only and icons with names. Only Daily is designed. Reports,
Access, Activity Log, Operations, Settings, Monitoring, and Sign out are inert links; the language
switch works.

**Motion.** Rail width (260ms), hover colour (160ms), and the details chevron. Nothing moves at rest,
the chart has no draw-in, and `prefers-reduced-motion` or `motion=off` removes all transitions. The
chart is complete and identical either way.

## Open proposal for the user — DESIGN_GUIDE §11 tooltips

§11 asks for tooltips where an icon's purpose is not obvious; you asked for no name tooltip on hover.
Proposal as built: **the section name appears beside the icon only on keyboard focus** (`:focus-visible`,
collapsed rail only), never on pointer hover, and never when the rail is expanded (names are already
visible). Pointer users open the names with the logo. Frame: `daily-ar-1440x900-focusname`. This is a
proposal for you to accept or reject, not a settled decision. Known cost: the label sits over the page
next to the rail while focus is there.

## Truth rules kept

- One seeded minute simulation (mulberry32, seed 15983): entries ~ Poisson(λ), exits ~ Binomial(occupancy,
  1/64), λ shaped to a morning bump (~30 near 7:20 AM), a small midday bump (~15), and an evening peak
  (~62 near 6:30 PM). Every figure is derived from it: now 49 at 7:42 PM (minute 822), peak 62 at
  6:29 PM, entries 332, 805 of 823 minutes with a reading, busiest 6-8 PM.
- Business day Wednesday 23 September 2026, 6:00 AM to 1:00 AM, gym time (Riyadh). Every x comes from
  minutes since open. Arabic applies a mirror transform to the same geometry; the data is not reversed.
- Plotted points: the reading every 15 minutes, plus 6:09 AM (end of the empty start), the morning and
  midday highs, the day's peak, both edges of the gap, and the latest reading. Interpolation is a
  monotone cubic Hermite (Fritsch–Carlson family, Steffen slope limit): it passes through every point with
  no overshoot. The page self-checks this on load (`window.__backlight.checks`: drawn maximum 62 at
  minute 749, overshoot 0).
- 6:00-6:09 AM is drawn at zero ("Open, nobody inside"). 2:14-2:31 PM has no line and a hatched band ("No
  reading"); the line ends and restarts with small end dots and never bridges it. Nothing is drawn after
  the latest reading.
- The usual line is the synthetic average of the last 4 Wednesdays per 15-minute slot, labelled "not a
  forecast", and drawn dimmer after now. The comparison sentence compares the latest reading with the
  usual line at the same minute and needs 3 people and 10% to say busier or quieter.
- Crowd levels: Quiet ≤ 24, Moderate ≤ 48, Busy ≤ 68, Packed above; capacity 80 (owner view only).
  Entries are "estimated walk-ins, not unique members"; the 18 minutes with no reading are not counted
  (said in details).
- States: live, delayed (last reading 7:29 PM: grey number, amber note, hollow end point, amber waiting
  band, amber now marker, "Delayed" status), missing, genuine zero, closed (5:40 AM, before opening),
  still ahead, not enough history, and loading.
- Western digits only (plain `String()`, no `Intl` or `toLocaleString`). Numbers, times, and Latin
  fragments sit in `<bdi>`. Ranges use a plain ASCII hyphen. Arabic uses ص/م, English AM/PM.
- A11y: skip link, `nav` and `main` landmarks, heading order, visible `:focus-visible`, 44px targets,
  the chart is a keyboard slider (arrows move between points in the visual direction, Home, End,
  PageUp/PageDown by an hour) with a live `aria-valuetext`, a text summary, and the full minute table in
  details.

## How to open

Serve the folder (any static server) or run the capture harness. `index.html` query params:

- `lang=ar` (default) or `lang=en`
- `state=live` (default), `delayed`, `nohistory`, `closed`, `loading`
- `motion=off` removes transitions (as does the OS reduced-motion setting)

Capture (PowerShell, worktree root): `node design-research/owner-composition-exploration-r04/directions/backlight/capture.mjs`
It serves on `127.0.0.1:3171` and uses `@playwright/test` Chromium at deviceScaleFactor 1 with reduced
motion. `evidence/capture-log.json` records fonts loaded (Arabic and Latin subsets), horizontal overflow,
page errors, an Eastern-digit scan, an en-dash scan in Arabic, the derived figures, and the curve checks.

## Evidence (`evidence/`, all 1440×900 unless noted)

Required: `daily-ar-1440x900`, `daily-en-1440x900`, `daily-ar-1440x900-inspect` (keyboard, peak),
`daily-en-1440x900-inspect` (hover, peak), `daily-ar-1440x900-rail-open`, `daily-en-1440x900-rail-open`,
`daily-ar-1440x900-delayed`, `daily-en-1440x900-delayed`, `daily-ar-1440x900-nohistory`,
`daily-ar-1440x900-details` (full page), `daily-ar-1440x900-focusname`.

Extra: `extra-daily-en-1440x900-details` (full page), `extra-daily-en-1440x900-nohistory`,
`extra-daily-ar/en-1440x900-closed`, `extra-daily-ar/en-1440x900-loading`,
`extra-daily-en-1440x900-focusname`, `extra-daily-en-1440x900-inspect-gap`,
`extra-daily-ar-1440x900-motion-off`, `extra-daily-en-1440x900-rail-hover`.
Overflow-only (no PNG, logged): 1280×800 EN and AR, rail collapsed and open.

## Known issues and compromises

- The line keeps the small real wiggles of a 15-minute sample; it is calmer than a 1-minute line but not
  as glossy-smooth as the reference. Smoothing further would hide real rises and falls.
- The peak is a one-minute high between 15-minute samples, so the line has a narrow tip at 6:29 PM.
- The focus-only name label overlaps the page beside the rail while focus is there.
- The glow is fixed to the viewport, so after scrolling to details it lights those panels instead.
- In the full-page details frames the fixed rail covers only the first screen.
- The language icon in English is the letter ع; non-Arabic readers may not recognise it without its name.
- The comparison thresholds (3 people and 10%) and the 2-hour "busiest" window are my assumptions.
- Other sections are inert; mobile and Reports are out of scope.

## Checks that did not run

Mobile (390×844) and 320px layouts; 200% zoom and reflow; screen-reader passes (NVDA, VoiceOver);
forced colours and high contrast; measured colour contrast; automated accessibility scan; real touch
tap testing; Firefox and Safari rendering (only Chromium was used); independent perceptual review; the
WORKFLOW concept gate. No gate is claimed as passed.
