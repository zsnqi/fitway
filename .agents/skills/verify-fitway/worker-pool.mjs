// Run verification jobs concurrently while preserving input order and failure order.
// Start in input order and finish active jobs before command-owned cleanup.
async function runWorkers(jobs, count, onFailure) {
	let next = 0;
	let failed;
	await Promise.all(
		Array.from({ length: Math.min(count, jobs.length) }, async () => {
			while (next < jobs.length && !failed) {
				const index = next++;
				try {
					await jobs[index]();
				} catch (error) {
					if (!failed || index < failed.index) failed = { index, error };
				}
			}
		}),
	);
	if (failed) {
		onFailure(failed.index);
		throw failed.error;
	}
}

export { runWorkers };
