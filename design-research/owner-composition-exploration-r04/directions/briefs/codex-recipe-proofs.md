<!-- brief-format: v1 role: codex -->
# Codex brief: observable proofs for the states a compare cannot see yet (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `d1a01f3c`
- **Milestone:** `owner-design-exploration-r04`. Decisions: item 44, and "How this milestone's rounds run" items 3, 4
  and 9. The build branch's copy of DECISIONS.md is behind; read them from the coordinator branch with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`, the CLI's guide.
    Skip its two `$env:TEMP` / `$env:TMP` lines: the environment block below governs temp folders.
  - Rows F123, F124 and F125 of agent-environment's findings table, read from the coordinator branch with `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/agent-environment/findings.tsv`.
  - In the folder below, `verification-recipes.json`: how the states that already pass are proved (for example
    Daily's `page-retry` with `state=error`). "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- **Your temp folder** is `D:/fitway-temp/owner-r04-recipe-proofs/`. You run in the workspace-write sandbox with
  automatic approval review. `git add`, `git commit` and anything that starts child processes with piped output
  (pnpm, Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt,
  with a one-line justification. (DECISIONS item 7)
- **Tools.** Run the verify-fitway CLI read-only from the coordinator's worktree
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04` at `e4b5fe95` or later:
  `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`. Never edit it. Ports 3176-3177 only. If one is held by a
  process you did not start, never stop it. Ports 3174 and 3180 serve this worktree to the user: leave them running.
- **Ways to open the concept:** HTTP through the CLI and `file://`; Arabic and English; desktop, tablet and phone;
  mouse, touch and keyboard; reduced and full motion. The checks below cover HTTP and name their other axes.
- **The base** is the folder at the HEAD above. Take it from your own `git archive`, extracted outside every git tree.

## Goal

Every state the folder's recipes name can be observed, so a compare of two builds sees each state instead of reporting
a capture problem. The next round moves Daily's script and styles into their own files (item 44) and must prove every
page unchanged; it can only prove that for states the compare can see.

## Causes and required outcomes

- **Cause A (F123, F124).** 22 feature states in `verification-recipes.json` have no observable state proof, so
  `drive` and `compare` report "No observable state proof for …" on both sides. The list is every item whose
  `result` is `problem` in `D:/fitway-temp/r03-r30-grade/r2-broad-self-full/comparison.json`, except Daily's
  `tuner-control-nowHot` (cause B): ten on Access, seven on Activity, five on Reports.
- **Cause B (F125).** `index.html` feature `tuner-control-nowHot` fails on both sides with "CSS property unchanged:
  --now-hot" (same file). The suspect: the recipe's actions (`verification-recipes.json:2311-2316`, Home then ArrowUp)
  may land on the value the page starts with (`style.css:50`), given the control's range and step (`tuner.js:67`).
  Either the recipe or the tuner is wrong; find which.
- **P1. The 22 states are observable.**
  - **Outcome.** Each of the 22 feature/state pairs drives to `FRAME PASS` in Arabic and English, at desktop and phone,
    with mouse, reduced motion, HTTP. A self-compare (`compare` with the folder as build and your base extraction as
    baseline) over `--page all --feature all --states all`, Arabic and English, desktop and phone, mouse, reduced and
    full motion, HTTP, reports no capture problem. `NOT-REACHABLE` stays only for an item the recipe at the base
    already marks absent, and none of the 22 becomes `NOT-REACHABLE`.
  - **Intent.** The next round's compare can tell when one of these states changed. Compare adds no tolerance and
    repeats a differing item in fresh contexts itself; a state that cannot be captured the same way twice is a
    finding to report, not something to hide.
- **P2. Each proof tells its state apart.**
  - **Outcome.** For each of the 22, the state's proof fails on the same feature at its default state, shown once per
    pair in Arabic at desktop (a scratch copy of the recipe file in your temp folder is one way).
  - **Intent.** A proof that also passes on the page without the state proves nothing.
- **P3. The lit-corner glow's control.**
  - **Outcome.** `tuner-control-nowHot` drives to `FRAME PASS` in Arabic and English at desktop, with mouse and
    keyboard. The report names which was wrong, the recipe or the tuner, with the line that shows it.
  - **Intent.** The control's proof checks what the control does, as its 17 sibling controls' proofs do.

## Limits the result keeps

- **L1. The pages do not change.** The diff touches only `verification-recipes.json`, unless P3 shows the tuner is
  wrong. In that case `tuner.js` changes too, and a compare of `index.html` against the base (`--feature page`,
  `--states all`, Arabic and English, desktop and phone, mouse, reduced and full motion, HTTP) is EQUAL for every item.
- **L2. The checks pass.** The CLI's `drift` and `doctor` pass on the folder's recipes. In the folder,
  `node tools/check-index.mjs` and `node tools/build-index.mjs --check` pass.
- **L3. The files stay well formed.** The recipe file is valid JSON, UTF-8 without a BOM, with its existing line
  endings. If `tuner.js` changes, `INDEX.md` is regenerated with the command at its top.

## Scope

You may change `design-research/owner-composition-exploration-r04/directions/eclipse/verification-recipes.json`
(must change), and in the folder `tuner.js` and `INDEX.md` only if P3 shows the tuner is wrong. Scratch files stay in your temp folder. Commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Report

For each outcome and limit, PASS or FAIL, with the command and the output line that proves it. Then:
- for P3, the cause in a sentence;
- any state whose proof you could not make observable, and why;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
