// Tracked record citations, dead temp paths, and changed citation lines.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { inside, key, pathCitations } from "./facts.mjs";
import { auditRunFolderProvenance } from "./run-folder-provenance.mjs";
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

export function parseLostTempEvidence(text) {
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

function diffLineNumbers(diff) {
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
	return diffLineNumbers(diff);
}

function stagedDiffLineNumbers(checkout, source, readGit, parent) {
	const against = parent ? [parent] : [];
	const diff = readGit(
		[
			"diff",
			"--cached",
			"--unified=0",
			"--no-ext-diff",
			...against,
			"--",
			source,
		],
		checkout,
	);
	return diffLineNumbers(diff);
}

// Lines the index adds. Outside a merge `parents` is empty and only the diff against HEAD runs;
// in a merge a line is added only when it is added against HEAD and against every merge parent.
export function stagedLineNumbers(
	checkout,
	source,
	readGit = git,
	parents = [],
) {
	const lines = stagedDiffLineNumbers(checkout, source, readGit);
	for (const parent of parents) {
		if (!lines.size) break;
		const added = stagedDiffLineNumbers(checkout, source, readGit, parent);
		for (const line of lines) if (!added.has(line)) lines.delete(line);
	}
	return lines;
}

function partitionTempCitations(sources, { exists, tempRoot }) {
	const citations = sources.flatMap((record) =>
		pathCitations(record, { tempRoot }),
	);
	const existing = [];
	const dead = [];
	for (const citation of citations)
		(exists(path.resolve(citation.path)) ? existing : dead).push(citation);
	return { dead, existing };
}

function changedCitationMatcher(
	checkout,
	readGit,
	staged,
	diffBase,
	mergeParents,
) {
	const changedBySource = new Map();
	return (citation) => {
		let lines = changedBySource.get(citation.source);
		if (!lines) {
			lines = staged
				? stagedLineNumbers(checkout, citation.source, readGit, mergeParents)
				: changedLineNumbers(checkout, citation.source, readGit, diffBase);
			changedBySource.set(citation.source, lines);
		}
		return lines.has(citation.line);
	};
}

function classifyDeadCitations(dead, rowCounts, lineChanged) {
	const withChanges = dead.map((citation) => ({
		...citation,
		changed: lineChanged(citation),
	}));
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
	return { listed, unlisted, withChanges };
}

export async function auditTempCitations({
	checkout = root,
	exists = existsSync,
	lostEvidenceRows,
	mergeParents = [],
	readGit = git,
	holdsCommit,
	readFile = readFileSync,
	records,
	staged = false,
	stat,
	tempRoot = "D:/fitway-temp",
	trackedFiles,
	validateLostEvidence = true,
} = {}) {
	const rows = lostEvidenceRows ?? readLostTempEvidence(checkout);
	const sources =
		records ??
		(await collectTrackedCitationRecords({ checkout, trackedFiles }));
	const rowCounts = rowCountsByCitation(rows);
	if (validateLostEvidence)
		assertLostEvidenceRows(rows, rowCounts, sources, { exists, tempRoot });
	const integrationBase = staged
		? { diffBase: null, label: "the staged index against HEAD" }
		: citationIntegrationBase(checkout, readGit);
	if (!exists(tempRoot)) {
		return {
			base: integrationBase.label,
			checked: false,
			changed: [],
			dead: [],
			legacy: [],
			legacyAccepted: 0,
			listed: [],
			provenanceFailures: [],
			rows,
			tempRoot,
			unchanged: [],
			unlisted: [],
		};
	}
	const { dead, existing } = partitionTempCitations(sources, {
		exists,
		tempRoot,
	});
	const lineChanged = changedCitationMatcher(
		checkout,
		readGit,
		staged,
		integrationBase.diffBase,
		mergeParents,
	);
	const { listed, unlisted, withChanges } = classifyDeadCitations(
		dead,
		rowCounts,
		lineChanged,
	);
	const { legacy, provenanceFailures } = auditRunFolderProvenance(existing, {
		checkout,
		holdsCommit,
		lineChanged,
		readFile,
		stat,
		tempRoot,
	});
	return {
		base: integrationBase.label,
		checked: true,
		changed: unlisted.filter((citation) => citation.changed),
		dead: withChanges,
		legacy,
		legacyAccepted: legacy.length,
		listed,
		provenanceFailures,
		rows,
		tempRoot,
		unchanged: unlisted.filter((citation) => !citation.changed),
		unlisted,
	};
}
