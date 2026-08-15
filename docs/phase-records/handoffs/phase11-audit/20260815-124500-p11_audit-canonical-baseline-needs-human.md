# Phase 11 audit — canonical baseline decision needs human authority

- Status: `NEEDS_HUMAN`. Repair budget stands at `1/2` and is **not** consumed by this.
- Candidate: `f2b2d3c` on `work/phase11-audit-b01` (repair `b13555b` over `8c40740`).
- Blocking item: one browser assertion, `tests/browser/phase11-shell.browser.spec.ts:272`.

## The repair itself succeeded

The Phase 9 regression is fixed and the fix is better than the minimum. `useOwnerAudit` now consumes
the already-resolved `useOwnerDailyAnalytics` result and reads the gym timezone from it, sharing the
React Query cache entry, so the audit section issues **no timezone request of its own**. `/admin`
makes exactly one `admin.analytics.daily` and one `admin.analytics.timeContext` — byte-identical to
before this slice existed, pinned by both a unit assertion and a browser assertion so it cannot
regress unseen.

The worker also found the failure was wider than the coordinator's own reproduction reported: the
same exact-post-data mock exists at `phase11-shell.browser.spec.ts:109-113`, so the true pre-repair
damage was 10 failures across two specs, not 5 across one. Phase 9 is now 5/5 and audit 8/8.

## What still fails, and why no in-slice change can fix it

`phase11-shell.browser.spec.ts:281-290` captures `/admin` with
`expect(page).toHaveScreenshot(..., { fullPage: true })`. Those baselines were approved when
`/admin` hosted only the Phase 9 analytics section. Mounting the audit section — the approved
deliverable of this slice — makes the page taller: expected `1440x1101`, received `1440x1666`. It is
a pure page-height delta; no shell chrome rendering changed.

The failure is independent of the audit section's state, size, or request behaviour. **Any**
rendering of **any** new section on `/admin` changes a full-page capture of that route. The worker
declined to make its section invisible to that test, correctly: that would be gaming a neighbour's
screenshot rather than building the product.

## Why this blocks more than one slice

`phase11-access`, `phase11-settings`, `phase11-health`, and `phase10-ui-csv` all mount on `/admin`.
Each will change the same full-page capture. This is not an audit-slice problem; it is a structural
property of asserting a full-page composition of a route that is designed to host a growing set of
owner sections.

## The two resolutions, both requiring human authority

1. **Re-approve the two shell baselines** in the serialized human-approved pass `AGENTS.md` requires.
   Honest, but it defers the identical decision to each of the four remaining `/admin` slices, and
   each re-approval must be a real visual review, not a rubber stamp.
2. **Scope that spec's capture to the shell chrome** so it asserts the shell rather than whatever
   sections `/admin` hosts, leaving each section's composition to its own slice's baselines. This
   matches what the spec's own title claims to test — "canonical desktop Arabic and mobile English
   **shell** compositions" — and stops the recurrence. But it narrows another milestone's accepted
   acceptance evidence, which is a gate change.

`AGENTS.md` requires human approval to update a canonical baseline or alter a locked visual
decision, and `docs/WORKFLOW.md` puts canonical `toHaveScreenshot` files under coordinator ownership
with human approval for changes. Both routes fall inside that. The coordinator recommendation is
option 2, because option 1 buys nothing structural and re-presents the same question four more
times — but the coordinator did not act on it.

## Nothing was weakened while this is open

No neighbouring spec was edited or mocked around. No assertion of this slice was relaxed. No
canonical baseline was regenerated, including this slice's own two, which still match byte-for-byte.
`scripts/verify.mjs` is coordinator-owned and carries no worker change; the widened profile was
imported to run the gate and restored afterwards.

The merge remains reverted on `main` at `4ec350b`. `main` is clean and green.
