<!-- brief-format: v1 role: verifier -->
# Verifier brief: the whole CSS round, its mechanical part and the press (owner-design-exploration-r04)

For a fresh `owner-direction-verifier` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md) That means: do not
open `D:/fitway-temp/owner-r04-css-round/`, `D:/fitway-temp/owner-css-grade/`, `D:/fitway-temp/owner-r04-pressed/` or
`D:/fitway-temp/owner-r04-pressed-2/`, the Codex or designer reports, or `codex-rounds.md`, before your table is
written. This review also reads every changed element in both reading directions (WORKING_AGREEMENTS "Delegation").

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `b2b2f4c1`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only. The round is `58433873..b2b2f4c1`:
  the mechanical part ends at `691d62d5`; the press and the two lists are `a4639c5e..b2b2f4c1`.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 41 and 42, and "How this milestone's rounds run" items 4, 7 and 11; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full;
  - `design-research/owner-composition-exploration-r04/directions/briefs/css-round-spec.md` in full: the round's spec, its user stories and its four test seams;
  - `design-research/owner-composition-exploration-r04/directions/briefs/codex-css-round.md` §"Causes and required outcomes" and §"Limits the result keeps" (C1-C5, L1-L5);
  - `design-research/owner-composition-exploration-r04/directions/briefs/designer-pressed-state.md` §"Hard limits", and `design-research/owner-composition-exploration-r04/directions/briefs/designer-pressed-state-2.md` §"Your work" items 1-5;
  - `design-research/owner-composition-exploration-r04/directions/eclipse/DESIGN-SPEC.md` rows MOT-1, MOT-11, MOT-18, MOT-20, STA-16, FOC-1 to FOC-3, FOC-8, SAFE-1, TYP-3, TYP-6;
  - the verify-fitway guide, `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- Windows PowerShell 5.1 without a profile pipes text to node, python or git as ASCII: Arabic, «» and … become `?`.
  Put such text in a file and run the file, and read back each file you write that holds it. (replay motion-lows)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write only in `D:/fitway-temp/owner-r04-css-review/`; the coordinator checks `git status` in every worktree
  afterwards. (r04 G5)
- **Tools, read only,** from the coordinator's worktree `D:/Projects/fitway-worktrees/owner-design-exploration-r04` at
  `6abd1783` or later. Never edit them.
  - The concept CSS check: `node <that worktree>/scripts/check-concept-css.mjs <the concept folder>`.
  - The verify-fitway CLI: `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`. `--colors normal,forced`
    adds Windows high contrast; `hold:<selector>` and `release` are recipe actions for a held press; `measure --tool
    focus --colors forced` measures every Tab stop. Author your own holds in a recipe copy inside your folder
    (`--recipes`); the concept's own recipe file has none.
  - ui-forensics 1.3.0 is the machine-level skill; it fits the measurements this brief asks for.
  - Ports 3176-3177 only, the CLI's two. 3174 is the user's live preview of this worktree: leave it running. If a port
    is held by a process you did not start, never stop it.
- **Baselines:** your own `git archive` of the concept folder at `58433873` (before the round) and at `691d62d5`
  (before the press), extracted outside every git tree, inside your folder.
- **Keep your context lean** (rounds item 10): measure by code; open images and videos only where judgement needs
  them, downscaled unless a detail needs full size. Keep a short `NOTES.md` in your folder with what is measured and
  what is left, so a fresh verifier can take over if you are cut off.

## What was delivered

The round answers the spec in two parts:

1. **The mechanical part** (Codex, `9cbb3025`, repaired at `691d62d5`, the Codex brief above): hover gated to
   `hover: hover`, focus rings that survive forced colours, a minimum forced-colours level, `viewport-fit=cover` with
   the safe-area insets, and 16 px text in text fields.
2. **The press and the two lists** (two designers, `a4639c5e..b2b2f4c1`, the two designer briefs above): a pressed
   state on every pressable control, its release fade, and Activity's person filter and Reports' sort list at 16 px
   for the browser under a face that looks as before.

**Already known; do not report as findings:**
- The concept CSS check keeps two named allowances, `outline: none` on the programmatic focus targets `.cx-main` and
  `.fw-pop[tabindex="-1"]` (V1 still checks that neither is a Tab stop).
- The check counts a ring drawn by an ancestor through `:has(... :focus-visible)` as missing (F113).
- `compare` at full motion differs base against base on Daily's status popover (F112): read equality at reduced
  motion.
- Headless Chromium applies safe-area insets without the meta, and does not apply `:active` while an emulated touch is
  held. Prove the meta by reading it, and the press with a held mouse.
- A one-line field cannot show its whole widest value at once; C5's "shows" means no clipped glyph and no overlap with
  the field's icons.
- Any difference that also appears between two captures of the same baseline is noise; measure it, and say so.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | The concept CSS check reports only the two allowances above, and neither element is ever a Tab stop | command output; Tab sweep |
| V2 | Hover: with a mouse, every hovered element shows the base's computed colour, background, border and shadow; with touch (`hover: none`) no hover style stays after a tap; a tablet with a mouse keeps hover. Every page and the sheet, AR and EN, desktop, tablet and phone | computed styles, before and after, base as control |
| V3 | At rest, normal colours, mouse, no insets, reduced motion: `compare` `58433873` against `b2b2f4c1` on every page and the sheet, with Daily's states, Reports' periods, Activity `case=long` and Access's dialogs, AR and EN, desktop, tablet and phone: EQUAL except inside text fields and the two lists. Against `691d62d5`: EQUAL except the two lists. Name every item that differs | `compare` output, diff images of each difference |
| V4 | Forced colours, every page and the sheet, AR and EN, desktop, tablet and phone: every Tab stop's ring measured visible; every control and field has an edge; current, selected, expanded and disabled states stand apart; the charts keep their drawn colours; text takes the system colours; no line is painted at rest where nothing is focused | `measure --tool focus --colors forced`; forced frames |
| V5 | Safe areas: each page's meta adds only `viewport-fit=cover`; at 390 × 844 with a 34 px bottom inset, the tab bar, the menu and every dialog's buttons sit above it; at 844 × 390 (sides 47, bottom 21) no text or control box starts inside a side inset, AR and EN, and the insets stay physical left and right; with no insets, frames equal the base | meta read; measured boxes |
| V6 | Text fields: every input and textarea shows 16 px text in AR and EN and stays 44 px high; at 320, 390 and 1440 each field's widest value (its `maxlength`) has no clipped glyph and does not overlap the clear button or the password eye; a 240-character Arabic reason in Access's textarea at 320 | computed sizes; boxes; frames |
| V7 | The two lists: the browser's control computes at least 16 px (an iPhone does not zoom); the face looks as at `691d62d5`; the widest option in each language (the longest owner name, every sort label) fits; they work by mouse, touch and keyboard; in forced colours each has one edge and one ring | computed styles; frames; keyboard run |
| V8 | The press inventory: build your own list of every control that does something on press, from the DOM of the four screens and the sheet (buttons, links, tabs, segments, chips, rail and tab-bar items, rows that open something, dialog actions, the picker's days, the two lists, the current section's tile and tab). Each one, held with a mouse, shows the CLI's `pressed style shown while held`. Name every one that does not | CLI hold manifests per control kind, AR and EN, 1440 and 390 |
| V9 | Exclusions: a disabled control's held frame equals its rest frame, and where it explains why it is off the explanation is the response; the charts' plots and the light tuner show no press | held and rest frames; pixel comparison |
| V10 | The press's limits: it shows in the first frame after pointer down; no glyph's opacity drops below 1 at any moment of the press or its release (MOT-1); no neighbour's box moves while held; the release fades over about 120 ms (item 42) at full motion; under reduced motion and `?motion=off` the held frame has no transform and the release is instant | traces with G1 and G4; boxes; computed transforms |
| V11 | How the press reads, AR and EN, 1440 and 390: a held unselected segment never reads as the chosen one; a held chalk primary reads as pressed and live, never as off; the held segment at 390 reads as pressed at all | frames you look at, numbered; your judgement |
| V12 | The phone's conditions: each page registers a touch listener (Safari applies `:active` on touch only then); the tap highlight is removed only on controls that have the press; nothing calls `navigator.vibrate` | listener probe per page; computed styles; source search |
| V13 | Keyboard: no script was added for a keyboard press; Enter and Space show the focus ring and the result; a mouse press on either list showing its focus ring is the same at `691d62d5` and at the HEAD | key runs, both revisions |
| V14 | Forced colours while held: a held control keeps its edge and its label stays readable; the person list's held and open state reads in system colours | forced held frames |
| V15 | Records match what is built: MOT-18's exception, MOT-20, STA-16, FOC-8, SAFE-1, TYP-3 and TYP-6, README §"Motion"; in the folder `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check`, `node --check` on every script, and the CLI's `drift` on the folder's recipes all pass | commands; rows read against code |
| V16 | Reuse: the press lives in one shared place every page uses (spec story 37); say whether a new control kind gets the press without editing a selector list, and what a future screen must do to get it | code read, `file:line` |
| V17 | Every changed element read as a whole on its page in each reading direction (order, alignment, sizes, spacing): the 16 px fields, the two lists, held controls, forced colours. Arabic reads as an Arabic reader reads it, English as an English reader does | frames at 1440 and 390, AR and EN; measured edges |
| V18 | Real time: a fast tap and a held press and release on a dark key, a chalk primary, a segment and a rail item at 1440 AR with a mouse, and a fast double tap: calm, finished, nothing jumps | videos you record and watch |
| V19 | `git status --short` is empty in the build worktree and the coordinator's worktree after your run; nothing written outside your folder | command output |

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4). Removed pre-intro frames are detected with fonts held to first paint + 50 and + 100 ms
(G2).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line` and a
severity (high, medium, low); what you could not run and why; anything that reads or behaves wrong though it passes
its check or meets its rule, with the rule named as the suspect (WORKING_AGREEMENTS "Rules and findings"); the
evidence folder, with the frames and videos the coordinator should open first. At most 50 lines.
