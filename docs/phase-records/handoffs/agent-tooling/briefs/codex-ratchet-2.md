<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: the ratchet stops long functions, empty blocks, lint warnings and lost tests, and slow tests stop failing by timeout (agent-tooling-r01, ratchet-2)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-ratchet-2`, branch `tooling-ratchet-2`, HEAD `f5927a26`
- **Milestone:** `agent-tooling-r01`. Decisions: items 6, 10, 12 and 13 of
  `D:/Projects/fitway-worktrees/records-ratchet-2/docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `.agents/skills/gardener/code-health.mjs`, `MEASURE_DEFINITIONS` (lines 11-42), `IMPORT_EXTENSIONS` (line 43) and
    `scanScope` (from line 325): the measures and how the gardener reports them;
  - `.agents/skills/gardener/code-health-source.mjs`, whole (409 lines): the scanner, its long-function measure and
    its `describe` rule (DECISIONS item 12);
  - `scripts/agent-environment/code-health-baseline.mjs`, whole (375 lines), and
    `scripts/agent-environment/check-code-health.mjs`, whole: the ratchet, its exception lines and its baseline;
  - `biome.json` §`linter`, `package.json` §`scripts` line 27 (`check`), and `vitest.config.ts`, whole;
  - `D:/fitway-temp/review-recurrence/REPORT.md` §"C-3. Tests that do not prove", §"C-5. Limits and growth",
    §"C-7. Silent skip and swallowed failure" and §"C-8. Test timeouts": the measured causes;
  - `D:/Projects/fitway-worktrees/records-ratchet-2/docs/phase-records/handoffs/agent-environment/findings.tsv` rows
    F261, F281, F282 and F284.

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
  starts child processes with piped output (pnpm, Vitest, Biome, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch, no Codex and no network: every test you add passes there, with no file outside the
  repository.
- **Your temp folder** is `D:/fitway-temp/tooling-ratchet-2/codex/`. Start no Codex process and never run
  `codex:round` or `main:advance`. Link no `node_modules` between folders; this worktree has its own install. A base
  copy for L0 is a `git archive f5927a26` into your temp folder with its own `pnpm install --frozen-lockfile --offline`.
- **Commit once, plainly, after everything else.** `git add` every new file before you regenerate
  `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` (the map counts tracked tests only, F283); then one
  `git commit -m "<message>"`; never `git reset`, amend or rewrite commits; run the fast ladder after that commit,
  never only before it. If the launcher refuses your report, report the refusal as it stands instead of re-committing.
- **Your own report is checked by the launcher at this HEAD**: a PASS row counts only when its command ran in this
  run after your last edit inside the worktree and printed the line the row quotes; name the SHA `git rev-parse
  HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs, and no second path** (DECISIONS item 6): the
  new measures come from the scanner `code-health-source.mjs` already runs or from Biome, never from a second
  tokenizer; a test file is recognised the way the `describe` rule recognises it; exceptions use the ratchet's one
  `code-health-exception:` line form.
- **The ratchet holds you too.** `pnpm check:code-health` runs in the ladder; regenerate the baseline with
  `pnpm code-health:baseline` in the same commit. A giant file cannot grow; room in one is made by moving code out of
  it, never by deleting blank lines, comments or explanations (DECISIONS item 10).
- **Files you must not change:** `scripts/agent-environment/codex-round.mjs`, `scripts/agent-environment/check-brief.mjs`,
  `scripts/check-agent-context.mjs`, `scripts/verify-repository.mjs`, `.agents/skills/gardener/survey.mjs`,
  `.agents/skills/verify-fitway/runner.mjs` and `.agents/skills/verify-fitway/compare.mjs` (another round is splitting
  them). If an outcome needs one of them, stop and report.

## Goal

Four kinds of finding that Sol's reviews and grades keep returning are stopped by the fast ladder before any review:
long functions growing in production code, new empty blocks, new lint warnings and skipped or unused-expression
code, and tests deleted or emptied; and the tooling tests stop failing by timeout on a loaded machine while a real
hang still fails. Every count the ratchet held before stays as it was.

## Causes and required outcomes

- **R1. Long functions grow unseen in production code (REPORT §C-5).**
  - **Cause (measured).** The ratchet counts how many functions in a file are over 80 lines, not how long they are, so
    a long function that grows keeps the count: over the report's 18 reviewed rounds, the summed length of a non-test
    file's long functions rose in 11 files, 5 of them with a review finding of growth out of proportion
    (`code-health-source.mjs` 84 to 97, `check-concept-css.mjs` 277 to 312, `codex-round.mjs` 421 to 476).
  - **Outcome.** A new baseline measure `longFunctionLines`: for each scanned file that is not a test file, the sum of
    the line lengths of its long-function hits as the long-function measure reports them (each hit's own length, so a
    long function nested in a long function counts in both); a test file has none. The ratchet treats it as it treats
    the debt measures at this HEAD: `pnpm check:code-health` fails when a file's value differs from the committed
    baseline, naming the file and both values; `pnpm code-health:baseline` refuses to write a rise and writes a fall;
    a rise is allowed only by a `code-health-exception:` line naming `longFunctionLines`, placed as the ratchet places
    a per-file measure's exception at this HEAD. Each holds on its own case: a new non-test file with one 90-line
    function (0 to 90, refused); a long function lengthened by one line (refused); a function shortened to 80 lines
    (a fall, written); a 120-line function holding a 90-line function (210); a test file with a 300-line `it`
    callback (no value).
  - **Intent.** A long function cannot get longer without someone deciding it should.

- **R2. Empty blocks hide skipped work (REPORT §C-7).**
  - **Cause (measured).** Nothing counts empty blocks; at this HEAD Biome's `noEmptyBlockStatements` (group `suspicious`) reports
    37 of them in the ratchet's roots (Biome's `lint` command with `--only` naming that rule, `--max-diagnostics=none`, on
    `scripts`, `.agents/skills`, `apps` and `packages`), and the report's replay found the rule rising in one reviewed round, at
    the fallback import a review blocked.
  - **Outcome.** A new baseline measure `emptyBlocks`: per scanned file, the number of hits of Biome's
    `noEmptyBlockStatements` (group `suspicious`) (by running Biome or by a scan in the scanner giving the same hits). On the
    tracked files of this HEAD it gives exactly Biome's 37 hits (file and line); on cases, it agrees with Biome on each
    form the rule reports or allows: an empty function body, an empty arrow body, an empty `catch`, `if`, `else`,
    loop, `switch` and class static block, an empty object literal (not a block), and a block holding only a comment.
    The ratchet treats it as R1's measure (cannot rise without an exception line; a fall is written).
  - **Intent.** A new empty block is a decision someone writes down, not something that slips in.

- **R3. Lint warnings and three zero-hit rules (REPORT §C-3, §C-6).**
  - **Cause (measured).** `package.json` line 27 runs `biome check .`, which exits 0 on warnings, so a new unused
    import, variable or parameter passes the ladder; `noSkippedTests` (group `suspicious`), `noUnusedExpressions` (group `suspicious`)
    and `noNonNullAssertion` (group `style`) have 0 hits in the ratchet's roots at this HEAD (measured with Biome's `lint` command and `--only`) but are not errors.
  - **Outcome.** The `check` script is `biome check --error-on-warnings .`, and `biome.json` sets those three rules to
    `error`; no nursery rule is added. At your commit `pnpm check` passes. Each of these, planted alone in a scratch
    copy of your committed tree (`git archive` of your commit into your temp folder, with its own offline install), makes `pnpm check` exit non-zero: an unused import in a
    `.ts` file, an unused variable, an `it.skip(...)`, a bare expression statement `a === b;`, and a non-null
    assertion `value!.x`. Report each exit code and the rule Biome names.
  - **Intent.** The ladder fails on what Biome already knows is wrong, and adds no rule whose meaning may change.

- **R4. Deleted or emptied tests pass the ladder (REPORT §C-3).**
  - **Cause (measured).** Nothing holds the number of test cases or assertions: a round can delete or empty a test
    and every gate still passes (the report's `.skip` reading and the emptied cases its grades found).
  - **Outcome.** Two floor measures over test files (named as the `describe` rule recognises them): `testCases`, the
    calls of `it` or `test` imported from `"vitest"` or `"node:test"` (each call once, with `.each(...)(...)`,
    `.only`, `.concurrent`, `.sequential`, `.fails`, `.skipIf(...)(...)` and `.runIf(...)(...)` counted as one case;
    `.skip`, `.todo`, `.skipIf(true)(...)` and `.runIf(false)(...)` with a literal condition not counted), and `expectCalls`, the calls of `expect` imported from `"vitest"` (with
    `expect.soft(...)` and `expect.poll(...)`; `expect.assertions` and `expect.hasAssertions` not counted). They are
    floors: for each directory, the totals over the test files directly in it are compared. `pnpm check:code-health`
    fails when a directory's total of either differs from the committed baseline, naming the directory, the measure
    and both totals; `pnpm code-health:baseline` writes a rise and refuses a fall unless a test file in that directory
    holds a `code-health-exception:` line naming the measure (with its `until` and `reason`). So: cases moved between
    files of one directory, and a file renamed within its directory, change nothing; deleting a case, turning an `it`
    into `it.skip`, or deleting an `expect` is refused; a file moved to another directory is a fall in its old
    directory and needs that exception line. Each holds on its own case, with a binding imported under an alias and a
    local `it` that shadows the import (not counted), and an `it.runIf(false)(...)` (not counted).
  - **Intent.** Tests can be reorganised freely within a directory, and a test or an assertion leaves a directory only
    by a written decision.

- **R5. Tooling tests fail by timeout under load (F261, F281, F282).**
  - **Cause (measured).** `vitest.config.ts` sets `testTimeout: 20000`; durations recorded under load were 20,036 and
    20,063 ms (F261), 25 to 40 s (F281) and 22,038 ms in CI (F282), each passing alone.
  - **Outcome.** `vitest.config.ts` changes its test timeout only: `testTimeout` is at least 60,000 and at most
    90,000 ms, so the longest recorded duration (40 s) has at least half again as much room, and a test that never
    settles still fails by timeout within 90 s. Prove the second part with a scratch test file under your temp folder
    holding `it("hangs", () => new Promise(() => {}))`, run with the repository's config (`pnpm exec vitest run
    --config <the worktree's vitest.config.ts> --root <your temp folder> <file>`), and report its failure line and
    duration. A per-test timeout already written in a test file stays as it is.
  - **Intent.** Load decides no test's result, and a real hang is still caught within a bound.

- **R6. One extension list (F284).** Outcome: `IMPORT_EXTENSIONS` in `.agents/skills/gardener/code-health.mjs` is built
  from the scanner's script extensions plus `.css`, with the same members as at this HEAD. Intent: one place lists the
  script extensions.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (R1, R2, R4 or R6), fails on this
  HEAD's production code at an assertion on that outcome's behaviour (not at a missing helper, import or fixture),
  and passes unchanged on your result; the cases you commit are the ones you showed failing, and the fast ladder runs
  them. Every case R1, R2 and R4 list has one. Report each failing output.
- **L1. Today's behaviour elsewhere.** Every test at this HEAD still runs, none skipped, excluded or made conditional,
  and its body (setup, inputs, fixtures it reads, mocks and assertions) stays byte for byte; new cases go beside
  them. Every fixture file at this HEAD stays byte for byte. `pnpm check:code-health`, `pnpm code-health:baseline`
  and the gardener keep their arguments, outputs and exit codes except for the new measures' lines.
- **L2. The counts held before.** Against this HEAD's `docs/agent-context/CODE_HEALTH_BASELINE.json`, your baseline
  keeps every value of `giantFiles`, `duplication`, `typeEscapes`, `suppressions`, `repeatedWorkarounds` and
  `longFunctions`, and only adds the new measures' values; the files the measures scan stay those at this HEAD.
  Report the new measures' totals (`longFunctionLines` summed, `emptyBlocks` 37, `testCases`, `expectCalls`).
- **L3. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, run after your commit;
  `pnpm check:code-health` passes with no exception line added anywhere; `git status --short` is empty after your
  commit and after the ladder.
- **L4. Cost.** `pnpm check:code-health` run three times at this HEAD (the base copy) and three times on your result,
  alternating; your result's median is at most 1.5 times the base's. Report every time and both medians.

## Scope

You may change `.agents/skills/gardener/code-health.mjs` (must change), `.agents/skills/gardener/code-health-source.mjs`,
the other `.agents/skills/gardener/code-health-*.mjs` modules, `scripts/agent-environment/check-code-health.mjs`,
`scripts/agent-environment/code-health-baseline.mjs` (must change), the tests beside them and new fixtures beside
those tests, `biome.json` (the three rules only; must change), `package.json` (the `check` script only; must change),
`vitest.config.ts` (its test timeout only; must change), and regenerate `docs/agent-context/CODE_HEALTH_BASELINE.json`
(must change) and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`; commit once when done. Everything else is
read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others,
then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of R1-R6 and L0-L4. A PASS command must match a command started
after the last edit inside the worktree, and its output must be one line the command printed. Outside the block, also
list the files you changed, the totals L2 asks for, the R3 exit codes, the R5 failure line, the L4 times, and anything
you could not do.
