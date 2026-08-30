# Phase 11 Settings r01 independent rejection

## Completed

Frozen repair-2 candidate `74f6f69cc3116e3b93e858600e9d94bfba4594b0` completed the self phase, fast, and full ladders and fresh executable/Paper verification. Fresh independent code review rejected it after finding six malformed conditional class strings that concatenate the base control class and error modifier.

## Exact current state

`phase11-settings-r01` is terminal `FAILED_VALIDATION` at repair 2/2. Its candidate remains committed and unintegrated on `codex/phase11-settings-b01`; no commit is amended or rewritten.

## Decisions

The defect is accessibility/visual correctness, not a product choice: scalar and weekly time inputs can expose `aria-invalid` and associated error text while losing both the normal control class and the intended error-border modifier. Full Axe cannot detect this class-token failure. The accepted error treatment remains unchanged.

## Remaining

Standing human authority opens `p11_settings_r02` from this exact candidate to separate the class tokens and add scalar plus weekly-time visual regression coverage, including forced-colors behavior, then repeat verification and fresh review.

## Blockers

None.

## Verification

Self: 565 unit, 117 simulator, 11 phase integration, 61 phase browser, 133 full integration, 113 full browser, builds, and mutation guards PASS. Fresh executable phase: 565/117/11/61 PASS. Fresh Paper review: PASS. Fresh code review: FAIL only for malformed invalid-control classes; auth, audit, concurrency, privacy, editable-boundary, locked-copy, state-transition, and lower-frontier repairs passed.

## Recommended next session

Continue only the bounded r02 successor from `74f6f69`; do not integrate r01 or revisit accepted product/Paper decisions.
