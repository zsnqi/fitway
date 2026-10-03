<!-- brief-format: v1 role: builder -->
# Builder brief: K-02 decided, build option A with C's error state (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high). The decision is made; build exactly it.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `7eb4006`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 3, 7, 8, 12, 14.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows HDR-3, HDR-6, STW-1, STW-2,
  STA-9…14, K-02, K-38 by row ID; `design-research/owner-composition-exploration-r04/directions/eclipse/README.md:739`
  (how the options and states are opened). Navigate code with `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`.

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

- Write frames only in `D:/fitway-temp/owner-r04-k02-build/`. A local server uses port 3176 or 3177. (r04 G5)

## The decision

DECISIONS.md item 14, read in full. The user picked from the frames of `1a4b497`:
`D:/fitway-temp/owner-r04-k02-fix/frames/a/` (option A, every state) and
`D:/fitway-temp/owner-r04-k02-fix/frames/c/07-error-*.png` (C's error state). The two answers of 2026-10-03 (year
once; the outline fits the text) were given on `D:/fitway-temp/owner-r04-k02-fix/frames/c/07-error-390-ar.png` and
`D:/fitway-temp/owner-r04-k02-fix/crops/focus.png` (in each pair, upper = before `1a4b497`, lower = after).

## Causes and required outcomes

- **R1.** Reports still carries three options and a switch (`design-research/owner-composition-exploration-r04/directions/eclipse/reports.html:11`,
  `design-research/owner-composition-exploration-r04/directions/eclipse/reports.js:37`, `design-research/owner-composition-exploration-r04/directions/eclipse/reports.js:1387`,
  `design-research/owner-composition-exploration-r04/directions/eclipse/reports.css:673`). Outcome: Reports has one behaviour, option A's, in every state
  and at every width, including A's 320 title row (K-38); its error state is C's (one page-level sentence in place of
  the cards). `?option=` no longer exists; `?state=` and `?arrive=` work as before. No code, style or capture path for
  B or C remains.
- **R2.** The error sentence writes both dates with their year (`design-research/owner-composition-exploration-r04/directions/eclipse/reports.js:1524`).
  Outcome: when both dates share a year, it appears once, at the end, as the header writes the period:
  «تعذّر تحميل القراءات من 26 أغسطس إلى 22 سبتمبر 2026», and English in the header's English date form. A period
  that spans two years writes each date's year, as the header does for such a period. If the header has no rule for
  that case, stop and report it.
- **R3.** Daily's status control has no reserved width: the loading words' box (`design-research/owner-composition-exploration-r04/directions/eclipse/style.css:982`)
  and `renderStatus` (`design-research/owner-composition-exploration-r04/directions/eclipse/app.js:700`) let it change size. Outcome: on Daily, from 721 px, the
  status control keeps its place and size from loading to arrival and through every status change, as Reports' does
  since `1a4b497`; 720 px and below stay as they are.
- **R4.** The reserved box is drawn whole: the hover and open fill (HDR-3) and the focus ring cover the widest
  status's width, so a short status shows empty space inside them (`design-research/owner-composition-exploration-r04/directions/eclipse/reports.css:682`).
  Outcome: on both pages, from 721 px, in every status, anything the control draws (the fill on hover and while open,
  the focus ring, and any edge a status has at rest) fits the current status with HDR-3's own padding, and the
  pointer target is the drawn control, at least 44 px tall (DECISIONS item 7). The reserved width stays, so nothing
  beside the control moves when the status changes.

Required unchanged: every Reports frame at `?state=` equals A's frame of `1a4b497` except where R2 and R4 change it,
and 07 error equals C's except for R2 and R4; Reports with no `?state=` and Daily at rest equal HEAD at 1440, 1024,
768, 390 and 320, AR and EN. List every frame that differs and why.

Update DESIGN-SPEC.md rows HDR-3, HDR-6, STW-2, K-02 and K-38, and README.md:739, to what is built. Regenerate
INDEX.md with the command written at its top.

## Frames

Render with the repository's `@playwright/test`, over HTTP from port 3176 and from `file://`, at 1440, 1024, 768,
390 and 320, AR and EN: Reports in every state (01 live … 07 error) and Daily in every state its capture covers.
Save one first-screen PNG per frame at device scale 2 as
`D:/fitway-temp/owner-r04-k02-build/frames/<reports|daily>/<NN-state>-<width>-<ar|en>.png`, a full-page PNG at 390
as `…-390-<ar|en>-page.png`, and crops of the status control at rest, hover and focus, at 1024 and 768, AR and EN,
for Closed, Live and Error on Reports and Closed and Live on Daily, in `D:/fitway-temp/owner-r04-k02-build/crops/`.
Inspect every frame yourself before reporting; a passing check is not a looked-at frame. (AGENTS.md)

## Scope

You may change, in `design-research/owner-composition-exploration-r04/directions/eclipse/`: `reports.js`,
`reports.css`, `reports.html`, `app.js`, `style.css`, `index.html`, `states-capture.mjs`, `capture.mjs`,
`DESIGN-SPEC.md`, `README.md` and `INDEX.md`; commit when done. Do not redesign beyond the decision; report anything
that seems to need it. (CLAUDE.md)

## Report

Each outcome PASS or FAIL with its evidence; the frame and crop folders; every frame that differs from its baseline
and why; the files you changed; the commit SHA; anything you could not do. At most 40 lines.
