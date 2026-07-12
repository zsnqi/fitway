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
		unavailableTitle: string;
		unavailableDescription: string;
		loading: string;
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
