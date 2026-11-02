<!-- brief-format: v1 role: verifier -->
# Verifier brief: the public page as a whole, against its specification (public-redesign-r01)

For a fresh `owner-direction-verifier` (Opus, high). Review independently: read no designer report and no other
reviewer's output, and never edit what you review. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `5951ae53`
  (the coordinator may add a Markdown-only record commit on top; review `5951ae53`)
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `.css`, `.js` and
    `public-copy.js` at `5951ae53`: the page under review.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/PUBLIC-SPEC.md` and its parts
    `public-1.md` to `public-4.md` in its `spec` folder, at `5951ae53`: what the page claims to do, row by row.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md` §"5. Public crowd instrument",
    §"6. Public state grammar" (with "Loading behaviour") and §"9. RTL, localization, and time".
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md`
    §"2.1 Glossary", §"2.2 Dates, times and ranges", §"2.4 State grammar" and §"2.5 Truthfulness".
  - `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`: the interactions' motion values.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`
    §"Public designer frames" and §"CLI working loop": the commands you render and measure with.

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

- `<run>` is `public-redesign-r01-verify-44`, made by the coordinator with `pnpm run-folder:new`. Write only in
  `D:/fitway-temp/public-redesign-r01-verify-44/`; the coordinator checks `git status` in every worktree afterwards.
  (r04 G5)
- Render and measure the commit, never the working tree: `pnpm verify:owner frames --ref 5951ae53 --page public.html`,
  `pnpm verify:owner run --script ... --ref 5951ae53` and `pnpm verify:owner measure --tool motion --ref 5951ae53
  --page public.html`, from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell. The commands
  accept ports 3176, 3186 or 3188 only; use 3188. `frames` needs a fresh empty `--out`; in PowerShell quote `'ar,en'`.
  The page server on port 3181 is the user's phone; leave it alone.

## What was delivered

`5951ae53` is a gym's public page, concept-only (ADR-010): how busy it is now, against a usual day's hours, with a row
of days. Arabic is the default (`lang="ar" dir="rtl"`), English at `?lang=en`. Switches: `?state=loading|live|delayed|unavailable|closed|error`,
`?day=sat` and the like, `?hour=<0-25>`, `?level=quiet|steady|busy|packed`. `PUBLIC-SPEC.md` describes it in rows
`PUB-<n>` with `file:line` evidence, and lists the page's logged departures from the family's rules and the proposed
production amendments `AMD-P1` to `AMD-P6`. A logged departure or amendment is the user's to decide: report it only
if the page does not do what the row says.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | Each `PUB-` row is true of the page at `5951ae53`, and its `file:line` points at the code it names (sample at least one row in five, every row with a number in it, and every departure row) | row, the measurement or code, PASS/FAIL |
| V2 | No non-live state (Loading, Delayed, Unavailable, Closed, Error) can read as the gym now: no live red, no Live dot, no comparison with usual, no count dressed as current; Loading follows §6's timings and shifts nothing on arrival | frames of each state in both languages, a layout-shift trace |
| V3 | Nothing is cut, overlapped or badly wrapped at 320, 360, 390, 768, 1024, 1440 and 1440 at 200% zoom, in both languages, in Live at each level and in every state | frames, a geometry probe |
| V4 | The head holds still when the level changes, and nothing jumps when the day changes or an hour is picked, at every phone width in both languages | position traces, 0 px or the value |
| V5 | Keyboard and touch: every control is reached and operated by keyboard in reading order with a visible focus; targets meet 24 px or have an equivalent control; the drag and the arrow keys follow the reading direction | a keyboard trace, target sizes |
| V6 | The interactions meet their `STANDARDS.md` values; reduced motion carries the same information without movement | motion traces |
| V7 | Each language reads natively, time and ranges in the right order, the glossary's words where it has them | the string and where it shows |
| V8 | The tools are proven before they are trusted (a planted defect or self-test each) | the control's output |

Look at every frame you cite, at full size where a few pixels matter.

## Report

At most 60 lines: the table with PASS, FAIL or NOT RUN and one line of evidence each; then each finding tiered
(High, Medium, Low) with its language, width, state, frame path, measurement and the `file:line` to change, and the
`PUB-` row it contradicts if any; the frames, sheets and traces by path; any rule in this brief that made the review
read wrong, named (WORKING_AGREEMENTS "Rules and findings").
