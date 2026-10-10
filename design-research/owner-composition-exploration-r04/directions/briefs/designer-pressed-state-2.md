<!-- brief-format: v1 role: designer -->
# Designer brief: finish the pressed state (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). This is concept-only work (ADR-009). A previous designer
designed and built the press ("the key seats") and the two lists. The user then answered its questions, and the
coordinator looked at its frames. You finish the round. You are a replacement, not a resumption (rounds item 10):
judge the built work with your own eyes, and change it where it falls short.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `dbdcea0a`
- **Base:** the HEAD above plus this brief's own commit on top of it. Dependencies are installed.
- **The round's brief, which still binds in full:** `design-research/owner-composition-exploration-r04/directions/briefs/designer-pressed-state.md`.
  Read it first, then its "Read first" sources.
- **What is decided and built:** `D:/fitway-temp/owner-r04-pressed/NOTES.md`. Read it in full before touching code.
  `git show a4639c5e --stat` and `git show dbdcea0a --stat` show what the two commits changed.
- **New decision:** item 42 in `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.

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

Frames, notes and scratch go under `D:/fitway-temp/owner-r04-pressed-2/`.
Ports 3176-3177 are free now. The verify-fitway CLI can hold a press: a recipe action `hold:<css>`, documented in
`.agents/skills/verify-fitway/SKILL.md` §"Launch and drive" of the coordinator's worktree
`D:/Projects/fitway-worktrees/owner-design-exploration-r04`. Use it from there, read-only, with a recipe file in your
output folder. Run `pnpm check:design-context` first, and commit at natural checkpoints with a `NOTES.md` beside your
frames.

## Your work

1. **The release fades** (item 42, the user). On release, the press's light fades out over about 120 ms instead of
   going at once, so that even a very fast tap leaves a trace. The press still appears at once, and the scale settles
   as built. Under reduced motion and `?motion=off` the release is instant (MOT-11). Record it in MOT-20 and in
   MOT-18's exception.
2. **A held unselected segment reads as selected.** A held option of the period and kind segments looks almost
   like the selected one for that instant (the previous designer's frames 12 and 31, STA-16 against SEG-3). Outcome:
   a held option never reads as the chosen one, in both languages, at 1440 and 390.
3. **A held chalk primary reads as disabled.** It goes light grey (frames 10 and 29). Outcome: a held primary
   reads as pressed and still live, never as off.
4. **One rest frame changed.** In forced colours, the components sheet's menu specimen «EN» differs by about 70 px
   of anti-aliasing from `691d62d5`, repeatably, and the previous designer did not find the cause. Outcome: every
   frame at rest matches `691d62d5` byte for byte, except the two lists. If the difference proves to be the
   browser's own noise, show it with a base-against-base comparison instead.
5. **The current section's tile and tab press** like every other control (item 42). Confirm it in frames.

Everything else built stays, unless your own eyes find it wrong. If they do, say what and why.

## Report

- Each of items 1-5: done, with frame names, in a line or two.
- Anything else you changed, and why.
- Anything that reads or feels wrong at any size, language or setting, with the rule named.
- The output folder, the files you changed, and the commit SHA.

At most 30 lines.
