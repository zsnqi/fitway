<!-- brief-format: v1 role: verifier -->
# Reading review brief: Arabic without a fault on the Owner pages (owner-design-exploration-r04)

For a fresh `rtl-ltr-reviewer` (Opus, high). An audit before the demo's polish round: you find, you fix nothing, and you read no earlier report.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `33677c89`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".
  - The pages under `design-research/owner-composition-exploration-r04/directions/eclipse/`: `index.html` (Daily), `reports.html`, `activity.html`, `access.html`, `settings.html`, and their scripts as you need them.
  - The `ux-araby` skill, for the copy.

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the page's absolute folder and port 3186; that checkout is otherwise read only. Write only in `D:/fitway-temp/owner-r04-demo-audit-arabic/`.

## Why

The demo shows these pages to an Arabic-reading gym owner. One wrong word or a range that reads backwards costs more than a pixel. The composition is accepted; report what reads wrong, not what you would design otherwise.

## What to check

Default state of each page, plus its dialogs, menus, tooltips and picked states, at `1440x900`, `390x844` and `320x568`.

- **R1, the words.** Read every Arabic string on screen and in the scripts' copy: grammar, number agreement with the counted noun, gender, calques from English, stiff or odd phrasing, one word for one thing across the pages, punctuation.
- **R2, hours and ranges.** Every hour, time, date and numeric range as an Arabic reader meets it: does a range start on the right, does an en-dash range hold its order when rendered, do «م» and «ص» sit with their digits, do charts' hour axes run the way the page's other hours run. Measure from the rendered text, not the source.
- **R3, Arabic against English.** Where the English page says something the Arabic does not, or the two disagree on a figure or a unit.
- **R4, what is cut or wraps badly.** Arabic text cut, overlapping, or broken at a bad point (a number apart from its noun, a lone word on a line), with its frame.

## Report

Final message, at most 60 lines: each finding as a hypothesis with page, size, the Arabic text as rendered, your proposed wording where it is a word problem, the frame's absolute path and `file:line`, marked **stops the demo**, **worth fixing** or **leave**; what you could not check. Never edit a page. Facts only, no praise.
