<!-- brief-format: v1 role: verifier -->
# Verifier brief: the export's settle on one clock (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read Codex's report, its temp
folder or any notes before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `809aa09`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only. The round is `75f42f1..809aa09`
  (WIP `dbee42d` holds the edit; `809aa09` records Codex's verification).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; the brief
  the round answered, `directions/briefs/codex-one-clock.md` (its outcomes C1-C3 and limits L1-L4 are your baseline);
  in `.../directions/eclipse/`, `DESIGN-SPEC.md` MOT-1, MOT-15, MOT-16 and README §"Motion". The previous review's
  frames are in `D:/fitway-temp/owner-r04-three-rounds-fix-review/` (yours to reuse: its probes, not its verdicts).

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

- Write only in `D:/fitway-temp/owner-r04-one-clock-review/`; port 3178 only; render with the worktree's
  `@playwright/test`; baselines from your own `git archive aef7437` of the folder. Keep your context lean: measure by
  code, open frames only where judgement needs them, downscaled.

**Already known; do not report as findings:** the «22» mark's 1 px raster offset exists at `aef7437` already; raster
noise that also differs between two baseline captures; the published concept lacks `tuner.js`.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | C1: under 4x CPU and a planted 100 ms stall, real-time recordings at 1440, 1024 x 768, 768 x 1024 and 390 x 844, AR and EN, `?done=0|1|2`, file:// and HTTP: every part's offset from the panel's edges equals the 1x no-load moment at the same progress within 1 px; the sheet's copy still within 1 px; no text over text | your own probe, with `aef7437` as its control |
| V2 | At 1x with no load the moment is unchanged from `aef7437` (timings within 30 ms of MOT-16, frames within baseline noise) and feels the same in real time | traces, videos you watch |
| V3 | The mechanism is sound: no animation left paused or running at rest, none leaking into other moments; interrupting (Escape at 40 and 150 ms, a second Export, closing the tab's visibility mid-moment) ends cleanly; nothing runs after the moment | DOM and `document.getAnimations()` audit |
| V4 | C3: MOT-15, MOT-16, README and the code comments describe what the code does | rows against code and a planted stall |
| V5 | L2-L4: reduced motion and `?motion=off` instant with the same end; `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check`, `motion-capture.mjs` (full) and `node --check` pass | commands |
| V6 | Every other page and moment untouched | pixel comparison against `aef7437`, with its noise |
| V7 | The held-out rows below | each row's evidence, with its control |

**Held-out rows for V7** (written before the Codex round; each with a planted-defect control):

- H1. The phone sheet at 320 x 568 (not named in the brief), AR and EN, `?done=2` and `?done=0`, under a planted
  100 ms main-thread stall: the calendar copy stays still on screen within 1 px, and no part leaves the panel.
  Control: the HEAD fails it at 390 under 4x CPU.
- H2. The dialog's opening and closing (MOT-9) and the period dialog under the same stall: report whether their
  parts separate; if the round changed them, they must hold together within 1 px and keep their frames at 1x.
- H3. At 1x, with no stall, every frame of `?done=0|1|2` at 1440 and 390 AR equals the HEAD within the noise between
  two HEAD captures (the fix changes nothing a normal machine shows).
- H4. Reduced motion and `?motion=off`: instant, end state equal to the HEAD's; nothing left at rest after an
  interrupted moment (Escape at 40 and 150 ms, a second Export).
- H5. MOT-16, README §"Motion" and the code comment say on which thread the settle runs, and it is true (checked with
  a planted stall).
- H6. `git status --short` empty in the build worktree after the run; nothing written outside the folder and the
  temp folder.

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line` and a
severity; what you could not run; anything that reads, feels or behaves wrong though it passes, with the rule named
as the suspect; the evidence folder and the videos to watch first. At most 35 lines.
