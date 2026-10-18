import path from "node:path";
import ts from "typescript";
import {
	createSourceFile,
	normalizePath,
	propertyNameText,
	unwrapParenthesized,
} from "./tooling-map-parser.mjs";

const MODULE_EXTENSIONS = [
	".mjs",
	".js",
	".cjs",
	".ts",
	".mts",
	".cts",
	".jsx",
	".tsx",
];

const ASSIGNMENT_OPERATORS = new Set([
	ts.SyntaxKind.EqualsToken,
	ts.SyntaxKind.PlusEqualsToken,
	ts.SyntaxKind.MinusEqualsToken,
	ts.SyntaxKind.AsteriskEqualsToken,
	ts.SyntaxKind.AsteriskAsteriskEqualsToken,
	ts.SyntaxKind.SlashEqualsToken,
	ts.SyntaxKind.PercentEqualsToken,
	ts.SyntaxKind.AmpersandEqualsToken,
	ts.SyntaxKind.BarEqualsToken,
	ts.SyntaxKind.CaretEqualsToken,
	ts.SyntaxKind.LessThanLessThanEqualsToken,
	ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
	ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
	ts.SyntaxKind.AmpersandAmpersandEqualsToken,
	ts.SyntaxKind.BarBarEqualsToken,
	ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

export function memberOperation(node) {
	const parent = node.parent;
	if (ts.isCallExpression(parent) && parent.expression === node) return "call";
	if (
		ts.isBinaryExpression(parent) &&
		parent.left === node &&
		ASSIGNMENT_OPERATORS.has(parent.operatorToken.kind)
	)
		return "write";
	if (
		(ts.isPrefixUnaryExpression(parent) ||
			ts.isPostfixUnaryExpression(parent)) &&
		parent.operand === node &&
		(parent.operator === ts.SyntaxKind.PlusPlusToken ||
			parent.operator === ts.SyntaxKind.MinusMinusToken)
	)
		return "write";
	return "read";
}

export function moduleCandidates(specifier, importer, root) {
	const normalized = specifier.replaceAll("\\", "/");
	const importerDirectory = path.posix.dirname(normalizePath(importer));
	const candidates = [];
	if (/^[A-Za-z]:\//.test(normalized) || path.posix.isAbsolute(normalized)) {
		candidates.push(
			normalizePath(path.relative(root, path.resolve(normalized))),
		);
	} else if (normalized.startsWith("./") || normalized.startsWith("../")) {
		candidates.push(
			path.posix.normalize(path.posix.join(importerDirectory, normalized)),
		);
	} else {
		candidates.push(normalized);
	}
	const result = [];
	for (const candidate of candidates) {
		result.push(candidate);
		for (const extension of MODULE_EXTENSIONS)
			result.push(`${candidate}${extension}`);
		for (const extension of MODULE_EXTENSIONS)
			result.push(path.posix.join(candidate, `index${extension}`));
	}
	return result;
}

export function readModuleSpecifiers(file, source) {
	const normalizedFile = normalizePath(file);
	const sourceFile = createSourceFile(normalizedFile, source);
	const specifiers = [];
	const add = (specifier) => {
		if (!specifiers.includes(specifier)) specifiers.push(specifier);
	};
	for (const statement of sourceFile.statements) {
		if (
			(ts.isImportDeclaration(statement) ||
				ts.isExportDeclaration(statement)) &&
			statement.moduleSpecifier &&
			ts.isStringLiteral(statement.moduleSpecifier)
		)
			add(statement.moduleSpecifier.text);
	}
	visit(sourceFile, (node) => {
		if (
			ts.isCallExpression(node) &&
			node.expression.kind === ts.SyntaxKind.ImportKeyword &&
			node.arguments.length === 1 &&
			ts.isStringLiteral(node.arguments[0])
		)
			add(node.arguments[0].text);
	});
	return specifiers;
}

export function resolveModuleFile(specifier, importer, root, sourceSet) {
	return (
		moduleCandidates(specifier, importer, root).find((candidate) =>
			sourceSet.has(candidate),
		) ?? null
	);
}

function directExportsByFile(parsedByFile) {
	const byFile = new Map();
	for (const file of parsedByFile) {
		const exports = new Map();
		for (const entry of file.callables) {
			if (entry.ownerName !== null) continue;
			for (const exportName of entry.exportNames)
				exports.set(exportName, entry);
		}
		byFile.set(file.path, exports);
	}
	return byFile;
}

function importBindings(sourceFile) {
	const bindings = new Map();
	for (const statement of sourceFile.statements) {
		if (
			!ts.isImportDeclaration(statement) ||
			!ts.isStringLiteral(statement.moduleSpecifier) ||
			statement.importClause?.isTypeOnly
		)
			continue;
		const specifier = statement.moduleSpecifier.text;
		const clause = statement.importClause;
		if (clause?.name)
			bindings.set(clause.name.text, {
				specifier,
				imported: "default",
			});
		const named = clause?.namedBindings;
		if (named && ts.isNamespaceImport(named))
			bindings.set(named.name.text, { specifier, imported: "*" });
		if (!named || !ts.isNamedImports(named)) continue;
		for (const element of named.elements) {
			if (element.isTypeOnly) continue;
			bindings.set(element.name.text, {
				specifier,
				imported: (element.propertyName ?? element.name).text,
			});
		}
	}
	return bindings;
}

function addReExports(statement, imports, entries) {
	if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) return;
	if (!statement.exportClause) {
		if (ts.isStringLiteral(statement.moduleSpecifier))
			entries.push({
				specifier: statement.moduleSpecifier.text,
				star: true,
			});
		return;
	}
	if (!ts.isNamedExports(statement.exportClause)) return;
	for (const specifier of statement.exportClause.elements) {
		if (specifier.isTypeOnly) continue;
		const local = (specifier.propertyName ?? specifier.name).text;
		const imported = statement.moduleSpecifier
			? { specifier: statement.moduleSpecifier.text, imported: local }
			: imports.get(local);
		if (imported) entries.push({ ...imported, exported: specifier.name.text });
	}
}

function reExportsByFile(sourcesByFile) {
	const byFile = new Map();
	for (const [file, source] of sourcesByFile) {
		const sourceFile = createSourceFile(file, source);
		const entries = [];
		const imports = importBindings(sourceFile);
		for (const statement of sourceFile.statements)
			addReExports(statement, imports, entries);
		byFile.set(file, entries);
	}
	return byFile;
}

export function resolveExportsByFile({
	root,
	files,
	parsedByFile,
	sourcesByFile,
}) {
	const sourceSet = new Set(files);
	const direct = directExportsByFile(parsedByFile);
	const reExports = reExportsByFile(sourcesByFile);
	const resolved = new Map();
	const active = new Set();
	const resolve = (file) => {
		if (resolved.has(file)) return resolved.get(file);
		if (active.has(file)) return direct.get(file) ?? new Map();
		active.add(file);
		const exports = new Map(direct.get(file) ?? []);
		for (const reExport of reExports.get(file) ?? []) {
			const targetFile = moduleCandidates(reExport.specifier, file, root).find(
				(candidate) => sourceSet.has(candidate),
			);
			if (!targetFile) continue;
			const targetExports = resolve(targetFile);
			if (reExport.star) {
				for (const [name, entry] of targetExports)
					if (name !== "default") exports.set(name, entry);
				continue;
			}
			const entry = targetExports.get(reExport.imported);
			if (entry) exports.set(reExport.exported, entry);
		}
		active.delete(file);
		resolved.set(file, exports);
		return exports;
	};
	for (const file of files) resolve(file);
	return resolved;
}

export function classEntryFromExpression(
	expression,
	importsByLocal,
	namespaceImports,
) {
	const unwrapped = unwrapParenthesized(expression);
	if (ts.isIdentifier(unwrapped)) {
		const target = importsByLocal.get(unwrapped.text) ?? null;
		return target?.kind.includes("class") ? target : null;
	}
	if (
		ts.isPropertyAccessExpression(unwrapped) &&
		ts.isIdentifier(unwrapped.expression)
	) {
		const target = namespaceImports
			.get(unwrapped.expression.text)
			?.get(propertyNameText(unwrapped.name, unwrapped.getSourceFile()));
		return target?.kind.includes("class") ? target : null;
	}
	return null;
}

export function visit(node, callback) {
	callback(node);
	ts.forEachChild(node, (child) => visit(child, callback));
}

function dynamicModuleTarget(node, testPath, root, sourceSet, exportsByFile) {
	const expression = unwrapParenthesized(node);
	if (ts.isAwaitExpression(expression))
		return dynamicModuleTarget(
			expression.expression,
			testPath,
			root,
			sourceSet,
			exportsByFile,
		);
	if (
		!ts.isCallExpression(expression) ||
		expression.expression.kind !== ts.SyntaxKind.ImportKeyword ||
		expression.arguments.length !== 1 ||
		!ts.isStringLiteral(expression.arguments[0])
	)
		return null;
	const targetFile = moduleCandidates(
		expression.arguments[0].text,
		testPath,
		root,
	).find((candidate) => sourceSet.has(candidate));
	if (!targetFile) return null;
	return {
		file: targetFile,
		exports: exportsByFile.get(targetFile) ?? new Map(),
	};
}

function dynamicExportTarget(node, testPath, root, sourceSet, exportsByFile) {
	const expression = unwrapParenthesized(node);
	if (ts.isPropertyAccessExpression(expression)) {
		const owner = dynamicModuleTarget(
			expression.expression,
			testPath,
			root,
			sourceSet,
			exportsByFile,
		);
		if (!owner) return null;
		return (
			owner.exports.get(
				propertyNameText(expression.name, expression.getSourceFile()),
			) ?? null
		);
	}
	return null;
}

function addObjectImportBindings(bindings, exports, importsByLocal) {
	for (const element of bindings.elements) {
		if (!ts.isIdentifier(element.name)) continue;
		const imported = (element.propertyName ?? element.name).text;
		const target = exports.get(imported);
		if (target) importsByLocal.set(element.name.text, target);
	}
}

function addDynamicImportBindings(
	sourceFile,
	testPath,
	root,
	sourceSet,
	exportsByFile,
	importsByLocal,
	namespaceImports,
) {
	visit(sourceFile, (node) => {
		if (!ts.isVariableDeclaration(node) || !node.initializer) return;
		const moduleTarget = dynamicModuleTarget(
			node.initializer,
			testPath,
			root,
			sourceSet,
			exportsByFile,
		);
		if (moduleTarget) {
			if (ts.isIdentifier(node.name))
				namespaceImports.set(node.name.text, moduleTarget.exports);
			else if (ts.isObjectBindingPattern(node.name))
				addObjectImportBindings(
					node.name,
					moduleTarget.exports,
					importsByLocal,
				);
			return;
		}
		if (!ts.isIdentifier(node.name)) return;
		const target = dynamicExportTarget(
			node.initializer,
			testPath,
			root,
			sourceSet,
			exportsByFile,
		);
		if (target) importsByLocal.set(node.name.text, target);
	});
}

function addStaticImportBindings(
	sourceFile,
	testPath,
	root,
	sourceSet,
	exportsByFile,
	importsByLocal,
	namespaceImports,
) {
	for (const [local, { specifier, imported }] of importBindings(sourceFile)) {
		const targetFile = moduleCandidates(specifier, testPath, root).find(
			(candidate) => sourceSet.has(candidate),
		);
		if (!targetFile) continue;
		const targetExports = exportsByFile.get(targetFile) ?? new Map();
		if (imported === "*") {
			namespaceImports.set(local, targetExports);
			continue;
		}
		const target = targetExports.get(imported);
		if (target) importsByLocal.set(local, target);
	}
}

export function resolveTestImports({
	sourceFile,
	testPath,
	root,
	sourceSet,
	exportsByFile,
}) {
	const importsByLocal = new Map();
	const namespaceImports = new Map();
	addStaticImportBindings(
		sourceFile,
		testPath,
		root,
		sourceSet,
		exportsByFile,
		importsByLocal,
		namespaceImports,
	);
	addDynamicImportBindings(
		sourceFile,
		testPath,
		root,
		sourceSet,
		exportsByFile,
		importsByLocal,
		namespaceImports,
	);
	return { importsByLocal, namespaceImports };
}

export function memberAccessTarget(access, context) {
	const direct = dynamicExportTarget(
		access.expression,
		context.testPath,
		context.root,
		context.sourceSet,
		context.exportsByFile,
	);
	if (direct) return { entry: direct };
	const name = propertyNameText(access.name, context.sourceFile);
	if (ts.isIdentifier(access.expression)) {
		const namespaceTarget = context.namespaceImports
			.get(access.expression.text)
			?.get(name);
		if (namespaceTarget) return { entry: namespaceTarget };
		const imported = context.importsByLocal.get(access.expression.text) ?? null;
		if (imported?.kind.includes("class"))
			return { owner: imported, name, staticMember: true };
		const instance = context.staticContext.instances.get(
			access.expression.text,
		);
		if (instance) return { owner: instance, name, staticMember: false };
	}
	if (ts.isNewExpression(access.expression)) {
		const owner = classEntryFromExpression(
			access.expression.expression,
			context.importsByLocal,
			context.namespaceImports,
		);
		if (owner) return { owner, name, staticMember: false };
	}
	return null;
}
