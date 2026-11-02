<!-- brief-format: v1 role: designer -->
# Designer brief: the final verifier's fixes and the fix round's loose ends (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010). One fix round, no options: the user
is away and wants the page finished, with nothing left half done; they read the result and the calls below later.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `5951ae53`
- The branch may carry Markdown-only record commits on top of `5951ae53`; the page files are as at `5951ae53`.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `.css`, `.js` and
    `public-copy.js`: the page, which you change in place.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/PUBLIC-SPEC.md` and its parts
    `public-1.md` to `public-4.md` in its `spec` folder: the page's specification, which you keep true.
  - `D:/fitway-temp/public-redesign-r01-verify-44/REPORT.md`: the final verifier's findings, which you fix, and
    `D:/fitway-temp/public-redesign-r01-fixes-43/REPORT.md`: the previous round's open points, some of which you fix.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md` §"6. Public state grammar" (with its
    "Loading behaviour").
  - `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`, for any motion you change.
  - The `ux-araby` skill (invoke it) for any Arabic string you change.
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

- `<run>` is `public-redesign-r01-final-fixes-45`, made by the coordinator with `pnpm run-folder:new`.
- Run `pnpm check:design-context` first. Impeccable is the one design skill, with `ux-araby` for Arabic copy; load
  no other design or taste skill. Impeccable's files go in `D:/fitway-temp/<run>/`, never in the repository.
  (AGENTS.md)
- The page server for the user's phone (port 3181) stays alone. The verification commands accept ports 3176, 3186 or
  3188 only; use 3186. `frames` needs a fresh empty `--out` folder, and in PowerShell quote `'ar,en'`. The levels are
  `?level=quiet|moderate|busy|packed`.

## What to fix

1. **The arrival moves nothing** (verifier H1, High): Loading's head takes exactly Live's layout, row for row, at
   every width and in both languages, so that every box Live shows sits where Loading held it: the count line with
   its words' room, the percentage, the comparison and the stamp. Prove it by a box-position diff of each head
   element between `?state=loading` (skeleton shown) and Live at each level, not by the layout-shift API, which
   misses replaced nodes. 0 px. The same for the tablet's and 200% zoom's hour labels (verifier L3): the empty frame
   labels the hours Live will label.
2. **The status line sits under its facts** (M1): in every state the gap from the facts to the status line is
   Live's 12 px, at every width and in both languages, while the head's held height stays (the spare room goes below
   the head's last row, not between rows).
3. **The stamp follows its comparison** (fixes-43 open point, PUB-138): after "Busier than usual" the stamp stands at
   the line's normal gap, not 91.6 px off; the room held for the widest comparison goes after the stamp. The head
   still holds still for every level (0 px vertical, as PUB-129's replacement rows say).
4. **No size jump at the breakpoints** (PUB-131): the word at 600 px (68.79 to 83.8 px) and the Arabic plot at 1024
   (182 to 300 px) change smoothly with the width; measure 590-610 and 1014-1034 in 2 px steps, both languages.
5. **Small ones:** the Arabic word's ink lines up with the facts' ink within 1 px, as the English now does; at 320
   in Arabic the step keys centre on the picked hour's text, not on the readout's held two lines; the day keys'
   release is one value in code and specification (L1: pick 120 ms or 160 ms by `STANDARDS.md` and make PUB-29,
   PUB-50 and the CSS comment agree); the English arrival announcement reads "Crowd right now: Busy, about 70 inside"
   (L2).

The coordinator's calls on the rest of fixes-43's open points, which you keep and log in PUB rows as decided for the
concept: Unavailable shares Error's 0.7 size; the Live stamp takes its own line at 320 and at 360 in English; Closed
follows the one label rhythm; Readex Pro's figures stay proportional (NUM-2's departure stays logged).

Keep everything else as built. Update every `PUB-` row your changes touch and remove from §6.11 and §6.12 what you
fix; the specification must match the page at your commit.

## Frames

Render with `pnpm verify:owner frames --concept <the Eclipse folder, absolute> --page public.html` from
`D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, under reduced motion, into
`D:/fitway-temp/<run>/`: each of the six states in `'ar,en'` at `320x700@3`, `phone@3` and `desktop@2`; Live at Busy
in `'ar,en'` at `768x1024@2`. Sheets `sheet-states`, `sheet-sizes`. Render and measure only after your last edit to
any page file, and say so. Look at every frame. Measure with `pnpm verify:owner run --script` into
`D:/fitway-temp/<run>/measure/`: item 1 (every head box, Loading against Live, every level, 320/360/390/768/1024/1440,
both languages: 0 px), item 2's gaps per state, item 3's gap, item 4's sizes, and, still 0 px: the head over levels,
F1 on a day change, picks moving nothing.

Commit once at the end.

## Report

At most 40 lines: each item, done or not, with its measured value; the strings changed; the spec rows changed; the
frame, sheet and measurement paths, and the time of your last page edit against the time of your last render; the
commit SHA; anything that could not be met as written, and any rule or decision that made the page read wrong, named
(WORKING_AGREEMENTS "Rules and findings").
