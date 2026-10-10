<!-- brief-format: v1 role: verifier -->
# Verifier brief: the press as one pattern, and the review fixes' last rows (owner-design-exploration-r04)

For a fresh `owner-direction-verifier` (Opus, high). Verify independently: do not read the implementer's rationale or
handoff before recording your own result, and never edit what you verify. (CLAUDE.md) That means: do not open
`D:/fitway-temp/owner-r04-press-hook/`, `D:/fitway-temp/owner-r04-css-fixes/` or the Codex reports before your table
is written. This is a short pass: measure by code, and open frames only where a check asks for your eye.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `eb18b17a`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only. Two rounds are under review: the
  review fixes `c1cd84ab..3b673daa` and the press refactor `348ca375..eb18b17a`.
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 41, 42 and 43, and "How this milestone's rounds run"
  items 4 and 11; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/briefs/codex-css-review-fixes.md` (D1-D5, its section
    §"Causes and required outcomes");
  - `design-research/owner-composition-exploration-r04/directions/briefs/codex-press-hook.md` (P1-P5, its section
    §"Cause and required outcomes", and §"Limits the result keeps");
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows MOT-1, MOT-11, MOT-20,
    STA-16 and FOC-8;
  - the verify-fitway guide, `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write only in `D:/fitway-temp/owner-r04-press-review/`, and set `PROBE_OUT` inside it before running the folder's
  tools; the coordinator checks `git status` in every worktree afterwards. (r04 G5)
- **Tools, read only,** from the coordinator's worktree `D:/Projects/fitway-worktrees/owner-design-exploration-r04` at
  `ac163b3a` or later: the concept CSS check (`D:/Projects/fitway-worktrees/owner-design-exploration-r04/scripts/check-concept-css.mjs`)
  and the verify-fitway CLI. Its held-press
  capture counts a hover as a press (F115): measure held looks with your own mouse hold, after the hover has settled.
  Ports 3176-3177 only. Port 3180 serves this worktree to the user's phones: leave it running.
- **Baselines:** your own `git archive` of the concept folder at `c1cd84ab`, `3b673daa` and `348ca375`, outside every
  git tree, inside your folder.
- Keep a short `NOTES.md` in your folder, so a fresh verifier can take over if you are cut off.

## What was delivered

1. **The review fixes** (`3b673daa`): no ring on a region that only script focuses, in forced colours; no ring on
   either list after a pointer press; a dialog cap without division; the long-name recipe in Arabic; the README's held
   chalk paragraph.
2. **The press refactor** (`eb18b17a`): a new control gets the press with one `data-press` attribute naming its kind,
   and a control's own shadow no longer repeats the press layer. The refactor's own measurement found one difference
   from `348ca375`: on the phone menu, 60 ms after release, 27 corner pixels differ by at most 5 levels; its base
   captures showed no noise.

**Already known; do not report as findings:** the concept CSS check's six findings, all on regions that only script
focuses; F112 (full-motion `compare` noise on Daily's status popover); F115.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | After the retry on Daily, Reports and Activity, in forced colours, no script-focused region paints an outline, AR and EN, 1440 and 390; every Tab stop still has its ring (`measure --tool focus --colors forced`, five pages, both languages, both sizes) | forced frames, base `c1cd84ab` as control; focus matrix |
| V2 | After a mouse choice on Activity's person list, Tab moves on and the next stop shows its ring; Shift+Tab back shows the list's ring; arrow keys on the focused list still filter. Same on Reports' sort | key runs |
| V3 | 1024×768 with insets top 24 and bottom 20: Reports' export dialog fits and its body scrolls; 844×390 with sides 47 and bottom 21: Access's PIN-change dialog's actions are reachable, AR and EN | measured boxes |
| V4 | Following only the one step MOT-20 states, add to a copy of the components sheet, outside the folder, a button, a segment option, a chalk primary and an icon button with new class names: each shows its kind's press held and nothing at rest. The same additions at `348ca375` show none | frames, pixel comparison |
| V5 | In a copy, give `.rbtn`, a segment option and a chalk primary a new hover `box-shadow` without any press layer: held, each still lights, and the light is gone 100-160 ms after release. At `348ca375` the same planted rule loses the light | traces |
| V6 | Twenty controls across the five pages: rest, held, and 60 ms and 200 ms after release equal `348ca375`, AR 1440 and EN 390; the phone menu's release frame, the one known difference, looked at by eye at full size beside the base's | pixel comparison; one crop you judge |
| V7 | Disabled and Working controls, a plot and the tuner show no press; `-webkit-tap-highlight-color` matches `348ca375` on every element; each page registers a touch listener; in forced colours held keys equal `348ca375`; with reduced motion and `?motion=off`, held has no scale and the release is instant | computed styles; frames |
| V8 | Every moment that moves a control at full motion still runs as at `348ca375`: the export's done states, Daily's status popover, the records' arrival, the retry, the dialogs' open and close. The refactor puts a CSS animation with `!important` on every pressable control | frame strips side by side, at 1440 AR; your judgement |
| V9 | `compare` at rest, reduced motion, every page and the sheet, AR and EN, desktop, tablet and phone, against `348ca375`: EQUAL | command output |
| V10 | The concept CSS check reports only its six findings; `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check`, `node --check` on every script and the CLI's `drift` pass | commands |
| V11 | The press reads as one clear pattern a production developer could copy: say whether MOT-20 and README §"Motion" are enough to apply it, and name anything fragile in `style.css` §"the press" | code read, `file:line` |
| V12 | `git status --short` is empty in the build and coordinator worktrees after your run | command output |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line` and a
severity (high, medium, low); what you could not run and why; anything that reads or behaves wrong though it passes
its check, with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"); the evidence folder, with
the frames the coordinator should open first. At most 40 lines.
