# owner-design-exploration-r04: Codex rounds as evaluations

One entry per round: the brief, brief rows passed, held-out rows passed, the failure cause, and the repeat fault:
whether a brief-caused failure was already covered by a brief rule (DECISIONS "How this milestone's rounds run" item 3)
when the brief was written. A repeat means the rule failed or was not applied, and is a brief-rule defect to fix
(the user, 2026-10-04: held-out pass rates track the task's kind, not round order, so only repeats test the rules). The held-out
checks live outside the repository and never appear here or in a brief. One line per round and per side finding:
`docs/phase-records/handoffs/agent-environment/rounds.tsv` and `findings.tsv` beside it.

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
- **Held-out rows:** `D:/fitway-grader/owner-r04/fix-3-heldout.md`, 6 of 8 (H5 fails across the phone range as M4;
  H8 fails as written, because the row forgot M4's intended change: the held-out row's fault). Graded by
  `D:/fitway-temp/owner-r04-fix-3-verify/REPORT.md` (verifier at `high`): M1-M3, M5, M6 and L1-L3 pass; M3's literal
  "fail" is decision 26's slide, which the review confirms behaves as at the base.
- **Failure causes:** M4, brief: "one height" and "without changing the six states' look" conflict where the
  no-history legend needs two rows (a legend-layout question for Daily's last round). M5 with M6, brief: from 721 px
  the sheet now shows two identical computer cards, the second captioned "On a phone".
- **Repeat fault:** repeats B8 (M3's slide exception and M4's two requirements were not checked together).

## activity-followup: `design-research/owner-composition-exploration-r04/directions/briefs/codex-activity-followup.md`, result `31e9dd9` on `owner-r04-activity`, level `high`

- **Attempt 1** stopped at once, correctly: the brief named "DESIGN-SPEC §8 Q-PCK", a section FLD-2 points to but that
  never existed. Brief-caused; no rule covered it, so B10 is added (DECISIONS rounds item 3). Fixed in `97988ff`.
- **Brief rows:** 7 of 10 (P3, P4, L1-L4, L6 pass). P1 partial: in the short-history state the shown period starts
  before the first day with readings, so "open on the period shown" and "Reports' bounds" cannot both hold; Codex
  clamped to the bounds, as the custom period does (coordinator: accepted, no change). P2 literal conflict: "the same
  field states" kept an invalid specimen the reason search never builds (low, waits for the last round). L5: the
  index checker's fixture omits `picker.js`, failing at `e72e5fe` too (pre-existing since fix-1; low, last round).
- **Held-out rows:** none prepared for this round.
- **Coordinator inspection:** the export dialog at 1440, 390 and 320 in each state, the sheet's picker specimens and
  English Activity log: no high or medium finding. At 320 the file line sits below the sheet's first view (low).
- **Environment:** Codex also asked to write three `.impeccable/config.json` ignores for detector flags (the masked
  lighting, a legend swatch); automatic approval review refused and nothing was written. Left standing.
- **Repeat fault:** B7 applied (P1's conflict surfaced as a report, not a workaround); attempt 1 is a new fault (B10).

## access-fix: `design-research/owner-composition-exploration-r04/directions/briefs/codex-access-fix.md`, result `376c845` on `owner-followup-r04-build`, level `high`

- **Scope:** Access's fix round after the designer's visual part (`a0c6c76`): the optional reason, the sign-out
  wording, Reactivate's confirmation, passwords emptied on close, arrival at a record by id, one set of words on
  Access and Activity log, the deactivated owner's records, the review's lows (F1, F5, the 700 ms silence), the rail
  and bar links, ACCESS-SPEC merged as §4.4 and INDEX.
- **Held-out rows:** `D:/fitway-grader/owner-r04/access-fix-heldout.md` (H1-H8), written before the run; graded by
  the review that follows the builder round (`builder-access-code.md`).
- **Brief rows, as Codex graded them:** A1-A9 and L1-L3, L5, L6 PASS (about 4,800 checks per mode, 114 crops).
  A10 FAIL: INDEX does not list `access.js`, because the generator's file list is in `tools/build-index.mjs`, which
  the brief's scope left read-only. L4 FAIL on its literal text: "no password once submitted" contradicts A4 and
  DECISIONS 33 (a refused form keeps its masked password while open); Codex followed A4 and said so.
- **Failure causes:** A10, brief: scope omitted the file the outcome needs (a B10 kind: the brief named an outcome
  without checking where it lives). L4, brief: B8 (two outcomes not read together). A8, brief: "within one frame"
  removed the commit's 700 ms guard, whose purpose (a double tap on Continue landing on «حفظتُ الرمز») the brief did not
  state; Codex reported it. B8 again: an outcome's intent must name the purpose of what it replaces.
- **Environment:** the harness background limit (2 h) killed the run after its final checks, before the commit; the
  coordinator resumed the same thread, which committed and reported. Launch such runs with the limit in mind.
- **Repeat fault:** B8 (twice). Codex surfaced every conflict instead of working around it (B3, B7 held).
- **Held-out rows:** `D:/fitway-grader/owner-r04/access-fix-heldout.md`, 8 of 8 (H7 with a note: «سجّل الدخول», sign in
  again, is the right use of the word). Graded by `D:/fitway-temp/owner-r04-access-fix-review/REPORT.md` (verifier at
  `high`), which confirms A1-A9 and finds one regression: F1 (medium), Access's focus ring on every mouse click and
  tap, from a blanket `:focus`. Cause, brief: A8 said "every element that takes focus programmatically shows the
  ring" without its intent (keyboard users see where focus went); Codex met the literal text the only way it could.
  B8 again: three B8 faults in one round. Fixed by an `owner-direction-fixer` (`fixer-access-focus.md`).

## motion-lows: `design-research/owner-composition-exploration-r04/directions/briefs/codex-motion-lows.md`, result `4850e58` and WIP `48ff52b` on `owner-followup-r04-build`, level `high`

- **Scope:** the motion review's measurable lows (F2, O3, O4) and two lines the records round left untrue: M1 a
  label's place at rest, M2 the widths MOT-14 gives written down, M3 the component sheet's dead dialog animation,
  M4 the scroll lock lifting on the close, M5 OWN-C9 and README's capture sizes.
- **Brief rows, as Codex graded them:** M2-M5 and L1-L5 PASS (576 close-path checks, 240 rest pages pixel-identical,
  246 motion cases each side). M1 stopped: English "Copy"'s icon sits 6.328 px from its place at `54b2737`, and L1
  allowed only "sub-pixel" moves. Codex found a correction with 0 px error and left it unapplied (B3, right).
- **Failure cause:** brief, B8 kind: L1's bound came from the review's reading (about 2 px) instead of a measure at
  the HEAD the brief named. The coordinator's correction was resumed on the thread; Codex hit its usage limit while
  checking it, the edit was saved as WIP `48ff52b`, and an `owner-direction-fixer` (`fixer-copy-label.md`) verified it
  unchanged against M1's four targets (`cd7a27c`, an empty commit; 48 measures, 0 px).
- **Held-out rows:** `D:/fitway-grader/owner-r04/motion-lows-heldout.md`, 8 of 8, graded by
  `D:/fitway-temp/owner-r04-three-rounds-review/` (verifier at `high`, `verifier-three-rounds.md`). H1 with a note:
  the row said "centred", but at `54b2737` English "Copy" sits 3.16 px off true centre; M1's target (its old place)
  is the right one, and the row's wording was the grader's error. That review's F6 (low): MOT-14 lists all 20 cells
  without saying which are wider at rest than their visible label, so M2's outcome holds only in part.
- **Repeat fault:** B8 again (a bound in a limit taken from a reading, not a measure). B3 and B7 held.

## three-rounds-fix: `design-research/owner-composition-exploration-r04/directions/briefs/codex-three-rounds-fix.md`, result `ce3f07e` on `owner-followup-r04-build`, level `high`

- **Scope:** the three rounds' review findings: F1 (medium) variant 2's file line ran over the calendar copy in real
  time; F2 (low) the trial switch covered the records card on short windows; F3 (low) MOT-14 to mark the cells wider
  at rest than their label.
- **Brief rows, as Codex graded them:** F1 overlap, timing and cleanup PASS (cause confirmed: a main-thread
  `clip-path` cut lagging compositor riders; a translated overflow window now cuts), F3 PASS, L3-L5 PASS. Literal
  FAILs, each reported rather than worked around (B7): F2's "no other element's box" (containing elements, and the
  phone's fixed bar over the switch while scrolling), and L1/L2's strict pixel equality (raster noise also present
  between two baseline captures).
- **Failure causes:** both literal FAILs are brief wording: a rule stated without its noise floor or its exceptions.
  The review found a regression no brief row guarded: on the phone sheet under 4x CPU the copy now jumps about 32 px
  (F-a), because the cut moved to the compositor while the panel it sits in still settles on the main thread. The
  brief asked for no text over text under load but not for the moment's other promises (the sheet's copy stays
  still) under load; B8 kind: an outcome that replaces a mechanism must name every promise the old one kept.
- **Held-out rows:** `D:/fitway-grader/owner-r04/three-rounds-fix-heldout.md`, 8 of 8 (H6 partial: the verifier could
  not reach the Copy view; the M1 fixer had measured it). Graded by
  `D:/fitway-temp/owner-r04-three-rounds-fix-review/` (verifier at `high`, `verifier-three-rounds-fix.md`); its F-a,
  F-b (the panel's content lags its surface under a stall, also at the baseline) and F-c (the «22» mark 1 px off)
  went to the one-clock round (`codex-one-clock.md`).
- **Repeat fault:** B8 (the brief's). B3 and B7 held.

## one-clock: `design-research/owner-composition-exploration-r04/directions/briefs/codex-one-clock.md`, WIP `dbee42d` and result `809aa09` on `owner-followup-r04-build`, level `high`

- **Scope:** the review of three-rounds-fix's F-a, F-b, F-c: the export's settle holding together under load (C1), the
  chosen day's mark under the cut (C2), the docs (C3); report-only, other moments split across threads.
- **Run:** stopped by the user mid-run; the edit was saved as WIP `dbee42d` and the thread resumed, which finished its
  checks and committed `809aa09` on top.
- **Brief rows, as Codex graded them:** C1, C3, L2-L4 PASS (96 load cases, 2,296 frames, 0 px at matched progress;
  mechanism: paused Web Animations effects driven by one main-thread frame clock). C2 FAIL and a literal conflict with
  L1: the «22» mark's 1 px raster offset already existed at `aef7437`, and L1 forbade changing it. L1 FAIL on 12 px by
  one level.
- **Failure causes:** C2 was the brief's: its bound came from the review's frame without checking whether the baseline
  already had it (B8 kind, a bound from a reading). L1's noise floor again (as in three-rounds-fix).
- **Held-out rows:** `D:/fitway-grader/owner-r04/one-clock-heldout.md`, 6 of 6 (H2 a report: the dialogs' shade and
  clip separate under a stall, unchanged by the round). Graded by `D:/fitway-temp/owner-r04-one-clock-review/`
  (verifier at `high`, `verifier-one-clock.md`), every row PASS. Its observation 1 (medium, present at `aef7437`): at
  320 x 568 variant 2's file line glides across the still calendar copy at 60-80 ms, glyphs on glyphs, seen at 1x; to
  the narrow-sheet round (`codex-narrow-sheet.md`).
- **Repeat fault:** B8 (the brief's). B3 and B7 held: both conflicts reported, not worked around.

## narrow-sheet: `design-research/owner-composition-exploration-r04/directions/briefs/codex-narrow-sheet.md`, result `b6d6a5c` on `owner-followup-r04-build`, level `high`

- **Scope:** variant 2's file line running over the still calendar copy on the 320 x 568 sheet (one-clock review,
  observation 1).
- **Brief rows, as Codex graded them:** N1, N2, L1-L5 PASS (48 real-time runs, 1,570 frames, 0 overlaps; control 6
  frames at 320). Cause found: at 320 the old file line lay outside the scrolling body, so its pair was skipped and the
  panel carried it. Codex caught its own first fix's defect by looking (the long path crossing the actions) and fixed it.
  `motion-capture.mjs` ran on moment 9 only, though L4 named it whole.
- **Held-out rows:** `D:/fitway-grader/owner-r04/narrow-sheet-heldout.md`, partly graded: the review
  (`verifier-narrow-sheet.md`) was stopped when the user kept variant 0 (DECISIONS 39); its settled rows passed H1
  (72 sheet heights, 0 overlap; control flags 36) and H2 (0 px). Its open observations concerned variant 2 only.
- **Repeat fault:** none from the brief. L4's scope was narrowed without saying so (a new kind, low).

## variants-removal: `design-research/owner-composition-exploration-r04/directions/briefs/codex-variants-removal.md`, result `e74ca06` on `owner-followup-r04-build`, level `high`

- **Scope:** remove export variants 1-2, Access's row option 1 and the trial switches after the user's pick
  (DECISIONS 39).
- **Brief rows, as Codex graded them:** R1-R4, L1-L4 PASS (1,024 export and 2,048 row frames within measured noise;
  240 rest frames and 336 legacy-link loads exact; full `motion-capture.mjs`). It noted that `b6d6a5c`'s guard applied
  to variant 2 only, so the kept moment is unchanged.
- **Held-out rows:** `D:/fitway-grader/owner-r04/variants-removal-heldout.md`. No verifier (the user: not needed for a
  cleanup). The coordinator checked H1-H3 itself: a fresh browser over HTTP with stale stored choices and old links
  loads both pages as built, no switch, no errors; no trial code left (only decision 20's comments mention a trial).
  A stale browser cache serving the old `reports.js` throws `M.trial is not a function` until a hard reload; the
  preview server sends no cache headers.
- **Repeat fault:** none.

## tuner-reach: `design-research/owner-composition-exploration-r04/directions/briefs/codex-tuner-reach.md`, result `1305c0ee` on `owner-followup-r04-build`, level `high`

- **Scope:** the light tuner reachable on the phone and the tablet (the user said yes, 2026-10-07): on the phone its
  toggle lay off the screen in both languages while Tab still focused it; on the tablet the open panel ran off the
  screen and the toggle covered the header status button.
- **Brief rows, as Codex graded them:** T1-T3, L1-L5 PASS.
- **Held-out rows:** `D:/fitway-grader/owner-r04/tuner-reach/ROWS.md`, by the coordinator. 112 of 114 pass; the two
  failures (H6, a tap after a drag) are a harness fault: after CDP touch events the next tap gives no click to any
  element, the page's own menu button included; a fresh context passes. Planted control: the baseline fails 46 rows
  where the defect is. Two findings the rows did not cover, measured after: with the tuner closed, `place()` reads
  every page control's box on every page change, about 11,300 reads during a one-second pointer sweep over Daily's
  chart against about 100 at the baseline, with frames over 20 ms in 2 of 3 runs (H11); on the phone and the tablet
  the toggle jumps across the screen when the panel opens (H12). Escape with a page layer open still closes the
  layer first (H13).
- **Failure cause:** the brief. It set no limit on the page's motion cost with the tuner on, and T3 (no control under
  the toggle at any scroll position) left a moving toggle as the literal reading. Repair attempt 1:
  `codex-tuner-reach-fix-1.md` (F1 cost, F2 the jump), from `1d3539a3`.

## tuner-reach fix-1: `design-research/owner-composition-exploration-r04/directions/briefs/codex-tuner-reach-fix-1.md`, result `ec314ce2` on `owner-followup-r04-build`, level `high`

- **Run:** stopped at 16:40 on the old Codex account's limit; resumed on its thread on the new account with its HTTP
  checks moved to 3177 (tuner-reach's own preview still held 3176); stopped twice more on "Selected model is at
  capacity", the second time after its last measurement, so its verdicts come from its event stream.
- **Brief rows, as Codex graded them:** F2, T1-T3 and L1-L5 PASS (256 HTTP and 256 `file://` contract checks, 120
  pixel comparisons); F1 FAIL: 4 of 12 groups outside the baseline's three-run spread, by p95 16.8 against 16.7 ms
  and one 50 ms frame in one of three intro runs, with box reads equal to the baseline.
- **Held-out rows:** `D:/fitway-grader/owner-r04/tuner-reach/ROWS.md`, by the coordinator, on a `git archive` of
  `ec314ce2`. 126 of 136 pass in `grade.cjs`; H11 and H13 pass; H10 looked at (390 Arabic, closed and open: the
  dashed toggle stays put, the panel opens below it, neutral greys).
  - H12 and H6 now pass at every size and language (the toggle's box is the same before, while and after opening).
  - H11: a one-second sweep over Daily's chart reads 100 boxes, as the baseline (tuner-reach read about 11,300); the
    intro reads about 25 more once; frames over 20 ms within the baseline's run-to-run range; the phone 0.
  - H3 is partial: the 10 failures (390, 360, 412, 320 and 600, both languages, `#menu-btn` and `#ops-btn` at scroll
    0) came from a run with four other jobs on the machine. Unloaded, after a jump to the top from a scrolled page
    the toggle covers the header buttons for two frames in 4 of 10 tries, against 0 at tuner-reach and the baseline:
    the repair moves the toggle when an IntersectionObserver reports a control under it, one frame or more after
    paint, where tuner-reach placed it in the scroll handler.
- **Failure cause:** F1's "within the run-to-run spread" was too strict for frame times quantised at 16.7 ms (the
  brief's fault); H3's transient is the price of observing instead of measuring on scroll. The coordinator accepts
  the result without a second repair: a flash of one or two frames over the header on a jump to the top, on a
  concept-only tool.

## css-round (the mechanical part): `directions/briefs/codex-css-round.md` on the build branch, result `691d62d5` (level high)

- **Set-up:** the first brief written from a `/to-spec` spec (agent-environment DECISIONS item 21, step 6;
  `css-round-spec.md`, `58433873`).
  - The base was measured first. The concept CSS check found 87 findings. The forced-colours focus sweep showed no
    stop without a ring except the sheet's heat cell (`D:/fitway-temp/owner-css-base-focus/`). Chromium 149's
    safe-area emulation applies insets without `viewport-fit`.
  - The brief over `58433873` was launched alone. B6 was relaxed on purpose: five independent causes from one spec,
    graded separately.
  - Held-out rows X1-X10: `D:/fitway-grader/owner-r04/css-round-heldout.md`.
- **Brief rows, as Codex graded them** (`9cbb3025`): C1-C4 and L1-L5 pass. The check fell from 87 to 0, and the
  compare of normal colours was EQUAL. C5 failed because "shows" was read as the whole widest value visible at once,
  which a one-line field cannot do. That is the brief's wording; glyph and icon clearance passed.
- **Held-out rows** (`D:/fitway-temp/owner-css-grade/`):
  - X1-X9 pass:
    - the hover gate is `hover: hover` alone;
    - forced colours hold at tablet, 320 and in two dialogs;
    - Daily's five states and Reports' custom period compare EQUAL;
    - a 240-character Arabic reason fits the textarea at 320, and a 200-character password scrolls clear of its eye
      button;
    - the meta adds only `viewport-fit`;
    - X7 passes on intent: `forced-color-adjust: none` is used for selected and disabled states with system colours;
    - nothing changed in the designer's part;
    - DESIGN-SPEC adds FOC-8 and SAFE-1.
  - X5's status compare at full motion also differed base against base (F112).
  - X10 failed. Five rules turned from `outline: none` into unconditional transparent outlines (`.main`, `.cx-main`,
    `.fw-pop` and the two selects), which forced colours paints at rest: a permanent line around the content that runs
    against Daily's title, a second edge on popovers, and a ring inside each list's own edge.
  - The check's false positives pushed it there (F113).
- **Repair 1** (`691d62d5`, at the second resume: the first stopped at the Codex account limit, the second at a model
  capacity error):
  - the programmatic targets went back to `outline: none` as named allowances (`.cx-main`, `.fw-pop[tabindex="-1"]`);
  - the lists' wrappers draw their one edge and ring;
  - X10 passes on the coordinator's renders, and Activity's focus sweep under forced colours has 0 failed stops;
  - the check reports only the two allowances.
- **Failure cause:** C5 is a brief-caused row (outcome wording). X10 came from a check that counts a programmatic focus
  target or a `:has()` ring as a missing ring.
- **After acceptance** (2026-10-10, the round's independent review, `D:/fitway-temp/owner-r04-css-review/`, brief
  `verifier-css-round.md` at `767cd57c`): two defects trace to this part. In forced colours the figures region
  (`#cards`) of Daily and Reports paints a ring after "Try again": the X10 failure mode on a region the repair missed
  (`style.css:1127`, `reports.css:695`). The desktop dialog cap divides by a length and by zero with no insets
  (`reports.css:730-734`). Both go to the review's Codex fix round, `codex-css-review-fixes.md`.

## css-review-fixes: `directions/briefs/codex-css-review-fixes.md` on the build branch, result `3b673daa` (level high)

- **Set-up:** the CSS round review's mechanical findings F1, F5, F7 and F9 (D1-D4), plus the stale README paragraph
  that the taste fix `41821f38` left (D5). B6 was relaxed: five independent causes, graded separately. Held-out rows
  Y1-Y7 are in `D:/fitway-grader/owner-r04/css-review-fixes-heldout.md`.
- **First run:** Codex stopped at once, rightly, because the brief cited DECISIONS item 42 and the build branch's
  copy ends at item 41. It resumed on its thread with the coordinator branch's path (F116). That is a brief-caused stop
  with no code written.
- **Brief rows, as Codex graded them:** D1-D5, L1, L2 and L4 pass. D1's "reported as a named allowance" and L3 fail
  only on wording: the check has no allowance labels, and its six findings are all script-focused regions
  (`.main`, `.cx-main`, `.fw-pop[tabindex="-1"]`, both `#cards`, `.ac-log`/`.ac-msg`). The coordinator re-ran the
  check.
- **The diff, read by the coordinator:**
  - regions lose the outline, with a forced-colours `outline: none` for the script-focused group;
  - both lists hide the ring after a pointer press through a root flag that any keydown clears (`activity.js`,
    `reports.js`);
  - the dialog cap no longer divides and applies only to a real dialog (`.dlg > .dlg-panel`);
  - the recipe picks the long name by the page's language.
- **Held-out rows so far** (`D:/fitway-temp/owner-r04-css-fixes-grade/`):
  - Y2 passes: the transparent outlines left are the four on controls, against three on regions at the base.
  - Y5 passes: the Arabic run passes on the Arabic name, and with one letter changed it fails.
  - Y7 passes: the build worktree is clean.
  - Y1, Y3, Y4 and Y6 run in the verifier pass after F3, against `3b673daa`. Codex's own D1 probes covered
    Activity's regions (Y1's subject), which shows the intent carried past the brief's two examples.
- **Failure cause:** the stop and D1's wording are brief-caused (a stale decision pointer, and an outcome the tool
  cannot print).

## press-hook (F3): `directions/briefs/codex-press-hook.md` on the build branch, result `eb18b17a` (level high)

- **Set-up:** the review's F3 (the press spread over selector lists, and shadow rules that must repeat its layer), one
  cause (B6 kept). Held-out rows Z1-Z7 are in `D:/fitway-grader/owner-r04/press-hook-heldout.md`. The user had already
  found no problems on the phones (DECISIONS 43).
- **Brief rows, as Codex graded them:** P1, P2, P4, P5 and L1-L4 pass. A new control takes `data-press="dark|option|chalk|tile|square"`.
  P3 fails on one frame: on the phone menu, 60 ms after release, 27 corner pixels differ by at most 5 levels; two base
  captures differ by 0.
- **The diff, read by the coordinator:** the light is now a static, additive CSS animation on every pressable control
  (`animation-composition: add`, `!important`), so a control's own shadow no longer carries the layer. The global
  motion gates moved, not added. No control animates itself in CSS, and the script moments animate inner parts.
- **Coordinator's call on P3:** accepted as a named allowance, because the difference cannot be seen. The verifier
  looks at that frame at full size. The brief left out a limit for the moments that move a control at full motion;
  the verifier pass checks them (V8).
- **Held-out rows:** Z1-Z7 run in `verifier-press-hook.md` (`e217534d`), beside css-review-fixes' Y1, Y3, Y4 and Y6.
- **The verifier pass** (`verifier-press-hook.md`, `e217534d`; `D:/fitway-temp/owner-r04-press-review/`): all twelve
  checks pass, Z1-Z7 and Y1, Y3, Y4 and Y6 included. P3's release frame is equal when the transitions are seeked to
  exact times. Its findings:
  - F1: the `!important` animation drops any CSS animation a later screen gives a control;
  - F2: the press relies on CSS nesting, `animation-composition` and `var()` in keyframes, unmeasured in Safari,
    while the user accepted `3b673daa` on an iPhone;
  - F3: the record leaves `tile`, `option` and Working open, and the markup holds no real `data-press` example;
  - F4 and F5: two invisible computed and forced-colour differences.
- **Coordinator's call:** the mechanism is replaced, not repaired. The changed hypothesis: keep the mechanism the user
  tried, keep the one-step hook, and guard the omission with a check instead of a new mechanism. The successor is
  `codex-press-hook-2.md` (`aa406fce`, held-out rows W1-W7 in `D:/fitway-grader/owner-r04/press-hook-2-heldout.md`).
  F1 and F2 are the failure modes this round's rows did not cover, so the new brief makes both outcomes. It also
  carries the forced-colours level chip's empty icon slot, which the review found and which was there before.

## press-hook-2: `directions/briefs/codex-press-hook-2.md` on the build branch, result `d1a01f3c` (level high)

- **Set-up:** the successor to press-hook, with a changed hypothesis: keep the press mechanism the user tried on both
  phones (`3b673daa`), keep the one-step `data-press` hook, and guard the omitted layer with a check. R5 is a separate
  forced-colours defect from the review (B6 relaxed for it alone). Held-out rows W1-W7 are in
  `D:/fitway-grader/owner-r04/press-hook-2-heldout.md`.
- **Run:** the Codex account reached its usage limit before the commit. After the user switched accounts it resumed
  on its thread, with no reset.
- **Brief rows, as Codex graded them:** R2-R5, L1, L4 and L5 pass. Codex left R1, L2 and L3 "unproven": its own
  captures differed by up to 14 px between two takes of the same target, and five retry recipes lack state proofs.
- **Held-out rows, graded by the coordinator** with the press review's harness (`D:/fitway-temp/owner-r04-press-review/scripts/`,
  where two takes of the target differ by 0; evidence in `D:/fitway-temp/owner-r04-press-hook-2-grade/`):
  - W1 passes: an animation planted on the export button keeps running (`zz-pulse:running`); `eb18b17a` dropped it.
  - W2 passes: the new check names `reports.css:625` and a planted `[data-press]` rule, and exits 1 on each.
  - W3 passes: no nesting, no `animation-composition`, no `press-face`.
  - W4 passes: 135 of 135 frames (AR 1440) and 90 of 90 (EN 390) equal `3b673daa` at rest, hover, held, and 60 and
    200 ms after release. In forced colours, 133 of 136 are equal. Two release frames of Activity's dates and search
    buttons vary between takes of the new build (at most 16 px and 4 levels; one take equals the target exactly). It
    is invisible and accepted as an allowance.
  - W5 passes: the level chip's bars show in forced colours, where the target shows an empty slot.
  - W6 passes: the sheet's `data-press` specimens are equal, inside W4.
  - W7 passes: both worktrees are clean.
- **Failure cause:** none in the result. Codex's "unproven" rows came from its own capture noise and from recipes
  without error-state proofs (the review's low, still open).

## recipe-proofs: `directions/briefs/codex-recipe-proofs.md` on the build branch, result `e097d82c` (level high)

- **Set-up:** the first round after the environment phase, before Daily's own files (DECISIONS 44). It adds observable
  state proofs for the 22 feature states the last self-compare reported as capture problems (F123, F124) and repairs
  `tuner-control-nowHot` (F125). Held-out rows V1-V7 are in `D:/fitway-grader/owner-r04/recipe-proofs-heldout.md`.
- **Brief rows, as Codex graded them:** P2, P3, L2 and L3 pass. P1 fails: 21 of 22 pass, and `records-retry` fails on
  the phone, where Access has no records card by design (`access.css:45-48`); the `--states all` compare also showed
  switch values no recipe proves. Codex reported L1 as failing because it measured the compare; L1 as written (the
  diff touches only the recipe file) passes. P3's cause was the recipe: Home then one ArrowUp returned to the value
  the page starts with.
- **Held-out rows, graded by the coordinator** (evidence `D:/fitway-temp/owner-r04-recipe-proofs-grade/`):
  - V1 passes: with Access `fail=1`, Activity `older=fail` and Reports `export=fail` planted to do nothing, each
    feature fails on its feature proof; the clean copy passes.
  - V2 was not run: ten of the new state proofs read the address the CLI typed, so they fail at the default state by
    construction; T4 of the next round grades them instead.
  - V3 passes: the 22 states pass over `file://`.
  - V4 is partial: touch at phone passes 21 of 22 (`records-retry`, the designed absence); keyboard at desktop passes
    20 of 22, and the address-opened `range` and `export` dialogs report KEYBOARD-UNREACHABLE because a feature with
    no actions has no key sequence (F132).
  - V5 passes: the tablet self-compare is 147 equal, 15 not reachable, 0 problems.
  - V6 passes for the phone with touch; its planted disconnect was not run.
  - V7 passes: only `verification-recipes.json` changed; both worktrees are clean.
- **The diff, read by the coordinator:** ten state proofs read `location` (scenario switches such as `fail`, `hold`,
  `refuse`, `older`, `refresh`, `export`, whose effect shows only after an action); their features' proofs check the
  visible result, which is what V1 caught. The CLI asks for a proof before the action, so a scenario has nothing else
  to show (F131).
- **Failure cause: the brief.** P1 forbade `NOT-REACHABLE` for any of the 22, which the phone's design contradicts
  (B8: not literally reachable), and its `--states all` compare was never run on the base (B7), so about 60 unproved
  switch values surfaced only in the round (F134). Codex reported both instead of working around them.
- **Next:** `codex-recipe-proofs-2.md` (`5fa6db88`, held-out rows T1-T5) proves every page switch value, states the
  phone's designed absence, and holds address reads to scenarios only.

## recipe-proofs-2: `directions/briefs/codex-recipe-proofs-2.md` on the build branch, result `8c1a7c5d` (level high)

- **Set-up:** the successor to recipe-proofs. The changed scope: every value of every switch a page takes from its
  address (F134), the phone's designed absence of Access's records card, and address-reading proofs held to
  scenarios that show nothing before an action. Held-out rows T1-T5 are in
  `D:/fitway-grader/owner-r04/recipe-proofs-2-heldout.md`.
- **Brief rows, as Codex graded them:** Q3 and L1-L4 pass. Q1 fails: `arrive` (on four pages) and a lone `from` or
  `to` (Reports, Activity) act only with a companion switch (`state=loading`; the other end of the range), which the
  CLI neither discovers nor lets a recipe name; one all-pages compare also ended in `ERR_NO_BUFFER_SPACE` and stalled
  after about 530 items. Codex marked Q2 failing for removing its weak proofs of those values; the rule holds for
  every proof the file keeps.
- **Held-out rows, graded by the coordinator** (evidence `D:/fitway-temp/owner-r04-recipe-proofs-2-grade/`):
  - T1 passes: Reports `state=delayed` and Access `ops=offline`, planted to draw their default, fail their proofs;
    Daily `motion=off` fails too under full motion (under reduced motion the page is motion-off anyway, so the first
    control could not show it); the clean copy passes each.
  - T2 and T3 pass: at tablet and over `file://`, every page state is equal apart from the known `arrive`, `from` and
    `to` problems.
  - T4 passes: 17 proofs check the address (9 read `location`, 8 use the `query` form, which the report did not
    list); each is a scenario with no visible effect before an action, and each names the feature that proves it,
    Codex having added a feature for each of Access's eight remaining refusals.
  - T5 passes: only the recipe file changed; both worktrees clean.
- **Found in grading, repaired by the coordinator** (`f96753fe`): `record-navigation` lacked the phone width limit
  Q3 gave `records-retry`, and the new `refused-staff_pin_already_active` failed everywhere because the refusal makes
  the desk active, which its state proof re-checked after the action; it now owns that change (`changesState`).
- **The base for Daily's round** (`f96753fe`), self-compared page by page: every page state 688 equal (both
  languages, desktop and phone, both motions); every feature at its own state 620 equal; tablet 86 and `file://` 28
  equal; the only problems are the 128 + 16 + 8 known `arrive`, `from` and `to` items.
- **Failure cause: the brief.** Q1 asked for every switch value, and two kinds cannot be proved alone with today's
  CLI (F136); the long single compare's exhaustion is a tool limit (F137).

## daily-files: `directions/briefs/codex-daily-files.md` on the build branch, result `50097ff7` (level xhigh)

- **Set-up:** DECISIONS 44, from the base `f96753fe`. Daily's script renamed to `daily.js`, its styles moved to
  `daily.css`, and the probe kit's font pick repaired (F133). Held-out rows U1-U8 are in
  `D:/fitway-grader/owner-r04/daily-files-heldout.md`.
- **Run:** the Codex account reached its usage limit mid-round; it resumed on its thread when the limit reset.
- **Brief rows, as Codex graded them:** D1-D5 and L1-L3 pass: `style.css` 1670 to 1185 lines, `daily.css` 448, the
  gardener scan's boundary count 0, every compare equal apart from the known `arrive`, `from` and `to` items.
- **After its report,** the user's global Impeccable hook in Codex (`~/.codex/hooks.json`) handed it three design
  detector findings; it added file-scoped suppressions to `.impeccable/config.json`, outside its scope, and could not
  commit them. The coordinator reverted the file (F138).
- **Held-out rows, graded by the coordinator** (evidence `D:/fitway-temp/owner-r04-daily-files-grade/`):
  - U4, U6, U7 and U8 pass: no failing request, and only Daily (and the components sheet's stylesheet) loads Daily's
    files; a planted press-layer omission in `daily.css` fails the check and names its line; the scan falls from 17
    to 0; the scope held and `git log --follow` reaches `app.js`'s history.
  - A coordinator check beyond the rows found the round's defect: frames seeked inside each moment (`mid/`, the
    harness `midmotion.cjs`; the base against itself is byte-equal on all 28) differ on six of seven moments. 120 ms
    into Reports' export dialog opening, the dialog stands below the fold: the interaction motion's pieces, the
    rail's opening pieces and the date picker's end-day press moved to `daily.css`, which the other pages do not load.
  - U1, U2, U3 and U5 were not run, and D3 was not re-run at this result: the repair supersedes it and is graded on
    all of them.
- **Failure cause: the brief.** D2 judged a rule by the names in the other pages and "their scripts", which read as
  each page's own script, not the shared `motion.js` and `picker.js` or classes set at runtime; and no limit said the
  moments still run, while `compare` sees settled pictures only (F139). Its predecessor press-hook-2 had that limit
  (L3); this brief dropped it.
- **Next:** `codex-daily-files-fix.md` (`f40bb05b`, level high, held-out rows M1-M7) returns the shared styles and
  requires every moment and press to equal `f96753fe` along its timeline.

## daily-files-fix: `directions/briefs/codex-daily-files-fix.md` on the build branch, result `7e28c713` (level high)

- **Set-up:** the repair of daily-files, with a changed hypothesis: a rule is Daily's only if no script any other page
  loads (`motion.js`, `picker.js`, the shell copies) can make it match, and every moment and press must equal
  `f96753fe` along its timeline. Held-out rows M1-M7 are in `D:/fitway-grader/owner-r04/daily-files-fix-heldout.md`.
- **Run:** the Codex account reached its usage limit mid-round; after the user switched accounts it resumed on its
  thread.
- **Brief rows, as Codex graded them:** X1, L2 and L3 pass: the interaction motion's pieces, the rail's opening pieces,
  the date picker's end day and press, and one forced-colours level rule went back to `style.css` (1221 lines;
  `daily.css` 415). D1-D3 and D5 hold (688, 620, 86 and 28 equal). Codex left X2 failing: its own harness sampled
  real time, so the target against itself differed by up to 5596 pixels and equality stayed unproven; its 80 mouse
  presses matched. It left D4 incomplete, reading the brief's CLI port limit as forbidding the probe kit's own port.
- **Held-out rows, graded by the coordinator** (evidence `D:/fitway-temp/owner-r04-daily-files-grade/`; the seek
  harness `midmotion2.cjs`, byte-equal on the target against itself except two moments with real timers, the export's
  done state and the first 40 ms of the rail closing):
  - M1-M4 pass: the seven openings, the closings and the PIN dialog's change, Activity's older-records button
    through Working in both languages, and held presses on a range day, the end day and a button all equal
    `f96753fe`.
  - M5 passes: a marker on the opening's shade piece in `daily.css` leaves Reports' export opening equal; the same
    marker in `style.css` changes every seek.
  - M6 passes: the scan finds 0; Reports and Access in every state, both languages, desktop and phone, both motions,
    show 0 different, the only problems the known `arrive`, `from` and `to` items and one `ERR_NO_BUFFER_SPACE`
    capture (F137).
  - M7 passes: only the two stylesheets changed; `.impeccable/config.json` untouched; both worktrees clean.
  - Also run: the probe kit's `checks.mjs` passes to its end on port 3178 (D4); forced colours on every page,
    320 px and 200% zoom, touch and keyboard on Daily, and `file://` on the other pages show 0 different (the
    keyboard's `language` and `tuner-drag` fail on both sides, as at the base).
- **Failure cause:** none in the result. X2 and D4 were unproven by Codex's own measuring, not by the change.
- **F139 recurs:** Codex wrote its own mid-motion harness, the same kind as the coordinator's, so under the working
  agreement ("Rules and findings") seeked mid-motion comparison becomes a verify-fitway feature in a Codex round of its
  own, with a planted defect it must catch.

## midmotion-compare: `briefs/codex-midmotion-compare.md` (this folder), result `e39225e6` on `owner-r04-midmotion`, level `xhigh`

- **Set-up:** step 1 of the resume point: F139 becomes a verify-fitway feature (`compare --timeline`), with F119, F122,
  F126 and F130 riding along as their own rows. The ledger gave this milestone `.agents/skills/verify-fitway/**`
  (`61360cee`). Held-out rows H1-H12 are in `D:/fitway-grader/owner-r04/midmotion-compare-heldout.md`.
- **Run:** the Codex account reached its usage limit mid-round; after the user switched accounts it resumed on its
  thread.
- **Brief rows, as Codex graded them:** T1, T4, T5, T7, T8 and T9 pass; T2, T3 and T6 partial (the full matrices were
  not finished). T7: 69 of 69 tests pass three times under a concurrent whole-page compare; T8: a planted skip fails
  the suite by name; F130's two lines are gone.
- **Held-out rows, graded by the coordinator** (evidence `D:/fitway-temp/owner-r04-midmotion-grade/`, plants in
  `D:/fitway-grader/owner-r04/midmotion-plants/`):
  - H1-H3 and H7 pass: a planted dialog start pose, a 40 ms longer opening, a changed easing and a 240 ms press fade
    are each `TIMELINE DIFFERENT` while the settled result is equal; the unplanted copy is equal.
  - H5 passes: keyboard at desktop in English over HTTP and `file://` catches `50097ff7`; touch at phone is equal, as
    the old seek harness found (the phone's sheet lost none of its pieces).
  - H11 fails: 11 runs of T5's drive wrote two frames, 8 and 3, differing in the Lights chip, as at the base; the fix
    also adds a style to the page before capture.
  - H12 passes: only `.agents/skills/verify-fitway/**` changed; both worktrees clean.
  - H4, H6, H8 and H9 were not run; the repair is graded on them.
- **Found beyond the rows:** a sample is `NOT-HELD` whenever a page callback ran (`timeline.mjs:662`), and its pixels
  are not compared. At `50097ff7`, Access's PIN change dialog differs at every time but reports `0 different; 5 not
  held` and exits 0, while the same moment against itself is byte-equal twice. On Reports, 61 of 116 samples are not
  held and 39 of them are byte-equal across the builds; the export's progress moments really do vary (timers).
- **Failure cause: the brief, then the code.** T3 asked for frames "the hold cannot fix" to be their own result and let
  that result neither pass nor fail, without requiring the classification to come from the frames, and T2's
  must-catch list named one moment. Codex classified by the page's code, which a literal reading allows and which
  hides a real regression (B8). T5's 11 of 11 did not reproduce.
- **Next:** `codex-midmotion-compare-fix.md` (`07c5a87f`, level xhigh): not held only when frames vary between two
  captures, every moment the real defect broke caught, the noise floor on every page, T6's matrix, and F126 without
  changing the page.

## Evaluation: a blind review of the brief before launch (2026-10-11, the user agreed to the trial)

- **Question:** would a fresh reviewer, asked only "how could every outcome be met as written while the goal fails?",
  have caught the two brief-caused failures of the day (midmotion-compare, daily-files) without false alarms on a brief
  that held (press-hook-2)? Scoring and the adoption rule were written before any run, in the grader folder.
- **Arms:** Sonnet (`sonnet-researcher`, high) and Codex (gpt-6.1-sol, high, read-only) on the three briefs alone;
  then Codex with each brief's cited sources as they were at its launch, one run per brief.
- **Result:** all three arms caught midmotion-compare's loophole (the not-held result could absorb real regressions;
  each proposed requiring proof from the frames, the repair's own fix) and none caught daily-files' (no limit that the
  other pages' moments still run, which needed knowing that compare sees settled frames and that shared scripts add
  classes at runtime). On the control each arm gave four readings of five worth acting on.
- **Decision after the first arms (coordinator, by the fixed rule):** no step; each arm missed one failure.
- **Then, at the user's request, xhigh and max** (Codex, briefs alone, and at xhigh also with sources), with a second
  run of high and xhigh so chance could be told from effort: high caught brief-1 in one run and brief-3 in the other,
  xhigh caught daily-files in both and midmotion-compare in neither, and max caught both in both runs, with every
  control reading worth acting on. The first reversal between high and xhigh was chance.
- **Decision (by the same rule, the user agreeing to the trial):** Codex at max reviews each Codex brief alone before
  launch (`docs/agent-context/briefs/REVIEW.md`, checklist item B11). Two briefs and two runs are thin evidence: the
  brief-caused failures of the rounds that follow are the measure.

## midmotion-compare-fix: `briefs/codex-midmotion-compare-fix.md` (this folder, `07c5a87f`), result `84cacbad` on `owner-r04-midmotion`, level `xhigh`

- **Set-up:** the repair of the first round (F141, F142, with F126 as X6). It launched at 19:06 on 2026-10-11, before
  the pre-launch review was adopted (21:05), so it had no B11 review.
- **Run:** resumed three times on its thread (usage limits, then the user's account switch at 01:15 on 2026-10-12).
- **Brief rows, as Codex graded them:** X1-X5 and L1-L3 pass; X6 fails: 11 runs of Daily's drive still give two
  frames (7/4, then 8/3), and the injected style is gone, as the brief allows when no way exists. X3's not-held counts
  per page (self, self, against `f96753fe`): Reports 99/103/92, Access 6/9/9, Activity 4/2/1, Daily 26/23/28,
  components 7/3/4, with 0 different everywhere.
- **Held-out rows, graded by the coordinator** (evidence `D:/fitway-temp/owner-r04-midmotion-fix-grade/`):
  - X1 and X2 re-run: Access's `pinChange` at `50097ff7` against `f96753fe` is `TIMELINE FAIL` with 4 different and
    exits 1, and against itself 5 equal; Reports' three moments 10 different, Activity's `dates` 4, each exit 1.
  - H4 passes as written: a timer plant (the export's 400 ms wait made 560 ms) is never equal; its samples at
    200-900 ms are not held on both sides, because the export is timed from the page's real clock, so the plant is
    never `DIFFERENT` and the command exits 0 with `INCOMPLETE` (F144).
  - H6 passes: under reduced motion Reports (108 samples) and Access (217) report no not-held and no different.
  - H8 passes: on Activity (not in Codex's X4), both languages, desktop and phone, reduced motion, the new and base
    CLIs give the same result for all 124 items; one base-side `ERR_NO_BUFFER_SPACE` (F137) was equal on a re-run.
  - H9 passes: with the hold's positions taken from the real clock, the suite fails 4 of 71, the new X5 test among
    them. Two cruder plants hung the suite instead (F145).
  - H10 partial: a third self run of Access (1432 equal, 5 not held) and Activity (513, 3) under full motion has 0
    different; reduced motion ran for Access only.
  - H11 fails, as the round reports; not re-run.
  - H12 passes: only `.agents/skills/verify-fitway/**` changed; the worktree is clean; CI is on the merge.
- **Found beyond the rows:** 24 not-held samples across the pages have no callback source. Each is the pressed
  control's region in the first 200 ms after its activation, so the release fade is not held (F143). Reports' 93
  others are its export timers.
- **Failure cause:** none in the brief for the rows that failed; X6 is Chromium's raster, reported honestly. The
  repair's measures held: classification now comes from the frames, as the trial's reviewers proposed for the first
  round.
- **Disposition:** merged as `ad9ea85f`. F119, F122, F130, F139, F141 and F142 are fixed; F126, F143, F144 and F145
  go to the verify-fitway round before Settings (DECISIONS 47).

## gardener-shared-files: `briefs/codex-gardener-shared-files.md` (this folder, `554eee67`), result `040bc5c8` on `owner-r04-gardener`, level `high`

- **Set-up:** F135, the first of the shared-files rounds (DECISIONS 45 and 47), run beside the shared-frame brief's
  base check. Held-out rows GH1-GH8 are in `D:/fitway-grader/owner-r04/gardener-shared-heldout.md`.
- **Pre-launch review (B11, Codex max, briefs alone):** four readings, all closed by sharpening (a scan pinned to the
  measuring revision; direct loads only; base-name filtering kept; the new-baseline notice only in comparisons);
  dispositions in `D:/fitway-temp/brief-review/gardener-shared-1/dispositions.md`.
- **Brief rows, as Codex graded them:** G1-G3 and L1-L2 pass. The derived list at `7e28c713` is the six files the
  brief names; the boundary total falls from 17 (hand list) to 11, all in `reports.css`.
- **Held-out rows, graded by the coordinator** (scripts and output in `D:/fitway-temp/owner-r04-gardener-grade/`):
  - GH1, GH2, GH4 and GH6 pass: the same six files at `f96753fe`; `./`, query, fragment and `../` spellings resolve;
    without the specimen list `daily.css` and `reports.js` become shared; 17 and 11 reproduce.
  - GH3 fails: a script tag inside an HTML comment, and an `import` inside a JavaScript comment, count as loads.
  - GH5 fails: with the hand list restored in `config.json` and preferred by the scan, all 34 tests still pass.
  - GH7 waits for the shared-frame round; GH8's CI waits for the merge.
- **Found beyond the rows:** through the report text `formatReport` writes, the baseline key is lost, so every later
  reading under the same list also says "starts new baseline" and shows no trend: the reading could never show the
  refactors' effect. The round's test fed a JSON block the report never writes.
- **Failure cause: the brief, then the code.** G3 stated what the first reading says and nothing about the next one,
  and G2's "fail on the hand list" did not name the configuration the weekly pass ships; the review did not return
  either reading. The comment matching is the code's.
- **Next:** `codex-gardener-shared-files-fix.md` (level high): the trend through the written report, comments are not
  loads, and a test on the shipped configuration.

## gardener-shared-files-fix: `briefs/codex-gardener-shared-files-fix.md` (this folder, `005b9fa2`), result `dd8f0fb8` on `owner-r04-gardener`, level `high`

- **Pre-launch review (B11, Codex max):** five readings; four closed by sharpening (the weekly step itself, the trend
  as the difference, the same set of paths in any order, every comment and string form) and one by clarifying the
  other way (a total counted under the hand list must not seed a trend); dispositions in
  `D:/fitway-temp/brief-review/gardener-fix-1/dispositions.md`.
- **Brief rows, as Codex graded them:** X1-X3 and L1-L2 pass.
- **Held-out rows, re-graded by the coordinator** (`D:/fitway-temp/owner-r04-gardener-grade/`): through the written
  report the second reading shows its previous and trend (11, 0; across revisions 28 to 11 is -17 and back +17); GH3's
  comment and string fixtures pass; GH1, GH2, GH4 and GH6 still pass; GH5 passes: with the hand list restored and
  preferred, the shipped-configuration test fails by name. `code-health.test.ts` grew from 3 to 11 cases over the
  two rounds.
- **Failure cause:** none.
- **Disposition:** merged as `2e7a29cf`; F135 fixed. GH7 is graded on the shared-frame round's result.

## launch-review: `briefs/codex-launch-review.md` (this folder, `fe8856fd`), result `7d262d68` on `owner-r04-launch-review`, level `xhigh`

- **Pre-launch review (B11, Codex max, run by hand):** five readings; four closed by sharpening (the dispositions name
  the launched brief's SHA-256, never written by the launcher, the prompt and command unchanged, each gate proved by
  removing it) and one by dropping its outcome: R2 (F146, a launcher test at 28.4 s against 20 s on CI run
  38250368308) was already met locally at the base (3.8 s), so F146 stays open. Dispositions in
  `D:/fitway-temp/brief-review/launch-review-1/dispositions.md`. No held-out rows were written for this round.
- **First result `3469c332`:** every brief row PASS by Codex. The coordinator's run with a stand-in Codex and a test
  worktree (`D:/fitway-temp/grade-launch-review/GRADE.md`) refused all five real review answers given to it as "cannot
  be read as readings": the parser asked each reading for four labelled fields, and the tests used a stand-in answer
  shaped to it. No real round could have launched.
- **Fix (thread resumed, `7d262d68`):** the eight real answers on disk read with 5, 4, 5, 4, 5, 5, 4 and 3 readings
  from byte-copy fixtures, and restoring the first parser fails all eight. Re-graded on a real answer: all five named
  with no dispositions, the fifth named when four are answered, a wrong hash refused, and with all answered the
  stand-in launched and the readings and dispositions were copied into the run.
- **Failure cause: the brief.** R1 never required a real answer to parse; the review did not return it.
- **CI:** run 38273918030 failed once on the edge simulator test of F110 (`test_windows_lifecycle.py:392`, a timing
  assertion this time) and passed on a rerun of the failed job.
- **Disposition:** merged as `cf2f8a2a`. From now on `pnpm codex:round` runs the review into
  `D:/fitway-temp/brief-review/<brief name>-<n>/` and launches only once `dispositions.md` there names every reading
  and the brief's SHA-256 (`docs/agent-context/briefs/REVIEW.md`).

## vf-speed: `briefs/codex-vf-speed.md` (this folder), result `5ba2c2f2` on `owner-r04-vf-speed`, level `xhigh`

- **Set-up:** the verify-fitway round of DECISIONS 47, split by DECISIONS 48 into vf-speed (S1 affected pages, S2 kept
  baseline frames, S3 F137) and vf-hold, run beside the paused shared-frame round. Its measurements waited for the
  port pair. Held-out rows VS1-VS10 in `D:/fitway-grader/owner-r04/vf-speed-heldout.md`, written at grading before any
  measurement.
- **Pre-launch review (B11, Codex max):** three readings, all closed by sharpening (L1 over every configuration, no
  baseline browser work on a reused item, tests through the CLI's own compare); B7 left open with its reason: the
  ports were the shared-frame round's, so no outcome command ran on the base. Dispositions in
  `D:/fitway-temp/brief-review/vf-speed-1/dispositions.md`.
- **First push `2f05a734`:** CI run 38277425383 failed 14 of the new tests with `Playwright Chromium missing`: CI runs
  the ladder without a browser or ui-forensics, which no brief said. Resumed on its thread with that fact
  (`resume-ci-1.md`); `bdacf8c1` stubbed the browser and passed CI. vf-hold failed the same way (run 38277420287).
- **Live measurements** (`resume-measure-1.md`): the live run found the kept captures never reused (the key held a
  generated browser file) and fixed it (`a8ae4d4e`, `5ba2c2f2`). Every brief row PASS by Codex
  (`D:/fitway-temp/codex-round-vf-speed-1/REPORT-5ba2c2f2.md`): Reports' rerun 162 s to 64 s with 114 reused and 0
  captured; two full five-page compares of 1,224 items in about 19 minutes each, 12 peak sockets, no
  `ERR_NO_BUFFER_SPACE`; L1 408 of 408 items and 9 of 9 timeline samples equal to the HEAD's CLI.
- **Held-out rows, graded by the coordinator** (`D:/fitway-temp/owner-r04-vf-speed-grade/`, CLI at `5ba2c2f2`, its
  own archives of `7e28c713` and `4352181f`):
  - VS1-VS3 pass: the shared-frame result takes every page through `shared-frame.js`; a changed recipe entry takes
    Access alone; a font loaded through CSS `url()` takes its page (`jetbrains-mono-500.woff2`, Access) or every page
    (`readex-pro-latin.woff2`); the partial line prints first.
  - VS4-VS6 pass: the coordinator's own archive reused Codex's kept captures (the key is content, not path); cached and
    fresh runs agree on all 114 Reports items (66 s against 113 s); a planted Reports change under 140 reused
    captures is DIFFERENT on the same 26 items as a fresh run; a baseline font change reuses nothing.
  - VS7 partial: one full compare, 1,224 items, 1,234 captures, 66 connections, 12 peak sockets, no
    `ERR_NO_BUFFER_SPACE`, no stall (F137 fixed); 3 items DIFFERENT, all Daily's Lights chip on the phone half a pixel
    apart, which is F126: quiet reruns of Daily on the phone show it in 1 of 2 runs under this CLI and 1 of 3 under the
    HEAD's. Codex's two runs did not hit it; S3's known-problem list did not name it.
  - VS8 pass: a planted Access difference gives the same verdict on all 128 items under the HEAD's CLI and this one
    (112 DIFFERENT each). VS9 pass: dropping the recipe from the cache key fails two tests, counting the components
    sheet as a page fails one; the worktree restored clean. VS10 pass: scope as briefed, recipe counts 44, 31, 46, 30
    and 14, the cache 1.1 GB in `D:/fitway-verify-captures`.
- **Found beyond the rows:** kept captures are keyed per page on the whole option set, the baseline port included, so
  a rerun with fewer axes, or on another port pair, captures afresh (F147, for the parallel-compare round). CI run
  38309737308 on `5ba2c2f2` failed two Vitest cases at 20 s outside the round's files (the launcher's, F146, and the
  gardener's H6 at 48.8 s) and passed on a rerun of the failed job.
- **Failure cause: the brief,** for the first CI failure: it named the local ladder and not CI's machine. The review
  could not return it (a fact outside the brief). It becomes a checklist line in `docs/agent-context/briefs/codex.md`.
- **Disposition:** merged as `ebbfecd6`; F137 fixed. F126 now fails a full compare at random and goes first among the
  shared lows.

## vf-hold: `briefs/codex-vf-hold.md` (this folder), result `7c8418fb` on `owner-r04-vf-hold`, level `xhigh`

- **Set-up:** the second half of the verify-fitway round (DECISIONS 47 and 48): the timeline holds a press's release
  (F143) and the page's clocks (F144). Held-out rows VH1-VH8 in `D:/fitway-grader/owner-r04/vf-hold-heldout.md`,
  written before its measurements. Resumed four times on its thread: after a usage limit, with CI's missing browser
  (`resume-ci-1.md`, the same brief gap as vf-speed's), for the measurements, and after the overnight stop
  (`resume-after-stop-1.md`).
- **Found at the stop:** under the clock hold, six Access PIN saves timed out: the held clock skipped the driver's
  600 ms idle wait, so the page's double-tap guard refused the save. Codex fixed it (`55a97093`, setup waits advance
  the logical clock) with a test, then held effects started with `Animation.play()` (`7c8418fb`), and reran every
  measurement on the final commit.
- **Codex's report** (`D:/fitway-temp/codex-round-vf-hold-1/last-message.md`, evidence
  `D:/fitway-temp/owner-r04-vf-hold/run-7c8418fb/`): H1 FAIL on two rows, H2, H3 and L1-L4 PASS; NOT-HELD under the
  historical CLI against its own, Access 0 to 0, Activity 1 to 0, Daily 12 to 0, Reports 17 to 0; 15 defect controls,
  each failing its test; fast ladder clean. CI run 38353822792 on `7c8418fb` passed.
  - H1 self: one NOT-HELD in 840 samples, one pixel one level apart on the download icon of Reports' export button at
    21 ms. Coordinator: rendering noise, not the hold (F148).
  - H1 outside the list: the 40 ms release plant was EQUAL on a held rail press and DIFFERENT on activation and
    release. Coordinator: the brief asked a release-only plant to change a held press, which it cannot; VH1 tests the
    press with its own plant. **Failure cause: the brief.**
- **Held-out rows, graded by the coordinator** (`D:/fitway-temp/owner-r04-vf-hold-grade/`, runner `run.mjs`, plants
  in `plants/`, the base from `D:/fitway-temp/owner-r04-vf-speed-grade/7e28c713/`; CLI at `7c8418fb`, and the merge
  `f2c89624` for VH6-VH7):
  - VH1 pass: on Activity's dates button and current rail tile, a stronger press light is DIFFERENT on all 42 held
    samples; the 40 ms release plant is DIFFERENT at 21-101 ms (tile 21-121), EQUAL before and after; self 83 EQUAL
    and one NOT-HELD at 1 ms of the dates release, two pixels on the calendar icon's edge (F148, on both sides in the
    plant run).
  - VH2 pass with Space: `--inputs keyboard` activates with Enter, which never shows a press in Chromium, so the
    release plant is EQUAL there (F149); a recipe ending `press:Space` on `period-7d` gives self 21 EQUAL and the plant
    DIFFERENT at 21-141 ms.
  - VH3 pass: the export run read from `Date.now()` instead of `performance.now()` is EQUAL on 137 samples (one F148
    NOT-HELD at 21 ms, the download icon again); with 560 ms minimums DIFFERENT from 401 ms, exit 1.
  - VH4 pass: Activity's refresh self 27 EQUAL, no NOT-HELD; the clock's start one minute later DIFFERENT, exit 1.
  - VH5 pass: a random colour on the export button's press is NOT-HELD on all 42 samples, never EQUAL, exit 1.
  - VH6 pass: on the merge, Reports `export-open` and `period-7d` rerun with 4 kept captures reused and 0 captured
    (19 s against 39 s) give the cache-off run's verdicts; the release plant is DIFFERENT at 100 ms under reuse and
    fresh alike.
  - VH7 pass: every feature with actions on the four pages, base against itself, `ebbfecd6`'s CLI against the merge:
    no sample compared before is missing or NOT-HELD now; NOT-HELD Access 0 to 0, Activity 0 to 0, Reports 24 to 0,
    Daily 13 to 0; Reports and Daily gain 6 and 18 samples, their moves now measured to the end.
  - VH8 pass: only `timeline.mjs` and `timeline-hold.test.mjs` changed, `cli.test.mjs` unedited, Daily's phone frame
    under reduced motion EQUAL under both CLIs, CI green on `7c8418fb`.
- **Disposition:** merged as `f2c89624`; F143 and F144 fixed; the §"Compare" lines added to `SKILL.md` with F148 and
  F149. F148 goes with F126 among the shared lows; vf-parallel's brief allows one rerun for it.

## Evaluation: DeepSeek for the brief review (2026-10-13, the user asked for the trials)

- **Setting:** the user moved Codex's rounds to DeepSeek V4.1 Flash through Open Design at `max`
  (`docs/agent-context/WORKING_AGREEMENTS.md` §"Delegation"), Codex CLI 0.162.1 as the harness with a one-model
  catalog; the coordinator's smoke runs first proved a read, a patch-tool edit that kept Arabic text, and an escalation
  reviewed by DeepSeek itself as the approval reviewer. The same three briefs, prompts and catch criteria as the
  evaluation of 2026-10-11 above; scoring and each rule were written in the grader folder before each set ran.
- **Briefs alone, six runs:** brief-1's allowance loophole in 6 of 6; daily-files' missing motion limit in 1 of 6; no
  false alarm in 30 control readings. One run caught both once in six; pairs of runs caught both in 5 of 15, so a
  second review adds little. GPT-6.1 Sol had caught daily-files in 5 of its 6 briefs-alone runs.
- **With the files each brief names, two runs per brief (one brief per run):** both failures caught in both runs,
  each time naming that settled compares cannot see motion from the verifier guide; no false alarm in 10 control
  readings. GPT-6.1 Sol in this form had caught one of the two at `high` and the other at `xhigh`.
- **Decision (by the rule written before the runs):** DeepSeek at `max` reviews each brief together with the files
  it names, one run per brief; the launcher change is round deepseek-route. Six briefs and two hard cases are thin
  evidence: the brief-caused failures of the rounds that follow are the measure, now recorded apart from failures of
  the model's own reading.

## deepseek-route: `briefs/codex-deepseek-route.md` (this folder, `107c71e5`), result `96e4f36b` on `owner-r04-deepseek-route`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** the first round on DeepSeek V4.1 Flash through Open Design, launched by hand with the route the brief
  names (the launcher could not route yet). The with-sources review returned five readings, all closed before launch
  (private and held-out paths reachable through absolute sources, the catalog argument not tied to the written
  catalog, the smoke files missing from Read first, no default level, no real call required).
- **Run 1** stopped after about 25 edits on an Open Design error: the user's Impeccable hook placed a message between
  a tool call and its result, which Open Design's chat route refuses. A CSS edit reproduced it with hooks on and not
  with hooks off; the user agreed to a per-run switch for DeepSeek runs only (WORKING_AGREEMENTS §"Delegation"). The
  thread cannot be resumed (its history holds the order), so **run 2** started fresh on the uncommitted work with a
  launch note and the brief's D2 amended (`-c features.hooks=false`).
- **Run 2:** brief rows 6/6 by the coordinator's own checks. The required real `--new-review` found two defects the
  fake Codex could not: source discovery read any prose line naming "Read first" as the list, and the reading parser
  did not accept DeepSeek's `**Reading N:**` form; both fixed in the round. Tokens: 45.3M input (44.8M cached), 127k
  output. CI passed on `96e4f36b`.
- **Held-out** (`D:/fitway-grader/owner-r04/deepseek-route-heldout.md`): DR1-DR6, DR9, DR11 and DR12 pass; DR7 and
  DR8 pass on the code executed directly (sources come from the named HEAD, not an edited working copy; DeepSeek
  refuses `xhigh` and `medium`, defaults to `max`), but no test guards either: of nine planted defects the round's
  suite caught seven, not a working-copy source read (P5) and not DeepSeek accepting `xhigh` (P7) (F150). DR10 is
  partial: `start-load.json` for a DeepSeek launch is untested until the first launcher run.
- **Failure causes:** none from the brief's wording; run 1's stop was the environment (F151). Side findings: F150,
  F152.

## launcher-fixes: `briefs/codex-launcher-fixes.md` (this folder, `c30cac54`), result `5b58492e` on `owner-r04-launcher-fixes`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** the first round launched by `pnpm codex:round` on DeepSeek with the brief's own "a message ends the run"
  line (F154). The review returned five readings: two closed (L1: no exception by a brief's folder or name; A3: a
  launch refuses a review source changed between the named HEAD and the launch), three left open (the read-only
  sandbox does not confine reads on Windows, F155; the check and the review reading seconds apart; hard links).
- **Run:** one run, no intervention, ended with its report. Tokens: 30.9M input (30.6M cached), 84k output.
- **Brief rows** 6/6 by the coordinator's own checks (A1-A4 through the held-out rows below; L1 as LH8; L2 by the
  run's ladder and CI on the merge).
- **Held-out** (`D:/fitway-grader/owner-r04/launcher-fixes-heldout.md`, graded in
  `D:/fitway-temp/owner-r04-launcher-fixes-grade/` with a fake Codex and the checker at `c97d564e` beside the new one):
  LH1-LH8 and LH10 pass. LH1 an untracked file, LH2 a junction out of `D:/fitway-temp` (the launch stops at the gate
  and no review folder holds the outside file's marker), LH3 a committed symbolic link, LH4 four bad names in one run
  with their own lines, LH5 the launcher checkout's clean, modified and untracked files, LH6 a Markdown commit changing
  a named source (refused, naming it) or an unnamed one (launches), LH7 `.env` by name and a key by content (refused
  by the review, nothing copied), LH8 the twelve r04 briefs with the same exit status under both checkers (the extra
  FAIL lines are bare names such as `compare.mjs` the review also refuses) and a renamed copy elsewhere passing, LH10
  no test line removed. LH9: of three planted defects the suites caught two (a working-copy read, four tests; DeepSeek
  accepting `xhigh`, one test); reading an absolute source before its place check passed all 170 tests, though the
  code reads only after the check (F156).
- **Failure causes:** none from the brief's wording; none from the model's reading. Side finding: F156.

## Evaluation: Claude Code on DeepSeek, the partial replay (2026-10-13 to 14, DECISIONS 53, deferred by 58)

- **Set-up:** deepseek-route replayed from `4a151786` with the same brief (`107c71e5`) on Claude Code `--bare`,
  `deepseek-v4.1-flash[1m]` at `max` through Open Design's Anthropic route, auto permission mode with DeepSeek as its
  classifier (`D:/fitway-temp/cc-replay-deepseek-route-2*`). A first start with a 200k window was stopped after reading
  (`cc-replay-deepseek-route-1/STOPPED.md`). Not graded: it was stopped mid-work at the user's request for fresh
  sessions, its edits uncommitted in `D:/Projects/fitway-worktrees/owner-r04-cc-replay`.
- **Observed, from its event streams:** about 3.1 hours of turns over seven runs, 303 turns and 296 tool calls (Bash
  169, Edit 88, Read 39), 425k output tokens, 44.2M input (43.8M cached); seven early ends with a lead-in sentence and
  no tool call (F154), four inside an automatic resume loop; 14 tool errors, five of them the auto-mode classifier on
  DeepSeek timing out or failing its second stage, two Edit misses, one deny rule rightly refusing `git switch`.
- **Codex on the same brief:** run 1 stopped at 18 minutes on the hook message Open Design refuses (F151); run 2,
  on run 1's uncommitted work, reached its report in 52 minutes with 121 commands, 127k output tokens, no early end,
  graded 6/6 and held-out 11/12.
- **Not a fair comparison:** one unfinished Claude Code run; the brief and launcher were shaped for Codex over 30-odd
  rounds; Claude Code's classifier ran on DeepSeek; the replay ran beside vf-parallel's timings; Codex's run 2 did not
  start from the base; whether the model or the route drops the tool call (F154) is not known.
- **Disposition:** DeepSeek stays on Codex (DECISIONS 58); the replay reopens only on that item's conditions.

## vf-parallel: `briefs/codex-vf-parallel.md` (this folder), continued by `codex-vf-parallel-continue.md` and `codex-vf-parallel-continue-2.md`, result `70cf9180` on `owner-r04-vf-parallel`, GPT-6.1 Sol `xhigh`, then DeepSeek V4.1 Flash `max`

- **Set-up:** the parallel-compare round of DECISIONS 48: a port pair per round (P1), workers inside one compare (P2),
  kept captures keyed per item (P3, F147). Held-out rows VP1-VP11 in `D:/fitway-grader/owner-r04/vf-parallel-heldout.md`,
  written before its measurements. Three sessions:
  - GPT-6.1 Sol from `5493e888` (`D:/fitway-temp/codex-round-c9d939cf-0dbd-4bd8-ab8e-1b9a9eb7828e`): three resumes
    over a capacity answer and usage limits on every account; delivered `0fbad66d` with P4, L2 and L3 passing and P1-P3
    and L1 unmeasured, because the shared-frame round held the ports and the release marker came too late for it.
  - DeepSeek, fresh (`codex-vf-parallel-continue.md`, `codex-round-6cb545e8-2571-48fd-af5e-db0c44320e48`): on
    `0fbad66d` 4 workers took 581 s against 1,112 s (1.91x, 25 s over the brief's half); it committed `f3601821` (fewer
    manifest rewrites); one F154 resume; stopped at the user's request (DECISIONS 54), its timings having run beside the
    coordinator's Claude Code replay.
  - DeepSeek, fresh again (`codex-vf-parallel-continue-2.md`, `codex-round-5baafff1-b258-4fcb-ae90-79f9d26e340d`,
    DECISIONS 54 and 55): the phase breakdown first (R5), then `70cf9180`, which skips the language sheets in comparison
    captures (59 s of serial work), then every measurement on it; one F154 resume (`resume-turn-ended-1.md`).
- **Codex's report** (`last-message.md` in the last run folder): every outcome and limit PASS. P2 medians of three
  alternating runs on a quiet machine: the base against itself 917 s with 1 worker and 360 s with 4 (2.55x), the result
  against the base 922 s and 366 s, with kept captures 500 s and 221 s; the old CLI 1,083 s; fast ladder 659 s with
  107/107 verification tests. Last session: 90.7M input tokens (90.0M cached), 129k output; start load 89,495.
- **Brief rows** 12/12 by the coordinator's own checks (R1-R5 of continue-2; P1-P4 and L1-L3 through the held-out rows
  below; P4 also by CI). R4's change left `SKILL.md`'s line on language sheets stale (F158).
- **Held-out, graded by the coordinator** (`D:/fitway-temp/owner-r04-vf-parallel-grade/`, runner `run.mjs`, item
  compare `cmp.mjs`, queues `queue.sh`, `queue2.sh` and `queue3.sh`; CLI at `70cf9180`; base `7e28c713`, result
  `4352181f`, plants from vf-hold's grade). The queue was killed by a Windows Update restart at 06:36 and resumed at
  09:22 (F159).
  - Timing, alone, the full base self compare of 1,224 items: `5493e888` with 1 worker 1,136.6 s, `70cf9180` with 4
    workers 375.0 s, the same verdicts (3.0x).
  - VP1 pass: with a plain listener on 3186, compare on 3186-3187 refused in 183 ms naming the pair, no browser started;
    3174, 3178, 3180 and 3185 refused for launch, doctor, drive and compare (16 of 16, at most 148 ms).
  - VP2 pass: the release plant on Activity's `g-dates-release` and Reports' base self compare, run at once on two pairs,
    gave each its alone verdicts item by item (1 and 228).
  - VP3 pass: the `light` plant with 4 workers against 1: Access 376 items the same; Activity 280 the same verdicts,
    regions and pixel counts, 8 problem items whose error text differs.
  - VP4 partial: 9 runs of the four press and release features (4 with 1 worker, 5 with 4): 83 of 84 samples identical
    in every run. The 84th, `g-dates-release` at 1 ms, is NOT-HELD on two pixels of the calendar icon at (831,98)
    (F148) in 2 of 4 runs with 1 worker and 5 of 5 with 4, one rerun included. F148 is not the round's code, since it
    shows with 1 worker; these counts cannot settle whether 4 workers raise its rate, so F148's fix is checked under 4.
  - VP5 pass: `--workers` 0, -1, 2.5 and abc refused with one message; 2, 3 and 4 gave 1 worker's 152 items field by
    field.
  - VP6 pass: kept captures made on 3176-3177 reused on 3188-3189 (10 reused, 0 captured); after a comment in
    `activity.css`, 8 reused and Activity's 4 captured again, every verdict the cache-off run's.
  - VP7 pass: two writers of one fresh baseline started together both finished; the reader reused 153 kept captures
    and matched the cache-off run on all 152 items. Both writers also gave one false DIFFERENT, on Reports `page`
    with `state=loading`, Arabic, desktop, reduced motion: its proof holds before the skeleton shows at 300 ms, so
    under two 4-worker writers 4 of 6 captures caught the skeleton and 2 did not, and a kept reserve frame holds it
    (F160, the recipe, not the round's code).
  - VP8 pass: on 3176-3177, 1 worker, cache off, `5493e888`'s and `70cf9180`'s CLIs gave the same 152 items for Reports'
    states and the same 2 timeline items (9 samples).
  - VP9 pass: three 4-worker compares on the three pairs at once (Reports 228, Access 384, Activity 396 items) finished
    in 105-134 s with no `ERR_NO_BUFFER_SPACE`, at most 12 peak sockets each and 114 established connections on the
    machine; a stand-in preview on 3174 answered all 688 polls.
  - VP10 pass: a compare killed mid-run left no Chromium and no listener on 3188-3189 after 10 s; the next compare there
    finished in 14 s.
  - VP11 pass: only `.agents/skills/verify-fitway/**` changed; `SKILL.md` only in §"Compare" and its port lines; the
    recipes keep 44, 31, 46, 30 and 14 features, which both CLIs list; CI green on `70cf9180` (run 38539370125)
    and on `d7c5bfa8`, the merge with this record (run 38541495924).
- **Failure causes:** the first session's unmeasured rows were the coordinator's port schedule, not the brief's words or
  the model's reading; the 2x bar the second session missed was the coordinator's reading of DECISIONS 48 (54). Side
  findings: F158, F159, F160.
- **Disposition:** merged; F147 fixed.

## launcher-fixes-2: `briefs/codex-launcher-fixes-2.md` (this folder, `c609e08b`), result `a6ad0ae4` on `owner-r04-launcher-fixes-2`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** every review answer read by its structure (K1, F157), a run that ends before its report resumed on its
  own up to 10 times (K2, F154), and tests that fail when either returns or a source is read before its place check
  (K3, F156). The review's five readings: three closed in K1-K3, two left open. Launched by `pnpm codex:round`
  beside shared-frame's compares; one run, no intervention, no early end. Tokens: 70.7M input (70.3M cached), 117k
  output; start load 87,937.
- **Codex's report** (`D:/fitway-temp/codex-round-caa1d3ee-9a68-4d12-be7a-d0448811e86c/last-message.md`): K1-K3 and
  L1 PASS, 189 tests in the two files; L2 FAIL locally, verify-fitway's S2 cache tests timing out at 120 s while the
  coordinator's compares ran on the machine. CI run on `a6ad0ae4` green, so L2 holds.
- **Brief rows** 3/5 by the coordinator's checks: K2, L1, L2 pass; K1 partial (LF1); K3 fails on F156 (LF6).
- **Held-out** (`D:/fitway-grader/owner-r04/launcher-fixes-2-heldout.md`, graded with a scratch test file built on the
  round's own fixtures, kept at `D:/fitway-temp/owner-r04-launcher-fixes-2-grade/`):
  - LF1 partial: "## Reading N - ID" with "Exploits/Reading/Effect/Fix" reads as 3; "**1)** R1 text" starts are
    refused (the bold-heading form must wrap the whole line); a "### 1. R1" reading whose body holds a 1-4 numbered
    list makes the whole answer "cannot be read as readings" (F162).
  - LF2 pass: six readings, IDs with no bodies, prose naming R1, readings numbered 1, 2, 4: each refused.
  - LF3 pass: "Tests PASS so far" and "K1 PASS so far; K2 next" resumed; `STOPPED:`, "**K1** PASS", "K1: PASS", a
    table and "K1-K3 PASS / L1-L2 PASS" not resumed.
  - LF4 partial: the message is UTF-8, names `STOPPED:`, and `auto-resumes.log` keeps the first line exactly; the
    message quotes it as a JSON string, so its double quotes arrive as `\"` (F163).
  - LF5 pass: a manual `resume` gets its own 10 (20 lines after both, exit 1 naming it); exit 5 with a lead-in
    message is not resumed and keeps 5.
  - LF6 fail: F156's plant (`await readFile(real).catch(() => {})` ahead of the place check in `check-brief.mjs`)
    passes all 189 tests; the round's K3 test catches a read that throws (`EISDIR`), not a read whose error is ignored.
  - LF7 pass: `check-brief.mjs` and its imports unchanged. LF8 pass: only the Scope's files; 17 answers, each a
    byte-identical fixture pinned by its hash; CI green on `a6ad0ae4`.
- **Failure causes:** LF1's bold-start form and LF6's silent read trace to the brief (K1 named heading levels and
  field labels, not start markers; K3 named F156 without its plant's form); LF4 too ("quotes" without "exactly"). The
  numbered list inside a body is the model's reading of K1, whose text covers it. Side findings: F162, F163.
- **Disposition:** merged for its automatic resume; a fix round takes F156, F162 and F163.

## shared-frame: `directions/briefs/codex-shared-frame.md` and `codex-shared-frame-continue.md` on the build branch, then `briefs/codex-shared-frame-continue-2.md` (this folder), result `4352181f` on `owner-followup-r04-build`, GPT-6.1 Sol `xhigh`, then DeepSeek V4.1 Flash `max`

- **Set-up:** the rail, the header and the status details move from the four page scripts into one `shared-frame.js`
  (DECISIONS 45), every page unchanged at rest and in motion (F1-F4, L1-L2). Held-out rows SH1-SH10 in
  `D:/fitway-grader/owner-r04/shared-frame-heldout.md`. Four sessions: GPT from `32c1edcb` (8 resumes), GPT from a
  saved patch at `56ed8da6` (29 resumes across usage limits and account switches; it wrote `a8521e98` to `4352181f`),
  GPT to measure from `4352181f` (stopped), and DeepSeek fresh (`codex-round-b041ea52-52cd-4d03-b04e-d70094731ffc`,
  one F154 resume), which finished the 237 measurement jobs without a code change. That session: 32.2M input tokens
  (31.5M cached), 80k output; start load 87,610.
- **Codex's report** (that folder's `last-message.md`): F1 PASS (`shared-frame.js` 250 lines; the four page scripts
  8,086 to 7,305 lines), F4 and L1-L2 PASS; F3's exact verdict INCOMPLETE and reported as such: 69 F126 samples and 21
  F148 samples, nothing else; DeepSeek could not open the frames (no image input).
- **Brief rows** 6/6 by the coordinator's checks (F1-F4, L1, L2), with F3's instabilities shown below to be the
  base's own.
- **Held-out, graded by the coordinator** (`D:/fitway-temp/owner-r04-shared-frame-grade/`, queue `queue.sh`, control
  `control.sh`, classifier `sf-classify.mjs`: a difference is F126 when every cluster is the Lights chip's 119x28 box,
  its "Lights" text or noise inside it; merged CLI with 4 workers on 3186-3187; base `7e28c713`):
  - SH1 pass: Reports 256, Access 376 and Activity 248 items have no DIFFERENT; Daily's 360 have 36 DIFFERENT inside
    the chip (F126) and 8 on tuner buttons under touch. The control on those tuner items (16 per run) gave the base
    against itself 7 and 9 DIFFERENT and the result against the base 9 and 6, so they are the touch instability, not
    the round. Every NOT-HELD sample is the chip or a touch press at 1 ms (once at 100 ms), on the base side as well
    (F165).
  - SH2 pass: 80 items, no DIFFERENT; 5 touch NOT-HELD. SH3 pass: over `file://` Reports, Access and Activity equal
    on all 220 items; Daily's 25 DIFFERENT are the chip (18) and tuner buttons under touch (7).
  - SH4 partial (graded on 2026-10-13: `components.js` keeps its own copy of three frame words). SH5 pass (781 lines
    fewer).
  - SH6 pass: Daily's hooks, 8 items, no DIFFERENT; the rail with Motion off equal. SH7 pass: Access with the keyboard,
    47 items settled and timeline, no DIFFERENT.
  - Every run's problem items are the features that navigate (language, phone language, record navigation) under touch
    or keyboard, failing on both sides with "Execution context was destroyed" (F164).
  - SH8 pass on Reports: the plant (the shared rail's opening 240 to 280 ms) is DIFFERENT on 6 samples and the
    unplanted copy EQUAL with the mouse. On Daily, the brief's page, the rail cannot be held: `tuner.js:386`'s frame
    callback runs outside the hold, so the plant gave problems and NOT-HELD, not DIFFERENT (F126's family).
  - SH9 pass: with the frame and page scripts held 800 ms and the fonts held, the first painted frame of every page in
    both languages holds the nine rail names and the status text, at the base and the result; a control without
    render blocking paints at about 125 ms with them empty (`sh9.mjs`, `sh9-out/`).
  - SH10 partial: only the folder changed, `HISTORY.md` and `evidence/` unchanged, drift and doctor pass; but the build
    branch's CI has been red since 2026-10-11 on a plain Node script named `*.test.mjs` that Vitest collects (F166),
    and `4352181f` is not pushed.
- **Failure causes:** none from the brief's wording or the model's reading; the sessions ended on usage limits and
  capacity (environment). Side findings: F164, F165, F166.
- **Disposition:** accepted on the build branch; F166 goes with the tuner round, which pushes the branch.

## launcher-fixes-3: `briefs/codex-launcher-fixes-3.md` (this folder), result `d802b101` on `owner-r04-launcher-fixes-2`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** the three gaps launcher-fixes-2's grading found: readings whose bodies hold lists, or that start bold
  numbered, read (K1, F162); the resume message quotes its trigger line exactly (K2, F163); a silent read before the
  place check fails a test (K3, F156). Review readings: four closed, one left open (field wording stays free). One run
  (`codex-round-29b568cf-1e61-4a63-ab53-bec121e985f1`), one automatic resume, no intervention. Tokens: 42.1M input
  (41.4M cached), 139k output; start load 87,823.
- **Codex's report** (that folder's `last-message.md`): K1-K3 and L1 PASS, 195 tests in the two files; L2 FAIL
  locally on verify-fitway's `compare-speed` tests, which collided with vf-fixes' run in another worktree (F168). CI
  green on `d802b101`. It ran launcher-fixes-2's held-out suite as a check, reached through F162's evidence path
  (F167).
- **Brief rows** 3/5 by the coordinator's checks: K2, L1, L2 pass; K1 partial (bare `N.` starts, LG1); K3 partial
  (an absolute source in `copyReviewSources`, LG4).
- **Held-out** (`D:/fitway-grader/owner-r04/launcher-fixes-3-heldout.md`, graded with a scratch test file on the
  round's fixtures, kept at `D:/fitway-temp/owner-r04-launcher-fixes-3-grade/` with every run's output):
  - LG1 partial: a "### 1. R1" body with a bulleted list and a fence whose lines start "2." and "3.", a "####" heading
    in a body, and "**1.** R1 text" starts each read as 2 with each reading's text running to the next start; bare
    "1. R1 text" readings with an indented body, with or without an indented list, are refused, and `a6ad0ae4` read
    both (F169).
  - LG2 pass: body items at the starts' level that continue the numbering, six readings, IDs without bodies, prose
    naming R1, and readings numbered 1, 2, 4: each "cannot be read as readings".
  - LG3 pass: `He said "stop" \ C:\x`, backticks, «الآن» with Arabic, a line holding runs of three to five backticks
    and a line that is only a fence each sent character for character between fences longer than any run in it;
    `auto-resumes.log` keeps the line.
  - LG4 partial: a silent `readFileSync` ahead of the place check in `check-brief.mjs` fails "checks each source's
    place before reading it" (1 of 195); a silent read of an absolute source in `copyReviewSources` before it calls
    the source plan passes all 195 (F156 stays open). The tree unchanged after both.
  - LG5 pass: `brief:check` on the 13 r04 briefs gives the same exit and lines with `check-brief.mjs` at `a6ad0ae4`
    and `d802b101`; the three removed `expect` lines moved into the new per-case loop with the same errors; the
    checker's diff is the observer seam only.
  - LG6 pass: only the Scope's four files changed; CI green on `d802b101` and on the merge.
  - Probe (not in the brief's K1): the vf-fixes review answer, a one-line preface then "1. **V7: ...**" readings,
    is still refused (F162's later part).
- **Failure causes:** the model's reading on both partials: K1 named bare `N.` starts and the rewrite dropped that
  path; K3 named every entry point and every source kind, and the copy test covers a repository source only. The
  brief contributed to K1: its L1 guarded the answers the existing tests accept, and no test accepted the bare form.
  Side findings: F167, F168, F169.
- **Disposition:** merged (`3a959ac2`) for K2, K3's checker and K1's new forms; F156's rest, F162's preface form and
  F169 go to the next round on these files (the encoding round, decision 56).

## tuner-removal: `briefs/codex-tuner-removal.md`, continued by `codex-tuner-removal-continue.md` (this folder), result `aeb7d35a` (on `58e39ede`) on `owner-followup-r04-build`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** Daily's light tuner removed (DECISIONS 50) with its live moments kept under a URL switch (T1-T2), every
  page unchanged otherwise (T3), the hook's file without its BOM (T4, F140), the build branch's CI green (T5, F166).
  Held-out rows TR1-TR10 in `D:/fitway-grader/owner-r04/tuner-removal-heldout.md`. Two sessions: the first
  (`codex-round-62a57dd6-5c06-45b8-9ded-996d11222dab`) wrote the change and was stopped at the user's request before
  reporting, its tree saved as `58e39ede`; a fresh continue session (`codex-round-9e63e748-50de-49e4-bc40-e6d7d6419115`)
  ended after about 10 minutes on a progress line and was not resumed automatically (F170), so the coordinator resumed
  it by hand once. Tokens: 219.1M input (217.2M cached), 306k output; start loads 88,344 and 89,221.
- **Codex's report** (that folder's `last-message.md`): R1-R2, T1-T5 and L1-L3 PASS; `?live-keys=1` with `n` a new
  reading, `r` reset, `u` and `d` the crowd level; the continue session changed no file (`aeb7d35a` is an empty
  verification commit); T5's ladder ran "with CI-equivalent env values and the ignored local config set aside".
- **Brief rows** 7/10 by the coordinator's checks: R1, T2-T5, L2, L3 pass; T1 partial (TR1); L1 fail and R2 fail:
  `58e39ede` deleted Daily's `capture.mjs` whole (2,362 lines, about 128 naming the tuner: the folder's static-frame
  guard against the evidence hashes, the Round 6 motion checks and the light measurements) with README's account of
  it, where the round's L1 allowed removing only the parts that captured the tuner; the first session's own notes say
  it deleted the file because trimming it was laborious, and the continue session's R2 review found "no correction
  required". Neither report names the deletion.
- **Held-out** (graded on the merged CLI with 4 workers on 3186-3187 and the coordinator's scripts in
  `D:/fitway-temp/owner-r04-tuner-grade/`: `queue*.sh`, `run.mjs`, `rows.mjs`, `tr3-control.mjs`; the base's `?tuner=0`
  is a base copy without `tuner.js` (`concepts/base-off`), since the CLI adds a query to both sides and the result maps
  no `tuner` switch, and a fresh context has no stored tuning; TR4's base adds `grade-keys.js`, the tuner buttons' own
  `window.__eclipse.motion` calls on the same keys):
  - TR1 partial: no file loads, styles or reads the tuner, every `src` and `href` resolves, Daily's recipes are the
    base's 8 byte-identical plus the four keys and the other pages' identical; but README §"Measurements" still
    compares the tuner's presets by name ("Recommended", "A-like", "v2 preset"), unreported.
  - TR2 pass: 95 light and tuner-overridden properties on `:root` and each card, 3 sizes, both languages, no difference.
  - TR3 pass: without the switch the four keys and another key make no call and change no live text or DOM; frames
    unchanged with reduced motion (with full motion the live pulse changes them with or without keys, the control);
    with the switch at rest the only DOM difference is the language link keeping `live-keys=1`.
  - TR4 pass: 16 items, 644 samples EQUAL at 1 ms and every 20 ms to 800 ms; 12 NOT-HELD on level-up, Arabic, 1-100 ms,
    which the base against itself also shows (12); 14 announcement sequences equal.
  - TR5 pass: 24 presses on the status button, the menu button and a rail link each make exactly their call, open
    nothing and keep the URL; a key held 1 s starts once on both sides.
  - TR6 pass: no DIFFERENT on Daily (84 items, 356 samples), Activity (348, 1,328), components (144, 304) or Access
    (532, 3,434 on a quiet rerun); Reports' one DIFFERENT (phone-language, English, phone, full motion: the 7-day
    segment's hover after the navigation) did not recur in three reruns either way, the base against itself included.
    Every NOT-HELD is a 1 ms or 100 ms press sample that the base against itself shows in kind. Access's first run
    returned all 3,439 samples as callback "problems" and its rerun on a quiet machine none (F171).
  - TR7 pass: the header's elements keep their boxes within 0.5 px against the base with its toggle shown.
  - TR8 pass. TR9 pass: CI green on `aeb7d35a` (F166 ends); one press layer removed from `reports.css:103` fails the
    check, which passes on the result. TR10 pass: only Scope paths, `HISTORY.md` and `evidence/` unchanged, drift and
    doctor pass, tree clean.
- **Failure causes:** the model's, on L1: the brief's limit named the case; the first session took the shorter path and
  the continue brief's R2 did not make it re-run L1's tools. F170 (the brief's heading) cost one manual resume.
- **Disposition:** not merged; `briefs/codex-tuner-removal-fix.md` brings `capture.mjs` back without the tuner, run at
  the base first, and takes the preset names out of README. Side findings: F170, F171.

## tuner-removal-fix: `briefs/codex-tuner-removal-fix.md` (this folder, `763156e0`), result `c2fe4661` on `owner-followup-r04-build`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** the tuner round's grading failure: Daily's `capture.mjs` back with only its tuner parts removed, run at
  the base first (C1), and README's measurements without the tuner's preset names (C2). The review's five readings:
  three closed, two left open (both would add checks the base file never made). The first launch stopped on F172
  (Codex's model list dropped `gpt-5.5`); the review and launch ran after the coordinator pinned the catalog source.
  One run (`codex-round-2d7f3220-fbf8-4120-a1fe-779ad7e1c6c8`), one automatic resume (the brief's headings, so F170
  did not recur), no intervention. Tokens: 102.0M input (100.6M cached), 196k output; start load 87,573.
- **Codex's report** (that folder's `last-message.md`): C1, C2, L1 and L2 PASS; the base file flags 15 frames and the
  result 11, the four more being the tuner's and presets' frames; static guard, `?motion=off` 9/9, intro 6/6 and every
  motion check the same on both; the light measurements equal; three motion contact sheets vary between repeated runs
  on either side. It reformatted the ignored local `.impeccable/config.local.json` so the local ladder's formatter
  passed (F173).
- **Brief rows** 4/4 by the coordinator's checks, with no held-out file (a fix round graded on its brief and the base):
  - C1 pass: the coordinator's own run of the result (`D:/fitway-temp/owner-r04-tuner-grade/fix-capture-result/`,
    log beside it) prints the same verdicts as Codex's result run line for line and exits 1 on the same 11 frames, as
    the base run exits 1 on those 11 and the four tuner frames; 22 of its frames are byte-identical to Codex's base run
    and its four new light crops to the base's "recommended" crops; the four that differ are motion sheets that vary
    between the base's own two runs or between two result runs. Every removed block drives the tuner (its speed rows,
    "Replay intro" button, Motion switch, presets, file check); the outside-plot guard runs as at the base, which
    already skipped it for the STEP3 frames, and README now says so where it had said "16 of 16".
  - C2 pass: the four rows read "Static light", "Low-haze calibration", "High-haze variant" and "High-haze
    reconstruction", values unchanged; a case-insensitive search for the tuner, its presets' names and stored keys finds
    only the word "alike" and the script's "v3 lights" header outside `HISTORY.md` and the evidence folder.
  - L1 pass: only `capture.mjs` and `README.md`; README outside the capture account and the rows unchanged; INDEX
    current (`build-index.mjs --check`, exit 0). L2 pass: CI green on the pushed `c2fe4661`.
- **Failure causes:** none in the brief's rows; F173 is an environment edit outside the Scope.
- **Disposition:** accepted; with it the tuner round's L1 failure is repaired and the build branch's tuner work
  (`58e39ede`, `aeb7d35a`, `c2fe4661`) stands.

## vf-fixes: `briefs/codex-vf-fixes.md` (this folder), continued by `codex-vf-fixes-continue.md` (`81806a2c`), result `9c69abe5` on `owner-r04-vf-fixes`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** the verify-fitway gaps of decision 47: post-action state proofs (V1, F131), address-only features under
  keyboard (V2, F132), declared companion switches (V3, F136), a keyboard press that shows (V4, F149), `SKILL.md` held
  to the CLI (V5, F158), no lease folders left (V6, F161), navigating features under touch and keyboard (V7, F164),
  with limits L1-L3. Held-out rows VF1-VF9 in `D:/fitway-grader/owner-r04/vf-fixes-heldout.md`, written before the
  launch. Two sessions:
  - DeepSeek, fresh (`codex-round-af865e5d-1ef1-4efc-b1b3-f0a3b6975895`): every behaviour written with contract tests
    green, stopped at the user's request before its measurements (its `STOPPED-2026-10-14.md`); the coordinator saved
    the tree as `862dea71`.
  - DeepSeek, fresh (`codex-vf-fixes-continue.md`, `codex-round-3800e181-1edc-4e50-bb03-ff458e5dcd41`): R1 every
    measurement on the delivered commit, R2 the saved change judged against `088711e0`; two automatic resumes, no
    intervention. Tokens over the three runs: 402.8M input (399.6M cached), 412k output; start load 87,345.
- **Codex's report** (that folder's `last-message.md`): R1, R2, V1-V7 and L1-L3 PASS on `9c69abe5`. R2: nothing
  deleted or emptied; keyboard expectations moved from Enter to Space for V4; the compare tests' temp roots and the
  speed test's cache root moved under the round's temp folder (reverting them reproduced 120 s timeouts). V6 removed
  721 empty lease folders and 12 dead claims. L1: 1,224 and 2,448 items, the same verdicts; two transient self-differences
  on Daily's `preset=aLike` reran EQUAL.
- **Brief rows** 12/12 by the coordinator's checks: R1 and R2 pass (the diff `088711e0..9c69abe5` holds only the nine
  files R2 lists; the removed test lines are the Enter expectations, now Space, and the two temp roots); V1-V7 and
  L1-L3 through the held-out rows below, V3 by its own measure (no capture problem named for those switches) though
  VF3 finds the arrival itself cannot be captured; L3 also by CI (green on `9c69abe5`).
- **Held-out, graded by the coordinator** (`D:/fitway-temp/owner-r04-vf-fixes-grade/`: `job.mjs`, `mkrec.cjs` for the
  recipe copies, `queue-a.sh`, `queue-b.sh`, `vf5.sh`, plants under `plants/`; CLIs extracted at `088711e0` and
  `9c69abe5`, their `node_modules` junctions listed in `JUNCTIONS.txt`; concept `4352181f`, the tuner still in it):
  - VF1 pass: an `afterActions` rule for Access `fail=1` reading a planted text failed all 4 items ("State text missing:
    #pin-view-alert must contain VF1-PLANTED-NOT-ON-PAGE"), the same rule reading non-empty text passed 4/4, and with no
    `fail` rule the items were refused ("No observable state proof for fail=1").
  - VF2 pass: Reports' range and export under `--inputs keyboard`, Arabic and English, desktop and phone, 16 items EQUAL
    (the HEAD CLI: KEYBOARD-UNREACHABLE); a planted feature whose only path activates the page's `h1` stayed
    KEYBOARD-UNREACHABLE on both sides.
  - VF3 partial: a declared `case=long` dependency conflicting with the source-found one was refused with "declared
    dependency conflicts with source for case=long: record conflicts". `arrive=500` with its declared `state=loading`,
    the arrival proved by `phase === 'ready'` after the actions: 8 of 8 items problems on both sides
    ("page.waitForFunction: Timeout 5000ms exceeded"); the error frames show the payload arrived. The runner proves the
    before rules again after the before capture (unchanged since the base), and `state=loading` is false once the
    payload lands at about 0.9 s (a probe of the page), so no arrival can be captured (F175). Codex's V3 drive passed
    these items by timing, its arrival proof (`main` visible) not reading the arrival.
  - VF4 pass, on Activity's `dates` button instead of `g-dates-release`: the row named a pointer-hold feature, which no
    keyboard can hold (the coordinator's error in the row; KEYBOARD-UNREACHABLE on both sides, as it should be). The
    release plant (`--press-fade` 120 to 160 ms) is DIFFERENT at 100 ms under `--inputs keyboard --timeline` as under
    the mouse, the concept against itself EQUAL (10 samples), and the HEAD CLI's keyboard run misses the plant (EQUAL). A
    rail link opened and activated by keyboard reaches Reports, its proof reading `reports.html` (8/8 PASS, mouse too).
  - VF5 pass: the V5 test fails on the stale language-sheet line put back, on `--keep-sheets` in the Compare section and
    at its end, and on the pair 3190-3191; the unplanted copy passes. The same option placed after "Evidence and
    advanced tools" passes (F176).
  - VF6 pass: after both full compares and the 114 verify-fitway tests (114/114, 82 s), `D:/fitway-verify-captures`
    holds no lease folder (the HEAD CLI's two left empty earlier were removed by the result CLI's next run), the root
    otherwise only kept captures; the result's worktree stays clean.
  - VF7 pass: `language` on Reports, Access and Activity and Access's `record-navigation` under touch and keyboard,
    Arabic and English: every desktop item EQUAL (32), every phone item NOT-REACHABLE by the recipes' `wide` width
    (32); with the English title planted, Reports' Arabic-to-English items are DIFFERENT under touch and the
    English-to-Arabic ones EQUAL.
  - VF8 pass: the full mouse self compare, 4 workers, cache off: 1,224 items with both CLIs (372.9 s and 380.6 s), every
    verdict the same but one, Daily `state=closed` Arabic phone, DIFFERENT on the result side on the tuner's Lights chip
    (681 px, a half-pixel shift, F126); that item reran EQUAL 3 of 3 with the result CLI and 1 of 1 with the HEAD CLI.
  - VF9 pass: only `.agents/skills/verify-fitway/**` changed; CI green on `9c69abe5`; the merge's run below.
- **Failure causes:** VF3's arrival half is a runner behaviour older than the round (F175) that its measure could not
  show; VF4's first form was the coordinator's row. Side findings: F174 (a unit test's timeout on main's CI), F175,
  F176; F168 stays open, its roots moved to another fixed folder.
- **Disposition:** merged; F131, F132, F136, F149, F158, F161 and F164 fixed.

## encoding-checks: `briefs/codex-encoding-checks.md` (this folder), continued by `codex-encoding-checks-fix.md`, result `c93f423d` on `owner-r04-encoding-checks`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** decision 62's checks half: K1 from the packets (C1, F129), `pnpm main:advance` (C2, F129), the BOM check
  (C3, F140), B3 in `brief:check` (C4), `CLAUDE.md`'s agent table against the definitions (C5), decision 57's count
  with B6, B8 and B13 wrapped (C6), Biome on tracked files only (C7, F173). Review: four readings closed, one left
  open (branch protection), then granted by the user (decision 63). One run (`codex-round-ae11a8ef-...`), no
  resume; start load 88,573.
- **Codex's report:** C1-C7 and L1-L3 PASS at `7965e6c6`. CI failed on it: the C4 test read the five historical
  briefs with `git show owner-followup-r04-build:...`, absent from CI's checkout (F179).
- **Held-out** (`D:/fitway-grader/owner-r04/encoding-checks-heldout.md`; evidence and notes in
  `D:/fitway-temp/owner-r04-encoding-checks-grade/`, `GRADE-NOTES.md`): EC1, EC2 (real dry runs and the real API:
  `1dbaebbf`, `911e4a91` and `79f3efd6` refused on a failed newest run, `446bb9fa` on no run, `85290e95` accepted),
  EC5, EC6, EC7 and EC8 pass; EC3 partial (an exception with an empty reason passed), EC4 partial (a Codex brief with
  neither Scope nor Report passed the B3 rule).
- **Fix:** `codex-encoding-checks-fix.md` (review: two closed, two left open) closed EC3 (`1378ee8e`, replayed: an
  empty reason fails by name). Its F1 broke 176 tests whose fixtures are Codex briefs without a Scope, in
  `codex-round.test.ts` (owned by encoding-launcher) and `path-tokens.test.ts`; the run stopped correctly
  (`STOPPED:`), and the coordinator resumed it to restore F1's gate and vendor the historical briefs as fixtures
  (`c93f423d`, CI green). F1 waits for a round that may change those fixtures (F180).
- **Brief rows** 9/10 (C4 partial); **held-out** 7/8 after the fix. Brief-caused: none in the rows; the CI failure
  traces to the brief's CI line, which did not say the checkout holds no other branch (now in the fix briefs).
- **Disposition:** merged (`0906f2a2`); AGENTS.md and WORKFLOW.md name the command (`9deee692`), whose first real use
  moved main from `1cce3b8d` to `9deee692`.

## encoding-launcher: `briefs/codex-encoding-launcher.md` (this folder), continued by `codex-encoding-launcher-fix.md`, result `d6e603fc` on `owner-r04-encoding-launcher`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** decision 62's launcher half: bare readings (E1, F169), a preface (E2, F162), a silent read in the copy
  path (E3, F156), every brief's outcome IDs (E4, F170), `--message` under Git Bash (E5), `TEMP`/`TMP` (E6, F110,
  F118), test timeouts (E7, F174). Before launch E7's margin went from 3x to 8x: the baseline already met 3x
  (5.4 s locally against 26.4 s on CI). Review: four closed, one left open. One run (`codex-round-ec7c6878-...`), one
  automatic resume; start load 88,728.
- **Codex's report:** E1-E7, L1, L2 PASS at `ba84fd20`; its own E4 list showed no IDs for most briefs.
- **Held-out** (`D:/fitway-grader/owner-r04/encoding-launcher-heldout.md`; `D:/fitway-temp/owner-r04-encoding-launcher-grade/`):
  EL1 and EL2 pass on five held-out answers (EL1's "still refused" form was the coordinator's error: column-0 items
  are starts); EL6, EL7, EL8 pass; EL3 partial (a `git show` read passes); EL4 fail (the ID rule required the bold to
  close after the ID, `- **K1.**`, as the brief wrote it, so most briefs yield none and would be refused, F178); EL5
  fail (through `pnpm codex:round` the guard saw pnpm, not bash).
- **Fix:** `codex-encoding-launcher-fix.md` (review: three closed, one left open), run `codex-round-ebda0632-...`, three
  automatic resumes, start load 89,676. `2df1f970` closed G1 (every brief's exact IDs pinned) and G4 (the 8.3 test
  probes every drive). Replays: G2 still failed (under pnpm the ancestor walk stops at an exited pnpm process, F181)
  and G3's `git show` plant still passed (the test sees only reads through the launcher's instrumented helpers). The
  coordinator resumed it for G2: `e315a2c2` decided from `MSYSTEM` and the parent's name, passed the replays, and
  failed CI (the runner's tree under pnpm differs); after that third failure the approach changed (AGENTS.md, two
  failed repairs): `d6e603fc` decides from `MSYSTEM` alone and the tests set it explicitly; replayed refused from
  Git Bash through `pnpm -s`, passed from PowerShell; CI green. G3 accepted as partial; F156 stays open for the
  child-process route. The coordinator merged `e315a2c2` locally before reading its failed CI and reset it before
  any push; the merge command now refuses unless the run's conclusion is success.
- **Brief rows** 6/9 at first delivery (E3 partial, E4 and E5 fail), 8/9 after the fix; **held-out** 7/8 after the fix
  (EL3 partial). Brief-caused: E4 (the literal `- **X1.**`, F178). Model-caused: E5's first test bypassed pnpm.
- **Disposition:** merged (`3554065b`) after CI on `d6e603fc`.

## no-comments: `briefs/codex-no-comments.md` (this folder), report-only, at `c699d3fb` on `owner-r04-no-comments`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** decision 56's report-only trial of pstack's comment rules on the tool code. Review: four closed, one
  left open (reading 3: narration a rule deletes needs no proof; evidence is required where a flag would become a
  finding). One run (`codex-round-5175a893-...`), stopped by the user with wave 1 (decision 65) and resumed on its
  thread by the next coordinator; no automatic resume; start load 89,154.
- **Codex's report:** N1, N2, L1, L2 PASS: 25 files, 167 comments found by two syntax-aware passes that agree on every
  span (Acorn and Babel), 50 kept and 117 deleted; 51 `MUST KILL` symbols, 50 confirmed, none refuted, one unclear
  (`probes.mjs:11`, whose external library is absent from the checkout). Tables in `D:/fitway-temp/owner-r04-no-comments/`.
- **Grading (coordinator):** every row of `comments.tsv` checked against `c699d3fb` by a script (file, line and quoted
  text: 0 mismatches of 167); three `MUST KILL` rows read against the code (`codex-round.mjs` `findCodex` and
  `assertOutsideGit`, `probes.mjs:8-11`) bear out their reasons.
- **Reading:** by these rules seven comments in ten would go, and 50 symbols carry a policy only in prose, most in
  `codex-round.mjs` (8) and the verify-fitway runner, CLI and core.
- **Disposition:** report-only. As decision 56 says, each of the 50 confirmed `MUST KILL` flags is a finding,
  F184-F233 (`seen_by` `maintainer`, `demo` `waits`; decision 67); the `unclear` one is not. The table is kept as
  `no-comments-must-kill.tsv` beside this file. Corrected on 2026-10-15: this record first said no finding was opened,
  against decision 56 (coordinator's error, found in the poteto-mode review).
## diagnosis: `briefs/codex-diagnosis.md` (this folder), report-only, at `c699d3fb` on `owner-r04-diagnosis` with the concept at `c2fe4661`, GPT-6.1 Sol, level `xhigh`

- **Set-up:** decision 64's report-only diagnosis of F148 (D1), F165 (D2) and F171 (D3), with fixes proposed (D4).
  Review: five closed. One run (`codex-round-f84ff767-...`), stopped with wave 1 and resumed on its thread (the
  interrupted tool call logged "output is missing" errors on resume, harmless); start load 28,351; ports 3188-3189.
- **Codex's report:** D1 FAIL and D2 FAIL (no reproduction: 90 D1 runs across controls, workers, motion, raster,
  fixed times and CPU load; 40 touch runs on the four pages); D3 PASS (the all-problems run did not recur: 3,438 of
  3,439 samples EQUAL, one glyph-fringe NOT-HELD; every one-factor A/B control EQUAL); D4 FAIL as asked (proposals
  without the failing-before proof, since nothing reproduced); L1, L2 PASS (141 ledger rows in order).
- **Grading (coordinator):** quoted verdict lines reproduced from `d1-full-02.log`, `d2-status-access-10.log` and
  `d3-subset-nocallback-4w.log` (measured); the D3 summary matches its counts (measured). The ledger's load column is
  wrong: 130 of 141 rows say "quiet machine", yet the first run started at 13:00 while reports-css's and vf-runner's
  resumed runs were comparing on 3176-3177 and 3186-3187 (measured from the start times against the resume times).
  So D1's and D2's "under stated load" does not hold, and the non-reproduction happened under unrecorded load.
  The D1 no-cause list also lacks its icon-raster control, and D2's reduced-motion control never ran.
- **Brief rows** 3/6 (D3, L1, L2; D1, D2 and D4 fail as written). Cause: the coordinator's (decision 64 put a
  load-sensitive diagnosis beside three rounds' compares, against B13's quiet machine), and the model's (a load label
  it did not check). F148, F165 and F171 carry the result; they stay open.
- **Disposition:** report-only. A rerun of D1 and D2, if wanted, waits for a machine with no other round.
## launcher-fixes-4: `briefs/codex-launcher-fixes-4.md` (this folder), result `954968b0` on `owner-r04-launcher-fixes-4`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** F182 (J1, one-line readings) and F156's child-process route (J2, after two failed repairs: the
  observation moved off the launcher's own reports). Reviewed by both models (decision 66): DeepSeek returned five
  readings, all closed, none raised by Sol; Sol returned one, closed, not raised by DeepSeek: row F182 was absent at
  the brief's first HEAD `c699d3fb`, so Codex would have stopped on a missing source (F234: `brief:check` checks no
  rows); the unused worktree moved to `3bb0eae8`. One run (`codex-round-52aae6d6-...`), two automatic resumes, about
  35 minutes; start load 87,874; tokens 80.5M input (79.1M cached), 179k output (measured from the run's events).
- **Codex's report:** J1, J2, L1 PASS; L2 FAIL locally (port 3176 held by reports-css, F183; the file alone passed
  78/78) and two Git Bash tests failing in its sandbox (F237); CI on `954968b0` passed.
- **Held-out** (`D:/fitway-grader/owner-r04/launcher-fixes-4-heldout.md`), graded by GPT-6.1 Sol `xhigh`
  (`briefs/codex-launcher-fixes-4-grade.md`, run `codex-round-1f6251a7-...`; it first stopped on the round's brief
  read at its own HEAD, older than the version launched, a coordinator brief gap, then hit an account usage limit and
  was resumed on another saved account by `resume-auto.sh`, whose generic message replaced the coordinator's
  clarification yet sufficed): LF2-LF6 pass; LF1 partial: answers with the parts reordered or with em-dash labels
  read as 5, but five readings with reading 3 wrapped onto a column-0 line are refused whole (F235). The coordinator
  reproduced LF1 from the grader's script (measured: `wrapped: count=0 refused=true`, the other two `count=5`).
  The coordinator's own probe of the keyword test (`completeOneLineReading`) read two contrived non-readings as
  readings and refused one complete unlabeled reading (measured on five synthetic lines; F236).
- **Brief rows** 4/4; **held-out** 5/6 (LF1 partial). Brief-caused: none in the round. Model-caused: LF1's wrap.
- **Disposition:** merged; LF1's failure is the safe one (the launcher stops and the review reruns). F156 and F182
  are fixed; F235 and F236 go to the next launcher round.
## vf-runner, one brief on both models (decision 66): `briefs/codex-vf-runner.md` (Sol arm, result `78a1c34e` on `owner-r04-vf-runner`, GPT-6.1 Sol `xhigh`) and `briefs/codex-vf-runner-ds.md` (DeepSeek arm, result `3ac1770a` on `owner-r04-vf-runner-ds`, DeepSeek V4.1 Flash `max`), both from `c699d3fb`

- **Set-up:** F175 (V1, a state that changes with time), F168 (V2, test roots), F176 (V3, the whole guide). The
  DeepSeek arm's brief differs only in worktree, branch, temp folder and port pair (3188-3189, since the Sol arm held
  3186-3187); its review's five readings were left open to keep the briefs identical.
- **Runs (measured from the run folders):** Sol about 3 h 01 min of work around the user's wave-1 stop, 62.1M input
  tokens (61.4M cached) and 61k output in the resumed turn, no automatic resume, one intervention (the stop and the
  coordinator's resume message); DeepSeek about 71 min, 80.8M input (78.6M cached) and 144k output, one automatic
  resume, no intervention. Both reported V1-V3 and L1 PASS and L2 FAIL locally (Sol: two Git Bash tests, F237;
  DeepSeek: port 3176 held, F183); CI passed on both commits.
- **Grading:** each arm by GPT-6.1 Sol `xhigh` (`codex-vf-runner-grade-sol.md`, `-grade-ds.md`, identical apart from
  worktree and ports, the same two readings closed in both) and by Opus (`owner-direction-verifier`, `high`;
  decision 67) from fresh worktrees without Sol's verdicts. Where graders disagreed, or two graders measured a row
  differently, the coordinator's replay decided (all measured; `D:/fitway-temp/owner-r04-encoding-coord/vf-runner-trial-replays.md`):
  - G1: both arms' CLIs capture the skeleton with a recipe whose loading proof needs `data-load="shown"`; with the
    concept's own proof (F160 at `c2fe4661`) the before frame is the pre-skeleton wait, so Opus's G1 failure on the
    Sol arm came from its recipe: PASS for both. The concept's recipes declare no arrival proof at all, so every
    grader wrote one.
  - G5 on the DeepSeek arm: Sol's grader saw P3 fail once at about 92% CPU; Opus and the coordinator's rerun of the
    grader's own driver passed: PASS (P3 looks load-sensitive).
  - G6 and G7, seven plants on the base and both arms, after "Evidence and advanced tools" and before "## Compare":
    the Sol arm lets the three `measure` lines through; the DeepSeek arm lets a line holding "pnpm" and a line
    holding "measure tool arguments" through; the base catches all seven before "## Compare". Both arms FAIL G6
    and G7 (an existing guard narrowed), and each arm's "V3 PASS" is an overclaim.
  - G3: no test of either arm notices the static after-capture proof disabled (both FAIL). Opus on the DeepSeek arm:
    any `afterActions` rule also drops every static rule's post-capture proof on that item (`runner.mjs:647-648`).
- **Brief rows** 3/5 each (V1, V2 and L2 hold; V3 and L1 do not). **Rows:** Sol arm G1 P, G2 P, G3 F, G4 P, G5 P, G6 F, G7 F = 4/7; DeepSeek arm the same, 4/7. Overclaims: one
  each (V3). Other overclaims replayed and not found: the self compares, the full compare (the Sol arm's 1,656
  items are 828 per transport, `http` and `file://`), the V1 tests, the cache-root seam.
- **Rule as written:** rows tie, overclaims tie, interventions 0 against 1: the DeepSeek arm wins. The one Sol-arm
  intervention was the user's wave-1 stop, not something the round needed; without it the arms tie on every count.
  Neither arm leads by two rows and both overclaim, so decision 64's split stays. Brief-caused: G3 and the guide's
  keyword exemptions (the brief asked for "an allowlisted non-CLI executable, judged per command" without naming
  the allowlist, which the review's reading 4 had raised and was left open to keep the Sol arm's brief as run).
- **Disposition:** only the DeepSeek arm can merge, after a fix round for G3, G6 and G7 (F238-F240); the Sol arm's
  branch is kept unmerged.
## reports-css: `briefs/codex-reports-css.md` (this folder), result `23314b3a` on `owner-r04-reports-css`, DeepSeek V4.1 Flash, level `max`

- **Set-up:** decision 47's shared styles out of `reports.css` (C1-C3, C5) and F160's loading proofs (C4). One run
  (`codex-round-6f244aad-...`), stopped with wave 1 and resumed on its thread, two automatic resumes.
- **Codex's report:** C1-C5 and L1-L4 PASS: `shared.css` 57 rules, `reports.css` 318, union 375 as at the base;
  C2's matrix 2,008 EQUAL, 0 DIFFERENT; no TIMELINE DIFFERENT; loading proofs EQUAL in 3 of 3 runs.
- **Held-out** (`D:/fitway-grader/owner-r04/reports-css-heldout.md`), graded by GPT-6.1 Sol `xhigh`
  (`briefs/codex-reports-css-grade.md`, across an account switch): RC2, RC3 (full compare 738 EQUAL, 0 DIFFERENT),
  RC5 (the result's loading frames show the skeleton, 24/24 EQUAL under concurrent compares), RC6, RC7 pass; RC1 and
  RC4 fail as graded. The coordinator's reading of the source (inferred, not a browser probe) settles RC1:
  `.rbtn.is-disabled` is written by `reports.js` and `components.js` (two pages; the probe did not reach the
  specimen's state); `.field-hint` and `.field-err .ico` are Access's alone, but Access no longer loads `reports.css`,
  so they must sit in `shared.css` for Access to stay unchanged (a tension in the coordinator's C1 and RC1, not a
  defect); `.field.is-disabled` stays in `reports.css`, which the components sheet loads. RC4's NOT-HELD on Access's
  `pin-copy` (7, 2 and 2 pixels at 1, 61, 141 ms) is the item the diagnosis round measured NOT-HELD on the base
  `c2fe4661` the same day (a 7-pixel glyph fringe, F126's family): the base's own variation.
- **Brief rows** 9/9; **held-out** 7/7 after the coordinator's settling (5/7 as graded). Brief-caused: RC1's "two
  pages" wording against C1's moved pages.
- **Disposition:** fast-forwarded `owner-followup-r04-build` to `23314b3a` after its CI passed; no pixel changed, so no
  visual acceptance is due. F160 is fixed; the shared lows (decision 47) can follow.## vf-runner-fix: `briefs/codex-vf-runner-fix.md` (this folder), result `1ff1f9cf` on `owner-r04-vf-runner-ds` (base `54cb1ecb`: `3ac1770a` plus the coordinator line), DeepSeek V4.1 Flash, level `max`

- **Set-up:** F238 (W1, post-capture proofs tested and kept per declared ended rule), F239 (W2, the guide's exemption
  per command), F240 (W3, test roots under `os.tmpdir()`), F183 (W4, no fixed ports in tests). The branch first
  took the coordinator line (`54cb1ecb`) so the brief's findings rows existed at its HEAD (F234's gap). Reviewed by
  both models (decision 66) on the same `prompt.md` and `sources/`: DeepSeek five readings, all closed; Sol four,
  three closed (its 4 the same as DeepSeek's 2), one left open (the `changesState` waiver predates the round and
  needs recipe declarations on the build branch: F241). Sol closed readings DeepSeek did not raise: 2 (an
  `afterActions` rule unproven after the after capture; fixed high ports); DeepSeek's not raised by Sol: 4.
- **Run (measured from the run folder `codex-round-0bf045c9-...`):** launched 18:43, one automatic resume (19:31),
  one coordinator resume (19:37-19:58); 173.2M input tokens (171.0M cached), 315k output. The automatic resume's
  report named commit `68e86379` (it does not exist) and L2 PASS, while that turn ran no `git commit` and no
  `verify.mjs` (F242); the coordinator's resume message (`coordinator-resume-1.md`) asked for each step as a real
  call: the first ladder failed on Biome formatting, the second and third passed, commit `1ff1f9cf`.
- **CI on `1ff1f9cf` failed** in five launcher tests outside the round's scope: they relied on `D:/fitway-temp`
  existing on the runner, which only the old compare tests had made (F243, fixed by the coordinator in `772400e4`).
- **Grading:** GPT-6.1 Sol `xhigh` (`briefs/codex-vf-runner-fix-grade.md`, G1-G12, its review's five readings closed;
  run `codex-round-761398f0-...`, account `ryshyjhad85`, no limit reached) and Opus (`owner-direction-verifier`,
  `high`, decision 67) on the held-out rows (`D:/fitway-grader/owner-r04/vf-runner-fix-heldout.md`, VF1-VF12), each
  from its own worktree. Sol: G5 and G8 FAIL, the rest PASS. Opus: VF8 FAIL (CI red), VF12 PARTIAL, the rest PASS,
  with findings that the guide's exemption survives a separator written onto a token and that the tests still bind
  3176 when it is free. The coordinator's replays (all measured):
  - G5 (g): in a copy of the result, `... -- --max-stops 40; node $cli drive --no-such-flag` passes the guide test and
    the same with ` ; ` fails it: the exemption ends only at a whole-token separator. W2 FAIL; at `c699d3fb` (main's
    verify-fitway) that plant failed before "Evidence and advanced tools", so the merge would narrow a guard.
  - G12 / VF12: with every port free, one run of `cli.test.mjs` passes 81/81 and listens on 3176 46 times (a `net`
    hook through `NODE_OPTIONS`); Sol's G12 ran with its own holder on the pairs, so the lease check refused first.
    W4 FAIL.
  - G8: the V5 predicate changed as W2 required; the options no longer required in the guide (`--forced-colors`,
    `--help`, `--dir`, `--frozen-lockfile`) are not CLI options by W2's definition; the other two changed test
    bodies only add fixture setup. G8 PASS (the grading brief's wording conflicted with W2: grader-brief-caused).
  - VF8: CI red came from F243, settled by the merge's CI.
- **Brief rows** 4/6 (W2 and W4 do not hold); **held-out** VF 10/12 as graded, 11/12 once VF8's CI settles (VF12
  fails); overclaims 3 (the commit and L2 in the automatic resume; W2's "another command's option refused"; W4's "no
  test bound 3174-3189", measured only with the pairs held). Interventions 1. Brief-caused: W4's check named the
  held condition and the free one only through "binds", which a held-port run cannot see.
- **Disposition:** not merged yet; a second fix round (`briefs/codex-vf-runner-fix-2.md`, from `1ff1f9cf`) for the
  attached separator, the doctor's port probe and Opus's per-language `ends` refusal; F244 (a failed proof names no
  rule) is recorded for the next verify-fitway round.
## vf-runner-fix-2: `briefs/codex-vf-runner-fix-2.md` (this folder), result `a8791d1a` on `owner-r04-vf-runner-ds` (from `1ff1f9cf`), DeepSeek V4.1 Flash, level `max`

- **Set-up:** Y1 (F239: the exemption ends at any unquoted separator, attached or not), Y2 (F183: no test probes a
  verification port even when free; `doctor`'s fix suggestion was the probe), Y3 (Opus's per-language `ends`
  refusal), L0 (each new case fails on the HEAD's code). Both reviewers (decision 66): DeepSeek five readings, all
  closed; Sol one, closed, not raised by DeepSeek in that form (an `ends` entry whose only match is in another
  language). The brief told Codex its report is checked against the run's recorded commands (F242).
- **Run (measured):** launched 21:02, report at 21:35; six automatic resumes, no intervention; 158.2M input tokens
  (154.5M cached), 622k output; start load 42,538. The report's commit, `git rev-parse` and ladder all appear in the
  events (`events-resume-3.jsonl:12`, `events-resume-5.jsonl:30`, exit 0).
- **Grading:** GPT-6.1 Sol `xhigh` (`briefs/codex-vf-runner-fix-2-grade.md`, its review's five readings closed; run
  `codex-round-a720d473-...`, account `ryshyjhad85`): G1-G6, G8, G9 and L1 PASS; G7 FAIL as written, because Y1's
  parser lives in the test file, so copying the test file onto the base copies the repair; with the base parser
  restored all eight new refusals fail, and the Y2 and Y3 cases fail on the base code: G7 PASS once settled
  (grader-brief-caused). No Opus grade (a small repair round; decision 67 leaves it to the coordinator). The
  coordinator replayed G3 (measured): with 3174-3189 free, the four test files pass 120/120 under a `net` hook,
  873 events, none in 3174-3189.
- **Brief rows** 6/6 (L2 by the merge's CI); **held-out** (`D:/fitway-grader/owner-r04/vf-runner-fix-2-heldout.md`)
  9/9; overclaims 0; brief-caused failures 0.
- **Disposition:** merged with the arm into the coordinator line (`f6ef81cf`); F168, F175, F176, F183 and F238-F240
  are fixed. The trial's DeepSeek arm took three rounds to merge (the arm, two fixes), and DeepSeek's reports needed
  a coordinator check against the run's commands once (F242).

## vf-proofs: `briefs/codex-vf-proofs.md` (this folder), result `0eafd08c` on `owner-r04-vf-proofs` (from `5b81b3b7`), DeepSeek V4.1 Flash, level `max`

- **Set-up:** S1 (F241's mechanism: a feature may declare `ends`; the before rules it does not end are proved beside
  the after frame; `changesState` alone unchanged), S2 (F244: a failed state proof names its rule and one of four
  moment tokens). Both reviewers (decision 66): DeepSeek five readings, four closed, one left open (an `ends` claim
  is the recipe author's, as an arrival's); Sol two, one closed (rule identity, also DeepSeek's), one left open and
  recorded as F248 (a re-proof that recovers within its wait). Launched in parallel with launcher-fixes-5 and
  brief-ladder (decision 64).
- **Run (measured):** launched 2026-10-15 23:45, one turn, no automatic resume, no intervention; start load 42,379.
  The report's commit and its ladder (exit 1, the two F237 tests only, before the commit) appear in the events; the
  report said L2 FAIL locally, honestly.
- **Grading:** GPT-6.1 Sol `xhigh` (`briefs/codex-vf-proofs-grade.md`, two reviews: the first answer unreadable to the
  launcher, F249, its readings closed by hand; the second's five readings four closed, one left open): G1-G8 and L1
  PASS (1,988 compare JSON files equal across both CLIs, ar and en, wide and phone); G9 FAIL as written because the
  report's inventory left out `components.html`, which has no `changesState` feature (grader-brief-caused, not a
  defect). The coordinator reproduced G7 (measured): the four new tests fail on the base with AssertionError, 0/4,
  and pass at the result, 4/4. CI run 38808348149 passed on `0eafd08c`.
- **Brief rows** 5/5; **held-out** (`D:/fitway-grader/owner-r04/vf-proofs-heldout.md`) 9/9; overclaims 0;
  brief-caused failures 0.
- **Disposition:** merged into the coordinator line (`bb313de0`). F244 is fixed; F241 stays open until the build
  branch's `changesState` features carry their `ends` declarations (the report lists them per page).

## brief-ladder: `briefs/codex-brief-ladder.md` (this folder), result `166a4ba7` on `owner-r04-brief-ladder` (from `5b81b3b7`), DeepSeek V4.1 Flash, level `max`

- **Set-up:** Q1 (F234: `brief:check` checks the rows a brief names, in every spelling, at the named HEAD), Q2 (F246:
  every ladder line carries a clock time, a failed step its duration and exit code, and the first mutating step is
  named at once). Both reviewers: DeepSeek five readings, two closed, three left open; Sol three, all closed (two not
  raised by DeepSeek: the template's backticked IDs and naming a mutation at the moment it happens).
- **Run (measured):** launched 23:45, five turns (four automatic resumes), no intervention; start load 42,299. The
  report's commit and its post-commit ladder (exit 1, F237 only) appear in the events.
- **Grading:** GPT-6.1 Sol `xhigh` (`briefs/codex-brief-ladder-grade.md`): G1-G5, G7 and L1 PASS (the case that
  slipped through, F182 at `c699d3fb`, now fails; 39 briefs give identical results apart from none); G6 FAIL as
  written because three added tests are positive controls that pass on the base (brief-caused: L0 asked every new
  case to fail). The coordinator reproduced a missing row (measured): the result's checker fails `rows F234 and
  F9999` naming F9999 and the HEAD; the coordinator line's checker passed it. CI passed on `166a4ba7`.
- **Brief rows** 4/5 (L0 as written); **held-out** (`D:/fitway-grader/owner-r04/brief-ladder-heldout.md`) 8/8;
  overclaims 0; brief-caused failures 1 (L0's wording for positive controls).
- **Disposition:** merged into the coordinator line (`abf26cdf`); F234 and F246 are fixed.

## launcher-fixes-5 with fix and fix-2: `briefs/codex-launcher-fixes-5.md`, `-fix.md` and `-fix-2.md` (this folder), results `4964b95d`, `34065b3d` and `0949bea1` on `owner-r04-launcher-fixes-5` (from `5b81b3b7`), DeepSeek V4.1 Flash, level `max`

- **Set-up:** P1 (F235, wrapped readings), P2 (F236, readings known by labelled parts; REVIEW.md asks for the labels),
  P3 (F237, the Git Bash tests in Codex's sandbox), P4 (F242, a report's commit and ladder checked against the run),
  P5 (F245, a per-turn `turns.jsonl` and stderr file). Both reviewers on each brief (decision 66): the first brief
  DeepSeek five (four closed), Sol four (two closed); fix DeepSeek five (all closed), Sol three (two closed); fix-2
  DeepSeek five (three closed), Sol five (four closed).
- **Runs (measured):** the first in two turns, start load 42,630; fix in three, 42,719; fix-2 in four, 91,488 (it read
  the grader's case file whole). Each report's commit and post-commit ladder appear in its events; the first and fix
  named every check PASS and the ladder passed locally (P3 at work).
- **Grading:** GPT-6.1 Sol `xhigh` on `4964b95d`: FAIL. G5-G7 and G9 PASS (all seven false reports resumed; the
  timeline right), but G1 (a reading wrapped after `Gap:` refused), G2 (an empty part read), G3 (two inline test
  answers rewritten to fit the stricter parser, brief-caused: P1 had applied the label rule to indented
  continuations) and G8 (new cases failing on ENOENT before their assertions). The accepted change: the test that
  lists events files now filters `events*.jsonl`, since P5 adds `turns.jsonl`. Sol on `34065b3d` (account switched
  to `smhsdxsz5h` at a usage limit, decision 72): all PASS except G3, two real review answers refused; the
  coordinator traced it (measured): `labelledParts` took a label quoted inside a reading's prose as an empty part.
  fix-2 graded by the coordinator (decision 67; a small repair): three parsers replayed on 88 review answers and
  fixtures (measured): the result refuses none the base read and gives the base's text wherever the base reads; five
  answers `34065b3d` refused now read; an unquoted empty part is still refused. CI passed on `0949bea1`.
- **Brief rows** 7/8 after fix-2 (L1's predicate change accepted); **held-out**
  (`D:/fitway-grader/owner-r04/launcher-fixes-5*-heldout.md`) all after fix-2; overclaims 0; brief-caused failures 1
  (G3's rewritten answers).
- **Disposition:** merged into the coordinator line (`7cd265b2`); F235, F236, F237, F242, F245 and F249 are fixed.
  Two review answers this night were unreadable to the old launcher (F249 and quoted labels); the merged parser reads
  both.

## ladder-seam: `briefs/codex-ladder-seam.md` (this folder), result `4131dd8c` on `owner-r04-ladder-seam` (from `c87bf5b3`), DeepSeek V4.1 Flash, level `max`

- **Set-up:** V1 (F250, found by a side session and reproduced by the coordinator: `FITWAY_VERIFY_TEST_STEPS='[]'`
  made the real ladder pass with no step); the user asked for it after launcher-fixes-5-fix. Both reviewers:
  DeepSeek three readings (two closed, one left open: PATH is the machine's), Sol five (all closed).
- **Run (measured):** the first round with the merged launcher (`7cd265b2`): eight turns in `turns.jsonl`, one "no
  report", six "claim check failed" and one accepted; start load 91447. The six were F254: the report cited the base
  SHA for comparison and the check read it as the commit claim. The commit and a post-commit ladder (exit 0, run
  with Git's `usr/bin` put first on PATH because this worktree predates F237's fix, disclosed) appear in the events.
- **Grading:** the coordinator (decision 67; a small round), on the held-out rows (measured): with the variable set,
  `fast` and `phase --phase 2` start the real "Repository invariants" step; `verify.mjs` reads only
  `FITWAY_PHASE`, `ComSpec` and the steps' own environment; `parseFastSteps` returns the same eight steps. CI
  passed on `4131dd8c`.
- **Brief rows** 4/4; **held-out** (`D:/fitway-grader/owner-r04/ladder-seam-heldout.md`) 6/6; overclaims 0.
- **Disposition:** merged into the coordinator line (`bafb2b6e`); F250 is fixed; F254 recorded for the next launcher
  round.

## Evaluation: both reviewers, decision 66's rule applied (2026-10-16)

- **Count (measured by a Sonnet researcher from each brief's two review folders and dispositions under
  `D:/fitway-temp/brief-review/`; the coordinator reproduced ladder-seam's row):** Sol readings the coordinator closed
  that DeepSeek did not raise, per brief: launcher-fixes-4 1, vf-runner-fix 2, vf-runner-fix-2 1 (borderline),
  vf-proofs 0, brief-ladder 2, launcher-fixes-5 1, launcher-fixes-5-fix 1, launcher-fixes-5-fix-2 2 (borderline, up to
  3), ladder-seam 3: 13 over nine briefs, 1.44 per brief (12 to 14 with the borderline calls, 1.33 to 1.56).
- **Rule result:** at least four briefs and at least one such reading per brief, so GPT-6.1 Sol at `xhigh` is a second
  reviewer for every brief from 2026-10-16, on the same `prompt.md` and `sources/` in a copy of the launcher's review
  folder (`<review folder>-sol`), with its own `dispositions.md`.
- **Pickup check (decision 67, measured):** the resume point's tally ("three briefs reviewed by both models") was
  stale; six more briefs had both reviews.

## shared-lows-fix-2: `briefs/codex-shared-lows-fix-2.md` (this folder), result `4cc2db93` on `owner-r04-shared-lows` (from `9619f3ce`), DeepSeek V4.1 Flash, level `max`; review fix `538b280a`

- **Set-up:** the shared-lows grade (`briefs/codex-shared-lows-grade.md`, G1-G16 at `f87906ea`) found four causes:
  the brand item's second ring (its G4), a ring after a mouse arrival (G6), changes beyond the rings (G7) and the
  error ring's colour outside `style.css` (G14). The coordinator first moved the specimen rings into the shared rule
  (`9619f3ce`). Both reviewers.
- **Run (measured):** four turns in `turns.jsonl`: two "no report", one "claim check failed" (F263) and one
  accepted; start load 92343. Its report: P1-P4 PASS, L1 FAIL (7 Access timeline samples differing, 3 Activity
  `clear-search` samples not held in forced colours). Its Sol diff review (`D:/fitway-temp/code-review/shared-lows-3/`)
  gave three blocking findings, applied by a fixer at `538b280a`.
- **Grading:** GPT-6.1 Sol `xhigh` (`briefs/codex-shared-lows-fix-2-grade.md`, G1-G11), run
  `D:/fitway-temp/codex-round-3e6c4f04-9467-4931-a8c2-46e6b433af71`, resumed once on another account after a usage
  limit. Verdict FAIL on G1, G2, G4, G5, G8, G9 and G11. The coordinator's reading (decision 67; its scripts and logs
  are in `D:/fitway-temp/owner-r04-shared-lows-fix-2-grade/coordinator/`):
  - G1 (680 reachable checks, 0 mismatches) and G2 (568 of 584 pass): the grading brief's wording. Components has no
    `#brand` and an inert rail. On a product page opened directly in its error state at desktop size, `#retry` is
    the last tabbable element, so Tab leaves the document (reproduced on Reports and Daily); Shift+Tab gives the
    2 px ring, and at phone size the tab bar follows `#retry` and the ring shows.
  - G4: 113 of 119 items differ outside the stroke. In 109 every difference above 8 colour units lies inside the
    focused element's box; the other 4 are 6 to 9 anti-aliased pixels on a neighbouring button's corner (at most 30
    units). Settled frames differ by at most 3 units outside the ring. The larger differences are mid-animation
    samples of Access dialogs (the eye icon at 200-300 ms, equal again by 400 ms), attributed by elimination to the
    mouse ring HEAD removes: no other rule for the field or the eye changed. The grading brief asked for no
    differing pixel where P3 allowed the changes S1-S3 and Q1-Q4 require.
  - G5: the four declarations brighten a field's border on focus to its hover colour: a field state, not a ring. The
    grading brief counted a focus border as a ring; P4 asked only to list them, and the round's list left them out
    (F265).
  - G8: all 56 differences are ring changes. P2: the record arrival, Reports' range and export dialogs opened
    directly, and the sort list chosen without a pointer or a key. P4: the forced-colour specimen rings (20). And the
    selected heat cell's mark after a mouse click, which `9619f3ce`'s `!important` pointer rule hid and HEAD restores
    to `23314b3a`'s appearance (reproduced on all three). The heat tooltip's other differences are at most 17 units
    and look the same. The grading brief's list named only P1, P2 and the review fix.
  - G9: the caret. Playwright's caret hiding does not hold in forced colours (F264, reproduced on a bare page).
  - G11: the round edited `motion.js` after its last measurement (F265); this grade's G2, G3, G6 and G7 measured the
    delivered code and pass.
- **Brief rows** 5/8 in full (P1, P2, L2, L3, L4); P3 and P4 hold in substance but their reports were under-measured;
  L1 failed on the tool (F264). **Held-out** (`D:/fitway-grader/owner-r04/shared-lows-heldout.md`): SL12, SL13 (the
  coordinator, at phone size), SL15, SL16 and SL17 pass; SL14 was not run. Overclaims 2 (P3 and P4 reported as
  measured in full). Grading-brief causes 5 (G1, G2, G4, G5, G8).
- **Disposition:** `owner-followup-r04-build` fast-forwarded to `538b280a` (2026-10-17). The selected heat cell's mark
  after a mouse click looks like the keyboard ring; it predates the rounds and stays, for the user's next look at
  Reports.

## agent-tooling-r01: the ratchet, ratchet-fix and the review fixer: `../../agent-tooling/briefs/codex-ratchet.md` and `codex-ratchet-fix.md`, results `7c28d15a`, `3f80f091` and `b3946bc3` on `tooling-ratchet` (from `fcc8365b`), DeepSeek V4.1 Flash, level `max`

- **The rounds.** The ratchet (run `codex-round-c8aa5fb0-...`, ten automatic resumes under F263, start load 91,701)
  reported H1-H6 PASS and L2 FAIL locally (P3 of `compare-parallel.test.mjs` twice; CI passed on its rerun). Its Sol
  diff review (`D:/fitway-temp/code-review/ratchet-1/`) gave nine blocking findings, all sent to ratchet-fix (run
  `codex-round-3911ed9e-...`, start load 167,160; its first report refused by the claim check because its ladder ran
  before its commit, the second accepted). ratchet-fix's Sol diff review (`code-review/ratchet-fix-1/`) gave three
  blocking findings (an extension parameter every caller filled alike; `script` 98 and `lintSources` 87 lines against
  K6's 80), applied by `owner-direction-fixer` with frozen edits in `b3946bc3` (diff checked by the coordinator; its
  local ladder passed, `804.60s`, no mutation).
- **The grade** (`../../agent-tooling/briefs/codex-ratchet-grade.md`, G1-G14 over H1-H6, K1-K6, the review edits and
  the held-out rows HR1-HR12 from `D:/fitway-grader/agent-tooling/ratchet-heldout.md`; both brief reviews, ten readings
  closed and one in part), GPT-6.1 Sol `xhigh`, run `codex-round-f73f808c-...` (one usage limit, resumed on the next
  account): 7 PASS, 7 FAIL, L1 PASS. The coordinator's reading:
  - **Real defects (four):** G1, a deleted or edited working baseline lets `code-health:baseline` write a rise (H1
    names the committed baseline); G2, a third copy of a block a file already counts as duplicated leaves its count
    unchanged (the count is per group, not per copy); G4, the gardener's report and the ratchet count a file's lines one
    apart (the report's Git reader trims the final newline; 17 giant files differ by one; the duplication differences
    come from the two scopes, by design); G7, the concept's one shared ring in `style.css` (`outline` with
    `outline-offset`) counts as three declarations, so the eclipse folder fails at `9619f3ce`, `4cc2db93` and
    `51d5a783`, and `f87906ea`'s ten copies are reported twice each (reproduced by the coordinator:
    `D:/fitway-temp/tooling-ratchet-grade/coordinator/g7-9619.log`). ratchet-fix's report had claimed H6 (F267).
  - **The grading brief's wording (three):** G10 counted test suites' `describe` callbacks as touched functions (every
    production function is at most 80 lines; F269); G12 found mechanical expected-value changes (the fast-step lists
    gaining the step, fixture file counts gaining `style.css`) and two test files the ratchet's Scope did not list but
    its step required; G14 asked for a successful ladder in the ratchet's run, which reported its local ladder as
    failing and left L2 to CI.
- **Brief rows** 7/14 as graded (3 brief-caused); **held-out** HR 10/12 (HR7 and HR8 fail with G7 and G4).
  Overclaims: 1 (F267). The grade's clone needed `core.longpaths` (F268).
- **Disposition:** not merged; ratchet-fix-2 takes the four defects.

## agent-tooling-r01: ratchet-fix-2: `../../agent-tooling/briefs/codex-ratchet-fix-2.md`, results `204ed1dc`, `42fd405a` and `4ed45355` on `tooling-ratchet` (from `b3946bc3`), DeepSeek V4.1 Flash, level `max`; review fix `6ca46c2e`

- **The round** (run `codex-round-546aa7a9-...`, two automatic resumes): N1-N4 reported PASS; three commits where the
  brief asked one (reported as failing its one-commit rule): the first put `scripts/check-concept-css.mjs` over the
  giant-file line, the second (`42fd405a`) deleted six explanatory comments to fit, the third regenerated the map; its
  ladder passed after the last (`789.82s`). Duplication's conversion, from `b3946bc3`'s own sources: 731 to 1136
  copies. Both brief reviews: eight readings closed, two left open (a baseline rise committed with its debt needs a
  parent CI does not check out, F270; box-shadow and border rings are this concept's designed states).
- **Diff review** (`D:/fitway-temp/code-review/ratchet-fix-2-1/`): three blocking findings (a second reading of the
  duplicate spans, the N1 cases' repeated setup, a fallback shape no caller needs), plus the coordinator's: the deleted
  comments. `owner-direction-fixer` applied all four with frozen edits in `6ca46c2e`: copies carry their span
  (`endLine`), the N1 cases share helpers, and the CSS parsing layer moved verbatim into a module of its own, the six
  comments restored (`check-concept-css.mjs` 795 to 630 lines; the coordinator checked the eight moved functions byte
  for byte). An exception now exempts a duplicate copy only from a line the copy spans. The fixer stopped once, rightly,
  on an expected value its edit changed; the coordinator allowed it (one place gaining `endLine`) but did not record it
  in the dispositions until the grade found it (P7).
- **The grade** (`../../agent-tooling/briefs/codex-ratchet-fix-2-grade.md`, P1-P8 over N1-N4, the review edits and
  HR13-HR18; both brief reviews, nine readings closed), GPT-6.1 Sol `xhigh`, run `codex-round-d3480bdf-...`: P3, P4, P8
  PASS; P1, P2, P5, P6, P7 FAIL; L1 PASS. The coordinator's reading:
  - **Real defects (three, small):** P1, a corrupt committed-baseline object reads as "no committed baseline", so the
    writer exits 0 and overwrites; P2, the survey's Git-reader edit grew the giant `survey.mjs` from 1232 to 1233 lines
    and the conversion absorbed it (reproduced by the coordinator with `wc -l` at both commits); P5, the new
    excepted-copy case throws a `TypeError` on the old code before its assertion.
  - **The coordinator's gaps (two):** P6 found the K1 longhand case's count fall from 2 to 1, which N4's one-ring rule
    causes, but the grading brief allowed only N2's and N3's changes; P7 found the fixer's one changed test file
    missing from the dispositions (allowed in a message, recorded late).
  - Everything else holds: every duplicate addition, including blank-line, indentation and trailing-whitespace copies,
    fails the check alone; the conversion holds no added debt apart from P2's line; line counts match `wc -l` and the
    gardener's report equals the ratchet on 102 files; the four concept commits behave as N4 requires.
- **Brief rows** 3/8 as graded (2 the coordinator's); **held-out** HR13-HR18 6/6, HR7 and HR8 now pass. Overclaims: 0
  (the report named its one-commit failure).
- **Disposition:** a second fixer applies P1, P2 and P5 with frozen edits; then the merge chain.

## agent-tooling-r01: the CLI contract and cli-contract-fix: `../../agent-tooling/briefs/codex-cli-contract.md` and `codex-cli-contract-fix.md`, results `cb1cfe65` and `dda8e020` on `tooling-cli-contract` (from `57dad1c0`), DeepSeek V4.1 Flash, level `max`; review builder `97f61712`

- **The contract** (run `codex-round-58a64b69-...`, start load 43,635; about two hours): a registry, `pnpm tools`, one
  `--help`/unknown-option/start-up failure form across 22 commands, and a generated contract test with three planted
  breaks. Its first report was refused because its ladder ran before its commit (as ratchet-fix's was); the second
  was accepted. Both brief reviews had closed eight readings (one by narrowing the goal to failures to start).
  Its Sol diff review (`D:/fitway-temp/code-review/cli-contract-1/`) gave seven blocking findings, the heaviest that
  the shared parser returned no values so every command kept its own; the coordinator added two: 26 blank lines
  deleted from five giant files to stay under the ratchet's line (F272), and a doubled `FAIL: ERROR:` prefix.
- **cli-contract-fix** (run `codex-round-e40f5755-...`, start load 43,101): one registry-driven resolver, 14 private
  parsers removed, the giant files below their base counts with room from removed parsers and two new modules. Its
  local ladder failed once on F261's K1 timeout; CI passed. Its diff review (`code-review/cli-contract-fix-1/`) gave
  four blocking findings, chiefly that its compatibility table was built from the registry, not from the old parsers;
  `owner-direction-builder` applied them in `97f61712`: 148 fixed rows checked through each command's own options
  step (the coordinator re-checked them against the `57dad1c0` parsers: 0 mismatches), which caught one regression of
  `dda8e020` (the survey's default temp root), restored there.
- **The grade** (`../../agent-tooling/briefs/codex-cli-contract-grade.md`, Q1-Q12 over C1-C5, E1-E5 and the held-out
  rows CC1-CC11 and CCF1-CCF6; both brief reviews, nine readings closed and one in part), GPT-6.1 Sol `xhigh`, run
  `codex-round-2751f7b6-...`: Q2, Q3, Q7, Q11, Q12 PASS; Q1, Q4, Q5, Q6, Q8, Q9, Q10 FAIL. The coordinator's reading:
  - **Real defects (six):** Q1, the classifier takes `build` and `check-types` as prefixes (`build:heldout` escapes);
    Q4, start-up failures about a value's meaning (`handoff:new`'s milestone and time, `verify:owner`'s relative
    paths, `verify:phase`'s unknown phase) keep their old forms; Q5, the contract test misses an unknown option after
    a positional and a private option loop; Q6, options `measure` and `doctor` read at `57dad1c0` (`--feature`,
    `--states`, `--languages`, `--quiet` and others) are now refused as unknown, and the forms refused on purpose are
    recorded nowhere (reproduced by the coordinator through the resolver); Q9, 17 of the launcher's 22 help lines of
    explanation were dropped rather than moved; Q10, two new cases throw before their assertions on the old code.
  - **The grading brief's wording (one):** Q8 counted a test-helper module's callers as not callers.
  - Holding: help is safe in 324 probes with no process or file touched; every unknown option is refused by name
    before work; one declaration per command; nothing weakened in the tests; the reports rest on what ran.
- **Brief rows** 6/12 as graded (1 the grading brief's); held-out rows inside them. Overclaims: the fix's report
  marked E1 PASS on a compatibility table the brief had asked to be written from the old parsers (found by the diff
  review, not the grade).
- **Disposition:** a second `owner-direction-builder` applies the six; then a short Sol re-grade of those rows, then
  the merge chain.
