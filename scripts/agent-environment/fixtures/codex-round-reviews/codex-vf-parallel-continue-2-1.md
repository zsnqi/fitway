### 1. P3, with P4: incomplete cache invalidation proof
- **Literal reading:** P3 anchors the key to “every one vf-speed’s key reads today,” and P4 tests only that one changed baseline byte invalidates a kept capture. It never requires a content digest covering every frame-affecting input or one mutation test per input class.
- **What goes wrong:** A capture-affecting input omitted from the key can change while the cached frame is reused, producing a stale baseline and false verdicts.
- **Closing change:** Require the key to digest every capture-affecting input and add a mutation test for each input class, not just one baseline byte.

### 2. P1 and P2: concurrent throughput is never timed
- **Literal reading:** P1 requires concurrent compares to finish and their captures to overlap. P2’s timing requirement measures each worker count only with the command running alone.
- **What goes wrong:** Two or three compares can contend, serialize through a hidden resource, or thrash the machine while still finishing and recording overlapping capture intervals. The delivered work can therefore be slower under parallel load, leaving the goal of faster round checks unmet.
- **Closing change:** Add a timed two- and three-way concurrent full-check run with a per-round or aggregate-throughput ceiling against the serial baseline.

### 3. P2, R3, and L1: the speed bar has no absolute anchor
- **Literal reading:** P2 compares the delivered commit’s 4-worker run with its own 1-worker run. R3 requires medians and alternating runs, while L1 preserves items, verdicts, failures, and tests, not wall time.
- **What goes wrong:** The serial path can be slowed through added overhead, CPU affinity, priority, or power-state differences while the 4-worker run remains fast. P2 then passes relative to the degraded control even though the delivered command is not faster than today.
- **Closing change:** Require the 4-worker median to beat a pre-change `f3601821` 1-worker median and require identical affinity, priority, and power conditions for both worker counts.

### 4. P1: actual socket use is not audited
- **Literal reading:** P1 checks accepted and rejected argument values, a sequential refusal when a pair is already in use, completion, verdicts, and capture overlap. It does not record every endpoint the commands actually bind or contact.
- **What goes wrong:** The selected pair can be nominal while an auxiliary server, preview, or capture channel still uses `3174` or `3178-3185`, so user previews are touched even though every stated check passes.
- **Closing change:** Record all listening and connected endpoints during the P1/P4 runs and fail if any endpoint lies outside the command’s selected pair or overlaps the reserved preview ports.

### 5. R5 and R4: the phase breakdown need not reconcile to wall time
- **Literal reading:** R5 requires a breakdown and the largest phases with seconds, but it does not require mutually exclusive spans, complete coverage of wall time, or an explicit unclassified/idle bucket.
- **What goes wrong:** The report can omit or double-count time, hide the real bottleneck, and leave R4 with no identified removable time, so the required diagnosis does not reveal where a compare’s time goes.
- **Closing change:** Require non-overlapping phase intervals that sum to the measured wall time within a stated tolerance, with all unaccounted time and per-worker idle time reported explicitly.