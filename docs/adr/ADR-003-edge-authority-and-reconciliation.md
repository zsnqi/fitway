# ADR-003: Edge authority, commands, backfill, and reconciliation

- Status: Accepted; later lifecycle work remains phased
- Date: 2026-07-12; migrated 2026-07-15

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
Current and history authority are deliberately separate. Scheduled resets use the same command
and audit lifecycle as human operations.
