<!-- handoff-format: resume-point-v1 -->
# public-redesign-r01: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that last changed this text, 2026-10-28 22:00 +03:00 (the first round waits for the retro's fixes)
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
- Nothing is designed or built. The page lives in Eclipse's folder on `owner-followup-r04-build` (at `fedbdb6d`), beside
  the Owner pages.

## Running now

Nothing (measured 2026-10-28 22:00). The first round waits for the retro's four fixes (r04 DECISIONS item 102;
agent-tooling DECISIONS item 17), including finding 3's split of `DESIGN-SPEC.md` and `SETTINGS-SPEC.md` on this
milestone's branch (`docs/phase-records/handoffs/agent-tooling/agent-tooling-r01-resume.md` §"Next steps" 3).

## Next steps

1. **The first design round** (r04 item 99: no skeleton): two or three whole directions in Eclipse's style, each with
   its own composition and level-mark form, at 390 px first, Arabic and English. Brief written:
   `docs/phase-records/handoffs/public-redesign/briefs/designer-public-directions-1.md` (`36879371`; it names
   `settings-capture.mjs`'s shape and `overflowProbe` for the 320 px and zoom check, item 16 of agent-tooling;
   revisit those pointers once verify-fitway's `run` lands). Worktree `D:/Projects/fitway-worktrees/public-redesign-r01`,
   branch `public-redesign-r01` off `fedbdb6d`, no install yet. At launch: merge main into the branch, run its own
   `pnpm install --frozen-lockfile --offline`, set the brief's HEAD, run `pnpm brief:check`, commit, and start a fresh
   `owner-direction-designer`. The frames go to the user, who picks by eye.
2. After the pick: the chosen direction across every state and width, `PUBLIC-SPEC.md` and §6, the verifier, the
   user's acceptance; the smoothness check on the demo phone (item 90 P4).

## Waiting on the user

Nothing.

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
