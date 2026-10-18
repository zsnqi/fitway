<!-- brief-format: v1 role: codex delivers: report -->
# Codex brief: grade ratchet-codelines by running these checks (agent-tooling-r01, ratchet-codelines-grade)

- **Worktree:** `D:/fitway-temp/tooling-ratchet-codelines-grade/wt`, branch `grade-ratchet-codelines`, HEAD `e3f95470`
- **Milestone:** `agent-tooling-r01`. Decisions: items 6, 10 and 12 of
  `D:/Projects/fitway-worktrees/records-ratchet-codelines/docs/phase-records/handoffs/agent-tooling/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/records-ratchet-codelines/docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet-codelines.md`,
    whole: the brief of the result you grade; your contract is G1-G13 below;
  - `.agents/skills/gardener/code-health-source.mjs` and `.agents/skills/gardener/code-health.mjs`, whole: the
    measures you drive;
  - `scripts/agent-environment/code-health-baseline.mjs` and `scripts/agent-environment/check-code-health.mjs`: the
    ratchet's path;
  - `D:/fitway-temp/tooling-ratchet-codelines-grade/inputs.md`, whole: the exact inputs of G1-G8.

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
- **This round grades; it fixes nothing.** Keep scripts, drivers, scratch repositories and logs in
  `D:/fitway-temp/tooling-ratchet-codelines-grade/`. The base is `72b95888`; the round's commits are `61c0e47b` and
  `d54f4354`; the builder's commit `e3f95470` after them, applying the diff review's findings, is the result HEAD. Take
  a base copy with `git archive 72b95888` into that folder (outside every Git tree), check each file you use against
  `git show 72b95888:<path>`, and give the copy its own `pnpm install --frozen-lockfile --offline` there; link no
  `node_modules` between folders. This worktree has its own install.
- **Drive the real measures.** Call the result's exported `scanScope` and `scanSource` (gardener) and
  `snapshotCodeHealth` and `compareCodeHealth` (ratchet) from your own driver, which imports them from this worktree by
  absolute path, on inputs you write; G10 runs the real `node scripts/agent-environment/check-code-health.mjs` of a
  scratch repository you make with the result's files. Run single test files, not the whole ladder; the coordinator's
  CI run on the result decides the ladder. Never run `codex:round` or `main:advance`.

## Goal

Each row below is checked by a command you run, with its input and its output, so the coordinator knows which of the
round's outcomes hold on the result.

## Causes and required outcomes

The exact inputs for G1-G8 are in `D:/fitway-temp/tooling-ratchet-codelines-grade/inputs.md`, one per ID (I1a and so
on), each with its expected result. Write each as a file and run the result's measure on it. "Code lines" is the
result's giant-file count (the `lineCount` of a `giantFiles` hit).

- **G1. Threshold and plain lines (C1).** Outcome: inputs I1a-I1f give their expected results.
- **G2. Markers inside literals (C1).** Outcome: inputs I2a-I2c give their expected results.
- **G3. A block comment across lines (C1).** Outcome: input I3 gives its expected result.
- **G4. JSX text (C1).** Outcome: inputs I4a-I4d give their expected results.
- **G5. CSS and HTML (C1).** Outcome: inputs I5a-I5c give their expected results.
- **G6. One count (C1).** Outcome: for `scripts/agent-environment/codex-round.test.ts` at the result, `scanScope` on
  that one file gives a `giantFiles` hit whose detail reads as its count in code lines and whose `lineCount` equals
  the value the committed `docs/agent-context/CODE_HEALTH_BASELINE.json` holds for it.
- **G7. Suites exempt (C2).** Outcome: inputs I7a-I7g give no long-function hit.
- **G8. Everything else still measured (C2).** Outcome: inputs I8a-I8j give exactly one long-function hit each, on the
  function the input names.
- **G9. The baseline moved by exactly two changes (C3).** Outcome: against the base's
  `docs/agent-context/CODE_HEALTH_BASELINE.json` (`git show 72b95888:` that path), the result's file differs only in
  `giantFiles` values and removals and in lowered `longFunctions` counts, every `duplication`, `typeEscapes`,
  `suppressions` and `repeatedWorkarounds` value equal; and with `scanScope` run on the tracked source files under
  `scripts`, `.agents/skills`, `apps` and `packages` of the base copy and of this worktree, the scanned file set is
  equal and the result's long-function hits (file and line) are the base's less exactly the base hits that are
  callbacks of a `describe` imported from `"vitest"` in a test file, counted with your own syntax walk on the base
  copy; every other measure `scanScope` reports (`duplication`, `typeEscapes`, `suppressions`, `repeatedWorkarounds`,
  `accessibilityOverrides` and `boundaryBreaks`, the last with the concept scope's shared files as the gardener
  derives them) gives the same hits on both trees; the files the ratchet's own discovery in `code-health-baseline.mjs`
  returns are the same set at the base copy and the result, with one untracked sentinel file added under each of its
  roots in both; on the result, `pnpm code-health:baseline` leaves `git status --short` empty (the committed baseline is
  what the result's measures write) and `pnpm check:code-health` passes. Report both long-function totals and the
  number of giant files at each.
- **G10. The ratchet itself (C4).** Outcome: in a scratch repository holding the result's `scripts/`,
  `.agents/skills/` and `package.json` with its own install, one file of 850 code lines plus 60 blank lines and 40
  comment lines, and a baseline written and committed by the result's `code-health-baseline.mjs`: from the clean
  committed state, deleting every blank and comment line of that file makes
  `node scripts/agent-environment/check-code-health.mjs` pass with that file's count unchanged; adding one line `x();`
  instead makes it fail with output naming the file, 850 and 851; removing one code line instead makes it pass.
- **G11. New cases prove the repair (L0).** Outcome: the result adds at least one committed test case for each input
  form C1 and C2 of the round's brief list and one for C4 (map each form to its case); each test case the result adds (`git diff 72b95888 e3f95470` over
  the test files) fails at an assertion when the result's test files run against the base copy's production code
  (`.agents/skills/gardener/code-health.mjs`, `code-health-source.mjs`, `code-health-duplication.mjs`,
  `scripts/agent-environment/check-code-health.mjs` and `code-health-baseline.mjs` at `72b95888`), not at a missing
  import, helper or fixture, and passes on the result; report each case's failing line.
- **G12. The base's tests (L1).** Outcome: `git diff --stat 72b95888 e3f95470` changes no test file other than those
  the result adds or the round's Scope names, and no test configuration or runner (`vitest.config.*`,
  `scripts/run-vitest.mjs`, `scripts/verify.mjs`, `package.json`); every test case present at `72b95888` in the test
  files the result changes is present at the result, not skipped, excluded or made conditional, and apart from expected values on a giant-file
  count or detail or on a `describe`-callback hit its body is byte for byte the base's (show the diff of each changed
  case); every fixture file at the base is byte-identical at the result.
- **G13. The other round's files (L2).** Outcome: `git diff --stat 72b95888 e3f95470` names none of the seven files
  the round's brief reserves for the split round (its last Environment bullet), no file over 800 lines at the base, by
  physical or code lines, has more of either at the result, and `git diff 72b95888 e3f95470` adds no
  `code-health-exception:` marker.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-ratchet-codelines-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<ID>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include one row for each of G1-G13 and no `commit` line. A PASS command must match a command you ran, and its output
must be one line the command printed. Outside the block, give for each FAIL the input that failed and what the result
gave, and anything you could not run.
