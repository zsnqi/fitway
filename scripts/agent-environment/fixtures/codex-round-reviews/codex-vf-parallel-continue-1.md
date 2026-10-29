1. **P1 and P2: only the original pair must preserve real comparison semantics.**
   - **Literal reading:** Make 3186-3187 and 3188-3189 valid, locked pairs, while running the correctness-sensitive P2 checks on 3176-3177. P1’s new-pair check compares the base with itself, where every result is legitimately `EQUAL`, and P3 compares cache-on against cache-off on the same path.
   - **What goes wrong:** Rounds on the new pairs can produce false `EQUAL`, `DIFFERENT`, or `NOT-HELD` verdicts; the goal that every verdict matches a single canonical compare is then unmet.
   - **One-line change:** Require a result-against-base run on every allowed pair and compare its canonicalized items, order, verdicts, and failures with the 3176-3177 run.

2. **P2: the speedup can come from slowing the one-worker baseline.**
   - **Literal reading:** Add a delay or artificial serialization only to the one-worker path, then measure four workers against that modified run. This satisfies “at most half the wall time of the 1-worker run,” while L1 checks items, verdicts, and failures but not duration.
   - **What goes wrong:** The full check need not be faster than today’s compare, and may be slower; the stated intent that it costs a fraction of today’s time is unmet.
   - **One-line change:** Require four workers to beat half of an immutable pre-change HEAD one-worker median under alternating cold-and-warm runs.

3. **P3: the cache key can omit render-affecting environment state.**
   - **Literal reading:** Hash exactly the listed inputs: loaded page bytes, recipes, CLI files, browser build, and capture settings. The list “may grow,” so installed fonts, GPU driver, OS rendering settings, and similar environment state need not be added.
   - **What goes wrong:** A cached baseline frame can stand in after the environment has changed the rendered frame, producing false verdicts despite the intent that no change visible in a frame is missed.
   - **One-line change:** Add a rendering-environment fingerprint to the key or force frame validation on every cache hit.

4. **P2: the F126 rerun exception can be widened to an item-level classification.**
   - **Literal reading:** If the differing item is nominally Daily’s phone Lights chip, rerun any non-persistent mismatch once and accept the second verdict without proving the pixel difference itself lies inside that chip.
   - **What goes wrong:** Parallel-induced nondeterminism elsewhere in that item is normalized into “F126,” so four workers can change a capture’s stability while appearing to preserve one worker’s verdict.
   - **One-line change:** Require the complete difference mask to fall within the chip’s measured bounds and record both the three-worker and four-worker difference coordinates.

5. **P1: the pair and overlap evidence can be logical rather than actual.**
   - **Literal reading:** Accept and lock the three pair labels, refuse a fourth command using the same label, and write overlapping start/end timestamps into each comparison record. The actual child sockets may use ephemeral or shared ports, and an auxiliary listener may use 3174 or 3178-3185.
   - **What goes wrong:** Rounds can serialize, collide, or touch preview ports while the CLI messages and self-written records still satisfy every explicit check; the side-by-side isolation intent is unmet.
   - **One-line change:** Require the actual listener ports to equal the accepted pair and derive overlap from externally observed socket or child-process activity, not comparison records.