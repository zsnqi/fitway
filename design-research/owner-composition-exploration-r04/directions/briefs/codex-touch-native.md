<!-- brief-format: v1 role: codex -->
# Codex brief: touch-1, the phone's own scroll on Daily's chart, and the slide from the top (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-daily-phone`, branch `owner-r04-touch-fix`, HEAD `bd8bada`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 4, 7, 8, 20, 25 and 26 (26 is this round). That file lives on another branch: read it with
  `git -C D:/Projects/fitway-worktrees/owner-r04-daily-phone show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full (the
  user's bans); `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows CHT-15,
  FOC-7, OWN-D7 by row ID. Navigate code with
  `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`; "the folder" below is
  `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- Daily (`index.html` in the folder) opens from `file://` and over HTTP; the phone is 390 × 844 and 320 × 568 in a
  touch context (`hasTouch`, `isMobile`, real touch events through CDP), AR (`?lang=ar`, the default) and EN, with and
  without reduced motion; the computer is 721 px and up. Use port 3177 only; another Codex round works elsewhere on
  3176. The commit before the round, `bd8bada`, is the baseline; `e1837cf` is the one before decision 25.

## Goal

On the phone, a finger on Daily's chart scrolls and zooms the page as the phone does anywhere else, a held reading
moves stop by stop, and a hold never starts with the reading or the plot cut off at either edge of the screen.

## Causes and required outcomes

- **T1.** To make a drag after the hold start at the finger's first movement, `bd8bada` cancels the `touchstart` on
  the plot and moves the page itself (its own pan and fling, `PAGE_MOVE` in `app.js`). The page then scrolls on the
  plot unlike anywhere else, and a two-finger pinch that starts there no longer zooms. Outcome: a swipe, a flick and a
  pinch that start on the plot are handled by the browser exactly as on the cards; the page has no pan or fling of
  its own.
- **T2.** Without the cancel, Chromium reports no movement until the finger has moved about 15 px, and the reading
  then jumps several stops at once (the reason for T1's change). Outcome: after the hold, the reading moves at most one
  stop for each movement reported, in both directions, AR and EN, at 390 and 320, and reaches every stop. It may trail
  the finger (decision 26).
- **T3.** The slide of decision 25 brings the reading and the plot up from under the bottom bar only. When a hold or a
  tap starts with part of the reading area or the plot above the top of the screen, the reading stays hidden. Outcome:
  the page slides down once, as smoothly as it slides up, until both show in full; it never moves while the finger
  moves; with reduced motion it moves at once; nothing moves when both already show.
- **T4.** Outcome: a hold still starts the reading only after the finger has stayed still, and from then until it
  lifts the page does not scroll; a swipe that starts without a hold scrolls and reads nothing; a touch in the band
  above the plot scrolls and reads nothing (as at `bd8bada`).

## Limits the result keeps

- **L1.** Every frame from 721 px up, AR and EN, every Daily state, equals `bd8bada`. Render the baseline from your own
  `git archive bd8bada` in your temp folder.
- **L2.** The phone at rest, in every Daily state, equals `bd8bada`.
- **L3.** A tap keeps the reading with close, previous and next; previous and next move one half hour; a tap outside,
  close and Escape end it; Tab and the keys behave as CHT-15 says; all as at `bd8bada`.
- **L4.** `node tools/lint-spec.mjs` and `node tools/check-index.mjs` from the folder pass (both pass at `bd8bada`);
  `node --check` passes on every `.js` and `.mjs` in the folder.
- **L5.** DESIGN-SPEC row CHT-15 and the README describe what is built. Do not edit OWN-D7 or any row about the
  busiest-time card: another round changes them; report anything OWN-D7 should say. INDEX.md is regenerated with the
  command written at its top.
- **L6.** One commit on `owner-r04-touch-fix`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

You may change, in the folder: `app.js`, `index.html`, `style.css`, the `*capture.mjs` scripts whose checks the
outcomes change, `DESIGN-SPEC.md` (CHT-15 only), `README.md` and `INDEX.md`; commit once when done. Everything else is
read-only. Add no dependencies. Do not redesign beyond the outcomes. If an outcome cannot be met, do not work around it:
finish and measure the others, then stop and report. (r04 B3)

## Report

Each outcome (T1-T4, L1-L6) as PASS or FAIL with the command and the output line that proves it; for T1, what you could
and could not prove about pinch in emulation; for T2, the stops the reading passes through on a slow drag across the
day at 390 AR; for T3, frames before and after the slide in `D:/fitway-temp/owner-r04-touch-1/crops/`; every frame that
differs from `bd8bada` and why; the files you changed; the commit SHA; anything you could not do; anything an outcome
or decision produces that reads wrong, with the decision named.
