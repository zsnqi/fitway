<!-- brief-format: v1 role: codex -->
# Codex brief: compares that cost only what a change reaches, and finish in one command (owner-design-exploration-r04, vf-speed)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-speed`, branch `owner-r04-vf-speed`, HEAD `b7331e09`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 45, 47 and 48.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` §"Compare", and `compare.mjs`, `runner.mjs`, `map.mjs`, `core.mjs` and `cli.mjs` beside it;
  - `.agents/skills/gardener/code-health.mjs:60-238`, how the gardener derives which files each page loads;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F137 and F145.

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
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **Your temp folder** is `D:/fitway-temp/owner-r04-vf-speed/`.
- **The concept** you measure on is the Owner concept folder
  `design-research/owner-composition-exploration-r04/directions/eclipse/` of branch `owner-followup-r04-build`, at
  `7e28c713` (the base) and at the commit the coordinator names in
  `D:/fitway-temp/owner-r04-ports/shared-frame-result.txt` once it exists (the shared-frame round's result). Take each
  from your own `git archive` of `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, extracted into your temp folder;
  never write in that worktree, where another round works.
- **Ports.** The CLI accepts only 3176-3177 for compares, and another round's compares use them now. Run no compare,
  drive or launch on them until `D:/fitway-temp/owner-r04-ports/free-for-vf-speed.txt` exists (the coordinator writes
  it when that round's compares end); until then write code and run the test suite, whose tests choose their own
  ports. Wait for the file with Monitor. Change no Windows network setting: the dynamic port range stays the default.

## Goal

During a round, a compare can take only the pages a change reaches and reuse the base side's frames of an earlier run,
so a rerun costs the changed pages' result side; one compare over all five pages finishes in one command; and a compare
run as today gives the same verdicts as today.

## Causes and required outcomes

- **S1. Only the pages a change reaches.**
  - **Cause.** `compare.mjs:104-107` takes every page or exactly one. Nothing derives which pages a change reaches:
    `map.mjs:215-223` and `:243` read each page's script and stylesheet tags but keep only the scripts
    (`map.mjs:302`), and the gardener's `deriveSharedFiles` (`code-health.mjs:209-238`) follows CSS `@import` and JS
    imports but returns only the files two or more pages load.
  - **Outcome.** `compare` has an option that takes only the pages a change reaches, judged from the build and
    baseline folders it is given. A page is taken when its HTML, any file it loads (script and stylesheet tags, followed
    through CSS `@import` and JS `import` / `export ... from`), or its entry in the recipes differs in bytes between the
    two sides. When a changed file is loaded by two or more pages, the components sheet not counted (as the gardener's
    shared-file list counts them), every page is taken (DECISIONS 47). A page whose loads cannot all be resolved from
    its files (a dynamic `import()` or a `fetch` whose path is computed, a script or stylesheet element a script
    creates) is always taken. Before it captures anything, the run prints each page taken with the changed file that
    took it, each page left out, and one line saying the run is partial. Measured on the base against a copy of itself
    in which only one declaration changed:
    - in `daily.css` (loaded by `index.html` and `components.html`): Daily and the components sheet are taken, nothing else;
    - in `reports.css` (loaded by Reports, Access, Activity and the components sheet): every page is taken;
    - in `README.md` (loaded by no page): no page is taken, the run says so and exits 0;
    - with the option left out, every page is compared, as today.
  - **Intent.** A rerun during work costs only what the change can reach, and never leaves out a page it can reach:
    where the tool cannot see a load, it takes the page. The round's final check stays a full compare; the partial line
    keeps a partial run from being read as one.
- **S2. The base side's frames are kept.**
  - **Cause.** Every run captures the baseline side again into a fresh output folder (`compare.mjs:164-177`,
    `cli.mjs:756`, `core.mjs:67-72`), and so do its stability repeats and confirmation rounds
    (`compare.mjs:194-251`, `:253-313`, `:361-388`, `:446-519`), though the base never changes between a round's reruns.
  - **Outcome.** A compare whose baseline side is the same as an earlier run's (the same bytes in every file the
    baseline's pages load and in the baseline recipes, the same CLI files, the same browser build, and the same item,
    axes, times and capture settings) reuses the baseline captures that run kept instead of capturing them, and gives
    every item the verdict a fresh capture gives (`EQUAL`, `DIFFERENT`, `NOT-HELD`, a problem); a difference in any of
    those inputs captures afresh every item it can reach. For an item it reuses, the run does no baseline-side browser
    work at all (no browser start, navigation, action, wait, stability repeat or confirmation round): it reads the kept
    captures and what was measured with them. Each run prints how many baseline captures it reused and how many it took. Kept captures live in one folder on drive D outside `D:/fitway-temp`, never take more than 10 GB, and
    the oldest go first. Measured, each with its wall time:
    - Reports, `--feature page --states all`, Arabic and English, desktop, tablet and phone, reduced motion, HTTP, the
      shared-frame result against the base, run twice: the second run takes no baseline capture and every verdict
      equals the first's;
    - then with one declaration of the baseline copy's `reports.css` changed: the run takes every Reports baseline
      capture afresh;
    - `--timeline`, Reports `export-open` and `period-7d`, Arabic, desktop, mouse, full motion, HTTP, run twice: the same
      verdicts and the same `NOT-HELD` samples both times, the second reusing its baseline captures.
  - **Intent.** A rerun's cost is the result side; a kept frame never stands in for a baseline that changed in any way
    the frame could show, and a sample's stability is still judged from repeated captures of its own side.
- **S3. One compare over all five pages finishes (F137).**
  - **Cause.** One compare over all five pages ended in `ERR_NO_BUFFER_SPACE` after about 530 items and then stalled
    (`D:/fitway-temp/codex-round-684833a3-7e69-4667-a332-44ac9b93526c/last-message.md`, Q1); today's shared-frame round
    hit it on one page alone (Access, `--feature all`). Each `drive()` starts a server and a browser, and each item a
    new browser context (`runner.mjs:299-311`, `:354`, `:799`; `core.mjs:107-226`); nothing in the tool counts or
    reuses connections, and the machine has Windows' default 16,384 dynamic ports.
  - **Outcome.** One command, `compare --page all --feature page --states all`, Arabic and English, desktop, tablet
    and phone, reduced and full motion, mouse, HTTP, of the base against itself with nothing kept from an earlier run,
    completes with no `ERR_NO_BUFFER_SPACE` and no stall, every item `EQUAL` apart from the base's known capture
    problems (`arrive` = `never`, `0`, `500` on Daily, Reports, Access and Activity, and a lone `from` or `to` on Reports
    and Activity); twice, in two separate runs. Report each run's item count and wall time.
  - **Intent.** A round's full check runs as the one command a brief names, without splitting it by page or rerunning
    items that ran out of sockets.
- **S4. Proof.**
  - **Outcome.** A new test file in `.agents/skills/verify-fitway/` (the fast ladder runs every `*.test.mjs` there since
    `b7331e09`) proves on fixtures: a file one page loads takes that page; a file two pages load takes every page; a
    file only the components sheet and one page load takes those two; a load the tool cannot resolve takes its page; a
    change no page loads takes none; an unchanged baseline reuses every capture; a changed baseline file, recipe, CLI
    file or capture setting captures afresh. The tests run the CLI's own `compare` command, not only its helpers, and
    each one fails when its defect alone is put back, including `compare` no longer calling the new code; report how
    you checked each. `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** Each choice above is shown to fail when its defect returns.

## Limits the result keeps

- **L1. Today's compare is unchanged.** Without the new option and with nothing kept, the CLI keeps the HEAD's items,
  verdicts and failures in every configuration it supports; `cli.test.mjs` passes unedited. Measured: the new CLI and
  the CLI at the HEAD above give the same result for every item of all five pages, `--feature page --states all`,
  Arabic and English, desktop and phone, reduced motion, HTTP, the shared-frame result against the base; and for
  `--timeline` of Reports' `export-open` and `period-7d` (Arabic, desktop, mouse, full motion, HTTP, the same two
  folders) no sample is `EQUAL` under one CLI and `DIFFERENT` under the other.
- **L2. Only the tool.** Only `.agents/skills/verify-fitway/**` changes, apart from `code-health.mjs`, which may only
  export what it already computes (the gardener's output unchanged, its tests passing). `cli.test.mjs` is not edited
  (another round adds its own test file). `SKILL.md` changes only in §"Compare". No measurement list shrinks: the
  recipes keep every feature (Daily 44, Reports 31, Access 46, Activity 30, the components sheet 14).
- **L3. A clean tree.** `git status --short` is empty after your commit and after the fast ladder; scratch files live
  in your temp folder.

## Scope

You may change `.agents/skills/verify-fitway/**` (`.agents/skills/verify-fitway/compare.mjs` (must change)) and, as L2
allows, `.agents/skills/gardener/code-health.mjs`;
commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do not
work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it, and the SHA it ran on. A
measurement you did not run is a FAIL, never a PASS: run every one before you report. Then: S2's and S3's wall times;
the files you changed; the commit SHA; anything you could not do; any hook message you did not act on. At most 30 lines.
