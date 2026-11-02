# Public: the spec fragment for DESIGN-SPEC.md §6

The coordinator merges this file as DESIGN-SPEC.md §6 (composition rows, **C**). It specifies the public crowd page as
built at `27758b4e` (public-redesign-r01, run spec-42, 2026-11-02), as the reviews' fix round changed it (run
fixes-43, 2026-11-02) and as the final verifier's fix round changed it (run final-fixes-45, 2026-11-02; rows either
round changed say so): what it answers, the head, the usual day's card,
the six states, every size, the motion, the fonts, Arabic and English, every string, the Product/Spec amendments the
move to production needs (6.10, each **P**, proposed, never decided), and where the page departs from a family row
(6.11). Rows `PUB-n` describe what the page does; where the code and the run notes disagree, the code wins and 6.12
lists each disagreement. Concept only (ADR-010), synthetic data; nothing here is a production contract.
Concept: `public.html`, `public.css`, `public.js`, `public-copy.js` (the page's words), `public-slide.js` (a picked day's
movement, since final-fixes-45).

**Sources.** `file:line` is a line of the concept file in the commit that holds this specification (final-fixes-45's;
the earlier rounds' lines were carried to it). Measured values name their source; `P42` values the fix round did not
change were measured again in `P43` and agree, and `P43` values final-fixes-45 did not change were measured again in
`P45` and agree:

| Code | Source |
| --- | --- |
| `P42` | `D:/fitway-temp/public-redesign-r01-spec-42/measure/spec-1/spec-measure.json` (script `scripts/spec-measure.mjs`, `pnpm verify:owner run`, port 3176): Live at Busy at 320 × 640, 360 × 780, 375 × 667, 390 × 844, 412 × 915, 430 × 932, 600 × 960, 768 × 1024, 1023 × 768, 1024 × 768, 1280 × 720, 1366 × 768, 1440 × 900, 1920 × 1080 and 720 × 450 (1440 × 900 at 200%), Arabic and English, reduced motion: every size and box, each weekday's bars, labels and answer, each level's and each state's word. |
| `P42x` | `measure/extra-1/spec-extra.json` (`scripts/spec-extra.mjs`): the Tab order in Live, Loading and Error at 390; Thursday's lone last hour at 360 and 390; the head's rows at each level at 320, 360 and 390. |
| `F42` | Frames and sheets in `D:/fitway-temp/public-redesign-r01-spec-42/` (`frames/states`, `frames/sizes`, `frames/card`, `frames/levels`; `sheet-*`), `pnpm verify:owner frames`, reduced motion, opened and looked at. |
| `S40` | The states round's measures, `D:/fitway-temp/public-redesign-r01-states-40/` (`NOTES.md`, "Measured this round"): zero movement across day changes, the arrival, the states' geometry, 426 picks. Cited, not re-run. |
| `P43` | `D:/fitway-temp/public-redesign-r01-fixes-43/measure/spec-b/spec-measure.json`: `P42`'s script, run again on the fix round's page (port 3186). |
| `M43` | The fix round's measures, `D:/fitway-temp/public-redesign-r01-fixes-43/measure/` (scripts in `../scripts/`, `pnpm verify:owner run`, port 3186, reduced motion unless named): `levels-b` (every level, 17 sizes, both languages, Live and Delayed: every box under the word), `fixes-b` (ranges, ink, gaps, line ends, keys, step keys, labels, sizes, words), `f1-b`, `arrival-b`, `picks-labels-b`, `geometry-b`, `word-line-b` (the states round's scripts, run again), `gap-b` (the air before the Live stamp), and `../work/digits` (Readex Pro's digit widths). |
| `F43` | Frames and sheets in `D:/fitway-temp/public-redesign-r01-fixes-43/` (`frames/states`, `frames/sizes`, `frames/pick`; `sheet-states`, `sheet-sizes`), opened and looked at. |
| `P45` | `D:/fitway-temp/public-redesign-r01-final-fixes-45/measure/spec/spec-measure.json`: `P42`'s script, run again on final-fixes-45's page (port 3186). |
| `M45` | final-fixes-45's measures, `D:/fitway-temp/public-redesign-r01-final-fixes-45/measure/` (scripts in `../scripts/`, `pnpm verify:owner run`, port 3186, reduced motion unless named): `arrival` (every head box, Loading's shown skeleton against Live and against its own arrival, every level, nine sizes, both languages; the hour labels; the voice), `checks` (the gap to the status line in every state, the stamp's air at every level, the step keys, the keys' release), `sizes` (the word, the count and the plot either side of 600 and 1024 px in 2 px steps, and across the blend in 10), `ink` (the word's ink against the facts', from the pixels), and `levels`, `f1`, `picks`, `geometry`, `word-line`, `regress` (the earlier rounds' scripts, run again). |
| `F45` | Frames and sheets in `D:/fitway-temp/public-redesign-r01-final-fixes-45/` (`frames/states`, `frames/sizes`, `frames/pick`, `frames/edges`; `sheet-states`, `sheet-sizes`, `sheet-extra`), opened and looked at. |
| `A39`, `C40` | The words: `D:/fitway-temp/public-redesign-r01-arabic-39/COPY.md` and `D:/fitway-temp/public-redesign-r01-states-40/COPY.md`. |

## Parts

This specification is this file and the parts below, in order. Each part has the authority of the sections it
holds; edit a section in its part, and keep each part under 40,000 bytes by splitting it at a heading. Open the part
a task needs.

- `spec/public-1.md`: 6.1 What the page answers, and its frame; 6.2 The head; 6.3 The usual day's card
- `spec/public-2.md`: 6.4 The states; 6.5 Sizes; 6.6 Motion; 6.7 Fonts; 6.8 Arabic and English
- `spec/public-3.md`: 6.9 Copy
- `spec/public-4.md`: 6.10 Product/Spec amendments for the move to production; 6.11 Where the page departs from a family row; 6.12 The code against the notes
