<!-- brief-format: v1 role: designer -->
# Designer brief: the public crowd page, a new direction, the draft (public-redesign-r01)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-010): the superseded Public Paper frames,
the shipped page and the earlier rounds' pages are reference only, never a reason to accept or reject.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `c5f64fa5`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `DESIGN_GUIDE.md` §"FITWAY Design Guide", the "Public redesign scope" note at its top: the identity and the content.
  - `DESIGN_GUIDE.md` §"5. Public crowd instrument", its bulleted rules only (they hold for any form): what keeps the crowd mark truthful.
  - `DESIGN_GUIDE.md` §"9. RTL, localization, and time": digits, time and direction.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md` rows GLO-2, GLO-3, GLO-9: the words for the count, the four levels and the last update.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-02-foundations-1-9.md` §"1. Shared foundations (Owner, Staff and Public)": the dark ground, FITWAY red, the light and Readex Pro, as a reference for the identity only.
  - `D:/fitway-temp/public-r01-refs/INDEX.tsv` and the screenshots it names: references gathered for you, unranked.

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

- `<run>` is `public-redesign-r01-direction-3`.
- Run `pnpm check:design-context` and `pnpm context:show --milestone public-redesign-r01` first. Impeccable is the one
  design skill; load no other design or taste skill. Follow Impeccable's whole process; its context, notes and any
  file it writes outside the page go in `D:/fitway-temp/<run>/`, never in the repository. (AGENTS.md)

## The question

A gym's visitors open this page on their phones to see whether the gym is busy right now. What should that page be?
Draw one whole direction of your own: the composition, sizes and type scale, surfaces, the crowd mark's form, the
order on screen and how the whole screen is used are yours. Look at the references first and pick what you draw on.

The user turned down the last direction as a whole and asked for a wholly different idea, not a revision of it. In
the user's words: the page did not look orderly («حسيت الشكل مب مرتب»), and the crowd curve drawn top to bottom read
badly («شكل المنحنى الطولي مب كويس»). That direction made the page the day's timetable, the hours as rows from
opening to closing with the current hour lit; its frames are
`D:/fitway-temp/public-redesign-r01-direction-2/frames-final/final-phone-first.png` and `final-desktop-first.png`
beside it.

## Limits

- **Identity:** dark; FITWAY red; the light; Readex Pro at its real weights. Nothing else is fixed by the Owner pages.
- **Truth:** the count is labelled approximate; the crowd mark derives from the level only and its written word is
  always visible; Western digits and a 12-hour time with «ص/م» in gym time; no personal data; synthetic data only.
- **Name:** the brand FITWAY is the gym's name; no other name appears on the page.
- **Content:** the crowd level, the approximate count, that the gym is open, the last update, today's typical-day
  curve, and a percentage. The page reads whole if the percentage is taken away. Choose synthetic values that agree
  with each other (the level follows the percentage) and say them in your report.
- **This round:** Arabic, the live state, on the phone (390 × 844) and on the computer (1440 × 900).

## Deliverable

The direction as a real page, `public.html` with `public.css` and `public.js` (replace the last direction's page;
one page, no option switch), under `design-research/owner-composition-exploration-r04/directions/eclipse/`.
You may add files there whose names start with `public-`; you change no Owner page file and not the shared
`style.css`. Commit at natural checkpoints with a short notes file in `D:/fitway-temp/<run>/` saying what is decided
and what is left, and once at the end.

Render with verify-fitway's `run` (`.agents/skills/verify-fitway/SKILL.md` §"Run one check"): one script in
`D:/fitway-temp/<run>/`, `--concept` set to this worktree's Eclipse folder and `--out` inside the run folder, opening
`public.html` through `url("build", ...)` with `newPage` at `phone` and `desktop`, Arabic. Save the first screen at
each size and the phone's whole page. No capture script goes in the repository. Look at your frames yourself.

## Report

At most 40 lines: the idea in two or three lines; the references you drew on (their INDEX numbers) and what you took
from each; the synthetic values; the frame paths; where it breaks or what you would change next; any rule that made
the page read wrong, named (WORKING_AGREEMENTS "Rules and findings"); the files you changed and the commit SHA.
