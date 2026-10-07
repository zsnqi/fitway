import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { watch } from "node:fs";
import {
	mkdir,
	mkdtemp,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import { child } from "./cli.mjs";
import {
	assertOutsideGit,
	outputFile,
	portAvailable,
	preview,
} from "./core.mjs";
import { stateCases } from "./drive.mjs";
import { controlRecipes, drift, extractSwitches, generateMap } from "./map.mjs";

let scratch;
let concept;
before(async () => {
	scratch = await mkdtemp(resolve(tmpdir(), "verify-fitway-unit-"));
	concept = resolve(scratch, "concept");
	await mkdir(concept);
	await writeFile(
		resolve(concept, "index.html"),
		'<!doctype html><script>const p = new URLSearchParams(location.search); const lang=p.get("lang")==="en"?"en":"ar";</script><button id="ops-btn">Status</button><div id="ops-pop"></div><script src="app.js"></script>',
	);
	await writeFile(
		resolve(concept, "app.js"),
		'const params=new URLSearchParams(location.search); const state=params.get("state")||"live"; if (["live","loading","error"].includes(state)) console.log(state); window.__fixture={}; window.__fixture.ready=true;',
	);
	await writeFile(
		resolve(concept, "DESIGN-SPEC.md"),
		"BRK-1 | 1440×900, 768×1024, 390×844, 320, 1024, 200% zoom",
	);
});
after(async () => {
	if (scratch) await rm(scratch, { recursive: true, force: true });
});

test("map derives pages, switch branches, source lines, readiness, user recipe and proof", () => {
	const map = generateMap(concept);
	assert.equal(map.pages[0].page, "index.html");
	assert.equal(map.pages[0].ready, "window.__fixture?.ready === true");
	assert.deepEqual(
		map.pages[0].switches.find((item) => item.name === "state").values,
		["error", "live", "loading"],
	);
	assert.equal(
		map.pages[0].features.find((item) => item.id === "status").actions[0],
		"activate:#ops-btn",
	);
	assert.equal(
		map.pages[0].features.find((item) => item.id === "status").proof.selector,
		"#ops-pop",
	);
	assert.deepEqual(drift(map, concept), []);
});

test("switch scanner ignores unrelated Map.get and notices has and inline constructor", () => {
	const found = extractSwitches(
		'const p=new URLSearchParams(location.search); p.has("find"); new URLSearchParams(location.search).get("lang"); const cache=new Map();cache.get("not-a-switch");',
		"inline.js",
	);
	assert.deepEqual(
		found.map((item) => item.name),
		["find", "lang"],
	);
});

test("planted code-only switch fails with source line; restored source has no drift", async () => {
	const map = generateMap(concept);
	const file = resolve(concept, "app.js");
	const original = await readFile(file, "utf8");
	try {
		await writeFile(file, `${original}\nparams.get("new-switch");`);
		assert.ok(
			drift(map, concept).some(
				(item) => item.includes("app.js:2") && item.includes("new-switch"),
			),
		);
	} finally {
		await writeFile(file, original);
	}
});

test("switch values follow lexical scope instead of unrelated shadowed names", () => {
	const found = extractSwitches(
		'const p=new URLSearchParams(location.search); const value=p.get("kind"); if(["all","count"].includes(value)){}; function other(){const value="unrelated";if(value==="not-a-kind"){};const p=new Map();p.get("not-a-switch")}',
		"scope.js",
	);
	assert.deepEqual(
		found.map((item) => item.name),
		["kind"],
	);
	assert.deepEqual(found[0].values, ["all", "count"]);
});

test("generated tuner controls have a user path, CSS side effect proof and source line", () => {
	const found = controlRecipes(
		'const CONTROLS=[\n{key:"glow",v:"--glow",en:"Glow",min:0,max:1,step:0.1}];',
	);
	assert.equal(found[0].id, "tuner-control-glow");
	assert.equal(found[0].source.line, 2);
	assert.deepEqual(found[0].actions, [
		"activate:.tuner-toggle",
		"focus:#t-glow",
		"press:Home",
		"press:ArrowUp",
	]);
	assert.equal(found[0].proof.cssPropertyChanged, "--glow");
});

test("interrupted delegated Node tool completes its own cleanup before the parent returns", async () => {
	const helper = resolve(scratch, "cancel-fixture.mjs");
	const cleaned = resolve(scratch, "cleaned.txt");
	await writeFile(
		helper,
		'import {writeFileSync} from "node:fs"; import {resolve} from "node:path"; process.once("SIGINT",()=>{writeFileSync(resolve(process.cwd(),"cleaned.txt"),"owned resources closed"); process.exit(130)});writeFileSync(resolve(process.cwd(),"ready.txt"),"ready"); setInterval(()=>{},1000);',
	);
	const ready = new Promise((done, reject) => {
		const watcher = watch(scratch, (_, name) => {
			if (name === "ready.txt") {
				clearTimeout(timeout);
				watcher.close();
				done();
			}
		});
		const timeout = setTimeout(() => {
			watcher.close();
			reject(new Error("Worker readiness timeout"));
		}, 5000);
	});
	const controller = new AbortController();
	const running = child(process.execPath, [helper], scratch, controller.signal);
	try {
		await ready;
		controller.abort();
		await assert.rejects(running, /130.*cleanup completed/);
	} finally {
		controller.abort();
	}
	assert.equal(await readFile(cleaned, "utf8"), "owned resources closed");
});

test("delegated tools reject equals-form destinations and server-bearing specs before launch", async () => {
	const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
	const run = (args) =>
		spawnSync(process.execPath, [cli, ...args], {
			cwd: scratch,
			encoding: "utf8",
			windowsHide: true,
		});
	for (const forbidden of [
		"--html",
		"--out",
		"--serve",
		"--ref-serve",
		"--refServe",
	]) {
		const result = run([
			"measure",
			"--tool",
			"sheet",
			"--out",
			resolve(scratch, "guard"),
			"--",
			`${forbidden}=${concept}/should-not-exist`,
		]);
		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /Pass output only/);
	}
	const spec = resolve(scratch, "server-spec.json");
	await writeFile(spec, JSON.stringify({ target: { serve: concept } }));
	const result = run([
		"measure",
		"--tool",
		"probe",
		"--out",
		resolve(scratch, "spec-guard"),
		"--",
		"--spec",
		spec,
	]);
	assert.notEqual(result.status, 0);
	assert.match(result.stderr, /Tool spec starts a server/);
});

test("planted map-only page, switch and selector fail with their exact names", () => {
	const map = generateMap(concept);
	map.pages[0].switches.push({
		name: "retired",
		source: { file: "app.js", line: 1 },
	});
	map.pages[0].features.push({
		id: "retired-dialog",
		proof: { selector: "#gone" },
		source: { file: "app.js", line: 1 },
	});
	map.pages.push({ page: "gone.html" });
	const result = drift(map, concept).join("\n");
	for (const name of ["retired", "retired-dialog", "gone.html"])
		assert.ok(result.includes(name));
});

test("changed proof selectors and removed fixture classes are named with source lines", async () => {
	const fixtureFolder = resolve(scratch, "concept");
	const fixtureHtml = resolve(fixtureFolder, "index.html");
	assertOutsideGit(fixtureFolder);
	const original = await readFile(fixtureHtml, "utf8");
	try {
		await writeFile(
			fixtureHtml,
			`${original}\n<button class="old-control">control</button>`,
		);
		const map = generateMap(fixtureFolder);
		map.pages[0].features.find((item) => item.id === "status").proof.selector =
			".wrong-proof";
		assert.ok(
			drift(map, fixtureFolder).some((line) => line.includes(".wrong-proof")),
		);
		await writeFile(
			fixtureHtml,
			`${original}\n<button class="new-control">control</button>`,
		);
		const findings = drift(map, fixtureFolder).join("\n");
		assert.match(findings, /index.html:2: removed class class="old-control/);
		assert.match(findings, /index.html:2: unmapped class class="new-control/);
	} finally {
		await writeFile(fixtureHtml, original);
	}
});

test("output rejects normal/linked git worktrees and junction aliases before writing", async () => {
	const tree = resolve(scratch, "tree");
	await mkdir(tree);
	await writeFile(resolve(tree, ".git"), "gitdir: D:/elsewhere");
	assert.throws(
		() => assertOutsideGit(resolve(tree, "never-created", "output")),
		/Refusing output/,
	);
	const link = resolve(scratch, "alias");
	await symlink(tree, link, process.platform === "win32" ? "junction" : "dir");
	assert.throws(
		() => assertOutsideGit(resolve(link, "never-created")),
		/Refusing output/,
	);
	await assert.rejects(outputFile(scratch, "../escaped.json"), /escapes/);
	assert.equal(
		assertOutsideGit(resolve(scratch, "safe")),
		resolve(scratch, "safe"),
	);
});

test("all states expands independent values; combinations require explicit query", () => {
	const page = generateMap(concept).pages[0];
	const cases = stateCases(page, { states: "all" });
	assert.ok(
		cases.slice(1).every((item) => Object.keys(item.query).length === 1),
	);
	assert.throws(() => stateCases(page, { query: "done=0" }), /unmapped/);
});

function fetchRaw(port, path, method = "GET") {
	return new Promise((done, reject) => {
		const req = request({ host: "127.0.0.1", port, path, method }, (res) => {
			const chunks = [];
			res.on("data", (chunk) => chunks.push(chunk));
			res.on("end", () =>
				done({
					status: res.statusCode,
					headers: res.headers,
					body: Buffer.concat(chunks),
				}),
			);
		});
		req.once("error", reject);
		req.end();
	});
}

test("preview no-store covers every response class, HEAD/query, containment, and stop", async () => {
	for (const name of ["style.css", "font.woff2", "image.png", "data.json"])
		await writeFile(resolve(concept, name), "fixture");
	const outside = resolve(scratch, "outside.txt");
	await writeFile(outside, "SECRET OUTSIDE");
	await symlink(outside, resolve(concept, "escape.txt"));
	const server = await preview({ concept, port: 0 + 3177 });
	try {
		for (const path of [
			"/",
			"/app.js",
			"/style.css",
			"/font.woff2",
			"/image.png",
			"/data.json",
			"/missing",
			"/index.html?lang=en",
			"/escape.txt",
			"/%2e%2e%2foutside.txt",
			"/%00",
		]) {
			for (const method of ["GET", "HEAD"]) {
				const result = await fetchRaw(server.port, path, method);
				assert.equal(
					result.headers["cache-control"],
					"no-store",
					`${method} ${path}`,
				);
				assert.ok(!result.body.toString().includes("SECRET OUTSIDE"));
				if (method === "HEAD") assert.equal(result.body.length, 0);
			}
		}
		assert.equal((await fetchRaw(server.port, "/escape.txt")).status, 403);
		await assert.rejects(
			preview({ concept, port: server.port }),
			/Port 3177 busy/,
		);
		assert.equal(
			(await fetchRaw(server.port, "/__verify/stop", "POST")).status,
			403,
		);
	} finally {
		await server.close();
	}
	await portAvailable(server.port);
});

test("doctor port check refuses other people's server without stopping it", async () => {
	const server = createServer((_, res) => res.end("user preview"));
	await new Promise((done) => server.listen(0, "127.0.0.1", done));
	try {
		await assert.rejects(portAvailable(server.address().port), /did not start/);
		assert.equal(
			(await fetchRaw(server.address().port, "/")).body.toString(),
			"user preview",
		);
	} finally {
		await new Promise((done) => server.close(done));
	}
});
