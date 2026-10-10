<!-- brief-format: v1 role: codex -->
# Codex brief: verify-fitway's messages, full-motion compare and shared ports (agent-environment-r03, round 30)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r30`, branch `agent-environment-r03-r30`, HEAD `356515f2`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 15, 20.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` §"Launch and drive" and §"Compare", and the scripts beside it;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F045, F046, F112, F119.

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
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- If 3176 or 3177 is held by a process you did not start, never stop it; to prove an outcome on those ports, hold
  them with a process you start and stop it when done.
- The concept is `design-research/owner-composition-exploration-r04/directions/eclipse` of the branch
  `owner-followup-r04-build` at `d1a01f3c`. Read it from your own `git archive` into your run folder, never from that
  branch's worktree; it holds its `verification-recipes.json`. The machine-level ui-forensics is 1.3.0.

## Goal

The CLI's keyboard messages say plainly where focus stopped, a full-motion compare of a commit against itself reports
equal, and the fast ladder passes whatever another worktree's verify-fitway session holds.

## Causes and required outcomes

- **V1. Where focus stopped quotes a whole page (F045).**
  - **Cause.** `.agents/skills/verify-fitway/runner.mjs:595` writes "Keyboard focus stopped at <selector> (<text>)"
    with the focused element's text cut to 120 characters, so focus on the body quotes the page's text.
  - **Outcome.** The message names the focused element by its selector and its accessible name (or role when it has
    none), never by its text content, and says when focus is on the page itself rather than on a control.
  - **Intent.** A reader sees which control focus reached in one glance.
- **V2. Two failure statuses read alike (F046).**
  - **Cause.** The statuses `not-reachable` and `keyboard-unreachable` (`runner.mjs:372`, `:589`) and the summary at
    `:661` do not say how they differ.
  - **Outcome.** Each status's message and the summary say what failed: the state or feature could not be reached at
    all, or the feature works by pointer but a keyboard user cannot reach it. Existing manifests' status values keep
    their meaning; any renamed status is documented in SKILL.md.
  - **Intent.** A reader knows from the summary alone whether the defect is the recipe or keyboard access.
- **V3. A full-motion compare differs against itself (F112).**
  - **Cause.** `compare` with `--motions full` on Daily's status feature (Arabic, desktop, mouse) reported `COMPARE
    DIFFERENT` for the base against the base in 2 of 2 runs, with regions in the popover
    (`D:/fitway-temp/owner-css-grade/x5-status-base-vs-base-1/comparison.json`).
  - **Outcome.** Comparing a commit with itself reports equal for every feature and state the recipes cover, under
    `--motions full` as under `reduce`, in five of five runs; a real visual change inside a moving feature (a planted
    colour change in the popover) still reports different under `full`.
  - **Intent.** A full-motion difference can be read as a regression.
- **V4. Concurrent sessions break the ladder (F119).**
  - **Cause.** On 2026-10-11, while another worktree's verify-fitway session held 3176-3177, `node scripts/verify.mjs
    fast` failed its CLI contracts in three rounds' worktrees, and passed in each once the ports were free; the
    failing test was not captured. The cause is unknown.
  - **Outcome.** With a verify-fitway session from another worktree serving on 3176 and on 3177, `pnpm
    test:verification` and `node scripts/verify.mjs fast` pass, and so do they with the ports free and with them held by
    a process the test run starts; every port behaviour the tests check today is still checked.
  - **Intent.** Two rounds can verify at the same time.
- **V5. Proof.**
  - **Outcome.** Each of V1-V4 has a test run by the fast ladder that fails on `356515f2` and passes after, or for V3 and
    V4 the commands and runs that show it, with the failing test of V4 named. Drive runs without these changes
    write frames byte-identical to the base CLI's. `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** Each fix is shown to fail when its defect is planted.

## Scope

You may change `.agents/skills/verify-fitway/`; commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- V4's cause, in one or two lines;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
