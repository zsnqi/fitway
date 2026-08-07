# FITWAY Design Guide

> **Status:** the repository's contract for responsive behavior, RTL and localization,
> interaction and motion, accessibility, the canonical token baseline, and the phase visual
> gate, after the Baseline Reconciliation Gate (2026-07-15). Product, privacy, security,
> content, and data semantics remain governed by `FITWAY_PRODUCT.md` and `SPEC.md`.
>
> **Visual source of truth:** Paper, not this guide. See
> [ADR-007](docs/adr/ADR-007-paper-visual-source-of-truth.md) for the authority split, the Paper
> file identity, and the four approved production families. This guide is subject to ADR-007 for
> visual composition; where an approved Paper production materially conflicts with a section
> here, Paper governs the visual treatment and this guide is amended through an approved phase
> record.
>
> **Approved evidence:** `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml` and the
> immutable snapshot under `visual-direction-gate/approved/fitway-theme-20260715/`.
> The pre-gate guide is retained only as history at
> `docs/archive/design/DESIGN_GUIDE-pre-brg-20260715.md`.

## 1. Direction

FITWAY is **premium first, athletic second, minimal third**. It should feel focused,
confident, operational, and unmistakably FITWAY without becoming loud or ornamental.
The interface uses a near-black field, graphite structure, oxblood depth, concentrated
FITWAY red, disciplined whitespace, decisive Cairo type, and honest live-state signals.

The background atmosphere is static. It may use layered CSS gradients and blurred
pseudo-elements, but never canvas, WebGL, OGL, `requestAnimationFrame`, video, or a
motion/reduced-motion branch for the background. A page-level FITWAY watermark can sit
behind the product surface. Neither atmosphere nor watermark may reduce readability or
become part of a data card.

Broad visual exploration is complete. Improve a route while implementing that route,
then close the phase with the focused polish and screenshot loop in `docs/WORKFLOW.md`.
Do not restart a product-wide redesign.

## 2. Product hierarchy

### Public Live

The public page answers, in this order:

1. Is the gym open, and is the information live?
2. What is the labeled crowd level?
3. What is the approximate count?
4. What does the continuous crowd signal show?
5. When was the reading updated?

The crowd level outranks the approximate count. Public surfaces never show capacity,
a denominator, a capacity-derived percentage, `% full`, health diagnostics, history,
or a person-unit suffix. A historical mockup containing one of those is evidence of
composition only and cannot authorize the content.

### Authenticated operations

- Staff Live is a monitoring grid: current truth first, health second, freshness explicit.
  It is monitoring-only per `docs/adr/ADR-008-staff-monitoring-only.md` — it carries no
  correction, direct-entry, or reset control, and no other command affordance.
- Owner Analytics gives the occupancy curve the broadest span and keeps an accessible
  table or equivalent semantic data next to it.
- History uses a purpose-built heatmap, not public cards repurposed as a chart.
- Settings, access, audit, and health use restrained sections, tables, and forms with
  clear rails and separators rather than a wall of identical cards.

Authenticated staff/owner views may show configured capacity and private percentages
when the relevant Spec contract permits them. That does not weaken the public boundary.

## 3. Color and surfaces

### Core palette

| Token | Value | Use |
| --- | --- | --- |
| `--fw-obsidian` | `#08090A` | page field |
| `--fw-coal` | `#101012` | primary surfaces |
| `--fw-graphite` | `#1A1A1E` | raised/inset structure |
| `--fw-oxblood` | `#4D0713` | deep red atmosphere and completed signal depth |
| `--fw-red` | `#E51935` | primary FITWAY action/accent |
| `--fw-red-bright` | `#FF2946` | current signal cap and focused emphasis |
| `--fw-chalk` | `#F5F3F2` | primary text |
| `--fw-muted` | `#C9C3C4` | secondary text |
| `--fw-text-subtle` | `#AAA4A6` | captions that still meet contrast requirements |
| `--fw-live` | `#4BE29B` | verified live/healthy status only |
| `--fw-delayed` | `#D9A400` | delayed/stale status |
| `--fw-offline` | `#9AA0AA` | unavailable/closed neutral status |

Red is structural and concentrated: the brand, primary action, active crowd signal,
focus accents, and rare critical states. Green means verified live/healthy; it is not a
generic decoration. Amber means delayed attention, not failure. Closed and missing data
remain neutral and distinct from low occupancy.

Surfaces use quiet one-pixel borders, controlled tonal separation, and limited shadow.
Prefer separators and alignment over wrapping every group in a card. Approved radii range
from 8px for compact controls to 28px for the large public board; pills are reserved for
status or compact controls, not every container.

Text and focus indicators target WCAG AA contrast. Do not achieve hierarchy by lowering
normal text below readable contrast.

## 4. Typography and numerals

- Use the self-hosted Cairo Arabic and Latin subsets at actual weights 400, 500, 600,
  and 700. Do not request synthetic 800 or 900.
- Crowd level is the decisive public display. The approximate count is large and
  tabular, but visually secondary.
- Use Western digits `0–9` in both locales. Apply `font-variant-numeric: tabular-nums`
  where values update or align.
- Use `<bdi>` or CSS bidi isolation around numbers, times, IDs, units, and Latin fragments
  embedded in Arabic.
- Never apply negative letter spacing to Arabic. Optical compensation must be tested in
  both scripts and should not move the entire logical grid.
- Persistent captions are at least 10px in the approved reference; production should use
  the largest readable size the layout permits and must still meet normal-text contrast.
- Arabic and English copy are written naturally for their language. English is not a
  word-for-word mirror of Arabic.

## 5. Public crowd instrument

The Public Live signal is one continuous **28-bar cumulative instrument**.

- Bars belonging to completed lower ranges remain visible in deep red.
- The current range is brighter, with the current cap receiving the strongest emphasis.
- Higher pending ranges remain graphite/quiet.
- The red ramp communicates increasing occupancy; no green/yellow/orange categorical
  traffic-light meter is used for crowd intensity.
- Progression and category order follow reading direction: left-to-right in English and
  right-to-left in Arabic.
- The signal is derived from the public `band` only. It must not reconstruct a hidden
  ratio or infer capacity from private data.
- The four labels are Quiet, Moderate, Busy, and Packed, localized naturally. The current
  written label remains visible, so neither color nor position is the only channel.
- The instrument has one concise localized accessible name. Individual decorative bars
  remain hidden from assistive technology. Do not use numeric meter/progress ARIA values
  for this capacity-free categorical signal.
- Data changes are static/instant. The instrument and count do not animate between readings.

## 6. Public state grammar

| State | Required truth | Data visibility |
| --- | --- | --- |
| Loading | Stable structural skeleton, `aria-busy`, concise announcement | No fabricated values |
| Live | Verified live status, band, approximate count, signal, freshness | Current values |
| Delayed | Explicit last-known language and timestamp; never claim live | Last-known count/band/signal may remain visibly qualified |
| Unavailable | Explain that old data is not presented as current | Remove count, band, signal, and timestamp |
| Closed | State closed and show next opening when known | Remove live readings and signal |
| Error | State the failure and offer one focused retry action | Remove readings from visual and accessibility trees |

Status is always text plus a non-color cue. Keep live announcements short and announce
only meaningful state/current-reading changes, not the full page on every poll.

The exact stale-signal colors and pattern treatment remain a phase-owned semantic-polish
item in `docs/POLISH_BACKLOG.md`; implementations must preserve the truth rules above while
that treatment is refined.

## 7. Composition

### Public board

- Use one panoramic dominant board on desktop with disciplined page gutters, aligned
  header/board rails, strong negative space, and an asymmetric metric hierarchy.
- The board shell uses a subtle border, restrained internal graphite/oxblood depth, a red
  edge, and a premium shadow. The board itself must not become a bright red slab.
- Desktop may arrange crowd level and count in an asymmetric split with one intentional
  structural separator. The signal spans the composition below.
- Mobile recomposes into explicit groups: crowd level, count, signal, then freshness.
  It is not a proportionally scaled desktop.
- Do not add marketing copy, promotions, photos, charts, staff diagnostics, or extra cards
  to Public Live.

### Staff and owner

- Keep route-level context and the most important truth visible without scrolling when
  practical, but do not compress metadata below readable sizes.
- Tables use sticky or repeated headers only where they materially help; dense rows retain
  keyboard focus and a mobile strategy (recomposition or a clearly labeled scroll region).
- Forms group fields by decision, keep labels visible, show inline errors near the field,
  and place save/destructive actions predictably.
- Compact informational surfaces should adapt to their content rather than carrying fixed
  minimum heights. Existing fixed-height cases are tracked in the polish backlog.

Spacing uses a 4px base and recurring 8, 12, 16, 24, 32, 48, and 72px intervals. Broad
desktop whitespace is intentional; mobile removes or recomposes space instead of shrinking
everything uniformly.

## 8. Responsive contract

The required review widths are **320, 360, 390, 721, 768, 820, 1024, 1200, and 1440px**.

- `1200–1440`: broad public board and wide operational/data compositions.
- `821–1199`: compressed desktop with the hierarchy intact.
- `721–820`: explicit tablet recomposition. Do not let large display type, a fixed count
  column, or desktop gaps collide.
- `320–720`: mobile hierarchy, one primary column, controls/tables recomposed before they
  force page overflow.

There must be no document-level horizontal scrolling. A data table or tab strip may scroll
inside a labeled region with visible affordance and keyboard access.

Page roots use `100vh` as fallback followed by `100svh`/`100dvh` as appropriate. Physical
safe-area insets use physical left/right properties so RTL does not swap device cutouts.
Test asymmetric safe areas when modifying the shell.

## 9. RTL, localization, and time

- Arabic is default: `lang="ar" dir="rtl"`. English uses `lang="en" dir="ltr"`.
- Content layout, margins, padding, alignment, borders, and rails use logical properties.
- Directional chevrons, back/forward actions, breadcrumbs, and time-series geometry mirror.
  Logos, media controls, clocks, and symmetric shadows do not mirror.
- Data tables preserve meaningful column order per locale rather than reversing blindly.
- Format times in the configured gym timezone. Arabic public time uses localized `ص/م`;
  English uses `AM/PM`.
- Allow at least 30–40% text expansion. Do not truncate critical state, action, or error copy.

## 10. Interaction and motion

Motion is restrained and additive. Use short, property-specific transitions for hover,
focus, press, drawer, and dialog feedback. Avoid `transition: all`.

- Background atmosphere, watermark, occupancy readings, signal bars, and charts at rest
  do not animate.
- Do not animate a number through intermediate values; update it atomically.
- Charts may use a short first-draw reveal only when it improves comprehension. Under
  reduced motion they render the complete final line, fill, points, and labels immediately.
- Loading skeletons are static under reduced motion. A frozen spinner must retain visible
  or assistive loading text.
- Hover is never the only path to information. Chart points support keyboard focus and
  mobile tap selection.

## 11. Controls, forms, and destructive actions

- Practical minimum target size is 44×44px. All interactive controls show a clear
  `:focus-visible` state.
- Icon-only controls require localized accessible names and tooltips where their purpose is
  not obvious.
- Inputs keep persistent labels. Placeholder text is an example, never the label.
- Validation messages are specific, localized, associated with the field, and announced
  without moving focus unpredictably.
- `/staff` issues no command, so it presents no pending/application state and no reset
  confirmation dialog (ADR-008). These rules stand for any future destructive control
  elsewhere in the product, not for the staff view.
- Dialogs receive intentional initial focus, trap focus, close with Escape where safe, and
  restore focus to the trigger.
- Destructive styling is reserved for destructive actions, not general emphasis.

## 12. Data visualization

- Historical rows, not current settings, determine historical band/capacity analytics.
- Occupancy curves show meaningful rises, falls, and plateaus without smoothing away truth.
- Closed, missing, genuine zero, live, delayed, and unavailable are semantically distinct.
- Arabic time flows RTL; English flows LTR. The underlying dataset remains the same.
- Desktop hover, keyboard focus, and mobile tap expose the same point details.
- Selected/active points remain visible without relying on color alone.
- Heatmaps use a calibrated single-hue red ramp for occupancy; closed and missing cells use
  separate neutral treatments.
- Every chart or heatmap has an adjacent/available semantic table or textual equivalent with
  parity to the visualized values.
- Reduced motion renders the complete stable chart rather than removing data.

## 13. Accessibility baseline

- Preserve semantic landmarks and heading order. A visible-on-focus skip link moves focus to
  a programmatically focusable main region.
- Everything works with keyboard alone and at 200% zoom/reflow.
- Status uses text and another non-color cue. The page remains understandable in grayscale.
- Unavailable, error, and closed values are removed from the accessibility tree, not merely
  made transparent.
- Live regions are polite and throttled. Do not announce decorative signal bars or unchanged
  timestamps repeatedly.
- Focus is never hidden behind sticky elements. Modal and menu focus order follows the
  visual/logical order in both directions.
- Data visuals expose names, values, state, and an equivalent semantic representation.

## 14. Canonical tokens

Production code may expose additional semantic aliases, but they resolve to this baseline
unless an approved phase record deliberately changes the system.

```css
:root {
  color-scheme: dark;

  --fw-obsidian: #08090a;
  --fw-coal: #101012;
  --fw-graphite: #1a1a1e;
  --fw-oxblood: #4d0713;
  --fw-red: #e51935;
  --fw-red-bright: #ff2946;

  --fw-chalk: #f5f3f2;
  --fw-muted: #c9c3c4;
  --fw-text-subtle: #aaa4a6;

  --fw-live: #4be29b;
  --fw-delayed: #d9a400;
  --fw-offline: #9aa0aa;

  --fw-space-1: 4px;
  --fw-space-2: 8px;
  --fw-space-3: 12px;
  --fw-space-4: 16px;
  --fw-space-6: 24px;
  --fw-space-8: 32px;
  --fw-space-12: 48px;
  --fw-space-18: 72px;

  --fw-radius-control: 8px;
  --fw-radius-surface: 16px;
  --fw-radius-board: 28px;

  --fw-duration-fast: 120ms;
  --fw-duration-base: 180ms;
  --fw-ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

Crowd-band aliases use the `--fw-band-*` prefix. The approved prototype's
`--fw-text-subtle` and `--fw-ease-out` names/values are preserved verbatim; do not reuse
them for crowd-band semantics.

## 15. Phase visual gate

A UI-producing phase is not done until its affected routes and states pass:

1. interactive Browser review;
2. deterministic Playwright functional checks;
3. Arabic RTL and English LTR;
4. the applicable canonical widths, including 721–820 when the shell changes;
5. keyboard/focus, reduced motion, 200% zoom/reflow, screen-reader names, and no page overflow;
6. automated accessibility plus manual semantic review;
7. screenshot comparison against the approved baseline or the most recent accepted
   phase-specific baseline;
8. at most two focused correction cycles;
9. a fresh independent verifier; and
10. human approval when a material visual or locked-product judgment is involved.

The four known non-blocking refinements—atmospheric blur/position, watermark placement,
stale-signal treatment, and content-adaptive compact surfaces—are owned by
`docs/POLISH_BACKLOG.md`. They are not permission to reopen the visual direction.
