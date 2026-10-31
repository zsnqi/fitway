# Image prompts 21, set B: with references

Part of [imagegen-public-prompts-21.md](imagegen-public-prompts-21.md), which says how the user runs them.

Attach `refs/1-fitway-current.png` as image 1 and `refs/2-other-gym.webp` as image 2 with B1. The same two stay in
the chat for B2 to B4.

### A4 edit: one dominant line

Pasted into set A's chat after A6 (the user, 2026-10-31: A4 too loud, three large lines competing; improve it with the
coordinator's notes). Result saved as `A4e.png`.

```text
Edit the A4 image (the fourth image in this chat). Change only the hierarchy of the large statement and the bottom separator; keep everything else exactly as it is: the near-black background, the red light from the top-right corner, the FITWAY top bar and the "AR" button, the left alignment, today's curve with "Now" and "Usual Friday", "Usually quieter after 10 PM", every colour and every string.

CHANGE:
- "Busy" stays the single largest element, bold, FITWAY red #FF2946, on its own line.
- "About 70 inside now" drops to one line at about 35 to 40 percent of the height of "Busy", in a light weight, off-white #F5F3F2, with only "70" in bold, so the eye reads "Busy" first and the count second, never the other way round.
- "58% full" stays small and quiet, #A29C9E, directly under the count.
- Give the space freed by the smaller count to the gap between the statement and the curve; add nothing.
- Remove the vertical bar "|" between "Open until 1:00 AM" and the Live line; keep them on one line at opposite edges, separated by space only.

KEEP: no cards, no rings or gauges, no people icons, no gradient text, no text that is not already in the image.
```

### B1: the word first, with references

```text
Generate exactly one image.

REFERENCES (attached):
- Image 1: FITWAY's current page, in Arabic. Use it ONLY for identity: the black, the red light from the corner, the red family, Readex Pro's shapes and weights, the restraint. Do not copy its layout, its four-bar meter or its language.
- Image 2: three mockups of another gym's page. Use it ONLY for principles: one dominant element, a clear drop to the secondary facts, one accent colour, a single calm column, a chart that lights the current hour. Do not copy its cards, its ring, its people icon, its gym name, its typeface or its layout.
Take the principle, not the look: the result must not look like either reference.

USE CASE: A finished UI mockup of a real, existing mobile web page that tells gym members how crowded the gym is right now. Render it as a shipped product screen, not concept art.

FRAME: One phone screen, shown flat and edge to edge in a tall portrait image (phone proportions, about 9:19.5, if available; otherwise 2:3). The whole page fits in the image. No device frame, no hands, no desk, no status bar, no browser bar. Highest image quality available.

STYLE SYSTEM (identical in every image of this set):
- Background: flat near-black #070707.
- Light: one soft red light glows in from the top-right corner and fades to black about a third of the way down, like a stage light on a dark wall. It runs from #FF2946 through deep wine #4D0713 to black. It is the only gradient on the screen.
- Text: off-white #F5F3F2 primary, #C9C3C4 secondary, #A29C9E tertiary.
- Accent: FITWAY red #FF2946 for the single most important thing; deep red #A3112A for lesser marks. No other colour except one small green dot #4BE29B beside "Live".
- Type: Readex Pro throughout (a geometric sans with soft, open, slightly rounded forms), light to bold weights, tabular numerals; wide letter spacing only on the FITWAY wordmark.
- Surfaces: no cards, boxes, panels, drop shadows or frosted glass. A hairline rule at 12% white is the strongest separator allowed.
- Spacing: 24 pt side margins, content aligned to one clear edge, generous empty dark space.

CONTENT (render every string exactly as quoted, in English, and add no other text; a number may be set larger than the words around it, but the words stay as quoted):
- Top bar: the wordmark "FITWAY" in widely spaced capitals with a small circular logo mark beside it; at the opposite edge a small outlined pill button "AR".
- Crowd level word: "Busy"
- Count: "About 70 inside now"
- Percentage: "58% full"
- Hours: "Open until 1:00 AM"
- Freshness: a small green dot, then "Live · Last reading 7:41 PM"
- Today's curve: today's crowd from opening until now. X-axis labels exactly "6 AM", "12 PM", "6 PM", "12 AM". The line rises through the morning, dips around 2 PM and climbs into an evening peak; it ends at 7:41 PM at a marker labelled "Now". After "Now", the usual curve for the rest of the day continues as a faint dotted line labelled "Usual Friday". No y-axis, no gridlines, no numbers on the chart.
- Best time, small, near the curve: "Usually quieter after 10 PM"

COMPOSITION (B1, the word first): "Busy" is the dominant element: set enormous in bold, off-white, spanning nearly the full width, sitting where the red light fades out. Directly under it, "About 70 inside now" with "70" in bold, then "58% full" smaller and quieter. Today's curve spans the full width in the lower third: the line in off-white at 40%, the stretch from 5 PM to "Now" in FITWAY red, "Now" a solid red dot. "Usually quieter after 10 PM" sits just under the chart. "Open until 1:00 AM" and the Live line share the bottom line, at opposite edges. Everything left-aligned.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```

### B2: the count first, with references

```text
Generate exactly one image. This is a new composition; do not reuse the layout of earlier images in this chat.

REFERENCES (the two images attached earlier in this chat):
- Image 1: FITWAY's current page, in Arabic. Use it ONLY for identity: the black, the red light from the corner, the red family, Readex Pro's shapes and weights, the restraint. Do not copy its layout, its four-bar meter or its language.
- Image 2: three mockups of another gym's page. Use it ONLY for principles: one dominant element, a clear drop to the secondary facts, one accent colour, a single calm column, a chart that lights the current hour. Do not copy its cards, its ring, its people icon, its gym name, its typeface or its layout.
Take the principle, not the look: the result must not look like either reference.

USE CASE: A finished UI mockup of a real, existing mobile web page that tells gym members how crowded the gym is right now. Render it as a shipped product screen, not concept art.

FRAME: One phone screen, shown flat and edge to edge in a tall portrait image (phone proportions, about 9:19.5, if available; otherwise 2:3). The whole page fits in the image. No device frame, no hands, no desk, no status bar, no browser bar. Highest image quality available.

STYLE SYSTEM (identical in every image of this set):
- Background: flat near-black #070707.
- Light: one soft red light glows in from the top-right corner and fades to black about a third of the way down, like a stage light on a dark wall. It runs from #FF2946 through deep wine #4D0713 to black. It is the only gradient on the screen.
- Text: off-white #F5F3F2 primary, #C9C3C4 secondary, #A29C9E tertiary.
- Accent: FITWAY red #FF2946 for the single most important thing; deep red #A3112A for lesser marks. No other colour except one small green dot #4BE29B beside "Live".
- Type: Readex Pro throughout (a geometric sans with soft, open, slightly rounded forms), light to bold weights, tabular numerals; wide letter spacing only on the FITWAY wordmark.
- Surfaces: no cards, boxes, panels, drop shadows or frosted glass. A hairline rule at 12% white is the strongest separator allowed.
- Spacing: 24 pt side margins, content aligned to one clear edge, generous empty dark space.

CONTENT (render every string exactly as quoted, in English, and add no other text; a number may be set larger than the words around it, but the words stay as quoted):
- Top bar: the wordmark "FITWAY" in widely spaced capitals with a small circular logo mark beside it; at the opposite edge a small outlined pill button "AR".
- Crowd level word: "Busy"
- Count: "About 70 inside now"
- Percentage: "58% full"
- Hours: "Open until 1:00 AM"
- Freshness: a small green dot, then "Live · Last reading 7:41 PM"
- Today's curve: today's crowd from opening until now. X-axis labels exactly "6 AM", "12 PM", "6 PM", "12 AM". The line rises through the morning, dips around 2 PM and climbs into an evening peak; it ends at 7:41 PM at a marker labelled "Now". After "Now", the usual curve for the rest of the day continues as a faint dotted line labelled "Usual Friday". No y-axis, no gridlines, no numbers on the chart.
- Best time, small, near the curve: "Usually quieter after 10 PM"

COMPOSITION (B2, the count first): the number "70" is the dominant element, in huge bold tabular numerals, with "About" small above it and "inside now" small beside its baseline. Below it, "Busy" in FITWAY red, large but clearly smaller than the number, and "58% full" quiet beside it. Today's curve is drawn as slim vertical bars, one per half hour, across the full width: bars from 6 AM to now in graphite, the bars of the last two hours in deep red, the bar at "Now" in FITWAY red and the tallest lit one; after "Now", the usual Friday bars appear only as faint outlines. Hours and Live at the top, under the wordmark, as one quiet line. Left-aligned.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```

### B3: the curve first, with references

```text
Generate exactly one image. This is a new composition; do not reuse the layout of earlier images in this chat.

REFERENCES (the two images attached earlier in this chat):
- Image 1: FITWAY's current page, in Arabic. Use it ONLY for identity: the black, the red light from the corner, the red family, Readex Pro's shapes and weights, the restraint. Do not copy its layout, its four-bar meter or its language.
- Image 2: three mockups of another gym's page. Use it ONLY for principles: one dominant element, a clear drop to the secondary facts, one accent colour, a single calm column, a chart that lights the current hour. Do not copy its cards, its ring, its people icon, its gym name, its typeface or its layout.
Take the principle, not the look: the result must not look like either reference.

USE CASE: A finished UI mockup of a real, existing mobile web page that tells gym members how crowded the gym is right now. Render it as a shipped product screen, not concept art.

FRAME: One phone screen, shown flat and edge to edge in a tall portrait image (phone proportions, about 9:19.5, if available; otherwise 2:3). The whole page fits in the image. No device frame, no hands, no desk, no status bar, no browser bar. Highest image quality available.

STYLE SYSTEM (identical in every image of this set):
- Background: flat near-black #070707.
- Light: one soft red light glows in from the top-right corner and fades to black about a third of the way down, like a stage light on a dark wall. It runs from #FF2946 through deep wine #4D0713 to black. It is the only gradient on the screen.
- Text: off-white #F5F3F2 primary, #C9C3C4 secondary, #A29C9E tertiary.
- Accent: FITWAY red #FF2946 for the single most important thing; deep red #A3112A for lesser marks. No other colour except one small green dot #4BE29B beside "Live".
- Type: Readex Pro throughout (a geometric sans with soft, open, slightly rounded forms), light to bold weights, tabular numerals; wide letter spacing only on the FITWAY wordmark.
- Surfaces: no cards, boxes, panels, drop shadows or frosted glass. A hairline rule at 12% white is the strongest separator allowed.
- Spacing: 24 pt side margins, content aligned to one clear edge, generous empty dark space.

CONTENT (render every string exactly as quoted, in English, and add no other text; a number may be set larger than the words around it, but the words stay as quoted):
- Top bar: the wordmark "FITWAY" in widely spaced capitals with a small circular logo mark beside it; at the opposite edge a small outlined pill button "AR".
- Crowd level word: "Busy"
- Count: "About 70 inside now"
- Percentage: "58% full"
- Hours: "Open until 1:00 AM"
- Freshness: a small green dot, then "Live · Last reading 7:41 PM"
- Today's curve: today's crowd from opening until now. X-axis labels exactly "6 AM", "12 PM", "6 PM", "12 AM". The line rises through the morning, dips around 2 PM and climbs into an evening peak; it ends at 7:41 PM at a marker labelled "Now". After "Now", the usual curve for the rest of the day continues as a faint dotted line labelled "Usual Friday". No y-axis, no gridlines, no numbers on the chart.
- Best time, small, near the curve: "Usually quieter after 10 PM"

COMPOSITION (B3, the curve first): today's curve is the dominant element and fills the middle half of the screen, edge to edge, drawn as a soft filled area in dark graphite under an off-white line. The "Now" point is a bright FITWAY red dot with a thin red vertical line down to the baseline, and "Busy" sits large and bold directly above that point, attached to it, as if the curve is saying it. Exception to the style system: in this image the red light rises from behind the "Now" point instead of the top-right corner. Under the chart, "About 70 inside now" and "58% full" side by side; "Usually quieter after 10 PM" under them. Hours and Live at the bottom.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```

### B4: free, with references

```text
Generate exactly one image. This is a new composition; do not reuse the layout of earlier images in this chat.

REFERENCES (the two images attached earlier in this chat):
- Image 1: FITWAY's current page, in Arabic. Use it ONLY for identity: the black, the red light from the corner, the red family, Readex Pro's shapes and weights, the restraint. Do not copy its layout, its four-bar meter or its language.
- Image 2: three mockups of another gym's page. Use it ONLY for principles: one dominant element, a clear drop to the secondary facts, one accent colour, a single calm column, a chart that lights the current hour. Do not copy its cards, its ring, its people icon, its gym name, its typeface or its layout.
Take the principle, not the look: the result must not look like either reference.

USE CASE: A finished UI mockup of a real, existing mobile web page that tells gym members how crowded the gym is right now. Render it as a shipped product screen, not concept art.

FRAME: One phone screen, shown flat and edge to edge in a tall portrait image (phone proportions, about 9:19.5, if available; otherwise 2:3). The whole page fits in the image. No device frame, no hands, no desk, no status bar, no browser bar. Highest image quality available.

STYLE SYSTEM (identical in every image of this set):
- Background: flat near-black #070707.
- Light: one soft red light glows in from the top-right corner and fades to black about a third of the way down, like a stage light on a dark wall. It runs from #FF2946 through deep wine #4D0713 to black. It is the only gradient on the screen.
- Text: off-white #F5F3F2 primary, #C9C3C4 secondary, #A29C9E tertiary.
- Accent: FITWAY red #FF2946 for the single most important thing; deep red #A3112A for lesser marks. No other colour except one small green dot #4BE29B beside "Live".
- Type: Readex Pro throughout (a geometric sans with soft, open, slightly rounded forms), light to bold weights, tabular numerals; wide letter spacing only on the FITWAY wordmark.
- Surfaces: no cards, boxes, panels, drop shadows or frosted glass. A hairline rule at 12% white is the strongest separator allowed.
- Spacing: 24 pt side margins, content aligned to one clear edge, generous empty dark space.

CONTENT (render every string exactly as quoted, in English, and add no other text; a number may be set larger than the words around it, but the words stay as quoted):
- Top bar: the wordmark "FITWAY" in widely spaced capitals with a small circular logo mark beside it; at the opposite edge a small outlined pill button "AR".
- Crowd level word: "Busy"
- Count: "About 70 inside now"
- Percentage: "58% full"
- Hours: "Open until 1:00 AM"
- Freshness: a small green dot, then "Live · Last reading 7:41 PM"
- Today's curve: today's crowd from opening until now. X-axis labels exactly "6 AM", "12 PM", "6 PM", "12 AM". The line rises through the morning, dips around 2 PM and climbs into an evening peak; it ends at 7:41 PM at a marker labelled "Now". After "Now", the usual curve for the rest of the day continues as a faint dotted line labelled "Usual Friday". No y-axis, no gridlines, no numbers on the chart.
- Best time, small, near the curve: "Usually quieter after 10 PM"

COMPOSITION (B4, free): the strongest page you can make from the principles of image 2 and the identity of image 1, with all the content above. Choose the dominant element, the order and the chart's form yourself. It must differ clearly from both references and from B1 to B3 in this chat, and a gym member must read the crowd level within one second.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```
