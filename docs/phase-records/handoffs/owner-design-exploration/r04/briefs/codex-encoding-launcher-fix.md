<!-- brief-format: v1 role: codex -->
# Codex brief: every brief's IDs found, the Git Bash guard through pnpm, and two silent test gaps (owner-design-exploration-r04, encoding-launcher-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-encoding-launcher`, branch `owner-r04-encoding-launcher`, HEAD `ba84fd20`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 56 and 62.
- **Read first, only these:**
  - `scripts/agent-environment/codex-round.mjs` lines 72-140, 322-345, 700-725 and 800-825;
  - `scripts/agent-environment/codex-round.test.ts` lines 320-350, 1060-1110, 2510-2535 and 2790-2830.

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
  with no other branch: every test you add passes there.
- **Your temp folder** is `D:/fitway-temp/owner-r04-encoding-launcher/`. Another round works in another worktree on
  this machine: start no preview, compare or Codex process of your own. If a verify-fitway test fails in the fast
  ladder, rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L2.

## Goal

The gaps the grading of `ba84fd20` found are closed: the launcher waits for the IDs every brief defines, the Git Bash
guard holds through the command people run, and two tests stop passing without checking.

## Causes and required outcomes

- **G1. Most briefs yield no IDs.**
  - **Cause.** `outcomeIdsFromBrief` (`codex-round.mjs:705-723`) needs the bold to close right after the ID
    (`- **K1.**`), while the briefs write the ID and a title inside one bold (`- **K1. A reading's own lists.**`); so
    `codex-launcher-fixes-3.md` and `codex-deepseek-route.md` yield none and would be refused at launch.
  - **Outcome.** A bullet starting `- **`, then capital letters and digits, then a full stop counts its ID, whether the
    bold closes after the ID or after a title, outside the environment block and fenced code. Every brief in
    `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/` then yields its IDs, for example D1-D6 for
    `codex-deepseek-route.md`, K1-K3 with L1-L2 for `codex-launcher-fixes-3.md` and R1, R2, T2 and T5 for
    `codex-tuner-removal-continue.md`; a test pins each brief's exact set of IDs, and a brief with none is still refused.
  - **Intent.** The launcher waits for what each brief asks, and launches every brief that defines outcomes.
- **G2. The Git Bash guard through pnpm.**
  - **Cause.** `runningInGitBash` (`codex-round.mjs:72-92`) looks only at the launcher's parent process, which is
    pnpm when the command is `pnpm codex:round`, so `pnpm codex:round resume <run> --message "/api"` from Git Bash is
    not refused; the test (`codex-round.test.ts:2795-2830`) starts node directly.
  - **Outcome.** From Git Bash, `--message` is refused naming `--message-file` whether the launcher is started by
    `pnpm codex:round`, `pnpm -s codex:round` or `node` directly; from PowerShell and cmd it is not; one table-driven
    test runs all five through the repository's real `codex:round` script.
  - **Intent.** The guard holds for the command the coordinator actually types.
- **G3. A read through a child process before the place check.**
  - **Cause.** With `git show <head>:<source>` run and its result ignored ahead of `reviewSourcePlan` in
    `copyReviewSources` (`codex-round.mjs:803-823`), every test still passes.
  - **Outcome.** That plant makes at least one test fail because it observed the read, as the file-read plants do;
    report the failing test's name.
  - **Intent.** A source read before its place is decided fails CI whatever program reads it.
- **G4. The 8.3 test passes without checking.**
  - **Cause.** "expands an 8.3 TEMP for Codex and leaves other values unchanged" (`codex-round.test.ts:2517-2533`)
    returns early as passed when its folder has no short name, which is always the case on this machine's drive D.
  - **Outcome.** The test checks the expansion on the first path it finds with a short name, probing every available
    drive; it is reported as skipped, naming the drives probed, only when none offers one; it never passes without
    checking.
  - **Intent.** A green run means the expansion was checked.

## Limits the result keeps

- **L1. Today's behaviour elsewhere.** Every existing test keeps its assertions and still runs, none skipped,
  excluded or made conditional beyond G4; launch, `resume` and the review keep their arguments, files and exit codes.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`
(must change) and files under `scripts/agent-environment/fixtures/codex-round-reviews/`; commit once when done.
Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for G1, each brief's
IDs; the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
