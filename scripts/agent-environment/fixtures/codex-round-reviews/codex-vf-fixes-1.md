Five readings, most damaging first.

1. **V7: Navigating features under touch and keyboard.**  
   **Literal reading:** A navigation can be awaited, then the feature captured; success is shown when the concept against itself gives `EQUAL` for the named items in all four combinations.  
   **What goes wrong:** `EQUAL` proves repeatability, not reachability. Both runs can deterministically land on the wrong page, lose state, or miss the feature after context re-creation, and the keyboard/touch user still cannot use it.  
   **Closing change:** Require a recipe copy with an expected post-navigation URL or DOM proof and require that positive result, not only self-comparison.

2. **L1: Today’s verdicts.**  
   **Literal reading:** Every item may change if it is attributed to V2, V4 or V7 and reported; no exact changed-item set is required.  
   **What goes wrong:** An implementer can broadly remove or alter unrelated items, report them as covered by the exception, and still claim the HEAD verdicts were preserved despite losing coverage.  
   **Closing change:** Enumerate the exact expected added, removed and changed item IDs and verdicts for V2, V4 and V7, and fail on any other difference.

3. **V1: A switch whose effect shows after an action.**  
   **Literal reading:** The CLI only has to support an optional post-action proof mode; existing recipes must remain unchanged, but no affected recipe is required to use the new mode.  
   **What goes wrong:** The `fail`, `hold`, `refuse`, `older`, `refresh` and `export` switches can remain measured with their old pre-action proofs, so the real gap survives while the new capability sits unused.  
   **Closing change:** Require a recipe-copy run that uses the post-action proof for each listed switch and proves the proof is evaluated after the relevant action.

4. **V6: Nothing left behind.**  
   **Literal reading:** Test files and compares create no folders under the captures root, while the one-time cleanup removes folders outside the three pairs.  
   **What goes wrong:** Files, locks, nested temporary data, or stale non-folder entries can remain, so the root is not limited to captures and live claims.  
   **Closing change:** Require an inventory showing that only capture artifacts and active-claim lease entries remain, with no leftover files, locks or stale directories.

5. **V5: `SKILL.md` held to the CLI.**  
   **Literal reading:** The test only fails when `SKILL.md` names an option, port, pair or artifact that the CLI lacks.  
   **What goes wrong:** The guide can omit supported behavior or artifacts entirely and still pass, leaving users without the intended description of what compare and drive do.  
   **Closing change:** Require a bidirectional manifest test: every supported option, port, pair and artifact must be documented, and every documented one must exist and be accepted.