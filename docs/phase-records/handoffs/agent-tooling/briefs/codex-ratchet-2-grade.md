<!-- brief-format: v1 role: codex delivers: report -->
# Codex brief: grade ratchet-2 by running these checks (agent-tooling-r01, ratchet-2-grade)

- **Worktree:** `D:/fitway-temp/tooling-ratchet-2-grade/wt`, branch `grade-ratchet-2`, HEAD `50cecbc9`
- **Milestone:** `agent-tooling-r01`. Decisions: items 6, 10, 12 and 13 of
  `D:/Projects/fitway-worktrees/records-ratchet-2/docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/records-ratchet-2/docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet-2.md`,
    whole: the round's brief; your contract is G1-G14 below;
  - `D:/fitway-temp/tooling-ratchet-2/builder-1/BRIEF.md` and `D:/fitway-temp/tooling-ratchet-2/fixer-1/BRIEF.md`,
    whole: what the two follow-up commits were asked to add (giant-file split guidance, the pre-commit job, one test
    timeout, empty blocks outside test files, and the review fixes);
  - `D:/fitway-temp/tooling-ratchet-2-grade/inputs.md`, whole: the exact inputs of G1, G3 and G6;
  - `.agents/skills/gardener/code-health-source.mjs`, `.agents/skills/gardener/code-health.mjs`,
    `scripts/agent-environment/code-health-ratchet.mjs`, `scripts/agent-environment/code-health-baseline.mjs`,
    `scripts/agent-environment/check-staged-giant-files.mjs` and `lefthook.yml`, whole: what you drive.

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
  piped output (pnpm, Vitest, Biome, Node scripts that run git) fails inside it: request escalation for it from the
  first attempt, with a one-line justification. (DECISIONS item 7)
- **This round grades; it fixes nothing.** Keep scripts, drivers, scratch repositories and logs in
  `D:/fitway-temp/tooling-ratchet-2-grade/`. The base of the round is `f5927a26`; the round's commit is `78730971`;
  `da828661` merges the coordinator line (the giant-file split) into it; `c8abc04a` (builder) and `50cecbc9` (fixer)
  follow; `50cecbc9` is the result HEAD. Take any base copy with `git archive <commit>` into that folder (outside
  every Git tree), check each file you use against `git show <commit>:<path>`, and give a copy that runs code its own
  `pnpm install --frozen-lockfile --offline`; link no `node_modules` between folders. This worktree has its own
  install. A scratch clone made with `git clone` needs `-c core.longpaths=true`.
- **Drive the real measures and commands**: the result's exported functions from a driver that imports them by
  absolute path, or the real `pnpm check:code-health`, `pnpm code-health:baseline`, `pnpm check` and the lefthook
  hook in scratch repositories you make. Run single test files, not the whole ladder; the coordinator's CI run on the
  result decides the ladder. Never run `codex:round` or `main:advance`.

## Goal

Each row below is checked by a command you run, with its input and its output, so the coordinator knows which of the
round's outcomes and follow-ups hold on the result.

## Causes and required outcomes

- **G1. longFunctionLines values (R1).** Outcome: inputs I1a-I1e give their expected results.
- **G2. longFunctionLines in the ratchet (R1).** Outcome: in a scratch repository with the result's files and a
  committed baseline holding 90 for `lib.mjs` (input I1a): growing the function to 91 lines makes
  `pnpm check:code-health` fail naming `lib.mjs`, 90 and 91, and `pnpm code-health:baseline` refuse; shortening it to
  85 makes the check fail until the writer writes 85; a `code-health-exception:` line naming `longFunctionLines` (in
  the form the ratchet accepts for a per-file measure) lets the 91 through.
- **G3. emptyBlocks outside test files (R2 as narrowed by the coordinator).** Outcome: inputs I3a-I3k give their
  expected results, each equal to Biome's hits on the same file for I3a-I3j; on the result's tracked files under
  `scripts`, `.agents/skills`, `apps` and `packages`, emptyBlocks equals Biome's hits (file and line) in the non-test
  files, 9 in all, and no test file has a value.
- **G4. emptyBlocks in the ratchet (R2).** Outcome: adding one empty `catch` to a non-test file in a scratch
  repository makes the check fail naming the file and both counts, and the writer refuse.
- **G5. Biome warnings and three rules (R3).** Outcome: the `check` script in `package.json` is
  `biome check --error-on-warnings .`; `biome.json` sets `noSkippedTests`, `noUnusedExpressions` and
  `noNonNullAssertion` to `error` and adds no nursery rule; `pnpm check` exits 0 on the result; each of an unused
  import, an unused variable, an `it.skip`, a bare `a === b;` and a `value!.x`, planted alone in a scratch copy, makes
  it exit non-zero naming the rule. `biome.json` has no override, ignore or exclusion that weakens these rules or the warnings except one: `noSkippedTests`
  off for `tests/browser/desktop-demo.browser.spec.ts` (Playwright's runtime `test.skip(condition, reason)`, outside the
  round's paths; accepted by the coordinator as F287); report every override you find.
- **G6. Counting forms (R4).** Outcome: inputs I6a-I6i give their expected case and expect counts.
- **G7. Directory floors (R4).** Outcome: in a scratch repository with a committed baseline and two test files
  `a.test.ts` and `b.test.ts` in a directory named `dir`, each run from the clean committed state: moving one case
  from `a.test.ts` to `b.test.ts` passes the check; renaming `a.test.ts` to `c.test.ts` in the same directory with
  `git mv` passes; deleting one case fails naming `dir`, `testCases` and both totals, and the writer refuses; deleting
  one `expect` fails for `expectCalls`; turning an `it` into `it.skip` fails; moving `a.test.ts` into a directory named
  `other` fails for `dir` until a test file in `dir` holds an exception line; adding a case fails until the writer
  writes the rise.
- **G8. One test timeout (R5).** Outcome: `vitest.config.ts` differs from the base `f5927a26` only in `testTimeout`,
  whose value is 60,000 to 90,000 ms; no `vi.setConfig` line with a test timeout remains in
  `scripts/agent-environment/codex-round.test.ts` or `codex-report-events.test.ts`; a scratch test that never settles
  fails with Vitest's timeout message within 90 s and a test that waits 45 s passes, both run with the result's config; and no test or test-support file
  tracked at the result adds a per-file or per-test timeout (`vi.setConfig`, a `testTimeout` option, or a numeric
  timeout argument) that `da828661` lacks.
- **G9. One extension list and names by behaviour (R6, review).** Outcome: `IMPORT_EXTENSIONS` and `linkedReferences`
  use the scanner's script extensions (members as at the base); no test file name or `describe`/`it` title the round
  adds or changes names a round or an outcome ID (`r01`, `R1`, `R2`, `R4`), and no temp-folder prefix does.
- **G10. Giant-file failures say how to split (builder item 3).** Outcome: in a scratch repository, a giant-file rise
  in `pnpm check:code-health`, a working-baseline inflation of a giant file, and a refused giant-file rise in
  `pnpm code-health:baseline` each print, after the count line, the instructions (move code out by responsibility into
  a module named for what it holds and update imports; never delete blank lines, comments or explanations; never
  join lines; then run `pnpm code-health:baseline`), the same text from one place in the code; a failure on any other
  measure alone prints none of it.
- **G11. The pre-commit job (builder item 4, fixer items 1-2).** Outcome: in a scratch clone of the result with its own
  install and lefthook installed there: a commit staging a giant file grown past its baseline fails with the count
  line and G10's instructions; a staged giant file whose working copy was then shortened still fails (the staged
  content is read); a commit of non-giant files passes; `lefthook.yml`'s hook is `piped` and its `biome` job is as at
  the base; and three runs of the job's command with ten staged source files including
  `scripts/agent-environment/codex-round.test.ts` give a median under 1 s (report each time).
- **G12. The counts held before (L2).** Outcome: against `da828661`'s committed baseline, the result's baseline keeps
  every `giantFiles`, `duplication`, `typeEscapes`, `suppressions`, `repeatedWorkarounds`, `longFunctions` and
  `longFunctionLines` value, with no value rising in any file except a file created after `da828661` (list each such
  file and value) and falls listed with their cause; `git diff da828661 50cecbc9` adds no `code-health-exception:`
  marker; `pnpm code-health:baseline` on the result leaves `git status --short` empty and
  `pnpm check:code-health` passes. Report the totals of every measure.
- **G13. New cases prove the repair (L0).** Outcome: each test case added in `f5927a26..50cecbc9` to the code-health
  test files fails at an assertion when run against the base's production code (`.agents/skills/gardener/code-health*.mjs`,
  `scripts/agent-environment/check-code-health.mjs` and `code-health-baseline.mjs` at `f5927a26`, with the result's
  test files and any test-support file they import copied in), not at a missing import, helper or fixture, and passes
  on the result. A case for a module the base lacks (the staged check, the ratchet module) is listed apart with how it
  fails. Map each added case to the outcome (R1-R6, or a builder or fixer item) and the expected result it asserts;
  report each case's failing line.
- **G14. Scope and the base's tests (L1).** Outcome: `git diff --stat f5927a26 50cecbc9` (setting aside the files
  `da828661`'s merge brought) changes none of `scripts/agent-environment/codex-round.mjs`,
  `scripts/agent-environment/check-brief.mjs`, `scripts/check-agent-context.mjs`, `scripts/verify-repository.mjs`,
  `.agents/skills/gardener/survey.mjs`, `.agents/skills/verify-fitway/runner.mjs`, `.agents/skills/verify-fitway/compare.mjs`,
  or any file under `apps/` or `packages/`; `package.json` changes only the `check` script; every test case present at
  `da828661` is present at the result with its body unchanged except the listed allowances (the emptyBlocks total
  37 to 9, the two removed `vi.setConfig` lines, renamed titles, the temp-folder prefix); fixture files byte-equal;
  and the test IDs Vitest collects (`pnpm exec vitest list` with `--json`, or its JSON reporter) for every test file
  the commits after `da828661` change are, at the result, those at `da828661` plus the added cases, with renamed titles
  mapped one to one.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-ratchet-2-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<ID>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include one row for each of G1-G14 and no `commit` line. A PASS command must match a command you ran, and its output
must be one line the command printed. Outside the block, give for each FAIL the input that failed and what the result
gave, and anything you could not run.
