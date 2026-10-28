import {
	auditTempCitations,
	collectTrackedCitationRecords,
} from "./cited-evidence.mjs";
import { countNewTempScripts, planEvidencePrune } from "./prune-evidence.mjs";

export async function collectCitedSurveyEvidence({
	attempt,
	checkout,
	context,
	folders,
	out,
	tempRoot,
	worktrees,
}) {
	const rollingReport = context?.records.find(
		(item) => item.kind === "gardener",
	);
	const citationRecords = await attempt("tracked citation records", () =>
		collectTrackedCitationRecords({ checkout }),
	);
	return {
		citationRecords,
		goneCitations: citationRecords
			? await attempt("gone citations", () =>
					auditTempCitations({
						checkout,
						records: citationRecords,
						tempRoot,
					}),
				)
			: null,
		prune:
			citationRecords && folders && worktrees
				? await attempt("evidence prune", () =>
						planEvidencePrune({
							excluded: [out],
							measurements: folders,
							records: citationRecords,
							tempRoot,
							worktrees,
						}),
					)
				: null,
		scriptFiles: await attempt("script files", () =>
			countNewTempScripts({
				excluded: [out],
				previousReportText: rollingReport?.text ?? null,
				tempRoot,
			}),
		),
	};
}
