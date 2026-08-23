# P1 — browser load-sensitivity debt: activation and scope decision

Milestone `phase11-browser-debt`, run ID `p11_browser_debt_b01`, branch
`work/phase11-browser-debt-b01`, base `9ca0ef13d5a4eea815cb1cbb153e316433b03816`.

P1 is the second slice of the approved `phase11-access` successor sequence
`P2 -> P1 -> Slice B`, planned in
`docs/phase-records/handoffs/coordinator/20260823-124724-p11-access-successor-sequence-plan.md`.
P2 (`phase11-access-tx`) is `DONE`, integrated at `6299a75`. Slice B has not started.

This activation performs **no stage-specific target-file discovery**. None of the four assertion
locations below was read while deciding scope; the decision rests on the durable records and on the
ladder's own structure. Stage 1's route comparison is therefore still open on its merits.

---

## Decision D1 — the fourth location (coordinator, at activation)

P2's close carried one open scope question forward:

> P1 was written for three assertions in `tests/browser/**`, and
> `apps/server/src/phase2.integration.test.ts:779` is a fourth load-sensitive location living in an
> integration file. Whether P1 widens to cover it, or it takes its own entry, is a coordinator
> decision at P1 activation.

**Decided: P1's investigation widens to four locations. P1's repair widens to the fourth
conditionally, on stage-1 evidence, with a named stop condition.** The lease widens by exactly one
file. Nothing else in P1's approved scope changes.

### Why not "it takes its own register entry"

Opening a register entry for it would not help anyone, and would create debt nobody scheduled.

The observation at
`docs/phase-records/verification/20260823-p11_access_v01-phase2-integration-timeout.json`
records the surface as
`["apps/web/**", "tests/browser/**", "apps/server/src/phase2.integration.test.ts", "edge/**"]`.
That surface is correct and cannot be narrowed to help: the assertion samples
`.public-live__count-value`, whose markup lives in `apps/web/**`, so a candidate touching
`apps/web/**` genuinely could be the cause. Under the fail-closed rule *"a candidate that touches the
entry's surface loses the attribution"*, **Slice B could not attribute it** — Slice B is entirely
inside `apps/web/**` and `tests/browser/**`. A register entry here would be unusable by the very
slice P1 exists to unblock, and the register's own rule says an entry that never closes is a defect
nobody scheduled.

### Why widen, then

Only a fix removes it as a risk to Slice B. Left unfixed and unregistered, a recurrence inside Slice
B's ladder is an **unattributed** failure; one unattributed failure makes the whole run red, and that
red counts against Slice B's repair budget. That is exactly the risk P1 exists to retire, and it is
the same class of risk as the three registered entries.

### Why the repair is conditional rather than unconditional

Two facts argue against committing P1's repair budget to it up front:

1. **The mechanism is a hypothesis from one observation.** The record says so in its own words, and
   labels it `mechanism_hypothesis`. P1's binding constraint is *fix the sampling, not the
   assertion's meaning* — which is only satisfiable once the mechanism is actually known.
2. **It is not the same ladder step.** The three registered entries fail in the browser step.
   `apps/server/src/phase2.integration.test.ts` runs in the *All integration tests* step
   (`scripts/verify.mjs:344`) under vitest driving Playwright. Same symptom class, different runner
   and different load profile. Whether one deterministic-wait pattern expresses both proofs is a
   stage-1 finding, not an activation assumption.

**The asymmetry that decides the shape: P1 is the gate to Slice B.** Committing the repair budget to
a location whose mechanism is unproven risks pushing P1 itself to `FAILED_VALIDATION` and blocking
Slice B entirely. Stage 1 is read-only and costs no budget, so widening the *investigation* is free
and widening the *repair* is not.

### The condition, stated objectively so stage 2 cannot decide it by preference

Stage 2 repairs `apps/server/src/phase2.integration.test.ts:779` **if and only if** stage 1
establishes, with file:line evidence, both of:

- what the assertion actually samples and why that sampling is load-sensitive — a mechanism, not a
  restatement of the symptom; and
- a deterministic wait available in that file's runner that proves the same thing the current
  assertion proves.

If either is absent, that is a **stop condition to record, not a decision to take inline**. The
fallback is fixed now so it is not invented later:

- the three browser assertions are stabilized and their entries closed as originally approved — P1
  still delivers its purpose;
- P1 opens a register entry for the fourth. P1 is not the session that reported the failure and not
  the implementer of the candidate that hit it, so the register's provenance rule is satisfied — the
  reason the P2 repair session correctly declined to open it;
- the entry is recorded as **known-unusable by Slice B** for the surface reason above, and named as
  its own follow-up slice, so it is scheduled debt rather than ambient debt.

### What this decision does not do

It does not widen P1 to any other location, it does not touch the assertions' meaning, and it does
not reopen anything P2 deliberately carried forward. **M4**, **M5**, **rate limiting on the owner
access leaves**, and the **`docs/WORKFLOW.md` step-8 environment gap** all remain exactly as P2 left
them: named, recorded, and unscheduled.

---

## Scope

**Shared lease** — coordinator-granted, cross-milestone, assertion-scoped, four files. These specs
sit inside other milestones' owned paths. That is an authority requirement and nothing more: it makes
the *lease* coordinator-granted, it does **not** make the edits coordinator-executed.

| File | Assertion |
|---|---|
| `tests/browser/phase2.browser.spec.ts` | :72 — cache-expiry elapsed-time margin |
| `tests/browser/phase3.browser.spec.ts` | :57 — transient-state sampling |
| `tests/browser/phase10-ui-csv.browser.spec.ts` | :742 — transient loading state |
| `apps/server/src/phase2.integration.test.ts` | :779 — conditional, per D1 |

**Owned paths:** `docs/phase-records/verification/known-flaky-register.json`, this milestone's
handoff directory, and the append-only route-decision and verification directories.

**Forbidden:** everything else. Specifically `apps/web/**` and every non-listed file under
`tests/browser/**` (Slice B, and touching them would void this slice's own attribution position);
`tests/browser/__screenshots__/**`; `packages/**`; every other file under `apps/server/**`;
`PROJECT_STATE.yaml`, `scripts/verify.mjs`, `scripts/verify-repository.mjs`; root manifests,
lockfiles, environment schemas, and test-runner configuration; normative documents,
`visual-direction-gate/**`, and Paper; every other milestone's records.

**Constraint, binding on every stage.** Fix the sampling, not the assertion's meaning. Deleting or
weakening the behaviour under test is not stabilization. If an assertion cannot be made deterministic
without changing what it proves, that is a stop condition to record.

## Stages

Route is **Open** on every implementation and investigation stage. Per the approved plan and the
delegation-before-discovery rule, each stage's delegation test is evaluated when the stage opens,
from this record and the durable records, **before that stage's own target-file reading is performed
by anyone, including the coordinator**. The route-decision JSON is written before the stage is
assigned or its write lease is opened.

| # | Stage | Rollback boundary | Route |
|---|---|---|---|
| 0 | Activation — ledger, lease grant, this record | the activation commit | Coordinator by authority |
| 1 | Timing-mechanism investigation, read-only, **four** locations | nothing to revert | **Open** |
| 2 | Stabilize — three assertions, plus the fourth if D1's condition is met | one commit per spec; each independently revertible | **Open** |
| 3 | Close the register entries with evidence | one commit, records only | **Open** |
| 4 | Freeze | n/a | Whoever held stages 2-3; submission is coordinator |
| 5 | Independent verification | n/a, read-only | **Open**, qualifies on Independence |
| 6 | Integration and `DONE` | the integration commit | Coordinator by authority |

The qualified OpenCode pool competes normally on every Open stage under the two durable 2026-08-21
authorizations, which are **reconciled, not re-requested**. `route: null` with
`execution: "direct-coordinator"` is a legitimate outcome only as the result of a comparison actually
opened, and `material_selection_reason` must name the concrete advantage or requirement.

## Gate

Run `set -a; . ./.env; set +a` from the worktree root first — `pnpm verify:fast` otherwise fails on
`CRON_SECRET must be supplied to the cron test process`.

- Each touched spec standalone at the candidate commit.
- `pnpm verify:full` **twice** at the candidate, unique `FITWAY_RUN_ID`, own disposable database per
  run. Two green complete ladders is what proves a stochastic failure stopped recurring; one is not
  evidence.
- Register entries move to `closed` with closing evidence appended.
- `pnpm check:repository` and `scripts/candidate-freeze-check.mjs` over the full candidate range, run
  **last**, after every durable record this slice produces is written.
- Fresh independent verification. Reproducing the stochastic claim is the substance of that gate.

## Open decisions

**None blocking.** D1 above was the only one, and it was the coordinator decision the P2 close
assigned to this activation. No human decision is outstanding.
