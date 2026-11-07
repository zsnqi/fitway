<!-- brief-format: v1 role: designer -->
# Designer brief: finish the pressed state's last pass (owner-design-exploration-r04)

For a fresh `owner-direction-designer` (Opus, xhigh). This is concept-only work (ADR-009). A previous designer built
every item of its brief and then stopped at an API session limit, before it wrote its evidence or committed. The
coordinator committed its work as WIP. You finish it. You are a replacement, not a resumption (rounds item 10): judge
the built work with your own eyes, and change it where it falls short.

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `aedd3853`
- **Base:** the WIP commit above plus this brief's own commit on top of it. Dependencies are installed.
- **The pass's brief, which still binds in full:** `design-research/owner-composition-exploration-r04/directions/briefs/designer-pressed-state-2.md`.
  Read it first, then the round's brief it names, and that brief's sources.
- **What is decided and built:** `D:/fitway-temp/owner-r04-pressed-2/NOTES.md`. Read it in full before touching code.
  `git show aedd3853 --stat` shows the WIP commit.

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

The output folder is the same: `D:/fitway-temp/owner-r04-pressed-2/`. Keep the previous designer's files and add yours
beside them. Ports 3176-3177 are free. Run `pnpm check:design-context` first.

## Your work

1. Judge items 1-5 of the pass's brief as built, from frames at 1440 and 390 in Arabic:
   - the release fade;
   - the held segment;
   - the seated chalk key;
   - «EN»;
   - the current tile.

   Change what falls short.
2. Prove the outcomes the two briefs set, and write them into the NOTES' Evidence section:
   - Every frame at rest, in normal and forced colours at 1440 and 390 in both languages, matches `691d62d5` byte
     for byte, except the two lists.
   - For «EN», show the base-against-base comparison that makes it Chromium's own noise.
   - The held and release frames, with a release strip for the fade, use the same numbering in both languages.
   - The concept CSS check reports only its two allowances, and `INDEX.md` is current.
3. Commit at the end, and earlier at natural checkpoints, with the NOTES updated at each.

## Report

As the pass's brief asks, at most 30 lines, plus a line on anything of the WIP you changed and why.
