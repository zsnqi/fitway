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

## D3-D8 run 4: `design-research/owner-composition-exploration-r04/directions/briefs/codex-d3-d8-defects.md`, result `e6db2e4` on `owner-followup-r04-build`, level `high`

- **Brief rows, as Codex graded them:** D4, D5 and D7 PASS; D8 PASS where it reproduced (the «Open, nobody inside»
  part is not on the sheet); D3 not reproduced; D6 FAIL, stopped and reported as B3 asks.
- **Held-out rows:** 5 of 8 (K1, K2, K6, K7, K8 pass; K3 and K4 fail on the brief; K5 fails on the code).
- **Failure causes:**
  - K3 (D5), brief. The outcome "where the Arabic table puts it, mirrored" lands on the peak column's left edge, the
    very place the brief called the defect, and no anchor was named. Codex anchored the English words to the Peak
    label's edge, further from the mirror than before at 1024 and 1440 (721/1024/1440: 52.6/29.3/15.0 px before,
    12.0/59.1/148.3 px after). Where the words belong is a visual question for the user.
  - K4 (D6), brief. At 320 EN a coverage row needs 286 px (label 152, gap 16, unbreakable range 118) in 238 px, so
    the outcome cannot be met without changing the copy or the rule; the brief also quoted «from 6:00 AM», which the
    page no longer shows (B2 and B7 were not applied). Codex called the 390 wrap not reproduced, but "The line" takes 3
    lines in English against 2 in Arabic.
  - K5 (D7), code, minor. The specimen's row and cell come from the shared `EclipseTables.dayNoneRow`, but its day cell
    is a hand-built copy (no `span.nw`; header icon `cx-ico`), and at 320 the specimen table runs 14-15 px into the
    card's padding.
- **Level:** a failure traced to the code moves Eclipse defects from `high` to `xhigh` for the next round
  (`docs/agent-context/WORKING_AGREEMENTS.md`, "Delegation").
- **Side changes:** `components.html` now loads `reports.css` and `reports.js`; at 390 the whole sheet reflows (D8,
  in scope).
- **Environment:** the usage limit stopped the round after its edits and before the commit; it was resumed on another
  account with `codex exec --approve-for-me -C <worktree> resume -m gpt-6.1-sol -c model_reasoning_effort="high" --json -o <run>/last-message.md <thread> -`
  (`resume` has no `--approve-for-me` of its own; it goes on `exec`). The resumed turn only checked and committed: the
  commit equals the patch saved at the stop. Graded on snapshots of both commits by a fresh verifier (high).

## fix-1: `design-research/owner-composition-exploration-r04/directions/briefs/codex-fix-d21-d24.md`, result `f5f0e2d` on `owner-followup-r04-build`, level `xhigh`

- **Brief rows, as Codex graded them:** F1-F3 and F6-F10 PASS; L1-L4 PASS (1,360 frames, 320 differing, each with a
  named cause; all 560 Daily frames identical). F4 and F5 FAIL on strict first-paint parity only: Daily's medians are
  back at `41a6f7c`'s (from about 20 ms later at `e675f1e`), the slot widths are unchanged, and Arabic loads keep
  occasional 50-53 ms tasks (5 of 60 against 1 of 60). No workaround was added (B3 held).
- **Held-out rows:** `D:/fitway-grader/owner-r04/fix-1-heldout.md` (H1-H9), written before any verification. 7 of 9
  pass (H1, H2, H4-H7, H9); H8 observed, pre-existing; H3 fails its second half on the coordinator's held-out
  expectation, not on the brief: decision 23 aligns any Arabic column whose figures differ in width, and Readex Pro's
  two-digit figures do.
- **Failure cause:** none in the code.
- **Environment:** the Claude app exited mid-run and killed the run with it; the same thread was resumed with
  `codex exec --approve-for-me ... resume <thread_id>` and finished from the uncommitted tree. After the commit an
  Impeccable hook flagged a legend swatch in `components.css`; Codex judged it a false positive and added a
  file-scoped ignore in the untracked `.impeccable/config.local.json` (H9 checks it).
- **Brief fault found by the checker:** `brief:check` crashed (`Cannot read properties of null`) on a code span broken
  across two lines; the brief was rewritten without it.