import type { HealthIncidentSummary } from "@fitway/api/health/incidents";
import { healthIncidentSummarySchema } from "@fitway/api/health/incidents";
import { useQuery } from "@tanstack/react-query";

import { client } from "@/utils/orpc";

export type OwnerHealthResult = {
	/** `unavailable` is retained for the section contract but is not Daily-gated. */
	status: "unavailable" | "pending" | "error" | "success";
	summary: HealthIncidentSummary | null;
	retry: () => void;
};

/**
 * Owner incident and uptime summary.
 *
 * ## One independent request
 *
 * Mounting this section adds exactly one request to `/admin`. In particular it never
 * calls `admin.analytics.timeContext`: the summary is windowed server-side from the
 * configured gym timezone and business day, so the zone the rows are dated in already
 * travels inside this payload. A second call to that Phase 9 procedure would change
 * the request behaviour of a neighbouring surface whose spec asserts its post data
 * exactly. System Status owns this request and its pending/error state, independently
 * of Daily. Its response already carries the server-windowed timezone/business-day
 * context, so there is no analytics prerequisite to observe.
 *
 * The response is validated against the shared transport schema, so a malformed
 * payload surfaces as an error rather than rendering as a plausible-looking uptime
 * figure — a wrong number here is worse than no number.
 */
export function useOwnerHealth(): OwnerHealthResult {
	const query = useQuery({
		queryKey: ["owner", "health", "summary"],
		queryFn: async (): Promise<HealthIncidentSummary> =>
			healthIncidentSummarySchema.parse(await client.admin.health.summary()),
		retry: false,
		refetchOnWindowFocus: false,
	});

	const status: OwnerHealthResult["status"] = query.isError
		? "error"
		: query.isPending
			? "pending"
			: "success";

	return {
		status,
		summary: status === "success" ? (query.data ?? null) : null,
		retry: () => void query.refetch(),
	};
}
