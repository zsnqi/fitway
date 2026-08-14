# Phase 8 health-alert integration b01 coordinator start

- Status: `IN_PROGRESS` — worktree prepared and ratified. **No source, test, schema, or migration
  edit has been made.** Stage A has not begun.
- Activation commit / worker base: `45d1edfbb4f9a727c3589e600cfff66151fd45f6`
- Branch / worktree: `work/phase8-integration-b01` /
  `D:/Projects/fitway-worktrees/phase8-integration`
- Run ID / disposable database: `p8_integration_b01` /
  `fitway_integration_p8_integration_b01`
- Approved plan: `docs/phase-records/handoffs/phase8-integration/20260814-133826-p8_integration_b01-plan.md`
- Activation record: `docs/phase-records/handoffs/phase8-integration/20260814-154444-p8_integration_b01-coordinator-activation.md`
- Repair budget: `0/2`
- Push/deploy: none.

## Worktree preflight, per `docs/WORKFLOW.md:52-58, 81-87`

| Check | Evidence | Result |
| --- | --- | --- |
| Branch created at the exact activation commit | `git rev-parse HEAD` in the worktree returns `45d1edfbb4f9a727c3589e600cfff66151fd45f6` | PASS |
| Worktree clean | `git status --porcelain --branch` returns only `## work/phase8-integration-b01` | PASS |
| Dependencies installed from the frozen lockfile | `pnpm install --frozen-lockfile` completed in 1m 11.9s; lockfile unmodified | PASS |
| Executable-link gate | `pnpm exec vitest --version` → `vitest/4.1.10 win32-x64 node-v24.14.0` | PASS |
| Environment provisioned | `apps/server/.env` created with the five currently-required variables | PASS |
| Environment file untracked | `git check-ignore -v apps/server/.env` → `apps/server/.gitignore:32:.env*` | PASS |
| Lease unexpired | `2026-08-21T15:44:44+03:00`, seven days out | PASS |

The vitest gate is the one `docs/WORKFLOW.md:53-55` designates: a fresh worktree starts without
`node_modules`, and a partial install leaves `node_modules/.bin` without the root tool links, in
which case no test result from that worktree would be trustworthy. It printed a version, so the
links are complete.

`apps/server/.env` holds synthetic local values only. `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
are deliberately absent: the approved plan adds them in Stage A, when `packages/env/src/server.ts`
first requires them. From Stage A onward both this file and the process-local set in the plan's
verification ladder must carry them, and both provisioning paths are required — the file does not
reach the unit suite, and the process-local set does not reach the integration suite.

## Concurrency state, preserved

`phase-12` remains `IN_PROGRESS` with its exclusive `edge/**` lease through
`2026-08-20T20:08:41+03:00`, untouched by this activation and verified non-overlapping from both
sides in the activation record. Two active milestones now hold leases; `scripts/verify-repository.mjs:198-202`
rejects any shared lease string and passed. All Phase 7 closure evidence is unmodified.

## Exact next action for the worker

Stage A of the approved plan, and nothing beyond it. Establish the failing seams first:

1. `packages/api/src/alerts/message.ts` + `message.test.ts` — deterministic notice text.
2. `apps/server/src/alert-notifier.ts` + `alert-notifier.test.ts` — Telegram adapter over an
   **injected** `fetch`; no real network call in any test; token never in a log, error, or thrown
   value.
3. `packages/env/src/server.ts` (leased) — `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.

Stage A's gate is limited to what its own artifacts can prove. The database-state proof that
transport failure leaves health tables byte-identical belongs to Stage C. `verify:phase` is red by
construction until Stage B creates `apps/server/src/phase8-integration.integration.test.ts`; during
Stage A record it as not-yet-applicable with that reason and gate on the focused unit command plus
`pnpm verify:fast`.

Commit Stage A as one boundary, then obtain an independent read-only Stage A review before Stage B.

## Resume command

```powershell
cd D:/Projects/fitway-worktrees/phase8-integration
git status --short --branch
git rev-parse HEAD   # expect 45d1edfbb4f9a727c3589e600cfff66151fd45f6 until Stage A commits
pnpm exec vitest --version
```

## Stop conditions

Unchanged from the approved plan and the activation record. Immediate `NEEDS_HUMAN` on a
forbidden-path need, a migration/index/schema need, a need to change `cron.ts` or `vercel.json`, a
lease widening, a secret reaching a tracked file, or any deployment requirement. Expected red/green
TDD work is not a repair; the formal budget stays `0/2` until a candidate gate fails.
