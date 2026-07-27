import type { StaffWebMessages } from "@/components/staff/messages";
import type { MessageCatalog } from "../catalog";

const isolate = (value: string) => `\u2068${value}\u2069`;

export const staffWeb = {
	common: {
		operations: "Live operations",
		admin: "Owner area",
		languageSwitchLabel: "Switch to Arabic",
		languageSwitchText: "العربية",
		logout: "Sign out",
		loggingOut: "Signing out",
		skipToContent: "Skip to operational status",
	},
	login: {
		eyebrow: "Front desk",
		title: "Open live operations",
		description: "Enter the shared front-desk PIN.",
		pinLabel: "Staff PIN",
		pinHint: (minimum, maximum) =>
			`Use ${isolate(minimum)}–${isolate(maximum)} Western digits.`,
		pinInvalid: (minimum, maximum) =>
			`Enter a PIN of ${isolate(minimum)}–${isolate(maximum)} Western digits.`,
		submit: "Open operations",
		submitting: "Opening operations",
		invalidCredentials: "Unable to sign in. Check the PIN and try again.",
		rateLimited: (seconds) =>
			`Too many attempts. Try again in ${isolate(seconds)} seconds.`,
		serviceError: "Sign-in is temporarily unavailable. Try again.",
	},
	staff: {
		eyebrow: "Front desk",
		title: "Live operations",
		description: "Occupancy, device health, and count controls in one view.",
		loading: "Loading operational status",
		loadErrorTitle: "Operational status could not be loaded",
		loadErrorDescription:
			"The request failed. No missing reading is being presented as unavailable.",
		retry: "Try again",
		retrying: "Trying again",
		occupancyTitle: "Current reading",
		openNow: "Gym open now",
		closedNow: "Gym closed now",
		live: "Live reading",
		stale: "Last-known reading",
		staleDescription: "Live updates are delayed. These values are last known.",
		unavailable: "Occupancy unavailable",
		unavailableDescription: "There is no usable occupancy reading to show.",
		crowdLevel: "Crowd level",
		approximateCount: "Approximate count",
		capacity: "Configured capacity",
		source: "Reading source",
		sources: { edge: "Edge device", manual: "Manual reading" },
		lastUpdated: (time) => `Updated ${isolate(time)}`,
		nextOpen: (time) => `Next opens ${isolate(time)}`,
		healthTitle: "System health",
		healthDescription: "Server-evaluated device freshness and condition.",
		healthFreshness: "Health freshness",
		healthCondition: "Overall condition",
		process: "Counting process",
		camera: "Camera",
		feed: "Video feed",
		detectorFps: "Detector rate",
		edgeObservedAt: "Observed at edge",
		receivedAt: "Received by server",
		lastSeenAt: "Device last seen",
		staleAt: "Stale threshold",
		notAvailable: "Not available",
		framesPerSecond: (value) => `${isolate(value)} FPS`,
		freshness: {
			current: "Current",
			stale: "Stale",
			unavailable: "Unavailable",
		},
		conditions: {
			healthy: "Healthy",
			degraded: "Degraded",
			failed: "Failed",
			unknown: "Unknown",
		},
		deviceStates: {
			ok: "OK",
			degraded: "Degraded",
			failed: "Failed",
			unknown: "Unknown",
		},
		bands: {
			quiet: "Quiet",
			moderate: "Moderate",
			busy: "Busy",
			packed: "Packed",
		},
	},
	admin: {
		eyebrow: "Owner access",
		title: "Owner area",
		description: "Owner-only navigation for FITWAY operations and governance.",
		placeholderTitle: "Owner navigation is ready",
		placeholderDescription:
			"Analytics, settings, accounts, audit, and health sections arrive in their assigned phases.",
		wrongRoleTitle: "Owner access required",
		wrongRoleDescription:
			"This staff session can use live operations but cannot open the owner area.",
		backToOperations: "Back to live operations",
	},
} satisfies StaffWebMessages;

export const en = {
	metadata: {
		title: "FITWAY | Live Gym Occupancy",
		description: "Check Fitway's current crowd status before your visit.",
	},
	common: {
		brandName: "FITWAY",
		languageSwitchLabel: "Switch to Arabic",
		languageSwitchText: "العربية",
		skipToContent: "Skip to occupancy status",
	},
	publicPage: {
		eyebrow: "Gym status now",
		open: "Gym open now",
		crowdLevel: "Crowd level",
		approximateCount: "Approximate count",
		closedTitle: "Closed now",
		opensAt: (time) => `Opens ${time}`,
		closedSummary: (opening) =>
			opening ? `The gym is closed now. ${opening}.` : "The gym is closed now.",
		unavailableTitle: "Live occupancy is unavailable right now",
		unavailableDescription:
			"We will not present an old count as live. Please try again later.",
		errorTitle: "We could not load the crowd status",
		errorDescription:
			"Check your connection and try again. We will not present old data as live.",
		retry: "Try again",
		retrying: "Trying again",
		loading: "Loading occupancy status",
		bands: {
			quiet: "Quiet",
			moderate: "Moderate",
			busy: "Busy",
			packed: "Packed",
		},
		fresh: "Live update",
		stale: "Last known update",
		staleStatus: "Live updates are delayed",
		lastKnownCrowdLevel: "Last known crowd level",
		lastKnownApproximateCount: "Last known approximate count",
		currentLevel: "Current level",
		lastKnownLevel: "Last known level",
		lastUpdatedAt: (absolute) => `Updated ${absolute}`,
		staleWarning: (count, time) =>
			`The last known approximate count was ${count} at ${time}. Live updates are delayed.`,
		crowdScaleLabel: "Crowd-level scale",
		crowdScaleValue: (band, completed, pending) =>
			`Crowd level: ${band}. Reached levels: ${completed || "none"}. Higher levels pending: ${pending || "none"}.`,
		summary: (band, count, open, freshness, time) =>
			`${freshness}. ${open}. Crowd level: ${band}. Approximate count: ${count}. Updated ${time}.`,
	},
	login: {
		title: "Sign in",
		description: "Fitway staff and management access",
		emailLabel: "Email address",
		passwordLabel: "Password",
		submit: "Sign in",
		submitting: "Signing in",
		loading: "Loading sign-in",
		emailInvalid: "Enter a valid email address.",
		passwordTooShort: (minimum) =>
			`Password must be at least ${minimum} characters.`,
		authError: "Sign-in failed. Check your details and try again.",
	},
} satisfies MessageCatalog;
