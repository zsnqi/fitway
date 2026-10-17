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
export function maskStrings(value) {
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
export function selectors(text, offset = 0) {
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
export function normalize(selector) {
	return selector
		.trim()
		.replace(/\s+/g, " ")
		.replace(/\s*([>+~])\s*/g, "$1");
}
export function parseCss(source, file) {
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
// Split Boolean queries / selector compounds without splitting functions or attributes.
export function splitOutside(text, separator) {
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
export function functionEnd(text, open) {
	let depth = 1;
	for (let i = open + 1; i < text.length; i++) {
		if (text[i] === "(") depth++;
		else if (text[i] === ")" && --depth === 0) return i;
	}
	return text.length;
}
