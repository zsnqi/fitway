// Hash files and trace CSS and script references to reached concept pages.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import {
	linkedReferences,
	resolveLinkedFile,
} from "../gardener/code-health.mjs";
import { ts } from "./discover.mjs";

export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

function cssLoads(text) {
	const references = linkedReferences(text, ".css");
	let cursor = 0;
	const quoted = () => {
		const quote = text[cursor++];
		const start = cursor;
		while (cursor < text.length && text[cursor] !== quote) {
			if (text[cursor] === "\\") cursor++;
			cursor++;
		}
		return text.slice(start, cursor++);
	};
	while (cursor < text.length) {
		if (text.startsWith("/*", cursor)) {
			const end = text.indexOf("*/", cursor + 2);
			cursor = end < 0 ? text.length : end + 2;
		} else if (text[cursor] === '"' || text[cursor] === "'") quoted();
		else if (
			/^url\s*\(/i.test(text.slice(cursor)) &&
			!/[\w-]/.test(text[cursor - 1] || "")
		) {
			cursor += /^url\s*\(/i.exec(text.slice(cursor))[0].length;
			while (/\s/.test(text[cursor] || "")) cursor++;
			if (text[cursor] === '"' || text[cursor] === "'")
				references.push(quoted());
			else {
				const start = cursor;
				while (cursor < text.length && text[cursor] !== ")") cursor++;
				references.push(text.slice(start, cursor).trim());
			}
			while (cursor < text.length && text[cursor] !== ")") cursor++;
			cursor++;
		} else cursor++;
	}
	return references;
}

export function filesIn(root, prefix = "") {
	return readdirSync(resolve(root, prefix), { withFileTypes: true })
		.flatMap((entry) => {
			const file = `${prefix}${entry.name}`;
			if (entry.isDirectory()) return filesIn(root, `${file}/`);
			if (!entry.isFile()) throw new Error(`Unresolved linked file: ${file}`);
			return [{ file, bytes: readFileSync(resolve(root, file)) }];
		})
		.sort((a, b) => a.file.localeCompare(b.file));
}

// Keep raw recipe values: even a byte-only edit to a page's entry invalidates it.
function recipeEntries(path) {
	const text = readFileSync(path, "utf8");
	const source = ts.parseJsonText(path, text);
	const object = source.statements[0]?.expression;
	const entries = new Map();
	for (const property of object?.properties || []) {
		if (property.name?.text === "pages") {
			for (const page of property.initializer.properties || [])
				entries.set(page.name.text, page.getFullText(source));
		} else
			entries.set("*", (entries.get("*") || "") + property.getText(source));
	}
	return entries;
}

function javascriptLoads(text, file) {
	const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
	const references = [];
	const unresolved = [];
	const literal = (node) =>
		node && ts.isStringLiteralLike(node) ? node.text : null;
	let checker;
	const resolvedTags = (node, seen = new Set()) => {
		if (literal(node) !== null) return [literal(node)];
		if (!node || !ts.isIdentifier(node) || seen.has(node)) return null;
		seen.add(node);
		if (!checker) {
			const host = ts.createCompilerHost({ allowJs: true });
			host.getSourceFile = (name) => (name === file ? source : undefined);
			checker = ts
				.createProgram(
					[file],
					{ allowJs: true, noLib: true, noResolve: true },
					host,
				)
				.getTypeChecker();
		}
		const declaration = checker.getSymbolAtLocation(node)?.declarations?.[0];
		if (declaration && ts.isVariableDeclaration(declaration))
			return declaration.parent.flags & ts.NodeFlags.Const
				? resolvedTags(declaration.initializer, seen)
				: null;
		if (!declaration || !ts.isParameter(declaration)) return null;
		const fn = declaration.parent;
		let written = false;
		const parameterSymbol = checker.getSymbolAtLocation(node);
		const findWrite = (candidate) => {
			if (
				ts.isIdentifier(candidate) &&
				(ts.isShorthandPropertyAssignment(candidate.parent)
					? checker.getShorthandAssignmentValueSymbol(candidate.parent)
					: checker.getSymbolAtLocation(candidate)) === parameterSymbol
			) {
				// Assignment patterns can put the identifier under array/object,
				// shorthand or parenthesized nodes instead of directly on the LHS.
				for (
					let target = candidate;
					target.parent && !ts.isFunctionLike(target.parent);
					target = target.parent
				) {
					const parent = target.parent;
					if (
						(ts.isBinaryExpression(parent) &&
							parent.left === target &&
							parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
							parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
						((ts.isForInStatement(parent) || ts.isForOfStatement(parent)) &&
							parent.initializer === target) ||
						ts.isPrefixUnaryExpression(parent) ||
						ts.isPostfixUnaryExpression(parent)
					)
						written = true;
				}
			}
			ts.forEachChild(candidate, findWrite);
		};
		findWrite(fn);
		if (written) return null;
		const name =
			fn.name || (ts.isVariableDeclaration(fn.parent) ? fn.parent.name : null);
		if (!name) return null;
		const symbol = checker.getSymbolAtLocation(name);
		const parameter = fn.parameters.indexOf(declaration);
		const tags = [];
		let escaped = false;
		const inspect = (candidate) => {
			if (
				ts.isIdentifier(candidate) &&
				candidate !== name &&
				checker.getSymbolAtLocation(candidate) === symbol
			) {
				if (
					!ts.isCallExpression(candidate.parent) ||
					candidate.parent.expression !== candidate
				)
					escaped = true;
				else {
					const values = resolvedTags(
						candidate.parent.arguments[parameter],
						new Set(seen),
					);
					if (!values) escaped = true;
					else tags.push(...values);
				}
			}
			ts.forEachChild(candidate, inspect);
		};
		inspect(source);
		return !escaped && tags.length ? tags : null;
	};
	const visit = (node) => {
		if (ts.isCallExpression(node)) {
			const name = ts.isPropertyAccessExpression(node.expression)
				? node.expression.name.text
				: node.expression.getText(source);
			if (
				node.expression.kind === ts.SyntaxKind.ImportKeyword ||
				name === "fetch"
			) {
				const reference = literal(node.arguments[0]);
				if (reference !== null)
					references.push(
						name === "fetch" ? { reference, document: true } : reference,
					);
				else unresolved.push(`${file}: computed ${name} load`);
			}
			if (name === "createElement" || name === "createElementNS") {
				const tags = resolvedTags(
					node.arguments[name === "createElementNS" ? 1 : 0],
				);
				if (
					tags === null ||
					tags.some((tag) => /^(script|link|style)$/i.test(tag))
				)
					unresolved.push(
						`${file}: script-created ${tags?.join(",") || "computed"} element`,
					);
			}
		}
		if (
			ts.isStringLiteralLike(node) &&
			/<(?:script|link|style)\b/i.test(node.text)
		)
			unresolved.push(`${file}: script-created load markup`);
		ts.forEachChild(node, visit);
	};
	visit(source);
	return { references, unresolved };
}

export function pageLoads(setup) {
	const files = filesIn(setup.concept).map((item) => ({
		...item,
		text: item.bytes.toString("utf8"),
		digest: hash(item.bytes),
	}));
	const byPath = new Map(files.map((item) => [item.file, item]));
	const recipes = recipeEntries(setup.map.recipePath);
	return setup.map.pages.map(({ page }) => {
		const loaded = new Map();
		const unresolved = [];
		let external = false;
		const visit = (item) => {
			if (!item || loaded.has(item.file)) return;
			loaded.set(item.file, item.digest);
			const extension = extname(item.file).toLowerCase();
			const references = linkedReferences(item.text, extension);
			if (extension === ".html") {
				if (/<base\b[^>]*\bhref\s*=/i.test(item.text))
					unresolved.push(`${item.file}: document base override`);
				if (/\bsrcset\s*=/i.test(item.text))
					unresolved.push(`${item.file}: responsive image loads`);
				for (const match of item.text.matchAll(
					/<style\b[^>]*>([\s\S]*?)<\/style>/gi,
				))
					references.push(...cssLoads(match[1]));
				for (const match of item.text.matchAll(
					/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi,
				))
					references.push(...cssLoads(match[2]));
				for (const match of item.text.matchAll(
					/<script\b[^>]*>([\s\S]*?)<\/script>/gi,
				)) {
					const js = javascriptLoads(match[1], item.file);
					references.push(
						...linkedReferences(match[1], ".js"),
						...js.references,
					);
					unresolved.push(...js.unresolved);
				}
				for (const match of item.text.matchAll(
					/<(?:img|source|video|audio|input)\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,
				))
					references.push(match[1]);
			} else if ([".js", ".mjs", ".ts"].includes(extension)) {
				const js = javascriptLoads(item.text, item.file);
				references.push(...js.references);
				unresolved.push(...js.unresolved);
			} else if (extension === ".css") {
				references.push(...cssLoads(item.text));
			}
			for (const load of new Set(references)) {
				let reference = typeof load === "string" ? load : load.reference;
				if (/^(data:|blob:|#)/i.test(reference)) continue;
				if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) external = true;
				// Root-relative references are local to the supplied preview root.
				const importer = reference.startsWith("/")
					? "index.html"
					: load.document
						? page
						: item.file;
				if (reference.startsWith("/") && !reference.startsWith("//"))
					reference = `.${reference}`;
				const target = resolveLinkedFile(importer, reference, byPath);
				if (!target) unresolved.push(`${item.file}: unresolved ${reference}`);
				else visit(target);
			}
		};
		visit(byPath.get(page));
		if (!loaded.has(page)) unresolved.push(`${page}: missing HTML`);
		return {
			page,
			loaded,
			unresolved: [...new Set(unresolved)],
			external:
				external ||
				unresolved.some((reason) =>
					/computed|script-created|document base/.test(reason),
				),
			recipe: (recipes.get("*") || "") + (recipes.get(page) || ""),
			// Computed local loads are bounded safely by all files in the input.
			fingerprint: hash(
				JSON.stringify([
					unresolved.length
						? files.map((f) => [f.file, f.digest])
						: [...loaded].sort(),
					(recipes.get("*") || "") + (recipes.get(page) || ""),
				]),
			),
		};
	});
}

export function reachedPages(buildLoads, baselineLoads) {
	const names = [
		...new Set([...buildLoads, ...baselineLoads].map((p) => p.page)),
	];
	const reasons = new Map(names.map((page) => [page, []]));
	const owners = new Map();
	const changed = new Set();
	for (const page of names) {
		const a = buildLoads.find((p) => p.page === page);
		const b = baselineLoads.find((p) => p.page === page);
		for (const reason of [...(a?.unresolved || []), ...(b?.unresolved || [])])
			reasons.get(page).push(reason);
		if (!a || !b || a.recipe !== b.recipe)
			reasons.get(page).push(`verification-recipes.json: ${page}`);
		for (const file of new Set([
			...(a?.loaded.keys() || []),
			...(b?.loaded.keys() || []),
		])) {
			if (a?.loaded.get(file) !== b?.loaded.get(file)) changed.add(file);
			if (page !== "components.html") {
				const pages = owners.get(file) || new Set();
				pages.add(page);
				owners.set(file, pages);
			}
		}
	}
	for (const file of changed) {
		const shared = (owners.get(file)?.size || 0) >= 2;
		for (const page of names) {
			if (
				shared ||
				[...buildLoads, ...baselineLoads].some(
					(p) => p.page === page && p.loaded.has(file),
				)
			)
				reasons
					.get(page)
					.push(`${file}${shared ? " (shared by multiple pages)" : ""}`);
		}
	}
	return reasons;
}
