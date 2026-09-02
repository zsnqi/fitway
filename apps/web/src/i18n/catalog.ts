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
		skipToContent: string;
	};
	publicPage: {
		eyebrow: string;
		updateStatus: string;
		open: string;
		crowdLevel: string;
		approximateCount: string;
		closedTitle: string;
		closedStatus: string;
		opensAt: (time: string) => string;
		closedSummary: (opening: string | null) => string;
		unavailableTitle: string;
		unavailableStatus: string;
		unavailableDescription: string;
		errorTitle: string;
		errorStatus: string;
		errorDescription: string;
		retry: string;
		retrying: string;
		loading: string;
		loadingStatus: string;
		bands: Record<"quiet" | "moderate" | "busy" | "packed", string>;
		fresh: string;
		stale: string;
		staleStatus: string;
		lastKnownCrowdLevel: string;
		lastKnownApproximateCount: string;
		currentLevel: string;
		lastKnownLevel: string;
		lastUpdatedAt: (absolute: string) => string;
		staleWarning: string;
		crowdScaleLabel: string;
		crowdScaleValue: (
			band: string,
			completed: string,
			pending: string,
		) => string;
		summary: (
			band: string,
			count: string,
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
