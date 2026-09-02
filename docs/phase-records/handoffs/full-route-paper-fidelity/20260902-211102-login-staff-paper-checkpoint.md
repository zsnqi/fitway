# Login and Staff Paper checkpoint

- Milestone: `full-route-paper-fidelity-r01`
- Status: focused route-family checkpoint complete; final full-route acceptance remains pending
- Paper token content hash: `3b0faca3`

## Authority fixed to exact rendered leaves

The route authority manifest now pins all 30 Login responsive/state leaves, all 38 Staff
composition leaves, and 13 Login/Staff interaction, focus, preference, contrast, and responsive
contract frames by Paper node identifier, repository path, byte count, and SHA-256. Repository
verification hash-checks all 98 currently recorded Paper exports and fails on drift.

Login remains visually accepted without product-source changes. Direct Paper-to-route review at
desktop and mobile found the accepted composition, hierarchy, spacing, typography, and state
treatments intact. The routed header continues to use the locked real FITWAY asset in Paper's
assigned brand position; the historical Paper circle-slash drawing is not reintroduced.

Staff also remains structurally intact. Exact comparison found one narrow drift class hidden by the
old implementation-generated baselines: routed interface copy had diverged from Paper while the
geometry still matched. The repair changes only represented wording and context-specific health
labels: `Monitoring` / `لوحة المتابعة`, Paper's concise load failure, open/closed, update/opening,
counting-device, `Working`, `Stable`, and `Unstable` wording. It does not change data semantics,
state selection, authentication, polling, routing, monitoring-only scope, or layout.

Direct rendered review after the correction found the desktop and mobile compositions in the same
Paper family with matching geometry and hierarchy. Runtime timestamps remain data-driven instead
of copying Paper's illustrative clock value. The real FITWAY asset remains the locked shared brand
substitution already approved by the human.

## Focused verification

- `pnpm check-types` — PASS.
- focused Staff component unit test — PASS, 5/5.
- Login and Staff pre-change preservation run — PASS, 36/36.
- corrected Staff state/responsive review excluding only rejected canonical snapshot assertions —
  PASS, 24/24, including 768, 390, 320, and 200%.
- corrected Staff Phase 4 behavior/accessibility suite — PASS, 11/11.
- corrected Staff desktop state review — PASS, 6/6.
- `pnpm check:repository` — PASS with 98 hash-verified Paper exports.

The old canonical screenshot assertions are deliberately not updated in this checkpoint. They
remain hash-frozen rejected r05 provenance until the final rendered and human acceptance stage.

## Next dependency

Proceed to `PUBLIC CROWD BOARD PRODUCTION SET — CURRENT`: export/hash its exact leaf authority,
then repair the complete Public route and states before beginning Owner page families.
