// Validate and match recipe state transitions by language and query.
const isRecord = (value) =>
	value !== null && typeof value === "object" && !Array.isArray(value);

export const stateWhenKey = (when = {}) =>
	JSON.stringify(
		Object.entries(when).sort(([left], [right]) => left.localeCompare(right)),
	);

export const matchesStateRule = (rule, query, language) =>
	(!rule.language || rule.language === language) &&
	Object.entries(rule.when || {}).every(([key, value]) => query[key] === value);

const canonical = (value) => JSON.stringify(value ?? null);

const featureItemSignatures = (feature) => {
	const items =
		Array.isArray(feature.items) && feature.items.length
			? feature.items
			: [
					{
						actions: feature.actions,
						keyboardActions: feature.keyboardActions,
						input: feature.input,
						inputs: feature.inputs,
					},
				];

	return items.map((item) =>
		canonical({
			actions: item.actions ?? feature.actions ?? null,
			keyboardActions: item.keyboardActions ?? feature.keyboardActions ?? null,
			input:
				item.input ?? item.inputs ?? feature.input ?? feature.inputs ?? null,
		}),
	);
};

const validateFeatureEnds = (feature, rules, source, featureIndex) => {
	if (!isRecord(feature) || feature.ends === undefined) return;

	const label = `${source}: feature ${feature.id || featureIndex}`;
	if (feature.changesState)
		throw new Error(
			`${label} cannot declare both changesState and ends; ends replaces changesState with selective retention.`,
		);
	if (!Array.isArray(feature.ends))
		throw new Error(`${label} ends must be an array.`);

	if (
		feature.keyboardActions !== undefined &&
		canonical(feature.keyboardActions) !== canonical(feature.actions || [])
	)
		throw new Error(
			`${label} ends requires every item to declare the same actions and inputs.`,
		);
	if (
		Array.isArray(feature.inputs) &&
		new Set(feature.inputs.map(canonical)).size > 1
	)
		throw new Error(
			`${label} ends requires every item to declare the same actions and inputs.`,
		);
	const signatures = featureItemSignatures(feature);
	if (new Set(signatures).size > 1)
		throw new Error(
			`${label} ends requires every item to declare the same actions and inputs.`,
		);

	const itemLanguages = Array.isArray(feature.items)
		? feature.items
				.map((item) => item?.language)
				.filter((language) => typeof language === "string")
		: [];
	const languages = feature.language
		? [feature.language]
		: Array.isArray(feature.languages) && feature.languages.length
			? [...new Set(feature.languages)]
			: itemLanguages.length
				? [...new Set(itemLanguages)]
				: ["ar", "en"];

	validateEnds(feature.ends, rules, label, languages);
};

export function endedWhenKeys(rules) {
	const ended = new Set();
	for (const rule of rules)
		if (rule.afterActions)
			for (const declaration of rule.ends || [])
				ended.add(stateWhenKey(declaration.when));
	return ended;
}

function validateEnds(ends, rules, source, languages) {
	for (const [endIndex, declaration] of ends.entries()) {
		if (
			!isRecord(declaration) ||
			Object.keys(declaration).length !== 1 ||
			!Object.hasOwn(declaration, "when")
		)
			throw new Error(
				`${source}: ends[${endIndex}] may only name when; shows labels do not identify rules.`,
			);
		if (!isRecord(declaration.when) || !Object.keys(declaration.when).length)
			throw new Error(
				`${source}: ends[${endIndex}] must name an exact non-wildcard when object.`,
			);
		const key = stateWhenKey(declaration.when);
		for (const language of languages) {
			const matches = rules.filter(
				(candidate) =>
					!candidate.afterActions &&
					stateWhenKey(candidate.when || {}) === key &&
					matchesStateRule(candidate, declaration.when, language),
			);
			if (!matches.length)
				throw new Error(
					`${source}: ends[${endIndex}] ${JSON.stringify(declaration.when)} matches no before rule for ${language}; use one exact when.`,
				);
			if (matches.length > 1)
				throw new Error(
					`${source}: ends[${endIndex}] ${JSON.stringify(declaration.when)} matches several before rules for ${language}; use one exact when.`,
				);
		}
	}
}

export function validateStateRules(page, source = page?.page || "recipe") {
	if (page?.states !== undefined && !Array.isArray(page.states))
		throw new Error(`${source}: states must be an array.`);
	const rules = page?.states || [];
	if (page?.features !== undefined && !Array.isArray(page.features))
		throw new Error(`${source}: features must be an array.`);
	for (const [featureIndex, feature] of (page?.features || []).entries())
		validateFeatureEnds(feature, rules, source, featureIndex);
	for (const [ruleIndex, rule] of rules.entries()) {
		if (!isRecord(rule))
			throw new Error(`${source}: state rule ${ruleIndex} must be an object.`);
		if (rule.ends !== undefined && !rule.afterActions)
			throw new Error(
				`${source}: state rule ${ruleIndex} declares ends but is not an afterActions rule.`,
			);
		if (!rule.afterActions || rule.ends === undefined) continue;
		if (!Array.isArray(rule.ends))
			throw new Error(
				`${source}: afterActions rule ${ruleIndex} ends must be an array.`,
			);
		validateEnds(
			rule.ends,
			rules,
			source,
			rule.language ? [rule.language] : ["ar", "en"],
		);
	}
	return page;
}
