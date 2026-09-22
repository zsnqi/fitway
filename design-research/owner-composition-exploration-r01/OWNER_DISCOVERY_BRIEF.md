# Owner discovery brief — interview and diagnostic record

> Status: **human-interview and diagnostic evidence only.** This brief is not an accepted
> design, a milestone concept, production or visual authority, a canonical, or a promotion
> decision. Owner composition authority remains vacant under ADR-009. The existing
> Product/Spec/Design Guide production baseline remains in force; any departure needs the active
> packet's exploration envelope and a later, explicit human promotion decision.

## What this record is for

This records the first human read of the three fresh-round Owner directions and the supplied
Arabic dropdown screenshot. It is a compact discovery input for the next Owner exploration slice,
not a replacement for the concept-selection, accessibility, perceptual, or promotion gates.
The observations are directional rather than a list of narrow bans or fixed style recipes.

The three directions were reviewed as:

1. **Direction 1 — Night Relay** (`fresh-round-20260922/direction-01/`)
2. **Direction 2 — Cadence Atelier / مرسم الإيقاع**
   (`fresh-round-20260922/direction-02/`)
3. **Direction 3 — The Timing Gate** (`fresh-round-20260922/direction-03/`)

The earlier Owner prototypes, Public/Staff surfaces, and Paper frames are not future Owner design
references. They may remain provenance or authority-boundary evidence where the repository names
them, but they are not a source for the next Owner visual world.

## First-glance priority

The Owner overview should make the current gym state legible first, then make today's trend
legible without asking the reader to decode a dashboard. In practical terms, the first glance
should answer:

- Is the gym open, closed, stale, unavailable, loading, or in an error state, and how trustworthy
  is the observation?
- What is the current crowd band / approximate occupancy when a usable reading exists?
- What happened across today's observed hours: direction, peak, coverage, and notable exceptions?

Reports, governance, and operational investigation can follow that calm orientation. This is a
priority signal from the interview, not a prescribed component topology.

The desired character is premium and confident, with a calm, clear overview that still carries
gym energy: a dark black/red foundation, supporting colors and lighter breathing room, lively
depth, and intentional motion. Bilingual typography should be fitted to each concept's world and
to Arabic RTL / English LTR rather than mechanically mirrored. These are search-space qualities,
not locked token values or a narrow visual ban list.

## Direction readout

| Direction | Human read | What, if anything, carries forward |
| --- | --- | --- |
| 1 — Night Relay | **Rejected.** Cyan / light-blue / greenish cards diluted the intended gym character. The red/orange accents felt faded, the font felt too thin, and there was no complete idea worth retaining. The Reports table was only mildly acceptable. | No element is endorsed for carry-forward; the Reports table was only comparatively less objectionable. Do not carry the direction's palette, font voice, or card treatment forward. |
| 2 — Cadence Atelier | **Slightly better, still rejected.** The colors, font, and overall style still did not feel right. The chart slider was specifically disliked and did not earn its interaction cost. | Progressive reading of the day may remain a question, but not this material treatment or slider interaction. |
| 3 — The Timing Gate | **Best of the three, still rejected.** Section transitions / reveals and progressive disclosure were useful. Reports lacked visual hierarchy; the chart and table felt awkward and competed with one another. Repeated hard-edged bordered boxes made the whole system cramped and too technical. | Retain the discovery that transitions, reveals, and progressive disclosure can support a calm overview. Reconsider the Reports hierarchy and simplify the material language rather than copying this topology. |

“Best” here means best relative to these three rejected explorations; it is not concept approval.

## Brand and place observations

Public photos associated with [Google Maps — Samtah Fit Way](https://www.google.com/maps/?cid=9354196717797022262)
show a substantial white FITWAY wordmark on a broad red fascia / dark exterior, red-and-black
equipment, bright geometric white lighting, and some lighter lockers. These are observations from
public photos, not an official brand guide and not a token specification. The local logo reference
is [`brand/fitway-logo.png`](../../brand/fitway-logo.png).

The useful implication is a premium training-place energy with a clear red/black anchor and room
for lighter support surfaces. It does not prescribe a literal exterior treatment, fixed contrast
values, or a single material system for future Owner work.

## Dropdown evidence: screenshot diagnosis only

The supplied screenshot is preserved at
[`evidence/owner-dropdown-ar-open.png`](evidence/owner-dropdown-ar-open.png). It shows the
Arabic value **مفتوح** (“open”). In RTL, the arrow appearing on the left is expected. The visible
flaw is that the chevron / indicator sits too close to the left border; the value itself is not the
issue shown. The screenshot does not justify a pixel measurement.

This is a screenshot diagnosis only. Browser measurement was denied for this record, so no claim
is made about computed geometry, device-pixel spacing, zoom behavior, or cross-browser rendering.
The source inspection supports the following hypothesis:

- Direction 3 renders native selects in `fresh-round-20260922/direction-03/app.js:19-23`.
- Its compact state control is in `fresh-round-20260922/direction-03/style.css:10`, including
  `.state-control select` with `padding: 5px 9px`; no explicit `appearance` override, wrapper-owned
  chevron, or logical icon inset is present there.
- Directions 1 and 2 also use native `<select>` controls: Direction 1 adds the reading selector
  in `fresh-round-20260922/direction-01/app.js:22,24,32`, and Direction 2 uses selects in
  `fresh-round-20260922/direction-02/app.js:29,33,35`. Their compact control padding should be
  treated as a related diagnostic, not as measured proof of the screenshot's geometry.

### Future fix hypothesis (not implemented here)

Keep native `<select>` semantics and keyboard behavior. If the visual treatment is revisited,
remove only the native painted appearance inside a deliberately owned wrapper, place the chevron
at the wrapper's logical `inset-inline-end`, and reserve matching `padding-inline-end` on the
select so Arabic and English values clear the icon. Verify the result in RTL and LTR at desktop
and mobile widths, at zoom / reflow, with label clearance, and through keyboard and focus states.
The relevant platform references are [MDN `<select>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select),
[MDN `appearance`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/appearance),
and [MDN `padding-inline-end`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/padding-inline-end).

No production UI or concept artifact is changed by this hypothesis.

## Boundaries for the next slice

- Treat this brief as evidence to shape a fresh Owner visual world, not as acceptance authority.
- Do not promote a dark/red departure, a light departure, a chart treatment, or a disclosure model
  from this record without the packet envelope, concept gate, perceptual review, and explicit human
  decision.
- Do not reuse the rejected directions' palette, font voice, hard-edged repeated-box language,
  or slider merely because it appears in a prototype.
- Do not turn the preferred qualities above into narrow bans or fixed style rules before a new
  whole-page direction is articulated and reviewed.

## Evidence index

| Evidence | Location / checksum | Interpretation |
| --- | --- | --- |
| Human direction readout | This brief; fresh-round source folders named above | Comparative interview evidence; not visual acceptance. |
| Arabic dropdown screenshot | `evidence/owner-dropdown-ar-open.png`, 1,511 bytes, SHA-256 `590da9b4506ebbc9bad710121a3686ff4a2cd276270a2e74cc2afd5dceeea88` | Confirms visible “مفتوح”, expected RTL arrow-left, and the chevron / indicator too close to the left border. Browser measurement was not available. |
| Brand observation | Google Maps public-photo link above; `brand/fitway-logo.png` | Place / public-photo observation, not official brand authority. |
| Governing boundary | `docs/adr/ADR-009-owner-composition-authority-supersession.md`; `docs/WORKFLOW.md`; active packet | Owner composition remains vacant; exploration and promotion are separate gates. |
