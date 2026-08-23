# P1 — browser load-sensitivity debt: candidate for independent verification

Milestone `phase11-browser-debt`, run `p11_browser_debt_b01`, branch `work/phase11-browser-debt-b01`.
Base `9ca0ef1`. Repair budget **0 of 2 consumed** — no gate has rejected this candidate.

Supersedes the `NEEDS_HUMAN` handoff of the same slice, which is retained as the record of why the
work paused and what the human decided.

## What this candidate is

Three load-sensitive browser assertions made deterministic, and the three known-flaky register
entries closed against a green ladder with two of their mechanisms corrected.

| Commit | File | Repair |
|---|---|---|
| `0243b0d` | `tests/browser/phase2.browser.spec.ts:72` | Page clock installed and paused; payload stamps derive from that instant; expiry fired by `fastForward(500)` |
| `438fdac` | `tests/browser/phase3.browser.spec.ts:57` | Wall-clock anchoring removed from the closed→open chain; boundary and jittered poll timers driven deterministically |
| `75f751e` | `tests/browser/phase10-ui-csv.browser.spec.ts:742` | Daily response withheld behind a promise the test releases, so the prerequisite pending state stops racing a 350 ms mock timer |
| `8b67cf8` | `docs/phase-records/verification/known-flaky-register.json` | All three entries closed; two mechanisms corrected, one refuted |

Executable diff against `main`: **exactly those three spec files**, 86 insertions, 20 deletions.
Nothing else.

## Acceptance evidence

**Three consecutive `pnpm verify:full` invocations at the candidate, each exit 0**, each with a unique
`FITWAY_RUN_ID` and its own disposable database:

| Run | Unit | Integration | Browser + a11y | Elapsed |
|---|---|---|---|---|
| `p11bd_g1` | 476/476 | 122/122 | **83/83** | 640 s |
| `p11bd_g2` | 476/476 | 122/122 | **83/83** | 632 s |
| `p11bd_g3` | 476/476 | 122/122 | **83/83** | 562 s |

**What makes this evidence rather than a quiet day** — the same ladder, same machine, same day, seven
runs total:

| Candidate | Ladders | Result |
|---|---|---|
| Base, no repairs | 3 | **3 of 3 red** |
| Playwright `expect` timeout raised to 20 000 ms, no repairs | 4 | **4 of 4 red** |
| These repairs, no configuration change | 3 | **3 of 3 green** |

Only the assertion-level repair produced green. The middle row is the
`phase11-ladder-contention` slice, which tested a configuration fix, falsified it, and reverted —
`docs/phase-records/verification/20260823-p11_ladder_contention_b01-falsification-result.json`.

## The constraint, and how it was held

**Fix the sampling, not the assertion's meaning.**

- `expect(requests).toBe(1)` at `phase2.browser.spec.ts` is untouched and still strict — never
  loosened to `toBeGreaterThanOrEqual`.
- Every new `expect.poll` **replaced an assertion that was already auto-retrying**, at the same target
  and the same budget. No retry was added, no timeout widened, no proof weakened.
- Both helper signature changes (`usablePayload` stamps, `openPayload(base)`) default to prior
  behaviour, so sibling tests in those files are byte-identical.
- Non-vacuity was demonstrated, not asserted: two behaviours were deliberately broken and the
  specific repaired assertions failed as intended, then were restored.

Every hunk was reviewed against that standard by the coordinator, against the diff rather than
against the implementer's report.

## What is deliberately NOT in this candidate

- **`apps/server/src/phase2.integration.test.ts:779`** — excluded by decision D1 at activation, on
  stage-1 evidence. That file imports `expect` from vitest, not Playwright; its proof is real
  end-to-end pipeline propagation with no signal to await but the text itself; and `page.clock` cannot
  substitute because `effectiveFreshness` compares page time against real server timestamps.
  Determinism there requires mocking the pipeline, which deletes the assertion. Now consolidated with
  both its observations at
  `docs/phase-records/verification/20260823-phase2-integration-browser-wait-followup.json` and
  scheduled as milestone `phase11-e2e-propagation-wait`.
- **Runner and ladder configuration.** `phase11-ladder-contention` held that lease, tested it, and
  falsified it. Reopening it is not this slice's work.
- **M4, M5, rate limiting on the owner access leaves, and the `docs/WORKFLOW.md` step-8 environment
  gap** — carried forward by P2, still unscheduled, still untouched.

## Routing

| Stage | Route | Trigger | Evidence | Outcome |
|---|---|---|---|---|
| 1 investigation | ox-alpha `opencode/x-preview-f-free` / `high` | Volume | requalified | PASS |
| 2 stabilization | ox-alpha `opencode/x-preview-f-free` / `high` | Recoverability, Economy | requalified | PASS |
| 3 register closure | direct | — | n/a | this commit |

Every stage's delegation test was evaluated before that stage's own target-file discovery, verified by
`scripts/resolve-opencode-worker.mjs` with no lifecycle violations. Stage 2's preflight overturned its
own starting assumption: the three specs need no `.env` at all, so write isolation was satisfiable and
no excluded payload class ever entered the packet.

**Stage 5 must not route to ox-alpha**, which implemented stage 2. Independence is the point of that
gate.

## For the verifier

- Base `9ca0ef1`, candidate at `HEAD` of `work/phase11-browser-debt-b01`.
- `git diff main..HEAD -- ':!docs' ':!PROJECT_STATE.yaml'` is the whole executable change.
- Environment: `set -a; . ./.env; set +a` from the worktree root first; run browser steps from
  PowerShell; create the disposable database named for your run id before invoking `verify:full`.
- **Reproducing the stochastic claim is the substance of this gate.** One green ladder is not the
  claim; the claim is that these three assertions no longer depend on machine load. The baseline and
  falsification records give you the comparison to test against.
- Two minor findings already recorded against stage 2, neither blocking: the implementer left a stray
  file from a Windows-style stderr redirect in its disposable worktree (removed; never reached the
  candidate), and two phase3 heading assertions now yield a weaker failure message than Playwright's
  locator diagnostics.
