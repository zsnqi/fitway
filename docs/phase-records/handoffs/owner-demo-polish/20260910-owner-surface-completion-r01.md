# Owner Surface Completion r01 — handoff record

- Milestone: `owner-surface-completion-r01`
- Opened: 2026-09-10 (human-authorized audit-driven implementation pass)
- Branch/worktree: `codex/owner-demo-prep` at `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`
- Base candidate: the preserved uncommitted Owner candidate on top of `bfa4a0b`
- Source of scope: the consolidated Owner UI audit delivered 2026-09-10, plus its execution plan (sections 5–8).

## Human authorization

The owner explicitly instructed the coordinator to implement the audit and execution plan and to take the pass through implementation, live rendered inspection, independent review, verification, final presentation walkthrough, and completion. This supersedes the `owner-audit-closure-r03` `NEEDS_HUMAN` baseline-approval blocker for Owner surfaces only, under the owned-path and forbidden-path boundaries below. Paper, Public, Staff, backend contracts, credentials, demo data, and historical records remain frozen.

## Scope

Owned: `apps/web/src/components/owner/**`; Owner hooks only where an owned surface requires them; Owner-specific browser specs/support and Owner canonical screenshots; Owner visual-authority records and hashes; `scripts/owner-review.ts`, `scripts/verify.mjs`, `package.json` only if an Owner verification profile requires it; `docs/phase-records/handoffs/owner-demo-polish/**`; `PROJECT_STATE.yaml`.

Forbidden: Public and Staff implementation and canonical screenshots; `apps/server/**`, `packages/**`, schemas, migrations, OpenAPI, auth/authz, analytics and CSV contracts/transport; Paper; production data, demo history, credentials, deployment, releases; historical milestone records; existing untracked user inspection artifacts.

## Audit findings driving this pass

- Reports: control wrap and ~41% dead Report Range board; twin CSV board with ~45% empty rows; no preset feedback; no draft/applied cue.
- Controls/fields: equal-specificity date/select trigger conflict; two-tier date labels; value/unit separated by ~320px voids in Settings; 285px time inputs; two field systems on one page.
- States: CSV export renders the 168-cell heatmap skeleton; Settings error is a bare heading with a floating button; state cards and loading kits are duplicated across six-plus recipes.
- System Status: data-gated header line moves the section tab strip 29px and expands content by ~494px with no continuity; duplicated outage/incident tables; bidi-reversed fraction (`19,472 / 19,517` renders as `19,517 / 19,472`).
- Copy: owner catalogs expose governance, telemetry, version, hash, and provisioning concepts; AR/EN semantics diverge (e.g. the `/admin` description).
- Atmosphere: the two shell radial gradients are percentage-sized on the content-height shell, so the glow scales and moves with content instead of staying static.
- Review system: baselines protect sameness, not quality; 18 of 41 baselines are orphaned; approval records are existence-checked only.

## Serialized slice plan

1. Slice A — Reports composition, presets, pending cue, CSV export presentation, date-field anatomy. Status: implemented, focused tests green (reporting 30/30; owner suite 109/109), type check green; rendered verification pending in this record.
2. Slice B — unified state panels, Settings error state, System Status header stability, bidi fraction, CSV/health/settings async continuity.
3. Slice C — owner copy rewrite (AR+EN parity) across owner surfaces.
4. Slice D — atmosphere decoupling and restrained motion pass.
5. Verification — focused suites, `pnpm verify:fast`, `pnpm verify:phase`, `pnpm verify:full`, canonical Owner reconciliation with per-surface quality records, independent rendered review, live presentation walkthrough.

## Progress log

- 2026-09-10: milestone opened; ledger dependency corrected to the last DONE milestone (`owner-quality-pass-r01`); Slice A returned and accepted into the candidate; browser reconciliation scheduled next.
- 2026-09-10 (implementation): serialized slices A-E implemented and coordinator-verified live.
  - Slice A — Reports: one-line full-width range board with Last 7/28/31 presets (immediate apply, `aria-pressed`, polite applied-window announcement), pending-changes cue, compact CSV export board with rendered 366-day hint, compact export progress strip replacing the 168-cell heatmap skeleton, date-field anatomy (single label tier, 88/128/96 segments, 160px+ popups, composed trigger overrides).
  - Slice B — states/stability: health header reserves the period line in every state (tab strip y stable, 0px drift measured), OwnerAsyncSwap entry fade, `<bdi dir="ltr">` fraction isolation, Settings error unified under the Settings H1, audit state icon anatomy, unified state card modifier, per-surface reserved state heights removed.
  - Slice C — owner copy rewrite AR/EN (no telemetry/version/hash/provision jargon, unified "Data coverage/تغطية البيانات", nav names Operations/التشغيل + Access/الوصول, owner-outcome forbidden-page copy, health hero outcome lines without raw denominators).
  - Slice E — field anatomy: one field system for Settings/Access (44px value+unit groups adjacent, 5-6ch inputs, 96px weekly time inputs, single 15px/600 value type), weekly "Status/الحالة" column header fix, show/hide password toggles on both owner password fields.
- 2026-09-10 (verification): fast 646/646 unit + 120/120 simulator; phase `owner-audit-closure` 106/106; full `owner_ui_full_20260910_b` 646 unit + 120 simulator + 133/133 integration + 173/176 browser (3 intentional live-demo skips) + builds + mutation guard, repository unchanged; live desktop-demo spec 3/3 against the running stack; two load-induced timing flakes in the phase ladder were fixed with harness-only stabilization (timeout headroom on multi-capture canonical/fault tests, font-settle in `openHealth`), oracles and rendered bytes unchanged.
- 2026-09-10 (independent review): fresh reviewer reproduced every claimed fix live (1440+390, AR+EN), found one major accessibility defect (primary hover `#ff2946` at 3.71:1) and two minors (Settings header jump, residual version numeral), and confirmed repository scope PASS.
- 2026-09-10 (repair): owner-scoped primary hover darkened via `color-mix(in srgb, var(--fw-red) 86%, black)` → 5.96:1 (packages/ui untouched); Settings header constant at 69px anchor / tab y 179 across clean/loading/error; version chip reduced to save-state only (no digits); four Settings canonicals re-rendered and authority hashes reconciled (`check:repository` green).
- 2026-09-10 (closure): a second independent check verified all three fixes with measured values and swept for regressions (none); final presentation walkthrough executed live — public (23 people) → staff PIN → owner bootstrap → Daily disclosure → Reports presets/pending/CSV (`fitway-occupancy-2026-09-04-to-2026-09-10.csv`) → Access password toggle → Activity filters → Operations stability → Settings dirty/discard (demo data never saved) → EN mirror → 390px overflow-free. Milestone accepted for integration.
- 2026-09-10: visual-authority reconciliation completed. The coordinator regenerated and inspected the ten Owner canonical renders against the live product under the 2026-09-10 human authorization and accepted them; eight are honestly Paper-mapped accepted cases and two Settings frames remain regression-only. The exact bytes, per-surface judgments, and the supersession of the r03 `NEEDS_HUMAN` Owner-baseline blocker are recorded in `docs/phase-records/handoffs/owner-demo-polish/20260910-owner-surface-completion-visual-acceptance.md`; the authority manifest carries the recomputed 41-file tree hash and names that record as its `promotionRecord`. `pnpm check:repository` passes.
