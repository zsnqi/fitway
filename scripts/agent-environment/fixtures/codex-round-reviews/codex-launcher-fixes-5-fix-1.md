1. **T4/L0**
**Literal reading:** A new case only has to assert the file before reading it, so `expect(existsSync(file)).toBe(true)` makes the base fail at an assertion rather than with `ENOENT`.

**What would go wrong:** The recorded base failure is still caused solely by a missing file, not by the defect the case claims to expose. L0 can therefore certify a test that proves nothing about the production behavior.

**One-line change:** Require the first failing assertion on `5b81b3b7` to inspect a produced semantic result, and explicitly prohibit existence or no-throw guards from being the reported first failure.

2. **T3**
**Literal reading:** The 75 replayed review files need only retain the same counts and IDs, not the same parsed reading text or boundaries.

**What would go wrong:** The parser can assign the same readings and IDs while slicing, merging, or omitting their text incorrectly. Reviewer dispositions would then be written against different findings from those a `5b81b3b7` reader saw.

**One-line change:** Require exact normalized reading-block equality for all 75 files, rather than count and ID equality alone.

3. **T5**
**Literal reading:** The test may target only the copied fixture whose bold headings are exactly G9, G2, G3, G6, and G7.

**What would go wrong:** A parser can recognize that specific ID list or fixture content and pass, while still refusing other complete answers with arbitrary bold outcome IDs, leaving the intent unmet.

**One-line change:** Add generated positive cases with other ID prefixes, orders, titles, and spacing, requiring one generic bold-ID grammar rather than fixed fixture IDs.

4. **T1**
**Literal reading:** Each reading need only be accepted when wrapped at one label, as in the supplied fixture.

**What would go wrong:** A wrap after ordinary text, within a label, or at a second position can still decide whether the answer is refused. The implementation passes the single wrap-location family while violating the intent that line wrapping never decides readability.

**One-line change:** Require a wrap inserted at every character boundary in each column-0 reading to produce the same accepted readings, while retaining the incomplete-continuation negative case.

5. **T2**
**Literal reading:** A labelled part counts when its text contains any letter or digit, including a lone digit or numbering marker.

**What would go wrong:** Parts such as `Literal reading: 1`, `What goes wrong: 2`, and `Change: 3` pass even though none says anything, defeating the intent that every part has substantive content.

**One-line change:** Require at least one letter outside any outcome ID or list marker in each labelled part's suffix, not merely an alphanumeric character.