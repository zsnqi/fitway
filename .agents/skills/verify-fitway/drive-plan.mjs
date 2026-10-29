// Drive planning: query switches, state cases, axes, where a feature is reachable, the
// context a capture opens with, and the planned captures.
import { colorsAxis } from "./colors.mjs";
import { matchesStateRule } from "./state-rules.mjs";

export const axis = (value, fallback, allowed) => {
	const items = (value || fallback).split(",");
	for (const item of items)
		if (!allowed.includes(item))
			throw new Error(`Unsupported axis ${item}; choose ${allowed}`);
	return items;
};
export const inputAxis = (value) =>
	axis(value, "mouse,touch", ["mouse", "touch", "keyboard"]);

export const stateName = (query) =>
	new URLSearchParams(Object.entries(query).sort()).toString() || "default";

// Null where the recipe reaches the feature; otherwise the state rule that rules it out, if any,
// and the reason.
export function featureUnreachable(feature, cssWidth, query, language) {
	const unavailable =
		(feature.widths === "phone" && cssWidth > 720) ||
		(feature.widths === "wide" && cssWidth <= 720) ||
		(feature.minWidth && cssWidth < feature.minWidth) ||
		(feature.maxWidth && cssWidth > feature.maxWidth);
	const absent = (feature.unreachable || []).find((rule) =>
		matchesStateRule(rule, query, language),
	);
	if (!unavailable && !absent) return null;
	return {
		rule: absent,
		reason:
			absent?.reason ||
			`Feature path unavailable at ${cssWidth} CSS pixels by its recipe`,
	};
}

export function contextOptions({
	width,
	height,
	zoom,
	input,
	motion,
	color,
	language,
}) {
	return {
		viewport: { width, height },
		zoom: zoom || 1,
		touch: input === "touch",
		mobile: input === "touch" && width / (zoom || 1) <= 720,
		reducedMotion: motion === "reduce" ? "reduce" : "no-preference",
		colorScheme: "dark",
		forcedColors: color === "forced" ? "active" : "none",
		locale: language === "ar" ? "ar-SA" : "en-US",
		timezoneId: "Asia/Riyadh",
	};
}

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
			name: stateName(resolved.query),
		};
	});
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
									state: stateName(effective.query),
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

export { drivePlan };
