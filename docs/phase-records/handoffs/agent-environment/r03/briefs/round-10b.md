<!-- brief-format: v1 role: codex -->
# Codex brief: a lease has one holder, and a scope line claims only its paths (agent-environment-r03, round 10b)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `d8945397`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 14, 17.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/r03/briefs/round-10.md`: the round this repairs; its outcomes R1-R7
    still hold.
  - `AGENTS.md` §"Ownership and records": disjoint owned paths and a coordinator lease for any shared file.

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
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- Other work may hold ports 3176-3177 when you run the fast ladder: wait with Monitor until both are free (up to 90
  minutes) instead of reporting a failure; never stop a process you did not start. (round 8: H10 failed on a held port)

## Goal

Two open milestones can never hold the same shared file, with or without a lease, and the overlap check compares the
paths a ledger line names, not the words around them.

## Causes and required outcomes

- **L1. Two milestones may hold one lease.** Round 10 removed the check at `70bc51c1` that failed two open milestones
  sharing a `sharedLeases` string, and `scripts/verify-repository.mjs:340-363` lets an overlap pass when either
  milestone's lease names the path, so both may name it. Outcome: two open milestones whose `sharedLeases` name the
  same path (the same string, or two globs that can match one path) fail `check:repository` with a line naming both
  milestones and the path; an overlap still passes when exactly one of the two holds a lease naming the shared path;
  closed records are not compared. Intent: a lease is held by one writer at a time.
- **L2. Prose words are claimed as paths, and a path inside prose is missed.** `scopePatterns`
  (`scripts/verify-repository.mjs:148-157`) splits on `and` and `(`, so "packages/api/src/access/** and its tests"
  claims `tests`, and access-reason-cap-r01's "one new frontier policy pointer document ... under
  docs/phase-records/handoffs/coordinator/; ..." claims its prose words but not the folder. Outcome: an entry claims
  exactly the repository paths written before its first `: ` (the whole entry when it has none): each token holding a
  `/` or a file name with an extension, trailing punctuation removed, a final `/` claiming the folder and everything
  in it; no other word is claimed; an entry naming no path fails naming the milestone and the entry. The report lists
  what each open milestone's entries claim at your commit. Intent: the check compares what the policy compares.
- **L3. A bad task class is not named.** A packet whose `taskClass` is not one of the four route names fails
  `check:agent-context` with a schema dump that omits the value. Outcome: the failure names the packet and the value.
  Intent: the fault reads in one line.
- **L4. Proven.** Outcome: tests for L1-L3, each failing on `d8945397` and passing after, run in the fast ladder's
  unit-test step; round 10's tests still pass; the ledger at your commit passes; `node scripts/verify.mjs fast`
  passes on your committed, clean tree. Intent: the repairs are shown, not claimed.

## Scope

You may change `scripts/verify-repository.mjs`, `scripts/verify-repository.schema.test.ts`, `docs/schemas/**`,
`scripts/check-agent-context.mjs` and `scripts/check-agent-context.test.ts`; commit once when done. Everything else is
read-only, including the ledger and the history. Add no dependencies. If an outcome cannot be met, do not work around
it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; L2's list of claims; the files you
changed; the commit SHA; anything you could not do. At most 30 lines.
