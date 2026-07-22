import type {
	CommandMutationResult,
	CorrectionInput,
	IssuedCommand,
	ResetInput,
} from "@fitway/api/commands/schemas";
import type { OperationalSnapshot } from "@fitway/api/health/snapshot";
import { useCallback, useEffect, useRef, useState } from "react";

import { client } from "@/utils/orpc";

export type StaffCommandRecord = IssuedCommand & {
	auditId: number;
};

export type StaffCommandTransport = {
	issueCorrection(input: CorrectionInput): Promise<CommandMutationResult>;
	issueReset(input: ResetInput): Promise<CommandMutationResult>;
};

type UseStaffCommandsOptions = {
	snapshot: OperationalSnapshot;
	transport?: StaffCommandTransport;
	onAccepted?: () => void | Promise<void>;
};

const defaultTransport: StaffCommandTransport = {
	issueCorrection: (input) => client.staff.issueCorrection(input),
	issueReset: (input) => client.staff.issueReset(input),
};

export function acceptStaffCommand(
	history: StaffCommandRecord[],
	result: CommandMutationResult,
): StaffCommandRecord[] {
	const superseded = history.map((command) =>
		command.status === "pending"
			? { ...command, status: "superseded" as const }
			: command,
	);
	return [{ ...result.command, auditId: result.auditId }, ...superseded].slice(
		0,
		4,
	);
}

export function reconcileStaffCommands(
	history: StaffCommandRecord[],
	snapshot: OperationalSnapshot,
): StaffCommandRecord[] {
	const occupancy = snapshot.occupancy;
	if (
		(occupancy.freshness !== "fresh" && occupancy.freshness !== "stale") ||
		!("count" in occupancy) ||
		!("lastUpdatedAt" in occupancy)
	) {
		return history;
	}

	let changed = false;
	const reconciled = history.map((command) => {
		const target = command.type === "reset_zero" ? 0 : command.targetValue;
		if (
			command.status !== "pending" ||
			target === null ||
			occupancy.count !== target ||
			Date.parse(occupancy.lastUpdatedAt) < Date.parse(command.issuedAt)
		) {
			return command;
		}
		changed = true;
		return { ...command, status: "applied" as const };
	});

	return changed ? reconciled : history;
}

export function useStaffCommands({
	snapshot,
	transport = defaultTransport,
	onAccepted,
}: UseStaffCommandsOptions) {
	const [history, setHistory] = useState<StaffCommandRecord[]>([]);
	const [error, setError] = useState<unknown>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submittingRef = useRef(false);

	useEffect(() => {
		setHistory((current) => reconcileStaffCommands(current, snapshot));
	}, [snapshot]);

	const issue = useCallback(
		async (operation: () => Promise<CommandMutationResult>) => {
			if (submittingRef.current) return null;
			submittingRef.current = true;
			setIsSubmitting(true);
			setError(null);
			try {
				const result = await operation();
				setHistory((current) =>
					reconcileStaffCommands(acceptStaffCommand(current, result), snapshot),
				);
				await onAccepted?.();
				return result;
			} catch (cause) {
				setError(cause);
				return null;
			} finally {
				submittingRef.current = false;
				setIsSubmitting(false);
			}
		},
		[onAccepted, snapshot],
	);

	const issueCorrection = useCallback(
		(input: CorrectionInput) => issue(() => transport.issueCorrection(input)),
		[issue, transport],
	);
	const issueReset = useCallback(
		(input: ResetInput) => issue(() => transport.issueReset(input)),
		[issue, transport],
	);

	return {
		history,
		error,
		isSubmitting,
		issueCorrection,
		issueReset,
		clearError: () => setError(null),
	};
}
