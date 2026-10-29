<!-- handoff-format: resume-point-v1 -->
# public-redesign-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-29 15:55 +03:00 (the first round's three directions wait for the user's pick)
- **Standing decisions:** `docs/phase-records/handoffs/public-redesign/DECISIONS.md` (items 1-2), and the founding
  ones in `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (items 84, 90, 98, 99; its "How this
  milestone's rounds run" applies here, but for rounds item 8), `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- Opened 2026-10-28 by the coordinator on the user's acceptance of the public page's paper (r04 DECISIONS item 98):
  ADR-010 accepted (`docs/adr/ADR-010-public-composition-authority-supersession.md`), the amendments P-1…P-6, G-1…G-9
  and S-1…S-11 applied to `FITWAY_PRODUCT.md`, `DESIGN_GUIDE.md` and `SPEC.md` (item 98 lists the six places that differ
  from the draft), and the register's `public` row at status 5 (measured: `pnpm check:repository` and `pnpm
  check:agent-context` pass at the opening commit). The drafts stay as provenance in
  `docs/phase-records/handoffs/owner-design-exploration/r04/public-page-paper/`.
- The first round's three directions are built on `public-redesign-r01` (`cbff8300`, pushed), not yet chosen. The page
  lives in Eclipse's folder, beside the Owner pages, and reaches `owner-followup-r04-build` through the merge.

## Running now

Nothing (measured 2026-10-29 15:55). The first designer round is done: `owner-direction-designer` from
`docs/phase-records/handoffs/public-redesign/briefs/designer-public-directions-1.md` (`99f56a8b`, frames through
verify-fitway's `run`) built three options in one set of files,
`public.html?option=a|b|c&state=fresh|stale|closed&lang=ar|en` (`cbff8300`): a, the sheet (one card, a four-step
track with the band words); b, the dial (a half ring around the band word); c, the stair (CHP-5's four bars at page
scale). Report, frames and the coordinator's contact sheets: `D:/fitway-temp/public-redesign-r01-directions-1/`
(its REPORT.md and two folders). The coordinator checked the commit (three
files) and the frames: no sideways scroll or clipping at 320 px and 200% zoom in 48 probe runs (the designer's); b
reads like a gauge, c like a chart, and every option leaves the lower phone screen and most of the desktop black.
LAN preview for the user's phones: the coordinator's local launch entry `public-redesign-lan`, port 3181 (the PC's address
192.168.8.186 on 2026-10-29).

## Next steps

1. **The user's pick** among a, b and c, by eye (r04 item 99).
2. After the pick: the chosen direction across every state and width (loading, unavailable and error too),
   `PUBLIC-SPEC.md` and §6, the verifier, the user's acceptance; the smoothness check on the demo phone (item 90 P4).
   With it, the designer's findings: `DO-NOT.md` ("Public stays light") and `DESIGN-SPEC.md` §6 ("mobile-first,
   light") contradict item 90's dark page; the copy outside the glossary (five lines in the report) goes to the user;
   the page loads the Owner pages' whole `style.css` (two class names clashed).

## Waiting on the user

The pick among the three directions (the frames and the LAN preview).

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
