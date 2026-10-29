<!-- brief-format: v1 role: codex -->
# Codex brief: a moment's samples are compared whenever their frames are stable (owner-design-exploration-r04, midmotion-compare-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-midmotion`, branch `owner-r04-midmotion`, HEAD `e39225e6`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 42, 45, 46.
- **Read first, only these:**
  - `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-midmotion-compare.md`, the previous round,
    whose result is the HEAD above; its outcomes T1 and T4-T9 and limits L1-L4 still hold;
  - `.agents/skills/verify-fitway/SKILL.md` §"Compare", and `timeline.mjs` and `compare.mjs` beside it.

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

- **Your temp folder** is `D:/fitway-temp/owner-r04-midmotion-fix/`; your previous round's folder
  `D:/fitway-temp/owner-r04-midmotion/` (its archives, base CLI and `external-recipes.json`) is yours to reuse. You run
  in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that starts child
  processes with piped output (pnpm, Playwright, Node scripts that run git) fail inside it: request escalation for them
  from the first attempt, with a one-line justification. (agent-environment DECISIONS item 7)
- **Ports, hooks, the concept's three commits and the ways to open it** are as in the previous brief's Environment.
- **The coordinator's evidence** for the cause below is in `D:/fitway-temp/owner-r04-midmotion-evidence/` (read only).

## Goal

A real change inside a moment fails the timeline compare whenever the moment's frames are reproducible, even when a page
script runs during it; `NOT-HELD` is left for samples whose frames actually vary from one capture to the next; and
Daily's drive frame repeats byte for byte without changing the page.

## Causes and required outcomes

- **X1. A sample is marked not held because a callback ran, not because its frames vary.**
  - **Cause.** `.agents/skills/verify-fitway/timeline.mjs:662` marks a sample `not-held` whenever any authored callback
    was noted (`timeline.mjs:90-530`: a microtask, a finished promise, a timer, a frame callback), and
    `compare.mjs:346-349` then compares none of its pixels. So:
    - at `50097ff7` against `f96753fe`, Access's `pinChange` (Arabic, desktop, mouse, full motion, HTTP) has frames
      that differ at 1, 100, 200 and 300 ms, yet the command prints `TIMELINE INCOMPLETE: 0 equal; 0 different; 5 not
      held` and exits 0 (`real-ra1`), while the same feature at `f96753fe` against itself has byte-identical frames at
      every time in two runs (`self-pin-1`, `self-pin-2`); a microtask at `motion.js:399` is the noted source;
    - on Reports, `7e28c713` against `f96753fe` (Arabic, desktop), 61 of 116 samples are not held and 39 of those are
      byte-identical across the two builds (`r-fix-reports`); the samples that do vary within one build are the
      export's progress and done moments, moved by `reports.js:1859` (`r-self-export`).
  - **Outcome.** A sample is `NOT-HELD` only when its frames differ between two captures of the same build at the same
    time on the same side; every other sample is compared and reported `EQUAL` or `DIFFERENT`, whether or not a
    callback ran. The callback sources noted for any sample stay in `comparison.json`, and each `NOT-HELD` line names
    them as today. Equality keeps zero pixel tolerance.
  - **Intent.** A regression inside any reproducible moment fails the command; `NOT-HELD` is evidence that a sample
    varies, not a guess from the page's code.
- **X2. Proof on the real defect.**
  - **Outcome.** `50097ff7` against `f96753fe`, Arabic, mouse, full motion, HTTP, reports `TIMELINE DIFFERENT` at one or
    more times, and the command fails, for each of: Reports' `export-open`, `custom-period` and `status` at desktop,
    `rail` at tablet; Access's `pinChange` at desktop; Activity's `dates` at desktop. Reports' `export-open` at phone
    with touch reports no `DIFFERENT` (that sheet's pieces were not moved).
  - **Intent.** Every moment the real defect broke is caught, including those that run a script callback.
- **X3. The noise floor stays zero.**
  - **Outcome.** For every feature with actions on every page, in both languages, at desktop and phone, under full
    motion, over HTTP: `7e28c713` against itself reports no `DIFFERENT` in two of two runs, and `7e28c713` against
    `f96753fe` reports no `DIFFERENT` caused by the tool (a real difference is reported with its frames and source
    lines, as in the previous brief's T2). The report gives each page's `NOT-HELD` count and, for each `NOT-HELD`
    feature, the two captures that differ.
  - **Intent.** `EQUAL` is proof and `DIFFERENT` is a regression on every page the next refactor touches.
- **X4. What the previous round left unfinished.**
  - **Outcome.** The previous brief's T6 matrix is completed: without `--timeline`, the new CLI and the base CLI give
    the same result for every item (Reports and Access, both languages, desktop and phone, reduced motion, HTTP).
  - **Intent.** The ordinary compare is unchanged by both rounds.
- **X6. Daily's drive frame still alternates (F126).**
  - **Cause.** The previous round's T5 adds `.tuner {will-change: transform}` to Daily before capture
    (`runner.mjs:404-414`). At the HEAD above, 11 runs of the T5 command (`drive`, `7e28c713`, `index.html`, `page`,
    Arabic, phone, mouse, reduced motion, HTTP) wrote two different frames, 8 and 3, differing only in the Lights chip
    (`D:/fitway-temp/owner-r04-midmotion-evidence/h11-*`, and `h11-diff.png` there: left, middle, then the difference).
  - **Outcome.** The same command writes byte-identical frames in 11 of 11 runs, and in 11 of 11 again in a second
    batch of 11 started after the first ends. Neither `drive` nor `compare` adds a style, script, element or attribute
    to the page to reach it: the frame is the page as it is served (the comparison observers and the browser and
    screenshot options compare already uses stay allowed). If no such way exists, the report says what was tried and
    what each gave, and the injected style is removed.
  - **Intent.** A drive frame can be compared by its bytes, and it still shows what a user's browser shows.
- **X5. Proof.**
  - **Outcome.** `.agents/skills/verify-fitway/cli.test.mjs` (must change) gains a test, run by the fast ladder, in
    which a fixture whose moment runs a deterministic callback (a microtask or a timer) and differs only mid-motion is
    `DIFFERENT`, and a fixture whose callback makes its frames vary from capture to capture is `NOT-HELD`; the first
    fails on the HEAD above. The previous round's tests still pass. `node scripts/verify.mjs fast` passes on your
    committed, clean tree.
  - **Intent.** The classification is shown to fail when its defect returns.

## Limits

- **L1.** Only `.agents/skills/verify-fitway/**` changes; the concept, its recipes and every other worktree are untouched.
- **L2.** One page's run of X3 completes in one command; run page by page (F137).
- **L3.** `git status --short` is empty in your worktree after your commit and after the fast ladder.

## Scope

You may change `.agents/skills/verify-fitway/**`; commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not
work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; each page's `NOT-HELD`
count for X3; the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
