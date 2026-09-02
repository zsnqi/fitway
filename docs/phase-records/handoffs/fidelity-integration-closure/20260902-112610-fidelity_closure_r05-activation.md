# FITWAY fidelity/integration closure r05 activation

- Status: `IN_PROGRESS`.
- Preserved source candidate: `6036de9a86f8c826bd64ae45be90830a8c920b94`.
- Branch/worktree/run ID: `codex/fidelity-integration-closure`,
  `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration`, `fidelity_closure_r05`.
- Authority: primary Codex coordinator; one repository writer at a time.

## Bounded successor scope

r05 corrects only the r04 independent-review defect. The shared Daily query must refetch stale
cached data when the first observer mounts after a real route unmount, while a late lazy Owner
section joining an already-observed query must not create a duplicate Daily/time-context pair.
Reconnect refresh and validated-cache/subtree preservation remain unchanged.

The repair must add a browser regression that advances beyond `staleTime`, leaves `/admin` through
the live SPA router so every Daily observer unmounts without destroying the root QueryClient,
returns to `/admin`, and proves exactly one second Daily/time-context pair. All r04 visual,
accessibility, logo, timing, reflow, state, and canonical work remains read-only.

After focused validation, r05 must run `pnpm verify:fast`, a fresh `pnpm verify:full` on a new exact
disposable database, the live desktop-demo proof, and fresh independent Standards, Spec, and
rendered Paper/accessibility reviews. It then integrates the exact accepted candidate by
fast-forward into canonical `main`, records durable closure, and removes only explicitly owned
disposable verification resources. No deployment, push, release, tag, presentation, or owner-facing
PDF work is in scope.
