# agent-context architecture migration r01 — M0 frontier freeze

- Recorded: 2026-09-19 00:50 +03:00.
- Stage: M0 complete; read-only evidence accepted by the coordinator.
- Branch / worktree: `codex/owner-distill-r01` / `C:/Users/Pc Force/.codex/worktrees/6d57/phase5-staff-integration`.
- HEAD: `19e28f4f0874d96569bc6944e38ad94b89924b60`.
- Source plan: `docs/phase-records/handoffs/coordinator/20260918-233000-agent-context-architecture-migration-plan-r01.md`.

## Exact frontier identity

The plan's earlier 219-entry observation preceded the plan file itself. At M0 the default
directory-collapsed status contained 220 entries (86 tracked modifications, 134 untracked
entries). Expanding every untracked file produced 271 entries (86 tracked modifications,
185 untracked files). Nothing was staged.

| Evidence | Bytes | SHA-256 |
| --- | ---: | --- |
| `git status --porcelain=v1` stdout | 15,202 | `ed3d2dfc4acd02e6ff3014b98eb5ac87175d40e3bdf1a5e50b4a04c882971787` |
| `git status --porcelain=v1 --untracked-files=all` stdout | 19,876 | `d0c8a3558801672f98c0bef321471bf882a4c5f1c6e3d16a50a1bbd09980b831` |
| `git diff --binary --no-ext-diff HEAD --` stdout | 477,790 | `597a3e25974bd6ce1f8fcca46a97900d0971d537bcb2c069246caa30021889ad` |
| `git ls-files --others --exclude-standard -z` stdout | 15,165 | `16863eea4688a633f8d77ccb00b2a4e751dfabaf859c95797c6124396f395094` |
| `PROJECT_STATE.yaml` before M1 | 6,389 | `9a01e8251b9610ab241cc745310ed12993a54b8ef8c9855469b8197210a36d2d` |
| `PROJECT_STATE_HISTORY.yaml` | 318,816 | `8f500211f873c70d76fc20ab0f075a6a01801e448f3863d659a1d594dac0ac59` |
| source plan | 37,826 | `96e49baaf92e1ba9e0f637ff7b37b40a8f8dee299ea026f2e7b6e1e3bdb9b633` |

Existing preservation remains the lower-level byte authority for the pre-repair frontier:
the pinned snapshot hash is `86e416a729208bdce28670c41fcf1feb5c55443f6e0443d46b4ea8d7969f2d41`,
and the baseline-listing hash recorded by that snapshot is
`8bca7d43dbe8b5cb7bb319e843cb7dd7782375c7abac449e3f8e939e28db555f`.
The predecessor preservation manifest is
`18e17a34252864a598d485443f47a74762f45a7b36a03583597c4ea30420cc99`.

## Ownership classification

- **M1 portability dependencies:** the design-environment repair's router, authority-register,
  state/history-schema, and design-context files, plus the r07/r08 runtime, fingerprint,
  frontier, repository, Owner-contract validator, and visual-supersession dependencies. Their
  predecessor records explicitly own these bytes; this migration may selectively integrate and
  revalidate them.
- **Protected unrelated frontier:** application/UI source, Owner/Staff presentation tests,
  screenshots, `audit/**`, `plans/**`, Owner-demo handoffs, and inspection artifacts. They remain
  outside this migration and must not be staged or rewritten.
- **Historical/provenance:** prior coordinator handoffs, frozen evidence, advisor material, and
  old screenshots. They remain preserved and are never normal startup context.
- **Migration-owned from M2 onward:** `docs/agent-context/**`, the new schemas/checker/show command,
  task packets, transition receipts, focused tests, and current migration records.

The locked-file review found no unresolved authority conflict. The `SPEC.md` change only corrects
the already-completed active/history location. The ADR-007 change records the binding human
ADR-009 supersession without changing any Product, security, privacy, data, accessibility, Public,
Staff, or Login semantics. ADR-009 and its human-decision record are therefore required portability
dependencies, not new decisions.

## Dependency closure accepted for M1

1. Root policy routes through Product/Spec/Workflow/active state and conditionally through design
   authority sources.
2. `PRODUCT.md` and `DESIGN.md` are authority-neutral tool routers and require their canonical
   targets, ADR-009, and the derived visual register to be tracked.
3. Repository verification requires both state schemas, the active/history union, the legacy
   phase3 transition compatibility chain, the visual-authority validator, ADR-009 policy module,
   manifests, registered cases, and their evidence.
4. The authoritative verification entrypoints require the runtime-session, focused-runner,
   repository-fingerprint, frontier, Owner contract, configuration, and focused-test files.
5. The design-context gate requires the two routers, `.impeccable/config.json`, its package script,
   and an installed Impeccable engine. On this host the sandboxed launch fails closed; the approved
   out-of-sandbox invocation passed with Impeccable 4.0.0 at both repository root and `apps/web`.

## M0 decision

M1 may begin with selective staging of the accepted portability closure and this migration's
coordinator state/records. No ambiguous Owner/UI path is needed. The existing phase3 successor is
already integrated in HEAD and remains the current terminal record until the planned M4 v2
transition; it must not be independently re-archived before that transaction.

The M1 verifier dependency review found that the trusted `scripts/verify.mjs` already invokes the
Owner class/spacing validators that were untracked in the pinned frontier. Removing those checks
would weaken the current verification ladder. The coordinator therefore transitioned exactly the
six validator/test/data paths into the M1 portability closure through
`20260919-010000-agent-context-architecture-migration-r01-frontier-policy.json`, pinning each
pre-transition hash. This integrates verification infrastructure only; no Owner UI, canonical,
Paper, or visual-acceptance bytes are included.
