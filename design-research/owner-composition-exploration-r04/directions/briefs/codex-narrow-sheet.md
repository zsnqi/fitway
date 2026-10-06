<!-- brief-format: v1 role: codex -->
# Codex brief: variant 2 on the narrow sheet, text never over text (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `bad6e90`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 36, 37 and 38, and "How this milestone's rounds run" items 9 and 11; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; your
  two previous briefs `directions/briefs/codex-three-rounds-fix.md` (F1) and `codex-one-clock.md`, and their commits
  `ce3f07e`, `dbee42d`, `809aa09`; in the folder below, `README.md` §"Motion" and `DESIGN-SPEC.md` rows MOT-1, MOT-15
  and MOT-16. Navigate code with `INDEX.md`. The review's frames named below are in
  `D:/fitway-temp/owner-r04-one-clock-review/`; read no report or notes there. "The folder" is
  `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- Your temp folder is `D:/fitway-temp/owner-r04-narrow-sheet/`. You run in the workspace-write sandbox with automatic
  approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- Sizes: the phone's sheet at 320 x 568, 360 x 640, 375 x 667 and 390 x 844 (touch contexts), and 768 x 1024 and
  1440 x 900 for the limits; AR (`?lang=ar`, the default) and EN; `reports.html?done=2` unless a limit names another;
  `file://` and HTTP. Use port 3176 only.
- Render every baseline from your own `git archive bad6e90` of the folder in your temp folder. Every bound below is a
  rule or a measure you take at that baseline.

## Goal

At 320 x 568, variant 2's file line glides up across the calendar copy while the sheet's top edge is still cutting it
from above, so for a few frames (about 60-80 ms into the moment) the file line's glyphs land on the calendar's digits
(`out-plain-320-head.png`, frames from `rt/plain/head-320-d2/f022-f023`). It is visible at 1x with no load, and it was
there before your two previous rounds (`out-plain-320-base.png`). At 390 x 844 the same moment is clean
(`out-plain-390-head.png`).

## Causes and required outcomes

Each outcome states its intent; where the literal text and the intent disagree, say so in the report instead of
choosing. Find the cause yourself at the HEAD (the likely one: on a short sheet the distance the file line rises is
longer than the part of the copy the top edge has cut by then) and say which it is.

- **N1. Text never runs over text on the sheet.** Intent (MOT-1; MOT-16 variant 2, where on the sheet the copy stays
  still and the top edge coming down cuts it): what rises with the lower edge only enters space the cut has already
  cleared, at every sheet height. Choose the means (for example the riders' path or start on a short sheet, or the
  cut's progress against them); the moment keeps one clock (your previous round), its curve, and its end state.
  Outcome: at every sheet size above, AR and EN, at 1x and under 4x CPU, in real-time recordings, no frame shows a
  rider's glyphs over the copy's glyphs. Build the probe so it fails at the baseline at 320 x 568 (its control).
- **N2. The words stay true.** If the fix changes what MOT-16 or README §"Motion" says variant 2 does on the sheet,
  update them; otherwise leave them.

## Limits the result keeps

- **L1.** At 768 x 1024 and 1440 x 900, every frame of `?done=0|1|2` equals the baseline within the noise you measure
  between two baseline captures; on the sheet, `?done=0` and `?done=1` equal it too. Every other page and moment is
  untouched.
- **L2.** Variant 2's timings stay within 30 ms of MOT-16's row; the copy is gone at 90 % of the settling; nothing fades.
- **L3.** Reduced motion and `?motion=off` are instant with the same end state; nothing left over at rest, including
  after Escape at 40 and 150 ms and a second Export within the moment.
- **L4.** `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check`,
  `motion-capture.mjs` and `node --check` on every `.js` and `.mjs` pass as at the baseline or better.
- **L5.** One commit on `owner-followup-r04-build`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

Write only in the folder: `motion.js`, the `.css` that styles the moment, `DESIGN-SPEC.md` (MOT-16), `README.md`
§"Motion", and `INDEX.md` regenerated with the command at its top.

## Report

Each outcome PASS or FAIL with its measure and its control; the cause you found; any literal text that contradicted
its intent; files changed; the commit SHA. At most 25 lines.
