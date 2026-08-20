# Phase 10 UI/CSV b04 — bounded Paper-fidelity repair plan v3

- Recorded: 2026-08-20 23:41 +03:00.
- Mode: `plan`; no fidelity implementation has started.
- Branch/worktree: `codex/phase10-ui-csv-b04` / `D:/Projects/fitway-worktrees/phase10-ui-csv-b04`.
- Carried implementation baseline: `a8f40d400337c3325352963177bde81f4fb319d1`.
- Rejected plan commits: `4c2b52e` (v1) and `1bc8685` (v2); their immutable review records remain beside this file.
- Repair budget: `0/2`; concurrent writers: `0`.

## Objective, authority, and measured target

Conform the green carried Phase 10 candidate to Paper `FITWAY UX Exploration`, Page 1, area `OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT` (`17YY-0`), approved token hash `3b0faca3`, without changing reporting behavior, contracts, data semantics, URLs, persistence, copy authority, or canonical baselines.

The Owner route gains a local Daily/History control immediately after its existing heading. Daily contains the existing daily analytics, audit, and health siblings. History contains the reporting extension. Within History, independent reporting-window and CSV-window boards precede the heatmap and comparison, occupy equal columns on desktop, and stack at `<=820px`.

Measured Paper targets are a transparent `160×44px` two-tab seam with two `80×44px` targets; active History uses the existing red-bright 2px underline/inset and strong/chalk text. At 1440, control boards are equal `664px` flex children with `16px` gap, `16px 18px` padding, and `16px` radius. Coverage is 320/360/390/721/768/820/1024/1200/1440 in English LTR and Arabic RTL, plus 200% zoom/reflow.

## Exact lease and unconditional freeze

Writable implementation paths are only:

- `apps/web/src/components/owner/reporting/**`
- `apps/web/src/hooks/use-owner-reporting.ts` and `apps/web/src/hooks/use-owner-reporting.test.tsx`
- `tests/browser/phase10-ui-csv.browser.spec.ts`
- `apps/web/src/routes/admin.tsx`, wiring only
- this attempt's `*-p10_ui_csv_b04-*.md` evidence records

The carried query helpers/tests and Phase 10 server integration file are frozen after carry. All API routers/context/server wiring, repositories, schemas, migrations, catalogs, global tokens, root configuration, canonical screenshots, normative records, and coordinator ledger files are unconditionally frozen. Any proven need outside the list stops implementation for a new coordinator plan/lease; no worker broadens scope locally.

## Stage 1 — exact tab seam and prerequisite ownership

Add a reporting-owned `OwnerAnalyticsModeSwitch` and focused tests. `admin.tsx` changes only by placing the accepted Daily composition (`OwnerAnalyticsPage`, `OwnerAuditSection`, `OwnerHealthSection`) and History composition (`OwnerReportingSection`) in that wrapper. Authentication, route loading, heading, shell, sibling internals, APIs, and URL state do not change.

The wrapper permanently owns one `useOwnerDailyAnalytics` observer from its initial render and passes that query result as the prerequisite prop to `OwnerReportingSection`. Because the wrapper renders before its Daily children, all same-render Daily observers share the same in-flight React Query key; the wrapper remains mounted, so activating History adds no late observer. Refactor `useOwnerReporting` to accept the resolved prerequisite facts instead of calling `useOwnerDailyAnalytics` internally. This preserves exactly one implicit `daily` → `timeContext` request chain. A user-triggered retry through either visible panel invokes that existing query's `refetch` exactly once; tests distinguish that deliberate extra chain from any observer-driven request. No non-fetching observer is invented and no query options/global defaults change.

The tabs contract is frozen:

- Group names: English `Analytics view`; Arabic `عرض التحليلات`.
- Tabs: English `Daily` / `History`; Arabic `اليومي` / `السجل`.
- DOM order is Daily then History in both locales; logical CSS supplies natural RTL presentation without reversing read order.
- The group has `role="tablist"` and the localized accessible name. Each control has `role="tab"`, stable `id`, `aria-controls`, `aria-selected`, and roving `tabIndex` (`0` selected, `-1` inactive).
- Both panel shells exist from first render with stable `id`, `role="tabpanel"`, `aria-labelledby`, and inactive `hidden`. Thus both tab IDREFs always resolve. The initial hidden History shell is empty/inert: its reporting subtree and hooks do not exist and no History leaf work starts.
- Daily is selected by default. On the first History selection, its reporting subtree mounts inside the already-existing panel shell. It then remains mounted forever; later switching changes only the panels' `hidden` state. Daily also remains mounted.
- Click selects. `Home` selects/focuses Daily and `End` selects/focuses History. Arrows automatically select/focus the adjacent tab with wrap: LTR Right advances/Left retreats; RTL Left advances/Right retreats, matching the physically rendered logical row. Enter/Space select the focused tab. Tab enters through the selected tab and then its panel's interactive content.
- Focus stays on the newly selected tab; hiding a panel never moves focus into hidden content. Both targets remain 44px high with visible focus.

`OwnerReportingSection` renders a History-owned visible reporting loading state while the prerequisite is pending and its existing reporting error/retry state if it fails. On success it renders the existing reporting heading and controls. Its hooks remain unconditional within the mounted reporting subtree, but `useOwnerReporting` receives prerequisite data and therefore sends no heatmap/comparison request until those facts are available.

Stage 1 tests prove on first render: both `aria-controls` targets exist; History's panel shell is hidden/inert; the reporting subtree is absent; and heatmap/comparison/CSV calls are zero. Success activation leaves `daily` and `timeContext` at exactly one call each. Pending/error activation is visible and usable; no implicit retries occur; one explicit retry produces exactly one expected additional prerequisite chain. Round trips add no calls.

After first activation, switching away/back preserves the edited reporting range, independent CSV range, selected heatmap cell, an in-flight export and its abort controller, and a ready download/object URL. Tests spy on abort/revoke and prove neither occurs on mode switching; the switch never resets or revokes state.

Stage 1 is one implementation commit. Reverting it restores `a8f40d4` with no data/API/migration effect.

## Stage 2 — grouped controls and responsive order

In `OwnerReportingSection`, place the reporting range form and `OwnerReportingExport` in one named controls container immediately after the reporting heading/window and before loading, heatmap, comparison, and disclosure. Preserve the independent 31-day reporting and 366-day CSV state machines, validation, request timing, streaming/abort/object-URL behavior, copy, headings, and semantic table.

Add only reporting-local CSS with existing FITWAY tokens/materials. At 1024/1200/1440 the boards are equal min-width-safe columns with a 16px gap. At 320/360/390/721/768/820 they are one column in DOM/focus order: reporting range then CSV range. Loading/error follows both boards; the dominant heatmap/table follows; comparison and disclosure remain last. No fixed-width truncation or document/reporting-root overflow is introduced.

Acceptance retains loading, invalid range, retryable heatmap/comparison error, insufficient history, CSV preparing/aborted/ready/error, keyboard heatmap, reduced motion, 200% reflow, Arabic bidi, semantic table, concise live regions, and screen-reader behavior. Stage 2 is one commit; reverting it keeps Stage 1 and restores the carried reporting order.

## Exact isolated verification

Each runner begins and ends at a committed candidate with these exact checks all empty/successful: `git status --porcelain=v1 --untracked-files=all`, `git diff --exit-code`, `git diff --cached --exit-code`, and `git diff --check`. The verifier additionally confirms its starting HEAD equals the reviewed candidate. The verify scripts' internal mutation guard remains authoritative; run outputs are ignored disposable evidence. Load `apps/server/.env` into PowerShell without printing names or values.

Self-verification resources:

- `FITWAY_RUN_ID=p10_ui_csv_b04`
- `TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p10_ui_csv_b04`
- `FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p10_ui_csv_b04`
- `FITWAY_PLAYWRIGHT_PORT=48214`
- `FITWAY_PLAYWRIGHT_BASE_URL=http://127.0.0.1:48214`
- `FITWAY_PLAYWRIGHT_OUTPUT_DIR=output/playwright/p10_ui_csv_b04`
- `FITWAY_PLAYWRIGHT_REPORT_DIR=output/playwright/p10_ui_csv_b04/report`
- `FITWAY_PLAYWRIGHT_REVIEW_DIR=output/playwright/p10_ui_csv_b04/review`

Independent-verifier resources:

- `FITWAY_RUN_ID=p10_ui_csv_b04_verify`
- `TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p10_ui_csv_b04_verify`
- `FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p10_ui_csv_b04_verify`
- `FITWAY_PLAYWRIGHT_PORT=48215`
- `FITWAY_PLAYWRIGHT_BASE_URL=http://127.0.0.1:48215`
- `FITWAY_PLAYWRIGHT_OUTPUT_DIR=output/playwright/p10_ui_csv_b04_verify`
- `FITWAY_PLAYWRIGHT_REPORT_DIR=output/playwright/p10_ui_csv_b04_verify/report`
- `FITWAY_PLAYWRIGHT_REVIEW_DIR=output/playwright/p10_ui_csv_b04_verify/review`

For both identities leave `FITWAY_PLAYWRIGHT_SNAPSHOT_DIR` unset so canonical screenshots remain the configured shared read-only baseline, and leave `FITWAY_PLAYWRIGHT_SKIP_WEBSERVER` unset/false. Run this order:

1. focused seam/section tests plus existing reporting hook/export/view tests;
2. `pnpm check-types`;
3. remove `FITWAY_PHASE` from the process environment, then run `pnpm verify:fast` before broader checks;
4. run `pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase10-ui-csv.integration.test.ts` against that runner's exact disposable database;
5. run `pnpm exec playwright test tests/browser/phase10-ui-csv.browser.spec.ts --project=chromium` with that runner's exact port/base/output values;
6. set `FITWAY_PHASE=phase10-ui-csv`, then run `pnpm verify:phase --phase phase10-ui-csv` and require agreement;
7. remove `FITWAY_PHASE` again before any subsequent fast verification or handoff.

Self-verification also includes interactive Browser inspection of `/admin` in Daily/History, English/Arabic, followed by deterministic captures. The Playwright spec covers 320/390/768/820/1024/1440 directly while retaining 360/721/1200 in the automated matrix; it checks panel IDREFs, prerequisite request counts, keyboard/focus, 44px targets, range/export continuity, reduced motion, live regions, 200% zoom/reflow, and document/reporting overflow.

An environment/provisioning failure is corrected without consuming source-repair budget. An ordinary source/acceptance failure permits at most two focused repair attempts; a third recurrence of that same ordinary gate is terminal `FAILED_VALIDATION`. The stricter visual exception remains binding: a second material Paper-composition disagreement is immediately `NEEDS_HUMAN`, and no third visual repair is permitted.

## Independent gates and visual evidence

1. A fresh read-only independent plan reviewer must PASS this v3 boundary before implementation, including query ownership/call counts, initial panel IDREFs, persistent lifecycle, ARIA/RTL behavior, unconditional freeze, validation order, separate verifier resources, and terminal rules.
2. After implementation/self-verification, a fresh read-only fidelity reviewer compares the rendered candidate directly with Paper area `17YY-0` at this source/hash and the five prior failing rows.
3. A separate fresh candidate verifier reviews the complete implementation diff from `55de1be`, reruns the second clean identity above, and reports without repair.

Final visual PASS requires a current rendered Paper comparison. A fallback is acceptable only when durable provenance explicitly identifies this same Paper file, Page 1, area `17YY-0`, and hash `3b0faca3`, and the artifact is already approved rendered evidence. Metadata/tree/computed styles or an unapproved historical render cannot substitute. If neither direct render nor that exact approved artifact is available after bounded retries, b04 stops `BLOCKED` at the visual gate without claiming PASS or altering Paper/baselines.

Security/privacy/data-semantic conflict, locked-product conflict, expired lease, out-of-scope need, or genuinely material new visual-direction decision is `NEEDS_HUMAN`. Settled decisions remain closed absent concrete repository conflict.
