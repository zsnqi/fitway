# Phase 11 Owner Settings — GLM execution plan

Status: candidate for independent plan review. This document is implementation instructions only; it does not activate a worker or authorize product-code changes in the current session.

## 1. Goal

Deliver the complete migration-free Phase 11 Owner Settings vertical slice in the existing authenticated `/admin` Owner surface:

- owner-only read and atomic append-only update API;
- five editable product axes and five visible but locked operational values;
- immediate current public/operational band recomputation from the unchanged current count and newly current-effective settings;
- the accepted bilingual, responsive, accessible Paper form inside the existing Owner shell;
- focused unit, real-Postgres integration, browser, sibling-regression, accessibility, RTL/LTR, and visual evidence.

The terminal result sought from the implementation worker is a committed candidate on an isolated branch, ready for independent coordinator review. The worker must not integrate, merge, declare `DONE`, edit `PROJECT_STATE.yaml`, or mutate Paper.

## 2. Current relevant state

- Normative product/specification authority: `FITWAY_PRODUCT.md`, `SPEC.md`, `PHASES.md`, `DESIGN_GUIDE.md`, and repository `AGENTS.md`.
- Accepted implementation specification: `docs/phase-records/handoffs/phase11-settings/20260830-193900-p11_settings_spec_r01-spec.md`.
- Specification acceptance: `docs/phase-records/handoffs/phase11-settings/20260830-200700-p11_settings_spec_r01-done.md`.
- Accepted visual authority: Paper file `01KYPX5AF950XZVVDD88B6J7QB`, fresh area `1FKS-0`, token hash `3b0faca3`, four frames at English/Arabic desktop `1440` and mobile `390`.
- The failed predecessor `phase11-settings-paper-successor`, its `2/2` budget, its records, and Paper area `1EO5-0` are immutable history.
- `phase11-settings-spec` is `DONE`; `phase11-settings` is not activated by this plan.
- Existing schema already contains append-only `settings_versions` and generalized `settings_updated` audit support. No migration or schema edit is needed.
- Existing public and operational payloads share `packages/api/src/public/payload-builder.ts`; it currently emits persisted `current.band`, which is the one authorized existing behavior change.
- Existing `/admin` daily branch owns the page `h1`, shell, fixed-LTR rail, responsive content insets, prerequisite/loading region, and sibling Analytics, Audit, Health, and Access sections.
- Durable qualified GLM route: `opencode-go/glm-5.3-flash`. Use one isolated writer. Native coordinator review remains mandatory.

At activation, the coordinator must give GLM the exact accepted plan commit SHA and create an isolated branch/worktree from that SHA. The worker must verify `git rev-parse HEAD` and clean `git status --short` before editing. Do not infer or reuse an older worktree.

## 3. Bounded scope and ownership

### Worker-owned paths

Create or change only these non-shared paths:

- `packages/api/src/settings/contracts.ts`
- `packages/api/src/settings/contracts.test.ts`
- `packages/api/src/settings/procedures.ts`
- `packages/api/src/settings/procedures.test.ts`
- `packages/api/src/public/payload-builder.ts` (existing)
- `packages/api/src/public/payload-builder.test.ts` (existing)
- `apps/server/src/settings-repository.ts`
- `apps/server/src/settings-repository.test.ts`
- `apps/server/src/settings-service.ts`
- `apps/server/src/settings-service.test.ts`
- `apps/server/src/phase11-settings.integration.test.ts`
- `apps/web/src/hooks/use-owner-settings.ts`
- `apps/web/src/hooks/use-owner-settings.test.tsx`
- `apps/web/src/components/owner/settings/messages.ts`
- `apps/web/src/components/owner/settings/use-owner-settings-messages.ts`
- `apps/web/src/components/owner/settings/owner-settings-section.tsx`
- `apps/web/src/components/owner/settings/owner-settings-view.tsx`
- `apps/web/src/components/owner/settings/owner-settings-view.test.tsx`
- `apps/web/src/components/owner/settings/owner-settings.css`
- `tests/browser/phase11-settings.browser.spec.ts`

The worker may add another file under `apps/web/src/components/owner/settings/` only when it keeps the same component boundary and tests; it may not move the section into shared Owner-shell files.

### Shared paths requiring serialized coordinator leases

Before the first edit, the coordinator must grant active leases for all five paths. GLM may edit them only while those leases are current:

- `packages/api/src/context.ts`
- `packages/api/src/routers/index.ts`
- `apps/server/src/index.ts`
- `apps/web/src/routes/admin.tsx`
- `scripts/verify.mjs`

No other shared file is leased. If an additional file appears necessary, stop `NEEDS_HUMAN`; do not widen ownership.

## 4. Locked decisions and constraints

### Domain and API

- Public leaves are exactly `admin.settings.read` and `admin.settings.update`, both guarded by `ownerProcedure`.
- Missing/expired authentication remains `401`; authenticated staff remains `403`.
- Actor identity comes only from `context.auth.principalId`.
- Update input contains only `expectedVersion` plus the complete editable snapshot: capacity; ordered thresholds; all seven schedule keys; business-day boundary; reset buffer.
- Timezone, push interval, fresh interval, operational stale interval, and public poll interval are read-only in the response and copied forward on every insert.
- No reason input. Audit `reason` is always `null`.
- Strict Zod objects reject unknown keys. Numbers are finite safe integers with the exact bounds in the accepted specification. Times are canonical Western-digit `HH:mm`.
- A valid no-op request appends a new version and audit row; only a clean UI disables Save.
- `effectiveFromUtc` is canonical `YYYY-MM-DDTHH:mm:ss.sssZ` via `Date.toISOString()`.
- Closed schedule days are `null`. Equal open/close represents a 24-hour session; do not add overlap or invented schedule rules.

### Persistence, time, concurrency, and audit

- Use the existing schema exactly; no migration, seed, default, or environment change.
- Inject one clock into the Settings repository.
- Read calls the clock exactly once immediately before its current-effective query and takes no advisory lock.
- Update opens one transaction, acquires `pg_advisory_xact_lock(hashtext('fitway-phase11-owner-settings'))`, then calls the same clock exactly once.
- Resolve current settings by `effectiveFrom <= capturedNow`, ordered `(effectiveFrom DESC, version DESC)`.
- Compare `expectedVersion` after the lock. A mismatch throws one typed Settings conflict mapped to `409 CONFLICT` with stable data code `settings_version_conflict`; nothing is written.
- Insert a complete snapshot. Editable fields come from validated input; every operational field copies from the locked current row; `effectiveFrom` and `createdAt` use the captured instant; `createdBy` is the authenticated owner.
- Append the existing `buildSettingsAuditEntry(... reason: null ...)` through `appendAuditEntry` on the same transaction and return the positive generated `auditId`.
- Any missing/malformed current row or insert/audit failure is a generic server failure and rolls back both tables.
- The service is a narrow context/transport seam. It delegates persistence; it does not capture time or split the transaction.

### Current consumers and history

- In `packages/api/src/public/payload-builder.ts`, replace the emitted stored band with `bandFor(current.currentCount, settings.capacity, settings)` after existing settings validation.
- Do not update `current_state`, its `settings_version`, cached payloads, occupancy history, analytics rows, or reset issuance state during Settings update.
- Operational snapshots inherit the corrected band through the existing shared public builder; do not add a second calculation path.
- Public response shape, routes, count, schedule/freshness semantics, and OpenAPI/edge contracts remain frozen.
- Never expose capacity, thresholds, denominator, percentage, reset data, operational configuration metadata beyond the existing contract, actor, or audit data publicly.
- Historical `occupancy_minutes.capacity_snapshot`, stored band, settings version, analytics, reports, and close-owning reset behavior remain unchanged.

### UI, localization, and accessibility

- Mount `OwnerSettingsSection enabled` after the existing Owner governance siblings in the settled `/admin` daily fragment. The section uses the same daily-query prerequisite gate as Access/Audit/Health and issues zero Settings requests in standby or forbidden branches.
- Do not create a URL, route-tree entry, shell, page `h1`, header, main landmark, global nav item, or duplicate `48px`/`16px` content insets.
- Settings begins at `h2`; internal groups use semantic `h3` or `fieldset`/`legend`.
- Preserve the physical FITWAY rail LTR. Use logical CSS properties and the explicit reading-start orders in the accepted specification.
- Keep Settings copy local. Use accepted Paper Arabic where available and native Arabic for runtime-only states; do not edit shared i18n catalogs.
- Follow the accepted group order: intro/actions; Capacity → Boundary → Reset; Quiet → Moderate → Busy; weekly hours; locked timings.
- Weekday state is a styled form checkbox: `18×18px` marker inside a `44×44px` target, accessible name includes day and state. Unchecked serializes `null`, removes time inputs from interaction, and shows the localized full-width unavailable row.
- Closing then reopening in one draft restores that draft's prior pair. Reopening a persisted closed day starts with two empty required times; Save stays disabled until valid. Never invent defaults.
- Implement the complete standby/loading/load-error/clean/dirty-valid/dirty-invalid/saving/saved/atomic-failure/version-conflict state machine exactly as specified.
- At `>=721px`, dirty/invalid/failure/conflict place Discard in the upper cluster. At `<=720px`, upper remains state/version plus Save and the lower frontier carries state/error, Discard, Save. Clean has no Discard or lower frontier. Conflict disables Save; saving locks every rendered action.
- One form controller owns every rendered action. The two mobile Save controls cannot produce duplicate requests.
- Use existing FITWAY tokens locally. Do not create global tokens. Do not copy Paper frame heights into CSS.
- Preserve focus visibility, persistent labels, programmatic errors, one polite status region, keyboard order, `44px` targets, reduced motion, forced colors, 200% reflow, and bidi isolation.

## 5. Execution sequence

GLM must work sequentially as the sole writer and keep each checkpoint reviewable.

### Checkpoint A — shared contracts and procedures

1. Write failing contract tests for strict shapes, all bounds/order rules, exact weekday keys, canonical times, closed/open days, output serialization, and unknown-key rejection.
2. Implement the shared schemas/types in `settings/contracts.ts`.
3. Write procedure tests for owner success, `401`, `403`, missing context functions, actor sourcing, typed conflict mapping, and unexpected-error non-leakage.
4. Implement `adminSettingsProcedures` with only `read` and `update`; expose it under `admin.settings` through the leased router file.
5. Add typed `readOwnerSettings` and `updateOwnerSettings` context functions through the leased context file; do not expose repository/database objects.

Checkpoint acceptance: focused contract/procedure tests pass and no server/web implementation is required to compile those tests through unsafe casts.

### Checkpoint B — repository and service

1. Write repository unit tests first for mapping, malformed stored rows, exactly one read clock call/no advisory lock, post-lock exactly one update clock call, chronology/tie order, full operational copy-forward, no-op append, stable conflict, and rollback propagation.
2. Implement the repository transaction exactly in the locked sequence. Use the fixed Settings-only advisory key and existing Drizzle schema/audit helpers.
3. Implement the thin service and tests. It forwards read/update, keeps actor attribution intact, and never owns the clock or transaction.
4. Wire one repository/service instance into the leased server entry and inject only its two functions into request context.
5. Add real-Postgres integration coverage for current resolution, equal timestamps, ignored future rows, owner/staff/anonymous access, success/audit linkage, copy-forward, stale version, two concurrent writers, forced settings/audit rollback, canonical timestamps, no-op append, malformed/missing history, and schedule semantics.

Checkpoint acceptance: unit and isolated integration tests pass against a uniquely named disposable database; schema diff is empty.

### Checkpoint C — public/operational band behavior

1. Add a failing builder test proving that changed capacity/thresholds recompute the next band from the unchanged count even when persisted `current.band` differs.
2. Replace only the band expression with existing `bandFor` behavior; retain existing validation and unavailable fallbacks.
3. Extend integration coverage to prove the next public payload and operational snapshot agree without a new push, `current_state` remains byte/field equivalent, and no private setting appears publicly.
4. Prove historical analytics/reporting rows and reset decisions remain unchanged.

Checkpoint acceptance: builder and integration tests pass; no public DTO/schema/OpenAPI diff exists.

### Checkpoint D — hook and form behavior

1. Build `useOwnerSettings` around strict response parsing and TanStack Query. It supports standby, retry, a single non-retried mutation, baseline/draft separation, expected-version replacement on success, atomic-failure draft retention, and conflict discard/refetch. Do not log payloads.
2. Write hook tests for zero standby request, read parsing, retry, no duplicate mutation, success baseline/version replacement, generic failure, conflict, discard/refetch, and locale-independent draft preservation.
3. Implement local English/Arabic messages and the section/view form with controlled fields, group validation, checkbox day transitions, read-only operational display, upper/lower responsive actions, and the full announced state machine.
4. Write component tests for every state plus open → closed → reopen restoration, persisted closed → empty required open, `null` serialization, no invented values, breakpoint-specific Discard, LTR/RTL order, error association, keyboard flow, and duplicate-submit prevention.

Checkpoint acceptance: hook/component tests pass in both locales and the DOM has one section heading hierarchy, one controller, no nested main, no clean Discard, and no standby request.

### Checkpoint E — route adoption, profile, and rendered verification

1. Mount the enabled Settings sibling in the leased `/admin` daily fragment after existing governance sections; do not change the forbidden/history branches.
2. Add the exact `phase11-settings` verification profile to the leased verification script:
   - browser: `phase11-settings`, `phase11-access`, `phase11-audit`, `phase11-health`, `phase10-ui-csv`, `phase9-owner-ui`, `phase11-shell`;
   - integration: `apps/server/src/phase11-settings.integration.test.ts`.
3. Write browser coverage for authorization/standby, loading/retry, editing/validation, save/saved, atomic failure/retry, conflict/discard reload, weekly transitions, responsive actions, no duplicate submit, keyboard/focus, axe, forced colors, reduced motion, and bidi.
4. Verify widths `320`, `360`, `390`, `721`, `768`, `820`, `1024`, `1200`, and `1440`, plus 200% zoom/reflow.
5. Capture uncommitted review evidence for all four accepted Paper comparisons: English/Arabic desktop `1440` and English/Arabic mobile `390`. Use run-scoped review directories; do not overwrite canonical baselines or commit generated screenshots unless the coordinator explicitly leases a destination.

Checkpoint acceptance: all Settings and sibling browser suites pass; visual review shows no clipping, duplicate insets, shell mirroring, or material drift.

### Checkpoint F — candidate freeze

1. Inspect the complete diff against the activation SHA. Remove unrelated changes; do not autoformat unrelated files.
2. Run all verification below on fresh run-scoped resources.
3. Commit the exact candidate. Confirm `git status --short` is empty and `git diff --check <activation>..HEAD` passes.
4. Return the candidate SHA, changed-path list, command/evidence ledger, database/run IDs without secrets, and any residual risk. Do not merge or edit the coordinator ledger.

## 6. Acceptance criteria

The candidate is acceptable only when all are true:

1. Owner can read one canonical current-effective snapshot and update only the five editable axes.
2. Every input/output is strict and matches the accepted type, range, chronology, and serialization rules.
3. Staff/anonymous callers cannot read or write; no client can choose actor, version, effective time, operational values, or audit reason.
4. Two writers from one version produce exactly one success and one `settings_version_conflict`; the loser writes neither settings nor audit.
5. Success appends one complete settings version and exactly one linked `settings_updated` audit row in one transaction; forced failures roll back both.
6. The repository uses one injected clock exactly as locked, and immediate read-after-write sees the new version.
7. Current public and operational bands change on the next fetch when applicable without a push, while `current_state`, public shape/privacy, historical snapshots, analytics, reporting, and reset history remain unchanged.
8. Read-only operational values copy forward exactly and are visible but never editable.
9. The complete form state machine, weekly checkbox transitions, responsive actions, Arabic/English ordering, accessibility, reflow, and four-frame visual comparison pass.
10. `/admin` retains one shell, one page `h1`, one main landmark, one prerequisite loading/error region, and every existing sibling behavior.
11. The exact phase profile and full verification suite are green on fresh resources.
12. The diff contains only worker-owned paths and the five actively leased shared paths; the candidate is committed and clean.

## 7. Verification expectations

Use a unique `FITWAY_RUN_ID`, a uniquely named disposable Postgres database supplied/approved for the run, a unique Playwright port, and unique output/report/review/snapshot directories. Never print `.env` contents or connection secrets. Only reset/drop the exact disposable database when the workflow's run ID and reset marker match.

Minimum command ledger:

1. focused Vitest files for every new/changed API, server, hook, and view module;
2. `pnpm check-types`;
3. `pnpm check:repository`;
4. `pnpm test:integration -- apps/server/src/phase11-settings.integration.test.ts` with isolated `TEST_DATABASE_URL`, `FITWAY_RUN_ID`, and the approved reset marker;
5. `pnpm test:browser -- tests/browser/phase11-settings.browser.spec.ts` with isolated Playwright resources;
6. `FITWAY_PHASE=phase11-settings pnpm verify:phase` (PowerShell may set and then remove the environment variable for the command);
7. `pnpm verify:fast`;
8. `pnpm verify:full`;
9. `git diff --check <activation-sha>..HEAD`, exact changed-path inspection, mutation-guard cleanliness, and final clean status.

The coordinator/fresh independent reviewer reruns relevant focused, integration, phase, accessibility, and rendered checks. GLM's own green report is evidence, not acceptance.

## 8. GLM must not change

- `PROJECT_STATE.yaml`, coordinator records, the accepted Settings specification, or this plan;
- `packages/db/src/schema/application.ts`, migrations/meta, seeds, schema defaults, identity ordering, or audit schema;
- `FITWAY_PRODUCT.md`, `SPEC.md`, `PHASES.md`, `DESIGN_GUIDE.md`, ADRs, `AGENTS.md`, workflow policy, approved manifest, or theme snapshot;
- any Paper node/file, accepted fresh area `1FKS-0`, failed historical area `1EO5-0`, or Paper review record;
- public DTO schemas, public/edge routes, OpenAPI, command/reset issuance models, access/auth behavior, owner shell/rail, global tokens, shared i18n catalogs, root package/lock/config, generated route tree, or canonical screenshot baselines;
- timezone, push, fresh, operational stale, or public poll editability;
- historical analytics semantics, stored occupancy snapshots, `current_state`, cached payloads, or existing reset decisions;
- any new setting, reason field, future scheduling, reset/default/import/export action, public capacity/threshold/percentage exposure, staff Settings access, navigation prompt, URL, tab, or global nav item;
- unrelated current-reader future-date debt or opportunistic refactors.

If the task cannot be completed inside this boundary, if a required lease is absent/expired, if repository truth conflicts with the accepted specification, or if any privacy/security/product ambiguity appears, stop `NEEDS_HUMAN` and report the exact conflict. Do not choose a broader design.

## 9. Handoff required from GLM

Return:

- activation SHA and candidate SHA;
- concise outcome and changed paths grouped by owned versus leased;
- exact verification commands and PASS/FAIL results;
- disposable database/run ID and Playwright evidence locations, with secrets redacted;
- confirmation that Paper, schemas/migrations, public contracts, historical state, and canonical baselines were untouched;
- any failed check, residual risk, or `NEEDS_HUMAN` condition.

Stop after handing off the committed candidate. Integration and `DONE` remain coordinator-only.
