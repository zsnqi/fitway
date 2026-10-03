<!-- brief-format: v1 role: designer -->
# Designer brief: Daily arranged for the phone (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009): superseded Owner Paper frames are
reference only. This round shows the user options and stops; a builder builds the pick.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-daily-phone`, branch `owner-r04-daily-phone`, HEAD `e675f1e`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 10-13, 17-20, 24 (read the file with
  `git -C D:/Projects/fitway-worktrees/owner-r04-daily-phone show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`;
  item 20 is this round's question in the user's words).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows OWN-D1, OWN-D3, OWN-D4,
  OWN-D7, OWN-D8, OWN-D10, OWN-D11, CHT-12, CHT-15, CHT-18, BRK-4, BAR-1, HDR-4, FOC-7 by row ID. Navigate code with
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
- A local server uses port 3178 only; Codex works on the build worktree on 3173, 3176 and 3177. Write frames only in
  `D:/fitway-temp/owner-r04-daily-phone/`.

## The open question

How should Daily be arranged on a phone? Today, at 720 px and below, Daily is the desktop page stacked in one column
(OWN-D7, OWN-D8). The user (DECISIONS item 20) finds it works but reads as the desktop design squeezed onto the phone,
and wants an arrangement made for the phone in the same visual language, not a new design. The problems seen at 390:

- The chart, the page's core (OWN-D1, OWN-D4), starts below the first screen.
- On a phone the owner cannot move through the chart easily. On a computer the mouse runs across it and the tooltip
  follows each stop (CHT-15); a finger has no comparable way to move through the day.
- The busiest-time card spans the width with its value in half of it.
- At rest the tooltip lane (CHT-18) leaves an empty band above the plot.
- At 320 EN the legend takes three lines, and the coverage rows in "View details" wrap two different ways (item 24).

Frames of today's page at 390, both languages: `D:/fitway-temp/owner-r04-daily390-f193046/grid-390-screens.png`.

## Constraints

- `DO-NOT.md` binds in full. Items 1 (look), 4 (motion), 7 (frame: compact header, glass bottom bar, 44 px targets),
  8 (truthful states), 10-13 and 17-19 (wording) bind as written.
- Item 5 (tooltip in a fixed top lane, moving sideways only) and CHT-15's input were decided on a computer. An option
  may depart from them on the phone only, and must name what it departs from and why; the user decides.
- Every fact Daily shows today stays reachable on the phone (OWN-D3, OWN-D11); an option may move or fold it, not
  drop it. The chart keeps its text equivalent and keyboard input. No visitor data of any kind (AGENTS.md).
- 721 px and up must not change.

## Deliverable

Three genuinely different options, each a working copy of Eclipse at
`design-research/owner-composition-exploration-r04/directions/options/daily-phone/<n>/` (copy the eclipse folder, then
change only what the option needs), designed at 390 and checked at 320, AR and EN, in the live, delayed, offline and
no-history states. For each option, number the crops the same way, under
`D:/fitway-temp/owner-r04-daily-phone/<n>/`: `01` first screen AR, `02` the rest of the page AR, `03` first screen
EN, `04` the rest EN, `05` and `06` a finger exploring the chart (three frames along one drag, AR and EN), `07` and
`08` delayed and offline at 390 AR, `09` and `10` the first screen at 320 AR and EN. Add one sheet per option that sets
01-06 side by side. No recommendation is needed; say where an option breaks.

Commit the three option folders once when done.

## Report

Per option: one line on the idea in plain words, its sheet and crop paths, how a finger moves through the chart, and
where it breaks. Any rule or decision that makes an option read wrong, named (WORKING_AGREEMENTS "Rules and
findings"). The files you changed; the commit SHA. At most 40 lines.
