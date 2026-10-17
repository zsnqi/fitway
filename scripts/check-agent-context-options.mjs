import {
	ToolStartupError,
	toolStartupLine,
} from "./agent-environment/tool-contract.mjs";

// check:agent-context's step from the resolved arguments to its options, its start-up refusal
// and its output lines, kept beside check-agent-context.mjs so the giant file does not grow
// and a test can call each alone.
export function agentContextOptions(parsed) {
	return {
		milestoneId: parsed.options.milestoneId ?? null,
		checkTracked: !parsed.options.noTracked,
		verbose: parsed.options.verbose === true,
	};
}

// C4: a --milestone the ledger does not hold is a value the command cannot use.
export function unknownMilestone(milestoneId, milestones) {
	const ids = Object.keys(milestones ?? {});
	return new ToolStartupError(
		`requested milestone does not exist in active state: ${milestoneId}`,
		ids.length
			? `pass --milestone one of: ${ids.join(", ")}`
			: "PROJECT_STATE.yaml has no active milestone; omit --milestone",
	);
}

export function agentContextFailure(error, message) {
	return (
		toolStartupLine("check:agent-context", error) ??
		`check-agent-context FAILED: ${message}`
	);
}

export function formatAgentContextWarnings(
	result,
	{ warningPrefix = "WARNING: " } = {},
) {
	return (result.warnings ?? []).map((warning) => `${warningPrefix}${warning}`);
}

export function formatAgentContextResult(result, options = {}) {
	const lines = formatAgentContextWarnings(result, options);
	if (result.ok) {
		lines.push(
			`check-agent-context passed: ${Object.keys(result.registry?.routes ?? {}).length} task classes.`,
		);
	} else {
		lines.push("check-agent-context FAILED:");
		for (const error of result.errors ?? []) lines.push(`- ${error}`);
	}
	return lines.join("\n");
}
