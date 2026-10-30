<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, three more directions from sketch 1 (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-1.html` and `public-sketch-1.css`: the sketch you start from.
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

- `<run>` is `public-redesign-r01-sketches-7`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Use Impeccable to find and shape the directions; a sketch skips
  its build-out and finish steps. Its context, notes and any file it writes outside the pages go in
  `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

A gym's visitors open this page on their phones to see whether the gym is busy right now. Of four quick sketches, the
user kept sketch 1 and asked for directions grown from it. Its frame:
`D:/fitway-temp/public-redesign-r01-sketches-5/frames/sketch-1.png`.

A first designer drew three directions from it: A, the corner light's strength is the level; B, the word's weight is
the level, with bars as thick as its strokes; C, the level over the last reading's time, set as large. The user found
the three alike, and asked for three more. Their pages are `public-sketch-6a.html` to `-6c.html` beside sketch 1, and
their sheet `D:/fitway-temp/public-redesign-r01-sketches-6/frames/sheet.png`.

Draw three more directions from sketch 1. Each goes further from it than A, B and C did, so the three differ from one
another and from A, B and C. Look at sketch 1 and judge it yourself; where each direction takes it is yours.

One fact each direction meets: «شديد الازدحام» is the longest level. At sketch 1's 118 px, «الازدحام» alone is wider
than the 350 px column, so even two lines do not fit at that size; A, B and C set it at 100 px in two lines.

Turned down, so not to return to:

- The other three first sketches: four full-width bands with the current one open; the four words in one strip with
  the phone a window on the current one; light climbing both edges of the page to the level's height.
- Three earlier directions, each borrowing its idea from another world: a prayer-times board (the hours as rows, the
  current hour lit), a service status page (a card of facts in rows), a car's tachometer (a dial with a needle).
  Their frames: `D:/fitway-temp/public-redesign-r01-direction-{2,3,4}/frames-final/final-phone-first.png`.

## Limits

- **Identity:** dark; FITWAY red; the light; Readex Pro at its real weights. Nothing else is fixed by the Owner pages.
- **Name:** the brand FITWAY is the gym's name; no other name appears on the page.
- **Truth:** the count is labelled approximate; the crowd mark derives from the level only and its written word is
  always visible; Western digits and a 12-hour time with «ص/م» in gym time; no personal data; synthetic data only.
- **Content:** the crowd level, the approximate count, that the gym is open, the last update, and a percentage. The
  page reads whole if the percentage is taken away. Use sketch 1's values (مزدحم, 70, open until 1:00 ص, last reading
  7:41 م, 58%) in all three, and A, B and C's Packed values (106, 88%) for the Packed still.
- **Each direction:** Arabic, the live state, on the phone (390 × 844), its first screen, a still; and a second still of
  the same page at «شديد الازدحام». Finished in look, not in detail: spend on the idea.

## Deliverable

Three pages, `public-sketch-7a.html` to `public-sketch-7c.html`, each with its own files named `public-sketch-7X.*`, under
`design-research/owner-composition-exploration-r04/directions/eclipse/`. `?level=packed` switches a page to the Packed
still, as A, B and C do. Leave `public.html`, `public.css`, `public.js` and every earlier sketch as they are. You change
no Owner page file and not the shared `style.css`. Each page sets `window.__sketch = { ready: true }` once its fonts have
loaded, as sketch 1 does. Commit once the three are done.

Render with verify-fitway's `run` (`.agents/skills/verify-fitway/SKILL.md` §"Run one check"): one script in
`D:/fitway-temp/<run>/`, `--concept` set to this worktree's Eclipse folder and `--out` inside the run folder, opening
each page through `url("build", ...)` with `newPage` at `phone`, Arabic. Save `D:/fitway-temp/<run>/frames/7X.png` and
`7X-packed.png` for each, and one sheet `D:/fitway-temp/<run>/frames/sheet.png`: the three live stills side by side,
each under a large letter D-F, and under each its Packed still, smaller; nothing else written. No capture script goes in
the repository. Look at your frames yourself.

## Report

At most 30 lines: for each direction, its idea in one or two lines and what it changes from sketch 1; the frame and
sheet paths; any rule that made a direction read wrong, named (WORKING_AGREEMENTS "Rules and findings"); the files you
added and the commit SHA.
