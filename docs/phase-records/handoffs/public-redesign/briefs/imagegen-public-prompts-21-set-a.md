# Image prompts 21, set A: no references

Part of [imagegen-public-prompts-21.md](imagegen-public-prompts-21.md), which says how the user runs them.

### A1: the word first

```text
Generate exactly one image.

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

COMPOSITION (A1, the word first): "Busy" is the dominant element: set enormous in bold, off-white, spanning nearly the full width, sitting where the red light fades out. Directly under it, "About 70 inside now" with "70" in bold, then "58% full" smaller and quieter. Today's curve spans the full width in the lower third: the line in off-white at 40%, the stretch from 5 PM to "Now" in FITWAY red, "Now" a solid red dot. "Usually quieter after 10 PM" sits just under the chart. "Open until 1:00 AM" and the Live line share the bottom line, at opposite edges. Everything left-aligned.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```

### A2: the count first

```text
Generate exactly one image. This is a new composition; do not reuse the layout of earlier images in this chat.

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

COMPOSITION (A2, the count first): the number "70" is the dominant element, in huge bold tabular numerals, with "About" small above it and "inside now" small beside its baseline. Below it, "Busy" in FITWAY red, large but clearly smaller than the number, and "58% full" quiet beside it. Today's curve is drawn as slim vertical bars, one per half hour, across the full width: bars from 6 AM to now in graphite, the bars of the last two hours in deep red, the bar at "Now" in FITWAY red and the tallest lit one; after "Now", the usual Friday bars appear only as faint outlines. Hours and Live at the top, under the wordmark, as one quiet line. Left-aligned.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```

### A3: the curve first

```text
Generate exactly one image. This is a new composition; do not reuse the layout of earlier images in this chat.

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

COMPOSITION (A3, the curve first): today's curve is the dominant element and fills the middle half of the screen, edge to edge, drawn as a soft filled area in dark graphite under an off-white line. The "Now" point is a bright FITWAY red dot with a thin red vertical line down to the baseline, and "Busy" sits large and bold directly above that point, attached to it, as if the curve is saying it. Exception to the style system: in this image the red light rises from behind the "Now" point instead of the top-right corner. Under the chart, "About 70 inside now" and "58% full" side by side; "Usually quieter after 10 PM" under them. Hours and Live at the bottom.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```

### A4: one statement

```text
Generate exactly one image. This is a new composition; do not reuse the layout of earlier images in this chat.

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

COMPOSITION (A4, one statement): the upper half reads as one large typographic statement over three or four lines: "Busy" in bold FITWAY red flows straight into "About 70 inside now" in light-weight off-white at the same large size, so the level and the count read as one sentence. "58% full" follows as a small quiet line. The lower half holds today's curve as a thin single line with its time labels, and "Usually quieter after 10 PM" under it. Hours and Live at the bottom. Left-aligned, ragged right, editorial in feel.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```

### A5: the scale

```text
Generate exactly one image. This is a new composition; do not reuse the layout of earlier images in this chat.

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

COMPOSITION (A5, the scale): "Busy" large and bold, left-aligned, in the upper third. Directly under it, an unlabelled four-step scale made of four short thick horizontal segments in a row; the first two in deep red, the third in FITWAY red, the fourth in dark graphite, so "Busy" reads as step three of four. Below the scale, two columns side by side: on the left "About 70 inside now" with "70" set large; on the right "58% full" with "58%" set large; the two numbers share one baseline. Today's curve across the full width below, thin line, the "Now" dot in red, "Usually quieter after 10 PM" under it. Hours and Live at the bottom, at opposite edges.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```

### A6: the quiet length

```text
Generate exactly one image. This is a new composition; do not reuse the layout of earlier images in this chat.

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

COMPOSITION (A6, the quiet length): restrained and precise; most of the screen is calm dark space. One strong mark: a thick FITWAY red horizontal bar starting at the left margin whose length is 58% of the content width, over a hairline track that runs the full width, so the percentage is a physical length. "Busy" sits above the bar in a medium-large bold size; "58% full" sits at the bar's end; "About 70 inside now" under the bar. Today's curve below, small and fine, with its labels, and "Usually quieter after 10 PM". Hours and Live at the bottom. Nothing on the screen is larger than it needs to be except the bar.

AVOID: circular gauges, rings, dials, speedometers or progress arcs; cards, tiles, rounded panels or dashboard widgets; people icons, silhouettes, avatars or photographs of any kind; gym or fitness imagery (dumbbells, athletes, equipment); bottom navigation, tabs, menus or call-to-action buttons; any brand name other than FITWAY; any text not listed in CONTENT; glowing or gradient text; emoji.
```

