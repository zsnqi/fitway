// Build command events and report messages for Codex launcher fixtures.
export function commandEvent(command, exitCode = 0, aggregatedOutput = "") {
	return `${JSON.stringify({
		type: "item.completed",
		item: {
			type: "command_execution",
			command,
			aggregated_output: aggregatedOutput,
			exit_code: exitCode,
			status: "completed",
		},
	})}\n`;
}

export function structuredReport(ids, command, output, commit) {
	return `${[
		"```report",
		...(commit ? [JSON.stringify({ commit })] : []),
		...ids.map((id) => JSON.stringify({ id, status: "PASS", command, output })),
		"```",
	].join("\n")}\n`;
}

export function fallbackEvidenceEvent() {
	return commandEvent(
		"fixture fallback evidence",
		0,
		"fixture fallback evidence PASS",
	);
}

export function fallbackReportMessage(firstLine) {
	return `${firstLine}\n${structuredReport(
		["K1"],
		"fixture fallback evidence",
		"fixture fallback evidence PASS",
	)}`;
}
