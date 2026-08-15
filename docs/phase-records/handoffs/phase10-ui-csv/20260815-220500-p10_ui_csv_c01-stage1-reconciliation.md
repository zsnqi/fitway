# Phase 10 owner reporting UI and CSV — Stage 1 coordinator reconciliation

- Status: `IN_PROGRESS`. Stage 1 of the slice (API exposure) is now durable; the UI stage has not
  started. Repair budget unchanged at `0/2` — nothing here is a repair of a failed gate.
- Base commit / candidate commit: `95ff3cb` (activation) / this commit.
- Branch / worktree / run ID: `work/phase10-ui-csv-b01` /
  `D:/Projects/fitway-worktrees/phase10-ui-csv-b01` / `p10_ui_csv_c01`.

## Why this record exists

The `p10_ui_csv_b01` worker session ended on a usage limit, not at a stage boundary. It left the
three owner-only reporting procedures and their wiring **uncommitted** in the worktree. The work was
valid and inside the activation contract's owned paths and wiring lease, so it is preserved rather
than discarded. Two type errors and one formatting error in the new test file — the kind a session
fixes in its next loop — were repaired by the coordinator before committing; no production behaviour
was changed in that repair.

## Changes by file

- `packages/api/src/analytics/reporting/queries.ts` (new): `admin.analytics.{range, heatmap,
  weekOverWeek}` over the frozen contracts, plus `REPORTING_QUERY_MAX_RANGE_DAYS = 31` narrowing the
  frozen `reportingDateRangeInputSchema` for the two non-streaming reads. `weekOverWeek` takes no
  input: the window and the comparability bar are resolved server-side.
- `packages/api/src/analytics/reporting/queries.test.ts` (new): 6 tests over the three leaves —
  owner-only guard with no repository touch on rejection, the frozen range/heatmap contracts with
  closed/missing/genuine-zero kept apart, the range bound inclusive at 31 days, server-side
  comparison window with typed `insufficient_history` reasons, and a loud failure when no reader was
  injected.
- `packages/api/src/context.ts` (wiring lease): three optional owner-only reader fields.
- `packages/api/src/routers/index.ts` (wiring lease): the three leaves mounted beside the accepted
  CSV leaf.
- `apps/server/src/index.ts` (wiring lease): the existing `reportingRepository.readRange`,
  `readHeatmap`, and `readWeekOverWeek` injected; `readWeekOverWeek` wrapped to drop any argument.

## Coordinator repair applied before commit

1. `queries.test.ts` typed its `insufficient_history` fixture with `as const`, producing a `readonly`
   `reasons` tuple that is not assignable to the contract's mutable array. Replaced with an explicit
   `WeekComparison` annotation.
2. The owner-only guard test iterated the `range` and `heatmap` leaves through one loop variable,
   whose union of procedure types `call` cannot accept. Unrolled to named calls per leaf, preserving
   every assertion; widening the procedures to iterate would have weakened the contract assertion.
3. `biome check --write` formatting on the new test file.

## Validation commands and results

Run from `D:/Projects/fitway-worktrees/phase10-ui-csv-b01`:

- `pnpm check-types` — PASS (all packages).
- `pnpm exec vitest run packages/api/src/analytics/reporting/` — PASS, 3 files / 26 tests.
- `pnpm exec biome check packages/api/src/analytics/reporting/ packages/api/src/context.ts
  packages/api/src/routers/index.ts apps/server/src/index.ts` — PASS.
- `git status --porcelain` clean after the commit.

Not yet run for this slice: `apps/server/src/phase10-ui-csv.integration.test.ts` (not written),
browser, accessibility, and visual gates. All remain `PENDING`.

## Remaining work

The whole UI stage of the activation contract: `apps/web/src/components/owner/reporting/**`,
`apps/web/src/hooks/use-owner-reporting.ts` and its test, the `/admin` mount,
`apps/server/src/phase10-ui-csv.integration.test.ts`, `tests/browser/phase10-ui-csv.browser.spec.ts`
and its screenshot subtree, and the phase UI polish loop in both locales.

## Carried constraints

Unchanged from `20260815-184500-p10_ui_csv_b01-coordinator-activation.md`, and binding on the next
stage: frozen reporting contracts and CSV transport consumed as they are; closed, missing, and
genuine zero stay distinct; week-over-week shows its honest `insufficient_history` state with the
typed reason; every chart has an adjacent semantic table; Arabic RTL default with Western digits;
owner-only server-side; canonical baselines outside this slice's own subtree are read-only, and a
diff in one is a stop condition. **Paper remains unreachable, so Paper fidelity must not be
claimed** — the Paper-fidelity review stays an open gate for this surface.

## Exact resume command

```
cd D:/Projects/fitway-worktrees/phase10-ui-csv-b01 && git log --oneline -1
```
