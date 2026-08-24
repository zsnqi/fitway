# Reference-gating unit debt — discovery and native reproduction

- Run: `p11_ref_gate_b01`.
- Discovery route: qualified DeepSeek V4 Pro, repository read-only, session `ses_fca76bebfffex7E2YDXQ1UCuCH`.
- Runtime reproduction: native SOL coordinator with unique run identifiers and synthetic test-only environment values.
- Verdict: `PASS_WITH_CORRECTION`.

## Root-cause boundary

`apps/server/src/reference-gating.test.ts` performs the full server module dynamic import in `beforeAll`. That import constructs the application but does not issue a database query. The repository config raises `testTimeout` to 20 seconds but does not raise `hookTimeout`, leaving this setup under Vitest's shorter default hook budget. The neighboring cron test already demonstrates a dynamic import inside an individual test.

This supports a one-file lifecycle correction: set the existing synthetic test environment before the import and move the real `createApp` dynamic import into the test body. Production assertions and the real application factory remain mandatory. Timeout inflation, retries, skips, mocks, and configuration changes remain forbidden.

## Native evidence

- The first focused attempt stopped before test execution because the ambient checkout lacked required server environment values; this is not a product or assertion failure.
- A focused run with a synthetic test envelope passed one file and two tests in 3.34 seconds.
- A partial-envelope full run passed 64 files and 508 tests; two unrelated cron tests failed because their additional database/auth values were absent.
- A serialized full `pnpm test` rerun with a complete synthetic test envelope passed all 65 files and 510 tests in 9.08 seconds.

The historical hook-timeout symptom did not reproduce on this checkout. The debt remains a defensible test-lifecycle hardening candidate, not a currently reproduced failing test. Any implementation requires a newly recorded route, a one-file lease, focused and full verification, a frozen candidate, and fresh independent no-repair review.
