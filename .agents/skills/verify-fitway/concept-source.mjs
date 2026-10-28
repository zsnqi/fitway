import { resolve } from "node:path";
import { ToolStartupError } from "../../../scripts/agent-environment/tool-contract.mjs";
import { canonical } from "./core.mjs";
import { repository } from "./discover.mjs";
import { extractDeclaredConcept } from "./drift-tree.mjs";

const sideOptions = {
	build: {
		folder: "concept",
		ref: "ref",
		recipes: "recipes",
		label: "CONCEPT",
	},
	baseline: {
		folder: "baseline",
		ref: "baseline-ref",
		recipes: "baseline-recipes",
		label: "BASELINE CONCEPT",
	},
};

export function resolveConceptSide(options, side, { required = true } = {}) {
	const names = sideOptions[side];
	const folder = options[names.folder];
	const ref = options[names.ref];
	if (folder && ref)
		throw new ToolStartupError(
			`Use --${names.folder} or --${names.ref}, not both.`,
			`drop one of --${names.folder} or --${names.ref}`,
		);
	if (required && !folder && !ref)
		throw new ToolStartupError(
			`Missing --${names.folder} or --${names.ref}.`,
			`pass --${names.folder} <folder> or --${names.ref} <commit>`,
		);
	if (ref) {
		const extracted = extractDeclaredConcept(repository, {
			ref,
			cache: true,
		});
		console.log(
			`${names.label} ${extracted.reused ? "EXTRACT REUSED" : "EXTRACTED"}: ${extracted.concept}; commit ${extracted.commit}`,
		);
		return {
			...extracted,
			concept: extracted.concept,
			recipes: options[names.recipes] || extracted.recipes,
		};
	}
	if (!folder) return null;
	const concept = canonical(resolve(folder));
	return {
		concept,
		recipes:
			options[names.recipes] || resolve(concept, "verification-recipes.json"),
		commit: null,
		ref: null,
		cleanup: () => undefined,
	};
}

export function resolveCommandConcepts(options, { baseline = false } = {}) {
	return {
		build: resolveConceptSide(options, "build"),
		baseline: baseline ? resolveConceptSide(options, "baseline") : null,
	};
}
