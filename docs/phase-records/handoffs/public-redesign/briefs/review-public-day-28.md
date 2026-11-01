<!-- brief-format: v1 role: verifier -->
# Verifier brief: Impeccable's review of the public page's `day` design (public-redesign-r01)

Three fresh reviewers each take one part of this brief, named in their launch message: **Assessment A** (an
`owner-direction-verifier`), **Assessment B** (a `sonnet-scout`) and the **finish review** (an
`impeccable-finish-reviewer`). Review independently: do not read the designer's report or the other reviewers' output,
and never edit what you review. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `848fcd95`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-12.html`, `.css` and `.js`:
    the page under review, at `?design=day` (its default).
  - `docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketch-27.md` §"The question" and
    §"Limits": what the page was asked to do, and its only rules.
  - `.claude/skills/impeccable/reference/critique.md`: your part of Impeccable's critique.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/README.md` and
    `design-research/owner-composition-exploration-r04/directions/eclipse/evidence/daily-en-1440x900.png`: the Owner
    pages' family, the world this page belongs to.

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
- Drive C is short: keep output on D:. `TEMP` and `TMP` are already on drive D; never point them at `D:/fitway-temp`,
  whose folders the gardener inventories. (2026-09; agent-environment DECISIONS item 24)
- Meet each outcome in full: never delete or loosen what a limit keeps to save effort; report it instead. (2026-10-14)
- Shell text is code: `JSON.stringify()` is not shell quoting, and backticks or `$()` still run; use a file. (2026-10-14)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- `<run>` is `public-redesign-r01-review-28`. Write only in `D:/fitway-temp/<run>/`, in your own subfolder (named
  `a`, `b` or `finish`); the coordinator checks `git status` in every worktree afterwards. (r04 G5)

## What was delivered

Sketch 12 (`9f614f5b`), answering `docs/phase-records/handoffs/public-redesign/briefs/designer-public-sketch-27.md`.
The user picked `day` and asked for a review before a polish round, the computer's layout first. Its frames are in
`D:/fitway-temp/public-redesign-r01-sketch-27/frames-phone/`,
`D:/fitway-temp/public-redesign-r01-sketch-27/frames-desktop/` and `D:/fitway-temp/public-redesign-r01-sketch-27/frames-phone360/` (the `day`
ones are named `...design-day...`, `...day-mon...` and `...day-sat...`). Those frames, and `D:/fitway-temp/public-redesign-r01-review-28/before/desktop.png` and
`D:/fitway-temp/public-redesign-r01-review-28/before/mobile.png` (Busy, the computer at 1440 x 900 and the phone at 390 x 844), are the review's
evidence. The page loads from the file over HTTP with `pnpm verify:owner frames`, run from
`D:/Projects/fitway-worktrees/owner-design-exploration-r04` with `--concept` set to this worktree's
`design-research/owner-composition-exploration-r04/directions/eclipse` folder; it takes `?level=`, `?day=`,
`?pct=off` and `?dir=rtl`.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| A1 | **Assessment A**, as `critique.md` §"Assessment A: Design Review" defines it, on `day`: design-specificity verdict, the ten heuristic scores, cognitive load, emotional journey, strengths, 3-5 priority issues with P0-P3 severity, persona red flags, minor observations and questions. Judge the computer's layout in its own right. | The frames you looked at, by path; any frame you rendered yourself, in `D:/fitway-temp/public-redesign-r01-review-28/a/` |
| B1 | **Assessment B**, as `critique.md` §"Assessment B: Detector + Browser Evidence" defines it: the detector's CLI scan of `public-sketch-12.html`, with counts, rule names and locations, and its false positives. You have no browser tool: report the overlay as skipped. | The command as run and its output, saved in `D:/fitway-temp/public-redesign-r01-review-28/b/` |
| F1 | **The finish review**, as your definition gives it. Screenshots: `D:/fitway-temp/public-redesign-r01-review-28/before/desktop.png` and
`D:/fitway-temp/public-redesign-r01-review-28/before/mobile.png`. The build is code-led, with no comp; its direction contract is §"Direction contract" in `D:/fitway-temp/public-redesign-r01-sketch-27/NOTES.md` (FORM was set by the user's brief, not a concept roll, so it carries no seed key). PRODUCT.md is this worktree's `PRODUCT.md`; the world's bar is the Eclipse README and daily frame named above; no detector findings are passed to you. | Your five sections, with the disposition line first |

## Report

For A1 and B1, the table with PASS, FAIL or NOT RUN and your part's full return under it; for F1, your definition's
output contract. Anything that reads or behaves wrong because of a rule in the designer's brief, with the rule named
as the suspect (WORKING_AGREEMENTS "Rules and findings"). At most 80 lines.
