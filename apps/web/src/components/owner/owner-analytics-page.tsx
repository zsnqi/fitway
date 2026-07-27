import { useOwnerDailyAnalytics } from "@/hooks/use-owner-daily-analytics";

import {
	OwnerAnalyticsError,
	OwnerAnalyticsLoading,
	OwnerAnalyticsView,
} from "./owner-analytics-view";

export function OwnerAnalyticsPage() {
	const query = useOwnerDailyAnalytics();
	if (query.isPending) return <OwnerAnalyticsLoading />;
	if (query.isError || !query.data) {
		return <OwnerAnalyticsError onRetry={() => void query.refetch()} />;
	}
	return (
		<OwnerAnalyticsView
			daily={query.data.daily}
			currentTimeZone={query.data.timeContext.current.timeZone}
			timeZoneByVersion={query.data.timeZoneByVersion}
		/>
	);
}
