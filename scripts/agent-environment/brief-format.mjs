const FORMAT =
	/^<!-- brief-format: v1 role: (codex|builder|designer|verifier)(?: delivers: ([a-z]+))? -->(?:\r?\n|$)/;
const CODEX_FORMAT =
	"<!-- brief-format: v1 role: codex delivers: commit --> or " +
	"<!-- brief-format: v1 role: codex delivers: report -->";

export function parseBriefFormat(input) {
	const text = Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
	const match = text.match(FORMAT);
	if (!match)
		return {
			role: undefined,
			delivers: undefined,
			problem:
				"must start with <!-- brief-format: v1 role: codex|builder|designer|verifier --> using one role",
		};
	const [, role, delivers] = match;
	if (role === "codex" && !["commit", "report"].includes(delivers))
		return {
			role,
			delivers: undefined,
			problem: `must start with ${CODEX_FORMAT}`,
		};
	if (role !== "codex" && delivers !== undefined)
		return {
			role,
			delivers: undefined,
			problem: `role: ${role} must not carry delivers`,
		};
	return { role, delivers, problem: undefined };
}

// A launch note can precede the recorded brief in input.md.
export function recordedBriefDelivery(input) {
	const text = Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
	for (const line of text.split(/\r?\n/)) {
		if (!line.startsWith("<!-- brief-format:")) continue;
		const parsed = parseBriefFormat(`${line}\n`);
		return parsed.role === "codex" ? parsed.delivers : undefined;
	}
	return undefined;
}
