# `p11_focus_parity_v01` independent review

Verdict **FAILED_VALIDATION** on frozen candidate
`a7f517ae743f7679e251b2e8f8a35c4da0388745` against activation base
`c04e7a9f892bd921d8aa2d81608a8a611e969512`.

## Findings

### Significant — operations-shell forced-colors behavior is not discriminatingly tested

The candidate adds the `.operations-shell` forced-colors selector at
`apps/web/src/components/staff/staff.css:943-944`, and the distinct production shell is mounted at
`apps/web/src/components/staff/staff-shell.tsx:41`. The added forced-colors assertion at
`tests/browser/phase4-staff-web.browser.spec.ts:552-568` runs in the login test and exercises only
`.login-shell`. Removing the `.operations-shell` selector would therefore leave every new assertion
green. The approved target map explicitly requires a scoped login **and operations-shell** fallback,
so this is a significant coverage gap and blocks integration.

The coordinator independently confirmed these locations and the non-discrimination after the
reviewer returned. No candidate edit or repair was made.

### Blocking verification gap — required browser command did not execute in reviewer sandbox

The fresh reviewer attempted the exact three-spec Chromium command with run
`p11_focus_parity_v01`, port `43381`, and run-local output. It exited before test collection with
`'playwright' is not recognized as an internal or external command`. The candidate worktree's
Playwright shim had passed the coordinator's escalated readiness check before implementation and the
author later passed 24/24, so this is reviewer execution-environment evidence, not evidence that the
candidate removed Playwright. It still leaves the independent executable browser gate absent and
cannot be treated as PASS.

## Independent evidence

- Pre-review and post-attempt `git status --short`: clean.
- Candidate/base identity: `a7f517a` / `c04e7a9`.
- Full range scope: exactly three CSS files, three existing browser specs, and three run-local
  handoffs; no canonical screenshot or unrelated source path.
- `git diff --check c04e7a9..a7f517a`: PASS.
- Canonical screenshot/image diff: empty.
- Required Chromium gate: NOT EXECUTED because the reviewer sandbox could not resolve the prepared
  Playwright shim.
- `pnpm verify:fast` and `pnpm check:repository`: not run by the reviewer because its first required
  gate was red and the review contract required stopping.

Static review confirmed the intended public/shared skip-link rules, preserved Tab/Enter assertions,
2px `Highlight` forced-colors declarations, owner reduced-motion specificity override, and exclusion
of staff-board controls. Those confirmations do not close the missing operations-shell non-vacuity
proof.

## Gate consequence

Independent review is `FAIL`. Repair attempts 1 and 2 are already consumed, so no repair 3,
integration, or `DONE` transition is permitted for this attempt. The candidate remains preserved and
unintegrated. The reviewer made no write and no product or visual decision.
