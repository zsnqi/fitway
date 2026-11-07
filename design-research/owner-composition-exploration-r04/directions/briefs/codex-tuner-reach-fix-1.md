<!-- brief-format: v1 role: codex -->
# Codex brief: the light tuner costs the page nothing and stays under the finger (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `1305c0ee`
- **Milestone:** `owner-design-exploration-r04`. Decisions: "How this milestone's rounds run" items 3 and 9 in
  `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show HEAD:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/briefs/codex-tuner-reach.md`
  (the round this repairs; its outcomes T1-T3 and limits L1-L5 still hold) and, in the folder below, `README.md`
  §"Light tuner". "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Your temp folder is `D:/fitway-temp/owner-r04-tuner-reach-fix-1/`. You run in the workspace-write sandbox with
  automatic approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- The ways to open and measure the page are those of `codex-tuner-reach.md` (`file://` and HTTP on port 3176 only,
  both languages, the five sizes, motion on, reduced and `?motion=off`). The baselines are `f3c19d15` (before the
  round) and `1305c0ee` (the round), each from your own `git archive` of the folder, with no stored tuner spot.

## Goal

The tuner stays reachable on every screen, as the round made it, while costing Daily's motion nothing and staying
where the user tapped it.

## Causes and required outcomes

- **F1. The tuner's work follows every page change.** `tuner.js:374-383` calls `place()` on every scroll, every
  body resize and every attribute change anywhere in the page, and each call with the panel closed reads every page
  control's box (`tuner.js:301-316`). Daily's motion changes attributes on every frame, so on the computer, where the
  default spot never needs to move, a one-second pointer sweep over the chart reads boxes about a hundred times more
  often than at `f3c19d15`. Outcome: with the tuner closed and motion on, during the first-open intro and a pointer
  sweep over the chart at 1440 and 1024, and a scroll at 390 and 320, the page's layout work per frame and its frame
  times are within the run-to-run spread of `f3c19d15` (tuner on) over three runs each. Intent: the tool never slows
  the page it tunes; the user judges Daily's motion with the tuner on.
- **F2. The toggle jumps when the panel opens.** The toggle sits on the unit's inline-start side and `place()`
  measures the open unit, so on the phone in Arabic the closed toggle at the screen's left moves to its top right
  when tapped. Outcome: at every width and in both languages, the toggle's box is the same before opening, while
  open and after closing, unless the user moves it; the open panel still meets T2. Intent: what the user taps stays
  under the finger, and the toggle that closes the panel is where it was.

## Limits the result keeps

- **L1.** T1-T3 and L1-L5 of `codex-tuner-reach.md` hold, measured as that round measured them.
- **L2.** With the tuner open and a page layer open (the header status popover at 1440), Escape closes the page
  layer first, as at `1305c0ee`.

## Scope

You may change, in the folder, `tuner.js`, the light-tuner block of `style.css`, `README.md` §"Light tuner", and
`INDEX.md` regenerated with the command at its top; commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Report

Each outcome and limit PASS or FAIL with the command and output line that prove it, F1 with its numbers beside the
baseline's; files changed; the commit SHA; anything you could not do. At most 25 lines.
