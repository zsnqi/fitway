<!-- brief-format: v1 role: verifier -->
# Verifier brief: variant 2 on the narrow sheet (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read Codex's report, its temp
folder or any notes before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `b6d6a5c`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only. The round is `8e2a7fc..b6d6a5c`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`; the brief the
  round answered, `directions/briefs/codex-narrow-sheet.md` (N1, N2, L1-L5 are your baseline); `DESIGN-SPEC.md` MOT-1
  and MOT-16 and README §"Motion" in `.../directions/eclipse/`. The previous review's probes are in
  `D:/fitway-temp/owner-r04-one-clock-review/` (reuse its probes, not its verdicts).

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

- Write only in `D:/fitway-temp/owner-r04-narrow-sheet-review/`; port 3178 only; baselines from your own
  `git archive bad6e90` of the folder. Keep a short `progress.md` there as you settle rows. Keep your context lean.

**Already known; do not report as findings:** the dialogs', popover's and records card's parts separating under a
planted stall (pre-existing, to be decided separately); raster noise that also differs between two baseline captures.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | N1: at 320 x 568, 360 x 640, 375 x 667 and 390 x 844, AR and EN, at 1x and 4x CPU, file:// and HTTP, no real-time frame of `?done=2` shows a rider's glyphs over the copy's glyphs, nor the file line over the action buttons' text | your probe, with `bad6e90` as control |
| V2 | The narrow sheet's moment read as a whole in real time: calm, the file line arriving where it rests, nothing clipped wrongly at rest | frames, your judgement |
| V3 | L1: 768, 1440 and the phone's `?done=0|1` unchanged from `bad6e90` within its noise; every other moment untouched | pixel comparison |
| V4 | L2, L3: timings within 30 ms of MOT-16; reduced motion, `?motion=off`, Escape at 40/150 ms and a second Export leave nothing at rest | traces, DOM audit |
| V5 | L4: full `motion-capture.mjs`, `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check`, `node --check` | commands |
| V6 | N2: MOT-16 and README describe the code | rows against code |
| V7 | The held-out rows below | each row's evidence, with its control |

**Held-out rows for V7** (written before the Codex round; each with a planted-defect control):

- H1. Every sheet height the phone can show, not only the brief's sizes: 360 x 640, 375 x 667, 414 x 896 and 320 x 480,
  AR and EN, `?done=2`, at 1x and under 4x CPU: no frame shows a rider's glyphs over the calendar copy's glyphs.
  Control: `809aa09` at 320 x 568.
- H2. 390 x 844 and 1440 x 900 frames of `?done=0|1|2` equal `809aa09` within its own noise (the fix touches only
  what was wrong).
- H3. The cut still reads as the moving edge on the narrow sheet: the copy's remaining part ends on a straight line
  that moves with the edge; nothing fades; gone at 90 % of the settling.
- H4. `git status --short` empty after the run; nothing written outside the folder and the temp folder.

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line` and a
severity; what you could not run; anything that reads or behaves wrong though it passes; the evidence folder. At most
25 lines.
