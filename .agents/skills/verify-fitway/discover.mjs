import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repository = fileURLToPath(new URL("../../../", import.meta.url));
export const ts = createRequire(resolve(repository, "package.json"))(
	"typescript",
);
export const lineAt = (text, offset) =>
	text.slice(0, offset).split("\n").length;
const walk = (node, fn) => {
	fn(node);
	ts.forEachChild(node, (n) => walk(n, fn));
};
const literal = (node) =>
	node && (ts.isStringLiteralLike(node) ? node.text : undefined);

// Static DOM vocabulary, including literal markup inside JS and element factories.
// Locations refer to the input source, never a generated map.
export function discoverElements(texts) {
	const elements = new Map();
	const aliases = new Map();
	const events = [];
	const functions = new Map();
	const targets = new Set();
	const mutations = [];
	const creations = new Map();
	const add = (tag, attrs, file, line, binding) => {
		const selector =
			attrs.id && !attrs.id.includes("${")
				? `#${attrs.id}`
				: attrs.class
						?.split(/\s+/)
						.filter((x) => x && !x.includes("${"))
						.map((x) => `.${x}`)
						.join("");
		if (!selector) {
			if (
				tag === "dialog" ||
				["dialog", "menu"].includes(attrs.role) ||
				Object.hasOwn(attrs, "popover")
			) {
				const name = `${tag}[source="${file}:${line}"]`;
				elements.set(name, {
					selector: name,
					tag,
					attrs,
					source: { file, line },
				});
				targets.add(name);
			}
			return;
		}
		const element = {
			selector,
			tag,
			attrs,
			variants: [attrs],
			source: { file, line },
		};
		if (!elements.has(selector)) elements.set(selector, element);
		else {
			const previous = elements.get(selector);
			const classes = [
				...new Set(
					`${previous.attrs.class || ""} ${attrs.class || ""}`
						.trim()
						.split(/\s+/),
				),
			].join(" ");
			previous.attrs = {
				...previous.attrs,
				...attrs,
				...(classes ? { class: classes } : {}),
			};
			previous.variants.push(attrs);
		}
		if (binding) aliases.set(`${file}:${binding}`, selector);
		if (
			tag === "dialog" ||
			["dialog", "alertdialog", "menu"].includes(attrs.role) ||
			Object.hasOwn(attrs, "popover")
		)
			targets.add(selector);
	};
	for (const { file, text } of texts) {
		const ast = ts.createSourceFile(
			file,
			text,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.JS,
		);
		const bindings = new Map();
		const properties = new Map();
		const strings = new Set();
		const parameterValues = new Map();
		const ranges = [];
		walk(ast, (n) => {
			if (ts.isVariableDeclaration(n) && n.initializer)
				bindings.set(n.name.getText(ast), n.initializer);
			if (ts.isPropertyAssignment(n) && literal(n.initializer) !== undefined) {
				const key = n.name.text;
				if (!properties.has(key)) properties.set(key, new Set());
				properties.get(key).add(literal(n.initializer));
			}
			if (literal(n) !== undefined) strings.add(literal(n));
			if (ts.isStringLiteralLike(n) || ts.isTemplateExpression(n))
				ranges.push([n.getStart(ast), n.end]);
			if (ts.isFunctionDeclaration(n) && n.name) {
				walk(ast, (call) => {
					if (
						ts.isCallExpression(call) &&
						call.expression.getText(ast) === n.name.text
					)
						for (const [i, p] of n.parameters.entries()) {
							const value = literal(call.arguments[i]);
							if (value !== undefined) {
								const key = p.name.getText(ast);
								if (!parameterValues.has(key))
									parameterValues.set(key, new Set());
								parameterValues.get(key).add(value);
							}
						}
				});
			}
		});
		const values = (expression, seen = new Set()) => {
			if (!expression) return [];
			if (literal(expression) !== undefined) return [literal(expression)];
			if (ts.isIdentifier(expression) && !seen.has(expression.text))
				return values(
					bindings.get(expression.text),
					new Set([...seen, expression.text]),
				);
			if (ts.isPropertyAccessExpression(expression))
				return [...(properties.get(expression.name.text) || [])];
			if (ts.isConditionalExpression(expression))
				return [
					...values(expression.whenTrue, seen),
					...values(expression.whenFalse, seen),
				];
			if (ts.isTemplateExpression(expression)) {
				let expanded = [expression.head.text];
				for (const span of expression.templateSpans) {
					const parts = values(span.expression, seen);
					if (!parts.length) return [];
					expanded = expanded.flatMap((start) =>
						parts.map((part) => start + part + span.literal.text),
					);
				}
				return expanded;
			}
			return [];
		};
		const expand = (raw) => {
			if (!raw.includes("${")) return [raw];
			let result = [raw];
			for (const m of raw.matchAll(/\$\{([\w.]+)\}/g)) {
				const possible = m[1].includes(".")
					? [...(properties.get(m[1].split(".").at(-1)) || [])]
					: [
							...values(bindings.get(m[1])),
							...(parameterValues.get(m[1]) || []),
							...(properties.get(m[1]) || []),
						];
				if (!possible.length) return [];
				result = result.flatMap((start) =>
					possible.map((value) => start.replace(m[0], value)),
				);
			}
			return result;
		};
		for (const m of text.matchAll(/<([a-z][\w-]*)\b([^<>]*?)>/gi)) {
			if (
				!file.endsWith(".html") &&
				!ranges.some(([start, end]) => m.index >= start && m.index < end)
			)
				continue;
			if (
				file.endsWith(".html") &&
				[...text.matchAll(/<!--[\s\S]*?-->/g)].some(
					(c) => m.index >= c.index && m.index < c.index + c[0].length,
				)
			)
				continue;
			const attrs = {};
			for (const a of m[2].matchAll(
				/([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g,
			))
				attrs[a[1]] = a[2] ?? a[3] ?? a[4] ?? "";
			add(m[1].toLowerCase(), attrs, file, lineAt(text, m.index));
			if (attrs.id?.includes("${"))
				for (const id of expand(attrs.id))
					add(
						m[1].toLowerCase(),
						{ ...attrs, id },
						file,
						lineAt(text, m.index),
					);
		}
		walk(ast, (node) => {
			if (ts.isPropertyAssignment(node) && node.name.text === "className")
				for (const cls of values(node.initializer))
					add("element", { class: cls }, file, lineAt(text, node.getStart()));
			if (ts.isVariableDeclaration(node) && node.initializer) {
				const init = node.initializer;
				if (ts.isObjectLiteralExpression(init))
					for (const property of init.properties) {
						if (
							ts.isPropertyAssignment(property) &&
							ts.isCallExpression(property.initializer)
						) {
							const selector = literal(property.initializer.arguments[0]);
							if (selector?.match(/^[#.][\w-]+$/))
								aliases.set(
									`${file}:${node.name.getText(ast)}.${property.name.text}`,
									selector,
								);
						}
					}
				if (ts.isCallExpression(init)) {
					if (
						init.expression.getText(ast).endsWith("createElement") &&
						literal(init.arguments[0])
					)
						creations.set(`${file}:${node.name.getText(ast)}`, {
							tag: literal(init.arguments[0]),
							source: { file, line: lineAt(text, node.getStart()) },
						});
					const selector = literal(init.arguments[0]);
					if (selector?.match(/^[#.[]/))
						aliases.set(`${file}:${node.name.getText(ast)}`, selector);
					if (
						literal(init.arguments[0]) &&
						init.arguments[1] &&
						ts.isObjectLiteralExpression(init.arguments[1])
					) {
						const attrs = {};
						for (const p of init.arguments[1].properties)
							if (ts.isPropertyAssignment(p)) {
								const key = p.name.text;
								const value = literal(p.initializer);
								if (key && value !== undefined) attrs[key] = value;
							}
						add(
							literal(init.arguments[0]),
							attrs,
							file,
							lineAt(text, node.getStart()),
							node.name.getText(ast),
						);
						const idProp = init.arguments[1].properties.find(
							(p) => p.name?.text === "id",
						);
						const idValues = values(idProp?.initializer || idProp?.name);
						// A reused local identifier can be shadowed; inspect each source-grounded
						// template declaration with that name rather than inventing ids.
						if (idProp && !idValues.length)
							walk(ast, (n) => {
								if (
									ts.isVariableDeclaration(n) &&
									n.name.getText(ast) === idProp.name.text
								)
									idValues.push(...values(n.initializer));
							});
						for (const id of idValues)
							add(
								literal(init.arguments[0]),
								{ ...attrs, id },
								file,
								lineAt(text, node.getStart()),
								node.name.getText(ast),
							);
					}
				}
				if (ts.isArrowFunction(init) || ts.isFunctionExpression(init))
					functions.set(`${file}:${node.name.getText(ast)}`, init);
			}
			if (ts.isFunctionDeclaration(node) && node.name)
				functions.set(`${file}:${node.name.text}`, node);
			if (
				ts.isCallExpression(node) &&
				ts.isPropertyAccessExpression(node.expression) &&
				node.expression.name.text === "addEventListener"
			) {
				if (
					[
						"click",
						"pointerdown",
						"pointermove",
						"keydown",
						"touchstart",
						"focusin",
					].includes(literal(node.arguments[0]))
				) {
					let collection;
					for (let parent = node.parent; parent; parent = parent.parent)
						if (
							ts.isCallExpression(parent) &&
							ts.isPropertyAccessExpression(parent.expression) &&
							parent.expression.name.text === "forEach"
						) {
							collection = aliases.get(
								`${file}:${parent.expression.expression.getText(ast)}`,
							);
							break;
						}
					events.push({
						file,
						receiver: node.expression.expression.getText(ast),
						handler: node.arguments[1],
						selector: collection,
						source: { file, line: lineAt(text, node.getStart()) },
					});
				}
			}
			if (
				ts.isBinaryExpression(node) &&
				node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
				ts.isPropertyAccessExpression(node.left)
			) {
				const left = node.left;
				if (left.name.text === "id")
					for (const id of values(node.right))
						add(
							creations.get(`${file}:${left.expression.getText(ast)}`)?.tag ||
								"element",
							{ id },
							file,
							lineAt(text, node.getStart()),
							left.expression.getText(ast),
						);
				if (left.name.text === "className")
					for (const className of values(node.right))
						add(
							"element",
							{ class: className },
							file,
							lineAt(text, node.getStart()),
						);
				if (left.name.text === "role") {
					const sel = aliases.get(`${file}:${left.expression.getText(ast)}`);
					const e = elements.get(sel);
					if (e)
						for (const role of values(node.right))
							add(
								e.tag,
								{ ...e.attrs, role },
								file,
								lineAt(text, node.getStart()),
							);
				}
				if (
					left.name.text === "hidden" &&
					node.right.kind !== ts.SyntaxKind.TrueKeyword
				)
					mutations.push({
						file,
						receiver: left.expression.getText(ast),
						node,
					});
				if (
					left.name.text === "open" &&
					left.expression.getText(ast).endsWith(".dataset")
				)
					mutations.push({
						file,
						receiver: left.expression.getText(ast).replace(/\.dataset$/, ""),
						node,
					});
			}
			if (
				ts.isCallExpression(node) &&
				ts.isPropertyAccessExpression(node.expression) &&
				["setAttribute", "add", "toggle"].includes(node.expression.name.text)
			) {
				const name = node.expression.name.text;
				if (name === "setAttribute") {
					const receiver = node.expression.expression.getText(ast);
					const attribute = literal(node.arguments[0]);
					if (attribute === "id")
						for (const id of values(node.arguments[1]))
							add(
								creations.get(`${file}:${receiver}`)?.tag || "element",
								{ id },
								file,
								lineAt(text, node.getStart()),
								receiver,
							);
					if (["role", "popover"].includes(attribute)) {
						const sel = aliases.get(`${file}:${receiver}`);
						const e = elements.get(sel);
						if (e)
							for (const value of values(node.arguments[1]))
								add(
									e.tag,
									{ ...e.attrs, [attribute]: value },
									file,
									lineAt(text, node.getStart()),
									receiver,
								);
						else if (
							attribute === "popover" ||
							["dialog", "menu", "alertdialog"].includes(
								literal(node.arguments[1]),
							)
						)
							add(
								"element",
								{ [attribute]: literal(node.arguments[1]) || "" },
								file,
								lineAt(text, node.getStart()),
							);
					}
				}
				if (
					["add", "toggle"].includes(name) &&
					node.expression.expression.getText(ast).endsWith(".classList")
				)
					for (const cls of values(node.arguments[0]))
						add("element", { class: cls }, file, lineAt(text, node.getStart()));
			}
			if (
				ts.isCallExpression(node) &&
				ts.isPropertyAccessExpression(node.expression) &&
				["showModal", "show", "showPopover"].includes(node.expression.name.text)
			)
				mutations.push({
					file,
					receiver: node.expression.expression.getText(ast),
					node,
				});
		});
	}
	const selectorFor = (file, receiver) =>
		aliases.get(`${file}:${receiver}`) ||
		/(?:querySelector|\$)\(["']([^"']+)["']\)/.exec(receiver)?.[1];
	for (const [binding, creation] of creations)
		if (creation.tag === "dialog" && !aliases.has(binding))
			add("dialog", {}, creation.source.file, creation.source.line);
	for (const element of elements.values()) {
		const controlled = element.attrs["aria-controls"];
		if (controlled)
			for (const id of controlled.split(/\s+/)) {
				const target = elements.get(`#${id}`);
				if (target && !["input", "textarea", "select"].includes(target.tag))
					targets.add(target.selector);
			}
	}
	for (const mutation of mutations) {
		const sel = selectorFor(mutation.file, mutation.receiver);
		const opensDialog =
			ts.isCallExpression(mutation.node) &&
			["showModal", "show", "showPopover"].includes(
				mutation.node.expression.name?.text,
			);
		if (
			sel &&
			elements.has(sel) &&
			(opensDialog || Object.hasOwn(elements.get(sel).attrs, "hidden"))
		)
			targets.add(sel);
	}
	const reachable = (file, node, seen = new Set()) => {
		const nodes = new Set();
		if (!node) return nodes;
		if (ts.isIdentifier(node)) {
			const key = `${file}:${node.text}`;
			if (seen.has(key)) return nodes;
			seen.add(key);
			return reachable(file, functions.get(key), seen);
		}
		walk(node, (n) => {
			nodes.add(n);
			if (ts.isCallExpression(n) && ts.isIdentifier(n.expression))
				for (const child of reachable(file, n.expression, seen))
					nodes.add(child);
		});
		return nodes;
	};
	// Follow literal arguments into shared opening helpers. The user path remains
	// authored, but a helper's dialog parameter is not an unknown source target.
	const openedBy = (file, node, environment = new Map(), seen = new Set()) => {
		const opened = new Set();
		if (!node) return opened;
		if (ts.isIdentifier(node))
			return openedBy(
				file,
				functions.get(`${file}:${node.text}`),
				environment,
				seen,
			);
		const resolveReceiver = (receiver) =>
			environment.get(receiver) || selectorFor(file, receiver);
		walk(node, (n) => {
			for (const mutation of mutations)
				if (mutation.file === file && mutation.node === n) {
					const selector = resolveReceiver(mutation.receiver);
					if (selector) opened.add(selector);
				}
			if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
				const fn = functions.get(`${file}:${n.expression.text}`);
				if (!fn) return;
				const next = new Map(environment);
				for (const [i, param] of fn.parameters.entries()) {
					const argument = n.arguments[i];
					if (argument)
						next.set(
							param.name.getText(),
							resolveReceiver(argument.getText()) ||
								literal(argument) ||
								argument.getText(),
						);
				}
				const key = `${file}:${n.expression.text}:${JSON.stringify([...next])}`;
				if (seen.has(key)) return;
				const visited = new Set([...seen, key]);
				for (const selector of openedBy(file, fn, next, visited))
					opened.add(selector);
			}
		});
		return opened;
	};
	return {
		elements: [...elements.values()],
		openings: [...targets].map((selector) => {
			const element = elements.get(selector);
			const openers = [...elements.values()]
				.filter((e) =>
					e.attrs["aria-controls"]?.split(/\s+/).includes(selector.slice(1)),
				)
				.map((e) => ({ selector: e.selector, source: e.source }));
			for (const event of events) {
				const nodes = reachable(event.file, event.handler);
				const parameterized = openedBy(event.file, event.handler);
				const opens = mutations.some(
					(m) =>
						m.file === event.file &&
						selectorFor(m.file, m.receiver) === selector &&
						nodes.has(m.node),
				);
				if (opens || parameterized.has(selector)) {
					const opener =
						event.selector || selectorFor(event.file, event.receiver);
					openers.push({
						selector: opener || `event:${event.receiver}`,
						source: event.source,
					});
				}
			}
			return {
				...element,
				kind:
					element.tag === "dialog"
						? "dialog"
						: element.attrs.role || "disclosure",
				openers,
			};
		}),
	};
}

export function extractDependencies(text, file) {
	const ast = ts.createSourceFile(
		file,
		text,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.JS,
	);
	const params = new Set();
	walk(ast, (n) => {
		if (
			ts.isVariableDeclaration(n) &&
			n.initializer
				?.getText(ast)
				.includes("new URLSearchParams(location.search)")
		)
			params.add(n.name.getText(ast));
	});
	const lookup = (n) =>
		ts.isCallExpression(n) &&
		ts.isPropertyAccessExpression(n.expression) &&
		params.has(n.expression.expression.getText(ast)) &&
		["get", "has"].includes(n.expression.name.text)
			? { name: literal(n.arguments[0]), method: n.expression.name.text }
			: undefined;
	const result = [];
	walk(ast, (node) => {
		if (!ts.isIfStatement(node) || !node.expression.getText(ast).includes("&&"))
			return;
		const conditions = [];
		walk(node.expression, (n) => {
			const call = lookup(n);
			if (call?.method === "has") conditions.push({ ...call, present: true });
			if (
				ts.isBinaryExpression(n) &&
				[
					ts.SyntaxKind.EqualsEqualsEqualsToken,
					ts.SyntaxKind.EqualsEqualsToken,
				].includes(n.operatorToken.kind)
			) {
				for (const [a, b] of [
					[n.left, n.right],
					[n.right, n.left],
				]) {
					const c = lookup(a);
					if (c && literal(b) !== undefined)
						conditions.push({ ...c, value: literal(b) });
				}
			}
		});
		for (const c of conditions.filter((c) => c.value !== undefined)) {
			const requires = conditions
				.filter((other) => other.name !== c.name)
				.map(({ name, value, present }) => ({
					name,
					...(present ? { present: true } : { value }),
				}));
			if (requires.length)
				result.push({
					switch: c.name,
					value: c.value,
					requires,
					source: { file, line: lineAt(text, node.getStart()) },
				});
		}
	});
	return result;
}
