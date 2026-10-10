<!-- brief-format: v1 role: codex -->
# Codex brief: the concept CSS check sees focus rings as they render (agent-environment-r03, round 29)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r29`, branch `agent-environment-r03-r29`, HEAD `8275d1c7`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 20, 21.
- **Read first, only these:**
  - `scripts/check-concept-css.mjs` and `scripts/check-concept-css.test.ts`;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F041, F042, F043, F044, F113.

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
- The live Owner concept is `design-research/owner-composition-exploration-r04/directions/eclipse` on the local
  branch `owner-followup-r04-build` (at `d1a01f3c` today). Read it only through git objects (`git archive` into your
  run folder), never from that branch's worktree, and run the check on that archive.

## Goal

`check:concept-css` flags a control that loses its visible focus ring, and only such a control, so a fix made to
satisfy it never trades a real ring for a worse one.

## Causes and required outcomes

- **R1. Some outline removals are missed (F041).**
  - **Cause.** `scripts/check-concept-css.mjs:378-380` sees an outline removal only as the property `outline` with the
    value `none` or `0`.
  - **Outcome.** Every declaration that leaves no visible outline counts as a removal: the `outline` shorthand with a
    `none` or `hidden` style or a zero width in any order (`outline: 0 none`, `outline: none 0`), `outline-style: none`
    or `hidden`, and `outline-width: 0` in any unit.
  - **Intent.** A ring cannot be removed by a spelling the check does not read.
- **R2. A negated hover query counts as a gate (F042).**
  - **Cause.** The hover gate at `scripts/check-concept-css.mjs:354` ignores `not`, so `@media not all and (hover:
    hover)` counts as gated.
  - **Outcome.** A hover style counts as gated only inside a media query that matches only devices that hover; a
    negated query, `(hover: none)`, and `(any-hover: none)` are not gates.
  - **Intent.** A touch screen never gets a hover style the check believes is gated away from it.
- **R3. A declared moved ring and a missing ring read the same (F043).**
  - **Cause.** `scripts/check-concept-css.mjs:442-443` gives the same text whether no ring is declared or a declared
    `focus-ring:` selector draws none.
  - **Outcome.** The finding says which: no ring at all, or the declared ring selector, named, that draws no ring.
  - **Intent.** The fixer knows whether to add a ring or repair the declared one.
- **R4. A decorative border or shadow counts as a ring (F044).**
  - **Cause.** `hasRing` (`scripts/check-concept-css.mjs:204-300`) counts any visible border or shadow, so
    `.fw-pop{outline:none;border:1px solid #ccc;box-shadow:0 2px 8px #0003}` passes.
  - **Outcome.** A ring counts only when it is drawn in a focus state of the control (`:focus-visible`, `:focus`, or a
    declared `focus-ring:` selector); a border or shadow present whether or not the control has focus is not a ring.
  - **Intent.** "Has a ring" means focus visibly changes the control.
- **R5. Rings drawn by an ancestor, and programmatic focus targets, are flagged (F113).**
  - **Cause.** `focusBase` (`scripts/check-concept-css.mjs:182-198`) never relates `:has(... :focus-visible)` on an
    ancestor to the control inside it, and a selector for `[tabindex="-1"]` is treated like a keyboard control. The
    Owner CSS round therefore made those outlines unconditionally transparent, which forced colours paint as a
    permanent line.
  - **Outcome.** A ring drawn on an ancestor by a rule whose `:has()` names the control in its `:focus-visible` (or
    `:focus`) state counts as that control's ring. A rule whose subject is restricted to `[tabindex="-1"]` (focus only
    by script, not in the tab order) is not flagged for removing its outline.
  - **Intent.** The check accepts the two patterns that are correct, so nobody works around it.
- **R6. Proof.**
  - **Outcome.** Each of R1-R5 has a planted fixture test run by the fast ladder that fails on `bb637f1f` and passes
    after, and each earlier fixture keeps its result. On the concept archive at `d1a01f3c` the check runs to the end;
    report its finding count before and after your change, with each finding that appears or disappears and why.
    `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** Each rule is shown to fail when its defect is planted, and its effect on the real concept is known.

## Scope

You may change `scripts/check-concept-css.mjs` and `scripts/check-concept-css.test.ts`, and add fixtures beside them;
commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the concept's finding count before and after, with the changed findings;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
