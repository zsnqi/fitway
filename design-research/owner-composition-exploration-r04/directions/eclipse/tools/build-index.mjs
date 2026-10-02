import { readFile, writeFile } from "node:fs/promises";

const eclipse = new URL("../", import.meta.url);
const files = ["DESIGN-SPEC.md", "app.js", "components.js", "reports.js", "tuner.js"];
const command =
	"node design-research/owner-composition-exploration-r04/directions/eclipse/tools/build-index.mjs";
const identifier = /^[A-Za-z_$][\w$]*$/;

// A small lexer, not an evaluator: comments and literals cannot introduce declarations.
// Template interpolations are skipped with their template; they are expression scopes.
function tokenize(source) {
	let position = 0;
	let line = 1;
	const tokens = [];
	const regexKeywords = new Set([
		"return", "throw", "case", "typeof", "void", "delete", "yield", "await", "in", "of",
	]);
	function advance(end) {
		line += source.slice(position, end).split("\n").length - 1;
		position = end;
	}
	function quoted(quote) {
		advance(position + 1);
		while (position < source.length) {
			const character = source[position];
			if (character === "\\") advance(position + 2);
			else if (character === quote) {
				advance(position + 1);
				return;
			} else if (quote === "`" && source.startsWith("${", position)) {
				advance(position + 2);
				let depth = 1;
				let previous;
				while (depth && position < source.length) {
					const token = next(previous);
					if (!token) break;
					if (token.value === "{") depth++;
					if (token.value === "}") depth--;
					previous = token;
				}
				if (depth) throw new Error("Unclosed template interpolation");
			} else advance(position + 1);
		}
		throw new Error("Unclosed string or template");
	}
	function next(previous) {
		while (position < source.length) {
			const whitespace = /^\s+/.exec(source.slice(position));
			if (whitespace) advance(position + whitespace[0].length);
			else if (source.startsWith("//", position)) {
				const end = source.indexOf("\n", position);
				advance(end < 0 ? source.length : end);
			} else if (source.startsWith("/*", position)) {
				const end = source.indexOf("*/", position + 2);
				if (end < 0) throw new Error("Unclosed comment");
				advance(end + 2);
			} else break;
		}
		if (position >= source.length) return null;
		const startLine = line;
		const character = source[position];
		if (character === '"' || character === "'" || character === "`") {
			quoted(character);
			return { value: "<literal>", line: startLine, literal: true };
		}
		const canStartRegex =
			!previous ||
			regexKeywords.has(previous.value) ||
			(!previous.literal &&
				!identifier.test(previous.value) &&
				![")", "]", "}", "++", "--"].includes(previous.value));
		if (character === "/" && canStartRegex) {
			advance(position + 1);
			let inClass = false;
			let closed = false;
			while (position < source.length) {
				const current = source[position];
				if (current === "\n" || current === "\r") break;
				if (current === "\\") advance(position + 2);
				else if (current === "/" && !inClass) {
					advance(position + 1);
					closed = true;
					break;
				} else {
					if (current === "[") inClass = true;
					if (current === "]") inClass = false;
					advance(position + 1);
				}
			}
			if (!closed) throw new Error(`Unclosed regular expression at line ${startLine}`);
			const flags = /^[a-z]*/i.exec(source.slice(position))[0];
			advance(position + flags.length);
			return { value: "<literal>", line: startLine, literal: true };
		}
		const word = /^[A-Za-z_$][\w$]*/.exec(source.slice(position));
		const number = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(source.slice(position));
		const operator = /^(?:=>|\+\+|--|\?\.|\*\*|&&|\|\||\?\?)/.exec(source.slice(position));
		const value = word?.[0] ?? number?.[0] ?? operator?.[0] ?? character;
		advance(position + value.length);
		return { value, line: startLine, literal: Boolean(number) };
	}
	let previous;
	while (position < source.length) {
		const token = next(previous);
		if (!token) break;
		tokens.push(token);
		previous = token;
	}
	const stack = [];
	const closing = { ")": "(", "]": "[", "}": "{" };
	for (const [index, token] of tokens.entries()) {
		if (["(", "[", "{"].includes(token.value)) stack.push(index);
		else if (Object.hasOwn(closing, token.value)) {
			const open = stack.pop();
			if (tokens[open]?.value !== closing[token.value]) {
				throw new Error(`Unbalanced delimiter at line ${token.line}`);
			}
			tokens[open].end = index;
		}
	}
	if (stack.length) throw new Error("Unclosed delimiter");
	return tokens;
}

function isFunction(tokens, from, to) {
	while (tokens[from]?.value === "(" && tokens[from].end === to - 1) {
		from++;
		to--;
	}
	if (tokens[from]?.value === "async") from++;
	if (tokens[from]?.value === "function") {
		// A function expression qualifies; an immediately invoked one does not.
		for (let index = from + 1; index < to; index++) {
			if (tokens[index].value === "{") return tokens[index].end === to - 1;
			if (tokens[index].end !== undefined) index = tokens[index].end;
		}
		return false;
	}
	const afterParameters =
		tokens[from]?.value === "(" ? tokens[from].end + 1 : from + 1;
	return (
		(tokens[from]?.value === "(" || identifier.test(tokens[from]?.value ?? "")) &&
		tokens[afterParameters]?.value === "=>"
	);
}

function scriptEntries(source) {
	const tokens = tokenize(source);
	const entries = [];
	function collect(from, to) {
		for (let index = from; index < to; index++) {
			const token = tokens[index];
			if (token.value === "function" || token.value === "class") {
				const name = tokens[index + (tokens[index + 1]?.value === "*" ? 2 : 1)];
				if (name && identifier.test(name.value)) {
					entries.push({ line: token.line, name: name.value, title: token.value });
				}
			} else if (["const", "let", "var"].includes(token.value)) {
				let cursor = index + 1;
				while (cursor < to) {
					const name = tokens[cursor];
					const initializer = cursor + 2;
					while (cursor < to && ![",", ";"].includes(tokens[cursor].value)) {
						cursor = (tokens[cursor].end ?? cursor) + 1;
					}
					if (
						identifier.test(name.value) &&
						tokens[initializer - 1]?.value === "=" &&
						isFunction(tokens, initializer, cursor)
					) {
						entries.push({ line: name.line, name: name.value, title: token.value === "const" ? "function constant" : `function binding (${token.value})` });
					}
					if (tokens[cursor]?.value !== ",") break;
					cursor++;
				}
				index = cursor;
			} else if (token.end !== undefined) index = token.end;
		}
	}
	// These classic scripts use one outer arrow IIFE. Its body is their file scope.
	// Bracket pairs skip nested functions, callbacks, classes, objects and blocks.
	if (tokens.slice(0, 5).map((token) => token.value).join(" ") === "( ( ) => {") {
		collect(5, tokens[4].end);
		collect(tokens[0].end + 1, tokens.length);
	} else collect(0, tokens.length);
	return entries;
}

function shortTitle(text) {
	const plain = text
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/<[^>]*>/g, "")
		.replace(/[`*]/g, "")
		.replace(/\s+/g, " ")
		.trim();
	if (plain.length <= 90) return plain;
	const prefix = plain.slice(0, 87);
	const boundary = prefix.lastIndexOf(" ");
	return `${prefix.slice(0, boundary > 50 ? boundary : prefix.length)}…`;
}

function specEntries(source) {
	const entries = [];
	let fence = null;
	for (const [index, line] of source.split(/\r?\n/).entries()) {
		const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
		if (marker) {
			if (!fence) fence = marker[1];
			else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
			continue;
		}
		if (fence) continue;
		const heading = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
		if (heading) {
			entries.push({ line: index + 1, name: heading[1], title: shortTitle(heading[2]) });
			continue;
		}
		const row = /^\s*\|\s*([A-Z]+(?:-[A-Z]+)*-?[A-Z]*\d+)\s*\|\s*[RCKP]\s*\|\s*((?:\\\||[^|])+)/.exec(line);
		if (row) entries.push({ line: index + 1, name: row[1], title: shortTitle(row[2]) });
	}
	return entries;
}

async function main() {
	const args = process.argv.slice(2);
	if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
		throw new Error(`Usage: ${command} [--check]`);
	}
	const groups = [];
	for (const file of files) {
		const source = await readFile(new URL(file, eclipse), "utf8");
		const entries = file.endsWith(".md") ? specEntries(source) : scriptEntries(source);
		groups.push({ file, entries });
	}
	const lines = [
		"Generated Eclipse navigation index: spec headings and row IDs, plus script functions, classes and named function bindings (const, let, var).",
		`From the repository root, regenerate: \`${command}\`; check: \`${command} --check\`.`,
		"",
		"Script top level includes each outer IIFE's body; nested helpers are excluded. Entries use source line numbers.",
	];
	for (const { file, entries } of groups) {
		lines.push("", `## ${file}`, "");
		for (const entry of entries) {
			lines.push(`- ${file}:${entry.line} — ${entry.name} — ${entry.title}`);
		}
	}
	const expected = `${lines.join("\n")}\n`;
	const target = new URL("INDEX.md", eclipse);
	if (args[0] === "--check") {
		let actual;
		try {
			actual = await readFile(target);
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
			throw new Error(`INDEX.md missing; first stale entry: ${lines.find((line) => line.startsWith("- "))}`);
		}
		if (!actual.equals(Buffer.from(expected, "utf8"))) {
			const actualLines = actual.toString("utf8").split("\n");
			const expectedLines = expected.split("\n");
			const mismatch = expectedLines.findIndex((line, index) => line !== actualLines[index]);
			const at = mismatch < 0 ? expectedLines.length : mismatch;
			const wanted = expectedLines.slice(at).find((line) => line.startsWith("- "));
			const found = actualLines.slice(at).find((line) => line.startsWith("- "));
			throw new Error(
				`INDEX.md stale at index line ${at + 1}; first stale entry: expected ${wanted ?? "end of index"}; found ${found ?? "end of index"}`,
			);
		}
		console.log("INDEX.md is current (exit 0).");
	} else {
		await writeFile(target, expected, "utf8");
		console.log(`Wrote INDEX.md (${Buffer.byteLength(expected)} bytes, LF, no timestamps).`);
	}
	for (const { file, entries } of groups) console.log(`${file}: ${entries.length} entries`);
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
