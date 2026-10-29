// Rewrite and run concept scripts inside isolated previews with requested browser axes.
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveCommandConcepts } from "./concept-source.mjs";
import {
	canonical,
	comparisonPorts,
	inside,
	jsonOutput,
	preview,
	reserveVerificationPorts,
} from "./core.mjs";
import { contextOptions } from "./drive-plan.mjs";

export function newPageContextOptions(axes, sizes) {
	const dimensions = sizes[axes.size];
	if (!dimensions)
		throw new Error(
			`Unknown size ${axes.size}; choose ${Object.keys(sizes).join(", ")}`,
		);
	return contextOptions({
		...dimensions,
		input: axes.input,
		motion: axes.motion,
		color: axes.colours,
		language: axes.language,
	});
}

function occurrences(text, from) {
	if (!from) return 0;
	let count = 0;
	for (
		let at = text.indexOf(from);
		at >= 0;
		at = text.indexOf(from, at + from.length)
	)
		count++;
	return count;
}

function rewriteFailure(file, side, sides, from, count, earlier) {
	const where = sides > 1 ? ` on the ${side}` : "";
	const after = earlier
		? ` in the text ${earlier} earlier rewrite${earlier === 1 ? "" : "s"} of it leave${earlier === 1 ? "s" : ""}`
		: "";
	return new Error(
		`Rewrite of ${file}${where}: ${JSON.stringify(from)} occurs ${count} times${after}; expected exactly once.`,
	);
}

// rewrite(page, file, from, to) for any page: each request that page makes for
// the file gets the text of the side whose origin the request goes to, after
// every rewrite of that file on that page, in call order. Files on disk stay.
export function createRewrite(sources, origins) {
	const sides = Object.keys(origins).filter(
		(side) => origins[side] && sources[side],
	);
	const pages = new WeakMap();
	const serve = (texts) => async (route) => {
		const request = new URL(route.request().url());
		const side = sides.find((name) => origins[name] === request.origin);
		const pathname = decodeURIComponent(request.pathname).replaceAll("\\", "/");
		const entry = side && texts.get(`${side} ${pathname}`);
		if (!entry) return route.continue();
		const response = await route.fetch();
		await route.fulfill({ response, body: entry.text });
	};
	return async (page, file, from, to) => {
		const texts = pages.get(page) ?? new Map();
		const staged = [];
		for (const side of sides) {
			const root = sources[side].concept;
			const target = resolve(root, file);
			if (!inside(canonical(root), canonical(target)))
				throw new Error(`Rewrite source escapes the concept: ${file}`);
			if (!existsSync(target)) continue;
			const key = `${side} /${relative(root, target).split(sep).join("/")}`;
			const current = texts.get(key) ?? {
				text: readFileSync(target, "utf8"),
				rewrites: 0,
			};
			const count = occurrences(current.text, from);
			if (count !== 1)
				throw rewriteFailure(
					file,
					side,
					sides.length,
					from,
					count,
					current.rewrites,
				);
			staged.push([
				key,
				{
					text: current.text.replace(from, () => to),
					rewrites: current.rewrites + 1,
				},
			]);
		}
		if (!staged.length)
			throw new Error(`Rewrite source ${file} is not in the concept.`);
		for (const [key, entry] of staged) texts.set(key, entry);
		if (pages.has(page)) return;
		pages.set(page, texts);
		await page.route("**/*", serve(texts));
	};
}

async function startRun(
	options,
	{ doctor, preview: serve = preview, reservePorts = reserveVerificationPorts },
) {
	const sources = resolveCommandConcepts(options, {
		baseline: Boolean(options.baseline || options["baseline-ref"]),
	});
	const ports = comparisonPorts(options, "run");
	const setup = await doctor({
		...options,
		concept: sources.build.concept,
		recipes: sources.build.recipes,
		port: ports[0],
		quiet: true,
	});
	const lease = await reservePorts(ports);
	let browser;
	let buildPreview;
	let baselinePreview;
	try {
		buildPreview = await serve({
			concept: sources.build.concept,
			port: ports[0],
			cache: options.cache || "no-store",
			portLease: lease,
		});
		if (sources.baseline)
			baselinePreview = await serve({
				concept: sources.baseline.concept,
				port: ports[1],
				cache: options.cache || "no-store",
				portLease: lease,
			});
		const ui = await import(
			pathToFileURL(resolve(setup.tools, "scripts/web/lib.mjs")).href
		);
		browser = await ui.launchChromium(setup.loaded);
		const origins = {
			build: buildPreview.origin,
			baseline: baselinePreview?.origin,
		};
		return {
			sources,
			setup,
			lease,
			browser,
			buildPreview,
			baselinePreview,
			ui,
			origins,
		};
	} catch (error) {
		await Promise.allSettled([
			browser?.close(),
			baselinePreview?.close(),
			buildPreview?.close(),
		]);
		await lease.release();
		throw error;
	}
}

function runApi(runtime) {
	const { browser, origins, setup, sources, ui } = runtime;
	const sizes = setup.map.sizes;
	const newPage = async (axes) => {
		const current = await ui.newContext(
			browser,
			newPageContextOptions(axes, sizes),
		);
		current.page.setDefaultTimeout(5000);
		return current;
	};
	const served = Object.keys(origins).filter((side) => origins[side]);
	const url = (side, page, query = {}) => {
		if (!origins[side])
			throw new Error(
				`url() has no side ${side}; this run serves ${served.join(" and ")}.`,
			);
		return ui.withParams(`${origins[side]}/${page}`, query);
	};
	return {
		playwright: setup.loaded.pw,
		browser,
		url,
		newPage,
		rewrite: createRewrite(sources, origins),
		concept: sources.build.concept,
		baseline: sources.baseline?.concept,
	};
}

function describeExport(value) {
	if (value === null) return "null";
	if (Array.isArray(value)) return "an array";
	if (typeof value === "object") return "an object";
	return `the ${typeof value} ${String(value).slice(0, 60)}`;
}

export async function runScript(options, services) {
	const runtime = await startRun(options, services);
	try {
		const scriptPath = resolve(options.script);
		const script = await import(pathToFileURL(scriptPath).href);
		if (!("default" in script))
			throw new Error(`Script has no default export: ${scriptPath}`);
		if (typeof script.default !== "function")
			throw new Error(
				`Script's default export is ${describeExport(script.default)}, not a function: ${scriptPath}`,
			);
		const result = await script.default({
			...runApi(runtime),
			out: options.out,
			args: options.extra,
		});
		await jsonOutput(options.out, "result.json", result ?? null);
		console.log(`RUN PASS: ${scriptPath}; evidence ${options.out}`);
		return result;
	} finally {
		await Promise.allSettled([
			runtime.browser.close(),
			runtime.baselinePreview?.close(),
			runtime.buildPreview.close(),
		]);
		await runtime.lease.release();
	}
}
