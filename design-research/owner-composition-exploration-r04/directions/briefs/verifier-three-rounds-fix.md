<!-- brief-format: v1 role: verifier -->
# Verifier brief: the fix for the three rounds' review findings (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read Codex's report, its temp
folder, or any designer's notes before recording your own result, and never edit what you verify. (CLAUDE.md) This
review covers reading direction for what changed.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `ce3f07e`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only. The round is `06f3bbf..ce3f07e`.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 36, 37 and 38, and "How this milestone's rounds run" items 4 and 11; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; the brief
  the round answered, `directions/briefs/codex-three-rounds-fix.md` (its outcomes F1-F3 and limits L1-L5 are your
  baseline; its frames under `D:/fitway-temp/owner-r04-three-rounds-review/out/` are the previous review's, which you
  may open); in `.../directions/eclipse/`, `DESIGN-SPEC.md` MOT-1, MOT-14, MOT-16, MOT-19 and README §"Motion".

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

- Write only in `D:/fitway-temp/owner-r04-three-rounds-fix-review/`; the coordinator checks `git status` in every
  worktree afterwards. A local server uses port 3178 only. Render with the worktree's `@playwright/test`; take your
  own captures. Baselines from your own `git archive 06f3bbf` of the folder. The `ui-forensics` skill fits.
- **Keep your context lean:** measure by code; open images and videos only where judgement needs them, downscaled
  unless a detail needs full size.

## What was delivered

1. **F1:** variant 2's cut (`?done=2`) moved from an animated `clip-path` to a translated overflow window with a
   counter-translated copy, so the cut and the riders both move by transform.
2. **F2:** the trial switch (Reports and Access) ends the page in the flow at every width, not fixed in the corner
   from 721 px.
3. **F3:** MOT-14 marks the cells wider at rest than the label they show.

**Already known; do not report as findings:** the published concept lacks `tuner.js`; the Impeccable detector's wash
and stripe flags; F2's literal "no other element's box" is met in intent only (containing elements, and the phone's
fixed bar over the switch while scrolling, are the brief's wording); raster noise that also differs between two
baseline captures.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | F1 holds: no frame shows a rider's glyphs over the calendar copy's glyphs, in real-time video at 1x and 4x CPU throttling, at 1440, 1024 x 768, 768 and 390, AR and EN, file:// and HTTP | your own probe, with the baseline as its control |
| V2 | F1's look: the cut still reads as the window's moving edge (straight edge moving with it), nothing fades (MOT-1), gone at 90 % of the settling; timings within 30 ms of MOT-16 | traces, frames |
| V3 | F1 end state equals the baseline's; reduced motion and `?motion=off` instant with the same end; an interrupted moment leaves nothing at rest | pixel and DOM comparison |
| V4 | F2: the switch ends each page in flow at every width, after the content, in tab order, its look, words, keys and parameter rules unchanged; nothing covered at any scroll | measured boxes, frames at 1440, 1366 x 768, 1024 x 768, 390 |
| V5 | F2 read as a whole on the page in each language: where the switch sits (start or end edge, spacing from the last card) reads as intended for an Arabic and an English reader | frames, measured edges, your judgement |
| V6 | F3: MOT-14's marks match a measured scan, both languages | scan |
| V7 | L1, L2: every page at rest and every other moment unchanged from the baseline apart from F1 and F2 | pixel comparison, with noise measured between two baseline captures |
| V8 | L4: `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check`, `motion-capture.mjs` pass; `node --check` on every script | commands |
| V9 | The held-out rows below | each row's evidence, with its control |
| V10 | The variant 2 moment watched in real time at 1440 AR and 390 AR: calm, finished, nothing jumping | videos you record and watch |

**Held-out rows for V9** (written before the Codex round; each with a planted-defect control):

- H1. F1 at 768 (dialog) and 390 (the sheet, whose copy stays still and is cut from above), AR and EN: no frame of a
  real-time headless video, at 1x and under 4x CPU throttling, shows a rider's glyphs over the calendar copy's glyphs.
  Control: the HEAD shows it at 1440 AR; a probe that cannot see it there is void.
- H2. F1's look kept: variant 2's cut still reads as the window's moving edge (the copy's remaining part ends on a
  straight horizontal line that moves with the edge in every frame, within 1 px), gone at 90 % of the settling;
  no fade, no glyph opacity below 1. Control: plant a fade on the copy; the probe must fail it.
- H3. F1 interrupted: Escape and a second Export within the moment leave nothing at rest (no copy, clip, inline style).
- H4. F2: on Access at 1024 x 768 and 1366 x 768, `case=long`, AR and EN, scrolled to the end: the records card's last
  row, its bottom edge and corners are fully visible and nothing overlaps them; the same for Reports' last card.
  Control: the HEAD fails it.
- H5. F2: the switch keeps MOT-19's look and its language; by keyboard it comes after the page's content in tab
  order, and choosing a variant still keeps it for the next load. No switch with a URL parameter, reduced motion or
  `?motion=off`.
- H6. F6: MOT-14's list of cells wider at rest than their visible label matches a measured scan at the new HEAD in
  both languages (none missing, none extra).
- H7. Unchanged: `?done=0`, `?done=1` and `?row=0|1` strips equal the HEAD's frame for frame.
- H8. `git status --short` empty in the build worktree after the run; nothing written outside the folder and the
  temp folder.

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header.

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line` and a
severity (high, medium, low); what you could not run and why; anything that reads, feels or behaves wrong though it
passes its check, with the rule named as the suspect; the evidence folder, with the names of the videos the
coordinator should watch first. At most 40 lines.
