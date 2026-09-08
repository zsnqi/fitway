/**
 * @typedef {"PLANNED" | "ACCEPTED"} VisualAuthorityStatus
 * @typedef {"paper" | "runtime-interpolation"} ComparisonMode
 * @typedef {{ width: number, height: number, zoom?: number }} AuthorityViewport
 * @typedef {{
 *   id: string,
 *   status: VisualAuthorityStatus,
 *   surface: string,
 *   route: string,
 *   ownerSection?: string,
 *   state: string,
 *   locale: "ar" | "en",
 *   viewport: AuthorityViewport,
 *   comparisonMode: ComparisonMode,
 *   paperReference: { area: string, leafExportPath?: string, leafExportSha256?: string },
 *   routedArtifact: null | { kind: "canonical" | "review", path: string, sha256?: string },
 *   landmarkContracts: string[],
 *   approvalRecord: null | string,
 *   approvedDeviationIds: string[],
 * }} VisualAuthorityCase
 */

export const surfaceAuthorities = Object.freeze({
	public: "PUBLIC CROWD BOARD PRODUCTION SET — CURRENT",
	login: "LOGIN PRODUCTION SET — CURRENT",
	staff:
		"STAFF MONITORING PRODUCTION SET — CURRENT + SELF-CONTAINED AUTHORITY REPAIR CANDIDATE",
	ownerSharedNavigation:
		"OWNER SHARED NAVIGATION — FULL-ROUTE SUCCESSOR — CURRENT",
	ownerDaily: "OWNER DAILY ANALYTICS PRODUCTION SET — CURRENT",
	ownerReports: "OWNER ANALYTICS — PHASE 10 REPORTING EXTENSION — CURRENT",
	ownerAccountsAndSignIn: "OWNER ACCESS — BEHAVIOR-CORRECT SUCCESSOR — CURRENT",
	ownerActivityLog: "OWNER ACTIVITY LOG — SHARED-SHELL SUCCESSOR — CURRENT",
	ownerSystemStatus:
		"OWNER UPTIME & INCIDENTS PRODUCTION SET — CANDIDATE + OWNER UPTIME — MOBILE STACKED RECORDS SUCCESSOR",
	ownerSettings: "OWNER SETTINGS — FRESH r01 SUCCESSOR CANDIDATE",
});

const endpointViewports = [
	{ key: "desktop", width: 1440, height: 900 },
	{ key: "mobile", width: 390, height: 844 },
];

const supplementalPaperViewports = [
	{ key: "tablet", width: 768, height: 1024 },
	{ key: "narrow", width: 320, height: 720 },
	{ key: "zoom200", width: 720, height: 900, zoom: 2 },
];

const interpolationViewports = [
	{ key: "w360", width: 360, height: 800 },
	{ key: "w721", width: 721, height: 900 },
	{ key: "w820", width: 820, height: 900 },
	{ key: "w1024", width: 1024, height: 900 },
	{ key: "w1200", width: 1200, height: 900 },
];

const locales = ["ar", "en"];
const ownerLandmarks = [
	"owner-global-shell",
	"owner-shared-navigation",
	"owner-active-panel",
];

function idPart(value) {
	return value.replaceAll(/[^a-zA-Z0-9]+/g, "-").replaceAll(/^-|-$/g, "");
}

/** @returns {VisualAuthorityCase[]} */
function endpointCases({
	surface,
	route,
	states,
	ownerSection,
	deviations = [],
	landmarks = ["application-shell", "route-main"],
}) {
	return states.flatMap((state) =>
		locales.flatMap((locale) =>
			endpointViewports.map((viewport) => ({
				id: [surface, state, locale, viewport.key].map(idPart).join("--"),
				status: "PLANNED",
				surface,
				route,
				...(ownerSection ? { ownerSection } : {}),
				state,
				locale,
				viewport: { width: viewport.width, height: viewport.height },
				comparisonMode: "paper",
				paperReference: { area: surfaceAuthorities[surface] },
				routedArtifact: null,
				landmarkContracts: [...landmarks],
				approvalRecord: null,
				approvedDeviationIds: [...deviations],
			})),
		),
	);
}

/** @returns {VisualAuthorityCase[]} */
function interpolationCases({ surface, route, ownerSection, deviations = [] }) {
	return locales.flatMap((locale) =>
		interpolationViewports.map((viewport) => ({
			id: [surface, "responsive", locale, viewport.key].map(idPart).join("--"),
			status: "PLANNED",
			surface,
			route,
			...(ownerSection ? { ownerSection } : {}),
			state: "responsive-interpolation",
			locale,
			viewport: { width: viewport.width, height: viewport.height },
			comparisonMode: "runtime-interpolation",
			paperReference: { area: surfaceAuthorities[surface] },
			routedArtifact: null,
			landmarkContracts: ownerSection
				? [...ownerLandmarks]
				: ["application-shell", "route-main"],
			approvalRecord: null,
			approvedDeviationIds: [...deviations],
		})),
	);
}

/** @returns {VisualAuthorityCase[]} */
function supplementalRuntimeCases({
	surface,
	route,
	ownerSection,
	runtimeSupplemental = false,
	deviations = [],
}) {
	if (!runtimeSupplemental) return [];
	return locales.flatMap((locale) =>
		supplementalPaperViewports.map((viewport) => ({
			id: [surface, "responsive-runtime", locale, viewport.key]
				.map(idPart)
				.join("--"),
			status: "PLANNED",
			surface,
			route,
			...(ownerSection ? { ownerSection } : {}),
			state: "responsive-runtime",
			locale,
			viewport: {
				width: viewport.width,
				height: viewport.height,
				...(viewport.zoom ? { zoom: viewport.zoom } : {}),
			},
			comparisonMode: "runtime-interpolation",
			paperReference: { area: surfaceAuthorities[surface] },
			routedArtifact: null,
			landmarkContracts: [...ownerLandmarks],
			approvalRecord: null,
			approvedDeviationIds: [...deviations],
		})),
	);
}

/** @returns {VisualAuthorityCase[]} */
function runtimeStateCases({
	surface,
	route,
	ownerSection,
	runtimeStates = [],
	deviations = [],
	landmarks = ["application-shell", "route-main"],
}) {
	return runtimeStates.flatMap((state) =>
		locales.flatMap((locale) =>
			endpointViewports.map((viewport) => ({
				id: [surface, state, locale, viewport.key].map(idPart).join("--"),
				status: "PLANNED",
				surface,
				route,
				...(ownerSection ? { ownerSection } : {}),
				state,
				locale,
				viewport: { width: viewport.width, height: viewport.height },
				comparisonMode: "runtime-interpolation",
				paperReference: { area: surfaceAuthorities[surface] },
				routedArtifact: null,
				landmarkContracts: [...landmarks],
				approvalRecord: null,
				approvedDeviationIds: [...deviations],
			})),
		),
	);
}

/** @returns {VisualAuthorityCase[]} */
function supplementalPaperCases({
	surface,
	route,
	ownerSection,
	paperViewportState,
	deviations = [],
	landmarks = ["application-shell", "route-main"],
}) {
	if (!paperViewportState) return [];
	return locales.flatMap((locale) =>
		supplementalPaperViewports.map((viewport) => ({
			id: [surface, paperViewportState, locale, viewport.key]
				.map(idPart)
				.join("--"),
			status: "PLANNED",
			surface,
			route,
			...(ownerSection ? { ownerSection } : {}),
			state: paperViewportState,
			locale,
			viewport: {
				width: viewport.width,
				height: viewport.height,
				...(viewport.zoom ? { zoom: viewport.zoom } : {}),
			},
			comparisonMode: "paper",
			paperReference: { area: surfaceAuthorities[surface] },
			routedArtifact: null,
			landmarkContracts: [...landmarks],
			approvalRecord: null,
			approvedDeviationIds: [...deviations],
		})),
	);
}

const definitions = [
	{
		surface: "public",
		route: "/",
		paperViewportState: "live",
		states: [
			"live",
			"loading",
			"delayed-last-known",
			"unavailable",
			"closed",
			"failure-retry",
		],
	},
	{
		surface: "login",
		route: "/login",
		paperViewportState: "idle",
		states: [
			"idle",
			"focus",
			"invalid-code",
			"too-many-attempts",
			"unavailable",
			"submitting",
		],
	},
	{
		surface: "staff",
		route: "/staff",
		paperViewportState: "live",
		runtimeStates: ["camera-failed"],
		deviations: ["staff-camera-failure-semantic-distinction"],
		states: [
			"loading",
			"live",
			"delayed",
			"unavailable",
			"closed",
			"failure",
			"combined-trust-failure",
		],
	},
	{
		surface: "ownerSharedNavigation",
		route: "/admin",
		ownerSection: "shared-navigation",
		paperViewportState: "responsive-shell",
		states: [
			"daily-active",
			"reports-active",
			"accounts-active",
			"activity-active",
			"system-status-active",
			"settings-active",
			"focus-visible",
		],
		deviations: ["owner-shared-navigation-uniform-material"],
		landmarks: ownerLandmarks,
	},
	{
		surface: "ownerDaily",
		route: "/admin",
		ownerSection: "daily",
		paperViewportState: "open",
		deviations: ["owner-daily-bounded-truthful-curve"],
		states: [
			"completed",
			"open",
			"closed",
			"latest",
			"focus",
			"loading",
			"failure-retry",
			"no-readings",
			"forbidden",
		],
		landmarks: ownerLandmarks,
	},
	{
		surface: "ownerReports",
		route: "/admin",
		ownerSection: "reports",
		paperViewportState: "comparable",
		states: [
			"comparable",
			"loading",
			"error",
			"no-observations",
			"insufficient-comparison",
			"invalid-range",
			"export-preparing",
			"export-failure",
		],
		deviations: ["owner-reports-runtime-data-and-disclosure"],
		landmarks: ownerLandmarks,
	},
	{
		surface: "ownerAccountsAndSignIn",
		route: "/admin",
		ownerSection: "accounts",
		runtimeSupplemental: true,
		states: [
			"created",
			"create-credential",
			"reset-credential",
			"deactivate-confirmation",
			"empty",
			"loading",
			"action-failure",
		],
		deviations: ["owner-access-runtime-contract-columns"],
		landmarks: ownerLandmarks,
	},
	{
		surface: "ownerActivityLog",
		route: "/admin",
		ownerSection: "activity",
		runtimeSupplemental: true,
		states: [
			"populated",
			"loading",
			"load-failure-retry",
			"no-matching-records",
		],
		deviations: ["owner-activity-log-bidi-and-presentation"],
		landmarks: ownerLandmarks,
	},
	{
		surface: "ownerSystemStatus",
		route: "/admin",
		ownerSection: "system-status",
		runtimeSupplemental: true,
		states: [
			"populated",
			"loading",
			"load-failure",
			"no-offline-periods",
			"no-incidents",
		],
		deviations: ["owner-system-status-shared-shell-runtime-data-and-bidi"],
		landmarks: ownerLandmarks,
	},
	{
		surface: "ownerSettings",
		route: "/admin",
		ownerSection: "settings",
		runtimeSupplemental: true,
		states: [
			"clean",
			"dirty",
			"validation",
			"saving",
			"saved",
			"atomic-failure",
		],
		deviations: ["owner-settings-shared-shell-and-runtime-values"],
		landmarks: ownerLandmarks,
	},
];

// Accepted canonical mapping for the human-approved full-route fidelity
// candidate (promotion run fidelity_promotion_r01; authorization + per-surface
// prior approvals in docs/phase-records/handoffs/full-route-paper-fidelity/20260905-human-visual-approval.md). One entry per honestly mapped promoted
// canonical: the depicted routed state matches the case state and the Paper
// leaf is the exact registered export for that locale/viewport/state, except
// staff trust-failure where the registry state vocabulary
// ("combined-trust-failure") names the Paper "trust-failure" leaf. Asserted
// canonicals without an honest case/leaf counterpart (login narrow exception
// states, shell rail element captures, settings loading/error states) are
// promoted for regression but intentionally remain rejected-listed.
const presentationR06ApprovalRecord =
	"docs/phase-records/handoffs/owner-demo-polish/20260908-presentation-ready-r06-visual-acceptance.md";

const ownerQualityPassApprovalRecord =
	"docs/phase-records/handoffs/owner-demo-polish/20260908-owner-quality-pass-visual-acceptance.md";

const acceptedCanonicalOverrides = Object.freeze({
	"login--idle--ar--desktop": {
		leafExportPath: "login/login-idle-ar-1440.png",
		leafExportSha256:
			"57e94c812ef2e4a562884c5ca7550477b9b16c572ba33c552513ee04f1df5c4e",
		routedPath:
			"win32/chromium/login-paper-adoption.browser.spec.ts/login-idle-ar-desktop-1440x900.png",
		routedSha256:
			"81f00333dcc42f4a2741659cd474f58e0517fcc90d53580eab07a74a929d69af",
	},
	"login--idle--en--mobile": {
		leafExportPath: "login/login-idle-en-390.png",
		leafExportSha256:
			"6db5a16a2b07aef50589fb1e7bc932d3cdb7a23eb1473746ec8858bf4ece79f2",
		routedPath:
			"win32/chromium/login-paper-adoption.browser.spec.ts/login-idle-en-mobile-390x844.png",
		routedSha256:
			"aea33aa43ea5494e8f3d0eeb3383c15a8b4cdf632f847b8c08105381f867593f",
	},
	"staff--live--ar--desktop": {
		approvalRecord: presentationR06ApprovalRecord,
		leafExportPath: "staff/staff-live-ar-1440.png",
		leafExportSha256:
			"f5121e33d453302391d0ba726f1fcfbfe25824c7bd1ccabee75447213e3a097b",
		routedPath:
			"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-live-route-ar-desktop-1440x900.png",
		routedSha256:
			"28058b9acd63c083e5229d385cb0df27efb1c0616f0f8498635990bc02b6be96",
	},
	"staff--live--en--mobile": {
		approvalRecord: presentationR06ApprovalRecord,
		leafExportPath: "staff/staff-live-en-390.png",
		leafExportSha256:
			"5d6f0e836ff85d78e4ee072100c2cb847867a3eee0c872cdb9da7098df3c53cc",
		routedPath:
			"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-live-route-en-mobile-390x844.png",
		routedSha256:
			"d5d1927dfb1f399ab0e07f5be22e63776521720afcfef1aef81fb2be8c29b0de",
	},
	"staff--closed--ar--mobile": {
		leafExportPath: "staff/staff-closed-ar-390.png",
		leafExportSha256:
			"aa1f14eaa8520eff67a94cc48d5b358537f84c922f3572e43aa57c5793bc6f75",
		routedPath:
			"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-closed-route-ar-mobile-390x844.png",
		routedSha256:
			"fdb46cc19e3fc5d8b045f23a020225ea95b7fed54a32c05d399a9e765ab86cf7",
	},
	"staff--loading--ar--mobile": {
		leafExportPath: "staff/staff-loading-ar-390.png",
		leafExportSha256:
			"75805623e336dfcf51644fb10b439a24c345e994a3f3ab17e331ced8f93003e1",
		routedPath:
			"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-loading-route-ar-mobile-390x844.png",
		routedSha256:
			"253ee0a4520eb17dd94020ca2ff1fd950800984e765fa3471cd5eff5e80230e0",
	},
	"staff--failure--en--mobile": {
		leafExportPath: "staff/staff-failure-en-390.png",
		leafExportSha256:
			"91d55f8fdd2f1ac90d050269e32bb2306c6ad8c3d152c300a4ebae6cce00ada8",
		routedPath:
			"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-error-route-en-mobile-390x844.png",
		routedSha256:
			"ef5eb7a20e2c5b4c5c94cb09efd67ed3ecfbb03d53189129d29eedf25673cf21",
	},
	"staff--combined-trust-failure--en--mobile": {
		leafExportPath: "staff/staff-trust-failure-en-390.png",
		leafExportSha256:
			"20584051754c36ac2c63842f6e34652f33cbdeae3a48e08c230f6dbc5adc081e",
		routedPath:
			"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-trust-failure-route-en-mobile-390x844.png",
		routedSha256:
			"fcb5dfc9265460eb8b4f3b1c9d5c103e990e015d9d765a15e67d2be023e9de40",
	},
	"ownerDaily--completed--ar--desktop": {
		approvalRecord: ownerQualityPassApprovalRecord,
		leafExportPath: "owner-daily/owner-daily-closed-ar-1440.png",
		leafExportSha256:
			"63109032f42fc6ce2ff697d7c9e35e061b38369c1433d69068d3f5b2000975ec",
		routedPath:
			"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png",
		routedSha256:
			"063721013eb6040fe08835aa31ee2ab8d309c283100585a1453aaf1b08d40342",
	},
	"ownerDaily--completed--en--mobile": {
		approvalRecord: ownerQualityPassApprovalRecord,
		leafExportPath: "owner-daily/owner-daily-closed-en-390.png",
		leafExportSha256:
			"f2e36563997daf06c5a1b36a9ce59a7b6667e27741c31e07d6701dac6b74d5bb",
		routedPath:
			"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-en-mobile-390x844.png",
		routedSha256:
			"1b4bb75ec97529bb9ca9e38a768b2b86c3832266c1cd3bd07f02f2a8af72e3cc",
	},
	"ownerActivityLog--populated--ar--desktop": {
		approvalRecord: ownerQualityPassApprovalRecord,
		leafExportPath:
			"owner-activity-log/owner-activity-desktop-ar-populated-1440.png",
		leafExportSha256:
			"a781884fe9f9307392f180e5efc3e6f9cb34d93bfc34f428885ba1c700240a38",
		routedPath:
			"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-ar-desktop-1440x900.png",
		routedSha256:
			"7172973ba75ad4011068103e0f4314b90d7a3024b4a992f9d0f710fd384109e0",
	},
	"ownerActivityLog--populated--en--mobile": {
		approvalRecord: ownerQualityPassApprovalRecord,
		leafExportPath:
			"owner-activity-log/owner-activity-mobile-en-populated-390.png",
		leafExportSha256:
			"01ce22df5ea3f93e07bae05fbd93adfa6a816ad51216087ceea5b97a49bebd47",
		routedPath:
			"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-en-mobile-390x844.png",
		routedSha256:
			"db12e5ebbf8ff99fe5a566e0b7d99f09863da857fc36fcc803ae6e261f8fbda4",
	},
	"ownerSystemStatus--populated--ar--desktop": {
		approvalRecord: ownerQualityPassApprovalRecord,
		leafExportPath:
			"owner-system-status/owner-system-status-desktop-ar-1440.png",
		leafExportSha256:
			"6fc47ca233a2c99533d5d104e1b9ebf5918de69921f8e0c5393b2f1ac0d014bc",
		routedPath:
			"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-ar-desktop-1440x900.png",
		routedSha256:
			"e5d5aebdee76ca295d2ddf4c87230871bb2c6886b689834c8441a889a07c7404",
	},
	"ownerSystemStatus--populated--en--mobile": {
		approvalRecord: ownerQualityPassApprovalRecord,
		leafExportPath: "owner-system-status/owner-system-status-mobile-en-390.png",
		leafExportSha256:
			"65cc8644f19c6a35e253b1c468c070c019ca150f8c7332460daa3e42c8320873",
		routedPath:
			"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-en-mobile-390x844.png",
		routedSha256:
			"df50002fb7c4231172a07c7b71c55cd6c5882554c9ed3683dadbb242188a1ca0",
	},
	"ownerSettings--clean--en--desktop": {
		approvalRecord: presentationR06ApprovalRecord,
		leafExportPath: "owner-settings/owner-settings-desktop-en-1440.png",
		leafExportSha256:
			"c1e77941e2861f0d681ce1345e54147dfae579f0f1d9f33461951d03734e811c",
		routedPath:
			"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-en-desktop-1440x900.png",
		routedSha256:
			"b9dc6764a8586e212f6b88e017eabebae3965b886c04471735591fa3dad74d07",
	},
	"ownerSettings--dirty--ar--mobile": {
		approvalRecord: presentationR06ApprovalRecord,
		leafExportPath: "owner-settings/owner-settings-mobile-ar-390.png",
		leafExportSha256:
			"bb4f5e3e0e2af73e18a119b75c7318f083de26b839410e23fa049160a29e65da",
		routedPath:
			"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-ar-mobile-390x844.png",
		routedSha256:
			"06f6e28069234b5e607c21582706249468ba9118ab74ea589671a8482b77dff1",
	},
});

const acceptedApprovalRecord =
	"docs/phase-records/handoffs/full-route-paper-fidelity/20260905-human-visual-approval.md";

function applyAcceptedCanonicalOverrides(cases) {
	return cases.map((authorityCase) => {
		const override = acceptedCanonicalOverrides[authorityCase.id];
		if (!override) return authorityCase;
		return {
			...authorityCase,
			status: "ACCEPTED",
			paperReference: {
				...authorityCase.paperReference,
				leafExportPath: override.leafExportPath,
				leafExportSha256: override.leafExportSha256,
			},
			routedArtifact: {
				kind: "canonical",
				path: override.routedPath,
				sha256: override.routedSha256,
			},
			approvalRecord: override.approvalRecord ?? acceptedApprovalRecord,
		};
	});
}

/** @type {VisualAuthorityCase[]} */
export const visualAuthorityCases = Object.freeze(
	applyAcceptedCanonicalOverrides([
		...definitions.flatMap(endpointCases),
		...definitions.flatMap(supplementalPaperCases),
		...definitions.flatMap(runtimeStateCases),
		...definitions.flatMap(supplementalRuntimeCases),
		...definitions.flatMap(interpolationCases),
	]),
);

// This list is deliberately independent of the case builders. Repository
// verification fails if a primary Paper state or an exact Paper-covered
// viewport disappears from the registry, even when the remaining cases are
// internally well formed.
export const requiredPaperCoverage = Object.freeze([
	{
		surface: "public",
		state: "live",
		viewports: [...endpointViewports, ...supplementalPaperViewports],
	},
	{
		surface: "login",
		state: "idle",
		viewports: [...endpointViewports, ...supplementalPaperViewports],
	},
	{
		surface: "staff",
		state: "live",
		viewports: [...endpointViewports, ...supplementalPaperViewports],
	},
	{
		surface: "ownerSharedNavigation",
		state: "responsive-shell",
		viewports: supplementalPaperViewports,
	},
	{
		surface: "ownerDaily",
		state: "open",
		viewports: [...endpointViewports, ...supplementalPaperViewports],
	},
	{
		surface: "ownerReports",
		state: "comparable",
		viewports: [...endpointViewports, ...supplementalPaperViewports],
	},
	{
		surface: "ownerSystemStatus",
		state: "populated",
		viewports: endpointViewports,
	},
]);

export const requiredRuntimeCoverage = Object.freeze(
	[
		"ownerAccountsAndSignIn",
		"ownerActivityLog",
		"ownerSystemStatus",
		"ownerSettings",
	]
		.map((surface) => ({
			surface,
			state: "responsive-runtime",
			comparisonMode: "runtime-interpolation",
			viewports: supplementalPaperViewports,
		}))
		.concat([
			{
				surface: "staff",
				state: "camera-failed",
				comparisonMode: "runtime-interpolation",
				viewports: endpointViewports,
			},
		]),
);

// r05 screenshots are preserved only to prove what was rejected. Listing every
// path prevents a new implementation-generated screenshot from entering this
// tree without an explicit case and approval decision.
export const r05RejectedCanonicalArtifacts = Object.freeze([
	"win32/chromium/login-paper-adoption.browser.spec.ts/login-idle-ar-desktop-1440x900.png",
	"win32/chromium/login-paper-adoption.browser.spec.ts/login-idle-en-mobile-390x844.png",
	"win32/chromium/login-paper-adoption.browser.spec.ts/login-invalid-route-en-320x720.png",
	"win32/chromium/login-paper-adoption.browser.spec.ts/login-service-route-en-320x720.png",
	"win32/chromium/login-paper-adoption.browser.spec.ts/login-submitting-route-en-320x720.png",
	"win32/chromium/phase10-ui-csv.browser.spec.ts/owner-history-error-route-en-mobile-390x844.png",
	"win32/chromium/phase10-ui-csv.browser.spec.ts/owner-history-loading-route-en-mobile-390x844.png",
	"win32/chromium/phase10-ui-csv.browser.spec.ts/owner-history-route-ar-mobile-390x844.png",
	"win32/chromium/phase10-ui-csv.browser.spec.ts/owner-history-route-en-desktop-1440x900.png",
	"win32/chromium/phase11-access.browser.spec.ts/owner-access-route-ar-desktop-1440x900.png",
	"win32/chromium/phase11-access.browser.spec.ts/owner-access-route-en-mobile-390x844.png",
	"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-ar-desktop-1440x900.png",
	"win32/chromium/phase11-audit.browser.spec.ts/owner-audit-route-en-mobile-390x844.png",
	"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-ar-desktop-1440x900.png",
	"win32/chromium/phase11-health.browser.spec.ts/owner-health-route-en-mobile-390x844.png",
	"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-error-route-en-desktop-1440x900.png",
	"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-loading-route-en-desktop-1440x900.png",
	"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-ar-mobile-390x844.png",
	"win32/chromium/phase11-settings.browser.spec.ts/owner-settings-route-en-desktop-1440x900.png",
	"win32/chromium/phase11-shell.browser.spec.ts/owner-shell-ar-desktop-1440x900.png",
	"win32/chromium/phase11-shell.browser.spec.ts/owner-shell-en-mobile-390x844.png",
	"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-error-route-ar-desktop-1440x900.png",
	"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-loading-route-ar-desktop-1440x900.png",
	"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-ar-desktop-1440x900.png",
	"win32/chromium/phase9-owner-ui.browser.spec.ts/owner-daily-route-en-mobile-390x844.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-closed-route-en-mobile-390x844.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-error-route-en-mobile-390x844.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-live-ar-desktop-1440x900.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-live-ar-mobile-390x844.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-live-en-desktop-1440x900.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-live-en-mobile-390x844.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-live-en-tablet-1024x900.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-loading-route-en-mobile-390x844.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-stale-ar-tablet-768x1024.png",
	"win32/chromium/public-baseline.browser.spec.ts/public-unavailable-route-en-mobile-390x844.png",
	"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-closed-route-ar-mobile-390x844.png",
	"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-error-route-en-mobile-390x844.png",
	"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-live-route-ar-desktop-1440x900.png",
	"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-live-route-en-mobile-390x844.png",
	"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-loading-route-ar-mobile-390x844.png",
	"win32/chromium/staff-paper-fidelity.review.spec.ts/staff-trust-failure-route-en-mobile-390x844.png",
]);
