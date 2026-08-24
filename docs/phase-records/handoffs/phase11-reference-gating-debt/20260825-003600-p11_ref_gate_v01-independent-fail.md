# Reference-gating candidate — independent verification 1 FAIL

- Run: `p11_ref_gate_v01`.
- Verifier: fresh native SOL, read-only, no repair.
- Verdict: `FAIL`.
- Repair budget before review: `0 of 2`; focused repair 1 is opened.

## Passing technical evidence

- Frozen HEAD started clean and exact at `7250794`.
- Static lifecycle intent passed: synthetic environment before import, real `createApp`, dynamic import called from test time, both production/development assertions retained, and no timeout/retry/skip/mock/config behavior change.
- Focused verification passed 1 file and 2 tests in 1.10 seconds.
- Serialized full unit verification passed all 65 files and 510 tests in 50.12 seconds.
- No real environment values were read and no repair was attempted.

## Blocking provenance and registration findings

The frozen implementation commit also contains coordinator state and evidence paths. Relative to its immediate parent, it changes five tracked paths, so the candidate's recorded claim of an exact one-file parent diff is false at commit level.

The verifier also confirmed that `scripts/verify.mjs` has no exact `phase11-reference-gating-debt` profile. No unrelated profile was substituted. The stage therefore lacks the registered phase verification explicitly required by the execution contract.

## Focused repair 1

The rejected implementation is rolled back before repair. Repair 1 must produce:

1. one source-only candidate commit with exactly two owned paths: the lifecycle test and one exact registered phase profile;
2. no coordinator record in that candidate commit;
3. a separate post-candidate freeze/evidence commit;
4. focused test, the registered phase ladder, and fresh independent no-repair verification under a new identity.

No production source, other test, timeout, retry, skip, mock, browser profile, integration profile, environment schema/value, or unrelated verification behavior may change.
