<!-- brief-format: v1 role: verifier -->
# Verifier brief: a motion review of the public page, sketch 16 (public-redesign-r01)

For a fresh `owner-direction-verifier` (Opus, high). Review independently: read no designer report and no other
reviewer's output, and never edit what you review. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `630a3b12`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-16.html`, `.css` and `.js`
    at `630a3b12`: the page under review. A designer edits other files in this worktree while you work; review the
    commit, never the working tree (`git -C <worktree> show 630a3b12:<path>`).
  - `C:/Users/Pc Force/.agents/skills/review-animations/SKILL.md` and
    `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`: the motion bar (Emil Kowalski's rules). Read
    them as files; the skill cannot be invoked.
  - `C:/Users/Pc Force/.agents/skills/ui-forensics/SKILL.md` and
    `C:/Users/Pc Force/.agents/skills/ui-forensics/references/browser-tools.md`: what the motion tool measures
    (trace, hold, validate-easing; long-frame and layout-shift observers).
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`
    §"CLI working loop": the commands you run.

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

- `<run>` is `public-redesign-r01-motion-38`, made by the coordinator with `pnpm run-folder:new`. Write only in
  `D:/fitway-temp/public-redesign-r01-motion-38/`; the coordinator checks `git status` in every worktree afterwards.
  (r04 G5)

## What was delivered

Sketch 16 (`0fad27b9`, in `630a3b12`) is a gym's public page: how busy it is now, against a usual day's hours, with a
row of days to see another day. The user likes its design and its motion. A motion review of sketch 14 found the
interactions' values; sketch 15 and 16 were designed with `STANDARDS.md` in hand under this precedence, which is the
user's decision and which you judge against:

- **The arrival** (the page loading: the usual hours rising from the floor with their stagger, the live hour, the
  readout) keeps its character and its length; the user's taste outranks any rule. Report only its defects: a jump,
  a snap, a dropped frame, a wrong or mismatched easing, something shown then hidden, a bar entering from the top, a
  layout shift. Never ask to shorten it.
- **The interactions** follow `STANDARDS.md`: hovering an hour, picking an hour (pointer, touch, drag along the bars,
  arrows, Escape), the picked bar's chalk outline, picking a day (the bars moving to the new day, the head above
  stepping back to 70%), the readout changing while it holds its height, and the live hour's running motion.
- **Reduced motion** carries the same information without spatial movement.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| M1 | Every motion on the page listed: what moves, duration, easing and delay as coded and as measured | `file:line` and the trace file |
| M2 | The arrival on the computer (1440 x 900) and the phone (390 x 844, touch) has no jump, snap, top entry, dropped frame or layout shift | traces, long-frame and layout-shift observers |
| M3 | Each interaction meets its `STANDARDS.md` value | the value, the measurement, `file:line` |
| M4 | Reduced motion keeps every change of information and moves nothing | a trace under reduced motion |
| M5 | The motion tool is proven before it is trusted (its self-test or a planted defect; ui-forensics rule 4) | the proof's output |

Measure with `pnpm verify:owner measure --tool motion --ref 630a3b12 --page public-sketch-16.html` (the query, port
and `--args-file` as SKILL.md §"CLI working loop" gives them), run from
`D:/Projects/fitway-worktrees/owner-design-exploration-r04` in PowerShell, which serves the page itself. Use ports
3191 and up. For a working shot after an interaction use `pnpm verify:owner frames --ref 630a3b12 --actions ... --clip ...`;
for a check no command makes, `pnpm verify:owner run --script`. Page switches: `?level=quiet|steady|busy|packed`,
`?day=sat` (another day), `?hour=<0-25>` (a picked hour).

Timing checks keep 30 ms from any cap, run to at least 500 ms after `endedAt`, and run under `no-store` and with no
cache header (r04 G1, G3, G4).

## Report

At most 60 lines: the table with PASS, FAIL or NOT RUN and one line of evidence each; then the findings tiered as
`SKILL.md` gives them, each with the `STANDARDS.md` value it fails, `file:line` and the exact value to use, the
arrival's marked as defects only; reduced motion, what it keeps and what it loses; the measurement files by path;
any rule in this brief that made the review read wrong, named (WORKING_AGREEMENTS "Rules and findings").
