// Define the agent tool commands, options, help, and exit contracts.
import {
	CODEX_ROUND_NOTES,
	CONCEPT_CSS_NOTES,
	evidenceFolderToolEntries,
	NODE_USAGE_NOTES,
	OWNER_NOTES,
	ownerTailCommands,
	TOOLING_MAP_EXITS,
	TOOLING_MAP_NOTES,
} from "./tool-help-notes.mjs";

const flag = (
	name,
	description,
	{ key = name.slice(2), sample = null, once = false } = {},
) => ({
	name,
	key,
	takesValue: false,
	freeText: false,
	description,
	sample,
	once,
});

const value = (
	name,
	description,
	{
		sample = "contract-value",
		freeText = false,
		pathKind = null,
		pathLabel = null,
		absolute = false,
		missingFix = null,
		key = name.slice(2),
		integer = null,
		choices = null,
		valueNote = null,
	} = {},
) => ({
	name,
	key,
	takesValue: true,
	freeText,
	description,
	sample,
	pathKind,
	pathLabel,
	absolute,
	missingFix,
	integer,
	choices,
	valueNote,
});

const nodeInvocation = (entrypoint) => `node ${entrypoint}`;

const executableEntry = (entry, kind) => {
	const fixedArgs = entry.fixedArgs ?? [];
	return {
		...entry,
		kind,
		fixedArgs,
		invocation: [entry.invocation, ...fixedArgs].join(" "),
	};
};
const packageEntry = (entry) => executableEntry(entry, "package");
const nodeEntry = (entry) => executableEntry(entry, "node");

const exits = (...codes) => codes.map(([code, meaning]) => ({ code, meaning }));

const ownerOptions = {
	concept: value("--concept", "Concept folder.", {
		sample: "visual-exploration/public-live/aurora-preview",
		pathKind: "directory",
		absolute: true,
	}),
	ref: value("--ref", "Concept commit.", { sample: "fedbdb6d" }),
	baseline: value("--baseline", "Baseline folder.", {
		sample: "visual-exploration/baseline",
		pathKind: "directory",
		absolute: true,
	}),
	baselineRef: value("--baseline-ref", "Baseline concept commit.", {
		sample: "bb26be02",
	}),
	recipes: value("--recipes", "Verification recipe file.", {
		sample: "verification-recipes.json",
		pathKind: "file",
	}),
	map: value("--map", "Verification map file.", {
		sample: "verification-map.json",
		pathKind: "file",
	}),
	out: value("--out", "Fresh evidence output folder.", { absolute: true }),
	page: value("--page", "Page name or all.", { sample: "all" }),
	feature: value("--feature", "Feature name, list, or all.", { sample: "all" }),
	states: value("--states", "State selection.", { sample: "default" }),
	query: value("--query", "Query string.", { sample: "view=contract" }),
	languages: value("--languages", "Comma-separated languages.", {
		sample: "ar,en",
	}),
	sizes: value("--sizes", "Comma-separated viewport sizes.", {
		sample: "desktop,phone",
	}),
	widths: value("--widths", "Comma-separated viewport widths.", {
		sample: "320,390,768,1440",
	}),
	inputs: value("--inputs", "Comma-separated input modes.", {
		sample: "mouse,keyboard",
	}),
	motions: value("--motions", "Comma-separated motion modes.", {
		sample: "reduce",
	}),
	transports: value("--transports", "Comma-separated transports.", {
		sample: "http",
	}),
	port: value("--port", "Preview port.", { sample: "3176" }),
	colors: value("--colors", "Colour mode.", { sample: "normal" }),
	cache: value("--cache", "Cache mode.", { sample: "no-store" }),
	probes: value("--probes", "Probe selection.", { sample: "daily" }),
	forensics: value("--forensics", "ui-forensics folder.", {
		pathKind: "directory",
	}),
	session: value("--session", "Launch or session evidence path.", {
		pathKind: "any",
	}),
	tools: value("--tools", "Comma-separated tools.", { sample: "diff" }),
	root: value("--root", "Repository root.", {
		sample: ".",
		pathKind: "directory",
	}),
	quiet: value("--quiet", "Omit the pass line (any value counts).", {
		sample: "true",
	}),
	timeline: flag("--timeline", "Compare settled and held frames."),
	timelineTimes: value("--timeline-times", "Timeline sample times.", {
		sample: "1,100,200",
	}),
};

const driveOptions = [
	ownerOptions.ref,
	ownerOptions.recipes,
	ownerOptions.map,
	ownerOptions.session,
	ownerOptions.out,
	ownerOptions.forensics,
	ownerOptions.page,
	ownerOptions.feature,
	ownerOptions.states,
	ownerOptions.query,
	ownerOptions.languages,
	ownerOptions.sizes,
	ownerOptions.inputs,
	ownerOptions.motions,
	ownerOptions.transports,
	ownerOptions.port,
	ownerOptions.colors,
	ownerOptions.cache,
	ownerOptions.probes,
];

const ownerCommands = [
	{
		name: "help",
		usage: "pnpm verify:owner help",
		purpose: "Print owner verification help.",
		options: [],
		requiredOptions: [],
		exitCodes: exits([0, "Help printed."]),
	},
	{
		name: "map",
		usage:
			"pnpm verify:owner map --concept <folder> [--recipes <file>] [--out <evidence-folder>]",
		purpose: "Generate a source-derived verification map.",
		options: [ownerOptions.concept, ownerOptions.recipes, ownerOptions.out],
		requiredOptions: ["--concept"],
		exitCodes: exits([0, "Map generated."], [1, "Command refused or failed."]),
	},
	{
		name: "repair-recipes",
		usage:
			"pnpm verify:owner repair-recipes --concept <folder> [--recipes <stale-file>] [--out <evidence-folder>]",
		purpose: "Write draft repairs for stale recipe selectors.",
		options: [ownerOptions.concept, ownerOptions.recipes, ownerOptions.out],
		requiredOptions: ["--concept"],
		exitCodes: exits(
			[0, "Repairs written."],
			[1, "Command refused or failed."],
		),
	},
	{
		name: "list",
		usage:
			"pnpm verify:owner list --concept <folder> [--recipes <file>] [--map <file>] [--page <page>|all]",
		purpose: "List mapped features, states, and proof.",
		options: [
			ownerOptions.concept,
			ownerOptions.recipes,
			ownerOptions.map,
			ownerOptions.page,
		],
		requiredOptions: ["--concept"],
		exitCodes: exits([0, "List printed."], [1, "Command refused or failed."]),
	},
	{
		name: "drift",
		usage:
			"pnpm verify:owner drift --concept <folder> [--recipes <file>] [--map <verification-map.json>]",
		purpose: "Report source and recipe drift.",
		options: [ownerOptions.concept, ownerOptions.recipes, ownerOptions.map],
		requiredOptions: ["--concept"],
		exitCodes: exits(
			[0, "Drift checked."],
			[1, "Drift found or command failed."],
		),
	},
	{
		name: "drift-tree",
		usage: "pnpm verify:owner drift-tree [--root <repository>]",
		purpose:
			"Check committed verification maps across a tree, or the declared concept branch's.",
		options: [ownerOptions.root],
		requiredOptions: [],
		exitCodes: exits(
			[0, "Tree checked."],
			[1, "Drift found, nothing to check, or command failed."],
		),
	},
	{
		name: "launch",
		usage:
			"pnpm verify:owner launch --concept <folder> [--port 3176] [--out <evidence-folder>] [--lan] [--isolated-port <49152-65535>] [--idle-timeout-ms <1-1800000>]",
		purpose: "Launch an isolated preview.",
		options: [
			ownerOptions.concept,
			ownerOptions.port,
			ownerOptions.out,
			flag("--lan", "Listen on LAN."),
			value("--isolated-port", "Isolated high port.", {
				sample: "49152",
				integer: [49152, 65535],
			}),
			value("--idle-timeout-ms", "Idle timeout in milliseconds.", {
				sample: "60000",
				integer: [1, 1800000],
				valueNote: "at most 30 minutes",
			}),
		],
		requiredOptions: ["--concept"],
		exitCodes: exits(
			[0, "Preview launched."],
			[1, "Command refused or failed."],
		),
	},
	{
		name: "doctor",
		usage:
			"pnpm verify:owner doctor --concept <folder> [--recipes <file>] [--map <file>] [--session <launch-folder>] [--port 3176] [--tools diff] [--forensics <folder>] [--transports http,file] [--quiet <any>]",
		purpose: "Diagnose verification readiness.",
		options: [
			ownerOptions.concept,
			ownerOptions.recipes,
			ownerOptions.map,
			ownerOptions.session,
			ownerOptions.port,
			ownerOptions.tools,
			ownerOptions.forensics,
			ownerOptions.transports,
			ownerOptions.quiet,
		],
		requiredOptions: ["--concept"],
		exitCodes: exits([0, "Doctor passed."], [1, "Doctor reported a problem."]),
	},
	{
		name: "drive",
		usage:
			"pnpm verify:owner drive (--concept <folder>|--ref <commit>) [--recipes <file>] [--map <file>] [--session <launch-folder>] [--out <evidence-folder>] [--forensics <folder>] [--page index.html|all] [--feature page|all|id,id,...] [--states default|all|switch=value,...] [--query key=value&key=value] [--languages ar,en] [--sizes desktop,tablet,phone] [--inputs mouse,touch,keyboard] [--motions reduce,full] [--transports http,file] [--port 3176] [--colors normal,forced] [--cache no-store|none] [--probes daily] [--tools diff] [--timeline] [--timeline-times 1,100,200,...] [--quiet <any>]",
		purpose: "Drive responsive and interaction evidence.",
		options: [
			ownerOptions.concept,
			...driveOptions,
			ownerOptions.tools,
			ownerOptions.timeline,
			ownerOptions.timelineTimes,
			ownerOptions.quiet,
		],
		requiredOptions: [],
		requiredOptionGroups: [["--concept", "--ref"]],
		exitCodes: exits([0, "Drive passed."], [1, "Findings or command failure."]),
	},
	{
		name: "compare",
		usage:
			"pnpm verify:owner compare (--concept <folder>|--ref <commit>) (--baseline <folder>|--baseline-ref <commit>) [--recipes <file>] [--baseline-recipes <file>] [--baseline-map <file>] [--baseline-port 3177] [all drive page/feature/state/axis options] [--out <evidence-folder>] [--forensics <folder>] [--timeline] [--timeline-times 1,100,200,...] [--affected-pages] [--baseline-cache off] [--workers 1|2|3|4]",
		purpose: "Compare a build against a baseline.",
		options: [
			ownerOptions.concept,
			ownerOptions.baseline,
			ownerOptions.baselineRef,
			ownerOptions.recipes,
			value("--baseline-recipes", "Baseline recipe file.", {
				sample: "baseline-recipes.json",
				pathKind: "file",
			}),
			value("--baseline-map", "Baseline map file.", {
				sample: "baseline-map.json",
				pathKind: "file",
			}),
			value("--baseline-port", "Baseline preview port.", { sample: "3177" }),
			...driveOptions,
			ownerOptions.timeline,
			ownerOptions.timelineTimes,
			flag("--affected-pages", "Compare affected pages."),
			value("--baseline-cache", "Baseline cache mode.", { sample: "off" }),
			value("--workers", "Parallel workers.", {
				sample: "1",
				integer: [1, 4],
			}),
		],
		requiredOptions: [],
		requiredOptionGroups: [
			["--concept", "--ref"],
			["--baseline", "--baseline-ref"],
		],
		exitCodes: exits(
			[0, "Compare passed."],
			[1, "Differences or command failure."],
		),
	},
	{
		name: "belonging-check",
		usage:
			"pnpm verify:owner belonging-check [--concept <folder>|--ref <commit>] [--recipes <file>] [--page <page>|all] [--languages ar,en] [--widths 320,390,...] [--states default|all|<query>] [--port 3176] [--out <evidence-folder>]",
		purpose: "Find item lines that run under another stacked column.",
		options: [
			ownerOptions.concept,
			ownerOptions.ref,
			ownerOptions.recipes,
			ownerOptions.out,
			ownerOptions.page,
			ownerOptions.languages,
			ownerOptions.widths,
			ownerOptions.states,
			ownerOptions.port,
		],
		requiredOptions: [],
		exitCodes: exits(
			[0, "No belonging findings."],
			[1, "Findings, load failures, or command failure."],
		),
	},
	{
		name: "run",
		usage:
			"pnpm verify:owner run --script <file> (--concept <folder>|--ref <commit>) [--baseline <folder>|--baseline-ref <commit>] --out <folder> [--port 3176] [--baseline-port 3177] -- <script arguments>",
		purpose: "Run one agent-authored verification script.",
		options: [
			value("--script", "Script file.", {
				sample: "check.mjs",
				pathKind: "file",
			}),
			ownerOptions.concept,
			ownerOptions.ref,
			ownerOptions.recipes,
			ownerOptions.baseline,
			ownerOptions.baselineRef,
			value("--baseline-recipes", "Baseline recipe file.", {
				sample: "baseline-recipes.json",
				pathKind: "file",
			}),
			ownerOptions.port,
			value("--baseline-port", "Baseline preview port.", {
				sample: "3177",
			}),
			ownerOptions.out,
			ownerOptions.forensics,
			ownerOptions.cache,
		],
		requiredOptions: ["--script", "--out"],
		requiredOptionGroups: [["--concept", "--ref"]],
		passthrough: true,
		exitCodes: exits([0, "Script passed."], [1, "Script failed."]),
	},
	{
		name: "diff-folders",
		usage:
			"pnpm verify:owner diff-folders --a <folder> --b <folder> --out <folder>",
		purpose: "Compare every PNG under two folders.",
		options: [
			value("--a", "First PNG folder.", {
				sample: "captures/before",
				pathKind: "directory",
				absolute: true,
			}),
			value("--b", "Second PNG folder.", {
				sample: "captures/after",
				pathKind: "directory",
				absolute: true,
			}),
			ownerOptions.out,
		],
		requiredOptions: ["--a", "--b", "--out"],
		exitCodes: exits([0, "Every PNG is equal."], [1, "A PNG differs."]),
	},
	...ownerTailCommands({ ownerOptions, flag, value, exits }),
];

const ownerEntry = {
	name: "verify:owner",
	invocation: nodeInvocation(".agents/skills/verify-fitway/cli.mjs"),
	purpose: "Generate and drive evidence for the Owner surface.",
	usage: "pnpm verify:owner <command> [options]",
	options: [
		...new Map(
			ownerCommands
				.filter((command) => !command.internal)
				.flatMap((command) => command.options)
				.map((option) => [option.name, option]),
		).values(),
	],
	globalOptions: [],
	commands: ownerCommands,
	extraHelp: OWNER_NOTES,
	exitCodes: exits(
		[0, "Command passed or help printed."],
		[1, "Command refused or verification failed."],
	),
};

export const TOOL_REGISTRY = Object.freeze([
	packageEntry({
		name: "tools",
		invocation: nodeInvocation("scripts/list-agent-tools.mjs"),
		purpose: "List every agent-facing command and its invocation.",
		usage: "pnpm tools",
		options: [],
		exitCodes: exits([0, "Table printed."], [1, "Invalid argument."]),
	}),
	packageEntry({
		name: "check:repository",
		invocation: nodeInvocation("scripts/verify-repository.mjs"),
		purpose: "Validate repository invariants and records.",
		usage: "pnpm check:repository [--verbose]",
		options: [flag("--verbose", "Print agent-context warnings.")],
		exitCodes: exits(
			[0, "Repository invariants passed."],
			[1, "Repository validation failed."],
		),
	}),
	packageEntry({
		name: "check:concept-css",
		invocation: nodeInvocation("scripts/check-concept-css.mjs"),
		purpose: "Check a concept folder for CSS contract findings.",
		usage: "pnpm check:concept-css -- <folder>",
		options: [],
		positionals: [
			{
				name: "folder",
				required: true,
				sample: "visual-exploration/public-live/aurora-preview",
			},
		],
		deferPositionalFailures: true,
		failureExitCode: 2,
		extraHelp: CONCEPT_CSS_NOTES,
		failureCases: [
			{ args: [], fix: "Usage: pnpm check:concept-css -- <folder>" },
			{ args: ["contract-missing-folder"], fix: "existing folder" },
		],
		exitCodes: exits(
			[0, "CSS checks passed."],
			[1, "CSS findings."],
			[2, "Startup failure or no CSS files."],
		),
	}),
	packageEntry({
		name: "check:agent-context",
		invocation: nodeInvocation("scripts/check-agent-context.mjs"),
		purpose: "Validate the active agent-context registry and packets.",
		usage:
			"pnpm check:agent-context [--milestone <id>] [--no-tracked] [--verbose]",
		options: [
			value("--milestone", "Restrict checks to one milestone.", {
				sample: "agent-tooling-r01",
				key: "milestoneId",
			}),
			flag("--no-tracked", "Skip tracked-file checks.", {
				key: "noTracked",
			}),
			flag("--verbose", "Print warnings."),
		],
		extraHelp: NODE_USAGE_NOTES["check:agent-context"],
		exitCodes: exits(
			[0, "Context checks passed."],
			[1, "Context checks failed."],
		),
	}),
	packageEntry({
		name: "context:show",
		invocation: nodeInvocation("scripts/show-agent-context.mjs"),
		purpose: "Show the bounded context route for one milestone.",
		usage: "pnpm context:show --milestone <id>",
		options: [
			value("--milestone", "Milestone id.", {
				sample: "agent-tooling-r01",
				key: "milestoneId",
			}),
		],
		requiredOptions: ["--milestone"],
		extraHelp: NODE_USAGE_NOTES["context:show"],
		exitCodes: exits(
			[0, "Context plan printed."],
			[1, "Context plan refused."],
		),
	}),
	packageEntry({
		name: "handoff:new",
		invocation: nodeInvocation("scripts/agent-environment/new-handoff.mjs"),
		purpose: "Create or update writes <milestone-id>-resume.md.",
		usage:
			"pnpm handoff:new [--] --milestone <milestone-id> [--dir <repo-relative dir>] [--now <ISO-8601>]",
		options: [
			value("--milestone", "Milestone id.", {
				sample: "agent-tooling-r01",
				key: "milestoneId",
			}),
			value("--dir", "Handoff directory.", {
				sample: "docs/phase-records/handoffs/agent-tooling",
				key: "directory",
			}),
			value("--now", "Deterministic ISO-8601 timestamp.", {
				sample: "2026-10-17T00:00:00Z",
			}),
		],
		requiredOptions: ["--milestone"],
		exitCodes: exits([0, "Resume point written."], [1, "Command refused."]),
	}),
	packageEntry({
		name: "brief:check",
		invocation: nodeInvocation("scripts/agent-environment/check-brief.mjs"),
		purpose: "Validate an agent brief.",
		usage: "pnpm brief:check [--] <brief> [--fill-environment]",
		options: [
			flag("--fill-environment", "Fill the shared environment block.", {
				key: "fillEnvironment",
				once: true,
			}),
		],
		positionals: [
			{
				name: "brief",
				required: true,
				pathKind: "file",
				sample: "AGENTS.md",
				pathLabel: "brief file",
			},
		],
		failureName: "brief:check:1",
		exitCodes: exits(
			[0, "Brief passed."],
			[1, "Brief failed or command refused."],
		),
	}),
	...evidenceFolderToolEntries({ packageEntry, value, exits }),
	packageEntry({
		name: "main:advance",
		invocation: nodeInvocation("scripts/agent-environment/advance-main.mjs"),
		purpose: "Fast-forward main to a pushed commit with a passing CI run.",
		usage: "pnpm main:advance [--dry-run] <commit>",
		options: [
			flag("--dry-run", "Check without pushing.", {
				key: "dryRun",
			}),
		],
		positionals: [{ name: "commit", required: true, sample: "HEAD" }],
		exitCodes: exits(
			[0, "Main advanced or dry run passed."],
			[1, "Command refused."],
		),
	}),
	packageEntry({
		name: "codex:round",
		invocation: nodeInvocation("scripts/agent-environment/codex-round.mjs"),
		purpose: "Launch or resume a Codex review round.",
		usage:
			"pnpm codex:round [--] <brief> [<level>] [--model <model>] [--run <folder>] [--new-review] | pnpm codex:round [--] resume <folder> [--message <text> | --message-file <file>]",
		options: [
			value("--model", "Model name.", { sample: "gpt-6.1-sol" }),
			value("--run", "Round output folder.", { sample: "round-output" }),
			flag("--new-review", "Start a fresh review.", {
				key: "newReview",
			}),
			value("--message", "Resume message text.", {
				sample: "continue",
				freeText: true,
				missingFix:
					"expected resume <folder> [--message <text> | --message-file <file>]",
			}),
			value("--message-file", "Resume message file.", {
				sample: "message.txt",
				pathKind: "file",
				pathLabel: "message file",
				key: "messageFile",
				missingFix:
					"expected resume <folder> [--message <text> | --message-file <file>]",
			}),
		],
		positionals: [
			{
				name: "brief",
				required: true,
				sample: "AGENTS.md",
			},
			{
				name: "level",
				required: false,
				sample: "max",
			},
		],
		skipPositionalPaths: true,
		deferPositionalFailures: true,
		extraHelp: CODEX_ROUND_NOTES,
		exitCodes: exits(
			[0, "Round completed."],
			[1, "Command refused or failed."],
		),
	}),
	packageEntry({
		name: "start-load",
		invocation: nodeInvocation("scripts/agent-environment/start-load.mjs"),
		purpose: "Measure context read volume from session transcripts.",
		usage:
			"pnpm start-load [--root <transcripts dir>] [--limit <sessions>] [--since <YYYY-MM-DD>] [--json] | --reads <transcript.jsonl>",
		options: [
			value("--root", "Transcript root.", {
				sample: "sessions",
				pathKind: "directory",
			}),
			value("--limit", "Session limit.", { sample: "25" }),
			value("--since", "Earliest date.", { sample: "2026-10-01" }),
			value("--reads", "Transcript JSONL file.", {
				sample: "session.jsonl",
				pathKind: "file",
			}),
			flag("--json", "Print JSON."),
		],
		invalidValues: [
			{
				args: ["--limit", "0"],
				fix: "positive integer",
			},
		],
		extraHelp: NODE_USAGE_NOTES["start-load"],
		exitCodes: exits([0, "Report printed."], [1, "Command refused or failed."]),
	}),
	packageEntry({
		name: "map:tooling",
		invocation: nodeInvocation(
			"scripts/agent-environment/generate-tooling-map.mjs",
		),
		purpose: "Regenerate the agent tooling code map.",
		usage: "pnpm map:tooling [--check]",
		options: [flag("--check", "Check without writing.")],
		extraHelp: TOOLING_MAP_NOTES,
		exitCodes: exits(...TOOLING_MAP_EXITS),
	}),
	packageEntry({
		name: "check:tooling-map",
		invocation: nodeInvocation(
			"scripts/agent-environment/generate-tooling-map.mjs",
		),
		purpose: "Check the agent tooling code map for drift.",
		usage: "pnpm check:tooling-map",
		options: [],
		fixedArgs: ["--check"],
		extraHelp: TOOLING_MAP_NOTES,
		exitCodes: exits(...TOOLING_MAP_EXITS),
	}),
	packageEntry({
		name: "code-health:baseline",
		invocation: nodeInvocation(
			"scripts/agent-environment/code-health-baseline.mjs",
		),
		purpose: "Write the code-health baseline.",
		usage: "pnpm code-health:baseline [--admit <folder> --reason <text>]",
		options: [
			value(
				"--admit",
				"Admit rises in one folder named by the committed baseline giantRoots.",
				{ sample: "design-research/concept" },
			),
			value("--reason", "Reason recorded for an admission.", {
				freeText: true,
				sample: "Branched concept pages diverged from the baseline.",
			}),
		],
		exitCodes: exits([0, "Baseline written."], [1, "Baseline refused."]),
	}),
	packageEntry({
		name: "check:code-health",
		invocation: nodeInvocation(
			"scripts/agent-environment/check-code-health.mjs",
		),
		purpose: "Enforce the code-health ratchet.",
		usage: "pnpm check:code-health [--exceptions]",
		options: [flag("--exceptions", "List open exceptions.")],
		exitCodes: exits([0, "Ratchet passed."], [1, "Ratchet failed."]),
	}),
	packageEntry({
		name: "check:design-context",
		invocation: nodeInvocation("scripts/check-design-context.mjs"),
		purpose: "Verify the Impeccable design-context bridge.",
		usage: "pnpm check:design-context",
		options: [],
		exitCodes: exits(
			[0, "Design context passed."],
			[1, "Design context failed."],
		),
	}),
	packageEntry({
		name: "check:verification-map",
		invocation: nodeInvocation(".agents/skills/verify-fitway/cli.mjs"),
		purpose: "Check committed verification maps for drift.",
		usage: "pnpm check:verification-map [--root <repository>]",
		options: [ownerOptions.root],
		fixedArgs: ["drift-tree"],
		exitCodes: exits(
			[0, "Maps checked."],
			[1, "Drift found or nothing to check."],
		),
	}),
	packageEntry(ownerEntry),
	packageEntry({
		name: "verify:fast",
		invocation: nodeInvocation("scripts/verify.mjs"),
		purpose: "Run the fast verification ladder.",
		usage: "pnpm verify:fast",
		options: [],
		fixedArgs: ["fast"],
		exitCodes: exits([0, "Fast ladder passed."], [1, "Fast ladder failed."]),
	}),
	packageEntry({
		name: "verify:phase",
		invocation: nodeInvocation("scripts/verify.mjs"),
		purpose: "Run the fast ladder plus one focused phase.",
		usage: "pnpm verify:phase --phase <phase>",
		options: [
			value("--phase", "Registered verification phase.", { sample: "1" }),
		],
		fixedArgs: ["phase"],
		requiredOptionsWhen: [{ option: "--phase", env: "FITWAY_PHASE" }],
		exitCodes: exits([0, "Phase passed."], [1, "Phase failed."]),
	}),
	packageEntry({
		name: "verify:full",
		invocation: nodeInvocation("scripts/verify.mjs"),
		purpose: "Run every local verification gate.",
		usage: "pnpm verify:full",
		options: [],
		fixedArgs: ["full"],
		exitCodes: exits([0, "Full ladder passed."], [1, "Full ladder failed."]),
	}),
	nodeEntry({
		name: "gardener:survey",
		invocation: nodeInvocation(".agents/skills/gardener/survey.mjs"),
		purpose: "Survey FITWAY environment drift.",
		usage:
			"node .agents/skills/gardener/survey.mjs --out <absolute-fresh-run> [--temp-root <absolute-temp-root>] [--final-report <absolute-file>]",
		options: [
			value("--out", "Fresh survey output folder.", { absolute: true }),
			value("--temp-root", "Absolute temp root.", {
				absolute: true,
				key: "tempRoot",
			}),
			value("--final-report", "Absolute rolling report.", {
				absolute: true,
				key: "finalReport",
			}),
		],
		requiredOptions: ["--out"],
		extraHelp: NODE_USAGE_NOTES["gardener:survey"],
		exitCodes: exits([0, "Survey complete."], [1, "Survey blocked."]),
	}),
	nodeEntry({
		name: "gardener:remove-worktree",
		invocation: nodeInvocation(".agents/skills/gardener/remove-worktree.mjs"),
		purpose: "Remove one surveyed and still-qualified worktree.",
		usage:
			"node .agents/skills/gardener/remove-worktree.mjs --checkout <absolute-checkout> --worktree <absolute-worktree>",
		options: [
			value("--checkout", "Absolute coordinator checkout.", {
				pathKind: "directory",
				absolute: true,
			}),
			value("--worktree", "Absolute worktree path.", {
				pathKind: "directory",
				absolute: true,
			}),
		],
		requiredOptions: ["--checkout", "--worktree"],
		extraHelp: NODE_USAGE_NOTES["gardener:remove-worktree"],
		exitCodes: exits([0, "Worktree removed."], [1, "Removal refused."]),
	}),
]);
