<!-- brief-format: v1 role: codex -->
# Codex brief: accessibility overrides are not workarounds (agent-environment-r03, round 31)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r31`, branch `agent-environment-r03-r31`, HEAD `e0b199df`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 20, 24.
- **Read first, only these:**
  - `.agents/skills/gardener/code-health.mjs`, `.agents/skills/gardener/code-health-source.mjs` and their tests;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` row F120.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- The concept is read only through git objects of the local branch `owner-followup-r04-build`, as the code-health
  module already does.

## Goal

The gardener's count of repeated workarounds holds only workarounds, so its trend points at real debt.

## Causes and required outcomes

- **A1. Accessibility overrides count as workarounds (F120).**
  - **Cause.** The code-health measure counts every `!important` in CSS. In the concept's `style.css`, most of its 60
    hits (about 43 by a line scan) sit inside `@media (forced-colors: active)` or `@media (prefers-reduced-motion: reduce)` blocks, where
    `!important` is how an override beats component styles on purpose.
  - **Outcome.** An `!important` inside a media block whose condition is `forced-colors: active`,
    `prefers-reduced-motion: reduce` or `prefers-contrast: more` (alone or combined with other conditions with
    `and`, at any nesting depth) is reported as an accessibility override, counted on its own and not in the
    workaround total; every other `!important` is still a workaround. The report says how many were set aside and
    where.
  - **Intent.** The workaround total falls only when real workarounds go.
- **A2. Proof.**
  - **Outcome.** Tests run by the fast ladder, failing on `8e547456` and passing after, cover each of the three
    conditions, a combined condition, a nested block, a `not` query (which stays a workaround), and a top-level
    `!important`. Report the concept's workaround total and override count before and after.
    `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** The rule is shown to fail when its defect is planted.

## Scope

You may change `.agents/skills/gardener/code-health*.mjs` and `.agents/skills/gardener/code-health*.test.ts`; commit
once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around
it: finish and measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then the concept's totals
before and after, the files you changed, the commit SHA, and anything you could not do. At most 20 lines.
