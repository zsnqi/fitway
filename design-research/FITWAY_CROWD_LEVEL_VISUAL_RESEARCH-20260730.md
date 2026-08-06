# FITWAY — Crowd Level Visual Research

> **Tracked 2026-08-06 as research input, not authority.** This file sat untracked at the
> repository root. `design-research/` is outside the source-of-truth order in `AGENTS.md`; the
> visual authority is Paper, per
> [ADR-007](../docs/adr/ADR-007-paper-visual-source-of-truth.md). Its section 6 reject list and
> section 9 Paper briefs are research conclusions, not standing instructions, and the 02F/02G/02H
> briefs were overtaken by the direction that reached
> `STAFF MONITORING PRODUCTION SET — CURRENT`. The body is preserved unedited.

**Scope:** how real, shipped products communicate live crowd level, occupancy, occupancy-vs-capacity, freshness and sensor trust — and what that means for the FITWAY staff monitoring page.
**Date:** 2026-07-30
**Status:** research only. No implementation files and no Paper nodes were modified.
**Paper directions inspected (read-only):** Direction 02, 02A, 02B, 02C, 02D, 02E in `STAFF MONITORING — DIRECTION STUDY`, file *FITWAY UX Exploration*.

---

## 1. Executive conclusion

**The question "which small graphic goes next to متوسط?" has no good answer, because the question is malformed.**

Across every shipped product I could verify, a categorical crowd word is *never* paired with a redundant abstract mark that encodes the same categorical value. Products do one of two things:

1. **They render the verdict as text and stop.** Occuspace's live model exposes `Busyness Level` as a bare string — `Not busy` / `Busy` / `Very busy`. Google's own labels are sentences: *"Usually not too busy"*, *"Usually a little busy"*, *"Usually as busy as it gets"*, and the live state is the single word **"Live"**. MBTA ships *"Not crowded" / "Some crowding" / "Crowded"*. No accompanying intensity glyph in any of them.
2. **They attach the graphic to the quantity the word summarises**, not to the word. Google Maps overlays the live bar onto the *hourly histogram* — the graphic carries "now versus typical", which the word cannot. PureGym's operational dashboard sorts and filters on **Attendance** and **Percentage Full** — the graphic, where present, belongs to the ratio.

Directions 02A–02E all violate this. Each one places a mark beside a 64px word that already states the answer. A mark that adds no information beside the loudest element on the page is decoration by definition — and every attempt to draw a *restrained* four-state mark converges on a shape that already means something else on a screen: signal strength (02A, 02B), a level meter (02B), loose dots (02C), status tiles (02D), or a text underline that reads as selection or a link (02E). The convergence is not bad luck. **A four-state ordinal value drawn small has almost no unclaimed visual vocabulary left.**

The correct move is available and already authorised in FITWAY's own contracts. `SPEC.md` records that the staff snapshot carries **`capacity`** (public schema v2 is deliberately capacity-free; staff/owner is not), and that the band is computed from **"band thresholds (% boundaries for…)"** against that capacity. The crowd word *is already* a percentage of capacity, rounded to four names. So `37 / 100` is not a new invention layered onto the page — it is the evidence the word was derived from, and it is the one thing on that board the word does **not** say.

**Therefore: keep the crowd level as pure type with no mark whatsoever, and give the only quantitative device on the page to the approximate count, expressed against configured capacity.** This is exactly the shape of the two closest real analogues — Occuspace (`Count`, `Capacity`, `Percent Occupied`, `Busyness Level`) and PureGym's `peopleingym` operations dashboard (Attendance + Percentage Full + a four-tier text flag).

Two secondary conclusions:

- **Device health is a parallel channel, not part of the reading.** Density ships this exactly as FITWAY specifies it: `space_health_status` is returned *alongside* the occupancy metric "to provide full context on the reliability of live data", with the enum `healthy` / `degraded` / `offline` / `unknown` and an aggregate precedence rule. FITWAY's existing fact rail is already correct and should not be redesigned.
- **"Current versus typical" is the one information dimension FITWAY genuinely lacks** — and it should stay lacking on this page. It is the core of Google Maps, TfL and TSA, but all three are *planning* tools for visitors. For a monitoring-only staff surface it adds a chart and answers a question staff did not ask. `SPEC.md` already reserves `trend` as permanently null in v1. Leave it there.

---

## 2. Source table

All URLs accessed **2026-07-30**. "Verified" = I or a research agent successfully fetched the page and the claim appears in its text. "Snippet" = only search-result summary was retrievable (page 403'd or was JS-rendered).

| # | Source | URL | Confidence |
|---|---|---|---|
| 1 | Google Business Profile Help — About popular times, wait times & visit duration | https://support.google.com/business/answer/6263531?hl=en | Verified |
| 2 | Google blog — Behind the scenes: popular times and live busyness information | https://blog.google/products-and-platforms/products/maps/maps101-popular-times-and-live-busyness-information/ | Verified |
| 3 | Google Maps Help — Get information about busy areas | https://support.google.com/maps/answer/11323117?hl=en | Verified |
| 4 | Google Maps Help (Arabic) — الحصول على معلومات عن المناطق المزدحمة | https://support.google.com/maps/answer/11323117?hl=ar | Verified |
| 5 | Google Maps Platform — Places Aggregate API overview | https://developers.google.com/maps/documentation/places-aggregate/overview | Verified |
| 6 | Anytime Fitness — The AF App (Busy Meter) | https://www.anytimefitness.com/apps/ | Verified |
| 7 | PureGym — People in Gyms live dashboard | https://peopleingym.puregym.com/ | Verified |
| 8 | PureGym Switzerland — Live club utilisation | https://www.puregym.swiss/en/blog/live-auslastung/ | Verified |
| 9 | The Gym Group — Can I check how busy it is in my gym? | https://support.thegymgroup.com/support/solutions/articles/44002760986-can-i-check-how-busy-it-is-in-my-gym- | Verified |
| 10 | Occuspace Docs — Using Live Data | https://docs.occuspace.io/guides/using-live-data | Verified |
| 11 | Occuspace Docs — Occupancy | https://docs.occuspace.io/guides/understanding-your-data/occupancy | Verified |
| 12 | Density — Atlas Analytics | https://density.io/atlas | Verified |
| 13 | Density Developer Portal — Understand Health | https://developers.density.io/understand_health/ | Verified |
| 14 | Density — Monitor Sensors in Real Time with Density Live | https://density.io/resources/density-live-sensor-status | Verified |
| 15 | Deutsche Bahn — Auslastungsinformation | https://www.bahn.de/service/informationen-buchung/auslastungsinformation | Verified |
| 16 | MBTA — Crowding Information for Riders | https://www.mbta.com/projects/crowding-information-riders | Verified (labels only) |
| 17 | MTA — Metro-North TrainTime capacity tracking press release | https://www.mta.info/press-release/mta-unveils-new-capacity-tracking-and-real-time-location-features-in-metro-north-traintime-app | Verified |
| 18 | TfL — Improved real-time Tube station information in TfL Go | https://nile.tfl.gov.uk/info-for/media/press-releases/2021/june/improved-real-time-tube-station-information-added-to-tfl-go | Verified (no labels) |
| 19 | Hitachi R&D — JR East train congestion visualization (operator-facing) | https://www.hitachi.com/rd/research/design/service/case_congestion_visualization.html | Verified |
| 20 | TSA — MyTSA App | https://www.tsa.gov/mobile | Verified |
| 21 | V-Count — VCARE occupancy counter | https://v-count.com/vcare-occupancy-people-counter/ | Verified |
| 22 | Countwise — Real-time occupancy monitoring | https://www.countwise.com/solutions/real-time-occupancy/ | Verified |
| 23 | FootfallCam — COVID-19 automated occupancy control | https://www.footfallcam.com/Industries/Covid-19-Automated-Occupancy-Control-System | Verified |
| 24 | VergeSense — Workplace analytics | https://www.vergesense.com/occupancy-intelligence/platform/analytics | Verified |
| 25 | Butlr Developer Docs — What is Butlr | https://docs.butlr.io/what-is-butlr | Verified |
| 26 | Siemens — Enlighted Occupancy APIs | https://developer.siemens.com/enlighted-apis/occupancy/overview.html | Verified |
| 27 | Schneider Electric — EcoStruxure Workplace Advisor | https://www.se.com/uk/en/work/services/field-services/building-services/workplace-advisor-smart-offices.jsp | Verified |
| 28 | Johnson Controls OpenBlue — Environmental monitoring | https://openblue.johnsoncontrols.com/workplace-planning-and-management/insights/environmental-monitoring | Verified |
| 29 | W3C — Understanding SC 1.4.1 Use of Color | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html | Verified |
| 30 | W3C ARIA APG — Meter pattern | https://www.w3.org/WAI/ARIA/apg/patterns/meter/ | Verified |
| 31 | W3C — WAI-ARIA 1.2, `meter` role | https://www.w3.org/TR/wai-aria-1.2/#meter | Verified |
| 32 | Material Design 3 — Bidirectionality & RTL | https://m3.material.io/foundations/layout/bidirectionality-rtl | Verified |
| 33 | JR East App — 5-level car congestion (behavioural labels) | https://www.jreast.co.jp/en/train-konzatsu/ | Snippet (403) |
| 34 | Tokyo Metro CrowdNavi — four-colour car congestion | https://www.tokyoweekender.com/entertainment/tech-trends/tokyo-metro-crowdnavi-train-congestion-website/ | Snippet (403) |
| 35 | Planet Fitness — Crowd Meter press release | https://www.planetfitness.com/newsroom/press-releases/planet-fitness-continues-its-digital-evolution-new-mobile-app | Snippet (403) |
| 36 | The List — criticism of the Planet Fitness Crowd Meter | https://www.thelist.com/757735/the-shady-side-of-the-crowd-meter-on-the-planet-fitness-app/ | Verified (secondary) |
| 37 | Android Authority — criticism of Google Maps Popular Times | https://www.androidauthority.com/google-maps-popular-times-3508007/ | Verified (secondary) |
| 38 | zugreiseblog — DB Auslastung pictogram cross-check | https://www.zugreiseblog.de/bahn-auslastung/ | Verified (secondary) |

**Corrections to agent-reported findings.** One research agent reported an MBTA sentence about "warning colors and people icons… color-blindness" as a direct quote. On re-fetch of source 16 that sentence **did not appear**; only the category labels are confirmed. It is carried here as unverified and is not used as evidence. Likewise, exact bar colours in Google Maps Popular Times are reported inconsistently across secondary sources and are **not** specified in any Google-owned page — only the *semantic* pattern (a distinguished live segment overlaid on the typical bar) is well supported.

---

## 3. Analysis of the strongest real-product examples

### 3.1 Google Maps — Popular Times / Live busyness *(sources 1–4)*

- **Primary reading:** an hourly **bar histogram**, scaled so that the venue's own busiest hour of the week is 100%. It is a *relative* chart, never an absolute count or capacity ratio. Google publishes no occupancy number at all.
- **Standalone symbol:** none for the venue-level reading. At the neighbourhood level a **"Busy area"** map label exists; secondary reporting describes its icon as a pulsating circle containing a small bar-graph glyph — deliberately *not* a signal-strength shape. Unverified against Google's own copy.
- **Current vs typical — the defining move:** *"Live visit data … is updated in real time and overlaid on the popular times graph."* Live is not a separate widget. It is a differently-treated segment sitting **on top of** the typical bar for the same hour, so the comparison is the composition. This is the single most-copied idea in the category.
- **Freshness:** the word **"Live"** as a chip. No timestamp string is documented anywhere in Google's own pages.
- **Avoiding device-status confusion:** the histogram is 24 bars wide with an x-axis of hours. Scale and axis do the work — nothing on a phone status bar is 24 units wide with a time axis.
- **Staff vs visitor:** none. Business owners see the same graph in their profile; Google states owners *cannot* add or edit it.
- **Without colour:** the tier sentences carry the meaning. Tapping any bar yields text — *"usually not too busy"*, *"less busy than usual"*. Bar height is a second non-chromatic channel.
- **Trust:** Google **withholds** the reading rather than degrading it — data appears "only if Google has sufficient visit data", and it applies differential privacy so it "never publish[es] the exact number of people in an area". This is precisely FITWAY's rule that untrusted readings are removed rather than shown hedged.
- **RTL:** the Arabic help page uses **"منطقة مزدحمة"** for a busy area and describes a **"رسم بياني يوضّح مدى ازدحام المنطقة خلال أوقات مختلفة من اليوم"**. Google keeps the reading text-led in Arabic; no Arabic-specific chart mirroring is documented.
- **Documented criticism (source 37):** the feature surfaces inconsistently, has not been meaningfully redesigned "in nearly a decade", and forces users to read a whole histogram when a single plain sentence would answer them. Directly relevant: **the histogram is the weak part, the sentence is the strong part.**

### 3.2 Occuspace / Waitz *(sources 10–11)* — the closest structural match to FITWAY

The live model exposes exactly four fields: **Count**, **Capacity**, **Percent Occupied**, **Busyness Level**. Busyness Level is documented as *"a textual representation of the busyness level of a space based on the Percent Occupied value"*, with thresholds `Not busy ≤ 45%`, `Busy > 45% and ≤ 80%`, `Very busy > 80%`.

This is FITWAY's data model with different band names. Two things follow:

1. The categorical word is **derived**, and the ratio is the **evidence**. Occuspace ships both, because operators need the evidence and visitors only need the verdict — which is exactly why Occuspace splits its surfaces: **Portal + Customer API** for operators, **Waitz + digital signage** for the public.
2. The verdict is a **string**, not a glyph. There is no intensity mark in the data model at all.

- **Freshness / trust:** genuinely weak. No staleness field, no sensor-health field, no last-updated string is documented. FITWAY is *ahead* of Occuspace here.
- **RTL:** not addressed. A bare string localises perfectly; a threshold ratio localises perfectly. Nothing in this model resists Arabic.

### 3.3 PureGym *(sources 7–8)* — the closest **operational** match

`peopleingym.puregym.com` is a live multi-club monitoring board, and its own controls reveal the model:

- Sort by **Attendance (Asc/Desc)** and by **Percentage Full (Asc/Desc)** → the two primary readings are a **count** and a **percentage of capacity**, side by side.
- Filter by **Status**: `Open` / `Closed`.
- Filter by **Problem**: `Very High Attendance` / `High Attendance` / `Low Attendance` / `Very Low Attendance` — a four-tier **text** classification, framed as an *operational exception flag*, deliberately separate from the raw numbers.
- **"Refresh automatically"** is the freshness affordance. No relative timestamp observed.
- In-app, the member-facing surface is a home-screen tile labelled **"Capacity at your club"** — prominence by **placement**, not by size or by adding a graphic.

The staff/visitor split is instructive: staff get count + percentage + an exception tier; members get one tile. FITWAY's staff page is the left-hand side of that split, and it already has the same three ingredients.

### 3.4 The Gym Group *(source 9)*

A **"capacity indicator"** on the app home screen answers *now*; tapping it opens a **popular-times graph** for *typical*. Two layers, one glanceable and one on demand. Officially: *"you can see the live capacity of your gym right from the home page"*, and tapping *"shows when the gym is typically busiest and quietest"*, up to a week. Same architecture as Google, PureGym and Waitz.

### 3.5 Anytime Fitness Busy Meter *(source 6)*

Despite the name "meter", the official description is a **count**: *"Our Busy Meter shows you how many members are currently working out at your gym."* No documented tier scale, no historical comparison, no freshness statement. Marketed under *"Avoid the Crowds—Or Don't."* The naming is a caution: calling something a *meter* does not make a gauge the right device, and here the shipped answer is a plain number.

### 3.6 Density *(sources 12–14)* — the reference for **sensor trust**

Density's health model is, to a near-exact degree, the model `SPEC.md` already specifies for FITWAY:

| Level | Density enum | Density definition |
|---|---|---|
| Sensor | `healthy` | "The sensor is online and sending data." |
| Sensor | `degraded` | "The sensor is online but is not sending data." |
| Sensor | `offline` | "The sensor is offline and is not sending data." |
| Sensor | `unknown` | "The sensor's status is unknown." |
| Space | `healthy` | "All sensors in this space are `healthy`." |
| Space | `degraded` | "1 or more sensor is `degraded`, `offline` or `unknown`." |
| Space | `offline` | "All sensors in this space are `offline`." |
| Space | `unknown` | "1 or more sensors are `unknown` and no sensors are `healthy`." |

The load-bearing design decision: `space_health_status` is delivered **alongside** the occupancy metric on the *Health Aware Presence* and *Current Occupancy* endpoints "to provide full context on the reliability of live data", with guidance to "exercise caution when relying on data" for degraded spaces. Health is a **companion channel that qualifies the number**, never a modifier of the number's own visual treatment.

Density Live plots sensors on a floor plan; drilling in reveals **status, Last Heartbeat, assigned doorway, assigned space, firmware, network**. Note that the floor-plan status itself is described as colour-only ("offline sensors… turn red"), which would be a WCAG 1.4.1 gap — FITWAY's labelled fact rail is better.

**Conclusion for FITWAY:** the existing fact rail (`حالة النادي` / `حالة جهاز العد` / `حالة الكاميرا`) is a correct, industry-matching structure and should be left alone. It is not the problem.

### 3.7 Deutsche Bahn Auslastung *(sources 15, 38)* — the best non-colour encoding, and why FITWAY still cannot use it

Four tiers, each a full sentence: **"Geringe Auslastung erwartet"**, **"Mittlere…"**, **"Hohe…"**, **"Außergewöhnlich hohe Auslastung erwartet"**. Each is drawn as **person pictograms**: one grey figure → two grey → three orange → three red and **crossed out**. Three non-chromatic channels at once — figure count, glyph state, and the sentence.

Why it is strong: the repeated unit is *a person*, so quantity is semantically motivated. Nobody mistakes three people for signal bars.

Why FITWAY should still not copy it:

- It is a **forecast** ("erwartet"), not a live sensor reading. The whole visual grammar is built to hedge — FITWAY's staff page must not hedge; it removes untrusted readings instead.
- The tiers are carried by a grey→orange→red ramp. `ADR-006` explicitly rules out a four-colour segmented meter, and `DESIGN_GUIDE.md` §5 rules out a green/yellow/orange categorical traffic light for crowd intensity in favour of a single red ramp.
- Three small figures next to a word is, structurally, Direction 02D with nicer glyphs. It re-enters the rejected class.

**What survives and is worth taking:** the *label discipline*. DB's tiers are behavioural sentences about what you can expect, not abstract intensity. Same with MBTA (**"Not crowded" / "Some crowding" / "Crowded"**, and **"Many Seats Available" / "Some Seats Available" / "Few Seats Available"**) and JR East's five levels, reported as *"enough seats to sit"*, *"comfortable to stand"*, *"comfortable for reading"*, *"shoulder to shoulder"*, *"overcrowded"* (source 33, snippet only). This is the strongest argument for Brief C below.

### 3.8 Transport and queue systems, briefly *(sources 16–20, 33–34)*

- **MTA TrainTime** (17): a **1-to-4 numbered icon per car**, laid over a diagram of the actual train. The numeral is the non-colour channel. Crucially it is derived from *"that train's ridership over the last seven days"* — labelled live, actually typical. A trust hazard FITWAY explicitly avoids.
- **TfL Go** (18): confirmed to exist; TfL's own press release does not enumerate labels, and the crowding data portal and developer thread were not retrievable. The one interesting reported property is that station busyness is normalised against *that station's own historical peak* — same idea as Google's "busiest hour = 100%". Treat label sets attributed to TfL elsewhere as unverified.
- **JR East operator console** (19): for *staff*, Hitachi's award-winning design encodes congestion as the **size and colour of a circle around a train's triangle** on a network map. Note the shift: the staff surface is spatial and comparative across many units; it is not a bigger version of the rider's indicator. FITWAY monitors **one club**, so this pattern has nothing to give — and it is a useful reminder that "staff dashboard" does not automatically mean "more graphics".
- **TSA MyTSA** (20): purely historical — *"how busy the airport is likely to be… based on historical data"*. A forecast, no sensor, no health model.
- **Entrance counters — V-Count, Countwise, FootfallCam** (21–23): converge on a **binary or three-state traffic light** (`Green`/`Amber`/`Red`) read from across a room, with the count, alerts and history reserved for the staff dashboard behind it. Two findings: the public/staff split is universal, and the public light is typically **colour-only**, an accessibility gap FITWAY must not reproduce.

### 3.9 Standards *(sources 29–32)*

- **WCAG 2.2 SC 1.4.1 (Level A):** *"Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element."* Sufficient techniques are text alternatives (G14), supplementary visual indicators (G182) and pattern plus colour (G111).
- **ARIA APG, Meter pattern:** *"A meter is a graphical display of a numeric value that varies within a defined range."* And decisively: *"The meter should not be used to indicate progress, such as loading or percent completion of a task. To communicate progress, use the progressbar role instead."* Occupancy against capacity is a bounded current measurement → **`role="meter"`**, never `progressbar`.
- **`aria-valuetext`:** *"If conveying the value of the meter only in terms of a percentage would not be user friendly, the aria-valuetext property is set to a string that makes the meter value understandable"* — W3C's own example is `aria-valuetext="50% (6 hours) remaining"`. The FITWAY analogue pairs ratio and verdict in one string.
- **Material Design 3, bidirectionality:** linear indicators fill from the **start** edge, i.e. right-to-left in Arabic; components are authored in `leading`/`trailing` terms so direction follows the document.

Note the interaction with `DESIGN_GUIDE.md` §5, which forbids numeric meter/progress ARIA on the **public** capacity-free signal. That prohibition is correct *because the public signal has no denominator*. On the staff page a denominator exists and is authorised, so `role="meter"` becomes the correct semantic there. The two rules are consistent, not contradictory.

---

## 4. Pattern taxonomy

### P1 — Text-led status, no separate graphic
*Occuspace `Busyness Level`; Google's tier sentences; MBTA; Anytime Fitness.*

- **Communicates:** the verdict, and nothing else.
- **Strengths:** zero misinterpretation risk. Zero device-status collision. Localises perfectly, RTL and LTR. Survives colour blindness, low vision, monochrome and print. Cheapest to build and to keep correct.
- **Risks:** no sense of position *within* a band; staff cannot see that the club is at the top of متوسط and about to tip. Four words compress a lot of range.
- **Needs:** band only.
- **FITWAY staff fit:** **High.** It is what Direction 02's typography already does well.
- **Desktop/mobile:** identical and excellent at every width.
- **RTL:** flawless.

### P2 — Current count against configured capacity
*Occuspace (`Count`/`Capacity`/`Percent Occupied`); PureGym (Attendance + Percentage Full); The Gym Group.*

- **Communicates:** the magnitude behind the verdict, and headroom.
- **Strengths:** the single highest-information-per-pixel addition available to FITWAY, and it is already in the staff snapshot. It is also *honest*: it exposes exactly the computation the band is derived from. Non-chromatic by construction — two numerals and a separator.
- **Risks:** implies a precision the counting device does not have; a hard denominator invites staff to treat 100 as a legal limit rather than a configured setting. Must never leak to the public surface — `SPEC.md` makes schema v2 strictly capacity-free and forbids any flag or toggle for public percentage disclosure.
- **Needs:** `count`, `capacity`, and the count's own trust state.
- **FITWAY staff fit:** **High**, with the caution that the count must stay visually subordinate to the band.
- **Desktop/mobile:** excellent; a ratio is two tokens.
- **RTL:** requires care. Use `٣٧ من ١٠٠`-style wording or Western digits per the existing numeral rule, and never a bare `37/100` slash, which is directionally ambiguous in bidi text.

### P3 — Restrained occupancy track with threshold marks
*Nearest shipped analogue: the capacity/utilisation gauges in Density Atlas, VergeSense ("capacity usage… estimated seats available") and EcoStruxure.*

- **Communicates:** where the current count sits inside capacity, and how near the next band boundary it is.
- **Strengths:** answers the one thing P1 cannot — position within band. Length is a non-chromatic channel. `role="meter"` with `aria-valuetext` gives an exact accessible reading.
- **Risks:** **substantial and must be designed against.** A thin horizontal track is the single most overloaded shape in UI — it reads as a loading bar, a progress bar, a scrubber, or a skeleton placeholder. The FITWAY staff page already renders grey bar skeletons in its loading state, so a low-contrast grey track in the same board is a genuine collision. Mitigations: anchor it to the numeral rather than floating it; always print the ratio; mark band boundaries as ticks so it reads as a scale rather than a fill; never animate it.
- **Needs:** `count`, `capacity`, band thresholds.
- **FITWAY staff fit:** **Medium-high**, only when subordinated to the count and never placed near the band word.
- **Desktop/mobile:** good, but below ~360px the tick labels must drop, leaving ticks and ratio.
- **RTL:** fills from the right; ticks mirror; the numeric ratio stays LTR-internal within an RTL run.

### P4 — Current versus typical time chart
*Google Maps Popular Times + Live; The Gym Group; TSA; TfL.*

- **Communicates:** whether now is unusual.
- **Strengths:** the richest reading in the category and the reason Google's design has survived a decade.
- **Risks:** it is a chart. It needs an axis, 24 units, a legend concept and a tap target. On a monitoring-only page it is a dashboard graphic in exactly the sense the brief prohibits. It also demands historical data the staff snapshot does not carry — `SPEC.md` reserves `trend` as always null in v1, and the today-curve/heatmap live behind **owner** analytics, not staff.
- **Needs:** per-hour history plus a typical baseline.
- **FITWAY staff fit:** **Low for Phase 5.** Correct home is owner analytics.
- **Desktop/mobile:** poor on mobile without a dedicated view.
- **RTL:** the time axis must run right-to-left, which is a real implementation cost and a real comprehension risk if done inconsistently.

### P5 — Labelled categorical scale (segmented four-state)
*Direction 02A; DB's four tiers; entrance traffic lights.*

- **Communicates:** the verdict, plus its position in an ordered set.
- **Strengths:** shows the range the current state sits in, which a bare word does not.
- **Risks:** this is the pattern the FITWAY baseline has already ruled out. `ADR-006` states that no *"four-color segmented meter"* ships, and `DESIGN_GUIDE.md` §5 rejects a categorical traffic-light meter for crowd intensity. Drawn small it is indistinguishable from signal strength; drawn large it duplicates the public 28-bar instrument on an operational page. It also spends a lot of horizontal space restating four words the user can already read.
- **FITWAY staff fit:** **Reject.**

### P6 — Spatial density / heatmap
*Density Atlas heatmaps; Butlr zone occupancy; Hitachi/JR East operator map; Density Live floor plan.*

- **Communicates:** *where* people are.
- **Strengths:** the only pattern that answers a question none of the others can.
- **Risks:** FITWAY counts a single line at a single club. There is no spatial dimension to render, so any heat treatment would be pure ornament fabricated from one number. Direction 02C is the degenerate form of this and was rightly rejected.
- **FITWAY staff fit:** **Reject** — the data does not exist.

### P7 — Headroom / remaining capacity as text
*MBTA Commuter Rail ("Many/Some/Few Seats Available"); DB ("ausreichend freie Sitzplätze vorhanden"); JR East's behavioural five levels; VergeSense "estimated seats available".*

- **Communicates:** what capacity is left, in terms of an action.
- **Strengths:** genuinely new information relative to the band word, expressed with **no graphic at all**. It is the most operational framing on this list — a staff member's actual question is "can I still let people in?", not "what percentile are we at?". Purely typographic, so it is immune to every rejection in the list. Robust in RTL.
- **Risks:** subtraction implies precision the device lacks; must be phrased as approximate. Meaningless if capacity is unconfigured — needs a defined null state.
- **Needs:** `count`, `capacity`.
- **FITWAY staff fit:** **High**, as a companion line to P1/P2.
- **Desktop/mobile:** excellent.
- **RTL:** natural Arabic phrasing, no mirroring problem.

### P8 — Exception flag separate from the reading
*PureGym's `Problem` filter; V-Count threshold alerts; FootfallCam staff alerts; Density `space_health_status`.*

- **Communicates:** "something needs your attention", as a channel distinct from the measurement.
- **Strengths:** keeps the calm reading calm. Real operations tools universally separate *the value* from *is this a problem*.
- **Risks:** on a monitoring-only page with no actions, an alert with nothing to do is noise.
- **FITWAY staff fit:** **Already implemented and correct** as the fact rail plus the camera notice. Do not redesign.

---

## 5. Why the existing FITWAY attempts fail

**Direction 02 (base) — structure right, two defects.**
The composition is the strongest of the set: one integrated board, band dominant at display size, count secondary across a hairline rule, a three-column fact rail, and a camera notice. Two problems. First, the caption **"يحدده جهاز العد تلقائيًا"** under the count is explicitly barred and must go. Second — the real missed opportunity — **`السعة المضبوطة 100` is buried in the club-status column, structurally divorced from the `37` it gives meaning to.** The board displays a numerator and a denominator and never relates them. Every comparable product relates them.

**Direction 02A — Signal board.** A four-segment labelled scale beneath the word. It fails twice over: it is a four-state segmented meter, which `ADR-006` rules out of the shipping system, and at that scale a row of separated bars with one highlighted reads as a signal-strength control. It also spends the full width of the reading area restating four words that are already legible.

**Direction 02B — Refined crowd reading.** Three short bars of unequal height set beside `متوسط`. This is the level-meter/equaliser shape in its purest form. At ~24px it has no axis, no unit and no scale to disambiguate it — the only interpretation available to a viewer is "signal" or "audio level".

**Direction 02C — Gathered field.** A five-dot cluster with two dots filled. Nothing establishes what a dot counts. It cannot be read as a scale (no order is legible), cannot be read as a quantity (five dots for a 37-person reading), and cannot be read as a category (no labels). It is texture.

**Direction 02D — Occupancy tiles.** Three squares, two filled. Closest to a legitimate ordinal encoding, and the closest to DB's pictograms — but with abstract squares instead of person glyphs, so the unit is meaningless, and three tiles cannot represent a four-state band. Reads as a status-tile decoration.

**Direction 02E — Quiet emphasis.** A short red rule under `متوسط`. It carries no state — it is identical for all four bands — so it is pure ornament, and a coloured underline beneath text is the established signature of a link, a selection, or an active tab.

### The common failure, stated once

All five put a mark **beside or beneath the band word**, and the mark encodes **the band**. The word is already the largest element on the page at ~64px. Any mark restating it is redundant, and a redundant mark in the highest-emphasis zone reads as decoration no matter how restrained it is. Compounding this, the reading zone is already carrying five things — label, live chip, freshness time, band word, and now a graphic — which is precisely the "crowded combination competing in the same area" already identified.

There is a second, subtler reason 02A and 02B feel wrong specifically in *this* product. The approved **public** page already owns a bar-based crowd instrument: `DESIGN_GUIDE.md` §5 and `apps/web/src/components/crowd-signal.tsx` define a continuous cumulative **28-bar** wave, heights ramping 12%→100%, grouped 6/5/8/9 across the four bands, with the current cap brightest. That instrument works because at 28 units and full board width it reads as an *instrument*, and because it is band-derived by design. Shrinking the same idea to four or five bars next to a word does not inherit its legitimacy — it inherits only its silhouette, which at small scale is the signal-strength icon. **The public page already spent this visual idea at the only scale where it works.**

---

## 6. Reject list

Do not propose, build, or revive any of the following for the FITWAY staff monitoring page.

1. **Any mark placed beside, beneath or inside `متوسط` that encodes the band.** Redundant with the word by construction. This is the whole class, not five instances of it.
2. **Ascending or descending bar sets of 3–6 bars.** Signal strength.
3. **Unequal-height short bars / level-meter / equaliser forms.** Audio.
4. **Dot clusters, filled/unfilled dots, dot grids.** No legible unit; reads as pagination, a carousel, or texture.
5. **Small square or tile sets as an intensity encoding.** Decorative; and three tiles cannot express four bands.
6. **Coloured underline, highlight, or rule under the band word.** Reads as a link, selection, or active tab; carries no state.
7. **A four-state segmented categorical meter of any kind.** Ruled out by `ADR-006`; also the signal-bar silhouette.
8. **A green/amber/red or four-colour traffic-light ramp for crowd intensity.** Contradicts `DESIGN_GUIDE.md` §5 and the single-red-ramp identity; also the weakest pattern on accessibility grounds — every entrance-counter product surveyed relies on colour alone.
9. **A shrunken copy of the public 28-bar instrument.** Loses the scale that makes it legible; duplicates the public identity on an operational surface.
10. **Person, running, dumbbell or gauge-needle pictograms as intensity units.** Semantically motivated in transport, but here they land back in categories 4/5 with extra ornament, and a needle gauge is an automotive metaphor foreign to this system.
11. **Radial rings, donuts, arcs, sparklines, or any circular occupancy gauge.** Dashboard ornament; a ring's fill is harder to read than a numeral and its RTL start point is ambiguous.
12. **Animated, pulsing, or transitioning crowd indicators.** `DESIGN_GUIDE.md` requires static, instant data changes.
13. **Any public exposure of capacity, denominator or percentage.** `SPEC.md` schema v2 is strict; no toggle, flag or migration exists. Staff-only, always.
14. **Restating the band name inside a second device** (e.g. a scale that re-prints `هادئ / متوسط / مزدحم / ممتلئ` next to a word that already says `متوسط`).
15. **Additional cards or panels** to host any of the above.

---

## 7. Recommended patterns for FITWAY

Three, in priority order.

**P1 — Text-led status with no separate graphic.** Non-negotiable foundation. The band word stands alone as type. Universal across every verified product; the only pattern with zero misinterpretation risk; already the strongest part of Direction 02.

**P2 — Current count against configured capacity.** The one genuinely new, already-authorised, already-available piece of information on the board. Matches Occuspace and PureGym exactly. Turns the orphaned `100` into the meaning of the `37`.

**P7 — Headroom expressed as text.** The most operational reading available, requiring no graphic at all. Matches MBTA, DB and JR East's discipline of describing capacity in terms of what it permits.

**P3 (restrained track with threshold marks)** is admitted only as a *subordinate* device attached to the count, and only under the constraints in Brief A. **P4, P5, P6 are rejected** for this surface, for the reasons given in §4.

---

## 8. Recommended primary direction

### Direction 02F — القراءة والسعة *(Reading and capacity)*

> **Keep the crowd level as pure typography with no mark of any kind. Move `السعة المضبوطة` out of the club-status column and bind it to the approximate count, so the board reads as one sentence: this is how busy it is, this is how many people that is, out of this many.**

The reading zone (right side, RTL) contains exactly four typographic elements and no graphic:

1. `مستوى الازدحام` — small label.
2. **`متوسط`** — display size, `--fw-chalk`, the dominant element. Nothing beside it, nothing beneath it, nothing bracketing it.
3. One freshness line: live state and last-update time, on a single baseline. Not a boxed chip competing with the word.
4. Nothing else.

The count zone (left of the existing hairline rule) carries the entire quantitative burden:

1. `العدد التقريبي` — small label. The `يحدده جهاز العد تلقائيًا` caption is deleted.
2. **`37`** — large, but a clear step below the band word.
3. Directly beneath, on one line: the denominator and the headroom, as text — `من 100 · يتبقى 63`.
4. Optionally (Brief A) a single hairline capacity track directly under that line, tied to the numerals, never near the word.

The fact rail keeps `حالة النادي` / `حالة جهاز العد` / `حالة الكاميرا` unchanged, minus the capacity fragment now relocated to the count.

**Why this is the right primary:**

- It removes the failed category entirely rather than iterating inside it. There is no mark next to `متوسط` to reject.
- Every element earns its place: the word is the verdict, the ratio is the evidence, the headroom is the action.
- It is the shipped structure of the two closest real analogues (Occuspace, PureGym) rather than an invention.
- The band stays visually strongest — the rule is satisfied by type scale, which is the most robust hierarchy channel available.
- Colour carries nothing unique anywhere: numerals, ratio and headroom are all text.
- The reading zone gets *quieter*, which directly addresses the "crowded combination competing in the same area" complaint.
- It works unchanged in stale state: the ratio becomes last-known alongside the count, under one label.

---

## 9. Three visual briefs for Paper

Three distinct explorations, to be built later by Codex as new sibling frames in `STAFF MONITORING — DIRECTION STUDY`, using the existing `--fw-*` tokens and Cairo. All three share Direction 02's board structure, the deleted `يحدده جهاز العد تلقائيًا` caption, and an untouched fact rail. **None of them places any mark beside `متوسط`.**

---

### Brief A — `Direction 02F — القراءة والسعة` *(recommended primary)*

**Idea:** the count carries a capacity track; the band word carries nothing.

**Reading zone (right, RTL):**
- `مستوى الازدحام` — 13px, 500, `--fw-text-subtle`, `0.08em`.
- `متوسط` — 72px, Cairo 700, `--fw-chalk`, tracking 0. No mark, no chip, no rule, nothing on either side.
- 12px below: one line, 13px, 400 — a 6px `--fw-live` dot, `قراءة مباشرة` in `--fw-live`, a `·` separator in `--fw-border-strong`, then `آخر تحديث 2:59 م` in `--fw-text-subtle`. Single baseline, no pill, no background.

**Count zone (left of the existing hairline, RTL layout):**
- `العدد التقريبي` — 13px, `--fw-text-subtle`.
- `37` — 56px, Cairo 700, `--fw-chalk`. Tabular figures.
- 8px below: `من 100` — 15px, 400, `--fw-muted`.
- 14px below that, the **capacity track**:
  - Full width of the count column, 6px tall, radius 3px.
  - Rail `--fw-surface-2` with a 1px `--fw-border-subtle` inset, so it cannot be mistaken for the grey loading skeleton.
  - Fill from the **right** (inline-start in RTL) to 37% of the width, solid `--fw-red`, no gradient, no glow, no animation.
  - **Three 1px tick marks** in `--fw-border-strong` rising 2px above and below the rail at the three configured band boundaries. The ticks are what make this a scale rather than a progress bar. No tick labels on desktop; none on mobile either.
  - 8px below the track, one line at 12px `--fw-text-subtle`: `يتبقى 63 مكانًا`.
- Semantics: `role="meter"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="37"`, `aria-valuetext="37 من 100 · متوسط"`. Ticks are `aria-hidden`.

**States to draw in the frame:** live (above); stale — the track fill drops to `--fw-oxblood`, the freshness line becomes `آخر قراءة معروفة` with its time, and `يتبقى` is suppressed because headroom from a stale count is misleading; capacity unset — the track and both `من 100` / `يتبقى` lines are removed entirely, leaving `37` alone.

**Risk being tested:** does a 6px track under a numeral read as a scale, or does it still read as loading? The ticks, the inset rail and the printed ratio are the three defences.

---

### Brief B — `Direction 02G — القراءة النصية` *(text only — safest)*

**Idea:** no graphic anywhere in the reading. The strongest control against every rejection so far, and the purest expression of what Occuspace and Google actually ship.

**Reading zone:** identical to Brief A. `متوسط` at 72px, alone.

**Count zone:**
- `العدد التقريبي` — 13px, `--fw-text-subtle`.
- A single composed numeric line on one baseline, right-aligned to the column's inline-start:
  - `37` — 56px, Cairo 700, `--fw-chalk`
  - `من` — 20px, 400, `--fw-text-subtle`, with 10px of space either side
  - `100` — 32px, Cairo 500, `--fw-muted`
  - The size contrast between `37` and `100` is the entire device. Baselines aligned, not centres.
- 10px below: `يتبقى 63 مكانًا من السعة المضبوطة` — 13px, 400, `--fw-muted`.
- No track, no rule, no mark.
- Semantics: plain text plus a visually hidden summary. No `meter`.

**States:** stale — `37` and `100` both shift to `--fw-text-subtle`, the label becomes `آخر عدد معروف`, the `يتبقى` line is removed. Capacity unset — the `من 100` fragment and the `يتبقى` line vanish; `37` stands alone.

**Risk being tested:** is size-contrast alone enough to make `37` and `100` read as one ratio, or does the pair fall apart into two unrelated numbers? If B reads as well as A, B should win on restraint.

---

### Brief C — `Direction 02H — قراءة تشغيلية` *(operational headroom)*

**Idea:** replace abstract intensity with the sentence a staff member actually needs, following the DB / MBTA / JR East discipline of describing capacity in terms of what it permits. The most *different* of the three.

**Reading zone:**
- `مستوى الازدحام` — 13px, `--fw-text-subtle`.
- `متوسط` — 72px, Cairo 700, `--fw-chalk`. Alone.
- Directly beneath it, at 20px Cairo 400 in `--fw-muted`, a **band-dependent operational sentence** — the only element in the whole set that changes meaning with the band, and it is pure text:
  - `هادئ` → `النادي يتسع لمزيد من الأعضاء بارتياح`
  - `متوسط` → `الإقبال معتدل ولا يزال هناك متسع`
  - `مزدحم` → `الإقبال مرتفع والمساحة المتاحة محدودة`
  - `ممتلئ` → `النادي عند السعة المضبوطة`
  - *(Final wording to be reviewed against the project's Arabic UX register before build.)*
- Then the freshness line as in Brief A.

**Count zone:** as Brief B (text ratio, no track), so C isolates the sentence as the variable.

**States:** stale — the operational sentence is **removed entirely**, not greyed; a stale reading cannot support an operational claim. Only `آخر مستوى معروف` and the last-known count remain. Capacity unset — the `ممتلئ`/`متسع` sentences that reference capacity are replaced with the neutral variant.

**Risk being tested:** does a full sentence under the band word read as calm and authoritative, or as chatty and redundant on a premium operational surface? This is the direct descendant of DB's *"ausreichend freie Sitzplätze vorhanden"* and MBTA's *"Many Seats Available"*, and it is the pattern most likely to be either clearly best or clearly wrong.

---

**Evaluation criteria for whoever reviews the three.** Squint test — is `متوسط` still unambiguously dominant? Greyscale test — does everything survive with colour removed? Skeleton test — with the loading state beside it, is any device confused for a placeholder? Sentence test — read the reading zone aloud left to right (right to left in Arabic); does it form one coherent statement? Stale test — is the delayed state visibly, textually labelled last-known with no live-looking artefact remaining?

---

## 10. Arabic RTL and mobile adaptation

### RTL

- **The board's inline-start is the right edge.** The band word, its label and the freshness line all anchor right; the count column sits to the left across the hairline, exactly as Direction 02 already composes it.
- **The capacity track (Brief A) fills from the right.** Material Design 3 is explicit that linear indicators fill from the start edge, right-to-left in Arabic. Implement with logical properties and `direction: inherit` so the fill grows from `inline-start`; never hard-code `left`.
- **Threshold ticks mirror with the track.** In RTL the `هادئ→ممتلئ` progression runs right to left, matching the public instrument's rule in `DESIGN_GUIDE.md` §5 that "progression and category order follow reading direction".
- **Never write a bare `37/100`.** A slash between two numerals inside an RTL run is directionally ambiguous and bidi-reorders unpredictably. Use the Arabic word: `37 من 100`. English composes naturally as `37 of 100`, not as a mirrored translation.
- **Numerals** follow the existing project rule; keep them tabular so the count does not shift width between readings. Do not apply negative letter-spacing to Arabic (`DESIGN_GUIDE.md` §4).
- **The band word takes no adjacent element in either script.** Anything placed beside it must be mirrored, and mirroring an intensity mark is precisely how 02A–02E acquired their ambiguity. Removing the mark removes the mirroring problem.
- **Accessible strings are composed, not concatenated.** `aria-valuetext="37 من 100 · متوسط"` is authored per locale; do not build it by joining fragments in code, which produces broken bidi.
- **English is composed naturally**, not mechanically mirrored — an existing requirement of the design guide, and it applies to the new ratio and headroom lines.

### Mobile (320–1440)

- **The reading zone never reflows into a graphic.** At every width the band word remains the largest element, on its own line, with nothing beside it. This is the one invariant.
- **Below ~768px the board stacks:** band block, then count block, then the fact rail as full-width rows. The hairline rule between reading and count becomes a horizontal divider.
- **Type scale steps down**, hierarchy does not: `متوسط` from 72px → 44px at 375px; `37` from 56px → 34px. The ratio between them must be preserved — the band word stays visually stronger at every breakpoint.
- **Brief A's track spans the full content width when stacked**, keeping its 6px height. Tick marks are retained (they are 1px and cost nothing); no tick labels at any width.
- **Brief C's operational sentence** must be allowed two lines at 320px; do not truncate it and do not shrink it below 15px.
- **`يتبقى 63 مكانًا` never wraps mid-number.** Keep the numeral and its noun in one non-breaking unit.
- **Touch targets:** none of these elements is interactive, so no minimum target applies — but nothing should *look* tappable. A boxed freshness chip and a filled track both risk reading as controls; the unboxed freshness line in all three briefs is deliberate.
- **Testing matrix:** 320, 375, 768, 1024, 1440, in Arabic and English, in live / stale / unavailable / capacity-unset states. That is the same canonical matrix already used for the public composition.

---

## Appendix — what FITWAY already does better than the field

Worth recording, because it constrains how much the surveyed products can teach:

- **Freshness.** Not one verified product ships a relative last-updated string. Google says "Live"; PureGym says "Refresh automatically"; Occuspace, VergeSense and Siemens document nothing. FITWAY's `آخر تحديث 2:59 م · قبل 12 ثانية` is ahead of every product surveyed.
- **Removing untrusted readings.** Google withholds data when confidence is insufficient; Density only advises callers to "exercise caution". FITWAY removes the reading and says so — the strictest position of the three, and the correct one.
- **Non-colour status in the device rail.** Density's floor plan uses red for offline with no documented text or shape alternative; the COVID-era entrance counters are colour-only traffic lights. FITWAY's labelled fact rail already satisfies WCAG 1.4.1 where those do not.
- **Public/staff privacy boundary.** Occuspace and V-Count split surfaces by audience but expose capacity on both. FITWAY's schema v2 makes the public payload structurally incapable of carrying capacity. That is a stronger guarantee than any product surveyed offers, and Brief A's ratio must never be allowed to erode it.
