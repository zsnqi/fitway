<!-- brief-format: v1 role: verifier -->
# Verifier brief: the done-moment variants, the records card's arrival and the motion lows (owner-design-exploration-r04)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read any designer's or Codex's
report, notes or rationale before recording your own result, and never edit what you verify. (CLAUDE.md) This review
covers reading direction too.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `cd7a27c`
- **Base:** the HEAD above plus this brief's own commit on top of it. Read only.
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 1, 4, 8, 36, 37 and 38 (38 is these rounds), and "How this milestone's rounds run" items 4 and 11; read them
  with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full.
  - The briefs the rounds answered, in `design-research/owner-composition-exploration-r04/directions/briefs/`:
    `designer-done-variants.md`, `designer-records-arrival.md` (and `designer-records-arrival-finish.md`, which only
    hands it to a second designer), `codex-motion-lows.md`, and `fixer-copy-label.md`, which finishes M1 and corrects its L1 (the restoring move is
    6.328 px, not sub-pixel; L1 and L2 allow that move whatever its size, and only it). Their outcomes, hard limits
    and ranges are your baseline.
  - In `.../directions/eclipse/`: `DESIGN-SPEC.md` §1.10 (MOT-1…19) and the rows they name (BTN-9, OWN-C9, OWN-C15,
    REC-1); `README.md` §"Motion"; the code is `motion.js` and its callers, navigated with `INDEX.md`.

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

- Write only in `D:/fitway-temp/owner-r04-three-rounds-review/`; the coordinator checks `git status` in every
  worktree afterwards. (r04 G5) A local server uses port 3178 only. Render with the worktree's `@playwright/test`; take
  your own captures, never the rounds'. The `ui-forensics` skill's motion traces, layout-shift and long-frame
  observers fit.
- **Keep your context lean:** measure the matrix by code; open images and videos only where judgement needs them
  (each moment at 1440 AR, the phone where it applies, and any frame a measurement flags), downscaled unless a detail
  needs full size.

## What was delivered

`d8e272f..cd7a27c`, brief commits excluded:

1. **Variants round:** the export's done mark 12 px above its words (review F1); the export's done moment in two
   variants beside the built one behind `?done=0|1|2`; Access's row changing once the window has gone, behind
   `?row=0|1` (MOT-19).
2. **Records arrival** (two designers, the first stopped at a WIP commit): a new record on Access's «سجل الوصول» /
   "Access history" card arrives with the done line (MOT-17, MOT-18, OWN-C15), with `?records=none` and
   `?records=error`.
3. **Motion lows** (Codex; M1 finished by a fixer): a button label's position at rest (review F2), the widths MOT-14 gives written down, the
   component sheet's dead dialog animation removed (O3), the scroll lock lifting when a window closes (O4), two doc
   lines.

**Already known; do not report as findings:** the published concept lacks `tuner.js`; the Impeccable detector's wash
and stripe flags come from the shared sheets; the export's empty moment (O1) is the user's to pick among the variants.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| V1 | The glyph rule (MOT-1, DO-NOT): no element carrying text or a number has an effective opacity below 1 during any moment of the three rounds; nothing cross-fades | computed opacity sampled every frame |
| V2 | Reduced motion and `?motion=off`: instant, and each moment's end state equals the animated one 500 ms after `endedAt`, for every `?done` and `?row` value and every records case | pixel comparison, AR and EN, 1440 and 1024 (390 where the moment exists) |
| V3 | No layout shift; nothing left at rest (no inline style, attribute, copy or clip window) after any moment, including an interrupted one | layout-shift observer, DOM diff |
| V4 | Records card range: every kind of change (code created, changed, deactivated; owner added, deactivated, reactivated; a password reset; your own password changed), a record that wraps (the card grows), a card that shrinks, `?records=none`, `?records=error`, Cancel change (nothing moves), a second change before the first settled; each with both row options | traces and frames per case |
| V5 | Records card truth: the card stays never lit, never live (OWN-C11); the new record is the one the action wrote; the oldest leaves at the bottom edge, never faded; the card's edges and corners stay whole through every frame | frames, measured edges |
| V6 | Focus stays on the done line; the announcement is unchanged, not delayed or repeated | key-by-key and live-region log |
| V7 | Variants: each `?done` value and each `?row` value does what its brief says, and its timings match MOT-17 and MOT-19 within 30 ms | traces against the rows |
| V8 | Lows: each of the Codex brief's outcomes M1-M5 holds, and its limits L1-L4 hold | measures per outcome |
| V9 | Codex's held-out rows (listed below this table) | each row's evidence, with its control |
| V10 | Reading direction: every directional movement mirrors in Arabic; rolling labels keep their alignment in both languages | frames, measured edges |
| V11 | The pages at rest are unchanged from `d8e272f` apart from the named changes | pixel comparison per page, 1440 and 390, AR and EN |
| V12 | Works from `file://` and over HTTP | both |
| V13 | `DESIGN-SPEC.md`, README §"Motion" and `INDEX.md` match what is built; `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check` and `motion-capture.mjs` pass | commands, rows against measures |
| V14 | Each moment judged as a whole on the page in real time: the records arrival with each row option, and each export variant; calm and finished as item 1 describes, nothing else moving or jumping | real-time videos you record and watch, your judgement |

**Held-out rows for V9** (written before the Codex round; each with a planted-defect control):

- H1. M1 by keyboard: Access's code view, «نسخ» pressed with Enter and with Space; label and icon centred within
  0.5 px before, during the roll's last frame + 200 ms, and after a second press. Control: shift the label 2 px in a
  copy; the probe must fail it.
- H2. M1 in English at 320 px: "Copy" and "Copied" do not wrap or clip, and the button keeps one line.
- H3. M4 by Escape and by a tap on the scrim at 390 (sheet): a wheel/touch scroll dispatched 30 ms after the close
  moves the page; at the base HEAD it does not. Control: re-add the lock; the probe must fail.
- H4. M4 does not lift the lock while the window is still open (export Working, failure + Retry, done): page scroll
  stays locked in each open state.
- H5. M3: no `cx-rise`, `cx-fade` keyframes or `animation:` on `.cx-dlg` remain; the sheet's live dialog under reduced
  motion opens instantly with the same end frame.
- H6. M2 truthful: the spec's list of widened buttons matches a measured scan of every multi-label button on the five
  pages (no button missing, none listed that is not widened).
- H7. Variants untouched: `?done=1`, `?done=2` and `?row=1` strips equal the HEAD's frame for frame (L2).
- H8. `git status --short` empty in the build worktree after the run; nothing written outside the folder and the temp
  folder.

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4).

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line` and a
severity (high, medium, low); what you could not run and why; anything that reads, feels or behaves wrong though it
passes its check, with the rule named as the suspect; the evidence folder, with the names of the videos the
coordinator should watch first. At most 50 lines.
