# Owner Settings contract discovery — migration-free map

- Route: qualified external DeepSeek V4 Pro, read-only.
- Session: `ses_fca4d053fffeM8p1nkyInwWv5X`.
- Verdict: `MIGRATION_FREE` / parent gate `PASS`.
- Repository and Paper mutation: none.

## Existing storage authority

All approved editable axes already exist in append-only `settings_versions`: capacity; three ordered band thresholds; nullable paired weekly open/close times; business-day boundary; and reset buffer. A schema or migration is not indicated.

The read-only/copy-forward fields are already stored: timezone plus push `20s`, fresh `90s`, operational stale `180s`, and public poll `60s`. These current stored values must be read from the current row and displayed as locked operational timing. They must never become update inputs.

## Smallest backend boundary

New migration-free work is still required: Settings Zod contracts/procedures, current-read and append-version repository/service behavior, owner context/router/server wiring, and focused tests. Existing infrastructure to reuse:

- owner authorization procedure;
- append-only settings schema and effective chronology;
- `appendAuditEntry`;
- `buildSettingsAuditEntry` with `settings_updated` and the inserted settings version;
- transaction precedent from Access.

The update transaction must lock/read the current row, copy forward all five read-only fields, append the new editable version, obtain its version, and append the existing settings audit entry atomically. Omitting read-only columns is a correctness bug because database defaults would silently replace current values.

## Risks and stop conditions

- Concurrent appends have no existing optimistic-concurrency guard; the written spec must either reuse a proved safe serialization/lock precedent or stop for a new product/concurrency decision.
- Equal `effectiveFrom` values are ordered by version and chronology-sensitive consumers rely on that order.
- Weekly pairs and band ordering require contract validation; business-day boundary has no DB range check.
- Any discovered need for schema/migration, editable operational timings, a second audit model, or Product/Spec conflict stops implementation.

This map is authority input for the SOL-only Settings Paper successor and the later written migration-free specification. It is not itself permission to start Settings UI.
