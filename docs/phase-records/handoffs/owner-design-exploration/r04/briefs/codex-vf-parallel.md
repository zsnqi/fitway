<!-- brief-format: v1 role: codex -->
# Codex brief: compares that run side by side (owner-design-exploration-r04, vf-parallel)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-parallel`, branch `owner-r04-vf-parallel`, HEAD `3faea886`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47 and 48.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` §"Compare", and `compare.mjs`, `compare-runtime.mjs`, `baseline-cache.mjs`,
    `cache-lock.mjs`, `core.mjs` and `cli.mjs` beside it;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F126, F137 and F147.

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
- **CI** runs the fast ladder on Windows without Playwright Chromium or ui-forensics (`.github/workflows/checks.yml`):
  every test you add passes there. A proof that needs a real browser is a script in your temp folder, run and reported.
- **Your temp folder** is `D:/fitway-temp/owner-r04-vf-parallel/`.
- **The concept** you measure on is the Owner concept folder
  `design-research/owner-composition-exploration-r04/directions/eclipse/` of branch `owner-followup-r04-build` at
  `7e28c713` (the base) and at the commit named in `D:/fitway-temp/owner-r04-ports/shared-frame-result.txt` (the
  result). Take each from your own `git archive` of `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, extracted
  into your temp folder; never write in that worktree, where another round works.
- **Ports.** Another round measures on 3176-3177 now. Run no compare, drive or launch on any port until
  `D:/fitway-temp/owner-r04-ports/free-for-vf-parallel.txt` exists; until then write code and run the test suite,
  whose tests choose their own ports. Wait for the file with Monitor. Change no Windows network setting.
- **A known instability.** On the base, Daily's Lights chip on the phone lands half a pixel apart between captures in
  some runs (F126), with the HEAD's CLI and older ones alike: a full compare of the base against itself can show one
  to three such items `DIFFERENT`. Where an outcome below allows it, such an item is rerun once and reported.

## Goal

Two or three rounds measure at the same time, each on its own pair of ports, and one compare spreads its work over
several workers, so a round's full check takes a fraction of today's time; every verdict is the one a single compare
on one pair gives.

## Causes and required outcomes

- **P1. A port pair per round.**
  - **Cause.** `core.mjs:317-322` and `cli.mjs:100-102` and `:329-351` accept only 3176 and 3177, so a second compare
    cannot start while one runs.
  - **Outcome.** `compare` takes its two ports as one of exactly three pairs, 3176-3177, 3186-3187 and 3188-3189, and
    refuses any other port or a mixed pair with a message naming the pairs; `drive`, `doctor` and `launch` accept the
    ports of those pairs and nothing more. A command whose port is in use by another command refuses at once and names
    the pair, never shares it. Measured: two compares started together on two pairs (Reports and Access,
    `--feature page --states all`, Arabic and English, desktop, tablet and phone, reduced motion, mouse, HTTP, the
    base against itself), then three on the three pairs (Activity added), all finish, each with the verdicts it gives
    alone, and their browser captures overlap in time (each capture's start and end in their records show it); a
    fourth started on a pair in use is refused.
  - **Intent.** Rounds measure side by side without touching each other's previews, and the ports of the user's
    previews (3174 and 3178-3185) stay out.
- **P2. Workers inside one compare.**
  - **Cause.** `compare.mjs:210-235` captures the pages one after another, and each page's two sides in turn.
  - **Outcome.** `compare` has an option for the number of workers, 1 by default, that captures at the same time
    within the command's own pair. For every worker count it accepts and every configuration the CLI supports, the
    items, their order in `comparison.json`, their verdicts and failures and the summary lines are 1 worker's.
    Measured: with 4 workers, `compare --page all --feature page --states all`, Arabic and English, desktop, tablet and
    phone, reduced and full motion, mouse, HTTP, `--baseline-cache off`, the base against itself, takes the same 1,224
    items as with 1 worker and gives each the same verdict; likewise the result against the base; and each 4-worker
    run takes at most half the wall time of the 1-worker run of the same command, both run alone on this machine. An
    item may be rerun once only when its difference lies inside Daily's Lights chip on the phone (F126); after its
    rerun it gives 1 worker's verdict. Any other difference, or one that persists, fails P2. With 4 workers,
    `--timeline` of Reports' `export-open` and `period-7d` (Arabic, desktop, mouse, full motion, HTTP) gives every
    sample the verdict 1 worker gives.
  - **Intent.** A round's full check costs a fraction of today's time, and parallel load never changes a verdict or
    makes a capture less stable: a sample `EQUAL` with 1 worker is never `DIFFERENT` or `NOT-HELD` with 4.
- **P3. Kept captures reach any later run that takes the same item (F147).**
  - **Cause.** `baseline-cache.mjs:153-185` keys a page's kept captures on the whole option set, the baseline port
    included, so a rerun with fewer axes, or on another pair, captures every item again.
  - **Outcome.** A kept baseline capture is reused by any later compare that takes the same item with the same
    baseline inputs, on whichever pair and with whichever other items. The inputs are every one vf-speed's key reads
    today (the pages' loaded bytes, the recipes, the CLI files, the browser build, the capture settings); that list may
    grow and never shrinks, and only the port and the run's other items leave the key. Measured, each with every verdict equal to a
    `--baseline-cache off` run of the same command: Reports' P1 command on 3176-3177, then on 3186-3187 (no baseline
    capture taken), then with `--languages ar --sizes phone` only (none taken); and two compares with the same baseline
    started together on two pairs both finish, neither reading a kept bundle the other is writing.
  - **Intent.** A rerun during work costs its result side wherever and however narrowly it runs, and a kept frame still
    never stands in for a baseline that changed in any way the frame could show.
- **P4. Proof.**
  - **Outcome.** A new test file in `.agents/skills/verify-fitway/`, running the CLI's own `compare`, shows on fixtures:
    a port outside the pairs, a mixed pair and a pair in use are refused; 4 workers give the items, order and verdicts
    of 1; a kept capture is reused across pairs and by a narrower rerun, and not after a baseline byte changes; two
    compares writing the same kept item at once leave one whole bundle. Each test fails when its defect alone is put
    back; report how you checked each. `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** Each choice above is shown to fail when its defect returns.

## Limits the result keeps

- **L1. Today's compare is unchanged.** On 3176-3177 with 1 worker and the cache off, the CLI gives the HEAD's items,
  verdicts and failures in every configuration it supports; `cli.test.mjs`, `compare-speed.test.mjs` and
  `timeline-hold.test.mjs` pass unedited.
- **L2. Only the tool.** Only `.agents/skills/verify-fitway/**` changes; `SKILL.md` changes only in §"Compare" and
  its lines about ports. No measurement list shrinks: the recipes keep every feature (Daily 44, Reports 31, Access 46,
  Activity 30, the components sheet 14), and the full compare keeps 1,224 items.
- **L3. A clean tree.** `git status --short` is empty after your commit and after the fast ladder; scratch files live
  in your temp folder; the kept captures stay under 10 GB.

## Scope

You may change `.agents/skills/verify-fitway/**` (`.agents/skills/verify-fitway/compare.mjs` (must change),
`.agents/skills/verify-fitway/core.mjs` (must change), `.agents/skills/verify-fitway/baseline-cache.mjs` (must
change)); commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not
work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it, and the SHA it ran on. A
measurement you did not run is a FAIL, never a PASS: run every one before you report. Then: P2's wall times with 1
and 4 workers; every F126 rerun; the files you changed; the commit SHA; anything you could not do; any hook message you
did not act on. At most 30 lines.
