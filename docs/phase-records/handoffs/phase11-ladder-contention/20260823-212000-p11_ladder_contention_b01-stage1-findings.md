# Contention stage 1 — diagnosis: findings and gate review

Stage 1 of `p11_ladder_contention_b01`. Read-only, delegated to **ox-alpha**
(`opencode/x-preview-f-free`, `high`, `opencode-cli`), route **reused** per
`docs/phase-records/route-decisions/p11_ladder_contention_b01-diagnosis.json`.

Session `ses_fd0588026ffeeqKlyb4vrGP1Ym`, exit 0, 50 events, one 9,477-character final text event,
finalized on the first invocation. Working tree unchanged on return; the read-only boundary held, and
the worker ran no verification command, as instructed.

**Gate: ACCEPTED.** Every load-bearing claim was checked against the repository by the parent. One
proposed item is **rejected by the parent** and one brief defect is recorded against the parent.

---

## The mechanism, and it is not what this slice was named for

**The slice was activated on the hypothesis of *contention* — parallel workers competing. That
hypothesis is wrong, and the repository says so plainly.**

| Claim | Verified |
|---|---|
| The ladder is strictly sequential | `scripts/verify.mjs:389` — `for (const [label, args] of steps) await runStep(label, args);` |
| The browser step is not parallel | `playwright.config.ts:87` — `fullyParallel: false` |
| The integration step is not parallel | `vitest.integration.config.ts:10` — `fileParallelism: false` |

Nothing runs concurrently with anything. No recorded failure had another step running beside it, and
`p11lc_b1` failed *inside* the integration step while that step had the machine to itself.

**The actual mechanism is timeout headroom.** Every recorded failure is a wall-clock-budgeted
assertion sitting on an unexamined **5000 ms library default**, observed after roughly ten minutes of
preceding ladder work has left residual load on the machine. Exposure tracks each step's *headroom*,
not any shared concurrency window.

**The decisive evidence is that this repository has already diagnosed and fixed exactly this once**,
for the step that consequently almost never fails. `vitest.config.ts:23-26`, verbatim:

> The suite's two heaviest deterministic-compute tests measure 5.9s and 4.0s under full-file
> parallelism, so Vitest's 5000ms default left the shared baseline decided by machine load rather
> than by correctness.
>
> `testTimeout: 20000`

That is the same reasoning, reached independently by an earlier session, and it answers the
discriminating question the brief demanded an answer to: **why the unit step is rare.** Unit sits at
20 000 ms and passed 476/476 across all three baseline runs. Integration and browser sit on 5000 ms
defaults and failed in every baseline run.

Verified against the configuration:

- `playwright.config.ts:102-104` — the `expect` block sets **only** `toHaveScreenshot`, so
  Playwright's `expect` timeout is the 5000 ms default. Every browser-step error text quotes
  `Timeout: 5000ms`.
- `vitest.integration.config.ts:8-12` — no `testTimeout`, so the vitest 5000 ms default applies.
- `playwright.config.ts:89` — `retries: 0`, a deliberate stance.

The worker cited the `expect` block as `:103-110`; it is `:102-104`. Line drift only, substance exact.

## Parent decision — item 2 is rejected

The return proposed two changes. **The parent takes item 1 and rejects item 2.**

**Item 1, accepted.** `playwright.config.ts`, `expect: { timeout: 20_000 }`. Every browser-step
observation in evidence is a default-timeout assertion, and the 20 000 ms figure is not invented —
it is the ratio this repository already ratified for the unit step. Cost is **zero on green runs**,
because auto-retrying assertions resolve as soon as they are satisfied; only a genuine failure
reports up to 15 s later.

**Item 2, rejected: `testTimeout: 20_000` in `vitest.integration.config.ts`.** The worker labelled it
"load-bearing but preventive", which is self-contradictory, and the slice constraint is the *smallest
evidence-supported change **necessary*** to retire the class. It is not necessary:

- **No observed failure has ever hit vitest's integration `testTimeout`.** Both integration-step
  observations — `p11lc_b1` and P2's earlier one — are inside
  `apps/server/src/phase2.integration.test.ts`, whose test already carries an explicit
  `timeout: 60_000` at `:628`. They failed on inner Playwright `locator.waitFor({ timeout: 5_000 })`
  calls, verified at `:739, 769, 773, 779, 783, 788, 792, 797`. A vitest test-level budget is not
  what expired.
- Its justification — dividing the 399–476 s step by 122 tests to get 2.7–3.5 s per test — conflates
  migrations, schema resets, and fixture setup with test execution. That is not a measured per-test
  duration and does not support a ceiling claim.

Rejected as unnecessary, not as wrong. Recorded here so a later session inherits the reasoning
instead of rediscovering the idea and adopting it unexamined.

The worker also listed nine hardcoded waits where there are eight; `:777` is a continuation line.
Trivial, and it does not affect the conclusion.

## What this change cannot fix, stated plainly

The worker was explicit and the parent confirms it: **the class cannot be retired by configuration
alone.** Item 1 raises the *default* `expect` timeout. It does not touch:

- explicit per-call timeouts in test source — the eight 5000 ms `waitFor` calls in the phase2
  integration test, and the explicit `timeout: 3_000` in `tests/browser/phase2.browser.spec.ts:85-87`;
- a transient element that has already gone by the time it is sampled, where a longer wait cannot
  create what is no longer rendered — the open question over
  `tests/browser/phase10-ui-csv.browser.spec.ts:742`.

Those are assertion-level and belong to `phase11-browser-debt`, whose repairs already exist on its own
branch and which is deliberately not in this one. **The two slices are complementary, not
overlapping**, and the approved sequence — contention first, then P1 stage 3 — is what retires the
class between them. This is a scoping fact, not a stop condition.

## Prediction, in falsifiable form

After item 1, at this base, across fresh ladders:

- **Should stop:** `tests/browser/phase3.browser.spec.ts:82` — the closed-heading assertion, which
  uses the `expect` default and failed in two of three baseline runs. Browser-step red rate should
  fall from roughly 2 in 3 toward 0.
- **Should persist:** the `phase2.integration.test.ts` waits, which item 1 does not reach.
- **Unknown:** `phase10-ui-csv.browser.spec.ts:742`, if its element never commits at all.

If browser reds continue at the baseline rate, the mechanism is wrong and the change fails. That is
the test stage 3 runs.

## A defect in the parent's own brief

The brief and the first version of the baseline record cited
`docs/phase-records/verification/20260823-p11_browser_debt_b01-ladder-load-sensitivity-observations.json`,
which is committed on `work/phase11-browser-debt-b01` and **does not exist on this branch**. The
worker caught it, said so in its first line, and substituted the two records that do exist here.

The file is deliberately **not** copied onto this branch: this slice's `forbiddenPaths` place every
`phase11-browser-debt` record out of scope, and duplicating a record across branches to satisfy a
citation would be a scope breach dressed as tidiness. The baseline record now carries a
`cross_branch_evidence_note` saying so. Recorded as a parent defect because a brief that points at a
file the worker cannot open is a briefing error, and it happened to be caught only because the worker
reported it rather than quietly inventing around it.

## Carried forward

- **The slice's name is now misleading.** `phase11-ladder-contention` describes the rejected
  hypothesis, not the mechanism. The milestone id is left unchanged — renaming a live milestone id
  across a ledger, a branch, and a records directory buys nothing and risks a stale reference — but
  every record from here on names the mechanism as **timeout headroom**.
- The residual-load *source* is inferred, not confirmed. Windows Defender scanning freshly written
  build and test artifacts is the leading candidate on this win32 machine. Not needed for the change,
  and not investigated.
- **M4, M5, rate limiting on the owner access leaves, and the `docs/WORKFLOW.md` step-8 environment
  gap** remain untouched and unscheduled.
