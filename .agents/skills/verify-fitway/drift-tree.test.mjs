import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { html, writeConcept } from "./concept-fixture.mjs";
import { CONCEPT_SOURCE, checkVerificationMaps } from "./drift-tree.mjs";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
// A recipe marker the fixture's opener carries; renaming the opener is the planted drift.
const drifted = html.replace(/ops-btn/g, "ops-renamed");
let scratch;

function git(root, ...args) {
	const result = spawnSync(
		"git",
		["-C", root, "-c", "user.name=t", "-c", "user.email=t@t", ...args],
		{ encoding: "utf8", windowsHide: true },
	);
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim();
}

async function declare(root, ref) {
	const file = resolve(root, CONCEPT_SOURCE);
	await mkdir(dirname(file), { recursive: true });
	await writeFile(file, JSON.stringify({ concept: "concept", ref }));
}

// A failure carries its message and, where one helps, the FIX line the CLI prints.
const assertFailed = (root, message, fix) =>
	assert.throws(
		() => checkVerificationMaps(root),
		(error) => message.test(error.message) && (!fix || fix.test(error.fix)),
	);

before(async () => {
	scratch = await mkdtemp(resolve(tmpdir(), "verify-fitway-drift-tree-"));
});
after(async () => {
	if (scratch) await rm(scratch, { recursive: true, force: true });
});

test("D1: a recipe file in the tree is checked, and a planted drift fails", async () => {
	const root = resolve(scratch, "in-tree");
	await writeConcept(resolve(root, "concept"));
	assert.match(
		checkVerificationMaps(root),
		/DRIFT PASS: 1 recipe files found and checked/,
	);
	await writeFile(resolve(root, "concept/index.html"), drifted);
	assertFailed(root, /ops-btn/);
});

test("D2: no recipe file and no declared concept fails; nothing is passed unchecked", async () => {
	const root = resolve(scratch, "empty");
	await mkdir(root);
	assertFailed(root, /nothing was checked/, /concept-source\.json/);
});

test("D3: a declared ref missing from the clone fails and names the fetch", async () => {
	const root = resolve(scratch, "no-ref");
	await mkdir(root);
	git(root, "init", "-q");
	await declare(root, "refs/remotes/origin/build");
	assertFailed(
		root,
		/refs\/remotes\/origin\/build .*not in this clone/,
		/git -C .* fetch origin/,
	);
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
	assert.match(
		checkVerificationMaps(root),
		new RegExp(`checked concept at refs/heads/build \\(${commit}\\)`),
	);
	assert.equal(git(root, "status", "--porcelain"), "");
	assert.equal(git(root, "ls-files", "--stage"), index);

	git(root, "checkout", "-q", "build");
	await writeFile(resolve(root, "concept/index.html"), drifted);
	git(root, "commit", "-q", "-am", "drift");
	git(root, "checkout", "-q", "work");
	assertFailed(root, /ops-btn/);

	git(root, "checkout", "-q", "build");
	git(root, "rm", "-q", "concept/verification-recipes.json");
	git(root, "commit", "-q", "-m", "recipes gone");
	git(root, "checkout", "-q", "work");
	assertFailed(root, /has no verification-recipes\.json; nothing was checked/);
});
