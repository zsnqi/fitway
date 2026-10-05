<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** `codex/owner-redesign-r04` at the commit that adds this file, 2026-10-05 00:23 +03:00; `owner-followup-r04-build` at `78e0bdf`
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261004-160300-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- **Daily, Reports and Activity log** are built on `owner-followup-r04-build`. The Codex follow-up (`31e9dd9`, DECISIONS
  32's last bullets: the picker in the minute export, the sheet's date specimens, one stored owner name) is graded in
  `codex-rounds.md` and merged (fast-forward). Its lows wait for the last round (DECISIONS 32, last bullet).
- **Access's first build** (`2fa0792`, max-effort designer) is reviewed (`D:/fitway-temp/owner-r04-access-review/REPORT.md`:
  all pass but V8 low) and merged into `owner-followup-r04-build` at `6ec9591`. The user tried it and left notes
  (DECISIONS 34). Its computer skeleton (`D:/fitway-temp/owner-r04-access-skeleton/`) is **agreed** (DECISIONS 34,
  "The skeleton, agreed").
- **Process:** brief rule B10 (check every named source exists before launch); a skeleton before every new screen
  (DECISIONS rounds item 8); briefs carry what and why, never form or colour (WORKING_AGREEMENTS "Delegation").
- **`access-reason-cap-r01`** (the production 240-character reason fix) is paused by the user; its own handoff says how
  to resume. Note DECISIONS 34 now makes the reason optional, which that milestone's scope does not cover yet.

## Running now

- Access's fix round is done on `owner-followup-r04-build` at `54b2737`: designer `a0c6c76`, Codex `376c845`
  (held-out 8 of 8, `codex-rounds.md`), builder `4637c53`, fixer `5c2106b` (the review's F1 and F2). Review
  `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md`. Published for the user (all four pages, links wired):
  https://claude.ai/artifact/RKEfwzfwZ7oD5r5fZLnqPS (version 2; staged from `5c2106b` without `tuner.js` in this
  session's scratchpad). The 34ZE… and Gog3… links do not open on the current account.
- Waiting for Access's last round (low, rounds item 7): N1 one name for the reset («تعيين» vs «إعادة تعيين»); N2 the
  done link lands on «هذا السجل غير موجود في هذه العينة.» (hand the new record to Activity log); N3 the records card
  sparse at 1440; N4 the field's zero dot at 1x; N5 721 EN pairs wrap; N6 lone last words; N7 mono loads on every
  visit; fixer notes: a tapped Retry leaves the desk title's ring, OWN-C9's "programmatic focus always shows its
  ring" is stale, `.acc :focus-visible` beats `.rail-item:focus-visible { outline: none }`.
- Decision 35 (dialog buttons at the inline start, Cancel first) built by a fixer at `54b2737`; republished as
  version 3 of the same link. Open: the export dialog's done state centres its body while the buttons now sit at the
  start (fixer's observation; a design call for the last round).

## Next steps

1. **Access's fix round, split by kind** (the user, 2026-10-05: design stays with Claude; Codex where the coordinator
   judges it fits, from its rounds). On `owner-followup-r04-build` (worktree
   `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, HEAD `78e0bdf`), in this order, from DECISIONS 33-34:
   - **First, a fresh `owner-direction-designer` (xhigh)** builds what is visual: the agreed skeleton on the computer
     (two halves, buttons under each name, the «سجل الوصول» card); the owner-typed code (letters and digits, a minimum
     length, copy in the one-time view); the two-step change with «إلغاء التغيير»; the quiet removal box at every size;
     the row that jumps groups.
   - **Then Codex (`high`)**, a tracked brief on top of the designer's commit (B1-B10, each item with its intent and
     its check): the optional reason (240 at most); the sign-out wording «يُسجَّل خروج»; no confirmation on creating a
     code; Reactivate asks; passwords emptied on close; the done link opening the exact record (an Activity log
     arrival by id); Deactivate / Reactivate in English on both pages; one's own password change ending other
     sessions; the review's F1, F2, F5 and the 700 ms silence; the rail and bar links on every page; `ACCESS-SPEC.md`
     merged as DESIGN-SPEC §4.4; INDEX with `access.js`; every amendment named in the spec. Anything visual it meets is
     reported, not decided.
   - Then one `owner-direction-verifier-high` review of both (reading direction included), the coordinator's frames,
     a republish for the user, and the Codex part graded in `codex-rounds.md`.
2. **The remaining Owner screens,** one pass each with the skeleton first (rounds items 6 and 8): Settings,
   Operations (the header status's details), Monitoring. Before each, a `sonnet-researcher` digest of its contract
   and open questions, then all its questions to the user at once in plain words.
3. **Daily and Reports' last round:** the «معدّل الموجودين» card redrawn by a designer and shown before Codex builds it
   (DECISIONS 30); fix-3's open findings (`D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md`); the waiting lows.

## Waiting on the user

Nothing; the user starts the next session from «كمّل».

## Known risks

- The published concept is a staged copy without `tuner.js`, with Access's links wired in the staged copy only:
  https://claude.ai/artifact/34ZEAW6e9xJmAbr4WmG2VM (staging in this session's scratchpad; rebuild from the build
  branch after the fix round). Artifacts are per account; the account changed on 2026-10-04 and older links no
  longer open.
- Claude's auto-mode classifier refuses changes to the frontier preservation guard even with the user's approval in
  this session; such a step needs a session in the prompting permission mode (`access-reason-cap-r01` handoff).
- Pinch, iOS long-press and a flick are proved on a device only by the user's informal try (DECISIONS 30).
- «مساءً», «ظهرًا», «ليلًا» on the busiest-time card are a deliberate exception to `DESIGN_GUIDE.md` §9; carry it to the
  later ADR. The same ADR lists every Product/Spec amendment the concept made (DECISIONS 33, 34).
- **Lighter sessions in this worktree** (the user, 2026-10-05): its untracked `.claude/settings.local.json` turns off
  the account-synced plugins (engineering, design, cowork) and the claude.ai connectors (Notion, Figma, Claude Docs,
  visualize) for this worktree only. Confirm at startup with the session's connector status; delete the file to undo.
- Ports: 3174 is the user's preview; 3176-3177 are for builders, verifiers and Codex; 3178-3179 are for reviewers.

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`.
- Access: designer `D:/fitway-temp/owner-r04-access/REPORT.md`, research `D:/fitway-temp/owner-r04-access-questions/REPORT.md`,
  review `D:/fitway-temp/owner-r04-access-review/REPORT.md`, skeleton `D:/fitway-temp/owner-r04-access-skeleton/REPORT.md`.
- Codex runs: `D:/fitway-temp/codex-runs/owner-activity-followup/` (`report.md`, attempt 1 kept beside it).
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`.
