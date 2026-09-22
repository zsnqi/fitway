# Direction 02 — The Dayline / مسار اليوم

**Status:** concept-only Owner exploration. This is one whole-page direction for comparison, not a selected concept, visual authority, production proposal, canonical, or approval record. The standalone preview contains illustrative values and changes no FITWAY application files.

## Thesis

The Owner reads the day as a single operational course. A compact, independent gym-state strip answers the immediate question. The historical day then becomes the page's dominant instrument: one red trajectory across a broad graphite plane, with the first recorded time, an observed peak, an interruption, and a last recorded time visible in the same field. The facts at the edge belong to the same instrument rather than a row of competing metric cards. The detailed minute record waits behind a disclosure.

This is the **day-trajectory narrative** direction. Its attention, rhythm, and interaction follow time and turning points. The state strip is deliberately subordinate in scale while still first in reading order. This distinguishes it from a state/trust-first direction without weakening state truth.

## Visual world

- **Material:** black chassis around one warm graphite recording plane; a pale mineral surface appears only when the underlying minute record opens. FITWAY red carries the observed path, with a restrained amber mark for missing history and neutral closed spans. Borders and shadows are reserved for the main instrument and actual section boundaries.
- **Type:** Cairo at its actual 400, 500, 600, and 700 weights, with compact tabular numerals and a strong but short page heading. Arabic is composed in its own alignment and line rhythm; Western digits remain legible in both languages.
- **Motion:** the chart is stable at rest. Selection changes the persistent detail dock, never moves a tooltip over the data. The preview honors reduced motion; it does not animate values, data, or atmosphere.
- **Interaction:** each marked observation is a 44px keyboard and tap target with a localized name and pressed state. The minute table remains the precise textual equivalent, with a labeled scrolling region and pagination. There is no slider or hover-only reading.

## Information order

1. Current gym state and last update, from a **separate operational snapshot**.
2. The selected, completed business day's observed occupancy course, with closed and missing intervals distinguishable from a genuine zero.
3. Observed peak, daily average of observed open-minute counts, and observed/expected scheduled minutes.
4. Estimated entrance crossings with the required “not unique members” qualification.
5. The minute record, disclosed on demand; then related navigation.

The example day is **Monday, 21 September 2026**, a completed selected business day. The full 7:00–21:00 scheduled opening contributes 840 expected minutes. The illustrative 30-minute missing segment leaves 810 observed minutes. Coverage is shown as **810 of 840 scheduled open minutes**, never as a claim that future scheduled minutes are an outage. A later in-progress-day concept would need to name its full-day denominator and visibly separate future unobserved minutes from past gaps.

## Data and state truth

`DailyAnalytics` contains historical minute buckets, peak, average, entrance crossings, and whole-business-day coverage (`packages/api/src/analytics/daily-analytics.ts`). Its buckets are `value | closed | missing`; it has no current occupancy or freshness field. Even a stored bucket whose source was `live` is still historical here. The red line terminates at the last recorded observation and breaks across missing minutes. Closed time is shown separately. No forecast, interpolation across a gap, live marker, or stale label is inferred from this daily payload.

The independent top strip represents `staff.operationalSnapshot` (`packages/api/src/routers/index.ts:47-54,107-116`). Its schema (`packages/api/src/health/snapshot.ts:28-54`) contains a separate `computedAt`, occupancy payload, and health state; the occupancy payload distinguishes `fresh`, `stale`, `closed`, and `unavailable` (`packages/api/src/public-occupancy.ts:18-48`). Owners can read that staff-or-owner route through `requireStaffOrOwner` (`packages/api/src/index.ts:6-25`). This is an explicit **future UI dependency**, not a claim that the current Owner daily hook already fetches it. The preview fixture selector models that independent source. If that source is loading, unavailable, or errors, no current band or count appears.

The preview also supplies closed-day, no-readings, loading, and request-error day states. A closed day carries no peak or count. A day with no observations cannot derive peak, average, or occupancy from missing minutes. Loading and error replace the historical instrument rather than retaining a plausible curve.

## Bilingual and responsive behavior

English time advances left to right; Arabic time advances right to left from the same ordered dataset. The x-coordinate mapping is mirrored, while text and numerals retain their natural form. At 721–820px, the annotation margin moves below the plot. At mobile sizes, the state strip, title, trajectory, landmark facts, and detail dock stack in reading order. At 320 CSS pixels and 200% device scale, the chart reduces height and nonessential ticks before any page-wide horizontal scrolling occurs. Arabic and English use the same data and state semantics, with localized copy and bidi isolation intent.

## Boundaries and review

This artifact does not reuse the rejected r01 directions, prior Owner prototypes, Public/Staff composition, Paper frame, or incumbent Owner shell as its design source. It uses the existing FITWAY identity and Product/Spec semantics. The dark black/red foundation here is a concept search-space choice; production tokens, Cairo loading, static atmosphere, and all locked rules remain unchanged.

The exact rendered frames and checks are listed in [FRAME_MANIFEST.md](FRAME_MANIFEST.md). They are design evidence for comparison, not perceptual acceptance. A selected direction would still require the later accessibility, independent perceptual, human approval, and separate promotion gates recorded by FITWAY's workflow.
