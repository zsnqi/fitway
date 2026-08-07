@AGENTS.md

## Claude Code

The policy imported above is the single root policy for every agent on this repository. Codex
discovers it directly; Claude reaches it through the import on line 1. Never copy its content
down here. Add only what is specific to Claude Code's own mechanisms — everything else lives
where that policy says it lives, and `docs/WORKFLOW.md` is the procedure for both tools.

### Auto memory is not project truth

Claude's auto memory is machine-local and untracked. Codex cannot see it, other machines cannot
see it, and it is never a source of truth or a handoff channel. Keep it to durable facts that are
expensive to reconstruct. Never write session reasoning, implementation state, task status,
terminal states, decisions, or verification evidence there — those belong in `PROJECT_STATE.yaml`
and the phase records. A memory entry records only what was true when it was written; verify it
against the repository before acting on it.

### Independent review

`docs/WORKFLOW.md` defines what a verifier receives and requires that it exclude the implementer's
reasoning. Two channels unique to Claude can reintroduce that reasoning, and the reviewing session
must close both:

- Auto memory loads into every fresh session in this repository, including a review session.
  Treat any recalled memory as an unverified claim by a previous author, not as evidence.
- Do not read the implementer's handoff rationale, and do not resume or fork the implementing
  session, until you have formed and recorded your own assessment from the diff, the specification,
  the surrounding code, and the verification commands. Read it afterwards to check for a
  constraint you missed — independence is not permission to ignore product reality.

Report findings as hypotheses with file and line evidence, and never repair what you review.

### Repository-local Claude configuration

`.claude/` here is untracked and differs between worktrees, so nothing in it is normative. Where a
local skill and the root policy disagree, the root policy and the files it names win.
