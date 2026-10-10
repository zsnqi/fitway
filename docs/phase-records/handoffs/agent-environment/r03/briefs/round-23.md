<!-- brief-format: v1 role: codex -->
# Codex brief: brief:check resolves decision items (agent-environment-r03, round 23)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r23`, branch `agent-environment-r03-r23`, HEAD `eddee7b8`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 6, 17, 21.
- **Read first, only these:**
  - `scripts/agent-environment/check-brief.mjs` and `scripts/agent-environment/check-brief.test.ts`;
  - `docs/agent-context/briefs/codex.md` (the template and its checklist row B10);
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` row F116.

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

## Goal

`pnpm brief:check` fails a brief that cites a decision item its named decisions file does not hold, so Codex never
starts a round on a decision it cannot read.

## Causes and required outcomes

- **D1. Cited decision items are not resolved.**
  - **Cause.** `check-brief.mjs` resolves each backticked path, its `§"heading"` and its line range in the named
    worktree (`scripts/agent-environment/check-brief.mjs:199-305`), but never the decision items cited after a
    decisions file's path. A brief over the build worktree cited item 42 of
    `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, whose copy in that worktree ended at item
    41; the check passed, and Codex stopped at once (F116).
  - **Outcome.** Wherever a brief cites items right after a backticked file path (`` `<path>` item 7 ``, `` items 15,
    20, 21 ``, `` items 12-25 ``, `` items 12-16, 40 ``, and the same with `and`), each cited number must be one of that
    file's numbered top-level entries, read from the file the path resolves to as the existing path check resolves it
    (a repository path in the worktree the brief names, an absolute path as written). A missing item fails under
    the checker id `brief-references`, with the item, the file and the worktree in the message, and the line of the
    brief that cites it.
  - **Intent.** Every decision a brief sends Codex to exists where Codex will read it.
- **D2. Nothing that passes today fails for the wrong reason.**
  - **Outcome.** A citation without a path (the environment block's `DECISIONS item 3`) is not checked and never
    fails. Every brief under `docs/phase-records/handoffs/agent-environment/r03/briefs/`,
    `docs/phase-records/handoffs/agent-environment/briefs/` and
    `design-research/owner-composition-exploration-r04/directions/briefs/` that cites items of a decisions file
    passes the new check on those citations when its worktree line is pointed at this worktree; the old briefs' other
    failures (worktrees that no longer exist, a moved HEAD) may remain and are not counted.
  - **Intent.** The new rule adds a failure only where the cited item is really missing.
- **D3. Planted controls and proof.**
  - **Outcome.** Tests run by the fast ladder, each failing on `eddee7b8` and passing after, cover: a single item,
    a list, a range and a mixed list that each name one missing item; the same citations all present; a range whose
    middle item is missing; a decisions file that exists in the command repository with the item but not in the named
    worktree's copy. B10's row in `docs/agent-context/briefs/codex.md` says the check covers decision items.
    `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** The rule is shown to fail on each defect it exists for.

## Scope

You may change `scripts/agent-environment/check-brief.mjs`, `scripts/agent-environment/check-brief.test.ts`, any new
fixture beside them, and B10's row in `docs/agent-context/briefs/codex.md`; commit once when done. Everything else is
read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others,
then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 25 lines.
