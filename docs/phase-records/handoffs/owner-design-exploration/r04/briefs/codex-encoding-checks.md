<!-- brief-format: v1 role: codex -->
# Codex brief: checks that catch the mistakes we made twice, and a command that moves main only on green CI (owner-design-exploration-r04, encoding-checks)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-encoding-checks`, branch `owner-r04-encoding-checks`, HEAD `945c07b5`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 56, 57 and 62.
- **Read first, only these:**
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F129, F140 and F173;
  - `scripts/check-agent-context.test.ts` lines 600-640, and `scripts/check-agent-context.mjs` lines 600-735;
  - `scripts/agent-environment/check-brief.mjs` lines 780-875;
  - `docs/agent-context/briefs/codex.md` §"Scope" and §"Coordinator checklist (delete before launch)";
  - `CLAUDE.md` §"Repository-local Claude configuration";
  - `biome.json` and `.github/workflows/checks.yml`.

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
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows (`.github/workflows/checks.yml`): every test you add passes there. No test or
  check you run calls GitHub, pushes, or reads a credential; use stand-ins and local repositories in your temp folder.
- **Your temp folder** is `D:/fitway-temp/owner-r04-encoding-checks/`. Another round works in another worktree on
  this machine: start no preview, compare or Codex process of your own. If a verify-fitway test fails in the fast
  ladder, rerun that file alone once and report both runs; the coordinator's CI run on your commit decides L2.
- **A check is proven on its real mistake:** for each one, show it failing on the past state named in its cause, then
  passing on your result.

## Goal

The mistakes the project made twice are caught by checks instead of by memory, and `main` can move only to a commit
whose CI passed.

## Causes and required outcomes

- **C1. K1 pins the open milestones' names (F129).**
  - **Cause.** K1 (`scripts/check-agent-context.test.ts:608-636`) expects the ledger's open milestones by name, so the
    closures `79f3efd6` and `446bb9fa`, correct in every other check, failed CI.
  - **Outcome.** K1 passes on the repository as it stands at your result and on the ledger, history and packets as
    they were at `79f3efd6` and at `446bb9fa`, with no live milestone named in the test, its helpers or its fixtures:
    its expectation comes at run time from the packets, compared with the ledger; it still fails, by name, when an
    open milestone and the packets disagree (each kind of disagreement the checker rejects, one case each, on
    mutated copies).
  - **Intent.** Opening or closing a milestone correctly never needs the test edited; an inconsistent frontier still fails.
- **C2. `main` moved before CI was read (F129).**
  - **Cause.** Twice main was fast-forwarded to a commit whose CI run then failed (`79f3efd6`, then `0c09af23`).
  - **Outcome.** `pnpm main:advance <commit>` moves the remote `main` to the commit only when the commit is pushed,
    the remote `main` is its ancestor, no run of `.github/workflows/checks.yml` on exactly that SHA is queued or in
    progress, and the newest such run, whatever its status, completed with `success`, checked again just before the
    push; otherwise it refuses with the reason and pushes nothing. It never forces. `--dry-run`
    makes every check and pushes nothing. Tests prove each refusal and the move with a stand-in `gh` and local
    repositories.
  - **Intent.** The only way main moves cannot skip the CI result.
- **C3. A byte-order mark at a file's start (F140).**
  - **Cause.** `.impeccable/config.json` starts with a UTF-8 BOM, which Impeccable's hook rejects as malformed;
    nothing in the ladder notices one.
  - **Outcome.** `pnpm check:repository` fails on a tracked file that starts with a UTF-8 BOM, naming it, unless the
    file is on a list where each entry gives its reason; `.impeccable/config.json` loses its BOM, and the other tracked
    files that start with one today are listed, unchanged.
  - **Intent.** A new BOM fails CI the day it lands, and the known ones stay visible.
- **C4. A Codex brief without the B3 sentence.**
  - **Cause.** Five briefs on the build branch (`codex-motion-lows.md`, `codex-three-rounds-fix.md`,
    `codex-one-clock.md`, `codex-narrow-sheet.md`, `codex-variants-removal.md` in
    `design-research/owner-composition-exploration-r04/directions/briefs/` on `owner-followup-r04-build`) launched with
    a Scope that lacks B3's last sentence (`docs/agent-context/briefs/codex.md` §"Scope").
  - **Outcome.** `pnpm brief:check` fails a Codex brief that has no Scope section, more than one, or one whose final
    visible plain-text sentence (outside comments and code) is not that sentence, whatever its line breaks; each of
    the five fails on it, and every brief in `docs/phase-records/handoffs/owner-design-exploration/r04/briefs/` passes
    it.
  - **Intent.** No Codex brief launches without telling the agent to report an unmet outcome instead of working around it.
- **C5. `CLAUDE.md`'s agent table and the definitions.**
  - **Cause.** At `e86bc33e` the table listed `sonnet-researcher` and `sonnet-scout` with no tracked definition, and at
    `4d8e3f40` it listed a max-effort designer one commit before its definition.
  - **Outcome.** A check in the ladder fails when a definition the table names is not a tracked file in
    `.claude/agents/`, when a row's model or effort differs from its definition, or when a tracked definition outside
    Impeccable's has no row; it fails on both commits' `CLAUDE.md` and definitions and passes at your result.
  - **Intent.** A cloud session sees every agent the table promises, at the level it states.
- **C6. The brief's length warning (decision 57).**
  - **Cause.** `brief:check` warns above 80 lines (`check-brief.mjs:827-833`), which measured nothing about failures;
    the template's checklist lines B6, B8 and B13 were unwrapped to pass it.
  - **Outcome.** `brief:check` warns on no length and prints, for each brief, the number of outcome and limit IDs it
    asks for, counted from what reaches the agent; B6, B8 and B13 in `codex.md` wrap as the other checklist items do,
    their words unchanged.
  - **Intent.** The count is kept for later evidence, and no warning fires without one.
- **C7. An ignored file decides the local ladder (F173).**
  - **Cause.** Biome reads files git ignores (`biome.json` `vcs`), so a machine-local ignored file failed the local
    fast ladder while CI never sees it.
  - **Outcome.** A misformatted file git ignores changes no step of `node scripts/verify.mjs fast`; every tracked file
    Biome checked at the HEAD is still checked (report both counts).
  - **Intent.** The local ladder and CI judge the same files.

## Limits the result keeps

- **L1. Today's checks.** Every existing test keeps its assertions except K1's names and the length-warning
  expectations C6 replaces, and still runs: none skipped, excluded or made conditional, and the ladder runs at least
  as many tests as at the HEAD; every check that passes at the HEAD still passes.
- **L2. The ladder.** `node scripts/verify.mjs fast` passes on your committed tree, and `git status --short` is empty
  after your commit and after the ladder.
- **L3. Files outside the Scope** are unchanged, the BOM-listed files included.

## Scope

You may change `scripts/check-agent-context.mjs`, `scripts/check-agent-context.test.ts` (must change),
`scripts/verify-repository.mjs` (must change) and its tests, `scripts/agent-environment/check-brief.mjs` (must change),
`scripts/agent-environment/check-brief.test.ts`, `docs/agent-context/briefs/codex.md` (must change), `biome.json`,
`.impeccable/config.json` (its BOM only), and in `package.json` one new `main:advance` script entry; you may add
the command and its test under `scripts/agent-environment/`; commit once when done. Everything else is read-only.
Add no dependencies. If an outcome cannot be met, do not work around it: finish and measure the others, then stop
and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; for each check, its
failure on the past state and its pass on your result; the files you changed; the commit SHA; anything you could not
do; any hook message you did not act on.
