// phase3-clock-flush history-transition evidence for the append-only closed ledger.
//
// `PROJECT_STATE_HISTORY.yaml` holds terminal milestone evidence that is
// append-only, coordinator-owned, and never rewritten. This module proves the
// forward archive transition against a frozen pre-transition anchor whose path
// and SHA-256 are pinned below as source literals:
//
//   * every milestone id recorded in the anchor must still be present in the
//     live candidate history with an equal canonical digest (recursively
//     key-sorted JSON, SHA-256, arrays keep their order);
//   * only explicitly declared terminal milestones may be added, each through
//     an active `archive-terminal` declaration that pins the archived record's
//     terminal status and canonical digest;
//   * every declaration must reference a transition receipt, whose before/after
//     byte facts are independently recomputed here instead of trusted.
//
// The anchor is repository-internal, co-mutable evidence. It proves the forward
// transition from the recorded pre-transition bytes only: it cannot prove
// anything about history bytes before that capture and it is not an external
// signature.
// Receipt timestamps are observed metadata with a sanity future bound only and
// never enter a proof statement.
//
// The check is read-only; it never writes to the repository.

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parse as parseYaml } from "yaml";

export const HISTORY_PATH = "PROJECT_STATE_HISTORY.yaml";
export const STATE_PATH = "PROJECT_STATE.yaml";
export const TRANSITION_ANCHOR_PATH =
	"docs/phase-records/handoffs/coordinator/20260918-185500-phase3-clock-flush-test-reliability-r01-pre-transition-anchor.json";
export const TRANSITION_ANCHOR_SHA256 =
	"c77ecd3c933c2c51128ef74de703357e7619264c0334557c3f9e13dacc3d3869";
export const ARCHIVE_TERMINAL_OPERATION = "archive-terminal";
export const HISTORY_TRANSITION_RECEIPT_KIND = "history-transition-receipt";
export const HISTORY_TRANSITION_RECEIPT_SCHEMA_VERSION = 1;
export const TERMINAL_HISTORY_STATUSES = Object.freeze([
	"DONE",
	"BLOCKED",
	"NEEDS_HUMAN",
	"FAILED_VALIDATION",
]);

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const ISO_8601_PATTERN =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const HISTORY_MUTATION_KEYS = Object.freeze([
	"operation",
	"targetMilestoneId",
	"targetStatus",
	"targetCanonicalSha256",
	"receipt",
	"successorMilestoneId",
]);

function fail(message) {
	throw new Error(message);
}

export function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertNonEmptyString(value, label) {
	if (typeof value !== "string" || value.trim().length === 0) {
		fail(`${label} must be a non-empty string`);
	}
}

function assertObservedTimestamp(value, label, nowMs) {
	assertNonEmptyString(value, label);
	if (!ISO_8601_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
		fail(`${label} is not a parseable ISO-8601 timestamp`);
	}
	if (Date.parse(value) > nowMs) {
		fail(
			`${label} is in the future; local timestamps are sanity-bounded observed metadata, not evidence of capture time`,
		);
	}
}

function resolveWithinRoot(root, relativePath, label) {
	if (typeof relativePath !== "string" || relativePath.length === 0) {
		fail(`${label} path must be a non-empty string`);
	}
	const absolute = path.resolve(root, relativePath);
	const relative = path.relative(root, absolute);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		fail(`${label} path escapes the repository: ${relativePath}`);
	}
	return absolute;
}

async function readBytesOrFail(root, relativePath, label) {
	try {
		return await readFile(resolveWithinRoot(root, relativePath, label));
	} catch (error) {
		if (error?.code === "ENOENT") {
			fail(`${label} is missing: ${relativePath}`);
		}
		throw error;
	}
}

function canonicalize(value) {
	if (Array.isArray(value)) return value.map(canonicalize);
	if (isPlainObject(value)) {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, canonicalize(value[key])]),
		);
	}
	return value;
}

export function canonicalMilestoneDigest(value) {
	return sha256(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));
}

export function parseHistory(source) {
	const text = typeof source === "string" ? source : source.toString("utf8");
	let parsed;
	try {
		parsed = parseYaml(text);
	} catch (error) {
		fail(`Candidate history is not valid YAML (${error.message})`);
	}
	if (!isPlainObject(parsed)) {
		fail("Candidate history must be a YAML object");
	}
	if (!isPlainObject(parsed.milestones)) {
		fail("Candidate history is missing the milestones map");
	}
	return parsed;
}

function parseActiveState(source) {
	const text = typeof source === "string" ? source : source.toString("utf8");
	let parsed;
	try {
		parsed = parseYaml(text);
	} catch (error) {
		fail(`Active state is not valid YAML (${error.message})`);
	}
	if (!isPlainObject(parsed) || !isPlainObject(parsed.milestones)) {
		fail("Active state must be an object with a milestones map");
	}
	return parsed;
}

export function assertHistoryMutationOwnership(state) {
	if (!isPlainObject(state) || !isPlainObject(state.milestones)) {
		fail("Active state must be an object with a milestones map");
	}
	for (const [id, milestone] of Object.entries(state.milestones)) {
		const mutations = milestone?.historyMutations;
		if (mutations === undefined) continue;
		if (!Array.isArray(mutations)) {
			fail(`${id} historyMutations must be an array`);
		}
		if (mutations.length === 0) continue;
		const ownedPaths = Array.isArray(milestone.ownedPaths)
			? milestone.ownedPaths
			: [];
		if (!ownedPaths.includes(HISTORY_PATH)) {
			fail(
				`${id} declares historyMutations but its ownedPaths do not include the exact standalone entry ${HISTORY_PATH}`,
			);
		}
	}
}

function assertHistoryMutationShape(entry, declaringId) {
	const label = `${declaringId} historyMutations entry`;
	if (!isPlainObject(entry)) {
		fail(`${label} must be an object`);
	}
	for (const key of Object.keys(entry)) {
		if (!HISTORY_MUTATION_KEYS.includes(key)) {
			fail(`${label} has an unknown key: ${key}`);
		}
	}
	if (entry.operation !== ARCHIVE_TERMINAL_OPERATION) {
		fail(`${label} operation must be "${ARCHIVE_TERMINAL_OPERATION}"`);
	}
	assertNonEmptyString(entry.targetMilestoneId, `${label} targetMilestoneId`);
	if (!TERMINAL_HISTORY_STATUSES.includes(entry.targetStatus)) {
		fail(
			`${label} targetStatus must be a terminal status (${TERMINAL_HISTORY_STATUSES.join(", ")})`,
		);
	}
	if (
		typeof entry.targetCanonicalSha256 !== "string" ||
		!SHA256_PATTERN.test(entry.targetCanonicalSha256)
	) {
		fail(
			`${label} targetCanonicalSha256 must be a lowercase 64-character SHA-256 digest`,
		);
	}
	assertNonEmptyString(entry.receipt, `${label} receipt`);
	assertNonEmptyString(
		entry.successorMilestoneId,
		`${label} successorMilestoneId`,
	);
	if (entry.successorMilestoneId !== declaringId) {
		fail(
			`${label} successorMilestoneId must equal the declaring milestone id ${declaringId}`,
		);
	}
}

function gatherDeclaredTargets(state) {
	const declarations = new Map();
	for (const [id, milestone] of Object.entries(state.milestones)) {
		const mutations = milestone?.historyMutations;
		if (mutations === undefined) continue;
		if (!Array.isArray(mutations)) {
			fail(`${id} historyMutations must be an array`);
		}
		if (mutations.length === 0) continue;
		for (const entry of mutations) {
			assertHistoryMutationShape(entry, id);
			const declared = declarations.get(entry.targetMilestoneId);
			if (declared) {
				fail(
					`historyMutations declare ${entry.targetMilestoneId} more than once: ${declared.declaringMilestoneId} and ${id}`,
				);
			}
			declarations.set(entry.targetMilestoneId, {
				...entry,
				declaringMilestoneId: id,
			});
		}
	}
	return declarations;
}

function assertAnchorStructure(anchor, anchorPath) {
	if (!isPlainObject(anchor)) {
		fail(`Transition anchor must be a JSON object: ${anchorPath}`);
	}
	const history = anchor.history;
	if (!isPlainObject(history)) {
		fail(`Transition anchor is missing the history object: ${anchorPath}`);
	}
	if (history.path !== HISTORY_PATH) {
		fail(
			`Transition anchor history.path is ${JSON.stringify(history.path)}, expected ${JSON.stringify(HISTORY_PATH)}`,
		);
	}
	if (!Number.isInteger(history.bytes) || history.bytes < 0) {
		fail("Transition anchor history.bytes must be a non-negative integer");
	}
	if (
		typeof history.sha256 !== "string" ||
		!SHA256_PATTERN.test(history.sha256)
	) {
		fail(
			"Transition anchor history.sha256 must be a lowercase 64-character SHA-256 digest",
		);
	}
	if (!Number.isInteger(history.milestoneCount) || history.milestoneCount < 0) {
		fail(
			"Transition anchor history.milestoneCount must be a non-negative integer",
		);
	}
	if (!isPlainObject(history.milestoneDigests)) {
		fail("Transition anchor history.milestoneDigests must be an object");
	}
	const ids = Object.keys(history.milestoneDigests);
	if (ids.length !== history.milestoneCount) {
		fail(
			`Transition anchor history.milestoneCount is ${history.milestoneCount}, but milestoneDigests has ${ids.length} entries`,
		);
	}
	for (const id of ids) {
		if (id.trim().length === 0) {
			fail(
				"Transition anchor history.milestoneDigests has an empty milestone id",
			);
		}
		const digest = history.milestoneDigests[id];
		if (typeof digest !== "string" || !SHA256_PATTERN.test(digest)) {
			fail(
				`Transition anchor history.milestoneDigests entry for ${id} is not a lowercase 64-character SHA-256 digest`,
			);
		}
	}
	if (history.frozenCopyPath !== undefined) {
		assertNonEmptyString(
			history.frozenCopyPath,
			"Transition anchor history.frozenCopyPath",
		);
	}
	return history;
}

async function readTransitionAnchor(root, anchorPath, anchorSha256) {
	const anchorBytes = await readBytesOrFail(
		root,
		anchorPath,
		"Transition anchor",
	);
	const computed = sha256(anchorBytes);
	if (computed !== anchorSha256) {
		fail(
			`Transition anchor ${anchorPath} does not SHA-256 to the source-owned pinned digest: pinned ${anchorSha256}, current ${computed}`,
		);
	}
	const companionBytes = await readBytesOrFail(
		root,
		`${anchorPath}.sha256`,
		"Transition anchor SHA-256 companion",
	);
	const match = /^([0-9a-fA-F]{64}) {2}/.exec(companionBytes.toString("utf8"));
	if (!match) {
		fail(
			`Transition anchor companion is not in sha256sum format: ${anchorPath}.sha256`,
		);
	}
	const companion = match[1].toLowerCase();
	if (companion !== computed) {
		fail(
			`Transition anchor .sha256 companion disagrees: file ${computed}, companion ${companion}`,
		);
	}
	let anchor;
	try {
		anchor = JSON.parse(anchorBytes.toString("utf8"));
	} catch (error) {
		fail(
			`Transition anchor is not valid JSON (${error.message}): ${anchorPath}`,
		);
	}
	return { anchor, anchorBytes };
}

async function assertFrozenCopy(root, history) {
	if (history.frozenCopyPath === undefined) return;
	const frozenBytes = await readBytesOrFail(
		root,
		history.frozenCopyPath,
		"Frozen pre-transition history copy",
	);
	if (frozenBytes.byteLength !== history.bytes) {
		fail(
			`Frozen pre-transition history copy byte count differs from the anchor's recorded history.bytes: ${history.frozenCopyPath}`,
		);
	}
	const frozenSha256 = sha256(frozenBytes);
	if (frozenSha256 !== history.sha256) {
		fail(
			`Frozen pre-transition history copy does not SHA-256 to the anchor's recorded history.sha256: ${history.frozenCopyPath}`,
		);
	}
}

function assertStringSetEqual(actual, expected, label) {
	if (
		!Array.isArray(actual) ||
		actual.some((entry) => typeof entry !== "string" || entry.length === 0)
	) {
		fail(`${label} must be an array of non-empty strings`);
	}
	const actualSorted = [...actual].sort();
	const expectedSorted = [...expected].sort();
	if (
		actualSorted.length !== expectedSorted.length ||
		actualSorted.some((entry, index) => entry !== expectedSorted[index])
	) {
		fail(
			`${label} [${actualSorted.join(", ") || "none"}] does not equal the independently computed set [${expectedSorted.join(", ") || "none"}]`,
		);
	}
}

function assertReceipt(receipt, context) {
	const {
		declaration,
		anchorPath,
		anchorSha256,
		anchorHistory,
		liveBytes,
		liveHistory,
		addedIds,
		removedIds,
		modifiedIds,
		nowMs,
	} = context;
	const label = `Transition receipt for ${declaration.targetMilestoneId}`;
	if (!isPlainObject(receipt)) {
		fail(`${label} must be a JSON object`);
	}
	if (receipt.schemaVersion !== HISTORY_TRANSITION_RECEIPT_SCHEMA_VERSION) {
		fail(
			`${label} schemaVersion must be ${HISTORY_TRANSITION_RECEIPT_SCHEMA_VERSION}`,
		);
	}
	if (receipt.kind !== HISTORY_TRANSITION_RECEIPT_KIND) {
		fail(`${label} kind must be "${HISTORY_TRANSITION_RECEIPT_KIND}"`);
	}
	assertObservedTimestamp(receipt.recordedAt, `${label} recordedAt`, nowMs);
	const predecessor = receipt.predecessorAnchor;
	if (!isPlainObject(predecessor)) {
		fail(`${label} is missing the predecessorAnchor object`);
	}
	if (predecessor.path !== anchorPath) {
		fail(
			`${label} predecessorAnchor.path is ${JSON.stringify(predecessor.path)}, expected ${JSON.stringify(anchorPath)}`,
		);
	}
	if (predecessor.sha256 !== anchorSha256) {
		fail(
			`${label} predecessorAnchor.sha256 is ${JSON.stringify(predecessor.sha256)}, expected the source-owned anchor digest ${anchorSha256}`,
		);
	}
	if (predecessor.companionPath !== `${anchorPath}.sha256`) {
		fail(
			`${label} predecessorAnchor.companionPath must be ${JSON.stringify(`${anchorPath}.sha256`)}`,
		);
	}
	const before = receipt.before;
	if (!isPlainObject(before)) {
		fail(`${label} is missing the before object`);
	}
	if (before.path !== anchorHistory.path) {
		fail(
			`${label} before.path must match the anchor's recorded history path ${JSON.stringify(anchorHistory.path)}`,
		);
	}
	if (before.bytes !== anchorHistory.bytes) {
		fail(
			`${label} before.bytes ${JSON.stringify(before.bytes)} does not match the anchor's recorded ${anchorHistory.bytes}`,
		);
	}
	if (before.sha256 !== anchorHistory.sha256) {
		fail(
			`${label} before.sha256 must match the anchor's recorded history.sha256 ${anchorHistory.sha256}`,
		);
	}
	if (
		before.milestoneCount !== undefined &&
		before.milestoneCount !== anchorHistory.milestoneCount
	) {
		fail(
			`${label} before.milestoneCount must match the anchor's recorded ${anchorHistory.milestoneCount}`,
		);
	}
	const after = receipt.after;
	if (!isPlainObject(after)) {
		fail(`${label} is missing the after object`);
	}
	if (after.path !== HISTORY_PATH) {
		fail(`${label} after.path must be ${JSON.stringify(HISTORY_PATH)}`);
	}
	if (after.bytes !== liveBytes.byteLength) {
		fail(
			`${label} after.bytes ${JSON.stringify(after.bytes)} does not match the live candidate history byte count ${liveBytes.byteLength}`,
		);
	}
	const liveSha256 = sha256(liveBytes);
	if (after.sha256 !== liveSha256) {
		fail(
			`${label} after.sha256 ${JSON.stringify(after.sha256)} does not match the live candidate history SHA-256 ${liveSha256}`,
		);
	}
	const liveCount = Object.keys(liveHistory.milestones).length;
	if (after.milestoneCount !== liveCount) {
		fail(
			`${label} after.milestoneCount ${JSON.stringify(after.milestoneCount)} does not match the live candidate history milestone count ${liveCount}`,
		);
	}
	assertStringSetEqual(
		receipt.addedMilestoneIds,
		addedIds,
		`${label} addedMilestoneIds`,
	);
	assertStringSetEqual(
		receipt.modifiedPreExistingIds,
		modifiedIds,
		`${label} modifiedPreExistingIds`,
	);
	assertStringSetEqual(
		receipt.deletedPreExistingIds,
		removedIds,
		`${label} deletedPreExistingIds`,
	);
	if (receipt.openStatusArchived !== false) {
		fail(`${label} openStatusArchived must be false`);
	}
	if (receipt.successorMilestoneId !== declaration.declaringMilestoneId) {
		fail(
			`${label} successorMilestoneId must equal the declaring milestone id ${declaration.declaringMilestoneId}`,
		);
	}
	assertNonEmptyString(receipt.limitation, `${label} limitation`);
}

export async function verifyHistoryTransition({
	root = process.cwd(),
	state,
	history,
	anchorPath = TRANSITION_ANCHOR_PATH,
	anchorSha256 = TRANSITION_ANCHOR_SHA256,
	nowMs = Date.now(),
} = {}) {
	assertNonEmptyString(anchorPath, "Transition anchor path");
	if (typeof anchorSha256 !== "string" || !SHA256_PATTERN.test(anchorSha256)) {
		fail(
			"Transition anchor digest must be a lowercase 64-character SHA-256 digest",
		);
	}
	const { anchor } = await readTransitionAnchor(root, anchorPath, anchorSha256);
	const anchorHistory = assertAnchorStructure(anchor, anchorPath);
	await assertFrozenCopy(root, anchorHistory);

	const liveBytes = await readBytesOrFail(
		root,
		HISTORY_PATH,
		"Candidate history",
	);
	const liveHistory = parseHistory(liveBytes);
	const liveIds = Object.keys(liveHistory.milestones).sort();
	const resolvedState =
		state === undefined
			? parseActiveState(
					await readBytesOrFail(root, STATE_PATH, "Active state ledger"),
				)
			: state;
	const resolvedHistory = history === undefined ? liveHistory : history;
	if (
		!isPlainObject(resolvedHistory) ||
		!isPlainObject(resolvedHistory.milestones)
	) {
		fail("Candidate history argument must be an object with a milestones map");
	}

	assertHistoryMutationOwnership(resolvedState);

	const candidateDigests = new Map(
		liveIds.map((id) => [
			id,
			canonicalMilestoneDigest(liveHistory.milestones[id]),
		]),
	);
	const argumentIds = Object.keys(resolvedHistory.milestones).sort();
	if (
		argumentIds.length !== liveIds.length ||
		argumentIds.some((id, index) => id !== liveIds[index])
	) {
		fail(
			"Candidate history argument does not match the live PROJECT_STATE_HISTORY.yaml milestone ids",
		);
	}
	for (const id of liveIds) {
		if (
			canonicalMilestoneDigest(resolvedHistory.milestones[id]) !==
			candidateDigests.get(id)
		) {
			fail(
				`Candidate history argument differs from the live PROJECT_STATE_HISTORY.yaml for ${id}`,
			);
		}
	}

	const anchorIds = Object.keys(anchorHistory.milestoneDigests);
	const anchorIdSet = new Set(anchorIds);
	const removedIds = [];
	const modifiedIds = [];
	for (const id of anchorIds) {
		if (!candidateDigests.has(id)) {
			removedIds.push(id);
			continue;
		}
		if (candidateDigests.get(id) !== anchorHistory.milestoneDigests[id]) {
			modifiedIds.push(id);
		}
	}
	if (removedIds.length > 0) {
		fail(
			`Pre-existing anchored milestone(s) missing from the candidate history: ${removedIds.join(", ")}`,
		);
	}
	if (modifiedIds.length > 0) {
		fail(
			`Pre-existing anchored milestone(s) changed canonical digest: ${modifiedIds.join(", ")}`,
		);
	}
	const addedIds = liveIds.filter((id) => !anchorIdSet.has(id));
	for (const id of addedIds) {
		if (Object.hasOwn(resolvedState.milestones, id)) {
			fail(
				`The active/history union is not unique: ${id} is present in both the active ledger and the candidate history`,
			);
		}
	}
	for (const id of addedIds) {
		const status = liveHistory.milestones[id]?.status;
		if (!TERMINAL_HISTORY_STATUSES.includes(status)) {
			fail(
				`PROJECT_STATE_HISTORY.yaml may only receive terminal records: the added milestone ${id} has status ${JSON.stringify(status)} (open status archived)`,
			);
		}
	}

	const declarations = gatherDeclaredTargets(resolvedState);
	const declaredTargets = [...declarations.keys()].sort();
	if (addedIds.join("\n") !== declaredTargets.join("\n")) {
		fail(
			`Added history milestones [${addedIds.join(", ") || "none"}] do not exactly equal the declared historyMutations targets [${declaredTargets.join(", ") || "none"}]`,
		);
	}

	for (const id of declaredTargets) {
		const declaration = declarations.get(id);
		const record = liveHistory.milestones[id];
		if (record.status !== declaration.targetStatus) {
			fail(
				`Archived milestone ${id} has status ${JSON.stringify(record.status)}, but its historyMutations declaration pins ${JSON.stringify(declaration.targetStatus)}`,
			);
		}
		const digest = candidateDigests.get(id);
		if (digest !== declaration.targetCanonicalSha256) {
			fail(
				`Archived milestone ${id} canonical digest ${digest} does not match the declared targetCanonicalSha256 ${declaration.targetCanonicalSha256}`,
			);
		}
	}

	const receiptPaths = [];
	for (const id of declaredTargets) {
		const declaration = declarations.get(id);
		const receiptBytes = await readBytesOrFail(
			root,
			declaration.receipt,
			`Transition receipt for ${id}`,
		);
		let receipt;
		try {
			receipt = JSON.parse(receiptBytes.toString("utf8"));
		} catch (error) {
			fail(
				`Transition receipt for ${id} is not valid JSON (${error.message}): ${declaration.receipt}`,
			);
		}
		assertReceipt(receipt, {
			declaration,
			anchorPath,
			anchorSha256,
			anchorHistory,
			liveBytes,
			liveHistory,
			addedIds,
			removedIds,
			modifiedIds,
			nowMs,
		});
		receiptPaths.push(declaration.receipt);
	}

	return {
		anchorSha256,
		beforeCount: anchorHistory.milestoneCount,
		afterCount: liveIds.length,
		addedIds: [...addedIds],
		removedIds: [...removedIds],
		modifiedIds: [...modifiedIds],
		declaredTargets,
		receiptPath: receiptPaths.length === 1 ? receiptPaths[0] : null,
		receiptPaths,
	};
}
