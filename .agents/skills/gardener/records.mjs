import { readFile } from "node:fs/promises";
import path from "node:path";

const ROUND_COLUMNS = [
	"milestone",
	"round",
	"date",
	"writer",
	"model",
	"effort",
	"attempts",
	"brief_rows",
	"heldout_rows",
	"heldout_partial",
	"brief_caused_fails",
	"interventions",
	"post_acceptance_defects",
	"start_load",
	"result",
	"source",
	"notes",
];

const FINDING_COLUMNS = [
	"id",
	"milestone",
	"round",
	"date",
	"class",
	"finding",
	"status",
	"seen_by",
	"demo",
	"resolved_by",
	"evidence",
	"source",
];

const METRICS = [
	"mean_attempts",
	"repair_share",
	"heldout_rows",
	"brief_caused_fails_per_round",
	"interventions_per_round",
	"post_acceptance_defects_per_round",
];

function issue(file, line, reason) {
	return { file, line, reason };
}

function splitLines(text) {
	return String(text)
		.split(/\r?\n/)
		.filter(
			(line, index, lines) => !(index === lines.length - 1 && line === ""),
		);
}

function parseNumber(value) {
	if (value == null || value.trim() === "") return null;
	const number = Number(value.trim());
	return Number.isFinite(number) ? number : null;
}

function parseInteger(value) {
	const number = parseNumber(value);
	return number != null && Number.isInteger(number) ? number : null;
}

function parseFraction(value) {
	if (value == null || value.trim() === "") return null;
	const match = value.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
	if (!match || Number(match[2]) < 0 || Number(match[1]) > Number(match[2]))
		return null;
	return { passed: Number(match[1]), graded: Number(match[2]) };
}

function parseDate(value) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
	const date = new Date(`${value}T00:00:00Z`);
	return Number.isNaN(date.valueOf()) ||
		date.toISOString().slice(0, 10) !== value
		? null
		: { date: value, month: value.slice(0, 7) };
}

function metric(value, count) {
	return { value, count, n: count };
}

function aggregateRoundGroup(rows) {
	const unknown = Object.fromEntries(METRICS.map((name) => [name, 0]));
	const attempts = rows.map((row) => parseInteger(row.attempts));
	const validAttempts = attempts.filter((value) => value != null);
	unknown.mean_attempts = rows.length - validAttempts.length;
	unknown.repair_share = unknown.mean_attempts;

	const heldout = rows.map((row) => parseFraction(row.heldout_rows));
	const validHeldout = heldout.filter(Boolean);
	unknown.heldout_rows = rows.length - validHeldout.length;

	const numeric = {};
	for (const name of [
		"brief_caused_fails",
		"interventions",
		"post_acceptance_defects",
	]) {
		const values = rows.map((row) => parseNumber(row[name]));
		numeric[name] = values.filter((value) => value != null);
		unknown[
			`${name === "brief_caused_fails" ? "brief_caused_fails_per_round" : name === "interventions" ? "interventions_per_round" : "post_acceptance_defects_per_round"}`
		] = rows.length - numeric[name].length;
	}

	const repairCount = validAttempts.filter((value) => value > 1).length;
	const passed = validHeldout.reduce((sum, value) => sum + value.passed, 0);
	const graded = validHeldout.reduce((sum, value) => sum + value.graded, 0);
	const mean = (values) =>
		values.length
			? values.reduce((sum, value) => sum + value, 0) / values.length
			: null;

	return {
		n: rows.length,
		mean_attempts: metric(mean(validAttempts), validAttempts.length),
		repair_share: metric(
			validAttempts.length ? repairCount / validAttempts.length : null,
			validAttempts.length,
		),
		heldout_rows: {
			passed,
			graded,
			rate: graded ? passed / graded : null,
			count: validHeldout.length,
			n: validHeldout.length,
		},
		brief_caused_fails_per_round: metric(
			mean(numeric.brief_caused_fails),
			numeric.brief_caused_fails.length,
		),
		interventions_per_round: metric(
			mean(numeric.interventions),
			numeric.interventions.length,
		),
		post_acceptance_defects_per_round: metric(
			mean(numeric.post_acceptance_defects),
			numeric.post_acceptance_defects.length,
		),
		unknown,
	};
}

function parseRows(text, columns, file, { dateColumn = "date" } = {}) {
	const lines = splitLines(text);
	const malformed = [];
	const header = lines[0]?.split("\t");
	if (!header || header.join("\t") !== columns.join("\t"))
		malformed.push(issue(file, 1, "header has wrong fields"));
	const rows = [];
	for (let index = 1; index < lines.length; index += 1) {
		const line = lines[index];
		const values = line.split("\t");
		if (values.length !== columns.length) {
			malformed.push(
				issue(
					file,
					index + 1,
					`wrong number of fields (expected ${columns.length}, got ${values.length})`,
				),
			);
			continue;
		}
		const row = Object.fromEntries(
			columns.map((column, i) => [column, values[i]]),
		);
		const date = parseDate(row[dateColumn]);
		if (!date) {
			malformed.push(
				issue(
					file,
					index + 1,
					`unreadable month/date: ${JSON.stringify(row[dateColumn])}`,
				),
			);
			continue;
		}
		row.month = date.month;
		row.line = index + 1;
		rows.push(row);
	}
	return { rows, malformed };
}

function analyzeFindings(text, file) {
	const parsed = parseRows(text, FINDING_COLUMNS, file);
	const seen = new Map();
	const byClass = new Map();
	for (const row of parsed.rows) {
		if (!row.id.trim()) {
			parsed.malformed.push(issue(file, row.line, "unreadable id"));
			continue;
		}
		if (seen.has(row.id))
			parsed.malformed.push(
				issue(file, row.line, `duplicate id ${JSON.stringify(row.id)}`),
			);
		else seen.set(row.id, row.line);
		const status = row.status.trim().toLowerCase();
		if (!status) {
			parsed.malformed.push(issue(file, row.line, "unreadable status"));
			continue;
		}
		const name = row.class.trim();
		if (!name) {
			parsed.malformed.push(issue(file, row.line, "unreadable class"));
			continue;
		}
		const current = byClass.get(name) ?? {
			class: name,
			open: 0,
			fixed: 0,
			other: 0,
			openLines: [],
		};
		if (status === "open") {
			current.open += 1;
			current.openLines.push({
				id: row.id,
				round: `${row.milestone}/${row.round}`,
				line: row.line,
			});
		} else if (status === "fixed") current.fixed += 1;
		else current.other += 1;
		byClass.set(name, current);
	}
	const classes = [...byClass.values()].map(({ openLines, ...value }) => value);
	const recurring = [...byClass.values()]
		.filter(
			(item) => new Set(item.openLines.map((line) => line.round)).size >= 2,
		)
		.map((item) => ({
			class: item.class,
			ids: item.openLines.map((line) => line.id),
			rounds: [...new Set(item.openLines.map((line) => line.round))],
			due: item.class.startsWith("cli-gap:")
				? `CLI feature due: ${item.class.slice("cli-gap:".length)}`
				: null,
		}));
	return { classes, recurring, malformed: parsed.malformed };
}

function analyzeRounds(text, file) {
	const parsed = parseRows(text, ROUND_COLUMNS, file);
	const groups = new Map();
	for (const row of parsed.rows) {
		const writer = row.writer.trim() || "(unknown writer)";
		const key = `${row.month}\u0000${writer}`;
		const rows = groups.get(key) ?? [];
		rows.push(row);
		groups.set(key, rows);
	}
	const months = new Map();
	for (const rows of groups.values()) {
		const month = rows[0].month;
		const writer = rows[0].writer.trim() || "(unknown writer)";
		const item = { writer, ...aggregateRoundGroup(rows) };
		const current = months.get(month) ?? { month, n: 0, writers: [] };
		current.n += rows.length;
		current.writers.push(item);
		months.set(month, current);
	}
	for (const item of months.values())
		item.writers.sort((a, b) => a.writer.localeCompare(b.writer));
	return {
		months: [...months.values()].sort((a, b) => a.month.localeCompare(b.month)),
		malformed: parsed.malformed,
	};
}

export function analyzeRecordTexts({
	roundsText,
	findingsText,
	roundsFile = "rounds.tsv",
	findingsFile = "findings.tsv",
}) {
	const missing = [];
	const rounds =
		roundsText == null
			? { months: [], malformed: [] }
			: analyzeRounds(roundsText, roundsFile);
	const findings =
		findingsText == null
			? { classes: [], recurring: [], malformed: [] }
			: analyzeFindings(findingsText, findingsFile);
	if (roundsText == null)
		missing.push({ file: roundsFile, reason: "file not found" });
	if (findingsText == null)
		missing.push({ file: findingsFile, reason: "file not found" });
	return {
		rounds: rounds.months,
		findings: { classes: findings.classes, recurring: findings.recurring },
		malformed: [...rounds.malformed, ...findings.malformed],
		missing,
	};
}

export async function collectRecordSurvey({
	checkout,
	roundsFile = "docs/phase-records/handoffs/agent-environment/rounds.tsv",
	findingsFile = "docs/phase-records/handoffs/agent-environment/findings.tsv",
}) {
	const read = async (source) => {
		try {
			return await readFile(path.resolve(checkout, source), "utf8");
		} catch (error) {
			if (error?.code === "ENOENT") return null;
			throw error;
		}
	};
	const [roundsText, findingsText] = await Promise.all([
		read(roundsFile),
		read(findingsFile),
	]);
	return analyzeRecordTexts({
		roundsText,
		findingsText,
		roundsFile,
		findingsFile,
	});
}
