import {
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	utimesSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	BASELINE_FILE,
	formatReport,
	measureStartLoad,
	median,
	scanTranscript,
	startReads,
	transcriptRoot,
} from "./start-load.mjs";

const roots: string[] = [];

afterEach(() => {
	for (const root of roots.splice(0))
		rmSync(root, { recursive: true, force: true });
});

const usage = (context: number) => ({
	input_tokens: 10,
	cache_creation_input_tokens: context - 1010,
	cache_read_input_tokens: 1000,
});
const user = (content: unknown) => ({ type: "user", message: { content } });
const assistant = (
	context: number,
	tools: string[] = [],
	stop: string | null = null,
) => ({
	type: "assistant",
	message: {
		usage: usage(context),
		stop_reason: stop,
		content: tools.map((name, index) => ({
			type: "tool_use",
			id: `${name}-${context}-${index}`,
			name,
			input: { file_path: `D:/repo/${name}.md` },
		})),
	},
});
const jsonl = (rows: unknown[]) =>
	`${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;

describe("scanTranscript", () => {
	it("takes first, the context at the first work tool, the reads before it and the peak", () => {
		const scan = scanTranscript(
			jsonl([
				user("<system-reminder>ignored</system-reminder>"),
				user("كمل   the   work"),
				assistant(68_000, ["Read", "Grep"]),
				assistant(90_000, ["Read"]),
				assistant(120_000, ["Edit"]),
				assistant(300_000, ["Read"]),
			]),
		);
		expect(scan).toEqual({
			first: 68_000,
			work: 120_000,
			reads: 3,
			peak: 300_000,
			prompt: "كمل the work",
		});
	});

	it("falls back to the first turn's end, and skips zero-usage and malformed lines", () => {
		const synthetic = {
			type: "assistant",
			message: { usage: { input_tokens: 0 }, content: [] },
		};
		const scan = scanTranscript(
			`not json\n${jsonl([
				user([{ type: "text", text: "review this" }]),
				synthetic,
				assistant(50_000, ["Read"]),
				assistant(70_000, [], "end_turn"),
				assistant(95_000, ["Write"]),
			])}`,
		);
		expect(scan.first).toBe(50_000);
		expect(scan.work).toBe(95_000);
		expect(scan.reads).toBe(1);

		const report = scanTranscript(
			jsonl([assistant(40_000, ["Read"]), assistant(60_000, [], "end_turn")]),
		);
		expect(report.work).toBe(60_000);
	});
});

describe("startReads", () => {
	it("lists each tool result before the first work call with a chars/4 estimate", () => {
		const rows = startReads(
			jsonl([
				assistant(10_000, ["Read"]),
				{
					type: "user",
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "Read-10000-0",
								content: "x".repeat(400),
							},
						],
					},
				},
				assistant(11_000, ["Edit", "Read"]),
				{
					type: "user",
					message: {
						content: [
							{
								type: "tool_result",
								tool_use_id: "Read-11000-1",
								content: "y",
							},
						],
					},
				},
			]),
		);
		expect(rows).toEqual([
			{ tool: "Read", target: "D:/repo/Read.md", tokens: 100 },
		]);
	});
});

describe("measureStartLoad", () => {
	function transcripts() {
		const root = mkdtempSync(path.join(tmpdir(), "fitway-start-load-test-"));
		roots.push(root);
		const write = (file: string, text: string, date: string) => {
			const absolute = path.join(root, file);
			mkdirSync(path.dirname(absolute), { recursive: true });
			writeFileSync(absolute, text);
			const time = new Date(date);
			utimesSync(absolute, time, time);
		};
		write(
			"aaaaaaaa-old.jsonl",
			jsonl([user("old"), assistant(70_000, ["Edit"])]),
			"2026-10-01T10:00:00Z",
		);
		write(
			"bbbbbbbb-new.jsonl",
			jsonl([
				user("new"),
				assistant(30_000, ["Read"]),
				assistant(40_000, ["Agent"]),
			]),
			"2026-10-09T10:00:00Z",
		);
		write(
			"bbbbbbbb-new/subagents/agent-1.jsonl",
			jsonl([assistant(20_000, ["Read"]), assistant(25_000, ["Write"])]),
			"2026-10-09T10:05:00Z",
		);
		write(
			"bbbbbbbb-new/subagents/agent-1.meta.json",
			JSON.stringify({ agentType: "owner-direction-builder" }),
			"2026-10-09T10:05:00Z",
		);
		write(
			"bbbbbbbb-new/subagents/agent-2.jsonl",
			jsonl([assistant(22_000, ["Edit"])]),
			"2026-10-08T09:00:00Z",
		);
		return root;
	}

	it("measures the most recent sessions and groups subagents by their definition", () => {
		const result = measureStartLoad({ root: transcripts() });
		expect(result.sessions.map((session) => session.id)).toEqual([
			"bbbbbbbb",
			"aaaaaaaa",
		]);
		expect(result.coordinator).toEqual({
			n: 2,
			first: 70_000,
			work: 70_000,
			reads: 1,
			peak: 70_000,
		});
		expect(result.roles["owner-direction-builder"]).toMatchObject({
			n: 1,
			first: 20_000,
			work: 25_000,
		});
		expect(result.roles.unknown).toMatchObject({ n: 1, first: 22_000 });
	});

	it("limits sessions and drops transcripts older than --since", () => {
		const root = transcripts();
		expect(measureStartLoad({ root, limit: 1 }).sessions).toHaveLength(1);
		const recent = measureStartLoad({ root, since: "2026-10-09" });
		expect(recent.sessions.map((session) => session.id)).toEqual(["bbbbbbbb"]);
		expect(Object.keys(recent.roles)).toEqual(["owner-direction-builder"]);
	});

	it("prints the committed baseline beside a role it measured", () => {
		const baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8"));
		const report = formatReport(
			measureStartLoad({ root: transcripts() }),
			baseline,
		);
		expect(report).toContain("baseline 2026-10-08: first work");
		expect(report).toMatch(
			/owner-direction-builder\s+1\s+20K\s+25K.*\|\s+56K\s+178K/,
		);
		expect(report).toMatch(/coordinator\s+2\s+70K.*\|\s+71K\s+119K/);

		const role = {
			n: 1,
			first: 55_000,
			work: 148_000,
			reads: 24,
			peak: 276_000,
		};
		const renamed = formatReport(
			{
				root: "transcripts",
				since: null,
				sessions: [],
				coordinator: { ...role, n: 0 },
				roles: {
					"owner-direction-verifier-high": role,
					"owner-direction-verifier": role,
				},
			},
			baseline,
		);
		expect(renamed).toMatch(/verifier-high\s.*\|\s+55K\s+148K/);
		expect(renamed).toMatch(/verifier\s.*\|\s+55K\s+148K/);
	});
});

describe("helpers", () => {
	it("uses the upper median, as the baseline did", () => {
		expect(median([4, 1, 3, 2])).toBe(3);
		expect(median([null, 5])).toBe(5);
		expect(median([])).toBeNull();
	});

	it("names the transcript folder the way Claude Code does", () => {
		expect(
			transcriptRoot(
				"D:\\Projects\\fitway-worktrees\\owner-design-exploration-r04",
				"C:/config",
			),
		).toBe(
			path.join(
				"C:/config",
				"projects",
				"D--Projects-fitway-worktrees-owner-design-exploration-r04",
			),
		);
	});
});
