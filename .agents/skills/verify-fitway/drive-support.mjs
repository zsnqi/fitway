// Drive selection, proofs, capture identity, workers, and run plans.
import { colorsAxis } from "./colors.mjs";
import { prove } from "./drive.mjs";
import {
	matchesStateRule,
	stateWhenKey,
	validateStateRules,
} from "./state-rules.mjs";

const axis = (value, fallback, allowed) => {
	const items = (value || fallback).split(",");
	for (const item of items)
		if (!allowed.includes(item))
			throw new Error(`Unsupported axis ${item}; choose ${allowed}`);
	return items;
};
export const inputAxis = (value) =>
	axis(value, "mouse,touch", ["mouse", "touch", "keyboard"]);

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

const pageReadingProofKeys = new Set([
	"attribute",
	"checked",
	"disabled",
	"focused",
	"hidden",
	"inputValue",
	"nonemptyText",
	"rangeStep",
	"textContains",
	"visible",
]);

function readsPage(proof) {
	if (!proof || typeof proof !== "object") return false;
	if (typeof proof.expression === "string") return true;
	if (Array.isArray(proof.allOf) && proof.allOf.length)
		return proof.allOf.some(readsPage);
	if (Array.isArray(proof.oneOf) && proof.oneOf.length)
		return proof.oneOf.every(readsPage);
	return (
		typeof proof.selector === "string" &&
		Object.keys(proof).some((key) => pageReadingProofKeys.has(key))
	);
}

function requestedProofs(page, state, language) {
	validateStateRules(page);
	const rules = page.states.filter((rule) =>
		matchesStateRule(rule, state.query, language),
	);
	for (const key of Object.keys(state.query))
		if (
			!["lang", "motion"].includes(key) &&
			!rules.some((rule) => Object.hasOwn(rule.when || {}, key))
		)
			throw new Error(
				`No observable state proof for ${key}=${state.query[key]}; add it to verification-recipes.json before claiming a pass.`,
			);
	for (const rule of rules)
		if (rule.afterActions && !readsPage(rule.proof))
			throw new Error(
				`${page.page}: afterActions state proof must read the page with a selector or expression, not the address or readiness alone.`,
			);
	if (!rules.length)
		throw new Error(
			`No observable default state proof for ${page.page}; add it to verification-recipes.json.`,
		);
	return rules;
}

async function proveStateRule(page, rule, language, moment) {
	try {
		await prove(page, rule.proof, language);
	} catch (error) {
		const kind = rule.afterActions ? "afterActions" : "before";
		const languageLabel = rule.language || "none";
		throw new Error(
			`State proof failed at ${moment}: ${kind} rule ${JSON.stringify(rule.shows ?? null)} with when ${stateWhenKey(rule.when || {})} language ${languageLabel}; ${error.message}`,
		);
	}
}

const safe = (value) => value.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
const captureIdentity = (item) =>
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
// Start in input order and finish active jobs before command-owned cleanup.
async function runWorkers(jobs, count, onFailure) {
	let next = 0;
	let failed;
	await Promise.all(
		Array.from({ length: Math.min(count, jobs.length) }, async () => {
			while (next < jobs.length && !failed) {
				const index = next++;
				try {
					await jobs[index]();
				} catch (error) {
					if (!failed || index < failed.index) failed = { index, error };
				}
			}
		}),
	);
	if (failed) {
		onFailure(failed.index);
		throw failed.error;
	}
}
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
		colors: entry.colors,
		result: entry.status,
		problems: entry.problems,
		proof: entry.stateProof,
		afterFrameProof: entry.afterFrameProof,
		featureProof: entry.featureProof,
		heldPress: entry.heldPress,
		dependencies: entry.dependencies,
		files: entry.files,
	};
}

// Comparison measures a reproducible picture after the user flow. Ordinary drive
// keeps its original capture timing, including frames taken during movement.
class ComparisonCaptureError extends Error {}

export function observeComparisonFrames() {
	const request = window.requestAnimationFrame.bind(window);
	const cancel = window.cancelAnimationFrame.bind(window);
	const pending = new Set();
	Object.defineProperty(window, "__verifyFitwayFrames", {
		value: {
			get pending() {
				return pending.size;
			},
		},
	});
	window.requestAnimationFrame = (callback) => {
		if (typeof callback !== "function") return request(callback);
		const id = request((time) => {
			pending.delete(id);
			callback.call(window, time);
		});
		pending.add(id);
		return id;
	};
	window.cancelAnimationFrame = (id) => {
		pending.delete(id);
		return cancel(id);
	};
}

export async function settleComparison(page) {
	try {
		await page.waitForFunction(
			() => {
				if (!window.__verifyFitwayFrames)
					throw new Error("Comparison frame observer was not installed");
				return (
					window.__verifyFitwayFrames.pending === 0 &&
					document
						.getAnimations()
						.every(
							(animation) =>
								["finished", "idle"].includes(animation.playState) ||
								!Number.isFinite(animation.effect.getComputedTiming().endTime),
						)
				);
			},
			undefined,
			{ timeout: 5000 },
		);
	} catch (error) {
		throw new ComparisonCaptureError(
			`Comparison capture did not settle (5000 ms bound): ${error.message}`,
		);
	}
	await page.evaluate(() => {
		for (const animation of document.getAnimations()) {
			if (!Number.isFinite(animation.effect.getComputedTiming().endTime)) {
				animation.pause();
				animation.currentTime = 0;
			}
		}
	});
}

export async function captureComparison(page) {
	await settleComparison(page);
	try {
		return await page.screenshot({
			fullPage: false,
			animations: "allow",
			caret: "hide",
		});
	} catch (error) {
		throw new ComparisonCaptureError(
			`Comparison capture failed: ${error.message}`,
		);
	}
}

function drivePlan(map, options) {
	const selected = map.pages.find(
		(p) => p.page === (options.page || "index.html"),
	);
	if (!selected) throw new Error(`Unmapped page: ${options.page}`);
	const features =
		options.feature === "all"
			? selected.features
			: selected.features.filter((f) =>
					(options.feature || "page").split(",").includes(f.id),
				);
	if (options.feature && options.feature !== "all")
		for (const id of options.feature.split(","))
			if (!features.some((f) => f.id === id))
				throw new Error(
					`Unmapped feature ${id}; run list --page ${selected.page}`,
				);
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
	const inputs = inputAxis(options.inputs);
	const motions = axis(options.motions, "reduce,full", ["reduce", "full"]);
	const transports = axis(options.transports, "http,file", ["http", "file"]);
	const colors = colorsAxis(options.colors);
	const renderModes = transports.flatMap((transport) =>
		colors.map((color) => ({ transport, color })),
	);
	const cases = stateCases(selected, options);
	return {
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
	};
}

export function plannedCaptures(map, options) {
	const {
		selected,
		features,
		cases,
		languages,
		sizes,
		inputs,
		motions,
		renderModes,
	} = drivePlan(map, options);
	const items = [];
	for (const feature of features)
		for (const state of cases)
			for (const language of languages)
				for (const size of sizes)
					for (const input of inputs)
						for (const motion of motions)
							for (const { transport, color } of renderModes) {
								const effective = resolveQuery(selected, {
									...feature.query,
									...state.query,
								});
								items.push({
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
								});
							}
	return { items };
}
export {
	ComparisonCaptureError,
	captureIdentity,
	drivePlan,
	proveStateRule,
	requestedProofs,
	runWorkers,
	safe,
};
