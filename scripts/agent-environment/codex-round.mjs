import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants, createReadStream } from "node:fs";
import {
	access,
	appendFile,
	mkdir,
	open,
	readdir,
	readFile,
	realpath,
	stat,
	writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { TextDecoder } from "node:util";
import {
	checkBrief,
	formatBriefResult,
	isCredentialSource,
	namedReviewSourceEntries,
	reviewSourcePlan,
} from "./check-brief.mjs";
import { readGit } from "./git-context.mjs";
import { pathKey, samePath } from "./path-identity.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const GPT_MODEL = "gpt-6.1-sol";
const DEEPSEEK_MODEL = "deepseek-v4.1-flash";
const GPT_LEVELS = new Set(["medium", "high", "xhigh", "max"]);
const DEEPSEEK_LEVELS = new Set(["high", "max"]);
const DEFAULT_MODEL = DEEPSEEK_MODEL;
const DEFAULT_DEEPSEEK_LEVEL = "max";
const MAX_AUTO_RESUMES = 10;
const MODEL_LEVELS = new Map([
	[DEEPSEEK_MODEL, DEEPSEEK_LEVELS],
	[GPT_MODEL, GPT_LEVELS],
]);
const HELP = `Usage: pnpm codex:round [--] <brief> [<level>] [--model <model>] [--run <folder>] [--new-review]
       pnpm codex:round [--] resume <folder> [--message <text> | --message-file <file>]
       node <repository>/scripts/agent-environment/codex-round.mjs <brief> [<level>] [--model <model>] [--run <folder>] [--new-review]
       node <repository>/scripts/agent-environment/codex-round.mjs resume <folder> [--message <text> | --message-file <file>]

Models: deepseek-v4.1-flash (default), gpt-6.1-sol.
Levels: deepseek-v4.1-flash: high, max (default max); gpt-6.1-sol: medium, high, xhigh, max.
Relative brief and run paths start at the repository root, in either shell.
Default run folder: ${process.platform === "win32" ? "D:/fitway-temp" : tmpdir()}/codex-round-<id>.
Launch runs the REVIEW.md review when absent and stops for coordinator dispositions.
--new-review requests a fresh review and stops; resume never checks reviews.
Resume allows unfinished changes, keeps each event stream, and updates last-message.md.
When a run exits 0 without a report, it resumes automatically up to 10 times and
appends each trigger to auto-resumes.log.
A report names every brief outcome/limit ID on PASS or FAIL lines, or has a
line starting STOPPED:.
--message sends the exact text instead of the saved launch input.
--message-file decodes UTF-8 (with or without a BOM) or UTF-16 files with a BOM,
then sends UTF-8 without the BOM; invalid no-BOM bytes are refused;
use this shell-safe form for quotes, backslashes, Unicode or multiline text.
After a run, start-load.json records the thread's first request (input tokens) from
Codex's session file under CODEX_HOME (default ~/.codex), unless the folder has one.`;

function resolvePath(value) {
	return path.resolve(repositoryRoot, value.replaceAll("\\", "/"));
}

function levelsFor(model) {
	return MODEL_LEVELS.get(model);
}

function validateModelLevel(model, level) {
	const levels = levelsFor(model);
	if (!levels)
		throw new Error(
			`unsupported model: ${model}; use ${[...MODEL_LEVELS.keys()].join(" or ")}`,
		);
	if (level === undefined || level === "") {
		if (model === DEEPSEEK_MODEL) return DEFAULT_DEEPSEEK_LEVEL;
		throw new Error(
			`unsupported reasoning level: missing; ${model} accepts ${[...levels].join(", ")}`,
		);
	}
	if (!levels.has(level))
		throw new Error(
			`unsupported reasoning level for ${model}: ${level}; use ${[...levels].join(", ")}`,
		);
	return level;
}

function shellTokens(command) {
	const tokens = [];
	let token = "";
	let quote = null;
	let escaped = false;
	for (const character of command.trim()) {
		if (escaped) {
			token += character;
			escaped = false;
			continue;
		}
		if (character === "\\" && quote !== "'") {
			escaped = true;
			continue;
		}
		if (quote) {
			if (character === quote) quote = null;
			else token += character;
			continue;
		}
		if (character === "'" || character === '"') {
			quote = character;
			continue;
		}
		if (/\s/.test(character)) {
			if (token) {
				tokens.push(token);
				token = "";
			}
			continue;
		}
		token += character;
	}
	if (quote) throw new Error("review command has an unmatched quote");
	if (escaped) token += "\\";
	if (token) tokens.push(token);
	return tokens;
}

function modelArgs(model, level, catalogPath) {
	if (model === GPT_MODEL)
		return ["-m", GPT_MODEL, "-c", `model_reasoning_effort=${level}`];
	if (model === DEEPSEEK_MODEL) {
		if (!catalogPath) throw new Error("DeepSeek requires a model catalog");
		return [
			"-m",
			DEEPSEEK_MODEL,
			"-c",
			"model_provider=opendesign",
			"-c",
			'model_providers.opendesign={name="OpenDesign",base_url="https://amr-link.open-design.ai/v1",env_key="OPENDESIGN_API_KEY",wire_api="responses"}',
			"-c",
			`model_catalog_json=${JSON.stringify(catalogPath.replaceAll("\\", "/"))}`,
			"-c",
			`model_reasoning_effort=${level}`,
			"-c",
			"web_search=disabled",
			"-c",
			"features.hooks=false",
		];
	}
	throw new Error(`unsupported model: ${model}`);
}

function requireDeepSeekKey() {
	if (!process.env.OPENDESIGN_API_KEY?.trim())
		throw new Error("OPENDESIGN_API_KEY is required for DeepSeek");
}

function catalogPathFor(catalog) {
	return catalog ? path.join(catalog.run, "model-catalog.json") : undefined;
}

function deepSeekCatalogEntry(source) {
	const entry = JSON.parse(JSON.stringify(source));
	entry.slug = DEEPSEEK_MODEL;
	entry.display_name = "DeepSeek V4.1 Flash (Open Design)";
	entry.description = "DeepSeek V4.1 Flash through Open Design";
	entry.default_reasoning_level = "high";
	entry.supported_reasoning_levels = [
		{ effort: "high", description: "high" },
		{ effort: "max", description: "max" },
	];
	entry.priority = 99;
	entry.additional_speed_tiers = [];
	entry.service_tiers = [];
	entry.available_access_programs = { cyber: [] };
	entry.upgrade = null;
	entry.support_verbosity = false;
	entry.default_verbosity = null;
	entry.web_search_tool_type = "text";
	entry.supports_image_detail_original = false;
	entry.context_window = 900000;
	entry.max_context_window = 1000000;
	entry.input_modalities = ["text"];
	entry.supports_search_tool = false;
	entry.node_repl_disabled = true;
	delete entry.comp_hash;
	return entry;
}

async function readDeepSeekCatalog(run) {
	requireDeepSeekKey();
	const codexHome = process.env.CODEX_HOME || path.join(homedir(), ".codex");
	const cachePath = path.join(codexHome, "models_cache.json");
	let cache;
	try {
		cache = JSON.parse(await readFile(cachePath, "utf8"));
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR")
			throw new Error(
				`model catalog cache not found: ${cachePath}; expected gpt-5.5`,
			);
		throw error;
	}
	const source = cache.models?.find((entry) => entry?.slug === "gpt-5.5");
	if (!source)
		throw new Error(`model catalog cache has no gpt-5.5 entry: ${cachePath}`);
	const bytes = Buffer.from(
		`${JSON.stringify({ models: [deepSeekCatalogEntry(source)] }, null, 2)}\n`,
	);
	return { bytes, sha256: sha256(bytes), run };
}

async function writeCatalog(catalog, flag = "wx") {
	if (!catalog) return;
	await writeFile(catalogPathFor(catalog), catalog.bytes, { flag });
}

function decodeMessageFile(bytes, filename) {
	const startsWith = (...prefix) =>
		prefix.every((value, index) => bytes[index] === value);
	let encoding = "utf-8";
	let offset = 0;
	if (startsWith(0xef, 0xbb, 0xbf)) {
		offset = 3;
	} else if (startsWith(0xff, 0xfe)) {
		encoding = "utf-16le";
		offset = 2;
	} else if (startsWith(0xfe, 0xff)) {
		encoding = "utf-16be";
		offset = 2;
	}
	let text;
	try {
		text = new TextDecoder(encoding, { fatal: true }).decode(
			bytes.subarray(offset),
		);
	} catch {
		throw new Error(
			`message file is not valid UTF-8; write it as UTF-8: ${filename}`,
		);
	}
	if (text.length === 0) throw new Error(`message file is empty: ${filename}`);
	return Buffer.from(text, "utf8");
}

function parseArgs(input) {
	const args = input[0] === "--" ? input.slice(1) : input;
	if (args.length === 1 && ["--help", "-h"].includes(args[0]))
		return { help: true };
	if (args[0] === "resume") {
		if (
			![2, 4].includes(args.length) ||
			(args.length === 4 && !["--message", "--message-file"].includes(args[2]))
		)
			throw new Error(
				"expected resume <folder> [--message <text> | --message-file <file>]",
			);
		return {
			resume: true,
			run: resolvePath(args[1]),
			message: args[2] === "--message" ? args[3] : undefined,
			messageFile:
				args[2] === "--message-file" ? resolvePath(args[3]) : undefined,
		};
	}
	let run;
	let model = DEFAULT_MODEL;
	let modelSeen = false;
	let newReview = false;
	const positionals = [];
	for (let index = 0; index < args.length; index += 1) {
		const argument = args[index];
		if (argument === "--model") {
			if (modelSeen || !args[index + 1] || args[index + 1].startsWith("-"))
				throw new Error("--model requires <deepseek-v4.1-flash|gpt-6.1-sol>");
			model = args[++index];
			modelSeen = true;
		} else if (argument === "--run") {
			if (run || !args[index + 1]) throw new Error("--run requires a folder");
			run = resolvePath(args[++index]);
		} else if (argument === "--new-review") {
			if (newReview) throw new Error("--new-review was repeated");
			newReview = true;
		} else if (argument.startsWith("-")) {
			throw new Error(`unexpected launch option: ${argument}`);
		} else {
			positionals.push(argument);
		}
	}
	if (positionals.length < 1 || positionals.length > 2)
		throw new Error(
			"expected <brief> [<level>] [--model <model>] [--run <folder>] [--new-review]",
		);
	const level =
		positionals[1] ??
		(model === DEEPSEEK_MODEL ? DEFAULT_DEEPSEEK_LEVEL : undefined);
	return {
		brief: resolvePath(positionals[0]),
		level,
		model,
		newReview,
		run:
			run ??
			path.join(
				process.platform === "win32" ? "D:/fitway-temp" : tmpdir(),
				`codex-round-${randomUUID()}`,
			),
	};
}

// Resolve only PATH entries, never a shell alias or the invoking directory.
async function findCodex() {
	const extensions =
		process.platform === "win32" ? [".exe", ".com", ".cmd", ".bat"] : [""];
	for (const directory of (process.env.PATH ?? "").split(path.delimiter)) {
		if (!directory) continue;
		for (const extension of extensions) {
			const candidate = path.resolve(
				directory.replace(/^"|"$/g, ""),
				`codex${extension}`,
			);
			try {
				if (!(await stat(candidate)).isFile()) continue;
				await access(
					candidate,
					process.platform === "win32" ? constants.F_OK : constants.X_OK,
				);
				return candidate;
			} catch {
				// Try the next PATH entry.
			}
		}
	}
	throw new Error("codex is not on PATH");
}

async function existingAncestor(value) {
	let current = value;
	for (;;) {
		try {
			const details = await stat(current);
			return details.isDirectory() ? current : path.dirname(current);
		} catch (error) {
			if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
			const parent = path.dirname(current);
			if (parent === current) throw error;
			current = parent;
		}
	}
}

async function assertOutsideGit(run) {
	const existing = await existingAncestor(run);
	// Inspect both routes: a junction into a tree, or out of a tree, still fails.
	for (const start of [existing, await realpath(existing)]) {
		let current = start;
		for (;;) {
			let inside = false;
			try {
				inside =
					readGit(current, ["rev-parse", "--is-inside-work-tree"]) === "true";
			} catch {
				// A path outside Git is expected.
			}
			if (inside) throw new Error("run folder is inside a Git working tree");
			const parent = path.dirname(current);
			if (parent === current) break;
			current = parent;
		}
	}
}

async function assertFresh(run) {
	await assertOutsideGit(run);
	try {
		if ((await readdir(run)).length)
			throw new Error("run folder already holds a run or is not empty");
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
}

function sha256(bytes) {
	return createHash("sha256").update(bytes).digest("hex");
}

// REVIEW.md owns both the command and the prompt. Interpret its argv as data,
// without a shell, replacing only the documented folder placeholder.
async function reviewProcedure(folder, catalogPath) {
	const document = await readFile(
		path.join(repositoryRoot, "docs/agent-context/briefs/REVIEW.md"),
		"utf8",
	);
	const command = document.match(
		/^## Running it\r?\n(?:(?!^## ).)*?```bash\r?\n([^`]+)```/ms,
	)?.[1];
	const prompt = document.match(
		/^## Prompt\r?\n\s*```text\r?\n([\s\S]*?)^```\s*$/m,
	)?.[1];
	const tokens = command
		? shellTokens(command).map((token) =>
				token
					.replaceAll("<folder>", folder)
					.replaceAll("<catalog>", catalogPath.replaceAll("\\", "/")),
			)
		: undefined;
	const redirect = tokens?.indexOf("<");
	const route = modelArgs(DEEPSEEK_MODEL, "max", catalogPath);
	const routeStart = tokens?.indexOf("-m");
	if (
		!prompt ||
		!tokens ||
		tokens[0] !== "codex" ||
		redirect !== tokens.length - 2 ||
		tokens[redirect - 1] !== "-" ||
		typeof tokens[redirect + 1] !== "string" ||
		path.resolve(tokens[redirect + 1]) !== path.resolve(folder, "prompt.md") ||
		tokens[tokens.indexOf("-s") + 1] !== "read-only" ||
		routeStart < 0 ||
		tokens.slice(routeStart, routeStart + route.length).join("\0") !==
			route.join("\0")
	)
		throw new Error("cannot read the review command and prompt from REVIEW.md");
	return {
		prompt,
		args: tokens.slice(1, redirect),
	};
}

// The unchanged prompt asks for Markdown, not a fixed set of field labels.
// Preserve each numbered reading as written; explicit reading headings retain
// the older four-field format. Ambiguous answers fail closed.
function markdownLineRecords(text) {
	const records = [];
	let index = 0;
	let fence = null;
	for (const raw of text.split("\n")) {
		const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
		const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
		if (delimiter) {
			if (!fence) fence = delimiter[1];
			else if (
				delimiter[1][0] === fence[0] &&
				delimiter[1].length >= fence.length &&
				/^ {0,3}(?:`+|~+)\s*$/.test(line)
			)
				fence = null;
		} else if (!fence) records.push({ index, line });
		index += raw.length + 1;
	}
	return records;
}

function headingStart({ index, line }) {
	const heading = line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*$/);
	if (!heading) return null;
	const content = heading[2];
	const numbered = content.match(/^(\d+)[.)](?=[ \t]|$)/);
	const reading = content.match(/^Reading[ \t]+(\d+)\b/i);
	return {
		type: "heading",
		index,
		level: heading[1].length,
		number: Number(numbered?.[1] ?? reading?.[1] ?? Number.NaN),
		bodyLines: 2,
	};
}

function boldStart({ index, line }) {
	const marker = line.match(/^ {0,3}\*\*(\d+)[.)]\*\*[ \t]+\S/);
	if (marker)
		return {
			type: "bold",
			index,
			number: Number(marker[1]),
			bodyLines: 1,
		};
	const numbered = line.match(/^ {0,3}\*\*(\d+)[.)][ \t]+\S[^\n]*\*\*[ \t]*$/);
	if (numbered)
		return {
			type: "bold",
			index,
			number: Number(numbered[1]),
			bodyLines: 3,
		};
	const reading = line.match(
		/^ {0,3}\*\*Reading[ \t]+(\d+)\b[^\n]*\*\*[ \t]*$/i,
	);
	if (reading)
		return {
			type: "bold",
			index,
			number: Number(reading[1]),
			bodyLines: 3,
		};
	return null;
}

function numberedBoldStart({ index, line }) {
	const match = line.match(/^ {0,3}(\d+)[.)][ \t]+\*\*[^\n]*\*\*[ \t]*$/);
	if (!match) return null;
	return {
		type: "numbered-bold",
		index,
		number: Number(match[1]),
		bodyLines: 1,
	};
}

function readingsFromStarts(text, starts) {
	if (!starts.length || starts.length > 5) return null;
	if (starts.some((start, index) => start.number !== index + 1)) return null;
	const readings = starts.map((start, index) => ({
		id: index + 1,
		text: text
			.slice(start.index, starts[index + 1]?.index ?? text.length)
			.trim(),
		bodyLines:
			starts.length === 1 && start.type === "heading"
				? Math.max(start.bodyLines, 3)
				: start.bodyLines,
	}));
	if (
		readings.some(
			(reading) =>
				!/\b[A-Z]+\d+\b/.test(reading.text) ||
				reading.text
					.split(/\r?\n/)
					.slice(1)
					.filter((line) => line.trim()).length < reading.bodyLines,
		)
	)
		return null;
	return readings.map(({ id, text }) => ({ id, text }));
}

function parseReadings(answer) {
	const text = answer.trim();
	const plain = text.replace(/[*_`]/g, "");
	if (
		/^(?:(?:The brief has|This brief has|There are|I found|I find) )?no (?:such |literal )?readings?(?: (?:found|identified|in (?:this|the) brief))?[.!]?$/i.test(
			plain,
		)
	)
		return [];

	const headings = [];
	const bold = [];
	const numberedBold = [];
	for (const record of markdownLineRecords(text)) {
		const heading = headingStart(record);
		if (heading) headings.push(heading);
		const boldStartRecord = boldStart(record);
		if (boldStartRecord) bold.push(boldStartRecord);
		const numberedBoldRecord = numberedBoldStart(record);
		if (numberedBoldRecord) numberedBold.push(numberedBoldRecord);
	}

	if (headings.length) {
		const level = headings[0].level;
		const sameLevel = headings.filter((heading) => heading.level === level);
		if (
			headings.some((heading) => heading.level < level) ||
			sameLevel.some((heading) => !Number.isInteger(heading.number))
		)
			return null;
		return readingsFromStarts(text, sameLevel);
	}
	if (bold.length && bold[0].index === 0) return readingsFromStarts(text, bold);
	if (numberedBold.length && numberedBold[0].index === 0)
		return readingsFromStarts(text, numberedBold);
	return null;
}

function outcomeIdsFromBrief(input) {
	const ids = new Set();
	const text = Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
	let section = false;
	for (const line of text.split(/\r?\n/)) {
		const heading = line.match(/^##\s+(.+?)\s*$/)?.[1];
		if (heading) {
			section =
				/^(?:Causes and required outcomes|Limits the result keeps)$/i.test(
					heading,
				);
			continue;
		}
		if (!section) continue;
		const outcome = line.match(/^- \*\*([A-Z]+\d+)\./);
		if (outcome) ids.add(outcome[1]);
	}
	return ids;
}

function reportIds(message) {
	const covered = new Set();
	for (const line of message.split(/\r?\n/)) {
		if (!/\b(?:PASS|FAIL)\b/.test(line)) continue;
		for (const match of line.matchAll(
			/\b([A-Z]+)(\d+)\s*[-\u2013\u2014]\s*(?:\1)?(\d+)\b/g,
		)) {
			const first = Number(match[2]);
			const last = Number(match[3]);
			for (
				let number = Math.min(first, last);
				number <= Math.max(first, last);
				number += 1
			)
				covered.add(`${match[1]}${number}`);
		}
		for (const match of line.matchAll(/\b[A-Z]+\d+\b/g)) covered.add(match[0]);
	}
	return covered;
}

function isReport(message, outcomeIds) {
	if (/^STOPPED:/m.test(message)) return true;
	if (!outcomeIds.size) return true;
	const covered = reportIds(message);
	return [...outcomeIds].every((id) => covered.has(id));
}

function firstLine(message) {
	return message.split(/\r?\n/, 1)[0] ?? "";
}

function quoteLine(line) {
	const longestRun = Math.max(
		0,
		...[...line.matchAll(/`+/g)].map((match) => match[0].length),
	);
	const fence = "`".repeat(Math.max(3, longestRun + 1));
	return `${fence}\n${line}\n${fence}`;
}

function autoResumeMessage(line) {
	return `The run ended because a message without a tool call ends it. Its first line was exactly:\n${quoteLine(line)}\nContinue toward the brief's outcomes, wait inside tool calls, and send a message only as your report, or a line \`STOPPED: <reason>\` when you stop on purpose.\n`;
}

async function optionalFile(filename) {
	try {
		return await readFile(filename);
	} catch (error) {
		if (error.code === "ENOENT") return undefined;
		throw error;
	}
}

async function reviewFolders(root, basename) {
	let entries;
	try {
		entries = await readdir(root, { withFileTypes: true });
	} catch (error) {
		if (error.code === "ENOENT") return [];
		throw error;
	}
	return entries
		.filter(
			(entry) => entry.isDirectory() && entry.name.startsWith(`${basename}-`),
		)
		.map((entry) => ({
			name: entry.name,
			number: Number(entry.name.slice(basename.length + 1)),
		}))
		.filter(
			(entry) =>
				/^[1-9]\d*$/.test(entry.name.slice(basename.length + 1)) &&
				Number.isSafeInteger(entry.number),
		)
		.sort((a, b) => b.number - a.number);
}

export async function copyReviewSources(folder, brief, worktree, head) {
	const sources = path.join(folder, "sources");
	await mkdir(sources, { recursive: true });
	const targets = new Map();
	for (const { value } of namedReviewSourceEntries(brief)) {
		const source = await reviewSourcePlan(value, {
			worktree,
			head,
			checkoutRoot: repositoryRoot,
		});
		if (isCredentialSource(value, source.bytes))
			throw new Error(`named review source holds credentials: ${value}`);
		const target = path.join(sources, ...source.target.split("/"));
		const targetKey = await pathKey(target);
		if (targets.has(targetKey))
			throw new Error(`two named review sources map to one file: ${value}`);
		targets.set(targetKey, value);
		await mkdir(path.dirname(target), { recursive: true });
		await writeFile(target, source.bytes, { flag: "wx" });
	}
}

async function assertReviewSourcesAtLaunch(brief, worktree, namedHead, head) {
	if (namedHead === head) return;
	for (const { value } of namedReviewSourceEntries(brief)) {
		const before = await reviewSourcePlan(value, {
			worktree,
			head: namedHead,
			checkoutRoot: repositoryRoot,
		});
		if (before.kind !== "repository") continue;
		let after;
		try {
			after = await reviewSourcePlan(value, {
				worktree,
				head,
				checkoutRoot: repositoryRoot,
			});
		} catch (error) {
			throw new Error(
				`repository review source changed before launch: ${value}; ${error.message}`,
			);
		}
		if (!before.bytes.equals(after.bytes))
			throw new Error(
				`repository review source differs between named HEAD ${namedHead} and launch HEAD ${head}: ${value}`,
			);
	}
}

async function runReview(folder, executable, brief, worktree, head) {
	const catalog = await readDeepSeekCatalog(folder);
	const { args, prompt } = await reviewProcedure(
		folder,
		catalogPathFor(catalog),
	);
	await writeFile(path.join(folder, "brief.md"), brief, { flag: "wx" });
	await writeFile(path.join(folder, "prompt.md"), prompt, { flag: "wx" });
	await copyReviewSources(folder, brief, worktree, head);
	await writeCatalog(catalog);
	const record = path.join(folder, "review.json");
	await writeFile(
		record,
		`${JSON.stringify({
			status: "running",
			sha256: sha256(brief),
			catalogSha256: catalog.sha256,
		})}\n`,
		{ flag: "wx" },
	);
	const log = await open(path.join(folder, "review.log"), "wx");
	const stream = log.createWriteStream();
	const child = startCodex(executable, args, folder);
	child.stdin.on("error", (error) => {
		if (error.code !== "EPIPE") console.error(`codex-round: ${error.message}`);
	});
	const completion = new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("close", (code, signal) =>
			resolve(code ?? (signal === "SIGINT" ? 130 : 1)),
		);
	});
	child.stdout.pipe(stream);
	child.stdin.end(Buffer.from(prompt, "utf8"));
	let code;
	try {
		[code] = await Promise.all([completion, finished(stream)]);
	} finally {
		if (child.exitCode === null) child.kill();
		stream.destroy();
		await log.close();
	}
	await writeFile(
		record,
		`${JSON.stringify({
			status: code === 0 ? "complete" : "failed",
			exitCode: code,
			sha256: sha256(brief),
			catalogSha256: catalog.sha256,
		})}\n`,
	);
}

async function inspectBriefReview(options, executable, brief, worktree, head) {
	const root = path.resolve(
		process.env.FITWAY_BRIEF_REVIEW_ROOT ||
			path.join(
				process.platform === "win32" ? "D:/fitway-temp" : tmpdir(),
				"brief-review",
			),
	);
	const basename = path.basename(options.brief, path.extname(options.brief));
	const snapshot = {
		folder: undefined,
		readings: undefined,
		dispositions: undefined,
	};
	const refuse = (refusal, reason) => ({ ...snapshot, refusal, reason });
	try {
		await assertOutsideGit(root);
		const folders = await reviewFolders(root, basename);
		const fresh = options.newReview || !folders.length;
		snapshot.folder = path.join(
			root,
			fresh ? `${basename}-${(folders[0]?.number ?? 0) + 1}` : folders[0].name,
		);
		if (fresh) {
			await mkdir(root, { recursive: true });
			// Exclusive creation prevents simultaneous requests sharing a review.
			await mkdir(snapshot.folder);
			await assertOutsideGit(snapshot.folder);
			console.log(`Review folder: ${snapshot.folder}`);
			await runReview(snapshot.folder, executable, brief, worktree, head);
		} else {
			await assertOutsideGit(snapshot.folder);
			console.log(`Review folder: ${snapshot.folder}`);
		}
		snapshot.readings = await optionalFile(
			path.join(snapshot.folder, "last.md"),
		);
		snapshot.dispositions = await optionalFile(
			path.join(snapshot.folder, "dispositions.md"),
		);
		const record = await optionalFile(
			path.join(snapshot.folder, "review.json"),
		);
		if (record) {
			const status = JSON.parse(record.toString("utf8"));
			if (status.status !== "complete" || status.exitCode !== 0)
				return refuse(
					"failed-review",
					`review failed or is unfinished (Codex exit ${status.exitCode ?? "unknown"}); inspect ${snapshot.folder}`,
				);
		}
		const readings =
			snapshot.readings && parseReadings(snapshot.readings.toString("utf8"));
		if (!readings)
			return refuse(
				"unreadable-review",
				`review answer cannot be read as readings; inspect ${snapshot.folder}`,
			);
		if (fresh) {
			console.log(
				`Readings:\n${readings.length ? readings.map((reading) => `Reading ${reading.id}:\n${reading.text}`).join("\n\n") : "No such readings."}`,
			);
			console.log(
				`Write coordinator dispositions to: ${path.join(snapshot.folder, "dispositions.md")}`,
			);
			return refuse(
				"new-review",
				"review completed; record its dispositions before launching",
			);
		}
		const dispositions = snapshot.dispositions?.toString("utf8") ?? "";
		const missing = readings.filter((reading) => {
			const answers = [
				...dispositions.matchAll(
					new RegExp(`^Reading ${reading.id}: (.+)\\r?$`, "gm"),
				),
			];
			return (
				answers.length !== 1 ||
				!/^(?:closed(?:\s.*)?|left open\s*[:\u2014-]\s*\S.*)$/i.test(
					answers[0][1].trim(),
				)
			);
		});
		if (missing.length)
			return refuse(
				"unanswered-readings",
				`readings without a disposition: ${missing.map((reading) => `Reading ${reading.id} (${reading.text.split(/\r?\n/)[0]})`).join("; ")}; write ${path.join(snapshot.folder, "dispositions.md")}`,
			);
		const hashes = [
			...dispositions.matchAll(/^Brief SHA-256: ([a-fA-F0-9]{64})\r?$/gm),
		];
		if (hashes.length !== 1 || hashes[0][1].toLowerCase() !== sha256(brief))
			return refuse(
				"brief-hash",
				`dispositions must name the current brief SHA-256; write ${path.join(snapshot.folder, "dispositions.md")}`,
			);
		return snapshot;
	} catch (error) {
		return refuse(
			"failed-review",
			`review failed: ${error.message}; inspect ${snapshot.folder ?? root}`,
		);
	}
}

async function prepareLaunch(options) {
	// The checker is the first launch gate; it never fills or rewrites the brief.
	const result = await checkBrief({ repositoryRoot, briefPath: options.brief });
	if (!result.ok) {
		const failure = result.problems.find(
			(problem) => problem.severity === "FAIL",
		);
		throw new Error(
			`brief:check failed (${failure.rule}, line ${failure.line}): ${failure.message}`,
		);
	}
	if (result.role !== "codex") throw new Error("brief must have role: codex");
	options.level = validateModelLevel(options.model, options.level);
	const worktree = resolvePath(result.worktree);
	if (readGit(worktree, ["status", "--short"]))
		throw new Error("target worktree has uncommitted changes");
	readGit(path.dirname(options.brief), [
		"ls-files",
		"--error-unmatch",
		options.brief,
	]);
	await assertFresh(options.run);
	const executable = await findCodex();
	const brief = await readFile(options.brief);
	const named = brief
		.toString("utf8")
		.replace(/<!--[\s\S]*?-->/g, "")
		.match(
			/^- \*\*Worktree:\*\* `[^`]+`, branch `[^`]+`, HEAD `([^`]+)`\s*$/m,
		)?.[1];
	const namedHead = readGit(worktree, ["rev-parse", `${named}^{commit}`]);
	const head = readGit(worktree, ["rev-parse", "HEAD"]);
	await assertReviewSourcesAtLaunch(brief, worktree, namedHead, head);
	const review = await inspectBriefReview(
		options,
		executable,
		brief,
		worktree,
		namedHead,
	);
	if (review.refusal === "new-review") throw new Error(review.reason);
	if (review.refusal === "failed-review") throw new Error(review.reason);
	if (review.refusal === "unreadable-review") throw new Error(review.reason);
	if (review.refusal === "unanswered-readings") throw new Error(review.reason);
	if (review.refusal === "brief-hash") throw new Error(review.reason);
	const note =
		head === namedHead
			? Buffer.alloc(0)
			: Buffer.from(
					`Launch note: HEAD ${head} only adds this brief over the named HEAD.\n\n`,
				);
	const input = Buffer.concat([note, brief]);
	const metadata = {
		version: 1,
		worktree,
		head,
		level: options.level,
		model: options.model,
	};
	if (result.requiredChanges.length) {
		metadata.requiredChanges = [];
		for (const reference of result.requiredChanges) {
			const before = await contentSnapshot(reference.absolute);
			if (before.kind === "missing")
				throw new Error(
					`must change path disappeared before launch: ${reference.path}`,
				);
			metadata.requiredChanges.push({ ...reference, before });
		}
	}
	const catalog =
		options.model === DEEPSEEK_MODEL
			? await readDeepSeekCatalog(options.run)
			: undefined;
	if (catalog) metadata.catalogSha256 = catalog.sha256;
	await mkdir(options.run, { recursive: true });
	await assertFresh(options.run);
	await writeCatalog(catalog);
	// Exclusive creation also arbitrates simultaneous launches into an empty folder.
	await writeFile(
		path.join(options.run, "run.json"),
		`${JSON.stringify(metadata, null, 2)}\n`,
		{ flag: "wx" },
	);
	await writeFile(path.join(options.run, "input.md"), input, { flag: "wx" });
	for (const [name, bytes] of [
		["review-readings.md", review.readings],
		["review-dispositions.md", review.dispositions],
	]) {
		if (bytes !== undefined)
			await writeFile(path.join(options.run, name), bytes, {
				flag: "wx",
			});
	}
	console.log(formatBriefResult(result));
	return {
		metadata,
		input,
		executable,
		outcomeIds: outcomeIdsFromBrief(input),
	};
}

// Compare bytes and file names, never Git status, timestamps, or the final report.
async function contentSnapshot(absolute, ancestors = new Set()) {
	let details;
	try {
		details = await stat(absolute);
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR")
			return { kind: "missing" };
		throw error;
	}
	if (details.isFile())
		return {
			kind: "file",
			sha256: createHash("sha256")
				.update(await readFile(absolute))
				.digest("hex"),
		};
	if (!details.isDirectory())
		throw new Error(`cannot record content of non-file path: ${absolute}`);
	const identity = await realpath(absolute);
	if (ancestors.has(identity))
		throw new Error(`cannot record recursive folder link: ${absolute}`);
	const nextAncestors = new Set([...ancestors, identity]);
	const files = [];
	for (const name of (await readdir(absolute)).sort()) {
		const content = await contentSnapshot(
			path.join(absolute, name),
			nextAncestors,
		);
		if (content.kind === "file") files.push([name, content.sha256]);
		else if (content.kind === "directory")
			for (const [file, hash] of Object.entries(content.files))
				files.push([`${name}/${file}`, hash]);
		else
			throw new Error(
				`path disappeared while recording content: ${path.join(absolute, name)}`,
			);
	}
	return { kind: "directory", files: Object.fromEntries(files) };
}

async function recordRequiredChanges(metadata, events) {
	if (!metadata.requiredChanges?.length) return;
	const comparisons = [];
	for (const { before, ...reference } of metadata.requiredChanges) {
		const after = await contentSnapshot(reference.absolute);
		const changed = JSON.stringify(before) !== JSON.stringify(after);
		comparisons.push({ ...reference, before, after, changed });
		if (!changed)
			console.log(
				`Required change unchanged: ${reference.path} (brief line ${reference.line}: ${reference.outcome})`,
			);
	}
	const target = path.join(
		path.dirname(events),
		path
			.basename(events)
			.replace(/^events/, "required-changes")
			.replace(/\.jsonl$/, ".json"),
	);
	await writeFile(target, `${JSON.stringify(comparisons, null, 2)}\n`, {
		flag: "wx",
	});
}

async function firstThread(run) {
	const file = await open(path.join(run, "events.jsonl"), "r");
	try {
		const buffer = Buffer.alloc(65536);
		const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
		const end = buffer.subarray(0, bytesRead).indexOf(10);
		if (end < 0) throw new Error("event stream has no complete first line");
		const event = JSON.parse(buffer.subarray(0, end).toString("utf8"));
		if (
			event.type !== "thread.started" ||
			!/^[\w-]+$/.test(event.thread_id ?? "")
		)
			throw new Error("first event has no thread id");
		return event.thread_id;
	} finally {
		await file.close();
	}
}

async function prepareResume(options) {
	await assertOutsideGit(options.run);
	const metadata = JSON.parse(
		await readFile(path.join(options.run, "run.json"), "utf8"),
	);
	let level;
	try {
		level = validateModelLevel(metadata.model, metadata.level);
	} catch {
		throw new Error("invalid run metadata");
	}
	if (
		metadata.version !== 1 ||
		level !== metadata.level ||
		typeof metadata.worktree !== "string" ||
		!path.isAbsolute(metadata.worktree) ||
		!(await samePath(
			readGit(metadata.worktree, ["rev-parse", "--show-toplevel"]),
			metadata.worktree,
		))
	)
		throw new Error("invalid run metadata");
	let input;
	if (options.messageFile !== undefined) {
		try {
			input = await readFile(options.messageFile);
		} catch (error) {
			if (error.code === "ENOENT" || error.code === "ENOTDIR")
				throw new Error(`message file not found: ${options.messageFile}`);
			throw error;
		}
		input = decodeMessageFile(input, options.messageFile);
	} else {
		input =
			options.message === undefined
				? await readFile(path.join(options.run, "input.md"))
				: Buffer.from(options.message, "utf8");
	}
	const launchInput =
		options.message === undefined && options.messageFile === undefined
			? input
			: ((await optionalFile(path.join(options.run, "input.md"))) ??
				Buffer.alloc(0));
	const catalog =
		metadata.model === DEEPSEEK_MODEL
			? await readDeepSeekCatalog(options.run)
			: undefined;
	if (catalog) {
		await writeCatalog(catalog, "w");
		metadata.catalogSha256 = catalog.sha256;
		await writeFile(
			path.join(options.run, "run.json"),
			`${JSON.stringify(metadata, null, 2)}\n`,
		);
	}
	return {
		metadata,
		input,
		thread: await firstThread(options.run),
		executable: await findCodex(),
		catalog,
		outcomeIds: outcomeIdsFromBrief(launchInput),
	};
}

function startCodex(executable, args, worktree) {
	const options = {
		cwd: worktree,
		stdio: ["pipe", "pipe", "inherit"],
		windowsHide: true,
	};
	if (process.platform !== "win32" || !/\.(cmd|bat)$/i.test(executable))
		return spawn(executable, args, options);
	// Expand environment references once, with delayed expansion disabled. The
	// values are quoted data; embedded percent references are not expanded again.
	const env = { ...process.env, FITWAY_CODEX_COMMAND: executable };
	const references = args.map((argument, index) => {
		// cmd.exe strips unescaped quotes while expanding a quoted %VAR%.
		// Keep embedded quotes in the child argv without re-interpreting %.
		env[`FITWAY_CODEX_ARG_${index}`] = argument.replaceAll('"', '\\"');
		return `"%FITWAY_CODEX_ARG_${index}%"`;
	});
	return spawn(
		process.env.ComSpec ?? "cmd.exe",
		[
			"/d",
			"/v:off",
			"/s",
			"/c",
			`""%FITWAY_CODEX_COMMAND%" ${references.join(" ")}"`,
		],
		{ ...options, env, windowsVerbatimArguments: true },
	);
}

async function capture(run, resume) {
	for (let index = 1; ; index += 1) {
		const suffix = !resume ? "" : `-resume${index === 1 ? "" : `-${index}`}`;
		const events = path.join(run, `events${suffix}.jsonl`);
		try {
			const file = await open(events, "wx");
			return { file, events, last: path.join(run, "last-message.md") };
		} catch (error) {
			if (!resume || error.code !== "EEXIST") throw error;
		}
	}
}

// The exec stream reports only the turn's total; Codex's session file has each
// request, and the first one is what the run carried before reading anything.
async function recordStartLoad(run, thread) {
	const target = path.join(run, "start-load.json");
	try {
		await stat(target);
		return;
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const sessions = path.join(
		process.env.CODEX_HOME || path.join(homedir(), ".codex"),
		"sessions",
	);
	let names = [];
	try {
		names = await readdir(sessions, { recursive: true });
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
	}
	const name = names.find((entry) => {
		const base = path.basename(entry);
		return base.startsWith("rollout-") && base.endsWith(`-${thread}.jsonl`);
	});
	if (!name) {
		console.log(`Start load: no session file for thread ${thread}`);
		return;
	}
	const session = path.join(sessions, name);
	const input = createReadStream(session);
	try {
		for await (const line of createInterface({ input })) {
			let usage;
			try {
				const event = JSON.parse(line);
				if (event.type === "event_msg" && event.payload?.type === "token_count")
					usage = event.payload.info?.last_token_usage;
			} catch {
				continue;
			}
			if (!Number.isInteger(usage?.input_tokens)) continue;
			const record = {
				thread,
				session,
				input_tokens: usage.input_tokens,
				cached_input_tokens: usage.cached_input_tokens ?? null,
			};
			await writeFile(target, `${JSON.stringify(record, null, 2)}\n`, {
				flag: "wx",
			});
			console.log(
				`Start load: ${usage.input_tokens} input tokens in the first request`,
			);
			return;
		}
	} finally {
		input.destroy();
	}
	console.log(`Start load: no token count in ${session}`);
}

async function runCodex(options, prepared, input, resume) {
	const output = await capture(options.run, resume);
	const { metadata, executable, thread } = prepared;
	const catalogPath =
		metadata.model === DEEPSEEK_MODEL
			? path.join(options.run, "model-catalog.json")
			: undefined;
	const args = [
		"exec",
		"--approve-for-me",
		"-C",
		metadata.worktree,
		...modelArgs(metadata.model, metadata.level, catalogPath),
		"--json",
		"-o",
		output.last,
		...(resume ? ["resume", thread] : []),
		"-",
	];
	console.log(`Run folder: ${options.run}`);
	const stream = output.file.createWriteStream();
	const child = startCodex(executable, args, metadata.worktree);
	let started = thread;
	let reported = false;
	const lines = createInterface({ input: child.stdout });
	lines.on("line", (line) => {
		try {
			const event = JSON.parse(line);
			if (
				!reported &&
				event.type === "thread.started" &&
				typeof event.thread_id === "string"
			) {
				console.log(`Thread id: ${event.thread_id}`);
				started ??= event.thread_id;
				reported = true;
			}
		} catch {
			// Preserve even incomplete or non-JSON output in the event stream.
		}
	});
	child.stdout.pipe(stream);
	child.stdin.on("error", (error) => {
		if (error.code !== "EPIPE") console.error(`codex-round: ${error.message}`);
	});
	const completion = new Promise((resolve, reject) => {
		child.once("error", reject);
		child.once("close", (code, signal) =>
			resolve(code ?? (signal === "SIGINT" ? 130 : 1)),
		);
	});
	child.stdin.end(input);
	let code;
	try {
		[code] = await Promise.all([completion, finished(stream)]);
	} finally {
		if (child.exitCode === null) child.kill();
		lines.close();
		stream.destroy();
		await output.file.close();
	}
	await recordRequiredChanges(metadata, output.events);
	// A missing measurement never changes the run's exit code.
	if (started && /^[\w-]+$/.test(started))
		await recordStartLoad(options.run, started).catch((error) =>
			console.error(`codex-round: start load not recorded: ${error.message}`),
		);
	return { code, thread: started };
}

async function execute(options, prepared) {
	let input = prepared.input;
	let resume = options.resume;
	let autoResumes = 0;
	for (;;) {
		const result = await runCodex(options, prepared, input, resume);
		if (result.code === 0 && result.thread && /^[\w-]+$/.test(result.thread))
			prepared.thread = result.thread;
		if (result.code !== 0) return result.code;
		const last = await optionalFile(path.join(options.run, "last-message.md"));
		const message = last?.toString("utf8") ?? "";
		if (isReport(message, prepared.outcomeIds)) return 0;
		if (autoResumes >= MAX_AUTO_RESUMES) {
			console.error(
				`codex-round: run ended without a report after ${MAX_AUTO_RESUMES} automatic resumes`,
			);
			return 1;
		}
		const line = firstLine(message);
		await appendFile(
			path.join(options.run, "auto-resumes.log"),
			`${JSON.stringify({
				time: new Date().toISOString(),
				exitCode: result.code,
				firstLine: line,
			})}\n`,
		);
		autoResumes += 1;
		resume = true;
		input = Buffer.from(autoResumeMessage(line), "utf8");
	}
}

export async function main(args = process.argv.slice(2)) {
	let options;
	try {
		options = parseArgs(args);
		if (options.help) {
			console.log(HELP);
			return 0;
		}
		const prepared = options.resume
			? await prepareResume(options)
			: await prepareLaunch(options);
		return await execute(options, prepared);
	} catch (error) {
		if (options?.brief) {
			const brief = await optionalFile(options.brief).catch(() => undefined);
			if (brief) console.log(`Current brief SHA-256: ${sha256(brief)}`);
		}
		console.error(`codex-round: ${error.message.replace(/[\r\n]+/g, " ")}`);
		return 1;
	}
}

if (
	process.argv[1] &&
	(await samePath(fileURLToPath(import.meta.url), process.argv[1]))
)
	process.exitCode = await main();
