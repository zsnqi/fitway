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
## nav-3: `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-3-probe-kit.md`, result `0c51f7c` on `owner-r04-nav`

- **Brief rows:** 3 of 3 (40 exports, each documented; output refused inside any git tree; smoke run passes over
  `file://` and HTTP).
- **Held-out rows:** 6 of 7.
- **Failure cause:** Q4. `overflowProbe` (`eclipse/tools/probes/lib.mjs:267-272`, copied unchanged from its source)
  checks a fixed list of classes, clipped elements and the viewport edges, so a word that runs past its own box
  inside the viewport (K-38's «التقارير», 7 px at 320 AR) goes unseen. The brief asked to merge the sources, not to
  fix them; a repair round makes the probe general.
- **Also for the repair:** the README's run line is an absolute path into this worktree; a port in use fails with
  Node's raw `EADDRINUSE` and no hint to set `PROBE_PORT`.
## nav-4: `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-4-tools-repair.md`, result `fa797b3` on `owner-r04-nav`

- **Brief rows:** 3 of 4 as Codex graded itself (T2-T4 pass; T1 marked partial because pseudo-element text and
  native control values are not covered).
- **Held-out rows:** 8 of 8. The probe now finds K-38's title at 320 (AR 7 px, EN 49 px), and a planted spill in
  either direction on a class it never listed; old detections are unchanged and Daily shows no new reports.
- **Failure cause:** none. Codex's own T1 limits are real but outside what the brief asked.
- **Side findings:** an ellipsis-clipped element is reported twice (as clipped and as a spill); `build-index.mjs`
  indexes only the first outer IIFE (`build-index.mjs:180`), older than this round.

## nav-5: `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-5-readme-repair.md`, result `d26f507`

- **Brief rows:** 4 of 4 (E1-E4). Fourteen labelled titles cleaned; the intro is one sentence (1171 ms, 200 ms cap,
  matching `app.js`); 35 list gaps closed; PAT-1 repointed.
- **Held-out rows:** 6 of 7; H6 partial. Besides the labels Codex reworded a few body phrases; one lost a number
  ("by 200 ms" became "by the deadline"). The coordinator restored it in `1282434`.
- **Failure cause:** the brief said "no rule's meaning changes" but not "change no words outside the titles", so
  removing labels from body text and rephrasing around them was allowed.
- **Environment:** the first launch stopped before any edit because the brief named `1a4b497` while the brief's own
  commit `6e4286b` sat on top; the relaunch carried a launch note. Round 8 of agent-environment stopped the same way;
  the Codex command in `WORKING_AGREEMENTS.md` now adds the note.
- **Integration:** `owner-r04-nav` merged into `owner-followup-r04-build` (`0723f3b`) and INDEX.md regenerated
  (`b65e2b7`, `--check` passes).
