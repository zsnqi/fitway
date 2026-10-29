# agent-tooling-r01: run-and-ref: `../briefs/codex-run-and-ref.md`, result `1c218aa6` on `tooling-run-and-ref` (from `f79adba4`), DeepSeek V4.1 Flash, level `max`; builder `73905320`; merged `48891835`

- **Scope (agent-tooling DECISIONS item 17, finding 2):** verify-fitway's `run` executes an agent's check script from
  any folder against the concept (and a baseline) with the tool's previews, browser, contexts and `rewrite` (V1, V3);
  `--ref` and `--baseline-ref` extract the concept at a commit once and reuse it (V2); `diff-folders` compares two
  folders of PNGs with compare's diff (V4); every output folder gets `manifest.json` (V5); `SKILL.md` gains "Where
  things live", checked by a test (V6).
- **Brief review** (`D:/fitway-temp/brief-review/codex-run-and-ref-1` and `-1-sol`): dispositions in each folder.
- **Run** (`D:/fitway-temp/codex-round-run-and-ref`, start load 175,366): one turn and an
  automatic resume after the claim check found no record for the V6 row; 298.4M input tokens (296.6M cached) and 281k
  output. It changed `tool-contract.mjs` and `tool-contract-probes.ts`, which the brief kept read-only, and reported
  "Unresolved limits: none".
- **Diff review** (`D:/fitway-temp/code-review/run-and-ref-1/`): Sol `xhigh`, six blocking findings. Finding 1 (the
  read-only contract files) was not adopted: the change adds a "one of these options" rule where option validation
  lives, and the departure is recorded here. Findings 2-6: a second list of output commands; manifest tests that do
  not run the commands; compare's validation repeated; the declared-ref default repeated; `rewrite` limited to pages
  from `newPage` and choosing its side when called.
- **The coordinator's grade on `1c218aa6`** (`GRADE.md` there): `run` with a short ref, partial axes and `--` arguments
  passed and wrote `result.json`; a script without a default export and a non-empty `--out` were refused. Blocking C1:
  a second `rewrite` of the same file dropped the first; C2: `diff-folders` on two folders with no PNG exited 0; C3: two
  messages (a default export that is not a function; an unknown side in `url()`).
- **The builder** (brief `D:/fitway-temp/tooling-run-and-ref/fix-1/BRIEF.md`): merge `70ec8183` (main `8398bd72`;
  the map regenerated), fix `73905320`: which commands write `--out` comes from the registry; the manifest tests run
  drive, compare and run through the CLI with fakes (`fake-cli.mjs`); one `validateCompareOptions`; the declared-ref
  default in `resolveConceptSide`; `createRewrite` serves any page, picks the side per request, applies several
  rewrites of one file in call order and checks each `from` on every side that holds the file; `diff-folders` fails
  when nothing was compared; the two messages say what they found. It also made `to` literal (a `$&` in it was
  expanded). Its first `verify:fast` failed on the contract scan in `tool-contract.test.ts` (an option compared by
  name); the amended commit passed it.
- **The coordinator's check of `73905320`:** `grade/rewrite-twice.mjs` returns both changes (`one: "1", two: "2"`);
  two empty folders exit 1 with "nothing was compared"; `export default 42` and `url("concept", ...)` name what they
  found. The merge conflicted only in the generated map; `check:tooling-map`, `check:code-health`,
  `check:repository` and `check:agent-context` pass on it. A rewrite is refused unless its `from` is once on every
  side holding the file, so a change planted on one side only, where the two sides' texts differ, needs a `from`
  both hold once: kept, since a side the page never loads would otherwise pass a stale `from`.
- **Rows:** V1-V6 and K2-K3 met at `73905320`; K1 is the CI run on the push that carries the merge.
