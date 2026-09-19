import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

const stateSchema = JSON.parse(
	readFileSync(
		new URL("../docs/schemas/project-state.schema.json", import.meta.url),
		"utf8",
	),
);
const historySchema = JSON.parse(
	readFileSync(
		new URL(
			"../docs/schemas/project-state-history.schema.json",
			import.meta.url,
		),
		"utf8",
	),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(stateSchema);
const validateState = ajv.compile(stateSchema);
const validateHistory = ajv.compile(historySchema);

const INTEGRATED_COMMIT = "4df79885ef7e039dcf2d27eb87cf41f8c78b73e2";
const UPDATED_AT = "2026-09-15T14:35:00+03:00";

function milestone(overrides: Record<string, unknown> = {}) {
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

function historyState(overrides: Record<string, unknown> = {}) {
	return {
		schemaVersion: 1,
		updatedAt: UPDATED_AT,
		milestones: { "closed-record": milestone() },
		...overrides,
	};
}

function activeState(overrides: Record<string, unknown> = {}) {
	return {
		schemaVersion: 1,
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
		milestones: { "active-frontier": milestone() },
		...overrides,
	};
}

function withoutStopReason(record: Record<string, unknown>) {
	return Object.fromEntries(
		Object.entries(record).filter(([key]) => key !== "stopReason"),
	);
}

describe("project-state schemas", () => {
	it("accepts a valid active-shaped document and rejects it in the history schema", () => {
		expect(validateState(activeState())).toBe(true);
		expect(validateHistory(activeState())).toBe(false);
	});

	it("accepts a valid history-shaped document and rejects it in the active schema", () => {
		expect(validateHistory(historyState())).toBe(true);
		expect(validateState(historyState())).toBe(false);
	});

	it("rejects a history-shaped document carrying coordinator or baseline", () => {
		const active = activeState();
		expect(
			validateHistory(historyState({ coordinator: active.coordinator })),
		).toBe(false);
		expect(validateHistory(historyState({ baseline: active.baseline }))).toBe(
			false,
		);
	});

	it("rejects unknown root keys in each shape", () => {
		expect(validateHistory(historyState({ archiveIndex: "legacy" }))).toBe(
			false,
		);
		expect(validateState(activeState({ archiveIndex: "legacy" }))).toBe(false);
	});

	it("accepts optional schema-version 1 packet fields and rejects malformed or unknown fields", () => {
		const packetFields = {
			taskClass: "backend-api-data",
			taskPacket: "docs/phase-records/task-packets/example-task.yaml",
			taskPacketSha256: "a".repeat(64),
		};
		expect(
			validateState(
				activeState({
					milestones: { "active-frontier": milestone(packetFields) },
				}),
			),
		).toBe(true);
		expect(
			validateHistory(
				historyState({
					milestones: { "closed-record": milestone(packetFields) },
				}),
			),
		).toBe(true);

		const malformed = [
			{ taskClass: "unknown-class" },
			{ taskPacket: "docs/phase-records/task-packets/Example-task.yaml" },
			{ taskPacket: "docs/phase-records/task-packets/example-task.json" },
			{ taskPacket: "docs/phase-records/task-packets/../escape.yaml" },
			{ taskPacketSha256: "A".repeat(64) },
			{ taskPacketSha256: "short" },
			{ taskPacketSha256: null },
			{ packetStatus: "READY" },
		];
		for (const entry of malformed) {
			expect(
				validateState(
					activeState({
						milestones: {
							"active-frontier": milestone({ ...packetFields, ...entry }),
						},
					}),
				),
			).toBe(false);
		}
	});

	it("rejects a milestone missing a required field in both shapes", () => {
		expect(
			validateState(
				activeState({
					milestones: { "active-frontier": withoutStopReason(milestone()) },
				}),
			),
		).toBe(false);
		expect(
			validateHistory(
				historyState({
					milestones: { "closed-record": withoutStopReason(milestone()) },
				}),
			),
		).toBe(false);
	});

	it("accepts an open status in history because that is a code rule", () => {
		expect(
			validateHistory(
				historyState({
					milestones: {
						"reopened-record": milestone({ status: "IN_PROGRESS" }),
					},
				}),
			),
		).toBe(true);
	});

	it("accepts an optional archive-terminal historyMutations declaration and rejects malformed entries", () => {
		const declaration = {
			operation: "archive-terminal",
			targetMilestoneId: "closed-record",
			targetStatus: "FAILED_VALIDATION",
			targetCanonicalSha256: "a".repeat(64),
			receipt: "docs/phase-records/handoffs/coordinator/receipt.json",
			successorMilestoneId: "active-frontier",
		};
		const declaring = milestone({ historyMutations: [declaration] });
		expect(
			validateState(
				activeState({ milestones: { "active-frontier": declaring } }),
			),
		).toBe(true);
		expect(
			validateHistory(
				historyState({ milestones: { "closed-record": declaring } }),
			),
		).toBe(true);

		const malformed = [
			{ ...declaration, operation: "delete-terminal" },
			{ ...declaration, targetStatus: "IN_PROGRESS" },
			{ ...declaration, targetCanonicalSha256: "A".repeat(64) },
			{ ...declaration, receipt: "" },
			{ ...declaration, successorMilestoneId: "" },
			{ ...declaration, unknownField: "unexpected" },
		];
		for (const entry of malformed) {
			expect(
				validateState(
					activeState({
						milestones: {
							"active-frontier": milestone({ historyMutations: [entry] }),
						},
					}),
				),
			).toBe(false);
		}
	});
});
