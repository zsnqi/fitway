# Phase 7 reset evaluator b03 repaired worker candidate

## Candidate and live authority identities

- Status: `READY_FOR_INTEGRATION`; fresh independent runtime, Standards, and Spec verification is
  required before integration.
- Candidate commit: `SELF`, meaning the exact commit containing this document. The candidate tree
  is therefore exactly `SELF^{tree}`; this avoids a false self-referential hash in a file whose
  content determines that hash.
- Candidate source parent: `4ad42dcf31dff8f037c4d8899e3eb9da40a3ed21`; exact source tree:
  `330b427ac8d5d376e2e4fa0a754715e54853c49e`.
- Stage 1 parent: `79301f66c1f046d60df45bf63ff8991d9e4c5f29`; activation/base:
  `7574b56ea712e7ae9c8c583ccf096aec39e6ef69`.
- Branch / worktree / worker run ID: `work/phase7-reset-evaluator-b03` /
  `D:/Projects/fitway-worktrees/phase7-reset-evaluator-b03` / `p7_reset_eval_b03`.
- Current coordinator main observed immediately before this handoff:
  `14273ea03aa4a709a445f51abaa69e24da13568f`.
- Live `PROJECT_STATE.yaml`: `IN_PROGRESS`, repair `2/2`, heartbeat
  `2026-08-13T13:55:00+03:00`, null stop reason and integrated commit, and independent review
  `PENDING`. Coordinator start authority remains live-main handoff
  `20260813-131510-p7_reset_eval_b03-coordinator-start.md`; binding reviewed plan is `770e464`.
- Browser, accessibility, and visual validation: `NOT_REQUIRED` for this non-UI slice.

## Exact ownership, lease, and exclusions

Worker-owned paths:

- `packages/api/src/reset/**`
- `apps/server/src/phase7-reset-evaluator.integration.test.ts`
- new `docs/phase-records/handoffs/phase7-reset-evaluator/*-p7_reset_eval_b03-worker-*.md`

Exclusive lease through `2026-08-20T13:13:09+03:00`:

- `packages/api/src/occupancy/schedule.ts`
- `packages/api/src/occupancy/schedule.test.ts`
- `packages/api/src/occupancy/business-day.ts`
- `packages/api/src/occupancy/business-day.test.ts`

All paths outside that ownership and lease remained forbidden. In particular there was no router,
context, transport, persistence, migration, schema, other-domain, UI/Paper, configuration,
manifest, lockfile, authority-document, existing-handoff, verification-profile, or
`PROJECT_STATE.yaml` edit.

## Auditable boundaries and changes by file

1. Stage 1 `79301f66c1f046d60df45bf63ff8991d9e4c5f29` contains only the four accepted
   `f329f70` blobs: `packages/api/src/reset/types.ts` adds the accepted evaluator contracts;
   `packages/api/src/reset/evaluator.ts` adds the accepted pure evaluator;
   `packages/api/src/reset/evaluator.test.ts` adds its 9 accepted unit cases; and
   `apps/server/src/phase7-reset-evaluator.integration.test.ts` adds the accepted Phase 5 command
   composition integration. Exact blob IDs are respectively
   `a0ac24d3f60943bcf088776b6a7c7a1ec788b90a`,
   `555577656a4794695477bd779eb2492658f3a906`,
   `57f397f4b65ddf1b7df9bae8616a8057fd18048c`, and
   `9a6b0673582445def102176c569a5140fdfd034c`.
2. Recreated Stage 2 `4ad42dcf31dff8f037c4d8899e3eb9da40a3ed21` is the single source
   rollback boundary. `packages/api/src/occupancy/schedule.ts` adds total exact/earlier-fold/gap
   session resolution while retaining a strict public wrapper; `schedule.test.ts` freezes both
   public gap throw paths. `business-day.ts` adds the shared exclusive local-wall close primitive,
   keeps instant-based behavior unchanged, and restores boundary validation ahead of timezone
   conversion; `business-day.test.ts` freezes before/equal/after attribution and the exact invalid
   boundary plus invalid timezone precedence. `reset/evaluator.ts` generates all history candidates,
   applies real-instant ownership, orders by scheduled civil label / effectiveFrom / version, and
   throws only for the selected unresolved winner. `reset/evaluator.test.ts` retains the complete
   b02 matrix and adds equality, exact/gap equivalence, observable sentinel ordering, same-effective
   version precedence, and order-permutation regressions. Reverting Stage 2 returns exactly to
   Stage 1. Rejected b02 Stage 2 was used only as file-level provenance; its commit and handoff were
   never replayed.
3. `SELF` is Stage 3 and changes only this new worker handoff. Reverting `SELF` returns exactly to
   the validated Stage 2 source tree.

Activation-to-source name-status is exactly the eight source/test paths above. Activation-to-SELF
adds only this new b03 handoff.

## Frozen behavior and observable ordering evidence

- Exact and fold candidates own at the real instant immediately before close. A gap owns at its
  actual forward transition instant, used for ownership only. Full-history generation precedes
  ownership filtering, so a losing close or opening gap cannot abort another candidate.
- Scheduled civil date plus wall milliseconds determines the final close. Equal scheduled labels
  use later `effectiveFrom`, then higher version, independent of transition, kind, or input order.
- The three-candidate sentinel fixture makes selection public and distinct: both New York `02:45`
  and Chicago `02:15` gaps independently throw the fixed existing gap error, while all six input
  permutations with the later scheduled UTC `03:00` exact sentinel issue settings version 1 at
  `03:00Z`. A transition-based comparator would select a later real gap and throw; an array-position
  comparator fails at least one permutation. No internal export or error-schema change was added.
- The separate equal-label exact/gap fixture uses identical `effectiveFrom`; the lower gap alone
  throws, while both combined input orders issue higher exact version 9. This directly freezes the
  version secondary precedence with an observable selected settings version.
- The fixed public unresolved-gap error remains
  `Schedule wall time does not exist in the configured zone`.
- Shared exclusive attribution assigns a close at or before the boundary to the preceding civil
  date for exact, fold, and gap labels. Exact-close changes do not own; owner, buffer, and `dueAt`
  freeze at close, while later changes remain prospective.

## Repair ledger and TDD evidence

- Original equality RED: the rejected b02 file-level baseline failed the preceding business-day
  throw for New York gap close `02:30`, boundary `02:30`; centralized `<=` attribution made the
  preceding day throw and the following day return `no_scheduled_close`.
- Focused repair `1/2`: the withdrawn candidate resolved the timezone before validating the public
  boundary. Exact RED command and outcome:
  `pnpm exec vitest run packages/api/src/occupancy/business-day.test.ts -t "invalid boundary before an invalid timezone"`
  failed 1/1 because expected `Invalid business-day boundary` received
  `Invalid time zone specified: Not/AZone`. Restoring boundary validation before `localParts` made
  the same command pass 1/1. The strengthened ordering tests required no production change and
  passed 2/2 focused after directly distinguishing issue/version from the fixed gap error.
- Withdrawn commits `ec7b114` and `cf41535` were recreated from preserved Stage 1; they are not the
  candidate. The full formal ladder below restarted on `4ad42dc` and every source gate passed first
  run.
- Focused repair `2/2`: replacement Stage 3 staged `git diff --check` found one trailing space on
  the coordinator-main identity line. Only that whitespace was removed; source and semantics did
  not change. The entire formal ladder restarted again on final `SELF` and passed as recorded below.
  Cumulative b03 repair count is `2/2`; no repair remains.

## Literal worker commands and results

Environment for integration/profile commands:

```powershell
$env:FITWAY_RUN_ID='p7_reset_eval_b03'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p7_reset_eval_b03'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p7_reset_eval_b03'
```

No database was provisioned because the assigned integration is pure and made no Postgres
connection.

```powershell
pnpm exec vitest run packages/api/src/occupancy/business-day.test.ts
# PASS: 1 file, 7 tests

pnpm exec vitest run packages/api/src/reset/evaluator.test.ts
# PASS: 1 file, 28 tests

pnpm exec vitest run packages/api/src/occupancy/schedule.test.ts packages/api/src/reset/evaluator.test.ts
# PASS: 2 files, 39 tests

pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase7-reset-evaluator.integration.test.ts
# PASS: 1 file, 1 test

pnpm exec biome check packages/api/src/reset packages/api/src/occupancy/business-day.ts packages/api/src/occupancy/business-day.test.ts packages/api/src/occupancy/schedule.ts packages/api/src/occupancy/schedule.test.ts apps/server/src/phase7-reset-evaluator.integration.test.ts
# PASS: checked 8 files, no fixes

pnpm --filter @fitway/api check-types
# PASS: tsc --noEmit

pnpm --filter server check-types
# PASS: tsc --noEmit

pnpm verify:fast
# PASS without mutation: invariants; 230-file Biome; workspace types; 40 unit files / 204 tests;
# 18 Python simulator tests; repository mutation guard

$env:FITWAY_PHASE='phase7-reset-evaluator'
pnpm verify:phase
# PASS without mutation: repeated fast ladder plus Phase 7 integration 1/1; mutation guard

git diff --check 7574b56ea712e7ae9c8c583ccf096aec39e6ef69 HEAD
git diff --cached --check
git diff --name-status 7574b56ea712e7ae9c8c583ccf096aec39e6ef69 HEAD
git status --short --branch
git rev-parse HEAD
git rev-parse 'HEAD^{tree}'
# PASS at source boundary: no diff/staged errors; exact eight-path allowlist; clean branch;
# HEAD 4ad42dcf31dff8f037c4d8899e3eb9da40a3ed21;
# tree 330b427ac8d5d376e2e4fa0a754715e54853c49e
```

## Fresh verification, resume, and stop fields

- Fresh verifier run ID: `p7_reset_eval_v03`; only database/reset marker:
  `fitway_integration_p7_reset_eval_v03`.
- Verify detached exact `SELF`, require `git rev-parse HEAD == SELF`, require
  `git rev-parse 'HEAD^{tree}' == SELF^{tree}`, and require parent/source
  `SELF^ == 4ad42dcf31dff8f037c4d8899e3eb9da40a3ed21` with source tree
  `330b427ac8d5d376e2e4fa0a754715e54853c49e`.
- Preflight with frozen install, ignored `apps/server/.env`, `pnpm exec vitest --version`, and clean
  status. Repeat every literal command above with `_v03` resources, the focused validation-order
  probe, both observable ordering probes, activation-to-SELF allowlist, staged/diff/tree/clean
  checks, and no edits. Return only `PASS` or `FAILED_VALIDATION`. Standards and Spec review are
  separate fresh axes.
- Exact worker resume command:
  `git -C D:/Projects/fitway-worktrees/phase7-reset-evaluator-b03 status --short --branch`.
- Worker stop state after this commit: clean `READY_FOR_INTEGRATION`; do not push, merge, edit main,
  edit state/profile, or continue source work.
- Immediate stop conditions: scope/lease/authority mismatch, any fresh verifier rejection, or any
  further candidate gate failure. No repair remains, so any such failure is terminal for b03. A
  pre-integration terminal failure preserves all commits/evidence, records the actual
  counter/gates/reason, clears owner/heartbeat/expiry, releases the lease, and removes the
  unintegrated profile. Only all independent PASS results permit coordinator no-ff integration.
