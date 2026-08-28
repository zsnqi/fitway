# Login Paper adoption b03 — independent review 2 record (candidate `2979bdb`)

- Reviewer: fresh read-only subagent (independent of both repair sessions and review 1), 2026-08-27.
- Candidate: `2979bdb` (b03 repair 5) on `work/login-paper-adoption-b03`; review of diff
  `b0f7e15..2979bdb` plus a full regression sweep.
- Evidence path: reviewer's own live Paper MCP measurements on file `01KYPX5AF950XZVVDD88B6J7QB`
  (area `V39-0`; read-only) and its own Playwright run — 18/18 passed, both canonical
  `toHaveScreenshot` baselines matched byte-for-byte, `pnpm check` PASS.

## Verdicts

1. **Repair conformance (Arabic field direction) — PASS.** Authority inputs measured `rtl` on
   every Arabic card (`WBX-0` idle, `W0S-0` S2, `VX2-0` S3, `VPZ-0` S5) and direction-neutral/ltr
   on English (`WBB-0`, `W00-0`); the candidate now inherits direction (`dir` and CSS `direction`
   removed, `text-align: start` follows the inline edge) and asserts computed `rtl`/`ltr` in the
   spec at 1440/768/390/320. Western digit order preserved (bidi; phase4 mixed-input test fills
   `12a٣34-56` and asserts logical `123456`).
2. **Regression safety — PASS.** S2 value retention + submit enabled, S5 read-only 0.82/#151316 +
   red action + spinner, S3/S4 non-focusable 0.72 treatment + disabled action + Western digit in
   the lockout message, keyboard/focus/zoom, reduced motion/transparency, frozen phase4 login
   tests — all pass; canonical baselines unchanged.
3. **No other departures — PASS** (spot-check of S1–S5 both locales, I3/I4 disabled anatomies;
   rail/brand LTR confirmed consistent with Paper and untouched).
4. **Scope discipline — PASS.** Diff is exactly `login.tsx` (−1), `login.css` (−1/+3), the
   adoption spec (+13/−1), and the repair-5 handoff.

**Findings: none.**

## Recorded residual inference (for حسين's review awareness)

No rendered non-empty Arabic field capture exists in the browser evidence (AR captures are idle;
state captures are EN-320). AR non-empty rendering is proven by computed-direction equivalence
with the Paper AR cards plus bidi determinism, not by a rendered AR S2/S5 screenshot. Everything
else in the verdict is directly measured.

## State after this record

- Candidate `2979bdb` carries independent review PASS (round 2) with no findings; rounds 1–2 and
  repairs 1–5 are durably recorded in this directory.
- Open items, coordinator-owned and outside this task: حسين's confirmation of the S4 reload-based
  retry semantics (flagged repair 4, judged conformant twice); S9 serialized pass over the two
  regenerated canonical baselines; `scripts/verify.mjs` phase profile registration;
  `PROJECT_STATE.yaml` milestone record; integration into `main`; `edge/windows/run.ps1`
  space-quoting defect routing.
