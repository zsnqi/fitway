<!-- brief-format: v1 role: builder -->
# Fixer brief: the user's two picks become the page (public-redesign-r01)

For a fresh `owner-direction-fixer` (Sonnet, high). Mechanical: the target is frozen below and makes no design decision.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `7bc83781`
- The branch may carry Markdown-only record commits on top of `7bc83781`; the page files are as at `7bc83781`.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.js`, `public-copy.js` and `public.css`.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"Public designer frames" and §"CLI working loop".

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

- `<run>` is `public-redesign-r01-picks-65`, made by the coordinator with `pnpm run-folder:new`.
- The worktree's verification CLI has no `frames`: run `pnpm verify:owner` from
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04` with `--concept` set to the page's absolute folder. That checkout
  is otherwise read only. Ports 3181 and 3182 are the user's. Use port 3188. `frames` needs a fresh empty `--out` folder, and in
  PowerShell quote `'ar,en'`.
- This repository is public. Never read a sketch folder's state file.

## Frozen target

The user picked `note=none` and `whole=line`, on 2026-11-04. The page behaves exactly as `?note=none&whole=line` does at
`7bc83781`, with no switch left.

1. `note`: Unavailable has no line under its word. Delete `NOTE`, `T.noOld` and `T.notes` in both languages, and any
   `public.css` rule nothing else uses (`.facts.note`).
2. `whole`: `ringHour` returns `lowest(d, DAYS[d].open)` for another day; `dayWords` returns only the ring and
   `T.quietLine(low.h, band(low.v) === "quiet" ? "quiet" : "less")`. Delete `WHOLE`, `T.busiest`, and `T.dayRange` if nothing else
   uses it.
3. Comments: remove both switches from the switch comment near line 22, and rewrite the comments at lines 141-143 and 718-720 to
   state the one behaviour. Leave every other switch alone.

No other change. If this target cannot be met as written, stop and report.

## Proof

- Before editing, make frames with `pnpm verify:owner frames` at `7bc83781` with `note=none&whole=line` on the query of each state;
  after, the same frames with neither switch. Sizes `320x568`, `390x844`, `1440x900`; `ar` and `en`; states Live, Closed,
  Unavailable, Live on another day, Error. `pnpm verify:owner diff-folders` must report EQUAL for all, each noise difference
  re-made once.
- Make a sheet with `pnpm verify:owner sheet` for the user: Arabic at `390x844`, Closed, another day, Unavailable.
- `pnpm check:code-health` and `pnpm check:repository` from the worktree must pass, with no raised baseline.
- Say whether the quiet line fits on one row at `320x568` in both languages on Closed and on another day. Report it; do not fix it.

## Report

Your final message, under 150 words: the commit SHA on `public-redesign-r01` (commit there, do not push), the diff result as counts,
the sheet path, the one-row answer, and anything you could not meet.
