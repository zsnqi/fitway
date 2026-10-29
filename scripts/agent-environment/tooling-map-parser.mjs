// Select mapped source files and read their leading comments and exports.
import path from "node:path";
import process from "node:process";
import ts from "typescript";
import { listTrackedFiles } from "../verify-repository.mjs";

export const MAP_RELATIVE_PATH = "docs/agent-context/AGENT_TOOLING_CODE_MAP.md";
export const REGENERATE_COMMAND = "pnpm map:tooling";
export const CHECK_COMMAND = "pnpm check:tooling-map";
export const MAPPED_PATHS = Object.freeze([
	"scripts/agent-environment",
	".agents/skills/verify-fitway",
	".agents/skills/gardener",
	"scripts/verify.mjs",
	"scripts/check-agent-context.mjs",
	"scripts/agent-context-rules.mjs",
	"scripts/agent-context-paths.mjs",
	"scripts/agent-context-schema.mjs",
	"scripts/agent-context-references.mjs",
	"scripts/agent-context-packets.mjs",
	"scripts/show-agent-context.mjs",
	"scripts/verify-repository.mjs",
	"scripts/repository-files.mjs",
	"scripts/project-state-invariants.mjs",
	"scripts/check-design-context.mjs",
	"scripts/check-concept-css.mjs",
	"scripts/concept-css-parse.mjs",
	"scripts/run-vitest.mjs",
]);

const SOURCE_EXTENSIONS = new Set([
	".js",
	".cjs",
	".mjs",
	".jsx",
	".ts",
	".cts",
	".mts",
	".tsx",
]);

function normalizePath(value) {
	return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

function uniqueSorted(values) {
	return [...new Set(values)].sort((left, right) =>
		left.localeCompare(right, "en"),
	);
}

function pathExtension(file) {
	return path.posix.extname(file).toLowerCase();
}

function isTestFile(file) {
	return /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(normalizePath(file));
}

function isMappedSourceFile(file) {
	const normalized = normalizePath(file);
	return (
		SOURCE_EXTENSIONS.has(pathExtension(normalized)) && !isTestFile(normalized)
	);
}

export function listMappedSourceFiles(root = process.cwd()) {
	const tracked = listTrackedFiles(root, MAPPED_PATHS);
	return uniqueSorted(tracked.filter(isMappedSourceFile));
}

export function listUntrackedMappedSourceFiles(root = process.cwd()) {
	return uniqueSorted(
		listTrackedFiles(root, MAPPED_PATHS, { untracked: true }).filter(
			isMappedSourceFile,
		),
	);
}

function leadingCommentText(sourceFile, source) {
	const firstStatement = sourceFile.statements[0];
	const limit = firstStatement?.getStart(sourceFile) ?? source.length;
	let prefix = source.slice(0, limit).replace(/^\uFEFF/, "");
	prefix = prefix.replace(/^#![^\r\n]*(?:\r?\n|$)/, "");

	let rest = prefix.replace(/^\s+/, "");
	if (!rest) return "(no leading comment)";

	let comment;
	if (rest.startsWith("//")) {
		const lines = [];
		const lineComment = /^[ \t]*\/\/[^\r\n]*(?:\r?\n|$)/;
		for (let match = lineComment.exec(rest); match; ) {
			lines.push(match[0].replace(/^[ \t]*\/\/ ?/, "").trimEnd());
			rest = rest.slice(match[0].length);
			match = lineComment.exec(rest);
		}
		comment = lines.join(" ");
	} else if (rest.startsWith("/*")) {
		const end = rest.indexOf("*/");
		if (end === -1) return "(no leading comment)";
		comment = rest
			.slice(2, end)
			.split(/\r?\n/)
			.map((line) => line.replace(/^\s*\*+\s?/, "").trimEnd())
			.join(" ");
	} else {
		return "(no leading comment)";
	}

	const collapsed = comment.replace(/\s+/g, " ").trim();
	if (!collapsed) return "(no leading comment)";
	return collapsed.match(/^.*?[.!?](?=\s|$)/)?.[0].trim() ?? collapsed;
}

function propertyName(name) {
	if (!name) return null;
	if (
		ts.isIdentifier(name) ||
		ts.isStringLiteral(name) ||
		ts.isNumericLiteral(name)
	)
		return name.text;
	return null;
}

function objectExportNames(node) {
	if (ts.isParenthesizedExpression(node))
		return objectExportNames(node.expression);
	if (
		ts.isBinaryExpression(node) &&
		node.operatorToken.kind === ts.SyntaxKind.EqualsToken
	)
		return objectExportNames(node.right);
	if (!ts.isObjectLiteralExpression(node)) return [];

	const names = [];
	for (const property of node.properties) {
		if (
			!ts.isPropertyAssignment(property) &&
			!ts.isShorthandPropertyAssignment(property) &&
			!ts.isMethodDeclaration(property) &&
			!ts.isGetAccessorDeclaration(property) &&
			!ts.isSetAccessorDeclaration(property)
		)
			continue;
		const name = propertyName(property.name);
		if (name) names.push(name);
	}
	return names;
}

function isModuleExports(node) {
	if (ts.isElementAccessExpression(node)) {
		return (
			ts.isIdentifier(node.expression) &&
			node.expression.text === "module" &&
			ts.isStringLiteral(node.argumentExpression) &&
			node.argumentExpression.text === "exports"
		);
	}
	return (
		ts.isPropertyAccessExpression(node) &&
		ts.isIdentifier(node.expression) &&
		node.expression.text === "module" &&
		node.name.text === "exports"
	);
}

function assignedExportName(node) {
	if (ts.isPropertyAccessExpression(node)) {
		if (ts.isIdentifier(node.expression) && node.expression.text === "exports")
			return node.name.text;
		if (isModuleExports(node.expression)) return node.name.text;
	}
	if (
		ts.isElementAccessExpression(node) &&
		ts.isStringLiteral(node.argumentExpression) &&
		ts.isIdentifier(node.expression) &&
		node.expression.text === "exports"
	)
		return node.argumentExpression.text;
	return null;
}

function commonJsExportNames(sourceFile) {
	const names = [];
	const visit = (node) => {
		if (
			ts.isBinaryExpression(node) &&
			node.operatorToken.kind === ts.SyntaxKind.EqualsToken
		) {
			if (isModuleExports(node.left))
				names.push(...objectExportNames(node.right));
			const name = assignedExportName(node.left);
			if (name) names.push(name);
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	return names;
}

function checkerExportNames(checker, sourceFile, root) {
	const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
	if (!moduleSymbol) return [];

	return checker.getExportsOfModule(moduleSymbol).map((symbol) => {
		let target = symbol;
		if ((symbol.flags & ts.SymbolFlags.Alias) !== 0) {
			try {
				target = checker.getAliasedSymbol(symbol);
			} catch {
				target = symbol;
			}
		}
		const declaration = target.declarations?.[0];
		if (!declaration) return symbol.getName();
		const origin = normalizePath(
			path.relative(root, declaration.getSourceFile().fileName),
		);
		return origin === normalizePath(path.relative(root, sourceFile.fileName))
			? symbol.getName()
			: `${symbol.getName()} (from ${origin})`;
	});
}

export function describeMappedFiles({ root, files, sourcesByFile }) {
	const program = ts.createProgram({
		rootNames: files.map((file) => path.join(root, file)),
		options: {
			allowJs: true,
			checkJs: false,
			module: ts.ModuleKind.NodeNext,
			moduleResolution: ts.ModuleResolutionKind.NodeNext,
			noEmit: true,
			skipLibCheck: true,
			target: ts.ScriptTarget.Latest,
		},
	});
	const checker = program.getTypeChecker();
	const sourceFiles = new Map(
		program
			.getSourceFiles()
			.map((sourceFile) => [
				normalizePath(path.relative(root, sourceFile.fileName)),
				sourceFile,
			]),
	);

	return files.map((file) => {
		const sourceFile = sourceFiles.get(file);
		const names = sourceFile
			? [
					...checkerExportNames(checker, sourceFile, root),
					...commonJsExportNames(sourceFile),
				]
			: [];
		return {
			path: file,
			leadingComment: sourceFile
				? leadingCommentText(sourceFile, sourcesByFile.get(file) ?? "")
				: "(no leading comment)",
			exports: uniqueSorted(names),
		};
	});
}
