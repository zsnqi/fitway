import { readFile } from "node:fs/promises";
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

const pageRoots = new WeakMap();

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

export async function rewritePage(page, root, file, from, to, origin) {
	const target = resolve(root, file);
	if (!inside(canonical(root), canonical(target)))
		throw new Error(`Rewrite source escapes the concept: ${file}`);
	const source = await readFile(target, "utf8");
	const count = occurrences(source, from);
	if (count !== 1)
		throw new Error(
			`Rewrite source ${file} occurs ${count} times; expected exactly once.`,
		);
	const rewritten = source.replace(from, to);
	const expected = `/${relative(root, target).split(sep).join("/")}`;
	const pageOrigin = origin || new URL(page.url()).origin;
	await page.route("**/*", async (route) => {
		const request = new URL(route.request().url());
		const pathname = decodeURIComponent(request.pathname).replaceAll("\\", "/");
		if (request.origin !== pageOrigin || pathname !== expected)
			return route.continue();
		const response = await route.fetch();
		await route.fulfill({ response, body: rewritten });
	});
}

async function startRun(options, { doctor }) {
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
	const lease = await reserveVerificationPorts(ports);
	let browser;
	let buildPreview;
	let baselinePreview;
	try {
		buildPreview = await preview({
			concept: sources.build.concept,
			port: ports[0],
			cache: options.cache || "no-store",
			portLease: lease,
		});
		if (sources.baseline)
			baselinePreview = await preview({
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
		pageRoots.set(current.page, { sources, origins });
		return current;
	};
	const url = (side, page, query = {}) => {
		if (!origins[side]) throw new Error(`No preview for side ${side}.`);
		return ui.withParams(`${origins[side]}/${page}`, query);
	};
	const rewrite = (page, file, from, to) => {
		const record = pageRoots.get(page);
		if (!record) throw new Error("rewrite needs a page created by newPage.");
		const current = new URL(page.url());
		const side =
			current.origin === record.origins.baseline ? "baseline" : "build";
		const source = record.sources[side];
		if (!source) throw new Error(`No preview for side ${side}.`);
		return rewritePage(
			page,
			source.concept,
			file,
			from,
			to,
			record.origins[side],
		);
	};
	return {
		playwright: setup.loaded.pw,
		browser,
		url,
		newPage,
		rewrite,
		concept: sources.build.concept,
		baseline: sources.baseline?.concept,
	};
}

export async function runScript(options, services) {
	const runtime = await startRun(options, services);
	try {
		const scriptPath = resolve(options.script);
		const script = await import(pathToFileURL(scriptPath).href);
		if (typeof script.default !== "function")
			throw new Error(`Script has no default export: ${scriptPath}`);
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
