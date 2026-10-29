import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { shellTokens } from "./shell-words.mjs";

export const RULE_ENFORCERS_PATH = "docs/agent-context/RULE_ENFORCERS.md";
const PNPM_BUILT_INS = new Set(["install"]);
// Enforcers outside the repository that the table names by name.
const NAMED_ENFORCERS = new Set(["CI", "branch protection"]);
const REPOSITORY_SCRIPT_EXTENSIONS = new Set([
	".cjs",
	".js",
	".json",
	".mjs",
	".md",
	".ts",
	".tsx",
	".yaml",
	".yml",
]);
const RECOGNISED_FORMS =
	"a pnpm command, a node, tsx or vitest run command, a repository file, a repository folder ending in /, or CI or branch protection";

function normalized(value) {
	return value.replaceAll("\\", "/");
}

function tableCells(line) {
	const trimmed = line.trim();
	if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return [];
	return trimmed
		.slice(1, -1)
		.split("|")
		.map((cell) => cell.trim());
}

function rows(text) {
	const result = [];
	for (const [index, line] of text.split(/\r?\n/).entries()) {
		const cells = tableCells(line);
		if (
			cells.length < 4 ||
			cells[0] === "Rule" ||
			cells.every((cell) => /^-+$/.test(cell.replaceAll(" ", "")))
		)
			continue;
		result.push({
			line: index + 1,
			rule: cells[0],
			enforcer: cells.at(-2),
			files: cells.at(-1),
		});
	}
	return result;
}

function codeTokens(text) {
	return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1].trim());
}

function stripLineRange(value) {
	return value.replace(/:\d+(?:-\d+)?$/, "");
}

function repositoryPath(value) {
	const file = stripLineRange(value.trim());
	if (
		!file ||
		/\s/.test(file) ||
		/[*?<>{}]/.test(file) ||
		/^[a-z][a-z\d+.-]*:/i.test(file)
	)
		return null;
	return normalized(file);
}

function repositoryFile(value) {
	const file = repositoryPath(value);
	if (
		!file ||
		!REPOSITORY_SCRIPT_EXTENSIONS.has(path.extname(file).toLowerCase())
	)
		return null;
	return file;
}

function isDirectCommand(words) {
	return (
		words[0] === "node" ||
		words[0] === "tsx" ||
		(words[0] === "vitest" && words[1] === "run")
	);
}

// The repository file a command runs: the first word after node or tsx that is
// not an option, or the first after vitest that is neither run nor an option.
function commandTarget(words) {
	for (const [index, word] of words.entries()) {
		const rest = words.slice(index + 1);
		let candidate;
		if (word === "node" || word === "tsx")
			candidate = rest.find((value) => !value.startsWith("-"));
		else if (word === "vitest")
			candidate = rest.find(
				(value) => value !== "run" && !value.startsWith("-"),
			);
		if (candidate) return repositoryFile(candidate);
	}
	return null;
}

function exists(root, relative) {
	return existsSync(path.resolve(root, relative));
}

function pnpmProblem(command, scripts, root) {
	if (PNPM_BUILT_INS.has(command)) return null;
	if (typeof scripts[command] !== "string")
		return `names pnpm command "${command}", which package.json does not define`;
	const target = commandTarget(shellTokens(scripts[command]) ?? []);
	if (target && !exists(root, target))
		return `names pnpm command "${command}", whose repository file does not exist: ${target}`;
	return null;
}

function directCommandProblem(span, words, root) {
	const target = commandTarget(words);
	if (!target)
		return `names code span \`${span}\`, a command with no repository file to run`;
	if (!exists(root, target))
		return `names command "${span}", whose repository file does not exist: ${target}`;
	return null;
}

// One code span from the Enforced-by or Where-it-fails cell: the problem it
// names, or null when what it names exists.
function spanProblem(span, scripts, root) {
	if (NAMED_ENFORCERS.has(span)) return null;
	const words = shellTokens(span) ?? [];
	if (words[0] === "pnpm") {
		const rest = words.slice(1);
		const commandIndex = rest.findIndex((word) => !word.startsWith("-"));
		if (
			rest[commandIndex] === "exec" &&
			isDirectCommand(rest.slice(commandIndex + 1))
		)
			return directCommandProblem(span, rest.slice(commandIndex + 1), root);
		if (commandIndex >= 0)
			return pnpmProblem(rest[commandIndex], scripts, root);
	}
	if (isDirectCommand(words)) return directCommandProblem(span, words, root);
	const folder = span.endsWith("/") ? repositoryPath(span) : null;
	if (folder) {
		const absolute = path.resolve(root, folder);
		return existsSync(absolute) && statSync(absolute).isDirectory()
			? null
			: `names missing folder: ${folder}`;
	}
	const file = repositoryFile(span);
	if (file) return exists(root, file) ? null : `names missing file: ${file}`;
	return `names code span \`${span}\`, which is none of ${RECOGNISED_FORMS}`;
}

// A pnpm command named in the Enforced-by cell's prose, outside its code spans.
function prosePnpmCommands(enforcer) {
	return [
		...enforcer
			.replace(/`[^`]+`/g, " ")
			.matchAll(/\bpnpm\s+([A-Za-z0-9][A-Za-z0-9:_-]*)/g),
	].map((match) => match[1]);
}

export function checkRuleEnforcers({ root = process.cwd() } = {}) {
	const repositoryRoot = path.resolve(root);
	const tablePath = path.resolve(repositoryRoot, RULE_ENFORCERS_PATH);
	if (!existsSync(tablePath)) return [];
	const packagePath = path.resolve(repositoryRoot, "package.json");
	if (!existsSync(packagePath))
		return [`${RULE_ENFORCERS_PATH}: package.json is missing`];
	let packageJson;
	try {
		packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
	} catch (error) {
		return [`package.json parse failed: ${error.message}`];
	}
	const scripts = packageJson?.scripts ?? {};
	const errors = [];
	const text = readFileSync(tablePath, "utf8");
	for (const row of rows(text)) {
		const problems = [
			...prosePnpmCommands(row.enforcer).map((command) =>
				pnpmProblem(command, scripts, repositoryRoot),
			),
			...codeTokens(`${row.enforcer} ${row.files}`).map((span) =>
				spanProblem(span, scripts, repositoryRoot),
			),
		];
		for (const problem of problems.filter(Boolean))
			errors.push(
				`${RULE_ENFORCERS_PATH}:${row.line}: row "${row.rule}" ${problem}`,
			);
	}
	return errors;
}
