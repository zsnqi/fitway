# Reference-gating unit debt — coordinator DONE

- Accepted source candidate: `9b874e7`.
- Exact parent: `b52ddb1`.
- Exact source paths: `apps/server/src/reference-gating.test.ts`, `scripts/verify.mjs`.
- Repair budget used: `1 of 2`.
- Final status: `DONE`.

## Acceptance

Fresh independent verification 2 returned `PASS` with zero repair. It confirmed literal two-path provenance, byte-identical frozen files under later coordinator records, real `createApp` behavior, preserved production/development assertions, no timeout/retry/skip/mock change, and exactly one registered unit-only phase profile.

Independent evidence:

- focused 1 file / 2 tests passed;
- registered profile passed repository invariants, Biome, all workspace type checks and web build, 65 files / 510 unit tests, 117 simulator tests, and mutation guard.

The coordinator then ran a fresh serialized post-integration profile `p11_ref_gate_coord_post01`. It again passed repository invariants, Biome, all workspace type/build checks, 65 files / 510 unit tests in 11.14 seconds, 117 simulator tests in 28.164 seconds, and mutation guard.

The test lifecycle debt is closed without production mutation, timeout inflation, retries, skips, mocks, or real environment values.
