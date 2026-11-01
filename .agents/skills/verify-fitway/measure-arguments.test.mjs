import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { writeConcept } from "./concept-fixture.mjs";
import {
	measurePagePort,
	readMeasureArgumentFile,
	refusePageUrlArgument,
	refuseServingSpecs,
} from "./measure-arguments.mjs";
import { measureCommand } from "./measure-command.mjs";

test("measure --page passes the served page URL and stops its preview", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-measure-page-"));
	try {
		const concept = resolve(root, "concept");
		const out = resolve(root, "out");
		await writeConcept(concept);
		const received = [];
		let closed = false;
		const result = await measureCommand(
			{
				tool: "motion",
				concept,
				page: "index.html",
				query: "level=busy&day=sat",
				port: "3188",
				out,
				extra: ["--trigger", "click:.slot"],
			},
			{
				tools: resolve(root, "tools"),
				child: async (_command, args) => received.push(...args),
				preview: async () => ({
					origin: "http://127.0.0.1:3188",
					close: async () => {
						closed = true;
					},
				}),
			},
		);
		assert.equal(result, undefined);
		assert.equal(closed, true);
		const expectedUrl = [
			"--url",
			"http://127.0.0.1:3188/index.html?level=busy&day=sat",
		];
		assert.deepEqual(received.slice(3, 5), expectedUrl);
		const manifest = JSON.parse(
			await readFile(resolve(out, "measure-manifest.json"), "utf8"),
		);
		assert.deepEqual(manifest.arguments.slice(-2), expectedUrl);
		assert.equal(
			manifest.url,
			"http://127.0.0.1:3188/index.html?level=busy&day=sat",
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("measure argument files must contain a string array", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-measure-args-"));
	try {
		const valid = resolve(root, "valid.json");
		await writeFile(valid, '["--trigger","click:.slot"]');
		assert.deepEqual(readMeasureArgumentFile(valid), [
			"--trigger",
			"click:.slot",
		]);
		for (const [name, source] of [
			["object.json", '{"url":"x"}'],
			["mixed.json", '["--ok",1]'],
			["bad.json", "{"],
		]) {
			const file = resolve(root, name);
			await writeFile(file, source);
			assert.throws(
				() => readMeasureArgumentFile(file),
				/JSON array of strings/,
			);
		}
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("measure refuses a second target and an unmaintained server", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-measure-spec-"));
	try {
		const spec = resolve(root, "probe.json");
		await writeFile(
			spec,
			JSON.stringify({ target: { url: "http://127.0.0.1:3188/other.html" } }),
		);
		assert.throws(
			() =>
				refuseServingSpecs(
					["--spec", spec],
					"http://127.0.0.1:3188/index.html",
				),
			/target URL is not the served page/,
		);
		assert.throws(
			() => refusePageUrlArgument(["--url", "http://elsewhere"]),
			/do not pass both/,
		);
		assert.throws(() => measurePagePort("3177"), /first port/);
		assert.equal(measurePagePort(undefined), 3176);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
