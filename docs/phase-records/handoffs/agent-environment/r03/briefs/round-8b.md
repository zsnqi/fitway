<!-- brief-format: v1 role: codex -->
# Codex brief: the gardener's weekly pass yields a usable proposal (agent-environment-r03, round 8b)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-gardener`, branch `agent-environment-r03-gardener`, HEAD `8a47897b`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 19.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/codex-rounds.md:340-367`: how round 8 was graded, and what it missed.
  - `docs/WORKFLOW.md` §"Active ledger and closed history" (its last paragraph): how the weekly pass runs.
  - `.agents/skills/gardener/SKILL.md` and the scripts beside it: round 8's gardener, which this round repairs.

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
- Never run a cleanup script on real folders of `D:/fitway-temp`; test it on folders you create under your run folder.
- The fast ladder's contract tests bind ports 3176-3177, which a grader may hold for a while: if they are taken when
  you run the ladder, wait with Monitor until both are free (up to 90 minutes) instead of reporting a failure; never
  stop a process you did not start. (round 8: H10 failed on a held port)

## Goal

A weekly pass, run unattended, ends with a cleanup proposal the user can review and run, and sees every worktree and
folder it should, without proposing its own.

## Causes and required outcomes

Round 8 (`3003f7ff`) was graded 9 of 11 (codex-rounds.md:340-367); this round repairs what failed and what the
graders and two cold passes found.

- **R1. CI fails on a short temp path.** `regressions.test.ts:298` compares the checkout as text, and on the CI runner
  TEMP is the 8.3 path `RUNNER~1`. Outcome: the round's tests pass in CI on Windows whatever form TEMP takes.
  Intent: a test checks path identity, not spelling.
- **R2. The final proposal is unreachable.** `SKILL.md:109-111` asks for a final survey after the rolling report; the
  report must name its proposals, a name in the report protects them, and the report's new date fails
  `check:repository` until the coordinator writes the ledger, so the final survey is blocked with no folders.
  Outcome: a pass that ends with its rolling report gets a cleanup script listing exactly the folders the report
  proposes; the report's proposal list and its expected mismatch with the ledger neither protect a folder nor block
  collection; evidence the report cites (its survey folders) stays protected. Intent: the user gets a script that
  matches the list they read.
- **R3. The pass proposes its own worktree.** The survey proposes `git worktree remove` for the weekly pass's worktree
  (`docs/WORKFLOW.md`, its last paragraph of §"Active ledger and closed history"). Outcome: the checkout a survey runs
  from and the weekly pass's worktree are never proposed. Intent: the schedule cannot be asked to remove itself.
- **R4. Citations at the end of a sentence.** `facts.mjs:39` and below miss a path followed by `.`, `:` or `**`, and a
  path written relative to the drive (fitway-temp/ followed by the folder) or in Git Bash form (/d/fitway-temp/ followed
  by the folder). Outcome: each of those counts as a citation of that folder.
  Intent: a folder a record names in ordinary prose is never proposed.
- **R5. Unmerged worktrees are invisible.** `survey.mjs:216` leaves every worktree not merged into `origin/main`
  unmeasured, so old evaluation worktrees are never seen. Outcome: every registered worktree's status is measured,
  or the report says why it could not be; an unmerged worktree no open record names, older than the minimum age, is
  listed for the coordinator with its branch, last commit date and status, and never proposed for removal. Intent:
  sediment that was never merged is still seen.
- **R6. A finished round blocks the pass.** A brief whose round has finished but is not yet recorded fails
  `brief:check` (its worktree moved past the named HEAD) and blocks the pass. Outcome: such a brief is reported as
  waiting for its record and does not block; a brief that has not launched is still checked. Intent: a Friday after a
  round is not blocked by the coordinator's grading queue alone.
- **R7. The survey's own side effects.** `pass.ps1:11-12` points TEMP at the inventoried root, and a stale
  node_modules makes pnpm's pre-run dependency check attempt an install before each check. Outcome: the pass's own
  temporary files never appear among the folders it inventories; the survey never installs or removes dependencies,
  and a dependency mismatch is reported as a collection blocker that names it. Intent: a survey changes nothing it
  measures.
- **R8. A report that reads plainly.** The minimum age has no line in the report, the unreferenced count includes
  folders too young to propose, and the console prints "SURVEY PASS" for a blocked outcome. Outcome: the report
  names the minimum age and counts proposed folders separately from unreferenced ones; the console line states the
  outcome first. Intent: nobody reads a blocked pass as clean.
- **R9. Proven.** Outcome: tests for R2-R7 that need no machine state, and R2's final script on disposable folders,
  run in the fast ladder's unit-test step as it is; one pass from the skill on this machine ends with a final cleanup
  script whose list equals its report's; `node scripts/verify.mjs fast` passes on your committed, clean tree.
  Intent: the repairs are shown, not claimed.

## Scope

You may change `.agents/skills/gardener/` and `.claude/skills/gardener/`; commit once when done. Everything else is
read-only, including the ledger and docs/WORKFLOW.md. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the proof pass's survey folders and
outcome; the files you changed; the commit SHA; anything you could not do.
