<!-- brief-format: v1 role: codex -->
# Codex brief: a generated code map of the agent tooling, kept current by the ladder (agent-tooling-r01, code-map)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-code-map`, branch `tooling-code-map`, HEAD `c286c4c9`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 1 and 5.
- **Read first, only these:**
  - `docs/phase-records/task-packets/agent-tooling-r01.yaml`, acceptance criterion 3;
  - `scripts/verify.mjs`, `fastSteps` and `main`;
  - `.agents/skills/gardener/facts.mjs` lines 400-440 (`parseFastSteps` reads the ladder's source text);
  - `docs/agent-context/README.md`, whole;
  - `package.json`, its `scripts` section.

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
  with no other branch: every test and step you add passes there, with no file outside the repository.
- **Your temp folder** is `D:/fitway-temp/tooling-code-map/`. Start no preview, compare or Codex process of your own.
  If a verify-fitway test fails in the fast ladder, rerun that file alone once and report both runs; the coordinator's
  CI run on your commit decides L2. Another round changes `scripts/agent-environment/codex-round.mjs` and
  `new-handoff.mjs` now: map them as they are at your HEAD.
- **Your report is checked against this run's recorded commands.** A step counts as done only when a tool call ran
  it in this run; quote its real output, and name the SHA `git rev-parse HEAD` printed after your commit.

## Goal

An agent finds where a tool's behaviour lives, and which tests cover it, from one generated file instead of reading
whole scripts, and that file is never out of date on a green ladder.

## Causes and required outcomes

- **M1. No map of the tooling.**
  - **Cause (measured by the coordinator).** Pickups read the tool scripts whole to find a function (the launcher is
    over 2,000 lines, the verify-fitway CLI's modules several thousand together); nothing lists the functions, their
    lines or their tests (F253's start-load figures).
  - **Outcome.** One command (a `package.json` script) writes a committed map file under `docs/agent-context/` that
    lists, for every JavaScript and TypeScript source file (tests excluded) under `scripts/agent-environment/`,
    `.agents/skills/verify-fitway/`, `.agents/skills/gardener/`, and the files `scripts/verify.mjs`,
    `scripts/check-agent-context.mjs`, `scripts/show-agent-context.mjs`, `scripts/verify-repository.mjs`,
    `scripts/check-design-context.mjs`, `scripts/check-concept-css.mjs` and `scripts/run-vitest.mjs`: each exported
    function or class and each top-level function, with its start and end line, and the test files that cover it,
    where a test file covers it when it imports that name from that module, or runs that module as a command and the
    name is reached from the module's entry. A function no test covers is listed as such. Report how many files and
    functions the map lists, and how many have no covering test.
  - **Intent.** One file answers "where is X and what tests it" for every tool an agent runs; a map that skips files
    or invents coverage defeats it.
- **M2. The map never drifts.**
  - **Outcome.** A fast-ladder step regenerates the map in memory and fails when it differs from the committed file,
    printing `<command>: FAIL: <what differs> (run <the command that regenerates it>)` and exit 1; it passes on your
    committed tree. A test shows it fails after a planted change (a function added to a mapped file in a scratch copy
    the test makes) and passes on the unchanged tree. Two runs of the generator give byte-identical files on Windows,
    whatever the checkout's line endings.
  - **Intent.** A green ladder means the map matches the code.

## Limits the result keeps

- **L0. New cases prove the repair.** Each case you add names the outcome it tests (M1 or M2), fails before your change
  at an assertion on that outcome's behaviour (not at a missing helper, import or fixture), and passes unchanged on your
  result; the cases you commit are the ones you showed failing, and the fast ladder runs them. Report each failing
  output.
- **L1. Today's behaviour elsewhere.** Every test at the HEAD keeps its assertions and still runs, none skipped,
  excluded or made conditional; the ladder's existing steps keep their order, commands and environment, with the new
  step added; `parseFastSteps` on the committed `scripts/verify.mjs` returns the existing eight steps plus the new one
  (report both lists).
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.
- **L3. Cost.** The new ladder step takes at most 15 s on this machine (report three runs with the median and range);
  the map file is at most 80 KB; the map adds no dependency (`typescript` is already a dev dependency).
- **L4. Where it is found.** `docs/agent-context/README.md` names the map file and its command in one line.

## Scope

You may change `scripts/verify.mjs` (must change: the step), `package.json` (its `scripts` section only),
`docs/agent-context/README.md` (must change), `.agents/skills/gardener/facts.mjs` only if `parseFastSteps` needs it,
and add the generator, its test and the map file under `scripts/agent-environment/` and `docs/agent-context/`; commit
once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around
it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the counts M1 asks for;
the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
