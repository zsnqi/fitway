<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: CI's four quick fixes (agent-tooling-r01, round ci-speed)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-ci-speed`, branch `tooling-ci-speed`, HEAD `684342b1`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/decisions/025-040.md` item 27.
- **Read first, only these:** `lefthook.yml`: the hook jobs today; `scripts/agent-environment/check-staged-giant-files.mjs` and `scripts/agent-environment/check-code-health.mjs`: the two code-health checks; `scripts/agent-environment/codex-round.test.ts` lines 360-470: its fixture; `scripts/verify-repository.mjs`: where repository rules run; `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8.

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

- Codex has no Monitor: where the block above says to wait with one, poll the shell you started with `write_stdin`. (2026-11-04 retrospective)
- A shell output of `bash.exe ... CreateFileMapping ... Win32 error 5` comes from the harness, not your command: run the same command again once. (2026-11-04 retrospective)
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

CI catches the same faults with a shorter wait: the faults that need only seconds to find are found before a push, a commit that shrinks a file no longer leaves CI red, rules about the repository's own documents fail in seconds instead of after the unit suite, and the slowest test file no longer sets the length of the unit step.

## Causes and required outcomes

- **Q1.** From 2026-10-29 to 2026-11-06, 93 of 105 failed CI runs failed in Repository invariants (30), Code health ratchet (61) or Agent tooling map drift (2), steps that take about 10, 10 and 3 seconds (CI run 42227141365), because no hook runs them before a push: `lefthook.yml` lines 8-18 hold pre-commit jobs only. Outcome: `lefthook.yml` gains a `pre-push` section whose jobs run `pnpm check:repository`, `pnpm check:code-health` and `pnpm check:tooling-map`, and a push is refused when any of them fails, with that check's own failure line shown. Prove it with `pnpm exec lefthook run pre-push` in this worktree, never `lefthook install` (the hooks folder is shared by every worktree; the coordinator installs after the merge): once clean, where it passes, and once for each of the three checks with one planted failure in the working tree (for example a resume point made longer than 12288 bytes, or a measured file grown past its baseline), where it fails with that check's line; remove each plant and end with `git status --short` empty. On a quiet machine the clean run takes at most 60 seconds. Intent: the faults that made most CI runs red are found on the machine in under a minute, before the push starts a 28-minute run.
- **Q2.** `scripts/agent-environment/codex-round.test.ts` (4362 lines, 262 tests) took 1386.4 of the unit step's 1387.3 seconds in CI run 42227141365, while the suite's summed test time was 2314 seconds: Vitest runs one file's tests one after another, and every test builds two git repositories from nothing (`initialize` at lines 375-384, called twice by `fixture` from line 417). Outcome: its tests live in several test files in `scripts/agent-environment/`, with shared setup in a module that is not a test file, and the file named above no longer exists or holds only a part. The list of full test names (describe path and test name) across the new files equals the original file's list exactly, with the same skipped tests and the same platform conditions, and no assertion is removed or weakened. Run the original file at `684342b1` and the new files, each side three times, alternating, on a quiet machine, and report every run's per-file times with the median and range: the slowest new file's median is at most 30% of the original file's median, and the new files' summed median time is at most 110% of the original's. Intent: Vitest can run the parts side by side, so the unit step's length is no longer one file's length; sharing or copying a prepared fixture is allowed and welcome, but the test names and what each test checks stay the same.
- **Q3.** All 61 Code health ratchet failures in the same period were files whose measure fell below the committed baseline (for example `giantFiles baseline=1428 current=1423`), because the pre-commit job refuses only a rise (`scripts/agent-environment/check-staged-giant-files.mjs` lines 65-76, `change.direction === "rise"`, unless the baseline file itself is staged, when every file is compared) while `pnpm check:code-health` fails on any difference (`scripts/agent-environment/check-code-health.mjs` lines 23-28). Outcome: when a commit's staged files make a `giantFiles` or `giantDocuments` value fall below `docs/agent-context/CODE_HEALTH_BASELINE.json`, the pre-commit hook writes the lower value into that file and stages it, so `pnpm check:code-health` passes on the commit. Only the entries for files in that commit change; admissions, exceptions and every other entry stay byte-equal. The value comes from the staged content, never from unstaged edits in the working tree. A rise still refuses the commit as today. `pnpm check:code-health` itself is unchanged and still fails on a stale baseline. Intent: improvement is locked in at the commit that makes it, so the ratchet never lets a file grow back to an old value and never turns CI red because a file got smaller.
- **Q4.** Three unit tests check the repository's live documents rather than code, so a document change fails CI after the unit suite has run for about 25 minutes: `scripts/agent-environment/check-brief.test.ts` lines 1366-1374 (every file in `docs/phase-records/handoffs/owner-design-exploration/r04/briefs` must pass `codexScopeProblem`), `scripts/agent-environment/codex-round.test.ts` lines 2511-2523 (every file there must yield outcome IDs) and `.agents/skills/gardener/round27.test.ts` lines 366-419 (G4). The first two failed CI on `bb7444b6` when a builder brief was placed in that folder; G4 failed four runs. Outcome: `pnpm check:repository` runs these rules and the unit tests no longer read the live documents for them. The brief rule covers each file whose first line starts `<!-- brief-format: v1 role: codex` in `docs/phase-records/handoffs/owner-design-exploration/r04/briefs` and `docs/phase-records/handoffs/agent-tooling/briefs` (56 and 46 such files pass today, this brief included); it requires `codexScopeProblem` to return null and `outcomeIdsFromBrief` to find at least one ID, and its failure names the file and the reason. A brief of any other role in those folders is not checked by it. A missing folder fails and names the folder; an empty one passes and prints a count of 0. G4 keeps its rule and its result on this checkout, including how it treats an absent `D:/fitway-temp`. The unit tests keep their fixture proofs (the five historical briefs, lines 1347-1364) and gain planted fixtures showing each moved rule fails on a bad input and passes a good one. Intent: a document fault fails in the repository check, in seconds and with a named file, and a document change can no longer break a unit test.
- **L1.** Limits: no new dependency; no test file other than those Q2 and Q4 name loses a test; `pnpm check:repository`, `pnpm check:code-health`, `pnpm check:tooling-map` and `pnpm check:verification-map` pass on your commit with no raised baseline and no new exception; any tool map they require is regenerated by its own command; every new test runs in CI on Windows without Playwright Chromium or ui-forensics, from a checkout of the pushed commit alone.

Q3 and Q4 need new proofs: write them first, in `scripts/agent-environment/` beside the code they test (a temporary git repository for Q3; temporary folders of fixture briefs and fixture records for Q4), and report each one's failing run before the change and its passing run after. Q2's proof is the name list and the timed runs. Run the tests you wrote and the files Q2 and Q4 change; CI runs the whole ladder after the push, so do not run `pnpm verify:fast`.

## Scope

Before writing a reader, parser, runner, fixture or option list, find the one the repository already has and reuse or extend it. Your diff is reviewed against `docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before you start. (agent-tooling DECISIONS item 14)

You may change `lefthook.yml` (must change; its `pre-commit` and `pre-push` sections only), `scripts/agent-environment/**` (`codex-round.test.ts` must change), `.agents/skills/gardener/round27.test.ts`, `scripts/verify-repository.mjs` and its tests, `docs/agent-context/CODE_HEALTH_BASELINE.json` through `pnpm code-health:baseline` only, and generated tool maps; commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"Q1","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"Q2","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"Q3","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"Q4","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"L1","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
```

For `delivers: commit`, include exactly one `commit` line. Add one row for every outcome and limit ID the brief defines, with status PASS or FAIL. A PASS command must match a command started after the last edit inside the worktree, and its output must be one line the command printed. Outside the block, also list the files you changed, Q2's timing table, and anything you could not do.
