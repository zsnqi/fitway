import type { HumanAuditEntry } from "../audit/types";
import {
	type CommandMutationResult,
	type CorrectionInput,
	correctionInputSchema,
	type IssuedCommand,
	type ResetInput,
	resetInputSchema,
} from "./schemas";

const POSTGRES_INTEGER_MAX = 2_147_483_647;

export type CommandActor = {
	principalId: string;
	principalKind: "shared_staff" | "owner";
	role: "staff" | "owner";
};

export type CommandIssuanceState = {
	currentCount: number | null;
	deviceId: string | null;
};

export type CommandIssuanceTransaction = {
	lockCommandState(): Promise<CommandIssuanceState>;
	insertCommand(value: {
		deviceId: string;
		type: "set_count" | "reset_zero";
		targetValue: number | null;
		actorPrincipalId: string;
		reason: string | null;
		issuedAt: Date;
	}): Promise<IssuedCommand>;
	supersedePendingCommands(
		deviceId: string,
		newerCommandId: number,
		at: Date,
	): Promise<void>;
	appendAudit(value: HumanAuditEntry): Promise<number>;
};

export type CommandServiceDependencies = {
	transaction<T>(
		work: (tx: CommandIssuanceTransaction) => Promise<T>,
	): Promise<T>;
	now?: () => Date;
};

export class CommandIssueError extends Error {
	constructor(
		message: string,
		readonly code:
			| "current_count_unavailable"
			| "device_unavailable"
			| "target_out_of_range",
	) {
		super(message);
	}
}

function requireDevice(state: CommandIssuanceState): string {
	if (!state.deviceId) {
		throw new CommandIssueError(
			"No enabled command target",
			"device_unavailable",
		);
	}
	return state.deviceId;
}

function assertTarget(value: number): number {
	if (
		!Number.isSafeInteger(value) ||
		value < 0 ||
		value > POSTGRES_INTEGER_MAX
	) {
		throw new CommandIssueError(
			"Effective count is outside the supported range",
			"target_out_of_range",
		);
	}
	return value;
}

function auditBase(
	actor: CommandActor,
	commandId: number,
	reason: string | null,
	createdAt: Date,
): Pick<
	HumanAuditEntry,
	| "actorPrincipalId"
	| "actorPrincipalKind"
	| "actorRole"
	| "commandId"
	| "reason"
	| "createdAt"
> {
	return {
		actorPrincipalId: actor.principalId,
		actorPrincipalKind: actor.principalKind,
		actorRole: actor.role,
		commandId,
		reason,
		createdAt,
	};
}

export function createCommandService(dependencies: CommandServiceDependencies) {
	return {
		async issueCorrection(
			actor: CommandActor,
			input: CorrectionInput,
		): Promise<CommandMutationResult> {
			const parsed = correctionInputSchema.parse(input);
			const issuedAt = dependencies.now?.() ?? new Date();
			return dependencies.transaction(async (tx) => {
				const state = await tx.lockCommandState();
				const deviceId = requireDevice(state);
				const isDelta = "delta" in parsed;
				if (isDelta && state.currentCount === null) {
					throw new CommandIssueError(
						"A delta requires a usable current count",
						"current_count_unavailable",
					);
				}
				const effectiveValue = assertTarget(
					isDelta
						? Math.max(0, (state.currentCount as number) + parsed.delta)
						: parsed.absolute,
				);
				const reason = parsed.reason ?? null;
				const command = await tx.insertCommand({
					deviceId,
					type: "set_count",
					targetValue: effectiveValue,
					actorPrincipalId: actor.principalId,
					reason,
					issuedAt,
				});
				await tx.supersedePendingCommands(deviceId, command.id, issuedAt);
				const auditId = await tx.appendAudit({
					...auditBase(actor, command.id, reason, issuedAt),
					action: isDelta ? "correction_delta" : "correction_absolute",
					priorValue: state.currentCount,
					requestedDelta: isDelta ? parsed.delta : null,
					requestedValue: isDelta ? null : parsed.absolute,
					effectiveValue,
				});
				return { command, auditId };
			});
		},

		async issueReset(
			actor: CommandActor,
			input: ResetInput,
		): Promise<CommandMutationResult> {
			const parsed = resetInputSchema.parse(input);
			const issuedAt = dependencies.now?.() ?? new Date();
			return dependencies.transaction(async (tx) => {
				const state = await tx.lockCommandState();
				const deviceId = requireDevice(state);
				const reason = parsed.reason ?? null;
				const command = await tx.insertCommand({
					deviceId,
					type: "reset_zero",
					targetValue: null,
					actorPrincipalId: actor.principalId,
					reason,
					issuedAt,
				});
				await tx.supersedePendingCommands(deviceId, command.id, issuedAt);
				const auditId = await tx.appendAudit({
					...auditBase(actor, command.id, reason, issuedAt),
					action: "reset",
					priorValue: state.currentCount,
					requestedDelta: null,
					requestedValue: 0,
					effectiveValue: 0,
				});
				return { command, auditId };
			});
		},
	};
}

export type CommandService = ReturnType<typeof createCommandService>;
