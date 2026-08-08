import { toORPCError } from "@orpc/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import {
	OperationalSnapshotError,
	OperationalSnapshotSkeleton,
	OperationalSnapshotView,
} from "@/components/staff/operational-snapshot-view";
import { StaffBoardShell } from "@/components/staff/staff-board-shell";
import { useStaffOperationalSnapshot } from "@/hooks/use-staff-operational-snapshot";
import { requireStaffSession } from "@/routes/_auth/-session";

export const Route = createFileRoute("/staff")({
	beforeLoad: async () => ({ session: await requireStaffSession() }),
	component: StaffRoute,
});

function StaffRoute() {
	const { session } = Route.useRouteContext();
	const navigate = useNavigate({ from: "/staff" });
	const snapshot = useStaffOperationalSnapshot();
	const unauthorized = snapshot.error
		? toORPCError(snapshot.error).status === 401
		: false;

	useEffect(() => {
		if (unauthorized) void navigate({ to: "/login", replace: true });
	}, [navigate, unauthorized]);

	let content = <OperationalSnapshotSkeleton />;
	if (snapshot.isError && !unauthorized) {
		content = (
			<OperationalSnapshotError
				onRetry={() => void snapshot.refetch()}
				retrying={snapshot.isFetching}
			/>
		);
	} else if (snapshot.data)
		content = <OperationalSnapshotView snapshot={snapshot.data} />;

	return (
		<StaffBoardShell showAdminLink={session.role === "owner"}>
			{content}
		</StaffBoardShell>
	);
}
