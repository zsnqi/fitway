import ts from "typescript";
import {
	createSourceFile,
	normalizePath,
	unwrapParenthesized,
} from "./tooling-map-parser.mjs";

function callChain(node) {
	let current = unwrapParenthesized(node);
	const qualifiers = [];
	while (ts.isPropertyAccessExpression(current)) {
		qualifiers.unshift(current.name.text);
		current = unwrapParenthesized(current.expression);
	}
	if (!ts.isIdentifier(current)) return null;
	return { root: current.text, qualifiers };
}

function testFactory(node) {
	const expression = unwrapParenthesized(node);
	if (!ts.isCallExpression(expression)) return null;
	const chain = callChain(expression.expression);
	if (!chain || !["it", "test"].includes(chain.root)) return null;
	if (!chain.qualifiers.includes("each")) return null;
	return expression;
}

function describeFactory(node) {
	const expression = unwrapParenthesized(node);
	if (!ts.isCallExpression(expression)) return null;
	const chain = callChain(expression.expression);
	if (chain?.root !== "describe" || !chain.qualifiers.includes("each"))
		return null;
	return expression;
}

function callKind(node) {
	const direct = callChain(node.expression);
	if (direct && ["describe", "it", "test"].includes(direct.root))
		return {
			...direct,
			sourceNode: node,
		};
	const each = testFactory(node.expression) ?? describeFactory(node.expression);
	if (!each) return null;
	const chain = callChain(each.expression);
	return {
		...chain,
		sourceNode: each,
	};
}

// A table title (`it.each`, `test.each`, `describe.each`) is expanded by the runner for each row.
function titleMatcher(expression, sourceFile, each = false) {
	if (!expression) return { kind: "dynamic", source: "" };
	const value = unwrapParenthesized(expression);
	if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value))
		return { kind: "exact", value: value.text, each };
	if (ts.isTemplateExpression(value)) {
		const parts = [value.head.text];
		for (const span of value.templateSpans)
			parts.push(`\u0000${span.literal.text}`);
		return {
			kind: "pattern",
			value: parts.join(""),
			source: value.getText(sourceFile),
			each,
		};
	}
	return { kind: "dynamic", source: value.getText(sourceFile) };
}

function isFunctionLike(node) {
	return (
		ts.isArrowFunction(node) ||
		ts.isFunctionExpression(node) ||
		node.kind === ts.SyntaxKind.FunctionExpression
	);
}

function callbackBody(node) {
	const call = callKind(node);
	if (call?.root !== "describe") return null;
	for (let index = node.arguments.length - 1; index >= 1; index -= 1) {
		const candidate = unwrapParenthesized(node.arguments[index]);
		if (!isFunctionLike(candidate)) continue;
		return candidate.body;
	}
	return null;
}

function sourceRange(sourceFile, file, start, end) {
	const startLine = sourceFile.getLineAndCharacterOfPosition(start).line + 1;
	const endLine =
		sourceFile.getLineAndCharacterOfPosition(Math.max(start, end - 1)).line + 1;
	return {
		file,
		start,
		end,
		lineStart: startLine,
		lineEnd: endLine,
	};
}

function fullName(ancestors, title) {
	const names = [
		...ancestors.map((item) =>
			item.kind === "exact" ? item.value : item.source,
		),
		title.kind === "exact" ? title.value : title.source,
	];
	return names.filter(Boolean).join(" > ");
}

function collectTests(file, source) {
	const normalized = normalizePath(file);
	const sourceFile = createSourceFile(normalized, source);
	const tests = [];
	const testRanges = [];
	const visit = (node, ancestors) => {
		if (ts.isCallExpression(node)) {
			const kind = callKind(node);
			if (kind?.root === "describe") {
				const description = titleMatcher(
					node.arguments[0],
					sourceFile,
					kind.qualifiers.includes("each"),
				);
				const nextAncestors =
					description.kind === "dynamic"
						? ancestors
						: [...ancestors, description];
				const body = callbackBody(node);
				if (ts.isBlock(body))
					for (const statement of body.statements)
						visit(statement, nextAncestors);
				else if (body) visit(body, nextAncestors);
				return;
			}
			if (kind?.root === "it" || kind?.root === "test") {
				const title = titleMatcher(
					node.arguments[0],
					sourceFile,
					kind.qualifiers.includes("each"),
				);
				const sourceNode = kind.sourceNode;
				const nodeStart = sourceNode.getStart(sourceFile);
				const range = sourceRange(sourceFile, normalized, nodeStart, node.end);
				const statementStart = ts.isExpressionStatement(node.parent)
					? node.parent.getStart(sourceFile)
					: nodeStart;
				const statementEnd = ts.isExpressionStatement(node.parent)
					? node.parent.end
					: node.end;
				tests.push({
					...range,
					start: statementStart,
					end: statementEnd,
					lineStart:
						sourceFile.getLineAndCharacterOfPosition(statementStart).line + 1,
					lineEnd:
						sourceFile.getLineAndCharacterOfPosition(
							Math.max(statementStart, statementEnd - 1),
						).line + 1,
					title,
					ancestors,
					fullName: fullName(ancestors, title),
					callSource: sourceFile.text.slice(nodeStart, node.end),
					qualifiedName: [kind.root, ...kind.qualifiers].join("."),
					skipped: kind.qualifiers.some((item) =>
						["skip", "todo"].includes(item),
					),
					each: kind.qualifiers.includes("each"),
				});
				testRanges.push([statementStart, statementEnd]);
				return;
			}
		}
		ts.forEachChild(node, (child) => visit(child, ancestors));
	};
	for (const statement of sourceFile.statements) visit(statement, []);
	return { sourceFile, tests, testRanges };
}

function removeComments(source) {
	const scanner = ts.createScanner(
		ts.ScriptTarget.Latest,
		false,
		ts.LanguageVariant.Standard,
		source,
	);
	const ranges = [];
	for (
		let token = scanner.scan();
		token !== ts.SyntaxKind.EndOfFileToken;
		token = scanner.scan()
	) {
		if (
			token === ts.SyntaxKind.SingleLineCommentTrivia ||
			token === ts.SyntaxKind.MultiLineCommentTrivia
		)
			ranges.push([scanner.getTokenPos(), scanner.getTextPos()]);
	}
	return ranges;
}

function skeleton(sourceFile, source, testRanges) {
	const ranges = [
		...sourceFile.statements
			.filter(ts.isImportDeclaration)
			.map((node) => [node.getStart(sourceFile), node.end]),
		...testRanges,
		...removeComments(source),
	];
	ranges.sort((left, right) => right[0] - left[0]);
	let result = source;
	for (const [start, end] of ranges)
		result = `${result.slice(0, start)}${" ".repeat(end - start)}${result.slice(end)}`;
	return result.replace(/\s+/g, " ").trim();
}

// Vitest's formatTitle (@vitest/runner): `%#` and `%$` are the row's index; `%s`, `%d`, `%i`, `%f`, `%j`,
// `%o`, `%O` and `%c` a formatted value; `%%` a percent sign; `$name`, `$a.b` and `$0` a value of the row.
const TABLE_PLACEHOLDER = /%[sdjifoOc#$%]|\$[$\w.]+/g;

function literalRegex(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function titlePartRegex(text, each) {
	if (!each) return literalRegex(text);
	let result = "";
	let last = 0;
	for (const match of text.matchAll(TABLE_PLACEHOLDER)) {
		result += literalRegex(text.slice(last, match.index));
		result += match[0] === "%%" ? "%{1,2}" : "[\\s\\S]*";
		last = match.index + match[0].length;
	}
	return result + literalRegex(text.slice(last));
}

function matcherRegex(matcher) {
	if (matcher.kind === "exact")
		return new RegExp(`^${titlePartRegex(matcher.value, matcher.each)}$`);
	if (matcher.kind === "pattern") {
		const parts = matcher.value
			.split("\u0000")
			.map((part) => titlePartRegex(part, matcher.each));
		return new RegExp(`^${parts.join("[\\s\\S]*")}$`);
	}
	return /[\s\S]*/;
}

function literalLength(matcher) {
	if (matcher.kind === "dynamic") return 0;
	const text = matcher.value.replaceAll("\u0000", "");
	return (matcher.each ? text.replace(TABLE_PLACEHOLDER, "") : text).length;
}

// When several source calls match one runner name (`doubles $input` also matches `doubles 1 to 2`), the call
// whose title fixes more literal text is the one the runner expanded.
export function titleSpecificity(test) {
	return [...test.ancestors, test.title].reduce(
		(total, matcher) => total + literalLength(matcher),
		0,
	);
}

export function testSourceMatches(test, title, ancestors = []) {
	if (test.ancestors.length !== ancestors.length) return false;
	for (let index = 0; index < ancestors.length; index += 1)
		if (!matcherRegex(test.ancestors[index]).test(ancestors[index]))
			return false;
	return matcherRegex(test.title).test(title);
}

export function parseTestSource(file, source) {
	const normalized = normalizePath(file);
	const collected = collectTests(normalized, source);
	const tests = collected.tests.map((test, index) => ({
		...test,
		occurrence: index,
	}));
	const grouped = new Map();
	for (const test of tests) {
		const group = grouped.get(test.fullName) ?? [];
		group.push(test);
		grouped.set(test.fullName, group);
	}
	for (const group of grouped.values())
		for (let index = 0; index < group.length; index += 1)
			group[index].sameNameOccurrence = index;
	return {
		file: normalized,
		tests,
		skeleton: skeleton(collected.sourceFile, source, collected.testRanges),
	};
}

export function basePathFor(resultPath, renames) {
	const normalized = normalizePath(resultPath);
	return normalizePath(renames.get(normalized) ?? normalized);
}
