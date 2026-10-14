1. **H1, H2, H3; L2 — Narrow the timeline’s comparison region.**
   - **Literal reading:** L2 preserves ordinary comparison only. Timeline comparison can inspect regions sufficient to detect the required fade, export-wait and fixture mutations, while passing every specified measurement.
   - **Delivered failure:** Changes elsewhere in a stable frame—including parts of a control’s appearance—can pass unnoticed.
   - **One-line fix:** “Every stable timeline sample must retain the HEAD’s comparison regions and thresholds, with no additional cropping, masking or skipped pixel comparison.”

2. **H2 — Hold clocks only during sampling.**
   - **Literal reading:** Every clock must read held time “during a timeline sample”; clocks can remain native during initialization, action setup and between samples.
   - **Delivered failure:** Page state can advance using real time before capture; correct clock readings during capture cannot undo that progression, so other clock-driven timing changes can escape comparison.
   - **One-line fix:** “Install the page’s virtual clock before its first script executes and keep it active throughout initialization, actions, waits and captures; only the runner’s private scheduler may use native time.”

3. **H1, H3 — Support only the enumerated controls and release behavior.**
   - **Literal reading:** The required application measurements cover named features, and the mutation checks exercise release fades; an implementation can specialize its hold to those controls and that phase.
   - **Delivered failure:** Other controls or the press phase can still be skipped, despite the intent that every control’s press and release are compared.
   - **One-line fix:** “Apply the hold generically to every control’s press and release, independent of feature identifiers, and verify both phases on a control outside the enumerated list.”

4. **H2 — Trade individual stability regressions against improvements.**
   - **Literal reading:** Only each page’s total `NOT-HELD` count must not increase; newly unstable samples can be offset by samples made stable elsewhere on that page.
   - **Delivered failure:** Previously comparable moments become uncomparable while the page’s aggregate count still passes.
   - **One-line fix:** “No matched feature/action/time sample that was comparable at HEAD may become `NOT-HELD`, regardless of improvements elsewhere or the page’s total count.”