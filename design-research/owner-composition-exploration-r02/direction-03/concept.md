# Direction 03 — The Day Ledger / سجلّ اليوم

**Status:** concept-only exploration. This is one alternative for human comparison, not Owner composition authority, production UI, a canonical, or a promotion decision.

## Visual world

The page behaves like a premium training record. A broad warm mineral sheet carries the measured business day against charcoal basalt. FITWAY red identifies observed activity; oxblood holds its sustained weight. Copper hatching makes missing observation unmistakable without implying danger. The page uses open space, hairline rules, and one large record plane rather than a collection of equal cards. Cairo's actual 400/500/600/700 weights and Western tabular numerals keep the ledger readable in Arabic and English. The material palette is concept-local; it does not change production tokens or the dark-only baseline.

## Whole-page reading order

1. The selected completed illustrative business day and a narrow, explicitly separate current-view sample.
2. The observation record: six discrete hours, with an average and source beside each hour's observed-minute coverage. Hatching is a missing span; a recorded zero has a numeric 0; scheduled closure has its own bands outside the open period.
3. A small evidence margin: observed-minute denominator, highest observed count, average, entrance-crossing fixture, and the explicit meaning of coverage.
4. Minute evidence behind a disclosure. Selecting an hour changes its 60-row minute record. The detail exposes count, missing state, and source for every minute.
5. Quiet signposts for the remaining Owner areas. These are concept destinations only; no production navigation is implemented.

The visual focus is historical completeness and provenance. This differs from an operational-trust-first overview, where the current snapshot would dominate, and from a day-trajectory composition, where one continuous curve would lead. Here the gap interrupts each hour's measured pattern and remains beside its reading.

## Truth and fixtures

The populated fixture is a completed illustrative day with 360 scheduled open minutes, 318 observed values, and 42 missing minutes. The synthetic observations include a genuine zero hour, source values equivalent to device/backfill/manual, and a peak at 16:42. The whole-day coverage is deliberately used only for a completed day; a live-today concept would need an explicit as-of boundary so future scheduled minutes are not mistaken for outages. Coverage expresses completeness, never a numeric confidence score.

The current strip is a **separate sample** representing `staff.operationalSnapshot` semantics. The `/admin` Daily API supplies historical buckets and has no current snapshot or freshness field. The preview never derives current occupancy or freshness from the daily buckets. Fresh, delayed, closed, unavailable, loading, and request-error current examples have distinct copy; closed and unavailable show no current band or count. A real integration would enforce the snapshot's freshness, authorization, and timestamp contract.

The day selector also includes scheduled-closed, no-readings, loading, and error fixtures. Scheduled closure has no expected open minutes and no zero. No-readings has 360 expected minutes but no observed count. Loading and error retain no old historical reading. All values are deterministic and visibly labeled illustrative. The artifact makes no network request, stores no visitor identity, image, video, frame, biometric, or per-visitor data, and includes no operational command.

## Language and device behavior

Arabic RTL and English LTR are separately laid out. Ratios and time runs use bidi isolation and Western digits; Arabic controls place the chevron at the logical end with reserved padding. The record remains full width at tablet sizes. Mobile presents each hour as an evidence row with its coverage beside its reading and keeps the minute table within an internal scroll area. The 320 CSS px / 200% reflow capture uses a 640 px viewport with page zoom 2. All information remains visible without motion; the optional single record arrival is removed by reduced-motion preference.

## Inspection boundary

The exact final frames are listed in `frames/manifest.json`. The author personally inspected the EN/AR 1440×900 desktop, EN/AR 390×844 mobile viewport and full-page captures, EN/AR 320 CSS px at 200% reflow, and closed/no-readings/loading/error mobile frames. Playwright checked document overflow at 320, 360, 390, 721, 768, 820, 1024, 1200, and 1440 px in both locales. These are concept inspection records, not independent perceptual acceptance or human selection.
