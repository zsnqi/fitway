# Phase 11 owner audit — coordinator integration and DONE

- Status: `DONE`. Repair attempts consumed: `1/2`.
- Candidate: `8c40740` plus repair `b13555b` on `work/phase11-audit-b01`, activation `ce82b52`.
- Coordinator run ID / database: `p11_audit_c02` / `fitway_integration_p11_audit_c02`.

## What shipped

An owner-only `admin.audit.list` read surface returning bounded, newest-first keyset pages of
immutable audit records, and an Owner history section inside the owner shell. Exactly the three
existing command actions — `correction_delta`, `correction_absolute`, `reset` — with no
pre-generalization of access or settings kinds, per the authority packet.

The contract keeps three states distinguishable end to end: an absent filter key applies no
predicate, an explicit `null` selects rows where the column is null, and `0` selects zero rows. A
missing prior therefore never becomes zero, in the query, the DTO, the filter, and the rendered
table. Live evidence exists rather than only schema-level evidence: an absolute correction issued
before any edge observation legitimately persists a null prior, and the integration suite observes
two such rows.

No migration and no index were added; the existing `(created_at, id)` index backs the keyset walk.

## Integration history — one gate failure, one repair

The first merge passed independent verification but failed the **coordinator** gate.

`apps/web/src/hooks/use-owner-audit.ts` called `admin.analytics.timeContext`, a Phase 9 procedure,
to obtain the gym timezone. The audit section mounts on `/admin` beside the Phase 9 analytics, which
had already resolved that exact fact. Both neighbouring specs route-mock that procedure with an
exact post-data assertion — `phase9-owner-ui.browser.spec.ts:157-160` and, which the coordinator's
own first reproduction missed, `phase11-shell.browser.spec.ts:109-113`. The true pre-repair damage
was **10 failures across two specs**, not the 5 across one that the coordinator initially reported.

The exact-body assertions were only the detector. Fetching one fact twice was the defect.

**Repair 1/2:** `useOwnerAudit` now consumes the already-resolved `useOwnerDailyAnalytics` result and
reads the timezone from it. Sharing the query key means React Query serves the same cache entry, so
the section issues no timezone request of its own. `/admin` now makes exactly one
`admin.analytics.daily` and one `admin.analytics.timeContext` with the analytics-derived versions —
byte-identical to before this slice existed, pinned by both a unit assertion and a browser assertion
so it cannot regress unseen.

While that shared query is pending or failed the section renders nothing, so `/admin` keeps exactly
one `role="status"`, one `role="alert"`, and one retry control. That was forced by three neighbouring
assertions, and is also the better behaviour: without the gym timezone no record can be dated, and
duplicating a live region and a retry control for a cause the route already reports is noise for a
screen reader.

## The gate defect this exposed

Neither the worker nor the independent verifier could have caught the regression. `verify:fast` runs
no browser tests, and `verify:phase` runs only the profile's `browserFiles` — which for
`phase11-audit` listed just its own spec. **That was a coordinator scoping error in the activation.**
The verifier was rigorous enough to build its own integration and browser probes and was still
structurally blind to it.

`scripts/verify.mjs` now runs `phase11-audit`, `phase9-owner-ui`, and `phase11-shell` together for
this profile. The rule generalizes: `phase11-access`, `phase11-settings`, `phase11-health`, and
`phase10-ui-csv` all mount on `/admin` and must gate on the sibling specs from activation.

## Canonical baseline decision — human authority obtained

After the repair, one assertion still failed and no in-slice change could fix it.
`phase11-shell.browser.spec.ts` captured `/admin` with `toHaveScreenshot({ fullPage: true })`, so
mounting any new owner section changed that composition (`1440x1101` -> `1440x1666`). A pure page
height delta; no shell chrome rendering changed.

The worker escalated `NEEDS_HUMAN` rather than consuming repair 2/2, and explicitly declined to make
its section invisible to that test — correctly, since that would game a neighbour's screenshot rather
than build the product.

**Human decision, 2026-08-15: re-scope the shell capture to the shell chrome.** The canonical capture
now targets `.owner-rail`, so that baseline owns the shell and each section's composition stays
covered by its own slice. This matches what the spec's own title claims to test and stops the
recurrence that would otherwise have returned at each of the four remaining `/admin` slices. Both
images were regenerated at the narrowed scope and visually inspected by the coordinator: Arabic
mirrors correctly with the FITWAY mark at the start edge, English shows the active-state underline,
and real branding is present in both.

This edited and re-approved acceptance evidence belonging to the already-integrated `phase11-shell`
milestone. That requires human authority and had it.

## Independent verification — `PASS`

A fresh verifier at the exact candidate on its own disposable database, instructed not to read the
implementer's handoff until it had recorded its own assessment. It built its own probes rather than
relying on the candidate's tests:

- **Pagination:** twelve rows in four groups sharing identical timestamps, walked at limits 1, 2, 3,
  5, and 7. Every walk equalled the independently computed order exactly, with no duplicate and no
  skip; three concurrent identical requests returned byte-identical sequences; and the tie case was
  asserted to be genuinely exercised rather than vacuously passed.
- **Authorization:** a six-case matrix over real oRPC with real cookies — no cookie, garbage cookie,
  expired owner session, expired staff session, valid staff, valid owner — returning 401, 401, 401,
  401, 403, 200.
- **Privacy:** a forbidden-value list built from the **live database** — owner email, plaintext
  password, plaintext staff PIN, both credential hashes and salts, every session token hash and id,
  and the owner's own cookie. None appears in the parsed response body. Across all shared-staff rows
  the display-name set has cardinality one and equals the persisted principal's name, so no synthetic
  staff identity was invented; the system reset carries null actor fields rather than borrowing a
  label.
- **Timezone:** deliberately a different pair from the candidate's — gym `America/New_York` against a
  device emulated to `Pacific/Kiritimati` (UTC+14), the maximum separation. An entry at
  `2026-08-10T01:30:00Z` rendered the gym's day and clock and explicitly not the device's; filters
  resolved from the gym zone alone.
- **Index:** `pg_indexes` on `audit_log` returns exactly three rows, confirming no index was added.

Findings were observations only, none blocking: an inverted date range silently drops the upper bound
rather than signalling; `effectiveValue` non-nullability and the coherence chain's terminal branch are
the two places a future action set needs an additive edit; the authority packet's reserved Playwright
ports are stale bookkeeping since the config derives ports from the run ID; and SPEC story 26 also
names settings changes, which this slice does not deliver.

## Coordinator gates on merged `main`

| Gate | Result |
| --- | --- |
| `pnpm verify:full` | PASS, exit 0 |
| Browser suite inside the full ladder | PASS — 70 tests |
| Repository mutation guard | "Verification full passed without repository mutation." |
| `git status --short` after the ladder | clean |

## Open item carried forward

**SPEC story 26 is not closed by this slice.** It names "every correction, reset, and settings
change"; this delivers corrections and resets. Settings changes arrive with `phase11-settings`, which
depends on the coordinator audit generalization recorded in
`docs/phase-records/handoffs/coordinator/20260815-013000-audit-generalization-design.md`. The story
must not be marked closed until then.

## Released

Owner, heartbeat, and lease cleared. The four-file wiring lease is released. The widened
`phase11-audit` profile is retained.

Two new canonical baselines in this slice's own subtree are recorded in the coordinator baseline
ledger as **awaiting human ratification**; a passing `toHaveScreenshot` is not approval.

No push, no deploy, no external provisioning.
