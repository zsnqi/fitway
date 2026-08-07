# phase5-staff-ui — integrated into main, blocked on human visual approval

- Status: `NEEDS_HUMAN`. The candidate is integrated and `pnpm verify:full` passed at the integrated
  head, but the `visual` gate cannot be closed by any automated run. Nothing pushed.
- Base commit / integrated commit: `6e65774` (`main` before integration) / `6321949` (merge)
- Branch / worktree / run ID: `main` / `D:/Projects/fitway` / `p5_staff_full2`
- Owned paths / shared leases used: all four shared leases released; work integrated

## What was done

Merged `work/phase5-staff-ui-b03-retry` (`a2936e5`) into `main` with `--no-ff`, producing `6321949`.

Two corrections to the incoming handoff's framing, both established from git rather than accepted:

1. It describes the candidate as "five commits on `608c1f8`". The branch actually carried **twelve**
   commits since the recorded `baseCommit` `229b9ce`; `608c1f8` and its six predecessors were also
   absent from `main`. Cherry-picking only five would have failed — `f5bc29e` retires a command UI
   that `ed10781` introduces. A merge was both the repository convention (seven prior
   `merge: integrate <phase>` commits) and the only mechanism producing the correct tree.
2. The worker branch never touched `PROJECT_STATE.yaml` (byte-identical to the M0 baseline), and
   `main`'s four coordinator commits touched only the ledger plus two handoff files. The merge
   preserved coordinator history verbatim — no ledger commit replayed, no handoff duplicated. I
   verified this before committing by diffing the predicted merge tree against both parents; the
   resulting tree `444e1ce` matched exactly.

## Verification performed

`pnpm verify:full`, run id `p5_staff_full2`, port `20657`, disposable database
`fitway_integration_p5_staff_full2`, at `6321949` — **PASS**:

invariants PASS (31 milestones, 8 canonical screenshots); Biome 210 files clean; all workspace type
checks PASS; 35 unit files / 138 tests PASS; 5 simulator tests PASS; `pnpm -r build` PASS; 7
integration files / 26 tests PASS; 29/29 browser and accessibility tests PASS; mutation guard clean
("Verification full passed without repository mutation"). `git status --short` empty before and
after. `pnpm check:repository` passes against the updated ledger.

**Environment note that costs a full run if unknown.** The first `verify:full` failed
`tests/browser/phase4-staff-web.browser.spec.ts:187`. Not merge-caused: `login.tsx` and
`auth-client.ts` are byte-identical across the merge and the test mocks the network. Cause:
`playwright.config.ts` does not pin `VITE_SERVER_URL`, so the run inherited
`http://localhost:3100` from untracked machine-local `apps/web/.env`; `Retry-After` is not
CORS-safelisted, so it reads `null` cross-origin and `login.tsx:80` falls back to `?? 30`. Re-run
with the canonical `/api` — 29/29. No test, config, or threshold was changed to get green.

## Gate states

| Gate | State | Evidence |
| --- | --- | --- |
| unit | PASS | 35 files / 138 tests at `6321949` |
| integration | PASS | 7 files / 26 tests at `6321949` |
| browser | PASS | 29/29 at `6321949` |
| accessibility | PASS | `phase4-staff-web.browser.spec.ts:438` runs axe against `/staff` (`:417`) in both locales at every required width |
| visual | **PENDING** | see below |
| independentReview | PASS | fresh verifier, run id `p5_verify_indep`, at `a2936e5` |

## Why `visual` is still `PENDING`, and why this is `NEEDS_HUMAN`

`verify:full` cannot close this gate. `toHaveScreenshot` appears only in
`tests/browser/public-baseline.browser.spec.ts`, whose six canonical baselines cover the **public**
surface. There is **no canonical `/staff` baseline**. This slice did change that surface —
`staff.css` by 116 lines, `operational-snapshot-view.tsx` by 19 — so a green visual step proves
nothing about it. Marking it `PASS` would claim evidence that does not exist.

Two human acts are outstanding:

1. **A fresh human visual review of `/staff` on `main`.** The 2026-07-27 verdict
   (`20260727-230622-p5_staff_b03_retry-human-visual-verdict.md`) did not approve the staff
   experience and required a bounded refinement pass *followed by a fresh human visual review*, and
   said explicitly: "Do not mark the phase or aggregate `DONE` from this handoff." The refinement
   landed in `885b5b0` and is integrated; the fresh review never happened. The monitoring-only plan
   asserts at line 146 that the salvage "answered" the verdict, but that is an agent-authored claim
   and cannot discharge a human approval requirement. Its surviving items — metric balance, empty
   space, label clarity, header hierarchy, RTL/LTR visual continuity, login copy density, decorative
   controls that look interactive — concern the monitoring and login surfaces that outlive the
   retirement, so removing the command UI does not moot them.
2. **Confirmation that `/staff` shows no command affordance** — the plan's validation item 7. No
   automated negative control exists by design: the deliverable is an absence, and the repointed
   browser profile runs Phase 4 monitoring coverage, so reintroducing a command control would fail
   no test. Per the task's standing constraint, none was invented.

`scripts/verify-repository.mjs:205-211` enforces this independently: a `DONE` milestone with a
`PENDING` gate fails the invariant check. `phase-5` cannot close either, per `:164-166`.

## Locked boundaries, all held

`/staff` is monitoring-only; Staff Command UI stays retired; backend/internal command infrastructure
preserved (`apps/server/src/command-repository.ts:208` `commandService` retained for Phase 7's cron
route); Decision 6 / `operationalSnapshotSchema.source` untouched and still deferred to Phase 6. No
Phase 6, 10, or 11 work, no Paper redesign, no unrelated cleanup. Nothing pushed.

## Carried forward, with owning phase

- `SPEC.md:496-498` still lists "pending command status" while the frozen DTO at
  `packages/api/src/health/snapshot.ts:41-50` has no such field. Pre-existing on `main`; a
  spec/implementation mismatch, not a surviving command-surface requirement. → **Phase 6**.
- `RESEARCH.md:283` and `:576` still mention manual fallback and staff correction/reset usability.
  Provenance, not normative. → **Phase 6**.
- Adopting `STAFF MONITORING PRODUCTION SET — CURRENT`. Per ADR-007 no production family is
  implemented anywhere; this slice deliberately implements none. → **separate later slice**.
- `playwright.config.ts` does not pin `VITE_SERVER_URL`, so the browser gate's result depends on an
  untracked file. → **test-resource configuration owner**, not Phase 5.
- No automated negative control for the absent command surface. → deferred to human confirmation by
  the approved plan; recorded, not invented.

## Coordinator ratification

`docs/phase-records/paper-design-phase-closeout.md` was edited by `12d8be2`/`608c1f8` despite
`forbiddenPaths` reading "every other milestone's phase record". Ratified: the diff only closes that
document's own open question 4 — precisely the decision this slice implements — and introduces no
new product decision.

## Exact resume

After a human grants both items above, a coordinator sets `phase5-staff-ui` `visual: PASS` and
status `DONE` with `integratedCommit: 6321949`, then closes the `phase-5` aggregate following the
`phase-9` precedent in `439b1b3` (aggregate gates are the union of constituent slices; record the
pre-closure `main` head as the evidence baseline and re-anchor in the next coordinator commit).

If the visual review instead rejects `/staff`, that is a bounded UI refinement slice against a fresh
lease on the staff surface — not a reopening of the monitoring-only decision, which is locked.

## Stop conditions

Do not mark `phase5-staff-ui` or `phase-5` `DONE` from this handoff. Do not update canonical
screenshot baselines. Do not push. Do not begin Phase 6, 10, or 11 in the same session.
