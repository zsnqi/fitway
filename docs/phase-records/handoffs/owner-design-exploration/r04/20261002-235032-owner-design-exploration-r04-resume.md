<!-- handoff-format: resume-point-v1 -->
# owner-design-exploration-r04: resume point

- **As of:** codex/owner-redesign-r04 at `50de634` plus the commit that adds this file; `owner-followup-r04-build` at `15c0103`; `owner-r04-nav` at `0c51f7c`; 2026-10-02 23:50 +03:00
- **Previous resume point:** `docs/phase-records/handoffs/owner-design-exploration/r04/20261002-213000-owner-design-exploration-r04-resume.md` (history; open it only where a pointer below names a section)
- **Standing decisions:** `docs/phase-records/handoffs/owner-design-exploration/r04/DECISIONS.md`, `D:/Projects/fitway-worktrees/agent-environment-r01/docs/agent-context/WORKING_AGREEMENTS.md` (until the environment branch merges)

## State

- **README split** (`32958e1` on `owner-followup-r04-build`, Codex nav-1): Eclipse's `README.md` is now the
  contract (821 lines) and HISTORY.md holds the round logs (1,329 lines); no line lost; pages render
  byte-identical. Graded 5 of 7; the repair items are in codex-rounds.md (this folder).
- **K-02, Reports' states** (`58d838b` on `owner-followup-r04-build`, a fresh designer): three options. Open
  reports.html?option=a|b|c&state=loading|closed|delayed|unavailable|pending|error; no `option` is the live
  page, unchanged. The designer added `pending` (the sensor link offline since 9:10 PM on 22 Sep, so that evening
  has not arrived). States are numbered the same in every option: 01 live, 02 loading, 03 closed, 04 delayed,
  05 offline, 06 pending, 07 error.
  - A carries Daily's rules over; B keeps history first; C is quiet (no placeholders, one page-level error).
  - The coordinator saw in the sheets: B keeps the pattern card lit under non-live statuses, which reads against
    DECISIONS.md item 8 (the user decides); in pending, A and C count the partial day (9,602 entries), B holds it
    out (9,223); C's loading shows blank slots; new wording to check: «بانتظار القراءات منذ 9:10 م» and C's error
    sentence. All three close K-38 at 320 (title moves 0.00 px), AR and EN.
- **Navigation aids** on `owner-r04-nav` (pushed, branched from `51c8ece`): `D:/Projects/fitway-worktrees/owner-r04-nav/design-research/owner-composition-exploration-r04/directions/eclipse/INDEX.md` with
  `D:/Projects/fitway-worktrees/owner-r04-nav/design-research/owner-composition-exploration-r04/directions/eclipse/tools/build-index.mjs` (`25795c9`, 806 entries, `--check`; graded 7 of 7) and the verifier probe kit
  `D:/Projects/fitway-worktrees/owner-r04-nav/design-research/owner-composition-exploration-r04/directions/eclipse/tools/probes/` (`0c51f7c`; graded 6 of 7: `overflowProbe` misses a word running past its own box).

## Running now

Nothing. The independent verifier of the K-02 options was stopped part-way and saved its state in
`D:/fitway-temp/owner-r04-k02-verify/PARTIAL.md` (resume commands included):
- V1 PASS: the live page without `option` is byte-identical to `51c8ece` (22 renders). V2 PASS: 132 frames, no
  sideways scroll, no console error. V3 PASS: K-38 closed at 320 in every option, state and language. V7 PASS.
- V4: A and C light nothing in a non-live state; B keeps the pattern card lit under closed, delayed, unavailable and
  pending (reports.js line 1542 at `58d838b`), against DECISIONS.md item 8. The user rules on B.
- V5 FAIL so far (file:// only): on arrival at 1440 and 768 the header's status control widens (102.5 to 211.6 px AR)
  when the badge replaces «جارٍ التحميل…», and in A and B the peak card's time line moves (20.17 px at 1440 EN).
  Not yet run: timed arrivals over HTTP under no-store and with no cache header, and arrival after a retry.
- V6 not run beyond a first read: the new strings look consistent with decisions 11-12.

## Next steps

1. **K-02 decision:** finish V5 and V6 with a fresh `owner-direction-verifier-high` from that PARTIAL.md, inspect the key frames (the verifier's sheets in `D:/fitway-temp/owner-r04-k02-verify/sheets/`), then show the user the numbered sheets
   (`D:/fitway-temp/owner-r04-k02/out/sheets/NN-<state>-<ar|en>.png`, per-option frames in `out/frames/<a|b|c>/`,
   320 checks in out/k38/) and ask for one pick, the B lighting question and the two new strings together. A
   builder then builds the pick and removes the other options.
2. **Navigation repair** (Codex, after the K-02 build so only one writer touches the folder): the README contract's
   round labels and run IDs in rule titles, the intro's total length as one sentence, blank lines inside lists
   (README 64, 356), DESIGN-SPEC PAT-1's pointer; the probe kit's general `overflowProbe`, a repository-relative run
   line, and a hint on a port in use. Then merge `owner-r04-nav` into `owner-followup-r04-build` and regenerate
   INDEX.md (`--check` must pass).
3. **Deferred defects D3-D8** (Codex, frozen targets), as listed in the previous resume point's step 3.
4. **The step-4 reviewer**, then the user; the reviewer also looks at Daily at 390 under the "compressed, not
   designed" lens, and any Daily change is the user's call.

## Waiting on the user

Nothing yet; step 1 will ask for the K-02 pick.

## Known risks

- Briefs use the templates in `D:/Projects/fitway-worktrees/agent-environment-r01/docs/agent-context/briefs/` (on `agent-environment-r01` until it merges); check them
  with `node D:/Projects/fitway-worktrees/agent-environment-r01/scripts/agent-environment/check-brief.mjs <brief>`.
  It currently fails on branches without ENVIRONMENT.md (an open repair).
- A brief names each authority document by absolute path when its branch lacks it (DECISIONS.md lives only on this
  branch).
- NEXT-DIRECTION-BRIEF.md still says "plain hyphen" for Arabic ranges; DECISIONS.md item 12 overrides it.
- Ports: 3174 is the user's preview; 3176-3177 were the K-02 agents', 3178-3179 the probe kit's default and spare.
- Real-device touch, Firefox and Safari first paint, and screen-reader output were never checked.
- Claude Design suspicions left open: four per-file font families in its tokens.css; its DayTable copies D4; its
  README says 36 px rows where the component has 48 px.

## Pointers

- Build worktree: `D:/Projects/fitway-worktrees/owner-followup-r04-s04`, branch `owner-followup-r04-build`, expected HEAD `15c0103`.
- Navigation worktree: `D:/Projects/fitway-worktrees/owner-r04-nav`, branch `owner-r04-nav`, expected HEAD `0c51f7c`.
- Eclipse source: `D:/Projects/fitway-worktrees/owner-followup-r04-s04/design-research/owner-composition-exploration-r04/directions/eclipse/`.
- Codex evaluations: `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`; held-out checks in `D:/fitway-grader/owner-r04/`.
