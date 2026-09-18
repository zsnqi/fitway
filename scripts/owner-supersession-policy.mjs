/**
 * Enforcement-owned ADR-009 Owner supersession policy.
 *
 * This module is the policy root for the seven Owner surfaces superseded by
 * `docs/adr/ADR-009-owner-composition-authority-supersession.md`. It is
 * deliberately not registry data: `tests/browser/visual-authority-cases.mjs`
 * mirrors the domain as evidence only, and `scripts/visual-authority.mjs`
 * obtains the domain here — never from a caller, the registry, or the manifest.
 * Trimming or mutating repository data therefore cannot shrink the protected
 * domain or reactivate a superseded surface.
 *
 * The surface keys match ADR-009 decision 1 exactly, and the decision pin is
 * the reviewed byte identity of the binding human decision record. The pin
 * proves file identity (byte count + SHA-256) only; it does not prove
 * authorship or human intent.
 */

export const OWNER_SUPERSEDED_SURFACES = Object.freeze([
	"ownerSharedNavigation",
	"ownerDaily",
	"ownerReports",
	"ownerAccountsAndSignIn",
	"ownerActivityLog",
	"ownerSystemStatus",
	"ownerSettings",
]);

export const OWNER_SUPERSESSION_DECISION = Object.freeze({
	path: "docs/adr/ADR-009-owner-composition-authority-supersession.md",
	bytes: 5574,
	sha256: "701302a2fd62fbb22f6b2be3a8b748ae1e2d3fe1a33b262140fdf90afe299971",
});

/**
 * Successor-protocol extension point. Revocation is disabled.
 *
 * No successor decision exists in the repository, so every non-null
 * `revokedBy` fails closed. A recognized successor would have to bind:
 *
 * 1. a unique decision id and decision type;
 * 2. the exact predecessor decision path and digest;
 * 3. the affected surface subset (never a superset of what the predecessor
 *    protected);
 * 4. the new authority state and effective gate outcome;
 * 5. a canonical digest of the decision payload; and
 * 6. an external human-authorization proof or an explicitly promoted digest
 *    whose promotion action is the human gate, recorded outside the repository.
 *
 * The repository cannot authenticate a human authorization event: bytes and
 * hashes can prove identity and semantic binding, but a self-declared
 * `human-decision` field is not an authorization. Enabling any of this is a
 * reviewed code change to this module, not a data edit to the registry,
 * manifest, or cases.
 */
export const OWNER_SUPERSESSION_SUCCESSOR_PROTOCOL = Object.freeze({
	revocationEnabled: false,
	requiredBindingFields: Object.freeze([
		"decisionId",
		"predecessorPath",
		"predecessorSha256",
		"surfaces",
		"authorityState",
		"payloadSha256",
		"externalHumanAuthorizationProof",
	]),
});

/**
 * Fail-closed message for any non-null revocation. Derived from the disabled
 * successor protocol so the requirement cannot drift from the message.
 */
export function ownerSupersessionRevocationFailure(authorityPath) {
	const fields =
		OWNER_SUPERSESSION_SUCCESSOR_PROTOCOL.requiredBindingFields.join(", ");
	return (
		`Supersession authority ${authorityPath} declares a non-null revokedBy, but ` +
		"no successor protocol is enabled: repository bytes cannot prove a human " +
		`authorization event. A recognized successor must bind ${fields}, with the ` +
		"authorization proof or promoted digest recorded outside the repository; " +
		"enabling the protocol is a reviewed code change."
	);
}

function fail(message) {
	throw new Error(message);
}

function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}

function formatClaim(value) {
	return value === null || value === undefined
		? "(absent)"
		: JSON.stringify(value);
}

/**
 * Accessor-free message label: the case id is read only from an own data
 * property descriptor, never by property access, so an `id` getter can neither
 * supply the label nor be invoked while building a failure message.
 */
function resolveCaseLabel(caseId, authorityCase) {
	if (isNonEmptyString(caseId)) return caseId;
	if (authorityCase !== null && typeof authorityCase === "object") {
		const descriptor = Object.getOwnPropertyDescriptor(authorityCase, "id");
		if (
			descriptor &&
			!descriptor.get &&
			!descriptor.set &&
			isNonEmptyString(descriptor.value)
		) {
			return descriptor.value;
		}
	}
	return "(unreadable id)";
}

function isPlainCaseObject(value) {
	if (value === null || typeof value !== "object") return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function casePropertyPath(caseId, segments) {
	return segments.length ? `${caseId}.${segments.join(".")}` : caseId;
}

/**
 * Fail-closed plainness gate for authority case data.
 *
 * A case object with own accessor properties (`get`/`set`) can return different
 * values at different read sites, so a code-shaped case could present one claim
 * to identity resolution and another to the artifact inventory, coverage, or
 * evidence consumers. This gate walks the whole case graph by own property
 * descriptor without invoking accessors, and rejects any own accessor, any
 * function/symbol/bigint value, any symbol-keyed property, and any class
 * instance. Allowed values are plain objects, arrays, strings, numbers,
 * booleans, null, and undefined. The error names the case id and the exact
 * property path; the label itself is read only from an own data descriptor, so
 * neither the walk nor the message can be steered by an accessor. The gate is
 * idempotent, so it can run at every enforcement boundary.
 */
export function assertPlainAuthorityCase(caseId, authorityCase) {
	const id = resolveCaseLabel(caseId, authorityCase);
	if (!isPlainCaseObject(authorityCase)) {
		fail(`${id}: authority case data must be a plain object`);
	}
	const seen = new Set();
	const queue = [{ value: authorityCase, segments: [] }];
	for (let index = 0; index < queue.length; index += 1) {
		const { value, segments } = queue[index];
		const path = casePropertyPath(id, segments);
		if (value === null) continue;
		const type = typeof value;
		if (
			type === "string" ||
			type === "number" ||
			type === "boolean" ||
			type === "undefined"
		) {
			continue;
		}
		if (type === "function" || type === "symbol" || type === "bigint") {
			fail(`${path}: ${type} values are not allowed in authority case data`);
		}
		if (!Array.isArray(value) && !isPlainCaseObject(value)) {
			fail(`${path}: class instances are not allowed in authority case data`);
		}
		if (seen.has(value)) continue;
		seen.add(value);
		if (Object.getOwnPropertySymbols(value).length) {
			fail(
				`${path}: symbol-keyed properties are not allowed in authority case data`,
			);
		}
		for (const key of Object.getOwnPropertyNames(value)) {
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			const childSegments = [...segments, key];
			if (descriptor.get || descriptor.set) {
				fail(
					`${casePropertyPath(id, childSegments)}: accessor properties are not allowed in authority case data`,
				);
			}
			queue.push({ value: descriptor.value, segments: childSegments });
		}
	}
}

const ownerRoute = "/admin";

/**
 * Enforcement-owned route for the accepted non-Owner authority domains. A
 * non-Owner case is normalized only when its `surface` claim is one of these
 * keys and its route claim equals the exact registered route.
 */
export const NON_OWNER_ROUTE_BY_SURFACE = Object.freeze({
	public: "/",
	login: "/login",
	staff: "/staff",
});

/**
 * Enforcement-owned one-to-one bindings for the seven Owner surfaces superseded
 * by ADR-009. Each binding pins the exact surface key, ADR-009 decision surface
 * label, Owner section, `/admin` route, Paper area, canonical routed artifacts,
 * and the standing supersession decision. These values are the identity root:
 * `resolveCaseAuthorityIdentity` derives a case's authority domain from them,
 * and raw case fields are claims that must agree with the resolved binding.
 */
export const OWNER_SURFACE_BINDINGS = Object.freeze([
	Object.freeze({
		surface: "ownerSharedNavigation",
		adrSurface: "owner-shared-navigation",
		ownerSection: "shared-navigation",
		route: ownerRoute,
		paperArea: "OWNER SHARED NAVIGATION — FULL-ROUTE SUCCESSOR — CURRENT",
		canonicalArtifacts: Object.freeze([]),
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	}),
	Object.freeze({
		surface: "ownerDaily",
		adrSurface: "owner-daily",
		ownerSection: "daily",
		route: ownerRoute,
		paperArea: "OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT",
		canonicalArtifacts: Object.freeze([
			"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png",
			"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-en-mobile-390x844.png",
		]),
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	}),
	Object.freeze({
		surface: "ownerReports",
		adrSurface: "owner-reports",
		ownerSection: "reports",
		route: ownerRoute,
		paperArea: "OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT",
		canonicalArtifacts: Object.freeze([]),
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	}),
	Object.freeze({
		surface: "ownerAccountsAndSignIn",
		adrSurface: "owner-access",
		ownerSection: "accounts",
		route: ownerRoute,
		paperArea: "OWNER ACCESS — BEHAVIOR-CORRECT SUCCESSOR — CURRENT",
		canonicalArtifacts: Object.freeze([]),
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	}),
	Object.freeze({
		surface: "ownerActivityLog",
		adrSurface: "owner-activity-log",
		ownerSection: "activity",
		route: ownerRoute,
		paperArea: "OWNER ACTIVITY LOG — SHARED-SHELL SUCCESSOR — CURRENT",
		canonicalArtifacts: Object.freeze([
			"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-ar-desktop-1440x900.png",
			"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-en-mobile-390x844.png",
		]),
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	}),
	Object.freeze({
		surface: "ownerSystemStatus",
		adrSurface: "owner-system-status",
		ownerSection: "system-status",
		route: ownerRoute,
		paperArea:
			"OWNER UPTIME & INCIDENTS PRODUCTION SET — CANDIDATE + OWNER UPTIME — MOBILE STACKED RECORDS SUCCESSOR",
		canonicalArtifacts: Object.freeze([
			"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-ar-desktop-1440x900.png",
			"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-en-mobile-390x844.png",
		]),
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	}),
	Object.freeze({
		surface: "ownerSettings",
		adrSurface: "owner-settings",
		ownerSection: "settings",
		route: ownerRoute,
		paperArea: "OWNER SETTINGS — FRESH r01 SUCCESSOR CANDIDATE",
		canonicalArtifacts: Object.freeze([
			"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-en-desktop-1440x900.png",
			"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-ar-mobile-390x844.png",
		]),
		standingDecision: OWNER_SUPERSESSION_DECISION.path,
	}),
]);

/**
 * Fail-closed structural check for the enforcement-owned binding table. The
 * default table is validated on every registry pass; tests pass mutated copies
 * to prove that duplicate, missing, re-ordered, or drifted bindings cannot
 * weaken the domain.
 */
export function validateOwnerSurfaceBindings(
	bindings = OWNER_SURFACE_BINDINGS,
) {
	if (!Array.isArray(bindings)) {
		fail("Owner surface bindings must be an array");
	}
	if (bindings.length !== OWNER_SUPERSEDED_SURFACES.length) {
		fail(
			`Owner surface bindings must contain exactly the ${OWNER_SUPERSEDED_SURFACES.length} ADR-009 Owner surfaces; found ${bindings.length} entries`,
		);
	}
	const surfaces = [];
	const adrSurfaces = new Map();
	const ownerSections = new Map();
	const paperAreas = new Map();
	const canonicalArtifacts = new Map();
	for (const [index, binding] of bindings.entries()) {
		if (!binding || typeof binding !== "object") {
			fail(`Owner surface binding [${index}] must be a record`);
		}
		if (!isNonEmptyString(binding.surface)) {
			fail(`Owner surface binding [${index}] must name a non-empty surface`);
		}
		if (!OWNER_SUPERSEDED_SURFACES.includes(binding.surface)) {
			fail(
				`Owner surface binding ${binding.surface} is not a registered ADR-009 Owner surface`,
			);
		}
		if (surfaces.includes(binding.surface)) {
			fail(
				`Owner surface bindings contain a duplicate surface: ${binding.surface}`,
			);
		}
		surfaces.push(binding.surface);
		if (!isNonEmptyString(binding.adrSurface)) {
			fail(
				`Owner surface binding ${binding.surface} must name a non-empty adrSurface`,
			);
		}
		if (adrSurfaces.has(binding.adrSurface)) {
			fail(
				`Owner surface bindings contain a duplicate adrSurface ${binding.adrSurface} (${adrSurfaces.get(binding.adrSurface)} and ${binding.surface})`,
			);
		}
		adrSurfaces.set(binding.adrSurface, binding.surface);
		if (!isNonEmptyString(binding.ownerSection)) {
			fail(
				`Owner surface binding ${binding.surface} must name a non-empty ownerSection`,
			);
		}
		if (ownerSections.has(binding.ownerSection)) {
			fail(
				`Owner surface bindings contain a duplicate ownerSection ${binding.ownerSection} (${ownerSections.get(binding.ownerSection)} and ${binding.surface})`,
			);
		}
		ownerSections.set(binding.ownerSection, binding.surface);
		if (!isNonEmptyString(binding.paperArea)) {
			fail(
				`Owner surface binding ${binding.surface} must name a non-empty paperArea`,
			);
		}
		if (paperAreas.has(binding.paperArea)) {
			fail(
				`Owner surface bindings contain a duplicate paperArea ${binding.paperArea} (${paperAreas.get(binding.paperArea)} and ${binding.surface})`,
			);
		}
		paperAreas.set(binding.paperArea, binding.surface);
		if (binding.route !== ownerRoute) {
			fail(
				`Owner surface binding ${binding.surface} must pin route ${ownerRoute}; found ${formatClaim(binding.route)}`,
			);
		}
		if (binding.standingDecision !== OWNER_SUPERSESSION_DECISION.path) {
			fail(
				`Owner surface binding ${binding.surface} must pin the standing decision ${OWNER_SUPERSESSION_DECISION.path}; found ${formatClaim(binding.standingDecision)}`,
			);
		}
		if (!Array.isArray(binding.canonicalArtifacts)) {
			fail(
				`Owner surface binding ${binding.surface} must declare canonicalArtifacts as an array`,
			);
		}
		for (const artifact of binding.canonicalArtifacts) {
			if (!isNonEmptyString(artifact)) {
				fail(
					`Owner surface binding ${binding.surface} must pin canonical artifacts as non-empty strings`,
				);
			}
			if (canonicalArtifacts.has(artifact)) {
				fail(
					`canonical artifact ${artifact} is pinned to both ${canonicalArtifacts.get(artifact)} and ${binding.surface}`,
				);
			}
			canonicalArtifacts.set(artifact, binding.surface);
		}
	}
	const missing = OWNER_SUPERSEDED_SURFACES.filter(
		(surface) => !surfaces.includes(surface),
	);
	const extra = surfaces.filter(
		(surface) => !OWNER_SUPERSEDED_SURFACES.includes(surface),
	);
	if (missing.length || extra.length) {
		fail(
			`Owner surface bindings must equal the exact ADR-009 Owner surface set; missing: [${missing.join(", ")}]; extra: [${extra.join(", ")}]`,
		);
	}
}

const ownerSurfaceNames = new Set(
	OWNER_SURFACE_BINDINGS.map((binding) => binding.surface),
);
const ownerPaperAreas = new Set(
	OWNER_SURFACE_BINDINGS.map((binding) => binding.paperArea),
);
const pinnedCanonicalArtifacts = new Set(
	OWNER_SURFACE_BINDINGS.flatMap((binding) => binding.canonicalArtifacts),
);

function describeBindings(bindings) {
	return bindings.map((binding) => binding.surface).join(", ");
}

function describeBinding(binding) {
	return `surface ${binding.surface} (route ${binding.route}, ownerSection ${binding.ownerSection}, paperArea ${binding.paperArea}, standingDecision ${binding.standingDecision})`;
}

/**
 * Pure, order-independent authority-identity resolver.
 *
 * Owner signals — an Owner `surface` key, the `/admin` route, a non-empty
 * `ownerSection`, a non-null `supersessionRecord`, a pinned canonical artifact,
 * or a pinned Owner Paper area — force the Owner domain even when another
 * mutable field claims `public`, `login`, or `staff`. Owner identity is the
 * intersection of the bindings identified by the supplied discriminators, and
 * every supplied claim must then agree with the winning enforcement-owned
 * binding. Status is enforced inside the resolver, after identity is fixed:
 * `SUPERSEDED` needs the standing decision and a pinned canonical artifact,
 * `PLANNED` needs a null routed artifact and no supersession record, and
 * `ACCEPTED` always fails while the supersession stands. The input is never
 * mutated and claim order does not change the result.
 */
export function resolveCaseAuthorityIdentity(authorityCase) {
	// Plainness first: identity must be derived from data, never from a
	// code-shaped object whose own properties change between reads.
	assertPlainAuthorityCase(undefined, authorityCase);
	const id = authorityCase.id ?? "(missing id)";
	const surfaceClaim = authorityCase.surface ?? null;
	const routeClaim = authorityCase.route ?? null;
	const sectionClaim = isNonEmptyString(authorityCase.ownerSection)
		? authorityCase.ownerSection
		: null;
	const supersessionClaim = isNonEmptyString(authorityCase.supersessionRecord)
		? authorityCase.supersessionRecord
		: null;
	const artifactClaim = isNonEmptyString(authorityCase.routedArtifact?.path)
		? authorityCase.routedArtifact.path
		: null;
	const areaClaim = isNonEmptyString(authorityCase.paperReference?.area)
		? authorityCase.paperReference.area
		: null;
	const statusClaim = authorityCase.status ?? null;

	const surfaceIsOwner = ownerSurfaceNames.has(surfaceClaim);
	const routeIsOwner = routeClaim === ownerRoute;
	const artifactIsPinned =
		artifactClaim !== null && pinnedCanonicalArtifacts.has(artifactClaim);
	const areaIsOwner = areaClaim !== null && ownerPaperAreas.has(areaClaim);

	const ownerSignals = [];
	if (surfaceIsOwner) ownerSignals.push(`surface ${surfaceClaim}`);
	if (routeIsOwner) ownerSignals.push(`route ${routeClaim}`);
	if (sectionClaim !== null) ownerSignals.push(`ownerSection ${sectionClaim}`);
	if (supersessionClaim !== null)
		ownerSignals.push(`supersessionRecord ${supersessionClaim}`);
	if (artifactIsPinned)
		ownerSignals.push(`routedArtifact.path ${artifactClaim}`);
	if (areaIsOwner) ownerSignals.push(`paperReference.area ${areaClaim}`);

	if (!ownerSignals.length) {
		if (!Object.hasOwn(NON_OWNER_ROUTE_BY_SURFACE, surfaceClaim)) {
			fail(
				`${id}: non-Owner authority requires surface public, login, or staff; found ${formatClaim(surfaceClaim)}`,
			);
		}
		const requiredRoute = NON_OWNER_ROUTE_BY_SURFACE[surfaceClaim];
		if (routeClaim !== requiredRoute) {
			fail(
				`${id}: non-Owner surface ${surfaceClaim} requires route ${requiredRoute}; found ${formatClaim(routeClaim)}`,
			);
		}
		return { domain: surfaceClaim, surface: surfaceClaim, route: routeClaim };
	}

	const claims = [
		{
			label: `surface ${formatClaim(surfaceClaim)}`,
			matches: surfaceIsOwner
				? OWNER_SURFACE_BINDINGS.filter(
						(binding) => binding.surface === surfaceClaim,
					)
				: [],
		},
	];
	if (sectionClaim !== null) {
		claims.push({
			label: `ownerSection ${formatClaim(sectionClaim)}`,
			matches: OWNER_SURFACE_BINDINGS.filter(
				(binding) => binding.ownerSection === sectionClaim,
			),
		});
	}
	if (routeIsOwner) {
		claims.push({
			label: `route ${formatClaim(routeClaim)}`,
			matches: [...OWNER_SURFACE_BINDINGS],
		});
	}
	if (supersessionClaim !== null) {
		claims.push({
			label: `supersessionRecord ${formatClaim(supersessionClaim)}`,
			matches: [...OWNER_SURFACE_BINDINGS],
		});
	}
	if (artifactIsPinned) {
		claims.push({
			label: `routedArtifact.path ${formatClaim(artifactClaim)}`,
			matches: OWNER_SURFACE_BINDINGS.filter((binding) =>
				binding.canonicalArtifacts.includes(artifactClaim),
			),
		});
	}
	if (areaClaim !== null) {
		claims.push({
			label: `paperReference.area ${formatClaim(areaClaim)}`,
			matches: OWNER_SURFACE_BINDINGS.filter(
				(binding) => binding.paperArea === areaClaim,
			),
		});
	}

	const claimSummary = claims
		.map(
			(claim) =>
				`${claim.label} identifies ${describeBindings(claim.matches) || "(none)"}`,
		)
		.join("; ");
	const suppliedClaims = `supplied claims: surface ${formatClaim(surfaceClaim)}, route ${formatClaim(routeClaim)}, ownerSection ${formatClaim(sectionClaim)}, supersessionRecord ${formatClaim(supersessionClaim)}, routedArtifact.path ${formatClaim(artifactClaim)}, paperReference.area ${formatClaim(areaClaim)}, status ${formatClaim(statusClaim)}`;
	const conflictingClaims = claims.filter((claim) => !claim.matches.length);
	const identifyingClaims = claims.filter((claim) => claim.matches.length);
	const enforcedSurfaces = new Set(
		identifyingClaims.flatMap((claim) =>
			claim.matches.map((binding) => binding.surface),
		),
	);
	const enforcedSurface = surfaceIsOwner
		? surfaceClaim
		: enforcedSurfaces.size === 1
			? [...enforcedSurfaces][0]
			: null;
	const cannotReturn =
		enforcedSurface === null
			? ""
			: `surface ${enforcedSurface} cannot return to active authority while supersession authority ${OWNER_SUPERSESSION_DECISION.path} is not revoked`;

	let candidates = null;
	for (const claim of claims) {
		candidates =
			candidates === null
				? claim.matches
				: candidates.filter((binding) => claim.matches.includes(binding));
	}
	if (!candidates.length) {
		fail(
			`${id}: contradictory authority claims under enforcement-owned Owner identity; ${conflictingClaims.length ? `unregistered claims: ${conflictingClaims.map((claim) => claim.label).join(", ")}; ` : ""}${claimSummary}; ${suppliedClaims}; enforcement-owned Owner identities: ${describeBindings(OWNER_SURFACE_BINDINGS)}${cannotReturn ? `; ${cannotReturn}` : ""}`,
		);
	}
	if (candidates.length > 1) {
		fail(
			`${id}: ambiguous Owner authority identity — supplied claims identify multiple bindings (${describeBindings(candidates)}); ${claimSummary}; ${suppliedClaims}; enforcement-owned Owner identities: ${describeBindings(OWNER_SURFACE_BINDINGS)}`,
		);
	}
	const [binding] = candidates;

	const disagreements = [];
	if (routeClaim !== binding.route) {
		disagreements.push(
			`route claim ${formatClaim(routeClaim)} does not match ${binding.route}`,
		);
	}
	if (surfaceClaim !== binding.surface) {
		disagreements.push(
			`surface claim ${formatClaim(surfaceClaim)} does not match ${binding.surface}`,
		);
	}
	if (sectionClaim !== binding.ownerSection) {
		disagreements.push(
			`ownerSection claim ${formatClaim(sectionClaim)} does not match ${binding.ownerSection}`,
		);
	}
	if (areaClaim !== binding.paperArea) {
		disagreements.push(
			`paperReference.area claim ${formatClaim(areaClaim)} does not match ${binding.paperArea}`,
		);
	}
	if (disagreements.length) {
		const acceptedSuffix =
			statusClaim === "ACCEPTED"
				? `; ${id} cannot be ACCEPTED on surface ${binding.surface}`
				: "";
		fail(
			`${id}: enforcement-owned Owner identity is ${describeBinding(binding)}; supplied claims disagree: ${disagreements.join("; ")}; ${suppliedClaims}${cannotReturn ? `; ${cannotReturn}` : ""}${acceptedSuffix}`,
		);
	}

	if (statusClaim === "SUPERSEDED") {
		if (supersessionClaim !== binding.standingDecision) {
			if (supersessionClaim === null) {
				fail(
					`${id}: status SUPERSEDED requires a supersessionRecord; supersessionRecord is required and must equal the enforcement-owned standing decision ${binding.standingDecision} (${describeBinding(binding)}; ${suppliedClaims}); ${cannotReturn}`,
				);
			}
			fail(
				`${id}: supersessionRecord is not a registered supersession authority: ${supersessionClaim}; the enforcement-owned standing decision is ${binding.standingDecision} (${describeBinding(binding)}; ${suppliedClaims}); ${cannotReturn}`,
			);
		}
		if (
			artifactClaim === null ||
			!binding.canonicalArtifacts.includes(artifactClaim)
		) {
			const pinned = binding.canonicalArtifacts.length
				? binding.canonicalArtifacts.join(", ")
				: "(none are registered for this binding)";
			fail(
				`${id}: status SUPERSEDED requires routedArtifact.path to be a pinned canonical artifact of ${binding.surface}; found ${formatClaim(artifactClaim)}; pinned canonical artifacts: ${pinned} (${describeBinding(binding)}; ${suppliedClaims}); ${cannotReturn}`,
			);
		}
	} else if (statusClaim === "PLANNED") {
		if (supersessionClaim !== null) {
			fail(
				`${id}: status PLANNED must not carry a supersessionRecord; found ${formatClaim(supersessionClaim)} (${describeBinding(binding)}; ${suppliedClaims}); ${cannotReturn}`,
			);
		}
		if (artifactClaim !== null) {
			fail(
				`${id}: status PLANNED must not carry a routedArtifact; found ${formatClaim(artifactClaim)} (${describeBinding(binding)}; ${suppliedClaims}); ${cannotReturn}`,
			);
		}
	} else if (statusClaim === "ACCEPTED") {
		fail(
			`${id}: ${id} cannot be ACCEPTED on surface ${binding.surface}; the Owner composition authority ${describeBinding(binding)} is superseded by the standing decision ${binding.standingDecision}; ${suppliedClaims}; ${cannotReturn}`,
		);
	} else {
		fail(
			`${id}: unsupported Owner authority status ${formatClaim(statusClaim)}; expected PLANNED, ACCEPTED, or SUPERSEDED (${describeBinding(binding)}; ${suppliedClaims}); ${cannotReturn}`,
		);
	}

	return {
		domain: "owner",
		surface: binding.surface,
		route: binding.route,
		ownerSection: binding.ownerSection,
		paperArea: binding.paperArea,
		canonicalArtifact: artifactClaim,
		standingDecision: binding.standingDecision,
	};
}
