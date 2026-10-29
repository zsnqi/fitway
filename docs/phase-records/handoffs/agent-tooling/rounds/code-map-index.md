# agent-tooling-r01: code-map-index: `../briefs/codex-code-map-index.md`, result `ffe2d51f` on `tooling-code-map-index` (from `f79adba4`), DeepSeek V4.1 Flash, level `max`; fixer `63802e86`; merged `1315d2e0`

- **Scope (agent-tooling DECISIONS item 17, finding 2; the code map reshaped):** the tooling map listed every callable
  with its line range and the tests that called it (857 callables, about 63 KB), so any edit that moved a line failed
  `pnpm check:tooling-map`. It is now one entry per mapped file: its leading comment and its exports, with a
  re-export naming its defining file. The per-callable coverage and call tracing it alone needed are removed
  (`tooling-map-coverage.mjs`, `tooling-map-imports.mjs`). `MAPPED_PATHS` is unchanged.
- **Brief review** (`D:/fitway-temp/brief-review/codex-code-map-index-1` and `-1-sol`): DeepSeek's and Sol `xhigh`'s
  readings closed in the brief, one in part (dispositions in each folder).
- **Run** (`D:/fitway-temp/codex-round-code-map-index`, start load 174,146): one turn, then one automatic
  resume when the claim check found no record for the N3 PASS row; 29.2M input tokens (28.6M cached) and 85k output.
  N1-N3 and K1-K3 reported PASS.
- **Diff review** (`D:/fitway-temp/code-review/code-map-index-1/`): Sol `xhigh`, three findings. Findings 1-2
  (bracket-form `module.exports["x"]`, shadowed `module` or `exports`) are F300: no mapped file is CommonJS today.
  Finding 3 (D1, the no-leading-comment count computed twice) and the coordinator's C1 (an entry-only drift printed
  an empty `missing []; extra []`) were blocking.
- **The fixer** (brief `D:/fitway-temp/tooling-code-map-index/fix-1/BRIEF.md`) committed `63802e86`: the count is
  computed once in `buildToolingMap` and passed to the formatter; the file-list part prints only when a file is missing
  or extra, with the drift tests extended; the `expectCalls` floor rose 1053 to 1057 with its four assertions. The map
  is byte-identical (108 files, 74 without a leading comment). Its `pnpm verify:fast` failed four times only in Unit
  tests, each run on different 60-second timeouts while three Codex rounds ran on the machine; the ladder of record is
  CI on the merge.
- **The coordinator's grade on `ffe2d51f`** (`D:/fitway-temp/tooling-code-map-index-grade/GRADE.md`): P0 clean; P1
  lines moved only, passes; P2 an export renamed, P3 a leading sentence changed and P4 a new mapped file each fail
  naming the file and `(run pnpm map:tooling)`. After the fixer, the map tests 22/22, `check:tooling-map`,
  `check:code-health`, `check:repository` and `check:agent-context` pass on the merge.
- **Rows:** N1-N3 and K2-K3 met at `63802e86`; K1 is the CI run on the push that carries `1315d2e0`. The 74 files
  without a leading comment are the follow-up after the four rounds merge.
