// check:repository's step from the resolved arguments to its options, kept beside
// verify-repository.mjs so the giant file does not grow and a test can call the step alone.
export function repositoryOptions(parsed) {
	return { verbose: parsed.options.verbose === true };
}
