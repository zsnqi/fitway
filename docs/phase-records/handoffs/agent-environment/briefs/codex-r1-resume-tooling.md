# Codex brief: resume-point tooling (agent-environment-r01, round 1)

Work only in `D:/Projects/fitway-worktrees/agent-environment-r01` on branch `agent-environment-r01`.
Read first: `AGENTS.md` ("Startup route"), `docs/WORKFLOW.md` ("Handoff format") and
`docs/agent-context/HANDOFF_TEMPLATE.md`, which defines the resume-point format and its rules.

## Goal

A fresh agent session reaches its milestone's current resume point through the startup route, and
the coordinator writes the next resume point with one command. Every resume point is a new, short
file; nothing gets appended to an old one.

## Causes

1. `pnpm context:show -- --milestone <id>` fails on pnpm 11 with "Unknown argument: --", because
   pnpm forwards the `--` to the script.
2. Sessions read a handoff from a local branch that was behind its upstream and took an outdated
   section for the latest one.
3. Moving a milestone to a new handoff file means hand-editing `PROJECT_STATE.yaml`, the packet's
   `continuity.currentHandoff` and the packet hash, and renewing the lease. Coordinators avoided
   that and appended to one file until it reached 340 KB.
4. Nothing checks a resume point's size, sections, paths, or stale session ids.

## Required outcomes

- **O1.** `scripts/show-agent-context.mjs` accepts a leading `--` argument; both argument forms
  produce the same plan.
- **O2.** After its plan, context:show prints one warning line when the current branch has an
  upstream and is behind it, using the refs already fetched (no network access). It prints nothing
  when the branch is not behind or has no upstream.
- **O3.** When the milestone's handoff starts with the marker
  `<!-- handoff-format: resume-point-v1 -->`, context:show ends with a line telling the reader to
  read that file in full, then the standing-decisions files it names.
- **O4.** `pnpm handoff:new --milestone <id> --slug <run-id>` (a leading `--` also works):
  - creates `<dir>/<YYYYMMDD-HHMMSS>-<milestone-id>-<slug>.md`, where `<dir>` is the current
    handoff's directory unless `--dir <repo-relative dir>` is given, and refuses to overwrite;
  - fills it from the current handoff when that carries the marker, and otherwise from the block
    between `<!-- template:start -->` and `<!-- template:end -->` in `HANDOFF_TEMPLATE.md`;
    substitutes the milestone id, sets the "As of" line (branch, short HEAD, local time with its
    UTC offset) and sets the "Previous resume point" line to the old handoff's path;
  - points the milestone's `handoff` in `PROJECT_STATE.yaml` and the packet's
    `continuity.currentHandoff` at the new file, refreshes the milestone's `taskPacketSha256`,
    sets `lastHeartbeatAt` to now and `leaseExpiresAt` to now plus 72 hours (`--lease-hours <n>`
    overrides), and sets the top-level `updatedAt`;
  - changes no other byte of `PROJECT_STATE.yaml` or the packet;
  - does not commit; prints the new path, the next actions (fill every section, run
    `pnpm check:repository`, commit, push), and the O2 warning when behind;
  - accepts `--now <ISO-8601>` so tests are deterministic.
- **O5.** `scripts/verify-repository.mjs` validates the handoff of every active milestone whose
  file carries the marker, against the rules in `HANDOFF_TEMPLATE.md`: at most 12,288 bytes; the
  three header lines (As of, Previous resume point, Standing decisions) and the six `##` sections in
  the template's order; every backticked repository-relative file path exists (absolute paths and
  paths containing `<…>` placeholders are skipped); no `local_` session id. Handoffs without the
  marker are not checked, so existing handoffs keep passing.
- **O6.** Unit tests in the style of `scripts/show-agent-context.test.ts` cover O1-O5, including
  the failure cases, and pass with
  `node scripts/run-vitest.mjs run scripts/agent-environment scripts/show-agent-context.test.ts`.
  Tests build temporary fixtures; they never touch the real ledger.
- **O7.** `node scripts/check-agent-context.mjs`, `node scripts/verify-repository.mjs` and the
  existing script tests still pass, and `git status --short` shows only your intended changes.

## Scope and constraints

- You may change: `scripts/show-agent-context.mjs` and its test, `scripts/verify-repository.mjs`,
  new files under `scripts/agent-environment/`, and the `scripts` entries of `package.json`.
  Everything else is read-only, including `PROJECT_STATE.yaml`, packets, `docs/**` and `AGENTS.md`.
- Node ESM with the dependencies already installed (the `yaml` package is available); add none.
  Edit `PROJECT_STATE.yaml` and packets as text so untouched lines keep their exact bytes.
- Printed repository paths use forward slashes. Format touched files with
  `pnpm biome check --write <files>`.
- If an outcome cannot be met, do not work around it: finish and measure the others, then stop
  and report.
- Commit on the current branch if the sandbox allows it, with a message ending in your own
  attribution line; if it does not, leave the changes uncommitted and say so. Do not push.

## Report

End with: each outcome as PASS or FAIL with the command and the output line that proves it; the
files you changed; the commit SHA, or "uncommitted" with the reason; anything you could not do.
