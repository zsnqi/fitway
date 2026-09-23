# Owner redesign — next-session handoff (planning only)

> Historical planning context. The r03 directions produced from this handoff were all rejected on 2026-09-23. Its sequence below does not assign a future task, model, agent, direction count, or visual style.

The user explicitly reserved the next Owner design exploration for a **new session**. This handoff records where to resume; it does not activate a milestone, accept a concept, or authorize production/canonical promotion. `PROJECT_STATE.yaml` currently has no active milestone. The next coordinator should create a new scoped `visual-authority-change` packet and READY ledger entry before directing any concept writer, then run `pnpm context:show` and the FITWAY design-context check.

## Human brief

Read `design-research/owner-composition-exploration-r03/OWNER_REDESIGN_BRIEF.md` in full. The current running Owner UI's dark FITWAY colors and glass atmosphere are a positive style reference, but its layout, ordering, hierarchy, icon styles/colors, component forms, chart reading, and almost absent-feeling animation are all open to substantial redesign. Do not give the agents a conservative polish task or copy the rejected r02 candidates. Each direction needs a distinct spatial and interaction thesis within recognizably the same visual character. The eventual chosen direction extends across shared navigation, Daily, Reports, Access, Activity Log, Operations, and Settings; the early comparison comes first. The user set no general cap on future idea count.

## Current evidence and limitations

- All four r02 directions were explicitly rejected. The rejection diagnosis is `docs/phase-records/handoffs/owner-design-exploration/20260923-010426-owner-design-exploration-r02-human-rejection.md`. None is selected or a future visual reference.
- The coordinator personally inspected fresh authenticated synthetic-demo EN/AR 1440×900 desktop and 390×844 mobile frames for all six Owner destinations, and full-page mobile for Daily, Reports, Activity Log, and Settings. Those PNGs are under ignored `.local/demo/owner-inspection/` in the current worktree; they are **not durable across worktrees** and are diagnostic only. Regenerate from `docs/desktop-demo.md` when needed. Do not put demo credentials in tracked records.
- The source route is `apps/web/src/components/owner/owner-section-switch.tsx` with section views under the same directory. The new session should recheck the running interaction and animation directly; screenshot evidence alone cannot settle motion quality.
- The stale Owner Daily CSS statement in `docs/design/VISUAL_AUTHORITY_STATUS.md` was corrected in commit `78c624d`. No production Owner UI was changed.

## Completed prerequisite repair

Independent policy work updated `AGENTS.md` and `docs/WORKFLOW.md` in integrated commit `6341093`: separate worktrees with disjoint owned paths, exclusive shared-file leases, isolated resources, one writer per worktree, and serialized integration permit genuinely independent concurrent writers; terminal outcomes go directly from active state to append-only history with a receipt. A fresh independent reviewer passed it. The policy milestone is archived `DONE` in `PROJECT_STATE_HISTORY.yaml` with receipt `docs/phase-records/history-transitions/0009-20260923-repository-policy-alignment-r01-done.json`. The user additionally requested correction of the old status blurbs in `PHASES.md` and `SPEC.md`, committed as `e8fd813`.

## Next session sequence

1. Start from current Git state and the brief above; create the scoped READY task packet/ledger entry. Resolve its ordered authorities and exact visual envelope. Keep this handoff as context, not authority.
2. Inspect the repository and environment with whatever available tool or agent is appropriate. The primary agent coordinates, assigns bounded ownership if needed, and judges rendered evidence itself. Independent writers use separate worktrees only when recorded ownership, leases, and resources are actually disjoint.
3. Make an early side-by-side, interactive taste gate: shared navigation, Daily opening/meaningful chart, and a dense governance page in EN/AR desktop/mobile, including purposeful motion and reduced-motion behavior. Ask the user to choose, revise, or reject before developing the complete seven-surface design.
4. After a human direction decision, complete the selected direction across all seven surfaces and key states, then run the packet's responsive, RTL/LTR, accessibility, data-truth, perceptual, and independent-review gates. Production and canonical promotion remain separate explicit human decisions.

The suggested request from this old plan is withdrawn. A future session should use the user's latest feedback and create its own brief without inheriting this plan's staffing or visual constraints.
