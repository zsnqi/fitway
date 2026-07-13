import { z } from "zod";

export const PUBLIC_OCCUPANCY_RESOURCE_PATH = "/public/occupancy";
export const PUBLIC_OCCUPANCY_EXTERNAL_PATH = `/api${PUBLIC_OCCUPANCY_RESOURCE_PATH}`;
export const PUBLIC_OCCUPANCY_INTERNAL_PATH = PUBLIC_OCCUPANCY_RESOURCE_PATH;
export const PUBLIC_OCCUPANCY_CACHE_CONTROL =
	"public, s-maxage=30, stale-while-revalidate=60";
export const PUBLIC_POLL_HEADER = "X-Fitway-Poll-Seconds";

const canonicalTimestamp = z
	.string()
	.datetime({ offset: false })
	.refine((value) => new Date(value).toISOString() === value);
const base = {
	schemaVersion: z.literal(1),
	computedAt: canonicalTimestamp,
	trend: z.null(),
};

export const publicOccupancyUnavailableSchema = z
	.object({ ...base, freshness: z.literal("unavailable") })
	.strict();
export const publicOccupancyUsableSchema = z
	.object({
		...base,
		freshness: z.enum(["fresh", "stale"]),
		band: z.enum(["quiet", "moderate", "busy", "packed"]),
		count: z.number().int().nonnegative(),
		percentFull: z.number().int().min(0).max(100),
		lastUpdatedAt: canonicalTimestamp,
		freshUntil: canonicalTimestamp,
		source: z.enum(["edge", "manual"]),
	})
	.strict();
export const publicOccupancyPayloadSchema = z.discriminatedUnion("freshness", [
	publicOccupancyUnavailableSchema,
	publicOccupancyUsableSchema,
]);

export type PublicOccupancyPayload = z.infer<
	typeof publicOccupancyPayloadSchema
>;
export type PublicOccupancyUnavailablePayload = z.infer<
	typeof publicOccupancyUnavailableSchema
>;

export function createPublicOccupancyUrl(serverBase: string): string {
	const normalizedBase = serverBase.endsWith("/")
		? serverBase.slice(0, -1)
		: serverBase;
	return `${normalizedBase}${PUBLIC_OCCUPANCY_RESOURCE_PATH}`;
}

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
	return publicOccupancyUnavailableSchema.safeParse(value).success;
}

export function isPublicOccupancyPayload(
	value: unknown,
): value is PublicOccupancyPayload {
	return publicOccupancyPayloadSchema.safeParse(value).success;
}
