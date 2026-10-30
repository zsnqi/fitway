<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, a polish round on B's draft (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `public.css` and `public.js`: the draft you polish.
  - `D:/fitway-temp/public-redesign-r01-draft-8/notes.md`: the last designer's notes on what it decided and left.
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

- `<run>` is `public-redesign-r01-polish-9`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Impeccable's context, notes and any file it writes outside the
  pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

A gym's visitors open this page on their phones to see whether the gym is busy right now. The user accepted the
direction of the draft in `public.html`: the level's word large, in one weight and one size at every level; four bars
under it for the four levels, their line fixed in place; the count, the open line and a stamp; the red light in the top
corner. Its frames: `D:/fitway-temp/public-redesign-r01-draft-8/frames/sheet-draft.png` and `checks/`.

Polish it with Impeccable's commands, in this order: `critique` the page, then `layout` and `typeset` on what the
critique finds, then `polish`. The page needs no new idea and must not try to impress the visitor: earlier directions
were turned down for exactly that. Work on the sizes, the spacing, the balance and the type, on the phone and on the
computer.

What the user said about the draft:

- **The mark** is form 1, the bars (the page without `?mark`). The unlit Packed bar being the tallest shape in the row
  is fine.
- **The order on screen and the open line are yours.** Visitors already know the gym's hours (it is not a new gym), so
  the open line need not be prominent.
- **The computer:** with a short word («هادئ», «متوسط», «مزدحم») the half beside the word, above the mark, stays empty.
  It is acceptable, and worth a second look.
- **Quiet and Moderate** sit about 40 px above the mark, because they have no descender and the mark's line is fixed.
  That is fine; the fixed line stays.

## Limits

- **Identity:** dark; FITWAY red; the light; Readex Pro at its real weights. Nothing else is fixed by the Owner pages.
- **Name:** the brand FITWAY is the gym's name; no other name appears on the page.
- **Truth:** the count is labelled approximate; the crowd mark derives from the level only and its written word is
  always visible; Western digits and a 12-hour time with «ص/م» in gym time; no personal data; synthetic data only.
- **Content:** the crowd level, the approximate count, that the gym is open, the last update, and a percentage. The
  page reads whole if the percentage is taken away. Keep the draft's values at each level.
- **This round:** Arabic, the live state, all four levels, on the phone (390 × 844) and on the computer (1440 × 900).

## Deliverable

The polished page in `public.html`, `public.css` and `public.js`, under
`design-research/owner-composition-exploration-r04/directions/eclipse/`. Keep `?level=` working; `?mark=2`, `?mark=3`
and `?mark=4` may stay as they are and need no polish. You may add files there whose names start with `public-`; leave
every `public-sketch-*` file as it is; you change no Owner page file and not the shared `style.css`. Keep
`window.__sketch = { ready: true }` once the fonts have loaded. Commit at natural checkpoints with a short notes file in
`D:/fitway-temp/<run>/` saying what is decided and what is left, and once at the end.

Render with verify-fitway's `run` (`.agents/skills/verify-fitway/SKILL.md` §"Run one check"): one script in
`D:/fitway-temp/<run>/`, `--concept` set to this worktree's Eclipse folder and `--out` inside the run folder, opening
`public.html` through `url("build", ...)` with `newPage` at `phone` and `desktop`, Arabic. Save in
`D:/fitway-temp/<run>/frames/` the first screen at each size for each of the four levels
(`phone-<level>.png`, `desktop-<level>.png`, level one of `quiet`, `moderate`, `busy`, `packed`). Build two sheets:
`sheet-before-after.png` (top row the draft's `phone.png`, `phone-packed.png` and `desktop.png` from
`D:/fitway-temp/public-redesign-r01-draft-8/frames/`; bottom row your phone Busy, phone Packed and computer Busy; a large
"before" and "after" at the start of each row, nothing else written) and `sheet-levels.png` (your four phone levels side
by side). No capture script goes in the repository. Look at your frames yourself.

## Report

At most 40 lines: the critique's main findings in a few lines (with its scores if it gives them); what you changed
for each, and what you chose not to change and why; the frame and sheet paths; what is left; any rule that made the
page read wrong, named (WORKING_AGREEMENTS "Rules and findings"); the files you changed and the commit SHA.
