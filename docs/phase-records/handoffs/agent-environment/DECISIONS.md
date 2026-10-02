# agent-environment-r01: decisions in force

Decisions for the agent-environment work. Edit an entry in place when it changes. Decisions are the user's unless
marked "coordinator". Agreements on how the user and agents work are in `docs/agent-context/WORKING_AGREEMENTS.md`.

1. **Scope (2026-10-02).** The user approved every proposal of the 2026-10-02 retrospective and left the environment
   decisions to the coordinator; the user's settings and security stay the user's to approve.
2. **Resume points (2026-10-02).** A fresh session reaches the current state from "كمّل" alone. Each resume point is
   a new short file from `docs/agent-context/HANDOFF_TEMPLATE.md`; standing decisions live in one file per
   milestone, edited in place; the 340 KB r04 activation log is frozen history.
3. **The least sufficient context (2026-10-02).** Agents read the smallest context that is still enough for the
   task. Two conditions keep it from becoming missing context: everything a brief cites exists and is current in
   the agent's worktree, and an agent that finds a gap stops and reports it instead of guessing.
4. **Large files are never blocked (2026-10-02).** Navigation is fixed at the cause (indexes, briefs with line
   anchors, split files); at most a warning, measured first.
5. **Effort (2026-10-02).** Subagents get their effort from definitions and `CLAUDE.md`; no mod or hook enforces it.
   The transcript's `effort` field allows spot audits.
6. **Brief templates (2026-10-02, coordinator design the user asked for).** Four short templates (designer,
   builder, verifier, Codex), about 40 lines each: a shared environment block of about ten lines (absolute paths,
   Monitor instead of sleep, Read before Edit, no BOM, the report returned as text, stop and report any gap);
   fields filled with pointers only (worktree and HEAD, `path §section`, decision and spec row numbers); and a
   role part (goal, cause and outcomes for builder and Codex; the open question and constraints only for the
   designer; the checklist for the verifier). Each rule carries its origin; a rule unused for a while is reviewed
   and removed. `pnpm brief:check` runs before every launch. Template changes go through the evaluation loop.
7. **Codex runs without its sandbox on FITWAY (2026-10-02).** Codex has to run the unit tests and commit in linked
   worktrees. Its Windows sandbox cannot do either, whatever the settings: it puts persistent DENY entries on
   `D:/Projects/fitway/.git`, which every linked worktree's git dir inherits and `writable_roots` does not lift; and
   a Node child process with piped stdio fails with `spawn EPERM` (openai/codex#47868, #45697), which breaks git
   inside Node and Vitest. The user chose full access per FITWAY round: the coordinator launches
   `codex exec -s danger-full-access` from a tracked brief (command in `WORKING_AGREEMENTS.md`); `config.toml` stays
   unchanged. Each brief forbids pushing and writing outside its worktree, and after the round the coordinator checks
   the diff, `git status` in every worktree involved, and the remote branch.
8. **Usage panel (2026-10-02).** A Claude Code mod shows the subscription limits as its main element: the five-hour
   window with its reset time, and the weekly limit. The context window is a separate element with a different
   look from Anthropic's `token-weather` sample; its appearance changes at thresholds. Be inventive. The user
   updates the desktop app (mods need Claude Code 2.1.287 or later) once the current work is done.
9. **Evaluation loop (2026-10-02).** The method of Anthropic's "Automating eval design and hillclimbing" applies to
   Codex's brief template, the verifier (planted defects) and Sonnet `medium` against `high`; taste and design
   quality stay with the user.
