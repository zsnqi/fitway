import { resolveQuery, stateCases } from "./drive-plan.mjs";

export const ALL_BELONGING_WIDTHS = [
	...Array.from({ length: 401 }, (_, index) => 320 + index),
	721,
	...Array.from({ length: 72 }, (_, index) => 730 + index * 10),
	768,
	1024,
].sort((left, right) => left - right);

const freshLoadWidths = new Set([320, 390, 720, 721, 768, 1024, 1440]);

const defaultStates = {
	"access.html": [{}, { case: "long" }],
	"activity.html": [{}, { case: "wide" }],
	"components.html": [{}],
	"index.html": [{}],
	"reports.html": [{}, { state: "short" }],
	"settings.html": [{}, { case: "wide" }, { log: "every" }],
};

const defaultActions = {
	"index.html": [{ id: "details" }],
	"reports.html": [{ id: "expand-days", maxWidth: 720 }],
};

export const queryName = (query) =>
	new URLSearchParams(Object.entries(query).sort()).toString() || "default";

export function belongingWidths(value) {
	if (!value || value === "all") return ALL_BELONGING_WIDTHS;
	const widths = [
		...new Set(
			String(value)
				.split(",")
				.map((item) => Number(item.trim())),
		),
	].sort((left, right) => left - right);
	for (const width of widths)
		if (!Number.isInteger(width) || width < 320 || width > 1440)
			throw new Error(`--widths accepts integers from 320 to 1440: ${value}`);
	return widths;
}

export function belongingSegments(widths) {
	const selected = [...new Set(widths)].sort((left, right) => left - right);
	if (!selected.length) return [];
	const anchors = new Set(
		[...freshLoadWidths].filter((width) => selected.includes(width)),
	);
	anchors.add(selected[0]);
	if (
		selected[0] <= 720 &&
		selected.some((width) => width > 720) &&
		![...anchors].some((width) => width > 720)
	)
		anchors.add(selected.find((width) => width > 720));
	const orderedAnchors = [...anchors].sort((left, right) => left - right);
	return orderedAnchors.flatMap((anchor, index) => {
		const next = orderedAnchors[index + 1];
		const segment = selected.filter(
			(width) => width >= anchor && (next === undefined || width < next),
		);
		return segment.length ? [segment] : [];
	});
}

export function heightForBelongingWidth(width) {
	if (width <= 720) return 844;
	if (width === 768) return 1024;
	return 900;
}

export function belongingStates(page, options = {}) {
	if (options.states) {
		const states = String(options.states)
			.split(",")
			.map((state) => state.replace(/^history=/, "state="))
			.join(",");
		return stateCases(page, { states, query: "" }).map((state) => ({
			label: state.name,
			query: state.query,
			actions: [],
			feature: "page",
			proof: null,
		}));
	}

	const baseQueries = defaultStates[page.page] ?? [{}];
	const actions = (defaultActions[page.page] ?? []).map((action) => {
		const feature = page.features.find(
			(candidate) => candidate.id === action.id,
		);
		if (!feature)
			throw new Error(`${page.page}: missing recipe feature ${action.id}`);
		return { feature, maxWidth: action.maxWidth };
	});
	const states = [];
	for (const base of baseQueries) {
		const resolved = resolveQuery(page, base);
		states.push({
			label: queryName(resolved.query),
			query: resolved.query,
			actions: [],
			feature: "page",
			proof: null,
		});
		for (const { feature, maxWidth } of actions)
			states.push({
				label: `${queryName(resolved.query)} + ${feature.id}`,
				query: resolved.query,
				actions: feature.actions,
				feature: feature.id,
				maxWidth,
				proof: feature.proof,
			});
	}
	return states;
}
