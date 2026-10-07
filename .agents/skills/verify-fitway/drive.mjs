import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { jsonOutput, outputFile, ownedSession, preview } from "./core.mjs";

function list(value, fallback, allowed) {
	const values = (value || fallback).split(",");
	for (const item of values)
		if (!allowed.includes(item))
			throw new Error(`Unsupported axis value ${item}; choose ${allowed}`);
	return values;
}

export function stateCases(page, options) {
	const request = options.states || "default";
	const extras = Object.fromEntries(new URLSearchParams(options.query || ""));
	for (const key of Object.keys(extras))
		if (!page.switches.some((item) => item.name === key))
			throw new Error(`${page.page}: unmapped query switch ${key}`);
	let cases = [{ name: "default", query: {} }];
	if (request === "all")
		cases.push(
			...page.switches
				.filter((item) => !["lang", "motion"].includes(item.name))
				.flatMap((item) =>
					item.values.map((value) => ({
						name: `${item.name}=${value}`,
						query: { [item.name]: value },
					})),
				),
		);
	else if (request !== "default")
		cases = request.split(",").map((item) => {
			const query = Object.fromEntries(new URLSearchParams(item));
			for (const key of Object.keys(query))
				if (!page.switches.some((entry) => entry.name === key))
					throw new Error(`${page.page}: unmapped state switch ${key}`);
			return { name: item, query };
		});
	return cases.map((item) => ({
		name: Object.keys(extras).length
			? `${item.name}&${new URLSearchParams(extras)}`
			: item.name,
		query: { ...item.query, ...extras },
	}));
}

async function prove(page, proof, language) {
	if (proof.ready) return;
	if (proof.path)
		await page.waitForURL((url) => url.pathname.endsWith(`/${proof.path}`));
	if (proof.oneOf) {
		const results = await Promise.allSettled(
			proof.oneOf.map((alternative) => prove(page, alternative, language)),
		);
		if (!results.some((result) => result.status === "fulfilled"))
			throw new Error("No alternative end state was observed");
		return;
	}
	if (proof.download) return;
	if (proof.language) {
		await page.waitForFunction(
			(lang) => document.documentElement.lang === lang,
			proof.language,
		);
		return;
	}
	if (proof.query) {
		await page.waitForFunction(
			(expected) =>
				Object.entries(expected).every(
					([key, value]) =>
						new URL(location.href).searchParams.get(key) === value,
				),
			proof.query,
		);
		return;
	}
	if (proof.languageChanged) {
		await page.waitForFunction(
			(old) => document.documentElement.lang !== old,
			language,
		);
		return;
	}
	const target = page.locator(proof.selector).first();
	if (proof.disabled && !(await target.isDisabled()))
		throw new Error(`Expected disabled control: ${proof.selector}`);
	if (
		proof.focused &&
		!(await target.evaluate((element) => element === document.activeElement))
	)
		throw new Error(`Expected user focus: ${proof.selector}`);
	if (
		proof.checked !== undefined &&
		(await target.isChecked()) !== proof.checked
	)
		throw new Error(`Wrong checked state: ${proof.selector}`);
	if (proof.hidden) await target.waitFor({ state: "hidden", timeout: 5000 });
	if (proof.visible) await target.waitFor({ state: "visible", timeout: 5000 });
	if (proof.attribute) {
		await page.waitForFunction(
			({ selector, attribute, value, nonempty }) => {
				const actual = document
					.querySelector(selector)
					?.getAttribute(attribute);
				return nonempty ? Boolean(actual) : actual === value;
			},
			{
				selector: proof.selector,
				attribute: proof.attribute,
				value: proof.value,
				nonempty: proof.nonempty,
			},
			{ timeout: 10000 },
		);
		const value = await target.getAttribute(proof.attribute);
		if ((proof.nonempty && !value) || (proof.value && value !== proof.value))
			throw new Error(
				`End state failed: ${proof.selector} ${proof.attribute}=${value}`,
			);
	}
	if (proof.nonemptyText)
		await page.waitForFunction(
			(selector) =>
				Boolean(document.querySelector(selector)?.textContent.trim()),
			proof.selector,
			{ timeout: 10000 },
		);
	if (
		proof.inputValue !== undefined &&
		(await target.inputValue()) !== proof.inputValue
	)
		throw new Error(`Wrong input value: ${proof.selector}`);
	if (proof.rangeStep) {
		const correct = await target.evaluate(
			(element) =>
				Math.abs(
					Number(element.value) - (Number(element.min) + Number(element.step)),
				) < 0.000001,
		);
		if (!correct)
			throw new Error(
				`Range did not respond to its user keys: ${proof.selector}`,
			);
	}
}

async function performAction(ui, page, action, input, out, stem, entry) {
	if (action.startsWith("gesture:"))
		return ui.runAction(
			page,
			action.replace(/^gesture:/, input === "touch" ? "touchdrag:" : "drag:"),
		);
	if (action.startsWith("select:")) {
		const valueStart = action.lastIndexOf("=");
		await page
			.locator(action.slice(7, valueStart))
			.selectOption(action.slice(valueStart + 1));
	} else if (action.startsWith("download:")) {
		const selector = action.slice(9);
		await page.locator(selector).waitFor({ state: "visible", timeout: 10000 });
		const [download] = await Promise.all([
			page.waitForEvent("download"),
			ui.runAction(page, `${input === "touch" ? "tap" : "click"}:${selector}`),
		]);
		const file = `${stem}-download.csv`;
		await download.saveAs(await outputFile(out, file));
		entry.download = {
			file,
			suggestedFilename: download.suggestedFilename(),
			failure: await download.failure(),
		};
		if (entry.download.failure)
			throw new Error(`Download failed: ${entry.download.failure}`);
	} else await ui.runAction(page, action);
}

export async function drive(options) {
	const { concept, map, tools, loaded, out } = options;
	const selected = map.pages.find(
		(page) => page.page === (options.page || "index.html"),
	);
	if (!selected) throw new Error(`Unmapped page: ${options.page}`);
	const selectedFeature = selected.features.find(
		(item) => item.id === (options.feature || "page"),
	);
	if (!selectedFeature && options.feature !== "all")
		throw new Error(
			`Unmapped feature: ${options.feature}; available: ${selected.features.map((item) => item.id).join(",")}`,
		);
	const features =
		options.feature === "all" ? selected.features : [selectedFeature];
	const languages = list(options.languages, "ar,en", ["ar", "en"]);
	const sizes = list(
		options.sizes,
		"desktop,tablet,phone",
		Object.keys(map.sizes),
	);
	const inputs = list(options.inputs, "mouse,touch", ["mouse", "touch"]);
	const motions = list(options.motions, "reduce,full", ["reduce", "full"]);
	const transports = list(options.transports, "http,file", ["http", "file"]);
	const cases = stateCases(selected, options);
	process.env.PROBE_ECLIPSE = concept;
	process.env.PROBE_OUT = out;
	process.env.PROBE_PORT = options.port || "3176";
	const ui = await import(pathToFileURL(resolve(tools, "scripts/web/lib.mjs")));
	const probes = await import(
		pathToFileURL(resolve(concept, "tools/probes/lib.mjs"))
	);
	let server;
	let browser;
	let origin;
	let cancelled = false;
	const manifest = {
		schema: 1,
		concept,
		map: options.map || resolve(concept, "verification-map.json"),
		feature: `${selected.page}/${options.feature || "page"}`,
		items: [],
	};
	const abort = () => {
		cancelled = true;
		browser?.close().catch(() => {});
		server?.close().catch(() => {});
	};
	process.once("SIGINT", abort);
	process.once("SIGTERM", abort);
	let failure;
	try {
		if (transports.includes("http")) {
			if (options.session) {
				const session = await ownedSession(options.session);
				origin = `http://127.0.0.1:${session.port}`;
			} else {
				server = await preview({
					concept,
					port: Number(options.port || 3176),
					cache: options.cache || "no-store",
				});
				origin = server.origin;
			}
		}
		browser = await ui.launchChromium(loaded);
		if (cancelled)
			throw new Error("Drive interrupted; owned resources will be cleaned up.");
		for (const feature of features)
			for (const state of cases)
				for (const language of languages)
					for (const size of sizes)
						for (const input of inputs)
							for (const motion of motions)
								for (const transport of transports) {
									const dimensions = map.sizes[size];
									if (cancelled)
										throw new Error(
											"Drive interrupted; owned resources will be cleaned up.",
										);
									const cssWidth = dimensions.width / (dimensions.zoom || 1);
									if (
										(feature.widths === "phone" && cssWidth > 720) ||
										(feature.widths === "wide" && cssWidth <= 720) ||
										(feature.minWidth && cssWidth < feature.minWidth) ||
										(feature.maxWidth && cssWidth > feature.maxWidth)
									) {
										if (options.feature === "all") continue;
										throw new Error(
											`${feature.id} unavailable at ${size}; select its applicable sizes from the map`,
										);
									}
									const entry = {
										feature: `${selected.page}/${feature.id}`,
										state: state.name,
										language,
										size,
										input,
										motion,
										transport,
										query: {
											...feature.query,
											...state.query,
											lang: language,
											...(motion === "reduce" ? { motion: "off" } : {}),
										},
										files: [],
										status: "running",
									};
									const stem = `${String(manifest.items.length + 1).padStart(3, "0")}-${language}-${size}-${input}-${motion}-${transport}`;
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
										const save = async (suffix) => {
											const file = `${stem}-${suffix}.png`;
											const bytes = await ui.screenshot(current.page, {
												method: "playwright",
												fullPage: false,
												animations: "allow",
											});
											await writeFile(await outputFile(out, file), bytes);
											entry.files.push(file);
										};
										await save("before");
										const effective =
											feature.fullMotion && motion === "reduce"
												? {
														actions: [feature.actions[0]],
														proof: {
															selector: feature.proof.selector,
															disabled: true,
														},
													}
												: feature;
										const priorText = feature.proof.textChanged
											? await current.page
													.locator(feature.proof.selector)
													.textContent()
											: null;
										await ui.injectProbe(current.page);
										const priorPosition = feature.proof.moved
											? await current.page.evaluate(
													(selector) => UIProbe.rect(selector),
													feature.proof.selector,
												)
											: null;
										let priorCss = feature.proof.cssPropertyChanged
											? await current.page.evaluate(
													(property) =>
														getComputedStyle(
															document.documentElement,
														).getPropertyValue(property),
													feature.proof.cssPropertyChanged,
												)
											: null;
										const previousCount = feature.proof.countIncreased
											? await current.page
													.locator(feature.proof.countIncreased)
													.count()
											: null;
										entry.actions = [];
										for (const action of effective.actions) {
											if (
												feature.proof.cssPropertyChanged &&
												action === effective.actions.at(-1)
											)
												priorCss = await current.page.evaluate(
													(property) =>
														getComputedStyle(
															document.documentElement,
														).getPropertyValue(property),
													feature.proof.cssPropertyChanged,
												);
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
													count: previousCount,
												},
												{ timeout: 10000 },
											);
										else await prove(current.page, effective.proof, language);
										if (feature.settleIntro && motion === "full")
											await probes.introSettled(current.page);
										await ui.twoFrames(current.page);
										if (feature.proof.textChanged)
											await current.page.waitForFunction(
												({ selector, prior }) =>
													document.querySelector(selector)?.textContent !==
													prior,
												{ selector: feature.proof.selector, prior: priorText },
											);
										if (feature.proof.moved) {
											const position = await current.page.evaluate(
												(selector) => UIProbe.rect(selector),
												feature.proof.selector,
											);
											if (
												JSON.stringify(position) ===
												JSON.stringify(priorPosition)
											)
												throw new Error(
													`User action did not move ${feature.proof.selector}`,
												);
										}
										if (feature.proof.cssPropertyChanged) {
											const css = await current.page.evaluate(
												(property) =>
													getComputedStyle(
														document.documentElement,
													).getPropertyValue(property),
												feature.proof.cssPropertyChanged,
											);
											if (css === priorCss)
												throw new Error(
													`Control did not update CSS property ${feature.proof.cssPropertyChanged}`,
												);
										}
										await save("after");
										entry.accessibility = await current.page
											.locator("body")
											.ariaSnapshot();
										entry.overflow = await current.page.evaluate(
											probes.overflowProbe,
										);
										await ui.injectProbe(current.page);
										entry.geometry = await current.page.evaluate(() =>
											UIProbe.boxes("body"),
										);
										entry.errors = current.errors;
										if (
											options.probes === "daily" &&
											selected.page === "index.html"
										) {
											entry.dailyGeometry = await current.page.evaluate(
												probes.geometryProbe,
											);
											entry.dailyAccessibility =
												await probes.accessibilityProbe(current.page, {
													lang: language,
													control: true,
												});
										}
										entry.status =
											current.errors.length || entry.overflow.hScroll
												? "fail"
												: "pass";
										await jsonOutput(out, `${stem}.json`, entry);
										console.log(
											`FRAME ${entry.status.toUpperCase()}: ${entry.feature} ${entry.state} ${language} ${size} ${input} ${motion} ${transport}`,
										);
									} catch (error) {
										entry.status = "fail";
										entry.error = error.message;
										console.log(
											`FRAME FAIL: ${entry.feature}: ${error.message}`,
										);
									} finally {
										await current.context.close();
										await jsonOutput(out, "manifest.json", manifest);
									}
								}
		for (const language of languages) {
			const cells = manifest.items
				.filter((item) => item.language === language && item.files.length)
				.map((item) => ({
					img: resolve(out, item.files.at(-1)),
					caption: `${item.feature} ${item.state} ${item.language} ${item.size} ${item.input} ${item.motion} ${item.transport}`,
				}));
			const name = `sheet-${language}.png`;
			await ui.renderSheet(
				browser,
				{
					title: `${manifest.feature} ${language}`,
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
		if (manifest.items.some((item) => item.status !== "pass"))
			throw new Error("A frame failed; inspect manifest.json");
		console.log(
			`DRIVE PASS: ${manifest.items.length} items; evidence ${out}/manifest.json`,
		);
	} catch (error) {
		failure = error;
	} finally {
		const cleanupResults = await Promise.allSettled([
			browser?.close(),
			server?.close(),
		]);
		process.removeListener("SIGINT", abort);
		process.removeListener("SIGTERM", abort);
		await jsonOutput(out, "manifest.json", manifest);
		const cleanupFailure = cleanupResults.find(
			(result) => result.status === "rejected",
		);
		if (cleanupFailure)
			failure ??= new Error(`Cleanup failed: ${cleanupFailure.reason.message}`);
	}
	if (failure) throw failure;
}
