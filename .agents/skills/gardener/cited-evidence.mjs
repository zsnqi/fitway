// Tracked record citations, dead temp paths, and changed citation lines.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { inside, key, pathCitations } from "./facts.mjs";
import { collectFolderRecords, git, root } from "./survey-evidence.mjs";

export const TRACKED_RECORD_EXTENSIONS = new Set([
	".md",
	".yaml",
	".yml",
	".tsv",
	".txt",
]);
export const LOST_TEMP_EVIDENCE_PATH =
	"docs/agent-context/LOST_TEMP_EVIDENCE.tsv";
export const LOST_TEMP_EVIDENCE_CAUSES = Object.freeze([
	"2026-10-24 prune",
	"remove-worktrees.ps1",
	"another grading-worktree removal",
	"absent before the prune",
	"documentation example that never existed",
	"cause not found",
]);
const LOST_TEMP_EVIDENCE_HEADER = ["path", "record", "line", "cause"];

function lostEvidenceError(row, message) {
	return new Error(`${LOST_TEMP_EVIDENCE_PATH}:${row}: ${message}`);
}

function parseLostTempEvidence(text) {
	const lines = text.split(/\r?\n/);
	if (lines.at(-1) === "") lines.pop();
	if (!lines.length) {
		throw lostEvidenceError(1, "header row is missing");
	}
	const header = lines[0].split("\t");
	if (
		header.length !== LOST_TEMP_EVIDENCE_HEADER.length ||
		header.some((value, index) => value !== LOST_TEMP_EVIDENCE_HEADER[index])
	) {
		throw lostEvidenceError(
			1,
			`header must be ${LOST_TEMP_EVIDENCE_HEADER.join("\\t")}`,
		);
	}
	return lines.slice(1).map((line, index) => {
		const row = index + 2;
		const columns = line.split("\t");
		if (
			columns.length !== 4 ||
			columns.some((value) => !value.trim()) ||
			!Number.isInteger(Number(columns[2])) ||
			Number(columns[2]) < 1 ||
			columns[1] === LOST_TEMP_EVIDENCE_PATH ||
			!LOST_TEMP_EVIDENCE_CAUSES.includes(columns[3])
		) {
			throw lostEvidenceError(
				row,
				"expected non-empty path, record and known cause, and a positive line",
			);
		}
		return {
			cause: columns[3],
			line: Number(columns[2]),
			path: columns[0].toLowerCase(),
			record: columns[1],
			row,
		};
	});
}

function readLostTempEvidence(checkout) {
	try {
		return parseLostTempEvidence(
			readFileSync(path.join(checkout, LOST_TEMP_EVIDENCE_PATH), "utf8"),
		);
	} catch (error) {
		if (error.code === "ENOENT") return [];
		throw error;
	}
}

function rowCitationKey(row) {
	return `${row.record}\0${key(row.path)}`;
}

function rowCountsByCitation(rows) {
	const counts = new Map();
	for (const row of rows) {
		const citationKey = rowCitationKey(row);
		counts.set(citationKey, (counts.get(citationKey) ?? 0) + 1);
	}
	return counts;
}

function assertLostEvidenceRows(rows, declared, records, { exists, tempRoot }) {
	const citationCounts = new Map();
	for (const record of records) {
		for (const citation of pathCitations(record, { tempRoot })) {
			const citationKey = rowCitationKey({
				record: citation.source,
				path: citation.path,
			});
			citationCounts.set(
				citationKey,
				(citationCounts.get(citationKey) ?? 0) + 1,
			);
		}
	}
	for (const row of rows) {
		if (!inside(tempRoot, row.path)) {
			throw lostEvidenceError(
				row.row,
				`path is outside ${tempRoot}: ${row.path}`,
			);
		}
	}
	for (const [citationKey, count] of declared) {
		const current = citationCounts.get(citationKey) ?? 0;
		if (current < count) {
			const firstRow = rows.find(
				(candidate) => rowCitationKey(candidate) === citationKey,
			);
			const [record, lostPath] = citationKey.split("\0");
			throw lostEvidenceError(
				firstRow.row,
				`${record} now cites ${lostPath} ${current} times; the list names it ${count}`,
			);
		}
	}
	if (!exists(tempRoot)) return;
	for (const row of rows) {
		if (exists(path.resolve(row.path))) {
			throw lostEvidenceError(row.row, `listed path exists again: ${row.path}`);
		}
	}
}

export async function collectTrackedCitationRecords({
	checkout = root,
	trackedFiles,
} = {}) {
	const records = await collectFolderRecords([], {
		checkout,
		trackedFiles,
		recordExtensions: TRACKED_RECORD_EXTENSIONS,
	});
	return records.filter((record) => record.source !== LOST_TEMP_EVIDENCE_PATH);
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

export function citationIntegrationBase(checkout, readGit = git) {
	let branch;
	try {
		branch = readGit(["symbolic-ref", "--quiet", "--short", "HEAD"], checkout);
	} catch {
		return { diffBase: "origin/main", label: "origin/main" };
	}
	if (!branch) return { diffBase: "origin/main", label: "origin/main" };
	const configuredUpstream = readGit(
		["for-each-ref", "--format=%(upstream)", `refs/heads/${branch}`],
		checkout,
	);
	const upstream = configuredUpstream
		.replace(/^refs\/remotes\//, "")
		.replace(/^refs\/heads\//, "");
	const remoteSeparator = upstream.indexOf("/");
	const ownRemoteCopy =
		remoteSeparator >= 0 && upstream.slice(remoteSeparator + 1) === branch;
	if (!upstream || ownRemoteCopy) {
		return { diffBase: "origin/main", label: "origin/main" };
	}
	return {
		diffBase: readGit(["merge-base", "HEAD", upstream], checkout),
		label: `${upstream} merge base`,
	};
}

export function changedLineNumbers(
	checkout,
	source,
	readGit = git,
	base = "origin/main",
) {
	const diff = readGit(
		["diff", "--unified=0", "--no-ext-diff", base, "--", source],
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
	const rows = readLostTempEvidence(checkout);
	const sources =
		records ??
		(await collectTrackedCitationRecords({ checkout, trackedFiles }));
	const rowCounts = rowCountsByCitation(rows);
	assertLostEvidenceRows(rows, rowCounts, sources, { exists, tempRoot });
	const integrationBase = citationIntegrationBase(checkout, readGit);
	if (!exists(tempRoot)) {
		return {
			base: integrationBase.label,
			checked: false,
			changed: [],
			dead: [],
			listed: [],
			rows,
			tempRoot,
			unchanged: [],
			unlisted: [],
		};
	}
	const dead = deadTempCitations(sources, { exists, tempRoot });
	const changedBySource = new Map();
	const withChanges = dead.map((citation) => {
		let lines = changedBySource.get(citation.source);
		if (!lines) {
			lines = changedLineNumbers(
				checkout,
				citation.source,
				readGit,
				integrationBase.diffBase,
			);
			changedBySource.set(citation.source, lines);
		}
		return { ...citation, changed: lines.has(citation.line) };
	});
	const availableRows = new Map(rowCounts);
	const listed = [];
	const unlisted = [];
	for (const citation of withChanges) {
		const citationKey = rowCitationKey({
			record: citation.source,
			path: citation.path,
		});
		const available = availableRows.get(citationKey) ?? 0;
		if (available) {
			availableRows.set(citationKey, available - 1);
			listed.push(citation);
		} else {
			unlisted.push(citation);
		}
	}
	return {
		base: integrationBase.label,
		checked: true,
		changed: unlisted.filter((citation) => citation.changed),
		dead: withChanges,
		listed,
		rows,
		tempRoot,
		unchanged: unlisted.filter((citation) => !citation.changed),
		unlisted,
	};
}
