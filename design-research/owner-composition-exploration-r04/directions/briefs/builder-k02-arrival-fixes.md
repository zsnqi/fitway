<!-- brief-format: v1 role: builder -->
# Builder brief: K-02 arrival and retry fixes in all three options (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high). The decision is made; build exactly it.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `e8ce78f`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 1, 4, 8, 11, 12.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`;
  `design-research/owner-composition-exploration-r04/directions/briefs/designer-k02-reports-states.md` (how the
  options are opened); `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows K-02,
  STA-10…14 by row ID.

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

- Write frames only in `D:/fitway-temp/owner-r04-k02-fix/`. A local server uses port 3176 or 3177. (r04 G5)

## The decision

The user has not picked an option yet. On 2026-10-03 they asked that the defects the independent review found be
fixed now in all three options (A, B and C of `58d838b`), before they compare them. Nothing else changes: the
options keep every difference they have, including the ones still waiting on the user (B's lit pattern card, how
pending counts the partial day, B's waiting line under the period, and C's error sentence).

## Causes and required outcomes

- **R1.** When data arrives, the header's status control widens at 768 and up as the badge replaces the loading words,
  because the loading words' box does not hold the badge's width (`design-research/owner-composition-exploration-r04/directions/eclipse/reports.js:788`,
  `design-research/owner-composition-exploration-r04/directions/eclipse/style.css:982`). Outcome: from loading to arrival, and after a retry, the status
  control keeps its position and size at 1440, 1024 and 768, AR and EN, whichever status arrives; 390 and 320 stay
  as they are. Daily (the page `style.css` also serves) does not change: a Daily change is the user's call.
- **R2.** The error message is created empty (`design-research/owner-composition-exploration-r04/directions/eclipse/reports.js:1483`) and written 50 ms later
  (`design-research/owner-composition-exploration-r04/directions/eclipse/reports.js:1490`) with no room kept for it, so the focused retry button jumps down.
  In EN the retry button also widens when it reads "Trying again…". Outcome: the first painted frame of the error
  state shows the sentence and the button where they settle; nothing moves afterwards, in every option, width and
  language; the button keeps its width while it retries; assistive technology still announces the error.
- **R3.** In A and B, the loading placeholders for the peak's date and time (`design-research/owner-composition-exploration-r04/directions/eclipse/reports.js:1420`) are
  wider than the room at 1440 EN, overflow the card's content box, and do not sit where the arrived text lands.
  Outcome: at 1440, 1024 and 768, AR and EN, the placeholders sit inside the content box where the arrived date
  and time will be, so the arrival moves nothing.
- **R4.** The Arabic «قبل … دقيقة» (`design-research/owner-composition-exploration-r04/directions/eclipse/reports.js:159`) does not use Daily's minute rule, so it is
  right only for 13. Outcome: it follows the same rule as Daily for every count, and reads as now for 13.

Required unchanged: Reports without `option` (byte-equal renders to `51c8ece` at 1440, 768 and 390, AR and EN), Daily,
and every frame of every option except where R1-R4 change it.

## Frames

Render with the repository's `@playwright/test`, over HTTP from port 3176 and from `file://`, at 1440, 1024, 768,
390 and 320, AR and EN, in every option and state (01 live … 07 error). Save one first-screen PNG per frame at device
scale 2 as `D:/fitway-temp/owner-r04-k02-fix/frames/<a|b|c>/<NN-state>-<width>-<ar|en>.png`, and a full-page PNG at
390 as `…-390-<ar|en>-page.png`. Inspect every frame yourself before reporting; a passing check is not a looked-at
frame. (AGENTS.md)

## Scope

You may change `design-research/owner-composition-exploration-r04/directions/eclipse/reports.js`, `reports.css`
and `reports.html` in that folder, and `states-capture.mjs` there if the frames need it; commit when done. Do not
redesign beyond the decision; report anything that seems to need it. (CLAUDE.md)

## Report

Each outcome PASS or FAIL with its evidence; the frame folder; the files you changed; the commit SHA; anything you
could not do. At most 40 lines.
