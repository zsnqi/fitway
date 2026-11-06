<!-- brief-format: v1 role: codex -->
# Codex brief: the launch runs the brief's review and waits for its answers (owner-design-exploration-r04, launch-review)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-launch-review`, branch `owner-r04-launch-review`, HEAD `b7331e09`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47 and 48.
- **Read first, only these:**
  - `docs/agent-context/briefs/REVIEW.md`, the review the launch is to run;
  - `scripts/agent-environment/codex-round.mjs` and `scripts/agent-environment/codex-round.test.ts`;
  - `docs/agent-context/WORKING_AGREEMENTS.md` §"Delegation", how rounds are launched today.

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
- **Your temp folder** is `D:/fitway-temp/owner-r04-launch-review/`. Never run a real Codex review or round, and never
  write in `D:/fitway-temp/brief-review/`, where the coordinator's real reviews live: tests and trials use a stand-in
  for Codex and folders inside your temp folder.

## Goal

`pnpm codex:round <brief> <level>` never launches a round from a brief whose pre-launch review has not been run and
answered: it runs the review itself when none exists, refuses until every reading has a recorded answer, and then
launches as it does today.

## Causes and required outcomes

- **R1. The launch runs the review and waits for its answers.**
  - **Cause.** `REVIEW.md:14-17` says the launch command will run the review; today the coordinator runs it by hand
    (`REVIEW.md` §"Running it") and writes each reading's disposition in
    `D:/fitway-temp/brief-review/<brief>-<n>/dispositions.md`, while `prepareLaunch`
    (`codex-round.mjs:187-258`) checks the brief (`:189-198`) and never the review.
  - **Outcome.** For a launch (`codex:round <brief> <level>`):
    - with no review of that brief yet, it runs one exactly as `REVIEW.md` §"Running it" states (the brief alone,
      copied as `brief.md` into a new folder outside every git tree, the prompt of §"Prompt" read from `REVIEW.md`, the
      model and level that section names, read-only), in `D:/fitway-temp/brief-review/<brief file name without
      extension>-<n>/` with `n` one above the highest present; prints the folder, the readings and where to write their
      dispositions; and exits non-zero without launching;
    - with a review whose readings do not all have a disposition (closed, or left open with why), it names each reading
      without one and exits non-zero without launching;
    - with every reading of the newest review answered (or a review that found none), it launches as today and copies
      that review's readings and dispositions into the run folder, but only when the dispositions name the SHA-256 of
      the brief exactly as it launches (the coordinator closes readings by editing the brief, then writes that hash;
      the launcher prints the current hash whenever it refuses); a brief edited after its dispositions were written is
      refused until they name its new hash;
    - one option asks for a new review of the brief as it stands now, and then stops as in the first case;
    - a review that fails (Codex exits non-zero, or its answer cannot be read as readings) stops the launch, says why
      and leaves the folder for the coordinator.
    `resume` never runs or checks a review.
    The launcher never writes, changes or infers a disposition: only the dispositions file the coordinator writes
    counts.
  - **Intent.** No round starts from a brief whose review nobody read and answered, or from text the coordinator has
    not answered for. The coordinator still writes every disposition; the launcher only runs the review and refuses
    until each reading has one, and never decides one itself.
- **R2. Proof.**
  - **Outcome.** Tests in `codex-round.test.ts`, with a stand-in for Codex, cover each case of R1 (no review; a reading
    without a disposition; dispositions naming another hash; all answered; a review that found none; the new-review
    option; a failed review; resume untouched). For each refusal, removing only that gate from `codex-round.mjs` makes
    its test fail because the stand-in records a launch (a failure from setup or a missing function does not count);
    report how you checked each. `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** Each refusal is shown to fail when its gate is removed.

## Limits the result keeps

- **L1. Everything else about launching is unchanged.** The existing tests pass, apart from setting up the review an
  existing launch test now needs; no existing assertion is removed or loosened, and the number of tests does not fall.
- **L2. One copy of the procedure, unchanged.** The review's prompt and its command stay written in `REVIEW.md` only;
  the launcher reads them from there. The prompt, model, level and command stay as at the HEAD above; only
  `REVIEW.md`'s sentence about the launch running the review (`REVIEW.md:14-17`), its §"Running it" lines on where
  dispositions go, and `codex.md`'s B11 item change, to say what the launch now does.
- **L3. A clean tree.** `git status --short` is empty after your commit and after the fast ladder.

## Scope

You may change `scripts/agent-environment/codex-round.mjs` (must change), `scripts/agent-environment/codex-round.test.ts`,
`docs/agent-context/briefs/REVIEW.md` and `docs/agent-context/briefs/codex.md`; commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not
work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it, and the SHA it ran on. A
measurement you did not run is a FAIL, never a PASS. Then: the files you changed; the commit SHA;
anything you could not do; any hook message you did not act on. At most 25 lines.
