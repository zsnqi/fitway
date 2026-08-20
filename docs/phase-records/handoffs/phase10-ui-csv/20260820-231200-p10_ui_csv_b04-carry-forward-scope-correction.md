# Phase 10 UI/CSV b04 — inherited carry-forward scope correction

- Recorded: 2026-08-20 23:12 +03:00.
- Status: activation correction before any b03 replay or b04 implementation.
- Branch/worktree remain clean at activation `b3274f0`; no out-of-scope file has been written.

## Finding

The S2 execution plan requires the valid b03 candidate to be carried forward non-destructively before the fidelity repair. Read-only Git mapping established that the inherited candidate contains four files outside the repair ownership and existing wiring lease:

- `packages/api/src/analytics/reporting/queries.ts`
- `packages/api/src/analytics/reporting/queries.test.ts`
- `packages/api/src/analytics/reporting/query-range.ts`
- `apps/server/src/phase10-ui-csv.integration.test.ts`

The activation's blanket outside-scope prohibition therefore contradicted its required carry-forward gate. This is a coordinator activation defect, not a new product decision and not permission to edit those files during the fidelity repair.

## Correction

- Grant one coordinator-owned, one-time carry-forward lease for the four exact files above.
- Carry them only as the byte/patch result of the selected immutable b03 implementation commits.
- After the carry-forward commit they are frozen; b04 repair ownership remains limited to the reporting components, hook/tests, browser spec, and existing wiring-only lease recorded in the ledger.
- Frozen reporting contracts, reporting repository, database surfaces, shared catalogs/tokens, canonical screenshots, verification configuration, Paper, and every other forbidden path remain unchanged.

## Reviewed replay boundary

- Complete commits: `b8a2678`, `bd9ecf6`, `a5ab831`, `7152efa`.
- Browser file only from mixed coordinator commits: `tests/browser/phase10-ui-csv.browser.spec.ts` at `786d6e3`, then `a012e8a`.
- Do not merge or replay stale `PROJECT_STATE.yaml`, coordinator handoffs, activation/failure records, or the Paper decision-gate commits from b03.
- `codex/phase10-ui-csv-b03` remains immutable at `4c253dee003722f1e9c8805be95a162193345abe`.

## Gate

Fast-forward b04 to this coordinator correction, perform the selected no-commit replay, confirm the staged diff contains only the explicit inherited/owned/leased paths and no S1 audit/migration deletion, then create one carry-forward commit before planning the fidelity repair.
