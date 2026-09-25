# Floodlight · ملعب تحت الأضواء

FITWAY Owner r04 dark direction A. This is an exploration concept with synthetic data. Nothing here is selected, and nothing touches production.

## Thesis

The owner reads the gym day like a night-match scoreboard. The field is pure black, figures are big and condensed, and FITWAY red lights up only where the gym's own numbers are: the day's 10-minute columns, the peak plate, and the heatmap. Everything else in the interface is lit white, like the floodlights: the current section key, the active workspace, primary actions, and the selection frame. A score tower at the reading-start edge holds the figures, and the field beside it is the big screen that shows the day.

## Key choices

- **Palette.** The field is `#000`, the tower `#0a0a0b`, and the text white `#f4f4f0`. The signal red is `#E51935`, used as solid blocks and never as a line or a glow. Deep oxblood `#3a0710` appears only as the dimmed peak plate in the delayed state. The heatmap uses a single-hue ramp from FITWAY red toward black, never toward white, so it never turns pink.
- **Type.** Changa (400–800) sets Arabic and body Latin. Big Shoulders Display (600–900) is a Chicago-signage condensed face and sets every figure, plus the uppercase English labels. Both load from Google Fonts at real weights, and Cairo, Archivo, and Noto Kufi are not used.
- **Composition.** The masthead is a red FITWAY plate aligned over a score tower at the reading-start edge. On Daily the tower stacks, top to bottom: the section keypad, the Peak plate (a red block with a 150px figure, a band chip, and a 4-step meter), Average, Entries (labelled as estimated crossings, with the busiest entry hour), and Coverage. The field carries the title, a match-clock status box, the business-day line, the column chart, the selected-column readout, and the minute table. The tower is sticky, so the figures stay visible while you page the table. Reports reuses the frame: the tower holds the range control and a red selected-hour block, and the field holds the heatmap, the weekly comparison, the CSV panel, the footnote, and the hourly detail.
- **Chart form.** 114 lit columns, one per 10 minutes, from 6:00 AM to 1:00 AM on a 0–80 capacity scale, with band rules at 24, 48, and 68. **Bin rule, stated in the UI:** a column's height is the highest count observed in those 10 minutes. The minute table keeps every reading, grouped by the same columns.
  - Genuine zero is a white baseline cap marked "0".
  - Missing is a grey hatch. A partly missing column shows the hatch above its lit part, because the true highest may be higher.
  - Awaiting readings (delayed only) is a dotted socket.
  - Still ahead is an unlit socket.
  - Selecting a column opens a readout that shows its 10 minutes one by one.
- **Navigation.** A 3×2 floodlight switch keypad with the six sections in production order. The current key is lit white with a red lamp. It is neither a side rail nor a numbered tab index.
- **Reports.** The weekday × hour matrix is a lit results board, with the average printed in every cell.
  - Closed cells are hatched, and a single "Closed until 2 PM" plate spans Friday.
  - No data is a dashed empty socket.
  - Open and empty is a grey cell marked "0".
  - The weekly comparison reads as a score line (latest week in white, the week before in grey). Each change shows a glyph and a word.
- **Motion.** On first draw the columns switch on bank by bank, one hour at a time, in about 0.6 s. That is the only motion. It is removed under `prefers-reduced-motion` and `?motion=off`, and nothing animates at rest or between values.

## Truth rules kept

- Western digits in both locales. Arabic uses 12-hour time with ص/م, and no `Intl`/`toLocaleString` call is made with `ar`.
- Numbers, times, and Latin fragments are wrapped in `<bdi>`, and Arabic ranges use a plain hyphen.
- RTL time runs right to left. English is composed LTR in its own right, not mirrored.
- Missing, genuine zero, closed, still ahead, and awaiting are distinct in both drawing and text. In the delayed state the figures are tagged "Last known · as of 7:21 PM" and the peak plate dims.
- Status always pairs a word with a lamp shape.
- Nothing is smoothed or invented. The day comes from a seeded count process: Poisson entries, Binomial(n, 1/64) exits, mulberry32 with seed 2413. It peaks at 64 at 6:26 PM and reads 49 at 7:42 PM. Totals and the busiest hour come from the same run.
- The chart is a keyboard slider: arrow keys (mirrored in RTL), Home/End, and PageUp/PageDown step through columns. Hover and tap select the same columns. A polite live readout and the grouped minute table give a text equivalent. The heatmap is a roving-tabindex grid with an hourly table, and all targets are 44px.

## How to open

- Open `index.html` directly, or run `node capture.mjs` from PowerShell, which serves this folder on `127.0.0.1:3161`.
- Query parameters:
  - `lang=ar|en`
  - `section=daily|history|access|audit|health|settings`
  - `state=live|delayed|closed|empty|loading|error`
  - `motion=off`

## Evidence

`evidence/` holds the required 1440×900 frames and `capture-log.json`:

- `daily-{en,ar}` and `history-{en,ar}`
- `daily-{en,ar}-1440x900-delayed`
- `daily-en-1440x900-keyboard`: the chart was focused with Tab, then ArrowLeft was pressed 8 times, which selects the 6:20–6:29 PM column.

Every frame has 0 overflow, both font families loaded, and 0 errors. The 1280×800 overflow check shows 0 for Daily and Reports in both languages. Setting `INSPECT_DIR=<dir>` also writes full-page and extra-state frames (closed, empty, loading, error, placeholders) to that folder.

**Mobile is intentionally not designed in this round** (desktop-only scope change). No 390 or 320 layout exists.

## Known issues

- In the empty state, the first column shows as "awaiting", but the empty-state legend has no Awaiting entry.
- In the error state, the error title appears twice: once in the status box and again in the panel.
- The Arabic bin-rule sentence wraps with a one-word last line.
- The lower heatmap steps are deep oxblood by design; vivid red is reserved for the busiest hours.
- Apply and Export CSV are concept stand-ins. They validate and announce, but the data window never changes and no file is produced.
- This worktree sits on an old base commit without `node_modules`. The authority sources were read from the r04 exploration worktree, and `capture.mjs` falls back to that worktree's `@playwright/test`.

## Checks that did not run

- `pnpm install --frozen-lockfile` in this worktree, because its lockfile has no Playwright.
- `pnpm check:design-context`.
- Screen-reader passes, an axe or contrast audit, and 200% zoom/reflow.
- Visual inspection at 1280 (only its overflow was measured).
- The placeholder sections and the loading/error states were inspected only in scratch frames, not in `evidence/`.
