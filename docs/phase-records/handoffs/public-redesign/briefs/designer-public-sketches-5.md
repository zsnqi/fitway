<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, four quick sketches (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `4932b9e8`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument", its bulleted rules only (they hold for any form): what keeps the crowd mark truthful.
  - `DESIGN_GUIDE.md` §"9. RTL, localization, and time": digits, time and direction.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md` rows GLO-2, GLO-3, GLO-9: the words for the count, the four levels and the last update.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-02-foundations-1-9.md` §"1. Shared foundations (Owner, Staff and Public)": the dark ground, FITWAY red, the light and Readex Pro, as a reference for the identity only.

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

- `<run>` is `public-redesign-r01-sketches-5`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Use Impeccable to find and shape the ideas; a sketch skips its
  build-out and finish steps. Its context, notes and any file it writes outside the pages go in `D:/fitway-temp/<run>/`,
  never in the repository. (AGENTS.md)

## The question

A gym's visitors open this page on their phones to see whether the gym is busy right now. What should that page be?
Show four different answers to that, as four quick sketches, so the user can pick one to be drawn in full.

The user turned down four earlier directions. Looking back over them, the user agreed on the common cause: each
borrowed its idea from another world and dressed the page in it: a prayer-times board (the hours as rows, the current
hour lit), a service status page (a card of facts in rows, like GitHub's), and a car's tachometer (a dial with a
needle). The page should have a language of its own, FITWAY's, for a gym's visitor. What else the user said about them:
the timetable was a mess and the eye did not know where to look; the status page was tidy but plain, with no character,
closer to an admin dashboard, its rows of facts dull like a table; nothing in the tachometer was liked. Their frames,
for what to move away from: `D:/fitway-temp/public-redesign-r01-direction-{2,3,4}/frames-final/final-phone-first.png`.

## Limits

- **Identity:** dark; FITWAY red; the light; Readex Pro at its real weights. Nothing else is fixed by the Owner pages.
- **Name:** the brand FITWAY is the gym's name; no other name appears on the page.
- **Truth:** the count is labelled approximate; the crowd mark derives from the level only and its written word is
  always visible; Western digits and a 12-hour time with «ص/م» in gym time; no personal data; synthetic data only.
- **Content:** the crowd level, the approximate count, that the gym is open, the last update, and a percentage. The
  page reads whole if the percentage is taken away. Choose synthetic values that agree with each other (the level
  follows the percentage) and use the same values in all four.
- **Each sketch:** Arabic, the live state, on the phone (390 × 844), its first screen, a still. Finished in look, not in
  detail: spend on the idea.

## Deliverable

Four pages, `public-sketch-1.html` to `public-sketch-4.html`, each with its own files named `public-sketch-N.*` if it
needs them, under `design-research/owner-composition-exploration-r04/directions/eclipse/`. Leave `public.html`,
`public.css` and `public.js` as they are. You change no Owner page file and not the shared `style.css`. Commit once
the four are done.

Render with verify-fitway's `run` (`.agents/skills/verify-fitway/SKILL.md` §"Run one check"): one script in
`D:/fitway-temp/<run>/`, `--concept` set to this worktree's Eclipse folder and `--out` inside the run folder, opening
each page through `url("build", ...)` with `newPage` at `phone`, Arabic. Save `D:/fitway-temp/<run>/frames/sketch-N.png` for each, and one
sheet `D:/fitway-temp/<run>/frames/sheet.png` with the four side by side, each under a large number 1-4 and nothing else written. No capture
script goes in the repository. Look at your frames yourself.

## Report

At most 30 lines: for each sketch, its idea in one or two lines and where it would go if picked; the synthetic values;
the frame and sheet paths; any rule that made a sketch read wrong, named (WORKING_AGREEMENTS "Rules and findings");
the files you added and the commit SHA.
