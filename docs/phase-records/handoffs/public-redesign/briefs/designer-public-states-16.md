<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, its other states (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD the merge that
  brings in this brief
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `public.css` and `public.js`: the accepted live page.
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument", its first bulleted list only (the redesign's level mark).
  - `DESIGN_GUIDE.md` §"6. Public state grammar", the table and "Loading behaviour": what each state must and must not show.
  - `DESIGN_GUIDE.md` §"9. RTL, localization, and time".
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md` rows GLO-2, GLO-3, GLO-5, GLO-7, GLO-9, and STA-10 to STA-13 for their words only (those rows describe the Owner pages; their layouts do not apply here).

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

- `<run>` is `public-redesign-r01-states-18`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill (`ux-araby` for Arabic copy is allowed). Impeccable's context,
  notes and any file it writes outside the pages go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

A gym's visitors open this page on their phones to see whether the gym is busy right now. The user accepted the live
page as it is in `public.html`: its layout, its sizes and its mark. This round draws the page's other states on that
page, so each one reads true and belongs to the same page: **Loading, Delayed, Unavailable, Closed and Error**
(`DESIGN_GUIDE.md` §6). Use Impeccable's `harden` for the states, then `polish` on what you drew.

The live page does not change in this round. Motion is the next round's work: draw every state at rest, with no new
animation.

## Limits

- **Identity:** dark; FITWAY red; the light; Readex Pro at its real weights.
- **Name:** the brand FITWAY is the gym's name; no other name appears on the page.
- **Truth:** nothing stale, absent, closed or loading looks live (no «مباشر», no green dot, no lit level on any of
  them); the count is labelled approximate; the level mark derives from the level only and its written word is
  always visible where a level is shown; Western digits and a 12-hour time with «ص/م» in gym time; no personal data;
  synthetic data only.
- **Each state's content** is §6's table: Delayed keeps the last count, level and mark visibly qualified as last-known,
  with «متأخر», the absolute time and its age; Unavailable and Error remove the count, the level, the mark and the
  time; Closed removes the readings and the mark and says when it opens; Loading follows "Loading behaviour"
  (placeholders with the content's exact geometry, the mark's placeholder a flat baseline or an empty frame, zero
  layout shift when the data arrives, measured). Error has one focused retry.
- **Words:** use the rows above where they fit. Any line not in them is yours to write: list each in the report with
  its English, for the user to review.
- **This round:** Arabic, on the phone (390 x 844) and on the computer (1440 x 900). Delayed at Busy's values with the
  last reading 13 minutes old; Closed before opening, opening 6:00 ص.

## Deliverable

`?state=loading|delayed|unavailable|closed|error` on `public.html` shows each state; without it the page shows the live
state exactly as today (`?level=` and `?mark=` keep working). Render the live page at both sizes and all four levels
before you change anything, and compare after: it must be identical to the pixel; report the result. Change only
`public.html`, `public.css` and `public.js` (you may add files there whose names start with `public-`); leave every
`public-sketch-*` file, the Owner pages and the shared `style.css` as they are. Keep `window.__sketch = { ready: true }`
once the fonts have loaded. Commit at natural checkpoints with a short notes file in `D:/fitway-temp/<run>/` saying
what is decided and what is left, and once at the end.

Render with verify-fitway's `run` (`.agents/skills/verify-fitway/SKILL.md` §"Run one check"), or with a node script
in the run folder in the style of `D:/fitway-temp/public-redesign-r01-sizes-17/` (its serve and capture scripts), Arabic,
reduced motion, the phone at density 3 and the computer at density 2. Save in `D:/fitway-temp/<run>/frames/`:
`phone-<state>.png` and `desktop-<state>.png` for the five states and for `live` (Busy). Build two sheets:
`sheet-phone.png` (the six phone frames side by side, right to left live, delayed, closed, loading, unavailable,
error, each under its Arabic name in large type) and `sheet-desktop.png` (the six computer frames in two rows of
three, named the same way). No capture script goes in the repository. Look at your frames yourself.

## Report

At most 40 lines: each state in a line or two (what it shows and removes); the critique's findings if it gives
scores; the live page's pixel comparison; the loading arrival's measured shift; the new lines of copy with their
English; the frame and sheet paths; what is left; any rule that made a state read wrong, named (WORKING_AGREEMENTS
"Rules and findings"); the files you changed and the commit SHA.
