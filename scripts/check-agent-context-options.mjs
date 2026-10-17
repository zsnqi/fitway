// check:agent-context's step from the resolved arguments to its options, kept beside
// check-agent-context.mjs so the giant file does not grow and a test can call the step alone.
export function agentContextOptions(parsed) {
	return {
		milestoneId: parsed.options.milestoneId ?? null,
		checkTracked: !parsed.options.noTracked,
		verbose: parsed.options.verbose === true,
	};
}
