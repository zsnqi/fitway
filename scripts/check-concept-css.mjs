import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const RULES = [
	"ungated-hover",
	"transition-all",
	"ease-in",
	"outline-without-ring",
	"focus-ring",
];

// Keep offsets intact: diagnostics refer to the original file, including CRLF.
function maskComments(source) {
	const comments = [];
	let masked = "";
	let quote = "";
	for (let i = 0; i < source.length; i++) {
		const c = source[i];
		if (quote) {
			masked += c;
			if (c === "\\") masked += source[++i] ?? "";
			else if (c === quote) quote = "";
		} else if (c === '"' || c === "'") {
			quote = c;
			masked += c;
		} else if (c === "/" && source[i + 1] === "*") {
			const end = source.indexOf("*/", i + 2);
			if (end < 0) throw new Error("Unclosed CSS comment");
			comments.push({ start: i, end: end + 2, text: source.slice(i + 2, end) });
			masked += source.slice(i, end + 2).replace(/[^\r\n]/g, " ");
			i = end + 1;
		} else masked += c;
	}
	if (quote) throw new Error("Unclosed CSS string");
	return { masked, comments };
}

function maskStrings(value) {
	return value.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, (s) =>
		s.replace(/./g, " "),
	);
}

// Delimit only outside strings, escapes, functions and attribute selectors.
function delimiter(source, start, stops) {
	let quote = "";
	let depth = 0;
	for (let i = start; i < source.length; i++) {
		const c = source[i];
		if (c === "\\") {
			i++;
			continue;
		}
		if (quote) {
			if (c === quote) quote = "";
			continue;
		}
		if (c === '"' || c === "'") quote = c;
		else if (c === "(" || c === "[") depth++;
		else if (c === ")" || c === "]") depth--;
		else if (depth === 0 && stops.includes(c)) return i;
	}
	return source.length;
}

function selectors(text, offset = 0) {
	const result = [];
	let start = 0;
	while (start < text.length) {
		const end = delimiter(text, start, ",");
		const part = text.slice(start, end);
		if (part.trim())
			result.push({
				text: part.trim(),
				offset: offset + start + part.search(/\S/),
			});
		start = end + 1;
	}
	return result;
}

function normalize(selector) {
	return selector
		.trim()
		.replace(/\s+/g, " ")
		.replace(/\s*([>+~])\s*/g, "$1");
}

function parseCss(source, file) {
	const { masked, comments } = maskComments(source);
	const rules = [];
	function block(start, parent, media, nested = false) {
		let cursor = start;
		while (cursor < masked.length) {
			while (/\s/.test(masked[cursor] ?? "") && cursor < masked.length)
				cursor++;
			if (masked[cursor] === "}") {
				if (!nested) throw new Error("Unexpected CSS closing brace");
				return cursor + 1;
			}
			if (cursor === masked.length) break;
			const end = delimiter(masked, cursor, ";{}");
			const text = masked.slice(cursor, end).trim();
			if (masked[end] === "{") {
				if (text.startsWith("@")) {
					const nextMedia = /^@media\b/i.test(text) ? [...media, text] : media;
					cursor = block(end + 1, parent, nextMedia, true);
				} else {
					const rawSelectors = selectors(text, cursor);
					const expanded = parent
						? parent.selectors.flatMap((outer) =>
								rawSelectors.map((inner) => ({
									text: inner.text.includes("&")
										? inner.text.replaceAll("&", outer.text)
										: `${outer.text} ${inner.text}`,
									offset: inner.offset,
								})),
							)
						: rawSelectors;
					const rule = {
						file,
						selectors: expanded,
						rawSelectors,
						media,
						declarations: [],
					};
					rules.push(rule);
					cursor = block(end + 1, rule, media, true);
				}
				continue;
			}
			if (parent && text && !text.startsWith("@")) {
				const match = /^([\w-]+)\s*:\s*([\s\S]*)$/.exec(text);
				if (!match) throw new Error(`Unsupported CSS declaration: ${text}`);
				// Inline comments inside the declaration or immediately after its ;
				// belong to this declaration. A comment before it is not an exemption.
				const next = delimiter(masked, end + 1, ";{}");
				const trailingEnd =
					end +
					1 +
					(masked.slice(end + 1, next).match(/^\s*/)?.[0].length ?? 0);
				parent.declarations.push({
					property: match[1].startsWith("--")
						? match[1]
						: match[1].toLowerCase(),
					value: match[2].replace(/\s*!important\s*$/i, "").trim(),
					important: /!important\s*$/i.test(match[2]),
					offset: cursor,
					comments: comments.filter(
						(c) => c.start >= cursor && c.end <= trailingEnd,
					),
				});
			}
			if (end === masked.length) break;
			cursor = masked[end] === "}" ? end : end + 1;
		}
		if (nested) throw new Error("Unclosed CSS block");
		return cursor;
	}
	block(0, null, []);
	return rules;
}

const focusPseudo = /:(?:focus-visible|focus-within|focus)(?![\w-])/g;
function positiveFocus(selector) {
	// Remove negated selector lists before looking for the focus state.
	let text = maskStrings(selector);
	let start = text.indexOf(":not(");
	while (start >= 0) {
		let end = start + 5;
		let depth = 1;
		while (end < text.length && depth) {
			if (text[end] === "(") depth++;
			else if (text[end] === ")") depth--;
			end++;
		}
		text = text.slice(0, start) + " ".repeat(end - start) + text.slice(end);
		start = text.indexOf(":not(");
	}
	return [...text.matchAll(focusPseudo)];
}
function focusBase(selector) {
	// A focus on an ancestor/child is a moved ring, not the same element.
	const bare = maskStrings(selector);
	const matches = positiveFocus(selector);
	if (!matches.length) return null;
	for (const match of matches) {
		const suffix = bare.slice(match.index + match[0].length);
		const prefix = bare.slice(0, match.index);
		if (
			/^[^)]*[>+~\s]/.test(suffix) ||
			[...prefix].reduce(
				(depth, c) => depth + (c === "(" ? 1 : c === ")" ? -1 : 0),
				0,
			) !== 0
		)
			return null;
	}
	return normalize(selector.replace(focusPseudo, ""));
}

// Split Boolean queries / selector compounds without splitting functions or attributes.
function splitOutside(text, separator) {
	const masked = maskStrings(text);
	const parts = [];
	let depth = 0;
	let start = 0;
	for (let i = 0; i < masked.length; i++) {
		if (masked[i] === "\\") {
			i++;
			continue;
		}
		if (masked[i] === "(" || masked[i] === "[") depth++;
		else if (masked[i] === ")" || masked[i] === "]") depth--;
		else if (!depth) {
			const match = separator.exec(masked.slice(i));
			if (match) {
				parts.push(text.slice(start, i).trim());
				i += match[0].length - 1;
				start = i + 1;
			}
		}
	}
	parts.push(text.slice(start).trim());
	return parts.filter(Boolean);
}

function functionEnd(text, open) {
	let depth = 1;
	for (let i = open + 1; i < text.length; i++) {
		if (text[i] === "(") depth++;
		else if (text[i] === ")" && --depth === 0) return i;
	}
	return text.length;
}

function hoverOnly(query) {
	const text = query.replace(/^@media\s+/i, "").trim();
	// A leading media-type `not` negates the whole query, including its hover test.
	if (/^not\b/i.test(text)) return false;
	for (const separator of [/^,/, /^\s+or\s+/i]) {
		const alternatives = splitOutside(text, separator);
		if (alternatives.length > 1) return alternatives.every(hoverOnly);
	}
	const terms = splitOutside(text, /^\s+and\s+/i);
	if (terms.length > 1) return terms.some(hoverOnly);
	if (/^\(\s*(?:hover|any-hover)\s*:\s*hover\s*\)$/i.test(text)) return true;
	if (text[0] === "(" && functionEnd(text, 0) === text.length - 1)
		return hoverOnly(text.slice(1, -1));
	return false;
}

function programmaticSubject(selector) {
	const subject = splitOutside(selector, /^(?:\s+|[>+~])/).at(-1) ?? "";
	// Only an attribute on the subject is proof; ancestors and selector alternatives
	// do not restrict this element to programmatic focus.
	const masked = maskStrings(subject);
	for (let i = 0; i < subject.length; i++) {
		if (masked[i] === "(") i = functionEnd(masked, i);
		else if (masked[i] === "[") {
			const end = masked.indexOf("]", i + 1);
			if (end < 0) return false;
			if (
				/^\[\s*tabindex\s*=\s*(?:"-1"|'-1'|-1)\s*(?:[is]\s*)?\]$/i.test(
					subject.slice(i, end + 1),
				)
			)
				return true;
			i = end;
		}
	}
	return false;
}

function ancestorFocusBases(selector) {
	const subject = splitOutside(selector, /^(?:\s+|[>+~])/).at(-1) ?? "";
	const masked = maskStrings(subject);
	const start = masked.indexOf(":has(");
	if (
		start < 0 ||
		[...masked.slice(0, start)].reduce(
			(depth, c) => depth + (c === "(" ? 1 : c === ")" ? -1 : 0),
			0,
		)
	)
		return [];
	const end = functionEnd(masked, start + 4);
	const relatives = selectors(subject.slice(start + 5, end)).map(
		({ text }) => text,
	);
	// Every alternative must require this control's focus. Sibling :has() rules do
	// not draw an ancestor ring, and a trailing descendant paints a different subject.
	if (
		!relatives.length ||
		relatives.some(
			(relative) =>
				/^[+~]/.test(relative) ||
				focusBase(relative.replace(/^>\s*/, "")) === null ||
				!positiveFocus(relative).some((m) =>
					/^:(?:focus-visible|focus)$/.test(m[0]),
				),
		)
	)
		return [];
	const ancestor = normalize(
		selector.slice(0, selector.lastIndexOf(subject)) +
			subject.slice(0, start) +
			subject.slice(end + 1),
	);
	return relatives.flatMap((relative) => {
		const child = focusBase(relative.replace(/^>\s*/, ""));
		return [
			child,
			normalize(`${ancestor}${relative.startsWith(">") ? ">" : " "}${child}`),
		];
	});
}

function focusPaintBase(selector) {
	// Moved paint still has a resting subject: `.button .tile` or `.wrapper`.
	let text = selector;
	let start = text.indexOf(":has(");
	while (start >= 0) {
		const end = functionEnd(maskStrings(text), start + 4);
		if (positiveFocus(text.slice(start + 5, end)).length)
			text = text.slice(0, start) + text.slice(end + 1);
		else start = end + 1;
		start = text.indexOf(":has(", start);
	}
	return normalize(text.replace(focusPseudo, ""));
}

function removesOutline(property, value) {
	const zero = /^[+-]?(?:0+(?:\.0*)?|\.0+)(?:[a-z%]+)?$/i;
	if (property === "outline-width") return zero.test(value);
	if (property === "outline-style") return /^(?:none|hidden)$/i.test(value);
	if (property !== "outline") return false;
	// Ignore colour/function arguments: a zero alpha or RGB channel is not a width.
	return value
		.replace(/[\w-]+\([^)]*\)/g, "fn")
		.split(/\s+/)
		.some((token) => /^(?:none|hidden)$/i.test(token) || zero.test(token));
}

function visible(value) {
	return (
		value &&
		!/^(?:none|[+-]?(?:0+(?:\.0*)?|\.0+)(?:[a-z%]+)?|initial|unset|inherit)$/i.test(
			value,
		) &&
		!/(?<![\w-])(?:none|hidden|transparent)(?![\w-])/i.test(value) &&
		!/#(?:[\da-f]{3}0|[\da-f]{6}00)(?![\da-f])/i.test(value) &&
		!/(?:rgba|hsla)\([^)]*,\s*0(?:\.0*)?\s*\)|\/\s*0(?:\.0*)?\s*\)/i.test(value)
	);
}

function hasRing(rule, expand = (value) => value) {
	const values = new Map();
	for (const d of rule.declarations) {
		if (
			d.property === "outline" ||
			/^border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?$/.test(
				d.property,
			)
		) {
			for (const key of values.keys())
				if (key.startsWith(`${d.property}-`)) values.delete(key);
		}
		values.set(d.property, expand(d.value));
	}
	const outline = values.get("outline");
	const shadow = values.get("box-shadow");
	if (
		shadow &&
		selectors(shadow).some(({ text }) => {
			const dimensions = text
				.replace(/[\w-]+\([^)]*\)/g, "")
				.split(/\s+/)
				.filter((token) => /^-?(?:\d*\.)?\d+(?:[a-z%]+)?$/i.test(token))
				.map(Number.parseFloat);
			return (
				visible(text) &&
				dimensions.length >= 2 &&
				(dimensions[0] !== 0 ||
					dimensions[1] !== 0 ||
					dimensions[2] > 0 ||
					dimensions[3] > 0)
			);
		})
	)
		return true;
	if (
		visible(outline) &&
		/\b(?:solid|dashed|dotted|double|auto|groove|ridge|inset|outset)\b/i.test(
			outline,
		) &&
		!/(?:^|\s)[+-]?(?:0+(?:\.0*)?|\.0+)(?:[a-z%]+)?(?:\s|$)/i.test(
			outline.replace(/[\w-]+\([^)]*\)/g, "fn"),
		) &&
		visible(values.get("outline-color") ?? "currentColor") &&
		visible(values.get("outline-width") ?? "medium") &&
		visible(values.get("outline-style") ?? "solid")
	)
		return true;
	if (
		visible(values.get("outline-style")) &&
		visible(values.get("outline-width")) &&
		visible(values.get("outline-color") ?? "currentColor")
	)
		return true;
	for (const [property, value] of values) {
		if (
			/^border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?$/.test(
				property,
			) &&
			visible(value) &&
			/\b(?:solid|dashed|dotted|double|groove|ridge|inset|outset)\b/i.test(
				value,
			) &&
			!/(?:^|\s)[+-]?(?:0+(?:\.0*)?|\.0+)(?:[a-z%]+)?(?:\s|$)/i.test(
				value.replace(/[\w-]+\([^)]*\)/g, "fn"),
			) &&
			visible(values.get(`${property}-color`) ?? "currentColor") &&
			visible(values.get(`${property}-width`) ?? "medium") &&
			visible(values.get(`${property}-style`) ?? "solid")
		)
			return true;
		if (
			/^border(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?-style$/.test(
				property,
			)
		) {
			const stem = property.slice(0, -6);
			if (
				visible(value) &&
				visible(values.get(`${stem}-width`)) &&
				visible(values.get(`${stem}-color`) ?? "currentColor")
			)
				return true;
		}
	}
	return false;
}

function focusClass(selector) {
	return /\.is-(?:spec-)?focus(?![\w-])/i.test(maskStrings(selector));
}

function focusRingDeclarations(rule, expand) {
	if (
		!rule.selectors.some(
			(selector) =>
				positiveFocus(selector.text).length > 0 || focusClass(selector.text),
		)
	)
		return [];
	return rule.declarations.filter(
		(declaration) =>
			declaration.property === "outline" &&
			hasRing({ declarations: [declaration] }, expand),
	);
}

function hasEaseIn(value) {
	if (/(?<![\w-])ease-in(?![\w-])/i.test(value)) return true;
	return [...value.matchAll(/cubic-bezier\(\s*([^)]*)\)/gi)].some((match) => {
		const numbers = match[1].split(",").map((s) => Number(s.trim()));
		return (
			numbers.length === 4 && numbers.every((n, i) => n === [0.42, 0, 1, 1][i])
		);
	});
}

/** Static source lint, not a browser cascade or visibility proof.
 * Moved rings: outline: none; /* focus-ring: .button:focus-visible .tile *\/
 * The exact named selector must exist and set a visible outline/shadow/border.
 */
export function lintSources(sources) {
	const rules = sources.flatMap(({ css, file }) => parseCss(css, file));
	const findings = [];
	const sourceByFile = new Map(sources.map((s) => [s.file, s.css]));
	const tokens = new Map();
	for (const rule of rules)
		for (const d of rule.declarations) {
			if (d.property.startsWith("--")) {
				const values = tokens.get(d.property) ?? new Set();
				values.add(d.value);
				tokens.set(d.property, values);
			}
		}
	function expand(value, seen = new Set()) {
		return value.replace(
			/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g,
			(_, name, fallback) => {
				if (seen.has(name)) return "";
				return [...(tokens.get(name) ?? []), fallback ?? ""]
					.map((v) => expand(v, new Set([...seen, name])))
					.join(" ");
			},
		);
	}
	const focusRings = new Map();
	function hasFocusRing(rule, selector) {
		if (focusRings.has(selector)) return focusRings.get(selector);
		if (!positiveFocus(selector.text).length) return false;
		const base = focusBase(selector.text) ?? focusPaintBase(selector.text);
		const baseline = rules
			.filter(
				(r) =>
					r.media.join("\n") === rule.media.join("\n") &&
					r.selectors.some(
						(s) => !positiveFocus(s.text).length && normalize(s.text) === base,
					),
			)
			.flatMap((r) => r.declarations);
		// A focus rule may inherit border geometry, but repeating the permanent
		// decoration does not visibly change it. Compare each kind of paint separately
		// so removing an outline cannot turn an unchanged shadow into a focus ring.
		const paints = [/^outline(?:-|$)/, /^border(?:-|$)/, /^box-shadow$/];
		const result = paints.some((paint) => {
			const before = baseline.filter((d) => paint.test(d.property));
			const after = rule.declarations.filter((d) => paint.test(d.property));
			const values = new Map(before.map((d) => [d.property, expand(d.value)]));
			return (
				after.some((d) => values.get(d.property) !== expand(d.value)) &&
				hasRing({ declarations: [...before, ...after] }, expand)
			);
		});
		focusRings.set(selector, result);
		return result;
	}
	const ringRules = rules.filter((rule) =>
		rule.selectors.some((s) => hasFocusRing(rule, s)),
	);
	const styleFiles = new Set(
		sources
			.map(({ file }) => file.replaceAll("\\", "/"))
			.filter((file) => file.endsWith("style.css")),
	);
	const conceptFocusRings = rules.flatMap((rule) =>
		focusRingDeclarations(rule, expand).map((declaration) => ({
			rule,
			declaration,
		})),
	);
	for (const { rule, declaration } of conceptFocusRings) {
		const file = rule.file.replaceAll("\\", "/");
		if (styleFiles.size && !file.endsWith("style.css"))
			finding(
				rule,
				declaration.offset,
				"focus-ring",
				"focus-ring declaration outside style.css",
			);
	}
	if (styleFiles.size) {
		const styleRings = conceptFocusRings.filter(({ rule }) =>
			rule.file.replaceAll("\\", "/").endsWith("style.css"),
		);
		if (styleRings.length !== 1) {
			const first = styleRings[0];
			finding(
				first?.rule ?? { file: "style.css" },
				first?.declaration.offset ?? 0,
				"focus-ring",
				`expected one focus-ring declaration in style.css; found ${styleRings.length}`,
			);
		}
	}
	function finding(rule, offset, id, detail) {
		const line = sourceByFile
			.get(rule.file)
			.slice(0, offset)
			.split("\n").length;
		findings.push({
			file: rule.file,
			line,
			rule: id,
			detail: detail.replace(/\s+/g, " "),
		});
	}
	for (const rule of rules) {
		if (!rule.media.some(hoverOnly)) {
			for (const selector of rule.rawSelectors) {
				if (/:hover(?![\w-])/i.test(maskStrings(selector.text)))
					finding(rule, selector.offset, "ungated-hover", selector.text);
			}
		}
		for (const d of rule.declarations) {
			const value = maskStrings(expand(d.value));
			if (
				["transition", "transition-property"].includes(d.property) &&
				/(?<![\w-])all(?![\w-])/i.test(value)
			)
				finding(rule, d.offset, "transition-all", `${d.property}: ${d.value}`);
			if (
				[
					"transition",
					"transition-timing-function",
					"animation",
					"animation-timing-function",
				].includes(d.property) &&
				hasEaseIn(value)
			)
				finding(rule, d.offset, "ease-in", `${d.property}: ${d.value}`);
			if (!removesOutline(d.property, value)) continue;
			const moved = d.comments.flatMap((c) =>
				[...c.text.matchAll(/focus-ring:\s*([^\r\n]+)/g)].map((m) =>
					normalize(m[1]),
				),
			);
			const declaredRing = moved.some((selector) =>
				ringRules.some((r) =>
					r.selectors.some(
						(s) => normalize(s.text) === selector && hasFocusRing(r, s),
					),
				),
			);
			const uncovered = rule.selectors.filter((selector) => {
				if (programmaticSubject(selector.text) || declaredRing) return false;
				// A base border/shadow is decoration. An outline restored in the same
				// rule, or a ring actually painted in a focus state, can replace removal.
				if (
					hasRing(
						{
							declarations: rule.declarations.filter((item) =>
								item.property.startsWith("outline"),
							),
						},
						expand,
					) ||
					(focusBase(selector.text) !== null && hasFocusRing(rule, selector))
				)
					return false;
				const base = focusBase(selector.text) ?? normalize(selector.text);
				return !ringRules.some((r) =>
					r.selectors.some((s) => {
						if (!hasFocusRing(r, s)) return false;
						if (ancestorFocusBases(s.text).includes(base)) return true;
						const candidateBase = focusBase(s.text);
						if (candidateBase === base) {
							if (
								r.file === rule.file &&
								normalize(s.text) === normalize(selector.text) &&
								r.declarations.every(
									(replacement) => replacement.offset < d.offset,
								)
							)
								return false;
							if (
								d.important &&
								!r.declarations.some((replacement) => replacement.important)
							)
								return false;
							return true;
						}
						// A universal focus outline can replace a simple base removal.
						// Cross-file cascade order is unknown, so only prove this within
						// one file. A focused class removal outranks the universal ring.
						if (
							r.file !== rule.file ||
							!["", "*"].includes(candidateBase) ||
							positiveFocus(selector.text).length ||
							d.important
						)
							return false;
						if (!/^(?:\*|[a-z][\w-]*|\.[\w-]+)$/i.test(base)) return false;
						return (
							!base.startsWith(".") ||
							r.declarations.some(
								(replacement) => replacement.offset > d.offset,
							)
						);
					}),
				);
			});
			if (uncovered.length)
				finding(
					rule,
					d.offset,
					"outline-without-ring",
					`${uncovered.map((s) => s.text).join(", ")} { ${d.property}: ${d.value} }; ${
						moved.length
							? moved
									.map(
										(selector) =>
											`declared focus-ring: ${selector} draws no visible ring`,
									)
									.join("; ")
							: "no focus ring"
					}`,
				);
		}
	}
	findings.sort(
		(a, b) =>
			a.file.localeCompare(b.file) ||
			a.line - b.line ||
			RULES.indexOf(a.rule) - RULES.indexOf(b.rule),
	);
	return findings;
}

export async function inspectFolder(folder) {
	const root = path.resolve(folder);
	if (!(await stat(root)).isDirectory())
		throw new Error(`Not a folder: ${root}`);
	const sources = [];
	async function visit(directory) {
		const entries = (await readdir(directory, { withFileTypes: true })).sort(
			(a, b) => a.name.localeCompare(b.name),
		);
		for (const entry of entries) {
			const absolute = path.join(directory, entry.name);
			if (entry.isDirectory()) await visit(absolute);
			else if (entry.isFile() && /\.css$/i.test(entry.name))
				sources.push({
					file: path.relative(root, absolute).split(path.sep).join("/"),
					css: await readFile(absolute, "utf8"),
				});
		}
	}
	await visit(root);
	return { root, files: sources.length, findings: lintSources(sources) };
}

export async function main(args = process.argv.slice(2), write = console.log) {
	const folders = args.filter((arg) => arg !== "--");
	if (folders.length !== 1)
		throw new Error(
			"Usage: pnpm check:concept-css -- <folder>\nMoved ring declaration: outline: none; /* focus-ring: .button:focus-visible .tile */",
		);
	const result = await inspectFolder(folders[0]);
	if (!result.files) {
		write(`NO_CSS: ${result.root} (no CSS files; not a pass)`);
		return 2;
	}
	for (const f of result.findings)
		write(`${f.file}:${f.line}: ${f.rule}: ${f.detail}`);
	for (const id of RULES)
		write(
			`COUNT ${id}: ${result.findings.filter((f) => f.rule === id).length}`,
		);
	write(
		`${result.findings.length ? "FAIL" : "PASS"}: ${result.files} CSS files, ${result.findings.length} findings`,
	);
	return result.findings.length ? 1 : 0;
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
	main()
		.then((code) => {
			process.exitCode = code;
		})
		.catch((error) => {
			console.error(`ERROR: ${error.message}`);
			process.exitCode = 2;
		});
}
