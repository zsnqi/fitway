# P1 — browser load-sensitivity debt: NEEDS_HUMAN

Milestone `phase11-browser-debt`, run `p11_browser_debt_b01`, branch `work/phase11-browser-debt-b01`,
candidate `75f751e`, base `9ca0ef1`. Repair budget **0 of 2 consumed** — no gate has judged this
candidate, so nothing here is a validation failure.

**P1 delivered its scope. It cannot deliver its purpose, and closing that gap would contradict a
human decision. That is the whole reason this stops here.**

Slice B has not started and remains blocked. Nothing about Slice B changed.

---

## One decision is needed

The approved plan's premise was that the load-sensitive debt is **three browser assertions**. That
premise does not survive this slice's evidence. The recorded human decision built on it —

> The register is not narrowed and the risk is not accepted; the debt is fixed first.

— was made when the debt looked like three assertions in one ladder step. It now spans **four files
across three ladder steps**, including the unit step. Deciding what to do about that is not the
coordinator's call, because every available option either contradicts that decision or changes scope
materially.

### Options, and what each costs

| | Option | Cost |
|---|---|---|
| **A** | Widen P1 again to cover each newly observed location | Does not converge. Each full ladder has so far surfaced a *different* location. P1's repair budget is 2, and this is whack-a-mole against a mechanism, not a set of bugs. |
| **B** | Fix the mechanism, not the instances — reduce browser/vitest worker contention or serialize the ladder's steps | Probably the real fix, since every observation is contention-shaped. But it touches `playwright.config.ts` and/or `scripts/verify.mjs` — coordinator-owned shared test-runner configuration that gates **every** phase — so it needs its own slice and its own verification. Explicitly forbidden inside P1. |
| **C** | Register the new locations and let future candidates attribute them | The human already declined to accept the risk. It also would not help Slice B: every new location's surface includes `apps/web/**` or `tests/browser/**`, so Slice B loses the attribution exactly as it loses the existing three. |
| **D** | Ship P1 as scoped, treat the residual as a separate correctly-scoped follow-up | Honest and cheap — the three repairs are real and verified. But Slice B still does not get the clean ladder the human asked for, so the blocker is only partly removed. |

**Recommendation: B, then D.** The evidence points at one shared cause rather than four independent
defects, and B is the only option that could actually retire the class. D is what P1 becomes once B
exists. This is a recommendation, not a decision.

---

## What shipped, and it is sound

Three commits, each independently revertible.

| Commit | Spec | Repair |
|---|---|---|
| `0243b0d` | `tests/browser/phase2.browser.spec.ts:72` | Page clock installed and paused; payload stamps derive from that instant; expiry fired by `fastForward(500)` instead of wall-clock luck |
| `438fdac` | `tests/browser/phase3.browser.spec.ts:57` | Wall-clock anchoring removed from the whole closed→open chain; boundary and jittered poll timers driven deterministically |
| `75f751e` | `tests/browser/phase10-ui-csv.browser.spec.ts:742` | The daily response is withheld behind a promise the test releases, so the prerequisite pending state no longer races a 350ms mock timer |

**Verification of the repairs themselves:**

- The three specs together at the candidate: **11 passed (52.6s)**, run by the coordinator, not the implementer.
- The complete browser suite at the candidate, three consecutive times: **83 passed (1.0m)**, **83 passed (1.1m)**, **83 passed (1.0m)**.
- **In five full-suite executions, no failure ever landed on an assertion this slice touched.**
- Non-vacuity: two behaviours were deliberately broken and the specific repaired assertions failed as intended, then were restored.

**The constraint held.** `expect(requests).toBe(1)` is untouched and still strict. Every new
`expect.poll` replaced an assertion that was already retrying, at the same target and the same
budget — no retry was added, no timeout widened, no proof weakened. Both helper signature changes
default to prior behaviour, so sibling tests are byte-identical. Verified hunk by hunk by the
coordinator against the diff, not against the worker's report.

## Why the gate did not close

`pnpm verify:full` never went green. Two runs, two different failures, **neither in this candidate's scope**:

- **`p11bd_r1`** — browser step, `tests/browser/phase10-ui-csv.browser.spec.ts:791`. Structurally
  excluded as a regression: that test passes no `dailyHold`, so the changed guard is false and no
  await runs, exactly as before. A provable no-op.
- **`p11bd_r2`** — **unit** step, `apps/web/src/hooks/use-owner-reporting.test.tsx:456`. This
  candidate modifies three Playwright specs and no application source, no unit test, and no shared
  unit fixture. It cannot reach a vitest hook test. Passes **18/18** standalone.

Neither may be attributed, for two independent fail-closed reasons: the register forbids a run
registering its own flake, and this candidate touches `tests/browser/**`, which is inside both
surfaces. One unattributed failure makes the whole run red. So the run is red, correctly.

Full evidence, including the third observation the stage-2 implementer reported in an untouched
sibling: `docs/phase-records/verification/20260823-p11_browser_debt_b01-ladder-load-sensitivity-observations.json`.

**The register entries were NOT closed.** Closing them requires evidence that the assertions stopped
being load-sensitive under full-ladder load, and there is no green full ladder to offer. Closing them
on standalone runs would be exactly the defect the register exists to prevent. Stage 3 is not done.

## What stage 1 established that outlives this stop

- **Decision D1 resolved on evidence: `apps/server/src/phase2.integration.test.ts:779` is deliberately
  not repaired.** Its file imports `chromium` from `@playwright/test` and `expect` from **vitest**, so
  Playwright's web-first assertions are unavailable and `locator.waitFor` is already its strongest
  primitive. Its proof is that a real simulator→edge→server→poll pipeline propagates a count, with no
  signal to await but the text itself; `page.clock` cannot substitute because `effectiveFreshness`
  compares page time against real server timestamps. Determinism there requires mocking the pipeline,
  which deletes the assertion's meaning.
- **The register's mechanism for `phase3.browser.spec.ts:57` is refuted.** Once expiry fires, the
  unavailable text persists for at least one ~900ms poll cycle — far longer than sampling
  granularity. The register recorded a *test declaration*, not an assertion, so which assertion went
  red was never observed. Its entry needs its `mechanism` corrected at closure, not just its status
  flipped. The same applies to the phase10 entry: that transient is bounded by a mock timer, not by
  app speed.
- **A pattern new to this repository is now in use**: `page.clock.install()` / `pauseAt` /
  `fastForward`, with no prior precedent here. The non-obvious reason it is needed is recorded in the
  specs' comments — react-query delivers cache notifications through `setTimeout(0)`, which a paused
  fake clock owns, so the flush steps are load-bearing rather than decorative.

## Routing

| Stage | Route | Trigger | Outcome |
|---|---|---|---|
| 1 investigation | ox-alpha `opencode/x-preview-f-free` / `high` | Volume | PASS |
| 2 stabilization | ox-alpha `opencode/x-preview-f-free` / `high` | Recoverability, Economy | PASS |

Both evaluated before their own target-file discovery, both verified by
`scripts/resolve-opencode-worker.mjs` with no lifecycle violations, both **requalified rather than
reused** — the registry had moved from `2026-08-23.1` to `.6` under the prior decision. Outcomes
appended to the candidate's evidence record; registry regression harness re-validated at 45/45.

The stage-2 preflight overturned the assumption it started from, which is why it was run rather than
reasoned about: the expectation was that a browser run needs `.env` and that provisioning secrets to
an external writer would be the blocker. The three target specs mock every route and need no `.env`
at all, and preparing an isolated worktree cost 13.2s — so write isolation was satisfied and no
excluded payload class ever entered the packet.

Two minor findings recorded against stage 2, neither blocking: the worker left one stray file from a
Windows-style stderr redirect issued inside bash (removed; never reached the candidate), and two
phase3 heading assertions now yield a weaker failure message than Playwright's locator diagnostics.

## State

- Branch `work/phase11-browser-debt-b01` at `75f751e`, working tree clean.
- Disposable worktree `D:/Projects/fitway-worktrees/p11-browser-debt-w01` still exists and is
  prepared; remove it when this slice closes.
- Disposable databases `fitway_integration_p11bd_r1` and `_r2` exist; drop them when this slice closes.
- Not submitted to independent verification. Stage 5 is barred from ox-alpha, which implemented stage 2.
- **M4, M5, rate limiting on the owner access leaves, and the `docs/WORKFLOW.md` step-8 environment
  gap** remain exactly as P2 left them: named, recorded, unscheduled.

## Recommended next session

Decide among A–D above. If **B**, it is its own slice against `playwright.config.ts` and/or
`scripts/verify.mjs` under a coordinator lease, with its own verification — and P1 resumes at stage 3
afterwards to close the register entries with a green ladder behind them.
