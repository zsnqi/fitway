<!-- handoff-format: resume-point-v1 -->
# public-redesign-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-30 (the user kept sketch 1;
  a designer draws four variations of it)
- **Standing decisions:** `docs/phase-records/handoffs/public-redesign/DECISIONS.md` (items 1-10; 10 last), and the founding
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

An `owner-direction-designer` (Opus, xhigh) on brief
`docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketches-6.md`, in the rounds worktree, run folder
`D:/fitway-temp/public-redesign-r01-sketches-6/` (started 2026-10-30 by the coordinator session; if no report came back,
check that folder and the branch for a commit before re-running). Public branch `public-redesign-r01` at `5c82d414`, pushed, carries the rules
through `d0606df6`. The LAN entry `public-redesign-lan` (port 3181, the PC at 192.168.8.186) serves its Eclipse
folder: `public.html` is direction 4, `public-sketch-1.html` to `-4.html` the sketches.

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

1. **Inspect the four variations of sketch 1** (item 10; `public-sketch-6a.html` to `-6d.html`, sheet
   `D:/fitway-temp/public-redesign-r01-sketches-6/frames/sheet.png`), send the sheet and the LAN links, and ask which
   becomes the full draft (or parts of two, or none).
2. **The picked variation as a full draft** (item 5's stage one): Arabic, live, phone and computer, one designer; the
   other stages after the user accepts it.
3. After the pick is accepted: every state and size, English, `PUBLIC-SPEC.md` and §6, the verifier, the user's
   acceptance; the copy outside the glossary (five lines in the first round's report) goes to the user.

## Waiting on the user

The pick among the variations, once they are shown (step 1). No app was named (item 10).

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
