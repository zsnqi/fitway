<!-- brief-format: v1 role: codex -->
# Codex brief: re-grade six rows of the CLI contract after its grade builder (agent-tooling-r01, cli-contract-regrade)

- **Worktree:** `D:/fitway-temp/tooling-cli-contract-regrade/wt`, branch `regrade-cli-contract`, HEAD `47f18b0e`
- **Milestone:** `agent-tooling-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 2, 5, 6, 8 and 10.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-cli-contract.md` and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-cli-contract-fix.md`, whole: the two briefs of the result you grade (C1-C5, then E1-E5); your contract is Q1, Q4, Q5, Q6, Q9 and Q10 below;
  - `scripts/agent-environment/tool-registry.mjs` and `scripts/agent-environment/tool-contract.mjs`, whole.

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
- **This round grades; it fixes nothing.** Keep scripts, scratch copies, plants and logs in
  `D:/fitway-temp/tooling-cli-contract-regrade/`. The contract's base is `57dad1c0`; its commit `cb1cfe65`; the fix's
  commit `dda8e020`; the review builder's commit `97f61712`; the grade builder's commits `1085b6fc` (the grade's
  findings) and `47f18b0e` (its diff review's findings), the second the result HEAD. An earlier grade failed these six
  rows on `97f61712`; the grade builder's two commits answer them. A **scratch copy** is
  a `git clone --no-hardlinks -c core.longpaths=true` of the result HEAD into your temp folder with its remote removed
  (`git remote remove origin`) and its own `pnpm install --frozen-lockfile --offline` (F268, F271; never a link to this
  worktree's `node_modules`, DECISIONS item 8). Older history is taken with `git archive` outside every git tree; check
  each copied file against `git show <commit>:` before using it.
- **Commands that act.** `main:advance` pushes, `codex:round` launches a round, `handoff:new`, `code-health:baseline`
  and `map:tooling` write tracked files, `gardener:remove-worktree` removes a worktree. Run any command with
  arguments it accepts only in a scratch copy; never run `main:advance`, `codex:round` or the worktree removal with
  arguments they accept anywhere: check those through the shared resolver (call it on the argument list) or with
  arguments that refuse before any work. Start no preview, compare or Codex process. Run single test files, not the
  whole ladder; the coordinator's CI run on the result decides the ladder. Make no commit outside your scratch copies.

## Goal

The coordinator knows, row by row, whether the six rows an earlier grade failed now hold on checks the grade builder's
own runs did not make.

## Causes and required outcomes

- **Q1. One listing (C1, E3).** Outcome: `pnpm tools` exits 0 and lists every `package.json` script outside the contract
  brief's product list, plus the two gardener entries, with no product script, each with its exact `package.json`
  invocation (compare with your own reading of `package.json`). In a scratch copy, each of these scripts added to
  `package.json` without a registry entry, running a new `check-heldout.mjs` under `scripts/`, makes the registry test
  fail: `check:heldout`; `check:heldout2` through `node --trace-warnings`; `check:heldout3` through a wrapper (the
  Windows command shell running node, or an environment prefix); `build:heldout`; `check-types:heldout`;
  `format:heldout`; `checkx`; `owner:review2`. `dev-heldout` and `test-heldout` running the same file do not (the list's
  `dev*` and `test*` are prefixes). The test classifies scripts by the product list alone, with the list's exact names
  matched exactly and only its starred entries as prefixes (quote the classifying code). Intent: one command finds every
  tool.
- **Q4. Start-up failures say how to fix them (C4, E5).** Outcome: for each registered command, every start-up failure
  class it has (each `failureCases` entry the registry declares, a missing required argument, an unusable value, a value
  naming something that does not exist, a missing named path) prints one stderr line `<command>: FAIL: <what> (<how to
  fix>)` whose fix names the concrete step, with no stack trace and no other line, and exits with the code C4 or E5
  gives it (list each command, its input, its line and its exit code). Include at least: `pnpm verify:phase --phase
  nosuch` (no ladder step runs), `pnpm handoff:new --milestone nosuch-r99`, `pnpm handoff:new --milestone
  agent-tooling-r01 --now not-a-date`, `pnpm check:agent-context --milestone nosuch-r99`, `pnpm verify:owner` given a
  relative path where it needs an absolute one, `pnpm verify:owner compare` with `--concept` and no `--baseline`,
  `verify:owner drive` given a `--timeline-times` value it cannot use, compare given a `--session` value it cannot use,
  a `verify:owner` subcommand given an option with its value missing (the line names that subcommand's usage, not the
  top-level one), `verify:owner measure` given a `--spec` that serves (the refusal comes before any evidence folder
  exists: list the output folder before and after), `pnpm main:advance` with no commit (exit 1, and with `GIT_TRACE=1`
  no `git fetch` or `git push`), `pnpm check:concept-css -- D:/no/such/folder` (exactly one line starting
  `check:concept-css: FAIL:`, no `ERROR:`, exit 2 as E5 keeps) and an unexpected exception you inject into
  `check:concept-css`'s start-up in a scratch copy (the same form), and another injected into `handoff:new`'s start-up
  (the same form). Each probe supplies every other argument its command requires, so its line names the defect under
  test, and the same probe with only that value made usable gets past that refusal (show both lines). Intent: an agent
  reading a failure knows its next step.
- **Q5. The contract test catches drift (C5).** Outcome: in a scratch copy, each of these plants, one at a time, makes
  the contract test or a check it runs fail naming the command or its file: one command's help printing to stderr
  instead of stdout; one refusal line in another form; one command's help path starting a `git` process; another's
  starting a non-git process; a help path writing a file outside the repository; one deleting a file there;
  `brief:check` accepting `--bogus` placed after its brief path; another command accepting an unknown option after a
  positional; one command re-gaining a private loop over option names that accepts an undeclared option; a
  `process.argv.includes("--x")` read added to one registered command; the same read with a `// tool-contract:` comment,
  or any other comment, above it; and removing an option from the registry while the command still reads it. Report each
  plant, the failing test or check, and its failing line. Intent: a tool cannot drift from the contract unseen.
- **Q6. One parser, today's behaviour kept (E1).** Outcome: `git grep` over `scripts/` and `.agents/skills/` finds no
  `parseArgs`, `parseHandoffArgs`, `parseBriefArgs` or other loop or table of option names in a registered command
  (quote the greps), and the shared resolver has no branch on a command's name. Write your own inventory of every
  argument form the base commands accepted at `57dad1c0` (read each old parser with `git show`: options, `--name=value`
  where accepted, flags, positionals, fixed arguments, and each `verify:owner` subcommand's options, `measure` and
  `doctor` among them), and check that `scripts/agent-environment/tool-compatibility.json` holds a row for each, or that
  the repository's record of forms refused on purpose names it with its reason (find that record and name its path; list
  every form missing from both). Run every row of the table through the resolver and the command's own options step and
  compare the received values with the row and with what `57dad1c0`'s parser of that command gives for the same
  arguments (run the old parser from `git archive`; report the count and every mismatch with either); in particular
  `verify:owner doctor --concept <folder> --quiet true` and `verify:owner measure --feature <f> --states <s> --languages
  <l>` give the values `57dad1c0`'s parsers gave (show both). `main:advance HEAD -- --dry-run` appears in the record of
  forms refused on purpose. Intent: one parser, and nothing an agent relied on changed unrecorded.
- **Q9. Giant files keep their shape (E4, F272).** Outcome: `scripts/agent-environment/codex-round.mjs`,
  `scripts/agent-environment/check-brief.mjs`, `scripts/verify-repository.mjs`, `scripts/check-agent-context.mjs` and
  `.agents/skills/gardener/survey.mjs` each have at most their `wc -l` at `57dad1c0` (2316, 1141, 960, 1167, 1228) and
  lost no comment line; every blank line `git diff 57dad1c0 HEAD` removes from them sits next to code removed or moved
  in the same hunk (list each one that does not); classify every line the five files lost since `57dad1c0` as a removed
  parser, code moved to a named module, or other (report the counts per file); a line classed as moved is found in its
  named module (quote one moved block per module), and every line classed as other is listed with what it did; a line
  saved by condensing code that stays (joined statements, merged declarations), or a removed line of behaviour or of
  text a command prints that survives nowhere, is a FAIL. `pnpm codex:round --help` at the result carries every help
  explanation line `57dad1c0`'s launcher printed (take `57dad1c0`'s help with `git archive`, run it outside the scratch
  copy with arguments that only print help, compare after joining wrapped lines, and list any line missing); `pnpm
  check:code-health` passes. Intent: room is made by moving code, and nothing an agent read was dropped.
- **Q10. The cases prove the fixes (L0).** Outcome: (a) run from the result's test files on `cb1cfe65`'s production code
  (`git archive` of `cb1cfe65` with the result's test files over it, made a git repository with one commit and given its
  own install), every case `dda8e020` added, apart from the compatibility rows the fix brief exempts, fails at an
  assertion on its E outcome, never at a missing module, export, helper, fixture or setup (list each); (b) the same with
  `97f61712`'s production code: every case `97f61712..47f18b0e` adds or changes, apart from R20 V2 (its change only
  passes compare's now-required `--baseline`), fails at an assertion on the behaviour its finding names (a source-scan
  case on the scan's verdict for the planted code, never on the presence of new source text or registry metadata alone),
  never at a missing module, export, helper, fixture or setup (list each); both sets pass on the result. Intent: the
  cases see the defects.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C D:/fitway-temp/tooling-cli-contract-regrade/wt status --short` is empty at
  the end, and no commit is made there.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-cli-contract-regrade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each of Q1, Q4, Q5, Q6, Q9, Q10 and L1 as PASS or FAIL with the command and the output line that proves it, and for a
FAIL the item or input that failed; anything you could not run.
