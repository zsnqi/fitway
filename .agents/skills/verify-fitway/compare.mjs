// code-health-exception: giantFiles; until=2026-11-15; reason=giant-split: drive and plannedCaptures now come from two modules; compareOwned's decomposition follows
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";
import {
	assertOutsideGit,
	comparisonPorts,
	jsonOutput,
	portAvailable,
	ReportedFailure,
	reserveVerificationPorts,
	shortFinding,
} from "./core.mjs";
import { plannedCaptures } from "./drive-plan.mjs";
import { diffImages } from "./image-diff.mjs";
import { drive } from "./runner.mjs";
import { timelineTimes } from "./timeline.mjs";

// A cross-side diff runs as (baseline, build); diff_map names their sizes A and B.
const crossSizes = (measurement) =>
	measurement.sameSize === false
		? { baseline: measurement.sizeA, build: measurement.sizeB }
		: undefined;
const sizesText = (sizes) =>
	sizes
		? `; sizes baseline ${sizes.baseline.join("x")}, build ${sizes.build.join("x")}`
		: "";
const identity = (item) =>
	JSON.stringify([
		item.feature,
		item.state,
		item.language,
		item.size,
		item.input,
		item.motion,
		item.transport,
		item.colors,
	]);
export const diffStem = (item, index = 0) =>
	`${String(index + 1).padStart(3, "0")}-${[
		item.feature,
		item.state,
		item.language,
		item.size,
		item.input,
		item.motion,
		item.transport,
		...(item.colors === "forced" ? ["forced"] : []),
	]
		.map((value) =>
			String(value)
				.replace(/[^\w-]/g, "-")
				.slice(0, 100),
		)
		.join("-")}`;
async function capture(options, setup, out) {
	try {
		return await drive({
			...options,
			...setup,
			session: undefined,
			out,
			quiet: true,
			comparisonCapture: true,
		});
	} catch (error) {
		try {
			return {
				...JSON.parse(await readFile(resolve(out, "manifest.json"), "utf8")),
				error: error.message,
			};
		} catch {
			throw error;
		}
	}
}

// The one check of compare's own options; the CLI's preflight calls it too.
export function validateCompareOptions(options) {
	const ports = comparisonPorts(options);
	timelineTimes(options["timeline-times"]);
	if (options.session)
		throw new ToolStartupError(
			"compare owns its previews; omit --session.",
			"drop --session; compare launches and stops its own previews",
		);
	return ports;
}

export async function compare(inputOptions, services) {
	validateCompareOptions(inputOptions);
	const workers = Number(inputOptions.workers ?? 1);
	return compareOwned({ ...inputOptions, workers }, services);
}

async function compareOwned(
	inputOptions,
	{ doctor, child, captureItems = capture, checkPort = portAvailable },
) {
	const options = {
		...inputOptions,
		timeline: Boolean(
			inputOptions.timeline || inputOptions["timeline-times"] !== undefined,
		),
	};
	const ports = validateCompareOptions(options);
	const out = options.out;
	assertOutsideGit(out);
	// Preserve malformed-input diagnostics, but refuse an occupied valid input's
	// pair before browser/tool/map prerequisite work.
	if (
		existsSync(resolve(options.concept, "tools/probes/lib.mjs")) &&
		existsSync(resolve(options.baseline, "tools/probes/lib.mjs"))
	)
		for (const port of ports) await checkPort(port);
	const build = await doctor({
		...options,
		port: ports[0],
		tools: "diff",
		quiet: true,
	});
	const baseline = await doctor({
		...options,
		concept: options.baseline,
		map: options["baseline-map"],
		recipes: options["baseline-recipes"] || options.recipes,
		port: ports[1],
		tools: "diff",
		quiet: true,
	});
	for (const port of ports) await checkPort(port, options.portLease);
	const lease =
		checkPort === portAvailable ? await reserveVerificationPorts(ports) : null;
	options.portLease = lease;
	try {
		let pages =
			options.page === "all"
				? build.map.pages.map((p) => p.page)
				: [options.page || "index.html"];
		let cache;
		let cacheTools;
		let runtime;
		let reused = 0;
		let captured = 0;
		const production = captureItems === capture;
		if (
			options["affected-pages"] ||
			(production && options["baseline-cache"] !== "off")
		) {
			const { pageLoads, reachedPages } = await import("./reaches.mjs");
			const baselineLoads = pageLoads(baseline);
			if (options["affected-pages"]) {
				const reasons = reachedPages(pageLoads(build), baselineLoads);
				for (const page of pages) {
					const why = [...new Set(reasons.get(page) || [])];
					console.log(
						why.length
							? `PAGE TAKEN: ${page}; ${why.join("; ")}`
							: `PAGE LEFT OUT: ${page}; no reachable file or recipe changed`,
					);
				}
				pages = pages.filter((page) => reasons.get(page)?.length);
				console.log(
					`COMPARE PARTIAL: ${pages.length} pages taken; final verification requires a full compare`,
				);
			}
			if (production && options["baseline-cache"] !== "off" && pages.length) {
				cacheTools = await import("./baseline-cache.mjs");
				cache = new cacheTools.BaselineCache(baseline, options, baselineLoads);
				await cache.initialize();
			}
		}
		if (production && pages.length) {
			const { compareRuntime } = await import("./compare-runtime.mjs");
			runtime = compareRuntime(options.portLease);
		}
		const runCapture = async (captureOptions, setup, folder) => {
			const data = await captureItems(
				{ ...captureOptions, ...(runtime ? { compareRuntime: runtime } : {}) },
				setup,
				folder,
			);
			if (setup === baseline) captured += data.items.length;
			return data;
		};
		const result = {
			schema: 1,
			concept: build.concept,
			baseline: baseline.concept,
			items: [],
			...(options["affected-pages"] ? { partial: true, pages } : {}),
		};
		const diff = (a, b, prefix) =>
			diffImages(a, b, {
				out,
				prefix,
				tools: build.tools,
				child,
			});
		try {
			for (const page of pages) {
				const tag = page.replace(".html", "");
				const folders = {
					build: resolve(out, tag, "build"),
					baseline: resolve(out, tag, "baseline"),
				};
				const left = await runCapture(
					{ ...options, page, port: ports[0] },
					build,
					folders.build,
				);
				const baselinePlan = cache
					? plannedCaptures(baseline.map, { ...options, page })
					: left;
				if (cache)
					for (const item of baselinePlan.items)
						item.timeline = left.items.find(
							(candidate) => identity(candidate) === identity(item),
						)?.timeline;
				const loadKept = (left) =>
					cache.load(page, left, resolve(out, tag, "baseline-kept"));
				let kept = cache ? await loadKept(baselinePlan) : null;
				const previousIdentities = new Set(
					kept?.effective.items.map(identity) || [],
				);
				const previouslyKept = previousIdentities.size > 0;
				const missingPlan = baselinePlan.items
					.map((item, index) => ({ item, index }))
					.filter(({ item }) => !previousIdentities.has(identity(item)));
				const missing = missingPlan.map(({ item }) => identity(item));
				const fresh =
					!cache || missing.length
						? await runCapture(
								{
									...options,
									page,
									port: ports[1],
									...(cache ? { captureOnly: missing } : {}),
								},
								baseline,
								folders.baseline,
							)
						: null;
				const right = cache
					? cacheTools.mergeCaptures(
							baselinePlan,
							structuredClone(kept?.effective),
							cacheTools.absoluteCaptures(
								fresh || { items: [] },
								folders.baseline,
							),
						)
					: fresh;
				const fatalItem = right.items.find((item) => item.status === "running");
				if (
					cache &&
					(fatalItem || (fresh?.error && fresh.items.length < missing.length))
				) {
					const end = fatalItem
						? right.items.indexOf(fatalItem)
						: (missingPlan[fresh.items.length - 1]?.index ?? -1);
					right.items.splice(end + 1);
					right.error = fresh?.error || right.error;
				}
				if (kept) reused += kept.effective.items.length;
				const original = cache
					? cacheTools.mergeCaptures(
							right,
							kept?.original,
							cacheTools.absoluteCaptures(
								fresh || { items: [] },
								folders.baseline,
							),
						)
					: null;
				const baselineRepeat = async (index, repeatOptions, folder, item) => {
					if (!kept) return runCapture(repeatOptions, baseline, folder);
					const data = structuredClone(
						index === "settled" ? kept.settled : kept.reserves[index],
					);
					if (item)
						data.items = data.items.filter(
							(candidate) => identity(candidate) === identity(item),
						);
					if (previouslyKept)
						reused += data.items.filter((candidate) =>
							previousIdentities.has(identity(candidate)),
						).length;
					return data;
				};
				let sharedTimesByItem;
				if (options.timeline && options["timeline-times"] === undefined) {
					sharedTimesByItem = Object.fromEntries(
						baselinePlan.items.map((item) => {
							const buildItem = left.items.find(
								(candidate) => identity(candidate) === identity(item),
							);
							const other = right.items.find(
								(i) => identity(i) === identity(item),
							);
							return [
								identity(item),
								[
									...new Set([
										...(buildItem?.timeline?.times || []),
										...(other?.timeline?.times || []),
									]),
								].sort((a, b) => a - b),
							];
						}),
					);
					for (const side of ["build", "baseline"]) {
						const data = side === "build" ? left : right;
						for (const [index, item] of data.items.entries())
							if (
								item.timeline?.times.length &&
								JSON.stringify(item.timeline.times) !==
									JSON.stringify(sharedTimesByItem[identity(item)])
							) {
								const folder = resolve(
									out,
									`${diffStem(item, index)}-shared-times-${side}`,
								);
								const repeated = await runCapture(
									{
										...options,
										page,
										port: ports[side === "build" ? 0 : 1],
										timelineTimesByItem: sharedTimesByItem,
										feature: item.feature.split("/")[1],
										states: "default",
										query: new URLSearchParams(
											Object.entries(item.query).filter(
												([key]) => !["lang", "motion"].includes(key),
											),
										).toString(),
										languages: item.language,
										sizes: item.size,
										inputs: item.input,
										motions: item.motion,
										transports: item.transport,
										colors: item.colors,
									},
									side === "build" ? build : baseline,
									folder,
								);
								const replacement = repeated.items[0];
								if (replacement?.status !== "pass") {
									item.status = "problem";
									item.problems.push(
										"Shared-time recapture failed",
										...(replacement?.problems || []),
									);
								} else
									item.timeline = {
										...replacement.timeline,
										samples: replacement.timeline.samples.map((s) => ({
											...s,
											sources: [
												...(item.timeline.samples.find(
													(first) => first.time === s.time,
												)?.sources || []),
												...(s.sources || []),
											],
											file: resolve(folder, s.file),
										})),
									};
							}
					}
				}
				if (cache && missing.length) {
					const effective = cacheTools.absoluteCaptures(
						right,
						folders.baseline,
					);
					const reserves = [];
					const settledFolder = resolve(out, tag, "baseline-settled-repeat");
					const settled = options.timeline
						? cacheTools.absoluteCaptures(
								await runCapture(
									{ ...options, page, port: ports[1], captureOnly: missing },
									baseline,
									settledFolder,
								),
								settledFolder,
							)
						: null;
					// Seed independent frames even when today's builds are equal. A later
					// result-side edit can need repeats/confirmations without baseline work.
					for (let index = 0; index < (options.timeline ? 3 : 1); index++) {
						const folder = resolve(out, tag, `baseline-reserve-${index}`);
						const repeated = await runCapture(
							{
								...options,
								page,
								port: ports[1],
								captureOnly: missing,
								...(sharedTimesByItem
									? { timelineTimesByItem: sharedTimesByItem }
									: {}),
							},
							baseline,
							folder,
						);
						reserves.push(
							cacheTools.mergeCaptures(
								baselinePlan,
								kept?.reserves[index],
								cacheTools.absoluteCaptures(repeated, folder),
							),
						);
					}
					kept = {
						original,
						effective,
						reserves,
						settled: settled
							? cacheTools.mergeCaptures(baselinePlan, kept?.settled, settled)
							: reserves[0],
						times: sharedTimesByItem,
					};
					await cache.save(page, kept, out);
				}
				if (options.timeline) {
					// Callback findings are evidence, not a classification.
					// Re-run each side in fresh contexts at the exact same
					// times and mark NOT-HELD only when those pixels differ.
					for (const side of ["build", "baseline"]) {
						const data = side === "build" ? left : right;
						const folder = resolve(out, tag, `timeline-repeat-${side}`);
						const repeatOptions = {
							...options,
							page,
							port: ports[side === "build" ? 0 : 1],
							...(sharedTimesByItem
								? {
										timelineTimesByItem: sharedTimesByItem,
									}
								: {}),
						};
						const repeated =
							side === "build"
								? await runCapture(repeatOptions, build, folder)
								: await baselineRepeat(0, repeatOptions, folder);
						for (const [index, item] of data.items.entries()) {
							const repeat = repeated.items.find(
								(candidate) => identity(candidate) === identity(item),
							);
							for (const sample of item.timeline?.samples || []) {
								const repeatSample = repeat?.timeline?.samples.find(
									(candidate) => candidate.time === sample.time,
								);
								sample.stability = {
									side,
									first: resolve(
										side === "build" ? folders.build : folders.baseline,
										sample.file,
									),
									repeat: repeatSample
										? resolve(folder, repeatSample.file)
										: null,
								};
								sample.sources = [
									...(sample.sources || []),
									...(repeatSample?.sources || []),
								];
								if (!repeatSample || repeat.status !== "pass") {
									sample.result = "problem";
									sample.problems = [
										"Same-side stability capture did not capture this time",
										...(repeat?.problems || []),
									];
								} else {
									const measurement = await diff(
										sample.stability.first,
										sample.stability.repeat,
										`${diffStem(item, index)}-time-${String(sample.time).replace(".", "_")}ms-stability-${side}`,
									);
									Object.assign(sample.stability, measurement);
									sample.result = measurement.identical ? "held" : "not-held";
								}
							}
						}
					}
				}
				if (!left.items.length || !right.items.length)
					throw new Error(
						`Comparison captured no items: build=${left.error || left.items.length}; baseline=${right.error || right.items.length}`,
					);
				for (const [index, item] of left.items.entries()) {
					const other = right.items.find((i) => identity(i) === identity(item));
					const entry = {
						feature: item.feature,
						state: item.state,
						language: item.language,
						size: item.size,
						input: item.input,
						motion: item.motion,
						transport: item.transport,
						colors: item.colors,
						result: "problem",
						problems: [],
						captures: {
							build: { start: item.captureStartedAt, end: item.captureEndedAt },
							baseline: {
								start: other?.captureStartedAt,
								end: other?.captureEndedAt,
							},
						},
						files: {
							build: resolve(folders.build, item.files.at(-1) || ""),
							baseline: resolve(folders.baseline, other?.files.at(-1) || ""),
						},
					};
					result.items.push(entry);
					try {
						if (!other) throw new Error("Baseline has no matching item");
						if (
							item.status === "not-reachable" &&
							other.status === "not-reachable"
						) {
							entry.result = "not-reachable";
							entry.problems.push(...item.problems, ...other.problems);
						} else {
							if (item.status !== "pass" || other.status !== "pass")
								throw new Error(
									`Capture problem: build=${item.status}, baseline=${other.status}; ${[...item.problems, ...other.problems].join("; ")}`,
								);
							const prefix = diffStem(item, index);
							let measured = await diff(
								entry.files.baseline,
								entry.files.build,
								`${prefix}-initial-diff`,
							);
							entry.initial = {
								identical: measured.identical,
								region: measured.bbox,
								changedPixels: measured.changedPixels,
							};
							if (!measured.identical) {
								const repeatOptions = {
									...options,
									page,
									feature: item.feature.split("/")[1],
									states: "default",
									query: new URLSearchParams(
										Object.entries(item.query).filter(
											([key]) => !["lang", "motion"].includes(key),
										),
									).toString(),
									languages: item.language,
									sizes: item.size,
									inputs: item.input,
									motions: item.motion,
									transports: item.transport,
									colors: item.colors,
								};
								const repeatedBuild = await runCapture(
									{ ...repeatOptions, port: ports[0] },
									build,
									resolve(out, `${prefix}-repeat-build`),
								);
								const repeatedBase = await baselineRepeat(
									"settled",
									{ ...repeatOptions, port: ports[1] },
									resolve(out, `${prefix}-repeat-baseline`),
									item,
								);
								const b = repeatedBuild.items[0];
								const a = repeatedBase.items[0];
								if (b?.status !== "pass" || a?.status !== "pass")
									throw new Error(
										"Fresh-context repetition had a capture problem",
									);
								entry.repeated = true;
								entry.files.repeatBuild = resolve(
									out,
									`${prefix}-repeat-build`,
									b.files.at(-1),
								);
								entry.files.repeatBaseline = resolve(
									out,
									`${prefix}-repeat-baseline`,
									a.files.at(-1),
								);
								measured = await diff(
									entry.files.repeatBaseline,
									entry.files.repeatBuild,
									`${prefix}-diff`,
								);
								entry.diffPrefix = resolve(out, `${prefix}-diff`);
							}
							entry.result = measured.identical ? "equal" : "different";
							entry.region = measured.bbox;
							entry.changedPixels = measured.changedPixels;
							entry.diffImages = measured.images;
							entry.sizes = crossSizes(measured);
							if (options.timeline) {
								entry.recipe = { build: item.recipe, baseline: other.recipe };
								const measurements = new Map();
								for (const sample of item.timeline?.samples || []) {
									const baseSample = other.timeline?.samples.find(
										(s) => s.time === sample.time,
									);
									if (sample.result !== "held" || baseSample?.result !== "held")
										continue;
									const prefix = `${diffStem(item, index)}-time-${String(sample.time).replace(".", "_")}ms-diff`;
									measurements.set(sample.time, {
										prefix,
										measurement: await diff(
											resolve(folders.baseline, baseSample.file),
											resolve(folders.build, sample.file),
											prefix,
										),
									});
								}
								const unconfirmedDifference = () =>
									[...measurements].some(
										([time, { measurement }]) =>
											!measurement.identical &&
											item.timeline.samples.find((s) => s.time === time)
												?.result === "held" &&
											other.timeline.samples.find((s) => s.time === time)
												?.result === "held",
									);
								// Two initial captures can agree even when a later capture varies.
								// Confirm a cross-build difference in fresh contexts. Any exemption still
								// requires an actual unequal pair on one side at this exact time.
								for (const round of [1, 2]) {
									if (!unconfirmedDifference()) break;
									for (const side of ["build", "baseline"]) {
										if (!unconfirmedDifference()) break;
										const data = side === "build" ? item : other;
										const folder = resolve(
											out,
											`${prefix}-timeline-confirm-${side}-${round}`,
										);
										const confirmOptions = {
											...options,
											page,
											port: ports[side === "build" ? 0 : 1],
											feature: item.feature.split("/")[1],
											states: "default",
											query: new URLSearchParams(
												Object.entries(item.query).filter(
													([key]) => !["lang", "motion"].includes(key),
												),
											).toString(),
											languages: item.language,
											sizes: item.size,
											inputs: item.input,
											motions: item.motion,
											transports: item.transport,
											colors: item.colors,
											timelineTimesByItem: {
												[identity(item)]: item.timeline.times,
											},
										};
										const confirmed =
											side === "build"
												? await runCapture(confirmOptions, build, folder)
												: await baselineRepeat(
														round,
														confirmOptions,
														folder,
														item,
													);
										const repeat = confirmed.items.find(
											(candidate) => identity(candidate) === identity(item),
										);
										for (const sample of data.timeline?.samples || []) {
											const repeatSample = repeat?.timeline?.samples.find(
												(candidate) => candidate.time === sample.time,
											);
											sample.sources.push(...(repeatSample?.sources || []));
											if (sample.result !== "held") continue;
											if (!repeatSample || repeat.status !== "pass") {
												sample.result = "problem";
												sample.problems = [
													"Same-side confirmation did not capture this time",
													...(repeat?.problems || []),
												];
												continue;
											}
											const file = resolve(folder, repeatSample.file);
											const measurement = await diff(
												sample.stability.first,
												file,
												`${diffStem(item, index)}-time-${String(sample.time).replace(".", "_")}ms-confirm-${side}-${round}`,
											);
											sample.stability.confirmations ||= [];
											sample.stability.confirmations.push({
												file,
												...measurement,
											});
											if (!measurement.identical) {
												sample.result = "not-held";
												Object.assign(sample.stability, {
													previousRepeat: sample.stability.repeat,
													repeat: file,
													...measurement,
												});
											}
										}
									}
								}
								entry.timeline = {
									times: item.timeline?.times || [],
									reason: item.timeline?.reason,
									samples: [],
								};
								for (const sample of item.timeline?.samples || []) {
									const baseSample = other.timeline?.samples.find(
										(s) => s.time === sample.time,
									);
									const moment = {
										time: sample.time,
										result: "problem",
										sources: [
											...(sample.sources || []),
											...(baseSample?.sources || []),
										],
										stability: {
											build: sample.stability || null,
											baseline: baseSample?.stability || null,
										},
										files: {
											build: resolve(folders.build, sample.file),
											baseline: baseSample
												? resolve(folders.baseline, baseSample.file)
												: null,
										},
									};
									entry.timeline.samples.push(moment);
									if (!baseSample)
										moment.problems = ["Baseline did not capture this time"];
									else if (
										sample.result === "problem" ||
										baseSample.result === "problem"
									) {
										moment.problems = [
											...(sample.problems || []),
											...(baseSample.problems || []),
										];
									} else if (
										sample.result === "not-held" ||
										baseSample.result === "not-held"
									)
										moment.result = "not-held";
									else {
										const { prefix, measurement } = measurements.get(
											sample.time,
										);
										Object.assign(moment, {
											result: measurement.identical ? "equal" : "different",
											region: measurement.bbox,
											changedPixels: measurement.changedPixels,
											diffImages: measurement.images,
											sizes: crossSizes(measurement),
											diffPrefix: resolve(out, prefix),
										});
									}
									console.log(
										`TIMELINE ${moment.result.toUpperCase()}: ${item.feature} ${item.state} ${item.language} ${item.size} ${item.input} ${item.motion} ${item.transport} ${item.colors}; time ${moment.time} ms${moment.region ? `; region ${JSON.stringify(moment.region)}; diff ${moment.diffPrefix}` : ""}${sizesText(moment.sizes)}${moment.sources.length ? `; ${moment.sources.map((f) => `${f.source.file}:${f.source.line}: ${f.reason}`).join("; ")}` : ""}`,
									);
								}
								console.log(
									`TIMELINE TIMES: ${item.feature} ${item.state} ${item.language} ${item.size} ${item.input} ${item.motion} ${item.transport} ${item.colors}; ${entry.timeline.times.join(", ") || entry.timeline.reason || "unavailable"}`,
								);
							}
						}
					} catch (error) {
						entry.result = "problem";
						entry.problems.push(error.message);
					}
					if (options.timeline && !entry.timeline) {
						entry.timeline = {
							times: [],
							samples: [],
							captureSources: {
								build:
									item.timeline?.samples.map(({ time, sources }) => ({
										time,
										sources,
									})) || [],
								baseline:
									other?.timeline?.samples.map(({ time, sources }) => ({
										time,
										sources,
									})) || [],
							},
							reason:
								entry.result === "not-reachable"
									? "State/feature cannot be reached; no timeline"
									: "Capture unavailable; no timeline",
						};
						console.log(
							`TIMELINE TIMES: ${entry.feature} ${entry.state} ${entry.language} ${entry.size} ${entry.input} ${entry.motion} ${entry.transport} ${entry.colors}; ${entry.timeline.reason}`,
						);
					}
					console.log(
						`COMPARE ${entry.result.toUpperCase()}: ${entry.feature} ${entry.state} ${entry.language} ${entry.size} ${entry.input} ${entry.motion} ${entry.transport} ${entry.colors}${entry.region ? `; region ${JSON.stringify(entry.region)}; diff ${entry.diffPrefix}` : ""}${sizesText(entry.sizes)}${entry.repeated ? "; repeated in fresh contexts" : ""}${entry.problems.length ? `; ${entry.problems.map(shortFinding).join("; ")}` : ""}`,
					);
					await jsonOutput(out, "comparison.json", result);
				}
				for (const item of right.items)
					if (!left.items.some((other) => identity(item) === identity(other))) {
						const entry = {
							feature: item.feature,
							state: item.state,
							language: item.language,
							size: item.size,
							input: item.input,
							motion: item.motion,
							transport: item.transport,
							colors: item.colors,
							result: "problem",
							problems: ["Baseline-only item; no matching build item"],
						};
						result.items.push(entry);
						console.log(
							`COMPARE PROBLEM: ${entry.feature} ${entry.state}; ${entry.problems[0]}`,
						);
					}
			}
		} finally {
			await runtime?.close();
			console.log(`BASELINE CAPTURES: ${reused} reused; ${captured} captured`);
			if (runtime) {
				const counts = runtime.counts();
				console.log(
					`COMPARE HTTP: ${counts.requests} requests; ${counts.connections} connections; ${counts.peak} peak sockets`,
				);
			}
		}
		await jsonOutput(out, "comparison.json", result);
		const counts = Object.fromEntries(
			["equal", "different", "not-reachable", "problem"].map((key) => [
				key,
				result.items.filter((i) => i.result === key).length,
			]),
		);
		const moments = result.items.flatMap((item) =>
			(item.timeline?.samples || []).map((sample) => ({
				...sample,
				item: `${item.feature} ${item.state} ${item.language} ${item.size} ${item.input} ${item.motion} ${item.transport} ${item.colors}`,
			})),
		);
		const timelineCounts = Object.fromEntries(
			["equal", "different", "not-held", "problem"].map((key) => [
				key,
				moments.filter((s) => s.result === key).length,
			]),
		);
		const failed =
			counts.different ||
			counts.problem ||
			timelineCounts.different ||
			timelineCounts.problem;
		console.log(
			`COMPARE ${failed ? "FAIL" : options.timeline && timelineCounts["not-held"] ? "INCOMPLETE" : "PASS"}: ${counts.equal} equal; ${counts.different} different; ${counts["not-reachable"]} not reachable; ${counts.problem} problems; ${out}/comparison.json`,
		);
		if (options.timeline) {
			result.timelineSummary = {
				...timelineCounts,
				notHeld: moments.filter((s) => s.result === "not-held"),
			};
			console.log(
				`TIMELINE ${timelineCounts.different || timelineCounts.problem ? "FAIL" : timelineCounts["not-held"] ? "INCOMPLETE" : "PASS"}: ${timelineCounts.equal} equal; ${timelineCounts.different} different; ${timelineCounts["not-held"]} not held; ${timelineCounts.problem} problems`,
			);
			for (const sample of result.timelineSummary.notHeld) {
				const varying = Object.values(sample.stability).filter(
					(side) => side?.identical === false,
				);
				console.log(
					`NOT-HELD: ${sample.item}; time ${sample.time} ms; ${varying.map((side) => `${side.side} captures ${side.first} and ${side.repeat}`).join("; ")}; ${sample.sources.map((f) => `${f.source.file}:${f.source.line}`).join(", ") || "no authored callback source observed"}`,
				);
			}
			await jsonOutput(out, "comparison.json", result);
		}
		if (
			counts.different ||
			counts.problem ||
			timelineCounts.different ||
			timelineCounts.problem
		)
			throw new ReportedFailure(
				"Comparison has differences or problems; inspect comparison.json.",
			);
		return result;
	} finally {
		await lease?.release();
	}
}
