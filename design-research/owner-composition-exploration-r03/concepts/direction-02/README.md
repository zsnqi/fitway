# Direction 02 — Editorial operations journal

**Status:** early Owner concept exploration only. No visual direction, production baseline, data source, or canonical frame is approved or changed by this artifact.

## Thesis

Read the Owner workspace like an operations journal: a strong typographic state masthead establishes what record is being read, a vertical sequence explains the day, and governance events appear as complete entries before scope controls. Daily's time graphic uses discrete dots and intervals, with a visible interruption for missing history, rather than a connected line or panoramic horizon. The chart and its exact text table share one deterministic illustrative dataset.

The first desktop viewport presents the day title, its non-live sample context, the interval chart, and separate peak, coverage, and crossing measures. The first mobile viewport reaches the chart and its selected detail without stacking three metric panels first. The Activity Log puts full event records on screen before its range control, including actor, action, before and after values, and reason.

## Visual decisions

- Keeps a recognizably FITWAY near-black/oxblood field, concentrated red emphasis, and restrained translucent top/plot surfaces. Fine separators and typography carry hierarchy instead of a wall of cards.
- Uses one authored, 1.7px rounded-stroke SVG icon family. Red identifies the current chapter and chart selection; pink denotes historical observations, neutral marks missing data, and white carries core reading. No green is used because nothing in this concept is verified live.
- Cairo is self-hosted at actual 400/500/600/700 weights for Arabic and Latin. Numerals stay Western in both languages.
- Desktop navigation is a fixed chapter rail. Mobile navigation is a full, explicit six-item drawer with an open/close control and Escape recovery; it cannot silently clip.
- On mobile, a non-interactive 12-interval overview keeps the whole day and missing hour visible. The detailed readings scroll horizontally in 44px-wide, non-overlapping button targets; menu and language controls also meet 44×44px. The overview and hint are localized, as are skip-link and landmark labels.
- Arabic is composed in RTL, including the time sequence and the directional change arrow. English is LTR. Critical labels wrap instead of truncating.

## Interaction and motion

- Change any of the six chapters from the shared navigation. Daily and Activity Log are developed slices; Reports, Access, Operations, and Settings are concise compositional extensions.
- Choose a chart point with mouse, touch, or keyboard. Selection changes the visible time/value/state detail and keeps focus on that point.
- Change the Activity Log example range from 7 to 30 days. The record count updates and a polite feedback line names the new scope.
- Chapter transitions briefly settle the heading and point selection briefly settles the detail; the data dots, values, and atmospheric background remain still at rest. `prefers-reduced-motion: reduce` makes those transitions effectively instant.

## Other Owner chapters

- **Reports:** A day-by-hour heatmap and comparison narratives use the same editorial chapter frame. Coverage accompanies every aggregate; closed, missing, and observed zero remain separate. CSV export has a quiet, separately labeled action area.
- **Access:** Accounts read as role records with status first. Routine actions remain restrained; one-time reveal and destructive changes receive protected, explicit treatment. This sketch does not simulate credentials or authentication.
- **Operations:** Uptime, historical coverage, and alert delivery have distinct evidence sections. An absent observation never becomes an outage claim.
- **Settings:** Schedule, thresholds, and technical timing are distinct chapters. The active edit group keeps its save/discard status and time semantics in view.

## Data truth and limits

All values, dates, records, schedule text, and actor roles are synthetic and labeled illustrative in the UI. They are not measured FITWAY truth. The sample 06:00–18:00 day contains 12 hourly buckets, one missing hour, 660 observed of 720 expected open minutes, a peak of 54 at 16:00, and an illustrative estimate of 148 entrance crossings (not unique members). Missing history is neither zero nor a connected interpolation. This concept has no network calls, persistence, visitor identity, images, biometrics, or per-visitor records. It intentionally does not model the production state machine, authorization, or full six-section workflows.

## Run and verify

From the repository root:

```powershell
node design-research/owner-composition-exploration-r03/concepts/direction-02/preview.mjs
node design-research/owner-composition-exploration-r03/concepts/direction-02/verify.mjs
```

The isolated preview listens only on `127.0.0.1:3112`. Use `?section=daily&lang=en` or `?section=log&lang=ar` for deterministic frames. Evidence in `evidence/` contains Daily and Activity Log at EN/AR 1440×900 and 390×844. The verification script refreshes those exact frames and checks navigation, chart selection/focus, non-overlapping 44×44px mobile targets, localized landmarks, range feedback, locale direction, Escape recovery, 320/390/720/1440 horizontal overflow, the 720px equivalent of 1440px at 200% reflow, reduced-motion duration, and page errors. The coordinator still owns the cross-direction visual comparison and acceptance gate.
