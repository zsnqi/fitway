<!-- brief-format: v1 role: codex -->
# Codex brief: verify-fitway holds a press (agent-environment-r03, round 21)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r21`, branch `agent-environment-r03-r21`, HEAD `95a212af`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 15, 20, 21.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` §"Launch and drive" and §"Evidence and advanced tools", and the scripts
    beside it;
  - `D:/fitway-temp/r03-r21-forensics/ui-forensics/references/browser-tools.md` (its action table) and the 1.2.0 entry of
    `D:/fitway-temp/r03-r21-forensics/ui-forensics/CHANGELOG.md`.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- If 3176 or 3177 is held by a process you did not start, never stop it; to prove an outcome on those ports, hold
  them with a process you start and stop it when done.
- A copy of the machine-level ui-forensics 1.2.0 is at `D:/fitway-temp/r03-r21-forensics/ui-forensics/`; you may
  change that copy. The machine-level skill under the user's profile is read-only. The CLI reaches a copy through
  `--forensics`. The copy's browser self-test is `node <copy>/tests/web/selftest.mjs`, run with the worktree as the
  working directory (44 of 44 on the base); its image self-test is `python <copy>/tests/img/selftest.py` (55 of 55).
- H4's concept is `design-research/owner-composition-exploration-r04/directions/eclipse` of `owner-followup-r04-build`
  at `cd2938ec`, read from your own `git archive` in your run folder, never from its worktree; its recipes are there.
  That concept has no pressed state yet.

## Goal

A verifier can hold a press on a named control, with a mouse or a finger, and capture frames and traces while it is
held. So the Owner CSS round's pressed state can be proved from rendered evidence: that it shows, how fast it
appears, and that a disabled control shows none.

## Causes and required outcomes

- **H1. No action keeps a pointer down.**
  - **Cause.** The copy's action vocabulary (`D:/fitway-temp/r03-r21-forensics/ui-forensics/scripts/web/_common.mjs:363-399`) releases every pointer action at once:
    `click`, `tap`, `drag`, `touchdrag`, and `pointer`, whose events are dispatched in-page and never set `:active`.
    verify-fitway's `drive` sends its pointer actions through it (`.agents/skills/verify-fitway/drive.mjs:276-302`)
    and captures only before and after them all (`runner.mjs:357,376,504`).
  - **Outcome.**
    - The copy gains a held press on a selector, with a matching release. With a mouse, the primary button goes down
      at the element's centre and stays down. With touch, a finger touches there and stays.
    - Every copy tool that takes actions or triggers accepts the press and the release. So
      `motion sample --trigger <held press>` traces a control's colour and transform from the moment it is pressed.
    - `drive` can capture a frame while a named control is held, then releases it. The manifest records the control,
      the input, the time between the press and the capture, and whether the control matched `:active` at capture.
    - A press still held at the end of an item is released before the next item starts.
    - Keyboard input refuses a held press with a message.
  - **Intent.** A frame or trace shows each control while the owner presses it, including how quickly the pressed
    state appears.
- **H2. Emulated touch does not show `:active` while held.**
  - **Cause.** The coordinator probed Chromium 149 headless with touch and mobile emulation. A CDP `touchStart` held
    for 0-400 ms never applied `:active`, and neither did a 900 ms synthesized tap gesture. A mouse button held down
    applied it at once.
  - **Outcome.** For a held touch, the output names which of three cases it saw:
    - the pressed state shows while held, as it does for a press drawn from pointer events;
    - a pressed style exists for `:active`, but emulated touch does not show it, so prove it with a mouse hold and on
      a device;
    - the control has no pressed style at all.

    A held touch never ends in a silent equal frame.
  - **Intent.** An unchanged touch frame is never read as a missing press, and a missing press is never excused as an
    emulation limit.
- **H3. Planted controls.**
  - **Outcome.** Tests in the fast ladder, each failing on `95a212af` and passing after, cover fixture controls:
    - with a mouse: a control with an `:active` style differs while held; a plain control does not; a disabled
      control whose `:active` excludes it does not;
    - with touch: a control pressed through pointer events differs while held; an `:active`-only control and a plain
      control are classified as in H2.

    The copy's self-tests gain a planted control for the held press: a press that releases at once fails it. Every
    earlier control still passes, and the copy's version and CHANGELOG move to 1.3.0.
  - **Intent.** Each classification is shown to fail when its defect is planted.
- **H4. Proven.**
  - **Outcome.**
    - `pnpm test:verification` and `node scripts/verify.mjs fast` pass on your committed, clean tree, once with
      3176-3177 free and once held by a process you start.
    - `--port` still refuses everything except 3176-3177.
    - Both of the copy's self-tests pass.
    - With the machine-level 1.2.0, a held press is refused with a message naming the version it needs. It never
      produces a result.
    - Using the copy, on the concept, a mouse hold on one of Daily's rail items at desktop (Arabic and English, reduced
      motion, HTTP) yields frames and a classification of "no pressed style", and the ports are free afterwards.
  - **Intent.** It works on the real concept, and nothing that worked stops working.

## Scope

You may change `.agents/skills/verify-fitway/` and the ui-forensics copy at
`D:/fitway-temp/r03-r21-forensics/ui-forensics/`. Commit the worktree's changes once when done; the copy is not in
git. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work around it: finish and
measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the files you changed in the worktree and in the copy;
- the commit SHA;
- anything you could not do.

At most 30 lines.
