# Login Paper adoption r01 — final-candidate delta verification v02

- Verdict: PASS
- Verified commit: `23d3bf46609906c8e1b027d0ca917814c2df02d2`
- Prior independently verified commit: `a5843ef5b682adcf30bd2ea2998bc36332f10725`
- Verifier checkout: `D:/Projects/fitway-worktrees/login-paper-adoption-r01-v01`
  (detached, clean before and after)
- Run ID: `login_paper_r01_final_v02`

## Delta and scope

`a5843ef..23d3bf4` is ancestry-valid and changes only `login.css`, the focused Login browser
specification, and the candidate record. `git diff --check` passed. The repair pins the exact
rendered hover color before the contrast poll in both locales and corrects the source comment's
rejected-state ratio. The global `--fw-red-bright` token and both locked Login canonicals remain
unchanged.

## Independent evidence

- `pnpm test:browser -- tests/browser/login-paper-adoption.browser.spec.ts` — PASS, 8/8, at the
  exact verified commit.
- Arabic rendered hover: `rgb(196, 20, 48)`, white text, `6.017373:1`.
- English rendered hover: `rgb(196, 20, 48)`, white text, `6.017373:1`.
- Fault-injected `--fw-red-bright`: `rgb(255, 41, 70)`, `3.711812:1`.

The exact-color assertion closes the prior hover-unapplied or removed-rule false-pass seam; the
fault injection proves the contrast measurement remains live. No blocking delta gap remains.

## Environment note

The existing frozen-install shims were intact, but plain `pnpm exec` did not inject
`node_modules/.bin` on this host path. The verifier confirmed Vitest 4.1.10 and Playwright 1.61.1
with a process-local PATH addition; the repository browser script itself ran normally. No tracked
file or production environment changed.

