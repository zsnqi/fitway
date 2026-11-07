<!-- brief-format: v1 role: codex -->
# Codex brief: Daily's script and styles in files of their own (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `f96753fe`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 4, 6, 41, 42 and 44, and "How this milestone's rounds
  run" items 3, 4 and 9. The build branch's copy of DECISIONS.md is behind; read them from the coordinator branch with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`, the CLI's guide.
    Skip its two `$env:TEMP` / `$env:TMP` lines: the environment block below governs temp folders.
  - In the folder below: `index.html` (how the page loads its files), `README.md` §"Motion", and the heads of
    `reports.js` and `reports.css` (how a page with its own files is laid out). "The folder" is
    `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- **Your temp folder** is `D:/fitway-temp/owner-r04-daily-files/`. Set `PROBE_OUT` to a folder inside it before you
  run the folder's tools. You run in the workspace-write sandbox with automatic approval review. `git add`, `git
  commit` and anything that starts child processes with piped output (pnpm, Playwright, Node scripts that run git)
  fail inside it: request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **Tools.** Run these read-only from the coordinator's worktree `D:/Projects/fitway-worktrees/owner-design-exploration-r04`
  at `e4b5fe95` or later. Never edit them.
  - The verify-fitway CLI: `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`. Ports 3176-3177 only. If one is
    held by a process you did not start, never stop it. Ports 3174 and 3180 serve this worktree to the user: leave
    them running.
  - The concept CSS check: `node <that worktree>/scripts/check-concept-css.mjs <the folder>`.
  - The gardener's code-health scan: `scanScope` exported by `<that worktree>/.agents/skills/gardener/code-health.mjs`,
    whose `boundaryBreaks` counts a shared file's references to ids that only one page defines.
- **Ways to open the concept:** HTTP through the CLI and `file://`; Arabic and English; desktop, tablet and phone;
  mouse, touch and keyboard; reduced and full motion; the motion switch `?motion=off`.
- **The base** is the folder at the HEAD above. Take it from your own `git archive`, extracted outside every git tree.
  At the base, each D3 scope compared against itself page by page is equal apart from its designed absences and the
  known problems D3 lists (688, 620, 86 and 28 equal items).

## Goal

Daily has a script and a stylesheet of its own, as Reports, Access and Activity do, and the shared stylesheet holds
only what more than one page uses. Every page looks and behaves exactly as at the base.

## Causes and required outcomes

- **Cause 1.** Daily's script is `app.js` (`index.html:33`). Only Daily loads it, but its name reads as the concept's
  shared script, and the gardener counts its 76 references to Daily's elements as a shared file's boundary breaks.
  The other pages' scripts are named for their page.
- **Cause 2.** `style.css`, which all five pages load, holds Daily's styles. It references 17 ids that only
  `index.html` defines, and whole sections style only Daily, for example §"Daily, step 3" (`style.css:661`),
  §"Daily on the phone: the finger" (`:765`), §"Daily's states" (`:1041`) and §"light tuner" (`:1129`). Every page
  parses them, and an edit meant for Daily can reach another page.
- **D1. Daily's own script.**
  - **Outcome.** Daily loads its script from a file named for the page; no `app.js` remains in the folder; no other
    page loads Daily's script; `tuner.js` still drives Daily as at the base.
  - **Intent.** A reader finds Daily's code where its name says, like `reports.js`.
- **D2. Daily's own stylesheet.**
  - **Outcome.** `index.html` loads a stylesheet of Daily's own after the shared one. In the shared stylesheet, every
    rule can match an element on Reports, Access or Activity, judged by the ids and classes its selectors name in
    those pages and their scripts, or uses no page-specific name. Every rule in Daily's stylesheet names something
    that only Daily or the components sheet has. The components sheet may load Daily's stylesheet where one of its
    specimens needs it, as it loads `reports.css` today. The gardener's scan finds 0 references in `style.css` to ids
    only `index.html` defines. Report how you judged each rule, with the script you used.
  - **Intent.** Reports, Access and Activity stop carrying Daily's styles, and an edit to Daily's styles cannot change
    another page. Moving a rule only to make the count fall, while it still styles another page, defeats this.
- **D3. Every page unchanged.**
  - **Outcome.** `compare` of the result against the base, page by page over all five pages, with mouse and HTTP, is
    `COMPARE EQUAL` for every item in each of these, apart from the base's designed absences (`NOT-REACHABLE`) and
    the known capture problems listed below:
    - every page state: `--feature page --states all`, Arabic and English, desktop and phone, reduced and full motion;
    - every feature at its own state: `--feature all`, Arabic and English, desktop and phone, reduced motion;
    - at tablet: `--feature page --states all`, Arabic, reduced motion;
    - over `file://`: Daily and Reports, `--feature page --states all`, Arabic, desktop, reduced motion.
    The known capture problems are `arrive` (`never`, `0`, `500`) on Daily, Reports, Access and Activity, and a lone
    `from` or `to` on Reports and Activity: each acts only with a companion switch the recipes cannot name yet, so it
    is a capture problem on both sides at the base. No other item may be a problem.
  - **Intent.** The move changes where the code lives, nothing a user sees or does. The cascade can change when a rule
    moves to a later file; this is what catches it. One compare over all pages at once ran out of Windows sockets
    after about 500 items in an earlier round (`ERR_NO_BUFFER_SPACE`); page by page it does not.
- **Cause 3 (separate, present at the base; B6 is relaxed for it alone).** `design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/checks.mjs:76-78`
  takes the first `.woff2` in the folder's fonts as Readex Pro. Since Access added its monospace face, that file is
  `jetbrains-mono-400.woff2`, so the kit stops with a TypeError at line 78 and its later checks, the script hold
  among them, never run.
- **D4. Daily's first paint unchanged.** In the folder's probe kit (`design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/README.md`),
  `node smoke.mjs` and `node overflow-checks.mjs` pass as at the base, and `node checks.mjs` runs to its end and
  passes, its script hold naming Daily's script by its new name. Intent: the intro, the font wait cap and the render-blocking
  load (items 4 and 6) are checked, and behave as before.
- **D5. No pointer to a gone file.** In the folder, `git grep -n "app\.js"` lists only `HISTORY.md`, the evidence folder, and
  the provenance line that cites the light-study direction's script. `verification-recipes.json`, `INDEX.md`, `README.md`,
  `DESIGN-SPEC.md`, the index builder, the probe kit and the comments in the other scripts name the new files.
  Intent: the next builder follows the records to the code.

## Limits the result keeps

- **L1. The checks pass.** The CLI's `drift` and `doctor` pass on the folder's recipes. In the folder's tools
  (`design-research/owner-composition-exploration-r04/directions/eclipse/tools/`), `node lint-spec.mjs`, `node check-index.mjs`, `node build-index.mjs --check`,
  `node check-press-layer.mjs` and `node check-press-layer.test.mjs` pass, and `node --check` passes on
  every script. The concept CSS check reports the same findings as at the base.
- **L2. One copy of each rule.** No rule or declaration block is kept in both stylesheets; the shared stylesheet's line
  count falls by at least the lines Daily's stylesheet holds, less its header comment.
- **L3. History is kept.** Git records Daily's script as a rename of `app.js` (`git log --follow` reaches its history).
  `HISTORY.md` and the evidence folder are unchanged.

## Scope

You may change `design-research/owner-composition-exploration-r04/directions/eclipse/app.js` renamed to Daily's script (must change), `design-research/owner-composition-exploration-r04/directions/eclipse/style.css`
(must change), `design-research/owner-composition-exploration-r04/directions/eclipse/index.html` (must change), and in the folder: a new stylesheet for Daily,
`components.html` where a specimen needs Daily's stylesheet,
`tuner.js`, `reports.js`, `access.js`, `activity.js` and `components.js` (comments that name `app.js` only),
`verification-recipes.json`, `INDEX.md`, `README.md`, `DESIGN-SPEC.md`, and in its tools `build-index.mjs` and the probe kit.
Scratch files stay in your temp folder. Commit once when done. Everything else is read-only. Add no dependencies. If
an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Report

For each outcome and limit, PASS or FAIL, with the command and the output line that proves it. Then:
- the new files' names and line counts, and the shared stylesheet's line count before and after;
- the rules you kept shared that look like Daily's, and why;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
