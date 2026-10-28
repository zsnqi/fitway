import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const RULE_ENFORCERS_PATH = "docs/agent-context/RULE_ENFORCERS.md";
const PNPM_BUILT_INS = new Set(["install"]);
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
			text: `${cells.at(-2)} ${cells.at(-1)}`,
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

function repositoryFile(value) {
	const file = stripLineRange(value.trim());
	if (
		!file ||
		file.startsWith("pnpm ") ||
		file === "CI" ||
		file === "HEAD" ||
		/[*?<>{}]/.test(file) ||
		/^[a-z][a-z\d+.-]*:/i.test(file) ||
		file.includes(" ")
	)
		return null;
	if (!REPOSITORY_SCRIPT_EXTENSIONS.has(path.extname(file).toLowerCase()))
		return null;
	return normalized(file);
}

function scriptTarget(script) {
	const tokens = script.match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
	for (let index = 0; index < tokens.length; index += 1) {
		const token = tokens[index].replace(/^["']|["']$/g, "");
		let candidate;
		if (token === "node" || token === "tsx") {
			candidate = tokens.slice(index + 1).find((value) => {
				const unquoted = value.replace(/^["']|["']$/g, "");
				return !unquoted.startsWith("-") && unquoted !== "--";
			});
		} else if (token === "vitest") {
			candidate = tokens.slice(index + 1).find((value) => {
				const unquoted = value.replace(/^["']|["']$/g, "");
				return unquoted !== "run" && !unquoted.startsWith("-");
			});
		}
		if (candidate) return repositoryFile(candidate);
	}
	return null;
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
		const label = `row "${row.rule}"`;
		for (const match of row.enforcer.matchAll(
			/\bpnpm\s+([A-Za-z0-9][A-Za-z0-9:_-]*)/g,
		)) {
			const command = match[1];
			if (PNPM_BUILT_INS.has(command)) continue;
			if (typeof scripts[command] !== "string") {
				errors.push(
					`${RULE_ENFORCERS_PATH}:${row.line}: ${label} names pnpm command "${command}", which package.json does not define`,
				);
				continue;
			}
			const target = scriptTarget(scripts[command]);
			if (target && !existsSync(path.resolve(repositoryRoot, target)))
				errors.push(
					`${RULE_ENFORCERS_PATH}:${row.line}: ${label} names pnpm command "${command}", whose repository file does not exist: ${target}`,
				);
		}
		for (const token of codeTokens(row.text)) {
			const file = repositoryFile(token);
			if (file && !existsSync(path.resolve(repositoryRoot, file)))
				errors.push(
					`${RULE_ENFORCERS_PATH}:${row.line}: ${label} names missing file: ${file}`,
				);
		}
	}
	return errors;
}
