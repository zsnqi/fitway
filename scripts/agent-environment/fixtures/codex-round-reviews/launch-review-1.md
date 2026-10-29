1. **R1 — an answered review can cover outdated contents.**

   **Literal reading:** “Newest review” means the newest review of that brief file; nothing requires its reviewed bytes to match the bytes being launched. Reuse it after editing the brief.
   
   **What goes wrong:** A round starts from new requirements or loopholes that nobody reviewed.
   
   **One-line change:** “A review permits launch only if its recorded content hash matches the current brief; otherwise follow the no-review case.”

2. **R1 — the launcher can supply the dispositions.**

   **Literal reading:** The outcomes require recorded dispositions but do not require coordinator authorship. After reviewing, generate “left open” entries with reasons, exit non-zero as required, and allow the next invocation.
   
   **What goes wrong:** Every reading has an answer, but the coordinator has read and answered nothing; the launcher has made the decisions itself.
   
   **One-line change:** “The launcher must never create, modify, or infer dispositions; only dispositions supplied by the coordinator after that review count as answers.”

3. **R1, L2 — the prescribed review procedure is editable.**

   **Literal reading:** Change the permitted `REVIEW.md` prompt to a trivial, narrow review that predictably finds none, then faithfully execute that revised procedure.
   
   **What goes wrong:** Launches satisfy the documented gate while bypassing the substantive review the brief intended to automate.
   
   **One-line change:** “Preserve the HEAD version’s review prompt, model, level, and command semantics; change only the specified sentence describing automatic launch review.”

4. **R2 — increasing the timeout satisfies the measurement.**

   **Literal reading:** Preserve all byte assertions and increase the time bound until the slowest of five local runs falls below one quarter of it.
   
   **What goes wrong:** Runner-dependent work remains; sufficiently busy CI can still fail an unrelated commit, and genuine hangs take longer to detect.
   
   **One-line change:** “Keep the existing 20-second bound and achieve the required margin by reducing runner-dependent work in the timed test.”

5. **R3 — failure on HEAD need not demonstrate a functioning gate.**

   **Literal reading:** Cover the cases through a new review helper; every test fails on HEAD because that helper is absent, while none verifies that the production launcher actually honors its refusal.
   
   **What goes wrong:** Removing the production launch guard can leave the tests passing, so the stated gate-removal proof is absent.
   
   **One-line change:** “For each refusal, demonstrate that disabling only its production launch gate makes the corresponding test fail because a round starts; setup or missing-API failures do not count.”