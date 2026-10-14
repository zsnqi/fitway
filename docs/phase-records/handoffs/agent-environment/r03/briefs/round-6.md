<!-- brief-format: v1 role: codex -->
# Codex brief: the verification path tells the truth and compares (agent-environment-r03, round 6)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `76caf6c3`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 13, 15.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` and the CLI beside it: round 4's path, which this round corrects.
  - `D:/fitway-temp/r03-round4/REPORT.md`: round 4's own report (V2 and V3).
  - `D:/fitway-temp/r03-r4-grade/p1/REPORT.md`: an agent new to the concept, using only the skill.
  - The concept, read only: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

- Ports: 3174 is the user's preview and 3178-3185 may be in use; never stop a process you did not start. Use 3176-3177.

## Goal

A pass from the verification path means the frame shows what was asked; a new feature in the concept is caught by
name; and a verifier compares a baseline with the build in one call, from any copy of the concept.

## Causes and required outcomes

Round 4 delivered the path (`7c7a768f`); its own report and three independent checks found where it falls short.

- **W1. A pass shows what was asked.** `drive` printed "FRAME PASS" for Activity's `case=long` although the frame
  showed the ordinary log: `case` takes effect only with `record=` (the concept's activity.js:254), and the map records
  neither the dependency nor what each state shows (P1 report, item 5). Outcome: an item passes only when the frame
  shows the state it asked for, checked against what the map says that state shows; a switch value that needs another
  (Activity's `case` needs `record`) is applied with it or refused with the reason; a feature that is absent in a state
  by design (the status details while loading: its button is hidden) is reported as not reachable there, a result of
  its own, never as a pass or a failure; a measuring tool that throws (the probe kit's Daily geometry probe while
  loading) is that item's problem, with its error, and the run goes on. Intent: an agent never mistakes a frame of
  the wrong state for evidence.
- **W2. A new feature is caught by name.** The map's features come from a list kept in the CLI (round 4's map.mjs,
  about 630 lines of recipes for the build), so a new dialog fails drift only as "source changed" without its name,
  and the build's knowledge sits in main (DECISIONS item 15). Outcome: everything the concept's code can tell is derived
  from it each time the map is used (pages, switches and their values and dependencies, readiness, and every element a
  user can open: dialogs, sheets, popovers, menus and the controls that open them); what code cannot tell (how a user
  reaches a feature, what proves it) lives in one file beside the concept, on the branch that changes it; nothing
  generated is committed. The drift check fails naming the file and line of each element no recipe covers and each
  recipe whose selector or marker is gone, and passes when the source changed in no such way. This round writes the
  build's recipe file into its evidence folder; the coordinator commits it on the build branch. Intent: a dialog added
  next month fails a check by name before any brief cites it, and the build's knowledge lives with the build.
- **W3. Any copy of the concept.** doctor and drive refuse a concept folder with no enclosing package.json (round 4
  grader B), so a baseline extracted with `git archive`, the comparison most Owner briefs require ("equal to the
  baseline"), cannot be driven. Outcome: launch, doctor, drive and compare work on any folder holding the concept,
  inside or outside a checkout. Intent: a verifier's baseline is one extraction and one call.
- **W4. Compare.** Each Owner round still hand-writes its baseline comparison (AUDIT §"What the evidence says").
  Outcome: one command drives the same items on two concept folders and reports each as equal or different, with the
  differing region and a diff image, after repeating a differing item in a fresh context; it reports the build equal
  to its own extraction, and different, with the region, for a copy with one planted change. Intent: L1-style limits
  ("every frame from 721 px up equals the baseline") become one call.
- **W5. Ports and the doctor.** A foreign server bound to all addresses on the CLI's port is not detected: launch
  prints LAUNCH PASS beside it and cleanup then fails (round 4 grader B, P14); the doctor names a stale map without the
  command that fixes it (grader A, P10). Outcome: launch, drive and compare refuse a port any other process holds on any
  address; cleanup succeeds after a refused or failed launch; every doctor failure prints the exact command that fixes
  it. Intent: no false LAUNCH PASS, and no dead end.
- **W6. Evidence an agent can read.** Feature ids are found only by reading the map file; each frame's JSON is about
  1,100 lines; file names omit the state; the skill names the CLI by the r03 worktree's absolute path (P1 report items
  3, 6 and 7; grader B). Outcome: the CLI lists a page's features, states, switches and dependencies; each item has a
  short summary (feature, state, language, size, input, motion, transport, result, problems) beside its full record,
  and file names carry the state; the skill's commands work unchanged from any checkout of this repository; its port
  guidance matches what the CLI enforces. Intent: an agent spends its context on frames, not on parsing.
- **W7. Proven.** Outcome: following only the skill, you drive Activity's long-name case in Arabic at 320 and Reports'
  export dialog in English at 390 with touch, and compare the build with its own extraction over Daily's states at the
  three designed sizes; unit tests for the parts that need no browser (dependencies, element discovery with a planted
  dialog, the recipe drift both ways, the wildcard port) run in the fast ladder; `node scripts/verify.mjs fast` passes
  on your committed, clean tree. Intent: the corrections are shown, not claimed.

## Scope

You may change `.agents/skills/verify-fitway/`, `.claude/skills/verify-fitway/`, `scripts/verify.mjs` and the `scripts`
block of package.json; commit once when done. Everything else is read-only, including the concept folder and the rest
of the build worktree. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the CLI's help; the build's recipe
file's path in your evidence; the files you changed; the commit SHA; anything you could not do.
