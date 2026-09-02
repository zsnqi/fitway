import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
	r05RejectedCanonicalArtifacts,
	visualAuthorityCases,
} from "../tests/browser/visual-authority-cases.mjs";

const manifestRelativePath =
	"visual-direction-gate/approved/paper-route-authority-20260902/AUTHORITY_MANIFEST.yaml";
const requiredOwnerLandmarks = [
	"owner-global-shell",
	"owner-shared-navigation",
	"owner-active-panel",
];

function fail(message) {
	throw new Error(message);
}

function repositoryPath(root, relativePath) {
	const absolute = path.resolve(root, relativePath);
	const relative = path.relative(root, absolute);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		fail(`Visual-authority path escapes the repository: ${relativePath}`);
	}
	return absolute;
}

function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

export function verifyByteRecord(record, bytes, label = "artifact") {
	if (!record?.path || !Number.isInteger(record.bytes) || !record.sha256) {
		fail(`${label} is missing path, bytes, or sha256`);
	}
	if (bytes.byteLength !== record.bytes) {
		fail(`${label} byte count changed: ${record.path}`);
	}
	if (sha256(bytes) !== record.sha256) {
		fail(`${label} SHA-256 changed: ${record.path}`);
	}
}

async function walkFiles(directory, prefix = "") {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
		const absolute = path.join(directory, entry.name);
		if (entry.isDirectory())
			files.push(...(await walkFiles(absolute, relative)));
		else if (entry.isFile()) files.push({ absolute, relative });
		else fail(`Visual-authority tree contains a non-file entry: ${relative}`);
	}
	return files;
}

function collectLeafExports(value, label = "surfaces") {
	if (!value || typeof value !== "object") return [];
	if (Array.isArray(value)) {
		return value.flatMap((entry, index) =>
			collectLeafExports(entry, `${label}[${index}]`),
		);
	}
	const records = [];
	for (const [key, child] of Object.entries(value)) {
		if (
			(key === "leafExports" || key === "successorLeaves") &&
			Array.isArray(child)
		) {
			for (const [index, record] of child.entries()) {
				records.push({ label: `${label}.${key}[${index}]`, record });
			}
			continue;
		}
		records.push(...collectLeafExports(child, `${label}.${key}`));
	}
	return records;
}

function assertNonempty(value, label) {
	if (typeof value !== "string" || !value.trim()) fail(`${label} is required`);
}

/**
 * Pure registry validation used by both repository verification and negative tests.
 */
export function validateAuthorityRegistry({
	manifest,
	cases,
	canonicalArtifacts,
	rejectedArtifacts,
	deviations,
}) {
	if (manifest.schemaVersion !== 1 || manifest.status !== "IN_PROGRESS") {
		fail(
			"Route visual-authority manifest must be schema 1 and IN_PROGRESS until final approval",
		);
	}
	if (manifest.acceptancePolicy?.captureReviewIsVerdict !== false) {
		fail(
			"captureReview must remain evidence generation, never an acceptance verdict",
		);
	}
	if (manifest.acceptancePolicy?.baselineMayReplacePaper !== false) {
		fail("A routed baseline may not replace Paper as initial visual authority");
	}

	const deviationById = new Map(
		deviations.map((record) => [record.id, record]),
	);
	if (deviationById.size !== deviations.length)
		fail("Deviation IDs must be unique");
	const caseIds = new Set();
	const acceptedArtifacts = new Map();
	for (const authorityCase of cases) {
		assertNonempty(authorityCase.id, "VisualAuthorityCase.id");
		if (caseIds.has(authorityCase.id)) {
			fail(`Duplicate visual-authority case: ${authorityCase.id}`);
		}
		caseIds.add(authorityCase.id);
		for (const field of [
			"surface",
			"route",
			"state",
			"locale",
			"comparisonMode",
		]) {
			assertNonempty(authorityCase[field], `${authorityCase.id}.${field}`);
		}
		assertNonempty(
			authorityCase.paperReference?.area,
			`${authorityCase.id}.paperReference.area`,
		);
		if (!Number.isInteger(authorityCase.viewport?.width)) {
			fail(`${authorityCase.id} is missing an exact viewport width`);
		}
		if (!Number.isInteger(authorityCase.viewport?.height)) {
			fail(`${authorityCase.id} is missing an exact viewport height`);
		}
		for (const deviationId of authorityCase.approvedDeviationIds ?? []) {
			if (!deviationById.has(deviationId)) {
				fail(
					`${authorityCase.id} references unrecorded deviation ${deviationId}`,
				);
			}
		}
		if (authorityCase.status !== "ACCEPTED") continue;

		if (authorityCase.comparisonMode === "paper") {
			assertNonempty(
				authorityCase.paperReference.leafExportPath,
				`${authorityCase.id}.paperReference.leafExportPath`,
			);
			assertNonempty(
				authorityCase.paperReference.leafExportSha256,
				`${authorityCase.id}.paperReference.leafExportSha256`,
			);
		}
		if (authorityCase.routedArtifact?.kind !== "canonical") {
			fail(
				`${authorityCase.id} cannot be accepted from a captureReview artifact`,
			);
		}
		assertNonempty(
			authorityCase.routedArtifact.path,
			`${authorityCase.id}.routedArtifact.path`,
		);
		assertNonempty(
			authorityCase.routedArtifact.sha256,
			`${authorityCase.id}.routedArtifact.sha256`,
		);
		assertNonempty(
			authorityCase.approvalRecord,
			`${authorityCase.id}.approvalRecord`,
		);
		if (acceptedArtifacts.has(authorityCase.routedArtifact.path)) {
			fail(
				`${authorityCase.routedArtifact.path} is assigned to both ${acceptedArtifacts.get(authorityCase.routedArtifact.path)} and ${authorityCase.id}`,
			);
		}
		acceptedArtifacts.set(authorityCase.routedArtifact.path, authorityCase.id);
		if (authorityCase.ownerSection) {
			for (const landmark of requiredOwnerLandmarks) {
				if (!authorityCase.landmarkContracts.includes(landmark)) {
					fail(
						`${authorityCase.id} omits required full-route landmark ${landmark}`,
					);
				}
			}
		}
		for (const deviationId of authorityCase.approvedDeviationIds ?? []) {
			const deviation = deviationById.get(deviationId);
			if (deviation.status !== "IMPLEMENTED_AND_REVIEWED") {
				fail(`${authorityCase.id} uses unreviewed deviation ${deviationId}`);
			}
			for (const evidence of [
				"routedBefore",
				"routedAfter",
				"independentRenderedReview",
			]) {
				const value = deviation.reviewEvidence?.[evidence];
				if (!value || value === "PENDING_IMPLEMENTATION") {
					fail(`${deviationId} is missing ${evidence}`);
				}
			}
		}
	}

	const rejected = new Set(rejectedArtifacts);
	if (rejected.size !== rejectedArtifacts.length) {
		fail("Rejected r05 baseline inventory contains duplicate paths");
	}
	for (const artifact of canonicalArtifacts) {
		if (!rejected.has(artifact) && !acceptedArtifacts.has(artifact)) {
			fail(`Canonical routed screenshot lacks an authority entry: ${artifact}`);
		}
	}
	for (const artifact of acceptedArtifacts.keys()) {
		if (!canonicalArtifacts.includes(artifact)) {
			fail(`Accepted canonical routed screenshot is missing: ${artifact}`);
		}
	}
	if (manifest.rejectedRoutedBaseline?.status === "REJECTED_R05") {
		const actual = [...canonicalArtifacts].sort();
		const expected = [...rejected].sort();
		if (
			actual.length !== expected.length ||
			actual.some((value, index) => value !== expected[index])
		) {
			fail(
				"Rejected r05 canonical screenshot inventory changed without a new approval record",
			);
		}
	}
}

export async function verifyVisualAuthorityRepository(root) {
	const manifestPath = repositoryPath(root, manifestRelativePath);
	const manifest = parseYaml(await readFile(manifestPath, "utf8"));
	const manifestDirectory = path.dirname(manifestPath);
	for (const { record, label } of collectLeafExports(manifest.surfaces)) {
		const bytes = await readFile(path.resolve(manifestDirectory, record.path));
		verifyByteRecord(record, bytes, `Paper ${label}`);
	}

	const deviationDirectory = path.join(manifestDirectory, "deviations");
	const deviationFiles = (await readdir(deviationDirectory))
		.filter((name) => name.endsWith(".yaml"))
		.sort();
	const deviations = await Promise.all(
		deviationFiles.map(async (name) =>
			parseYaml(await readFile(path.join(deviationDirectory, name), "utf8")),
		),
	);

	const baseline = manifest.rejectedRoutedBaseline;
	if (
		!baseline?.path ||
		!Number.isInteger(baseline.fileCount) ||
		!baseline.treeSha256 ||
		!baseline.rejectionRecord
	) {
		fail(
			"Rejected routed baseline must record path, count, tree hash, and rejection record",
		);
	}
	await readFile(repositoryPath(root, baseline.rejectionRecord));
	const screenshotRoot = repositoryPath(root, baseline.path);
	if (!(await stat(screenshotRoot)).isDirectory()) {
		fail("Rejected routed baseline path is not a directory");
	}
	const screenshotFiles = (await walkFiles(screenshotRoot)).sort((a, b) =>
		a.relative < b.relative ? -1 : a.relative > b.relative ? 1 : 0,
	);
	if (screenshotFiles.length !== baseline.fileCount) {
		fail(`Rejected routed baseline file count changed: ${baseline.path}`);
	}
	const tree = createHash("sha256");
	for (const file of screenshotFiles) {
		tree.update(
			`${sha256(await readFile(file.absolute))}  ${file.relative}\n`,
			"utf8",
		);
	}
	if (tree.digest("hex") !== baseline.treeSha256) {
		fail(`Rejected routed baseline tree SHA-256 changed: ${baseline.path}`);
	}

	validateAuthorityRegistry({
		manifest,
		cases: visualAuthorityCases,
		canonicalArtifacts: screenshotFiles.map((file) => file.relative),
		rejectedArtifacts: r05RejectedCanonicalArtifacts,
		deviations,
	});
	return {
		caseCount: visualAuthorityCases.length,
		paperExportCount: collectLeafExports(manifest.surfaces).length,
		rejectedArtifactCount: screenshotFiles.length,
	};
}
