export const ROUTES = {
	public: "public-live",
	login: "staff-login",
	staff: "staff-live",
	analytics: "admin-analytics",
	history: "admin-history",
	settings: "admin-settings",
	access: "admin-access",
	audit: "admin-audit",
	health: "admin-health",
	review: "review",
};

export const PUBLIC_STATES = [
	"live",
	"loading",
	"stale",
	"unavailable",
	"closed",
	"error",
];

export function buildPreviewUrl({ route, state, lang = "ar" }) {
	const params = new URLSearchParams({ route, lang });
	if (state) params.set("state", state);
	return `?${params.toString()}`;
}
