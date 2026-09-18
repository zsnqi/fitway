import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import {
	ARCHIVE_TERMINAL_OPERATION,
	canonicalMilestoneDigest,
	HISTORY_PATH,
	HISTORY_TRANSITION_RECEIPT_KIND,
	HISTORY_TRANSITION_RECEIPT_SCHEMA_VERSION,
	parseHistory,
	sha256,
	TRANSITION_ANCHOR_PATH,
	TRANSITION_ANCHOR_SHA256,
	verifyHistoryTransition,
} from "./project-state-history-transition.mjs";

const REAL_ROOT = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);

const FIXTURE_DIR = "fixture-transition";
const ANCHOR_PATH = `${FIXTURE_DIR}/pre-transition-anchor.json`;
const COMPANION_PATH = `${ANCHOR_PATH}.sha256`;
const FROZEN_COPY_PATH = `${FIXTURE_DIR}/pre-transition-history.yaml`;
const RECEIPT_PATH = `${FIXTURE_DIR}/transition-receipt.json`;
const OLD_ALPHA = "fixture-archived-alpha";
const OLD_BETA = "fixture-archived-beta";
const TARGET = "fixture-archived-gamma";
const SUCCESSOR = "fixture-active-successor";
const OTHER_ACTIVE = "fixture-active-other";
const BEFORE_UPDATED_AT = "2026-09-10T10:00:00+03:00";
const AFTER_UPDATED_AT = "2026-09-16T12:30:00+03:00";
const RECEIPT_RECORDED_AT = "2026-09-16T12:30:00.000Z";
const FUTURE_TIMESTAMP = "2099-01-01T00:00:00.000Z";
const R03_DIGEST =
	"32d46316ee0d4aaddb95ea3e838f12ce0dad9783775ae3a248ddad3db5798c2f";

type JsonObject = { [key: string]: unknown };

interface Fixture {
	root: string;
	anchor: JsonObject;
	state: JsonObject;
	history: JsonObject;
	beforeBytes: Buffer;
	anchorSha256: string;
	receipt: JsonObject;
}

interface WriteOptions {
	anchor?: JsonObject;
	state?: JsonObject;
	history?: JsonObject;
	historyText?: string;
	receipt?: JsonObject;
	includeCompanion?: boolean;
	appendAnchorBytes?: string;
	omitReceipt?: boolean;
}

interface WrittenDocuments {
	state: JsonObject;
	history: JsonObject;
	anchorSha256: string;
	receipt: JsonObject | null;
}

interface TransitionResult {
	anchorSha256: string;
	beforeCount: number;
	afterCount: number;
	addedIds: string[];
	removedIds: string[];
	modifiedIds: string[];
	declaredTargets: string[];
	receiptPath: string | null;
	receiptPaths: string[];
}

const fixtureRoots: string[] = [];

afterEach(() => {
	for (const root of fixtureRoots.splice(0)) {
		rmSync(root, { recursive: true, force: true, maxRetries: 3 });
	}
});

function writeFixtureFile(
	root: string,
	relativePath: string,
	content: string | Buffer,
): void {
	const absolute = path.resolve(root, relativePath);
	mkdirSync(path.dirname(absolute), { recursive: true });
	writeFileSync(absolute, content);
}

function milestone(overrides: JsonObject = {}): JsonObject {
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
		lastHeartbeatAt: null,
		leaseExpiresAt: null,
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
		integratedCommit: "4df79885ef7e039dcf2d27eb87cf41f8c78b73e2",
		...overrides,
	};
}

function failedRecord(): JsonObject {
	return milestone({
		status: "FAILED_VALIDATION",
		stopReason: "fixture fourth-audit rejection",
		gates: {
			unit: "PASS",
			integration: "NOT_REQUIRED",
			browser: "NOT_REQUIRED",
			accessibility: "NOT_REQUIRED",
			visual: "NOT_REQUIRED",
			independentReview: "FAIL",
		},
		integratedCommit: null,
	});
}

interface ReceiptInputs {
	anchor: JsonObject;
	anchorSha256: string;
	historyBytes: Buffer;
	history: JsonObject;
	state: JsonObject;
}

function buildReceipt({
	anchor,
	anchorSha256,
	historyBytes,
	history,
	state,
}: ReceiptInputs): JsonObject {
	const anchorHistory = anchor.history as JsonObject;
	const anchorIds = new Set(
		Object.keys(anchorHistory.milestoneDigests as JsonObject),
	);
	const addedMilestoneIds = Object.keys(
		history.milestones as JsonObject,
	).filter((id) => !anchorIds.has(id));
	const stateMilestones = state.milestones as JsonObject;
	let successorMilestoneId = SUCCESSOR;
	for (const record of Object.values(stateMilestones)) {
		const mutations = (record as JsonObject).historyMutations;
		if (Array.isArray(mutations) && mutations.length > 0) {
			successorMilestoneId = (mutations[0] as JsonObject)
				.successorMilestoneId as string;
			break;
		}
	}
	return {
		schemaVersion: HISTORY_TRANSITION_RECEIPT_SCHEMA_VERSION,
		kind: HISTORY_TRANSITION_RECEIPT_KIND,
		recordedAt: RECEIPT_RECORDED_AT,
		predecessorAnchor: {
			path: ANCHOR_PATH,
			sha256: anchorSha256,
			companionPath: COMPANION_PATH,
		},
		before: {
			path: anchorHistory.path,
			bytes: anchorHistory.bytes,
			sha256: anchorHistory.sha256,
			milestoneCount: anchorHistory.milestoneCount,
		},
		after: {
			path: HISTORY_PATH,
			bytes: historyBytes.byteLength,
			sha256: sha256(historyBytes),
			milestoneCount: Object.keys(history.milestones as JsonObject).length,
		},
		addedMilestoneIds,
		modifiedPreExistingIds: [],
		deletedPreExistingIds: [],
		openStatusArchived: false,
		successorMilestoneId,
		limitation:
			"fixture: untracked, co-mutable receipt; proves the forward transition from the recorded fixture anchor only",
	};
}

function buildDocuments(): {
	anchor: JsonObject;
	state: JsonObject;
	history: JsonObject;
	beforeBytes: Buffer;
} {
	const beforeMilestones: JsonObject = {
		[OLD_ALPHA]: milestone(),
		[OLD_BETA]: failedRecord(),
	};
	const beforeBytes = Buffer.from(
		stringifyYaml({
			schemaVersion: 1,
			updatedAt: BEFORE_UPDATED_AT,
			milestones: beforeMilestones,
		}),
		"utf8",
	);
	const historyMilestones: JsonObject = {
		...beforeMilestones,
		[TARGET]: failedRecord(),
	};
	const anchor: JsonObject = {
		purpose: "fixture pre-transition anchor",
		trustBoundary: "fixture: repository-internal, co-mutable evidence",
		recordedAt: "2026-09-16T12:00:00.000Z",
		head: "1a24a973570371949008a7a5f037c47b818c0e01",
		history: {
			path: HISTORY_PATH,
			frozenCopyPath: FROZEN_COPY_PATH,
			bytes: beforeBytes.byteLength,
			sha256: sha256(beforeBytes),
			milestoneCount: Object.keys(beforeMilestones).length,
			milestoneDigests: Object.fromEntries(
				Object.entries(beforeMilestones).map(([id, record]) => [
					id,
					canonicalMilestoneDigest(record),
				]),
			),
		},
	};
	const state: JsonObject = {
		schemaVersion: 1,
		updatedAt: AFTER_UPDATED_AT,
		milestones: {
			[SUCCESSOR]: milestone({
				status: "IN_PROGRESS",
				ownedPaths: [
					"fixture descriptive entry naming PROJECT_STATE_HISTORY.yaml inside prose",
					HISTORY_PATH,
				],
				handoff: `${FIXTURE_DIR}/handoff.md`,
				historyMutations: [
					{
						operation: ARCHIVE_TERMINAL_OPERATION,
						targetMilestoneId: TARGET,
						targetStatus: "FAILED_VALIDATION",
						targetCanonicalSha256: canonicalMilestoneDigest(
							historyMilestones[TARGET],
						),
						receipt: RECEIPT_PATH,
						successorMilestoneId: SUCCESSOR,
					},
				],
			}),
		},
	};
	const history: JsonObject = {
		schemaVersion: 1,
		updatedAt: AFTER_UPDATED_AT,
		milestones: historyMilestones,
	};
	return { anchor, state, history, beforeBytes };
}

function writeFixture(
	fixture: Fixture,
	options: WriteOptions = {},
): WrittenDocuments {
	const anchor = options.anchor ?? fixture.anchor;
	const state = options.state ?? fixture.state;
	const history =
		options.history ??
		(options.historyText !== undefined
			? parseHistory(options.historyText)
			: fixture.history);
	const historyBytes =
		options.historyText !== undefined
			? Buffer.from(options.historyText, "utf8")
			: Buffer.from(stringifyYaml(history), "utf8");
	let anchorBytes = Buffer.from(
		`${JSON.stringify(anchor, null, "\t")}\n`,
		"utf8",
	);
	if (options.appendAnchorBytes !== undefined) {
		anchorBytes = Buffer.concat([
			anchorBytes,
			Buffer.from(options.appendAnchorBytes, "utf8"),
		]);
	}
	const anchorSha256 = sha256(anchorBytes);
	writeFixtureFile(fixture.root, ANCHOR_PATH, anchorBytes);
	if (options.includeCompanion === false) {
		rmSync(path.resolve(fixture.root, COMPANION_PATH), { force: true });
	} else {
		writeFixtureFile(
			fixture.root,
			COMPANION_PATH,
			`${anchorSha256}  ${path.posix.basename(ANCHOR_PATH)}\n`,
		);
	}
	writeFixtureFile(fixture.root, HISTORY_PATH, historyBytes);
	writeFixtureFile(fixture.root, FROZEN_COPY_PATH, fixture.beforeBytes);
	const receipt =
		options.omitReceipt === true
			? null
			: (options.receipt ??
				buildReceipt({ anchor, anchorSha256, historyBytes, history, state }));
	if (receipt === null) {
		rmSync(path.resolve(fixture.root, RECEIPT_PATH), { force: true });
	} else {
		writeFixtureFile(
			fixture.root,
			RECEIPT_PATH,
			`${JSON.stringify(receipt, null, "\t")}\n`,
		);
	}
	return { state, history, anchorSha256, receipt };
}

function createFixture(): Fixture {
	const root = mkdtempSync(path.join(tmpdir(), "fitway-history-transition-"));
	fixtureRoots.push(root);
	const documents = buildDocuments();
	const fixture: Fixture = {
		root,
		anchorSha256: "",
		receipt: {},
		...documents,
	};
	writeFixture(fixture);
	fixture.anchorSha256 = sha256(readFileSync(path.resolve(root, ANCHOR_PATH)));
	fixture.receipt = JSON.parse(
		readFileSync(path.resolve(root, RECEIPT_PATH), "utf8"),
	) as JsonObject;
	return fixture;
}

async function runTransition(
	fixture: Fixture,
	writeOptions: WriteOptions = {},
	verifyOptions: JsonObject = {},
): Promise<TransitionResult> {
	const written = writeFixture(fixture, writeOptions);
	return verifyHistoryTransition({
		root: fixture.root,
		state: written.state,
		history: written.history,
		anchorPath: ANCHOR_PATH,
		anchorSha256: fixture.anchorSha256,
		...verifyOptions,
	}) as Promise<TransitionResult>;
}

async function captureTransitionFailure(
	fixture: Fixture,
	writeOptions: WriteOptions = {},
	verifyOptions: JsonObject = {},
): Promise<string> {
	let message = "";
	let failed = false;
	try {
		await runTransition(fixture, writeOptions, verifyOptions);
	} catch (error) {
		failed = true;
		message = error instanceof Error ? error.message : String(error);
	}
	if (!failed) {
		throw new Error("Expected history transition verification to fail");
	}
	return message;
}

function reformatHistory(history: JsonObject): string {
	const milestones = history.milestones as JsonObject;
	const reorderedMilestones: JsonObject = {};
	for (const id of Object.keys(milestones).reverse()) {
		const record = milestones[id] as JsonObject;
		const reorderedRecord: JsonObject = {};
		for (const key of Object.keys(record).reverse()) {
			reorderedRecord[key] = record[key];
		}
		reorderedMilestones[id] = reorderedRecord;
	}
	return stringifyYaml(
		{
			milestones: reorderedMilestones,
			updatedAt: history.updatedAt,
			schemaVersion: history.schemaVersion,
		},
		{ indent: 4, lineWidth: 120 },
	);
}

describe("real repository transition evidence", () => {
	it("reproduces every frozen anchor digest and the r03 terminal digest", () => {
		const anchor = JSON.parse(
			readFileSync(path.resolve(REAL_ROOT, TRANSITION_ANCHOR_PATH), "utf8"),
		) as JsonObject;
		const history = parseHistory(
			readFileSync(path.resolve(REAL_ROOT, HISTORY_PATH)),
		) as JsonObject;
		const digests = (anchor.history as JsonObject).milestoneDigests as Record<
			string,
			string
		>;
		const historyMilestones = history.milestones as Record<string, JsonObject>;
		const ids = Object.keys(digests);
		expect(ids.length).toBe(99);
		for (const id of ids) {
			expect(canonicalMilestoneDigest(historyMilestones[id])).toBe(digests[id]);
		}
		const state = parseYaml(
			readFileSync(path.resolve(REAL_ROOT, "PROJECT_STATE.yaml"), "utf8"),
		) as JsonObject;
		const r03 =
			(state.milestones as Record<string, JsonObject>)[
				"design-environment-audit-remediation-r03"
			] ?? historyMilestones["design-environment-audit-remediation-r03"];
		expect(canonicalMilestoneDigest(r03)).toBe(R03_DIGEST);
	});

	it("holds for the real state and history before and after the phase3-clock-flush transition that archived r08", async () => {
		const result = (await verifyHistoryTransition({
			root: REAL_ROOT,
		})) as TransitionResult;
		expect(TRANSITION_ANCHOR_SHA256).toBe(
			"c77ecd3c933c2c51128ef74de703357e7619264c0334557c3f9e13dacc3d3869",
		);
		expect(result.anchorSha256).toBe(TRANSITION_ANCHOR_SHA256);
		expect(result.beforeCount).toBe(99);
		expect(result.removedIds).toEqual([]);
		expect(result.modifiedIds).toEqual([]);
		expect(result.afterCount).toBe(result.beforeCount + result.addedIds.length);
		expect(result.addedIds).toEqual([
			"design-environment-audit-remediation-r08",
		]);
		expect(result.declaredTargets).toEqual(result.addedIds);
		if (result.addedIds.length > 0) {
			expect(result.receiptPath).not.toBeNull();
		} else {
			expect(result.receiptPath).toBeNull();
		}
	});
});

describe("history transition acceptance", () => {
	it("passes for old history plus one declared terminal record with a valid receipt", async () => {
		const fixture = createFixture();
		const result = await runTransition(fixture);
		expect(result.anchorSha256).toBe(fixture.anchorSha256);
		expect(result.beforeCount).toBe(2);
		expect(result.afterCount).toBe(3);
		expect(result.addedIds).toEqual([TARGET]);
		expect(result.removedIds).toEqual([]);
		expect(result.modifiedIds).toEqual([]);
		expect(result.declaredTargets).toEqual([TARGET]);
		expect(result.receiptPath).toBe(RECEIPT_PATH);
		expect(result.receiptPaths).toEqual([RECEIPT_PATH]);
	});

	it("passes when only YAML formatting and key order change", async () => {
		const fixture = createFixture();
		const defaultBytes = readFileSync(path.resolve(fixture.root, HISTORY_PATH));
		const historyText = reformatHistory(fixture.history);
		expect(Buffer.from(historyText, "utf8").equals(defaultBytes)).toBe(false);
		const result = await runTransition(fixture, { historyText });
		expect(result.addedIds).toEqual([TARGET]);
		expect(result.afterCount).toBe(3);
		expect(result.removedIds).toEqual([]);
		expect(result.modifiedIds).toEqual([]);
	});
});

describe("pre-existing record protection", () => {
	it("fails and names the mutated milestone when an anchored record changes", async () => {
		const fixture = createFixture();
		const history = structuredClone(fixture.history);
		const record = (history.milestones as JsonObject)[OLD_ALPHA] as JsonObject;
		record.ownerSession = "fixture mutation of an anchored record";
		const message = await captureTransitionFailure(fixture, { history });
		expect(message).toMatch(
			/Pre-existing anchored milestone\(s\) changed canonical digest/,
		);
		expect(message).toContain(OLD_ALPHA);
	});

	it("fails when an anchored milestone is deleted or renamed", async () => {
		const fixture = createFixture();
		const deleted = structuredClone(fixture.history);
		delete (deleted.milestones as JsonObject)[OLD_ALPHA];
		const deletedMessage = await captureTransitionFailure(fixture, {
			history: deleted,
		});
		expect(deletedMessage).toMatch(/missing from the candidate history/);
		expect(deletedMessage).toContain(OLD_ALPHA);

		const renamed = structuredClone(fixture.history);
		const renamedMilestones = renamed.milestones as JsonObject;
		renamedMilestones[`${OLD_BETA}-renamed`] = renamedMilestones[OLD_BETA];
		delete renamedMilestones[OLD_BETA];
		const renamedMessage = await captureTransitionFailure(fixture, {
			history: renamed,
		});
		expect(renamedMessage).toMatch(/missing from the candidate history/);
		expect(renamedMessage).toContain(OLD_BETA);
	});
});

describe("append-only additions", () => {
	it("fails when an open-status milestone is added to history", async () => {
		const fixture = createFixture();
		const history = structuredClone(fixture.history);
		(history.milestones as JsonObject)["fixture-archived-open"] = milestone({
			status: "IN_PROGRESS",
		});
		const message = await captureTransitionFailure(fixture, { history });
		expect(message).toMatch(/may only receive terminal records/);
		expect(message).toContain("fixture-archived-open");
	});

	it("fails when an unlisted terminal milestone is added", async () => {
		const fixture = createFixture();
		const history = structuredClone(fixture.history);
		(history.milestones as JsonObject)["fixture-archived-unlisted"] =
			failedRecord();
		const message = await captureTransitionFailure(fixture, { history });
		expect(message).toMatch(
			/do not exactly equal the declared historyMutations targets/,
		);
		expect(message).toContain("fixture-archived-unlisted");
		expect(message).toContain(TARGET);
	});

	it("fails when two active milestones declare the same target", async () => {
		const fixture = createFixture();
		const state = structuredClone(fixture.state);
		const stateMilestones = state.milestones as JsonObject;
		const successorRecord = stateMilestones[SUCCESSOR] as JsonObject;
		const declaration = structuredClone(
			(successorRecord.historyMutations as JsonObject[])[0],
		);
		stateMilestones[OTHER_ACTIVE] = milestone({
			status: "IN_PROGRESS",
			ownedPaths: [HISTORY_PATH],
			historyMutations: [
				{ ...declaration, successorMilestoneId: OTHER_ACTIVE },
			],
		});
		const message = await captureTransitionFailure(fixture, { state });
		expect(message).toMatch(/declare fixture-archived-gamma more than once/);
	});

	it("fails when an added history record reuses an active milestone id", async () => {
		const fixture = createFixture();
		const history = structuredClone(fixture.history);
		const state = structuredClone(fixture.state);
		delete (history.milestones as JsonObject)[TARGET];
		(history.milestones as JsonObject)[SUCCESSOR] = failedRecord();
		const successorRecord = (state.milestones as JsonObject)[
			SUCCESSOR
		] as JsonObject;
		const declaration = (successorRecord.historyMutations as JsonObject[])[0];
		declaration.targetMilestoneId = SUCCESSOR;
		declaration.targetCanonicalSha256 = canonicalMilestoneDigest(
			failedRecord(),
		);
		const message = await captureTransitionFailure(fixture, {
			history,
			state,
		});
		expect(message).toMatch(/active\/history union is not unique/);
		expect(message).toContain(SUCCESSOR);
	});
});

describe("history ownership", () => {
	it("fails when a declaring milestone omits the exact history owned path", async () => {
		const fixture = createFixture();
		const state = structuredClone(fixture.state);
		const successorRecord = (state.milestones as JsonObject)[
			SUCCESSOR
		] as JsonObject;
		successorRecord.ownedPaths = (
			successorRecord.ownedPaths as string[]
		).filter((entry) => entry !== HISTORY_PATH);
		const message = await captureTransitionFailure(fixture, { state });
		expect(message).toMatch(
			/ownedPaths do not include the exact standalone entry PROJECT_STATE_HISTORY\.yaml/,
		);
		expect(message).toContain(SUCCESSOR);
	});

	it("accepts an empty historyMutations array without an ownership entry", async () => {
		const fixture = createFixture();
		const state = structuredClone(fixture.state);
		const successorRecord = (state.milestones as JsonObject)[
			SUCCESSOR
		] as JsonObject;
		successorRecord.historyMutations = [];
		successorRecord.ownedPaths = [
			"fixture descriptive entry naming PROJECT_STATE_HISTORY.yaml inside prose",
		];
		const history = structuredClone(fixture.history);
		delete (history.milestones as JsonObject)[TARGET];
		const result = await runTransition(fixture, { state, history });
		expect(result.addedIds).toEqual([]);
		expect(result.declaredTargets).toEqual([]);
	});
});

describe("declared target integrity", () => {
	it("fails when the declared target is marked NEEDS_HUMAN or DONE after the declaration", async () => {
		const fixture = createFixture();
		const needsHuman = structuredClone(fixture.history);
		((needsHuman.milestones as JsonObject)[TARGET] as JsonObject).status =
			"NEEDS_HUMAN";
		const needsHumanMessage = await captureTransitionFailure(fixture, {
			history: needsHuman,
		});
		expect(needsHumanMessage).toMatch(
			/has status "NEEDS_HUMAN", but its historyMutations declaration pins "FAILED_VALIDATION"/,
		);

		const done = structuredClone(fixture.history);
		((done.milestones as JsonObject)[TARGET] as JsonObject).status = "DONE";
		const doneMessage = await captureTransitionFailure(fixture, {
			history: done,
		});
		expect(doneMessage).toMatch(
			/has status "DONE", but its historyMutations declaration pins/,
		);
	});

	it("fails when the declared target's content is rewritten after the declaration", async () => {
		const fixture = createFixture();
		const history = structuredClone(fixture.history);
		((history.milestones as JsonObject)[TARGET] as JsonObject).stopReason =
			"rewritten after the declaration";
		const message = await captureTransitionFailure(fixture, { history });
		expect(message).toMatch(
			/canonical digest .* does not match the declared targetCanonicalSha256/,
		);
		expect(message).toContain(TARGET);
	});
});

describe("receipt integrity", () => {
	it("fails on wrong added ids, wrong after hash, wrong before hash, missing receipt, and a future recordedAt", async () => {
		const fixture = createFixture();

		const wrongAdded = structuredClone(fixture.receipt);
		wrongAdded.addedMilestoneIds = ["fixture-other"];
		const wrongAddedMessage = await captureTransitionFailure(fixture, {
			receipt: wrongAdded,
		});
		expect(wrongAddedMessage).toMatch(/addedMilestoneIds/);

		const wrongAfter = structuredClone(fixture.receipt);
		(wrongAfter.after as JsonObject).sha256 = "0".repeat(64);
		const wrongAfterMessage = await captureTransitionFailure(fixture, {
			receipt: wrongAfter,
		});
		expect(wrongAfterMessage).toMatch(/after\.sha256/);

		const wrongBefore = structuredClone(fixture.receipt);
		(wrongBefore.before as JsonObject).sha256 = "0".repeat(64);
		const wrongBeforeMessage = await captureTransitionFailure(fixture, {
			receipt: wrongBefore,
		});
		expect(wrongBeforeMessage).toMatch(/before\.sha256/);

		const missingMessage = await captureTransitionFailure(fixture, {
			omitReceipt: true,
		});
		expect(missingMessage).toMatch(
			/Transition receipt for fixture-archived-gamma is missing/,
		);

		const future = structuredClone(fixture.receipt);
		future.recordedAt = FUTURE_TIMESTAMP;
		const futureMessage = await captureTransitionFailure(fixture, {
			receipt: future,
		});
		expect(futureMessage).toMatch(/recordedAt is in the future/);
	});
});

describe("anchor integrity", () => {
	it("fails on a pinned-digest mismatch, missing companion, or edited anchor bytes", async () => {
		const fixture = createFixture();

		const mismatchMessage = await captureTransitionFailure(
			fixture,
			{},
			{ anchorSha256: "0".repeat(64) },
		);
		expect(mismatchMessage).toMatch(
			/does not SHA-256 to the source-owned pinned digest/,
		);

		const companionMessage = await captureTransitionFailure(fixture, {
			includeCompanion: false,
		});
		expect(companionMessage).toMatch(/companion is missing/);

		const editedMessage = await captureTransitionFailure(fixture, {
			appendAnchorBytes: "\n",
		});
		expect(editedMessage).toMatch(
			/does not SHA-256 to the source-owned pinned digest/,
		);
	});

	it("fails when the anchor's declared milestone count contradicts its digest map", async () => {
		const fixture = createFixture();
		const anchor = structuredClone(fixture.anchor);
		(anchor.history as JsonObject).milestoneCount = 3;
		const written = writeFixture(fixture, { anchor });
		let message = "";
		let failed = false;
		try {
			await verifyHistoryTransition({
				root: fixture.root,
				state: written.state,
				history: written.history,
				anchorPath: ANCHOR_PATH,
				anchorSha256: written.anchorSha256,
			});
		} catch (error) {
			failed = true;
			message = error instanceof Error ? error.message : String(error);
		}
		expect(failed).toBe(true);
		expect(message).toMatch(
			/milestoneCount is 3, but milestoneDigests has 2 entries/,
		);
	});
});
