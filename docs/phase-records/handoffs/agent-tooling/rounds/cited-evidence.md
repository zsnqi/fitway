# agent-tooling-r01: cited-evidence: `../briefs/codex-cited-evidence.md`, result `564625f5` on `tooling-cited-evidence` (from `f79adba4`), DeepSeek V4.1 Flash, level `max`; builder `bafc03d0` and fixer `5366c3e0`; merged `a12a3724`

- **Scope (agent-tooling DECISIONS item 17, finding 1):** evidence a record cites was deleted by prunes and worktree
  removals that never read citations. The gardener gains a prune that proposes deleting only temp files no tracked
  record cites (E1); `remove-worktree.mjs` refuses a worktree holding a cited ignored file (E2); the survey and
  `pnpm check:repository` list gone citations, failing only on changed lines (E3); the survey counts scripts in new
  run folders (E4).
- **Brief review** (`D:/fitway-temp/brief-review/codex-cited-evidence-1` and `-1-sol`): dispositions in each folder.
- **Run** (`D:/fitway-temp/codex-round-cited-evidence`, start load 174,596): six turns, four of them
  automatic resumes after a turn ended without a report and one after the claim check found no record for four PASS
  rows; 134.5M input tokens (133.4M cached) and 174k output. Its full survey on the real temp root did not finish in
  two 30-minute attempts, which it reported.
- **Diff review** (`D:/fitway-temp/code-review/cited-evidence-1/`): Sol `xhigh`, six blocking findings (a swallowed
  read error that let a named capture be proposed; a second test fixture; a second traversal; a recomputed prune
  selection; a copied script template; `formatReport` grown to 158 lines).
- **The coordinator's grade on `564625f5`** (`GRADE.md` there): gone citations planted with forward slashes,
  backslashes and in parentheses each fail naming their line, a marked one and an existing file pass; 123 old gone
  citations are counted on unchanged lines. The prune keeps a `.yml`-cited folder's files and proposes an uncited
  capture. Blocking C1: a capture in a subfolder named by a text file elsewhere in the folder was proposed. Timing
  (C3): `planEvidencePrune` on the real temp root (1,754 folders) did not finish in 28 minutes.
- **The builder** (brief `D:/fitway-temp/tooling-cited-evidence/fix-1/BRIEF.md`): merge `b5d46db4` (main `8398bd72`),
  fix `9bc4911c` (findings 1-6, C1: a read error withholds the folder naming the file; capture names are collected
  across the top-level folder; one walker; the prune selection read from the report; one proposal-script template;
  three section formatters; one checkout fixture). It reported that the capture-name pattern took phrases with
  spaces as names, which became item 9. Fix `bafc03d0` (items 8-9): a directory no citation reaches is proposed
  whole without being walked, and inside a cited folder a `node_modules` or Git tree is kept whole; the user-run
  script deletes a whole folder only after the link and worktree checks; the citation index is built once; a name is
  a token without spaces, or a quoted or backticked string. The prune on the real temp root took 151 s; the survey's
  `collectGit` (code that was already there) took 664 s before it (F-row). It reported that the prune had no
  folder-age rule, so a live round's uncited folder would be proposed: item 10. An `owner-direction-fixer` committed
  `5366c3e0`: the prune withholds a top-level folder younger than `MIN_FOLDER_AGE_DAYS` or not measured, with the
  cleanup's constant and measurement, and the user-run script measures each folder again before it deletes.
- **The coordinator's check of `5366c3e0`** (`GRADE.md` §"On the final commit"): captures named in prose and in a list
  item by a text file at the folder's top, in subfolders, are kept and only the unnamed one is proposed; a folder
  cited only by an untracked record is proposed; a two-day-old folder is withheld.
- **Before the push:** the gardener tests run with a short Windows temp alias (as CI's `RUNNER~1`) failed 4: Git prints
  worktrees by their long path, so a registered worktree in a short-path temp root was not recognised by the prune
  or the removal. Fixed in `3f582e9e` (the prune's root, the removal's target and the test checkout by real path);
  47/47 after. With a long path holding a space (`C:/Users/Pc Force`), two older round16b tests fail because a
  citation stops at a space (F-row; CI's path has none).
- **Rows:** E1-E4 and K2-K3 met at `5366c3e0` with `3f582e9e`; K1 is the CI run on the push that carries the merge.
