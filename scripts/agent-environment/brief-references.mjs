// Brief citation and decision-report reference checks.

import path from "node:path";
import { END, START } from "./brief-markdown.mjs";
import { isWithin } from "./brief-review-sources.mjs";

function citedDecisionItems(tail) {
	const citation = tail.match(
		/^\s+items?\s+((?:\d+\s*(?:-\s*\d+)?)(?:\s*(?:,|and)\s*\d+\s*(?:-\s*\d+)?)*)(?=\s|[.,;:]|$)/i,
	);
	if (!citation) return [];
	const items = [];
	for (const part of citation[1].split(/\s*(?:,|and)\s*/i)) {
		const [start, end = start] = part.split(/\s*-\s*/).map(Number);
		for (let item = start; item <= end; item += 1) items.push(item);
	}
	return items;
}

function citedRows(tail) {
	const citation = tail.match(/^\s+(rows?)\s+([^\r\n.;]+)/i);
	if (!citation) return [];
	const ids = [];
	for (const part of citation[2]
		.replaceAll("`", "")
		.trim()
		.split(/\s*(?:,|\band\b)\s*/i)
		.filter(Boolean)) {
		const range = part.match(
			/^([A-Za-z]+(?:-[A-Za-z]+)*?)(\d+)-([A-Za-z]+(?:-[A-Za-z]+)*?)(\d+)$/,
		);
		if (range) {
			if (range[1] !== range[3]) return [];
			const start = Number(range[2]);
			const end = Number(range[4]);
			if (start > end) return [];
			for (let number = start; number <= end; number += 1)
				ids.push(`${range[1]}${number}`);
			continue;
		}
		if (!/^[A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)*\d+$/.test(part)) return [];
		ids.push(part);
	}
	if (citation[1].toLowerCase() === "row" && ids.length !== 1) return [];
	return [...new Set(ids)];
}

function tableRowId(line) {
	const trimmed = line.trimStart();
	const cells = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed;
	const separator = cells.indexOf("|");
	return separator < 0 ? null : cells.slice(0, separator).trim();
}

function reportMissingRows(
	content,
	rowIds,
	file,
	absolute,
	head,
	line,
	report,
) {
	const rows = new Set();
	if (content !== null) {
		if (/\.tsv$/i.test(file)) {
			for (const row of content.split(/\r?\n/))
				rows.add(row.split("\t", 1)[0].trim());
		} else {
			for (const row of content.split(/\r?\n/)) {
				const id = tableRowId(row);
				if (id) rows.add(id);
			}
		}
	}
	for (const id of rowIds)
		if (!rows.has(id))
			report(
				"brief-references",
				line,
				`missing row ${id} in ${file} at HEAD ${head} (${absolute})`,
			);
}

async function rowContent({ worktree, head, absolute, fallback, git }) {
	if (head && isWithin(worktree, absolute)) {
		const relative = path
			.relative(path.resolve(worktree), path.resolve(absolute))
			.replaceAll(path.sep, "/");
		try {
			return git(worktree, ["show", `${head}:${relative}`]);
		} catch {
			return null;
		}
	}
	return fallback();
}

function numberedTopLevelEntries(text) {
	const entries = new Set();
	let fence = null;
	for (const line of text.split(/\r?\n/)) {
		const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
		if (delimiter) {
			if (!fence) fence = delimiter[1];
			else if (
				delimiter[1][0] === fence[0] &&
				delimiter[1].length >= fence.length &&
				/^ {0,3}(?:`+|~+)\s*$/.test(line)
			)
				fence = null;
			continue;
		}
		if (fence) continue;
		const entry = line.match(/^(\d+)\.\s+/);
		if (entry) entries.add(Number(entry[1]));
	}
	return entries;
}

function reportMissingDecisionItems(
	content,
	decisionItems,
	file,
	absolute,
	worktree,
	line,
	report,
) {
	const entries = numberedTopLevelEntries(content);
	for (const item of decisionItems)
		if (!entries.has(item))
			report(
				"brief-references",
				line,
				`missing decision item ${item} in ${file} (${absolute}) in worktree ${worktree}`,
			);
}

function environmentBlock(text) {
	const starts = [...text.matchAll(/^<!-- environment:start v1 -->\r?$/gm)];
	const ends = [...text.matchAll(/^<!-- environment:end -->\r?$/gm)];
	if (starts.length !== 1 || ends.length !== 1) return null;
	const start = starts[0].index;
	const innerStart = start + START.length;
	const innerEnd = ends[0].index;
	if (innerEnd < innerStart) return null;
	return {
		start,
		innerStart,
		innerEnd,
		end: innerEnd + END.length,
		inner: text.slice(innerStart, innerEnd),
	};
}

export {
	citedDecisionItems,
	citedRows,
	environmentBlock,
	reportMissingDecisionItems,
	reportMissingRows,
	rowContent,
};
