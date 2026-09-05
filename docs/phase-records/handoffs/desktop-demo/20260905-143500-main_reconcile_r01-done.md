# Main reconciliation + post-promotion demo verification — 2026-09-05 (main_reconcile_r01)

- Status: DONE (reconciliation merge + stale-assertion repair + fresh verification).
- Base / divergence: common base `afa2ef6`; `main` held 2 docs-only commits
  (`de28659` r05 DONE claim, `ea3da72` walkthrough findings) while
  `codex/fidelity-integration-closure` held 15 fidelity-repair commits ending at
  `0dcf5bb` (`full-route-paper-fidelity-r01` DONE). Fast-forward was not clean,
  so reconciliation used a history-preserving merge, not a rewrite.
- Merge: `12444f4` (merge `main` into fidelity branch). `PROJECT_STATE.yaml`
  keeps HEAD truth (`r01–r05 FAILED_VALIDATION`, successor
  `full-route-paper-fidelity-r01 DONE`); the superseded main-only r05 DONE claim
  (`20260902-155539`) and walkthrough (`20260902-164414`) are preserved as files
  and noted as history in the coordinator `owner` text. `updatedAt` corrected to
  `2026-09-05T14:34:27Z`. No Paper, product, schema, or hosting change in merge.
- Stale-assertion repair (test-only, 1 line): `tests/browser/desktop-demo.browser.spec.ts`
  still asserted the pre-fidelity 403 sentence "live operations" while accepted
  commit `0dcf5bb` had already shipped the approved EN copy "This staff session
  can use monitoring but cannot access Management." (`apps/web/src/i18n/messages/en.ts:138`)
  and updated the sibling nav assertion ("Owner area" → "Management") but missed
  this line. Fixed the assertion to the approved copy; no product change.
- Owned paths used: `PROJECT_STATE.yaml`,
  `tests/browser/desktop-demo.browser.spec.ts`,
  `docs/phase-records/handoffs/desktop-demo/20260905-143500-main_reconcile_r01-done.md`.
  Forbidden paths untouched (no `apps/web`, `apps/server`, `packages`, `edge`,
  schema/migration, Paper, baselines, manifests outside the merge).

## Validation commands and results

- `node scripts/verify-repository.mjs` → PASS (68 milestones, 8 canonical
  approval screenshots, 424 visual-authority cases, 228 Paper exports, 41
  rejected r05 screenshots).
- `verify:full` run `main_reconcile_r01` (disposable Postgres
  `fitway_integration_main_reconcile_r01` on `127.0.0.1:55433`,
  `DOTENV_CONFIG_PATH=apps/server/.env` via `node -r dotenv/config` plus
  process-local `CRON_SECRET`/`TELEGRAM_*` sentinels):
  invariants PASS; Biome 512 files PASS; types PASS; unit 74 files / 599 PASS;
  simulator 117 PASS; build PASS; integration 19 files / 133 PASS;
  browser 140 passed / 3 skipped / 1 failed — `phase11-shell` canonical
  `owner-shell-ar-desktop-1440x900.png`, 126 antialiased pixels (ratio 0.01),
  identical to the known concurrent-ladder drift recorded at r02.
  Focused rerun of `phase11-shell.browser.spec.ts`: 7/7 PASS. No baseline change.
  Raw log: `output/verification/main_reconcile_r01-verify-full.log` (ignored).
- Fresh live `demo:verify` on the integrated candidate (loopback demo stack,
  synthetic profile fingerprint `7fcf38a1719053a25b3c007ff2ac18cf8490c9cfed2efa15fbb3d2f4d9ea7489`,
  Riyadh business day 2026-09-05):
  first run 2/3 (stale "live operations" assertion, see above);
  after the 1-line repair, rerun 3/3 PASS
  ("Demo API, authentication, authorization, and live browser proof passed").
  Raw logs: `output/verification/main_reconcile_r01-demo-verify.log` (1 fail) and
  `...-r02.log` (3/3 PASS), both ignored. Synthetic credentials were process-local
  only and cleared; never written to disk, command lines, logs, or URLs.

## Browser/a11y/visual artifacts

- None promoted or modified. Canonical baselines byte-identical. No Paper work.

## Independent verifier findings

- None commissioned in this slice (coordinator-executed reconciliation +
  mechanical stale-assertion repair + ladder reruns). The 126px shell drift was
  attributed by rerun evidence, not by baseline edit.

## Remaining work or exact blocker

- None for reconciliation. `main` fast-forwards to the tip containing this record.
- The login hover-contrast exception (`login-paper-adoption` terminal record)
  remains open as before and is outside every accepted case's depicted state.

## Exact resume command

- No resume needed. For audit: `git log --oneline -3` on `main`, then
  `node scripts/verify-repository.mjs`.

## Stop/escalation conditions

- Reached DONE: `main` contains the accepted closure plus this repair; durable
  state coherent; post-promotion live demo proof recorded 3/3.
