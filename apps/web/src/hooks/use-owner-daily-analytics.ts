import { useQuery } from "@tanstack/react-query";

import {
	parseAnalyticsTimeContext,
	parseOwnerDailyAnalytics,
	settingsVersionsForAnalytics,
} from "@/lib/owner-analytics-contract";
import { client } from "@/utils/orpc";

export function useOwnerDailyAnalytics() {
	return useQuery({
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
		refetchOnWindowFocus: false,
	});
}
