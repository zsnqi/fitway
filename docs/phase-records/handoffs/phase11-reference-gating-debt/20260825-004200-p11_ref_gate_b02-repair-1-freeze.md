# Reference-gating lifecycle hardening — repair 1 freeze

- Repair run: `p11_ref_gate_b02`.
- Frozen source commit: `9b874e7`.
- Exact parent: `b52ddb1`.
- Exact candidate paths: `apps/server/src/reference-gating.test.ts`, `scripts/verify.mjs`.
- Repair budget used: `1 of 2`.

## Candidate provenance

`git diff-tree` for `9b874e7` names exactly the two leased paths. No coordinator state, record, production source, unrelated test/profile, environment schema, timeout, retry, skip, or mock is in the source candidate commit. Later coordinator records do not alter those two frozen files.

## Correction

- The real server dynamic import moved from `beforeAll` into a helper awaited by each test.
- Synthetic test environment values remain established before import.
- The real `createApp` factory and both production/development assertions remain intact.
- `scripts/verify.mjs` adds exactly one `phase11-reference-gating-debt` profile with no integration or browser files; the normal fast ladder already owns this unit-only debt.

## Self-check

- Focused `p11_ref_gate_b02_focus`: 1 file, 2 tests passed in 1.11 seconds.
- Registered `p11_ref_gate_b02_phase2`: repository invariants passed; Biome passed 357 files; every workspace type check and web production build passed; all 65 unit files and 510 tests passed in 10.07 seconds; all 117 simulator tests passed; mutation guard passed.
- The first registered launch stopped before test execution on a stale active branch/worktree collision. A separate coordinator ledger commit corrected Access UI back to its preserved candidate branch/worktree; no source repair was needed.

The candidate is frozen. Fresh independent verification 2 is read-only and may not repair.
