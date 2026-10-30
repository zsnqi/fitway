<!-- handoff-format: resume-point-v1 -->
# public-redesign-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-30 (the polished draft waits for
  the user's view)
- **Standing decisions:** `docs/phase-records/handoffs/public-redesign/DECISIONS.md` (items 1-13; 13 last), and the founding
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

Nothing (measured 2026-10-30). Public branch `public-redesign-r01` at `638e6e31`, pushed. The LAN entry
`public-redesign-lan` (port 3181, the PC at 192.168.8.186) serves its Eclipse folder: `public.html` is B's full draft (`?level=packed|quiet|moderate`, `?mark=2|3|4`),
`public-sketch-1.html` to `-4.html` the first sketches, `public-sketch-6a.html` to `-6c.html` and `public-sketch-7a.html`
to `-7c.html` the six directions from sketch 1, A-F (`?level=packed` shows «شديد الازدحام»).

- **Three directions from sketch 1; the user found them alike and asked for three more** (items 10, 11; brief
  `docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketches-6.md`; `6a148a6d`; sheet and frames in
  `D:/fitway-temp/public-redesign-r01-sketches-6/`, sent to the user): A the ember (the corner light's strength is the
  level); B the ink (the word's weight is the level, the four bars as thick as its strokes); C the dated sign (the
  level over the last reading's time, the stamp gone). The designer's findings: at sketch 1's 118 px «الازدحام» alone
  is wider than the column, so Packed is set at 100 px in all three; A's growing light may read as sketch 2's
  measuring light, and its wordmark on the Packed light is about 3.4:1; B and C keep a corner light with no job and an
  empty band; B's empty Packed bar is the heaviest shape on its line; C's large time may be taken for the phone's
  clock; A and B's stamp leaves a wide gap before «م».
- **Three more, D-F, turned down** (items 11, 12: each tried to impress the visitor; brief `docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketches-7.md`;
  `7e22756e`; sheet and frames in `D:/fitway-temp/public-redesign-r01-sketches-7/`, sent to the user): D answer first
  (the word at the top edge to edge, no header, the brand and «English» at the foot, the light rising from the bottom);
  E the inscription (the word's kashida is the four levels, the only light from its lit part; the word at 80 px);
  F the lit sign (dark letter faces haloed in red, everything centred, four lamps). The designer's findings: F's
  letter faces are about 1:1 against the wall, readable only through the halo, so a state without the light needs
  grey faces; F's lit lamps come close to A's glowing segments; E keeps sketch 1's arrangement and each part of its
  stroke is about 32 px; D's word sits about 6 px outside the text column.

- **The rules follow items 3, 4, 8 and 9** (measured on the coordinator line, `f5336d95` to `d0606df6`): bans lifted
  by deletion; identity only dark, FITWAY red, the light, Readex Pro; content the level, the approximate count, open or
  closed, the last update and a percentage; lights and numbers free to move (reduced motion, one announcement and no
  `requestAnimationFrame` or canvas stay); post-v1 reservations in `docs/spec/06-interfaces-and-contracts.md` for the
  percentage (on by default, no warning) and the curve.
- **Four directions turned down** (items 6, 7, 9; frames `D:/fitway-temp/public-redesign-r01-direction-{2,3,4}/`):
  a timetable (a mess), a status page (tidy, no character), a car's tachometer. The cause the user confirmed: each
  borrowed its idea from another world. Two reference sets found nothing close (items 7, 8;
  `D:/fitway-temp/public-r01-refs/`, `D:/fitway-temp/public-r01-taste/`).
- **Four sketches; the user kept 1, turned down 2-4** (items 9, 10; brief
  `docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketches-5.md`; `e0957a19`; sheet
  `D:/fitway-temp/public-redesign-r01-sketches-5/frames/sheet.png`, sent to the user): 1 the sign (the word as large as
  the phone allows, a hairline of four levels); 2 the lit edge (the light climbs both sides to the level's height);
  3 the strip (the four words in one line, the phone a window on the current one); 4 the bands (four full-width bands,
  the current one open and lit). The coordinator's notes, told the user: 1 and 3 leave a large dark gap above and treat
  the facts alike; 4's open band is the closest to the Owner's lit card; 2 has the most language of its own; «شديد
  الازدحام» does not fit whole in 3 and needs two lines in 1 and 4.
- **The designer's open findings** (its report, in the coordinator's transcript only): §5's "progression follows
  reading direction" says nothing of vertical order (sketches 2 and 4); in sketch 2 a stale reading turns the light off,
  so the word carries the level alone; sketch 3's cropped neighbours read as stray letters; each sketch carries the
  language switch; verify-fitway's `run` needs a readiness signal, so each sketch sets `window.__sketch`.

## Next steps

The coordinator does these in the session the user opens (`WORKING_AGREEMENTS.md`, 2026-10-29):

1. **The user's view of the polish round** (item 13; brief
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

The user's view of the polish round (step 1). No app was named (item 10).

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
