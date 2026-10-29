# agent-tooling-r01: evidence-home: `../briefs/codex-evidence-home.md`, result `52fb52af` on `tooling-evidence-home` (from `7930c80b`), DeepSeek V4.1 Flash, level `max`; builder `a5c16da6`; merged `6022c351`

- **Scope (agent-tooling DECISIONS item 17, findings 1 and 3):** `pnpm evidence:keep` copies evidence into
  `docs/phase-records/evidence/<milestone>/<topic>/` with `SOURCES.md` and stages it (H1); `run.json` and
  `pnpm run-folder:new` record who made a folder, from which brief and commit, and where its report goes (H2);
  `giantDocuments` ratchets tracked Markdown over 40,000 bytes repository-wide, and the concept folder joins the
  giant-file roots (H3); `pnpm check:agent-context` fails on a `RULE_ENFORCERS.md` row naming a command or file that
  does not exist (H4).
- **Brief review** (`D:/fitway-temp/brief-review/codex-evidence-home-1` and `-1-sol`): dispositions in each folder.
- **Run** (`D:/fitway-temp/codex-round-evidence-home`, start load 174,682): two turns, one automatic
  resume after the first ended without a report; 195.0M input tokens (193.3M cached) and 201k output.
- **Diff review** (`D:/fitway-temp/code-review/evidence-home-1/`): Sol `xhigh`, eight blocking findings (a second shell
  tokenizer beside `shell-words.mjs`; a repeated giant-measure collector and a wrapper left uncalled; a second Git
  fixture; a third heading reader; a second walker; a limits parameter nothing passes; a local `sha256`).
- **The coordinator's grade on `52fb52af`** (`GRADE.md` there): `evidence:keep` and `run-folder:new` refused every
  escaping or malformed path, a missing `--for` and a missing brief; a kept folder staged with `SOURCES.md`, a rerun
  changed nothing, a changed source refused the whole call; a new 41,000-byte document failed the ratchet with the
  split guidance. Blocking C1: enforcer rows naming `pnpm -s <script>`, a folder or `node <file>` that is gone passed;
  C2: `.MD` was not counted.
- **The builder** (brief `D:/fitway-temp/tooling-evidence-home/fix-1/BRIEF.md`): merge `aee486fd` (main `8398bd72`;
  the map and baseline regenerated), fix `a5c16da6`: `shellTokens` splits enforcer commands; one giant-measure
  collector; the shared Git fixture in `code-health-fixture.ts`; `headings()` gives levels and `briefTitle` uses it;
  one walker, fixed limits and the shared `sha256` in `evidence-keep.mjs`; every code span in an enforcer cell is a
  recognised form that must exist (three prose spans in `RULE_ENFORCERS.md` lost their backticks); `.md` matched in
  any case through an `:(icase)` pathspec. `pnpm verify:fast` passed once after the commit.
- **The coordinator's check of `a5c16da6`:** the planted rows `pnpm -s check:gone-plant`, `scripts/gone-dir/` and
  `node scripts/gone-plant.mjs` each fail naming the row, `pnpm -s check:agent-context` passes; a 41,000-byte
  `PLANT.MD` fails the ratchet. On the merge, `check:tooling-map`, `check:repository` and `check:agent-context` pass;
  `check:code-health` first failed on the r04 activation handoff, 340,754 bytes against 340,749, because this
  worktree's copy held carriage returns Git does not store (F-row: the measure reads working-tree bytes); restored
  from Git, it passes.
- **After the merge:** CI run `40794728187` on `fe43a051` failed `evidence-keep.test.ts` (9) and
  `codex-session-metadata.test.ts` (1): the runner's temp folder is a short alias (`RUNNER~1`) and Git prints the long
  path, so the root check refused the repository and `briefPath` came out as `../../../RUNNER~1/...`. Every local run
  passed because drive D has no short names. Reproduced with a C: short `TEMP` and fixed by resolving both paths
  (`c4bc59a9`).
- **Rows:** H1-H4 and K2-K3 met at `a5c16da6`; K1 met at `c4bc59a9`, one defect found after acceptance. The
  coordinator's rule that its folders are made with `pnpm run-folder:new` is in `WORKING_AGREEMENTS.md` §"Delegation".
