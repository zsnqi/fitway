import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { fakeCli } from "./fake-cli.mjs";

let root;
let cli;
before(async () => {
	root = await mkdtemp(resolve(tmpdir(), "verify-fitway-manifest-"));
	cli = await fakeCli(root);
});
after(async () => {
	await rm(root, { recursive: true, force: true });
});

async function manifestOf(out) {
	return JSON.parse(await readFile(resolve(out, "manifest.json"), "utf8"));
}

const runArguments = (script, out, extra = []) => [
	...["run", "--script", script, "--concept", cli.concept],
	...["--out", out, ...extra],
];

function assertProvenance(manifest, command, args) {
	assert.equal(manifest.command, command);
	assert.deepEqual(manifest.arguments, args);
	assert.ok("commit" in manifest.checkout && "branch" in manifest.checkout);
	assert.match(manifest.startedAt, /^\d{4}-\d{2}-\d{2}T/);
	assert.match(manifest.endedAt, /^\d{4}-\d{2}-\d{2}T/);
}

test("drive output keeps capture evidence beside the command provenance", async () => {
	const out = resolve(root, "drive-out");
	const axes = "--languages en --sizes desktop --inputs mouse --motions reduce";
	const args = [
		"drive",
		...["--concept", cli.concept, "--forensics", cli.tools],
		...["--page", "index.html", "--feature", "page"],
		...`${axes} --transports file`.split(" "),
		...["--out", out],
	];
	const result = await cli.run(args);
	assert.equal(result.code, 0, result.stdout + result.stderr);
	const manifest = await manifestOf(out);
	assertProvenance(manifest, "drive", args);
	assert.equal(manifest.concept, cli.concept);
	assert.equal(manifest.schema, 2);
	assert.equal(manifest.items.length, 1);
	assert.equal(manifest.exitStatus, 0);
	assert.equal(manifest.status, "passed");
});

test("compare output records its command and arguments", async () => {
	const out = resolve(root, "compare-out");
	const args = ["compare", "--concept", cli.concept, "--baseline", cli.concept];
	args.push("--forensics", cli.tools, "--page", "index.html");
	args.push("--feature", "page", "--out", out);
	const result = await cli.run(args);
	assert.equal(result.code, 0, result.stdout + result.stderr);
	assert.match(result.stdout, /COMPARE EQUAL/);
	assert.ok(existsSync(resolve(out, "comparison.json")));
	const manifest = await manifestOf(out);
	assertProvenance(manifest, "compare", args);
	assert.equal(manifest.concept, cli.concept);
	assert.equal(manifest.baseline, cli.concept);
	assert.equal(manifest.exitStatus, 0);
	assert.equal(manifest.status, "passed");
});

test("run output records its result and command arguments", async () => {
	const script = resolve(root, "check.mjs");
	await writeFile(
		script,
		'export default async ({ url, newPage, args }) => { await newPage({ size: "desktop", language: "ar" }); return { url: url("build", "index.html"), args }; };',
	);
	const out = resolve(root, "run-out");
	const args = runArguments(script, out, ["--", "--label", "x"]);
	const result = await cli.run(args);
	assert.equal(result.code, 0, result.stdout + result.stderr);
	assert.deepEqual(
		JSON.parse(await readFile(resolve(out, "result.json"), "utf8")),
		{ url: "http://127.0.0.1:3176/index.html", args: ["--label", "x"] },
	);
	const manifest = await manifestOf(out);
	assertProvenance(manifest, "run", args);
	assert.deepEqual(manifest.arguments.slice(-2), ["--label", "x"]);
	assert.equal(manifest.exitStatus, 0);
	assert.equal(manifest.status, "passed");
});

test("a run that throws records exit 1 and an end time", async () => {
	const script = resolve(root, "throws.mjs");
	await writeFile(
		script,
		'export default async () => { throw new Error("planted script failure"); };',
	);
	const out = resolve(root, "run-failure-out");
	const args = runArguments(script, out);
	const result = await cli.run(args);
	assert.equal(result.code, 1, result.stdout + result.stderr);
	assert.match(result.stderr, /FAIL: planted script failure/);
	assert.equal(existsSync(resolve(out, "result.json")), false);
	const manifest = await manifestOf(out);
	assertProvenance(manifest, "run", args);
	assert.equal(manifest.exitStatus, 1);
	assert.equal(manifest.status, "failed");
});
