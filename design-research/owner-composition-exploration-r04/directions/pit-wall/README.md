# Pit Wall · جدار الصيانة

Exploration concept · synthetic data. Designer C of three dark directions for the FITWAY Owner
(Management) page, round r04. Nothing here is selected, accepted, or production code.

## Thesis

The owner reads the gym the way a race engineer reads a car from the pit wall. Three telemetry strips
share one time axis: people present as a crisp per-minute step trace, entries per 10 minutes as a
stepped outline, and a coverage track that separates recorded, genuine zero, missing, waiting, and
still-ahead minutes. One scrubber cuts through all three strips at once. A timing tower beside the
strips reads out whatever the scrubber touches, together with the day's figures. Every number is set in
a monospaced face, and FITWAY red marks only the crowd and the live signal. The result is dense but
calm: a working instrument you can read in one pass from top to bottom.

## Key choices

- **Palette.** A near-black page (`#070809`) with graphite panes (`#0e1012`, `#121518`, `#191c20`) and
  hairline rules. Ink runs in three steps (`#edeff1`, `#b3bac1`, `#878f97`), and every step passes
  AA on the panes. FITWAY red `#e51935` appears only on the crowd trace, crowd-band glyphs, crowd
  figure tags, the live lamp, and the brand slab. Entries use steel (`#a9b3bd`) and coverage uses
  slate (`#5b636b`). Delayed, closed, missing, and waiting never use red. The Reports intensity scale
  mixes `#e51935` toward black in OKLab (30–100%), never toward white, so no cell turns pink, and the
  busiest cells land on the vivid red.
- **Type.** IBM Plex Sans Arabic (400/500/600) for Arabic and IBM Plex Sans (400/500/600/700) for
  English and the wordmark. JetBrains Mono (400/500/600) sets every numeral, time, and date. All
  three load from Google Fonts at real weights. Arabic is never letter-spaced. In English only,
  small uppercase session labels are tracked.
- **Composition.** A 56px system bar sits above a session band: a title plus timing-screen cells for
  status, business day, opening hours, gym time, and configured capacity. Below that is the wall
  itself: the timing tower on the inline-start side (right in Arabic, left in English) and the deck
  of strips across the remaining width. The tower is sticky, so the readout stays in view while you
  scroll the minute log.
- **Chart form (Daily).** The people strip is an unsmoothed per-minute step trace with a 0–80 scale
  (configured capacity). Band limits (≤24, ≤48, ≤68) are dashed lines, and band names sit in an
  inline-end gutter next to a four-step band scale. The entries strip is a stepped outline of
  10-minute bins, and bins with unobserved or not-yet-happened minutes are dashed. The rule is stated
  under the chart. The coverage track is one row of state segments, with coverage as a percentage.
  Missing (2:14–2:31 PM) is a hatched column across every strip, labelled with its 18 minutes.
  Genuine zero (6:00–6:09 AM) is drawn on the baseline and labelled. Still ahead is an empty dotted
  field. In the delayed state, the 21 waiting minutes get their own pattern, and the now marker turns
  grey and dashed, with the last known reading at 7:21 PM.
- **Chart form (Reports).** A numeric weekday × hour matrix with 44px cells. Each cell shows its
  rounded average on the red-to-black scale. Open-and-empty is a black cell with an outlined `0`.
  Closed is hatched, with one "Closed until 2 PM" label across Friday's closed span. No data is a
  dashed empty cell with `—`. Partial coverage (under 90% of scheduled minutes) gets a white corner
  mark. Under the matrix, on the same columns, are an hour-profile step trace for the selected
  weekday and its coverage track, so the pit-wall idea of one axis for several strips carries over.
- **Navigation.** A bank of hardware-like keys in the system bar: brand, Monitoring/Management
  workspace switch, then the six Management sections in production order as un-numbered keys. The
  selected key is lit by a white top rule. Daily carries a lamp: a red dot when live, a hollow ring
  when delayed. There is no side rail and no numbered index. Sections follow the production tab
  semantics: a tablist with arrow keys that follow the reading direction, Home/End, and a URL
  `section=` key.
- **Motion.** Almost none. Controls get 120ms colour transitions on hover and focus. The scrubber,
  readouts, and data change instantly, and nothing moves at rest. `prefers-reduced-motion` and
  `motion=off` remove the transitions too.

## Truth rules kept

- Western digits everywhere. No `Intl` or `toLocaleString`. Arabic time is 12-hour with ص/م, and
  English uses AM/PM. All times are gym-local. The 1:00 AM close stays with the opening day.
- Numbers, times, and Latin fragments sit in `<bdi dir="ltr">`. Arabic ranges use a plain hyphen, and
  a purely numeric span like `13-19` stays one LTR island, so it never reverses. Mixed text inside
  flex containers is wrapped in spans.
- Recorded, genuine zero, missing, waiting, still ahead, and closed are each distinct in fill or
  pattern and in words: in the legend, the readout, the minute log, and the slider's value text.
  None of them is drawn as zero or as live. Delayed figures are labelled "last known" through 7:21 PM.
- Status always pairs a word with a shape: a filled dot for live, a hollow ring for delayed, and a
  hatched square, empty square, ring, or `!` for the other states. Closed and empty show no count and
  no band.
- The day is one seeded count process (Poisson entries, Binomial(occupancy, 1/64) exits). The trace
  is the per-minute observation itself. Nothing is smoothed and no shape is invented. Total entries
  (314, "estimated entrance crossings, not unique members"), the busiest entry hour (5 PM), peak
  (64, Busy, 6:27 PM), average (20.6 across 805 recorded minutes), and coverage (805 of 823 = 97.8%)
  all come from that same simulation.
- The chart is a keyboard `slider` (arrows ±1 minute, Shift ±10, Page Up/Down ±60, Home/End). Hover,
  tap, and keys all drive the same readout. Tap and click announce through a polite live region. The
  minute log is paged 60 minutes at a time and follows the scrubber. Reports has a keyboard grid and
  an hourly detail table with all 133 cells.
- Skip link, landmarks, visible `:focus-visible` everywhere, 44px targets (keys, buttons, inputs,
  matrix cells), and Monitoring and Sign out marked inert in the concept.

## How to open

- Open `index.html` directly, or serve this folder. Query parameters: `lang=ar|en` (Arabic is the
  default), `section=daily|history|access|audit|health|settings`, and
  `state=live|delayed|closed|empty|loading|error` (Daily), and `motion=off`.
- To capture, run from PowerShell at the worktree root:
  `node design-research/owner-composition-exploration-r04/directions/pit-wall/capture.mjs`.
  The script serves this folder on `127.0.0.1:3163`, writes the PNGs and `evidence/capture-log.json`,
  and checks overflow at 1280×800.

## Evidence

Required frames (1440×900, deviceScaleFactor 1, reduced motion):

- `daily-{en,ar}-1440x900`
- `history-{en,ar}-1440x900`
- `daily-{en,ar}-1440x900-delayed`
- `daily-ar-1440x900-keyboard` (scrubber moved to the 6:27 PM peak by keyboard)

The `extra-*` frames were used for self-inspection: full-page Daily and Reports in both languages;
closed, empty, loading, and error states; and one placeholder section.

## Scope and known issues

- **Mobile is intentionally not designed in this round** (a desktop-only scope from the user). There
  are no 390 or 320 layouts and no mobile checks. Overflow is clean at 1440 and 1280.
- The per-minute trace is dense at 1440 (about 0.9px per minute), so it reads as a fine-grained
  signal rather than a smooth line. That is intended, but it is visually busier than a binned view.
- Reports ranges other than the default 28 days regenerate synthetic cells from a seed, so they
  illustrate the control rather than real history. The CSV button reports that no file is created.
- Monitoring and Sign out are inert.
- Keyboard hint text in Arabic contains Latin key names (Page Up, Home), isolated in `<bdi>`.

## Checks that did not run

- 390×844 and 320px (out of scope this round).
- 200% zoom and reflow.
- A screen-reader pass (NVDA/VoiceOver).
- Forced colours and high contrast.
- Tool-measured contrast for every token pair.
- An independent perceptual review.

The designer inspected every required frame and each extra frame by eye. Interaction smoke checks
(hover, tap announcement, RTL arrow direction, missing and zero readouts, pager, tab keys, heatmap
keys, range validation, presets, CSV note, 133-row table, skip link, `motion=off`) passed in a scratch
Playwright run that is not part of this folder.
