<!-- brief-format: v1 role: codex -->
# Codex brief: CI runs the local ladder, and the ladder is plain (agent-environment-r03, round 3)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `1d4e99a2`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 12-16.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md` §"CI and checks": the rows this round closes.
  - `.github/workflows/checks.yml` and `scripts/verify.mjs`: CI's list and the local ladder.
  - `docs/WORKFLOW.md:102-114`: the placeholder values the unit tests need.
  - `docs/WORKFLOW.md` §"Verification ladder": the provenance rules this round retires.

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

## Goal

CI checks every push with the ladder a developer runs locally, so the list of checks lives in one place; the ladder
runs each check once and carries no provenance layer; and no check fails because of an uncommitted file.

## Causes and required outcomes

CI (`.github/workflows/checks.yml`, PowerShell on windows-latest) keeps its own list of four checks, while
`pnpm verify:fast` (`scripts/verify.mjs:410-433`) runs a longer ladder that adds the type checks, every unit test
and the edge simulator tests; the two lists drift (audit §"CI and checks", B §1). The ladder runs
`check-agent-context` twice (`scripts/verify.mjs:423`, and again inside `check:repository`). A probe on 2026-10-07
(branch `ci-probe-verify-fast`) ran the fast ladder as CI's only check on windows-latest with the placeholder values:
it passed in 8 min 50 s (unit tests 6 min 7 s, Python 85 s, types 34 s), inside the current 20-minute timeout. You
cannot push, so the coordinator measures CI after your commit; show each outcome locally from PowerShell.

- **N1. One ladder.** Outcome: CI's only check step runs the fast ladder of `scripts/verify.mjs`, with exactly the
  non-secret placeholder values of `docs/WORKFLOW.md:102-114` set in the workflow; the ladder runs each check once;
  and it passes locally from PowerShell with those values on your committed, clean tree. No real credential, secret
  or `.env` file reaches CI. Intent: adding or removing a check is one edit, and CI and a developer get the same
  result from the same commit.
- **N2. No check fails on an uncommitted file.** `scripts/check-frontier-preservation.mjs` (1,211 lines) and its test
  (953) guard a dirty-tree repair that closed in September. Its real-repository test fails whenever the tree holds an
  uncommitted file, an untracked one included (B §3), and the ladder runs it (`scripts/verify.mjs:424`). Outcome: the
  script, its test, `check:frontier` (`package.json:34`) and the ladder step are gone, and the evidence files it
  pinned under `docs/phase-records/` stay. `node scripts/run-vitest.mjs run scripts` passes with an untracked file in
  the tree. Intent: a session's own unrelated files never fail a check.
- **N3. No provenance layer.** A local run is made "authoritative" by a Vitest runtime-session provenance layer:
  `scripts/vitest-runtime.mjs` (1,602 lines), its bootstrap test (1,423, which nothing runs: `vitest.config.ts:22`),
  `scripts/check-test-runtime.mjs` (176) and the ladder's first step (`scripts/verify.mjs:418-421`), with the
  non-claims of `docs/WORKFLOW.md:219-242` (audit A, ceremony 7: followed once). From this round on, the verification
  a record cites is the CI run on the pushed commit; the coordinator rewrites `AGENTS.md` and `docs/WORKFLOW.md` to
  say so, alongside this round. Outcome: `pnpm test`, `node scripts/run-vitest.mjs run` with or without file
  arguments, and every ladder run Vitest without provenance: no session record, no `check:test-runtime`, no
  runtime-session step. Code and tests that served only provenance are deleted. A run that changes the repository's
  files still fails (the mutation guard and `scripts/repository-fingerprint.mjs` stay), and the `phase` and `full`
  ladders keep every other step. Intent: the ladder reads in a minute, and its evidence is CI's.

## Scope

You may change and delete `.github/workflows/checks.yml`, `scripts/verify.mjs`, the `scripts` block of
`package.json`, `vitest.config.ts`, `vitest.integration.config.ts`, `scripts/run-vitest.mjs`,
`scripts/vitest-runtime.mjs`, `scripts/vitest-runtime.bootstrap.test.mjs`, `scripts/check-test-runtime.mjs`, their
tests under `scripts/`, `scripts/check-frontier-preservation.mjs` and `scripts/check-frontier-preservation.test.ts`;
commit once when done. Everything else is read-only, including `AGENTS.md`, `docs/WORKFLOW.md`, the ledger, the
packets, `scripts/repository-fingerprint.mjs`, `apps/**`, `packages/**` and `edge/**`. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and
report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the ladder's step list and timings
from your last local run on the committed, clean tree; the files you changed and deleted; the commit SHA; anything
you could not do.
