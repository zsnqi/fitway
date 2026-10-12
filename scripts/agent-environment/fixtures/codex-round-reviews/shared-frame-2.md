1. **F1 — duplicated frame content can remain in required HTML markup.**
   - **Literal reading:** F1 forbids duplicate functions, tables, and inline scripts, while also requiring each page to retain its header and rail markup. An implementer can leave labels and link destinations duplicated in that markup and centralize only JavaScript behavior.
   - **Failure:** Rail wording or links still require edits in multiple files, so the “change once” and “new page adds a tag” intent is unmet.
   - **Close:** Require per-page frame markup to contain structure only, with shared.js populating all frame labels and link destinations before first paint.

2. **F2 — known capture problems are blanket exemptions.**
   - **Literal reading:** Differences in the listed `arrive` states and keyboard/touch language states are expressly excused because the CLI cannot capture them.
   - **Failure:** An implementer can leave one of those interactions broken while every required comparison still passes.
   - **Close:** Require an independent DOM/state or interaction assertion for every exempt capture.

3. **F3 — `TIMELINE NOT-HELD` permits wrong output in unstable regions.**
   - **Literal reading:** A sample passes when the base varies and every result difference lies within the base’s varying region.
   - **Failure:** The implementation can add incorrect motion or content exactly in that region, such as the Daily phone tuner chip, while the timeline passes.
   - **Close:** Require the result’s run-to-run values in unstable regions to match the base’s complete distribution, with no result-only differences.

4. **F2/F3 — omitted combinations and unsampled instants remain untested.**
   - **Literal reading:** Full-motion tablet page states and many keyboard/touch paths are not covered, and most timeline samples can be up to 100 ms apart and stop at the longest recorded movement.
   - **Failure:** A tablet-only regression, a non-covered input path, or a brief change between samples can pass every listed check while violating the “every way” and “every moment” intents.
   - **Close:** Require exhaustive supported page/locale/viewport/motion/input/transport coverage and comparison of every rendered frame through the settled state.

5. **F4 — passing probes does not establish first-paint ordering.**
   - **Literal reading:** F4 only requires the probe commands to pass “as at the base”; it does not require them to measure shared.js execution relative to first paint.
   - **Failure:** The script can be deferred or injected after first paint while final captures remain unchanged, violating the render-blocking intent.
   - **Close:** Add a probe for every page and mode that records first paint and fails unless shared.js has executed first.