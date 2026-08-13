import type { CommandStatus } from "../commands/schemas";
import type { WeeklySchedule } from "../occupancy/schedule";

export type ResetScheduleSettingsVersion = {
	version: number;
	effectiveFrom: Date;
	timeZone: string;
	businessDayBoundary: string;
	resetBufferMinutes: number;
	weeklySchedule: WeeklySchedule;
};

export type PriorSystemResetIssuance = {
	businessDay: string;
	commandId: number;
	status: CommandStatus;
};

export type SystemResetIssuanceDecision = {
	decision: "issue";
	issuanceKey: string;
	businessDay: string;
	settingsVersion: number;
	scheduledCloseAt: Date;
	dueAt: Date;
	issuedAt: Date;
	issuer: "system";
	command: {
		type: "reset_zero";
		targetValue: null;
		reason: string;
		supersedePending: true;
	};
};

export type ScheduledResetEvaluation =
	| SystemResetIssuanceDecision
	| {
			decision: "skip";
			businessDay: string;
			reason: "already_issued" | "no_scheduled_close" | "not_due";
			dueAt: Date | null;
	  };

export type EvaluateScheduledResetInput = {
	businessDay: string;
	now: Date;
	settingsVersions: readonly ResetScheduleSettingsVersion[];
	priorIssuances: readonly PriorSystemResetIssuance[];
};
