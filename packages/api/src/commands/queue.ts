import type { CommandStatus, DeviceCommand } from "./schemas";

export type CommandQueueRepository = {
	findAcknowledgementCandidate(
		deviceId: string,
		commandId: number,
	): Promise<{ status: CommandStatus; deliveredAt: Date | null } | null>;
	markAppliedThrough(
		deviceId: string,
		commandId: number,
		appliedAt: Date,
	): Promise<void>;
	listPendingCommands(deviceId: string): Promise<DeviceCommand[]>;
	markPendingDelivered(deviceId: string, deliveredAt: Date): Promise<void>;
};

export type CommandQueue = {
	reconcile(value: {
		deviceId: string;
		appliedCommandId: number | null;
		at: Date;
	}): Promise<DeviceCommand[]>;
};

export function createCommandQueue(
	repository: CommandQueueRepository,
): CommandQueue {
	return {
		async reconcile({ deviceId, appliedCommandId, at }) {
			if (appliedCommandId !== null) {
				const candidate = await repository.findAcknowledgementCandidate(
					deviceId,
					appliedCommandId,
				);
				if (candidate?.status === "pending" && candidate.deliveredAt) {
					await repository.markAppliedThrough(deviceId, appliedCommandId, at);
				}
			}

			const commands = await repository.listPendingCommands(deviceId);
			commands.sort((left, right) => left.id - right.id);
			if (commands.length > 0) {
				await repository.markPendingDelivered(deviceId, at);
			}
			return commands;
		},
	};
}
