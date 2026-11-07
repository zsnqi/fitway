<!-- brief-format: v1 role: builder -->
# Builder brief: Access, the code's face, its copy control, its case, and a double tap (owner-design-exploration-r04)

For a fresh `owner-direction-builder` (Opus, high). Concept-only (ADR-009). Access's fix round is built (designer
`a0c6c76`, Codex `376c845`). The user answered the designer's questions on the code; this round builds those answers
and closes three gaps the Codex round left. Everything else on the page stays as it is.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `376c845`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 4, 6, 7 and 34 (its last bullets, "After the fix round's design part", are this round), read with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; in
  `design-research/owner-composition-exploration-r04/directions/eclipse/` ("the folder"), `DESIGN-SPEC.md` rows DLG-9,
  DLG-11, FLD-10, TYP-1 and AMD-C4, and `access.js` / `access.css` around `fitCode`, `copyHTML` and `.acc-sec`
  (navigate with `INDEX.md`); the Codex round's report `D:/fitway-temp/codex-runs/owner-access-fix/last-message.md`.

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

- Run `pnpm check:design-context` first. Impeccable is the one design skill; load no other. Port 3176 only. Frames
  and scratch go under `D:/fitway-temp/owner-r04-access-code/`.

## What to build, and why

1. **The code in a monospace face** (DECISIONS 34): in the one-time view and in the field where the owner types it,
   nowhere else. Why: Readex draws I and l alike and O close to 0, so a code read off a note can be misread. The face
   tells I, l and 1 apart and O from 0. It requests nothing from outside the origin (item 6): a self-hosted file
   under `fonts/` with its licence, or a system face whose fallback on every platform still tells those apart.
   Name it as TYP-1's one exception.
2. **The copy control beside the code on the computer** (DECISIONS 34, the user): at the code's end on the same line
   from the computer's widths, under it on the phone, as the skeleton drew it. Why: the user expected the skeleton's
   arrangement; the designer put it under only so a long code never shared its line. Check it against the widest
   sixteen characters the field accepts, in both languages, at 1440, 1024, 768 and 721; if it cannot fit without
   the code going below a size you judge legible, keep it under at that width and report the measurements.
3. **The code keeps its case** (DECISIONS 34, «نفرّق»): A and a differ. AMD-C4 and any hint or row that says or
   implies otherwise describe it.
4. **A double tap never commits a code** (Codex report, last bullets). Cause: «متابعة» and «حفظتُ الرمز» sit in the
   same place, and the commit's former 700 ms guard is gone, so a fast double tap on the phone can save a code the
   owner never saw, signing the desk out. Outcome: the second tap of a double tap on «متابعة» (or Enter held) never
   reaches the commit, at every size and in touch; a deliberate tap on «حفظتُ الرمز» still shows Working in the same
   frame (A8 of the Codex round).
5. **INDEX lists `access.js`** (Codex A10): `tools/build-index.mjs` gains it, and `tools/check-index.mjs`'s fixture
   gains the files the generator reads (it fails at the base on a missing `picker.js`). INDEX.md regenerated with
   the command at its top.

DLG-9, DLG-11, FLD-10, TYP-1 and AMD-C4 describe what is built.

## Hard limits

Eclipse's look (item 1), the frame (item 7), DO-NOT in full; every target 44 px; no sideways scroll; motion as item
4. Privacy: the code appears only in its one view and its field, never in a URL, a log line or screen-reader text
after the view. Nothing else on Access, Activity log, Daily or Reports changes: their frames equal `376c845` apart from
the code's view and field.

## Files

In the folder: `access.html`, `access.css`, `access.js`, `access-capture.mjs`, `DESIGN-SPEC.md`, `INDEX.md`,
`tools/build-index.mjs`, `tools/check-index.mjs`, and new files under `fonts/` if item 1 needs them. Commit there.

## Frames

At 1440 × 900, 1024 × 768, 768 × 1024, 721 × 900, 390 × 844 and 320 × 568, AR and EN, over HTTP on 3176 and from
`file://`, in `D:/fitway-temp/owner-r04-access-code/crops/`: `1-` the one-time view with a short code, a mixed
twelve-character code and the widest sixteen; `2-` the field with the same three; `3-` the double tap in touch at 390
(before, after); `4-` «نُسخ» after copying, beside and under. Inspect every frame; a passing check is not a looked-at
frame. `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check`, and
`access-capture.mjs` pass.

## Report

The face and why; where the copy control sits at each width and the widest code's measurements; items 3-5 in a line
each; anything that reads wrong, with the rule that produced it. The crop folder, the files you changed, the commit
SHA. At most 30 lines.
