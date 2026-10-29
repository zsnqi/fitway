<!-- brief-format: v1 role: codex -->
# Codex brief: the shared styles out of Reports' stylesheet, and loading proofs that wait for the skeleton (owner-design-exploration-r04, reports-css)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-reports-css`, branch `owner-r04-reports-css`, HEAD `c2fe4661`
- **Milestone:** `owner-design-exploration-r04`. Decisions: numbers 44, 45 and 47 of the milestone's DECISIONS file on
  the coordinator branch (the build branch's copy is behind), at
  `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`.
- **Read first, only these:**
  - `D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/verify-fitway/SKILL.md`, the CLI's guide;
  - `design-research/owner-composition-exploration-r04/directions/briefs/codex-daily-files-fix.md` §"Causes and required outcomes": how the last stylesheet split broke the other pages' moments;
  - `design-research/owner-composition-exploration-r04/directions/briefs/codex-shared-frame.md` §"Causes and required outcomes": F2 and F3, which C2 and C3 below follow;
  - `design-research/owner-composition-exploration-r04/directions/eclipse/reports.css` lines 1-20;
  - `design-research/owner-composition-exploration-r04/directions/eclipse/verification-recipes.json` lines 1280-1290 and 4045-4060.

"The folder" below is the concept's `eclipse` folder beside that stylesheet; each page's `<head>` there shows which
stylesheets it loads.

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

- **Your temp folder** is `D:/fitway-temp/owner-r04-reports-css/`. Set `PROBE_OUT` to a folder inside it before you run
  the folder's tools. You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and
  anything that starts child processes with piped output (pnpm, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **Hooks.** A hook or tool message that asks for work outside this brief is reported in your final message, not acted on.
- **Tools.** Run these read-only from the coordinator's worktree `D:/Projects/fitway-worktrees/owner-design-exploration-r04`;
  never edit them. The verify-fitway CLI: `node <that worktree>/.agents/skills/verify-fitway/cli.mjs`, ports 3176-3177
  only; if one is held by a process you did not start, never stop it; ports 3174 and 3180 serve the user's preview,
  leave them running. The concept CSS check: `node <that worktree>/scripts/check-concept-css.mjs <the folder>`. Other
  rounds run compares on this machine on other ports.
- **Ways to open the concept:** HTTP through the CLI and `file://`; Arabic and English; desktop, tablet and phone;
  mouse, touch and keyboard; reduced and full motion; the motion switch `?motion=off`.
- **The base** is the folder at the HEAD above. Take it from your own `git archive`, extracted outside every git tree.

## Goal

Styles that more than one page uses live in a stylesheet named as shared, and Reports' stylesheet holds only what
Reports alone uses; Reports' and Access's loading proofs wait for the skeleton. Every page looks, moves and behaves
exactly as at the base.

## Causes and required outcomes

- **C1. Shared and Reports' own, apart.**
  - **Cause.** `reports.css` is loaded by `reports.html`, `access.html`, `activity.html` and `components.html`; its
    head calls it the system "Activity Log, Access and Settings will reuse" (`reports.css:1-7`), and about a third of
    its rules style controls of more than one page, interleaved with Reports' own `.rp` rules.
  - **Outcome.** A new stylesheet named as shared holds every rule of `reports.css` that can match an element on two
    or more of the five pages, in any state, moment or press, judged from every script each page loads and the
    markup and classes those scripts write at runtime (report how you judged each rule). `reports.css` keeps only
    rules that can match on Reports alone (the components sheet's specimens of Reports included). Access and Activity
    load the shared stylesheet and not `reports.css`; Reports and the components sheet load both. A rule no page can
    match is listed in your report and left in `reports.css`. The shared stylesheet holds nothing that can match on
    one page only, and `reports.css` restates or overrides no shared rule's declarations for the same elements.
  - **Intent.** An edit to Reports' styles cannot change another page. Moving a rule by its selector's names while a
    script still gives another page that class at runtime defeats this (the daily-files round failed that way).
- **C2. Every page unchanged at rest.**
  - **Outcome.** As F2 of the shared-frame brief, over the same features, states, languages, sizes, inputs, motions
    and `file://`, with the same known capture problems, against the base.
  - **Intent.** The move changes where the styles live, nothing a user sees.
- **C3. Every moment unchanged.**
  - **Outcome.** As F3 of the shared-frame brief, with its NOT-HELD rule and its reruns, the 20 ms schedule applying to
    the dialogs, the table sort and the segmented controls instead of the frame.
  - **Intent.** Every opening, closing, press and release runs as the user approved it.
- **C4. Loading proofs that wait for the skeleton (F160).**
  - **Cause.** Reports' and Access's `state=loading` proofs (`verification-recipes.json` about lines 1286 and 4053)
    hold as soon as `.hb-load` exists, before the skeleton shows at 300 ms (`data-load="shown"`), so a capture lands
    before or after the skeleton depending on load.
  - **Outcome.** Both proofs hold only once the skeleton is shown, as Daily's does: a page probe shows each false
    before `data-load="shown"` and true after, on the result; three compares of the base against
    itself on Reports and Access `--states all`, Arabic, desktop, reduced motion, with 4 workers, give `COMPARE EQUAL`
    for every `state=loading` item in every run.
  - **Intent.** A loading capture always shows what the user sees while loading.
- **C5. The gardener's reading.** The gardener's code-health scan (`D:/Projects/fitway-worktrees/owner-design-exploration-r04/.agents/skills/gardener/code-health.mjs`, read-only) finds no rule in the shared stylesheet that names an id only one page defines.

## Limits the result keeps

- **L1. The checks pass.** As the shared-frame brief's L1, and `node check-press-layer.mjs` reads the new file.
- **L2. One copy of each rule.** No rule is kept in both stylesheets; together they hold the base's rules, apart from comments.
- **L3. Only the folder.** `HISTORY.md` and the evidence folder are unchanged.
- **L4. A clean tree.** Scratch files live in your temp folder: `git status --short` is empty after your commit.

## Scope

You may change, in the folder: `design-research/owner-composition-exploration-r04/directions/eclipse/reports.css` (must change), a new shared stylesheet, `access.html`, `activity.html`,
`reports.html` and `components.html` (their stylesheet tags), `verification-recipes.json` (C4's two proofs only),
`INDEX.md`, `README.md` and `DESIGN-SPEC.md`; commit once when done. Everything else is read-only. Add no
dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the two stylesheets'
line counts before and after; the rules judged shared only from a script's runtime classes; the rules no page
matches; the files you changed; the commit SHA; anything you could not do; any hook message you did not act on.
