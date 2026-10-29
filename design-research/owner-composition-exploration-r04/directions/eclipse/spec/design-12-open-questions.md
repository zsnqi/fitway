<!-- Part of DESIGN-SPEC.md; the index and the rule for editing are in DESIGN-SPEC.md. -->

## 8. Open questions for the user

No question is open. Decisions 9-13, the user's picks on the phone fixes, decision 14 on the coverage list, and decisions 15-17 are recorded below (2026-10-02). Q18 and Q19, from step 4 phase B, were accepted by the user on 2026-10-01 and are recorded in the fix round (below); Q11 was answered a third time there (decision 8). Q17 and Q20-Q22 were decided by the user's pick of 2026-10-01 (option B) and its build (below). Q12-Q16, from step 4 phase A, were decided by the user on 2026-10-01, all accepted (below). Q1 and Q2 were answered on 2026-10-01 with step 3 phase B's proposal, built on Daily (below). Q3-Q11 were answered on 2026-09-30, each with the sheet's proposal (below); Q11 was re-answered on 2026-10-01.

### Decided 2026-10-02 (decisions 15-17)

Built on `ca70f44` and measured in `B15`.

- **Decision 15** (OWN-R9, TBL-11): **the peak time beside its value at 721-1023 px**, as in the inline preview the
  user accepted (`user 2026-10-02`): one line, the value on the column's right edge, the time 8 px toward the left;
  every number in a row shares one baseline (0 px, AR and EN), including the fix for the preview's Arabic time 2 px
  above the value's baseline. The day list below 721 px and the cell from 1024 px are unchanged.
- **Decision 16** (OWN-D11): **the coverage list's duration after a middle dot, no brackets** (`user 2026-10-02`):
  «2:14 م – 2:31 م · 18 دقيقة» / "2:14 PM – 2:31 PM · 18 min". Decision 14's dash rule stands. The range and «· 18
  دقيقة» are each one unbreakable unit.
- **Decision 17** (TBL-6, TBL-8, TBL-11, CHP-7, OWN-R12): **no «الأعلى» / "Highest" flag** (option 3, `user
  2026-10-02`), at every width, in Reports' table and day list and in `components.html`; the highest-peak row keeps its
  tint. The glance's «أعلى ذروة» names the day, time and value in words at 320, 390, 768 and 1440 in both languages. No
  other screen-reader text marked the row, so none was reworded.

### Decided 2026-10-02 (step 4's wording round)

The user picked from rendered options on the phone fixes (`e8461a5`); built and measured in `R4e`.

- **Decision 9** (TBL-12, CHT-12): **one size and one colour for the whole sentence** (`user 2026-10-02`). Every
  no-readings, closed and waiting sentence takes the style its words have, its times and dates too: caption `--ink-3`
  in Reports' rows and lists (7.92:1), `--stale` in a closed hour run (5.26:1), the word's 15 px chalk in the tooltips
  (17.4:1); Daily's minute table keeps the 13.5 px `--ink-2` its words already had (11.24:1). All above 4.5:1.
- **Decision 10** (TBL-12, OWN-R12): **a whole day without readings keeps its date in its place**, «لا قراءات» under
  it, no figures; the table row from 721 px, the day-list item below. TBL-12's "no row header" no longer holds for a
  single day (`user 2026-10-02`, the rule change approved).
- **Decision 11** (TBL-12, OWN-R12): **a single day before the readings began takes the same form**, «لا قراءات بعد»
  under its date; a run of such days keeps «لا قراءات بعد من 26 أغسطس إلى 12 سبتمبر» (accepted, `user 2026-10-02`).
- **Decision 12** (CHT-12, CHT-21, STA-12): **Daily's waiting tooltip** «بانتظار القراءات» then «منذ 3:00 م»; the
  current time is not printed; the screen-reader text and the chart summary say «بانتظار القراءات منذ 3:00 م»
  (`user 2026-10-02`), on the page and the components page.
- **Decision 13** (OWN-D11): **Daily's coverage list** «من 2:14 م إلى 2:31 م (18 دقيقة)», the duration in brackets
  after the range, no middle dot, in the label's colour; «792 من 810 دقيقة» unchanged (`user 2026-10-02`). Its «من …
  إلى …» is replaced by decision 14.
- **Decision 14** (OWN-D11): **the coverage list drops «من … إلى …»** (`user 2026-10-02`). A span's value is the range
  with its en dash and the duration in brackets after it: «6:00 ص – 6:09 ص», «2:14 م – 2:31 م (18 دقيقة)» / "6:00 AM –
  6:09 AM", "2:14 PM – 2:31 PM (18 min)"; no middle dot; the label column, the value's colour and «792 من 810 دقيقة»
  unchanged. A range never breaks inside; the bracketed duration may drop to the next line as one unit. The
  one-sentence no-readings spans elsewhere keep «لا قراءات من … إلى …» (TBL-12). Measured in `F14`.

### Decided 2026-10-01 (step 4's fix round)

The user accepted both in the phone critique of phase B (`user 2026-10-01`); the build still listed them as open. They
stay as built.

- **Q18** (HDR-7, OWN-R10): **accepted** (`user 2026-10-01`). On a phone the minute export keeps the controls row's far
  end, on a line of its own under the period (not across the width under the period, and not an item in the phone's
  menu).
- **Q19** (OWN-R2, HDR-4): **accepted** (`user 2026-10-01`). With a preset, the subtitle keeps "Readings on 10 of 28
  days" when fewer days have readings (the short history), a fact about the figures rather than the period's length;
  and on a phone Reports shows its subtitle's two parts on two lines, where HDR-4 shows Daily's first part only.
- **Q11** (a span with no readings): **answered a third time** (`user 2026-10-01`, decision 8), below.

### Decided 2026-10-01 (step 4's build, the user's pick of option B)

The user picked option B of the phone options round (`aa509b9`) and rejected Q17's baseline (`user 2026-10-01`); the
build answers Q20-Q22 with what it draws.

- **Q17** (OWN-R3, TRU-7): **rejected** (`user 2026-10-01`). The week card's baseline («مقابل 9 – 15 سبتمبر» / "vs 9 – 15
  Sep") leaves "Last 7 days" at every size: the owner reads the comparison without it, and it made the card too full.
  The card's description keeps both spans for assistive technology. At 1440 the page differs from `aa509b9` only inside
  that card (R4c).
- **Q20** (PAT-12, PAT-13): **answered** by the pick (`user 2026-10-01`). Phase B's one-letter Arabic heads «ح ن ث ر خ ج س»
  are gone with its transposed grid; the week strip names its days «أحد اثنين ثلاثاء أربعاء خميس جمعة سبت» / "Sun" … "Sat"
  in 44 px or wider buttons (46.3 at 390; two rows of four under 308 px, 63.5 at 320).
- **Q21** (PAT-2, PAT-12…14): **answered** by the pick (`user 2026-10-01`). Below 1024 px there are no grid cells: the
  pattern is one day at a time, its hours read, not tapped (every bar prints its number), and its targets are the strip's
  7 days (81 × 88 at 768, 46.3 × 76 at 390). From 1024 px the grid stays, its cells under 44 px wide up to about 1240 px
  (K-39, for the user).
- **Q22** (OWN-R9): **answered** by the build (`user 2026-10-01`, the pick's "the card ends inside the 1024 fold"): at
  768 × 1024 the pattern card ends at 1006.8, 17.2 px inside the fold, with the header, the controls and both glance
  cards above it; no rule changed (the strip's days 88 and the columns 200 tall on the tablet, PAT-13, PAT-14).

### Decided 2026-10-01 (step 4 phase A)

Each was built as described and the user accepted it on 2026-10-01 (Q13 with the other arrangement, below).

- **Q12** (MOT-10, OWN-R5): decided by the user on 2026-10-01, accepted: Reports has no intro and no rolling digits when the
  period changes; Reports is history, and the period's figures arrive at once.
- **Q13** (OWN-R6): decided by the user on 2026-10-01, accepted with the other arrangement: Reports has no summary light;
  the pattern's data light alone, held while it holds a value, and every figure card, "Last 7 days" included, plain in
  every period. DECISIONS 103 (2026-10-29) supersedes the pattern's light: the pattern is plain at every size and state, and
  Reports lights nothing.
- **Q14** (K-37): decided by the user on 2026-10-01, accepted: rename "Last 4 weeks" / «آخر 4 أسابيع» to "Last 28 days" / «آخر 28 يومًا», so "week" keeps its one
  meaning (GLO-13).
- **Q15** (HDR-3): decided by the user on 2026-10-01, accepted, stays as built: from 721 px the status is boxless at rest with a chevron (BTN-5's form) and keeps Daily's quiet
  header; the alternative is the phone badge's box (BDG-1) at every size.
- **Q16** (HDR-3, Daily at 721-1023 px): the hours leave Daily's subtitle for the status's details there, because the
  status control and the full subtitle do not fit side by side at 768 in English (the control would spill 16 px). Decided by the user on 2026-10-01, accepted, stays as built.

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
  and the range chosen on 2026-09-30) → TBL-12. **Replaced the same day by decision 8** (`user 2026-10-01`, the review
  of step 4's build): the span is one sentence in natural order, the words first, «لا قراءات من 10:00 ص إلى 2:00 م» /
  "No readings from 10:00 AM to 2:00 PM", with no mark and no middle dot, everywhere in Eclipse (Reports, Daily, the
  components page, the tooltips); a closed span the same way, «مغلق من … إلى …» / "Closed from … to …"; the header's
  period line keeps its middle dot («لا قراءات · 31 يومًا», decision 7), and the dotted mark on a chart's time axis
  stays, a data mark → TBL-12, PAT-12.
