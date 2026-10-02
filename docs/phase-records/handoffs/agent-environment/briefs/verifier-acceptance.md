<!-- brief-format: v1 role: verifier -->
# Verifier brief: agent-environment-r01 acceptance (agent-environment-r01)

For a fresh `owner-direction-verifier-high` (Opus, high). Verify independently: do not read the implementer's
rationale or handoff before recording your own result, and never edit what you verify. (CLAUDE.md)

- **Worktree:** `D:/Projects/fitway-worktrees/agent-environment-r01`, branch `agent-environment-r01`, HEAD `8a1b35f`
- **Milestone:** `agent-environment-r01`. Decisions: `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/handoffs/agent-environment/DECISIONS.md` items 2, 3, 4 and 6.
- **Read first, only these:** `D:/Projects/fitway-worktrees/owner-design-exploration-r04/docs/phase-records/task-packets/agent-environment-r01.yaml`
  (keys `task.acceptanceCriteria`, `task.explicitExclusions`, `scope` and `verification`); `docs/agent-context/HANDOFF_TEMPLATE.md`.

<!-- environment:start v1 -->
## Environment

- Work only in the worktree and branch named above, and in `D:/fitway-temp/<run>/`. Never push, fetch, switch
  branches, or touch other worktrees or global configuration. (AGENTS.md, one writer per worktree)
- Use absolute paths; the shell's working directory resets between calls. (2026-10-02 retrospective)
- Wait on long jobs with Monitor or a background shell, never `sleep` or `Start-Sleep`. (2026-10-02 retrospective)
- Read a file before editing it. Write UTF-8 without a BOM and keep the file's line endings. (2026-10-02 retrospective)
- In PowerShell run pnpm without `2>&1`. Run Playwright from PowerShell: Git Bash rewrites `/api` paths. (2026-09)
- Drive C is full: keep temp output on D:, and set `TEMP`/`TMP` to `D:/fitway-temp` for a command that writes much. (2026-09)
- If a source this brief names is missing, stale, or contradicts what you find, stop and report the gap instead of
  guessing. (agent-environment DECISIONS item 3)
- Return your report as your final message, not as a file. (2026-10-02 retrospective)
<!-- environment:end -->

- Write only in `D:/fitway-temp/env-acceptance/`; the coordinator checks `git status` in every worktree afterwards. (r04 G5)
- To test against another worktree's state, make a detached copy under that folder with `git worktree add --detach`
  and remove it with `git worktree remove` before you report.

## What was delivered

Branch `agent-environment-r01`, commits from `ad49c8a` to `8a1b35f`, for the packet above. Codex rounds 1-7 and
coordinator commits; CI run 37069750244 on GitHub passed at `4d5d2f3`. Criterion 1 (a fresh session given only
"كمّل") is run by the coordinator after integration and is not in this checklist.

## Checklist

| ID | Check | Evidence required |
|---|---|---|
| A1 | Only the packet's owned paths changed; none of its forbidden paths or exclusions | `git diff --stat ad49c8a 8a1b35f`, mapped to `scope` |
| A2 | Criterion 2: the template's fixed headings and 12 KB limit are enforced; the decisions and working-agreements files exist and are pointed to | a resume point that breaks each rule, and the error each produces |
| A3 | Criterion 3: `pnpm handoff:new` creates the next resume point and updates the state pointer, packet hash and lease; `check:repository` rejects an oversized or incomplete resume point, a missing absolute path, and a `local_` session id | run it in a detached copy; the diff it makes; each rejection's message |
| A4 | Criterion 4: `pnpm context:show -- --milestone <id>` works, and a branch behind its upstream gets a warning | command output in each case |
| A5 | Criterion 5: `pnpm brief:check` fails on a missing path and on a missing `§` heading in the named worktree; the four templates exist and pass | command output for each |
| A6 | Criterion 6: lefthook prints only failures; `.impeccable/` is ignored at any depth; `.github/workflows/checks.yml` runs Biome, check:repository, check:agent-context and the script tests | a passing and a failing commit hook's output; `git check-ignore`; the workflow steps |
| A7 | The verification gates pass: script tests, check:repository, check:agent-context, Biome; `git status --short` unchanged by the runs | command and summary line for each |

## Report

The table with PASS, FAIL or NOT RUN and one line of evidence each; for each FAIL a hypothesis with `file:line`;
what you could not run and why. At most 50 lines.
