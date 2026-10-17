import { execFileSync, spawnSync } from "node:child_process";
import {
	chmodSync,
	mkdtempSync as createTempDirSync,
	existsSync,
	mkdirSync,
	readFileSync,
	realpathSync as realPathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repository = fileURLToPath(new URL("../../", import.meta.url));
export const launcher = path.join(
	repository,
	"scripts/agent-environment/codex-round.mjs",
);
export const realEvents = path.join(
	repository,
	"scripts/agent-environment/fixtures/report-fields/events-resume-2.jsonl",
);
export const realCommitOutput = path.join(
	repository,
	"scripts/agent-environment/fixtures/report-fields/real-commit-output.json",
);
export const environment = readFileSync(
	path.join(repository, "docs/agent-context/briefs/ENVIRONMENT.md"),
	"utf8",
);
export const measurementCommand = "node measure.mjs";
export const measurementOutput = "MEASURE PASS\n";
const roots: string[] = [];
const thread = "report-fields-thread";
const ANSI_ESCAPE = String.fromCharCode(27);
const BELL = String.fromCharCode(7);
const ANSI_CURSOR = new RegExp(`^${ANSI_ESCAPE}\\[(\\d+);(\\d+)H`);
const BEFORE_ANSI_ESCAPE = new RegExp(`^[^${ANSI_ESCAPE}]*`);
const ANSI_SEQUENCE = new RegExp(
	`${ANSI_ESCAPE}(?:\\[[0-?]*[ -/]*[@-~]|\\][^${BELL}${ANSI_ESCAPE}]*(?:${BELL}|${ANSI_ESCAPE}\\\\))`,
	"g",
);

export function afterEachReportFixture() {
	for (const root of roots.splice(0)) {
		const absolute = realPathSync.native(root);
		const relative = path.relative(realPathSync.native(tmpdir()), absolute);
		if (
			path.isAbsolute(relative) ||
			!relative.startsWith("fitway-report-fields-")
		)
			throw new Error(`Unsafe fixture cleanup: ${absolute}`);
		rmSync(absolute, { recursive: true, force: true });
	}
}

export function createFixtureTemp(prefix = "brief") {
	const root = createTempDirSync(
		path.join(tmpdir(), `fitway-report-fields-${prefix}-test-`),
	);
	roots.push(root);
	return root;
}

function git(cwd: string, ...args: string[]) {
	return execFileSync("git", args, {
		cwd,
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
		windowsHide: true,
	}).trim();
}

export function completedEvent(command: string, output: string, id = "item-1") {
	return {
		type: "item.completed",
		item: {
			id,
			type: "command_execution",
			command,
			aggregated_output: output,
			exit_code: 0,
			status: "completed",
		},
	};
}

export function commandRecord(
	command: string,
	output: string,
	id = "item-command",
	exitCode = 0,
) {
	return [
		{
			type: "item.started",
			item: {
				id,
				type: "command_execution",
				command,
				aggregated_output: "",
				exit_code: null,
				status: "in_progress",
			},
		},
		{
			type: "item.completed",
			item: {
				id,
				type: "command_execution",
				command,
				aggregated_output: output,
				exit_code: exitCode,
				status: "completed",
			},
		},
	];
}

export function fileChange(file: string, id = "item-change") {
	return {
		type: "item.completed",
		item: {
			id,
			type: "file_change",
			changes: [{ path: file, kind: "update" }],
			status: "completed",
		},
	};
}

export function eventsText(events: unknown[]) {
	return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
}

export function brief({
	delivers = "report",
	ids = ["O1"],
	scope = "Finish the fixture.",
} = {}) {
	return `<!-- brief-format: v1 role: codex delivers: ${delivers} -->
# Fixture brief

## Goal

Exercise report fields.

## Scope

${scope} If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Causes and required outcomes

${ids.map((id) => `- **${id}.** Fixture outcome.`).join("\n")}

## Report

Fixture report.
`;
}

export function reportBlock(rows: unknown[], commits: string[] = []) {
	return [
		"```report",
		...commits.map((commit) => JSON.stringify({ commit })),
		...rows.map((row) => JSON.stringify(row)),
		"```",
	].join("\n");
}

export function reportMessage(rows: unknown[], commits: string[] = []) {
	return `${reportBlock(rows, commits)}\n`;
}

export function row(
	id: string,
	command: string,
	output: string,
	status = "PASS",
) {
	return { id, status, command, output };
}

export function normalizedOutputLines(output: string) {
	const logical: string[] = [];
	for (let segment of output.split(/\r?\n/)) {
		const cursor = segment.match(ANSI_CURSOR);
		if (cursor && Number(cursor[2]) > 1 && logical.length) {
			segment = segment.slice(cursor[0].length);
			const lead = segment.match(BEFORE_ANSI_ESCAPE)?.[0] ?? "";
			let overlap = 0;
			for (let size = Math.min(8, lead.length); size > 0; size -= 1)
				if (logical.at(-1)?.endsWith(lead.slice(0, size))) {
					overlap = size;
					break;
				}
			const current = logical.pop() ?? "";
			logical.push(
				`${overlap ? current.slice(0, -overlap) : current}${segment}`,
			);
		} else logical.push(segment);
	}
	return logical
		.map((line) => line.replace(ANSI_SEQUENCE, "").trim())
		.filter(Boolean);
}

export function unwrapCommand(command: string) {
	for (const pattern of [
		/^(?:"[^"]*powershell(?:\.exe)?"|powershell(?:\.exe)?)(?:\s+-[^\s]+)*\s+-Command\s+(['"])([\s\S]*)\1$/i,
		/^(?:"[^"]*bash(?:\.exe)?"|bash(?:\.exe)?)(?:\s+-[^\s]+)*\s+-lc\s+(['"])([\s\S]*)\1$/i,
	]) {
		const match = command.match(pattern);
		if (match) return match[2].trim();
	}
	return command.trim();
}

export function oneCharacterDifferent(value: string) {
	let index = Math.floor(value.length / 2);
	while (
		index < value.length &&
		(/[\s\r\n]/.test(value[index]) || value[index] === "\ufeff")
	)
		index += 1;
	const replacement = value[index] === "x" ? "y" : "x";
	return `${value.slice(0, index)}${replacement}${value.slice(index + 1)}`;
}

export function reportEventCases() {
	const resumeLines = readFileSync(realEvents, "utf8").split(/\r?\n/);
	const singleQuote = JSON.parse(resumeLines[31]).item;
	const doubleQuote = JSON.parse(resumeLines[150]).item;
	const widest = JSON.parse(resumeLines[227]).item;
	const ansi = JSON.parse(readFileSync(realCommitOutput, "utf8"));
	const bashCommand =
		'printf "%s\\n" "\\u0645\\u0631\\u062d\\u0628\\u0627 \\u00ab\\u2026\\u00bb"';
	const bashWrapper = `bash -lc '${bashCommand}'`;
	const bashOutput = "\u0645\u0631\u062d\u0628\u0627 \u00ab\u2026\u00bb\n";
	return [
		{
			name: "a PowerShell single-quote command and a console-wrapped line",
			event: completedEvent(singleQuote.command, singleQuote.aggregated_output),
			command: unwrapCommand(singleQuote.command),
			output:
				"COMPARE NOT-REACHABLE: access.html/language default en phone mouse reduce http normal; State/feature cannot be reached: Feature path unavailable at 390 CSS pixels by its recipe; State/feature cannot be reached: Feature path unavailable at 390 CSS pixels by its recipe",
		},
		{
			name: "a PowerShell double-quote command",
			event: completedEvent(doubleQuote.command, doubleQuote.aggregated_output),
			command: unwrapCommand(doubleQuote.command),
			output: '832:          "changesState": true',
		},
		{
			name: "a multi-line command and the widest recorded output",
			event: completedEvent(widest.command, widest.aggregated_output),
			command: unwrapCommand(widest.command),
			output: normalizedOutputLines(widest.aggregated_output)[0],
			wide: true,
		},
		{
			name: "a Bash-wrapped command with non-ASCII text",
			event: completedEvent(bashWrapper, bashOutput),
			command: bashCommand,
			output: bashOutput.trim(),
		},
		{
			name: "terminal escape sequences",
			event: completedEvent('git commit -m "Ratchet"', ansi.output),
			command: 'git commit -m "Ratchet"',
			output:
				"[tooling-ratchet 7c28d15a6502173761195facafc20d2d5bf1b180] Ratchet",
		},
	];
}

function createWorktree(root: string) {
	const worktree = path.join(root, "worktree");
	mkdirSync(worktree);
	git(worktree, "init", "--initial-branch=fixture");
	git(worktree, "config", "user.name", "Report Fields Fixture");
	git(worktree, "config", "user.email", "report-fields@example.invalid");
	git(worktree, "config", "commit.gpgsign", "false");
	writeFileSync(path.join(worktree, "file.txt"), "base\n");
	git(worktree, "add", ".");
	git(worktree, "commit", "-m", "fixture base");
	return { worktree, head: git(worktree, "rev-parse", "HEAD") };
}

function writeRun(run: string, worktree: string, head: string, input: string) {
	mkdirSync(run);
	writeFileSync(
		path.join(run, "run.json"),
		`${JSON.stringify(
			{ version: 1, worktree, head, level: "high", model: "gpt-6.1-sol" },
			null,
			2,
		)}\n`,
	);
	writeFileSync(path.join(run, "input.md"), input);
	writeFileSync(
		path.join(run, "events.jsonl"),
		`${JSON.stringify({ type: "thread.started", thread_id: thread })}\n`,
	);
}

function createStandin(bin: string) {
	mkdirSync(bin);
	const standin = path.join(bin, "stand-in.cjs");
	writeFileSync(
		standin,
		`const fs = require("node:fs");
const args = process.argv.slice(2);
const chunks = [];
process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  const sequence = JSON.parse(fs.readFileSync(process.env.FIXTURE_SEQUENCE, "utf8"));
  let index = 0;
  try { index = Number(fs.readFileSync(process.env.FIXTURE_COUNTER, "utf8")) || 0; } catch {}
  const turn = sequence[index];
  if (!turn) throw new Error("fixture sequence exhausted");
  fs.writeFileSync(args[args.indexOf("-o") + 1], fs.readFileSync(turn.message, "utf8"));
  fs.writeFileSync(process.env.FIXTURE_INPUT, Buffer.concat(chunks));
  if (turn.events) process.stdout.write(fs.readFileSync(turn.events, "utf8"));
  fs.writeFileSync(process.env.FIXTURE_COUNTER, String(index + 1));
});
`,
	);
	if (process.platform === "win32")
		writeFileSync(
			path.join(bin, "codex.cmd"),
			`@"${process.execPath}" "%~dp0stand-in.cjs" %*\r\n`,
		);
	else {
		const codex = path.join(bin, "codex");
		writeFileSync(
			codex,
			`#!/bin/sh\nexec '${process.execPath.replaceAll("'", "'\\''")}' '${standin.replaceAll("'", "'\\''")}' "$@"\n`,
		);
		chmodSync(codex, 0o755);
	}
}

export function harness({
	delivers = "report",
	ids = ["O1"],
	scope = "Finish the fixture.",
	input,
	headOverride,
}: {
	delivers?: string;
	ids?: string[];
	scope?: string;
	input?: string;
	headOverride?: string;
} = {}) {
	const root = createFixtureTemp();
	const worktreeFixture = createWorktree(root);
	const head = headOverride ?? worktreeFixture.head;
	const run = path.join(root, "run");
	writeRun(
		run,
		worktreeFixture.worktree,
		head,
		input ?? brief({ delivers, ids, scope }),
	);
	const bin = path.join(root, "bin");
	createStandin(bin);
	const sequence = path.join(root, "sequence.json");
	const counter = path.join(root, "counter.txt");
	const fixtureInput = path.join(root, "fixture-input.md");
	const setTurns = (turns: { message: string; events?: string }[]) => {
		rmSync(counter, { force: true });
		const records = turns.map((turn, index) => {
			const message = path.join(root, `message-${index}.md`);
			const events = path.join(root, `events-${index}.jsonl`);
			writeFileSync(message, turn.message);
			writeFileSync(events, turn.events ?? "");
			return { message, events };
		});
		writeFileSync(sequence, JSON.stringify(records));
	};
	const invoke = () => {
		const result = spawnSync(process.execPath, [launcher, "resume", run], {
			cwd: root,
			env: {
				...process.env,
				PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
				CODEX_HOME: path.join(root, "codex-home"),
				FIXTURE_SEQUENCE: sequence,
				FIXTURE_COUNTER: counter,
				FIXTURE_INPUT: fixtureInput,
			},
			encoding: "utf8",
			windowsHide: true,
		});
		return { ...result, output: `${result.stdout}${result.stderr}` };
	};
	return {
		root,
		worktree: worktreeFixture.worktree,
		run,
		head,
		setTurns,
		invoke,
		counter,
		sequence,
		fixtureInput,
	};
}

export function jsonLines(file: string) {
	if (!existsSync(file)) return [];
	return readFileSync(file, "utf8")
		.split(/\r?\n/)
		.filter(Boolean)
		.map((line) => JSON.parse(line));
}

export function reportChecks(f: ReturnType<typeof harness>) {
	return jsonLines(path.join(f.run, "report-checks.jsonl"));
}

export function autoResumes(f: ReturnType<typeof harness>) {
	return jsonLines(path.join(f.run, "auto-resumes.log"));
}

export function commitChange(f: ReturnType<typeof harness>) {
	writeFileSync(path.join(f.worktree, "file.txt"), `changed ${Date.now()}\n`);
	git(f.worktree, "add", ".");
	git(f.worktree, "commit", "-m", "fixture change");
	const head = git(f.worktree, "rev-parse", "HEAD");
	return {
		head,
		event: commandRecord(
			'git commit -m "fixture change"',
			`[fixture ${head.slice(0, 7)}] fixture change\n`,
			"item-commit",
		),
	};
}

export function measurementTurn(
	commit: ReturnType<typeof commitChange>,
	trailing: unknown[],
) {
	return {
		message: reportMessage(
			[row("O1", measurementCommand, measurementOutput.trim())],
			[commit.head.slice(0, 7)],
		),
		events: eventsText([
			...commandRecord(measurementCommand, measurementOutput, "item-measure"),
			...trailing,
			...commit.event,
		]),
	};
}

export function checkBriefFixture(format: string) {
	const head = git(repository, "rev-parse", "HEAD");
	const branch = git(repository, "branch", "--show-current");
	return `${format}
# Fixture brief

- **Worktree:** \`${repository.replaceAll("\\", "/")}\`, branch \`${branch}\`, HEAD \`${head.slice(0, 8)}\`

${environment}
## Goal

Check the fixture.

## Scope

Write only in the fixture. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.

## Causes and required outcomes

- **X1.** Fixture outcome.

## Limits the result keeps

- **L1.** Fixture limit.

## Report

Fixture report.
`;
}
