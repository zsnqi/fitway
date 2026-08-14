# Coordinator handover and frontier baseline

- Status: coordinator role transferred to a Claude Code session; `main` re-baselined green.
- Coordinator worktree: `D:/Projects/fitway-worktrees/phase5-staff-integration` on `main`.
- Baseline commit at handover: `96ba85f1ac26e7c9ee6946944eefdf1c7e8cd7ce`
  (`docs(coordination): re-anchor phase 8 aggregate commit`).
- Prior coordinator: main Codex session. No ledger content authored by that session is rewritten;
  this record is additive.

## Frontier recovered from repository authority

Read in order: `AGENTS.md`, `CLAUDE.md`, `FITWAY_PRODUCT.md`/`SPEC.md` index, `PHASES.md`,
`PROJECT_STATE.yaml`, `docs/WORKFLOW.md`, and the two live in-flight handoffs. Conversation history
was not used as a state source.

Closed (`DONE`): phases 1-3, baseline-reconciliation-gate, `phase4-*`/`phase-4`,
`phase5-*`/`phase-5`, `phase-6`, `phase7-reset-evaluator`/`phase7-integration-b02`/`phase-7`,
`phase8-alert-evaluator`/`phase8-integration`/`phase-8`, `phase9-*`/`phase-9`, `phase10-domain`,
`phase10-paper-reporting`.

Outstanding:

| Milestone | Ledger status | Real condition |
| --- | --- | --- |
| `phase10-csv-transport` | `BLOCKED` | Tooling blocker only; see below |
| `phase10-ui-csv` | `PLANNED` | Waits on csv-transport |
| `phase-10` | `PLANNED` | Aggregate |
| `phase-12` | `IN_PROGRESS` | Paused before stage 1; pause condition released |
| `phase11-shell`/`audit`/`access`/`settings`/`health` | `PLANNED` | Dependencies all `DONE` |
| `phase-11` | `PLANNED` | Aggregate |
| `login-paper-adoption` | `PLANNED` | Paper adoption for `/login` |

Terminal history preserved unchanged: `phase7-integration` b01 `FAILED_VALIDATION`, and the
`phase10-csv-transport` b02 rejection. Neither is reopened.

## Two in-flight items reclassified

1. **`phase10-csv-transport` b03 blocker is tool capacity, not product or upstream.** The recorded
   unblock condition in
   `docs/phase-records/handoffs/phase10-csv-transport/20260813-151812-p10_csv_transport_b03-worker-capacity-blocked.md`
   is verbatim "a session with lawful write access to the isolated worktree, or approval capacity
   restoration". This coordinator session has ordinary write access to
   `D:/Projects/fitway-worktrees/phase10-csv-transport-b03`, so the stated condition is met without
   waiting for `2026-08-20T11:21:00+03:00`. The reviewed b03 plan and its ratified timeout amendment
   remain binding and unamended; the eight-path dirty TDD provenance in that worktree is preserved.
2. **`phase-12` b01 was paused, not blocked.** Its pause condition in
   `docs/phase-records/handoffs/phase-12/20260813-202356-p12_edge_b01-worker-pause.md` was
   coordinator scheduling while Phase 7 b02 was authored. Phase 7 and Phase 8 are now `DONE`, so the
   scheduling pause is released. Its shared lease is valid through `2026-08-20T20:08:41+03:00`.

## Baseline verification at `96ba85f`

```
pnpm verify:fast      -> PASS
pnpm test:integration -> PASS   (run coord_baseline_c01)
pnpm test:browser     -> PASS   (run coord_browser_c01)
```

- Repository invariants, Biome, types: pass.
- Unit/component: `48` files, `282` tests passed.
- Python simulator: `18` tests, `OK`.
- Repository mutation guard: "Verification fast passed without repository mutation."
- Disposable Postgres reachable: `127.0.0.1:55432` open (`fitway-phase2-postgres`).
- Integration: `12` files, `55` tests passed against disposable database
  `fitway_integration_coord_baseline_c01` with the matching reset marker. No other database was
  targeted.
- Browser: `57` passed in `33.1s`, chromium, covering public baseline, Phase 4 staff web, Phase 9
  owner UI, and the Staff Paper fidelity review across the required widths in both locales.

This is the trustworthy base every remaining slice integrates onto. The integrated frontier is
therefore green on all three ladders before any new work lands, so a later red is attributable to
the slice that introduced it.

## Environment provisioning required by every root-run verification

This is operational, not a source defect, and consumes no repair budget. Two independent facts:

1. `packages/env` calls `dotenv/config`, which reads `.env` from `process.cwd()`. The verification
   ladder runs from the repository root, so `apps/server/.env` alone is invisible to it. A
   machine-local gitignored root `.env` was provisioned in this worktree with the same test-only
   local values.
2. `apps/server/src/cron.test.ts` deliberately reads `process.env.CRON_SECRET` at module scope and
   refuses to invent one, so `.env` alone is insufficient. Root-run verification must export
   `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` into the process before invoking the
   ladder. Recorded here so no later session misreads it as a Phase 8 regression.

No synthetic value reaches a tracked file, a commit, or an artifact.

## Execution order for the remaining frontier

Dependency-lawful and one writer at a time:

1. `phase10-csv-transport` (resume b03 under the ratified plan + amendment).
2. `phase-12` (resume b01 stages 1-3).
3. `phase11-shell`, then `phase11-audit`, `phase11-access`, `phase11-health`, `phase11-settings`.
4. `phase10-ui-csv`, then aggregate `phase-10`.
5. `login-paper-adoption`.
6. Aggregate `phase-11`, then the final full-ladder closure on `main`.

Each slice keeps its own bounded scope, focused ladder, fresh independent verification that did not
implement the candidate, and coordinator integration. No push, no deploy, no external provisioning.

## Stop conditions unchanged

`NEEDS_HUMAN` on a Product/Spec conflict, privacy/security ambiguity, material visual change,
unleased shared-file requirement, or a missing product decision. `FAILED_VALIDATION` on the third
recurrence of a gate failure. Canonical screenshot baselines and locked visual decisions still
require human approval.
