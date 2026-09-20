import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
	assertHistoryPrefixPreserved,
	canonicalMilestoneDigest,
	sha256,
	verifyHistoryTransition,
} from "./project-state-history-transition.mjs";

type JsonObject = Record<string, unknown>;

const HISTORY_PATH = "PROJECT_STATE_HISTORY.yaml";
const RECEIPT_DIR = "docs/phase-records/history-transitions";
const PACKET_PATH = "docs/phase-records/task-packets/active-frontier.yaml";
const BEFORE_UPDATED_AT = "2026-09-19T10:00:00.000Z";
const AFTER_UPDATED_AT = "2026-09-19T11:00:00.000Z";

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true, maxRetries: 3 });
});

function write(
	root: string,
	relativePath: string,
	value: string | Buffer,
): void {
	const absolute = path.resolve(root, relativePath);
	mkdirSync(path.dirname(absolute), { recursive: true });
	writeFileSync(absolute, value);
}

function object(value: unknown): JsonObject {
	if (value === null || typeof value !== "object" || Array.isArray(value))
		throw new TypeError("fixture value must be an object");
	return value as JsonObject;
}

function record(overrides: JsonObject = {}): JsonObject {
	return {
		status: "DONE",
		dependencies: [],
		ownerSession: "historical narrative that remains compatible",
		branch: null,
		worktree: null,
		baseCommit: null,
		ownedPaths: [],
		forbiddenPaths: [],
		sharedLeases: [],
		validationRepairAttempts: 0,
		lastHeartbeatAt: null,
		leaseExpiresAt: null,
		handoff: null,
		stopReason: null,
		gates: {
			unit: "PASS",
			integration: "NOT_REQUIRED",
			browser: "NOT_REQUIRED",
			accessibility: "NOT_REQUIRED",
			visual: "NOT_REQUIRED",
			independentReview: "PASS",
		},
		integratedCommit: "4df79885ef7e039dcf2d27eb87cf41f8c78b73e2",
		...overrides,
	};
}

function makeFixture() {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-history-v2-"));
	roots.push(root);
	const beforeMilestones = {
		baseline: record(),
	};
	const added = record({
		taskPacket: PACKET_PATH,
		taskPacketSha256: "0".repeat(64),
	});
	const beforeText = `schemaVersion: 1\nupdatedAt: ${BEFORE_UPDATED_AT}\nmilestones:\n  baseline:\n${yamlRecord(beforeMilestones.baseline)}\n`;
	const beforeBytes = Buffer.from(beforeText, "utf8");
	const beforeHistory = parseYaml(beforeText) as JsonObject;
	const packetText =
		"schemaVersion: 1\nmilestoneId: closed-next\ntaskClass: repository-infrastructure\npacketStatus: CLOSED\nstateRef: PROJECT_STATE.yaml#/milestones/closed-next\n";
	const packetBytes = Buffer.from(packetText, "utf8");
	const packetSha = sha256(packetBytes);
	(added as JsonObject).taskPacketSha256 = packetSha;
	const afterTextWithPacket = `${beforeText}  closed-next:\n${yamlRecord(added)}\n`;
	const finalAfterBytes = Buffer.from(afterTextWithPacket, "utf8");
	const finalAfterHistory = parseYaml(afterTextWithPacket) as JsonObject;
	const active = {
		schemaVersion: 2,
		updatedAt: AFTER_UPDATED_AT,
		coordinator: { owner: "coordinator", stateFilePolicy: "coordinator-only" },
		baseline: {
			status: "DONE",
			branch: "main",
			integratedCommit: "4df79885ef7e039dcf2d27eb87cf41f8c78b73e2",
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
			"closed-next": {
				status: "IN_PROGRESS",
				objective: "Close the active frontier through the v2 transition",
				taskClass: "repository-infrastructure",
				taskPacket: PACKET_PATH,
				taskPacketSha256: packetSha,
				dependencies: [],
				ownerSession: "m4-coordinator",
				branch: null,
				worktree: null,
				baseCommit: null,
				ownedPaths: [HISTORY_PATH],
				forbiddenPaths: [],
				sharedLeases: [],
				validationRepairAttempts: 0,
				lastHeartbeatAt: null,
				leaseExpiresAt: null,
				handoff: PACKET_PATH,
				stopReason: null,
				gates: {
					unit: "PASS",
					integration: "NOT_REQUIRED",
					browser: "NOT_REQUIRED",
					accessibility: "NOT_REQUIRED",
					visual: "NOT_REQUIRED",
					independentReview: "PASS",
				},
				integratedCommit: null,
			},
		},
	};
	const legacyCheckpointReceipt = {
		schemaVersion: 1,
		kind: "history-transition-receipt",
		recordedAt: BEFORE_UPDATED_AT,
		after: {
			path: HISTORY_PATH,
			bytes: beforeBytes.byteLength,
			sha256: sha256(beforeBytes),
			milestoneCount: 1,
		},
	};
	const legacyCheckpointBytes = Buffer.from(
		`${JSON.stringify(legacyCheckpointReceipt, null, 2)}\n`,
		"utf8",
	);
	const genesis = {
		schemaVersion: 2,
		kind: "history-genesis-receipt",
		recordedAt: BEFORE_UPDATED_AT,
		historyPath: HISTORY_PATH,
		historySha256: sha256(beforeBytes),
		milestoneCount: 1,
		historyByteLength: beforeBytes.byteLength,
		recordDigestMap: {
			baseline: canonicalMilestoneDigest(
				object(object(beforeHistory).milestones).baseline,
			),
		},
		activeMilestoneDigests: {
			"closed-next": canonicalMilestoneDigest(active.milestones["closed-next"]),
		},
		legacyCheckpoint: {
			receiptPath: "legacy-r08.json",
			receiptSha256: sha256(legacyCheckpointBytes),
			afterHistorySha256: sha256(beforeBytes),
			afterHistoryBytes: beforeBytes.byteLength,
		},
	};
	const genesisBytes = Buffer.from(
		`${JSON.stringify(genesis, null, 2)}\n`,
		"utf8",
	);
	const transition = {
		schemaVersion: 2,
		kind: "history-transition-receipt",
		recordedAt: AFTER_UPDATED_AT,
		previousReceiptSha256: sha256(genesisBytes),
		beforeHistorySha256: sha256(beforeBytes),
		afterHistorySha256: sha256(finalAfterBytes),
		addedTerminal: {
			milestoneId: "closed-next",
			status: "DONE",
			digest: canonicalMilestoneDigest(
				finalAfterHistory.milestones["closed-next"],
			),
		},
		closedPacketSha256: packetSha,
		removedActiveMilestoneId: "closed-next",
		removedActiveMilestoneDigest: canonicalMilestoneDigest(
			active.milestones["closed-next"],
		),
		beforeHistoryBytes: beforeBytes.byteLength,
		afterHistoryBytes: finalAfterBytes.byteLength,
		beforeMilestoneCount: 1,
		afterMilestoneCount: 2,
		coordinatorRun: "m4-v2-fixture",
	};
	write(root, HISTORY_PATH, finalAfterBytes);
	write(root, PACKET_PATH, packetBytes);
	write(root, "legacy-r08.json", legacyCheckpointBytes);
	write(root, `${RECEIPT_DIR}/0000-genesis.json`, genesisBytes);
	write(
		root,
		`${RECEIPT_DIR}/0001-transition.json`,
		`${JSON.stringify(transition, null, 2)}\n`,
	);
	return {
		root,
		added,
		beforeBytes,
		afterBytes: finalAfterBytes,
		beforeHistory,
		history: finalAfterHistory,
		state: active,
		genesis,
		transition,
		packetSha,
	};
}

function yamlRecord(value: JsonObject): string {
	return Object.entries(value)
		.map(([key, entry]) => {
			if (Array.isArray(entry) && entry.length === 0) return `    ${key}: []`;
			if (entry === null) return `    ${key}: null`;
			if (typeof entry === "object")
				return `    ${key}: ${JSON.stringify(entry)}`;
			return `    ${key}: ${JSON.stringify(entry)}`;
		})
		.join("\n");
}

function rewriteGenesisChain(fixture: ReturnType<typeof makeFixture>): void {
	const genesisBytes = Buffer.from(
		`${JSON.stringify(fixture.genesis, null, 2)}\n`,
		"utf8",
	);
	fixture.transition.previousReceiptSha256 = sha256(genesisBytes);
	write(fixture.root, `${RECEIPT_DIR}/0000-genesis.json`, genesisBytes);
	write(
		fixture.root,
		`${RECEIPT_DIR}/0001-transition.json`,
		`${JSON.stringify(fixture.transition, null, 2)}\n`,
	);
}

function rewriteClosedPacket(
	fixture: ReturnType<typeof makeFixture>,
	packetText: string,
): void {
	const packetBytes = Buffer.from(packetText, "utf8");
	const packetSha = sha256(packetBytes);
	fixture.packetSha = packetSha;
	fixture.added.taskPacketSha256 = packetSha;
	object(fixture.history.milestones)["closed-next"].taskPacketSha256 =
		packetSha;
	const afterText = `${fixture.beforeBytes.toString("utf8")}  closed-next:\n${yamlRecord(fixture.added)}\n`;
	fixture.afterBytes = Buffer.from(afterText, "utf8");
	fixture.history = parseYaml(afterText) as JsonObject;
	fixture.transition.afterHistorySha256 = sha256(fixture.afterBytes);
	fixture.transition.afterHistoryBytes = fixture.afterBytes.byteLength;
	fixture.transition.closedPacketSha256 = packetSha;
	fixture.transition.addedTerminal.digest = canonicalMilestoneDigest(
		object(fixture.history.milestones)["closed-next"],
	);
	write(fixture.root, HISTORY_PATH, fixture.afterBytes);
	write(fixture.root, PACKET_PATH, packetBytes);
	write(
		fixture.root,
		`${RECEIPT_DIR}/0001-transition.json`,
		`${JSON.stringify(fixture.transition, null, 2)}\n`,
	);
}

function writeState(
	fixture: ReturnType<typeof makeFixture>,
	state: JsonObject,
) {
	write(fixture.root, "PROJECT_STATE.yaml", JSON.stringify(state));
}

describe("history v2 transition tooling", () => {
	it("accepts a genesis plus chained transition and an empty active state", async () => {
		const fixture = makeFixture();
		const state = structuredClone(fixture.state) as JsonObject;
		state.milestones = {};
		writeState(fixture, state);
		const result = await verifyHistoryTransition({
			root: fixture.root,
			state,
			history: fixture.history,
		});
		expect(result.mode).toBe("v2");
		expect(result.addedIds).toEqual(["closed-next"]);
	});

	it("branches to v2 from the on-disk active state when state is omitted", async () => {
		const fixture = makeFixture();
		const state = structuredClone(fixture.state) as JsonObject;
		state.milestones = {};
		writeState(fixture, state);
		const result = await verifyHistoryTransition({
			root: fixture.root,
			history: fixture.history,
		});
		expect(result.mode).toBe("v2");
	});

	it("does not freeze a surviving active milestone when its continuity fields update", async () => {
		const fixture = makeFixture();
		const survivor = structuredClone(fixture.state.milestones["closed-next"]);
		fixture.genesis.activeMilestoneDigests.surviving =
			canonicalMilestoneDigest(survivor);
		rewriteGenesisChain(fixture);
		survivor.lastHeartbeatAt = "2026-09-19T12:00:00.000Z";
		survivor.handoff = "docs/phase-records/task-packets/active-frontier.yaml";
		survivor.taskPacket = PACKET_PATH;
		survivor.taskPacketSha256 = fixture.packetSha;
		const state = structuredClone(fixture.state);
		state.milestones = { surviving: survivor };
		const result = await verifyHistoryTransition({
			root: fixture.root,
			state,
			history: fixture.history,
		});
		expect(result.mode).toBe("v2");
	});

	it("rejects a genesis active milestone that neither survives nor closes", async () => {
		const fixture = makeFixture();
		fixture.genesis.activeMilestoneDigests["silently-dropped"] = "a".repeat(64);
		rewriteGenesisChain(fixture);
		await expect(
			verifyHistoryTransition({
				root: fixture.root,
				state: { ...fixture.state, milestones: {} },
				history: fixture.history,
			}),
		).rejects.toThrow(/must remain active or be removed exactly once/);
	});

	it("allows a post-genesis active addition to close through a later receipt", async () => {
		const fixture = makeFixture();
		const secondPacketPath =
			"docs/phase-records/task-packets/post-genesis.yaml";
		const secondPacketBytes = Buffer.from(
			"schemaVersion: 1\nmilestoneId: post-genesis\ntaskClass: repository-infrastructure\npacketStatus: CLOSED\nstateRef: PROJECT_STATE.yaml#/milestones/post-genesis\n",
			"utf8",
		);
		const secondRecord = record({
			taskPacket: secondPacketPath,
			taskPacketSha256: sha256(secondPacketBytes),
		});
		const afterText = `${fixture.afterBytes.toString("utf8")}  post-genesis:\n${yamlRecord(secondRecord)}\n`;
		const afterBytes = Buffer.from(afterText, "utf8");
		const history = structuredClone(fixture.history) as JsonObject;
		object(history.milestones)["post-genesis"] = secondRecord;
		const secondActiveCheckpoint = structuredClone(
			fixture.state.milestones["closed-next"],
		);
		secondActiveCheckpoint.objective = "Post-genesis active addition";
		const firstTransitionBytes = Buffer.from(
			`${JSON.stringify(fixture.transition, null, 2)}\n`,
			"utf8",
		);
		const secondTransition = {
			schemaVersion: 2,
			kind: "history-transition-receipt",
			recordedAt: AFTER_UPDATED_AT,
			previousReceiptSha256: sha256(firstTransitionBytes),
			beforeHistorySha256: sha256(fixture.afterBytes),
			afterHistorySha256: sha256(afterBytes),
			beforeHistoryBytes: fixture.afterBytes.byteLength,
			afterHistoryBytes: afterBytes.byteLength,
			beforeMilestoneCount: 2,
			afterMilestoneCount: 3,
			addedTerminal: {
				milestoneId: "post-genesis",
				status: "DONE",
				digest: canonicalMilestoneDigest(secondRecord),
			},
			closedPacketSha256: sha256(secondPacketBytes),
			removedActiveMilestoneId: "post-genesis",
			removedActiveMilestoneDigest: canonicalMilestoneDigest(
				secondActiveCheckpoint,
			),
			coordinatorRun: "m4-v2-post-genesis-fixture",
		};
		write(fixture.root, HISTORY_PATH, afterBytes);
		write(fixture.root, secondPacketPath, secondPacketBytes);
		write(
			fixture.root,
			`${RECEIPT_DIR}/0002-transition.json`,
			`${JSON.stringify(secondTransition, null, 2)}\n`,
		);
		const result = await verifyHistoryTransition({
			root: fixture.root,
			state: { ...fixture.state, milestones: {} },
			history,
		});
		expect(result.addedIds).toEqual(["closed-next", "post-genesis"]);
	});

	it("rejects active/history id collisions and missing dependencies", async () => {
		const fixture = makeFixture();
		const duplicate = structuredClone(fixture.state) as JsonObject;
		object(duplicate.milestones).baseline = object(duplicate.milestones)[
			"closed-next"
		];
		await expect(
			verifyHistoryTransition({
				root: fixture.root,
				state: duplicate,
				history: fixture.history,
			}),
		).rejects.toThrow(/active\/history union is not unique/);

		const missingDependency = structuredClone(fixture.history) as JsonObject;
		object(object(missingDependency).milestones)["closed-next"] = {
			...object(object(object(missingDependency).milestones)["closed-next"]),
			dependencies: ["missing"],
		};
		await expect(
			verifyHistoryTransition({
				root: fixture.root,
				state: { ...fixture.state, milestones: {} },
				history: missingDependency,
			}),
		).rejects.toThrow(/dependency does not exist/);
	});

	it("rejects broken receipt links, tampered history, and non-genesis chains", async () => {
		const fixture = makeFixture();
		const tampered = structuredClone(fixture.history) as JsonObject;
		object(object(tampered).milestones).baseline = {
			...object(object(object(tampered).milestones).baseline),
			ownerSession: "rewritten",
		};
		await expect(
			verifyHistoryTransition({
				root: fixture.root,
				state: { ...fixture.state, milestones: {} },
				history: tampered,
			}),
		).rejects.toThrow(/Pre-existing history record changed/);

		const broken = structuredClone(fixture.transition);
		broken.previousReceiptSha256 = "0".repeat(64);
		write(
			fixture.root,
			`${RECEIPT_DIR}/0001-transition.json`,
			`${JSON.stringify(broken)}\n`,
		);
		await expect(
			verifyHistoryTransition({
				root: fixture.root,
				state: { ...fixture.state, milestones: {} },
				history: fixture.history,
			}),
		).rejects.toThrow(/previousReceiptSha256/);
	});

	it("rejects an unrelated removed active milestone and a wrong legacy bridge", async () => {
		const fixture = makeFixture();
		const fabricated = structuredClone(fixture.transition);
		fabricated.removedActiveMilestoneId = "fabricated-active-id";
		write(
			fixture.root,
			`${RECEIPT_DIR}/0001-transition.json`,
			`${JSON.stringify(fabricated)}\n`,
		);
		await expect(
			verifyHistoryTransition({
				root: fixture.root,
				state: { ...fixture.state, milestones: {} },
				history: fixture.history,
			}),
		).rejects.toThrow(
			/removedActiveMilestoneId must equal addedTerminal.milestoneId/,
		);

		const wrongDigestFixture = makeFixture();
		const wrongDigest = structuredClone(wrongDigestFixture.transition);
		wrongDigest.removedActiveMilestoneDigest = "0".repeat(64);
		write(
			wrongDigestFixture.root,
			`${RECEIPT_DIR}/0001-transition.json`,
			`${JSON.stringify(wrongDigest)}\n`,
		);
		await expect(
			verifyHistoryTransition({
				root: wrongDigestFixture.root,
				state: { ...wrongDigestFixture.state, milestones: {} },
				history: wrongDigestFixture.history,
			}),
		).rejects.toThrow(/genesis-pinned active checkpoint/);

		const bridgeFixture = makeFixture();
		const wrongGenesis = structuredClone(bridgeFixture.genesis);
		wrongGenesis.legacyCheckpoint.afterHistoryBytes -= 1;
		write(
			bridgeFixture.root,
			`${RECEIPT_DIR}/0000-genesis.json`,
			`${JSON.stringify(wrongGenesis)}\n`,
		);
		await expect(
			verifyHistoryTransition({
				root: bridgeFixture.root,
				state: { ...bridgeFixture.state, milestones: {} },
				history: bridgeFixture.history,
			}),
		).rejects.toThrow(/legacyCheckpoint/);
	});

	it("rejects malformed byte boundaries and milestone count claims", async () => {
		const countFixture = makeFixture();
		const countReceipt = structuredClone(countFixture.transition);
		countReceipt.beforeMilestoneCount = 0;
		write(
			countFixture.root,
			`${RECEIPT_DIR}/0001-transition.json`,
			`${JSON.stringify(countReceipt)}\n`,
		);
		await expect(
			verifyHistoryTransition({
				root: countFixture.root,
				state: { ...countFixture.state, milestones: {} },
				history: countFixture.history,
			}),
		).rejects.toThrow(/beforeMilestoneCount/);

		const boundaryFixture = makeFixture();
		const boundaryReceipt = structuredClone(boundaryFixture.transition);
		const midRecordBytes = boundaryFixture.beforeBytes.byteLength + 1;
		boundaryReceipt.afterHistoryBytes = midRecordBytes;
		boundaryReceipt.afterHistorySha256 = sha256(
			boundaryFixture.afterBytes.subarray(0, midRecordBytes),
		);
		write(
			boundaryFixture.root,
			`${RECEIPT_DIR}/0001-transition.json`,
			`${JSON.stringify(boundaryReceipt)}\n`,
		);
		await expect(
			verifyHistoryTransition({
				root: boundaryFixture.root,
				state: { ...boundaryFixture.state, milestones: {} },
				history: boundaryFixture.history,
			}),
		).rejects.toThrow(/afterMilestoneCount|append exactly one/);
	});

	it("rejects future-dated v2 genesis and transition receipts", async () => {
		const genesisFixture = makeFixture();
		genesisFixture.genesis.recordedAt = "2999-01-01T00:00:00.000Z";
		rewriteGenesisChain(genesisFixture);
		await expect(
			verifyHistoryTransition({
				root: genesisFixture.root,
				state: { ...genesisFixture.state, milestones: {} },
				history: genesisFixture.history,
			}),
		).rejects.toThrow(/recordedAt is in the future/);

		const transitionFixture = makeFixture();
		transitionFixture.transition.recordedAt = "2999-01-01T00:00:00.000Z";
		write(
			transitionFixture.root,
			`${RECEIPT_DIR}/0001-transition.json`,
			`${JSON.stringify(transitionFixture.transition)}\n`,
		);
		await expect(
			verifyHistoryTransition({
				root: transitionFixture.root,
				state: { ...transitionFixture.state, milestones: {} },
				history: transitionFixture.history,
			}),
		).rejects.toThrow(/recordedAt is in the future/);
	});

	it("rejects a packet with wrong status, identity, state reference, or hash", async () => {
		const packetVariants = [
			{
				packetStatus: "OPEN",
				milestoneId: "closed-next",
				stateRef: "PROJECT_STATE.yaml#/milestones/closed-next",
				pattern: /packetStatus CLOSED/,
			},
			{
				packetStatus: "CLOSED",
				milestoneId: "wrong-id",
				stateRef: "PROJECT_STATE.yaml#/milestones/wrong-id",
				pattern: /milestoneId does not match/,
			},
			{
				packetStatus: "CLOSED",
				milestoneId: "closed-next",
				stateRef: "PROJECT_STATE.yaml#/milestones/wrong-id",
				pattern: /stateRef does not match/,
			},
		];
		for (const variant of packetVariants) {
			const fixture = makeFixture();
			rewriteClosedPacket(
				fixture,
				`${[
					"schemaVersion: 1",
					`milestoneId: ${variant.milestoneId}`,
					"taskClass: repository-infrastructure",
					`packetStatus: ${variant.packetStatus}`,
					`stateRef: ${variant.stateRef}`,
				].join("\n")}\n`,
			);
			await expect(
				verifyHistoryTransition({
					root: fixture.root,
					state: { ...fixture.state, milestones: {} },
					history: fixture.history,
				}),
			).rejects.toThrow(variant.pattern);
		}

		const hashFixture = makeFixture();
		hashFixture.transition.closedPacketSha256 = "0".repeat(64);
		write(
			hashFixture.root,
			`${RECEIPT_DIR}/0001-transition.json`,
			`${JSON.stringify(hashFixture.transition)}\n`,
		);
		await expect(
			verifyHistoryTransition({
				root: hashFixture.root,
				state: { ...hashFixture.state, milestones: {} },
				history: hashFixture.history,
			}),
		).rejects.toThrow(/taskPacketSha256 does not match closedPacketSha256/);
	});

	it("keeps an archived legacy declaration valid after the v2 append", async () => {
		const fixture = makeFixture();
		const anchorPath = "legacy-anchor.json";
		const anchor = {
			history: {
				path: HISTORY_PATH,
				bytes: fixture.beforeBytes.byteLength,
				sha256: sha256(fixture.beforeBytes),
				milestoneCount: 1,
				milestoneDigests: {
					baseline: canonicalMilestoneDigest(
						object(object(fixture.beforeHistory).milestones).baseline,
					),
				},
				frozenCopyPath: "legacy-anchor-history.yaml",
			},
		};
		const anchorBytes = Buffer.from(
			`${JSON.stringify(anchor, null, 2)}\n`,
			"utf8",
		);
		const anchorSha = sha256(anchorBytes);
		write(fixture.root, anchorPath, anchorBytes);
		write(
			fixture.root,
			`${anchorPath}.sha256`,
			`${anchorSha}  ${anchorPath}\n`,
		);
		write(fixture.root, "legacy-anchor-history.yaml", fixture.beforeBytes);
		const declaration = {
			operation: "archive-terminal",
			targetMilestoneId: "closed-next",
			targetStatus: "DONE",
			targetCanonicalSha256: fixture.transition.addedTerminal.digest,
			receipt: "legacy-declaration.json",
			successorMilestoneId: "successor",
		};
		const legacyReceipt = {
			schemaVersion: 1,
			kind: "history-transition-receipt",
			recordedAt: AFTER_UPDATED_AT,
			predecessorAnchor: {
				path: anchorPath,
				sha256: anchorSha,
				companionPath: `${anchorPath}.sha256`,
			},
			before: {
				path: HISTORY_PATH,
				bytes: fixture.beforeBytes.byteLength,
				sha256: sha256(fixture.beforeBytes),
				milestoneCount: 1,
			},
			after: {
				path: HISTORY_PATH,
				bytes: fixture.afterBytes.byteLength,
				sha256: sha256(fixture.afterBytes),
				milestoneCount: 2,
			},
			addedMilestoneIds: ["closed-next"],
			modifiedPreExistingIds: [],
			deletedPreExistingIds: [],
			openStatusArchived: false,
			successorMilestoneId: "successor",
			limitation: "fixture compatibility receipt",
		};
		write(
			fixture.root,
			"legacy-declaration.json",
			`${JSON.stringify(legacyReceipt)}\n`,
		);
		const state = structuredClone(fixture.state) as JsonObject;
		state.milestones = {
			successor: {
				...object(fixture.state.milestones)["closed-next"],
				historyMutations: [declaration],
			},
		};
		const result = await verifyHistoryTransition({
			root: fixture.root,
			state,
			history: fixture.history,
		});
		expect(result.legacyReceiptPaths).toEqual(["legacy-declaration.json"]);
		const conflictingState = structuredClone(state) as JsonObject;
		conflictingState.milestones.successor2 = {
			...object(state.milestones).successor,
			historyMutations: [
				{
					...declaration,
					targetStatus: "BLOCKED",
					successorMilestoneId: "successor2",
				},
			],
		};
		await expect(
			verifyHistoryTransition({
				root: fixture.root,
				state: conflictingState,
				history: fixture.history,
			}),
		).rejects.toThrow(/target status does not match history/);
	});

	it("fails closed for missing or malformed legacy declaration receipts", async () => {
		const cases = [
			{ name: "missing", content: null, pattern: /is missing/ },
			{
				name: "malformed",
				content: "not-json",
				pattern: /not valid JSON/,
			},
			{
				name: "non-v1",
				content: JSON.stringify({
					schemaVersion: 2,
					kind: "history-transition-receipt",
				}),
				pattern: /must use schemaVersion 1/,
			},
			{
				name: "no-anchor",
				content: JSON.stringify({
					schemaVersion: 1,
					kind: "history-transition-receipt",
				}),
				pattern: /missing its predecessor anchor/,
			},
		];
		for (const entry of cases) {
			const fixture = makeFixture();
			const receiptPath = `legacy-${entry.name}.json`;
			if (entry.content !== null)
				write(fixture.root, receiptPath, entry.content);
			const state = structuredClone(fixture.state) as JsonObject;
			state.milestones = {
				successor: {
					...object(fixture.state.milestones)["closed-next"],
					historyMutations: [
						{
							operation: "archive-terminal",
							targetMilestoneId: "closed-next",
							targetStatus: "DONE",
							targetCanonicalSha256: fixture.transition.addedTerminal.digest,
							receipt: receiptPath,
							successorMilestoneId: "successor",
						},
					],
				},
			};
			await expect(
				verifyHistoryTransition({
					root: fixture.root,
					state,
					history: fixture.history,
				}),
			).rejects.toThrow(entry.pattern);
		}
	});

	it("proves raw history bytes are an unchanged prefix before one append", () => {
		const fixture = makeFixture();
		expect(() =>
			assertHistoryPrefixPreserved(fixture.beforeBytes, fixture.afterBytes),
		).not.toThrow();
		const mutated = Buffer.from(fixture.afterBytes);
		mutated[mutated.indexOf(0x62)] = 0x63;
		expect(() =>
			assertHistoryPrefixPreserved(fixture.beforeBytes, mutated),
		).toThrow(/prefix/);
	});
});
