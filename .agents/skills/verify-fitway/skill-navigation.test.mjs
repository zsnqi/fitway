import assert from "node:assert/strict";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { copyAllFixture } from "./fixture-copy.mjs";

const skill = dirname(fileURLToPath(import.meta.url));
const required = [
	"sizes",
	"drive context and feature reach",
	"settled capture",
	"compare verdict",
	"bundle identity",
	"extraction",
	"port pairs",
	"output folders",
	"fixture copy",
	"invalidation cases",
];

function rows(markdown) {
	const section = markdown
		.split(/^## Where things live\s*$/m)[1]
		?.split(/^## /m)[0];
	assert.ok(section, "Where things live section is missing");
	return section
		.split(/\r?\n/)
		.filter((line) => /^\| [^-]/.test(line))
		.slice(1)
		.map((line) =>
			line
				.split("|")
				.slice(1, -1)
				.map((cell) => cell.trim()),
		);
}

function words(cell) {
	return [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

async function verify(markdown, root = skill) {
	const table = rows(markdown);
	for (const subject of required) {
		const row = table.find(([name]) => name === subject);
		assert.ok(row, `missing row: ${subject}`);
		const [file] = words(row[1]);
		assert.ok(file, `row has no file: ${subject}`);
		const source = await readFile(resolve(root, file), "utf8").catch(
			() => null,
		);
		assert.ok(source, `missing file: ${file}`);
		for (const name of words(row[2])) {
			const declaration = new RegExp(
				`export\\s+(?:async\\s+)?(?:function|const|class)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b|(?:const|function|class)\\s+${name}\\b`,
			);
			assert.match(source, declaration, `missing export ${name} in ${file}`);
		}
	}
}

test("SKILL location table validates named files and exports", async () => {
	await verify(await readFile(resolve(skill, "SKILL.md"), "utf8"));
});

test("SKILL location table fails when a required subject row is removed", async () => {
	const markdown = await readFile(resolve(skill, "SKILL.md"), "utf8");
	await assert.rejects(
		verify(markdown.replace(/^\| sizes \|.*$/m, "")),
		/missing row: sizes/,
	);
});

test("SKILL location table fails when a named export is renamed", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-navigation-"));
	try {
		await copyAllFixture(root);
		await copyFile(resolve(skill, "SKILL.md"), resolve(root, "SKILL.md"));
		await copyFile(
			resolve(skill, "compare-speed.test.mjs"),
			resolve(root, "compare-speed.test.mjs"),
		);
		const file = resolve(root, "drive-plan.mjs");
		const source = await readFile(file, "utf8");
		await writeFile(
			file,
			source.replace(
				"export function contextOptions",
				"export function renamedContextOptions",
			),
		);
		await assert.rejects(
			verify(await readFile(resolve(root, "SKILL.md"), "utf8"), root),
			/missing export contextOptions/,
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
