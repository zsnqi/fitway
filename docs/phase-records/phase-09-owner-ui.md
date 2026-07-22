# Phase 9 owner analytics transport and UI contract freeze

- Status: `FROZEN_FOR_BATCH_03_CONTINUATION`
- Frozen: 2026-07-21T22:11:26+03:00 by the Batch 03 coordinator
- Authority: `FITWAY_PRODUCT.md`, `SPEC.md` §§487–497 and §§586–600, `PHASES.md` Phase 9,
  `DESIGN_GUIDE.md` §§2, 8, 9, 12, and 13
- Implementing slice: `phase9-owner-ui`; the already integrated
  `phase9-analytics-domain` remains read-only.

## Frozen owner analytics transport

Router lane B exposes the owner-only daily oRPC leaf,
`admin.analytics.daily`. Its input is a strict optional object
`{ businessDay?: "YYYY-MM-DD" }`. If absent, the server derives the current gym business day
from the effective settings timezone and business-day boundary; it never accepts the browser's
timezone as authority. The response is the existing `DailyAnalytics` DTO from
`packages/api/src/analytics/daily-analytics.ts`, without reshaping, recomputing, or removing
its fields:

- `businessDay`, `timeline`, `peak`, `dailyAverage`, `estimatedEntranceCrossings`,
  `observedOpenMinutes`, `expectedOpenMinutes`, and `coverage`;
- timeline buckets remain exactly `value | closed | missing`; `closed`/`missing` use
  `count: null`, while genuine zero remains a `value` with `count: 0`;
- value buckets retain stored band, capacity snapshot, settings version, source, entries, and
  exits; historical settings are never recomputed from later settings.

The leaf uses `ownerProcedure`, injects `readDailyAnalytics` through API context/server wiring,
and maps no repository or database error to a fabricated empty result. Missing/expired session
is `401`; a staff session is `403`; transport failure remains a UI error. The transport is
authenticated/private only and does not modify public schema v2, its cache policy, or the
capacity-free anonymous boundary.

### Binding timezone continuation (2026-07-22)

Runtime timezone authority is `settings_versions.timezone` from the append-only row effective at
the evaluated instant: the greatest `(effectiveFrom, version)` not later than that instant.
`Asia/Riyadh` is only a default pending on-site confirmation, not a current-value hardcode or
fallback. Browser timezone is never authority.

`DailyAnalytics` remains unchanged. The private owner transport also exposes
`admin.analytics.timeContext`, with strict input `{ settingsVersions: number[] }` of unique
positive safe integers and strict output `{ current: { settingsVersion, timeZone }, versions:
Array<{ settingsVersion, timeZone }> }`. `current` resolves at server `now`; every requested
version must resolve to a valid IANA timezone or the request fails. The daily leaf uses the
current effective timezone and internal boundary when `businessDay` is absent. UI timeline and
peak times use the mapping for each bucket's own `settingsVersion`, preserving historical
meaning. This private companion does not reshape `DailyAnalytics` or alter public v2.

## UI acceptance contract

The owner route replaces the owner placeholder with the owner-only analytics view: today’s
curve is dominant; peak, observed-open-minute average, estimated entrance crossings explicitly
framed as not unique members, and coverage are visible. An adjacent/available semantic table
has parity with the visual data. Arabic RTL and English LTR preserve natural time direction,
Western digits, gym-local times, bidi isolation, keyboard point focus, desktop hover, and
mobile tap equivalence. Loading, transport error, no observed data, missing data, scheduled
closed time, and genuine zero are visibly and semantically distinct. No value is smoothed,
invented, or represented as live occupancy.

The view follows the approved dark FITWAY baseline; no global token or canonical screenshot is
changed. Review captures stay under the allocated run output and are non-canonical until human
approval. The worker must use its transferred lane-B lease for production transport and must not
mock the production transport as a completed feature or edit any other API/server aggregation.

## Router lane B sequencing

`phase5-command-domain` is integrated and router lane A is released. The Batch 03 continuation
transfers router lane B to `phase9-owner-ui` in a new recorded lease. Only that transfer permits edits to
`packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, and `apps/server/src/index.ts`
plus the exact Phase 9 integration test to wire the frozen leaves. No other API/server path is
leased by implication.

## Required proof

Focused evidence includes component/unit coverage for every analytical state, deterministic
browser checks in both locales, the required responsive widths, keyboard/focus/reduced-motion
and 200% reflow, automated accessibility, review captures, and a fresh independent verifier.
The verifier must also confirm server-enforced owner behavior once lane B is transferred. A
material visual-direction change, public/private boundary change, historical-analytics semantic
change, unleased router edit, or incompatible Product/Spec reading is `NEEDS_HUMAN`.

When no interactive Browser backend is attached, record that environment limitation and use
repository Playwright, automated accessibility, deterministic captures, and direct screenshot
inspection as repeatable visual evidence. Absence of that optional backend alone is not a blocker.
