# Ladder contention — DONE, with a net-zero code diff and a negative result

Milestone `phase11-ladder-contention`, run `p11_ladder_contention_b01`, branch
`work/phase11-ladder-contention-b01`, base `9ca0ef1`.

**The slice did its job and the answer is that no configuration change is warranted.** Its deliverable
is evidence, not a diff. The code diff against `main` is **zero** — the one change it made was
reverted by its own validation.

## What it found

**The premise the slice was activated on was wrong, and its own replacement was wrong too.** Both are
recorded because both cost something to establish.

1. **Contention is not the mechanism.** Nothing in this ladder runs concurrently:
   `scripts/verify.mjs:389` awaits each step in turn, `playwright.config.ts:87` sets
   `fullyParallel: false`, and `vitest.integration.config.ts:10` sets `fileParallelism: false`.
   Baseline run `p11lc_b1` failed *inside* the integration step while that step had the machine to
   itself.
2. **Timeout headroom is not the mechanism either.** This was stage 1's diagnosis, and it was a good
   one — it explained the unit step's rarity by its already-raised 20 000 ms budget at
   `vitest.config.ts:23-26`, whose own comment records an earlier session reaching the same
   conclusion. It was tested and it failed.

## The falsification, which is the actual result

Stage 1 committed to a falsifiable prediction in advance, including its own falsifier: *"If browser
reds continue at the old rate, the mechanism is wrong and this recommendation fails."*

| | Baseline (`b1`–`b3`) | Candidate (`c1`–`c4`) |
|---|---|---|
| Browser step red | 2 of the 2 runs that reached it | **4 of 4** |
| Reported timeout | `5000ms` | **`20000ms`** |

The change worked. Every candidate failure reports `Timeout: 20000ms` where every baseline failure
reported `5000ms`. The assertions waited four times as long **and the element still never appeared.**

A latency ceiling explains an element arriving *late*. It cannot explain an element *absent after 20
seconds*.

**Corrected mechanism:** these assertions sample a state that has already passed, or that never
renders at all, because residual machine load pushes page load, hydration and first React commit past
the window in which the state exists. Waiting longer moves the observation *further past* the window,
not closer to it. No timeout value can fix this, which is why no configuration change can.

Full evidence:
`docs/phase-records/verification/20260823-p11_ladder_contention_b01-falsification-result.json`,
with the pre-change baseline at
`docs/phase-records/verification/20260823-p11_ladder_contention_b01-baseline-measurements.json`.

## Why the change was reverted rather than kept

The slice constraint is the smallest evidence-supported change **necessary** to retire the class. The
evidence says this change retires nothing, while costing every phase's gate up to 15 extra seconds
per genuine failure, permanently. Keeping a configuration change whose justifying mechanism has been
falsified is precisely the unjustified drift the constraint exists to prevent. Reverted at `ceb0968`.

It is not kept as "harmless hygiene" either. Adopting configuration on plausibility rather than
evidence is the habit the constraint was written against, and the fact that it happened to be *my*
proposal is not a reason to relax it.

## What this buys, and it is not nothing

**It independently vindicates the repair slice's approach, using evidence that did not exist when
that slice made its choices.** All four candidate failures are assertions `phase11-browser-debt` had
already repaired on its own branch:

| Candidate failure | Repaired by |
|---|---|
| `phase10-ui-csv.browser.spec.ts:757` — loading element not found | `75f751e`, held-open route promise |
| `phase2.browser.spec.ts:84` — fresh badge substring never appeared | `0243b0d`, paused page clock |
| `phase3.browser.spec.ts:82` ×2 — closed heading not found | `438fdac`, paused page clock |

That slice's stage-1 investigation predicted these exact modes from source — it said the fresh badge
"never renders" when hydration outruns the 500 ms window, and that the phase3 closed heading can be
skipped entirely when `goto` plus hydration consumes the 1500 ms margin. Both are now **observed**
rather than argued, by a different slice at a different commit.

**Controlling the clock and the fixture is the only thing that can work here**, and those repairs
already exist.

## Gates

| Gate | Result |
|---|---|
| Unit / integration / browser / accessibility / visual | **NOT_REQUIRED** — the code diff against `main` is empty |
| Independent review | **NOT_REQUIRED** — see below |

Independent review is recorded as `NOT_REQUIRED` deliberately, not skipped. There is no executable
change to review; the slice's conclusion is mechanically checkable from the recorded output values
(`5000ms` → `20000ms`, element still not found); and the positive claim it feeds — that
assertion-level determinism is the fix — gets a **stronger** check than any review, because
`phase11-browser-debt`'s own gate now has to produce green ladders against exactly these four
failures. If that does not happen, this conclusion is wrong and it will be visible immediately.

Validation evidence: seven full `verify:full` runs, three at baseline and four at the candidate, each
with a unique `FITWAY_RUN_ID` and its own disposable database.

## Next

`phase11-browser-debt` unblocks with **no dependency to wait for**. Its three repairs already address
every failure this slice observed. It resumes at **stage 3** — closing the three register entries
against a genuinely green full ladder — and two of those entries need their recorded *mechanism*
corrected, not merely their status flipped:

- `browser-phase3-transient-state` — the "transient" mechanism is refuted; the red site is the closed
  heading at `:82`, now observed four times across two slices.
- `browser-phase10-csv-history-retry` — bounded by a mock timer, not by app speed.

The `apps/server/src/phase2.integration.test.ts` location now has a **second independent
observation** (baseline `p11lc_b1`, a different session and commit from P2's), which changes what
stage 3 may legitimately do with it.

Slice B remains unstarted and must not start until P1 is legitimately closed.

**Carried forward untouched:** M4, M5, rate limiting on the owner access leaves, and the
`docs/WORKFLOW.md` step-8 environment gap.
