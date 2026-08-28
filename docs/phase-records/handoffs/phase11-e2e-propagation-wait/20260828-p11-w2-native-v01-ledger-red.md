# Phase 11 W2 native verification v01 — focused PASS, stale-ledger fast red

## Completed

- Fresh native tester verified exact candidate `0e5f2aae017c19b6d0b7e036ba3ae9c8046c6d27` and source SHA-256 `884b3a503a4209b3042ec1b352e3ae44d9db424713d06fd7bbcf08a9ea821dff` in a clean worker tree.
- The real focused Phase 2 path passed on its first and only run with isolated Postgres/port/process resources.
- The required fast ladder was red at repository invariants. Phase/full were correctly not run, and all owned resources were removed.

## Exact current state

- Focused result: 1 passed, 8 skipped; test body 20.66s under the unchanged 60s boundary; Vitest 21.68s; process wall 22.527s.
- Accepted sequence reached 4: three live acknowledgements plus exactly one forced backfill continuation. Backfill persisted count 10; final live/current count 3; all three exact DOM waits passed inside their ACK+5000ms deadlines.
- Worker candidate remains clean and unchanged at `0e5f2aa`.
- No resource remains: owned container/DB, ports 55435/43035, temp root, and matching processes were removed.

## Decisions

- This verification run remains red; it is not recorded as a fast/phase/full PASS.
- The fast failure is attributable to the verification branch's stale coordinator-owned `PROJECT_STATE.yaml`, which still records the original W1 lease ending 2026-08-28 21:30 Asia/Riyadh. The authoritative coordinator ledger records the active human-exception lease through 2026-08-29 07:00. The candidate changed only the integration test and cannot repair or own the ledger.
- Correct environment repair is provisional integration of the frozen one-file source into the authoritative branch, followed by a fresh full ladder there. This is not a source correction, repair4, timeout change, or rerun-to-green of the same environment.

## Remaining

1. Apply the exact candidate file to the clean authoritative coordinator branch and commit it as a provisional integration boundary.
2. Use a fresh run ID and disposable resources to run focused, fast, phase, and full against the authoritative ledger.
3. If any substantive gate fails, preserve/revert the provisional integration and restore terminal `FAILED_VALIDATION`; no source repair is authorized.

## Blockers

- None to the corrected authoritative verification environment. Uptime remains blocked until W2 reaches terminal coordinator outcome.

## Verification

- Focused integration: PASS on first run; artifact hashes recorded at `docs/phase-records/verification/p11-w2-native-v01-20260828.json`.
- An earlier fast harness call with leaked `FITWAY_PHASE` was invalid before repository checks and preserved. The corrected fast command failed at the stale lease invariant and was not rerun.
- Phase/full: NOT RUN.
- Cleanup and tracked-clean proof: PASS.

## Recommended next session

Provisionally integrate the exact candidate file into the authoritative coordinator branch, then run a fresh isolated focused/fast/phase/full ladder. Do not alter source, state semantics, timeouts, assertions, or repair accounting.

