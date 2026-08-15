# Frontier checkpoint — 2026-08-15 12:00

Third usage-limit interruption of this coordinator session. All worktrees inspected immediately
afterwards: clean, no partial write. The audit worker stopped before its first repair edit, so
candidate `8c40740` is intact.

## Closed this session

| Milestone | Integrated | Repairs | Evidence |
| --- | --- | --- | --- |
| `phase10-csv-transport` | `3ce3efd` | 0/2 | `20260815-021800-p10_csv_transport_c03-coordinator-done.md` |
| `phase-12` | `05ad2c4` | 0/2 | `20260815-030000-p12_edge_c01-coordinator-done.md` |
| `phase11-shell` | `63c3603` | 0/2 | `20260815-071500-p11_shell_c02-coordinator-done.md` |

`main` is at `3a19ef8`, clean, and was proved green by `pnpm verify:full` after each of those three
integrations.

## In flight

`phase11-audit` b01, candidate `8c40740` on `work/phase11-audit-b01` in
`D:/Projects/fitway-worktrees/phase11-audit-b01`. Independent verification returned `PASS`, but the
**coordinator integration gate failed** and the merge was reverted at `4ec350b`. Repair budget is
now `1/2`; the worker has been briefed and had not yet edited when the limit hit.

The defect: `apps/web/src/hooks/use-owner-audit.ts:181` calls `admin.analytics.timeContext`, a Phase
9 procedure, and `tests/browser/phase9-owner-ui.browser.spec.ts:157-160` asserts the exact post data
for that route. The audit section mounts on `/admin` beside the Phase 9 analytics, so its second
differently-shaped call trips the mock and five Phase 9 tests fail.

## The gate defect this exposed, and the fix applied

Neither the worker nor the independent verifier could see the regression. `verify:fast` runs no
browser tests, and `verify:phase` runs only the profile's `browserFiles` — which for `phase11-audit`
listed just its own spec. That was a **coordinator scoping error in the activation**, not a lapse by
either agent; the verifier built its own probes and was still structurally blind to it.

`scripts/verify.mjs` now runs `phase11-audit`, `phase9-owner-ui`, and `phase11-shell` together for
that profile, with the reasoning recorded in the file.

**This generalizes.** `phase11-access`, `phase11-settings`, `phase11-health`, and `phase10-ui-csv`
all mount on `/admin` too. Every one of their profiles must list the sibling `/admin` specs from
activation, not after a caught regression. Any future `/admin` slice inherits the same rule.

## Resume order

1. `phase11-audit` repair 1/2, then re-verify and integrate.
2. `phase11-access`, `phase11-settings` — both gated on the coordinator audit generalization
   recorded in `20260815-013000-audit-generalization-design.md`.
3. `phase11-health`, then `phase10-ui-csv`, `login-paper-adoption`, the accessibility slice in
   `20260815-031500-focus-parity-gap.md`, canonical baselines, the `phase-10` and `phase-11`
   aggregates, and final closure.

## Standing operational notes

Root-run verification needs `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID` exported
plus the machine-local root `.env`. `pnpm verify:fast` rejects a set `FITWAY_PHASE`. Never edit the
working tree while a ladder is running — the mutation guard will correctly fail the run, as it did
once in this session.
