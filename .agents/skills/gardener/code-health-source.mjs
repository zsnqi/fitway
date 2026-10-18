import path from "node:path";
import ts from "typescript";

export const SCRIPT_EXTENSIONS = new Set([
	".js",
	".mjs",
	".cjs",
	".ts",
	".tsx",
]);
const SOURCE_EXTENSIONS = new Set([...SCRIPT_EXTENSIONS, ".css", ".html"]);
const DESCRIBE_CHAIN_MEMBERS = new Set([
	"each",
	"sequential",
	"concurrent",
	"skip",
	"only",
	"todo",
	"skipIf",
	"runIf",
]);
const TEST_CHAIN_MEMBERS = new Set([...DESCRIBE_CHAIN_MEMBERS, "fails"]);
const EXPECT_CHAIN_MEMBERS = new Set(["soft", "poll"]);

export function isSourceFile(file) {
	return SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase());
}

export function isTestFile(file) {
	const ext = path.extname(file).toLowerCase();
	return (
		SCRIPT_EXTENSIONS.has(ext) &&
		/\.(?:test|spec)$/i.test(path.basename(file, ext))
	);
}

function blank(text) {
	return text.replace(/[^\r\n]/g, " ");
}

function blankSpans(text, spans) {
	let masked = "";
	let cursor = 0;
	for (const [start, end] of spans) {
		masked += text.slice(cursor, start) + blank(text.slice(start, end));
		cursor = end;
	}
	return masked + text.slice(cursor);
}

function literal(node) {
	return (
		ts.isStringLiteral(node) ||
		ts.isNoSubstitutionTemplateLiteral(node) ||
		node.kind === ts.SyntaxKind.RegularExpressionLiteral
	);
}

function visitCode(node, visit) {
	if (literal(node)) return;
	visit(node);
	if (ts.isTemplateExpression(node)) {
		for (const span of node.templateSpans) visitCode(span.expression, visit);
		return;
	}
	ts.forEachChild(node, (child) => visitCode(child, visit));
}

function bindingResolver(source) {
	const host = {
		getSourceFile: (name) => (name === source.fileName ? source : undefined),
		getDefaultLibFileName: () => "lib.d.ts",
		writeFile: () => {},
		getCurrentDirectory: () => "",
		getCanonicalFileName: (name) => name,
		useCaseSensitiveFileNames: () => true,
		getNewLine: () => "\n",
		fileExists: (name) => name === source.fileName,
		readFile: () => undefined,
	};
	return ts
		.createProgram(
			[source.fileName],
			{ noLib: true, noResolve: true, allowJs: true, types: [] },
			host,
		)
		.getTypeChecker();
}

function importedBindings(source) {
	const bindings = new Map();
	let checker;
	for (const statement of source.statements) {
		if (
			!ts.isImportDeclaration(statement) ||
			statement.importClause?.isTypeOnly ||
			!ts.isStringLiteral(statement.moduleSpecifier) ||
			!["vitest", "node:test"].includes(statement.moduleSpecifier.text)
		)
			continue;
		const named = statement.importClause?.namedBindings;
		if (!named || !ts.isNamedImports(named)) continue;
		for (const element of named.elements) {
			if (element.isTypeOnly) continue;
			checker ??= bindingResolver(source);
			const symbol = checker.getSymbolAtLocation(element.name);
			if (!symbol) continue;
			bindings.set(symbol, {
				module: statement.moduleSpecifier.text,
				name: (element.propertyName ?? element.name).text,
			});
		}
	}
	return { bindings, checker };
}

function scanLongFunctions(source, text, offset, file, add) {
	const testFile = isTestFile(file);
	const imports = testFile ? importedBindings(source) : null;
	const isDescribeCallee = (expression) => {
		const node = unwrap(expression);
		if (ts.isIdentifier(node)) {
			const binding = imports?.bindings.get(
				imports.checker?.getSymbolAtLocation(node),
			);
			return binding?.module === "vitest" && binding.name === "describe";
		}
		if (ts.isPropertyAccessExpression(node))
			return (
				DESCRIBE_CHAIN_MEMBERS.has(node.name.text) &&
				isDescribeCallee(node.expression)
			);
		if (ts.isCallExpression(node)) return isDescribeCallee(node.expression);
		return false;
	};
	const isDescribeCallback = (node) => {
		let argument = node;
		while (ts.isParenthesizedExpression(argument.parent))
			argument = argument.parent;
		const call = argument.parent;
		if (!call || !ts.isCallExpression(call)) return false;
		return (
			call.arguments.at(-1) === argument && isDescribeCallee(call.expression)
		);
	};
	visitCode(source, (node) => {
		if (!ts.isFunctionLike(node) || !node.body) return;
		if (isDescribeCallback(node)) return;
		const startLine = text
			.slice(0, node.getStart(source))
			.split(/\r?\n/).length;
		const endLine = text.slice(0, node.body.end).split(/\r?\n/).length;
		const lineCount = endLine - startLine + 1;
		if (lineCount > 80) {
			add(
				"longFunctions",
				offset + node.getStart(source),
				`${lineCount} lines`,
			);
			if (!testFile)
				add(
					"longFunctionLines",
					offset + node.getStart(source),
					`${lineCount} lines`,
					lineCount,
				);
		}
	});
}

function scanEmptyBlocks(source, text, offset, add) {
	visitCode(source, (node) => {
		if (ts.isBlock(node) && ts.isConstructorDeclaration(node.parent)) return;
		const emptyBlock = ts.isBlock(node)
			? node.statements.length === 0
			: ts.isCaseBlock(node) && node.clauses.length === 0;
		if (!emptyBlock) return;
		const contents = text.slice(node.getStart(source) + 1, node.end - 1);
		if (contents.trim()) return;
		add("emptyBlocks", offset + node.getStart(source), "empty block");
	});
}

function callNamed(node, name) {
	return (
		ts.isCallExpression(node) &&
		((ts.isIdentifier(node.expression) && node.expression.text === name) ||
			(ts.isPropertyAccessExpression(node.expression) &&
				node.expression.name.text === name))
	);
}

function unwrap(node) {
	let expression = node;
	while (ts.isParenthesizedExpression(expression))
		expression = expression.expression;
	return expression;
}

function callChain(expression) {
	const members = [];
	const conditions = new Map();
	let node = unwrap(expression);
	while (ts.isPropertyAccessExpression(node) || ts.isCallExpression(node)) {
		if (ts.isPropertyAccessExpression(node)) {
			members.unshift(node.name.text);
			node = unwrap(node.expression);
			continue;
		}
		const callee = unwrap(node.expression);
		if (ts.isPropertyAccessExpression(callee)) {
			members.unshift(callee.name.text);
			conditions.set(callee.name.text, node.arguments);
			node = unwrap(callee.expression);
		} else {
			node = callee;
		}
	}
	return { conditions, members, root: node };
}

function chainedCall(node) {
	const parent = node.parent;
	return ts.isCallExpression(parent) && unwrap(parent.expression) === node;
}

function literalBoolean(node) {
	const value = unwrap(node);
	if (value.kind === ts.SyntaxKind.TrueKeyword) return true;
	if (value.kind === ts.SyntaxKind.FalseKeyword) return false;
	return null;
}

function importedAs(imports, node, module, name) {
	if (!ts.isIdentifier(node)) return false;
	const binding = imports?.bindings.get(
		imports.checker?.getSymbolAtLocation(node),
	);
	return binding?.module === module && binding.name === name;
}

function scanTestCalls(source, offset, file, add) {
	if (!isTestFile(file)) return;
	const imports = importedBindings(source);
	visitCode(source, (node) => {
		if (!ts.isCallExpression(node)) return;
		const chain = callChain(node.expression);
		if (
			!chainedCall(node) &&
			(importedAs(imports, chain.root, "vitest", "it") ||
				importedAs(imports, chain.root, "node:test", "it") ||
				importedAs(imports, chain.root, "vitest", "test") ||
				importedAs(imports, chain.root, "node:test", "test"))
		) {
			const skipped =
				chain.members.some(
					(member) => member === "skip" || member === "todo",
				) ||
				chain.conditions
					.get("skipIf")
					?.some((argument) => literalBoolean(argument) === true) ||
				chain.conditions
					.get("runIf")
					?.some((argument) => literalBoolean(argument) === false);
			if (
				!skipped &&
				chain.members.every((member) => TEST_CHAIN_MEMBERS.has(member))
			)
				add("testCases", offset + node.getStart(source), "test case");
		}
		if (importedAs(imports, chain.root, "vitest", "expect")) {
			const direct = ts.isIdentifier(unwrap(node.expression));
			const helper =
				ts.isPropertyAccessExpression(unwrap(node.expression)) &&
				EXPECT_CHAIN_MEMBERS.has(unwrap(node.expression).name.text);
			if (direct || helper)
				add("expectCalls", offset + node.getStart(source), "expect call");
		}
	});
}

function cast(node) {
	return ts.isAsExpression(node) || ts.isTypeAssertionExpression(node);
}

function scanComments(source, text, offset, isTypeScript, add, addComment) {
	const spans = [];
	const findLiterals = (node) => {
		if (ts.isTemplateExpression(node)) {
			spans.push([node.head.getStart(source), node.head.end]);
			for (const span of node.templateSpans) {
				findLiterals(span.expression);
				spans.push([span.literal.getStart(source), span.literal.end]);
			}
			return;
		}
		if (literal(node) || ts.isJsxText(node)) {
			spans.push([node.getStart(source), node.end]);
			return;
		}
		ts.forEachChild(node, findLiterals);
	};
	findLiterals(source);
	// Mask literal and JSX text before scanning trivia; template substitutions stay visible.
	const masked = blankSpans(
		text,
		spans.sort((a, b) => a[0] - b[0]),
	);
	const scanner = ts.createScanner(
		ts.ScriptTarget.Latest,
		false,
		ts.LanguageVariant.Standard,
		masked,
	);
	let token = scanner.scan();
	while (token !== ts.SyntaxKind.EndOfFileToken) {
		if (
			token === ts.SyntaxKind.SingleLineCommentTrivia ||
			token === ts.SyntaxKind.MultiLineCommentTrivia
		) {
			const start = scanner.getTokenPos();
			const comment = text.slice(start, scanner.getTextPos());
			addComment(comment, offset + start);
			if (isTypeScript) {
				for (const match of comment.matchAll(/@ts-(?:ignore|expect-error)\b/g))
					add("typeEscapes", offset + start + match.index, match[0]);
			}
		}
		token = scanner.scan();
	}
}

function script(text, offset, isTypeScript, isTsx, file, add, addComment) {
	const source = ts.createSourceFile(
		isTsx ? "source.tsx" : isTypeScript ? "source.ts" : "source.js",
		text,
		ts.ScriptTarget.Latest,
		true,
		isTsx
			? ts.ScriptKind.TSX
			: isTypeScript
				? ts.ScriptKind.TS
				: ts.ScriptKind.JS,
	);
	scanComments(source, text, offset, isTypeScript, add, addComment);
	scanLongFunctions(source, text, offset, file, add);
	if (!isTestFile(file)) scanEmptyBlocks(source, text, offset, add);
	scanTestCalls(source, offset, file, add);
	visitCode(source, (node) => {
		const start = offset + node.getStart(source);
		if (isTypeScript && node.kind === ts.SyntaxKind.AnyKeyword)
			add("typeEscapes", start, "any used as a type");
		if (isTypeScript && cast(node)) {
			const inner = unwrap(node.expression);
			if (
				cast(inner) &&
				inner.type.kind === ts.SyntaxKind.UnknownKeyword &&
				node.type.kind !== ts.SyntaxKind.UnknownKeyword
			)
				add("typeEscapes", start, "cast through unknown");
		}
		if (
			callNamed(node, "setTimeout") &&
			(node.arguments.length < 2 ||
				(ts.isNumericLiteral(unwrap(node.arguments[1])) &&
					Number(unwrap(node.arguments[1]).text) === 0))
		)
			add("repeatedWorkarounds", start, "zero or omitted setTimeout delay");
		if (!callNamed(node, "requestAnimationFrame")) return;
		const callback = node.arguments[0];
		if (
			!callback ||
			!(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))
		)
			return;
		let nested = false;
		const inspect = (child) => {
			if (literal(child) || ts.isFunctionLike(child)) return;
			if (callNamed(child, "requestAnimationFrame")) nested = true;
			ts.forEachChild(child, inspect);
		};
		inspect(callback.body);
		if (nested)
			add("repeatedWorkarounds", start, "nested requestAnimationFrame");
	});
}

function accessibilityMedia(prelude) {
	const condition = prelude.match(/^\s*@media\b([\s\S]*)$/i)?.[1];
	// Only positive conjunctions qualify. A negation or alternative cannot
	// guarantee that the declarations apply in an accessibility mode.
	return (
		condition !== undefined &&
		!/(?:\b(?:not|or)\b|,)/i.test(condition) &&
		/\(\s*(?:forced-colors\s*:\s*active|prefers-reduced-motion\s*:\s*reduce|prefers-contrast\s*:\s*more)\s*\)/i.test(
			condition,
		)
	);
}

function css(text, offset, add, addComment) {
	let code = "";
	let cursor = 0;
	while (cursor < text.length) {
		const start = cursor;
		if (text.startsWith("/*", cursor)) {
			const end = text.indexOf("*/", cursor + 2);
			cursor = end < 0 ? text.length : end + 2;
			addComment(text.slice(start, cursor), offset + start);
			code += blank(text.slice(start, cursor));
		} else if (text[cursor] === '"' || text[cursor] === "'") {
			const quote = text[cursor++];
			while (cursor < text.length) {
				if (text[cursor] === "\\") cursor += 2;
				else if (text[cursor++] === quote) break;
			}
			code += blank(text.slice(start, cursor));
		} else if (text[cursor] === "\\") {
			code += blank(text.slice(cursor, cursor + 2));
			cursor += 2;
		} else code += text[cursor++];
	}
	const blocks = [];
	let preludeStart = 0;
	let valueDepth = 0;
	for (const match of code.matchAll(/[(){};[\]]|!\s*important\b/gi)) {
		const token = match[0];
		if (token.startsWith("!")) {
			add(
				blocks.at(-1) ? "accessibilityOverrides" : "repeatedWorkarounds",
				offset + match.index,
				blocks.at(-1) ? "!important accessibility override" : "!important",
			);
		} else if (token === "(" || token === "[") valueDepth++;
		else if (token === ")" || token === "]")
			valueDepth = Math.max(0, valueDepth - 1);
		else if (valueDepth === 0) {
			if (token === "{")
				blocks.push(
					Boolean(blocks.at(-1)) ||
						accessibilityMedia(code.slice(preludeStart, match.index)),
				);
			else if (token === "}") blocks.pop();
			preludeStart = match.index + token.length;
		}
	}
}

function html(text, file, add, addComment) {
	// Raw script/style bodies and comments are consumed as units, so markup
	// inside their text cannot be mistaken for real style tags or attributes.
	const units =
		/<!--[\s\S]*?-->|<(script|style)\b(?:[^>"']|"[^"]*"|'[^']*')*>([\s\S]*?)<\/\1\s*>|<[A-Za-z][\w:-]*(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
	for (const match of text.matchAll(units)) {
		if (match[0].startsWith("<!--")) {
			addComment(match[0], match.index);
			continue;
		}
		const openingTag = match[0].match(
			/^<[A-Za-z][\w:-]*(?:[^>"']|"[^"]*"|'[^']*')*>/,
		)[0];
		if (match[1]) {
			const offset = match.index + openingTag.length;
			if (match[1].toLowerCase() === "style")
				css(match[2], offset, add, addComment);
			else script(match[2], offset, false, false, file, add, addComment);
		}
		const attributes =
			/([^\s=<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
		for (const attribute of openingTag.matchAll(attributes)) {
			if (attribute[1].toLowerCase() !== "style") continue;
			const value = attribute[2] ?? attribute[3] ?? attribute[4] ?? "";
			const valueOffset =
				attribute.index +
				attribute[0].length -
				value.length -
				(attribute[2] !== undefined || attribute[3] !== undefined ? 1 : 0);
			css(value, match.index + valueOffset, add, addComment);
		}
	}
}

export function scanSource({ file, text }) {
	const result = {
		typeEscapes: [],
		suppressions: [],
		repeatedWorkarounds: [],
		accessibilityOverrides: [],
		longFunctions: [],
		longFunctionLines: [],
		emptyBlocks: [],
		testCases: [],
		expectCalls: [],
	};
	const comments = [];
	const add = (measure, index, detail, lineCount) => {
		const item = {
			file,
			line: text.slice(0, index).split(/\r?\n/).length,
			detail,
			index,
		};
		if (lineCount !== undefined) item.lineCount = lineCount;
		result[measure].push(item);
	};
	const addComment = (comment, offset) => {
		comments.push({ text: comment, offset });
		for (const match of comment.matchAll(
			/\b(?:TODO|FIXME|HACK|workaround)\b/gi,
		))
			add("repeatedWorkarounds", offset + match.index, `${match[0]} marker`);
		for (const match of comment.matchAll(
			/\b(?:biome-ignore|eslint-disable)(?:[-\w]*)?\b/g,
		))
			add("suppressions", offset + match.index, match[0]);
	};
	const ext = path.extname(file).toLowerCase();
	if (ext === ".css") css(text, 0, add, addComment);
	else if (ext === ".html") html(text, file, add, addComment);
	else if (SCRIPT_EXTENSIONS.has(ext))
		script(
			text,
			0,
			ext === ".ts" || ext === ".tsx",
			ext === ".tsx",
			file,
			add,
			addComment,
		);
	for (const measure of Object.keys(result)) {
		result[measure] = result[measure]
			.sort((a, b) => a.index - b.index)
			.map(({ index, ...item }) => item);
	}
	const codeLines = blankSpans(
		text,
		comments
			.map(({ text: comment, offset }) => [offset, offset + comment.length])
			.sort((a, b) => a[0] - b[0]),
	)
		.split(/\r\n|\r|\n/)
		.filter((line) => /[^\s]/.test(line)).length;
	return { ...result, comments, codeLines };
}
