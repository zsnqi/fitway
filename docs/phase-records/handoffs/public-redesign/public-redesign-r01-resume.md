<!-- handoff-format: resume-point-v1 -->
# public-redesign-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-11-04 (sketch 14 reviewed;
  sketch 15 reviewed; the arrival fixed for Brave; the font fix done; sketch 16 and its hours and axis rounds built,
  items 52-53; the overnight sequence running, item 54; the fix round in, item 58; the final verifier read, item 59; the last fix round in, item 60; the user's notes in a sketch outside the repository, the page paused, item 61; the phone's head picked, item 62)
- **Standing decisions:** `docs/phase-records/handoffs/public-redesign/DECISIONS.md` (items 1-62; 62 last), and the founding
  ones in `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 84, 90, 98, 99; its "How this
  milestone's rounds run" applies here, but for rounds item 8), `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Opened 2026-10-28 by the coordinator on the user's acceptance of the public page's paper (r04 DECISIONS item 98):
  ADR-010 accepted (`docs/adr/ADR-010-public-composition-authority-supersession.md`), the amendments P-1…P-6, G-1…G-9
  and S-1…S-11 applied to `FITWAY_PRODUCT.md`, `DESIGN_GUIDE.md` and `SPEC.md` (item 98 lists the six places that differ
  from the draft), and the register's `public` row at status 5 (measured: `pnpm check:repository` and `pnpm
  check:agent-context` pass at the opening commit). The drafts stay as provenance in
  `docs/phase-records/handoffs/owner-design-exploration/r04/public-page-paper/`.
- The first round's three directions (`cbff8300` on `public-redesign-r01`, pushed) are set aside (DECISIONS item 3).
  The page lives in Eclipse's folder, beside the Owner pages, and reaches `owner-followup-r04-build` through the merge.

## Running now

The overnight sequence (item 54): the motion review, the Arabic round (item 55), the states and sizes round (item
56), the direction review and the specification (`6fd18e53`, item 57) and the fix round (`5951ae53`, item 58) done;
the final verifier (`review-public-final-44.md`, item 59) and its fixes (`748c2a7c`, item 60) done; the page waits on
the user's read of the report and item 60's open points; and the
user's page server (port 3181,
Terminal tab). Public branch `public-redesign-r01` at `public.*` (item 55) on sketch 16 with the
axis round (`0fad27b9`, item 53), the hours round (`77d2469b`, `89d2996d`, item 52) and its build (`0fca4c0e`, item 51), on sketch 15 with the Brave fix (`2c911cb1`) and the font fix (`1593df75`), on Markdown-only record
commits cherry-picked from the coordinator line, pushed. Briefs reach it by cherry-pick, not merge, until
agent-tooling-r01's `5f78b77c` (brief:check reads a merge by its first parent) is integrated. The LAN entry
`public-redesign-lan` (port 3181, the PC at 192.168.8.186) serves its Eclipse folder: `public-sketch-8.html` to
`-14.html` the narrowed direction, `public.html` B's draft, `public-sketch-1.html` to `-7c.html` the earlier sketches.

- **Six directions from sketch 1, A-F** (items 10-12; briefs designer-public-sketches-6 and -7 in this
  file's briefs folder; `6a148a6d`, `7e22756e`; frames in `D:/fitway-temp/public-redesign-r01-sketches-{6,7}/`): the user
  found A-C alike, turned D-F down for trying to impress, and picked B (the word's weight as the level, later dropped).

- **The rules follow items 3, 4, 8 and 9** (measured on the coordinator line, `f5336d95` to `d0606df6`): bans lifted
  by deletion; identity only dark, FITWAY red, the light, Readex Pro; content the level, the approximate count, open or
  closed, the last update, a percentage and today's curve (item 28), with a verdict sentence and the best time today
  allowed, never required (item 3); lights and numbers free to move (reduced motion, one announcement and no
  `requestAnimationFrame` or canvas stay); post-v1 reservations in `docs/spec/06-interfaces-and-contracts.md` for the
  percentage (on by default, no warning) and the curve.
- **Four directions turned down** (items 6, 7, 9; frames `D:/fitway-temp/public-redesign-r01-direction-{2,3,4}/`):
  a timetable (a mess), a status page (tidy, no character), a car's tachometer. The cause the user confirmed: each
  borrowed its idea from another world. Two reference sets found nothing close (items 7, 8;
  `D:/fitway-temp/public-r01-refs/`, `D:/fitway-temp/public-r01-taste/`).
- **Four sketches; the user kept 1, turned down 2-4** (items 9, 10; `e0957a19`; sheet
  `D:/fitway-temp/public-redesign-r01-sketches-5/frames/sheet.png`): 1 the sign, 2 the lit edge, 3 the strip, 4 the
  bands.

## Next steps

The coordinator does these in the session the user opens (`WORKING_AGREEMENTS.md`, 2026-10-29):

0. **Sketch 12, reframed around the trainee's features** (item 34). Done: the agent-tooling round is merged (CI
   41238840993 green on `9a81a355`; `pnpm verify:owner frames` and `sheet` render a public brief's frames and
   sheets), Popular Times is seen and its principle written, every rejection has its reason (item 35), and the brief's
   limits are agreed (item 36). Next:
   5. `day` is polished as sketch 13 and reviewed before and after (item 39; `14d7564f`; review run
      `D:/fitway-temp/public-redesign-r01-review-28/`, its `CRITIQUE.md` and compare sheets). The user reads the before
      and after, item 39's open points and the new copy; the next round follows the user's word.
   6. The second polish (item 40: less text, the level word's place on the computer, item 39's open points) runs from
      `docs/phase-records/handoffs/public-redesign/briefs/designer-public-polish-30.md` (run `D:/fitway-temp/public-redesign-r01-polish-30/`, into
      `public-sketch-14.*`). Built and reviewed (item 41; `ce902305`); the user reads it and item 41's open points.
   7. The third polish (items 44-49): sketch 15, reviewed (A 28/36, finish `ship`), with the Brave arrival fix and
      the font fix (`1593df75`, checked by the coordinator on its sheets and diff).
   8. The fourth polish (item 50): sketch 16, with `?hours=` (finger picking on long days), `?head=` (the live head
      above another day) and "Fri" with a dot. Then: the coordinator checks its frames; the user judges the switches
      by eye; the motion review after reruns on the result (its stopped run is in
      `D:/fitway-temp/public-redesign-r01-review-31/motion-after/`), which closes item 47's trial and the question of
      proposing a rule change; and the user's look at the `?grain=` pick, the hover and the Now readout.
   - What then finishes the page is steps 2 and 3 below: the Arabic round (copy with `ux-araby`, time right to left,
     the `rtl-ltr-reviewer`), the states the page must never show as live (closed, stale, absent, loading), every size,
     then `PUBLIC-SPEC.md` and §6, the verifier and the user's acceptance.
   - The path so far (items 28-31): the images in `D:/fitway-temp/public-redesign-r01-imagegen-21/`; sketch 8
     (`82f54e88`, run `D:/fitway-temp/public-redesign-r01-sketch-22/`); sketch 9 (`ab7b7f63`, run
     `D:/fitway-temp/public-redesign-r01-polish-23/`), with `reach` kept; sketch 10 (`6fb7adf4`, run
     `D:/fitway-temp/public-redesign-r01-polish-24/`); sketch 11 (`938087a4`, run
     `D:/fitway-temp/public-redesign-r01-sketch-25/`), turned down (item 34).
   - In Arabic time runs right to left, as Eclipse's own day line does
     (`design-research/owner-composition-exploration-r04/directions/eclipse/README.md:726`).
1. **B's round 3 is closed** (item 50; items 24-27): the narrowed direction replaced it. Provenance only: brief
   `docs/phase-records/handoffs/public-redesign/briefs/designer-public-english-18.md`, run
   `D:/fitway-temp/public-redesign-r01-english-20/`, `adc665f6` (the stopped designer's unverified work); B's
   history is in DECISIONS items 12-27.
2. **Rounds on the draft** until the user accepts it (item 5's stage one): Arabic, live, phone and computer.
3. After the pick is accepted: every state and size, English, `PUBLIC-SPEC.md` and §6, the verifier, the user's
   acceptance; the copy outside the glossary (five lines in the first round's report) goes to the user.

## Waiting on the user

**Paused 2026-11-03 at the user's word (item 61), while they watch the DeepSeek and GLM comparison in its own session. Do not touch the page until they return.** Then the hold stands: collect their notes; start project work only when they say «خلصت».

Where it stands: everything since item 60 is in a sketch outside the repository, working copy `D:/fitway-temp/public-redesign-r01-sketch-62/` on port 3182, not on the page; frozen at item 62 in `D:/fitway-temp/public-redesign-r01-sketch-head-62/sketch/`. Open `public.html?state=live&level=packed&hours=1&type=1&shape=h&audit=1&air=b`; `level=moderate` shows live below usual. Its `STATE.md` lists every switch and carries the Google figures that stay off this repository. The user is away from home and cannot open LAN links (2026-11-04): send pictures as files until they say they are back.

Items 61 and 62 are answered and built in the sketch; nothing is left to do there. More notes may come. They have not said «خلصت».

After «خلصت», in rounds:

3. **Carry items 61 and 62 onto the page**, changing the PUB records it touches, then a design round for the final form (colours, bar motion, English; English Friday «11 PM» is 1.4 px from the card's edge at 320; the 16 px hour against the 24 px touch target), then a second independent verifier. This covers item 60's Unavailable fix, widened by the audit.
4. **Collected from their notes:** Arabic order at small phones needs rework; proportional figures; ranges from the right everywhere; the week starts Sunday; `font-display: optional`; keep «نحو 70 في الصالة» and remove «مفهوم استكشافي»; the `statechart` note; the narrow AGENTS.md design-skill amendment; hours under bars from opening, never mid-bar; the quietest hour named only by its circle; the quiet line («10 ص هادئ عادةً», «12 ص أقل زحمة عادةً», or hidden; never «لاحقًا» or «الآن»); no shadda in «تعذّر», «تحقّق», «تكرّر»; 6 px between «تحقق من الاتصال» and retry; change or delete «لا نعرض عددًا قديمًا»; the Owner pages' hours; Reports' nearly empty «معدّل الموجودين» card; a general review of text sizes and weights across states, with the audit's copy doubts.
5. **CI:** the agent-tooling resume cites its decisions part 025-040 by a short path, which should run from the repository root, `docs/phase-records/handoffs/agent-tooling/decisions/025-040.md`; `public-redesign-r01` is red on the Code health ratchet, not yet read. Then push.

Still open from item 60: AMD-P1 to AMD-P6 and the motion trial's rule change, a proposal only (item 47).

Servers: check that 3181 (the page), 3180 (Owner) and 3182 (the sketch) answer and read the PC's address before giving a link. Start one with `serve`, not `_serve`, from `.agents/skills/verify-fitway/cli.mjs`.

## Known risks

- The manifest's `public` entry still reads `ACCEPTED_PAPER_AUTHORITY` (`visual-direction-gate/approved/`, the route
  authority manifest `:35`); the register explains it; re-statusing it is a follow-on manifest workstream, never this
  milestone's edit.
- The production Public catalog says «ممتلئ جدًا» for Packed and `العدد التقريبي` for the count
  (`apps/web/src/i18n/messages/ar.ts`); the concept uses the amended wording; the catalog changes only at a production
  move.
- Eclipse's `backdrop-filter` blur and grain are unmeasured on a slow phone (the budget waits until after the demo).

## Pointers

- Worktree: `D:/Projects/fitway-worktrees/owner-design-exploration-r04` (the coordinator line), branch
  `codex/owner-redesign-r04`, expected HEAD the commit that last changed this text; the rounds' worktree is created at
  the first round.
- The public page's user answers: r04 DECISIONS item 90; the line sort: `D:/fitway-temp/owner-r04-public-rules-sort/REPORT.md`.
