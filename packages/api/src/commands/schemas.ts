import { z } from "zod";

export const safeIntegerSchema = z.number().int().safe();
export const postgresIntegerSchema = safeIntegerSchema
	.min(-2_147_483_648)
	.max(2_147_483_647);
export const nonnegativePostgresIntegerSchema = postgresIntegerSchema.min(0);
const reasonSchema = z.string().trim().min(1).max(240);

export const canonicalUtcTimestampSchema = z
	.string()
	.datetime({ offset: false })
	.refine((value) => {
		const instant = new Date(value);
		return (
			Number.isFinite(instant.getTime()) && instant.toISOString() === value
		);
	}, "Must be canonical UTC ISO-8601");

const correctionReason = { reason: reasonSchema.optional() } as const;

export const correctionInputSchema = z.union([
	z.object({ delta: postgresIntegerSchema, ...correctionReason }).strict(),
	z
		.object({ absolute: nonnegativePostgresIntegerSchema, ...correctionReason })
		.strict(),
]);

export const resetInputSchema = z
	.object({ reason: reasonSchema.optional() })
	.strict();

export const commandTypeSchema = z.enum(["set_count", "reset_zero"]);
export const commandStatusSchema = z.enum(["pending", "applied", "superseded"]);

export const deviceCommandSchema = z
	.object({
		id: safeIntegerSchema.positive(),
		type: commandTypeSchema,
		targetValue: nonnegativePostgresIntegerSchema.nullable(),
		issuedAt: canonicalUtcTimestampSchema,
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
	});

export const issuedCommandSchema = z
	.object({
		id: safeIntegerSchema.positive(),
		type: commandTypeSchema,
		targetValue: nonnegativePostgresIntegerSchema.nullable(),
		status: commandStatusSchema,
		reason: reasonSchema.nullable(),
		issuedAt: canonicalUtcTimestampSchema,
	})
	.strict();

export const commandMutationResultSchema = z
	.object({
		command: issuedCommandSchema,
		auditId: safeIntegerSchema.positive(),
	})
	.strict();

export type CorrectionInput = z.infer<typeof correctionInputSchema>;
export type ResetInput = z.infer<typeof resetInputSchema>;
export type CommandType = z.infer<typeof commandTypeSchema>;
export type CommandStatus = z.infer<typeof commandStatusSchema>;
export type DeviceCommand = z.infer<typeof deviceCommandSchema>;
export type IssuedCommand = z.infer<typeof issuedCommandSchema>;
export type CommandMutationResult = z.infer<typeof commandMutationResultSchema>;
