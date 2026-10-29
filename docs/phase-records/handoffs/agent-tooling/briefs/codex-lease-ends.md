<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: a lease's end is read, and a raised test floor is not inflation (agent-tooling-r01, round lease-ends)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-lease-ends`, branch `tooling-lease-ends`, HEAD `d1f0b8d3`
- **Milestone:** `agent-tooling-r01`. Decisions: `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` items 14, 16
  and 22.
- **Read first, only these:**
  - `scripts/project-state-invariants.mjs:278-313`: the overlap check, today the only code that reads `sharedLeases`;
    `assertProjectStateInvariants` calls it with the ledger's own milestones.
  - `scripts/verify-repository.mjs:199-208`: how the gardener check reads the ledger's `updatedAt`.
  - `.github/workflows/checks.yml:24-26`: CI checks out the whole history (`fetch-depth: 0`).
  - `.agents/skills/gardener/checkout-test-fixture.mjs`: the Git fixture tests already use.
  - `scripts/verify-repository.schema.test.ts:955-1020`: the ledger fixture and the rule that the wall clock never
    decides a ledger check.
  - `docs/phase-records/handoffs/agent-environment/r03/AUDIT.md:40`: why (a wall-clock lease check failed old commits
    on CI).
  - `PROJECT_STATE.yaml:101-103` and `PROJECT_STATE.yaml:139-141`: the leases the real ledger holds (read only).
  - `scripts/agent-environment/code-health-baseline.mjs:180-206` and
    `scripts/agent-environment/code-health-ratchet.mjs:545-574`: the inflation check, and how the baseline judges a
    test floor's fall.
  - `scripts/agent-environment/code-health-ratchet-functions-blocks-floors.test.ts:210-252`: the floor test.
  - `docs/agent-context/briefs/CODE_REVIEW.md`: D1-D8, which the diff is reviewed against.

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
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- `<run>` is `codex-round-lease-ends`. Never delete or change anything under `D:/fitway-temp` outside the run folder.
- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)

## Goal

A coordinator lease on a shared file is written with an end date, and nothing reads it: this milestone's five leases
ended on 2026-10-23, `package.json` was changed under one on 2026-10-28, and the ledger written that day still carried
all five. After this round the repository check reads each lease's end and fails on an ended lease the day the ledger
is next written, without ever depending on the day the check runs; and `updatedAt`, the date it judges by, has to
move when the ledger is written. The same round removes a false failure in the code-health check: recording new
tests makes `pnpm check:code-health` fail until the commit (F302).

## Causes and required outcomes

- **E1.** `sharedLeases` entries are read only for overlaps (`project-state-invariants.mjs:278-313`); their end dates
  are prose. Outcome: `pnpm check:repository` fails when a milestone in `PROJECT_STATE.yaml` whose status is not
  terminal (`TERMINAL_STATUSES`) holds a `sharedLeases` entry whose end is earlier than the date of the ledger's
  `updatedAt`, read as the gardener check reads it (`updatedAt.slice(0, 10)`, `verify-repository.mjs:206`). A lease's
  end is written one way, `through YYYY-MM-DD`, a real calendar date, and the lease holds through that day; an entry
  with no end holds while its milestone is open. The failure names the milestone, the entry, its end date and
  `updatedAt`, and the fix: renew it with a later `through` date or drop it. In an entry of a non-terminal milestone a
  date may stand only after `through` (the end), `from` (a start) or `on` (an event, as in `renewed on 2026-10-29`);
  a date after any other word or mark (`until 2026-12-01`, `end 2026-12-01`, `expiry=2026-12-01`), more than one
  `through`, or a `through` not followed by a real date fails naming the entry and the one form. The result
  never reads the clock: the same ledger passes or fails the same way on any day, so a green commit stays green
  (`AUDIT.md:40`). `PROJECT_STATE_HISTORY.yaml` and terminal milestones are not judged. The check runs inside
  `pnpm check:repository`, which the fast ladder and CI run. Check: a new
  `scripts/project-state-leases.test.ts` (new), through `assertProjectStateInvariants` on a ledger built as the
  "lease invariant" block builds one (`verify-repository.schema.test.ts:955-1020`; share that fixture by moving it to
  a module both tests import, so nothing is copied and the schema test shrinks): a lease through the `updatedAt` date
  passes and through the day before fails, naming the four things above; the same two ledgers give the same results
  with the system clock set to 2026-01-01 and to 2030-01-01; an entry with no end passes; `until 2026-12-01`,
  `end 2026-12-01`, `expiry=2026-12-01`, two `through` dates and `through 2026-02-30` each fail naming the entry and
  `through YYYY-MM-DD`; `from 2026-10-28 ... through 2026-11-15 (renewed on 2026-10-29)` passes on 2026-10-29; a
  `DONE` milestone holding an ended lease is not failed by this check. The real ledger at the result's HEAD passes.
  Intent: an ended lease is caught the next time the coordinator writes the ledger, and no commit ever turns red
  because a day passed.
- **E3.** Nothing makes `updatedAt` move when the ledger is written: `cdc64583` changed the leases and kept
  `2026-10-28T18:30:00+03:00` until the coordinator noticed (`0cca9a87`), so E1's catch rests on a field no check
  reads. Outcome: `pnpm check:repository` fails when the working `PROJECT_STATE.yaml` differs from the copy `HEAD`
  holds and its `updatedAt` is not later than that copy's; and when the date of `updatedAt` is more than one day before
  the committer date of the last commit that changed `PROJECT_STATE.yaml`, both read as calendar dates in
  `updatedAt`'s own offset. Each failure names both values and the fix (set `updatedAt` to the time of the write). The
  first rule does not apply when `HEAD` holds no ledger, the second when no commit changed it, and neither outside a
  Git checkout; neither reads the clock, and CI has the history the second needs. Check: in
  `scripts/project-state-leases.test.ts` (new), with the Git fixture: an uncommitted ledger edit that keeps `HEAD`'s
  `updatedAt` fails and one with a later `updatedAt` passes; a ledger committed two days after its `updatedAt` (the
  commit's date set in the fixture) fails and one committed a day after passes; a later commit that leaves the ledger
  alone does not change either result; a fixture whose `HEAD` holds no ledger passes this part. Intent: the date E1
  judges by is the date the ledger was really written, give or take a day.
- **E2.** The end's one form is written nowhere a coordinator reads. Outcome: the lease row of
  `docs/agent-context/RULE_ENFORCERS.md` (the "One writer per worktree" row, `:27`) names the new part of the check in
  its enforcer column, as that row names its other parts, with the form `through YYYY-MM-DD` and that the end is judged
  against `updatedAt`. Check: `pnpm check:agent-context` passes. Intent: the next coordinator who writes a lease finds
  the form beside the check that reads it.
- **F1.** `checkCodeHealth` counts every rise from the committed baseline to the working one as inflation
  (`code-health-baseline.mjs:180-206`), test floors included, though for a floor (`testCases`, `expectCalls`, the
  directory measures) a rise is a tightening and the loosening is a fall, which the baseline refuses unless a dated
  exception covers it (`refusedChanges` and `directoryExcepted`, `code-health-ratchet.mjs:545-574`). So after
  `pnpm code-health:baseline` records new tests, `pnpm check:code-health` fails until the commit (F302), and a floor
  lowered by hand to match deleted tests passes before the commit. Outcome: working-baseline inflation is a change from
  the committed baseline in the direction that loosens its measure: a rise for a file measure, admissions excepted as
  today; a fall for a directory floor, unless an open dated exception covers it the way `refusedChanges` accepts one.
  A raised floor is not inflation. Check: extend "writes a rise and gates a cross-directory fall"
  (`code-health-ratchet-functions-blocks-floors.test.ts:210`) so `runCheck` passes after the raised `writeBaseline`
  and before its commit, and after the excepted `writeBaseline` before its commit as well as after; a new case beside
  it: a test file's only case deleted and the committed floor lowered by hand in the working baseline to match fails
  with `working baseline inflation:` naming the directory and the measure. The admission and inflation tests in
  `scripts/agent-environment/code-health-ratchet.test.ts` (`:357` and `:522`) pass unchanged. Intent: recording
  tests never fails the check, and a floor lowered by hand fails before the commit, as a file value raised by hand does
  today. A baseline change already committed is outside this check for files and floors alike (F303); this round does
  not change that.
- **K1.** Everything else stays: the overlap rules and their tests (`verify-repository.schema.test.ts`, the L1 cases and
  the "lease invariant" block), every existing test in the files this round touches, and the code-health refusals.
  `pnpm check:repository` and `pnpm check:code-health` pass on the result, and `pnpm verify:fast` passes after the
  commit. An existing test that commits a ledger in a Git fixture may set that commit's date to match its ledger; its
  assertions stay as they are.
- **K2.** No check, ratchet, test floor or limit is loosened, and `verify-repository.schema.test.ts`, under a dated
  giant-file exception, does not grow. The new tests' raised floors and any fall are recorded with
  `pnpm code-health:baseline`, each named in the commit message; `pnpm check:tooling-map` passes (regenerate with
  `pnpm map:tooling`).

## Scope

You may change `scripts/project-state-invariants.mjs` (must change), the new
`scripts/project-state-leases.test.ts` (new), `scripts/verify-repository.schema.test.ts` and a new fixture module
beside it for the shared ledger fixture, `scripts/verify-repository.mjs` (must change) and its tests,
`scripts/agent-environment/code-health-baseline.mjs` (must change),
`scripts/agent-environment/code-health-ratchet.mjs`,
`scripts/agent-environment/code-health-ratchet-functions-blocks-floors.test.ts`,
`docs/agent-context/RULE_ENFORCERS.md` (must change), and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md` and
`docs/agent-context/CODE_HEALTH_BASELINE.json` (both regenerated). `PROJECT_STATE.yaml` is the coordinator's and stays
unchanged. Commit once when done. Everything else is read-only. Add no dependencies.

Before writing a reader, parser, date check or fixture, find the one the repository already has and reuse or extend
it: the ledger fixture is the schema test's, the Git fixture is `checkout-test-fixture.mjs`, a calendar date is
checked as `code-health-ratchet.mjs` checks an exception's `until=`, and the lease entries are already split by
`scopePatterns`. Your diff is reviewed against
`docs/agent-context/briefs/CODE_REVIEW.md` D1-D8; read that list before you start. (agent-tooling DECISIONS item 14)

If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Send one fenced `report` block as your final message. Put one JSON object on each line:

```report
{"commit":"<SHA>"}
{"id":"<ID>","status":"PASS","command":"<command exactly as run>","output":"<one line copied from its output>"}
{"id":"<LIMIT>","status":"FAIL","command":"<command>","output":"<output line>"}
```

Include exactly one `commit` line and one row for each of E1, E2, E3, F1, K1 and K2. A PASS command must match a command
started after the last edit inside the worktree, and its output must be one line the command printed. Outside the
block, also list the files you changed and anything you could not do.
