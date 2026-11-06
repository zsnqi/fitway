<!-- brief-format: v1 role: designer -->
# Designer brief: options for Reports' average card (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). This round makes options for the user to choose from. It builds nothing that stays: commit nothing.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `f835e520`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief; read no decision record.
- **Folder:** `design-research/owner-composition-exploration-r04/directions/eclipse/` (below, "the folder").
- **Read first, only these:** in the folder, `reports.html`, the parts of `reports.js` and `reports.css` that draw the top row of cards, `gym.js`, and `DESIGN-SPEC.md` with the spec rows it points to for Reports' top row; then `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop". Use the Impeccable skill as your design skill.

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

## The problem

On Reports, the top row holds «معدّل الموجودين» / "Average inside" (`#fig-avg`), «أعلى ذروة» / "Highest peak", «مرات الدخول» / "Entries" and, apart, "Last 7 days". The user tried the page on a phone and a computer and said the average card is too empty. A data audit measured it: an empty 42 px foot under the number at 1440, while both neighbours fill theirs (the peak with its level badge and time, the entries with "About 733 a day"). On the phone it stands as a bare number beside the peak.

## What to make

Three options for that card, A, B and C, each a real answer to "what should the owner see beside this average". Make them differ in idea, not in styling. Each one:

- Says only what is true from the data the page already has for the chosen period (readings, opening minutes, levels as Settings sets them, the one gym in `gym.js`). Nothing is invented, and nothing repeats what the "Last 7 days" card or the neighbours already say.
- Keeps the card's place and size in the row, and leaves the neighbours, the row and the rest of the page as they are. The compositions are accepted; this is one card's contents.
- Reads naturally in Arabic and English, at 1440 x 900 and 390 x 844, and still makes sense for Last 7 days, Last 28 days and a custom range of 3 days.
- Has an honest form in Loading, Error and No readings: absent or stale data never looks live.
- Carries no light behind it, like the rest of the row.

Render with `pnpm verify:owner frames` and `pnpm verify:owner sheet`, as the skill names. Put each option behind a URL switch, `?avg=a`, `?avg=b`, `?avg=c`, with no switch showing today's card. These edits stay uncommitted: they exist only to render the options.

## Frames and sheet

For each option and for today's card, render with `pnpm verify:owner frames`: Arabic and English, desktop and phone, Last 28 days; plus Arabic phone and desktop for Last 7 days and the 15-17 Sep custom range; plus Arabic desktop No readings or Error. Make one sheet with `pnpm verify:owner sheet`, Arabic first, each row labelled "Today's card", "A", "B", "C", with a one-line caption per option saying in plain words what it adds. Make a second, small sheet for the user: Arabic only, phone and desktop, Last 28 days, today's card beside A, B and C. Look at both sheets yourself before reporting.

## When you finish

Save a patch of your edits as `options.patch` in your run folder, `D:/fitway-temp/owner-r04-avg-card/`, then restore every file you changed so `git status --short` is empty and HEAD is still `f835e520`. Report in short: each option in two lines (what it shows, why an owner would want it), which one you would pick and why in one line, the two sheets' paths, any data you needed and could not get truthfully, and what you could not check.
