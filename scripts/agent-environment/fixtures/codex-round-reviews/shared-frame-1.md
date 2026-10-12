1. **F1 — Duplicate implementations inside one shared file**
   - **Literal reading:** “Defined in more than one file” permits four copied frame implementations and words tables inside the same shared script, selected by page. Minifying them can satisfy the 400-line reduction.
   - **What goes wrong:** All comparisons can remain equal, yet changing the rail or status still requires changing several copies. The code lives in one file without living once.
   - **One-line fix:** “Each common frame behavior and vocabulary table must have exactly one implementation or definition in the shared script; only the stated page-specific differences may remain separate.”

2. **F2, F3 — Preserve only the tested combinations**
   - **Literal reading:** Equality is required for the listed comparison matrices. English over `file://`, touch with full motion, and `?motion=off` are not explicitly covered by those matrices.
   - **What goes wrong:** The delivered pages can break in those supported combinations while every required comparison passes, defeating the intent that nothing users see or do changes.
   - **One-line fix:** “Base-equivalent appearance, behavior and motion are required across every supported combination of transport, language, viewport, input and motion setting, including `?motion=off`; the listed comparisons provide evidence for that requirement.”

3. **F3 — Use existing base instability to excuse new instability**
   - **Literal reading:** A `NOT-HELD` sample qualifies whenever two base captures differ, including a qualifying pair found on a rerun. The result’s variation need not resemble or stay within the base’s variation.
   - **What goes wrong:** Small baseline timing variation can excuse substantial new flicker or erratic motion at the same sample, while no `TIMELINE DIFFERENT` is reported.
   - **One-line fix:** “Accept a `NOT-HELD` exemption only when a fixed set of repeated paired captures shows no result-only visual state or variability beyond the base; do not select a favorable rerun.”

4. **F3 — Change motion between sampled pictures**
   - **Literal reading:** The outcome requires equality at scheduled samples, spaced up to 100 ms apart, starting at the first held picture.
   - **What goes wrong:** A transition can contain a visible flash or jump between samples—or before the first held picture—while sampled pictures and final resting states remain identical.
   - **One-line fix:** “Base-equivalent motion is required continuously from the triggering input through completion, including before the first held picture and between scheduled samples.”