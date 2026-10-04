<!-- brief-format: v1 role: verifier -->
# Verifier brief: Codex fix-3 (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md) Keep it narrow:
this is a small round, and its report decides only whether Daily and Reports go to the user's own phone.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `4e0be02`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 8, 26, 28 and 29 (read with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md`
  rows CHT-15, STA-14, OWN-D7 by row ID. Navigate code with
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

- Write only in `D:/fitway-temp/owner-r04-fix-3-verify/`; the coordinator checks `git status` in every worktree
  afterwards. A local server uses port 3177 only, or use `file://`. Render the baseline from your own `git archive` of
  `262b8b5` into your temp folder.

## What was delivered

`41de51d..4e0be02`, Codex answering
`design-research/owner-composition-exploration-r04/directions/briefs/codex-fix-3.md` (outcomes M1-M6, limits L1-L6).
Read that brief for its outcomes only. Render your own frames; the implementer's evidence is not evidence.

## Checklist

Phone frames in a touch context (`hasTouch`, `isMobile`, real CDP touch events) at 390 × 844 and 320 × 568, AR and EN.

| ID | Check | Evidence required |
|---|---|---|
| V1 | M1-M6 and L1-L3 hold at `4e0be02`, each graded on its own; for M3, whether the page stays still during a hold apart from the slide that decision 26 makes at the hold's start; for M4, which widths and states still differ in height | per row: crop or measurement |
| V2 | Held-out rows `D:/fitway-grader/owner-r04/fix-3-heldout.md` H1-H8, each graded on its own | per row: PASS, FAIL or NOT RUN with evidence |
| V3 | The computer card at 721 and 1440 AR and the sheet's busiest specimens read as a whole on their page, Arabic as an Arabic reader and English as an English reader | numbered crops; one line each |

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each, V2 one line per held-out row; for each FAIL a
hypothesis with `file:line`, its severity (high, medium, low) and whether the fault is in the code or in the brief;
anything that reads or behaves wrong though it passes, with the rule named as the suspect. At most 35 lines.
