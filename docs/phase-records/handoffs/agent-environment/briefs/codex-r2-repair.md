# Codex brief: resume-point tooling repair (agent-environment-r01, round 2)

Work only in `D:/Projects/fitway-worktrees/agent-environment-r01` on branch `agent-environment-r01`, HEAD as
given to you. Round 1's brief is `docs/phase-records/handoffs/agent-environment/briefs/codex-r1-resume-tooling.md`;
its outcomes O1-O7 stay required.

## Environment

- You run without a sandbox, so you can run the tests and commit. Write only inside this worktree and the system
  temp folder. Do not push, fetch, switch branches, or touch other worktrees, `D:/Projects/fitway` or any global
  configuration.
- Use absolute paths. Run pnpm without `2>&1` in PowerShell. Write files as UTF-8 without a BOM and keep LF endings.
- If anything this brief names is missing or contradicts the code, stop and report it instead of guessing.

## Goal

`pnpm handoff:new` and the checks around it work as a coordinator uses them, and the script test suite is green.

## Causes and required outcomes

- **R1.** `scripts/agent-environment/new-handoff.mjs` takes the repository root from `process.cwd()`, so it fails
  when started from a folder below the root. Outcome: it works the same from any working directory inside the
  repository.
- **R2.** It writes `updatedAt`, `lastHeartbeatAt` and `leaseExpiresAt` as UTC with milliseconds, while the ledger
  uses local time with its offset, seconds precision (`2026-10-02T21:45:00+03:00`). Outcome: it writes that form,
  consistent with the "As of" line and the file name. Tests stay deterministic and pass in any machine time zone.
- **R3.** `pnpm check:repository` and `node scripts/check-agent-context.mjs` reject an untracked active handoff, but
  the printed next actions do not say to stage the new file. Outcome: the next actions read, in order: fill every
  section, `git add` the new file, `pnpm check:repository`, commit, push.
- **R4.** `scripts/check-agent-context.test.ts:621` expects `owner-design-exploration-r01` among the live ledger's
  active milestones; that milestone moved to `PROJECT_STATE_HISTORY.yaml` before this branch began, so the test
  fails everywhere. Outcome: the test checks the live repository without naming a milestone that is active only for
  a while, and keeps its other assertions.
- **R5.** `node scripts/run-vitest.mjs run scripts` (every script test), `node scripts/check-agent-context.mjs` and
  `node scripts/verify-repository.mjs` pass, and each run leaves `git status --short` as it found it.
- **R6.** One commit on `agent-environment-r01`, message ending in your own attribution line. Not pushed.

## Scope

You may change `scripts/agent-environment/**` and `scripts/check-agent-context.test.ts`. Everything else is
read-only, including `PROJECT_STATE.yaml`, packets, `docs/**`, `AGENTS.md` and `package.json`. Add no dependencies.
Format touched files with `pnpm biome check --write <files>`. If an outcome cannot be met, do not work around it:
finish and measure the others, then stop and report.

## Report

End with: each outcome R1-R6 and O1-O7 as PASS or FAIL with the command and the output line that proves it; the
files you changed; the commit SHA; anything you could not do.
