# Phase 7 reset evaluator advisory resume plan

- Status: advisory plan for a future **fresh resumed attempt**; no code change and no activation.
- Existing `phase7-reset-evaluator` b01 remains `FAILED_VALIDATION` with two repair attempts.
- This record does not authorize a third b01 repair. A coordinator must create a new branch,
  worktree, run ID, activation handoff, rollback boundary, and reset attempt counter before work.
- No human/product decision is indicated by the advisory root-cause investigation. Repository
  authority and executable regressions must independently confirm it at activation.

## Root-cause hypothesis to verify

`evaluateScheduledReset` performs DST-sensitive wall-time resolution for each settings version
during candidate generation, before ownership filtering. A nonexistent local time can therefore
throw from a non-owning or obsolete version and abort evaluation before the valid version wins.
Both paths must be covered: direct close conversion and the opening-resolution path through
`evaluateSchedule(version, beforeClose)`.

The prior ordering repair was orthogonal. The prior sampled-offset relevance heuristic used
synthetic instants that do not represent the requested local time and can produce false-positive
and false-negative ownership.

## Required invariant

1. Candidate generation is total: one settings version cannot abort evaluation of another.
2. Wall-time resolution represents exact, ambiguous-fold, and nonexistent-gap outcomes explicitly.
3. Ownership checks use only real timeline instants.
4. A fold keeps the established earlier matching instant.
5. A gap supplies a real forward-resolved instant for ownership evaluation while preserving the
   existing policy that an ultimately selected unresolved gap is rejected.
6. Apply one ownership rule across the full settings history after candidate generation; only the
   winning candidate may surface unresolved schedule validity.
7. Results are independent of `settingsVersions` input ordering.

## Required regression-first matrix

- The prior obsolete-version and active-transition-window verifier counterexamples.
- The untouched opening/evaluateSchedule throw path.
- Standalone selected nonexistent close still rejects.
- Fold ownership and established earlier-instant behavior.
- Exact `effectiveFrom` boundary semantics and during-buffer transitions under repository authority.
- Irrelevant past/future versions and settings-history order independence.
- Preservation of all currently accepted close, past-midnight, business-day, supersession, and
  idempotency cases.

Only after the matrix is red may a fresh worker replace the partial converter with a total resolver,
make both close/opening candidate generation total, filter ownership once across the full history,
then sort/select and surface a gap error only for the winner. No migration, schema, route, API, UI,
environment, or product-contract change is expected.

Validation for a future attempt: focused reset/API tests, Biome/types, `verify:fast`, the registered
Phase 7 gate under new run/database identifiers, and a fresh independent verifier reproducing the
former failures. Until activation, the preserved rejected branch and terminal record remain the
only executable history.
