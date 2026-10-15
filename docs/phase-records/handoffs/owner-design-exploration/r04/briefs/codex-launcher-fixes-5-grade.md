<!-- brief-format: v1 role: codex -->
# Codex brief: grade launcher-fixes-5 by running these checks (owner-design-exploration-r04, launcher-fixes-5-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-launcher-fixes-5-grade/wt`, branch `grade-launcher-fixes-5`, HEAD `4964b95d`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64, 67 and 72 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-launcher-fixes-5.md`, whole: the brief of the round you grade, which names that round's own worktree, base and P1-P5; your contract is G1-G9 below;
  - `docs/agent-context/briefs/REVIEW.md` at your HEAD, §"Prompt".

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
  piped output (pnpm, Vitest, Node scripts that run git) fails inside it: request escalation for it from the first
  attempt, with a one-line justification. (DECISIONS item 7)
- **This round grades; it fixes nothing.** Keep scripts, plants and logs in
  `D:/fitway-temp/owner-r04-launcher-fixes-5-grade/`. The base launcher is the same files at `5b81b3b7`, taken with
  `git archive` outside every git tree. Run the launcher's review step and reading parser on copies only; start no
  real Codex round. Two other rounds run on this machine.

## Goal

The coordinator knows, row by row, whether the delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. Wrapped readings.** Outcome: a copy of `D:/fitway-temp/owner-r04-launcher-fixes-4-grade/g1-wrapped.md` with
  reading 3's second line indented two spaces reads as five; with reading 5 also wrapped at column 0 after "Gap:"
  it reads as five; with a blank line between reading 3's two lines it is refused; `1. V1 literal reading;` followed
  at column 0 by `V2 risk.` is refused. Intent: layout never decides, and a continuation never completes a non-reading.
- **G2. Labels, not keywords.** Outcome: each refused as an answer of one reading: `1. V1 literal reading; V2 risk;
  V3 change.`; `1. V1 reading: as written. The risk is a gap. Change it.`; `1. V1. Literal reading: x. What goes
  wrong:. Change: z.`; `1. V1. Literal reading: x. Literal reading: y. Change: z.`. Each read as one reading:
  `1. V1. Change: z. Literal reading: x. What goes wrong: y.` and `1. **V1.** **Literal reading** — x. **What goes
  wrong** — y. **Change** — z.`. Intent: a reading is known by its parts.
- **G3. Nothing lost.** Outcome: every fixture under `scripts/agent-environment/fixtures/codex-round-reviews/` at
  `5b81b3b7`, and every `last.md` under `D:/fitway-temp/brief-review/` that the base parser reads, reads to the same
  count and IDs with the HEAD's parser (list each file and both results); every inline answer the base test file
  reads is unchanged at HEAD or listed with its change and why. Intent: no answer that read before is refused now.
- **G4. The Git Bash tests in the sandbox.** Outcome: in your own sandbox, `pnpm exec vitest run
  scripts/agent-environment/codex-round.test.ts -t "Git Bash"` passes at HEAD and fails at the base archive with
  `sed` or `dirname` not found; the two tests run every launcher form they run at the base (list them). Intent: a
  round's local ladder fails only for a real fault.
- **G5. False reports resumed.** Outcome: with the launcher's own test stand-ins, each of these is resumed with a
  message naming the failed claim: a report naming commit `0123456789ab` (no such object); one naming the real HEAD
  with an untracked file in the worktree; one claiming the ladder limit PASS where `verify.mjs fast` ran only before
  the last `git commit`; one marking the ladder limit `PASS (fast ladder)` without naming verify.mjs, with no ladder
  run; a `STOPPED:` report marking the ladder PASS with no ladder in its events; one naming the launch HEAD after a
  `git commit` that exited 1. Intent: a claim that did not happen is never accepted.
- **G6. True reports accepted.** Outcome: a report-only brief's report naming no commit and no ladder is accepted; a
  report naming its commit by a 12-character SHA equal to HEAD, with a clean tree and a ladder after the commit, is
  accepted with no resume. Intent: the check refuses nothing true.
- **G7. The timeline.** Outcome: after a stand-in launch plus one automatic resume, `turns.jsonl` holds two lines, the
  first with stop reason "no report", each with start before end, a duration equal to their difference within 50 ms
  and HEAD as `git rev-parse HEAD` gave at that turn's end; the turn's stderr file holds a planted stderr line, which
  the console still shows. Intent: a round reads from its folder alone.
- **G8. Limits.** Outcome: `git diff --stat 5b81b3b7 HEAD` lists only the files the round's Scope names, and
  `REVIEW.md` changed only inside §"Prompt"; no test present at `5b81b3b7` is removed, skipped or made conditional,
  none lost an assertion line, and no existing assertion's predicate or expected value changed (list each
  pre-existing test or helper whose body changed, with the change, including `expectedReviewBlocks`); each test
  file's count is at least the base's; each new P1, P2, P4 and P5 case fails on the base's production code at its own
  assertion. Intent: nothing was weakened to pass.
- **G9. Report against commands.** Outcome: the result's commit exists and is your HEAD; the round's run folder
  (`D:/fitway-temp/codex-round-cbeae1b0-f192-467a-8c3a-d410e7c09a34/`) records the `git commit` and a
  `node scripts/verify.mjs fast` run after it, with their exit statuses quoted from the events. Intent: the report
  rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change tracked files only temporarily, for a plant, and restore each before the next; everything you keep goes
in `D:/fitway-temp/owner-r04-launcher-fixes-5-grade/`. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G9 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
