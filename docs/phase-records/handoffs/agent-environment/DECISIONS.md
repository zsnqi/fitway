# agent-environment: decisions in force

Decisions for the agent-environment work. Edit an entry in place when it changes. Decisions are the user's unless
marked "coordinator". Agreements on how the user and agents work are in `docs/agent-context/WORKING_AGREEMENTS.md`.

1. **Scope (2026-10-02).** The user approved every proposal of the 2026-10-02 retrospective and left the environment
   decisions to the coordinator; the user's settings and security stay the user's to approve.
2. **Resume points (2026-10-02).** A fresh session reaches the current state from "كمّل" alone. Each milestone's
   resume point is one short file (item 10); standing decisions live in one file per milestone, edited in place; the
   340 KB r04 activation log is frozen history.
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
7. **Codex runs in its sandbox with automatic approval review (2026-10-02).** Codex has to run the unit tests and
   commit in linked worktrees. Its Windows sandbox alone cannot do either, whatever the settings: it puts persistent
   DENY entries on `D:/Projects/fitway/.git`, which every linked worktree's git dir inherits and `writable_roots`
   does not lift; and a Node child process with piped stdio fails with `spawn EPERM` (openai/codex#47868, #45697),
   which breaks git inside Node and Vitest. The user first chose full access per round, then asked for
   `--approve-for-me`. In a test that day Codex asked to escalate the commit and the piped child processes, the
   reviewer approved both, and both succeeded outside the sandbox. FITWAY rounds therefore run
   `codex exec --approve-for-me` (command in `WORKING_AGREEMENTS.md`): everything else stays in the workspace-write
   sandbox, and each escalation is reviewed for exfiltration, credential probing, security weakening and destructive
   actions. `-s danger-full-access` is the fallback for a round the reviewer blocks. `config.toml` stays unchanged.
   Each brief forbids pushing and writing outside its worktree; the coordinator's check after a round is in
   `WORKING_AGREEMENTS.md`.
8. **Usage panel (2026-10-02).** A Claude Code mod shows the subscription limits as its main element: the five-hour
   window with its reset time, and the weekly limit. The context window is a separate element with a different
   look from Anthropic's `token-weather` sample; its appearance changes at thresholds. Be inventive. Built
   2026-10-03 as `usage-panel` (coordinator design) in `C:/Users/Pc Force/.claude/mods/usage-panel`; the engine
   API it needs (`$.session.usage()`, `session.measure`) is already in 2.1.286, so no newer version was needed. The
   user declined the session's hot-reload question, then approved loading it through `CLAUDE_CODE_PLUGIN_DIRS` in
   `~/.claude/settings.json` (2026-10-03).
9. **Evaluation loop (2026-10-02).** The method of Anthropic's "Automating eval design and hillclimbing" applies to
   Codex's brief template, the verifier (planted defects) and Sonnet `medium` against `high`; taste and design
   quality stay with the user.
10. **Resume-point name (2026-10-03, coordinator; revised 2026-10-07).** Each milestone resumes from one file,
    `<milestone-id>-resume.md`, which `handoff:new` creates once and later refreshes in place; git history is the
    chain. Older timestamped handoffs keep their names and pass as before.
11. **Sonnet definitions (2026-10-03).** The user keeps both copies: the global ones in `~/.claude/agents/` serve
    every project, and the tracked ones in `.claude/agents/` serve cloud sessions, which see only committed files.
12. **The environment phase (the user, 2026-10-07).** The user widened the coordinator's mandate for this phase: old
    rules, workflows, tools and records are not constraints to keep when they prove stale, conflicting, wasteful or in
    the way of a cleaner environment; the coordinator may reorganize, replace, move ownership, remove or merge
    duplicated tools, and change CI, the brief workflow and the work records when that is the right fix («الهدف في هذه
    المرحلة هو تنظيف وتبسيط وتحسين بيئة العمل نفسها»). Locked product, security, privacy, content, accessibility,
    visual-authority and data-semantic decisions stay in force (AGENTS.md). agent-environment-r03 opens for it, from
    main at cf7758eb.
13. **What the phase delivers (coordinator, 2026-10-07).**
    - An audit of every rule, workflow, tool, check, record type and machine resource, each kept, merged, replaced or
      removed on cited evidence, saved before the first removal.
    - The tooling round of owner-design-exploration-r04 DECISIONS item 40: a verify-fitway skill both tools read, a
      feature map of the Owner concept generated from its code and spec, a verification CLI on the Eclipse probe kit
      and ui-forensics, a no-store preview, one command that launches a Codex round, and the B8 and B9 brief fields
      through the evaluation loop. pstack's create-verification-skill and maintain-verification-skill are tried.
    - The two checker faults of the r04 resume point of 2026-10-07: resume-point paths and branch names judged
      against what the CI checkout has, and a lease check that does not fail a branch only because the wall clock
      passed a lease it carries.
    - A permanent gardener (item 16).
14. **Ownership (coordinator, 2026-10-07).** agent-environment-r03 owns the environment: AGENTS.md, CLAUDE.md,
    .claude/agents/**, .claude/skills/**, .agents/**, docs/WORKFLOW.md, docs/agent-context/**, docs/schemas/**, the
    repository's check, ledger and test-runner scripts, .github/workflows/**, lefthook.yml, biome.json and the scripts
    section of package.json. It absorbs agent-environment-r02, whose work is all on main (by patch): every path but
    its packet moves here, with its open items (C4, C5, C2d, the closing review); r02 closes once the records can
    express a closure by succession (r03 acceptance criterion 3). CLAUDE.md, .claude/agents/**, .claude/skills/** and
    biome.json move from owner-design-exploration-r04, which keeps the Owner concept and its records. Both sides say
    so in their packets and forbiddenPaths, because no check compares owned paths across milestones.
15. **Where the tools live and what they drive (coordinator, 2026-10-07).**
    - The verify-fitway skill is committed at .agents/skills/verify-fitway/, where Codex finds repository skills;
      .claude/skills/verify-fitway/SKILL.md points Claude to it, so the content has one copy.
    - ui-forensics stays the user's machine-level skill (1.1.0 since 2026-10-07): the CLI uses it on this machine, and
      the skill's doctor reports when it is missing; cloud sessions cannot run the browser verification.
    - The live Owner concept is the Eclipse build on owner-followup-r04-build, 134 commits ahead of main, which holds
      an early Eclipse and no probe kit. Until the user approves the build, the skill, the CLI and the feature map
      take the Eclipse folder as an input and run against the build's; nothing from the build is copied to main.
16. **A permanent gardener (the user asked, 2026-10-07; coordinator design).** None existed: maintain-verification-skill
    keeps only the verification map honest, and CI only blocks regressions in rules already encoded. The phase
    builds a gardener that keeps the environment clean after it:
    - a skill both tools read, with a fixed checklist: a correction seen twice becomes a lint, test, check or template
      field (or a recorded reason why not); drift between docs, maps, indexes and code; sediment (dead files and
      scripts, duplicate tools, stale handoffs, branches, worktrees and temp folders); gate gaps (checks that run
      only locally, twice, or never fail); rules nothing needs any more;
    - a weekly schedule, plus a pass when a milestone closes and when a review repeats a known finding class;
    - each pass gives one report and at most one bounded, verified change, or says the environment is clean;
      removals of policy go to the coordinator; it never touches product semantics, design decisions or evidence a
      record points to.
17. **Records and evidence (coordinator, 2026-10-07, under item 12).**
    - The records keep only what a reader or a check uses (r03 Codex round 2): a milestone a successor carries closes
      as `SUPERSEDED` with `supersededBy`; no heartbeat, lease expiry or packet pin is kept or read; a milestone's
      scope, base and handoff live in the ledger and its task class in the packet; closing is one commit that moves
      the record, with no receipt; closed records are checked for shape and never followed into.
    - The verification a record cites is the green CI run on the pushed commit, and CI runs the local fast ladder
      (r03 Codex round 3). The Vitest provenance layer and its "authoritative" local run, built 2026-09-19 and used
      once, are retired with `check:frontier`, whose tree snapshot closed in September.
    - Each rule has one home: the rules in `AGENTS.md`, the procedure in `docs/WORKFLOW.md`, the agreements with the
      user in `docs/agent-context/WORKING_AGREEMENTS.md`, the brief rules B1-B10 in the checklist of
      `docs/agent-context/briefs/codex.md`; decisions files keep decisions and point to those homes.
18. **Haiku 5.5 and call-time effort (the user agreed, 2026-10-08; coordinator design).**
    - Haiku 5.5 (released 2026-10-07; `haiku` in Claude Code 2.1.293) answers narrow lookups through `haiku-scout`
      (`claude-haiku-5-5`, `medium`, five read-only tools). Sonnet keeps research, audits, grading, cold reads and
      the gardener's pass; Opus keeps design, building, verification and reading-direction review. `CLAUDE.md`
      holds the rules: what Haiku is not for, the source check before using its answer, and the move to Sonnet.
    - Evidence: on 12 lookups with known answers, three of them traps, Haiku and Sonnet at `medium` both scored 12
      of 12 with no invented answer; Haiku found one correct detail the expected answer missed
      (D:/fitway-temp/evals/haiku-scout-20261008/REPORT.md). Moving all Sonnet subagent work of 2026-09-20 to
      2026-10-07 to Haiku would have saved about 4% of that period's input tokens' list price: the spend is Opus,
      which stays. Haiku's use is keeping lookups out of the coordinator's Opus context.
    - Since Claude Code 2.1.292 the Agent tool takes `effort`, and a call's level overrides the definition's
      (probed 2026-10-07). The effort-only variants `owner-direction-designer-max` and
      `owner-direction-verifier-high` therefore merge into their base definitions (13 definitions become 12), and
      `CLAUDE.md` names the cases for a call-time level. The user's max-effort trial (r04 DECISIONS item 6)
      continues as the designer at `max`.
    - The advisor tool stays off: in Anthropic's measurement a Haiku 5.5 executor consulted an Opus advisor on none
      of 198 questions, and every subagent would inherit it. The gardener's scheduled pass pins
      `--model claude-sonnet-5-5 --effort high`, because a headless run otherwise takes the user's saved Opus at
      `xhigh`; the terminal Claude Code is 2.1.293 (updated by the user, 2026-10-08).
19. **Recipes beside the concept, and the rounds 6-7 follow-up (coordinator, 2026-10-08).**
    - What the concept's code can tell (pages, switches, values, dependencies, the elements a user opens) is derived
      each time the map is used; what it cannot tell (how a user reaches a feature, what proves it, sample values for
      open-domain switches) lives in `verification-recipes.json` beside the concept, on the branch that changes it
      (the Eclipse build: `6df156bd`). Nothing generated is committed. The drift step fails on an element no recipe
      covers and on a recipe whose selector is gone.
    - The gardener's weekly pass deletes nothing (the user, 2026-10-07): folders go into a script the user runs after
      reviewing its list, and merged branches are proposed. The skill's branch-deletion line is aligned in the
      follow-up round.
    - Two concurrent Codex rounds take them, one tool each (B6), before the weekly schedule starts (round 8 the
      gardener, round 9 verify-fitway; 2026-10-08): the cleanup script's quoting and its test,
      an age and citation guard and a chosen temp root for proposals, "merged" judged against `origin/main`, running
      an unknown `check:*` script, the local date, a `$root` taken from the skill's own location, landed briefs left
      out of the survey's next-brief checks; and for verify-fitway, keyboard as an input, `aria-haspopup` openers, a
      stale-recipe command that repairs, and shorter output. W2's CSS-only opener stays a recipe entry.
