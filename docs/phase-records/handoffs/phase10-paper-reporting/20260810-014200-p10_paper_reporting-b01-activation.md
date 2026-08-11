# Phase 10 Owner reporting Paper extension b01 — activation

- Status: `IN_PROGRESS`
- Activated: 2026-08-10 01:42 +03:00
- Repository activation authority point: `237ae18654556d235ac99ed56567e883bfdecf70`
- Repository tracking metadata: `main` /
  `D:/Projects/fitway-worktrees/phase5-staff-integration`; this is not a repository writer
  branch and every repository path remains forbidden to the Paper writer.
- Repair count: 0 of 2.

## Authority and decision

The human-approved direction is already durable in
`docs/phase-records/adr-007-family-coverage.md`: extend the existing approved
Owner/Management production family. Do not create or request approval for an unrelated
production family, do not re-escalate ADR-007, and do not modify Staff, Login, or Public.
The resulting bounded composition is an implementation authority for
`phase10-ui-csv`; it does not alter Product, Spec, data semantics, or API contracts.

## Exclusive Paper lease

Create one new top-level area named
`OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT` in the approved FITWAY Paper
file. The lease covers only that area. Existing approved artboards/components are read-only
references and must remain unchanged. Every repository path is forbidden during this
milestone.

## Required production set

Use the approved Owner rail, tokens, typography, spacing, controls, and state patterns. The
set must cover:

1. desktop English and Arabic;
2. tablet English/Arabic behavior;
3. mobile 390 and 320 behavior in both directions;
4. 200% zoom, reduced motion, and reduced-transparency behavior;
5. loading, error, no-observations, comparable, insufficient-comparison, invalid-range,
   export-preparing, export-failed, keyboard-focus, desktop-hover, mobile-tap, persistent
   selected-cell, and forced-colors evidence, with hover/focus/tap parity and active selection
   identifiable without color alone;
6. a page-local Daily/History switch while the Owner shell retains exactly Monitoring and
   Management as its two global destinations;
7. a reporting start/end range with Apply for history/heatmap aggregation, plus a separately
   controlled owner-only CSV export start/end range and action; the two contracts may offer a
   convenient copy/default but must not be presented as one coupled input, and the CSV range
   alone carries the accepted inclusive 366-day guard;
8. a dominant Sunday-through-Saturday by 00–23 heatmap with distinct `value`, `closed`, and
   `missing` cells, and no capacity, denominator, or public percentage. A value cell encodes
   observed-minute average occupancy and exposes observed/expected open-minute coverage plus
   sample-day count; sample-day count includes only business days with an observed value minute
   in that weekday/hour cell;
9. a separately labelled comparison of the last two complete weeks, independent of both the
   reporting range and CSV export range. It presents weighted observed-minute average occupancy
   and estimated entrance crossings for each week, observed/expected coverage, absolute change,
   and percentage change; a zero prior denominator renders percentage as unavailable rather than
   fabricating a ratio;
10. a semantic table disclosure for the heatmap and a bounded internal-scroll solution on
    narrow screens without page-level horizontal overflow.

Arabic is RTL with Western digits. Closed, missing, and observed zero must remain visually
and textually distinguishable. Use a local red intensity ramp consistent with the approved
theme; do not expand global tokens merely to support this extension.

## Completion and review

The writer must finish its working state cleanly and report the named production set plus
visual inspection evidence. A separate read-only reviewer then checks hierarchy,
responsive/RTL behavior, separate reporting/export ranges, accepted heatmap/comparison metric
semantics, hover/focus/tap/selection parity, color-independent states, accessibility, and
non-interference with existing Paper families. At most two focused repair attempts are permitted. The coordinator alone
updates `PROJECT_STATE.yaml`, releases the Paper lease, and declares this milestone `DONE`.

`phase10-csv-transport` is recorded separately so nonvisual streaming transport does not wait
on composition work. `phase10-ui-csv` starts only after the Paper and transport prerequisites
are both accepted.
