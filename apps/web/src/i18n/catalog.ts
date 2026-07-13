export type Locale = "ar" | "en";

export type MessageCatalog = {
	metadata: {
		title: string;
		description: string;
	};
	common: {
		brandName: string;
		languageSwitchLabel: string;
		languageSwitchText: string;
	};
	publicPage: {
		eyebrow: string;
		open: string;
		closedTitle: string;
		opensAt: (time: string) => string;
		closedSummary: (opening: string | null) => string;
		unavailableTitle: string;
		unavailableDescription: string;
		loading: string;
		around: string;
		people: string;
		percentFull: (percent: string) => string;
		bands: Record<"quiet" | "moderate" | "busy" | "packed", string>;
		fresh: string;
		stale: string;
		lastUpdated: (absolute: string, relative: string) => string;
		lastKnown: string;
		staleWarning: (count: string, time: string) => string;
		meterLabel: string;
		meterValue: (percent: string, band: string) => string;
		summary: (
			band: string,
			count: string,
			percent: string,
			open: string,
			freshness: string,
			time: string,
		) => string;
	};
	login: {
		title: string;
		description: string;
		emailLabel: string;
		passwordLabel: string;
		submit: string;
		submitting: string;
		loading: string;
		emailInvalid: string;
		passwordTooShort: (minimum: string) => string;
		authError: string;
	};
};
