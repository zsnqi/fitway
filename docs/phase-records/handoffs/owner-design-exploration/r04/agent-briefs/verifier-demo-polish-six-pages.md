<!-- brief-format: v1 role: verifier -->
# Verifier brief: the demo's polish round across the six pages (owner-design-exploration-r04)

For a fresh `owner-direction-verifier` (Opus, high). You find; you fix nothing; you read no report of the work you check.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `bac01253`
- **Milestone:** `owner-design-exploration-r04`. Decisions: carried by this brief and the three briefs below; read no decision record.
- **The work:** `git diff 33677c89..f835e520` (one gym, saved changes, words and dead ends). The commits after it changed only Reports' top row, which two checks have covered and the user has accepted; check it only for regressions.
- **Read first, only these:** `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/demo-polish-target.md` §"Target" and §"The work"; the three briefs that asked for the work, in `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/agent-briefs/`: `builder-demo-one-gym.md`, `builder-demo-saved-changes.md`, `fixer-demo-words-dead-ends.md` (what was asked, not what was done); that diff; then `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md` §"CLI working loop".

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

- Run `pnpm verify:owner` from `D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, with `--concept` set to the folder's absolute path and port 3186; that checkout is otherwise read only. Write evidence only in `D:/fitway-temp/owner-r04-polish-verify/`.
- This repository is public. Never read a sketch folder's state file.
- The six pages are `index`, `reports`, `activity`, `access`, `settings` and `public` in `design-research/owner-composition-exploration-r04/directions/eclipse/`.

## The question

Someone who runs a gym goes through the six pages. Does anything make them stop believing it: two gyms, a number that disagrees with another page, a link or control that leads nowhere, Arabic that reads wrong, a saved change that is lost or lies, stale data that looks live? The compositions were accepted by the user; judge the data, words, states and behaviour, not the design.

## What to check

- **V1, one gym.** The frozen table in `builder-demo-one-gym.md` §"The one gym (frozen)" holds on every page: capacity, limits (a count at a limit takes the lower level), hours past and present, the moment Wednesday 23 September 2026 7:42 PM with 70 inside. Build a same-moment table across the six pages and the minute export, and the brief's O1 and O5 measures from the page's own data. Name every place two pages disagree.
- **V2, saved changes.** Each of `builder-demo-saved-changes.md` O1-O6, driven in fresh contexts, both languages, at 390x844 and 1440x900: a change survives a reload and a move between pages; it appears in Activity at the demo's clock with "View in Activity log" landing on it; capacity 150 and new limits move levels and percentages on Today, Reports and public while counts stay; an hours change stays in Settings and Activity only; `?demo=reset` returns everything. With storage refused the pages still work. A stored change never makes Delayed, Closed, Unavailable, Error or Loading look live.
- **V3, words and dead ends.** Every row of `fixer-demo-words-dead-ends.md`, as rendered: the W table, Arabic hour ranges starting on the right (measured x), titles and meta, the hidden links (not shown, not focusable by Tab or the phone menu's arrows, no orphan separator), «خارج الفترة» and the hatch rule, sample emails, public at 100%. Then read every Arabic string on the six pages as an Arabic reader and list what reads wrong, stiff or ambiguous, with a frame.
- **V4, nothing is out of its box.** All six pages at 320x568, 390x844, 768x1024, 1440x900 and 1920x1080, ar and en, default state: clipped, overlapping or overflowing text or figures, chart scales below their values. Compare against `33677c89` with `pnpm verify:owner compare` at 390x844 and 1440x900, ar and en, and name every difference that is not the work above.
- **V5, states.** Each page's states as its `?case=` fixtures give them: absent, stale or loading data never looks live, in both languages.
- **V6, the fast checks.** `pnpm verify:owner belonging-check` on the five Owner pages; no page errors or failed requests in any run.

## Report

Final message, at most 40 lines: each V with its measure and frame paths; findings ranked High, Medium, Low, each with file and line or a frame, High and Medium only where a run of yours shows them, the rest listed apart as unproven; what you could not check. Make one sheet with `pnpm verify:owner sheet` of the frames that carry your findings, Arabic first, and give its path.
