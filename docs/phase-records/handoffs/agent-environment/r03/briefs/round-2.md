<!-- brief-format: v1 role: codex -->
# Codex brief: records that keep only what is read (agent-environment-r03, round 2)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03`, branch `agent-environment-r03`, HEAD `1756dc7e`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 12-16.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md` §"Records": the rows this round closes.
  - `docs/WORKFLOW.md` §"Active ledger and closed history": the closure procedure as it stands.
  - `scripts/verify-repository.mjs`, `scripts/check-agent-context.mjs`, `scripts/show-agent-context.mjs`: the record checks.
  - `scripts/agent-environment/new-handoff.mjs`, `scripts/agent-environment/resume-point.mjs`: the resume-point tools.

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

The work records keep only what a reader or a check uses. A milestone can close as carried by a successor, closing
is one commit that moves the record, each milestone fact has one home, a milestone's resume point is one file edited
in place, and no check depends on a clock, on a hash git already keeps, or on a list that only excuses other records.

## Causes and required outcomes

The record tools run four ways: `pnpm check:repository` (the same script as `node scripts/verify-repository.mjs`,
which also runs `check-agent-context`, and part of `pnpm verify:fast`), `pnpm context:show --milestone <id>`,
`pnpm handoff:new --milestone <id>`, and CI (`.github/workflows/checks.yml`, PowerShell on windows-latest:
`pnpm biome ci .`, `node scripts/verify-repository.mjs`, `node scripts/check-owner-tokens.mjs`,
`node scripts/run-vitest.mjs run scripts`). Every outcome holds in CI and locally from PowerShell, and all four CI
checks pass at the HEAD above. Locally, `scripts/check-frontier-preservation.test.ts` "real repository acceptance"
fails whenever the tree is dirty, an untracked file included (pre-existing; a later round removes that check), so
judge the suite on the committed, clean tree. Each new or changed rule comes with unit tests.

- **M1. Closure by succession.** No terminal status fits a milestone whose open work a successor carries, so history
  overloads `FAILED_VALIDATION` and `NEEDS_HUMAN` for it (audit §"Records", first row). Terminal statuses are listed
  in `scripts/verify-repository.mjs:141`, `scripts/check-agent-context.mjs:29`,
  `scripts/project-state-history-transition.mjs:51` and the schemas under `docs/schemas/`. Outcome: `SUPERSEDED` is a
  terminal status wherever a terminal status is recognized. A `SUPERSEDED` milestone has a non-empty `stopReason` and
  a `supersededBy` naming a different milestone that exists in the ledger or in history; no other status carries
  `supersededBy`; anything else fails a check. A `SUPERSEDED` milestone never satisfies a dependency
  (`scripts/verify-repository.mjs:175-181` accepts only `DONE`): a dependent names the successor. Intent: right
  after this round the coordinator closes agent-environment-r02 as superseded by agent-environment-r03.
- **M2. No clock and no pin.** `lastHeartbeatAt` is read only by a presence check and `leaseExpiresAt` only by the
  lease comparison (`scripts/verify-repository.mjs:199-218`); `taskPacketSha256` is rewritten in the same commit as
  every packet edit, so it proves nothing git does not (`scripts/check-agent-context.mjs:842-851` and `:922-951`,
  `scripts/show-agent-context.mjs:159`). `pnpm handoff:new` writes all three
  (`scripts/agent-environment/new-handoff.mjs:241-248`). Outcome: no schema requires the three fields, no check or
  tool reads them, and `pnpm handoff:new` writes none of them. Intent: no result depends on the date a check runs,
  and the coordinator can delete the fields from the records afterwards without a check failing.
- **M3. One home for each milestone fact.** The packet repeats the ledger's `baseCommit`, `scope` and current
  handoff, the ledger repeats the packet's `taskClass`, and the checks fail when a copy differs
  (`scripts/check-agent-context.mjs:836-881` for a closed packet, `:930-956` for an active one,
  `scripts/show-agent-context.mjs:137-161`; audit §"Records", C6). Outcome: each fact is read from one home:
  `baseCommit`, `scope` and the current handoff from the ledger, `taskClass` from the packet. No check compares a
  copy, no schema requires one, and `pnpm context:show --milestone <id>` prints each fact from its home. Intent:
  changing a milestone's scope or handoff is one edit.
- **M4. One resume file per milestone.** `pnpm handoff:new` writes a new `<YYYYMMDD-HHMMSS>-<milestone-id>-resume.md`
  each time (`scripts/agent-environment/new-handoff.mjs:189-198`); only the newest is read, and the "Previous resume
  point" line that chains them is never followed (`scripts/agent-environment/resume-point.mjs:14`; audit §"Records",
  A35). Outcome: a milestone's resume point is one file, `<milestone-id>-resume.md`, in the directory of its current
  handoff unless `--dir` names another. `pnpm handoff:new --milestone <id>` creates the file from
  `docs/agent-context/HANDOFF_TEMPLATE.md` when it does not exist; when it exists, the run keeps every byte of it
  except the "As of" line. Either way the ledger names the file afterwards, and nothing else in the repository
  changes. No check requires a "Previous resume point" line, and a timestamped resume file the ledger names still
  passes as written. Intent: a session reads one file, and git history is the chain.
- **M5. Closing without a receipt.** Closing appends the record to history with a v2 receipt that
  `scripts/project-state-history-transition.mjs` (1,466 lines; `:720`, `:1260`) recomputes from the history bytes and
  `scripts/check-agent-context.mjs:1300-1369` chains, while git already records each closure (`docs/WORKFLOW.md:56-67`;
  audit §"Records", C5). Outcome: closing is one commit that moves the terminal record from the ledger to the end of
  `PROJECT_STATE_HISTORY.yaml`, with no receipt, declaration or anchor, and the checks pass after it. The checks
  still fail on each rule `docs/WORKFLOW.md:63-64` lists. The 12 receipts and the legacy anchor file stay where they
  are; code, tests and schemas that nothing reads after this round are deleted. Intent: a closure costs one edit,
  its record is the commit, and review and git keep history append-only.
- **M6. Closed records are frozen.** `docs/agent-context/HISTORY_POINTER_EXCEPTIONS.yaml` exists only to excuse
  history pointers whose targets are gone (`scripts/check-agent-context.mjs:54`, `:512`, `:1437`), and every packet
  must name `evidence.receiptTemplate`, a file no reader opens (`docs/schemas/task-packet.schema.json:134`; audit
  §"Records", C13 and C14). Outcome: no check follows a path inside a closed record (a history entry or a `CLOSED`
  packet); closed records are checked for their shape and for the rules M5 keeps. `HISTORY_POINTER_EXCEPTIONS.yaml`
  and the code that reads it are deleted. `evidence.receiptTemplate` is optional and no check opens its file;
  `docs/agent-context/EVIDENCE_RECEIPT_TEMPLATE.md` stays (round 3 decides it). Intent: a file can move or go without
  a closed record holding it in place.
- **M7. Today's records still pass.** Outcome: with every record file as it is at the HEAD above (the ledger,
  history, packets and handoffs still carry the old fields), the four CI checks pass on your committed, clean tree,
  and `pnpm context:show --milestone <id>` succeeds for each milestone in `PROJECT_STATE.yaml`.
  `docs/agent-context/README.md`, `docs/agent-context/HANDOFF_TEMPLATE.md` and
  `docs/agent-context/TASK_PACKET_TEMPLATE.yaml` say only what is true after the round. Intent: the coordinator
  strips the old fields after this round, not before.

## Scope

You may change and delete files in `scripts/agent-environment/**`, `scripts/check-agent-context.mjs`,
`scripts/check-agent-context.test.ts`, `scripts/show-agent-context.mjs`, `scripts/show-agent-context.test.ts`,
`scripts/verify-repository.mjs`, `scripts/verify-repository.schema.test.ts`,
`scripts/project-state-history-transition.mjs`, `scripts/project-state-history-transition.test.ts`,
`scripts/project-state-history-v2.test.ts`, `docs/schemas/**`, `docs/agent-context/README.md`,
`docs/agent-context/HANDOFF_TEMPLATE.md`, `docs/agent-context/TASK_PACKET_TEMPLATE.yaml` and
`docs/agent-context/HISTORY_POINTER_EXCEPTIONS.yaml`, and add test files under `scripts/`; commit once when done.
Everything else is read-only, including `PROJECT_STATE.yaml`, `PROJECT_STATE_HISTORY.yaml`, the task packets, the
handoffs, `AGENTS.md`, `docs/WORKFLOW.md`, `docs/agent-context/ROUTES.yaml`, `scripts/verify.mjs`, `package.json`
and `.github/`. Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the
others, then stop and report. (r04 B3)

## Report

Each outcome as PASS or FAIL with the command and the output line that proves it; the four CI checks and
`pnpm context:show` for each milestone, run after your commit on the committed, clean tree; the files you changed and
deleted; the commit SHA; anything you could not do.
