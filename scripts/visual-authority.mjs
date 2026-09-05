import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
	r05RejectedCanonicalArtifacts,
	requiredPaperCoverage,
	requiredRuntimeCoverage,
	surfaceAuthorities,
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

export function verifyShaRecord(record, bytes, label = "artifact") {
	if (!record?.path || !record.sha256) {
		fail(`${label} is missing path or sha256`);
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

function collectFileRecords(value, label = "record") {
	if (!value || typeof value !== "object") return [];
	if (Array.isArray(value)) {
		return value.flatMap((entry, index) =>
			collectFileRecords(entry, `${label}[${index}]`),
		);
	}
	if (
		typeof value.path === "string" &&
		Number.isInteger(value.bytes) &&
		typeof value.sha256 === "string"
	) {
		return [{ label, record: value }];
	}
	return Object.entries(value).flatMap(([key, child]) =>
		collectFileRecords(child, `${label}.${key}`),
	);
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
	requiredCoverage = [],
	availableEvidencePaths = [],
}) {
	if (
		manifest.schemaVersion !== 1 ||
		!["IN_PROGRESS", "ACCEPTED_CURRENT"].includes(manifest.status)
	) {
		fail(
			"Route visual-authority manifest must be schema 1 and either IN_PROGRESS or ACCEPTED_CURRENT",
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

	const evidencePaths = new Set(availableEvidencePaths);
	const requireEvidence = (value, label) => {
		const records = Array.isArray(value) ? value : [value];
		if (!records.length) fail(`${label} is missing evidence`);
		for (const record of records) {
			const evidencePath = typeof record === "string" ? record : record?.path;
			if (
				!evidencePath ||
				/PENDING/i.test(evidencePath) ||
				!evidencePaths.has(evidencePath)
			)
				fail(`${label} has unresolved evidence`);
		}
	};
	if (
		manifest.status === "ACCEPTED_CURRENT" &&
		(!cases.length || cases.some((entry) => entry.status !== "ACCEPTED"))
	)
		fail(
			"Final visual authority requires every registered case to be ACCEPTED",
		);
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
		if (!["PLANNED", "ACCEPTED"].includes(authorityCase.status))
			fail(`${authorityCase.id} has an unsupported status`);
		if (
			!["paper", "runtime-interpolation"].includes(authorityCase.comparisonMode)
		)
			fail(`${authorityCase.id} has an unsupported comparison mode`);
		if (authorityCase.status !== "ACCEPTED") continue;
		const surface = manifest.surfaces?.[authorityCase.surface];
		if (
			!surface ||
			authorityCase.paperReference.area !==
				surfaceAuthorities[authorityCase.surface]
		)
			fail(`${authorityCase.id} has an unregistered Paper family`);

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
		if (authorityCase.comparisonMode === "paper") {
			const matchedLeaf = collectLeafExports(surface).some(
				({ record }) =>
					record.path === authorityCase.paperReference.leafExportPath &&
					record.sha256 === authorityCase.paperReference.leafExportSha256,
			);
			if (!matchedLeaf)
				fail(`${authorityCase.id} has an unregistered Paper export or hash`);
		} else {
			requireEvidence(
				authorityCase.runtimeReviewRecord,
				`${authorityCase.id}.runtimeReviewRecord`,
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
		requireEvidence(
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
				requireEvidence(value, `${deviationId}.${evidence}`);
			}
		}
	}

	for (const requirement of requiredCoverage) {
		for (const locale of ["ar", "en"]) {
			for (const viewport of requirement.viewports) {
				const match = cases.some(
					(authorityCase) =>
						authorityCase.surface === requirement.surface &&
						authorityCase.state === requirement.state &&
						authorityCase.locale === locale &&
						authorityCase.comparisonMode ===
							(requirement.comparisonMode ?? "paper") &&
						authorityCase.viewport?.width === viewport.width &&
						authorityCase.viewport?.height === viewport.height &&
						(authorityCase.viewport?.zoom ?? 1) === (viewport.zoom ?? 1),
				);
				if (!match) {
					fail(
						`Required route visual coverage is missing: ${requirement.surface}/${requirement.state}/${locale}/${viewport.width}x${viewport.height}${viewport.zoom ? `@${viewport.zoom}x` : ""}`,
					);
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
	for (const [deviationIndex, deviation] of deviations.entries()) {
		for (const { record, label } of collectFileRecords(
			deviation.reviewEvidence,
			`deviations[${deviationIndex}].reviewEvidence`,
		)) {
			const bytes = await readFile(repositoryPath(root, record.path));
			verifyByteRecord(record, bytes, label);
		}
	}

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

	const availableEvidencePaths = [];
	const readEvidence = async (value) => {
		for (const record of Array.isArray(value) ? value : [value]) {
			const evidencePath = typeof record === "string" ? record : record?.path;
			if (!evidencePath || /PENDING/i.test(evidencePath))
				fail("Accepted evidence is missing or pending");
			const bytes = await readFile(repositoryPath(root, evidencePath));
			if (!bytes.length) fail(`Empty acceptance evidence: ${evidencePath}`);
			if (typeof record === "object")
				verifyByteRecord(record, bytes, evidencePath);
			availableEvidencePaths.push(evidencePath);
		}
	};
	for (const authorityCase of visualAuthorityCases.filter(
		(entry) => entry.status === "ACCEPTED",
	)) {
		await readEvidence(authorityCase.approvalRecord);
		if (authorityCase.comparisonMode === "runtime-interpolation")
			await readEvidence(authorityCase.runtimeReviewRecord);
		for (const id of authorityCase.approvedDeviationIds ?? []) {
			const deviation = deviations.find((entry) => entry.id === id);
			for (const field of [
				"routedBefore",
				"routedAfter",
				"independentRenderedReview",
			])
				await readEvidence(deviation?.reviewEvidence?.[field]);
		}
	}
	validateAuthorityRegistry({
		availableEvidencePaths,
		manifest,
		cases: visualAuthorityCases,
		canonicalArtifacts: screenshotFiles.map((file) => file.relative),
		rejectedArtifacts: r05RejectedCanonicalArtifacts,
		deviations,
		requiredCoverage: [...requiredPaperCoverage, ...requiredRuntimeCoverage],
	});
	for (const authorityCase of visualAuthorityCases) {
		if (authorityCase.status !== "ACCEPTED") continue;
		const relativeArtifactPath = path.posix.join(
			baseline.path.replaceAll("\\", "/"),
			authorityCase.routedArtifact.path,
		);
		const bytes = await readFile(repositoryPath(root, relativeArtifactPath));
		verifyShaRecord(
			authorityCase.routedArtifact,
			bytes,
			`Accepted routed artifact ${authorityCase.id}`,
		);
	}
	return {
		caseCount: visualAuthorityCases.length,
		paperExportCount: collectLeafExports(manifest.surfaces).length,
		rejectedArtifactCount: screenshotFiles.length,
	};
}
