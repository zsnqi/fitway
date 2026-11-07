<!-- brief-format: v1 role: designer -->
# Designer brief: Reports' states, options for the user (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). Concept-only (ADR-009): superseded Owner Paper frames are
reference only. This round shows the user options and stops; a builder builds the pick.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `32958e1`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 1-4, 8-13.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` (in full);
  `design-research/owner-composition-exploration-r04/directions/eclipse/README.md` §"States and how to open it";
  `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows K-02, K-38, HDR-4,
  HDR-6, STA-10…14, STW-1…2, PH-1…3, CRD-10, CHT-21, EMP-5 and the Reports rows they point to (by row ID; never
  read it whole); `DESIGN_GUIDE.md` §"15. Phase visual gate".

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

- Run `pnpm check:design-context` and `pnpm context:show --milestone owner-design-exploration-r04` first. Impeccable
  is the one design skill; load no other design or taste skill. (AGENTS.md)

## The open question

Reports draws only its live status. Its loading, page-level closed, unavailable and error states, and the
statuses that say its data is not current, are not designed (K-02, open for Reports since step 3). Daily's states
(STA-10…14) are the language, not a template: Reports answers a different question (how the gym behaved over past
days), so a state may change less, or something else, on Reports than on Daily. Also open: at 320 AR the title
«التقارير» overflows its box and moves 25.9 px when the status badge changes (K-38); the options must close it.

## Constraints

- The brightest thing on a page is never stale, unavailable or empty, and no state looks live (DECISIONS item 8;
  AGENTS.md). Reports has no intro and no digit roll (item 4). Wording follows items 11-12 and `DO-NOT.md`.
- Tables, the one-day-at-a-time phone form and the empty-period sentence stay as decided (items 9-10, 13).

## Deliverable

Two or three genuinely different options, each rendered as real pages at 1440, 768 and 390, and checked at 320
(K-38), AR and EN, in every state above. Number every crop the same way across options so the user can compare
them. No recommendation is needed; say where an option breaks.

Write only under `design-research/owner-composition-exploration-r04/directions/eclipse/` (except its `tools/`
folder and `INDEX.md`, which another round is writing) and `D:/fitway-temp/<run>/`; a local server, if you need
one, uses port 3176 or 3177 (3174 is the user's preview);
the live Reports page must look as it does now unless an option parameter is set. Commit when done.

## Report

Per option: one line on the idea, its frame paths, and where it breaks. The files you changed; the commit SHA. At
most 40 lines.
