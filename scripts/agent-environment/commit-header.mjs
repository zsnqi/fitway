const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);
const TERMINAL_ESCAPES = new RegExp(
	`${ESC}(?:\\[[0-?]*[ -/]*[@-~]|\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\))`,
	"g",
);
const COMMIT_HEADER = /^\[.*?(?: \(root-commit\))? ([0-9a-f]{7,64})\]/im;

export function commitHeaderSha(output) {
	const text = String(output).replace(TERMINAL_ESCAPES, "");
	const match = text.match(COMMIT_HEADER);
	return match ? match[1].toLowerCase() : null;
}
