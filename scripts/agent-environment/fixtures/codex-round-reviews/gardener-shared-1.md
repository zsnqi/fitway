1. **G1 — Revision selection**
   - **Literal reading:** Permanently pin ordinary scans to `7e28c713`. Derive its files correctly and test added pages using fixtures.
   - **What goes wrong:** Every acceptance check passes, but later pages and refactors never affect the gardener’s readings.
   - **One-line change:** “Use `7e28c713` only for acceptance measurements; ordinary scans must resolve the configured branch’s current HEAD once and use that revision throughout.”

2. **G1 — Direct loads only**
   - **Literal reading:** Count only files directly referenced by HTML script `src` and stylesheet `href`; ignore modules and stylesheets imported by those files.
   - **What goes wrong:** Splitting shared code into imported files can remove it from measurement, making the shared code appear cleaner without removing its boundary breaks.
   - **One-line change:** “Derive each page’s load set transitively through local JavaScript and CSS imports, and update the fixed-revision expected list under that definition.”

3. **G1, G2 — Path matching only during discovery**
   - **Literal reading:** Derive membership using full paths and test duplicate basenames in the discovery helper, while retaining `scanBoundaryBreaks`’ basename filtering.
   - **What goes wrong:** The derived list is correct, but an unshared file with a shared file’s basename can still contribute boundary hits.
   - **One-line change:** “Boundary-hit filtering must use the exact derived paths, and a fast-ladder test must prove that an unshared same-basename file contributes no hits.”

4. **G3 — Disclosure depends on an explicit comparison**
   - **Literal reading:** Emit the first ordinary derived reading as a bare total without a trend; disclose list changes only in reports that explicitly compare readings.
   - **What goes wrong:** That first total carries no measurement-change notice, so someone comparing it with an earlier report can mistake the difference for the refactor’s effect.
   - **One-line change:** “Label the first reading after any shared-file method or set change as a new measurement baseline, even when the report displays no comparison.”