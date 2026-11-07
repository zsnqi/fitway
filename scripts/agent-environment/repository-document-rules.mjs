// Repository checks for Codex brief folders and gardener fixture citations.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { references } from "../../.agents/skills/gardener/facts.mjs";
import {
	collectFolderRecords,
	defaultTempRoot,
} from "../../.agents/skills/gardener/survey-evidence.mjs";
import { parseBriefRole } from "./brief-format.mjs";
import { codexScopeProblem } from "./brief-markdown.mjs";
import { outcomeIdsFromBrief } from "./brief-readings.mjs";

export const REPOSITORY_BRIEF_FOLDERS = [
	"docs/phase-records/handoffs/owner-design-exploration/r04/briefs",
	"docs/phase-records/handoffs/agent-tooling/briefs",
];

function markdownFiles(directory) {
	return readdirSync(directory)
		.filter((name) => name.endsWith(".md"))
		.sort((left, right) => left.localeCompare(right, "en"));
}

export function verifyRepositoryBriefRules(
	root = process.cwd(),
	{ folders = REPOSITORY_BRIEF_FOLDERS } = {},
) {
	const problems = [];
	let filesChecked = 0;
	const folderCounts = [];
	for (const folder of folders) {
		const relativeFolder = folder.replaceAll("\\", "/").replace(/\/$/, "");
		let folderFiles = 0;
		let names;
		try {
			names = markdownFiles(path.join(root, relativeFolder));
		} catch (error) {
			if (error.code === "ENOENT")
				problems.push(`${relativeFolder}: brief folder does not exist`);
			else throw error;
			continue;
		}
		for (const name of names) {
			const relativePath = `${relativeFolder}/${name}`;
			const text = readFileSync(path.join(root, relativePath), "utf8");
			const firstLine = text.split(/\r?\n/, 1)[0];
			const format = parseBriefRole(`${firstLine}\n`);
			if (format.problem) {
				problems.push(`${relativePath}:1: ${format.problem}`);
				continue;
			}
			filesChecked += 1;
			folderFiles += 1;
			if (format.role !== "codex") continue;
			const scope = codexScopeProblem(text);
			if (scope)
				problems.push(`${relativePath}:${scope.line}: ${scope.message}`);
			if (outcomeIdsFromBrief(text).size === 0)
				problems.push(`${relativePath}:1: has no outcome IDs`);
		}
		folderCounts.push({ folder: relativeFolder, filesChecked: folderFiles });
	}
	if (problems.length) throw new Error(problems.join("\n"));
	return { filesChecked, folders: folderCounts };
}

function testFolders(text) {
	const normalized = text.replaceAll("\\\\", "/");
	return [
		...new Set(
			[...normalized.matchAll(/(?:d:\/|\/d\/)?fitway-temp\/([a-z0-9_. -]+)/gi)]
				.map((match) => match[1].trim().toLowerCase())
				.filter((name) => name !== "." && name !== ".."),
		),
	];
}

export function assertGardenerFixtureCitations(
	records,
	{
		tempRoot = defaultTempRoot,
		exists = existsSync,
		readdir = readdirSync,
	} = {},
) {
	const tests = records.filter(
		(record) =>
			record.source.startsWith(".agents/skills/gardener/") &&
			record.source.endsWith(".test.ts"),
	);
	const outside = records.filter(
		(record) => !record.source.endsWith(".test.ts"),
	);
	const collisions = [];
	for (const test of tests) {
		for (const name of testFolders(test.text)) {
			const folder = `${tempRoot}/${name}`;
			const citations = references(folder, outside);
			if (exists(folder) || citations.length)
				collisions.push(
					`${test.source}: cites ${folder}${citations.length ? ` in ${citations.map((citation) => `${citation.source}:${citation.line}`).join(", ")}` : ""}`,
				);
		}
	}
	if (exists(tempRoot))
		for (const entry of readdir(tempRoot, { withFileTypes: true })) {
			if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
			const folder = `${tempRoot}/${entry.name}`;
			for (const citation of references(folder, tests))
				collisions.push(
					`${citation.source}:${citation.line}: cites existing test path ${folder}`,
				);
		}
	if (collisions.length)
		throw new Error(
			`Gardener fixture citations collide with real temp folders or non-test records:\n${collisions.join("\n")}`,
		);
	return { tests: tests.length };
}

export async function verifyGardenerFixtureCitations({
	checkout = process.cwd(),
	...options
} = {}) {
	const records = await collectFolderRecords([], { checkout });
	return assertGardenerFixtureCitations(records, options);
}

export async function verifyRepositoryDocumentRules(root) {
	const briefs = verifyRepositoryBriefRules(root);
	for (const folder of briefs.folders)
		console.log(
			`Brief document rule passed: ${folder.folder}: ${folder.filesChecked} Codex brief(s).`,
		);
	const gardener = await verifyGardenerFixtureCitations({ checkout: root });
	console.log(
		`Gardener fixture citation rule passed: ${gardener.tests} test file(s).`,
	);
	return { briefs, gardener };
}
