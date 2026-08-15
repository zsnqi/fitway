# Coordinator frontier recovery and remaining plan — 2026-08-15 22:15

Fourth coordinator session. The previous session ended on a usage limit, not at a stage boundary.
This record is the recovered frontier and the ordering for the rest of the work; it supersedes the
resume order in `20260815-120000-frontier-checkpoint.md`, which is otherwise still accurate.

## What the interruption actually left

One worktree held uncommitted work: `D:/Projects/fitway-worktrees/phase10-ui-csv-b01` carried the
three owner-only reporting procedures and their wiring, unstaged. Every other worktree was clean.
The work was valid and inside its contract, so it was type- and lint-repaired and committed rather
than discarded — see `../phase10-ui-csv/20260815-220500-p10_ui_csv_c01-stage1-reconciliation.md`.

## Baseline for this session

`main` at `a2e973b`, clean. `pnpm verify:fast` — PASS: repository invariants (35 milestones, 8
canonical approval screenshots), Biome, all workspace type/build checks, 56 unit files / 374 tests,
117 Python simulator tests, mutation guard clean. Root-run verification requires the machine-local
root `.env` loaded into the environment first; without `CRON_SECRET` exported, `cron.test.ts` fails
on its own guard rather than on anything under test.

## Remaining work, in dependency order

1. **`phase10-ui-csv`** — Stage 1 committed at `0212869`; the UI stage is in flight with a worker.
   Then independent verification, integration, and the `phase-10` aggregate.
2. **Coordinator audit generalization** — `audit_log` is command-coupled and cannot represent
   access or settings events. Proposal v3 (`20260815-180000`) is in its **third** independent design
   review; rounds one and two each returned blocking defects. Nothing is authorized until a review
   passes.
3. **`phase11-access`** — blocked on 2. Its human decisions are resolved and immutable
   (`../phase11-access/20260811-154032-p11_access-authority-resolved-capacity-blocked.md`); the
   remaining unblock conditions listed there are now satisfied except the reviewed audit
   generalization.
4. **`phase11-settings`** — blocked on 2. Note from the design record: there is **no settings write
   path anywhere in non-test code**, so this slice authors both the write path and its audit
   representation.
5. **Focus-parity accessibility slice** — `20260815-031500-focus-parity-gap.md`. Touches shared CSS
   owned by already-`DONE` milestones and therefore needs its own activation and lease.
6. **`login-paper-adoption`** and the canonical-baseline pass — both require Paper.
7. **`phase-11` aggregate**, then final closure.

## One-writer discipline for the rest of this session

`apps/web` work is serialized, not parallelised. The reporting UI, the focus-parity slice, and the
login adoption all land in `apps/web` and all gate on the same `/admin` and public browser specs;
running two of them at once would reproduce exactly the class of cross-slice regression recorded in
`20260815-120000-frontier-checkpoint.md`. Read-only review may run concurrently with a writer, and
does.

## Paper reachability, probed this session

The only design-file MCP available is Pencil, and it fails to connect: "failed to connect to running
Pencil app". This matches the previous session's finding. **Paper is unreachable.** Consequences,
recorded here so they are not quietly approximated later:

- The Paper-fidelity gate on the Phase 10 owner reporting surface stays **open**. The worker was
  instructed not to claim it.
- `login-paper-adoption` cannot be executed. Its preserved candidate is `9b65356`.
- The human requirement that canonical screenshot baselines exist for final adopted Paper surfaces
  (`/staff`, `/login`, `/admin`, Owner reporting) cannot be discharged for surfaces whose Paper
  composition has not been adopted.

These are external gates, not failures, and not grounds for lowering a gate.

## Standing operational notes, carried forward

- Root-run verification needs the root `.env` loaded plus `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, and
  `TELEGRAM_CHAT_ID`. `pnpm verify:fast` rejects a set `FITWAY_PHASE`.
- Never edit the working tree while a ladder is running; the mutation guard will correctly fail it.
- Playwright and any command taking an `/api`-shaped argument must run from PowerShell. Git Bash
  rewrites it into a Windows path and the run fails for that reason alone.
- Every `/admin` slice's verification profile must list all sibling `/admin` specs from activation.
  `scripts/verify.mjs` already does this for `phase10-ui-csv`; `phase11-access` and
  `phase11-settings` must get the same treatment in their activation commits.
