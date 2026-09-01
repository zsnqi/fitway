# Desktop demo candidate 3

- Status: `CANDIDATE` — final focused repair and author verification complete; terminal
  independent review pending.
- Base commit: `5ebb22998a9e65b8f9fa751d66edc55e13f4bf4e`.
- Rejected candidates: `c2a58f9882e9dcd434a86a3f4abaf364078d554c` and
  `7141759810719b29600f133e76240778b6f4d546`.
- Branch / worktree / run ID: `codex/desktop-demo` /
  `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration` /
  `desktop_demo_c03`.
- Repair budget: `2/2` focused candidate repairs used; another validation recurrence is terminal
  `FAILED_VALIDATION` under repository policy.

## Candidate-2 rejection and final repair

Candidate 2 removed credentials from helper and Chromium environments and disabled tracing, but
the independent reviewer proved from the installed Playwright 1.61.1 implementation that its HTML
reporter serializes `locator.fill()` values in step titles. The Staff PIN could therefore persist
inside the report payload even on an ordinary run.

Candidate 3 removes both persistence paths:

- Staff authorization still uses the real `/api/auth/staff/pin` endpoint and real secure cookie,
  but the unmocked browser invokes it without a value-bearing Playwright `fill` action.
- Demo verification forces `--trace=off` and `--reporter=line`; the repository HTML and JUnit
  reporters are not created for this credential-bearing live proof.
- The test worker continues to remove both credentials from its environment before launching
  Chromium with an explicitly sanitized environment.
- A unit assertion fixes both non-persistent Playwright flags as part of the demo safety contract.

The candidate-2 deterministic history, credential-environment sanitation, prepare migration/port
checks, status ownership/readiness checks, real password constraint, and every scope boundary
remain unchanged.

## Candidate-3 evidence

- Focused guard/profile tests: `2` files / `6` tests PASS.
- Workspace types/build: PASS.
- Unmocked live Chromium: `3/3 PASS` covering populated Public, real Staff PIN authentication,
  Staff-to-Owner 403, real Owner password authentication, and populated Owner surfaces.
- After the proof, `.local/demo` contained only runtime secrets, edge token/state, profile, and
  owned-process records. No Playwright report, JUnit result, trace, screenshot, or browser artifact
  existed.
- Complete binary/plain runtime scan found neither synthetic credential value.
- Stop and exact cleanup PASS; runtime directory, Compose container/network/volume, and listeners
  on 3100/3101/55432 were absent.
- `pnpm verify:fast` with complete process-local synthetic server environment: repository
  invariants PASS; Biome `501` files PASS; workspace types/build PASS; Vitest `73` files / `572`
  tests PASS; Python simulator `117` tests PASS; mutation guard PASS; exit `0`.
- `git diff --check`: PASS.

## Terminal review request

Review this immutable commit against both prior rejection records. Confirm that no raw credential
can enter a helper/browser environment or persistent Playwright artifact, while the Staff and
Owner proofs still use real authentication and authorization. Reconfirm deterministic reset,
lifecycle safety, operator documentation, architecture reuse, and unchanged exclusions. Do not
edit or repair the candidate.
