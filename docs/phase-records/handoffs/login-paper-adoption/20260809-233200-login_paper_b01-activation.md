# Login Paper adoption activation handoff

- Status: `IN_PROGRESS` — activated for one bounded implementation worker.
- Base commit: `SELF` in the activation commit whose parent is
  `61da3471b8f347e3dec432445b1c99cacbdbaa33`.
- Branch / worktree / run ID: `work/login-paper-adoption-b01` /
  `D:/Projects/fitway-worktrees/login-paper-adoption` / `login_paper_b01`.
- Shared leases: none. The exact owned and forbidden paths are recorded in
  `PROJECT_STATE.yaml`.

## Outcome required

Adopt the approved Paper family `LOGIN PRODUCTION SET — CURRENT` for `/login` in application code.
Implement its full-bleed identity rail, atmospheric background, adaptive glass sign-in card,
responsive spacing, control treatments, exception-state styling, focus visibility, reduced-motion
fallback, and reduced-transparency fallback.

Paper file: `FITWAY UX Exploration`. The approved family contains authored Arabic and English
screens at 1440, 768, 390, 320, and representative 200% text zoom; invalid-code, lockout,
unavailable, submitting, and field-focus states; keyboard-order, control-anatomy, reduced-motion,
reduced-transparency, and non-colour evidence. Paper records no open Login product decision.

## Authority split and frozen behavior

- Paper governs visual composition under ADR-007. Repository code remains the behavioral source.
- Preserve the current message catalogs and rendered copy. Do not edit `apps/web/src/i18n/**`.
- Preserve the existing `/login` route, session redirect, PIN normalization and validation,
  non-enumerating authentication errors, server-provided retry duration/countdown, disabled and
  submitting semantics, navigation, and skip-link behavior.
- Preserve `tests/browser/phase4-staff-web.browser.spec.ts` byte-for-byte; it is accepted behavior
  evidence, not a baseline to rewrite.
- Do not alter `/`, `/staff`, `/admin`, the Staff or Owner shells, global tokens, shared UI
  components, the approved provenance snapshot, or Paper.
- The approved adoption removes Login's boxed 72px header, language pill, opaque decorated panel,
  lock icon, eyebrow, watermark, and accent rail. It uses the Paper full-bleed rail, text-only
  language ink, FITWAY wordmark/slash mark, atmospheric wash, and measured glass card.
- Paper's local filled-action values are approved: resting `#e51935`, hover `#ff2946`, and pressed
  `#c41430`. Reuse repository tokens where an exact value already exists; keep any new value local
  to Login.

## Exact implementation ownership

- `apps/web/src/routes/login.tsx`
- `apps/web/src/components/login/**`
- `tests/browser/login-paper-adoption.browser.spec.ts`
- Login-only baselines below
  `tests/browser/__screenshots__/**/login-paper-adoption.browser.spec.ts/**`
- `docs/phase-records/handoffs/login-paper-adoption/**`

Everything else is forbidden. Stop and request a coordinator lease before any broader edit.

## Acceptance and validation

1. Existing Login behavior tests remain unchanged and pass.
2. The focused adoption test covers Arabic and English idle layouts, 1440/768/390/320 widths,
   representative 200% zoom, invalid credentials, rate limit, service failure, and submitting.
3. Keyboard order, visible focus, 44px targets, RTL/LTR, no horizontal overflow, reduced motion,
   reduced transparency, and Axe serious/critical results are verified.
4. Login-only canonical screenshots are asserted for a minimal representative matrix. Disposable
   review captures may cover the wider matrix.
5. Type checks, Biome, `pnpm verify:fast`, and
   `FITWAY_PHASE=login-paper-adoption pnpm verify:phase` pass with a unique run ID.
6. A fresh independent implementation review and visual review pass before integration.

## Reference measurements from Paper

- Desktop: 56px rail with 40px inline inset; stage inset 48px; card 480px wide, 40px padding,
  28px gap and radius; heading 30/42; body 16/28; input 56px; action 52px.
- Tablet/mobile rail: 52px. Mobile stage inset 16px; card uses the full available width with 24px
  padding and gap, 28px radius, 26/38 heading, 15/26 body. At 320 the family tightens without
  removing content.
- Glass: rail blur 14px/saturate 112%; card blur 22px desktop and 18px mobile. Reduced
  transparency uses solid `#171316` with blur removed while preserving the atmospheric wash.
- The card uses Cairo and existing FITWAY semantic colours; controls retain 56px/52px practical
  targets. Arabic remains authored RTL and PIN digits remain Western/LTR.

## Stop conditions

- Any product/copy/authentication/validation/lockout change, or need to touch a forbidden path.
- Any conflict between Product/Spec and Paper that cannot be resolved by the ADR-007 authority
  split.
- Material invention outside the approved Login family.
- The same validation failure after two focused repair attempts.

## Exact resume command

```powershell
Set-Location 'D:/Projects/fitway-worktrees/login-paper-adoption'
git status --short --branch
git rev-parse HEAD
pnpm exec vitest --version
```
