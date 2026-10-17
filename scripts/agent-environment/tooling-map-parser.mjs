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
	"scripts/show-agent-context.mjs",
	"scripts/verify-repository.mjs",
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

export function normalizePath(value) {
	return value.replaceAll("\\", "/").replace(/^\.\//, "");
}

export function uniqueSorted(values) {
	return [...new Set(values)].sort((left, right) =>
		left.localeCompare(right, "en"),
	);
}

function pathExtension(file) {
	return path.posix.extname(file).toLowerCase();
}

export function isTestFile(file) {
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

export function listTestFiles(root = process.cwd()) {
	return uniqueSorted(listTrackedFiles(root).filter(isTestFile));
}

export function listUntrackedMappedSourceFiles(root = process.cwd()) {
	return uniqueSorted(
		listTrackedFiles(root, MAPPED_PATHS, { untracked: true }).filter(
			isMappedSourceFile,
		),
	);
}

function hasModifier(node, kind) {
	return (
		ts.canHaveModifiers(node) &&
		(ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind)
	);
}

function isExported(node) {
	return hasModifier(node, ts.SyntaxKind.ExportKeyword);
}

function isDefaultExported(node) {
	return hasModifier(node, ts.SyntaxKind.DefaultKeyword);
}

export function propertyNameText(name, sourceFile) {
	if (!name) return null;
	if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text;
	if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
	if (ts.isComputedPropertyName(name)) {
		return `[${name.expression.getText(sourceFile)}]`;
	}
	return name.getText(sourceFile);
}

function declarationLineRange(node, sourceFile) {
	const start =
		sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
		1;
	const endPosition = Math.max(node.getStart(sourceFile), node.end - 1);
	const end = sourceFile.getLineAndCharacterOfPosition(endPosition).line + 1;
	return { lineStart: start, lineEnd: end };
}

export function unwrapParenthesized(node) {
	let expression = node;
	while (expression && ts.isParenthesizedExpression(expression))
		expression = expression.expression;
	return expression;
}

function isCallableExpression(node) {
	const expression = unwrapParenthesized(node);
	return (
		expression !== undefined &&
		(ts.isArrowFunction(expression) ||
			ts.isFunctionExpression(expression) ||
			ts.isClassExpression(expression))
	);
}

function addEntry(entries, sourceFile, file, rangeNode, input) {
	if (!input.name) return null;
	const entry = {
		path: file,
		name: input.name,
		declarationName: input.declarationName ?? input.name,
		kind: input.kind,
		...declarationLineRange(rangeNode, sourceFile),
		exportNames: input.exportNames ?? [],
		ownerName: input.ownerName ?? null,
		memberName: input.memberName ?? null,
		memberStatic: Boolean(input.memberStatic),
	};
	entries.push(entry);
	return entry;
}

function hasStaticModifier(node) {
	return (
		node.modifiers?.some(
			(modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword,
		) ?? false
	);
}

function memberKind(member, staticMember) {
	if (ts.isConstructorDeclaration(member)) return "constructor";
	if (ts.isGetAccessorDeclaration(member))
		return staticMember ? "static-getter" : "getter";
	if (ts.isSetAccessorDeclaration(member))
		return staticMember ? "static-setter" : "setter";
	if (ts.isMethodDeclaration(member))
		return staticMember ? "static-method" : "method";
	return staticMember ? "static-property" : "property";
}

function addClassEntry(
	entries,
	sourceFile,
	file,
	declaration,
	{
		name,
		defaultExport = false,
		exportNames = [],
		rangeNode = declaration,
	} = {},
) {
	const ownerName = name ?? "default";
	const owner = addEntry(entries, sourceFile, file, rangeNode, {
		name: ownerName,
		declarationName: name ?? null,
		kind: defaultExport ? "default-class" : "class",
		exportNames: defaultExport ? ["default"] : exportNames,
	});
	if (!owner) return null;
	for (const member of declaration.members) {
		if (
			!ts.isMethodDeclaration(member) &&
			!ts.isConstructorDeclaration(member) &&
			!ts.isGetAccessorDeclaration(member) &&
			!ts.isSetAccessorDeclaration(member) &&
			!ts.isPropertyDeclaration(member)
		)
			continue;
		const memberName = ts.isConstructorDeclaration(member)
			? "constructor"
			: propertyNameText(member.name, sourceFile);
		if (!memberName) continue;
		if (
			ts.isPropertyDeclaration(member) &&
			(!member.initializer || !isCallableExpression(member.initializer))
		)
			continue;
		const staticMember = hasStaticModifier(member);
		addEntry(entries, sourceFile, file, member, {
			name: `${ownerName}.${memberName}`,
			declarationName: memberName,
			kind: memberKind(member, staticMember),
			ownerName,
			memberName,
			memberStatic: staticMember,
		});
	}
	return owner;
}

function addExportAliases(entries, sourceFile) {
	const entriesByLocalName = new Map();
	for (const entry of entries) {
		if (entry.ownerName === null && entry.declarationName) {
			const current = entriesByLocalName.get(entry.declarationName) ?? [];
			current.push(entry);
			entriesByLocalName.set(entry.declarationName, current);
		}
	}
	for (const statement of sourceFile.statements) {
		if (
			ts.isExportDeclaration(statement) &&
			!statement.moduleSpecifier &&
			statement.exportClause &&
			ts.isNamedExports(statement.exportClause)
		) {
			for (const specifier of statement.exportClause.elements) {
				const local = (specifier.propertyName ?? specifier.name).text;
				const exported = specifier.name.text;
				for (const entry of entriesByLocalName.get(local) ?? [])
					entry.exportNames.push(exported);
			}
		}
		if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
			if (ts.isIdentifier(statement.expression)) {
				for (const entry of entriesByLocalName.get(statement.expression.text) ??
					[])
					entry.exportNames.push("default");
			}
		}
	}
	for (const entry of entries)
		entry.exportNames = uniqueSorted(entry.exportNames);
}

function addFunctionDeclaration(entries, sourceFile, file, statement) {
	const name = statement.name?.text;
	if (!name && !isDefaultExported(statement)) return;
	addEntry(entries, sourceFile, file, statement, {
		name: name ?? "default",
		declarationName: name ?? null,
		kind: isDefaultExported(statement) ? "default-function" : "function",
		exportNames: isDefaultExported(statement)
			? ["default"]
			: isExported(statement)
				? [name]
				: [],
	});
}

function addVariableStatement(entries, sourceFile, file, statement) {
	for (const declaration of statement.declarationList.declarations) {
		if (!ts.isIdentifier(declaration.name)) continue;
		if (!isCallableExpression(declaration.initializer)) continue;
		const expression = unwrapParenthesized(declaration.initializer);
		const name = declaration.name.text;
		if (ts.isClassExpression(expression)) {
			addClassEntry(entries, sourceFile, file, expression, {
				name,
				exportNames: isExported(statement) ? [name] : [],
				rangeNode: declaration,
			});
			continue;
		}
		addEntry(entries, sourceFile, file, declaration, {
			name,
			kind: ts.isArrowFunction(expression) ? "arrow" : "function-expression",
			exportNames: isExported(statement) ? [name] : [],
		});
	}
}

function addDefaultCallable(entries, sourceFile, file, node, rangeNode) {
	const expression = unwrapParenthesized(node);
	if (ts.isClassExpression(expression)) {
		addClassEntry(entries, sourceFile, file, expression, {
			name: expression.name?.text ?? null,
			defaultExport: true,
			rangeNode,
		});
		return;
	}
	addEntry(entries, sourceFile, file, rangeNode, {
		name: "default",
		declarationName: null,
		kind: ts.isArrowFunction(expression)
			? "default-arrow"
			: "default-function-expression",
		exportNames: ["default"],
	});
}

function addExportAssignment(entries, sourceFile, file, statement) {
	if (statement.isExportEquals) return;
	if (!isCallableExpression(statement.expression)) return;
	addDefaultCallable(
		entries,
		sourceFile,
		file,
		statement.expression,
		statement,
	);
}

function addCommonJsExport(entries, sourceFile, file, statement) {
	const assignment = statement.expression;
	if (
		!ts.isBinaryExpression(assignment) ||
		assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
		!ts.isPropertyAccessExpression(assignment.left)
	)
		return;
	const left = assignment.left;
	const leftName = propertyNameText(left.name, sourceFile);
	if (
		leftName !== "exports" ||
		!ts.isIdentifier(left.expression) ||
		left.expression.text !== "module" ||
		!isCallableExpression(assignment.right)
	)
		return;
	addDefaultCallable(entries, sourceFile, file, assignment.right, assignment);
}

export function parseCallables(file, source) {
	const normalizedFile = normalizePath(file);
	const sourceFile = ts.createSourceFile(
		normalizedFile,
		source,
		ts.ScriptTarget.Latest,
		true,
		normalizedFile.endsWith(".ts") || normalizedFile.endsWith(".tsx")
			? ts.ScriptKind.TS
			: ts.ScriptKind.JS,
	);
	const entries = [];
	for (const statement of sourceFile.statements) {
		if (ts.isFunctionDeclaration(statement)) {
			addFunctionDeclaration(entries, sourceFile, normalizedFile, statement);
		} else if (ts.isClassDeclaration(statement)) {
			const name = statement.name?.text;
			if (!name && !isDefaultExported(statement)) continue;
			addClassEntry(entries, sourceFile, normalizedFile, statement, {
				name: name ?? null,
				defaultExport: isDefaultExported(statement),
				exportNames: isExported(statement) && name ? [name] : [],
			});
		} else if (ts.isVariableStatement(statement)) {
			addVariableStatement(entries, sourceFile, normalizedFile, statement);
		} else if (ts.isExportAssignment(statement)) {
			addExportAssignment(entries, sourceFile, normalizedFile, statement);
		} else if (ts.isExpressionStatement(statement)) {
			addCommonJsExport(entries, sourceFile, normalizedFile, statement);
		}
	}
	addExportAliases(entries, sourceFile);
	return entries.sort(
		(left, right) =>
			left.lineStart - right.lineStart ||
			left.lineEnd - right.lineEnd ||
			left.kind.localeCompare(right.kind, "en") ||
			left.name.localeCompare(right.name, "en"),
	);
}
