1. **K1 / K3: fixture-specific parsing**
   - **Outcome or limit:** K1, with K3's fixture regression check.
   - **Literal reading:** Add the 16 current answers as fixtures and make the parser handle only their exact heading forms and label wording; K3 passes by checking only that fixed fixture set.
   - **What goes wrong:** A future sound DeepSeek answer with another heading level, title, or equivalent field wording still stops the launch, so F157 returns in a different form.
   - **Closing change:** Require at least one synthetic valid answer absent from every fixture, using unseen heading and field-label wording, to parse as its exact readings.

2. **K2 / K3: an unfinished message can qualify as a report**
   - **Outcome or limit:** K2's report definition, with K3's resume-after-report test.
   - **Literal reading:** Treat any last message containing one line that has an outcome or limit ID and `PASS` or `FAIL` as a finished report, even if the message says work is still pending.
   - **What goes wrong:** A message such as "K1 PASS so far; K2 still pending" stops automatic resumption, leaving the coordinator to resume the run manually.
   - **Closing change:** Define a report as containing one terminal `PASS` or `FAIL` for every outcome and limit ID with no continuation language, and test that a partial status resumes.

3. **K1 / K3: no-readings answers remain phrase-locked**
   - **Outcome or limit:** K1, with K3's requirement that the launcher read review answers correctly.
   - **Literal reading:** Preserve the existing small set of accepted no-readings sentences because those are the only answers existing tests require the launcher to accept.
   - **What goes wrong:** A sound answer such as "None found." or "No literal readings apply." is refused, so the goal that a sound review answer never stops a launch is unmet.
   - **Closing change:** Define one canonical no-readings sentence in the review prompt or require every explicit unnumbered no-readings statement to parse as zero readings.

4. **K1: the new fixture hashes have no trusted expected values**
   - **Outcome or limit:** K1's requirement that all 16 real answers be frozen as fixtures by hash.
   - **Literal reading:** Freeze each new fixture by hashing the copied file, because only the original eight hashes are already fixed elsewhere.
   - **What goes wrong:** An altered, truncated, or incorrectly named copy can become the fixture and still pass, so the delivered work does not actually read every existing DeepSeek answer.
   - **Closing change:** Record the SHA-256 of all 16 source `last.md` files, or a coordinator-generated manifest, in the brief and require the fixture hashes to equal them.

5. **K3: the read-before-place regression test can cover only one source path**
   - **Outcome or limit:** K3's F156 check that a review source is not read before its place check.
   - **Literal reading:** Add one test showing that one absolute source is read only after the placement decision.
   - **What goes wrong:** The read can be moved ahead of the decision only for the temp-root or checkout branches while the suite stays green, allowing bytes to be read before the allowlist decision.
   - **Closing change:** Require a table test covering temp-root, checkout, and outside-absolute sources and assert that no file or Git-object read occurs before the placement decision.