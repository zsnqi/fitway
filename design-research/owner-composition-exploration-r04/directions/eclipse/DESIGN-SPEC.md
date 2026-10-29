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
> components page). Tenth pass: run `owner_reports_r04_s20`, 2026-10-01, step 4 phase A, pending the user's review: the
> frame's Operations change on both pages (the user's decision of 2026-10-01: Operations leaves the rail, and the header's
> status opens its details at every size; RAI-1, HDR-3, HDR-6, HDR-7, BDG-1…4, STW-1…2, §3.13), Reports adopting the
> frame (BRK-11), Reports at 1440 recomposed with every review fix assigned to step 4 (§4.2, §7), and new open questions
> (§8). Eleventh pass: step 4 phase B, 2026-10-01, pending the user's review: the user's three refinements at 1440 (HDR-7,
> TBL-10, OWN-R2, OWN-R3, TRU-7), Reports composed at 768, 390 and 320 (OWN-R8…R11, PAT-12, BRK-5, BRK-9, HDR-4), K-29
> closed for Reports, K-38, and Q17-Q22 (§8); measured in `R4b`. Twelfth pass: step 4's build, 2026-10-01, pending the
> user's review: the user's pick of option B, "one day at a time", built as Reports' composition below 1024 px (PAT-12…14,
> OWN-R4, OWN-R5, OWN-R9…R13, BRK-6, BRK-9, BRK-11, TBL-10), Q17's baseline removed at every size (OWN-R3, TRU-7), K-29
> closed again on the new phone, K-39, and Q17 and Q20-Q22 decided (§8); measured in `R4c`. Thirteenth pass: step 4's fix
> round, 2026-10-01, pending the user's review: the user's decisions on the build (one bar a day in the week strip, PAT-13;
> no edge on the hour bars, PAT-14; the day list one plain run of days, OWN-R12; one day at a time up to 1279 px, K-39
> closed, PAT-1, PAT-2, PAT-12, OWN-R8; a span with no readings or closed one sentence with the words first, TBL-12, §8
> Q11), and Q18 and Q19 recorded as accepted (§8); measured in `R4d`. Fourteenth pass: step 4's wording round,
> 2026-10-02, pending the user's review: the user's decisions 9-13 on the phone fixes (one size and one colour for a
> no-readings, closed or waiting sentence, TBL-12, CHT-12; a single day without readings keeps its date in its place,
> TBL-12, OWN-R12; Daily's waiting sentence, CHT-12, CHT-21, STA-12; Daily's coverage list, OWN-D11), recorded in §8;
> measured in `R4e`. Fifteenth pass, 2026-10-02: the user's decision 14 (Daily's coverage list without «من … إلى …»,
> OWN-D11, §8) and the Arabic tablet peak cell on the column's right edge (OWN-R9); measured in `F14`. Sixteenth pass,
> 2026-10-02: the user's decisions 15-17 (the peak time beside its value at 721-1023 px, OWN-R9, TBL-11; Daily's coverage
> list with the middle dot and no brackets, OWN-D11; no «الأعلى» / "Highest" flag at any width, TBL-6, TBL-8, TBL-11,
> CHP-7, OWN-R12), recorded in §8; measured in `B15`. Seventeenth pass, 2026-10-04, pending review: Activity log at every
> size, in one pass (DECISIONS items 31 and the rounds' items 6 and 7; §4.3, OWN-A1…A10). It grows with every screen.
> `components.html` renders every component below in its rule form.

## Parts

This specification is this file and the parts below, in order. Each part has the authority of the sections it
holds; edit a section in its part, and keep each part under 40,000 bytes by splitting it at a heading. Open the part
a task needs.

- `spec/design-01-how-to-read.md`: 0. How to read it
- `spec/design-02-foundations-1-9.md`: 1. Shared foundations (Owner, Staff and Public); 1.1 Colour tokens; 1.2 Surfaces and glass; 1.3 Light; 1.4 Type; 1.5 Numerals; 1.6 Spacing; 1.7 Radii, borders, elevation; 1.8 Icons; 1.9 Focus
- `spec/design-03-foundations-10-11.md`: 1.10 Motion; 1.11 Breakpoints and navigation
- `spec/design-04-content-rules.md`: 2. Content rules; 2.1 Glossary; 2.2 Dates, times and ranges; 2.3 Crowd level; 2.4 State grammar; 2.5 Truthfulness
- `spec/design-05-components-1-3.md`: 3. Components; 3.1 Card and lit card; 3.2 Chart card; 3.3 Pattern (heat map)
- `spec/design-06-components-4-8.md`: 3.4 Table; 3.5 Buttons; 3.6 Segmented control; 3.7 Switch; 3.8 Date field and date picker
- `spec/design-07-components-9-15.md`: 3.9 Dialog and bottom sheet; 3.10 Chips and badges; 3.11 Rail and header; 3.12 Empty state, alert and retry; 3.13 The status's details, and the phone's bar, badge and menu; 3.14 States: placeholders and the status words; 3.15 Person and access record rows
- `spec/design-08-owner-today-reports.md`: 4. Owner surface; 4.1 Today (Daily); 4.2 Reports
- `spec/design-09-owner-activity.md`: 4.3 Activity log
- `spec/design-10-owner-access.md`: 4.4 Access; 4.4.1 Product/Spec amendments for the move to production
- `spec/design-11-staff-public-issues.md`: 5. Staff; 6. Public; 7. Known issues register
- `spec/design-12-open-questions.md`: 8. Open questions for the user; Decided 2026-10-02 (decisions 15-17); Decided 2026-10-02 (step 4's wording round); Decided 2026-10-01 (step 4's fix round); Decided 2026-10-01 (step 4's build, the user's pick of option B); Decided 2026-10-01 (step 4 phase A); Answered 2026-10-01; Answered 2026-09-30
