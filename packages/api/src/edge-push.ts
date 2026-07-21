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

export const edgeMinuteSchema = z
	.object({
		minuteStart: minuteTimestamp,
		count: postgresIntegerSchema,
		entries: nonnegativePostgresIntegerSchema,
		exits: nonnegativePostgresIntegerSchema,
	})
	.strict();

export const edgePushRequestSchema = z
	.object({
		schemaVersion: z.literal(1),
		sequence: z.number().int().positive().safe(),
		observedAt: canonicalUtcTimestampSchema,
		currentCount: postgresIntegerSchema,
		minutes: z.array(edgeMinuteSchema).min(1).max(2),
		health: z
			.object({
				process: edgeHealthStatusSchema,
				camera: edgeHealthStatusSchema,
				feed: edgeHealthStatusSchema,
				detectorFps: z.number().finite().nonnegative().nullable(),
			})
			.strict(),
		appliedCommandId: z.number().int().positive().safe().nullable(),
	})
	.strict()
	.superRefine((value, context) => {
		let previous = "";
		const seen = new Set<string>();
		for (const [index, minute] of value.minutes.entries()) {
			if (seen.has(minute.minuteStart)) {
				context.addIssue({
					code: "custom",
					message: "Minute buckets must be unique",
					path: ["minutes", index, "minuteStart"],
				});
			}
			if (previous && minute.minuteStart <= previous) {
				context.addIssue({
					code: "custom",
					message: "Minute buckets must be sorted ascending",
					path: ["minutes", index, "minuteStart"],
				});
			}
			seen.add(minute.minuteStart);
			previous = minute.minuteStart;
		}
	});

export const edgePushReasonSchema = z.enum([
	"processed",
	"replay",
	"sequence_gap",
]);
export const edgePushResponseSchema = z
	.object({
		schemaVersion: z.literal(1),
		accepted: z.boolean(),
		reason: edgePushReasonSchema,
		highestProcessedSequence: z.number().int().nonnegative().safe(),
		commands: z.array(deviceCommandSchema),
		settings: z
			.object({
				version: z.number().int().positive().safe(),
				pushIntervalSeconds: z.number().int().positive(),
			})
			.strict(),
		serverTime: canonicalUtcTimestampSchema,
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
	});

export type EdgePushRequest = z.infer<typeof edgePushRequestSchema>;
export type EdgePushResponse = z.infer<typeof edgePushResponseSchema>;
