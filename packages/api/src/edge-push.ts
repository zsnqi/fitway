import { z } from "zod";

import {
	canonicalUtcTimestampSchema,
	deviceCommandSchema,
	nonnegativePostgresIntegerSchema,
	postgresIntegerSchema,
} from "./commands/schemas";

export const EDGE_PUSH_RESOURCE_PATH = "/edge/push";
export const EDGE_PUSH_INTERNAL_PATH = EDGE_PUSH_RESOURCE_PATH;
export const EDGE_PUSH_EXTERNAL_PATH = `/api${EDGE_PUSH_RESOURCE_PATH}`;
export const OPENAPI_RESOURCE_PATH = "/openapi.json";
export const OPENAPI_EXTERNAL_PATH = `/api${OPENAPI_RESOURCE_PATH}`;
export const OPENAPI_REFERENCE_PATH = "/api-reference";
export const EDGE_NO_STORE = "no-store";
export const EDGE_BACKFILL_MAX_MINUTES = 100;

const minuteTimestamp = canonicalUtcTimestampSchema.refine((value) => {
	const date = new Date(value);
	return date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0;
}, "Minute timestamp must be aligned");

export const edgeHealthStatusSchema = z.enum([
	"ok",
	"degraded",
	"failed",
	"unknown",
]);
export type EdgeHealthStatus = z.infer<typeof edgeHealthStatusSchema>;

export const edgeMinuteSchema = z
	.object({
		minuteStart: minuteTimestamp,
		count: postgresIntegerSchema,
		entries: nonnegativePostgresIntegerSchema,
		exits: nonnegativePostgresIntegerSchema,
	})
	.strict();

function minuteBatchSchema(maxMinutes: number) {
	return z
		.array(edgeMinuteSchema)
		.min(1)
		.max(maxMinutes)
		.superRefine((minutes, context) => {
			let previous = "";
			const seen = new Set<string>();
			for (const [index, minute] of minutes.entries()) {
				if (seen.has(minute.minuteStart)) {
					context.addIssue({
						code: "custom",
						message: "Minute buckets must be unique",
						path: [index, "minuteStart"],
					});
				}
				if (previous && minute.minuteStart <= previous) {
					context.addIssue({
						code: "custom",
						message: "Minute buckets must be sorted ascending",
						path: [index, "minuteStart"],
					});
				}
				seen.add(minute.minuteStart);
				previous = minute.minuteStart;
			}
		});
}

const sequenceAndAcknowledgement = {
	sequence: z.number().int().positive().safe(),
	appliedCommandId: z.number().int().positive().safe().nullable(),
} as const;

const liveFields = {
	observedAt: canonicalUtcTimestampSchema,
	currentCount: postgresIntegerSchema,
	minutes: minuteBatchSchema(2),
	health: z
		.object({
			process: edgeHealthStatusSchema,
			camera: edgeHealthStatusSchema,
			feed: edgeHealthStatusSchema,
			detectorFps: z.number().finite().nonnegative().nullable(),
		})
		.strict(),
} as const;

const legacyLivePushRequestSchema = z
	.object({
		schemaVersion: z.literal(1),
		...sequenceAndAcknowledgement,
		...liveFields,
	})
	.strict();

const frozenLivePushRequestSchema = z
	.object({
		schemaVersion: z.literal(2),
		mode: z.literal("live"),
		...sequenceAndAcknowledgement,
		...liveFields,
	})
	.strict();

const frozenBackfillPushRequestSchema = z
	.object({
		schemaVersion: z.literal(2),
		mode: z.literal("backfill"),
		...sequenceAndAcknowledgement,
		minutes: minuteBatchSchema(EDGE_BACKFILL_MAX_MINUTES),
	})
	.strict();

export const edgePushRequestSchema = z.union([
	legacyLivePushRequestSchema,
	z.discriminatedUnion("mode", [
		frozenLivePushRequestSchema,
		frozenBackfillPushRequestSchema,
	]),
]);

const responseFields = {
	accepted: z.boolean(),
	highestProcessedSequence: z.number().int().nonnegative().safe(),
	commands: z.array(deviceCommandSchema).max(1),
	serverTime: canonicalUtcTimestampSchema,
} as const;

const legacySettingsSchema = z
	.object({
		version: z.number().int().positive().safe(),
		pushIntervalSeconds: z.number().int().positive().safe(),
	})
	.strict();

const timeOfDaySchema = z
	.string()
	.regex(
		/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,6})?)?$/,
		"Time must be a valid 24-hour wall time",
	);

const dailyHoursSchema = z
	.object({
		open: timeOfDaySchema,
		close: timeOfDaySchema,
	})
	.strict()
	.nullable();

const frozenSettingsSchema = z
	.object({
		version: z.number().int().positive().safe(),
		pushIntervalSeconds: z.number().int().positive().safe(),
		timezone: z.string().trim().min(1),
		businessDayBoundary: timeOfDaySchema,
		weeklySchedule: z
			.object({
				sun: dailyHoursSchema,
				mon: dailyHoursSchema,
				tue: dailyHoursSchema,
				wed: dailyHoursSchema,
				thu: dailyHoursSchema,
				fri: dailyHoursSchema,
				sat: dailyHoursSchema,
			})
			.strict(),
	})
	.strict();

function validateCommandOrdering(
	value: { commands: Array<{ id: number }> },
	context: z.RefinementCtx,
) {
	let previousId = 0;
	for (const [index, command] of value.commands.entries()) {
		if (command.id <= previousId) {
			context.addIssue({
				code: "custom",
				message: "Commands must be unique and ordered oldest-first",
				path: ["commands", index, "id"],
			});
		}
		previousId = command.id;
	}
}

const legacyEdgePushResponseSchema = z
	.object({
		schemaVersion: z.literal(1),
		reason: z.enum(["processed", "replay", "sequence_gap"]),
		...responseFields,
		settings: legacySettingsSchema,
	})
	.strict()
	.superRefine((value, context) => {
		if (value.accepted !== (value.reason === "processed")) {
			context.addIssue({
				code: "custom",
				message: "Only processed acknowledgements are accepted",
				path: ["accepted"],
			});
		}
		if (!value.accepted && value.commands.length > 0) {
			context.addIssue({
				code: "custom",
				message: "Only accepted pushes can deliver commands",
				path: ["commands"],
			});
		}
		validateCommandOrdering(value, context);
	});

const frozenEdgePushResponseSchema = z
	.object({
		schemaVersion: z.literal(2),
		reason: z.enum(["processed", "replay", "sequence_gap", "commands_pending"]),
		...responseFields,
		settings: frozenSettingsSchema,
	})
	.strict()
	.superRefine((value, context) => {
		if (value.accepted !== (value.reason === "processed")) {
			context.addIssue({
				code: "custom",
				message: "Only processed acknowledgements are accepted",
				path: ["accepted"],
			});
		}
		if (
			(value.reason === "replay" || value.reason === "sequence_gap") &&
			value.commands.length > 0
		) {
			context.addIssue({
				code: "custom",
				message: "Replay and gap responses cannot deliver commands",
				path: ["commands"],
			});
		}
		if (value.reason === "commands_pending" && value.commands.length === 0) {
			context.addIssue({
				code: "custom",
				message: "A command-pending response must deliver a command",
				path: ["commands"],
			});
		}
		validateCommandOrdering(value, context);
	});

export const edgePushResponseSchema = z.union([
	legacyEdgePushResponseSchema,
	frozenEdgePushResponseSchema,
]);

export type EdgePushRequest = z.infer<typeof edgePushRequestSchema>;
export type EdgePushResponse = z.infer<typeof edgePushResponseSchema>;
