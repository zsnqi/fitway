1. **X3**
   - **Literal reading:** The test may validate `config.json` and call `collectCodeHealth` with a derived list while the shipped weekly entry point still passes a hard-coded or alternate list.
   - **What goes wrong:** The weekly report can still count files that pages do not load, leaving X3’s intent and the goal unmet.
   - **Brief change:** Require the test to invoke the production weekly scan/report entry point and prove that restoring a hand list changes or fails its emitted result.

2. **X1**
   - **Literal reading:** “A numeric trend” can be any number, including a constant `0`, with no required relationship to the two totals.
   - **What goes wrong:** Reports cannot show whether boundary breaks rose or fell.
   - **Brief change:** Require `trend = current.total - previous.total`, with positive and negative cases tested.

3. **X1**
   - **Literal reading:** “The same list” may mean the same array order or object instance rather than the same normalized file set.
   - **What goes wrong:** Reordered or reloaded lists start new baselines, so week-to-week readings fail to compare.
   - **Brief change:** Define the scope key as the method plus sorted, normalized file paths and require a persisted two-process round trip.

4. **X2**
   - **Literal reading:** The implementation only needs to handle the three exact comment/string fixtures named by the outcome.
   - **What goes wrong:** Other valid multiline, escaped, or template-string forms can still make commented or quoted code appear loaded.
   - **Brief change:** Require lexical handling of all supported HTML, CSS, and JavaScript comment/string forms and tests for those variants.

5. **X1**
   - **Literal reading:** The pre-`040bc5c8` report only has to expose its old list; its stored total need not seed later trend calculation.
   - **What goes wrong:** The first post-change reading cannot be compared with the prior report, contrary to the stated intent.
   - **Brief change:** Require the existing report’s historical total to become `previous` whenever its canonical scope matches the new reading.