export const LEDGER_UPDATED_AT = "2026-09-15T14:35:00+03:00";

export const LEASE_GATES = {
	unit: "PASS",
	integration: "PASS",
	browser: "PASS",
	accessibility: "PASS",
	visual: "PASS",
	independentReview: "PASS",
} as const;

export function ledgerWithLease(leaseExpiresAt: string) {
	const baseline = {
		status: "DONE",
		dependencies: [],
		stopReason: null,
		integratedCommit: "abc1234",
		gates: { ...LEASE_GATES },
	};
	const milestone = {
		status: "IN_PROGRESS",
		dependencies: [],
		stopReason: null,
		ownerSession: "claude-code-desktop:test",
		branch: "lease-fixture",
		worktree: "D:/fixture",
		baseCommit: "abc1234",
		lastHeartbeatAt: LEDGER_UPDATED_AT,
		leaseExpiresAt,
		handoff: "docs/fixture.md",
		ownedPaths: ["docs/fixture/**"],
		sharedLeases: [] as string[],
		gates: { ...LEASE_GATES, unit: "PENDING" },
		integratedCommit: null as string | null,
	};
	const state = {
		updatedAt: LEDGER_UPDATED_AT,
		baseline: {
			status: "DONE",
			integratedCommit: "abc1234",
			validationRecord: "docs/validation.md",
			independentVerification: "docs/verification.md",
		},
		milestones: { "lease-fixture": milestone },
	};
	return {
		state,
		milestones: {
			"baseline-reconciliation-gate": baseline,
			"lease-fixture": milestone,
		},
	};
}
