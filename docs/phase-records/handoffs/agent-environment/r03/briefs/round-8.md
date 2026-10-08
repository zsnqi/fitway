<!-- brief-format: v1 role: codex -->
# Codex brief: the gardener's pass is safe to schedule (agent-environment-r03, round 8)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-gardener`, branch `agent-environment-r03-gardener`, HEAD `d05b9ec9`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 19.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/DECISIONS.md:86-96` and `:127-140`: what the gardener is, and what
    this round takes before the weekly schedule starts.
  - `docs/phase-records/handoffs/agent-environment/codex-rounds.md:311-338`: how round 7's gardener was graded.
  - `.agents/skills/gardener/SKILL.md` and the scripts beside it: round 7's gardener, which this round corrects.

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
- Another Codex round works in D:/Projects/fitway-worktrees/agent-environment-r03 on verify-fitway at the same time,
  on ports 3176-3177; leave that worktree, its ports and its files alone.
- Never run a cleanup script on real folders of `D:/fitway-temp`; test it on folders you create under your run folder.

## Goal

A weekly gardener pass can run unattended: what it proposes is safe for the user to run, what it judges merged is
judged against the trunk, every check it claims to run runs, and the pass itself deletes nothing.

## Causes and required outcomes

Round 7 delivered the gardener (`a36e97fe`); its grading and two cold agents found where it falls short
(codex-rounds.md:319-335). The user's decision for the weekly pass: it deletes nothing (DECISIONS item 19).

- **H1. The cleanup script deletes.** `cleanup.mjs:56-61` passes `rmdir /s /q "<path>"` through `execFileSync`, Node
  escapes the inner quotes, and every deletion fails ("The specified path is invalid"); no test ran the command.
  Outcome: the generated script, run on folders it lists, removes each one, including a folder named "evidence." and
  a path longer than 260 characters; it reports a folder it cannot remove (a locked file) and continues; it still
  removes nothing outside its temp root, no worktree with uncommitted changes, and nothing an open record names. A
  test executes the real deletion on disposable folders. Intent: the list the user approves is what leaves the
  machine, and a quoting fault like round 7's fails a test.
- **H2. Only what can safely go is proposed.** Folders hours old and a folder the rolling report cites are proposed;
  a top-level folder "evidence." is never proposed because the reference search matches the prose word
  (`facts.mjs:40-60`); the temp root is fixed (`survey.mjs:30`). Outcome: a folder is proposed only when it is older
  than a minimum age the skill names and no open record and no rolling report cites it by path; a word in prose that
  equals a folder's name is not a citation; the temp root is a survey option, `D:/fitway-temp` by default. Intent:
  the user reviews a list with nothing on it that should stay.
- **H3. Merged means merged into the trunk.** `survey.mjs:146-170` judges against local `main`, which on this machine
  is hundreds of commits behind `origin/main`, so merged branches are missed. Outcome: branches and worktrees are
  judged merged against `origin/main` as the clone last fetched it; the survey still does not fetch; the report names
  the ref and commit it judged against. Intent: a stale local `main` neither hides nor invents sediment.
- **H4. Every check runs.** `survey.mjs:444-457` reports a `check:*` script it does not know as "unknown check
  command" and never runs it, so a new failing check passes unseen. Outcome: every `check:*` script of package.json
  runs, including one added after this round, with its exit code and output in the report; a check that changes a
  worktree's status is reported by name as having done so. Intent: a new check is covered the day it lands.
- **H5. The local date.** `survey.mjs:394` takes the UTC day, so a pass at 01:00 local time reports yesterday.
  Outcome: the report's date is the machine's local date. Intent: the ledger's date is the day the user saw.
- **H6. Any checkout.** `SKILL.md:32-39` fixes `$root` to this worktree's path. Outcome: the skill's commands, copied
  unchanged, work from any checkout of this repository, and the survey names the checkout it surveyed. Intent: the
  scheduled pass runs in its own worktree from the same skill.
- **H7. Landed briefs.** `facts.mjs:355-375` checks every brief a resume file's running or next-steps section names,
  and brief:check fails for good on a brief whose round has landed, so `clean` is out of reach. Outcome: a brief whose
  round `docs/phase-records/handoffs/agent-environment/codex-rounds.md` records with a result is left out of those
  checks; one without a recorded result is still checked. Intent: only briefs that may still launch are checked.
- **H8. Unmeasured is not dirty.** `survey.json` shows `status: null, clean: false` for worktrees the survey never
  measured. Outcome: a worktree the survey did not measure says so, with the reason. Intent: a reader never takes a
  missing measurement for uncommitted work.
- **H9. The pass deletes nothing.** `SKILL.md:60-66` lets a pass delete merged branches and prune registrations, where
  the user's decision is that the weekly pass deletes nothing (DECISIONS item 19). Outcome: the skill's pass deletes
  no branch, worktree, registration or folder; it proposes each in its report with the command for the user or the
  coordinator; two passes on the same state still reach the same outcome. Intent: the scheduled run cannot remove
  anything, whatever it finds.
- **H10. Proven.** Outcome: the tests for H1-H8 that need no machine state, and H1's real deletion on disposable
  folders, run in the fast ladder's unit-test step as it is (scripts/verify.mjs and package.json unchanged); one pass
  run from the skill on this machine ends with its report; `node scripts/verify.mjs fast` passes on your committed,
  clean tree. Intent: the corrections are shown, not claimed.

## Scope

You may change `.agents/skills/gardener/` and `.claude/skills/gardener/`; commit once when done. The rolling report
`.agents/skills/gardener/REPORT.md` may carry your proof pass. Everything else is read-only, including the ledger.
Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the proof pass's survey folder and
outcome; the files you changed; the commit SHA; anything you could not do.
