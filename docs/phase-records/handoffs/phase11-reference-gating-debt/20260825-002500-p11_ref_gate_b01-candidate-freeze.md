# Reference-gating lifecycle hardening — candidate freeze

- Run: `p11_ref_gate_b01`.
- Owner: direct native SOL coordinator under a one-file repository lease.
- Candidate path: `apps/server/src/reference-gating.test.ts` only.
- Repair budget used: `0 of 2`.
- Candidate status: frozen for fresh independent no-repair verification.

## Non-vacuous correction

The test no longer imports the full server module inside `beforeAll`. Its existing synthetic environment is established at module scope, and a small helper awaits the real `createApp` dynamic import from inside each test. The production and development assertions, endpoints, real application factory, and coverage are unchanged.

No production source, test runner configuration, timeout, hook timeout, retry, skip, mock, known-flaky record, or unrelated test changed.

## Self-check evidence

- Focused, unique run `p11_ref_gate_fix01`: 1 file and 2 tests passed in 1.11 seconds.
- Serialized full unit run `p11_ref_gate_fix01_full`: all 65 files and 510 tests passed in 10.36 seconds.
- Repository `pnpm check-types`: all workspace checks passed, including server TypeScript and the production web build.
- `git diff --check`: clean.
- Parent diff gate: exactly one tracked file changed, with both original assertions retained.

All runtime environment values were synthetic and test-only; no real environment or secret value entered a worker packet or durable record.
