import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { readGit } from "./git-context.mjs";

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

function pathReference(value) {
	const normalized = value.trim().replaceAll("\\", "/");
	if (
		/<[^>]*>/.test(normalized) ||
		/^v?\d+\.\d+(?:\.\d+)?(?:[-+][\w.-]+)?$/.test(normalized) ||
		/^D:\/fitway-temp(?:\/|$)/i.test(normalized) ||
		/^(?:pnpm|npm|node|git|npx|powershell|pwsh)\s/i.test(normalized) ||
		/^[a-z][a-z\d+.-]*:\/\//i.test(normalized)
	)
		return null;
	const match = normalized.match(/^(.*?)(?::(\d+))?(?:\s+§"([^"]+)")?$/);
	const file = match[1];
	// Inline commands, hashes, roles and API routes such as `/api` are not file references.
	if (!file.includes("/", file.startsWith("/") ? 1 : 0)) return null;
	return { file, line: match[2] ? Number(match[2]) : null, heading: match[3] };
}

async function exists(absolute) {
	try {
		return await stat(absolute);
	} catch (error) {
		if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
		throw error;
	}
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
			"B1",
			line,
			"requires one filled Worktree line with path, branch and HEAD",
		);
		return null;
	}
	const [, worktree, branch, head] = fields;
	if (!path.isAbsolute(worktree) || !(await exists(worktree))?.isDirectory()) {
		report(
			"B1",
			line,
			`worktree does not exist or is not absolute: ${worktree}`,
		);
		return null;
	}
	try {
		const root = git(worktree, ["rev-parse", "--show-toplevel"]);
		if (path.resolve(root) !== path.resolve(worktree)) {
			report(
				"B1",
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
				"B1",
				line,
				`branch mismatch in ${worktree}: expected ${branch}, found ${currentBranch}`,
			);
		if (!/^[a-f\d]{4,40}$/i.test(head)) {
			report("B1", line, `HEAD must be a commit hash: ${head}`);
			return worktree;
		}
		let namedHead;
		try {
			namedHead = git(worktree, ["rev-parse", "--verify", `${head}^{commit}`]);
			git(worktree, ["merge-base", "--is-ancestor", namedHead, "HEAD"]);
		} catch {
			report(
				"B1",
				line,
				`named HEAD ${head} is missing or is not an ancestor of HEAD in ${worktree}`,
			);
			return worktree;
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
					"B1",
					line,
					`commit ${commit} after named HEAD ${head} changes non-Markdown paths: ${nonMarkdown.join(", ")}`,
				);
		}
		return worktree;
	} catch (error) {
		report("B1", line, `cannot inspect worktree ${worktree}: ${error.message}`);
		return null;
	}
}

async function validateReferences(text, worktree, repositoryRoot, report, git) {
	const source = withoutComments(text);
	const references = [];
	for (const span of codeSpans(source)) {
		const line = lineAt(text, span.index);
		const lineStart = source.lastIndexOf("\n", span.index) + 1;
		if (source.slice(lineStart, span.index).startsWith("- **Worktree:**"))
			continue;
		const tail = source.slice(span.index + span[0].length);
		const after = tail.match(/^\s*§"([^"]+)"/);
		const reference = pathReference(span[2]);
		if (!reference) continue;
		references.push({
			...reference,
			lineNumber: line,
			heading: reference.heading ?? after?.[1],
			isNew: /^[ \t]+\(new\)(?=\s|[.,;:]|$)/.test(tail),
		});
	}
	const newPaths = new Set(
		references
			.filter((reference) => reference.isNew)
			.map((reference) => path.resolve(worktree, reference.file)),
	);
	let trackedFiles;
	for (const reference of references) {
		const { lineNumber: line, heading } = reference;
		const wildcard = /[*?]/.test(reference.file);
		const prefix = reference.file.split(/[*?]/, 1)[0];
		const checkedPath = wildcard
			? prefix.slice(0, prefix.lastIndexOf("/") + 1) || "."
			: reference.file;
		const absolute = path.resolve(worktree, checkedPath);
		const details = await exists(absolute);
		if (reference.isNew) {
			if (details) report("B1", line, `new path already exists: ${absolute}`);
			const parent = path.dirname(absolute);
			const parentDetails = await exists(parent);
			if (parentDetails ? !parentDetails.isDirectory() : !newPaths.has(parent))
				report(
					"B1",
					line,
					`parent folder must exist or be declared (new): ${parent}`,
				);
			continue;
		}
		if (!details) {
			const inCommandRepository = path.resolve(repositoryRoot, reference.file);
			let suggestion = "";
			if (!wildcard && !path.isAbsolute(reference.file)) {
				trackedFiles ??= git(worktree, ["ls-files", "-z"])
					.split("\0")
					.filter(Boolean);
				const suffix = `/${path.posix.normalize(reference.file)}`;
				const matches = trackedFiles.filter((file) => file.endsWith(suffix));
				if (matches.length === 1)
					suggestion = `; tracked suffix match: ${path.resolve(worktree, matches[0])}`;
			}
			if (
				!path.isAbsolute(reference.file) &&
				(await exists(inCommandRepository))
			)
				report(
					"B1",
					line,
					`drift: missing ${absolute} in worktree ${worktree}; present at ${inCommandRepository} in command repository ${repositoryRoot}${suggestion}`,
				);
			else
				report(
					"B1",
					line,
					`missing path in ${worktree}: ${absolute}${suggestion}`,
				);
			continue;
		}
		if (wildcard && !details.isDirectory()) {
			report("B1", line, `glob folder is not a directory: ${absolute}`);
			continue;
		}
		if (!heading && reference.line === null) continue;
		if (!details.isFile()) {
			report(
				"B1",
				line,
				`heading or line selector requires a file: ${absolute}`,
			);
			continue;
		}
		const content = await readFile(absolute, "utf8");
		if (
			reference.line !== null &&
			(reference.line < 1 || reference.line > lines(content))
		)
			report(
				"B1",
				line,
				`${reference.file}:${reference.line} exceeds file length (${lines(content)} lines) or is below line 1 in ${worktree}`,
			);
		if (heading && !headings(content).has(heading))
			report("B1", line, `missing heading §"${heading}" in ${absolute}`);
	}
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
			"B2",
			1,
			"must start with <!-- brief-format: v1 role: codex|builder|designer|verifier --> using one role",
		);
	if (!block)
		report(
			"B2",
			1,
			"requires one ordered pair of environment:start v1 and environment:end markers",
		);
	else if (
		block.inner.replace(/\r\n/g, "\n") !==
		canonicalBlock.inner.replace(/\r\n/g, "\n")
	)
		report(
			"B2",
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
			"B3",
			lineAt(text, checklist.index),
			"remove the Coordinator checklist section before launch",
		);
	for (const placeholder of prose.matchAll(/<[^<>\r\n]+>/g))
		report(
			"B3",
			lineAt(text, placeholder.index),
			`unfilled placeholder: ${text.slice(placeholder.index, placeholder.index + placeholder[0].length)}`,
		);
	if (role === "codex")
		for (const forbidden of text.matchAll(/fitway-grader|held-out/gi))
			report(
				"B3",
				lineAt(text, forbidden.index),
				`codex brief mentions forbidden text: ${forbidden[0]}`,
			);
	const lineCount = lines(text);
	if (lineCount > 80)
		report("B4", 81, `${lineCount} lines exceeds 80; warning only`, "WARNING");
	const worktree = await validateWorktree(text, report, git);
	if (worktree)
		await validateReferences(text, worktree, repositoryRoot, report, git);
	problems.sort((a, b) => a.line - b.line || a.rule.localeCompare(b.rule));
	return {
		briefPath: absoluteBrief,
		role,
		worktree,
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
	fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
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
