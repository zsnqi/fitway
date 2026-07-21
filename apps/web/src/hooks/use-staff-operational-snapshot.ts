import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

export function useStaffOperationalSnapshot() {
	return useQuery({
		...orpc.staff.operationalSnapshot.queryOptions(),
		retry: false,
		refetchInterval: 30_000,
		refetchIntervalInBackground: false,
		refetchOnWindowFocus: true,
	});
}
