<!-- brief-format: v1 role: verifier -->
# Verifier brief: decision 25's build, card-1 and touch-1 (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `436fe40`
  plus this brief's own commit on top of it
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 4, 7, 8, 11, 12, 20, 21, 24, 25 and 26 (read with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`).
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows CHT-15, MOT-10, MOT-11,
  OWN-D5, OWN-D7, OWN-D8, OWN-D10, GLO-12, FOC-7 by row ID; the "Rules and findings" section of the working
  agreements on `codex/owner-redesign-r04` (`git show codex/owner-redesign-r04:docs/agent-context/WORKING_AGREEMENTS.md`;
  this branch's copy is older). Navigate code with `design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md`.

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

- Write only in `D:/fitway-temp/owner-r04-review-436fe40/`; the coordinator checks `git status` in every worktree
  afterwards. A local server uses port 3177 only, or use `file://`. Render baselines from your own `git archive` of the
  named commit into your temp folder.

## What was delivered

Three rounds on `owner-followup-r04-build`, merged at `436fe40`, all in
`design-research/owner-composition-exploration-r04/directions/eclipse/`:

- `e1837cf..bd8bada`, a builder answering `design-research/owner-composition-exploration-r04/directions/briefs/builder-d25-fixes.md` (outcomes A1-A6, B1-B5, C1).
- `bd8bada..0fcd3e3`, Codex card-1 answering `design-research/owner-composition-exploration-r04/directions/briefs/codex-busiest-card.md` (C1-C5, L1-L6).
- `bd8bada..38a86cd` on `owner-r04-touch-fix`, Codex touch-1 answering `design-research/owner-composition-exploration-r04/directions/briefs/codex-touch-native.md`
  (T1-T4, L1-L6), merged at `436fe40` with OWN-D7 and MOT-11 edited on the merge.

Read those three briefs for their outcomes only. Render your own frames; the implementers' evidence is not evidence.

## Checklist

Phone frames in a touch context (`hasTouch`, `isMobile`, real CDP touch events) at 390 × 844 and 320 × 568, AR and EN.

| ID | Check | Evidence required |
|---|---|---|
| R1 | Every outcome of the builder brief (A1-A6, B1-B5, C1) holds at `436fe40`, with A3 now met by touch-1's way, not by the page's own pan | per row: crop or measurement |
| R2 | Every outcome and limit of the card-1 brief holds at `436fe40` | per row |
| R3 | Every outcome and limit of the touch-1 brief holds at `436fe40`; for L3, say whether the previous button going from the latest reading 7:42 PM to 7:30 PM is right, and whether the brief's "one half hour" wording was the fault | per row; stops visited |
| R4 | Held-out rows `D:/fitway-grader/owner-r04/card-1-heldout.md` H1-H9 and `D:/fitway-grader/owner-r04/touch-1-heldout.md` H1-H9, each graded on its own | per row: PASS, FAIL or NOT RUN with evidence |
| R5 | From 721 px up, AR and EN, every Daily state and every Reports frame: the only differences from `e1837cf` are those the builder brief's B1, B2, B4 and B5 and the intro's first paint explain, plus the computer's card text if any; name every other difference | diff list with causes |
| R6 | The merge did not lose either side: `436fe40` behaves as `0fcd3e3` on the card and as `38a86cd` on touch, and the phone at rest equals `0fcd3e3` | diff of the phone at rest; one gesture run on each |
| R7 | Composition: every element these rounds changed (the phone's busiest-time card in every state, the reading band with its three buttons, the slides, the empty-period sentence, the sheet's rows) reads well as a whole on its page, its order, alignment, sizes and spacing, in both reading directions; read Arabic as an Arabic reader and English as an English reader | numbered crops; one line each |
| R8 | Nothing stale, absent or loading looks live in any Daily state at 390 and 320 (item 8); one real-time video of a hold, a drag and the bottom slide at 390 AR | frames; video path |
| R9 | `node tools/lint-spec.mjs`, `node tools/check-index.mjs` and `node --check` on every `.js`/`.mjs` in the folder pass; the Impeccable detector's `.sw-line` finding in `style.css`: say whether it is a false positive, with the rule and the element | command output; one line |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4). Removed pre-intro frames are detected with fonts held to first paint + 50 and + 100 ms
(G2).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each, R4 one line per held-out row; for each FAIL a
hypothesis with `file:line` and whether the fault is in the code or in the brief it answered; what you could not run
and why; anything that reads or behaves wrong though it passes its check or meets its rule, with the rule named as
the suspect (WORKING_AGREEMENTS "Rules and findings"); the crop folder and video path. At most 60 lines.
