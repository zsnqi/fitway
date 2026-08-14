# Remaining frontier execution plan

- Recorded: 2026-08-15 01:05 +03:00 by the Claude Code coordinator session.
- Authority point: `main` at `ee0061c`.
- This is a coordinator sequencing record. It creates no branch, lease, or candidate, and it
  supersedes no reviewed plan or human decision.

## What the authority records actually show

Four of the outstanding items are **not greenfield**. Reading the preserved records rather than
assuming a clean slate changes the sequencing materially:

| Item | Preserved artifact | Why it stopped | Remaining work |
| --- | --- | --- | --- |
| `login-paper-adoption` | candidate `9b65356` on `work/login-paper-adoption-b01` | Terminal at repair 2/2 on a **test-locator** defect: the submitting-state assertions reuse `getByRole("button", { name: "Open operations" })`, but the accessible name becomes `Signing in…` during submission | Replace that locator with a stable owned selector, rerun the focused spec, then the deferred Phase 4 and verification ladders. The b01 record states explicitly that no implementation change is indicated |
| `phase11-shell` | candidate `0b015ee` on `work/phase11-shell-b01` | Terminal at repair 2/2 with one focused interactive target reporting computed `outline-style: none` under forced-colors emulation; 4/5 focused | Fix that one focus-visible gap under forced colors, then rerun focused + combined Phase 4/9 + fast/phase ladders |
| `phase11-audit` | plan-ready authority packet `20260811-135010-p11_audit-authority-packet.md` | Isolated-worker capacity only; never activated | Greenfield implementation against a packet that already fixes scope, locked semantics, owned paths, leases, and predeclared verification |
| `phase11-access` | human decisions `20260811-154032-p11_access-authority-resolved-capacity-blocked.md` (source commit `103cc00`) | Human ambiguity resolved; ordering prerequisites unmet | Greenfield, but gated on shell + audit integration and a coordinator audit migration |

Both preserved candidates were rejected attempts. Per their closeout records a fresh activation may
**reuse** the candidate but must open a new attempt record with its own repair counter; neither may
be treated as a third repair of b01.

## Locked decisions carried forward (not re-litigated)

- Canonical screenshot baselines are required for the final adopted Paper surfaces `/staff`,
  `/login`, `/admin`, and Owner reporting. Current screenshot gaps are not acceptance.
- The real repository FITWAY logo is the final brand mark only where Paper assigns that role;
  Paper controls placement and composition.
- Phase 11 Access lifecycle, credential, and secret-free audit decisions are resolved and must not
  be re-escalated: no self-deactivation, no last-active-owner deactivation, deactivation targets the
  principal and invalidates credentials and sessions, explicit separate reactivation, no hard delete
  in v1, system-generated staff PINs revealed once, in-app owner credential reset, no email reset
  flow, and the seven-action secret-free audit set with reason required only for destructive
  actions.
- `/staff` stays monitoring-only (ADR-008). No product surface issues a command.
- Public schema v2 stays capacity-free.

## Ordering, and why it is forced rather than chosen

The Phase 11 authority packet fixes the intra-phase order: **shell, then audit, then access**, each
rebased on the previous integration, because all three contend for `/admin`, router aggregation, and
the generalized audit resources. Access additionally requires a coordinator-owned,
independently reviewed, backward-compatible audit migration, since the current command-only
`audit_action` enum cannot represent the seven approved access actions.

Execution sequence, one writer at a time:

1. **`phase10-csv-transport`** — b03 resumed and in flight.
2. **`phase-12`** — resume the paused b01; wholly disjoint from every web/API surface, so it carries
   no lease contention with the Owner lane.
3. **`phase11-shell` b02** — reuse preserved candidate `0b015ee`; new attempt record, counter `0/2`.
4. **`phase11-audit` b01** — rebased on integrated shell, against the existing packet.
5. **Coordinator audit contract/migration** — backward-compatible extension for the seven access
   actions; independently reviewed before any access work.
6. **`phase11-access` b01** — rebased on integrated audit and that migration.
7. **`phase11-settings`** and **`phase11-health`** — need plans authored and reviewed first; no
   preserved authority packet exists for either.
8. **`phase10-ui-csv`** — consumes accepted domain, Paper composition, and CSV transport; must infer
   none of them.
9. **`login-paper-adoption` b03** — reuse preserved candidate `9b65356` with the locator repair.
10. Aggregates **`phase-10`** and **`phase-11`**, then the final full-ladder closure on `main`.

Items 3-9 all touch `/admin` or `apps/web`, so none of them may run concurrently with another.

## Gate discipline, unchanged

Every slice: focused unit/type/lint in its worktree, disposable-Postgres integration with a
run-unique database, the UI polish loop in Arabic RTL and English LTR across the required widths for
UI slices, a fresh verifier that did not implement the candidate, then coordinator integration and
`verify:full` at the batch boundary. Two focused repairs maximum; the third recurrence is
`FAILED_VALIDATION`. Canonical baseline updates and material visual changes remain human-approved.

## Scoping fact for `phase10-ui-csv`, recorded before it activates

`phase10-domain` delivered the reporting domain and its repository, but only the CSV leaf was ever
exposed. After the CSV transport merge, `packages/api/src/routers/index.ts` exposes exactly
`admin.analytics.{csv, daily, timeContext}`, while `apps/server/src/reporting-repository.ts` already
implements `readRange`, `readHeatmap`, and `readWeekOverWeek` with no procedure in front of them.

So `phase10-ui-csv` is not a UI-only slice. It must also add the owner-only `range`, `heatmap`, and
`weekOverWeek` procedures with their context and server wiring, consuming the frozen
`heatmapOutputSchema`, `reportingRangeOutputSchema`, and `weekComparisonOutputSchema` in
`packages/api/src/analytics/reporting/contracts.ts`. It must not redefine or infer any of those
contracts. That places it back on the shared `context.ts` / `routers/index.ts` / `index.ts` lane, so
it needs the same coordinator lease the CSV transport slice held and cannot overlap any Phase 11
slice.

## Known risks

- The audit migration in step 5 is the only new schema work in the remaining frontier. It is
  coordinator-owned, serialized, and must be additive; existing rows and Phase 5 atomic-write proof
  stay untouched.
- `phase11-settings` and `phase11-health` are the only genuinely unplanned slices left and carry the
  most estimation uncertainty.
- Canonical screenshots are platform-specific (`win32`/`chromium`). New baselines are acceptance
  evidence and require the serialized human-approved pass, not an incidental regeneration.
