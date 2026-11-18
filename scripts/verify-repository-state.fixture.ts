// Build ledger milestones and active and history states for the repository-check tests.
import { LEDGER_UPDATED_AT as UPDATED_AT } from "./verify-repository-ledger.fixture.ts";

const INTEGRATED_COMMIT = "4df79885ef7e039dcf2d27eb87cf41f8c78b73e2";

export function milestone(overrides: Record<string, unknown> = {}) {
	return {
		status: "DONE",
		dependencies: [],
		ownerSession: null,
		branch: null,
		worktree: null,
		baseCommit: null,
		ownedPaths: [],
		forbiddenPaths: [],
		sharedLeases: [],
		validationRepairAttempts: 0,
		handoff: null,
		stopReason: null,
		gates: {
			unit: "PASS",
			integration: "NOT_REQUIRED",
			browser: "PASS",
			accessibility: "PASS",
			visual: "PASS",
			independentReview: "PASS",
		},
		integratedCommit: INTEGRATED_COMMIT,
		...overrides,
	};
}

export function activeMilestone(overrides: Record<string, unknown> = {}) {
	return milestone({
		status: "IN_PROGRESS",
		objective: "Validate the active migration frontier",
		taskClass: "repository-infrastructure",
		taskPacket: "docs/phase-records/task-packets/active-frontier.yaml",
		taskPacketSha256: "a".repeat(64),
		ownerSession: "coordinator-session",
		...overrides,
	});
}

export function historyState(overrides: Record<string, unknown> = {}) {
	return {
		schemaVersion: 1,
		updatedAt: UPDATED_AT,
		milestones: { "closed-record": milestone() },
		...overrides,
	};
}

export function activeState(overrides: Record<string, unknown> = {}) {
	return {
		schemaVersion: 2,
		updatedAt: UPDATED_AT,
		coordinator: {
			owner: "coordinator",
			stateFilePolicy: "coordinator-only",
		},
		baseline: {
			status: "DONE",
			branch: "main",
			integratedCommit: INTEGRATED_COMMIT,
			preservation: {
				mainCandidate: {
					branch: "preserve/main",
					commit: "b3a1d09217196d9c8f22b7f7f556a24ff722588f",
				},
				approvedVisualLab: {
					branch: "preserve/visual",
					commit: "40c4abd1c8aaa4806662af44c0036f9a93bcc8be",
				},
			},
			visualManifest: "visual-direction-gate/approved/APPROVAL_MANIFEST.yaml",
			validationRecord: null,
			independentVerification: null,
		},
		milestones: {
			"active-frontier": activeMilestone(),
		},
		...overrides,
	};
}
