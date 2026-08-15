import type { HealthIncidentSummary } from "@fitway/api/health/incidents";
import { healthIncidentSummarySchema } from "@fitway/api/health/incidents";
import { useQuery } from "@tanstack/react-query";

import { client } from "@/utils/orpc";

import { useOwnerDailyAnalytics } from "./use-owner-daily-analytics";

export type OwnerHealthResult = {
	/** `unavailable` means `/admin` is already speaking for this transport. */
	status: "unavailable" | "pending" | "error" | "success";
	summary: HealthIncidentSummary | null;
	retry: () => void;
};

/**
 * Owner incident and uptime summary.
 *
 * ## One request, and no second call to a shared procedure
 *
 * Mounting this section adds exactly one request to `/admin`. In particular it never
 * calls `admin.analytics.timeContext`: the summary is windowed server-side from the
 * configured gym timezone and business day, so the zone the rows are dated in already
 * travels inside this payload. A second call to that Phase 9 procedure would change
 * the request behaviour of a neighbouring surface whose spec asserts its post data
 * exactly. The analytics query read here is the one `/admin` already issues, so
 * observing it costs nothing on the wire.
 *
 * ## One live region and one retry per page
 *
 * While that shared query is pending or failed the section is `unavailable` and
 * renders nothing. `/admin` is then already announcing exactly one "loading" status,
 * or showing exactly one error with one retry, for the same transport; a second copy
 * would be a competing announcement for a screen reader and a duplicate control for
 * everyone else (`DESIGN_GUIDE.md` §13). This is the same standing-down the accepted
 * audit section performs on this route, for the same reason.
 *
 * The response is validated against the shared transport schema, so a malformed
 * payload surfaces as an error rather than rendering as a plausible-looking uptime
 * figure — a wrong number here is worse than no number.
 */
export function useOwnerHealth(): OwnerHealthResult {
	const analytics = useOwnerDailyAnalytics();
	const pageSettled = !analytics.isPending && !analytics.isError;
	const query = useQuery({
		queryKey: ["owner", "health", "summary"],
		queryFn: async (): Promise<HealthIncidentSummary> =>
			healthIncidentSummarySchema.parse(await client.admin.health.summary()),
		retry: false,
		refetchOnWindowFocus: false,
	});

	const status: OwnerHealthResult["status"] = !pageSettled
		? "unavailable"
		: query.isError
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
