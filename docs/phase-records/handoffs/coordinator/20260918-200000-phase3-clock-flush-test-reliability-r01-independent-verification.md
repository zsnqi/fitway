# phase3-clock-flush-test-reliability-r01 — independent verification

- Verdict: **PASS**.
- Acceptance meaning: the candidate may move to **`READY_FOR_INTEGRATION`** under the plan's
  explicit D4 carve-out. This is not a `verify:full` pass, not `DONE`, and not an integration
  commit.
- Verifier independence: this session did not implement or repair the candidate. Its only durable
  repository write is this report; its other outputs are ignored artifacts under
  `test-results/phase3_clock_flush_test_reliability_r01_independent_v2/` and the corresponding
  configured Playwright output path.
- Candidate: branch `codex/owner-distill-r01`, HEAD
  `1a24a973570371949008a7a5f037c47b818c0e01`, worktree
  `C:/Users/Pc Force/.codex/worktrees/6d57/phase5-staff-integration`, uncommitted on the preserved
  dirty frontier, `integratedCommit: null`.

## 1. Findings by severity

### Blocking / high / medium

None.

### Low / informational

1. The requested verifier run id
   `phase3_clock_flush_test_reliability_r01_independent_v2` is 54 characters, but
   `apps/server/src/test-support/integration-database-safety.ts` hard-rejects run ids longer than
   40 and requires the database name to be exactly `fitway_integration_<runId>`. No source was
   changed to bypass that safety contract. The authoritative run therefore used the unique safe
   alias `p3_clock_flush_independent_v2` and disposable database
   `fitway_integration_p3_clock_flush_independent_v2`; all logs remain in the explicitly assigned
   long-name evidence directory. This is an invocation-only limitation, not a candidate defect.
2. The first authoritative invocation reached the Phase 3 integration step and failed because
   that new disposable database did not yet exist. The exact isolated database was then created
   and the same command was rerun successfully. Per `docs/WORKFLOW.md`, this was environment
   provisioning, not a candidate repair and not repair-budget consumption. The failed provisioning
   attempt is retained as `logs/01-phase3.log`; the authoritative passing result is
   `logs/02-phase3-rerun.log`.
3. The current/fresh full-ladder status captures each show 230 entries and identical pre/post
   hashes. The live candidate now has 231 entries because the governance-only frozen-history
   `.sha256` companion was added after those ladders. The interrupted verifier's focused gates and
   this verifier's final Phase 3 ladder both exercised the 231-entry candidate; the latter has an
   identical pre/post whole-repository fingerprint. The late companion does not change executable
   code, state, history, lockfile, or either full-ladder failure set.
4. The fresh preparation record did not capture a pre-install lockfile hash because its
   pre-install mechanism depended on the not-yet-installed `yaml` package. It did record a
   successful `pnpm install --frozen-lockfile` with “Lockfile is up to date”, a post-run 256587-byte
   hash `d386db6f36a7bf3df699767408f86e0d32aa987bf37e9b3de27ee31b315fb827`, and a clean lockfile
   status. I independently compared the surviving fresh worktree lockfile to the source worktree
   and HEAD identity; the bytes and hash match. This is adequate corroboration, but the absent
   pre-install hash line is a capture limitation.

## 2. Candidate scope and exact diff review

I compared the live candidate directly with the preserved r08 fresh replay at
`C:/Users/Pc Force/AppData/Local/Temp/opencode/r08-fresh-replay` and with the HEAD blob.

- `tests/browser/phase3.browser.spec.ts` is 4655 bytes, SHA-256
  `947126bf588d707644f4df2676e5122dcb4e1c895cf0718f67491ba30001e607`. Its complete diff is
  exactly the two authorized one-character argument changes:
  `page.clock.fastForward(0)` to `page.clock.fastForward(1)` at the closed-payload notify flush
  (current line 94) and open-payload notify flush (current line 118). No locator, assertion,
  timeout, payload, request-count, waiting-budget, comment, or product behavior changed.
- `scripts/project-state-history-transition.mjs` differs from r08 only in the comment label and
  the successor anchor path/SHA-256 pin. Current identity: 21439 bytes,
  `b63c1d669be16f86377f525389afd6c8a5e80e5d6bd7d54d995a20b23d69c672`.
- `scripts/project-state-history-transition.test.ts` differs from r08 only in the real-repository
  expectations: 98 to 99 anchored milestones, r08 transition wording/hash, before count 99, and
  added id r07 to r08. Current identity: 24114 bytes,
  `91dd8a3abcfffa3faf092e149f76e19ea02909b44e75fc9186d5487a6d83349a`.
- `scripts/verify-repository.mjs` differs from r08 only in the displayed anchor-era label
  `pre-r08` to `pre-phase3-clock-flush`. Current identity: 13835 bytes,
  `6007d4bd1d722c1fb00ed53c1d17841f1bdfeed2a306d7882d87933e2c8fe767`.
- `PROJECT_STATE.yaml` contains the single active successor milestone and its exact ownership,
  forbidden paths, lease, history mutation, and `IN_PROGRESS` state. Current identity: 6787 bytes,
  `3561e6d4ce82f39feaad705cfa225a57d8766d716e5530f2e3bf905ff8c56128`.
- `PROJECT_STATE_HISTORY.yaml` is an exact 310308-byte prefix-preserving append: live size 318816,
  delta 8508, exactly one appended r08 marker. The anchored prefix is
  `9bc48c5f1303855767e804f424fd7ae635218ddb936600f00805aae8c4e0fae6`; live history is
  `8f500211f873c70d76fc20ab0f075a6a01801e448f3863d659a1d594dac0ac59`. The receipt declares
  99 to 100 milestones, adds only `design-environment-audit-remediation-r08`, modifies/deletes no
  anchored id, and pins r08's `FAILED_VALIDATION` canonical digest. The authoritative repository
  check independently reports 99 anchored, 100 candidate, one added, zero removed, zero modified,
  one declared target.
- The successor plan, anchor, both companions, frozen history copy, and transition receipt match
  their pinned byte counts and hashes. No forbidden product, app, package, dependency, canonical,
  screenshot, Paper, visual-authority, or frontier-policy edit is attributable to this successor.

The successor-attributable uncommitted scope before this report is therefore the Phase 3 test,
three governance retarget files, active state, the append-only history transition, and the six
named successor plan/anchor/frozen-copy/receipt records. The broader dirty frontier is preserved
user/prior-round work and is not claimed as this successor's diff.

## 3. Explicit ruling on plan section 3 (frontier correction)

**The correction is valid.** `tests/browser/phase3.browser.spec.ts` was clean at HEAD before this
successor and is an unconstrained addition to the recorded frontier, not a frontier-protected path.

- In the preserved r08 worktree, `git status --short -- tests/browser/phase3.browser.spec.ts` and
  `git diff HEAD -- ...` are empty, while `git ls-files -v -- ...` reports the normal `H` flag.
- The pinned pre-r02 snapshot contains no Phase 3 entry in either `protectedPaths` or
  `repairOwnedExclusions`; the baseline listing and predecessor pointer likewise contain none.
- `scripts/check-frontier-preservation.mjs` explicitly classifies additions as informational and
  unconstrained; the final ladder reports the Phase 3 file among those additions and passes with
  116 baseline entries, 110 non-excluded protected entries, three excluded protected entries, and
  115 additions.

No `REPAIR_OWNED_EXCLUSIONS`, pointer, baseline count, preservation script, or preservation-test
change is needed or authorized for this repair.

## 4. Existing current-worktree evidence reviewed

- `logs/01c-phase3-preflight.log`: all three Phase 3 browser tests pass, including the repaired
  transition test (`3 passed`, 4.6 s).
- `logs/02-fast.log`: repository/history/frontier gates pass; 86/86 Vitest files and 1033/1033
  tests pass; 120 Python tests pass; mutation guard clean.
- `logs/03c-phase.log`: fast ladder passes; Phase 3 integration 9/9; Phase 3 browser 3/3; mutation
  guard clean.
- `logs/04c-full.log`: unit 86/1033 and integration 19/133 pass; browser result is exactly
  **11 failed / 3 skipped / 170 passed**. The Phase 3 transition test ran (`[111/184]`) and did not
  recur. Parsing the full log yields exactly ten `expect(page).toHaveScreenshot` failures, one
  `expect(locator).toHaveScreenshot` failure, eleven `Snapshot:` entries, zero other `Error:`
  types, and zero Phase 3 timeout/`expect.poll` recurrence markers.
- Current `status-pre-c.txt` / `status-post-c.txt`: HEAD unchanged and identical 230-entry status
  fingerprint `efab61600da1e0f98c7c5d55ea0d49a5159c84fbecb910c35050968ab8d3fb74`.

## 5. Existing fresh frozen-install evidence reviewed

- `fresh/logs/00-install.log`: `pnpm install --frozen-lockfile` succeeds; lockfile reported up to
  date; 555 packages materialized.
- `01-bootstrap.log`: 25/25 pass. `02-diagnostic.log`: Vitest 4.1.10, Node v24.14.0, win32-x64,
  root lockfile `d386db6f...` at 256587 bytes. `03-focused.log`: exactly one selected
  `vitest.config.ts` (`6665125f...`, 820 bytes), 2/2 files and 40/40 tests pass.
- `04-fast.log`: 86/86 files, 1033/1033 tests, 120 Python tests, mutation guard clean.
- `05-phase3-preflight.log`: all three Phase 3 browser tests pass (`3 passed`, 4.6 s).
- `06-full.log`: unit 86/1033 and integration 19/133 pass; browser result is again exactly
  **11 failed / 3 skipped / 170 passed**. The Phase 3 transition test ran (`[100/184]`) and did not
  recur. Independent parsing again yields exactly ten page screenshot failures, one locator
  screenshot failure, eleven `Snapshot:` entries, zero other error types, and zero Phase 3
  recurrence markers.
- Fresh `status-pre.txt` / `status-post.txt`: the post-install pre-run and post-run candidate
  fingerprints are both 230 entries with SHA-256
  `efab61600da1e0f98c7c5d55ea0d49a5159c84fbecb910c35050968ab8d3fb74`; HEAD remains
  `1a24a973...`. The final lockfile is 256587 bytes with SHA-256 `d386db6f...`, has no git-status
  entry, and is byte-identical to the source worktree. The source and surviving fresh replay also
  match byte-for-byte for the Phase 3 test, all three governance scripts, active state, history,
  and lockfile.

The only browser failures in both completed full ladders are the plan's exact eleven pre-existing
canonical screenshot names:

1. `login-idle-ar-desktop-1440x900`
2. `login-service-route-en-320x720`
3. `owner-audit-route-ar-desktop-1440x900`
4. `owner-daily-route-ar-desktop-1440x900`
5. `owner-health-route-ar-desktop-1440x900`
6. `owner-settings-loading-route-en-desktop-1440x900`
7. `owner-settings-error-route-en-desktop-1440x900`
8. `owner-settings-route-en-desktop-1440x900`
9. `owner-shell-ar-desktop-1440x900`
10. `staff-closed-route-ar-mobile-390x844`
11. `staff-live-route-ar-desktop-1440x900`

There are zero functional, accessibility, or Phase 3 recurrence failures. These remain the D4
red-command carve-out and are not waived or called a `verify:full` pass.

## 6. Fresh independent execution

Authoritative command (host-selected absolute Node):

```text
C:\Program Files\nodejs\node.exe scripts/verify.mjs phase --phase 3
```

Environment: the synthetic non-secret unit values from `docs/WORKFLOW.md`, run id
`p3_clock_flush_independent_v2`, database/reset marker
`fitway_integration_p3_clock_flush_independent_v2`, and isolated Playwright output/review/report
paths under `output/playwright/phase3_clock_flush_test_reliability_r01_independent_v2/`.

Passing rerun result (`test-results/phase3_clock_flush_test_reliability_r01_independent_v2/logs/02-phase3-rerun.log`):

- repository transition/invariants PASS (99 anchored / 100 live / r08 only);
- frontier preservation PASS;
- Biome, owner token, owner spacing, owner class, and all TypeScript checks PASS;
- unit/component: 86/86 files, 1033/1033 tests;
- Python simulator: 120/120;
- Phase 3 integration: 1/1 file, 9/9 tests;
- Phase 3 browser: 3/3, including `phase3.browser.spec.ts:57`;
- final wrapper result: `Verification phase passed without repository mutation.`

My pre/post identity is identical: HEAD `1a24a973...`, branch `codex/owner-distill-r01`, 231
status entries, normalized status SHA-256
`28f3d5a42b98a6dfb228c867aba11a0a1d5f4d5f67a2391926ef2d9119d856a2`, whole-repository
fingerprint `7369ae2f0a3ae8f1c79ca6c1dd593bf9d9b749187bddf9545b1af4147387d70f`, and lockfile
`d386db6f...` / 256587 bytes. The captured `status-pre.txt` and `status-post.txt` have no diff.

## 7. Interrupted-verifier evidence (corroboration only)

I did not treat the interrupted verifier's commands as my own execution. Its retained logs
corroborate the same final candidate:

- repository invariants and frontier preservation pass;
- bootstrap 25/25 and the runtime diagnostic report bounded-set digest `d88cb7f2...e661`;
- focused governance run selects one unit config and passes 2/2 files, 40/40 tests;
- two Phase 3 preflight runs each pass 3/3;
- its 231-entry `status-before`, `status-after-gates`, and `status-after-all` captures are identical.

That verifier did not complete its own Phase 3 ladder or write the required durable report, so its
artifacts are supporting evidence only.

## 8. Required checks, optional checks, and coverage

- Required checks: complete. The candidate diff/governance/history/frontier review, both existing
  current/fresh evidence chains, both full-ladder failure classifications, current/fresh
  fingerprints and lockfile identity, and one independent authoritative Phase 3 ladder are all
  covered.
- Not rerun: I deliberately did **not** rerun `verify.mjs full`, either existing full ladder, the
  fresh install/full replay, or the already-completed current fast/preflight/full commands. The
  assignment explicitly prohibited repeating the completed full ladders.
- Optional/manual checks: none. This is test-only/governance-only and introduces no production UI,
  accessibility, visual, or data-semantic behavior to inspect manually.
- Missing test coverage: none blocking. The changed behavior is confined to the two notify-timer
  flush calls in one existing browser scenario; both sites participate in the same closed-to-open
  flow, and that flow now passes standalone, inside both historical full ladders, and in the final
  independent phase ladder. Adding a new product/unit test would not exercise Playwright's paused
  clock behavior more directly.

## 9. Final validation recommendation

**PASS.** The coordinator may record the unit, integration, browser, accessibility, and independent
review gates according to this evidence and move `phase3-clock-flush-test-reliability-r01` to
`READY_FOR_INTEGRATION` under the plan's explicit D4 carve-out. Preserve the precise qualification:
both `verify.mjs full` commands remain red on the same eleven pre-existing canonical screenshot
mismatches; no canonical is approved, no full-pass claim is made, and no integration commit was
performed.
