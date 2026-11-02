<!-- brief-format: v1 role: designer -->
# Designer brief: the public page in Arabic, as the page's own files (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010). One build, no options: the user has
accepted the direction and asked for the rest of the page to be made while they sleep.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `630a3b12`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-16.html`, `.css` and `.js`:
    the accepted page, which you carry into the page's own files.
  - `D:/fitway-temp/public-redesign-r01-polish-35/NOTES.md`: how sketch 16's bars, labels, readout and frames work.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md` §"9. RTL, localization, and time"
    and §"5. Public crowd instrument".
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md`
    §"2.1 Glossary", §"2.2 Dates, times and ranges" and §"2.3 Crowd level".
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-02-foundations-1-9.md`
    §"1.4 Type" and §"1.5 Numerals".
  - `design-research/owner-composition-exploration-r04/directions/eclipse/README.md` around line 726: Eclipse's own
    day line runs right to left in Arabic.
  - The `ux-araby` skill (invoke it) for every Arabic string.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`
    §"Public designer frames" and §"CLI working loop": the commands you render and measure with.

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
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- `<run>` is `public-redesign-r01-arabic-39`, made by the coordinator with `pnpm run-folder:new`.
- Run `pnpm check:design-context` first. Impeccable is the one design skill, with `ux-araby` for Arabic copy; load
  no other design or taste skill. Impeccable's files go in `D:/fitway-temp/<run>/`, never in the repository.
  (AGENTS.md)
- A page server for the user's phone runs on port 3181 from this worktree's Eclipse folder; leave it alone. For your
  own server use `pnpm verify:owner serve --concept <the Eclipse folder> --port 3201`, and ports 3201 and up for
  every other command. A verifier reviews the committed `630a3b12` beside you on ports 3191 and up; it writes nothing
  in this worktree.

## What the user decided

The user accepted sketch 16 and asked for the rest of the page in one run while they sleep. This round is the first
of it: the page in Arabic, as the page's own files.

1. **The page's own files.** Build `public.html`, `public.css` and `public.js` in the Eclipse folder from sketch 16,
   replacing B's earlier draft there (it stays in git history). Leave `public-sketch-16.*` unchanged, for comparison.
   Every later round works on `public.*`.
2. **Arabic is the default**, `lang="ar" dir="rtl"`; English at `?lang=en`, `lang="en" dir="ltr"`. The language link
   in the header switches between them and keeps the other switches. Sketch 16's `?dir=rtl` mirror gives way to the
   real Arabic.
3. **Every string in Arabic, written with `ux-araby`**: natural, short, in the glossary's words where it has them
   (the four levels are GLO-3's). Arabic times use ص/م. Write every string, English beside Arabic, into
   `D:/fitway-temp/<run>/COPY.md` for the user to read in the morning; mark each Arabic line the glossary does not
   give as yours.
4. **Time runs right to left in Arabic**: the hours, the drag, the arrow keys, the bar arrival's stagger and the
   week row all follow the reading direction. Logos and the clock do not mirror.
5. **The Arabic page is designed, not translated.** Readex Pro's Arabic, its size and line height, the level word's
   width at every level (شديد الازدحام is the longest: it stays on one line where Packed does), the readout's held
   height and the labels under the bars are judged in Arabic with the same care as the English.
6. **Keep everything else in sketch 16**, in both languages: the level word scaling with the width, two-hour bars by
   their busier hour on long days on the phone, the readout's held height, the fixed hour labels, the picked bar's
   chalk outline, the quiet head, "Fri" with its dot (its Arabic counterpart is yours), the drag, the font loading,
   the arrival from the floor in Brave, the switches. This round is the live state only; the states that must never
   look live come next.

## Frames

Render with `pnpm verify:owner frames --concept <the Eclipse folder, absolute> --page public.html` from
`D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, under reduced motion, into
`D:/fitway-temp/<run>/frames/`:

- `--languages ar,en`, `phone@3`, `phone360@3` and `desktop@2`, at Busy: today with nothing picked, today with 4 PM
  picked, Saturday with 6 PM picked;
- `--languages ar`, `phone360@3` and `desktop@2`: each of the four levels.

Lay them out with `pnpm verify:owner sheet` as `sheet-arabic` (Arabic beside English) and `sheet-levels`. Look at
every frame. Measure that the hour labels under the bars hold still on a pick in Arabic as they do in English (every
phone day at 360 and 390, picking each bar in turn), with `pnpm verify:owner run --script`, into
`D:/fitway-temp/<run>/measure/`. Write `D:/fitway-temp/<run>/NOTES.md`: how `public.*` works, for the next round.

Commit once at the end.

## Report

At most 40 lines: what changed between sketch 16 and `public.*`; the Arabic choices that are design, not
translation, and why; the strings you wrote outside the glossary (the full list is in COPY.md); the label
measurement's result; the frame, sheet and notes paths; the commit SHA; anything that could not be met as written,
and any rule or decision that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings").
