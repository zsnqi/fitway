<!-- brief-format: v1 role: builder -->
# Builder brief: a two-hour bar tells each of its hours (public-redesign-r01)

For a fresh `owner-direction-builder` (Opus, high). Concept-only (ADR-010). The target below is decided by the user:
apply it as written. Where it cannot be met as written, stop and report why.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `a1312e76`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-16.html`, `.css` and `.js`:
    the page you change, in place.
  - `D:/fitway-temp/public-redesign-r01-polish-35/NOTES.md`: how sketch 16's two-hour bars, readout and frames work.

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

- `<run>` is `public-redesign-r01-hours-36`, made by the coordinator with `pnpm run-folder:new`.
- A page server for the user's phone runs on port 3181 from this worktree's Eclipse folder; leave it alone and serve
  on your own port.

## What the user decided

The user likes the phone's two-hour bars (`?hours=2`, the default) as the tidier look, the quiet head (`?head=quiet`,
the default) and "Fri" with its dot. Keep all of that, the switches, the drag and everything else in sketch 16. Change
only this, in `public-sketch-16.*`:

1. **A two-hour bar stands for its busier hour, not the mean.** Its height, its word ("usually busy"), its
   screen-reader name and the day's quietest and busiest sentence all use the busier of its two hours, so the page
   never promises a quieter time than one of the hours usually is.
2. **A picked two-hour bar's readout names each hour.** Where its two hours share a word, it reads as now
   ("6 – 8 PM: usually busy"). Where they differ, it names both, in clock order: "**6 PM** usually moderate ·
   **7 PM** usually busy", the hours bold as the readout's hours are now. A lone last hour (Thursday's 1 AM) reads as
   an hourly pick does. The bar's screen-reader name says the same in words ("6 PM usually moderate, 7 PM usually
   busy"). No mark inside the bar: the user turned that down.
3. The readout keeps the height sketch 16 holds on a pick, so the bars never move under the finger: at 360 and 390
   the longest two-hour readout (the two-hours-differ case) fits that height; measure it on every phone day.

## Frames

Render with `pnpm verify:owner frames` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell,
`--concept` set to this worktree's `design-research/owner-composition-exploration-r04/directions/eclipse` folder as an
absolute path, `--page public-sketch-16.html --languages en`, at Busy, into `D:/fitway-temp/<run>/frames/`, using the
pick state sketch 16's frames used (NOTES.md): `phone@3` and `phone360@3` with `?day=sat` and nothing picked, with a
two-hour bar picked whose hours differ, and with one whose hours share a word; `phone@3` with `?day=thu` and its 1 AM
picked; and `phone@3` and `desktop@2` today, to show the rest unchanged. Lay them out with `pnpm verify:owner sheet`
as `sheet-hours`. Look at every frame you report.

Commit once, with the copy changes in the message.

## Report

At most 25 lines: the rule for a bar's value and where it applies; every line of copy added or changed; the readout's
height at 360 and 390 against the longest case; the frame and sheet paths; the commit SHA; anything that could not be
met as written.
