# Owner r04 — "Redline" (exploration concept)

> Exploration only, with synthetic data. This is not a selected direction, not visual authority, and not a
> production change. The user decides whether to choose, revise, or reject it (packet
> `docs/phase-records/task-packets/owner-design-exploration-r04.yaml`).

## World and thesis

**Redline.** A black stage lit by one FITWAY-red trace: the day is a single smooth, continuous curve, and the
numbers live on the line where they happened. The owner reads the day's shape before reading any card:
the peak is labeled at its apex, the latest reading ends the trace with a ring, and the time still ahead
stays visibly empty, never drawn as zero.

- **Red:** only the locked FITWAY family — `#E51935` for the trace and the active edge, `#FF2946` for
  the current point, focus, and the active section, and `#4D0713` oxblood for depth. No pink or
  desaturated tints. The fill under the curve is red over black, so it reads as oxblood rather than pink.
- **Line:** a shape-preserving cubic (Steffen) that passes through every observation and cannot
  overshoot one. It adds no peak or dip the data does not contain. A soft glow sits under a 2.75px
  stroke. The user's red-line reference informs the line's feel; the chart itself is not copied.
- **Stage:** on wide screens the latest reading floats in the chart's empty morning sky, so the curve takes
  most of the viewport, and gridlines step around the figure. On mobile the figure stacks above a
  full-bleed chart.
- **Shell:** a smoked-glass side rail replaces the clipped horizontal tab strip. It has one 24px line-icon
  family and a sliding red indicator. Mobile uses a sticky glass top bar and a scroll-snapped section strip
  with an edge fade that signals more items.
- **Ledger:** hairline-separated figures with no cards: peak, average, entries, and coverage. The coverage
  bar keeps recorded, missing, waiting, and still-ahead minutes distinct.
- **Motion:** the line draws in once from opening time, and the fill and labels arrive after the pen
  passes. Section changes cross-fade while the indicator slides. Nothing animates at rest, and
  reduced motion renders the finished chart at once.

## Truth rules kept

Missing stretches break the curve with a neutral hatched column. Delayed feeds turn the status amber,
grey the figure, and say it is not live. Time after "now" is an empty hatched region. Hover, tap, and
arrow keys expose the same point details, and a semantic table and slider value text match the chart.
Arabic is the default reading direction, and its time axis mirrors right to left. Digits are Western
in both languages.

## Open it

Open `concept/index.html` directly in Chrome or Edge. It loads the Cairo files from
`apps/web/public/fonts/` by relative path, so keep it inside this repository. Useful query parameters:
`lang=ar|en`, `section=daily|activity`, `state=live|gap|delayed`, `motion=off`.

To regenerate the exact evidence frames in `concept/evidence/`, run this from the repository root. It
serves the repository on loopback port 3140 only while it runs:

```sh
node design-research/owner-composition-exploration-r04/concept/capture.mjs
```

## Scope of this early slice

The slice covers the shared navigation, the Daily page (live, missing-stretch, and delayed previews), and
the Activity Log as one dense governance page. Reports, Access, Operations, and Settings are named
placeholders until a direction is chosen. Minor issues are deliberately left for after that choice.
Known examples: long Arabic cells wrap in the desktop log, the mobile axis labels for now and close
sit close together, and there is no tablet-specific pass.
