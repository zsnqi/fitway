# Ladder contention — activation and slice contract

Milestone `phase11-ladder-contention`, run `p11_ladder_contention_b01`, branch
`work/phase11-ladder-contention-b01`, base `9ca0ef13d5a4eea815cb1cbb153e316433b03816` — **`main`, not
P1's branch**.

## Human decision, 2026-08-23

Option **B** of the four presented in
`docs/phase-records/handoffs/phase11-browser-debt/20260823-193000-p11_browser_debt_b01-needs-human.md`:

> Authorize a separate bounded slice to diagnose and fix the shared verification contention mechanism
> identified by the current evidence. Keep it distinct from P1. Preserve P1's already-delivered scoped
> repairs and do not broaden P1 retroactively. The contention slice should make the smallest
> evidence-supported infrastructure/configuration change necessary to retire the shared
> load-sensitive failure class rather than chasing individual flaky instances. After that slice is
> accepted and integrated, return to P1 and complete its remaining Stage 3 against a genuinely green
> full ladder. Do not start Slice B until P1 is legitimately closed.

This supersedes nothing about the earlier locked decision that the debt is fixed rather than
accepted. It answers *how*.

**Sequence is now:** `P2 (DONE)` → **contention (this slice)** → `P1 stage 3` → `Slice B`.

P1 moves from `NEEDS_HUMAN` to `BLOCKED` on this milestone. Its three commits — `0243b0d`,
`438fdac`, `75f751e` — are **preserved untouched on `work/phase11-browser-debt-b01`** and are not
reopened, rebased in place, or broadened. This slice does not base on them and does not depend on
them.

## Why this slice bases on `main` and not on P1

P1's candidate has never passed a gate and is not integrated. Basing on it would make this slice's
integration depend on unintegrated, ungated work, and would entangle the two exactly as the human
asked me not to. This slice integrates to `main` on its own evidence; P1 then rebases onto the new
`main` and finishes stage 3 with the contention fix already underneath it.

**Consequence for acceptance, stated now so it is not negotiated later.** At this base the three
registered P1 assertions are still load-sensitive, so **a fully green ladder is not this slice's
acceptance criterion and must not be claimed as one.** See Acceptance below.

## Objective, in observable terms

Repeated `pnpm verify:full` invocations stop producing load-sensitive failures in assertions that are
correct — with the three registered P1 entries as the only permitted residual, and with the ladder's
gate coverage and wall-clock cost both measured and reported.

The evidence this rests on is
`docs/phase-records/verification/20260823-p11_browser_debt_b01-ladder-load-sensitivity-observations.json`:
four files across three ladder steps, every one green in isolation at the same commit, none ever
failing outside a full ladder.

## The constraint — read this before proposing anything

**Retire the mechanism. Do not suppress the symptom.** Every one of the following is rejected, and a
change built on any of them fails the stage:

- **Playwright `retries`, vitest `retry`, or any runner-level retry.** This is the obvious cheap
  "fix" and it is the worst one: it makes flaky tests pass without fixing anything, and it destroys
  the known-flaky register's entire purpose by making every red invisible. Not negotiable.
- Removing, skipping, or conditionally excluding any test, spec, project, or ladder step.
- Reducing what the ladder verifies — dropping the mutation guard, the build, accessibility, or any
  gate — to make it faster or quieter.
- Blanket timeout inflation as the primary change. If a specific timeout is genuinely misconfigured
  relative to a measured budget, that is a finding with evidence, not a global multiplier.
- Repairing individual flaky assertions. That is P1's job and this slice's forbidden ground.

**Smallest evidence-supported change.** Every configuration value changed must trace to a measurement
this slice took. A plausible-sounding tuning with no measurement behind it is not evidence-supported,
and "it went green" is not a mechanism.

If the evidence shows the class cannot be retired by configuration alone, that is a **stop condition
to record** — a real and useful outcome — not licence to reach for a suppression.

## Scope

**Owned paths:**

| Path | Note |
|---|---|
| `playwright.config.ts` | Browser-runner parallelism, timeouts, projects |
| `vitest.config.ts`, `vitest.integration.config.ts` | Unit and integration pool and concurrency |
| `scripts/verify.mjs` | Ladder step composition, ordering, and any inter-step isolation |
| `package.json` scripts, **only** where a verification script's invocation must change | Narrow; a dependency or manifest change is a stop condition |
| `docs/phase-records/handoffs/phase11-ladder-contention/*-p11_ladder_contention_b01-*.md`, `*-p11_ladder_contention_v01-*.md` | |
| `docs/phase-records/route-decisions/**`, `docs/phase-records/verification/**` | Append-only |

**Forbidden:**

- **Every test file and every application source file, without exception.** Specifically named
  because they are the tempting targets: `tests/browser/**`, `apps/**/*.test.*`,
  `apps/**/*.integration.test.*`, `apps/web/src/hooks/use-owner-reporting.test.tsx`,
  `tests/browser/phase10-ui-csv.browser.spec.ts`, `tests/browser/phase4-staff-web.browser.spec.ts`,
  and the three P1 assertions.
- `work/phase11-browser-debt-b01`, every P1 record, and the known-flaky register. This slice does not
  close, edit, or open register entries; P1 stage 3 owns that.
- `tests/browser/__screenshots__/**` — canonical baselines are read-only acceptance evidence.
- `pnpm-lock.yaml`, dependency versions, and environment schemas. A dependency change is a stop
  condition, not a decision inside a stage.
- `PROJECT_STATE.yaml`, `scripts/verify-repository.mjs`.
- Normative documents, `visual-direction-gate/**`, Paper, every other milestone's records.
- **M4, M5, rate limiting on the owner access leaves, and the `docs/WORKFLOW.md` step-8 environment
  gap** — carried forward by P2, still unscheduled, still not this slice's work.

`scripts/verify.mjs` and the runner configs are coordinator-owned and gate **every** phase. That
makes the lease coordinator-granted. It does **not** make the edits coordinator-executed.

## Acceptance

Measured, not asserted. A claim without the command and its output is not evidence.

1. **A named mechanism**, with measurements, that explains failures in at least two different ladder
   steps. A hypothesis that only fits the browser step does not explain
   `use-owner-reporting.test.tsx:456`.
2. **Repeated full ladders at the candidate** — at least four, each with a unique `FITWAY_RUN_ID` and
   its own disposable database. Permitted residual: **only** the three registered P1 entries
   (`tests/browser/phase2.browser.spec.ts:72`, `phase3.browser.spec.ts:57`,
   `phase10-ui-csv.browser.spec.ts:742`). Any failure outside those three means the class is not
   retired.
3. **A pre-change baseline at the same base**, so the improvement is a comparison and not an
   impression. Without it there is no way to distinguish a fix from a quiet day.
4. **Gate coverage unchanged** — same test count, same steps, same projects. Demonstrate it, do not
   assert it.
5. **Wall-clock cost reported.** Trading duration for determinism is acceptable and expected; hiding
   the trade is not.
6. `pnpm check:repository`, then `scripts/candidate-freeze-check.mjs` over the full candidate range,
   run **last**, after every durable record this slice produces is written.
7. **Fresh independent verification**, which must reproduce the stochastic claim itself.

Environment: `set -a; . ./.env; set +a` from the worktree root first; browser steps run from
PowerShell, and each ladder run needs its disposable database created in advance.

## Stages

Route is **Open** on every implementation and investigation stage. Each stage's delegation test is
evaluated when the stage opens, from this contract and the durable records, **before that stage's own
target-file reading is performed by anyone, including the coordinator**, and its route-decision JSON
is written before the stage is assigned or its lease is opened.

| # | Stage | Rollback boundary | Route |
|---|---|---|---|
| 0 | Activation — ledger, lease, this contract | the activation commit | Coordinator by authority |
| 1 | Contention diagnosis — read the runner configuration and the ladder, take baseline measurements | nothing to revert | **Open** |
| 2 | The minimal change | one commit per configuration surface | **Open** |
| 3 | Validation — repeated ladders, before/after comparison, coverage and cost evidence | records only | **Open** |
| 4 | Freeze | n/a | Whoever held stages 2-3; submission is coordinator |
| 5 | Independent verification | n/a, read-only | **Open**, qualifies on Independence |
| 6 | Integration and `DONE` | the integration commit | Coordinator by authority |

**Disclosure carried into stage 1's routing.** While running P1, this coordinator read parts of
`scripts/verify.mjs` — its phase profile list, its usage text, and its step composition around line
344. That is incidental prior knowledge, it is recorded here, and it is **not** available as a
direct-execution reason for any stage of this slice. `playwright.config.ts`, `vitest.config.ts`, and
`vitest.integration.config.ts` have not been read at all.

## Open decisions

**None blocking.** The scoping decision was the human's and is recorded above. If the diagnosis shows
the class cannot be retired within this scope, that is `NEEDS_HUMAN` at the point of discovery, and
everything already measured still ships as evidence.
