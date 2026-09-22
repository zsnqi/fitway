# The Dayline — frame and check manifest

**Status:** concept-only review evidence, not visual acceptance or authority. Rendered from `index.html` through the localhost static server rooted only in this direction folder. The `capture.mjs` script used Chromium through the repository's installed Playwright runtime, with reduced motion enabled. All values are illustrative. The in-app Browser connection was unavailable in this worker environment, so repository Playwright supplied repeatable captures.

## Exact frames personally inspected

The direction-02 designer opened and visually inspected the following final PNG files after the last stylesheet and state edits. The four viewport anchors were inspected at their exact pixel size; full-page mobile frames were opened separately to check the whole reading order. The 320 CSS-pixel reflow capture used device scale factor 2, producing a 640 physical-pixel-wide image.

| Frame | Fixture and purpose | SHA-256 |
| --- | --- | --- |
| `frames/dayline-en-desktop-1440x900.png` | English, completed populated day and independent current gym state | `3bc9f7ccadf6703c657761728818321d260a8e84de5d925a115709c283c9d6e7` |
| `frames/dayline-ar-desktop-1440x900.png` | Arabic RTL, same facts and reverse time geometry | `518ef199e21e9d2c9920f5bf9d339fd13ce8bc7753d5d8b7e85565b2249ca3f9` |
| `frames/dayline-en-mobile-390x844.png` | English first viewport | `b3522c47abeea23aba9e534e74a601d154a4af5d1c55c4d06cafa2ebd7dd3c27` |
| `frames/dayline-ar-mobile-390x844.png` | Arabic RTL first viewport | `b3e20ae8056842e1a51a84f47da2cdab5cb1ef54e0f6a8521dbd0b9a3b3f9400` |
| `frames/dayline-en-mobile-full-390.png` | English full-page reading order | `b8bfad5d90fd3fa0478f90e9e99978bdad5b50953b15155e69f7f2545805f500` |
| `frames/dayline-ar-mobile-full-390.png` | Arabic full-page reading order | `98cb74abe905d0742fa554544f80486e19e200620e48ccb59f8964b11b485f73` |
| `frames/dayline-ar-reflow-320-200pct.png` | Arabic, 320 CSS pixels at device scale 2, full page | `8af44f6c64ed5ae50265a8124b2ce1b2218d801992e85a0d19b304a276ab8ad2` |
| `frames/dayline-en-stale-desktop-1440x900.png` | Distinct last-known gym state, no live implication from the historical curve | `cf13d8926611486a57323f99971055c824885b48914495ae071b08532cec813e` |
| `frames/dayline-ar-closed-mobile-390x844.png` | Closed gym and closed selected day, no occupancy values | `82f787facb1f6da759b59367957d38a8faa2cdee72e22a07a44b8280cb9d768c` |
| `frames/dayline-en-no-readings-mobile-390x844.png` | Independent unavailable current state and no observed day readings | `e1da317dbbb9f38c2b1a88f95af173bca47039859861dafa40b6cfd114777b80` |
| `frames/dayline-en-loading-mobile-390x844.png` | Both independent queries loading | `cb36e05f51252f417efc2eb2318921e6c064cf17c28f228b17595d44603ee55b` |
| `frames/dayline-ar-error-mobile-390x844.png` | Separate current-state and day-record request errors with their own retry actions | `85c8427953a54dfa664b648d27aa34b0d44a8b3eab394f911f530af611631188` |

## Executed checks

- `node --check app.js`: passed.
- `scripts/check-design-context.mjs`: passed with host child-process permission; resolved FITWAY Product/Design routers and Impeccable 4.0.0.
- `capture.mjs`: passed. `frames/capture-results.json` records the measured viewport, document direction, heading, state mode, and scroll widths for the captures.
- No document-level horizontal overflow in English or Arabic at 320, 360, 390, 721, 768, 820, 1024, 1200, and 1440 CSS pixels. The 320 CSS-pixel/device-scale-2 capture also measured `scrollWidth = clientWidth = 320`.
- Keyboard Tab first reached the skip link. A plotted point received a visible solid focus outline and Enter changed the persistent detail dock from the default peak to `7:10 AM · 7 people · Quiet`. Opening the minute record revealed its labeled table. Switching language changed `lang` to `ar`, `dir` to `rtl`, and the heading to `مسار اليوم`.
- An Impeccable detector pass found small mobile functional text; the final stylesheet enlarged chart keys, time labels, annotation text, and mobile button text. The detector also flagged the chart's measurement grid as a repeating gradient; it is intentionally the plot grid, not a decorative page texture. The main plane's border/shadow combination was resolved by removing the shadow. A design-context pass or detector result is never perceptual acceptance.

## Visual judgment and limits

The final inspected frames show one clear historical trajectory, a separate current-state strip, a visible break for missing minutes, and RTL chronology that reverses time without reversing the dataset. The full mobile pages retain the sequence through the detailed-record disclosure and footer. Loading, error, closed, and no-readings frames remove unsupported counts and the historical path. The 320/200% frame reflows without page overflow; the detailed table is intentionally a separately scrollable, labeled region.

These are static concept fixtures. They do not exercise production APIs, authorization, translation catalogs, real daily timezone changes, or screen reader output. The current operational snapshot is an explicit later integration dependency. Human concept selection and independent perceptual/accessibility review remain outstanding.
