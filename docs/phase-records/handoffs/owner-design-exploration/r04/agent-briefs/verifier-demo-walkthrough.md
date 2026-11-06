<!-- brief-format: v1 role: verifier -->
# Verifier brief: a first-time owner walks the six pages (owner-design-exploration-r04)

For a fresh `owner-direction-verifier` (Opus, high). You find; you fix nothing; you read no report of earlier checks.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `695600d4`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:** `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop", then the six pages as a browser shows them. Read code only to locate something you already saw go wrong.

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

- Run `pnpm verify:owner` (`run`, `frames`, `sheet`) from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the folder's absolute path and port 3186; that checkout is otherwise read only. Write evidence only in `D:/fitway-temp/owner-r04-walkthrough/`.
- This repository is public. Never read a sketch folder's state file.
- The six pages are `index`, `reports`, `activity`, `access`, `settings` and `public` in `design-research/owner-composition-exploration-r04/directions/eclipse/`. Start at `index.html` with no query, as the demo's audience would.

## The question

You run a gym and open this product for the first time, with no one beside you. Use it the way such a person would, out of curiosity and to get things done: find out how busy the gym is now and was, look for the quiet hours, change the capacity, give a staff member access and take it away, export the readings, switch the language, open the visitors' page. Where does it stop making sense, break, lead nowhere, contradict itself, or read wrong? The compositions are accepted; judge what happens when you use them, not the design.

## How

- **Free first.** Walk as that owner in Arabic, then in English, at 390x844, 820x1180 (a tablet held upright) and 1440x900, reaching pages only by the product's own links and controls. Keep a short log of what you tried, in order, with a frame wherever something surprised you.
- **Then everything.** On each page, in each language, at 390x844 and 1440x900, take every element the accessibility tree marks as interactive (links, buttons, tabs, toggles, menu items, fields, the chart's hours and cells) and use it once by pointer and, where it is a control, once by keyboard. Each must do something visible, lead somewhere that exists, or be plainly disabled. Count them per page and report the counts. Open every menu, dialog and sheet, and close each by its own button, Escape and a click outside.
- After saving changes, use `?demo=reset` to return; check that it returns everything.
- Watch the console and network in every run: any page error or failed request is a finding.

## Known and left as they are

Do not report these: the visitors' page draws a usual for hours with under 3 days of history; the phone's "…" menu holds one item; the visitors' page says «زحمة»; the demo's clock stands still at Wednesday 23 September 2026, 7:42 PM.

## Report

Final message, at most 40 lines: the walk log in short (what you tried, what happened); the counts of interactive elements used per page and how many did nothing or led nowhere; findings ranked by whether someone watching the demo would notice — **Would notice**, **Might notice**, **Would not notice** — each with a frame path and, where you found it, a file and line; what you could not check. Make one sheet with `pnpm verify:owner sheet` of the frames that carry your findings, Arabic first, and give its path.
