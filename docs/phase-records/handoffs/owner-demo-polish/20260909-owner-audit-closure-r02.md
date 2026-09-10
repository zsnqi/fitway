# Owner audit closure r02 — coordinator record

- Date: 2026-09-09
- Branch/worktree: `codex/owner-demo-prep` / `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`
- Base: committed `bfa4a0b869c1667210ff7eb0d746228229ea0302` with the preserved uncommitted r01 Owner candidate
- Status: `FAILED_VALIDATION` — terminal after the third validation failure; lease released
- Authorization: on 2026-09-09 the human owner explicitly authorized a fresh `owner-audit-closure-r02` successor through environment preflight, phase/full verification, live review, independent review, and final acceptance.

## Changed successor hypothesis

`owner-audit-closure-r01` is immutable and remains `FAILED_VALIDATION`. Both formal attempts passed repository invariants, repository-wide Biome, Owner token fidelity, and types; the first unit launch lacked three required server variables, while the second reached 631/633 assertions before isolated cron module reloads exposed the four remaining required server variables. No Owner implementation assertion failed.

This successor preserves the completed UI candidate and evidence. Before spending a formal attempt, it will restore the frozen-lockfile toolchain and run only `apps/server/src/cron.test.ts` plus `apps/server/src/reference-gating.test.ts` with a complete synthetic environment covering every key in `packages/env/src/server.ts`. Unit-only `DATABASE_URL` will be valid but non-routable. The later full gate will use a distinct application URL and an explicitly named, run-owned disposable Postgres database whose name and destructive marker exactly match `FITWAY_RUN_ID`.

## Scope and protections

The coordinator remains the sole writer. Owner components, Owner-specific deterministic browser/review tooling, the registered verification profile, this handoff, and `PROJECT_STATE.yaml` are in scope. Public, Staff, backend/data contracts, schemas, migrations, auth/authorization semantics, analytics and CSV semantics, Paper, production data, accumulated demo history, credentials, canonical bytes, and the 27 pre-existing untracked user inspection artifacts remain frozen. No reset, reseed, direct SQL against the demo, credential bypass, or history rewrite is permitted.

## Acceptance ladder

1. Restore `pnpm install --frozen-lockfile` and prove `pnpm exec vitest --version`.
2. Pass the two-file synthetic-environment preflight without repository mutation.
3. Pass `verify:phase --phase owner-audit-closure` under a fresh run ID.
4. Pass `verify:full` with unique browser resources and the exact disposable-database safety contract.
5. Complete continuous live Owner rehearsal and frozen Public/Staff/backend/Paper proof.
6. Obtain fresh independent review of scope, contract, behavior, accessibility, and rendered evidence.
7. Commit only the owned candidate, finalize this record and the ledger, release leases, and mark `DONE` only when every required gate is green.

## Tested-state identity

The opening tracked state is base commit `bfa4a0b` plus the preserved r01 candidate and its terminal records. Pre-existing untracked user artifacts remain excluded. Commands, run IDs, artifacts, commit identity, findings, and terminal evidence will be recorded here as the ladder completes.

## Environment preflight evidence

- `pnpm install --frozen-lockfile`: PASS with pnpm `11.9.0`; lockfile unchanged.
- `pnpm.cmd exec vitest --version`: PASS, `vitest/4.1.10`, Node `v24.14.0`. The PowerShell `pnpm.ps1 exec` shim does not prepend the workspace bin path, so commands use `pnpm.cmd`; this is a host-launch detail, not a repository change.
- Complete synthetic environment preflight: `pnpm.cmd exec vitest run apps/server/src/cron.test.ts apps/server/src/reference-gating.test.ts` — 2 files, 18/18 assertions PASS in 1.07 seconds.
- The unit-only `DATABASE_URL` targeted port 1 on loopback and could not reach any database. Every other required schema key was an explicit non-secret synthetic value.
- `git status --short` after the preflight exactly matched the preflight opening status; no tracked or untracked repository content changed.

The changed successor hypothesis is confirmed. Formal run `owner_audit_phase_r02_01` now begins with the same complete synthetic environment and isolated browser resources.

## Formal phase outcome 1 and focused repair 1

Run `owner_audit_phase_r02_01` passed repository invariants, repository-wide Biome, Owner token fidelity, all type checks, 633/633 unit/component assertions, and 120/120 simulator assertions. The complete synthetic environment therefore closes the terminal r01 setup failure. The Owner browser profile then finished 95/106 passing and 11 failing; the mutation guard reported no repository change.

The failures form two bounded groups. Five functional assertions still target implementation details replaced by the approved Owner foundations or a racy seam: three query native Activity `select` elements that no longer exist, one re-queries a transient loading node after the 450ms mock can resolve and casts the nullable result to `Node`, and one requires an inner chart `box-shadow` even though the approved focus ownership moved to the actual interactive chart boundary. Six visual assertions report small stable deltas in inspected changed Owner surfaces: three Settings states (785 pixels each), Health desktop Arabic (884), Daily mobile English (1,412), and Activity desktop Arabic (2,550). No Public or Staff assertion failed.

Focused repair 1 will update the stale assertions to test the new accessible primitives and semantic relationships, inspect every received/expected/diff visual artifact, and reconcile only those Owner canonical bytes whose rendered candidate is confirmed intentional, visibly stronger, and consistent with the approved plan. It will run the exact affected browser files in isolation before a second formal phase submission.

### Focused repair 1 evidence and visual acceptance

- The five functional checks now target shared OwnerSelect triggers, collect the actual Base UI option labels once per locale, measure every label inside the content box at all nine required widths, assert 12px logical padding plus a 22px icon lane, prove trigger tab order, assert the chart's actual two-pixel outline with no duplicate shadow, and compare stable reporting containers while separately proving each transient state's role and visibility.
- A fresh six-file browser run completed 56 non-canonical assertions PASS. Its only six failures were the already classified canonical deltas.
- Independent read-only inspection found Weekly Comparison's existing above-mobile horizontal-scroll fallback had lost keyboard reachability. Repair 1 preserves the approved non-scrolling semantic-row recomposition at 620px and below, restores a named tabbable region only where the real table can overflow above that breakpoint, and covers both branches across 320, 360, 390, 721, 768, 820, 1024, 1200, and 1440. The 1024px case proves real overflow, keyboard focus reached through an actual `Shift+Tab` / `Tab` sequence, and a visible two-pixel outline; the native table, `thead`, `tbody`, four scoped column headers, and three scoped row headers remain intact. Focused component tests passed 18/18. The finalized Phase 10 browser file passed 7/7 under run `owner_audit_reporting_r02_04` on verified-free port 6962. One earlier launch reached no test because its derived port was occupied; it is setup evidence only.
- The coordinator inspected same-viewport expected, received, and diff artifacts. Settings loading/error/clean and Health desktop differ only because the selected section's old saturated red focus rectangle is now the approved pale neutral boundary, visibly separating focus from error. Daily mobile records the approved logical-edge selected-tab alignment and exposes the next destinations without clipping. Activity desktop records the same neutral focus treatment plus deliberate explicit chevrons with consistent RTL clearance. Each after frame is clearer, internally consistent, and faithful to the approved closure plan.
- Exactly the initial six Owner-only files were promoted, then the affected-browser run exposed three additional deterministic mobile deltas. Health English and Settings Arabic record the approved logical-edge selected-tab reveal. Activity English records that same reveal, the shared select geometry, and the localized horizontal-scroll hint. A second fresh three-test render reproduced Health and Settings byte-for-byte and reproduced Activity content/layout after replacing its stale test-only centered-tab stabilizer with the production logical-edge calculation. Those three inspected actuals were promoted as well. No file was added or removed; the final 41-file baseline-tree SHA-256 is `4de951a4c76905ac5e6eb1e0d4b3e32ef0edd37c9c1fee56e43350b7355b95d4`. Public, Staff, Login, Reports, Access, and every other canonical byte remained untouched.
- The seven promoted files with honest Paper case mappings now carry their exact new routed SHA-256 values and this r02 approval record in `tests/browser/visual-authority-cases.mjs`; Settings loading/error remain regression-only entries in the unchanged 41-file inventory. The repository invariant will be rerun against the final tree before the affected browser suite resumes.
- The first attempted affected-browser rerun was blocked before process launch by the host account execution-approval limit and is not a test result. After capacity returned without consuming a reset, run `owner_audit_affected_r02_02` completed 59/62 with only the three newly inspected mobile canonical deltas above. These focused visual reconciliations remain inside repair 1 and consume neither the second formal phase attempt nor another validation-repair attempt.

## Formal phase outcome 2

Run `owner_audit_affected_r02_03` passed all six affected browser files, 62/62, on isolated port 6965. Formal run `owner_audit_phase_r02_02` then passed repository invariants, repository-wide Biome, Owner token fidelity, all type checks, 633/633 unit/component assertions, 120/120 simulator assertions, and the complete registered Owner profile at 106/106 browser assertions. Its repository mutation guard passed. Repair 1 is closed; no further repair budget was consumed. Browser, accessibility, and visual gates are PASS. The uniquely named disposable-Postgres full gate remains required before integration or `DONE`.

## Full outcome 1 and focused repair 2

Disposable PostgreSQL container `fitway-owner-audit-full-r02-01-pg` ran database `fitway_integration_owner_audit_full_r02_01` on loopback port 55433. The application `DATABASE_URL` remained a different, non-routable port-1 URL; `TEST_DATABASE_URL`, `FITWAY_RUN_ID`, and `FITWAY_INTEGRATION_RESET_DATABASE` matched the exact run-owned database contract. Full run `owner_audit_full_r02_01` passed repository invariants, Biome, Owner token fidelity, types, 633/633 unit/component assertions, 120/120 simulator assertions, both production builds, and all 133 disposable-database integration assertions.

The all-surface browser step completed 172/173 executed assertions with three environment-gated demo tests skipped. Its sole failure was `public-baseline.browser.spec.ts` stale/unavailable/closed coverage: the initial localhost `page.goto()` returned Windows Chromium `net::ERR_NO_BUFFER_SPACE` after 132 preceding browser assertions. No Public assertion ran or failed, later Public tests passed, no application error was reported, and the repository mutation guard found no change. This is classified as host socket/resource exhaustion, not a product failure. Focused repair 2 will prove that exact Public test on a fresh isolated port, retire the first disposable container, and submit one final full run with fresh run-owned database/browser resources after the host has drained. The repair budget is now exhausted; any recurrent full failure is terminal `FAILED_VALIDATION`.

Focused run `owner_audit_public_probe_r02_01` passed that exact bilingual Public stale/unavailable/closed test 1/1 on a fresh isolated port. The first disposable container and database were removed. Final run `owner_audit_full_r02_02` used a fresh container, loopback port 55434, exact database `fitway_integration_owner_audit_full_r02_02`, and browser port 6969. It passed repository invariants, Biome, Owner token fidelity, all types, 633/633 unit/component assertions, 120/120 simulator assertions, both production builds, 133/133 disposable-database integration assertions, and all 173 applicable browser/accessibility assertions; three demo-credential tests were correctly skipped outside the live-demo environment. The mutation guard passed. The second disposable container and database were then removed. Integration, browser, accessibility, and visual gates are PASS with no disposable resources left running.

## Terminal all-scenario review outcome

The mutation-guarded harness then ran every named scenario sequentially at Arabic desktop. Scenarios 1–38 passed individually without repository mutation: all Daily, Reports, Activity, Access, Health, and Settings states plus shell session-failure and deep-link. Scenario 39, `shell/back-forward`, timed out waiting for `.owner-shell`; scenarios 40–41 were not reached. Source inspection proves the deterministic harness defect: the scenario clicks Reports and Settings, while the production router intentionally uses `replace: true`, then calls `page.goBack()`. With no prior in-app history entry, Back returns to the initial blank page and the shell cannot exist. The registered phase/full shell tests already passed and product navigation semantics are not implicated.

This is the third validation failure after focused repairs 1 and 2, so r02 is terminal `FAILED_VALIDATION` under `docs/WORKFLOW.md`. No third repair is permitted. The lease is released, no commit is created, the successful phase/full evidence remains preserved, and all disposable resources are gone. A fresh successor requires explicit human authorization. Its changed hypothesis is narrow: make the review scenario establish a genuine second in-app history entry—or assert the intended replacement contract—before Back/Forward; preflight `shell/back-forward`, `shell/rapid-retarget`, and `shell/locale-round-trip`; then repeat the required final ladder without changing Owner product navigation.

## Append-only addendum — 2026-09-10 owner-surface-completion acceptance

The terminal r02 accounting above is unchanged. The human owner's 2026-09-10
authorization of the `owner-surface-completion-r01` pass supersedes the
`owner-audit-closure-r03` `NEEDS_HUMAN` Owner-baseline blocker for Owner
surfaces only. Under that authorization the coordinator inspected the
regenerated renders against the live product and accepted them; the human did
not perform a separate contact-sheet inspection. This addendum exists only to
record that decision for the canonicals this record remains the `approvalRecord`
for, and to link the full per-surface acceptance record:
`docs/phase-records/handoffs/owner-demo-polish/20260910-owner-surface-completion-visual-acceptance.md`.

- Owner Daily completed English mobile — `12cb19d50228aa4d80599fa282093b6b700b9dadf634b6149c7c9e0f65c3f4cd` → `b43131097456b32e92b61226eb91fde796a1ecd05989f82830cfd19fab0ae67d`.
- Activity Log populated Arabic desktop — `05a12a765caddb552d633af9ec815c3f9190b7140c890ce50c727c8d3bd7b9c9` → `c63e6675cdfdecdf8b3d504d7a2836a98908cb4c6765b8ad7a582e4db9c969eb`.
- Activity Log populated English mobile — `79f8df8b8dc0e5a3573102ce1f8ef73448ff822299ddc224a51176314be8a57b` → `472aa6a031c2f119a529d250675a023c2127d8eb3586fb8070050e1d1c21a69f`.
- System Status populated Arabic desktop — `de8fdeb2642f01766815afa329206e5e76f66de42e53e36ce3e258e9e04b99a2` → `943a5b72be3a0c5a8c16fb9737e1321f7215ec79e086596af09258238ab5b516`.
- System Status populated English mobile — `05f56c0b21da4e413b233cf6afe6aa3042ddf364cff460f00dcc3c9ae657e91a` → `5c12cadce982570c5c7de3fcbd90262a9e15378691dd141f3572d0bdd86c5e53`.
- Settings clean English desktop — `be471bbc43f62d2adf0a8730faa37a870a9edc8901384f4464276a74f7cb9a3a` → `072c119077d25815a2da8ad9b1525d4b497934e457b006c36bd80d4f88f325c1`.
- Settings dirty Arabic mobile — `ddf5498d86adfdb1c8dc05dc8b9e90a138e91e13af0455afe9cc781d4cf7c15d` → `7f908136796f2de9d163b6165c2fb32b3c0878afa5a68a42078cee953df3170d`.
- Regression-only Settings loading English desktop — regenerated from the r02 regression baseline to `ca7a6ab5cdafce43dfc780053bd3f9c9f1f55edb703129a72a8b31cf0fa2ffdf`.
- Regression-only Settings error English desktop — regenerated from the r02 regression baseline to `86e26f9a0f0ab97b62546437e78e674f73ab0a8ed0d745ca37e71666f9449e0e`.
