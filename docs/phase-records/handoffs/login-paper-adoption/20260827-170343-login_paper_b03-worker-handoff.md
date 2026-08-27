# Login Paper adoption b03 — worker candidate handoff

- Status: candidate ready for coordinator review; not integrated.
- Base commit: `0ef72c2f54e8faa16f24c368990ea5cc62693138` (`main`).
- Branch / worktree / run ID: `work/login-paper-adoption-b03` /
  `D:/Projects/fitway-worktrees/login-paper-adoption-b03` / `login_paper_b03`.
- Attempt label: b03 (b01 terminal, b02 preactivation-blocked; per the S8 slice in
  `docs/phase-records/handoffs/coordinator/20260816-224000-completion-preflight-and-remaining-execution-plan.md`).

## Completed

Re-established the authoritative accepted Login design and reused the preserved, Paper-validated
b01 candidate as a fresh b03 candidate on current `main`, fixing only the known test-locator
defect.

Authoritative inputs consulted (unchanged, not edited):
- `docs/adr/ADR-007-paper-visual-source-of-truth.md` — Paper is the visual source of truth;
  `LOGIN PRODUCTION SET — CURRENT` is an approved production family.
- `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml` — Paper identity `01KYPX5AF950XZVVDD88B6J7QB`
  and the four approved production families.
- `docs/phase-records/handoffs/login-paper-adoption/20260809-233200-login_paper_b01-activation.md`
  — frozen behavior, authority split, reference measurements, owned/forbidden paths.
- `docs/phase-records/handoffs/login-paper-adoption/20260810-000500-login_paper_coord01-failed-validation.md`
  and `20260811-133335-login_paper_b02-preactivation-blocked.md` — the failure was a test-locator
  defect only; no implementation change is indicated.

Implemented files (composition reused byte-identical from b01 candidate `9b65356`):
- `apps/web/src/routes/login.tsx` — route adapted to the Paper composition; frozen auth
  semantics preserved (PIN normalize/validate, non-enumerating errors, Retry-After countdown,
  disabled/submitting semantics, session redirect, skip-link focus transfer).
- `apps/web/src/components/login/login-chrome.tsx` — full-bleed `LoginRail` (text-only language
  toggle + FITWAY wordmark/slash mark), `LoginStatusMessage` (error/delayed/offline tones),
  `LoginSubmittingIndicator`.
- `apps/web/src/components/login/login.css` — atmospheric wash, glass rail/card, responsive
  spacing, control treatments, exception states, focus visibility, reduced-motion and
  reduced-transparency fallbacks, forced-colors fallback.
- `tests/browser/login-paper-adoption.browser.spec.ts` — responsive/RTL/zoom/a11y/exception-state
  browser coverage plus two canonical `toHaveScreenshot` assertions.
- Two canonical baselines under
  `tests/browser/__screenshots__/win32/chromium/login-paper-adoption.browser.spec.ts/`.

The single deliberate change vs b01 is the locator fix in the submitting-state test (see Decisions).

## Exact current state

- Branch `work/login-paper-adoption-b03` at base `0ef72c2`; the seven candidate files (six
  implementation files plus this handoff) are committed at the branch tip, which is the candidate
  commit. Working tree is clean.
- `tests/browser/phase4-staff-web.browser.spec.ts` is byte-for-byte unchanged (not in the diff).
- No `scripts/verify.mjs`, `PROJECT_STATE.yaml`, `staff.css`, shared catalog, existing browser
  spec, screenshot baseline, Paper artifact, or normative source changed.
- The gitignored root `.env` (copied from the coordinator checkout for local verification) is
  present but not tracked; it will not be committed. Disposable review captures are under
  `output/playwright/login_paper_b03/` (ignored).

## Decisions

- Human (recorded, unchanged): canonical screenshot baselines are required for final adopted Paper
  surfaces; a new platform baseline is generated/approved only in a serialized human-approved pass.
- Worker (reused b01 candidate byte-identical): the b01 composition and its two baselines are
  already Paper-validated, so this candidate does not rebuild them. No product/authority decision
  was made or changed here.
- Locator fix (the only source change vs b01): in the "exception and submitting visuals" test,
  `const submit = page.getByRole("button", { name: "Open operations" })` became
  `const submit = page.locator(".login-panel__submit")` — a stable owned selector that still
  resolves once the accessible name changes to the submitting copy during submission.
- Did not touch `staff.css`: the S7 focus-parity slice owns the shared `/login` forced-colors and
  skip-link treatment per the coordinator plan; login's own forced-colors fallback lives in
  `login.css` here.
- Did not register a `login-paper-adoption` profile in `scripts/verify.mjs` (root test/config
  script, coordinator-owned at activation); verified via the equivalent direct commands instead.

## Remaining

1. Coordinator activation: register the `login-paper-adoption` phase profile in
   `scripts/verify.mjs` (additive, mirroring b01 activation `471d3a3`) and record the
   `login-paper-adoption` milestone activation in `PROJECT_STATE.yaml`.
2. Fresh independent implementation + visual review against Paper (required by the S8 slice).
3. Canonical `toHaveScreenshot` baseline approval (S9, human-approved serialized pass) — see Blockers.
4. Integration into `main`; `login-paper-adoption` → `DONE`.

## Blockers

None for the candidate itself; two items are flagged for the coordinator, not silently resolved:

1. **Canonical baselines are reused, not re-approved.** This candidate carries the two b01
   baselines forward byte-identical (they matched the current locked toolchain — the canonical test
   passed without update). Final canonical approval remains the S9 human-approved serialized pass;
   the coordinator decides whether these reused baselines satisfy it or are regenerated there.
2. **S7/S8 forced-colors ownership note.** The coordinator plan states S7 owns `/login`
   forced-colors/skip-link in `staff.css` and is "already integrated by the time S8 runs"; in the
   current tree S7 is not yet integrated and the b01 `login.css` already self-contains login's
   forced-colors fallback. This candidate does not touch `staff.css`; the coordinator should
   reconcile ownership at integration.

## Verification

Run ID `login_paper_b03`. The unit-test ladder requires the gitignored root `.env` loaded into the
process environment (`CRON_SECRET`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `BETTER_AUTH_URL`,
`CORS_ORIGIN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`); without it two server unit files fail
before any assertion. All results below were measured on the candidate (base `0ef72c2` + the seven
candidate files).

- `pnpm check` (Biome) — PASS: "Checked 331 files … No fixes applied."
- `pnpm check-types` (types + web build) — PASS: all workspace packages Done; web `vite build`
  2187 modules, `dist/assets/login-*.css` (9.74 kB) emitted.
- `FITWAY_RUN_ID=login_paper_b03 pnpm exec playwright test tests/browser/login-paper-adoption.browser.spec.ts`
  — PASS: 7 passed (8.9s), including the previously failing submitting-state test and both
  canonical `toHaveScreenshot` assertions (reused baselines matched).
- `FITWAY_RUN_ID=login_paper_b03 pnpm exec playwright test tests/browser/phase4-staff-web.browser.spec.ts`
  — PASS: 11 passed (12.6s); the file is byte-for-byte unchanged, proving frozen login behavior
  (labels, button names, error semantics, redirects) survived the composition change.
- `pnpm verify:fast` (with `.env` loaded) — PASS: repository invariants, Biome, type checks,
  63 unit files / 476 tests, Python simulator 117 tests OK, and "Verification fast passed without
  repository mutation."

Not verified in this slice (flagged, not hidden): fresh independent visual inspection against
Paper (deferred to the independent-review gate; the composition is byte-identical to the b01
candidate already compared against Paper at 1440/390/320), and the `FITWAY_PHASE=login-paper-adoption
pnpm verify:phase` profile (not yet registered — see Remaining).

## Recommended next session

Mode: `review`, then `plan` for activation/integration. Independently review the b03 candidate on
`work/login-paper-adoption-b03` (base `0ef72c2`) against Paper's `LOGIN PRODUCTION SET — CURRENT`,
confirming the locator fix is the only source change vs the preserved b01 candidate `9b65356`,
that `staff.css` and `phase4-staff-web.browser.spec.ts` are untouched, and that the reused
canonical baselines render the approved composition. Then decide (human, if needed) whether the
reused baselines satisfy the S9 canonical-baseline requirement or require the serialized
human-approved regeneration, register the phase profile, activate the milestone, and integrate.
