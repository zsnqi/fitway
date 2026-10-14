1. **P3, P4 — Cache inputs can omit a visible dependency.**

   **Literal reading:** Treat P3’s parenthetical list as exhaustive. An input outside those bytes and settings can change while the cache key stays unchanged; P4’s invalidation fixture changes a covered byte.

   **Delivered failure:** A stale baseline frame is reused after a change that should affect the comparison.

   **Change:** “Baseline inputs include every render-affecting dependency; reuse is forbidden unless all such dependencies are verified unchanged.”

2. **P2, L1 — Parallel verdict equivalence covers only specified configurations.**

   **Literal reading:** Preserve every configuration with one worker under L1, and preserve P2’s named four-worker cases. Other accepted worker counts or timeline configurations can give different verdicts.

   **Delivered failure:** An unlisted parallel run reports `DIFFERENT` or `NOT-HELD` where its single-worker equivalent reports `EQUAL`.

   **Change:** “Every supported configuration, allowed pair and accepted worker count must preserve the corresponding single-worker items, order, verdicts and failures, subject only to the bounded F126 exception.”

3. **P1 — Commands can start together while their captures run sequentially.**

   **Literal reading:** Reserve separate pairs but globally serialize capture work between compares. Both commands started together finish with their standalone verdicts; workers within each command still capture concurrently.

   **Delivered failure:** Rounds queue for measurement instead of measuring side by side.

   **Change:** “Two and three compares on distinct pairs must perform browser captures simultaneously, demonstrated by overlapping individual capture intervals.”

4. **P2 — Reporting wall times does not require a speed improvement.**

   **Literal reading:** Four workers capture concurrently and preserve results, but coordination overhead or another serial stage makes the full check equally slow or slower. Reporting those times satisfies the outcome.

   **Delivered failure:** A round’s full check never takes the promised fraction of today’s time.

   **Change:** “For both full comparisons, four-worker wall time must be at most half the original HEAD’s single-worker wall time under matched conditions.”

5. **P2 — The F126 exemption need not resolve after the rerun.**

   **Literal reading:** A documented F126 item differs between one and four workers, is rerun once, and still differs. The exception requires the rerun and report, without specifying an acceptance condition.

   **Delivered failure:** Parallel execution can make the known instability persistent while P2 is reported as satisfied.

   **Change:** “A F126 mismatch that persists after the required rerun, or any additional instability attributable to parallel execution, makes P2 FAIL.”