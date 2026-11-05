<!-- brief-format: v1 role: builder -->
# Builder brief: the accepted public page's specification, refreshed once (public-redesign-r01)

For a fresh `owner-direction-builder` (Opus, high). Concept-only (ADR-010). You restate the specification from the accepted page; you change no page file.

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `087df88c`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/PUBLIC-SPEC.md` and its four parts, `design-research/owner-composition-exploration-r04/directions/eclipse/spec/public-1.md` to `design-research/owner-composition-exploration-r04/directions/eclipse/spec/public-4.md`: what you update.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `public.css`, `public.js`, `public-copy.js`, `public-slide.js`, `public-ink.js` in that folder: the page. Where the code and a report disagree, the code wins; list each disagreement in 6.12.
  - The reports: `D:/fitway-temp/public-redesign-r01-carry-63/REPORT.md`, `D:/fitway-temp/public-redesign-r01-final-form-64/REPORT.md`, `D:/fitway-temp/public-redesign-r01-picks-65/REPORT.md`, `D:/fitway-temp/public-redesign-r01-fix-67/REPORT.md`, `D:/fitway-temp/public-redesign-r01-recheck-68/REPORT.md`.

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

## The decision

The user accepted this page by eye on 2026-11-05, as at `62adb061`: «شفتها و اقبلها». The specification now says what the accepted page does, once. The specification was last true at run final-fixes-45.

## Causes and required outcomes

- **S1.** Rows no longer match the page. The carry and final-form reports list them: Data 2, 3, 28, 92, 97, 102, 107, 112. Two-hour bars 6, 16, 22, 23, 30, 41, 49, 98, 100, 101, 110, 111, 113, 134. Label 4, 38-40, 43, 45, 65, 117, 130, 131, 137, AMD-P5. Bars, pick, motion 12, 14, 15, 17, 19, 20, 31, 47, 48, 50, 52, 53. Quiet line 1, 18, 24, 33-36, 93-96, 109, AMD-P3. Head 9-11, 41, 42, 44, 46, 61, 71, 72, 140, 141. Shadda 37, 83, 86, 87. Spans 58, 136. Also 6, 13, 17, 22, 25, 27, 30, 32, 36-38, 40, 43, 69, and 35, 78, 118 for the picks. Outcome: each of these rows states what the page does at HEAD, with `file:line` evidence, and a row whose feature is gone says so in one line rather than being renumbered. These lists are where to start, not the limit: the fix round's commits `65ccdc95`, `94e134d1`, `920a08dc` and `62adb061` have no list, so read their diffs and correct any row they changed too.
- **S2.** The picks have no rows. Outcome: `note=none` (Unavailable has no sentence under its word) and `whole=line` (a whole day carries its circle and the short line, the words as `public-copy.js` has them, with no "busiest" wording) are stated. The `?note=` and `?whole=` switches are removed from the page by commit `0db7a443` if the code shows it; state what the code does.
- **S3.** The states' rows predate the fix round. Outcome: rows state that nothing moves on a state change at any size and nothing scrolls, Unavailable's blank band stays so the card never moves (the user's word), and 6.5 lists what is not met: 320 x 568's scroll if the code still has it, English 320's picked hour 15.3 px, days 14 to 15.5 px on small phones, Arabic 320's day air 2.6 px. Each measured number names its source in the Sources table, under a new code for this round.
- **S4.** The amendments lack one. Outcome: 6.10 gains AMD-P7, proposed and never decided: `DESIGN_GUIDE.md` line 192's "Explain that old data is not presented as current" changed to "State that the count is unavailable", because the word and the missing number already say it; "Remove count, band, level mark, and timestamp" stands, as does the rule that stale data never looks live. AMD-P3 carries English "Quieter than usual" and "Busier than usual", which match Arabic, and no longer "Much quieter" or "Much busier", if the code shows that.
- **S5.** The file list is short. Outcome: the concept line in `PUBLIC-SPEC.md` names `public-ink.js`, and its header states this round and HEAD.
- **S6.** Agents hunted public rules across decisions and guides. Outcome: a new file `PUBLIC-RULES.md` beside `PUBLIC-SPEC.md`, at most one page (60 lines), a table of the rules that decide the page: rule, `PUB-` or family id, and the file that holds it. Its first lines name the must-haves: the level, the approximate count, open or closed, the last update, the percentage, today's curve. `PUBLIC-SPEC.md` links it.

Keep each part under 40,000 bytes, splitting at a heading if needed. Row numbers stay stable.

## Limits

- Change no page file (`public.*` code, CSS, JS). A fault you find in the page goes in the report, not in a fix.
- Raw figures from any outside source stay out, and the source of the demo data is never named. Do not read anything outside the worktree except the listed reports and `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md`.
- Amendments stay proposals. Change no file outside `PUBLIC-SPEC.md`, `PUBLIC-RULES.md` and the public parts of the specification.

## Verification

Render what you measure with `pnpm verify:owner frames --concept <the Eclipse folder> --page public.html --languages 'ar,en' --port 3176` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, into `D:/fitway-temp/public-redesign-r01-spec-69/`. Look at the frames you cite. Then `pnpm check:repository` in the worktree. Leave the ladder to CI; this round changes Markdown only.

Commit once at the end. Do not push.

## Report

At most 30 lines: files and byte sizes; rows changed per part; rows that now say a feature is gone; each disagreement between code and reports; any fault found in the page; anything not met; the commit SHA.
