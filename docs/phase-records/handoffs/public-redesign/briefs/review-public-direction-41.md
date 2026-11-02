<!-- brief-format: v1 role: verifier -->
# Verifier brief: how the public page reads in Arabic and in English (public-redesign-r01)

For a fresh `rtl-ltr-reviewer` (Opus, high). Review independently: read no designer report and no other reviewer's
output, and never edit what you review. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `27758b4e`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public.html`, `.css`, `.js` and
    `public-copy.js` at `27758b4e`: the page under review.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/DESIGN_GUIDE.md` §"9. RTL, localization, and time".
  - `design-research/owner-composition-exploration-r04/directions/eclipse/spec/design-04-content-rules.md`
    §"2.1 Glossary" and §"2.2 Dates, times and ranges".
  - `C:/Users/Pc Force/.agents/skills/ui-forensics/SKILL.md`: what the geometry probes measure.
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

- `<run>` is `public-redesign-r01-direction-41`, made by the coordinator with `pnpm run-folder:new`. Write only in
  `D:/fitway-temp/public-redesign-r01-direction-41/`; the coordinator checks `git status` in every worktree
  afterwards. (r04 G5)
- Render and measure the commit, never the working tree: `pnpm verify:owner frames --ref 27758b4e --page public.html`
  and `pnpm verify:owner run --script ... --ref 27758b4e`, from `D:/Projects/fitway-worktrees/owner-design-exploration-r04`
  in PowerShell. The commands accept ports 3176, 3186 or 3188 only; use 3188.

## What was delivered

`27758b4e` is a gym's public page: how busy it is now, against a usual day's hours, with a row of days. Arabic is the
default (`lang="ar" dir="rtl"`), English at `?lang=en`. It has six states (`?state=loading|live|delayed|unavailable|closed|error`),
other days (`?day=sat` and the like), a picked hour (`?hour=<0-25>`), and the four levels (`?level=quiet|steady|busy|packed`).
In Arabic time runs right to left. Each language should read as if the page had been designed in it first.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| D1 | Every group (head, facts line, status line, card header, readout, hour labels, day row, state messages, retry) starts on the edge its language reads from, in every state | probe output and the frame |
| D2 | Time, the bars' order, the hour labels, the drag and the arrow keys follow the reading direction in each language; logos and the clock do not mirror | frames, a keyboard trace |
| D3 | Mixed runs (Western digits, %, ص/م, AM/PM, time ranges, "FITWAY") sit in the right order and never split or reorder | the frame, the DOM's isolation |
| D4 | No text is cut, overlapped or wrapped badly at 320, 360, 390, 768, 1024 and 1440, in either language, in any state | probe output and the frame |
| D5 | Each language's copy reads natively: no calque, no stray English in Arabic or Arabic in English, the glossary's words where it has them | the string and where it shows |
| D6 | The probes are proven before they are trusted (a planted defect each) | the control's output |

## Report

At most 50 lines: the table with PASS, FAIL or NOT RUN and one line of evidence each; then each finding with its
language, width, state, frame path, measurement and the `file:line` to change; the frames and sheets by path; any
rule in this brief that made the review read wrong, named (WORKING_AGREEMENTS "Rules and findings").
