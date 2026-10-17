import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { removeWorktreeOptions } from "../../.agents/skills/gardener/remove-worktree.mjs";
import { parseOptions as surveyOptions } from "../../.agents/skills/gardener/survey.mjs";
import { ownerCommandOptions } from "../../.agents/skills/verify-fitway/cli.mjs";
import { agentContextOptions } from "../check-agent-context-options.mjs";
import { conceptCssArguments } from "../check-concept-css.mjs";
import { contextShowMilestone } from "../show-agent-context.mjs";
import { verificationOptions } from "../verify.mjs";
import { repositoryOptions } from "../verify-repository-options.mjs";
import { advanceOptions } from "./advance-main.mjs";
import { parseBriefArgs } from "./check-brief.mjs";
import { codeHealthOptions } from "./check-code-health.mjs";
import { codexOptions } from "./codex-round.mjs";
import { toolingMapOptions } from "./generate-tooling-map.mjs";
import { parseHandoffArgs } from "./new-handoff.mjs";
import { startLoadOptions } from "./start-load.mjs";
import { resolveToolArguments } from "./tool-contract.mjs";
import { TOOL_REGISTRY } from "./tool-registry.mjs";

// E1: the argument forms each command's parser accepted at 57dad1c0, with the options its
// logic received, are a fixed table (tool-compatibility.json). Each row runs through the shared
// resolver and the command's own argument step, so a form the registry or a step loses fails here
// by name, whatever the registry now declares.

type Parsed = ReturnType<typeof resolveToolArguments>;
type Row = {
	args: string[];
	env?: Record<string, string | null>;
	expect: unknown;
};
type Refusal = {
	command: string;
	args: string[];
	env?: Record<string, string | null>;
	reason: string;
};
type Table = {
	commandsWithoutRows: Record<string, string>;
	rows: Record<string, Row[]>;
	intentionalRefusals: Refusal[];
};
type BaseForm = [form: string, args: string[], env?: Record<string, null>];

const repository = fileURLToPath(new URL("../../", import.meta.url));
const table: Table = JSON.parse(
	fs.readFileSync(
		new URL("./tool-compatibility.json", import.meta.url),
		"utf8",
	),
);
const REPOSITORY_TOKEN = "<repo>";
const DEFAULT_RUN_TOKEN = "<default-run>";

// Commands that take no arguments have no step of their own: their logic reads nothing from the
// resolver's result, so their rows check that result directly.
const takesNothing = (parsed: Parsed) => ({
	options: parsed.options,
	positionals: parsed.positionals,
});

const steps: Record<string, (parsed: Parsed) => unknown> = {
	"check:repository": repositoryOptions,
	"check:concept-css": conceptCssArguments,
	"check:agent-context": agentContextOptions,
	"context:show": contextShowMilestone,
	"handoff:new": parseHandoffArgs,
	"brief:check": parseBriefArgs,
	"main:advance": advanceOptions,
	"codex:round": codexOptions,
	"start-load": startLoadOptions,
	"map:tooling": toolingMapOptions,
	"check:tooling-map": toolingMapOptions,
	"code-health:baseline": takesNothing,
	"check:code-health": codeHealthOptions,
	"check:design-context": takesNothing,
	"check:verification-map": ownerCommandOptions,
	"verify:owner": ownerCommandOptions,
	"verify:fast": verificationOptions,
	"verify:phase": verificationOptions,
	"verify:full": verificationOptions,
	"gardener:survey": surveyOptions,
	"gardener:remove-worktree": removeWorktreeOptions,
};

function repositoryPath(value: string) {
	if (!value.startsWith(REPOSITORY_TOKEN)) return value;
	return path.resolve(repository, `.${value.slice(REPOSITORY_TOKEN.length)}`);
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function defaultRun() {
	const prefix = path.join(
		process.platform === "win32" ? "D:/fitway-temp" : tmpdir(),
		"codex-round-",
	);
	return expect.stringMatching(
		new RegExp(`^${escapeRegExp(prefix)}[0-9a-f-]{36}$`),
	);
}

function expected(value: unknown): unknown {
	if (value === DEFAULT_RUN_TOKEN) return defaultRun();
	if (typeof value === "string") return repositoryPath(value);
	if (Array.isArray(value)) return value.map(expected);
	if (value && typeof value === "object")
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, expected(item)]),
		);
	return value;
}

function withEnvironment(environment: Row["env"], run: () => void) {
	const saved = new Map<string, string | undefined>();
	for (const [key, value] of Object.entries(environment ?? {})) {
		saved.set(key, process.env[key]);
		if (value === null) delete process.env[key];
		else process.env[key] = value;
	}
	try {
		run();
	} finally {
		for (const [key, value] of saved) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	}
}

function rowLabel(name: string, row: Row) {
	const environment = Object.entries(row.env ?? {})
		.map(([key, value]) => `${key}=${value ?? "(unset)"}`)
		.join(" ");
	return [name, ...row.args, environment && `[${environment}]`]
		.filter(Boolean)
		.join(" ");
}

// The base inventory: one example of every argument form each parser at 57dad1c0 accepted,
// read from that parser (git show 57dad1c0:<file>), never from tool-registry.mjs. Each must be
// a row of tool-compatibility.json (still accepted, same result) or one of its
// intentionalRefusals (now refused on purpose, with the C3/C4 reason).
const NO_PHASE = { FITWAY_PHASE: null };
const TWO_MILESTONES = [
	"--milestone",
	"agent-tooling-r01",
	"--milestone",
	"owner-design-exploration-r04",
];
const BASE_FORMS: Record<string, BaseForm[]> = {
	// verify-repository.mjs main: argv.includes("--verbose"); everything else ignored.
	"check:repository": [
		["no arguments", []],
		["--verbose", ["--verbose"]],
		["repeated --verbose", ["--verbose", "--verbose"]],
		["an ignored --", ["--"]],
		["an ignored option", ["--bogus"]],
		["an ignored argument", ["extra"]],
	],
	// check-concept-css.mjs main: every -- removed, then exactly one folder.
	"check:concept-css": [
		["a folder", ["."]],
		["-- then a folder", ["--", "."]],
		["a folder then --", [".", "--"]],
		["several --", ["--", "--", "."]],
		["a folder starting with -", ["-folder"]],
	],
	// check-agent-context.mjs parseArgs: --milestone <any non-empty>, two flags, repeats.
	"check:agent-context": [
		["no arguments", []],
		["--milestone", ["--milestone", "agent-tooling-r01"]],
		["--no-tracked", ["--no-tracked"]],
		["--verbose", ["--verbose"]],
		[
			"all options",
			["--milestone", "agent-tooling-r01", "--no-tracked", "--verbose"],
		],
		["a repeated flag", ["--verbose", "--verbose"]],
		["a repeated --milestone", TWO_MILESTONES],
		["an option-shaped milestone", ["--milestone", "--verbose"]],
	],
	// show-agent-context.mjs parseArgs: optional leading --, --milestone <any>, repeats.
	"context:show": [
		["no milestone", []],
		["--milestone", ["--milestone", "agent-tooling-r01"]],
		["-- then --milestone", ["--", "--milestone", "agent-tooling-r01"]],
		["a repeated --milestone", TWO_MILESTONES],
		["an option-shaped milestone", ["--milestone", "--verbose"]],
	],
	// new-handoff.mjs parseHandoffArgs: optional leading --, each option once, a value that does
	// not start with --.
	"handoff:new": [
		["--milestone", ["--milestone", "agent-tooling-r01"]],
		["-- then --milestone", ["--", "--milestone", "agent-tooling-r01"]],
		[
			"--dir",
			[
				"--milestone",
				"agent-tooling-r01",
				"--dir",
				"docs/phase-records/handoffs/agent-tooling",
			],
		],
		[
			"--now",
			["--milestone", "agent-tooling-r01", "--now", "2026-10-17T00:00:00Z"],
		],
		[
			"all options",
			[
				"--milestone",
				"agent-tooling-r01",
				"--dir",
				"docs/phase-records/handoffs/agent-tooling",
				"--now",
				"2026-10-17T00:00:00Z",
			],
		],
		[
			"a value starting with a single -",
			["--milestone", "agent-tooling-r01", "--dir", "-x"],
		],
	],
	// check-brief.mjs parseBriefArgs: optional leading --, one brief, the flag once anywhere.
	"brief:check": [
		["a brief", ["AGENTS.md"]],
		["-- then a brief", ["--", "AGENTS.md"]],
		["the flag after", ["AGENTS.md", "--fill-environment"]],
		["the flag before", ["--fill-environment", "AGENTS.md"]],
		["-- then both", ["--", "AGENTS.md", "--fill-environment"]],
	],
	// advance-main.mjs parseArgs: one commit, --dry-run repeatable anywhere, every -- skipped.
	"main:advance": [
		["a commit", ["HEAD"]],
		["-- then a commit", ["--", "HEAD"]],
		["--dry-run before", ["--dry-run", "HEAD"]],
		["--dry-run after", ["HEAD", "--dry-run"]],
		["-- then both", ["--", "--dry-run", "HEAD"]],
		["a repeated --dry-run", ["--dry-run", "--dry-run", "HEAD"]],
		["a trailing --", ["HEAD", "--"]],
		["several --", ["--", "--", "HEAD"]],
		["-- between the option and the commit", ["--dry-run", "--", "HEAD"]],
		["--dry-run after a later --", ["HEAD", "--", "--dry-run"]],
	],
	// codex-round.mjs parseArgs: optional leading --; launch <brief> [<level>] with --model,
	// --run (any value) and --new-review once each; resume <folder> [--message <any> |
	// --message-file <file>].
	"codex:round": [
		["a brief", ["AGENTS.md"]],
		["-- then a brief", ["--", "AGENTS.md"]],
		["a brief and level", ["AGENTS.md", "high"]],
		["--model", ["AGENTS.md", "--model", "gpt-6.1-sol"]],
		["options first", ["--model", "gpt-6.1-sol", "AGENTS.md", "xhigh"]],
		["--run", ["AGENTS.md", "--run", "round-output"]],
		["--new-review", ["AGENTS.md", "--new-review"]],
		["an option-shaped --run", ["AGENTS.md", "--run", "--new-reveiw"]],
		["resume", ["resume", "round-output"]],
		["-- then resume", ["--", "resume", "round-output"]],
		[
			"resume --message",
			["resume", "round-output", "--message", "continue"],
			{ MSYSTEM: null },
		],
		[
			"resume --message with option-shaped text",
			["resume", "round-output", "--message", "--help"],
			{ MSYSTEM: null },
		],
		[
			"resume --message-file",
			["resume", "round-output", "--message-file", "package.json"],
		],
	],
	// start-load.mjs: node:util parseArgs with string root/limit/since/reads and boolean json:
	// spaced or = values, repeats (last wins), a terminal --.
	"start-load": [
		["no arguments", []],
		["--root", ["--root", "."]],
		["--root=", ["--root=."]],
		["--limit", ["--limit", "25"]],
		["--limit=", ["--limit=25"]],
		["--since", ["--since", "2026-10-01"]],
		["--since=", ["--since=2026-10-01"]],
		["--reads", ["--reads", "package.json"]],
		["--reads=", ["--reads=package.json"]],
		["--json", ["--json"]],
		[
			"all options",
			["--root", ".", "--limit", "5", "--since", "2026-10-01", "--json"],
		],
		["a repeated value", ["--limit", "5", "--limit", "6"]],
		["a repeated flag", ["--json", "--json"]],
		["a sole --", ["--"]],
		["a terminal --", ["--json", "--"]],
		["an empty = value", ["--root="]],
	],
	// generate-tooling-map.mjs main: no arguments or exactly --check.
	"map:tooling": [
		["no arguments", []],
		["--check", ["--check"]],
	],
	"check:tooling-map": [["the fixed --check", ["--check"]]],
	// code-health-baseline.mjs and check-design-context.mjs read no arguments.
	"code-health:baseline": [
		["no arguments", []],
		["an ignored option", ["--bogus"]],
		["an ignored argument", ["extra"]],
	],
	"check:design-context": [
		["no arguments", []],
		["an ignored option", ["--bogus"]],
		["an ignored argument", ["extra"]],
	],
	// check-code-health.mjs main: only --exceptions, any number of times.
	"check:code-health": [
		["no arguments", []],
		["--exceptions", ["--exceptions"]],
		["a repeated --exceptions", ["--exceptions", "--exceptions"]],
	],
	// The Owner CLI's parse behind the fixed drift-tree: any --key <value not starting -->,
	// a passthrough after --, repeats.
	"check:verification-map": [
		["drift-tree", ["drift-tree"]],
		["--root", ["drift-tree", "--root", "."]],
		["a repeated --root", ["drift-tree", "--root", ".", "--root", "."]],
		["any other --key value", ["drift-tree", "--anything", "x"]],
		["a passthrough", ["drift-tree", "--", "x"]],
		["a value starting with a single -", ["drift-tree", "--root", "-x"]],
	],
	// cli.mjs parse; the option keys each subcommand read are OWNER_READS below.
	"verify:owner": [
		["no arguments", []],
		["help", ["help"]],
		[
			"a repeated option",
			["list", "--concept", "<repo>", "--page", "index.html", "--page", "all"],
		],
		[
			"any other --key value",
			["list", "--concept", "<repo>", "--anything", "x"],
		],
		["another subcommand's flag", ["list", "--concept", "<repo>", "--lan"]],
		[
			"an internal state key",
			["doctor", "--concept", "<repo>", "--portLease", "3176"],
		],
		[
			"a passthrough on a subcommand other than measure",
			["drive", "--concept", "<repo>", "--", "x"],
		],
		[
			"a value starting with a single -",
			["list", "--concept", "<repo>", "--page", "-x"],
		],
		["a relative --concept", ["map", "--concept", "."]],
		["a relative --out", ["map", "--concept", "<repo>", "--out", "evidence"]],
		["compare without --baseline", ["compare", "--concept", "<repo>"]],
	],
	// verify.mjs parseArguments: every -- removed, the mode first, --phase <any> repeatable when
	// it agrees, FITWAY_PHASE as the default phase.
	"verify:fast": [
		["fast", ["fast"], NO_PHASE],
		["fast then --", ["fast", "--"], NO_PHASE],
		["-- before the mode", ["--", "fast"], NO_PHASE],
	],
	"verify:phase": [
		["--phase", ["phase", "--phase", "1"], NO_PHASE],
		["-- then --phase", ["phase", "--", "--phase", "1"], NO_PHASE],
		["a terminal --", ["phase", "--phase", "1", "--"], NO_PHASE],
		[
			"a repeated agreeing --phase",
			["phase", "--phase", "1", "--phase", "1"],
			NO_PHASE,
		],
		[
			"-- between --phase and its value",
			["phase", "--phase", "--", "1"],
			NO_PHASE,
		],
	],
	"verify:full": [["full", ["full"], NO_PHASE]],
	// survey.mjs parseOptions: absolute --out once, --temp-root and --final-report repeatable,
	// in any order.
	"gardener:survey": [
		["--out", ["--out", "<repo>/survey-out"]],
		[
			"--temp-root after",
			["--out", "<repo>/survey-out", "--temp-root", "<repo>/temp-root"],
		],
		[
			"--temp-root first",
			["--temp-root", "<repo>/temp-root", "--out", "<repo>/survey-out"],
		],
		[
			"--final-report",
			["--out", "<repo>/survey-out", "--final-report", "<repo>/REPORT.md"],
		],
		[
			"a repeated --temp-root",
			[
				"--out",
				"<repo>/survey-out",
				"--temp-root",
				"<repo>/temp-a",
				"--temp-root",
				"<repo>/temp-root",
			],
		],
		[
			"all options",
			[
				"--out",
				"<repo>/survey-out",
				"--temp-root",
				"<repo>/temp-root",
				"--final-report",
				"<repo>/REPORT.md",
			],
		],
	],
	// remove-worktree.mjs: exactly --checkout <path> --worktree <path>.
	"gardener:remove-worktree": [
		["both paths", ["--checkout", "<repo>", "--worktree", "<repo>"]],
	],
};

// The option keys each Owner subcommand's code read from the parsed options at 57dad1c0
// (cli.mjs and what it passed them to: compare.mjs, runner.mjs, core.mjs, colors.mjs,
// baseline-cache.mjs). Each needs a row of that subcommand that passes it.
const OWNER_READS: Record<string, string[]> = {
	map: ["concept", "recipes", "out"],
	"repair-recipes": ["concept", "recipes", "out"],
	list: ["concept", "recipes", "map", "page"],
	drift: ["concept", "recipes", "map"],
	"drift-tree": ["root"],
	launch: ["concept", "port", "out", "lan", "isolated-port", "idle-timeout-ms"],
	doctor: [
		...["concept", "recipes", "map", "session", "port", "tools"],
		...["forensics", "transports", "quiet"],
	],
	drive: [
		...["concept", "recipes", "map", "session", "out", "forensics", "page"],
		...["feature", "states", "query", "languages", "sizes", "inputs"],
		...["motions", "transports", "port", "colors", "cache", "probes"],
		...["tools", "timeline", "timeline-times", "quiet"],
	],
	compare: [
		...["concept", "baseline", "recipes", "baseline-recipes", "baseline-map"],
		...["baseline-port", "map", "session", "out", "forensics", "page"],
		...["feature", "states", "query", "languages", "sizes", "inputs"],
		...["motions", "transports", "port", "colors", "cache", "probes"],
		...["timeline", "timeline-times", "affected-pages", "baseline-cache"],
		"workers",
	],
	measure: [
		...["tool", "out", "forensics", "colors", "feature", "states"],
		...["languages", "sizes", "inputs", "motions", "transports"],
	],
	cleanup: ["session"],
	_serve: ["concept", "port", "lan", "token", "idle-timeout-ms"],
};

const sameForm = (
	left: { args: string[]; env?: Row["env"] },
	right: { args: string[]; env?: Row["env"] },
) =>
	JSON.stringify(left.args) === JSON.stringify(right.args) &&
	JSON.stringify(left.env ?? {}) === JSON.stringify(right.env ?? {});

describe("E1 base inventory: nothing a 57dad1c0 parser accepted is silently lost", () => {
	it("lists every base form as a row or an intentional refusal", () => {
		const lost: string[] = [];
		for (const [name, forms] of Object.entries(BASE_FORMS))
			for (const [form, args, env] of forms) {
				const candidate = { args, env };
				const row = (table.rows[name] ?? []).some((item) =>
					sameForm(item, candidate),
				);
				const refused = table.intentionalRefusals.some(
					(item) => item.command === name && sameForm(item, candidate),
				);
				if (!row && !refused) lost.push(`${name}: ${form}: ${args.join(" ")}`);
			}
		for (const [command, keys] of Object.entries(OWNER_READS))
			for (const key of keys)
				if (
					!table.rows["verify:owner"].some(
						(row) => row.args[0] === command && row.args.includes(`--${key}`),
					)
				)
					lost.push(`verify:owner ${command}: --${key}, read at 57dad1c0`);
		expect(lost, lost.join("\n")).toEqual([]);
	});

	for (const refusal of table.intentionalRefusals)
		it(`refuses on purpose: ${refusal.command} ${refusal.args.join(" ")}`, () => {
			expect(refusal.reason).toMatch(/^C[1-4]/);
			withEnvironment(refusal.env, () => {
				expect(() =>
					steps[refusal.command](
						resolveToolArguments(
							refusal.command,
							refusal.args.map(repositoryPath),
						),
					),
				).toThrow();
			});
		});
});

describe("E1 compatibility table from the 57dad1c0 parsers", () => {
	it("has rows, or a recorded reason for none, for every registered command", () => {
		const covered = [
			...Object.keys(table.rows),
			...Object.keys(table.commandsWithoutRows),
		].sort();
		expect(covered).toEqual(TOOL_REGISTRY.map((entry) => entry.name).sort());
		for (const name of Object.keys(table.rows))
			expect(steps[name], `${name} argument step`).toBeTypeOf("function");
	});

	// A row expects acceptance: a refusal from the resolver or the step is the value asserted on,
	// so the row fails at its assertion, naming the row and the refusal, never before it.
	for (const [name, rows] of Object.entries(table.rows))
		for (const row of rows)
			it(rowLabel(name, row), () => {
				withEnvironment(row.env, () => {
					let received: unknown;
					try {
						received = steps[name](
							resolveToolArguments(name, row.args.map(repositoryPath)),
						);
					} catch (error) {
						received = {
							refused: error instanceof Error ? error.message : String(error),
						};
					}
					expect(received, rowLabel(name, row)).toEqual(expected(row.expect));
				});
			});
});
