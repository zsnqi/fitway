# Login b03 c01 — terminal independent rejection

- Terminal state: **FAILED_VALIDATION** on fresh independent review.
- Accepted base: `c2977cd96d2a19a4b6737dee69a206a32604a895`.
- Provisional merge candidate: `901983b25e8deadaca825c47cd5d426d8998aff5`.
- History preserving rollback: `435e1e5` (`git revert -m 1`); original `work/login-paper-adoption-b03` history remains reachable.
- Coordinator repair attempts consumed: 0/2. Fresh verifier rejection is terminal for this submitted attempt under `docs/WORKFLOW.md`; no repair or resubmission occurred.

## Blocking finding

The enabled Login submit hover fails binding WCAG AA contrast in both Arabic and English S2. Stateful Axe measured white text on rendered `#eb213d` at **4.35:1**, below **4.5:1**, target `.login-panel__submit`, source `apps/web/src/components/login/login.css:360-361`. Paper `LOGIN PRODUCTION SET — CURRENT / I4 / HOVER` explicitly specifies hover `#FF2946`, so the candidate matches current visual composition authority but conflicts with binding accessibility. The registered idle-only Axe coverage did not exercise interactive hover states.

This cannot be silently repaired by the coordinator. A successor requires explicit human authority resolving the approved Paper hover value against accessibility, followed by a fresh attempt record and normal gates.

## Executed evidence

- Focused phase: PASS — 516 unit, 117 simulator, 36/36 browser.
- Full attempt 1: browser 103/104 after `/@react-refresh` alone failed `net::ERR_NO_BUFFER_SPACE`, leaving the Public page unmounted. This host incident remains preserved and is not labelled flaky.
- Unchanged Public causality run: PASS 1/1.
- Unchanged full retry: PASS — 516 unit, 117 simulator, 122 integration, 104/104 browser; run database removed.
- UI sweep: both locales at 320, 360, 390, 721, 768, 820, 1024, 1200 and 1440; S1-S5 in both locales; cold Staff redirect, keyboard/skip focus, forced colors, 200% reflow, reduced preferences, manual semantics and nonempty Arabic S2/S5 evidence.
- Paper fidelity otherwise PASS. Canonical hashes stayed unchanged: AR1440 `0BD7F93986D99E5D54DBDBBC12C84BCDE4622AC88C02C5BEFBB83A5064410584`; EN390 `5218D87031426ED358C9E7B010DF1673F4874A0717F4B61EBB143560A0395D68`.
- Independent report: `test-results/login_b03_v01/independent-review.md`; UI summary: `test-results/login_b03_v01/ui-review-summary.json`.

Safe-area runtime injection remained an explicit environment gap because Chromium 149 lacked `Emulation.setSafeAreaInsets`; source physical inset rules were inspected. No non-blocking issue was reported. Ports were released, owned databases are absent, and PostgreSQL remains running.
