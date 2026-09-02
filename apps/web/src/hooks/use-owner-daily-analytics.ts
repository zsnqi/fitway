import { useQuery } from "@tanstack/react-query";

import {
	parseAnalyticsTimeContext,
	parseOwnerDailyAnalytics,
	settingsVersionsForAnalytics,
} from "@/lib/owner-analytics-contract";
import { client } from "@/utils/orpc";

export function useOwnerDailyAnalytics() {
	const query = useQuery({
		queryKey: ["owner", "analytics", "daily"],
		queryFn: async () => {
			const daily = parseOwnerDailyAnalytics(
				await client.admin.analytics.daily({}),
			);
			const settingsVersions = settingsVersionsForAnalytics(daily);
			const resolved = parseAnalyticsTimeContext(
				await client.admin.analytics.timeContext({ settingsVersions }),
				settingsVersions,
			);
			return { daily, ...resolved };
		},
		retry: false,
		// Every lazy Owner section observes this shared prerequisite. Suppress only
		// the duplicate transport pair caused when a late section joins an already
		// observed query. The first observer after a real route remount retains the
		// normal stale-data refresh, as does reconnect recovery.
		refetchOnMount: (query) => query.getObserversCount() === 0,
		refetchOnWindowFocus: false,
		// Section navigation adds observers after Daily has settled. Keep the same
		// resolved business-day prerequisite across that in-page transition instead
		// of issuing a duplicate daily/time-context pair for each visited section.
		staleTime: 60_000,
	});

	// React Query reports a failed background refresh as an error even while it
	// retains the last successful payload. For this shared page prerequisite,
	// cached validated data remains usable: exposing it as unavailable would
	// unmount already visited sections and discard their local drafts/filters.
	if (query.data && query.isError) {
		return {
			...query,
			status: "success" as const,
			isError: false as const,
			isSuccess: true as const,
		};
	}

	return query;
}
