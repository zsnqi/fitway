export const MAX_COMMAND_VALUE = 2_147_483_647;
export const MAX_COMMAND_REASON_LENGTH = 240;

export type DirectCountValidation =
	| { value: number; error: null }
	| { value: null; error: "required" | "western" | "range" };

export function parseDirectCount(value: string): DirectCountValidation {
	const trimmed = value.trim();
	if (!trimmed) return { value: null, error: "required" };
	if (!/^\d+$/u.test(trimmed)) {
		return { value: null, error: "western" };
	}
	const parsed = Number(trimmed);
	if (!Number.isSafeInteger(parsed) || parsed > MAX_COMMAND_VALUE) {
		return { value: null, error: "range" };
	}
	return { value: parsed, error: null };
}

export function normalizeCommandReason(value: string): string | undefined {
	const trimmed = value.trim();
	return trimmed || undefined;
}

export function isCommandReasonTooLong(value: string): boolean {
	return value.trim().length > MAX_COMMAND_REASON_LENGTH;
}
