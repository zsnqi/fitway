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
	const root = "D:/fitway-temp/owner-r04-vf-fixes/parallel";
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
await main(process.argv.slice(2),{compare:{child:async(command,args)=>{
 if(!args[0].endsWith("diff_map.py")||!args.includes("--json"))throw new Error("Unexpected fixture child: "+command);
 const [a,b]=await Promise.all([readFile(args[1]),readFile(args[2])]);const identical=a.equals(b);
 await writeFile(args[args.indexOf("--json")+1],JSON.stringify({identical,bbox:null,changedPixels:identical?0:1}));
},doctor:async(options)=>{
 const map=generateMap(options.concept,options.recipes);
 const problems=coverageProblems(map,options.concept);if(problems.length)throw new Error(problems.join("\\n"));
 return {concept:options.concept,map,tools:options.forensics,loaded:{resolved:${JSON.stringify(browser)},version:"fixture",pw:{chromium:{executablePath:()=>${JSON.stringify(browser)}}}}};
}}});`,
	);
	// Fixture pairs use kernel-selected ports; no reserved preview port is touched.
	const { createServer } = await import("node:net");
	const listeners = await Promise.all(
		Array.from({ length: 6 }, async () => {
			const server = createServer();
			await new Promise((done) => server.listen(0, "::", done));
			return server;
		}),
	);
	const ports = listeners.map((server) => server.address().port);
	await Promise.all(
		listeners.map((server) => new Promise((done) => server.close(done))),
	);
	const pairs = [ports.slice(0, 2), ports.slice(2, 4), ports.slice(4, 6)];
	const core = resolve(clone, "core.mjs");
	await writeFile(
		core,
		(await readFile(core, "utf8")).replace(
			/export const verificationPairs = \[[\s\S]*?\];/,
			`export const verificationPairs = ${JSON.stringify(pairs)};`,
		),
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
		pairs,
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
				"--port",
				String(pairs[0][0]),
				"--baseline-port",
				String(pairs[0][1]),
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
			const comparison = await readFile(resolve(out, "comparison.json"), "utf8")
				.then(JSON.parse)
				.catch(() => null);
			return { ...result, comparison, out };
		},
	};
}

const verdicts = (result) =>
	result.comparison.items.map(
		({
			feature,
			state,
			language,
			size,
			input,
			motion,
			transport,
			colors,
			result,
			problems,
			region,
			changedPixels,
			repeated,
			initial,
		}) => ({
			feature,
			state,
			language,
			size,
			input,
			motion,
			transport,
			colors,
			result,
			problems,
			region,
			changedPixels,
			repeated,
			initial,
		}),
	);
async function changeFile(f, file, from, to) {
	const path = resolve(f.clone, file);
	const source = await readFile(path, "utf8");
	assert.ok(source.includes(from), `Mutation seam absent: ${from}`);
	await writeFile(path, source.replace(from, to));
}
const pairArgs = (pair) => [
	"--port",
	String(pair[0]),
	"--baseline-port",
	String(pair[1]),
];

test("L1/P2 CLI browser startup failure still attempts both sides and keeps the original diagnostic", async () => {
	const f = await fixture("browser-startup-failure");
	const adapter = resolve(f.root, "tools/scripts/web/lib.mjs");
	await writeFile(
		adapter,
		(await readFile(adapter, "utf8")).replace(
			"return {close:async()=>{}}",
			'throw new Error("fixture launch failure")',
		),
	);
	for (const workers of [1, 4]) {
		const failed = await f.run(
			[
				"--page",
				"a.html",
				"--baseline-cache",
				"off",
				"--workers",
				String(workers),
			],
			1,
		);
		assert.match(
			failed.stderr,
			/Comparison captured no items: build=fixture launch failure; baseline=fixture launch failure/,
		);
		assert.equal(
			JSON.parse(
				await readFile(resolve(failed.out, "a/build/manifest.json"), "utf8"),
			).items.length,
			0,
		);
		assert.equal(
			JSON.parse(
				await readFile(resolve(failed.out, "a/baseline/manifest.json"), "utf8"),
			).items.length,
			0,
		);
	}
});

test("P1 CLI rejects outside and mixed pairs; each isolated allocation defect is caught", async () => {
	const f = await fixture("pair-validation");
	const mixed = [f.pairs[0][0], f.pairs[1][1]];
	const outside = [1, f.pairs[0][1]];
	for (const pair of [outside, mixed]) {
		const bad = await f.run([...pairArgs(pair), "--baseline-cache", "off"], 1);
		assert.match(bad.stderr, /verification (allocation|pair)/);
		for (const allowed of f.pairs)
			assert.ok(bad.stderr.includes(allowed.join("-")));
	}
	// Defect: permit a mixed pair while retaining individual port validation.
	await changeFile(
		f,
		"core.mjs",
		"pair[0] === ports[0] && pair[1] === ports[1]",
		"true",
	);
	assert.ok(
		(await f.run([...pairArgs(mixed), "--baseline-cache", "off"])).comparison,
	);
	// Outside-port validation is tested independently through the CLI's parser.
	const g = await fixture("outside-validation");
	await changeFile(
		g,
		"core.mjs",
		"if (!verificationPairs.flat().includes(Number(port)))",
		"if (false)",
	);
	const invalid = await g.run(
		[...pairArgs(outside), "--baseline-cache", "off"],
		1,
	);
	assert.doesNotMatch(invalid.stderr, /outside the verification allocation/);
	assert.match(invalid.stderr, /ordered verification pair/);
});

test("P1 CLI refuses a busy pair immediately and retains its listener; bypass defect is caught", async () => {
	const f = await fixture("busy-pair");
	const { createServer } = await import("node:http");
	const server = createServer((_, response) => response.end("fixture owner"));
	await new Promise((done) => server.listen(f.pairs[0][0], "::", done));
	try {
		const before = Date.now();
		const refused = await f.run(["--baseline-cache", "off"], 1);
		assert.match(refused.stderr, /held by a process/);
		assert.ok(refused.stderr.includes(f.pairs[0].join("-")));
		assert.ok(Date.now() - before < 5000);
		const command = resolve(f.root, "command.mjs");
		await writeFile(
			command,
			(await readFile(command, "utf8")).replace(
				"compare:{child:",
				"compare:{checkPort:async()=>{},child:",
			),
		);
		assert.ok((await f.run(["--baseline-cache", "off"])).comparison);
		assert.equal(
			await (await fetch(`http://127.0.0.1:${f.pairs[0][0]}`)).text(),
			"fixture owner",
		);
	} finally {
		await new Promise((done) => server.close(done));
	}
});

test("P2 CLI workers 2/3/4 keep ordered items/verdicts and overlap captures; ordering defect is caught", async () => {
	const f = await fixture("worker-order");
	const adapter = resolve(f.root, "tools/scripts/web/lib.mjs");
	await writeFile(
		adapter,
		(await readFile(adapter, "utf8"))
			.replace(
				'Buffer.from("frame")',
				'Buffer.from(url.includes("/build/") && url.includes("/c.html") ? "changed" : "frame")',
			)
			.replace("let url;const page", "let url;const errors=[];const page")
			.replace(
				"setURL:value=>{url=value}",
				'setURL:value=>{url=value;if(value.includes("/b.html"))errors.push("fixture page error")}',
			)
			.replace("errors:[],emulation:", "errors,emulation:"),
	);
	const settings = [
		"--sizes",
		"desktop,tablet,phone",
		"--motions",
		"reduce,full",
		"--baseline-cache",
		"off",
	];
	const serial = await f.run(settings, 1);
	assert.deepEqual(
		new Set(serial.comparison.items.map((item) => item.result)),
		new Set(["equal", "problem", "different"]),
	);
	for (const count of [2, 3, 4]) {
		const parallel = await f.run([...settings, "--workers", String(count)], 1);
		assert.deepEqual(verdicts(parallel), verdicts(serial));
		assert.deepEqual(
			parallel.stdout
				.split("\n")
				.filter((line) =>
					/^COMPARE (PASS|FAIL):|^BASELINE CAPTURES:/.test(line),
				)
				.map((line) => line.replaceAll(parallel.out, serial.out)),
			serial.stdout
				.split("\n")
				.filter((line) =>
					/^COMPARE (PASS|FAIL):|^BASELINE CAPTURES:/.test(line),
				),
		);
		const frames = JSON.parse(
			await readFile(resolve(parallel.out, "a/build/manifest.json"), "utf8"),
		).items;
		assert.ok(
			frames.some((frame, index) =>
				frames
					.slice(index + 1)
					.some((other) => other.captureStartedAt < frame.captureEndedAt),
			),
			"Workers did not overlap",
		);
	}
	await changeFile(
		f,
		"runner.mjs",
		"for (const language of languages) {",
		"if (options.workers > 1) manifest.items.reverse(); for (const language of languages) {",
	);
	assert.notDeepEqual(
		verdicts(await f.run([...settings, "--workers", "4"], 1)),
		verdicts(serial),
	);
});

test("P3 CLI item bundles reuse across pairs/narrow axes and invalidate baseline bytes; isolated key defects are caught", async () => {
	for (const defect of [null, "port", "axes", "bytes"]) {
		const f = await fixture(`item-reuse-${defect}`);
		if (defect === "port")
			await changeFile(
				f,
				"baseline-cache.mjs",
				"settings,",
				'settings, this.options["baseline-port"],',
			);
		if (defect === "axes")
			await changeFile(
				f,
				"baseline-cache.mjs",
				"settings,",
				"settings, this.options.sizes,",
			);
		if (defect === "bytes")
			await changeFile(
				f,
				"baseline-cache.mjs",
				"load.fingerprint",
				'"omitted"',
			);
		const all = ["--page", "a.html", "--sizes", "desktop,phone"];
		await f.run(all);
		const across = await f.run([...all, ...pairArgs(f.pairs[1])]);
		assert.match(
			across.stdout,
			defect === "port" ? /0 reused; 4 captured/ : /2 reused; 0 captured/,
		);
		const narrow = await f.run(["--page", "a.html", "--sizes", "phone"]);
		assert.match(
			narrow.stdout,
			defect === "axes" ? /0 reused; 2 captured/ : /1 reused; 0 captured/,
		);
		const off = await f.run([
			"--page",
			"a.html",
			"--sizes",
			"phone",
			"--baseline-cache",
			"off",
		]);
		assert.deepEqual(verdicts(narrow), verdicts(off));
		await writeFile(resolve(f.baseline, "nested.css"), "main{background:blue}");
		const changed = await f.run(["--page", "a.html", "--sizes", "phone"]);
		assert.match(
			changed.stdout,
			defect === "bytes" ? /1 reused; 0 captured/ : /0 reused; 2 captured/,
		);
	}
});

test("P3 CLI simultaneous writers leave one whole bundle; publication defect is caught", async () => {
	for (const broken of [false, true]) {
		const f = await fixture(`publication-${broken}`);
		await changeFile(
			f,
			"baseline-cache.mjs",
			"await mkdir(pending, { recursive: true });",
			"await mkdir(pending, { recursive: true }); await new Promise(done => setTimeout(done, 200));",
		);
		if (broken)
			await changeFile(
				f,
				"cache-lock.mjs",
				"const claim = await claimResource",
				"return () => Promise.resolve(); const claim = await claimResource",
			);
		const settings = ["--page", "a.html"];
		const writers = Promise.all([
			f.run(settings),
			f.run([...settings, ...pairArgs(f.pairs[1])]),
		]);
		if (broken) {
			// Windows reports a directory renamed onto a published one as EPERM.
			await assert.rejects(writers, /ENOENT|ENOTEMPTY|EEXIST|EPERM/);
			continue;
		}
		await writers;
		const reused = await f.run([...settings, ...pairArgs(f.pairs[2])]);
		assert.match(reused.stdout, /1 reused; 0 captured/);
		assert.ok(reused.comparison.items.every((item) => item.result === "equal"));
		const entries = (await readdir(resolve(f.root, "cache"))).filter((name) =>
			/^[a-f0-9]{64}$/.test(name),
		);
		assert.equal(entries.length, 1);
		const entry = JSON.parse(
			await readFile(
				resolve(f.root, "cache", entries[0], "entry.json"),
				"utf8",
			),
		);
		const { createHash } = await import("node:crypto");
		for (const artifact of entry.artifacts)
			assert.equal(
				createHash("sha256")
					.update(
						await readFile(resolve(f.root, "cache", entries[0], artifact.name)),
					)
					.digest("hex"),
				artifact.digest,
			);
	}
});

test("P2 CLI initialization failure retains the serial prefix; missing truncation is caught", async () => {
	const f = await fixture("initialization-failure");
	const adapter = resolve(f.root, "tools/scripts/web/lib.mjs");
	await writeFile(
		adapter,
		(await readFile(adapter, "utf8")).replace(
			"export const newContext=async()=>{",
			'let calls=0;export const newContext=async()=>{if(++calls===3)throw new Error("fixture context failure");',
		),
	);
	const options = [
		"--page",
		"a.html",
		"--sizes",
		"desktop,tablet,phone",
		"--motions",
		"reduce,full",
		"--baseline-cache",
		"off",
	];
	const serial = await f.run(options, 1);
	const parallel = await f.run([...options, "--workers", "4"], 1);
	assert.deepEqual(verdicts(parallel), verdicts(serial));
	await changeFile(
		f,
		"runner.mjs",
		"onFailure(failed.index);",
		"/* planted missing truncation */",
	);
	assert.notDeepEqual(
		verdicts(await f.run([...options, "--workers", "4"], 1)),
		verdicts(serial),
	);
});

test("P3 CLI baseline-only features survive fresh and reused item caches", async () => {
	const f = await fixture("baseline-only");
	f.recipes.pages["a.html"].features.push({
		id: "extra",
		what: "Baseline-only feature",
		actions: [],
		proof: { selector: "main", visible: true },
	});
	await writeFile(
		resolve(f.baseline, "verification-recipes.json"),
		JSON.stringify(f.recipes),
	);
	const options = ["--page", "a.html", "--feature", "all"];
	const off = await f.run([...options, "--baseline-cache", "off"], 1);
	const fresh = await f.run(options, 1);
	const reused = await f.run(options, 1);
	assert.deepEqual(verdicts(fresh), verdicts(off));
	assert.deepEqual(verdicts(reused), verdicts(off));
	assert.match(reused.stdout, /2 reused; 0 captured/);
});

test("P3 CLI concurrent reclaimers safely recover a dead ownerless publication claim", async () => {
	const f = await fixture("dead-claim");
	const root = resolve(f.root, "cache/.publish-claims");
	await new Promise((done, reject) => {
		const child = spawn(
			process.execPath,
			[
				"-e",
				`require('fs').mkdirSync(${JSON.stringify(root)}+'/claim-'+process.pid+'-${"a".repeat(48)}',{recursive:true})`,
			],
			{ windowsHide: true },
		);
		child.once("error", reject);
		child.once("close", (code) =>
			code ? reject(new Error(`Claim fixture exited ${code}`)) : done(),
		);
	});
	await Promise.all([
		f.run(["--page", "a.html"]),
		f.run(["--page", "a.html", ...pairArgs(f.pairs[1])]),
	]);
	assert.deepEqual(await readdir(root), []);
	assert.match(
		(await f.run(["--page", "a.html"])).stdout,
		/1 reused; 0 captured/,
	);
});

test("P3 CLI partial hits preserve a fresh and retained fatal baseline boundary", async () => {
	const f = await fixture("partial-fatal");
	const adapter = resolve(f.root, "tools/scripts/web/lib.mjs");
	await writeFile(
		adapter,
		(await readFile(adapter, "utf8")).replace(
			"export const newContext=async()=>{",
			'export const newContext=async(_browser,options)=>{if(process.env.PROBE_OUT.includes("baseline")&&options.viewport.width===768)throw new Error("fixture baseline context failure");',
		),
	);
	await f.run(["--page", "a.html", "--sizes", "phone"]);
	const options = [
		"--page",
		"a.html",
		"--sizes",
		"desktop,desktop,tablet,phone",
	];
	const off = await f.run([...options, "--baseline-cache", "off"], 1);
	const fresh = await f.run(options, 1);
	const retained = await f.run(options, 1);
	assert.deepEqual(verdicts(fresh), verdicts(off));
	assert.deepEqual(verdicts(retained), verdicts(off));
});

test("P2 CLI supported axes, states, duplicates and timeline retain serial order and verdicts", async () => {
	const f = await fixture("axis-matrix");
	const adapter = resolve(f.root, "tools/scripts/web/lib.mjs");
	await writeFile(
		resolve(f.root, "tools/scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.3.1";export const CONTEXT_SPEC={forcedColors:true};',
	);
	await writeFile(
		adapter,
		(await readFile(adapter, "utf8"))
			.replace(
				"export const newContext=async()=>{",
				"export const newContext=async(_browser,options)=>{",
			)
			.replace(
				'{language:"en",direction:"ltr",coarse:false,touchPoints:0}',
				'{language:options.locale.startsWith("ar")?"ar":"en",direction:options.locale.startsWith("ar")?"rtl":"ltr",coarse:options.touch,touchPoints:options.touch?1:0}',
			)
			.replace(
				'fn.toString().includes("coarse")?',
				'fn.toString().includes("background-color:Canvas")?{active:true,background:"black",canvas:"black"}:fn.toString().includes("coarse")?',
			)
			.replace(
				"count:async()=>1,waitFor:",
				'count:async()=>1,evaluate:async()=>({tag:"body",id:"",role:"",name:"",selector:"body"}),waitFor:',
			),
	);
	const states =
		'const params=new URLSearchParams(location.search);const state=params.get("state")||"live";if(state==="live"){}if(state==="loading"){}';
	for (const input of [f.baseline, f.build]) {
		await writeFile(
			resolve(input, "app.js"),
			(await readFile(resolve(input, "app.js"), "utf8")) + states,
		);
		const recipes = JSON.parse(
			await readFile(resolve(input, "verification-recipes.json"), "utf8"),
		);
		for (const value of ["live", "loading"])
			recipes.pages["a.html"].states.push({
				when: { state: value },
				shows: value,
				proof: { selector: "main", visible: true },
			});
		await writeFile(
			resolve(input, "verification-recipes.json"),
			JSON.stringify(recipes),
		);
	}
	const options = [
		"--page",
		"a.html",
		"--states",
		"all",
		"--languages",
		"ar,en",
		"--sizes",
		"desktop,phone,phone",
		"--inputs",
		"mouse,touch,keyboard",
		"--motions",
		"reduce,full",
		"--transports",
		"http,file",
		"--colors",
		"normal,forced",
		"--timeline",
		"--baseline-cache",
		"off",
	];
	const one = await f.run(options);
	const four = await f.run([...options, "--workers", "4"]);
	assert.deepEqual(verdicts(four), verdicts(one));
	assert.ok(one.comparison.items.length >= 288);
});
