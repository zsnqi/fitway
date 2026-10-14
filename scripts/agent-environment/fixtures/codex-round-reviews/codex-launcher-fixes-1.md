### 1. Goal, with A1-A4
- **Outcome or limit:** Goal.
- **Literal reading:** Implement the allowlist, shared resolver, HEAD checks, and fake-Codex tests exactly as written, treating `codex exec -s read-only` plus the prompt’s “read only” instruction as sufficient confinement.
- **What would go wrong:** The review process still has ordinary read access to the host filesystem. A brief or copied source can direct the reviewer to read an absolute path outside `sources/`, and that content reaches Open Design. The fake-Codex tests cannot see this.
- **One-line change:** Require the review to run in an OS-level filesystem sandbox exposing only `brief.md`, `prompt.md`, the catalog, and the generated `sources/`.

### 2. L1, with A2
- **Outcome or limit:** L1.
- **Literal reading:** Preserve “the same result” for every brief under the production briefs folder by special-casing that folder or returning a stored legacy result, while applying the new validation elsewhere.
- **What would go wrong:** Production briefs can pass `brief:check` without their named sources being validated or read at all, so the actual review workflow gains no protection.
- **One-line change:** Replace L1’s path-scoped rule with a frozen per-brief expected-result fixture and forbid any path-based bypass of the shared collector.

### 3. A2
- **Outcome or limit:** A2.
- **Literal reading:** Let `brief:check` validate one read of the brief and sources, then let the later review phase independently read the paths again.
- **What would go wrong:** The brief, a source, or a symlink can change after the passing check and before copying. The review can then stop on a source, read different bytes, or follow a newly introduced outside link even though `brief:check` passed.
- **One-line change:** Have `brief:check` return a sealed brief-and-source manifest whose exact bytes and identities the review consumes atomically.

### 4. A3
- **Outcome or limit:** A3.
- **Literal reading:** Read repository sources at the brief’s named HEAD, while launching the implementer at the worktree’s current HEAD; later Markdown-only commits are already allowed.
- **What would go wrong:** A named Markdown source can differ between those two commits. The review reads one version and records dispositions, while the implementer reads another, defeating A3’s stated intent that both read the same text.
- **One-line change:** Refuse launch if any named repository source differs between the named HEAD and launch HEAD, or require launch at the named HEAD.

### 5. A1
- **Outcome or limit:** A1.
- **Literal reading:** Resolve junctions and symbolic links with `realpath`, but impose no identity check for hard links or other reparse aliases.
- **What would go wrong:** A hard link under `D:/fitway-temp` has an allowed real path while its bytes are also the outside file’s bytes, so outside content is accepted and reaches Open Design.
- **One-line change:** Accept only files with no extra hard links whose opened volume and file identity are verifiably under an allowed root.