1. **Outcome exploited: D5**
   - **Literal reading:** “an absolute path as it is on disk” permits copying any absolute file named on the “Read first” or “Decisions” lines into `sources/`, with no safe-path allowlist or sensitive-path exclusion.
   - **What would go wrong:** a brief could name `D:/fitway-private/...`, `D:/fitway-grader/...`, or a secrets file; the launcher would send it to DeepSeek/Open Design, violating the working agreement that private data, held-out rows, and real secrets are never sent.
   - **One-line change:** Refuse to copy any absolute source outside an explicit safe allowlist and add denials for `D:/fitway-private/`, `D:/fitway-grader/`, and secret-like paths before Codex starts.

2. **Outcomes exploited: D2 and D3**
   - **Literal reading:** D2 requires carrying the arguments from `route-args.txt`, while D3 separately requires writing and hashing a catalog. Nothing says the catalog argument passed to Codex must be the catalog written into that run’s folder.
   - **What would go wrong:** Codex can keep using the old or missing catalog named by the static route arguments while the run folder contains and hashes an unused catalog; a changed cache can still silently remove the patch tool.
   - **One-line change:** Require the D2 catalog argument to point at the just-validated per-run catalog, after checking that its model entry deep-equals the read-only `catalog.json`.

3. **Outcome exploited: D5**
   - **Literal reading:** the `sources` folder must contain only files named on the brief’s “Read first” and “Decisions” lines, so `D:/fitway-temp/opendesign-smoke/route-args.txt` and `catalog.json`, named only in D2 and D3, need not be copied.
   - **What would go wrong:** the review never sees the successful route arguments or expected catalog values, so it cannot detect stale arguments, incorrect catalog construction, or the D2/D3 disconnect; it can approve an unrunnable route.
   - **One-line change:** Copy every external read-only artifact the outcomes rely on, including `route-args.txt` and `catalog.json`, into `sources`.

4. **Outcome exploited: D1**
   - **Literal reading:** only the model has a stated default; `<level>` can remain mandatory, with DeepSeek merely accepting `high` and `max`.
   - **What would go wrong:** `pnpm codex:round <brief>` does not run DeepSeek at `max` unless the user also supplies `max`, so the stated default and the intent that rounds moved to DeepSeek at `max` remain unmet.
   - **One-line change:** Make the level optional and default an omitted DeepSeek level to `max`; GPT may still require an explicit allowed level.

5. **Outcome exploited: D6**
   - **Literal reading:** D1-D5 are covered with a fake Codex, and the fast ladder passes.
   - **What would go wrong:** a fake that accepts any arguments can approve a model, route, catalog, or CLI option set that real Open Design rejects, omits the patch tool, or cannot run; CI then guards the test double rather than the actual route.
   - **One-line change:** Require one real DeepSeek/Open Design smoke launch, resume, and review that proves request acceptance and `apply_patch` availability before reporting PASS.