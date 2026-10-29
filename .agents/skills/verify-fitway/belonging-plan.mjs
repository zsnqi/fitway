// Plan belonging-check widths, segments, heights, and page states.
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";
import { resolveQuery, stateCases, stateName } from "./drive-plan.mjs";

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
	"index.html": ["details"],
	"reports.html": ["expand-days"],
};

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
			throw new ToolStartupError(
				`--widths accepts integers from 320 to 1440: ${value}`,
				"pass --widths all or a comma-separated list of integers from 320 to 1440",
			);
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

// A state is a query and, for a feature state, the recipe feature reached after the page loads.
export function belongingStates(page, options = {}) {
	if (options.states)
		return stateCases(page, options).map((state) => ({
			label: state.name,
			query: state.query,
			feature: "page",
			recipe: null,
		}));

	const features = (defaultActions[page.page] ?? []).map((id) => {
		const feature = page.features.find((candidate) => candidate.id === id);
		if (!feature) throw new Error(`${page.page}: missing recipe feature ${id}`);
		return feature;
	});
	const states = [];
	for (const base of defaultStates[page.page] ?? [{}]) {
		const { query } = resolveQuery(page, base);
		states.push({
			label: stateName(query),
			query,
			feature: "page",
			recipe: null,
		});
		for (const feature of features)
			states.push({
				label: `${stateName(query)} + ${feature.id}`,
				query,
				feature: feature.id,
				recipe: feature,
			});
	}
	return states;
}
