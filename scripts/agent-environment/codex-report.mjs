import { appendFile, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathKey } from "./path-identity.mjs";

const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);
const CURSOR = new RegExp(`^${ESC}\\[(\\d+);(\\d+)H`);
const BEFORE_ESC = new RegExp(`^[^${ESC}]*`);
const TERMINAL_ESCAPES = new RegExp(
	`${ESC}(?:\\[[0-?]*[ -/]*[@-~]|\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\))`,
	"g",
);
const COMMIT = /^[0-9a-f]{7,64}$/i;
const ROW_KEYS = ["command", "id", "output", "status"];
const COMMIT_KEYS = ["commit"];

function sameKeys(value, expected) {
	return (
		Object.keys(value).sort().join("\n") === expected.join("\n") &&
		expected.every((key) => typeof value[key] === "string")
	);
}

function reportBlocks(message) {
	const lines = message.split(/\r?\n/);
	const blocks = [];
	let current = null;
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		if (!current) {
			if (/^```report[ \t]*$/.test(line))
				current = { line: index + 1, body: [], closed: false };
			continue;
		}
		if (/^```[ \t]*$/.test(line)) {
			current.closed = true;
			blocks.push(current);
			current = null;
			continue;
		}
		current.body.push({ line: index + 1, text: line });
	}
	if (current) blocks.push(current);
	return blocks;
}

function parseReportLine(line, delivers, rows, commitShas, failures) {
	if (!line.text.trim()) {
		failures.push(
			`report line ${line.line}: not one JSON object of a report form`,
		);
		return;
	}
	let value;
	try {
		value = JSON.parse(line.text);
	} catch {
		failures.push(
			`report line ${line.line}: not one JSON object of a report form`,
		);
		return;
	}
	if (!value || Array.isArray(value) || typeof value !== "object") {
		failures.push(
			`report line ${line.line}: not one JSON object of a report form`,
		);
		return;
	}
	if (sameKeys(value, COMMIT_KEYS)) {
		if (delivers !== "commit") {
			failures.push(
				`report line ${line.line}: commit line is only allowed for delivers: commit`,
			);
			return;
		}
		if (!COMMIT.test(value.commit)) {
			failures.push(
				`report line ${line.line}: commit must be 7 to 64 hex digits`,
			);
			return;
		}
		commitShas.push(value.commit.toLowerCase());
		return;
	}
	if (sameKeys(value, ROW_KEYS) && ["PASS", "FAIL"].includes(value.status)) {
		rows.push(value);
		return;
	}
	failures.push(
		`report line ${line.line}: not one JSON object of a report form`,
	);
}

export function parseReport(
	message,
	{ delivers, outcomeIds = new Set() } = {},
) {
	const stopped = /^STOPPED:/m.test(message);
	const blocks = reportBlocks(message);
	const present = blocks.length > 0 || stopped;
	const failures = [];
	const rows = [];
	const commitShas = [];
	if (!present) return { present, stopped, rows, commitShas, failures };
	if (blocks.length > 1) failures.push("report: more than one report block");
	for (const block of blocks) {
		if (!block.closed)
			failures.push(
				`report: block starting at line ${block.line} is not closed`,
			);
		for (const line of block.body)
			parseReportLine(line, delivers, rows, commitShas, failures);
	}
	if (delivers === "commit") {
		if (commitShas.length === 0 && !stopped)
			failures.push("commit: report names no commit line");
		if (commitShas.length > 1)
			failures.push(
				`commit: report has more than one commit line (${commitShas.join(", ")})`,
			);
	}
	const seen = new Set();
	for (const entry of rows) {
		if (seen.has(entry.id))
			failures.push(`report: ID ${entry.id} is given twice`);
		seen.add(entry.id);
		if (!outcomeIds.has(entry.id))
			failures.push(`report: ID ${entry.id} is not defined by the brief`);
	}
	if (!stopped)
		for (const id of outcomeIds)
			if (!seen.has(id)) failures.push(`report: ID ${id} is missing`);
	return { present, stopped, rows, commitShas, failures };
}

export function passedIds(report) {
	return new Set(
		report.rows
			.filter((entry) => entry.status === "PASS")
			.map((entry) => entry.id),
	);
}

function eventFileOrder(name) {
	if (name === "events.jsonl") return 0;
	const match = name.match(/^events-resume(?:-(\d+))?\.jsonl$/);
	if (!match) return null;
	return match[1] ? Number(match[1]) : 1;
}

function itemFor(event) {
	return event.item ?? event.payload?.item ?? event.payload ?? event;
}

export async function readRunActivity(run, worktree) {
	const files = (await readdir(run))
		.map((name) => ({ name, order: eventFileOrder(name) }))
		.filter(({ order }) => order !== null)
		.sort((left, right) => left.order - right.order);
	const records = [];
	const edits = [];
	const starts = new Map();
	let position = 0;
	for (const { name } of files) {
		const lines = (await readFile(path.join(run, name), "utf8")).split(/\r?\n/);
		for (let index = 0; index < lines.length; index += 1) {
			const line = lines[index];
			if (!line.trim()) continue;
			position += 1;
			let event;
			try {
				event = JSON.parse(line);
			} catch {
				continue;
			}
			if (!event || typeof event !== "object") continue;
			const item = itemFor(event);
			if (!item || typeof item !== "object") continue;
			const status = item.status ?? event.status;
			const id = typeof item.id === "string" ? item.id : null;
			if (item.type === "command_execution") {
				let command = item.command ?? item.cmd ?? event.command;
				if (Array.isArray(command)) command = command.join(" ");
				const eventType = event.type;
				if (eventType === "item.started" && typeof command === "string" && id)
					starts.set(`${name}\n${id}`, {
						position,
						events: name,
						line: index + 1,
					});
				const exitCode =
					item.exit_code ?? item.exitCode ?? event.exit_code ?? event.exitCode;
				const output =
					item.aggregated_output ??
					item.output ??
					event.aggregated_output ??
					event.output ??
					"";
				if (
					typeof command === "string" &&
					Number.isInteger(exitCode) &&
					(status === undefined || status === "completed")
				) {
					const started = id ? starts.get(`${name}\n${id}`) : undefined;
					records.push({
						command,
						exitCode,
						output: typeof output === "string" ? output : "",
						position: started?.position ?? position,
						events: started?.events ?? name,
						line: started?.line ?? index + 1,
					});
				}
			}
			if (
				item.type === "file_change" &&
				(status === undefined || status === "completed") &&
				Array.isArray(item.changes)
			)
				for (const change of item.changes)
					if (change && typeof change.path === "string")
						edits.push({
							path: path.resolve(worktree, change.path),
							position,
							events: name,
							line: index + 1,
						});
		}
	}
	return { records, edits };
}

function unwrapCommand(command) {
	const text = command.trim();
	for (const pattern of [
		/^(?:"[^"]*powershell(?:\.exe)?"|powershell(?:\.exe)?)(?:\s+-[^\s]+)*\s+-Command\s+(['"])([\s\S]*)\1$/i,
		/^(?:"[^"]*bash(?:\.exe)?"|bash(?:\.exe)?)(?:\s+-[^\s]+)*\s+-lc\s+(['"])([\s\S]*)\1$/i,
	]) {
		const match = text.match(pattern);
		if (match) return match[2].trim();
	}
	return text;
}

export function outputLines(output) {
	const logical = [];
	for (let segment of String(output).split(/\r?\n/)) {
		const cursor = segment.match(CURSOR);
		if (cursor && Number(cursor[2]) > 1 && logical.length) {
			segment = segment.slice(cursor[0].length);
			const lead = segment.match(BEFORE_ESC)?.[0] ?? "";
			let overlap = 0;
			for (let size = Math.min(8, lead.length); size > 0; size -= 1)
				if (logical.at(-1).endsWith(lead.slice(0, size))) {
					overlap = size;
					break;
				}
			const current = logical.pop();
			logical.push(
				`${overlap ? current.slice(0, -overlap) : current}${segment}`,
			);
		} else logical.push(segment);
	}
	return logical.map((line) => line.replace(TERMINAL_ESCAPES, "").trim());
}

function rowMatches(row, record) {
	if (
		row.command !== record.command &&
		row.command !== unwrapCommand(record.command)
	)
		return false;
	const expected = row.output.trim();
	return Boolean(expected) && outputLines(record.output).includes(expected);
}

export async function matchReportRows(
	report,
	activity,
	{ worktree, freshEvidence },
) {
	const worktreeKey = await pathKey(worktree);
	const inside = [];
	for (const edit of activity.edits) {
		const key = await pathKey(edit.path);
		if (key === worktreeKey || key.startsWith(`${worktreeKey}${path.sep}`))
			inside.push(edit);
	}
	const lastEdit = inside.at(-1);
	const rows = [];
	const failures = [];
	for (const entry of report.rows) {
		const result = {
			id: entry.id,
			status: entry.status,
			command: entry.command,
			output: entry.output,
			events: null,
			line: null,
		};
		if (entry.status === "PASS") {
			const matches = activity.records.filter((record) =>
				rowMatches(entry, record),
			);
			const latest = matches.reduce(
				(last, record) =>
					!last || record.position > last.position ? record : last,
				null,
			);
			if (!latest) {
				failures.push(`PASS row ${entry.id} has no matching record`);
			} else if (
				freshEvidence &&
				lastEdit &&
				latest.position < lastEdit.position
			) {
				failures.push(
					`PASS row ${entry.id}: latest matching record starts before file change ${lastEdit.path} at ${lastEdit.events}:${lastEdit.line}`,
				);
			} else {
				result.events = latest.events;
				result.line = latest.line;
			}
		}
		rows.push(result);
	}
	return { rows, failures };
}

export function appendReportCheck(run, record) {
	return appendFile(
		path.join(run, "report-checks.jsonl"),
		`${JSON.stringify(record)}\n`,
	);
}
