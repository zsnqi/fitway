<!-- brief-format: v1 role: builder -->
# Fixer brief: sketch 15's text shows at once and does not jump when the font arrives (public-redesign-r01)

For a fresh `owner-direction-fixer` (Sonnet, high). Concept-only (ADR-010). The target below is frozen: apply it as
written and make no design decision of your own. Where it cannot be met as written, stop and report why.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `617dd642`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-15.html` and
    `public-sketch-15.css` (its `@font-face` rules, lines 13-14, and every `font-family`).
  - `D:/fitway-temp/public-redesign-r01-review-31/motion-before/REPORT.md` §"The arrival (defects only)" item 1, and
    its `fout-sheet.png` in the same folder: the jump this round must not bring back.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- `<run>` is `public-redesign-r01-font-34`, made by the coordinator with `pnpm run-folder:new`.

## The problem

Sketch 14 used `font-display: swap`: the page first painted in a fallback face, and when Readex Pro arrived "Busy"
widened by 29 px at 1440 x 900 (15 px at 390 x 844) and the facts beside it moved. Sketch 15 fixed the jump with
`font-display: block` and preloads, which hides all text until the font arrives, up to about 3 s on a slow phone.
Neither is acceptable.

## What to build

In `public-sketch-15.css` and `public-sketch-15.html` only:

1. Both `@font-face` rules for "Readex Pro" use `font-display: swap`. Keep both preload links.
2. Add a fallback face, `"Readex Pro Fallback"`, from `local("Arial")`, with `size-adjust`, `ascent-override`,
   `descent-override` and `line-gap-override` set so its box matches Readex Pro's. Derive the numbers by measurement,
   not by guess: in Chromium, measure the advance width of the page's own strings (the level words Quiet, Moderate,
   Busy, Packed at the level word's weight; "About 70 inside", "58% full", "Busier than usual", and the hour labels at
   theirs) in Readex Pro and in Arial, and Readex Pro's ascent and descent (canvas `measureText`
   `fontBoundingBoxAscent` and `fontBoundingBoxDescent`). Where the level word's weight and the body weight need
   different ratios by more than 2%, add one fallback face per weight with its own `font-weight` and `src`
   (`local("Arial Bold")` for the bold).
3. Put `"Readex Pro Fallback"` right after `"Readex Pro"` in every `font-family` the page uses. Change nothing else:
   no layout, size, colour, copy or motion.
4. Keep `window.__sketch = { ready: true }` once the fonts have loaded, and keep the arrival waiting for the fonts as
   it does now.

## Outcome to prove

With the Latin font file held back 800 ms (a Playwright route that delays `design-research/owner-composition-exploration-r04/directions/eclipse/fonts/readex-pro-latin.woff2`), at
1440 x 900 and at 390 x 844 with touch, at `?level=busy` and `?level=packed`:

- text is visible from the first painted frame;
- between the fallback frame and the final frame, the level word's width differs by 2 px or less, and the facts row's
  items and the card's readout move by 2 px or less;
- the browser's layout-shift total over the load is 0.001 or less.

Show it: the before-swap and after-swap frames for each case, and a sheet of them, in `D:/fitway-temp/<run>/`.
Then render `pnpm verify:owner frames` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell
with `--concept` set to this worktree's `design-research/owner-composition-exploration-r04/directions/eclipse` folder
as an absolute path, `--page public-sketch-15.html --languages en --sizes 'phone@3,desktop@2' --states 'level=busy'`,
into `D:/fitway-temp/<run>/frames/`, and confirm by a pixel diff against
`D:/fitway-temp/public-redesign-r01-review-28/after3-frames/en-desktop-level-busy.png` and `en-phone-level-busy.png`
that the settled page is unchanged. Look at every frame you report.

Commit once, with the measured numbers in the message.

## Report

At most 25 lines: the fallback faces and their four numbers each, with how you measured them; the outcome's
measurements per case, against the limits above; the frame, sheet and diff paths; the commit SHA; anything that could
not be met as written.
