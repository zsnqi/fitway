import { execFileSync } from "node:child_process";
import { readFile, realpath, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readGit } from "./git-context.mjs";
import { pathKey, samePath } from "./path-identity.mjs";
import {
	createPathReferenceResolver,
	exists,
	referenceTarget,
} from "./path-reference.mjs";

const ENVIRONMENT_PATH = "docs/agent-context/briefs/ENVIRONMENT.md";
const START = "<!-- environment:start v1 -->";
const END = "<!-- environment:end -->";
const FORMAT =
	/^<!-- brief-format: v1 role: (codex|builder|designer|verifier) -->\r?\n/;

function lineAt(text, index) {
	return text.slice(0, index).split("\n").length;
}

function lines(text) {
	const parts = text.split(/\r?\n/);
	return text.endsWith("\n") ? parts.length - 1 : parts.length;
}

function mask(text) {
	return text.replace(/[^\r\n]/g, " ");
}

function withoutComments(text) {
	return text.replace(/<!--[\s\S]*?-->/g, mask);
}

function codeSpans(text) {
	return [...text.matchAll(/(`+)([^`]*?)\1(?!`)/g)];
}

const REVIEW_TEMP_ROOT =
	process.platform === "win32" ? "D:/fitway-temp" : tmpdir();

let reviewSourcePlaceObserver;

export function setReviewSourcePlaceObserver(observer) {
	reviewSourcePlaceObserver = observer;
}

function recordReviewSourcePlace(value, kind) {
	reviewSourcePlaceObserver?.({ kind, value });
}

function sourceFileValue(value) {
	return value.replace(/:\d+(?:-\d+)?$/, "");
}

function isAbsolutePath(value) {
	return path.isAbsolute(value) || path.win32.isAbsolute(value);
}

function repositorySourcePath(value) {
	const normalized = value.replaceAll("\\", "/");
	if (
		!normalized ||
		normalized.startsWith("/") ||
		/^[A-Za-z]:/.test(normalized)
	)
		return null;
	const result = path.posix.normalize(normalized);
	if (
		result === "." ||
		result === ".." ||
		result.startsWith("../") ||
		result.includes("/../")
	)
		return null;
	return result;
}

function looksLikeNamedSource(value) {
	const trimmed = value.trim();
	if (!trimmed || /[\r\n]/.test(trimmed)) return false;
	if (isAbsolutePath(trimmed)) return true;
	if (repositorySourcePath(trimmed)) {
		return (
			trimmed.includes("/") ||
			trimmed.includes("\\") ||
			/\.[A-Za-z0-9]+$/.test(trimmed)
		);
	}
	return false;
}

export function namedReviewSourceEntries(brief) {
	const text = brief.toString("utf8").replace(/<!--[\s\S]*?-->/g, mask);
	const found = [];
	let section = null;
	const lines = text.split(/\r?\n/);
	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		const heading = line.match(/^#{1,6}\s+(.*)$/);
		const boldBullet = line.match(/^\s*-\s+\*\*([^*]+)\*\*/);
		const label = heading?.[1]?.trim() ?? boldBullet?.[1]?.trim() ?? "";
		if (heading || (boldBullet && !/^\s{2,}/.test(line))) {
			if (/^Read first\b/i.test(label)) section = "read first";
			else if (/^Decisions\b/i.test(label)) section = "decisions";
			else section = null;
		}
		const decisionsLine = /\bDecisions\s*:/i.test(line);
		if (section !== "read first" && section !== "decisions" && !decisionsLine)
			continue;
		for (const span of line.matchAll(/(`+)([^`]*?)\1(?!`)/g)) {
			const value = span[2].trim();
			if (looksLikeNamedSource(value)) found.push({ value, line: index + 1 });
		}
	}
	const seen = new Set();
	return found.filter((entry) => {
		if (seen.has(entry.value)) return false;
		seen.add(entry.value);
		return true;
	});
}

export function namedReviewSources(brief) {
	return namedReviewSourceEntries(brief).map((entry) => entry.value);
}

function isCredentialSourceName(value) {
	const name = path.basename(sourceFileValue(value)).toLowerCase();
	return (
		name === ".env" ||
		(/^\.env\.[^.]+$/.test(name) &&
			!/\.(?:example|sample|template)$/.test(name)) ||
		name === ".netrc" ||
		name === "auth.json" ||
		/^id_(?:rsa|ed25519|ecdsa)$/.test(name) ||
		/\.(?:key|pem|p12|pfx|ppk)$/.test(name)
	);
}

export function isCredentialSource(value, bytes) {
	return (
		isCredentialSourceName(value) ||
		/-----BEGIN [^-]*PRIVATE KEY-----/.test(bytes.toString("utf8"))
	);
}

function isWithin(root, absolute) {
	const rootValue = path.resolve(root);
	const absoluteValue = path.resolve(absolute);
	const relative = path.relative(
		process.platform === "win32" ? rootValue.toLowerCase() : rootValue,
		process.platform === "win32" ? absoluteValue.toLowerCase() : absoluteValue,
	);
	return (
		relative === "" ||
		(!relative.startsWith("..") && !path.isAbsolute(relative))
	);
}

async function realSourcePath(value) {
	try {
		return await realpath(path.resolve(value));
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR")
			throw new Error(`named review source not found: ${value}`);
		throw error;
	}
}

async function requireSourceFile(absolute, value) {
	let details;
	try {
		details = await stat(absolute);
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR")
			throw new Error(`named review source not found: ${value}`);
		throw error;
	}
	if (!details.isFile())
		throw new Error(`named review source is not a file: ${value}`);
}

function gitSourceBytes(worktree, head, relative, value, label) {
	const objectPath = relative.replace(/\/+$/, "");
	if (!objectPath) throw new Error(`invalid named review source: ${value}`);
	let listing;
	try {
		listing = execFileSync("git", ["ls-tree", "-z", head, "--", objectPath], {
			cwd: worktree,
			encoding: "utf8",
			maxBuffer: 256 * 1024 * 1024,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		});
	} catch {
		throw new Error(`${label} not found: ${value}`);
	}
	const entry = listing
		.split("\0")
		.filter(Boolean)
		.find((line) => line.slice(line.indexOf("\t") + 1) === objectPath);
	if (!entry) throw new Error(`${label} not found: ${value}`);
	const [metadata] = entry.split("\t");
	const [mode, type] = metadata.trim().split(/\s+/);
	if (type !== "blob" || !/^100(?:644|755)$/.test(mode)) {
		if (mode === "120000")
			throw new Error(`${label} is a symbolic link: ${value}`);
		throw new Error(`${label} is not a file: ${value}`);
	}
	recordReviewSourcePlace(
		value,
		label === "absolute review source" ? "checkout" : "repository",
	);
	try {
		return execFileSync("git", ["show", `${head}:${objectPath}`], {
			cwd: worktree,
			encoding: "buffer",
			maxBuffer: 256 * 1024 * 1024,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		});
	} catch {
		throw new Error(`${label} not found: ${value}`);
	}
}

export async function reviewSourcePlan(
	value,
	{ worktree, head, checkoutRoot } = {},
) {
	const sourceValue = sourceFileValue(value);
	if (isAbsolutePath(sourceValue)) {
		const real = await realSourcePath(sourceValue);
		let insideTemp = false;
		let insideCheckout = false;
		for (const root of [REVIEW_TEMP_ROOT, checkoutRoot].filter(Boolean)) {
			let realRoot;
			try {
				realRoot = await realpath(path.resolve(root));
			} catch {
				continue;
			}
			if (root === REVIEW_TEMP_ROOT) insideTemp = isWithin(realRoot, real);
			else insideCheckout = isWithin(realRoot, real);
		}
		if (insideTemp) {
			await requireSourceFile(real, value);
			recordReviewSourcePlace(value, "temp");
			const realRoot = await realpath(path.resolve(REVIEW_TEMP_ROOT));
			const relative = path.relative(realRoot, real);
			return {
				kind: "temp",
				value,
				target: path.join("temp", relative),
				bytes: await readFile(real),
			};
		}
		if (insideCheckout) {
			await requireSourceFile(real, value);
			const realRoot = await realpath(path.resolve(checkoutRoot));
			const relative = path.relative(realRoot, real).replaceAll(path.sep, "/");
			if (!relative)
				throw new Error(`absolute review source is not a file: ${value}`);
			const bytes = gitSourceBytes(
				checkoutRoot,
				"HEAD",
				relative,
				value,
				"absolute review source",
			);
			const working = await readFile(real);
			if (!bytes.equals(working))
				throw new Error(
					`absolute review source differs from the launcher checkout HEAD: ${value}`,
				);
			return {
				kind: "checkout",
				value,
				target: path.join("checkout", ...relative.split("/")),
				bytes,
			};
		}
		throw new Error(
			`absolute review source is outside D:/fitway-temp and the launcher checkout: ${value}`,
		);
	}
	const relative = repositorySourcePath(sourceValue);
	if (!relative) throw new Error(`invalid named review source: ${value}`);
	return {
		kind: "repository",
		value,
		target: relative,
		bytes: gitSourceBytes(
			worktree,
			head,
			relative,
			value,
			"named review source",
		),
	};
}

async function validateReviewSources(
	text,
	{ worktree, head, repositoryRoot, report },
) {
	const targets = new Map();
	for (const entry of namedReviewSourceEntries(text)) {
		const { value, line } = entry;
		if (isCredentialSourceName(value)) {
			report(
				"brief-review-sources",
				line,
				`named review source holds credentials: ${value}`,
			);
			continue;
		}
		try {
			const source = await reviewSourcePlan(value, {
				worktree,
				head,
				checkoutRoot: repositoryRoot,
			});
			const key = path.normalize(source.target).replaceAll("\\", "/");
			const targetKey = process.platform === "win32" ? key.toLowerCase() : key;
			if (targets.has(targetKey)) {
				report(
					"brief-review-sources",
					line,
					`two named review sources map to one file: ${value}; also ${targets.get(targetKey)}`,
				);
			} else targets.set(targetKey, value);
		} catch (error) {
			report("brief-review-sources", line, error.message);
		}
	}
}

function citedDecisionItems(tail) {
	const citation = tail.match(
		/^\s+items?\s+((?:\d+\s*(?:-\s*\d+)?)(?:\s*(?:,|and)\s*\d+\s*(?:-\s*\d+)?)*)(?=\s|[.,;:]|$)/i,
	);
	if (!citation) return [];
	const items = [];
	for (const part of citation[1].split(/\s*(?:,|and)\s*/i)) {
		const [start, end = start] = part.split(/\s*-\s*/).map(Number);
		for (let item = start; item <= end; item += 1) items.push(item);
	}
	return items;
}

function numberedTopLevelEntries(text) {
	const entries = new Set();
	let fence = null;
	for (const line of text.split(/\r?\n/)) {
		const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
		if (delimiter) {
			if (!fence) fence = delimiter[1];
			else if (
				delimiter[1][0] === fence[0] &&
				delimiter[1].length >= fence.length &&
				/^ {0,3}(?:`+|~+)\s*$/.test(line)
			)
				fence = null;
			continue;
		}
		if (fence) continue;
		const entry = line.match(/^(\d+)\.\s+/);
		if (entry) entries.add(Number(entry[1]));
	}
	return entries;
}

function reportMissingDecisionItems(
	content,
	decisionItems,
	file,
	absolute,
	worktree,
	line,
	report,
) {
	const entries = numberedTopLevelEntries(content);
	for (const item of decisionItems)
		if (!entries.has(item))
			report(
				"brief-references",
				line,
				`missing decision item ${item} in ${file} (${absolute}) in worktree ${worktree}`,
			);
}

function environmentBlock(text) {
	const starts = [...text.matchAll(/^<!-- environment:start v1 -->\r?$/gm)];
	const ends = [...text.matchAll(/^<!-- environment:end -->\r?$/gm)];
	if (starts.length !== 1 || ends.length !== 1) return null;
	const start = starts[0].index;
	const innerStart = start + START.length;
	const innerEnd = ends[0].index;
	if (innerEnd < innerStart) return null;
	return {
		start,
		innerStart,
		innerEnd,
		end: innerEnd + END.length,
		inner: text.slice(innerStart, innerEnd),
	};
}

export function parseBriefArgs(inputArgs) {
	const args = inputArgs[0] === "--" ? inputArgs.slice(1) : inputArgs;
	const options = { fillEnvironment: false };
	for (const argument of args) {
		if (argument === "--help" || argument === "-h") return { help: true };
		if (argument === "--fill-environment" && !options.fillEnvironment)
			options.fillEnvironment = true;
		else if (argument.startsWith("-") || options.briefPath)
			throw new Error(`Unexpected argument: ${argument}`);
		else options.briefPath = argument;
	}
	if (!options.briefPath) throw new Error("A brief path is required");
	return options;
}

function headings(text) {
	const result = new Set();
	let fence = null;
	const sourceLines = withoutComments(text).split(/\r?\n/);
	for (let index = 0; index < sourceLines.length; index += 1) {
		const line = sourceLines[index];
		const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})/);
		if (delimiter) {
			if (!fence) fence = delimiter[1];
			else if (
				delimiter[1][0] === fence[0] &&
				delimiter[1].length >= fence.length &&
				/^ {0,3}(?:`+|~+)\s*$/.test(line)
			)
				fence = null;
			continue;
		}
		if (fence) continue;
		const atx = line.match(/^ {0,3}#{1,6}\s+(.+?)\s*$/);
		if (atx) result.add(atx[1].replace(/\s+#+\s*$/, ""));
		else if (
			line.trim() &&
			/^ {0,3}(?:=+|-+)\s*$/.test(sourceLines[index + 1] ?? "")
		)
			result.add(line.trim());
	}
	return result;
}

async function validateWorktree(text, report, git) {
	const source = withoutComments(text);
	const headers = [...source.matchAll(/^- \*\*Worktree:\*\*[^\r\n]*$/gm)];
	const header = headers[0];
	const line = header ? lineAt(text, header.index) : 1;
	const fields = header?.[0].match(
		/^- \*\*Worktree:\*\* `([^`]+)`, branch `([^`]+)`, HEAD `([^`]+)`\s*$/,
	);
	if (headers.length !== 1 || !fields || /<[^>]*>/.test(fields[0])) {
		report(
			"brief-references",
			line,
			"requires one filled Worktree line with path, branch and HEAD",
		);
		return null;
	}
	const [, worktree, branch, head] = fields;
	if (!path.isAbsolute(worktree) || !(await exists(worktree))?.isDirectory()) {
		report(
			"brief-references",
			line,
			`worktree does not exist or is not absolute: ${worktree}`,
		);
		return null;
	}
	try {
		const root = git(worktree, ["rev-parse", "--show-toplevel"]);
		if (!(await samePath(root, worktree))) {
			report(
				"brief-references",
				line,
				`named worktree is not a Git worktree root: ${worktree}`,
			);
			return null;
		}
		let currentBranch;
		try {
			currentBranch = git(worktree, [
				"symbolic-ref",
				"--quiet",
				"--short",
				"HEAD",
			]);
		} catch {
			currentBranch = "<detached HEAD>";
		}
		if (currentBranch !== branch)
			report(
				"brief-references",
				line,
				`branch mismatch in ${worktree}: expected ${branch}, found ${currentBranch}`,
			);
		if (!/^[a-f\d]{4,40}$/i.test(head)) {
			report("brief-references", line, `HEAD must be a commit hash: ${head}`);
			return { root: worktree, head: null };
		}
		let namedHead;
		try {
			namedHead = git(worktree, ["rev-parse", "--verify", `${head}^{commit}`]);
			git(worktree, ["merge-base", "--is-ancestor", namedHead, "HEAD"]);
		} catch {
			report(
				"brief-references",
				line,
				`named HEAD ${head} is missing or is not an ancestor of HEAD in ${worktree}`,
			);
			return { root: worktree, head: null };
		}
		// Check each intervening commit: a non-Markdown edit followed by a revert still fails.
		const later = git(worktree, ["rev-list", `${namedHead}..HEAD`]);
		for (const commit of later.split("\n").filter(Boolean)) {
			const changed = git(worktree, [
				"diff-tree",
				"--no-commit-id",
				"--name-only",
				"--no-renames",
				"-r",
				"-m",
				"-z",
				commit,
			])
				.split("\0")
				.filter(Boolean);
			const nonMarkdown = changed.filter(
				(file) => !/\.(?:md|markdown)$/i.test(file),
			);
			if (nonMarkdown.length)
				report(
					"brief-references",
					line,
					`commit ${commit} after named HEAD ${head} changes non-Markdown paths: ${nonMarkdown.join(", ")}`,
				);
		}
		return { root: worktree, head: namedHead };
	} catch (error) {
		report(
			"brief-references",
			line,
			`cannot inspect worktree ${worktree}: ${error.message}`,
		);
		return null;
	}
}

async function validateReferences(text, worktree, repositoryRoot, report, git) {
	const source = withoutComments(text);
	const resolver = createPathReferenceResolver(worktree, git);
	const references = [];
	const requiredChanges = [];
	for (const span of codeSpans(source)) {
		const line = lineAt(text, span.index);
		const tail = source.slice(span.index + span[0].length);
		const after = tail.match(/^\s*§"([^"]+)"/);
		// Markdown reads a line break inside a code span as a space.
		const split = /[\r\n]/.test(span[2]);
		const value = span[2].replace(/(?:\r\n|[\r\n])[ \t]*/g, " ");
		// The explicit marker opts even bare and machine-local paths into checking.
		if (/^ \(must change\)(?=\s|[.,;:]|$)/.test(tail)) {
			const absolute = path.resolve(worktree, value.replaceAll("\\", "/"));
			const details = await exists(absolute);
			if (!details)
				report(
					"brief-references",
					line,
					`must change path does not exist: ${absolute}`,
				);
			else if (!details.isFile() && !details.isDirectory())
				report(
					"brief-references",
					line,
					`must change path must be a file or folder: ${absolute}`,
				);
			else
				requiredChanges.push({
					path: value,
					absolute,
					line,
					outcome: text.split(/\r?\n/)[line - 1],
				});
			continue;
		}
		const decisionItems = citedDecisionItems(tail);
		const reference = await resolver.reference(value);
		if (!reference) {
			if (decisionItems.length && path.isAbsolute(value)) {
				const absolute = path.resolve(value);
				const details = await exists(absolute);
				if (details?.isFile())
					reportMissingDecisionItems(
						await readFile(absolute, "utf8"),
						decisionItems,
						value,
						absolute,
						worktree,
						line,
						report,
					);
			}
			continue;
		}
		references.push({
			...reference,
			split,
			lineNumber: line,
			heading: reference.heading ?? after?.[1],
			decisionItems,
			isNew: /^[ \t]+\(new\)(?=\s|[.,;:]|$)/.test(tail),
		});
	}
	const newPaths = new Set(
		await Promise.all(
			references
				.filter((reference) => reference.isNew)
				.map((reference) => pathKey(path.resolve(worktree, reference.file))),
		),
	);
	for (const reference of references) {
		const { lineNumber: line, heading } = reference;
		const { wildcard, file: checkedPath } = referenceTarget(reference.file);
		const absolute = path.resolve(worktree, checkedPath);
		const details = await exists(absolute);
		if (reference.isNew) {
			if (details)
				report(
					"brief-references",
					line,
					`new path already exists: ${absolute}`,
				);
			const parent = path.dirname(absolute);
			const parentDetails = await exists(parent);
			if (
				parentDetails
					? !parentDetails.isDirectory()
					: !newPaths.has(await pathKey(parent))
			)
				report(
					"brief-references",
					line,
					`parent folder must exist or be declared (new): ${parent}`,
				);
			continue;
		}
		if (!details) {
			const inCommandRepository = path.resolve(repositoryRoot, reference.file);
			const hint = `${reference.split ? "; this code span breaks across lines, which Markdown reads as a space" : ""}${resolver.missingPathHint(reference.file)}`;
			if (
				!path.isAbsolute(reference.file) &&
				(await exists(inCommandRepository))
			)
				report(
					"brief-references",
					line,
					`drift: missing ${absolute} in worktree ${worktree}; present at ${inCommandRepository} in command repository ${repositoryRoot}${hint}`,
				);
			else
				report(
					"brief-references",
					line,
					`missing path in ${worktree}: ${absolute}${hint}`,
				);
			continue;
		}
		if (wildcard && !details.isDirectory()) {
			report(
				"brief-references",
				line,
				`glob folder is not a directory: ${absolute}`,
			);
			continue;
		}
		if (!heading && reference.line === null && !reference.decisionItems.length)
			continue;
		if (!details.isFile()) {
			report(
				"brief-references",
				line,
				`heading or line selector requires a file: ${absolute}`,
			);
			continue;
		}
		const content = await readFile(absolute, "utf8");
		const lastLine = reference.endLine ?? reference.line;
		if (
			reference.line !== null &&
			(reference.line < 1 ||
				lastLine < reference.line ||
				lastLine > lines(content))
		)
			report(
				"brief-references",
				line,
				`${reference.file}:${reference.line}${reference.endLine === null ? "" : `-${reference.endLine}`} exceeds file length (${lines(content)} lines), is below line 1, or ends before it starts in ${worktree}`,
			);
		if (heading && !headings(content).has(heading))
			report(
				"brief-references",
				line,
				`missing heading §"${heading}" in ${absolute}`,
			);
		if (reference.decisionItems.length) {
			reportMissingDecisionItems(
				content,
				reference.decisionItems,
				reference.file,
				absolute,
				worktree,
				line,
				report,
			);
		}
	}
	return requiredChanges;
}

export async function checkBrief({
	repositoryRoot,
	briefPath,
	fillEnvironment = false,
	git = readGit,
}) {
	const absoluteBrief = path.resolve(repositoryRoot, briefPath);
	let text = await readFile(absoluteBrief, "utf8");
	const problems = [];
	const report = (rule, line, message, severity = "FAIL") =>
		problems.push({
			rule,
			line,
			message: message.replace(/[\r\n]+/g, " "),
			severity,
		});
	const canonical = await readFile(
		path.resolve(repositoryRoot, ENVIRONMENT_PATH),
		"utf8",
	);
	const canonicalBlock = environmentBlock(canonical);
	if (
		!canonicalBlock ||
		canonical.trimEnd() !==
			canonical.slice(canonicalBlock.start, canonicalBlock.end)
	)
		throw new Error(`Invalid shared environment source: ${ENVIRONMENT_PATH}`);
	let block = environmentBlock(text);
	let filled = false;
	if (fillEnvironment && block && !block.inner.trim()) {
		const eol = text.match(/\r?\n/)?.[0] ?? "\n";
		text =
			text.slice(0, block.innerStart) +
			canonicalBlock.inner.replace(/\r?\n/g, eol) +
			text.slice(block.innerEnd);
		await writeFile(absoluteBrief, text, "utf8");
		block = environmentBlock(text);
		filled = true;
	}
	const role = text.match(FORMAT)?.[1];
	if (!role)
		report(
			"brief-format",
			1,
			"must start with <!-- brief-format: v1 role: codex|builder|designer|verifier --> using one role",
		);
	if (!block)
		report(
			"brief-format",
			1,
			"requires one ordered pair of environment:start v1 and environment:end markers",
		);
	else if (
		block.inner.replace(/\r\n/g, "\n") !==
		canonicalBlock.inner.replace(/\r\n/g, "\n")
	)
		report(
			"brief-format",
			lineAt(text, block.start),
			`environment block differs from ${ENVIRONMENT_PATH}${fillEnvironment ? "; --fill-environment only fills empty markers" : ""}`,
		);

	let prose = text;
	if (block)
		prose =
			prose.slice(0, block.start) +
			mask(prose.slice(block.start, block.end)) +
			prose.slice(block.end);
	prose = withoutComments(prose);
	for (const span of codeSpans(prose).reverse())
		prose =
			prose.slice(0, span.index) +
			mask(span[0]) +
			prose.slice(span.index + span[0].length);
	for (const checklist of prose.matchAll(
		/^## Coordinator checklist(?:\s.*)?\r?$/gim,
	))
		report(
			"brief-readiness",
			lineAt(text, checklist.index),
			"remove the Coordinator checklist section before launch",
		);
	for (const placeholder of prose.matchAll(/<[^<>\r\n]+>/g))
		report(
			"brief-readiness",
			lineAt(text, placeholder.index),
			`unfilled placeholder: ${text.slice(placeholder.index, placeholder.index + placeholder[0].length)}`,
		);
	if (role === "codex")
		for (const forbidden of text.matchAll(/fitway-grader|held-out/gi))
			report(
				"brief-readiness",
				lineAt(text, forbidden.index),
				`codex brief mentions forbidden text: ${forbidden[0]}`,
			);
	const lineCount = lines(text);
	if (lineCount > 80)
		report(
			"brief-length",
			81,
			`${lineCount} lines exceeds 80; warning only`,
			"WARNING",
		);
	const validatedWorktree = await validateWorktree(text, report, git);
	const worktree = validatedWorktree?.root ?? null;
	const namedHead = validatedWorktree?.head ?? null;
	const requiredChanges = worktree
		? await validateReferences(text, worktree, repositoryRoot, report, git)
		: [];
	if (role === "codex" && worktree && namedHead)
		await validateReviewSources(text, {
			worktree,
			head: namedHead,
			repositoryRoot,
			report,
		});
	problems.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
	return {
		briefPath: absoluteBrief,
		role,
		worktree,
		requiredChanges,
		lineCount,
		filled,
		problems,
		ok: !problems.some((problem) => problem.severity === "FAIL"),
	};
}

export function formatBriefResult(result) {
	const output = result.problems.map(
		(problem) =>
			`${result.briefPath}:${problem.line}: ${problem.severity} ${problem.rule}: ${problem.message}`,
	);
	if (result.filled)
		output.push(`${result.briefPath}:1: filled shared environment block`);
	if (result.ok)
		output.push(
			`${result.briefPath}:1: PASS brief:check (${result.role}, ${result.lineCount} lines)`,
		);
	return output.join("\n");
}

if (
	process.argv[1] &&
	(await samePath(fileURLToPath(import.meta.url), process.argv[1]))
) {
	try {
		const options = parseBriefArgs(process.argv.slice(2));
		if (options.help)
			console.log("Usage: pnpm brief:check [--] <brief> [--fill-environment]");
		else {
			const repositoryRoot = readGit(process.cwd(), [
				"rev-parse",
				"--show-toplevel",
			]);
			const result = await checkBrief({
				...options,
				briefPath: path.resolve(process.cwd(), options.briefPath),
				repositoryRoot,
			});
			console.log(formatBriefResult(result));
			process.exitCode = result.ok ? 0 : 1;
		}
	} catch (error) {
		console.error(
			`brief:check:1: FAIL: ${error.message.replace(/[\r\n]+/g, " ")}`,
		);
		process.exitCode = 1;
	}
}
