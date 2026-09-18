import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import {
	r05RejectedCanonicalArtifacts,
	supersessionAuthorities as registeredSupersessionAuthorities,
	requiredOwnerSupersededSurfaces,
	requiredPaperCoverage,
	requiredRuntimeCoverage,
	surfaceAuthorities,
	visualAuthorityCases,
} from "../tests/browser/visual-authority-cases.mjs";
import {
	assertPlainAuthorityCase,
	OWNER_SUPERSEDED_SURFACES,
	OWNER_SUPERSESSION_DECISION,
	OWNER_SURFACE_BINDINGS,
	ownerSupersessionRevocationFailure,
	resolveCaseAuthorityIdentity,
	validateOwnerSurfaceBindings,
} from "./owner-supersession-policy.mjs";

const manifestRelativePath =
	"visual-direction-gate/approved/paper-route-authority-20260902/AUTHORITY_MANIFEST.yaml";
const requiredOwnerLandmarks = [
	"owner-global-shell",
	"owner-shared-navigation",
	"owner-active-panel",
];
const activeSurfaceAuthorityStatuses = new Set([
	"ACCEPTED_PAPER_AUTHORITY",
	"ACCEPTED_SPLIT_AUTHORITY",
]);
const supersededSurfaceAuthorityStatuses = new Set([
	"SUPERSEDED_FOR_OWNER_REDESIGN",
]);
const manifestSurfaceStatuses = new Set([
	...activeSurfaceAuthorityStatuses,
	...supersededSurfaceAuthorityStatuses,
]);

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

/**
 * Fail-closed ADR-009 policy cross-check shared by repository verification and
 * registry validation. The closed seven-surface Owner domain and the standing
 * decision identity come from `scripts/owner-supersession-policy.mjs`, never
 * from the registry, the manifest, or a caller, so trimming or mutating
 * repository data cannot shrink the domain. Byte verification elsewhere proves
 * file identity only; it never proves a human decision, and no revocation is
 * accepted while the successor protocol is disabled.
 */
function assertOwnerSupersessionPolicy(authorities) {
	if (!Array.isArray(authorities)) {
		fail("Registered supersession authorities must be an array");
	}
	for (const authority of authorities) {
		if (!Array.isArray(authority?.surfaces)) {
			fail(
				`Supersession authority ${authority?.path ?? "(missing path)"} must list its surfaces`,
			);
		}
	}
	const standingDecisions = authorities.filter(
		(authority) => authority.path === OWNER_SUPERSESSION_DECISION.path,
	);
	if (standingDecisions.length !== 1) {
		fail(
			`Owner supersession policy requires exactly one registered authority at ${OWNER_SUPERSESSION_DECISION.path}; found ${standingDecisions.length}`,
		);
	}
	const [decision] = standingDecisions;
	if (
		decision.bytes !== OWNER_SUPERSESSION_DECISION.bytes ||
		decision.sha256 !== OWNER_SUPERSESSION_DECISION.sha256
	) {
		fail(
			`Supersession authority ${OWNER_SUPERSESSION_DECISION.path} does not match the pinned ADR-009 decision byte count and SHA-256`,
		);
	}
	const decisionSurfaces = new Set(decision.surfaces);
	const missing = OWNER_SUPERSEDED_SURFACES.filter(
		(surfaceKey) => !decisionSurfaces.has(surfaceKey),
	);
	const extra = decision.surfaces.filter(
		(surfaceKey) => !OWNER_SUPERSEDED_SURFACES.includes(surfaceKey),
	);
	if (missing.length || extra.length) {
		fail(
			`Owner supersession policy requires the exact ADR-009 surface set; missing: [${missing.join(", ")}]; extra: [${extra.join(", ")}]`,
		);
	}
	for (const authority of authorities) {
		if (authority === decision) continue;
		const overlaps = authority.surfaces.filter((surfaceKey) =>
			OWNER_SUPERSEDED_SURFACES.includes(surfaceKey),
		);
		if (overlaps.length) {
			fail(
				`Supersession authority ${authority.path} may not name Owner supersession policy surfaces: ${overlaps.join(", ")}`,
			);
		}
	}
	for (const authority of authorities) {
		if (authority.revokedBy === null || authority.revokedBy === undefined) {
			continue;
		}
		fail(ownerSupersessionRevocationFailure(authority.path));
	}
}

/**
 * Reads every registered supersession record and enforces its real-file byte
 * pin, then enforces the ADR-009 Owner supersession policy against the
 * registered records. A non-null `revokedBy` is never followed to another byte
 * record: with no successor protocol enabled it fails closed, because
 * repository bytes cannot prove human authorization.
 */
export async function verifySupersessionAuthorities(
	root,
	authorities = registeredSupersessionAuthorities,
) {
	for (const authority of authorities) {
		const bytes = await readFile(repositoryPath(root, authority.path));
		verifyByteRecord(authority, bytes, `Supersession record ${authority.path}`);
	}
	assertOwnerSupersessionPolicy(authorities);
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
	supersessionAuthorities = registeredSupersessionAuthorities,
}) {
	// Enforcement-owned policy first: the exact seven-surface binding table is
	// validated before any manifest, registry, or case data is interpreted.
	validateOwnerSurfaceBindings();
	// Plainness gate and single normalization: every case is checked for own
	// accessors and non-data values, then cloned once into a data snapshot. No
	// raw case object is read after this point, so a code-shaped case cannot
	// present different claims to different consumers.
	const authorityCases = Array.isArray(cases)
		? cases.map((authorityCase) => {
				assertPlainAuthorityCase(undefined, authorityCase);
				return structuredClone(authorityCase);
			})
		: cases;
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
	for (const [surfaceKey, surface] of Object.entries(manifest.surfaces ?? {})) {
		if (!manifestSurfaceStatuses.has(surface?.status)) {
			fail(
				`surface ${surfaceKey} has unknown authority status ${surface?.status ?? "(missing)"}`,
			);
		}
	}

	const supersessionByPath = new Map();
	for (const authority of supersessionAuthorities) {
		const authorityPath = authority?.path;
		assertNonempty(authorityPath, "SupersessionAuthority.path");
		if (supersessionByPath.has(authorityPath)) {
			fail(`Duplicate supersession authority: ${authorityPath}`);
		}
		if (!Number.isInteger(authority.bytes) || !authority.sha256) {
			fail(`Supersession authority ${authorityPath} is missing its byte pin`);
		}
		if (!Array.isArray(authority.surfaces)) {
			fail(`Supersession authority ${authorityPath} must list its surfaces`);
		}
		for (const surfaceKey of authority.surfaces) {
			if (typeof surfaceKey !== "string" || !surfaceKey.trim()) {
				fail(
					`Supersession authority ${authorityPath} must name its surfaces with non-empty strings`,
				);
			}
		}
		supersessionByPath.set(authorityPath, authority);
	}
	// Enforcement-owned ADR-009 policy: the closed seven-surface Owner domain and
	// the standing decision identity come from
	// `scripts/owner-supersession-policy.mjs`, never from a caller, the registry,
	// or the manifest. The registry is evidence to cross-check: trimming it
	// cannot shrink the domain (the exact difference is reported), no other
	// authority may name a policy surface, any non-null revocation fails closed,
	// and each policy surface must stay superseded, name the standing decision,
	// carry no ACCEPTED case, and keep at least one registered case.
	assertOwnerSupersessionPolicy(supersessionAuthorities);
	// Registry evidence cross-checks: the registry's Paper family map and its
	// exported superseded-surface mirror must agree with the policy root, so
	// editing registry evidence cannot move a binding's Paper area or shrink the
	// enforced domain.
	for (const binding of OWNER_SURFACE_BINDINGS) {
		if (surfaceAuthorities[binding.surface] !== binding.paperArea) {
			fail(
				`Registry Paper family for ${binding.surface} is ${JSON.stringify(surfaceAuthorities[binding.surface] ?? null)}; the enforcement-owned binding pins ${JSON.stringify(binding.paperArea)}`,
			);
		}
	}
	const registryPolicySurfaces = new Set(requiredOwnerSupersededSurfaces);
	const missingRegistrySurfaces = OWNER_SUPERSEDED_SURFACES.filter(
		(surfaceKey) => !registryPolicySurfaces.has(surfaceKey),
	);
	const extraRegistrySurfaces = [...registryPolicySurfaces].filter(
		(surfaceKey) => !OWNER_SUPERSEDED_SURFACES.includes(surfaceKey),
	);
	if (
		registryPolicySurfaces.size !== OWNER_SUPERSEDED_SURFACES.length ||
		missingRegistrySurfaces.length ||
		extraRegistrySurfaces.length
	) {
		fail(
			`Registry evidence must mirror the enforcement-owned Owner surface domain exactly; missing: [${missingRegistrySurfaces.join(", ")}]; extra: [${extraRegistrySurfaces.join(", ")}]`,
		);
	}
	// Identity resolution precedes every status-specific check: mutable claims
	// are normalized against the enforcement-owned bindings first, so a
	// relabeled or partially substituted Owner case fails here before any
	// acceptance logic, evidence read, or status-conditioned inventory.
	const identityByCase = new Map();
	for (const authorityCase of authorityCases) {
		const identity = resolveCaseAuthorityIdentity(authorityCase);
		if (
			identity.domain === "owner" &&
			!OWNER_SURFACE_BINDINGS.some(
				(binding) => binding.surface === identity.surface,
			)
		) {
			fail(
				`${authorityCase.id} normalized to an unregistered Owner surface ${identity.surface}`,
			);
		}
		identityByCase.set(authorityCase, identity);
	}
	// Artifact inventory: a routed artifact may be presented by at most one
	// case. Every case here already has a normalized identity.
	const acceptedArtifacts = new Map();
	for (const authorityCase of authorityCases) {
		const artifactPath = authorityCase?.routedArtifact?.path;
		if (!artifactPath || authorityCase.status === "PLANNED") continue;
		if (acceptedArtifacts.has(artifactPath)) {
			fail(
				`${artifactPath} is assigned to both ${acceptedArtifacts.get(artifactPath)} and ${authorityCase.id}`,
			);
		}
		acceptedArtifacts.set(artifactPath, authorityCase.id);
	}
	for (const surfaceKey of OWNER_SUPERSEDED_SURFACES) {
		const surface = manifest.surfaces?.[surfaceKey];
		if (!surface) {
			fail(
				`required superseded Owner surface ${surfaceKey} is missing from the manifest surfaces`,
			);
		}
		if (!supersededSurfaceAuthorityStatuses.has(surface.status)) {
			fail(
				`surface ${surfaceKey} cannot return to active authority while supersession authority ${OWNER_SUPERSESSION_DECISION.path} is not revoked (found status ${surface.status ?? "(missing)"})`,
			);
		}
		if (surface.supersededBy !== OWNER_SUPERSESSION_DECISION.path) {
			fail(
				`surface ${surfaceKey} supersededBy must be the standing supersession decision ${OWNER_SUPERSESSION_DECISION.path}`,
			);
		}
		const acceptedCase = authorityCases.find(
			(authorityCase) =>
				authorityCase.status === "ACCEPTED" &&
				identityByCase.get(authorityCase).surface === surfaceKey,
		);
		if (acceptedCase) {
			fail(
				`${acceptedCase.id} cannot be ACCEPTED on surface ${surfaceKey} while supersession authority ${OWNER_SUPERSESSION_DECISION.path} is not revoked`,
			);
		}
		if (
			!authorityCases.some(
				(authorityCase) =>
					identityByCase.get(authorityCase).surface === surfaceKey,
			)
		) {
			fail(
				`required superseded Owner surface ${surfaceKey} has no registered visual-authority case; deleting a surface's cases cannot sanitize its supersession record`,
			);
		}
	}
	// Production-coverage completeness: every pinned canonical artifact is
	// presented by exactly one case whose normalized identity is that binding.
	for (const binding of OWNER_SURFACE_BINDINGS) {
		for (const artifactPath of binding.canonicalArtifacts) {
			const presenters = authorityCases.filter(
				(authorityCase) => authorityCase?.routedArtifact?.path === artifactPath,
			);
			if (presenters.length !== 1) {
				fail(
					`${binding.surface} pinned canonical artifact ${artifactPath} must be presented by exactly one registered case; found ${presenters.length}`,
				);
			}
			const [presenter] = presenters;
			const presenterIdentity = identityByCase.get(presenter);
			if (presenterIdentity?.surface !== binding.surface) {
				fail(
					`${artifactPath} is pinned to ${binding.surface} but presented by ${presenter.id} with normalized identity ${presenterIdentity?.surface ?? "(none)"}`,
				);
			}
		}
	}
	// Re-acceptance guard: a surface covered by a supersession record may not
	// regain active authority. Revocation is disabled by policy, so the guard is
	// unconditional: neither a manifest status change nor a re-accepted case can
	// retire it.
	for (const authority of supersessionAuthorities) {
		for (const surfaceKey of authority.surfaces) {
			const surface = manifest.surfaces?.[surfaceKey];
			if (!surface) {
				fail(
					`Supersession authority ${authority.path} covers unregistered surface ${surfaceKey}`,
				);
			}
			if (!supersededSurfaceAuthorityStatuses.has(surface.status)) {
				fail(
					`surface ${surfaceKey} cannot return to active authority while supersession authority ${authority.path} is not revoked (found status ${surface.status ?? "(missing)"})`,
				);
			}
			if (surface.supersededBy !== authority.path) {
				fail(
					`surface ${surfaceKey} supersededBy must be the registered supersession record ${authority.path}`,
				);
			}
			for (const authorityCase of authorityCases) {
				if (
					authorityCase.status === "ACCEPTED" &&
					identityByCase.get(authorityCase).surface === surfaceKey
				) {
					fail(
						`${authorityCase.id} cannot be ACCEPTED on surface ${surfaceKey} while supersession authority ${authority.path} is not revoked`,
					);
				}
			}
		}
	}
	// Coverage guard: a surface that is still superseded must remain named by a
	// registered record, so deleting its coverage is itself a detectable change.
	// The guard is unconditional; it never consults revocation state.
	const registeredSupersessionSurfaces = new Set(
		supersessionAuthorities.flatMap((authority) => authority.surfaces),
	);
	for (const [surfaceKey, surface] of Object.entries(manifest.surfaces ?? {})) {
		if (
			supersededSurfaceAuthorityStatuses.has(surface?.status) &&
			!registeredSupersessionSurfaces.has(surfaceKey)
		) {
			fail(`surface ${surfaceKey} has no registered supersession authority`);
		}
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
		(!authorityCases.length ||
			authorityCases.some((entry) => entry.status !== "ACCEPTED"))
	)
		fail(
			"Final visual authority requires every registered case to be ACCEPTED; superseded cases must be replaced by a new accepted case before final authority can be claimed",
		);
	const deviationById = new Map(
		deviations.map((record) => [record.id, record]),
	);
	if (deviationById.size !== deviations.length)
		fail("Deviation IDs must be unique");
	const caseIds = new Set();
	for (const authorityCase of authorityCases) {
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
		if (!["PLANNED", "ACCEPTED", "SUPERSEDED"].includes(authorityCase.status))
			fail(
				`${authorityCase.id} has an unsupported status; expected PLANNED, ACCEPTED, or SUPERSEDED`,
			);
		if (
			!["paper", "runtime-interpolation"].includes(authorityCase.comparisonMode)
		)
			fail(`${authorityCase.id} has an unsupported comparison mode`);
		if (authorityCase.status === "SUPERSEDED") {
			assertNonempty(
				authorityCase.supersessionRecord,
				`${authorityCase.id}.supersessionRecord`,
			);
			if (!supersessionByPath.has(authorityCase.supersessionRecord)) {
				fail(
					`${authorityCase.id} supersessionRecord is not a registered supersession authority: ${authorityCase.supersessionRecord}`,
				);
			}
			assertNonempty(
				authorityCase.routedArtifact?.path,
				`${authorityCase.id}.routedArtifact.path`,
			);
			requireEvidence(
				authorityCase.supersessionRecord,
				`${authorityCase.id}.supersessionRecord`,
			);
			continue;
		}
		if (authorityCase.status !== "ACCEPTED") continue;
		const identity = identityByCase.get(authorityCase);
		const surface = manifest.surfaces?.[identity.surface];
		if (
			!surface ||
			authorityCase.paperReference.area !== surfaceAuthorities[identity.surface]
		)
			fail(`${authorityCase.id} has an unregistered Paper family`);
		if (!activeSurfaceAuthorityStatuses.has(surface.status)) {
			fail(
				`${authorityCase.id} cannot be ACCEPTED while surface ${identity.surface} is ${surface.status}`,
			);
		}

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
		if (identity.ownerSection) {
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
				const match = authorityCases.some(
					(authorityCase) =>
						identityByCase.get(authorityCase).surface === requirement.surface &&
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
	// Identity normalization precedes every evidence read: contradictory
	// authority claims fail before any acceptance logic can consume a raw,
	// mutable classification field. Plainness and normalization come first:
	// accessor-bearing cases are rejected, and every later read — identity,
	// evidence collection, final byte checks, counts — consumes one data
	// snapshot per case, never the raw possibly code-shaped object.
	const authorityCases = visualAuthorityCases.map((authorityCase) => {
		assertPlainAuthorityCase(undefined, authorityCase);
		return structuredClone(authorityCase);
	});
	const authorityIdentities = authorityCases.map((authorityCase) => ({
		authorityCase,
		identity: resolveCaseAuthorityIdentity(authorityCase),
	}));
	const manifestPath = repositoryPath(root, manifestRelativePath);
	const manifest = parseYaml(await readFile(manifestPath, "utf8"));
	const manifestDirectory = path.dirname(manifestPath);
	for (const { record, label } of collectLeafExports(manifest.surfaces)) {
		const bytes = await readFile(path.resolve(manifestDirectory, record.path));
		verifyByteRecord(record, bytes, `Paper ${label}`);
	}
	await verifySupersessionAuthorities(root);

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
	for (const authorityCase of authorityCases.filter(
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
	for (const { authorityCase, identity } of authorityIdentities) {
		if (authorityCase.status !== "SUPERSEDED") continue;
		// The normalized identity supplies the enforcement-owned standing
		// decision for Owner cases; the raw record is only evidence for any
		// non-Owner supersession.
		await readEvidence(
			identity.domain === "owner"
				? identity.standingDecision
				: authorityCase.supersessionRecord,
		);
	}
	validateAuthorityRegistry({
		availableEvidencePaths,
		manifest,
		cases: authorityCases,
		canonicalArtifacts: screenshotFiles.map((file) => file.relative),
		rejectedArtifacts: r05RejectedCanonicalArtifacts,
		deviations,
		requiredCoverage: [...requiredPaperCoverage, ...requiredRuntimeCoverage],
	});
	for (const authorityCase of authorityCases) {
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
		caseCount: authorityCases.length,
		acceptedCaseCount: authorityCases.filter(
			(entry) => entry.status === "ACCEPTED",
		).length,
		supersededCaseCount: authorityCases.filter(
			(entry) => entry.status === "SUPERSEDED",
		).length,
		paperExportCount: collectLeafExports(manifest.surfaces).length,
		rejectedArtifactCount: screenshotFiles.length,
	};
}
