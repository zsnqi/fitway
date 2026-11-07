<!-- brief-format: v1 role: verifier -->
# Verifier brief: interaction motion across the Owner pages (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the designer's report or
rationale before recording your own result, and never edit what you verify. (CLAUDE.md) This review covers reading
direction too; there is no separate reading-direction review for this round.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `0c43c90`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 3, 4, 5, 7, 8, 35 and 36 (36 is this round; where it differs from an older item, 36 wins), and "How this
  milestone's rounds run" items 4 and 7; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full.
  - The brief the round answered: `design-research/owner-composition-exploration-r04/directions/briefs/designer-motion.md`.
    Its moments, hard limits and range cases are your baseline.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` §1.10 (MOT-1…18) and the
    rows it names; `README.md` §"Motion"; the code is `eclipse/motion.js` and its callers, navigated with `INDEX.md`.

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

- Write only in `D:/fitway-temp/owner-r04-motion-review/`; the coordinator checks `git status` in every worktree
  afterwards. (r04 G5) A local server uses port 3178 only. Render with the worktree's `@playwright/test`; do not
  reuse the designer's captures as evidence, take your own. The `ui-forensics` skill's motion traces, long-frame and
  layout-shift observers fit this round.
- **Keep your context lean:** measure the full matrix by code; open videos and images only where judgement needs
  them (each moment at 1440 AR and 390 AR, and any frame a measurement flags), downscaled unless a detail needs full
  size.

## What was delivered

`54b2737..0c43c90` (the brief commit excluded): one shared `motion.js` loaded by Daily, Reports, Activity log,
Access and the component sheet; motion for a dialog and the phone's sheet opening and closing, a button's label
changing (Working, Try again, «نسخ» to «نُسخ»), the export's done state, Access's done line and rows after a
(de)activation, popovers (the date picker, the status's details, the phone's menu), and a dialog whose content
changes; other moments left instant by choice (MOT-18); `INDEX.md` regenerated.

**Already known; do not report as findings:** the published concept lacks `tuner.js`; the Impeccable detector's wash
and stripe flags come from the shared sheets.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | Load motion banned (MOT-1, MOT-13, DO-NOT): every page complete at first paint; nothing moves without the owner's action except a done state that follows it; Daily's intro (MOT-10) unchanged | first-paint frames, animation log on load, per page |
| V2 | The glyph rule (MOT-1, DO-NOT): no element carrying text or a number has an effective opacity below 1 (its own or any ancestor's) during any moment; nothing cross-fades | computed opacity sampled every frame through each moment |
| V3 | Reduced motion and `?motion=off` (MOT-11): every change instant; each moment's end state equals the animated end state 500 ms after `endedAt`; no glyph or state is lost | pixel comparison per moment, AR and EN, 1440 and 390 |
| V4 | No layout shift during or after any moment outside the moving element's own intent; at rest no leftover inline style, attribute or element (README "Motion") | layout-shift observer, DOM diff before and after |
| V5 | Interruption: a dialog closed while opening and opened while closing, a double press, Escape mid-movement, a second copy press: each continues from where it is, never snaps or restarts, and the action runs once | traces, frames |
| V6 | Focus and screen readers: focus moves into and out of a dialog before its first frame; no announcement delayed or repeated by a movement; keyboard paths keep a visible focus | key-by-key log, live-region log |
| V7 | Truthful states (item 8): a done state appears only after the action finished in the sample; a failure shows its Retry path; Working never looks done | flows with success and failure |
| V8 | Reading direction: every directional movement mirrors in Arabic; Arabic words are never split per letter; labels that roll keep their alignment in both languages | frames, measured edges |
| V9 | The phone (390 and 320): every bottom sheet, including Activity's and Reports' date dialogs, slides as specified; no sideways scroll at any moment | traces, `scrollWidth` |
| V10 | Smoothness: no long frames or dropped frames during a moment beyond what the base had | long-frame observer, compare with `54b2737` |
| V11 | The pages at rest are unchanged from `54b2737` apart from the named changes (the export button's width) | pixel comparison per page, 1440 and 390, AR and EN |
| V12 | Works from `file://` and over HTTP | both |
| V13 | DESIGN-SPEC MOT-9, 11, 12, 14-18 and the rows they name match what is built (durations within 30 ms) | measured against the rows |
| V14 | Each of the brief's six moments: built or left instant, and is the choice sound for an owner; anything the list missed | your judgement, with frames |
| V15 | Each moment judged as a whole on the page in real time: calm, premium and finished as item 1 describes, not a generic fade or rise, nothing else on the page moving or jumping | real-time videos you record and watch, your judgement |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line` and
a severity (high, medium, low); what you could not run and why; anything that reads, feels or behaves wrong though it
passes its check, with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"); the evidence folder,
with the names of the videos the coordinator should watch first. At most 50 lines.
