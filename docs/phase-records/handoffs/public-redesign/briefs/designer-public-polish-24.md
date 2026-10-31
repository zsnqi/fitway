<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, a white word and a new chart (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page, the earlier rounds' pages and the generated images are reference only, never a reason to accept or
reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `ab7b7f63ee8fd316e4f239f3c786a1d76d20fcec`
- **Starting point:** that HEAD, or the Markdown-only commit after it that brings in this brief.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-9.html`, `.css` and `.js`:
    the page you work from.
  - `D:/fitway-temp/public-redesign-r01-polish-23/notes.md`, `sheet-levels.png` and `compare.png`: the last
    designer's notes and frames.
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

- `<run>` is `public-redesign-r01-polish-24`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

Sketch 9 is the public crowd page's English draft. The user kept its `reach` light and asked for four changes. This
round builds them and designs the chart again.

1. **The level word turns off-white**, the page's ink. Red over the red light lost its contrast and did not look
   good. Red now stays in two places only, the light and the bar at "Now": one accent.
2. **The word's size.**
   - The computer's word was far too large at 285 px. Drop the fit-the-column rule there and set it near 90 px,
     balanced with the chart.
   - The phone keeps 76 px. Shorten the chart there, so the word leads and the chart no longer outweighs it.
3. **The usual Friday, designed anew.** The user found sketch 9's hollow outlines unattractive, and at Quiet they
   become the page's largest shapes. The lead idea to try is a soft, faint shadow of the usual day behind the bars,
   across the whole day:
   - the bars are today and the shadow is the usual day, so the page shows at a glance whether today runs above or
     below the usual;
   - after "Now" only the shadow shows;
   - its label "Usual Friday" sits at its far end, away from the Now bar;
   - it never draws the eye more than today's bars, at any level.
4. **No element needs explaining.** The user wants every element to explain itself. The deep red of the last two
   hours goes. The user expects that grey bars with one red bar will not look good, and asks for the bars to be
   rethought: they can look much better.

Design two or three whole charts, each with its bars and its usual day together, switchable with `?chart=` and short
value names. Open on the one you think best. Within each:

- the bar at "Now" is the only red;
- there is no ramp of colours across the day (the user disliked one);
- nothing may read as an equalizer;
- nothing may need a legend.

Work in this order:

1. Impeccable's `critique` on sketch 9 as it is, with scores.
2. Build items 1 and 2.
3. Design the charts for items 3 and 4.
4. `polish`, then `critique` again, with scores.

## Limits

- **Identity:** dark; FITWAY red; sketch 9's `reach` light, unchanged; Readex Pro at its real weights; the FITWAY
  wordmark and logo as sketch 9 draws them; no new hue. Drop `?lift=`.
- **Content, synthetic:** sketch 9's four levels and their counts and percentages, `?level=quiet|moderate|busy|packed`,
  open until 1:00 AM, Live with the last reading at 7:41 PM, "Usually quieter after 10 PM". Hourly bars from 6:00 AM
  to 1:00 AM, placed by minutes since opening. The page must read whole with `?pct=off`, and the chart never reveals
  capacity.
- **Truth:** nothing after "Now" may look like a reading; the usual day is visibly a usual day. The green Live dot
  appears only beside Live. The level's written word is always visible. Use Western digits and a 12-hour time. No
  personal data.
- **Arabic comes later, but build for it now:** place everything from the inline-start edge and by minutes since
  opening, so `?dir=rtl` mirrors the page without a redesign. Keep sketch 9's way of setting each English line as its
  own left-to-right run in the mirror check.
- **Motion:** none this round. Under reduced motion the page is identical.
- **Copy:** keep sketch 9's English. List every line you change or add.

## Deliverable

Copy sketch 9 to files whose names start with `public-sketch-10` under
`design-research/owner-composition-exploration-r04/directions/eclipse/`, and work there. Leave every other
`public-sketch-*` file, `public.html`, `public.css`, `public.js`, every other `public-*` file, the Owner pages and the
shared `style.css` as they are. Set `window.__sketch = { ready: true }` once the fonts have loaded. Support
`?chart=`, `?level=`, `?pct=off` and `?dir=rtl`. Commit at natural checkpoints, with a short notes file in
`D:/fitway-temp/<run>/` saying what is decided and what is left, and commit once at the end.

Render with node scripts in the run folder in the style of `D:/fitway-temp/public-redesign-r01-polish-23/`, all under
reduced motion: the phone at 390 x 844, density 3; the narrow phone at 360 x 780, density 3; the computer at
1440 x 900, density 2. Save in `D:/fitway-temp/<run>/frames/`:

- `en-phone-<level>-<chart>.png` for every chart at Quiet and at Busy;
- `en-desktop-busy-<chart>.png` for every chart;
- on your default chart: `en-phone-<level>.png` and `en-desktop-<level>.png` for the four levels, and
  `en-phone360-busy.png`, `en-phone-pctoff.png` and `rtl-phone-busy.png`.

Build these sheets, each frame under its name in large type:

- `sheet-chart.png`: every chart, at Quiet and Busy on the phone, then Busy on the computer;
- `sheet-levels.png`: the four levels on the phone, then on the computer;
- `compare.png`: sketch 9 at `?lift=reach` beside your default, phone and computer.

No capture script goes in the repository. Look at your frames yourself.

## Report

At most 40 lines:

- the critique's main findings and scores, before and after;
- each chart in a line, and your pick with the reason;
- the word's colour and its size on the phone and the computer, and how the word and the chart now weigh;
- how the usual day reads at Quiet and at Packed;
- what changed on the narrow phone, without the percentage, and in the mirror check;
- the copy you changed or added;
- the frame and sheet paths;
- what is left;
- any rule that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings");
- the files you changed and the commit SHA.
