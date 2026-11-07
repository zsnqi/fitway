<!-- brief-format: v1 role: builder -->
# Builder brief: Activity's change lines stay out of the time column (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high). The outcome is agreed (DECISIONS item 111, a defect in its F3
build); build it as written and make no other change.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `17027639`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** in `design-research/owner-composition-exploration-r04/directions/eclipse/`, the parts of
  `activity.js`, `activity.css` and `settings-history.js` that build
  and place a `settings_updated` row's change lines and the row's time; then
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop"
  and §"Belonging check".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with
  `--concept` set to the eclipse folder's absolute path and the 3186-3187 port pair; that checkout is otherwise read
  only. Write evidence only in `D:/fitway-temp/owner-r04-activity-lines/`, which the coordinator made for you.
- This repository is public. Never read a sketch folder's state file.

## Why

`17027639` put Settings' change lines into Activity's `settings_updated` rows. On narrow widths a long change line
wraps and its last part lands directly under the row's time, so the time column reads as two times: «10:05 AM» over
«2:00 PM», «11:32 ص» over «2:00 ص». The belonging check on the merged head (`D:/fitway-temp/owner-r04-merged-belonging/`)
fails 190 Activity frames, `default` and `case=wide`: English at 320-366, 562-591 and 721 px, Arabic at 320-336 px;
every other page and width passes.

## Outcome

- **A1.** At every width and in both languages, a row's change lines stay inside the row's text column and never
  run under its time: the time keeps its own column for the row's full height (or its own line), and a change line
  that does not fit wraps inside the text column, breaking between the before and the after, never inside a time or
  a number with its unit. The row's other parts (action, actor, reason) keep their places and styles. Wide widths
  that pass today render as they do at `17027639`.

## Limits

- `pnpm verify:owner belonging-check --page activity.html --languages ar,en` over the full width range it runs by
  default passes with 0 findings, `default` and `case=wide` included; report its summary line.
- `pnpm verify:owner compare` against `17027639` on `activity` at 390x844 and 1440x900, ar and en, and on `settings`
  at the same sizes, shows differences only in the change lines' rows (none on Settings).
- `pnpm check:code-health` passes with no raised ceiling. Commit once on this branch with
  `fix(owner): Activity's change lines stay in the text column`; do not push.

## Check and report

Frames at 320, 360 and 390 in ar and en of Activity's first rows (default) and of `?log=every`, and at 1440 ar and en,
in one sheet. Final message, at most 15 lines: the commit, what changed and where, the belonging summary, the compare
result, the sheet path, anything you could not do.
