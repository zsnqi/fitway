# Phase 10 CSV transport b03 worker capacity blocker

- Status: `BLOCKED`; this is an external patch-approval capacity condition, not
  `FAILED_VALIDATION` or a candidate-gate failure.
- Branch / worktree / base: `work/phase10-csv-transport-b03` /
  `D:/Projects/fitway-worktrees/phase10-csv-transport-b03` /
  `c4bd178a0cc0ca9524a2da8230fa6d84487da2e1`.
- Repair counter: `0/2`; no commit, candidate, merge, or push exists.
- Ratified amendment: coordinator `ef36cd0d3a0098153e94af79b0ec9e2f0b88ad8d` and
  `20260813-144635-p10_csv_transport_b03-timeout-amendment.md`.
- Exact blocker: the worker's isolated worktree is outside the session writable root. Its required
  patch request and the coordinator's direct probe were both rejected before mutation because the
  automatic approval service reported the tool-usage limit exhausted until
  `2026-08-20T11:21:00+03:00`. Policy forbids an alternate write mechanism.
- Current worktree: eight authorized source/test paths only; `git diff --check` passes. No
  `pg_terminate_backend`, control connection, signaling, elevated role, or credential experiment
  remains.
- Passing pre-candidate evidence: transport + repository unit suites `16/16`; targeted raw SSE
  integration `3/3`; type check; acquisition-abort exact reason plus late-client release; timeout
  `set_config` slice.
- Current expected TDD red: when abort fires during a pending query, the repository exposes the
  destroyed-query error instead of the exact `signal.reason`. The attempted corrective patch was
  rejected before changing the file.
- Remaining amended TDD: exact abort reason/category diagnostics, late acquisition rejection,
  SQLSTATE `57014`, primary-error/noUnsafeFinally cleanup, deterministic `(pid, backend_start)`
  real-Postgres disappearance and same-pool retry, then the complete original/amended ladder.
- Resume condition: a session with lawful write access to the isolated worktree, or approval
  capacity restoration. Recheck exact base/status/lease, open a fresh b04 only if workflow requires
  it, and preserve the b03 dirty worktree as provenance.
- Shared lease/profile are released/removed by the coordinator blocker transition so independent
  streams can proceed. The rejected b02 history and b03 worktree remain immutable provenance.
