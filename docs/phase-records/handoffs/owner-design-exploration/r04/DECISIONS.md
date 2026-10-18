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

42. **The press, two answers** (the user, 2026-10-10, on the questions of the pressed-state designer, `dbdcea0a` on
    the build branch):
    - On release, the press's light fades out over about 120 ms instead of going at once, so that even a very fast
      tap shows. This is a background light, not a glyph (MOT-1). It is an exception to MOT-18's "hover colours are
      instant" for the release only; the press itself still appears at once. The scale settles as built.
    - The current section's tile and tab show the press like every other control: they are real links that reload
      the page, and a control that does not react feels broken.
    - Decided by the coordinator, from the rules and the user's earlier answers: the two lists keep the designer's
      hidden 16 px native list under a 13.5 px face. Pressed specimens on the components sheet wait for the
      Settings round.

43. **The CSS round, tried on the phones** (the user, 2026-10-10, after trying build `3b673daa` on their iPhone and
    Android phone over the LAN preview: «كلشي تمام», then «ممتاز خلاص ما يحتاج اشوف مره ثانية», and, correcting the
    coordinator's first wording of this item: «انا قصدت مافيه مشاكل الان وكلشي كويس على حسب تجربتي ... لو فيه مشاكل او
    تحسينات عادي»):
    - The user found no problems on either phone, and does not need to see this round again.
    - Problems and improvements found later are welcome as usual; nothing here freezes the look.
    - Coordinator: the press refactor (`codex-press-hook.md`) keeps every frame equal to `3b673daa` because that is its
      brief's own outcome (P3), not a rule of the user's. Its close is reported to the user in a line.
44. **Daily gets its own files** (the user, 2026-10-11, «ايه لو كان هذا يخلي الكود انظف», on the gardener's first
    code-health reading). Daily's code and styles live inside the shared files: 93 of the 110 places where a shared file
    names one page's elements are Daily's, which is why `app.js` is the concept's largest file, at over 3,200 lines.
    Reports, Access and Activity each have their own files.
    - Daily moves into its own script and stylesheet, as the other pages have. The page looks and behaves the same:
      the frames before and after compare equal with the verify-fitway CLI.
    - It is the first concept round after the environment phase, before Settings (Next steps in the resume point).
    - The gardener's next readings show whether the shared files' size and boundary counts fall.
    - Found while briefing it (coordinator, 2026-10-11): only Daily loads `app.js`, so the script was already Daily's
      under a shared name; the real mixing is in `style.css`, which all five pages load. Daily's round therefore renames
      the script and moves Daily's rules out of `style.css`.
45. **Shared code gets honest shared files, before Settings** (the user, 2026-10-11, «موافق على اقتراحاتك», on the
    coordinator's two proposals after item 44's briefing). In this order, after Daily's own files and before Settings,
    each its own Codex round with item 44's outcome (every page compares equal before and after, both languages, every
    size, both motions); the user does not need to look, and each close is reported in a line:
    - **One shared frame script.** The rail, the header and the status details are copied into each page's script
      (about 400 duplicated lines); they move into one file every page loads, so Settings, Operations and Monitoring
      do not copy them again. Each page keeps its header markup, since the page is complete at first paint (item 4).
    - **`reports.css` split.** Four pages load it under one page's name; what more than one page uses moves to a shared
      file named as shared, and what only Reports uses stays.
    - **The gardener's shared-file list** (coordinator): today a hand list that names page-only files (`app.js`, the
      components sheet's own files) and omits files several pages load (`reports.css`, the picker); it is derived from
      what each page actually loads.

46. **Design-detector findings in Codex rounds** (the user, 2026-10-11, «ممتاز اتفق معك», after Impeccable's hook in
    Codex led it to suppress three findings in a shared configuration file, F138). The hook stays on; its findings are
    hints, not verdicts. Codex reports them and acts on none. The coordinator looks at each on the frames: a real one
    goes to a fresh designer, a false one is recorded with its reason through `impeccable hooks ignore-value <rule>
    "*" --local --file <path> --reason "..."`, scoped to its file, in the build worktree's gitignored
    `.impeccable/config.local.json`. That is the only file the hook reads there (coordinator, 2026-10-11): the build
    branch's tracked `.impeccable/config.json` starts with a byte-order mark the hook rejects as malformed, and the
    concept folder's own `.impeccable/config.json`, which held the 2026-09-24 exceptions, is not read by the hook, so
    those were copied to the local file.

47. **The open tool findings are fixed before Settings** (the user, 2026-10-11: «بس المقصد بنصلحها كلها قبل البدأ ب بناء
    صفحة الاعدادات صح؟», while the mid-motion compare round ran with F119, F122, F126 and F130). Before Settings starts:
    - F135 goes with the shared-files rounds (item 45), as planned.
    - F131, F132, F136 and F137 get one verify-fitway round after the shared files (the user declined a separate round
      for F137 alone). With it, `pnpm codex:round` runs the pre-launch brief review itself (B11, Codex at max) and
      launches only with each reading's disposition recorded (the user, «ما عندي اعتراض»). Also in that round (the
      user, 2026-10-12, «ممتاز», «موافق»): during work a compare can take only the pages a change affects, derived from
      the files each page loads (a shared file means every page), never from which features seem related, with the full
      check still at the end of every round; and the base side's frames, which never change between reruns, are kept
      and reused instead of captured again.
    - F140: the byte-order mark is removed from the build branch's tracked `.impeccable/config.json` and the hook is
      checked to read it.
    - F138 is closed by item 46: the hook is the user's global setting, which agents never change (AGENTS.md); briefs
      say a hook's request outside scope is reported, not acted on.
    - Coordinator, on the user's question which lows go first, since the remaining pages are built in one pass (item
      6): what a new page reuses is fixed before Settings, after the shared-files rounds so each fix lands once in the
      shared file, and checked with the mid-motion compare: the key's glyph softening during the press's settle (first
      confirmed on seeked frames, MOT-1 suspect; a designer if real), the dialogs' parts splitting under a stall, the
      Retry's leftover focus ring, OWN-C9's stale focus-ring rule and the rail's focus ring on Access. What belongs to
      one page (Reports' `#fig-avg` card, fix-3's findings, Access's N1-N7) stays with Next steps 4 and 5 after Settings.
      The user agreed («لا ما عندي اعتراض»).
    - This file stays as it is until the Owner work closes; then its built items shrink to their standing rules as
      they are carried into the ADR (the user agreed, «ممتاز اي اتفق معك»).

48. **The work before Settings runs in parallel where it can** (the user, 2026-10-12, «مب مشكلة ادا ما كان فيه مشاكل
    ونقدر نسرع الشغل او فيه مهام او جولات نقدر نشغلها بشكل متوازي», on the coordinator's proposal). This amends item
    47's order:
    - The verify-fitway round starts now, beside the shared-frame round, in its own worktree, and may split into
      Codex rounds on disjoint files run side by side. Its affected-page compares, kept base frames and socket fix
      (F137) then speed up the `reports.css` split and the shared lows. Its builds and tests run at any time; its long
      compares wait while another round's compares run, until F137 is fixed (the machine: Ryzen 7 7700, 8 cores and
      16 threads, 31 GB; Windows' default 16,384 dynamic TCP ports, the likely limit behind F137).
    - The briefs for the `reports.css` split and the shared lows are written and reviewed (B11) while rounds run, and
      each launches as soon as the round before it on the build branch closes.
    - Codex resumes on gpt-6.1-sol and falls back to gpt-6-sol on the same thread when gpt-6.1-sol answers "Selected
      model is at capacity" (the user, 2026-10-12); a usage limit is the user's account switch.
    - A parallel-compare round follows vf-speed (the user, 2026-10-12, «اي», on the coordinator's proposal after the
      measurements queued for hours on one port pair): each round gets its own port pair, so two or three rounds
      measure at once, and one compare command can spread its pages over several workers. It comes after vf-speed,
      which changes the same files and fixes F137 first. Widening Windows' dynamic port range is not needed: at the
      round's load at most 739 of 16,384 ports were in use (coordinator measurement, 2026-10-12).

49. **Settings, the answers before its one pass** (the user, 2026-10-13, «موافق عليها كلها», on the coordinator's
    recommendation for each of the research digest's questions Q1-Q10, `D:/fitway-temp/owner-r04-settings-questions/
    REPORT.md`). Settings holds the owner's five editable axes: capacity, the three crowd-level limits, the weekly hours,
    the end of the business day and the reset buffer.
    - **A reason when saving:** an optional "Reason" (at most 240 characters, what the log stores), shown in Activity
      log. A Product/Spec amendment: production's form has no reason input.
    - **The log says what changed**, for example capacity 120 → 140, by comparing the saved version with the one before
      it, not only "Settings updated" (item 31). A Product/Spec amendment that answers SPEC story 26's "from → to".
    - **A confirmation before saving** lists each change from → to, since a saved value reaches the visitors' page at
      once. Its look is the designer's.
    - **No hours for a later date** (Ramadan, Eid) for now: the owner changes them on the day. A "from this date" field
      is recorded as a later idea; it needs new storage.
    - **The five technical values** (time zone, push, fresh, stale, poll) are not shown on Settings; only "Riyadh time"
      beside the hours, as the hours' unit.
    - **Each crowd level also reads in people** beside its percentage ("Quiet up to 29 people"), computed in the page
      from capacity; the contract stays in percent.
    - **A value that looks like a mistake** (capacity 5, every day closed, opening equal to closing) is accepted with a
      plain sentence under the field, not refused.
    - **Times are entered in 12 hours with ص/م** on the page (DAT-1), 24 hours on the wire.
    - **Leaving with unsaved changes** asks first.
    - **Two owners saving at once:** the second sees what the other saved, and keeps their own typed changes in view to
      apply again; nothing is merged silently.
    - Decided by the coordinator from the rules (not asked): the rail and bar slot, owner-only, no visitor data; the five
      read-only values are never editable (the contract; PHASES' "freshness configuration" yields to it, C1); capacity
      and percentages may show on owner pages (DESIGN_GUIDE.md lines 86-87; the concept's TRU-6 is the public side's,
      C5); time zone, feed geometry and transparency wording are site checks, not Settings (SPEC, C6); no technical
      language or explanatory captions (DO-NOT, C8); the page's composition is the designer's alone, as for Access
      (item 33).
50. **Daily's light tuner goes** (the user, 2026-10-13, «اداة الاضائة شيلها ماعد احتاجها خلاص»). The dashed
    "الإضاءة · Lights" button at the top of Daily and the light tuner it opens (`tuner.js`, its recipes and the
    README's account of it) are removed; the static lights on the cards (LGT-1 to LGT-8) are not the tuner and stay.
    It runs after the shared-frame round merges, so that round's comparisons keep their base. It also ends F126, whose
    unstable render was the tuner's chip.
51. **Every page in the concept before any move to production** (the user, 2026-10-13, «اي بس بعد ما نخلص الصفحات
    كاملة», «اشوف يمدينا نخلصها كامله»). After the tool fixes (item 47), the concept gets every page it still lacks:
    Settings (item 49), Operations and Monitoring, the public crowd page, the front-desk screen and sign-in, in that order
    unless the user reorders. The move to the production application waits for a later decision of the user's. When it
    comes, the user has accepted in principle («موافق معليك», on the production-readiness digest of 2026-10-13) the
    concept's Product/Spec amendments (`DESIGN-SPEC.md` §4.4.1, AMD-C1 to C8; the usual-day baseline; Settings' reason
    and its log entry naming the change) and Readex Pro in place of Cairo; each is still written as an explicit
    amendment at the move, and the move restructures the Owner code into shared modules rather than porting page files
    one to one.
52. **The order of work, and two labels on every open finding** (the user, 2026-10-13). Tool and testing fixes come
    before the next pages, since they make those pages faster and better; small design issues nobody sees wait until
    after the demo; anything visible that would make the demo look bad is fixed before it. Each open row of
    `docs/phase-records/handoffs/agent-environment/findings.tsv` carries two labels after its status (coordinator, the
    same day; a closed row leaves both empty):
    - `seen_by`: `owner` (the owner sees it on the page), `checks-slowed` (our checks run slower or need reruns),
      `check-missing` (a check we cannot run yet), `setup` (the machine or the tools' configuration).
    - `demo`: `blocks`, `lowers` or `waits`, read against the private demo plan (pages shown as device mock-ups, a
      video and a PDF built from the concept).
    The page lows recorded outside the table (Reports' `#fig-avg` card, fix-3's observations, Access's N1-N7 and the
    focus rings) carry the same two labels in the resume point.
53. **Claude Code on DeepSeek, compared with Codex on DeepSeek** (the user, 2026-10-13, on Open Design's API page,
    which offers an Anthropic Messages format «Recommended for Claude Code»: why it was not raised before, and why
    Codex). Codex stayed the harness when the rounds moved to DeepSeek only because the launcher, the brief rules, the
    sandbox and 30-odd rounds of records were built on it; the two harnesses were never compared. A closed round,
    deepseek-route, is replayed on Claude Code (`--bare`, auto permission mode with DeepSeek as its classifier, Open
    Design's Anthropic base URL `https://amr-link.open-design.ai`) from the same HEAD with the same brief and graded on
    the same held-out rows; the better harness carries the rounds that follow. The user: Open Design's credit is open
    and is not weighed when choosing what runs in parallel. The launch scripts run under an allow rule the user
    approved for `bash D:/fitway-temp/cc-*/launch.sh` in this worktree's local settings.
54. **vf-parallel: the optimization stays, and fresh sessions for both** (the user, 2026-10-14, after P2's 4-worker
    self-compare took 581 s against 1112 s, 25 s over the brief's "at most half", and Codex committed `f3601821`,
    fewer manifest rewrites, to meet it). The 2x bar was the coordinator's way of measuring decision 48's "a fraction of
    today's time", not the user's; the timings also ran beside the coordinator's Claude Code replay, against the brief's
    "both run alone". The user chose to keep `f3601821` (it may make compares faster), to stop the run and save its
    progress (`D:/fitway-temp/owner-r04-vf-parallel/STOPPED-2026-10-14.md`), and to continue Codex in a fresh session
    with a clean context rather than resume its thread, and the coordinator in a fresh session too. The new brief
    (`codex-vf-parallel-continue-2.md`) measures everything on the delivered commit, with nothing else running while
    P2 is timed. The bar stays as the round's brief states unless the user changes it; the coordinator's recommendation
    was a floor of 1.5x judged at grading on a quiet machine.
55. **vf-parallel: three timings each, and a look for more speed** (the user, 2026-10-14, before the fresh session's
    launch): each of P2's timings runs three times and the medians count, since trustworthy numbers matter more than
    the hours they take; the speedup so far suggests compares can go faster still, so the round first breaks a
    4-worker compare's time into its phases and takes a change only where that breakdown shows time it removes, never
    one that measures less; and every timing runs on a quiet machine. The bar is unchanged (item 54). Carried by R3 and
    R5 of `briefs/codex-vf-parallel-continue-2.md`.
56. **pstack's ideas, not its plugin; B6 loosened; three timed runs** (the user, 2026-10-14, «I agree with your
    recommendations», after the coordinator's reading of pstack (`cursor/plugins` at `ce649c03`) and its Claude Code and
    Codex port (`michael-denyer/pstack-claude` at `94f5ce95`)):
    - Nothing of pstack is installed: the port's plugin adds a session-start hook that routes every multi-file task
      through `poteto-mode` (it would reach GPT Codex rounds, which keep hooks) and lets skills invoke themselves.
    - **`correct`'s method** is adopted without the skill: a mistake class that happened twice is fixed at the highest
      level that works (structure, then types, then a check whose error names the fix, then a test; prose last, for
      judgment only), and each new check is proven to fail on the real past mistake. Its rule-to-enforcer table in the
      agent instruction file is not adopted (an AGENTS.md change; ask first).
    - **`benchmark-checklist`** is folded into brief rule B13: three alternating runs per side on a quiet machine,
      every run with the median and range, the limiter, the errors counted and proof the work ran; more runs only
      where they could change the decision, never to reach a fixed number.
    - **`no-comments`** gets one report-only trial on the tool code we own (the verify-fitway CLI and
      `scripts/agent-environment`): its `MUST KILL` flags become findings, nothing is deleted by it.
    - The small encodings go as the coordinator proposed: F140 in the tuner round, F154 by launcher-fixes-2's automatic
      resume, F158 with a test that pins SKILL.md's claims to the CLI in the verify-fitway fixes round; the BOM check,
      the launcher's `MSYS_NO_PATHCONV` and `TEMP` guards, a B3 check in `brief:check` and a check that `CLAUDE.md`'s
      agent table matches the definitions go in one small extra round run beside the planned ones.
    - **B6** now allows several small causes, related or not, in one round when each has its own outcome and check;
      they split when one changes what another measures, needs a decision or another base, or outgrows one review.
57. **The brief's length warning measures what one review can cover** (the user, 2026-10-14, agreeing with the
    coordinator's reading: the 80-line warning had no measurement behind it (agent-environment DECISIONS 4 and 6 set
    "at most a warning, measured first" and templates of about 40 lines), it fired on 13 of the 14 r04 Codex briefs,
    and brief-caused failures did not follow length; on 2026-10-14 it failed CI on the template, whose checklist never
    reaches the agent, and B6, B8 and B13 were folded onto single lines to pass):
    - `brief:check` counts only what reaches the agent (the coordinator checklist excluded) and warns, never fails.
    - The warning is on the outcomes and limits a brief asks for, at a threshold derived from the past rounds' records
      (outcomes and limits per brief against brief-caused failures and the review's readings), not chosen; if the
      records show no threshold, the round reports that and keeps a count without a warning.
    - B6, B8 and B13 go back to wrapped lines with the change. It goes in item 56's encoding round.
58. **DeepSeek stays on Codex; the Claude Code replay is deferred** (the user, 2026-10-14, after the coordinator's
    reading of the partial replay, `codex-rounds.md` §"Evaluation: Claude Code on DeepSeek, the partial replay"):
    Codex has carried four DeepSeek rounds to graded results, so item 53's comparison is not finished on purpose and
    takes no more hours without a practical reason. It is reopened when one of these is observed: Codex's route through
    Open Design breaks or degrades; early ends (F154) keep costing real time after the automatic resume; a task needs a
    capability only Claude Code has; or Codex's start load or `apply_patch` failures become a measured bottleneck. The
    working Claude Code settings stay recorded in item 53, as a fallback beside GPT on Codex.
59. **The two stopped rounds continue, one at a time, tuner first** (the user, 2026-10-14, «اي و طبيعي», after
    asking the coordinator to stop tuner-removal and vf-fixes so the session could end; its context had grown large,
    not a judgement of the rounds). Each continues in a fresh Codex session on DeepSeek from its saved side-branch
    commit with a short continue brief (item 54's precedent): tuner-removal first, since it is furthest into its
    measurements, cleans the build branch and its CI, and finishes on the CLI it started with; then vf-fixes. Never
    both at once (F168, and load on the compares). They start in the next session, after launcher-fixes-3 is graded.

60. **Two lines from GPT-6.1 Sol's instructions go into the shared block, not the catalog** (the user, 2026-10-14,
    «ضيف السطرين للبلوك في الجولة الجاية», after the coordinator's comparison of Sol's Codex instructions with the
    pinned GPT-5.5 text that DeepSeek receives, F172). The pinned catalog stays as it is: Sol's text assumes tools the
    DeepSeek catalog lacks (`functions.exec` batching, user-input and multi-agent tools), drops the editing rules the
    rounds rely on (`apply_patch`, never reverting others' changes, no destructive git) and the line against ending a
    turn while commands run, and asks for an update at least every 60 seconds, which ends a DeepSeek run (F154). Its
    two useful rules join `docs/agent-context/briefs/ENVIRONMENT.md` and the role templates from the next brief on:
    meet each outcome in full rather than deleting or loosening what a limit keeps (the tuner round's `capture.mjs`),
    and treat shell command text as code (`JSON.stringify()` is not shell quoting). Briefs written before keep their
    v1 block as it was; `brief:check` compares a brief with the current block, so it now flags them, which matters
    only for a brief launched again.
61. **The coordinator hands over to a fresh session itself** (the user, 2026-10-15, after the Claude Desktop update
    review, «نعتمد Side Sessions للتسليم بين جلسات الـCoordinator، لكن بدون أرشفة الجلسات القديمة»). When the user asks
    for a handover, the coordinator first lets its own work and background tasks finish, commits the resume point,
    then starts one session with `start_session` (`context: "fresh"`, this worktree, `use_worktree: false`, the brief
    «كمل» plus a short background) and stops working; the new session takes the role through the normal startup.
    Nothing is archived and nothing new is built: old sessions stay as they are. The handover needs the user's word
    on a user turn, since the app refuses a start on a turn another session or an automated event began. The cause
    this answers: on 2026-10-15 the previous coordinator, opened while vf-fixes still ran under it, woke when the run
    ended and committed a resume point (`6db75be8`) while a newer coordinator was active.
62. **The encoding round splits in two, and the coordinator carries on through the night** (the user, 2026-10-15,
    «موافق على تقسيم Encoding Round إلى جولتين متوازيتين مثل ما اقترحت»; on the command that moves main, «فهمت الفكرة
    وموافق عليها. وعندك إذني بتعديل AGENTS.md وWORKFLOW.md والملفات اللازمة إذا كان التعديل يخدم تحسين البيئة»; then
    «كمّل الشغل بالترتيب اللي تشوفه مناسبًا، بما فيه الجولات والمراجعات والاختبارات والدمج بعد التحقق ... إذا ظهر موضوع
    يحتاج قراري الشخصي فعلًا، سجّله وخله لوقت رجعتي، وواصل أي شغل مستقل عنه»):
    - Two Codex rounds run side by side in their own worktrees on disjoint files. **encoding-launcher** takes
      `codex-round.mjs`, its test and its review fixtures: F169, F162's preface form, F156's copy path, F170, the
      launcher's `MSYS_NO_PATHCONV` and `TEMP` guards, and F174. **encoding-checks** takes F129 (K1 checks the open
      milestones against the packets, and one command moves main only to a commit whose CI run passed), the BOM check,
      B3 in `brief:check`, `CLAUDE.md`'s agent table against the definitions, decision 57's count with B6, B8 and B13
      wrapped again, and F173. F171 goes to the diagnosis round with F148 and F165; F168, F175 and F176 stay with the
      next verify-fitway round.
    - Decision 57's threshold (coordinator, from the research digest's 44 rounds at
      `D:/fitway-temp/owner-r04-encoding-draft/research-digest.md`: brief-caused failures rise weakly and smoothly from
      53% to 83% across the ID buckets, with no step, and the long briefs are the early ones): there is none, so
      `brief:check` prints the count and warns on nothing for length.
    - Once the command merges, `AGENTS.md` and `docs/WORKFLOW.md` name it as the only way main moves; the user's
      permission above covers edits to both that improve the environment.
    - The user's permission covers the ordinary engineering steps: rounds, reviews, tests, grading, and merges after
      verification. A question only the user can answer is recorded under "Waiting on the user" in the resume point,
      and the work that does not depend on it goes on.
63. **main is protected on GitHub** (the user, 2026-10-15, «بخصوص القرار الي منتظر موافقتي انا موافق عليه», on
    encoding-checks' review reading 1, recorded under "Waiting on the user"). Branch protection on `main` requires the
    `checks` job of GitHub Actions to have passed on the exact commit, for administrators too, and refuses force
    pushes and deletion; no pull request is required, so main still moves by a fast-forward push, and
    `pnpm main:advance` stays the agents' way to make one. If CI itself breaks so that no commit can pass, lifting the
    rule is the user's call. Applied by the coordinator with `gh api` on 2026-10-15.
64. **Parallel rounds on both models, Sol as grader, and a handover once they start** (the user, 2026-10-15, «موافق
    على خطة التشغيل المتوازي والتقييم بواسطة Sol، وكذلك السماح بنقل التنسيق إلى جلسة جديدة بعد بدء الجولات», after
    noting the rounds' pace and that GPT-6.1 Sol's capacity problem seems solved, with ample credit on both):
    - Up to four rounds at once on disjoint files, each in its own worktree; at most three running compares (one port
      pair each); a timed outcome still waits for a quiet machine (B13).
    - GPT-6.1 Sol at `xhigh` for rounds whose cause is unknown or whose change is subtle; DeepSeek V4.1 Flash at `max`
      for well-specified mechanical rounds. The first wave: reports-css with F160 (DeepSeek), vf-runner with F168,
      F175 and F176 (Sol), diagnosis of F148, F165 and F171 (Sol, report-only), the `no-comments` trial (DeepSeek,
      report-only); the shared lows follow reports-css.
    - A fresh Sol session grades each implementing round against the held-out rows the coordinator wrote before its
      launch, outside the round's worktree; the coordinator reproduces at least one row before using its verdict.
    - A round merges once its branch CI passes; main moves through `pnpm main:advance` once per batch.
    - The coordinator hands over to a fresh session (decision 61) once the wave is running.
65. **Wave 1 stopped and saved; the user starts the next coordinator** (the user, 2026-10-15, «أوقف الجولات الأربع،
    واحفظ وين وصلت كل جولة وحدّث الـResume Point عشان نقدر نستأنفها من نفس النقطة. أنا ببدأ الجلسة الجديدة بنفسي»).
    The four launchers and their Codex processes were stopped; each worktree and temp folder is kept as it stood,
    reports-css's uncommitted split is also recorded on `wip/reports-css-stopped-20261015`, and each round resumes on
    its own thread from its STOPPED note (the resume point says how). The coordinator starts no session.
66. **Two measured trials: both reviewers, and one brief on both models** (the user, 2026-10-15, «موافق على
    الاقتراحين», after the coordinator's reading that the review runs on DeepSeek at `max`, fixed in the launcher, and
    that the records cannot compare the two models: they never ran the same brief, Sol's rounds were mostly concept
    work before the review step and brief rules B8-B13, DeepSeek's mostly tool code after them). Each rule below is
    written before its runs; the coordinator records the result in `codex-rounds.md` and applies the rule as written.
    - **Both reviewers.** Each brief of the next wave is reviewed twice on the same `prompt.md` and `sources/`: by the
      launcher (DeepSeek `max`) and by GPT-6.1 Sol at `xhigh` through `REVIEW.md`'s command with the model changed, in
      a copy of the review folder. For each reading the coordinator records closed or left open, and whether the other
      reviewer also raised it; after the round, which of its brief-caused failures each review had flagged. Rule: Sol
      becomes a second reviewer for every brief if, over at least four briefs, it averages at least one closed reading
      per brief that DeepSeek did not raise; otherwise the review stays DeepSeek alone.
    - **One brief on both models.** vf-runner (`briefs/codex-vf-runner.md`) runs twice from `c699d3fb`: its stopped Sol
      run resumed as the Sol arm (worktree `owner-r04-vf-runner`), and a DeepSeek `max` arm in a new worktree
      `owner-r04-vf-runner-ds` with a copy of the brief that differs only in its worktree, branch and temp folder; each
      arm on its own port pair (the DeepSeek arm waits until one is free). Both are graded on the same held-out rows
      (`D:/fitway-grader/owner-r04/vf-runner-heldout.md`) by the same grading procedure, and the coordinator replays
      every PASS the report claims for V1-V3 in the real path, counting each that does not hold as an overclaim. Also
      recorded: brief rows, automatic resumes and interventions, wall time, tokens. Rule: the arm with more held-out
      rows passed wins; on a tie, fewer overclaims; then fewer interventions. Only the winning arm merges. If the
      winner leads by two or more held-out rows, or has no overclaim where the other has one or more, rounds of its
      kind (a subtle runtime change with an unknown failure path) go to its model from then on; otherwise the split
      of decision 64 stays.
67. **Three of pstack's principles, Opus as a chosen grader, and the no-comments flags as findings** (the user,
    2026-10-15, «موافق على الاقتراحات 1 و4 و5، ونؤجل 3 و6. وبخصوص Opus كمراجع مستقل، موافق لكن بشكل انتقائي للمهام المهمة
    أو المعقدة، مو لكل جولة، وEffort High يكفي. وصحّح سجل no-comments حسب قرار 56», after the coordinator's review of
    `poteto-mode` in `cursor/plugins` at `e5136d82`, ten commits after item 56's reading, none changing its substance):
    - **Separate before sharing, for ports.** A test or tool run binds only ports no other running round holds;
      sharing is removed, not serialized by convention. The verify-fitway tests' fixed verification ports are F183,
      for the next verify-fitway round.
    - **A pickup checks what it builds on.** A coordinator taking over checks each claim of the resume point it acts on
      (a time, a state, a disposition) against its source first, and records any that does not hold. The first two:
      wave 1 stopped at about 12:37, not 13:30 (its run folders' last writes), and the no-comments record that opened
      no finding against item 56.
    - **Each claim says what it rests on.** Every claim the coordinator gives the user or writes in a record says in
      the same sentence whether it was measured, inferred or a guess.
    - **Deferred:** a time box in Codex briefs, and a status derived from the run folders instead of written by hand.
    - **Opus grades the rounds that matter.** For a round the coordinator judges important or complex, not every round,
      `owner-direction-verifier` (Opus, its `high`) grades beside Sol on the same held-out rows, from the result alone
      and without Sol's verdict. Where the two disagree on a row, the coordinator's replay of that row decides. First
      use: both arms of item 66's vf-runner trial, whose Sol grader shares a model with one arm; item 66's rule is
      unchanged.
    - **The no-comments flags.** As item 56 says, each confirmed `MUST KILL` flag is a finding (F184-F233; the one
      `unclear` is not); the table is kept beside this file as `no-comments-must-kill.tsv`. They carry a fifth
      `seen_by` label (coordinator), `maintainer`: the next agent or engineer who changes that code pays for it.
68. **The diagnosis reruns on a quiet machine** (the user, 2026-10-15, «موافق», on the coordinator's reading that
    the diagnosis round's 130 runs were labelled quiet while two other rounds compared): D1 (F148) and D2 (F165) run
    again only when no other round, compare, ladder or grading runs on the machine, with the load measured beside
    each run. Withdrawn by item 69.
69. **No diagnosis rerun; DeepSeek for the subtle runtime rounds too** (the user, 2026-10-15, «نلغي إعادة D1 وD2
    حاليًا، أشوف النتائج السابقة كافية وما يحتاج نكرر الاختبارات. وبخصوص تجربة النموذجين، أفضل DeepSeek للجولات المشابهة
    لأنه أسرع بفارق واضح، حتى لو اعتبرنا النتيجة تعادلًا بعد استثناء إيقافي لجولة Sol»):
    - Item 68 is withdrawn. F148 and F165 stay open as recorded (not reproduced in 130 runs); no further diagnosis is
      planned, and an item they hit is rerun once before it is read as a regression, as before.
    - Rounds of the vf-runner kind (a subtle runtime change with an unknown failure path) go to DeepSeek V4.1 Flash at
      `max`, replacing decision 64's split for them: on the same brief the two arms scored the same rows and
      overclaims, and DeepSeek finished in about 71 minutes against about 3 hours (measured). GPT-6.1 Sol stays the
      grader (decision 64) and the second reviewer of item 66's trial; Opus grades the rounds that matter (item 67).

70. **Diagnosable logging: three tool fixes, the server's errors later** (the user, 2026-10-15, «اي موافق على
    تحسيناتك», after the coordinator's review of the logging against the user's statement of pstack's "Diagnosable
    Logging"; the name was not found verbatim in pstack's sources, so the review used the user's own wording: each
    important step records its start, end, duration and result, a failure is diagnosable from the logs alone, and no
    secret leaks or error is swallowed; `D:/fitway-temp/owner-r04-logging-review/REPORT.md`):
    - The next launcher round takes F242 (a report's SHA and ladder checked against what ran) and F245 (each turn's
      start, end, duration, exit, stop reason and HEAD in the run folder), with F234-F237; F246 (the ladder's failed
      step and clock times) goes in the same round or the next small encoding round; F247 (dates and visible errors
      in the resume scripts, outside the repository) is a coordinator edit.
    - The server's error logs (only `error.name`; `edge-push.ts` 500 and 422 unlogged) wait for the move to
      production (item 51), since they touch `apps/**` and need a privacy rule such as the edge's allow-list.
    - Total durations for the gardener and verify-fitway, and a logger library, are not worth it now.

71. **CI's job timeout goes from 20 to 30 minutes** (the user, 2026-10-15, «Yes, raise timeout-minutes in
    .github/workflows/checks.yml from 20 to 30, then rerun CI and move main»). Measured on the merge `f6ef81cf`: the
    job's rerun spent 17.7 minutes in the ladder up to the unit tests (verify-fitway's tests 116.5 s, the unit tests
    914.7 s) plus about 2.3 minutes of setup, and was cancelled at 20 minutes in the Python simulator tests (37 s on
    `772400e4`). The line is the coordinator's lease in `PROJECT_STATE.yaml`; F146 (single tests over Vitest's
    20 s) is unchanged.

72. **Codex's limits do not hold the rounds back** (the user, 2026-10-15, «عادي مب مشكلة معي اربع حسابات codex او
    خمسه ممكن و ايضا لو وصلت كل الحسابات الثلاث الحالية الي مسجله للحد مب مشكلة نقدر نكمل ب deepseek لان رصيده
    مفتوح», agreeing to the session's plan: the grading worktrees cleaned, the launcher and verify-fitway rounds in
    parallel, the shared lows after verify-fitway):
    - Three GPT-6.1 Sol accounts are saved now; the user can add a fourth or fifth. The account rule stays: stay on the
      current account until its limit, then switch.
    - When every saved Sol account is limited, the work carries on through DeepSeek V4.1 Flash, whose balance is open.
      Coordinator: that covers Sol's rounds, briefs' second reviews and grading; a DeepSeek grader then grades a
      DeepSeek round, so the
      coordinator reproduces two held-out rows instead of one, and Opus (item 67) grades a round a merge rests on.

73. **Agent tooling: the route, a code map, a lighter pickup, one CLI contract, map upkeep** (the user, 2026-10-16,
    through a forked side session that relayed it with its assessment: «موافق على جميع اقتراحاتك بخصوص الـRouting
    وCodebase Map وتقليل الـContext وتحسين الـCLI وصيانة الخرائط. وأشوف إننا نستثمر أكثر في تطوير الـCLI عشان يصير
    أوضح وأسهل للـAgents ... و لو فيه مهام مثلا يشوف انها ضخمة و يفضل جلسة جديدة ف له صلاحيتي يبدأ جلسة جديدة ويكمل
    منها هناك ك منسق او الي يبي»). The side session's measurements the coordinator reproduced: `main:advance --help`
    fails as an unknown option, `check:verification-map` prints `DRIFT SKIP` and passes on this line, and the
    packet's task class is `visual-authority-change` though the current work is repository infrastructure.
    - **Route.** Tool work moves to its own milestone with task class `repository-infrastructure`, taking the tool
      paths r04 holds from agent-environment-r03 (scripts/agent-environment, verify-fitway, gardener, the briefs,
      verify.mjs); r04 keeps the concept. The coordinator writes the ledger change (F253).
    - **Lighter pickup.** A short standing-rules file read at startup, with this file read through pointers; the
      packet runs `pnpm check:repository` instead of reading `scripts/verify-repository.mjs` whole.
    - **One CLI contract** (the user wants more here): every agent-facing command answers `--help` with usage and
      exit 0, refuses an unknown option by name with exit 1, prints `<command>: FAIL: <what> (<how to fix>)`, and
      documents its exit codes, enforced by a shared contract test; a `pnpm tools` listing generated from one
      registry (F251).
    - **A generated code map** of the agent-facing scripts and skills: each file's main functions with lines and the
      tests that cover them, regenerated by a script and drift-checked in the ladder.
    - **Map upkeep:** the verification map's drift check fails or says so visibly where it checks nothing (F252);
      README's documentation map checked beyond existence; a gardener pass (the last, 2026-10-09, was blocked).
    - Coordinator's order (decisions 47, 48 and 52): the running batch closes first (launcher-fixes-5-fix, ladder-seam
      for F250, main once); then this wave runs beside the shared lows, which are on the build branch and touch none
      of its files; Settings starts after both. The wave starts in a fresh coordinator session (the user's
      permission), from the resume point and this item.

74. **Code quality from the production move's first day** (the user, 2026-10-16, through a forked side session:
    «... وأبي الضمانات تشمل كود الإنتاج مستقبلًا»; the whole approval and its plan are agent-tooling-r01 DECISIONS item 6,
    `docs/phase-records/handoffs/agent-tooling/DECISIONS.md`). When item 51's move to production comes:
    - Production code is written from the concept's spec and behaviour, never copied from the concept's files (the
      concept is outside Biome and carries counted debt); item 51's restructure into shared modules stands.
    - The ratchet and the diff review apply to `apps/` and `packages/` from the move's first commit; the ratchet counts
      them from its own first day, before the move.
    - Agent-environment DECISIONS item 20's production checks stand, `apps/web` as strict as the base config among
      them (today `apps/web/tsconfig.json` does not extend it, measured 2026-10-16).
    - This milestone's concept rounds get the diff review before they merge, from 2026-10-16.
75. **The selected heat cell, apart from the keyboard ring** (the user, 2026-10-17, through a forked side session:
    option C, after the shared-lows-fix-2 grade showed that a mouse click left a selection mark drawn like the keyboard
    ring; `codex-rounds.md` §"shared-lows-fix-2"). On Reports' and Components' heat maps:
    - The selected cell takes a flush 2 px inner edge (`box-shadow: inset`) for every input, mouse, touch and key
      alike; while one cell is selected the other cells dim to 0.45, in normal colours only.
    - The keyboard ring sits outside the cell (`--focus-ring-offset: 2px` for `.hc` and `.cx-hc`), so the ring and the
      selection never draw the same line.
    - In forced colours the selection is a CanvasText edge backed by Canvas, with no dimming and full contrast. The
      coordinator proposed this exemption in the side session for accessibility, and the user approved it there on
      2026-10-17: «بخصوص قرارك اي كان ممتاز موافق عليه». The user confirmed it in the coordinator session the same
      night and named it their decision: «موافق على استثناء forced colours في الـ heatmap (بدون خفوت)، سجّله قراري».
    - Delivered in `51d5a783` (branch `owner-r04-heat-sel`; `owner-followup-r04-build` fast-forwarded to it):
      `check-concept-css` passed and CI passed (measured). Reports below 1280 px shows the day form, with no heat
      cells; its phone page is byte-identical before and after.
76. **The demo first: the order after the CLI contract** (the user, 2026-10-17, through a forked side session, after
    it read the demo plan in `D:/fitway-private/demo-plan.md`: «اي فهمتني صح و موافق على الترتيب و بخصوص الثلاث الباقية
    عادي تشتغل بجانب الديمو يعني ب التوازي لو يمدي ما يحتاج نأجلها اعتقد»).
    - **The goal, as the user confirmed it:** reach the gym owner as fast as possible with a demo built from every
      concept page. What is visible and would make the demo look bad is fixed first, and Arabic gets no compromise;
      invisible issues wait. A tool fix goes before pages only when it makes the pages faster or better.
    - **The order:** (1) the CLI contract closes and reaches main; (2) Settings starts straight after, with
      agent-tooling's report-fields round beside it (disjoint files, item 64): the claimed-commit field and structured
      report rows serve every page round, since DeepSeek reports overclaim (F242, F265, and V3 again on the 1017
      replay); (3) also beside Settings, the verification-map part of map upkeep (F252: `check:verification-map`
      prints `DRIFT SKIP` and passes, so a new page's recipes could drift unseen), before more pages are added;
      (4) the other three tooling rounds (the ratchet's code-line count, the giant-file split, the lighter pickup)
      run beside the pages and the demo, in parallel where capacity allows; they are neither deferred nor gating.
    - This replaces item 73's "Settings starts after both" and agent-tooling-r01 DECISIONS item 10's order (the split
      before report-fields); agent-tooling-r01 DECISIONS item 11 points here.

77. **Settings: arrangement ب** (the user, 2026-10-18, before switching Claude accounts: «قراري النهائي بخصوص الهيكل
    الثالث هو الخيار ب», and «لا تبدأ التصميم أو البناء أو أي تعديل على الصفحة الآن»). Of the skeleton's third pass
    (`designer-settings-skeleton-3.md`, `2828ae9e` on the build branch; report and frames in
    `D:/fitway-temp/owner-r04-settings-skeleton/REPORT.md` §"Third pass"; artifact
    https://claude.ai/artifact/6AwDy1L1hZKE5jDRAg1hn8), the user chose ب: all five values on one sheet (5/12) beside a
    panel (7/12) that shows the log with its reasons, the editor opening there on «تعديل», the label «قيد التعديل»; the
    phone, the 390 sheets and the dialogs as the user kept them from v2. The one-pass build (item 6, decision 49) starts
    in a new session after the account switch, at the user's word; nothing on the page changes before then.

## How this milestone's rounds run

1. **A design round:** a fresh designer, then a fresh reviewer, then the coordinator inspects the frames, then the
   user decides. The user sees exact rendered crops, numbered for comparison; the coordinator starts any preview
   itself.
2. **Agents** follow the table in `CLAUDE.md`; a long-context designer is never resumed, not even one cut off
   mid-round (item 10).
3. **Codex** runs on DeepSeek V4.1 Flash through Open Design at `max` from 2026-10-13, GPT-6.1 Sol staying available
   at the level the task calls for (`docs/agent-context/WORKING_AGREEMENTS.md`, "Delegation"; item 58), launched by
   the coordinator with `pnpm codex:round` (`docs/phase-records/handoffs/agent-environment/DECISIONS.md` item 7), and
   is not used in cloud sessions. Its briefs follow the brief rules B1-B13 in the checklist of
   `docs/agent-context/briefs/codex.md`.
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
