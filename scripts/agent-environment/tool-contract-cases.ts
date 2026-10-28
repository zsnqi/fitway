import * as fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { expect } from "vitest";
import { toolEntry } from "./tool-contract.mjs";
import {
	escapeRegExp,
	type Probe,
	repository,
	runEntry,
	runRoot,
	type ToolEntry,
} from "./tool-contract-probes";
import { TOOL_REGISTRY } from "./tool-registry.mjs";

// C4 cases the registry cannot generate: values a command finds it cannot use after the
// resolver, each printed as one `<command>: FAIL: <what> (<how to fix>)` line. `after` is the
// line another tool reads that C4 keeps after it; `processes` or `files` names an observed
// side effect the refusal needs (Git reading the clone, the evidence folder measure creates).
type StartupCase = {
	command: string;
	args: string[];
	fix: string;
	env?: Record<string, string>;
	clearPhase?: boolean;
	after?: RegExp;
	processes?: boolean;
	files?: boolean;
};

const ISO = "2026-10-17T00:00:00Z";
const fresh = (name: string) => path.join(runRoot, name);

function prepareFixtures() {
	fs.mkdirSync(fresh("not-empty"), { recursive: true });
	fs.writeFileSync(path.join(fresh("not-empty"), "old.txt"), "old evidence");
	fs.mkdirSync(fresh("launched"), { recursive: true });
	fs.writeFileSync(path.join(fresh("launched"), "session.json"), "{}");
	fs.writeFileSync(fresh("serve-spec.json"), JSON.stringify({ serve: true }));
}

const compare = ["compare", "--concept", repository, "--baseline", repository];
const measure = (out: string, ...rest: string[]) => [
	"measure",
	"--tool",
	"focus",
	"--out",
	out,
	...rest,
];

export const STARTUP_CASES: StartupCase[] = [
	{
		command: "handoff:new",
		args: ["--milestone", "NOT_VALID"],
		fix: "lowercase letters",
	},
	{
		command: "handoff:new",
		args: ["--milestone", "agent-tooling-r01", "--now", "bad-date"],
		fix: "pass --now like",
	},
	{
		command: "handoff:new",
		args: ["--milestone", "no-such-milestone", "--now", ISO],
		fix: "no-such-milestone",
		processes: true,
	},
	{
		command: "context:show",
		args: ["--milestone", "no-such-milestone"],
		fix: "no-such-milestone",
	},
	{ command: "main:advance", args: ["--dry-run", "HEAD"], fix: "hex digits" },
	{
		command: "main:advance",
		args: ["--dry-run", "deadbeefdeadbeef"],
		fix: "git fetch first",
		processes: true,
	},
	{
		command: "verify:phase",
		args: ["--phase", "not-a-phase"],
		clearPhase: true,
		fix: "pass --phase <",
		after: /^\nFAILED_VALIDATION: verify:phase requires one of: [^\n]+\n$/,
	},
	{
		command: "verify:fast",
		args: [],
		env: { FITWAY_PHASE: "1" },
		fix: "unset FITWAY_PHASE",
		after: /^\nFAILED_VALIDATION: --phase is valid only with verify:phase\n$/,
	},
	{
		command: "verify:owner",
		args: ["map", "--concept", "relative-concept", "--recipes", "package.json"],
		fix: "absolute",
	},
	...["launch", "doctor"].map((command) => ({
		command: "verify:owner",
		args: [command, "--concept", repository, "--port", "3180"],
		fix: "choose 3176 or 3177",
	})),
	{
		command: "verify:owner",
		args: [
			"compare",
			"--concept",
			repository,
			"--baseline",
			repository,
			"--port",
			"3180",
		],
		fix: "choose 3176 or 3177",
	},
	{
		command: "verify:owner",
		args: ["launch", "--concept", repository, "--out", fresh("launched")],
		fix: "fresh --out",
	},
	{
		command: "verify:owner",
		args: ["drive", "--concept", repository, "--colors", "sepia"],
		fix: "normal,forced",
	},
	{
		command: "verify:owner",
		args: [...compare, "--timeline-times", "soon"],
		fix: "pass --timeline-times like",
	},
	{
		command: "verify:owner",
		args: [...compare, "--session", path.join(repository, "package.json")],
		fix: "drop --session",
	},
	{
		command: "verify:owner",
		args: ["measure", "--tool", "focus", "--out"],
		fix: "run pnpm verify:owner measure --tool",
	},
	{
		command: "verify:owner",
		args: ["list", "--concept", repository, "--page"],
		fix: "run pnpm verify:owner list --concept",
	},
	{
		command: "verify:owner",
		args: ["launch", "--concept", repository, "--idle-timeout-ms"],
		fix: "run pnpm verify:owner launch --concept",
	},
	{
		command: "check:agent-context",
		args: ["--milestone", "nosuch-r99"],
		fix: "pass --milestone one of:",
		processes: true,
	},
	{
		command: "verify:owner",
		args: measure(fresh("not-empty")),
		fix: "new or empty folder",
	},
	{
		command: "verify:owner",
		args: measure(path.join(repository, "evidence")),
		fix: "outside every Git working tree",
	},
	{
		command: "verify:owner",
		args: measure(fresh("serve"), "--", "--serve", "x"),
		fix: "measure --out names the output",
	},
	{
		command: "verify:owner",
		args: measure(fresh("colours"), "--colors", "normal,forced"),
		fix: "--colors normal or",
	},
	{
		command: "verify:owner",
		args: measure(fresh("both"), "--colors", "normal", "--", "--forced-colors"),
		fix: "drop one",
	},
	{
		command: "verify:owner",
		args: measure(fresh("forced"), "--", "--forced-colors", "maybe"),
		fix: "none or active",
	},
	{
		command: "verify:owner",
		args: measure(fresh("spec"), "--", "--spec", fresh("serve-spec.json")),
		fix: "remove serve",
	},
	{
		command: "gardener:survey",
		// The probe's own temp root, so the checkout is outside it wherever it lives.
		args: [
			"--out",
			path.join(repository, "survey-out"),
			"--temp-root",
			runRoot,
		],
		fix: "pass --out a fresh absolute folder",
		after: /^SURVEY BLOCKED: --out must be [^\n]+\n$/,
		processes: true,
	},
];

function startupProbe(item: StartupCase) {
	return async () => {
		const entry = toolEntry(item.command) as ToolEntry;
		const result = await runEntry(entry, item.args, item.clearPhase, item.env);
		const [line, ...rest] = result.stderr.split(/(?<=\n)/);
		expect(result.status, result.stderr).toBe(1);
		expect(result.stdout).toBe("");
		expect(line).toMatch(
			new RegExp(
				`^${escapeRegExp(entry.failureName ?? entry.name)}: FAIL: [^\\r\\n]+ \\([^\\r\\n]+\\)\\r?\\n$`,
			),
		);
		expect(line).toContain(item.fix);
		if (item.after) expect(rest.join("")).toMatch(item.after);
		else expect(rest.join("")).toBe("");
		const effects = result.events.filter(
			(event) =>
				!(item.processes && event.kind === "process") &&
				!(item.files && event.kind === "file"),
		);
		expect(effects, `side effects: ${JSON.stringify(effects)}`).toEqual([]);
	};
}

export function startupProbes(): Probe[] {
	prepareFixtures();
	return STARTUP_CASES.map((item) => ({
		label: `${item.command} ${item.args.join(" ")}`,
		run: startupProbe(item),
	}));
}

// C3's other half, checked in the source: a registered command's entry module reads its
// arguments only through the shared contract. Every `process.argv` it reads, apart from
// `process.argv[1]` (am I the entry?), is `process.argv.slice(2)` passed straight to
// beginToolCommand or resolveToolArguments; and no code compares an argument with an
// option name (a string starting with `--`), the core of any private option loop or
// switch. Code that reads other tokens (a downstream tool's arguments, the words of a
// command an agent ran) lives in a module that is not a registered entry.
const DIRECT_ARGV =
	/(?:beginToolCommand|resolveToolArguments)\(\s*(?:"[^"]*"|\[[^\]]*\]|[\w.]+)\s*,\s*process\.argv\.slice\(2\)\s*[,)]/g;
const OPTION_COMPARISONS = [
	/(?:===|!==)\s*["'`]--[A-Za-z]/g,
	/["'`]--[A-Za-z][\w-]*["'`]\s*(?:===|!==)/g,
	/\bcase\s+["'`]-/g,
	/\.(?:includes|indexOf|lastIndexOf|startsWith)\(\s*["'`]--[A-Za-z]/g,
	/\[\s*["'`]--[A-Za-z][^\]]*\]\s*\.(?:includes|indexOf|some|find|findIndex)\(/g,
];

function withoutComments(text: string) {
	return text
		.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
		.replace(/^\s*\/\/.*$/gm, (line) => " ".repeat(line.length));
}

// Each entry and what it is made of: its relative imports, followed transitively, so a
// module split out of an entry is scanned as the entry is. Modules that read other tokens
// by design are not scanned: the contract itself, the parsers of a downstream tool's
// arguments (colors.mjs, measure-arguments.mjs), and the words of a Git command an agent ran.
const TOKEN_READERS = new Set([
	".agents/skills/verify-fitway/colors.mjs",
	".agents/skills/verify-fitway/measure-arguments.mjs",
	"scripts/agent-environment/git-commit-words.mjs",
	"scripts/agent-environment/tool-contract.mjs",
]);

export function entryFiles() {
	const found = new Set(
		TOOL_REGISTRY.map((entry) => entry.invocation.split(" ")[1] as string),
	);
	const queue = [...found];
	for (let file = queue.shift(); file; file = queue.shift()) {
		const text = fs.readFileSync(path.join(repository, file), "utf8");
		for (const { fileName } of ts.preProcessFile(text, true, true)
			.importedFiles) {
			if (!/^\.\.?\//.test(fileName) || !/\.(?:[cm]?js|ts)$/.test(fileName))
				continue;
			const target = path.posix.join(path.posix.dirname(file), fileName);
			if (found.has(target)) continue;
			found.add(target);
			queue.push(target);
		}
	}
	return [...found].filter((file) => !TOKEN_READERS.has(file)).sort();
}

export function argumentReadViolations(file: string, text: string) {
	const lines = text.split("\n");
	const lineAt = (index: number) => text.slice(0, index).split("\n").length;
	const code = withoutComments(text);
	const allowed = new Set<number>();
	for (const match of code.matchAll(DIRECT_ARGV))
		allowed.add((match.index ?? 0) + match[0].indexOf("process.argv"));
	const violations: string[] = [];
	for (const match of code.matchAll(/process\.argv(?!\[1\])/g))
		if (!allowed.has(match.index ?? 0))
			violations.push(
				`${file}:${lineAt(match.index ?? 0)}: process.argv read outside beginToolCommand/resolveToolArguments`,
			);
	for (const pattern of OPTION_COMPARISONS)
		for (const match of code.matchAll(pattern)) {
			const line = lineAt(match.index ?? 0);
			violations.push(
				`${file}:${line}: argument compared with an option name: ${lines[line - 1].trim()}`,
			);
		}
	return violations;
}

export function sourceScanTest() {
	const violations = entryFiles().flatMap((file) =>
		argumentReadViolations(
			file,
			fs.readFileSync(path.join(repository, file), "utf8"),
		),
	);
	expect(violations, violations.join("\n")).toEqual([]);
	// The scan itself sees both forms of a private parser.
	expect(
		argumentReadViolations(
			"planted.mjs",
			'const args = process.argv.slice(2);\nbeginToolCommand("tools", args);\nfor (const a of parsed.positionals) if (a === "--private") run();\n',
		),
	).toHaveLength(2);
}
