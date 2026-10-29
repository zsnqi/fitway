<!-- Part of DESIGN-SPEC.md; the index and the rule for editing are in DESIGN-SPEC.md. -->

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
| SRF-8 | R | A panel that opens from the header (the status's details at every size, BDG-3; the phone's menu, MNU-1): the open rail's surface, `rgba(12,12,15,.94)`, blur 22, with a firmer 1 px `--line-2` edge (it floats over content), radius 16, the open rail's shadow. | Fr; step 3; R4 |

### 1.3 Light

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| LGT-1 | R | Lights are static. They never move, pulse, follow the pointer or react to data. | `README.md`, "Motion", rule 2, s:340 |
| LGT-2 | R | A light is a light behind the glass with a large dark disc in front of it (a mask, transparent inside), clipped to the element that owns it, sized in `cqw`/`cqh` of that element, never fixed to the viewport. | s:340-389 |
| LGT-3 | R | Three recipes only: the **page wash** (an arc along the top from the inline-start corner), the **summary light** (the `.lit-card` recipe: brightest just inside the inline-end bottom corner) and the **data light** (the `.lit-chart` recipe: a U along the bottom and up both sides). | s:125-160, s:391-464 |
| LGT-4 | R | The user-tuned `:root` values are the defaults and stay: summary intensity .7, core `229 25 53`, disc 77, aspect .7, position 67, softness 34 px, rim 8, lit-corner glow .05 at 110%, far glow .9, ring-end fade 19; data light intensity .95, fade 11.5, sides 48.5, balance 0, softness 260 px; wash 1; grain .15. | s:43-62 |
| LGT-5 | R | Light ramp: obsidian → oxblood → FITWAY red → `#FF2946` only at the single hottest point. It never reads pink or purple (OKLCH hue 21-29). Grain shows only where lit. | `README.md`, "Colours", s:33 |
| LGT-6 | R | **Where light may go.** The language carries over, the composition does not: a page lights at most one summary card and at most one data card, plus the page wash, and may light none. Which card is lit is composition (§4). | Keep, plan §1 |
| LGT-7 | R | **D1.** The brightest thing on a page is never stale, unavailable or empty. A lit card whose content becomes stale, unavailable, empty or "not enough history" loses its light. | D1 (accepted) |
| LGT-8 | R | D1's form: the card is drawn as a plain card while its content is not current; the light returns with a live or complete value. It never keeps a dimmed light (Q10). | components.html; Q10; user 2026-09-30 |
| LGT-9 | R | **F7.** Text in a lit zone uses `--ink-2` or brighter, never `--ink-3` (measured `--ink-3` over a lit corner: 3.85-4.88:1). | F7 |
| LGT-10 | R | The rail's rim catches the page wash where it sits in it. | s:187-199 |
| LGT-11 | R | **The states (step 3's second part).** Loading, closed, unavailable and error light no card: both lights are out (LGT-7, LGT-8), so the brightest thing is never a placeholder, a closed day, a missing count or an error. The page wash stays in every state: it is the page's, not a value's. A light that returns with a live value comes on at once at the arrival, never fading (LGT-1). | St; user 2026-09-30 (LGT-8) |

### 1.4 Type

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| TYP-1 | R | Readex Pro, self-hosted from `fonts/`, weights 400 and 500 only (one variable file per subset, shared by both weights), fallback `"Segoe UI", system-ui, sans-serif`. Cairo is excluded. **One exception** (DECISIONS item 34): the front desk's code, in its one-time view (DLG-9, 500) and its field (FLD-10, 400) only, is set in JetBrains Mono 2.304 (SIL OFL 1.1, `fonts/OFL-jetbrains-mono.txt`), self-hosted from `fonts/` (one file per weight, printable ASCII only, layout features removed), loaded with `document.fonts.load` as Readex is; it tells I, l and 1 apart (slab I, l with a tail, 1 with a flag and foot) and O from 0 (a dotted zero), which Readex does not. Fallback `"Cascadia Mono", Consolas, Menlo`, then Readex for any other script. | s:22, fonts/readex-pro.css, fonts/jetbrains-mono.css |
| TYP-2 | R | Loading: the blocking font stylesheet, then `document.fonts.load` for both weights; each font file is fetched at most once per load, over HTTP and from `file://`. | index.html:20-29 |
| TYP-3 | R | **The scale (F9): six sizes with named roles.** | below; user 2026-09-30 |
| TYP-4 | R | Line height 1.5 for text, 1.6 for dialog text, 1.2 for the page title, 1 for a display value, 1.25 inside a tooltip. | D.h1, D.valueNum, T.tip, G.dlgDesc |
| TYP-7 | R | Every text is set by role (display, title, heading, body, label, caption). Entries below name the role; the role's size is TYP-3 (accepted 2026-09-30), which the pages take in steps 3 and 4 (K-09). | this sheet; user 2026-09-30 |
| TYP-5 | R | Letter spacing 0; never negative, never on Arabic. Only the Latin wordmark is tracked (.12em). | s:240 |
| TYP-6 | K | Rendered today: 10, 11, 11.5, 12, 12.5, 13, 13.5, 14, 15, 16, 19, 20, 30, 38 and 46 px (15 sizes; the review counted 13 and missed 16, the export "ready" title, and 20, the tooltip value). Daily since step 3 phase B (`637b285`): 46, 30, 19, 15, 13.5 and 12 (the six roles; measured with the details open and a tooltip shown, 11.5, 12.5, 13, 14, 20 and 38 are gone); Reports until step 4. Reports since step 4 phase A (R4): 46, 30, 19, 13.5 and 12 rendered at 1440 (the page, with numbers on and a readout, and either dialog open), and 15 in the date fields, a readout's word and the export's "ready" title; 10, 11, 12.5, 13, 14 and 16 gone. Text inputs, textareas and field specimens since the CSS round: 16 px (24 px line). The two native lists (Activity log's who, OWN-A2; Reports' sort on a phone, OWN-R12) since the press round: the select holds 16 px (24 px line), so an iPhone never zooms the page when one is tapped, and lies unseen over the control; its choice is shown by a face in label type (13.5 / 20), so the control looks as before (the widest choices: «النظام التلقائي» / "Automatic system", 167 / 199 px at 1440; «مرات الدخول الأكثر» / "Highest average", 109.4 / 105.7 px of text, the sort 186 / 182 px wide as before: reports.js rounds the face up to a whole pixel, as the native select did). Switched off (Reports while loading), the sort's face keeps the off list's look, `--ink-3` at the system's 70%, and in forced colours the select stays unseen (the rule for switched-off controls had drawn its 16 px words over the face). | N, T.tipV, G.doneTitle; Kb; R4 |

TYP-3, accepted (user 2026-09-30):

| Role | L | Size / line | Weight | Takes over (measured today) |
| --- | --- | --- | --- | --- |
| display | R | 46 / 46 | 500, tabular | card values (46) |
| title | R | 30 / 36; on a phone (720 px and below) the page title takes 19 / 28.5 | 500 | page title (30; 19 on a phone, every page alike, so «سجل النشاط» keeps one line beside the widest status: DECISIONS item 32, A1f); a value written in words, such as a time range (38) |
| heading | R | 19 / 28.5 | 500; 400 for a sentence in a card | card, section and dialog titles (19); tooltip value (20); card empty sentence (19) |
| body | R | 15 / 22.5; text fields 16 / 24 | 400 or 500 | text inputs and textareas (16, including the code face; inputs stay 44 px high; a field that stands with a row of keys in label type keeps its 16 and joins them by their edges, not their size: Activity's search, OWN-A2); the two native lists' own text, unseen (16, TYP-6); tooltip word in place of a value (14); "ready" title (16); wordmark (15) |
| label | R | 13.5 / 20 | 400 or 500 | buttons (13.5), segments (13), header chips (13), table cells (13, 13.5), card labels (14), rail names (14), field labels (13), dialog text (13.5), alerts (13), subtitle (13.5), pattern day names (13), skip link (14), the two lists' faces (13.5, TYP-6) |
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
| SPC-5 | R | **Gutters and paddings (F8):** one 16 px gutter between cards and sections in both directions; stat card padding 20; section card padding 24 (the chart card's bottom 16 is an optical exception: the time axis's 18 px line box brings its own space); dialog inset 24, with the close button's side at 12 so its glyph lines up with the 24 px content edge. The day table's bottom is 8 (Reports since step 4): its last row's own 48 px box brings the space, as the chart's axis does. | F8; user 2026-09-30; R4 |
| SPC-6 | R | **Small gaps:** 8 between an icon and its text, between buttons, between rail items, and between a label and its field; 16 between a card's head and its value (today 14, with the icon tile that F21 removes); 16 inside a legend. Controls, table cells and fields pad their text 16 at the inline sides; badges 8. | F8; user 2026-09-30 |
| SPC-7 | K | Daily is on the scale since step 3 phase B (`637b285`) (gutter 16, card padding 20, section 24 with the chart's 16 bottom, head to value 16, meta gap 8, subtitle 4, badge padding 8, cells 16, the rail 8 and 24); what follows is Reports' until step 4. Off-scale today: gutter 18 down (16 across); card padding 18 × 20; section padding 22 × 26 with bottoms 16, 10, 22 and 24; rail gap 10 and brand gap 26; meta gap 7; head to value 14; subtitle 6; field gaps 7 and 10; control and cell padding 14; badge padding 10; alert and file line 12 × 14 and 11 × 14; dialog foot 20 and gap 10; heat plate padding 2 × 4; skip link 8 × 14. Reports on the scale since step 4 phase A (R4): the header, the controls, the glance row, the pattern and day by day 16 apart; figures 20; sections 24 (day by day's bottom 8, SPC-5); head to value 16; meta gap 8; subtitle 4; field gaps 8; control and cell padding 16; badge padding 8; alert and file line 12 × 16; dialog head 16 / 24 with a 12 side, body 8, foot 24 with an 8 gap; heat plate 4; the frame's skip link. | D.*, R.*, G.* (K-08); R4 |

### 1.7 Radii, borders, elevation

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| RAD-1 | R | Five radii: 24 surfaces (card, rail, the phone's bar, dialog, sheet's top); 16 plates, scroll regions, the header's panels and the bar's items (24 less the bar's 8 inset); 12 controls, tooltips, keys and alerts, menu items, the rail tile (14 until step 3) and the bar's tile; 8 badges, pattern cells and the rail's focus label; 4 flags and swatches (today 5 and 3); full for dots, the switch and round marks. | D.*, R.*; user 2026-09-30; Fr |
| RAD-2 | K | Off the set today: the segmented control 13 (F13); rail tiles and the minute scroller 14; the icon tile, segments, sort headers and the skip link 10; flags 5. Daily since step 3 phase B (`637b285`): 24, 16, 12, 8, 4 and full only (the rail's tiles 12 since phase A, both rails); Reports' segments, sort headers and flags until step 4. Reports since step 4 phase A (R4): 24, 16, 12, 8, 4 and full only (and 1, the level bars): segments 13 and 10 → 12, sort headers 10 → 12, flags 5 → 4. | r:51, r:59, r:223, s:223, s:589 (K-09); R4 |
| BRD-1 | R | One border tint per role: `--line` for surfaces, `--line-2` for controls, `--line-3` on hover; a table row line is `.055`, a week edge `.14`. Borders are 1 px. | Keep, r:196, r:206 |
| BRD-2 | R | Elevation is the glass order: page, wash, cards and the tooltips inside them, the rail's scrim (721-1023 px), the open rail, the header's panels, the phone's bar, the dialog. Only the open rail, the bar, the header's panels and the dialog carry a shadow (SRF-6). | s:182-186, r:266; Fr |

### 1.8 Icons

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| ICO-1 | R | Drawn SVG on a 24 grid, stroke 1.6-1.8, round caps and joins, `currentColor`, no fill except dots. | s:228, r:87 |
| ICO-2 | R | An icon is sized by the text beside it: 13-15 with caption text (meta, badges, tooltip rows, errors), 16-17 with label text (buttons, notes), 18 in an icon button, 21 in the rail, 22 in an empty state. | s:228, s:306, s:553, r:87, r:95, r:233, r:300 |
| ICO-3 | R | **F21:** an icon beside a label sits in the flow, 16 px in the label's colour, 8 px before it, with no tile box. | F21; user 2026-09-30 |
| ICO-4 | K | Every card draws its icon in a bordered 34 px tile (8 cards; `icon-tile-stack`). Daily's four since step 3 phase B (`637b285`): 16 px in the flow (ICO-3); Reports' four until step 4. Reports' four since step 4 phase A (R4): 0 tiles, 16 px in the flow; "Last 7 days" carries a calendar, which has no direction (ICO-5). | s:290-300 (K-24); Kb; R4 |
| ICO-5 | R | **F19:** glyphs that show time or direction mirror in Arabic (trend arrows, entry and exit arrows, sign out, chevrons that point along the reading line). Clocks, the logo, check marks and info marks never do. | F19, `DESIGN_GUIDE` §9 |

### 1.9 Focus

| Id | L | Entry | Src |
| --- | --- | --- | --- |
| FOC-1 | R | **F18: one ring.** 2 px chalk `#F5F3F2` at a 3 px offset on every interactive element (17.47:1 on a card, 4.20:1 over FITWAY red). | s:86, F, X |
| FOC-2 | R | The inset variant, for controls packed edge to edge (segments, sortable headers, pattern cells, the items of a header panel, MNU-3) and for the header's status from 721 px, which is boxless (HDR-3): 2 px chalk at −4 px. The phone bar's items keep FOC-1: 8 px apart, their rings stay at least 4.6 px from a neighbour's name at 320 (BAR-5). | r:226, F18; Fr; R4 |
| FOC-3 | R | At least 4 px between the ring and any other content. Focus is never hidden behind sticky elements. | F18, `DESIGN_GUIDE` §13 |
| FOC-8 | R | In forced colours, focus rings and real control/field edges use system colours; current, selected, expanded and disabled states remain distinct. Crowd-level chips show all four icon bars in system colours, with filled bars identifying the level. Only chart data marks preserve their drawn colours; text uses system colours. Inset heat-cell rings have a Canvas backing. | CSS round |
| FOC-4 | R | **D4:** a collapsed rail item shows its name on keyboard focus only; the mouse hover keeps its tile state and shows no tooltip. | D4 (accepted) |
| FOC-5 | R | D4's form: the name in a tooltip-look label (SRF-3, radius 8, 32 px, label type), 12 px beyond the tile on its inline end, centred on it. Like any tooltip it floats over the first 70-110 px of content beside the rail while the item has focus (over part of the first card's value, or the page title beside the logo) and moves nothing; no placement within the rail keeps a readable name (step 3 phase B looked: the rail is 80 px, the tile 48), so it stays. | components.html; user 2026-09-30; Kb |
| FOC-6 | K | Offsets 3, 2, 1 and −4 today, and a red ring on the skip link; the chart's ring is 2 px from its "80" label. Daily's skip link has the one ring since step 3 phase A (HDR-5); since phase B (`637b285`) every Daily stop has 2 px chalk at 3 px (−4 on menu items), the plot's ring sits 4 px from the scale's labels and the minute table's region ring at 3 px. Reports' offsets and red skip ring until step 4. Reports since step 4 phase A (R4): every Tab stop 2 px chalk at 3 px, or −4 px on the header's status, the segments, the sort headers and the pattern's cell (FOC-2); the skip link's ring is the frame's chalk one. | F (K-22); Fr; Kb; R4 |
| FOC-7 | R | On a phone, focus and in-page jumps stop clear of the bar (`scroll-padding-bottom`: the bar, its inset and 16 px), and the minute table's region is never taller than the screen above the bar, so a focused element's ring is always seen (FOC-3). A finger's hold or tap on Daily's plot takes the same 16 px clearance when the page slides the plot clear of the bar (CHT-15, decision 25). | Kb; step 3 | for controls packed edge to edge (segments, sortable headers, pattern cells, the items of a header panel, MNU-3): 2 px chalk at −4 px. The phone bar's items keep FOC-1: 8 px apart, their rings stay at least 4.6 px from a neighbour's name at 320 (BAR-5). | r:226, F18; Fr |

