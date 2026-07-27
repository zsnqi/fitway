import { z } from "zod";

import {
	canonicalUtcTimestampSchema,
	commandStatusSchema,
	commandTypeSchema,
	nonnegativePostgresIntegerSchema,
	safeIntegerSchema,
} from "./schemas";

/**
 * Private, server-authoritative command lifecycle data for the staff surface.
 * Delivery is metadata only; `status` remains the sole lifecycle authority.
 */
export const recentCommandSchema = z
	.object({
		id: safeIntegerSchema.positive(),
		type: commandTypeSchema,
		targetValue: nonnegativePostgresIntegerSchema.nullable(),
		status: commandStatusSchema,
		reason: z.string().trim().min(1).max(240).nullable(),
		issuedAt: canonicalUtcTimestampSchema,
		deliveredAt: canonicalUtcTimestampSchema.nullable(),
		appliedAt: canonicalUtcTimestampSchema.nullable(),
		supersededAt: canonicalUtcTimestampSchema.nullable(),
		supersededByCommandId: safeIntegerSchema.positive().nullable(),
	})
	.strict()
	.superRefine((value, context) => {
		if (
			(value.type === "set_count" && value.targetValue === null) ||
			(value.type === "reset_zero" && value.targetValue !== null)
		) {
			context.addIssue({
				code: "custom",
				message: "Command type and target value are incoherent",
				path: ["targetValue"],
			});
		}

		if (
			(value.status === "pending" &&
				(value.appliedAt !== null ||
					value.supersededAt !== null ||
					value.supersededByCommandId !== null)) ||
			(value.status === "applied" &&
				(value.deliveredAt === null ||
					value.appliedAt === null ||
					value.supersededAt !== null ||
					value.supersededByCommandId !== null)) ||
			(value.status === "superseded" &&
				(value.appliedAt !== null ||
					value.supersededAt === null ||
					value.supersededByCommandId === null))
		) {
			context.addIssue({
				code: "custom",
				message: "Command lifecycle fields are incoherent",
				path: ["status"],
			});
		}
	});

export const recentCommandsSchema = z.array(recentCommandSchema).max(4);

export type RecentCommand = z.infer<typeof recentCommandSchema>;
