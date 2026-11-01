<!-- brief-format: v1 role: verifier -->
# Verifier brief: a motion review of the public page, sketch 14 (public-redesign-r01)

For a fresh `owner-direction-verifier` (Opus) at its default effort. Review independently: read no designer report
and no other reviewer's output, and never edit what you review. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/public-redesign-r01`, branch `public-redesign-r01`, HEAD `a9778118`
- **Milestone:** `public-redesign-r01`. Decisions: carried by this brief; read no decision record.
- **Read first, only these:**
  - `design-research/owner-composition-exploration-r04/directions/eclipse/public-sketch-14.html`, `.css` and `.js`:
    the page under review.
  - `C:/Users/Pc Force/.agents/skills/review-animations/SKILL.md` and
    `C:/Users/Pc Force/.agents/skills/review-animations/STANDARDS.md`: the motion bar (Emil Kowalski's rules). Read
    them as files; the skill cannot be invoked.
  - `C:/Users/Pc Force/.agents/skills/ui-forensics/SKILL.md` and
    `C:/Users/Pc Force/.agents/skills/ui-forensics/references/browser-tools.md`: the measuring tools
    (`C:/Users/Pc Force/.agents/skills/ui-forensics/scripts/web/motion.mjs` trace, hold, validate-easing; long-frame
    and layout-shift observers).

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

- `<run>` is `public-redesign-r01-review-31`. Write only in `D:/fitway-temp/public-redesign-r01-review-31/motion-before/`;
  the coordinator checks `git status` in every worktree afterwards. (r04 G5)

## What to review

Sketch 14 (`ce902305`) is a gym's public page: how busy it is now, against a usual day's hours. The user likes its
design and its motion, and asks whether the motion can be better. The next designer polishes it with
`STANDARDS.md` in hand, under this precedence, which is the user's decision:

- **The arrival** (the page loading: the usual hours rising with their stagger, the live hour, the readout) keeps its
  character and its length; the user's taste outranks any rule. Report only its defects: a jump, a snap, a dropped
  frame, a wrong or mismatched easing, something shown then hidden, a layout shift. Never ask to shorten it.
- **The interactions** follow `STANDARDS.md`: hovering an hour, picking an hour (pointer, touch, arrows, Escape),
  picking a day (the bars moving to the new day), the readout changing, and the live hour's running motion.
- **Reduced motion** carries the same information without spatial movement.
- The hover's faint track behind an hour is disliked by the user and will be replaced; judge only its timing.

## How

Serve the page yourself in a background PowerShell job, from `D:/Projects/fitway-worktrees/owner-design-exploration-r04`:
`node .agents/skills/verify-fitway/cli.mjs _serve --concept D:/Projects/fitway-worktrees/public-redesign-r01/design-research/owner-composition-exploration-r04/directions/eclipse --port 3191`,
then open `http://127.0.0.1:3191/public-sketch-14.html` (switches `?level=quiet|steady|busy|packed`, `?day=sat`).
Run ui-forensics' tools from that same worktree, which has Playwright. Prove each tool with its self-test or a planted
defect before you trust it (ui-forensics rule 4). Measure the computer (1440 x 900) and the phone (390 x 844, touch).
Stop the server when done.

## Report

At most 60 lines:

- each motion on the page: what moves, its duration, easing and delay as coded and as measured;
- findings tiered as `SKILL.md` gives them, each with the `STANDARDS.md` value it fails, the file and line, and the
  exact value to use; the arrival's findings marked as defects only;
- reduced motion: what it keeps and what it loses;
- the measurement files and frames, by path, in `D:/fitway-temp/public-redesign-r01-review-31/motion-before/`;
- any rule in this brief that made the review read wrong, named (WORKING_AGREEMENTS "Rules and findings").
