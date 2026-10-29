<!-- brief-format: v1 role: codex -->
# Codex brief: grade the CLI contract with its fix by running these checks (agent-tooling-r01, cli-contract-grade)

- **Worktree:** `D:/fitway-temp/tooling-cli-contract-grade/wt`, branch `grade-cli-contract`, HEAD `97f61712`
- **Milestone:** `agent-tooling-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 2, 5, 6 and 8.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-cli-contract.md` and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-tooling/briefs/codex-cli-contract-fix.md`, whole: the two briefs of the result you grade (C1-C5, then E1-E5); your contract is Q1-Q12 below;
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
  `D:/fitway-temp/tooling-cli-contract-grade/`. The contract's base is `57dad1c0`; its commit `cb1cfe65`; the fix's
  commit `dda8e020`; the review builder's commit `97f61712` is the result HEAD. A **scratch copy** is a `git clone
  --no-hardlinks -c core.longpaths=true` of the result HEAD into your temp folder with its remote removed (`git remote
  remove origin`) and its own `pnpm install --frozen-lockfile --offline` (F268, F271; never a link to this worktree's
  `node_modules`, DECISIONS item 8). Older history is taken with `git archive` outside every git tree; check each
  copied file against `git show <commit>:` before using it.
- **Commands that act.** `main:advance` pushes, `codex:round` launches a round, `handoff:new`, `code-health:baseline`
  and `map:tooling` write tracked files, `gardener:remove-worktree` removes a worktree. Run any command with
  arguments it accepts only in a scratch copy; never run `main:advance`, `codex:round` or the worktree removal with
  arguments they accept anywhere: check those through the shared resolver (call it on the argument list) or with
  arguments that refuse before any work. Start no preview, compare or Codex process. Run single test files, not the
  whole ladder; the coordinator's CI run on the result decides the ladder. Make no commit outside your scratch copies.

## Goal

The coordinator knows, row by row, whether the delivered command contract holds on checks its own runs did not make.

## Causes and required outcomes

- **Q1. One listing (C1, E3, CC5).** Outcome: `pnpm tools` exits 0 and lists every `package.json` script outside the
  contract brief's product list, plus the two gardener entries, with no product script, each with its exact
  `package.json` invocation (compare with your own reading of `package.json`); in a scratch copy, adding a script
  named `check:heldout` that runs a new `check-heldout.mjs` under `scripts/` and, separately, one named
  `check:heldout2` that runs the same file through `node --trace-warnings` to `package.json` without a registry entry
  each make the registry test fail, and so does a third, `check:heldout3`, run through a wrapper (the Windows command
  shell running node, or an environment prefix); the test classifies scripts by the product list alone, not by their
  command's shape (quote the classifying code). Intent: one command finds every tool.
- **Q2. Help is safe (C2, CC1, CC3, CC7, CC8, CC9).** Outcome: for every registered command and every `verify:owner`
  subcommand, `--help` and `-h` alone, first, after a positional and between options print its help on stdout and exit
  0 with no process started and no file written (use the contract's own side-effect observer, or watch the tree, the
  temp folder and child processes yourself; say which); `pnpm verify:fast --help` and `pnpm verify:phase --help`
  return in under 2 s with no ladder step; `pnpm code-health:baseline --help` and `pnpm map:tooling --help` leave
  their files' modification times unchanged; `pnpm brief:check -- <a real brief> -h` prints help and no PASS or FAIL
  line; `pnpm verify:owner measure --help` prints the measure subcommand's help and starts no browser; through the
  resolver, `verify:owner measure --tool focus --out x -- --help` keeps `--help` in the passthrough and `codex:round
  resume <folder> --message --help` keeps it as the message. Intent: asking a tool how to use it is always safe.
- **Q3. Unknown options refused (C3, E1, CC2, CC6).** Outcome: every registered command given `--bogus` first, and
  after a known option, prints exactly `<command>: FAIL: unknown option --bogus (run <command> --help)` on stderr and
  exits 1 before any work; `pnpm check:concept-css -- <the eclipse folder> --bogus` refuses before reading any CSS;
  `verify:owner map` given an option only another subcommand declares is refused by name; an option-shaped token in a
  value position that is not free text (for example `--run --new-reveiw` through the resolver) is refused as that
  option's missing value. Intent: a mistyped option never runs a different check.
- **Q4. Start-up failures say how to fix them (C4, E5, CC4, CCF2, CCF5).** Outcome: for each registered command, every
  start-up failure class it has (each `failureCases` entry the registry declares, a missing required argument, an
  unusable value, a missing named path) prints one stderr line `<command>: FAIL: <what> (<how to fix>)` whose fix
  names the concrete step (list each command, its input and its line); `pnpm main:advance` with no commit prints such
  a line, exits 1, and with `GIT_TRACE=1` runs no `git fetch` or `git push`; `pnpm check:concept-css --
  D:/no/such/folder` prints exactly one stderr line, starting `check:concept-css: FAIL:`, with no `ERROR:` and no
  stack trace, exit 2, and so does an unexpected exception you inject into its start-up in a scratch copy; `pnpm
  handoff:new --milestone` (no value) prints one such line. Intent: an agent reading a failure knows its next step.
- **Q5. The contract test catches drift (C5, CC11, CCF6).** Outcome: in a scratch copy, each of these plants makes the
  contract test fail naming the command: one command's help printing to stderr instead of stdout; one refusal line in
  another form; one command's help path starting a `git` process; another's starting a non-git process; a help path
  writing a file outside the repository; one deleting a file there; an unknown option placed after a positional
  accepted; one command re-gaining a private loop over option names that accepts an undeclared option (the test or a
  check names it; report which); and removing an option from the registry while the command still reads it. Report
  each plant and the failing line. Intent: a tool cannot drift from the contract unseen.
- **Q6. One parser, today's behaviour kept (E1, CCF1, CCF2).** Outcome: `git grep` over `scripts/` and
  `.agents/skills/` finds no `parseArgs`, `parseHandoffArgs`, `parseBriefArgs` or other loop or table of option names
  in a registered command (quote the greps), and the shared resolver has no branch on a command's name; write your own
  inventory of every argument form the base commands accepted at `57dad1c0` (read each old parser with `git show`;
  options, `--name=value` where accepted, flags, positionals, fixed arguments), and check that
  `scripts/agent-environment/tool-compatibility.json` holds a row for each, or names it among the forms refused on
  purpose under C3 or C4 (list every form missing from both); run every row of that table through the resolver and the
  command's own options step and compare the received values with the row (report the count and every mismatch); in a
  scratch copy, these existing invocations give the same exit code and the same output at `57dad1c0` and at the result
  (compare, apart from times and paths): `pnpm context:show --milestone agent-tooling-r01`, `pnpm check:agent-context
  --milestone agent-tooling-r01`, `pnpm brief:check --
  docs/phase-records/handoffs/agent-tooling/briefs/codex-ratchet.md`, `pnpm start-load -- --limit 2 --json`, `pnpm
  handoff:new --milestone agent-tooling-r01 --now 2026-10-17T00:00:00Z` and `node scripts/verify.mjs phase --phase <a
  registered phase>` stopped before its steps through the resolver. Intent: one parser, and nothing an agent relied on
  changed.
- **Q7. One declaration (E2, CCF3).** Outcome: `.agents/skills/verify-fitway/cli.mjs` imports the contract with no
  `try`/`catch` around it and holds no usage text of its own, and `pnpm verify:owner --help` prints the registry's
  help; each command's fixed arguments appear once in the registry (quote them); `tool-contract.test.ts` has no `as`
  cast on contract metadata; the failure formatter is written once. Intent: one place to change a command's contract.
- **Q8. Nothing left over (E3).** Outcome: every export of `tool-contract.mjs`, `tool-registry.mjs` and the modules the
  fix added has a caller on a registered command's own path (not a test, not an unused helper): list each export and
  its caller. Intent: no dead API.
- **Q9. Giant files keep their shape (E4, CC10, CCF4, F272).** Outcome: `scripts/agent-environment/codex-round.mjs`,
  `scripts/agent-environment/check-brief.mjs`, `scripts/verify-repository.mjs`, `scripts/check-agent-context.mjs` and
  `.agents/skills/gardener/survey.mjs` each have at most their `wc -l` at `57dad1c0` (2316, 1141, 960, 1167, 1228) and
  lost no comment line; every blank line `git diff 57dad1c0 HEAD` removes from them sits next to code removed or moved
  in the same hunk (list each one that does not); classify every line the five files lost since `57dad1c0` as a
  removed parser, code moved to a named module, or other (report the counts per file); a line saved by condensing code
  that stays (joined statements, merged declarations) is a FAIL; `pnpm check:code-health` passes. Intent: room is made
  by moving code.
- **Q10. The fix's cases prove it (L0).** Outcome: run from the result's test files on `cb1cfe65`'s production code
  (`git archive` of `cb1cfe65` with the result's test files over it, made a git repository with one commit and given its
  own install), every case `dda8e020` added, apart from the compatibility rows the brief exempts, fails at an assertion
  on its E outcome, never at a missing module, export, helper, fixture or setup (list each), and passes on the result.
  Intent: the cases see the defects.
- **Q11. Nothing weakened (L1 of both briefs).** Outcome: across `git diff 57dad1c0 HEAD`, no test is removed,
  skipped, made conditional or lost an assertion; list every changed expected value, matcher, input or fixture of a
  test present at `57dad1c0` with before and after, and judge each (one the contract's C3 or C4 line form requires
  passes; anything else that weakens what a test exercises fails); the launcher's review, resume and claim tests pass
  on the result (run `scripts/agent-environment/codex-round.test.ts` alone and quote its summary). Intent: nothing was
  loosened to pass.
- **Q12. Reports against commands and cost (L2, L3).** Outcome: both runs' folders
  (`D:/fitway-temp/codex-round-58a64b69-6ef3-461d-9ac7-4460520447ce/` and
  `D:/fitway-temp/codex-round-e40f5755-2e65-42e0-820e-2822e7541bb4/`) record a successful `git commit` whose result
  header names that round's commit and a `node scripts/verify.mjs fast` after it with no later commit and no tracked
  write between them (quote each ladder's last line, and for a failing one the failing case and its rerun); any commit
  after `dda8e020` lies outside the runs and touches only the files its diff review's dispositions name; the contract
  test takes at most 60 s in three runs on this machine (each, median, range). Intent: the reports rest on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C D:/fitway-temp/tooling-cli-contract-grade/wt status --short` is empty at
  the end, and no commit is made there.

## Scope

You change no tracked file; everything you keep goes in `D:/fitway-temp/tooling-cli-contract-grade/`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each of Q1-Q12 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
