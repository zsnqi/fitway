import { createHash } from "node:crypto";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync as readFixtureFile,
	realpathSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, expect } from "vitest";
import { outcomeIdsFromBrief, parseReadings } from "./brief-readings.mjs";
import { captureReviewSourceAccess } from "./check-brief-review-access-fixture.mjs";
import { copyReviewSources } from "./codex-review-launch.mjs";
import {
	copyGitFixtureRepository,
	removeGitFixtureTemplate,
} from "./codex-round-git-fixture";
import { firstShortWindowsPath } from "./codex-round-path-fixture.mjs";
import {
	commandEvent,
	fallbackEvidenceEvent,
	fallbackReportMessage,
	structuredReport,
} from "./codex-round-report-fixture.mjs";
import { runLauncher, writeCodexStandin } from "./codex-standin-fixture.mjs";
import { git } from "./fixtures";
import { pathKey, samePath } from "./path-identity.mjs";

export const repository = fileURLToPath(new URL("../../", import.meta.url));
export const script =
	process.env.FITWAY_ROUND_TEST_SCRIPT ||
	path.join(repository, "scripts/agent-environment/codex-round.mjs");
export const GPT_MODEL = "gpt-6.1-sol";
export const DEEPSEEK_MODEL = "deepseek-v4.1-flash";
export const environment = readFixtureFile(
	path.join(repository, "docs/agent-context/briefs/ENVIRONMENT.md"),
	"utf8",
);
const roots: string[] = [];
export const thread = "fixture-thread-123";
export const testRoot = process.env.FITWAY_ROUND_TEST_ROOT || tmpdir();
export const reviewDocument = readFixtureFile(
	path.join(repository, "docs/agent-context/briefs/REVIEW.md"),
	"utf8",
);
export const realReviewRoot = path.join(
	repository,
	"scripts/agent-environment/fixtures/codex-round-reviews",
);
export const realReviews = [
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
		"codex-vf-runner-1",
		5,
		"6f22457e49ac603719bf2532baaea281f6260a836065489fa364404b97eca44a",
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

export const quotedLabelReviews = [
	[
		"codex-launcher-fixes-5-fix-1",
		"2dc01640551a7a65338889276ee1814f31fc6843fc78fa69715111e5d0bb5843",
	],
	[
		"codex-launcher-fixes-5-fix-grade-2",
		"c23a47c01d77ee729fe5a4838314bb6427228eda5731b0c984026df7726f4931",
	],
] as const;
export function expectedReviewBlocks(answer: string) {
	const blocks = (starts: RegExpMatchArray[]) =>
		starts.map((start, index) =>
			answer
				.slice(start.index, starts[index + 1]?.index ?? answer.length)
				.trim(),
		);
	const numberedLines = [...answer.matchAll(/^\d+[.)]\s+\S[^\n]*$/gm)];
	if (numberedLines[0]?.index === 0) return blocks(numberedLines);
	const numbered = [...answer.matchAll(/^\d+[.)]\s+\*\*[^\n]+\*\*\s*$/gm)];
	if (numbered[0]?.index === 0) return blocks(numbered);
	const atx = [
		...answer.matchAll(
			/^#{1,6}\s+(?:\d+[.)]\s+|Reading\s+\d+\b)[^\n]*\b[A-Z]+\d+\b[^\n]*$/gim,
		),
	];
	if (atx[0]?.index === 0) return blocks(atx);
	const boldOutcome = [
		...answer.matchAll(
			/^\*\*[A-Z]+\d+(?:[ \t]*[.):\u2013\u2014-][^\n]*)?\*\*\s*$/gim,
		),
	];
	if (boldOutcome[0]?.index === 0) return blocks(boldOutcome);
	const bold = [
		...answer.matchAll(/^\*\*\d+[.)]\s+[^\n]*\b[A-Z]+\d+\b[^\n]*\*\*\s*$/gm),
	];
	return blocks(bold);
}

export function readingSnapshot(readings: ReturnType<typeof parseReadings>) {
	return readings === null
		? null
		: readings.map(({ id, text }) => ({ id, text: text.trim() }));
}

export const readingAnswer = `## Reading 1: R1

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

export function briefHash(brief: string) {
	return createHash("sha256").update(readFixtureFile(brief)).digest("hex");
}

export function findGitBash(searchPath = process.env.PATH ?? "") {
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

export function gitBashEnvironment(
	gitBash: string,
	environment: NodeJS.ProcessEnv,
) {
	const root = path.resolve(path.dirname(gitBash), "..", "..");
	const gitPath = [
		path.join(root, "usr", "bin"),
		path.join(root, "mingw64", "bin"),
		path.join(root, "mingw32", "bin"),
		environment.PATH,
	]
		.filter((value): value is string => Boolean(value))
		.join(path.delimiter);
	return { ...environment, MSYSTEM: "MINGW64", PATH: gitPath };
}

function writeModelCache(codexHome: string) {
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
}

function fixtureEnvironment({
	bin,
	capture,
	reviewCapture,
	reviewRoot,
	codexHome,
}: {
	bin: string;
	capture: string;
	reviewCapture: string;
	reviewRoot: string;
	codexHome: string;
}) {
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
	return env;
}

function writeReviewAnswer({
	reviewRoot,
	brief,
	answer,
	dispositions,
	number,
}: {
	reviewRoot: string;
	brief: string;
	answer: string;
	dispositions?: string;
	number: number;
}) {
	const folder = path.join(reviewRoot, `brief-${number}`);
	mkdirSync(folder, { recursive: true });
	writeFileSync(path.join(folder, "brief.md"), readFixtureFile(brief));
	writeFileSync(path.join(folder, "last.md"), answer);
	writeFileSync(
		path.join(folder, "dispositions.md"),
		dispositions ?? `Brief SHA-256: ${briefHash(brief)}\n`,
	);
	return folder;
}

function fixtureInvokers({
	env,
	root,
	brief,
	capture,
	run,
}: {
	env: NodeJS.ProcessEnv;
	root: string;
	brief: string;
	capture: string;
	run: string;
}) {
	const captured = () => JSON.parse(readFixtureFile(capture, "utf8"));
	const invokeRaw = (args: string[], extraEnv = {}, cwd = root) => {
		const result = runLauncher(script, args, {
			cwd,
			env: { ...env, ...extraEnv },
		});
		if (process.env.FITWAY_ROUND_TEST_SCRIPT && existsSync(capture))
			console.log(
				`Mutation evidence: stand-in recorded ${captured().args.includes("resume") ? "resume" : "launch"}; status ${result.status}`,
			);
		return result;
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
	return { invoke, invokeRaw, captured };
}

function fixtureRuntime({
	root,
	brief,
	bin,
	capture,
	reviewCapture,
	reviewRoot,
	run,
	codexHome,
}: {
	root: string;
	worktree: string;
	brief: string;
	bin: string;
	capture: string;
	reviewCapture: string;
	reviewRoot: string;
	run: string;
	codexHome: string;
}) {
	const env = fixtureEnvironment({
		bin,
		capture,
		reviewCapture,
		reviewRoot,
		codexHome,
	});
	const { invoke, invokeRaw, captured } = fixtureInvokers({
		env,
		root,
		brief,
		capture,
		run,
	});
	const reviewCalls = () =>
		existsSync(reviewCapture)
			? readFixtureFile(reviewCapture, "utf8")
					.trim()
					.split("\n")
					.map((line) => JSON.parse(line))
			: [];
	const answerReview = (
		answer = "No such readings.\n",
		dispositions?: string,
		number = 1,
	) =>
		writeReviewAnswer({
			reviewRoot,
			brief,
			answer,
			dispositions,
			number,
		});
	answerReview();
	return {
		env,
		invoke,
		invokeRaw,
		captured,
		reviewCalls,
		answerReview,
	};
}

function removeFixtureRoot(root: string) {
	const absolute = realpathSync.native(root);
	const relative = path.relative(realpathSync.native(testRoot), absolute);
	if (path.isAbsolute(relative) || !relative.startsWith("fitway-round-test-"))
		throw new Error(`Unsafe fixture cleanup: ${absolute}`);
	rmSync(absolute, { recursive: true, force: true });
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		removeFixtureRoot(root);
	}
});

afterAll(() => {
	removeGitFixtureTemplate(testRoot);
});

export function fixture(eol = "\n") {
	mkdirSync(testRoot, { recursive: true });
	const root = mkdtempSync(path.join(testRoot, "fitway-round-test-"));
	roots.push(root);
	const worktree = path.join(root, "build space «العربية»");
	const coordinator = path.join(root, "coordinator");
	copyGitFixtureRepository(testRoot, worktree);
	copyGitFixtureRepository(testRoot, coordinator);
	const head = git(worktree, "rev-parse", "HEAD");
	const brief = path.join(coordinator, "brief.md");
	const bytes = Buffer.from(
		`<!-- brief-format: v1 role: codex delivers: report -->\n# Fixture\n\n- **Worktree:** \`${worktree.replaceAll("\\", "/")}\`, branch \`fixture\`, HEAD \`${head.slice(0, 8)}\`\n\n${environment.replaceAll("\r\n", "\n")}\n## Goal\n\nالنص «كما هو»\n\n## Scope\n\nWrite only in the fixture. If an outcome cannot be met, do not work around it: finish and measure the others, then stop and report.\n\n## Causes and required outcomes\n\n- **K1.** Fixture outcome.\n`.replaceAll(
			"\n",
			eol,
		),
	);
	writeFileSync(brief, bytes);
	git(coordinator, "add", ".");
	git(coordinator, "commit", "-m", "tracked brief");
	const bin = path.join(root, "bin");
	writeCodexStandin(bin, thread);
	const capture = path.join(root, "capture.json");
	const reviewCapture = path.join(root, "review-capture.jsonl");
	const reviewRoot = path.join(root, "reviews");
	const run = path.join(root, "run");
	// Never read the machine's own Codex sessions.
	const codexHome = path.join(root, "codex-home");
	mkdirSync(codexHome, { recursive: true });
	writeModelCache(codexHome);
	const { env, invoke, invokeRaw, captured, reviewCalls, answerReview } =
		fixtureRuntime({
			root,
			brief,
			run,
			bin,
			codexHome,
			capture,
			reviewRoot,
			reviewCapture,
		});
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

export function tokenCount(input: number | null, total = input) {
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

export function session(
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

export function expectedArgs(
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

export function expectedDeepSeekArgs(
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
export async function argumentKeys(args: string[]) {
	return Promise.all(
		args.map((value, index) =>
			index === 3 || index === 10 ? pathKey(value) : value,
		),
	);
}

export async function captureKeys(capture: {
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

export function refused(
	f: ReturnType<typeof fixture>,
	result: ReturnType<ReturnType<typeof fixture>["invoke"]>,
	reason: string,
) {
	expect(result.status, result.output).toBe(1);
	expect(result.stderr.trim().split(/\r?\n/)).toHaveLength(1);
	expect(result.stderr).toContain(reason);
	expect(existsSync(f.capture)).toBe(false);
}

export function requiredFixture(kind = "repository", marked = true) {
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

export function comparison(f: ReturnType<typeof requiredFixture>, suffix = "") {
	return JSON.parse(
		readFixtureFile(path.join(f.run, `required-changes${suffix}.json`), "utf8"),
	);
}

export function jsonLinesIfPresent(filename: string) {
	if (!existsSync(filename)) return [];
	const text = readFixtureFile(filename, "utf8").trim();
	if (!text) return [];
	return text.split(/\r?\n/).map((line) => JSON.parse(line));
}

export function expectReviewReadings(
	result: ReturnType<ReturnType<typeof fixture>["invoke"]>,
	blocks: string[],
) {
	const section = result.stdout
		.split("Readings:\n")[1]
		?.split("\nWrite coordinator dispositions to:")[0];
	expect(section).toBe(
		blocks
			.map((block, index) => `Reading ${index + 1}:\n${block}`)
			.join("\n\n"),
	);
}

export function expectReviewAnswerLaunch(
	f: ReturnType<typeof fixture>,
	answer: string,
) {
	f.answerReview(
		answer,
		`Brief SHA-256: ${briefHash(f.brief)}\nReading 1: closed\nReading 2: closed\n`,
	);
	const result = f.invoke();
	expect(result.status, result.output).toBe(0);
	expect(readFixtureFile(path.join(f.run, "review-readings.md"), "utf8")).toBe(
		answer,
	);
}

export function closeReviewReadings(f: ReturnType<typeof fixture>, count = 5) {
	const folder = path.join(f.reviewRoot, "brief-1");
	writeFileSync(
		path.join(folder, "dispositions.md"),
		`Brief SHA-256: ${briefHash(f.brief)}\n${Array.from(
			{ length: count },
			(_, index) => `Reading ${index + 1}: closed`,
		).join("\n")}\n`,
	);
	return folder;
}

export function reviewRefused(
	f: ReturnType<typeof fixture>,
	result: ReturnType<ReturnType<typeof fixture>["invoke"]>,
	reason: string,
) {
	refused(f, result, reason);
	expect(
		existsSync(f.capture),
		"refusal must prevent the stand-in launch",
	).toBe(false);
	expect(result.stdout).toContain(
		`Current brief SHA-256: ${briefHash(f.brief)}`,
	);
	expect(existsSync(f.run)).toBe(false);
}

beforeAll(() => {
	mkdirSync("D:/fitway-temp", { recursive: true });
});

export {
	captureReviewSourceAccess,
	commandEvent,
	copyReviewSources,
	fallbackEvidenceEvent,
	fallbackReportMessage,
	firstShortWindowsPath,
	git,
	outcomeIdsFromBrief,
	parseReadings,
	pathKey,
	samePath,
	structuredReport,
};
