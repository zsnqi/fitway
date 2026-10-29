**G9. Report against commands, and the inventory**
- **Literal reading:** The reported list only has to have the same number of `changesState` features per page as the recipes; G9 never requires the reported feature identities or each feature's applicable before rules to match.
- **What goes wrong:** The report can contain the right counts but wrong feature IDs or omit every required before-rule inventory entry. The build branch then lacks the exact inventory the source brief needs for later `ends` declarations, so the coordinator cannot make the intended row-by-row migration.
- **One-line change:** Require an exact, per-page `feature id -> canonical shows/when` inventory diffed against the concept recipes, not just count equality.

**G2. Feature ends lifts one rule**
- **Literal reading:** The only required successful `ends` plant is on Access's `language` feature. G4 requires only a refusal for differing items, so an implementation may special-case that feature or page while rejecting or ignoring `ends` everywhere else.
- **What goes wrong:** Access `language` passes every happy-path check, but the general capability stated in the goal, "a feature can declare `ends`," remains absent for other features; later declarations cannot proceed one feature at a time.
- **One-line change:** Require a successful `ends` plant on a second feature on a different page, with a different applicable-rule shape, and verify that item's `afterFrameProof`.

**G3. A surviving rule is checked**
- **Literal reading:** G2 checks that every surviving rule appears in `afterFrameProof`, but G3 plants and executes only one surviving rule. The list can therefore be metadata while only the planted rule is actually re-proved.
- **What goes wrong:** Other applicable rules can remain unproved after the action even though the summary claims they survived. A page state can break while the grader still reports the central preservation intent as satisfied.
- **One-line change:** Plant at least two surviving rules with distinct `when` values or sources and require each to fail independently, or require executed pre/post proof evidence for every `afterFrameProof` entry.

**G6. Nothing else moved**
- **Literal reading:** The passing self-compare sample is only Daily, ar, wide. G1 similarly exercises only Access `language`, ar, wide, so all other pages, features, states, languages, sizes, and inputs are outside the comparison.
- **What goes wrong:** The implementation can regress every unselected row while both "unchanged" checks pass, directly defeating the goal that the coordinator learns whether the delivered commit holds row by row.
- **One-line change:** Require an all-recipe-item or at least all-page self-compare across the required language, size, and input matrix.

**G7. The repair proven**
- **Literal reading:** A new test only has to "fail on `5b81b3b7`'s production code." It need not fail on its own assertion or because of the defect; the source brief's L0 prohibition on load, import, and setup failures is not repeated.
- **What goes wrong:** A test can fail at base because it imports a new symbol or because fixture setup differs, then pass at HEAD without ever exercising the repaired behavior. G7 would certify a regression proof that proves nothing about S1-S2.
- **One-line change:** Require each failure to occur at the case's behavioral assertion and explicitly reject load, import, collection, and setup failures.