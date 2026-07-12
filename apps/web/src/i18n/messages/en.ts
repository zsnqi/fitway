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
	},
	publicPage: {
		eyebrow: "Gym status now",
		unavailableTitle: "Live occupancy is unavailable right now",
		unavailableDescription:
			"We will not present an old count as live. Please try again later.",
		loading: "Loading occupancy status",
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
