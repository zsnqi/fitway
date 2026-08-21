# Phase 10 UI/CSV b04 — bounded Paper-fidelity repair plan

- Recorded: 2026-08-20 23:16 +03:00.
- Mode: `plan`; no fidelity implementation has started.
- Branch/worktree/HEAD: `codex/phase10-ui-csv-b04` / `D:/Projects/fitway-worktrees/phase10-ui-csv-b04` / `a8f40d400337c3325352963177bde81f4fb319d1`.
- Repair budget: `0/2`; concurrent writers: `0`.

## Objective

Make the carried green Phase 10 candidate conform to approved Paper composition without changing reporting behavior, contracts, data semantics, copy authority, or canonical baselines:

1. the Owner route exposes a local Daily/History switch immediately after the existing page heading;
2. Daily keeps the already-accepted daily analytics, audit, and health siblings;
3. History presents the reporting extension as its own composition rather than below those siblings;
4. within History, the independent reporting-window and CSV-window controls are grouped before the heatmap and comparison, two equal columns on desktop and one column at `<=820px`.

Observable result: after choosing History, DOM/focus order is switch → reporting heading/window → grouped reporting and CSV controls → loading/error if present → dominant heatmap/semantic table → comparison → footnote. At all required widths/locales the document and reporting root have no horizontal overflow.

## Authority and measured Paper target

- Paper: `FITWAY UX Exploration`, Page 1, `OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT` (`17YY-0`), token hash `3b0faca3`; ADR-007 governs composition.
- The approved Desktop English hierarchy is page heading/local switch → independent reporting and CSV ranges → dominant 7×24 heatmap → comparison/disclosure.
- Computed target values: switch `160×44px`; two `80×44px` controls; active History control uses the existing red-bright inset edge and strong/chalk text. The two control boards are equal `664px` flex children separated by `16px`, with `16px 18px` board padding and `16px` radius in the 1440 specimen.
- Responsive authority: controls stack at `<=820px`; coverage remains 320/360/390/721/768/820/1024/1200/1440, Arabic RTL and English LTR, plus 200% zoom/reflow.
- Repository copy remains authoritative. The switch labels are the approved Paper concepts `Daily` / `History` and their component-owned Arabic equivalents; no shared catalog or existing application string changes.
- Current Paper screenshot/export calls timed out, but file/page/area/token identity, structure, and computed styles are current and agree with the immutable rendered five-row failure matrix at `20260816-211500`. No visual PASS may be claimed unless the final independent comparison obtains rendered evidence from Paper or an equivalent approved rendered artifact at the same source/hash.

## Scope

### Writable repair paths

- `apps/web/src/components/owner/reporting/**`
- `tests/browser/phase10-ui-csv.browser.spec.ts`
- `apps/web/src/routes/admin.tsx` under the wiring-only lease
- this attempt's `*-p10_ui_csv_b04-*.md` records

`apps/web/src/hooks/use-owner-reporting.ts(.test.tsx)` remains available to the milestone but is not expected to change.

### Frozen after carry-forward

- `packages/api/src/analytics/reporting/queries.ts`
- `packages/api/src/analytics/reporting/queries.test.ts`
- `packages/api/src/analytics/reporting/query-range.ts`
- `apps/server/src/phase10-ui-csv.integration.test.ts`
- other wiring files `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts` unless an integration-only conflict is proven (none is expected)

All ledger/normative/database/frozen-contract/reporting-repository/shared-catalog/global-token/canonical-screenshot/root-config paths remain forbidden exactly as activated.

## Stage 1 — local Owner analytics mode seam

### Change

- Add a reporting-owned `OwnerAnalyticsModeSwitch` component and focused component test.
- The component owns only ephemeral presentation state, defaults to Daily to preserve existing route entry behavior, renders a correctly named local two-option switch/tab seam, exposes `aria-selected`/controlled panels, and mounts only the selected composition.
- Add component-owned bilingual Daily/History/switch-label strings to reporting `messages.ts`.
- Change `admin.tsx` only as wiring: supply the accepted Daily composition (`OwnerAnalyticsPage`, `OwnerAuditSection`, `OwnerHealthSection`) and the History composition (`OwnerReportingSection`) to the new wrapper. Do not change authentication, route loading, heading content, shell, sibling internals, or APIs.

### Acceptance

- Initial route still shows Daily content and does not start reporting history queries.
- Activating History hides the three Daily siblings, mounts reporting, keeps the route heading, moves focus/selection semantics correctly, and can return to Daily without navigation or URL/product-state changes.
- Arabic/English labels and RTL/LTR order are natural; controls keep 44px target height and visible focus.

### Verification

- Focused new component test plus existing reporting hook/view tests.
- `pnpm check-types`.
- Browser smoke on `/admin`: default Daily, select History, switch back, keyboard activation, Arabic/English accessible names.

### Rollback

One commit. Revert it to restore the carried b03 route composition exactly at `a8f40d4`; no data/API/migration state is involved.

## Stage 2 — control grouping and responsive order

### Change

- In `OwnerReportingSection`, place the reporting range form and `OwnerReportingExport` inside one named controls container before loading/heatmap/comparison.
- Preserve the independence of the 31-day reporting window and 366-day CSV window, all form/state/abort behavior, existing component-owned copy, and semantic heading levels.
- Add only reporting CSS required for the equal two-column desktop grouping, `16px` gap, min-width safety, and explicit single-column `<=820px` recomposition. Reuse existing FITWAY tokens/materials; do not recreate Paper pixel-for-pixel where existing accepted component styling already governs behavior.
- Extend the Phase 10 browser spec with stable order/visibility assertions, switch semantics, two-column/stacked computed-layout checks at the boundary, and the existing no-overflow locale/width matrix. Do not touch screenshot baselines.

### Acceptance

- In History, both control groups precede `[data-owner-reporting-grid]`, comparison, and disclosure in DOM, focus, and rendered order.
- At 1024/1200/1440 both control boards occupy two columns; at 320/360/390/721/768/820 they are one column. No fixed width or truncation is introduced.
- Loading, invalid range, retryable heatmap/comparison error, insufficient history, CSV preparing/aborted/ready/error, semantic table, keyboard heatmap, reduced motion, 200% zoom, Arabic bidi, and accessibility behavior remain unchanged.

### Verification

- Focused reporting component/hook/view tests and updated browser spec.
- `pnpm check-types`.
- Exact disposable PostgreSQL file: `apps/server/src/phase10-ui-csv.integration.test.ts` with run/database `p10_ui_csv_b04` / `fitway_integration_p10_ui_csv_b04`.
- `pnpm verify:phase --phase phase10-ui-csv` with run-scoped artifacts, then `pnpm verify:fast`; clean mutation guard required.
- Interactive Browser and deterministic Playwright at 320/390/768/820/1024/1440 in both locales/directions; the automated full matrix also retains 360/721/1200. Check keyboard order, focus visibility/return, 44px targets, reduced motion, concise live regions, screen-reader names, 200% zoom/reflow, and page/reporting overflow.
- Fresh read-only Paper fidelity comparison against `17YY-0` covering the five previously failing rows; no Paper edit and no canonical-baseline update.

### Rollback

One commit on top of Stage 1. Revert it to keep the mode seam while restoring the carried b03 internal reporting order; if Stage 1 is also reverted, branch returns exactly to `a8f40d4`.

## Independent review gates

1. A fresh read-only plan reviewer must PASS this boundary before Stage 1 starts, specifically confirming that the switch is required by the settled Paper repair, `admin.tsx` remains wiring-only, and no hidden product/URL/navigation/copy decision is introduced.
2. After both writing stages and self-verification, a fresh read-only fidelity reviewer compares rendered Paper and the candidate at the recorded targets.
3. A separate fresh independent candidate verifier reviews the complete b04 diff from `55de1be`, reruns the clean run-ID ladder, and reports without repair.

## Risks, unknowns, and stop conditions

- Paper image rendering is presently unavailable through the screenshot/export calls. This does not block implementation from the settled source/hash and accepted rendered finding, but it blocks final visual PASS if no read-only rendered comparison path can be restored.
- If the local switch requires URL persistence, cross-session persistence, new navigation, or a shared catalog change, stop: those are product/scope changes not authorized by this repair. The planned switch is presentation-local only.
- If wiring `admin.tsx` cannot remain a pure wrapper/mount change, stop and return to plan review.
- A second material composition disagreement with Paper is `NEEDS_HUMAN`; no third visual repair is permitted.
- Any security/privacy/data-semantic conflict, expired lease, canonical baseline change, or out-of-scope file need is an immediate stop under the repository policy.
