<!-- brief-format: v1 role: designer -->
# Designer brief: the states that never look live, every size, and the motion review's fixes (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010). One build, no options: the user
accepted the direction and asked for the rest of the page to be made while they sleep.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `dedce154`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `.css` and `.js`: the page,
    which you change in place.
  - `D:/fitway-temp/public-redesign-r01-arabic-39/NOTES.md` and `D:/fitway-temp/public-redesign-r01-arabic-39/COPY.md`:
    how `public.*` works, and every string in both languages.
  - `D:/fitway-temp/public-redesign-r01-motion-38/REPORT.md`: the motion review's findings F1-F7, which you fix.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md` §"6. Public state grammar" (with its
    "Loading behaviour") and §"5. Public crowd instrument".
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/spec/04-acceptance-criteria.md` §"Functional",
    its first two items.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md`
    §"2.4 State grammar" and §"2.5 Truthfulness".
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-07-components-9-15.md`
    §"3.12 Empty state, alert and retry" and §"3.14 States: placeholders and the status words".
  - `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`: the motion values for anything you change.
  - The `ux-araby` skill (invoke it) for every new Arabic string.
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

- `<run>` is `public-redesign-r01-states-40`, made by the coordinator with `pnpm run-folder:new`.
- Run `pnpm check:design-context` first. Impeccable is the one design skill, with `ux-araby` for Arabic copy; load
  no other design or taste skill. Impeccable's files go in `D:/fitway-temp/<run>/`, never in the repository.
  (AGENTS.md)
- A page server for the user's phone runs on port 3181 from this worktree's Eclipse folder; leave it alone. The
  verification commands accept ports 3176, 3186 or 3188 only; use 3186.

## What the user decided

The user accepted the page and asked for all of the rest in one run while they sleep. The Arabic round built
`public.*`. This round makes it whole:

1. **Every state, in both languages, none ever looking live.** The six states of DESIGN_GUIDE §6: Loading, Live,
   Delayed, Unavailable, Closed, Error, each reachable by a `?state=` switch for frames, with its truth and data
   rules exactly as §6 and its "Loading behaviour" give them (no skeleton before about 300 ms, at least 400 ms once
   shown, zero layout shift on arrival, charts never imitating data, a ceiling, one announcement). What the usual day's
   bars and the readout do in each state is yours, within those rules: the usual day is history, not a live reading,
   but nothing in a non-live state may read as the gym now. The red live hour, the Live dot and the "busier than
   usual" comparison are live readings. Design the states as part of this page, in its family, not as alert boxes.
2. **Every size.** Designed: 360, 390, 768 and 1440; checked: 320, 1024, and 1440 at 200% zoom. The tablet (768) is
   new: give it its own composition if the phone's or the computer's does not suit it. At 320 nothing is cut or
   overlapped in either language, and the day row still holds the Arabic names.
3. **The motion review's fixes**, F1 to F7 in its REPORT.md, at the values it gives: F1 first (no jump of any part of
   the page when the day changes, on every phone width, in both languages, also under reduced motion), then F2 to F7.
   The arrival keeps its character and length; the user's taste outranks any rule there.
4. **Keep everything else** in `public.*` as built, in both languages.

## Frames

Render with `pnpm verify:owner frames --concept <the Eclipse folder, absolute> --page public.html` from
`D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, under reduced motion, into
`D:/fitway-temp/<run>/frames/`:

- each of the six states, `--languages ar,en`, at `phone@3` and `desktop@2`;
- Live at Busy, `--languages ar,en`, at `320x640@3`, `phone360@3`, `768x1024@2`, `1024x768@2`, and 1440 at 200% zoom
  (`720x450@4` or the CLI's zoom form, as SKILL.md gives it).

Lay them out with `pnpm verify:owner sheet` as `sheet-states` (Arabic beside English per state) and `sheet-sizes`.
Look at every frame. Measure with `pnpm verify:owner run --script`, into `D:/fitway-temp/<run>/measure/`: F1 (every
part's position before and after each day change, every phone width, both languages: 0 px), the labels under the
bars still holding on a pick, and the layout shift when Loading gives way to Live (0). Measure any motion you change
with `pnpm verify:owner measure --tool motion --page public.html`, into `D:/fitway-temp/<run>/motion/`. Update
`D:/fitway-temp/public-redesign-r01-arabic-39/NOTES.md`'s content into `D:/fitway-temp/<run>/NOTES.md` and add the new
strings to a `D:/fitway-temp/<run>/COPY.md`.

Commit once at the end.

## Report

At most 40 lines: each state in one line (what shows, what is removed, and why it cannot read as live); the tablet's
composition; each of F1-F7, fixed or not, with its measured value; the measurements' results; the strings added; the
frame, sheet, notes and copy paths; the commit SHA; anything that could not be met as written, and any rule or
decision that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings").
