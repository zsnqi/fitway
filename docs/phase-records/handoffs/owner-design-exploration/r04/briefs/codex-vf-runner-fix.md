<!-- brief-format: v1 role: codex -->
# Codex brief: post-capture proofs tested and kept, the guide's exemption read per command, test roots in the system temp folder, and no fixed ports in tests (owner-design-exploration-r04, vf-runner-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-runner-ds`, branch `owner-r04-vf-runner-ds`, HEAD `54cb1ecb`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 66 and 67.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md`, whole;
  - `.agents/skills/verify-fitway/runner.mjs` lines 636-660 and 880-900;
  - `.agents/skills/verify-fitway/cli.test.mjs` lines 1905-1990, 2163-2300, 2781-2900 and 3149-3200;
  - `.agents/skills/verify-fitway/cli.mjs` lines 290-310 and 380-395;
  - `.agents/skills/verify-fitway/compare-speed.test.mjs` lines 1-60;
  - `.agents/skills/verify-fitway/compare-parallel.test.mjs` lines 1-60;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F183, F238, F239 and F240.

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
  starts child processes with piped output (pnpm, Playwright, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch, without Playwright Chromium or ui-forensics, and with a system temp folder given in its short
  8.3 form (`C:\Users\RUNNER~1\...`): every test you add passes there, and a proof that needs a real browser is a
  script in your temp folder, run and reported.
- **Your temp folder** is `D:/fitway-temp/owner-r04-vf-runner-fix/`. Real compares use ports 3188-3189 only; ports
  3174 and 3180 serve the user's preview: never stop a process you did not start. The concept to compare is the
  build branch `owner-followup-r04-build`'s folder `design-research/owner-composition-exploration-r04/directions/eclipse/`
  at `23314b3a`, taken with `git archive` and extracted outside every git tree. If a verify-fitway test fails in the
  fast ladder, rerun that file alone once and report both runs.

## Goal

The runner's proofs after each capture are held by tests and kept for every state an arrival does not end, the
guide test refuses an invented option anywhere unless one command's own syntax hands it to a tool, and the
verify-fitway tests share no folder and no port with any round or compare.

## Causes and required outcomes

- **W1. Post-capture proofs (F238).**
  - **Cause.** The runner proves each before-action rule again after the before frame (`runner.mjs:655-656`) and
    beside the after frame (`runner.mjs:891-897`), but no test fails with either removed; and since `3ac1770a` any
    `afterActions` rule on an item skips every before rule's proof beside the after frame (`runner.mjs:647-648`),
    though only the state the arrival ends changes with time.
  - **Outcome.** Each of those post-capture proofs, disabled in turn in the runner (the one after the before frame,
    the one before the after frame, the one after it), makes at least one fast-ladder test fail; on an item with an
    `afterActions` rule, every before rule except the ones that arrival ends keeps its proof beside the after
    frame, and a test fails when such a rule turns false after either capture; which before rules an arrival ends is
    declared in the recipe and written in `SKILL.md`, never inferred from timing, from a proof failing, or from the
    rules' order; a recipe whose `afterActions` rule declares no ended rule keeps every before rule's proof beside
    the after frame. The two V1 tests added in `3ac1770a` keep their assertions. On the concept, Reports
    `arrive=500` with `state=loading` and an arrival rule in the declared form (yours, in your temp folder, reading
    the page's loaded phase) is EQUAL in three self compares (Arabic and English, desktop and phone, 4 workers), its
    before frame showing loading and its after frame the loaded page; and a full self compare (every page,
    `--feature all`, Arabic and English, desktop, tablet and phone, reduced motion, 4 workers) gives the same
    verdict for every item as the CLI at `3ac1770a`.
  - **Intent.** A frame is accepted as a state only while that state is proven, and an arrival lifts the proof only
    of the state it was declared to end.
- **W2. The guide test's exemption (F239).**
  - **Cause.** The test of `SKILL.md`'s options (`cli.test.mjs:3157-3171`) exempts a line holding `pnpm`, or `measure`
    with "tool arguments", whatever the option's place; before "## Compare" the base `c699d3fb` refused every
    invented option, and `3ac1770a` lets such lines through.
  - **Outcome.** Every `--option` in `SKILL.md`, in prose, an inline code span or a fenced block, in any section, is
    one the CLI's `help` lists, with one exemption: a token after the ` -- ` separator of a `measure` command
    (`measure --tool <name> ... -- <tool arguments>`), where that command is read whole from one inline code span or
    one line of a fenced block, and the exemption is decided by that command's own tokens, never by other words on
    its line or paragraph; an option before the separator, in another command on the same line, or after a `--` of
    any other command is still checked. Every invented option the base's test refused is refused again, wherever in
    the guide it sits.
  - **Intent.** A reader of any part of the guide never meets an option that does not exist, and the only option the
    test does not check is one the CLI passes on to a tool unread.
- **W3. Test roots (F240).**
  - **Cause.** `compare-speed.test.mjs:23` and `compare-parallel.test.mjs:23` make each run's folder under a round's
    own temp folder, named in the code, and the speed test's cache root sits beside the runs, not in one.
  - **Outcome.** Each run of either file makes its folder with its cache inside it under the system temp folder
    (`os.tmpdir()`), removes it after the run whether it passes or fails, and names no path under `D:/fitway-temp`;
    two simultaneous runs of each file from two separate checkouts all pass, with disjoint folders, and leave none
    behind; a changed cache-root line still fails a test, as at `3ac1770a`.
  - **Intent.** No checkout, round or CI run writes into another's folder.
- **W4. Fixed ports in tests (F183).**
  - **Cause.** The CLI tests run commands on the default verification port (`cli.mjs:296-302`), so R21 and R22 fail
    while a compare holds 3176-3177.
  - **Outcome.** With every verification pair (3176-3177, 3186-3187, 3188-3189) held as a running compare holds it,
    a listener on each port and its lease, each verify-fitway test file passes in full, and no test binds, connects
    to or leases a port in 3174-3189; the CLI's options still accept only those three pairs from the command line,
    and every port test keeps its assertions.
  - **Intent.** A test run never fails, waits or blocks because a round compares on any pair.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional, the helpers and fixtures they use keep what they check (a change to one is reported
  with the outcome that needed it), and the suite runs at least as many tests as at the HEAD.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `.agents/skills/verify-fitway/runner.mjs` (must change), `.agents/skills/verify-fitway/cli.test.mjs`
(must change), `.agents/skills/verify-fitway/compare-speed.test.mjs` (must change),
`.agents/skills/verify-fitway/compare-parallel.test.mjs` (must change), `.agents/skills/verify-fitway/SKILL.md` and
other files under `.agents/skills/verify-fitway/`; commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for W1 each disabled
proof with the test that failed, each self compare's verdicts and the full compare's counts on both CLIs; for W2
each invented option you planted, where, and the result; for W4 how the pairs were held; the files you changed; the
commit SHA; anything you could not do; any hook message you did not act on.
