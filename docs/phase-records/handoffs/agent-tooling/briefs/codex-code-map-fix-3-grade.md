<!-- brief-format: v1 role: codex -->
# Codex brief: grade code-map after its third fix by running these checks (agent-tooling-r01, code-map-fix-3-grade)

- **Worktree:** `D:/fitway-temp/tooling-code-map-fix-grade/wt`, branch `grade-code-map-fix-3`, HEAD `e080324d`
- **Milestone:** `agent-tooling-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 2, 5, 6 and 8.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map.md`, `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map-fix.md` and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-code-map-fix-3.md`, whole: the three briefs of the result you grade (M1-M2, then K1-K5, then two fixer commits, then N1-N5, then a fixer commit of four review edits on top); your contract is G1-G15 below;
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
  `D:/fitway-temp/tooling-code-map-fix-3-grade/`. The base is `c286c4c9` and the third fix's base is `572d94c4`; take
  any base copy with `git archive` outside every git tree. Plants go in scratch copies outside the worktree, never in
  it. The worktree has its own install; run single test files and the generator, not the whole ladder; the
  coordinator's CI run on the result decides the ladder. Start no preview, compare or Codex process. Run `pnpm install`
  only as `pnpm install --frozen-lockfile --offline` inside a clone you made under your temp folder, never in the
  worktree or another checkout, and link no `node_modules` between folders (DECISIONS item 8).
- **Your report names no commit by its SHA and holds no hexadecimal word of seven or more characters:** call commits
  "the result HEAD", "the base" and "the third fix's base", and name folders without their hash parts. The
  coordinator's launcher still carries F258 and would refuse a grader's report. You make no commit outside scratch
  repositories under your temp folder, and run no ladder.

## Goal

The coordinator knows, row by row, whether the delivered map holds on checks its own run did not make.

## Causes and required outcomes

- **G1. Real entries.** Outcome: for `reportClaimFailures` and `commitCandidates` in
  `scripts/agent-environment/codex-round.mjs`, and for `BaselineCache.constructor` in
  `.agents/skills/verify-fitway/baseline-cache.mjs`, the map's start line is within 2 of the line `grep -n` gives for
  the declaration and its end line closes it; report the map's covering tests for each and whether each listed test
  file imports and calls it. Intent: entries point at the code.
- **G2. No invented or missed coverage.** Outcome: with your own scanner (not the generator's code), every test file
  the map lists for every covered callable imports that name from that module (directly, through `export ... from`, or
  through an import followed by a local `export { name }` or `export { name as other }`) and calls it, or constructs
  its class with `new` for a constructor (report the count checked and each miss); and the complete relation your
  scanner derives under those rules equals the map's, every "uncovered" claim included (report each difference).
  `discoverElements` and `extractDependencies` (`.agents/skills/verify-fitway/discover.mjs`) list
  `.agents/skills/verify-fitway/cli.test.mjs`. Intent: coverage claims hold, however a function is re-exported.
- **G3. Every file and callable.** Outcome: the map's file list equals `git ls-files` of the first brief's M1 folders
  and files with tests excluded (report both counts and any difference); and with your own scanner on the TypeScript
  compiler API (not the generator's code), the set of (file, name, start line, end line) for every callable form the
  first brief's M1 names, plus every class's own `constructor`, equals the map's (report both counts and every
  difference). A class without its own constructor has no constructor entry. Intent: nothing is skipped.
- **G4. Drift fails.** Outcome: in a scratch copy of the tree, adding `export function heldOutProbe() {}` to a mapped
  file makes `pnpm check:tooling-map` (the command the ladder step runs) exit 1 with a line containing `FAIL:` and the
  regenerate command; removing it again exits 0; and the step in the committed `scripts/verify.mjs` runs that command
  in `fast` with no condition that can skip it (quote the lines). Intent: a stale map is caught.
- **G5. Line endings.** Outcome: a fresh clone of the result into `D:/fitway-temp/tooling-code-map-fix-3-grade/` with
  `core.autocrlf=true` regenerates a map byte-identical to the committed one. Intent: Windows checkouts agree.
- **G6. Moved code.** Outcome: in a scratch copy, moving one mapped function down by 20 lines with nothing else changed
  makes `--check` fail, and its output names that callable, its file and its changed range. Intent: lines are checked,
  not only names.
- **G7. Every form.** Outcome: a class method and a class constructor in a mapped file have their own entries with
  their lines; in a scratch copy, adding and then removing each of a `const` arrow function, a default export, a
  getter, a static method and a constructor in a mapped file makes `--check` fail after each change and pass when
  restored, and after each addition the regenerated map holds an entry for that callable itself with its exact range;
  a test that constructs that class with `new` covers the constructor, and one that only extends it or calls
  `Reflect.construct` does not. Intent: behaviour in any form is findable.
- **G8. Import is not coverage.** Outcome: in G5's clone, a new test file added with `git add` that imports an
  uncovered function and never calls it leaves that function uncovered after regeneration, and the same file with one
  call added makes the map list it as covering (proving the generator saw the file). Intent: as G2.
- **G9. Size, time, ladder.** Outcome: the map is at most 80 KB; three `--check` runs on this machine take under 15 s
  each (report them); `parseFastSteps` (`.agents/skills/gardener/facts.mjs`) on the committed `scripts/verify.mjs`
  returns the base's eight steps plus the new one in the order the first report states, the eight keep the base's
  commands and environment, and the `package.json` scripts they run are byte-equal to the base's, and with
  `FITWAY_VERIFY_TEST_STEPS=[]` set, `scripts/verify.mjs`'s step list is unchanged (the F250 seam stays closed).
  Intent: the step is cheap and the ladder kept its shape.
- **G10. Report against commands.** Outcome: your HEAD is the result; the third round's run folder
  (`D:/fitway-temp/codex-round-fd9fda9f-43de-474a-ba61-72cb48dfa054/`) records a successful `git commit` and a
  `node scripts/verify.mjs fast` run after it with exit 0 and no later commit, and its last turn in `turns.jsonl` records
  that commit as its head, which is your HEAD's parent; your HEAD is a fixer commit outside any run that touches only
  the three generator modules it names, the generator's test file and the regenerated map, changing the map only in
  line ranges (say so); classify the third round's L0 red runs from its events, each failing case as an assertion on
  N1-N4 behaviour or a missing module, export, helper, fixture or setup; G10 fails if any is the latter (say so without
  SHAs). Intent: the report rests on what ran.
- **G11. Command coverage (N3).** Outcome: with your own scan of the test files, list every place a test starts
  `node` or `process.execPath` with a mapped module as its entrypoint (the first argument that is not an option), or
  runs a pnpm script whose `package.json` command is `node <mapped module>`, the path given as a literal, a
  `path.join` or `path.resolve` of literal segments and a root the test computes, a URL of the module, or a
  `process.cwd()` path; the map's module-level "Command run by" lists equal that set (report missing and extra
  entries), with `scripts/verify.test.ts` for `scripts/verify.mjs` and `scripts/agent-environment/codex-round.test.ts`
  for `scripts/agent-environment/codex-round.mjs` among them. A path rebuilt through other calls (the check-brief test
  upper-cases its folder) or a command printed by the tool under test (the gardener round-16 test) need not appear; say
  which places you set aside on these grounds. In a scratch copy, a test that passes a mapped module's path to `git
  add`, after another entrypoint, or to `node --check` adds no relation. Intent: command-run tools point at the tests
  that run them, and at no others.
- **G12. An ordinary step (K1).** Outcome: `scripts/verify.mjs` holds no code that names the map step and no
  step-skipping branch for any label; the step's command lives only in `package.json`; in a scratch copy, a drifted map
  makes the ladder's `runVerification` path fail at that step. Intent: nothing can skip it.
- **G13. Forms and coverage (K2, N2).** Outcome: in scratch copies, a parenthesized function expression and a
  parenthesized default-export class are mapped; a getter and a setter of one name are two entries, a test that only
  reads the property covers only the getter and one that only assigns covers only the setter; a test that dynamically
  imports a mapped module and calls a destructured, a named, a default or a namespace binding of it covers that callable
  (each form planted); a callable re-exported from another module is covered by a test that imports it through the
  re-export, in each of the forms `export { f } from`, an import then `export { f }`, and an import then
  `export { f as g }` with the test calling `g`; `.agents/skills/verify-fitway/cli.mjs` and `port-observer.cjs` list
  `cli.test.mjs` at module level. Intent: the map lists what is there and who tests it.
- **G14. A drift that names itself (K3, N4).** Outcome: `pnpm check:tooling-map` on a map edited to drop one
  module-level command test, one edited to add a false one, and one edited to drop a callable's line each exits 1
  naming that file and that relation or callable (missing or extra, with its name and kind), never only a line number
  or a count; an untracked source file in a mapped folder fails the check naming the file; the output still holds the
  regenerate command. Intent: an agent reading a drift knows what changed.
- **G15. One path, small parts (K4, K5, N5, the review edits).** Outcome: the generator's modules hold no `git
  ls-files` call (`git grep`), and tracked and untracked listings go through one helper in
  `scripts/verify-repository.mjs`; each module of the generator is at most 500 lines and each function at most 80,
  test callbacks included (your own count), with no module-level mutable state shared between them; no helper is
  defined twice across them (name any two functions that walk the same syntax with the same rules); `git diff
  --name-only` from the base to your HEAD lists only the files the three briefs' Scopes allow, plus the generated map
  and `scripts/verify.test.ts` (the earlier fixer's seam-test step list), and each file's hunks keep to its Scope's
  restriction (`package.json` its `scripts` section with no dependency change, `scripts/verify-repository.mjs` only for
  the shared file listing). Intent: one paved path, parts a reader can hold.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-code-map-fix-3-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each of G1-G15 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
