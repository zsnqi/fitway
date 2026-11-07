<!-- brief-format: v1 role: designer -->
# Designer brief: the export's done moment as switchable variants, and Access's row after its window closes (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009): superseded Owner Paper frames are
reference only. The interaction-motion round is built (`0c43c90`, all motion in `motion.js`) and the user tried it on
the live site. Two of its moments go back to the user as comparisons, not as finished choices (DECISIONS 38). This is
a small round: two moments, one layout fix, nothing else.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `d8e272f`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 4, 8, 35, 36 and 38 (38 is this round), and "How this milestone's rounds run" items 10 and 11. The file is
  newer on another branch: read it with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; it binds.
  - In `.../directions/eclipse/` ("the folder"): `README.md` §"Motion"; `DESIGN-SPEC.md` rows MOT-9, MOT-11, MOT-14 to
    MOT-17 and DLG-4; `motion.js` (the settle, the done and the flip parts); `reports.css` about lines 405-418 (the done
    state); the export and the deactivation paths in `reports.js` and `access.js`. Navigate the rest with `INDEX.md`.
  - The motion review, for what was measured: `D:/fitway-temp/owner-r04-motion-review/REPORT.md` (F1, O1, O2) and its
    `sheets/done-detail.png`, `sheets/1440-row-off.png`, `runs/vid/2-export-run-1440-ar-anim.webm`,
    `runs/vid/6-row-1440-ar-anim.webm`.

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

- Run `pnpm check:design-context` first. Impeccable is the one design skill; load no other design or taste skill.
  A local server uses port 3176 only. Frames, videos, scratch and your notes file go under
  `D:/fitway-temp/owner-r04-done-variants/`.
- Rounds item 10: commit at each natural checkpoint (the layout fix, then the export's variants, then Access's row)
  with a short `NOTES.md` in the temp folder saying what is decided and what is left, so a fresh designer could take
  over from the last commit. Judge your work at 1440 and 390 in Arabic; render English and 768 only as end states,
  not as videos. Keep videos and strips few: they are what fills your context.

## 1. The export's done moment: two variants beside the current one

What the owner sees today (Reports, «تصدير بالدقيقة», the window with the calendar): they press Export, the button's
words roll to Working, the file is made; then, in one frame, the calendar and the fields disappear and the window is
an empty box about 650 px tall, which shrinks for about a third of a second; only after it has shrunk does the ring
start drawing, then the check, then «الملف جاهز» rises. The user liked it as built («اشوفها ممتازة»), and the timings
stay (DECISIONS 38: the window's 340 ms opening, about 0.9 s from file ready to the finished check). The review named
the empty box (O1): the reward opens on nothing. The user wants to see the coordinator's two ideas and pick:

- **Variant 1 — the check starts while the window shrinks.** The ring (and then the check, then the words) starts
  drawing during the shrink instead of after it, so the empty third of a second is filled by the reward itself.
- **Variant 2 — the calendar is cut away, not removed.** The calendar and fields stay in place and the window's
  moving edge cuts them away as it shrinks (on the computer the bottom edge rising; on the phone's bottom sheet, the
  top edge coming down); then the check draws as now.

Build both, each as good as you can make it within the limits, beside the current one (**variant 0, unchanged, the
default**). The user switches between them on the live site: give Reports a small, clearly secondary switch that a
reviewer would read as a tool, not as part of the product (the light tuner on Daily is the precedent), labelled in
the page's language, kept across reloads, plus a URL parameter for captures; with the parameter set to 0 or absent,
and in reduced motion, the page is exactly as at the base. Draw each variant against its whole range: Arabic and
English (a movement with a direction mirrors), 1440 and the phone's sheet at 390, a window closed mid-movement, a
failure that offers Retry (unchanged), and the widest file line. Each variant ends in the same rest state as variant
0, to the pixel. If an idea cannot be done well within the limits, build what you can, say plainly where it falls
short and why, and say which you would pick.

## 2. Access's row after a (de)activation (O2)

Today, when the owner confirms a deactivation, the row's new state, its done line and the undimmed page show while
the window is still folding away (measured about 858 ms in all); MOT-17 meant them to follow the window. The user
asks to try changing the row only once the window has closed, without a noticeable wait («المفروض ما تتأخر جدا»),
and will judge whether it is better. Build it as a second option behind the same kind of switch on Access (current
as the default), for deactivation and reactivation alike, at 1440 and 390. Focus and the announcement still come at
once (MOT-17).

## 3. One layout fix (F1), first

The export's done state at rest is 6.5 px taller than DLG-4 draws it: the gap from the mark to «الملف جاهز» is 18.5
instead of 12, at every size, and the component sheet's DLG-4 specimen too. The review traced it to the 44 px
`inline-grid` mark sitting on the text baseline (`reports.css` about 411-412). Make the gap 12 at rest, in every
variant, without changing anything else at rest.

## Hard limits

- MOT-1's glyph rule: no glyph ever changes opacity; words roll, rise or are uncovered, never faded (DO-NOT).
  Being cut away by a moving edge is uncovering in reverse and allowed.
- Reduced motion and `?motion=off` (MOT-11): every change instant, the same end state; no layout shift during or at
  the end of a movement; nothing left over at rest (no inline style, attribute or element).
- Truthful states (item 8): the check appears only after the file exists in the sample.
- An animation never delays focus or an announcement, and never repeats one.
- Load motion stays banned; nothing else on any page changes; existing copy unchanged; DO-NOT in full.

## Files

Write only under `.../directions/eclipse/`: `motion.js`, the Reports and Access `.html`, `.css`, `.js`, the
component sheet for the DLG-4 specimen, `motion-capture.mjs` (extend it for the variants), `README.md` §"Motion" (a
line on the switches and their parameter), and in `DESIGN-SPEC.md` only MOT-16, MOT-17, DLG-4 and a row for the
switches if one is needed. Regenerate `INDEX.md` with the command at its top if lines moved. Commit there.

## Frames and video

In `D:/fitway-temp/owner-r04-done-variants/`, numbered the same in both languages: for each export variant and for
each row option, a real-time `.webm` at 1440 AR and 390 AR, and a strip of its frames at fixed steps (every 50 ms
from the press of Export, or of the confirmation, until 200 ms after the last movement), with the variants' strips on
one sheet in the same steps so they compare frame by frame; `R-` the reduced-motion end states; English and 768 end
states. Watch every video and inspect every strip; judge the moment on the page as a whole.

## Report

For each variant and option: what the owner sees, step by step, in two or three plain lines; its timings; where it
falls short, if anywhere; which you would pick and why. The F1 measure before and after. The switches' names and
parameters. The output folder, files changed, commit SHAs. At most 40 lines.
