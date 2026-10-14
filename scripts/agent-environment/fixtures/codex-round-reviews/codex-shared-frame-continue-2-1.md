1. **R1 — recorded-result provenance.**
   - **Literal reading:** A result counts if `measurement.json` names the delivered SHA and a CLI at least `f2c89624`, and `comparison.json` was read. The brief does not require those files to come from the same complete run or contain every sample.
   - **Failure:** A stale, partial, or mismatched comparison can be presented as current, leaving required behavior unmeasured.
   - **Close:** “Count a result only when a complete end-to-end run against the delivered SHA produced the comparison and enumerated every required configuration and sample, with immutable artifact provenance.”

2. **R3 — any matching record suppresses measurement.**
   - **Literal reading:** “Measure each that no record shows on commit” makes any record with that SHA sufficient, regardless of age, CLI, completeness, or verdict validity.
   - **Failure:** A stale PASS record can hide a regression in F1, F4, L1, L2, or P3.
   - **Close:** “An R3 record counts only when it is a complete verified PASS produced on the delivered SHA by the approved CLI in this run; otherwise remeasure.”

3. **R1 — the unbounded “or later” CLI.**
   - **Literal reading:** Any later CLI revision satisfies the version requirement, even if it changes sampling, comparison semantics, or skipped cases.
   - **Failure:** A semantically incompatible tool can manufacture apparent passes while still meeting the stated version floor.
   - **Close:** “Use exactly `f2c89624`, or a named later revision proven equivalent for configuration coverage, sampling, and verdict semantics.”

4. **R2 — the word “only” hides mixed failures.**
   - **Literal reading:** Rerun and report only an item whose differences are exclusively inside F126’s chip or F148’s edge pixels; an item that also differs elsewhere is outside this requirement.
   - **Failure:** An implementer can leave a known instability unreported by pairing it with any outside difference.
   - **Close:** “Any item containing a difference in either named region must be rerun and reported, even when other differences coexist, and cannot be counted as passing.”

5. **R1 — the “fresh session” intent is unenforced.**
   - **Literal reading:** Kept baseline captures and prior recorded results may be reused, but no outcome requires all measurements to originate in a newly started session with cleared state.
   - **Failure:** The delivered evidence can depend on hidden state or cached results from the abandoned session while still satisfying the checklist.
   - **Close:** “Every required measurement and rerun must be produced in one newly started session with cleared per-run state; prior-session artifacts may serve only as baselines.”