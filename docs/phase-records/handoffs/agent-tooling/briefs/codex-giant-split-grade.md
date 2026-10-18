<!-- brief-format: v1 role: codex delivers: report -->
# Codex brief: grade giant-split by running these checks (agent-tooling-r01, giant-split-grade)

- **Worktree:** `D:/fitway-temp/tooling-giant-split-grade/wt`, branch `grade-giant-split`, HEAD `59a1c0b6`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 6
  and 10.
- **Read first, only these:**
  - `D:/fitway-temp/tooling-giant-split-grade/codex-giant-split.md`, whole: the brief of the
    result you grade, as launched; your contract is G1-G10 below;
  - `scripts/agent-environment/tool-contract-cases.ts`, `entryFiles` and `sourceScanTest`;
  - `D:/fitway-temp/tooling-giant-split-grade/moved-declarations.cjs` and
    `D:/fitway-temp/tooling-giant-split-grade/unbound.cjs`, whole: a checker of moved
    statements and one of names a module uses without declaring or importing them;
  - `D:/fitway-temp/code-review/giant-split-1/dispositions.md` and
    `D:/fitway-temp/tooling-giant-split/builder-1/BRIEF.md` §"Amendments to the round brief (coordinator decisions)":
    the coordinator's amendments to the round brief after its diff review; grade against the brief as amended.

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
- **This round grades; it fixes nothing.** Keep scripts, scratch copies and logs in
  `D:/fitway-temp/tooling-giant-split-grade/`. The base is `72b95888`; the result HEAD is the worktree's HEAD. Take
  any base copy with `git worktree add --detach <folder> 72b95888` under that folder (give it its own
  `pnpm install --frozen-lockfile --offline`; link no `node_modules` between folders), and plant changes only in
  copies, never in this worktree. Run single test files, not the whole ladder; the coordinator's CI run on the result
  decides the ladder. Start no Codex process; never run `codex:round` or `main:advance` with arguments they accept on
  a real brief.

## Goal

The coordinator knows, row by row, whether the delivered split moved the six files' code unchanged into cohesive
modules under the line, kept every command, test and check reading the same code, and kept the ratchet and map
honest, on checks the round did not run itself.

## Causes and required outcomes

- **G1. Moves (S2, S3).** Outcome: `node D:/fitway-temp/tooling-giant-split-grade/moved-declarations.cjs
  D:/fitway-temp/tooling-giant-split-grade/wt 72b95888 HEAD` prints `missing=0`, `count-changed=0`,
  `new-statements=0` and `comments-lost=0`; report every line it prints other than `LINES`. Before trusting it,
  show it catches a planted one-byte change in a moved function and a deleted comment, in a copy. `node
  D:/fitway-temp/tooling-giant-split-grade/unbound.cjs` (with `CHECKER_TS` set to this worktree's
  `node_modules/typescript/lib/typescript.js`) on every `.mjs` file the diff adds or changes reports no name other
  than those it reports on the six files at the base. Intent: every statement and comment arrived unchanged, and
  every name still resolves.
- **G2. Line counts (S1).** Outcome: every file in the checker's pool at or below 700 lines by `wc -l`, except
  `.agents/skills/verify-fitway/runner.mjs`, which holds `drive`, at or below 800, with no `biome-ignore` in any
  pool file. Intent: room under the line, reached without escapes.
- **G3. Graph (S2, S4).** Outcome: the checker prints no `CYCLE`, `REEXPORT` or `NEW-IMPORTS-SPLIT-FILE` line;
  `formatReport` and `collectSurveyCodeHealth` are declared in `.agents/skills/gardener/survey.mjs` and
  `listTrackedFiles` in `scripts/verify-repository.mjs`; every importer outside the pool imports each name from the
  module that declares it (list any that does not). Intent: one path to each declaration.
- **G4. Entries (S5).** Outcome: from the base copy and from this worktree, the same commands give identical output
  (after replacing each checkout's own absolute path) and exit codes: `--help` of `scripts/agent-environment/codex-round.mjs`,
  `scripts/agent-environment/check-brief.mjs`, `scripts/check-agent-context.mjs`, `scripts/verify-repository.mjs`,
  `.agents/skills/verify-fitway/cli.mjs` and `.agents/skills/gardener/survey.mjs`; `pnpm check:repository`;
  `pnpm check:agent-context --milestone agent-tooling-r01`; `pnpm brief:check` on the brief named in "Read first";
  `pnpm codex:round` with no argument; `node .agents/skills/gardener/survey.mjs` with no argument;
  `pnpm verify:owner list --help`. Intent: nobody who runs the tools can tell.
- **G5. The source scan (S6).** Outcome: in a copy of the result, a line `const a = process.argv.slice(2);` planted
  at the top of each new module made from an entry file (one plant at a time) makes
  `scripts/agent-environment/tool-contract.test.ts` fail at the source-scan case; without a plant it passes. Report
  each module's result. Intent: argument reading moved out of an entry module is still scanned.
- **G6. Plants and source reads in tests (S6).** Outcome: each planted-defect replacement in
  `.agents/skills/verify-fitway/compare-parallel.test.mjs` and the source read in
  `.agents/skills/verify-fitway/cli.test.mjs` that names `comparisonCapture` find their text exactly once in the file
  they name at HEAD; and in a copy where that text is removed from the named file, the test that relies on it fails.
  List every other test file that names one of the six files or a new module by path, and whether what it reads is
  there. Intent: no check stopped reading code because it moved.
- **G7. Tests (L1).** Outcome: `git diff 72b95888 HEAD -- '*.test.ts' '*.test.mjs'` changes only import lines, file
  names of plants and source reads, how a moved name is referenced (a namespace member becoming a named import), and
  the G8 exception lines (list every other changed line); no test is skipped, excluded or made conditional;
  `git diff 72b95888 HEAD --stat -- scripts/agent-environment/fixtures` is empty. Intent: the same tests prove the same
  behaviour.
- **G8. Ratchet and map (S7).** Outcome: `pnpm check:code-health` passes, and its only added exceptions are one
  `giantFiles` exception (until 2026-11-15) in each giant test file that grew by import lines only (show each file's
  diff is import lines and that exception); for each measure,
  the sum over the pool's entries in `docs/agent-context/CODE_HEALTH_BASELINE.json` is at or below the sum over the six
  at the base, no count rises in another file, and no pool file has a `giantFiles` entry; `pnpm check:tooling-map`
  passes with 785 callables and at most 614 without a covering test. Intent: a move hides no debt and loses no test.
- **G9. Scope (L2).** Outcome: `git diff --name-only 72b95888 HEAD` holds only files the round's Scope allows; it holds
  none of `.agents/skills/gardener/code-health.mjs`, `code-health-source.mjs`, `code-health-duplication.mjs`, their
  tests, `scripts/agent-environment/check-code-health.mjs`, `code-health-baseline.mjs` and
  `code-health-ratchet.test.ts`, and `.agents/skills/verify-fitway/compare.mjs` changes on import lines only.
  Intent: no collision with the parallel round.
- **G10. Cohesion (S1, judgement).** Outcome: for each new module, its origin file, its file name, and whether every
  declaration in it serves the one responsibility its name and opening comment state (name any that does not, and any
  module whose name is a number or "part"). Intent: modules a reader can find by what they hold.

## Scope

This round writes only under `D:/fitway-temp/tooling-giant-split-grade/` and commits nothing. Everything else is
read-only. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.
(B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<ID>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Add one row for each of G1-G10. Outside the block, give each row's evidence: what you ran, what it printed, and for
a FAIL the file and line.
