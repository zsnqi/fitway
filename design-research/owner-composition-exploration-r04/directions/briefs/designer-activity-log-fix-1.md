<!-- brief-format: v1 role: designer -->
# Designer brief: Activity log's fix round (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009). One round that designs and builds
the user's decisions on the first build and the review's findings; no options round. The user sees the result.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-daily-phone`, branch `owner-r04-activity`, HEAD `6899470`
  plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 11, 12, 16, 23, 31 and 32, and "How this milestone's rounds run" item 7 (this brief's commit brings the
  current copy).
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full.
  - `design-research/owner-composition-exploration-r04/directions/briefs/designer-activity-log.md`: the first
    round's brief; its hard limits still hold.
  - `D:/fitway-temp/owner-r04-activity-review/REPORT.md`: the review (F1-F4, O1-O6), with its frames beside it.
  - `packages/api/src/audit/list.ts` (`auditActorSchema`: the actor's `displayName`).
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows FLD-1 to FLD-7,
    DLG rows in §3.9, TYP-3, HDR-1, HDR-4, HDR-7, OWN-A1 to OWN-A10. Navigate with
    `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`.

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

- Run `pnpm check:design-context` and `pnpm context:show --milestone owner-design-exploration-r04` first. Impeccable
  is the one design skill; load no other design or taste skill. (AGENTS.md)
- A local server uses port 3176 only. Frames and scratch go under `D:/fitway-temp/owner-r04-activity-fix-1/`.

## What to do

Decision 32, each with its intent:
1. **No human count changes** (ADR-008): the synthetic log holds no human correction or reset; the count kind holds
   the nightly reset only and is renamed for what it holds (the coordinator suggested «التصفير» / "Resets"; better
   words welcome). No reason implies the gym counts people by hand.
2. **A date picker** replaces typing, on Activity log and on Reports' custom period: the owner picks a start and an
   end day with a finger or a mouse, in Eclipse's look, Arabic and English, a bottom sheet on the phone. Keyboard and
   screen-reader use must stay complete. Design the picker once and use it on both pages.
3. **A smaller phone title** on every page (Daily, Reports, Activity log), so «سجل النشاط» / "Activity log" keeps one
   line beside the widest status at 320-720 px in every state; the page never jumps when the status changes
   (review F1). Update TYP-3, HDR-4 and the components sheet's type scale with it; the status keeps its word.
4. **The reason search** opens from a magnifier icon button with a localized name, not "More filters". It searches
   only what the page shows (review O5).
5. **Calendar-date grouping:** records group by their calendar date in gym-local time; the 1:05 AM reset sits under
   the day it happened. Daily and Reports keep the business day.
6. **The owner's name:** an owner's record names the owner from the actor's `displayName`; synthetic data has two
   owner accounts.

The review's findings: F2 (a visible focus ring wherever focus lands) and O1 (the frame's green live status and
time sit right above "Last loaded" with a second time: resolve the composition so the page never reads as live and
the two times do not compete; the frame's status stays, item 7) must be fixed. F3, F4, O2, O3, O4 and O6 are low:
fix them unless a fix would cost the composition, and say which you left.

## Frames

As the first round (`designer-activity-log.md` §"Frames"): the designed and checked sizes, AR and EN, HTTP on 3176
and `file://`, every changed element against its whole range (the widest status, the longest and shortest dates and
months, a range across months and years, an invalid or reversed range, today, the picker's every state), in
`D:/fitway-temp/owner-r04-activity-fix-1/crops/` numbered the same way in both languages, and Reports' picker too.
Inspect every frame yourself and judge each changed element as a whole composition. (AGENTS.md; item 25 lesson)

Write only under `design-research/owner-composition-exploration-r04/directions/eclipse/` (not `tuner.js`) and commit.

## Report

Each of the six decisions and each finding in one line: what you did and its frame. Anything that reads wrong at any
width, state or language; any rule that made something read wrong, named (WORKING_AGREEMENTS "Rules and findings");
questions for the user. The crop folder, the files you changed, the commit SHA. At most 50 lines.
