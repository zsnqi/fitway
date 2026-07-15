# FITWAY — Google Stitch brief for VDG-A

## Purpose and boundary

Prepare three visual direction sets for Hussein to compare in the Visual Direction Approval gate. Google Stitch is the sole visual-exploration environment for this round. This brief is an input package only: it does not approve a direction, create production code, define the final design system, or start VDG-B or Phase 4.

The three required direction sets are:

1. **Premium Athletic**
2. **Operational Performance**
3. **Distinctive Kinetic**

Use the exact shared content and data in `FITWAY_CONTENT_FIXTURES.md` for every direction. Use `FITWAY_DIRECTION_MATRIX.md` to keep the directions structurally different. Do not change facts, copy, values, timestamps, state meaning, or viewport between directions to make one look better.

## Product truth

FITWAY v1 is a live-occupancy product for one pilot gym. It is the gym's own operational product, not a SaaS vendor brand and not a marketing website. Its public job is narrow: help a visitor decide whether to go now by showing an honest, current estimate of how crowded the gym is.

The primary truth is the labeled crowd band—Quiet, Moderate, Busy, or Packed—supported by an approximate count, percentage full, open/closed state, and freshness. The count is an estimate, never an exact member-attendance claim. Stale or absent data must never look live.

Surface boundaries:

- **Public:** anonymous, read-only, mobile-first, lightweight, and limited to current occupancy truth. No controls, operational diagnostics, member identity, images/video, or tracking identifiers.
- **Staff concept:** a preview of the specified future authenticated operational view. It may show live count, band, freshness, device/camera/feed health, correction, direct count entry, and reset affordances. Label it clearly as not implemented. Do not imply that an action has succeeded or that a backend is connected.
- **Analytics concept:** a preview of the specified future owner-only analytics. It must contain a real plotted chart and a corresponding data table using the supplied deterministic sample history. Label it clearly as not implemented and not measured Fitway data.

## Evidence status

The seven files in `design-baseline/` are **behavioral and information evidence only**:

- `public-live-desktop.png`
- `public-closed-desktop.png`
- `public-stale-desktop.png`
- `public-unavailable-desktop.png`
- `public-live-mobile.png`
- `public-closed-mobile.png`
- `english-ltr.png`

They prove what information appears or disappears, the five public states, Arabic/English direction switching, Western digits, gym-local time, responsive behavior, and the baseline viewports. They are **not** an approved visual direction, composition reference, style reference, or visual north star. Do not copy their centered floating card, spacing, hierarchy, header placement, meter treatment, or large empty canvas by default.

The existing application and `DESIGN_GUIDE.md` similarly provide product rules, state semantics, accessibility constraints, brand assets, and established vocabulary. VDG-A is specifically intended to test new composition, hierarchy, density, navigation, and data-presentation choices before any visual system becomes final.

## Global constraints for all three directions

### Fixed identity and language

- Dark-only. No light theme and no theme toggle.
- Use the existing Fitway logo unchanged. Do not trace, redraw, simplify, restyle, recolor, rotate, crop, distort, add effects to, or externally redesign it.
- Use Cairo for Arabic and Latin. Use the weights actually available in the current app (400, 500, 600, and 700) for exploration; do not make the concept depend on Cairo 800/900. The missing heavier files are a recorded VDG-B issue.
- Arabic is the default and uses `lang="ar"` and RTL composition.
- English uses `lang="en"` and LTR composition; it must be deliberately recomposed, not merely text-swapped.
- Use Western digits `0–9` in both languages.
- Public Arabic time uses a 12-hour clock with `ص/م`; public English uses `AM/PM`.
- Format public times in `Asia/Riyadh`, not the viewer's device timezone.
- Preserve Latin fragments such as `FITWAY`, `CSV`, device identifiers, and digit runs correctly inside Arabic with bidi isolation.
- Allow natural Arabic wrapping and 30–40% copy expansion. Do not truncate occupancy status, freshness, next-opening time, or critical operational labels.

### Honesty and state behavior

- Fresh public state: show open state, explicitly live/fresh status, crowd band, approximate count, percentage full, occupancy visualization, and last-updated time.
- Stale public state: retain the supplied last-known value for context, but dim and label it as last known; show the last-known timestamp and an unmistakable delay warning.
- Closed public state: show closed status and next opening when known; show no count, percentage, meter, band, source, or implied live freshness.
- Unavailable public state: state that occupancy is unavailable; show no count, percentage, meter, band, source, or fabricated last-updated time.
- Loading: use a layout-matched skeleton or static placeholder, with an accessible loading announcement. No layout-changing generic spinner.
- No meaning may rely on color alone. Pair every state with text and an icon; crowd state also needs a positional or quantitative signal.
- Do not show predictions, recommendations, unique-member claims, member attendance, bookings, classes, capacity alerts, or trend arrows. `trend` is deferred and the fixture value is `null`.

### Accessibility and interaction evidence

- Normal text contrast target: at least 4.5:1. Large text and meaningful graphical boundaries: at least 3:1.
- Show a clearly visible keyboard `:focus-visible` example on every direction's states sheet. Focus must remain visible on both neutral and red/brand surfaces.
- All interactive targets on touch views are at least 44×44 px with adequate separation.
- Focus order follows reading order and direction. No hover-only content or actions.
- Charts need labels, axes, a legend where needed, non-color distinctions, and a corresponding readable table. A tooltip cannot be the only source of a value.
- Include a `prefers-reduced-motion` alternative: no pulsing, shimmer, number tween, chart draw, parallax, or essential directional sweep; values and content appear instantly and static labels carry the same meaning.
- Routine public updates are polite; stale/offline transitions are visually assertive. Do not depict constant interruptive animation.

### Product UI, not marketing UI

- No marketing landing-page treatment: no promotional hero copy, membership CTA, app-store badges, social proof, feature sections, pricing, stock-fitness collage, photo carousel, WhatsApp float, or “join now” funnel.
- No generic card mosaic or dashboard made from equal interchangeable tiles.
- Do not create three palette swaps. Composition, hierarchy, density, navigation, occupancy hero, status/freshness, chart/table language, brand intensity, motion character, and mobile structure must change materially.
- Avoid huge decorative headings, ornamental gradients, neon glows, glassmorphism as a theme, ornamental 3D, emojis, fake metrics, and generic placeholder names.
- Decorative gym photography is not required. If Stitch proposes imagery, reject it when it competes with live occupancy or appears in staff/analytics views.

## Required output set for each direction

Generate one coherent seven-artboard set per direction. Do not combine multiple required views into a single collage except the dedicated states sheet.

| ID | Surface | Locale / direction | Viewport / frame | Required evidence |
| --- | --- | --- | --- | --- |
| P1 | Public live occupancy | Arabic / RTL | 1440×900 | Open + fresh, Moderate, around 37 people, 37% full, last update 2:59 PM / 30 seconds ago |
| P2 | Public closed state | Arabic / RTL | 1440×900 | Closed now, opens 2:00 PM; no occupancy data or implied freshness |
| P3 | Public live occupancy | Arabic / RTL | 390×844 | Same facts as P1, intentionally composed for portrait mobile with no horizontal overflow |
| P4 | Public live occupancy | English / LTR | 1440×900 | Exact English counterpart of P1; deliberate LTR composition |
| S1 | Staff live operations concept | Arabic / RTL | 1366×768 | Preview label, live snapshot and health always visible, operations visually separate, no success claim |
| A1 | Analytics concept | Arabic / RTL | 1366×768 | Preview label, real line chart plus corresponding table using the supplied sample history |
| C1 | Component and operational states sheet | Arabic-first with English/mixed-content samples | 1440×1200 or a clearly labeled large Stitch canvas | All required public, crowd, interaction, content-stress, chart, table, and motion states |

The public views should look like one product across language and viewport, but P3 must not be a mechanically shrunken desktop. Staff and analytics should share the direction's visual language without pretending they are implemented routes.

## States-sheet minimum contents

Show all of the following with explicit labels:

- Public lifecycle: loading, fresh, stale, closed, unavailable.
- Crowd bands: Quiet / هادئ, Moderate / متوسط, Busy / مزدحم, Packed / ممتلئ. If an over-capacity visual is explored, label it as a component stress state only; do not imply that the public fixture is over capacity.
- Freshness and health: fresh/live, stale/last-known, offline/unavailable, device healthy, camera/feed healthy, pending command.
- Interaction: default, hover where useful, keyboard focus, pressed, disabled, loading, error, success confirmation pattern.
- Operations: correction stepper, direct count input, Apply, and reset confirmation anatomy. These remain preview-only and must not show a fabricated completed mutation.
- Analytics: line/marker styles, missing-data gap, closed period, legend, tooltip, table row, table focus, and empty/no-data pattern.
- Content stress: the supplied long Arabic labels, English LTR sample, `FITWAY Edge-01`, `CSV`, `37%`, `2:59 م`, and `2:59 PM`.
- Motion: intended standard-motion note and an adjacent reduced-motion alternative that preserves all information.

## Direction integrity

Read the full direction matrix before generating. A direction fails if it shares the same underlying composition with another direction and differs mainly in color, radius, or decoration.

Across the three sets, force visible differences in:

- primary composition and grid;
- first-glance hierarchy;
- information density;
- public versus authenticated navigation;
- occupancy hero geometry and data relationship;
- open/fresh/stale treatment and placement;
- chart and table grammar;
- amount and placement of Fitway brand energy;
- normal-motion character and reduced-motion fallback;
- mobile ordering, grouping, and navigation.

Do not merge directions during generation. Do not create a fourth direction. If one direction misses a hard constraint, repair that direction while preserving its thesis.

## Delivery labeling

Name every generated artboard with its direction and surface ID, for example:

```text
PA-P1 — Premium Athletic — Public live — AR RTL — 1440x900
OP-A1 — Operational Performance — Analytics preview — AR RTL — 1366x768
DK-C1 — Distinctive Kinetic — States sheet
```

Place this annotation on S1 and A1 in every direction:

```text
تصور مسبق لـ VDG-A — هذه الوظائف غير منفذة بعد
VDG-A preview — functionality not yet implemented
```

Place this annotation near the analytics sample:

```text
بيانات تجريبية للتصميم — ليست قياسات فعلية لـ Fitway
Design fixture data — not measured Fitway data
```

## Stitch submission procedure — only after Hussein authorizes exploration

Do not perform these steps while preparing or reviewing this package. When Hussein explicitly authorizes VDG-A visual exploration:

### Stage 1 — P1 direction preflight

1. Create one shared Stitch project/workspace named `FITWAY — VDG-A — Visual Directions`. Load the existing unchanged Fitway logo as the only brand asset, and load the seven `design-baseline/` screenshots in a clearly named evidence group: `Behavioral and information evidence only — do not copy composition`.
2. Load this complete brief, then the complete `FITWAY_CONTENT_FIXTURES.md`, then the complete `FITWAY_DIRECTION_MATRIX.md`. Do not substitute a summary for the fixtures.
3. Generate only `PA-P1`, `OP-P1`, and `DK-P1`, each at 1440×900. Generate each from its own declared one-sentence thesis and matrix column; do not borrow composition from a direction already generated.
4. Arrange the three P1 artboards side by side at 1440×900.
5. Verify shared facts, Arabic RTL, logo integrity, first-glance clarity, and correct treatment of the baseline as non-compositional evidence. Verify these pairwise distinctions: silhouette and negative space, hierarchy, occupancy hero, status/freshness placement, and brand intensity.
6. Repair only the failed P1 direction while preserving its declared thesis. Do not create a fourth direction.
7. Do not proceed to Stage 2 until all three P1 artboards are factually compliant and genuinely distinct.

### Stage 2 — Full direction expansion

1. Expand each preflight-approved direction into `P2`, `P3`, `P4`, `S1`, `A1`, and `C1`, using the specified sizes and names. Preserve the visual language established by that direction's P1.
2. Validate every completed seven-artboard set against the complete fixtures and the hard gates in `VDG_A_REVIEW_SCORECARD.md`. Repair only the failed artboard or failed direction while preserving its declared thesis.
3. Arrange equivalent surfaces side by side for Hussein's final comparison—three P1s, then three P2s, and so on—while retaining each coherent direction set.
4. Export or present the three complete direction sets for Hussein's review and stop. VDG-A still requires three complete seven-artboard sets and Hussein's explicit approval phrase. Do not send any direction to Claude Design, create `FITWAY_DESIGN.md`, create final `design-references/`, implement code, begin VDG-B, or begin Phase 4.

If Stitch cannot ingest all source documents as files, paste them in the same order in separate context messages. Keep the fixture tables verbatim. Do not use a free-form “make it better” prompt.

## Completion condition for Stitch generation

A direction is ready for review only when all seven artboards exist, use the shared fixtures without fact drift, remain recognizably one direction, and pass the hard constraints in `VDG_A_REVIEW_SCORECARD.md`. Generation stops after three complete direction sets. No production implementation, design-system extraction, Claude Design refinement, VDG-B work, or Phase 4 work begins during this round.
