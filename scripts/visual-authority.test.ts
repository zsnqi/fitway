import { createHash } from "node:crypto";
import {
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
	r05RejectedCanonicalArtifacts,
	requiredOwnerSupersededSurfaces,
	requiredPaperCoverage,
	requiredRuntimeCoverage,
	supersessionAuthorities,
	surfaceAuthorities,
	visualAuthorityCases,
} from "../tests/browser/visual-authority-cases.mjs";
import {
	assertPlainAuthorityCase,
	NON_OWNER_ROUTE_BY_SURFACE,
	OWNER_SUPERSEDED_SURFACES,
	OWNER_SUPERSESSION_DECISION,
	OWNER_SUPERSESSION_SUCCESSOR_PROTOCOL,
	OWNER_SURFACE_BINDINGS,
	resolveCaseAuthorityIdentity,
	validateOwnerSurfaceBindings,
} from "./owner-supersession-policy.mjs";
import {
	validateAuthorityRegistry,
	verifyByteRecord,
	verifyShaRecord,
	verifySupersessionAuthorities,
	verifyVisualAuthorityRepository,
} from "./visual-authority.mjs";

const repositoryRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const manifestPath = path.join(
	repositoryRoot,
	"visual-direction-gate",
	"approved",
	"paper-route-authority-20260902",
	"AUTHORITY_MANIFEST.yaml",
);
const manifestDirectory = path.dirname(manifestPath);
const realManifest = parseYaml(readFileSync(manifestPath, "utf8"));
const realDeviations = readdirSync(path.join(manifestDirectory, "deviations"))
	.filter((name) => name.endsWith(".yaml"))
	.sort()
	.map((name) =>
		parseYaml(
			readFileSync(path.join(manifestDirectory, "deviations", name), "utf8"),
		),
	);

function collectEvidencePaths(cases, deviations) {
	const evidence = new Set();
	const add = (value) => {
		for (const record of Array.isArray(value) ? value : [value]) {
			const evidencePath = typeof record === "string" ? record : record?.path;
			if (evidencePath) evidence.add(evidencePath);
		}
	};
	const deviationById = new Map(
		deviations.map((record) => [record.id, record]),
	);
	for (const authorityCase of cases) {
		if (authorityCase.status === "ACCEPTED") {
			add(authorityCase.approvalRecord);
			if (authorityCase.comparisonMode === "runtime-interpolation") {
				add(authorityCase.runtimeReviewRecord);
			}
		}
		if (authorityCase.status === "SUPERSEDED") {
			add(authorityCase.supersessionRecord);
		}
		for (const id of authorityCase.approvedDeviationIds ?? []) {
			const deviation = deviationById.get(id);
			for (const field of [
				"routedBefore",
				"routedAfter",
				"independentRenderedReview",
			]) {
				add(deviation?.reviewEvidence?.[field]);
			}
		}
	}
	return [...evidence];
}

const realEvidencePaths = collectEvidencePaths(
	visualAuthorityCases,
	realDeviations,
);
const realCanonicalArtifacts = visualAuthorityCases
	.filter((authorityCase) => authorityCase.routedArtifact)
	.map((authorityCase) => authorityCase.routedArtifact.path);

function cloneManifest() {
	return structuredClone(realManifest);
}

function cloneCases() {
	return structuredClone(visualAuthorityCases);
}

function cloneAuthorities() {
	return structuredClone(supersessionAuthorities);
}

function validate(overrides: Record<string, unknown> = {}) {
	const cases = overrides.cases ?? cloneCases();
	const deviations = overrides.deviations ?? realDeviations;
	return validateAuthorityRegistry({
		manifest: overrides.manifest ?? cloneManifest(),
		cases,
		supersessionAuthorities:
			overrides.supersessionAuthorities ?? cloneAuthorities(),
		canonicalArtifacts:
			overrides.canonicalArtifacts ??
			cases
				.filter((authorityCase) => authorityCase.routedArtifact)
				.map((authorityCase) => authorityCase.routedArtifact.path),
		rejectedArtifacts: overrides.rejectedArtifacts ?? [
			...r05RejectedCanonicalArtifacts,
		],
		deviations,
		requiredCoverage: overrides.requiredCoverage ?? [
			...requiredPaperCoverage,
			...requiredRuntimeCoverage,
		],
		availableEvidencePaths:
			overrides.availableEvidencePaths ??
			collectEvidencePaths(cases, deviations),
	});
}

function withExtraCases(
	extraCases,
	{ extraEvidence = [], deviations = realDeviations, ...overrides } = {},
) {
	const cases = [...cloneCases(), ...structuredClone(extraCases)];
	return validate({
		cases,
		deviations,
		availableEvidencePaths: overrides.availableEvidencePaths ?? [
			...new Set([...realEvidencePaths, ...extraEvidence]),
		],
		...overrides,
	});
}

function staffLeaf() {
	const leaf = (realManifest.surfaces.staff?.leafExports ?? []).find(
		(record) => record?.path && record?.sha256,
	);
	if (!leaf) {
		throw new Error(
			"The real staff Paper leaf export is missing from the route manifest",
		);
	}
	return leaf;
}

function acceptedCase(overrides: Record<string, unknown> = {}) {
	const leaf = staffLeaf();
	return {
		id: "staff-synthetic-live-en-desktop",
		status: "ACCEPTED",
		surface: "staff",
		route: "/staff",
		state: "live",
		locale: "en",
		viewport: { width: 1440, height: 900 },
		comparisonMode: "paper",
		paperReference: {
			area: surfaceAuthorities.staff,
			leafExportPath: leaf.path,
			leafExportSha256: leaf.sha256,
		},
		routedArtifact: {
			kind: "canonical",
			path: "synthetic/staff-synthetic-live.png",
			sha256: "route-sha",
		},
		landmarkContracts: ["application-shell", "route-main"],
		approvalRecord: "approval.md",
		approvedDeviationIds: [],
		...overrides,
	};
}

function supersededOwnerCase(overrides: Record<string, unknown> = {}) {
	return {
		id: "owner-activity-synthetic-superseded",
		status: "SUPERSEDED",
		surface: "ownerActivityLog",
		route: "/admin",
		ownerSection: "activity",
		state: "populated",
		locale: "en",
		viewport: { width: 1440, height: 900 },
		comparisonMode: "paper",
		paperReference: { area: surfaceAuthorities.ownerActivityLog },
		routedArtifact: {
			kind: "canonical",
			path: "synthetic/owner-activity-synthetic-superseded.png",
			sha256: "route-sha",
		},
		landmarkContracts: [
			"owner-global-shell",
			"owner-shared-navigation",
			"owner-active-panel",
		],
		approvalRecord: null,
		supersessionRecord: OWNER_SUPERSESSION_DECISION.path,
		approvedDeviationIds: [],
		...overrides,
	};
}

const staffApprovalRecord =
	"docs/phase-records/handoffs/owner-demo-polish/20260908-presentation-ready-r06-visual-acceptance.md";

const bindingBaseCaseIds: Record<string, string> = {
	ownerSharedNavigation: "ownerSharedNavigation--daily-active--ar--desktop",
	ownerDaily: "ownerDaily--completed--ar--desktop",
	ownerReports: "ownerReports--comparable--ar--desktop",
	ownerAccountsAndSignIn: "ownerAccountsAndSignIn--created--ar--desktop",
	ownerActivityLog: "ownerActivityLog--populated--ar--desktop",
	ownerSystemStatus: "ownerSystemStatus--populated--ar--desktop",
	ownerSettings: "ownerSettings--clean--en--desktop",
};

const artifactOwnerBindings = OWNER_SURFACE_BINDINGS.filter(
	(binding) => binding.canonicalArtifacts.length > 0,
);

const expectedOwnerBindings = [
	{
		surface: "ownerSharedNavigation",
		adrSurface: "owner-shared-navigation",
		ownerSection: "shared-navigation",
		route: "/admin",
		paperArea: "OWNER SHARED NAVIGATION — FULL-ROUTE SUCCESSOR — CURRENT",
		canonicalArtifacts: [],
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	},
	{
		surface: "ownerDaily",
		adrSurface: "owner-daily",
		ownerSection: "daily",
		route: "/admin",
		paperArea: "OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT",
		canonicalArtifacts: [
			"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png",
			"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-en-mobile-390x844.png",
		],
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	},
	{
		surface: "ownerReports",
		adrSurface: "owner-reports",
		ownerSection: "reports",
		route: "/admin",
		paperArea: "OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT",
		canonicalArtifacts: [],
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	},
	{
		surface: "ownerAccountsAndSignIn",
		adrSurface: "owner-access",
		ownerSection: "accounts",
		route: "/admin",
		paperArea: "OWNER ACCESS — BEHAVIOR-CORRECT SUCCESSOR — CURRENT",
		canonicalArtifacts: [],
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	},
	{
		surface: "ownerActivityLog",
		adrSurface: "owner-activity-log",
		ownerSection: "activity",
		route: "/admin",
		paperArea: "OWNER ACTIVITY LOG — SHARED-SHELL SUCCESSOR — CURRENT",
		canonicalArtifacts: [
			"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-ar-desktop-1440x900.png",
			"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-en-mobile-390x844.png",
		],
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	},
	{
		surface: "ownerSystemStatus",
		adrSurface: "owner-system-status",
		ownerSection: "system-status",
		route: "/admin",
		paperArea:
			"OWNER UPTIME & INCIDENTS PRODUCTION SET — CANDIDATE + OWNER UPTIME — MOBILE STACKED RECORDS SUCCESSOR",
		canonicalArtifacts: [
			"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-ar-desktop-1440x900.png",
			"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-en-mobile-390x844.png",
		],
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	},
	{
		surface: "ownerSettings",
		adrSurface: "owner-settings",
		ownerSection: "settings",
		route: "/admin",
		paperArea: "OWNER SETTINGS — FRESH r01 SUCCESSOR CANDIDATE",
		canonicalArtifacts: [
			"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-en-desktop-1440x900.png",
			"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-ar-mobile-390x844.png",
		],
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	},
];

const expectedOwnerArtifacts: Record<string, string[][]> = {
	ownerDaily: [
		[
			"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png",
			"1c3dfc4006df48252f69e707e7619d7e8460810525668f26ef8afd1120f07d89",
			"ownerDaily--completed--ar--desktop",
		],
		[
			"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-en-mobile-390x844.png",
			"b43131097456b32e92b61226eb91fde796a1ecd05989f82830cfd19fab0ae67d",
			"ownerDaily--completed--en--mobile",
		],
	],
	ownerActivityLog: [
		[
			"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-ar-desktop-1440x900.png",
			"c63e6675cdfdecdf8b3d504d7a2836a98908cb4c6765b8ad7a582e4db9c969eb",
			"ownerActivityLog--populated--ar--desktop",
		],
		[
			"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-en-mobile-390x844.png",
			"472aa6a031c2f119a529d250675a023c2127d8eb3586fb8070050e1d1c21a69f",
			"ownerActivityLog--populated--en--mobile",
		],
	],
	ownerSystemStatus: [
		[
			"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-ar-desktop-1440x900.png",
			"943a5b72be3a0c5a8c16fb9737e1321f7215ec79e086596af09258238ab5b516",
			"ownerSystemStatus--populated--ar--desktop",
		],
		[
			"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-en-mobile-390x844.png",
			"5c12cadce982570c5c7de3fcbd90262a9e15378691dd141f3572d0bdd86c5e53",
			"ownerSystemStatus--populated--en--mobile",
		],
	],
	ownerSettings: [
		[
			"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-en-desktop-1440x900.png",
			"f74e35849af287114402841ef39e8efbdad8f33835200bdcec7308058a1a74ec",
			"ownerSettings--clean--en--desktop",
		],
		[
			"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-ar-mobile-390x844.png",
			"394323e714c63515cf7ae880890544fe54d041773de74148c7d5cbf910bf931a",
			"ownerSettings--dirty--ar--mobile",
		],
	],
};

function realCaseById(id: string) {
	const authorityCase = visualAuthorityCases.find((entry) => entry.id === id);
	if (!authorityCase) throw new Error(`Missing real authority case ${id}`);
	return authorityCase;
}

function replaceCase(cases, id: string, mutate) {
	let replaced = false;
	const next = cases.map((authorityCase) => {
		if (authorityCase.id !== id) return authorityCase;
		replaced = true;
		return mutate(structuredClone(authorityCase));
	});
	if (!replaced) throw new Error(`Missing real authority case ${id}`);
	return next;
}

function withoutArtifactPresenters(cases, artifactPaths: string[]) {
	const paths = new Set(artifactPaths);
	return cases.filter(
		(authorityCase) => !paths.has(authorityCase.routedArtifact?.path),
	);
}

function nextBinding(binding) {
	const index = OWNER_SURFACE_BINDINGS.indexOf(binding);
	return OWNER_SURFACE_BINDINGS[(index + 1) % OWNER_SURFACE_BINDINGS.length];
}

function otherArtifactBinding(binding) {
	return artifactOwnerBindings.find(
		(entry) => entry.surface !== binding.surface,
	);
}

function acceptedNonOwnerCase(
	surface: string,
	overrides: Record<string, unknown> = {},
) {
	const leaf = (realManifest.surfaces[surface]?.leafExports ?? []).find(
		(record) => record?.path && record?.sha256,
	);
	if (!leaf) throw new Error(`Missing real ${surface} leaf export`);
	const id =
		(overrides.id as string) ?? `${surface}-synthetic-accepted-en-desktop`;
	return {
		id,
		status: "ACCEPTED",
		surface,
		route: NON_OWNER_ROUTE_BY_SURFACE[surface],
		state: "live",
		locale: "en",
		viewport: { width: 1440, height: 900 },
		comparisonMode: "paper",
		paperReference: {
			area: surfaceAuthorities[surface],
			leafExportPath: leaf.path,
			leafExportSha256: leaf.sha256,
		},
		routedArtifact: {
			kind: "canonical",
			path: `synthetic/${id}-routed.png`,
			sha256: "route-sha",
		},
		landmarkContracts: ["application-shell", "route-main"],
		approvalRecord: "approval.md",
		approvedDeviationIds: [],
		...overrides,
	};
}

const ownerSurfaces = [...OWNER_SUPERSEDED_SURFACES];
const caseStatuses = ["ACCEPTED", "SUPERSEDED", "PLANNED"];

function mutateSurfaceCases(cases, surface, status) {
	return cases.map((authorityCase) => {
		if (authorityCase.surface !== surface) return authorityCase;
		const next = { ...authorityCase, status };
		if (status === "SUPERSEDED") {
			next.supersessionRecord = OWNER_SUPERSESSION_DECISION.path;
		}
		return next;
	});
}

function trimSurfaceFromAuthorities(surface) {
	const authorities = cloneAuthorities();
	authorities[0].surfaces = authorities[0].surfaces.filter(
		(surfaceKey) => surfaceKey !== surface,
	);
	return authorities;
}

function activateSurface(manifest, surface) {
	manifest.surfaces[surface].status = "ACCEPTED_PAPER_AUTHORITY";
	return manifest;
}

describe("full-route visual authority", () => {
	it("accepts a Paper-mapped, approved full-route artifact", () => {
		expect(() => validate()).not.toThrow();
	});

	it("passes full repository verification on the unmodified real repository", async () => {
		const summary = await verifyVisualAuthorityRepository(repositoryRoot);
		expect(summary.caseCount).toBe(424);
		expect(summary.acceptedCaseCount).toBe(8);
		expect(summary.supersededCaseCount).toBe(8);
		expect(summary.paperExportCount).toBe(228);
		expect(summary.rejectedArtifactCount).toBe(41);
	});

	it("rejects final authority with planned cases", () => {
		const manifest = cloneManifest();
		manifest.status = "ACCEPTED_CURRENT";
		expect(() => validate({ manifest })).toThrow(
			/requires every registered case/,
		);
	});

	it("rejects superseded cases under final authority", () => {
		expect(
			visualAuthorityCases.some(
				(authorityCase) => authorityCase.status === "SUPERSEDED",
			),
		).toBe(true);
		const manifest = cloneManifest();
		manifest.status = "ACCEPTED_CURRENT";
		expect(() => validate({ manifest })).toThrow(
			/requires every registered case/,
		);
	});

	it("rejects unsupported modes and unregistered Paper identity", () => {
		expect(() =>
			withExtraCases([acceptedCase({ comparisonMode: "anything" })], {
				extraEvidence: ["approval.md"],
			}),
		).toThrow(/unsupported comparison/);
		expect(() =>
			withExtraCases(
				[
					acceptedCase({
						paperReference: {
							...acceptedCase().paperReference,
							area: "wrong",
						},
					}),
				],
				{ extraEvidence: ["approval.md"] },
			),
		).toThrow(/unregistered Paper family/);
		for (const change of [
			{ leafExportPath: "missing.png" },
			{ leafExportSha256: "wrong" },
		]) {
			expect(() =>
				withExtraCases(
					[
						acceptedCase({
							paperReference: {
								...acceptedCase().paperReference,
								...change,
							},
						}),
					],
					{ extraEvidence: ["approval.md"] },
				),
			).toThrow(/unregistered Paper export/);
		}
	});

	it("rejects unresolved approval and deviation evidence", () => {
		expect(() =>
			withExtraCases(
				[acceptedCase({ approvalRecord: "missing-approval.md" })],
				{
					extraEvidence: ["approval.md"],
				},
			),
		).toThrow(/approvalRecord has unresolved evidence/);
		expect(() =>
			withExtraCases(
				[acceptedCase({ approvedDeviationIds: ["bounded-polish"] })],
				{
					extraEvidence: ["approval.md", "before.png", "after.png"],
					deviations: [
						...realDeviations,
						{
							id: "bounded-polish",
							status: "IMPLEMENTED_AND_REVIEWED",
							reviewEvidence: {
								routedBefore: "before.png",
								routedAfter: "after.png",
								independentRenderedReview: "PENDING_FINAL_MILESTONE_REVIEW",
							},
						},
					],
				},
			),
		).toThrow(/unresolved evidence/);
	});

	it("requires reviewed runtime evidence without inventing an exact Paper leaf", () => {
		const runtime = acceptedCase({
			comparisonMode: "runtime-interpolation",
			paperReference: { area: surfaceAuthorities.staff },
			runtimeReviewRecord: "review.md",
		});
		expect(() =>
			withExtraCases([runtime], {
				extraEvidence: ["approval.md", "review.md"],
			}),
		).not.toThrow();
		expect(() =>
			withExtraCases([{ ...runtime, runtimeReviewRecord: null }], {
				extraEvidence: ["approval.md", "review.md"],
			}),
		).toThrow(/runtimeReviewRecord.*unresolved/);
	});

	it("rejects an unmapped canonical route state", () => {
		expect(() =>
			validate({
				canonicalArtifacts: [
					...realCanonicalArtifacts,
					"unmapped-route-state.png",
				],
			}),
		).toThrow(/lacks an authority entry/);
	});

	it("rejects a changed Paper export hash", () => {
		const bytes = Buffer.from("approved-paper-export");
		expect(() =>
			verifyByteRecord(
				{
					path: "paper.png",
					bytes: bytes.byteLength,
					sha256: createHash("sha256").update("different").digest("hex"),
				},
				bytes,
				"Paper export",
			),
		).toThrow(/SHA-256 changed/);
	});

	it("rejects a changed accepted routed artifact hash", () => {
		const bytes = Buffer.from("approved-paper-export");
		expect(() =>
			verifyShaRecord(
				{
					path: "route.png",
					sha256: createHash("sha256").update("different").digest("hex"),
				},
				bytes,
				"Accepted routed artifact",
			),
		).toThrow(/SHA-256 changed/);
	});

	it("rejects missing required Paper-covered viewport or state cases", () => {
		expect(() =>
			validate({
				requiredCoverage: [
					{
						surface: "ownerActivityLog",
						state: "populated",
						viewports: [{ width: 768, height: 1024 }],
					},
				],
			}),
		).toThrow(/Required route visual coverage is missing/);
	});

	it("rejects a baseline without a human approval record", () => {
		expect(() =>
			withExtraCases([acceptedCase({ approvalRecord: null })], {
				extraEvidence: ["approval.md"],
			}),
		).toThrow(/approvalRecord is required/);
	});

	it("rejects captureReview evidence as an acceptance verdict", () => {
		expect(() =>
			withExtraCases(
				[
					acceptedCase({
						routedArtifact: {
							kind: "review",
							path: "synthetic/staff-synthetic-live.png",
							sha256: "route-sha",
						},
					}),
				],
				{ extraEvidence: ["approval.md"] },
			),
		).toThrow(/cannot be accepted from a captureReview artifact/);
	});

	it("rejects an Owner section on a non-Owner label before any landmark logic", () => {
		// The old landmark-only rejection encoded the pre-normalization flow:
		// this same staff case with an Owner section now fails identity
		// normalization, which is the stronger fail-closed behavior.
		expect(() =>
			withExtraCases(
				[
					acceptedCase({
						ownerSection: "shared-navigation",
						landmarkContracts: ["owner-shared-navigation"],
					}),
				],
				{ extraEvidence: ["approval.md"] },
			),
		).toThrow(/contradictory authority claims/);
	});

	it("rejects unrecorded and unreviewed Paper deviations", () => {
		const withDeviation = acceptedCase({
			approvedDeviationIds: ["bounded-polish"],
		});
		expect(() =>
			withExtraCases([withDeviation], { extraEvidence: ["approval.md"] }),
		).toThrow(/unrecorded deviation/);
		expect(() =>
			withExtraCases([withDeviation], {
				extraEvidence: ["approval.md", "before.png", "after.png", "review.md"],
				deviations: [
					...realDeviations,
					{
						id: "bounded-polish",
						status: "APPROVED_PENDING_IMPLEMENTATION_EVIDENCE",
						reviewEvidence: {
							routedBefore: "before.png",
							routedAfter: "after.png",
							independentRenderedReview: "review.md",
						},
					},
				],
			}),
		).toThrow(/uses unreviewed deviation/);
	});

	it("accepts a superseded case with its enforcement-pinned routed artifact and record", () => {
		// A synthetic SUPERSEDED case must carry a pinned canonical artifact of
		// its binding and satisfy the registry's one-presenter-per-artifact
		// rule, so the fixture takes over a real presenter's exact artifact
		// rather than adding a second presentation of it.
		const pinnedArtifact =
			"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-ar-desktop-1440x900.png";
		const realPresenter = visualAuthorityCases.find(
			(authorityCase) => authorityCase.routedArtifact?.path === pinnedArtifact,
		);
		if (!realPresenter)
			throw new Error("Missing real pinned-artifact presenter");
		const synthetic = supersededOwnerCase({
			routedArtifact: {
				kind: "canonical",
				path: pinnedArtifact,
				sha256: realPresenter.routedArtifact.sha256,
			},
		});
		expect(() =>
			validate({
				cases: [
					...withoutArtifactPresenters(cloneCases(), [pinnedArtifact]),
					synthetic,
				],
			}),
		).not.toThrow();
	});

	it("rejects an accepted case on a superseded manifest surface", () => {
		expect(() =>
			withExtraCases(
				[
					acceptedCase({
						id: "owner-activity-synthetic-accepted",
						surface: "ownerActivityLog",
						ownerSection: "activity",
						paperReference: {
							area: surfaceAuthorities.ownerActivityLog,
							leafExportPath:
								"owner-activity-log/owner-activity-desktop-ar-populated-1440.png",
							leafExportSha256:
								"a781884fe9f9307392f180e5efc3e6f9cb34d93bfc34f428885ba1c700240a38",
						},
						landmarkContracts: [
							"owner-global-shell",
							"owner-shared-navigation",
							"owner-active-panel",
						],
					}),
				],
				{ extraEvidence: ["approval.md"] },
			),
		).toThrow(/cannot be ACCEPTED on surface ownerActivityLog/);
	});

	it("accepts a superseded manifest surface carrying only planned cases", () => {
		const reportsCases = visualAuthorityCases.filter(
			(authorityCase) => authorityCase.surface === "ownerReports",
		);
		expect(reportsCases.length).toBeGreaterThan(0);
		expect(
			reportsCases.every((authorityCase) => authorityCase.status === "PLANNED"),
		).toBe(true);
		expect(() => validate()).not.toThrow();
	});

	it("rejects an unknown manifest surface authority status", () => {
		const manifest = cloneManifest();
		manifest.surfaces.ownerActivityLog.status = "ACCEPTED_BY_ACCIDENT";
		expect(() => validate({ manifest })).toThrow(
			/surface ownerActivityLog has unknown authority status ACCEPTED_BY_ACCIDENT/,
		);
	});

	it("rejects a missing manifest surface authority status", () => {
		const manifest = cloneManifest();
		manifest.surfaces.ownerActivityLog.status = null;
		expect(() => validate({ manifest })).toThrow(
			/surface ownerActivityLog has unknown authority status \(missing\)/,
		);
	});

	it("rejects a superseded case without a supersession record", () => {
		for (const supersessionRecord of [null, ""]) {
			expect(() =>
				withExtraCases([supersededOwnerCase({ supersessionRecord })]),
			).toThrow(/supersessionRecord is required/);
		}
	});

	it("rejects an accepted case sharing a superseded case's routed artifact", () => {
		// Normalized identity now rejects this before the inventory check: a
		// staff-labeled case presenting an Owner-pinned artifact is a
		// contradiction, not merely an inventory collision.
		const [superseded] = cloneCases().filter(
			(authorityCase) =>
				authorityCase.status === "SUPERSEDED" &&
				authorityCase.surface === "ownerDaily",
		);
		expect(superseded).toBeTruthy();
		expect(() =>
			withExtraCases(
				[
					acceptedCase({
						routedArtifact: {
							kind: "canonical",
							path: superseded.routedArtifact.path,
							sha256: "route-sha",
						},
					}),
				],
				{ extraEvidence: ["approval.md"] },
			),
		).toThrow(/contradictory authority claims/);
	});

	it("rejects two identity-valid cases sharing one routed artifact", () => {
		const sharedPath = "synthetic/shared-routed-artifact.png";
		expect(() =>
			withExtraCases([
				acceptedCase({
					id: "staff-synthetic-shared-a",
					routedArtifact: {
						kind: "canonical",
						path: sharedPath,
						sha256: "route-sha",
					},
				}),
				acceptedCase({
					id: "staff-synthetic-shared-b",
					routedArtifact: {
						kind: "canonical",
						path: sharedPath,
						sha256: "route-sha",
					},
				}),
			]),
		).toThrow(/assigned to both/);
	});

	it("rejects a superseded case naming an unregistered supersession record", () => {
		expect(() =>
			withExtraCases([
				supersededOwnerCase({
					supersessionRecord: "docs/adr/elsewhere.md",
				}),
			]),
		).toThrow(
			/supersessionRecord is not a registered supersession authority: docs\/adr\/elsewhere\.md/,
		);
	});

	it("rejects a supersession authority whose byte pin no longer matches the record", async () => {
		const [record] = supersessionAuthorities;
		await expect(
			verifySupersessionAuthorities(repositoryRoot, [
				{ ...record, bytes: record.bytes + 1 },
			]),
		).rejects.toThrow(/byte count changed/);
		await expect(
			verifySupersessionAuthorities(repositoryRoot, [
				{ ...record, sha256: "0".repeat(64) },
			]),
		).rejects.toThrow(/SHA-256 changed/);
	});

	it("rejects a one-byte mutation of the ADR-009 record", async () => {
		const recordPathParts = OWNER_SUPERSESSION_DECISION.path.split("/");
		const recordBytes = readFileSync(
			path.join(repositoryRoot, ...recordPathParts),
		);
		const temporaryRoot = mkdtempSync(
			path.join(tmpdir(), "fitway-owner-supersession-"),
		);
		const target = path.join(temporaryRoot, ...recordPathParts);
		mkdirSync(path.dirname(target), { recursive: true });
		const mutated = Buffer.from(recordBytes);
		mutated[0] = mutated[0] ^ 0xff;
		writeFileSync(target, mutated);
		await expect(
			verifySupersessionAuthorities(temporaryRoot, cloneAuthorities()),
		).rejects.toThrow(/SHA-256 changed/);
		writeFileSync(target, recordBytes.subarray(0, recordBytes.byteLength - 1));
		await expect(
			verifySupersessionAuthorities(temporaryRoot, cloneAuthorities()),
		).rejects.toThrow(/byte count changed/);
	});

	it("rejects a superseded surface re-activated by manifest status alone", () => {
		const manifest = cloneManifest();
		activateSurface(manifest, "ownerActivityLog");
		expect(() => validate({ manifest })).toThrow(
			/surface ownerActivityLog cannot return to active authority/,
		);
	});

	it("rejects a superseded surface re-activated by a coordinated status and case flip", () => {
		const manifest = cloneManifest();
		activateSurface(manifest, "ownerActivityLog");
		const cases = mutateSurfaceCases(
			cloneCases(),
			"ownerActivityLog",
			"ACCEPTED",
		);
		expect(() => validate({ manifest, cases })).toThrow(
			/surface ownerActivityLog cannot return to active authority/,
		);
	});

	it("rejects an accepted case targeting a non-revoked superseded surface", () => {
		expect(() =>
			withExtraCases(
				[
					acceptedCase({
						id: "owner-activity-synthetic-accepted",
						surface: "ownerActivityLog",
						ownerSection: "activity",
						paperReference: { area: surfaceAuthorities.ownerActivityLog },
						landmarkContracts: [
							"owner-global-shell",
							"owner-shared-navigation",
							"owner-active-panel",
						],
					}),
				],
				{ extraEvidence: ["approval.md"] },
			),
		).toThrow(/cannot be ACCEPTED on surface ownerActivityLog/);
	});

	it("rejects a superseded surface whose supersededBy names no registered record", () => {
		const manifest = cloneManifest();
		manifest.surfaces.ownerReports.supersededBy = "docs/adr/another-record.md";
		expect(() => validate({ manifest })).toThrow(
			/supersededBy must be the standing supersession decision/,
		);
	});

	it("requires exactly one registered authority at the standing decision path", () => {
		expect(() => validate({ supersessionAuthorities: [] })).toThrow(
			/requires exactly one registered authority/,
		);
		const duplicated = cloneAuthorities();
		duplicated.push(structuredClone(duplicated[0]));
		expect(() => validate({ supersessionAuthorities: duplicated })).toThrow(
			/Duplicate supersession authority/,
		);
	});

	it("rejects a standing authority whose pin differs from the policy pin", () => {
		const authorities = cloneAuthorities();
		authorities[0].sha256 = "0".repeat(64);
		expect(() => validate({ supersessionAuthorities: authorities })).toThrow(
			/does not match the pinned ADR-009 decision/,
		);
	});

	it("rejects a second registered authority that names a policy surface", () => {
		const authorities = cloneAuthorities();
		authorities.push({
			path: "docs/adr/other-supersession.md",
			bytes: 10,
			sha256: "a".repeat(64),
			surfaces: ["ownerSettings"],
			revokedBy: null,
		});
		expect(() => validate({ supersessionAuthorities: authorities })).toThrow(
			/may not name Owner supersession policy surfaces: ownerSettings/,
		);
	});

	it("rejects a superseded surface absent from the supersession registry", () => {
		expect(() =>
			validate({
				supersessionAuthorities: trimSurfaceFromAuthorities("ownerActivityLog"),
			}),
		).toThrow(/missing: \[ownerActivityLog\]/);
	});

	it("fails a required surface named by no authority with a named error", () => {
		expect(() => validate({ supersessionAuthorities: [] })).toThrow(
			/requires exactly one registered authority/,
		);
	});

	it("pins the policy-owned Owner superseded surface domain", () => {
		expect([...OWNER_SUPERSEDED_SURFACES]).toEqual([
			"ownerSharedNavigation",
			"ownerDaily",
			"ownerReports",
			"ownerAccountsAndSignIn",
			"ownerActivityLog",
			"ownerSystemStatus",
			"ownerSettings",
		]);
	});

	it("mirrors the policy domain in registry evidence", () => {
		expect([...requiredOwnerSupersededSurfaces]).toEqual([
			...OWNER_SUPERSEDED_SURFACES,
		]);
	});

	it("pins the registered ADR-009 authority to the standing decision", () => {
		const [adr009] = supersessionAuthorities;
		expect(adr009.path).toBe(OWNER_SUPERSESSION_DECISION.path);
		expect(adr009.bytes).toBe(OWNER_SUPERSESSION_DECISION.bytes);
		expect(adr009.sha256).toBe(OWNER_SUPERSESSION_DECISION.sha256);
		expect(adr009.revokedBy).toBeNull();
		expect([...adr009.surfaces].sort()).toEqual(
			[...OWNER_SUPERSEDED_SURFACES].sort(),
		);
	});

	it("documents the successor protocol as disabled", () => {
		expect(OWNER_SUPERSESSION_SUCCESSOR_PROTOCOL.revocationEnabled).toBe(false);
		expect([
			...OWNER_SUPERSESSION_SUCCESSOR_PROTOCOL.requiredBindingFields,
		]).toEqual([
			"decisionId",
			"predecessorPath",
			"predecessorSha256",
			"surfaces",
			"authorityState",
			"payloadSha256",
			"externalHumanAuthorizationProof",
		]);
	});

	it("cannot shrink the enforced domain through a caller-supplied policy override", async () => {
		const manifest = activateSurface(cloneManifest(), "ownerSettings");
		const cases = mutateSurfaceCases(cloneCases(), "ownerSettings", "ACCEPTED");
		const authorities = trimSurfaceFromAuthorities("ownerSettings");
		const callerOverrides = {
			manifest,
			cases,
			supersessionAuthorities: authorities,
			requiredSupersededSurfaces: [],
		};
		expect(() => validate(callerOverrides)).toThrow(
			/missing: \[ownerSettings\]/,
		);
		await expect(
			verifySupersessionAuthorities(repositoryRoot, authorities),
		).rejects.toThrow(/missing: \[ownerSettings\]/);
	});

	it("fails closed on every non-null revocation because no successor protocol is enabled", () => {
		const authorities = cloneAuthorities();
		authorities[0].revokedBy = {
			path: "docs/successor.md",
			bytes: 12,
			sha256: "b".repeat(64),
		};
		expect(() => validate({ supersessionAuthorities: authorities })).toThrow(
			/no successor protocol is enabled/,
		);
		expect(() => validate({ supersessionAuthorities: authorities })).toThrow(
			/repository bytes cannot prove a human authorization event/,
		);
	});

	it.each([
		"package.json",
		OWNER_SUPERSESSION_DECISION.path,
		"docs/phase-records/handoffs/coordinator/20260915-185500-human-owner-visual-authority-decision.md",
		"tests/browser/visual-authority-cases.mjs",
	])("rejects real repository bytes (%s) registered as a revocation successor", async (relativePath) => {
		const fileBytes = readFileSync(path.join(repositoryRoot, relativePath));
		const authorities = cloneAuthorities();
		authorities[0].revokedBy = {
			path: relativePath,
			bytes: fileBytes.byteLength,
			sha256: createHash("sha256").update(fileBytes).digest("hex"),
		};
		await expect(
			verifySupersessionAuthorities(repositoryRoot, authorities),
		).rejects.toThrow(/no successor protocol is enabled/);
		expect(() =>
			validate({
				supersessionAuthorities: structuredClone(authorities),
			}),
		).toThrow(/no successor protocol is enabled/);
	});

	describe("adversarial A2 matrix: trimmed registry cannot reactivate a policy surface", () => {
		it.each(
			ownerSurfaces.flatMap((surface) =>
				caseStatuses.map((status) => [surface, status]),
			),
		)("fails closed when %s is trimmed from the registry with the manifest active and its cases %s", (surface, status) => {
			const manifest = activateSurface(cloneManifest(), surface);
			const cases = mutateSurfaceCases(cloneCases(), surface, status);
			expect(() =>
				validate({
					manifest,
					cases,
					supersessionAuthorities: trimSurfaceFromAuthorities(surface),
				}),
			).toThrow(new RegExp(`missing: \\[${surface}\\]`));
		});
	});

	describe("manifest reactivation matrix with the registry intact", () => {
		it.each(
			ownerSurfaces.flatMap((surface) =>
				caseStatuses.map((status) => [surface, status]),
			),
		)("rejects active manifest status on %s with its cases %s", (surface, status) => {
			const manifest = activateSurface(cloneManifest(), surface);
			const cases = mutateSurfaceCases(cloneCases(), surface, status);
			expect(() => validate({ manifest, cases })).toThrow(
				new RegExp(`surface ${surface} cannot return to active authority`),
			);
		});

		it.each(
			ownerSurfaces,
		)("rejects an ACCEPTED case on superseded surface %s", (surface) => {
			const cases = mutateSurfaceCases(cloneCases(), surface, "ACCEPTED");
			expect(() => validate({ cases })).toThrow(
				new RegExp(`cannot be ACCEPTED on surface ${surface}`),
			);
		});
	});

	describe("manifest and case deletion probes", () => {
		it.each(
			ownerSurfaces,
		)("fails with a named error when %s is deleted from the manifest", (surface) => {
			const manifest = cloneManifest();
			delete manifest.surfaces[surface];
			expect(() => validate({ manifest })).toThrow(
				new RegExp(
					`required superseded Owner surface ${surface} is missing from the manifest surfaces`,
				),
			);
		});

		it.each(
			ownerSurfaces,
		)("fails with a named error when all %s cases are deleted", (surface) => {
			const cases = cloneCases().filter(
				(authorityCase) => authorityCase.surface !== surface,
			);
			expect(() => validate({ cases })).toThrow(
				new RegExp(
					`required superseded Owner surface ${surface} has no registered visual-authority case`,
				),
			);
		});

		it("fails exact set equality when an extra surface is added to the standing authority", () => {
			const authorities = cloneAuthorities();
			authorities[0].surfaces = [...authorities[0].surfaces, "public"];
			expect(() => validate({ supersessionAuthorities: authorities })).toThrow(
				/extra: \[public\]/,
			);
		});
	});

	describe("fabricated successor payloads", () => {
		function successorPayload(overrides = {}) {
			return {
				path: "docs/adr/ADR-010-owner-successor.md",
				bytes: 2048,
				sha256: "d".repeat(64),
				decisionId: "ADR-010-owner-successor",
				predecessorPath: OWNER_SUPERSESSION_DECISION.path,
				predecessorSha256: OWNER_SUPERSESSION_DECISION.sha256,
				surfaces: [...OWNER_SUPERSEDED_SURFACES],
				authorityState: "ACTIVE",
				payloadSha256: "c".repeat(64),
				externalHumanAuthorizationProof: "self-asserted",
				...overrides,
			};
		}

		it.each([
			{
				label: "well-shaped but self-asserted successor",
				revokedBy: successorPayload(),
			},
			{
				label: "successor naming the wrong predecessor",
				revokedBy: successorPayload({
					predecessorPath: "docs/adr/ADR-001-other.md",
				}),
			},
			{
				label: "successor naming the wrong predecessor digest",
				revokedBy: successorPayload({ predecessorSha256: "0".repeat(64) }),
			},
			{
				label: "successor naming an unrelated surface",
				revokedBy: successorPayload({ surfaces: ["public"] }),
			},
			{
				label: "self-revocation successor",
				revokedBy: successorPayload({
					path: OWNER_SUPERSESSION_DECISION.path,
					bytes: OWNER_SUPERSESSION_DECISION.bytes,
					sha256: OWNER_SUPERSESSION_DECISION.sha256,
				}),
			},
			{
				label: "subset successor reactivating every surface",
				revokedBy: successorPayload({ surfaces: ["ownerDaily"] }),
			},
		])("rejects a $label", ({ revokedBy }) => {
			const authorities = cloneAuthorities();
			authorities[0].revokedBy = revokedBy;
			expect(() => validate({ supersessionAuthorities: authorities })).toThrow(
				/no successor protocol is enabled/,
			);
		});
	});

	describe("enforcement-owned Owner authority identity", () => {
		function validateCaseMutation(
			id: string,
			mutate,
			{ removeArtifactPresenters = [] as string[] } = {},
		) {
			let cases = cloneCases();
			if (removeArtifactPresenters.length) {
				cases = withoutArtifactPresenters(cases, removeArtifactPresenters);
			}
			cases = replaceCase(cases, id, mutate);
			return validate({ cases });
		}

		it("pins the exact seven-surface binding table from the policy root", () => {
			expect(() => validateOwnerSurfaceBindings()).not.toThrow();
			expect(structuredClone(OWNER_SURFACE_BINDINGS)).toEqual(
				expectedOwnerBindings,
			);
			expect(Object.isFrozen(OWNER_SURFACE_BINDINGS)).toBe(true);
			for (const binding of OWNER_SURFACE_BINDINGS) {
				expect(Object.isFrozen(binding)).toBe(true);
				expect(Object.isFrozen(binding.canonicalArtifacts)).toBe(true);
			}
		});

		it("resolves a real non-Owner case to its route-bound domain", () => {
			for (const [surface, route] of Object.entries(
				NON_OWNER_ROUTE_BY_SURFACE,
			)) {
				const authorityCase = visualAuthorityCases.find(
					(entry) => entry.surface === surface && entry.status === "PLANNED",
				);
				if (!authorityCase) {
					throw new Error(`Missing real PLANNED ${surface} case`);
				}
				expect(resolveCaseAuthorityIdentity(authorityCase)).toEqual({
					domain: surface,
					surface,
					route,
				});
			}
		});

		it("resolves a real Owner SUPERSEDED case to its enforcement-owned identity", () => {
			const authorityCase = realCaseById("ownerDaily--completed--ar--desktop");
			expect(resolveCaseAuthorityIdentity(authorityCase)).toEqual({
				domain: "owner",
				surface: "ownerDaily",
				route: "/admin",
				ownerSection: "daily",
				paperArea: "OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT",
				canonicalArtifact: authorityCase.routedArtifact.path,
				standingDecision: OWNER_SUPERSESSION_DECISION.path,
			});
		});

		it("keeps the real Owner artifact paths and hashes unchanged", () => {
			for (const binding of artifactOwnerBindings) {
				const expected = expectedOwnerArtifacts[binding.surface];
				expect(expected).toBeTruthy();
				const realPaths = expected.map(([artifactPath, sha256, id]) => {
					const authorityCase = realCaseById(id);
					expect(authorityCase.status).toBe("SUPERSEDED");
					expect(authorityCase.surface).toBe(binding.surface);
					expect(authorityCase.route).toBe("/admin");
					expect(authorityCase.routedArtifact.path).toBe(artifactPath);
					expect(authorityCase.routedArtifact.sha256).toBe(sha256);
					expect(authorityCase.supersessionRecord).toBe(
						OWNER_SUPERSESSION_DECISION.path,
					);
					return artifactPath;
				});
				expect([...new Set(realPaths)].sort()).toEqual(
					[...binding.canonicalArtifacts].sort(),
				);
			}
			for (const binding of OWNER_SURFACE_BINDINGS.filter(
				(entry) => !entry.canonicalArtifacts.length,
			)) {
				expect(
					visualAuthorityCases.some(
						(entry) =>
							entry.surface === binding.surface &&
							entry.routedArtifact !== null,
					),
				).toBe(false);
			}
		});

		it("keeps production coverage complete and unique in the real registry", () => {
			const identities = visualAuthorityCases.map((entry) =>
				resolveCaseAuthorityIdentity(entry),
			);
			for (const binding of OWNER_SURFACE_BINDINGS) {
				expect(
					identities.filter(
						(identity) =>
							identity.domain === "owner" &&
							identity.surface === binding.surface,
					).length,
				).toBeGreaterThan(0);
				for (const artifactPath of binding.canonicalArtifacts) {
					expect(
						visualAuthorityCases.filter(
							(entry) => entry.routedArtifact?.path === artifactPath,
						).length,
					).toBe(1);
				}
			}
		});

		describe("relabeled surface claims", () => {
			it.each(
				OWNER_SURFACE_BINDINGS.flatMap((binding) => [
					{ surface: binding.surface, relabel: "public" },
					{ surface: binding.surface, relabel: "login" },
					{ surface: binding.surface, relabel: "staff" },
				]),
			)("rejects $surface relabeled as $relabel", ({ surface, relabel }) => {
				expect(() =>
					validateCaseMutation(bindingBaseCaseIds[surface], (authorityCase) => {
						authorityCase.surface = relabel;
						return authorityCase;
					}),
				).toThrow(/contradictory authority claims/);
			});
		});

		describe("status flips", () => {
			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects ACCEPTED status on $surface", (binding) => {
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							authorityCase.status = "ACCEPTED";
							return authorityCase;
						},
					),
				).toThrow(
					new RegExp(`cannot be ACCEPTED on surface ${binding.surface}`),
				);
			});
		});

		describe("supersession record removal", () => {
			it.each(
				artifactOwnerBindings,
			)("rejects a SUPERSEDED case whose supersession record is removed on $surface", (binding) => {
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							delete authorityCase.supersessionRecord;
							return authorityCase;
						},
					),
				).toThrow(/supersessionRecord is required/);
			});
		});

		describe("accepted non-Owner Paper and approval substitution", () => {
			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects an accepted staff Paper reference and approval substituted on $surface", (binding) => {
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							authorityCase.paperReference.area = surfaceAuthorities.staff;
							authorityCase.approvalRecord = staffApprovalRecord;
							return authorityCase;
						},
					),
				).toThrow(/contradictory authority claims/);
			});
		});

		describe("ownerSection substitutions", () => {
			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects ownerSection changed to another registered section on $surface", (binding) => {
				const other = nextBinding(binding);
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							authorityCase.ownerSection = other.ownerSection;
							return authorityCase;
						},
					),
				).toThrow(/contradictory authority claims/);
			});

			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects an omitted ownerSection on $surface", (binding) => {
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							delete authorityCase.ownerSection;
							return authorityCase;
						},
					),
				).toThrow(/ownerSection claim \(absent\)/);
			});

			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects cross-pairing another Owner surface's section and artifact on $surface", (binding) => {
				const other = otherArtifactBinding(binding);
				const artifactPath = other.canonicalArtifacts[0];
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							authorityCase.ownerSection = other.ownerSection;
							authorityCase.routedArtifact = {
								kind: "canonical",
								path: artifactPath,
								sha256: "cross-pair-sha",
							};
							return authorityCase;
						},
						{ removeArtifactPresenters: [artifactPath] },
					),
				).toThrow(/contradictory authority claims/);
			});
		});

		describe("route substitution", () => {
			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects a non-Owner route while the Owner section and artifact remain on $surface", (binding) => {
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							authorityCase.route = "/staff";
							return authorityCase;
						},
					),
				).toThrow(/route claim "\/staff" does not match \/admin/);
			});
		});

		describe("canonical artifact substitutions", () => {
			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects a canonical artifact replaced with a staff artifact on $surface", (binding) => {
				const staffArtifact =
					"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-live-route-en-desktop-1440x900.png";
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							authorityCase.routedArtifact = {
								kind: "canonical",
								path: staffArtifact,
								sha256: "staff-artifact-sha",
							};
							return authorityCase;
						},
					),
				).toThrow(
					/status SUPERSEDED requires routedArtifact\.path|status PLANNED must not carry a routedArtifact/,
				);
			});

			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects a canonical artifact moved to another Owner surface on $surface", (binding) => {
				const other = otherArtifactBinding(binding);
				const artifactPath = other.canonicalArtifacts[0];
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							authorityCase.routedArtifact = {
								kind: "canonical",
								path: artifactPath,
								sha256: "moved-sha",
							};
							return authorityCase;
						},
						{ removeArtifactPresenters: [artifactPath] },
					),
				).toThrow(/contradictory authority claims/);
			});

			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects a canonical artifact paired with a different section on $surface", (binding) => {
				const other = otherArtifactBinding(binding);
				const artifactPath = other.canonicalArtifacts[0];
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							authorityCase.ownerSection = other.ownerSection;
							authorityCase.routedArtifact = {
								kind: "canonical",
								path: artifactPath,
								sha256: "paired-sha",
							};
							return authorityCase;
						},
						{ removeArtifactPresenters: [artifactPath] },
					),
				).toThrow(/contradictory authority claims/);
			});
		});

		describe("combined contradictions", () => {
			it.each(
				OWNER_SURFACE_BINDINGS,
			)("rejects combined surface, status, supersession, area, and approval contradictions on $surface", (binding) => {
				expect(() =>
					validateCaseMutation(
						bindingBaseCaseIds[binding.surface],
						(authorityCase) => {
							authorityCase.surface = "staff";
							authorityCase.status = "ACCEPTED";
							delete authorityCase.supersessionRecord;
							authorityCase.paperReference.area = surfaceAuthorities.staff;
							authorityCase.approvalRecord = staffApprovalRecord;
							return authorityCase;
						},
					),
				).toThrow(/contradictory authority claims/);
			});

			it("rejects the exact fifth-audit mutation of ownerDaily--completed--ar--desktop", () => {
				const cases = replaceCase(
					cloneCases(),
					"ownerDaily--completed--ar--desktop",
					(authorityCase) => {
						authorityCase.status = "ACCEPTED";
						authorityCase.surface = "staff";
						authorityCase.paperReference.area = surfaceAuthorities.staff;
						authorityCase.approvalRecord = staffApprovalRecord;
						delete authorityCase.supersessionRecord;
						return authorityCase;
					},
				);
				let caught: Error | undefined;
				try {
					validate({ cases });
				} catch (error) {
					caught = error as Error;
				}
				expect(caught).toBeInstanceOf(Error);
				expect(caught?.message).toMatch(/contradictory authority claims/);
				expect(caught?.message).toMatch(/ownerDaily/);
				expect(caught?.message).toMatch(/surface "staff" identifies \(none\)/);
				expect(caught?.message).toMatch(/routedArtifact\.path/);
				expect(caught?.message).toMatch(
					/ownerSection "daily" identifies ownerDaily/,
				);
			});
		});

		describe("additional fail-closed probes", () => {
			it("rejects an unknown /admin case with a non-Owner label", () => {
				expect(() =>
					withExtraCases(
						[acceptedCase({ id: "unknown-admin-case", route: "/admin" })],
						{ extraEvidence: ["approval.md"] },
					),
				).toThrow(/contradictory authority claims/);
			});

			it("rejects an Owner canonical artifact presented on a non-Owner route", () => {
				const artifactPath =
					"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png";
				const cases = [
					...withoutArtifactPresenters(cloneCases(), [artifactPath]),
					acceptedCase({
						id: "owner-artifact-on-staff-route",
						routedArtifact: {
							kind: "canonical",
							path: artifactPath,
							sha256: "route-sha",
						},
					}),
				];
				expect(() => validate({ cases })).toThrow(
					/contradictory authority claims/,
				);
			});

			it("rejects an Owner section presented under a non-Owner label", () => {
				expect(() =>
					withExtraCases(
						[
							acceptedCase({
								id: "owner-section-on-staff",
								ownerSection: "daily",
							}),
						],
						{ extraEvidence: ["approval.md"] },
					),
				).toThrow(/contradictory authority claims/);
			});

			it("rejects an Owner supersession record presented under a non-Owner label", () => {
				expect(() =>
					withExtraCases(
						[
							acceptedCase({
								id: "owner-record-on-staff",
								supersessionRecord: OWNER_SUPERSESSION_DECISION.path,
							}),
						],
						{ extraEvidence: ["approval.md"] },
					),
				).toThrow(/contradictory authority claims/);
			});

			it("rejects a pinned canonical artifact with no presenting case", () => {
				const cases = cloneCases().filter(
					(authorityCase) =>
						authorityCase.id !== "ownerDaily--completed--ar--desktop",
				);
				expect(() => validate({ cases })).toThrow(
					/must be presented by exactly one registered case; found 0/,
				);
			});

			it.each([
				["./ prefix", (value: string) => `./${value}`],
				["backslashes", (value: string) => value.replaceAll("/", "\\")],
				["uppercase", (value: string) => value.toUpperCase()],
				["extra whitespace", (value: string) => `  ${value}  `],
			])("rejects a %s artifact path alias on a real SUPERSEDED Owner case", (_label, alias) => {
				const artifactPath =
					"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png";
				const cases = replaceCase(
					cloneCases(),
					"ownerDaily--completed--ar--desktop",
					(authorityCase) => {
						authorityCase.routedArtifact.path = alias(artifactPath);
						return authorityCase;
					},
				);
				expect(() => validate({ cases })).toThrow(
					/status SUPERSEDED requires routedArtifact\.path/,
				);
			});

			it("is order-independent for a shuffled case array", () => {
				const cases = cloneCases().reverse();
				expect(() => validate({ cases })).not.toThrow();
			});

			it("is insensitive to reordered keys and extra mutable fields", () => {
				const cases = cloneCases().map((authorityCase) => {
					if (authorityCase.id !== "ownerDaily--completed--ar--desktop") {
						return authorityCase;
					}
					return {
						...Object.fromEntries(Object.entries(authorityCase).reverse()),
						auditNote: "extra mutable field",
					};
				});
				expect(() => validate({ cases })).not.toThrow();
			});

			it("still rejects the audit mutation when array order and claims change", () => {
				const cases = replaceCase(
					cloneCases().reverse(),
					"ownerDaily--completed--ar--desktop",
					(authorityCase) => {
						authorityCase.surface = "staff";
						authorityCase.status = "ACCEPTED";
						authorityCase.paperReference.area = surfaceAuthorities.staff;
						authorityCase.approvalRecord = staffApprovalRecord;
						delete authorityCase.supersessionRecord;
						return { auditNote: "shuffled", ...authorityCase };
					},
				);
				expect(() => validate({ cases })).toThrow(
					/contradictory authority claims/,
				);
			});
		});

		describe("validateOwnerSurfaceBindings fail-closed matrix", () => {
			function mutatedBindings(mutate) {
				const bindings = structuredClone(OWNER_SURFACE_BINDINGS);
				mutate(bindings);
				return bindings;
			}

			it("rejects a non-array table", () => {
				expect(() => validateOwnerSurfaceBindings(null)).toThrow(
					/must be an array/,
				);
			});

			it("rejects a duplicate surface", () => {
				expect(() =>
					validateOwnerSurfaceBindings(
						mutatedBindings((bindings) => {
							bindings[1].surface = bindings[0].surface;
						}),
					),
				).toThrow(/duplicate surface/);
			});

			it("rejects a missing surface gap", () => {
				expect(() =>
					validateOwnerSurfaceBindings(
						mutatedBindings((bindings) => {
							bindings.splice(3, 1);
						}),
					),
				).toThrow(/found 6 entries/);
			});

			it("rejects a duplicated ownerSection", () => {
				expect(() =>
					validateOwnerSurfaceBindings(
						mutatedBindings((bindings) => {
							bindings[1].ownerSection = bindings[0].ownerSection;
						}),
					),
				).toThrow(/duplicate ownerSection/);
			});

			it("rejects a duplicated paperArea", () => {
				expect(() =>
					validateOwnerSurfaceBindings(
						mutatedBindings((bindings) => {
							bindings[1].paperArea = bindings[0].paperArea;
						}),
					),
				).toThrow(/duplicate paperArea/);
			});

			it("rejects a binding on a non-Owner route", () => {
				expect(() =>
					validateOwnerSurfaceBindings(
						mutatedBindings((bindings) => {
							bindings[0].route = "/staff";
						}),
					),
				).toThrow(/must pin route \/admin/);
			});

			it("rejects a pinned artifact duplicated across bindings", () => {
				expect(() =>
					validateOwnerSurfaceBindings(
						mutatedBindings((bindings) => {
							bindings[5].canonicalArtifacts.push(
								bindings[1].canonicalArtifacts[0],
							);
						}),
					),
				).toThrow(/is pinned to both/);
			});

			it("rejects a wrong standing decision", () => {
				expect(() =>
					validateOwnerSurfaceBindings(
						mutatedBindings((bindings) => {
							bindings[0].standingDecision = "docs/adr/other.md";
						}),
					),
				).toThrow(/must pin the standing decision/);
			});
		});

		describe("legitimate non-Owner acceptance regression", () => {
			it("still accepts legitimate Public, Login, and Staff authority cases", () => {
				expect(() =>
					withExtraCases(
						[
							acceptedNonOwnerCase("public"),
							acceptedNonOwnerCase("login"),
							acceptedNonOwnerCase("staff"),
							acceptedNonOwnerCase("staff", {
								id: "staff-synthetic-runtime-en-desktop",
								comparisonMode: "runtime-interpolation",
								paperReference: { area: surfaceAuthorities.staff },
								runtimeReviewRecord: "review.md",
							}),
						],
						{ extraEvidence: ["approval.md", "review.md"] },
					),
				).not.toThrow();
			});
		});
	});

	describe("authority case plainness gate (F1)", () => {
		function defineGetter(target, key: string, get: () => unknown) {
			Object.defineProperty(target, key, {
				enumerable: true,
				configurable: true,
				get,
			});
		}

		function validateAccessorCase(accessorCase) {
			// All non-case inputs are supplied explicitly so the test helper
			// cannot read the accessor case before the gate does.
			return validate({
				cases: [...cloneCases(), accessorCase],
				canonicalArtifacts: [...realCanonicalArtifacts],
				availableEvidencePaths: [...realEvidencePaths],
			});
		}

		function buildO1AccessorCase() {
			const staffCase = visualAuthorityCases.find(
				(authorityCase) =>
					authorityCase.status === "ACCEPTED" &&
					authorityCase.surface === "staff",
			);
			if (!staffCase) throw new Error("Missing real ACCEPTED staff case");
			const ownerDailyCase = realCaseById("ownerDaily--completed--ar--desktop");
			const decoyArtifact = r05RejectedCanonicalArtifacts.find(
				(candidate) =>
					!visualAuthorityCases.some(
						(authorityCase) => authorityCase.routedArtifact?.path === candidate,
					),
			);
			if (!decoyArtifact) {
				throw new Error("Missing unassigned rejected artifact for the decoy");
			}
			const accessorCase = structuredClone(staffCase);
			accessorCase.id = "probe-accessor-staff-acceptance";
			const reads = { status: 0, routedArtifact: 0 };
			defineGetter(accessorCase, "status", () => {
				reads.status += 1;
				return reads.status === 1 ? "PLANNED" : "ACCEPTED";
			});
			defineGetter(accessorCase, "routedArtifact", () => {
				reads.routedArtifact += 1;
				if (reads.routedArtifact === 1) return null;
				if (reads.routedArtifact <= 10) {
					return {
						kind: "canonical",
						path: decoyArtifact,
						sha256: "0".repeat(64),
					};
				}
				return {
					kind: "canonical",
					path: ownerDailyCase.routedArtifact.path,
					sha256: ownerDailyCase.routedArtifact.sha256,
				};
			});
			return { accessorCase, reads };
		}

		it("rejects the exact O1 accessor case whose status and routedArtifact change between reads", () => {
			const { accessorCase, reads } = buildO1AccessorCase();
			let caught: Error | undefined;
			try {
				validateAccessorCase(accessorCase);
			} catch (error) {
				caught = error as Error;
			}
			expect(caught).toBeInstanceOf(Error);
			expect(caught?.message).toMatch(
				/probe-accessor-staff-acceptance\.status: accessor properties are not allowed in authority case data/,
			);
			expect(reads.status).toBe(0);
			expect(reads.routedArtifact).toBe(0);
		});

		it("rejects a nested accessor at paperReference.area", () => {
			const nested = structuredClone(
				realCaseById("ownerDaily--completed--ar--desktop"),
			);
			defineGetter(
				nested.paperReference,
				"area",
				() => surfaceAuthorities.ownerDaily,
			);
			expect(() => validateAccessorCase(nested)).toThrow(
				/ownerDaily--completed--ar--desktop\.paperReference\.area: accessor properties are not allowed in authority case data/,
			);
		});

		it("rejects an accessor case passed directly to resolveCaseAuthorityIdentity", () => {
			const probe = structuredClone(
				realCaseById("ownerDaily--completed--ar--desktop"),
			);
			let routeReads = 0;
			defineGetter(probe, "route", () => {
				routeReads += 1;
				return "/admin";
			});
			expect(() => resolveCaseAuthorityIdentity(probe)).toThrow(
				/ownerDaily--completed--ar--desktop\.route: accessor properties are not allowed in authority case data/,
			);
			expect(routeReads).toBe(0);
		});

		it("keeps the plain twin valid while its accessor twin fails", () => {
			const plain = structuredClone(
				realCaseById("ownerDaily--completed--ar--desktop"),
			);
			expect(() => resolveCaseAuthorityIdentity(plain)).not.toThrow();
			const twin = structuredClone(plain);
			defineGetter(twin, "surface", () => "ownerDaily");
			expect(() => resolveCaseAuthorityIdentity(twin)).toThrow(
				/accessor properties are not allowed in authority case data/,
			);
		});

		it("cannot return an identity or reach acceptance for a rejected accessor case", () => {
			const { accessorCase, reads } = buildO1AccessorCase();
			let identity: unknown = null;
			try {
				identity = resolveCaseAuthorityIdentity(accessorCase);
			} catch (error) {
				expect(error).toBeInstanceOf(Error);
			}
			expect(identity).toBeNull();
			expect(() => validateAccessorCase(accessorCase)).toThrow(
				/accessor properties are not allowed in authority case data/,
			);
			// The final acceptance loop in verifyVisualAuthorityRepository cannot
			// verify an Owner canonical artifact for this case because no consumer
			// ever reads the accessor values.
			expect(reads.status).toBe(0);
			expect(reads.routedArtifact).toBe(0);
		});

		it("names the explicit case id and property path from the exported gate", () => {
			const probe = structuredClone(
				realCaseById("ownerDaily--completed--ar--desktop"),
			);
			defineGetter(probe, "status", () => "SUPERSEDED");
			expect(() => assertPlainAuthorityCase("explicit-case-id", probe)).toThrow(
				/^explicit-case-id\.status: accessor properties are not allowed in authority case data$/,
			);
		});

		it("rejects an id accessor without ever invoking it", () => {
			const probe = structuredClone(
				realCaseById("ownerDaily--completed--ar--desktop"),
			);
			let idReads = 0;
			defineGetter(probe, "id", () => {
				idReads += 1;
				return "probe-id-accessor";
			});
			const expected =
				/^\(unreadable id\)\.id: accessor properties are not allowed in authority case data$/;
			let caught: Error | undefined;
			try {
				assertPlainAuthorityCase(undefined, probe);
			} catch (error) {
				caught = error as Error;
			}
			expect(caught).toBeInstanceOf(Error);
			expect(caught?.message).toMatch(expected);
			expect(idReads).toBe(0);
			expect(() => resolveCaseAuthorityIdentity(probe)).toThrow(expected);
			expect(idReads).toBe(0);
			expect(() => validateAccessorCase(probe)).toThrow(expected);
			expect(idReads).toBe(0);
		});

		it("rejects function values and class instances", () => {
			const withFunction = structuredClone(
				realCaseById("ownerDaily--completed--ar--desktop"),
			);
			withFunction.auditHook = () => {};
			expect(() => assertPlainAuthorityCase(undefined, withFunction)).toThrow(
				/\.auditHook: function values are not allowed in authority case data/,
			);
			const withClass = structuredClone(
				realCaseById("ownerDaily--completed--ar--desktop"),
			);
			withClass.viewport = new (class Viewport {})();
			expect(() => assertPlainAuthorityCase(undefined, withClass)).toThrow(
				/\.viewport: class instances are not allowed in authority case data/,
			);
		});
	});
});
