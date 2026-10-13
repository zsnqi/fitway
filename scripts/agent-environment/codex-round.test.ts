import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
	chmodSync,
	copyFileSync,
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
import { afterEach, describe, expect, it } from "vitest";
import { pathKey, samePath } from "./path-identity.mjs";

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
		`<!-- brief-format: v1 role: codex -->\n# Fixture\n\n- **Worktree:** \`${worktree.replaceAll("\\", "/")}\`, branch \`fixture\`, HEAD \`${head.slice(0, 8)}\`\n\n${environment.replaceAll("\r\n", "\n")}\n## Goal\n\nالنص «كما هو»\n`.replaceAll(
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
    const capture = {args, cwd:process.cwd(), input:Buffer.concat(chunks).toString('base64'), files:fs.readdirSync(process.cwd())};
    fs.appendFileSync(process.env.ROUND_REVIEW_CAPTURE, JSON.stringify(capture) + '\\n');
    if (!process.env.REVIEW_NO_ANSWER) fs.writeFileSync(args[args.indexOf('-o') + 1], process.env.REVIEW_ANSWER_FILE ? fs.readFileSync(process.env.REVIEW_ANSWER_FILE) : process.env.REVIEW_ANSWER || 'No such readings.\\n');
    process.stdout.write('stand-in review\\n');
    process.exitCode = Number(process.env.REVIEW_EXIT || 0);
    return;
  }
  if (process.env.ROUND_WRITE_PATH) fs.writeFileSync(process.env.ROUND_WRITE_PATH, Buffer.from(process.env.ROUND_WRITE_CONTENT, 'base64'));
  if (process.env.ROUND_REMOVE_PATH) fs.unlinkSync(process.env.ROUND_REMOVE_PATH);
  fs.writeFileSync(process.env.ROUND_CAPTURE, JSON.stringify({args, cwd:process.cwd(), input:Buffer.concat(chunks).toString('base64')}));
  fs.writeFileSync(args[args.indexOf('-o') + 1], args.includes('resume') ? 'stand-in resumed message\\n' : 'stand-in last message\\n');
  process.stdout.write('{"type":"thread.star');
  process.stdout.write('ted","thread_id":"${thread}"}\\n');
  process.stdout.write('{"type":"item.completed","text":"العربية «»"}\\r\\n');
  process.exitCode = Number(process.env.ROUND_EXIT || 0);
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
	const env = {
		...process.env,
		PATH: `${bin}${path.delimiter}${process.env.PATH}`,
		ROUND_CAPTURE: capture,
		ROUND_REVIEW_CAPTURE: reviewCapture,
		FITWAY_BRIEF_REVIEW_ROOT: reviewRoot,
		CODEX_HOME: codexHome,
		OPENDESIGN_API_KEY: "fixture-opendesign-key",
	};
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
	it("refuses a missing cache and names the file and gpt-5.5 entry", () => {
		const f = fixture();
		const cache = path.join(f.codexHome, "models_cache.json");
		rmSync(cache);
		const result = f.invokeRaw([f.brief, "--run", f.run], {
			OPENDESIGN_API_KEY: "test-only",
		});
		refused(f, result, "model catalog cache not found");
		expect(result.stderr).toContain(cache);
		expect(result.stderr).toContain("gpt-5.5");
		expect(existsSync(f.run)).toBe(false);
	});

	it("refuses a cache without gpt-5.5", () => {
		const f = fixture();
		writeFileSync(
			path.join(f.codexHome, "models_cache.json"),
			'{"models":[]}\n',
		);
		const result = f.invokeRaw([f.brief, "--run", f.run], {
			OPENDESIGN_API_KEY: "test-only",
		});
		refused(f, result, "model catalog cache has no gpt-5.5 entry");
		expect(result.stderr).toContain(
			path.join(f.codexHome, "models_cache.json"),
		);
		expect(existsSync(f.run)).toBe(false);
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
		// Frozen hashes are from the coordinator's eight original last.md files.
		expect(createHash("sha256").update(bytes).digest("hex")).toBe(hash);
		const answer = bytes.toString("utf8");
		// The expected blocks come directly from the real numbered Markdown;
		// no production parser or label dictionary shapes these expectations.
		const blocks = answer
			.split(/(?=^\d+\. \*\*)/m)
			.map((block) => block.trim());
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
			"stand-in last message\n",
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
			"stand-in resumed message\n",
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
	expect(result.stdout).toContain(
		"Models: deepseek-v4.1-flash (default), gpt-6.1-sol.",
	);
	expect(result.stdout).toContain(
		"Levels: deepseek-v4.1-flash: high, max (default max); gpt-6.1-sol: medium, high, xhigh, max.",
	);
	expect(existsSync(f.capture)).toBe(false);
});
