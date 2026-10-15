<!-- brief-format: v1 role: codex -->
# Codex brief: grade brief-ladder by running these checks (owner-design-exploration-r04, brief-ladder-grade)

- **Worktree:** `D:/fitway-temp/owner-r04-brief-ladder-grade/wt`, branch `grade-brief-ladder`, HEAD `166a4ba7`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 64, 67 and 72 of the milestone's DECISIONS file on
  the coordinator branch, at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-brief-ladder.md`, whole: the brief of the round you grade, which names that round's own worktree, base and Q1-Q2; your contract is G1-G7 below;
  - `docs/agent-context/briefs/codex.md` at your HEAD, its first 10 lines (the template's spelling of rows).

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
- **This round grades; it fixes nothing.** Keep scripts, plants and logs in
  `D:/fitway-temp/owner-r04-brief-ladder-grade/`. The base is the same files at `5b81b3b7`, taken with `git archive`
  outside every git tree. Briefs you plant point `brief:check` at a temporary git worktree you make under your temp
  folder (remove it at the end). Two other rounds run on this machine. In the fast ladder the two Git Bash tests of
  `codex-round.test.ts` may fail with `sed` or `dirname` not found (F237, fixed in another round): report them and
  read the rest.

## Goal

The coordinator knows, row by row, whether the delivered commit holds on checks its own run did not make.

## Causes and required outcomes

- **G1. A row missing at the named HEAD.** Outcome: a copy of
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-launcher-fixes-4.md`
  pointed at a worktree at `c699d3fb` fails `brief:check` with a `brief-references` line naming F182, and pointed at
  one at `5b81b3b7` passes on rows (any other failure listed). Intent: the case that slipped through now fails.
- **G2. Every spelling.** Outcome: `rows F240-F242` passes; `rows F240-F299` fails naming the first missing ID;
  `row F9999` fails; rows `F9999` (in backticks) and rows `F234, F9999` (one code span, the template's spelling) each
  fail naming F9999; an absolute path to findings.tsv naming `rows F234 and F246` is checked like the relative path;
  a row appended to the worktree's findings.tsv but not committed fails against the named HEAD; a mixed list
  (`F234`, F9999 and `F246`) fails naming F9999; a Markdown file whose table has a row F1 passes on `row F1` and fails
  on `row F2`; every failure names the ID, the file and the HEAD. Intent: no spelling escapes the check.
- **G3. Nothing else moved.** Outcome: every brief in
  `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/` at `5b81b3b7` gives the same `brief:check` lines
  with the base and the HEAD checker, apart from new row lines, each of which names a row truly absent at its own
  HEAD (list them). Intent: the new check adds only true failures.
- **G4. A failed step timed.** Outcome: `node scripts/verify.mjs fast` with a planted failing unit test prints the
  Unit tests end line with a duration and an exit code, a clock time with offset on every `==>` and `<==` line, and a
  last line still starting `FAILED_VALIDATION:`; `.agents/skills/gardener/round8b.test.ts` passes (the gardener still
  reads the ledger message). Intent: a failed ladder is read from its own output.
- **G5. The first mutation named.** Outcome: a planted unit test that writes an untracked file is named as the Unit
  tests step by the guard, with that moment's status line; with stand-in steps where one writes a file and a later
  one deletes it, the output names the first at the moment it wrote. Intent: the step that changed the repository is
  known.
- **G6. Limits.** Outcome: `git diff --stat 5b81b3b7 HEAD` lists only the files the round's Scope names;
  `verify.mjs`'s fast, phase and full step lists, order, arguments and environment equal the base's (print and diff
  them); no test present at `5b81b3b7` is removed, skipped or made conditional, none lost an assertion line, and no
  existing assertion's predicate or expected value changed (list each pre-existing test or helper whose body
  changed, with the change), and the collected test names equal the base's plus the new ones; each new Q1-Q2 case,
  run from the HEAD's test files on the base's production code, fails at the assertion on that outcome's behaviour
  and passes at HEAD. Intent: nothing was weakened to pass.
- **G7. Report against commands.** Outcome: the result's commit exists and is your HEAD; the round's run folder
  (`D:/fitway-temp/codex-round-0b658846-8e7e-41a8-a134-00cfd66c49f4/`) records the `git commit` and a
  `node scripts/verify.mjs fast` run after it, with their exit statuses quoted from the events, and the reported
  fingerprint seconds appear in that run's output. Intent: the report rests on what ran.

## Limits the result keeps

- **L1. Nothing tracked changes.** `git -C <worktree> status --short` is empty at the end, and no commit is made.

## Scope

You change tracked files only temporarily, for a plant, and restore each before the next; everything you keep goes
in `D:/fitway-temp/owner-r04-brief-ladder-grade/`. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each of G1-G7 and L1 as PASS or FAIL with the command and the output line that proves it, and for a FAIL the item or
input that failed; anything you could not run.
