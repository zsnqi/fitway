import type {
	CommandMutationResult,
	CorrectionInput,
	IssuedCommand,
	ResetInput,
} from "@fitway/api/commands/schemas";
import { useCallback, useRef, useState } from "react";

import { client } from "@/utils/orpc";

export type StaffCommandRecord = IssuedCommand & {
	auditId: number;
};

export type StaffCommandTransport = {
	issueCorrection(input: CorrectionInput): Promise<CommandMutationResult>;
	issueReset(input: ResetInput): Promise<CommandMutationResult>;
};

type UseStaffCommandsOptions = {
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
	return [{ ...result.command, auditId: result.auditId }, ...history].slice(
		0,
		4,
	);
}

export function useStaffCommands({
	transport = defaultTransport,
	onAccepted,
}: UseStaffCommandsOptions) {
	const [history, setHistory] = useState<StaffCommandRecord[]>([]);
	const [error, setError] = useState<unknown>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submittingRef = useRef(false);

	const issue = useCallback(
		async (operation: () => Promise<CommandMutationResult>) => {
			if (submittingRef.current) return null;
			submittingRef.current = true;
			setIsSubmitting(true);
			setError(null);
			try {
				const result = await operation();
				setHistory((current) => acceptStaffCommand(current, result));
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
		[onAccepted],
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
