# Phase 2 record — Simulated edge to Public Live

- Status: `DONE`
- Integrated commit: `928f3b3737e474be630a603e97bf54659a8ce8d4`
- Commit date: 2026-07-13 (Asia/Riyadh)
- Original message: `feat: deliver phase 2 occupancy vertical slice`

## Accepted outcome

Phase 2 delivered the tracer bullet:

```text
Python simulator → device-authenticated Hono push → transactional occupancy engine
→ Postgres current/minute state → cache-safe public payload → Arabic/English Public Live
```

It established sequence/replay/gap behavior, minute idempotency, count floor, device-token
authentication and rate limiting, current/history separation, freshness, polling/visibility,
OpenAPI, deterministic fixtures, real-Postgres integration tests, simulator tests, and thin
browser coverage.

## Supersessions

The original plan and schema version 1 included `percentFull` and a numeric capacity meter.
Those public fields and behaviors are superseded by strict capacity-free schema version 2 and
the continuous 28-bar band-derived signal. Edge ingestion, private settings, historical
capacity snapshots, sequence semantics, and public cache/current-state boundaries remain.

The original detailed plan is retained at
`docs/archive/plans/phase-2-implementation-plan-20260713.md` as history only.

## Historical evidence

The Phase 3 closure handoff reports that the combined Phase 1–3 baseline later passed lint,
types, production build, 67 unit/component tests, 9 integration tests, 6 browser tests,
3 simulator tests, and `git diff --check`. These figures are historical reported evidence;
the current baseline verification is recorded separately.
