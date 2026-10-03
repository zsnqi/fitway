<!-- brief-format: v1 role: verifier -->
# Verifier brief: three options for Daily on the phone (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-daily-phone`, branch `owner-r04-daily-phone`, HEAD `1eb686b`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 10-13, 17-20, 24 (read with
  `git -C D:/Projects/fitway-worktrees/owner-r04-daily-phone show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/briefs/designer-daily-phone.md` (the question the
  options answer); `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows OWN-D1,
  OWN-D3, OWN-D7, OWN-D10, CHT-15, CHT-18, BAR-1, FOC-7 by row ID.

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

- Write only in `D:/fitway-temp/owner-r04-daily-phone-verify/`; the coordinator checks `git status` in every worktree
  afterwards. A local server uses port 3179 only (Codex holds 3173, 3176 and 3177; a reading-direction reviewer
  3178), or use `file://`.

## What was delivered

`b73c57c..1eb686b`: three options under
`design-research/owner-composition-exploration-r04/directions/options/daily-phone/` (1, 2, 3), each a copy of Eclipse
at `e675f1e` changed at 720 px and below. Render your own frames; the designer's crops are not evidence.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | Per option, at 390 × 844 and 320 × 568 (a touch phone's viewport), AR and EN: what the first screen shows, and whether the chart's plot is on it | frames; the plot's top and bottom against the bottom bar |
| V2 | A finger can move through the chart: emulate touch (`hasTouch`, real touch events through CDP, not mouse) for a slow horizontal drag, a quick flick, a tap, and a vertical swipe that starts on the plot; the reading follows stop by stop, a vertical swipe scrolls the page, nothing gets stuck | per option and gesture: the stops reached, page scroll delta, the state after lifting |
| V3 | While a finger reads the chart, the reading stays visible (not under the finger) and the page never shows a past reading as the current one (item 8) | frames mid-drag, AR and EN |
| V4 | Every fact Daily shows at `e675f1e` on the phone is still on the page or one action away (OWN-D3, OWN-D11) | a list per option against `e675f1e` |
| V5 | States: live, delayed, offline, no history, loading and error at 390 and 320, AR and EN: same card places and heights as live (OWN-D10), nothing spills or overlaps, nothing stale is lit | frames; height table |
| V6 | Keyboard and screen reader: the chart keeps its text equivalent; Tab, arrows, Home, End, Escape work; focus stays clear of the bar (FOC-7); reading order follows what the page shows first | tab order; accessibility tree |
| V7 | Every target is at least 44 px; no sideways scroll; no console error | measurements per option |
| V8 | 721 px and up are unchanged from `e675f1e` at 1440, 1024, 768 and 721, AR and EN | element geometry diff |
| V9 | The intro and first paint behave as at `e675f1e` at 390 (font wait cap, the page complete at first paint), checks 30 ms from any cap, to 500 ms after `endedAt`, under no-store and no cache header (G1, G3, G4) | timings |

## Report

The table per option (1, 2, 3) with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis
with `file:line`; what you could not run and why; anything that reads or behaves wrong on a phone though it passes
its check or meets its rule, with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"). Then, per
option, two plain sentences on how it reads on a phone. At most 50 lines.
