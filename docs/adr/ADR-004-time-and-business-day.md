# ADR-004: Time, business day, schedule, and settings history

- Status: Accepted; Phase 3 foundation integrated
- Date: 2026-07-13; migrated 2026-07-15

## Context

Gym operations cross midnight, Friday hours differ, analytics must not depend on a viewer's device
timezone, and changing settings must not rewrite historical meaning.

## Decision

- Store timestamps in UTC; render/evaluate using one configured IANA gym timezone (default
  `Asia/Riyadh`, confirmed on site before go-live).
- Attribute minutes to a configurable business-day boundary (default 04:00 local).
- Store weekly open/close per weekday. `close <= open` means close on the next calendar day.
- Store settings as append-only versions with `effectiveFrom`. Historical queries resolve the
  version effective at each instant; they never apply today's settings retroactively.
- A scheduled reset is owned by the settings version effective immediately before its close. Freeze
  that version, its reset buffer, and the resulting due instant at close; an exact-close or later
  settings change applies only prospectively and never transfers or recomputes the pending reset.
- Store required band/capacity/settings snapshots with minute history so later configuration
  changes do not rewrite old analytics.
- All user-facing time uses gym timezone and Western digits. Arabic uses localized `ص/م`; English
  uses `AM/PM`.

## Consequences

Phase 3 semantics are dependencies for current health snapshots, scheduled resets, analytics, and
settings governance. DST/offset logic must use timezone-aware primitives rather than fixed offset
arithmetic even though the pilot default currently has a stable offset.
