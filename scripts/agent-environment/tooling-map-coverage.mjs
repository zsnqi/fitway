import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import {
	classEntryFromExpression,
	memberAccessTarget,
	resolveExportsByFile,
	resolveTestImports,
	visit,
} from "./tooling-map-imports.mjs";
import { normalizePath } from "./tooling-map-parser.mjs";

const CHILD_PROCESS_FUNCTIONS = new Set([
	"exec",
	"execFile",
	"execFileSync",
	"fork",
	"spawn",
	"spawnSync",
]);
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

function markCoverage(coverage, entry, testPath) {
	if (!entry) return;
	const key = `${entry.path}:${entry.lineStart}:${entry.kind}:${entry.name}`;
	const tests = coverage.get(key) ?? new Set();
	tests.add(testPath);
	coverage.set(key, tests);
}

function memberEntriesByOwner(entries) {
	const byOwner = new Map();
	for (const entry of entries) {
		if (entry.ownerName === null) continue;
		const key = `${entry.path}:${entry.ownerName}`;
		const members = byOwner.get(key) ?? [];
		members.push(entry);
		byOwner.set(key, members);
	}
	return { byOwner, key: (owner) => `${owner.path}:${owner.name}` };
}

function memberKinds(staticMember, operation) {
	const prefix = staticMember ? "static-" : "";
	if (operation === "call")
		return new Set([`${prefix}method`, `${prefix}property`]);
	return new Set([`${prefix}${operation === "write" ? "setter" : "getter"}`]);
}

function memberByName(
	membersByOwner,
	owner,
	memberName,
	{ staticMember, operation },
) {
	const members = membersByOwner.byOwner.get(membersByOwner.key(owner)) ?? [];
	const kinds = memberKinds(staticMember, operation);
	return members.find(
		(member) =>
			member.memberName === memberName &&
			member.memberStatic === staticMember &&
			kinds.has(member.kind),
	);
}

function resolveUrlNode(node, sourceFile, testPath) {
	if (!ts.isNewExpression(node) || node.arguments?.length !== 2) return null;
	const [specifier, base] = node.arguments;
	if (!ts.isStringLiteral(specifier)) return null;
	if (base.getText(sourceFile) !== "import.meta.url") return null;
	return path.posix.normalize(
		path.posix.join(
			path.posix.dirname(normalizePath(testPath)),
			specifier.text,
		),
	);
}

function isProcessCwdCall(node) {
	return (
		ts.isCallExpression(node) &&
		node.arguments.length === 0 &&
		ts.isPropertyAccessExpression(node.expression) &&
		ts.isIdentifier(node.expression.expression) &&
		node.expression.expression.text === "process" &&
		node.expression.name.text === "cwd"
	);
}

function resolveStringValues(node, context) {
	const { sourceFile, constants, seen } = context;
	if (!node) return [];
	if (ts.isParenthesizedExpression(node))
		return resolveStringValues(node.expression, context);
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
		return [node.text];
	if (ts.isTemplateExpression(node)) {
		let value = node.head.text;
		for (const span of node.templateSpans) {
			const values = resolveStringValues(span.expression, context);
			if (values.length !== 1) return [];
			value += values[0] + span.literal.text;
		}
		return [value];
	}
	if (ts.isIdentifier(node)) {
		if (seen.has(node.text)) return [];
		const initializer = constants.get(node.text);
		if (!initializer) return [];
		return resolveStringValues(initializer, {
			...context,
			seen: new Set([...seen, node.text]),
		});
	}
	if (ts.isCallExpression(node)) {
		if (isProcessCwdCall(node)) return ["."];
		if (
			ts.isPropertyAccessExpression(node.expression) &&
			(node.expression.name.text === "join" ||
				node.expression.name.text === "resolve")
		) {
			const values = [];
			for (const argument of node.arguments) {
				const resolved = resolveStringValues(argument, context);
				if (resolved.length !== 1) return [];
				values.push(resolved[0]);
			}
			if (values.length === 0) return [];
			return [
				node.expression.name.text === "resolve"
					? path.posix.resolve(...values)
					: path.posix.join(...values),
			];
		}
		if (
			node.expression.getText(sourceFile) === "fileURLToPath" &&
			node.arguments.length === 1
		) {
			const resolved = resolveUrlNode(
				node.arguments[0],
				sourceFile,
				context.testPath,
			);
			return resolved ? [resolved] : [];
		}
	}
	if (ts.isNewExpression(node)) {
		const resolved = resolveUrlNode(node, sourceFile, context.testPath);
		return resolved ? [resolved] : [];
	}
	return [];
}

function resolveStringArray(node, context) {
	if (ts.isArrayLiteralExpression(node)) {
		const values = [];
		for (const element of node.elements) {
			if (ts.isSpreadElement(element)) continue;
			const resolved = resolveStringValues(element, context);
			if (resolved.length === 1) values.push(resolved[0]);
		}
		return values;
	}
	if (ts.isIdentifier(node)) {
		const initializer = context.constants.get(node.text);
		if (!initializer) return [];
		return ts.isArrayLiteralExpression(initializer)
			? resolveStringArray(initializer, context)
			: resolveStringValues(initializer, context);
	}
	return [];
}

function repositoryRelative(value, root, testPath) {
	const normalized = normalizePath(value);
	const rootNormalized = normalizePath(path.resolve(root));
	const rootWithoutDrive = rootNormalized.replace(/^[A-Za-z]:/, "");
	if (normalized.startsWith(`${rootWithoutDrive}/`))
		return normalized.slice(rootWithoutDrive.length + 1);
	if (/^[A-Za-z]:\//.test(normalized) || normalized.startsWith("/"))
		return normalizePath(path.relative(root, path.resolve(normalized)));
	if (normalized.startsWith("./") || normalized.startsWith("../"))
		return path.posix.normalize(
			path.posix.join(path.posix.dirname(normalizePath(testPath)), normalized),
		);
	return normalized;
}

function buildStaticContext(
	sourceFile,
	importsByLocal,
	namespaceImports,
	testPath,
) {
	const constants = new Map();
	const instances = new Map();
	visit(sourceFile, (node) => {
		if (
			!ts.isVariableDeclaration(node) ||
			!ts.isIdentifier(node.name) ||
			!node.initializer
		)
			return;
		if (ts.isNewExpression(node.initializer)) {
			const target = classEntryFromExpression(
				node.initializer.expression,
				importsByLocal,
				namespaceImports,
			);
			if (target) instances.set(node.name.text, target);
			return;
		}
		const values = resolveStringValues(node.initializer, {
			sourceFile,
			constants,
			seen: new Set(),
			testPath,
		});
		if (values.length > 0) constants.set(node.name.text, node.initializer);
	});
	return { constants, instances };
}

function childProcessImports(sourceFile) {
	const names = new Set();
	for (const statement of sourceFile.statements) {
		if (
			!ts.isImportDeclaration(statement) ||
			!ts.isStringLiteral(statement.moduleSpecifier) ||
			statement.moduleSpecifier.text !== "node:child_process"
		)
			continue;
		const bindings = statement.importClause?.namedBindings;
		if (!bindings || !ts.isNamedImports(bindings)) continue;
		for (const element of bindings.elements) {
			if (CHILD_PROCESS_FUNCTIONS.has(element.name.text))
				names.add(element.name.text);
		}
	}
	return names;
}

function commandCoverage(sourceFile, root, testPath, sourceFiles, constants) {
	const result = new Set();
	const childProcess = childProcessImports(sourceFile);
	if (childProcess.size === 0) return result;
	visit(sourceFile, (node) => {
		if (
			!ts.isCallExpression(node) ||
			!ts.isIdentifier(node.expression) ||
			!childProcess.has(node.expression.text)
		)
			return;
		for (const argument of node.arguments) {
			if (!ts.isArrayLiteralExpression(argument) && !ts.isIdentifier(argument))
				continue;
			const candidates = resolveStringArray(argument, {
				sourceFile,
				constants,
				seen: new Set(),
				testPath,
			});
			for (const candidate of candidates) {
				const relative = repositoryRelative(candidate, root, testPath);
				if (sourceFiles.has(relative)) result.add(relative);
			}
		}
	});
	return result;
}

function memberOperation(node) {
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

function recordMemberCoverage(node, context) {
	const target = memberAccessTarget(node, context);
	if (!target) return;
	const operation = memberOperation(node);
	if (target.entry) {
		if (operation === "call")
			markCoverage(context.coverage, target.entry, context.testPath);
		return;
	}
	markCoverage(
		context.coverage,
		memberByName(context.membersByOwner, target.owner, target.name, {
			staticMember: target.staticMember,
			operation,
		}),
		context.testPath,
	);
}

function recordNodeCoverage(node, context) {
	if (ts.isNewExpression(node)) {
		markCoverage(
			context.coverage,
			classEntryFromExpression(
				node.expression,
				context.importsByLocal,
				context.namespaceImports,
			),
			context.testPath,
		);
	}
	if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
		markCoverage(
			context.coverage,
			context.importsByLocal.get(node.expression.text) ?? null,
			context.testPath,
		);
	}
	if (ts.isPropertyAccessExpression(node)) recordMemberCoverage(node, context);
}

async function analyzeTestFile({
	root,
	testPath,
	sourceSet,
	exportsByFile,
	membersByOwner,
	coverage,
	commandCoverageByFile,
}) {
	const text = await readFile(path.join(root, testPath), "utf8");
	const sourceFile = ts.createSourceFile(
		testPath,
		text,
		ts.ScriptTarget.Latest,
		true,
		testPath.endsWith(".ts") || testPath.endsWith(".tsx")
			? ts.ScriptKind.TS
			: ts.ScriptKind.JS,
	);
	const { importsByLocal, namespaceImports } = resolveTestImports({
		sourceFile,
		testPath,
		root,
		sourceSet,
		exportsByFile,
	});
	const staticContext = buildStaticContext(
		sourceFile,
		importsByLocal,
		namespaceImports,
		testPath,
	);
	for (const source of commandCoverage(
		sourceFile,
		root,
		testPath,
		sourceSet,
		staticContext.constants,
	)) {
		const tests = commandCoverageByFile.get(source) ?? new Set();
		tests.add(testPath);
		commandCoverageByFile.set(source, tests);
	}
	const context = {
		root,
		testPath,
		sourceFile,
		sourceSet,
		exportsByFile,
		importsByLocal,
		namespaceImports,
		staticContext,
		membersByOwner,
		coverage,
	};
	visit(sourceFile, (node) => recordNodeCoverage(node, context));
}

export async function analyzeCoverage({
	root,
	files,
	testFiles,
	parsedByFile,
	sourcesByFile,
}) {
	const sourceSet = new Set(files);
	const exportsByFile = resolveExportsByFile({
		root,
		files,
		parsedByFile,
		sourcesByFile,
	});
	const membersByOwner = memberEntriesByOwner(
		parsedByFile.flatMap((file) => file.callables),
	);
	const coverage = new Map();
	const commandCoverageByFile = new Map();
	for (const testPath of testFiles) {
		await analyzeTestFile({
			root,
			testPath,
			sourceSet,
			exportsByFile,
			membersByOwner,
			coverage,
			commandCoverageByFile,
		});
	}
	return { coverage, commandCoverageByFile };
}
