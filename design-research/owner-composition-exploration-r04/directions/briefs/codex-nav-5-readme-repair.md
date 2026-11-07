<!-- brief-format: v1 role: codex -->
# Codex brief: README contract repairs (owner-design-exploration-r04, round nav-5)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `1a4b497`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 2 and 4.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/eclipse/README.md` lines 1-8
  (what the contract and HISTORY.md are for); `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-1-readme-split.md`
  (the split this round repairs; its rules still hold).

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

README.md reads as a contract for the current build: its rule titles name rules, not rounds; the intro's length is
stated once; its lists render as lists; and DESIGN-SPEC's pointers land on the rule they name.

## Causes and required outcomes

- **E1.** Rule titles still carry round labels, steps, run IDs and dates from the history (for example README lines
  23, 303, 339, 399, 483 and 641). Outcome: no rule title in README.md carries one; where a label also carried a
  decision, the rule's text keeps a pointer to where that decision is recorded; HISTORY.md still holds the history
  each label pointed to, findable by the rule's subject; no rule's meaning changes.
- **E2.** The first-open intro's total length is never stated in one sentence. Outcome: one sentence in its section
  states the total length and the font-wait cap as the code builds them (read the values from the code, not from
  other documents), and no other sentence contradicts it.
- **E3.** Blank lines inside bullet lists (README lines 64 and 356, and any others) split one list into two when the
  Markdown renders. Outcome: no list in README.md is split by a blank line, and nothing else in the rendering
  changes.
- **E4.** DESIGN-SPEC row PAT-1 points to the section "What it answers", but the rule it cites is in "The table,
  form and dialog system". Outcome: every section pointer in DESIGN-SPEC.md names a section that exists and holds
  what the row cites; report each pointer you changed.

Only Markdown changes; the pages render as they do now.

## Scope

You may change `design-research/owner-composition-exploration-r04/directions/eclipse/README.md`, `HISTORY.md` and
`DESIGN-SPEC.md` in that folder; commit once when done. Everything else is read-only. If an outcome cannot be met,
do not work around it: finish and measure the others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the evidence (lines before and after); the files you changed; the commit SHA;
anything you could not do.
