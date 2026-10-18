// How a capture is named on disk, identified, and summarized.
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

export { captureIdentity, safe };
