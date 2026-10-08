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
      `xhigh`; the terminal Claude Code is 2.1.293 (updated by the user, 2026-10-08). Kept over Opus 5.5 at `high`
      when the user asked (2026-10-08): on the shared agentic benchmarks the two are within about three points
      (Sonnet ahead on Terminal-Bench 4.0), Anthropic's Claude Code help says Opus "costs several times more per
      turn", and two Sonnet passes reached identical findings in round 7; `high`, not `medium`, because Sonnet 5.5
      may check in before finishing at `medium`, which ends a headless run
      (`docs/phase-records/handoffs/agent-environment/r03/model-choice-gardener.md`). A miss traced to the model
      moves the pass to Opus.
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
20. **Direction after the environment phase (the user and the coordinator, discussion of 2026-10-08).** Sources: the
    user's points; Lauren Tan's (@poteto) talk, her two pstack guides and Matt Pocock's live stream with her
    (digests `D:/fitway-temp/verification-discussion-20261007/REPORT-1-talk-and-skills.md` and
    `D:/fitway-temp/agent-env-vision-research/REPORT.md`). Nothing below is built yet.
    - **Agreed.** The user's role is the environment and the decisions, not reading code. The order of work is the
      demo for the gym owner first (a contract, then funding); no refactor of the product code before then. The
      concept is the reference production will copy, so its quality counts now; the product code's own checks come
      at the move to production.
    - **Agreed.** No further investment in process tooling (records, briefs, routes); rules are cut after evidence
      shows which ones are used, through the gardener's "rules without need" class. Size of rules or records is not
      an achievement; an agent that must read dozens of files for a small change is a cost.
    - **Agreed.** A held-out row that proved useful becomes a permanent test, so grading costs fall over time. One
      findings list: each side finding a grade reports becomes a line with a status, which the gardener counts.
    - **Agreed.** Two levels: continuous checks run on every push and block known violations; the periodic gardener
      surveys what a direct check cannot see and proposes, never editing architecture by itself. A finding class
      that reaches zero gets its check into the fast ladder (first: `check:concept-css` after the Owner CSS round).
    - **Agreed.** The gardener gains a code-health section, report only: giant files, boundary breaks, type escapes
      (`any`, forced casts), repeated workarounds, with their trend, and one proposed improvement per pass; the
      concept now, the product at the move to production.
    - **Agreed, at the move to production:** checks that make product mistakes impossible (the web app imports no
      server or database code; no per-visitor column; "live" only when fresh; `apps/web` as strict as the base
      TypeScript config), the full ladder with the database and browser suites on a schedule, and the list of
      one-way doors that always go to the user.
    - **Agreed principles for any status page:** each value shows its source and age; old reads grey, unknown reads
      unknown, nothing is green by default; "the agent says" is marked apart from "independently verified"; a
      permanent blind-spots section; a check is shown with the proof that it fails on a planted defect; no single
      health score, a short list of what needs the user instead; generated from repository data, never written by
      hand; audited against reality by an independent agent from time to time.
    - **Agreed (the user, later the same evening).** The coordinator's heavy session start is the problem to solve
      first: measure how much each role reads at start, and lighten the coordinator's until its resume file is
      enough. The verification CLI stays the place to invest (Lauren Tan). Before designing a change to the
      environment, a Sonnet researcher gathers what experienced engineers have written on it, as references, not as
      truth. The status page is built only when the user asks for it explicitly.
    - **Closed by item 21 (the discussion of 2026-10-08/09).** Was open: how to
      measure that the environment improves (the user's measures: fewer attempts per feature, fewer defects reaching
      the final grade, fewer interventions per round, a fresh agent productive without a long explanation, fewer
      regressions), which needs a structured one-line-per-round record; and how to give each role the least correct
      and sufficient context. Research for it: `D:/fitway-temp/agent-env-vision-research/matt-skills.md` (Matt
      Pocock's skills against these problems) and `D:/fitway-temp/agent-env-vision-research/context-health-metrics.md`
      (experienced engineers on context, code health, measures and status pages).
    - **The user's view of Matt Pocock's skills (same evening):** `retro` is very good (a per-session review of the
      environment, run by request; first trial proposed on the 2026-10-08 session); `improve-codebase-architecture`
      looks excellent (its visual HTML report suits the user; it needs `domain-modeling` and a GLOSSARY.md, neither
      present). At the move to production it runs on each page as it moves, whatever it reads, with
      `domain-modeling` and a GLOSSARY.md provided first (the user). Replacing FITWAY's planning records with his
      pipeline is not proposed: lighten ours with his ideas.
    - **Agreed trial (the user said yes, same evening):** the front of Matt Pocock's pipeline (questions that clear up
      intent, then a written spec: `grill-with-docs` and `to-spec`, neither installed) writes the brief of the next
      real task (the Owner CSS round or the press-feedback design), because most failed rows come from brief wording.
      The back (`to-tickets`, `implement-spec`) is not tried: Codex rounds with independent grading cover it. The
      coordinator answers technical questions and brings the user only product and taste ones. Compared with ordinary
      rounds on repair attempts and brief-caused failed rows; one trial is a signal, not a verdict. Part of the plan
      the next session closes.
21. **Measuring the environment and the least context per role (the user agreed every point, discussion of
    2026-10-08/09; coordinator design).** Closes item 20's open points. Nothing below is built yet.
    - **Evidence** (`D:/fitway-temp/start-load-20261008/REPORT.md`, from the transcripts of 25 coordinator sessions and
      138 subagents): before reading a file the coordinator carries 68-74K tokens, the five-tool Sonnet definitions
      16-17K, and the five Opus definitions without a tool list (designer, builder, verifier, fixer, rtl-ltr-reviewer)
      52-61K. The coordinator's own start reads are 8-25K. At its first edit the designer's median is 185K
      (designer-max 407K), above the 125-150K where Matt Pocock's dictionary places the quality drop (debated); one
      designer read about 75K first, mostly the code it edited and one decisions file three times. The desktop app's
      context panel (the user's screenshot, 2026-10-09, this coordinator session) splits the fixed load: built-in
      tools 17.1K, MCP tools 11.9K, skills 9.1K, memory files 6K (3), system prompt 5K, custom agents 2K (21), MCP
      server instructions 1K, about 52K; deferred tools (79K) do not load. Tools and skills (38K) match the 35-40K
      an all-tools subagent pays over a five-tool one. The window is 1M, so the fixed load is about 5% of it; the
      session's own tools and connectors stay as they are (the user).
    - **Measures.** One TSV line per round, written by the coordinator at grading: the round, model and effort,
      attempts until accepted, held-out rows passed of total, rows failed by brief wording, interventions during the
      round, defects found after acceptance, and start load. Start load, interventions and attempts are computed; the
      rest is the grader's judgment. Back-filled from both `codex-rounds.md` files, so the baseline exists on day one.
      The findings list (item 20) is a line per side finding with its status and class, regressions being one class;
      the gardener counts recurrences and a recurring class gets a check. A replay set of about ten frozen past tasks
      with their held-out rows reruns on Codex after a material environment change, because rounds differ in
      difficulty and N is small; it is the "fresh agent productive without a long explanation" measure. The gardener
      reports the monthly trend with N beside each rate and no single score.
    - **Least context.** The five Opus definitions get a tool list (Read, Write, Edit, Glob, Grep, Bash, PowerShell,
      Skill), measured before and after; a tool an agent reports missing comes back. The designer's brief names the
      files and lines it edits and carries the decisions in force (target: first edit under 125K). The coordinator's
      resume file is enough on its own and names decision items by number; a packet's required sources are the
      worker's, not the coordinator's start.
    - **The question-and-spec trial (item 20).** `grill-with-docs` and `to-spec` install as slash-only skills. Their
      descriptions cost little (the user's point, about a hundred tokens); slash-only is so they run only when the trial
      calls them. By its description `grill-with-docs` writes ADRs and a GLOSSARY: its body is read before the trial
      and its writes are kept out of `docs/adr/**`. Downloading them needs the user's yes at execution.
    - **retro:** the user runs it in the first execution session.
    - **Order, from the next session:** (1) the start-load script into `scripts/agent-environment/`, the 2026-10-08
      numbers as the baseline; (2) the tool lists, measured; (3) the rounds and findings files, back-filled by a Sonnet
      researcher and sampled by the coordinator; (4) the replay set and its first Codex baseline; (5) the coordinator's
      start from the resume file alone, measured; (6) the trial on the Owner CSS round's brief; (7) the designer brief
      template.
