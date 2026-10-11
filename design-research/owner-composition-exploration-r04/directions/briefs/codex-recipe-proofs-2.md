<!-- brief-format: v1 role: codex -->
# Codex brief: a proof for every state a page takes from its address (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `e097d82c`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 44 and 45, and "How this milestone's rounds run"
  items 3, 4 and 9. The build branch's copy of DECISIONS.md is behind; read them from the coordinator branch with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`, the CLI's guide.
    Skip its two `$env:TEMP` / `$env:TMP` lines: the environment block below governs temp folders.
  - `design-research/owner-composition-exploration-r04/directions/briefs/codex-recipe-proofs.md`, the previous round,
    whose result is the HEAD above.

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

- **Your temp folder** is `D:/fitway-temp/owner-r04-recipe-proofs-2/`. You run in the workspace-write sandbox with
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
  "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

## Goal

Every value of every switch a page takes from its address can be observed, so a compare of the five pages at each of
their states sees each state instead of reporting a capture problem. The next round moves Daily's styles, including
rules that draw these states, out of the stylesheet every page loads, and must prove each page unchanged in each state.

## Causes and required outcomes

- **Cause 1.** The CLI's `list --page all` at the base names about 60 switch values with no state proof: among them
  Reports' data states, Access's header status and refusals, Activity's empty and filtered views, Daily's `arrive`,
  `preset` and `tuner`, and `motion=off` on every page. The previous round covered only the states its features use.
- **Cause 2.** On a phone, Access has no records card by design (`access.html:169`, `access.css:45-48`), but the
  `records-retry` recipe has no width limit, so it fails at phone instead of reporting the designed absence.
- **Q1. Every page state is observable.**
  - **Outcome.** A self-compare (`compare` with the folder as build and your base extraction as baseline) over
    `--page all --feature page --states all`, Arabic and English, desktop and phone, mouse, reduced and full motion,
    HTTP, reports no capture problem. `NOT-REACHABLE` appears only where a recipe marks a value absent with a reason
    its source line shows.
  - **Intent.** The next round's compare can tell when any page state changed.
- **Q2. Each proof reads the page.**
  - **Outcome.** Each new state proof checks something the page draws or holds: an element, an attribute, text, or
    the page's own verification object. It fails on the page at another value of the same switch, unless its value is
    the page's default, shown once per proof in Arabic at desktop. A proof that reads the address the CLI typed
    (`location`) is allowed only for a scenario that shows nothing until a feature's action, and only when every
    feature using that scenario proves its visible result; its `shows` text says which feature proves it. The ten
    such proofs at the base are checked against this rule too.
  - **Intent.** A proof that checks its own input proves nothing about the page.
- **Q3. The records card on a phone.**
  - **Outcome.** `records-retry` reports `NOT-REACHABLE` at phone with the designed absence as its reason, and still
    drives to `FRAME PASS` at desktop and tablet, Arabic and English.
  - **Intent.** The recipe states the design instead of failing on it.

## Limits the result keeps

- **L1. The pages do not change.** The diff touches only `verification-recipes.json`.
- **L2. The previous round holds.** Its 22 feature states drive to `FRAME PASS` in Arabic at desktop, mouse, reduced
  motion, HTTP, and `tuner-control-nowHot` too.
- **L3. The checks pass.** The CLI's `drift` and `doctor` pass on the folder's recipes. In the folder,
  `node tools/check-index.mjs` and `node tools/build-index.mjs --check` pass.
- **L4. The file stays well formed.** Valid JSON, UTF-8 without a BOM, with its existing line endings.

## Scope

You may change `design-research/owner-composition-exploration-r04/directions/eclipse/verification-recipes.json`
(must change). Scratch files stay in your temp folder. Commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Report

For each outcome and limit, PASS or FAIL, with the command and the output line that proves it. Then:
- the switch values marked `NOT-REACHABLE`, each with its reason;
- the proofs that read the address, each with the feature that proves its scenario;
- any value whose proof you could not make, and why;
- the commit SHA;
- anything you could not do.

At most 30 lines.
