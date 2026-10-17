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
6. **Code quality for agent-written code: a diff review, a ratchet, and the same on production** (the user,
   2026-10-16, through a forked side session that relayed it with its review, `D:/fitway-temp/code-quality-review-
   20261016/REPORT.md`: «موافق على جميع اقتراحاتك لتحسين Code Quality ومنع انتشار الأنماط السيئة في الـCodebase، خصوصًا
   الـRatchet ومراجعة جودة الكود قبل الدمج، وأبي الضمانات تشمل كود الإنتاج مستقبلًا»). The coordinator reproduced the
   measurements the plan rests on: `codex-round.mjs` is 2,091 lines (447 on 2026-10-10), `apps/web/tsconfig.json` does
   not extend the base config, Biome excludes `design-research`; the weekly gardener task exists (next run
   2026-10-16 14:00), though its last pass, 2026-10-09, was blocked.
   - **Diff review before every merge** (recommendation 1), from 2026-10-16: `docs/agent-context/briefs/CODE_REVIEW.md`,
     a fresh Sol at `xhigh` (Opus for a round that matters) on the diff, the brief and the touched files; blocking
     findings go to a fix round on the same branch, the rest to `findings.tsv` as `maintainer`. It covers r04's
     concept rounds too. First use: code-map and launcher-fixes-6.
   - **The ratchet** (recommendation 2), the next round of this wave, before the CLI contract, so later rounds are
     measured by it: per-file counts of duplicate blocks, type and lint escapes, suppressions and repeated
     workarounds, from the gardener's code-health scanner, committed as a baseline; the fast ladder fails when a change
     raises a count in a file it touches, and a file already over the giant-file size may not grow. An exception sits
     on its line with a reason and an expiry, and the coordinator lists open exceptions in the resume point for the
     user. It covers the tooling, `apps/` and `packages/` from its first day (recommendation 6); the concept joins
     when the build branch takes this line's tooling.
   - **A pattern seen twice becomes a check** (recommendation 4): r04 decision 56's `correct` method applied to code
     shape; each new check is proven to fail on the real past case.
   - **Map upkeep widens** (recommendations 3 and 5): the gardener's blocked pass fixed and its scope widened to
     `apps/` and `packages/`; the code map marks the callables that carry counted debt or an open finding as "do not
     copy", and briefs point to that list.
   - **Briefs** gain one line (pstack's `principle-subtract-before-you-add`): no validator, parser, option or guard
     beyond what an outcome needs.
   - **Production** (recommendation 6) is r04 decision 74.
   - **Not adopted now:** dependency-cruiser boundaries (`setup-ts-deep-modules`, unfinished upstream) until the move to
     production restructures the packages; refreshing the user-level `handoff` and `implement` skills waits for a
     quiet moment, since those are the user's global files.
7. **The wave's order after item 6** (coordinator): code-map and launcher-fixes-6 merge after grading and the diff
   review; then the ratchet; then the CLI contract with `pnpm tools`; then map upkeep with the gardener's scope and the
   "do not copy" list; then the lighter pickup.
8. **Grading checkouts get their own install, never a junction** (coordinator, 2026-10-16, after the second time a
   `git worktree remove` followed a `node_modules` junction and emptied the round's install: 2026-10-15 in r04, and
   2026-10-16 for `tooling-launcher-fixes-6`, restored by `pnpm install --frozen-lockfile --offline`, measured). By r04
   decision 56's method the fix is structural: a grading or scratch checkout runs `pnpm install --frozen-lockfile
   --offline` (about 10 s) instead of linking another worktree's `node_modules`, so a removal has nothing to follow.
   Any junction left from before is unlinked with `cmd /c rmdir` first; `.agents/skills/gardener/remove-worktree.mjs`
   is the removal path for worktrees that still carry one.
9. **The report fields get a round of their own, after the CLI contract** (coordinator, 2026-10-17). Readings left
   open across the wave wait on three report-template changes: a claimed-commit field, a machine-readable brief role
   and structured report rows. They change the template every brief shares and the launcher's claim check in
   `scripts/agent-environment/codex-round.mjs`, a giant file (2,316 lines, measured) the ratchet now forbids from
   growing; joined to the CLI contract's 21 commands they would make one round carry two contracts. The order of
   item 7 becomes: the CLI contract (F251), then report-fields (with F265 as a candidate), then map upkeep, then the
   lighter pickup.
