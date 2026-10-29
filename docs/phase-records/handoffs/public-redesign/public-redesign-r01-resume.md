<!-- handoff-format: resume-point-v1 -->
# public-redesign-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-29 20:10 +03:00 (the first
  round set aside; the percentage settled; the rules and a new brief are next, in a new session)
- **Standing decisions:** `docs/phase-records/handoffs/public-redesign/DECISIONS.md` (items 1-4; 4 last), and the founding
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

Nothing (measured 2026-10-29 17:14). The first round (`designer-public-directions-1.md`, `cbff8300`; report and
frames in `D:/fitway-temp/public-redesign-r01-directions-1/`) drew three options the user set aside, for the causes
DECISIONS item 3 records. The LAN preview entry `public-redesign-lan` (port 3181) serves this worktree's Eclipse
folder.

## Next steps

The user starts a new session for these (DECISIONS item 3):

1. **The percentage is settled** (DECISIONS item 4, applied to Product and SPEC): the concept may show one on
   synthetic data and the page reads whole without it; the brief says so.
2. **Change the rules** to item 3: the content lines of r04 item 90 and the amended Product and Design Guide lines that
   ban the typical-day curve and the verdict line; the frame's separate gym name (the brand is FITWAY's name);
   `DO-NOT.md` and `DESIGN-SPEC.md` §6 say dark; the first brief's "no new tokens" and fixed order go. Show the user the
   changed lines in plain words before committing the Product ones.
3. **A new designer brief** from item 3's goals: every size from phone to computer; the identity fixed and everything
   else free; content as item 3 lists; no "level mark form" framing; references first and Impeccable's whole process,
   with the writes that needs. Several `owner-direction-designer` runs in parallel, each one direction of its own, each
   in its own worktree or folder so they never write the same files. Both reviewers read the brief first.
4. After the pick: that direction in every state and size, `PUBLIC-SPEC.md` and §6, the verifier, the user's
   acceptance; the copy outside the glossary (five lines in the first report) goes to the user; the page stops loading
   the Owner pages' whole `style.css` (two class names clashed).

## Waiting on the user

Nothing; the user opens the new session for steps 2 and 3.

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
