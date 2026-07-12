import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import type { Locale, MessageCatalog } from "./catalog";
import {
	applyDocumentLocale,
	getInitialLocale,
	getOppositeLocale,
	isLocale,
	LOCALE_STORAGE_KEY,
	localeConfig,
} from "./locale";

type I18nContextValue = {
	locale: Locale;
	messages: MessageCatalog;
	toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocale] = useState<Locale>(getInitialLocale);

	useEffect(() => {
		applyDocumentLocale(locale);
		try {
			window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
		} catch {
			// The document locale still works when storage is unavailable.
		}
	}, [locale]);

	useEffect(() => {
		function handleStorage(event: StorageEvent) {
			if (event.key === LOCALE_STORAGE_KEY && isLocale(event.newValue)) {
				setLocale(event.newValue);
			}
		}

		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, []);

	const toggleLocale = useCallback(() => {
		setLocale((current) => getOppositeLocale(current));
	}, []);

	const value = useMemo<I18nContextValue>(
		() => ({
			locale,
			messages: localeConfig[locale].messages,
			toggleLocale,
		}),
		[locale, toggleLocale],
	);

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("useI18n must be used within I18nProvider");
	}
	return context;
}
