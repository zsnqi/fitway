# agent-tooling-r01: decisions in force

The standing decisions for the agent tooling. The rules this milestone inherits stay where they were made and are read
through these pointers, not copied here.

1. **Opened from r04's decision 73** (the user, 2026-10-16; `docs/phase-records/handoffs/owner-design-exploration/r04/
   DECISIONS.md` item 73): the route, a generated code map, a lighter pickup, one CLI contract with `pnpm tools`, and
   map upkeep. The tool paths r04 held from agent-environment-r03 move here (F253); r04 keeps the concept, uses the
   tools and launches its rounds with them. The user wants more invested in the CLI, so it is clearer and easier for
   agents.
2. **Rules carried from r04, read there** (`docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`):
   the order of work and the two labels on every finding (52); Codex on DeepSeek V4.1 Flash at `max` for mechanical and
   subtle runtime rounds, GPT-6.1 Sol as grader and second reviewer (64, 66, 69); Opus grades the rounds that matter
   (67); a pickup checks what it builds on, and every claim says measured, inferred or guess (67); separate ports per
   running round (67); diagnosable logging (70); Codex's limits and the account rule (72); main moves only through
   `pnpm main:advance` after a green CI (62, 63); B6 and B13 as loosened (56); the coordinator hands over itself (61).
3. **Brief rules and launcher:** B1-B13 in `docs/agent-context/briefs/codex.md`, the review in
   `docs/agent-context/briefs/REVIEW.md`, the recipes in `docs/phase-records/handoffs/agent-environment/DECISIONS.md`
   items 15, 19 and 29.
4. **Records:** findings stay in `docs/phase-records/handoffs/agent-environment/findings.tsv` and rounds in its
   `rounds.tsv`; Codex round evaluations in r04's `codex-rounds.md`, so one table serves both milestones until the
   lighter pickup moves them.
5. **Order inside the wave** (coordinator, 2026-10-16, from decision 73 and r04's decisions 47, 48 and 52): F254 first,
   since every launcher round meets it; then the CLI contract with `pnpm tools`, which the code map and the lighter
   pickup both list; then the code map and map upkeep; then the lighter pickup. Rounds on disjoint files may run side by
   side (r04 decision 64). r04's shared lows on the build branch run beside this wave and touch none of its files.
