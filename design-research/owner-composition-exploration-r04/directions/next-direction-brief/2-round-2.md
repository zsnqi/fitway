<!-- Part of NEXT-DIRECTION-BRIEF.md; the index and the rule for editing are in NEXT-DIRECTION-BRIEF.md. -->

## Round 2 — after Backlight (agreed 2026-09-24)

The user reviewed `backlight/`. The structure was right, but the finish did not reach the
reference's quality or feel. Nothing is selected. The user does not want a copy of the reference;
the goal is its precision, quality, and feel, in FITWAY black and red.

### Reference study

The Behance page is a presentation. Its designer (Maruf Hassan) posted clear, flat 1600×1200
screens on Dribbble. Use these for feel only; never copy their layout, assets, or styling:

- Main page: https://dribbble.com/shots/27382937-Finance-Dashboard-Design
- Navigation: https://dribbble.com/shots/27558213-Dashboard-Left-Navigation-Menu-Design
- Analytics: https://dribbble.com/shots/27452143-Finance-Analytics-Dashboard
- Transactions: https://dribbble.com/shots/27411273-Financial-Dashboard-Transaction-Page

What the flat screens show:

- **Light is rare and owned.** The main page has one wide, soft wash in the page's top corner that
  runs along the top edge. It also has a few small lights, each belonging to one element and
  sitting on its bottom edge or corner: the chart card's bottom, the gauge, one small card's
  corner, and a thin line under a list. The twin card beside the lit one has no light. On the
  Analytics page no card is lit at all.
- **A small light has a shape.** It is a large, soft ellipse that rises from an edge or corner and
  is clipped inside its element. Its curved edge is fairly distinct, it is brightest at the edge,
  and it fades quickly. The element's 1px border brightens where the light touches it. It is never
  a blurry circle floating behind the page.
- **Glass comes from light, not transparency.** Plain cards are almost the page color (about
  `#10111A` on `#05060F`) with a quiet 1px border. The quality comes from a rhythm of thin borders,
  boxes within boxes: table headers, chips, and icon tiles.
- **Fine film grain.** A very fine grain sits inside the lit gradients only. Flat surfaces are
  clean.
- **Chart.** The line is thick (about 3px) and is the brightest thing in the card. Dense, fine
  vertical lines (about every 6px) run down from the line and fade out halfway. Horizontal grid
  lines are very faint. The chart has only a title, two axes, and one small tooltip with a thin
  border.

### Decisions (user-agreed)

1. **Light.** Use one wide wash in the page's top corner, plus two or three small lights at most.
   Each small light belongs to one element, sits on its edge or corner, and moves with it. Most
   cards have no light. Light is never fixed to the viewport, so it cannot be cut off or appear
   in the wrong place when the page grows.
2. **Glass.** Cards are near-opaque and dark. The glass feel comes from an inner gradient where
   light touches, a 1px rim that is brighter on the lit side, generous radii, and a rhythm of
   nested thin borders.
3. **Red.** The reference's pale lavender light cannot be copied in red, because red turns pink
   as it gets lighter. The red light stays deep and saturated and fades toward black, never toward
   white. Any milky, frosted feel comes from a neutral haze, never from paler red. This must be
   tested before a page is built (see "Lighting test").
4. **Grain.** Add a fine film grain inside lit areas only.
5. **Chart.** Use a thick, bright FITWAY-red line, fine fading vertical lines, faint horizontals,
   and one small tooltip. Remove the band ruler, the capacity line, the dotted "still ahead"
   texture, and the heavy legend row.
6. **Line points.** Plot the reading every 30 minutes, plus the true peak as its own point. The
   full minute detail stays available on hover and in "View details". *Superseded by Round 3 §4
   and Round 4 §1: the line is a centered 30-minute average, with the true peak as its own marker.*
7. **Missing span.** The line ends with a round cap and resumes after the gap. There are no
   vertical lines inside the gap, only a short dotted mark on the time axis, with the explanation
   on hover. There is no full-height hatched column, and the line never bridges the gap.
8. **Rail.** Every icon, the logo, Settings, and Sign out each sits in its own square tile with a
   thin border. The active section is a solid FITWAY-red tile. There is no side indicator bar.
   When expanded, the tiles stay and names appear beside them, with no whole-row highlight. The
   language switch reads "EN"/"AR" or uses a language icon, not a lone "ع". Expanding the rail
   must not animate width or margin.
9. **Delay** is shown once: in the header status and on the "Inside now" card only.
10. **Light in delayed or closed states** may stay as it is.
11. **Busier or quieter than usual** needs a difference of at least 3 people and at least 10%.
    "Busiest time" is the busiest 2-hour window over the last 7 days.
12. **Deferred to polish:** keyboard focus names on rail icons, and fine precision in the details
    panel (such as the weekly heatmap's current-hour mark).

### Lighting test (done: `light-study/`, see Round 3)

The test settles the red light before a whole page is built.

- **Frames.** Arabic RTL only, desktop 1440×900, static. The three frames share one minimal
  composition:
  - the collapsed rail with tiles;
  - the page title;
  - a row of small cards, where exactly one is lit at a corner or edge and the others are unlit;
  - the Daily chart card, lit from its bottom edge, using the chart decisions above and a static
    tooltip at the peak;
  - the page's top-corner wash.
- **Three recipes.** Only the light recipe changes between frames; the geometry stays the same.
  - **A — Deep:** saturated FITWAY red that fades only toward black.
  - **B — Warm core:** the brightest core leans slightly warm (toward orange-red) so it can glow
    brighter without turning pink.
  - **C — Red with neutral frost:** deep red, plus a neutral grey-white haze for a milky, frosted
    feel.
- **Evidence.** Three frames and a 2× crop of each chart card's lower half. The user picks a
  recipe, or asks for another. Only then is a full Daily page built.

