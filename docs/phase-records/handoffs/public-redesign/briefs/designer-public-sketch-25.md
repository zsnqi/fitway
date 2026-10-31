<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, today's day designed again (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus) at `max`. Concept-only (ADR-010): the superseded Public Paper frames, the
shipped page, the earlier rounds' pages and the generated images are reference only, never a reason to accept or
reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `6fb7adf44654c025db2f8c720af45d683dd46350`
- **Starting point:** that HEAD, or the Markdown-only commits after it that bring in this brief.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-10.html`, `.css` and `.js`:
    the page you work from.
  - `D:/fitway-temp/public-redesign-r01-polish-24/notes.md`, `sheet-chart.png` and `compare.png`: the last
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

- `<run>` is `public-redesign-r01-sketch-25`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

Sketch 10 is the public crowd page's English draft. The user turned down its chart: the usual Friday's haze looked
very bad, and the bars did not look good. Bars have now had three rounds, sketches 8 to 10. This round does not
patch them. It asks again how the page shows today:

**How does the page show today's crowd, from opening up to "Now", in a form that explains itself at a glance and
belongs to this page?** It need not be bars. Keep bars only if, after trying other forms, you judge them best.

Design two or three whole forms, switchable with `?chart=` and short value names, and open on the one you think best.
Each form is a full design of the day: its shape, its "Now", its time axis, its place and weight on the phone and the
computer. They are not variations of one idea.

**The usual day.** Start from drawing none: the sentence "Usually quieter after 10 PM" already tells the visitor
what comes next. You are free to draw the usual day where it earns its place, but never as a shadow, a haze or an
outline (the user turned down all three). If you draw it, the page must still show at a glance which is today and
which is the usual day, without a legend.

Problems sketch 10 left, to solve where your form allows:

- Busy and Packed drew identical bars, because the chart was scaled to the day's tallest hour. The levels should read
  different in the day too, without revealing capacity.
- On the phone a tall empty band of light sits above the word. On the computer the upper right is empty.
- Bars that fade from a bright top read as a level meter.

Work in this order:

1. Impeccable's `critique` on sketch 10 as it is, with scores.
2. Explore. Sketch several forms quickly in the page, look at them rendered, and drop the weak ones. Keep a line in
   the notes for each form you dropped and why.
3. Build the two or three you keep to full quality.
4. `polish`, then `critique` again, with scores.

## Limits

- **Kept from sketch 10, unchanged:** dark; sketch 9's `reach` light; the level word in the page's off-white ink, 76 px
  on the phone and 90 px on the computer; Readex Pro at its real weights; the FITWAY wordmark and logo; no new hue.
- **Red is the "Now" mark only**, besides the light: one accent. No deep red, no ramp of colours across the day, no
  legend, nothing that reads as an equalizer or a level meter.
- **Turned down before, never to return in another form:** a gauge or ring, a car's tachometer or instrument cluster,
  a timetable, a status page, a lit edge, a strip, bands, a stage spotlight. The cause the user named: each borrowed
  its idea from another world. The user also turned down directions that tried to impress. Stay inside Eclipse's
  family, calm and exact.
- **Content, synthetic:** sketch 10's four levels and their counts and percentages, `?level=quiet|moderate|busy|packed`,
  open until 1:00 AM, Live with the last reading at 7:41 PM, "Usually quieter after 10 PM". Today from 6:00 AM to
  "Now", placed by minutes since opening, never finer than an hour (an hour hides a single arrival at low counts). The
  page must read whole with `?pct=off`, and the day never reveals capacity.
- **Truth:** nothing after "Now" may look like a reading; a usual day, if drawn, is visibly a usual day. The green Live
  dot appears only beside Live. The level's written word is always visible. Use Western digits and a 12-hour time.
  No personal data.
- **Arabic comes later, but build for it now:** place everything from the inline-start edge and by minutes since
  opening, so `?dir=rtl` mirrors the page without a redesign: in Arabic time runs right to left. Keep sketch 10's way
  of setting each English line as its own left-to-right run in the mirror check.
- **Motion:** none this round. Under reduced motion the page is identical.
- **Copy:** keep sketch 10's English. List every line you change or add.

## Deliverable

Copy sketch 10 to files whose names start with `public-sketch-11` under
`design-research/owner-composition-exploration-r04/directions/eclipse/`, and work there. Leave every other
`public-sketch-*` file, `public.html`, `public.css`, `public.js`, every other `public-*` file, the Owner pages and the
shared `style.css` as they are. Set `window.__sketch = { ready: true }` once the fonts have loaded. Support
`?chart=`, `?level=`, `?pct=off` and `?dir=rtl`. Commit at natural checkpoints, with a short notes file in
`D:/fitway-temp/<run>/` saying what is decided and what is left, and commit once at the end.

Render with node scripts in the run folder in the style of `D:/fitway-temp/public-redesign-r01-polish-24/`, all under
reduced motion: the phone at 390 x 844, density 3; the narrow phone at 360 x 780, density 3; the computer at
1440 x 900, density 2. Save in `D:/fitway-temp/<run>/frames/`:

- `en-phone-<level>-<chart>.png` for every form at Quiet and at Packed;
- `en-desktop-busy-<chart>.png` for every form;
- on your default form: `en-phone-<level>.png` and `en-desktop-<level>.png` for the four levels, and
  `en-phone360-busy.png`, `en-phone-pctoff.png` and `rtl-phone-busy.png`.

Build these sheets, each frame under its name in large type:

- `sheet-chart.png`: every form, at Quiet and Packed on the phone, then Busy on the computer;
- `sheet-levels.png`: the four levels on the phone, then on the computer;
- `compare.png`: sketch 10 at `?chart=lit` beside your default, phone and computer.

No capture script goes in the repository. Look at your frames yourself.

## Report

At most 40 lines:

- the critique's main findings and scores, before and after;
- the forms you tried and dropped, a line each;
- each form you kept in a line, and your pick with the reason;
- whether you drew the usual day, and why;
- how the four levels read different in the day;
- what changed on the narrow phone, without the percentage, and in the mirror check;
- the copy you changed or added;
- the frame and sheet paths;
- what is left;
- any rule that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings");
- the files you changed and the commit SHA.
