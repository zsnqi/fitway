const isRecord = (value) =>
	value !== null && typeof value === "object" && !Array.isArray(value);

export const stateWhenKey = (when = {}) =>
	JSON.stringify(
		Object.entries(when).sort(([left], [right]) => left.localeCompare(right)),
	);

export function endedWhenKeys(rules) {
	const ended = new Set();
	for (const rule of rules)
		if (rule.afterActions)
			for (const declaration of rule.ends || [])
				ended.add(stateWhenKey(declaration.when));
	return ended;
}

export function validateStateRules(page, source = page?.page || "recipe") {
	if (page?.states !== undefined && !Array.isArray(page.states))
		throw new Error(`${source}: states must be an array.`);
	const rules = page?.states || [];
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
		for (const [endIndex, declaration] of rule.ends.entries()) {
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
			const matches = rules.filter(
				(candidate) =>
					!candidate.afterActions && stateWhenKey(candidate.when || {}) === key,
			);
			if (!matches.length)
				throw new Error(
					`${source}: ends[${endIndex}] ${JSON.stringify(declaration.when)} matches no before rule; use one exact when.`,
				);
			if (matches.length > 1)
				throw new Error(
					`${source}: ends[${endIndex}] ${JSON.stringify(declaration.when)} matches several before rules; use one exact when.`,
				);
		}
	}
	return page;
}
