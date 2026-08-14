# Phase 8 health-alert integration b01 coordinator activation

- Status: `READY` — activated, not started. No source, test, schema, or migration change exists.
- Activation commit: `SELF` (this commit). `baseCommit: SELF` therefore means this commit, per
  `docs/WORKFLOW.md:59-68`.
- Pre-activation anchor: clean `main` at `753a4d7c5867f84f36bedc1d341fc0b40f34d4ab`.
- Approved plan: `docs/phase-records/handoffs/phase8-integration/20260814-133826-p8_integration_b01-plan.md`,
  status `PLAN_REVIEW_PASS`, independent round-2 review `PASS` with zero blocking findings.
- Attempt: b01, repair `0/2`.
- Push/deploy: none. Nothing pushed, deployed, or externally provisioned.

## Frontier verified before activation

| Claim | Evidence | Result |
| --- | --- | --- |
| Aggregate `phase-7` `DONE` | `PROJECT_STATE.yaml:614-636`, integrated `06b1ebf` | CONFIRMED |
| `phase8-alert-evaluator` `DONE` | `PROJECT_STATE.yaml:638-696`, integrated `7b2fe32` | CONFIRMED |
| `phase8-integration` `PLANNED`, dependency-unlocked | `PROJECT_STATE.yaml:698-720` before this commit; both dependencies `DONE`; `PHASES.md:55` agrees | CONFIRMED |
| Plan present and independently passed | plan header lines 3-5 | CONFIRMED |
| `main` clean | `git status --porcelain` empty | CONFIRMED |
| Nothing pushed | `main...origin/main [ahead 256]` | CONFIRMED |
| `phase-12` lease live and non-overlapping | `PROJECT_STATE.yaml:1211-1242`; `leaseExpiresAt: 2026-08-20T20:08:41+03:00`, unexpired at activation | CONFIRMED |

## Pre-activation `verify:fast`

Required by the plan's activation contract step 1, because the Phase 7 aggregate's `verify:full`
evidence was taken at `158b8c9` and two ledger/documentation commits plus two plan commits have
landed since, and `check:repository` is the gate that validates the ledger.

```text
command: pnpm verify:fast
commit:  753a4d7c5867f84f36bedc1d341fc0b40f34d4ab (main, clean)
result:  PASS at 2026-08-14T15:44+03:00
```

Covered: repository invariants at 35 milestones and 8 canonical approval screenshots; Biome;
workspace type checks; 43 unit files / 230 tests; 18 Python simulator tests; and the repository
mutation guard closing with "Verification fast passed without repository mutation."
`git status --porcelain` was empty before and after.

**One prerequisite arose, classified as environment provisioning and consuming no repair budget.**
The first run failed with two errors: `apps/server/src/cron.test.ts:18-21` throws without a
≥32-character `CRON_SECRET`, and `apps/server/src/reference-gating.test.ts` fails
`createEnv` validation at `packages/env/src/server.ts:27`. This is not a source defect and not
drift. It is exactly the condition the approved plan identified as round-1 significant finding 3:
`apps/server/.env` is read only by `tests/integration/setup.ts`, so it does not reach the unit
suite, and `dotenv/config` resolves `<cwd>/.env`, which does not exist in this worktree. Supplying
synthetic process-local `CRON_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN`, and
`DATABASE_URL` and rerunning produced the PASS above. The values are process-local only and appear
in no tracked file, commit, log, artifact, or record. The failure independently confirms that the
plan's corrected ladder is the correct one.

## Lease topology at activation

Two leases now exist, verified non-overlapping:

| Milestone | Lease | Expiry |
| --- | --- | --- |
| `phase-12` (`IN_PROGRESS`) | named `edge/**` Python client, store, lifecycle, and simulator files | `2026-08-20T20:08:41+03:00` |
| `phase8-integration` (`READY`, this activation) | `apps/server/src/index.ts` and `packages/env/src/server.ts` | `2026-08-21T15:44:44+03:00` |

Non-overlap is established from both sides rather than asserted. `phase-12` forbids itself "all
TypeScript DTOs, OpenAPI, API, server, router, auth, occupancy, command, reset, offline, analytics,
alert, and public surfaces" and "environment schemas and values"
(`PROJECT_STATE.yaml:1223-1225`) — precisely this slice's two leased paths. This slice forbids
`edge/**` in its entirety, including every path under the `phase-12` lease.
`scripts/verify-repository.mjs:198-202` additionally rejects any two active milestones sharing a
lease string, and the two strings are distinct. `PHASES.md:97-106` permits concurrent bounded
streams with separate ownership scopes, so both may run at once. The `phase-12` lease is preserved
untouched by this activation.

## What this activation does and does not do

Does: registers the `phase8-integration` verification profile in `scripts/verify.mjs` with
`browserFiles: []` and the single integration file
`apps/server/src/phase8-integration.integration.test.ts`; transitions only the
`phase8-integration` milestone to `READY` with owner session, branch, worktree, `baseCommit: SELF`,
owned paths, forbidden paths, the two-path lease, heartbeat, seven-day expiry, and this handoff;
and records this evidence.

Does not: touch any source, test, schema, migration, or configuration file other than the verify
profile; alter any other milestone; alter aggregate `phase-8`, which stays `PLANNED` and remains a
separate coordinator milestone; modify or reinterpret any Phase 7 closure evidence; disturb the
`phase-12` lease; or begin Stage A.

`verify:phase` for this profile is red by construction until Stage B creates the integration file
it names — expected, and recorded in the approved plan's verification section rather than treated
as a gate failure.

## Rollback boundary

Ordinary revert of this single activation commit. That restores `phase8-integration` to `PLANNED`,
removes the verify profile, and releases the lease, leaving the approved plan record in place and
every other milestone byte-identical. No schema, migration, or source rollback exists because this
activation creates none.

## Stop conditions carried into execution

Unchanged from the approved plan: immediate `NEEDS_HUMAN` on any Product/Spec conflict, privacy or
security ambiguity, a need for any forbidden path, a need for a migration, index, or schema change,
a need to change `cron.ts` or `vercel.json`, a need to widen the lease, a stale or overlapping
lease, any secret reaching a tracked file, any public capacity/history/health/device-identity leak,
any staff or owner command or UI surface, any edge or OpenAPI contract change, or any deployment or
external provisioning requirement.
