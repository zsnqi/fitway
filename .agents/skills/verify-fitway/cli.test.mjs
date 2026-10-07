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
import { child, doctorFix, playwright } from "./cli.mjs";
import {
	assertOutsideGit,
	outputFile,
	portAvailable,
	preview,
	verificationPort,
} from "./core.mjs";
import {
	coverageProblems,
	discoverElements,
	drift,
	extractDependencies,
	extractSwitches,
	generateMap,
} from "./map.mjs";
import { sourceProbe } from "./probes.mjs";
import { itemSummary, resolveQuery, stateCases } from "./runner.mjs";

let scratch;
let concept;
let recipes;
const html =
	'<main>Fixture</main><button id="ops-btn" aria-controls="ops-pop">Status</button><div id="ops-pop" role="dialog" hidden></div><script src="app.js"></script>';
const js =
	'const params=new URLSearchParams(location.search);const state=params.get("state")||"live";if(["live","loading","error"].includes(state)){};window.__fixture={ready:true};';
const authored = () => ({
	schema: 1,
	pages: {
		"index.html": {
			features: [
				{
					id: "status",
					marker: "ops-btn",
					source: { file: "index.html", line: 1 },
					actions: ["activate:#ops-btn"],
					proof: { selector: "#ops-pop", visible: true },
					covers: ["#ops-pop"],
				},
			],
			states: [
				{
					when: {},
					shows: "Visible fixture",
					proof: { selector: "main", visible: true },
				},
			],
		},
	},
});
before(async () => {
	scratch = await mkdtemp(resolve(tmpdir(), "verify-fitway-unit-"));
	concept = resolve(scratch, "concept");
	recipes = resolve(concept, "verification-recipes.json");
	await mkdir(concept);
	await writeFile(resolve(concept, "index.html"), html);
	await writeFile(resolve(concept, "app.js"), js);
	await writeFile(recipes, JSON.stringify(authored()));
});
after(async () => {
	if (scratch) await rm(scratch, { recursive: true, force: true });
});

test("source derives pages, readiness, domains, openings and opener source; recipes prove coverage", () => {
	const map = generateMap(concept);
	const page = map.pages[0];
	assert.equal(page.ready, "window.__fixture?.ready === true");
	assert.deepEqual(page.switches.find((s) => s.name === "state").values, [
		"error",
		"live",
		"loading",
	]);
	assert.equal(
		page.openings.find((o) => o.selector === "#ops-pop").openers[0].selector,
		"#ops-btn",
	);
	assert.deepEqual(drift(map, concept), []);
});
test("switch scanner follows lexical scope and ignores unrelated Map.get", () => {
	const found = extractSwitches(
		'const p=new URLSearchParams(location.search);const v=p.get("kind");if(["all","count"].includes(v)){};function other(){const v="else";if(v==="wrong"){};const p=new Map();p.get("not-a-switch")}',
		"scope.js",
	);
	assert.deepEqual(
		found.map((s) => s.name),
		["kind"],
	);
	assert.deepEqual(found[0].values, ["all", "count"]);
});
test("source dependency is applied with a default or refused with its source reason; wide is independent", () => {
	const deps = extractDependencies(
		'const p=new URLSearchParams(location.search);\nif(p.has("record") && p.get("case")==="long"){};\nif(p.get("case")==="wide"){}',
		"activity.js",
	);
	assert.deepEqual(deps, [
		{
			switch: "case",
			value: "long",
			requires: [{ name: "record", present: true }],
			source: { file: "activity.js", line: 2 },
		},
	]);
	const page = {
		page: "activity.html",
		switches: [
			{ name: "case", values: ["long", "wide"], dependencies: deps },
			{ name: "record", values: [] },
		],
		defaults: { record: "1001" },
	};
	assert.deepEqual(resolveQuery(page, { case: "long" }).query, {
		case: "long",
		record: "1001",
	});
	assert.deepEqual(resolveQuery(page, { case: "wide" }).query, {
		case: "wide",
	});
	assert.deepEqual(resolveQuery(page, { case: "long", record: "1002" }).query, {
		case: "long",
		record: "1002",
	});
	assert.throws(
		() => resolveQuery({ ...page, defaults: {} }, { case: "long" }),
		/activity.js:2: case=long needs record/,
	);
	assert.ok(
		stateCases(page, { states: "all" }).some(
			(s) => s.name === "case=long&record=1001",
		),
	);
	assert.throws(
		() => stateCases(page, { query: "retired=1" }),
		/unmapped query switch retired/,
	);
});
test("value dependencies reject conflicts instead of changing an explicit request", () => {
	const page = {
		page: "fixture",
		switches: [
			{
				name: "arrive",
				dependencies: [
					{
						switch: "arrive",
						value: "500",
						requires: [{ name: "state", value: "loading" }],
						source: { file: "fixture.js", line: 3 },
					},
				],
			},
			{ name: "state" },
		],
	};
	assert.deepEqual(resolveQuery(page, { arrive: "500" }).query, {
		arrive: "500",
		state: "loading",
	});
	assert.throws(
		() => resolveQuery(page, { arrive: "500", state: "error" }),
		/needs state=loading; conflicting value error/,
	);
});
test("planted dialog fails by name, file, line and opener; adding a recipe restores coverage", async () => {
	const map = generateMap(concept);
	const file = resolve(concept, "index.html");
	try {
		await writeFile(
			file,
			`${html}\n<button id="novel-open" aria-controls="novel-dialog">Open</button><dialog id="novel-dialog"></dialog>`,
		);
		assert.match(
			drift(map, concept).join("\n"),
			/index.html:2: uncovered dialog #novel-dialog; openers: #novel-open/,
		);
		const r = authored();
		r.pages["index.html"].features.push({
			id: "novel",
			marker: "novel-dialog",
			actions: ["activate:#novel-open"],
			proof: { selector: "#novel-dialog", visible: true },
			covers: ["#novel-dialog"],
		});
		await writeFile(recipes, JSON.stringify(r));
		assert.deepEqual(drift(map, concept), []);
	} finally {
		await writeFile(file, html);
		await writeFile(recipes, JSON.stringify(authored()));
	}
});
test("JS factory dialog discovery includes opener and ignores comment markup", () => {
	const found = discoverElements([
		{
			file: "factory.js",
			text: '// <dialog id="comment-only">\nconst el=(tag,attrs)=>{};const button=el("button",{id:"drawer-open","aria-controls":"drawer"});const panel=el("section",{id:"drawer",role:"dialog",hidden:""});',
		},
	]);
	assert.equal(
		found.openings.some((o) => o.selector === "#comment-only"),
		false,
	);
	assert.ok(
		found.openings.some(
			(o) =>
				o.selector === "#drawer" &&
				o.source.line === 2 &&
				o.openers[0].selector === "#drawer-open",
		),
	);
});
test("native JS-created dialog and dynamically assigned role are named, with their opening controls", () => {
	const d = discoverElements([
		{
			file: "new.js",
			text: 'const dlg=document.createElement("dialog");\ndlg.id="native-dialog";\nconst open=document.querySelector("#open");open.addEventListener("click",()=>dlg.showModal());\nconst pop=document.createElement("div");pop.id="native-pop";pop.setAttribute("role","dialog");',
		},
	]);
	assert.ok(
		d.openings.some(
			(o) =>
				o.selector === "#native-dialog" &&
				o.openers.some((op) => op.selector === "#open"),
		),
	);
	assert.ok(d.openings.some((o) => o.selector === "#native-pop"));
});
test("recipe selector attribute values and nested state proofs cannot disappear unnoticed", async () => {
	const file = resolve(concept, "index.html");
	const r = authored();
	r.pages["index.html"].features.push({
		id: "custom",
		actions: ['activate:[data-range="custom"]'],
		proof: { selector: "main", visible: true },
	});
	r.pages["index.html"].states.push({
		when: { state: "loading" },
		proof: { allOf: [{ selector: "#gone-state", visible: true }] },
	});
	try {
		await writeFile(file, `${html}<button data-range="7d">Seven</button>`);
		await writeFile(recipes, JSON.stringify(r));
		const findings = coverageProblems(generateMap(concept), concept).join("\n");
		assert.match(findings, /selector gone: \[data-range="custom"\]/);
		assert.match(findings, /selector gone: #gone-state/);
	} finally {
		await writeFile(file, html);
		await writeFile(recipes, JSON.stringify(authored()));
	}
});
test("exact source probe exports work without running a checkout-dependent bootstrap", async () => {
	const file = resolve(scratch, "source-probe.mjs");
	await writeFile(
		file,
		'throw new Error("bootstrap must not run");\nexport const pure=(value)=>value+1;',
	);
	const p = sourceProbe(file, "pure");
	assert.equal(p.fn(4), 5);
	assert.equal(p.source.line, 2);
	assert.throws(() => sourceProbe(file, "missing"), /update the probe adapter/);
});
test("shared dialog helpers retain the source-derived opener relationship", () => {
	const found = discoverElements([
		{
			file: "shared.html",
			text: '<button id="export-btn"></button><dialog id="export-dialog"></dialog>',
		},
		{
			file: "shared.js",
			text: 'const dialog=document.querySelector("#export-dialog");const button=document.querySelector("#export-btn");function open(target){target.showModal();}button.addEventListener("click",()=>open(dialog));',
		},
	]);
	assert.ok(
		found.openings
			.find((o) => o.selector === "#export-dialog")
			.openers.some(
				(o) => o.selector === "#export-btn" && o.source.file === "shared.js",
			),
	);
});
test("vanished selector and marker fail even with a fresh map; renamed dialog is uncovered", async () => {
	const file = resolve(concept, "index.html");
	try {
		await writeFile(file, html.replace('id="ops-pop"', 'id="renamed-pop"'));
		const findings = coverageProblems(generateMap(concept), concept).join("\n");
		assert.match(findings, /uncovered dialog #renamed-pop/);
		assert.match(findings, /recipe status selector gone: #ops-pop/);
		await writeFile(file, html.replace("ops-btn", "retired-btn"));
		assert.match(
			coverageProblems(generateMap(concept), concept).join("\n"),
			/recipe status marker gone: ops-btn/,
		);
	} finally {
		await writeFile(file, html);
	}
});
test("unrelated source edits and line shifts pass coverage drift", async () => {
	const map = generateMap(concept);
	const file = resolve(concept, "app.js");
	try {
		await writeFile(file, `// harmless\n${js}`);
		assert.deepEqual(drift(map, concept), []);
	} finally {
		await writeFile(file, js);
	}
});
test("recipes are required, never inferred from a maintained CLI catalog", async () => {
	const r = await readFile(recipes, "utf8");
	try {
		await rm(recipes);
		assert.throws(() => generateMap(concept), /Recipes missing/);
	} finally {
		await writeFile(recipes, r);
	}
});
test("Playwright resolves from the skill checkout for a package-free concept", () => {
	const loaded = playwright(concept);
	assert.match(loaded.resolved, /@playwright/);
	assert.ok(loaded.pw.chromium);
});
test("short summary preserves axes, state, result and measuring error without bulk geometry", () => {
	const e = {
		feature: "page",
		state: "case=long&record=1001",
		query: { case: "long", record: "1001" },
		language: "ar",
		size: "narrow",
		input: "touch",
		motion: "reduce",
		transport: "http",
		status: "problem",
		problems: ["geometry: planted throw"],
		geometry: Array(1000).fill("detail"),
		files: ["frame.png"],
	};
	const s = itemSummary(e);
	assert.equal(s.result, "problem");
	assert.deepEqual(s.problems, e.problems);
	assert.equal(s.geometry, undefined);
	assert.ok(JSON.stringify(s).length < 500);
});
test("doctor gives portable concrete repair commands; verification ports are restricted", () => {
	const opts = { concept, recipes };
	assert.match(
		doctorFix(opts, new Error("Recipe drift")),
		/node '.*cli.mjs' map --concept/,
	);
	assert.match(
		doctorFix(opts, new Error("Chromium missing")),
		/cli.js' install chromium/,
	);
	for (const port of [3174, 3180, 3185])
		assert.throws(() => verificationPort(port), /choose 3176 or 3177/);
	assert.equal(verificationPort("3176"), 3176);
});
function fetchRaw(port, path, method = "GET") {
	return new Promise((done, reject) => {
		const req = request({ host: "127.0.0.1", port, path, method }, (res) => {
			const chunks = [];
			res.on("data", (c) => chunks.push(c));
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
test("foreign wildcard port is refused; launch never passes; cleanup after refusal retains the foreign server", async () => {
	const server = createServer((_, res) => res.end("foreign wildcard"));
	await new Promise((done) => server.listen(3177, "0.0.0.0", done));
	const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
	const folder = resolve(scratch, "refused-launch");
	try {
		await assert.rejects(portAvailable(3177), /did not start/);
		const result = spawnSync(
			process.execPath,
			[cli, "launch", "--concept", concept, "--port", "3177", "--out", folder],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		assert.doesNotMatch(result.stdout, /LAUNCH PASS/);
		assert.match(result.stderr, /did not start/);
		const cleanup = spawnSync(
			process.execPath,
			[cli, "cleanup", "--session", folder],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(cleanup.status, 0);
		assert.match(cleanup.stdout, /CLEANUP PASS: no owned preview started/);
		assert.equal(
			(await fetchRaw(3177, "/")).body.toString(),
			"foreign wildcard",
		);
	} finally {
		await new Promise((done) => server.close(done));
	}
	await portAvailable(3177);
});
test("preview no-store covers every response class, HEAD/query and containment; only owned resources close", async () => {
	for (const name of ["style.css", "font.woff2", "image.png", "data.json"])
		await writeFile(resolve(concept, name), "fixture");
	const outside = resolve(scratch, "outside.txt");
	await writeFile(outside, "SECRET OUTSIDE");
	await symlink(outside, resolve(concept, "escape.txt"));
	const server = await preview({ concept, port: 3177 });
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
		])
			for (const method of ["GET", "HEAD"]) {
				const result = await fetchRaw(server.port, path, method);
				assert.equal(result.headers["cache-control"], "no-store");
				assert.ok(!result.body.toString().includes("SECRET OUTSIDE"));
				if (method === "HEAD") assert.equal(result.body.length, 0);
			}
		await assert.rejects(
			preview({ concept, port: 3177 }),
			/held by a process|busy/,
		);
		assert.equal((await fetchRaw(3177, "/__verify/stop", "POST")).status, 403);
	} finally {
		await server.close();
	}
	await portAvailable(3177);
});
test("output refuses git worktrees, junction aliases and escaping paths before writes", async () => {
	const tree = resolve(scratch, "tree");
	await mkdir(tree);
	await writeFile(resolve(tree, ".git"), "gitdir: D:/elsewhere");
	const link = resolve(scratch, "alias");
	await symlink(tree, link, process.platform === "win32" ? "junction" : "dir");
	for (const root of [tree, link])
		assert.throws(
			() => assertOutsideGit(resolve(root, "never-created")),
			/Refusing output/,
		);
	await assert.rejects(outputFile(scratch, "../escaped.json"), /escapes/);
});
test("delegated tool interruption finishes its own cleanup before the parent returns", async () => {
	const helper = resolve(scratch, "cancel-fixture.mjs");
	const cleaned = resolve(scratch, "cleaned.txt");
	await writeFile(
		helper,
		'import {writeFileSync} from "node:fs";import {resolve} from "node:path";process.once("SIGINT",()=>{writeFileSync(resolve(process.cwd(),"cleaned.txt"),"cleaned");process.exit(130)});writeFileSync(resolve(process.cwd(),"ready.txt"),"ready");setInterval(()=>{},1000);',
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
	assert.equal(await readFile(cleaned, "utf8"), "cleaned");
});
