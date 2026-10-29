import { existsSync } from "node:fs";
import path from "node:path";
import { pathCitations } from "./facts.mjs";
import { collectFolderRecords, git, root } from "./survey-evidence.mjs";

export const TRACKED_RECORD_EXTENSIONS = new Set([
	".md",
	".yaml",
	".yml",
	".tsv",
	".txt",
]);

export async function collectTrackedCitationRecords({
	checkout = root,
	trackedFiles,
} = {}) {
	return collectFolderRecords([], {
		checkout,
		trackedFiles,
		recordExtensions: TRACKED_RECORD_EXTENSIONS,
	});
}

export function deadTempCitations(
	records,
	{ tempRoot = "D:/fitway-temp", exists = existsSync } = {},
) {
	return records.flatMap((record) =>
		pathCitations(record, { tempRoot }).flatMap((citation) =>
			exists(path.resolve(citation.path))
				? []
				: [
						{
							source: citation.source,
							line: citation.line,
							path: citation.path,
							text: citation.text,
						},
					],
		),
	);
}

export function changedLineNumbers(checkout, source, readGit = git) {
	const diff = readGit(
		["diff", "--unified=0", "--no-ext-diff", "origin/main", "--", source],
		checkout,
	);
	const lines = new Set();
	for (const match of diff.matchAll(
		/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm,
	)) {
		const start = Number(match[1]);
		const count = match[2] === undefined ? 1 : Number(match[2]);
		for (let line = start; line < start + count; line += 1) lines.add(line);
	}
	return lines;
}

export async function auditTempCitations({
	checkout = root,
	exists = existsSync,
	readGit = git,
	records,
	tempRoot = "D:/fitway-temp",
	trackedFiles,
} = {}) {
	if (!exists(tempRoot)) {
		return {
			checked: false,
			changed: [],
			dead: [],
			tempRoot,
			unchanged: [],
		};
	}
	const sources =
		records ??
		(await collectTrackedCitationRecords({ checkout, trackedFiles }));
	const dead = deadTempCitations(sources, { exists, tempRoot });
	const changedBySource = new Map();
	const withChanges = dead.map((citation) => {
		let lines = changedBySource.get(citation.source);
		if (!lines) {
			lines = changedLineNumbers(checkout, citation.source, readGit);
			changedBySource.set(citation.source, lines);
		}
		return { ...citation, changed: lines.has(citation.line) };
	});
	return {
		checked: true,
		changed: withChanges.filter((citation) => citation.changed),
		dead: withChanges,
		tempRoot,
		unchanged: withChanges.filter((citation) => !citation.changed),
	};
}
