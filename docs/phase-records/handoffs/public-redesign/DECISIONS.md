# public-redesign-r01: decisions in force

The milestone's founding decisions are owner-design-exploration-r04's
(`docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 84, 90, 98 and 99). New decisions for
the public page are numbered here.

1. **Opened in Eclipse's folder, under a lease for §6** (the user, 2026-10-28, r04 item 98's ninth question): the page's
   files sit beside the Owner pages in `design-research/owner-composition-exploration-r04/directions/eclipse/` and use
   its shared sheet directly; this milestone owns only `public.html`, `public.css`, `public.js`, `PUBLIC-SPEC.md` and
   `public-capture.mjs`, and writes `DESIGN-SPEC.md` §6 under a coordinator lease from owner-design-exploration-r04.
2. **No skeleton** (the user, 2026-10-28, r04 item 99): the first round draws two or three whole directions in
   Eclipse's style, at 390 px first in Arabic and English, and the user picks by eye. The loading state's placeholders
   are still designed and built.
3. **The first round's three directions are set aside, and the page is designed free of the Owner rules** (the user,
   2026-10-29, after seeing `cbff8300`: «الخيارات كلها ما عجبتني»; then, on the coordinator's restatement of the goals,
   «ب الضبط», «نعم», «اي», «يب»). Supersedes the parts of r04 item 90 named below and the first brief's constraints.
   - **Why the round failed (the coordinator's reading, which the user confirmed):** the first brief carried the Owner
     dashboard's rules into a one-message public page: Eclipse's sheet "as it is, no new tokens" (so cards, and the
     largest type capped at 46 px), the answers' fixed vertical order, and an open question framed as "the level mark's
     form", so the three options differed only in a meter's shape; with most content removed, each page ended halfway
     down the phone. The process was narrowed too: three options from one designer, no reference study, no word on what
     the visitor should feel, and Impeccable's own steps skipped because only three files could be written. And a gym
     name was invented because item 90's frame named one beside the brand.
   - **Goals:** visitors open the page on their phones to see whether the gym is busy now; the page is designed at every
     size, phone to computer. Its identity is FITWAY's: dark, the red and the light are the gym's own colours, not the
     Owner pages'. Everything but the identity is the designer's: composition, sizes and type scale, cards or none, the
     crowd mark's form, the order on screen, and how the whole screen is used. The Owner pages' rules are a reference
     for the identity only.
   - **Content:** the crowd level, the approximate count, open or closed and the last update; the typical-day curve
     comes back (the user: it helps the visitor); a verdict sentence and "best time to come today" are allowed, the
     designer's choice, never required. The typical-day curve needs history the public endpoint never reads today
     (`docs/spec/06-interfaces-and-contracts.md`); the concept uses synthetic data, and the coordinator writes the SPEC
     amendment for production and shows it to the user then («تمام»).
   - **The name:** the gym is FITWAY, its only branch; the brand at the top is its name, with no second name line.
   - **Kept, as truth rules, not design rules:** the count is labelled approximate; stale, closed or absent data never
     looks live; no personal data; Arabic and English.
   - **A percentage:** the user prefers to show one for now and leave it to the gym's owner later (open; see the resume
     point). Product and SPEC forbid it publicly today (`FITWAY_PRODUCT.md`, the capacity-free contract;
     `docs/spec/06-interfaces-and-contracts.md`, the post-v1 reservation: count plus percentage reveals capacity).
   - **Also fixed with the rules:** `DO-NOT.md` ("Public stays light") and `DESIGN-SPEC.md` §6 ("mobile-first, light")
     say dark, as item 90 does (the user: «اي لازم نحلها»).
   - **The next round:** several designers, each drawing one whole direction of its own, starting from references and
     following Impeccable's full process. The rule changes and the brief are done in a new session (the user: «ممتاز
     ولكن مو ب الجلسة الحالية»).
4. **A public percentage: shown in the concept, the owner's setting later, on by default** (the user, 2026-10-29, in
   the coordinator session: «1» to the coordinator's suggestion, then «2» to "on by default", after the coordinator
   recommended off for privacy). Settles item 3's open percentage.
   - **The concept** may show a percentage on synthetic data; the page reads whole without it, since the owner can turn
     it off.
   - **Production:** approved in principle for after v1, through `docs/spec/06-interfaces-and-contracts.md`'s reservation
     (a new versioned API, the server deciding, an owner-only setting, an audit), with the setting on by default and no
     warning (the user, the same evening: «شيل التحذيرات, مب طفل هو»; the reservation's warning clause is removed). Its own versioned Product/Spec change still comes before any implementation; v1's public contract stays
     capacity-free.
   - **Applied** to `FITWAY_PRODUCT.md` (the success-and-boundary paragraph) and
     `docs/spec/06-interfaces-and-contracts.md` (the capacity boundary), as shown to the user before writing.
5. **One direction at a time, in two stages** (the user, 2026-10-29, in the coordinator session; supersedes item 3's
   "several designers" for the next round).
   - **One direction per round**, never several in parallel: the user sees it, then decides to carry it on or to draw
     another; what the user says about one goes into the next brief.
   - **Stage one, the draft:** `owner-direction-designer` (Opus) draws the direction in Arabic, in the live state, on
     the phone and on the computer. The user sees two frames and a link for the phone on the home network. The brief
     names only that scope; it says nothing about motion, states, English or the tablet, so nothing steers the design
     (motion the idea needs, the designer builds).
   - **References:** a Sonnet researcher gathers a wide set (links and screenshots, unranked, no judgment) before the
     designer starts; the designer looks at the images and picks. Sonnet fetches, Opus chooses («بس احس فيه سلبية»:
     a Sonnet summary would filter by Sonnet's taste).
   - **Stage two, only for the direction the user accepts:** every state, English, the tablet and every other size,
     the motion's details and reduced motion, by a builder; then the verifier and the user's acceptance.
6. **Direction 2 is turned down** (the user, 2026-10-29, on its phone and computer frames: «ما عجبني»; then «كل شي»,
   start from nothing with a wholly different idea; «حسيت الشكل مب مرتب»; «شكل المنحنى الطولي مب كويس»). Direction 2,
   the day as a timetable with the current hour lit (`32732dbf`, its invented gym name removed in `c5f64fa5`), stays in
   history only. Direction 3's brief carries the user's words; the brand FITWAY is the only name on the page.
   - **Why, from the user's answers** to the coordinator's observations and questions: nothing sat on one line (the
     hours on one edge, the percentage on the other, the mark across the page) «ب الضبط»; the eye did not know where to
     start, the answer squeezed between two pieces of curve; the curve drawn two ways (a thin grey line, then a red
     fill); too many type sizes; on the computer, the answer far on one side, the curve on the other, empty gaps
     between «نعم» («فوضى ... مدري وين اناظر»). The curve: time running top to bottom, its twisting shape, and its two
     halves (its size was fine); its motion did not feel good, the Owner Daily chart's motion is better. Not the
     cause: too many things on the page. What the eye meets first and the page's feel: the designer's («خلها للمصمم»,
     «خلّه يجرب»).
7. **Direction 3, the status page, is turned down** (the user, 2026-10-29, on its phone and computer frames: «برضو ما
   عجبني»; `5f809979`). To the coordinator's questions, all four causes: plain, with no character, like any app; closer
   to the Owner dashboard than to a page for a visitor; the rows of facts read like a table, dull; small and empty on
   the computer. It was tidier than direction 2 («اي هذا ارتب كان»): the order is kept, the character is missing.
   Next, at the coordinator's suggestion («يلا موافق»): the user marks a numbered sheet of varied references, liked or
   not, so the next brief carries the user's taste as images.
8. **No references for the next direction; the designer creates from its own judgment and Impeccable** (the user,
   2026-10-30: none of the 15-tile sheet was close to the goal, «ما يشبه هدفنا»; the user's own Pinterest search found
   nothing either: «الظاهر انه بنحتاج المصمم يبدع من عنده و ب استخدام المهارة»). The gathering of gym apps' crowd
   screens was stopped unfinished. Direction 4's brief gives no reference set and carries the user's words on
   directions 2 and 3.
9. **Direction 4, the instrument cluster, is turned down; quick sketches next; the curve is no longer required**
   (the user, 2026-10-30: «ما عجبني انه يكون ك عداد سيارة»; nothing in it liked, «الصفحة بشكل عام ما عجبتني وفكرة
   المحرك»; `4932b9e8`).
   - **The common cause,** the coordinator's observation the user confirmed («اعجبتني ملاحظتك ... اي صحيحة»): each
     turned-down direction borrowed its idea from another world (a prayer-times board, a service status page, a car's
     tachometer). The page should have a language of its own.
   - **The typical-day curve** is no longer required content («ممكن نستغني عنه و يصمم شكل غير ... ما نبي نحده ب ذا»);
     the page's content is the level, the approximate count, open or closed, the last update and the percentage.
   - **Sketches before a draft** (the coordinator's suggestion, «اتفق معك»; amends item 5's stage one): the designer
     first draws four quick phone stills, each a different idea, Arabic, live, no motion, no computer; the user picks
     one, and it becomes a full draft. The user will name apps whose feel they like later.
10. **Sketch 1, the sign, is kept; three directions grown from it next** (the user, 2026-10-30, on the sheet of four
    (`e0957a19`): «الاول احسه كويس ممكن نحسنه او نسوي توجهات منه اكثر»; «الرابع سيء»; «الثالث مب مره كويس»; of
    sketch 2, «ما عجبتني الحركة حق القياس ذي», the light climbing both edges to the level's height). Then, to the
    coordinator's questions (asked after the coordinator had started a designer on four variations without asking, «بس
    ماتبي تسألني اول شي»; stopped before it wrote anything): directions grown from it, not a direct draft («أ»); three,
    not four. Amends item 9's "it becomes a full draft". The user confirmed the coordinator's restatement of what
    follows («اي فهمتني»).
    - **The designer is not steered:** the brief does not say what the user liked in sketch 1 (the user: «ما يحتاج تذكر
      انه مرتب او شيء زي كذا عشان ما يميل للكلام»), only that it was kept; the designer sees the sketch and judges it.
    - **The coordinator's three notes on sketch 1:** the large dark gap above the word, the user finds natural, so it
      is not raised; the facts all at one weight, the user is unsure of, so it is not raised; «شديد الازدحام» needing
      two lines is a real problem («صادق يب ف مشكلة ذي»), given as a fact each direction meets, with a second still at
      that level.
    - **No app named:** the user found none whose feel a visitor should get («ما حصلت تطبيق»); no reference set is
      gathered. The brief names the turned-down directions and sketches so they are not returned to.
    - **Next:** the user picks one direction (or none, or parts of two); it becomes the full draft of item 5's stage one.
11. **Three more directions from sketch 1, each going further from it** (the user, 2026-10-30, on the sheet of A the
    ember, B the ink and C the dated sign (`6a148a6d`): «احس كلها متشابه ومب مشكلة لكن خل يسوي توجهات اكثر»; then, to the
    coordinator's restatement and questions, «اي ب الضبط», «أ» to "still from sketch 1, each going further from it, so
    they differ from one another", «ثلاثة زيادة اي»).
    - **A, B and C stay** as options beside the three new ones (the user's «زيادة»; not asked separately).
    - **A fresh designer**, so the first one's reasoning does not pull the new ones toward A, B and C. Its brief carries
      only what the user turned down and that A, B and C read alike; it says nothing of what the user liked (item 10).
    - **The longest word:** at sketch 1's 118 px «الازدحام» alone is wider than the column; A, B and C set Packed at
      100 px. Given to the designer as a fact.
12. **D, E and F are turned down; B becomes the full draft, with craft and no new idea** (the user, 2026-10-30, on D-F
    (`7e22756e`): «كلها سيئة»; then, in a discussion the user asked for, «B كويس الصدق», and to the coordinator's
    restatement, point by point: «اي», «نعم», «اي ممكن نطلع ب اشكال احسن ممكن», «نعم و كم فيه شخص ب النادي», «اي نعم»).
    Settles item 11's pick; amends item 5's stage one by the mark's forms below.
    - **Why D-F failed** (the user's words): each tried to impress the visitor, too much invention
      («تحاول انها تبهر الزائر بشكل كبير او فيه ابداع بشكل كبير»); «مزدحم» in E and F is bad. The designer is told this.
    - **The coordinator's reading the user confirmed:** of about fourteen options only sketch 1 and B were liked, the
      plainest; each round that asked for a new idea got a borrowed world or a trick. The page needs no new idea; what
      it lacks is craft: sizes, spacing, balance, the computer, and later every state.
    - **The visitor takes away three things:** whether the gym is busy, how many people are inside, and that it is open.
      Open need not be prominent: the gym's hours are known («مب لازم نوضحها بشكل كبير عادي»).
    - **One weight for the word at every level** («يفضل ب سماكة وحدة»): B's weight-per-level is dropped.
    - **The four-level mark:** the full draft carries B's bars refined, and the same round draws three other forms of
      the mark, each on the refined page, not on B as it is («حتى الباقي قلنا تحتاج تحسين»). The user picks one.
    - **No subscription to a reference service** («اسحب على المواقع»), after the coordinator's research
      (`D:/fitway-temp/reference-services-research/REPORT.md`); the taste-skill trial is dropped too (only its global
      copy was updated, at the user's word, outside the repository).
13. **B's draft goes to a polish round with Impeccable's commands; the mark is form 1 so far** (the user, 2026-10-30,
    on the draft (`8bd73ee7`) and the coordinator's notes, point by point; then «اتفق مع اقتراحك» to the coordinator's
    proposal: one designer on the draft with form 1, Impeccable's `critique`, then `layout` and `typeset`, then
    `polish`, with no new idea and nothing to impress; Impeccable's commands «ممتازة الصراحة»).
    - **The mark:** form 1, B's bars refined («اشوف رقم 1 احسن الى الان»); its unlit Packed bar being the tallest shape
      is not a problem («مب مشكلة»).
    - **Order and the open line are the designer's** («الترتيب بكيفه و ايضا كلمة مفتوح ... له الحرية ب التصميم»), told
      that visitors already know the gym's hours, since the gym is not new («النادي مب جديد»).
    - **The computer's empty half** above the mark with a short word: acceptable, worth a second look («يستاهل نظرة
      ثانية»).
    - **Quiet and Moderate sitting about 40 px above the mark** (the fixed ground line): the user did not see a problem
      and the coordinator agreed; the fixed line stays.
    - **Packed on the computer:** one line edge to edge (the frame shown to the user on their question).
14. **The polish round is liked; a second one, with the designer's proposals listed apart** (the user, 2026-10-30, on
    `638e6e31`: the critique «ممتاز الصراحة الامر دا», the changes «ممتاز التحسن الي صار»; the user asked for another
    round and for the designer's own proposals; then, to the coordinator's proposal, «ممتاز», «تمام», «ممتاز ايضا», «اي»).
    - **A fresh designer** runs `critique` again on the polished page and fixes what it finds, with the last designer's
      three leftovers: the dark area above short words on the computer; the computer's visual order differing from the
      reading order; the word's size jump crossing 900 px. It ends with `polish`.
    - **Proposals, not applied:** the designer lists its further proposals, each in a line or two with its reason; the
      user chooses which go into a later round. Same limit: no new idea, nothing to impress.
    - **Every state and English** wait until the user says the look is settled.
15. **The second round is liked; three of its proposals are drawn as switches, at the least cost, for images only**
    (the user, 2026-10-30, on `25e06452` and the six proposals: each change «ممتاز», «كويس», «تمام», «حلو»; to 2 and 3
    «بس ابي اشوف ب اقل تكلفة هل يمدي»; to 1 «ابي اشوف الفرق»; to 4 «اتفق معك»; to 5 «ما يحتاج نركز على قارئ
    الشاشة»; then, to the coordinator's plan, «جيب لي صور بس ما يحتاج افتح الموقع»).
    - **Drawn:** proposal 1 (Packed on one line on the computer), 2 (the percentage and the open line swap places),
      3 (short screens keep the stamp), each behind its own URL switch (`?p1`, `?p2`, `?p3`), the page without them
      unchanged.
    - **At the least cost:** `owner-direction-fixer` (Sonnet) on a frozen target, the coordinator reviewing its frames
      before the user sees them; a weak result goes back to a designer.
    - **Not drawn:** 4 (tall tablets), 5 (the level heard twice by a screen reader; the user does not want the focus
      on screen readers; DESIGN_GUIDE §5 stays as it is). 6 (English and the other states) is the stage after the look.
    - **The user sees images, not the site:** before-and-after sheets.
16. **Switches 2 and 3 are accepted; 1 is approved but shown to others first; the count keeps its wording** (the user,
    2026-10-30, on the switches (`c1667d00`) explained in three labelled images: «موافق» to 2 and 3; to 1 «موافق»,
    then high-resolution images of two lines and one line, at Quiet too, on the computer and the phone, to show «كم
    شخص و اخد اقتراحاتهم»).
    - **The count:** «70 داخل الصالة الآن · تقريبًا» stays without «شخص» (GLO-2), the coordinator's view, «اتفق معك
      خلص»; adding it would need the noun to agree with each number and a glossary change.
    - **The images** (2× on the computer, 3× on the phone, switches 2 and 3 on), rendered by the coordinator from the
      page: `D:/fitway-temp/public-redesign-r01-share-12/` (the computer at Packed and Quiet, each with and without
      switch 1; the phone at Packed and Quiet, which switch 1 does not touch).
    - **Next:** the user brings back the others' views; switch 1 is settled then, and the accepted switches become the
      page's default.
17. **The level's word feels too large; two smaller sizes are drawn to compare** (the user, 2026-10-30, on the
    comparison images: «احس الخط كبير ب زيادة و احس ماله داعي الحجم دا»; to the coordinator's questions: the level's
    word only, on every size («كلها»), compare the current size with about a quarter and about a third smaller
    («تمام»), and not drawn by the coordinator itself («لا مو انت»)).
    - **Drawn by** `owner-direction-fixer` (Sonnet) on a frozen target: a `?size=` switch scales only the level's word
      and its own gap; the count, the mark and the small type keep their sizes.
    - **Shown as** comparison images (the user looks at images, item 15), with switches 2 and 3 on and switch 1 off.
18. **The word a third smaller, and Packed on one line** (the user, 2026-10-30: «بختار أصغر بالثلث ويكون شديد الازدحام
    سطر واحد بدل ما يكون سطرين», then a comparison at Packed only). Settles item 17's size and item 16's switch 1.
    - **Rendered by the coordinator** (`?p1&p2&p3&size=67` against `?p2&p3`, Packed;
      `D:/fitway-temp/public-redesign-r01-packed-14/compare-packed.png`), which found two gaps it told the user:
      on the computer the two switches multiply (switch 1's narrower base times 0.67 gives 104 px, not the 127 px of
      a third smaller alone, though 127 px fits one line beside the count); on the phone switch 1 does nothing, and at
      70 px «شديد الازدحام» needs about 430 px against a 350 px column, so one line there needs about 57 px.
19. **On the phone every level's word shrinks to the size that holds Packed on one line; the accepted switches become
    the page itself** (the user, 2026-10-30, on `compare-packed-2.png`: «لا زلت محتار ... صغر الخط اكثر ب الجوال حق
    كلمة المستوى», then option 1 of the coordinator's three: about 57 px for all levels).
    - Below 1024 px the word is `min(its size a third smaller, (100vw - 2 x pad) / 6.131)` at every level, so the four
      levels share one size and «شديد الازدحام» sits on one line (about 57 px at 390 px; the computer keeps 127 px).
    - The page without switches becomes what `?p1&p2&p3&size=67` showed (items 16, 18) plus the line above; the
      switches `p1`, `p2`, `p3`, `p1m` and `size` are removed. A Sonnet fixer makes the edit (brief
      `fixer-public-default-14.md`), not the coordinator (the user: «لا مو انت»).
20. **The phone's Packed, three ways, as an image only** (the user, 2026-10-30, on `8ac6cad5`'s
    `compare-phone.png` with a sketch of a smaller word: «بنجرب اصغر بعد بحيث يكون جملة شديد الازدحام ما تاخذ طول
    الشاشة كاملة ... الحالي ضد لو كان سطرين بنفس الحجم الحالي ضد لو كان مثل المثال», the size of the third left to
    the coordinator: «شوف الانسب انت»).
    - The coordinator rendered it with CSS injected at capture time, the page unchanged: 1 the page (57 px, one
      line), 2 two lines at 57 px, 3 one line at 40 px (the phrase about 70 % of the 350 px column, twice the
      count's 20 px; the user's sketch was about 32 px). Image
      `D:/fitway-temp/public-redesign-r01-packed-16/compare-packed.png`, sent 2026-10-30.
    - **The user picked 3** («3 وهات الان شكل جميع الحالات حقه»): the four levels at 40 px on the phone, rendered the
      same way, `D:/fitway-temp/public-redesign-r01-packed-16/compare-all.png`, sent 2026-10-30. The page still sets
      57 px; folding 40 px in (and its rule at other phone widths) waits for the user's word.
21. **The phone word scales with the width; the computer's size is seen in an image first** (the user, 2026-10-30,
    «تمام» to both of the coordinator's notes).
    - Phone: the word keeps one ratio to the width, «شديد الازدحام» about 70 % of the column (40 px at 390, about
      37 px at 360), every level at that size.
    - Computer: the word is still 127 px, now large beside the phone's. Rendered with CSS injected at capture, the
      page unchanged, Busy and Packed at 1440 x 900: 127, 90 and 50 px (50 is twice the count's 24.75 px, the
      phone's ratio). `D:/fitway-temp/public-redesign-r01-packed-16/compare-pc.png`, sent 2026-10-30. At 50 px the
      count drops with the word's baseline and its percentage line meets the mark (607-631 against the mark at 626);
      at 90 px it clears by 20 px. Whichever is picked, a fixer folds the phone and computer sizes in together.
22. **The computer's word at 90 px; both sizes go into the page** (the user, 2026-10-30, «اتفق معك اي» to the
    coordinator's view that 90 px suits the computer: 50 px is lost on a large screen, 127 px stays heavy beside the
    phone, at 90 px the word still leads and the count clears the mark).
    - The phone: `(100vw - 2 x pad) / 6.131 x 0.7` at every level (about 40 px at 390). The computer: `--size`
      `0.67 x 90 / 126.974`, so 90 px at 1440 x 900 and today's formula elsewhere; Packed on one line from 1024 px.
    - A Sonnet fixer makes the edit (brief `fixer-public-sizes-15.md`, run `D:/fitway-temp/public-redesign-r01-sizes-17/`).
    - Done in `1b2e09eb` (only `public.css`): phone 36.54 / 39.96 / 79.8 px at 360 / 390 / 768 (the brief's 74 at 768
      was the coordinator's arithmetic; `--pad` there is 4.5vw); computer 90 px at 1440 x 900, Packed on one line
      1024-3840, at least 161.9 px clear of the count. One check failed and was left as found: the percentage line
      sits 11.3 px above the mark at 1024 x 768 and 6.5 px at 1280 x 720 (the count drops with the word's baseline);
      the coordinator's crop at 1280 x 720 shows it cramped against the bars. Sheets `compare-phone.png`,
      `compare-computer.png` and the crop `D:/fitway-temp/public-redesign-r01-packed-16/frames/check-1280-crop.png`
      sent 2026-10-30.
23. **The percentage line keeps at least 16 px above the mark; the look is settled and a polish stage is next**
    (the user, 2026-10-30: «تمام» to the coordinator's 16 px, then «خلاص كدا حددنا وش نبي ف نبي الحين مرحلة صقل و هل
    بيكون فيه انميشين ؟ يخلي الصفحة حية او شي ؟»).
    - On the computer only the count column (the count and the percentage) rises, and only where the gap is under
      16 px; the word, the mark and every size where the gap is already 16 px or more stay as they are. The same
      Sonnet fixer as item 22, resumed with the frozen target.
    - The polish stage and whether it carries motion wait for the user's answer to the coordinator's proposal.
