# Login Paper adoption b03 — Paper-fidelity repair handoff

- Status: repaired candidate ready for coordinator review; not integrated.
- Base: candidate commit `35333d5` on `work/login-paper-adoption-b03` (preserved b03, base `0ef72c2`).
- Worktree: `D:/Projects/fitway-worktrees/login-paper-adoption-b03`; run ID `login_paper_b04_repair`.

## Authority ruling being implemented (human, حسين — this session)

`LOGIN PRODUCTION SET — CURRENT` is authoritative for **both visual presentation and all
user-facing copy** for Paper-adopted UI. Visible copy differences from the Paper set are fidelity
defects unless explicitly approved by him. This session's instruction authorized a bounded
repo-side repair of the recorded defects. Note: this ruling supersedes ADR-007's
"catalog wins for application strings" for the Login surface; the ADR text itself was **not**
edited — the coordinator should record the ruling durably.

Two defect classes were recorded by the independent visual review of `35333d5`:

1. **Copy (17 mismatches / 9 surfaces)** — the rendered `staffWeb.login` catalog strings differed
   from the Paper frames (title, description, field label, hint, submit, submitting, invalid-code
   message, unavailable message; AR rate-limited wording also differed).
2. **Presentation** — the empty-PIN idle rendered the DISABLED submit (`#242127` @ 0.82) while
   Paper idle (`B1-AR`/`B3-EN`) and the I4 anatomy render REST (`#E51935`); Paper reserves the
   disabled treatment for lockout/unavailable/submitting (S3/S4/S5).

## Repaired (all at the candidate; nothing else touched)

- `apps/web/src/i18n/messages/en.ts` — `staffWeb.login` set to the Paper copy ("Sign in",
  "Enter your access code to reach monitoring.", "Access code", "`{min} to {max} digits.`",
  "Sign in", "Signing in…", "That code didn't work. Check it and try again.",
  "Sign-in is unavailable right now. Try again shortly."). `rateLimited` already matched Paper and
  is unchanged. `eyebrow` and `pinInvalid` kept: type-required / no Paper counterpart (not recorded
  defects; left as-is).
- `apps/web/src/i18n/messages/ar.ts` — same block in Arabic ("تسجيل الدخول",
  "أدخل رمز الدخول للوصول إلى لوحة المتابعة.", "رمز الدخول", "من {min} إلى {max} رقمًا", "دخول",
  "جارٍ تسجيل الدخول…", "الرمز غير صحيح. تحقق منه وحاول مرة أخرى.",
  "كثرت المحاولات. حاول مرة أخرى بعد {n} ثانية.", "تعذر تسجيل الدخول الآن. حاول بعد قليل.").
  Bidi isolation (`isolate`) retained around interpolated digits/counts.
- `apps/web/src/routes/login.tsx` — submit `disabled={isSubmitting || retrySeconds > 0}` (was
  `!isValidStaffPin(pin) || …`). Idle now renders the REST submit; lockout/submitting keep the
  disabled treatment per S3/S4/S5. Client-side guard in `submit()` is unchanged, so an invalid
  entry still short-circuits locally (`invalid-pin`) without a network call. Auth semantics
  (normalize/validate, non-enumerating errors, Retry-After countdown, session redirect) untouched.
- `tests/browser/login-paper-adoption.browser.spec.ts` — locator/copy fallout only (heading,
  label, button names, invalid-credentials alert text). Structure and assertions otherwise
  unchanged; the b03 locator fix (`.login-panel__submit`) is preserved.
- `tests/browser/phase4-staff-web.browser.spec.ts` — locator/copy fallout only: AR label
  "رمز الدخول", AR button "دخول", AR invalid-credentials assertion "الرمز غير صحيح", EN label
  "Access code", EN button "Sign in". **This file is no longer byte-identical to `main`** — the
  b03 handoff's "unchanged" claim was true of `35333d5` and is superseded by the human's copy
  ruling; no assertion semantics were altered.
- Two canonical baselines regenerated from the repaired composition
  (`login-idle-ar-desktop-1440x900.png`, `login-idle-en-mobile-390x844.png`). They now render the
  Paper copy and the REST submit. **Final canonical approval remains the S9 human-approved
  serialized pass** — regeneration was forced by the repairs and is submitted for that approval,
  not self-approved.

Deliberately not done: no Paper edits; no ADR/AGENTS/FITWAY_PRODUCT edits; no `pinInvalid` copy
change (no Paper counterpart); no `staff.css` or shared-token changes; no verify.mjs profile
registration; no integration into `main`; no new product decisions.

## Verification (all measured in this worktree on the repaired tree)

- `pnpm check` (Biome) — PASS: "Checked 331 files in 200ms. No fixes applied." (after one
  formatter pass over the touched files).
- `pnpm check-types` — PASS: all workspace packages Done; web `vite build` succeeded.
- `pnpm exec playwright test tests/browser/login-paper-adoption.browser.spec.ts
  --update-snapshots` — 7 passed; clean rerun against the regenerated baselines — 7 passed.
- `pnpm exec playwright test tests/browser/login-paper-adoption.browser.spec.ts
  tests/browser/phase4-staff-web.browser.spec.ts` — 18 passed (7 + 11), including both canonical
  screenshot assertions and the frozen login-behavior coverage.
- `pnpm verify:fast` (root `.env` loaded into the process environment) — PASS:
  "Verification fast passed without repository mutation." (63 unit files / 460 tests collected +
  passed, cron suite included, Python simulator suites passed, mutation guard clean).

Not verified here: fresh independent visual review of the repaired candidate against Paper
(required next), the `FITWAY_PHASE=login-paper-adoption verify:phase` profile (still unregistered),
and S9 human baseline approval.

## Remaining

1. Coordinator: record the human authority ruling (Paper copy > catalog for Paper-adopted UI)
   durably and reconcile it with ADR-007's wording.
2. Independent visual re-review of this repaired candidate against `LOGIN PRODUCTION SET —
   CURRENT` (the S8-style gate that flagged the original defects).
3. S9 human-approved serialized pass over the two regenerated baselines.
4. Register the `login-paper-adoption` phase profile in `scripts/verify.mjs`; record the milestone
   in `PROJECT_STATE.yaml`; integrate into `main`.

## Recommended next session

Mode: `review` — independent visual re-review of the repaired candidate at the canonical pairs
(AR 1440 ↔ Paper `WBP-0`, EN 390 ↔ Paper `W7T-0`, plus the state family), then coordinator
activation per the items above.
