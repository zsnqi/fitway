<!-- brief-format: v1 role: codex -->
# Codex brief: stand-in steps reach the ladder only from its tests (owner-design-exploration-r04, ladder-seam)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-ladder-seam`, branch `owner-r04-ladder-seam`, HEAD `c87bf5b3`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 67 and 70.
- **Read first, only these:**
  - `scripts/verify.mjs`, whole;
  - `scripts/verify.test.ts`, whole;
  - `.agents/skills/gardener/facts.mjs` lines 400-440 (`parseFastSteps` reads the ladder's source text);
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F246 and F250.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch: every test you add passes there, with no file outside the repository.
- **Your temp folder** is `D:/fitway-temp/owner-r04-ladder-seam/`. Start no preview, compare or Codex process of
  your own. If a verify-fitway test fails in the fast ladder, rerun that file alone once and report both runs; if the
  two Git Bash tests in `codex-round.test.ts` fail with `sed` or `dirname` not found, that is F237, fixed in another
  round: report it and go on. The coordinator's CI run on your commit decides L2.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.

## Goal

A real run of the ladder always runs its own steps, so a passing `verify.mjs` in a round's events means the ladder ran.

## Causes and required outcomes

- **V1. The test seam reaches a real run (F250).**
  - **Cause (measured).** `configuredSteps` (`scripts/verify.mjs`, from line 361) reads `FITWAY_VERIFY_TEST_STEPS` in
    the entry point, and `main` uses `configuredSteps() ?? fastSteps()`, so with it set to `[]`
    `node scripts/verify.mjs fast` passes in 0.23 s with no step, exit 0.
  - **Outcome.** `node scripts/verify.mjs fast`, `phase --phase <name>` and `full`, and `pnpm verify:fast`, run exactly
    their own steps in their own order whatever the environment holds: no environment variable, argument or file a
    real run can carry replaces, removes or adds a step, and the entry point keeps no test-injection path. A test shows
    it by launching the committed entry point with `FITWAY_VERIFY_TEST_STEPS` set to `[]`, to two different stand-in
    lists and to malformed JSON, without doing the real steps' work (for example with a stand-in `pnpm` first on `PATH`
    that records the arguments and environment it is called with), checking for `fast`, for `phase --phase <name>`
    and for `full` that each fast step was called in order with its arguments and the Unit tests step with
    `UNIT_TEST_ENV`, then each mode's own steps. The two tests
    of `scripts/verify.test.ts` keep every check they make and reach their stand-in steps only by a route a real run
    cannot take (such as importing an exported runner from the test, or a driver file the test writes).
  - **Intent.** The ladder's output and exit code always come from its real steps.

## Limits the result keeps

- **L0. New cases prove the repair.** The new test fails on the HEAD's `verify.mjs` at an assertion on which steps
  ran; report its failing output.
- **L1. Today's behaviour elsewhere.** F246's lines (clock times, a failed step's duration and exit code, the first
  mutating step named at once) and the final `FAILED_VALIDATION:` line stay as at the HEAD; the fast, phase and full
  step lists, order, arguments, commands and environment are unchanged (compare the materialized step objects with the
  HEAD's); `parseFastSteps` run on the committed
  `scripts/verify.mjs` returns the same eight steps with the same arguments as on the HEAD's (report both); every
  existing test keeps its assertions and still runs.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/verify.mjs` (must change), `scripts/verify.test.ts` (must change) and add a test helper beside
it under `scripts/`; commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot
be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the steps the new test
saw called; the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
