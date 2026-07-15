import { useEffect, useMemo, useState } from "react";
import { copy } from "./content";
import {
	AccessPage,
	AnalyticsPage,
	AuditPage,
	HealthPage,
	HistoryPage,
	SettingsPage,
} from "./OwnerPages";
import { PublicPage } from "./PublicPages";
import { ReviewIndex } from "./ReviewIndex";
import { ROUTES } from "./routing";
import { StaffLivePage, StaffLoginPage } from "./StaffPages";

const knownRoutes = new Set(Object.values(ROUTES));

export default function Preview() {
	const params = useMemo(() => new URLSearchParams(window.location.search), []);
	const [locale, setLocale] = useState(
		params.get("lang") === "en" ? "en" : "ar",
	);
	const requestedRoute = params.get("route") || ROUTES.public;
	const route = knownRoutes.has(requestedRoute)
		? requestedRoute
		: ROUTES.public;
	const state = params.get("state") || "live";
	const strings = copy[locale];

	useEffect(() => {
		document.documentElement.lang = locale;
		document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
		document.title =
			route === ROUTES.review ? strings.review.title : `FITWAY — ${route}`;
	}, [locale, route, strings.review.title]);

	const toggleLocale = () => {
		const next = locale === "ar" ? "en" : "ar";
		params.set("lang", next);
		window.history.replaceState(
			{},
			"",
			`${window.location.pathname}?${params.toString()}`,
		);
		setLocale(next);
	};

	const commonProps = { locale, strings, onToggle: toggleLocale };
	switch (route) {
		case ROUTES.review:
			return <ReviewIndex {...commonProps} />;
		case ROUTES.login:
			return <StaffLoginPage {...commonProps} state={state} />;
		case ROUTES.staff:
			return <StaffLivePage {...commonProps} state={state} />;
		case ROUTES.analytics:
			return <AnalyticsPage {...commonProps} />;
		case ROUTES.history:
			return <HistoryPage {...commonProps} />;
		case ROUTES.settings:
			return <SettingsPage {...commonProps} />;
		case ROUTES.access:
			return <AccessPage {...commonProps} />;
		case ROUTES.audit:
			return <AuditPage {...commonProps} />;
		case ROUTES.health:
			return <HealthPage {...commonProps} />;
		default:
			return <PublicPage {...commonProps} state={state} />;
	}
}
