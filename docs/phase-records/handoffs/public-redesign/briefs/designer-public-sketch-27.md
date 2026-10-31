<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, designed around what it gives the trainee (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus) at its default effort. Concept-only (ADR-010): the superseded Public
Paper frames, the shipped page, the earlier rounds' pages and the generated images are reference only, never a reason
to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `cf0877b151c6cb7764771613a11c64e480fbf6fe`
- **Starting point:** that HEAD, or the Markdown-only commits after it that bring in this brief.
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `D:/fitway-temp/public-redesign-r01-popular-times-26/coordinator/`: Google's Popular Times, in English and Arabic.
    The idea behind it, not its look.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/README.md`, its sections on the light and
    the grain (search "grain"), and `design-research/owner-composition-exploration-r04/directions/eclipse/evidence/daily-en-1440x900.png`:
    the Owner pages' family, which this page belongs to.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-11.html`, `.css` and `.js`:
    the last sketch, for its shell (header, wordmark, language switch, light, synthetic data). Its design of the day
    was turned down.
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

- `<run>` is `public-redesign-r01-sketch-27`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

The public crowd page is what a gym's members and visitors open to decide when to train. The user sees it as FITWAY's
strength: what it gives the trainee is the project's core, and its advantage over the system the gym runs today. Eleven
sketches showed "now" with today's past behind it. That cannot answer the trainee's real question, when to go. The
last sketch was turned down as lifeless and far too plain.

**Design the page around what it gives the trainee.** Boldness is welcome; the page should feel alive, and it must
still be read at a glance by someone standing at the gym's door. What it offers, all with synthetic data:

- **The usual day with "Now" on it:** the whole day from opening to closing, the hours ahead included, "Now" marked on
  it, and a line saying whether today runs busier or quieter than usual right now.
- **The quietest time left today.**
- **Other days:** the visitor picks a weekday and sees that day's usual shape. Days differ in shape and in opening
  hours.
- **The live reading:** the level in a word (Quiet, Moderate, Busy, Packed), the approximate count inside, the
  percentage (the owner can turn it off), open or closed with the closing time, and the last update with Live.

How these are arranged, drawn, revealed and animated is yours. Google's Popular Times does part of this: the usual day
is the frame, "now" is one marked hour on it, read in words, and a picked hour or day answers in a plain sentence. A
trainee knows that form already. Take the idea as far as it helps; never its look.

Design two or three whole pages, switchable with `?design=` and short value names, and open on the one you think best.
They are different ideas, not variations of one.

How you work is yours. Score each design you keep with Impeccable's `critique` before you report.

## Limits

These three are the only rules:

- **Identity.** Dark; FITWAY red; Readex Pro at its real weights; the FITWAY wordmark and logo; inside the Eclipse
  family of the Owner pages (its light, its grain, its surfaces). A colour beyond these is allowed when it earns its
  place inside the family; say why in the report.
- **Truth.** Nothing looks like a reading that is not one: the usual day and other days are visibly usual, never live;
  nothing after "Now" looks measured; the green Live dot appears only beside Live; the level's written word is always
  visible. The day never reveals the gym's capacity. Hours are the finest grain (an hour hides a single arrival at
  low counts).
- **Privacy.** No personal or per-visitor data; any figure is an aggregate. Length of stay is not part of this round.

Motion is allowed. Under reduced motion the page carries the same information without it.

## What the user turned down before, and why

Information, not bans. Each reason is the user's; where none could be given beyond taste, it says so.

- A timetable, a status page, a car's tachometer: each borrowed its idea from another world.
- Directions that tried to impress: they showed off instead of serving.
- A light climbing both edges to the level's height: the motion was not natural, nor close to anything people know.
- A sliding strip of level words; the screen cut into one band per level: bad layouts, and thin on what they give the
  trainee.
- A colour ramp from graphite through deep red to red across the day: taste.
- A strong glow: too strong.
- Lights that drifted from the Owner pages' family and left the screen almost wholly black. The light the user kept
  (`reach`, in the last sketch) belongs to that family.
- A red level word: red over the red light lost its contrast.
- A level word sized to fill the computer's column: far too large.
- The usual day as hollow outlined bars: no invention in how the bar is drawn or revealed, and too many bars.
- The usual day as a soft curved haze behind bars: it did not agree with the bars; a curve behind a design of bars has
  no consistency.
- Today as one thin line, or as dots: lifeless and far too plain.

## Content and switches

Synthetic data only: the four levels with sketch 11's counts and percentages, `?level=quiet|moderate|busy|packed`,
open until 1:00 AM, Live with the last reading at 7:41 PM, today a Friday. A usual shape for each of the seven days
with its own opening hours, `?day=` for a picked weekday, `?pct=off`. Keep the page whole without the percentage.
English this round, with Western digits and a 12-hour time; Arabic follows. Build so that `?dir=rtl` mirrors the page
without a redesign: in Arabic time runs right to left and the week starts on Saturday. List every line of copy you
write.

## Deliverable

Work in files whose names start with `public-sketch-12` under
`design-research/owner-composition-exploration-r04/directions/eclipse/`; you may start from sketch 11's files or from
nothing. Leave every other `public-*` file, the Owner pages and the shared `style.css` as they are. Set
`window.__sketch = { ready: true }` once the fonts have loaded. Commit at natural checkpoints, with a short notes file
in `D:/fitway-temp/<run>/` saying what is decided and what is left, and commit once at the end.

## Frames

Render every frame with `pnpm verify:owner frames` and lay frames out with `pnpm verify:owner sheet`, as
`D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"Public designer
frames" gives them, into `D:/fitway-temp/<run>/`, which the
coordinator made with `pnpm run-folder:new`. This worktree's copy of the tool predates those commands: run them, read
only, from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to this
worktree's `design-research/owner-composition-exploration-r04/directions/eclipse` folder as an absolute path. Use
`phone@3`, `phone360@3` and `desktop@2`, under reduced motion unless a frame shows motion. Inspect every frame
yourself before reporting; a passing command is not a looked-at frame. (agent-tooling DECISIONS item 23)

Sheets, each frame under its name:

- `sheet-designs`: every design at Quiet and Packed on the phone, then Busy on the computer;
- `sheet-days`: your pick on the phone at today and two other days, one with different opening hours;
- `sheet-levels`: your pick at the four levels on the phone, then on the computer;
- `sheet-checks`: your pick on the 360 phone, with `?pct=off`, and with `?dir=rtl`.

## Report

At most 40 lines:

- the critique's main findings and scores for each design;
- any ideas you tried and dropped, a line each;
- each design you kept in a line, and your pick with the reason;
- how each feature is shown in your pick: the usual day and "Now", busier or quieter than usual, the quietest time
  left, other days, the live reading;
- what moves, and how it reads under reduced motion;
- what changed on the narrow phone, without the percentage, and in the mirror check;
- the copy you wrote;
- the frame and sheet paths;
- what is left;
- any rule that made the page read wrong, named (WORKING_AGREEMENTS "Rules and findings");
- the files you changed and the commit SHA.
