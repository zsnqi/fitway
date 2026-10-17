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
import { commitHeaderSha } from "./commit-header.mjs";
import { commandStatusIsEvent, isGitCommitWords } from "./git-commit-words.mjs";
import { readGit } from "./git-context.mjs";
import { pathKey, samePath } from "./path-identity.mjs";
import {
	beginToolCommand,
	resolveToolArguments,
	toolFailure,
} from "./tool-contract.mjs";

const repositoryRoot = fileURLToPath(new URL("../../", import.meta.url));
const GPT_MODEL = "gpt-6.1-sol";
const DEEPSEEK_MODEL = "deepseek-v4.1-flash";
const GPT_LEVELS = new Set(["medium", "high", "xhigh", "max"]);
const DEEPSEEK_LEVELS = new Set(["high", "max"]);
const DEFAULT_MODEL = DEEPSEEK_MODEL;
const DEFAULT_DEEPSEEK_LEVEL = "max";
const MAX_AUTO_RESUMES = 10;
const GARDENER_TEMP_ROOT =
	process.platform === "win32" ? "D:/fitway-temp" : undefined;
const MODEL_LEVELS = new Map([
	[DEEPSEEK_MODEL, DEEPSEEK_LEVELS],
	[GPT_MODEL, GPT_LEVELS],
]);

function resolvePath(value) {
	return path.resolve(repositoryRoot, value.replaceAll("\\", "/"));
}

function runningInGitBash() {
	if (process.platform !== "win32") return false;
	return /^(?:MINGW|MSYS|UCRT|CLANG)/i.test(process.env.MSYSTEM ?? "");
}

function pathIsWithin(root, candidate) {
	const relative = path.relative(root, candidate);
	return (
		relative === "" ||
		(!relative.startsWith("..") && !path.isAbsolute(relative))
	);
}

function hasShortWindowsSegment(value) {
	return /(?:^|[\\/])[^\\/]*~\d+(?=[\\/]|$)/.test(value);
}

async function resolvedEnvironmentPath(value) {
	try {
		return await realpath(value);
	} catch (error) {
		if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
	}
	const absolute = path.resolve(value);
	const existing = await existingAncestor(absolute);
	const resolved = await realpath(existing);
	const missing = path.relative(existing, absolute);
	return path.join(resolved, missing);
}

async function codexEnvironment(environment = process.env) {
	const result = { ...environment };
	if (process.platform !== "win32") return result;
	const root = await pathKey(await resolvedEnvironmentPath(GARDENER_TEMP_ROOT));
	for (const key of Object.keys(result)) {
		if (!/^(?:TEMP|TMP)$/i.test(key)) continue;
		const value = result[key];
		if (typeof value !== "string" || value === "") continue;
		const resolved = await resolvedEnvironmentPath(value);
		if (pathIsWithin(root, await pathKey(resolved)))
			throw new Error(
				`${key} points inside ${GARDENER_TEMP_ROOT}: ${value}; set ${key} outside ${GARDENER_TEMP_ROOT}`,
			);
		if (hasShortWindowsSegment(value)) result[key] = resolved;
	}
	return result;
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

function shellSeparator(text, index) {
	const character = text[index];
	if (character === ";" || character === "\n") return character;
	if ((character === "&" || character === "|") && text[index + 1] === character)
		return character + character;
	return character === "&" || character === "|" ? character : null;
}

function shellEvent(raw, value, whitespace = false) {
	return whitespace ? { raw, whitespace: true } : { raw, value };
}

function shellScan(command, shell = "bash") {
	const events = [];
	const escapeCharacter = shell === "powershell" ? "`" : "\\";
	let quote = null;
	let wordStarted = false;
	for (let index = 0; index < command.length; index += 1) {
		const character = command[index];
		if (quote === "'") {
			if (character === "'") quote = null;
			events.push(shellEvent(character, character === "'" ? "" : character));
			continue;
		}
		if (character === escapeCharacter && index + 1 < command.length) {
			const next = command[++index];
			events.push(shellEvent(character + next, next));
			wordStarted = true;
			continue;
		}
		if (quote === '"') {
			if (character === '"') {
				quote = null;
				events.push(shellEvent(character, ""));
			} else events.push(shellEvent(character, character));
			continue;
		}
		if (character === "'" || character === '"') {
			quote = character;
			wordStarted = true;
			events.push(shellEvent(character, ""));
			continue;
		}
		if (character === "#" && !wordStarted) {
			while (index + 1 < command.length && !/[\r\n]/.test(command[index + 1]))
				index += 1;
			continue;
		}
		if (character === "\r") {
			events.push(shellEvent("", "", true));
			continue;
		}
		const separator = shellSeparator(command, index);
		if (separator !== null) {
			events.push({ raw: separator, separator });
			wordStarted = false;
			if (separator.length === 2) index += 1;
			continue;
		}
		const whitespace = /\s/.test(character);
		events.push(shellEvent(character, character, whitespace));
		wordStarted = !whitespace;
	}
	return { events, unmatchedQuote: quote !== null };
}

function shellTokens(command, shell = "bash") {
	const { events, unmatchedQuote } = shellScan(command.trim(), shell);
	if (unmatchedQuote) return null;
	const tokens = [];
	let token = "";
	for (const event of events) {
		if (event.whitespace || event.separator === "\n") {
			if (token) {
				tokens.push(token);
				token = "";
			}
			continue;
		}
		if (event.separator !== undefined) {
			token += event.raw;
			continue;
		}
		token += event.value;
	}
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

// The catalog's source entry is pinned on this machine, outside the repository, because
// Codex's own model cache follows OpenAI's server list (gpt-5.5 left it on 2026-10-14, F172)
// and the entry holds Codex's instructions text.
const DEEPSEEK_CATALOG_SOURCE =
	"D:/fitway-private/codex/deepseek-catalog-source.json";

async function readDeepSeekCatalog(run) {
	requireDeepSeekKey();
	const sourcePath =
		process.env.FITWAY_DEEPSEEK_CATALOG_SOURCE || DEEPSEEK_CATALOG_SOURCE;
	let pinned;
	try {
		pinned = JSON.parse(await readFile(sourcePath, "utf8"));
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR")
			throw new Error(`DeepSeek catalog source not found: ${sourcePath}`);
		throw error;
	}
	const source = pinned.models?.length === 1 ? pinned.models[0] : null;
	if (!source)
		throw new Error(
			`DeepSeek catalog source must hold exactly one model entry: ${sourcePath}`,
		);
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

export function codexOptions(parsed) {
	const positionals = parsed.positionals;
	if (positionals[0] === "resume") {
		if (
			positionals.length !== 2 ||
			parsed.options.model !== undefined ||
			parsed.options.run !== undefined ||
			parsed.options.newReview === true
		)
			throw new Error(
				"expected resume <folder> [--message <text> | --message-file <file>]",
			);
		if (
			parsed.options.message !== undefined &&
			parsed.options.messageFile !== undefined
		)
			throw new Error(
				"expected resume <folder> [--message <text> | --message-file <file>]",
			);
		if (parsed.options.message !== undefined && runningInGitBash())
			throw new Error(
				"--message cannot be used from Git Bash because its text may already be rewritten; use --message-file <file>",
			);
		return {
			resume: true,
			run: resolvePath(positionals[1]),
			message: parsed.options.message,
			messageFile:
				parsed.options.messageFile === undefined
					? undefined
					: resolvePath(parsed.options.messageFile),
		};
	}
	if (parsed.options.message !== undefined)
		throw new Error("unexpected launch option: --message");
	if (parsed.options.messageFile !== undefined)
		throw new Error("unexpected launch option: --message-file");
	if (positionals.length < 1 || positionals.length > 2)
		throw new Error(
			"expected <brief> [<level>] [--model <model>] [--run <folder>] [--new-review]",
		);
	const model = parsed.options.model ?? DEFAULT_MODEL;
	const level =
		positionals[1] ??
		(model === DEEPSEEK_MODEL ? DEFAULT_DEEPSEEK_LEVEL : undefined);
	return {
		brief: resolvePath(positionals[0]),
		level,
		model,
		newReview: parsed.options.newReview === true,
		run:
			(parsed.options.run === undefined
				? undefined
				: resolvePath(parsed.options.run)) ??
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
	const words = command ? shellTokens(command) : undefined;
	if (words === null) throw new Error("review command has an unmatched quote");
	const tokens = words?.map((token) =>
		token
			.replaceAll("<folder>", folder)
			.replaceAll("<catalog>", catalogPath.replaceAll("\\", "/")),
	);
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
	const outcome = line.match(
		/^ {0,3}\*\*([A-Z]+\d+)(?:[ \t]*[.):\u2013\u2014-][ \t]*[^\n]*?)?\*\*[ \t]*$/i,
	);
	if (outcome)
		return {
			type: "bold-id",
			index,
			outcomeId: outcome[1].toUpperCase(),
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

const oneLineLabelGroups = [
	[
		"literal",
		new Set([
			"literal",
			"literally",
			"literal reading",
			"as written",
			"reading",
			"wording",
		]),
	],
	[
		"wrong",
		new Set([
			"what would go wrong",
			"what goes wrong",
			"goes wrong",
			"go wrong",
			"failure mode",
			"failure",
			"consequence",
			"delivered work",
			"delivered failure",
			"unmet",
			"break",
			"breaks",
			"risk",
			"gap",
		]),
	],
	[
		"change",
		new Set([
			"one-line change",
			"one line change",
			"closing change",
			"change to the brief",
			"change",
			"close",
			"close it",
			"fix",
			"fixed",
			"repair",
			"remedy",
			"remedies",
			"require",
			"required",
			"requires",
			"preserve",
			"avoid",
		]),
	],
];

function oneLineLabelGroup(value) {
	const label = value.trim().toLowerCase();
	for (const [group, labels] of oneLineLabelGroups) {
		if (labels.has(label)) return group;
	}
	return null;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const oneLineLabelNames = [
	...new Set(oneLineLabelGroups.flatMap(([, labels]) => [...labels])),
].sort((left, right) => right.length - left.length);

function maskedLabelText(value) {
	const chars = value.split("");
	const mask = (start, end) => {
		for (let index = start; index < end; index += 1) chars[index] = "\u0000";
	};

	for (let start = 0; start < chars.length; ) {
		if (chars[start] !== "`") {
			start += 1;
			continue;
		}
		let delimiterLength = 1;
		while (chars[start + delimiterLength] === "`") delimiterLength += 1;
		let cursor = start + delimiterLength;
		let end = -1;
		while (cursor < chars.length) {
			if (chars[cursor] !== "`") {
				cursor += 1;
				continue;
			}
			let closingLength = 1;
			while (chars[cursor + closingLength] === "`") closingLength += 1;
			if (closingLength === delimiterLength) {
				end = cursor + closingLength;
				break;
			}
			cursor += closingLength;
		}
		if (end < 0) {
			start += delimiterLength;
			continue;
		}
		mask(start, end);
		start = end;
	}

	for (const [open, close] of [
		['"', '"'],
		["\u201c", "\u201d"],
	]) {
		for (let index = 0; index < chars.length; index += 1) {
			if (chars[index] !== open) continue;
			let end = -1;
			for (let cursor = index + 1; cursor < chars.length; cursor += 1) {
				if (chars[cursor] !== close) continue;
				end = cursor;
				break;
			}
			if (end < 0) {
				mask(index, chars.length);
				break;
			}
			mask(index, end + 1);
			index = end;
		}
	}

	return chars.join("");
}

function labelStartsClause(value, index) {
	const lineStart = value.lastIndexOf("\n", index - 1) + 1;
	const linePrefix = value.slice(lineStart, index);
	if (/^[ \t]*(?:[-+*][ \t]+|\d+[.)][ \t]+)?$/.test(linePrefix)) return true;
	if (/[ \t]*(?:[-+*]|\d+[.)])[ \t]+$/.test(linePrefix)) return true;
	return /[.!?;]$/.test(linePrefix.replace(/[ \t]+$/, ""));
}

function labelledParts(value) {
	const searchable = maskedLabelText(value).replace(/[*_`]/g, " ");
	const content = value.replace(/[*_`]/g, " ");
	const pattern = new RegExp(
		`(?<![\\p{L}\\p{N}])(${oneLineLabelNames
			.map(escapeRegExp)
			.join("|")})[ \\t]*[:\\-\\u2013\\u2014]`,
		"giu",
	);
	const matches = [...searchable.matchAll(pattern)].filter((match) =>
		labelStartsClause(searchable, match.index),
	);
	return matches.map((match, index) => ({
		group: oneLineLabelGroup(match[1]),
		text: content
			.slice(
				match.index + match[0].length,
				matches[index + 1]?.index ?? content.length,
			)
			.trim(),
	}));
}

function partHasText(value) {
	return /\p{L}/u.test(
		value
			.replace(/\b[A-Z]+\d+\b/gi, " ")
			.replace(/(?:^|\s)[-+*]\s+/g, " ")
			.replace(/(?:^|\s)\d+[.)]\s+/g, " "),
	);
}

function hasEmptyLabelledPart(value, lineBreaksContinue = false) {
	return labelledParts(
		lineBreaksContinue ? value.replace(/\r?\n/g, " ") : value,
	).some((part) => !partHasText(part.text));
}

function completeLabelledReading(value) {
	const groups = new Set();
	for (const part of labelledParts(value)) {
		if (!partHasText(part.text)) return false;
		groups.add(part.group);
	}
	return groups.size === oneLineLabelGroups.length;
}

function completeOneLineReading(value) {
	const content = value.replace(/\r?\n/g, " ");
	if (!/\b[A-Z]+\d+\b/.test(content)) return false;
	const groups = new Set();
	for (const part of labelledParts(content)) {
		if (!partHasText(part.text)) return false;
		groups.add(part.group);
	}
	return groups.size === oneLineLabelGroups.length;
}

function bareStart({ index, line }) {
	const match = line.match(/^ {0,3}(\d+)[.)][ \t]+(.+)$/);
	if (!match || !/\b[A-Z]+\d+\b/.test(match[2])) return null;
	return {
		type: "bare",
		index,
		number: Number(match[1]),
		bodyLines: 0,
	};
}

function proseBeforeStarts(text, starts) {
	const prefix = text.slice(0, starts[0].index);
	if (!prefix.trim()) return true;
	if (/\b[A-Z]+\d+\b/.test(prefix)) return false;
	for (const record of markdownLineRecords(prefix)) {
		const heading = headingStart(record);
		if (
			(heading && Number.isInteger(heading.number)) ||
			boldStart(record) ||
			numberedBoldStart(record) ||
			bareStart(record)
		)
			return false;
	}
	return true;
}

function hasIndentedBody(value) {
	return value
		.split(/\r?\n/)
		.slice(1)
		.some((line) => line.trim() && /^[ \t]/.test(line));
}

function bareReadingEnd(text, start, end) {
	const match = text.slice(start.index, end).match(/\r?\n[ \t]*\r?\n/);
	return match?.index === undefined ? end : start.index + match.index;
}

function readingsFromStarts(text, starts) {
	if (!starts.length || starts.length > 5) return null;
	const outcomeHeadings = starts.some((start) => start.outcomeId);
	if (
		outcomeHeadings &&
		starts.some((start) => start.type !== "bold-id" || !start.outcomeId)
	)
		return null;
	if (
		!outcomeHeadings &&
		starts.some((start, index) => start.number !== index + 1)
	)
		return null;
	if (!proseBeforeStarts(text, starts)) return null;
	const readings = starts.map((start, index) => {
		const next = starts[index + 1]?.index ?? text.length;
		const end =
			start.type === "bare" ? bareReadingEnd(text, start, next) : next;
		return {
			id: index + 1,
			text: text.slice(start.index, end).trim(),
			bodyLines:
				starts.length === 1 && start.type === "heading"
					? Math.max(start.bodyLines, 3)
					: start.bodyLines,
			start,
		};
	});
	if (
		readings.some(({ start, text, bodyLines }) => {
			if (!/\b[A-Z]+\d+\b/.test(text)) return true;
			if (hasEmptyLabelledPart(text, start.type === "bare")) return true;
			if (start.type === "bold-id")
				return (
					!completeLabelledReading(text) ||
					text
						.split(/\r?\n/)
						.slice(1)
						.filter((line) => line.trim()).length < bodyLines
				);
			if (start.type === "bare") {
				const lines = text.split(/\r?\n/);
				const indented = hasIndentedBody(text);
				if (completeOneLineReading(lines[0])) return false;
				if (indented)
					return lines.slice(1).filter((line) => line.trim()).length < 1;
				return !completeOneLineReading(text);
			}
			return (
				text
					.split(/\r?\n/)
					.slice(1)
					.filter((line) => line.trim()).length < bodyLines
			);
		})
	)
		return null;
	return readings.map(({ id, text }) => ({ id, text }));
}

export function parseReadings(answer) {
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
	const bare = [];
	for (const record of markdownLineRecords(text)) {
		const heading = headingStart(record);
		if (heading) headings.push(heading);
		const boldStartRecord = boldStart(record);
		if (boldStartRecord) bold.push(boldStartRecord);
		const numberedBoldRecord = numberedBoldStart(record);
		if (numberedBoldRecord) numberedBold.push(numberedBoldRecord);
		const bareRecord = bareStart(record);
		if (bareRecord) bare.push(bareRecord);
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
	if (bold.length) return readingsFromStarts(text, bold);
	if (numberedBold.length) return readingsFromStarts(text, numberedBold);
	if (bare.length) return readingsFromStarts(text, bare);
	return null;
}

export function outcomeIdsFromBrief(input) {
	const ids = new Set();
	const text = Buffer.isBuffer(input) ? input.toString("utf8") : String(input);
	let environment = false;
	let fence;
	for (const line of text.split(/\r?\n/)) {
		const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
		if (delimiter) {
			if (!fence) fence = delimiter[1];
			else if (
				delimiter[1][0] === fence[0] &&
				delimiter[1].length >= fence.length &&
				/^ {0,3}(?:`+|~+)\s*$/.test(line)
			)
				fence = undefined;
			continue;
		}
		if (fence) continue;
		if (/^\s*<!--\s*environment:start\b/.test(line)) {
			environment = true;
			continue;
		}
		if (/^\s*<!--\s*environment:end\b/.test(line)) {
			environment = false;
			continue;
		}
		if (environment) continue;
		const outcome = line.match(/^- \*\*([A-Z]+\d+)\.(?:\*\*|[^\n]*\*\*)/);
		if (outcome) ids.add(outcome[1]);
	}
	return ids;
}

function reportStatuses(message) {
	const statuses = new Map();
	for (const line of message.split(/\r?\n/)) {
		const status = line.match(/\b(PASS|FAIL)\b/)?.[1];
		if (!status) continue;
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
				statuses.set(`${match[1]}${number}`, status);
		}
		for (const match of line.matchAll(/\b[A-Z]+\d+\b/g))
			statuses.set(match[0], status);
	}
	return statuses;
}

function reportIds(message) {
	return new Set(reportStatuses(message).keys());
}

function passedIds(message) {
	return new Set(
		[...reportStatuses(message)]
			.filter(([, status]) => status === "PASS")
			.map(([id]) => id),
	);
}

function isReport(message, outcomeIds) {
	if (/^STOPPED:/m.test(message)) return true;
	if (!outcomeIds.size) return false;
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

function claimResumeMessage(failures) {
	return `The report was not accepted because its claims did not match this run:\n${failures.map((failure) => `- ${failure}`).join("\n")}\nContinue toward the brief's outcomes, wait inside tool calls, and send a corrected report, or a line \`STOPPED: <reason>\` when you stop on purpose.\n`;
}

function briefScopeSection(brief) {
	const text = Buffer.isBuffer(brief) ? brief.toString("utf8") : String(brief);
	const heading = text.match(/^##[ \t]+Scope[ \t]*\r?$/m);
	if (heading?.index === undefined) return "";
	const remainder = text.slice(heading.index + heading[0].length);
	const nextHeading = remainder.search(/^##[ \t]+/m);
	return nextHeading < 0 ? remainder : remainder.slice(0, nextHeading);
}

function briefRequiresCommit(brief) {
	return /\bcommit[ \t]+once[ \t]+when[ \t]+done\b/i.test(
		briefScopeSection(brief).replace(/\s+/g, " "),
	);
}

function outcomeTextFromBrief(brief, id) {
	const text = Buffer.isBuffer(brief) ? brief.toString("utf8") : String(brief);
	const chunks = [];
	let collecting = false;
	for (const line of text.split(/\r?\n/)) {
		const start = line.match(/^- \*\*([A-Z]+\d+)\./);
		if (start) {
			if (collecting) break;
			collecting = start[1] === id;
			if (collecting) chunks.push(line);
			continue;
		}
		if (collecting && /^##[ \t]+/.test(line)) break;
		if (collecting) chunks.push(line);
	}
	return chunks.join("\n");
}

function commitCandidates(message) {
	return [
		...new Set(
			[...message.matchAll(/\b[0-9a-f]{7,64}\b/gi)].map((match) =>
				match[0].toLowerCase(),
			),
		),
	];
}

function unwrapCommand(command) {
	const text = command.trim();
	const wrappers = [
		{
			shell: "powershell",
			pattern:
				/^(?:"[^"]*powershell(?:\.exe)?"|powershell(?:\.exe)?)(?:\s+-[^\s]+)*\s+-Command\s+(['"])([\s\S]*)\1$/i,
		},
		{
			shell: "bash",
			pattern:
				/^(?:"[^"]*bash(?:\.exe)?"|bash(?:\.exe)?)(?:\s+-[^\s]+)*\s+-lc\s+(['"])([\s\S]*)\1$/i,
		},
	];
	for (const wrapper of wrappers) {
		const match = text.match(wrapper.pattern);
		if (match) return { text: match[2].trim(), shell: wrapper.shell };
	}
	return { text, shell: "bash" };
}

function commandParts(command) {
	const { text, shell } = unwrapCommand(command);
	const { events } = shellScan(text, shell);
	const parts = [];
	let current = "";
	let separator = null;
	for (const event of events) {
		if (event.separator === undefined) {
			current += event.raw;
			continue;
		}
		if (current.trim()) parts.push({ text: current.trim(), separator, shell });
		current = "";
		separator = event.separator;
	}
	if (current.trim()) parts.push({ text: current.trim(), separator, shell });
	return parts;
}

function lastCommandPart(command) {
	return commandParts(command).at(-1) ?? null;
}

function isGitCommitCommand(command, shell = "bash") {
	const words = shellTokens(command, shell) ?? [];
	return isGitCommitWords(words);
}

function isCommitCommand(command) {
	const part = lastCommandPart(command);
	return Boolean(
		part &&
			commandStatusIsEvent(part) &&
			isGitCommitCommand(part.text, part.shell),
	);
}

function isFastLadderCommand(command) {
	const part = lastCommandPart(command);
	if (!part || !commandStatusIsEvent(part)) return false;
	const words = shellTokens(part.text, part.shell) ?? [];
	return Boolean(
		(words.length === 3 &&
			/^node(?:\.exe)?$/i.test(words[0] ?? "") &&
			words[1] === "scripts/verify.mjs" &&
			words[2] === "fast") ||
			(words.length === 2 &&
				/^pnpm(?:\.cmd)?$/i.test(words[0] ?? "") &&
				words[1] === "verify:fast"),
	);
}

function eventFileOrder(name) {
	if (name === "events.jsonl") return 0;
	const match = name.match(/^events-resume(?:-(\d+))?\.jsonl$/);
	if (!match) return null;
	return match[1] ? Number(match[1]) : 1;
}

async function readRunCommandRecords(run) {
	const files = (await readdir(run))
		.map((name) => ({ name, order: eventFileOrder(name) }))
		.filter(({ order }) => order !== null)
		.sort((left, right) => left.order - right.order);
	const records = [];
	for (const { name } of files) {
		const lines = (await readFile(path.join(run, name), "utf8")).split(/\r?\n/);
		for (const line of lines) {
			if (!line.trim()) continue;
			let event;
			try {
				event = JSON.parse(line);
			} catch {
				continue;
			}
			if (!event || typeof event !== "object") continue;
			const item = event.item ?? event.payload?.item ?? event.payload ?? event;
			let command = item?.command ?? item?.cmd ?? event.command;
			if (Array.isArray(command)) command = command.join(" ");
			const exitCode =
				item?.exit_code ?? item?.exitCode ?? event.exit_code ?? event.exitCode;
			const output =
				item?.aggregated_output ??
				item?.output ??
				event.aggregated_output ??
				event.output ??
				"";
			const status = item?.status ?? event.status;
			if (typeof command !== "string" || !Number.isInteger(exitCode)) continue;
			if (status !== undefined && status !== "completed") continue;
			records.push({
				command,
				exitCode,
				output: typeof output === "string" ? output : "",
			});
		}
	}
	return records;
}

function timestampWithOffset(date) {
	const offsetMinutes = -date.getTimezoneOffset();
	const sign = offsetMinutes < 0 ? "-" : "+";
	const absolute = Math.abs(offsetMinutes);
	const local = new Date(date.getTime() + offsetMinutes * 60_000);
	const timestamp = local.toISOString().slice(0, -1);
	const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
	const minutes = String(absolute % 60).padStart(2, "0");
	return `${timestamp}${sign}${hours}:${minutes}`;
}

async function recordTurn(run, worktree, result, stopReason) {
	const endedAt = new Date();
	let head = null;
	try {
		head = readGit(worktree, ["rev-parse", "HEAD"]);
	} catch {
		// A missing head is recorded as null so the turn remains diagnosable.
	}
	const record = {
		start: timestampWithOffset(result.startedAt),
		end: timestampWithOffset(endedAt),
		durationMs: Math.max(0, endedAt.getTime() - result.startedAt.getTime()),
		exitCode: result.code,
		stopReason,
		head,
		events: path.basename(result.events),
		stderr: path.basename(result.stderr),
	};
	try {
		await appendFile(
			path.join(run, "turns.jsonl"),
			`${JSON.stringify(record)}\n`,
		);
	} catch (error) {
		console.error(`codex-round: turn record not written: ${error.message}`);
	}
}

function resolveCommitCandidates(message, worktree, launchHead, stopped) {
	const candidates = commitCandidates(message);
	const resolved = [];
	for (const candidate of candidates) {
		try {
			resolved.push({
				candidate,
				resolved: readGit(worktree, ["rev-parse", `${candidate}^{commit}`]),
			});
		} catch {
			// A candidate that does not resolve cannot confirm the claim.
		}
	}
	const failures = [];
	if (!resolved.length) {
		if (candidates.length)
			failures.push(`commit ${candidates.join(", ")}: no such commit object`);
		else if (!stopped) failures.push("commit: report names no commit SHA");
		return { failures, resolved, head: null, matching: null };
	}
	let head = null;
	try {
		head = readGit(worktree, ["rev-parse", "HEAD"]);
	} catch (error) {
		failures.push(`commit: cannot read worktree HEAD: ${error.message}`);
	}
	const matching =
		head === null ? null : resolved.find(({ resolved }) => resolved === head);
	if (head !== null && !matching)
		failures.push(
			`commit ${resolved.map(({ candidate }) => candidate).join(", ")}: resolves to ${resolved
				.map(({ resolved }) => resolved)
				.join(", ")}, not worktree HEAD ${head}`,
		);
	const launchClaims = resolved.filter(
		({ resolved }) => resolved === launchHead,
	);
	if (launchClaims.length && (!matching || matching.resolved === launchHead))
		failures.push(
			`commit ${launchClaims.map(({ candidate }) => candidate).join(", ")}: equals launch HEAD ${launchHead}`,
		);
	return { failures, resolved, head, matching };
}

function lineageAndDiffFailures(worktree, head, matching, launchHead) {
	if (
		!matching ||
		head === null ||
		head === launchHead ||
		typeof launchHead !== "string"
	)
		return [];
	const failures = [];
	let descends = true;
	try {
		readGit(worktree, ["merge-base", "--is-ancestor", launchHead, head]);
	} catch (error) {
		descends = false;
		if (error.status === 1) {
			failures.push(
				`commit ${matching.candidate}: worktree HEAD ${head} does not descend from launch HEAD ${launchHead}`,
			);
		} else {
			failures.push(
				`commit ${matching.candidate}: cannot verify worktree HEAD descends from launch HEAD ${launchHead}: ${error.message}`,
			);
		}
	}
	if (!descends) return failures;
	let diff;
	try {
		diff = readGit(worktree, ["diff", "--name-only", launchHead, head]);
	} catch (error) {
		failures.push(
			`commit ${matching.candidate}: cannot read the diff from launch HEAD ${launchHead} to worktree HEAD ${head}: ${error.message}`,
		);
	}
	if (diff === "")
		failures.push(
			`commit ${matching.candidate}: worktree HEAD ${head} has an empty diff against launch HEAD ${launchHead}`,
		);
	return failures;
}

function commitRecordFailures(records, worktree, head) {
	const commits = records.filter(
		({ command, exitCode }) => exitCode === 0 && isCommitCommand(command),
	);
	if (!commits.length)
		return [
			"commit: no successful git commit command with exit code 0 is recorded in this run's events",
		];
	const failures = [];
	const abbreviated = head?.slice(0, 7);
	const recorded = commitHeaderSha(commits.at(-1).output);
	if (abbreviated && (!recorded || !head.toLowerCase().startsWith(recorded)))
		failures.push(
			`commit: the last successful git commit output does not name worktree HEAD ${abbreviated}`,
		);
	let status;
	try {
		status = readGit(worktree, ["status", "--short"]);
	} catch (error) {
		failures.push(`commit: cannot read worktree status: ${error.message}`);
	}
	if (status) failures.push("commit: worktree is not clean after the commit");
	return failures;
}

function ladderRecordFailures(records, verifyIds) {
	const lastCommit = records.reduce(
		(last, record, index) =>
			record.exitCode === 0 && isCommitCommand(record.command) ? index : last,
		-1,
	);
	const lastFast = records.reduce(
		(last, record, index) =>
			record.exitCode === 0 && isFastLadderCommand(record.command)
				? index
				: last,
		-1,
	);
	if (lastFast < 0)
		return [
			`verify.mjs fast: PASS is claimed for ${verifyIds.join(", ")} without a successful fast-ladder command in this run's events`,
		];
	if (lastFast < lastCommit)
		return [
			"verify.mjs fast: the last successful fast-ladder command precedes the last successful git commit in this run's events",
		];
	return [];
}

async function reportClaimFailures(message, brief, metadata, run) {
	if (!briefRequiresCommit(brief)) return [];
	let commands;
	const runCommands = async () => {
		commands ??= await readRunCommandRecords(run);
		return commands;
	};
	const claimed = resolveCommitCandidates(
		message,
		metadata.worktree,
		metadata.head,
		/^STOPPED:/m.test(message),
	);
	const failures = [...claimed.failures];
	if (claimed.resolved.length) {
		failures.push(
			...lineageAndDiffFailures(
				metadata.worktree,
				claimed.head,
				claimed.matching,
				metadata.head,
			),
		);
		failures.push(
			...commitRecordFailures(
				await runCommands(),
				metadata.worktree,
				claimed.head,
			),
		);
	}
	const verifyIds = [...passedIds(message)].filter((id) =>
		/\bverify\.mjs[ \t]+fast\b|\bverify:fast\b/i.test(
			outcomeTextFromBrief(brief, id),
		),
	);
	if (verifyIds.length)
		failures.push(...ladderRecordFailures(await runCommands(), verifyIds));
	return failures;
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

async function runReview(
	folder,
	executable,
	brief,
	worktree,
	head,
	environment,
) {
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
	const child = startCodex(executable, args, folder, environment);
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

async function inspectBriefReview(
	options,
	executable,
	brief,
	worktree,
	head,
	environment,
) {
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
			await runReview(
				snapshot.folder,
				executable,
				brief,
				worktree,
				head,
				environment,
			);
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
	const environment = await codexEnvironment();
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
	const outcomeIds = outcomeIdsFromBrief(brief);
	if (!outcomeIds.size)
		throw new Error(
			'brief has no outcome IDs; add each outcome and limit as a bullet such as "- **X1.**" outside its environment block',
		);
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
		environment,
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
		brief,
		executable,
		environment,
		outcomeIds,
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
	const environment = await codexEnvironment();
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
	const outcomeIds = outcomeIdsFromBrief(launchInput);
	if (!outcomeIds.size)
		throw new Error(
			'brief has no outcome IDs; add each outcome and limit as a bullet such as "- **X1.**" outside its environment block',
		);
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
		brief: launchInput,
		thread: await firstThread(options.run),
		executable: await findCodex(),
		catalog,
		environment,
		outcomeIds,
	};
}

function startCodex(
	executable,
	args,
	worktree,
	environment = process.env,
	stderr = "inherit",
) {
	const options = {
		cwd: worktree,
		stdio: ["pipe", "pipe", stderr],
		env: environment,
		windowsHide: true,
	};
	if (process.platform !== "win32" || !/\.(cmd|bat)$/i.test(executable))
		return spawn(executable, args, options);
	// Expand environment references once, with delayed expansion disabled. The
	// values are quoted data; embedded percent references are not expanded again.
	const env = { ...environment, FITWAY_CODEX_COMMAND: executable };
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
		const stderr = path.join(run, `stderr${suffix}.txt`);
		try {
			const file = await open(events, "wx");
			return {
				file,
				events,
				stderr,
				last: path.join(run, "last-message.md"),
			};
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
	const { environment, metadata, executable, thread } = prepared;
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
	const errorFile = await open(output.stderr, "wx");
	const errorStream = errorFile.createWriteStream();
	const child = startCodex(
		executable,
		args,
		metadata.worktree,
		environment,
		"pipe",
	);
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
	child.stderr.pipe(process.stderr, { end: false });
	child.stderr.pipe(errorStream);
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
		[code] = await Promise.all([
			completion,
			finished(stream),
			finished(errorStream),
		]);
	} finally {
		if (child.exitCode === null) child.kill();
		lines.close();
		stream.destroy();
		errorStream.destroy();
		await output.file.close();
		await errorFile.close();
	}
	await recordRequiredChanges(metadata, output.events);
	// A missing measurement never changes the run's exit code.
	if (started && /^[\w-]+$/.test(started))
		await recordStartLoad(options.run, started).catch((error) =>
			console.error(`codex-round: start load not recorded: ${error.message}`),
		);
	return {
		code,
		thread: started,
		events: output.events,
		stderr: output.stderr,
	};
}

async function execute(options, prepared) {
	let input = prepared.input;
	let resume = options.resume;
	let autoResumes = 0;
	for (;;) {
		const startedAt = new Date();
		const result = await runCodex(options, prepared, input, resume);
		if (result.code === 0 && result.thread && /^[\w-]+$/.test(result.thread))
			prepared.thread = result.thread;
		if (result.code !== 0) {
			await recordTurn(
				options.run,
				prepared.metadata.worktree,
				{ ...result, startedAt },
				"non-zero exit",
			);
			return result.code;
		}
		const last = await optionalFile(path.join(options.run, "last-message.md"));
		const message = last?.toString("utf8") ?? "";
		const report = isReport(message, prepared.outcomeIds);
		const claimFailures = report
			? await reportClaimFailures(
					message,
					prepared.brief,
					prepared.metadata,
					options.run,
				)
			: [];
		if (report && !claimFailures.length) {
			await recordTurn(
				options.run,
				prepared.metadata.worktree,
				{ ...result, startedAt },
				/^STOPPED:/m.test(message) ? "STOPPED" : "report accepted",
			);
			return 0;
		}
		if (autoResumes >= MAX_AUTO_RESUMES) {
			await recordTurn(
				options.run,
				prepared.metadata.worktree,
				{ ...result, startedAt },
				"resume limit",
			);
			console.error(
				`codex-round: run ended without a report after ${MAX_AUTO_RESUMES} automatic resumes`,
			);
			return 1;
		}
		const stopReason = claimFailures.length
			? "claim check failed"
			: "no report";
		await recordTurn(
			options.run,
			prepared.metadata.worktree,
			{ ...result, startedAt },
			stopReason,
		);
		const line = firstLine(message);
		await appendFile(
			path.join(options.run, "auto-resumes.log"),
			`${JSON.stringify({
				time: new Date().toISOString(),
				exitCode: result.code,
				firstLine: line,
				...(claimFailures.length ? { claimFailures } : {}),
			})}\n`,
		);
		autoResumes += 1;
		resume = true;
		input = Buffer.from(
			claimFailures.length
				? claimResumeMessage(claimFailures)
				: autoResumeMessage(line),
			"utf8",
		);
	}
}

export async function main(args) {
	let options;
	try {
		options = Array.isArray(args)
			? codexOptions(resolveToolArguments("codex:round", args))
			: codexOptions(args);
		const requiredPath = options.resume ? options.run : options.brief;
		try {
			await access(requiredPath);
			if (options.messageFile) await access(options.messageFile);
		} catch {
			throw new Error(
				`${options.resume ? "folder" : "brief file"} not found: ${requiredPath}`,
			);
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
		const fix = /not found:/.test(error.message)
			? "pass an existing path; run pnpm codex:round --help"
			: "run pnpm codex:round --help";
		console.error(toolFailure("codex:round", error, fix));
		return 1;
	}
}

if (
	process.argv[1] &&
	(await samePath(fileURLToPath(import.meta.url), process.argv[1]))
) {
	const parsed = beginToolCommand("codex:round", process.argv.slice(2));
	process.exitCode = await main(parsed);
}
