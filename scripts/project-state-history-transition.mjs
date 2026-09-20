// Legacy phase3 and v2 receipt-chain evidence for the append-only closed ledger.
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
// The legacy anchor is repository-internal, co-mutable evidence. It proves the
// forward transition from the recorded pre-transition bytes only: it cannot
// prove anything about history bytes before that capture and it is not an
// external signature. V2 receipts use the same repository-internal evidence
// model, with live prefix boundaries chained by receipt hashes and byte spans.
// Receipt timestamps are observed metadata with a sanity future bound only and
// never enter a proof statement.
//
// Deprecation: new transitions use only the v2 receipt chain under
// docs/phase-records/history-transitions/. The legacy phase3 anchor constants and
// the full-snapshot compatibility claim below are retained evidence for
// already-recorded history; they are never regenerated, and no new whole-history
// snapshot may be created from them.
//
// The check is read-only; it never writes to the repository.

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
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
export const HISTORY_V2_RECEIPT_SCHEMA_VERSION = 2;
export const HISTORY_RECEIPT_DIRECTORY =
	"docs/phase-records/history-transitions";
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

/**
 * Prove append-only history at the byte boundary. This intentionally compares
 * only the pre-existing prefix; YAML reserialization is not a valid substitute
 * for preserving the bytes that already carried historical evidence.
 */
export function assertHistoryPrefixPreserved(beforeBytes, afterBytes) {
	const before = Buffer.from(beforeBytes);
	const after = Buffer.from(afterBytes);
	if (after.byteLength < before.byteLength) {
		fail(
			`History append is shorter than the pre-existing bytes: before ${before.byteLength}, after ${after.byteLength}`,
		);
	}
	if (!after.subarray(0, before.byteLength).equals(before)) {
		fail(
			`History append does not preserve the pre-existing byte prefix of ${before.byteLength} bytes`,
		);
	}
	return {
		prefixBytes: before.byteLength,
		beforeSha256: sha256(before),
		prefixSha256: sha256(after.subarray(0, before.byteLength)),
	};
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

function assertDependencyUnion(state, history) {
	if (!isPlainObject(state) || !isPlainObject(state.milestones))
		fail("Active state must contain a milestones map");
	if (!isPlainObject(history) || !isPlainObject(history.milestones))
		fail("History must contain a milestones map");
	const union = new Map();
	for (const [id, milestone] of Object.entries(history.milestones)) {
		union.set(id, milestone);
	}
	for (const [id, milestone] of Object.entries(state.milestones)) {
		if (union.has(id))
			fail(
				`The active/history union is not unique: ${id} is present in both the active ledger and history`,
			);
		union.set(id, milestone);
	}
	for (const [id, milestone] of union) {
		if (!Array.isArray(milestone?.dependencies))
			fail(`${id} dependencies must be an array`);
		for (const dependency of milestone.dependencies) {
			if (!union.has(dependency))
				fail(`${id} dependency does not exist: ${dependency}`);
		}
	}
	const visited = new Set();
	const visiting = new Set();
	function visit(id) {
		if (visiting.has(id)) fail(`Milestone dependency cycle includes ${id}`);
		if (visited.has(id)) return;
		visiting.add(id);
		for (const dependency of union.get(id).dependencies) visit(dependency);
		visiting.delete(id);
		visited.add(id);
	}
	for (const id of union.keys()) visit(id);
	return union;
}

function assertV2GenesisReceipt(receipt, label, nowMs) {
	if (!isPlainObject(receipt)) fail(`${label} must be a JSON object`);
	if (receipt.schemaVersion !== HISTORY_V2_RECEIPT_SCHEMA_VERSION)
		fail(`${label} schemaVersion must be ${HISTORY_V2_RECEIPT_SCHEMA_VERSION}`);
	if (receipt.kind !== "history-genesis-receipt")
		fail(`${label} must be a history-genesis-receipt`);
	assertObservedTimestamp(receipt.recordedAt, `${label} recordedAt`, nowMs);
	if (receipt.historyPath !== HISTORY_PATH)
		fail(`${label} historyPath must be ${JSON.stringify(HISTORY_PATH)}`);
	if (
		typeof receipt.historySha256 !== "string" ||
		!SHA256_PATTERN.test(receipt.historySha256)
	)
		fail(
			`${label} historySha256 must be a lowercase 64-character SHA-256 digest`,
		);
	if (!Number.isInteger(receipt.milestoneCount) || receipt.milestoneCount < 0)
		fail(`${label} milestoneCount must be a non-negative integer`);
	if (
		!Number.isInteger(receipt.historyByteLength) ||
		receipt.historyByteLength < 0
	)
		fail(`${label} historyByteLength must be a non-negative integer`);
	if (!isPlainObject(receipt.recordDigestMap))
		fail(`${label} recordDigestMap must be an object`);
	const ids = Object.keys(receipt.recordDigestMap);
	if (ids.length !== receipt.milestoneCount)
		fail(`${label} milestoneCount does not match recordDigestMap`);
	for (const id of ids) {
		if (
			id.trim().length === 0 ||
			!SHA256_PATTERN.test(receipt.recordDigestMap[id])
		)
			fail(`${label} recordDigestMap contains an invalid digest for ${id}`);
	}
	if (!isPlainObject(receipt.activeMilestoneDigests))
		fail(`${label} activeMilestoneDigests must be an object`);
	for (const id of Object.keys(receipt.activeMilestoneDigests)) {
		if (
			id.trim().length === 0 ||
			!SHA256_PATTERN.test(receipt.activeMilestoneDigests[id])
		)
			fail(
				`${label} activeMilestoneDigests contains an invalid digest for ${id}`,
			);
	}
	const checkpoint = receipt.legacyCheckpoint;
	if (!isPlainObject(checkpoint))
		fail(`${label} legacyCheckpoint must be an object`);
	assertNonEmptyString(
		checkpoint.receiptPath,
		`${label} legacyCheckpoint.receiptPath`,
	);
	if (!SHA256_PATTERN.test(checkpoint.receiptSha256))
		fail(
			`${label} legacyCheckpoint.receiptSha256 must be a lowercase 64-character SHA-256 digest`,
		);
	if (!SHA256_PATTERN.test(checkpoint.afterHistorySha256))
		fail(
			`${label} legacyCheckpoint.afterHistorySha256 must be a lowercase 64-character SHA-256 digest`,
		);
	if (
		!Number.isInteger(checkpoint.afterHistoryBytes) ||
		checkpoint.afterHistoryBytes < 0
	)
		fail(
			`${label} legacyCheckpoint.afterHistoryBytes must be a non-negative integer`,
		);
}

function assertV2TransitionReceipt(receipt, label, nowMs) {
	if (!isPlainObject(receipt)) fail(`${label} must be a JSON object`);
	if (receipt.schemaVersion !== HISTORY_V2_RECEIPT_SCHEMA_VERSION)
		fail(`${label} schemaVersion must be ${HISTORY_V2_RECEIPT_SCHEMA_VERSION}`);
	if (receipt.kind !== HISTORY_TRANSITION_RECEIPT_KIND)
		fail(`${label} must be a history-transition-receipt`);
	assertObservedTimestamp(receipt.recordedAt, `${label} recordedAt`, nowMs);
	if (
		typeof receipt.previousReceiptSha256 !== "string" ||
		!SHA256_PATTERN.test(receipt.previousReceiptSha256)
	)
		fail(`${label} previousReceiptSha256 must be non-null and lowercase`);
	for (const field of [
		"beforeHistorySha256",
		"afterHistorySha256",
		"closedPacketSha256",
		"removedActiveMilestoneDigest",
	]) {
		if (
			typeof receipt[field] !== "string" ||
			!SHA256_PATTERN.test(receipt[field])
		)
			fail(`${label} ${field} must be a lowercase 64-character SHA-256 digest`);
	}
	for (const field of [
		"beforeHistoryBytes",
		"afterHistoryBytes",
		"beforeMilestoneCount",
		"afterMilestoneCount",
	]) {
		if (!Number.isInteger(receipt[field]) || receipt[field] < 0)
			fail(`${label} ${field} must be a non-negative integer`);
	}
	if (!isPlainObject(receipt.addedTerminal))
		fail(`${label} addedTerminal must be an object`);
	const added = receipt.addedTerminal;
	assertNonEmptyString(added.milestoneId, `${label} addedTerminal.milestoneId`);
	if (!TERMINAL_HISTORY_STATUSES.includes(added.status))
		fail(`${label} addedTerminal.status must be terminal`);
	if (typeof added.digest !== "string" || !SHA256_PATTERN.test(added.digest))
		fail(
			`${label} addedTerminal.digest must be a lowercase 64-character SHA-256 digest`,
		);
	assertNonEmptyString(
		receipt.removedActiveMilestoneId,
		`${label} removedActiveMilestoneId`,
	);
	assertNonEmptyString(receipt.coordinatorRun, `${label} coordinatorRun`);
}

async function readReceiptChain(root, receiptDirectory) {
	const directory = resolveWithinRoot(
		root,
		receiptDirectory,
		"History receipt directory",
	);
	let names;
	try {
		names = (await readdir(directory))
			.filter((name) => name.endsWith(".json"))
			.sort();
	} catch (error) {
		if (error?.code === "ENOENT")
			fail(`History receipt directory is missing: ${receiptDirectory}`);
		throw error;
	}
	if (names.length === 0)
		fail(`History receipt directory has no JSON receipts: ${receiptDirectory}`);
	const entries = [];
	for (const name of names) {
		const receiptPath = `${receiptDirectory}/${name}`;
		const bytes = await readBytesOrFail(
			root,
			receiptPath,
			`History receipt ${receiptPath}`,
		);
		let receipt;
		try {
			receipt = JSON.parse(bytes.toString("utf8"));
		} catch (error) {
			fail(
				`History receipt ${receiptPath} is not valid JSON (${error.message})`,
			);
		}
		entries.push({ path: receiptPath, bytes, receipt, sha256: sha256(bytes) });
	}
	return entries;
}

async function assertLegacyGenesisCheckpoint(
	root,
	genesis,
	genesisPath,
	liveBytes,
) {
	const checkpoint = genesis.legacyCheckpoint;
	const receiptBytes = await readBytesOrFail(
		root,
		checkpoint.receiptPath,
		`Legacy checkpoint receipt ${checkpoint.receiptPath}`,
	);
	if (sha256(receiptBytes) !== checkpoint.receiptSha256)
		fail(
			`${genesisPath} legacyCheckpoint.receiptSha256 does not match its receipt bytes`,
		);
	let receipt;
	try {
		receipt = JSON.parse(receiptBytes.toString("utf8"));
	} catch (error) {
		fail(
			`Legacy checkpoint receipt is not valid JSON (${error.message}): ${checkpoint.receiptPath}`,
		);
	}
	if (
		receipt?.schemaVersion !== HISTORY_TRANSITION_RECEIPT_SCHEMA_VERSION ||
		receipt?.kind !== HISTORY_TRANSITION_RECEIPT_KIND
	)
		fail(
			`${genesisPath} legacyCheckpoint must point to a schemaVersion 1 history transition receipt`,
		);
	if (!isPlainObject(receipt.after))
		fail(
			`${genesisPath} legacyCheckpoint receipt is missing its after boundary`,
		);
	if (receipt.after.path !== HISTORY_PATH)
		fail(
			`${genesisPath} legacyCheckpoint receipt after.path must be ${JSON.stringify(HISTORY_PATH)}`,
		);
	if (receipt.after.sha256 !== checkpoint.afterHistorySha256)
		fail(
			`${genesisPath} legacyCheckpoint.afterHistorySha256 does not match the legacy receipt after.sha256`,
		);
	if (receipt.after.bytes !== checkpoint.afterHistoryBytes)
		fail(
			`${genesisPath} legacyCheckpoint.afterHistoryBytes does not match the legacy receipt after.bytes`,
		);
	if (receipt.after.milestoneCount !== genesis.milestoneCount)
		fail(
			`${genesisPath} legacy checkpoint after.milestoneCount does not match genesis milestoneCount`,
		);
	if (genesis.historySha256 !== checkpoint.afterHistorySha256)
		fail(
			`${genesisPath} historySha256 does not match the immutable legacy checkpoint afterHistorySha256`,
		);
	if (genesis.historyByteLength !== checkpoint.afterHistoryBytes)
		fail(
			`${genesisPath} historyByteLength does not match the immutable legacy checkpoint afterHistoryBytes`,
		);
	if (
		sha256(liveBytes.subarray(0, genesis.historyByteLength)) !==
		checkpoint.afterHistorySha256
	)
		fail(
			`${genesisPath} legacy checkpoint afterHistorySha256 does not match the live history prefix`,
		);
}

async function assertClosedPacketHash(root, receipt, history) {
	const milestoneId = receipt.addedTerminal.milestoneId;
	const historicalRecord = history.milestones[milestoneId];
	if (!isPlainObject(historicalRecord))
		fail(
			`Transition receipt for ${milestoneId} cannot resolve its historical record`,
		);
	if (
		typeof historicalRecord.taskPacketSha256 !== "string" ||
		!SHA256_PATTERN.test(historicalRecord.taskPacketSha256)
	)
		fail(`History record ${milestoneId} is missing a valid taskPacketSha256`);
	if (historicalRecord.taskPacketSha256 !== receipt.closedPacketSha256)
		fail(
			`History record ${milestoneId} taskPacketSha256 does not match closedPacketSha256`,
		);
	const packetPath = historicalRecord.taskPacket;
	if (typeof packetPath !== "string" || packetPath.length === 0)
		fail(
			`Transition receipt for ${milestoneId} cannot resolve its closed packet path`,
		);
	const packetBytes = await readBytesOrFail(
		root,
		packetPath,
		`Closed task packet for ${milestoneId}`,
	);
	let packet;
	try {
		packet = parseYaml(packetBytes.toString("utf8"));
	} catch (error) {
		fail(
			`Closed task packet for ${milestoneId} is not valid YAML (${error.message})`,
		);
	}
	if (!isPlainObject(packet))
		fail(`Closed task packet for ${milestoneId} must be a YAML object`);
	if (packet.packetStatus !== "CLOSED")
		fail(`Closed task packet for ${milestoneId} must have packetStatus CLOSED`);
	if (packet.milestoneId !== milestoneId)
		fail(
			`Closed task packet for ${milestoneId} milestoneId does not match the terminal id`,
		);
	if (packet.stateRef !== `PROJECT_STATE.yaml#/milestones/${milestoneId}`)
		fail(
			`Closed task packet for ${milestoneId} stateRef does not match its milestoneId`,
		);
	const packetSha256 = sha256(packetBytes);
	if (packetSha256 !== receipt.closedPacketSha256)
		fail(
			`Transition receipt for ${milestoneId} closedPacketSha256 does not match ${packetPath}`,
		);
}

export async function verifyHistoryReceiptChain({
	root = process.cwd(),
	state,
	history,
	liveBytes,
	receiptDirectory = HISTORY_RECEIPT_DIRECTORY,
	historyCheckpoints = new Map(),
	nowMs = Date.now(),
} = {}) {
	const resolvedState =
		state ??
		parseActiveState(
			await readBytesOrFail(root, STATE_PATH, "Active state ledger"),
		);
	const resolvedBytes =
		liveBytes ??
		(await readBytesOrFail(root, HISTORY_PATH, "Candidate history"));
	const resolvedHistory = history ?? parseHistory(resolvedBytes);
	if (resolvedState.schemaVersion !== 2)
		fail("History v2 receipt validation requires active state schemaVersion 2");
	const union = assertDependencyUnion(resolvedState, resolvedHistory);
	const chain = await readReceiptChain(root, receiptDirectory);
	const genesisEntry = chain[0];
	assertV2GenesisReceipt(genesisEntry.receipt, genesisEntry.path, nowMs);
	const genesis = genesisEntry.receipt;
	await assertLegacyGenesisCheckpoint(
		root,
		genesis,
		genesisEntry.path,
		resolvedBytes,
	);
	const known = new Map(Object.entries(genesis.recordDigestMap));
	const initialActive = new Map(Object.entries(genesis.activeMilestoneDigests));
	const orderedIds = Object.keys(genesis.recordDigestMap);
	const addedIds = [];
	const removedActiveIds = [];
	const genesisByteLength = genesis.historyByteLength;
	if (!Number.isInteger(genesisByteLength) || genesisByteLength < 0)
		fail(
			`${genesisEntry.path} historyByteLength must be a non-negative integer`,
		);
	if (genesisByteLength > resolvedBytes.byteLength)
		fail(
			`${genesisEntry.path} historyByteLength exceeds current history bytes`,
		);
	if (
		sha256(resolvedBytes.subarray(0, genesisByteLength)) !==
		genesis.historySha256
	)
		fail(
			`${genesisEntry.path} historySha256 does not match its live history prefix`,
		);
	const genesisPrefixHistory = parseHistory(
		resolvedBytes.subarray(0, genesisByteLength),
	);
	const genesisPrefixIds = Object.keys(genesisPrefixHistory.milestones);
	if (genesisPrefixIds.length !== genesis.milestoneCount)
		fail(
			`${genesisEntry.path} history prefix milestone count does not match genesis milestoneCount`,
		);
	if (genesisPrefixIds.join("\n") !== orderedIds.join("\n"))
		fail(
			`${genesisEntry.path} recordDigestMap key order does not match the parsed history prefix`,
		);
	for (const id of orderedIds) {
		if (
			canonicalMilestoneDigest(genesisPrefixHistory.milestones[id]) !==
			known.get(id)
		)
			fail(
				`${genesisEntry.path} recordDigestMap digest does not match the parsed history prefix: ${id}`,
			);
	}
	let previousHistorySha256 = genesis.historySha256;
	let previousHistoryByteLength = genesisByteLength;
	for (const id of known.keys()) {
		if (!Object.hasOwn(resolvedHistory.milestones, id))
			fail(`Genesis history record is missing from candidate history: ${id}`);
		if (
			canonicalMilestoneDigest(resolvedHistory.milestones[id]) !== known.get(id)
		)
			fail(`Pre-existing history record changed canonical digest: ${id}`);
	}
	const historyPrefixIds = Object.keys(resolvedHistory.milestones).slice(
		0,
		orderedIds.length,
	);
	if (historyPrefixIds.join("\n") !== orderedIds.join("\n"))
		fail(
			`${genesisEntry.path} recordDigestMap key order does not match the live history prefix`,
		);
	for (let index = 1; index < chain.length; index += 1) {
		const entry = chain[index];
		assertV2TransitionReceipt(entry.receipt, entry.path, nowMs);
		const receipt = entry.receipt;
		const expectedPrevious = chain[index - 1].sha256;
		if (receipt.previousReceiptSha256 !== expectedPrevious)
			fail(
				`${entry.path} previousReceiptSha256 does not match ${chain[index - 1].path}`,
			);
		if (receipt.beforeHistorySha256 !== previousHistorySha256)
			fail(
				`${entry.path} beforeHistorySha256 does not match the preceding history boundary`,
			);
		if (receipt.beforeHistoryBytes !== previousHistoryByteLength)
			fail(
				`${entry.path} beforeHistoryBytes does not match the preceding history boundary`,
			);
		if (
			!Number.isInteger(receipt.afterHistoryBytes) ||
			receipt.afterHistoryBytes <= receipt.beforeHistoryBytes
		)
			fail(
				`${entry.path} afterHistoryBytes must be greater than beforeHistoryBytes`,
			);
		if (receipt.afterHistoryBytes > resolvedBytes.byteLength)
			fail(`${entry.path} afterHistoryBytes exceeds current history bytes`);
		if (
			sha256(resolvedBytes.subarray(0, receipt.beforeHistoryBytes)) !==
			receipt.beforeHistorySha256
		)
			fail(
				`${entry.path} beforeHistorySha256 does not match its live history prefix`,
			);
		if (
			sha256(resolvedBytes.subarray(0, receipt.afterHistoryBytes)) !==
			receipt.afterHistorySha256
		)
			fail(
				`${entry.path} afterHistorySha256 does not match its live history prefix`,
			);
		assertHistoryPrefixPreserved(
			resolvedBytes.subarray(0, receipt.beforeHistoryBytes),
			resolvedBytes.subarray(0, receipt.afterHistoryBytes),
		);
		const added = receipt.addedTerminal;
		const beforePrefixHistory = parseHistory(
			resolvedBytes.subarray(0, receipt.beforeHistoryBytes),
		);
		const afterPrefixHistory = parseHistory(
			resolvedBytes.subarray(0, receipt.afterHistoryBytes),
		);
		const beforePrefixIds = Object.keys(beforePrefixHistory.milestones);
		const afterPrefixIds = Object.keys(afterPrefixHistory.milestones);
		if (receipt.beforeMilestoneCount !== beforePrefixIds.length)
			fail(
				`${entry.path} beforeMilestoneCount does not match its parsed history prefix`,
			);
		if (receipt.afterMilestoneCount !== afterPrefixIds.length)
			fail(
				`${entry.path} afterMilestoneCount does not match its parsed history prefix`,
			);
		if (receipt.afterMilestoneCount !== receipt.beforeMilestoneCount + 1)
			fail(
				`${entry.path} transition must append exactly one terminal history record`,
			);
		if (beforePrefixIds.join("\n") !== orderedIds.join("\n"))
			fail(
				`${entry.path} before prefix does not match the preceding receipt chain history`,
			);
		if (afterPrefixIds.slice(0, -1).join("\n") !== beforePrefixIds.join("\n"))
			fail(
				`${entry.path} after prefix does not preserve the preceding history key order`,
			);
		if (afterPrefixIds.at(-1) !== added.milestoneId)
			fail(
				`${entry.path} added terminal must be the final key in its after history prefix`,
			);
		if (receipt.removedActiveMilestoneId !== added.milestoneId)
			fail(
				`${entry.path} removedActiveMilestoneId must equal addedTerminal.milestoneId`,
			);
		if (
			initialActive.has(receipt.removedActiveMilestoneId) &&
			receipt.removedActiveMilestoneDigest !==
				initialActive.get(receipt.removedActiveMilestoneId)
		)
			fail(
				`${entry.path} removedActiveMilestoneDigest does not match the genesis-pinned active checkpoint`,
			);
		if (removedActiveIds.includes(receipt.removedActiveMilestoneId))
			fail(`${entry.path} removes the same active milestone more than once`);
		if (known.has(added.milestoneId))
			fail(`${entry.path} re-adds history milestone ${added.milestoneId}`);
		const record = resolvedHistory.milestones[added.milestoneId];
		if (!record)
			fail(
				`${entry.path} added terminal is missing from candidate history: ${added.milestoneId}`,
			);
		if (record.status !== added.status)
			fail(
				`${entry.path} added terminal status does not match history record ${added.milestoneId}`,
			);
		const digest = canonicalMilestoneDigest(record);
		const prefixRecord = afterPrefixHistory.milestones[added.milestoneId];
		if (!prefixRecord)
			fail(
				`${entry.path} added terminal is missing from its after history prefix`,
			);
		if (canonicalMilestoneDigest(prefixRecord) !== added.digest)
			fail(
				`${entry.path} added terminal digest does not match its after history prefix`,
			);
		if (digest !== added.digest)
			fail(
				`${entry.path} added terminal digest does not match history record ${added.milestoneId}`,
			);
		known.set(added.milestoneId, digest);
		orderedIds.push(added.milestoneId);
		addedIds.push(added.milestoneId);
		removedActiveIds.push(receipt.removedActiveMilestoneId);
		const checkpointBytes =
			historyCheckpoints instanceof Map
				? historyCheckpoints.get(receipt.beforeHistorySha256)
				: historyCheckpoints?.[receipt.beforeHistorySha256];
		if (checkpointBytes !== undefined)
			assertHistoryPrefixPreserved(checkpointBytes, resolvedBytes);
		await assertClosedPacketHash(root, receipt, resolvedHistory);
		previousHistorySha256 = receipt.afterHistorySha256;
		previousHistoryByteLength = receipt.afterHistoryBytes;
	}
	const currentHistorySha256 = sha256(resolvedBytes);
	if (previousHistorySha256 !== currentHistorySha256)
		fail(
			"History receipt chain does not terminate at the current history SHA-256",
		);
	if (previousHistoryByteLength !== resolvedBytes.byteLength)
		fail(
			"History receipt chain does not terminate at the current history byte length",
		);
	const removalCounts = new Map();
	for (const id of removedActiveIds)
		removalCounts.set(id, (removalCounts.get(id) ?? 0) + 1);
	for (const [id, count] of removalCounts) {
		if (Object.hasOwn(resolvedState.milestones, id))
			fail(
				`History receipt removal remains present in the active state: ${id}`,
			);
		if (count !== 1)
			fail(`History receipt removal must appear exactly once: ${id}`);
		if (!Object.hasOwn(resolvedHistory.milestones, id))
			fail(`History receipt removal is missing from terminal history: ${id}`);
	}
	for (const id of initialActive.keys()) {
		const remainsActive = Object.hasOwn(resolvedState.milestones, id);
		const removalCount = removalCounts.get(id) ?? 0;
		if (remainsActive && removalCount !== 0)
			fail(
				`Genesis active milestone cannot remain active after a receipt removes it: ${id}`,
			);
		if (!remainsActive && removalCount !== 1)
			fail(
				`Genesis active milestone must remain active or be removed exactly once: ${id}`,
			);
	}
	if (chain.length === 1 && genesis.historySha256 !== currentHistorySha256)
		fail("History genesis receipt does not match the current history SHA-256");
	const historyIds = Object.keys(resolvedHistory.milestones);
	if (historyIds.join("\n") !== orderedIds.join("\n"))
		fail(
			"Candidate history milestone key order does not match the receipt chain append order",
		);
	if (historyIds.length !== known.size)
		fail(
			"History receipt chain milestone count does not match candidate history",
		);
	for (const id of historyIds) {
		if (!known.has(id))
			fail(`Candidate history record is not covered by receipt chain: ${id}`);
		if (
			!TERMINAL_HISTORY_STATUSES.includes(
				resolvedHistory.milestones[id]?.status,
			)
		)
			fail(`Candidate history record ${id} is not terminal`);
	}
	return {
		mode: "v2",
		receiptPaths: chain.map((entry) => entry.path),
		genesisPath: genesisEntry.path,
		lastReceiptPath: chain.at(-1).path,
		currentHistorySha256,
		beforeCount: genesis.milestoneCount,
		afterCount: historyIds.length,
		addedIds,
		removedIds: removedActiveIds,
		modifiedIds: [],
		declaredTargets: [...addedIds],
		receiptPath: chain.length > 1 ? chain.at(-1).path : null,
		transitionReceiptPaths: chain.slice(1).map((entry) => entry.path),
		knownMilestoneIds: [...known.keys()].sort(),
		unionSize: union.size,
	};
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
		allowAfterPrefix = false,
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
	if (
		!Number.isInteger(after.bytes) ||
		after.bytes < 0 ||
		after.bytes > liveBytes.byteLength
	) {
		fail(
			`${label} after.bytes ${JSON.stringify(after.bytes)} is outside the live candidate history byte range ${liveBytes.byteLength}`,
		);
	}
	const liveSha256 = sha256(liveBytes);
	const afterPrefix = liveBytes.subarray(0, after.bytes);
	const afterPrefixSha256 = sha256(afterPrefix);
	if (
		after.sha256 !== liveSha256 &&
		(!allowAfterPrefix || after.sha256 !== afterPrefixSha256)
	) {
		fail(
			`${label} after.sha256 ${JSON.stringify(after.sha256)} does not match the live candidate history SHA-256 ${liveSha256}`,
		);
	}
	const checkpointHistory =
		after.sha256 === liveSha256 ? liveHistory : parseHistory(afterPrefix);
	const liveCount = Object.keys(checkpointHistory.milestones).length;
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

async function verifyLegacyReceiptCompatibility({
	root,
	state,
	history,
	liveBytes,
	nowMs,
}) {
	// Archived v1 declarations are already pinned by the v2 genesis record map.
	// Some pre-genesis eras rewrote the history header, so their `after` bytes
	// are historical snapshots rather than prefixes of the current append-only
	// file. Revalidate only declarations that remain active during the
	// compatibility window; the genesis bridge separately validates the latest
	// immutable legacy checkpoint against the live history prefix.
	const documents = [{ label: "active", document: state }];
	const checkedReceiptPaths = new Set();
	for (const { document } of documents) {
		for (const [declaringMilestoneId, milestone] of Object.entries(
			document?.milestones ?? {},
		)) {
			if (milestone?.historyMutations === undefined) continue;
			if (!Array.isArray(milestone.historyMutations))
				fail(`${declaringMilestoneId} historyMutations must be an array`);
			for (const entry of milestone.historyMutations) {
				assertHistoryMutationShape(entry, declaringMilestoneId);
				if (!Object.hasOwn(history.milestones, entry.targetMilestoneId))
					fail(
						`Legacy transition target is missing from history: ${entry.targetMilestoneId}`,
					);
				const target = history.milestones[entry.targetMilestoneId];
				if (target.status !== entry.targetStatus)
					fail(
						`Legacy transition target status does not match history: ${entry.targetMilestoneId}`,
					);
				if (canonicalMilestoneDigest(target) !== entry.targetCanonicalSha256)
					fail(
						`Legacy transition target canonical digest does not match history: ${entry.targetMilestoneId}`,
					);
				if (checkedReceiptPaths.has(entry.receipt)) continue;
				const receiptBytes = await readBytesOrFail(
					root,
					entry.receipt,
					`Legacy transition receipt for ${entry.targetMilestoneId}`,
				);
				let receipt;
				try {
					receipt = JSON.parse(receiptBytes.toString("utf8"));
				} catch (error) {
					fail(
						`Legacy transition receipt is not valid JSON (${error.message}): ${entry.receipt}`,
					);
				}
				if (receipt?.schemaVersion !== 1)
					fail(
						`Legacy transition receipt ${entry.receipt} must use schemaVersion 1`,
					);
				if (!isPlainObject(receipt.predecessorAnchor))
					fail(
						`Legacy transition receipt ${entry.receipt} is missing its predecessor anchor`,
					);
				const anchorPath = receipt.predecessorAnchor.path;
				const anchorSha256 = receipt.predecessorAnchor.sha256;
				if (typeof anchorPath !== "string" || typeof anchorSha256 !== "string")
					fail(
						`Legacy transition receipt ${entry.receipt} is missing its predecessor anchor`,
					);
				const { anchor } = await readTransitionAnchor(
					root,
					anchorPath,
					anchorSha256,
				);
				const anchorHistory = assertAnchorStructure(anchor, anchorPath);
				await assertFrozenCopy(root, anchorHistory);
				assertReceipt(receipt, {
					declaration: { ...entry, declaringMilestoneId },
					anchorPath,
					anchorSha256,
					anchorHistory,
					liveBytes,
					liveHistory: history,
					addedIds: [entry.targetMilestoneId],
					removedIds: [],
					modifiedIds: [],
					allowAfterPrefix: true,
					nowMs,
				});
				checkedReceiptPaths.add(entry.receipt);
			}
		}
	}
	return [...checkedReceiptPaths];
}

export async function verifyHistoryTransition({
	root = process.cwd(),
	state,
	history,
	anchorPath = TRANSITION_ANCHOR_PATH,
	anchorSha256 = TRANSITION_ANCHOR_SHA256,
	receiptDirectory = HISTORY_RECEIPT_DIRECTORY,
	historyCheckpoints = new Map(),
	nowMs = Date.now(),
} = {}) {
	const dispatchState =
		state === undefined
			? parseActiveState(
					await readBytesOrFail(root, STATE_PATH, "Active state ledger"),
				)
			: state;
	if (dispatchState?.schemaVersion === 2) {
		const liveBytes = await readBytesOrFail(
			root,
			HISTORY_PATH,
			"Candidate history",
		);
		const liveHistory = history ?? parseHistory(liveBytes);
		const result = await verifyHistoryReceiptChain({
			root,
			state: dispatchState,
			history: liveHistory,
			liveBytes,
			receiptDirectory,
			historyCheckpoints,
			nowMs,
		});
		const legacyReceiptPaths = await verifyLegacyReceiptCompatibility({
			root,
			state: dispatchState,
			history: liveHistory,
			liveBytes,
			nowMs,
		});
		return { ...result, legacyReceiptPaths };
	}
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
