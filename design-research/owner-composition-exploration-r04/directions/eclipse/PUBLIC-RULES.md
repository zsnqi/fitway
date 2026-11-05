# Public: the rules that decide the page

**Must-haves: the level, the approximate count, open or closed, the last update, the percentage, today's curve.** Only the user's clear word removes one (`docs/agent-context/WORKING_AGREEMENTS.md`, 2026-11-05).
In the rows: the level PUB-8, the count PUB-10 and PUB-69, open or closed PUB-36 and PUB-92, the last update PUB-33 and
PUB-34, the percentage PUB-10 and AMD-P1, today's curve PUB-14 and AMD-P2.

Each row names a rule, the row that applies it (`PUB-` in `PUBLIC-SPEC.md`'s parts) or the family it comes from, and the
file that holds it. Concept only (ADR-010); an `AMD-P` row is a proposal, never decided. `spec/` is beside this file.

| Rule | Id | File that holds it |
| --- | --- | --- |
| Concept composition; nothing here is a production contract | ADR-010 | `docs/adr/ADR-010-public-composition-authority-supersession.md` |
| An honest, current estimate; the labeled band is the primary truth | PUB-1, TRU-2 | `FITWAY_PRODUCT.md` lines 5, 7 |
| No visitor identity, image or per-visitor data | PUB-1 | `AGENTS.md` line 7 |
| Stale, absent, closed or loading data never looks live | PUB-31 to PUB-38 | `AGENTS.md` line 7 |
| Anonymous, read-only, no operational control | PUB-1, PUB-127 | `FITWAY_PRODUCT.md` line 20 |
| The six states and what each removes | PUB-31 to PUB-38 | `DESIGN_GUIDE.md` lines 188-194 |
| Unavailable removes count, band, level mark and timestamp | PUB-35 | `DESIGN_GUIDE.md` line 192 |
| Unavailable's "Explain that old data …" is departed from; change proposed | PUB-142, AMD-P7 | `DESIGN_GUIDE.md` line 192; `spec/public-4.md` |
| Status is text plus a non-colour cue | PUB-31, STW-1 | `DESIGN_GUIDE.md` line 196; `spec/design-07-components-9-15.md` |
| Loading's skeleton, its delay, one announcement | PUB-32, STA-10, PH-1, PH-3 | `DESIGN_GUIDE.md` line 199; `spec/design-04-content-rules.md`; `spec/design-07-components-9-15.md` |
| The percentage: approved in principle, not in v1 | AMD-P1, TRU-6 | `docs/spec/06-interfaces-and-contracts.md` line 22 |
| The usual day's curve: approved in principle, not in v1 | AMD-P2 | `docs/spec/06-interfaces-and-contracts.md` line 34 |
| Now against the usual; "About usual" within ±10% | AMD-P3, TRU-5, GLO-10 | `spec/design-04-content-rules.md`; `spec/public-4.md` |
| Every size 320 to 1440 px, no sideways overflow | PUB-39 | `FITWAY_PRODUCT.md` line 50 |
| Nothing moves when the state changes, at any size | PUB-31, PUB-38, PUB-53 | `spec/public-2.md` (the user's word) |
| Nothing scrolls on a phone or a designed size; what is not met | PUB-31, PUB-144 | `spec/public-2.md` (the user's word) |
| Unavailable's blank band stays, so the card never moves | PUB-141 | `spec/public-4.md` (the user's word) |
| No sentence under Unavailable | PUB-142 (`note=none`) | `spec/public-2.md` |
| A whole day's answer is the short line | PUB-143 (`whole=line`) | `spec/public-1.md` |
| Arabic by default, English a link; logical properties; a reflection | PUB-64, PUB-57 | `FITWAY_PRODUCT.md` line 52 |
| Western digits, 12-hour clock | NUM-1, DAT-1, PUB-58 | `FITWAY_PRODUCT.md` line 54; `spec/design-02-foundations-1-9.md`; `spec/design-04-content-rules.md` |
| Dark only | PUB-54 | `FITWAY_PRODUCT.md` line 58 |
| Readex Pro and its weights | TYP-1, TYP-2, TYP-5, PUB-54, PUB-115 | `spec/design-02-foundations-1-9.md` |
| Numbers: tabular where the face has them | NUM-2, NUM-3, PUB-139 | `spec/design-02-foundations-1-9.md` |
| Colour, light, surfaces, icons | COL-15, COL-16, LGT-1, LGT-3, LGT-7, LGT-11, SRF-1, ICO-5 | `spec/design-02-foundations-1-9.md` |
| Focus | FOC-1, FOC-2, PUB-120 | `spec/design-02-foundations-1-9.md` |
| Motion | MOT-1, MOT-7, MOT-20, PUB-119, PUB-121 | `spec/design-03-foundations-10-11.md` |
| The chart's input: a bar's stops and keys | CHT-15, PUB-19 | `spec/design-05-components-1-3.md` |
| The words of level, count, state, day | GLO-2, GLO-3, GLO-7, GLO-9, GLO-13, GLO-15, GLO-17, DAT-3 | `spec/design-04-content-rules.md` |
| The state lines | STA-1, STA-11, STA-12, STA-13, PUB-118 | `spec/design-04-content-rules.md` |
| What may be claimed of the data | TRU-3, TRU-6, LVL-1, LVL-5 | `spec/design-04-content-rules.md` |
| Status, retry and empty forms | STW-1, STW-2, EMP-3, EMP-5 | `spec/design-07-components-9-15.md` |
| Arabic copy is فصحى مبسطة | 6.9 | `.claude/skills/ux-araby` |
