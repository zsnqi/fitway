<!-- brief-format: v1 role: verifier -->
# Verifier brief: step-4 review of K-02, D3-D8 and decisions 14-15 (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read any implementer's
rationale, report or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `41a6f7c`.
  What is under review is `git diff 605ebb2 41a6f7c` (K-02's build `cbd7bbc`, Codex's defects round `e6db2e4`,
  decisions 14-15 `41a6f7c`; the other commits there are briefs).
- **Milestone:** `owner-design-exploration-r04`. Decisions:
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 2, 4, 7, 8, 9, 10, 11, 12, 14 and 15.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md`; the three
  briefs that asked for the work, in `design-research/owner-composition-exploration-r04/directions/briefs/`:
  `builder-k02-build-a.md`, `codex-d3-d8-defects.md`, `builder-d14-d15.md`;
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows HDR-3, HDR-4, HDR-6,
  STW-1, STW-2, STA-9…14, K-02, K-38, GLO-15 by row ID. Navigate code with the folder's `INDEX.md`. ADR-009 applies:
  superseded Paper frames are reference only and accept or reject nothing.

<!-- environment:start v1 -->
## Environment

- Read the worktree; write only in `D:/fitway-temp/owner-r04-step4-review/`. Never push, fetch, switch branches, or
  write in any worktree or global configuration. Nobody else writes in this worktree while you work.
- Use absolute paths; the shell's working directory resets between calls.
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`.
- Run Playwright from PowerShell (Git Bash rewrites `/api` paths), with the worktree's `@playwright/test`. Drive C is
  full: set `TEMP`/`TMP` to `D:/fitway-temp` for anything that writes much.
- A local server uses port 3177 only; 3176 is another agent's. `file://` works too.
- If a source here is missing or contradicts what you find, stop and report the gap instead of guessing.
- Return your report as your final message, not as a file.
<!-- environment:end -->

Verifier rules (DECISIONS "How this milestone's rounds run" item 4): G1-G5 apply. Measure; do not eyeball a number.

## What to check

1. **K-02 as decided (item 14)**, Reports and Daily, every state (`?state=`, `?arrive=`) at 1440, 1024, 768, 390 and
   320, AR and EN: one behaviour, option A's; the error state is one page-level sentence in every period form the
   decision names; from 721 px the status control keeps its place and size from loading to arrival and through every
   status change, its drawn outline (hover, open, focus) fits the text, and its target is at least 44 px. Nothing
   beside the control moves.
2. **Decision 15:** no concept label on any Eclipse screen, and no gap where it stood.
3. **D3-D8 as built** (`codex-d3-d8-defects.md`): whether each defect is gone and nothing else changed. Where the
   English single-day «No readings» starts (D5) is waiting on the user's pick: check only that it is consistent at
   every width from 721 up.
4. **Truth and access** across all of the above: decision 8's truthful states (the brightest thing is never stale,
   unavailable or empty; nothing that is not live looks live); RTL and LTR mirroring; keyboard focus and order;
   what screen readers are told (accessible names, announcements); 200% zoom at 1024 and the 320 check (item 2).
5. **Daily at 390, through one lens:** does it read as a phone page designed for the phone, or as the desktop page
   compressed? Findings only, with frames; any change to Daily is the user's call.

Already known, so do not report them again: D6 (English coverage rows wrap more than Arabic at 390 and 320) and the
coverage card's wording, both in a copy round now; the component sheet's single-day specimen (its day cell is a copy,
not the pages' component, and at 320 it runs about 14 px into the card's padding); Daily's reserved status width
follows the last reading's time rather than the day's widest time.

## Report

At most 40 lines: each finding with its severity (blocker, major, minor), the frame or measurement that shows it, and
`file:line` where you can point to the cause; what you checked and found clean; what you could not check. Then, only
after that is written, read the three implementers' reports if you want (`D:/fitway-temp/codex-runs/owner-d3-d8/run4/last-message.md`
is Codex's; the builders' are not on disk) and note any disagreement.
