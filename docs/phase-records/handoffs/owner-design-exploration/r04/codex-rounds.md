# owner-design-exploration-r04: Codex rounds as evaluations

One entry per round: the brief, brief rows passed, held-out rows passed, and the failure cause. The held-out
checks live outside the repository and never appear here or in a brief.

## nav-1: `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-1-readme-split.md`, result `32958e1`

- **Brief rows:** 5 of 5 (N1-N5). README 1,932 lines -> README 821 + HISTORY 1,329; no line lost; Daily and
  Reports at 1440 AR render byte-identical before and after.
- **Held-out rows:** 5 of 7.
- **Failure causes:** K6 (README at most 700 lines) failed because the coordinator's cut kept `Open and capture`
  (143 lines of capture checks) in the contract and the brief set no length. K2 (no double copy) failed on 19
  lines: Codex restated paragraphs by editing part of them and kept the whole old paragraph in HISTORY.md, which N2
  allowed. Both trace to the brief, not to a misreading.
- **Left for a repair round:** round labels and run IDs in the contract's rule titles; the intro's total length
  is never stated as one sentence; blank lines inside bullet lists (README 64, 356); DESIGN-SPEC PAT-1 points to
  "What it answers" where the rule is in "The table, form and dialog system".
- **Environment:** `codex exec --approve-for-me`; no escalation was refused.

## nav-2: `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-2-index.md`, result `25795c9` on `owner-r04-nav`

- **Brief rows:** 2 of 3 as written; I1 and I2 pass (806 entries, 57.7 KB, `--check` names the first stale entry).
  I3 asked for `pnpm biome check` on files Biome's config excludes: the brief's error (rule B7).
- **Held-out rows:** 7 of 7.
- **Failure cause:** none in the code.
- **Side finding:** `let` function bindings (`tuner.js:186`) are not indexed; the brief said "named function constant".