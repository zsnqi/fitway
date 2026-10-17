const DUPLICATION_WINDOW_LINES = 8;

export function countDuplicationCopies(hits, visit) {
	let total = 0;
	for (const hit of hits) {
		for (const place of hit.places ?? [{ file: hit.file, line: hit.line }]) {
			total++;
			visit?.(hit, place);
		}
	}
	return total;
}

function sourceLines(text) {
	const lines = [];
	text.split(/\r?\n/).forEach((value, index) => {
		const normalized = value
			.replace(/\s*(?:\/\/|\/\*|<!--)\s*code-health-exception:.*$/, "")
			.trim();
		if (normalized) lines.push({ value: normalized, line: index + 1 });
	});
	return lines;
}

function seedSequences(sources) {
	const sequences = new Map();
	for (const [file, values] of sources) {
		for (
			let index = 0;
			index + DUPLICATION_WINDOW_LINES <= values.length;
			index++
		) {
			const key = values
				.slice(index, index + DUPLICATION_WINDOW_LINES)
				.map(({ value }) => value)
				.join("\n");
			const places = sequences.get(key) ?? [];
			places.push({ file, index });
			sequences.set(key, places);
		}
	}
	return sequences;
}

function shortestPeriod(content) {
	const lines = content.split("\n");
	for (let period = DUPLICATION_WINDOW_LINES; period < lines.length; period++) {
		if (
			lines.length % period === 0 &&
			lines.every((value, index) => value === lines[index % period])
		)
			return lines.slice(0, period).join("\n");
	}
	return content;
}

function findOccurrences(sources, blockLines) {
	const occurrences = [];
	for (const [file, values] of sources) {
		for (let index = 0; index + blockLines.length <= values.length; index++) {
			if (
				blockLines.every(
					(value, offset) => values[index + offset].value === value,
				)
			)
				occurrences.push({ file, line: values[index].line });
		}
	}
	return occurrences.sort(
		(a, b) => a.file.localeCompare(b.file) || a.line - b.line,
	);
}

export function scanDuplication(files) {
	const sources = new Map(
		files.map(({ file, text }) => [file, sourceLines(text)]),
	);
	const sequences = seedSequences(sources);
	const blocks = new Map();
	for (const places of sequences.values()) {
		if (places.length < 2) continue;
		let before = 0;
		let after = DUPLICATION_WINDOW_LINES;
		const common = (shift) => {
			const value = sources.get(places[0].file)[places[0].index + shift]?.value;
			return (
				value &&
				places.every(
					(place) =>
						sources.get(place.file)[place.index + shift]?.value === value,
				)
			);
		};
		while (common(before - 1)) before--;
		while (common(after)) after++;
		const first = places[0];
		const content = shortestPeriod(
			sources
				.get(first.file)
				.slice(first.index + before, first.index + after)
				.map(({ value }) => value)
				.join("\n"),
		);
		if (blocks.has(content)) continue;
		const blockLines = content.split("\n");
		const occurrences = findOccurrences(sources, blockLines);
		if (occurrences.length < 2) continue;
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
