1. **P2, F126 rerun exception.**  
   **Literal reading:** Any difference at Daily's Lights chip on the phone may be rerun once; if the rerun matches 1 worker, it passes. The brief never requires proof that the difference was caused by the known F126 instability rather than the new parallel path.  
   **What goes wrong:** A new concurrency race in that same item can be rerun away, so parallel load changes a verdict while P2 still passes, contradicting its Intent.  
   **One-line fix:** Permit an F126 rerun only when a 1-worker HEAD control reproduces the same Daily-Lights-phone difference; otherwise fail P2.

2. **P2 and R3, timed command configuration.**  
   **Literal reading:** Both timed commands use `--baseline-cache off`; no timing requirement covers the kept-baseline-cache path. Workers could be implemented correctly for parity but effectively serialize or add overhead when the cache is on.  
   **What goes wrong:** The real full check using kept captures may not take a fraction of today's time, so the round goal and the "kept optimization" workflow remain unmet.  
   **One-line fix:** Add warm cache-on 1-worker and 4-worker runs to R3 and judge P2's medians on those as well.

3. **P2 and R3, port-pair scope.**  
   **Literal reading:** The timed P2 commands are not tied to a specific port pair, while P1's other pairs have no wall-time requirement. The implementation can optimize the default 3176-3177 path while leaving 3186-3187 or 3188-3189 slow.  
   **What goes wrong:** Only one round gets the promised speedup; the second and third rounds can remain expensive despite passing P1's correctness and overlap checks.  
   **One-line fix:** Require the P2 medians on all three port pairs, not only the default pair.

4. **P1, concurrency proof.**  
   **Literal reading:** The two and three compares may use the default one worker, and the proof requires only that captures' start and end records show overlap. It does not require sustained overlap, a wall-time bound, or any test of concurrent four-worker compares.  
   **What goes wrong:** The commands can mostly serialize, with one trivial overlap, and multiple four-worker rounds may contend, oversubscribe, or lock in actual use without any check failing.  
   **One-line fix:** Run two and three compares with `--workers 4`, require cross-pair overlap through the measured interval, and add a bounded aggregate wall-time or control-ratio requirement.

5. **R5, phase accounting.**  
   **Literal reading:** R5 allows an `other` phase for time none of the named phases covers and only requires the phases to sum to the run and worker spans. An implementation can put the large residual in `other` and report it as the largest phase.  
   **What goes wrong:** The breakdown need not identify removable work, so R5 can be satisfied without finding where a compare's time goes or justifying an optimization.  
   **One-line fix:** Cap `other` at a small percentage of wall time and require any larger residual to be split into named, measured phases.