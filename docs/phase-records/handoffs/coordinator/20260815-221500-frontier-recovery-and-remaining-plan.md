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

## Paper reachability — corrected at 23:10

An earlier version of this record said Paper was unreachable. **That was wrong, and it is corrected
here rather than left standing.** The first probe went to Pencil, which is a different application
and is indeed not running; Paper itself was never probed.

Paper is **running and reachable**. Its desktop MCP server answers on `http://127.0.0.1:29979/mcp`,
`tools/list` returns the full tool set, and `list_files` shows the FITWAY file
`01KYPX5AF950XZVVDD88B6J7QB` — the exact file `phase10-paper-reporting` owns — open and active in
team `HUSSAIN`.

One caveat that matters for how the work is done: the `paper-desktop` plugin's MCP server is **not
bound into this session's tool surface**, so the Paper tools cannot be called as ordinary tools here.
They are reachable over that local HTTP endpoint by JSON-RPC. That is workable for a bounded fidelity
check; a session that needs sustained Paper authoring should have the connector enabled instead.

Consequences:

- The Paper-fidelity gate on the Phase 10 owner reporting surface is **achievable** and must be
  closed before `phase-10` is declared `DONE`. The reporting worker was told not to claim fidelity
  and its instruction stands — the gate is closed by a separate check against the rendered
  composition, not by the implementer's assertion.
- `login-paper-adoption` is executable. Its preserved candidate is `9b65356`. It stays serialized
  behind the other `apps/web` work.
- The human requirement that canonical screenshot baselines exist for final adopted Paper surfaces
  (`/staff`, `/login`, `/admin`, Owner reporting) can be discharged, in the serialized human-approved
  pass the workflow requires. Baselines remain coordinator-owned and are never regenerated to make a
  diff disappear.

## Standing operational notes, carried forward

- Root-run verification needs the root `.env` loaded plus `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, and
  `TELEGRAM_CHAT_ID`. `pnpm verify:fast` rejects a set `FITWAY_PHASE`.
- Never edit the working tree while a ladder is running; the mutation guard will correctly fail it.
- Playwright and any command taking an `/api`-shaped argument must run from PowerShell. Git Bash
  rewrites it into a Windows path and the run fails for that reason alone.
- Every `/admin` slice's verification profile must list all sibling `/admin` specs from activation.
  `scripts/verify.mjs` already does this for `phase10-ui-csv`; `phase11-access` and
  `phase11-settings` must get the same treatment in their activation commits.
