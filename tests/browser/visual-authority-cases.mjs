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
function interpolationCases({ surface, route, ownerSection }) {
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
			approvedDeviationIds: [],
		})),
	);
}

const definitions = [
	{
		surface: "public",
		route: "/",
		states: [
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
		states: [
			"loading",
			"error",
			"no-observations",
			"insufficient-comparison",
			"invalid-range",
			"export-preparing",
			"export-failure",
		],
		landmarks: ownerLandmarks,
	},
	{
		surface: "ownerAccountsAndSignIn",
		route: "/admin",
		ownerSection: "accounts",
		states: [
			"created",
			"create-credential",
			"reset-credential",
			"deactivate-confirmation",
			"empty",
			"loading",
			"action-failure",
		],
		landmarks: ownerLandmarks,
	},
	{
		surface: "ownerActivityLog",
		route: "/admin",
		ownerSection: "activity",
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
		states: ["loading", "load-failure", "no-offline-periods", "no-incidents"],
		landmarks: ownerLandmarks,
	},
	{
		surface: "ownerSettings",
		route: "/admin",
		ownerSection: "settings",
		states: [
			"clean",
			"dirty",
			"validation",
			"saving",
			"saved",
			"atomic-failure",
		],
		landmarks: ownerLandmarks,
	},
];

/** @type {VisualAuthorityCase[]} */
export const visualAuthorityCases = Object.freeze([
	...definitions.flatMap(endpointCases),
	...definitions.flatMap(interpolationCases),
]);

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
