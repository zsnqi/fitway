<!-- handoff-format: resume-point-v1 -->
# public-redesign-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-30 (the user chose the word a
  third smaller and Packed on one line; two gaps wait for the user's answer)
- **Standing decisions:** `docs/phase-records/handoffs/public-redesign/DECISIONS.md` (items 1-18; 18 last), and the founding
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

Nothing (measured 2026-10-30). Public branch `public-redesign-r01` at `1709f75e`, pushed. The LAN entry
`public-redesign-lan` (port 3181, the PC at 192.168.8.186) serves its Eclipse folder: `public.html` is B's full draft (`?level=packed|quiet|moderate`, `?mark=2|3|4`),
`public-sketch-1.html` to `-4.html` the first sketches, `public-sketch-6a.html` to `-6c.html` and `public-sketch-7a.html`
to `-7c.html` the six directions from sketch 1, A-F (`?level=packed` shows «شديد الازدحام»).

- **Six directions from sketch 1, A-F** (items 10-12; briefs designer-public-sketches-6 and -7 in this
  file's briefs folder; `6a148a6d`, `7e22756e`; frames in `D:/fitway-temp/public-redesign-r01-sketches-{6,7}/`): the user
  found A-C alike, turned D-F down for trying to impress, and picked B (the word's weight as the level, later dropped).

- **The rules follow items 3, 4, 8 and 9** (measured on the coordinator line, `f5336d95` to `d0606df6`): bans lifted
  by deletion; identity only dark, FITWAY red, the light, Readex Pro; content the level, the approximate count, open or
  closed, the last update and a percentage; lights and numbers free to move (reduced motion, one announcement and no
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

1. **The two gaps of item 18** (the computer's word 104 px, not 127; the phone's Packed still two lines), asked
   2026-10-30; then a fixer makes the chosen switches the page's default. The word's size (item 17; `?size=75|67`, `1709f75e`; `compare-phone.png` and `compare-computer.png` in
   `D:/fitway-temp/public-redesign-r01-size-13/`, sent 2026-10-30): word 104/78/70 px on the phone, 190/142/127 on the
   computer; the mark's line does not move; on the computer the count drops up to 38 px with the word's baseline. Then the others' views the user brings back (item 16; images in `D:/fitway-temp/public-redesign-r01-share-12/`):
   settle switch 1, then make the accepted switches the page's default (one fixer or builder edit). The switches as
   drawn (item 15; brief
   `docs/phase-records/handoffs/public-redesign/briefs/fixer-public-variants-11.md`; `19b038d3`, `c1667d00`; sheets
   `sheet-p1.png` to `sheet-p3.png` in `D:/fitway-temp/public-redesign-r01-variants-11/`, sent 2026-10-30; the page
   without switches pixel-identical to polish 10). p1: Packed on one line from 1152 px (divisor 8.1, width term
   `min(100vw, 1600px)`, floor 120; word 154.67 px at 1440 x 900, was 189.51; the mark's line does not rise; 1024-1151
   identical to no switch). Two repairs of p1 failed first: the brief's divisor ignored the count column, and no single
   divisor or floor clears the count below 1152 because the count's 20 px floor keeps its column wide; the scope moved
   to 1152 and up. p2: the percentage under the count, the open line in the stamp. p3: lower floors; the stamp is
   inside the first screen at 200 % zoom, not at 844 x 390 (about 32 px short, the word at its 40 px floor). The second polish round and its proposals (item 14; brief
   `docs/phase-records/handoffs/public-redesign/briefs/designer-public-polish-10.md`; `25e06452`; sheets, `notes.md`
   and `critique-a.md` in `D:/fitway-temp/public-redesign-r01-polish-10/`, sent 2026-10-30). Critique 17/20 again; the
   390 and 1440 frames barely change. Fixed: every size grows in a line from 390 to 1440, the switch moved to 1024 px
   (the word never shrinks when a window widens); the column word sized from what it holds (tablet 158 px); the
   language button at the small size; the facts and stamp as four paragraphs; «ص/م» kept with each time; below 360 px
   the stamp in two lines. Not changed, with reasons: the DOM order (word, mark, count); the computer's dark above
   one-line words (one size plus the fixed line). Proposals, not applied: 1 Packed on one line on the computer (word
   about 158 px); 2 swap the percentage and the open line; 3 keep the stamp on short screens; 4 tall tablets fill the
   column (about 200 px); 5 the level heard twice by a screen reader (needs DESIGN_GUIDE §5 changed); 6 English and
   the other states next. The first polish round,
   liked by the user (items 13, 14; brief
   `docs/phase-records/handoffs/public-redesign/briefs/designer-public-polish-9.md`; `638e6e31`, only `public.css`;
   sheets and `notes.md` in `D:/fitway-temp/public-redesign-r01-polish-9/`, sent 2026-10-30). Critique 17/20. The
   computer now sets the count beside the word on its baseline (two columns above the mark), Packed in two lines at
   every size (the computer word 188 px), three type sizes (phone 104/20/14, computer 188/30/16), the count's number at
   600; the phone barely changed. The designer's findings: a large dark area above short words on the computer (about
   530 px at Quiet); the computer's visual order (word, count, mark) differs from the reading order (word, mark, count);
   the word shrinks from about 160 to 140 px crossing 900 px. The draft it polishes, as shown to the user (item 12; brief
   `docs/phase-records/handoffs/public-redesign/briefs/designer-public-draft-8.md`; `8bd73ee7`; sheets
   `sheet-draft.png` and `sheet-marks.png` in `D:/fitway-temp/public-redesign-r01-draft-8/frames/`, sent 2026-10-30).
   The word is 600 and 104 px at every level on the phone (210 px on the computer, one line); marks: 1 B's bars
   refined, 2 one thin rule, 3 four small blocks, 4 the rule with the four words under it. The designer's findings: the
   computer's left half above the full-width mark is empty; mark 3 reads small; mark 1's unlit Packed bar is the
   tallest shape; Quiet and Moderate sit about 40 px above the mark (no descender); the deep red of the lower parts is
   about 2.3:1, under 3:1 for a graphic alone, passing only because the word carries the level; B's gap before «م» fixed.
2. **Rounds on the draft** until the user accepts it (item 5's stage one): Arabic, live, phone and computer.
3. After the pick is accepted: every state and size, English, `PUBLIC-SPEC.md` and §6, the verifier, the user's
   acceptance; the copy outside the glossary (five lines in the first round's report) goes to the user.

## Waiting on the user

The answer on item 18's two gaps (step 1). No app was named (item 10).

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
