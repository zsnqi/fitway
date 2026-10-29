# TREATMENT: the Eclipse launch film

cinetic Step 1 (with the Step 2 style stills in `storyboard/`). Binding inputs: `DECISIONS.md`, `RULES.md`; the QA
contract is `BRIEF.md`. Times are seconds; frames are `f = round(60 · t)`; bar.beat is on the 128 BPM grid
(a beat 0.46875 s, a bar 1.875 s).

**Spec:** `1920x1080@60, 32s (16 bars + 2 s tail), 128BPM, pace: calm with two crisp bursts, audio: code-made score (earshot kit)` · **Format:** launch film (a pitch) · **Engine:** HyperFrames, three.js for bars 13–14 only
**Product:** FITWAY Owner, the Eclipse concept: an approximate, live crowd level, today's crowd against the gym's usual day, and the busy-hour pattern over weeks · **Viewer:** the gym owner, sound on or muted
**Assumptions:** listed in `BRIEF.md`.

## 1. Inventory
| List | Entries |
|---|---|
| Name | FITWAY: fit + way, the way in. The mark is a ring with an opening, an arrow passing through it, an inner arc and a dot: a space, a way in, and a point held inside rings. Eclipse already marks the reading that matters the same way: the live end point is a dot in a ring, the busiest hour is a dot in a ring, the peak is a ring. |
| Non-obvious behaviour | Unlike a door counter that shows a number, it shows an approximate level (a band word with the count, "approx."), reads today against the gym's own usual Wednesday, leaves a gap where it had no readings instead of bridging it, and names the busiest hour only from enough days. |
| Value sentence | Before: the owner guesses how busy the floor is, or walks it. After: the owner reads today's crowd against a usual day, and the week's rhythm, from anywhere. |
| Verbs | read, draw, count (roughly), compare, rise, peak, settle, fold, name, mark |
| The product's objects | today's red line and its fine vertical lines; the dashed usual line; the live end point (a dot in a ring) and its pulse; the peak ring; the honest gap; the four answers (Inside now, Today's peak, Entries, Busiest time); the level badge; the pattern's cells and its busiest marker; the rail with the mark at its top and the red active tile; the red light |
| The number | 49 approx., Busy, at 7:42 PM; Peak 62 at 6:29 PM; Busiest: Thursday 7–8 PM (all Eclipse's synthetic data, unchanged) |
| Pain scene | 6:30 PM on a Wednesday, the owner away from the floor (felt, never shown: no people, no cameras) |
| Category clichés (banned here) | people working out, dumbbells, a heartbeat or ECG line, a stopwatch, a phone floating in a void, CCTV heat maps of crowds, up-and-to-the-right charts |
| World sound | the gym's own pulse at 128 BPM; a soft landing per reading |

## 2. Three concepts
| Lens | Logline (≤ 15 words) | Device | Ownership | Deletion | Specificity | Muted | Poster | Score /15 |
|---|---|---|---|---|---|---|---|---|
| (a) Verb made literal: *it draws the day* | Today's red line draws the gym's day, then its week, then its mark. | the crowd line and its live head | pass: Eclipse's own line, its usual twin and its honest gap | pass | pass: approx., the usual, the gap, the named hour | pass | pass | 13 |
| (b) Pain made visible: *the guess* | The level flickers Quiet, Busy, Packed until one live reading settles it. | a flickering level badge | fail: any occupancy app; and the flicker imitates a state Eclipse never shows | weak | fail: a counter could claim it | weak | fail | 5 |
| (c) Formal device: *the marked reading* | One dot held in a ring: the reading now, the busiest hour, then FITWAY. | the dot in a ring (Eclipse's marker grammar and the mark) | pass | pass | pass | pass | pass | 12 |

**Chosen:** (a), the line, for the spine and the copy. **Grafted:** from (c) the grammar (a ring is drawn round the reading that matters, and the reading becomes the mark's dot); from (b) only its truthful core, the honest gap, which the hook shows behind the line's tip with no words.

**Specificity test (written answer).** A simpler product, a door counter, would show one number. The film shows what it would not: "approx." and a band word (beat 3), today against the usual Wednesday as two lines (beats 1, 4), a gap left open where there were no readings (beat 1), and the busiest hour named from four weeks (beat 6).
**Deletion test.** Without the product beats, the copy and the devices still say "you can read your gym's day and week". Without the value beats, the montage and the screens are a tour, so the film depends on them.
**Feature-word test.** Muted, a stranger would say "a chart of how busy the gym is today, and a heat map of the week": Eclipse's own words.

## 3. Concept
- **Idea (≤ 8 words):** Read your gym's day and week.
- **Device:** today's red crowd line, headed by its live reading (a dot in a ring). It is Eclipse's hero object, and the FITWAY mark is a dot held in rings, so the reading can become the mark.
- **Grammar:** the line draws in time order and never bridges a gap; every act ends on a marked reading; the camera moves, the lights never do (Eclipse LGT-1).
- **Logline (14 words):** A red line draws the gym's day; its live reading becomes the FITWAY mark.
- **Personality:** exact, calm, nocturnal → Readex Pro 500 for copy and wordmark (Eclipse's face; 400 only inside the UI), sentence case, the dark stage `#070707`, Eclipse radii, motion that settles softly (Eclipse's state curve), never bounces.
- **Mark:** supplied (`brand/fitway-logo.png`); see §8, the mark sheet. Lockup setting B.
- **Accent:** FITWAY red `#E51935` / `#FF2946` means "the crowd's reading". Stage dark, neutral. **Luminance plan:** black (hook) → the dark UI with Eclipse's red light → the dark UI → black construction → white mark on black. No flood; the turn is carried by the cut and the drop.
- **Signature move (from the mark: a ring round a dot):** the end point swells into its halo (bar 5), a chalk ring draws round the busiest hour (bar 9), the compass sweeps draw the mark's rings round the red dot (bar 15).
- **Easing characters:** Eclipse's state curve `cubic-bezier(.25,1,.5,1)` for rolls and swells; cinetic `cam` `(.48,.1,0,.9)` for every camera move; `outSoft` `(.22,1,.36,1)` for copy and drafting strokes; the line's own clock `(.5,.15,.6,1)`, a retiming of Eclipse's intro line.
- **Sonic signature (for Stations 2–3):** one soft tuned landing per marked reading (bars 5, 9, the fills of bar 15), in the sketches' D minor; the lockup gets the one resolved element.

## 3b. Drawn techniques
`<!-- pick.py --seed 1760106441 --format launch --energy medium --seconds 32 -->` (`--brand-supplied glow,gradient`; the draw and both rerolls are in `storyboard/src/qa/`)

| Pick (id) | Category | Beat | Retold in this film |
|---|---|---|---|
| `oh-quiet-intro-drop` | opening_hook | 1 → 2 | Bars 1–2 are the isolated line on black with one fragment and a sparse bed (no kick, no sub); the low end lands on the hard cut to the full Daily screen on bar 3.1 (f225). |
| `tr-shape-match-cut` | transition | 11 | The laptop's live end point (bar 14) and the construction's red dot share a place on screen at the cut (bar 15.1, f1575); the dot then swells from the end point's size to the mark's dot over 18 f, Eclipse's own end-point swell retold. |
| `tr-cover-wipe` | transition | 5 | Land variant: the Reports page rises from below over Daily on bar 7.1 (44 f, `glide`), above it in z; the line is the last thing it covers. |
| `ty-phrase-clamp-junction` | typography | 1 | "Every day" and "has a shape." close on one baseline at a fixed junction (vertical variant, 18 f, no overshoot), the film's only clamp. |
| `ty-staggered-word-roll` | typography | 2 | Retold as Eclipse's own digit roll (MOT-2/MOT-10): the four answers roll into their ink boxes on successive 16ths on the drop. Never a count-up: Eclipse reveals the reading and draws no intermediate value. |
| `pd-device-rise-on-cut` (reroll 2 of `pd-fast-prompt-true-scale`) | product_demo | 9 | The whole picture (desk and all) rises 300 px into frame already moving (~20 px/f on the cut frame) on bar 13.1, close on both devices; the shot then scales back to the hold (23.2–23.75 s), the technique's 1 → 0.9 pull retold larger. |
| `ui-live-reflow` | ui_choreography | 8 | The EN→AR switch: every block FLIPs to its mirrored slot over 20 f (`ui`), each swapping its words at the move's midpoint from the English render to the real `?lang=ar` render; the rail crosses the frame. |
| `le-accordion-cta-collapse` | logo_and_end_card | 12 | The hero word FITWAY: its letter gaps close from wide to Eclipse's 0.12 em (τ 14.6 f, no overshoot) as the lockup assembles on bar 16.1. |
| `cam-punch-in-insert` | camera | 3 | Hard cut on bar 3.3 from the wide Daily to Inside now filling the frame edge to edge (5.4×), on axis, back out on bar 4.1. |
| `dn-count-glyph-swap` | data_and_numbers | 3 | Adapted within truth: the level badge's bars fill 50 ms apart (MOT-3) as 49 lands. There is no mid-count swap through Quiet and Moderate, because Eclipse never counts up. |
| `cl-specular-sweep` | color_and_light | 9 | The laptop lid's own specular highlight crossing its top edge as the camera settles: a real reflection, once, no added glint. |
| `ps-machine-grid-human-gaps` | pacing_structure | whole film | The product's events land on the grid (the rolls on 16ths, the pattern a weekday per 8th, the drafting strokes on 16ths); the two human acts (the "Last 28 days" segment, bar 7.3, and the AR key, bar 11.4+) are the only presses, each the decisive one of its scene. |

**Rerolls and drops:**
- `pd-fast-prompt-true-scale` → `pd-headline-becomes-input` → `pd-device-rise-on-cut`: FITWAY is not input-led; the second reroll fits the device beat.
- `mi-launch-hop` → `mi-spinner-to-check` → `mi-shape-handoff-morph` → **dropped**: Eclipse has no app icon to hop and no step list to check off; the last draw (a pill collapsing into an icon) would be a second handoff into the mark, competing with the shape match cut.

## 4. Arc, bar map and device path
- **Arc:** hook bars 1–2 → turn (the drop) bar 3 → proof bars 3–10 (today, then the week) → breadth bars 11–12 (the montage, the switch) → promise bars 13–14 (the devices, "Now, read yours.") → lockup bars 15–16 + tail.
- **Bar map, refined from the coordinator's suggestion:** kept as suggested, with five refinements. (1) Every section change lands on a downbeat, so "0–4 s" becomes bars 1–2 and Daily starts on bar 3.1 (3.75 s). (2) The line lands on now on bar 5.1, giving the climb two bars and the landing two more. (3) Reports splits in two: the fill in bars 7–8, the named hour and its copy in bars 9–10. (4) Bar 11 carries four one-beat montage shots and bar 12 belongs to the Arabic frame alone, so it can be read. (5) The devices land close on the lift and pull back by 23.75 s, so the flat hold before the mark runs 2.5 s; the construction takes bar 15 and the lockup assembles on 16.1, leaving 3.5 s of lockup (RULES).
- **Device path:** the line draws on black (relay) → the same line in the full Daily screen (cut) → the reading as its number, 49 approx. (insert) → the line's head lands as the live end point, a dot in a ring (swell) → the line, last thing covered by Reports (cover wipe) → the fill front sweeping the pattern → the busiest hour's dot in a ring, a chalk ring drawn round it → the mark itself, small, at the top of the rail in every montage shot (held still across the cuts) → the rail crosses the frame in the switch → the live end point on the laptop → the red dot of the construction (shape match, swell) → the mark's dot, relaxing from red to white as the mark completes.

## 5. Beat sheet
| # | Bars | Frames | Time | Beat | Picture | Copy | Picture beat | Sound | Device |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1–2 | 0–224 | 0.00–3.75 | Hook | Frame 0 is moving: today's line mid-draw at 3:20 PM, isolated on black (only the line, its fine vertical lines, the faint dashed usual line); the camera follows the tip and pulls back 4.2→2.4 on `cam`; the honest gap at 2 PM sits behind the tip. | "Every day has a shape." in at f20, resolved f38, held to f165, out by f189 | After the read: the tip climbs past 4 PM, the usual line rising ahead | Sparse bed from ~0.2 s, no kick; sub swell 8–12 f before f225 | the line, drawing |
| 2 | 3.1–3.2 | 225–280 | 3.75–4.69 | Drop | Hard cut wide: the whole Daily screen at 1.2× appears at once; the four answers roll in on 16ths (400 ms each); the line climbs through 5 PM | – | text-free | Kick and low end on f225 | the line |
| 3 | 3.3–3.4 | 281–337 | 4.69–5.63 | Insert | Punch-in on Inside now, edge to edge: 49 approx., Busy, live at 7:42 PM; the bars have filled | – | text-free; the result held 56 f | one soft tap as the punch lands | the reading, as its number |
| 4 | 4–6 | 338–674 | 5.63–11.25 | Landing | Back wide on 4.1; the line peaks and lands on now at 5.1 (f450): the end point swells into its halo, the peak ring lands with "Peak 62", the live pulse starts (5 s cycle); the camera pushes toward now, 2.2→2.9 | – | text-free | a tuned landing on f450; a tap on the peak ring | the live end point, a dot in a ring |
| 5 | 7–8 | 675–899 | 11.25–15.00 | Reports: the fill | 7.1: Reports lands from below over Daily (cover wipe); its pattern empty and unlit. 7.3: "Last 28 days" seats. 8.1: the pattern fills, a weekday per 8th, hours in time order | – | text-free | the press is heard; the fill rides the hats | the fill front |
| 6 | 9–10 | 900–1124 | 15.00–18.75 | Reports: the busiest hour | 9.1: the light comes on at once with the complete pattern (LGT-11); a chalk ring draws round Thursday 7–8 PM's marker; the subtitle names it; a small push | "Every week, a rhythm." in 9.3 (f956), resolved f974, held to f1092 | the ring and the name come first, then the line | a tuned landing on f900 | the busiest hour's dot in a ring |
| 7 | 11 | 1125–1237 | 18.75–20.63 | Montage | One beat each, the same tight frame: Activity log, Access, Settings, Today. The mark at the rail's top holds still; the red tile steps down the rail | – | text-free | hard cuts on the beats, carried by the music | the mark, small, in the rail |
| 8 | 12 | 1238–1349 | 20.63–22.50 | EN→AR | 12.1: the AR key has seated; every block FLIPs to its mirrored slot (20 f) and takes the real Arabic words; the chart now runs right to left; hold with a 1% creep | – | text-free | one key sound on the press | the rail and its mark cross the frame |
| 9 | 13 | 1350–1424 | 22.50–23.75 | Device reveal | The biggest lift: laptop and phone, the real Daily page on both, rise into frame close and already moving (44 f), hold close, then pull back to the hold (23.2–23.75); a thin oxblood light on the desk behind the base | – | text-free | the music's biggest lift on f1350 | the live end point on the laptop |
| 10 | 13–14 | 1425–1574 | 23.75–26.25 | Flat hold | The one flat hold, 2.5 s, a 2.5% creep | "Now, read yours." in 13.4 (f1434), resolved f1458, held to f1560 | the devices first, then the line | the bed thins; nothing new | the live end point |
| 11 | 15 | 1575–1687 | 26.25–28.13 | Construction | Cut to black: the end point's red dot, at the same place, swells to the mark's dot; drafting lines draw round it on 16ths (the compass sweeps from the opening, the 45° bands, the cuts, the nodes); the pieces fill on 15.4 | – | text-free | drafting is silent; one soft landing per fill | the reading becomes the mark's dot |
| 12 | 16 + tail | 1688–1920 | 28.13–32.00 | Lockup | The construction clears; the mark eases into the lockup; FITWAY's letter gaps close; the dot relaxes to white; hold 3.5 s with an 8% push | FITWAY (wordmark) readable from f1710 | – | the music resolves on 16.1; one resolved element on the wordmark; fade over the last 0.8 s | the mark |


## 6. Copy
| Chain | Fragment | Words | Mode | Beat | In → resolved → out (s) | Hold after resolve | RULES minimum (0.3 s/word + 0.5 s) | Callback |
|---|---|---|---|---|---|---|---|---|
| C1 | Every day has a shape. | 5 | one fragment, two halves clamped | 1 | 0.33 → 0.63 → 2.75 (gone 3.15) | 2.12 s | 2.0 s | setup |
| C2 | Every week, a rhythm. | 4 | one fragment | 6 | 15.94 → 16.23 → 18.20 (gone 18.60) | 1.97 s | 1.7 s | refrain |
| C3 | Now, read yours. | 3 | one fragment | 10 | 23.91 → 24.30 → 26.00 (gone 26.25) | 1.70 s | 1.4 s | payoff |
| W | FITWAY | 1 | wordmark | 12 | 28.13 → 28.50 → 32.00 | 3.50 s | 0.8 s | name |
| **Total** | | **13 / 15–25** | | | | | | |

One anchor for every line (lower left, x 160, baseline 950, Readex Pro 500 at 80 px), after reference A's caption that never moves. Thirteen words is under cinetic's 15-word floor on purpose: Eclipse's own labels carry the rest ("Inside now", "approx.", "Usual on Wednesdays", "Busiest: Thursday 7–8 PM"). Copy is on about 37% of frames; the longest text-free stretch runs 3.15–15.94 s. No stock phrasing, no question, no "Introducing", no claim beyond what Eclipse shows.

## 7. Final frame (the poster)
The `#070707` stage. The white mark (ring, arcs, arrow, dot) left of the name FITWAY in Readex Pro 500 at 0.12 em, setting B: the ring 2.3× the name's cap height, the gap 0.42× the ring. The lockup spans about 42% of the frame's width, centred a little above the middle (y ≈ 520), at 1.08× its resolved size after the hold's push. Nothing else in frame. `storyboard/still-12-lockup.png`.

## 8. Mark sheet
`storyboard/mark-sheet.png`; source `storyboard/src/fitway-mark.svg`, `storyboard/src/mark-geometry.json`, method and scripts in `storyboard/src/mark-fit/`.
- **Reconstruction.** Six near-circular edges (ring outer and inner; the upper arc's two edges; the lower arc's two edges, which are 9 px thinner at 1024), eleven lines at 45° (the opening's two cuts, the inner arcs' three cuts, the chevron's four band edges, the lower arm's end), and the dot. Measured against the PNG along every edge's normal: **RMS 0.27 px, 95th percentile 0.59 px, max 1.40 px** at 1024 (0.2% of 2,093 samples over 1 px, at two cut corners). The PNG is not a perfect geometric drawing (its ring is about 1 px out of round), so the fill follows small radial harmonics while the construction draws the fitted circles.
- **Construction (what the film draws):** the dot's circle; the compass sweeps from the ring's opening (outer, inner, the inner arcs' circles); the four band lines; the six cuts; the nodes at the cut corners in red. No centre crosses or measurement labels: they read as crop marks and filler.
- **Small sizes and misread:** at 64 px it reads as a round emblem with an arrow entering it; the nearest common symbols (a target, a play button) are broken by the arrow passing through the ring's opening. At 16 px the dot and the inner arc merge; Eclipse's rail draws it at 26 px.
- **Lockup:** three settings rendered side by side; **B** (2.3×, gap 0.42×, 500) reads as one object at the small size; A crowds the name, C makes the mark outweigh it.

## 9. Gate
- [x] logline 14 words, one idea
- [x] ownership, deletion and specificity pass, with reasons in §2; the proof shows the non-obvious behaviour (approx. and band, the usual, the honest gap, the named hour)
- [x] 13 words; every fragment 3–5 words (RULES 3–7 ∩ cinetic crisp ≤ 5); at most 5 words visible at once; no sentence lands as a block; copy on about 37% of frames
- [x] the device is in every beat row, and its last link is the mark's dot
- [x] every drawn technique is placed or dropped with a reason (§3b)
- [x] the final frame contains the mark and the name
- [x] no hard ban: one sans (Readex Pro), red accent on a dark neutral stage, no glow but Eclipse's own light (brand-supplied, `BRIEF.md`), no glass, emoji or particles, no overshoot on copy

## 10. Conflicts and open points (for the coordinator)
- **cinetic vs RULES on fragment length:** cinetic calm caps a fragment at 4 words; RULES asks for 3–7. Resolved at 3–5 (crisp's cap). Proposal for RULES: "Fragments of 3–5 words."
- **cinetic vs RULES on the lockup hold:** cinetic wants a 1.5–2.5 s end card; RULES asks 3.5–5 s. RULES kept; the hold builds with an 8% push so it does not read as dead.
- **cinetic vs DECISIONS item 7 on the end card line:** cinetic adds one descriptor under the name; the user asked for the mark and the name only. Kept as decided; "Now, read yours." carries the promise before the mark.
- **Device moment vs cinetic's "floating device" ban (A3, H1):** the user decided the devices; they are grounded on a desk with shadows and one camera axis, and carry the real page, not a mockup.
- **Reports' fill is a film construct.** Eclipse's Reports has no intro (Q12); the film fills its pattern on the grid as the user's story asks. Its unfilled cells use Eclipse's own empty-pattern look and the light comes on only with a complete pattern (LGT-11).
- **Order of the answers and the line.** As in Eclipse's own intro, the answers show the 7:42 PM values while the line is still drawing the afternoon (bars 3–4). That is Eclipse's real order, stretched.
