# P1 stage 1 — timing-mechanism investigation: findings and gate review

Stage 1 of `p11_browser_debt_b01`. Read-only, delegated to **ox-alpha**
(`opencode/x-preview-f-free`, control `high`, transport `opencode-cli`) per
`docs/phase-records/route-decisions/p11_browser_debt_b01-investigation.json`.

Session `ses_fd0e380f3ffeh8xx9e137rJIlB`, exit 0, 49 events, one 9,161-character final text event that
finalized on the first invocation — no exact-session fallback required. Working tree confirmed
unchanged on return, so the read-only boundary held. Events captured outside the transcript.

**Gate: ACCEPTED, with two corrections recorded below.** The parent checked every load-bearing claim
against the repository rather than against the report.

---

## The decision this stage was run to inform

**Decision D1's condition for location 4 is NOT MET. The pre-committed fallback fires.**

Stage 2 stabilizes the three browser assertions only. `apps/server/src/phase2.integration.test.ts:779`
is **not** repaired in this slice; it takes a register entry and its own follow-up, exactly as the
activation fixed in advance.

The parent verified this independently rather than accepting it:

- The file imports `chromium` from `@playwright/test`
  ([apps/server/src/phase2.integration.test.ts:24](../../../../apps/server/src/phase2.integration.test.ts))
  and `expect` from **vitest** (:31). Playwright's web-first assertions and `expect.poll` are therefore
  not in scope in this file; `locator.waitFor()` — already used at :766-769, :776-779 and :785-788 — is
  the strongest state-arrival primitive it has. Importing Playwright's `expect` would add polling with
  a timeout, which is what is already there.
- The assertion's proof is that a **real** pipeline propagates a new count: a Python simulator, an
  edge push, a Hono server, a jittered client poll
  ([apps/web/src/hooks/use-public-occupancy.ts:25-37](../../../../apps/web/src/hooks/use-public-occupancy.ts),
  `nextPollDelay` 0.9–1.1× at
  [apps/web/src/lib/public-occupancy.ts:46-51](../../../../apps/web/src/lib/public-occupancy.ts)), then a
  React commit. There is no event or signal to await other than the text itself.
- `page.clock` cannot substitute: `effectiveFreshness` compares page `Date.now()` against real server
  timestamps ([apps/web/src/lib/public-occupancy.ts:83-86](../../../../apps/web/src/lib/public-occupancy.ts)),
  so faking page time changes what is proved.

Making that arrival deterministic requires mocking the pipeline, which deletes the assertion's
end-to-end meaning — precisely what P1's binding constraint forbids. **(a) is also only partially
established**: the causal chain is architectural reading, not a reproduced observation.

This is the conditional structure earning its keep. Had the activation widened the repair
unconditionally, stage 2 would now be attempting a repair that cannot be made without destroying the
assertion, against P1's repair budget, with Slice B waiting behind it.

---

## Findings, per location

Claims below are the worker's, retained verbatim in substance. Parent verification is marked.

### 1 — `tests/browser/phase2.browser.spec.ts:72` — *verified*

- **Samples.** The lifecycle "fresh badge → locally expires to stale text → exactly one request":
  `تحديث مباشر` (:84), `آخر عدد تقريبي معروف` within 3s (:85-87), then the non-retrying
  `expect(requests).toBe(1)` (:88). The transition is driven by `freshUntil = Date.now() + 500` built
  inside the route handler (:79).
- **Mechanism.** The fresh state exists only inside a fixed 500ms wall-clock window anchored when the
  route fulfills. If load/hydration/first React commit lands after it closes, the client mounts
  already-stale — the `delay <= 0` branch at
  [use-public-occupancy.ts:43-45](../../../../apps/web/src/hooks/use-public-occupancy.ts) — the badge
  never renders, and :84 times out despite correct behaviour.
- **Proof kind.** Mixed. The fresh→stale flip genuinely depends on elapsed time; `requests === 1` is
  state-arrival.
- **Deterministic wait.** `page.clock.install()` + `fastForward(500)` between the two visibility
  assertions. **Not** `setFixedTime`, which freezes time and fires no timers.
- **Parent verification.** Lines :72, :79, :84-88 confirmed exactly. The `delay <= 0` branch confirmed.

### 2 — `tests/browser/phase3.browser.spec.ts:57` — *verified, and it refutes the register entry*

- **Samples.** `nextOpenAt = Date.now() + 1500` captured in Node before `goto` (:60-65); the route
  returns closed for requests 1-2 and open from request 3 (:70-80). Asserts closed heading (:82),
  `غير متاح` within 3s (:84-86), `poll(requests >= 3)` within 4s (:87-89), open heading within 4s
  (:90-92).
- **Mechanism.** Every transition is a wall-clock offset against a fixed budget. Expiry fires 1500ms
  after a Node-side `Date.now()` taken *before* `goto`; after expiry the third response arrives only
  through the poll loop with ±10% jitter. Under contention, `goto` plus hydration can consume the
  1500ms margin — first paint then skips straight to unavailable, so **:82** can time out — and the
  expiry→refetch→poll chain can overrun the fixed 4s budgets at :87-92.
- **This refutes the register entry's stated mechanism.** Entry `browser-phase3-transient-state`
  records "a transient-state timing assertion", and its own title concedes it was "recorded alongside
  the other two". The worker could not reproduce that reading: once expiry fires, `غير متاح` persists
  until the third response — at least one ~900ms poll minimum — which is far longer than Playwright's
  sampling granularity. The plausible red sites are **:82** or the **4s budgets at :87-92**, not the
  transient.
- **Proof kind.** Mixed.
- **Deterministic wait.** `page.clock.install()` + `fastForward(1500)` to drive the boundary timer at
  [use-public-occupancy.ts:69](../../../../apps/web/src/hooks/use-public-occupancy.ts), then
  `fastForward(~1100)` for the poll timer, asserting the same three states between steps.
- **Parent verification.** Lines :57, :60-65, :70-80, :82-92 confirmed exactly.
- **Consequence for stage 2, and it is material.** Nobody has observed *which* assertion in this test
  went red — the register recorded a test declaration, not an assertion. Stage 2 must establish that
  before repairing, or it will close the entry with evidence for the wrong assertion. This is the
  weakest-grounded of the three in-scope locations.

### 3 — `tests/browser/phase10-ui-csv.browser.spec.ts:742` — *verified, with one correction*

- **Samples.** The History panel shows `loading` while prerequisites are pending (:756-757), then
  `error` (:763-765). The pending window exists only because the mocked daily route delays fulfillment
  by a fixed 350ms (:748-751, implemented at :177-179).
- **Mechanism.** The transient's lifetime is bounded by a **mock timer**, not by app speed — a
  correction to, not a restatement of, the register's hypothesis. The assertion samples only after
  `goto` returns, hydration completes, and the `#owner-analytics-history-tab` click lands (:753-754).
  Under load that unbounded gap exceeds the remaining 350ms, the query has already settled into error,
  and :757 times out waiting for a state that no longer exists.
- **Proof kind.** State-arrival. The proof is "pending is observable before error", not a duration.
- **Deterministic wait.** Replace the fixed delay with a deferred, manually-resolved route
  fulfillment: assert loading while the response is held, then resolve and continue.
- **Parent verification.** Lines :742, :748-751, :177-179, :756-757 confirmed exactly.

**Correction 1 — a risk the worker overstated.** Its risk bullet says `dailyDelayMs` "is also used by
the test at :789, which may depend on the fixed-delay behavior." That is wrong on the specifics.
`grep -rn dailyDelayMs tests/browser/` returns four hits: the option declaration (:157), its
implementation (:177-178), and exactly one call site — **:749, this test**. Line 789 passes
`heatmapDelayMs`, a different option. The *helper* is shared; the `dailyDelayMs` *option* is not.
The location-3 repair is therefore **safer** than the return claims, and stage 2 must not design
around a constraint that does not exist.

**Correction 2 — an unconfirmed link the worker correctly flagged, restated so stage 2 cannot miss
it.** The return attributes the pending state to the analytics page query at
[owner-analytics-page.tsx:10-11](../../../../apps/web/src/components/owner/owner-analytics-page.tsx),
but the asserted locator `[data-owner-reporting-state='loading']` is emitted by
[owner-reporting-view.tsx:646-648](../../../../apps/web/src/components/owner/reporting/owner-reporting-view.tsx)
— a different subtree. The worker marked this as unconfirmed in UNCERTAIN, which is correct and is
why the finding is accepted rather than rejected. **Stage 2 must close that mapping before repairing**;
the 350ms-window reasoning depends on it being direct.

### 4 — `apps/server/src/phase2.integration.test.ts:779` — *verified; condition NOT MET*

Covered above. The recorded line is the closing line of the `changedCount` `waitFor` at :776-779;
identical waits sit at :766-769 and :785-788. `deterministic_wait: NONE`, and the parent independently
confirmed why.

---

## Risks carried into stage 2

1. `page.clock.setFixedTime` — the repository's only precedent, at
   [phase3.browser.spec.ts:24](../../../../tests/browser/phase3.browser.spec.ts) and
   `public-baseline.browser.spec.ts:39` — **freezes time and fires no timers**. The repair needs
   `install()` + `fastForward`. No existing use of `install`/`fastForward` exists in this repository,
   so this pattern is new here and carries no local precedent to copy.
2. `install()` also fakes react-query's internal timers. Benign on this hook — `retry: false`,
   `refetchInterval: false` at [use-public-occupancy.ts:19-22](../../../../apps/web/src/hooks/use-public-occupancy.ts),
   both confirmed by the parent — but it must be verified rather than assumed.
3. With a fake page clock, payload timestamps at phase2 :79 and phase3 :60-65 must derive from the
   installed fake time, not Node `Date.now()`, or `effectiveFreshness` evaluates against the wrong
   timeline.
4. Location 1's `expect(requests).toBe(1)` (:88) is the strict half of the proof. A clock-based
   rewrite must keep it strict — never `>= 1` — and place it after the fast-forwarded stale render.
   Weakening it would be changing what the assertion proves, which the constraint forbids.
5. Location 2 may need no transient fix at all. Repairing "the transient" there would be fixing the
   wrong thing.

## Uncertainties, retained rather than smoothed away

- For all three browser locations the registered line numbers are **test declarations**, so which
  individual assertion went red is inferred, not observed. This is a property of the register, not of
  the investigation.
- Location 2's refutation is analysis, not a reproduction.
- Location 3's pending→locator mapping is untraced (Correction 2).
- Location 4's contention chain is inferred from architecture; nothing was executed.

## Register consequence

Two entries will need their `mechanism` corrected when they close, not merely their status flipped:
`browser-phase3-transient-state` (refuted) and `browser-phase10-csv-history-retry` (bounded by a mock
timer, not by app speed). An entry closed with a mechanism nobody could reproduce is the same defect
the register exists to prevent.

A third entry must be **opened** for `apps/server/src/phase2.integration.test.ts:779`, per D1's
fallback, recorded as known-unusable by Slice B. That is stage 3's work.
