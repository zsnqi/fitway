# Phase 11 audit b01 worker handoff

- Status: `READY_FOR_INTEGRATION`. First attempt, repair `0/2`, no candidate-gate failure consumed.
- Base commit / candidate commit: `ce82b52` (activation, `SELF`) / this commit.
- Branch / worktree / run ID: `work/phase11-audit-b01` /
  `D:/Projects/fitway-worktrees/phase11-audit-b01` / `p11_audit_b01`.
- Owned paths used: `packages/api/src/audit/list.ts` and `list.test.ts`;
  `apps/server/src/audit-repository.ts` and `audit-repository.test.ts`;
  `apps/server/src/phase11-audit.integration.test.ts`;
  `apps/web/src/components/owner/audit/**`; `apps/web/src/hooks/use-owner-audit.ts` and
  `use-owner-audit.test.tsx`; `tests/browser/phase11-audit.browser.spec.ts` and the new
  `tests/browser/__screenshots__/win32/chromium/phase11-audit.browser.spec.ts/` subtree; this record.
- Shared leases used: all four, and only for wiring the read surface and mounting the section —
  `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts`,
  `apps/web/src/routes/admin.tsx`. The owner shell composition and the `/admin` route guard are
  unchanged; the route gains one sibling element inside the existing allowed branch.

## Decisions made

- **The contract is new, not borrowed.** `HumanAuditEntry`/`SystemAuditEntry` with their `Date`
  remain the frozen Phase 5 append types. The transport DTO is
  `packages/api/src/audit/list.ts` (authority packet "reuse and gaps"; activation "Scope").
- **Actions stay exactly three.** `AUDIT_ACTIONS` is the single source of the enum
  (`packages/db/src/schema/application.ts:80` is unchanged and remains the persistence authority).
  Openness to a later additive set is structural, not speculative: one tuple feeds every schema, the
  action filter is an array so adding a member needs no wire change, and the entry carries no
  `commandId` and no issuer class, so a later non-command-coupled row is representable. No access,
  settings, or system action kind was invented (activation "Explicit instruction: do not
  pre-generalize").
- **Null is a state, never a zero.** `priorValue` is nullable in the DTO; in the filter an *absent*
  key means "no filter" and an *explicit* `null` means "the column is null". The same shape gives
  `reason` its explicit missing option. Proved at three levels: schema unit test, rendered SQL
  (`is null` versus `= $1`), and live Postgres (`priorValue: 0` returns zero rows while
  `priorValue: null` returns the two rows that genuinely have no recorded prior).
- **Actor attribution is persisted only.** `principalId`, `kind`, `role`, and
  `auth_principals.display_name`. The integration test observes the real "Shared front desk" and the
  real owner display name; the system reset carries `principalId: null` and no borrowed label. No
  email, credential, session, or per-person identity exists anywhere in the contract or the UI
  catalog (SPEC.md:358, SPEC.md:394).
- **No migration and no new index.** `audit_log_created_id_idx` on `(created_at, id)` already exists
  at `packages/db/src/schema/application.ts:396`; the keyset seek is a row-value comparison in that
  exact order. Nothing under `packages/db/**` was touched.
- **Frozen atomicity untouched.** The read repository is a sibling of `appendAuditEntry`, which is
  byte-identical apart from being moved below the new imports. The context exposes no append path,
  so the new leaf cannot write. The integration test snapshots `audit_log` before and after a run of
  list calls and asserts equality.
- **Gym timezone owns every instant.** The transport emits ISO UTC; the UI resolves the configured
  gym zone through the existing `admin.analytics.timeContext` and formats with `formatGymTime` plus
  `formatDate`. Occurred-range filters are gym-local calendar days converted in the hook, so the
  device zone cannot move a boundary either way. `apps/web/src/i18n/**` was not modified.

## Contract

```ts
// packages/api/src/audit/list.ts
input  { limit: 1..100 = 25, cursor?: { createdAtUtc, id } | null, filters?: {...} }
filter { actorPrincipalId?, actorKind?, actions?[1..3], priorValue?: number | null,
         effectiveValue?, occurredFrom?, occurredTo?, reason?: string | null }   // strict
entry  { id, action, actor { principalId, kind, role, displayName },
         priorValue: number | null, effectiveValue: number,
         requestedDelta: number | null, requestedValue: number | null,
         reason: string | null, createdAtUtc }                                   // strict
output { entries: entry[], nextCursor: cursor | null }                           // strict
```

Reason matching is a case-insensitive substring with `%`, `_`, and `\` escaped, so a reason
containing "60% capacity" is found by searching for `%` and is not treated as a wildcard.

## Changes by file

| File | Change |
| --- | --- |
| `packages/api/src/audit/list.ts` | New transport DTO, strict input/filter/cursor/output schemas, row mapping with re-asserted coherence, bounded keyset pagination. |
| `packages/api/src/audit/list.test.ts` | 16 tests: strict inputs, cursor shape, six filters, actor labels, action/value mapping, ordering, pagination bounds. |
| `apps/server/src/audit-repository.ts` | Adds `auditListFilterConditions`, `auditListKeysetCondition`, `auditListConditions`, `createAuditListRepository`. `appendAuditEntry` is unchanged. |
| `apps/server/src/audit-repository.test.ts` | 11 tests rendering the built SQL through `PgDialect` plus a recording database for projection, order, and limit. |
| `apps/server/src/phase11-audit.integration.test.ts` | 8 guarded Postgres tests over real oRPC and real authentication. |
| `apps/web/src/hooks/use-owner-audit.ts` | Gym-day arithmetic, selection-to-filter mapping, timezone-gated infinite keyset query, schema-validated pages. |
| `apps/web/src/hooks/use-owner-audit.test.tsx` | 17 tests: gym-day and DST boundaries, filter mapping, loading/empty/populated/error, paging, malformed page. |
| `apps/web/src/components/owner/audit/` | `owner-audit-section.tsx` (filter form and state switch), `owner-audit-view.tsx` (table and states), `messages.ts`, `use-owner-audit-messages.ts`, `owner-audit.css`, `owner-audit-view.test.tsx` (11 tests). |
| `tests/browser/phase11-audit.browser.spec.ts` | 8 browser tests plus 11 review captures and 2 new canonical compositions. |
| `packages/api/src/context.ts` | Optional `listAuditEntries` injection. |
| `packages/api/src/routers/index.ts` | `admin.audit.list` on `ownerProcedure`. |
| `apps/server/src/index.ts` | Constructs the list repository and injects it. |
| `apps/web/src/routes/admin.tsx` | Renders `<OwnerAuditSection />` after the analytics page inside the existing allowed branch. |

## Validation commands and results

| Command | Result |
| --- | --- |
| `pnpm exec vitest run packages/api/src/audit/list.test.ts` | pass, 1 file / 16 tests |
| `pnpm exec vitest run apps/server/src/audit-repository.test.ts` | pass, 1 file / 11 tests |
| `pnpm exec vitest run apps/web/src/hooks/use-owner-audit.test.tsx` | pass, 1 file / 17 tests |
| `pnpm exec vitest run apps/web/src/components/owner/audit/owner-audit-view.test.tsx` | pass, 1 file / 11 tests |
| `pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase11-audit.integration.test.ts` | pass, 1 file / 8 tests |
| `pnpm exec playwright test tests/browser/phase11-audit.browser.spec.ts` | pass, 8 tests, clean against the new baselines |
| `pnpm exec biome check <owned + leased files>` | pass, 19 files, no diagnostics |
| `pnpm --filter web check-types` / `pnpm -r check-types` | pass, all seven packages `Done` |
| `pnpm verify:fast` | pass, 53 files / 353 unit tests, 117 simulator tests, mutation guard clean |
| `FITWAY_PHASE=phase11-audit pnpm verify:phase` | pass, integration 8/8, browser 8/8, mutation guard clean |
| `git diff --check` | clean, exit 0 |
| `git status --short --branch` | only the owned and leased paths above |

Resources: run ID `p11_audit_b01`, database `fitway_integration_p11_audit_b01`, Playwright port
`6842` derived from the run ID, output under `output/playwright/p11_audit_b01/`.

## Browser, accessibility, and visual artifacts

Review captures (disposable) in `output/playwright/p11_audit_b01/review/`: populated at
1440×900 in both locales, 360×900 and 768×1024 in both locales, loading / empty / error / populated
at 390×844, and the 200% reflow.

Canonical additions, this slice's own subtree only:
`tests/browser/__screenshots__/win32/chromium/phase11-audit.browser.spec.ts/owner-audit-ar-desktop-1440x900.png`
and `owner-audit-en-mobile-390x844.png`. No existing baseline was read for update or modified.

Exercised: Arabic RTL and English LTR; widths 320, 360, 390, 721, 768, 820, 1024, 1200, 1440 with no
document-level horizontal scrolling at any of them; loading, empty, error, and populated states;
device timezone emulated as `America/Los_Angeles` against a gym zone of `Asia/Riyadh`, with the
newest row asserted to read the gym's own day and clock and explicitly not the device's; Western
digits in both locales; the change arrow mirrored by reading direction; keyboard focus and tab order
through the filter form; every control at least 44px with a visible focus indicator; reduced motion;
200% zoom reflow; forced colors with a ≥2px outline on every enabled control; Axe scoped to
`.owner-audit` with zero serious or critical violations in both locales.

Two polish cycles were spent, both on composition rather than product decisions: the filter actions
now close the form on their own row instead of wrapping between fields, and the dense table gained a
visible scroll affordance (a locale-aware hint below 1024px plus a styled scrollbar) so the labeled
scroll region satisfies `DESIGN_GUIDE.md` §8. No material visual change was made.

## Privacy evidence

- The repository projects an explicit twelve-column list and joins `auth_principals` for
  `display_name` alone; the unit test asserts that exact projection and the joined table name.
- The integration test parses the raw response body and asserts the exact entry and actor key sets,
  that the body contains no `@`, not the provisioned owner email, not the persisted staff PIN hash,
  and no `sessionId`, `token`, `credential`, `commandId`, or `issuerClass` substring.
- The component test asserts the rendered table contains no `@`, and the message catalog contains no
  per-person label — the automatic issuer is named from the catalog, never from a borrowed identity.

## Remaining work and stop conditions

None outstanding inside this slice. Not included, by the authority packet: audit-retention cleanup,
and the coordinator-owned `audit_log` generalization migration, which deliberately lands after this
slice.

Escalate rather than repair if a verifier finds: a synthetic identity requirement, a need for future
action kinds, weakened Phase 5 atomicity, a migration or index need, a Product/Spec conflict, or work
beyond the four leases.

## Exact resume command

```powershell
Set-Location "D:/Projects/fitway-worktrees/phase11-audit-b01"
$env:FITWAY_RUN_ID='p11_audit_b01'
$env:TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p11_audit_b01'
$env:FITWAY_INTEGRATION_RESET_DATABASE='fitway_integration_p11_audit_b01'
$env:FITWAY_PHASE='phase11-audit'
pnpm verify:phase
```

A fresh verifier must use its own reserved resources (`p11_audit_v01` /
`fitway_integration_p11_audit_v01`) rather than these.
