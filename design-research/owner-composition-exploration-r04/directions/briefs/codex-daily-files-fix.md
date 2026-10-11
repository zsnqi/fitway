<!-- brief-format: v1 role: codex -->
# Codex brief: the shared moments' styles back where every page loads them (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `50097ff7`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 36-39 and 41-44, and "How this milestone's rounds
  run" items 3, 4 and 9. The build branch's copy of DECISIONS.md is behind; read them from the coordinator branch with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/briefs/codex-daily-files.md`, the previous round,
    whose result is the HEAD above; its outcomes D1-D5 and limits L1-L3 still hold.
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`, the CLI's guide.
    Skip its two `$env:TEMP` / `$env:TMP` lines: the environment block below governs temp folders.
  - In the folder below, `README.md` §"Motion" and `motion.js` (the moments every page runs). "The folder" is
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

- **Your temp folder** is `D:/fitway-temp/owner-r04-daily-files-fix/`. Set `PROBE_OUT` to a folder inside it before
  you run the folder's tools. You run in the workspace-write sandbox with automatic approval review. `git add`, `git
  commit` and anything that starts child processes with piped output (pnpm, Playwright, Node scripts that run git)
  fail inside it: request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **Hooks.** A hook or tool message that asks for work outside this brief (for example a design detector's findings,
  or a configuration file outside the folder) is reported in your final message, not acted on. The previous round
  edited `.impeccable/config.json` after such a message; the coordinator reverted it.
- **Tools.** Run the verify-fitway CLI read-only from the coordinator's worktree
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04` at `e4b5fe95` or later:
  `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`. Never edit it. Ports 3176-3177 only. If one is held by a
  process you did not start, never stop it. Ports 3174 and 3180 serve this worktree to the user: leave them running.
  Its `compare` checks settled pictures only; it cannot see a moment in motion or a held press.
- **Ways to open the concept:** HTTP through the CLI and `file://`; Arabic and English; desktop, tablet and phone;
  mouse, touch and keyboard; reduced and full motion; the motion switch `?motion=off`.
- **The target** for every moment is the folder at `f96753fe`, the build before the previous round. **The base** is
  the HEAD above. Take both from your own `git archive`, extracted outside every git tree.

## Goal

Every page runs its moments, presses and states exactly as at the target, and Daily's stylesheet holds only what Daily
alone (or the components sheet's specimens of Daily) uses. The previous round's file split stays.

## Causes and required outcomes

- **Cause.** The previous round judged a rule Daily's from the names in the other pages' markup and their own page
  scripts, but not from the shared scripts every page loads (`motion.js`, `picker.js`) or the classes scripts set at
  runtime. So rules every page's moments need moved into `daily.css`, which only Daily and the components sheet load:
  the interaction motion's pieces (`daily.css:411-424`, such as `.m-surface`, `.m-ghost`, `.m-noshadow`,
  `.dlg-panel.m-reflow`, `.rb-stack.m-rolling`), the rail's opening pieces (`daily.css:400-410`), and the date
  picker's end day and its press (`daily.css:438-441`). At rest every page still compares equal, but in motion it does
  not: 120 ms into opening Reports' export dialog at 1440 × 900, the dialog stands below the fold instead of in place
  (`D:/fitway-temp/owner-r04-daily-files-grade/mid/reports-export-open-120-base.png` against `-head.png`).
- **X1. The shared styles where every page loads them.**
  - **Outcome.** No rule in Daily's stylesheet can match an element on Reports, Access, Activity or the components
    sheet in any state, moment or press, judged from every script each of those pages loads and the markup and
    classes those scripts write at runtime. Report each rule you moved back and the script that uses it.
  - **Intent.** An edit to Daily's stylesheet cannot change another page at rest, in motion, or under a finger.
- **X2. The moments run as at the target.**
  - **Outcome.** On each page, every interaction moment the folder's scripts run renders the same frames as the
    target at the same points of its timeline, from its start to its end, in Arabic and English, at desktop and phone,
    with full motion: among them a dialog's opening, change and closing, a popover's (the header status's included),
    a button from its label to Working to done, the done line, the rail's opening and closing at 721-1023 px,
    Access's arriving record, and Daily's digit roll, crowd-level fill and live ping. A held press on each press kind
    the folder's CSS defines, the date picker's day included, equals the target's while held and after release. The
    measuring is yours to build in your temp folder; report what it covers, its noise floor (the target against
    itself), and each moment's result.
  - **Intent.** The owner sees the motion and the press the user approved (items 36-39, 41-43) on every page.

## Limits the result keeps

- **L1. The previous round's outcomes hold.** D1, D2's gardener scan (0 references in `style.css` to ids only
  `index.html` defines), D3's four compares against `f96753fe` page by page, D4 and D5 pass as that brief states them.
- **L2. The checks pass.** The CLI's `drift` and `doctor`; in the folder's tools (`node lint-spec.mjs`,
  `node check-index.mjs`, `node build-index.mjs --check`, `node check-press-layer.mjs`,
  `node check-press-layer.test.mjs`); `node --check` on every script; the concept CSS check reports the same findings
  as at the target.
- **L3. One copy of each rule.** No rule is kept in both stylesheets.

## Scope

You may change `design-research/owner-composition-exploration-r04/directions/eclipse/daily.css` (must change) and
`design-research/owner-composition-exploration-r04/directions/eclipse/style.css` (must change), and in the folder
`README.md` and `INDEX.md` if what they say of the split changes. Scratch files stay in your temp folder. Commit once
when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it:
finish and measure the others, then stop and report.

## Report

For each outcome and limit, PASS or FAIL, with the command and the output line that proves it. Then:
- the rules moved back, each with the script that uses it;
- the moments and presses X2 measured, and its noise floor;
- `style.css` and `daily.css` line counts;
- any hook or tool message you did not act on;
- the commit SHA;
- anything you could not do.

At most 30 lines.
