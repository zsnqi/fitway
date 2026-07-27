import type { RecentCommand } from "@fitway/api/commands/recent-commands";
import type {
	CommandMutationResult,
	CorrectionInput,
	ResetInput,
} from "@fitway/api/commands/schemas";
import { useCallback, useEffect, useRef, useState } from "react";

import { client } from "@/utils/orpc";

export type StaffCommandRecord = RecentCommand;

export type StaffCommandTransport = {
	issueCorrection(input: CorrectionInput): Promise<CommandMutationResult>;
	issueReset(input: ResetInput): Promise<CommandMutationResult>;
	readRecentCommands(): Promise<StaffCommandRecord[]>;
};

type UseStaffCommandsOptions = {
	transport?: StaffCommandTransport;
	onAccepted?: () => void | Promise<void>;
};

const defaultTransport: StaffCommandTransport = {
	issueCorrection: (input) => client.staff.issueCorrection(input),
	issueReset: (input) => client.staff.issueReset(input),
	readRecentCommands: () => client.staff.recentCommands(),
};

export function useStaffCommands({
	transport = defaultTransport,
	onAccepted,
}: UseStaffCommandsOptions) {
	const [history, setHistory] = useState<StaffCommandRecord[]>([]);
	const [error, setError] = useState<unknown>(null);
	const [historyError, setHistoryError] = useState<unknown>(null);
	const [isHistoryLoading, setIsHistoryLoading] = useState(true);
	const [lastIssuedCommandId, setLastIssuedCommandId] = useState<number | null>(
		null,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submittingRef = useRef(false);
	const refreshHistory = useCallback(async () => {
		setIsHistoryLoading(true);
		setHistoryError(null);
		try {
			const commands = await transport.readRecentCommands();
			setHistory(commands);
			return commands;
		} catch (cause) {
			setHistoryError(cause);
			return null;
		} finally {
			setIsHistoryLoading(false);
		}
	}, [transport]);

	useEffect(() => {
		void refreshHistory();
	}, [refreshHistory]);

	const issue = useCallback(
		async (operation: () => Promise<CommandMutationResult>) => {
			if (submittingRef.current) return null;
			submittingRef.current = true;
			setIsSubmitting(true);
			setError(null);
			try {
				const result = await operation();
				setLastIssuedCommandId(result.command.id);
				await Promise.all([onAccepted?.(), refreshHistory()]);
				return result;
			} catch (cause) {
				setError(cause);
				return null;
			} finally {
				submittingRef.current = false;
				setIsSubmitting(false);
			}
		},
		[onAccepted, refreshHistory],
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
		historyError,
		isHistoryLoading,
		lastIssuedCommandId,
		error,
		isSubmitting,
		issueCorrection,
		issueReset,
		refreshHistory,
		clearError: () => setError(null),
	};
}
