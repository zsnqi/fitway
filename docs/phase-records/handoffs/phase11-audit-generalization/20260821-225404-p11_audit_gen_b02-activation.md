# Phase 11 audit generalization b02 — Slice B activation

- Recorded: 2026-08-21 22:54 +03:00.
- Mode: plan, then execute only after a fresh read-only plan gate.
- Branch/worktree: `codex/phase11-audit-gen-slice-b` at `da2abc7` / `D:/Projects/fitway-worktrees/phase5-staff-integration`.
- Starting frontier: Phase 10 is `DONE`; Slice A is integrated at `e6c14b5`; the milestone is
  `IN_PROGRESS` solely for Slice B; no S5 or later work has started.

## Adopted objective and authority

Complete only S4 by switching the shared audit list output from command-only to all eleven
persisted actions atomically with its owner-audit web consumer. The accepted plan is
`docs/phase-records/handoffs/coordinator/20260816-224000-completion-preflight-and-remaining-execution-plan.md`
§S4, constrained by proposal v4, correction plan v2, `PHASES.md`, `SPEC.md`, the resolved access
authority record, and the secret-free audit rule. There is no open product decision.

## Bounded stages and rollback

1. **Contract/consumer implementation:** widen the strict DTO and mapper, retaining command
   invariants while mapping governance target/from-to and nullable effective state; use the
   already-integrated target-principal projection. Switch the existing owner audit component and
   hook to bilingual all-action labels, the target column, honest empty command targets, and the
   `effectiveMode` missing-value filter. Update only the focused unit/integration/browser fixtures
   and assertions required by that switch.
2. **Verification:** run the registered profile below: focused units/components; Phase 11 audit plus
   audit-generalization integration; `pnpm check-types`; `pnpm verify:phase --phase phase11-audit`;
   repository Playwright in EN/LTR and AR/RTL including governance target display, keyboard,
   reduced motion, reflow, forced colors, and automated accessibility; then `pnpm verify:fast`.
3. **Independent gate:** a fresh reviewer inspects the full diff and reruns proportional browser
   and accessibility evidence without repairing. Only PASS permits integration and `DONE`.

The rollback boundary is the single coordinator Slice B integration commit. Reverting that commit
on `main` restores the ledger to `IN_PROGRESS` at Slice A commit `e6c14b5`, preserves the integrated
Slice A schema, and restores the fail-closed command-only consumer. Migration `0007` is not
modified or reverted.

## Scope and exclusions

Writable source scope is limited to `packages/api/src/audit/**`, the existing audit repository
mapping/tests and two relevant integration tests, `apps/web/src/components/owner/audit/**`,
`apps/web/src/hooks/use-owner-audit.ts(.test.tsx)`, and
`tests/browser/phase11-audit.browser.spec.ts`. The target join/projection already exists, so
`apps/server/src/audit-repository.ts` changes only if the accepted behavior cannot be achieved with
that seam.

Forbidden: migrations/schema, Phase 5 command append semantics, access/settings writers,
shared i18n catalogs, route wiring, Paper, canonical screenshots, root configuration/manifests,
and every S5 or later surface. Any need to update a canonical baseline or make a material visual
change is `NEEDS_HUMAN`.

## Routing decision

- Discovery used two parallel native `gpt-5.6-luna` / `high` read-only workers because authority
  mapping and implementation-impact mapping were independent, high-volume questions.
- Meaningful implementation qualifies for delegation by economy and recoverability. FITWAY's
  durable 2026-08-21 qualified-pool authorization covers this non-secret source payload. Live
  OpenCode `1.18.20` discovery found the active qualified routes for Ox Alpha, DeepSeek V4 Pro,
  GLM-5.3, and MiniMax M3. MiniMax is filtered because a strict command boundary and exact final
  reporting are material; the other three and native Terra are eligible. Registry revision
  `2026-08-21.7` selects `ox-alpha` at `opencode/x-preview-f-free`, variant `high`, because the
  temporary availability/economic preference remains live, its active route has prior bounded
  FITWAY implementation evidence, and it is materially comparable for this supervised medium-risk
  implementation. JSON event capture, exact-session fallback, disabled external skill scanning,
  an empty skill allowlist, no MCP use, no auto-approval, one authoritative writer, and the parent
  diff/verification gate remain mandatory.
- Independent verification/review will use a fresh native worker that did not write the change.

### Writer-route gate outcome

The managed host rejected the authorized Ox Alpha invocation before `CreateProcess`: no provider
session, event capture, stderr file, source edit, or data transmission occurred. The route was not
retried or bypassed. Implementation is rerouted to native `gpt-5.6-terra` / `high`, which was an
eligible comparison survivor and has the concrete material advantage of staying inside the native
repository boundary after the host rejection. The native worker inherits the same exact write
scope, no-commit rule, secret exclusions, self-verification contract, and parent gate.

## Registered isolated verification profile

- `FITWAY_RUN_ID=p11_audit_gen_b02`
- Disposable PostgreSQL database and destructive marker:
  `fitway_integration_p11_audit_gen_b02` via `TEST_DATABASE_URL` and
  `FITWAY_INTEGRATION_RESET_DATABASE` with no fallback database.
- Playwright port/base: `4616` / `http://127.0.0.1:4616`.
- Browser output/report/review roots:
  `output/playwright/p11_audit_gen_b02`, its `report` child, and its `review` child. Canonical
  snapshot input remains `tests/browser/__screenshots__` and is read-only.
- Focused unit/component command:
  `pnpm exec vitest run packages/api/src/audit/list.test.ts apps/server/src/audit-repository.test.ts apps/web/src/components/owner/audit/owner-audit-view.test.tsx apps/web/src/hooks/use-owner-audit.test.tsx`.
- Focused integration command, serialized on the exact disposable database:
  `pnpm exec vitest run --config vitest.integration.config.ts apps/server/src/phase11-audit.integration.test.ts apps/server/src/phase11-audit-generalization.integration.test.ts`.
- Focused browser command:
  `pnpm exec playwright test tests/browser/phase11-audit.browser.spec.ts`.
- Repository gates: `pnpm check-types`, `pnpm verify:phase --phase phase11-audit`, then
  `pnpm verify:fast`; all run with the registered environment and must leave tracked status
  unchanged.
- Explicit assertions must cover all eleven action mappings and EN/AR labels across command,
  access, and settings classes, not only a single governance fixture. Browser assertions must
  render governance targets in both locales and both directions.

## Pre-execution worktree gate

- `pnpm install --frozen-lockfile --force` completed from the repository lockfile with 771 packages
  linked and no tracked source/configuration change. The first sandboxed attempt was interrupted
  after it stalled on user-store access; the approved rerun completed in 36.9 seconds.
- `pnpm exec vitest --version` PASS with the managed host's approved pnpm user-store access:
  `vitest/4.1.10 win32-x64 node-v24.14.0`. The restricted sandbox cannot resolve `pnpm exec`
  through user-store metadata, but both installed workspace entry points independently PASS there:
  `.\\node_modules\\.bin\\vitest.CMD --version` and
  `node .\\node_modules\\vitest\\vitest.mjs --version` print the same version. Verification that
  uses `pnpm exec` therefore runs with the already-approved narrow pnpm/Vitest access; this is a
  host permission boundary, not an incomplete installation.
- `apps/server/.env` is provisioned in this worktree and remains untracked/secret-local. Its
  contents are excluded from every worker packet and evidence artifact.
- The bootstrap-created `.pnpm-store` residue was verified inside this worktree and removed; the
  activation plan/state files are the only tracked or untracked repository changes before launch.

## Closure rule

On all required gates PASS, integrate Slice B, update this milestone to `DONE`, record the final
commit/evidence handoff, and stop. S5 `phase11-access` becomes the next valid stage but is not
started here.
