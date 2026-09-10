# Owner audit closure r03 — coordinator record

- Date: 2026-09-09
- Branch/worktree: `codex/owner-demo-prep` / `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`
- Base: committed `bfa4a0b869c1667210ff7eb0d746228229ea0302` with the preserved uncommitted Owner candidate
- Status: `NEEDS_HUMAN` — automated gates and live rehearsal PASS; explicit Owner baseline approval required before independent review can close
- Authorization: on 2026-09-09 the human owner explicitly authorized `owner-audit-closure-r03` to fix the remaining review-harness issue and continue through final review, live rehearsal, commit, and completion.

## Changed successor hypothesis

`owner-audit-closure-r02` is immutable and remains `FAILED_VALIDATION`. Its formal phase run passed repository invariants, Biome, Owner token fidelity, types, 633/633 unit/component assertions, 120/120 simulator assertions, 106/106 Owner browser assertions, and mutation guard. Its final full run passed both builds, 133/133 disposable-database integration assertions, 173/173 applicable browser/accessibility assertions, three expected demo-environment skips, and mutation guard. Both disposable PostgreSQL containers and databases were removed.

The terminal failure was solely in the deterministic review harness after 38/41 named Owner scenarios passed. `shell/back-forward` began with only one in-app history entry, changed sections through the production `replace: true` contract, and then called browser Back; the browser correctly returned to its initial blank document, so the harness could not find `.owner-shell`. Product navigation did not fail.

This successor will establish a genuine prior `/admin` history entry, assert the expected selected section after both Back and Forward, and leave production navigation semantics unchanged. Before any formal gate, it will run only `shell/back-forward`, `shell/rapid-retarget`, and `shell/locale-round-trip`. A green preflight will be followed by the required phase/full disposable-database ladder, continuous live Owner rehearsal, frozen Public/Staff/backend/Paper proof, fresh independent review, owned commit, and final acceptance.

## Scope and protections

The coordinator is the sole writer. The one review-harness scenario, preserved Owner candidate, Owner-specific deterministic tests and evidence, registered verification profile, this handoff, and `PROJECT_STATE.yaml` are in scope. Public, Staff, backend/data contracts, schemas, migrations, auth/authorization semantics, analytics and CSV semantics, Paper, production data, accumulated demo history, credentials, canonical bytes, and the pre-existing untracked user inspection artifacts remain frozen. No reset, reseed, direct SQL against the demo, credential bypass, or history rewrite is permitted.

## Acceptance ladder

1. Confirm the frozen-lockfile toolchain and repair only `shell/back-forward` in the harness.
2. Pass `shell/back-forward`, `shell/rapid-retarget`, and `shell/locale-round-trip` on isolated ports without repository mutation.
3. Pass `verify:phase --phase owner-audit-closure` under a fresh run ID.
4. Pass `verify:full` with unique browser resources and an exact run-owned disposable PostgreSQL database.
5. Complete the continuous live Owner rehearsal and prove frozen Public/Staff/backend/Paper bytes.
6. Obtain fresh independent review of scope, contract, behavior, accessibility, and rendered evidence.
7. Commit only the owned candidate, finalize this record and the ledger, release leases, and mark `DONE` only when every required gate is green.

## Tested-state identity

The opening state is base commit `bfa4a0b` plus the preserved r02 candidate and terminal records. The workspace dependency gate reports `vitest/4.1.10` on Node `v24.14.0` when the verified workspace bin is prepended to the Windows process path. Pre-existing untracked user artifacts remain excluded. Commands, unique run IDs, artifacts, commit identity, findings, and terminal evidence will be appended as the ladder completes.

## Shell history repair and preflight

The only code change from the terminal r02 candidate is in `tests/browser/owner-presentation.review.spec.ts`. The `shell/back-forward` scenario now performs a real document navigation from its initial `/admin?section=daily` entry to `/admin?section=history`, selects Settings through the unchanged product tab contract, and explicitly verifies Settings before history traversal, Daily after Back, and Settings after Forward. This establishes two genuine in-app history entries and tests the intended `replace: true` section behavior without touching production navigation.

Three mutation-guarded isolated runs passed:

- `owner_audit_shell_bf_r03_01`, port 6970: `shell/back-forward` PASS 1/1.
- `owner_audit_shell_retarget_r03_01`, port 6971: `shell/rapid-retarget` PASS 1/1.
- `owner_audit_shell_locale_r03_01`, port 6972: `shell/locale-round-trip` PASS 1/1.

Each run used one Chromium worker, wrote only ignored run-scoped evidence, and reported an unchanged repository fingerprint. The changed successor hypothesis is confirmed; formal run `owner_audit_phase_r03_01` now begins.

## Formal phase outcome

Run `owner_audit_phase_r03_01` used the complete synthetic, non-routable unit environment and isolated browser port 6973. It passed repository invariants, repository-wide Biome, Owner token fidelity, all type checks, 633/633 unit/component assertions, 120/120 simulator assertions, the complete registered Owner profile at 106/106 browser assertions, and the repository mutation guard. The full disposable-database gate is next; no validation-repair attempt has been consumed.

## Full verification outcome

Run `owner_audit_full_r03_01` used disposable PostgreSQL container `fitway-owner-audit-full-r03-01-pg`, loopback port 55435, exact database `fitway_integration_owner_audit_full_r03_01`, a distinct non-routable application database URL, the exact destructive marker, and isolated browser port 6974. It passed repository invariants, Biome, Owner token fidelity, all types, 633/633 unit/component assertions, 120/120 simulator assertions, both production builds, 133/133 disposable-database integration assertions, and all 173 applicable browser/accessibility assertions. Three live-demo credential tests were correctly skipped outside the demo environment. The repository mutation guard passed.

The exact disposable container and database were stopped and removed after the green run; they are intentionally unrecoverable test resources and no longer exist. The live demo database was never targeted. No validation-repair attempt has been consumed. The complete named-scenario rehearsal now follows on the unchanged candidate.

## Complete named-scenario rehearsal

All 41 deterministic Owner presentation scenarios passed sequentially against the unchanged candidate with one Chromium worker, unique run IDs `owner_audit_all_r03_01` through `owner_audit_all_r03_41`, Arabic desktop viewport 1440x900, isolated port 6975, run-scoped ignored evidence, and a mutation guard after every scenario. This includes the repaired `shell/back-forward` scenario at position 39, `shell/rapid-retarget` at position 40, and `shell/locale-round-trip` at position 41. The repository fingerprint remained unchanged throughout the batch.

## Continuous live Owner rehearsal

The existing local demo was started with `pnpm demo:start` without reset or reseed. `pnpm demo:status` then proved the exact desktop-demo PostgreSQL contract at loopback port 55432 plus the owned server, web, simulator, server endpoint, and web endpoint all running and ready. The already-authenticated Owner session was used as-is; no credential was supplied, extracted, changed, bypassed, or requested.

The real populated Owner interface was inspected interactively without invoking any mutating button, submitting any form, logging out, or changing stored data:

- Arabic desktop 1440x900: Daily, Reports, Accounts & Sign-in, Activity Log, System Status, and Settings all rendered coherent headings, navigation state, populated data, controls, tables/cards, and locale-appropriate direction.
- English mobile 390x844: the same six sections reflowed into readable layouts with intact accessible names and selected-tab state. Daily metrics/chart, Reports range and export controls, Access status/actions, Activity filters and records, Health metrics/incidents, and Settings fields/hours all remained available without stale data being presented as live.
- Browser-history rehearsal: a genuine Daily entry was followed by a genuine Reports document navigation; selecting Settings exercised the unchanged product `replace: true` contract. Browser Back restored `http://localhost:3101/admin?section=daily` with Daily selected, and Forward restored `http://localhost:3101/admin?section=settings` with Settings selected.
- The temporary 390x844 viewport override was reset to 1440x900. The demo remains running for owner inspection. Its database and accumulated audit history were not reset, reseeded, queried directly, or rewritten.

## Frozen-surface proof

The candidate diff is confined to Owner implementation, Owner-specific tests/support/canonical screenshots, Owner verification and visual-authority records, the package script registration, this phase-record family, and the coordinator ledger. `git diff --name-only` shows no Public component, Staff component, server, package contract, schema, migration, OpenAPI, authentication/authorization, analytics/CSV transport, or Paper source change. The pre-existing untracked inspection PNGs and `plans/` directory remain outside the candidate and will not be staged. No validation-repair attempt has been consumed.

Fresh independent review of scope, product/security/privacy contracts, behavior, accessibility, rendered evidence, and validation evidence is now the only pending gate before the owned commit and terminal ledger update.

## Independent review authority stop

Fresh read-only review found a blocking provenance contradiction before integration. The preserved candidate changes nine Owner canonical screenshots: Daily English mobile; Activity Arabic desktop and English mobile; Health Arabic desktop and English mobile; and Settings English desktop clean/loading/error plus Arabic mobile. Seven routed authority hashes also changed. Those pixels were rendered, compared, classified as intentional, and passed the complete automated visual ladder, but the durable human-approval trail is invalid:

- r01 authorized inspected Owner-only visual reconciliation, but its terminal record explicitly says no canonical promotion occurred before that attempt stopped.
- r02 performed the nine promotions while its own Scope and protections explicitly froze canonical bytes; its terminal `FAILED_VALIDATION` handoff therefore cannot supply the missing human baseline authority.
- r03 was explicitly authorized to repair the remaining Back/Forward review harness and continue to completion, not to retroactively approve baseline updates.

`PHASES.md` requires explicit human approval for baseline screenshot updates. The coordinator cannot repair that gap by declaration. This attempt therefore stops as `NEEDS_HUMAN` with the visual authority gate pending, no commit, all leases released, and the technically green candidate preserved. The demo remains healthy and its history remains unchanged.

Unblock condition: the human explicitly accepts these nine inspected Owner-only canonical updates. The coordinator can then link that decision in the manifest and phase record, complete a fresh independent review, re-run the repository invariant check, commit only the owned candidate, and finalize the ledger. If the human does not accept them, the images and routed hash changes must be excluded and the candidate must return to visual repair/validation rather than weakening screenshot coverage.
