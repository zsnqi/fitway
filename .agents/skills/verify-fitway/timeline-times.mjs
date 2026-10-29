// Parse comma-separated timeline capture times into sorted milliseconds.
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";

// --timeline-times read as sorted unique milliseconds. A value that is not one is a value the
// command cannot use (C4); compare and drive read it before any capture.
export function timelineTimes(value) {
	if (value === undefined) return null;
	const times = String(value).split(",").map(Number);
	if (
		!times.length ||
		times.some(
			(t) => !Number.isFinite(t) || t < 0 || t > Number.MAX_SAFE_INTEGER,
		)
	)
		throw new ToolStartupError(
			"--timeline-times requires finite nonnegative comma-separated milliseconds",
			"pass --timeline-times like 1,100,200 (milliseconds)",
		);
	return [...new Set(times)].sort((a, b) => a - b);
}
