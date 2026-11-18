// Write the final comparison record, print its counts, and fail on differences or problems.
import { jsonOutput, ReportedFailure } from "./core.mjs";

export async function reportComparison(result, options, out) {
	await jsonOutput(out, "comparison.json", result);
	const counts = Object.fromEntries(
		["equal", "different", "not-reachable", "problem"].map((key) => [
			key,
			result.items.filter((i) => i.result === key).length,
		]),
	);
	const moments = result.items.flatMap((item) =>
		(item.timeline?.samples || []).map((sample) => ({
			...sample,
			item: `${item.feature} ${item.state} ${item.language} ${item.size} ${item.input} ${item.motion} ${item.transport} ${item.colors}`,
		})),
	);
	const timelineCounts = Object.fromEntries(
		["equal", "different", "not-held", "problem"].map((key) => [
			key,
			moments.filter((s) => s.result === key).length,
		]),
	);
	const failed =
		counts.different ||
		counts.problem ||
		timelineCounts.different ||
		timelineCounts.problem;
	console.log(
		`COMPARE ${failed ? "FAIL" : options.timeline && timelineCounts["not-held"] ? "INCOMPLETE" : "PASS"}: ${counts.equal} equal; ${counts.different} different; ${counts["not-reachable"]} not reachable; ${counts.problem} problems; ${out}/comparison.json`,
	);
	if (options.timeline) {
		result.timelineSummary = {
			...timelineCounts,
			notHeld: moments.filter((s) => s.result === "not-held"),
		};
		console.log(
			`TIMELINE ${timelineCounts.different || timelineCounts.problem ? "FAIL" : timelineCounts["not-held"] ? "INCOMPLETE" : "PASS"}: ${timelineCounts.equal} equal; ${timelineCounts.different} different; ${timelineCounts["not-held"]} not held; ${timelineCounts.problem} problems`,
		);
		for (const sample of result.timelineSummary.notHeld) {
			const varying = Object.values(sample.stability).filter(
				(side) => side?.identical === false,
			);
			console.log(
				`NOT-HELD: ${sample.item}; time ${sample.time} ms; ${varying.map((side) => `${side.side} captures ${side.first} and ${side.repeat}`).join("; ")}; ${sample.sources.map((f) => `${f.source.file}:${f.source.line}`).join(", ") || "no authored callback source observed"}`,
			);
		}
		await jsonOutput(out, "comparison.json", result);
	}
	if (
		counts.different ||
		counts.problem ||
		timelineCounts.different ||
		timelineCounts.problem
	)
		throw new ReportedFailure(
			"Comparison has differences or problems; inspect comparison.json.",
		);
}
