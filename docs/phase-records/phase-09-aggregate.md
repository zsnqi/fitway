# Phase 9 coordinator aggregate closure

- Status: `DONE`
- Aggregate evidence baseline: `ffa26ba186b8d196f9fa931fcc8d27a2acf71ee1` (`main`, clean;
  Wave 0 shared baseline with the `phase10-domain` profile registered)
- Full-gate evidence commit: `a7a7f64c099503fcf9a8dd84091061a4e577a03e`
- Closed by: coordinator, 2026-08-07T18:15:00+03:00, Wave 0 baseline-repair session
- Push/deploy: none

## Dependency and slice reconciliation

Both Phase 9 dependencies are `DONE` in `PROJECT_STATE.yaml` and their recorded integrated
commits are ancestors of the aggregate evidence baseline
(`git merge-base --is-ancestor` confirmed for both).

| Slice | Integrated commit | Required gates / independent evidence | Current reconciliation |
| --- | --- | --- | --- |
| `phase9-analytics-domain` | `7d29e1a5dd3c34197fb714d9619ac47f3c2d9201` | unit, disposable-Postgres integration, independent review; browser/accessibility/visual `NOT_REQUIRED` | PASS; the deterministic daily-analytics and history-generator domain remains integrated and unexposed |
| `phase9-owner-ui` | `c02b4df8f1fdca1c3e25c888ac2de444400a4e10` | unit, integration, browser, accessibility, visual, independent review | PASS; the owner-only shell, `admin.analytics.daily` transport, and occupancy curve remain integrated |

Slice evidence:

- `docs/phase-records/handoffs/phase9-analytics-domain/20260716-p9_analytics_b01-ready.md` —
  `pnpm verify:phase --phase phase9-analytics-domain` PASS, 19 unit files / 80 tests plus one
  disposable-Postgres integration test; fresh verifier verdict `PASS`.
- `docs/phase-records/handoffs/phase9-owner-ui/20260723-001226-p9_owner_b03_retry-independent-verification.md` —
  fresh independent verification of the retry candidate.
- `docs/phase-records/handoffs/phase9-owner-ui/20260727-195424-p9_owner_coord_integration.md` —
  coordinator integration, adjudication of three obsolete Phase 4 placeholder assertions, and the
  fresh full-gate run below. `validationRepairAttempts` remains `2`.

`docs/phase-records/phase-09-owner-ui.md` holds the frozen owner analytics transport and UI
contract; nothing in this closure amends it. No active Phase 9 lease, worker reservation,
worktree reservation, or assigned validation port remains in the ledger — both slices were
released to `branch: main`, `worktree: null`, `leaseExpiresAt: null` at their own closures.

## Aggregate acceptance and verification

The Phase 9 acceptance in `PHASES.md` is covered by the reconciled slice evidence and the
recorded aggregate regression: owner-only shell; today's occupancy curve; peak; observed-open-
minute daily average; estimated entrance crossings; coverage; the deterministic multi-day history
generator; `value | closed | missing` timeline buckets; `effectiveFrom` settings resolution;
chart/table parity; RTL/LTR time direction; keyboard/hover/tap parity; Western-digit gym-local
time; honest empty/missing/closed/zero states; and immutable historical results after later
settings changes.

Durable full-gate evidence, recorded in the coordinator integration handoff:

```text
run id:   batch03_coord_full_final01
database: fitway_integration_batch03_coord_full_final01   port: 20842
output:   D:/Projects/fitway/output/playwright/batch03_coord_full_final01
command:  pnpm verify:full
commit:   a7a7f64c099503fcf9a8dd84091061a4e577a03e (main, clean)
result:   PASS at 2026-07-27T19:53:50+03:00
```

Covered: repository invariants, Biome, workspace types, 36 unit files / 140 tests, five simulator
tests, production builds, seven integration files / 26 tests, all 29 Chromium
functional/accessibility/responsive/visual tests, and the repository mutation guard.

### Why this closure does not rerun `verify:full`

Stated explicitly because `docs/phase-records/phase-04-aggregate.md` did run a fresh full ladder
at its aggregate closure.

`a7a7f64` is the commit at which all Phase 9 work was integrated and the full ladder passed. Every
commit between `a7a7f64` and this closure is documentation, coordinator ledger state, or the
`scripts/verify.mjs` profile table:

- `680cccc` — Phase 5 staff UI retry activation: `PROJECT_STATE.yaml` and phase records.
- `ec35298`, `716ac10`, `6e1735f`, `739f57c` — Wave 0 shared baseline: ADR-007, the approval
  manifest `paperAuthority` block, `AGENTS.md`, `CLAUDE.md`, `DESIGN_GUIDE.md`, `README.md`,
  `docs/WORKFLOW.md`, archived and migrated records.
- `ef96dab` — the `phase5-staff-ui` lease renewal in `PROJECT_STATE.yaml`.
- `ffa26ba` — the `phase10-domain` entry in the `scripts/verify.mjs` profile table, which
  `verify:fast` and `verify:full` never read.

No product source file, test, Zod or OpenAPI contract, migration, i18n catalog, build input, or
canonical screenshot changed in that range, so no `verify:full` gate can have been affected. The
one gate those commits *can* affect — `check:repository`, which hashes the approval manifest and
validates the ledger — was rerun and passes, together with the whole `verify:fast` ladder, on the
Wave 0 head. Those results are recorded in `docs/phase-records/wave-0-baseline.md`.

If the coordinator or human approver holds the Phase 4 precedent to be binding policy rather than
that closure's own circumstance, a fresh `pnpm verify:full` on the Wave 0 head is the single
outstanding item; it would not change any recorded gate value below.

## Closure

`phase-9` alone is marked `DONE`. Its `integratedCommit` and `baseCommit` are
`439b1b3ea58a545448164c091d7981ff2e4dbf94`, the coordinator commit that closes the aggregate —
the commit this record was created in. They were written as the pre-closure head
`ffa26ba186b8d196f9fa931fcc8d27a2acf71ee1` in that commit, because the closure commit cannot
reference its own hash, and re-anchored by the next coordinator commit. The "Aggregate evidence
baseline" above deliberately still names `ffa26ba`: it is the clean, verified head the closure was
adjudicated against, which is a different fact from where the aggregate became `DONE`. Recording
both is the correction to the ambiguity that left the `phase-4` equivalent open —
`docs/phase-records/phase-04-aggregate.md` names only `1ba23df` while the ledger says `94b76a8`.

This follows the settled `phase-4` convention in `PROJECT_STATE.yaml`
(`phase-4.integratedCommit` = `94b76a8`, the Phase 4 aggregate closure commit, re-anchored from
the pre-closure head by the next coordinator commit `e5cb13b`). The two candidate hashes raised in
the dependency and parallelization audit — `c02b4df` and `a7a7f64` — are both excluded by that
convention: `c02b4df` is the `phase9-owner-ui` *slice* integration commit, and `phase-4`
demonstrably did not inherit its last slice's integration commit `b67398a8`.

No successor was activated, no branch or worktree was created, and no Product, Spec, privacy,
security, or visual contract changed. `phase10-domain` and `phase11-shell` become
dependency-eligible; neither is activated here. `phase11-shell` additionally remains held by the
unresolved ADR-007 Paper-family coverage question recorded in
`docs/phase-records/dependency-parallelization-audit.md` §16.1.
