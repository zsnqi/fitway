<!-- brief-format: v1 role: codex -->
# Codex brief: states that change with time captured, test roots of their own, and the whole guide held to the CLI (owner-design-exploration-r04, vf-runner)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-runner-ds`, branch `owner-r04-vf-runner-ds`, HEAD `c699d3fb`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 47.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md`, whole;
  - `.agents/skills/verify-fitway/runner.mjs` lines 600-700 and 860-910;
  - `.agents/skills/verify-fitway/cli.test.mjs` lines 3060-3090;
  - `.agents/skills/verify-fitway/compare-speed.test.mjs` lines 1-40;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F168, F175 and F176.

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
  with no other branch, and without Playwright Chromium or ui-forensics: a proof that needs a real browser is a
  script in your temp folder, run and reported.
- **Your temp folder** is `D:/fitway-temp/owner-r04-vf-runner-ds/`. Real compares use ports 3188-3189 only; ports 3174
  and 3180 serve the user's preview, and other rounds use other ports: never stop a process you did not start. The
  concept to compare is the build branch's folder at `c2fe4661`, taken with `git archive` and extracted outside every
  git tree, the result's CLI against itself where a self compare is named. Another round runs compares here: if a
  verify-fitway test fails in the fast ladder, rerun that file alone once and report both runs.

## Goal

The CLI captures a state that changes with time, its timing tests no longer share a fixed folder, and its guide's
whole text is held to the CLI's options.

## Causes and required outcomes

- **V1. A state that changes with time (F175).**
  - **Cause.** The runner proves the before-action rules, captures, then proves them again (`runner.mjs:648-654`), so
    Reports' `arrive=500` with its declared companion `state=loading` fails on both sides once the payload lands
    (about 0.9 s) and the loading proof turns false.
  - **Outcome.** That item is captured on both sides: its before frame proven to show loading at the moment of
    capture, and its arrival proven by reading the arrival itself (the page's own loaded phase): a predicate false in
    the loading capture and true only after an observed transition; a transition forced between the loading proof and
    the capture, in a test, never yields a pass; a self compare of it, Arabic and English, desktop and phone, three runs with 4 workers,
    is EQUAL every time; a state that does not change with time is still proven after its capture as before; a full
    self compare (every page, `--feature all`, Arabic and English, desktop, tablet and phone, reduced motion, 4
    workers) gives the same verdict for every item as the HEAD's CLI.
  - **Intent.** An arrival can be checked like any other state, and a capture taken after the state changed is still
    never accepted as that state.
- **V2. Test roots of their own (F168).**
  - **Cause.** `compare-speed.test.mjs` and `compare-parallel.test.mjs` write under a fixed folder
    (`compare-speed.test.mjs:23`), and the speed test moves the cache root by a string replace that silently does
    nothing if its line changes.
  - **Outcome.** Each run of either file works in a folder no other run shares and removes it after; two
    simultaneous runs of each file, from two separate checkouts, all pass with disjoint scratch and cache folders; a change to the cache root's line that the replace no longer finds fails
    a test instead of passing silently.
  - **Intent.** Two worktrees running the ladder at once never collide.
- **V3. The whole guide held to the CLI (F176).**
  - **Cause.** The test that refuses an option the CLI lacks reads `SKILL.md` only before "Evidence and advanced
    tools" (`cli.test.mjs:3075`); the same option planted after it passes.
  - **Outcome.** An option the CLI lacks fails the test wherever it is planted in `SKILL.md`: every option passed to the
    CLI in any command is checked, and an option is exempt only as an argument the command passes to an allowlisted
    non-CLI executable, judged per command, not by section or position.
  - **Intent.** A reader of any part of the guide never meets a CLI option that does not exist.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional, and the suite runs at least as many tests as at the HEAD.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `.agents/skills/verify-fitway/runner.mjs` (must change), `.agents/skills/verify-fitway/compare-speed.test.mjs`
(must change), `.agents/skills/verify-fitway/compare-parallel.test.mjs`, `.agents/skills/verify-fitway/cli.test.mjs`
(must change) and other files under `.agents/skills/verify-fitway/`; commit once when done. Everything else is
read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others,
then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for V1 each run's
verdicts and the full self compare's counts on both CLIs; the files you changed; the commit SHA; anything you could
not do; any hook message you did not act on.
