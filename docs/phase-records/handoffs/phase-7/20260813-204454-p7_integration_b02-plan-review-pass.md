# Phase 7 scheduled-reset integration b02 plan review

- Status: `PLAN_REVIEW_PASS`; no Stage 0 or b02 implementation edit preceded this approval.
- Base / reviewed commit: planning anchor `041e5ab2651c171c5a4bcbaae5822433f296d11f`; initial plan `bfc3601246961582ef802b600cf7c95d47c76935`; corrected plan `588ba955a34a0db20b863a1899baf3f775516fd0`.
- Attempt: fresh `phase7-integration-b02`, repair `0/2`; no branch/worktree/profile/lease exists yet.
- Independent review: the first bounded reviewer returned `FAILED_PLAN_REVIEW` for a stale ledger timestamp and optional real-session wording. Both were corrected. A fresh Terra/high reviewer returned `PASS` and found no remaining blocking/significant migration, security, activation, workflow, test, or rollback ambiguity.
- Immutable prior attempt: a content-hash comparison before and after planning proved the complete `phase7-integration` b01 milestone object unchanged; b01 remains terminal `FAILED_VALIDATION` at repair `2/2` with candidate `950a35e224c4c9f8cd03c92ce1b90e0dd96a40b8` preserved.
- Accepted corrections: production `createApp()` must prove valid signed active staff and owner cookies cannot substitute for the bearer; actual locked method routing is HEAD `405`/no-store, four unregistered methods `404`, and CORS OPTIONS `204`, all with zero cron work; Stage 0 must prove index-before-FK migration execution, DateStyle-independent keys, isolated uniqueness failures, unchanged auth enums, and direct schema-v2 omission.
- Next boundary: coordinator-only Stage 0 TDD and independent migration review. No worker activation is lawful until Stage 0 passes and is committed.
- Exact resume: `git status --short; git rev-parse HEAD; pnpm check:repository` from the coordinator worktree.
- Stop conditions: any b01 mutation, migration drift/order failure, auth or edge-contract widening, scope conflict, secret exposure, or independent migration-review failure.
