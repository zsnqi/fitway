import type { MessageCatalog } from "../catalog";

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
