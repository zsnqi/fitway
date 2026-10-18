// The state proofs a capture requires, and proving one beside a capture.
import { prove } from "./drive.mjs";
import {
	matchesStateRule,
	stateWhenKey,
	validateStateRules,
} from "./state-rules.mjs";

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

export { proveStateRule, requestedProofs };
