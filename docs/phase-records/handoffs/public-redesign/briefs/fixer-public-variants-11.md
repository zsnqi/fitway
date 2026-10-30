<!-- brief-format: v1 role: fixer -->
# Fixer brief: the public crowd page, three proposals as switches (public-redesign-r01)

For a fresh `owner-direction-fixer` (Sonnet, high). Concept-only (ADR-010). The targets below are frozen: apply them
as written and make no design decision of your own. Where a target cannot be met as written, stop that target and
report why; do not invent another.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`,
  `public.css` and `public.js` (all of them, short); and `D:/fitway-temp/public-redesign-r01-polish-10/capture.mjs`,
  the last capture script, whose way of opening pages, sizes and sheets you reuse.

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

- `<run>` is `public-redesign-r01-variants-11`.
- No design skill is needed; load none.

## What to build

Three switches on `public.html`, each read from the URL by `public.js` and set as a class on `.page`
(`?p1` → `p1`, and so on; any combination may be on). The page without them must render exactly as today: compare
your frames without switches against `D:/fitway-temp/public-redesign-r01-polish-10/frames/phone-busy.png` and
`desktop-busy.png` pixel for pixel, and report the result.

1. **`p1`, Packed on one line on the computer** (from 1024 px wide only; below it nothing changes). «شديد الازدحام»
   sets on one line in the word's column beside the count, at every computer size. No level reserves a second word
   line any more, so the word's row is one line tall and the mark's line rises accordingly; the mark's line stays the
   same at all four levels. The word's size: in the computer `--word` formula, replace the width divisor (`5.6`) with
   the measured width of «شديد الازدحام» in em at weight 600 (measure it in the page, report the value), and in the
   height term count one word line instead of two (replace `2.67` with the one-line equivalent you measure: the word
   row's height in em). Keep the formula's other terms and its clamp. Report the resulting word size at 1440 × 900.
2. **`p2`, the percentage and the open line swap places.** `public.js` moves the `.pct` paragraph to where `.open` is
   (inside `.facts`, after the count line) and `.open` to where `.pct` was (inside `.stamp`, after `.fresh`). Each
   takes the styles of the place it moves into: in `.facts` the percentage looks as the open line does today; in the
   stamp the open line looks as the percentage did (its time in the same ink the percentage's number had). Nothing
   else moves.
3. **`p3`, short screens keep the stamp.** Under `p3`, in both `--word` formulas and in `--below`, lower the floors:
   `--below` becomes `clamp(16px, 22dvh, 240px)`; the word's clamp floor becomes `40px` (from `64px` on the phone and
   `120px` on the computer). Nothing else changes. Target: at 844 × 390 and at 200 % zoom (the last capture's `zoom`
   case), at Packed, the whole stamp is inside the first screen. Report if it is not.

## Frames and sheets

Render with verify-fitway's `run` (`.agents/skills/verify-fitway/SKILL.md` §"Run one check"), one script in
`D:/fitway-temp/<run>/`, `--concept` set to this worktree's Eclipse folder, Arabic, reduced motion. For each switch,
"before" is the page without switches and "after" is the page with that switch alone:

- `p1`: the computer 1440 × 900 at Quiet and at Packed.
- `p2`: the phone 390 × 844 at Busy, and the computer 1440 × 900 at Busy.
- `p3`: 844 × 390 at Packed, and 200 % zoom at Packed.

Save each frame as `D:/fitway-temp/<run>/frames/<switch>-<case>-{before,after}.png`. Build one sheet per switch,
`sheet-p1.png`, `sheet-p2.png`, `sheet-p3.png`, in the style of the last capture's `sheet-before-after.png`: top row
the before frames, bottom row the after frames, a large "before" and "after" at the start of each row, nothing else
written. Look at every frame and sheet yourself: a clipped word, an overlap, a sideways scroll or a console error is a
failure to report, not to hide.

Commit once, with the three switches. No capture script goes in the repository. You change only `public.css` and
`public.js` (and `public.html` only if a switch needs it); leave every other file as it is.

## Report

At most 30 lines: per switch, what you changed and the measured values asked for; the no-switch comparison result;
the sheet paths; anything that did not meet its target, and why; the commit SHA.
