# Login Paper adoption r01 — independent verification report (v01)

- Verdict: PASS
- Verified implementation SHA: a5843ef5b682adcf30bd2ea2998bc36332f10725
  (parent f70b113fbff1c2657dfcb9820678146c044ca15a); evidence SHA a6cb785cda2b3c3f574e5f9e7af0ae575df7a46b
- Verifier worktree: D:/Projects/fitway-worktrees/login-paper-adoption-r01-v01 (detached at the exact SHA)
- Verifier run ID: login_paper_r01_v01

## Findings

1. Scope PASS: exactly 10 files in the implementation commit; allowed files byte-exact vs
   historical accepted state 901983b except the declared hover exception; canonical PNGs
   byte-identical; only the new hover test added to the spec.
2. Canonical hashes PASS (exact match to the two locked SHA-256 values).
3. Source/security PASS: contrast measured from rendered computed styles with layer
   compositing; WCAG math verified; fault injection genuinely exercises the rejected
   var(--fw-red-bright) state (independently reproduced at 3.7118:1); global
   --fw-red-bright token untouched (defined only in packages/ui/src/styles/globals.css).
4. Locked behavior PASS: PIN-first auth, S3/S4 disabled non-focusable field, non-enumerating
   copy, i18n login blocks byte-identical to 901983b.
5. Gates PASS from the verifier's own clean checkout: verify:fast (565 unit, 117 simulator,
   mutation guard clean); verify:phase --phase login-paper-adoption twice (37/37 browser);
   focused spec 8/8.
6. Fresh rendered review PASS: dev servers started by the verifier; rendered hover measured
   rgb(196,20,48) #c41430 with white text at 6.0174:1 in BOTH Arabic RTL and English LTR;
   fault injection measured 3.7118:1 (< 4.5); resting state 4.6439:1; screenshots visually
   confirm the dark crimson hover.

## Non-blocking findings (addressed by repair 1, commit 23d3bf46609906c8e1b027d0ca917814c2df02d2)

- The comment/evidence cited the historical 4.35:1 figure; the live rendered value of
  --fw-red-bright is 3.7118:1. Direction unchanged. Corrected in the comment and record.
- The >= 4.5 poll alone could not distinguish hover-applied from hover-not-applied (resting
  red is 4.6439:1) and would not catch future removal of the hover rule. Repair 1 pins the
  exact rendered hover color rgb(196, 20, 48) before the contrast poll in both locales.
- Evidence record's unit count (549) was an under-count from a pre-fix environment run; the
  verifier measured 565 unit tests in 71 files. Record corrected to 565.
- Verifier environment notes: detached worktree left in place; disposable database
  fitway_integration_login_paper_r01_v01 left created; verifier dev servers killed; no
  tracked file modified anywhere by the verifier.
