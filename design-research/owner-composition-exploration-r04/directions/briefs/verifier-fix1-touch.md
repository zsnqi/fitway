<!-- brief-format: v1 role: verifier -->
# Verifier brief: Codex fix-1 and the phone touch trial (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `a223c82`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 5, 8, 11, 12, 16, 20 (its last paragraph is the trial), 21, 22, 23, 24 (read with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows CHT-15, CHT-18, OWN-D7,
  OWN-D10, FOC-7 by row ID.

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

- Write only in `D:/fitway-temp/owner-r04-fix1-touch-verify/`; the coordinator checks `git status` in every worktree
  afterwards. A local server uses port 3177 only (a reading-direction reviewer uses 3178), or use `file://`.

## What was delivered

Two rounds on `owner-followup-r04-build`: `e675f1e..f5f0e2d` (Codex, answering
`design-research/owner-composition-exploration-r04/directions/briefs/codex-fix-d21-d24.md`) and `f5f0e2d..a223c82`
(a builder, answering `design-research/owner-composition-exploration-r04/directions/briefs/builder-touch-trial.md`).
Render your own frames; the implementers' evidence is not evidence.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| H1 | Decision 22 reads right: at 721, 768 and 900 px, AR and EN, the peak's time visibly belongs to its own figure, and the Notes column's longer notes wrap without one word alone on a line | crops; distances |
| H2 | Decision 21 in every form (one day, one month, across months, the sheet's specimen), AR and EN: no dash and no doubled month or year wherever an empty period's sentence appears, spoken text included | text dump; crops |
| H3 | Decision 23: an Arabic table with one one-digit peak among two-digit ones lines its times up; an all-two-digit Arabic table is pixel-identical to `e675f1e` | spread; pixel diff |
| H4 | Every sentence a screen reader hears on Daily and Reports has no dash range inside it; standalone range values keep their dash (DO-NOT, item 12) | accessibility-tree text per page and state |
| H5 | Daily's median first paint is within 8 ms of `41a6f7c` per language and cache condition, and a long task (50 ms or more) appears in at most 1 load in 10, at `f5f0e2d` and at `a223c82` | 15 loads per cell |
| H6 | Reports' status control keeps one width for every time of day in every status from 721 px; Reports' header stays on one line at 1024 EN | widths; line count |
| H7 | The sheet's "Last 7 days" range reads in the same visual order as Reports' at 390, 768 and 1440, AR | measured order |
| H8 | Report only: the sheet's export-alert specimen overlapping the empty-state specimen at 320 and 390 | crop |
| H9 | The untracked `.impeccable/config.local.json` ignore covers only rule `border-accent-on-rounded` in `components.css` and hides no other finding | file and a detector run |
| T1 | Touch at 390 × 844 and 320 × 568 (real CDP touch events, `hasTouch`, `isMobile`), AR and EN: a swipe from the plot in any direction scrolls or does nothing and never reads; a hold then drag reads stop by stop with the page still; lifting returns the band to rest; every half hour, the peak and the latest reading are reachable | per gesture: stops reached, scroll delta, final state |
| T2 | While a reading is held or kept, "Inside now" never changes, the reading is clear of the finger, and nothing stale looks live in the delayed, offline, no-history and closed states | frames mid-hold |
| T3 | A tap keeps the reading with close, previous and next; each is 44 px or more, named in both languages, steps half an hour, and shows its limit at the day's first and last stops; a tap outside closes it; with a kept reading, scrolling and the bottom bar behave | measurements; accessibility names |
| T4 | Keyboard and screen reader on the phone: Tab order follows what the page shows, keys behave as CHT-15 says, the reading is announced, focus stays clear of the bar (FOC-7) | tab order; live-region text |
| T5 | The busiest-time card on the phone has its hours beside its title, in the same place; at rest nothing else on the phone moved except what follows from its shorter height | frames against `f5f0e2d` |
| T6 | 721 px and up: no layout or style change from `f5f0e2d`; the pixel differences at 721 and 1023 EN that the builder could not remove are sub-pixel only, or name what they are | element geometry; computed styles; diff crops |

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line`;
what you could not run and why; anything that reads or behaves wrong on a phone though it passes its check or meets
its rule, with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"). At most 50 lines.
