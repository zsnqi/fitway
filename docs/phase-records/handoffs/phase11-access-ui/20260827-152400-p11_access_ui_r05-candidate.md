# Phase 11 Access UI r05 candidate submission

- State: `VALIDATING`; not independently accepted, integrated, deployed, or pushed.
- Integrated authority/base: coordinator frontier `8f2de74ecdc1f44f5bafe1f8c4ccd4d662b1a3ab`, containing accepted Access UI r03 integration `0edb9d97fe0967148158f4a15c13294bdf97ee6e`.
- Adopted plan/activation: `14b9ebac` after final plan review PASS at `6d61a25`.
- Source commit: `00a821d6bdecde940a2ed3a7b6edd82580fe060a`.
- Branch/worktree/run: `codex/phase11-access-ui-r05-native` / `D:/Projects/fitway-worktrees/phase5-staff-integration/.codex-worktrees/phase11-access-ui-r05-native` / `p11_access_ui_r05`.
- r04 terminal `d69f459`, frozen candidate `af144fd`, and all b02/b03 history remain rejected, immutable, and unmerged.

## Source result and parent gate

Exactly three source/test files differ from the adopted plan commit:

- `apps/web/src/components/owner/access/owner-access-view.tsx`
- `apps/web/src/components/owner/access/owner-access-view.test.tsx`
- `tests/browser/phase11-access.browser.spec.ts`

The primary staff action is now one stable DOM button across provision-to-rotate refresh. Reveal keyboard handling keeps Tab/Shift+Tab on the sole dismiss action, Escape dismisses, focus returns to the same primary action, and the secret-bearing reveal is removed.

The seven-action rendered test now consumes each actual browser mutation response, correlates its `auditId` to the exact fixture audit entry and rendered action/target row, submits credentials to the login fixture, checks stale/current/replacement outcomes, uses the provisioned owner's actual UUID through deactivate/reactivate, proves old-session invalidation and fresh login without session resurrection, and preserves an unrelated owner session.

Coordinator review read the complete three-file diff and confirmed the four discriminating fault seams are present: response audit mismatch, wrong owner principal, stale credential acceptance, and replacement credential rejection. Canonical screenshots are unchanged with hashes:

- Arabic desktop: `E4CE9FA625EEDF016EA737A9D77499983BA4C3CF121A7614D5705632C212D064`.
- English mobile: `9C1058544DDC877AAE9F2075E3A05263AFC63737EAC0EFEB5C92FA1A9AA6266C`.

## Self-verification and repair accounting

Writer route: native Sol/high. Source pre-submission repairs are exhausted at `2/2`: audit semantic fixture shape, then delayed-refresh precondition.

- Focus lifecycle before source repair: 2/2 expected failures; after repair: 2/2 PASS.
- Component and hook focus: 40/40 PASS.
- Full Access Chromium file: 14/14 PASS.
- Each of the four fault modes made the exact seven-action success test fail with trace disabled.
- `pnpm verify:fast`: 65 Vitest files / 516 tests plus 117 simulator tests PASS.
- `pnpm check-types`, Biome, and `git diff --check 14b9eba..00a821d`: PASS.
- Tracked status after source commit: clean; base-to-source diff contains only the three leased files.

Coordinator hygiene correction: the ignored Playwright HTML report retained synthetic credential strings despite the writer's no-retained-secret claim. The coordinator verified the exact isolated path `output/playwright/p11_access_ui_r05_writer` was inside this worktree and deleted that disposable directory. It is regenerable but not recoverable from the worktree. No tracked source, repair count, canonical baseline, or product behavior changed.

## Submission boundary and remaining gates

Candidate freeze is pending after this record, route decision, and ledger update are committed. It must run repository invariants, formatting/lint, types, complete scope/whitespace checks, canonical hashes, focused tests, and trace-free Chromium with isolated runtime paths. The candidate is submitted only if those checks pass on the final tracked commit.

Fresh native independent review is one-way: it reruns focused and broad phase/full gates using distinct disposable resources, executes the four fault injections, performs interactive Browser plus RTL/LTR/responsive/accessibility/visual checks, and reviews the full diff. The verifier never repairs. Any independent rejection is immediately terminal `FAILED_VALIDATION`; no source repair or resubmission remains.

No open product decision is present. Stop at `NEEDS_HUMAN` only for a newly proven authority, locked-product/security/privacy, material-visual, out-of-scope, or shared-ownership conflict. Stop at this task's terminal outcome and do not start another task.

Stage 1 activation/plan: direct; plan review v3 PASS after two focused plan corrections. Stage 2 implementation: native Sol/high; coordinator gate ACCEPT after ignored-output cleanup. Sequential writing stages so far: 2 source-of-truth stages plus this candidate-record stage. Peak concurrent writers: 1; concurrent writers on a shared surface: 0. This third writing stage serves the same Access UI repair by freezing and submitting the bounded candidate.
