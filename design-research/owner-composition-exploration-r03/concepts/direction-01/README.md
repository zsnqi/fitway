# Direction 01 — Owner Observatory

**Status:** concept exploration only. No Owner visual authority, product data, route, or production UI is changed.

## Thesis

A panoramic temporal observatory makes the current gym state the first read and gives the business day's observed trajectory the largest continuous surface. The six destinations live in a compact section rail that stays in the same place on every view. Governance uses a record ledger, with the complete action, time, actor, and subject readable before expanding a record. This is an operational instrument, not a stack of metric cards.

## Spatial and visual system

- **Daily:** one broad, lightly translucent horizon holds the status, approximate count, observed curve, missing interval, coverage, and selected hour. The trend is a broken line with a visibly neutral gap at 13:00; the gap never reads as zero. The current value and the day history remain distinct.
- **Activity Log:** a dense, table-like ledger on desktop becomes complete stacked records on mobile. Filters sit immediately before the records. Each row expands to contextual detail rather than requiring horizontal table scrolling.
- **Navigation:** one rail carries a consistent family of six 1.8px stroke SVG icons. On mobile it becomes a two-row, full-width section dock with no clipped destinations.
- **Color roles:** concentrated FITWAY red marks active wayfinding and observed history; warm graphite and translucent oxblood hold depth; green means only the illustrative fresh/open state, amber only delayed, and neutral gray means missing or unavailable. Status is always written as text.
- **Typography:** self-hosted Cairo at actual 400/600/700 weights; Western numerals in both languages. Arabic is a composed RTL layout, including reverse time flow, not a flipped screenshot.

## Interaction and motion

Open `index.html` through the local preview server. Navigation changes all six destinations and keeps the active section marked. Daily's chart points support click, keyboard Enter/Space, and tap; the selected hour updates a text readout. The hourly table is an equivalent text representation. The data-state control previews fresh, delayed, closed, unavailable, error, and loading truth; error has a retry-preview action. Activity Log filters and record disclosure give immediate visible feedback. A short section reveal and restrained control transitions aid orientation. Under `prefers-reduced-motion: reduce`, the view reveal and transitions are removed while all information stays present.

The preview includes an illustrative access/operations/settings/reports destination note. A full version would use this grammar as follows:

- **Reports:** lead with the selected business-day range and heatmap; put coverage and comparison next to the chart, and CSV next to its exact export range.
- **Access:** show owner accounts and shared PIN credentials as different record types; routine actions are quiet, while rotation/deactivation require explicit confirmation and one-time reveal handling.
- **Operations:** keep uptime, reading coverage, and alert delivery on independent timestamped tracks; a reading gap cannot imply an outage.
- **Settings:** group capacity/thresholds, weekly hours, and timing into chapters; show dirty/save/discard state beside the active chapter.

## Data truth and limits

The date, counts, curve, coverage, and audit events are deterministic illustrations, clearly labeled in the UI. The chart contains 14 observed values over 15 hours and no value at 13:00. The 20:00 value is 37, matching the illustrative current count. No live request, visitor identity, per-visitor record, PIN, account identifier, export, or setting mutation exists. Closed/unavailable/error/loading previews remove the occupancy reading; delayed keeps a visibly qualified last-known value and curve. Other destination notes are composition ideas, not full workflows or acceptance evidence.

## Run and evidence

From the repository root:

```sh
node design-research/owner-composition-exploration-r03/concepts/direction-01/serve.mjs
node design-research/owner-composition-exploration-r03/concepts/direction-01/capture.mjs
```

The preview is on `127.0.0.1:3111`. The capture script uses the repository's installed Playwright package and creates exactly these viewport captures:

| Surface | English | Arabic |
| --- | --- | --- |
| Daily desktop | `evidence/daily-en-1440x900.png` | `evidence/daily-ar-1440x900.png` |
| Daily mobile | `evidence/daily-en-390x844.png` | `evidence/daily-ar-390x844.png` |
| Activity Log desktop | `evidence/activity-log-en-1440x900.png` | `evidence/activity-log-ar-1440x900.png` |
| Activity Log mobile | `evidence/activity-log-en-390x844.png` | `evidence/activity-log-ar-390x844.png` |

The final eight files were opened and inspected at native dimensions. The script checked EN/LTR and AR/RTL, absence of document overflow at 1440px, 390px, and 320px, chart selection, state truth and retry feedback, navigation, filter/disclosure, locale switching, and reduced-motion style. `pnpm check:design-context` passed with permitted child-process execution. Impeccable `detect --json` returned `[]`. These checks and frames support concept comparison only; they do not approve an Owner direction or production promotion.
