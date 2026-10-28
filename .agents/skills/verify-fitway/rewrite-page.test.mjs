import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { rewritePage } from "./run.mjs";

function routedPage() {
	let handler;
	return {
		async route(_pattern, next) {
			handler = next;
		},
		async request(url) {
			let fulfilled;
			let continued = false;
			await handler({
				request: () => ({ url: () => url }),
				fetch: async () => ({ status: 200, headers: {} }),
				fulfill: async (response) => {
					fulfilled = response;
				},
				continue: async () => {
					continued = true;
				},
			});
			return { continued, fulfilled };
		},
	};
}

test("rewrite serves one exact replacement only to its page and file", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-rewrite-"));
	try {
		await writeFile(resolve(root, "app.js"), 'const label = "Before";');
		await writeFile(resolve(root, "other.js"), 'const label = "Before";');
		const page = routedPage();
		await rewritePage(
			page,
			root,
			"./app.js",
			'"Before"',
			'"After"',
			"http://127.0.0.1:3176",
		);

		const target = await page.request("http://127.0.0.1:3176/app.js");
		assert.equal(target.continued, false);
		assert.equal(target.fulfilled.body, 'const label = "After";');
		const other = await page.request("http://127.0.0.1:3176/other.js");
		assert.equal(other.continued, true);
		assert.equal(other.fulfilled, undefined);
		const foreign = await page.request("http://127.0.0.1:9999/app.js");
		assert.equal(foreign.continued, true);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("rewrite refuses a source text found no times or more than once", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-rewrite-"));
	try {
		const page = routedPage();
		await writeFile(resolve(root, "none.js"), "unchanged");
		await assert.rejects(
			rewritePage(
				page,
				root,
				"none.js",
				"missing",
				"value",
				"http://127.0.0.1:3176",
			),
			/none\.js occurs 0 times/,
		);
		await writeFile(resolve(root, "twice.js"), "same same");
		await assert.rejects(
			rewritePage(
				page,
				root,
				"twice.js",
				"same",
				"value",
				"http://127.0.0.1:3176",
			),
			/twice\.js occurs 2 times/,
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("rewrite changes only a target file when two scripts hold the same text", async () => {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-rewrite-"));
	try {
		await writeFile(resolve(root, "app.js"), "shared");
		await writeFile(resolve(root, "other.js"), "shared");
		const page = routedPage();
		await rewritePage(
			page,
			root,
			"app.js",
			"shared",
			"target",
			"http://127.0.0.1:3176",
		);
		assert.equal(
			(await page.request("http://127.0.0.1:3176/app.js")).fulfilled.body,
			"target",
		);
		assert.equal(
			(await page.request("http://127.0.0.1:3176/other.js")).continued,
			true,
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
