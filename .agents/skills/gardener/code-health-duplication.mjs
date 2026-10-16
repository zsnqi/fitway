export const DUPLICATION_WINDOW_LINES = 8;

export function scanDuplication(files) {
	const sequences = new Map();
	const sources = new Map(
		files.map(({ file, text }) => [
			file,
			text.split(/\r?\n/).map((line) => line.trim()),
		]),
	);
	for (const [file, values] of sources) {
		for (
			let line = 0;
			line + DUPLICATION_WINDOW_LINES <= values.length;
			line++
		) {
			const block = values.slice(line, line + DUPLICATION_WINDOW_LINES);
			if (block.some((value) => !value)) continue;
			const key = block.join("\n");
			const places = sequences.get(key) ?? [];
			places.push({ file, line: line + 1 });
			sequences.set(key, places);
		}
	}
	const blocks = new Map();
	// Extend each repeated seed to its common maximal block. Group by content,
	// rather than a location, so three occurrences still count as one block.
	for (const places of sequences.values()) {
		if (places.length < 2) continue;
		let before = 0;
		let after = DUPLICATION_WINDOW_LINES;
		const common = (shift) => {
			const value = sources.get(places[0].file)[places[0].line - 1 + shift];
			return (
				value &&
				places.every(
					(place) => sources.get(place.file)[place.line - 1 + shift] === value,
				)
			);
		};
		while (common(before - 1)) before--;
		while (common(after)) after++;
		const first = places[0];
		const content = sources
			.get(first.file)
			.slice(first.line - 1 + before, first.line - 1 + after)
			.join("\n");
		if (blocks.has(content)) continue;
		// Include every location for the whole block, not just this seed's
		// locations; a longer shared run can start from several seeds.
		const blockLines = content.split("\n");
		const occurrences = [];
		for (const [file, values] of sources) {
			for (let line = 0; line + blockLines.length <= values.length; line++) {
				if (
					blockLines.every((value, offset) => values[line + offset] === value)
				)
					occurrences.push({ file, line: line + 1 });
			}
		}
		if (occurrences.length < 2) continue;
		occurrences.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
		blocks.set(content, {
			...occurrences[0],
			detail: `${blockLines.length}-line duplicate block`,
			lineCount: blockLines.length,
			places: occurrences,
		});
	}
	return [...blocks.values()].sort(
		(a, b) => a.file.localeCompare(b.file) || a.line - b.line,
	);
}
