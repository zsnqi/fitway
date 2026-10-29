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
