import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
	beginToolCommand,
	toolFailure,
} from "./agent-environment/tool-contract.mjs";
import {
	functionEnd,
	maskStrings,
	normalize,
	parseCss,
	selectors,
	splitOutside,
} from "./concept-css-parse.mjs";
export const RULES = [
	"ungated-hover",
	"transition-all",
	"ease-in",
	"outline-without-ring",
	"focus-ring",
];
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
function hasEaseIn(value) {
	if (/(?<![\w-])ease-in(?![\w-])/i.test(value)) return true;
	return [...value.matchAll(/cubic-bezier\(\s*([^)]*)\)/gi)].some((match) => {
		const numbers = match[1].split(",").map((s) => Number(s.trim()));
		return (
			numbers.length === 4 && numbers.every((n, i) => n === [0.42, 0, 1, 1][i])
		);
	});
}
const FOCUS_PAINTS = [/^outline(?:-|$)/, /^border(?:-|$)/, /^box-shadow$/];
function createFocusRingAnalyzer(rules, expand) {
	const cache = new Map();
	const hasFocusRing = (rule, selector) => {
		if (cache.has(selector)) return cache.get(selector);
		if (!positiveFocus(selector.text).length) return false;
		const base = focusBase(selector.text) ?? focusPaintBase(selector.text);
		const baseline = rules
			.filter(
				(item) =>
					item.media.join("\n") === rule.media.join("\n") &&
					item.selectors.some(
						(candidate) =>
							!positiveFocus(candidate.text).length &&
							normalize(candidate.text) === base,
					),
			)
			.flatMap((candidate) => candidate.declarations);
		const result = FOCUS_PAINTS.some((paint) => {
			const before = baseline.filter((declaration) =>
				paint.test(declaration.property),
			);
			const old = new Map(
				before.map((declaration) => [
					declaration.property,
					expand(declaration.value),
				]),
			);
			const after = rule.declarations.filter((declaration) =>
				paint.test(declaration.property),
			);
			return (
				after.some(
					(declaration) =>
						old.get(declaration.property) !== expand(declaration.value),
				) && hasRing({ declarations: [...before, ...after] }, expand)
			);
		});
		cache.set(selector, result);
		return result;
	};
	return {
		hasFocusRing,
		ringRules: rules.filter((item) =>
			item.selectors.some((selector) => hasFocusRing(item, selector)),
		),
	};
}
function collectFocusRingFindings(rules, expand, finding) {
	const groups = new Map();
	for (const rule of rules)
		for (const selector of rule.selectors) {
			if (!positiveFocus(selector.text).length && !focusClass(selector.text))
				continue;
			const key = [
				rule.file,
				rule.media.join("\n"),
				normalize(selector.text),
			].join("\0");
			const entries = groups.get(key) ?? [];
			entries.push(
				...rule.declarations
					.filter(({ property }) => property.startsWith("outline"))
					.map((declaration) => ({ rule, declaration })),
			);
			groups.set(key, entries);
		}
	const rings = new Map();
	for (const entries of groups.values()) {
		const declarations = entries.map(({ declaration }) => declaration);
		if (!hasRing({ declarations }, expand)) continue;
		const key = [...new Set(entries.map(({ rule }) => rule))]
			.map((rule) => `${rule.file}\0${rule.declarations[0]?.offset ?? 1}`)
			.sort()
			.join("\0");
		if (rings.has(key)) continue;
		const ring =
			entries.find(
				({ declaration }) => declaration.property !== "outline-offset",
			) ?? entries[0];
		rings.set(key, ring);
	}
	const styleRings = [...rings.values()].filter(
		(entry) => entry.rule.file.replaceAll("\\", "/") === "style.css",
	);
	for (const entry of rings.values())
		if (!styleRings.includes(entry))
			finding(
				entry.rule,
				entry.declaration.offset,
				"focus-ring",
				"focus-ring declaration outside style.css",
			);
	if (styleRings.length !== 1) {
		const first = styleRings[0];
		finding(
			first?.rule ?? { file: "style.css", line: 1 },
			first?.declaration.offset ?? 0,
			"focus-ring",
			`expected one focus-ring declaration in style.css; found ${styleRings.length}`,
		);
	}
}
function movedFocusSelectors(declaration) {
	return declaration.comments.flatMap((comment) =>
		[...comment.text.matchAll(/focus-ring:\s*([^\r\n]+)/g)].map((match) =>
			normalize(match[1]),
		),
	);
}
function focusRingIsReplaced(
	rule,
	selector,
	declaration,
	ringRules,
	hasFocusRing,
) {
	const base = focusBase(selector.text) ?? normalize(selector.text);
	for (const ringRule of ringRules)
		for (const ringSelector of ringRule.selectors) {
			if (!hasFocusRing(ringRule, ringSelector)) continue;
			if (ancestorFocusBases(ringSelector.text).includes(base)) return true;
			const candidateBase = focusBase(ringSelector.text);
			if (candidateBase === base) {
				const same =
					ringRule.file === rule.file &&
					normalize(ringSelector.text) === normalize(selector.text);
				if (
					same &&
					ringRule.declarations.every(
						(replacement) => replacement.offset < declaration.offset,
					)
				)
					continue;
				return (
					!declaration.important ||
					ringRule.declarations.some((replacement) => replacement.important)
				);
			}
			if (
				ringRule.file !== rule.file ||
				!["", "*"].includes(candidateBase) ||
				positiveFocus(selector.text).length ||
				declaration.important
			)
				continue;
			if (!/^(?:\*|[a-z][\w-]*|\.[\w-]+)$/i.test(base)) continue;
			if (
				!base.startsWith(".") ||
				ringRule.declarations.some(
					(replacement) => replacement.offset > declaration.offset,
				)
			)
				return true;
		}
	return false;
}
function collectOutlineFindings(
	rules,
	expand,
	hasFocusRing,
	ringRules,
	finding,
) {
	for (const rule of rules) {
		const outlineDeclarations = rule.declarations.filter((declaration) =>
			declaration.property.startsWith("outline"),
		);
		for (const declaration of rule.declarations) {
			const value = maskStrings(expand(declaration.value));
			if (!removesOutline(declaration.property, value)) continue;
			const moved = movedFocusSelectors(declaration);
			const declaredRing = moved.some((selector) =>
				ringRules.some((ringRule) =>
					ringRule.selectors.some(
						(candidate) =>
							normalize(candidate.text) === selector &&
							hasFocusRing(ringRule, candidate),
					),
				),
			);
			const uncovered = rule.selectors.filter((selector) => {
				if (programmaticSubject(selector.text) || declaredRing) return false;
				// A base border/shadow is decoration. An outline restored in the same
				// rule, or a ring actually painted in a focus state, can replace removal.
				if (
					hasRing({ declarations: outlineDeclarations }, expand) ||
					(focusBase(selector.text) !== null && hasFocusRing(rule, selector))
				)
					return false;
				return !focusRingIsReplaced(
					rule,
					selector,
					declaration,
					ringRules,
					hasFocusRing,
				);
			});
			if (uncovered.length) {
				const detail = `${uncovered.map((selector) => selector.text).join(", ")} { ${declaration.property}: ${declaration.value} }; ${
					moved
						.map(
							(selector) =>
								`declared focus-ring: ${selector} draws no visible ring`,
						)
						.join("; ") || "no focus ring"
				}`;
				finding(rule, declaration.offset, "outline-without-ring", detail);
			}
		}
	}
}
function collectRuleFindings(rules, expand, finding) {
	for (const rule of rules) {
		if (!rule.media.some(hoverOnly))
			for (const selector of rule.rawSelectors)
				if (/:hover(?![\w-])/i.test(maskStrings(selector.text)))
					finding(rule, selector.offset, "ungated-hover", selector.text);
		for (const declaration of rule.declarations) {
			const value = maskStrings(expand(declaration.value));
			if (
				["transition", "transition-property"].includes(declaration.property) &&
				/(?<![\w-])all(?![\w-])/i.test(value)
			)
				finding(
					rule,
					declaration.offset,
					"transition-all",
					`${declaration.property}: ${declaration.value}`,
				);
			if (
				[
					"transition",
					"transition-timing-function",
					"animation",
					"animation-timing-function",
				].includes(declaration.property) &&
				hasEaseIn(value)
			)
				finding(
					rule,
					declaration.offset,
					"ease-in",
					`${declaration.property}: ${declaration.value}`,
				);
		}
	}
}
// Static source lint: a moved-ring comment must name a selector that paints.
export function lintSources(
	sources,
	{ checkFocusRing = sources.some(({ file }) => file === "style.css") } = {},
) {
	const rules = sources.flatMap(({ css, file }) => parseCss(css, file));
	const findings = [];
	const sourceByFile = new Map(
		sources.map((source) => [source.file, source.css]),
	);
	const tokens = new Map();
	for (const rule of rules)
		for (const declaration of rule.declarations) {
			if (!declaration.property.startsWith("--")) continue;
			const values = tokens.get(declaration.property) ?? new Set();
			values.add(declaration.value);
			tokens.set(declaration.property, values);
		}
	const expand = (value, seen = new Set()) =>
		value.replace(
			/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g,
			(_, name, fallback) => {
				if (seen.has(name)) return "";
				return [...(tokens.get(name) ?? []), fallback ?? ""]
					.map((item) => expand(item, new Set([...seen, name])))
					.join(" ");
			},
		);
	const finding = (rule, offset, id, detail) => {
		const source = sourceByFile.get(rule.file);
		const line =
			source === undefined
				? (rule.line ?? 1)
				: source.slice(0, offset).split("\n").length;
		findings.push({
			file: rule.file,
			line,
			rule: id,
			detail: detail.replace(/\s+/g, " "),
		});
	};
	const { hasFocusRing, ringRules } = createFocusRingAnalyzer(rules, expand);
	if (checkFocusRing) collectFocusRingFindings(rules, expand, finding);
	collectRuleFindings(rules, expand, finding);
	collectOutlineFindings(rules, expand, hasFocusRing, ringRules, finding);
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
	return {
		root,
		files: sources.length,
		findings: lintSources(sources, { checkFocusRing: true }),
	};
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
	beginToolCommand("check:concept-css", process.argv.slice(2));
	main()
		.then((code) => {
			process.exitCode = code;
		})
		.catch((error) => {
			const startup = /ENOENT|ENOTDIR|EISDIR|Usage:/i.test(error.message);
			console.error(
				startup
					? toolFailure(
							"check:concept-css",
							`ERROR: ${error.message}`,
							/ENOENT|ENOTDIR|EISDIR/i.test(error.message)
								? "pass an existing folder; Usage: pnpm check:concept-css -- <folder>"
								: "Usage: pnpm check:concept-css -- <folder>; moved ring declaration: outline: none; /* focus-ring: .button:focus-visible .tile */",
						)
					: `ERROR: ${error.message}`,
			);
			process.exitCode = 2;
		});
}
