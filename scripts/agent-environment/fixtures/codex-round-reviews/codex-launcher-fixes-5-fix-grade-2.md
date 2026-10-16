1. **G3. Nothing lost.**  
**Literal reading:** It preserves only the two named inline texts and the finite set of base fixtures and current `last.md` files that the base parser reads; the supplied probe compares counts and IDs for that snapshot.  
**What goes wrong:** The result parser can still refuse or change another previously valid form absent from that corpus, while G3 reports PASS, so the stated intent that no answer which read before is refused or changed remains unmet.  
**One-line change:** Require a frozen, generated positive corpus covering every base-parser form and compare normalized per-reading IDs and text, rather than a finite snapshot summary.

2. **G1. Wrapped readings.**  
**Literal reading:** Only the named single-wrap positions, one indented continuation, and each individual space in reading 5 must read as five.  
**What goes wrong:** A parser can handle those cases while still treating multiple wraps in one reading, other readings' wrap positions, or different indentation as boundaries, so layout still decides whether an answer is read.  
**One-line change:** Require every reading wrapped at every sequence of whitespace boundaries, including multiple simultaneous wraps and indentation variants, to yield the same five normalized texts.

3. **G2. Empty parts.**  
**Literal reading:** Reject the exact `What goes wrong` values `.`, `—`, `**`, `3`, and `V2`; for the other labels and forms, only `.` is explicitly tested.  
**What goes wrong:** `Literal reading: ???`, `Literal reading: 3`, or `Change: V2` can still count as content, although the fix brief requires a letter outside outcome IDs and list markers, so parts that say nothing may still be accepted.  
**One-line change:** Define substantive text once as at least one non-marker letter and apply that predicate to all three labels in every supported form.

4. **G4. Bold ID headings.**  
**Literal reading:** The first file has a required result, but `codex-launcher-fixes-4-1-sol/last.md` only has to “give its result with both parsers (report it),” with no required count, IDs, or text.  
**What goes wrong:** The result parser can continue refusing that complete bold-ID answer and merely report the refusal, despite the fix brief requiring it to read as three readings `V3`, `L1`, and `P2`.  
**One-line change:** Require the result parser to read that file as exactly three readings with those IDs and matching normalized texts.

5. **G6. The repair proven.**  
**Literal reading:** Each new case must fail first at an assertion on its outcome, not at a file-existence check, a no-throw check, or with `ENOENT`.  
**What goes wrong:** A case can catch setup failures and convert them into an unrelated `expect(false)`, assert a sentinel or incidental property, and therefore fail at the required location without demonstrating the named defect.  
**One-line change:** Require each new case to assert the exact repaired outcome and prove that it fails only when the corresponding production fix is reverted.