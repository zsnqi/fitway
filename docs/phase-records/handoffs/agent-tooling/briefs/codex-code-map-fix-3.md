<!-- brief-format: v1 role: codex -->
# Codex brief: the map's last gaps: constructors, re-export lists, built command paths, named drift (agent-tooling-r01, code-map-fix-3)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-code-map`, branch `tooling-code-map`, HEAD `572d94c4`
- **Milestone:** `agent-tooling-r01`. Decisions: items 5, 6 and 8 of `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (the coordinator line; this branch's copy is behind).
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map-fix.md`, whole: the round before; its outcomes and limits still hold;
  - `D:/fitway-temp/codex-round-53b5644e-6f33-4e33-a46d-94116c388eb9/last-message.md`, whole: the grade, rows G2, G3, G11, G13, G14 and G15;
  - `scripts/agent-environment/tooling-map-parser.mjs`, `tooling-map-imports.mjs`, `tooling-map-coverage.mjs` and `tooling-map-document.mjs`, whole;
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
  CI run on your commit decides L2. Link no `node_modules` between folders (DECISIONS item 8).
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.
- **No validator, parser, option or guard beyond what an outcome needs.** (DECISIONS item 6)

## Goal

The map lists every callable and every test that covers or runs it, and a drift names what drifted.

## Causes and required outcomes

- **N1. Constructors (grade G3, G7).**
  - **Cause (measured by the grader and reproduced by the coordinator).** `BaselineCache`'s constructor
    (`.agents/skills/verify-fitway/baseline-cache.mjs` L108-113) has no entry, while its methods do.
  - **Outcome.** Every class constructor in a mapped file has its own entry with its range and coverage (a test that
    constructs the class with `new` covers it). Tested.
  - **Intent.** Behaviour in a constructor is findable.
- **N2. Re-export lists (grade G2, G13).**
  - **Cause (measured by the grader).** A module that imports a name and lists it in a local `export { ... }` passes its
    tests' calls to nobody: `extractDependencies` and `discoverElements` (`discover.mjs`), re-exported through
    `map.mjs` and called by `cli.test.mjs`, are marked uncovered.
  - **Outcome.** Coverage follows a re-export whether it is written `export ... from`, or an import followed by a local
    `export { name }` or `export { name as other }`, to the defining module. Tested with both forms and an alias.
  - **Intent.** The map says who tests a function however it is re-exported.
- **N3. Commands run through built paths (grade G11).**
  - **Cause (measured).** A test that runs a module through a path built at runtime is not found:
    `scripts/verify.test.ts` runs `path.join(root, "scripts", "verify.mjs")`; the grader also lists
    `codex-round.test.ts` for `codex-round.mjs`, `check-brief.test.ts` for `new-handoff.mjs` and
    `.agents/skills/gardener/round16.test.ts` for `remove-worktree.mjs`.
  - **Outcome.** A test runs a module as a command when it starts node (or a pnpm script that runs it) with that module's
    path given as a literal, a `path.join` or `path.resolve` of literal segments and a root the test computes, a URL of
    the module, or a `process.cwd()` path; the four relations above are listed, and the map adds no relation your own
    `git grep` of the tests cannot show. Tested with each form.
  - **Intent.** A command-run tool points at the tests that run it.
- **N4. A drift that names itself (grade G14).**
  - **Cause (measured).** In check mode a dropped or added command-test entry prints only `line 167 differs`.
  - **Outcome.** Check mode names each difference by its file and its callable or command relation (missing, extra, or
    changed range), as validation does, and still exits 1 with the regenerate command. Tested for a dropped and an added
    entry and a moved callable.
  - **Intent.** An agent reading a drift knows what changed without diffing the map.
- **N5. One way to ask Git for files (grade G15).**
  - **Cause (measured).** `listUntrackedMappedSourceFiles` wraps `git ls-files` a second time beside `listTrackedFiles`.
  - **Outcome.** Tracked and untracked listings go through one helper in `scripts/verify-repository.mjs` (an option of
    `listTrackedFiles` or one sibling beside it), and the generator holds no `git ls-files` call of its own.
  - **Intent.** One paved path.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (N1-N5), fails at this HEAD at an
  assertion on that outcome's behaviour (not at a missing helper, import, fixture or setup: a fixture repository has an
  initial commit before a case relies on `HEAD`), and passes unchanged on your result; the cases you commit are the
  ones you showed failing, and the fast ladder runs them. N5 is shown by `git grep`. Report each failing output.
- **L1. The earlier outcomes.** Every outcome and limit of `codex-code-map.md` and `codex-code-map-fix.md` still holds
  (report each again); every test at this HEAD keeps its assertions and still runs; no module over 500 lines, no
  function over 80.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/tooling-map-parser.mjs`, `tooling-map-imports.mjs`, `tooling-map-coverage.mjs`
and `tooling-map-document.mjs` beside it, `scripts/agent-environment/generate-tooling-map.test.ts` (must change),
`scripts/verify-repository.mjs` (only for N5's listing helper) and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`
(regenerated); commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met,
do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the map's file, callable and
uncovered counts; the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
