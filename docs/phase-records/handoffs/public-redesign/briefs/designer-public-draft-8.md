<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, the full draft from direction B (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-6b.html` and `public-sketch-6b.css`: direction B, the page you draw in full.
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument", its bulleted rules only (they hold for any form): what keeps the crowd mark truthful.
  - `DESIGN_GUIDE.md` §"9. RTL, localization, and time": digits, time and direction.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md` rows GLO-2, GLO-3, GLO-9: the words for the count, the four levels and the last update.

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

- `<run>` is `public-redesign-r01-draft-8`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

A gym's visitors open this page on their phones to see whether the gym is busy right now. Over several rounds the user
picked direction B, `public-sketch-6b.html`: the level's word large, four bars under it for the four levels, one line
of facts and a stamp, the red light in the top corner. Its frames:
`D:/fitway-temp/public-redesign-r01-sketches-6/frames/6b.png` and `6b-packed.png`.

Draw B in full. The page needs no new idea. What it lacks is craft: the sizes, the spacing, the balance of the screen,
and how it stands on the computer. Directions that added an idea were turned down, the last three because each tried to
impress the visitor, with too much invention: the level's word lit as a haloed sign, the word stretched by a kashida
that carried the levels, the word pushed to the top edge with the header moved to the foot. Their frames, for what to
move away from: `D:/fitway-temp/public-redesign-r01-sketches-7/frames/sheet.png`.

What the visitor takes away, in a glance: whether the gym is busy, how many people are inside, and that it is open.
The open line need not be prominent; visitors know the gym's hours.

Two changes from B:

- **One weight for the word at every level.** B changes the word's weight with the level; the draft does not.
- **The four-level mark.** The draft carries B's bars, refined. Then draw three other forms of the mark, each on the
  refined page with nothing else changed, so the user can compare the four and pick one.

One fact: «شديد الازدحام» is the longest level. At sketch 1's 118 px, «الازدحام» alone is wider than the 350 px phone
column; B sets the level at 100 px in two lines.

## Limits

- **Identity:** dark; FITWAY red; the light; Readex Pro at its real weights. Nothing else is fixed by the Owner pages.
- **Name:** the brand FITWAY is the gym's name; no other name appears on the page.
- **Truth:** the count is labelled approximate; the crowd mark derives from the level only and its written word is
  always visible; Western digits and a 12-hour time with «ص/م» in gym time; no personal data; synthetic data only.
- **Content:** the crowd level, the approximate count, that the gym is open, the last update, and a percentage. The
  page reads whole if the percentage is taken away. B's values: Busy (مزدحم, 70, open until 1:00 ص, last reading
  7:41 م, 58%) and Packed (106, 88%).
- **This round:** Arabic, the live state, on the phone (390 × 844) and on the computer (1440 × 900).

## Deliverable

The draft as a real page, `public.html` with `public.css` and `public.js` (they hold the turned-down direction 4;
replace them), under `design-research/owner-composition-exploration-r04/directions/eclipse/`. `?level=packed` shows
Packed; `?mark=2`, `?mark=3` and `?mark=4` swap in the three other forms of the mark and change nothing else; without
it the page shows the refined bars. You may add files there whose names start with `public-`; leave every
`public-sketch-*` file as it is; you change no Owner page file and not the shared `style.css`. The page sets
`window.__sketch = { ready: true }` once its fonts have loaded, as B does. Commit at natural checkpoints with a short
notes file in `D:/fitway-temp/<run>/` saying what is decided and what is left, and once at the end.

Render with verify-fitway's `run` (`.agents/skills/verify-fitway/SKILL.md` §"Run one check"): one script in
`D:/fitway-temp/<run>/`, `--concept` set to this worktree's Eclipse folder and `--out` inside the run folder, opening
`public.html` through `url("build", ...)` with `newPage` at `phone` and `desktop`, Arabic. Save in
`D:/fitway-temp/<run>/frames/`: `phone.png`, `phone-packed.png`, `desktop.png` (the first screen of each), and
`mark-1.png` to `mark-4.png` (the phone's first screen with each form of the mark, Busy). Build two sheets:
`sheet-draft.png` (the phone, its Packed still and the computer side by side) and `sheet-marks.png` (the four mark
frames side by side, each under a large number 1-4, nothing else written). No capture script goes in the repository.
Look at your frames yourself.

## Report

At most 40 lines: what you changed from B and why, in a few lines; the three other forms of the mark, each in a line;
the frame and sheet paths; where it breaks or what you would change next; any rule that made the page read wrong,
named (WORKING_AGREEMENTS "Rules and findings"); the files you changed and the commit SHA.
