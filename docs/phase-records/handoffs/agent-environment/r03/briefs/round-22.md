<!-- brief-format: v1 role: codex -->
# Codex brief: a held press reads what the owner sees (agent-environment-r03, round 22)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r22`, branch `agent-environment-r03-r22`, HEAD `eddee7b8`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 15, 20, 21.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` §"Launch and drive", and the scripts beside it;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` row F115;
  - `D:/fitway-temp/r03-r22-forensics/ui-forensics/references/browser-tools.md` (its action table) and the 1.3.0 entry of
    `D:/fitway-temp/r03-r22-forensics/ui-forensics/CHANGELOG.md`.

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
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- If 3176 or 3177 is held by a process you did not start, never stop it; to prove an outcome on those ports, hold
  them with a process you start and stop it when done.
- A copy of the machine-level ui-forensics 1.3.0 is at `D:/fitway-temp/r03-r22-forensics/ui-forensics/`; you may
  change that copy. The machine-level skill under the user's profile is read-only. The CLI reaches a copy through
  `--forensics`. The copy's browser self-test is `node <copy>/tests/web/selftest.mjs`, run with the worktree as the
  working directory; its image self-test is `python <copy>/tests/img/selftest.py`.
- The concept is `design-research/owner-composition-exploration-r04/directions/eclipse` of the branch
  `owner-followup-r04-build`, at two commits: `691d62d5`, which has hover styles and no pressed state, and `d1a01f3c`,
  which has the pressed state. Read each from your own `git archive` into your run folder, never from that branch's
  worktree; each holds its `verification-recipes.json`.

## Goal

A held press is classified by what the owner sees while pressing, and only by that. A hover is never read as a
press, and a press drawn anywhere inside the control is never read as missing.

## Causes and required outcomes

- **P1. A hover counts as a press.**
  - **Cause.** The copy's `hold` (`D:/fitway-temp/r03-r22-forensics/ui-forensics/scripts/web/_common.mjs:425-444`)
    reads the control's style before the mouse moves onto it, then compares the held style with that. The CSS
    round's review held 34 controls at `691d62d5`, which has no pressed state, and most were classified `pressed style
    shown while held` (F115).
  - **Outcome.** With a mouse, the classification compares the held control with the same control hovered and
    settled, however long its hover transition runs. At `691d62d5`, a mouse hold on each of Daily's rail items,
    Reports' range segments and export button, and a day of the export dialog's date picker is classified `no
    pressed style` (recipes for these holds may live in your run folder and reach the CLI through `--recipes`).
  - **Intent.** `pressed style shown while held` means the press itself shows; a hover style, a hover transition
    still running, or the pointer's arrival never produces it.
- **P2. A press drawn inside the control is missed.**
  - **Cause.** `heldPressInfo` (`_common.mjs:367-412`) reads the computed style of the selected element only, and finds
    an `:active` rule only when the rule's whole selector, without `:active`, matches that element. The concept draws
    some presses on an element inside the control (`.dp-day:active .dp-n`, `.rail-item:active .tile`), so the review
    found the picker's day classified `no pressed style` at the pressed commit (F115).
  - **Outcome.** A press counts wherever it is drawn: on the control, on any element inside it, or on a `::before`
    or `::after` of either. With a mouse such a press is classified `pressed style shown while held`; with touch an
    `:active` rule on the control that styles any of those is a pressed style that exists.
  - **Intent.** The classification reads the control as the owner sees it, not one element's style.
- **P3. `release` as SKILL.md writes it is refused.**
  - **Cause.** verify-fitway's SKILL.md tells a recipe to end a hold with a `release` action. The copy splits every
    action at its colon (`_common.mjs:307-312`) and refuses `release` without one (F115).
  - **Outcome.** Every form of the held press and its release that SKILL.md or the copy's action table names works as
    written there, in drive and in every copy tool that takes actions or triggers.
  - **Intent.** A recipe written from the documentation runs.
- **P4. Planted controls.**
  - **Outcome.** Tests in the fast ladder, each failing on `eddee7b8` with the copy as it is now and passing after,
    cover fixture controls with a mouse: one with a hover style and no pressed style; one whose press is drawn on an
    element inside it; one whose press is drawn on a pseudo-element; a disabled control whose `:active` excludes it.
    The copy's self-test gains planted controls for P1 and P2: reading the style before the pointer arrives fails one,
    and reading the selected element alone fails the other. Every earlier control still passes, and the copy's
    version and CHANGELOG move to 1.3.1.
  - **Intent.** Each classification is shown to fail when its defect is planted.
- **P5. Proven.**
  - **Outcome.**
    - `pnpm test:verification` and `node scripts/verify.mjs fast` pass on your committed, clean tree, once with
      3176-3177 free and once held by a process you start.
    - Both of the copy's self-tests pass.
    - With the machine-level 1.3.0, a held press is refused with a message naming the version it needs, and never
      produces a classification.
    - Using the copy, on the concept at `d1a01f3c`, a mouse hold on one of Daily's rail items and on one day of the
      Reports export dialog's date picker, at desktop (Arabic and English, reduced motion, HTTP), is classified
      `pressed style shown while held`; at `691d62d5` the same holds are classified `no pressed style`. The ports are
      free afterwards.
    - Drive runs without a hold write frames byte-identical to the base CLI's.
  - **Intent.** It works on the real concept, and nothing that worked stops working.

## Scope

You may change `.agents/skills/verify-fitway/` and the ui-forensics copy at
`D:/fitway-temp/r03-r22-forensics/ui-forensics/`. Commit the worktree's changes once when done; the copy is not in
git. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the files you changed in the worktree and in the copy;
- the commit SHA;
- anything you could not do.

At most 30 lines.
