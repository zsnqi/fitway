<!-- brief-format: v1 role: codex -->
# Codex brief: the verify-fitway gaps before Settings (owner-design-exploration-r04, vf-fixes)

- **Worktree:** `D:/Projects/fitway-worktrees/owner-r04-vf-fixes`, branch `owner-r04-vf-fixes`, HEAD `088711e0`
- **Milestone:** `owner-design-exploration-r04`. Decisions: `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` items 47, 48 and 52.
- **Read first, only these:**
  - `.agents/skills/verify-fitway/SKILL.md`, whole;
  - `.agents/skills/verify-fitway/runner.mjs` lines 40-124, 600-660 and 920-1010;
  - `.agents/skills/verify-fitway/drive.mjs` lines 1-60 and 180-330;
  - `.agents/skills/verify-fitway/map.mjs` lines 180-310;
  - `.agents/skills/verify-fitway/discover.mjs` lines 690-765;
  - `.agents/skills/verify-fitway/core.mjs` lines 340-445;
  - `docs/phase-records/handoffs/agent-environment/findings.tsv` rows F131, F132, F136, F149, F158, F161 and F164.

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

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Playwright, Node scripts that run git) fail inside it:
  request escalation for them from the first attempt, with a one-line justification. (DECISIONS item 7)
- **CI** runs the fast ladder on Windows without Playwright Chromium or ui-forensics (`.github/workflows/checks.yml`):
  every test you add passes there, so a proof that needs a real browser is a script in your temp folder, run and
  reported.
- **Your temp folder** is `D:/fitway-temp/owner-r04-vf-fixes/`. Your compares and drives run on ports 3186-3187 only;
  other rounds measure on 3188-3189 and 3176-3177, and 3174 and 3180 serve the user: never stop a process you did
  not start.
- **The concept** you measure is the Owner Eclipse folder at the build branch's `4352181f`
  (`D:/Projects/fitway-worktrees/owner-followup-r04-s04`, read-only), taken with your own `git archive`, extracted
  outside every git tree. Its recipes are the folder's `verification-recipes.json`; a recipe change you need for a
  measurement goes in a copy in your temp folder, passed with `--recipes`.

## Goal

The CLI measures what the recipes ask for under every input it supports: switches that act after an action or with a
companion, address-only features and navigating features under keyboard and touch, and a keyboard press; `SKILL.md`
says what the CLI does, held there by a test; and its runs leave nothing behind.

## Causes and required outcomes

- **V1. A switch whose effect shows after an action (F131).** Cause: `runner.mjs:107-124` and `:609-616` check every
  query key's state proof before the feature's first action, so a scenario switch (fail, hold, refuse, older, refresh,
  export) whose effect shows only after an action has a proof that reads its own query. Outcome: a recipe's state rule
  can have its proof checked after the feature's actions instead of before, and the CLI checks it there; an item whose
  state has no proof is still refused; every existing recipe gives the same items and verdicts. Measured on a recipes
  copy whose rules for those six switches use it: each proof reads the page, is checked after its action, and passes.
  Intent: a state proof reads the page.
- **V2. Address-only features under keyboard (F132).** Cause: `runner.mjs:634-642` throws `KeyboardReachError` for a
  keyboard item whose feature has no actions, so Reports' range and export dialogs, reached by their address alone,
  are KEYBOARD-UNREACHABLE. Outcome: under `--inputs keyboard` such a feature is captured and compared as under mouse;
  a feature with a pointer path and no keyboard path is still KEYBOARD-UNREACHABLE. Intent: KEYBOARD-UNREACHABLE
  names a pointer path a keyboard user cannot take.
- **V3. Companion switches (F136).** Cause: dependencies come only from a source scan (`discover.mjs:696-762`,
  `map.mjs:279-282`), so `--states all` captures `arrive` without `state=loading` and `from` without `to` alone, as
  capture problems on four pages. Outcome: a recipe can declare that a switch value needs a companion switch, and the
  CLI applies it exactly as a source-found dependency; declared and found dependencies that conflict are refused.
  Measured on a recipes copy declaring those pairs: `--states all` on Daily, Reports, Access and Activity reports none
  of those switches as a capture problem. Intent: what the scan cannot see, the recipe can say.
- **V4. A keyboard press shows (F149).** Cause: keyboard `activate`, `click` and `tap` press Enter (`drive.mjs:315`),
  which in Chromium clicks without `:active`, so no keyboard run shows a press. Outcome: under `--inputs keyboard`,
  activating a button shows its pressed state as a keyboard user's press does, and a link still activates as it does
  today. Measured: a copy of the concept with the press light's release 40 ms longer is DIFFERENT under
  `--inputs keyboard --timeline` on Reports' `period-7d` and `export-open`, as it is with the mouse, and the
  unchanged copy EQUAL. Intent: the keyboard path checks the press feedback every pressable control has.
- **V5. `SKILL.md` held to the CLI (F158).** Cause: `SKILL.md:255` says compare leaves language sheets, which
  `runner.mjs:978-981` stopped rendering for compares. Outcome: `SKILL.md` says what compare and drive render; a test
  fails when `SKILL.md` names an option, a port or pair, or an artifact a command writes that the CLI does not have,
  accept or write, and when an option the CLI's `--help` lists is not named in `SKILL.md`; it fails on the stale
  line put back. Intent: the guide cannot drift from the tool unnoticed.
- **V6. Nothing left behind (F161).** Cause: the lease root is fixed at `D:/fitway-verify-captures` (`core.mjs:356-357`)
  and release removes only the claim (`core.mjs:436-441`), so every test run leaves empty `.port-<port>-lease`
  folders. Outcome: the verify-fitway test files and a compare leave no file or folder they created in
  `D:/fitway-verify-captures` beyond the captures they keep; the folders left there by earlier runs outside the three pairs are removed once, by a
  command you report. Intent: the captures root holds only captures and live claims.
- **V7. Navigating features under touch and keyboard (F164).** Cause: nothing between an action and the next page
  read waits for a navigation (`runner.mjs`, `drive.mjs:192-200`), so `language`, `phone-language` and Access's
  `record-navigation` fail on both sides with "Execution context was destroyed" under touch and keyboard. Outcome:
  those features are captured and compared under touch and keyboard as under mouse, each item's feature proof (the
  page after the navigation) passing; measured with the concept against itself, every such item EQUAL in Arabic and
  English, desktop and phone. Intent: every input reaches every feature.

## Limits the result keeps

- **L1. Today's verdicts.** The vf-parallel full compare
  (`compare --page all --feature page --states all`, Arabic and English, desktop, tablet and phone, reduced and full
  motion, mouse, HTTP, `--baseline-cache off`, the concept against itself, 4 workers) gives the HEAD CLI's items and
  verdicts, every one; the same command with `--inputs keyboard,touch` changes only items of V2, V4 and V7, each listed
  with its HEAD and new verdict; `cli.test.mjs`, `compare-speed.test.mjs`, `compare-parallel.test.mjs` and `timeline-hold.test.mjs` keep
  every assertion.
- **L2. Only the tool.** Only `.agents/skills/verify-fitway/**` changes; the concept's files are read-only.
- **L3. The ladder and a clean tree.** `node scripts/verify.mjs fast` passes on your committed tree, and
  `git status --short` is empty after your commit and after the ladder.

## Scope

You may change files under `.agents/skills/verify-fitway/` (`SKILL.md` must change); commit once when done. Everything else is read-only. Add no dependencies. If an outcome cannot
be met, do not work around it: finish and measure the others, then stop and report. (B3)

## Report

Each outcome and limit as PASS or FAIL with the command and the output line that proves it; the recipe field V1 and V3
use; the items L1 lists as changed; the files you changed; the commit SHA; anything you could not do; any hook message
you did not act on.
