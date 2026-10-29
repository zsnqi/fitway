// Count lines and locate indexes in Markdown text.
export function lineAt(text, index) {
	return text.slice(0, index).split("\n").length;
}

export function lines(text) {
	const parts = text.split(/\r?\n/);
	return text.endsWith("\n") ? parts.length - 1 : parts.length;
}
