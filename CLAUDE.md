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
terminal states, decisions, or verification evidence there — active, unarchived work belongs in
`PROJECT_STATE.yaml`; once terminal, records are archived append-only in
`PROJECT_STATE_HISTORY.yaml`, and the phase records still preserve evidence. A memory entry
records only what was true when it was written; verify it against the repository before acting
on it.

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

A reviewing session judging Owner visual work applies ADR-009
(`docs/adr/ADR-009-owner-composition-authority-supersession.md`, per `AGENTS.md` item 4): the
superseded Owner Paper frames and canonicals are reference-only and cannot accept or reject a
redesign for differing from them.

Report findings as hypotheses with file and line evidence, and never repair what you review.

### Repository-local Claude configuration

`.claude/agents/` and `.claude/skills/` are tracked, because cloud sessions see only committed files.
- **`.claude/skills/`** holds copies of Impeccable (FITWAY's single design skill, Apache-2.0) and `ux-araby`
  (Arabic interface copy, MIT). They are unchanged apart from trailing whitespace; see
  `.claude/skills/SOURCES.md`.
- **`.claude/agents/`** holds Impeccable's shipped agents and the Owner-direction definitions.

Each Owner-direction definition fixes one effort level, and the coordinator picks by task:

| Definition | Effort | Use |
| --- | --- | --- |
| `owner-direction-designer` | `xhigh` | new visual design and taste judgment |
| `owner-direction-builder` | `high` | implementing an agreed, precisely specified decision |
| `owner-direction-verifier` | `xhigh` | independent verification |
| `owner-direction-verifier-high` | `high` | a narrow re-check with a frozen target, a known defect and ready probes |
| `owner-direction-fixer` | `medium` | a mechanical edit with a frozen target |

The rest of `.claude/` is untracked and differs between worktrees. Nothing in `.claude/` is normative. Where a
local skill or an agent definition disagrees with the root policy, the root policy and the files it names win.
