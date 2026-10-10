import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { watch } from "node:fs";
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { child, doctorFix, playwright } from "./cli.mjs";
import { measurementColors } from "./colors.mjs";
import { diffStem } from "./compare.mjs";
import {
	assertOutsideGit,
	lanOrigins,
	outputFile,
	parsePortOwners,
	portAvailable,
	preview,
	shortFinding,
	verificationPort,
} from "./core.mjs";
import { performAction, proveFeature, reachByKeyboard } from "./drive.mjs";
import {
	coverageProblems,
	discoverElements,
	drift,
	extractDependencies,
	extractSwitches,
	generateMap,
	repairRecipes,
} from "./map.mjs";
import { sourceProbe } from "./probes.mjs";
import { inputAxis, itemSummary, resolveQuery, stateCases } from "./runner.mjs";

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
	assert.equal(shortFinding("one\n  two"), "one two");
	assert.match(shortFinding("detail ".repeat(1000)), /… \(see record\)$/);
	assert.ok(shortFinding("detail ".repeat(1000)).length < 260);
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
test("doctor gives portable concrete repair commands; verification ports are restricted", async () => {
	const opts = { concept, recipes };
	assert.match(
		await doctorFix(opts, new Error("Recipe drift")),
		/node '.*cli.mjs' repair-recipes --concept/,
	);
	assert.match(
		await doctorFix(opts, new Error("Chromium missing")),
		/cli.js' install chromium/,
	);
	for (const port of [3174, 3180, 3185])
		assert.throws(() => verificationPort(port), /choose 3176 or 3177/);
	assert.equal(verificationPort("3176"), 3176);
});

test("keyboard is an axis; Tab/Enter are the only reach input and each key records focus", async () => {
	assert.deepEqual(inputAxis("keyboard"), ["keyboard"]);
	const keys = [];
	let focus = 0;
	const stops = ["body", "#first", "#pin-change", "#pin-code"];
	const page = {
		evaluate: async () => ({ selector: stops[focus], text: stops[focus] }),
		locator: (selector) => ({
			first() {
				return this;
			},
			count: async () => 1,
			evaluate: async () => stops[focus] === selector,
		}),
		keyboard: {
			press: async (key) => {
				keys.push(key);
				focus = key === "Enter" ? 3 : (focus + 1) % stops.length;
			},
		},
	};
	const entry = {};
	await performAction(
		{},
		page,
		"activate:#pin-change",
		"keyboard",
		scratch,
		"test",
		entry,
	);
	assert.deepEqual(keys, ["Tab", "Tab", "Enter"]);
	assert.deepEqual(
		entry.focusSteps.map((s) => s.after.selector),
		["#first", "#pin-change", "#pin-code"],
	);
	await assert.rejects(
		reachByKeyboard(page, "#pointer-only", entry, "focus:#pointer-only"),
		/Not reachable by keyboard: #pointer-only; focus stopped at #pin-code.*cycle repeated/,
	);
});

test("a focused control whose keys do not produce the feature reports keyboard unreachability", async () => {
	const page = {
		evaluate: async () => ({ selector: "#mouse-only" }),
		locator: () => ({
			first() {
				return this;
			},
			waitFor: async () => {
				throw new Error("dialog stayed closed");
			},
		}),
	};
	await assert.rejects(
		proveFeature(
			page,
			{ selector: "#dialog", visible: true },
			"ar",
			"keyboard",
		),
		/Not reachable by keyboard via the recorded sequence: #dialog; focus stopped at #mouse-only; dialog stayed closed/,
	);
	await assert.rejects(
		proveFeature(page, { selector: "#dialog", visible: true }, "ar", "mouse"),
		/^Error: dialog stayed closed$/,
	);
});

test("planted aria-haspopup openers without targets, ids or classes fail by name, including specimens", async () => {
	const file = resolve(concept, "index.html");
	try {
		await writeFile(
			file,
			`${html}\n<button id="next-menu" aria-haspopup="menu">Next</button>\n<button aria-haspopup="true">Unnamed</button>\n<button id="closed" aria-haspopup="false">Closed</button>`,
		);
		const found = coverageProblems(generateMap(concept), concept).join("\n");
		assert.match(found, /index.html:2: uncovered opener #next-menu/);
		assert.match(
			found,
			/index.html:3: uncovered opener button\[aria-haspopup="true"\]/,
		);
		assert.doesNotMatch(found, /uncovered opener #closed/);
		const specimen = discoverElements([
			{
				file: "components.js",
				text: 'const specimen=`<button id="sample" tabindex="-1" aria-haspopup="menu"></button>`;const live=`<button id="live" aria-haspopup="menu"></button>`;',
			},
		]);
		assert.deepEqual(
			specimen.openers.map((o) => o.selector),
			["#sample", "#live"],
		);
	} finally {
		await writeFile(file, html);
	}
});

test("repair removes stale feature and state selectors/markers, preserves good entries and leaves only drafts; source is unchanged", async () => {
	const file = resolve(concept, "index.html");
	const stale = authored();
	stale.pages["index.html"].features.push({
		id: "gone-marker",
		marker: "retired",
		actions: [],
		proof: { ready: true },
	});
	stale.pages["index.html"].states.push({
		when: { state: "old" },
		proof: { selector: "#old-state", visible: true },
	});
	try {
		const source = `${html.replaceAll("ops-pop", "new-pop")}\n<button id="new-menu" aria-haspopup="menu">New</button>`;
		await writeFile(file, source);
		await writeFile(recipes, JSON.stringify(stale));
		const before = await readFile(recipes, "utf8");
		const repaired = repairRecipes(concept);
		assert.equal(repaired.dropped.length, 3);
		assert.equal(
			repaired.recipes.pages["index.html"].features.some(
				(f) => f.id === "status" || f.id === "gone-marker",
			),
			false,
		);
		assert.equal(repaired.recipes.pages["index.html"].states.length, 1);
		const copy = resolve(scratch, "repaired.json");
		await writeFile(copy, JSON.stringify(repaired.recipes));
		const findings = drift(generateMap(concept, copy), concept, copy);
		assert.equal(findings.length, 2);
		assert.ok(findings.every((p) => p.includes("draft recipe")));
		assert.equal(await readFile(file, "utf8"), source);
		assert.equal(await readFile(recipes, "utf8"), before);
		for (const f of repaired.recipes.pages["index.html"].features) {
			delete f.draft;
			f.proof = { selector: "main", visible: true };
		}
		await writeFile(copy, JSON.stringify(repaired.recipes));
		assert.deepEqual(drift(generateMap(concept, copy), concept, copy), []);
	} finally {
		await writeFile(file, html);
		await writeFile(recipes, JSON.stringify(authored()));
	}
});

test("missing recipes repair to drafts without touching concept inputs", async () => {
	const missing = resolve(scratch, "no-recipes.json");
	const result = repairRecipes(concept, missing);
	assert.ok(result.drafts.length);
	assert.equal(result.recipes.pages["index.html"].features[0].draft, true);
});

test("repaired duplicate selectors report only occurrence-bound drafts", async () => {
	const file = resolve(concept, "index.html");
	try {
		await writeFile(
			file,
			`${html}\n<button class="same" aria-haspopup="menu"></button><button class="same" aria-haspopup="menu"></button>`,
		);
		const repaired = repairRecipes(concept);
		assert.equal(repaired.drafts.length, 2);
		const copy = resolve(scratch, "duplicate-drafts.json");
		await writeFile(copy, JSON.stringify(repaired.recipes));
		const findings = coverageProblems(generateMap(concept, copy), concept);
		assert.equal(findings.length, 2);
		assert.ok(findings.every((p) => p.includes("draft recipe")));
	} finally {
		await writeFile(file, html);
	}
});

test("opener template parameters keep the enclosing function's literal call values", () => {
	const d = discoverElements([
		{
			file: "scope.js",
			// biome-ignore lint/suspicious/noTemplateCurlyInString: Fixture source intentionally contains a template expression.
			text: 'function render(act){return `<button data-act="${act}" aria-haspopup="dialog"></button>`;}function other(act){};render("mine");render("off");other("add");',
		},
	]);
	assert.deepEqual(
		d.openers.map((o) => o.selector),
		['[data-act="mine"]', '[data-act="off"]'],
	);
});

test("specimen source coverage cannot cover a live opener with identical classes; comment shifts retain coverage", async () => {
	const script = resolve(concept, "app.js");
	const r = authored();
	r.pages["index.html"].features.push({
		id: "specimen",
		actions: [],
		proof: { ready: true },
		coversOpeners: [
			{
				selector: 'button[aria-haspopup="menu"].same',
				file: "app.js",
				marker: "const specimen =",
			},
		],
	});
	const specimen =
		'\nconst specimen = `<button class="same" aria-haspopup="menu" tabindex="-1"></button>`;';
	try {
		await writeFile(recipes, JSON.stringify(r));
		await writeFile(script, js + specimen);
		assert.deepEqual(coverageProblems(generateMap(concept), concept), []);
		await writeFile(script, `// shifted\n${js}${specimen}`);
		assert.deepEqual(coverageProblems(generateMap(concept), concept), []);
		await writeFile(
			script,
			js +
				specimen +
				'\nconst live = `<button class="same" aria-haspopup="menu"></button>`;',
		);
		assert.match(
			coverageProblems(generateMap(concept), concept).join("\n"),
			/app.js:3: uncovered opener button\[aria-haspopup="menu"\].same/,
		);
		await writeFile(
			script,
			js +
				specimen +
				'const live = `<button class="same" aria-haspopup="menu"></button>`;',
		);
		const sameLine = generateMap(concept);
		assert.equal(sameLine.pages[0].openers.length, 2);
		assert.equal(
			coverageProblems(sameLine, concept).filter((p) =>
				p.includes("uncovered opener"),
			).length,
			1,
		);
		r.pages["index.html"].features.at(-1).coversOpeners = undefined;
		r.pages["index.html"].features.at(-1).actions = ["activate:#known .same"];
		await writeFile(recipes, JSON.stringify(r));
		assert.equal(
			coverageProblems(generateMap(concept), concept).filter((p) =>
				p.includes("uncovered opener"),
			).length,
			2,
		);
	} finally {
		await writeFile(script, js);
		await writeFile(recipes, JSON.stringify(authored()));
	}
});

test("JS-assigned aria-haspopup is discovered on native elements without ids", () => {
	const d = discoverElements([
		{
			file: "dynamic.js",
			text: 'const button=document.createElement("button");button.setAttribute("aria-haspopup","menu");\nconst second=document.createElement("button");second.ariaHasPopup="dialog";',
		},
	]);
	assert.equal(d.openers.length, 2);
	assert.equal(d.openers[0].selector, 'button[aria-haspopup="menu"]');
	assert.equal(d.openers[1].selector, 'button[aria-haspopup="dialog"]');
	const booleans = discoverElements([
		{
			file: "boolean.js",
			text: 'const button=document.createElement("button");button.id="boolean-menu";button.setAttribute("aria-haspopup",true);const second=document.createElement("button");second.ariaHasPopup=true;',
		},
	]);
	assert.deepEqual(
		booleans.openers.map((o) => o.kind),
		["true", "true"],
	);
});

test("IPv6 listener refusal names :: and leaves its owner running", async () => {
	const server = createServer((_, res) => res.end("foreign IPv6"));
	await new Promise((done) => server.listen(0, "::", done));
	const port = server.address().port;
	assert.ok(port >= 49152);
	try {
		const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
		const result = spawnSync(
			process.execPath,
			[
				cli,
				"launch",
				"--concept",
				concept,
				"--isolated-port",
				String(port),
				"--out",
				resolve(scratch, "ipv6-refusal"),
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		if (process.platform === "win32") assert.match(result.stderr, /:: pid=/);
		assert.ok(result.stderr.includes(`Port ${port}`), result.stderr);
		assert.equal((await fetchRaw(port, "/")).body.toString(), "foreign IPv6");
	} finally {
		await new Promise((done) => server.close(done));
	}
});

test("listener parsing preserves IPv6 and IPv4 addresses; LAN URLs use real external interfaces", () => {
	assert.deepEqual(
		lanOrigins(
			3176,
			{
				net: [
					{ family: "IPv4", address: "169.254.1.2", internal: false },
					{ family: "IPv4", address: "172.24.1.1", internal: false },
					{ family: "IPv4", address: "192.168.1.8", internal: false },
				],
			},
			["192.168.1.8"],
		),
		["http://192.168.1.8:3176"],
	);
	assert.deepEqual(
		parsePortOwners(
			"TCP [::]:3177 [::]:0 LISTENING 42\nTCP 0.0.0.0:3176 0.0.0.0:0 LISTENING 43",
			3177,
		),
		[{ address: "::", pid: 42 }],
	);
	assert.deepEqual(
		lanOrigins(3176, {
			net: [{ family: "IPv4", address: "192.168.1.8", internal: false }],
			local: [{ family: "IPv4", address: "127.0.0.1", internal: true }],
		}),
		["http://192.168.1.8:3176"],
	);
	assert.throws(() => lanOrigins(3176, {}), /No external IPv4 LAN address/);
	assert.match(
		diffStem({
			feature: "access.html/pinChange",
			state: "pin=none",
			language: "ar",
			size: "tablet",
			input: "keyboard",
			motion: "reduce",
			transport: "http",
		}),
		/access-html-pinChange-pin-none-ar-tablet-keyboard-reduce-http/,
	);
});

test("help in a dependency-free clone succeeds and names installation", async () => {
	const folder = resolve(scratch, "clone/.agents/skills/verify-fitway");
	await mkdir(folder, { recursive: true });
	for (const name of [
		"cli.mjs",
		"colors.mjs",
		"core.mjs",
		"compare.mjs",
		"runner.mjs",
		"drive.mjs",
		"probes.mjs",
		"map.mjs",
		"discover.mjs",
	])
		await writeFile(
			resolve(folder, name),
			await readFile(fileURLToPath(new URL(`./${name}`, import.meta.url))),
		);
	const result = spawnSync(
		process.execPath,
		[resolve(folder, "cli.mjs"), "help"],
		{ encoding: "utf8", windowsHide: true },
	);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	assert.match(result.stdout, /--inputs mouse,touch,keyboard/);
	assert.match(result.stdout, /pnpm --dir .* install --frozen-lockfile/);
	assert.doesNotMatch(result.stderr, /Cannot find module/);
});

test("quiet comparison children keep diff JSON and diagnostics off success output, and preserve failure diagnostics", async () => {
	const noisy = resolve(scratch, "noisy-diff.mjs");
	const caller = resolve(scratch, "quiet-caller.mjs");
	await writeFile(
		noisy,
		'console.log(JSON.stringify({diff:Array(1000).fill("detail")}));console.error("diff_map: summary");',
	);
	await writeFile(
		caller,
		`import {child} from ${JSON.stringify(new URL("./cli.mjs", import.meta.url).href)};try{await child(process.execPath,[${JSON.stringify(noisy)}],${JSON.stringify(scratch)},undefined,true)}catch(error){console.error(error.message);process.exitCode=1}`,
	);
	const success = spawnSync(process.execPath, [caller], {
		encoding: "utf8",
		windowsHide: true,
	});
	assert.equal(success.status, 0);
	assert.equal(success.stdout, "");
	assert.equal(success.stderr, "");
	await writeFile(
		noisy,
		'console.error("planted diff failure");process.exit(2);',
	);
	const failure = spawnSync(process.execPath, [caller], {
		encoding: "utf8",
		windowsHide: true,
	});
	assert.equal(failure.status, 1);
	assert.match(failure.stderr, /planted diff failure/);
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
	await new Promise((done) => server.listen(0, "0.0.0.0", done));
	const port = server.address().port;
	assert.ok(port >= 49152);
	const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
	const folder = resolve(scratch, "refused-launch");
	try {
		await assert.rejects(portAvailable(port), /did not start/);
		const result = spawnSync(
			process.execPath,
			[
				cli,
				"launch",
				"--concept",
				concept,
				"--isolated-port",
				String(port),
				"--out",
				folder,
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		assert.doesNotMatch(result.stdout, /LAUNCH PASS/);
		assert.match(result.stderr, /did not start/);
		assert.ok(result.stderr.includes(`Port ${port}`), result.stderr);
		const cleanup = spawnSync(
			process.execPath,
			[cli, "cleanup", "--session", folder],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(cleanup.status, 0);
		assert.match(cleanup.stdout, /CLEANUP PASS: no owned preview started/);
		assert.equal(
			(await fetchRaw(port, "/")).body.toString(),
			"foreign wildcard",
		);
	} finally {
		await new Promise((done) => server.close(done));
	}
	await portAvailable(port);
});
test("preview no-store covers every response class, HEAD/query and containment; only owned resources close", async () => {
	for (const name of ["style.css", "font.woff2", "image.png", "data.json"])
		await writeFile(resolve(concept, name), "fixture");
	const outside = resolve(scratch, "outside.txt");
	await writeFile(outside, "SECRET OUTSIDE");
	await symlink(outside, resolve(concept, "escape.txt"));
	const server = await preview({ concept, port: 0 });
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
			preview({ concept, port: server.port }),
			/held by a process|busy/,
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

const cliPath = fileURLToPath(new URL("./cli.mjs", import.meta.url));
function runCli(args, cli = cliPath) {
	return spawnSync(process.execPath, [cli, ...args], {
		encoding: "utf8",
		windowsHide: true,
	});
}

test("V1: no recipe file is SKIP, while a checked recipe still passes", async () => {
	const empty = resolve(scratch, "no-recipes");
	await mkdir(empty);
	const skipped = runCli(["drift-tree", "--root", empty]);
	assert.equal(skipped.status, 0, skipped.stderr);
	assert.match(skipped.stdout, /no recipe file was found/i);
	assert.match(skipped.stdout, /verification-recipes.json/);
	assert.doesNotMatch(skipped.stdout, /PASS/);
	const checked = runCli(["drift-tree", "--root", concept]);
	assert.equal(checked.status, 0, checked.stderr);
	assert.match(
		checked.stdout,
		/DRIFT PASS: 1 recipe files found and checked\./,
	);
});

test("V2: dependency-free discovery and browser commands name the package and install once", async () => {
	const folder = resolve(scratch, "cold/.agents/skills/verify-fitway");
	await mkdir(folder, { recursive: true });
	for (const name of await readdir(
		fileURLToPath(new URL(".", import.meta.url)),
	)) {
		if (!name.endsWith(".mjs") || name.endsWith(".test.mjs")) continue;
		await writeFile(
			resolve(folder, name),
			await readFile(new URL(name, import.meta.url)),
		);
	}
	const cli = resolve(folder, "cli.mjs");
	for (const command of [
		"map",
		"list",
		"drift",
		"repair-recipes",
		"drift-tree",
	]) {
		const result = runCli(
			command === "drift-tree"
				? [command, "--root", concept]
				: [
						command,
						"--concept",
						concept,
						"--out",
						resolve(scratch, `cold-${command}`),
					],
			cli,
		);
		assert.equal(result.status, 1, result.stdout);
		assert.match(result.stderr, /Missing dependency: typescript/);
		assert.match(
			result.stderr,
			/FIX: pnpm --dir '.*cold.*' install --frozen-lockfile/,
		);
		assert.doesNotMatch(
			result.stderr,
			/Cannot find module|Require stack|\n\s+at /,
		);
		assert.equal((result.stderr.match(/FAIL:/g) || []).length, 1);
	}
	const caller = resolve(scratch, "cold-playwright.mjs");
	await writeFile(
		caller,
		`import {playwright} from ${JSON.stringify(pathToFileURL(cli).href)};
try {playwright()} catch(error) {console.error(error.message + "\\nFIX: " + error.fix); process.exitCode=1}`,
	);
	const browser = spawnSync(process.execPath, [caller], {
		encoding: "utf8",
		windowsHide: true,
	});
	assert.equal(browser.status, 1);
	assert.match(browser.stderr, /Missing dependency: @playwright\/test/);
	assert.match(browser.stderr, /pnpm --dir .* install --frozen-lockfile/);
	assert.doesNotMatch(
		browser.stderr,
		/Cannot find module|Require stack|\n\s+at /,
	);
});

test("V3: doctor and drive setup failures print one fault block", () => {
	for (const command of ["doctor", "drive", "compare"]) {
		const result = runCli([
			command,
			"--concept",
			concept,
			"--baseline",
			concept,
			"--out",
			resolve(scratch, `one-block-${command}`),
		]);
		assert.equal(result.status, 1);
		assert.equal(
			(result.stderr.match(/FAIL:/g) || []).length,
			1,
			result.stderr,
		);
		assert.equal(
			(result.stderr.match(/Probe kit missing/g) || []).length,
			1,
			result.stderr,
		);
		assert.match(result.stderr, /DOCTOR FAIL:/);
		assert.match(result.stderr, /FIX BLOCKED: restore the missing probe kit/);
	}
});

// Exercise the runner's actual evidence/summary path through a deterministic UI
// adapter. The fast ladder does not need a browser installation for these contracts.
async function runnerFixture(name, features, options = {}) {
	const root = resolve(scratch, name);
	const build = resolve(root, "concept");
	const tools = resolve(root, "tools");
	const out = resolve(root, "out");
	await mkdir(resolve(build, "tools/probes"), { recursive: true });
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.2.0"; export const CONTEXT_SPEC={forcedColors:{type:"string"}};',
	);
	await writeFile(
		resolve(build, "tools/probes/lib.mjs"),
		"export const introSettled=async()=>{}; export const overflowProbe=()=>({hScroll:false});",
	);
	await writeFile(
		resolve(build, "tools/probes/geom.mjs"),
		"export const geometryProbe=()=>({});",
	);
	await writeFile(
		resolve(build, "tools/probes/a11y.mjs"),
		"export const accessibilityProbe=()=>({});",
	);
	await writeFile(
		resolve(tools, "scripts/web/lib.mjs"),
		`
export const launchChromium=async()=>({close:async()=>{}});
export async function newContext(browser, options) {
 let focus="body", open=false;
 const page={setDefaultTimeout(){},
  evaluate:async(fn)=>fn.toString().includes("coarse")
   ? {language:"en",direction:"ltr",coarse:false,touchPoints:0}
   : fn.toString().includes("Canvas") ? {active:true,background:"rgb(0, 0, 0)",canvas:"rgb(0, 0, 0)"}
   : fn.toString().includes("document.activeElement") ? {selector:focus,text:focus} : {},
  locator:(selector)=>({first(){return this},count:async()=>1,
   evaluate:async()=>focus===selector,ariaSnapshot:async()=>"body",
   waitFor:async()=>{if(selector==="#dialog"&&!open)throw new Error("dialog stayed closed")}}),
  keyboard:{press:async(key)=>{if(key==="Tab")focus=focus==="body"?"#opener":"body";
   if(key==="Enter"&&focus==="#opener"){open=true;focus="#field"}}}};
 return {page,context:{close:async()=>{}},errors:[],emulation:{forcedColors:options.forcedColors || "none"}};
}
export const withParams=(url)=>url;
export const preparePage=async()=>({ready:true});
export const screenshot=async()=>Buffer.from("fixture");
export const twoFrames=async()=>{};
export const injectProbe=async()=>{};
export const renderSheet=async()=>{};
`,
	);
	const caller = resolve(root, "caller.mjs");
	await writeFile(
		caller,
		`import {drive} from ${JSON.stringify(new URL("./runner.mjs", import.meta.url).href)};
import * as core from ${JSON.stringify(new URL("./core.mjs", import.meta.url).href)};
try {await drive(${JSON.stringify({
			concept: build,
			tools,
			out,
			loaded: {},
			map: {
				sizes: { desktop: { width: 1440, height: 900 } },
				pages: [
					{
						page: "fixture.html",
						ready: "true",
						switches: [],
						features,
						states: [
							{
								when: {},
								shows: "Fixture state",
								proof: { selector: "main", visible: true },
							},
						],
					},
				],
			},
			page: "fixture.html",
			feature: "all",
			languages: "en",
			sizes: "desktop",
			inputs: "keyboard",
			motions: "reduce",
			transports: "file",
			...options,
		})})}
catch(error){if(!(core.ReportedFailure && error instanceof core.ReportedFailure))console.error("FAIL: "+error.message);process.exitCode=1}`,
	);
	return {
		out,
		result: spawnSync(process.execPath, [caller], {
			encoding: "utf8",
			windowsHide: true,
		}),
	};
}

test("R20 V1: colours multiply states and reach the context, manifest and FRAME; default stays normal", async () => {
	const features = [{ id: "page", proof: { selector: "main", visible: true } }];
	const { result, out } = await runnerFixture("colours", features, {
		colors: "normal,forced",
		states: ",",
	});
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const manifest = JSON.parse(
		await readFile(resolve(out, "manifest.json"), "utf8"),
	);
	assert.deepEqual(
		manifest.items.map((i) => i.colors),
		["normal", "forced", "normal", "forced"],
	);
	assert.equal(manifest.items[1].emulation.forcedColors, "active");
	assert.match(result.stdout, /FRAME PASS: .* file normal/);
	assert.match(result.stdout, /FRAME PASS: .* file forced/);
	assert.notEqual(manifest.items[0].files[0], manifest.items[1].files[0]);
	const normal = await runnerFixture("colours-default", features);
	assert.equal(normal.result.status, 0, normal.result.stderr);
	const one = JSON.parse(
		await readFile(resolve(normal.out, "manifest.json"), "utf8"),
	);
	assert.equal(one.items[0].colors, "normal");
	const invalid = await runnerFixture("colours-invalid", features, {
		colors: "sepia",
	});
	assert.equal(invalid.result.status, 1);
	assert.match(invalid.result.stderr, /Unsupported.*sepia.*normal.*forced/);
});

test("R20 V2: drive, compare and measure refuse forced requests with ui-forensics 1.1.0 before rendering", async () => {
	const tools = resolve(scratch, "old-forensics");
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.2.0"; export const CONTEXT_SPEC={forcedColors:{type:"string"}};',
	);
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION = "1.1.0";',
	);
	for (const command of ["drive", "compare", "measure"]) {
		const axes =
			command === "measure"
				? [
						"--tool",
						"focus",
						"--out",
						resolve(scratch, "refusal"),
						"--",
						"--forced-colors",
						"active",
					]
				: ["--colors", "forced"];
		const result = spawnSync(
			process.execPath,
			[
				fileURLToPath(new URL("./cli.mjs", import.meta.url)),
				command,
				"--forensics",
				tools,
				"--concept",
				concept,
				...axes,
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1, result.stdout);
		assert.match(result.stderr, /forced.*ui-forensics.*1\.2\.0.*1\.1\.0/i);
		assert.doesNotMatch(result.stdout, /FRAME|DRIVE PASS|COMPARE|MEASURE PASS/);
	}
});

test("R20 V2: measurement matrices and inline options also fail closed, with the tool's whitespace handling", async () => {
	const tools = resolve(scratch, "matrix-old-forensics");
	await mkdir(resolve(tools, "scripts/web"), { recursive: true });
	await writeFile(
		resolve(tools, "scripts/web/_common.mjs"),
		'export const TOOL_VERSION="1.1.0";',
	);
	const frames = resolve(scratch, "forced-frames.json");
	await writeFile(
		frames,
		JSON.stringify({ matrix: { forcedColors: ["none", "active"] } }),
	);
	for (const extra of [
		["--forced-colors=active"],
		["--each", "forced-colors =none, active"],
		["--frames", frames],
		["--spec", frames],
	]) {
		assert.equal(measurementColors({ extra }).forced, true);
		const result = spawnSync(
			process.execPath,
			[
				fileURLToPath(new URL("./cli.mjs", import.meta.url)),
				"measure",
				"--tool",
				"capture",
				"--forensics",
				tools,
				"--out",
				resolve(scratch, "matrix-refusal"),
				"--",
				...extra,
			],
			{ encoding: "utf8", windowsHide: true },
		);
		assert.equal(result.status, 1);
		assert.match(
			result.stderr,
			/Forced colours require ui-forensics >=1\.2\.0.*found 1\.1\.0/,
		);
	}
	assert.deepEqual(measurementColors({ colors: "forced", extra: [] }).args, [
		"--forced-colors",
		"active",
	]);
	assert.throws(
		() => measurementColors({ extra: ["--forced-colors", "sepia"] }),
		/none or active/,
	);
});

test("V4: drive separates and names keyboard reach findings, and still fails", async () => {
	const { result, out } = await runnerFixture("keyboard-summary", [
		{
			id: "open",
			actions: ["activate:#opener"],
			proof: { selector: "#dialog", visible: true },
		},
		{
			id: "absent",
			actions: [],
			proof: { ready: true },
			unreachable: [
				{ when: {}, reason: "Absent by design", proof: { ready: true } },
			],
		},
		{
			id: "pointer-only",
			actions: ["activate:#pointer-only"],
			proof: { ready: true },
		},
	]);
	assert.equal(result.status, 1, result.stdout);
	assert.match(
		result.stdout,
		/DRIVE FAIL: 3 items; 1 not reachable; 1 keyboard unreachable \(fixture.html\/pointer-only default en desktop keyboard reduce file\); 0 problems/,
	);
	assert.equal(result.stderr, "", result.stderr);
	const summary = JSON.parse(
		await readFile(resolve(out, "summary.json"), "utf8"),
	);
	assert.deepEqual(
		summary.map((item) => item.result),
		["pass", "not-reachable", "keyboard-unreachable"],
	);
});

test("V5: successful feature proof survives in both summaries beside state proof", async () => {
	const proof = { selector: "#dialog", visible: true };
	const { result, out } = await runnerFixture("feature-proof", [
		{ id: "open", actions: ["activate:#opener"], proof },
	]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const [summary] = JSON.parse(
		await readFile(resolve(out, "summary.json"), "utf8"),
	);
	assert.equal(summary.result, "pass");
	assert.deepEqual(summary.proof, ["Fixture state"]);
	assert.deepEqual(summary.featureProof, proof);
	const itemFile = (await readdir(out)).find((file) =>
		file.endsWith("-summary.json"),
	);
	assert.deepEqual(
		JSON.parse(await readFile(resolve(out, itemFile), "utf8")).featureProof,
		proof,
	);
	const { result: failed, out: failedOut } = await runnerFixture(
		"unproved-feature",
		[{ id: "closed", actions: ["focus:#opener"], proof }],
	);
	assert.equal(failed.status, 1);
	const [unproved] = JSON.parse(
		await readFile(resolve(failedOut, "summary.json"), "utf8"),
	);
	assert.equal(unproved.featureProof, undefined);
});

test("V6: Tab evidence names the move and focus destination; Enter names activation", async () => {
	let focus = "body";
	const page = {
		evaluate: async () => ({ selector: focus }),
		locator: () => ({
			first() {
				return this;
			},
			count: async () => 1,
			evaluate: async () => focus === "#opener",
		}),
		keyboard: {
			press: async (key) => {
				focus = key === "Tab" ? "#opener" : "#field";
			},
		},
	};
	const entry = {};
	await performAction(
		{},
		page,
		"activate:#opener",
		"keyboard",
		scratch,
		"labels",
		entry,
	);
	assert.deepEqual(
		entry.focusSteps.map((step) => step.action),
		["Tab move to #opener", "activate:#opener"],
	);
	assert.deepEqual(
		entry.focusSteps.map((step) => step.key),
		["Tab", "Enter"],
	);
});

async function isolatedPort() {
	const server = createServer();
	await new Promise((done) => server.listen(0, "127.0.0.1", done));
	const port = server.address().port;
	await new Promise((done) => server.close(done));
	assert.ok(port >= 49152, `Kernel allocated unsafe test port ${port}`);
	return port;
}

async function launched(name, idle = 1500) {
	const folder = resolve(scratch, name);
	const result = runCli([
		"launch",
		"--concept",
		concept,
		"--isolated-port",
		String(await isolatedPort()),
		"--idle-timeout-ms",
		String(idle),
		"--out",
		folder,
	]);
	assert.equal(result.status, 0, result.stderr + result.stdout);
	const session = JSON.parse(
		await readFile(resolve(folder, "session.json"), "utf8"),
	);
	return { folder, session };
}

async function waitForExit(session) {
	const deadline = Date.now() + 5000;
	while (true) {
		try {
			process.kill(session.pid, 0);
		} catch (error) {
			if (error.code === "ESRCH") break;
			throw error;
		}
		assert.ok(
			Date.now() < deadline,
			`Preview pid ${session.pid} did not exit after idle timeout`,
		);
		await new Promise((done) => setTimeout(done, 50));
	}
	await portAvailable(session.port);
}

test("W1: port options keep other previews excluded, and help names isolation and idle bounds", () => {
	for (const command of ["launch", "doctor", "drive", "compare"]) {
		for (const port of [
			0,
			3174,
			3175,
			...Array.from({ length: 8 }, (_, i) => 3178 + i),
			49152,
		]) {
			const result = runCli([
				command,
				"--concept",
				concept,
				"--baseline",
				concept,
				"--port",
				String(port),
			]);
			assert.equal(result.status, 1);
			assert.match(result.stderr, /choose 3176 or 3177/);
		}
	}
	for (const port of [0, 3174, 3176, 3177, 3185, 49151, 65536]) {
		const result = runCli([
			"launch",
			"--concept",
			concept,
			"--isolated-port",
			String(port),
		]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /49152-65535/);
	}
	const both = runCli([
		"launch",
		"--concept",
		concept,
		"--port",
		"3180",
		"--isolated-port",
		"49152",
	]);
	assert.match(both.stderr, /choose 3176 or 3177/);
	for (const idle of ["0", "-1", "1800001", "NaN"]) {
		const result = runCli([
			"launch",
			"--concept",
			concept,
			"--idle-timeout-ms",
			idle,
		]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /at most 30 minutes/);
	}
	const help = runCli(["help"]);
	assert.match(help.stdout, /--isolated-port.*49152-65535/);
	assert.match(help.stdout, /30 minutes without a request/);
});

test("R17 V1: relaunch checks availability, prefers the session port and blocks when both are held", async () => {
	const folder = resolve(scratch, "relaunch-session");
	await mkdir(folder);
	for (const sessionPort of [3176, 3177]) {
		await writeFile(
			resolve(folder, "session.json"),
			JSON.stringify({ port: sessionPort }),
		);
		for (const held of [[], [3176], [3177], [3176, 3177]]) {
			const checked = [];
			const available = async (port) => {
				checked.push(port);
				if (held.includes(port)) throw new Error(`Port ${port} held`);
			};
			const fix = await doctorFix(
				{ concept, session: folder },
				new Error(`Session preview on port ${sessionPort} has stopped`),
				available,
			);
			const expected = [sessionPort, sessionPort === 3176 ? 3177 : 3176].find(
				(port) => !held.includes(port),
			);
			if (expected) {
				assert.match(fix, new RegExp(` launch .*--port ${expected} `));
				assert.equal(checked.at(-1), expected);
			} else {
				assert.match(fix, /^BLOCKED:.*3176.*3177.*held/);
				assert.doesNotMatch(fix, /--port|\bstop\b/i);
			}
			assert.equal(checked[0], sessionPort);
		}
	}
	const checked = [];
	const fix = await doctorFix(
		{ concept, port: 3177 },
		new Error("Port 3177 held"),
		async (port) => {
			checked.push(port);
			if (port === 3177) throw new Error("held");
		},
	);
	assert.deepEqual(checked, [3177, 3176]);
	assert.match(fix, /--port 3176 /);
});

function runCliAsync(args) {
	return new Promise((done, reject) => {
		const child = spawn(process.execPath, [cliPath, ...args], {
			windowsHide: true,
			stdio: ["ignore", "pipe", "pipe"],
		});
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (bytes) => {
			stdout += bytes;
		});
		child.stderr.on("data", (bytes) => {
			stderr += bytes;
		});
		child.once("error", reject);
		child.once("close", (status) => done({ status, stdout, stderr }));
	});
}

test("R17 V2: foreign status, body and silence name the session port without stopping its owner", async () => {
	const { folder, session } = await launched("foreign-session", 10000);
	assert.equal(runCli(["cleanup", "--session", folder]).status, 0);
	let mode;
	let stops = 0;
	const server = createServer((req, res) => {
		if (req.url === "/__verify/stop") stops++;
		if (req.url !== "/__verify/identity") return res.end("foreign alive");
		if (mode === "silent") return;
		if (mode === "body-timeout") {
			res.writeHead(200);
			res.flushHeaders();
			return;
		}
		if (mode === "disconnect") return req.socket.destroy();
		res.writeHead(
			mode === "status"
				? 503
				: mode === "empty"
					? 204
					: mode === "redirect"
						? 302
						: 200,
			mode === "redirect" ? { Location: "/" } : {},
		);
		res.end(
			mode === "json" ? "{}" : mode === "null" ? "null" : "foreign 127.0.0.1",
		);
	});
	await new Promise((done) => server.listen(session.port, "127.0.0.1", done));
	try {
		for (mode of [
			"text",
			"json",
			"null",
			"status",
			"empty",
			"redirect",
			"silent",
			"body-timeout",
			"disconnect",
		]) {
			for (const command of ["cleanup", "doctor", "drive"]) {
				const result = await runCliAsync([
					command,
					"--concept",
					concept,
					"--session",
					folder,
					"--out",
					resolve(scratch, `foreign-${mode}-${command}`),
				]);
				assert.equal(result.status, 1, `${mode}/${command}: ${result.stdout}`);
				assert.match(
					result.stderr,
					new RegExp(`Port ${session.port} is not owned by this session`),
					`${mode}/${command}: ${result.stderr}`,
				);
				assert.doesNotMatch(
					result.stderr,
					/Unexpected token|JSON|SyntaxError|Cannot read properties/,
				);
				assert.equal(
					(await fetchRaw(session.port, "/")).body.toString(),
					"foreign alive",
				);
			}
		}
		assert.equal(stops, 0);
	} finally {
		server.closeAllConnections();
		await new Promise((done) => server.close(done));
	}
	await portAvailable(session.port);
});

test("R19 V1: a verified preview sharing its port names every foreign pid and refuses all session commands", {
	skip: process.platform !== "win32",
}, async (t) => {
	const { folder, session } = await launched("shared-session", 60000);
	const record = await readFile(resolve(folder, "session.json"), "utf8");
	const server = createServer((_, res) => res.end("foreign IPv4"));
	const foreign = spawn(
		process.execPath,
		[
			"-e",
			`
		const server = require("node:http").createServer((_, res) => res.end("foreign IPv6"));
		server.listen(${session.port}, "::1", () => process.send("ready"));
	`,
		],
		{ windowsHide: true, stdio: ["ignore", "ignore", "ignore", "ipc"] },
	);
	const exited = new Promise((done) => foreign.once("exit", done));
	try {
		await new Promise((done, reject) => {
			foreign.once("message", done);
			foreign.once("error", reject);
			foreign.once("exit", (code) =>
				reject(new Error(`Foreign fixture exited ${code} before ready`)),
			);
		});
		await new Promise((done, reject) => {
			server.once("error", reject);
			server.listen(session.port, "127.0.0.2", done);
		});
		for (const command of ["doctor", "cleanup", "drive"]) {
			const result = await runCliAsync([
				command,
				"--concept",
				concept,
				"--session",
				folder,
				"--out",
				resolve(scratch, `shared-${command}`),
			]);
			assert.equal(result.status, 1, result.stdout);
			assert.match(
				result.stderr,
				new RegExp(`Port ${session.port} .*foreign pids?`),
			);
			for (const pid of [process.pid, foreign.pid])
				assert.match(result.stderr, new RegExp(`\\b${pid}\\b`));
			assert.match(result.stderr, /refuse session/);
			assert.doesNotMatch(result.stderr, /not owned|not served|\bstop\b/i);
			assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
			for (const [host, body] of [
				["[::1]", "foreign IPv6"],
				["127.0.0.2", "foreign IPv4"],
			])
				assert.equal(
					await (await fetch(`http://${host}:${session.port}/`)).text(),
					body,
				);
			assert.equal(
				await readFile(resolve(folder, "session.json"), "utf8"),
				record,
			);
			t.diagnostic(
				`${command}: ${result.stderr.split("\n")[0]}; preview and both foreign listeners still answer`,
			);
		}
	} finally {
		server.closeAllConnections();
		if (server.listening) await new Promise((done) => server.close(done));
		if (foreign.exitCode === null) foreign.kill();
		await exited;
		const cleaned = runCli(["cleanup", "--session", folder]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
		t.diagnostic(cleaned.stdout.trim());
	}
	await portAvailable(session.port);
});

test("W2: detached idle preview exits, frees its port, cleans idempotently and sessions require relaunch", async () => {
	const { folder, session } = await launched("idle-expiry");
	try {
		await waitForExit(session);
		for (const command of ["doctor", "drive"]) {
			const result = runCli([
				command,
				"--concept",
				concept,
				"--session",
				folder,
				"--out",
				resolve(scratch, `expired-${command}`),
			]);
			assert.equal(result.status, 1);
			assert.match(result.stderr, /Session preview.*stopped or is unreachable/);
			assert.match(
				result.stderr,
				/FIX(?:: .* launch .*--concept| BLOCKED:.*3176.*3177.*held)/,
			);
		}
		const cleaned = runCli(["cleanup", "--session", folder]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
		assert.match(cleaned.stdout, /CLEANUP PASS: .*already stopped/);
	} finally {
		runCli(["cleanup", "--session", folder]);
	}
});

test("W2: requests renew the idle bound, then the detached preview leaves no process", async () => {
	const { folder, session } = await launched("idle-renewal");
	try {
		const until = Date.now() + 3500;
		while (Date.now() < until) {
			assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
			await new Promise((done) => setTimeout(done, 400));
		}
		assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
		process.kill(session.pid, 0);
		await waitForExit(session);
	} finally {
		runCli(["cleanup", "--session", folder]);
	}
});

test("W3: cleanup accepts a session file and verifies stopped records", async () => {
	const { folder, session } = await launched("cleanup-file", 10000);
	try {
		const path = resolve(folder, "session.json");
		await writeFile(path, JSON.stringify({ ...session, stopped: true }));
		const cleaned = runCli(["cleanup", "--session", path]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
		assert.match(cleaned.stdout, /CLEANUP PASS: .* stopped;/);
		await portAvailable(session.port);
		const again = runCli(["cleanup", "--session", folder]);
		assert.equal(again.status, 0, again.stderr);
		assert.match(again.stdout, /already stopped/);
	} finally {
		await writeFile(resolve(folder, "session.json"), JSON.stringify(session));
		runCli(["cleanup", "--session", folder]);
	}
});

test("W3: cleanup rejects nonexistent paths by name", () => {
	const missing = resolve(scratch, "nonexistent-session");
	const result = runCli(["cleanup", "--session", missing]);
	assert.equal(result.status, 1);
	assert.ok(result.stderr.includes(missing));
	assert.doesNotMatch(result.stdout, /PASS/);
});

test("W3: cleanup never stops a preview with a different session token", async () => {
	const { folder, session } = await launched("cleanup-identity", 10000);
	try {
		const impostor = resolve(scratch, "impostor");
		await mkdir(impostor);
		await writeFile(
			resolve(impostor, "session.json"),
			JSON.stringify({ ...session, token: "wrong" }),
		);
		const result = runCli(["cleanup", "--session", impostor]);
		assert.equal(result.status, 1);
		assert.doesNotMatch(result.stdout, /PASS/);
		assert.match(result.stderr, /not owned by this session/);
		assert.equal((await fetchRaw(session.port, "/index.html")).status, 200);
	} finally {
		const cleaned = runCli(["cleanup", "--session", folder]);
		assert.equal(cleaned.status, 0, cleaned.stderr);
	}
	await portAvailable(session.port);
});
