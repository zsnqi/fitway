// Hold command-specific help text and evidence-folder command notes.
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

// The explanations each command's own help or usage text printed at 57dad1c0, kept verbatim
// apart from the pnpm usage lines the registry now generates (F272: never lose an explanation).
// tool-registry.mjs prints them after the options of each command's top-level help.

const repository = fileURLToPath(new URL("../../", import.meta.url)).replace(
	/[\\/]$/,
	"",
);

export const CODEX_ROUND_NOTES = Object.freeze([
	"  node <repository>/scripts/agent-environment/codex-round.mjs <brief> [<level>] [--model <model>] [--run <folder>] [--new-review]",
	"  node <repository>/scripts/agent-environment/codex-round.mjs resume <folder> [--message <text> | --message-file <file>]",
	"",
	"Models: deepseek-v4.1-flash (default), gpt-6.1-sol.",
	"Levels: deepseek-v4.1-flash: high, max (default max); gpt-6.1-sol: medium, high, xhigh, max.",
	"Relative brief and run paths start at the repository root, in either shell.",
	`Default run folder: ${process.platform === "win32" ? "D:/fitway-temp" : tmpdir()}/codex-round-<id>.`,
	"Launch runs the REVIEW.md review when absent and stops for coordinator dispositions.",
	"--new-review requests a fresh review and stops; resume never checks reviews.",
	"Resume allows unfinished changes, keeps each event stream, and updates last-message.md.",
	"When a run exits 0 without a report, it resumes automatically up to 10 times and",
	"appends each trigger to auto-resumes.log.",
	"A report names every brief outcome/limit ID on PASS or FAIL lines, or has a",
	"line starting STOPPED:.",
	"--message sends the exact text instead of the saved launch input.",
	"--message-file decodes UTF-8 (with or without a BOM) or UTF-16 files with a BOM,",
	"then sends UTF-8 without the BOM; invalid no-BOM bytes are refused;",
	"use this shell-safe form for quotes, backslashes, Unicode or multiline text.",
	"After a run, start-load.json records the thread's first request (input tokens) from",
	"Codex's session file under CODEX_HOME (default ~/.codex), unless the folder has one.",
]);

export const OWNER_NOTES = Object.freeze([
	"verify-fitway: node <absolute-skill-folder>/cli.mjs <command> [options]",
	"Recipes default to <concept>/verification-recipes.json; --recipes supplies an external file.",
	"repair-recipes drops vanished selectors/markers and writes draft entries outside the concept.",
	"Every use rediscovers source facts; --map is an optional prior map for drift provenance.",
	"map writes <out>/verification-map.json; generated maps are evidence, never committed.",
	"Output defaults to a fresh D:/fitway-temp/verify-fitway-*; git trees/links into them are refused.",
	"Every --out folder records command, arguments, checkout, start, status and end in manifest.json.",
	"--ref and --baseline-ref extract the declared concept at that commit once and reuse the folder.",
	"run executes a script's default export with the command-owned preview, browser, contexts, rewrite and evidence.",
	"diff-folders compares PNG paths with compare's exact diff and exits 0 only when every picture is equal.",
	"Sizes: desktop=1440x900, boundary=1024x900, tablet=768x1024, phone=390x844,",
	"       narrow=320x844, zoom=1440x900 at 200% (720x450 CSS px, phone frame).",
	"--page and --feature select one path; the remaining axes multiply its frames.",
	"States all sweeps every discovered switch value/sample; dependencies are applied or refused.",
	"Use --states 'state=live,state=loading,...' for only the page's data states.",
	"list prints features, states, switches, dependencies, reach and observable proof.",
	"PASS requires state and feature proof. NOT-REACHABLE means state/feature unavailable by recipe (cannot be reached).",
	"KEYBOARD-UNREACHABLE means the pointer feature's keyboard path failed; PROBLEM names a measuring error.",
	"Items have a short *-summary.json beside the full record; filenames include feature and state.",
	"compare repeats differing items in fresh contexts, with exact pixel regions and diff images.",
	"--timeline compares held frames after the last action as well as the settled result.",
	"Default times start at 1 ms, with gaps <=100 ms through the longest finite movement.",
	"--timeline-times names other finite nonnegative milliseconds; implies --timeline.",
	"NOT-HELD names the time and the two same-side captures when their pixels or dimensions differ; callback file/line sources remain in the report.",
	"Known limits: CSS-only openings and some dynamic/delegated opener relationships are not exhaustively discovered.",
	"Doctor can block when a missing standalone input has no authoritative recovery source.",
	"Open numeric/text domains have representative samples in the map; --query accepts other values.",
	"Touch uses hasTouch/coarse pointer and real taps; full means no-preference.",
	"Keyboard uses Tab and key presses only; full evidence records focus at every key.",
	"Unreached keyboard targets fail with the element where focus stopped; keyboardActions can supply roving keys.",
	"Colours default to normal; forced requires ui-forensics >=1.2.0 and renders Chromium forced colours.",
	"measure --colors normal|forced maps to tool --forced-colors none|active.",
	"measure calls the installed ui-forensics tool; its own --help describes further arguments.",
	"--port accepts only ports in 3176-3177, 3186-3187 and 3188-3189; compare requires one ordered pair.",
	"Ports 3174 and 3178-3185 belong to other previews. --workers defaults to 1 (maximum 4).",
	"launch --isolated-port selects a separate high port (49152-65535) for isolated tests.",
	"--port stays restricted to those three pairs even with --isolated-port; busy ports are always refused.",
	"Previews stop after 30 minutes without a request; requests renew the timeout.",
	"launch --idle-timeout-ms can shorten that bound for tests, never extend it.",
	"--forensics <folder> overrides the machine-level ui-forensics location.",
	"Git Bash: use Windows D:/ absolute paths and quote --query; no /api-style arguments cross shells.",
	"help and preview lifecycle need only Node. For discovery/drive/compare/doctor, install checkout dependencies:",
	`  pnpm --dir '${repository.replaceAll("'", "''")}' install --frozen-lockfile`,
]);

export function ownerTailCommands({ ownerOptions, flag, value, exits }) {
	return [
		{
			name: "measure",
			usage:
				"pnpm verify:owner measure --tool focus|motion|a11y|probe|perf|capture|sheet|diff --out <folder> [--forensics <folder>] [--colors normal|forced] [--feature <name>] [--states <state>] [--languages <list>] [--sizes <list>] [--inputs <list>] [--motions <list>] [--transports <list>] -- <tool arguments>",
			purpose: "Run one specialized measurement tool.",
			options: [
				value("--tool", "Measurement tool.", {
					sample: "focus",
					choices: "focus motion a11y probe perf capture sheet diff".split(" "),
				}),
				ownerOptions.out,
				ownerOptions.forensics,
				ownerOptions.colors,
				ownerOptions.feature,
				ownerOptions.states,
				ownerOptions.languages,
				ownerOptions.sizes,
				ownerOptions.inputs,
				ownerOptions.motions,
				ownerOptions.transports,
			],
			requiredOptions: ["--tool", "--out"],
			passthrough: true,
			exitCodes: exits(
				[0, "Measurement passed."],
				[1, "Findings or command failure."],
			),
		},
		{
			name: "cleanup",
			usage: "pnpm verify:owner cleanup --session <launch-folder|session.json>",
			purpose: "Stop an owned preview session.",
			options: [ownerOptions.session],
			requiredOptions: ["--session"],
			exitCodes: exits(
				[0, "Session stopped."],
				[1, "Command refused or failed."],
			),
		},
		{
			name: "_serve",
			usage: "pnpm verify:owner _serve --concept <folder> [options]",
			purpose: "Internal preview server.",
			options: [
				{ ...ownerOptions.concept, absolute: false },
				ownerOptions.port,
				flag("--lan", "Listen on LAN."),
				value("--token", "Session token."),
				value("--idle-timeout-ms", "Idle timeout in milliseconds.", {
					sample: "60000",
					integer: [1, 1800000],
					valueNote: "at most 30 minutes",
				}),
			],
			requiredOptions: ["--concept"],
			internal: true,
			exitCodes: exits(
				[0, "Server stopped."],
				[1, "Command refused or failed."],
			),
		},
	];
}

export const TOOLING_MAP_NOTES = Object.freeze([
	"Writes docs/agent-context/AGENT_TOOLING_CODE_MAP.md with one entry per mapped file: its path, leading-comment summary and sorted exports.",
	"Use --check to regenerate in memory and fail when the committed map differs.",
]);

export const TOOLING_MAP_EXITS = Object.freeze([
	[0, "map written or committed map is current"],
	[1, "invalid option, missing map, or drift"],
]);

export const NODE_USAGE_NOTES = Object.freeze({
	"check:agent-context": [
		"  node scripts/check-agent-context.mjs [--milestone <id>] [--no-tracked] [--verbose]",
	],
	"context:show": ["  node scripts/show-agent-context.mjs --milestone <id>"],
	"start-load": [
		"  node scripts/agent-environment/start-load.mjs [--root <transcripts dir>] [--limit <sessions, default 25>] [--since <YYYY-MM-DD>] [--json] | --reads <transcript.jsonl>",
	],
	"gardener:survey": [
		"  node <checkout>/.agents/skills/gardener/survey.mjs --out <absolute-fresh-run> [--temp-root <absolute-temp-root>]",
	],
	"gardener:remove-worktree": [
		"  node remove-worktree.mjs --checkout <absolute-checkout> --worktree <absolute-worktree>",
	],
});

export const CONCEPT_CSS_NOTES = Object.freeze([
	"Moved ring declaration: outline: none; /* focus-ring: .button:focus-visible .tile */",
]);

export function evidenceFolderToolEntries({ packageEntry, value, exits }) {
	return [
		packageEntry({
			name: "evidence:keep",
			invocation: "node scripts/agent-environment/evidence-keep.mjs",
			purpose:
				"Copy decision evidence into a tracked evidence folder and stage it.",
			usage: "pnpm evidence:keep <path>... --to <milestone>/<topic>",
			options: [
				value(
					"--to",
					"Evidence destination below docs/phase-records/evidence.",
					{ sample: "agent-tooling-r01/evidence-home" },
				),
			],
			requiredOptions: ["--to"],
			positionals: [],
			deferPositionalFailures: true,
			exitCodes: exits(
				[0, "Evidence copied and staged."],
				[1, "Evidence refused or copy failed."],
			),
		}),
		packageEntry({
			name: "run-folder:new",
			invocation: "node scripts/agent-environment/run-folder.mjs",
			purpose:
				"Create a named temporary run folder with a provenance manifest.",
			usage:
				"pnpm run-folder:new <name> --brief <file> --for <who> [--report <path>]",
			options: [
				value("--brief", "Tracked brief to copy and hash.", {
					sample: "docs/agent-context/briefs/codex.md",
					pathKind: "file",
				}),
				value("--for", "Person or agent that owns the run folder.", {
					sample: "coordinator",
				}),
				value("--report", "Report path, relative to the run folder.", {
					sample: "REPORT.md",
				}),
			],
			requiredOptions: ["--brief", "--for"],
			positionals: [
				{
					name: "name",
					required: true,
					sample: "codex-round-evidence-home",
				},
			],
			exitCodes: exits(
				[0, "Run folder created."],
				[1, "Run folder refused or failed."],
			),
		}),
	];
}
