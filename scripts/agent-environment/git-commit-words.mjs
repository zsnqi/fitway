// The launcher's reading of a shell command an agent ran (the claim checks in codex-round.mjs):
// whether its words are a git commit, past git's own leading options. These are the words of a
// command in Codex's event stream, never the launcher's own arguments.
export function isGitCommitWords(words) {
	if (!/^git(?:\.exe)?$/i.test(words[0] ?? "")) return false;
	let index = 1;
	while (index < words.length) {
		if (words[index] === "--no-pager") {
			index += 1;
			continue;
		}
		if (words[index] === "-C" || words[index] === "-c") {
			index += 2;
			continue;
		}
		break;
	}
	if (!/^commit$/i.test(words[index] ?? "")) return false;
	return !words
		.slice(index + 1)
		.some((word) => /^--(?:dry-run|help)$/i.test(word));
}
