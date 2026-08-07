# ADR-003: Edge authority, commands, backfill, and reconciliation

- Status: Accepted; later lifecycle work remains phased; superseded in part on 2026-08-06
- Date: 2026-07-12; migrated 2026-07-15

> **Superseded in part by [ADR-008](ADR-008-staff-monitoring-only.md), limited to the staff manual
> fallback.** `/staff` is monitoring-only, so the fifth decision bullet below no longer describes a
> reachable path: no product surface lets staff trigger a manual fallback, and the staff-facing
> command mutations that would have created its command are retired. Automatic offline fallback,
> backfill, reconnect ordering, reconciliation, and recovery remain Phase 6 scope. Every other
> decision here — durable, monotonic, auditable commands, latest-only supersession, edge delivery
> and acknowledgement, apply-before-live on reconnect, and the separation of current from history
> authority — stands unchanged. The decision text is preserved unedited as the record of what was
> accepted.

## Context

The on-site counter is the live source of occupancy. Directly overwriting cloud current state while
the edge is online would be undone by the next push. Outages require history backfill without
allowing old buckets to rewind current truth. Corrections and resets must survive disconnects and
be auditable.

## Decision

- Accepted contiguous live pushes atomically update minute/current state, device sequence/last
  seen, and current health. Replay, gap, validation failure, disabled device, rollback, and pure
  backfill do not mutate current health/current authority.
- Commands (`set_count`, `reset_zero`) are durable, monotonic, auditable, and delivered to the
  edge. A newer pending command supersedes older conflicting pending commands.
- The edge persists and reports the highest applied command. On reconnect it applies pending
  commands before live counting resumes.
- Backfill upserts device-minute history idempotently and never advances current state.
- When the edge is unavailable, an explicit staff manual fallback may temporarily update current
  state with `source=manual` and its own validity/freshness semantics while also creating the
  command the edge will later apply.
- Zod, OpenAPI, TypeScript repositories, JSON fixtures, and Python must remain contract-parity
  checked. Phase 6 freezes the full device contract before Phase 12.

## Consequences

The edge/API/repository/simulator spine is a serial shared surface across Phases 5, 6, 7, and 12.
Current and history authority are deliberately separate. Scheduled and internally issued resets
use one command and audit lifecycle; since ADR-008 retired the staff mutations, that lifecycle has
no product-surface issuer.
