1. **L1 — legacy verdicts are protected only for the specified matrix.**

   **Literal reading:** Preserve the listed Reports and Access results while weakening difference detection for Daily, Activity or components. Keep every recipe and measurement item intact.

   **What goes wrong:** Existing comparisons can start reporting `EQUAL` for real regressions. S3’s self-comparisons still pass, and S2’s cached verdicts can still equal the new implementation’s fresh verdicts.

   **One-line change:** “Without the new option and with an empty cache, preserve HEAD’s item enumeration, verdicts and failure behavior for every supported compare configuration.”

2. **S2 — reusing captures need not eliminate baseline execution.**

   **Literal reading:** Run baseline browser startup, navigation, interactions and timing waits on every rerun, then substitute kept images at the screenshot step. Report zero new baseline captures and reuse stored stability evidence.

   **What goes wrong:** The rerun still pays for both sides’ browser work, defeating the stated intent that its cost is the result side. Reporting wall times imposes no requirement to remove that work.

   **One-line change:** “On a baseline cache hit, reuse its captures and associated metadata without executing baseline-side browser startup, navigation, interactions, waits, stability repeats or confirmation rounds.”

3. **S4 — fixture coverage need not protect production integration.**

   **Literal reading:** Test selection and cache helpers directly; each test fails on HEAD because the new helper is unavailable. The delivered CLI uses those helpers correctly, so the required measurements also pass.

   **What goes wrong:** A later change can bypass the helpers in `compare` while every fixture test remains green. The suite does not establish the stated intent that each defect’s return causes a failure.

   **One-line change:** “Exercise the production compare path in the fixture tests and demonstrate that each test fails when its targeted defect is separately reintroduced, including bypassing the helper in production.”