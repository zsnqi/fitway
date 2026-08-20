# Phase 10 UI/CSV b04 — coordinator activation

- Recorded: 2026-08-20 23:00 +03:00.
- Authority: execution plan S2 and the recorded 2026-08-16 human decision to repair to approved Paper, not supersede it.
- Activation baseline: post-S1 `main` at `e9f56e38caaa00351ef69958f5d73b3b38e3a890`; this activation commit is recorded as `baseCommit: SELF`.
- Planned branch / worktree / run ID: `codex/phase10-ui-csv-b04` / `D:/Projects/fitway-worktrees/phase10-ui-csv-b04` / `p10_ui_csv_b04`.
- Immutable provenance: `codex/phase10-ui-csv-b03` remains exactly at `4c253dee003722f1e9c8805be95a162193345abe` and will not be rebased, amended, moved, or deleted.

## Objective

Carry the valid b03 content forward non-destructively, then repair only the approved Paper-fidelity gap: page heading/local switch, followed by reporting and CSV range controls grouped together, followed by the dominant 7×24 heatmap, followed by comparison/disclosure. Controls use two columns on desktop and stack at `<=820px`; the reporting extension must occupy the approved reporting-page composition rather than remain below sibling Owner sections.

## Authority and rendered evidence

- Paper file `01KYPX5AF950XZVVDD88B6J7QB`, `FITWAY UX Exploration`, Page 1, area `OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT` (`17YY-0`), token hash `3b0faca3`.
- Runtime Paper inspection on 2026-08-20 reconfirmed the exact file, page, area, token hash, and current hierarchy/dimensions. The image renderer timed out without returning data; no Paper node changed. The immutable rendered comparison and five-row failure matrix at `20260816-211500-p10_ui_csv_b03-paper-fidelity-needs-human.md` remain the accepted visual evidence for the same approved source/hash.
- `docs/adr/ADR-007-paper-visual-source-of-truth.md` governs composition; `DESIGN_GUIDE.md` governs responsive, RTL, interaction, and accessibility behavior.

## Scope and leases

- Owned implementation: reporting components, owner-reporting hook/tests, Phase 10 UI/CSV browser spec, and b04 handoffs exactly as recorded in `PROJECT_STATE.yaml`.
- Exclusive wiring-only lease through 2026-08-23 23:00 +03:00: `packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, `apps/server/src/index.ts`, `apps/web/src/routes/admin.tsx`.
- Frozen reporting contracts/repository, all database surfaces, shared catalogs/tokens, canonical screenshots, verification scripts/configuration, Paper, and normative documents are forbidden.

## Gates before implementation

1. Create the fresh branch/worktree from this activation commit and prepare it from the frozen lockfile; confirm Vitest and local environment readiness.
2. Non-destructively carry forward b03 content while preserving the b03 ref and records unchanged; review the resulting diff before any fidelity edit.
3. Write a bounded fidelity plan from the approved rendered evidence and current code, with exact rollback and verification; obtain a fresh independent plan-review PASS.
4. Only then assign one authoritative writer for the repair.

## Required verification and closure

- `pnpm check-types`; `pnpm verify:phase --phase phase10-ui-csv`; `pnpm verify:fast`; Phase 10 integration on an exact disposable database.
- Browser/UI polish loop at 320/390/768/820/1024/1440 in English LTR and Arabic RTL, including keyboard, focus, reduced motion, accessibility, and responsive overflow.
- Fresh read-only rendered Paper fidelity comparison and fresh independent candidate review. No Paper edit and no canonical-baseline regeneration.
- On PASS: integrate to `main`, mark b04 `DONE`, release wiring lease. A second material composition disagreement becomes `NEEDS_HUMAN`.

## Blockers

- None. Planning/review is the next stage; implementation is not yet authorized.
