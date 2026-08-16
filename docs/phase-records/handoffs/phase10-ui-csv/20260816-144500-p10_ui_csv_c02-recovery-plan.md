# Phase 10 owner reporting UI and CSV — interrupted-work recovery plan

- Mode: `plan`. No production implementation is changed by this record.
- Coordinator baseline: clean `main` at `7b24529ba761342f4c7fc19c79678e39c711c94a`.
- Interrupted source: `work/phase10-ui-csv-b01` in
  `D:/Projects/fitway-worktrees/phase10-ui-csv-b01`, committed through `7fc0e1d` plus four valid
  dirty paths identified below.
- Active repair budget: `0/2`. Recovery of an interrupted stage is not a failed-gate repair.
- Concurrent writer count: `0`. The audit-generalization worktree remains preserved and frozen
  while this slice writes.

## Objective

Finish the already-started `phase10-ui-csv` slice without discarding or re-deriving valid work:
owner-only range, heatmap, week-over-week, and cancellable CSV controls are integrated into
`/admin`; closed, missing, and genuine zero remain distinct; both locales and required responsive,
keyboard, accessibility, semantic-table, and export states pass; the rendered surface is compared
to Paper area `17YY-0`; a fresh verifier returns PASS; and the coordinator can integrate the slice
and close the Phase 10 aggregate.

## Locked authority and correction

- The activation at `20260815-184500-p10_ui_csv_b01-coordinator-activation.md`, Product, Spec,
  Design Guide, ADR-007, frozen reporting DTO/CSV contracts, and the Paper reporting completion
  record remain binding.
- The activation's statement that Paper was unreachable is stale. The later coordinator record
  `20260815-221500-frontier-recovery-and-remaining-plan.md` proves the FITWAY Paper file is running
  and reachable at the local Paper MCP endpoint. Paper fidelity is therefore an achievable gate,
  not a blocker and not optional.
- No Product, privacy, security, content, or visual decision is reopened by this recovery.

## Preserved interrupted work

Committed stages to carry forward unchanged unless a stated gate proves a defect:

1. `0212869` — owner reporting query leaves and wiring.
2. `eb0baf1` — owner reporting hook and bilingual copy.
3. `7fc0e1d` — heatmap, comparison, and export UI.

Dirty work to checkpoint exactly before any continuation:

- `apps/web/src/components/owner/reporting/owner-reporting-view.tsx`
- `apps/web/src/components/owner/reporting/owner-reporting-view.test.tsx`
- `apps/web/src/hooks/use-owner-reporting.test.tsx`
- `apps/server/src/phase10-ui-csv.integration.test.ts`

The tracked edits correct ratio display (`0.088` -> `8.8%`); the new integration file is a
substantial real oRPC/auth test suite. `git diff --check` is clean. The checkpoint is preservation
evidence, not READY_FOR_INTEGRATION evidence.

## Stages and rollback boundaries

### Stage 1 — checkpoint interrupted work

- Writer: coordinator, mechanical Git checkpoint only; no source edits.
- Scope: the four dirty paths above on `work/phase10-ui-csv-b01`.
- End state: one clearly labelled interrupted-work checkpoint commit; worktree clean; no claim that
  tests or acceptance gates pass.
- Rollback: revert or omit that one checkpoint commit, leaving the three prior Phase 10 commits
  unchanged.

### Stage 2 — reconstruct the candidate on current main

- Writer: coordinator, mechanical Git integration only.
- Scope: create `codex/phase10-ui-csv-recovery` from the current clean `main`, then apply the four
  Phase 10 commits in order. Resolve only proven textual integration conflicts; any semantic or
  scope conflict stops the stage.
- End state: recovery branch contains current `main` plus the exact preserved Phase 10 work and is
  clean.
- Rollback: delete the recovery branch after switching back to `main`; both source worktrees remain
  preserved.

### Stage 3 — complete Phase 10 UI/browser/polish/handoff

- Writer routing: `gpt-5.6-terra / high`, explicit at spawn. Terra is required because the stage
  crosses UI, real API integration, browser semantics, accessibility, and `/admin` regression
  boundaries; Sol is not justified because product/data contracts and composition are already
  settled.
- Owned implementation scope: only the activation's owned paths and still-valid wiring lease.
  Shared message catalogs, frozen reporting/CSV contracts, database, migrations, other owner
  sections, global tokens, repository configuration, and canonical screenshots outside this
  slice remain forbidden.
- Required completion: add the missing Phase 10 browser spec and owned screenshot evidence; finish
  loading/live/insufficient-history/closed/missing/zero/export/cancel/error coverage; ensure every
  visualization has semantic parity; both Arabic RTL and English LTR; required responsive widths,
  keyboard order, focus, reduced motion, screen-reader naming, zoom/reflow, and no page overflow;
  write a worker candidate handoff.
- Rollback: one candidate commit on the recovery branch, independently revertible from the
  preserved checkpoint.

Self-verification, with a fresh disposable `FITWAY_RUN_ID` and exact disposable database:

1. `pnpm exec biome check` over the owned Phase 10 paths.
2. `pnpm exec vitest run packages/api/src/analytics/reporting/queries.test.ts apps/web/src/hooks/use-owner-reporting.test.tsx apps/web/src/components/owner/reporting/owner-reporting-view.test.tsx`.
3. `pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase10-ui-csv.integration.test.ts`.
4. `pnpm check-types`.
5. Playwright for `phase10-ui-csv.browser.spec.ts` plus the four sibling `/admin` specs encoded in
   the phase profile.
6. `pnpm verify:phase --phase phase10-ui-csv`.
7. `pnpm verify:fast` with `FITWAY_PHASE` unset.
8. `git diff --check` and clean tracked status after the candidate commit.

### Stage 4 — Paper fidelity check

- Read-only rendered comparison against Paper file `01KYPX5AF950XZVVDD88B6J7QB`, area `17YY-0`,
  using the approved Paper composition and the repository's behavior/copy authority split.
- A mismatch that would require a material composition change is `NEEDS_HUMAN`; a bounded fidelity
  correction stays inside the Phase 10 repair budget and returns to Stage 3.
- Canonical screenshot updates require the serialized human-approved baseline pass; they are never
  regenerated merely to hide a diff.

### Stage 5 — independent verification and coordinator integration

- Fresh verifier routing starts at `gpt-5.6-terra / high` for ordinary cross-surface review. If a
  contract, authorization, privacy, transaction, or migration ambiguity appears, stop and re-route
  that bounded review at `gpt-5.6-sol / xhigh`; do not let the verifier repair.
- Verifier checks full diff/scope, frozen-contract conformance, server authorization and privacy,
  unit/integration/profile gates, both locales, browser/a11y/responsive behavior, sibling `/admin`
  regressions, and Paper evidence; returns PASS or findings only.
- After PASS, coordinator integrates to `main`, runs `pnpm verify:full` with fresh disposable
  resources, confirms the mutation guard and clean tree, updates the phase record/ledger, and closes
  `phase10-ui-csv` plus the `phase-10` aggregate if all aggregate gates remain green.
- Rollback: revert the single integration merge before any dependent Phase 11 Slice B work starts.

## Stop conditions

Stop and record `NEEDS_HUMAN` or the applicable durable state on any frozen-contract change,
privacy/security ambiguity, required migration/index, Product/Spec conflict, material Paper change,
canonical sibling baseline movement, expired shared lease, or work outside the owned paths. The
same failed gate receives at most two focused repairs; a third recurrence is
`FAILED_VALIDATION`.
