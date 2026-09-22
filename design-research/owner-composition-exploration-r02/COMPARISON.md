# Owner composition exploration r02 — four directions

Four independently designed, concept-only Owner page directions. They use synthetic fixtures and do not change the production Owner UI, shared tokens, canonical frames, Paper, or visual authority. None is selected or approved for implementation.

## Human outcome — 23 September 2026

The user reviewed all four and rejected them: they feel too similar, and the colors, shapes, ordering, and charts do not work for the intended Owner redesign. Preserve these artifacts as diagnostic evidence only; do not use any of them as a visual reference for a successor. The user clarified that the current production Owner interface has an overall style worth keeping approximately while its many problems are redesigned. The next task must inspect that running interface and reset its design brief around this preference.

| Direction | First-glance question | Composition and distinguishing choice | Open preview |
| --- | --- | --- | --- |
| [01 — The Evidence Line / خط الدليل](direction-01/concept.md) | What can we say about the floor now? | A continuous dark register separates the current-state boundary from recorded-day evidence. | [Standalone preview](direction-01/index.html) |
| [02 — The Dayline / مسار اليوم](direction-02/concept.md) | How did the observed day unfold? | One broad time instrument makes observed peaks and gaps the page's main structure. | [Standalone preview](direction-02/index.html) |
| [03 — The Day Ledger / سجلّ اليوم](direction-03/concept.md) | How complete and sourced is each part of the record? | A warm record sheet pairs discrete hour readings with coverage and source. | [Standalone preview](direction-03/index.html) |
| [04 — The Black Folio / الملف المفتوح](direction-04/concept.md) | What matters now, and what should I inspect next? | A calm opening statement leads into the day record and one investigation question at a time. | [Standalone preview](direction-04/index.html) |

## Exact populated comparison frames

All captures were inspected at the named desktop and mobile sizes in English LTR and Arabic RTL. Each direction folder also contains full-mobile, reflow, and state captures with a frame manifest. The recorded 320 CSS-pixel / DPR2 captures for directions 02–04 show equivalent narrow-layout geometry; they are not a claim that browser zoom itself was exercised.

| Direction | English desktop 1440×900 | Arabic desktop 1440×900 | English mobile 390×844 | Arabic mobile 390×844 |
| --- | --- | --- | --- | --- |
| 01 | [Frame](direction-01/frames/en-desktop-1440x900.png) | [Frame](direction-01/frames/ar-desktop-1440x900.png) | [Frame](direction-01/frames/en-mobile-390x844.png) | [Frame](direction-01/frames/ar-mobile-390x844.png) |
| 02 | [Frame](direction-02/frames/dayline-en-desktop-1440x900.png) | [Frame](direction-02/frames/dayline-ar-desktop-1440x900.png) | [Frame](direction-02/frames/dayline-en-mobile-390x844.png) | [Frame](direction-02/frames/dayline-ar-mobile-390x844.png) |
| 03 | [Frame](direction-03/frames/en-desktop-1440x900.png) | [Frame](direction-03/frames/ar-desktop-1440x900.png) | [Frame](direction-03/frames/en-mobile-390x844.png) | [Frame](direction-03/frames/ar-mobile-390x844.png) |
| 04 | [Frame](direction-04/frames/en-desktop-1440x900-populated.png) | [Frame](direction-04/frames/ar-desktop-1440x900-populated.png) | [Frame](direction-04/frames/en-mobile-390x844-populated.png) | [Frame](direction-04/frames/ar-mobile-390x844-populated.png) |

## Shared data boundary

The Daily Analytics response is historical and has no current snapshot or freshness field. A direction may show a current reading only from a separately identified operational-snapshot fixture; otherwise it says the current value is unavailable. Recorded zero, missing reading, scheduled closure, loading, and request error have separate treatments. Coverage denominators and observation cutoffs are stated so future scheduled minutes are not mistaken for a historical outage.

The coordinator inspected the named English and Arabic desktop, mobile, and reflow frames. A separate focused reviewer found no blocking issue for comparison, but that was not an aesthetic approval. The subsequent human review rejected all four. Accessibility/perceptual acceptance, implementation, and any visual-authority promotion were not reached.
