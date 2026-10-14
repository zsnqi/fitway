// Start load per session and per subagent role, from Claude Code transcripts (DECISIONS item 21).
// context(message) = input + cache_creation + cache_read tokens of an assistant message.
// first = context of the first assistant message (harness and prompt, before any tool output).
// work  = context at the first Edit/Write/Agent/Task call, or at the first turn's end; for a verifier it is the report.
// reads = tool calls before work.
import { readdirSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { samePath } from "./path-identity.mjs";

const WORK_TOOLS = new Set(["Edit", "Write", "Agent", "Task", "NotebookEdit"]);
export const BASELINE_FILE = fileURLToPath(
	new URL("./start-load-baseline.json", import.meta.url),
);

export function contextTokens(usage) {
	return (
		(usage.input_tokens ?? 0) +
		(usage.cache_creation_input_tokens ?? 0) +
		(usage.cache_read_input_tokens ?? 0)
	);
}

function entries(text) {
	const parsed = [];
	for (const line of text.split("\n")) {
		if (!line.trim()) continue;
		try {
			parsed.push(JSON.parse(line));
		} catch {}
	}
	return parsed;
}

function promptText(content) {
	if (typeof content === "string") return content;
	if (Array.isArray(content))
		return content.find((part) => part.type === "text")?.text ?? "";
	return "";
}

export function scanTranscript(text) {
	let first = null;
	let work = null;
	let turnEnd = null;
	let reads = 0;
	let peak = 0;
	let prompt = "";
	for (const entry of entries(text)) {
		if (entry.type === "user" && !prompt) {
			const value = promptText(entry.message?.content);
			if (value && !value.startsWith("<"))
				prompt = value.replace(/\s+/g, " ").slice(0, 50);
		}
		if (entry.type !== "assistant" || !entry.message?.usage) continue;
		const context = contextTokens(entry.message.usage);
		// Synthetic assistant messages carry zero usage; they are not a model call.
		if (context === 0) continue;
		first ??= context;
		peak = Math.max(peak, context);
		if (work !== null) continue;
		const tools = (entry.message.content ?? [])
			.filter((part) => part.type === "tool_use")
			.map((part) => part.name);
		if (tools.some((tool) => WORK_TOOLS.has(tool))) work = context;
		else reads += tools.length;
		if (
			turnEnd === null &&
			tools.length === 0 &&
			entry.message.stop_reason === "end_turn"
		)
			turnEnd = context;
	}
	return { first, work: work ?? turnEnd, reads, peak, prompt };
}

// What a transcript read before its first work call, with chars/4 as the token estimate (Arabic undercounts).
export function startReads(text) {
	const calls = new Map();
	const rows = [];
	for (const entry of entries(text)) {
		const content = entry.message?.content;
		if (!Array.isArray(content)) continue;
		for (const part of content) {
			if (entry.type === "assistant" && part.type === "tool_use") {
				if (WORK_TOOLS.has(part.name)) return rows;
				const input = part.input ?? {};
				const target =
					input.file_path ??
					input.path ??
					input.pattern ??
					input.command ??
					input.query ??
					input.skill ??
					JSON.stringify(input);
				calls.set(part.id, {
					tool: part.name,
					target: String(target).replace(/\s+/g, " ").slice(0, 110),
				});
			}
			if (
				entry.type === "user" &&
				part.type === "tool_result" &&
				calls.has(part.tool_use_id)
			) {
				const result = part.content;
				const value =
					typeof result === "string"
						? result
						: Array.isArray(result)
							? result.map((item) => item.text ?? "").join("")
							: "";
				rows.push({
					...calls.get(part.tool_use_id),
					tokens: Math.round(value.length / 4),
				});
			}
		}
	}
	return rows;
}

// The upper median, as the 2026-10-08 baseline was computed.
export function median(values) {
	const sorted = values.filter((value) => value != null).sort((a, b) => a - b);
	return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
}

// Claude Code keeps a project's transcripts under <config>/projects/<cwd with every non-alphanumeric as "-">.
export function transcriptRoot(
	cwd = process.cwd(),
	configDir = process.env.CLAUDE_CONFIG_DIR ??
		path.join(os.homedir(), ".claude"),
) {
	return path.join(configDir, "projects", cwd.replace(/[^A-Za-z0-9]/g, "-"));
}

function summarize(scans) {
	return {
		n: scans.length,
		first: median(scans.map((scan) => scan.first)),
		work: median(scans.map((scan) => scan.work)),
		reads: median(scans.map((scan) => scan.reads)),
		peak: median(scans.map((scan) => scan.peak)),
	};
}

function agentType(metaFile) {
	try {
		return JSON.parse(readFileSync(metaFile, "utf8")).agentType ?? "unknown";
	} catch {
		return "unknown";
	}
}

export function measureStartLoad({ root, limit = 25, since = null }) {
	const after = since ? Date.parse(since) : Number.NEGATIVE_INFINITY;
	const sessions = readdirSync(root)
		.filter((file) => file.endsWith(".jsonl"))
		.map((file) => ({ file, time: statSync(path.join(root, file)).mtimeMs }))
		.filter((session) => session.time >= after)
		.sort((a, b) => b.time - a.time)
		.slice(0, limit)
		.map(({ file, time }) => ({
			id: file.slice(0, 8),
			date: new Date(time).toISOString().slice(0, 10),
			directory: path.join(root, file.replace(/\.jsonl$/, "")),
			...scanTranscript(readFileSync(path.join(root, file), "utf8")),
		}));
	const byRole = {};
	for (const session of sessions) {
		const subagents = path.join(session.directory, "subagents");
		let files = [];
		try {
			files = readdirSync(subagents).filter((file) => file.endsWith(".jsonl"));
		} catch {
			continue;
		}
		for (const file of files) {
			const transcript = path.join(subagents, file);
			if (statSync(transcript).mtimeMs < after) continue;
			const role = agentType(transcript.replace(/\.jsonl$/, ".meta.json"));
			byRole[role] ??= [];
			byRole[role].push(scanTranscript(readFileSync(transcript, "utf8")));
		}
	}
	const measured = sessions.filter((session) => session.first !== null);
	return {
		root,
		since,
		sessions: sessions.map(({ directory, ...session }) => session),
		coordinator: summarize(measured),
		roles: Object.fromEntries(
			Object.entries(byRole)
				.sort((a, b) => b[1].length - a[1].length)
				.map(([role, scans]) => [role, summarize(scans)]),
		),
	};
}

const k = (tokens) => (tokens == null ? "-" : `${Math.round(tokens / 1000)}K`);
const kBase = (value) => (value == null ? "-" : `${value}K`);

export function formatReport(result, baseline) {
	const lines = [
		`Start load from ${result.root}${result.since ? ` since ${result.since}` : ""}`,
		"session  date        first  work  reads  peak  prompt",
	];
	for (const s of result.sessions)
		lines.push(
			`${s.id} ${s.date}  ${k(s.first).padStart(5)} ${k(s.work).padStart(5)} ${String(s.reads).padStart(5)} ${k(s.peak).padStart(5)}  ${s.prompt}`,
		);
	const base = baseline ? ` | baseline ${baseline.measured}: first work` : "";
	lines.push(
		"",
		`role                            n  first  work reads  peak${base}`,
	);
	const row = (role, value, previous) =>
		`${role.padEnd(30)} ${String(value.n).padStart(3)} ${k(value.first).padStart(6)} ${k(value.work).padStart(5)} ${String(value.reads ?? "-").padStart(5)} ${k(value.peak).padStart(5)}${
			previous
				? ` | ${kBase(previous.firstK).padStart(5)} ${kBase(previous.workK).padStart(5)}`
				: ""
		}`;
	// A definition renamed since the baseline keeps its old transcripts' name in measuredAs.
	const baselineFor = (role) =>
		baseline?.roles?.[role] ??
		Object.values(baseline?.roles ?? {}).find(
			(entry) => entry.measuredAs === role,
		);
	lines.push(row("coordinator", result.coordinator, baseline?.coordinator));
	for (const [role, value] of Object.entries(result.roles))
		lines.push(row(role, value, baselineFor(role)));
	return lines.join("\n");
}

function formatReads(rows) {
	const total = rows.reduce((sum, row) => sum + row.tokens, 0);
	return [
		...rows.map(
			(row) =>
				`${String(row.tokens).padStart(6)}  ${row.tool.padEnd(11)} ${row.target}`,
		),
		`${String(total).padStart(6)}  total (chars/4; Arabic undercounts)`,
	].join("\n");
}

const USAGE =
	"Usage: node scripts/agent-environment/start-load.mjs [--root <transcripts dir>] [--limit <sessions, default 25>] [--since <YYYY-MM-DD>] [--json] | --reads <transcript.jsonl>";

if (
	process.argv[1] &&
	(await samePath(fileURLToPath(import.meta.url), process.argv[1]))
) {
	try {
		const { values } = parseArgs({
			options: {
				root: { type: "string" },
				limit: { type: "string" },
				since: { type: "string" },
				reads: { type: "string" },
				json: { type: "boolean" },
				help: { type: "boolean" },
			},
		});
		if (values.help) console.log(USAGE);
		else if (values.reads)
			console.log(formatReads(startReads(readFileSync(values.reads, "utf8"))));
		else {
			const limit = Number(values.limit ?? 25);
			if (!Number.isInteger(limit) || limit < 1)
				throw new Error(`--limit must be a positive integer: ${values.limit}`);
			if (values.since && Number.isNaN(Date.parse(values.since)))
				throw new Error(`--since is not a date: ${values.since}`);
			const result = measureStartLoad({
				root: values.root ?? transcriptRoot(),
				limit,
				since: values.since ?? null,
			});
			const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));
			console.log(
				values.json
					? JSON.stringify(result, null, 2)
					: formatReport(result, baseline),
			);
		}
	} catch (error) {
		console.error(
			`start-load FAILED: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exitCode = 1;
	}
}
