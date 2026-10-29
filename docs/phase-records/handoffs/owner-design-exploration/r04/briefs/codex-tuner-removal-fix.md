<!-- brief-format: v1 role: codex -->
# Codex brief: Daily's capture script back without the tuner (owner-design-exploration-r04, tuner-removal-fix)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, HEAD `aeb7d35a`
- **Milestone:** `owner-design-exploration-r04`. Decisions: items 50 and 59. The build branch's copy of DECISIONS.md is
  behind; read them from the coordinator branch with
  `git -C D:/Projects/fitway-worktrees/owner-followup-r04-s04 show codex/owner-redesign-r04:docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/briefs/codex-tuner-removal.md`,
    the round's brief: its Goal, T1 and L1-L3 hold for this run.
  - `D:/fitway-temp/owner-r04-tuner-removal-fix-sources/capture-4352181f.mjs`, the folder's capture script as it
    stands at `4352181f`, whole.
  - `design-research/owner-composition-exploration-r04/directions/eclipse/README.md` at `4352181f`, §"Measurements"
    and §"Open and capture", and the same file at the HEAD above.

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
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. Any message without a tool call is your final message:
  it ends your run and stops what you started, so wait inside a tool call and write it once, as the report.
  (2026-10-02 retrospective; F154)
<!-- environment:end -->

- **Your temp folder** is `D:/fitway-temp/owner-r04-tuner-removal-fix/`. Take the base from your own `git archive` of
  `4352181f`, extracted outside every git tree. `capture.mjs` serves on 127.0.0.1:3173; run one copy at a time, and no
  other preview or compare of yours beside it.

## Goal

Removing the light tuner removes only the tuner: Daily's capture script, which also holds the folder's static-frame
guard, its motion checks and its light measurements, runs again, and no file describes the tuner's presets.

## Causes and required outcomes

- **C1. Daily's capture script deleted whole.**
  - **Cause.** `58e39ede` deleted `capture.mjs` (2,362 lines, about 128 naming the tuner) and README's account of
    it, though the round's L1 allowed removing only "the parts that captured the tuner itself".
  - **Outcome.** `capture.mjs` is back at its base path. The result differs from the base file only by removing
    what exists for the tuner (its frames, preset frames, `?tuner=0` and `?preset` in URLs, the tuner file check and
    its log fields and messages) and what that removal makes unused. First run the base file on the base extract and
    record each check's verdict and every frame it writes; then run the result on the HEAD's folder. Every check the
    base file makes outside the tuner gives the same verdict and writes the same frames with the same bytes; report
    each check with both verdicts, and any that fails at the base as failing there too. README names and describes it
    as at the base, without the tuner. A case-insensitive search of the folder, `HISTORY.md` and the evidence folder
    apart, for `tuner`, each preset's name and the base's stored-tuning keys finds nothing.
  - **Intent.** The folder keeps every guard it had that was not about the tuner.
- **C2. The tuner's presets in README's measurements.**
  - **Cause.** README §"Measurements" still compares the tuner's presets by name ("Recommended", "A-like",
    "v2 preset"), which T1 does not allow outside `HISTORY.md` and the evidence folder.
  - **Outcome.** Those rows describe each light variant without naming a tuner preset or giving a key from which one
    could be looked up; their measured values are unchanged.
  - **Intent.** What a reader learns about the lights stays; the tool's names go.

## Limits the result keeps

- **L1. Everything else unchanged.** Only `capture.mjs`, `README.md` and `INDEX.md` change: README outside C1's
  account of the capture script and C2's rows, and INDEX outside the lines its build tool generates for that
  script, are byte-identical to the HEAD, and so are recipes, page files, tools and `HISTORY.md`.
- **L2. The checks pass.** The round's L1 checks pass, and `node scripts/verify.mjs fast` passes on your committed
  tree; `git status --short` is empty after your commit and after the ladder.

## Scope

You may add `capture.mjs` back to the folder and change `README.md` (must change) and `INDEX.md` there.
Commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not work
around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; C1's checks with both
verdicts; the lines removed from `capture.mjs` grouped by what they did; the files you changed; the commit SHA;
anything you could not do; any hook message you did not act on. At most 30 lines.
