<!-- brief-format: v1 role: designer -->
# Designer brief: a new access record arrives on the records card with motion (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009): superseded Owner Paper frames are
reference only. A small round: one moment on one card.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `35051c9`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 4, 8, 34, 36 and 38 (38's records-card answer is this round), and "How this milestone's rounds run" items
  10 and 11. Read it with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; it binds.
  - In `.../directions/eclipse/` ("the folder"): `README.md` §"Motion"; `DESIGN-SPEC.md` rows MOT-14 to MOT-18,
    OWN-C9, OWN-C15 and REC-1; `motion.js` (the done and flip parts); in `access.js` the records card (`recordHTML`,
    `recordsHTML`, `addRecord`) and the done path that calls it. Navigate the rest with `INDEX.md`.

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

- Run `pnpm check:design-context` first. Impeccable is the one design skill. Port 3176 only. Output and a `NOTES.md`
  under `D:/fitway-temp/owner-r04-records-arrival/`. Rounds item 10: judge at 1440 AR (the card exists from 721 px);
  render 1024 and English as end states only.

## The moment

Today, when the owner changes access on this page (a code created or changed or deactivated, an owner added,
deactivated, reactivated, a password reset or changed), the change's record tops «سجل الوصول» / "Access history" at
once and the oldest of the eight leaves at once (OWN-C15; MOT-18 lists it as instant). The user wants it to arrive
with motion (DECISIONS 38): the new record appears at the top, the lines below move down to make room, its words rise
into place without fading. Why: the owner sees, in the history, the record their action just wrote, at the same
moment the done line stands on the row they changed.

Design it as part of the same moment as the done line (MOT-17), not as a second event after it: decide its start
against the row's change, for both of Access's row options built in the previous round (`?row=0`, the current one, and
`?row=1`, the row changing after the window has closed; MOT-19), so it follows whichever the user picks. The oldest record leaves at the
card's bottom edge (cut away, or moved out under the edge; never faded). Range: every kind of change, Arabic and
English, 1440 and 1024 (721-1023 halves are narrower), a second change before the first has settled, Cancel change
(writes nothing, moves nothing), `?records=none` (the first record arrives into the empty card), `?records=error`
(nothing arrives; unchanged).

## Hard limits

MOT-1's glyph rule (no glyph changes opacity); reduced motion and `?motion=off` instant with the same end state; no
layout shift; nothing left over at rest; focus and the announcement unchanged (focus stays on the done line); the
card stays never lit, never live (OWN-C11); load motion banned; existing copy unchanged; DO-NOT in full.

## Files

Only under `.../directions/eclipse/`: `motion.js`, `access.js`, `access.css`, `motion-capture.mjs`, `README.md`
§"Motion", and in `DESIGN-SPEC.md` MOT-17, MOT-18 and OWN-C15's sentence on the new record. `INDEX.md` regenerated if
lines moved. Commit at each checkpoint.

## Frames and video

In the output folder: a real-time `.webm` of a deactivation at 1440 AR with each row option, a strip every 50 ms from
the confirmation until 200 ms after the last movement, `R-` reduced-motion end states, and English and 1024 end
states. Watch each video; judge the page as a whole.

## Report

What the owner sees, step by step, in plain lines; timings; anything that falls short; files; commit SHA. At most 25
lines.
