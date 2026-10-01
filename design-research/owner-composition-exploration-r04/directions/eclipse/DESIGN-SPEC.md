# Eclipse design spec

> **DRAFT. Not a reference yet.** This sheet becomes a reference only through the authority record in step 10 of
> "The design-phase plan" (`../NEXT-DIRECTION-BRIEF.md`), after the user reviews it and the tests compare it with the
> final pages. First version: run `owner_spec_r04_s12`, 2026-09-30, measured on Daily (`index.html`) and Reports
> (`reports.html`) at `31a40d6`. Second pass: run `owner_spec_r04_s13`, 2026-09-30: the user's decisions on the first
> draft (every proposed rule accepted, Q3-Q10 answered) and the numeric-column rule (TBL-1, TBL-11…13). Third pass: run
> `owner_spec_r04_s14`, 2026-09-30: the user's rule for a row with no readings (TBL-12). Fourth pass: run
> `owner_spec_r04_s15`, 2026-09-30: the middle dot between the words and the range (Q11, TBL-12). Fifth pass: run
> `owner_spec_r04_s16`, 2026-10-01: the range first, then the mark and the words, replacing the middle dot (Q11,
> TBL-12). Sixth pass: run `owner_daily_r04_s17`, 2026-10-01, step 3 phase A: the frame (navigation and header at
> every size, §1.11, §3.11, §3.13), pending the user's review. Seventh pass: the same run, step 3 phase B: the user's
> decisions on the frame (one section order, Monitoring in the phone's menu, Operations through the status details, the
> bar's «النشاط» / "Activity"; `user 2026-10-01`), the Daily page at every size (§4.1), every step-3 known issue fixed
> on Daily (§7), and proposals for Q1 and Q2 (§8), built on Daily so they can be seen. Eighth pass: run `owner_spec_r04_s18`,
> 2026-10-01: the user's decisions on step 3 phase B (Q1, Q2, the tooltip width, OWN-D2), and phase B named as
> `637b285`. Ninth pass: run `owner_states_r04_s19`, 2026-10-01, step 3's second part: Daily's states, loading, closed,
> unavailable and error, at every size (STA-10…14, §3.14, CRD-10, CHT-21, EMP-5, HDR-6, LGT-11, MOT-13, BTN-9,
> OWN-D10); K-02 done on Daily; and two repairs (the path in `user 2026-10-01`, the legend specimen's caption on the
> components page). It grows with every screen.
> `components.html` renders every component below in its rule form.

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
| **P** Proposed rule | A value the pages do not show yet. Pending the user's review; the components page shows it marked "proposed". None is pending since the user's review of 2026-10-01. |

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
| `A` | Probe `D:\fitway-scratch\spec\work2\probe-page-tables.mjs` → `page-tables.json` (run `owner_spec_r04_s13`): the text boxes of each numeric column's header and numbers, and of each note that spans columns, in Daily's minute table (`live`, details open) and Reports' day table (default and `short`), AR and EN, at 1440, 1024, 768 and 390. |
| `B` | Probe `D:\fitway-scratch\spec\work3\probe-page-norows.mjs` → `page-norows.json` (run `owner_spec_r04_s14`): every row with no readings in Daily's minute table (`live` and `delayed`, details open) and Reports' day table (default, `short` and last 7 days), AR and EN, at 1440, 1024, 768 and 390: its cells, their spans, the column its words sit under, and its height. |
| `s:n` `r:n` `a:n` `rj:n` | Line `n` of `style.css`, `reports.css`, `app.js`, `reports.js` at `31a40d6`. |
| `user 2026-09-30` | The user's decisions on the first draft: every `P` entry accepted (now `R`), Q3-Q10 answered with the sheet's proposal (§8, "Answered 2026-09-30"), the user's note on numeric columns (TBL-1), the user's rule for a row with no readings (TBL-12), and the middle dot between its words and range (Q11, TBL-12), since replaced (`user 2026-10-01`). |
| `Fr` | Probe `D:\fitway-scratch\daily\work\probe-frame.mjs` → `frame-e.json` (run `owner_daily_r04_s17`, step 3 phase A): the frame at 1440, 1024, 768, 390 and 320, AR and EN (what shows, its boxes, the Tab order and every stop's ring, the bar's labels and ring clearances), the keyboard of each open layer, and loads over HTTP and `file://`. |
| `Kb` | Probes `D:\fitway-scratch\daily\work\probe-k.mjs` (every step-3 known issue, run on `9074da6` and on phase B), `probe-b.mjs` (98 page states: 1440, 1280, 1024, 768, 390, 320 and 720 × 450, the 200% zoom, AR and EN, live, delayed, no history, details, tooltips and open layers: sideways scroll, clipping, layout shift, AA contrast from rendered pixels, 44 px targets) and `probe-ring.mjs` (every Tab stop's ring at every size), run `owner_daily_r04_s17` phase B. |
| `St` | Probes `D:\fitway-scratch\daily\states\work\` (run `owner_states_r04_s19`): `arrival.mjs` → `arr2\arrival.json` (loading arrives into live: every box before and after, the layout shifts, the arrived page against `?state=live`, and the intro's arrival with motion on), `matrix.mjs` → `matrix.json` (132 page states: the four states, their tooltips, layers and retry at 1440, 1024, 768, 390, 320 and 720 × 450, AR and EN: sideways scroll, clipping, 44 px targets, AA contrast from rendered pixels, and what each state shows), `behave.mjs` → `behave.json` (the loading timeline, the error's focus and retry, keyboard, reduced motion, and loads over HTTP and `file://`), `measure1.mjs` → `measure1.json` (boxes and ink bands), `s5.mjs` (live, delayed, no history and Reports against `527c159`). |
| `user 2026-10-01` | The user's choice of option د, «المدة أولًا», in the four-option mockup `D:\fitway-scratch\spec\gapmock\index.html`: the range first, then the mark and the words (Q11, TBL-12). The user's decisions on the frame of step 3 phase A: one section order everywhere (RAI-1, BAR-6), Monitoring in the phone's menu (MNU-2), Operations through the status details (BDG-4), and «النشاط» / "Activity" as the bar's named exception (GLO-18). The user's decisions on step 3 phase B (`637b285`): the ring key «قراءة الذروة» / "Peak reading" in the legend (Q1, CHT-20), one 107 px lane for every state with the time axis's one rhythm (Q2, CHT-18, CHT-19), Daily's 130-131 px tooltip width by CHT-12's formula rather than 127 px, and the first screen fixed to the viewport only at 1200 px and wider, growing past it below with the chart keeping 440 px (OWN-D2, OWN-D6). |
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
| COL-22 | K | amber text | the header's delayed word is `#F0C23C`, beside `#E8B62E` elsewhere; one delayed text colour (COL-16). Fixed in step 3 phase A (`d76972c`) | K-30 | s:265; Fr |
| COL-23 | R | production mapping | COL-9…16 equal `DESIGN_GUIDE` §14's `--fw-*` values; the stale grey `#8F898B` differs from `--fw-offline #9AA0AA` and is reconciled in step 10 (concept values are free under the guide's concept scope) | tokens | `DESIGN_GUIDE` §14 |

### 1.2 Surfaces and glass

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| SRF-1 | R | Card: `--card`, 1 px `--line`, radius 24, `backdrop-filter: blur(18px)`, no shadow. | D.stat |
| SRF-2 | R | Rail: `rgba(12,12,15,.7)`, blur 22, 1 px `--line`; open: `.94` and shadow `0 30px 80px rgba(0,0,0,.6)`. | D.rail, s:182-186 |
| SRF-3 | R | Tooltip: `rgba(15,14,15,.92)`, blur 10, 1 px `rgba(255,255,255,.14)`, radius 12. | T.tip |
| SRF-4 | R | Dialog: panel COL-4, 1 px `--line-2`, radius 24, shadow `0 40px 100px rgba(0,0,0,.7)`; scrim `rgba(4,4,5,.66)`, blur 3. | G.panel, G.scrim |
| SRF-5 | R | Plate: an opaque `#0F0E0F` layer, radius 16, under any colour that carries data inside a lit card, so the light never changes a data colour. | R.plate, Keep |
| SRF-6 | R | Shadows only on things that float (the open rail, the phone's bar, the header's panels, the dialog). Cards never carry one. No nested cards; separators and alignment before boxes. | `DESIGN_GUIDE` §3; step 3 |
| SRF-7 | R | The phone's bar (BAR-1): the rail's glass a little denser, `rgba(12,12,15,.8)`, because content always passes under it; blur 22, 1 px `--line`, radius 24, shadow `0 16px 48px rgba(0,0,0,.55)`. | Fr; step 3 |
| SRF-8 | R | A panel that opens from the header (the status details, BDG-3; the menu, MNU-1): the open rail's surface, `rgba(12,12,15,.94)`, blur 22, with a firmer 1 px `--line-2` edge (it floats over content), radius 16, the open rail's shadow. | Fr; step 3 |

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
| LGT-8 | R | D1's form: the card is drawn as a plain card while its content is not current; the light returns with a live or complete value. It never keeps a dimmed light (Q10). | components.html; Q10; user 2026-09-30 |
| LGT-9 | R | **F7.** Text in a lit zone uses `--ink-2` or brighter, never `--ink-3` (measured `--ink-3` over a lit corner: 3.85-4.88:1). | F7 |
| LGT-10 | R | The rail's rim catches the page wash where it sits in it. | s:187-199 |
| LGT-11 | R | **The states (step 3's second part).** Loading, closed, unavailable and error light no card: both lights are out (LGT-7, LGT-8), so the brightest thing is never a placeholder, a closed day, a missing count or an error. The page wash stays in every state: it is the page's, not a value's. A light that returns with a live value comes on at once at the arrival, never fading (LGT-1). | St; user 2026-09-30 (LGT-8) |

### 1.4 Type

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| TYP-1 | R | Readex Pro, self-hosted from `fonts/`, weights 400 and 500 only (one variable file per subset, shared by both weights), fallback `"Segoe UI", system-ui, sans-serif`. Cairo is excluded. | s:22, fonts/readex-pro.css |
| TYP-2 | R | Loading: the blocking font stylesheet, then `document.fonts.load` for both weights; each font file is fetched at most once per load, over HTTP and from `file://`. | index.html:20-29 |
| TYP-3 | R | **The scale (F9): six sizes with named roles.** | below; user 2026-09-30 |
| TYP-4 | R | Line height 1.5 for text, 1.6 for dialog text, 1.2 for the page title, 1 for a display value, 1.25 inside a tooltip. | D.h1, D.valueNum, T.tip, G.dlgDesc |
| TYP-7 | R | Every text is set by role (display, title, heading, body, label, caption). Entries below name the role; the role's size is TYP-3 (accepted 2026-09-30), which the pages take in steps 3 and 4 (K-09). | this sheet; user 2026-09-30 |
| TYP-5 | R | Letter spacing 0; never negative, never on Arabic. Only the Latin wordmark is tracked (.12em). | s:240 |
| TYP-6 | K | Rendered today: 10, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 19, 20, 30, 38 and 46 px (15 sizes; the review counted 13 and missed 16, the export "ready" title, and 20, the tooltip value). Daily since step 3 phase B (`637b285`): 46, 30, 19, 15, 13.5 and 12 (the six roles; measured with the details open and a tooltip shown, 11.5, 12.5, 13, 14, 20 and 38 are gone); Reports until step 4. | N, T.tipV, G.doneTitle; Kb |

TYP-3, accepted (user 2026-09-30):

| Role | L | Size / line | Weight | Takes over (measured today) |
| --- | --- | --- | --- | --- |
| display | R | 46 / 46 | 500, tabular | card values (46) |
| title | R | 30 / 36 | 500 | page title (30); a value written in words, such as a time range (38) |
| heading | R | 19 / 28.5 | 500; 400 for a sentence in a card | card, section and dialog titles (19); tooltip value (20); card empty sentence (19) |
| body | R | 15 / 22.5 | 400 or 500 | field text (15); tooltip word in place of a value (14); "ready" title (16); wordmark (15) |
| label | R | 13.5 / 20 | 400 or 500 | buttons (13.5), segments (13), header chips (13), table cells (13, 13.5), card labels (14), rail names (14), field labels (13), dialog text (13.5), alerts (13), subtitle (13.5), pattern day names (13), skip link (14) |
| caption | R | 12 / 18 | 400 or 500 | meta, notes, badges, legends, table headers, hints and errors (12.5), axes and tooltip rows (12), flags (11), coverage axis (11.5), pattern cell numbers (13, w500), key glyph (10) |

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
| SPC-5 | R | **Gutters and paddings (F8):** one 16 px gutter between cards and sections in both directions; stat card padding 20; section card padding 24 (the chart card's bottom 16 is an optical exception: the time axis's 18 px line box brings its own space); dialog inset 24, with the close button's side at 12 so its glyph lines up with the 24 px content edge. | F8; user 2026-09-30 |
| SPC-6 | R | **Small gaps:** 8 between an icon and its text, between buttons, between rail items, and between a label and its field; 16 between a card's head and its value (today 14, with the icon tile that F21 removes); 16 inside a legend. Controls, table cells and fields pad their text 16 at the inline sides; badges 8. | F8; user 2026-09-30 |
| SPC-7 | K | Daily is on the scale since step 3 phase B (`637b285`) (gutter 16, card padding 20, section 24 with the chart's 16 bottom, head to value 16, meta gap 8, subtitle 4, badge padding 8, cells 16, the rail 8 and 24); what follows is Reports' until step 4. Off-scale today: gutter 18 down (16 across); card padding 18 × 20; section padding 22 × 26 with bottoms 16, 10, 22 and 24; rail gap 10 and brand gap 26; meta gap 7; head to value 14; subtitle 6; field gaps 7 and 10; control and cell padding 14; badge padding 10; alert and file line 12 × 14 and 11 × 14; dialog foot 20 and gap 10; heat plate padding 2 × 4; skip link 8 × 14. | D.*, R.*, G.* (K-08) |

### 1.7 Radii, borders, elevation

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| RAD-1 | R | Five radii: 24 surfaces (card, rail, the phone's bar, dialog, sheet's top); 16 plates, scroll regions, the header's panels and the bar's items (24 less the bar's 8 inset); 12 controls, tooltips, keys and alerts, menu items, the rail tile (14 until step 3) and the bar's tile; 8 badges, pattern cells and the rail's focus label; 4 flags and swatches (today 5 and 3); full for dots, the switch and round marks. | D.*, R.*; user 2026-09-30; Fr |
| RAD-2 | K | Off the set today: the segmented control 13 (F13); rail tiles and the minute scroller 14; the icon tile, segments, sort headers and the skip link 10; flags 5. Daily since step 3 phase B (`637b285`): 24, 16, 12, 8, 4 and full only (the rail's tiles 12 since phase A, both rails); Reports' segments, sort headers and flags until step 4. | r:51, r:59, r:223, s:223, s:589 (K-09) |
| BRD-1 | R | One border tint per role: `--line` for surfaces, `--line-2` for controls, `--line-3` on hover; a table row line is `.055`, a week edge `.14`. Borders are 1 px. | Keep, r:196, r:206 |
| BRD-2 | R | Elevation is the glass order: page, wash, cards and the tooltips inside them, the rail's scrim (721-1023 px), the open rail, the header's panels, the phone's bar, the dialog. Only the open rail, the bar, the header's panels and the dialog carry a shadow (SRF-6). | s:182-186, r:266; Fr |

### 1.8 Icons

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| ICO-1 | R | Drawn SVG on a 24 grid, stroke 1.6-1.8, round caps and joins, `currentColor`, no fill except dots. | s:228, r:87 |
| ICO-2 | R | An icon is sized by the text beside it: 13-15 with caption text (meta, badges, tooltip rows, errors), 16-17 with label text (buttons, notes), 18 in an icon button, 21 in the rail, 22 in an empty state. | s:228, s:306, s:553, r:87, r:95, r:233, r:300 |
| ICO-3 | R | **F21:** an icon beside a label sits in the flow, 16 px in the label's colour, 8 px before it, with no tile box. | F21; user 2026-09-30 |
| ICO-4 | K | Every card draws its icon in a bordered 34 px tile (8 cards; `icon-tile-stack`). Daily's four since step 3 phase B (`637b285`): 16 px in the flow (ICO-3); Reports' four until step 4. | s:290-300 (K-24); Kb |
| ICO-5 | R | **F19:** glyphs that show time or direction mirror in Arabic (trend arrows, entry and exit arrows, sign out, chevrons that point along the reading line). Clocks, the logo, check marks and info marks never do. | F19, `DESIGN_GUIDE` §9 |

### 1.9 Focus

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| FOC-1 | R | **F18: one ring.** 2 px chalk `#F5F3F2` at a 3 px offset on every interactive element (17.47:1 on a card, 4.20:1 over FITWAY red). | s:86, F, X |
| FOC-2 | R | The inset variant, for controls packed edge to edge (segments, sortable headers, pattern cells, the items of a header panel, MNU-3): 2 px chalk at −4 px. The phone bar's items keep FOC-1: 8 px apart, their rings stay at least 4.6 px from a neighbour's name at 320 (BAR-5). | r:226, F18; Fr |
| FOC-3 | R | At least 4 px between the ring and any other content. Focus is never hidden behind sticky elements. | F18, `DESIGN_GUIDE` §13 |
| FOC-4 | R | **D4:** a collapsed rail item shows its name on keyboard focus only; the mouse hover keeps its tile state and shows no tooltip. | D4 (accepted) |
| FOC-5 | R | D4's form: the name in a tooltip-look label (SRF-3, radius 8, 32 px, label type), 12 px beyond the tile on its inline end, centred on it. Like any tooltip it floats over the first 70-110 px of content beside the rail while the item has focus (over part of the first card's value, or the page title beside the logo) and moves nothing; no placement within the rail keeps a readable name (step 3 phase B looked: the rail is 80 px, the tile 48), so it stays. | components.html; user 2026-09-30; Kb |
| FOC-6 | K | Offsets 3, 2, 1 and −4 today, and a red ring on the skip link; the chart's ring is 2 px from its "80" label. Daily's skip link has the one ring since step 3 phase A (HDR-5); since phase B (`637b285`) every Daily stop has 2 px chalk at 3 px (−4 on menu items), the plot's ring sits 4 px from the scale's labels and the minute table's region ring at 3 px. Reports' offsets and red skip ring until step 4. | F (K-22); Fr; Kb |
| FOC-7 | R | On a phone, focus and in-page jumps stop clear of the bar (`scroll-padding-bottom`: the bar, its inset and 16 px), and the minute table's region is never taller than the screen above the bar, so a focused element's ring is always seen (FOC-3). | Kb; step 3 | for controls packed edge to edge (segments, sortable headers, pattern cells, the items of a header panel, MNU-3): 2 px chalk at −4 px. The phone bar's items keep FOC-1: 8 px apart, their rings stay at least 4.6 px from a neighbour's name at 320 (BAR-5). | r:226, F18; Fr |

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
| MOT-12 | R | The frame (step 3): at 721-1023 px the rail opens as MOT-8 and its scrim (no text) fades in and out with it; the header's panels (status details, menu) and the bar change at once, like a tooltip | 240 / 200 ms (scrim); 0 (panels) | as MOT-8 | Fr |
| MOT-13 | R | **Loading and the intro.** The skeleton never moves, in every motion setting (MOT-1, LGT-1): no shimmer, sheen or pulse; the header's words say it is loading. On a tab's first open the intro (MOT-10) is the arrival: it waits while the first payload loads, and when the payload arrives the answers roll into their own slots and the line draws into the frame that was already there; it never plays over the skeleton, and nothing jumps (layout shifts 0 through the intro at every size; its end equals `?state=live`). The lights and the usual line appear at the arrival, at once. A first payload that fails leaves the intro for the first successful retry. Reduced motion and `?motion=off`: the arrival is instant. | | | St |

### 1.11 Breakpoints and navigation

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| BRK-1 | R | Designed: 1440×900, 768×1024, 390×844. Checked so nothing breaks: 320, 1024 and 200% zoom. No document-level horizontal scroll at any width. | plan §2, `DESIGN_GUIDE` §8 |
| BRK-2 | R | Desktop (1024 px and wider, 1024 included): the slim icon rail, unchanged but for step 3's fixes (RAI-5, FOC-4, FOC-5, GLO-14): the logo opens it over the content without a scrim, and it closes when keyboard focus leaves it (RAI-7). | plan §3; Fr |
| BRK-3 | R | Tablet (721-1023 px, 768 designed): the same slim rail, sticky, the full height; the logo opens it over the content as a modal layer (RAI-6); content reflows to two columns. | plan §3; Fr |
| BRK-4 | R | Phone (720 px and below): the glass bar at the bottom (BAR-1…6) with five items in this order: Today, Reports, Activity log, Access, Settings, each with a short name under its icon; the compact header (HDR-4) with the Operations status as a badge that opens its details (BDG-1…4) and one menu for the language and sign out (MNU-1…4); page controls under the title at full width; no hamburger. The rail is not rendered. | plan §3; Fr |
| BRK-5 | R | Four summary cards go two by two below 1200 px (Daily too since step 3 phase B (`637b285`); K-26). | Keep, r:32-34, W; Kb |
| BRK-6 | R | At 720 px and below a dialog becomes a bottom sheet and a table recomposes before it scrolls (fold secondary columns into the row; only then a labelled, keyboard-scrollable region with a sticky first column). | r:338-380, README Reports |
| BRK-7 | K | Reports sets the rail aside below 721 px and scrolls its pattern sideways only to avoid overflow: a placeholder, not a phone design. | r:334-351 (K-29) |
| BRK-8 | K | Daily's header overflows at 1024 (KI2) and its busy note jumps below 1024 (KI3). Fixed in step 3 phase B (`637b285`): 0 px spill and 0 px sideways scroll at 1024, 1100 and 1200; the busy note moves 0 px at the intro's end at every width (K-26, K-27). | W (K-26, K-27); Kb |
| BRK-9 | R | Below 1024 the frame is a rule (BRK-3, BRK-4, BRK-10…12). Each page's content at 768, 390 and 320 is composed in its own round: Daily's in step 3 phase B (provisional until then), Reports' in step 4. | plan §5; Fr |
| BRK-10 | R | **The frame's breakpoints:** 1024 px and wider, the desktop frame; 721-1023 px, the tablet frame; 720 px and below, the phone frame. 720 is where `DESIGN_GUIDE` §8's mobile band ends and where a dialog becomes a bottom sheet (BRK-6), so 200% zoom at 1440 (720 CSS px) gets the phone frame. Crossing a breakpoint closes whatever the frame has open. | `DESIGN_GUIDE` §8; Fr |
| BRK-11 | R | A page takes the frame by opting in (`body[data-frame]` in the concept), so the frame's phone and tablet rules never reach a page still being composed: Daily since step 3; Reports in step 4, when its placeholder (BRK-7) goes. | Fr |
| BRK-12 | R | The frame never causes a document-level sideways scroll: measured 0 px at 390 and 320 and at 768, AR and EN; the bar and the header's panels stay inside the viewport at 320. | Fr |

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
| GLO-12 | R | busiest (F20; Daily since step 3, K-21): the one-hour slot (Q7), on the hour, with the highest average inside across the days named beside it, shown only when its slot averages 3 days or more (Q5), so a 7-day period shows none; user 2026-09-30 | الأكثر ازدحامًا · أكثر الأوقات ازدحامًا | Busiest · Busiest time | a 2-hour window on one page and a 1-hour one on another |
| GLO-13 | R | week (F1): a calendar week, Sunday to Saturday (as the table and the pattern already are); a rolling span is named by its span, "the last 7 days", never "week" (Q3, TRU-7; user 2026-09-30) | أسبوع · آخر 7 أيام | week · the last 7 days | two meanings of "week" |
| GLO-14 | R | nav names equal page titles (F15) | اليوم · التقارير · سجل النشاط · الوصول · الإعدادات | Today · Reports · Activity log · Access · Settings | «اليومي» / "Daily" beside a page titled «اليوم» / "Today" |
| GLO-15 | R | the concept label, visible on every concept page | مفهوم استكشافي · بيانات افتراضية | Exploration concept · synthetic data | |
| GLO-16 | R | jargon stays out of the copy (F11): "UTC" lives in the file, not in a sentence | | | «UTC», "UTC" in copy |
| GLO-17 | R | each language written naturally for itself (`DESIGN_GUIDE` §4) | فصحى مبسطة، بلا ترجمة حرفية | plain English, not a mirror of the Arabic | transliteration, word-for-word copy |
| GLO-18 | R | the phone bar's short names (BAR-3): the page's name, or the word of it that fits under an icon at 320; the full name stays the accessible name, which contains the short one. «النشاط» / "Activity" is a named exception to GLO-14 for the phone bar only: «سجل النشاط» / "Activity log" stays the accessible name and the page title everywhere (user 2026-10-01) | اليوم · التقارير · النشاط · الوصول · الإعدادات | Today · Reports · Activity · Access · Settings | a short name that is not a word of the page's name |
| GLO-19 | R | the frame's own words: the logo's focus name, the status details' title, the phone menu's name | أسماء الأقسام · حالة التشغيل · المزيد | Section names · Operations status · More | «القائمة» / "Menu" for a menu that holds no sections |

### 2.2 Dates, times and ranges

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| DAT-1 | R | Gym time (Riyadh), 12-hour clock: Arabic «ص/م», English AM/PM. | `FITWAY_PRODUCT.md`, a:144-151 |
| DAT-2 | R | Day before month: «الأربعاء 23 سبتمبر 2026» / "Wednesday, 23 September 2026"; short "Thu 17 Sep". | D.sub, R.td |
| DAT-3 | R | Arabic ranges use the en dash, like English: «16 – 22 سبتمبر», «6–8 م». An unspaced range is isolated LTR and joined after the dash, so its order and its line stay as before. English: "16 – 22 Sep", "6–8 PM". Date ranges are spaced, hour ranges are not. | R.statMeta, T.gap; user 2026-10-01 (en dash) |
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
| LVL-6 | R | F6's form: the badge dims with the value: word `--ink-2`, lit bars in stale grey `#8F898B`, no red (Q9: dimmed rather than worded as last-known; the card is already titled "Last reading"). | components.html; Q9; user 2026-09-30 |

### 2.4 State grammar

| Id | L | State | Treatment | Designed on |
| --- | --- | --- | --- | --- |
| STA-1 | R | Live | green dot and "Live · Last reading 7:42 PM"; values in chalk; the live pulse | Daily; D.status |
| STA-2 | R | Delayed | amber clock and "Delayed · Last reading 7:29 PM"; the card titled "Last reading" with "13 min ago" in amber; value `--ink-2`; the end point grey, no halo, no pulse; the badge qualified (LVL-5); both lights out (LGT-7, LGT-8): Inside now's light and the chart card's data light | Daily; Dd (the light and the badge: K-12, K-06); user 2026-10-01 (review F2) |
| STA-3 | R | No history | the comparison is left out and an honest note takes its place ("Not enough history to compare yet"); no usual line | Daily, Reports; Dn.key, Rs.statEmpty |
| STA-4 | R | Missing | the dotted mark (a dashed box only as its area form in the pattern); "No readings" with its range; in a table, one full-width row (TBL-12); its own keyboard stop; never bridged or filled | Daily, Reports; T gap, R.hcNoData (the words: K-04); the table row: user 2026-09-30 |
| STA-5 | R | Genuine zero | an outlined "0" and "Empty"; distinct from missing and closed in pixels and in text | Daily, Reports; R.hcZero |
| STA-6 | R | Closed slot | a neutral flat fill with "Closed" written in it, even in a single cell; runs merged | Reports; R.hcClosed (a single cell: K-32) |
| STA-7 | R | Still ahead | the usual line fainter and dashed; a hollow chalk ring; "Still ahead" | Daily; T ahead |
| STA-8 | R | Empty period | "No readings" in every figure, and one way back | Reports; Re (except week over week: K-01) |
| STA-9 | R | Working (an action) | the button says "Preparing…" at once and is disabled, `aria-busy`; a progress line after 300 ms; shown for at least 400 ms | Reports export; README Reports |
| STA-10 | R | Loading | the first payload is resolving (DESIGN_GUIDE §6, approved 2026-09-30). **0-300 ms:** the value slots keep their space, empty; a payload that arrives in time fills them directly (measured: arrival at 151 ms, no skeleton). **From 300 ms:** the skeleton (PH-1…3; shown at 307-312 ms), static; the header's status reads «جارٍ التحميل…» / "Loading…" (STW-2). **At least 400 ms** once shown (an arrival asked for at 500 ms lands at 716 ms, 409 ms after the skeleton). **One announcement at 1000 ms** if still loading, «جارٍ تحميل قراءات اليوم» / "Loading today's readings", from a polite region in the header (never inside a busy region); the arrival then says the figures once. **aria-busy** on the cards and the chart until their content arrives. No light (LGT-11); no green dot, pulse, count, level, time, line or end point; the chart is an empty frame (CHT-21); View details disabled (BTN-4). **Arrival into live, zero shift:** of 95-99 boxes present before and after, the largest movement is 0.00 px and the layout shifts sum to 0 at 1440, 1024, 768, 390, 320 and 720 × 450, AR and EN, with reduced motion and with the intro (MOT-13); the arrived page equals `?state=live` but for one colour level inside the header status's own box at 1440 AR and 768 (raster, max channel delta 1). **The ceiling:** a load that reaches 10 s becomes Error (STA-13; measured 10013 ms) | Daily, step 3; St |
| STA-11 | R | Closed (page) | the gym is closed now, before today's opening (the concept: 5:12 AM; closing is 1:00 AM, so a closed hour always falls before the day's opening). Header «مغلق · يفتح 6:00 ص» / "Closed · Opens 6:00 AM" with a hollow ring (STW-1); Inside now says «مغلق» / "Closed" as a value in words and «يفتح 6:00 ص» / "Opens 6:00 AM" at its foot (CRD-10); Today's peak and Entries «لم يحن بعد» / "Still ahead" (GLO-8: the day is ahead, never a zero, GLO-7); the busiest time over the last 7 days stays (history, not a reading; its basis is 6 full days: 6-7 PM, average 50); the chart is the usual line alone, at its after-now strength (.36), with a stop every half hour, all still ahead (CHT-21). No count, level, time or light; View details disabled. Next opening on another day: «يفتح الخميس 6:00 ص» / "Opens Thu 6:00 AM" (DAT-2's short day); not known: the note is left out and its line kept (CRD-9) | Daily, step 3; St |
| STA-12 | R | Unavailable | there is no usable reading (SPEC: no projection, no usable device, or a disabled device). The status word is «غير متصل» / "Offline" (SPEC's own name for this state; "Unavailable" does not fit the phone's badge at 320 in English, STW-1), with «لا عدّ حاليًا» / "No current count". Inside now says «لا عدّ حاليًا» / "No current count" and «تحقّق من حالة التشغيل» / "Check the Operations status" (CRD-10; Operations is in the rail, and through the badge's details on a phone, BDG-4); Today's peak and Entries «قيد الانتظار» / "Pending" (no number; the card says "Pending" because the whole-day answer waits on readings not received yet, and the full gap words, «بانتظار القراءات» / "Waiting for readings", do not fit the 390 card: 128 px in Arabic and 186 px in English against a 129 px slot); the busiest time stays (history). The chart (concept: the edge went offline after its last reading at 3:00 PM; now stays 7:42 PM): today's real readings from opening to 3:00 PM, exactly the live demo's line for that span (same colour, width and fill, and its 2:14-2:31 PM missing span), drawn plain: no end point, halo, pulse, peak ring or tag, and no hairline at or after 3:00 PM, so nothing marks 3:00 PM as "latest"; then the missing span's dotted mark from 3:00 PM to now with one stop, «3:00 م – 7:42 م، بانتظار القراءات» / "3:00 PM – 7:42 PM, Waiting for readings", where focus starts; the usual line before (.55) and after now (.36), throughout the day. The earlier readings are real history (FITWAY_PRODUCT forbids only a count, a band or a fabricated last-updated time); the line ends plain so nothing reads as a current reading; the gap is "not received yet", because SPEC's edge buffers offline and backfills, and on reconnect it fills and the page returns to live. No count, level, time or light anywhere: no "Last reading" in the header, the badge, its details or the chart. View details disabled | Daily, step 3; user 2026-10-01 (proposal 4); St |
| STA-13 | R | Error | the first payload could not be loaded, or the load reached the 10 s ceiling; a refresh that fails is not an error (DESIGN_GUIDE §6: the last value stays and follows Delayed). Header «خطأ · تعذّر التحميل» / "Error · Couldn't load", the word in `--err` with the alert mark (STW-1); the badge's details add «تعذّر تحميل قراءات اليوم. تحقّق من الاتصال، ثم أعد المحاولة.» / "Couldn't load today's readings. Check the connection, then try again.". No reading is kept: the cards keep their names only; Inside now holds the alert and the one retry (EMP-5), which takes focus; the chart is an empty frame and its keyboard stop is set aside (CHT-21); no light; View details disabled. One announcement (the alert). The retry runs as an action (STA-9, BTN-9): «جارٍ المحاولة…» / "Trying again…", focus kept; it arrives into live (focus to the figures, one announcement of them, the intro on a first open) or fails back to Error | Daily, step 3; St |
| STA-14 | R | One skeleton, five truths | every Daily state keeps the page's places and heights: the header, the four cards and the chart (CRD-9), so a state's arrival or change moves nothing. Measured in all seven states (live, delayed, no history and the four above), AR and EN: the cards 166, 166, 166, 166 px and the chart 601.75 at 1440; 166, 166, 158, 158 and 440 at 1024; 166, 166, 158, 158 and 551.75 at 768; 166, 188, 188, 148 and 498 at 390; 166, 166, 158, 148 and 542.5 at 320; the header 60.25 px (90.25 on a phone). A state writes into the slots (CRD-10, PH-1…3) and the status's own box (HDR-6); it never adds a line | Daily, step 3; St |

### 2.5 Truthfulness

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| TRU-1 | R | **F1:** every figure in a period-bound row answers for the chosen period, or leaves the row and names its own dates. An empty period says "No readings" in every figure. "Week" has one meaning (GLO-13). | F1 |
| TRU-2 | R | **F5:** a figure states its basis (the subtitle says how many days); a cell drawn from too few days is qualified; "Busiest" is hidden below the minimum; every mark on the pattern has a key entry. The minimum is 3 days (Q5; PAT-10, GLO-12). | F5; Q5; user 2026-09-30 |
| TRU-3 | R | **F6 and D1:** nothing stale looks live; stale values and their level read as last-known; the brightest thing is never stale, unavailable or empty. | F6, D1 |
| TRU-4 | R | The line is shape-preserving: a centred 30-minute average cut at opening, at a gap and at the latest reading; zero stays zero; the marker sits on what its tooltip describes; the latest stop shows the reading, never an average. | README "Line", a:661-678 |
| TRU-5 | R | A comparison shows only for a clear difference (the week chip at 5% or more), and only when both sides have readings for 80% of their open minutes. | README Reports |
| TRU-6 | R | Capacity is never shown, and nothing is a percentage of it. | brief, `FITWAY_PRODUCT.md` |
| TRU-7 | R | **Q3 (b):** the week comparison leaves the period row. It keeps the domain's rolling 7 days (the last 7 complete days against the 7 before them) and its label names that span and its dates ("Last 7 days" / «آخر 7 أيام»), never "week", so "week" keeps its one meaning (GLO-13). It follows TRU-5 and LGT-7. | Q3, F1; user 2026-09-30 |

## 3. Components

`components.html` shows each one in each designed state, in its rule form, AR and EN.

### 3.1 Card and lit card

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| CRD-1 | R | Surface SRF-1. Anatomy: head (icon, label, meta at the inline end), value, then a badge or a note at the foot, pinned to the bottom. | Keep, D.stat |
| CRD-2 | R | Label `--ink-2`; meta caption `--ink-3` holding the "when" (DAT-5); value display type, chalk, with a unit in caption `--ink-3` on its baseline; note caption `--ink-3`; stale value `--ink-2`. | D.statLabel, D.statMeta, D.valueNum, D.unit, Dd.valueNum |
| CRD-3 | R | Empty content: one sentence ("No readings", "Not enough history yet") in heading type at weight 400, `--ink-2`, and one caption note with the basis. | Rs.statEmpty, Re.statEmpty |
| CRD-4 | R | Cards size to their content; cards in one row stretch to the tallest. | `DESIGN_GUIDE` §7 |
| CRD-5 | K | Stat cards are fixed at 166 px, which is why Daily's busy note pushes out of its card (KI3). Daily's since step 3 phase B (`637b285`): content-sized (natural 166, 166, 158 and 148 px at 1440, the row stretched to the tallest); Reports' until step 4. | s:282 (K-28); Kb |
| CRD-6 | R | Lit card: a card plus the summary or data light (LGT-3), with its text under LGT-9. | s:399-464 |
| CRD-7 | R | Stat padding 20 (SPC-5); head 20 px (the icon in the flow, ICO-3), 16 to the value, at least 16 to the foot. | components.html; user 2026-09-30 |
| CRD-8 | R | Designed states: live (lit or plain), delayed (plain, qualified), no readings, not enough history (plain); on Daily also loading, closed, unavailable and error (plain; STA-10…13, CRD-10). | Dd, Rs, Re; St |
| CRD-9 | R | A card keeps its height in every state: an empty note keeps its line (34 px with its 16 above), and a phone's paired cards share their head's height, so a later loading skeleton can match each card with zero shift (`DESIGN_GUIDE` §6). | Kb; step 3 |
| CRD-10 | R | **A card's slots in the states.** The value's line keeps 46 px (a value in words 36), the foot 42 (16 + the badge's 26), a note 34 (16 + 18); the value's line, the foot and the note span the card's width (their contents stay at the start), so a slot's box never moves when what fills it changes. In them: a value in words in title type at 500, chalk («مغلق» / "Closed"); a sentence in heading type at 400, `--ink-2`, on the value's line (CRD-3's form: «لم يحن بعد» / "Still ahead", «قيد الانتظار» / "Pending" (Unavailable's peak and entries), «لا قراءات» / "No readings", «لا عدّ حاليًا» / "No current count"); a note in caption type `--ink-3` at the foot, on the last line, level with the other cards' notes («يفتح 6:00 ص» / "Opens 6:00 AM", «تحقّق من حالة التشغيل» / "Check the Operations status"). A state hides the value, its unit and its meta (the "when") rather than emptying them, so a value that comes back is a new box. | St |

### 3.2 Chart card

| Id | L | Part | Values | Src |
| --- | --- | --- | --- | --- |
| CHT-1 | R | Card | lit with the data light; title in heading type; legend and "View details" at the inline end; the plot 12 px below | D.chart, D.chartH2 |
| CHT-2 | R | Today's line | 3 px `#FF2946`, round caps and joins; a centred 30-minute average (TRU-4) | D.svg `ln` |
| CHT-3 | R | Usual line | 1.5 px chalk, dashes 3.5 / 4.5, round caps: `.55` before now (5.75:1) | D.svg `us-past`, X |
| CHT-4 | R | Usual line after now | `.36` chalk (3.10:1 on the card, computed this run), same width and dashes, still fainter than before now (`.55`); Daily draws it since step 3 phase B (was `.24`, 2.01:1; K-31) | Q6; D.svg `us-ahead`, X; user 2026-09-30; Kb |
| CHT-5 | R | Fine lines | 1 px under the line, `#FF2946` fading from .46 through .15 at 45% to 0 | a:552, a:580 |
| CHT-6 | R | Grid and axes | gridlines at 20, 40, 60, 80: 1 px white `.05` (1.11:1, decorative: the labels carry the scale); baseline `.13`; the missing span on the axis: 1 px dots every 4 px, chalk `.62`; labels caption `--ink-3` (in a lit zone `--ink-2`, LGT-9; every label of Daily's lit chart is `--ink-2` since step 3, at least 7.86:1 over the light, K-07); the scale's labels sit 1 px in from the plot's edge, so the plot's ring keeps 4 px from them (FOC-3) | a:586-593, D.axY; Kb |
| CHT-7 | R | Peak | ring r 4.6, 2 px chalk, card-colour centre; a dotted drop (1 px, 1.5 / 3); tag "Peak 62" in caption `--ink-2` with the number in label type at 500 (13.5 px since step 3, was 14), 4 px between | a:614-615, D.peakTag; Kb |
| CHT-8 | R | End point | r 4.4 `#FF2946` with a 2 px card-colour edge and a 9 px halo (1 px, red `.32`); delayed: grey `#8F898B`, no halo | a:620-621 |
| CHT-9 | R | Marker | a hollow ring r 6.5, 1.5 px `#FF2946`, card-colour centre, a soft red glow (3.5 px at .55); the peak and the latest reading use the same ring; delayed: grey edge, no glow; still ahead: a chalk ring (1.25 px at .85) on the usual line; missing: the axis dots light up in chalk, never a point; still ahead with no history: a short axis tick | a:892-975 |
| CHT-10 | R | Hairline | below the marker to the axis, starting 10 px under the point; dashed chalk for still ahead | README 6 |
| CHT-11 | R | Tooltip lane | a band at the top of the plot: top 2 px, height 107 px in every state at Daily's type (CHT-18; by state at `9074da6`: 89 live, 109 delayed, 69 no history), 8 px to the scale's highest mark; nothing else is ever drawn in it | D.lane, Dd.lane, Dn.lane |
| CHT-12 | R | Tooltip box | SRF-3, padding SPC-4; one start-aligned column: flag and time, value and level word, then the usual row and the delayed age. Width = the widest numbered tooltip among the current stops + 2, rounded up: one width per page (127 px on every page at `9074da6`; since step 3's type roles 131 px Arabic live and no history, 130 px Arabic delayed and English; the user accepted the step-3 widths on 2026-10-01, so the formula, not 127 px, is the rule); only the missing-span box may be wider; never wraps or clips. Moves sideways only, centred on its stop, kept 2 px inside the plot | T.tip, README 6; capture |
| CHT-13 | R | Tooltip text | time caption `--ink-3`; value in heading type at 500 (19 px on Daily since step 3, was 20); level word caption `--ink-2`; a word in place of a value (Still ahead, No readings) body type (15, was 14); flag caption `--ink-2` in a 1 px `--line-2` box, radius 4, 18 tall (was 11 px text, radius 5); delayed age caption amber with a clock; rows 8 px between icon and text | T.*; Kb |
| CHT-14 | R | Connector | a chalk line from the box to its mark, behind the data: solid 1 px `.36` for a reading; dashed 2 / 3 for the usual line; dotted 1.6 px dots for no reading; ending in a 5.4 × 4.2 pointer | README 6 |
| CHT-15 | R | Input | 40 stops (every half hour, the peak and the latest reading); pointer takes the nearest; arrows move one stop, Page keys four, Home to opening, End to the latest; Escape clears; focus starts at the latest; hover, focus and tap show the same readout | README 5 |
| CHT-16 | K | Scale by state | the 80 gridline at y 470, 491 and 451 (live, delayed, no history), and the last tick 50 px from its neighbour against 127 elsewhere (F14; decided with Q2). Fixed on Daily in step 3 phase B (`637b285`) by Q2's proposal, accepted by the user on 2026-10-01: the 80 line at the same place in all three states (126 px into the plot), every time label 127 px apart at 1440 | F14 (K-15); Kb |
| CHT-17 | K | Plot focus ring | 2 px from the "80" label, under FOC-3's 4 px. Fixed in step 3 phase B (`637b285`): 3 px offset, 4 px from the labels | F, F18 (K-22); Kb |
| CHT-18 | R | Lane | the lane is sized once for the tallest tooltip any state can show (the delayed latest reading with its age and the usual row): 107 px at Daily's type, in live, delayed and no history alike, so the scale never moves by state; the band at rest grows by 18 px while live (89 to 107) | Kb; user 2026-10-01 |
| CHT-19 | R | Time axis | one rhythm: the step is the shortest of 2, 3, 4 and 6 hours that keeps 64 px between labels (2 h at 1024 px and wider, 3 h at 768, 6 h on a phone); labels run from opening to midnight; closing is the axis's end, with no label one hour after midnight | Kb; user 2026-10-01 |
| CHT-20 | R | Key | a third legend entry names the ring: a 10 px chalk ring (2 px, card-colour centre) and «قراءة الذروة» / "Peak reading", so the peak's ring above the averaged line reads as a single reading; the placements stay (the peak ring at the reading, the end point on the line). With no history the note comes last, after the ring's key, so the legend keeps live's rows | Kb; user 2026-10-01; user 2026-10-01 (review F1) |
| CHT-21 | R | States | **Empty frame** (loading, error, a retry): the grid, the baseline and both axes in the live geometry (the lane stays 107 px, CHT-18, so the scale does not move) and nothing else: no line, usual line, peak, end point, hairline or tooltip; the plot's keyboard stop is set aside; the text equivalent says «جارٍ تحميل قراءات اليوم.» or «تعذّر تحميل قراءات اليوم.». **Closed:** the usual line alone at .36, the whole day still ahead; 39 stops, focus at the first (6:00 AM, «لم يحن بعد»). **Unavailable:** today's readings from opening to 3:00 PM (the live line, plain, no end point, peak or hairline at or after 3:00 PM), the dotted mark from 3:00 PM to now with one stop («بانتظار القراءات» / "Waiting for readings"; focus starts there), the usual line before and after now; 31 stops (the half-hour reading stops to 3:00 PM, each an ordinary reading tooltip with no "latest" flag, the earlier 2:14-2:31 PM span's stop, the new gap's stop and the after-now stops). Home goes to opening and End to the gap's stop. In Closed, with no reading today, End goes to the day's last stop. The legend keeps its three keys in every state (a key, not a claim). | St |

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
| PAT-10 | R | Too few days (F5, Q5) | a cell drawn from fewer than 3 days keeps its colour under a fine diagonal hatch of the card base, and the key says "Fewer than 3 days" | components.html; Q5; user 2026-09-30 |
| PAT-11 | K | Selected cell | a ring at a 1 px offset instead of FOC-2's inset | r:170 (K-22) |

### 3.4 Table

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| TBL-1 | R | **F12: one table.** A real `<table>` with a caption, `th scope` and explicit roles; label-type cells; numbers in tabular figures, chalk; other cells `--ink-2`; the first column a row header in chalk; text columns start-aligned. **Numeric columns:** the numbers and the column's header align on the **physical right** edge in both languages: in Arabic the start edge (where the reader starts, the side of the text columns), in English the end edge. Western digits run left to right, so only a right edge puts units under units. Changed 2026-09-30 from "numbers aligned at the end", which in Arabic set the numbers on the left edge with the units out of line (the user's note on the minute table). | R.th, R.td, r:179-200; user 2026-09-30 |
| TBL-2 | R | Default density: rows 48, header 44; row lines `.055`, a firmer `.14` line closes each week; hover lifts a row with 4% white at once. | R.td, r:196-206 |
| TBL-3 | R | Compact density (logs): rows 36 with the same type, alignment and numerals; the header stays 44 so its sort buttons keep a 44 px target. | F12; user 2026-09-30 |
| TBL-4 | R | Header: caption type `--ink-3` on `#121112`, sticky, a `--line-2` rule below, outer corners radius 12. | R.th |
| TBL-5 | R | Sortable header: the whole header is a button, at least 44 × 44; its arrow (14 px) shows on the sorted column, and at half strength on hover or focus; `aria-sort`; the sort is announced. In a numeric column the label holds the right edge (TBL-1) and the arrow sits to its left, in both languages. | R.sort, r:223-231; user 2026-09-30 |
| TBL-6 | R | Exceptions in words: a highlighted row in red 8% (12% on hover) with a "Highest" flag; a camera gap inside a day that has values as a note in its notes column; days before the readings began merged into one full-width row (TBL-12). | r:207-221; user 2026-09-30 |
| TBL-7 | R | Empty: EMP-1 inside the table. | Re.tableEmpty |
| TBL-8 | R | Phone (BRK-6): notes fold into their own row, the weekday over the date, the time and then a flag under the value, on the value's right edge (TBL-11); headers may wrap; cell padding 8 (6 at 400 px and below); only the sorted column shows its arrow. | r:352-371; components.html; user 2026-09-30 |
| TBL-9 | K | Daily's minute table: 13 px, 32.5 px rows, no tabular figures, people as "0.0" and "1.7". Its numbers and headers are start-aligned: under TBL-1 that is right in Arabic (0 px) and wrong in English (K-33). Fixed in step 3 phase B (`637b285`) (K-20, K-33). | D details, A (K-20, K-33); Kb |
| TBL-10 | R | **Q4 (F11):** an export beside a table exports that table's rows. The minute file is its own action, named for what it holds ("Export minute data" / «تصدير بيانات الدقائق»), and sits by the period control. | Q4, F11; user 2026-09-30 |
| TBL-11 | R | **A composite cell** (a value with its time, a value with a flag) leads with the value at the numbers' right edge; its time, then its flag, follow it toward the left. In Arabic they read after the value («76 · 6:58 م · الأعلى»); in English before it ("Highest · 6:58 PM · 76"). The value comes first in the source order, so assistive technology reads it first. On a phone they stack under the value on the same edge (TBL-8). | user 2026-09-30; components.html |
| TBL-12 | R | **A note that spans columns** (a phone's fold row, TBL-8) starts at the first column it spans, at every width: in Arabic on that column's right edge, which its numbers and header share; in English at that column's start, where a line of text starts. **A row with no readings** (a gap in the sequence, or the span before readings began, «لا قراءات بعد» / "No readings yet") is one full-width row: a single cell across every column, starting where the first column's text starts (in Arabic the right edge that «الوقت» / «اليوم» starts on, in English the left edge; the range's first glyph on that edge, where the other rows' times and days start). In it the range first, in the range format (DAT-3), label type (13.5 px, 400), `--ink-2` and tabular figures (NUM-2); then 16 px; then the dotted mark and the words, in the camera-gap note's mark, caption type and `--ink-3`: «2:14 م – 2:31 م ···· لا قراءات», «2 أغسطس – 12 سبتمبر ···· لا قراءات بعد», "2:14 PM – 2:31 PM ···· No readings", "2 Aug – 12 Sep ···· No readings yet". There is no middle dot. The camera-gap note in a notes column (TBL-6), and its phone fold row (TBL-8), takes the same order, all in caption type and `--ink-3`, 8 px between the range and the mark: «10:00 ص – 2:00 م ···· لا قراءات». It reads as a break in the sequence, not a row of values: no row header, no empty value cells, no words under a numeric column. It keeps its density's row height (TBL-2, TBL-3), its muted treatment and its own stop (STA-4); the mark is hidden from assistive technology, so the cell reads as one phrase, the range then the words. On a phone (TBL-8) it stays one row; the range never breaks and never leaves the first line, a line may break only between the range and the mark, the mark stays with the words and the words never break inside; no sideways scroll at 390 and 320. A gap inside a row that has values stays a note in its notes column (TBL-6); an empty period keeps its single row (TBL-7). | user 2026-09-30 (the numeric-column note; the no-readings row); user 2026-10-01, mockup option د (the range first, Q11); components.html |
| TBL-13 | R | Heat-map cells stay centred: the pattern is a grid, not a column (PAT-2). | user 2026-09-30 |

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
| BTN-8 | K | Daily's "View details" is a 38 px button in 13 px text. Fixed in step 3 phase B (`637b285`): 44 px, label type, padding 16, icon 17. | D.btn (K-10); Kb |
| BTN-9 | R | A primary action that works in place (the error's retry, STA-9): its words change at once («جارٍ المحاولة…» / "Trying again…"), it takes BTN-4's primary form (chalk 14% with `--ink-2`, 7.78:1) and `aria-busy`, and it is `aria-disabled`, not `disabled`, so it keeps focus; a press while it works does nothing. | St |

### 3.6 Segmented control

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| SEG-1 | R | A group of toggle buttons (`aria-pressed`), one Tab stop each; the last may open a dialog (`aria-haspopup`). | r:43-45 |
| SEG-2 | R | **F10:** each segment is 44 px tall. | F10 |
| SEG-3 | R | Form: a 44 px row in a 1 px `--line-2` frame (drawn inside, so it adds no height), radius 12; segments pad 16, label type `--ink-2`; hover chalk and 5% white; pressed: chalk text on chalk 12% with a 1 px inset chalk `.42` edge (4.77:1), radius 12; focus: FOC-2. | components.html; user 2026-09-30 |
| SEG-4 | R | On a phone it spans the width in equal segments. | r:344-345 |
| SEG-5 | K | Segments are 36 px inside a 44 px frame (the hit area is widened by a pseudo-element); the frame's radius is 13. | R.segB, R.seg (K-11) |

### 3.7 Switch

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| SWI-1 | R | `role="switch"`, `aria-checked`; a 44 px box, 1 px `--line-2`, radius 12, label type. | R.switchEl |
| SWI-2 | R | Track 32 × 18, radius 9: off 7% white with a 1 px `--line-3` inset edge, thumb 12 `--ink-2` 3 px in; on: chalk track, card-colour thumb moved 14 px toward the inline end. The thumb slides (MOT-4). | R.switchTrack, r:111-116 |
| SWI-3 | R | Hover: chalk text, `--line-3` border. Checked: chalk text. | r:110-113 |
| SWI-4 | R | Padding 12 / 16, gap 8 (measured 12 / 14 and 10). | SPC-6; user 2026-09-30 |

### 3.8 Date field

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| FLD-1 | R | A persistent label above; a 44 px input, radius 12, edge COL-19, 3% white fill, body type with tabular figures, a `#FF2946` caret; text aligned to the inline start. | G.fieldInput, r:277-292 |
| FLD-2 | R | Typed as day/month/year with a hint below it ("Day/month/year, like 16/09/2026"); Western digits; Arabic-Indic digits typed on an Arabic keyboard are read as Western; a valid date is tidied on leaving. | README Reports |
| FLD-3 | R | Hover and focus raise the edge to `.52`; focus adds FOC-1. | r:293-294 |
| FLD-4 | R | Invalid: the edge in `--err` `.5` and a 5% error fill; a specific message under the field in `--err` with a 15 px icon, tied with `aria-describedby` and `aria-invalid`; focus goes to the first invalid field. | G invalid |
| FLD-5 | R | Disabled: `--line` edge, no fill, `--ink-3` text and label. | r:297-298 |
| FLD-6 | R | Label to field 8, field to message 8, padding 16 (measured 7, 7 and 14). | SPC-6; user 2026-09-30 |
| FLD-7 | K | The input's focus ring sits at a 2 px offset (FOC-1). | r:294 (K-22) |

### 3.9 Dialog and bottom sheet

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| DLG-1 | R | `<dialog>` with `showModal`: the page behind is inert; Tab and Shift+Tab stay inside; Escape and the scrim close it; focus returns to the control that opened it. | Keep, README Reports |
| DLG-2 | R | Panel SRF-4, at most 468 wide; head: title in heading type and a 44 px close button; body: text in label type `--ink-2`, line height 1.6; foot: actions at the inline end, the primary last. | G.* |
| DLG-3 | R | Intentional initial focus (`DESIGN_GUIDE` §11), by the dialog's job (Q8): a dialog that asks the owner to choose focuses its first field (the range dialog); one that asks to confirm focuses its primary action (the export dialog). | G initialFocus; Q8; user 2026-09-30 |
| DLG-4 | R | States: ready, invalid, working (STA-9, focus to Cancel), done (focus to the result's action, announced), failed (EMP-2). | README Reports |
| DLG-5 | R | At 720 px and below: a bottom sheet, full width, radius 24 at the top only, no bottom border, actions sharing the width, the safe-area inset below them. | r:373-379 |
| DLG-6 | R | Inset 24, close button side 12, foot gap 8 (measured 16 / 24 / 0 with a 14 side, body 6 / 4, foot 20 / 24 with a 10 gap). | SPC-5; user 2026-09-30 |

### 3.10 Chips and badges

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| CHP-1 | R | **F13:** a pill in a control row matches the control height (44) or drops its box. | F13 |
| CHP-2 | R | Header forms: a status that opens its details is a 44 px control; a status that does not, and the concept label, are boxless caption text with their dot or icon. | components.html; user 2026-09-30 |
| CHP-3 | R | A legend drops its box: swatches and words in a row, 16 apart. | components.html; user 2026-09-30 |
| CHP-4 | R | Badge (in content, not interactive): 26 tall, radius 8, 1 px `--line-2`, `rgba(15,14,15,.55)` fill, caption type. | D.level, R.cmp |
| CHP-5 | R | Level badge: four 3 px bars (4, 6.5, 9, 11 tall, 2 apart, radius 1): lit `#FF2946`, unlit white `.16`; the word in chalk. | s:328-334 |
| CHP-6 | R | Comparison badge: a trend glyph (15 px; `#FF2946` for busier, `--ink-2` for quieter, two bars for about the same) and the words in `--ink-2`; mirrored per ICO-5. | s:335-338, r:29 |
| CHP-7 | R | Flag: a small outlined word (caption type, 1 px `--line-2`, or red `.45` for "Highest"). | T.tipFlag, R.flag |
| CHP-8 | R | Badge padding 8 with an 8 gap; flag radius 4 and height 18. | SPC-6, RAD-1; user 2026-09-30 |
| CHP-9 | K | Header chips are 36 px beside a 44 px control; the legend box is 38 px beside a 44 px switch. Daily's chips are boxless since phase A (`d76972c`) and its legend since phase B (`637b285`); Reports' concept chip until step 4. | D.status, D.key, R.concept (K-10); Kb |

### 3.11 Rail and header

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| RAI-1 | R | Rail: 80 px, the full height less the page padding, sticky, SRF-2, radius 24; the logo at the top (it opens and closes the rail), the sections in one order everywhere: Today, Reports, Activity log, Access, Operations (user 2026-10-01, following the phone's bar; both rails since step 3 phase B), then Monitoring, the language, Settings and sign out at the foot. | D.rail; user 2026-10-01 |
| RAI-2 | R | Items are 48 × 48 tiles: 1 px `--line-2`, 1.8% white, icon 21 in `--ink-2`; hover `--line-3`, 6% white, chalk icon; the current page: FITWAY red with a white icon (4.64:1), `aria-current`. Every item has a localized name. | D.tile, s:217-232, X |
| RAI-3 | R | Open: 236 px over the content, names in label type beside the tiles, the current one chalk. | D railOpen |
| RAI-4 | R | Focus: FOC-1 on the tile; D4 (FOC-4). | F |
| RAI-5 | R | Tile radius 12, 8 between items, 24 between the logo and the sections (16 under the logo and the rail's 8); names in label type, 16 from the tile. On both pages since step 3 phase A. | RAD-1, SPC-6; user 2026-09-30; Fr |
| RAI-6 | R | **Tablet (721-1023 px).** Open, the rail is a modal layer: the same 236 px surface and motion (SRF-2, MOT-8) over SRF-4's scrim, which fades with it (MOT-12); the content and the skip link are inert; Tab and Shift+Tab cycle through the rail's items in visual order (logo, sections, foot); Escape or a tap on the scrim closes it and focus returns to the logo; the logo's `aria-expanded` announces it. | Fr; step 3 |
| RAI-7 | R | **Desktop (1024 px and wider).** Open, the rail is not modal: Escape or a tap outside closes it (focus returns to the logo on Escape), and when keyboard focus leaves it, it closes, so focus never lands on content hidden under it (FOC-3). | Fr; step 3 |
| RAI-8 | R | The logo's focus label (FOC-5) names what it opens: «أسماء الأقسام» / "Section names", which is part of its accessible name «FITWAY، أسماء الأقسام» / "FITWAY, section names". | Fr; step 3 |
| HDR-1 | R | Header: the title (title type), a subtitle in label type `--ink-3` with " · " separators, whose parts never break inside (DAT-4); controls and the status at the inline end; 24 between the two sides. | D.h1, D.sub |
| HDR-2 | R | The title names the page and matches its nav name (GLO-14). | F15 |
| HDR-3 | R | **Desktop and tablet status (CHP-2).** Where the status opens nothing, it and the concept label are boxless: the status in label type `--ink-2`, its dot (7 px `--live`) or clock (15 px `--delayed`), the state word chalk 500 (delayed: `#E8B62E`, COL-16), " · Last reading" and the time; the concept label in caption `--ink-3`. The status's line is centred on the title's (8 px down); 16 between them in a row. At 721-1023 px they stack at the inline end, the status first, 4 apart. | Fr; step 3 |
| HDR-4 | R | **Phone (720 px and below): the compact header.** One line holds the title and, at the inline end, the status badge (BDG-1) and the menu button (MNU-1), 8 apart, the menu outermost; under it the subtitle's first part only (the date; the hours move into the status details, BDG-3), 4 below; then the concept label, 4 below. Rows are 44, 20 and 18 tall with no other gap. Page controls, where a page has them, follow at full width. | Fr; step 3 |
| HDR-5 | R | The skip link is part of the frame: a 44 px chalk control (label type, padding 16, radius 12) with FOC-1, 12 px from the top and past the rail (112 px from the inline start; 16 on a phone). | Fr; step 3 |
| HDR-6 | R | **The status's box is the frame's.** From 721 px the status column fills the header's free width (its words end-aligned, as before); on a phone the actions take the title row's free width (columns `minmax(0, max-content) minmax(max-content, 1fr)`) and keep the badge and the menu at its end. A status that arrives or changes therefore moves nothing else (0.00 px; live's pixels unchanged). While a status is not known (STA-10) it is set aside and STW-2's words stand in its place. | St |

### 3.12 Empty state, alert and retry

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| EMP-1 | R | Empty state: an info icon (22, `--ink-3`), one sentence that names what is missing and its dates, and one way back (a secondary button); centred. | Re.tableEmpty |
| EMP-2 | R | Alert: `role="alert"`, radius 12, 1 px `--err` `.5`, 6% error fill, an error icon (17) and text in chalk that says what happened, that nothing was lost, and what is kept. | G alert |
| EMP-3 | R | Retry: one primary action ("Try again", «إعادة المحاولة»); focus moves to it; the inputs are kept. | README Reports |
| EMP-4 | R | Empty state padding 40 with a 16 gap; alert padding 12 / 16 with an 8 gap (measured 40 / 44 and 14; 12 / 14 and 10). | SPC-6; user 2026-09-30 |
| EMP-5 | R | **A page that could not load (STA-13).** The alert sits in the page's first answer, Inside now, first in every composition, so it and its retry are on the first screen at every size (at 1440 y 201, at 390 and at 720 × 450 y 231, never under the bar): the card's name stays; in the value's line and the foot together (46 + 42 px) the sentence «تعذّر تحميل القراءات» / "Couldn't load readings" in heading type at 400, chalk, after the alert mark (17 px, `--err`), with `role="alert"`, written 50 ms after it is in place so it is announced once; then the one primary «إعادة المحاولة» / "Try again" (BTN-3; 117.7 × 44 AR, 94.7 × 44 EN), 15.5 px below the sentence, focused at once with FOC-1. What EMP-2 keeps is nothing on a first load; what to do is in the badge's details. | St |

### 3.13 The phone's bar, status badge and menu

Step 3 phase A (run `owner_daily_r04_s17`). `components.html` shows each in its states, AR and EN.

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| BAR-1 | R | **The bar.** The rail turned to lie along the bottom: SRF-7's glass, fixed 16 px from both sides (8 px below 360 px, so every name keeps its line at 320) and 12 px above the bottom, or the safe-area inset where larger (physical left and right, `DESIGN_GUIDE` §8); 8 px inside and between its five items. 74 px tall. The page keeps 16 px of space below its content clear of it. | Fr |
| BAR-2 | R | **An item.** A link at least 44 × 44 (61.6 × 56 at 390, 50.8 × 56 at 320), radius 16: a 40 × 28 tile (radius 12) with the section's 21 px rail icon, 4 px, and its short name in caption type (12 / 18), centred. At rest the tile has no fill and the icon and name are `--ink-2`. | Fr |
| BAR-3 | R | **Names.** Short names (GLO-18), one line each, never cut: the widest, "Settings", is 47.6 px in a 50.8 px item at 320. Each item's accessible name is the section's full name, which contains the short one. | Fr |
| BAR-4 | R | **States.** Hover: chalk icon and name, tile 6% white, at once. Current page: the rail's red tile (FITWAY red, white icon, `aria-current="page"`), name chalk at 500; hover `#F0223E`. Items that do not exist yet in the concept do nothing. | Fr |
| BAR-5 | R | **Focus.** FOC-1 around the whole item. With 8 px between items the ring stays inside the bar and at least 4.58 px from a neighbour's name at 320 (FOC-3). | Fr |
| BAR-6 | R | **Order.** Today, Reports, Activity log, Access, Settings, from the inline start (the right in Arabic). The bar follows the main content in the source, so reading and Tab order run top to bottom. | plan §3; Fr |
| BDG-1 | R | **The status badge.** The header's status compacted to its word: a 44 px control (CHP-2), radius 12, BTN-2's secondary surface, padding 16, 8 between parts: the dot (7 px `--live`) or the clock (15 px `--delayed`), the word in label type at 500 (chalk; delayed `#E8B62E` with a `--delayed` 36% edge), and a 16 px chevron (`--ink-2`) that turns while open. Accessible name «حالة التشغيل: مباشر» / "Operations status: Live"; `aria-haspopup="dialog"`, `aria-expanded`. | Fr |
| BDG-2 | R | **Opening.** Click, Enter or Space opens the details and moves focus to them; Escape closes them and returns focus to the badge; a tap outside, or focus leaving them, closes them. One header panel is open at a time. | Fr |
| BDG-3 | R | **The details.** A non-modal dialog (SRF-8) under the header, 8 px below the controls, aligned to the page's inline end, `min(288px, 100vw − 32px)` wide. Inside, 16 from its edge: the title «حالة التشغيل» / "Operations status" (caption `--ink-3`), the state in heading type at 500 with its dot (8 px) or clock (17 px), "Last reading 7:42 PM" (label `--ink-2`; delayed adds " · 13 min ago" in `#E8B62E`), and the day's hours; then, over a `--line` rule, a 44 px row to the Operations page (its rail icon, its name, a chevron along the reading line, ICO-5). | Fr |
| BDG-4 | R | The details carry what the phone header leaves out: the last reading's time and how old it is, the hours, and the way to Operations, which has no place in the bar (confirmed, user 2026-10-01). They take a new reading at once. | Fr; user 2026-10-01 |
| MNU-1 | R | **The menu button.** A 44 × 44 icon button (BTN-5) with a three-dot icon (18 px, `--ink-2`; hover and open: chalk on 5% white); name «المزيد» / "More"; `aria-haspopup="menu"`, `aria-expanded`. | Fr |
| MNU-2 | R | **The menu.** A `role="menu"` panel (SRF-8), 4 px inside, at least 200 px wide, under the button at the page's inline end: Monitoring (its rail icon; user 2026-10-01), the language (its glyph, «EN» / «AR», in caption at 500, then the other language's name in that language) and sign out (its mirrored icon, ICO-5), in the rail's foot order. Nothing else. | Fr; user 2026-10-01 |
| MNU-3 | R | **Items.** 44 px tall, radius 12, label type chalk, icon 16 `--ink-2`, 8 between, text 16 from the panel's edge; hover 6% white; focus FOC-2. | Fr |
| MNU-4 | R | **Keyboard.** Enter, Space or Down Arrow opens it on the first item, Up Arrow on the last; Down and Up move and wrap, Home and End jump; Escape closes it and returns focus to the button; Tab closes it and moves on from the button. | Fr; `DESIGN_GUIDE` §11 |

### 3.14 States: placeholders and the status words

Step 3's second part (run `owner_states_r04_s19`). `components.html` shows each in its states, AR and EN ("Daily's states").

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| PH-1 | R | **A placeholder bar** stands where a value is awaited, in that value's own slot: an inline block on the value's baseline, as tall as its digits' ink, so it occupies what the figures will: 33 px for a display value (the digits' ink runs from 7 to 40 px in the 46 px line), 22 px for a value in words (7 to 29 in 36), 9 px for a caption (4 to 13 in 18); radius 8 (4 for the 9 px bar). Widths by slot, a typical value's: 56 px for Inside now and Today's peak, 80 for Entries, 88 for the busiest time, 40 for a "when", 56 for a note. One flat fill, `rgba(255,255,255,.06)` (1.13:1 on the card: decorative, the words carry the state), no border, sheen, shimmer or pulse. | St |
| PH-2 | R | **A placeholder box** stands for the level badge: its own 76 × 26 box, radius 8, the same fill. | St |
| PH-3 | R | **Where, and when.** Only awaited values wait: the values (and the unit «تقريبًا» / "approx." with its value), the "when" in a meta slot, the badge, the notes. Real text from the first paint: the title, the date and the hours (the schedule, not a reading), every card's name, the busiest time's «آخر 7 أيام» / "Last 7 days", the chart's title, legend and axes, the navigation. A placeholder is a sibling of its value, which is set aside, so the value arrives as a new box. Invisible for the first 300 ms, shown from 300 ms, at least 400 ms (STA-10). | St |
| STW-1 | R | **One status word, three places.** The header (HDR-3), the phone's badge (BDG-1) and its details (BDG-3) say the same word with the same mark: live, the green dot; delayed, the amber clock; **closed**, a hollow ring the live dot's size (7 px, 1.5 px `--ink-3`, 8.22:1 on the page), «مغلق» / "Closed", then «يفتح 6:00 ص» / "Opens 6:00 AM"; **unavailable**, a struck circle (15 px `--ink-2`, 11.59:1), «غير متصل» / "Offline", then «لا عدّ حاليًا» / "No current count"; **error**, the alert mark (15 px, 17 in the details) and the word in `--err` (7.34:1 on the page), «خطأ» / "Error", then «تعذّر التحميل» / "Couldn't load"; the badge's edge `--err` at 50%. Closed and offline words are chalk at 500. No mark mirrors (ICO-5). Widths measured: the header's status 141.9 / 155.9 / 140.1 px AR and 171.3 / 193.5 / 156.0 EN (closed, offline, error); the badge 104.5 / 142.1 / 106.9 AR and 117.3 / 126.0 / 114.6 EN, so at 320 English the badge and the menu need 178 of the actions' 191.6 px. | St |
| STW-2 | R | **While the status is not known** (loading), the status and the badge are set aside and the words «جارٍ التحميل…» / "Loading…" stand in their place, in the status's label type, `--ink-2`, boxless; on a phone they sit where the badge will, and are not a control (there are no details to open yet). Invisible for the first 300 ms, like the skeleton. | St |

## 4. Owner surface

Every row here is **C**, composition: how that page arranges the shared system. None is a template. Source: the
probe frames `daily-*` and `reports-*` at 1440 (`D:\fitway-scratch\spec\work\probe\frames\`) and README "Reports".

### 4.1 Today (Daily)

| Id | L | Entry |
| --- | --- | --- |
| OWN-D1 | C | Answers "how is today going right now; busier or quieter than usual; when are the peaks". |
| OWN-D2 | C | The first screen is fixed to the viewport (at least 720 px) at 1200 px and wider: header, four cards, the chart; details below on request ("View details": data coverage and the minute table). Below 1200 px the first screen grows past the viewport instead (OWN-D6), `user 2026-10-01`. |
| OWN-D6 | C | **1024-1199 px (the desktop frame) and 721-1023 px (the tablet, 768 designed):** the cards two by two (BRK-5); the first screen at least the viewport's height and growing past it rather than squeezing the chart, which keeps 440 px (it fills the rest of a 768 × 1024 screen: 548 px); the chart's head on two lines below 1024 (the title and its button, then the legend); the details in one column. |
| OWN-D7 | C | **720 px and below (390 designed; the 200% zoom of 1440 lands here):** the compact header (HDR-4); Inside now and Busiest time across the width, Today's peak and Entries side by side with their heads two lines tall, so their values line up (the peak's time under its name); the chart's head on two lines; a 340 px plot with a 6-hour time axis (CHT-19); the details in one column, the minute table in TBL-8's phone form (cells 8, 6 at 400 px and below, the notes folded under their row), its region never taller than the screen above the bar; the page scrolls down, never sideways. |
| OWN-D8 | C | **Below 360 px (320 checked):** every card across the width, Today's peak keeping its time beside its name; the chart's title, legend and button each on their own line. |
| OWN-D9 | C | The lights at every size: the summary light on Inside now and the data light on the chart card, both sized in their card's own units (LGT-2), so a card's shape carries its light; while delayed both cards are plain (LGT-8; user 2026-10-01 (review F2)). |
| OWN-D3 | C | Cards: Inside now (lit, summary light), Today's peak, Entries with its usual value, Busiest time over the last 7 days. |
| OWN-D4 | C | The chart card carries the data light: today's line against the usual Wednesday, with the tooltip lane. |
| OWN-D5 | C | The first-open intro (MOT-10), at every size; nothing moves at its end (K-27). |
| OWN-D10 | C | **The states at every size** keep OWN-D2 and OWN-D6…D9: the same cards, places and heights as live (STA-14). The error's alert and retry are in Inside now, first in every composition; the empty, closed and unavailable charts keep the plot's height (440 px and wider from 1024; 340 px on a phone). |

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
| K-01 | K | Week over week ignores the chosen period and uses a rolling Wed-Tue week while the table closes weeks on Saturday; in an empty July it still shows +9% (F1) | Reports, all periods | TRU-1, TRU-7, GLO-13, STA-8 | step 4: the card leaves the period row and names its span, "Last 7 days" with dates (TRU-7, Q3) |
| K-02 | K | Loading, page-level closed, unavailable and error are not designed (F2) | every screen | STA-10 | each screen's round. **Daily done in step 3** (run `owner_states_r04_s19`, `ad63268`; proposal 4 at this commit): STA-10…14, PH-1…3, STW-1…2, CRD-10, CHT-21, EMP-5; open for Reports (step 4) and the other screens |
| K-03 | K | «متوسط» used for averages («المتوسط 48», «متوسط الموجودين», «متوسط كل 30 دقيقة», «متوسط 4 أيام», the column «المتوسط») (F3) | Daily, Reports | GLO-3, GLO-4 | steps 3, 4. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: «متوسط» for an average 3 → 0 (the key, the busiest note, the column, the coverage facts and the summary say «معدّل»; «متوسط» stays the band word); Reports until step 4 |
| K-04 | K | Missing data named three ways: «لا قراءة» / "No reading", «لا بيانات» / "No data", «لا قراءات» / "No readings" (F4) | Daily tooltip and details, Reports pattern | GLO-5 | steps 3, 4. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: «لا قراءة» 22 (live) and 24 (delayed) → 0, "No reading" 22 and 23 → 0, in the tooltip, the table, the coverage facts and the summary; «لا قراءات» / "No readings" and «لا قراءات بعد» / "No readings yet" in their place; Reports until step 4 |
| K-05 | K | A single day's "Busiest" and cells read as certain; the busiest point has no key entry (F5) | Reports, short and 7-day periods | TRU-2 | step 4: cells from fewer than 3 days hatched, "Busiest" hidden below 3 days, so none on a 7-day period; the busiest dot in the key (PAT-10, GLO-12, Q5) |
| K-06 | K | The delayed level badge keeps chalk and red bars (F6) | Daily, delayed | LVL-5, LVL-6 | step 3: the badge dims with its value (LVL-6, Q9). **Fixed in step 3 phase B** (`637b285`, Kb): lit bars `#FF2946` → `#8F898B`, the word chalk → `--ink-2` |
| K-07 | K | Axis labels over the lit corners at 3.85-4.88:1 in `--ink-3` (F7) | Daily chart | LGT-9 | step 3. **Fixed in step 3 phase B** (`637b285`, Kb): every axis label `--ink-2`; the lowest label contrast over the light 3.85:1 → 7.86:1 (every label, tooltip and peak tag on every page state measured) |
| K-08 | K | Spacing off the 4 px scale (SPC-7) (F8) | Daily, Reports | SPC-1, SPC-5, SPC-6 | steps 3, 4. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: gutter 18 → 16, the first screen's top 10 → 8, card padding 18 × 20 → 20, chart 22 × 26 → 24 (16 bottom), head to value 14 → 16, meta gap 7 → 8, subtitle 6 → 4, badge padding 10 → 8, table cells 14 → 16, details 22 × 26 → 24, facts 10 → 12; Reports until step 4. **Partly fixed in step 3 phase A** (`d76972c`, Fr) on both rails: gaps 8 and 24 (were 10 and 26), names 16 from the tile (were 14) (RAI-5) |
| K-09 | K | Fifteen text sizes (TYP-6) and radii off the set (RAD-2) (F9) | Daily, Reports | TYP-3, RAD-1 | steps 3, 4. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: sizes 46, 38, 30, 20, 19, 14, 13.5, 13, 12.5, 12, 11.5 and 11 → 46, 30, 19, 15, 13.5 and 12 (details open, a tooltip shown); radii 1, 3, 5, 8, 10, 12, 14, 24 → 1 (the level bars), 4, 8, 12, 16, 24; Reports until step 4. **Partly fixed in step 3 phase A** (`d76972c`, Fr) on both rails: tiles radius 12 (were 14), names 13.5 px (were 14); Daily's header: status 13.5 px and concept 12 px (were 13) |
| K-10 | K | Controls and pills under 44: `#details-btn` 124.8 × 38; the header's status and concept chips 36; the legend box 38 (KI1, F13) | Daily; Reports' concept chip | BTN-1, CHP-1, `DESIGN_GUIDE` §11 | step 3 (Daily), step 4 (Reports' chip). **Fixed in step 3 phase B** (`637b285`, Kb) on Daily: `#details-btn` 137.8 × 38 → 149.1 × 44 (AR; 126.3 × 38 → 137.2 × 44 EN); the legend's 38 px box → boxless (18 px line); no target under 44 × 44 on any of 98 page states. **Partly fixed in step 3 phase A** (`d76972c`, Fr): Daily's header status and concept label lose their 36 px boxes (HDR-3; CHP-2); on a phone the status is a 44 px badge (BDG-1). The button and the legend stay for phase B |
| K-11 | K | Segments 36 px in a 44 px frame with radius 13 (F10, KI1) | Reports | SEG-2 | step 4 |
| K-12 | K | The Inside now light is unchanged while delayed (D1) | Daily, delayed | LGT-7, LGT-8 | step 3: the card loses its light while delayed (LGT-8, Q10). **Fixed in step 3 phase B** (`637b285`, Kb): lit with its lamp → a plain card, AR and EN, at every size |
| K-13 | K | The lit week card says "Not enough history yet" (short state) and shows +9% in an empty period (D1) | Reports | LGT-7, LGT-8 | step 4: the card loses its light while it has no complete value (LGT-8, Q10) |
| K-14 | K | "Export CSV" on the day table exports 40,320 minute rows, and its copy says "UTC" (F11) | Reports | GLO-16, TBL-10, truthful labels | step 4: the day table exports its rows; "Export minute data" moves by the period control (TBL-10, Q4) |
| K-15 | K | The scale changes by state and the last tick breaks the rhythm (F14) | Daily chart | CHT-11's intent | step 3, with Q2. **Fixed in step 3 phase B** (`637b285`, Kb) by Q2's proposal (CHT-18, CHT-19), accepted by the user on 2026-10-01: the 80 line 108, 128 and 88 px into the plot (live, delayed, no history) → 126 in all three; label spacing 49.3-126.8 px → 127.1-127.2 px at 1440 |
| K-16 | K | The nav says «اليومي» / "Daily" on a page titled «اليوم» / "Today" (F15) | both rails | GLO-14 | step 3. **Fixed in step 3 phase A** (`d76972c`, Fr): «اليوم» / "Today" on both rails and the bar |
| K-17 | K | Dates and times break across lines: "…1:00 / AM" at 1000 px, «22 سبتمبر / 2026» at 320 (F16) | Daily header, Reports | DAT-4 | steps 3, 4. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: no date, time or range breaks inside at 1440, 1000, 768, 390 or 320, AR and EN (were "1:00 AM" at 1000, "6–8 PM" at 768, 390 and 320 EN, «6–8 م» at 390 and 320); Reports until step 4. **Partly fixed in step 3 phase A** (`d76972c`, Fr) for Daily's header: the date and the hours never break inside (HDR-1). The details' usual-day dates were joined at this commit (a no-break space between each day and its month; `user 2026-10-01` (review F3)) |
| K-18 | K | A level badge on an all-hours average ("Average inside 21 · Quiet") (F17) | Reports | LVL-2 | step 4 |
| K-19 | K | Trend glyphs mirror inconsistently: the week card's head icon and Daily's peak icon do not (F19) | Daily, Reports | ICO-5 | steps 3, 4. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: the peak's trend icon mirrors in Arabic (transform none → scaleX(−1)); Reports' week card until step 4 |
| K-20 | K | The minute table: 13 px, 32.5 px rows, no tabular figures, "0.0" and "1.7" people (F12). Its start-aligned numbers meet TBL-1 in Arabic; in English they break it (K-33). Its gap (2:14-2:31 PM) is 18 rows of values, one per minute, not one full-width row: each has its time as the row's first cell, a "-" under «داخل الصالة» / "Inside", an empty average cell and «لا قراءة» / "No reading" under the note column (B) | Daily details; the gap: AR and EN, `live` and `delayed`, 1440, 1024, 768, 390 | TBL-1, NUM-2, NUM-5, TBL-12 | step 3. **Fixed in step 3 phase B** (`637b285`, Kb): 13 → 13.5 px; rows 32.5 → 36 (TBL-3); tabular figures; 805 averages with a decimal → 0 (whole people); the time a row header (0 → 805 `th scope=row`); the gap's 18 rows of values → one full-width row, the range first («2:14 م – 2:31 م ···· لا قراءات»), 36 px; while delayed a last full-width row «7:30 م – 7:42 م ···· لا قراءات بعد»; on a phone the notes fold under their row (TBL-8), 0 px sideways scroll at 390 (was 270-351) |
| K-21 | K | "Busiest" is a 2-hour window on Daily and a 1-hour cell on Reports; the peak's time sits in Reports' card foot (F20) | Daily, Reports | GLO-12, DAT-5 | steps 3, 4: one-hour slots on both pages (GLO-12, Q7); the peak's time in the meta slot. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: a 120-minute window (6-8 م, average 48) → the 60-minute slot (6-7 م, average 51) over 7 days; Reports until step 4 |
| K-22 | K | Focus rings at offsets 3, 2, 1 and −4; a red ring on the skip link; the plot's ring 2 px from "80" (F18) | Daily, Reports | FOC-1…3 | steps 3, 4. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: the plot's ring 2 → 3 px offset and 2 → 4 px from the scale's labels; the minute table's region 2 → 3 px; every stop at every size 2 px chalk at 3 px (−4 on menu items), none under the bar (FOC-7); Reports until step 4. **Partly fixed in step 3 phase A** (`d76972c`, Fr): Daily's skip link has the one ring (HDR-5); the frame's new controls use FOC-1 or FOC-2 only |
| K-23 | K | Keyboard focus on a rail item shows no name (D4) | both rails | FOC-4 | step 3. **Fixed in step 3 phase A** (`d76972c`, Fr): the name shows on keyboard focus only, 12 px beyond the tile, 32 px tall, centred (0 px), on both rails; hover shows none (FOC-5, RAI-8) |
| K-24 | K | A bordered 34 px icon tile on every card (F21) | both pages, 8 cards | ICO-3 | steps 3, 4. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: 4 tiles → 0, 4 icons 16 px in the flow; Reports' four until step 4 |
| K-25 | K | 13 px text on red cells would be about 3.3:1 undimmed: held by the 80% dim (5.26:1 lowest) (KI4) | Reports pattern | PAT-8 guards it | none; re-measure each round |
| K-26 | K | The card headers overflow at 1024: worst 59 px (AR, "Busiest time"), a document scroll of 1046 px (AR) and 1026 px (EN); still at 1100, gone at 1280 (KI2, corrected). Below 1024 the page is not designed yet and scrolls sideways (EN: 834 px at 768, 709 px at 390) | Daily | BRK-1, BRK-5, DESIGN_GUIDE §8 | step 3. **Fixed in step 3 phase B** (`637b285`, Kb): sideways scroll 22 (AR) and 2 (EN) px at 1024 → 0, 86 and 66 at 768 → 0, 272 and 319 at 390 → 0, 342 and 389 at 320 → 0; card head spill up to 57.8 px at 1024 → 0 at every width (the cards two by two below 1200, BRK-5) |
| K-27 | K | `#busy-note` jumps when the intro ends: 71.5 px at 600 (EN) and 390 (EN, AR); 14.7-14.8 px at 768-820 (EN); none in AR at 820, none at 900-1024 (KI3, corrected) | Daily, below 1024 | MOT-1, CRD-4 | step 3. **Fixed in step 3 phase B** (`637b285`, Kb): the busy note's move at the intro's end 71.5 px (390, 320), 33.5 (600 AR), 14.75 (768-820 EN) → 0 at 1440, 1024, 820, 768, 600, 390 and 320, AR and EN; layout shifts 1 → 0 (the value never breaks, and the cards size to their content) |
| K-28 | K | Stat cards fixed at 166 px (the root of K-27) | Daily, Reports | CRD-4, `DESIGN_GUIDE` §7 | steps 3, 4. **Partly fixed in step 3 phase B** (`637b285`, Kb) on Daily: fixed 166 px → content-sized (natural 166, 166, 158 and 148 px at 1440, stretched to the row's tallest; CRD-9); Reports until step 4 |
| K-29 | K | The rail set aside and the pattern scrolled sideways below 721 px as a placeholder | Reports | BRK-4 | step 4 |
| K-30 | K | Two amber text tones (`#F0C23C` in the header, `#E8B62E` elsewhere) | Daily, delayed | COL-16 | step 3. **Fixed in step 3 phase A** (`d76972c`, Fr) for the header and the badge: `#E8B62E` (HDR-3, BDG-1) |
| K-31 | K | The usual line after now at `.24` chalk, 2.01:1 | Daily chart | CHT-4, non-text contrast 3:1 | step 3: `.36` (CHT-4, Q6). **Fixed in step 3 phase B** (`637b285`, Kb): `.24` (2.01:1) → `.36` (3.10:1) |
| K-32 | K | A single closed cell hides its word (`.is-one`); only a 1.1:1 fill would tell it from a low value. Latent: no single closed hour occurs in the data | Reports pattern | PAT-5, `DESIGN_GUIDE` §13 (grayscale) | step 4 |
| K-33 | K | Daily's minute table, **English**: numbers and headers start-aligned, so on the left edge. The units are out of line (right edges spread 11 px under "Inside", 11.5 px under "30-min average") and each header's right edge sits 34.5 px ("Inside") and 81 px ("30-min average"; 34 px at 768 and 390) from its numbers'. Arabic meets TBL-1 (0 px) (A) | Daily details, EN, 1440, 1024, 768, 390 | TBL-1 | step 3. **Fixed in step 3 phase B** (`637b285`, Kb): right edges' spread 11 and 11.5 px → 0; each header's right edge 23.5 and 69.5 px from its numbers' → 0 (1440 and 390, live and delayed; Arabic stays 0) |
| K-34 | K | Reports' day table, **Arabic**: numeric cells end-aligned, so on the left edge. Right edges spread 3.1 px (Entries) and 1.5 px (Average); the headers' text ends 26.5 px (Peak), 35 px (Average) and 50 px (Entries) from their numbers' right edge at 1440 (17, 33 and 47 px at 390); the peak value floats with its time (spread 3.6 px). The "No readings yet" row (`short`) is two cells, not one full-width row: its range «26 أغسطس – 12 سبتمبر» as the row header under «اليوم», and «لا قراءات بعد» in a cell spanning «الذروة» to «ملاحظات», starting at the Peak column's right edge, 162 px from its header's text at 1440 (87 at 1024, 73 at 768, 9.5 at 390) (A); 48 px tall, 81 at 768 and 62.5 at 390 (B). Latent in both languages: a day inside the readings with none would put «لا قراءات» / "No readings" under Peak beside empty Average and Entries cells (rj:797); no such day occurs in the default, `short` or 7-day data (B) | Reports, AR, 1440, 1024, 768, 390 | TBL-1, TBL-11, TBL-12 | step 4 |
| K-36 | K | Short landscape screens (721 px and wider but under about 650 px tall, such as a phone turned sideways at 844 × 390): the rail keeps its 620 px minimum, so its foot falls below the screen; Daily's first screen keeps 720 px. Not in the designed or checked sizes | the frame, every page | BRK-1, `DESIGN_GUIDE` §8 | step 8 (the final polish; user 2026-10-01: may stay out of scope until then) |
| K-35 | K | Reports' day table, **English**: the peak cell ends with its time, so the value sits 54-55 px inside the column's right edge and its right edges spread 2.7 px. Average and Entries meet TBL-1 (0 px), and at 390 the phone form stacks the time under the value and meets both (A). The "No readings yet" row (`short`) is two cells, not one full-width row: its range "26 Aug – 12 Sep" as the row header under "Day", and "No readings yet" in a cell spanning Peak to Notes from the Peak column's start (0 px, which met TBL-12 before the no-readings row was decided) (A); 48 px tall, 45.4 at 390 (B). The latent peak cell of K-34 applies here too | Reports, EN, 1440, 1024, 768; the no-readings row also 390 | TBL-11, TBL-12 | step 4 |

**Findings coverage.** F1 TRU-7, GLO-13, K-01; F2 K-02, STA-10…14; F3 GLO-4, K-03; F4 GLO-5, K-04; F5 TRU-2, PAT-10,
K-05; F6 LVL-5, LVL-6, K-06; F7 LGT-9, K-07; F8 SPC-5, K-08; F9 TYP-3, K-09; F10 SEG-2, K-11; F11 GLO-16, TBL-10, K-14;
F12 TBL-1, K-20; F13 BTN-1, CHP-1, K-10; F14 K-15, Q2; F15 GLO-14, K-16; F16 DAT-4, K-17; F17 LVL-2, K-18; F18 FOC-1…3,
K-22; F19 ICO-5, K-19; F20 GLO-12, DAT-5, K-21; F21 ICO-3, K-24; D1 LGT-7, LGT-8, K-12, K-13; D2 Q1; D3 Q2; D4 FOC-4,
K-23; KI1 K-10, K-11; KI2 K-26; KI3 K-27; KI4 K-25; Keep: SRF-1, SRF-5, LGT-6, CRD-1, PAT-1, TBL-5, DLG-1, BRK-5, BRD-1,
COL-21, STA-4…8. Review §5 (README accuracy): the segments K-11; the week-over-week empty July K-01; dialog focus DLG-3;
the overflow note K-26; Daily's axis contrast K-07; the delayed scope is restated in STA-2. The user's note on numeric
columns (2026-09-30): TBL-1, TBL-5, TBL-8, TBL-11…13, K-20, K-33…35. The user's rule for a row with no readings
(2026-09-30): TBL-12, STA-4, TBL-6, K-20, K-34, K-35, Q11.

## 8. Open questions for the user

No question is open now. Q1 and Q2 were answered on 2026-10-01 with step 3 phase B's proposal, built on Daily (below). Q3-Q11 were answered on 2026-09-30, each with the sheet's proposal (below); Q11 was re-answered on 2026-10-01.

### Answered 2026-10-01

Each answer is the proposal step 3 phase B built on Daily (`637b285`); the entries now carry it.

- **Q1** (D2, the peak ring above the averaged line): a one-line key, «قراءة الذروة» / "Peak reading" with a ring
  swatch in the legend; each mark stays where its truth is → CHT-20; CHT-7, CHT-8.
- **Q2** (D3 with F14, the lane's band): the lane sized once, 107 px in every state, so the scale never moves; the time
  axis keeps one rhythm → CHT-18, CHT-19; CHT-11, CHT-16, K-15.

### Answered 2026-09-30

Each answer is the proposal the first draft made; the entries now carry it.

- **Q3** (F1, week over week): (b), the domain's rolling 7 days, out of the period row and labelled by its span → TRU-7,
  GLO-13; K-01.
- **Q4** (F11, export): the table's rows by the table, the minute file by the period → TBL-10; K-14.
- **Q5** (F5, too few days): 3 days, so a 7-day period shows no "Busiest" → PAT-10, GLO-12, TRU-2; K-05.
- **Q6** (the usual line after now): `.36` → CHT-4; K-31.
- **Q7** (F20, "Busiest"): one hour → GLO-12; K-21.
- **Q8** (dialog initial focus): keep the two cases, choose → field, confirm → action → DLG-3.
- **Q9** (F6, a delayed badge): dim it → LVL-6; K-06.
- **Q10** (D1's form): the card loses its light → LGT-8; K-12, K-13.
- **Q11** (the words run into the range): the range first, then 16 px, then the dotted mark and the words; 8 px in a
  notes-column note; in both languages (user 2026-10-01, mockup option د; it replaced the middle dot between the words
  and the range chosen on 2026-09-30) → TBL-12.
