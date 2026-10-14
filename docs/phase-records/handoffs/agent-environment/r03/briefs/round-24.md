<!-- brief-format: v1 role: codex -->
# Codex brief: the gardener measures code health (agent-environment-r03, round 24)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r03-r24`, branch `agent-environment-r03-r24`, HEAD `a798440e`
- **Milestone:** `agent-environment-r03`. Decisions: `docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 16, 20, 24.
- **Read first, only these:**
  - `.agents/skills/gardener/SKILL.md` §"Fixed checklist" and §"Pass procedure";
  - `.agents/skills/gardener/survey.mjs` (its `formatReport` and `main`) and `.agents/skills/gardener/config.json`;
  - `.agents/skills/gardener/REPORT.md` (the last rolling report).

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
- The live Owner concept is `design-research/owner-composition-exploration-r04/directions/eclipse` on the local
  branch `owner-followup-r04-build` (at `d1a01f3c` today). Read it only through git objects (`git show`, `git
  ls-tree`, `git archive` into your run folder), never from that branch's worktree.
- Another round changes `survey.mjs` at the same time. Put this round's measuring in a new module beside it, with its
  own tests, and change `survey.mjs` only to call that module and print its section.

## Goal

Each gardener pass reports the code health of the live concept and of the repository's own tooling, with the trend
since the last pass, and the pass's weight moves from temp-folder cleanup to code health and repeated anti-patterns.

## Causes and required outcomes

- **H1. The gardener measures no code health.**
  - **Cause.** DECISIONS item 20 agreed a report-only code-health section, and item 24 moves the gardener's weight to
    it. The survey (`.agents/skills/gardener/survey.mjs`) and the skill measure folders, branches, worktrees, checks
    and rule lines only; nothing in the gardener reads source code for its health.
  - **Outcome.** The survey's report and `survey.json` gain a code-health section with two scopes: the concept at the
    branch and folder named in `config.json` (today the two above), and the repository's tooling (`scripts/**` and
    `.agents/skills/**`, tracked files only). For each scope it reports, with the file and line of every hit and a
    total per measure:
    - giant files: source files (`.js`, `.mjs`, `.ts`, `.css`, `.html`) over 800 lines, with their line counts;
    - type escapes in TypeScript: `any` used as a type, a cast through `unknown` to another type, `@ts-ignore` and
      `@ts-expect-error`;
    - suppressions: `biome-ignore` and `eslint-disable` comments;
    - repeated workarounds: `!important` in CSS, a `requestAnimationFrame` nested directly in another, a
      `setTimeout` with a zero or omitted delay, and `TODO`, `FIXME`, `HACK` or `workaround` markers in comments;
    - duplication: any run of at least 10 consecutive non-blank lines, compared after trimming whitespace, that occurs
      in two or more places across the scope;
    - boundary breaks in the concept: a shared file (named in `config.json`; today `app.js`, `style.css`,
      `motion.js`, `components.js` and `components.css`) that names an element id which only one page's HTML defines.
  - **Intent.** The coordinator sees where the code agents copy from is getting worse, with evidence to act on.
- **H2. Trend and unknowns.**
  - **Outcome.** Each total is shown beside the same total from the previous rolling report, or `no previous` when it
    has none, and the section says which report it compared with. A scope the survey cannot read (a missing branch,
    an unreadable object) is reported as `unknown` with its reason and never as zero; it does not block collection,
    and every other part of the survey keeps its present outcome.
  - **Intent.** A number is never shown without its baseline, and a missing reading never looks healthy.
- **H3. The skill's weight.**
  - **Outcome.** `.agents/skills/gardener/SKILL.md`'s fixed checklist gains a code-health class, report only: the
    pass proposes at most one improvement from it to the coordinator and never edits architecture itself. The pass
    procedure's order for its one bounded change becomes repeated correction, code health, drift, gate gaps, sediment,
    then obsolete rules. The folder, worktree and cleanup-script procedure moves, unchanged in meaning, out of
    `SKILL.md` into a reference file beside it that the skill points to and a pass reads only when it proposes a
    removal. `SKILL.md` ends shorter than its 198 lines today.
  - **Intent.** A pass spends its attention on the code agents copy; cleanup keeps every guard it has.
- **H4. Planted controls and proof.**
  - **Outcome.** Tests run by the fast ladder, each failing on `a798440e` and passing after, plant each measure of H1 in
    a fixture scope (one hit each, with its expected file and line) and a clean fixture that reports zero for all; a
    previous report with known totals gives the expected trend; a missing branch gives `unknown`. The survey from the
    gardener's own launcher (`.agents/skills/gardener/pass.ps1`) completes on this machine's real state with the new
    section, and its folder, branch and worktree proposals are identical to a survey of `a798440e` run on the same
    state. `node scripts/verify.mjs fast` passes on your committed, clean tree.
  - **Intent.** Each measure is shown to fail when its defect is planted, and nothing the survey did before changes.

## Scope

You may change `.agents/skills/gardener/**`; commit once when done. Everything else is read-only. Add no dependencies.
If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

For each outcome, PASS or FAIL, with the command and the output line that proves it. Then:
- the concept's and the tooling's totals per measure from the real survey;
- the files you changed;
- the commit SHA;
- anything you could not do.

At most 30 lines.
