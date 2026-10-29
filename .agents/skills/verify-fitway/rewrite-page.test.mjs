import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, test } from "node:test";
import { createRewrite } from "./run.mjs";

const origins = {
	build: "http://127.0.0.1:3176",
	baseline: "http://127.0.0.1:3177",
};
const roots = [];
afterEach(async () => {
	await Promise.all(
		roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
	);
});

// Two concept folders and a rewrite bound to them, as run builds it.
async function sides(files, { baseline = true } = {}) {
	const root = await mkdtemp(resolve(tmpdir(), "verify-fitway-rewrite-"));
	roots.push(root);
	const sources = {};
	for (const side of baseline ? ["build", "baseline"] : ["build"]) {
		const concept = resolve(root, side);
		await mkdir(concept);
		for (const [file, text] of Object.entries(files[side] ?? files))
			await writeFile(resolve(concept, file), text);
		sources[side] = { concept };
	}
	const served = baseline ? origins : { build: origins.build };
	return { sources, rewrite: createRewrite(sources, served) };
}

// A page as Playwright routes it; it has never been navigated.
function routedPage() {
	const handlers = [];
	return {
		routes: handlers,
		url: () => "about:blank",
		async route(_pattern, next) {
			handlers.push(next);
		},
		async request(url) {
			let fulfilled;
			let continued = false;
			await handlers.at(-1)({
				request: () => ({ url: () => url }),
				fetch: async () => ({ status: 200, headers: {} }),
				fulfill: async (response) => {
					fulfilled = response;
				},
				continue: async () => {
					continued = true;
				},
			});
			return { continued, body: fulfilled?.body };
		},
	};
}

const sha = async (file) =>
	createHash("sha256")
		.update(await readFile(file))
		.digest("hex");

test("rewrite serves one exact replacement only to its page and file", async () => {
	const { rewrite } = await sides(
		{
			"app.js": 'const label = "Before";',
			"other.js": 'const label = "Before";',
		},
		{ baseline: false },
	);
	const page = routedPage();
	await rewrite(page, "./app.js", '"Before"', '"After"');
	const target = await page.request(`${origins.build}/app.js`);
	assert.equal(target.continued, false);
	assert.equal(target.body, 'const label = "After";');
	const other = await page.request(`${origins.build}/other.js`);
	assert.equal(other.continued, true);
	assert.equal(other.body, undefined);
	const foreign = await page.request("http://127.0.0.1:9999/app.js");
	assert.equal(foreign.continued, true);
});

test("rewrite refuses a source text found no times or more than once", async () => {
	const { rewrite } = await sides(
		{ "none.js": "unchanged", "twice.js": "same same" },
		{ baseline: false },
	);
	const page = routedPage();
	await assert.rejects(
		rewrite(page, "none.js", "missing", "value"),
		/none\.js: "missing" occurs 0 times; expected exactly once/,
	);
	await assert.rejects(
		rewrite(page, "twice.js", "same", "value"),
		/twice\.js: "same" occurs 2 times; expected exactly once/,
	);
});

test("rewrite changes only a target file when two scripts hold the same text", async () => {
	const { rewrite } = await sides(
		{ "app.js": "shared", "other.js": "shared" },
		{ baseline: false },
	);
	const page = routedPage();
	await rewrite(page, "app.js", "shared", "target");
	assert.equal((await page.request(`${origins.build}/app.js`)).body, "target");
	assert.equal(
		(await page.request(`${origins.build}/other.js`)).continued,
		true,
	);
});

test("two rewrites of one file on one page both reach the page, in call order", async () => {
	const { rewrite } = await sides(
		{ "settings.html": '<html lang="ar"><title>Settings</title></html>' },
		{ baseline: false },
	);
	const page = routedPage();
	await rewrite(
		page,
		"settings.html",
		'<html lang="ar">',
		'<html lang="ar" data-one="1">',
	);
	await rewrite(
		page,
		"settings.html",
		"<title>Settings</title>",
		'<title>Settings</title><meta name="two">',
	);
	assert.equal(
		(await page.request(`${origins.build}/settings.html`)).body,
		'<html lang="ar" data-one="1"><title>Settings</title><meta name="two"></html>',
	);
});

test("a second from that the first rewrite removed throws naming it", async () => {
	const { rewrite } = await sides(
		{ "app.js": 'label("Before")' },
		{ baseline: false },
	);
	const page = routedPage();
	await rewrite(page, "app.js", '"Before"', '"After"');
	await assert.rejects(
		rewrite(page, "app.js", '"Before"', '"Again"'),
		/app\.js: "\\"Before\\"" occurs 0 times in the text 1 earlier rewrite of it leaves; expected exactly once/,
	);
	assert.equal(
		(await page.request(`${origins.build}/app.js`)).body,
		'label("After")',
	);
});

test("a rewrite before goto serves the baseline's file to a request sent to the baseline", async () => {
	const { rewrite, sources } = await sides({
		build: { "app.js": 'side("build"); label("Before")' },
		baseline: { "app.js": 'side("baseline"); label("Before")' },
	});
	const page = routedPage();
	await rewrite(page, "app.js", '"Before"', '"After"');
	const baseline = await page.request(`${origins.baseline}/app.js`);
	assert.equal(baseline.body, 'side("baseline"); label("After")');
	const build = await page.request(`${origins.build}/app.js`);
	assert.equal(build.body, 'side("build"); label("After")');
	assert.equal(page.routes.length, 1);
	assert.ok(sources.baseline.concept !== sources.build.concept);
});

test("a rewrite names the side whose file lacks its from", async () => {
	const { rewrite } = await sides({
		build: { "app.js": "label(1)" },
		baseline: { "app.js": "label(2)" },
	});
	await assert.rejects(
		rewrite(routedPage(), "app.js", "label(2)", "label(3)"),
		/app\.js on the build: "label\(2\)" occurs 0 times/,
	);
});

test("rewrites leave the concept's files on disk byte for byte", async () => {
	const { rewrite, sources } = await sides({
		build: { "app.js": 'label("Before"); $&' },
		baseline: { "app.js": 'label("Before"); $&' },
	});
	const files = [
		resolve(sources.build.concept, "app.js"),
		resolve(sources.baseline.concept, "app.js"),
	];
	const before = await Promise.all(files.map(sha));
	const page = routedPage();
	await rewrite(page, "app.js", '"Before"', '"$&-literal"');
	await rewrite(page, "app.js", "; $&", "; end");
	assert.equal(
		(await page.request(`${origins.baseline}/app.js`)).body,
		'label("$&-literal"); end',
	);
	await page.request(`${origins.build}/app.js`);
	assert.deepEqual(await Promise.all(files.map(sha)), before);
});
