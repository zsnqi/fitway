<!-- handoff-format: resume-point-v1 -->
# public-redesign-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-11-01 (sketch 14 reviewed;
  three of its five open points answered, the user tries the page, item 43)
- **Standing decisions:** `docs/phase-records/handoffs/public-redesign/DECISIONS.md` (items 1-43; 43 last), and the founding
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

Nothing (measured 2026-11-01). Public branch `public-redesign-r01` at sketch 14 (`ce902305`), on Markdown-only record
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
   - The path so far (items 28-31): the images in `D:/fitway-temp/public-redesign-r01-imagegen-21/`; sketch 8
     (`82f54e88`, run `D:/fitway-temp/public-redesign-r01-sketch-22/`); sketch 9 (`ab7b7f63`, run
     `D:/fitway-temp/public-redesign-r01-polish-23/`), with `reach` kept; sketch 10 (`6fb7adf4`, run
     `D:/fitway-temp/public-redesign-r01-polish-24/`); sketch 11 (`938087a4`, run
     `D:/fitway-temp/public-redesign-r01-sketch-25/`), turned down (item 34).
   - In Arabic time runs right to left, as Eclipse's own day line does
     (`design-research/owner-composition-exploration-r04/directions/eclipse/README.md:726`).
1. **B's round 3 is parked** (items 24-27). The narrowed direction has replaced B in practice; ask the user before
   resuming it. Should it resume: brief
   `docs/phase-records/handoffs/public-redesign/briefs/designer-public-english-18.md`, run
   `D:/fitway-temp/public-redesign-r01-english-20/`. `adc665f6` holds the stopped designer's unverified work. B's
   history is in DECISIONS items 12-27.
2. **Rounds on the draft** until the user accepts it (item 5's stage one): Arabic, live, phone and computer.
3. After the pick is accepted: every state and size, English, `PUBLIC-SPEC.md` and §6, the verifier, the user's
   acceptance; the copy outside the glossary (five lines in the first round's report) goes to the user.

## Waiting on the user

The user tries sketch 14 themself first (item 43). Then: the wordless tap cue on the phone, the live reading's own
light (the Owner card's red is decoration, item 43), the wording of "Quietest time left", and whether a third polish
follows.

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
