import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
const receiptSchema = JSON.parse(
	readFileSync(
		new URL(
			"../docs/schemas/history-transition-receipt.schema.json",
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
const validateReceipt = ajv.compile(receiptSchema);

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

function activeMilestone(overrides: Record<string, unknown> = {}) {
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
					milestones: { "active-frontier": activeMilestone(packetFields) },
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
							"active-frontier": activeMilestone({ ...packetFields, ...entry }),
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
					milestones: {
						"active-frontier": withoutStopReason(activeMilestone()),
					},
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
		const declaring = activeMilestone({ historyMutations: [declaration] });
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
							"active-frontier": activeMilestone({ historyMutations: [entry] }),
						},
					}),
				),
			).toBe(false);
		}
	});

	it("allows an empty active v2 state while requiring strict open milestone metadata", () => {
		expect(validateState(activeState({ milestones: {} }))).toBe(true);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": {
							...(activeState().milestones as Record<string, unknown>)[
								"active-frontier"
							],
							status: "DONE",
						},
					},
				}),
			),
		).toBe(false);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": activeMilestone({ ownerSession: null }),
					},
				}),
			),
		).toBe(false);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": activeMilestone({
							ownerSession: "owner session prose",
						}),
					},
				}),
			),
		).toBe(false);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": {
							...(activeState().milestones as Record<string, unknown>)[
								"active-frontier"
							],
							objective: undefined,
						},
					},
				}),
			),
		).toBe(false);
		expect(
			validateState(
				activeState({
					milestones: {
						"active-frontier": {
							...(activeState().milestones as Record<string, unknown>)[
								"active-frontier"
							],
							ownerSession: "x".repeat(129),
						},
					},
				}),
			),
		).toBe(false);
	});

	it("keeps the history schema permissive for terminal narratives and accepts the v2 receipt forms", () => {
		const historical = historyState({
			milestones: {
				"closed-record": milestone({
					ownerSession: "historical narrative ".repeat(40),
					status: "DONE",
				}),
			},
		});
		expect(validateHistory(historical)).toBe(true);

		const genesis = {
			schemaVersion: 2,
			kind: "history-genesis-receipt",
			recordedAt: UPDATED_AT,
			historyPath: "PROJECT_STATE_HISTORY.yaml",
			historySha256: "a".repeat(64),
			milestoneCount: 1,
			historyByteLength: 100,
			recordDigestMap: { "closed-record": "b".repeat(64) },
			activeMilestoneDigests: { "active-frontier": "c".repeat(64) },
			legacyCheckpoint: {
				receiptPath: "docs/phase-records/handoffs/coordinator/r08.json",
				receiptSha256: "d".repeat(64),
				afterHistorySha256: "a".repeat(64),
				afterHistoryBytes: 100,
			},
		};
		const transition = {
			schemaVersion: 2,
			kind: "history-transition-receipt",
			recordedAt: UPDATED_AT,
			previousReceiptSha256: "c".repeat(64),
			beforeHistorySha256: "a".repeat(64),
			afterHistorySha256: "d".repeat(64),
			beforeHistoryBytes: 100,
			afterHistoryBytes: 200,
			beforeMilestoneCount: 1,
			afterMilestoneCount: 2,
			addedTerminal: {
				milestoneId: "closed-next",
				status: "DONE",
				digest: "e".repeat(64),
			},
			closedPacketSha256: "f".repeat(64),
			removedActiveMilestoneId: "active-frontier",
			removedActiveMilestoneDigest: "1".repeat(64),
			coordinatorRun: "m4-v2-test",
		};
		expect(validateReceipt(genesis)).toBe(true);
		expect(
			validateReceipt({
				...genesis,
				historyPath: undefined,
			}),
		).toBe(false);
		expect(
			validateReceipt({
				...genesis,
				activeMilestoneDigests: undefined,
			}),
		).toBe(false);
		expect(
			validateReceipt({ ...genesis, historyPath: "wrong-history.yaml" }),
		).toBe(false);
		expect(validateReceipt(transition)).toBe(true);
		expect(
			validateReceipt({ ...transition, previousReceiptSha256: null }),
		).toBe(false);
		expect(
			validateReceipt({
				schemaVersion: 1,
				kind: "history-genesis-receipt",
				recordedAt: UPDATED_AT,
				historySha256: "a".repeat(64),
				milestoneCount: 1,
				recordDigestMap: { "closed-record": "b".repeat(64) },
			}),
		).toBe(true);
		expect(
			validateReceipt({
				...Object.fromEntries(
					Object.entries(transition).filter(
						([key]) =>
							key !== "beforeHistoryBytes" && key !== "afterHistoryBytes",
					),
				),
				schemaVersion: 1,
				previousReceiptSha256: null,
			}),
		).toBe(true);
	});
});

describe("checker CLI diagnostic output", () => {
	const root = fileURLToPath(new URL("../", import.meta.url));
	for (const script of ["check-agent-context.mjs", "verify-repository.mjs"]) {
		it(`${script} summarizes admitted exceptions by default and lists them with --verbose`, () => {
			const invoke = (args: string[]) => {
				const result = spawnSync(
					process.execPath,
					[fileURLToPath(new URL(script, import.meta.url)), ...args],
					{
						cwd: root,
						encoding: "utf8",
						windowsHide: true,
					},
				);
				expect(result.status, result.stdout + result.stderr).toBe(0);
				return result.stdout + result.stderr;
			};
			const quiet = invoke([]);
			const verbose = invoke(["--verbose"]);
			const count =
				verbose.match(
					/historical pointer exception admitted(?::| for untracked target:| without tracking classification:)/g,
				)?.length ?? 0;
			expect(count).toBeGreaterThan(0);
			expect(
				quiet.match(/Historical pointer exceptions admitted:/g),
			).toHaveLength(1);
			expect(quiet).toContain(
				`Historical pointer exceptions admitted: ${count} (use --verbose to list).`,
			);
			expect(quiet).not.toContain("historical pointer exception admitted:");
			expect(quiet).not.toContain(
				"historical pointer exception admitted for untracked target:",
			);
			expect(verbose).toContain(
				`Historical pointer exceptions admitted: ${count}.`,
			);
		});
	}
});
