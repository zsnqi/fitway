# FITWAY — Paper design phase closed; repository audit is next

> **Archived 2026-08-06 — historical evidence, not current authority.** This file sat untracked
> at the repository root and was the only record of the closed Paper design phase. Its durable
> decisions were migrated into
> [ADR-007](../../adr/ADR-007-paper-visual-source-of-truth.md) (Paper as visual source of truth,
> Paper file identity, G3 ADAPTIVE GLASS, the four CURRENT production families, and the
> visual/behavioral split), the `paperAuthority` block of
> `visual-direction-gate/approved/APPROVAL_MANIFEST.yaml`, `AGENTS.md` (agent workflow), and
> [the closeout phase record](../../phase-records/paper-design-phase-closeout.md). Read those
> first; where this file and ADR-007 differ, ADR-007 governs. Sections 2 and 4 below are a
> consumed instruction: the read-only audit they request has been performed. The body is
> preserved unedited.

**Status as of 2026-08-05.** This document supersedes every earlier FITWAY handoff, including all cleanup, candidate-construction, state-correction, and promotion instructions. Any instruction in a previous handoff that conflicts with this one is void.

The Paper design phase is **complete**. All four product families are approved and promoted to current production. No repository implementation work has begun as part of this closeout.

---

## 1. Paper ground truth

Paper file: `FITWAY UX Exploration` (`01KYPX5AF950XZVVDD88B6J7QB`, page `Page 1`).

### Approved current productions

These four areas are the approved rendered product families. Each is a native top-level area inside the production zone:

- `OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT`
- `STAFF MONITORING PRODUCTION SET — CURRENT`
- `LOGIN PRODUCTION SET — CURRENT`
- `PUBLIC CROWD BOARD PRODUCTION SET — CURRENT`

### Governing sources

- `09 — FITWAY FINAL SYSTEM — G3 ADAPTIVE GLASS + OWNER ANALYTICS` — the single governing FITWAY visual system. Section 15 records production authority and consolidation; Section 16 records the Public G3 build contract as fulfilled.
- `PUBLIC — APPROVED BUILD REFERENCES` — reference evidence only. It is **not** approved Public visual production and must never be presented as such.
- `FITWAY — APPROVED CURRENT PRODUCTION` — the organizational zone banner for the production row.

### Public status — fully approved and promoted

`PUBLIC CROWD BOARD PRODUCTION SET — CURRENT` contains the complete approved family:

- **Live**, Arabic and English, at 1440, 768, 390, 320, and 200% text reflow;
- **Loading, Delayed / Last known, Unavailable, Closed, Failure / Retry**, Arabic and English, at 1440 and 390;
- selected responsive-resilience specimens (768 English loading skeleton; 720 CSS px Arabic delayed hierarchy with long-copy reflow; 320 Arabic unavailable logical-start with wrap; 320 English failure/retry long-copy);
- the interaction and accessibility evidence board;
- the corrected **Live** state marker — the filled `--fw-live` dot now renders beside the word in the coloured state row, with the monochrome proof row preserved;
- the G3 shell and signed-out header.

`PUBLIC CROWD BOARD — G3 LIVE BASE CANDIDATE` remains in the file as a **source artifact only**. It is no longer authoritative over Production. Do not build from it, and do not treat it as the reference for Public visuals.

### Authority split

**Paper is the visual source of truth.** Repository product contracts and message catalogs remain authoritative for behavior and for exact copy wherever already specified. Where Paper copy and a repository message catalog disagree, the catalog wins for application strings; where visual treatment is in question, Paper wins.

---

## 2. Next phase — read-only repository audit

The next session must begin with a **read-only** audit. It must not change implementation files, and it must not assume deletion or rewriting before inspecting actual repository ground truth.

### Objective

Establish, from evidence rather than assumption:

1. **Which design and specification files are current, stale, duplicated, or superseded.** Root-level governing docs are `FITWAY_PRODUCT.md`, `SPEC.md`, `DESIGN_GUIDE.md`, `PHASES.md`, `RESEARCH.md`, `AGENTS.md`, `README.md`. Visual authority is recorded in `docs/adr/ADR-006-visual-authority.md`.
2. **Which old Paper exports and design assets should be removed or replaced.** Candidate areas to inspect — not a deletion list — include `docs/archive/visual/`, `design-research/`, `visual-direction-gate/`, and `brand/`. Note that `tests/browser/__screenshots__/` holds test baselines, not design assets; changing those is a test concern, not a cleanup concern.
3. **How `DESIGN_GUIDE.md`, `SPEC.md`, `PHASES.md`, `RESEARCH.md`, and related files should reflect the four approved Paper productions** — including which sections still point at superseded directions.
4. **What implementation work remains** for Owner, Staff, Login, and Public.
5. **Which existing repository behavior must be preserved** — server-authoritative command lifecycle, public cache and privacy rules, business-day/time handling, auth principals and sessions, and edge authority and reconciliation are each covered by an ADR under `docs/adr/`.

### Output

A grounded cleanup and implementation plan, presented for حسين's review. **No files modified until he approves it.**

---

## 3. Agent workflow

The workflow حسين has approved:

- **Main agent is Claude Opus 5.** It owns authority resolution, scope, decomposition, review of every returned result, and the decision to stop.
- **Use subagents only for bounded tasks that protect the main context** — full node dumps, computed-style listings, screenshot sweeps, repo-wide searches. Delegation buys context cleanliness and permission narrowing; it is never justified by speed alone.
- **Read-only inspection may use a lighter subagent.**
- **Mechanical, frozen-plan corrections may use a lighter writer** — but only after Main Claude has frozen the exact target and outcome.
- **Substantial visual, architectural, or ambiguous implementation work uses the strongest suitable agent.**
- **One writer at a time.** Never concurrent writers. Parallelism is for genuinely independent read-only work.
- **Main Claude reviews every returned result** against rendered or executed evidence before the next stage begins. A subagent's own claim of success is not evidence.
- **No Terra dependency.** The previous Sol/Terra orchestration model no longer applies. Nothing in the next phase requires it.

---

## 4. Ready-to-paste prompt for the next session

> Read `HANDOFF.md` at the repository root completely before doing anything else. Then run a **read-only** audit of this repository — do not modify, create, or delete any file in this session.
>
> Inspect, in this order: current Git state (`git status`, current branch, recent history); the governing product and specification files (`FITWAY_PRODUCT.md`, `SPEC.md`, `DESIGN_GUIDE.md`, `PHASES.md`, `RESEARCH.md`, `AGENTS.md`) and the ADRs under `docs/adr/`; and the design and asset directories (`docs/archive/visual/`, `design-research/`, `visual-direction-gate/`, `brand/`).
>
> Produce a grounded plan covering: which design/specification files are current, stale, duplicated, or superseded; which old design assets and Paper exports should be removed or replaced; how each governing doc should be updated to reflect the four approved Paper productions (`OWNER DAILY ANALYTICS`, `STAFF MONITORING`, `LOGIN`, and `PUBLIC CROWD BOARD` — each `PRODUCTION SET — CURRENT`); what implementation work remains per family; and which existing repository behavior must be preserved. Base every claim on a file you actually read — do not infer a file's state from its name or from this handoff.
>
> Use bounded subagents only where they keep verbose output out of the main context, one writer at a time, and review every returned result yourself. Present the plan and **stop for حسين's review. Change nothing until he approves.**
