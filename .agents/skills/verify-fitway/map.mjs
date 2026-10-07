import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
	lineAt as at,
	discoverElements,
	extractDependencies,
	repository,
	ts,
} from "./discover.mjs";

export { discoverElements, extractDependencies, repository };

const hash = (text) => createHash("sha256").update(text).digest("hex");
const domains = {};
export function extractSwitches(text, file) {
	const source = ts.createSourceFile(
		file,
		text,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	);
	const virtualFile = `${file}.js`;
	const host = ts.createCompilerHost({ allowJs: true });
	host.getSourceFile = (name) => (name === virtualFile ? source : undefined);
	const checker = ts
		.createProgram(
			[virtualFile],
			{ allowJs: true, noLib: true, noResolve: true },
			host,
		)
		.getTypeChecker();
	const symbol = (node) => checker.getSymbolAtLocation(node);
	const params = new Set();
	const declarations = new Map();
	const walk = (node, fn) => {
		fn(node);
		ts.forEachChild(node, (child) => walk(child, fn));
	};
	walk(source, (node) => {
		if (ts.isVariableDeclaration(node) && node.initializer)
			declarations.set(symbol(node.name), node.initializer);
		if (
			ts.isVariableDeclaration(node) &&
			node.initializer?.getText(source).includes("new URLSearchParams")
		)
			params.add(symbol(node.name));
	});
	const result = [];
	walk(source, (node) => {
		if (
			!ts.isCallExpression(node) ||
			!ts.isPropertyAccessExpression(node.expression) ||
			!["get", "has", "getAll"].includes(node.expression.name.text)
		)
			return;
		const receiver = node.expression.expression.getText(source);
		if (
			!params.has(symbol(node.expression.expression)) &&
			!receiver.includes("new URLSearchParams")
		)
			return;
		const arg = node.arguments[0];
		if (!arg || !ts.isStringLiteral(arg))
			throw new Error(
				`${file}:${at(text, node.getStart())}: dynamic URL switch cannot be mapped automatically`,
			);
		const name = arg.text;
		const values = new Set(domains[name] || []);
		const aliases = new Set([node.getText(source)]);
		const bindings = new Set();
		let parent = node.parent;
		while (parent && !ts.isStatement(parent)) {
			if (ts.isFunctionLike(parent)) break;
			if (ts.isVariableDeclaration(parent)) {
				let raw = true;
				walk(parent.initializer, (child) => {
					if (
						ts.isBinaryExpression(child) &&
						![
							ts.SyntaxKind.BarBarToken,
							ts.SyntaxKind.QuestionQuestionToken,
						].includes(child.operatorToken.kind)
					)
						raw = false;
					if (ts.isConditionalExpression(child)) raw = false;
				});
				if (raw) bindings.add(symbol(parent.name));
				break;
			}
			parent = parent.parent;
		}
		const mentions = (candidate) =>
			candidate &&
			[...aliases].some((alias) => {
				const value = candidate.getText(source);
				return (
					(ts.isIdentifier(candidate) && bindings.has(symbol(candidate))) ||
					value === alias ||
					(alias.includes("(") && value.includes(alias))
				);
			});
		walk(source, (candidate) => {
			if (ts.isBinaryExpression(candidate)) {
				for (const [left, right] of [
					[candidate.left, candidate.right],
					[candidate.right, candidate.left],
				]) {
					if (mentions(left) && ts.isStringLiteral(right))
						values.add(right.text);
				}
			}
			if (
				ts.isCallExpression(candidate) &&
				ts.isPropertyAccessExpression(candidate.expression) &&
				["includes", "indexOf"].includes(candidate.expression.name.text) &&
				candidate.arguments.some(mentions)
			) {
				let array = candidate.expression.expression;
				if (ts.isIdentifier(array))
					array = declarations.get(symbol(array)) || array;
				if (ts.isElementAccessExpression(array)) {
					let object = array.expression;
					if (ts.isIdentifier(object))
						object = declarations.get(symbol(object)) || object;
					if (ts.isObjectLiteralExpression(object))
						walk(object, (child) => {
							if (
								ts.isStringLiteral(child) &&
								ts.isArrayLiteralExpression(child.parent)
							)
								values.add(child.text);
						});
				}
				if (ts.isArrayLiteralExpression(array))
					for (const element of array.elements)
						if (ts.isStringLiteral(element)) values.add(element.text);
			}
			if (ts.isConditionalExpression(candidate)) {
				let relevant = false;
				walk(candidate.condition, (child) => {
					if (mentions(child)) relevant = true;
				});
				if (relevant)
					for (const branch of [candidate.whenTrue, candidate.whenFalse])
						if (ts.isStringLiteral(branch)) values.add(branch.text);
			}
			if (
				ts.isElementAccessExpression(candidate) &&
				mentions(candidate.argumentExpression) &&
				candidate.expression
			) {
				let object = candidate.expression;
				if (ts.isIdentifier(object))
					object = declarations.get(symbol(object)) || object;
				for (const property of ts.isObjectLiteralExpression(object)
					? object.properties
					: [])
					if (property.name)
						values.add(property.name.text || property.name.getText(source));
			}
		});
		// A literal lookup, default, or comparison surrounding the call (e.g. preset.toLowerCase()).
		let local = node;
		while (local.parent && !ts.isStatement(local.parent)) local = local.parent;
		if (name === "preset")
			walk(local, (n) => {
				if (ts.isPropertyAssignment(n) && n.name)
					values.add(n.name.text || n.name.getText(source));
			});
		result.push({
			name,
			values: [...values]
				.filter((value) => value !== "" || name === "reason")
				.sort(),
			domain: Object.hasOwn(domains, name)
				? "open; samples shown, --query accepts any value"
				: "finite branches; absent value is default",
			source: { file, line: at(text, node.getStart()) },
		});
	});
	return result;
}

export function readRecipes(
	concept,
	path = resolve(concept, "verification-recipes.json"),
) {
	if (!existsSync(path))
		throw new Error(
			`Recipes missing: ${path}; provide --recipes <absolute verification-recipes.json> from the concept branch.`,
		);
	const recipes = JSON.parse(readFileSync(path, "utf8"));
	if (recipes.schema !== 1 || !recipes.pages)
		throw new Error(`Invalid recipes: ${path}; repair schema=1 and pages.`);
	return { recipes, path };
}

export function generateMap(concept, recipePath) {
	const { recipes, path } = readRecipes(concept, recipePath);
	const sources = new Map();
	const load = (file) => {
		if (!sources.has(file))
			sources.set(file, readFileSync(resolve(concept, file), "utf8"));
		return sources.get(file);
	};
	const pages = readdirSync(concept)
		.filter((name) => name.endsWith(".html"))
		.sort()
		.map((page) => {
			const html = load(page);
			const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)]
				.map((m) => m[1])
				.filter((name) => !name.includes(":"));
			const styles = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/g)]
				.map((m) => m[1])
				.filter((name) => !name.includes(":"));
			const texts = [
				{ file: page, text: html },
				...scripts.map((file) => ({ file, text: load(file) })),
			];
			// Scan inline scripts as JS, preserving their exact original line numbers.
			const js = texts
				.filter((t) => !t.file.endsWith(".html"))
				.filter(({ text }) => {
					const guard =
						/if\s*\(!document\.body\.classList\.contains\(["']([^"']+)["']\)\)\s*return/.exec(
							text,
						);
					return (
						!guard ||
						new RegExp(`<body[^>]*class=["'][^"']*\\b${guard[1]}\\b`).test(html)
					);
				});
			for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))
				js.push({
					file: page,
					text: "\n".repeat(at(html, m.index) - 1) + m[1],
				});
			for (const file of styles) load(file);
			const byName = new Map();
			for (const { file, text } of js)
				for (const item of extractSwitches(text, file)) {
					const old = byName.get(item.name);
					if (old) {
						old.values = [...new Set([...old.values, ...item.values])].sort();
						old.sources.push(item.source);
					} else byName.set(item.name, { ...item, sources: [item.source] });
				}
			let ready;
			let readySource;
			for (const { file, text } of js) {
				const match =
					/(?:window\.)?(__\w+)(?:\.ready\s*=\s*true|\s*=\s*\{\s*ready:\s*true)/.exec(
						text,
					);
				if (match) {
					ready = `window.${match[1]}?.ready === true`;
					readySource = { file, line: at(text, match.index) };
					break;
				}
			}
			if (!ready)
				throw new Error(
					`${page}:1: no source readiness signal; expose a ready signal in the concept.`,
				);
			const discovery = discoverElements([
				{ file: page, text: html },
				...js.filter((t) => t.file !== page),
			]);
			const authored = recipes.pages[page] || { features: [], states: [] };
			const switches = [...byName.values()]
				.sort((a, b) => a.name.localeCompare(b.name))
				.map((item) => ({
					...item,
					samples: authored.samples?.[item.name] || [],
					dependencies: js
						.flatMap(({ file, text }) => extractDependencies(text, file))
						.filter((d) => d.switch === item.name),
				}));
			return {
				page,
				ready,
				readySource,
				switches,
				...discovery,
				features: [
					{
						id: "page",
						what: `Open ${page}`,
						actions: [],
						proof: { ready: true },
						source: { file: page, line: 1 },
					},
					...(authored.features || []),
				],
				states: authored.states || [],
				defaults: authored.defaults || {},
				sourceFiles: texts.map((t) => t.file),
			};
		});
	return {
		schema: 2,
		concept,
		recipePath: path,
		recipesHash: hash(JSON.stringify(recipes)),
		pages,
		sizes: {
			desktop: { width: 1440, height: 900 },
			boundary: { width: 1024, height: 900 },
			tablet: { width: 768, height: 1024 },
			phone: { width: 390, height: 844 },
			narrow: { width: 320, height: 844 },
			zoom: { width: 1440, height: 900, zoom: 2 },
		},
		sources: [...sources].map(([file, text]) => ({ file, sha256: hash(text) })),
	};
}

function selectorAtoms(selector) {
	// Only the portion before text/xpath pseudo arguments is a DOM selector.
	return [
		...selector
			.split(/:has-text|>>/)[0]
			.matchAll(/#[\w-]+|\.[a-zA-Z][\w-]*|\[([\w-]+)(?:=["']([^"']*)["'])?\]/g),
	].map((m) => m[0]);
}

export function coverageProblems(map, concept) {
	const problems = [];
	for (const page of map.pages) {
		const texts = page.sourceFiles.map((file) => ({
			file,
			text: readFileSync(resolve(concept, file), "utf8"),
		}));
		for (const opening of page.openings) {
			if (!page.features.some((f) => f.covers?.includes(opening.selector)))
				problems.push(
					`${opening.source.file}:${opening.source.line}: uncovered ${opening.kind} ${opening.selector}; openers: ${opening.openers.map((o) => o.selector).join(", ") || "recipe required"}`,
				);
		}
		const proofRecipes = [
			...page.features,
			...page.states.map((s, i) => ({
				...s,
				id: `state-${i}`,
				actions: [],
				source: s.source || { file: "verification-recipes.json", line: i + 1 },
			})),
		];
		for (const [index, feature] of proofRecipes.entries()) {
			if (feature.id === "page") continue;
			const where = feature.source || {
				file: "verification-recipes.json",
				line: index + 1,
			};
			if (feature.marker && !texts.some((t) => t.text.includes(feature.marker)))
				problems.push(
					`${where.file}:${where.line}: recipe ${feature.id} marker gone: ${feature.marker}`,
				);
			const selectors = [];
			const destination = feature.proof.path
				? discoverElements(
						[
							{
								file: feature.proof.path,
								text: readFileSync(
									resolve(concept, feature.proof.path),
									"utf8",
								),
							},
							...readFileSync(
								resolve(concept, feature.proof.path),
								"utf8",
							).matchAll(/<script[^>]+src=["']([^"']+)["']/g),
						]
							.slice(1)
							.map((m) => ({
								file: m[1],
								text: readFileSync(resolve(concept, m[1]), "utf8"),
							})),
					)
				: undefined;
			const visit = (proof) => {
				if (proof?.selector) selectors.push(proof.selector);
				for (const p of [...(proof?.oneOf || []), ...(proof?.allOf || [])])
					visit(p);
			};
			visit(feature.proof);
			for (const rule of feature.unreachable || []) visit(rule.proof);
			for (const action of feature.actions || [])
				if (!/^(press|wait):/.test(action)) {
					let selector = action
						.slice(action.indexOf(":") + 1)
						.replace(/@.*$/, "");
					if (/^(type|select):/.test(action))
						selector = selector.slice(0, selector.lastIndexOf("="));
					selectors.push(selector);
				}
			for (const selector of [...selectors, ...(feature.covers || [])])
				for (const atom of selectorAtoms(selector)) {
					const attrMatch = /\[([\w-]+)(?:=["']([^"']*)["'])?\]/.exec(atom);
					const found = [
						...page.elements,
						...(destination?.elements || []),
					].some((e) =>
						atom.startsWith("#")
							? e.attrs.id === atom.slice(1)
							: atom.startsWith(".")
								? e.attrs.class?.split(/\s+/).includes(atom.slice(1))
								: (e.variants || [e.attrs]).some(
										(attrs) =>
											Object.hasOwn(attrs, attrMatch[1]) &&
											(attrMatch[2] === undefined ||
												attrs[attrMatch[1]] === attrMatch[2] ||
												attrs[attrMatch[1]].includes("${")),
									),
					);
					// Dynamic markup has authored recipes but must still have a source marker.
					const name = atom.slice(1);
					const attr = /\[([\w-]+)/.exec(atom)?.[1];
					const runtimeAttribute =
						atom.startsWith("[") &&
						(name === "open]" ||
							texts.some(
								(t) =>
									t.text.includes(
										`dataset.${attr.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`,
									) ||
									t.text.includes(`setAttribute("${attr}"`) ||
									t.text.includes(`setAttribute('${attr}'`) ||
									(attr === "tabindex" && t.text.includes(".tabIndex")),
							));
					if (!found && !runtimeAttribute)
						problems.push(
							`${where.file}:${where.line}: recipe ${feature.id} selector gone: ${atom} (${selector})`,
						);
				}
		}
	}
	return [...new Set(problems)];
}

export function drift(map, concept, recipePath = map.recipePath) {
	const current = generateMap(concept, recipePath);
	const problems = coverageProblems(current, concept);
	for (const page of map.pages || []) {
		if (!current.pages.some((p) => p.page === page.page))
			problems.push(`${page.page}:1: removed page`);
		const other = current.pages.find((p) => p.page === page.page);
		if (!other) continue;
		for (const feature of page.features || [])
			if (!other.features.some((f) => f.id === feature.id))
				problems.push(
					`${feature.source?.file || page.page}:${feature.source?.line || 1}: recipe gone: ${feature.id}`,
				);
	}
	// Source edits, relocations and CSS changes are expected. Coverage is the contract,
	// not a source hash cache; each consumer uses the freshly discovered map.
	return problems;
}

export function checkCommittedMaps(root = repository) {
	let count = 0;
	const visit = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (
				[".git", "node_modules", ".next", "dist", ".local"].includes(entry.name)
			)
				continue;
			const path = resolve(dir, entry.name);
			if (entry.isDirectory() && !entry.isSymbolicLink()) visit(path);
			else if (entry.name === "verification-recipes.json") {
				const map = generateMap(dirname(path), path);
				const problems = coverageProblems(map, dirname(path));
				if (problems.length) throw new Error(problems.join("\n"));
				count++;
			}
		}
	};
	visit(root);
	return count;
}
