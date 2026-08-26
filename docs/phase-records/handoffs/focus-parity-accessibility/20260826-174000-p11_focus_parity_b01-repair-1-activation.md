# Focus-parity accessibility — repair 1 activation

- Run: `p11_focus_parity_b01`.
- Existing worker worktree: `D:/Projects/fitway-worktrees/phase11-focus-parity-b01` on
  `work/phase11-focus-parity-b01` at activation base `c04e7a9` with an uncommitted six-file
  candidate and worker escalation handoff.
- Repair budget: activating focused repair `1 of 2`.

## Parent gate finding

The first writer stopped correctly. The parent inspected the complete diff and both focused-run
reports. The three CSS repairs and their direct assertions pass. The two remaining failures are
pre-existing first-Tab assertions whose sequential-focus origin was changed by the new
pointer-then-programmatic-focus proof. The `verify` run repeated the same candidate without another
repair, so it corroborates one failed implementation attempt; it does not consume repair 2.

This is not a product, visual, security, privacy, schema, or authority decision and does not require
human approval. It is a bounded test-harness sequencing correction inside the existing lease.

## Repair boundary

A fresh native worker may modify only the three leased browser specs, and only as necessary to
reset navigation/focus state between each new programmatic-focus proof and the existing keyboard
order assertions. The worker must preserve the discriminating pointer-then-programmatic-focus proof
and must not weaken, delete, reorder away, or skip any existing assertion. The three CSS files are
read-only in repair 1.

The repair must use the existing route-opening helpers or an equivalent deterministic page reset;
manual focus assignment to make the old Tab assertion pass is forbidden because it would remove the
keyboard-order proof. All original acceptance and verification commands remain binding. A second
post-repair failure is repair 1 failure and returns to the coordinator; no worker may self-authorize
repair 2.

## Route

Fresh native `gpt-5.6-terra` at `high`, role `worker`, no-history fork. The same operational-capacity
filters from registry revision `2026-08-25.10` remain current; direct correction is not selected
because the failed writer must be replaced by a fresh worker and the coordinator preserves
independence from the implementation surface.
