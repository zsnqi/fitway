# Phase 9 owner analytics transport and UI contract freeze

- Status: `FROZEN_FOR_BATCH_03`
- Frozen: 2026-07-21T22:11:26+03:00 by the Batch 03 coordinator
- Authority: `FITWAY_PRODUCT.md`, `SPEC.md` §§487–497 and §§586–600, `PHASES.md` Phase 9,
  `DESIGN_GUIDE.md` §§2, 8, 9, 12, and 13
- Implementing slice: `phase9-owner-ui`; the already integrated
  `phase9-analytics-domain` remains read-only.

## Frozen owner analytics transport

The later router-lane-B change exposes one owner-only oRPC leaf,
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
approval. The worker may build UI and its adapter against this frozen DTO while router lane B is
unavailable, but it may not mock the production transport as a completed feature or edit any
API/server aggregation before the coordinator transfers lane B.

## Router lane B sequencing

`phase5-command-domain` exclusively holds router lane A during its active lease. After that
slice passes independent verification and is integrated, the coordinator may transfer router
lane B to `phase9-owner-ui` in a new recorded lease. Only that transfer permits edits to
`packages/api/src/context.ts`, `packages/api/src/routers/index.ts`, and `apps/server/src/index.ts`
to wire the frozen leaf. The phase9 worker stays within its web scope until the transfer; it
does not take lane A by implication.

## Required proof

Focused evidence includes component/unit coverage for every analytical state, deterministic
browser checks in both locales, the required responsive widths, keyboard/focus/reduced-motion
and 200% reflow, automated accessibility, review captures, and a fresh independent verifier.
The verifier must also confirm server-enforced owner behavior once lane B is transferred. A
material visual-direction change, public/private boundary change, historical-analytics semantic
change, unleased router edit, or incompatible Product/Spec reading is `NEEDS_HUMAN`.
