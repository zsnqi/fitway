<!-- brief-format: v1 role: codex -->
# Codex brief: the timeline holds a press's release and the page's clock (owner-design-exploration-r04, vf-hold)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-hold`, branch `owner-r04-vf-hold`, HEAD `b7331e09`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 42, 47 and 48.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` §"Compare", and `timeline.mjs` and `compare.mjs` beside it;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F143 and F144;
  - `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md:682-713`, the round
    that found both.

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
- **Your temp folder** is `D:/fitway-temp/owner-r04-vf-hold/`. The coordinator's evidence for both causes is in
  `D:/fitway-temp/owner-r04-midmotion-fix-grade/` (read only).
- **The concept** you measure on is the Owner concept folder
  `design-research/owner-composition-exploration-r04/directions/eclipse/` of branch `owner-followup-r04-build` at
  `7e28c713` (the base). Take it from your own `git archive` of `D:/Projects/fitway-worktrees/owner-followup-r04-s04`,
  extracted into your temp folder; never write in that worktree, where another round works. Plants go in copies of
  your extract.
- **Ports.** The CLI accepts only 3176-3177 for compares, and other rounds use them now. Run no compare, drive or
  launch on them until `D:/fitway-temp/owner-r04-ports/free-for-vf-hold.txt` exists (the coordinator writes it when
  those rounds' compares end); until then write code and run the test suite, whose tests choose their own ports. Wait
  for the file with Monitor.

## Goal

`compare --timeline` compares the moments a press's release and the page's clock drive, as it compares the rest: a
change to either fails the command, and `NOT-HELD` is left for samples whose frames really vary.

## Causes and required outcomes

- **H1. A press's release is held (F143).**
  - **Cause.** In the first 200 ms after a control's activation, the pressed control (about 125 x 45 px) varies
    between two captures of the same side with no callback source, so those samples are `NOT-HELD` and their pixels
    are never compared: Access (`my-password`, `reset-password`, `password-refused`), Reports (`picker-export-choose`,
    `period-7d`, `minute-download`, `table-download`), Activity (`kind-count`, `kind-access`) and the components sheet
    (`language-ar`); evidence `h10-access-full` and its log in the folder above. The hold covers only what
    `document.getAnimations()` returns (`timeline.mjs:331-344`, `:370-372`) from the arming event on (`:373-391`,
    `:548-587`); the release fade (DECISIONS 42) is the suspect.
  - **Outcome.** `compare --timeline` of the base against itself, for every feature named above, Arabic and English,
    desktop, mouse, full motion, HTTP, with `--timeline-times` at 1 ms and every 20 ms from 21 to 401, reports every
    sample `EQUAL`, in two separate runs. A copy of the base whose release fade lasts 40 ms longer, against the base,
    is `TIMELINE DIFFERENT` at a time inside the first 200 ms after a release, for each of those features, and the
    command fails. The hold works for every control's press and release alike, never by feature or control name:
    the same plant is `DIFFERENT` on one control outside that list (Daily's tuner key or a rail tile), in its press
    and in its release.
  - **Intent.** The press and release a user sees on every control are compared, not skipped, and a change to them
    fails.
- **H2. The page's clock is held (F144).**
  - **Cause.** The timeline never holds the page's clock: `timeline.mjs:29` keeps the native `performance.now` to
    schedule its own due times (`:274`, `:286`, `:378`, `:599-607`), but the page's `performance.now`, `Date.now` and
    `Date` are never held, and only frame callbacks receive the held time (`:492`). So Reports' export run, timed from
    `performance.now` with 400 ms minimums, is `NOT-HELD` at 200-900 ms on both sides, and a copy whose wait is 560 ms
    instead of 400 is never `DIFFERENT`; the command exits 0 with `INCOMPLETE` (evidence `h4-timer` and its log).
  - **Outcome.** For a timeline item, every clock the page can read (`performance.now`, `Date.now`, `new Date()`,
    and the timestamps of the events and frame callbacks it receives) is the timeline's held clock from before the
    page's first script runs, through its start, the item's actions, waits and every capture, consistent with one
    another; only the CLI's own scheduling reads real time. Measured: the base against itself, every Reports feature whose action starts an export run, Arabic and
    English, desktop, mouse, full motion, HTTP, every sample `EQUAL` from 1 to 900 ms, twice; a copy whose export wait
    is 560 ms against the base is `TIMELINE DIFFERENT` and the command fails. On every feature with actions on the four
    pages (Arabic, desktop, mouse, full motion, HTTP), base against itself, no sample that the CLI at the HEAD above
    compares (`EQUAL` or `DIFFERENT`) is `NOT-HELD` under yours, whatever the page's total; report each page's
    `NOT-HELD` count under both CLIs.
  - **Intent.** A moment timed from the page's clock is compared like any other, so a change to its timing fails; and
    holding the clock makes no other moment less stable.
- **H3. Proof.**
  - **Outcome.** A new test file in `.agents/skills/verify-fitway/` (the fast ladder runs every `*.test.mjs` there since
    `b7331e09`), running the CLI's own `compare --timeline` on fixtures: a release that differs mid-fade is
    `DIFFERENT`; a moment timed from `performance.now` or `Date.now` that differs is `DIFFERENT`; a fixture whose
    frames really vary between captures is still `NOT-HELD`. Each test fails when its defect alone is put back
    (including the hold no longer being applied); report how you checked each. `node scripts/verify.mjs fast` passes on
    your committed, clean tree.
  - **Intent.** Each hold is shown to fail when it is removed, and real variation is still reported as such.

## Limits the result keeps

- **L1. The page is served as it is.** No style, script, element or attribute is added to the page beyond what the
  timeline already installs to hold time; a frame still shows what a user's browser shows.
- **L2. The comparison itself is unchanged.** Every sample the timeline compares keeps the HEAD's compared region and
  zero pixel tolerance: nothing is cropped, masked or left uncompared that the HEAD compares.
- **L2b. The ordinary compare is unchanged.** Without `--timeline`, the CLI's items and verdicts are the HEAD's;
  `cli.test.mjs` passes unedited.
- **L3. Only the timeline.** Only `.agents/skills/verify-fitway/timeline.mjs` and your new test file change; if an
  outcome needs another file, stop and report which and why. `SKILL.md` is not edited (another round edits it): your
  report gives at most five lines for its §"Compare", which the coordinator adds.
- **L4. A clean tree.** `git status --short` is empty after your commit and after the fast ladder.

## Scope

You may change `.agents/skills/verify-fitway/timeline.mjs` (must change) and add one test file beside it; commit once
when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not
work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it, and the SHA it ran on. A
measurement you did not run is a FAIL, never a PASS: run every one before you report. Then: H2's per-page `NOT-HELD`
counts; the lines for `SKILL.md`; the files you changed; the commit SHA; anything you could not do; any hook message
you did not act on. At most 30 lines.
