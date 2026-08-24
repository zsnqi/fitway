# Slice B `phase11-access-ui` — session handoff

Run `p11_access_ui_b01`, branch `work/phase11-access-ui-b01`, head **`a0c9f53`**, tree clean.
Worktree `D:/Projects/fitway-worktrees/phase5-staff-integration`. Milestone status `IN_PROGRESS`.

**Stopped at two genuine human-decision gates, not because work ran out.** Stages 6 and 7 are
unblocked and ready; both gates below are named in full so they can be decided without reading this
whole record.

## Completed and committed

| Stage | Commit | Gate | Route |
|---|---|---|---|
| 1 — surface investigation | `9b39349` | PASS | `deepseek-v4-pro`, neutral tie resolution |
| 2 — data layer (`use-owner-access`) | `d2fe54f` | PASS | `ox-alpha` |
| 3 — presentation (`owner/access/**`) | `27f99fe` | PASS | `deepseek-v4-pro` after 2 transport failures |
| 4 — mount under the `admin.tsx` lease | `e14af60` | PASS | direct coordinator |
| 5 — browser spec, baselines, polish loop | `a0c9f53` | PASS_WITH_CORRECTION | `deepseek-v4-pro` + coordinator |

Implementation commits inside those: `5ad38f9` (hook), `5fb9854` (section), `30a10f0` (spec).

## Verification actually performed

- `pnpm verify:fast` — green at the stage 2, 3 and 4 gates.
- `pnpm verify:phase` (`FITWAY_PHASE=phase11-access`) — **green on the final state**: unit 65 files /
  510 tests, integration 24/24, browser **43** across the access spec and all five sibling `/admin`
  specs, repository invariants and mutation guard clean.
- Sibling regression: 31/31 at stage 4, 43/43 at stage 5. No sibling spec edited, no accepted
  baseline changed.
- Negative controls, because a green suite is not evidence on its own:
  - defeating the PIN sanitization failed exactly 1 of 17 hook tests;
  - desynchronizing one refusal code produced TS2561 in **both** locale tables;
  - the mount's live-region regression failed 3/31 **before** the fix and 31/31 after, with the gate
    as the only change.
- Baselines regenerated in this worktree with `--update-snapshots`: **empty diff**, byte-identical.

## GATE 1 — canonical baselines need human approval

Per `docs/WORKFLOW.md`, whoever generates them. Two files, both new:

- `tests/browser/__screenshots__/win32/chromium/phase11-access.browser.spec.ts/owner-access-ar-desktop-1440x900.png`
- `tests/browser/__screenshots__/win32/chromium/phase11-access.browser.spec.ts/owner-access-en-mobile-390x844.png`

What is already established about them: byte-identical to what this worktree's locked toolchain
renders; scoped to the section element, not the page, per the sibling convention; and **structurally
incapable of containing credential material** — the canonical test mocks only the principal list and
never invokes provision or rotate, and the reveal renders only when a mutation resolves.

Approval is not the coordinator's to grant. **This gates `DONE`.**

## GATE 2 — new load-sensitive debt on the unit ladder, outside this slice

`apps/server/src/reference-gating.test.ts:5` — `Hook timed out in 10000ms` inside the full unit run.

Evidence, including a disproved hypothesis: the file **passes standalone in 1.17s with Postgres down**,
importing in 29ms, so the tempting explanation — that the disposable Postgres had exited at the power
loss three hours earlier, which fit the timeline neatly — is **wrong**; it needs no database. The
failing run's aggregate import was 30.22s with 301.25s environment setup, and the 10,000 ms hook
timeout lost that race. It did not recur on a clean re-run.

Why it is escalated rather than handled:

- **not a Slice B defect** — this slice's entire diff is `apps/web/**`, `tests/browser/**` and records;
- **the slice may not repair it** — `apps/server/**` is forbidden scope;
- **the slice may not register it** — this milestone forbids opening a known-flaky register entry for
  a failure its own run hits, and no entry covers it. `flaky-attribution-check.mjs` fails closed on
  anything unrecorded, so the red run is **not** being excused by attribution.

Same debt class the browser ladder went through under `phase11-browser-debt` and
`phase11-ladder-contention`, now on the unit ladder. Suggested disposition: its own bounded slice.

## Remaining work, unblocked

- **Stage 6 — freeze, then submit.** Durable records first, then `pnpm check:repository` and
  `scripts/candidate-freeze-check.mjs` over the full candidate range, run **last**. This matters
  concretely here: the ladder went red twice this slice on this slice's own unformatted record JSON.
  Format record files at write time.
- **Stage 7 — independent verification.** Route is already determined by exclusion and recorded:
  `deepseek-v4-pro` implemented stages 1, 3 and 5 and `ox-alpha` stage 2, so both are excluded from
  reviewing this candidate; `glm-5.3` and `minimax-m3` are filtered fail-closed on the
  verification-ladder capability. **Stage 7 routes native.** It must receive the candidate, scope,
  criteria and commands — **not** the implementer's reasoning — and it reports without repairing.
- **Stage 8 — integration and `DONE`**, coordinator, after Gate 1 clears.

## Decisions made this session, and by whom

- **Human, 2026-08-24:** a tie between fully qualified external candidates is not a reason to fall
  back to native; resolve deterministically inside the tied set. Applied at stage 1 and recorded as a
  neutral resolution, not a preference claim.
- **Coordinator:** stage-3 consequence held at `medium` on four named grounds rather than raised to
  `high`, which would have forced it native. Recorded with the reasoning so it can be audited.
- **Coordinator:** stage-3 reroute after two transport failures, under a rule written down **before**
  the second attempt. `ox-alpha`'s qualification is unchanged — the finding was about stream
  stability on one route, not capability.
- **Coordinator, corrected mid-stage:** the stage-4 `enabled` decision was initially wrong. Gating on
  the shared analytics query is not cargo cult; it is the one-live-region rule under
  `DESIGN_GUIDE.md` §13. The sibling specs caught a real accessibility regression.
- **Coordinator:** PIN vocabulary left agreeing with the audit **action** labels and flagged for human
  review rather than silently changed, because audit copy is human-locked.

## Open, deliberately not decided

- The `owner-shell` rail header shows apparent brand/nav overlap in a 200% `fullPage` capture. It is
  `phase11-shell`'s surface, its own reflow test passes, and fixed elements render unreliably in
  full-page captures. **Not isolated, not claimed as a defect, not actioned** — recorded for awareness.
- Four em dashes in prose copy (`messages.ts:71,77,143,149`). Cosmetic; left alone.
- Carried forward untouched, as before: M4, M5, rate limiting on the owner access leaves, and the
  `docs/WORKFLOW.md` step-8 environment gap.

## A finding against the workflow tooling, not against FITWAY

Recording adverse outcomes — which the workflow requires — turned the skill's registry regression
harness red (65/0 → 64/1). The scenario `reuse-survives-outcome-recorded-before-the-decision` is
coupled to the live `evidence/ox-alpha.json` rather than a frozen fixture; its stored decision predates
the two truthful `FAILED_TRANSPORT` entries this slice added. The resolver and the data are both
correct; the harness penalizes the required behaviour. **Deliberately not repaired** — it lives outside
this repository, and editing a regression test to go green, or deleting truthful evidence to achieve
it, would both be wrong. `verify-repository` and `verify:fast` are green.

## Recommended next session

Clear Gate 1, then run stage 6 (freeze and submit) and stage 7 (native independent verification),
then stage 8. Gate 2 should be scheduled as its own bounded slice and should not be folded into this
one — the slice is forbidden from touching it, and that boundary is what kept this candidate honest.
