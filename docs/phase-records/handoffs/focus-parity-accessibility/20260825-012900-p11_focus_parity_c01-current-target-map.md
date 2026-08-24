# Focus-parity accessibility — current-target map

- Route: qualified external DeepSeek V4 Pro, read-only.
- Session: `ses_fca213808ffefNyum6h7sKdq39`.
- Verdict: `READY_BOUNDED` / parent gate `PASS`.
- Repository and Paper mutation: none; coordinator worktree remained clean.

## Current defect boundary

The three recorded repository gaps remain real, with one planned owner hunk now obsolete because Phase 11 Shell already landed it:

1. The global ordinary focus treatment is a box shadow with no outline. Forced-colors focus is now present on Owner, but public, login, and staff still have no high-contrast fallback.
2. Public and shared staff/login skip links remain parked off-screen unless `:focus-visible` matches. Owner already correctly reveals its skip link with `:focus`.
3. The owner skip link's `0,2,0` transition rule still beats the reduced-motion wildcard's `0,1,0` `transition: none`.

All three planned CSS files remain necessary. The smallest source repair is:

- `apps/web/src/index.css`: reveal the public skip link on `:focus` and add public-shell forced-colors focus fallback;
- `apps/web/src/components/staff/staff.css`: reveal the shared skip link on `:focus` and add scoped login/operations-shell forced-colors fallback without double-owning staff-board controls;
- `apps/web/src/components/owner/owner-shell.css`: include the owner skip link at equal specificity in the reduced-motion selector list.

No migration, Paper change, product decision, package/config change, or canonical baseline refresh is indicated. A default canonical diff is a stop condition.

## Verification and ownership correction

The existing milestone ownership is incomplete: it lists the three CSS files but not the browser specs required by its own pending browser/accessibility gates. Activation must add exactly:

- `tests/browser/public-baseline.browser.spec.ts`;
- `tests/browser/phase4-staff-web.browser.spec.ts`;
- `tests/browser/phase11-shell.browser.spec.ts`.

Tests should extend the existing harnesses: programmatic focus after pointer interaction is the deterministic skip-link regression proof; Playwright forced-colors must inspect a minimum-2px outline; and the owner reduced-motion test must assert the skip link has no transition. `Tab` after pointer is not a discriminating proof because it may restore keyboard modality and make `:focus-visible` match on the old code.

The later writer must forbid every Access/Audit/Health/Reporting component, `staff-board.css`, shared routes/catalogs/tokens/config, all screenshot baselines, Paper, and unrelated milestone records. Login Paper adoption remains sequenced after this slice and must not re-own `staff.css`.

The separately recorded 36px Access-successor Paper row-action finding is not silently absorbed by this repository-only map. It requires a later SOL-only Paper correction decision after the current Settings Paper lease ends; the repository Access browser gate already proves practical 44px targets.
