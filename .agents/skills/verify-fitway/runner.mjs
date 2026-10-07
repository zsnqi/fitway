import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
	jsonOutput,
	outputFile,
	ownedSession,
	preview,
	verificationPort,
} from "./core.mjs";
import { performAction, prove } from "./drive.mjs";
import { loadProbes } from "./probes.mjs";

const axis = (value, fallback, allowed) => {
	const items = (value || fallback).split(",");
	for (const item of items)
		if (!allowed.includes(item))
			throw new Error(`Unsupported axis ${item}; choose ${allowed}`);
	return items;
};

export function resolveQuery(page, query) {
	const result = { ...query };
	const applied = [];
	for (const key of Object.keys(result))
		if (!page.switches.some((s) => s.name === key))
			throw new Error(`${page.page}: unmapped query switch ${key}`);
	for (let pass = 0; pass <= page.switches.length; pass++) {
		let changed = false;
		for (const item of page.switches)
			for (const dep of item.dependencies || [])
				if (result[dep.switch] === dep.value)
					for (const need of dep.requires) {
						if (need.present && result[need.name] !== undefined) continue;
						if (!need.present && result[need.name] === need.value) continue;
						if (result[need.name] !== undefined)
							throw new Error(
								`${dep.source.file}:${dep.source.line}: ${dep.switch}=${dep.value} needs ${need.name}=${need.value}; conflicting value ${result[need.name]}`,
							);
						const value = need.present
							? page.defaults?.[need.name]
							: need.value;
						if (value === undefined)
							throw new Error(
								`${dep.source.file}:${dep.source.line}: ${dep.switch}=${dep.value} needs ${need.name}; supply --query with ${need.name}=<value> or a recipe default.`,
							);
						result[need.name] = value;
						applied.push(
							`${dep.switch}=${dep.value} needs ${need.name}=${value}`,
						);
						changed = true;
					}
		if (!changed) return { query: result, applied };
	}
	throw new Error(`${page.page}: cyclic switch dependencies`);
}

export function stateCases(page, options) {
	const extras = Object.fromEntries(new URLSearchParams(options.query || ""));
	let cases = [{ query: {} }];
	if (options.states === "all")
		cases = [
			{ query: {} },
			...page.switches
				.filter((s) => !["lang", "motion"].includes(s.name))
				.flatMap((s) =>
					[...new Set([...s.values, ...(s.samples || [])])].map((value) => ({
						query: { [s.name]: value },
					})),
				),
		];
	else if (options.states && options.states !== "default")
		cases = options.states.split(",").map((state) => ({
			query: Object.fromEntries(new URLSearchParams(state)),
		}));
	return cases.map((item) => {
		const resolved = resolveQuery(page, { ...item.query, ...extras });
		return {
			...resolved,
			name:
				new URLSearchParams(Object.entries(resolved.query).sort()).toString() ||
				"default",
		};
	});
}

const matches = (rule, query, language) =>
	(!rule.language || rule.language === language) &&
	Object.entries(rule.when || {}).every(([key, value]) => query[key] === value);
function requestedProofs(page, state, language) {
	const rules = page.states.filter((rule) =>
		matches(rule, state.query, language),
	);
	for (const key of Object.keys(state.query))
		if (
			!["lang", "motion"].includes(key) &&
			!rules.some((rule) => Object.hasOwn(rule.when || {}, key))
		)
			throw new Error(
				`No observable state proof for ${key}=${state.query[key]}; add it to verification-recipes.json before claiming a pass.`,
			);
	if (!rules.length)
		throw new Error(
			`No observable default state proof for ${page.page}; add it to verification-recipes.json.`,
		);
	return rules;
}

const safe = (value) => value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
export function itemSummary(entry) {
	return {
		feature: entry.feature,
		state: entry.state,
		query: entry.query,
		language: entry.language,
		size: entry.size,
		input: entry.input,
		motion: entry.motion,
		transport: entry.transport,
		result: entry.status,
		problems: entry.problems,
		proof: entry.stateProof,
		dependencies: entry.dependencies,
		files: entry.files,
	};
}

export async function drive(options) {
	const { concept, map, tools, loaded, out } = options;
	const selected = map.pages.find(
		(p) => p.page === (options.page || "index.html"),
	);
	if (!selected) throw new Error(`Unmapped page: ${options.page}`);
	const features =
		options.feature === "all"
			? selected.features
			: selected.features.filter((f) => f.id === (options.feature || "page"));
	if (!features.length)
		throw new Error(
			`Unmapped feature ${options.feature}; run list --page ${selected.page}`,
		);
	const languages = axis(options.languages, "ar,en", ["ar", "en"]);
	const sizes = axis(
		options.sizes,
		"desktop,tablet,phone",
		Object.keys(map.sizes),
	);
	const inputs = axis(options.inputs, "mouse,touch", ["mouse", "touch"]);
	const motions = axis(options.motions, "reduce,full", ["reduce", "full"]);
	const transports = axis(options.transports, "http,file", ["http", "file"]);
	const cases = stateCases(selected, options);
	const port = verificationPort(options.port || 3176);
	process.env.PROBE_ECLIPSE = concept;
	process.env.PROBE_OUT = out;
	process.env.PROBE_PORT = String(port);
	const ui = await import(pathToFileURL(resolve(tools, "scripts/web/lib.mjs")));
	const probes = await loadProbes(concept);
	let server;
	let browser;
	let origin;
	let cancelled = false;
	const manifest = {
		schema: 2,
		concept,
		feature: `${selected.page}/${options.feature || "page"}`,
		probeSources: probes.sources,
		items: [],
	};
	const abort = () => {
		cancelled = true;
		browser?.close().catch(() => {});
		server?.close().catch(() => {});
	};
	process.once("SIGINT", abort);
	process.once("SIGTERM", abort);
	try {
		if (transports.includes("http")) {
			if (options.session) {
				const session = await ownedSession(options.session);
				if (session.concept !== concept)
					throw new Error("Session serves another concept");
				origin = `http://127.0.0.1:${session.port}`;
			} else {
				server = await preview({
					concept,
					port,
					cache: options.cache || "no-store",
				});
				origin = server.origin;
			}
		}
		browser = await ui.launchChromium(loaded);
		for (const feature of features)
			for (const state of cases)
				for (const language of languages)
					for (const size of sizes)
						for (const input of inputs)
							for (const motion of motions)
								for (const transport of transports) {
									if (cancelled)
										throw new Error(
											"Drive interrupted; owned resources cleaned up.",
										);
									const dimensions = map.sizes[size];
									const cssWidth = dimensions.width / (dimensions.zoom || 1);
									const effective = resolveQuery(selected, {
										...feature.query,
										...state.query,
									});
									const entry = {
										feature: `${selected.page}/${feature.id}`,
										state:
											new URLSearchParams(
												Object.entries(effective.query).sort(),
											).toString() || "default",
										language,
										size,
										input,
										motion,
										transport,
										query: {
											...effective.query,
											lang: language,
											...(motion === "reduce" ? { motion: "off" } : {}),
										},
										dependencies: [...state.applied, ...effective.applied],
										files: [],
										status: "running",
										problems: [],
										actions: [],
									};
									const stem = `${String(manifest.items.length + 1).padStart(3, "0")}-${safe(feature.id)}-${safe(entry.state)}-${language}-${size}-${input}-${motion}-${transport}`;
									manifest.items.push(entry);
									const current = await ui.newContext(browser, {
										viewport: {
											width: dimensions.width,
											height: dimensions.height,
										},
										zoom: dimensions.zoom || 1,
										touch: input === "touch",
										mobile: input === "touch" && cssWidth <= 720,
										reducedMotion:
											motion === "reduce" ? "reduce" : "no-preference",
										colorScheme: "dark",
										locale: language === "ar" ? "ar-SA" : "en-US",
										timezoneId: "Asia/Riyadh",
									});
									current.page.setDefaultTimeout(5000);
									const save = async (suffix) => {
										const name = `${stem}-${suffix}.png`;
										await writeFile(
											await outputFile(out, name),
											await ui.screenshot(current.page, {
												method: "playwright",
												fullPage: false,
												animations: "allow",
											}),
										);
										entry.files.push(name);
									};
									try {
										const url = ui.withParams(
											transport === "file"
												? pathToFileURL(resolve(concept, selected.page)).href
												: `${origin}/${selected.page}`,
											entry.query,
										);
										entry.url = url;
										entry.readiness = await ui.preparePage(current.page, url, {
											readyJs: selected.ready,
											timeout: 15000,
										});
										if (selected.page === "index.html")
											await probes.introSettled(current.page);
										entry.emulation = {
											...current.emulation,
											...(await current.page.evaluate(() => ({
												coarse: matchMedia("(pointer:coarse)").matches,
												touchPoints: navigator.maxTouchPoints,
												direction: getComputedStyle(document.documentElement)
													.direction,
												language: document.documentElement.lang,
											}))),
										};
										if (
											entry.emulation.language !== language ||
											entry.emulation.direction !==
												(language === "ar" ? "rtl" : "ltr") ||
											entry.emulation.coarse !== (input === "touch")
										)
											throw new Error(
												"Language/direction/pointer emulation mismatch",
											);
										const rules = requestedProofs(
											selected,
											{ query: effective.query },
											language,
										);
										entry.stateProof = [];
										for (const rule of rules) {
											await prove(current.page, rule.proof, language);
											entry.stateProof.push(rule.shows);
										}
										await save("before");
										for (const rule of rules)
											await prove(current.page, rule.proof, language);
										const unavailable =
											(feature.widths === "phone" && cssWidth > 720) ||
											(feature.widths === "wide" && cssWidth <= 720) ||
											(feature.minWidth && cssWidth < feature.minWidth) ||
											(feature.maxWidth && cssWidth > feature.maxWidth);
										const absent = (feature.unreachable || []).find((rule) =>
											matches(rule, effective.query, language),
										);
										if (unavailable || absent) {
											if (absent)
												await prove(current.page, absent.proof, language);
											entry.status = "not-reachable";
											entry.problems.push(
												absent?.reason ||
													`Feature path unavailable at ${cssWidth} CSS pixels by its recipe`,
											);
											await save("after");
										} else {
											const actionRecipe =
												feature.fullMotion && motion === "reduce"
													? {
															actions: [feature.actions[0]],
															proof: {
																selector: feature.proof.selector,
																disabled: true,
															},
														}
													: feature;
											const prior = await current.page.evaluate(
												({ selector, css, count, text, moved }) => ({
													text: text
														? document.querySelector(selector)?.textContent
														: null,
													css: css
														? getComputedStyle(
																document.documentElement,
															).getPropertyValue(css)
														: null,
													count: count
														? document.querySelectorAll(count).length
														: null,
													position: moved
														? JSON.stringify(
																document
																	.querySelector(selector)
																	?.getBoundingClientRect()
																	.toJSON(),
															)
														: null,
												}),
												{
													selector: feature.proof.selector,
													css: feature.proof.cssPropertyChanged,
													count: feature.proof.countIncreased,
													text: feature.proof.textChanged,
													moved: feature.proof.moved,
												},
											);
											for (const action of actionRecipe.actions || []) {
												const resolvedAction = action.replace(
													/^activate:/,
													input === "touch" ? "tap:" : "click:",
												);
												await performAction(
													ui,
													current.page,
													resolvedAction,
													input,
													out,
													stem,
													entry,
												);
												entry.actions.push(resolvedAction);
											}
											if (feature.proof.countIncreased)
												await current.page.waitForFunction(
													({ selector, count }) =>
														document.querySelectorAll(selector).length > count,
													{
														selector: feature.proof.countIncreased,
														count: prior.count,
													},
												);
											else
												await prove(current.page, actionRecipe.proof, language);
											if (feature.settleIntro && motion === "full")
												await probes.introSettled(current.page);
											if (
												feature.proof.textChanged &&
												(await current.page
													.locator(feature.proof.selector)
													.textContent()) === prior.text
											)
												throw new Error(
													`Text unchanged: ${feature.proof.selector}`,
												);
											if (
												feature.proof.moved &&
												(await current.page
													.locator(feature.proof.selector)
													.evaluate((el) =>
														JSON.stringify(el.getBoundingClientRect().toJSON()),
													)) === prior.position
											)
												throw new Error(
													`Element unmoved: ${feature.proof.selector}`,
												);
											if (
												feature.proof.cssPropertyChanged &&
												(await current.page.evaluate(
													(p) =>
														getComputedStyle(
															document.documentElement,
														).getPropertyValue(p),
													feature.proof.cssPropertyChanged,
												)) === prior.css
											)
												throw new Error(
													`CSS property unchanged: ${feature.proof.cssPropertyChanged}`,
												);
											await ui.twoFrames(current.page);
											if (!feature.changesState)
												for (const rule of rules)
													await prove(current.page, rule.proof, language);
											await save("after");
											if (!feature.changesState)
												for (const rule of rules)
													await prove(current.page, rule.proof, language);
											// A flow may change a state (retry/navigation). Its end proof owns that result;
											// the requested state was proved before the first user action.
											entry.status = "pass";
										}
										for (const [name, measure] of [
											[
												"accessibility",
												() => current.page.locator("body").ariaSnapshot(),
											],
											[
												"overflow",
												() => current.page.evaluate(probes.overflowProbe),
											],
											[
												"geometry",
												async () => {
													await ui.injectProbe(current.page);
													return current.page.evaluate(() =>
														UIProbe.boxes("body"),
													);
												},
											],
											...(options.probes === "daily" &&
											selected.page === "index.html"
												? [
														[
															"dailyGeometry",
															() => current.page.evaluate(probes.geometryProbe),
														],
														[
															"dailyAccessibility",
															() =>
																probes.accessibilityProbe(current.page, {
																	lang: language,
																	control: true,
																}),
														],
													]
												: []),
										])
											try {
												entry[name] = await measure();
											} catch (error) {
												entry.problems.push(`${name}: ${error.message}`);
												entry.measurementProblems ||= [];
												entry.measurementProblems.push(
													`${name}: ${error.message}`,
												);
												if (entry.status !== "not-reachable")
													entry.status = "problem";
											}
										entry.errors = current.errors;
										if (current.errors.length || entry.overflow?.hScroll) {
											entry.problems.push(
												...current.errors,
												...(entry.overflow?.hScroll
													? ["Horizontal overflow"]
													: []),
											);
											if (entry.status !== "not-reachable")
												entry.status = "fail";
										}
									} catch (error) {
										entry.status = "fail";
										entry.problems.push(error.message);
										try {
											await save("error");
										} catch (captureError) {
											entry.problems.push(`capture: ${captureError.message}`);
										}
									} finally {
										await current.context.close();
										await jsonOutput(out, `${stem}.json`, entry);
										await jsonOutput(
											out,
											`${stem}-summary.json`,
											itemSummary(entry),
										);
										console.log(
											`FRAME ${entry.status.toUpperCase()}: ${entry.feature} ${entry.state} ${language} ${size} ${input} ${motion} ${transport}${entry.problems.length ? `; ${entry.problems.join("; ")}` : ""}`,
										);
										await jsonOutput(out, "manifest.json", manifest);
									}
								}
		for (const language of languages) {
			const cells = manifest.items
				.filter((item) => item.language === language && item.files.length)
				.map((item) => ({
					img: resolve(out, item.files.at(-1)),
					caption: `${item.feature} ${item.state} ${item.size} ${item.status}`,
				}));
			if (!cells.length) continue;
			const name = `sheet-${language}.png`;
			await ui.renderSheet(
				browser,
				{
					title: manifest.feature,
					lang: language,
					dir: language === "ar" ? "rtl" : "ltr",
					cols: 3,
					cellWidth: 480,
					cells,
				},
				await outputFile(out, name),
			);
			manifest.sheets ||= [];
			manifest.sheets.push(name);
		}
		await jsonOutput(out, "summary.json", manifest.items.map(itemSummary));
		const failed = manifest.items.filter(
			(item) =>
				!["pass", "not-reachable"].includes(item.status) ||
				item.measurementProblems?.length,
		);
		console.log(
			`DRIVE ${failed.length ? "FAIL" : "PASS"}: ${manifest.items.length} items; ${manifest.items.filter((i) => i.status === "not-reachable").length} not reachable; ${failed.length} problems; evidence ${out}/manifest.json`,
		);
		if (failed.length)
			throw new Error("Items have findings; inspect summary.json");
		return manifest;
	} finally {
		await Promise.allSettled([browser?.close(), server?.close()]);
		process.removeListener("SIGINT", abort);
		process.removeListener("SIGTERM", abort);
		await jsonOutput(out, "manifest.json", manifest);
	}
}
