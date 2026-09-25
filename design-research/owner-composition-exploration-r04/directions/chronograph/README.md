# Chronograph · كرونوغراف

Exploration concept · synthetic data. Concept-only FITWAY Owner direction (designer B of three, r04 dark
round). Nothing here is selected, accepted, or promoted; production, canonical, Paper, and authority
state are untouched.

**Mobile is intentionally not designed in this round.** Following the user's scope change, this direction
is desktop-only: 390×844 and 320 layouts were neither designed nor checked.

## Thesis

The owner reads the gym day the way you read a fine watch at night. One 24-hour dial is engraved around
the opening hours, with noon at the top and time running clockwise. A vivid FITWAY-red hand stands at
"now", and the crowd is traced in red around the face. Every figure the owner needs flanks the dial like
the readouts of an instrument cluster. The dial gives the shape of the day at a glance; the flanking
figures, the hub readout, keyboard inspection, and the minute ledger give the exact numbers.

## Key choices

- **Palette:** graphite-black case (`#0a0a0c`) and a dial face with a restrained oxblood depth at its
  centre (`#1d080d` to `#0e0e10`). One signal red, `#e51935`, is used at full strength for the trace, the
  now-hand, the peak tell-tale, the Live lamp, the active-section index, and primary buttons. Under the
  trace, the crowd mass runs from deep oxblood (`#2a060d`) at zero to `#8e1426` at capacity. Nothing is
  lighter than `#e51935`, so the red never drifts toward pink. Engraving uses steel greys; the selection
  hand is silver (`#f2f2f4`).
- **Type:** Readex Pro, one family for Arabic and Latin (Google Fonts, variable `wght 160..700`; real
  weights 200 to 700 are used). Large figures use light weights (200 to 300), like applied watch
  numerals; labels use 500. Latin labels are tracked caps. Arabic is never letter-spaced or uppercased.
  All digits are Western, and tabular numerals are on.
- **Composition:** an instrument cluster at 1440, with a wing, the dial, and a wing.
  - The **inline-start wing** holds the title, the status plate (Live or Delayed, with an icon), the
    business day, opening hours, the timezone, and the dial's key.
  - The **dial** is 720 px and is the page.
  - The **inline-end wing** stacks peak level (with band gauge and time), average occupancy, total entries
    (framed as estimated entrance crossings, plus the busiest entry hour), data coverage, and capacity.
  - Arabic mirrors the wings; the dial itself does not mirror.
  - Below the fold, the **minute ledger** pairs an hour index and pager with the paged, 60-minute table.
- **Day chart:** a 24-hour dial with noon at the top.
  - The open arc runs from 6:00 AM (9 o'clock) clockwise to 1:00 AM, just past 6 o'clock. The closed
    window, 1:00 to 6:00 AM, is a recessed plate. It carries the band names and the 0/24/48/68/80 scale.
  - Radius encodes people present: the zero ring sits at the hub and the outer ring is capacity 80. Band
    rings are engraved at 24, 48, and 68, and the Packed zone is tinted like a tachometer's red sector.
  - A dashed ring marks the average, and a red tell-tale marks the peak.
  - Engraved notes on a ring between the scale and the numerals label the peak, the missing span, the
    genuine zero, still ahead, and waiting.
  - The centre hub is the readout: the latest reading, or the selected one. Its last line says
    "Clockwise from 6:00 AM".
- **Reports weekday × hour view:** a week dial on the same 24-hour geometry.
  - Seven concentric rings, Sunday outermost and Saturday innermost, by 19 hourly cells (6 AM through the
    12 AM hour). Weekday names are engraved on ring guides in the closed window.
  - Cells use a single-hue ramp from oxblood to FITWAY red and print their rounded average.
  - Closed cells are recessed plates, with "Closed until 2 PM" engraved along Friday. No-data cells are
    hatched with "?". Open-and-empty cells are outlined with "0".
  - The hub and the right wing give the selected hour: average to one decimal, observed of scheduled open
    minutes, and weekdays measured.
  - The same right wing holds the weekly comparison, where each change has a word, a drawn arrow, and a
    signed delta. The range control, legend, CSV panel with its privacy note, footnote, and hourly table
    (with a weekday picker synced to the dial) complete the page.
- **Navigation:**
  - The six Management sections sit on an engraved **bezel ruler** across the top: a continuous tick scale
    with a major tick under each label. The current section is marked by a red index pip and a silver
    tick. There are no numbers, glass, or side rail.
  - The app-level Monitoring / Management switch is a two-position selector with a red lamp on the
    current side.
  - The language toggle, sign out, a skip link, and the visible concept plate sit in the case band.
  - The four sections that are not designed yet show a blank dial with their production title and
    description, and "Not designed in this early look".
- **Motion:** one authored moment. On load, the red hand sweeps from opening to now in about 1.15 s with
  an exponential ease-out, revealing the traced day behind it (a clip reveal of the final path, not
  animated values). `prefers-reduced-motion` and `motion=off` remove it and every transition. Nothing
  animates at rest. Hover and focus changes use 120 ms colour transitions only.

## Truth rules kept

- **Minute truth:** there is one point per minute, and the trace is a polyline through every observed
  minute. Neighbours are joined directly, with no smoothing, overshoot, or invented peaks. The UI says
  this ("One point per minute…"). There is no binning on Daily. On Reports, cells state their averaging
  and rounding rule.
- **Distinct states, drawn and written:**
  - Genuine zero (6:00-6:09 AM): an observed red bar on the zero ring, with end ticks and a note.
  - Missing (2:14-2:31 PM): a hatched sector, a break in the trace with end caps, and the note
    "Missing observation · 18 min".
  - Scheduled closed: the recessed plate with its label.
  - Still ahead (after now): a veiled, unlit sector with dotted guides and a note, never drawn as zero.
  - Delayed/waiting (7:21 to 7:42 PM): a dashed-outline sector labelled "Waiting for readings · since
    7:21 PM". The now-hand turns dashed silver (never live red), the last reading gets a hollow
    "last known" marker, the hub says "Last known", and the figures carry a "Last known · as of 7:21 PM"
    plate and dimmer figures.
- **States from `?state=`:** `live`, `delayed`, `closed` (no count or band; closed copy only), `empty`
  (no readings; "—" and "Not available"), `loading` (a static skeleton with `aria-busy` and loading
  text), and `error` (no retained reading; one Retry action).
- **Status pairs text with a non-colour cue:** Live is a filled lamp icon, Delayed an hourglass, Closed a
  slashed circle, Empty a dashed circle, and Error a triangle. Bands always carry a four-segment gauge
  glyph and their word.
- **Western digits and 12-hour time:** digits are Western everywhere, with Arabic ص/م and English
  AM/PM, and no `Intl`. Numbers, times, and Latin fragments are wrapped in `<bdi>`. Arabic ranges use a
  plain hyphen. Mixed text in flex rows is wrapped in spans.
- **Direction:** the clock face does not mirror. It reads clockwise in both languages, and this is stated
  both in the key and in the hub. Keyboard "later" follows reading direction: Right in English, Left in
  Arabic, and Up in both.
- **Accessibility:**
  - The dial is a focusable `role="application"` with a hint and a text summary. Arrow keys step one
    minute (Shift for ten), Page Up and Page Down step an hour, and Home and End jump to opening and the
    latest reading.
  - Hover, tap, and keyboard expose the same hub readout, which is `aria-live="polite"`. The selection is
    a silver hand plus a hollow ring, so it does not rely on colour.
  - The selection syncs the minute ledger page and highlights the row.
  - The week dial works the same way, with Left and Right moving by hour and Up and Down by weekday.
  - Both views have semantic tables. There are landmarks, a skip link, a visible `:focus-visible` style,
    and targets of at least 44 px.
- **Synthetic data:**
  - The minute series is a seeded (mulberry32, seed 31) count process: Poisson entries steered toward the
    brief's target curve and Binomial(occupancy, 1/64) exits.
  - Morning bump: 32 at 7:20 AM. 1 PM bump: 16. Peak: 61 (Busy) at 6:24 PM. Now: 51 at 7:42 PM.
  - Total entries are 267 and the busiest entry hour is 6 PM, from the same simulation, counting observed
    minutes only. Coverage is 805 of 823 scheduled minutes.
  - The week grid is seeded too (seed 2026), with the brief's special cells.

## How to open

- **In a browser:** open `index.html` directly. Query parameters:
  - `lang=ar|en` (Arabic is the default)
  - `section=daily|history|access|audit|health|settings`
  - `state=live|delayed|closed|empty|loading|error`
  - `motion=off`
- **To capture (PowerShell):** run `node capture.mjs` in this folder. It serves the folder on
  `127.0.0.1:3162`, captures into `evidence/`, and writes `evidence/capture-log.json`.
- **Required frames:**
  - `daily-{en,ar}-1440x900`
  - `history-{en,ar}-1440x900`
  - `daily-{en,ar}-1440x900-delayed`
  - `daily-en-1440x900-keyboard` (7:20 AM selected by keyboard)
- **`extra-*` frames** are self-inspection only: full pages, the other states, the Arabic keyboard frame,
  and a placeholder section. The script also checks 1280×800 overflow for Daily and Reports in both
  languages, without screenshots.

## Known issues

- In `daily-en-1440x900-delayed`, the English engraved note "Still ahead · until 1:00 AM" runs past the
  1 AM boundary and overlaps the "80" scale label at the bottom. When delayed, it is pushed along the
  track after the "Waiting…" note. The Arabic delayed frame fits. The fix is to engrave the still-ahead
  note inside the veiled band (r ≈ 225) instead of on the track. It was left unfixed because the brief
  caps self-repair at two rounds, and both were used.
- Curved engraved notes are placed from an estimated text width, not a measured one. Very different copy
  lengths could crowd the track.
- Rotated weekday names in the week dial's closed window and the curved notes are legible, but slower to
  read than horizontal text. Exact values always also appear horizontally in the hub, wings, and tables.
- A radial scale slightly exaggerates late-evening area, since area grows with radius. The zero ring sits
  at the hub edge rather than the centre to limit this. Precise reading relies on the figures, the hub,
  and the tables.
- The date inputs use the browser's native format (for example `08/26/2026`).
- Range Apply, CSV export, Monitoring, and Sign out are inert in this concept, and say so.
- The load sweep was not visually verified, because captures run with reduced motion.

## Checks that did not run

- 390×844 and 320 layouts: not designed or checked, by the user's desktop-only scope.
- 200% zoom and reflow, screen-reader passes, pointer hover and tap automation, and forced-colours mode.
- An independent perceptual review. No finish-reviewer or other subagent was used, per the assignment's
  "do not delegate".
- `pnpm check:design-context` and `pnpm install --frozen-lockfile` did not run in this worktree. It sits
  at an old base commit (`04c0def`) without the check script or `@playwright/test`. The packet records
  the coordinator's design-context PASS.
  - Authority and copy were read, read-only, from the coordinator worktree
    (`D:\Projects\fitway-worktrees\owner-design-exploration-r04`).
  - `capture.mjs` resolves Playwright from there as well; set `FITWAY_PLAYWRIGHT_FROM` to override it.
- Impeccable's concept-seed roll and its DESIGN.md or documenter step did not run. The world was pinned by
  the brief, and DESIGN.md is a forbidden path for this packet.
