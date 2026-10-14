1. **P2 — measurements are not tied to the delivered tree**
   - **Literal reading:** “Each measured as it states” imposes no timing or commit identity.
   - **What goes wrong:** The implementer measures a passing transient tree, then changes or resets it before committing. The final work can fail every check.
   - **Close it:** Require every F1–F4 check, rerun, L1, and L2 measurement to run after the sole final commit from a clean checkout of that exact commit, with its hash recorded.

2. **P1 — applying the saved patch can be ceremonial**
   - **Literal reading:** The patch must be applied and read before edits, but the final tree need not retain it or derive from it.
   - **What goes wrong:** The implementer applies the patch, then resets or replaces it and submits a separate implementation, defeating the “continued from saved work” intent.
   - **Close it:** Require the final commit to derive from the exact applied patch and retain its changes except for explicitly documented outcome-required replacements.

3. **P3 — a clean status does not prove a delivered implementation**
   - **Literal reading:** The only stated check is that `git status --short` is empty after a commit.
   - **What goes wrong:** The implementer can stash, reset, hide changes with index flags, or make an empty/unrelated commit, leaving a clean status while the measured implementation is absent.
   - **Close it:** Require a nonempty, Scope-only diff from the named base at final `HEAD`, and verify that fresh checkout with the required measurements.

4. **P2 — the measurement oracle may be changed**
   - **Literal reading:** P2 does not make tests, fixtures, baselines, thresholds, or measurement scripts immutable.
   - **What goes wrong:** If those files are in Scope, the implementer can alter them so F1–F4 and L1–L2 report success while the delivered behavior misses the goal.
   - **Close it:** Require the supplied measurement tools, inputs, baselines, and thresholds to remain unchanged and run them from a clean checkout.

5. **P2 — the “one shared frame script” intent is not independently enforced**
   - **Literal reading:** The enumerated acceptance items are F1–F4, their reruns, L1, and L2; the title’s architectural intent has no explicit structural check here.
   - **What goes wrong:** The implementer can duplicate the frame logic across page scripts or leave `shared-frame.js` unused while satisfying surface measurements.
   - **Close it:** Add an acceptance ID requiring every page script to use exactly one shared frame module, verified structurally in the final tree.