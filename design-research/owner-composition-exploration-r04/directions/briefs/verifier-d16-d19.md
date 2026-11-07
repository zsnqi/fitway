<!-- brief-format: v1 role: verifier -->
# Verifier brief: decisions 16-19, K5, Daily's held status width, the 320 badge (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `f193046`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 3, 9, 11, 12, 16, 17, 18, 19 (read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:<path>`).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows TBL-1, TBL-9, TBL-12,
  GLO-4, GLO-10, STA-3, HDR-6, SPC-6 by row ID. Navigate code with
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

- Write only in `D:/fitway-temp/owner-r04-d16-19-verify/`; the coordinator checks `git status` in every worktree
  afterwards. A local server uses port 3177 only. (r04 G5)

## What was delivered

`41a6f7c..f193046` on `owner-followup-r04-build`, answering
`design-research/owner-composition-exploration-r04/directions/briefs/builder-d16-d19.md` (outcomes T1, T2, C1, C2, K5,
S1, S2). Render your own frames, and your own baseline from `git archive 41a6f7c`; the builder's frames are not
evidence.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | English: every numeric column of Reports' day table, Daily's minute table and the sheet's tables starts at its left edge, header and figures on that edge; Peak times line up across rows with one-, two- and three-digit peaks; no-readings words start on the same edge (decision 16) | measured edges at 1440, 1024, 768, 390, 320; crops |
| V2 | Arabic: with a three-digit peak the peak times line up; with two-digit peaks every Arabic table frame equals `41a6f7c` (decision 16) | spread in px; pixel diff |
| V3 | The table slots hold when the fonts arrive late: with fonts held to first paint + 50 and + 100 ms, then released, the final geometry equals the unheld page and the shift is reported (G2) | layout-shift entries and final edges |
| V4 | Daily has no "The line" row; the usual day, D6's rows and the line's name read as decisions 17, 18, 19 and D6's R2 everywhere they appear: legend, coverage card, no-history form, tooltip, minute table column, screen-reader text, component sheet | text dump of each surface, AR and EN |
| V5 | Reports: the export dialog has no description and no `aria-describedby` and is still named by its title; "Last 7 days" without enough readings and the export failure read as decision 19, and fit their cards at 320 | accessibility tree; crops at 1440, 390, 320 |
| V6 | K5: the sheet's single-day specimen uses the pages' own row and cells, and stays inside its card at 320, AR and EN, overlay and classic scrollbars | DOM source of the cells; measured overrun |
| V7 | S1: Daily's status control keeps one width as the latest reading moves through the day (early morning, late morning, evening, last hour), and Daily's header stays on one line at 1024, 1200 and 1279 EN | widths per time; header line count |
| V8 | S2: at 320 AR and EN, every Reports state, overlay and classic scrollbars, the status badge keeps at least 8 px from the title | measured gap table |
| V9 | Nothing else moved: every frame of Daily (all capture states), Reports (no `?state=` and every state) and the sheet equals `41a6f7c` at 1440, 1024, 768, 390, 320, AR and EN, except where V1-V8 change it | list of differing frames with the cause of each |
| V10 | Daily's first-open intro and first paint are unchanged from `41a6f7c` (font wait cap, intro length), under `no-store` and with no cache header, checks 30 ms from any cap and running to 500 ms after `endedAt` (G1, G3, G4) | timings, both builds |
| V11 | No console errors and no sideways scroll on any page at any width, AR and EN, classic and overlay scrollbars | list per page |

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line`;
what you could not run and why; anything that reads or behaves wrong though it passes its check or meets its rule,
with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"). At most 50 lines.
