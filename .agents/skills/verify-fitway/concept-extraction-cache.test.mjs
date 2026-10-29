import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { writeConcept } from "./concept-fixture.mjs";
import {
	CONCEPT_EXTRACTION_ROOT,
	CONCEPT_SOURCE,
	extractDeclaredConcept,
} from "./drift-tree.mjs";

function git(root, ...args) {
	const result = spawnSync(
		"git",
		[
			"-C",
			root,
			"-c",
			"user.name=test",
			"-c",
			"user.email=test@example.invalid",
			...args,
		],
		{ encoding: "utf8", windowsHide: true },
	);
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim();
}

test("commit extraction is reused from one folder outside the repository", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-commit-"));
	let cached;
	try {
		await mkdir(root, { recursive: true });
		git(root, "init", "-q");
		await writeConcept(resolve(root, "concept"));
		await writeFile(
			resolve(root, "concept/salt.txt"),
			randomBytes(16).toString("hex"),
		);
		await mkdir(dirname(resolve(root, CONCEPT_SOURCE)), {
			recursive: true,
		});
		await writeFile(
			resolve(root, CONCEPT_SOURCE),
			JSON.stringify({ concept: "concept", ref: "HEAD" }),
		);
		git(root, "add", "-A");
		git(root, "commit", "-q", "-m", "concept");
		const commit = git(root, "rev-parse", "HEAD");
		cached = resolve(CONCEPT_EXTRACTION_ROOT, commit);

		const first = extractDeclaredConcept(root, {
			ref: commit,
			cache: true,
		});
		assert.equal(first.commit, commit);
		assert.equal(first.reused, false);
		assert.equal(first.concept, cached);
		assert.ok(existsSync(first.recipes));

		const second = extractDeclaredConcept(root, {
			ref: commit,
			cache: true,
		});
		assert.equal(second.reused, true);
		assert.equal(second.concept, cached);
		assert.throws(
			() =>
				extractDeclaredConcept(root, {
					ref: "0000000",
					cache: true,
				}),
			/0000000/,
		);
	} finally {
		if (cached) await rm(cached, { recursive: true, force: true });
		await rm(root, { recursive: true, force: true });
	}
});
