import { z } from "zod";

/**
 * The owner Settings contract (accepted specification r01 §4).
 *
 * The client may submit exactly the five editable product axes: capacity, the
 * three ordered band thresholds, the seven-day weekly schedule, the business-day
 * boundary, and the reset buffer. Timezone, push interval, freshness, operational
 * staleness, and the public poll interval are read-only operational values that
 * appear only in read output and are copied forward by the server on every
 * update. Version, effective time, actor identity, and audit metadata are
 * server-owned and have no input field at all.
 *
 * Every object is strict: an unknown key fails instead of being stripped, so a
 * future or renamed field cannot silently disappear from a caller's submission.
 */

/**
 * Canonical 24-hour `HH:mm` in Western digits. `40:00`, `7:00`, `07:60`, and
 * `٠7:00` all fail; there is no seconds field and no device-timezone formatting.
 */
const wallTime = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected canonical HH:mm");

const dailyHoursSchema = z
	.object({
		open: wallTime,
		close: wallTime,
	})
	.strict();
export type DailyHoursContract = z.infer<typeof dailyHoursSchema>;

const dailyHoursOrNull = z.union([dailyHoursSchema, z.null()]);

/**
 * The seven keys are written out so an unknown weekday is a compile error and an
 * eighth key is a parse failure; the runtime `WEEKDAYS` order in
 * `occupancy/schedule` is the same sun..sat sequence the storage columns use.
 */
const weeklyScheduleSchema = z
	.object({
		sun: dailyHoursOrNull,
		mon: dailyHoursOrNull,
		tue: dailyHoursOrNull,
		wed: dailyHoursOrNull,
		thu: dailyHoursOrNull,
		fri: dailyHoursOrNull,
		sat: dailyHoursOrNull,
	})
	.strict();
export type WeeklyScheduleContract = z.infer<typeof weeklyScheduleSchema>;

/**
 * The PostgreSQL `integer` boundary is the storage truth for capacity and the
 * reset buffer: the schema check admits `capacity > 0` and `reset_buffer >= 0`,
 * and the column is `int4`. No smaller ceiling is invented here and no
 * capacity/current-count relationship is checked — a valid no-op is still a
 * valid append-only mutation.
 */
const capacitySchema = z.number().int().min(1).max(2_147_483_647);
const resetBufferSchema = z.number().int().min(0).max(2_147_483_647);

const thresholdSchema = z.number().int().min(0).max(100);

export const thresholdsSchema = z
	.object({
		quietMaxPercent: thresholdSchema,
		moderateMaxPercent: thresholdSchema,
		busyMaxPercent: thresholdSchema,
	})
	.strict()
	/**
	 * The database check `settings_bands_ordered` requires
	 * `0 <= quiet < moderate < busy <= 100`; the per-field bounds narrow the
	 * endpoints and this refinement enforces the strict ascent, so the wire
	 * contract and the storage constraint agree without a silent correction.
	 */
	.refine(
		(value) =>
			value.quietMaxPercent < value.moderateMaxPercent &&
			value.moderateMaxPercent < value.busyMaxPercent,
		"Thresholds must strictly ascend: quiet < moderate < busy",
	);
export type ThresholdsContract = z.infer<typeof thresholdsSchema>;

export const editableOwnerSettingsSchema = z
	.object({
		capacity: capacitySchema,
		thresholds: thresholdsSchema,
		weeklySchedule: weeklyScheduleSchema,
		businessDayBoundary: wallTime,
		resetBufferMinutes: resetBufferSchema,
	})
	.strict();
export type EditableOwnerSettings = z.infer<typeof editableOwnerSettingsSchema>;

const positiveSeconds = z.number().int().positive();

export const operationalOwnerSettingsSchema = z
	.object({
		timezone: z.string().min(1),
		pushIntervalSeconds: positiveSeconds,
		/** The database check `settings_operational_stale_after_fresh` requires this order. */
		freshForSeconds: positiveSeconds,
		operationalStaleAfterSeconds: positiveSeconds,
		publicPollSeconds: positiveSeconds,
	})
	.strict()
	.refine(
		(value) => value.operationalStaleAfterSeconds > value.freshForSeconds,
		"Operational stale threshold must follow freshness",
	);
export type OperationalOwnerSettings = z.infer<
	typeof operationalOwnerSettingsSchema
>;

/** `Date.toISOString()` semantics: exactly `YYYY-MM-DDTHH:mm:ss.sssZ`. */
const canonicalUtcTimestamp = z
	.string()
	.datetime({ offset: false })
	.refine((value) => new Date(value).toISOString() === value);

export const ownerSettingsSnapshotSchema = z
	.object({
		version: z.number().int().positive(),
		effectiveFromUtc: canonicalUtcTimestamp,
		editable: editableOwnerSettingsSchema,
		operational: operationalOwnerSettingsSchema,
	})
	.strict();
export type OwnerSettingsSnapshot = z.infer<typeof ownerSettingsSnapshotSchema>;

export const ownerSettingsReadOutputSchema = ownerSettingsSnapshotSchema;
export type OwnerSettingsReadOutput = OwnerSettingsSnapshot;

/**
 * `expectedVersion` is concurrency metadata, not an editable setting: it must
 * equal the version the owner read, and a mismatch after the settings advisory
 * lock is a stable conflict, never a silent rebase.
 */
export const ownerSettingsUpdateInputSchema = z
	.object({
		expectedVersion: z.number().int().positive(),
		editable: editableOwnerSettingsSchema,
	})
	.strict();
export type OwnerSettingsUpdateInput = z.infer<
	typeof ownerSettingsUpdateInputSchema
>;

export const ownerSettingsUpdateOutputSchema = z
	.object({
		settings: ownerSettingsSnapshotSchema,
		auditId: z.number().int().positive(),
	})
	.strict();
export type OwnerSettingsUpdateOutput = z.infer<
	typeof ownerSettingsUpdateOutputSchema
>;
