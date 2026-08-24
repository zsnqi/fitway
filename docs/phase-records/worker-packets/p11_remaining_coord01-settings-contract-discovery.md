# FITWAY Settings repository contract discovery packet

Return a compact evidence map only. Do not write files, run tests/builds, read `.env`, use real environment values, access Paper, or delegate.

## Locked boundary

Editable Settings axes are exactly:

1. capacity;
2. Quiet/Moderate/Busy band thresholds;
3. weekly hours;
4. business-day boundary;
5. reset buffer.

Read-only and copied forward on every update: timezone, push interval, fresh interval, operational stale interval, and public poll interval. A schema or migration need is a stop condition. Do not include M4/M5 Access races, owner-access rate limiting, or workflow environment-documentation work.

## Questions

1. Enumerate the current `settings_versions` fields, defaults, constraints, effective chronology, and existing repository helpers with exact file:line evidence. Identify the exact stored value for each read-only timing field; do not invent a Paper value.
2. Prove or disprove that all five editable axes already fit the existing schema without migration. Treat any semantic mismatch as a stop condition.
3. Map the smallest backend contract: read-current and append-version update inputs/outputs, Zod validation rules, owner authorization precedent, router/context/server composition, and transaction boundaries. Identify which pieces already exist versus are missing.
4. Map how a successful update can atomically append `settings_versions` and emit the existing `settings_updated` audit event. Cite the governance helper and repository transaction precedent; do not propose a second audit model.
5. Identify all consumers that must copy forward read-only fields and all chronology-sensitive consumers that use `effectiveFrom`/version. Call out optimistic concurrency or lost-update risk if the existing semantics expose one, but do not invent a product decision.
6. Give the smallest migration-free implementation ownership map and focused test list, with forbidden paths and stop conditions.

## Return contract

Start with one verdict: `MIGRATION_FREE`, `STOP_MIGRATION`, or `NEEDS_AUTHORITY_CONFLICT`. Then provide a concise table and at most eight ranked risks. Every structural claim needs `file:line` evidence. End with `END-OF-MAP`. Do not paste source blocks or narrate searches.
