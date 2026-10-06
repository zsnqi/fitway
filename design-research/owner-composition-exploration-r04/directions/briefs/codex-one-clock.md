<!-- brief-format: v1 role: codex -->
# Codex brief: the export's settle moves on one clock (owner-design-exploration-r04)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `aef7437`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`
  items 36, 37 and 38, and "How this milestone's rounds run" items 9 and 11; read them with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:** `design-research/owner-composition-exploration-r04/directions/DO-NOT.md` in full; your
  previous round's brief `directions/briefs/codex-three-rounds-fix.md` (F1) and its commit `ce3f07e`; in the folder
  below, `README.md` §"Motion" and `DESIGN-SPEC.md` rows MOT-1, MOT-15 and MOT-16. Navigate code with `INDEX.md`. The
  review's frames named below are in `D:/fitway-temp/owner-r04-three-rounds-fix-review/`; read no report or notes
  there. "The folder" is `design-research/owner-composition-exploration-r04/directions/eclipse/`.

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

- Your temp folder is `D:/fitway-temp/owner-r04-one-clock/`. You run in the workspace-write sandbox with automatic
  approval review. `git add`, `git commit` and anything that starts child processes with piped output (pnpm,
  Playwright, Node scripts that run git) fail inside it: request escalation for them from the first attempt, with a
  one-line justification. (DECISIONS item 7)
- Every outcome holds from `file://` and over HTTP, at 1440 x 900, 1024 x 768, 768 x 1024 and 390 x 844 (a touch
  context; the sheet), AR (`?lang=ar`, the default) and EN, with motion, with `prefers-reduced-motion: reduce`, and
  with `?motion=off`, for `reports.html?done=0`, `?done=1` and `?done=2`. Use port 3176 only.
- Render every baseline from your own `git archive aef7437` of the folder in your temp folder. Every bound below is a
  rule or a measure you take at that baseline; the review's numbers are readings, not limits.
- **Under load** means each of: Chromium's CPU throttling at 4x, and a planted 100 ms main-thread stall (a busy loop)
  about 40 ms into the movement. Record real time (a screencast or a video), never only frozen or stepped frames: the
  defect lives in how threads keep time, and stepped frames cannot show it.

## Goal

Your previous round moved variant 2's cut onto the compositor so it keeps pace with the riders; that fixed text over
text. The review of that round found that the panel the cut sits in still settles on the main thread, because one
animation drives both its `transform` and its `clip-path` (`motion.js` about 350-351), while the window surface's
pieces, the cut and the riders move on the compositor. Under load the parts drift apart: at 390 AR under 4x CPU the
calendar copy jumps about 32 px up on the first moving frame and drifts back (`out/c4-390-base-vs-head.png`), which
breaks MOT-16's "on the phone's sheet it stays still"; under a stall the panel's title and content lag the moving
surface and the title is drawn outside it (`out/jank-head-detail.png`, also at the baseline before your previous
round). The new MOT-16 and README wording says the moment is on the compositor, which is not true of the panel.

## Causes and required outcomes

Each outcome states its intent; where the literal text and the intent disagree, say so in the report instead of
choosing. Confirm the cause at the HEAD before you act; if it is different, fix the real one and say so.

- **C1. The export's settle holds together under load.** Intent (MOT-15, MOT-16): the window settles as one object;
  its surface, its edges, its title, its content, the cut and what rides with the edge keep their places relative to
  one another in every frame, whatever the frame rate, so a slow machine sees the same moment, only less smoothly.
  Choose the mechanism (every part of the settle on one clock: all on the compositor, all on the main thread, or
  another way you can show holds); state which and why. Outcome: under load, in real-time recordings at every size,
  language and `?done` value above, every part's offset from the panel's edges equals what the same moment draws at
  1x with no load at the same progress, within 1 px; on the sheet the copy stays still on screen within 1 px; text
  never runs over text (your previous round's probe). Build a probe that fails at the baseline (its control) before
  trusting it.
- **C2. The chosen day's mark is not moved by the cut.** The review saw the copy's «22» mark drawn up to 1 px off
  during the cut (`out/frz-diff-0-20.png`), likely the window's offset and `px()` rounding. Outcome: during the cut,
  the copy's pixels equal what `06f3bbf` (before your previous round) draws at the same progress, within 0.5 px.
- **C3. The words are true.** MOT-16, README §"Motion" and the code comments say how the settle keeps time, and it is
  what the code does under a planted stall.
- **Report only, no change:** any other moment in the folder whose parts run on different threads (the dialog's
  opening and closing, the popover, the records card's arrival): name it, with a measure under load. Rounds item 11
  decides.

## Limits the result keeps

- **L1.** At 1x with no load, every frame of the export's done moment for each `?done` value equals the baseline
  within the noise you measure between two baseline captures; every other page and moment is untouched.
- **L2.** Reduced motion and `?motion=off` are instant with the same end state; nothing left over at rest, including
  after Escape at 40 and 150 ms and a second Export within the moment.
- **L3.** `node tools/lint-spec.mjs`, `node tools/check-index.mjs`, `node tools/build-index.mjs --check` and
  `motion-capture.mjs` pass as at the baseline or better (a check that fails there is reported, not fixed);
  `node --check` passes on every `.js` and `.mjs` in the folder.
- **L4.** One commit on `owner-followup-r04-build`, its message ending in your own attribution line; not pushed;
  `git status --short` prints nothing after it.

## Scope

Write only in the folder: `motion.js`, the `.css` that styles the settle's surface, `DESIGN-SPEC.md` (MOT-15,
MOT-16), `README.md` §"Motion", and `INDEX.md` regenerated with the command at its top.

## Report

Each outcome PASS or FAIL with its measure and its control; the mechanism you chose and why; the report-only list;
any literal text that contradicted its intent; files changed; the commit SHA. At most 30 lines.
