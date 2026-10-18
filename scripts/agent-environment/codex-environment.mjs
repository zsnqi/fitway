// Codex model, environment, catalog, and executable setup.

import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
	access,
	readdir,
	readFile,
	realpath,
	stat,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TextDecoder } from "node:util";
import { readGit } from "./git-context.mjs";
import { pathKey } from "./path-identity.mjs";

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

export {
	assertFresh,
	assertOutsideGit,
	catalogPathFor,
	codexEnvironment,
	DEEPSEEK_MODEL,
	decodeMessageFile,
	findCodex,
	MAX_AUTO_RESUMES,
	modelArgs,
	readDeepSeekCatalog,
	repositoryRoot,
	resolvePath,
	sha256,
	validateModelLevel,
	writeCatalog,
};
