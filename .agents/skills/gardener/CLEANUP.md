# Gardener cleanup reference

Read this file only when a pass proposes a folder, branch, registration, or
worktree removal. The survey never performs housekeeping.

Merged branches and worktrees are judged against **`origin/main` as last
fetched**, with its exact commit in the report. The survey never fetches or
falls back to local main.

The launcher chooses a fresh output directory; use `-Out <absolute-fresh-run>`
and `-TempRoot <absolute-temp-root>` (default `D:/fitway-temp`). A folder is
eligible only when its newest modification is at least seven days old, no open
record or tracked checkout text file cites it by path, and every link,
readability, and worktree guard passes. The rolling report's explicit
`## Folder removal proposals` section is a proposal list, not evidence;
citations elsewhere remain protected. A prose word matching a folder name is
not a citation. Survey and cleanup use the same citation rule and name the
original citing file and line.

Git's binary classification, including attributes, excludes binary files from
folder citation sources. A citation of the temp root or a path above it,
including a drive root or its `/d/` spelling, protects no folder. Citations of
a folder or paths below it protect that folder and related folders below the
temp root. For a path containing `<...>`, `*`, `?`, or `{...}`, only complete
path segments before the first segment containing a placeholder name a
protected folder, and that prefix must be below the temp root. Thus
`D:/fitway-temp/keep/out/*.png` protects `keep`, while
`D:/fitway-temp/<run>/` and `D:/fitway-temp/verify-fitway-*` protect no folder.

Every registered worktree's status and links are inspected at every depth.
Junctions and directory/file symbolic links are read without traversing them.
An external or missing target, unreadable link or subtree, or unmeasured
inspection withholds removal; the report names every link and its target or
error. Links whose resolved targets are all inside the worktree, including
pnpm's layout, remain eligible. Worktree proposals run `remove-worktree.mjs`,
which rechecks links and eligibility, unlinks verified internal links without
following their targets, and then invokes Git; never substitute bare
`git worktree remove`. It is the one removal path for a worktree that may hold
evidence: ignored files cited by a tracked record, or by a record citing a
folder above them including the worktree path, refuse removal with the file and
citing line. An uncited ignored file remains removable.

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

The survey also emits `prune.mjs`, separately from `cleanup.mjs`, and never
runs either. Prune proposals cover each top-level temp folder that yields
deletable files. They keep a cited file, every non-capture in a cited folder,
and a capture whose file name a kept text file anywhere in the same top-level
folder mentions. A name is a token without spaces (`frames/en.png` names
`en.png`); inside backticks or straight quotes it may hold spaces. An uncited
capture is deletable. A kept text file that cannot be read withholds its
top-level folder's proposal, naming the file. The tracked-record rule is the
same citation matcher used by the cleanup and the gone-citation audit, over
tracked `.md`, `.yaml`, `.yml`, `.tsv` and `.txt` files.

The prune walks only what a decision needs. A directory no citation reaches is
proposed whole without being walked, unless it holds a capture a kept text file
names; a whole top-level folder takes its bytes from the survey's measurement,
and any other whole folder is reported as not measured. Inside a cited folder, a
`node_modules` and a directory holding `.git` are kept whole without being
walked. The proposal reports each folder's freed bytes and the files and
reasons it keeps. The generated script rechecks citations, registered worktrees
and links before deleting: it unlinks individual files, and removes a whole
folder only while it holds and sits in no registered worktree and every link in
it resolves inside it. It never follows a link.

The final survey is run with a fresh `-Out` and
`-FinalReport <absolute-checkout>/.agents/skills/gardener/REPORT.md`. It
rechecks safety and emits exactly the report's list; an unsafe listed folder
blocks collection. The coordinator reruns the final command after integration
and bookkeeping; never edit the report afterward.
