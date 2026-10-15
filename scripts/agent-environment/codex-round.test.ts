import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	chmodSync,
	copyFileSync,
	type Dirent,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	realpathSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setReviewSourcePlaceObserver } from "./check-brief.mjs";
import { copyReviewSources, outcomeIdsFromBrief } from "./codex-round.mjs";
import { pathKey, samePath } from "./path-identity.mjs";

vi.setConfig({ testTimeout: 60_000 });

vi.mock("node:fs", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs")>();
	return {
		...actual,
		readFileSync: vi.fn((...args: unknown[]) => {
			const log = Reflect.get(
				globalThis,
				Symbol.for("fitway.review-source-access-test"),
			);
			if (Array.isArray(log))
				log.push({
					type: "read",
					route: "readFileSync",
					value: args[0],
				});
			return (
				actual.readFileSync as unknown as (...values: unknown[]) => unknown
			)(...args);
		}),
		createReadStream: vi.fn((...args: unknown[]) => {
			const log = Reflect.get(
				globalThis,
				Symbol.for("fitway.review-source-access-test"),
			);
			if (Array.isArray(log))
				log.push({
					type: "read",
					route: "createReadStream",
					value: args[0],
				});
			return (
				actual.createReadStream as unknown as (...values: unknown[]) => unknown
			)(...args);
		}),
	};
});

vi.mock("node:fs/promises", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:fs/promises")>();
	return {
		...actual,
		readFile: vi.fn((...args: unknown[]) => {
			const log = Reflect.get(
				globalThis,
				Symbol.for("fitway.review-source-access-test"),
			);
			if (Array.isArray(log))
				log.push({
					type: "read",
					route: "readFile",
					value: args[0],
				});
			return (actual.readFile as unknown as (...values: unknown[]) => unknown)(
				...args,
			);
		}),
	};
});

vi.mock("node:child_process", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:child_process")>();
	const recordGitShow = (args: unknown[]) => {
		const command = args[0];
		const commandArgs = args[1];
		if (
			command === "git" &&
			Array.isArray(commandArgs) &&
			commandArgs[0] === "show"
		) {
			const log = Reflect.get(
				globalThis,
				Symbol.for("fitway.review-source-access-test"),
			);
			if (Array.isArray(log))
				log.push({
					type: "read",
					route: "git-show",
					value: commandArgs[2],
				});
		}
	};
	return {
		...actual,
		execFileSync: vi.fn((...args: unknown[]) => {
			recordGitShow(args);
			return (
				actual.execFileSync as unknown as (...values: unknown[]) => unknown
			)(...args);
		}),
		spawnSync: vi.fn((...args: unknown[]) => {
			recordGitShow(args);
			return (actual.spawnSync as unknown as (...values: unknown[]) => unknown)(
				...args,
			);
		}),
	};
});

const repository = fileURLToPath(new URL("../../", import.meta.url));
const script =
	process.env.FITWAY_ROUND_TEST_SCRIPT ||
	path.join(repository, "scripts/agent-environment/codex-round.mjs");
const GPT_MODEL = "gpt-6.1-sol";
const DEEPSEEK_MODEL = "deepseek-v4.1-flash";
const environment = readFileSync(
	path.join(repository, "docs/agent-context/briefs/ENVIRONMENT.md"),
	"utf8",
);
const roots: string[] = [];
const thread = "fixture-thread-123";
const testRoot = process.env.FITWAY_ROUND_TEST_ROOT || tmpdir();
const reviewDocument = readFileSync(
	path.join(repository, "docs/agent-context/briefs/REVIEW.md"),
	"utf8",
);
const realReviewRoot = path.join(
	repository,
	"scripts/agent-environment/fixtures/codex-round-reviews",
);
const realReviews = [
	[
		"codex-deepseek-route-1",
		5,
		"9fb578a4f2058bb874de56b2444de6fd9a4916f39bd464959d3274b9ac8a0e47",
	],
	[
		"codex-launcher-fixes-1",
		5,
		"a03abe85d0a910b4b06710b527648cbf94af46770694ec7ec1d92eaf10ef53ac",
	],
	[
		"codex-launcher-fixes-2-1",
		5,
		"e2dc96567962afe9188852675f96a733d372f2d115d28db3ce18e7ec40395aae",
	],
	[
		"codex-shared-frame-continue-2-1",
		5,
		"d5c51041342ab96bb6d0a1a87c494eac50a604ae223ef722318617b880574559",
	],
	[
		"codex-shared-frame-continue-2-5",
		5,
		"5ea8019a401b3c35c068f4e00c30891f5224dd03903171136f7e17933408be52",
	],
	[
		"codex-vf-parallel-1",
		5,
		"8dd1c09476355668752582451bb04c5278060248049ee6dd4a2706c089fd0123",
	],
	[
		"codex-vf-parallel-continue-1",
		5,
		"3b8ac11ecc7603100c77d70f9986dc7547531650074a24cf2bb723aa92fd869d",
	],
	[
		"codex-vf-parallel-continue-2-1",
		5,
		"207d917ccb6135b54403d8d97e60cf10334492199259fd2617b24e445322c705",
	],
	[
		"codex-vf-parallel-continue-2-2",
		5,
		"5a141c9a5c552a2edbfae2786201cff48f4ddbcfc797ce460f2560216103c41c",
	],
	[
		"gardener-fix-1",
		5,
		"4bdbb12f132f75b0941a7b1c48f36dba986f6cae1b9f0ace75985091700001bf",
	],
	[
		"gardener-shared-1",
		4,
		"4ec6de261399a92d8c5bd70da61e318a75e51bba9e12b16f14762e2476bd41b6",
	],
	[
		"launch-review-1",
		5,
		"b6881c2048e4f8a328c01d25ea3bbe43fa9b5260ba71532afbea2353d652d20c",
	],
	[
		"shared-frame-1",
		4,
		"6cbe5347a7178713d9a186ad4152b7e6bcc73db3b34926a632de35525fab73f2",
	],
	[
		"shared-frame-2",
		5,
		"98ae005206506437c2da705d87a719cdf611b40601b99bd8d9b32bc7bb7584b1",
	],
	[
		"shared-frame-continue-1",
		5,
		"98193158be85224a53538c649e44ba44f2d8128653032e450c2252270c398153",
	],
	[
		"vf-hold-1",
		4,
		"41dff2096d0544e8e3d1fae2a7a312331b3a5f78a8af77b0845da87845a3eaa8",
	],
	[
		"vf-speed-1",
		3,
		"6f53ea7e1398754e61940614c6bbd9907eb52f35962d366340f25f0d5333c39b",
	],
] as const;

function expectedReviewBlocks(answer: string) {
	const blocks = (starts: RegExpMatchArray[]) =>
		starts.map((start, index) =>
			answer
				.slice(start.index, starts[index + 1]?.index ?? answer.length)
				.trim(),
		);
	const numbered = [...answer.matchAll(/^\d+[.)]\s+\*\*[^\n]+\*\*\s*$/gm)];
	if (numbered[0]?.index === 0) return blocks(numbered);
	const atx = [
		...answer.matchAll(
			/^#{1,6}\s+(?:\d+[.)]\s+|Reading\s+\d+\b)[^\n]*\b[A-Z]+\d+\b[^\n]*$/gim,
		),
	];
	if (atx[0]?.index === 0) return blocks(atx);
	const bold = [
		...answer.matchAll(/^\*\*\d+[.)]\s+[^\n]*\b[A-Z]+\d+\b[^\n]*\*\*\s*$/gm),
	];
	return blocks(bold);
}

const readingAnswer = `## Reading 1: R1

1. Outcome exploited: R1.
2. Literal reading: Meet the stated check without meeting its intent.
3. What would go wrong: The goal would remain unmet.
4. One-line change: State the intended observable result.

## Reading 2: L1

1. Limit exploited: L1.
2. Literal reading: Keep a result while changing its inputs.
3. What would go wrong: The result would no longer prove the goal.
4. One-line change: Preserve the inputs as well.
`;

function briefHash(brief: string) {
	return createHash("sha256").update(readFileSync(brief)).digest("hex");
}

function findGitBash(searchPath = process.env.PATH ?? "") {
	// Find Bash in Git's installation, never the unrelated bash first on PATH.
	for (const entry of searchPath.split(path.delimiter)) {
		if (!entry) continue;
		const executable = path.resolve(entry.replace(/^"|"$/g, ""), "git.exe");
		if (!existsSync(executable)) continue;
		let directory = path.dirname(realpathSync.native(executable));
		// Git exposes git.exe through cmd, bin, or mingw{32,64}/bin.
		for (let depth = 0; depth < 3; depth += 1) {
			const bash = path.join(directory, "usr", "bin", "bash.exe");
			if (existsSync(bash)) return bash;
			directory = path.dirname(directory);
		}
	}
	throw new Error(
		"Git for Windows Bash is missing (required for shell parity)",
	);
}

function git(root: string, ...args: string[]) {
	return execFileSync("git", args, {
		cwd: root,
		encoding: "utf8",
		windowsHide: true,
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
}

function initialize(root: string) {
	mkdirSync(root);
	git(root, "init", "--initial-branch=fixture");
	git(root, "config", "user.name", "Round fixture");
	git(root, "config", "user.email", "round@example.invalid");
	git(root, "config", "commit.gpgsign", "false");
	git(root, "config", "core.autocrlf", "false");
	git(root, "config", "core.hooksPath", path.join(root, "no-hooks"));
	git(root, "commit", "--allow-empty", "-m", "fixture base");
}

async function captureReviewSourceAccess(action: () => Promise<unknown>) {
	const accessKey = Symbol.for("fitway.review-source-access-test");
	const events: {
		type: "place" | "read";
		kind?: string;
		route?: string;
		value?: unknown;
	}[] = [];
	Reflect.set(globalThis, accessKey, events);
	setReviewSourcePlaceObserver((event) => {
		events.push({ type: "place", ...event });
	});
	try {
		await action();
		return events;
	} finally {
		setReviewSourcePlaceObserver(undefined);
		Reflect.deleteProperty(globalThis, accessKey);
	}
}

function shortWindowsPath(value: string) {
	const result = spawnSync(
		"powershell.exe",
		[
			"-NoProfile",
			"-Command",
			"(New-Object -ComObject Scripting.FileSystemObject).GetFolder($env:FITWAY_SHORT_PATH).ShortPath",
		],
		{
			encoding: "utf8",
			env: { ...process.env, FITWAY_SHORT_PATH: value },
			windowsHide: true,
		},
	);
	if (result.error) throw result.error;
	if (result.status !== 0)
		throw new Error(`short path lookup failed: ${result.stderr}`);
	return result.stdout.trim();
}

function firstShortWindowsPath() {
	const drives: string[] = [];
	for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
		const drive = `${letter}:/`;
		try {
			readdirSync(drive);
			drives.push(drive);
		} catch {
			// A missing or unavailable drive is not a short-name candidate.
		}
	}
	for (const drive of drives) {
		let entries: Dirent[];
		try {
			entries = readdirSync(drive, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			const long = path.join(drive, entry.name);
			try {
				const short = shortWindowsPath(long);
				if (short.includes("~")) return { drives, long, short };
			} catch {
				// Some system folders reject a short-name lookup.
			}
		}
	}
	return { drives };
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		const absolute = realpathSync.native(root);
		const relative = path.relative(realpathSync.native(testRoot), absolute);
		if (path.isAbsolute(relative) || !relative.startsWith("fitway-round-test-"))
			throw new Error(`Unsafe fixture cleanup: ${absolute}`);
		rmSync(absolute, { recursive: true, force: true });
	}
});

function fixture(eol = "\n") {
	mkdirSync(testRoot, { recursive: true });
	const root = mkdtempSync(path.join(testRoot, "fitway-round-test-"));
	roots.push(root);
	const worktree = path.join(root, "build space «العربية»");
	const coordinator = path.join(root, "coordinator");
	initialize(worktree);
	initialize(coordinator);
	const head = git(worktree, "rev-parse", "HEAD");
	const brief = path.join(coordinator, "brief.md");
	const bytes = Buffer.from(
		`<!-- brief-format: v1 role: codex -->\n# Fixture\n\n- **Worktree:** \`${worktree.replaceAll("\\", "/")}\`, branch \`fixture\`, HEAD \`${head.slice(0, 8)}\`\n\n${environment.replaceAll("\r\n", "\n")}\n## Goal\n\nالنص «كما هو»\n\n## Causes and required outcomes\n\n- **K1.** Fixture outcome.\n`.replaceAll(
			"\n",
			eol,
		),
	);
	writeFileSync(brief, bytes);
	git(coordinator, "add", ".");
	git(coordinator, "commit", "-m", "tracked brief");
	const bin = path.join(root, "bin");
	mkdirSync(bin);
	const standin = path.join(bin, "stand-in.cjs");
	writeFileSync(
		standin,
		`const fs = require('node:fs');
const args = process.argv.slice(2);
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  if (args.includes('read-only')) {
    const capture = {args, cwd:process.cwd(), input:Buffer.concat(chunks).toString('base64'), env:{TEMP:process.env.TEMP,TMP:process.env.TMP}, files:fs.readdirSync(process.cwd())};
    fs.appendFileSync(process.env.ROUND_REVIEW_CAPTURE, JSON.stringify(capture) + '\\n');
    if (!process.env.REVIEW_NO_ANSWER) fs.writeFileSync(args[args.indexOf('-o') + 1], process.env.REVIEW_ANSWER_FILE ? fs.readFileSync(process.env.REVIEW_ANSWER_FILE) : process.env.REVIEW_ANSWER || 'No such readings.\\n');
    process.stdout.write('stand-in review\\n');
    process.exitCode = Number(process.env.REVIEW_EXIT || 0);
    return;
  }
  if (process.env.ROUND_WRITE_PATH) fs.writeFileSync(process.env.ROUND_WRITE_PATH, Buffer.from(process.env.ROUND_WRITE_CONTENT, 'base64'));
  if (process.env.ROUND_REMOVE_PATH) fs.unlinkSync(process.env.ROUND_REMOVE_PATH);
  fs.writeFileSync(process.env.ROUND_CAPTURE, JSON.stringify({args, cwd:process.cwd(), input:Buffer.concat(chunks).toString('base64'), env:{TEMP:process.env.TEMP,TMP:process.env.TMP}}));
  const sequenceFile = process.env.ROUND_SEQUENCE_FILE;
  let sequenceIndex = 0;
  if (sequenceFile) {
    try { sequenceIndex = Number(fs.readFileSync(sequenceFile, 'utf8')) || 0; } catch {}
    fs.writeFileSync(sequenceFile, String(sequenceIndex + 1));
  }
  const messages = process.env.ROUND_MESSAGES ? JSON.parse(process.env.ROUND_MESSAGES) : null;
  const exits = process.env.ROUND_EXITS ? JSON.parse(process.env.ROUND_EXITS) : null;
  const isResume = args.includes('resume');
  const fallback = isResume ? 'stand-in resumed message\\nK1: PASS\\n' : 'stand-in last message\\nK1: PASS\\n';
  const configuredMessage = isResume && process.env.ROUND_RESUME_MESSAGE !== undefined
    ? process.env.ROUND_RESUME_MESSAGE
    : process.env.ROUND_MESSAGE;
  const message = messages
    ? (messages[sequenceIndex] ?? messages[messages.length - 1])
    : (configuredMessage ?? fallback);
  const defaultExit = isResume && process.env.ROUND_RESUME_EXIT !== undefined
    ? process.env.ROUND_RESUME_EXIT
    : process.env.ROUND_EXIT;
  const exitCode = exits
    ? (exits[sequenceIndex] ?? exits[exits.length - 1])
    : defaultExit;
  fs.writeFileSync(args[args.indexOf('-o') + 1], message);
  process.stdout.write('{"type":"thread.star');
  process.stdout.write('ted","thread_id":"${thread}"}\\n');
  process.stdout.write('{"type":"item.completed","text":"العربية «»"}\\r\\n');
  process.exitCode = Number(exitCode || 0);
});\n`,
	);
	if (process.platform === "win32") {
		writeFileSync(
			path.join(bin, "codex.cmd"),
			`@"${process.execPath}" "%~dp0stand-in.cjs" %*\r\n`,
		);
	} else {
		const executable = path.join(bin, "codex");
		writeFileSync(
			executable,
			`#!/bin/sh\nexec '${process.execPath.replaceAll("'", "'\\''")}' '${standin.replaceAll("'", "'\\''")}' "$@"\n`,
		);
		chmodSync(executable, 0o755);
	}
	const capture = path.join(root, "capture.json");
	const reviewCapture = path.join(root, "review-capture.jsonl");
	const reviewRoot = path.join(root, "reviews");
	const run = path.join(root, "run");
	// Never read the machine's own Codex sessions.
	const codexHome = path.join(root, "codex-home");
	mkdirSync(codexHome, { recursive: true });
	writeFileSync(
		path.join(codexHome, "models_cache.json"),
		`${JSON.stringify(
			{
				models: [
					{
						slug: "gpt-5.5",
						display_name: "GPT-5.5",
						description: "Legacy coding model.",
						default_reasoning_level: "medium",
						supported_reasoning_levels: [
							{ effort: "low", description: "low" },
							{ effort: "medium", description: "medium" },
							{ effort: "high", description: "high" },
							{ effort: "xhigh", description: "xhigh" },
						],
						shell_type: "unified_exec",
						visibility: "hide",
						supported_in_api: true,
						priority: 13,
						additional_speed_tiers: ["fast"],
						service_tiers: [
							{
								id: "priority",
								name: "Fast",
								description: "fast",
							},
						],
						available_access_programs: { cyber: ["standard"] },
						availability_nux: null,
						upgrade: {
							model: "gpt-6.1-sol",
							migration_markdown: "fixture",
							retirement_at: "2026-10-14T19:00:00Z",
						},
						model_messages: {
							instructions_template: "fixture instructions",
							approvals: null,
							collaboration_modes: null,
							auto_review: null,
							permissions: null,
							multi_agent: null,
						},
						include_skills_usage_instructions: true,
						include_plugin_usage_instructions: true,
						include_apps_usage_instructions: true,
						default_reasoning_summary: "none",
						support_verbosity: true,
						default_verbosity: "low",
						apply_patch_tool_type: "freeform",
						web_search_tool_type: "text_and_image",
						truncation_policy: { mode: "tokens", limit: 10000 },
						supports_image_detail_original: true,
						context_window: 272000,
						max_context_window: 272000,
						comp_hash: "2911",
						effective_context_window_percent: 95,
						experimental_supported_tools: [],
						input_modalities: ["text", "image"],
						supports_search_tool: true,
						supports_experimental_context: false,
						use_responses_lite: false,
						supports_reasoning_effort_updates: false,
						node_repl_auto_review_required: false,
						node_repl_disabled: false,
					},
				],
			},
			null,
			2,
		)}\n`,
	);
	const env: NodeJS.ProcessEnv = {
		...process.env,
		PATH: `${bin}${path.delimiter}${process.env.PATH}`,
		ROUND_CAPTURE: capture,
		ROUND_REVIEW_CAPTURE: reviewCapture,
		FITWAY_BRIEF_REVIEW_ROOT: reviewRoot,
		CODEX_HOME: codexHome,
		FITWAY_DEEPSEEK_CATALOG_SOURCE: path.join(codexHome, "models_cache.json"),
		OPENDESIGN_API_KEY: "fixture-opendesign-key",
	};
	delete env.MSYSTEM;
	const invokeRaw = (args: string[], extraEnv = {}, cwd = root) => {
		const result = spawnSync(process.execPath, [script, ...args], {
			cwd,
			env: { ...env, ...extraEnv },
			encoding: "utf8",
			windowsHide: true,
		});
		if (result.error) throw result.error;
		if (process.env.FITWAY_ROUND_TEST_SCRIPT && existsSync(capture))
			console.log(
				`Mutation evidence: stand-in recorded ${captured().args.includes("resume") ? "resume" : "launch"}; status ${result.status}`,
			);
		return { ...result, output: result.stdout + result.stderr };
	};
	const invoke = (args?: string[], extraEnv = {}, cwd = root) => {
		const effective = args ?? [brief, "high", "--run", run];
		const legacyLaunch =
			effective[0] !== "resume" &&
			!effective.includes("--help") &&
			!effective[0]?.startsWith("-") &&
			!effective.includes("--model");
		if (!legacyLaunch) return invokeRaw(effective, extraEnv, cwd);
		const insertAt = effective[1]?.startsWith("-") ? 1 : 2;
		return invokeRaw(
			[
				...effective.slice(0, insertAt),
				"--model",
				GPT_MODEL,
				...effective.slice(insertAt),
			],
			extraEnv,
			cwd,
		);
	};
	const captured = () => JSON.parse(readFileSync(capture, "utf8"));
	const reviewCalls = () =>
		existsSync(reviewCapture)
			? readFileSync(reviewCapture, "utf8")
					.trim()
					.split("\n")
					.map((line) => JSON.parse(line))
			: [];
	const answerReview = (
		answer = "No such readings.\n",
		dispositions?: string,
		number = 1,
	) => {
		const folder = path.join(reviewRoot, `brief-${number}`);
		mkdirSync(folder, { recursive: true });
		writeFileSync(path.join(folder, "brief.md"), readFileSync(brief));
		writeFileSync(path.join(folder, "last.md"), answer);
		writeFileSync(
			path.join(folder, "dispositions.md"),
			dispositions ?? `Brief SHA-256: ${briefHash(brief)}\n`,
		);
		return folder;
	};
	answerReview();
	const laterHead = () => {
		writeFileSync(path.join(worktree, "launch.md"), "# Brief commit\n");
		git(worktree, "add", ".");
		git(worktree, "commit", "-m", "brief over named head");
		return git(worktree, "rev-parse", "HEAD");
	};
	return {
		root,
		worktree,
		coordinator,
		head,
		brief,
		bytes,
		bin,
		capture,
		reviewRoot,
		reviewCapture,
		reviewCalls,
		answerReview,
		run,
		codexHome,
		env,
		invoke,
		invokeRaw,
		captured,
		laterHead,
	};
}

function tokenCount(input: number | null, total = input) {
	return JSON.stringify({
		type: "event_msg",
		payload: {
			type: "token_count",
			info:
				input === null
					? null
					: {
							total_token_usage: {
								input_tokens: total,
								cached_input_tokens: 0,
							},
							last_token_usage: {
								input_tokens: input,
								cached_input_tokens: 7296,
							},
						},
		},
	});
}

function session(
	f: ReturnType<typeof fixture>,
	threadId: string,
	lines: string[],
	day = "2026/10/09",
) {
	const folder = path.join(f.codexHome, "sessions", ...day.split("/"));
	mkdirSync(folder, { recursive: true });
	writeFileSync(
		path.join(folder, `rollout-2026-10-09T10-00-00-${threadId}.jsonl`),
		`${lines.join("\n")}\n`,
	);
}

function expectedArgs(
	f: ReturnType<typeof fixture>,
	last: string,
	resume = false,
) {
	return [
		"exec",
		"--approve-for-me",
		"-C",
		f.worktree,
		"-m",
		"gpt-6.1-sol",
		"-c",
		"model_reasoning_effort=high",
		"--json",
		"-o",
		path.join(f.run, last),
		...(resume ? ["resume", thread] : []),
		"-",
	];
}

function expectedDeepSeekArgs(
	f: ReturnType<typeof fixture>,
	last: string,
	resume = false,
) {
	const catalog = path.join(f.run, "model-catalog.json").replaceAll("\\", "/");
	return [
		"exec",
		"--approve-for-me",
		"-C",
		f.worktree,
		"-m",
		DEEPSEEK_MODEL,
		"-c",
		"model_provider=opendesign",
		"-c",
		'model_providers.opendesign={name="OpenDesign",base_url="https://amr-link.open-design.ai/v1",env_key="OPENDESIGN_API_KEY",wire_api="responses"}',
		"-c",
		`model_catalog_json=${JSON.stringify(catalog)}`,
		"-c",
		"model_reasoning_effort=max",
		"-c",
		"web_search=disabled",
		"-c",
		"features.hooks=false",
		"--json",
		"-o",
		path.join(f.run, last),
		...(resume ? ["resume", thread] : []),
		"-",
	];
}

// Only -C and -o carry paths; keep flags, order and other values exact.
async function argumentKeys(args: string[]) {
	return Promise.all(
		args.map((value, index) =>
			index === 3 || index === 10 ? pathKey(value) : value,
		),
	);
}

async function captureKeys(capture: {
	args: string[];
	cwd: string;
	input: string;
}) {
	return {
		...capture,
		args: await argumentKeys(capture.args),
		cwd: await pathKey(capture.cwd),
	};
}

function refused(
	f: ReturnType<typeof fixture>,
	result: ReturnType<ReturnType<typeof fixture>["invoke"]>,
	reason: string,
) {
	expect(result.status, result.output).toBe(1);
	expect(result.stderr.trim().split(/\r?\n/)).toHaveLength(1);
	expect(result.stderr).toContain(reason);
	expect(existsSync(f.capture)).toBe(false);
}

function requiredFixture(kind = "repository", marked = true) {
	const f = fixture();
	const target = path.join(
		kind === "absolute" ? f.root : f.worktree,
		"required.bin",
	);
	const before = Buffer.from([0, 255, 128, 1]);
	writeFileSync(target, before);
	if (kind === "folder") {
		rmSync(target);
		mkdirSync(target);
		mkdirSync(path.join(target, "nested"));
		writeFileSync(path.join(target, "nested", "file.bin"), before);
		writeFileSync(path.join(target, "other.bin"), "unchanged");
	}
	git(f.worktree, "add", ".");
	git(f.worktree, "commit", "--allow-empty", "-m", "required content");
	const named =
		kind === "absolute" ? target.replaceAll("\\", "/") : "required.bin";
	const outcome = `- **Outcome C1:** Update \`${named}\`${marked ? " (must change)" : ""}.`;
	const input = f.bytes
		.toString("utf8")
		.replace(
			f.head.slice(0, 8),
			git(f.worktree, "rev-parse", "--short=8", "HEAD"),
		);
	const brief = `${input}\n## Causes and required outcomes\n\n${outcome}\n`;
	writeFileSync(f.brief, brief);
	git(f.coordinator, "add", ".");
	git(f.coordinator, "commit", "-m", "required outcome");
	f.answerReview();
	return {
		...f,
		target,
		before,
		named,
		outcome,
		line: brief.split("\n").indexOf(outcome) + 1,
	};
}

function comparison(f: ReturnType<typeof requiredFixture>, suffix = "") {
	return JSON.parse(
		readFileSync(path.join(f.run, `required-changes${suffix}.json`), "utf8"),
	);
}

function reviewRefused(
	f: ReturnType<typeof fixture>,
	result: ReturnType<ReturnType<typeof fixture>["invoke"]>,
	reason: string,
) {
	// Check the consequence first, so a removed gate fails on an actual launch.
	expect(
		existsSync(f.capture),
		"refusal must prevent the stand-in launch",
	).toBe(false);
	refused(f, result, reason);
	expect(result.stdout).toContain(
		`Current brief SHA-256: ${briefHash(f.brief)}`,
	);
	expect(existsSync(f.run)).toBe(false);
}

describe("D1 model choice, catalog, and resume", () => {
	it("defaults to DeepSeek max and records the catalog and its hash", () => {
		const f = fixture();
		const result = f.invokeRaw([f.brief, "--run", f.run]);
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toEqual(
			expectedDeepSeekArgs(f, "last-message.md"),
		);
		const metadata = JSON.parse(
			readFileSync(path.join(f.run, "run.json"), "utf8"),
		);
		expect(metadata).toMatchObject({
			model: DEEPSEEK_MODEL,
			level: "max",
		});
		const catalogBytes = readFileSync(path.join(f.run, "model-catalog.json"));
		expect(metadata.catalogSha256).toBe(
			createHash("sha256").update(catalogBytes).digest("hex"),
		);
		const catalog = JSON.parse(catalogBytes.toString("utf8"));
		expect(catalog.models[0]).toMatchObject({
			slug: DEEPSEEK_MODEL,
			display_name: "DeepSeek V4.1 Flash (Open Design)",
			default_reasoning_level: "high",
			supported_reasoning_levels: [
				{ effort: "high", description: "high" },
				{ effort: "max", description: "max" },
			],
			priority: 99,
			apply_patch_tool_type: "freeform",
			web_search_tool_type: "text",
			context_window: 900000,
			max_context_window: 1000000,
			input_modalities: ["text"],
			supports_search_tool: false,
		});
		expect(catalog.models[0]).not.toHaveProperty("comp_hash");
	});

	it("accepts GPT max without DeepSeek route arguments or a key", () => {
		const f = fixture();
		const result = f.invoke(
			[f.brief, "max", "--model", GPT_MODEL, "--run", f.run],
			{ OPENDESIGN_API_KEY: "" },
		);
		expect(result.status, result.output).toBe(0);
		const args = f.captured().args;
		expect(args).toContain(GPT_MODEL);
		expect(args).toContain("model_reasoning_effort=max");
		expect(args.some((value) => value.startsWith("model_provider="))).toBe(
			false,
		);
		expect(
			JSON.parse(readFileSync(path.join(f.run, "run.json"), "utf8")),
		).toMatchObject({ model: GPT_MODEL, level: "max" });
	});

	it.each([
		["unsupported model", "high", "not-a-model", [DEEPSEEK_MODEL, GPT_MODEL]],
		["unsupported DeepSeek level", "medium", DEEPSEEK_MODEL, ["high", "max"]],
		["unsupported DeepSeek level", "xhigh", DEEPSEEK_MODEL, ["high", "max"]],
	])("refuses %s before Codex starts", (_name, level, model, accepted) => {
		const f = fixture();
		const result = f.invokeRaw([
			f.brief,
			level,
			"--model",
			model,
			"--run",
			f.run,
		]);
		refused(f, result, String(accepted[0]));
		expect(result.stderr).toContain(String(accepted[1]));
	});

	it("uses the model and level recorded for resume", () => {
		const f = fixture();
		expect(f.invokeRaw([f.brief, "--run", f.run]).status).toBe(0);
		rmSync(f.capture);
		const result = f.invokeRaw(["resume", f.run]);
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toEqual(
			expectedDeepSeekArgs(f, "last-message.md", true),
		);
		expect(
			JSON.parse(readFileSync(path.join(f.run, "run.json"), "utf8")),
		).toMatchObject({ model: DEEPSEEK_MODEL, level: "max" });
	});
});

describe("D2 absent catalog and missing key gates", () => {
	it("refuses a missing catalog source and names the file", () => {
		const f = fixture();
		const source = path.join(f.codexHome, "models_cache.json");
		rmSync(source);
		const result = f.invokeRaw([f.brief, "--run", f.run], {
			OPENDESIGN_API_KEY: "test-only",
		});
		refused(f, result, "DeepSeek catalog source not found");
		expect(result.stderr).toContain(source);
		expect(existsSync(f.run)).toBe(false);
	});

	it.each([
		["no entry", '{"models":[]}\n'],
		["two entries", '{"models":[{"slug":"a"},{"slug":"b"}]}\n'],
	])("refuses a catalog source with %s", (_name, content) => {
		const f = fixture();
		const source = path.join(f.codexHome, "models_cache.json");
		writeFileSync(source, content);
		const result = f.invokeRaw([f.brief, "--run", f.run], {
			OPENDESIGN_API_KEY: "test-only",
		});
		refused(
			f,
			result,
			"DeepSeek catalog source must hold exactly one model entry",
		);
		expect(result.stderr).toContain(source);
		expect(existsSync(f.run)).toBe(false);
	});

	it("builds the catalog from the source, whatever Codex's own cache holds", () => {
		const f = fixture();
		const source = path.join(f.root, "pinned-source.json");
		writeFileSync(
			source,
			readFileSync(path.join(f.codexHome, "models_cache.json")),
		);
		writeFileSync(
			path.join(f.codexHome, "models_cache.json"),
			'{"models":[{"slug":"gpt-6.1-sol"}]}\n',
		);
		const result = f.invokeRaw([f.brief, "--run", f.run], {
			FITWAY_DEEPSEEK_CATALOG_SOURCE: source,
		});
		expect(result.status, result.output).toBe(0);
		const catalog = JSON.parse(
			readFileSync(path.join(f.run, "model-catalog.json"), "utf8"),
		);
		expect(catalog.models[0]).toMatchObject({
			slug: DEEPSEEK_MODEL,
			model_messages: { instructions_template: "fixture instructions" },
		});
	});

	it("requires OPENDESIGN_API_KEY before DeepSeek review, launch, or resume", () => {
		const review = fixture();
		rmSync(review.reviewRoot, { recursive: true });
		const reviewResult = review.invoke(undefined, {
			OPENDESIGN_API_KEY: "",
		});
		refused(review, reviewResult, "OPENDESIGN_API_KEY");
		expect(review.reviewCalls()).toEqual([]);

		const launch = fixture();
		const launchResult = launch.invokeRaw([launch.brief, "--run", launch.run], {
			OPENDESIGN_API_KEY: "",
		});
		refused(launch, launchResult, "OPENDESIGN_API_KEY");
		expect(existsSync(launch.run)).toBe(false);

		const resume = fixture();
		expect(resume.invokeRaw([resume.brief, "--run", resume.run]).status).toBe(
			0,
		);
		rmSync(resume.capture);
		const resumeResult = resume.invokeRaw(["resume", resume.run], {
			OPENDESIGN_API_KEY: "",
		});
		refused(resume, resumeResult, "OPENDESIGN_API_KEY");
	});
});

describe("D5 review sources", () => {
	it("copies repository sources at the named HEAD and D:/fitway-temp sources", () => {
		const f = fixture();
		const absoluteDir = mkdtempSync(
			path.join("D:/fitway-temp", "round-source-"),
		);
		try {
			const repositorySource = path.join(
				f.worktree,
				"docs",
				"review-source.md",
			);
			const decisionsSource = path.join(f.worktree, "docs", "decisions.md");
			mkdirSync(path.dirname(repositorySource), { recursive: true });
			writeFileSync(repositorySource, "repository source\n");
			writeFileSync(decisionsSource, "decision one\n1. Decision\n");
			git(f.worktree, "add", ".");
			git(f.worktree, "commit", "-m", "review sources");
			const head = git(f.worktree, "rev-parse", "HEAD");

			const absoluteSource = path.join(absoluteDir, "trial.txt");
			mkdirSync(absoluteDir, { recursive: true });
			writeFileSync(absoluteSource, "temporary source\n");
			const brief = readFileSync(f.brief, "utf8")
				.replace(
					new RegExp(`HEAD \`${f.head.slice(0, 8)}\``),
					`HEAD \`${head.slice(0, 8)}\``,
				)
				.replace(
					"## Goal",
					`- **Read first, only these:**\n\n  - \`docs/review-source.md\` whole\n  - \`${absoluteSource.replaceAll("\\", "/")}\`\n\nDecisions: \`docs/decisions.md\` item 1.\n\n## Goal\n\nA later note about the "Read first" process names \`prompt.md\` but is not a source list.`,
				);
			writeFileSync(f.brief, brief);
			git(f.coordinator, "add", ".");
			git(f.coordinator, "commit", "-m", "brief names review sources");
			rmSync(f.reviewRoot, { recursive: true });

			const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
				REVIEW_ANSWER: "No such readings.\n",
			});
			reviewRefused(f, result, "record its dispositions before launching");
			const folder = path.join(f.reviewRoot, "brief-1");
			expect(
				readFileSync(path.join(folder, "sources", "docs", "review-source.md")),
			).toEqual(Buffer.from("repository source\n"));
			expect(
				readFileSync(path.join(folder, "sources", "docs", "decisions.md")),
			).toEqual(Buffer.from("decision one\n1. Decision\n"));
			const relativeAbsolute = path.relative(
				path.resolve("D:/fitway-temp"),
				absoluteSource,
			);
			expect(
				readFileSync(path.join(folder, "sources", "temp", relativeAbsolute)),
			).toEqual(Buffer.from("temporary source\n"));
			expect(existsSync(path.join(folder, "sources", "prompt.md"))).toBe(false);
		} finally {
			rmSync(absoluteDir, { recursive: true, force: true });
		}
	});

	it("copies a repository source at the named HEAD, not its working copy", async () => {
		const f = fixture();
		const source = path.join(f.worktree, "docs", "named-head-source.md");
		mkdirSync(path.dirname(source), { recursive: true });
		writeFileSync(source, "named head\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "named-head source");
		const namedHead = git(f.worktree, "rev-parse", "HEAD");
		writeFileSync(source, "working copy\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "working-copy source");
		const folder = path.join(f.root, "direct-review");
		await copyReviewSources(
			folder,
			Buffer.from(
				"## Read first, only these:\n\n- `docs/named-head-source.md`\n",
			),
			f.worktree,
			namedHead,
		);
		expect(
			readFileSync(
				path.join(folder, "sources", "docs", "named-head-source.md"),
			),
		).toEqual(Buffer.from("named head\n"));
	});

	it.each([
		"repository",
		"checkout",
		"temp",
	] as const)("checks %s review sources for the place before any read", async (kind) => {
		const f = fixture();
		let source: string;
		let head = f.head;
		let cleanup: (() => void) | undefined;
		if (kind === "repository") {
			const filename = path.join(f.worktree, "docs", "ordered-source.md");
			mkdirSync(path.dirname(filename), { recursive: true });
			writeFileSync(filename, "repository source\n");
			git(f.worktree, "add", ".");
			git(f.worktree, "commit", "-m", "ordered repository source");
			head = git(f.worktree, "rev-parse", "HEAD");
			source = "docs/ordered-source.md";
		} else if (kind === "checkout") {
			source = path
				.join(repository, "docs/agent-context/briefs/REVIEW.md")
				.replaceAll("\\", "/");
		} else {
			const directory = mkdtempSync(
				path.join("D:/fitway-temp", "round-order-"),
			);
			source = path.join(directory, "source.md").replaceAll("\\", "/");
			writeFileSync(source, "temporary source\n");
			cleanup = () => rmSync(directory, { recursive: true, force: true });
		}
		try {
			const events = await captureReviewSourceAccess(() =>
				copyReviewSources(
					path.join(f.root, `ordered-${kind}`),
					`- **Read first, only these:**\n\n- \`${source}\`\n`,
					f.worktree,
					head,
				),
			);
			const firstPlace = events.findIndex((event) => event.type === "place");
			const firstRead = events.findIndex((event) => event.type === "read");
			expect(firstPlace, kind).toBeGreaterThanOrEqual(0);
			expect(firstRead, kind).toBeGreaterThan(firstPlace);
		} finally {
			cleanup?.();
		}
	});

	it("refuses a repository source changed after the brief's named HEAD", () => {
		const f = fixture();
		const source = path.join(f.worktree, "docs", "review-source.md");
		mkdirSync(path.dirname(source), { recursive: true });
		writeFileSync(source, "named head\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "named-head source");
		const namedHead = git(f.worktree, "rev-parse", "HEAD");
		writeFileSync(source, "later head\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "-m", "later Markdown source");
		const brief = readFileSync(f.brief, "utf8")
			.replace(
				new RegExp(`HEAD \`${f.head.slice(0, 8)}\``),
				`HEAD \`${namedHead.slice(0, 8)}\``,
			)
			.replace(
				"## Goal",
				"- **Read first, only these:**\n\n  - `docs/review-source.md`\n\n## Goal",
			);
		writeFileSync(f.brief, brief);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "brief source after named head");
		rmSync(f.reviewRoot, { recursive: true, force: true });

		const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
			REVIEW_ANSWER: "No such readings.\n",
		});
		refused(f, result, "differs between named HEAD");
		expect(f.reviewCalls()).toEqual([]);
		expect(existsSync(f.reviewRoot)).toBe(false);
	});

	it.each([
		["missing repository source", "missing-review-source.md"],
		["a credential file", ".env"],
	])("refuses %s before Codex starts", (_name, source) => {
		const f = fixture();
		if (source === ".env")
			writeFileSync(path.join(f.worktree, source), "SECRET=value\n");
		git(f.worktree, "add", ".");
		git(f.worktree, "commit", "--allow-empty", "-m", source);
		const head = git(f.worktree, "rev-parse", "HEAD");
		const brief = readFileSync(f.brief, "utf8")
			.replace(
				new RegExp(`HEAD \`${f.head.slice(0, 8)}\``),
				`HEAD \`${head.slice(0, 8)}\``,
			)
			.replace(
				"## Goal",
				`## Read first, only these:\n\n- \`${source}\`\n\n## Goal`,
			);
		writeFileSync(f.brief, brief);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", `brief names ${source}`);
		rmSync(f.reviewRoot, { recursive: true });

		const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
			REVIEW_ANSWER: "No such readings.\n",
		});
		refused(f, result, source);
		expect(f.reviewCalls()).toEqual([]);
	});

	it("refuses an absolute source reached through a junction outside D:/fitway-temp", () => {
		const f = fixture();
		const linkRoot = mkdtempSync(path.join("D:/fitway-temp", "round-link-"));
		try {
			const outside = path.join(f.root, "outside-source");
			mkdirSync(outside, { recursive: true });
			writeFileSync(path.join(outside, "source.txt"), "outside source\n");
			const link = path.join(linkRoot, "escape");
			symlinkSync(
				outside,
				link,
				process.platform === "win32" ? "junction" : "dir",
			);
			const source = path.join(link, "source.txt");
			const brief = readFileSync(f.brief, "utf8").replace(
				"## Goal",
				`## Read first, only these:\n\n- \`${source.replaceAll("\\", "/")}\`\n\n## Goal`,
			);
			writeFileSync(f.brief, brief);
			git(f.coordinator, "add", ".");
			git(f.coordinator, "commit", "-m", "brief names linked source");
			rmSync(f.reviewRoot, { recursive: true, force: true });

			const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
				REVIEW_ANSWER: "No such readings.\n",
			});
			refused(
				f,
				result,
				"absolute review source is outside D:/fitway-temp and the launcher checkout",
			);
			expect(f.reviewCalls()).toEqual([]);
		} finally {
			rmSync(path.join(linkRoot, "escape"), { force: true });
			rmSync(linkRoot, { recursive: true, force: true });
		}
	});

	it("refuses an absolute source outside D:/fitway-temp", () => {
		const f = fixture();
		const source = path.join(f.root, "outside-review-source.txt");
		writeFileSync(source, "outside source\n");
		const brief = readFileSync(f.brief, "utf8").replace(
			"## Goal",
			`## Read first, only these:\n\n- \`${source.replaceAll("\\", "/")}\`\n\n## Goal`,
		);
		writeFileSync(f.brief, brief);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "brief names outside source");
		rmSync(f.reviewRoot, { recursive: true });

		const result = f.invokeRaw([f.brief, "--new-review", "--run", f.run], {
			REVIEW_ANSWER: "No such readings.\n",
		});
		refused(f, result, "absolute review source is outside D:/fitway-temp");
		expect(f.reviewCalls()).toEqual([]);
	});
});

describe("R1 pre-launch review", () => {
	it("runs an absent review from REVIEW.md and stops before launching", () => {
		const f = fixture();
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER: readingAnswer });
		reviewRefused(f, result, "record its dispositions before launching");
		const folder = path.join(f.reviewRoot, "brief-1");
		expect(result.stdout).toContain(`Review folder: ${folder}`);
		expect(result.stdout).toContain("Reading 1:");
		expect(result.stdout).toContain("Reading 2:");
		expect(result.stdout).toContain(
			`Write coordinator dispositions to: ${path.join(folder, "dispositions.md")}`,
		);
		expect(readFileSync(path.join(folder, "brief.md"))).toEqual(f.bytes);
		const prompt = reviewDocument.match(
			/^## Prompt\n\s*```text\n([\s\S]*?)^```\s*$/m,
		)?.[1];
		expect(prompt).toBeDefined();
		expect(readFileSync(path.join(folder, "prompt.md"), "utf8")).toBe(prompt);
		const [review] = f.reviewCalls();
		expect(f.reviewCalls()).toHaveLength(1);
		expect(review.args).toEqual([
			"exec",
			"-s",
			"read-only",
			"--skip-git-repo-check",
			"-C",
			folder,
			"-m",
			DEEPSEEK_MODEL,
			"-c",
			"model_provider=opendesign",
			"-c",
			'model_providers.opendesign={name="OpenDesign",base_url="https://amr-link.open-design.ai/v1",env_key="OPENDESIGN_API_KEY",wire_api="responses"}',
			"-c",
			`model_catalog_json=${JSON.stringify(
				path.join(folder, "model-catalog.json").replaceAll("\\", "/"),
			)}`,
			"-c",
			"model_reasoning_effort=max",
			"-c",
			"web_search=disabled",
			"-c",
			"features.hooks=false",
			"-o",
			`${folder}/last.md`,
			"-",
		]);
		expect(review.cwd).toBe(folder);
		expect(Buffer.from(review.input, "base64").toString("utf8")).toBe(prompt);
		expect(review.files.sort()).toEqual([
			"brief.md",
			"model-catalog.json",
			"prompt.md",
			"review.json",
			"review.log",
			"sources",
		]);
		expect(() => git(folder, "rev-parse", "--show-toplevel")).toThrow();
		expect(existsSync(path.join(folder, "dispositions.md"))).toBe(false);
	});

	it("names every unanswered reading and stops before launching", () => {
		const f = fixture();
		const folder = f.answerReview(
			readingAnswer,
			`Brief SHA-256: ${briefHash(f.brief)}\n`,
		);
		const before = readFileSync(path.join(folder, "dispositions.md"));
		const result = f.invoke();
		reviewRefused(f, result, "readings without a disposition");
		expect(result.stderr).toContain("Reading 1 (## Reading 1: R1)");
		expect(result.stderr).toContain("Reading 2 (## Reading 2: L1)");
		expect(readFileSync(path.join(folder, "dispositions.md"))).toEqual(before);
		expect(f.reviewCalls()).toEqual([]);
	});

	it.each([
		"absent",
		"left open:",
		"left open:   ",
		"dismissed",
		"closed\nReading 2: closed",
	])("refuses an unanswered or invalid disposition: %s", (answer) => {
		const f = fixture();
		const folder = f.answerReview(
			readingAnswer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: ${answer}\n`,
		);
		if (answer === "absent") rmSync(path.join(folder, "dispositions.md"));
		const result = f.invoke();
		reviewRefused(f, result, "readings without a disposition");
		expect(result.stderr).toContain("Reading 2");
	});

	it.each([
		"another hash",
		"missing hash",
		"duplicate hash",
		"brief edited",
	])("refuses dispositions that do not identify the launched brief: %s", (kind) => {
		const f = fixture();
		const hash = briefHash(f.brief);
		const namedHash = kind === "another hash" ? "0".repeat(64) : hash;
		const header =
			kind === "missing hash" ? "" : `Brief SHA-256: ${namedHash}\n`;
		f.answerReview(
			readingAnswer,
			`${header}${kind === "duplicate hash" ? header : ""}Reading 1: closed\nReading 2: left open: accepted because it does not apply here\n`,
		);
		if (kind === "brief edited") {
			writeFileSync(
				f.brief,
				Buffer.concat([f.bytes, Buffer.from("\nA clarified goal.\n")]),
			);
			git(f.coordinator, "add", ".");
			git(f.coordinator, "commit", "-m", "clarified brief after dispositions");
		}
		reviewRefused(
			f,
			f.invoke(),
			"dispositions must name the current brief SHA-256",
		);
		expect(f.reviewCalls()).toEqual([]);
	});

	it("launches with all readings answered and copies the exact review and dispositions", () => {
		const f = fixture();
		const dispositions = `Brief SHA-256: ${briefHash(f.brief)}\r\nReading 1: closed\r\nReading 2: left open: accepted because the condition is absent\r\n`;
		const folder = f.answerReview(readingAnswer, dispositions);
		const before = readdirSync(folder).map((name) => [
			name,
			readFileSync(path.join(folder, name)),
		]);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toEqual(expectedArgs(f, "last-message.md"));
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		expect(f.reviewCalls()).toEqual([]);
		expect(readFileSync(path.join(f.run, "review-readings.md"), "utf8")).toBe(
			readingAnswer,
		);
		expect(
			readFileSync(path.join(f.run, "review-dispositions.md"), "utf8"),
		).toBe(dispositions);
		expect(
			readdirSync(folder).map((name) => [
				name,
				readFileSync(path.join(folder, name)),
			]),
		).toEqual(before);
	});

	it("launches a review with no readings only after its hash is acknowledged", () => {
		const f = fixture();
		const folder = f.answerReview();
		rmSync(path.join(folder, "dispositions.md"));
		reviewRefused(
			f,
			f.invoke(),
			"dispositions must name the current brief SHA-256",
		);
		f.answerReview();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(existsSync(f.capture)).toBe(true);
		expect(readFileSync(path.join(f.run, "review-readings.md"), "utf8")).toBe(
			"No such readings.\n",
		);
		expect(f.reviewCalls()).toEqual([]);
	});

	it("requests a new review above the highest folder and stops even with no readings", () => {
		const f = fixture();
		f.answerReview("No such readings.\n", undefined, 2);
		const latest = f.answerReview("No such readings.\n", undefined, 10);
		const before = readFileSync(path.join(latest, "dispositions.md"));
		const result = f.invoke([f.brief, "high", "--new-review", "--run", f.run]);
		reviewRefused(f, result, "record its dispositions before launching");
		const folder = path.join(f.reviewRoot, "brief-11");
		expect(result.stdout).toContain(`Review folder: ${folder}`);
		expect(result.stdout).toContain("No such readings.");
		expect(f.reviewCalls()).toHaveLength(1);
		expect(existsSync(path.join(folder, "dispositions.md"))).toBe(false);
		expect(readFileSync(path.join(latest, "dispositions.md"))).toEqual(before);
		// A completed automatic review can subsequently be answered by its coordinator.
		writeFileSync(
			path.join(folder, "dispositions.md"),
			`Brief SHA-256: ${briefHash(f.brief)}\n`,
		);
		expect(f.invoke().status).toBe(0);
		expect(f.reviewCalls()).toHaveLength(1);
	});

	it("uses the newest review rather than an older answered review", () => {
		const f = fixture();
		f.answerReview(
			readingAnswer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\n`,
			10,
		);
		reviewRefused(f, f.invoke(), "Reading 2");
		expect(f.reviewCalls()).toEqual([]);
	});

	it("stops a failed Codex review, preserves it, and never falls back to an older review", () => {
		const f = fixture();
		const result = f.invoke([f.brief, "high", "--run", f.run, "--new-review"], {
			REVIEW_EXIT: "29",
		});
		reviewRefused(f, result, "Codex exit 29");
		const folder = path.join(f.reviewRoot, "brief-2");
		expect(result.stdout).toContain(`Review folder: ${folder}`);
		expect(readFileSync(path.join(folder, "brief.md"))).toEqual(f.bytes);
		expect(readFileSync(path.join(folder, "review.log"), "utf8")).toBe(
			"stand-in review\n",
		);
		expect(
			JSON.parse(readFileSync(path.join(folder, "review.json"), "utf8")),
		).toMatchObject({ status: "failed", exitCode: 29 });
		reviewRefused(f, f.invoke(), "Codex exit 29");
		expect(f.reviewCalls()).toHaveLength(1);
	});

	it.each([
		"unparseable",
		"missing",
	])("stops a %s review answer and preserves the folder", (kind) => {
		const f = fixture();
		const result = f.invoke(
			[f.brief, "high", "--run", f.run, "--new-review"],
			kind === "missing"
				? { REVIEW_NO_ANSWER: "1" }
				: { REVIEW_ANSWER: "I could not complete this review." },
		);
		reviewRefused(f, result, "answer cannot be read as readings");
		const folder = path.join(f.reviewRoot, "brief-2");
		expect(existsSync(path.join(folder, "brief.md"))).toBe(true);
		reviewRefused(f, f.invoke(), "answer cannot be read as readings");
		expect(f.reviewCalls()).toHaveLength(1);
	});

	it("accepts labelled Markdown readings with top-level numbers", () => {
		const f = fixture();
		const answer =
			"1. **R1**\n   - **Outcome:** R1\n   - **Literal reading:** The check can pass.\n   - **What would go wrong:** The intent fails.\n   - **One-line change:** Require the intent.\n\n2. **L1**\n   - **Limit:** L1\n   - **Literal reading:** Inputs can change.\n   - **Consequence:** The proof fails.\n   - **Fix:** Keep the inputs.\n";
		f.answerReview(
			answer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\n`,
		);
		expect(f.invoke().status).toBe(0);
	});

	it("accepts bare numbered readings with indented bodies and lists", () => {
		const f = fixture();
		const answer = `1. R1 permits a shortcut.
   Literal reading: the check can pass.
   1. Keep the list in the body.
   2. Do not split there.
   What goes wrong: the intent remains unmet.
2) L1 can drift.
   Literal reading: a changed input survives.
   Close: preserve the input.
`;
		f.answerReview(
			answer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\n`,
		);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(readFileSync(path.join(f.run, "review-readings.md"), "utf8")).toBe(
			answer,
		);
	});

	it("accepts readings after a multi-paragraph preface", () => {
		const f = fixture();
		const answer = `Five readings, most damaging first.

The preface spans more than one paragraph.

1. **R1** permits a shortcut.
   Literal reading: the check can pass.
   What goes wrong: the intent remains unmet.

2. **L1** can drift.
   Literal reading: a changed input survives.
   Close: preserve the input.
`;
		f.answerReview(
			answer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\n`,
		);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(readFileSync(path.join(f.run, "review-readings.md"), "utf8")).toBe(
			answer,
		);
	});

	it("reads the vf-fixes preface answer as exactly five readings", () => {
		const f = fixture();
		const answerFile = path.join(realReviewRoot, "codex-vf-fixes-1.md");
		const answer = readFileSync(answerFile);
		expect(createHash("sha256").update(answer).digest("hex")).toBe(
			"ee52b45f9c317c02cdfa90dc64bf65643a5ea5db7b95fa22108dcb57ee1d8238",
		);
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER_FILE: answerFile });
		expect(result.stdout.match(/^Reading \d+:$/gm)).toHaveLength(5);
		reviewRefused(f, result, "record its dispositions before launching");
		const folder = path.join(f.reviewRoot, "brief-1");
		writeFileSync(
			path.join(folder, "dispositions.md"),
			`Brief SHA-256: ${briefHash(f.brief)}\n${Array.from(
				{ length: 5 },
				(_, index) => `Reading ${index + 1}: closed`,
			).join("\n")}\n`,
		);
		const launched = f.invoke();
		expect(launched.status, launched.output).toBe(0);
		expect(readFileSync(path.join(f.run, "review-readings.md"))).toEqual(
			answer,
		);
	});

	it("accepts bold Reading headings with numbered labelled fields", () => {
		const f = fixture();
		const answer =
			"**Reading 1: R1**\n1. **Outcome/limit:** R1.\n2. **Literal reading:** The check can pass.\n3. **What goes wrong:** The intent fails.\n4. **One-line change:** Require the intent.\n";
		f.answerReview(
			answer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\n`,
		);
		expect(f.invoke().status).toBe(0);
	});

	it.each([
		[
			"mixed headings",
			`${readingAnswer}\n## Another reading\nThe goal can still fail.\n`,
		],
		[
			"incomplete fields",
			"## Reading 1: R1\n1. Outcome exploited: R1.\n2. Literal reading: The goal fails.\n",
		],
		[
			"too many readings",
			Array.from({ length: 3 }, () => readingAnswer).join("\n"),
		],
		[
			"none followed by a reading",
			"No such readings.\n\n## Another reading\nR1 can fail.\n",
		],
	])("refuses an ambiguous review answer: %s", (_kind, answer) => {
		const f = fixture();
		f.answerReview(
			answer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\n`,
		);
		reviewRefused(f, f.invoke(), "answer cannot be read as readings");
	});

	it("refuses a review folder inside Git before running the review", () => {
		const f = fixture();
		reviewRefused(
			f,
			f.invoke(undefined, { FITWAY_BRIEF_REVIEW_ROOT: f.coordinator }),
			"inside a Git working tree",
		);
		expect(f.reviewCalls()).toEqual([]);
	});

	it("refuses an unfinished newest review even when it has answered readings", () => {
		const f = fixture();
		const folder = f.answerReview("No such readings.\n", undefined, 2);
		writeFileSync(path.join(folder, "review.json"), '{"status":"running"}\n');
		reviewRefused(f, f.invoke(), "review failed or is unfinished");
		expect(f.reviewCalls()).toEqual([]);
	});

	it("resume neither checks reviews nor runs a requested review", () => {
		const f = fixture();
		expect(f.invoke().status).toBe(0);
		rmSync(f.reviewRoot, { recursive: true });
		writeFileSync(f.brief, "the brief is now invalid and unreviewed\n");
		const saved = readFileSync(path.join(f.run, "review-dispositions.md"));
		const result = f.invoke(["resume", f.run], {
			FITWAY_BRIEF_REVIEW_ROOT: f.coordinator,
		});
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toEqual(expectedArgs(f, "last-message.md", true));
		expect(f.reviewCalls()).toEqual([]);
		expect(readFileSync(path.join(f.run, "review-dispositions.md"))).toEqual(
			saved,
		);
		rmSync(f.capture);
		refused(f, f.invoke(["resume", f.run, "--new-review"]), "expected resume");
		expect(f.reviewCalls()).toEqual([]);
	});
});

describe("R1 real review answers", () => {
	it.each(
		realReviews,
	)("reads %s as exactly %i readings in order and permits an answered launch", (name, count, hash) => {
		const answerFile = path.join(realReviewRoot, `${name}.md`);
		const bytes = readFileSync(answerFile);
		// Frozen hashes are from the coordinator's real last.md files.
		expect(createHash("sha256").update(bytes).digest("hex")).toBe(hash);
		const answer = bytes.toString("utf8");
		// The expected blocks come directly from each answer's own Markdown;
		// no production parser or label dictionary shapes these expectations.
		const blocks = expectedReviewBlocks(answer);
		expect(blocks).toHaveLength(count);
		const f = fixture();
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER_FILE: answerFile });
		const printed = result.stdout.match(/^Reading \d+:$/gm) ?? [];
		expect(printed, "real review reading count").toHaveLength(count);
		expect(printed).toEqual(
			Array.from({ length: count }, (_, index) => `Reading ${index + 1}:`),
		);
		const section = result.stdout
			.split("Readings:\n")[1]
			?.split("\nWrite coordinator dispositions to:")[0];
		expect(section).toBe(
			blocks
				.map((block, index) => `Reading ${index + 1}:\n${block}`)
				.join("\n\n"),
		);
		reviewRefused(f, result, "record its dispositions before launching");
		const folder = path.join(f.reviewRoot, "brief-1");
		expect(readFileSync(path.join(folder, "last.md"))).toEqual(bytes);
		expect(existsSync(path.join(folder, "dispositions.md"))).toBe(false);
		const unanswered = f.invoke();
		reviewRefused(f, unanswered, "readings without a disposition");
		for (let index = 0; index < count; index += 1)
			expect(unanswered.stderr).toContain(
				`Reading ${index + 1} (${blocks[index].split(/\r?\n/)[0]})`,
			);
		const dispositions = `Brief SHA-256: ${briefHash(f.brief)}\n${Array.from({ length: count }, (_, index) => `Reading ${index + 1}: closed\n`).join("")}`;
		writeFileSync(path.join(folder, "dispositions.md"), dispositions);
		const launched = f.invoke();
		expect(launched.status, launched.output).toBe(0);
		expect(f.captured().args).toEqual(expectedArgs(f, "last-message.md"));
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		expect(f.reviewCalls()).toHaveLength(1);
		expect(readFileSync(path.join(f.run, "review-readings.md"))).toEqual(bytes);
		expect(
			readFileSync(path.join(f.run, "review-dispositions.md"), "utf8"),
		).toBe(dispositions);
	});

	it("accepts another heading level and field wording in the same structure", () => {
		const f = fixture();
		const answer = `#### 1. R1
- Outcome reference: R1.
- Concrete reading: The check can pass without the intent.
- Repair note: Require the intended observable result.

#### 2. L1
- Limit reference: L1.
- Concrete reading: A result can survive a changed input.
- Repair note: Preserve the input as well.
`;
		f.answerReview(
			answer,
			`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\n`,
		);
		expect(f.invoke().status).toBe(0);
	});

	it.each([
		[
			"a heading body with its own numbered list",
			`### 1. R1
Literal reading: the steps can be skipped:
1. read
2. edit
3. test
4. commit
What goes wrong: nothing is measured.

### 2. L1
Literal reading: the input can change.
What goes wrong: the result drifts.
One-line change: keep the input.
`,
			2,
		],
		[
			"a bold numbered start followed by body text",
			`**1)** R1 permits a shortcut.
    The check can pass without the intent.
    Close: require the observable result.

**2)** L1 can drift.
    A changed input survives.
    Close: preserve the input.
`,
			2,
		],
		[
			"deeper headings and fenced code in a reading body",
			`## 1. R1
Literal reading: a body can contain nested material.
### Example
1. keep this list
\`\`\`text
## 2. L1
1. keep this fenced line
\`\`\`
What goes wrong: the reading can be split.

## 2. L1
Literal reading: the result can drift.
What goes wrong: the proof fails.
`,
			2,
		],
	])("reads %s without splitting its body", (_name, answer, printedLines) => {
		const f = fixture();
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER: answer });
		expect(result.stdout.match(/^Reading \d+:$/gm)).toHaveLength(printedLines);
		reviewRefused(f, result, "record its dispositions before launching");
	});

	it.each([
		[
			"prose",
			"R1 permits a literal reading. The delivered work can miss the goal.",
		],
		[
			"unnumbered readings",
			readFileSync(path.join(realReviewRoot, "vf-speed-1.md"), "utf8").replace(
				/^\d+\. /gm,
				"- ",
			),
		],
		[
			"more than five numbered readings",
			`${readFileSync(path.join(realReviewRoot, "gardener-fix-1.md"), "utf8")}\n6. **X3**\n   This is a sixth reading.\n`,
		],
		[
			"numbered prose before the list",
			`Introductory prose about R1.\n\n${readFileSync(path.join(realReviewRoot, "vf-speed-1.md"), "utf8")}`,
		],
		[
			"missing reading number",
			readFileSync(path.join(realReviewRoot, "vf-speed-1.md"), "utf8").replace(
				"2. **S2",
				"4. **S2",
			),
		],
		["numbered topics without bodies", "1. R1\n2. L1\n"],
	])("refuses an invalid numbered answer: %s", (_kind, answer) => {
		const f = fixture();
		f.answerReview(answer);
		reviewRefused(f, f.invoke(), "answer cannot be read as readings");
	});

	it("refuses a bare answer whose body lists look like reading starts", () => {
		const f = fixture();
		const answer = `1. R1 permits a shortcut.
   Literal reading: the check can pass.
   1. R1 names a body item.
   2. L1 names another body item.
2. L1 can drift.
   Literal reading: a changed input survives.
`;
		f.answerReview(answer);
		reviewRefused(f, f.invoke(), "answer cannot be read as readings");
	});

	it.each([
		"No readings.",
		"The brief has no such reading.",
		"I found no literal readings.",
	])("reads a no-readings answer as none: %s", (answer) => {
		const f = fixture();
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke(undefined, { REVIEW_ANSWER: answer });
		expect(result.stdout).toContain("Readings:\nNo such readings.\n");
		expect(result.stdout.match(/^Reading \d+:$/gm) ?? []).toEqual([]);
		reviewRefused(f, result, "record its dispositions before launching");
		writeFileSync(
			path.join(f.reviewRoot, "brief-1", "dispositions.md"),
			`Brief SHA-256: ${briefHash(f.brief)}\n`,
		);
		expect(f.invoke().status).toBe(0);
	});
});

describe("C1 required changes", () => {
	it.each([
		["repository", false],
		["repository", true],
		["absolute", false],
		["absolute", true],
	] as const)("records a marked %s file (changed: %s)", (kind, changed) => {
		const f = requiredFixture(kind);
		const result = f.invoke(
			undefined,
			changed
				? {
						ROUND_WRITE_PATH: f.target,
						ROUND_WRITE_CONTENT: Buffer.from([0, 255, 128, 2]).toString(
							"base64",
						),
					}
				: {},
		);
		expect(result.status, result.output).toBe(0);
		const [record] = comparison(f);
		expect(record).toMatchObject({
			path: f.named,
			line: f.line,
			outcome: f.outcome,
			changed,
		});
		const baseline = JSON.parse(
			readFileSync(path.join(f.run, "run.json"), "utf8"),
		).requiredChanges[0];
		expect(baseline.before).toEqual({
			kind: "file",
			sha256: createHash("sha256").update(f.before).digest("hex"),
		});
		const warning = `Required change unchanged: ${f.named} (brief line ${f.line}: ${f.outcome})`;
		if (changed)
			expect(result.stdout).not.toContain("Required change unchanged:");
		else
			expect(
				result.stdout
					.split(/\r?\n/)
					.filter((line) => line.startsWith("Required change unchanged:")),
			).toEqual([warning]);
	});
	it("treats a rewrite with identical bytes as unchanged", () => {
		const f = requiredFixture("absolute");
		const result = f.invoke(undefined, {
			ROUND_WRITE_PATH: f.target,
			ROUND_WRITE_CONTENT: f.before.toString("base64"),
		});
		expect(result.status, result.output).toBe(0);
		expect(comparison(f)[0].changed).toBe(false);
		expect(result.stdout).toContain(`Required change unchanged: ${f.named}`);
	});
	it.each([
		"modify",
		"add",
		"delete",
	])("compares every file under a marked folder: %s", (operation) => {
		const f = requiredFixture("folder");
		const target = path.join(
			f.target,
			"nested",
			operation === "add" ? "new.bin" : "file.bin",
		);
		const result = f.invoke(
			undefined,
			operation === "delete"
				? { ROUND_REMOVE_PATH: target }
				: {
						ROUND_WRITE_PATH: target,
						ROUND_WRITE_CONTENT: Buffer.from("changed").toString("base64"),
					},
		);
		expect(result.status, result.output).toBe(0);
		expect(comparison(f)[0].changed).toBe(true);
		expect(result.stdout).not.toContain("Required change unchanged:");
		const baseline = JSON.parse(
			readFileSync(path.join(f.run, "run.json"), "utf8"),
		).requiredChanges[0].before;
		expect(baseline.kind).toBe("directory");
		expect(Object.keys(baseline.files)).toEqual([
			"nested/file.bin",
			"other.bin",
		]);
	});
	it("refuses a marked missing absolute path at brief:check before launching", () => {
		const f = requiredFixture("absolute");
		rmSync(f.target);
		refused(f, f.invoke(), "must change path does not exist:");
		expect(existsSync(f.run)).toBe(false);
	});
	it("reports every unchanged marked path, including a folder, on its outcome line", () => {
		const f = requiredFixture("folder");
		const other = path.join(f.root, "other.bin").replaceAll("\\", "/");
		writeFileSync(other, "other");
		const outcome = `- **Outcome C2:** Update \`${other}\` (must change).`;
		const brief = `${readFileSync(f.brief, "utf8")}${outcome}\n`;
		writeFileSync(f.brief, brief);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "second required path");
		f.answerReview();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(
			comparison(f).map((record: { changed: boolean }) => record.changed),
		).toEqual([false, false]);
		expect(
			result.stdout
				.split(/\r?\n/)
				.filter((line) => line.startsWith("Required change unchanged:")),
		).toEqual([
			`Required change unchanged: ${f.named} (brief line ${f.line}: ${f.outcome})`,
			`Required change unchanged: ${other} (brief line ${brief.split("\n").indexOf(outcome) + 1}: ${outcome})`,
		]);
	});
	it("checks still-unchanged paths after each resume against the launch baseline", () => {
		const f = requiredFixture("absolute");
		expect(f.invoke().status).toBe(0);
		const original = readFileSync(path.join(f.run, "required-changes.json"));
		writeFileSync(f.brief, "the launch outcome must be retained");
		for (const suffix of ["-resume", "-resume-2"]) {
			const result = f.invoke(["resume", f.run, "--message", "continue"], {
				ROUND_EXIT: "19",
			});
			expect(result.status, result.output).toBe(19);
			expect(comparison(f, suffix)[0]).toMatchObject({
				changed: false,
				outcome: f.outcome,
				line: f.line,
			});
			expect(result.stdout).toContain(
				`Required change unchanged: ${f.named} (brief line ${f.line}: ${f.outcome})`,
			);
		}
		const result = f.invoke(["resume", f.run], {
			ROUND_WRITE_PATH: f.target,
			ROUND_WRITE_CONTENT: Buffer.from("changed").toString("base64"),
		});
		expect(result.status, result.output).toBe(0);
		expect(comparison(f, "-resume-3")[0].changed).toBe(true);
		const again = f.invoke(["resume", f.run]);
		expect(again.status, again.output).toBe(0);
		expect(comparison(f, "-resume-4")[0].changed).toBe(true);
		expect(again.stdout).not.toContain("Required change unchanged:");
		expect(readFileSync(path.join(f.run, "required-changes.json"))).toEqual(
			original,
		);
	});
	it("removing the marker keeps launch and resume behavior exactly as before", () => {
		const marked = requiredFixture("absolute");
		expect(marked.invoke().status).toBe(0);
		expect(comparison(marked)[0].changed).toBe(false);
		const f = requiredFixture("absolute", false);
		for (const args of [undefined, ["resume", f.run]]) {
			const result = f.invoke(args);
			expect(result.status, result.output).toBe(0);
			expect(result.stdout).not.toContain("Required change");
		}
		expect(
			JSON.parse(readFileSync(path.join(f.run, "run.json"), "utf8")),
		).not.toHaveProperty("requiredChanges");
		expect(
			readdirSync(f.run).some((name) => name.startsWith("required-changes")),
		).toBe(false);
	});
});

const briefOutcomeIds = [
	["codex-deepseek-route.md", ["D1", "D2", "D3", "D4", "D5", "D6"]],
	["codex-gardener-shared-files.md", ["G1", "G2", "G3", "L1", "L2"]],
	["codex-gardener-shared-files-fix.md", ["X1", "X2", "X3", "L1", "L2"]],
	["codex-launch-review.md", ["R1", "R2", "L1", "L2", "L3"]],
	["codex-launcher-fixes.md", ["A1", "A2", "A3", "A4", "L1", "L2"]],
	["codex-launcher-fixes-2.md", ["K1", "K2", "K3", "L1", "L2"]],
	["codex-launcher-fixes-3.md", ["K1", "K2", "K3", "L1", "L2"]],
	[
		"codex-midmotion-compare.md",
		[
			"T1",
			"T2",
			"T3",
			"T4",
			"T5",
			"T6",
			"T7",
			"T8",
			"T9",
			"L1",
			"L2",
			"L3",
			"L4",
		],
	],
	[
		"codex-midmotion-compare-fix.md",
		["X1", "X2", "X3", "X4", "X6", "X5", "L1", "L2", "L3"],
	],
	["codex-shared-frame-continue-2.md", ["R1", "R2", "R3", "R4"]],
	["codex-tuner-removal.md", ["T1", "T2", "T3", "T4", "T5", "L1", "L2", "L3"]],
	["codex-tuner-removal-continue.md", ["R1", "R2", "T2", "T5"]],
	["codex-tuner-removal-fix.md", ["C1", "C2", "L1", "L2"]],
	[
		"codex-vf-fixes.md",
		["V1", "V2", "V3", "V4", "V5", "V6", "V7", "L1", "L2", "L3"],
	],
	["codex-vf-fixes-continue.md", ["R1", "R2", "V1"]],
	["codex-vf-hold.md", ["H1", "H2", "H3", "L1", "L2", "L3", "L4"]],
	["codex-vf-parallel.md", ["P1", "P2", "P3", "P4", "L1", "L2", "L3"]],
	["codex-vf-parallel-continue.md", ["R1", "R2", "R3"]],
	["codex-vf-parallel-continue-2.md", ["R1", "R2", "R3", "R4", "R5"]],
	["codex-vf-speed.md", ["S1", "S2", "S3", "S4", "L1", "L2", "L3"]],
] as const;

const briefRoot = path.join(
	repository,
	"docs/phase-records/handoffs/owner-design-exploration/r04/briefs",
);

describe("L1 launch", () => {
	it("runs brief:check first and launches nothing for a failing brief", () => {
		const f = fixture();
		writeFileSync(f.brief, "broken brief\n");
		refused(
			f,
			f.invoke([f.brief, "invalid", "--run", f.run]),
			"brief:check failed",
		);
		expect(existsSync(f.run)).toBe(false);
	});
	it("refuses a brief with no outcome IDs before its review starts", () => {
		const f = fixture();
		writeFileSync(
			f.brief,
			f.bytes
				.toString("utf8")
				.replace(
					"\n## Causes and required outcomes\n\n- **K1.** Fixture outcome.\n",
					"\n",
				),
		);
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "remove outcome ids");
		const result = f.invoke([f.brief, "high", "--new-review", "--run", f.run]);
		refused(f, result, "brief has no outcome IDs");
		expect(f.reviewCalls()).toEqual([]);
		expect(existsSync(f.run)).toBe(false);
	});
	it("pins every current r04 brief to its exact outcome IDs", () => {
		expect(
			readdirSync(briefRoot)
				.filter((name) => name.endsWith(".md"))
				.sort(),
		).toEqual(briefOutcomeIds.map(([name]) => name).sort());
	});
	it.each(briefOutcomeIds)("finds every outcome ID in %s", (name, expected) => {
		expect(
			[...outcomeIdsFromBrief(readFileSync(path.join(briefRoot, name)))].sort(),
		).toEqual([...expected].sort());
	});
	it("ignores outcome IDs inside the environment block and fenced code", () => {
		expect(
			[
				...outcomeIdsFromBrief(`- **A1.** Closed after the ID.
- **B2. A reading's own lists.**
- **C3** No full stop is not an ID.
- **D4. Missing bold close is not an ID.

<!-- environment:start v1 -->
- **E5.** Environment example.
<!-- environment:end -->

\`\`\`markdown
- **F6.** Fenced example.
\`\`\`
`),
			].sort(),
		).toEqual(["A1", "B2"]);
	});
	it("keeps exact HEAD input, argument order, events, last message, run folder and thread id", async () => {
		const f = fixture();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(result.stdout).toContain("PASS brief:check");
		expect(result.stdout.match(/Run folder: /g)).toHaveLength(1);
		const reportedRun = result.stdout.match(/^Run folder: (.+)\r?$/m)?.[1];
		expect(reportedRun).toBeDefined();
		expect(await samePath(reportedRun, f.run)).toBe(true);
		expect(result.stdout.match(/Thread id: /g)).toHaveLength(1);
		expect(result.stdout).toContain(`Thread id: ${thread}`);
		expect(await argumentKeys(f.captured().args)).toEqual(
			await argumentKeys(expectedArgs(f, "last-message.md")),
		);
		expect(await samePath(f.captured().cwd, f.worktree)).toBe(true);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		expect(readFileSync(path.join(f.run, "input.md"))).toEqual(f.bytes);
		expect(readFileSync(path.join(f.run, "last-message.md"), "utf8")).toBe(
			"stand-in last message\nK1: PASS\n",
		);
		expect(readFileSync(path.join(f.run, "events.jsonl"), "utf8")).toBe(
			`{"type":"thread.started","thread_id":"${thread}"}\n{"type":"item.completed","text":"العربية «»"}\r\n`,
		);
		expect(git(f.worktree, "status", "--short")).toBe("");
	});
	it("prefixes exactly the agreement note when HEAD is later", () => {
		const f = fixture();
		const head = f.laterHead();
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(
			Buffer.concat([
				Buffer.from(
					`Launch note: HEAD ${head} only adds this brief over the named HEAD.\n\n`,
				),
				f.bytes,
			]),
		);
	});
	it("returns Codex's exit code, retaining stopped-run evidence", () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		expect(existsSync(path.join(f.run, "events.jsonl"))).toBe(true);
		expect(existsSync(path.join(f.run, ".running"))).toBe(false);
	});
});

describe("L2 resume", () => {
	it("resumes the first-line thread with all flags before resume and preserves earlier captures", async () => {
		const f = fixture();
		f.laterHead();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		const original = readFileSync(path.join(f.run, "events.jsonl"));
		const input = readFileSync(path.join(f.run, "input.md"));
		writeFileSync(
			path.join(f.worktree, "unfinished.ts"),
			"// interrupted round\n",
		);
		writeFileSync(f.brief, "the saved input must be used\n");
		for (let attempt = 0; attempt < 2; attempt += 1) {
			const result = f.invoke(["resume", f.run], { ROUND_EXIT: "19" });
			expect(result.status, result.output).toBe(19);
			expect(await argumentKeys(f.captured().args)).toEqual(
				await argumentKeys(expectedArgs(f, "last-message.md", true)),
			);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(input);
		}
		expect(readFileSync(path.join(f.run, "events.jsonl"))).toEqual(original);
		expect(
			readdirSync(f.run).filter((file) => file.endsWith(".jsonl")),
		).toEqual(["events-resume-2.jsonl", "events-resume.jsonl", "events.jsonl"]);
		expect(readFileSync(path.join(f.run, "last-message.md"), "utf8")).toBe(
			"stand-in resumed message\nK1: PASS\n",
		);
	});
	it.each([
		"",
		"توقف بسبب حد الاستخدام؛ تبدّل الحساب «كما هو» & %PATH% ! ^",
		"  العربية\r\nresumed\n ",
	])("sends the exact optional resume message %j instead of the launch input", async (message) => {
		const f = fixture();
		f.laterHead();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		const input = readFileSync(path.join(f.run, "input.md"));
		const result = f.invoke(["resume", f.run, "--message", message]);
		expect(result.status, result.output).toBe(0);
		expect(await argumentKeys(f.captured().args)).toEqual(
			await argumentKeys(expectedArgs(f, "last-message.md", true)),
		);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(
			Buffer.from(message, "utf8"),
		);
		expect(readFileSync(path.join(f.run, "input.md"))).toEqual(input);
		const fallback = f.invoke(["resume", f.run]);
		expect(fallback.status, fallback.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(input);
	});
	it("sends a message file byte for byte", async () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		const message = Buffer.from(
			`line 1 has "double" and 'single' quotes, a backslash before a quote: \\"\nالعربية «كما هي» and $PATH\r\nline 3`,
			"utf8",
		);
		const messageFile = path.join(f.root, "resume message.txt");
		writeFileSync(messageFile, message);
		const result = f.invoke(["resume", f.run, "--message-file", messageFile]);
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(message);
	});
	it.each([
		[
			"UTF-8 BOM",
			(text: string) =>
				Buffer.concat([
					Buffer.from([0xef, 0xbb, 0xbf]),
					Buffer.from(text, "utf8"),
				]),
		],
		["UTF-8", (text: string) => Buffer.from(text, "utf8")],
		[
			"UTF-16LE BOM",
			(text: string) =>
				Buffer.concat([
					Buffer.from([0xff, 0xfe]),
					Buffer.from(text, "utf16le"),
				]),
		],
		[
			"UTF-16BE BOM",
			(text: string) => {
				const littleEndian = Buffer.from(text, "utf16le");
				for (let index = 0; index < littleEndian.length; index += 2)
					[littleEndian[index], littleEndian[index + 1]] = [
						littleEndian[index + 1],
						littleEndian[index],
					];
				return Buffer.concat([Buffer.from([0xfe, 0xff]), littleEndian]);
			},
		],
	])("decodes %s message files and keeps line endings", async (_name, encode) => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		const text = `quotes: "double" and 'single'\r\nالعربية «كما هي»\n`;
		const expected = Buffer.from(text, "utf8");
		const messageFile = path.join(f.root, "encoded message.txt");
		writeFileSync(messageFile, encode(text));
		const result = f.invoke(["resume", f.run, "--message-file", messageFile]);
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(expected);
	});
	it("refuses invalid UTF-8 without a BOM and names the file", () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		rmSync(f.capture);
		const messageFile = path.join(f.root, "invalid message.txt");
		writeFileSync(messageFile, Buffer.from([0x61, 0xc3, 0x28]));
		const result = f.invoke(["resume", f.run, "--message-file", messageFile]);
		refused(f, result, "message file is not valid UTF-8; write it as UTF-8");
		expect(result.stderr).toContain(messageFile);
	});
	it.each([
		["missing", "message file not found"],
		["empty", "message file is empty"],
	])("refuses a %s message file", (kind, reason) => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		rmSync(f.capture);
		const messageFile = path.join(f.root, `${kind} message.txt`);
		if (kind === "empty") writeFileSync(messageFile, Buffer.alloc(0));
		refused(
			f,
			f.invoke(["resume", f.run, "--message-file", messageFile]),
			reason,
		);
	});
	it.each([
		[["--message"]],
		[["--unknown", "text"]],
		[["--message", "text", "extra"]],
	])("refuses malformed resume options %j without starting Codex", (options) => {
		const f = fixture();
		refused(
			f,
			f.invoke(["resume", f.run, ...options]),
			"expected resume <folder> [--message <text> | --message-file <file>]",
		);
		expect(existsSync(f.run)).toBe(false);
	});
	it("refuses a run whose first event has no thread", () => {
		const f = fixture();
		f.invoke();
		rmSync(f.capture);
		writeFileSync(
			path.join(f.run, "events.jsonl"),
			'{}\n{"type":"thread.started","thread_id":"wrong-line"}\n',
		);
		refused(f, f.invoke(["resume", f.run]), "first event has no thread id");
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(false);
	});
	it("refuses to resume a saved input with no outcome IDs", () => {
		const f = fixture();
		expect(f.invoke().status).toBe(0);
		rmSync(f.capture);
		writeFileSync(path.join(f.run, "input.md"), "No outcome IDs.\n");
		refused(f, f.invoke(["resume", f.run]), "brief has no outcome IDs");
		expect(existsSync(f.capture)).toBe(false);
	});
});

describe("K2 automatic resume", () => {
	const report = "K1-K3: PASS\nL1-L2: PASS\n";
	const outcomeBrief = (f: ReturnType<typeof fixture>) => {
		const suffix = Buffer.from(
			`
## Causes and required outcomes

- **K1.** Fixture cause one. Outcome: first result. Intent: first intent.
- **K2.** Fixture cause two. Outcome: second result. Intent: second intent.
- **K3.** Fixture cause three. Outcome: third result. Intent: third intent.

## Limits the result keeps

- **L1.** Fixture limit one. Outcome: first limit. Intent: first limit intent.
- **L2.** Fixture limit two. Outcome: second limit. Intent: second limit intent.
`,
		);
		writeFileSync(f.brief, Buffer.concat([f.bytes, suffix]));
		git(f.coordinator, "add", ".");
		git(f.coordinator, "commit", "-m", "add outcome ids");
		f.answerReview(undefined, undefined, 2);
	};
	const resumeLog = (f: ReturnType<typeof fixture>) =>
		readFileSync(path.join(f.run, "auto-resumes.log"), "utf8")
			.trim()
			.split(/\r?\n/)
			.map((line) => JSON.parse(line));

	it("resumes a run whose first turn ends without a report", () => {
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			ROUND_MESSAGE: "Now let me test the implementation:\n",
			ROUND_RESUME_MESSAGE: report,
		});
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toContain("resume");
		expect(f.captured().args).toContain(thread);
		expect(
			Buffer.from(f.captured().input, "base64").toString("utf8"),
		).toContain("wait inside tool calls");
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(true);
		const log = resumeLog(f);
		expect(log).toHaveLength(1);
		expect(log[0]).toMatchObject({
			exitCode: 0,
			firstLine: "Now let me test the implementation:",
		});
		expect(log[0].time).toMatch(/^\d{4}-\d\d-\d\dT/);
	});

	it("quotes the trigger's first line exactly and handles a fence in the line", () => {
		const first =
			'quote " slash \\ tick ``` \u00ab\u00ab \u0645\u0631\u062d\u0628\u0627 \u00bb\u00bb';
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			ROUND_MESSAGE: `${first}\nsecond line\n`,
			ROUND_RESUME_MESSAGE: report,
		});
		expect(result.status, result.output).toBe(0);
		const sent = Buffer.from(f.captured().input, "base64").toString("utf8");
		const fence = sent.match(/^(`{3,})$/m)?.[1];
		expect(fence).toBeTruthy();
		expect(sent).toContain(`${fence}\n${first}\n${fence}`);
		expect(resumeLog(f)).toMatchObject([{ exitCode: 0, firstLine: first }]);
	});

	it("does not resume after a complete report or a STOPPED line", () => {
		for (const message of [report, "STOPPED: deliberate stop\n"]) {
			const f = fixture();
			outcomeBrief(f);
			const result = f.invoke(undefined, { ROUND_MESSAGE: message });
			expect(result.status, result.output).toBe(0);
			expect(f.captured().args).not.toContain("resume");
			expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(false);
			expect(existsSync(path.join(f.run, "auto-resumes.log"))).toBe(false);
		}
	});

	it("never resumes a nonzero exit", () => {
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			ROUND_MESSAGE: "unfinished work\n",
			ROUND_EXIT: "37",
		});
		expect(result.status, result.output).toBe(37);
		expect(f.captured().args).not.toContain("resume");
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(false);
		expect(existsSync(path.join(f.run, "auto-resumes.log"))).toBe(false);
	});

	it.each([
		["an omitted ID", "K1-K2: PASS\nL2: PASS\n"],
		["IDs without PASS or FAIL", "K1 K2 K3 L1 L2\n"],
	])("does not accept %s as a report", (_name, message) => {
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			ROUND_MESSAGE: message,
			ROUND_RESUME_MESSAGE: report,
		});
		expect(result.status, result.output).toBe(0);
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(true);
		expect(resumeLog(f)).toHaveLength(1);
	});

	it("auto-resumes after a manual resume command", () => {
		const f = fixture();
		outcomeBrief(f);
		const sequence = {
			ROUND_MESSAGES: JSON.stringify([
				"launch incomplete\n",
				"manual resume incomplete\n",
				report,
			]),
			ROUND_EXITS: JSON.stringify([37, 0, 0]),
			ROUND_SEQUENCE_FILE: path.join(f.root, "round-sequence"),
		};
		expect(f.invoke(undefined, sequence).status).toBe(37);
		const result = f.invoke(["resume", f.run], sequence);
		expect(result.status, result.output).toBe(0);
		expect(f.captured().args).toContain("resume");
		expect(existsSync(path.join(f.run, "events-resume.jsonl"))).toBe(true);
		expect(existsSync(path.join(f.run, "events-resume-2.jsonl"))).toBe(true);
		expect(resumeLog(f)).toMatchObject([
			{ exitCode: 0, firstLine: "manual resume incomplete" },
		]);
	});

	it("stops with exit 1 after ten automatic resumes", () => {
		const f = fixture();
		outcomeBrief(f);
		const result = f.invoke(undefined, {
			ROUND_MESSAGE: "still working\n",
			ROUND_RESUME_MESSAGE: "still working\n",
		});
		expect(result.status, result.output).toBe(1);
		expect(result.stderr).toContain("after 10 automatic resumes");
		expect(resumeLog(f)).toHaveLength(10);
		expect(existsSync(path.join(f.run, "events-resume-10.jsonl"))).toBe(true);
		expect(existsSync(path.join(f.run, "events-resume-11.jsonl"))).toBe(false);
	});
});

describe("L5 start load", () => {
	const record = (f: ReturnType<typeof fixture>) =>
		JSON.parse(readFileSync(path.join(f.run, "start-load.json"), "utf8"));
	it("records the thread's first counted request, never a later one or another thread's", async () => {
		const f = fixture();
		session(f, "other-thread", [tokenCount(99999)]);
		session(
			f,
			thread,
			[
				'{"type":"session_meta","payload":{}}',
				"not json",
				tokenCount(null),
				tokenCount(27063),
				tokenCount(32109, 59172),
			],
			"2026/10/08",
		);
		const result = f.invoke();
		expect(result.status, result.output).toBe(0);
		expect(result.stdout).toContain(
			"Start load: 27063 input tokens in the first request",
		);
		const saved = record(f);
		expect(saved).toMatchObject({
			thread,
			input_tokens: 27063,
			cached_input_tokens: 7296,
		});
		expect(
			await samePath(
				saved.session,
				path.join(
					f.codexHome,
					"sessions/2026/10/08",
					`rollout-2026-10-09T10-00-00-${thread}.jsonl`,
				),
			),
		).toBe(true);
	});
	it("records nothing and keeps Codex's exit code without a session or a count", () => {
		const f = fixture();
		const result = f.invoke(undefined, { ROUND_EXIT: "37" });
		expect(result.status, result.output).toBe(37);
		expect(result.stdout).toContain(
			`Start load: no session file for thread ${thread}`,
		);
		expect(existsSync(path.join(f.run, "start-load.json"))).toBe(false);
		session(f, thread, [tokenCount(null)]);
		const resumed = f.invoke(["resume", f.run]);
		expect(resumed.status, resumed.output).toBe(0);
		expect(resumed.stdout).toContain("Start load: no token count in");
		expect(existsSync(path.join(f.run, "start-load.json"))).toBe(false);
	});
	it("fills a missing record on resume and never replaces one", () => {
		const f = fixture();
		expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
		session(f, thread, [tokenCount(27063)]);
		expect(f.invoke(["resume", f.run]).status).toBe(0);
		expect(record(f).input_tokens).toBe(27063);
		session(f, thread, [tokenCount(11111)]);
		expect(f.invoke(["resume", f.run]).status).toBe(0);
		expect(record(f).input_tokens).toBe(27063);
	});
});

describe("L3 refusals", () => {
	it.each([
		"untracked",
		"staged",
		"modified",
	])("refuses %s worktree changes", (kind) => {
		const f = fixture();
		if (kind === "modified") f.laterHead();
		writeFileSync(
			path.join(f.worktree, kind === "modified" ? "launch.md" : "change.txt"),
			"change\n",
		);
		if (kind === "staged") git(f.worktree, "add", ".");
		refused(f, f.invoke(), "uncommitted changes");
	});
	it.each([
		"TEMP",
		"TMP",
	])("refuses %s inside D:/fitway-temp before review or Codex", (key) => {
		const f = fixture();
		const bad = path.join("D:/fitway-temp", `round-${key}`, "child");
		rmSync(f.reviewRoot, { recursive: true });
		const result = f.invoke([f.brief, "high", "--new-review", "--run", f.run], {
			[key]: bad,
		});
		refused(f, result, key);
		expect(result.stderr).toContain("D:/fitway-temp");
		expect(f.reviewCalls()).toEqual([]);
		expect(existsSync(f.run)).toBe(false);
		expect(existsSync(f.reviewRoot)).toBe(false);
	});
	it("refuses a case-varied, relative TEMP through a junction into the gardener root", () => {
		const f = fixture();
		const link = path.join(f.root, "gardener-temp-link");
		symlinkSync("D:/fitway-temp", link, "junction");
		const bad = `${link.toUpperCase()}/child/../nested`;
		delete f.env.TEMP;
		delete f.env.TMP;
		Object.assign(f.env, { temp: bad });
		const result = f.invoke();
		refused(f, result, "temp");
		expect(result.stderr).toContain("temp");
		expect(f.reviewCalls()).toEqual([]);
		expect(existsSync(f.run)).toBe(false);
	});
	it("refuses a bad TEMP before Codex on resume", () => {
		const f = fixture();
		expect(f.invoke().status).toBe(0);
		rmSync(f.capture);
		const result = f.invoke(["resume", f.run], {
			TEMP: "D:/FITWAY-TEMP/../fitway-temp/resume",
		});
		refused(f, result, "TEMP");
		expect(existsSync(f.capture)).toBe(false);
	});
	it("keeps a sibling of D:/fitway-temp and other values unchanged", () => {
		const f = fixture();
		const temp = "D:/fitway-temp-logs/round-temp";
		const tmp = "D:/fitway-temp-logs/round-tmp";
		const result = f.invoke(undefined, { TEMP: temp, TMP: tmp });
		expect(result.status, result.output).toBe(0);
		expect(f.captured().env).toEqual({ TEMP: temp, TMP: tmp });
	});
	it.skipIf(process.platform !== "win32")(
		"expands an 8.3 TEMP for Codex and leaves other values unchanged",
		({ skip }) => {
			const f = fixture();
			const probe = firstShortWindowsPath();
			if (!("short" in probe))
				skip(
					`no available drive offers an 8.3 folder name; drives probed: ${
						probe.drives.join(", ") || "none"
					}`,
				);
			const tmp = "D:/fitway-temp-logs/round-normal";
			const result = f.invoke(undefined, {
				TEMP: probe.short,
				TMP: tmp,
			});
			expect(result.status, result.output).toBe(0);
			expect(f.captured().env).toEqual({
				TEMP: realpathSync.native(probe.long),
				TMP: tmp,
			});
		},
	);
	it("refuses an unsupported level", () => {
		const f = fixture();
		refused(
			f,
			f.invoke([f.brief, "ultra", "--run", f.run]),
			"unsupported reasoning level",
		);
	});
	it("refuses a run in any Git tree, including a nonexistent descendant", () => {
		const f = fixture();
		refused(
			f,
			f.invoke([
				f.brief,
				"high",
				"--run",
				path.join(f.coordinator, "missing", "run"),
			]),
			"inside a Git working tree",
		);
	});
	it("refuses a run through a junction or directory link into a Git tree", () => {
		const f = fixture();
		const link = path.join(f.root, "linked-tree");
		symlinkSync(
			f.coordinator,
			link,
			process.platform === "win32" ? "junction" : "dir",
		);
		try {
			refused(
				f,
				f.invoke([f.brief, "high", "--run", path.join(link, "missing", "run")]),
				"inside a Git working tree",
			);
		} finally {
			rmSync(link);
		}
	});
	it("refuses a directory link pointing out of a Git tree", () => {
		const f = fixture();
		const link = path.join(f.coordinator, "linked-out");
		symlinkSync(f.bin, link, process.platform === "win32" ? "junction" : "dir");
		try {
			refused(
				f,
				f.invoke([f.brief, "high", "--run", path.join(link, "missing", "run")]),
				"inside a Git working tree",
			);
		} finally {
			rmSync(link);
		}
	});
	it("refuses a folder already holding a run without overwriting it", () => {
		const f = fixture();
		f.invoke();
		rmSync(f.capture);
		const original = readFileSync(path.join(f.run, "events.jsonl"));
		refused(f, f.invoke(), "already holds a run");
		expect(readFileSync(path.join(f.run, "events.jsonl"))).toEqual(original);
	});
	it("refuses absent codex on PATH", () => {
		const f = fixture();
		const gitExecutable =
			process.platform === "win32"
				? execFileSync("where.exe", ["git.exe"], {
						encoding: "utf8",
						windowsHide: true,
					})
						.trim()
						.split(/\r?\n/)[0]
				: execFileSync("which", ["git"], { encoding: "utf8" }).trim();
		refused(
			f,
			f.invoke(undefined, { PATH: path.dirname(gitExecutable) }),
			"codex is not on PATH",
		);
		expect(existsSync(f.run)).toBe(false);
	});
});

describe("L4 shell and byte parity", () => {
	it.each([
		"\n",
		"\r\n",
	])("passes Arabic and punctuation unchanged with %j endings", (eol) => {
		const f = fixture(eol);
		const result = f.invoke(
			[
				f.brief.replaceAll(path.sep, "/"),
				"high",
				"--run",
				f.run.replaceAll(path.sep, "\\"),
			],
			{},
			f.coordinator,
		);
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
	});
	it("resolves a repository-root relative brief from an unrelated cwd", () => {
		const f = fixture();
		const relative = path
			.relative(repository, f.brief)
			.replaceAll(path.sep, "\\");
		const result = f.invoke([relative, "high", "--run", f.run]);
		expect(result.status, result.output).toBe(0);
		expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
	});
	it.skipIf(process.platform !== "win32")(
		"gives the same launch in PowerShell and Git Bash",
		async () => {
			const f = fixture("\r\n");
			// An executable stand-in and the WSL launcher both precede Git Bash.
			const impostor = path.join(f.bin, "bash.exe");
			copyFileSync(process.execPath, impostor);
			const env = {
				...f.env,
				PATH: `${f.bin}${path.delimiter}${path.join(process.env.SystemRoot ?? "C:/Windows", "System32")}${path.delimiter}${process.env.PATH}`,
			};
			const firstBash = execFileSync("where.exe", ["bash.exe"], {
				env,
				encoding: "utf8",
				windowsHide: true,
			})
				.trim()
				.split(/\r?\n/)[0];
			// where.exe expands short TEMP aliases; vary case and slashes too.
			const impostorAlias = impostor.toUpperCase().replaceAll("\\", "/");
			expect(await samePath(firstBash, impostorAlias)).toBe(true);
			const gitBash = findGitBash(env.PATH);
			expect(await samePath(gitBash, impostorAlias)).toBe(false);
			const args = [process.execPath, script, f.brief, "high", "--run", f.run];
			const psQuote = (value: string) => `'${value.replaceAll("'", "''")}'`;
			const ps = spawnSync(
				"powershell.exe",
				["-NoProfile", "-Command", `& ${args.map(psQuote).join(" ")}`],
				{ cwd: f.root, env, encoding: "utf8", windowsHide: true },
			);
			expect(ps.status, ps.stdout + ps.stderr).toBe(0);
			const first = f.captured();
			// Each shell gets a fresh run with the identical command text.
			for (const file of readdirSync(f.run)) rmSync(path.join(f.run, file));
			const bashQuote = (value: string) =>
				`'${value.replaceAll("'", "'\\''")}'`;
			const bash = spawnSync(
				gitBash,
				[
					"--noprofile",
					"--norc",
					"-c",
					args.map((arg) => bashQuote(arg.replaceAll("\\", "/"))).join(" "),
				],
				{ cwd: f.coordinator, env, encoding: "utf8", windowsHide: true },
			);
			expect(bash.status, bash.stdout + bash.stderr).toBe(0);
			expect(await captureKeys(f.captured())).toEqual(await captureKeys(first));
		},
	);
	it.skipIf(process.platform !== "win32")(
		"names missing Git for Windows Bash in one line",
		() => {
			const f = fixture();
			copyFileSync(process.execPath, path.join(f.bin, "git.exe"));
			copyFileSync(process.execPath, path.join(f.bin, "bash.exe"));
			expect(() => findGitBash(f.bin)).toThrow(
				/^Git for Windows Bash is missing \(required for shell parity\)$/,
			);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"keeps shell metacharacters in run paths as data for .cmd shims",
		async () => {
			const f = fixture();
			const run = path.join(f.root, "run & %PATH% !literal! ^ (space)");
			const result = f.invoke([f.brief, "high", "--run", run]);
			expect(result.status, result.output).toBe(0);
			expect(
				await samePath(
					f.captured().args[10],
					path.join(run, "last-message.md"),
				),
			).toBe(true);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(f.bytes);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"delivers a message file unchanged from PowerShell and Git Bash",
		() => {
			const f = fixture();
			expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
			const message = Buffer.from(
				`double "quote", 'single' quote, backslash before quote: \\"\nالعربية «كما هي» and $PATH\r\nlast line`,
				"utf8",
			);
			const messageFile = path.join(f.root, "resume message.txt");
			writeFileSync(messageFile, message);
			const impostor = path.join(f.bin, "bash.exe");
			copyFileSync(process.execPath, impostor);
			const env = {
				...f.env,
				PATH: `${f.bin}${path.delimiter}${path.join(
					process.env.SystemRoot ?? "C:/Windows",
					"System32",
				)}${path.delimiter}${process.env.PATH}`,
			};
			const args = [
				process.execPath,
				script,
				"resume",
				f.run,
				"--message-file",
				messageFile,
			];
			const psQuote = (value: string) => `'${value.replaceAll("'", "''")}'`;
			const powershells = ["powershell.exe"];
			if (
				spawnSync("where.exe", ["pwsh.exe"], {
					env,
					windowsHide: true,
					stdio: "ignore",
				}).status === 0
			)
				powershells.push("pwsh.exe");
			for (const shell of powershells) {
				const result = spawnSync(
					shell,
					["-NoProfile", "-Command", `& ${args.map(psQuote).join(" ")}`],
					{
						cwd: f.root,
						env,
						encoding: "utf8",
						windowsHide: true,
					},
				);
				expect(result.status, result.stdout + result.stderr).toBe(0);
				expect(Buffer.from(f.captured().input, "base64")).toEqual(message);
			}
			const gitBash = findGitBash(env.PATH);
			const bashQuote = (value: string) =>
				`'${value.replaceAll("'", "'\\''")}'`;
			const bash = spawnSync(
				gitBash,
				[
					"--noprofile",
					"--norc",
					"-c",
					args.map((arg) => bashQuote(arg.replaceAll("\\", "/"))).join(" "),
				],
				{
					cwd: f.coordinator,
					env,
					encoding: "utf8",
					windowsHide: true,
				},
			);
			expect(bash.status, bash.stdout + bash.stderr).toBe(0);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(message);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"enforces the Git Bash --message guard through every launcher form",
		() => {
			const f = fixture();
			expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
			const gitBash = findGitBash(f.env.PATH);
			const bashQuote = (value: string) =>
				`'${value.replaceAll("'", "'\\''")}'`;
			const powershellQuote = (value: string) =>
				`'${value.replaceAll("'", "''")}'`;
			const windowsCommandLine = (parts: readonly string[]) =>
				parts
					.map((part) => (/[\s"]/.test(part) ? `"${part}"` : part))
					.join(" ");
			const resumeArgs = ["resume", f.run, "--message", "/api"];
			const gitBashEnv = { ...f.env, MSYSTEM: "MINGW64" };
			const cases = [
				{
					name: "Git Bash pnpm",
					refused: true,
					run: () =>
						spawnSync(
							gitBash,
							[
								"--noprofile",
								"--norc",
								"-c",
								["pnpm", "codex:round", ...resumeArgs]
									.map((arg) => bashQuote(arg.replaceAll("\\", "/")))
									.join(" "),
							],
							{
								cwd: repository,
								env: gitBashEnv,
								encoding: "utf8",
								windowsHide: true,
							},
						),
				},
				{
					name: "Git Bash pnpm -s",
					refused: true,
					run: () =>
						spawnSync(
							gitBash,
							[
								"--noprofile",
								"--norc",
								"-c",
								["pnpm", "-s", "codex:round", ...resumeArgs]
									.map((arg) => bashQuote(arg.replaceAll("\\", "/")))
									.join(" "),
							],
							{
								cwd: repository,
								env: gitBashEnv,
								encoding: "utf8",
								windowsHide: true,
							},
						),
				},
				{
					name: "Git Bash node",
					refused: true,
					run: () =>
						spawnSync(
							gitBash,
							[
								"--noprofile",
								"--norc",
								"-c",
								[process.execPath, script, ...resumeArgs]
									.map((arg) => bashQuote(arg.replaceAll("\\", "/")))
									.join(" "),
							],
							{
								cwd: repository,
								env: gitBashEnv,
								encoding: "utf8",
								windowsHide: true,
							},
						),
				},
				{
					name: "PowerShell node",
					refused: false,
					run: () =>
						spawnSync(
							"powershell.exe",
							[
								"-NoProfile",
								"-Command",
								`& ${[process.execPath, script, ...resumeArgs]
									.map(powershellQuote)
									.join(" ")}`,
							],
							{
								cwd: repository,
								env: f.env,
								encoding: "utf8",
								windowsHide: true,
							},
						),
				},
				{
					name: "cmd node",
					refused: false,
					run: () =>
						spawnSync(
							process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe",
							[
								"/d",
								"/s",
								"/c",
								`"${windowsCommandLine([
									process.execPath,
									script,
									...resumeArgs,
								])}"`,
							],
							{
								cwd: repository,
								env: f.env,
								encoding: "utf8",
								windowsHide: true,
								windowsVerbatimArguments: true,
							},
						),
				},
			];

			for (const entry of cases) {
				rmSync(f.capture, { force: true });
				const result = entry.run();
				expect(
					result.status,
					`${entry.name}: ${result.stdout}${result.stderr}`,
				).toBe(entry.refused ? 1 : 0);
				if (entry.refused) {
					expect(result.stderr).toContain("--message-file");
					expect(existsSync(f.capture)).toBe(false);
				} else {
					expect(existsSync(f.capture)).toBe(true);
					expect(f.captured().input).toBe(
						Buffer.from("/api", "utf8").toString("base64"),
					);
				}
			}
		},
	);
	it.skipIf(process.platform !== "win32")(
		"keeps the Git Bash guard when pnpm's parent has exited",
		async () => {
			const f = fixture();
			expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
			rmSync(f.capture, { force: true });
			const gitBash = findGitBash(f.env.PATH);
			const status = path.join(f.root, "detached-status.txt");
			const log = path.join(f.root, "detached.log");
			const bashQuote = (value: string) =>
				`'${value.replaceAll("'", "'\\''")}'`;
			const command = `(${[
				"pnpm",
				"-s",
				"codex:round",
				"resume",
				f.run,
				"--message",
				"check /api now",
			]
				.map((arg) => bashQuote(arg.replaceAll("\\", "/")))
				.join(
					" ",
				)} > ${bashQuote(log)} 2>&1; printf '%s' "$?" > ${bashQuote(status)}) &`;
			const outer = spawnSync(
				gitBash,
				["--noprofile", "--norc", "-c", command],
				{
					cwd: repository,
					env: { ...f.env, MSYSTEM: "MINGW64" },
					encoding: "utf8",
					windowsHide: true,
				},
			);
			expect(outer.status, outer.stdout + outer.stderr).toBe(0);
			await vi.waitFor(
				() => {
					expect(existsSync(status)).toBe(true);
				},
				{ timeout: 30_000, interval: 25 },
			);
			expect(readFileSync(status, "utf8")).toBe("1");
			expect(readFileSync(log, "utf8")).toContain("--message-file");
			expect(existsSync(f.capture)).toBe(false);
		},
	);
	it.skipIf(process.platform !== "win32")(
		"decodes PowerShell Out-File and Set-Content defaults",
		() => {
			const f = fixture();
			expect(f.invoke(undefined, { ROUND_EXIT: "37" }).status).toBe(37);
			const outFile = path.join(f.root, "out-file message.txt");
			const setFile = path.join(f.root, "set-content message.txt");
			const quote = (value: string) => `'${value.replaceAll("'", "''")}'`;
			const powershell = spawnSync(
				"powershell.exe",
				[
					"-NoProfile",
					"-Command",
					`"العربية\`r\`nASCII" | Out-File -LiteralPath ${quote(outFile)}; "العربية\`r\`nASCII" | Set-Content -LiteralPath ${quote(setFile)}`,
				],
				{ cwd: f.root, encoding: "utf8", windowsHide: true },
			);
			expect(powershell.status, powershell.stdout + powershell.stderr).toBe(0);
			expect(
				f.invoke(["resume", f.run, "--message-file", outFile]).status,
			).toBe(0);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(
				Buffer.from("العربية\r\nASCII\r\n", "utf8"),
			);
			expect(
				f.invoke(["resume", f.run, "--message-file", setFile]).status,
			).toBe(0);
			expect(Buffer.from(f.captured().input, "base64")).toEqual(
				Buffer.from("???????\r\nASCII\r\n", "utf8"),
			);
		},
	);
});

it("prints the command's usage without starting Codex", () => {
	const f = fixture();
	const result = f.invoke(["--help"]);
	expect(result.status).toBe(0);
	expect(result.stdout).toContain(
		"Usage: pnpm codex:round [--] <brief> [<level>] [--model <model>] [--run <folder>] [--new-review]",
	);
	expect(result.stdout).toContain(
		"pnpm codex:round [--] resume <folder> [--message <text> | --message-file <file>]",
	);
	expect(result.stdout).toContain(
		"--message sends the exact text instead of the saved launch input.",
	);
	expect(result.stdout).toContain("resumes automatically up to 10 times");
	expect(result.stdout).toContain(
		"Models: deepseek-v4.1-flash (default), gpt-6.1-sol.",
	);
	expect(result.stdout).toContain(
		"Levels: deepseek-v4.1-flash: high, max (default max); gpt-6.1-sol: medium, high, xhigh, max.",
	);
	expect(existsSync(f.capture)).toBe(false);
});
