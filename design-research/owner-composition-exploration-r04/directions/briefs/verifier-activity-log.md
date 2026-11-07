<!-- brief-format: v1 role: verifier -->
# Verifier brief: Activity log, first build (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-daily-phone`, branch `owner-r04-activity`, HEAD `a8aa8ad`
  plus this brief's own commit on top of it. Read only.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1-8, 11, 12, 16, 23 and 31, and "How this milestone's rounds run" item 7. Do not read item 32 before your
  report is recorded: it quotes the implementer's report.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full.
  - `design-research/owner-composition-exploration-r04/directions/briefs/designer-activity-log.md`: the brief the
    build answered (its hard limits are your baseline).
  - `packages/api/src/audit/types.ts` and `packages/api/src/audit/list.ts`: the log's real contract.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` §1.11, §2, §3.4, §3.5,
    §3.9, §3.11, §3.12 and §3.14 by row ID. Navigate code with
    `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write only in `D:/fitway-temp/owner-r04-activity-review/`; the coordinator checks `git status` in every worktree
  afterwards. (r04 G5) A local server uses port 3178 only. Render with the worktree's `@playwright/test`; do not
  reuse the implementer's crops as evidence, take your own.

## What was delivered

`7bb5845..a8aa8ad`: a new Activity log page (`activity.html`, `activity.css`, `activity.js` in
`design-research/owner-composition-exploration-r04/directions/eclipse/`), the rail and phone-bar link to it in Daily
and Reports, a DESIGN-SPEC section and index entries. Its states are reachable by URL switches in `activity.js`.

**Already decided by the user; do not report:** human count corrections and resets in the synthetic data and the
«العدد» label (they leave); a reason saying the gym counted people by hand (it leaves); the typed date field (it
becomes a picker); the phone title taking two lines beside a long status (the title gets smaller); the name of the
"More filters" control; where a record after midnight is grouped.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | No visitor, image or per-visitor data anywhere; actors are only the staff desk, the owner and the system | code and rendered text |
| V2 | The page never looks live: no live mark on the log, no automatic refresh; a refresh control with the last-load time | code, and DOM unchanged over 60 s idle |
| V3 | True to the contract: a missing prior never reads as 0; a 240-character reason shows in full; no total count; every action and actor the contract has is rendered with a label | frames per case, code |
| V4 | DECISIONS 31 in full: one newest-first list, kind shortcuts, kind/person/dates in view, reason search under a further control, 25 more per "Show older", the end line's words, no export | frames and code |
| V5 | Every state (loading, first-load error, filtered-empty, log-empty, "Show older" working and failed, end line, refresh working and failed) keeps the page's layout, lights nothing, and follows item 8 and STA/EMP rows | one frame per state, 1440 and 390, AR and EN |
| V6 | No sideways scroll of the page or of the records at 1440, 1024, 768, 390, 360, 320 and 200% zoom, AR and EN | `scrollWidth` measurements |
| V7 | Every interactive target is at least 44 × 44 at every size | measured boxes |
| V8 | Keyboard: a sensible Tab order, FOC-1 focus everywhere, focus to the retry and to the first new record, Escape closes a sheet or dialog and returns focus | key-by-key log |
| V9 | Touch at 390 and 320 with touch emulation: filters, the further control and the dates sheet work, and nothing ends up under the bottom bar unreachable | frames per step |
| V10 | Reading direction: Arabic reads natively right to left and English left to right; from-to figures, ranges (item 12), numeric alignment (items 9, 16, 23 where tabular), and a reason in the other language each read right | frames, measured edges |
| V11 | Wording: natural Arabic and English, DO-NOT and items 11-12 kept | rendered text |
| V12 | Motion (item 4): complete at first paint, no intro, no digit roll | first-paint frame, code |
| V13 | Daily and Reports change only by the new link | `git diff 7bb5845 a8aa8ad` on their files |
| V14 | The page works from `file://` and over HTTP | frames from both |
| V15 | Each element read as a whole composition and as part of the page, not only against its rule (item 25 lesson) | frames, your judgement |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line` and a
severity (high, medium, low); what you could not run and why; anything that reads or behaves wrong though it passes
its check or meets its rule, with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"); the
evidence folder. At most 50 lines.
