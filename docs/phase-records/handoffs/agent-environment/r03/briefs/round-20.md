<!-- brief-format: v1 role: codex -->
# Codex brief: verify-fitway renders forced colours (agent-environment-r03, round 20)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r20`, branch `agent-environment-r03-r20`, HEAD `0d84bfbd`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 15, 20, 21.
- **Read first, only these:** `.agents/skills/verify-fitway/SKILL.md` §"Launch and drive", §"Compare" and §"Evidence
  and advanced tools", and the scripts beside it; the ui-forensics copy's `SKILL.md` and the 1.1.0 entry of its
  `CHANGELOG.md` (the copy is named under Environment).

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
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- If 3176 or 3177 is held by a process you did not start, never stop it; to prove an outcome on those ports, hold
  them with a process you start and stop it when done.
- A copy of the machine-level ui-forensics 1.1.0 is at `D:/fitway-temp/r03-r20-forensics/ui-forensics/`; you may
  change that copy. The machine-level skill under the user's profile is read-only. The CLI reaches a copy through
  `--forensics` (`.agents/skills/verify-fitway/cli.mjs:91`, `forensicsPath` at `cli.mjs:131-139`). Its browser
  self-test is `node <copy>/tests/web/selftest.mjs`, run with the worktree as the working directory (41 of 41
  controls passed there on the base).
- V3's concept is `design-research/owner-composition-exploration-r04/directions/eclipse` of `owner-followup-r04-build`
  at `ab504b28`, read from your own `git archive` in your run folder, never from its worktree; its recipes are there.

## Goal

A verifier can render any Owner page in Windows high contrast (forced colours) through verify-fitway, in frames and in
ui-forensics' measurements, so that the coming Owner CSS round proves its focus rings, control boundaries and
selected states survive that mode from rendered evidence.

## Causes and required outcomes

- **V1. No forced-colours axis.**
  - **Cause.** `drive` builds each context at `.agents/skills/verify-fitway/runner.mjs:245-258` with viewport, zoom,
    touch, reduced motion, colour scheme and locale, and never forced colours. The axes the CLI offers are listed at
    `cli.mjs:57`, and `compare` passes the same axes (`compare.mjs:196-197`).
  - **How the base fails.** It ignores an option it does not know. `drive --colors forced` on the build's Daily page
    (`ar`, `phone`, `mouse`, `reduce`, `http`) printed `DRIVE PASS` and captured normal colours.
  - **Outcome.**
    - `drive` and `compare` take a colours axis with the values normal and forced. Normal applies when the axis is
      absent.
    - Each item rendered under forced is captured with Chromium's forced-colours rendering active, proved on the page
      itself: the body's computed background is the forced palette's canvas colour, not the concept's `#070707`. The
      media query alone does not count.
    - Each item's manifest entry and its `FRAME` line name its colours value.
    - The axis combines with every existing axis and with states.
    - Under normal, frames come out byte-identical to the base's for the same item, and manifests differ only by the
      recorded colours value.
    - An unknown value of the axis is refused with a message.
  - **Intent.** A forced-colours frame is real forced rendering, and a run can never be mistaken for one: a run
    without the axis is visibly normal, never silently normal.
- **V2. ui-forensics cannot render forced colours.**
  - **Cause.** Every browser tool of the copy builds its context through `D:/fitway-temp/r03-r20-forensics/ui-forensics/scripts/web/_common.mjs:110-117` and
    `:229-243`, which have no forced-colours option. The CLI's `measure --tool focus|capture|probe|a11y|motion`
    delegates to those tools, so the copy's focus-ring measurement at every Tab stop cannot run in high contrast.
  - **Outcome.**
    - Every browser tool of the copy accepts a forced-colours option and records it in its output.
    - The copy's version is 1.2.0, with a CHANGELOG entry in the style of 1.1.0's.
    - Its browser self-test gains planted controls that pass. Under forced colours, a control whose only focus
      indication is a box-shadow with `outline: none` is reported without a visible ring, and a control with an
      outline ring is reported with one. The same two controls without the option are both reported with a ring.
    - Every earlier control still passes.
    - `measure` through the CLI reaches the option.
    - When the CLI is pointed at a ui-forensics without the option, such as the machine-level 1.1.0, any forced
      request fails with a message naming the version it needs, never with a normal-colour result. This covers
      `drive`, `compare` and `measure`.
  - **Intent.** Rings are measured, not eyeballed, in high contrast. Until the coordinator installs the copy, the
    machine-level 1.1.0 refuses clearly.
- **V3. Proven.**
  - **Outcome.**
    - A test for V1 and a test for V2's refusal, each failing on `0d84bfbd` and passing after, run in the fast ladder.
    - `pnpm test:verification` and `node scripts/verify.mjs fast` pass on your committed, clean tree, once with
      3176-3177 free and once with them held by a process you start.
    - `--port` still refuses everything except 3176-3177.
    - The copy's browser self-test passes every control.
    - On the build's concept with the copy:
      - `drive --colors forced` and `drive` without the axis, on `index.html` (`ar`, `phone`, `mouse`, `reduce`,
        `http`), produce visibly different frames, and the manifests name each value.
      - `measure --tool focus` under forced colours on `index.html` at desktop in English returns a result for each
        Tab stop. Report how many it finds without a ring; the count need not be zero, because the CSS round fixes
        them.
      - The ports are free afterwards.
  - **Intent.** The new axis and option are shown working on the real concept, and nothing that worked stops
    working.

## Scope

You may change `.agents/skills/verify-fitway/`, `.claude/skills/verify-fitway/` and the ui-forensics copy at
`D:/fitway-temp/r03-r20-forensics/ui-forensics/`. Commit the worktree's changes once, when done; the copy is not in
git. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the files you changed in the worktree and in the copy;
- the commit SHA;
- the number of Tab stops without a ring from V3;
- anything you could not do.

At most 30 lines.
