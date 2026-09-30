# Eclipse design spec

> **DRAFT. Not a reference yet.** This sheet becomes a reference only through the authority record in step 10 of
> "The design-phase plan" (`../NEXT-DIRECTION-BRIEF.md`), after the user reviews it and the tests compare it with the
> final pages. First version: run `owner_spec_r04_s12`, 2026-09-30, measured on Daily (`index.html`) and Reports
> (`reports.html`) at `31a40d6`. It grows with every screen. `components.html` renders every component below in its
> rule form.

## 0. How to read it

**Authority.** `FITWAY_PRODUCT.md` and `SPEC.md` sit above this sheet. Where the sheet is silent, `DESIGN_GUIDE.md`
still applies (responsive, RTL, interaction, accessibility). Where `README.md` and this sheet disagree, this sheet wins;
`README.md` stays the history of how the pages were built.

**Labels.** Every entry from §1 on carries exactly one:

| Label | Meaning |
| --- | --- |
| **R** Rule | Every screen follows it. |
| **C** Composition | How one page arranges things. Recorded, never a template. |
| **K** Known issue | Something a page does now that breaks a rule. Never copied. Each one names its fix round in §7. |
| **P** Proposed rule | A value the pages do not show yet. Pending the user's review; the components page shows it marked "proposed". |

§8 holds questions for the user, not entries.

**Sources.** Every measured value names where it comes from:

| Code | Source |
| --- | --- |
| `D.x` / `R.x` | Probe `D:\fitway-scratch\spec\work\probe-pages.mjs` → `probe\probe.json`: computed style and bounding box of selector `x` at 1440×900, reduced motion. `D` = Daily `live`, `R` = Reports default. AR and EN are equal unless noted. A suffix names another state: `Dd` delayed, `Dn` no history, `Rs` short, `R7` last 7 days, `Re` empty July. |
| `T.x` | The same probe with a chart stop selected (tooltips). |
| `G.x` | The same probe with a dialog open (`dialog-*`). |
| `F` | The same probe's focus census: every Tab stop and its ring. |
| `N` | The same probe's text-size census: every element with its own visible text. |
| `W` | The same probe at 1024, 768 and 390 px. |
| `X` | `D:\fitway-scratch\spec\work\contrast.log`: WCAG 2.x ratios of token pairs on the composited surface. |
| `s:n` `r:n` `a:n` `rj:n` | Line `n` of `style.css`, `reports.css`, `app.js`, `reports.js` at `31a40d6`. |
| `F1`…`F21`, `D1`…`D4`, `KI1`…`KI4` | The fresh design review (`D:\fitway-scratch\review\REVIEW.md`): its findings, its class-d items and the four known issues it confirmed. The user accepted every F, D1 and D4, and endorsed its "Keep" list as rules (2026-09-30). |

Frames of every probed state are in `D:\fitway-scratch\spec\work\probe\frames\`.

## 1. Shared foundations (Owner, Staff and Public)

### 1.1 Colour tokens

| Id | L | Token | Value | Use | Src |
| --- | --- | --- | --- | --- | --- |
| COL-1 | R | `--page` | `#070707` | page field | s:8 |
| COL-2 | R | `--card` | `rgba(15,14,15,.94)`, composites to `#0F0E0F` | card surface | s:9, D.stat |
| COL-3 | R | `--card-solid` | `#0F0E0F` | opaque plate under data colour; the marker's centre | s:10, r:136 |
| COL-4 | R | panel | `rgba(17,16,17,.98)` | dialog panel | r:265, G.panel |
| COL-5 | R | `--head-bg` | `#121112` | table header row | r:16 |
| COL-6 | R | `--line` | `rgba(255,255,255,.075)` | surface border, table separators | s:12 |
| COL-7 | R | `--line-2` | `rgba(255,255,255,.10)` | control border | s:13 |
| COL-8 | R | `--line-3` | `rgba(255,255,255,.24)` | control border on hover | s:14 |
| COL-9 | R | `--ink` chalk | `#F5F3F2`, 17.47:1 on card | primary text, values, focus ring | s:15, X |
| COL-10 | R | `--ink-2` | `#C9C3C4`, 11.12:1 | secondary text; any text in a lit zone (LGT-9) | s:16, X |
| COL-11 | R | `--ink-3` | `#AAA4A6`, 7.89:1 on card | captions, only outside lit zones | s:17, X |
| COL-12 | R | `--red` FITWAY red | `#E51935` | brand, active rail item, light core, ramp step | s:18 |
| COL-13 | R | `--red-hi` | `#FF2946` | today's line, the hottest light point, lit level bars, caret | s:19 |
| COL-14 | R | oxblood / obsidian | `#4D0713` / `#08090A` | light ramp's broad areas / the base every light fades into | s:24-30 |
| COL-15 | R | `--live` | `#4BE29B`, 11.64:1 | verified live only | s:20, X |
| COL-16 | R | `--delayed` | `#D9A400` glyphs and borders; `#E8B62E` text, 10.27:1 | delayed status | s:21, s:305, X |
| COL-17 | R | stale grey | `#8F898B`, 5.63:1 on card, 5.18:1 on a closed cell | stale end point, "Closed" words | a:892, r:160, X |
| COL-18 | R | `--err` | `#FF6B7D`, 6.93:1 on the panel; edge `rgba(255,107,125,.5)` | error text, icon and field edge | r:12-13, X |
| COL-19 | R | field edge | `rgba(255,255,255,.34)`, 3.08:1; `.52` on hover and focus, 5.68:1 | text-field boundary (non-text 3:1) | r:15, r:293, X |
| COL-20 | R | selection, scrollbar | `rgba(229,25,53,.55)` with `#FFF`; thumb `rgba(245,243,242,.2)` on `#070707` | browser surfaces themed on every page | r:9, r:19 |
| COL-21 | R | red is structural | brand, the data, the light, the active rail item and focus accents only; never a button, never general emphasis | Keep, `DESIGN_GUIDE` §3 | r:69-71 |
| COL-22 | K | amber text | the header's delayed word is `#F0C23C`, beside `#E8B62E` elsewhere; one delayed text colour (COL-16) | K-30 | s:265 |
| COL-23 | R | production mapping | COL-9…16 equal `DESIGN_GUIDE` §14's `--fw-*` values; the stale grey `#8F898B` differs from `--fw-offline #9AA0AA` and is reconciled in step 10 (concept values are free under the guide's concept scope) | tokens | `DESIGN_GUIDE` §14 |

### 1.2 Surfaces and glass

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| SRF-1 | R | Card: `--card`, 1 px `--line`, radius 24, `backdrop-filter: blur(18px)`, no shadow. | D.stat |
| SRF-2 | R | Rail: `rgba(12,12,15,.7)`, blur 22, 1 px `--line`; open: `.94` and shadow `0 30px 80px rgba(0,0,0,.6)`. | D.rail, s:182-186 |
| SRF-3 | R | Tooltip: `rgba(15,14,15,.92)`, blur 10, 1 px `rgba(255,255,255,.14)`, radius 12. | T.tip |
| SRF-4 | R | Dialog: panel COL-4, 1 px `--line-2`, radius 24, shadow `0 40px 100px rgba(0,0,0,.7)`; scrim `rgba(4,4,5,.66)`, blur 3. | G.panel, G.scrim |
| SRF-5 | R | Plate: an opaque `#0F0E0F` layer, radius 16, under any colour that carries data inside a lit card, so the light never changes a data colour. | R.plate, Keep |
| SRF-6 | R | Shadows only on things that float (the open rail, the dialog). Cards never carry one. No nested cards; separators and alignment before boxes. | `DESIGN_GUIDE` §3 |

### 1.3 Light

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| LGT-1 | R | Lights are static. They never move, pulse, follow the pointer or react to data. | README Round 6, s:340 |
| LGT-2 | R | A light is a light behind the glass with a large dark disc in front of it (a mask, transparent inside), clipped to the element that owns it, sized in `cqw`/`cqh` of that element, never fixed to the viewport. | s:340-389 |
| LGT-3 | R | Three recipes only: the **page wash** (an arc along the top from the inline-start corner), the **summary light** (the `.lit-card` recipe: brightest just inside the inline-end bottom corner) and the **data light** (the `.lit-chart` recipe: a U along the bottom and up both sides). | s:125-160, s:391-464 |
| LGT-4 | R | The user-tuned `:root` values are the defaults and stay: summary intensity .7, core `229 25 53`, disc 77, aspect .7, position 67, softness 34 px, rim 8, lit-corner glow .05 at 110%, far glow .9, ring-end fade 19; data light intensity .95, fade 11.5, sides 48.5, balance 0, softness 260 px; wash 1; grain .15. | s:43-62 |
| LGT-5 | R | Light ramp: obsidian → oxblood → FITWAY red → `#FF2946` only at the single hottest point. It never reads pink or purple (OKLCH hue 21-29). Grain shows only where lit. | README "Colours", s:33 |
| LGT-6 | R | **Where light may go.** The language carries over, the composition does not: a page lights at most one summary card and at most one data card, plus the page wash, and may light none. Which card is lit is composition (§4). | Keep, plan §1 |
| LGT-7 | R | **D1.** The brightest thing on a page is never stale, unavailable or empty. A lit card whose content becomes stale, unavailable, empty or "not enough history" loses its light. | D1 (accepted) |
| LGT-8 | P | D1's form: the card is drawn as a plain card while its content is not current; the light returns with a live or complete value. | components.html |
| LGT-9 | R | **F7.** Text in a lit zone uses `--ink-2` or brighter, never `--ink-3` (measured `--ink-3` over a lit corner: 3.85-4.88:1). | F7 |
| LGT-10 | R | The rail's rim catches the page wash where it sits in it. | s:187-199 |

### 1.4 Type

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| TYP-1 | R | Readex Pro, self-hosted from `fonts/`, weights 400 and 500 only (one variable file per subset, shared by both weights), fallback `"Segoe UI", system-ui, sans-serif`. Cairo is excluded. | s:22, fonts/readex-pro.css |
| TYP-2 | R | Loading: the blocking font stylesheet, then `document.fonts.load` for both weights; each font file is fetched at most once per load, over HTTP and from `file://`. | index.html:20-29 |
| TYP-3 | P | **The scale (F9): six sizes with named roles.** | below |
| TYP-4 | R | Line height 1.5 for text, 1.6 for dialog text, 1.2 for the page title, 1 for a display value, 1.25 inside a tooltip. | D.h1, D.valueNum, T.tip, G.dlgDesc |
| TYP-7 | R | Every text is set by role (display, title, heading, body, label, caption). Entries below name the role; the role's size is TYP-3 once the user accepts it, and the measured size until then. | this sheet |
| TYP-5 | R | Letter spacing 0; never negative, never on Arabic. Only the Latin wordmark is tracked (.12em). | s:240 |
| TYP-6 | K | Rendered today: 10, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 19, 20, 30, 38 and 46 px (15 sizes; the review counted 13 and missed 16, the export "ready" title, and 20, the tooltip value). | N, T.tipV, G.doneTitle |

TYP-3, proposed:

| Role | L | Size / line | Weight | Takes over (measured today) |
| --- | --- | --- | --- | --- |
| display | P | 46 / 46 | 500, tabular | card values (46) |
| title | P | 30 / 36 | 500 | page title (30); a value written in words, such as a time range (38) |
| heading | P | 19 / 28.5 | 500; 400 for a sentence in a card | card, section and dialog titles (19); tooltip value (20); card empty sentence (19) |
| body | P | 15 / 22.5 | 400 or 500 | field text (15); tooltip word in place of a value (14); "ready" title (16); wordmark (15) |
| label | P | 13.5 / 20 | 400 or 500 | buttons (13.5), segments (13), header chips (13), table cells (13, 13.5), card labels (14), rail names (14), field labels (13), dialog text (13.5), alerts (13), subtitle (13.5), pattern day names (13), skip link (14) |
| caption | P | 12 / 18 | 400 or 500 | meta, notes, badges, legends, table headers, hints and errors (12.5), axes and tooltip rows (12), flags (11), coverage axis (11.5), pattern cell numbers (13, w500), key glyph (10) |

### 1.5 Numerals

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| NUM-1 | R | Western digits 0-9 in both languages, printed without a locale that could change them (production: `Intl` with `-u-nu-latn`). | `SPEC.md` i18n, a:4 |
| NUM-2 | R | `font-variant-numeric: tabular-nums` on everything that updates or aligns: values, times, table numbers, cell numbers. | s:84, r:152, r:199 |
| NUM-3 | R | Numbers, times, dates, ranges and Latin fragments inside Arabic are isolated with `<bdi>`. | s:84, Keep |
| NUM-4 | R | Thousands with a comma in both languages (`9,615`, `40,320`); a sign before a percentage, with the minus as U+2212 (`+9%`, `−4%`). | rj:203-204 |
| NUM-5 | R | People are whole numbers (F12). | F12 |

### 1.6 Spacing

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| SPC-1 | R | The scale is 4 px based: 4, 8, 12, 16, 24, 32, 48, 72. Mobile removes or recomposes space rather than shrinking it. | `DESIGN_GUIDE` §7 |
| SPC-2 | R | Page padding 16; rail to content 24. | D.page |
| SPC-3 | R | Optical exception: the rail's tiles sit 16 px from its outer edge (1 px border + 15 px padding), so a 48 px tile fills the 80 px rail. | D.rail, s:174 |
| SPC-4 | R | Optical exception: the tooltip keeps its user-approved box, padding 9 / 12 / 10 and row gaps 4 and 5 (approved 2026-09-26; unchanged by the lane decision). | T.tip, s:532-547 |
| SPC-5 | P | **Gutters and paddings (F8):** one 16 px gutter between cards and sections in both directions; stat card padding 20; section card padding 24 (the chart card's bottom 16 is an optical exception: the time axis's 18 px line box brings its own space); dialog inset 24, with the close button's side at 12 so its glyph lines up with the 24 px content edge. | F8 |
| SPC-6 | P | **Small gaps:** 8 between an icon and its text, between buttons, between rail items, and between a label and its field; 16 between a card's head and its value (today 14, with the icon tile that F21 removes); 16 inside a legend. Controls, table cells and fields pad their text 16 at the inline sides; badges 8. | F8 |
| SPC-7 | K | Off-scale today: gutter 18 down (16 across); card padding 18 × 20; section padding 22 × 26 with bottoms 16, 10, 22 and 24; rail gap 10 and brand gap 26; meta gap 7; head to value 14; subtitle 6; field gaps 7 and 10; control and cell padding 14; badge padding 10; alert and file line 12 × 14 and 11 × 14; dialog foot 20 and gap 10; heat plate padding 2 × 4; skip link 8 × 14. | D.*, R.*, G.* (K-08) |

### 1.7 Radii, borders, elevation

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| RAD-1 | P | Five radii: 24 surfaces (card, rail, dialog, sheet's top); 16 plates and scroll regions; 12 controls, tooltips, keys and alerts (and the rail tile, today 14); 8 badges and pattern cells; 4 flags and swatches (today 5 and 3); full for dots, the switch and round marks. | D.*, R.* |
| RAD-2 | K | Off the set today: the segmented control 13 (F13); rail tiles and the minute scroller 14; the icon tile, segments, sort headers and the skip link 10; flags 5. | r:51, r:59, r:223, s:223, s:589 (K-09) |
| BRD-1 | R | One border tint per role: `--line` for surfaces, `--line-2` for controls, `--line-3` on hover; a table row line is `.055`, a week edge `.14`. Borders are 1 px. | Keep, r:196, r:206 |
| BRD-2 | R | Elevation is the glass order: page, wash, cards, the open rail, a tooltip, the dialog. Only the open rail and the dialog carry a shadow (SRF-6). | s:182-186, r:266 |

### 1.8 Icons

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| ICO-1 | R | Drawn SVG on a 24 grid, stroke 1.6-1.8, round caps and joins, `currentColor`, no fill except dots. | s:228, r:87 |
| ICO-2 | R | An icon is sized by the text beside it: 13-15 with caption text (meta, badges, tooltip rows, errors), 16-17 with label text (buttons, notes), 18 in an icon button, 21 in the rail, 22 in an empty state. | s:228, s:306, s:553, r:87, r:95, r:233, r:300 |
| ICO-3 | P | **F21:** an icon beside a label sits in the flow, 16 px in the label's colour, 8 px before it, with no tile box. | F21 |
| ICO-4 | K | Every card draws its icon in a bordered 34 px tile (8 cards; `icon-tile-stack`). | s:290-300 (K-24) |
| ICO-5 | R | **F19:** glyphs that show time or direction mirror in Arabic (trend arrows, entry and exit arrows, sign out, chevrons that point along the reading line). Clocks, the logo, check marks and info marks never do. | F19, `DESIGN_GUIDE` §9 |

### 1.9 Focus

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| FOC-1 | R | **F18: one ring.** 2 px chalk `#F5F3F2` at a 3 px offset on every interactive element (17.47:1 on a card, 4.20:1 over FITWAY red). | s:86, F, X |
| FOC-2 | R | The inset variant, for controls packed edge to edge (segments, sortable headers, pattern cells): 2 px chalk at −4 px. | r:226, F18 |
| FOC-3 | R | At least 4 px between the ring and any other content. Focus is never hidden behind sticky elements. | F18, `DESIGN_GUIDE` §13 |
| FOC-4 | R | **D4:** a collapsed rail item shows its name on keyboard focus only; the mouse hover keeps its tile state and shows no tooltip. | D4 (accepted) |
| FOC-5 | P | D4's form: the name in a tooltip-look label (SRF-3, radius 8, 32 px, label type), 12 px beyond the tile on its inline end, centred on it. | components.html |
| FOC-6 | K | Offsets 3, 2, 1 and −4 today, and a red ring on the skip link; the chart's ring is 2 px from its "80" label. | F (K-22) |

### 1.10 Motion

| Id | L | What | Duration | Easing | Src |
| --- | --- | --- | --- | --- | --- |
| MOT-1 | R | Principle: motion carries information; decoration never moves; the page is complete at first paint; no glyph ever changes opacity; hover colours change at once. | | | README "Motion" |
| MOT-2 | R | Digits that change roll inside their ink box | 280 ms | `cubic-bezier(.25,1,.5,1)` ("state") | s:725, README |
| MOT-3 | R | A crowd-level bar fills or empties | 200 ms, 50 ms apart | state | README |
| MOT-4 | R | Switch thumb | 200 ms | state | r:112 |
| MOT-5 | R | The chart marker follows between stops (the tooltip rides with it, sideways only) | settles in about 400 ms | two lags, 90 and 15 ms | README 6b |
| MOT-6 | R | The line's tail on a new reading | 280 ms | `cubic-bezier(.4,0,.2,1)` | README |
| MOT-7 | R | Live pulse from the end point, live only | every 5 s, visible 48% | `cubic-bezier(.22,.61,.36,1)` | s:754-771 |
| MOT-8 | R | Rail opens / closes (transforms and a clip; the width switches at once) | 240 / 200 ms | `cubic-bezier(.22,1,.36,1)` / `cubic-bezier(.4,0,.2,1)` | README 8 |
| MOT-9 | R | Dialog panel rises 14 px (a sheet slides up); scrim fades | 240 / 200 ms | as the rail | README Reports |
| MOT-10 | C | Daily's first-open intro: the answers roll, the line draws, then the end point and the peak land; once per tab; none on Reports (pending the user's final view in step 4) | 400, 914 and 257 ms from 914; 1171 ms in all | state; the line `cubic-bezier(.3,.2,.4,1)` | README 11 |
| MOT-11 | R | Reduced motion, `?motion=off`: every change is instant, no intro, the page at rest is identical. | | | s:773-776 |

### 1.11 Breakpoints and navigation

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| BRK-1 | R | Designed: 1440×900, 768×1024, 390×844. Checked so nothing breaks: 320, 1024 and 200% zoom. No document-level horizontal scroll at any width. | plan §2, `DESIGN_GUIDE` §8 |
| BRK-2 | R | Desktop: the slim icon rail, unchanged. | plan §3 |
| BRK-3 | R | Tablet (768): the same slim rail; the logo opens it over the content; content reflows to two columns. | plan §3 |
| BRK-4 | R | Phone: a glass bar at the bottom with five items (Today, Reports, Activity log, Access, Settings), each with a short label under its icon; a compact header (title, the Operations status as a small badge that opens its details, a menu for language and sign out); page controls under the title at full width; no hamburger. Its visual form is designed in step 3. | plan §3 |
| BRK-5 | R | Four summary cards go two by two below 1200 px. | Keep, r:32-34, W |
| BRK-6 | R | At 720 px and below a dialog becomes a bottom sheet and a table recomposes before it scrolls (fold secondary columns into the row; only then a labelled, keyboard-scrollable region with a sticky first column). | r:338-380, README Reports |
| BRK-7 | K | Reports sets the rail aside below 721 px and scrolls its pattern sideways only to avoid overflow: a placeholder, not a phone design. | r:334-351 (K-29) |
| BRK-8 | K | Daily's header overflows at 1024 (KI2) and its busy note jumps below 1024 (KI3). | W (K-26, K-27) |
| BRK-9 | R | Below 1024 nothing on the current pages is a rule except BRK-3…6; the rest of 768, 390 and 320 is designed in step 3. | plan §5 |

## 2. Content rules

### 2.1 Glossary

| Id | L | Concept | Arabic | English | Never |
| --- | --- | --- | --- | --- | --- |
| GLO-1 | R | estimated entrance crossings | مرات الدخول | Entries | members, visitors, «أعضاء», «زوار»; no caption (`SPEC.md`) |
| GLO-2 | R | occupancy now | داخل الصالة الآن · تقريبًا | Inside now · approx. | an exact headcount |
| GLO-3 | R | crowd levels (the band words only) | هادئ · متوسط · مزدحم · شديد الازدحام | Quiet · Moderate · Busy · Packed | «متوسط» for anything but the band (F3) |
| GLO-4 | R | an average (F3) | المعدّل (معدّل الموجودين، معدّل كل 30 دقيقة، معدّل 4 أيام) | Average (Average inside, 30-min average, Average of 4 days) | «متوسط» |
| GLO-5 | R | missing data (F4) | لا قراءات · before now: لا قراءات بعد | No readings · No readings yet | «لا قراءة», «لا بيانات», "No reading", "No data" |
| GLO-6 | R | genuine zero | الصالة خالية · 0 | Empty · 0 | "No readings" |
| GLO-7 | R | closed | مغلق · خارج ساعات العمل | Closed · Outside opening hours | a zero |
| GLO-8 | R | after now | لم يحن بعد | Still ahead | |
| GLO-9 | R | freshness | مباشر · متأخر · آخر قراءة · قبل 13 دقيقة | Live · Delayed · Last reading · 13 min ago | "Live" on anything stale |
| GLO-10 | R | comparison: against the usual day, and against the previous span | المعتاد · الأربعاء المعتاد · أعلى من المعتاد · أهدأ من المعتاد · قريب من المعتاد؛ أكثر ازدحامًا · أهدأ · قريب من السابق | Usual · Usual Wednesday · Busier than usual · Quieter than usual · About usual; Busier · Quieter · About the same | a comparison chip for a difference that is not clear (TRU-5) |
| GLO-11 | R | peak | الذروة · ذروة اليوم · أعلى ذروة | Peak · Today's peak · Highest peak | |
| GLO-12 | P | busiest (F20): the one-hour slot, on the hour, with the highest average inside across the days named beside it, shown only on enough days (§8 Q5, Q7) | الأكثر ازدحامًا · أكثر الأوقات ازدحامًا | Busiest · Busiest time | a 2-hour window on one page and a 1-hour one on another |
| GLO-13 | P | week (F1): a calendar week, Sunday to Saturday (as the table and the pattern already are); a rolling span is named "the last 7 days", never "week" (§8 Q3) | أسبوع · آخر 7 أيام | week · the last 7 days | two meanings of "week" |
| GLO-14 | R | nav names equal page titles (F15) | اليوم · التقارير · سجل النشاط · الوصول · الإعدادات | Today · Reports · Activity log · Access · Settings | «اليومي» / "Daily" beside a page titled «اليوم» / "Today" |
| GLO-15 | R | the concept label, visible on every concept page | مفهوم استكشافي · بيانات افتراضية | Exploration concept · synthetic data | |
| GLO-16 | R | jargon stays out of the copy (F11): "UTC" lives in the file, not in a sentence | | | «UTC», "UTC" in copy |
| GLO-17 | R | each language written naturally for itself (`DESIGN_GUIDE` §4) | فصحى مبسطة، بلا ترجمة حرفية | plain English, not a mirror of the Arabic | transliteration, word-for-word copy |

### 2.2 Dates, times and ranges

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| DAT-1 | R | Gym time (Riyadh), 12-hour clock: Arabic «ص/م», English AM/PM. | `FITWAY_PRODUCT.md`, a:144-151 |
| DAT-2 | R | Day before month: «الأربعاء 23 سبتمبر 2026» / "Wednesday, 23 September 2026"; short "Thu 17 Sep". | D.sub, R.td |
| DAT-3 | R | Arabic ranges use a plain hyphen, never an en dash: «16 - 22 سبتمبر», «6-8 م». English uses an en dash: "16 – 22 Sep", "6–8 PM". Date ranges are spaced, hour ranges are not. | R.statMeta, T.gap, memory |
| DAT-4 | R | **F16:** no line break inside a date, a time or a range. | F16 |
| DAT-5 | R | A figure's "when" sits in the card's meta slot, as date · time (F20). | F20 |

### 2.3 Crowd level

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| LVL-1 | R | Levels (synthetic thresholds): Quiet ≤ 24, Moderate ≤ 48, Busy ≤ 68, Packed above. Production reads the historical band from the row, never current settings. | brief, `SPEC.md` |
| LVL-2 | R | **F17:** the level badge appears only on "now" and on peaks, never on an average over many hours. | F17 |
| LVL-3 | R | A readout (a chart stop, a pattern cell) may name the level of that moment or slot, after its value. | T.tipL, R heat tip |
| LVL-4 | R | The level word is always written; the bars are a redundant cue (an unlit bar is 1.56:1, decorative). | X |
| LVL-5 | R | **F6:** while delayed, the badge is qualified with the value it belongs to. | F6 |
| LVL-6 | P | F6's form: the badge dims with the value: word `--ink-2`, lit bars in stale grey `#8F898B`, no red. | components.html |

### 2.4 State grammar

| Id | L | State | Treatment | Designed on |
| --- | --- | --- | --- | --- |
| STA-1 | R | Live | green dot and "Live · Last reading 7:42 PM"; values in chalk; the live pulse | Daily; D.status |
| STA-2 | R | Delayed | amber clock and "Delayed · Last reading 7:29 PM"; the card titled "Last reading" with "13 min ago" in amber; value `--ink-2`; the end point grey, no halo, no pulse; the badge qualified (LVL-5); the light out (LGT-7) | Daily; Dd (the light and the badge: K-12, K-06) |
| STA-3 | R | No history | the comparison is left out and an honest note takes its place ("Not enough history to compare yet"); no usual line | Daily, Reports; Dn.key, Rs.statEmpty |
| STA-4 | R | Missing | the dotted mark (a dashed box only as its area form in the pattern); "No readings" with its range; its own keyboard stop; never bridged or filled | Daily, Reports; T gap, R.hcNoData (the words: K-04) |
| STA-5 | R | Genuine zero | an outlined "0" and "Empty"; distinct from missing and closed in pixels and in text | Daily, Reports; R.hcZero |
| STA-6 | R | Closed slot | a neutral flat fill with "Closed" written in it, even in a single cell; runs merged | Reports; R.hcClosed (a single cell: K-32) |
| STA-7 | R | Still ahead | the usual line fainter and dashed; a hollow chalk ring; "Still ahead" | Daily; T ahead |
| STA-8 | R | Empty period | "No readings" in every figure, and one way back | Reports; Re (except week over week: K-01) |
| STA-9 | R | Working (an action) | the button says "Preparing…" at once and is disabled, `aria-busy`; a progress line after 300 ms; shown for at least 400 ms | Reports export; README Reports |
| STA-10 | K | Loading, closed (page), unavailable, error | **F2:** not designed yet. Product requires: loading, a static skeleton with `aria-busy`; closed, the closed label and next opening with no count or band; unavailable, no count, band or time; error, no reading kept and one focused retry. Each screen designs them in its own round. | none yet; F2, `FITWAY_PRODUCT.md` (K-02) |

### 2.5 Truthfulness

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| TRU-1 | R | **F1:** every figure in a period-bound row answers for the chosen period, or leaves the row and names its own dates. An empty period says "No readings" in every figure. "Week" has one meaning (GLO-13). | F1 |
| TRU-2 | R | **F5:** a figure states its basis (the subtitle says how many days); a cell drawn from too few days is qualified; "Busiest" is hidden below the minimum; every mark on the pattern has a key entry. | F5 |
| TRU-3 | R | **F6 and D1:** nothing stale looks live; stale values and their level read as last-known; the brightest thing is never stale, unavailable or empty. | F6, D1 |
| TRU-4 | R | The line is shape-preserving: a centred 30-minute average cut at opening, at a gap and at the latest reading; zero stays zero; the marker sits on what its tooltip describes; the latest stop shows the reading, never an average. | README "Line", a:661-678 |
| TRU-5 | R | A comparison shows only for a clear difference (the week chip at 5% or more), and only when both sides have readings for 80% of their open minutes. | README Reports |
| TRU-6 | R | Capacity is never shown, and nothing is a percentage of it. | brief, `FITWAY_PRODUCT.md` |

## 3. Components

`components.html` shows each one in each designed state, in its rule form, AR and EN.

### 3.1 Card and lit card

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| CRD-1 | R | Surface SRF-1. Anatomy: head (icon, label, meta at the inline end), value, then a badge or a note at the foot, pinned to the bottom. | Keep, D.stat |
| CRD-2 | R | Label `--ink-2`; meta caption `--ink-3` holding the "when" (DAT-5); value display type, chalk, with a unit in caption `--ink-3` on its baseline; note caption `--ink-3`; stale value `--ink-2`. | D.statLabel, D.statMeta, D.valueNum, D.unit, Dd.valueNum |
| CRD-3 | R | Empty content: one sentence ("No readings", "Not enough history yet") in heading type at weight 400, `--ink-2`, and one caption note with the basis. | Rs.statEmpty, Re.statEmpty |
| CRD-4 | R | Cards size to their content; cards in one row stretch to the tallest. | `DESIGN_GUIDE` §7 |
| CRD-5 | K | Stat cards are fixed at 166 px, which is why Daily's busy note pushes out of its card (KI3). | s:282 (K-28) |
| CRD-6 | R | Lit card: a card plus the summary or data light (LGT-3), with its text under LGT-9. | s:399-464 |
| CRD-7 | P | Stat padding 20 (SPC-5); head 20 px (the icon in the flow, ICO-3), 16 to the value, at least 16 to the foot. | components.html |
| CRD-8 | R | Designed states: live (lit or plain), delayed (plain, qualified), no readings, not enough history (plain). | Dd, Rs, Re |

### 3.2 Chart card

| Id | L | Part | Values | Src |
| --- | --- | --- | --- | --- |
| CHT-1 | R | Card | lit with the data light; title in heading type; legend and "View details" at the inline end; the plot 12 px below | D.chart, D.chartH2 |
| CHT-2 | R | Today's line | 3 px `#FF2946`, round caps and joins; a centred 30-minute average (TRU-4) | D.svg `ln` |
| CHT-3 | R | Usual line | 1.5 px chalk, dashes 3.5 / 4.5, round caps: `.55` before now (5.75:1) | D.svg `us-past`, X |
| CHT-4 | K | Usual line after now | `.24` chalk, 2.01:1, under the 3:1 a data graphic needs (§8 Q6) | D.svg `us-ahead`, X (K-31) |
| CHT-5 | R | Fine lines | 1 px under the line, `#FF2946` fading from .46 through .15 at 45% to 0 | a:552, a:580 |
| CHT-6 | R | Grid and axes | gridlines at 20, 40, 60, 80: 1 px white `.05` (1.11:1, decorative: the labels carry the scale); baseline `.13`; the missing span on the axis: 1 px dots every 4 px, chalk `.62`; labels caption `--ink-3` (in a lit zone `--ink-2`, LGT-9) | a:586-593, D.axY |
| CHT-7 | R | Peak | ring r 4.6, 2 px chalk, card-colour centre; a dotted drop (1 px, 1.5 / 3); tag "Peak 62" in caption `--ink-2` with the number in label type at 500 (today 14 px) | a:614-615, D.peakTag |
| CHT-8 | R | End point | r 4.4 `#FF2946` with a 2 px card-colour edge and a 9 px halo (1 px, red `.32`); delayed: grey `#8F898B`, no halo | a:620-621 |
| CHT-9 | R | Marker | a hollow ring r 6.5, 1.5 px `#FF2946`, card-colour centre, a soft red glow (3.5 px at .55); the peak and the latest reading use the same ring; delayed: grey edge, no glow; still ahead: a chalk ring (1.25 px at .85) on the usual line; missing: the axis dots light up in chalk, never a point; still ahead with no history: a short axis tick | a:892-975 |
| CHT-10 | R | Hairline | below the marker to the axis, starting 10 px under the point; dashed chalk for still ahead | README 6 |
| CHT-11 | R | Tooltip lane | a band at the top of the plot: top 2 px, height = the tallest tooltip among the current stops (89 live, 109 delayed, 69 no history), 8 px to the scale's highest mark; nothing else is ever drawn in it | D.lane, Dd.lane, Dn.lane |
| CHT-12 | R | Tooltip box | SRF-3, padding SPC-4; one start-aligned column: flag and time, value and level word, then the usual row and the delayed age. Width = the widest numbered tooltip among the current stops + 2, rounded up (127 px at 7:42 PM); only the missing-span box may be wider; never wraps or clips. Moves sideways only, centred on its stop, kept 2 px inside the plot | T.tip, README 6 |
| CHT-13 | R | Tooltip text | time caption `--ink-3`; value in heading type at 500 (today 20 px, TYP-6); level word caption `--ink-2`; a word in place of a value (Still ahead, No readings) body type; flag caption `--ink-2` in a 1 px `--line-2` box; delayed age caption amber with a clock | T.* |
| CHT-14 | R | Connector | a chalk line from the box to its mark, behind the data: solid 1 px `.36` for a reading; dashed 2 / 3 for the usual line; dotted 1.6 px dots for no reading; ending in a 5.4 × 4.2 pointer | README 6 |
| CHT-15 | R | Input | 40 stops (every half hour, the peak and the latest reading); pointer takes the nearest; arrows move one stop, Page keys four, Home to opening, End to the latest; Escape clears; focus starts at the latest; hover, focus and tap show the same readout | README 5 |
| CHT-16 | K | Scale by state | the 80 gridline at y 470, 491 and 451 (live, delayed, no history), and the last tick 50 px from its neighbour against 127 elsewhere (F14; decided with Q2) | F14 (K-15) |
| CHT-17 | K | Plot focus ring | 2 px from the "80" label, under FOC-3's 4 px | F, F18 (K-22) |

### 3.3 Pattern (heat map)

| Id | L | Part | Values | Src |
| --- | --- | --- | --- | --- |
| PAT-1 | R | Structure | a real table (`role=grid`): weekday row headers, hour column headers, one Tab stop, arrow keys, Home and End, Escape; each cell's text is its value and level, "0, Empty", "Closed" or "No readings" | Keep, README Reports |
| PAT-2 | R | Plate and cells | on the plate (SRF-5); cells 44 px tall, radius 8, 4 px apart; the day column 104 px | R.plate, R.hc |
| PAT-3 | R | Ramp | one hue, linear in sRGB between anchors (average inside): 0 `#1D0B0E`, 8 `#3A0A13`, 16 `#4D0713`, 28 `#7E0D1F`, 40 `#B8132B`, 52 `#E51935`, 64+ `#FF2946` | rj:595 |
| PAT-4 | R | Zero | an inset 1 px chalk `.38` outline and "0" in `--ink-2` | R.hcZero |
| PAT-5 | R | Closed | `rgba(255,255,255,.04)`, runs merged, "Closed" caption `#8F898B` written in every run, a single cell included (the fill alone is 1.1:1 against the plate) | R.hcClosed, r:161 |
| PAT-6 | R | No readings | a 1.5 px dotted chalk `.45` outline inset 1 px, radius 7, with its words | r:158 |
| PAT-7 | R | Busiest | a 5 px chalk dot, 5 px inside the cell's top inline-end corner, with a 1.5 px dark ring | r:169 |
| PAT-8 | R | Numbers | a switch prints every value in its cell; with numbers on, every value cell is its ramp colour mixed 80% with the card base, so chalk text keeps at least 5.26:1 (KI4) | r:166, KI4 |
| PAT-9 | R | Readout | the tooltip box (CHT-12), appearing, changing and leaving at once; hover, focus and tap | R heat tip |
| PAT-10 | P | Too few days (F5) | the cell keeps its colour under a fine diagonal hatch of the card base, and the key says "Fewer than 3 days" | components.html |
| PAT-11 | K | Selected cell | a ring at a 1 px offset instead of FOC-2's inset | r:170 (K-22) |

### 3.4 Table

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| TBL-1 | R | **F12: one table.** A real `<table>` with a caption, `th scope` and explicit roles; label-type cells; numbers aligned at the end with tabular figures, chalk; other cells `--ink-2`; the first column a row header in chalk. | R.th, R.td, r:179-200 |
| TBL-2 | R | Default density: rows 48, header 44; row lines `.055`, a firmer `.14` line closes each week; hover lifts a row with 4% white at once. | R.td, r:196-206 |
| TBL-3 | P | Compact density (logs): rows 36 with the same type, alignment and numerals; the header stays 44 so its sort buttons keep a 44 px target. | F12 |
| TBL-4 | R | Header: caption type `--ink-3` on `#121112`, sticky, a `--line-2` rule below, outer corners radius 12. | R.th |
| TBL-5 | R | Sortable header: the whole header is a button, at least 44 × 44; its arrow (14 px) shows on the sorted column, and at half strength on hover or focus; `aria-sort`; the sort is announced. | R.sort, r:223-231 |
| TBL-6 | R | Exceptions in words: a highlighted row in red 8% (12% on hover) with a "Highest" flag; a camera gap as a note; days before the readings began merged into one row. | r:207-221 |
| TBL-7 | R | Empty: EMP-1 inside the table. | Re.tableEmpty |
| TBL-8 | R | Phone (BRK-6): notes fold into their own row, the weekday over the date, the time under the value; cell padding 8 (6 at 400 px and below); only the sorted column shows its arrow. | r:352-371 |
| TBL-9 | K | Daily's minute table: 13 px, 32.5 px rows, numbers start-aligned without tabular figures, people as "0.0" and "1.7". | D details (K-20) |

### 3.5 Buttons

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| BTN-1 | R | **F13:** one button, 44 tall, radius 12, label type, icon 17 with an 8 gap, text never wraps. | R.rbtn |
| BTN-2 | R | Secondary: 1 px `--line-2`, 2% white; hover `--line-3` and 5% white. | r:80-88 |
| BTN-3 | R | Primary: chalk fill, `#0D0C0D` text at 500 (17.65:1); hover white. One primary per group. | r:89-90, X |
| BTN-4 | R | Disabled: secondary loses its fill and border to `--line`, text `--ink-3`; primary becomes chalk 14% with `--ink-2` text. Working: STA-9. | r:91-92, X |
| BTN-5 | R | Icon button: 44 × 44, no border, `--ink-2`, hover chalk and 5% white; it always has a localized name. | r:93-95 |
| BTN-6 | R | Red is never a button colour; a destructive action gets its own treatment when one exists. | r:69-71 |
| BTN-7 | R | Inline padding 16 (Daily's 14 / 11 is part of K-10). | R.rbtn |
| BTN-8 | K | Daily's "View details" is a 38 px button in 13 px text. | D.btn (K-10) |

### 3.6 Segmented control

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| SEG-1 | R | A group of toggle buttons (`aria-pressed`), one Tab stop each; the last may open a dialog (`aria-haspopup`). | r:43-45 |
| SEG-2 | R | **F10:** each segment is 44 px tall. | F10 |
| SEG-3 | P | Form: a 44 px row in a 1 px `--line-2` frame (drawn inside, so it adds no height), radius 12; segments pad 16, label type `--ink-2`; hover chalk and 5% white; pressed: chalk text on chalk 12% with a 1 px inset chalk `.42` edge (4.77:1), radius 12; focus: FOC-2. | components.html |
| SEG-4 | R | On a phone it spans the width in equal segments. | r:344-345 |
| SEG-5 | K | Segments are 36 px inside a 44 px frame (the hit area is widened by a pseudo-element); the frame's radius is 13. | R.segB, R.seg (K-11) |

### 3.7 Switch

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| SWI-1 | R | `role="switch"`, `aria-checked`; a 44 px box, 1 px `--line-2`, radius 12, label type. | R.switchEl |
| SWI-2 | R | Track 32 × 18, radius 9: off 7% white with a 1 px `--line-3` inset edge, thumb 12 `--ink-2` 3 px in; on: chalk track, card-colour thumb moved 14 px toward the inline end. The thumb slides (MOT-4). | R.switchTrack, r:111-116 |
| SWI-3 | R | Hover: chalk text, `--line-3` border. Checked: chalk text. | r:110-113 |
| SWI-4 | P | Padding 12 / 16, gap 8 (measured 12 / 14 and 10). | SPC-6 |

### 3.8 Date field

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| FLD-1 | R | A persistent label above; a 44 px input, radius 12, edge COL-19, 3% white fill, body type with tabular figures, a `#FF2946` caret; text aligned to the inline start. | G.fieldInput, r:277-292 |
| FLD-2 | R | Typed as day/month/year with a hint below it ("Day/month/year, like 16/09/2026"); Western digits; Arabic-Indic digits typed on an Arabic keyboard are read as Western; a valid date is tidied on leaving. | README Reports |
| FLD-3 | R | Hover and focus raise the edge to `.52`; focus adds FOC-1. | r:293-294 |
| FLD-4 | R | Invalid: the edge in `--err` `.5` and a 5% error fill; a specific message under the field in `--err` with a 15 px icon, tied with `aria-describedby` and `aria-invalid`; focus goes to the first invalid field. | G invalid |
| FLD-5 | R | Disabled: `--line` edge, no fill, `--ink-3` text and label. | r:297-298 |
| FLD-6 | P | Label to field 8, field to message 8, padding 16 (measured 7, 7 and 14). | SPC-6 |
| FLD-7 | K | The input's focus ring sits at a 2 px offset (FOC-1). | r:294 (K-22) |

### 3.9 Dialog and bottom sheet

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| DLG-1 | R | `<dialog>` with `showModal`: the page behind is inert; Tab and Shift+Tab stay inside; Escape and the scrim close it; focus returns to the control that opened it. | Keep, README Reports |
| DLG-2 | R | Panel SRF-4, at most 468 wide; head: title in heading type and a 44 px close button; body: text in label type `--ink-2`, line height 1.6; foot: actions at the inline end, the primary last. | G.* |
| DLG-3 | R | Intentional initial focus (`DESIGN_GUIDE` §11); which control is §8 Q8. | G initialFocus |
| DLG-4 | R | States: ready, invalid, working (STA-9, focus to Cancel), done (focus to the result's action, announced), failed (EMP-2). | README Reports |
| DLG-5 | R | At 720 px and below: a bottom sheet, full width, radius 24 at the top only, no bottom border, actions sharing the width, the safe-area inset below them. | r:373-379 |
| DLG-6 | P | Inset 24, close button side 12, foot gap 8 (measured 16 / 24 / 0 with a 14 side, body 6 / 4, foot 20 / 24 with a 10 gap). | SPC-5 |

### 3.10 Chips and badges

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| CHP-1 | R | **F13:** a pill in a control row matches the control height (44) or drops its box. | F13 |
| CHP-2 | P | Header forms: a status that opens its details is a 44 px control; a status that does not, and the concept label, are boxless caption text with their dot or icon. | components.html |
| CHP-3 | P | A legend drops its box: swatches and words in a row, 16 apart. | components.html |
| CHP-4 | R | Badge (in content, not interactive): 26 tall, radius 8, 1 px `--line-2`, `rgba(15,14,15,.55)` fill, caption type. | D.level, R.cmp |
| CHP-5 | R | Level badge: four 3 px bars (4, 6.5, 9, 11 tall, 2 apart, radius 1): lit `#FF2946`, unlit white `.16`; the word in chalk. | s:328-334 |
| CHP-6 | R | Comparison badge: a trend glyph (15 px; `#FF2946` for busier, `--ink-2` for quieter, two bars for about the same) and the words in `--ink-2`; mirrored per ICO-5. | s:335-338, r:29 |
| CHP-7 | R | Flag: a small outlined word (caption type, 1 px `--line-2`, or red `.45` for "Highest"). | T.tipFlag, R.flag |
| CHP-8 | P | Badge padding 8 with an 8 gap; flag radius 4 and height 18. | SPC-6, RAD-1 |
| CHP-9 | K | Header chips are 36 px beside a 44 px control; the legend box is 38 px beside a 44 px switch. | D.status, D.key, R.concept (K-10) |

### 3.11 Rail and header

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| RAI-1 | R | Rail: 80 px, the full height less the page padding, sticky, SRF-2, radius 24; the logo at the top (it opens and closes the rail), the sections, then Monitoring, the language and sign out at the foot. | D.rail |
| RAI-2 | R | Items are 48 × 48 tiles: 1 px `--line-2`, 1.8% white, icon 21 in `--ink-2`; hover `--line-3`, 6% white, chalk icon; the current page: FITWAY red with a white icon (4.64:1), `aria-current`. Every item has a localized name. | D.tile, s:217-232, X |
| RAI-3 | R | Open: 236 px over the content, names in label type beside the tiles, the current one chalk. | D railOpen |
| RAI-4 | R | Focus: FOC-1 on the tile; D4 (FOC-4). | F |
| RAI-5 | P | Tile radius 12, 8 between items, 24 between the logo and the sections. | RAD-1, SPC-6 |
| HDR-1 | R | Header: the title (title type), a subtitle in label type `--ink-3` with " · " separators; controls and the status at the inline end; 24 between the two sides. | D.h1, D.sub |
| HDR-2 | R | The title names the page and matches its nav name (GLO-14). | F15 |

### 3.12 Empty state, alert and retry

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| EMP-1 | R | Empty state: an info icon (22, `--ink-3`), one sentence that names what is missing and its dates, and one way back (a secondary button); centred. | Re.tableEmpty |
| EMP-2 | R | Alert: `role="alert"`, radius 12, 1 px `--err` `.5`, 6% error fill, an error icon (17) and text in chalk that says what happened, that nothing was lost, and what is kept. | G alert |
| EMP-3 | R | Retry: one primary action ("Try again", «إعادة المحاولة»); focus moves to it; the inputs are kept. | README Reports |
| EMP-4 | P | Empty state padding 40 with a 16 gap; alert padding 12 / 16 with an 8 gap (measured 40 / 44 and 14; 12 / 14 and 10). | SPC-6 |

## 4. Owner surface

Every row here is **C**, composition: how that page arranges the shared system. None is a template. Source: the
probe frames `daily-*` and `reports-*` at 1440 (`D:\fitway-scratch\spec\work\probe\frames\`) and README "Reports".

### 4.1 Today (Daily)

| Id | L | Entry |
| --- | --- | --- |
| OWN-D1 | C | Answers "how is today going right now; busier or quieter than usual; when are the peaks". |
| OWN-D2 | C | The first screen is fixed to the viewport (at least 720 px): header, four cards, the chart; details below on request ("View details": data coverage and the minute table). |
| OWN-D3 | C | Cards: Inside now (lit, summary light), Today's peak, Entries with its usual value, Busiest time over the last 7 days. |
| OWN-D4 | C | The chart card carries the data light: today's line against the usual Wednesday, with the tooltip lane. |
| OWN-D5 | C | The first-open intro (MOT-10). |

### 4.2 Reports

| Id | L | Entry |
| --- | --- | --- |
| OWN-R1 | C | Answers "how does my gym usually behave, and which way is it going". Complete days only, so nothing on it is live. |
| OWN-R2 | C | Header: the title, the period and its length, the period control (Last 7 days, Last 4 weeks by default, Custom… opening a dialog). The period lives in the URL. |
| OWN-R3 | C | Cards: Week over week (lit, summary light), Average inside, Highest peak with its day and time, Entries with the daily average. |
| OWN-R4 | C | Busy times: the weekday × hour pattern (7 × 19, Sunday first), lit with the data light, with the numbers switch. |
| OWN-R5 | C | Day by day: the sortable table below the first screen, with the export. No intro; no rolling digits on a period change (pending step 4). |

## 5. Staff

To come (step 6, its own milestone).

## 6. Public

To come (step 7, its own milestone; mobile-first, light, no control or personal data).

## 7. Known issues register

Every entry is **K**. None is ever copied. "Step 3" is Daily at every size; "step 4" is Reports at every size.

| Id | L | What | Where | Breaks | Fix round |
| --- | --- | --- | --- | --- | --- |
| K-01 | K | Week over week ignores the chosen period and uses a rolling Wed-Tue week while the table closes weeks on Saturday; in an empty July it still shows +9% (F1) | Reports, all periods | TRU-1, GLO-13, STA-8 | step 4, after Q3 |
| K-02 | K | Loading, page-level closed, unavailable and error are not designed (F2) | every screen | STA-10 | each screen's round |
| K-03 | K | «متوسط» used for averages («المتوسط 48», «متوسط الموجودين», «متوسط كل 30 دقيقة», «متوسط 4 أيام», the column «المتوسط») (F3) | Daily, Reports | GLO-3, GLO-4 | steps 3, 4 |
| K-04 | K | Missing data named three ways: «لا قراءة» / "No reading", «لا بيانات» / "No data", «لا قراءات» / "No readings" (F4) | Daily tooltip and details, Reports pattern | GLO-5 | steps 3, 4 |
| K-05 | K | A single day's "Busiest" and cells read as certain; the busiest point has no key entry (F5) | Reports, short and 7-day periods | TRU-2 | step 4, after Q5 |
| K-06 | K | The delayed level badge keeps chalk and red bars (F6) | Daily, delayed | LVL-5 | step 3 |
| K-07 | K | Axis labels over the lit corners at 3.85-4.88:1 in `--ink-3` (F7) | Daily chart | LGT-9 | step 3 |
| K-08 | K | Spacing off the 4 px scale (SPC-7) (F8) | Daily, Reports | SPC-1, SPC-5, SPC-6 | steps 3, 4 |
| K-09 | K | Fifteen text sizes (TYP-6) and radii off the set (RAD-2) (F9) | Daily, Reports | TYP-3, RAD-1 | steps 3, 4 |
| K-10 | K | Controls and pills under 44: `#details-btn` 124.8 × 38; the header's status and concept chips 36; the legend box 38 (KI1, F13) | Daily; Reports' concept chip | BTN-1, CHP-1, `DESIGN_GUIDE` §11 | step 3 (Daily), step 4 (Reports' chip) |
| K-11 | K | Segments 36 px in a 44 px frame with radius 13 (F10, KI1) | Reports | SEG-2 | step 4 |
| K-12 | K | The Inside now light is unchanged while delayed (D1) | Daily, delayed | LGT-7 | step 3 |
| K-13 | K | The lit week card says "Not enough history yet" (short state) and shows +9% in an empty period (D1) | Reports | LGT-7 | step 4 |
| K-14 | K | "Export CSV" on the day table exports 40,320 minute rows, and its copy says "UTC" (F11) | Reports | GLO-16, truthful labels | step 4, after Q4 |
| K-15 | K | The scale changes by state and the last tick breaks the rhythm (F14) | Daily chart | CHT-11's intent | step 3, with Q2 |
| K-16 | K | The nav says «اليومي» / "Daily" on a page titled «اليوم» / "Today" (F15) | both rails | GLO-14 | step 3 |
| K-17 | K | Dates and times break across lines: "…1:00 / AM" at 1000 px, «22 سبتمبر / 2026» at 320 (F16) | Daily header, Reports | DAT-4 | steps 3, 4 |
| K-18 | K | A level badge on an all-hours average ("Average inside 21 · Quiet") (F17) | Reports | LVL-2 | step 4 |
| K-19 | K | Trend glyphs mirror inconsistently: the week card's head icon and Daily's peak icon do not (F19) | Daily, Reports | ICO-5 | steps 3, 4 |
| K-20 | K | The minute table: 13 px, 32.5 px rows, start-aligned numbers without tabular figures, "0.0" and "1.7" people (F12) | Daily details | TBL-1, NUM-2, NUM-5 | step 3 |
| K-21 | K | "Busiest" is a 2-hour window on Daily and a 1-hour cell on Reports; the peak's time sits in Reports' card foot (F20) | Daily, Reports | GLO-12, DAT-5 | steps 3, 4, after Q7 |
| K-22 | K | Focus rings at offsets 3, 2, 1 and −4; a red ring on the skip link; the plot's ring 2 px from "80" (F18) | Daily, Reports | FOC-1…3 | steps 3, 4 |
| K-23 | K | Keyboard focus on a rail item shows no name (D4) | both rails | FOC-4 | step 3 |
| K-24 | K | A bordered 34 px icon tile on every card (F21) | both pages, 8 cards | ICO-3 | steps 3, 4 |
| K-25 | K | 13 px text on red cells would be about 3.3:1 undimmed: held by the 80% dim (5.26:1 lowest) (KI4) | Reports pattern | PAT-8 guards it | none; re-measure each round |
| K-26 | K | The card headers overflow at 1024: worst 59 px (AR, "Busiest time"), a document scroll of 1046 px (AR) and 1026 px (EN); still at 1100, gone at 1280 (KI2, corrected). Below 1024 the page is not designed yet and scrolls sideways (EN: 834 px at 768, 709 px at 390) | Daily | BRK-1, BRK-5, DESIGN_GUIDE §8 | step 3 |
| K-27 | K | `#busy-note` jumps when the intro ends: 71.5 px at 600 (EN) and 390 (EN, AR); 14.7-14.8 px at 768-820 (EN); none in AR at 820, none at 900-1024 (KI3, corrected) | Daily, below 1024 | MOT-1, CRD-4 | step 3 |
| K-28 | K | Stat cards fixed at 166 px (the root of K-27) | Daily, Reports | CRD-4, `DESIGN_GUIDE` §7 | steps 3, 4 |
| K-29 | K | The rail set aside and the pattern scrolled sideways below 721 px as a placeholder | Reports | BRK-4 | step 4 |
| K-30 | K | Two amber text tones (`#F0C23C` in the header, `#E8B62E` elsewhere) | Daily, delayed | COL-16 | step 3 |
| K-31 | K | The usual line after now at `.24` chalk, 2.01:1 | Daily chart | non-text contrast 3:1 | step 3, if Q6 agrees |
| K-32 | K | A single closed cell hides its word (`.is-one`); only a 1.1:1 fill would tell it from a low value. Latent: no single closed hour occurs in the data | Reports pattern | PAT-5, `DESIGN_GUIDE` §13 (grayscale) | step 4 |

**Findings coverage.** F1 K-01; F2 K-02, STA-10; F3 GLO-4, K-03; F4 GLO-5, K-04; F5 TRU-2, K-05, Q5; F6 LVL-5, K-06, Q9;
F7 LGT-9, K-07; F8 SPC-5, K-08; F9 TYP-3, K-09; F10 SEG-2, K-11; F11 GLO-16, K-14, Q4; F12 TBL-1, K-20; F13 BTN-1,
CHP-1, K-10; F14 K-15, Q2; F15 GLO-14, K-16; F16 DAT-4, K-17; F17 LVL-2, K-18; F18 FOC-1…3, K-22; F19 ICO-5, K-19;
F20 GLO-12, DAT-5, K-21, Q7; F21 ICO-3, K-24; D1 LGT-7, K-12, K-13; D2 Q1; D3 Q2; D4 FOC-4, K-23; KI1 K-10, K-11;
KI2 K-26; KI3 K-27; KI4 K-25; Keep: SRF-1, SRF-5, LGT-6, CRD-1, PAT-1, TBL-5, DLG-1, BRK-5, BRD-1, COL-21, STA-4…8.
Review §5 (README accuracy): the segments K-11; the week-over-week empty July K-01; dialog focus Q8; the overflow note K-26;
Daily's axis contrast K-07; the delayed scope is restated in STA-2.

## 8. Open questions for the user

| # | Question | What it decides | The proposal |
| --- | --- | --- | --- |
| Q1 | **D2:** the peak ring sits at the true peak (62), about 12 px above the averaged crest, while the latest dot sits on the line (47.4) with a readout of 49. One placement rule, or a one-line key? | CHT-7, CHT-8 | none; the Daily all-sizes round (step 3) |
| Q2 | **D3 with F14:** the lane leaves an empty band at rest (about 120 px at 1440). Sizing the lane once for the tallest state (F14) makes it 109 px in every state, so the band grows while live. Keep the band, shrink it, or let the scale move by state? | CHT-11, K-15 | none; step 3 |
| Q3 | **F1:** week over week either (a) compares the last 7 days of the chosen period with the 7 before, or (b) leaves the period row, labelled "Latest week". And does "week" mean a calendar week (GLO-13)? | TRU-1, GLO-13, K-01 | (b), keeping the domain's rolling 7 days; its label then names the span ("the last 7 days"), so "week" keeps one meaning |
| Q4 | **F11:** export what the table shows (its rows), or rename the button "Export minute data" and place it by the period? | K-14 | the table's rows by the table, the minute file by the period |
| Q5 | **F5:** the minimum number of days before a cell is unqualified and "Busiest" shows. | PAT-10, GLO-12 | 3 days; so a 7-day period shows no "Busiest" |
| Q6 | The usual line after now is `.24` chalk (2.01:1). Raise it to `.36` (3.10:1), still fainter than before now (`.55`)? It touches the agreed "fainter after now". | CHT-4, K-31 | `.36` |
| Q7 | **F20:** one "Busiest" window: one hour (Reports' cell) or two (Daily's card)? | GLO-12, K-21 | one hour |
| Q8 | Dialog initial focus: the range dialog focuses its first field, the export dialog its primary action. Keep the two cases (choose → field, confirm → action) or always the first field? | DLG-3 | keep the two cases, named in DLG-3 |
| Q9 | **F6:** a delayed badge dims with its value (LVL-6), or is worded as last-known? | LVL-6 | dim it; the card is already titled "Last reading" |
| Q10 | **D1's form:** a lit card that goes stale or empty loses its light (LGT-8), or keeps a dimmed light? | LGT-8 | lose it |
