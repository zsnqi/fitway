# owner-design-exploration-r04: decisions in force

The decisions in force for the Owner concept work, compiled on 2026-10-02 from the activation log
(`docs/phase-records/handoffs/owner-design-exploration/20260923-165000-owner-design-exploration-r04-activation.md`,
"log" below), `design-research/owner-composition-exploration-r04/directions/NEXT-DIRECTION-BRIEF.md`
("brief") and `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`. Edit an entry in place when
a decision changes. An entry here overrides older text in the log and the brief. Decisions are the user's unless
marked "coordinator". Agreements on how the user and agents work are in `docs/agent-context/WORKING_AGREEMENTS.md`.

## The direction: Eclipse

1. **Look.** Dark, glass cards, a static FITWAY-red light, Readex Pro (Cairo excluded). Calm and premium, not busy.
   The visual language carries to every screen; a composition does not. Brief lines 18-36 and 835-837.
2. **Plan.** Eclipse becomes the single design reference for Owner, then Staff, then Public, through a later ADR.
   Each screen is designed at 1440, 768 and 390; 320, 1024 and 200% zoom are checked only. Tests come once, at the
   end. (2026-09-30; brief "The design-phase plan", from line 821.)
   **Why** (the user, 2026-10-04): this concept is the single design reference that production is later moved to.
   The demo and its materials wait until after that move. FITWAY complements the gym's existing internal system
   (payments, the entry/exit turnstile); it does not replace it. The demo plan and its research are kept on the
   user's machine, not in the repository (the user, 2026-10-09: the repository is public).
3. **The user's bans.** `DO-NOT.md`, read in full before any design or copy work.
4. **Motion.** Lights are static and the page is complete at first paint. Digits roll only on a live change. The
   intro plays on first open only, about 1.17 s, with the font wait capped at 200 ms. Reports has no intro and no
   digit roll.
5. **Chart and tooltip.** Marker B, a hollow ring, follows smoothly; the latest stop shows the latest reading. The
   tooltip sits in one fixed 107 px top lane in every state and moves sideways only (CHT-18), about 130 px wide
   (CHT-12). The legend's ring key reads "Peak reading" (CHT-20).
6. **Fonts** are self-hosted; no request leaves the origin. Chromium's first-paint hold of about 100 ms on slow fonts
   is accepted.
7. **Frame** (2026-10-01). 1024 and up: the slim icon rail. 721-1023: the rail as a modal layer opened from the
   logo. 720 and below: a glass bottom bar and a compact header. Order: Today, Reports, Activity log, Access, then
   the rest; Monitoring sits under "More" on the phone; the bar's label is «النشاط» / "Activity". Operations has no
   rail slot: the header status opens its details at every size, a 44 px control from 721 up. Rail names show on
   keyboard focus only. Every target is at least 44 px.
8. **Truthful states.** The brightest thing on a page is never stale, unavailable or empty (D1). Closed,
   Unavailable, Error and Loading keep the live layout with no lit card. Unavailable reads «غير متصل» / "Offline",
   draws the real line plain to the last reading, then a dotted mark «بانتظار القراءات»; its cards read
   «قيد الانتظار» (coordinator wording). Delayed also turns off the chart card's light.
9. **Tables** (2026-09-30). Numbers and their headers align on the physical right edge. A row with no readings is one
   full-width cell, except the single-day case (decision 10). Reports shows one day at a time (option B) below 1280;
   1280 and up keep the week grid.
10. **Reports phone review** (2026-10-01, decisions 1-8, log lines 4415-4451): one bar per day, no bar edge, no
    dated headers; an empty period shows its sentence once; "Show all days" stays; the header «لا قراءات · 31 يومًا»
    keeps its dot. No baseline on the "Last 7 days" card (Q17). Only the pattern is lit (Q13). «آخر 28 يومًا» (Q14).
11. **Wording** (2026-10-02).
    - Decision 8: a no-readings span is one sentence, words first: «لا قراءات من 10:00 ص إلى 2:00 م».
    - Decision 9: one size and colour for the whole sentence.
    - Decisions 10-11: a day without readings shows its date with «لا قراءات» or «لا قراءات بعد» under it.
    - Decision 12: Daily's waiting tooltip is «بانتظار القراءات» / «منذ 3:00 م».
    - Decisions 14 and 16: a coverage range takes a dash, no «من … إلى …», no brackets:
      «2:14 م – 2:31 م · 18 دقيقة», with the range and «· 18 دقيقة» unbreakable.
    - Decision 15: at 721-1023 the peak time sits beside the number on one baseline.
    - Decision 17: no «الأعلى» flag at any width; the peak row keeps its tint.
12. **Ranges.** Arabic ranges take the en dash (2026-10-01). This overrides the brief's "plain hyphen" and any older
    note. `DO-NOT.md` adds: no dash inside a sentence, and no «من … إلى …» in a range that stands alone as a value.
13. **Accepted as built** (2026-10-02): «· 13 دقيقة» on a second line at 320 AR; the peak column 18 px narrower at
    1024 EN; the three-line wrap of the peak row's note at 721 and 768 AR, for now; the quiet hour bars.
14. **Reports' states, K-02** (2026-10-03), from the options at `1a4b497` and the comparison page
    https://claude.ai/artifact/BswYQ6ad1D7B6m6RMAyPoy: option A, with option C's error state (one page-level
    sentence in place of the cards). Pending counts the partly received day in the period figures, as A does
    (coordinator: the readings are real, and the day row says it is still waiting, as a camera gap is treated). The
    header status control keeps one width from loading to arrival (built in `1a4b497`); Daily gets the same fix.
    The error sentence writes the year once, as the header does: «تعذّر تحميل القراءات من 26 أغسطس إلى 22 سبتمبر
    2026», and English the same way. The control's reserved width stays, but the outline drawn on hover and focus
    fits the text, with no empty space inside it (both 2026-10-03). The sentence follows the header's other forms
    too (2026-10-03): one day reads «تعذّر تحميل قراءات 22 سبتمبر 2026» / "Couldn't load readings for 22 Sep 2026";
    a period inside one month names the month once, «تعذّر تحميل القراءات من 16 إلى 22 سبتمبر 2026» / "from 16 to
    22 Sep 2026". Built at `cbd7bbc`; the two forms at `41a6f7c`.
15. **No concept label** (2026-10-03). «مفهوم استكشافي · بيانات افتراضية» / "Exploration concept · synthetic data"
    leaves every Eclipse screen: it takes room for nothing. This overrides NEXT-DIRECTION-BRIEF.md line 97. It also
    settles Daily's header at 1024 EN, which went to two lines only because the label no longer fitted beside the
    status control's reserved width. Built at `41a6f7c`.
16. **English does not copy Arabic's geometry** (2026-10-03). In an English table the Peak column aligns to its left
    edge, and the time sits to the right of its figure, "55 6:25 PM"; a day's no-readings words start on the same edge.
    This overrides item 9 for English; Arabic is unchanged. Whether English's other numeric columns also start at the
    left: option B (2026-10-03), every English numeric column starts at its left edge, figures flush on the edge as
    in the frame the user sent (not B's variant that indents shorter figures), Daily's minute table included. In the
    Peak column the times line up whatever the figure's width. Arabic gets the same time alignment when a peak has
    three digits (the user, "yes"); nothing else in Arabic changes. Options in `D:/fitway-temp/owner-r04-en-tables/`
    (`optB/`). It settles D5. For D6 the user delegated the pick of shorter English labels to the coordinator: R2,
    "805 of 823 min" and "Open, empty" (copy round 1).
17. **No explanation of the line** (2026-10-03). The "The line" row («الخط») leaves Daily's coverage card: the owner
    does not need how the line is smoothed, and the page carries names and values, not explanations (brief item 8).
    The user's view, with the coordinator's agreement. The legend's name for the line («معدّل كل 30 دقيقة») is in copy
    round 2, with Reports' heavy explanations (the user, "now").
18. **The usual day** (2026-10-03), option 1 of copy round 1: the legend reads «المعتاد أيام الأربعاء» / "Usual on
    Wednesdays"; the coverage card's row is «المعتاد» / "Usual" with «معدّل آخر 4 أيام أربعاء» / "Average of the last 4
    Wednesdays" (with fewer recorded, «يوم أربعاء واحد فقط في السجل (16 سبتمبر)»). The tooltip, the entries figure and
    the busier/quieter chip keep «المعتاد». Exact texts: `D:/fitway-temp/owner-r04-copy-round/work/options.mjs`.
19. **Copy round 2** (2026-10-03, the user's picks; options in `D:/fitway-temp/owner-r04-copy-round-2/opt/`):
    - The export dialog has no description: its title and the file line carry it (item 1, option 3).
    - "Last 7 days" without enough readings: the line reads «لا تكفي القراءات بعد» / "Not enough readings yet", with
      the note «يلزم أسبوعان من القراءات المنتظمة» / "Needs two weeks of steady readings" (item 2, option 4). The old
      line, «لا يكفي السجل بعد», was untrue with a long history and a recent outage.
    - The export failure reads «تعذّر التصدير، ولم يُحفظ شيء.» / "Couldn't export. Nothing was saved." (item 3,
      option 2).
    - The line's name is «معدّل الموجودين» / "Average inside" in the legend, the minute table's column, the chart's
      screen-reader text, the component sheet and GLO-4 (item 4, option 1).
20. **Daily on the phone gets its own design round** (2026-10-03). At 390 Daily reads as the desktop page stacked in
    one column (step-4 review): the chart, the page's core, is below the first screen; about 127 px sits empty above
    the plot at rest (the tooltip lane); the busiest-time card spans the width with its value in half of it. A fresh
    designer draws numbered options for the phone, and the user picks. Nothing is broken; this is a design question.
    The user confirmed it after seeing `f193046` at 390 (2026-10-03): the page works, but it is the desktop design
    moved to the phone and squeezed; it should be arranged for the phone, in the same visual language, not a new
    design. Two problems the user named: on the phone the owner cannot move through the chart easily, as the mouse
    does on a large screen (each half hour, 7 PM, and so on); and the busiest-time card takes the full width for
    little content.
    **Narrowed the same day** after the three layout options at `b80083a` (page
    https://claude.ai/artifact/2oP51ViJ2F5qUrnwqtBUuo): the phone's arrangement stays as it is; the cards come first
    because they answer directly, and the chart below them is natural. The round is only how a finger moves through
    the chart: it need not copy the mouse, and a way that suits the phone better is welcome. Keep it light: show the
    ideas simply, not full pages, and the user picks. The band above the plot may be used or dropped by the chosen
    way. The busiest-time card is not a big problem; a simple suggestion is welcome. The three layout options are set
    aside, kept on `owner-r04-daily-phone` as provenance.
    **The user's picks for a trial** (2026-10-03, page https://claude.ai/artifact/Hg4FjvgySLQr4xWBp8bWiX), built as
    one version to try, not as options: idea 2, press and hold, then drag, with the reading shown large in the band
    above the plot (number, time, level, usual) and the band back as it was when the finger lifts; "Inside now" never
    changes. Idea 4 with it: previous and next buttons beside the reading, half an hour at a time. The busiest-time
    card on the phone with its hours beside its title, in the same place. Dragging straight on the plot was the
    problem the user meant: the page moves by mistake.
21. **The empty period's sentence takes item 14's forms** (2026-10-03, the user: "ممتاز"). Reports' empty-period
    sentence writes the year once and, inside one month, the month once, as the header and the error sentence do:
    «لا قراءات من 1 إلى 7 سبتمبر 2026», not «لا قراءات من 1 سبتمبر 2026 إلى 7 سبتمبر 2026»; across months of one year,
    «لا قراءات من 26 أغسطس إلى 22 سبتمبر 2026». English the same way. Found by the reading-direction review of
    `f193046` at 390 AR.
22. **The peak time keeps to its own figure** (2026-10-03, option 2-1 on the page
    https://claude.ai/artifact/NxAZnPDf2L57kPvQ4RcmjG). At 721-1023 px the peak's time sat nearer the next column's
    figure than its own (English since decision 16; Arabic before it). In both languages the time is further from the
    next column than from its own figure, with the room taken from the Notes column. The user sees the render before
    accepting it.
23. **Arabic peak times line up whenever the figures differ in width** (2026-10-03, option 3-1): a one-digit peak
    among two-digit ones lines up as a three-digit one does. This widens item 16's Arabic rule.
    Readex Pro's two-digit figures differ slightly in width, so all-two-digit Arabic tables align too (coordinator,
    2026-10-04: kept, as item 23 says).
24. **Coordinator picks on the review's notes** (2026-10-03, delegated by the user):
    - Arabic bare hour ranges («6–7 م») stay isolated left to right, while ranges of times or dates with words
      («2:14 م – 2:31 م», «16 – 22 سبتمبر») start on the right. The bare range reads as one number; this was settled
      with item 12, and changing it is not worth a round.
    - English coverage rows at 320 px wrapping two ways go to Daily's phone round (item 20), which rearranges that card.
    - Reports' status control holds its width the way Daily's does, so a live status cannot change it.
25. **After the phone touch trial** (`a223c82`, 2026-10-03). The user saw the 390 AR sheet and the video and raised
    nothing against the hold, the reading or the previous and next buttons (not a visual acceptance), and asks for:
    - **The bar.** When a hold or a tap starts and part of the reading area or the plot is under the bottom bar, the
      page slides up once, smoothly, until both are above the bar; it never moves while the finger moves.
    - **No first-open intro on the phone** (720 px and below): the page appears complete at once; the computer keeps
      item 4's intro. The user's reason: on the phone the chart is below the first screen, so only the numbers moved
      while everything else stood still.
    - **The busiest-time card is still open.** The trial's card (hours beside the title, "Average 51" hanging under
      the hours) reads badly, and the coordinator's next proposal (title and «آخر 7 أيام · المعدّل 51» on one side,
      the hours alone on the other) did not convince the user either. Draw it again with a designer's eye.
    - The reading-direction review's small fixes, accepted: «إلى» or "to" kept with its date in the empty-period
      sentence; English "Waiting for readings" clear of the close button at 320 px; a straight Tab order across the
      three buttons; the one-pixel seam in Reports' Arabic header.
    - **Lesson for the one-pass screens** (the user): the card passed every check because each check asked whether the
      requested change happened, not whether the changed element reads well as a whole. Every review looks at each
      changed element as a composition (WORKING_AGREEMENTS "Rules and findings").
26. **After the decision-25 build** (`bd8bada`, 2026-10-04; the user: "ممتاز" on what it built).
    - **The busiest-time card on the phone:** the designer's variant 2 (copy
      `D:/fitway-temp/owner-r04-busiest-card/`, `?busy=2`; report `D:/fitway-temp/owner-r04-busiest-card/REPORT.md`):
      the desktop card's head (the name, «آخر 7 أيام» at the line's end), then the hours at the start and the average
      at the far end, on the hours' baseline. The hours write the period in full, «6–7 مساءً» («صباحًا» for a
      morning hour), and the average reads «بمعدّل 51». The user's reason: the card's value is the answer to "when is
      it busiest", so the word is said in full; every other time stays short («ص / م»). English is unchanged
      ("6–7 PM", "Average 51"). The computer's card says the same, «مساءً» and «بمعدّل» (the user, 2026-10-04,
      after card-1 was briefed for the phone only). Coordinator: this is a deliberate exception to DESIGN_GUIDE §9's
      «ص/م», for the later ADR.
    - **Touch on the plot:** the page's own pan and flick leave; the page scrolls and pinches as the phone does, and the
      held reading moves from the first movement the phone reports, stop by stop, a little behind the finger (agreed
      with the coordinator's proposal).
    - **The slide works both ways:** when a hold or tap starts with the reading or the plot cut off at the top of the
      screen, the page slides once until both show, as it does above the bar.
    - Accepted as built: Tab goes previous, next, then close (a straight row would break the reading at 320 px).

27. **After the review of `436fe40`** (2026-10-04; report `D:/fitway-temp/owner-r04-review-436fe40/REPORT.md`; the
    user: "موافق على كل اقتراحاتك").
    - **The held reading catches up** (F1): when a drag outruns it, the reading moves quickly through each stop to
      the finger, and reaches the finger's stop as soon as the finger stops. This bounds item 26's "a little behind".
    - **The noon hour says «ظهرًا»** (F6); item 28 sets the full rule.
    - **A tap on the peak's ring reads the peak** (F8), not the half hour nearest it.
    - **«بمعدّل 51» on the phone card** (F4): it should belong to the hours; settled by item 28.
28. **The busiest-time card's form and period word** (2026-10-04, after `owner-direction-designer-max`'s one variant,
    `D:/fitway-temp/owner-r04-busiest-average/`, `?avg=1`, report `REPORT.md` there; the user: "ممتاز جدا").
    - **On the phone** (720 px and below) the average stands directly under the hours, on their start edge, in caption
      type; the name and «آخر 7 أيام» keep their line. The taller card is accepted ("شكلها مرتب").
    - **One period word per hour range, never two**, chosen by the hour the range ends at: ending 6-11 AM «صباحًا»
      («9–10 صباحًا»); ending at 12 noon or 1 PM «ظهرًا» («11–12 ظهرًا», «12–1 ظهرًا»); ending 2-11 PM «مساءً»
      («6–7 مساءً»); ending at midnight or 1 AM «ليلًا» («11–12 ليلًا», «12–1 ليلًا»). The coordinator's rule, the
      user's pick ("نمشي على ترشيحك"). It holds on the card at every width, so the computer's card says it too, with
      «بمعدّل» (item 26). Every other time keeps «ص / م»; English is unchanged ("11 AM – 12 PM").
    - With one word every hour fits at the card's normal size, so the designer's smaller size at 320 px is not
      built.
    - The fixes go to Codex (the user); no further max-effort design for this card.

29. **After the review of Codex fix-2** (`ac3ae02`, 2026-10-04; report
    `D:/fitway-temp/owner-r04-fix-2-verify/REPORT.md`).
    - **The catch-up stays as built** (the user: not a big difference): the reading passes every stop and, after a
      very fast full-width swipe, keeps moving for about 0.4 s. This settles item 27's first bullet.
    - **The computer's card reads «المعدّل 51»** at its foot, as a label beside «المعتاد 318»; the phone keeps
      «بمعدّل 51» directly under the hours (coordinator, delegated by the user: the two places differ, so the words
      may; «بمعدّل» needs the hours right above it). The period words of item 28 stay at every width. This revises
      item 26 for the computer.
    - **A tap near the peak's ring reads the peak:** its tap area is at least fingertip-sized (44 px), not the drawn
      ring only. The user: such a fix follows the 44 px rule and needs no question.

30. **Daily and Reports on the user's own devices** (2026-10-04). Codex fix-3 (`4e0be02`) was published as the private
    artifact https://claude.ai/artifact/Fu3qDtwnRUNd9zMj5NiMZp (staged copy without `tuner.js`,
    `D:/fitway-temp/owner-r04-artifact/`). The user tried it on a phone and a computer: "كلشي كويس" (not a visual
    acceptance of every frame). One note, in the artifact's comment thread on Reports' «معدّل الموجودين» card
    (`#fig-avg`): the card is too empty. It goes to Reports' last round, redrawn by a designer and shown before it
    is built; the thread stays open until then.
31. **Activity log, the answers before its one pass** (2026-10-04; the questions from the research digest
    `D:/fitway-temp/owner-r04-activity-questions/REPORT.md`; the user agreed with each recommendation):
    - One list of every record, newest first, with quick kind shortcuts above it: All, count changes, access,
      settings.
    - A settings record says honestly that the settings were updated (the log holds only a version, not which
      setting); recording what changed is a separate Product/Spec amendment, not opened yet.
    - Filters in view: kind, person and date range; "reason contains" under a "More" control; the exact prior and
      effective count filters leave.
    - Older records: a «عرض الأقدم» / "Show older" button, 25 at a time, and the end line «لا توجد سجلات أقدم» /
      "No older records" (records are kept about 12 months, so "end of the log" would overstate).
    - No refresh by itself: a refresh button beside the time of the last load, so the page never looks live.
    - No export (no contract exists for the log).
    - On the phone the records take a form without sideways scrolling; the designer decides it.
    - Privacy: no visitor appears anywhere; only staff, owner and the automatic system as actors.
    - The designer also decides what sits above the list, the record's form at each size, and how Access and
      Settings link into the log, within DO-NOT and the rounds' lessons (item 7 below).

32. **Activity log, after the max-effort build** (`a8aa8ad` on `owner-r04-activity`, 2026-10-04; report
    `D:/fitway-temp/owner-r04-activity/REPORT.md`; published https://claude.ai/artifact/4rrdgUHUuX8hyiQeGTSMdC).
    - The user: "ممتاز" on the composition, the day grouping, the quieter nightly reset, nothing lit, and the record's
      form at each size; no notes so far. This judges the max-effort trial (rounds item 6) a success.
    - The kind shortcut reads «العدد» / "Count"; the full name stays the accessible name (designer finding 2). The
      next bullet may rename it, since it would hold only the nightly resets.
    - **No one changes the count by hand** (the user's artifact comment, 2026-10-04; already ADR-008: no staff or
      owner correction or reset). The synthetic log drops every human correction and reset; the count kind holds the
      automatic nightly reset only. No reason may say the gym counted people by hand: it never does (artifact comment
      on the camera-outage reason).
    - **Dates are picked, not typed** (the user's artifact comment, 2026-10-04): the date field becomes a picker, on
      Activity log and on every earlier page with dates (Reports). This revises FLD-2; its design goes to the next
      round.
    - With two owner accounts, a record names the owner, not «المالك» (check the read contract carries a name; if not,
      it is a Product/Spec amendment).
    - The nightly reset's machine-string reason is shown as «تصفير بعد الإغلاق»; production translates it (known).
    - **The phone title** (finding 1): smaller on the phone, on every page alike, so «سجل النشاط» fits one line beside
      the longest status; the status keeps its word (a dot alone would carry meaning by colour only). The components
      sheet's type scale, TYP-3 and HDR-4 change with it in the same round.
    - **"More filters"** (finding 3): «البحث في السبب» rejected by the user. Options put to the user: keep
      «المزيد من التصفية», a magnifier icon button that opens the reason field, or drop the reason search. The user
      took the coordinator's picks ("ممتاز اجل يلا"): the magnifier, with a localized accessible name.
    - **The after-midnight record** (finding 4): «1:05 ص · فجر الأربعاء» rejected by the user. Options put to the
      user: group the log by calendar date, or make the nightly reset the day's closing line. Picked with the above:
      calendar date; Daily and Reports keep the business day.
    - **Who designs the next round:** visual design stays on the Opus designer (WORKING_AGREEMENTS "Delegation"); the
      Sonnet definitions are read-only research.
    - **Review:** `owner-direction-verifier-high` (Opus, high), reading direction included, after the user switches
      accounts (the user: "كويس"). The components sheet waits for the end of the remaining screens, by an xhigh
      designer or a builder; max only if that result disappoints (the user agrees).
    - **The fix round** (`e72e5fe`, designer report `D:/fitway-temp/owner-r04-activity-fix-1/REPORT.md`) built all six
      and every review finding; published https://claude.ai/artifact/RKEfwzfwZ7oD5r5fZLnqPS (the user's earlier links
      do not open under the current account). Coordinator answers to its questions, each applying a rule already
      decided: Reports' export dialog takes the picker too (this item: every page with dates); the front desk leaves
      "Who" (ADR-008: it writes no record); the components sheet's date specimens show the picker; an owner's name is
      one stored string, shown the same in both languages (truthful data). These go to one small follow-up.
    - **The picker is the one way to choose dates, everywhere** (the user, after trying `e72e5fe`: "ممتاز", the
      picker's motion praised): the minute-data export too (it lives on Reports, TBL-10; Daily has no export), and
      every later screen with a date. The follow-up goes to Codex (frozen edits applying the built picker), then the
      coordinator inspects its frames. Brief `codex-activity-followup.md` (`7f8d2dd` on `owner-r04-activity`), level
      `high`; an owner's one stored name is «فهد» / «نورة» on both pages (coordinator). Built at `31e9dd9`, merged into
      `owner-followup-r04-build`; published https://claude.ai/artifact/C6yiDVgdAnFN5wzwuzHdoD (Daily, Reports, Activity log).
      Two notes on it, delegated by the user to the screen's last round (designer or reviewer decides): the English page
      shows the stored Arabic name beside an English reason that names "Noura"; at 320 px the export's file line sits
      below the sheet's first view.

33. **Access, the answers before its one pass** (2026-10-04; research digest
    `D:/fitway-temp/owner-r04-access-questions/REPORT.md`). Access holds the one shared front-desk PIN and the owner
    accounts only.
    - **The new PIN** is shown once, with no copy control, and the view closes only by an explicit "I have saved it"
      action, never by Escape or a tap outside: closing by accident forces a new PIN and signs the desk out again.
    - **Changing the PIN** asks for a confirmation that says it signs the front desk out at once.
    - **Deactivating** the PIN or an owner asks for a confirmation with the required reason (at most 240 characters,
      what the log stores). Its look is the designer's (the user: the coordinator proposes no forms or colours).
    - **Creating an owner and resetting a sign-in:** email, name and a password the owner types (12-200 characters)
      with show and hide; no strength meter, no generator, and no line about handing the password over.
    - **The owner's own row** is marked as theirs, with no deactivate and no reset; the last active owner's
      deactivate is unavailable with its reason in words.
    - **"Change my password"** is added, though no contract has it (the user: an excellent feature or change missing
      from the specification may be added). The design names each such addition as a Product/Spec amendment for the
      move to production; privacy and security limits still bind.
    - **The PIN changes in two steps** (the user, 2026-10-04, after the first build; coordinator's proposal): the new
      PIN is shown while the old one keeps working; only «حفظتُ الرمز» makes the new one take effect and signs the
      front desk out. An accident before it (a closed browser, a lost connection) changes nothing. A Product/Spec
      amendment (the contract rotates in one step today); built in Access's fix round.
    - **The specification may change where a change is better** (the user, 2026-10-04), not only gain missing
      features; each change is still named as a Product/Spec amendment for the move to production, and privacy and
      security limits bind.
    - **Deactivated owners** stay in the same list, quieter, with "Reactivate".
    - **After an action:** one quiet sentence that it is done, with a link to the record in Activity log; a failure
      shows its specific refusal and keeps the form as typed.
    - **The page's composition** (order, grouping, where each row's actions sit, what each person shows, the link to
      the log) is the designer's alone; the coordinator recommends none of it (the user, 2026-10-04).
    - **The reason's length** (the user: "fix it"): production's form accepts 500 characters while the log stores 240, so
      a long reason fails on saving. The concept caps the field at 240; production's contract is fixed outside this
      concept milestone (production paths are forbidden here).

34. **Access, after the max-effort build** (`2fa0792` on `owner-r04-access`, 2026-10-04; designer report
    `D:/fitway-temp/owner-r04-access/REPORT.md`; review `D:/fitway-temp/owner-r04-access-review/REPORT.md`, all checks
    pass but V8 low). Published with the other three pages, links wired in the staged copy only:
    https://claude.ai/artifact/34ZEAW6e9xJmAbr4WmG2VM (the account changed; earlier links no longer open).
    Coordinator answers to the designer's questions, each applying a rule already decided:
    - Creating a PIN asks nothing first (it signs no one out; item 33 asks only before a change).
    - Reactivating asks first, as built (the account works again at once with its old password).
    - A typed password stays masked while its dialog is open after a refusal (item 33: the form is kept) and is emptied
      when the dialog closes (review F2).
    - The done link opens the exact record (AMD-C2 built: Activity log arrives on one record by its id; item 33 "a
      link to the record" and the user's "specification may change where better").
    - One English pair on both pages: Deactivate / Reactivate (item 33's words); Activity log changes with it.
    - Changing one's own password ends one's other sessions, as drawn (the usual security rule).
    The fix round, by an `owner-direction-designer` (xhigh) on the integrated build branch: the two-step PIN change
    (item 33), the computer's composition (designer and review: at 1440 a row's actions sit about 1000 px from its
    name, half the screen empty), the sign-out wording («دخول» means visitors' entries here, review F4), and the
    review's lows (F1, F2, F5, the 700 ms silence, the row that jumps groups); plus the rail and bar links, the spec
    fragment merged as §4.4, and INDEX. Access merged into `owner-followup-r04-build` at `6ec9591`.
    **The user's notes on the published page** (artifact comments and answers, 2026-10-04), which revise item 33:
    - **The sign-out wording** «ينتهي دخول …» is wrong (the user agrees): «دخول» is visitors' entries here.
    - **The quiet removal buttons** («تعطيل الرمز», «تعطيل الحساب») read oddly without a box on the computer; on the
      phone they read well and stay.
    - **The reason is optional** for both deactivations: the field stays, at most 240 characters, never required. A
      Product/Spec and contract amendment (the contract requires it today).
    - **The front-desk code:** the owner either lets the system generate it or types one; it may hold letters as well
      as digits (the user: a mixed code lowers the risk), with a copy control in its one-time view. This reverses
      item 33's "no copy control" and the generated-only, digits-only PIN; a Product/Spec and contract amendment. The
      user declined a weak-code rule ("معليك"); the coordinator keeps only a minimum length.
    - **The computer's arrangement is shown first as a simple skeleton** (the user): the designer proposes the
      arrangement in plain blocks before building it, and the user agrees before the full fix round.
    **The skeleton, agreed** (2026-10-05; `D:/fitway-temp/owner-r04-access-skeleton/`, report `REPORT.md` there,
    https://claude.ai/artifact/Gog3geQcM3pruLW59DfmXM; the user: "اعجبتني … واضحة ومرتبه"):
    - Two halves on the computer: the front desk and the owners, each person's buttons under the name; and a new
      «سجل الوصول» card with the latest access records and «عرض الكل». The user accepts the new content (the
      requirements still improve during development; anything bad is changed later).
    - **The removal buttons get their quiet box on the phone too** (the user), revising the earlier note.
    - **The owner always types the front-desk code**; the system no longer generates one (the user), revising the
      generate-or-type choice above. Letters and digits, a minimum length, a copy control in its one-time view.
    - **«إلغاء التغيير»** in the one-time view (the user: "ممتاز"): safe with the two-step change, since the old code
      works until «حفظتُ الرمز». This revises item 33's "closes only by «حفظتُ الرمز»".
    - «السبب (اختياري)» confirmed.
    **After the fix round's design part** (`a0c6c76`, 2026-10-05; report `D:/fitway-temp/owner-r04-access-fix/REPORT.md`),
    the user's answers to two of the designer's questions:
    - **The code's letters keep their case** (the user: «نفرّق»): A and a differ. This reverses the designer's
      case-insensitive proposal in AMD-C4; the code stays 8-16 English letters or digits.
    - **The code shows in a monospace face** that tells I from l and O from 0, in its one-time view and its field
      only (the user): a named exception to Readex only (TYP-1), self-hosted or a system face (item 6).
    - **The copy control sits beside the code on the computer** (the user, «اي», after asking why it sat under the
      code unlike the skeleton): at the code's end on the same line from the computer's widths, under it on the
      phone. Built with the monospace face, which makes the widest code predictable; the designer checks it against
      the widest sixteen characters and reports the measurements if it does not fit.
    Coordinator, applying rules already decided: the records card stays off the phone, which keeps its link (the
    designer's composition); 16 stays the maximum.

35. **A dialog's buttons start where its text starts** (the user, 2026-10-05, «موافق يلا», after two research digests
    `D:/fitway-temp/owner-r04-dialog-side/REPORT.md` and `REPORT-2.md` and the frames `compare-1440-*.png` there).
    Every dialog's actions sit at the inline start (the right in Arabic, the left in English), under the title, text
    and fields they finish, Cancel first and the primary after it, so a destructive primary is not the first thing
    the eye reaches. This replaces DLG-2's "actions at the inline end, the primary last". Why: the dialogs are text
    and fields hung on the start edge (form-like); the one measured study (Wroblewski, in-page forms) and GOV.UK,
    HashiCorp Helios and Fluent's mirroring favour the start; the end's strongest reason is platform habit (Apple,
    Material). On the phone the two buttons fill the width, unchanged.
    **A centred moment stays centred** (the user, 2026-10-05): the export's done state keeps its check and «الملف جاهز»
    centred over start-aligned buttons; a status moment is not text that flows from the start, and not everything
    belongs on one edge. Built at `54b2737` (fixer report in `D:/fitway-temp/owner-r04-dialog-start/`).

36. **Interaction motion gets its own round, before the remaining screens** (the user, 2026-10-05: «اتفق معك»).
    What the user means: motion in chosen moments that raise the design's quality and beauty, not everywhere; for
    example the check in the export's done state could arrive with a fine animation. The round covers, for every
    page: a dialog's open and close, a button from its label to Working to done, the done line appearing, popovers,
    «نسخ» to «نُسخ», a row that changes after a deactivation; reduced motion honoured; the bans on load motion (DO-NOT,
    MOT-1) still hold. The remaining screens are then built with it. For the move to production (React, Tailwind,
    shadcn with Base UI already): the coordinator researches which motion library and component sources fit, from
    what practitioners recommend (Motion is the first candidate; HextaUI and the like only for components that pass
    RTL), and proposes one (the user: «شوف وش المناسب انت»).

37. **Motion and components for production** (the user, 2026-10-05: «ممتاز» on each of the three points; research
    digest `D:/fitway-temp/owner-r04-motion-research/REPORT.md`). For the move to production, not the concept:
    - The simple moments (a dialog's open and close, popovers, tooltips) are CSS transitions on Base UI's
      `data-starting-style` / `data-ending-style`, with no added library. Why: Base UI's own guidance, no bundle cost,
      and a transition can be interrupted midway.
    - The finer moments (a button from its label to Working to done, the done check, a row that changes after a
      deactivation) use Motion (MIT), its light form (`LazyMotion` + `m` + `domAnimation`), and only there. Reduced
      motion is honoured by the code itself, since Motion's setting leaves opacity and colour moving; any slide is
      mirrored by hand, since Motion is not direction-aware.
    - Components stay shadcn on Base UI with `rtl: true`. HextaUI (Base UI, MIT, days old on 2026-10-05) is a source
      to copy from (its button states, its number roller) only after an Arabic test. NumberFlow is not used (it does
      not support RTL or non-Latin digits). Magic UI, Animate UI and Motion Primitives are not used: they hard-code
      left and right (coordinator, from the digest).

38. **The motion round, after the user tried it** (`0c43c90`, the user on the live site and the frame strips, 2026-10-05):
    - The timings stay: the window's 340 ms opening and about 0.9 s from file ready to the finished check («ممتازة»).
    - The export's check draws on the phone too, as built.
    - The export's done state: the user liked it as built («اشوفها ممتازة»), then asked for the coordinator's ideas
      for its empty third of a second and wants to see both («بنشوف الاثنين»): (1) the check starts drawing while
      the window shrinks; (2) the calendar is not removed first but cut away by the shrinking bottom edge, then the
      check. A designer builds both as switchable variants beside the current one on the live site; the user picks.
    - Access's row after a (de)activation (O2): try changing the row only once the window has closed, without a
      noticeable wait («المفروض ما تتأخر جدا»); the user judges whether it is better.
    - Access's «سجل الوصول» card: the user asks how a new record would arrive with motion; show it before building.
      Answered (2026-10-05, «اي يدخل بحركة», on the coordinator's description: the new record appears at the top,
      the lines below move down to make room, its words rise into place without fading): a new record arrives with
      motion. Built by a fresh designer after the variants round, in its own small brief.
    - Speak to the user of «النافذة», not «الحوار», and describe a moment step by step as they see it.
39. **The variants, picked** (the user on the live site at `2996d7a`, 2026-10-06): the export's done state stays as built,
    `?done=0` («افضل الحالية»), and Access's row stays as built, `?row=0` («الحالي افضل خلاص»). Coordinator: the trial
    switches have done their work; the next build removes variants 1 and 2, row option 1 and the switches (MOT-19),
    keeping what the motion rounds made true for every variant (one frame clock, the narrow sheet's file line). The
    narrow-sheet review was stopped as moot: its open observations concern variant 2 only.
40. **Verification tooling before Settings, and `main` as the trunk** (the user, 2026-10-07, after the discussion of
    Lauren Tan's talk on agent-friendly codebases; the four digests are in `D:/fitway-temp/verification-discussion-20261007/`):
    - The whole coordinator line merges into `main`, which becomes the repository's truth for tools, policy and
      finished code. The concept's research files come along as reference only (ADR-009 keeps Owner composition
      vacant); the live Eclipse build stays on `owner-followup-r04-build` until the user approves it. The merge takes
      main's 2026-09-24 removal of the retired external-worker section from `docs/WORKFLOW.md`, the later decision.
      Coordinator: from then on `main` is fast-forwarded to the coordinator line whenever CI passes on it, at least at
      every resume point.
    - One tooling round runs before Settings, as its own milestone cut from the new `main`: a verification CLI built
      on the existing probe kit and ui-forensics (it measures; acceptance thresholds and held-out checks stay in
      `D:/fitway-grader`), a feature map of the Owner concept generated from its code and spec, a `verify-fitway`
      skill that Claude and Codex both read, the brief fields for B8 and B9 (through agent-environment-r02's
      evaluation loop), a preview that sends no-store, and one command that launches a Codex round.
    - pstack's `create-verification-skill` and `maintain-verification-skill` (Lauren Tan, MIT) are installed
      user-level, unmodified from `cursor/plugins` at `df58112`, and tried in that round; their `.cursor/skills/`
      output goes to `.agents/skills/` and `.claude/skills/` instead.
41. **Press feedback and 16 px field text** (the user, 2026-10-08, «موافق عليها كلها», on the two questions the good-css
    review raised, `good-css-review.md` in this folder):
    - Every pressable control shows that it was pressed. The form is the designer's, within the motion rules
      (DESIGN-SPEC §1.10 and DESIGN_GUIDE.md §10); today the concept has none.
    - Text fields use at least 16 px text, so a phone does not zoom the page when a field is tapped; this replaces the
      concept's 15 px field text (DESIGN-SPEC.md, the type roles).
    - Both go with the CSS fix round of the resume point's Next steps 6, when the Owner screens resume.

## How this milestone's rounds run

1. **A design round:** a fresh designer, then a fresh reviewer, then the coordinator inspects the frames, then the
   user decides. The user sees exact rendered crops, numbered for comparison; the coordinator starts any preview
   itself.
2. **Agents** follow the table in `CLAUDE.md`; a long-context designer is never resumed, not even one cut off
   mid-round (item 10).
3. **Codex** is GPT-6.1 Sol at the level the task calls for (`docs/agent-context/WORKING_AGREEMENTS.md`, "Delegation";
   Eclipse defects are `high`), launched by the coordinator with `pnpm codex:round`
   (`docs/phase-records/handoffs/agent-environment/DECISIONS.md` item 7), and is not used in cloud sessions. Its
   briefs follow the brief rules B1-B10 in the checklist of `docs/agent-context/briefs/codex.md`.
4. **Verifiers** use the verify-fitway skill (`.agents/skills/verify-fitway/SKILL.md`), which holds the verifier
   rules G1-G4, and its CLI instead of their own scripts (agent-environment-r03 round 4, 2026-10-07).
5. **Claude Design** is paused (2026-10-02). It stays available for open visual questions; its output is reference
   until built in Eclipse's files.
6. **The remaining Owner screens, one pass each** (the user, 2026-10-03): Activity log, Access, Settings and
   Operations are each aimed to be finished in one round, now that the look, the components, the states and the
   references are settled. Before a screen starts, the coordinator asks all its open questions at once, in plain
   words; then one design-and-build round and one review, not a series of option rounds.
   **The max-effort trial** (the user, 2026-10-03): `owner-direction-designer` at effort `max` (until 2026-10-08 the
   separate `owner-direction-designer-max`; agent-environment DECISIONS item 18) designs one whole screen once, the
   first of these (Activity log), and its result is judged before it is used again. Not for small fixes such as the
   busiest-time card. Rules are not rigid (WORKING_AGREEMENTS "Rules and findings"): its brief states the question
   and the hard limits (product, privacy, truthful states, the user's bans) and leaves the composition to the
   designer, so that what it notices beyond the rules can show.
7. **Lessons from Daily and Reports** (the user asked for them, 2026-10-04). Since 2026-09-30 the build branch took 195
   commits, of which 30 changed the pages' code, and 33 briefs; the phone's busiest-time card alone took six rounds
   (items 20, 25, 26, 27, 28, 29). The causes, and what the remaining screens do instead (coordinator):
   - **Elements were picked on today's value.** A form was chosen from one sample, then broke on the widest hour, the
     noon and midnight words, or an empty state. A designer draws each changed element against its whole range
     (the widest and the shortest value, every state, both languages, the phone and the computer) before the user
     picks.
   - **The phone came after the computer.** Daily was drawn wide, then squeezed, then given its own round and a touch
     trial. Each screen is drawn at all three sizes in the same round, with its touch behaviour.
   - **Touch was judged in emulation only.** The phone's gestures went through four rounds without a real finger. Any
     new interaction is published for the user's phone right after its first build.
   - **Decisions arrived after their brief.** A decision made while a round ran (item 26 for the computer) produced a
     conflict the next review had to find. The questions are settled first; a late decision waits for the next round.
   - **Briefs were read literally.** Most Codex failures traced to the brief (`codex-rounds.md`); B8 and B9 apply.
   - **Every review opened a new round.** Each review's small findings became the next round; item 11 now settles
     what happens to a review's findings.
   - **Questions the rules already answer** go to no one: the coordinator decides and reports in a line.
8. **A skeleton before every new screen** (the user, 2026-10-05, after Access's skeleton): after the questions and
   before the one-pass build, a designer (xhigh) shows the screen's arrangement in plain blocks (no colour, no
   finished components) at the computer and the phone, with the new dialogs; the user agrees, then the build starts.
   Coordinator: it settles the arrangement for a fraction of a build (Access's skeleton took about a quarter of its
   max-effort build's tokens) and would have caught Access's empty computer page before it was built.
9. **Who builds what** (the user, 2026-10-05: design stays with Claude; Codex where its rounds show it fits). Claude's
   designer builds anything visual: arrangement, a new or changed component, a form, a state's look. Codex takes what
   has no taste in it, with a precise brief: wording, behaviour and logic fixes, links, accessibility fixes (focus,
   clearing fields), spec and index upkeep, the measurable lows a review returns, and later the move of the concept
   into production code with tests. Coordinator's reading of `codex-rounds.md`: Codex is thorough and honest (it
   measures far more than asked, stops on a missing source, reports a conflict instead of working around it) but
   follows a brief to the letter, so its failures trace mostly to the brief, and it has no eye for composition.
10. **Rounds sized so a designer's context stays small** (the user, 2026-10-05, «اي مابي المشكلة تتكرر», after the
    motion designer reached about 584k tokens and was resumed after an API session limit instead of replaced):
    - **Commit at natural checkpoints**, not after every step: when a working unit is done (the shared file with its
      first moments, then each group of moments or each page), with a short notes file in the round's temp folder
      saying what is decided and what is left. A cut-off designer is then replaced by a fresh one that reads the
      brief, the last commit and the notes, never resumed.
    - **The designer judges; the full matrix goes elsewhere.** The designer looks at its work at 1440 and 390 in
      Arabic; English, 768, 200% zoom, `file://` and reduced motion are rendered by Codex or measured by the
      verifier. Images and videos are what fill a designer's context.
    - **A large round is split in two:** the foundation first (the shared parts and the first moments or
      components), then a fresh designer for the per-page work on top of its commit.
11. **The user sees a round only when it is finished** (the user, 2026-10-05, after the motion round came back with
    the export's empty-panel finding, O1, for the user to decide: «ليه ما تصلحها قبل ما ترجع لي»; and: «لو مر عليها
    مراجع وشاف فيه اخطاء ف المفروض تتصلح»). Every error a review finds, low ones included, and every taste finding the
    coordinator would recommend fixing anyway, is fixed (a fresh designer for taste, Codex or a fixer for the rest)
    and checked before the user sees the round; the user gets the finished result, the live site
    (`eclipse-build` preview on 3174) and the published link, with motion shown as frame strips. Only real choices
    go to the user, in plain words.
