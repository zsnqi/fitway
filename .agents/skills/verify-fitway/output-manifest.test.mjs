import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, test } from "node:test";
import { withOutputCommand } from "./command-output.mjs";

const roots = [];
afterEach(async () => {
	await Promise.all(
		roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
	);
});

async function location(name) {
	const root = await mkdtemp(resolve(tmpdir(), `verify-fitway-${name}-`));
	roots.push(root);
	return { root, out: resolve(root, "out") };
}

const checkout = { commit: "abc123", branch: "test-branch" };

test("drive output keeps capture evidence beside the command provenance", async () => {
	const { root, out } = await location("drive-manifest");
	await withOutputCommand(
		out,
		{
			command: "drive",
			arguments: ["drive", "--concept", root],
			concept: root,
			checkout,
		},
		async (folder, metadata) => {
			const initial = JSON.parse(
				await readFile(resolve(folder, "manifest.json"), "utf8"),
			);
			assert.equal(initial.command, "drive");
			assert.equal(initial.status, undefined);
			await writeFile(
				resolve(folder, "manifest.json"),
				JSON.stringify({
					...metadata,
					schema: 2,
					items: [],
				}),
			);
		},
	);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.deepEqual(manifest.items, []);
	assert.equal(manifest.schema, 2);
	assert.equal(manifest.command, "drive");
	assert.deepEqual(manifest.checkout, checkout);
	assert.equal(manifest.exitStatus, 0);
	assert.equal(manifest.status, "passed");
	assert.match(manifest.endedAt, /^\d{4}-\d{2}-\d{2}T/);
});

test("compare output records its command and arguments", async () => {
	const { root, out } = await location("compare-manifest");
	await withOutputCommand(
		out,
		{
			command: "compare",
			arguments: ["compare", "--ref", "fedbdb6d"],
			ref: "fedbdb6d",
			checkout,
		},
		async (folder) => writeFile(resolve(folder, "comparison.json"), "{}\n"),
	);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.equal(manifest.command, "compare");
	assert.deepEqual(manifest.arguments, ["compare", "--ref", "fedbdb6d"]);
	assert.equal(manifest.ref, "fedbdb6d");
	assert.equal(manifest.exitStatus, 0);
	assert.ok(root);
});

test("run output records its result and command arguments", async () => {
	const { root, out } = await location("run-manifest");
	await withOutputCommand(
		out,
		{
			command: "run",
			arguments: ["run", "--script", "check.mjs", "--", "--label", "x"],
			concept: root,
			checkout,
		},
		async (folder) => writeFile(resolve(folder, "result.json"), "{}\n"),
	);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.equal(manifest.command, "run");
	assert.deepEqual(manifest.arguments.slice(-2), ["--label", "x"]);
	assert.equal(manifest.exitStatus, 0);
});

test("a run that throws records exit 1 and an end time", async () => {
	const { root, out } = await location("run-failure-manifest");
	await assert.rejects(
		withOutputCommand(
			out,
			{
				command: "run",
				arguments: ["run", "--script", "check.mjs"],
				concept: root,
				checkout,
			},
			async () => {
				throw new Error("planted script failure");
			},
		),
		/planted script failure/,
	);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.equal(manifest.command, "run");
	assert.equal(manifest.exitStatus, 1);
	assert.equal(manifest.status, "failed");
	assert.match(manifest.endedAt, /^\d{4}-\d{2}-\d{2}T/);
});
