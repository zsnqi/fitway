// Print one full standing decision by following the milestone resume point and its index.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { repositoryRoot } from "./codex-environment.mjs";
import { createPathReferenceResolver } from "./path-reference.mjs";
import { repositoryPath } from "./resume-point.mjs";
import {
	beginToolCommand,
	ToolStartupError,
	toolStartupLine,
} from "./tool-contract.mjs";

const HANDOFFS = "docs/phase-records/handoffs";

async function findResume(root, milestoneId) {
	const filename = `${milestoneId}-resume.md`;
	let found = null;
	async function visit(directory) {
		let entries;
		try {
			entries = await readdir(directory, { withFileTypes: true });
		} catch (error) {
			if (error.code === "ENOENT") return;
			throw error;
		}
		for (const entry of entries) {
			const absolute = path.join(directory, entry.name);
			if (entry.isDirectory()) await visit(absolute);
			else if (entry.isFile() && entry.name === filename) found ??= absolute;
		}
	}
	await visit(path.join(root, ...HANDOFFS.split("/")));
	return found;
}

function standingLine(text) {
	return text.match(/^- \*\*Standing decisions:\*\*[^\r\n]*$/m)?.[0] ?? null;
}

async function decisionFiles(root, line) {
	const resolver = createPathReferenceResolver(root);
	const files = [];
	for (const match of line.matchAll(/`([^`\r\n]+)`/g)) {
		const reference = await resolver.reference(match[1], { allowBare: true });
		if (
			reference &&
			path.posix.basename(reference.file) === "DECISIONS.md" &&
			!files.includes(reference.file)
		)
			files.push(reference.file);
	}
	return files;
}

function highestItem(text) {
	let highest = 0;
	for (const match of text.matchAll(/^(\d+)\. /gm))
		highest = Math.max(highest, Number(match[1]));
	return highest;
}

function itemAt(text, number) {
	const start = text.search(new RegExp(`^${number}\\. `, "m"));
	if (start === -1) return null;
	const startLine = text.indexOf("\n", start);
	const boundary = /^(?:\d+\. |#{1,6}[ \t])/gm;
	boundary.lastIndex = startLine === -1 ? text.length : startLine + 1;
	const next = boundary.exec(text);
	return text.slice(start, next?.index ?? text.length);
}

function partReference(item) {
	if (item.trimEnd().split(/\r?\n/).length !== 1) return null;
	const paths = [...item.matchAll(/`([^`\r\n]+\.md)`/g)].map(
		(match) => match[1],
	);
	return paths.at(-1) ?? null;
}

function relative(root, absolute) {
	return path.relative(root, absolute).replaceAll("\\", "/");
}

function failure(milestoneId, number, detail, highest) {
	return new Error(
		`decision: FAIL: milestone "${milestoneId}" item ${number}: ${detail}; highest item number there is ${highest || "none"}.`,
	);
}

async function fileText(root, relativePath, milestoneId, number, highest) {
	let details;
	try {
		details = await repositoryPath(root, relativePath);
	} catch {
		throw failure(
			milestoneId,
			number,
			`decisions file not found: ${relativePath}`,
			highest,
		);
	}
	return readFile(details.absolute, "utf8");
}

export async function readDecision(
	milestoneId,
	number,
	{ repositoryRoot: root = repositoryRoot } = {},
) {
	const resume = await findResume(root, milestoneId);
	if (!resume)
		throw new Error(
			`decision: FAIL: milestone "${milestoneId}" looked for ${HANDOFFS}/${milestoneId}-resume.md; highest item number there is none.`,
		);
	const resumeText = await readFile(resume, "utf8");
	const line = standingLine(resumeText);
	if (!line)
		throw new Error(
			`decision: FAIL: milestone "${milestoneId}" has no Standing decisions line; highest item number there is none.`,
		);
	const files = await decisionFiles(root, line);
	if (files.length === 0)
		throw new Error(
			`decision: FAIL: milestone "${milestoneId}" Standing decisions line names no DECISIONS.md file; highest item number there is none.`,
		);

	let highest = 0;
	for (const file of files) {
		const text = await fileText(root, file, milestoneId, number, highest);
		highest = Math.max(highest, highestItem(text));
		const item = itemAt(text, number);
		if (!item) continue;
		const part = partReference(item);
		if (!part)
			return `${file.replaceAll("\\", "/")}\n${item.endsWith("\n") ? item : `${item}\n`}`;
		const partPath = path.posix.normalize(
			path.posix.join(path.posix.dirname(file), part.replaceAll("\\", "/")),
		);
		const partText = await fileText(
			root,
			partPath,
			milestoneId,
			number,
			highest,
		);
		highest = Math.max(highest, highestItem(partText));
		const full = itemAt(partText, number);
		if (full)
			return `${relative(root, path.resolve(root, partPath))}\n${full.endsWith("\n") ? full : `${full}\n`}`;
	}
	throw failure(milestoneId, number, `item ${number} was not found`, highest);
}

function decisionOptions(parsed) {
	const number = Number(parsed.positionals[1]);
	if (!Number.isInteger(number) || number < 1)
		throw new ToolStartupError(
			`decision number must be a positive integer: ${parsed.positionals[1]}`,
			"pass <n> as a positive item number; run pnpm decision --help",
		);
	return { milestoneId: parsed.positionals[0], number };
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	try {
		const options = decisionOptions(
			beginToolCommand("decision", process.argv.slice(2)),
		);
		process.stdout.write(
			await readDecision(options.milestoneId, options.number),
		);
	} catch (error) {
		const line = toolStartupLine("decision", error);
		process.stderr.write(`${line ?? error.message}\n`);
		process.exitCode = 1;
	}
}
