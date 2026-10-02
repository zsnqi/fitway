# Codex brief: quieter tooling and CI (agent-environment-r01, round 3)

Work only in `D:/Projects/fitway-worktrees/agent-environment-r01` on branch `agent-environment-r01`, HEAD as
given to you.

## Environment

- You run in the workspace-write sandbox with automatic approval review. `git add`, `git commit` and anything that
  starts child processes with piped output (pnpm, Vitest, Node scripts that run git) fail inside it: request
  escalation for them from the first attempt, with a one-line justification.
- Write only inside this worktree and the system temp folder. Do not push, fetch, switch branches, or touch other
  worktrees, `D:/Projects/fitway` or any global configuration.
- Use absolute paths. Run pnpm without `2>&1` in PowerShell. Write files as UTF-8 without a BOM and keep LF endings.
- If anything this brief names is missing or contradicts the code, stop and report it instead of guessing.

## Goal

Routine commands print only what needs attention, untracked tool state stays out of `git status`, and the
repository checks run on every push.

## Causes and required outcomes

- **Q1.** `lefthook.yml`'s pre-commit hook prints a banner, skipped jobs and a summary on every commit. Outcome: a
  passing commit prints nothing from lefthook; a failing job still prints its output and blocks the commit.
- **Q2.** `.gitignore` ignores `.impeccable/*` only at the repository root, so a design folder's
  `.impeccable/hook.cache.json` shows as untracked; the Codex app's `.codex-remote-attachments/` shows too.
  Outcome: Impeccable state is ignored at any depth while every `.impeccable/config.json` stays trackable, and
  `.codex-remote-attachments/` is ignored. No tracked file becomes ignored (`git ls-files -ci --exclude-standard`
  stays empty).
- **Q3.** `node scripts/check-agent-context.mjs` and `node scripts/verify-repository.mjs` each print 20 "historical
  pointer exception admitted" warnings on every run. Outcome: on success they print one line with the count of
  admitted exceptions; `--verbose` lists them; every other warning and every error prints as before.
- **Q4.** Nothing runs the checks on push. Outcome: `.github/workflows/checks.yml` runs on push and pull request, on
  `windows-latest` with the Node and pnpm versions the repository pins, after `pnpm install --frozen-lockfile`:
  `pnpm biome ci .` (or the repository's equivalent check), `node scripts/check-agent-context.mjs`,
  `node scripts/verify-repository.mjs`, and `node scripts/run-vitest.mjs run scripts`. Read the scripts first: a step
  that cannot pass on a clean CI checkout (for example one that needs a local `.env` or a database) is left out and
  named in your report.
- **Q5.** `node scripts/run-vitest.mjs run scripts`, both checkers and `pnpm biome check .` pass locally, and each run
  leaves `git status --short` as it found it. Run the full suite again after your commit: the live test in
  `scripts/check-frontier-preservation.test.ts` passes only on a clean tree.
- **Q6.** One commit on `agent-environment-r01`, message ending in your own attribution line. Not pushed.

## Scope

You may change `lefthook.yml`, `.gitignore`, `.github/workflows/**`, `scripts/check-agent-context.mjs`,
`scripts/check-agent-context.test.ts`, `scripts/verify-repository.mjs`, `scripts/verify-repository.schema.test.ts` and
`scripts/agent-environment/**`. Everything else is read-only. Add no dependencies. If an outcome cannot be met, do
not work around it: finish and measure the others, then stop and report.

## Report

End with: each outcome Q1-Q6 as PASS or FAIL with the command and the output line that proves it; the files you
changed; the commit SHA; anything you could not do.
