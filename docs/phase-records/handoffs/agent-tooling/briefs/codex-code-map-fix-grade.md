<!-- brief-format: v1 role: codex -->
# Codex brief: grade code-map and its fixes by running these checks (agent-tooling-r01, code-map-fix-grade)

- **Worktree:** `D:/fitway-temp/tooling-code-map-fix-grade/wt`, branch `grade-code-map-fix`, HEAD `572d94c4`
- **Milestone:** `agent-tooling-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 2 and 5.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map.md`, whole, and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map-fix.md`, whole: the two briefs of the result you grade (M1-M2, then K1-K5 on top, then two fixer commits: the seam test's step list and six review edits); your contract is G1-G15 below;
  - `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`, its first 60 lines;
  - `scripts/agent-environment/generate-tooling-map.mjs`, its exports and command-line handling.

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
- **This round grades; it fixes nothing.** Keep scripts, plants, copies and logs in
  `D:/fitway-temp/tooling-code-map-fix-grade/`. The base is `c286c4c9`; take any base copy with `git archive` outside
  every git tree. Plants go in scratch copies outside the worktree, never in it. The worktree has its own install; run
  single test files and the generator, not the whole ladder; the coordinator's CI run on the result decides the ladder.
  Start no preview, compare or Codex process. Run `pnpm install` only as `pnpm install --frozen-lockfile --offline`
  inside a clone you made under your temp folder, never in the worktree or another checkout, and link no
  `node_modules` between folders (F260).
- **Your report names no commit by its SHA and holds no hexadecimal word of seven or more characters:** call commits
  "the result HEAD" and "the base", and name folders without their hash parts. The coordinator's launcher still
  carries F258 and would refuse a grader's report. You make no commit outside scratch repositories under your temp
  folder, and run no ladder.

## Goal

The coordinator knows, row by row, whether the delivered map holds on checks its own run did not make.

## Causes and required outcomes

- **G1. Real entries.** Outcome: for `reportClaimFailures` and `commitCandidates` in
  `scripts/agent-environment/codex-round.mjs`, the map's start line is within 2 of the line `grep -n` gives for the
  declaration and its end line closes that function; report the map's covering tests for each and whether each listed
  test file imports and calls it. Intent: entries point at the code.
- **G2. No invented coverage.** Outcome: with your own scanner (not the generator's code), every test file the map
  lists for every covered callable imports that name from that module and calls it (report the count checked and each
  miss); for ten callables it lists as uncovered, at random (report your seed), no `*.test.*` file in the repository
  imports and calls it (`git grep`). Intent: coverage claims hold.
- **G3. Every file and callable.** Outcome: the map's file list equals `git ls-files` of the brief's M1 folders and
  files with tests excluded (report both counts and any difference); and with your own scanner on the TypeScript
  compiler API (not the generator's code), the set of (file, name, start line, end line) for every callable form the
  brief's M1 names equals the map's (report both counts and every difference). Intent: nothing is skipped.
- **G4. Drift fails.** Outcome: in a scratch copy of the tree, adding `export function heldOutProbe() {}` to a mapped
  file makes `pnpm check:tooling-map` (the command the ladder step runs) exit 1 with a line containing `FAIL:` and the
  regenerate command; removing it again exits 0; and the step in the committed `scripts/verify.mjs` runs that command
  in `fast` with no condition that can skip it (quote the lines). Intent: a stale map is caught.
- **G5. Line endings.** Outcome: a fresh clone of the result into `D:/fitway-temp/tooling-code-map-fix-grade/` with
  `core.autocrlf=true` regenerates a map byte-identical to the committed one. Intent: Windows checkouts agree.
- **G6. Moved code.** Outcome: in a scratch copy, moving one mapped function down by 20 lines with nothing else changed
  makes `--check` fail. Intent: lines are checked, not only names.
- **G7. Every form.** Outcome: a class method in a mapped file (for example in
  `.agents/skills/verify-fitway/baseline-cache.mjs`) has its own entry with its lines; in a scratch copy, adding and
  then removing each of a `const` arrow function, a default export, a getter and a static method in a mapped file makes
  `--check` fail after each change and pass when restored. Intent: behaviour in any form is findable.
- **G8. Import is not coverage.** Outcome: in G5's clone, a new test file added with `git add` that imports an
  uncovered function and never calls it leaves that function uncovered after regeneration, and the same file with one
  call added makes the map list it as covering (proving the generator saw the file). Intent: as G2.
- **G9. Size, time, ladder.** Outcome: the map is at most 80 KB; three `--check` runs on this machine take under 15 s
  each (report them); `parseFastSteps` (`.agents/skills/gardener/facts.mjs`) on the committed `scripts/verify.mjs`
  returns the base's eight steps plus the new one in the order the report states, and with
  `FITWAY_VERIFY_TEST_STEPS=[]` set, `scripts/verify.mjs`'s step list is unchanged (the F250 seam stays closed).
  Intent: the step is cheap and the ladder kept its shape.
- **G11. Command coverage.** Outcome: for every mapped module that some test runs as a command (spawns or execs its
  path, or a `pnpm` script that runs it), the map's module-level list of such tests equals the set your own `git grep`
  finds (report missing and extra entries). Intent: command-driven tools point at their tests too.
- **G10. Report against commands.** Outcome: your HEAD is the result; the two rounds' run folders
  (`D:/fitway-temp/codex-round-9be94292-833b-4ee1-b3ac-8240cca8f848/` and
  `D:/fitway-temp/codex-round-8892703c-86e7-4629-9cfe-e5c3d5b74989/`) each record a successful `git commit`; classify
  the second round's L0 red run (9 failed of 36) from its events, each as an assertion on K1-K5 behaviour or a missing
  module, export, helper, fixture or setup; G10 fails if any is the latter (say so without SHAs).
- **G12. An ordinary step (K1).** Outcome: `scripts/verify.mjs` holds no code that names the map step and no
  step-skipping branch for any label; the step's command lives only in `package.json`; in a scratch copy, a drifted map
  makes the ladder's `runVerification` path fail at that step. Intent: nothing can skip it.
- **G13. Forms and coverage (K2).** Outcome: in scratch copies, a parenthesized function expression and a
  parenthesized default-export class are mapped; a getter and a setter of one name are two entries, a test that only
  reads the property covers only the getter and one that only assigns covers only the setter; a test that dynamically
  imports a mapped module and calls a destructured name covers it; a callable re-exported from another module is
  covered by a test that imports it through the re-export; `.agents/skills/verify-fitway/cli.mjs` and
  `port-observer.cjs` list `cli.test.mjs` at module level. Intent: the map lists what is there and who tests it.
- **G14. Command tests and untracked files (K3).** Outcome: a map edited to drop one module-level command test, and one
  edited to add a false one, each fail the check naming it; an untracked source file in a mapped folder fails the
  check naming the file. Intent: the validator checks every field.
- **G15. One path, small parts (K4, K5, the review edits).** Outcome: no wrapper of `git ls-files` besides
  `listTrackedFiles` exists in the generator's modules (`git grep`); each module of the generator is at most 500 lines
  and each function at most 80 (your own count), with no module-level mutable state shared between them; no helper is
  defined twice across them (`unwrapParenthesized`, the file-list diagnostic); `git diff --name-only` from the base
  to your HEAD lists only the files the two briefs' Scopes allow plus the generated map. Intent: one paved path, parts a
  reader can hold. Intent: the
  report rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-code-map-fix-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each of G1-G15 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
