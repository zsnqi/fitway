<!-- brief-format: v1 role: codex delivers: commit -->
# Codex brief: one loading check for every Owner concept page (agent-tooling-r01, loading-check)

- **Worktree:** `D:/Projects/fitway-worktrees/tooling-loading-check`, branch `tooling-loading-check`, HEAD `f721ccd4`
- **Milestone:** `agent-tooling-r01`. Decisions: item 82 of
  `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` (what is compared, the 0.5 px bound, the
  sizes and languages), and items 6 and 10 of `docs/phase-records/handoffs/agent-tooling/DECISIONS.md` (no second
  path; room is made by moving code out).
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md` §"Launch and drive" and §"Evidence and advanced tools": the commands,
    the concept source and the port rules this check joins;
  - `.agents/skills/verify-fitway/cli.mjs`, the command dispatch (from line 640), and
    `.agents/skills/verify-fitway/core.mjs` `verificationPairs` and `verificationPort` (lines 324-345);
  - `.agents/skills/verify-fitway/concept-source.json`: the concept is read from that ref, not from this worktree's
    own copy of the concept, which is older;
  - the query comments that open each page's first load, exported from that ref at `7dba9d91` (read only):
    `D:/fitway-temp/tooling-loading-check/concept-ref/daily.js` lines 1-6,
    `D:/fitway-temp/tooling-loading-check/concept-ref/access.js` lines 21-24,
    `D:/fitway-temp/tooling-loading-check/concept-ref/activity.js` lines 14-18,
    `D:/fitway-temp/tooling-loading-check/concept-ref/settings.js` lines 17-21 and 893-897 (the slots the arrival writes
    into), and `D:/fitway-temp/tooling-loading-check/concept-ref/reports.js` lines 1-3.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`) from a checkout of the pushed commit alone,
  with no other branch, no Playwright Chromium and no network: every test you add passes there. A proof that needs
  a real browser is a script in your temp folder, run and reported, not a ladder test.
- **Your temp folder** is `D:/fitway-temp/tooling-loading-check/codex/`. Start no Codex process and never run
  `codex:round` or `main:advance`. Link no `node_modules` between folders; this worktree has its own install.
- **Commit once, plainly, after everything else**, then run the fast ladder (`pnpm verify:fast`) after that commit.
  Never reset, amend or rewrite commits. Name the SHA `git rev-parse HEAD` printed after your commit.
- **A port** comes from verify-fitway's allocation only; never stop or reuse a listener another process holds.

## Goal

verify-fitway gains one command that tells, for an Owner concept page, whether its first-load skeleton keeps the
arrived page's boxes (decision 82), so every remaining page is built and verified against the same repeatable check
instead of each verifier writing its own scripts.

## Causes and required outcomes

- **L1. No shared loading check exists** (decision 82; SKILL.md has no loading command). Outcome: one verify-fitway
  command, given a page and a query, records the boxes of the page's header, each card, each card's title and each
  slot (the element a value is written into on arrival; never the placeholder bar inside it) while the skeleton is
  shown and again after arrival, and prints one line per page × size × language × case: PASS or FAIL, the largest
  movement in px (x, y, width or height) with the element it belongs to, and the layout-shift sum. FAIL when any
  compared box moves more than 0.5 px or any layout shift is recorded. It runs Daily (`index.html`), Access, Activity
  log and Settings at 1440 × 900, 768 × 1024 and 390 × 844, Arabic and English, each with its default data and with
  the widest-text case its query comment names (Access `case=long`, Activity log `case=wide`, Settings `case=wide`
  and `log=every`; Daily names none: report that), which is at least 48 lines (8 page × case pairs × 3 sizes × 2
  languages); the matrix never runs fewer. The layout-shift sum covers the whole time from the skeleton's record to
  the arrival's record. Mouse only; touch is out of scope. Intent: one command reproduces decision 82's check on every
  page; a page or case it cannot reach is reported as such, never silently skipped. It needs a browser, which CI does
  not have, so page rounds and their verifiers run it by hand; its comparison logic's unit tests are what the ladder
  runs (L2).
- **L2. The check must catch what decision 82 forbids and nothing it allows.** Outcome: against a copy of the concept
  in your temp folder with planted defects, each of these FAILs on the page it is planted in: a slot that moves 1 px
  on arrival, a card that grows 40 px on arrival, a layout shift on arrival; and a placeholder bar made 20 px wider,
  then 20 px narrower, inside an unchanged slot PASSes. Report each plant, its page and the line printed. The
  comparison logic also has unit tests that run in the ladder without a browser. Intent: a check that passes
  everything, or fails on bars that are shorter than their text by design, is worse than none.
- **L3. The loading record must be the skeleton.** Each page has phases: an empty wait, the skeleton, the arrival;
  Daily's `arrive=never` turns into Error after 10 s (`daily.js` lines 3-4). Outcome: each line also states the phase
  the loading record was taken in, read from the page (for example the root's `data-load` value and `aria-busy`),
  and that phase is the shown skeleton on every line. Intent: comparing two arrived pages, or the empty wait, would
  pass trivially.
- **L4. Reports and the Components sheet.** Outcome: the report says whether `reports.js` has a first-load loading
  state reachable by query (lines 1-3) and includes Reports in L1 if it has; `components.html` is a specimen sheet
  and is out of scope. Intent: no page that has a first load is left out by assumption.
- **L5. Findings on today's concept.** Outcome: the full L1 matrix is run once against the concept at
  `concept-source.json`'s ref, and every FAIL is listed as a finding (page, case, size, language, element, px); a
  finding is not a FAIL of this round, and the concept is not changed. Also report the matrix's total run time.
  Intent: the coordinator learns the pages' real state from the tool, not from this brief.
- **L6. The rest of verify-fitway is unchanged.** Outcome: the command follows the CLI's existing contract (usage,
  `--help`, startup errors) and appears in `pnpm tools`; SKILL.md gains one short section with one example command;
  `pnpm map:tooling` is rerun after `git add`; the code-health ratchet and the fast ladder pass after the commit;
  existing commands, their tests and the port allocation are unchanged. New code goes in its own module, `cli.mjs`
  gains only the wiring (item 10). Intent: one more command, no second path and no growth of a giant file.

## Scope

You may change `.agents/skills/verify-fitway/cli.mjs` (must change), `.agents/skills/verify-fitway/SKILL.md` (must
change), new files in `.agents/skills/verify-fitway/`, and `docs/agent-context/AGENT_TOOLING_CODE_MAP.md`
(regenerated only); commit once when done. Everything else is read-only, the concept included. Add no dependencies.
If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome L1-L6 as PASS or FAIL with the command and the output line that proves it; L5's findings as a list;
the files you changed; the commit SHA; anything you could not do.
