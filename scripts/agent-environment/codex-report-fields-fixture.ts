import { execFileSync } from "node:child_process";
import {
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
import { runLauncher, writeCodexStandin } from "./codex-standin-fixture.mjs";

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

// Each command below is the recorded wrapper's inner command with its quoting removed, and each
// output a line as the console displayed it: both copied once by hand from the fixed fixture, so
// no expectation is computed by a copy of the launcher's own reading.
const compareCommand = String.raw`$env:PROBE_OUT='D:\fitway-temp\owner-r04-shared-lows\probe'; $env:NODE_OPTIONS='--max-old-space-size=6144'; node D:\Projects\fitway-worktrees\owner-design-exploration-r04\.agents\skills\verify-fitway\cli.mjs compare --concept D:\Projects\fitway-worktrees\owner-r04-shared-lows\design-research\owner-composition-exploration-r04\directions\eclipse --baseline D:\fitway-temp\owner-r04-shared-lows\bases-9619f3ce\design-research\owner-composition-exploration-r04\directions\eclipse --recipes D:\Projects\fitway-worktrees\owner-r04-shared-lows\design-research\owner-composition-exploration-r04\directions\eclipse\verification-recipes.json --baseline-recipes D:\fitway-temp\owner-r04-shared-lows\bases-9619f3ce\design-research\owner-composition-exploration-r04\directions\eclipse\verification-recipes.json`;

function recordedItem(lines: string[], line: number) {
	return JSON.parse(lines[line - 1]).item;
}

// The wrapper's quoted body as recorded, by plain text search: what the launcher matched before
// it removed the wrapper's quoting, and must no longer match.
function rawBody(recorded: string) {
	return recorded.slice(
		recorded.indexOf(" -Command ") + " -Command ".length + 1,
		-1,
	);
}

export function reportEventCases() {
	const resumeLines = readFileSync(realEvents, "utf8").split(/\r?\n/);
	const singleQuote = recordedItem(resumeLines, 32);
	const doubleQuote = recordedItem(resumeLines, 151);
	const widest = recordedItem(resumeLines, 228);
	const doubleQuoteEscapes = recordedItem(resumeLines, 150);
	const singleQuoteJoins = recordedItem(resumeLines, 160);
	const ansi = JSON.parse(readFileSync(realCommitOutput, "utf8"));
	const bashCommand =
		'printf "%s\\n" "\\u0645\\u0631\\u062d\\u0628\\u0627 \\u00ab\\u2026\\u00bb"';
	const bashWrapper = `bash -lc '${bashCommand}'`;
	const bashOutput = "\u0645\u0631\u062d\u0628\u0627 \u00ab\u2026\u00bb\n";
	return [
		{
			name: "a PowerShell single-quote command and a console-wrapped line",
			event: completedEvent(singleQuote.command, singleQuote.aggregated_output),
			command: `${compareCommand} --page all --feature all --languages en --sizes desktop,phone --inputs mouse --motions reduce --transports http --colors normal --workers 4 --out ${String.raw`D:\fitway-temp\owner-r04-shared-lows\compare-9619-en-normal`}`,
			output:
				"COMPARE NOT-REACHABLE: access.html/language default en phone mouse reduce http normal; State/feature cannot be reached: Feature path unavailable at 390 CSS pixels by its recipe; State/feature cannot be reached: Feature path unavailable at 390 CSS pixels by its recipe",
		},
		{
			name: "a PowerShell double-quote command",
			event: completedEvent(doubleQuote.command, doubleQuote.aggregated_output),
			command: `rg -n '"ends"|"changesState"' design-research/owner-composition-exploration-r04/directions/eclipse/verification-recipes.json`,
			output: '832:          "changesState": true',
		},
		{
			name: "a multi-line command and the widest recorded output",
			event: completedEvent(widest.command, widest.aggregated_output),
			command: `${compareCommand} --page access.html --feature pinOff,reset,off,mine,validate-reset,validate-mine,page-retry,password-refused,refused-owner_email_taken --languages ar,en --sizes desktop,phone --inputs mouse --motions full --transports http --colors normal,forced --timeline --workers 4 --out ${String.raw`D:\fitway-temp\owner-r04-shared-lows\timeline-access-9619`}`,
			output:
				"COMPARE EQUAL: access.html/pinOff default ar desktop mouse full http normal",
			wide: true,
		},
		{
			name: "record 150, a double-quoted wrapper with escaped quotes and backslashes",
			event: completedEvent(
				doubleQuoteEscapes.command,
				doubleQuoteEscapes.aggregated_output,
			),
			command: String.raw`rg -n "\.ac-log|\.ac-msg|focus-ring:" design-research/owner-composition-exploration-r04/directions/eclipse --glob "*.css"`,
			output:
				'106:  /* focus-ring: html[data-focus-input="keyboard"] .rail-item:focus > .tile */',
			raw: rawBody(doubleQuoteEscapes.command),
		},
		{
			name: "record 160, a single-quoted wrapper joined with double-quoted parts",
			event: completedEvent(
				singleQuoteJoins.command,
				singleQuoteJoins.aggregated_output,
			),
			command: String.raw`$n=0; Get-Content -LiteralPath 'D:\Projects\fitway-worktrees\owner-r04-shared-lows\design-research\owner-composition-exploration-r04\directions\eclipse\verification-recipes.json' | ForEach-Object { $n++; if ($n -ge 815 -and $n -le 840) { '{0,4}: {1}' -f $n, $_ } }`,
			output: '816:           "actions": [',
			raw: rawBody(singleQuoteJoins.command),
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

export function harness({
	delivers = "report",
	ids = ["O1"],
	scope = "Finish the fixture.",
	input,
}: {
	delivers?: string;
	ids?: string[];
	scope?: string;
	input?: string;
} = {}) {
	const root = createFixtureTemp();
	const { worktree, head } = createWorktree(root);
	const run = path.join(root, "run");
	writeRun(run, worktree, head, input ?? brief({ delivers, ids, scope }));
	const bin = path.join(root, "bin");
	writeCodexStandin(bin, thread);
	const replay = path.join(root, "replay.json");
	// The runner's turn counter: it holds the number of turns the stand-in has started.
	const counter = path.join(root, "sequence.txt");
	const capture = path.join(root, "capture.json");
	const setTurns = (turns: { message: string; events?: string }[]) => {
		rmSync(counter, { force: true });
		const records = turns.map((turn, index) => {
			const message = path.join(root, `message-${index}.md`);
			const events = path.join(root, `events-${index}.jsonl`);
			writeFileSync(message, turn.message);
			writeFileSync(events, turn.events ?? "");
			return { message, events };
		});
		writeFileSync(replay, JSON.stringify(records));
	};
	const invoke = () =>
		runLauncher(launcher, ["resume", run], {
			cwd: root,
			env: {
				...process.env,
				PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
				CODEX_HOME: path.join(root, "codex-home"),
				ROUND_CAPTURE: capture,
				ROUND_REPLAY: replay,
				ROUND_SEQUENCE_FILE: counter,
			},
		});
	// The input the stand-in received on its last turn.
	const lastInput = () =>
		Buffer.from(
			JSON.parse(readFileSync(capture, "utf8")).input,
			"base64",
		).toString("utf8");
	return { root, worktree, run, head, setTurns, invoke, counter, lastInput };
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
