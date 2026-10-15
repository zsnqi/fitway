<!-- brief-format: v1 role: codex -->
# Codex brief: grade one arm of vf-runner by running these checks (owner-design-exploration-r04, vf-runner-grade-sol)

- **Worktree:** `D:/fitway-temp/owner-r04-vf-runner-grade-sol/wt`, branch `grade-vf-runner-sol`, HEAD `78a1c34e`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64, 66 and 67 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-vf-runner.md`, whole: the brief of the round you grade, which names that round's own worktree, base and V1-V3; your contract is G1-G7 below;
  - `.agents/skills/verify-fitway/SKILL.md` at your HEAD, the CLI's guide.

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

- You run in the workspace-write sandbox with automatic approval review. Anything that starts child processes with
  piped output (pnpm, Playwright, Node scripts that run git) fails inside it: request escalation for it from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- **This round grades; it fixes nothing.** Keep scripts, plants and logs in `D:/fitway-temp/owner-r04-vf-runner-grade-sol/`.
- **The CLI you grade** is the one at your HEAD: `node D:/fitway-temp/owner-r04-vf-runner-grade-sol/wt/.agents/skills/verify-fitway/cli.mjs`.
  The old CLI for comparison is the same file at `c699d3fb`, taken with `git archive` outside every git tree. Real
  compares use ports 3186-3187 only; never stop a process you did not start; 3174 and 3180 serve the user's preview.
  The concept is the build branch's folder `design-research/owner-composition-exploration-r04/directions/eclipse/`
  at `c2fe4661`, taken with `git archive` and extracted outside every git tree.
- **Shared test ports.** `cli.test.mjs` binds 3176-3177 (F183), which another round may hold: run only the tests a
  check needs, by name; a failure that names 3176 or 3177 as held is that clash, not the result: rerun it once the
  pair is free and report both runs. Another grading of the same brief runs beside you on 3188-3189.

## Goal

The coordinator knows, row by row, whether this arm's delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. An arrival captured, other conditions.** Outcome: Reports `arrive=500` with `state=loading`, English,
  tablet, 4 workers, three self compares with the result's CLI: EQUAL each time; crop the before frame (it shows the
  skeleton) and the after frame (it shows the loaded page) of one run. Intent: an arrival is checked like any state.
- **G2. A payload that never arrives.** Outcome: on a temp copy of the concept whose loaded phase never comes (its
  payload withheld), the `arrive=500` item is a problem or DIFFERENT, never EQUAL with a loading frame taken as
  arrived. Intent: a frame taken before the change is never accepted as the change.
- **G3. The static proof still guards.** Outcome: with the runner's after-capture proof removed for a state that does
  not change with time (planted in a temp copy of the result's CLI, or in the worktree and restored), at least one
  test of `cli.test.mjs` fails on that proof. Intent: static states keep their second proof.
- **G4. The full self compare unchanged.** Outcome: a full self compare (every page, `--feature all`, Arabic and
  English, desktop, tablet and phone, reduced motion, 4 workers) with the result's CLI and with `c699d3fb`'s CLI:
  the same item list and the same verdict for every item (give both counts and the list of non-EQUAL items). Intent:
  only the time-changing state's capture moved.
- **G5. Test roots apart.** Outcome: `compare-speed.test.mjs` and `compare-parallel.test.mjs` run at once from two
  separate checkouts of the result (your worktree and a second detached one you add under your temp folder): all pass,
  and no scratch or cache folder of either run remains after. Intent: two worktrees never collide.
- **G6. The whole guide held.** Outcome: an invented option `--no-such-flag` planted after "Evidence and advanced
  tools" in `SKILL.md`, outside any tool's argument list, fails the guide test; a real ui-forensics argument planted
  in the same place passes it. Intent: no reader meets an option the CLI lacks.
- **G7. Limits.** Outcome: `git diff --stat c699d3fb HEAD` lists only files under `.agents/skills/verify-fitway/`;
  no test present at `c699d3fb` is removed, skipped or made conditional; the suite's test count is at least the
  base's. Intent: nothing was weakened to pass.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change tracked files only temporarily, for a plant, and restore each before the next; everything you keep goes
in `D:/fitway-temp/owner-r04-vf-runner-grade-sol/`. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G7 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; each compare's load; anything you could not run.
