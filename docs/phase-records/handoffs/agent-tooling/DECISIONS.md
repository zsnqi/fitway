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
10. **The giant-file line counts code, and the giant files are split** (the user, 2026-10-17, on the coordinator's
    proposal: «موافق يلا سجله»). Three rounds made room under the ratchet's 800-line line by deleting text instead of
    moving code: ratchet-fix-2 six comments, cli-contract 26 blank lines from five giant files, cli-contract-fix 17
    lines of the launcher's help explanations (F272; each caught by a diff review or a grade and repaired).
    - The ratchet's giant-file measure counts code lines only, not blank lines or comment lines, so deleting either
      buys nothing; usage and help text belongs in the command registry, where the CLI contract put it.
    - A round of its own then splits the giant files (`scripts/agent-environment/codex-round.mjs`,
      `.agents/skills/gardener/survey.mjs`, `scripts/check-agent-context.mjs`,
      `scripts/agent-environment/check-brief.mjs` and the others over the line) into modules, so later rounds stop
      meeting the line.
    - Briefs keep "room is made by moving code out, never by deleting blank lines, comments or explanations" until
      both are in. No check tries to detect such deletions from a diff.
    - The order of item 9 becomes: the CLI contract, then the ratchet's code-line count, then the split round, then
      report-fields, map upkeep and the lighter pickup.
11. **The order after the CLI contract follows the demo** (the user, 2026-10-17, through a forked side session; read
    in `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md` item 76). Report-fields and the
    verification-map part of map upkeep (F252) run beside r04's Settings once the CLI contract is on main; the
    ratchet's code-line count, the giant-file split and the lighter pickup run beside the pages and the demo where
    capacity allows, neither deferred nor gating. This replaces item 10's order (the split before report-fields);
    item 10's two rounds and its brief line stand.
12. **A test suite's `describe` callback is not a long function** (coordinator, 2026-10-18, on F269; the rules leave
    it open). The ratchet's long-function measure counted every Vitest `describe` callback over 80 lines (134 hits in
    94 files at `72b95888`, measured), so adding a case to any long suite touched an over-80-line function and the
    measure asked for nothing an agent could act on: a suite groups cases, it is not a function anyone factors. The
    measure skips `describe` callbacks (with its `.each`, `.skip`, `.only` and similar forms); `it` and `test`
    callbacks, hooks, helpers and every other function stay measured. The ratchet round with the code-line count
    (item 10) carries it.
13. **Prevent what reviews keep finding; reviews keep the judgment** (the user, 2026-10-18: «بخصوص بيئة الـAgents،
    أعطيك حرية تقييم وتنفيذ أي تحسينات تشوف أنها مفيدة فعلًا لجودة النظام وكفاءة سير العمل»). The coordinator evaluates
    and carries out agent-environment improvements without asking on each detail, aimed first at the problems Sol's
    reviews and grades keep finding that a check, a template line or a code structure can stop before any review.
    Sol's reviews are neither removed nor reduced to save cost; quality does not drop; a tool change earns its place by
    a measured benefit and never displaces the pages and the demo (r04 decision 76). Decisions and results are recorded
    as usual.
    - **Measured first** (`D:/fitway-temp/review-recurrence/REPORT.md`, sonnet-researcher, 2026-10-18; two Biome
      figures reproduced by the coordinator): 74 blocking findings in 19 Sol diff reviews (duplicates and second paths
      34, only the named forms handled 11, dead code 9, growth 7); none of the 25 findings in rounds after the ratchet
      was caught by it, the rest being semantic; 37 FAIL rows over 7 grades (21 real defects, 14 brief wording),
      overclaims in 5 rounds, tests red for the wrong reason in 4, load timeouts in 4.
    - **Built, in this order, each replayed on the report's 18 past base..result pairs for catches and false flags:**
      base-run (a round's added or changed tests run against the base's code; a failure before any assertion is
      refused as red for the wrong reason, a missing module the diff adds is listed apart); ratchet-2 (the summed length
      of functions over 80 lines per non-test file cannot rise, empty blocks counted, Biome warnings fail the ladder,
      and the zero-hit rules `noSkippedTests`, `noUnusedExpressions`, `noNonNullAssertion` set to error; the timeouts of
      F261, F281 and F282 settled); the launcher runs the fast ladder itself after it accepts a commit claim and
      records the result (F256's ladder half, F279); the brief template gains a reuse line, a pointer to
      `CODE_REVIEW.md` D1-D8 for the implementer, a `Forms:` list for any outcome that parses, reads, classifies or
      detects (presence checked by `brief:check`), and what a new check does when its input is missing.
    - **Not built yet:** a near-clone measure (12 of 30 placed duplicates on history, its false-flag rate unjudged);
      it may become a hint in the diff review's prompt once a hand-judged sample sets its threshold.
    - **The benefit is tracked** as blocking findings per diff review by class, before and after, in `codex-rounds.md`.
14. **Before the demo: close ratchet-2 and the template lines; the rest waits** (the user, 2026-10-18, on the
    coordinator's proposal in a side session, before switching Claude accounts: «موافق على اقتراحك بإغلاق Ratchet-2
    وإضافة تحسينات قالب الـBrief» and «موافق على اقتراحك بتأجيل بقية أعمال البيئة إلى ما بعد الديمو»; neither resumes
    until the new account's session picks them up from the saved state).
    - **Closed before the pages continue:** ratchet-2 (local `50cecbc9` on `tooling-ratchet-2`, unpushed; left: the Sol
      diff review its stop note names, the grade, the replay on the final commit, CI and records; its stop note at the
      top of `D:/fitway-temp/tooling-ratchet-2/REPORT.md`). Its replay counts decide `longFunctionLines`: 8 of the 18
      reviewed pairs flagged (5 of the 7 D5 findings), but 40 of 87 unreviewed control commits flagged too; a measure
      that mostly flags work no review objected to is dropped or narrowed (item 13). And the brief template's lines only
      (`docs/agent-context/briefs/codex.md`): reuse what exists before writing a reader, parser, runner, fixture or option
      list; the implementer is pointed to `CODE_REVIEW.md` D1-D8; an outcome that parses, reads, classifies or detects
      lists its forms; a new check says what it does when its input is missing. The `brief:check` rule for the forms
      list waits.
    - **After the demo:** base-run (its edits stay uncommitted on disk in `D:/Projects/fitway-worktrees/tooling-base-run`
      over `c0e12373`, pushed; review them against its dispositions before any commit), the test-file split (CI's
      27-28 min, `codex-round.test.ts` 1,415 s; the 45 min limit holds meanwhile), the launcher running the ladder
      itself, the near-clone measure, `compareOwned` (F293), the lighter pickup, F264, F273-F276, F285 and the
      before/after evaluation on DeepSeek.
    - **Claude Desktop stays** (the user, same day, on the coordinator's reading of T3 Code: its multiple Claude
      accounts are separate `CLAUDE_CONFIG_DIR` folders picked per thread, with no switch at a limit and no thread
      moving between accounts; this environment's side sessions, messages between sessions, Browser pane and artifacts
      live in the desktop app).
    - **Usage** (agreed the same day): a side session starts fresh with a short brief instead of a fork carrying the
      coordinator's context; at most two Opus sessions run at once; read-only research over local files can be a Codex
      `delivers: report` round instead of a Claude researcher.
15. **Round output does not pile up in `D:/fitway-temp`** (the user, 2026-10-24: «تمام»). A survey found the folder
    at 471.6 GB (about 4.85 million files, 293 GB of PNG; grading 170.5 GB, design captures 158 GB, verifier captures
    94.2 GB) with D at 73 GB free (`D:/fitway-temp/cc-temp-survey/REPORT.md`). A one-off prune
    (`D:/fitway-temp/cleanup-20261024/`) keeps each finished round's records and the images they name; it is run by the user.
    The tooling then keeps it from recurring, beside the demo and gating nothing:
    - once a round is graded and recorded, its folder is pruned the same way (records and named frames stay; captures,
      checkouts and real `node_modules` go; junctions are unlinked, never followed);
    - captures save the named frames and the failing ones, not every size on every run;
    - the weekly gardener reports the folder's size and its oldest unpruned rounds;
    - a round does not launch when D has too little free space;
    - a finished grading checkout whose commits are all on the remote can be removed even when a record cites its
      round folder: on 2026-10-24 the gardener's `remove-worktree.mjs` would refuse all 17 under `D:/fitway-temp`
      (15 cited by tracked records, the rest not merged into main), so they stay until this lands.
16. **A brief names how an outcome is already proved** (the user, 2026-10-28, from a forked session of the r04
    coordinator: "The light steps now", r04 DECISIONS item 101). The compare-fullpage round spent four attempts and
    about an hour building its own copy of the repository (`D:/fitway-temp/codex-round-compare-fullpage/events.jsonl`
    events 439-446) to prove C4, which the bundle key already guaranteed: the key hashes the tool's own files
    (`baseline-cache.mjs`, `this.environment`, about line 171) and the "CLI-file" row of `invalidationCases`
    (`.agents/skills/verify-fitway/compare-speed.test.mjs:371`) proves it with a planted defect. The round had read
    that test at events 50-52; the brief's "run it with the cache on" set the heavy path, not the executor.
    - **The brief, from the next one:** before writing an outcome, the coordinator checks whether the code's
      structure or an existing test already guarantees it. If it does, the outcome is that test still passing,
      named by file and line, with no new proof. If a proof is needed, the brief names the test or table it extends
      and the result expected (checklist B14 in `docs/agent-context/briefs/codex.md`).
    - **verify-fitway's SKILL.md** gains a short section on proving a change to the tool. It states the target,
      such as adding a row to `invalidationCases` or a copy through `fixture-copy.mjs`, rather than a prohibition.
      It is written once compare-fullpage's commit, which also edits SKILL.md, has merged.
    - **Not built yet:** a Proof field that `brief:check` requires on every outcome. This is the first clear case (no
      other `codex-round-*` folder holds hand-built scripts), and agent-environment DECISIONS item 20 adds no process
      tooling without evidence; it is built if the same mistake recurs.
    - Sources, from the forked session's research: pstack's guide ranks a fix by strength (structure, then a check
      whose error names the fix, then a test, then a written rule) and counts a class once it has happened twice;
      Matt Pocock's writing-for-agents says a pointer's wording decides whether an agent reaches it, and a
      prohibition plants the idea it forbids.
17. **The retro's four navigation findings are fixed at the root before the public page starts** (the user,
    2026-10-28, from a forked session: «أبي الجلسة الرئيسية تعالج جميع المشكلات من جذورها، مو تختار حلًا واحدًا أو
    تكتفي بالتوصيات. خليها تراجع الحلول وتنفذ الأنسب لكل مشكلة، ثم تتحقق من نجاح الإصلاحات. و عادي ما نبدأ ب الصفحة
    العامة الان»; r04 DECISIONS item 102). The retro measured the last ten coordinator lineages (2026-10-26 to 10-28)
    and their subagents (scripts and report:
    `D:/fitway-temp/retro-20261028/`, copied from the forked session's scratchpad).
    For these four it widens agent-environment DECISIONS item 20 ("no further investment in process tooling"); item
    16 still holds. Each finding gets the fix the coordinator judges best after review, then a measurement again, and a
    planted defect wherever a check is added:
    - **Agents hand-build verification tools** instead of using verify-fitway: 561 scripts in 42 of the 263
      `owner-r04-*` run folders; 640 tool calls on run-folder scripts against 125 runs of verify-fitway's CLI; SKILL.md
      has asked for its path to be extended since `8e520995`, and 36 of 40 such scripts are newer.
    - **Records cite evidence that is gone:** 29 of the 290 `D:/fitway-temp` folders tracked records cite no longer
      exist; 70 calls dug through transcripts to find who made a run folder or what it reported.
    - **Very large files are read whole, repeatedly:** Eclipse `SETTINGS-SPEC.md` (78 KB), `DESIGN-SPEC.md` (283 KB),
      `settings.js` (154 KB, read 15 times in 3 sessions); 37 tool results over 25K characters.
    - **The tooling code map does not serve navigation:** `AGENT_TOOLING_CODE_MAP.md` was read by no agent, and
      searches missed for want of a "where things live" pointer.
    The public page's designer launches after these are done and checked.
