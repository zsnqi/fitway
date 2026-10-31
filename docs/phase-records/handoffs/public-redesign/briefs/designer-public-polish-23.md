<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, polishing sketch 8 (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page, the earlier rounds' pages and the generated images are reference only, never a reason to accept or
reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `82f54e8896f687c3a5199bd7bd73383c2db9f5e7`
- **Starting point:** that HEAD, or the Markdown-only commit after it that brings in this brief.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-8.html`, `.css` and `.js`:
    the page you polish.
  - `D:/fitway-temp/public-redesign-r01-sketch-22/notes.md` and its `sheet-phone.png`: the last designer's notes
    and frames.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/README.md`, its sections on the light and
    the grain (search "grain"), and `design-research/owner-composition-exploration-r04/directions/eclipse/evidence/daily-en-1440x900.png`:
    the Owner pages' family, which this page must stay inside.
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument", its first bulleted list only, and §"9. RTL, localization, and
    time".

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

- `<run>` is `public-redesign-r01-polish-23`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

Sketch 8 is the public crowd page's English draft. The user read it and decided four things. This round builds them
and polishes the page with Impeccable.

1. **The corner light only.** The user wants the page to stay in the Owner pages' family and not drift from their
   style. Drop `now`, `floor` and `dusk`; the light is `public.css`'s corner light, as sketch 8's `corner` draws it.
2. **Hourly bars**: 19 hours from opening (6:00 AM) to closing (1:00 AM), each placed by minutes since opening.
   - Past hours are one plain grey, and the last two hours are deep red.
   - The bar at "Now" is FITWAY red and shows the latest reading.
   - After it, the usual Friday is drawn as outlines labelled "Usual Friday".
3. **One level-word size for all four levels**, about 76 px on the phone at 390: the size at which the longest English
   word fits the column. Set the computer's one size the same way.
4. **The page reads too black.** The user's words: it looks black to a large degree. Give it more presence, without
   leaving the family.

Work in this order:

1. Impeccable's `critique` on sketch 8 as it is, with scores.
2. Build items 1 to 3.
3. Use Impeccable's `bolder` and `colorize` (or the commands you judge fit) on item 4. Build two or three ways to give
   the page more presence, switchable with `?lift=` and short value names. Open on the one you think best. Starting
   ideas, all yours to keep or drop:
   - the corner light reaching larger and further, as the Owner pages' light does;
   - the Owner pages' grain, where the page is lit;
   - the wider bars' own mass;
   - less empty space on the phone, so the content holds the screen.
4. `polish`, then `critique` again, with scores.

Fix these too:

- the deep red bars are about 2.6:1 on the page, under 3:1 for a graphic, so reach 3:1 without leaving the red family;
- the phone's empty bands above the word and above the chart;
- at 360 px, "12 AM" runs 2 px past the column.

## Limits

- **Identity:** dark stays dark; FITWAY red; the corner light; Readex Pro at its real weights; the FITWAY wordmark and
  logo as sketch 8 draws them; no new hue.
- **Content, synthetic:** at Busy, 70 inside labelled approximate, 58% full, open until 1:00 AM, Live with the last
  reading at 7:41 PM, "Usually quieter after 10 PM". Make coherent counts and percentages for Quiet, Moderate and
  Packed, and keep `?level=quiet|moderate|busy|packed`. The page must read whole with `?pct=off`, and the bars'
  heights never reveal capacity.
- **Truth:** nothing after "Now" may look like a reading; the usual day is visibly a usual day. The green Live dot
  appears only beside Live. The level's written word is always visible. Use Western digits and a 12-hour time. No
  personal data.
- **Arabic comes later, but build for it now:** place everything from the inline-start edge and by minutes since
  opening, so `?dir=rtl` mirrors the page without a redesign. Keep sketch 8's way of setting each English line as its
  own left-to-right run in the mirror check.
- **Motion:** none this round. Under reduced motion the page is identical.
- **Copy:** keep sketch 8's English. List every line you change or add.

## Deliverable

Copy sketch 8 to files whose names start with `public-sketch-9` under
`design-research/owner-composition-exploration-r04/directions/eclipse/`, and work there. Leave every `public-sketch-8`
file, `public.html`, `public.css`, `public.js`, every other `public-*` file, the Owner pages and the shared
`style.css` as they are. Set `window.__sketch = { ready: true }` once the fonts have loaded. Support `?lift=`,
`?level=`, `?pct=off` and `?dir=rtl`. Commit at natural checkpoints, with a short notes file in `D:/fitway-temp/<run>/`
saying what is decided and what is left, and commit once at the end.

Render with node scripts in the run folder in the style of `D:/fitway-temp/public-redesign-r01-sketch-22/`, all under
reduced motion: the phone at 390 x 844, density 3; the narrow phone at 360 x 780, density 3; the computer at
1440 x 900, density 2. Save in `D:/fitway-temp/<run>/frames/`:

- `en-phone-busy-<lift>.png` and `en-desktop-busy-<lift>.png` for every lift;
- on your default lift, `en-phone-<level>.png` and `en-desktop-<level>.png` for the four levels, and
  `en-phone360-busy.png`, `en-phone-pctoff.png` and `rtl-phone-busy.png`.

Build these sheets, each frame under its name in large type:

- `sheet-lift.png`: every lift, phone above computer;
- `sheet-levels.png`: the four levels on the phone, then on the computer;
- `compare.png`: sketch 8 at `?light=corner` beside your default, phone and computer.

No capture script goes in the repository. Look at your frames yourself.

## Report

At most 40 lines:

- the critique's main findings and scores, before and after;
- each lift in a line, and your pick with the reason;
- the word's size on the phone and the computer, and how the four levels sit;
- how the hourly bars read, and the deep red's contrast now;
- what changed on the narrow phone, without the percentage, and in the mirror check;
- the copy you changed or added;
- the frame and sheet paths;
- what is left;
- any rule that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings");
- the files you changed and the commit SHA.
