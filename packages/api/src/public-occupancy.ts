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
	schemaVersion: z.literal(2),
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
		timeZone: z.string().min(1),
		band: z.enum(["quiet", "moderate", "busy", "packed"]),
		count: z.number().int().nonnegative(),
		lastUpdatedAt: canonicalTimestamp,
		freshUntil: canonicalTimestamp,
		source: z.enum(["edge", "manual"]),
	})
	.strict();
export const publicOccupancyClosedSchema = z
	.object({
		...base,
		freshness: z.literal("closed"),
		timeZone: z.string().min(1),
		nextOpenAt: canonicalTimestamp.nullable(),
	})
	.strict();
export const publicOccupancyPayloadSchema = z.discriminatedUnion("freshness", [
	publicOccupancyUnavailableSchema,
	publicOccupancyUsableSchema,
	publicOccupancyClosedSchema,
]);

export type PublicOccupancyPayload = z.infer<
	typeof publicOccupancyPayloadSchema
>;
export type PublicOccupancyUnavailablePayload = z.infer<
	typeof publicOccupancyUnavailableSchema
>;
export type PublicOccupancyUsablePayload = z.infer<
	typeof publicOccupancyUsableSchema
>;
export type PublicOccupancyClosedPayload = z.infer<
	typeof publicOccupancyClosedSchema
>;

export function publicOccupancyCacheControl(
	payload: PublicOccupancyPayload,
	now: Date,
): string {
	if (payload.freshness !== "closed" || payload.nextOpenAt === null) {
		return PUBLIC_OCCUPANCY_CACHE_CONTROL;
	}
	const remaining = Math.floor(
		(Date.parse(payload.nextOpenAt) - now.getTime()) / 1_000,
	);
	const maxAge = Math.max(0, Math.min(30, remaining));
	return `public, s-maxage=${maxAge}, stale-while-revalidate=60`;
}

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
		schemaVersion: 2,
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
