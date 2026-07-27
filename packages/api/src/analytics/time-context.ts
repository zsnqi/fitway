import { z } from "zod";

const settingsVersionSchema = z
	.number()
	.int()
	.positive()
	.max(Number.MAX_SAFE_INTEGER);

export function isIanaTimeZone(timeZone: string): boolean {
	try {
		new Intl.DateTimeFormat("en", { timeZone }).format(0);
		return true;
	} catch {
		return false;
	}
}

export function assertIanaTimeZone(timeZone: string): void {
	if (!isIanaTimeZone(timeZone)) {
		throw new Error(`Settings contain an invalid IANA timezone: ${timeZone}`);
	}
}

const timeZoneMappingSchema = z
	.object({
		settingsVersion: settingsVersionSchema,
		timeZone: z.string().trim().min(1).refine(isIanaTimeZone, {
			message: "Timezone must be a valid IANA identifier",
		}),
	})
	.strict();

export const analyticsTimeContextInputSchema = z
	.object({
		settingsVersions: z
			.array(settingsVersionSchema)
			.refine((versions) => new Set(versions).size === versions.length, {
				message: "Settings versions must be unique",
			}),
	})
	.strict();

export const analyticsTimeContextOutputSchema = z
	.object({
		current: timeZoneMappingSchema,
		versions: z.array(timeZoneMappingSchema),
	})
	.strict();

export type AnalyticsTimeContextInput = z.infer<
	typeof analyticsTimeContextInputSchema
>;
export type AnalyticsTimeContext = z.infer<
	typeof analyticsTimeContextOutputSchema
>;

const isoBusinessDaySchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.refine(
		(value) => {
			const parsed = new Date(`${value}T00:00:00.000Z`);
			return (
				Number.isFinite(parsed.getTime()) &&
				parsed.toISOString().slice(0, 10) === value
			);
		},
		{ message: "Business day must be a valid ISO date" },
	);

export const ownerDailyAnalyticsInputSchema = z
	.object({ businessDay: isoBusinessDaySchema.optional() })
	.strict()
	.optional();

const minuteStartUtcSchema = z
	.string()
	.refine((value) => Number.isFinite(Date.parse(value)), {
		message: "Minute start must be an ISO instant",
	});
const occupancyBandSchema = z.enum(["quiet", "moderate", "busy", "packed"]);
const nonnegativeSafeInteger = z
	.number()
	.int()
	.nonnegative()
	.max(Number.MAX_SAFE_INTEGER);
const positiveSafeInteger = nonnegativeSafeInteger.positive();

const valueBucketSchema = z
	.object({
		state: z.literal("value"),
		minuteStartUtc: minuteStartUtcSchema,
		count: nonnegativeSafeInteger,
		entries: nonnegativeSafeInteger,
		exits: nonnegativeSafeInteger,
		band: occupancyBandSchema,
		capacitySnapshot: positiveSafeInteger,
		settingsVersion: positiveSafeInteger,
		source: z.enum(["live", "backfill", "manual"]),
	})
	.strict();
const absentBucketSchema = z
	.object({
		state: z.enum(["closed", "missing"]),
		minuteStartUtc: minuteStartUtcSchema,
		count: z.null(),
		settingsVersion: positiveSafeInteger,
	})
	.strict();

export const ownerDailyAnalyticsOutputSchema = z
	.object({
		businessDay: isoBusinessDaySchema,
		timeline: z.array(z.union([valueBucketSchema, absentBucketSchema])),
		peak: z
			.object({
				minuteStartUtc: minuteStartUtcSchema,
				count: nonnegativeSafeInteger,
				band: occupancyBandSchema,
				capacitySnapshot: positiveSafeInteger,
				settingsVersion: positiveSafeInteger,
			})
			.strict()
			.nullable(),
		dailyAverage: z.number().finite().nonnegative().nullable(),
		estimatedEntranceCrossings: nonnegativeSafeInteger,
		observedOpenMinutes: nonnegativeSafeInteger,
		expectedOpenMinutes: nonnegativeSafeInteger,
		coverage: z.number().finite().min(0).max(1).nullable(),
	})
	.strict();
