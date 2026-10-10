# Gardener cleanup reference

Read this file only when a pass proposes a folder, branch, registration, or
worktree removal. The survey never performs housekeeping.

The launcher chooses a fresh output directory; use `-Out <absolute-fresh-run>`
and `-TempRoot <absolute-temp-root>` (default `D:/fitway-temp`). A folder is
eligible only when its newest modification is at least seven days old, no open
record or tracked checkout text file cites it by path, and every link,
readability, and worktree guard passes. The rolling report's explicit
`## Folder removal proposals` section is a proposal list, not evidence;
citations elsewhere remain protected.

Git's binary classification, including attributes, excludes binary files from
folder citation sources. A citation of the temp root or a path above it,
including a drive root or its `/d/` spelling, protects no folder. Citations of
a folder or paths below it protect that folder and related folders below the
temp root. Placeholder segments protect only the complete path prefix below
the temp root.

Every registered worktree's status and links are inspected at every depth.
Junctions and directory/file symbolic links are read without traversing them.
An external or missing target, unreadable link or subtree, or unmeasured
inspection withholds removal; the report names every link and its target or
error. Links whose resolved targets are all inside the worktree, including
pnpm's layout, remain eligible. Worktree proposals run `remove-worktree.mjs`,
which rechecks links and eligibility, unlinks verified internal links without
following their targets, and then invokes Git; never substitute bare
`git worktree remove`.

Old unmerged, unreferenced worktrees include branch, last commit date, and
status for coordinator review and are never removal candidates. The invoking
checkout and weekly gardener worktree are always excluded. The weekly location
is configured in `config.json`; `FITWAY_GARDENER_WORKTREE` supplies a scheduler
override. Review-only findings do not by themselves block the pass.

For folders, propose only the generated `cleanup.mjs` for the user to run:
`node <survey-output>/cleanup.mjs`. It uses `rmdir /s /q` with a `\\?\` absolute
path, collects open records and tracked checkout citations when execution
begins, and rechecks each folder and contained worktree's cleanliness and
links. It skips unsafe candidates, continues after failures, and reports each
result. A citation in any tracked text file protects the named folder, its
ancestors, and descendants below the temp root; refusals name the citing file
and line. Files newly tracked or edited since the survey are included in the
execution-time citation collection. Folder age or size alone never authorizes
deletion. Real deletion regression tests run only on disposable test-created
folders.

The final survey is run with a fresh `-Out` and
`-FinalReport <absolute-checkout>/.agents/skills/gardener/REPORT.md`. It
rechecks safety and emits exactly the report's list; an unsafe listed folder
blocks collection. The coordinator reruns the final command after integration
and bookkeeping; never edit the report afterward.

