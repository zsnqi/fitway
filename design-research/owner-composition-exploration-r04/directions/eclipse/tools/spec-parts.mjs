// The ordered parts of the Eclipse concept's two specs, and one reader for them. DESIGN-SPEC.md and SETTINGS-SPEC.md are
// an index (their first lines and a "## Parts" list) followed, in spec/, by the parts that hold the sections. Every tool
// that reads a spec reads it through readParts, so a part moved or split changes this list and nothing else.
import { readFileSync } from "node:fs";

const eclipse = new URL("../", import.meta.url);

export const specs = {
	design: {
		file: "DESIGN-SPEC.md",
		parts: [
			{ path: "spec/design-01-how-to-read.md" },
			{ path: "spec/design-02-foundations-1-9.md" },
			{ path: "spec/design-03-foundations-10-11.md" },
			{ path: "spec/design-04-content-rules.md" },
			{ path: "spec/design-05-components-1-3.md" },
			{ path: "spec/design-06-components-4-8.md" },
			{ path: "spec/design-07-components-9-15.md" },
			{ path: "spec/design-08-owner-today-reports.md" },
			{ path: "spec/design-09-owner-activity.md" },
			{ path: "spec/design-10-owner-access.md" },
			{ path: "spec/design-11-staff-public-issues.md" },
			{ path: "spec/design-12-open-questions.md" },
		],
	},
	settings: {
		file: "SETTINGS-SPEC.md",
		parts: [
			{ path: "spec/settings-1.md" },
			// Continues the table settings-1.md opens, so it repeats the table's two header lines after its own header.
			{ path: "spec/settings-2.md", continued: true },
			{ path: "spec/settings-3.md" },
		],
	},
};

export const partHeader = (file) => `<!-- Part of ${file}; the index and the rule for editing are in ${file}. -->`;
export const tableHeader = ["| Id | L | Entry |", "| --- | --- | --- |"];
export const partsHeading = "## Parts";

// The index file's own lines, before its "## Parts" section: the text the parts are appended to.
export function readIndexHead(name) {
	const { file } = specs[name];
	const source = readFileSync(new URL(file, eclipse), "utf8");
	const at = source.indexOf(`\n${partsHeading}\n`);
	if (at < 0) throw new Error(`${file} has no "${partsHeading}" section`);
	return source.slice(0, at + 1);
}

// Each part's moved text, without its two header lines (and, for a continued table, the two copied header lines),
// with its path and the line of the part file the moved text starts at. Joining the texts after readIndexHead gives the
// original file.
export function readParts(name) {
	const { file, parts } = specs[name];
	return parts.map(({ path, continued }) => {
		const lines = readFileSync(new URL(path, eclipse), "utf8").split("\n");
		const head = [partHeader(file), ""];
		if (continued) head.push(...tableHeader);
		head.forEach((expected, index) => {
			if (lines[index] !== expected) throw new Error(`${path} line ${index + 1}: expected ${JSON.stringify(expected)}`);
		});
		return { path, line: head.length + 1, text: lines.slice(head.length).join("\n") };
	});
}
