<!-- brief-format: v1 role: codex -->
# Codex brief: the repository's checks say what they mean (agent-environment-r03, round 10)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `70bc51c1`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 14, 17.
- **Read first, only these:**
  - `docs/agent-context/briefs/codex.md`, its checklist: the brief rules B1-B10 that R4 separates from the checker's ids.
  - `docs/agent-context/ROUTES.yaml` and `docs/agent-context/README.md`: the routes R3 trims.

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
- Other rounds run beside this one in other worktrees. The fast ladder's contract tests bind ports 3176-3177: if they
  are taken when you run the ladder, wait with Monitor until both are free (up to 90 minutes) instead of reporting a
  failure; never stop a process you did not start. (round 8: H10 failed on a held port)

## Goal

Each repository check that a reader or another agent relies on reports the real fault by name, and the routing layer
carries no mode or task class nothing uses.

## Causes and required outcomes

- **R1. A misplaced `supersededBy` is not named.** The schema's rule (`docs/schemas/project-state.schema.json:262-283`)
  fails first, and `scripts/verify-repository.mjs:344-354` prints its raw errors ("must NOT be valid", schema path #/allOf/2/else/not),
  so the named message at `verify-repository.mjs:192-193` is never reached. Outcome: a record that is not `SUPERSEDED`
  and carries `supersededBy`, in the ledger or the history, fails `check:repository` with a line naming the milestone
  and `supersededBy`; a `SUPERSEDED` record without it still names the field. Intent: whoever closes a milestone
  reads the fault without decoding a schema path.
- **R2. A standalone `--` reaches Vitest.** `scripts/run-vitest.mjs:10` strips `--` only as the first argument, and
  `pnpm test -- <file>` arrives as `run -- <file>`, so the filter is lost and every test file is collected. Outcome:
  `pnpm test -- <file>` and `pnpm test <file>` each run only that file, in PowerShell and Git Bash. Intent: a focused
  run stays focused.
- **R3. A routing mode and four task classes nothing uses.** `ROUTES.yaml:2` is `mode: active`, yet
  `scripts/show-agent-context.mjs:84`, `scripts/show-agent-context.mjs:174-176` and
  `scripts/check-agent-context.mjs:981-989` keep a compatibility branch; `analysis-review`,
  `verification-independent`, `resume-integration` and `historical-audit` appear in no packet in
  `docs/phase-records/task-packets/`, no ledger record and no history record. Outcome: the four routes and
  class names and the compatibility branch are gone from the routes, the checks, the packet schema and their tests;
  every packet, ledger record and history record still passes `check:agent-context` and `check:repository`.
  Intent: the context layer says only what it does.
- **R4. The brief checker's ids collide with the brief rules.** `scripts/agent-environment/check-brief.mjs` reports
  its own checks as B1 (worktree and paths), B2 (header and environment block), B3 (placeholders and forbidden text)
  and B4 (length), while `docs/agent-context/briefs/codex.md` names B1-B10 for other rules. Outcome: no checker line
  can be read as one of the brief rules: each names what it checked; `codex.md`'s B10 names the checker id it relies
  on. Intent: a failed line points at the right rule.
- **R5. The Impeccable fallback is one machine's path.** `scripts/check-design-context.mjs:27-28` holds
  `C:\Users\Pc Force\.codex\...`, and a second install under the home folder's .agents/skills/impeccable is never
  searched. Outcome: with `IMPECCABLE_BIN` unset and no `impeccable` on PATH, the check finds an install under the
  running user's home in either place, and its not-found message lists every place it looked. Intent: the check runs
  for any user and says why it failed.
- **R7. No check compares owned paths across open milestones.** `scripts/verify-repository.mjs:219-251` checks only
  that branch, worktree and lease strings are unique (AUDIT finding A7, `D:/fitway-temp/env-audit-a/REPORT.md` line
  27; AGENTS.md "Ownership and records": disjoint owned paths and a coordinator lease for any shared file). Outcome:
  two open milestones whose `ownedPaths` name the same file, or a file and a glob or two globs that can match one
  path, fail `check:repository` with a line naming both milestones and the path, unless a `sharedLeases` entry names
  that path; a line written `<path>: <prose>` claims `<path>`; closed history records are not compared. The ledger
  at the brief's HEAD passes. Intent: two writers cannot be handed the same file without the lease the policy asks for.
- **R6. Proven.** Outcome: tests for R1-R5 and R7, each failing on `70bc51c1` and passing after, run in the fast ladder's
  unit-test step; `node scripts/verify.mjs fast` passes on your committed, clean tree. Intent: the repairs are shown,
  not claimed.

## Scope

You may change `scripts/verify-repository.mjs`, `scripts/verify-repository.schema.test.ts`, `docs/schemas/**`,
`scripts/run-vitest.mjs` and its test, `docs/agent-context/ROUTES.yaml`, `docs/agent-context/README.md`,
`scripts/check-agent-context.*`, `scripts/show-agent-context.*`, `scripts/agent-environment/check-brief.*`,
`docs/agent-context/briefs/codex.md` and `scripts/check-design-context.mjs`; commit once when done. Everything else is
read-only, including the ledger and the history. Add no dependencies. If an outcome cannot be met, do not work around
it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome PASS or FAIL with the command and the output line that proves it; the files you changed; the commit SHA;
anything you could not do. At most 25 lines.
