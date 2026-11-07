# Public: the spec fragment for DESIGN-SPEC.md §6

The coordinator merges this file as DESIGN-SPEC.md §6 (composition rows, **C**). It specifies the public crowd page the
user accepted by eye on 2026-11-05 as at `62adb061`: the page's picture stands as accepted; its spoken names changed after, at `43dad5f8` and the
verifier-fix commit that follows `V70`, with no line moved (public-redesign-r01, run spec-69, 2026-11-05): what it answers, the head, the usual day's card, the six states, every
size, the motion, the fonts, Arabic and English, every string, the Product/Spec amendments the move to production needs
(6.10, each **P**, proposed, never decided), and where the page departs from a family row (6.11). Rows `PUB-n` describe
what the page does; a row whose feature has left the page says **Gone** in one line and keeps its number; where the code
and a report disagree, the code wins and 6.12 lists each disagreement. Concept only (ADR-010), synthetic data; nothing
here is a production contract.
Concept: `public.html`, `public.css`, `public.js`, `public-copy.js` (the page's words), `public-slide.js` (a picked day's
movement), `public-ink.js` (where a text's strokes stand: the word's first stroke on the facts' edge, and the gaps taken stroke to stroke).

**The rules that decide the page**, and the file that holds each, are in `PUBLIC-RULES.md`, beside this file.

**Sources.** `file:line` is a line of the concept file at the verifier-fix commit that follows `V70` (no line moved since `43dad5f8`). Measured values name their source. Every number
this round states was measured again on that page, under the codes `P69`, `X69` and `F69`, unless it names another:

| Code | Source |
| --- | --- |
| `G1` | `D:/fitway-temp/owner-r04-one-gym/spec-measure-2/` (the one-gym round, 2026-11-05: `P69`'s script on the page after its data moved to `gym.js`, Wednesday in Tuesday's place): `states.json`, `levels.json`, `days.json`, `day-moves.json`, `picks.json`, `tabs.json`, `names.json`, `sweep.json`. That round changed figures, hours and today in the rows that quote them, and left every `file:line` pinned to the commit above; the data those lines cite now stands in `gym.js`, and the hourly-label threshold moved from 64 to 75 px an hour so the shorter days keep their look (PUB-17). |
| `P69` | `D:/fitway-temp/public-redesign-r01-spec-69/measure/all/` (script `scripts/spec-measure-69.mjs`, `pnpm verify:owner run`, port 3176, reduced motion): `states.json` (six states at 20 sizes, both languages, 240 cases), `levels.json` (160 cases), `days.json`, `day-moves.json`, `picks.json` (540 picks), `tabs.json`, `names.json`, `sweep.json` (widths 300 to 1100 px, 4 px and then 20 px steps). The run's last part (zoom) failed on a size the tool refuses; `X69` measured it. |
| `X69` | `D:/fitway-temp/public-redesign-r01-spec-69/measure/extra-3/result.json` (`scripts/spec-extra-69.mjs`, same command): zoom at 240 to 260 px and 720 × 450; Loading's stamp against Live's; the arrival; the retry; a change of day on the computer; the widths either side of 440, 600, 864 and 1024 px; the page's other switches; the motion. |
| `F69` | Frames and sheets in `D:/fitway-temp/public-redesign-r01-spec-69/` (`frames/states`, 5 sizes, 6 states, 2 languages; `frames/picks`, `frames/edges`; `sheet-states-320x568`, `sheet-states-390x844`, `sheet-picks`), `pnpm verify:owner frames`, reduced motion, opened and looked at. |
| `R63`, `R64`, `R65`, `R67`, `R68` | The reports on the page's last rounds, `D:/fitway-temp/public-redesign-r01-carry-63/REPORT.md`, `final-form-64`, `picks-65`, `fix-67`, `recheck-68`. 6.12 lists where they and the code disagree. |
| `V70` | `D:/fitway-temp/public-redesign-r01-verify-70/` (`REPORT.md`): the independent verifier's findings H1 to H16 on the accepted page and this specification. Their corrections are in the rows; 6.12 lists what was left. |
| `M45` | `D:/fitway-temp/public-redesign-r01-final-fixes-45/measure/`: `ink` (the word's ink against the facts', from the pixels), `arrival` (the arrival with motion). Cited, not re-run. |
| `M43` | `D:/fitway-temp/public-redesign-r01-fixes-43/work/digits` (Readex Pro's digit widths). Cited, not re-run. |
| `A39`, `C40`, `N40` | Why the words are as they are: `D:/fitway-temp/public-redesign-r01-arabic-39/COPY.md`, `D:/fitway-temp/public-redesign-r01-states-40/COPY.md`, and that round's `NOTES.md`. They tell an earlier page; the rows say what it does now. |

## Parts

This specification is this file, `PUBLIC-RULES.md`, and the parts below, in order. Each part has the authority of the
sections it holds; edit a section in its part, and keep each part under 40,000 bytes by splitting it at a heading. Open
the part a task needs. Rows added in this round: PUB-143 in part 1; PUB-142 and PUB-144 in part 2; PUB-145 and AMD-P7 in part 4.

- `spec/public-1.md`: 6.1 What the page answers, and its frame; 6.2 The head; 6.3 The usual day's card
- `spec/public-2.md`: 6.4 The states; 6.5 Sizes; 6.6 Motion; 6.7 Fonts; 6.8 Arabic and English
- `spec/public-3.md`: 6.9 Copy
- `spec/public-4.md`: 6.10 Product/Spec amendments for the move to production; 6.11 Where the page departs from a family row; 6.12 The code against the reports
