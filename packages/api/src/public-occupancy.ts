export const PUBLIC_OCCUPANCY_RESOURCE_PATH = "/public/occupancy";
export const PUBLIC_OCCUPANCY_EXTERNAL_PATH = `/api${PUBLIC_OCCUPANCY_RESOURCE_PATH}`;
export const PUBLIC_OCCUPANCY_INTERNAL_PATH = PUBLIC_OCCUPANCY_RESOURCE_PATH;
export const PUBLIC_OCCUPANCY_CACHE_CONTROL =
	"public, s-maxage=30, stale-while-revalidate=60";

export function createPublicOccupancyUrl(serverBase: string): string {
	const normalizedBase = serverBase.endsWith("/")
		? serverBase.slice(0, -1)
		: serverBase;
	return `${normalizedBase}${PUBLIC_OCCUPANCY_RESOURCE_PATH}`;
}

export type PublicOccupancyUnavailablePayload = {
	schemaVersion: 1;
	freshness: "unavailable";
	computedAt: string;
	trend: null;
};

export function createUnavailablePublicOccupancyPayload(
	now: Date = new Date(),
): PublicOccupancyUnavailablePayload {
	return {
		schemaVersion: 1,
		freshness: "unavailable",
		computedAt: now.toISOString(),
		trend: null,
	};
}

export function isPublicOccupancyUnavailablePayload(
	value: unknown,
): value is PublicOccupancyUnavailablePayload {
	if (!value || typeof value !== "object") return false;
	const payload = value as Record<string, unknown>;
	const allowedKeys = new Set([
		"schemaVersion",
		"freshness",
		"computedAt",
		"trend",
	]);
	const keys = Object.keys(payload);
	const hasExactKeys =
		keys.length === allowedKeys.size &&
		keys.every((key) => allowedKeys.has(key));
	const computedAt = payload.computedAt;
	const hasCanonicalTimestamp =
		typeof computedAt === "string" &&
		!Number.isNaN(Date.parse(computedAt)) &&
		new Date(computedAt).toISOString() === computedAt;
	return (
		hasExactKeys &&
		payload.schemaVersion === 1 &&
		payload.freshness === "unavailable" &&
		hasCanonicalTimestamp &&
		payload.trend === null
	);
}
