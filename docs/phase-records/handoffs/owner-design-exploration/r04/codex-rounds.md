# owner-design-exploration-r04: Codex rounds as evaluations

One entry per round: the brief, brief rows passed, held-out rows passed, the failure cause, and the repeat fault:
whether a brief-caused failure was already covered by a brief rule (DECISIONS "How this milestone's rounds run" item 3)
when the brief was written. A repeat means the rule failed or was not applied, and is a brief-rule defect to fix
(the user, 2026-10-04: held-out pass rates track the task's kind, not round order, so only repeats test the rules). The held-out
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
- **Repeat fault:** not checked.

## nav-2: `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-2-index.md`, result `25795c9` on `owner-r04-nav`

- **Brief rows:** 2 of 3 as written; I1 and I2 pass (806 entries, 57.7 KB, `--check` names the first stale entry).
  I3 asked for `pnpm biome check` on files Biome's config excludes: the brief's error (rule B7).
- **Held-out rows:** 7 of 7.
- **Failure cause:** none in the code.
- **Side finding:** `let` function bindings (`tuner.js:186`) are not indexed; the brief said "named function constant".
- **Repeat fault:** not checked.

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
- **Repeat fault:** not checked.

## nav-4: `design-research/owner-composition-exploration-r04/directions/briefs/codex-nav-4-tools-repair.md`, result `fa797b3` on `owner-r04-nav`

- **Brief rows:** 3 of 4 as Codex graded itself (T2-T4 pass; T1 marked partial because pseudo-element text and
  native control values are not covered).
- **Held-out rows:** 8 of 8. The probe now finds K-38's title at 320 (AR 7 px, EN 49 px), and a planted spill in
  either direction on a class it never listed; old detections are unchanged and Daily shows no new reports.
- **Failure cause:** none. Codex's own T1 limits are real but outside what the brief asked.
- **Side findings:** an ellipsis-clipped element is reported twice (as clipped and as a spill); `build-index.mjs`
  indexes only the first outer IIFE (`build-index.mjs:180`), older than this round.
- **Repeat fault:** not checked.

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
- **Repeat fault:** not checked.

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
- **Repeat fault:** repeats B2 and B7, not applied to the brief (K4 above).

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
- **Repeat fault:** none (no brief-caused failure).

## card-1: `design-research/owner-composition-exploration-r04/directions/briefs/codex-busiest-card.md`, result `0fcd3e3` on `owner-followup-r04-build`, level `high`

- **Brief rows, as Codex graded them:** C1-C5 and L1-L6 PASS (224 Daily and 32 sheet phone frames changed, all in
  scope; 704 full-page frames byte-identical to `bd8bada`; 44 auxiliary crop differences classified in
  `D:/fitway-temp/owner-r04-card-1/work/pixel-comparison.json`). Report: `D:/fitway-temp/codex-runs/owner-card-1/`
  (the round's long report is the largest `agent_message` in `events.jsonl`; `last-message.md` holds only the
  hook exchange below).
- **Held-out rows:** `D:/fitway-grader/owner-r04/card-1-heldout.md`, 8 of 9 (H1-H8 pass; H9 fails). Graded by the
  review of `436fe40` (`D:/fitway-temp/owner-r04-review-436fe40/REPORT.md`, verifier at `high`).
- **Brief rows, as the review graded them:** C1, C3-C5 and L1, L2, L4-L6 pass; C2 and L3 fail.
- **Failure causes:**
  - C2, code, edge case: a window crossing 720 px during the computer's intro keeps «6–7 م» beside «بمعدّل 51»;
    the intro's end restores the markup it saved at its start, after the card was filled (`app.js:2851`, `:2866`,
    `:897`).
  - L3, code and brief: an hour across noon or midnight («11 صباحًا – 12 مساءً», "11 AM – 12 PM") runs into the
    average at 320-390 px. C2 made the value longer, but the brief named only today's hour for L3, never the
    widest value the card can hold.
  - H9, the design, not the code: the average reads as part of «آخر 7 أيام» above it. Codex built the drawn
    variant; the question goes to the user.
- **Repeat fault:** none (no rule covered the widest value; B9 added).
- **Environment:** after the commit an Impeccable hook flagged `.sw-line` in `style.css`; Codex judged it a
  false positive and tried to amend with an ignore in `.impeccable/config.json`. Codex's own approval review
  rejected the amend as out-of-scope shared configuration; the commit stands as made and the finding is left
  standing. Codex reported one stale sheet caption it left under L2: decision 20's caption still says "hours
  beside the title".

## touch-1: `design-research/owner-composition-exploration-r04/directions/briefs/codex-touch-native.md`, result `38a86cd` on `owner-r04-touch-fix`, level `high`

- **Brief rows, as Codex graded them:** T1-T4, L1, L2 and L4-L6 PASS (400 desktop and 56 phone-at-rest frames;
  rest comparisons with no persistent difference). L3 FAIL on its literal text: the previous-time button moves
  7:42 PM to 7:30 PM (12 minutes), as the baseline does; preserved under B7. Pinch was shown only by CDP
  emulation (scale 1 to 1.0066); device zoom parity is unproved. Report:
  `D:/fitway-temp/codex-runs/owner-touch-1/last-message.md`.
- **Held-out rows:** `D:/fitway-grader/owner-r04/touch-1-heldout.md`, 9 of 9. Graded by the review of `436fe40`.
- **Brief rows, as the review graded them:** all pass, L3 included as CHT-15 states it ("one stop"; the stops are the
  half hours, the peak and the latest reading).
- **Failure causes:**
  - L3, brief: it asked for "one half hour", carried from decision 20's wording, where the baseline steps one stop
    (7:42 PM to 7:30 PM). Codex met the literal text where it could, reported the contradiction, and kept the
    baseline (B3, B7), without inferring the intent.
  - T2, brief: "it may trail the finger" set no bound. A drag at normal speed leaves the reading 7 stops behind at
    390 and 10 at 320, and it does not catch up when the finger stops (`app.js:1877`); `bd8bada` had none. The
    held-out H3 used a slow drag and missed it too.
- **Repeat fault:** repeats B7 (L3: the baseline did not meet "one half hour" at the latest reading; not applied).
  T2's open allowance is new; B8 added.
- **Folded on merge (`436fe40`):** OWN-D7 now names the slide from the top, and MOT-11 no longer promises that
  a reduced-motion flick stops at release, as touch-1 reported.

## fix-2: `design-research/owner-composition-exploration-r04/directions/briefs/codex-fix-2-review-436fe40.md`, from `5855094` on `owner-followup-r04-build`, level `xhigh`

- **Scope:** the review of `436fe40` (F1-F3, F5-F8) and decisions 27-28: the phone card's form, one period word per
  hour range at every width, the held reading's catch-up, the tap on the peak's ring, the resize during the intro, and
  the sheet's gaps and caption. First brief written under B8 and B9.
- **Level:** `xhigh`, because card-1's C2 and L3 failures traced partly to the code.
- **Held-out rows:** `D:/fitway-grader/owner-r04/fix-2-heldout.md` (H1-H11), written before the run.
- **Brief rows, as Codex graded them:** K1-K3, K5-K8 and L1-L6 PASS; K4 FAIL. Result `ac3ae02`. Report:
  `D:/fitway-temp/codex-runs/owner-fix-2/last-message.md`; evidence `D:/fitway-temp/owner-r04-fix-2/`.
- **K4 as Codex reported it:** every drag visits all 40 stops in order with no skip or overshoot, but the reading
  reaches the finger's stop in 93-143 ms at 500 px/s and 360-477 ms at 1000 px/s (390 and 320). The brief's two
  requirements conflict at 60 Hz: 39 transitions with each stop shown for a frame need about 650 ms, more than a
  1000 px/s sweep plus 250 ms allows. Codex reported the conflict and relaxed nothing (B3). The coordinator wrote
  both requirements and did not check them together against the frame rate (B8's reachability check, not applied).
- **Held-out rows:** `D:/fitway-grader/owner-r04/fix-2-heldout.md`, 9 of 11 (H6 fails: 1000 px/s takes 333-452 ms;
  H7 partial: reversal drags not run). Graded by `D:/fitway-temp/owner-r04-fix-2-verify/REPORT.md` (verifier at
  `high`), which confirms every other brief row and K4's conflict: the build is within about 30 ms of the 60 Hz floor.
- **Failure cause:** K4, brief. Two literal requirements (every stop shown for a frame; on the finger's stop within
  250 ms of a 1000 px/s drag) cannot both hold at 60 Hz. Side findings the brief did not cover: the sheet's computer
  specimen still draws the trial form (K8 named only its caption); the ring's tap area is the drawn ring only.
- **Repeat fault:** repeats B8 (written for this round's brief and not applied to K4's bound).
- **Environment:** the first account's five-hour limit stopped the run before any commit; the coordinator stopped it,
  saved the tree as `stopped-at-usage.patch`, and resumed the same thread on another account (`events-resume.jsonl`).
- **Outside the round:** the coordinator added `style.css` to the untracked `.impeccable/config.local.json` ignore for
  `border-accent-on-rounded`, after the review confirmed `.sw-line` a false positive.

## fix-3: `design-research/owner-composition-exploration-r04/directions/briefs/codex-fix-3.md`, from `41de51d` on `owner-followup-r04-build`, level `xhigh`

- **Scope:** decision 29 (the computer card's «المعدّل 51», the peak's tap area) and the fix-2 review's remaining
  findings: the page moving during a hold (cause unknown), one chart-card height in every state, the sheet's computer
  specimen and wording. The last fixes before the user tries Daily and Reports on a device.
- **Held-out rows:** `D:/fitway-grader/owner-r04/fix-3-heldout.md` (H1-H8), written before the run.
- **Brief rows, as Codex graded them:** M1, M2, M5, M6 and L1-L6 PASS; M3 FAIL on its literal text only (the
  drift is gone: the hidden desktop tooltip widened the phone layout at the missing-reading stop; the remaining
  movement is decision 26's slide at the hold's start, which M3's "does not change" forgot); M4 FAIL at widths between
  320 and 720 (320 EN fixed; the no-history legend needs two rows where live needs one, a legend-layout question).
  Result `4e0be02`. Report `D:/fitway-temp/codex-runs/owner-fix-3/last-message.md`.
- **Held-out rows, failure cause and repeat fault:** pending its review (`D:/fitway-temp/owner-r04-fix-3-verify/`).
  M3's wording is the coordinator's brief fault (B8: the intent was beside it, the slide exception was not).
