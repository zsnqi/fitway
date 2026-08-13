import { evaluateScheduledReset } from "./evaluator";
import type {
	PriorSystemResetIssuance,
	ResetScheduleSettingsVersion,
	ScheduledResetEvaluation,
	SystemResetIssuanceDecision,
} from "./types";

export type ScheduledResetRunnerDependencies = {
	now: () => Date;
	readSettingsVersions: () => Promise<readonly ResetScheduleSettingsVersion[]>;
	readPriorIssuances: () => Promise<readonly PriorSystemResetIssuance[]>;
	issueScheduledReset: (
		decision: SystemResetIssuanceDecision,
	) => Promise<unknown>;
};

export type ScheduledResetRunResult = {
	evaluations: readonly ScheduledResetEvaluation[];
};

function candidateBusinessDays(
	now: Date,
	settingsVersions: readonly ResetScheduleSettingsVersion[],
): readonly string[] {
	const candidates = new Set<string>();
	for (const settings of settingsVersions) {
		for (const referenceInstant of [
			now,
			new Date(now.getTime() - settings.resetBufferMinutes * 60_000),
		]) {
			const localDate = localCivilDate(referenceInstant, settings.timeZone);
			for (const offset of [-1, 0, 1]) {
				candidates.add(addDays(localDate, offset));
			}
		}
	}
	return [...candidates].sort();
}

function localCivilDate(at: Date, timeZone: string): string {
	const components = new Map(
		new Intl.DateTimeFormat("en-CA", {
			calendar: "iso8601",
			numberingSystem: "latn",
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		})
			.formatToParts(at)
			.filter(
				(part) =>
					part.type === "year" || part.type === "month" || part.type === "day",
			)
			.map((part) => [part.type, part.value]),
	);
	const year = components.get("year");
	const month = components.get("month");
	const day = components.get("day");
	if (!year || !month || !day) {
		throw new RangeError("Local civil date could not be resolved");
	}
	return `${year}-${month}-${day}`;
}

function addDays(isoDate: string, offset: number): string {
	const [year, month, day] = isoDate.split("-").map(Number);
	const date = new Date(0);
	date.setUTCFullYear(
		year ?? Number.NaN,
		(month ?? Number.NaN) - 1,
		(day ?? Number.NaN) + offset,
	);
	date.setUTCHours(0, 0, 0, 0);
	if (!Number.isFinite(date.getTime())) {
		throw new RangeError("Local civil date could not be resolved");
	}
	return date.toISOString().slice(0, 10);
}

export function createScheduledResetRunner(
	dependencies: ScheduledResetRunnerDependencies,
) {
	return {
		async run(): Promise<ScheduledResetRunResult> {
			const now = dependencies.now();
			const [settingsVersions, priorIssuances] = await Promise.all([
				dependencies.readSettingsVersions(),
				dependencies.readPriorIssuances(),
			]);
			const evaluations = candidateBusinessDays(now, settingsVersions).map(
				(businessDay) =>
					evaluateScheduledReset({
						businessDay,
						now,
						settingsVersions,
						priorIssuances,
					}),
			);
			for (const evaluation of evaluations) {
				if (evaluation.decision === "issue") {
					await dependencies.issueScheduledReset(evaluation);
				}
			}
			return { evaluations };
		},
	};
}
