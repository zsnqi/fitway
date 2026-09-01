# Desktop demo handoff

- Status: `IN_PROGRESS` — approved design recorded; implementation has not started.
- Base commit / candidate commit: `5ebb22998a9e65b8f9fa751d66edc55e13f4bf4e` / none yet.
- Branch / worktree / run ID: `codex/desktop-demo` / `C:/Users/Pc Force/.codex/worktrees/f2a7/phase5-staff-integration` / `desktop_demo_c01`.
- Owned paths / shared leases used: see `PROJECT_STATE.yaml` milestone `desktop-demo`.
- Decisions made: desktop-only; guarded loopback Docker Postgres; real auth/services/APIs/simulator;
  secure credential prompts; no LAN/TLS/firewall work.
- Changes by file: design record and coordinator activation state only.
- Validation commands and results: repository was clean at base; `pnpm exec vitest --version`
  failed because worktree package links are incomplete, so a frozen install is required before
  implementation verification.
- Browser/a11y/visual artifacts: none; presentation capture is excluded.
- Independent verifier findings: pending.
- Remaining work or exact blocker: user review of the committed design, then implementation and
  verification. Docker exists but its engine was not accessible during discovery; the operator
  must fail clearly if Docker Desktop is unavailable.
- Exact resume command: `git status --short --branch` from the recorded worktree, then follow
  `docs/superpowers/specs/2026-09-01-desktop-demo-design.md`.
- Stop/escalation conditions: any non-loopback/destructive target mismatch, Product/Spec conflict,
  production credential/data exposure, auth weakening, schema migration need, or requested scope
  beyond the desktop demo.
