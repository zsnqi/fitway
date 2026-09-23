# Direction 04 — Evidence Desk / Signal Wall

**Status:** early Owner exploration only. This concept changes no production UI, route, data contract, token baseline, canonical, Paper artifact, manifest, or visual authority. It is not a selected direction.

## Thesis

Run the Owner workspace as an evidence desk. The Daily view puts the reliability of the record beside the hourly signal: a large 11-of-12 coverage instrument occupies one side and discrete, selectable bars occupy the other. An absent hour is hatched and interrupted. A thin evidence strip follows with peak, observed/expected open minutes, and estimated entrance crossings as separate measures. The Activity Log begins with events, not filters; one event's complete audit fields are open, and other records disclose progressively.

This world is deliberately different from an editorial journal: its navigation is a workspace switcher in the top chrome (a bottom sheet on mobile), its opening is an asymmetric instrument wall, and its time grammar is rectangular hourly bars rather than a dot/interval sequence or line horizon.

## System decisions

- The dark FITWAY field, oxblood atmosphere, red signal, and limited translucent chrome preserve recognizable character. Historical values use a single red family; muted steel denotes coverage context, and dashed warm neutral denotes missing history. Green is reserved for verified live/healthy production state, so this completed sample does not use it.
- One square-ended 1.8px SVG stroke family covers switching, chart, reports, access, activity, operations, settings, and gap states. Labels and position carry meaning alongside color.
- Cairo is self-hosted at actual 400/500/600/700 weights. Both languages use Western numerals. Arabic is RTL with a true RTL time flow; English is LTR.
- The six-section switcher shows all destinations in two columns without clipping. Its mobile panel rises from the bottom; Escape or the close control returns focus to the trigger.
- Controls have persistent accessible names, visible keyboard focus, and scoped polite feedback.

## Interaction and motion

- Select an hourly bar by mouse, touch, or keyboard. The time, value, or missing state updates in a persistent detail row, and focus stays on the selected bar.
- Open an Activity Log event to reveal actor, before, after, and reason. Focus remains on the event button. The first event is open on entry so a full record is immediately visible.
- The 7/30-day control updates the example record set in place and names the new scope.
- The switcher and selected detail settle with a short blur/translation reveal. Background, readings and chart bars remain still at rest. Reduced-motion preference makes these changes effectively instantaneous.

## Extension to the other chapters

- **Reports:** A calibrated day-by-hour heatmap has closed, missing and genuine-zero treatments, with coverage and historical settings version next to each aggregate. CSV export remains a separate labeled action.
- **Access:** Accounts read as complete role/status records. Routine changes stay neutral; one-time credential reveal and destructive actions receive their authorized confirmation flow and risk treatment.
- **Operations:** Health transitions, historical coverage and alert delivery occupy distinct evidence lanes. Missing history cannot imply an outage.
- **Settings:** Schedule, thresholds and technical timing use bounded edit groups with a visible local save/discard state and clear time semantics.

## Data truth and limits

Every value and event is deterministic synthetic material, explicitly labeled illustrative or sample. The example 06:00–18:00 business day has 12 hourly buckets, one missing hour, 660 observed of 720 expected open minutes, an illustrative peak of 54 at 16:00, and 148 estimated entrance crossings (not unique members). The missing hour is neither zero nor interpolated; observed zero is its own 06:00 bar. The static concept makes no network request, stores no personal or visitor data, and does not simulate authorization, commands, credentials, or the full production state machine.

## Run and verify

From the repository root:

```powershell
node design-research/owner-composition-exploration-r03/concepts/direction-04/preview.mjs
node design-research/owner-composition-exploration-r03/concepts/direction-04/verify.mjs
```

The static preview listens only on `127.0.0.1:3114`. Query examples: `?section=daily&lang=en` and `?section=activity&lang=ar`. The `evidence/` directory contains exact Daily and Activity Log viewport PNGs in EN/AR at 1440×900 and 390×844. The verification script checks switcher/Escape, bar detail and focus, event expansion and focus, range feedback, RTL, horizontal overflow at 320/390/720/1440, reduced-motion behavior and runtime page errors. A 720px CSS viewport approximates 1440px desktop reflow at 200%. The coordinator owns the cross-direction visual comparison and acceptance gate.
