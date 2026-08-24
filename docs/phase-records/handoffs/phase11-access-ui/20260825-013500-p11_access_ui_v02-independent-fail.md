# Owner Access UI — independent verification failure and safe preservation

- Candidate: `work/phase11-access-ui-b01` at `181480a176896133c310eadd10273fe8b108a6b0`.
- Base / merge-base: `0ef72c2`.
- Independent verifier: fresh native SOL, run `p11_access_ui_v02`.
- Verdict: `FAIL — request changes`.
- Repair budget before/after verdict: `0 of 2` / `1 of 2`.
- Mutation during verification: none; candidate and coordinator worktrees ended clean.

## Why the green candidate is rejected

The registered verification is fully green, but it proves internal consistency against repository-authored expectations rather than fidelity to the accepted Paper authority.

1. **Blocking composition divergence.** Accepted Paper uses two sibling desktop summary cards above one owners table; mobile uses a collapsed provisioning action and a single owner board with separators. The implementation renders one full-width staff card, an always-expanded owner form, and individually boxed owner rows with materially different action composition.
2. **Blocking missing secret-free success UI.** Paper S1 requires a visible owner-created confirmation that explicitly says no credential was returned. The implementation renders no owner success state, and its unit test requires success to remain invisible.
3. **Blocking password-retention defect.** Reset password is shared component state. Cancel clears only the target owner ID, so opening reset for another owner retains the previous masked password and can apply it to the wrong principal.
4. **Significant validation gap.** Provision/reset password fields do not mirror the contract's required, minimum-12, and maximum-200 validation; blank or short input reaches generic transport failure instead of localized inline validation.

The verifier also reproduced the already-recorded owner-shell brand/navigation overlap at 200% reflow. It is inherited and outside this slice, so it did not determine the Access verdict.

## Mechanical evidence that remains useful

- Range: `26` paths, `5,093` insertions, `2` deletions; `git diff --check` PASS.
- Focused: `2` files / `34` tests PASS.
- Registered phase `p11_access_ui_v02_phase`, port `43131`, disposable database `fitway_integration_p11_access_ui_v02_phase`: repository invariants `47` milestones / `8` screenshots; Biome `342` files; types and build PASS; unit `65/510`; simulator `117`; integration `24/24`; browser `43/43`; mutation guard PASS.
- Locked backend behavior otherwise conforms: seven actions, nine typed refusals, owner-only transport, server-side owner-password hashing, secret-free owner responses/audit, and staff-only one-time PIN reveal. Excluded M4/M5, rate-limit, and workflow-gap scope remains absent.

## Rejected canonical baselines

These files are preserved as rejected evidence and are not accepted visual authority:

- `tests/browser/__screenshots__/win32/chromium/phase11-access.browser.spec.ts/owner-access-ar-desktop-1440x900.png` — SHA-256 `ACC1DC562D33366DECA05531949D50FD91DC5BA2435584CC426E67AE4D967D21`.
- `tests/browser/__screenshots__/win32/chromium/phase11-access.browser.spec.ts/owner-access-en-mobile-390x844.png` — SHA-256 `C052CA958166671509077DF4E8234BA873F49A6BDBDC04EEE8B8D866B75C3F5F`.

Matching these images proves reproducibility of the rejected composition, not Paper fidelity. No baseline promotion or acceptance is authorized.

## Safe resumable boundary

No repair was started. The rejected candidate branch/worktree remains clean and preserved at the exact head above. Its Access blobs are also already ancestors of the coordinator checkpoint branch, but the milestone is not accepted, integrated, or `DONE`; future work must create a fresh bounded repair attempt, preserve `181480a` as evidence, and address the four findings before a new freeze and independent gate. The Access lease is released and no writer owns the surface.
