// Parse a brief's format header and recorded delivery target.
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

// The field is read from the recorded brief's first line only: input.md's first line, or the
// first line after the launcher's launch note and its one blank line.
const LAUNCH_NOTE =
	/^Launch note: HEAD [0-9a-f]{7,64} only adds this brief over the named HEAD\.\r?\n\r?\n/;

export function recordedBriefDelivery(input) {
	const text = Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
	const [first] = text.replace(LAUNCH_NOTE, "").split(/\r?\n/, 1);
	if (!first.startsWith("<!-- brief-format:")) return undefined;
	const parsed = parseBriefFormat(`${first}\n`);
	return parsed.role === "codex" ? parsed.delivers : undefined;
}
