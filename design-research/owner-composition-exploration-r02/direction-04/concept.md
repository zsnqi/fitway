# Direction 04 — The Black Folio / الملف المفتوح

> **Concept-only Owner exploration.** This is an isolated, synthetic preview. It is not an accepted design, visual authority, production implementation, canonical frame, or source of live Fitway data. Owner composition authority remains vacant under ADR-009.

## Thesis

The Owner first sees one composed statement about the floor, with its trust qualifier and approximate crowd band. A smaller historical trace answers how the observed day has moved. The next action opens the day record; only then does the page present one investigation question at a time. Reports, system health, and governance are named as separate follow-on areas, away from the first-glance decision.

This is an **orientation-to-investigation** composition, not a metric grid or a ledger of equal sections. Its material is a continuous, warm-black folio with one red seam, a recessed historical field, and an ivory record sheet. Surface changes communicate a change in reading depth. The typography stays strong and compact in Cairo's available 400/500/600/700 weights. Red identifies the Fitway energy and the observed curve; a neutral warm interval identifies scheduled closure, and an earthy interruption identifies missing readings. Neither hue alone carries state meaning.

## Reading path

1. **Orientation:** A plain-language open, closed, delayed, unavailable, loading, or error statement is the focal point. A usable fresh snapshot may also show the crowd band and approximate count. Stale retains an expressly last-known value. All other states remove the count and band.
2. **Historical glance:** Selected readings through the stated gym-local time show the observed shape, peak, and exact displayed-checkpoint coverage. It does not imply a full-day denominator or classify unelapsed future minutes as missing. It remains labeled as historical even when the current snapshot is unavailable.
3. **Day record:** A larger curve distinguishes observed zero from a gap and scheduled closure. The equivalent selected-reading table can be opened by keyboard or pointer. The preview's 13 displayed checkpoints comprise 10 observed open readings, 2 absent open readings, and 1 closed checkpoint; the visible coverage is exactly **10 of 12 displayed open checkpoints**.
4. **Investigation:** Three questions reveal one answer at a time: busiest observed moment, incomplete record, broader reporting. Focus remains on the activated button; the answer region updates politely. Empty historical states replace those questions with a single honest explanation.
5. **Beyond the day:** Reporting, system incidents, and access/settings are distinct destinations in the Owner workspace. The standalone preview shows them as labels and does not invent working routes.

## Data truth and fixture contract

The production `admin.analytics.daily` response supplies historical `value | closed | missing` buckets, peak, and observation coverage. It supplies **no current occupancy snapshot or freshness**. A future Owner implementation could separately request the already authorized `staff.operationalSnapshot` to establish current open/closed/fresh/stale/unavailable truth and health. A failed snapshot request must remain a request error; it must not be inferred from the most recent historical bucket or silently called live. The `?state=` fixture switch in this static preview stands in for those separate outcomes and makes no network request.

The fixture's current estimate is an illustrative 18 at 11:41 AM. The historical checkpoints run through 11:42 AM. The two are deliberately separate. All dates, times, bands, counts, and coverage are deterministic review data. No visitor identity, frame, image, video, biometric, per-visitor value, or live gym datum is stored or transmitted. The static file has no storage or request code.

| Query | Current statement | Historical statement |
| --- | --- | --- |
| `state=populated` | Open, fresh, Quiet, about 18, timestamped | 10 of 12 displayed open checkpoints; zero, gap, and scheduled closure differentiated |
| `state=stale` | Last-known 18 at 11:12 AM, visibly delayed | Historical day remains historical |
| `state=unavailable` | No current count or band | Historical day remains historical |
| `state=closed` | Closed by schedule, no current count or band | No scheduled open hours in this fixture; no trend |
| `state=no-readings` | Current value unavailable | Scheduled open hours, but no usable history; no invented zero or trend |
| `state=loading` | No current value yet | No chart before the record resolves |
| `state=error` | Request failure, no retained current value, retry | Historical request failure, no chart |

The preview uses `?lang=en` or `?lang=ar`. Arabic is RTL and English LTR. Western digits are used in both. Times are written in the fixture's gym-local convention. No percentage or capacity leaks to a public surface; this is an authenticated Owner concept, and the preview does not expose capacity at all.

## Responsive and motion intent

At 1440, the first folio has unequal fields, so the current reading dominates and the historical trace sits beside it. At 721–820, the fields stack with the current reading first; at 390 and 320, the same reading order remains, with the full record and questions in one column. English and Arabic compose from their reading edges rather than mirroring text in place. The curve's time geometry reverses in RTL. Focus rings, a skip link, live status text, a semantic table, and large question controls support keyboard and assistive use. Reduced motion removes scrolling animation. The page has no animated readings, chart-at-rest movement, slider, or decorative entrance.

## Review boundaries

This direction responds to the non-authoritative Owner discovery brief's calm-first, progressive-reading questions. It does not reuse rejected r01 palettes, thin typography, slider, repeated boxes, previous Owner topology, Public/Staff composition, or Paper frames. The dark/red exploration is a concept choice, not a new production token or theme decision. Production, shared tokens, canonical screenshots, Paper, approvals, and visual-authority records remain unchanged. A later human concept decision and separate perceptual/accessibility gates would be required before implementation or promotion.

## Render inspection record

The concept author personally opened the exact final Chromium frames `frames/en-desktop-1440x900-populated.png`, `frames/ar-desktop-1440x900-populated.png`, `frames/en-mobile-390x844-populated.png`, `frames/ar-mobile-390x844-populated.png`, `frames/en-mobile-390-full-populated.png`, `frames/ar-mobile-390-full-populated.png`, `frames/en-reflow-320css-200pct.png`, and `frames/ar-reflow-320css-200pct.png`. The full mobile frames show the complete progression from orientation to day record, one active question, and separate follow-on areas. The Arabic chart and directional arrows follow RTL; the English chart follows LTR. The 320 CSS px / 2× reflow frames wrap headings, record labels, questions, and the semantic-table control without page overflow. The author also opened the exact `en-mobile-390-stale`, `ar-mobile-390-unavailable`, `en-mobile-390-closed`, `ar-mobile-390-no-readings`, `en-mobile-390-loading`, and `ar-mobile-390-error` frames to check that unavailable or absent data does not appear current. These are author observations, not human visual acceptance or a promoted baseline.

`capture.mjs` checked both locales at 320, 360, 390, 721, 768, 820, 1024, 1200, and 1440 CSS px for document-level horizontal overflow, verified the state matrix's hidden counts, and exercised keyboard activation, one-at-a-time disclosure, and the equivalent table. Its latest run reported no programmatic failures; `manifest.json` records the exact frame checksums. Browser inspection and these checks do not replace the independent perceptual and human gates.

## Open the preview

Open `index.html?lang=en&state=populated` or `index.html?lang=ar&state=populated` as a local file. Change `state` to any row above to inspect truthful failure and absence treatments. `capture.mjs` reproduces the named review frames with the repository's installed Playwright.
