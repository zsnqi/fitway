# phase3-clock-flush-test-reliability-r01 — human-authorized successor contract

- Recorded: 2026-09-18 18:54 +03:00 (observed local clock; report-name timestamps follow the
  session convention and are not an authoritative capture time).
- Status: **FINAL, HUMAN-AUTHORIZED, ACTIVATED by this round's governance transition.** This record
  is the execution contract for the separate narrowly owned test-reliability successor that
  `docs/phase-records/handoffs/coordinator/20260918-193000-design-environment-audit-remediation-r08.md`
  section 6 routed after r08 terminated `FAILED_VALIDATION` under r08 plan R4.4.
- Run ID: `phase3_clock_flush_test_reliability_r01`. Worktree
  `C:/Users/Pc Force/.codex/worktrees/6d57/phase5-staff-integration`; branch `codex/owner-distill-r01`;
  HEAD `1a24a973570371949008a7a5f037c47b818c0e01` (recomputed at round open; unchanged).
- Predecessor round: `design-environment-audit-remediation-r08`, terminated `FAILED_VALIDATION`
  with `integratedCommit: null`; its runtime repair and both test-reliability scope changes remain
  verified candidate evidence, not integrated.

## 1. Authority and successor-rule disclosure

- **Human authorization.** The human coordinator's 2026-09-18 resume instruction directs this
  successor: "take ownership of the narrow successor repair for the remaining Phase 3
  test-reliability failure", with implementation and independent verification delegated to
  subagents, the coordinator reviewing every returned result, and the round taken "through
  completion and durable handoff".
- **Successor-rule disclosure (docs/WORKFLOW.md state machine).** The failure mode prior checks did
  not cover: the r08 fresh preflight and current full ladder passed `tests/browser/phase3.browser.spec.ts`
  while the fresh frozen-install full ladder failed the same test at the same assertion line with
  the same 5000 ms `expect.poll` signature — a Playwright paused-clock notify-timer stall, not the
  closed-register wall-clock mechanism. The changed scope: ownership is limited to the exact
  two-call clock-flush edit in `tests/browser/phase3.browser.spec.ts` plus this round's governance
  records. Why the failure mode will not recur: the repair changes the flush from `fastForward(0)`
  to `fastForward(1)`, which reaches a delay-0 timer created during a clock tick; the identical
  class was already independently ruled necessary, minimal, and test-only for
  `tests/browser/phase2.browser.spec.ts` (r08 scope change #2,
  `docs/phase-records/handoffs/coordinator/20260918-180000-design-environment-audit-remediation-r08-scope-change-phase2-clock-flush.md`,
  independently `VALID` in `20260918-190000-…-r08-independent-verification.md`).
- **Preserved threat model.** The human-authorized prepared cooperative agent worktree model is
  unchanged: host-selected absolute Node, repository-local tool resolution, bounded integrity
  revalidation, and repository mutation checks. Hostile repository code, malicious same-user races,
  compromised dependencies, and a compromised host/OS remain out of scope.

## 2. Finding (recurrence evidence and mechanism)

The failing test is `tests/browser/phase3.browser.spec.ts:57`, "expires cached closed honestly and
transitions to open without reload", assertion line 97:

```text
 > 97 | .toBe(true);
Error: expect(received).toBe(expected) // Object.is equality
Expected: true / Received: false
- Timeout 5000ms exceeded while waiting on the predicate
```

- r07 fresh full ladder: `test-results/design_env_audit_remediation_r07/logs/fresh/05-full.log`
  (12 failed / 3 skipped / 169 passed; same site, same signature).
- r08 fresh full ladder: `test-results/design_env_audit_remediation_r08_resume/fresh/logs/18-full-final.log`
  (12 failed / 3 skipped / 169 passed; same site, same signature), after the fresh preflight
  `17-phase3-preflight-final.log` passed and `28-full.log` (current ladder) passed the test inside
  the ladder.
- Mechanism (independently inspected installed `playwright-core@1.61.1`): `addTimer` schedules a
  delay-0 timer created during a tick at `callAt = now.ticks + 1` (`delay || (this._duringTick ? 1 : 0)`);
  `fastForward(0)` computes `to = now.ticks`; `_innerFastForwardTo` pulls only timers with
  `to > timer.callAt`. A delay-0 timer created inside a tick is therefore never reached by repeated
  `fastForward(0)`, so react-query's `systemSetTimeoutZero` notify for the closed payload can be
  lost and the "مغلق الآن" heading never renders within the poll budget. `fastForward(1)` reaches
  `now + 1` and fires it. Whether the notify lands inside a tick is machine/module-timing
  dependent, which is why standalone/preflight/current runs pass and the loaded fresh suite
  failed twice.
- The closed known-flaky-register entry `browser-phase3-transient-state` (closed 2026-08-23,
  commit `438fdac`) recorded a **different** mechanism (wall-clock anchoring at the old line 82);
  this recurrence is the post-`fastForward`-rewrite delay-0 stall. The register remains closed and
  **no waiver or attribution is used**: the failure is repaired by test-only code, not excused.

## 3. Material corrections to prior evidence (disclosed, independently re-checkable)

1. **No frontier-policy transition is required for this successor.** The r08 independent
   verification described `tests/browser/phase3.browser.spec.ts` as "frontier-protected"; that label
   is inaccurate. Recomputed at round open:
   - the pinned pre-r02 snapshot (`…20260915-183000-…-pre-r02-anchor.json`) contains no
     `phase3` record (`protectedPaths` and `repairOwnedExclusions` both lack it);
   - the baseline listing (`…20260915-183000-…-r01-pre-existing-frontier.txt`) has no `phase3`
     entry, and the r01 predecessor manifest's `protectedPaths` lacks it;
   - `git status --short -- tests/browser/phase3.browser.spec.ts` is empty, `git diff HEAD` is
     empty, and `git ls-files -v` reports the normal `H` flag;
   - therefore the file is a clean tracked file, its authorized edit appears in `git status` as a
     new addition, and `scripts/check-frontier-preservation.mjs` treats additions as informational
     and unconstrained.
   No `REPAIR_OWNED_EXCLUSIONS`, pointer-document, or frontier-count change is authorized or
   needed; `scripts/check-frontier-preservation.mjs` and its test are forbidden paths for this
   round. The independent verifier must rule explicitly on this correction.
2. **Observed-clock discrepancy.** The host's observed local clock at round open (2026-09-18
   18:54 +03:00) is earlier than several r08 record timestamps (e.g. r08 `updatedAt`
   19:35 +03:00). New records use the observed clock; all recorded timestamps remain observed
   metadata, never evidence of capture time, and this plan makes no claim about the r08 records'
   capture times.

## 4. Authorized repair (test-only, exact)

In `tests/browser/phase3.browser.spec.ts` only (current bytes 4655, SHA-256
`ef75aaea9135d38d55cdb4f55480c9ecd7b5c130a16b3dbc52f4313fc9edd8fc`, clean against HEAD):

```text
line 94  (first poll flush):  - await page.clock.fastForward(0);   + await page.clock.fastForward(1);
line 118 (second poll flush): - await page.clock.fastForward(0);   + await page.clock.fastForward(1);
```

Both sites are the same diagnosed defect in the same test: a delay-0 notify timer created during
a tick is unreachable by `fastForward(0)`. Fixing only the observed first site would leave an
identical latent stall in the same test's open-payload transition; advancing one millisecond per
flush is behaviorally inert against the test's own `1_500`/`1_100` ms advances and the 90 s
freshness window. Nothing else changes: no locator, assertion, timeout, payload, request count,
waiting budget, or comment. In particular, no Playwright timeout is raised — the falsified
timeout-raise repair class from the closed phase11 record is not repeated.

## 5. Governance transition (coordinator-owned; executed with this plan)

1. New pre-transition anchor
   `docs/phase-records/handoffs/coordinator/20260918-185500-phase3-clock-flush-test-reliability-r01-pre-transition-anchor.json`
   plus `.sha256` companion and frozen history copy
   `…-pre-transition-history.yaml`, capturing HEAD, `git status --short` entry count and
   CRLF→LF-normalized stream SHA-256, `PROJECT_STATE.yaml` bytes/SHA-256/milestone digests, and
   `PROJECT_STATE_HISTORY.yaml` bytes/SHA-256/99 milestone digests.
2. Append the r08 terminal record to `PROJECT_STATE_HISTORY.yaml` through the existing machine-checked
   `archive-terminal` transition (no other history byte changes; append-only).
3. Open this milestone in `PROJECT_STATE.yaml` with the r08 archive declaration
   (`historyMutations`, target status `FAILED_VALIDATION`, target canonical digest
   `011335942ed7bbd562f0904cf55509a42e481c2e985145be4f4dd21dd4f87ea2`, receipt path), fresh
   repair budget, lease through 2026-09-30, and `ownedPaths` including the exact standalone entry
   `PROJECT_STATE_HISTORY.yaml`.
4. Write the history transition receipt
   `docs/phase-records/handoffs/coordinator/20260918-185600-phase3-clock-flush-test-reliability-r01-history-transition-receipt.json`.
5. Anchor retarget only: pin the new anchor path and SHA-256 in
   `scripts/project-state-history-transition.mjs`; update the real-repository expectations in
   `scripts/project-state-history-transition.test.ts` (anchored count 98→99, added id
   `design-environment-audit-remediation-r07` → `design-environment-audit-remediation-r08`); and
   change the anchor-era label in `scripts/verify-repository.mjs` to this successor. No behavior
   change.

## 6. Ownership

Owned paths:

- `tests/browser/phase3.browser.spec.ts` — the exact two-call edit in section 4, nothing else.
- `scripts/project-state-history-transition.mjs`, `scripts/project-state-history-transition.test.ts`
  (anchor pin and its expectations), `scripts/verify-repository.mjs` (anchor-era label) — section 5 only.
- This plan, the pre-transition anchor/frozen copy/companions, the transition receipt, the
  successor handoff, the independent-verification record, and the successor frozen evidence under
  `docs/phase-records/handoffs/coordinator/**`.
- `PROJECT_STATE.yaml`, `PROJECT_STATE_HISTORY.yaml`.

Forbidden paths (unchanged from the r08 boundary except as narrowed):

- all `apps/**`, `packages/**`, product behavior, APIs, schemas, migrations, dependencies, and
  `pnpm-lock.yaml` bytes;
- `vitest.config.ts`, `vitest.integration.config.ts`, `playwright.config.ts`, and root
  `package.json` behavior;
- every `tests/browser/**` path other than the exact edit in section 4, including all screenshots
  and canonicals, and `scripts/check-frontier-preservation.mjs` / its test;
- `FITWAY_PRODUCT.md`, `SPEC.md`, `DESIGN_GUIDE.md`, ADR-007, ADR-009, `PHASES.md`, Paper exports,
  authority manifests/mappings/hashes, and canonicals;
- prior handoffs, inventories, receipts, and history entries other than the section 5 archive
  append;
- all Owner, Staff, or Public design/presentation work and existing untracked user inspection
  artifacts.

## 7. Required validation and acceptance

All repository JavaScript commands use the host-selected absolute Node path
(`C:\Program Files\nodejs\node.exe`) from the prepared worktree. Environment per `docs/WORKFLOW.md`
section 8 with the synthetic non-secret unit values plus
`FITWAY_RUN_ID=phase3_clock_flush_test_reliability_r01` and the run-specific disposable database
`fitway_integration_phase3_clock_flush_test_reliability_r01`.

Focused trust gates (each exit 0):

```text
<absolute-node> scripts/verify-repository.mjs
<absolute-node> scripts/check-frontier-preservation.mjs
<absolute-node> --test scripts/vitest-runtime.bootstrap.test.mjs
<absolute-node> scripts/check-test-runtime.mjs
<absolute-node> scripts/run-vitest.mjs run scripts/check-frontier-preservation.test.ts scripts/project-state-history-transition.test.ts
```

The focused run must print exactly one selected config (`vitest.config.ts`) and every focused test
must pass.

Preflight and project ladders:

```text
<absolute-node> node_modules/@playwright/test/cli.js test tests/browser/phase3.browser.spec.ts --reporter=line
<absolute-node> scripts/verify.mjs fast
<absolute-node> scripts/verify.mjs phase --phase 3
<absolute-node> scripts/verify.mjs full
```

Then a fresh frozen-install replay at the same HEAD with the exact candidate delta materialized,
no inherited `node_modules`, `pnpm install --frozen-lockfile` exit 0 and lockfile bytes unchanged,
repeating bootstrap, diagnostic, focused, fast, the Phase 3 preflight, and full.

Acceptance:

- the Phase 3 test passes standalone and inside both full ladders;
- `fast` passes (unit/component, lint/types, repository invariants, mutation clean);
- `phase --phase 3` passes;
- both full ladders fail **only** the exact same 11 pre-existing canonical `toHaveScreenshot`
  names already recorded in the r08 evidence (`login-idle-ar-desktop-1440x900`,
  `login-service-route-en-320x720`, `owner-audit-route-ar-desktop-1440x900`,
  `owner-daily-route-ar-desktop-1440x900`, `owner-health-route-ar-desktop-1440x900`,
  `owner-settings-loading-route-en-desktop-1440x900`,
  `owner-settings-error-route-en-desktop-1440x900`, `owner-settings-route-en-desktop-1440x900`,
  `owner-shell-ar-desktop-1440x900`, `staff-closed-route-ar-mobile-390x844`,
  `staff-live-route-ar-desktop-1440x900`), with zero functional or accessibility failures. This
  remains the documented D4 red-command stage carve-out, never a `verify:full` pass;
- every run leaves `git status --short` unchanged from its pre-run state and HEAD unchanged;
- a fresh independent verifier (no candidate edits, one report file only) returns `PASS`, rules on
  the section 3 frontier correction, and confirms the diff touches no forbidden path.

## 8. Evidence and records

- Transient logs under `test-results/phase3_clock_flush_test_reliability_r01/` (current) and the
  fresh worktree's run directory; copied into the frozen inventory by file identity.
- Durable records: this plan, the anchor/frozen copy/companions, the receipt, the successor
  handoff, the independent-verification record, and a frozen evidence JSON inventorying every
  cited byte count and SHA-256 after the last write.
- Terminal target for this round: **`READY_FOR_INTEGRATION`** (candidate green, not integrated).
  This round does not commit the preserved dirty frontier, does not promote canonicals, and does
  not claim `DONE`.

## 9. Repair budget and terminal routing

- Fresh budget: at most two focused repair attempts; no reset by session change.
- Any new functional, accessibility, repository-mutation, provenance, state/history, frontier, or
  authority failure blocks the round.
- If the Phase 3 recurrence persists in both ladders after the section 4 edit, stop
  `FAILED_VALIDATION` and route to a human with the exact logs; do not relabel it environmental and
  do not add a waiting budget.
- If the independent verifier returns `FAILED_VALIDATION`, record its findings and terminalize
  accordingly; a further successor requires human authorization and the WORKFLOW successor-rule
  disclosure.

## 10. What this plan does not authorize

No product, spec, schema, migration, dependency, configuration, canonical, Paper, authority, Owner,
Staff, or Public design change; no change to any other browser test or screenshot; no frontier
policy change; no integration commit; no `verify:full PASS` claim; no waiver of any canonical
mismatch.
