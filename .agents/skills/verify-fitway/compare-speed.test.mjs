import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import {
	cp,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
const skill = dirname(fileURLToPath(import.meta.url));
const repository = resolve(skill, "../../..");
let scratch;
before(async () => {
	const root = "D:/fitway-temp/owner-r04-vf-fixes/speed";
	await mkdir(root, { recursive: true });
	scratch = await mkdtemp(resolve(root, "fixtures-"));
});
after(async () => {
	await rm(scratch, { recursive: true, force: true });
});

async function fixture(name, mutation) {
	const root = resolve(scratch, name);
	const clone = resolve(root, "repo/.agents/skills/verify-fitway");
	await mkdir(clone, { recursive: true });
	for (const file of (await readdir(skill)).filter(
		(f) => f.endsWith(".mjs") && !f.endsWith(".test.mjs"),
	))
		await cp(resolve(skill, file), resolve(clone, file));
	const cacheFile = resolve(clone, "baseline-cache.mjs");
	await writeFile(
		cacheFile,
		(await readFile(cacheFile, "utf8")).replace(
			'export const cacheRoot = "D:/fitway-verify-captures";',
			`export const cacheRoot = ${JSON.stringify(resolve(root, "cache"))};`,
		),
	);
	await cp(resolve(skill, "../gardener"), resolve(clone, "../gardener"), {
		recursive: true,
	});
	await writeFile(resolve(root, "repo/package.json"), '{"type":"module"}');
	await symlink(
		resolve(repository, "node_modules"),
		resolve(root, "repo/node_modules"),
		"junction",
	);
	if (mutation) {
		const file = resolve(clone, mutation.file);
		const text = await readFile(file, "utf8");
		assert.ok(
			text.includes(mutation.from),
			`Mutation seam absent: ${mutation.from}`,
		);
		await writeFile(
			file,
			mutation.all
				? text.replaceAll(mutation.from, mutation.to)
				: text.replace(mutation.from, mutation.to),
		);
	}
	const baseline = resolve(root, "baseline");
	const build = resolve(root, "build");
	await mkdir(resolve(baseline, "tools/probes"), { recursive: true });
	const pages = ["a.html", "b.html", "c.html", "components.html"];
	const recipes = { schema: 1, pages: {} };
	for (const page of pages) {
		const links =
			page === "a.html" || page === "components.html"
				? '<link rel="stylesheet" href="one.css">'
				: "";
		const shared =
			page !== "c.html" ? '<link rel="stylesheet" href="shared.css">' : "";
		await writeFile(
			resolve(baseline, page),
			`<main>Fixture</main>${links}${shared}<script src="app.js"></script>`,
		);
		recipes.pages[page] = {
			states: [
				{
					when: {},
					shows: "Fixture",
					proof: { selector: "main", visible: true },
				},
			],
			features: [],
		};
	}
	await writeFile(
		resolve(baseline, "one.css"),
		'@import "nested.css"; main{color:white}',
	);
	await writeFile(resolve(baseline, "nested.css"), "main{background:black}");
	await writeFile(resolve(baseline, "shared.css"), "main{padding:1px}");
	await writeFile(
		resolve(baseline, "app.js"),
		"window.__fixture={ready:true};",
	);
	await writeFile(resolve(baseline, "README.md"), "Unloaded");
	await writeFile(
		resolve(baseline, "verification-recipes.json"),
		JSON.stringify(recipes),
	);
	await writeFile(
		resolve(baseline, "tools/probes/lib.mjs"),
		"export const introSettled=async()=>{}; export const overflowProbe=()=>({hScroll:false});",
	);
	await writeFile(
		resolve(baseline, "tools/probes/geom.mjs"),
		"export const geometryProbe=()=>({});",
	);
	await writeFile(
		resolve(baseline, "tools/probes/a11y.mjs"),
		"export const accessibilityProbe=async()=>({});",
	);
	await cp(baseline, build, { recursive: true });
	const tools = resolve(root, "tools");
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(resolve(tools, "SKILL.md"), "Fixture capture boundary");
	await writeFile(resolve(tools, "scripts/web/probe.js"), "");
	const work = resolve(root, "browser-work.jsonl");
	await writeFile(
		resolve(tools, "scripts/web/lib.mjs"),
		`
import { appendFile, writeFile } from "node:fs/promises";
const log=async(value)=>appendFile(${JSON.stringify(work)},JSON.stringify(value)+"\\n");
export const launchChromium=async()=>{await log({kind:"browser"});return {close:async()=>{}}};
export const newContext=async()=>{let url;const page={setDefaultTimeout(){},addInitScript:async()=>{},
 waitForFunction:async()=>{},screenshot:async()=>{await log({kind:"capture",url});return Buffer.from("frame")},
 evaluate:async(fn)=>fn.toString().includes("coarse")?{language:"en",direction:"ltr",coarse:false,touchPoints:0}:({}),
 locator:()=>({first(){return this},count:async()=>1,waitFor:async()=>{},ariaSnapshot:async()=>"main"}),setURL:value=>{url=value}};
 return {page,context:{route:async()=>{},close:async()=>{}},errors:[],emulation:{}}};
export const withParams=(url)=>url;
export const preparePage=async(page,url)=>{page.setURL(url);await log({kind:"navigate",url});return {ready:true}};
export const twoFrames=async()=>{};
export const injectProbe=async()=>{};
export const renderSheet=async(browser,options,file)=>writeFile(file,"sheet");
`,
	);
	const browser = resolve(root, "browser/chromium.exe");
	await mkdir(dirname(browser));
	await writeFile(browser, "fixture browser build");
	const unavailable = resolve(root, "uninstalled");
	await mkdir(resolve(unavailable, "browsers"), { recursive: true });
	const harness = resolve(root, "command.mjs");
	// Exercise the CLI parser, source discovery, compare and runner unchanged.
	// Doctor's installed-tool checks, native browser IO and the external pixel
	// measurer are fixture boundaries. The painted fixture channels compare as
	// bytes, so this suite needs neither browser tools nor a Python installation.
	await writeFile(
		harness,
		`import {readFile,writeFile} from "node:fs/promises";
import {main} from ${JSON.stringify(pathToFileURL(resolve(clone, "cli.mjs")).href)};
import {generateMap,coverageProblems} from ${JSON.stringify(pathToFileURL(resolve(clone, "map.mjs")).href)};
await main(process.argv.slice(2),{compare:{checkPort:async()=>{},child:async(command,args)=>{
 if(!args[0].endsWith("diff_map.py")||!args.includes("--json"))throw new Error("Unexpected fixture child: "+command);
 const [a,b]=await Promise.all([readFile(args[1]),readFile(args[2])]);const identical=a.equals(b);
 await writeFile(args[args.indexOf("--json")+1],JSON.stringify({identical,bbox:null,changedPixels:identical?0:1}));
},doctor:async(options)=>{
 const map=generateMap(options.concept,options.recipes);
 const problems=coverageProblems(map,options.concept);if(problems.length)throw new Error(problems.join("\\n"));
 return {concept:options.concept,map,tools:options.forensics,loaded:{resolved:${JSON.stringify(browser)},version:"fixture",pw:{chromium:{executablePath:()=>${JSON.stringify(browser)}}}}};
}}});`,
	);
	let sequence = 0;
	return {
		root,
		baseline,
		build,
		clone,
		recipes,
		work,
		browser,
		async run(extra = [], expectedCode = 0) {
			const out = resolve(root, `run-${sequence++}`);
			const args = [
				harness,
				"compare",
				"--concept",
				build,
				"--baseline",
				baseline,
				"--forensics",
				tools,
				"--page",
				"all",
				"--feature",
				"page",
				"--languages",
				"en",
				"--sizes",
				"desktop",
				"--inputs",
				"mouse",
				"--motions",
				"reduce",
				"--transports",
				"file",
				"--out",
				out,
				...extra,
			];
			const result = await new Promise((done, reject) => {
				const child = spawn(process.execPath, args, {
					windowsHide: true,
					timeout: 90000,
					env: {
						...process.env,
						PLAYWRIGHT_BROWSERS_PATH: resolve(unavailable, "browsers"),
						USERPROFILE: unavailable,
					},
				});
				let stdout = "";
				let stderr = "";
				child.stdout.on("data", (data) => {
					stdout += data;
				});
				child.stderr.on("data", (data) => {
					stderr += data;
				});
				child.once("error", reject);
				child.once("close", (code) => done({ code, stdout, stderr }));
			});
			assert.equal(result.code, expectedCode, result.stdout + result.stderr);
			const comparison = JSON.parse(
				await readFile(resolve(out, "comparison.json"), "utf8"),
			);
			return { ...result, comparison };
		},
	};
}

const taken = (result) =>
	result.comparison.items.map((item) => item.feature.split("/")[0]).sort();
async function edit(root, file, suffix = "\n/* changed */") {
	const target = resolve(root, file);
	await writeFile(target, (await readFile(target, "utf8")) + suffix);
}

const selectionCases = [
	[
		"one-page",
		async (f) => {
			for (const root of [f.build, f.baseline]) {
				await writeFile(resolve(root, "c.css"), "main{color:red}");
				await edit(root, "c.html", '<link rel="stylesheet" href="c.css">');
			}
			await edit(f.build, "c.css");
		},
		["c.html"],
		{ file: "reaches.mjs", from: "changed.add(file)", to: "void file" },
	],
	[
		"two-pages-share",
		(f) => edit(f.build, "shared.css"),
		["a.html", "b.html", "c.html", "components.html"],
		{
			file: "reaches.mjs",
			from: "const shared = (owners.get(file)?.size || 0) >= 2",
			to: "const shared = false",
		},
	],
	[
		"specimen-plus-one",
		(f) => edit(f.build, "nested.css"),
		["a.html", "components.html"],
		{ file: "reaches.mjs", from: 'page !== "components.html"', to: "true" },
	],
	[
		"unresolved-load",
		async (f) => {
			for (const root of [f.build, f.baseline])
				await edit(
					root,
					"c.html",
					"<script>const path=location.hash;fetch(path)</script>",
				);
		},
		["c.html"],
		{
			file: "reaches.mjs",
			from: "reasons.get(page).push(reason)",
			to: "void reason",
		},
	],
	[
		"unloaded-file",
		(f) => edit(f.build, "README.md", " changed"),
		[],
		{
			file: "compare.mjs",
			from: "pages = pages.filter((page) => reasons.get(page)?.length)",
			to: "pages = pages",
		},
	],
];

for (const [name, change, expected, mutation] of selectionCases) {
	test(`S1 CLI ${name}; isolated defect is detected`, async () => {
		for (const mutant of [false, true]) {
			const f = await fixture(`${name}-${mutant}`, mutant ? mutation : null);
			await change(f);
			const result = await f.run([
				"--affected-pages",
				"--baseline-cache",
				"off",
			]);
			if (mutant)
				assert.notDeepEqual(taken(result), expected, "Planted defect survived");
			else {
				assert.deepEqual(taken(result), expected);
				assert.match(result.stdout, /COMPARE PARTIAL/);
				assert.equal(
					(result.stdout.match(/PAGE (TAKEN|LEFT OUT):/g) || []).length,
					4,
				);
			}
		}
	});
}

test("S1 CLI bypassing the reach integration fails; omission keeps all pages", async () => {
	const f = await fixture("no-reach-call", {
		file: "compare.mjs",
		from: 'if (options["affected-pages"]) {',
		to: "if (false) {",
	});
	await edit(f.build, "README.md");
	assert.equal(
		taken(await f.run(["--affected-pages", "--baseline-cache", "off"])).length,
		4,
	);
	assert.equal(taken(await f.run(["--baseline-cache", "off"])).length, 4);
});

const invalidationCases = [
	[
		"baseline-file",
		(f) => edit(f.baseline, "nested.css"),
		{ file: "baseline-cache.mjs", from: "load.fingerprint", to: '"omitted"' },
		["a.html", "components.html"],
	],
	[
		"recipe",
		async (f) => {
			f.recipes.pages["a.html"].states[0].shows = "Changed";
			await writeFile(
				resolve(f.baseline, "verification-recipes.json"),
				JSON.stringify(f.recipes),
			);
		},
		{
			file: "reaches.mjs",
			from: '(recipes.get("*") || "") + (recipes.get(page) || "")',
			to: '"omitted"',
			all: true,
		},
		["a.html"],
	],
	[
		"CLI-file",
		(f) => edit(f.clone, "drive.mjs"),
		{
			file: "baseline-cache.mjs",
			from: "tooling,",
			to: "",
		},
		["a.html", "b.html", "c.html", "components.html"],
	],
	[
		"capture-setting",
		async () => {},
		{
			file: "baseline-cache.mjs",
			from: "settings,",
			to: "",
		},
		["a.html", "b.html", "c.html", "components.html"],
	],
	[
		"browser-build",
		(f) => edit(dirname(f.browser), "chromium.exe", " changed"),
		{
			file: "baseline-cache.mjs",
			from: "browser,",
			to: "",
		},
		["a.html", "b.html", "c.html", "components.html"],
	],
];

for (const [name, change, mutation, expected] of invalidationCases) {
	test(`S2 CLI ${name} invalidates captures; isolated defect is detected`, async () => {
		for (const mutant of [false, true]) {
			const f = await fixture(`${name}-${mutant}`, mutant ? mutation : null);
			const first = await f.run();
			assert.match(first.stdout, /0 reused; 8 captured/);
			const before = (await readFile(f.work, "utf8"))
				.split("\n")
				.filter(Boolean)
				.map(JSON.parse);
			const second = await f.run();
			assert.match(second.stdout, /4 reused; 0 captured/);
			assert.deepEqual(
				second.comparison.items.map((i) => i.result),
				first.comparison.items.map((i) => i.result),
			);
			const after = (await readFile(f.work, "utf8"))
				.split("\n")
				.filter(Boolean)
				.map(JSON.parse)
				.slice(before.length);
			assert.equal(
				after.filter((e) => e.url?.includes("/baseline/")).length,
				0,
				"Baseline browser work on reuse",
			);
			await change(f);
			const result = await f.run(
				name === "capture-setting" ? ["--cache", "none"] : [],
			);
			const captures = Number(/(\d+) captured/.exec(result.stdout)[1]);
			if (mutant)
				assert.equal(captures, 0, `Planted defect survived: ${result.stdout}`);
			else assert.equal(captures, expected.length * 2, result.stdout);
		}
	});
}

test("S2 CLI bypassing cache integration fails reuse", async () => {
	const f = await fixture("no-cache-call", {
		file: "compare.mjs",
		from: 'cache.load(page, left, resolve(out, tag, "baseline-kept"))',
		to: "Promise.resolve(null)",
	});
	await f.run();
	assert.match((await f.run()).stdout, /0 reused; 8 captured/);
});

test("S1 CLI follows JS imports/exports, document-relative fetch and inline CSS", async () => {
	for (const kind of ["module", "fetch", "inline"]) {
		const f = await fixture(`load-${kind}`);
		for (const root of [f.build, f.baseline]) {
			await mkdir(resolve(root, "scripts"));
			await writeFile(resolve(root, "leaf.css"), "main{color:white}");
			await writeFile(resolve(root, "data.json"), '{"value":1}');
			await writeFile(resolve(root, "scripts/data.json"), '{"unrelated":1}');
			await writeFile(
				resolve(root, "scripts/leaf.js"),
				"export const value=1;",
			);
			await writeFile(
				resolve(root, "scripts/middle.js"),
				'export {value} from "./leaf.js";',
			);
			await writeFile(
				resolve(root, "scripts/entry.js"),
				kind === "fetch" ? 'fetch("data.json");' : 'import "./middle.js";',
			);
			await edit(
				root,
				"c.html",
				kind === "inline"
					? '<style>@import "leaf.css";</style>'
					: '<script type="module" src="scripts/entry.js"></script>',
			);
		}
		await edit(
			f.build,
			kind === "module"
				? "scripts/leaf.js"
				: kind === "fetch"
					? "data.json"
					: "leaf.css",
		);
		assert.deepEqual(
			taken(await f.run(["--affected-pages", "--baseline-cache", "off"])),
			["c.html"],
		);
	}
});

test("S2 CLI keeps settled-repeat and timeline reserves independent; role defect is detected", async () => {
	for (const mutant of [false, true]) {
		const f = await fixture(
			`reserve-roles-${mutant}`,
			mutant
				? {
						file: "compare.mjs",
						from: "kept.settled",
						to: "kept.reserves[0]",
					}
				: null,
		);
		const adapter = resolve(f.root, "tools/scripts/web/lib.mjs");
		const text = await readFile(adapter, "utf8");
		await writeFile(
			adapter,
			text.replace(
				'Buffer.from("frame")',
				'Buffer.from(process.env.PROBE_OUT.includes("baseline-reserve") || !url.includes("/baseline/") ? "build" : "baseline")',
			),
		);
		const fresh = await f.run(["--timeline", "--baseline-cache", "off"], 1);
		assert.ok(
			fresh.comparison.items.every((item) => item.result === "different"),
			fresh.stdout + fresh.stderr,
		);
		const seeded = await f.run(["--timeline"], mutant ? 0 : 1);
		if (mutant)
			assert.ok(
				seeded.comparison.items.every((item) => item.result === "equal"),
			);
		else {
			const reused = await f.run(["--timeline"], 1);
			assert.match(reused.stdout, /0 captured/);
			assert.deepEqual(
				reused.comparison.items.map((i) => i.result),
				fresh.comparison.items.map((i) => i.result),
			);
		}
	}
});

test("S3 HTTP connections are bounded across fresh contexts; keep-alive defect is detected", async () => {
	for (const mutant of [false, true]) {
		const f = await fixture(
			`http-pool-${mutant}`,
			mutant
				? {
						file: "compare-runtime.mjs",
						from: "keepAlive: true",
						to: "keepAlive: false",
					}
				: null,
		);
		const { compareRuntime } = await import(
			pathToFileURL(resolve(f.clone, "compare-runtime.mjs"))
		);
		const runtime = compareRuntime();
		try {
			const origin = await runtime.origin(f.build, 0, "no-store");
			for (let batch = 0; batch < 50; batch++) {
				await Promise.all(
					Array.from({ length: 12 }, async () => {
						let handler;
						await runtime.route(
							{
								route: async (_pattern, callback) => {
									handler = callback;
								},
							},
							origin,
						);
						await handler({
							request: () => ({
								url: () => `${origin}/README.md`,
								method: () => "GET",
								headers: () => ({}),
								postDataBuffer: () => null,
							}),
							fulfill: async (response) => {
								assert.equal(response.status, 200);
								assert.equal(response.body.toString(), "Unloaded");
								assert.equal(response.headers["cache-control"], "no-store");
							},
							abort: async () => {
								assert.fail("Upstream request aborted");
							},
						});
					}),
				);
			}
			const counts = runtime.counts();
			assert.equal(counts.requests, 600);
			if (mutant) assert.ok(counts.connections > 6);
			else {
				assert.ok(counts.connections <= 6);
				assert.ok(counts.peak <= 6);
			}
		} finally {
			await runtime.close();
		}
	}
});

test("S1/S2 CLI recipe entry whitespace selects and invalidates its page; span defect is detected", async () => {
	for (const mutant of [false, true]) {
		const f = await fixture(
			`recipe-bytes-${mutant}`,
			mutant
				? {
						file: "reaches.mjs",
						from: "page.getFullText(source)",
						to: "page.initializer.getText(source)",
					}
				: null,
		);
		await f.run();
		const path = resolve(f.baseline, "verification-recipes.json");
		await writeFile(
			path,
			(await readFile(path, "utf8")).replace('"c.html":{', '"c.html":  {'),
		);
		const selected = await f.run([
			"--affected-pages",
			"--baseline-cache",
			"off",
		]);
		assert.deepEqual(taken(selected), mutant ? [] : ["c.html"]);
		assert.match(
			(await f.run()).stdout,
			mutant ? /4 reused; 0 captured/ : /3 reused; 2 captured/,
		);
	}
});

test("S1 CLI never treats assigned element tags as a resolved load", async () => {
	for (const kind of ["variable", "parameter", "array", "object", "loop"]) {
		for (const mutant of [false, true]) {
			const mutation =
				kind === "variable"
					? {
							file: "reaches.mjs",
							from: "declaration.parent.flags & ts.NodeFlags.Const",
							to: "true",
						}
					: {
							file: "reaches.mjs",
							from: "if (written) return null",
							to: "if (false) return null",
						};
			const f = await fixture(
				`tag-write-${kind}-${mutant}`,
				mutant ? mutation : null,
			);
			for (const root of [f.build, f.baseline]) {
				const assignments = {
					parameter: 'tag="script";',
					array: '[tag]=["script"];',
					object: '({tag}={tag:"script"});',
					loop: 'for(tag of ["script"]){}',
				};
				await writeFile(
					resolve(root, "tag.js"),
					kind === "variable"
						? 'let tag="div";tag="script";document.createElement(tag);'
						: `function make(tag){${assignments[kind]}return document.createElement(tag)}make("div");`,
				);
				await edit(root, "c.html", '<script src="tag.js"></script>');
			}
			assert.deepEqual(
				taken(await f.run(["--affected-pages", "--baseline-cache", "off"])),
				mutant ? [] : ["c.html"],
			);
		}
	}
});

test("S3 interrupted preview creation closes its server; cleanup defect is detected", async () => {
	for (const mutant of [false, true]) {
		const f = await fixture(`preview-abort-${mutant}`);
		const file = resolve(f.clone, "compare-runtime.mjs");
		let source = await readFile(file, "utf8");
		const probe = resolve(f.root, "preview-listener.mjs");
		await writeFile(
			probe,
			`export let stopped=false;export const preview=async()=>{process.emit("SIGINT");await Promise.resolve();return {origin:"http://fixture",close:async()=>{stopped=true}}};`,
		);
		source = source.replace(
			'import { preview } from "./core.mjs";',
			`import {preview} from ${JSON.stringify(pathToFileURL(probe).href)};`,
		);
		if (mutant)
			source = source.replace(
				"if (closed) {\n\t\t\t\t\tawait server.close();",
				"if (false) {\n\t\t\t\t\tawait server.close();",
			);
		await writeFile(file, source);
		const { compareRuntime } = await import(pathToFileURL(file));
		const { stopped } = await import(pathToFileURL(probe));
		assert.equal(stopped, false);
		const runtime = compareRuntime();
		const started = runtime.origin(f.build, 0, "no-store");
		if (mutant) await started;
		else await assert.rejects(started, /interrupted during preview creation/);
		const closing = runtime.close();
		assert.equal(runtime.close(), closing);
		await closing;
		assert.equal((await import(pathToFileURL(probe))).stopped, !mutant);
	}
});
