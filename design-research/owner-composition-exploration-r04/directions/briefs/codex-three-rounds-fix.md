<!-- brief-format: v1 role: codex -->
# Codex brief: the three rounds' review findings (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `8104b3e`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 36, 37 and 38, and "How this milestone's rounds run" items 9 and 11. That file lives on another branch: read
  it with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; the
  review's findings below (its evidence folder `D:/fitway-temp/owner-r04-three-rounds-review/out/` holds the frames it
  names; read no report or notes there); in the folder below, `README.md` §"Motion" and `DESIGN-SPEC.md` rows MOT-1,
  MOT-14, MOT-16 and MOT-19. Navigate code with `INDEX.md`. "The folder" is
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

- Your temp folder is `D:/fitway-temp/owner-r04-three-rounds-fix/`. You run in the workspace-write sandbox with
  automatic approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- The pages open two ways, and every outcome holds in each: `index.html` (Daily), `reports.html`, `activity.html`,
  `access.html` and `components.html`, each from `file://` and over HTTP, at 1440, 1366 x 768, 1024 x 768, 768, 390
  and 320 px, AR (`?lang=ar`, the default) and EN, with motion, with `prefers-reduced-motion: reduce`, and with
  `?motion=off`. Phone checks run in a touch context at 390 x 844 and 320 x 568. Use port 3176 only.
- Render every baseline from your own `git archive 8104b3e` of the folder in your temp folder. Every bound below is
  either stated as a rule or measured by you at that baseline; none comes from the review's numbers, which are
  readings, not limits.

## Goal

The independent review of the last three rounds passed every check and found one medium and one low defect, plus one
line of the spec that says less than its outcome asked. Fix them so the round the user sees has no known error left
(rounds item 11). The look, the timings and every other moment's choreography stay as they are.

## Causes and required outcomes

Each outcome states its intent; where the literal text and the intent disagree, say so in the report instead of
choosing. A cause with a file and line is the review's hypothesis: confirm it at the HEAD before you act, and if the
cause is different, fix the real one and say so.

- **F1. In the export's variant 2, text never runs over text** (review F1, medium). Observed: in a real-time video of
  `reports.html?done=2` at 1440 x 900 AR (`out/vid/export-v2-1440-ar.webm`, frame 56, saved as `out/vf-v2-f56.png`),
  the file line slides over the calendar copy's last rows before the cut reaches them, for a few frames. Frozen
  strips and per-frame geometry do not show it. Hypothesis: the cut is a `clip-path` animation (`motion.js` about
  377), run on the main thread, while the file line and the other riders (`motion.js` about 382, `reports.js` about
  1898) move by `transform` on the compositor; with long frames the cut lags the slide. Intent (MOT-16 variant 2, and
  MOT-1, which never lets text sit on or fade into text): the window's moving edge cuts the copy away and what rides
  with the edge rises into the space it has opened, so a rider's glyphs and the copy's glyphs never share a pixel on
  screen, whatever the frame rate. The cut exists to show the calendar leaving with the edge rather than vanishing;
  whatever replaces the mechanism keeps that look: the copy's remaining part ends on a straight horizontal line that
  moves with the edge, nothing fades, it is gone at 90 % of the settling as now. Outcome: in real-time headless videos
  of variant 2 at 1440, 1024 x 768, 768 and 390 (the sheet, where the copy stays still and the top edge cuts it), AR
  and EN, at 1x and under 4x CPU throttling, no frame shows a rider's glyphs over the copy's glyphs. Build a probe
  that sees the defect at the baseline (a control) before you trust it passing. Variant 2's timings stay within 30 ms
  of MOT-16's row, its end state equals the baseline's to the pixel, and an interrupted moment (Escape, a second
  Export) leaves nothing at rest.
- **F2. The trial switch never covers the moment it switches** (review F2, low). Observed: from 721 px the switch is
  fixed in the window's bottom inline-end corner (`reports.css` about 713-716); on short windows it covers the records
  card's last row and its bottom inline-end corner, exactly where the oldest record leaves (`out/v-sw-overlap.png`,
  1366 x 768 and 1024 x 768 AR and EN, 1440 x 900 with `case=long`). Intent (MOT-19, "so it never covers the moment
  it switches"): the switch is a working tool for the user's comparison and must not hide any part of a page. The
  fixed corner was there so the switch could be reached without scrolling; any fixed place over full-width cards can
  cover them at some scroll, so the coordinator gives that up. Outcome: at every width the switch ends the page in
  the flow, as it already does on the phone, after the page's content and in the same tab order; its look, its words,
  its storage keys and its rule of no switch under a URL parameter, reduced motion or `?motion=off` are unchanged. At
  every size above, scrolled anywhere, the switch's box intersects no other element's box. MOT-19 and README
  §"Motion" item 12 say where it now sits.
- **F3. MOT-14 says which cells are wider than their label** (review F6, low). Cause: MOT-14 names every cell that
  holds several labels and the label that sets its width, but not which of them are wider at rest than the label
  they show (the codex-motion-lows round's M2 asked for those buttons). Intent: a reader of the spec knows which
  buttons look wider than their words at rest, and why. Outcome: no width changes; MOT-14 marks, in each language,
  every cell whose rest width is set by a label other than the one it shows at rest, measured by you at the
  baseline, and only those.

## Limits the result keeps

- **L1.** Every page's frames at rest equal the baseline, apart from F2's move of the switch (pages loaded without a
  URL parameter) and the page height it adds.
- **L2.** Every moment's frames during its movement equal the baseline (`?done=0`, `?done=1` and `?row=0|1`
  included), apart from F1's variant 2 export moment.
- **L3.** Reduced motion and `?motion=off` are instant with the same end state; nothing left over at rest.
- **L4.** `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check` and
  `motion-capture.mjs` pass as at the baseline or better (a check that fails there is reported, not fixed);
  `node --check` passes on every `.js` and `.mjs` in the folder.
- **L5.** One commit on `owner-followup-r04-build`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

Write only in the folder: its `.css`, `.js` (not `tuner.js`), `.html`, `DESIGN-SPEC.md` (MOT-14, MOT-16, MOT-19 and
any row F1 or F2 makes untrue), `README.md` §"Motion" where it describes what changed, and `INDEX.md` regenerated with
the command at its top.

## Report

Each outcome PASS or FAIL with its measure and its control; the cause you confirmed for F1; any literal text that
contradicted its intent; files changed; the commit SHA. At most 30 lines.
