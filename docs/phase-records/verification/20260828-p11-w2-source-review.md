# Phase 11 W2 independent source review

- Stage: `phase11-e2e-propagation-wait/W2`
- Consequence: native causal/data-semantic review exceeds the external candidate's qualified low-consequence source-transcription ceiling.
- Reviewer: pre-existing independent native Sol/xhigh reviewer; read-only and separate from the GLM writer.
- Base: `8dd4d527492cef253e9e60be4cd3ddb4b37781ff`
- Raw evidence: `docs/phase-records/verification/p11-w2-source-gate-20260828/candidate.patch`
- Verdict: `FAILED_VALIDATION`

## Findings

### Blocking — request mode is not narrowed to the declared union

- Where: raw candidate `apps/server/src/phase2.integration.test.ts:1069`.
- Evidence: `w1Token` returns `string | null`; checking only for null leaves `lastMode` as `string`, which is assigned to `W1SimulatorLastRequest.mode: "live" | "backfill"`. The native gate confirmed TS2322.
- Expected: the submitted source must pass the existing server TypeScript gate before runtime verification.

### Significant — candidate was not frozen before submission

- Where: raw candidate `apps/server/src/phase2.integration.test.ts:1285` and external completion contract.
- Evidence: Biome rejected the source formatting. The completion was 2206 characters against an explicit maximum of 1500.
- Expected: the external source stage must satisfy its frozen source and compact-return constraints before independent runtime verification.

## Scope checked

The reviewer inspected the exact one-file delta against the native W2 contract, including acknowledged request/persisted-state correlation, retry rejection, pacing, exact-count deadline behavior, assertion preservation, and the unchanged 60-second test boundary. Runtime behavior was not inferred or accepted because the source gate failed.

