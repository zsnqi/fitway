# Baseline Reconciliation Gate record

- Status: `DONE`
- Base commit: `1711e6e4da42abd30e0412a0e2c6b03012d64752`
- Integrated commit: `SELF`
- Scope: stabilization only; no Phase 4 application work or phase worktrees

## Preservation checkpoints

| Material | Branch | Commit |
| --- | --- | --- |
| Dirty main candidate before reconciliation | `preserve/brg-main-dirty-20260715` | `b3a1d09217196d9c8f22b7f7f556a24ff722588f` |
| Approved visual-lab worktree | `preserve/brg-visual-approved-20260715` | `40c4abd1c8aaa4806662af44c0036f9a93bcc8be` |

The approved visual source, review prototype, curated screenshots, hashes, and supersession
rules are promoted under `visual-direction-gate/approved/fitway-theme-20260715/` and indexed by
`visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`.

## Migrated decisions

- Capacity-free public schema v2, post-v1 disclosure safety reservation (no current feature), and
  honest loading/live/delayed/unavailable/closed/error states.
- Current PIN/session/principal and persisted operational-health contract freezes.
- Business-day/timezone/effective-settings analytics semantics.
- Approved premium-athletic-minimal FITWAY theme, continuous 28-bar public signal, actual Cairo
  weights, responsive tablet band, RTL/safe-area rules, static atmosphere, and accessibility.
- Corrected remaining-phase DAG, parallel batches, integration ownership, retry/stop states,
  per-phase polish loop, and independent verification.

## Archived provenance

Superseded workflow essays, scaffold review, phase plans/handoffs, the pre-gate Design Guide and
Phases plan, VDG-A worksheet, and Stitch inputs moved to `docs/archive/` only after their durable
decisions were migrated into Product, Spec, Design Guide, Phases, ADRs, phase records, or the
approval manifest. Old G1B and Claude packages remain immutable visual lineage and are explicitly
subordinate to the current manifest.

## Resource isolation and verification

Coordinator verification completed against the uncommitted integrated candidate using run ID
`brg_final_full_20260716`, disposable database
`fitway_integration_brg_final_full_20260716`, derived Playwright port `20718`, and isolated
artifacts under `output/playwright/brg_final_full_20260716/`.

| Gate | Command/evidence | Result |
| --- | --- | --- |
| Fast repository | `pnpm verify:fast` | PASS — 29 milestones, 8 approval screenshots, Biome, types, 75 unit tests, 3 simulator tests |
| Disposable Postgres | `pnpm verify:full` with the exact run-owned URL and reset marker | PASS — 9 integration tests |
| Simulator | `pnpm verify:full` | PASS — 3 tests |
| Production build | `pnpm verify:full` | PASS — web and server |
| Preserved review prototype | isolated frozen-lockfile install and Vite build, followed by scoped generated-output cleanup | PASS |
| Browser functional | run-specific Playwright output and JUnit SHA-256 `16f5596623de1f99c382b069202e3d16f6796e1651dadb3481030dbba5edbe3c` | PASS — 14 tests |
| Automated accessibility | Axe scans, keyboard/skip-link, 200% text, reduced motion, RTL/LTR | PASS |
| Visual comparison | 6 deterministic implementation snapshots, approved-source review, plus stale-state canonical assertion | PASS |
| Clean-worktree/non-writing check | verification fingerprint before/after and `git diff HEAD --check` | PASS |
| Independent verifier | `brg_fresh_verify_20260716`; staged tree `c312b271d680420aa4a1a7dbf55a2fb6941026fb` | PASS |

The approved-source and implementation live screenshots were directly inspected in Arabic and
English at desktop and mobile sizes. Their theme, hierarchy, typography, crowd-first signal, and
responsive behavior remain aligned. The capacity-free schema-v2 stale composition necessarily
differs from the exploratory source fixture and is now guarded by its own 768×1024 deterministic
snapshot. Stale semantics and compact-surface refinement remain `VIS-003` and `VIS-004`; this gate
does not convert those phase-owned items into another product-wide redesign.

## Validation repair history

1. The first full run exposed an unreliable locale-focus assertion after skip navigation. A
   focused repair targeted the focused control and passed locally.
2. The first independent run reproduced the same gate. Stress diagnosis found the skip link's
   queued `requestAnimationFrame` stealing focus after the locale control received it. The final
   repair focuses and scrolls the hash target synchronously. The focused test then passed 30/30
   with three workers, and the complete coordinator ladder passed 14/14 browser tests.

The in-app Browser was unavailable in this environment. This is recorded as a tooling limitation,
not a product blocker: repository Playwright, Axe, deterministic screenshots, run-specific review
captures, and direct image comparison supplied repeatable browser and visual evidence.

The fresh executable verifier repeated the complete ladder using its own exact database, derived
port, and isolated output; the separate Standards and corrected Spec reviews also passed with no
remaining finding. `PROJECT_STATE.yaml` releases the BRG leases and records every gate as `PASS`.
