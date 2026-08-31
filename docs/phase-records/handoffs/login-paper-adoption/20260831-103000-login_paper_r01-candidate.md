# Login Paper adoption r01 — candidate record

- Status: READY_FOR_INTEGRATION
- Base commit: f70b113fbff1c2657dfcb9820678146c044ca15a (codex/remaining-scope-coordinator, clean)
- Implementation candidate commit: a5843ef5b682adcf30bd2ea2998bc36332f10725
- Final candidate commit (after focused repair 1 from independent review): 23d3bf46609906c8e1b027d0ca917814c2df02d2
- Evidence commit: see history; records under docs/phase-records/handoffs/login-paper-adoption/
- Independent verification: PASS (v01, against a5843ef) —
  20260831-110000-login_paper_r01-independent-verification-v01.md
- Branch / worktree / run ID: codex/login-paper-adoption-r01 / D:/Projects/fitway-worktrees/login-paper-adoption-r01 / login_paper_r01_impl, login_paper_r01_phase, login_paper_r01_full
- Owner: glm-phase11-r01

## Human authority applied

The terminal b03 c01 rejection (enabled submit hover 4.35:1 < WCAG AA 4.5:1) is resolved by
explicit fresh human authority in favor of accessibility. Paper itself is unchanged. The
repository-local exception sets the enabled submit hover to `#c41430` (nominal white contrast
about 6.0:1) with a source comment; the global `--fw-red-bright` token is untouched. Rest,
disabled, submitting, focus, layout, and copy states are byte-identical to the accepted
historical state.

## Changes by file (vs the accepted historical state 901983b)

- `apps/web/src/components/login/login.css`: hover rule `var(--fw-red-bright)` -> `#c41430`
  with a comment naming the accessibility exception (4 inserted lines). No other delta.
- `tests/browser/login-paper-adoption.browser.spec.ts`: one new test
  ("enabled submit hover reaches WCAG AA contrast in both locales"). It hovers the enabled
  submit in Arabic and English, computes the rendered WCAG contrast ratio from computed styles
  (compositing translucent layers over opaque ancestors), requires >= 4.5:1, then injects a
  fault restoring `var(--fw-red-bright)` on hover and requires the measured ratio to drop
  below 4.5:1, proving the measurement is live. (+91 lines, no edits to existing tests.)
- All other allowed files (login-chrome.tsx, routes/login.tsx, ar.ts/en.ts staffWeb.login,
  phase4-staff-web and phase9-owner-ui compatibility hunks, both idle canonical PNGs) are
  byte-identical to the accepted historical candidate state, recovered with
  `git checkout 901983b -- <paths>`.
- Canonical hashes verified unchanged: AR desktop
  0BD7F93986D99E5D54DBDBBC12C84BCDE4622AC88C02C5BEFBB83A5064410584, EN mobile
  5218D87031426ED358C9E7B010DF1673F4874A0717F4B61EBB143560A0395D68.
- Locked behavior preserved: PIN-first staff auth, HttpOnly sessions, no synthetic identities,
  non-enumerating failures, Retry-After behavior, S1-S5 family, reload-only recovery, bdi and
  Western digits, skip-link transfer, focus parity, redirect/authorization behavior.

## Environment provisioning (no source, test, config, or record edits)

- Worktree prepared per docs/WORKFLOW.md: pnpm install --frozen-lockfile; `pnpm exec vitest
  --version` gate passed (vitest/4.1.10).
- apps/server/.env copied untracked from the coordinator worktree.
- Unit tests need process-local env values; they were loaded from the ignored apps/server/.env
  plus synthetic process-local CRON_SECRET / TELEGRAM_* values (the established FITWAY pattern),
  via a helper script kept outside the repository.
- Disposable Postgres container fitway-phase2-postgres (127.0.0.1:55432) had stopped after a
  Docker restart; it was started again. Disposable database
  fitway_integration_login_paper_r01_full was created and destroyed by nothing else.
- Phase 12 deferred defect note: with the default Windows temp path under
  "C:\Users\Pc Force\...", the five edge/test_windows_lifecycle.py watchdog/uninstall tests
  fail because the watchdog splits the client path at whitespace. This reproduces identically
  at the clean coordinator HEAD with zero candidate changes and is the explicitly deferred
  Phase 12 whitespace-safe watchdog defect. Runs set a space-free disposable TEMP
  (D:\Projects\fitway-sim-temp\<run-id>), under which all 117 simulator tests pass. No
  edge/watchdog source was modified.

## Validation commands and results

- pnpm verify:fast — PASS (mutation guard clean).
- pnpm verify:phase --phase login-paper-adoption — PASS (37 browser).
- pnpm verify:full — PASS: unit 565, simulator 117, builds web+server, all integration
  suites, browser 121/121 including accessibility and visual, mutation guard clean.
- Focused: login-paper-adoption.browser.spec.ts 8/8; phase4-staff-web + phase9-owner-ui
  16/16.
- Ladder history: 2 environment-only failures before the first green fast run (Biome format on
  the new spec, then missing process env values); both were environment/toolchain wiring, no
  candidate assertion failed, counted as implementation wiring rather than source repairs.
- Repair 1 (from independent review, non-blocking findings): corrected the measured ratio in
  the exception comment (live --fw-red-bright is 3.71:1; historical rendered variant 4.35:1)
  and pinned the exact rendered hover color rgb(196, 20, 48) before the contrast poll in both
  locales, closing the hover-unapplied/removed-rule blind spot. verify:fast re-run PASS.

## Independent verifier findings

PASS — full report: 20260831-110000-login_paper_r01-independent-verification-v01.md.
Measured rendered hover contrast 6.0174:1 in both locales; fault injection 3.7118:1.
