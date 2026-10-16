<!-- brief-format: v1 role: codex -->
# Codex brief: the code map's step runs like every step, and its generator in plain parts (agent-tooling-r01, code-map-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-code-map`, branch `tooling-code-map`, HEAD `df2640aa`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5 and 6 of `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (the coordinator line; this branch's copy is behind).
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map.md`, whole: the round this fixes; its outcomes and limits still hold;
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/agent-context/briefs/CODE_REVIEW.md`, §"The two axes": the review this answers;
  - `D:/fitway-temp/code-review/code-map-1/last.md`, whole: the review's findings 1-9;
  - `scripts/verify.mjs`, `materializeStep`, `runStep` and `fastSteps`;
  - `scripts/verify-repository.mjs`, `listTrackedFiles`.

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
- **Your temp folder** is `D:/fitway-temp/tooling-code-map/`. Start no preview, compare or Codex process of your own.
  If a verify-fitway test fails in the fast ladder, rerun that file alone once and report both runs; the coordinator's
  CI run on your commit decides L2.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs.** (DECISIONS item 6)

## Goal

The map's ladder step is an ordinary step with nothing that can skip it, the generator says what it maps in parts a
reader can hold, and every gap the review and the grade found is closed.

## Causes and required outcomes

- **K1. A step that can be skipped (review 1 and 5; grade G4).**
  - **Cause (measured).** `runStep` skips the step by its label when `package.json` is absent, and `materializeStep`
    special-cases the same label with its own command beside `package.json`'s `check:tooling-map`
    (`scripts/verify.mjs` at this HEAD).
  - **Outcome.** The step is an ordinary entry of `fastSteps` run by the same path as every other step, with no code in
    `scripts/verify.mjs` that names it, no step-skipping branch left in `runStep` for any label, and one place that
    holds its command; a test shows the ladder fails
    when the map drifts.
  - **Intent.** A green ladder means the map matched (F252's silent-skip class must not return).
- **K2. Callables the generator misses or misreads (review 2, 3, 4 and 8; grade G11).**
  - **Outcome.** Parenthesized function and class expressions are mapped; a getter and a setter of the same name are
    two entries with their own coverage, a property read
    covering only the getter and an assignment or update only the setter; the dead `process.cwd()` branch is removed or made to work, whichever an
    outcome needs (say which); a test's dynamic import of a mapped module counts as an import for coverage, its bindings (named, destructured,
    default, namespace) resolved by the same rules as a static import's; and
    `.agents/skills/verify-fitway/cli.mjs` and `port-observer.cjs`, which `cli.test.mjs` runs as commands, list it at
    module level. Each with a test.
  - **Intent.** The map lists what is there and who tests it.
- **K3. A validator that skips a field (review 7).**
  - **Outcome.** The map's validation checks each file's module-level command tests against the command invocations it
    detects in the test files, failing on any missing or extra entry, as it checks callables' tests.
  - **Intent.** As K2.
- **K4. One way to list tracked files (review 6).**
  - **Outcome.** The generator lists tracked files through `listTrackedFiles` of `scripts/verify-repository.mjs` (or one
    shared helper both use), with no second wrapper.
  - **Intent.** One paved path.
- **K5. A module one reader can hold (review 9).**
  - **Outcome.** `generate-tooling-map.mjs` is split so parsing, coverage analysis and the map's writing and checking
    each live in their own module, none over 500 lines and no function over 80, each exposing a few named functions
    and sharing no mutable state with the others, with the command line unchanged; the map's own entries for them
    are regenerated.
  - **Intent.** The next change to the map touches one part.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (K1-K5), fails at this HEAD at an
  assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes unchanged on your
  result; the cases you commit are the ones you showed failing, and the fast ladder runs them. K5 is shown by line
  counts. Report each failing output.
- **L1. The round's own outcomes.** Every outcome and limit of `codex-code-map.md` still holds (report each again), and
  every test at this HEAD keeps its assertions and still runs.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/verify.mjs` (must change), `scripts/agent-environment/generate-tooling-map.mjs` (must change)
and new modules beside it, `scripts/agent-environment/generate-tooling-map.test.ts` (must change),
`scripts/verify-repository.mjs` only to share `listTrackedFiles`, `package.json` (its `scripts` section only) and
`docs/agent-context/AGENT_TOOLING_CODE_MAP.md` (regenerated); commit once when done. Everything else is read-only. Add
no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the modules' line counts;
the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
