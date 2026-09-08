import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
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
	const [locale, setLocale] = useState<Locale>(() => {
		const initialLocale = getInitialLocale();
		applyDocumentLocale(initialLocale);
		return initialLocale;
	});
	const localeRef = useRef(locale);

	const publishLocale = useCallback((nextLocale: Locale) => {
		if (nextLocale === localeRef.current) return;
		// Direction is part of the locale transaction. Apply it before React can
		// publish translated descendants so the first measured frame is coherent.
		applyDocumentLocale(nextLocale);
		localeRef.current = nextLocale;
		setLocale(nextLocale);
	}, []);

	useEffect(() => {
		try {
			window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
		} catch {
			// The document locale still works when storage is unavailable.
		}
	}, [locale]);

	useEffect(() => {
		function handleStorage(event: StorageEvent) {
			if (event.key === LOCALE_STORAGE_KEY && isLocale(event.newValue)) {
				publishLocale(event.newValue);
			}
		}

		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, [publishLocale]);

	const toggleLocale = useCallback(() => {
		publishLocale(getOppositeLocale(localeRef.current));
	}, [publishLocale]);

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
