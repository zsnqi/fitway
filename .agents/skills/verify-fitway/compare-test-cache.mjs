import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

export async function isolateFixtureCache(file, root) {
	const declaration = 'export const cacheRoot = "D:/fitway-verify-captures";';
	const source = await readFile(file, "utf8");
	assert.equal(
		source.split(declaration).length,
		2,
		`Expected one cache root declaration in ${file}`,
	);
	await writeFile(
		file,
		source.replace(
			declaration,
			`export const cacheRoot = ${JSON.stringify(root)};`,
		),
	);
}
