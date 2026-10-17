import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { fileURLToPath } from "node:url";
import { authored, html, js } from "./concept-fixture.mjs";
import { CONCEPT_SOURCE } from "./drift-tree.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
const cliPath = fileURLToPath(new URL("./cli.mjs", import.meta.url));
// A recipe marker the fixture's opener carries; renaming the opener is the planted drift.
const drifted = html.replace(/ops-btn/g, "ops-renamed");
let scratch;

const driftTree = (root) =>
	spawnSync(process.execPath, [cliPath, "drift-tree", "--root", root], {
		encoding: "utf8",
		windowsHide: true,
	});

function git(root, ...args) {
	const result = spawnSync(
		"git",
		["-C", root, "-c", "user.name=t", "-c", "user.email=t@t", ...args],
		{ encoding: "utf8", windowsHide: true },
	);
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim();
}

async function writeConcept(folder, page = html) {
	await mkdir(folder, { recursive: true });
	await writeFile(resolve(folder, "index.html"), page);
	await writeFile(resolve(folder, "app.js"), js);
	await writeFile(
		resolve(folder, "verification-recipes.json"),
		JSON.stringify(authored()),
	);
}

async function declare(root, ref) {
	const file = resolve(root, CONCEPT_SOURCE);
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, JSON.stringify({ concept: "concept", ref }));
}

const assertChecked = (result, pattern) => {
	assert.equal(result.status, 0, result.stdout + result.stderr);
	assert.match(result.stdout, pattern);
};
const assertFailed = (result, pattern) => {
	assert.equal(result.status, 1, result.stdout + result.stderr);
	assert.match(result.stderr, pattern);
	assert.doesNotMatch(result.stdout, /PASS/);
};

before(async () => {
	scratch = await mkdtemp(resolve(tmpdir(), "verify-fitway-drift-tree-"));
});
after(async () => {
	if (scratch) await rm(scratch, { recursive: true, force: true });
});

test("D1: a recipe file in the tree is checked, and a planted drift fails", async () => {
	const root = resolve(scratch, "in-tree");
	await writeConcept(resolve(root, "concept"));
	assertChecked(
		driftTree(root),
		/DRIFT PASS: 1 recipe files found and checked/,
	);
	await writeFile(resolve(root, "concept/index.html"), drifted);
	assertFailed(driftTree(root), /ops-btn/);
});

test("D2: no recipe file and no declared concept fails; nothing is passed unchecked", async () => {
	const root = resolve(scratch, "empty");
	await mkdir(root);
	const result = driftTree(root);
	assertFailed(result, /nothing was checked/);
	assert.match(result.stderr, /FIX: .*concept-source\.json/);
});

test("D3: a declared ref missing from the clone fails and names the fetch", async () => {
	const root = resolve(scratch, "no-ref");
	await mkdir(root);
	git(root, "init", "-q");
	await declare(root, "refs/remotes/origin/build");
	const result = driftTree(root);
	assertFailed(result, /refs\/remotes\/origin\/build .*not in this clone/);
	assert.match(result.stderr, /FIX: git -C .* fetch origin/);
});

test("D4: without a local recipe file the declared branch's concept is checked, and its planted drift fails", async () => {
	const root = resolve(scratch, "declared");
	await mkdir(root);
	git(root, "init", "-q", "-b", "work");
	await declare(root, "refs/heads/build");
	git(root, "add", "-A");
	git(root, "commit", "-q", "-m", "declaration");
	git(root, "checkout", "-q", "-b", "build");
	await writeConcept(resolve(root, "concept"));
	git(root, "add", "-A");
	git(root, "commit", "-q", "-m", "concept");
	const commit = git(root, "rev-parse", "--short=8", "HEAD");
	git(root, "checkout", "-q", "work");
	const index = git(root, "ls-files", "--stage");
	assertChecked(
		driftTree(root),
		new RegExp(`checked concept at refs/heads/build \\(${commit}\\)`),
	);
	assert.equal(git(root, "status", "--porcelain"), "");
	assert.equal(git(root, "ls-files", "--stage"), index);

	git(root, "checkout", "-q", "build");
	await writeFile(resolve(root, "concept/index.html"), drifted);
	git(root, "commit", "-q", "-am", "drift");
	git(root, "checkout", "-q", "work");
	assertFailed(driftTree(root), /ops-btn/);

	git(root, "checkout", "-q", "build");
	git(root, "rm", "-q", "concept/verification-recipes.json");
	git(root, "commit", "-q", "-m", "recipes gone");
	git(root, "checkout", "-q", "work");
	assertFailed(
		driftTree(root),
		/has no verification-recipes\.json; nothing was checked/,
	);
});
