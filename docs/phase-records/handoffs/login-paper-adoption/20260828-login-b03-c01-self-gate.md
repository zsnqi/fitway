# Login b03 c01 — coordinator self-gate and submission

- Status: VALIDATING, final independent gates pending. Main adopted the bounded
  20260828 coordinator integration plan before execution; one coordinator source writer.
- Official branch: codex/remaining-scope-coordinator. Accepted base c2977cd;
  activation 4b5107a1584695d0c78804dff638d6ef480f0871.
- Merge eb2e3dad73fd0af24bd5d925c83ef052ace86c9a with normal no-ff history; clean textual
  union preserved newer focus tests. Original candidate/worktree remains unchanged.
- Four compatibility changes only: Login plain-focus skip reveal, local forced-colors
  rules, Staff-route context for the unchanged operations probe, one Phase9 translated
  Login heading. Additive verification profile and dated ADR-007 human-authority
  reconciliation are coordinator-owned. No backend/auth contract or global token edit.
- Initial regression reproduced before fixes: skip-link top -66.225px; focused test
  green afterward (1/1). This was the plan's initial red/green implementation, not
  reopening historical Login attempts. Prospective integration repair count remains 0/2.

## Executed evidence

Self gates measured the uncommitted merge at activation 4b5107a with fingerprint
fa2f1c4fcd91e5c862ca5c3dde76f62be0b99adb50d6d9fab96d6e66a917a958, not a later commit.

- pnpm verify:fast PASS: 65 files, 516 unit tests, 117 simulator tests.
- pnpm verify:phase --phase login-paper-adoption PASS: same fast counts plus
  36 browser tests (Login7, Staff11, Owner5, Shell5, Public8); JUnit 0 failures/errors/skips.
- Runtime CSS fault injection: removing Login focus rule yielded none/0px and failed
  the existing assertion; removing only Staff operations selectors yielded none/3px
  and failed the existing solid assertion while Login remained solid/2px.
  Both stylesheets restored exactly. Initial controls found no tests due to Windows
  grep quoting; one approved ignored-harness correction, no source repair.
- Source/status fingerprint unchanged, ports24433/24434 released, no DB operations.
  Secret scan:13 retained files, zero actual environment-secret matches.
- Artifacts: test-results/login_b03_c01/{final-summary,self-gate-summary,negative-controls-summary}.json,
  redacted logs/JUnit; output/playwright/login_b03_c01_phase/review.
- Main independently inspected exact compatibility diff, phase JUnit36/36 and AR1440/S5EN320 renders.

The two submitted Login canonicals are unchanged:
AR1440 SHA256 0BD7F93986D99E5D54DBDBBC12C84BCDE4622AC88C02C5BEFBB83A5064410584;
EN390 SHA256 5218D87031426ED358C9E7B010DF1673F4874A0717F4B61EBB143560A0395D68.
Acceptance remains pending fresh independent Paper/Browser fidelity, nonempty AR S2/S5
renders, phase/full verification, and coordinator review of executed artifacts.

## Other durable authority/evidence in this commit

The human's GLM-5.3-Flash authorization and subsequent content-based clarification
are recorded separately. No file-type-only exclusion remains for eligible .env/config
content; actual secrets/private data stay excluded. No V4, Terra or Luna invocation occurred.

Original synthetic GLM probe: one actual opencode-go/glm-5.3-flash/high invocation,
four reads/three edits across exactly two allowed files, no retry, five tests PASS,
scope/canary/Git intact. Main independently confirmed exact replacements and hashes.
The raw CLI export hash 64c501b30b8e48d56e20ef4e6e590cdf5f572dcff6693021fc39cc4f97f961dc
differs from the saved export be197a565ea0e6a5b3c223cc876464fe87b365a2e871f8eaac57c8fa2185225a
only by final CRLF versus LF; additive correction preserves original evidence.
This proves only a supervised two-file export/consumer rename, not broad production
qualification. Evidence: test-results/node_modules/p11_glm_synthetic_20260828/evidence.

## Next gate / rollback

Commit provisional merge C, then freeze after all records. Fresh independent reviewer
judges C under the adopted plan. No source writes during review; no automatic snapshot
promotion. Fresh rejection is terminal for this submitted attempt. Before commit abort
merge; afterward revert merge with first-parent semantics if required, never reset.
No push/deploy. Settings remains held; propagation planning is read-only.
