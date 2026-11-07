<!-- Part of NEXT-DIRECTION-BRIEF.md; the index and the rule for editing are in NEXT-DIRECTION-BRIEF.md. -->

## Round 3 — after the lighting test (agreed 2026-09-24)

The test is `light-study/`. What the user liked and wants to keep: the rail tiles (a solid red
active tile, no side bar, "EN"), owned and clipped lights, the quieter chart with fine fading
vertical lines, and the missing-span treatment (round caps and a short dotted mark on the axis).

### Decisions (user-agreed)

1. **Recipe A.** Use deep, saturated FITWAY red that fades only toward black. It is calm and
   dim, and reads as pure red. B's light was too strong, and C's haze did not read as red.
2. **Lighter grain.** The grain in the test was a little too strong. Make it finer and fainter,
   and keep it inside lit areas only.
3. **Light shape: an eclipse, not a bulb.** A brightness map of the reference shows that none of
   its lights is a round blob. Each one is light *wrapping around a large dark ellipse*:
   - **Where the light is:** it is brightest along the element's edges and corners, and
     brightest of all just inside the far corner.
   - **The inner edge:** where the light meets the dark ellipse, the edge is a clean,
     softly-feathered curve. The dark shape pushes into the light; the light never bulges into
     the content.
   - **The rim:** the element's border brightens where the light touches it.
   - **Lit small card** (reference light 4): the light hugs the bottom edge. It is thin at the
     far end, thickens into the corner, and rises partway up the side.
   - **Chart card** (reference light 2): a U shape hugs the bottom and both sides around a dark
     center, so the two lower corners are the brightest.
   - **Page wash** (reference light 1): an arc along the top edge, from the corner.
   - **In CSS:** one way to build this is a light gradient anchored at the edge, masked by a
     large radial ellipse set in the element's interior (transparent inside, opaque outside).
   - In the test, the lit card's light was a round blob bulging into the card. That is what the
     user rejected.
4. **Line = a 30-minute moving average, plus the true peak.**
   - **The line:** it shows the 30-minute moving average and is drawn smooth and
     shape-preserving. Say what it is in plain words, for example «متوسط كل 30 دقيقة».
     *Refined by Round 4 §1: the average is centered.*
   - **The peak:** a separate marker shows the true highest reading (62 at 6:29 PM), with its
     label. The line itself does not need to touch it.
   - **Truth rules still hold:** the line still stops at both edges of the missing span and at
     now, and the genuine zero stays visible.
   - **Where the minute truth lives:** the "Inside now" card shows the latest reading. Hover and
     "View details" keep the minute detail.
   - **The user's view:** the user judges that the average plus the true-peak marker keeps the
     truth, and intends to amend `DESIGN_GUIDE.md` §12 to allow it. That amendment is a separate
     step outside this concept packet.
5. **Settings icon.** Use a gear, not a sun, because a sun reads as a brightness or theme control.
6. **Fonts.** Cairo is not required. Readex Pro (from the test) is approved.
7. **The usual line continues after now.** The dashed "usual Wednesday" line runs faintly to
   closing time, so the owner sees when the gym usually gets busy or quiet later tonight. There
   is no "not a forecast" caption; the legend just names it «الأربعاء المعتاد».
8. **No explaining inside the design.** The owner will explain the page to the gym, so the page
   carries names and values, not explanatory captions. The entries figure has no caption
   either. The user had `SPEC.md` amended on 2026-09-24 so that the figure is named as entries
   («مرات الدخول» / "Entries"), never as members or unique visitors.

### Next step: the full Daily page (done: `eclipse/`, see Round 4)

Build the full Daily page at desktop 1440×900, in Arabic RTL and English LTR, from all rounds of
this brief:

- **Lights:** the page wash, the chart card, and one small card (for example "Inside now").
  Every other card is unlit, with thin borders.
- **Detail kept minimal:** "View details" can open a simple, truthful panel. Keyboard focus
  names and fine polish of the details panel remain deferred.

