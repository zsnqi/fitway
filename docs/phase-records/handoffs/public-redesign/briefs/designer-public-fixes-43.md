<!-- brief-format: v1 role: designer -->
# Designer brief: the reviews' fixes, and the specification kept true (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010). One fix round, no options: the user
accepted the page and asked for the rest to be made while they sleep.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `6fd18e53`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `.css`, `.js` and
    `public-copy.js`: the page, which you change in place.
  - `D:/fitway-temp/public-redesign-r01-states-40/NOTES.md`: how the page works.
  - `D:/fitway-temp/public-redesign-r01-direction-41/REPORT.md` and `D:/fitway-temp/public-redesign-r01-spec-42/REPORT.md`:
    the findings you fix.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/PUBLIC-SPEC.md` and its parts
    `public-1.md` to `public-4.md` in its `spec` folder: the page's specification, which you keep true.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md`
    §"2.1 Glossary" and §"2.2 Dates, times and ranges".
  - `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`, for any motion you change.
  - The `ux-araby` skill (invoke it) for every Arabic string you change.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`
    §"Public designer frames" and §"CLI working loop".

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

- `<run>` is `public-redesign-r01-fixes-43`, made by the coordinator with `pnpm run-folder:new`.
- Run `pnpm check:design-context` first. Impeccable is the one design skill, with `ux-araby` for Arabic copy; load
  no other design or taste skill. Impeccable's files go in `D:/fitway-temp/<run>/`, never in the repository.
  (AGENTS.md)
- The page server for the user's phone (port 3181) stays alone. The verification commands accept ports 3176, 3186 or
  3188 only; use 3186. `frames` needs a fresh empty `--out` folder, and in PowerShell quote `'ar,en'`.

## What to fix

The coordinator's calls on the two reviews' findings (the direction review's F-numbers are `D-F<n>`):

1. **Arabic ranges read one way on this page** (D-F1): every range in Arabic starts on the right, as the bars, the
   card's hours and the ranges across noon already do, so one card never runs two ways. This departs from DAT-3 for
   this page; log it in the fourth part's §6.11 as a departure with its reason, for the user to decide whether
   DAT-3 changes for the family.
2. **English ranges follow DAT-3**, unspaced: "6–8 PM" (D-F2). Real no-break and thin spaces where the code means
   them (spec: `public.js:143`).
3. **Start edges**: the Loading word placeholder sits on the start edge (D-F3); the English word's ink lines up with
   the facts within 1 px (D-F4).
4. **Spacing and wrap**: «يفتح» / "Opens" sits a word space from its time (D-F5); no single word alone on a line in
   the state messages at 320 (D-F6).
5. **Copy**: rewrite Unavailable's Arabic natively with `ux-araby` (D-F7); "About usual" per GLO-10; the English day
   group's name "Days". The English week starts on Sunday, as GLO-13 and the Arabic do. Keep «نحو 70 في الصالة»
   (GLO-2's words break the line at 360) and the concept label, both logged as departures.
6. **Keyboard**: after Home then Escape on the hours, Tab leaves the hours group; the roving stop follows focus.
7. **The head holds still for every level** at every width and both languages: a reading changing level moves
   nothing below the word (spec PUB-129: at 320 and 360 English a wrapping comparison line makes the head 14-32 px
   taller).
8. **Touch targets**: today's hours at 320 are 21.16 px wide, under the page's 24 px minimum (WCAG 2.5.8). Find an
   answer in the page's family (the drag stays) and measure it.
9. **The tablet and 1024**: the hour labels keep one rhythm on the tablet, the quietest hour's label included, and
   Arabic and English label the same hours at the same width; at 1024 the word and the count do not jump in size
   against their neighbours' widths (84 to 104 px; the count 40 to 28 px).
10. **Error on the computer** reads loud at 124 px even dimmed: bring it into proportion with the other states'
    words.

Keep everything else as built. Update every `PUB-` row and copy line in `PUBLIC-SPEC.md`'s parts that your changes
touch, and remove from §6.11 and §6.12 what you fix; the specification must match the page at your commit.

## Frames

Render with `pnpm verify:owner frames --concept <the Eclipse folder, absolute> --page public.html` from
`D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, under reduced motion, into
`D:/fitway-temp/<run>/`: each of the six states in `'ar,en'` at `phone@3` and `desktop@2`; Live at Busy in `'ar,en'`
at `320x700@3`, `768x1024@2` and `1024x768@2`; Saturday with 6 PM picked in `'ar,en'` at `phone360@3`. Sheets
`sheet-states`, `sheet-sizes`. Look at every frame. Measure with `pnpm verify:owner run --script` into
`D:/fitway-temp/<run>/measure/`: item 7 (every level, every width, both languages: 0 px), item 8's target sizes, the
labels still holding on a pick, F1 of the motion review still 0 px on a day change, and loading to live still 0 px.

Commit once at the end.

## Report

At most 40 lines: each of the ten items, done or not, with its measured value; the strings changed (both
languages); the spec rows changed; the departures logged; the frame, sheet and measurement paths; the commit SHA;
anything that could not be met as written, and any rule or decision that made the page read wrong, named
(WORKING_AGREEMENTS "Rules and findings").
