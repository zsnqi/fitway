import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { captureIdentity, itemSummary, safe } from "./capture-records.mjs";
import { requireForcedColors } from "./colors.mjs";
import {
	ComparisonCaptureError,
	captureComparison,
	observeComparisonFrames,
	settleComparison,
} from "./comparison-capture.mjs";
import {
	jsonOutput,
	outputFile,
	ownedSession,
	preview,
	ReportedFailure,
	shortFinding,
	verificationPort,
} from "./core.mjs";
import {
	focusDescription,
	focusedElement,
	KeyboardReachError,
	performAction,
	prove,
	proveFeature,
	reachByKeyboard,
} from "./drive.mjs";
import { drivePlan, resolveQuery } from "./drive-plan.mjs";
import { loadProbes } from "./probes.mjs";
import { proveStateRule, requestedProofs } from "./state-proofs.mjs";
import {
	endedWhenKeys,
	matchesStateRule,
	stateWhenKey,
} from "./state-rules.mjs";
import {
	captureTimeline,
	observeTimeline,
	timelineTimes,
} from "./timeline.mjs";
import { runWorkers } from "./worker-pool.mjs";

export async function drive(options) {
	const { concept, map, tools, loaded, out } = options;
	const requestedTimes = timelineTimes(options["timeline-times"]);
	const {
		selected,
		features,
		languages,
		sizes,
		inputs,
		motions,
		transports,
		colors,
		renderModes,
		cases,
	} = drivePlan(map, options);
	if (colors.includes("forced")) await requireForcedColors(tools);
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
	let manifestWrites = Promise.resolve();
	const writeManifest = () => {
		// Compare reads the manifest only after every capture settles; its
		// final write in the outer finally is the complete record.
		if (options.comparisonCapture) return manifestWrites;
		manifestWrites = manifestWrites.then(() =>
			jsonOutput(out, "manifest.json", manifest),
		);
		return manifestWrites;
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
			if (options.compareRuntime) {
				origin = await options.compareRuntime.origin(
					concept,
					port,
					options.cache || "no-store",
				);
			} else if (options.session) {
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
		// Partial raster reuse can round animated, fractional button edges differently
		// after the animation has ended. Compare paints fresh tiles on both sides.
		browser = options.compareRuntime
			? await options.compareRuntime.browser(ui, loaded)
			: options.comparisonCapture
				? await ui.launchChromium(loaded, {
						args: ["--disable-partial-raster"],
					})
				: await ui.launchChromium(loaded);
		const jobs = [];
		const serialLengths = [];
		for (const feature of features)
			for (const state of cases)
				for (const language of languages)
					for (const size of sizes)
						for (const input of inputs)
							for (const motion of motions)
								for (const { transport, color } of renderModes) {
									const jobIndex = jobs.length;
									jobs.push(async () => {
										serialLengths[jobIndex] = manifest.items.length;
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
											colors: color,
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
										if (
											options.captureOnly &&
											!options.captureOnly.includes(captureIdentity(entry))
										)
											return;
										entry.captureStartedAt = new Date().toISOString();
										const stem = `${String(manifest.items.length + 1).padStart(3, "0")}-${safe(feature.id)}-${safe(entry.state)}-${language}-${size}-${input}-${motion}-${transport}${color === "forced" ? "-forced" : ""}`;
										manifest.items.push(entry);
										serialLengths[jobIndex] = manifest.items.length;
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
											forcedColors: color === "forced" ? "active" : "none",
											locale: language === "ar" ? "ar-SA" : "en-US",
											timezoneId: "Asia/Riyadh",
										});
										if (options.compareRuntime && transport === "http")
											await options.compareRuntime.route(
												current.context,
												origin,
											);
										current.page.setDefaultTimeout(5000);
										if (options.timeline)
											await current.page.addInitScript(
												`(${observeComparisonFrames.toString()})(); (${observeTimeline.toString()})();`,
											);
										else if (options.comparisonCapture)
											await current.page.addInitScript(observeComparisonFrames);
										const save = async (suffix) => {
											const name = `${stem}-${suffix}.png`;
											await writeFile(
												await outputFile(out, name),
												options.comparisonCapture
													? await captureComparison(current.page)
													: await ui.screenshot(current.page, {
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
											entry.readiness = await ui.preparePage(
												current.page,
												url,
												{
													readyJs: selected.ready,
													timeout: 15000,
												},
											);
											if (input === "keyboard")
												entry.initialFocus = await focusedElement(current.page);
											if (selected.page === "index.html")
												await probes.introSettled(current.page);
											entry.emulation = {
												...Object.fromEntries(
													Object.entries(current.emulation).filter(
														([key]) =>
															color === "forced" || key !== "forcedColors",
													),
												),
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
											if (color === "forced") {
												entry.forcedPalette = await current.page.evaluate(
													() => {
														const canvas = document.createElement("span");
														canvas.style.cssText =
															"background-color:Canvas;position:absolute;visibility:hidden";
														document.body.append(canvas);
														const result = {
															active: window.matchMedia(
																"(forced-colors: active)",
															).matches,
															background: getComputedStyle(document.body)
																.backgroundColor,
															canvas: getComputedStyle(canvas).backgroundColor,
														};
														canvas.remove();
														return result;
													},
												);
												if (
													!entry.forcedPalette.active ||
													entry.forcedPalette.background !==
														entry.forcedPalette.canvas
												)
													throw new Error(
														"Forced colours rendering mismatch: body background must equal Canvas; " +
															JSON.stringify(entry.forcedPalette),
													);
											}
											const rules = requestedProofs(
												selected,
												{ query: effective.query },
												language,
											);
											const beforeRules = rules.filter(
												(rule) => !rule.afterActions,
											);
											const afterRules = rules.filter(
												(rule) => rule.afterActions,
											);
											const endedBefore = endedWhenKeys([
												...afterRules,
												...(feature.ends !== undefined
													? [{ afterActions: true, ends: feature.ends }]
													: []),
											]);
											const afterFrameBeforeRules = beforeRules.filter(
												(rule) =>
													!endedBefore.has(stateWhenKey(rule.when || {})),
											);
											const recheckBeforeState = !feature.changesState;
											entry.stateProof = [];
											entry.afterFrameProof = [];
											for (const rule of beforeRules) {
												await proveStateRule(
													current.page,
													rule,
													language,
													"before-frame:pre",
												);
												entry.stateProof.push(rule.shows);
											}
											await save("before");
											for (const rule of beforeRules)
												await proveStateRule(
													current.page,
													rule,
													language,
													"before-frame:post",
												);
											const unavailable =
												(feature.widths === "phone" && cssWidth > 720) ||
												(feature.widths === "wide" && cssWidth <= 720) ||
												(feature.minWidth && cssWidth < feature.minWidth) ||
												(feature.maxWidth && cssWidth > feature.maxWidth);
											const absent = (feature.unreachable || []).find((rule) =>
												matchesStateRule(rule, effective.query, language),
											);
											if (unavailable || absent) {
												if (absent)
													await prove(current.page, absent.proof, language);
												entry.status = "not-reachable";
												entry.problems.push(
													`State/feature cannot be reached: ${absent?.reason || `Feature path unavailable at ${cssWidth} CSS pixels by its recipe`}`,
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
												const actions =
													(input === "keyboard"
														? actionRecipe.keyboardActions ||
															actionRecipe.actions
														: actionRecipe.actions) || [];
												if (options.timeline) entry.recipe = actionRecipe;
												for (const [actionIndex, action] of actions.entries()) {
													const resolvedAction = action.replace(
														/^activate:/,
														input === "keyboard"
															? "activate:"
															: input === "touch"
																? "tap:"
																: "click:",
													);
													if (options.timeline) {
														if (actionIndex === actions.length - 1) {
															const [kind, argument] =
																resolvedAction.split(/:(.*)/s);
															if (
																input === "mouse" &&
																["click", "download", "hold"].includes(kind)
															)
																await current.page
																	.locator(argument)
																	.first()
																	.hover();
															if (
																input === "keyboard" &&
																[
																	"activate",
																	"click",
																	"tap",
																	"download",
																	"type",
																	"select",
																].includes(kind)
															) {
																const selector = ["type", "select"].includes(
																	kind,
																)
																	? argument.slice(0, argument.lastIndexOf("="))
																	: argument;
																await reachByKeyboard(
																	current.page,
																	selector,
																	entry,
																	resolvedAction,
																);
															}
														}
														await settleComparison(current.page);
														if (actionIndex === actions.length - 1)
															await current.page.evaluate(
																({ action, input }) =>
																	window.__verifyFitwayTimeline.arm(
																		action,
																		input,
																	),
																{ action: resolvedAction, input },
															);
													}
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
													if (
														options.timeline &&
														actionIndex === actions.length - 1
													)
														entry.timeline = await captureTimeline(
															current.page,
															{
																out,
																stem,
																times:
																	options.timelineTimesByItem?.[
																		JSON.stringify([
																			entry.feature,
																			entry.state,
																			language,
																			size,
																			input,
																			motion,
																			transport,
																			color,
																		])
																	] || requestedTimes,
															},
														);
													if (resolvedAction.startsWith("hold:")) {
														const held = await ui.heldPressInfo(current.page);
														if (!held)
															throw new Error("held press was not retained");
														await save("held");
														entry.heldPress = {
															...held,
															capturedAt: Date.now(),
															captureDelayMs: Math.max(
																0,
																performance.now() - held.pressedAt,
															),
														};
													}
												}
												if (options.timeline && !actions.length)
													entry.timeline = {
														times: [],
														samples: [],
														reason:
															"Feature has no actions; compared at rest only",
													};
												for (const rule of afterRules) {
													await proveStateRule(
														current.page,
														rule,
														language,
														"after-frame:pre",
													);
													entry.stateProof.push(rule.shows);
												}
												if (feature.proof.countIncreased)
													await current.page.waitForFunction(
														({ selector, count }) =>
															document.querySelectorAll(selector).length >
															count,
														{
															selector: feature.proof.countIncreased,
															count: prior.count,
														},
													);
												else
													await proveFeature(
														current.page,
														actionRecipe.proof,
														language,
														input,
													);
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
															JSON.stringify(
																el.getBoundingClientRect().toJSON(),
															),
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
												if (recheckBeforeState) {
													for (const rule of afterFrameBeforeRules) {
														await proveStateRule(
															current.page,
															rule,
															language,
															"after-frame:pre",
														);
														entry.afterFrameProof.push(rule.shows);
													}
												}
												await save("after");
												if (recheckBeforeState)
													for (const rule of afterFrameBeforeRules)
														await proveStateRule(
															current.page,
															rule,
															language,
															"after-frame:post",
														);
												for (const rule of afterRules)
													await proveStateRule(
														current.page,
														rule,
														language,
														"after-frame:post",
													);
												// A flow may change a state (retry/navigation). Its end proof owns that result;
												// the requested state was proved before the first user action.
												entry.featureProof = actionRecipe.proof;
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
																() =>
																	current.page.evaluate(probes.geometryProbe),
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
											entry.status =
												error instanceof KeyboardReachError
													? "keyboard-unreachable"
													: error instanceof ComparisonCaptureError
														? "problem"
														: "fail";
											entry.problems.push(
												error instanceof KeyboardReachError
													? `Pointer feature unreachable by keyboard: ${error.message}`
													: error.message,
											);
											if (input === "keyboard") {
												entry.finalFocus = await focusedElement(current.page);
												entry.problems.push(
													`Keyboard focus stopped ${focusDescription(entry.finalFocus)}`,
												);
											}
											try {
												await save("error");
											} catch (captureError) {
												entry.problems.push(`capture: ${captureError.message}`);
											}
										} finally {
											if (input === "keyboard" && !entry.finalFocus)
												entry.finalFocus = await focusedElement(
													current.page,
												).catch(() => ({ selector: "<page closed>" }));
											if (ui.releaseHeld)
												await ui.releaseHeld(current.page).catch(() => {});
											await current.context.close();
											await jsonOutput(out, `${stem}.json`, entry);
											await jsonOutput(
												out,
												`${stem}-summary.json`,
												itemSummary(entry),
											);
											if (!options.quiet)
												console.log(
													`FRAME ${entry.status.toUpperCase()}: ${entry.feature} ${entry.state} ${language} ${size} ${input} ${motion} ${transport} ${color}${entry.problems.length ? `; ${entry.problems.map(shortFinding).join("; ")}` : ""}`,
												);
											entry.captureEndedAt = new Date().toISOString();
											await writeManifest();
										}
									});
								}
		await runWorkers(
			jobs,
			options.comparisonCapture ? options.workers || 1 : 1,
			(index) => manifest.items.splice(serialLengths[index]),
		);
		// Compare consumes item frames directly; its sheet is an auxiliary
		// artifact and rendering it after every capture only delays verdicts.
		for (const language of languages) {
			if (options.comparisonCapture) break;
			const cells = manifest.items
				.filter((item) => item.language === language && item.files.length)
				.map((item) => ({
					img: resolve(out, item.files.at(-1)),
					caption: `${item.feature} ${item.state} ${item.size}${item.colors === "forced" ? " forced" : ""} ${item.status}`,
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
				!["pass", "not-reachable", "keyboard-unreachable"].includes(
					item.status,
				) || item.measurementProblems?.length,
		);
		const keyboardUnreachable = manifest.items.filter(
			(item) => item.status === "keyboard-unreachable",
		);
		const hasFindings = failed.length || keyboardUnreachable.length;
		if (!options.quiet)
			console.log(
				`DRIVE ${hasFindings ? "FAIL" : "PASS"}: ${manifest.items.length} items; ${manifest.items.filter((i) => i.status === "not-reachable").length} state/feature unavailable by recipe (cannot be reached); ${keyboardUnreachable.length} pointer feature unreachable by keyboard${keyboardUnreachable.length ? ` (${keyboardUnreachable.map((item) => `${item.feature} ${item.state} ${item.language} ${item.size} ${item.input} ${item.motion} ${item.transport}`).join(", ")})` : ""}; ${failed.length} problems; evidence ${out}/manifest.json`,
			);
		if (hasFindings)
			throw new (options.quiet ? Error : ReportedFailure)(
				"Items have findings; inspect summary.json",
			);
		return manifest;
	} finally {
		await Promise.allSettled([
			options.compareRuntime ? undefined : browser?.close(),
			server?.close(),
		]);
		process.removeListener("SIGINT", abort);
		process.removeListener("SIGTERM", abort);
		await jsonOutput(out, "manifest.json", manifest);
	}
}
