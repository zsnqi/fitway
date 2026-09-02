# FITWAY fidelity/integration closure r04 failed validation

## Completed

- Preserved r04 repair-2 candidate `6036de9a86f8c826bd64ae45be90830a8c920b94` unchanged and
  unintegrated after the exact full verification gate.
- Ran fresh independent Standards and Spec reviews. Both independently found the same hard defect
  and no other source, product, accessibility, visual, security, or scope finding.
- Stopped the still-running rendered review once the source rejection made r04 terminal; it made no
  repository or runtime changes. Rendered review will restart on the successor's exact candidate.

## Exact current state

- r04 is terminal `FAILED_VALIDATION` with repair budget `2/2` consumed.
- Candidate: `6036de9a86f8c826bd64ae45be90830a8c920b94`; base:
  `b1bc91c4028eb02083ea59dc73a3c8c03614c767`.
- Canonical `main` remains `8f5ff99a9e48722a9cb44b6124833099f3704f42`; r04 was not integrated.
- r01, r02, r03, and r04 records and candidates are immutable history.

## Decisions

- TanStack Query adds the mounting observer before it evaluates `refetchOnMount`. The r04 predicate
  `query.getObserversCount() === 0` is therefore false for the first real observer, whose count is
  already `1`; stale cached Daily/time-context data cannot refresh on a real route remount.
- r04's durable claim that normal stale first-observer remount refresh was restored is inaccurate.
  Its late-observer and reconnect regressions do not unmount all observers, remount `/admin`, and
  prove request two.
- No repair 3 is authorized. The required correction moves to the same-scope r05 successor instead
  of rewriting r04 history or bypassing independent review.

## Remaining

- Successor r05 changes only the observer predicate and adds the missing stale full-route remount
  request-count regression, then repeats focused/full verification and all independent reviews.

## Blockers

- r04 terminal validation failure: first-observer remount semantics are incorrect.

## Verification

- `pnpm verify:fast`: `572/572` unit and `117/117` simulator tests passed, with repository,
  formatting, types/build, and mutation guards green.
- Fresh `pnpm verify:full` on exact disposable database
  `fitway_integration_fidelity_r04_repair2_full`: `19/19` integration files and `133/133` tests
  passed in `376.25s`; browser/accessibility passed `133` executed tests with three intentional
  desktop-demo skips in `1.2m`; both builds and mutation guard passed.
- Independent Standards: `FAIL` on the observer-count timing and missing remount regression.
- Independent Spec: `FAIL` on the same defect; no other findings.

## Recommended next session

Continue only through r05. Do not edit r04, reuse its full result as final acceptance, or widen the
successor beyond the exact first-observer predicate and missing route-remount proof.
