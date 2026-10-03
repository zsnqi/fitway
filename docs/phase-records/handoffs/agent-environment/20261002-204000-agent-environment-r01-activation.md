# agent-environment-r01: activation and resume point

- **As of:** activation on `codex/owner-redesign-r04`, base `ad49c8a`, 2026-10-02.
- **Milestone:** `agent-environment-r01` (repository-infrastructure), packet
  `docs/phase-records/task-packets/agent-environment-r01.yaml`.

## Authorization

On 2026-10-02 the user reviewed a retrospective over the ten preceding Claude sessions and approved
every proposal in it, delegating the environment decisions to the coordinator. The user asked that
a fresh session reach the current state from a single "continue" message, that standing decisions
stop being copied forward, and that agents read the smallest context that is still sufficient for
their task.

The retrospective found, with log evidence:
- briefs sent agents to sections that did not exist in their build worktree, and one agent carried
  on without them;
- the resume point was the last section of a 340 KB append-only log, so superseded steps, stale
  session ids and copied-forward working rules were read as current;
- the documented `pnpm context:show -- --milestone <id>` form fails under pnpm 11.9;
- subagents without an `effort:` in their definition inherited the session's xhigh effort;
- every commit printed a multi-kilobyte lefthook banner, and the repository had no CI.

## State

- Phase 0 done: `owner-followup-r04-build` received the coordinator's authority documents
  (merge `4b8a5ff`), and check:repository passed on it.
- This milestone is open; no script or policy file has changed yet.

## Running now

Nothing.

## Next steps

1. Resume system: snapshot template, a single standing-decisions file, `pnpm handoff:new`, and the
   check:repository rules; then move owner-design-exploration-r04 onto it.
2. Startup fixes: accept `--` in context:show, warn when the branch is behind its upstream, add the
   resume pointer to the startup route in AGENTS.md and docs/WORKFLOW.md.
3. `pnpm brief:check` and brief templates for designer, builder, verifier and Codex rounds.
4. lefthook output, `.impeccable/` in .gitignore, and a CI workflow.
5. Independent verification, then a fresh-session test that receives only "كمّل".

## Waiting on the user

Nothing.

## Pointers

- Worktree for this milestone: `D:/Projects/fitway-worktrees/agent-environment-r01`, branch
  `agent-environment-r01`.
- Owner work continues in parallel under `owner-design-exploration-r04`.
