# Working agreements

How the user and the agents work together on FITWAY, across milestones. This file holds only the
agreements in force. Edit an entry in place when the user revises it, and keep the date of the
latest wording; never copy an entry into a resume point.

## Starting a task

- Before a new task that spends real usage (designer, builder or verifier agents, a Codex round)
  or changes what the user will see, the coordinator states in two or three lines what it will do
  and why, then starts at once. The user interrupts when it is not what they want. (user,
  2026-10-02)
- The coordinator waits for an answer only for a taste or direction choice, or when the request
  itself is unclear. It asks all open questions together in one message. (user, 2026-10-02)
- Inside a task the user has seen announced, process, tooling and ordering are the coordinator's
  decisions; it reports them at the end. (user, 2026-10-02)

## Sessions and resuming

- The coordinator's own context stays small: fresh agents do the reading and building, and the
  coordinator reads their reports and the key frames. (user, 2026-10-02)
- When the coordinator's context grows, the user asks it to record a resume point
  (`docs/agent-context/HANDOFF_TEMPLATE.md`). The next session starts from the user's "كمّل"
  alone. (user, 2026-10-02)
- Reply in Saudi-dialect Arabic when the user writes Arabic; code, paths, commit messages and
  repository documents stay in English. (user)

## Delegation

- Visual design and taste judgments stay with Claude on the Opus definitions. Exact renders of
  every option go to the user for picks. (user, 2026-10-02)
- Codex takes frozen fixes and edits, at the reasoning level the user set (xhigh as of
  2026-10-02). The coordinator runs it directly through the installed Codex plugin
  (`codex-companion.mjs task --write --cwd <worktree> --prompt-file <brief> --effort <level>`,
  as a background job) from a tracked brief file. Each Codex round is judged as an evaluation:
  brief rows, held-out rows kept out of Codex's reach, and the failure cause; the brief rules
  live with the milestone's standing decisions. (user, 2026-10-02)
- Every subagent is launched from a definition with a fixed effort; `CLAUDE.md` gives the choice
  between the Opus and Sonnet definitions. (user, 2026-10-02)
