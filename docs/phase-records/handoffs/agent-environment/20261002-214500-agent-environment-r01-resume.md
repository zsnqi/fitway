<!-- handoff-format: resume-point-v1 -->
# agent-environment-r01: resume point

- **As of:** `agent-environment-r01` at `3b91b9d`; ledger on `codex/owner-redesign-r04`, 2026-10-02 21:45 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/agent-environment/20261002-204000-agent-environment-r01-activation.md` (history; it holds the retrospective's findings)
- **Standing decisions:** `docs/phase-records/handoffs/agent-environment/DECISIONS.md`, `docs/agent-context/WORKING_AGREEMENTS.md`

## State

- On `agent-environment-r01` (not yet merged anywhere):
  - `47361ab`, `7f01cc7`: `docs/agent-context/HANDOFF_TEMPLATE.md`, `docs/agent-context/WORKING_AGREEMENTS.md`, the
    startup route in `AGENTS.md` and `docs/WORKFLOW.md` (git fetch, the context:show form without `--`, "read the
    handoff it prints in full"), and the Codex brief `briefs/codex-r1-resume-tooling.md` in this folder.
  - `3b91b9d`: Codex round 1's code, **unverified**: `pnpm handoff:new`, resume-point checks in
    `scripts/verify-repository.mjs`, context:show accepting `--` with a behind-upstream warning and a closing
    resume line, and unit tests under `scripts/agent-environment/`. Codex proved only O1 (both argument forms give
    the same plan). Its sandbox blocked the tests (`spawn EPERM`) and every git write (`index.lock: Permission
    denied`), so the coordinator committed its work as-is.
- On `codex/owner-redesign-r04`: owner-design-exploration-r04 now uses resume points (`e86bc33`); `CLAUDE.md` has
  the effort-first model guidance and the `sonnet-researcher` and `sonnet-scout` definitions are tracked
  (`b3c3bac`).
- `owner-followup-r04-build` carries the coordinator's authority documents (`4b8a5ff`).

## Running now

Nothing.

## Next steps

1. **Codex's sandbox** (DECISIONS.md item 7). Find the Codex settings (in `C:/Users/Pc Force/.codex/config.toml`,
   currently `[windows] sandbox = "unelevated"`) that let a Codex task in a linked worktree write that worktree's
   git metadata under `D:/Projects/fitway/.git/worktrees/<name>/` and run `node scripts/run-vitest.mjs`. Show the
   user the exact change and wait for the answer before applying it; then prove it with a small Codex task.
2. **Verify Codex round 1.** In the environment worktree run
   `node scripts/run-vitest.mjs run scripts/agent-environment scripts/show-agent-context.test.ts`, then have a fresh
   `sonnet-researcher` run the held-out checks in `D:/fitway-grader/agent-environment/codex-r1-heldout.md`. Never put
   that path or its checks in a Codex brief. Record brief rows passed, held-out rows passed and the failure cause;
   repair through Codex with a focused brief (at most two repair rounds).
3. **`pnpm brief:check` and the four brief templates** (DECISIONS.md item 6), in `scripts/agent-environment/` and
   `docs/agent-context/briefs/`.
4. **Quieter tooling:** lefthook prints only failures, `.impeccable/` goes into `.gitignore`, and a CI workflow runs
   Biome, check:repository, check:agent-context and the script unit tests.
5. **Close the milestone:** independent verification against the packet's acceptance criteria; merge
   `agent-environment-r01` into `codex/owner-redesign-r04` and `owner-followup-r04-build`; then the acceptance test:
   a new session that receives only "كمّل". After the merge, delete the duplicate `sonnet-*` definitions in
   `C:/Users/Pc Force/.claude/agents/`.
6. **Usage panel mod** (DECISIONS.md item 8), once the desktop app runs Claude Code 2.1.287 or later (it ran 2.1.286
   on 2026-10-02). `$.session.usage()` returns `context` (`tokens`, `window`, `percent`) and `rateLimits`
   (`kind` `five_hour` or `seven_day`, `percentUsed`, `resetsAt`) at no token cost; the `session.measure` event
   fires when they move. Docs: `https://code.claude.com/docs/en/plugins/mods/reference`.
7. **Evaluation loop** (DECISIONS.md item 9).

## Waiting on the user

- The Codex sandbox settings change in step 1, once it is drafted.

## Known risks

- Until step 5 merges, `codex/owner-redesign-r04` still has the old `AGENTS.md`: it does not send a session to the
  resume point, and its `pnpm context:show -- --milestone` form fails on pnpm 11 (drop the `--`).
- Two milestones are active; a coordinator resuming without a named one reads both resume points.
- One writer per worktree: do not commit in a worktree while Codex works there.
- Waiting on Codex: launch `codex-companion.mjs task` without `--background` inside a harness background shell, so
  the harness reports the exit. Polling `status <job>` is unreliable: it found the job only from PowerShell in the
  job's `--cwd` worktree, and a Git Bash watcher that treated "no job found" as "still running" reported Codex's
  20:56 finish 36 minutes late.

## Pointers

- Environment worktree: `D:/Projects/fitway-worktrees/agent-environment-r01`, branch `agent-environment-r01`, expected HEAD `3b91b9d`.
- Coordinator worktree: `D:/Projects/fitway-worktrees/owner-design-exploration-r04`, branch `codex/owner-redesign-r04`.
- Codex plugin script: `C:/Users/Pc Force/.claude/plugins/cache/openai-codex/codex/1.0.6/scripts/codex-companion.mjs`.
- Codex round 1 log: `D:/fitway-temp/codex-companion/agent-environment-r01-3752c7b43b4b7289/jobs/task-mur8qqzz-9yhvme.log`.
- Packet: `docs/phase-records/task-packets/agent-environment-r01.yaml`.
