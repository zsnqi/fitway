# Why Codex rounds failed: brief or code

agent-environment-r02, acceptance criterion 1. Compiled 2026-10-03 by a read-only Sonnet researcher from the two
round logs and checked against them by the coordinator. AE = `docs/phase-records/handoffs/agent-environment/codex-rounds.md`,
OW = `docs/phase-records/handoffs/owner-design-exploration/r04/codex-rounds.md`. Held-out checks were not read.

## Failed rows per round

| Round | Brief | Code | Unclear | Rows (cause as the log records it) |
| --- | --- | --- | --- | --- |
| AE 1 | 1 | 0 | 0 | held-out: `handoff:new` outside the repo root; the brief never said where it may start (AE:11-14) |
| AE 2 | 1 | 0 | 0 | R5, O7: a full-suite run that needs a clean tree (AE:22-27) |
| AE 3 | 3 | 0 | 1 | Q2, Q5: baseline not checked, B7 (AE:34-37); Q4: a Node pin that does not exist (AE:37-38); L5 unclear, timing tests (AE:40-41) |
| AE 4 | 2 | 0 | 2 | B5: round 3's Biome error again (AE:46-47); M7: "path" undefined (AE:49-53); B6, M9 unclear (AE:47-50) |
| AE 5 | 1 | 0 | 0 | S6: the brief defined a path as any backticked token with `/` (AE:61-66) |
| AE 6 | 2 | 0 | 0 | H7: B7, no outcome kept live resume points passing (AE:76-81); H4: header names checked as paths, as asked (AE:77-78) |
| AE 7 | 0 | 0 | 0 | none (AE:90-93) |
| AE 8, 8b | 1 | 0 | 1 | S1: an ambiguous rule, Codex right to stop (AE:97-103); J6 partial by design |
| OW nav-1 | 2 | 0 | 0 | K6: no length set; K2: N2 allowed a double copy (OW:11-14) |
| OW nav-2 | 1 | 0 | 0 | I3: Biome on files its config excludes, B7 (OW:22-23) |
| OW nav-3 | 1 | 0 | 0 | Q4: asked to merge the probe sources, not to fix them (OW:31-35; the coordinator's reading) |
| OW nav-4 | 0 | 0 | 0 | T1 partial, outside the brief (OW:40-44) |
| OW nav-5 | 1 | 0 | 0 | H6: "no rule's meaning changes" with no limit on words outside titles (OW:52-55) |
| OW D3-D8 run 4 | 2 | 1 | 0 | K3: "mirrored" with no anchor named (OW:68-71); K4: 286 px required in 238 px, and a quote the page no longer shows, B2 and B7 (OW:72-75); K5: a hand-built copy of a shared cell, code (OW:76-78) |
| **Total** | **18** | **1** | **4** | |

## Recurring brief causes

1. **A required outcome whose baseline was not checked** (B2, B7): AE 3 Q2, Q4, Q5; AE 4 B5; AE 6 H7; OW nav-2 I3; OW D3-D8 run 4 K4 (a quote the page no longer shows). The
   Codex template already carries the rule (`docs/agent-context/briefs/codex.md:49-53`).
2. **A rule without its boundary cases** (terms undefined, edge inputs unlisted): the path rule in AE 4 M7, AE 5 S6
   and AE 6 H7 and H4; the name rule in AE 8 S1; "meaning" in OW nav-5 H6. No template line covers it.
3. **A limit or keep-working requirement left unstated** (start location, length, duplication, live artifacts still
   passing): AE 1, OW nav-1 K6 and K2, OW nav-3 Q4, AE 6 H7. Covered only in part (`docs/agent-context/briefs/codex.md:48`).
4. **The brief's own commit on the named HEAD** stopped the first launch of AE 8, AE 8b and OW nav-5. Fixed by the
   launch note in `docs/agent-context/WORKING_AGREEMENTS.md` ("Delegation"); not a row failure.
5. **A visual outcome with no anchor, or one the space rules out**: OW D3-D8 run 4 K3 ("where the Arabic table puts
   it, mirrored" named no edge, and the mirror landed on the defect itself) and K4 (a row that needs 286 px required
   in 238 px). No template line covers it.

Causes 2, 3 and 5 are the candidates for new template lines, each to be tested in an evaluation round before it is
adopted.

## Candidate lines (coordinator drafts, 2026-10-03; C2 tested and not adopted, see codex-rounds.md "Evaluation C2")

For the coordinator checklist of `docs/agent-context/briefs/codex.md`, since these causes lie in how the coordinator
writes the brief:

- **C2.** Every term a rule depends on (a path, a name, a "meaning") is defined by what it includes and what it
  excludes, with at least one real example of each drawn from the files the round will meet. (cause 2)
- **C3.** Every limit the result must keep is an outcome of its own: where the tool may run from, length or size caps,
  no text kept twice, and every live artifact the change can reach still passing. (cause 3)
- **C4.** Every alignment outcome names its anchor: the element, the edge and the language it is measured from.
  (cause 5)
- **C5.** Before an outcome that places or fits content is required, the space it needs is measured on the baseline
  at every width the outcome covers; an outcome that cannot fit is a question for the user, not a requirement.
  (cause 5)

Test: the coordinator knows each failure, so it cannot write the test brief itself. A fresh writer that has not seen
the round logs or the held-out rows rewrites a past round's brief from the template twice, with the line and without
it; Codex runs each brief on that round's baseline commit in its own worktree; both runs are graded on the round's
held-out rows. C2 is tested on AE round 5 (S6 failed on the path rule); C3 on OW nav-1 (K6 and K2 failed on unstated
limits). Adopt a line only if the arm with it clears the targeted rows, the arm without it does not, and the arm with
it adds no new failure.
