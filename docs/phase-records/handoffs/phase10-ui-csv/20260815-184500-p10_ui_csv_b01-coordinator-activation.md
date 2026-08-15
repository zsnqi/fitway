# Phase 10 owner reporting UI and CSV export — b01 coordinator activation

- Status: `PLANNED -> IN_PROGRESS`. Repair budget `0/2`. No prior attempt exists.
- Branch / worktree / run ID: `work/phase10-ui-csv-b01` /
  `D:/Projects/fitway-worktrees/phase10-ui-csv-b01` / `p10_ui_csv_b01`.
- Dependencies: `phase10-domain`, `phase10-paper-reporting`, and `phase10-csv-transport`, all `DONE`.
- Base: `SELF` — this activation commit.

## This is not a UI-only slice

`phase10-domain` delivered the reporting domain and its repository, but only the CSV leaf was ever
exposed. `packages/api/src/routers/index.ts` currently exposes
`admin.analytics.{csv, daily, timeContext}` and `admin.audit.list` and `admin.health.summary`, while
`apps/server/src/reporting-repository.ts` already implements `readRange`, `readHeatmap`, and
`readWeekOverWeek` with **no procedure in front of them**.

So this slice owns three new owner-only procedures as well as the UI:

- `admin.analytics.range` over `reportingRangeOutputSchema`
- `admin.analytics.heatmap` over `heatmapOutputSchema`
- `admin.analytics.weekOverWeek` over `weekComparisonOutputSchema`

All three schemas are **frozen** in `packages/api/src/analytics/reporting/contracts.ts`. Consume
them; do not redefine, widen, or infer any of them. The repository methods already exist — wire
them, do not reimplement them.

## Deliverable

Per `PHASES.md` Phase 10 and `SPEC.md` stories 20, 22, and 23: a weekday-by-hour heatmap,
week-over-week comparison with an honest empty state, a date range control, and owner-only CSV
export.

The CSV transport is already accepted and integrated — an oRPC event iterator at
`admin.analytics.csv` whose cancellation semantics were independently verified. **Consume it as it
is.** Do not change its contract, its range validation, or its cancellation behaviour. The export UI
must let the owner abort a running export, because the transport supports it and a large export is
slow.

## Locked semantics

- Closed, missing, and genuine zero stay **visually and semantically distinct** — this is
  `DESIGN_GUIDE.md` §12 and a Phase 10 invariant, not a nicety. The frozen DTOs already carry
  `state: "value" | "closed" | "missing"`; render that distinction, never collapse it.
- Week-over-week shows an honest empty state until two comparable weeks exist. The frozen schema
  already discriminates `insufficient_history` with typed reasons — surface the reason, do not
  invent an approximation.
- Heatmaps use a calibrated single-hue red ramp for occupancy; closed and missing cells get separate
  neutral treatments (§12).
- Every chart or heatmap has an adjacent semantic table or textual equivalent with parity to the
  visualized values (§12). Hover is never the only path to information; desktop hover, keyboard
  focus, and mobile tap expose the same detail.
- Analytics read historical band and capacity from row snapshots, never current settings.
- CSV is UTF-8, spreadsheet-safe, Western digits, UTC **and** gym-local time columns, and includes
  only authorized private analytics fields. That is the accepted transport's behaviour; do not
  re-derive it.
- Arabic RTL default, English LTR first-class, Western digits in both, time-series geometry mirrors
  by reading direction (§9, §12).
- Owner-only: 401 missing/expired, 403 staff, server-side.
- Public capacity boundary is untouched: nothing here exposes a public percentage or denominator.

## Paper authority, and an honest constraint

`phase10-paper-reporting` is `DONE`: the approved Owner reporting extension is area `17YY-0` in the
Paper file, and its adoption record is
`docs/phase-records/handoffs/phase10-paper-reporting/20260811-172242-p10_paper_reporting-b02-completion.md`.
That record describes the approved composition in prose — reporting and CSV groups, input and action
order, heatmap hierarchy, selected-cell information, legend, supporting content, the transparent mode
control with a two-pixel active underline, and the responsive and state coverage.

**Paper is not reachable from this session.** The Paper desktop application is installed but not
running, so the composition cannot be inspected directly. Build against that adoption record plus
`DESIGN_GUIDE.md`, and **do not claim Paper fidelity**. Record explicitly in the handoff that
rendered Paper comparison was not performed. Paper-fidelity review remains an open gate for this
surface, to be closed when Paper is available. Do not approximate it and do not overclaim it.

## Scope

Owned:

- `packages/api/src/analytics/reporting/queries.ts` (or similarly named new module) and its test —
  the three procedures' input schemas and any pure mapping they need
- `apps/server/src/phase10-ui-csv.integration.test.ts`
- `apps/web/src/components/owner/reporting/**` — components, bilingual messages, message hook, CSS
- `apps/web/src/hooks/use-owner-reporting.ts` and its test
- `tests/browser/phase10-ui-csv.browser.spec.ts` and its own new screenshot subtree
- new `docs/phase-records/handoffs/phase10-ui-csv/*-p10_ui_csv_b01-worker-*.md`

Temporary coordinator lease, wiring only: `packages/api/src/context.ts`,
`packages/api/src/routers/index.ts`, `apps/server/src/index.ts`, `apps/web/src/routes/admin.tsx`.

Forbidden: `packages/analytics/reporting/contracts.ts`, `csv.ts`, `reporting.ts`, and
`csv-transport.ts` — all frozen accepted contracts; `apps/server/src/reporting-repository.ts`, whose
methods are consumed as they are; `packages/db/**` entirely; every Phase 9, audit, health, and shell
component and test; `apps/web/src/i18n/**` and shared catalogs; `routeTree.gen.ts`; canonical
baselines outside this slice's own subtree; `PROJECT_STATE.yaml`; `scripts/verify.mjs`; root
manifests, lockfiles, configuration; `visual-direction-gate/**` and Paper; every normative document.

## Mount discipline, learned from two prior slices

`/admin` now hosts analytics, audit, and health. Two lessons are binding here:

1. **Do not issue a duplicate call to a shared procedure.** `phase11-audit` cost a repair by fetching
   the gym timezone a second time. Check what `/admin` already fetches and reuse it.
2. **Do not disturb an accepted composition.** `phase11-health` mounted last so every canonical
   baseline above it stayed byte-identical. Choose a mount position with the same care, and if a
   neighbour's canonical screenshot moves, that is a stop condition — never a regeneration.

The profile gates on all five `/admin` browser specs from activation.

## Resources

- worker `p10_ui_csv_b01` / `fitway_integration_p10_ui_csv_b01`
- verifier `p10_ui_csv_v01` / `fitway_integration_p10_ui_csv_v01`
- coordinator `p10_ui_csv_c01` / `fitway_integration_p10_ui_csv_c01`

## Exit

Full phase UI polish loop in both locales across the required widths, the profile gate, and
`verify:fast`. Commit a candidate and stop at `READY_FOR_INTEGRATION`. A fresh verifier reviews before
any merge. Two focused repairs maximum.

Escalate rather than improvise on any Product/Spec conflict, privacy ambiguity, a needed migration or
index, a frozen-contract change, or a canonical diff outside the owned subtree.
