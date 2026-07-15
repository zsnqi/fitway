# FITWAY visual system — final prototype

This system is extracted from the approved Public Live master and applies only to the isolated visual prototype. Product semantics, access rules, and production files remain unchanged.

## Character

Premium first, athletic second, minimal third. FITWAY uses a near-black field, measured oxblood depth, one structural red rail, disciplined typography, and data graphics that read as instruments rather than decoration. Red carries structure and current emphasis; it is not a general-purpose fill.

The page atmosphere is static: an asymmetric burgundy cut-light, low oxblood depth, soft vignette, and a cropped FITWAY watermark behind the primary surface. It contains no canvas, WebGL, animation, or background lifecycle.

## Foundations

| Role | Value | Use |
| --- | --- | --- |
| Obsidian | `#08090A` | page foundation |
| Coal | `#101012` | primary dark surface |
| Graphite | `#1A1A1E` | raised and inset structure |
| Oxblood | `#4D0713` | atmospheric depth only |
| FITWAY red | `#E51935` | structural rail and primary action |
| Bright red | `#FF2946` | current signal and fine highlight |
| Chalk | `#F5F3F2` | primary text |
| Muted text | `#C9C3C4` | secondary reading |
| Quiet text | `#AAA4A6` | captions and metadata |
| Live green | `#4BE29B` | verified live state |
| Delayed amber | `#D9A400` | stale/delayed state |
| Offline gray | `#9AA0AA` | closed/offline/unavailable state |

Surfaces progress from page foundation to primary board, operational panel, and inset controls. Borders are quiet white transparencies; separators establish reading groups rather than boxing every element. Corners range from 8px controls to 28px primary public surfaces.

## Typography

- Cairo is the sole prototype family for Arabic and Latin, using real 400, 500, 600, and 700 files.
- Public crowd level is the display voice and always outranks the approximate count.
- Numeric data uses tabular figures and `<bdi>` when embedded in bidirectional copy.
- Arabic display text has no Latin-style negative tracking; small optical ink compensation is allowed without changing layout geometry.
- Captions never fall below 10px at the narrowest supported viewport and use a contrast-safe quiet-text tone.

## Composition

- Public Live is a panoramic status instrument: status/freshness, dominant crowd level, secondary count, then the cumulative crowd signal.
- Authenticated pages use an operational grid: truth and system state first, actions second. Dashed or inset treatment distinguishes controls from authoritative data.
- Analytics gives the curve the broadest span and keeps a semantic table adjacent or available.
- History uses a purpose-built heatmap rather than forcing the data into public cards.
- Governance routes use restrained tables and form sections with the same rails, separators, and surface hierarchy.

Spacing follows a 4px base with recurring 8, 12, 16, 24, 32, 48, and 72px intervals. Broad desktop whitespace is intentional; mobile removes or recomposes space instead of proportionally shrinking it.

## Data graphics

- The public crowd signal is one continuous 28-bar cumulative instrument. Completed bands remain visible, the current band is brightest, and higher bands stay pending.
- Logical time and intensity progression is left-to-right in English and right-to-left in Arabic.
- Red ramps encode increasing occupancy. Closed and missing data never share that ramp.
- Staff/owner charts may show configured capacity and percentages. Public surfaces never do.
- Interactive points/cells provide accessible names, keyboard focus, and a semantic table or equivalent textual summary.

## State grammar

- **Live:** green verified status, current reading, freshness, and active signal.
- **Loading:** stable non-animated structural skeleton with `aria-busy` and a concise status announcement.
- **Delayed:** amber status, explicit last-known labels, dimmed/hatched data, and no live claim.
- **Unavailable:** removes count, signal, and timestamps; explains that old data is not presented as live.
- **Closed:** removes live readings and shows the next opening time.
- **Error:** removes readings, states the failure, and provides a focused retry action.

Public privacy is locked: no total capacity, capacity percentage, `% full`, or person-unit suffix is exposed. Public users see only current occupancy information. Authenticated operational and historical semantics remain available to the permitted roles.

## Responsive model

The supported review widths are 320, 360, 390, 721, 768, 820, 1024, 1200, and 1440px.

- 1200–1440: broad public board and wide operational/data compositions.
- 821–1199: compressed desktop with preserved hierarchy.
- 721–820: explicit tablet recomposition; freshness wraps safely, hero columns narrow deliberately, and data panels reflow before collision.
- 320–720: mobile hierarchy, not scaled desktop. Public content becomes crowd → count → signal → grouped freshness. Authenticated truth appears before horizontally scrollable controls or dense tables.

Safe-area padding uses physical left/right insets so RTL does not swap device cutouts. Page roots use modern dynamic viewport units with a `vh` fallback. Horizontal scrolling is reserved for labeled navigation/data regions, never the page.

## Direction and interaction

- CSS logical properties drive content rails, separators, alignment, and watermark placement.
- Physical safe-area insets stay physical.
- Directional chevrons and time-series geometry mirror between RTL and LTR; symmetric shadows do not imply a false direction.
- All controls meet a 44px minimum target where practical, have visible `:focus-visible` treatment, and remain keyboard operable.
- Skip links move focus to a `tabIndex="-1"` main region. Dialogs receive initial focus, close with Escape, and restore focus.
- Transitions are property-specific and short. The atmospheric background and data readings do not animate.

## Accessibility baseline

- Semantic headings and landmarks preserve reading order at every breakpoint.
- Live announcements are concise and never repeat the whole page continuously.
- Status is conveyed with text as well as color.
- Data-state absence is honest: unavailable/error/closed states do not leave stale values in the accessibility tree.
- Contrast targets WCAG AA for text and visible focus; quiet captions use the calibrated quiet-text token, not low-opacity white.
- Dense chart and heatmap visuals include keyboard access and a semantic data alternative.
