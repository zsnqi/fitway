import path from "node:path";
import ts from "typescript";

function blank(text) {
	return text.replace(/[^\r\n]/g, " ");
}

function literal(node) {
	return (
		ts.isStringLiteral(node) ||
		ts.isNoSubstitutionTemplateLiteral(node) ||
		ts.isTemplateExpression(node) ||
		node.kind === ts.SyntaxKind.RegularExpressionLiteral
	);
}

function visitCode(node, visit) {
	if (literal(node)) return;
	visit(node);
	ts.forEachChild(node, (child) => visitCode(child, visit));
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

function cast(node) {
	return ts.isAsExpression(node) || ts.isTypeAssertionExpression(node);
}

function script(text, offset, isTypeScript, add, addComment) {
	const source = ts.createSourceFile(
		isTypeScript ? "source.ts" : "source.js",
		text,
		ts.ScriptTarget.Latest,
		true,
	);
	const spans = [];
	const findLiterals = (node) => {
		if (literal(node)) {
			spans.push([node.getStart(source), node.end]);
			return;
		}
		ts.forEachChild(node, findLiterals);
	};
	findLiterals(source);
	// Mask complete literals before scanning trivia, including template interpolations.
	let masked = "";
	let cursor = 0;
	for (const [start, end] of spans.sort((a, b) => a[0] - b[0])) {
		masked += text.slice(cursor, start) + blank(text.slice(start, end));
		cursor = end;
	}
	masked += text.slice(cursor);
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
	for (const match of code.matchAll(/!\s*important\b/gi))
		add("repeatedWorkarounds", offset + match.index, "!important");
}

function html(text, add, addComment) {
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
			else script(match[2], offset, false, add, addComment);
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
	const result = { typeEscapes: [], suppressions: [], repeatedWorkarounds: [] };
	const add = (measure, index, detail) => {
		result[measure].push({
			file,
			line: text.slice(0, index).split(/\r?\n/).length,
			detail,
			index,
		});
	};
	const addComment = (comment, offset) => {
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
	else if (ext === ".html") html(text, add, addComment);
	else if ([".js", ".mjs", ".ts"].includes(ext))
		script(text, 0, ext === ".ts", add, addComment);
	for (const measure of Object.keys(result)) {
		result[measure] = result[measure]
			.sort((a, b) => a.index - b.index)
			.map(({ index, ...item }) => item);
	}
	return result;
}
