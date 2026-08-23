# P1 — browser load-sensitivity debt: integrated and DONE

- Status: **`DONE`**. Milestone `phase11-browser-debt` integrated into `main`.
- Base `9ca0ef1`. Branch `work/phase11-browser-debt-b01`.
- Repair budget: **0 of 2 consumed.** No gate ever rejected this candidate.
- **Slice B has not started and was not started here.**

## What shipped

Three load-sensitive browser assertions made deterministic, and the three known-flaky register entries
closed with two mechanisms corrected and one refuted.

| Commit | Assertion | Repair |
|---|---|---|
| `0243b0d` | `tests/browser/phase2.browser.spec.ts:72` | Page clock installed and paused; payload stamps derive from that instant; expiry fired by `fastForward(500)` |
| `438fdac` | `tests/browser/phase3.browser.spec.ts:57` | Wall-clock anchoring removed from the closed→open chain; boundary and jittered poll timers driven deterministically |
| `75f751e` | `tests/browser/phase10-ui-csv.browser.spec.ts:742` | Daily response withheld behind a promise the test releases, so the pending state stops racing a 350 ms mock timer |

Executable diff: exactly those three spec files. `git diff 9ca0ef1..<candidate> -- ':!docs' ':!PROJECT_STATE.yaml'`.

## The evidence, and why it is a comparison rather than a quiet day

Eleven full ladders on the same machine on the same day:

| Configuration | Ladders | Result |
|---|---|---|
| Base, no repairs | 3 | **3 of 3 red** |
| Playwright `expect` timeout raised 5000→20000 ms, no repairs | 4 | **4 of 4 red** |
| These repairs, no configuration change (coordinator) | 3 | **3 of 3 green** |
| These repairs, independent verifier | 4 | **3 green, 1 red at an excluded site** |

**Across the six ladders that reached the browser step with these repairs in place, the three repaired
assertions failed zero times** — 83/83 every time. Only the assertion-level repair produced green; the
configuration route was tested and falsified by its own slice.

## Gates

| Gate | Result |
|---|---|
| Unit | PASS — 476/476 |
| Integration | PASS — 122/122 |
| Browser / accessibility | PASS — 83/83, reproduced independently three times |
| Visual | NOT_REQUIRED — no `apps/web/**` or screenshot change |
| Freeze | PASS — `frozen: true`, all checks exit 0, run after every durable record was written |
| Independent review | **PASS**, no blocking findings |

## What the verification gate bought

The verifier exceeded its brief in the directions that matter, and it earned its cost:

1. **Four ladders instead of two**, provisioning a fourth database itself — which is how the
   informational finding below surfaced at all.
2. **Non-vacuity on two assertions instead of one**, and for phase3 it chose the *exact* load-induced
   mode — boundary already passed at mount — rather than an arbitrary break. That is a sharper test
   than the implementer's.
3. **It checked the refutation against `git show main:`** rather than accepting it, confirming the red
   site on `main` really was the closed heading.
4. **It caught an overclaim the implementer had missed.** The register's closing evidence, worded from
   three green ladders, could be read as asserting the ladder is now unconditionally green — which its
   own fourth ladder disproved. The wording was tightened at its request to state precisely what is
   proven: these three assertions no longer depend on machine load, not that the ladder is always
   green.

## Scope of the PASS

The verdict attaches to `b57aecb`. The commits after it contain **records only**, no executable code,
and exist to act on the verifier's own finding. A later commit touching executable code in these paths
inherits nothing from that verdict.

## Routing

| Stage | Route | Trigger | Evidence | Outcome |
|---|---|---|---|---|
| 1 investigation | ox-alpha `opencode/x-preview-f-free` / `high` | Volume | requalified | PASS |
| 2 stabilization | ox-alpha `opencode/x-preview-f-free` / `high` | Recoverability, Economy | requalified | PASS |
| 3 register closure | direct | — | n/a | — |
| 5 verification | deepseek-v4-pro `opencode-go/deepseek-v4-pro` / `max` | Independence | requalified | PASS |

Every implementation and investigation stage had its delegation test evaluated when the stage opened,
before that stage's own target-file discovery, verified by `scripts/resolve-opencode-worker.mjs` with
no lifecycle violations. ox-alpha was **barred from stage 5** because it implemented stage 2.

Two routing notes worth carrying forward:

- **Stage 2's preflight overturned its own premise.** The expectation was that a browser run needs
  `.env`, making secret provisioning the blocker. It does not: the three specs mock every route and
  run green in a fresh worktree with no `.env` at all, prepared in 13.2 s. Recorded as a preflight
  finding rather than left as an assumption.
- **The resolver reported ox-alpha's stage-5 bar as an availability filter**, which is factually wrong
  about the candidate — an artifact of expressing an independence bar through the availability input.
  The real reason is recorded in full in the route decision so a later reader is not misled by the
  machine-readable line.

## Carried forward, deliberately unrepaired

- **`apps/server/src/phase2.integration.test.ts:779`** — excluded by decision D1 on stage-1 evidence
  and now **observed three times by three different sessions**, including once by this slice's own
  verifier. Scheduled as milestone `phase11-e2e-propagation-wait` with two repairs forbidden up front:
  raising a timeout (falsified on the sibling class) and mocking the pipeline the assertion exists to
  prove. It is a scheduled defect, **not an attribution** — no session may cite it to excuse a red run.
- **M4, M5, rate limiting on the owner access leaves, and the `docs/WORKFLOW.md` step-8 environment
  gap** — carried forward by P2, still unscheduled, still untouched.
- **Two phase3 heading assertions now yield a weaker failure message** than Playwright's locator
  diagnostics. Non-blocking, confirmed by the verifier, recorded for whoever next debugs that test.

## Next

**Slice B — `phase11-access-ui`.** Its blocker is now removed: the three register entries that Slice B
could never have attributed are closed, and the ladder is green on the surface Slice B will occupy.
Its plan is section "Slice B" of
`docs/phase-records/handoffs/coordinator/20260823-124724-p11-access-successor-sequence-plan.md`, and
its base is this integrated commit rather than the `aaa646b` that plan names.

One thing Slice B should know that the plan predates: if a new load-sensitive failure appears in Slice
B's own spec, no register entry covers it, and the two mechanisms proven here — a state that has
already passed, and a fixed wall-clock window that hydration can outrun — are the first things to
check. Raising a timeout is not the fix; that was tested and falsified.

No human decision is outstanding.
