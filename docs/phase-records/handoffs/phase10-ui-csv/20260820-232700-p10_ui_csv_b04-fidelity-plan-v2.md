# Phase 10 UI/CSV b04 — bounded Paper-fidelity repair plan v2

- Recorded: 2026-08-20 23:27 +03:00.
- Mode: `plan`; no fidelity implementation has started.
- Branch/worktree: `codex/phase10-ui-csv-b04` / `D:/Projects/fitway-worktrees/phase10-ui-csv-b04`.
- Carried implementation baseline: `a8f40d400337c3325352963177bde81f4fb319d1`.
- Rejected plan commit: `4c2b52e8b6aabc6228b0e1870239f1db2cce18c0`; rejection evidence: `20260820-232600-p10_ui_csv_b04-plan-review-rejected.md`.
- Repair budget: `0/2`; concurrent writers: `0`.

## Objective and authority

Conform the green carried Phase 10 candidate to Paper `FITWAY UX Exploration`, Page 1, area `OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT` (`17YY-0`), approved token hash `3b0faca3`, without changing reporting behavior, contracts, data semantics, copy authority, URLs, persistence, or canonical baselines.

The resulting Owner route has a local Daily/History control immediately after the existing page heading. Daily contains the existing daily analytics, audit, and health siblings. History contains the reporting extension. Within History, the independent reporting-window and CSV-window boards precede the heatmap and comparison; they are equal columns on desktop and stack at `<=820px`.

Measured Paper targets remain: a transparent `160×44px` two-tab seam with two `80×44px` targets; active History uses the existing red-bright 2px inset/underline and strong/chalk text; desktop control boards are equal `664px` flex children with `16px` gap, `16px 18px` padding, and `16px` radius in the 1440 specimen. Required widths are 320/360/390/721/768/820/1024/1200/1440 in English LTR and Arabic RTL, plus 200% zoom/reflow.

## Exact lease and frozen boundary

Writable implementation paths are only:

- `apps/web/src/components/owner/reporting/**`
- `apps/web/src/hooks/use-owner-reporting.ts(.test.tsx)` only if the implementation needs to surface the already-existing prerequisite query state; a direct read-only observer in the section is preferred
- `tests/browser/phase10-ui-csv.browser.spec.ts`
- `apps/web/src/routes/admin.tsx`, wiring only
- this attempt's `*-p10_ui_csv_b04-*.md` evidence records

The carried query helpers/tests and Phase 10 server integration file are frozen after carry. All API routers/context/server wiring, repositories, schemas, migrations, catalogs, global tokens, root configuration, canonical screenshots, normative records, and coordinator ledger files are unconditionally frozen. There is no integration-conflict escape hatch. Any proven need outside the list above stops implementation for a new coordinator plan/lease; no worker broadens scope locally.

## Stage 1 — local tab seam with preserved lifecycle

Add a reporting-owned `OwnerAnalyticsModeSwitch` and focused tests. `admin.tsx` changes only by supplying the accepted Daily composition (`OwnerAnalyticsPage`, `OwnerAuditSection`, `OwnerHealthSection`) and History composition (`OwnerReportingSection`) to that wrapper; authentication, route loading, heading, shell, sibling internals, APIs, and URLs do not change.

The seam is a tabs pattern, frozen as follows:

- Group names: English `Analytics view`; Arabic `عرض التحليلات`.
- Tab names: English `Daily` / `History`; Arabic `اليومي` / `السجل`.
- DOM order is Daily then History in both locales. Natural RTL presentation comes from logical CSS; DOM/read order is not reversed.
- The group has `role="tablist"` and its localized accessible name. Each control has `role="tab"`, stable `id`, `aria-controls`, `aria-selected`, and roving `tabIndex` (`0` selected, `-1` inactive). Each panel has a stable `id`, `role="tabpanel"`, `aria-labelledby`, and `hidden` while inactive.
- Click selects. `Home` selects/focuses Daily and `End` selects/focuses History. Arrow keys automatically select and focus the adjacent tab, wrapping. Physical-direction behavior follows the rendered row: in LTR Right advances and Left retreats; in RTL Left advances and Right retreats. Enter/Space select the focused tab. Tab enters through the selected tab and then its panel's interactive content.
- Focus remains on the newly selected tab; hiding a panel never moves focus into hidden content. Focus treatment remains visible and both targets remain 44px high.

Daily is selected by default. Daily is mounted immediately. History is lazy-mounted only on first selection, so initial entry starts no reporting heatmap/comparison/CSV work. After that first visit, both panel subtrees remain mounted and only the inactive panel is hidden. Therefore switching away and back preserves the edited reporting range, independent CSV range, selected heatmap cell, an in-flight export and its abort controller, and a ready download/object URL. The switch itself never aborts, resets, or revokes anything.

`OwnerReportingSection` must not return a blank History panel while the shared daily prerequisite is pending or failed. It will observe the existing React Query daily key (deduplicated; no new procedure or duplicate network request) and render a History/reporting-owned visible loading state, or a reporting-owned error state with the existing retry action, inside the History panel. Once the prerequisite succeeds it renders the existing reporting heading and controls. Hooks stay unconditional. Tests must cover pending, error, retry, and ready transitions in History.

Stage 1 acceptance additionally proves:

- default Daily has no History leaf requests before first activation;
- switching hides but does not unmount an already-visited panel;
- edited reporting and CSV ranges survive a round trip;
- an export continues across a round trip without abort/revoke and a ready download remains available;
- the exact bilingual names, selected state, panel relations, roving focus, LTR/RTL arrows, Home/End, Enter/Space, Tab order, and focus visibility are correct.

Stage 1 is one implementation commit. Reverting it returns the route to `a8f40d4` with no data/API/migration effect.

## Stage 2 — control grouping and responsive order

In `OwnerReportingSection`, place the reporting range form and `OwnerReportingExport` in one named controls container immediately after the reporting heading/window and before loading, heatmap, comparison, and disclosure. Preserve the independent 31-day reporting and 366-day CSV state machines, validation, request timing, export streaming/abort/object-URL behavior, copy, heading levels, and semantic table.

Add only reporting-local CSS using existing FITWAY tokens/materials. At 1024/1200/1440 the two boards are equal min-width-safe columns with a 16px gap. At 320/360/390/721/768/820 they are one column in DOM/focus order: reporting range then CSV range. No fixed width, truncation, or page/reporting-root overflow is introduced. Loading/error follows both control boards; the dominant heatmap/table follows; comparison and disclosure remain last.

Stage 2 acceptance retains loading, invalid range, retryable heatmap/comparison error, insufficient history, CSV preparing/aborted/ready/error, keyboard heatmap, reduced motion, 200% reflow, Arabic bidi, semantic table, live-region, and screen-reader behavior. It is one implementation commit on Stage 1; reverting it keeps the approved seam and restores the carried internal reporting order.

## Exact verification contract

Before and after every validation ladder, record `git status --porcelain=v1 --untracked-files=all` and the repository mutation fingerprint. Load `apps/server/.env` into the PowerShell process without printing names or values. Bind exactly:

- `FITWAY_RUN_ID=p10_ui_csv_b04`
- `FITWAY_PHASE=phase10-ui-csv`
- `TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/fitway_integration_p10_ui_csv_b04`
- `FITWAY_INTEGRATION_RESET_DATABASE=fitway_integration_p10_ui_csv_b04`
- `FITWAY_PLAYWRIGHT_PORT=48214`
- `FITWAY_PLAYWRIGHT_BASE_URL=http://127.0.0.1:48214`
- `FITWAY_PLAYWRIGHT_OUTPUT_DIR=output/playwright/p10_ui_csv_b04`
- `FITWAY_PLAYWRIGHT_REPORT_DIR=output/playwright/p10_ui_csv_b04/report`
- `FITWAY_PLAYWRIGHT_REVIEW_DIR=output/playwright/p10_ui_csv_b04/review`
- leave `FITWAY_PLAYWRIGHT_SNAPSHOT_DIR` unset so canonical assertion snapshots remain the configured shared read-only baseline; leave `FITWAY_PLAYWRIGHT_SKIP_WEBSERVER` unset/false

Run, in order:

1. focused new seam/section tests plus existing reporting hook/export/view tests;
2. `pnpm check-types`;
3. `pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase10-ui-csv.integration.test.ts` against the exact disposable database above;
4. the Phase 10 browser spec with deterministic Playwright at 320/390/768/820/1024/1440 in both locales/directions, while its automated matrix retains 360/721/1200; include keyboard/focus, 44px targets, reduced motion, concise live regions, 200% zoom/reflow, and document/reporting-root overflow;
5. `pnpm verify:phase --phase phase10-ui-csv` with the bound `FITWAY_PHASE` agreeing with the argument;
6. `pnpm verify:fast`;
7. interactive Browser inspection of `/admin` in Daily and History in English/Arabic, followed by deterministic review captures.

Any initial environment/provisioning failure is corrected without consuming source-repair budget. A source or acceptance failure permits at most two focused repair attempts. A third recurrence of the same validation gate is terminal `FAILED_VALIDATION`; it is not converted to `NEEDS_HUMAN` merely because repair was unsuccessful.

## Independent gates and visual evidence

1. A fresh read-only independent plan reviewer must PASS this v2 boundary before implementation starts, including the prerequisite state, lazy-then-persistent mounting, ARIA/RTL keyboard contract, unconditional freeze, and exact verification isolation.
2. After implementation and coordinator self-verification, a fresh read-only fidelity reviewer compares the rendered candidate directly with Paper area `17YY-0` at the recorded source/hash and five prior failing rows.
3. A separate fresh candidate verifier reviews the full b04 implementation diff from `55de1be`, reruns the clean isolated ladder, and reports without repair.

A final visual PASS requires a current rendered Paper comparison. A fallback is acceptable only when its durable provenance explicitly identifies this same Paper file, Page 1, area `17YY-0`, and hash `3b0faca3`, and the artifact is already approved rendered evidence. Metadata, tree, computed styles, or an unapproved historical render alone cannot substitute. If neither direct render nor that exact approved artifact is available after bounded tool retries, implementation may be technically green but b04 stops `BLOCKED` at the visual gate; it must not claim PASS or alter Paper/baselines.

Security/privacy/data-semantic conflict, locked-product conflict, expired lease, out-of-scope need, or a genuinely material new visual-direction decision is `NEEDS_HUMAN`. No settled decision is reopened without concrete conflicting repository evidence.
