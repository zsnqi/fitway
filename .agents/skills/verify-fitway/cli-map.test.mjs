import assert from "node:assert/strict";
import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, test as nodeTest } from "node:test";
import {
	concept,
	createUnitConcept,
	recipes,
	removeUnitConcept,
	scratch,
} from "./cli-test-harness.mjs";
import { authored, html, js } from "./concept-fixture.mjs";
import { resolveQuery, stateCases } from "./drive-plan.mjs";
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
import { verificationTest } from "./skip-gate.mjs";

const test = verificationTest(nodeTest);
before(createUnitConcept);
after(removeUnitConcept);

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
