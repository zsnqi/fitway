# Phase 6 b02-r02 verification-profile continuation

Date: 2026-08-11 21:00 +03:00  
Activation: `f96e5b2886eac095ae4c82fe2d240ef290254189`  
Ratified worker base: `b9290abf230d3fbd10d2bd6379aeaf0918883932`  
Green source checkpoint: `851b339bb0d51aad3e94f73beb3467f87fb9eb66`

## Discovery and objective

The Phase 6 writer completed the bounded source correction and all gates that can run under current repository configuration:

- focused TypeScript/OpenAPI: 4 files / 17 tests;
- Python: 15 tests plus compilation;
- guarded Phase 6 Postgres integration: 1 file / 5 tests;
- `pnpm verify:fast`: repository invariants, Biome, type checks, 38 unit files / 167 tests, 15 Python tests, and mutation guard.

Validation repair attempt `1/2` was consumed only by the exact Biome import/format suggestions in the new OpenAPI parity test. The worker committed a clean `IN_PROGRESS` checkpoint and stopped at the shared-config boundary.

`FITWAY_PHASE=6 pnpm verify:phase` cannot start because current `scripts/verify.mjs` has no Phase 6 entry. This is an activation/configuration omission, not a source failure or an external blocker. `docs/WORKFLOW.md` requires the focused profile to be registered before launch. Historical coordinator activation commit `a44244a01e736574707ebf5442fd833c4f380e8c` contains the exact missing five-line profile, but that commit was intentionally excluded from the clean source replay because it also carried stale ledger state.

The objective is to restore only that previously reviewed Phase 6 verification profile as a coordinator-owned configuration correction, place it on the recovery branch ancestry, then resume the same writer for the final allowed focused correction and the blocked gate.

## Independent checkpoint finding and final repair boundary

Fresh read-only checkpoint review rejected `851b339` on two related acknowledgement-correlation gaps:

1. `accept_acknowledgement` falls back to its caller-supplied `payload` when `state.inFlightRequest` is missing. That payload is not proven durable, so a valid acknowledgement can settle arbitrary transient input and mutate state.
2. `run()` branches on `sequence_gap` before calling `accept_acknowledgement`, so a schema-v1 gap acknowledgement can replace/persist schema-v2 recovery state without any durable-request correlation.

This finding consumes no additional repair by itself, but returning it to the writer will be focused repair `2/2`, the last allowed repair. The resumed writer may change only `edge/simulator.py` and `edge/test_simulator.py` for this correction:

- require a valid persisted `state.inFlightRequest`; never fall back to an unproven caller payload;
- validate and correlate acknowledgement schema version against that durable request before every response branch or mutation, including `sequence_gap`;
- drive settlement/recovery from the correlated durable request;
- for legitimate `--action replay`, persist the selected `lastRequest` as the new in-flight request before sending, so restart/correlation semantics remain durable;
- update existing direct settlement tests to establish their durable request explicitly;
- add negative regression coverage proving: missing durable request rejects with byte-identical state; schema-v1 `sequence_gap` against schema-v2 durable state rejects before recovery mutation; replay persists its request before send and remains restart-safe.

No helper/refactor outside those two files and no broader recovery redesign is authorized. If this final repair fails the same gate or the fresh verifier finds another correctness defect, the durable terminal state is `FAILED_VALIDATION`.

## Exact coordinator change

Add only this entry to the existing `phases` table in `scripts/verify.mjs`, after Phase 3 and before `baseline`:

```js
6: {
	browserFiles: [],
	integrationFiles: ["apps/server/src/phase6-offline.integration.test.ts"],
	label: "Phase 6 offline fallback, backfill, and reconciliation",
},
```

This preserves the numeric `FITWAY_PHASE=6` contract, runs no browser files for the non-UI phase, and selects exactly the guarded Phase 6 integration file. It changes no Product behavior, test-resource isolation, database safety, root manifest, lockfile, or other phase profile.

The coordinator will also update only the live Phase 6 ledger metadata to:

- persist `validationRepairAttempts: 1`;
- renew the heartbeat without changing the existing lease expiry or file authority;
- point the live handoff to this continuation record until the worker produces its green terminal candidate handoff.

The writer remains forbidden from editing `scripts/verify.mjs` or `PROJECT_STATE.yaml`; this is coordinator-owned shared configuration and live state.

## Staged continuation

1. A fresh read-only reviewer inspects source checkpoint `851b339`, the exact historical profile diff, this continuation, and the authority/gate requirements. Any source defect or profile expansion stops the continuation.
2. The coordinator applies only the five-line profile plus the three ledger metadata updates on clean `main`, runs `pnpm check:repository`, a direct profile-selection probe, `git diff --check`, and commits.
3. Cherry-pick the coordinator commit into the clean recovery branch. Confirm no conflict, exact ancestry, and a coordinator diff limited to `scripts/verify.mjs`, `PROJECT_STATE.yaml`, and this handoff.
4. Resume the same Phase 6 writer for focused repair `2/2`. It may edit only `edge/simulator.py`, `edge/test_simulator.py`, and its Phase 6 handoff. It first proves the three checkpoint-review regressions red, applies the minimal durable-correlation correction, reruns the focused TypeScript/Python/integration/`verify:fast` ladder, then restores the existing run-owned environment and runs the exact blocked `FITWAY_PHASE=6 pnpm verify:phase` gate. It may not edit shared configuration. If green, it records a clean candidate handoff and commit. Environment-only setup failures are recorded and repaired only within the run-owned resource.
5. The coordinator reviews the resulting diff/evidence. A fresh verifier then repeats the full ladder under `p6_offline_b02_v02`; only verifier PASS permits integration.

## Validation and rollback

Coordinator pre-cherry-pick checks:

```powershell
pnpm check:repository
node scripts/verify.mjs --help
git diff --check
git status --short --branch
```

The help probe must list `6` among the accepted profiles without running or mutating the guarded database; the resumed worker performs the real phase gate with its exact disposable database. Do not substitute another phase.

No reset, rebase, deletion, force operation, external provisioning, deployment, push, or source rollback is authorized. The clean checkpoint `851b339`, activation, ratification, and immutable preserved b02 candidate remain recoverable. Any conflict outside the exact profile/ledger continuation stops as `NEEDS_HUMAN`; an unexpected source-gate failure returns only to the same writer within the remaining repair budget.
