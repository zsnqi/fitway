<!-- brief-format: v1 role: verifier -->
# Verifier brief: Codex fix-2 (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `ac3ae02`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 8, 11, 12, 24, 26, 27 and 28 (read with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows GLO-12, CHT-15, STA-14,
  OWN-D7, OWN-D8, PH-1, PH-3 by row ID; the "Rules and findings" section of the working agreements on
  `codex/owner-redesign-r04` (`git show codex/owner-redesign-r04:docs/agent-context/WORKING_AGREEMENTS.md`; this
  branch's copy is older). Navigate code with `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`.

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

- Write only in `D:/fitway-temp/owner-r04-fix-2-verify/`; the coordinator checks `git status` in every worktree
  afterwards. A local server uses port 3177 only, or use `file://`. Render baselines from your own `git archive` of
  `5b75549` into your temp folder.

## What was delivered

`5855094..ac3ae02`, Codex answering
`design-research/owner-composition-exploration-r04/directions/briefs/codex-fix-2-review-436fe40.md` (outcomes K1-K8,
limits L1-L6). Read that brief for its outcomes only. The drawn target for K1 is the designer's copy at
`D:/fitway-temp/owner-r04-busiest-average/design-research/owner-composition-exploration-r04/directions/eclipse/`,
opened with `?avg=1`. Render your own frames; the implementer's evidence is not evidence.

## Checklist

Phone frames in a touch context (`hasTouch`, `isMobile`, real CDP touch events) at 390 × 844 and 320 × 568, AR and EN.

| ID | Check | Evidence required |
|---|---|---|
| V1 | Every outcome and limit of the fix-2 brief holds at `ac3ae02`, each graded on its own | per row: crop, measurement or command output |
| V2 | K4: measure the time from the finger's last movement to the reading on the finger's stop at 100, 500 and 1000 px per second, 390 and 320, AR and EN; say whether K4's literal text (every stop shown for a frame, and 250 ms) can be met at 60 Hz, and whether the result meets decision 27's intent as a person dragging would feel it | timings; one line of judgment |
| V3 | Held-out rows `D:/fitway-grader/owner-r04/fix-2-heldout.md` H1-H11, each graded on its own | per row: PASS, FAIL or NOT RUN with evidence |
| V4 | Composition: the phone card at 390 and 320 and the computer card at 721, 768 and 1440, AR and EN, in live, loading, closed and error, with today's hour and with the widest slots, read as a whole on the page (order, alignment, sizes, spacing), Arabic as an Arabic reader and English as an English reader; compare the phone card with the designer's `?avg=1` crops | numbered crops; one line each |
| V5 | Nothing outside the round's outcomes changed: Reports, Daily's other cards and the chart, and the sheet's other specimens, against `5b75549` | diff list with causes |
| V6 | Nothing stale, absent or loading looks live in any Daily state at 390 and 320 (item 8) | frames |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each, V3 one line per held-out row; for each FAIL a
hypothesis with `file:line` and whether the fault is in the code or in the brief it answered; what you could not run
and why; anything that reads or behaves wrong though it passes its check or meets its rule, with the rule named as the
suspect (WORKING_AGREEMENTS "Rules and findings"); the crop folder. At most 50 lines.
