// Frontier-preservation evidence for the pre-repair dirty worktree frontier.
//
// The frozen trust root is the pre-r02 snapshot pinned below as source
// literals (path and SHA-256). The protected domain, the counts, and the
// baseline listing hashes come from that pinned snapshot document, never from
// a mutable manifest's copied hashes. A pointer document records the policy
// transition (which repair-owned exclusions were added after the snapshot, and
// why) and points back at the pinned snapshot; the checker validates the
// pointer against the source-owned policy, then verifies the live worktree:
//
//   * every non-excluded protected snapshot entry is still present in
//     `git status --short` with its recorded status, and its current file or
//     directory-tree content hash equals the hash recorded in the pinned
//     snapshot (protected hashes are recorded in snapshot <digest>; the check
//     does not prove byte-identity before that snapshot was recorded);
//   * every repair-owned tracked baseline entry still present in git status
//     keeps its recorded status; one that left git status must be clean
//     against HEAD as git reports it (`git diff --quiet HEAD -- <path>`, so
//     line-ending conversion and other git text rules are respected) and must
//     not be hidden from status by an index flag (assume-unchanged or
//     skip-worktree), which would short-circuit that comparison;
//   * repair-owned untracked baseline entries may not disappear;
//   * additions are informational only and unconstrained.
//
// Timestamps in the pointer document are observed metadata with a sanity
// future bound only. They are never evidence of when content hashes were
// captured and never enter a proof statement (timestampsAuthoritative is
// always false).
//
// `--generate <new-path>` writes a candidate snapshot plus a `.sha256`
// companion at a new path, only after the full verifier passes. It never
// modifies the pinned snapshot, its companion, the pointer document, the
// predecessor manifest, or the baseline listing.
//
// Usage:
//   node scripts/check-frontier-preservation.mjs [auto-selects dirty or clean-candidate mode]
//   node scripts/check-frontier-preservation.mjs --clean-candidate <base-commit>
//   node scripts/check-frontier-preservation.mjs --generate <new-path>

import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const PIPELINE_PINNED_SNAPSHOT_PATH =
	"docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01-frontier-preservation-pre-r02-anchor.json";
export const PIPELINE_PINNED_SNAPSHOT_SHA256 =
	"86e416a729208bdce28670c41fcf1feb5c55443f6e0443d46b4ea8d7969f2d41";
export const PIPELINE_PINNED_SNAPSHOT = Object.freeze({
	path: PIPELINE_PINNED_SNAPSHOT_PATH,
	sha256: PIPELINE_PINNED_SNAPSHOT_SHA256,
});
export const POINTER_DOCUMENT_PATH =
	"docs/phase-records/handoffs/coordinator/20260919-010000-agent-context-architecture-migration-r01-frontier-policy.json";
export const PREDECESSOR_MANIFEST_PATH =
	"docs/phase-records/handoffs/coordinator/20260915-183000-design-agent-environment-repair-r01-frontier-preservation.json";
// M0 froze the preserved source frontier immediately before the M1 portability
// candidate. Clean-candidate verification is intentionally anchored to this
// immutable commit rather than to the candidate's current parent or HEAD.
export const M0_BASE_COMMIT = "19e28f4f0874d96569bc6944e38ad94b89924b60";

// The r04 round owns fast-ladder wiring in scripts/verify.mjs (the trusted
// test-runtime gate and the frontier check itself); it is verification
// tooling, not product or UI content. The r08 round owns two recorded
// test-only test-reliability repairs under scope changes #1 and #2 in
// tests/browser/staff-paper-fidelity.review.spec.ts and
// tests/browser/phase2.browser.spec.ts. M1 of the agent-context architecture
// migration additionally owns the six Owner class/spacing validator, test,
// and data paths already required by the trusted fast ladder. They are
// verification infrastructure and include no Owner UI or canonical bytes.
// The pointer document must repeat this list exactly, so an exclusion cannot
// be added or hidden without a code change.
export const REPAIR_OWNED_EXCLUSIONS = Object.freeze([
	"PROJECT_STATE.yaml",
	"package.json",
	".gitignore",
	"AGENTS.md",
	"DESIGN_GUIDE.md",
	"PHASES.md",
	"docs/POLISH_BACKLOG.md",
	"docs/WORKFLOW.md",
	"docs/schemas/project-state.schema.json",
	"scripts/verify-repository.mjs",
	"visual-direction-gate/approved/APPROVAL_MANIFEST.yaml",
	"visual-direction-gate/approved/paper-route-authority-20260902/AUTHORITY_MANIFEST.yaml",
	"scripts/verify.mjs",
	"tests/browser/staff-paper-fidelity.review.spec.ts",
	"tests/browser/phase2.browser.spec.ts",
	"scripts/check-owner-classes.mjs",
	"scripts/check-owner-classes.test.ts",
	"scripts/check-owner-spacing.mjs",
	"scripts/check-owner-spacing.test.ts",
	"scripts/owner-classes-allowlist.json",
	"scripts/owner-spacing-baseline.json",
	".impeccable/",
]);

const ISO_8601_PATTERN =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const STATUS_PATTERN = /^[ MADRCU?!]{2}$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

function fail(message) {
	throw new Error(message);
}

export function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

function matchHistoricalTextHash(bytes, expectedSha256) {
	const exactSha256 = sha256(bytes);
	if (exactSha256 === expectedSha256) {
		return { matchedSha256: exactSha256, compatibility: "exact" };
	}
	// The preserved pre-r02 baseline was recorded from a Windows CRLF worktree,
	// while Git stores and cleanly checks out the text as LF under .gitattributes.
	// Accept only that deterministic line-ending projection; all other byte drift
	// remains a failure and the output states that this is not byte identity.
	if (!bytes.includes(0x0d)) {
		const recordedWindowsBytes = Buffer.from(
			bytes.toString("utf8").replace(/\n/g, "\r\n"),
			"utf8",
		);
		if (sha256(recordedWindowsBytes) === expectedSha256) {
			return {
				matchedSha256: expectedSha256,
				compatibility: "git-lf-to-recorded-crlf",
			};
		}
	}
	return { matchedSha256: exactSha256, compatibility: "none" };
}

function isExcludedBy(exclusions, relativePath) {
	const normalizedPath = relativePath.replace(/\/+$/, "");
	return exclusions.some((entry) => {
		const normalizedEntry = entry.replace(/\/+$/, "");
		return (
			normalizedPath === normalizedEntry ||
			normalizedPath.startsWith(`${normalizedEntry}/`)
		);
	});
}

function isRepairOwned(relativePath) {
	return isExcludedBy(REPAIR_OWNED_EXCLUSIONS, relativePath);
}

function assertObservedTimestamp(value, label, nowMs) {
	if (
		typeof value !== "string" ||
		!ISO_8601_PATTERN.test(value) ||
		Number.isNaN(Date.parse(value))
	) {
		fail(`${label} is not a parseable ISO-8601 timestamp`);
	}
	if (Date.parse(value) > nowMs) {
		fail(
			`${label} is in the future; local timestamps are sanity-bounded observed metadata and are never evidence of capture time`,
		);
	}
}

function parseListing(text, label) {
	const entries = new Map();
	for (const line of text.split(/\r?\n/)) {
		if (line.length === 0) continue;
		const clean = line.charCodeAt(0) === 0xfeff ? line.slice(1) : line;
		if (clean.length < 4 || clean[2] !== " ") {
			fail(`${label} has a malformed entry: ${JSON.stringify(line)}`);
		}
		const status = clean.slice(0, 2);
		if (!STATUS_PATTERN.test(status)) {
			fail(`${label} has an unknown status: ${JSON.stringify(line)}`);
		}
		if (/[RC]/.test(status)) {
			fail(
				`${label} contains a rename or copy entry, which this checker does not support: ${JSON.stringify(line)}`,
			);
		}
		const entryPath = clean.slice(3);
		if (entries.has(entryPath)) {
			fail(`${label} lists the same path twice: ${entryPath}`);
		}
		entries.set(entryPath, status);
	}
	return entries;
}

function readCurrentStatus(root) {
	return parseListing(
		execFileSync("git", ["status", "--short"], {
			cwd: root,
			encoding: "utf8",
			maxBuffer: 64 * 1024 * 1024,
		}),
		"Current git status",
	);
}

function assertCleanCandidateBase(root, baseCommit) {
	if (typeof baseCommit !== "string" || baseCommit.length === 0) {
		fail(
			`Clean-candidate mode requires the frozen M0 base commit ${M0_BASE_COMMIT}`,
		);
	}
	if (!/^[0-9a-f]{40}$/.test(baseCommit)) {
		fail(
			`Clean-candidate base commit is invalid: ${JSON.stringify(baseCommit)}; expected the frozen M0 commit ${M0_BASE_COMMIT}`,
		);
	}
	if (baseCommit !== M0_BASE_COMMIT) {
		fail(
			`Clean-candidate base commit ${baseCommit} is not the frozen M0 base commit ${M0_BASE_COMMIT}`,
		);
	}

	const resolved = spawnSync(
		"git",
		["rev-parse", "--verify", `${baseCommit}^{commit}`],
		{ cwd: root, encoding: "utf8" },
	);
	if (resolved.error) {
		fail(
			`Unable to resolve clean-candidate base commit ${baseCommit}: ${resolved.error.message}`,
		);
	}
	if (resolved.status !== 0) {
		const detail = resolved.stderr ? resolved.stderr.trim() : "";
		fail(
			`Clean-candidate base commit ${baseCommit} is missing or is not a commit${detail ? `: ${detail}` : ""}`,
		);
	}
	const resolvedCommit = resolved.stdout.trim().toLowerCase();
	if (resolvedCommit !== baseCommit) {
		fail(
			`Clean-candidate base commit resolved unexpectedly: requested ${baseCommit}, got ${resolvedCommit}`,
		);
	}

	const head = spawnSync("git", ["rev-parse", "--verify", "HEAD^{commit}"], {
		cwd: root,
		encoding: "utf8",
	});
	if (head.error) {
		fail(`Unable to resolve clean-candidate HEAD: ${head.error.message}`);
	}
	if (head.status !== 0) {
		const detail = head.stderr ? head.stderr.trim() : "";
		fail(
			`Clean-candidate HEAD is missing or is not a commit${detail ? `: ${detail}` : ""}`,
		);
	}

	const ancestry = spawnSync(
		"git",
		["merge-base", "--is-ancestor", baseCommit, "HEAD"],
		{ cwd: root, encoding: "utf8" },
	);
	if (ancestry.error) {
		fail(
			`Unable to verify clean-candidate ancestry from ${baseCommit}: ${ancestry.error.message}`,
		);
	}
	if (ancestry.status !== 0) {
		fail(
			`Clean-candidate HEAD does not descend from the frozen M0 base commit ${baseCommit}`,
		);
	}
}

function assertFrozenBasePolicy(pointer) {
	if (pointer.m0BaseCommit !== M0_BASE_COMMIT) {
		fail(
			`Policy pointer m0BaseCommit is ${JSON.stringify(pointer.m0BaseCommit)}, expected the source-owned frozen M0 base commit ${M0_BASE_COMMIT}`,
		);
	}
}

function assertNoHiddenIndexFlagsInRepository(root) {
	const listing = spawnSync("git", ["ls-files", "-v", "-z"], {
		cwd: root,
		encoding: "utf8",
	});
	if (listing.error) {
		fail(
			`Unable to inspect clean-candidate index flags: ${listing.error.message}`,
		);
	}
	if (listing.status !== 0) {
		const detail = listing.stderr ? listing.stderr.trim() : "";
		fail(
			`Unable to inspect clean-candidate index flags (git ls-files -v status ${String(listing.status)}${detail ? `: ${detail}` : ""})`,
		);
	}
	for (const line of listing.stdout.split("\0")) {
		if (line.length === 0) continue;
		const flag = line[0];
		if (flag !== "S" && !/^[a-z]$/.test(flag)) continue;
		fail(
			`Clean-candidate tracked path is hidden from git status by an index flag (assume-unchanged/skip-worktree) and cannot be verified: ${line.slice(2)}`,
		);
	}
}

function assertCleanCandidateTree(current) {
	if (current.size === 0) return;
	const entries = [...current]
		.map(([entryPath, status]) => `${status} ${entryPath}`)
		.join(", ");
	fail(
		`Clean-candidate worktree is dirty; expected no git status entries (found ${current.size}: ${entries})`,
	);
}

function countIntegratedAdditions(root, baseCommit) {
	const diff = spawnSync(
		"git",
		[
			"diff",
			"--no-ext-diff",
			"--no-renames",
			"--name-only",
			"--diff-filter=A",
			baseCommit,
			"HEAD",
		],
		{ cwd: root, encoding: "utf8" },
	);
	if (diff.error) {
		fail(
			`Unable to count clean-candidate additions from frozen M0 base ${baseCommit}: ${diff.error.message}`,
		);
	}
	if (diff.status !== 0) {
		const detail = diff.stderr ? diff.stderr.trim() : "";
		fail(
			`Unable to count clean-candidate additions from frozen M0 base ${baseCommit} (git diff status ${String(diff.status)}${detail ? `: ${detail}` : ""})`,
		);
	}
	return diff.stdout.split(/\r?\n/).filter((line) => line.length > 0).length;
}

async function pathExists(absolute) {
	try {
		await stat(absolute);
		return true;
	} catch (error) {
		if (error?.code === "ENOENT") return false;
		throw error;
	}
}

async function readFileOrFail(root, relativePath, label) {
	try {
		return await readFile(path.resolve(root, relativePath));
	} catch (error) {
		if (error?.code === "ENOENT") {
			fail(`${label} is missing: ${relativePath}`);
		}
		throw error;
	}
}

function parseJsonOrFail(text, label) {
	try {
		return JSON.parse(text);
	} catch (error) {
		fail(`${label} is not valid JSON (${error.message})`);
	}
}

async function readCompanionHash(root, relativePath) {
	const bytes = await readFileOrFail(root, relativePath, "SHA-256 companion");
	const match = /^([0-9a-fA-F]{64}) {2}/.exec(bytes.toString("utf8"));
	if (!match) {
		fail(`Companion file is not in sha256sum format: ${relativePath}`);
	}
	return match[1].toLowerCase();
}

function assertPointerStructure(pointer, { pinnedSnapshot, nowMs }) {
	if (
		pointer === null ||
		typeof pointer !== "object" ||
		Array.isArray(pointer)
	) {
		fail("Policy pointer document must be a JSON object");
	}
	if (pointer.schemaVersion !== 1) {
		fail(
			`Policy pointer schemaVersion is ${String(pointer.schemaVersion)}, expected 1`,
		);
	}
	if (pointer.kind !== "frontier-evidence-policy-pointer") {
		fail(
			`Policy pointer kind is ${JSON.stringify(pointer.kind)}, expected "frontier-evidence-policy-pointer"`,
		);
	}
	for (const field of ["proves", "doesNotProve"]) {
		if (field in pointer) {
			fail(
				`Policy pointer must not carry free-text ${field} statements; the checker derives its claims from the enforced branches`,
			);
		}
	}
	assertObservedTimestamp(
		pointer.recordedAt,
		"Policy pointer recordedAt",
		nowMs,
	);
	const snapshotPointer = pointer.pinnedSnapshot;
	if (
		snapshotPointer === null ||
		typeof snapshotPointer !== "object" ||
		Array.isArray(snapshotPointer)
	) {
		fail("Policy pointer is missing the pinnedSnapshot object");
	}
	if (snapshotPointer.path !== pinnedSnapshot.path) {
		fail(
			`Policy pointer pinnedSnapshot.path is ${JSON.stringify(snapshotPointer.path)}, expected the source-owned pinned snapshot path ${JSON.stringify(pinnedSnapshot.path)}`,
		);
	}
	if (
		typeof snapshotPointer.sha256 !== "string" ||
		snapshotPointer.sha256.toLowerCase() !== pinnedSnapshot.sha256
	) {
		fail(
			`Policy pointer pinnedSnapshot.sha256 is ${JSON.stringify(snapshotPointer.sha256)}, expected the source-owned pinned snapshot SHA-256 ${pinnedSnapshot.sha256}`,
		);
	}
	if (snapshotPointer.companionPath !== `${pinnedSnapshot.path}.sha256`) {
		fail(
			`Policy pointer pinnedSnapshot.companionPath is ${JSON.stringify(snapshotPointer.companionPath)}, expected ${JSON.stringify(`${pinnedSnapshot.path}.sha256`)}`,
		);
	}
	const predecessor = pointer.predecessor;
	if (
		predecessor === null ||
		typeof predecessor !== "object" ||
		Array.isArray(predecessor)
	) {
		fail("Policy pointer is missing the predecessor object");
	}
	if (predecessor.path !== PREDECESSOR_MANIFEST_PATH) {
		fail(
			`Policy pointer predecessor.path is ${JSON.stringify(predecessor.path)}, expected the preserved predecessor ${JSON.stringify(PREDECESSOR_MANIFEST_PATH)}`,
		);
	}
	if (
		typeof predecessor.sha256 !== "string" ||
		!SHA256_PATTERN.test(predecessor.sha256)
	) {
		fail(
			"Policy pointer predecessor.sha256 must be a lowercase SHA-256 digest",
		);
	}
	if (typeof predecessor.note !== "string" || predecessor.note.length === 0) {
		fail("Policy pointer predecessor.note must be a non-empty string");
	}
	if (
		!Array.isArray(pointer.repairOwnedExclusions) ||
		pointer.repairOwnedExclusions.some(
			(entry) => typeof entry !== "string" || entry.length === 0,
		)
	) {
		fail("Policy pointer repairOwnedExclusions must be a list of paths");
	}
	if (
		JSON.stringify(pointer.repairOwnedExclusions) !==
		JSON.stringify(REPAIR_OWNED_EXCLUSIONS)
	) {
		fail(
			"Policy pointer repairOwnedExclusions does not exactly match the source-owned repair-owned exclusions; an exclusion cannot be added or hidden without a code change",
		);
	}
}

function assertProtectedRecords(protectedPaths) {
	if (!Array.isArray(protectedPaths) || protectedPaths.length === 0) {
		fail("Pinned snapshot protectedPaths must be a non-empty list");
	}
	const seen = new Set();
	for (const record of protectedPaths) {
		if (
			record === null ||
			typeof record !== "object" ||
			Array.isArray(record)
		) {
			fail("Pinned snapshot protectedPaths contains a non-object entry");
		}
		if (typeof record.path !== "string" || record.path.length === 0) {
			fail("Pinned snapshot protectedPaths contains an entry without a path");
		}
		if (seen.has(record.path)) {
			fail(`Pinned snapshot protectedPaths lists ${record.path} twice`);
		}
		seen.add(record.path);
		if (
			typeof record.status !== "string" ||
			!STATUS_PATTERN.test(record.status) ||
			/[RC]/.test(record.status)
		) {
			fail(
				`Pinned snapshot protected record ${record.path} has an unsupported status ${JSON.stringify(record.status)}`,
			);
		}
		if (record.kind !== "file" && record.kind !== "directory") {
			fail(
				`Pinned snapshot protected record ${record.path} has an unknown kind ${JSON.stringify(record.kind)}`,
			);
		}
		if (
			typeof record.sha256 !== "string" ||
			!SHA256_PATTERN.test(record.sha256)
		) {
			fail(
				`Pinned snapshot protected record ${record.path} has an invalid sha256`,
			);
		}
		if (record.kind === "directory" && !Number.isInteger(record.fileCount)) {
			fail(
				`Pinned snapshot protected directory ${record.path} is missing an integer fileCount`,
			);
		}
	}
}

function assertSnapshotStructure(snapshot) {
	if (
		snapshot === null ||
		typeof snapshot !== "object" ||
		Array.isArray(snapshot)
	) {
		fail("Pinned snapshot must be a JSON object");
	}
	if (
		typeof snapshot.recordedAt !== "string" ||
		snapshot.recordedAt.length === 0
	) {
		fail("Pinned snapshot recordedAt must be a non-empty string");
	}
	if (
		!Array.isArray(snapshot.repairOwnedExclusions) ||
		snapshot.repairOwnedExclusions.some(
			(entry) => typeof entry !== "string" || entry.length === 0,
		)
	) {
		fail("Pinned snapshot repairOwnedExclusions must be a list of paths");
	}
	const baselineListing = snapshot.baselineListing;
	if (
		baselineListing === null ||
		typeof baselineListing !== "object" ||
		Array.isArray(baselineListing)
	) {
		fail("Pinned snapshot is missing the baselineListing object");
	}
	if (
		typeof baselineListing.path !== "string" ||
		baselineListing.path.length === 0
	) {
		fail("Pinned snapshot baselineListing.path must be a non-empty string");
	}
	if (
		typeof baselineListing.sha256 !== "string" ||
		!SHA256_PATTERN.test(baselineListing.sha256)
	) {
		fail(
			"Pinned snapshot baselineListing.sha256 must be a lowercase SHA-256 digest",
		);
	}
	assertProtectedRecords(snapshot.protectedPaths);
	if (!Number.isInteger(snapshot.baselineEntryCount)) {
		fail("Pinned snapshot baselineEntryCount must be an integer");
	}
	if (!Number.isInteger(snapshot.protectedEntryCount)) {
		fail("Pinned snapshot protectedEntryCount must be an integer");
	}
	if (snapshot.protectedEntryCount !== snapshot.protectedPaths.length) {
		fail(
			`Pinned snapshot protectedEntryCount is ${snapshot.protectedEntryCount}, protectedPaths has ${snapshot.protectedPaths.length} records`,
		);
	}
}

function assertSnapshotGrounding(snapshot, baselineEntries) {
	if (snapshot.baselineEntryCount !== baselineEntries.size) {
		fail(
			`Pinned snapshot baselineEntryCount is ${snapshot.baselineEntryCount}, the baseline listing has ${baselineEntries.size} entries`,
		);
	}
	const protectedPaths = new Set();
	for (const record of snapshot.protectedPaths) {
		if (isExcludedBy(snapshot.repairOwnedExclusions, record.path)) {
			fail(
				`Pinned snapshot records ${record.path} as both excluded and protected`,
			);
		}
		const status = baselineEntries.get(record.path);
		if (status === undefined) {
			fail(
				`Pinned snapshot protected record ${record.path} is not a baseline listing entry`,
			);
		}
		if (status !== record.status) {
			fail(
				`Pinned snapshot protected record ${record.path} has status "${record.status}", the baseline listing records "${status}"`,
			);
		}
		protectedPaths.add(record.path);
	}
	for (const entryPath of baselineEntries.keys()) {
		if (protectedPaths.has(entryPath)) continue;
		if (isExcludedBy(snapshot.repairOwnedExclusions, entryPath)) continue;
		fail(
			`Pinned snapshot omits baseline entry ${entryPath} without recording it as excluded or protected`,
		);
	}
}

function assertTransition(pointer, snapshot, nowMs) {
	const transition = pointer.transition;
	if (
		transition === null ||
		typeof transition !== "object" ||
		Array.isArray(transition)
	) {
		fail("Policy pointer is missing the transition object");
	}
	assertObservedTimestamp(
		transition.recordedAt,
		"Policy pointer transition.recordedAt",
		nowMs,
	);
	if (!Array.isArray(transition.addedExclusions)) {
		fail("Policy pointer transition.addedExclusions must be an array");
	}
	const expected = REPAIR_OWNED_EXCLUSIONS.filter(
		(entry) => !isExcludedBy(snapshot.repairOwnedExclusions, entry),
	);
	const recorded = new Map();
	for (const entry of transition.addedExclusions) {
		if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
			fail(
				"Policy pointer transition.addedExclusions contains a non-object entry",
			);
		}
		if (typeof entry.path !== "string" || entry.path.length === 0) {
			fail(
				"Policy pointer transition.addedExclusions contains an entry without a path",
			);
		}
		if (recorded.has(entry.path)) {
			fail(
				`Policy pointer transition.addedExclusions lists ${entry.path} twice`,
			);
		}
		recorded.set(entry.path, entry);
	}
	for (const entryPath of expected) {
		const entry = recorded.get(entryPath);
		if (!entry) {
			fail(
				`Policy pointer transition.addedExclusions is missing the newly excluded path ${entryPath}`,
			);
		}
		if (typeof entry.reason !== "string" || entry.reason.trim().length === 0) {
			fail(
				`Policy pointer transition.addedExclusions entry for ${entryPath} has an empty reason`,
			);
		}
		const record = snapshot.protectedPaths.find(
			(candidate) => candidate.path === entryPath,
		);
		if (!record) {
			fail(
				`Pinned snapshot has no protected record for newly excluded path ${entryPath}; the before-transition hash is not verifiable`,
			);
		}
		if (entry.pinnedSha256BeforeTransition !== record.sha256) {
			fail(
				`Policy pointer transition.addedExclusions entry for ${entryPath} records pinnedSha256BeforeTransition ${entry.pinnedSha256BeforeTransition}, but the pinned snapshot records ${record.sha256}`,
			);
		}
	}
	for (const entryPath of recorded.keys()) {
		if (!expected.includes(entryPath)) {
			fail(
				`Policy pointer transition.addedExclusions contains ${entryPath}, which the pinned snapshot does not require as a newly excluded path`,
			);
		}
	}
	const roundOpen = transition.roundOpenVerification;
	if (
		roundOpen === null ||
		typeof roundOpen !== "object" ||
		Array.isArray(roundOpen)
	) {
		fail("Policy pointer is missing transition.roundOpenVerification");
	}
	for (const field of ["command", "result", "note"]) {
		if (typeof roundOpen[field] !== "string" || roundOpen[field].length === 0) {
			fail(
				`Policy pointer transition.roundOpenVerification.${field} must be a non-empty string`,
			);
		}
	}
	return { newlyExcluded: expected };
}

async function walkFiles(directory, prefix = "") {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkFiles(absolute, relative)));
		} else if (entry.isFile()) {
			files.push({ absolute, relative });
		} else {
			fail(`Protected directory contains a non-file entry: ${relative}`);
		}
	}
	return files;
}

export async function hashDirectory(absolute) {
	const files = (await walkFiles(absolute)).sort((a, b) =>
		a.relative < b.relative ? -1 : a.relative > b.relative ? 1 : 0,
	);
	const tree = createHash("sha256");
	for (const file of files) {
		tree.update(
			`${sha256(await readFile(file.absolute))}  ${file.relative}\n`,
			"utf8",
		);
	}
	return { digest: tree.digest("hex"), fileCount: files.length };
}

async function hashCurrentProtectedEntry(root, record) {
	const absolute = path.resolve(root, record.path);
	let info = null;
	try {
		info = await stat(absolute);
	} catch (error) {
		if (error?.code !== "ENOENT") throw error;
	}
	if (info === null) {
		fail(
			`Protected baseline path is missing from the worktree: ${record.path}`,
		);
	}
	if (record.kind === "directory") {
		if (!info.isDirectory()) {
			fail(`Protected path changed kind: ${record.path} (recorded directory)`);
		}
		const { digest, fileCount } = await hashDirectory(absolute);
		if (fileCount !== record.fileCount) {
			fail(
				`Protected directory file count changed: ${record.path} (recorded ${record.fileCount}, current ${fileCount})`,
			);
		}
		return digest;
	}
	if (!info.isFile()) {
		fail(`Protected baseline path is not a file or directory: ${record.path}`);
	}
	return sha256(await readFile(absolute));
}

function assertNoHiddenIndexFlags(root, entryPath) {
	const listing = spawnSync("git", ["ls-files", "-v", "--", entryPath], {
		cwd: root,
		encoding: "utf8",
	});
	if (listing.error) {
		fail(
			`Unable to verify the index state of repair-owned baseline entry: ${entryPath} (${listing.error.message})`,
		);
	}
	if (listing.status !== 0) {
		const detail = listing.stderr ? listing.stderr.trim() : "";
		fail(
			`Unable to verify the index state of repair-owned baseline entry: ${entryPath} (git ls-files -v status ${String(listing.status)}${detail ? `: ${detail}` : ""})`,
		);
	}
	for (const line of listing.stdout.split(/\r?\n/)) {
		if (line.length === 0) continue;
		const flag = line[0];
		if (flag !== "S" && !/^[a-z]$/.test(flag)) continue;
		fail(
			`Repair-owned tracked baseline entry is hidden from git status by an index flag (assume-unchanged/skip-worktree) and cannot be verified: ${entryPath} (git ls-files -v reports flag "${flag}" for ${line.slice(2)})`,
		);
	}
}

function assertRepairOwnedBaselineEntries(root, baselineEntries, current) {
	for (const [entryPath, status] of baselineEntries) {
		if (!isRepairOwned(entryPath)) continue;
		const currentStatus = current.get(entryPath);
		if (currentStatus !== undefined) {
			if (currentStatus !== status) {
				fail(
					`Repair-owned baseline entry changed status: ${entryPath} (recorded "${status}", now "${currentStatus}")`,
				);
			}
			continue;
		}
		if (status === "??") {
			const tracked = spawnSync("git", ["ls-files", "--", entryPath], {
				cwd: root,
				encoding: "utf8",
			});
			if (tracked.error) {
				fail(
					`Unable to inspect promoted repair-owned baseline entry: ${entryPath} (${tracked.error.message})`,
				);
			}
			if (tracked.status !== 0 || tracked.stdout.trim().length === 0) {
				fail(`Repair-owned untracked baseline entry disappeared: ${entryPath}`);
			}
			assertNoHiddenIndexFlags(root, entryPath);
			const promotedDiff = spawnSync(
				"git",
				["diff", "--quiet", "HEAD", "--", entryPath],
				{ cwd: root },
			);
			if (promotedDiff.error) {
				fail(
					`Unable to compare promoted repair-owned baseline entry against HEAD: ${entryPath} (${promotedDiff.error.message})`,
				);
			}
			if (promotedDiff.status === 0) continue;
			if (promotedDiff.status === 1) {
				fail(
					`Promoted repair-owned baseline entry is dirty against HEAD: ${entryPath}`,
				);
			}
			const stderr = promotedDiff.stderr
				? promotedDiff.stderr.toString().trim()
				: "";
			fail(
				`Unable to compare promoted repair-owned baseline entry against HEAD: ${entryPath} (git diff --quiet status ${String(promotedDiff.status)}${promotedDiff.signal ? `, signal ${promotedDiff.signal}` : ""}${stderr ? `: ${stderr}` : ""})`,
			);
		}
		assertNoHiddenIndexFlags(root, entryPath);
		const diff = spawnSync(
			"git",
			["diff", "--quiet", "HEAD", "--", entryPath],
			{ cwd: root },
		);
		if (diff.error) {
			fail(
				`Unable to compare repair-owned baseline entry against HEAD: ${entryPath} (${diff.error.message})`,
			);
		}
		if (diff.status === 0) continue;
		if (diff.status === 1) {
			fail(
				`Repair-owned tracked baseline entry left git status but is dirty against HEAD: ${entryPath}`,
			);
		}
		const stderr = diff.stderr ? diff.stderr.toString().trim() : "";
		fail(
			`Unable to compare repair-owned baseline entry against HEAD: ${entryPath} (git diff --quiet status ${String(diff.status)}${diff.signal ? `, signal ${diff.signal}` : ""}${stderr ? `: ${stderr}` : ""})`,
		);
	}
}

function assertProtectedPathsNotIntegrated(root, baseCommit, snapshot) {
	const verifiedRecords = [];
	for (const record of snapshot.protectedPaths) {
		if (isRepairOwned(record.path)) continue;
		const diff = spawnSync(
			"git",
			[
				"diff",
				"--no-ext-diff",
				"--no-renames",
				"--name-status",
				baseCommit,
				"HEAD",
				"--",
				record.path,
			],
			{ cwd: root, encoding: "utf8" },
		);
		if (diff.error) {
			fail(
				`Unable to compare protected path against frozen M0 base ${baseCommit}: ${record.path} (${diff.error.message})`,
			);
		}
		if (diff.status !== 0) {
			const detail = diff.stderr ? diff.stderr.trim() : "";
			fail(
				`Unable to compare protected path against frozen M0 base ${baseCommit}: ${record.path} (git diff status ${String(diff.status)}${detail ? `: ${detail}` : ""})`,
			);
		}
		const integrated = diff.stdout.trim();
		if (integrated.length > 0) {
			fail(
				`Protected path was integrated relative to frozen M0 base ${baseCommit}: ${record.path}\n${integrated}`,
			);
		}
		verifiedRecords.push(record.path);
	}
	return verifiedRecords;
}

export async function verifyFrontierPreservation({
	root = process.cwd(),
	pointerPath = POINTER_DOCUMENT_PATH,
	pinnedSnapshot = PIPELINE_PINNED_SNAPSHOT,
	mode = "auto",
	baseCommit = M0_BASE_COMMIT,
} = {}) {
	if (mode !== "auto" && mode !== "dirty" && mode !== "clean-candidate") {
		fail(
			`Unknown frontier verification mode ${JSON.stringify(mode)}; expected "auto", "dirty", or "clean-candidate"`,
		);
	}
	const nowMs = Date.now();
	const pointerBytes = await readFileOrFail(
		root,
		pointerPath,
		"Policy pointer document",
	);
	const pointer = parseJsonOrFail(
		pointerBytes.toString("utf8"),
		"Policy pointer document",
	);
	assertPointerStructure(pointer, { pinnedSnapshot, nowMs });

	const snapshotBytes = await readFileOrFail(
		root,
		pointer.pinnedSnapshot.path,
		"Pinned snapshot",
	);
	const snapshotSha256 = sha256(snapshotBytes);
	if (snapshotSha256 !== pinnedSnapshot.sha256) {
		fail(
			`Pinned snapshot ${pinnedSnapshot.path} does not SHA-256 to the source-owned pinned digest: pinned ${pinnedSnapshot.sha256}, current ${snapshotSha256}`,
		);
	}
	const snapshotCompanionHash = await readCompanionHash(
		root,
		pointer.pinnedSnapshot.companionPath,
	);
	if (snapshotCompanionHash !== snapshotSha256) {
		fail(
			`Pinned snapshot .sha256 companion disagrees: file ${snapshotSha256}, companion ${snapshotCompanionHash}`,
		);
	}
	const snapshot = parseJsonOrFail(
		snapshotBytes.toString("utf8"),
		"Pinned snapshot",
	);
	assertSnapshotStructure(snapshot);

	const baselineBytes = await readFileOrFail(
		root,
		snapshot.baselineListing.path,
		"Baseline listing",
	);
	const baselineHashMatch = matchHistoricalTextHash(
		baselineBytes,
		snapshot.baselineListing.sha256,
	);
	const baselineSha256 = baselineHashMatch.matchedSha256;
	if (baselineHashMatch.compatibility === "none") {
		fail(
			`Pinned snapshot baselineListing.sha256 differs from the baseline listing file: snapshot ${snapshot.baselineListing.sha256}, file ${baselineSha256}`,
		);
	}
	const baselineCompanionHash = await readCompanionHash(
		root,
		`${snapshot.baselineListing.path}.sha256`,
	);
	if (baselineCompanionHash !== baselineSha256) {
		fail(
			`Baseline listing does not match its .sha256 companion: file ${baselineSha256}, companion ${baselineCompanionHash}`,
		);
	}
	const baselineEntries = parseListing(
		baselineBytes.toString("utf8"),
		"Baseline listing",
	);
	assertSnapshotGrounding(snapshot, baselineEntries);
	const { newlyExcluded } = assertTransition(pointer, snapshot, nowMs);
	assertFrozenBasePolicy(pointer);
	const current = readCurrentStatus(root);
	const effectiveMode =
		mode === "auto" ? (current.size === 0 ? "clean-candidate" : "dirty") : mode;
	if (effectiveMode === "clean-candidate") {
		assertCleanCandidateBase(root, baseCommit);
		assertCleanCandidateTree(current);
		assertNoHiddenIndexFlagsInRepository(root);
	}

	const predecessorBytes = await readFileOrFail(
		root,
		pointer.predecessor.path,
		"Predecessor manifest",
	);
	const predecessorSha256 = sha256(predecessorBytes);
	if (predecessorSha256 !== pointer.predecessor.sha256) {
		fail(
			`Policy pointer predecessor.sha256 does not match the preserved predecessor file ${pointer.predecessor.path}: pointer ${pointer.predecessor.sha256}, file ${predecessorSha256}`,
		);
	}

	console.log(
		`Pinned snapshot ${pinnedSnapshot.path} validated at SHA-256 ${pinnedSnapshot.sha256}; its .sha256 companion agrees.`,
	);
	console.log(
		`Policy pointer ${pointerPath} recordedAt ${pointer.recordedAt} (observed metadata, not evidence of capture time); timestampsAuthoritative: false.`,
	);
	console.log(
		`Baseline listing ${snapshot.baselineListing.path} SHA-256 ${baselineSha256} matches its .sha256 companion and the pinned snapshot.`,
	);
	if (baselineHashMatch.compatibility === "git-lf-to-recorded-crlf") {
		console.log(
			"Baseline listing uses the clean-checkout LF projection of the recorded Windows CRLF bytes; normalized content matches, but checkout byte identity is not claimed.",
		);
	}
	console.log(
		`Predecessor pointer ${PREDECESSOR_MANIFEST_PATH} preserved at SHA-256 ${predecessorSha256}; candidate snapshots link to the pinned snapshot, never the reverse.`,
	);
	console.log(
		`Repair-owned exclusions (${REPAIR_OWNED_EXCLUSIONS.length}) are enforced from source: ${REPAIR_OWNED_EXCLUSIONS.join(", ")}. Newly excluded by the recorded transition: ${newlyExcluded.length} (${newlyExcluded.join(", ") || "none"}).`,
	);
	if (effectiveMode === "clean-candidate") {
		console.log(
			`Clean-candidate base ${baseCommit} is present, is an ancestor of HEAD, and the worktree is clean.`,
		);
	} else {
		console.log(
			`Protected hashes are recorded in snapshot ${pinnedSnapshot.sha256}; this check does not prove byte-identity before the snapshot was recorded, does not prove the snapshot capture time, and does not constrain additions (additions are unconstrained).`,
		);
	}

	if (effectiveMode === "clean-candidate") {
		const protectedRecords = assertProtectedPathsNotIntegrated(
			root,
			baseCommit,
			snapshot,
		);
		console.log(
			`Clean-candidate frontier preservation PASS: ${protectedRecords.length} non-excluded protected paths were not integrated relative to frozen M0 base ${baseCommit}; ${snapshot.protectedPaths.length - protectedRecords.length} protected paths are explicitly excluded by policy.`,
		);
		return {
			mode: effectiveMode,
			baseCommit,
			baselineEntryCount: baselineEntries.size,
			protectedEntryCount: protectedRecords.length,
			excludedEntryCount:
				snapshot.protectedPaths.length - protectedRecords.length,
			additionCount: countIntegratedAdditions(root, baseCommit),
			pinnedSnapshotSha256: pinnedSnapshot.sha256,
			pinnedSnapshotPath: pinnedSnapshot.path,
			recordedAt: pointer.recordedAt,
			timestampsAuthoritative: false,
			protectedRecords: protectedRecords.map((entryPath) =>
				snapshot.protectedPaths.find((record) => record.path === entryPath),
			),
			excludedProtectedPaths: snapshot.protectedPaths
				.filter((record) => isRepairOwned(record.path))
				.map((record) => record.path),
			baselineListing: {
				path: snapshot.baselineListing.path,
				sha256: baselineSha256,
			},
			predecessorSha256,
		};
	}

	const protectedRecords = [];
	const excludedProtectedPaths = [];
	for (const record of snapshot.protectedPaths) {
		if (isRepairOwned(record.path)) {
			excludedProtectedPaths.push(record.path);
			continue;
		}
		const currentStatus = current.get(record.path);
		if (currentStatus === undefined) {
			fail(
				`Protected baseline entry is missing from git status: ${record.path} (recorded "${record.status}")`,
			);
		}
		if (currentStatus !== record.status) {
			fail(
				`Protected baseline entry changed status: ${record.path} (recorded "${record.status}", now "${currentStatus}")`,
			);
		}
		const digest = await hashCurrentProtectedEntry(root, record);
		if (digest !== record.sha256) {
			fail(
				`Protected ${record.kind} drifted: ${record.path}\n  recorded in snapshot ${pinnedSnapshot.sha256}: ${record.sha256}\n  current sha256: ${digest}`,
			);
		}
		protectedRecords.push({
			status: record.status,
			path: record.path,
			kind: record.kind,
			sha256: digest,
			...(record.kind === "directory" ? { fileCount: record.fileCount } : {}),
		});
	}

	assertRepairOwnedBaselineEntries(root, baselineEntries, current);

	const additions = [...current].filter(
		([entryPath]) => !baselineEntries.has(entryPath),
	);
	console.log(
		`Additions since the baseline (${additions.length}, informational; additions are unconstrained):`,
	);
	for (const [entryPath, status] of additions) {
		console.log(`  ${status} ${entryPath}`);
	}
	console.log(
		`Frontier preservation PASS: ${baselineEntries.size} baseline entries, ${protectedRecords.length} non-excluded protected entries verified, ${excludedProtectedPaths.length} excluded protected entries, ${additions.length} additions (informational; additions are unconstrained); protected hashes recorded in snapshot ${pinnedSnapshot.sha256}.`,
	);
	return {
		mode: effectiveMode,
		baselineEntryCount: baselineEntries.size,
		protectedEntryCount: protectedRecords.length,
		excludedEntryCount: excludedProtectedPaths.length,
		additionCount: additions.length,
		pinnedSnapshotSha256: pinnedSnapshot.sha256,
		pinnedSnapshotPath: pinnedSnapshot.path,
		recordedAt: pointer.recordedAt,
		timestampsAuthoritative: false,
		protectedRecords,
		excludedProtectedPaths,
		baselineListing: {
			path: snapshot.baselineListing.path,
			sha256: baselineSha256,
		},
		predecessorSha256,
	};
}

async function hashTrustedPaths(absolutePaths) {
	const output = [];
	for (const absolute of absolutePaths) {
		output.push(`${absolute} ${sha256(await readFile(absolute))}`);
	}
	return output;
}

export async function generateFrontierCandidate({
	root = process.cwd(),
	candidatePath,
	pointerPath = POINTER_DOCUMENT_PATH,
	pinnedSnapshot = PIPELINE_PINNED_SNAPSHOT,
} = {}) {
	if (typeof candidatePath !== "string" || candidatePath.length === 0) {
		fail(
			"--generate requires a target path (usage: node scripts/check-frontier-preservation.mjs --generate <new-path>)",
		);
	}
	const absoluteCandidate = path.resolve(root, candidatePath);
	const absoluteCompanion = `${absoluteCandidate}.sha256`;
	if (await pathExists(absoluteCandidate)) {
		fail(
			`Refusing to generate: candidate path already exists: ${candidatePath}`,
		);
	}
	if (await pathExists(absoluteCompanion)) {
		fail(
			`Refusing to generate: candidate .sha256 companion already exists: ${candidatePath}.sha256`,
		);
	}

	const verified = await verifyFrontierPreservation({
		root,
		pointerPath,
		pinnedSnapshot,
	});

	const trustedPaths = [
		path.resolve(root, pointerPath),
		path.resolve(root, pinnedSnapshot.path),
		`${path.resolve(root, pinnedSnapshot.path)}.sha256`,
		path.resolve(root, PREDECESSOR_MANIFEST_PATH),
		path.resolve(root, verified.baselineListing.path),
		`${path.resolve(root, verified.baselineListing.path)}.sha256`,
	];
	const trustedBefore = await hashTrustedPaths(trustedPaths);
	const candidate = {
		schemaVersion: 1,
		kind: "frontier-preservation-candidate-snapshot",
		recordedAt: new Date().toISOString(),
		timestampsAuthoritative: false,
		predecessor: {
			path: pinnedSnapshot.path,
			sha256: pinnedSnapshot.sha256,
		},
		baselineListing: verified.baselineListing,
		repairOwnedExclusions: [...REPAIR_OWNED_EXCLUSIONS],
		protectedPaths: verified.protectedRecords,
		baselineEntryCount: verified.baselineEntryCount,
		protectedEntryCount: verified.protectedEntryCount,
		excludedEntryCount: verified.excludedEntryCount,
	};
	const candidateBytes = Buffer.from(
		`${JSON.stringify(candidate, null, "\t")}\n`,
		"utf8",
	);
	const candidateSha256 = sha256(candidateBytes);
	await writeFile(absoluteCandidate, candidateBytes);
	await writeFile(
		absoluteCompanion,
		`${candidateSha256}  ${path.basename(absoluteCandidate)}\n`,
		"utf8",
	);
	const trustedAfter = await hashTrustedPaths(trustedPaths);
	if (trustedBefore.join("\n") !== trustedAfter.join("\n")) {
		fail(
			"Candidate generation modified a trusted evidence file; this must never happen",
		);
	}
	console.log(
		`Candidate snapshot written: ${candidatePath} (SHA-256 ${candidateSha256}) with companion ${candidatePath}.sha256; predecessor ${pinnedSnapshot.path} (SHA-256 ${pinnedSnapshot.sha256}). The pinned snapshot, its companion, the pointer document, the predecessor manifest, and the baseline listing were re-hashed unchanged by this generation.`,
	);
	return candidate;
}

async function main() {
	const args = process.argv.slice(2);
	if (args.length === 0) {
		await verifyFrontierPreservation();
		return;
	}
	if (args.length === 2 && args[0] === "--clean-candidate") {
		await verifyFrontierPreservation({
			mode: "clean-candidate",
			baseCommit: args[1],
		});
		return;
	}
	if (args.length === 2 && args[0] === "--generate") {
		await generateFrontierCandidate({ candidatePath: args[1] });
		return;
	}
	fail(
		`Usage: node scripts/check-frontier-preservation.mjs [--clean-candidate <base-commit> | --generate <new-path>] (unexpected arguments: ${args.join(" ")})`,
	);
}

const invokedDirectly =
	process.argv[1] !== undefined &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
	main().catch((error) => {
		console.error(`check:frontier FAILED: ${error.message}`);
		process.exitCode = 1;
	});
}
