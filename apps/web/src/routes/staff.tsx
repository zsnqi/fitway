import { toORPCError } from "@orpc/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import {
	OperationalSnapshotError,
	OperationalSnapshotSkeleton,
	OperationalSnapshotView,
} from "@/components/staff/operational-snapshot-view";
import { StaffShell } from "@/components/staff/staff-shell";
import { useStaffMessages } from "@/hooks/use-staff-messages";
import { useStaffOperationalSnapshot } from "@/hooks/use-staff-operational-snapshot";
import { requireStaffSession } from "@/routes/_auth/-session";

export const Route = createFileRoute("/staff")({
	beforeLoad: async () => ({ session: await requireStaffSession() }),
	component: StaffRoute,
});

function StaffRoute() {
	const { session } = Route.useRouteContext();
	const navigate = useNavigate({ from: "/staff" });
	const messages = useStaffMessages();
	const snapshot = useStaffOperationalSnapshot();
	const unauthorized = snapshot.error
		? toORPCError(snapshot.error).status === 401
		: false;

	useEffect(() => {
		if (unauthorized) void navigate({ to: "/login", replace: true });
	}, [navigate, unauthorized]);

	let content = <OperationalSnapshotSkeleton />;
	if (snapshot.data)
		content = <OperationalSnapshotView snapshot={snapshot.data} />;
	else if (snapshot.isError && !unauthorized) {
		content = (
			<OperationalSnapshotError
				onRetry={() => void snapshot.refetch()}
				retrying={snapshot.isFetching}
			/>
		);
	}

	return (
		<StaffShell active="staff" showAdminLink={session.role === "owner"}>
			<main id="operations-main" className="operations-main" tabIndex={-1}>
				<header className="operations-page-heading">
					<p>{messages.staff.eyebrow}</p>
					<h1>{messages.staff.title}</h1>
					<span>{messages.staff.description}</span>
				</header>
				{content}
			</main>
		</StaffShell>
	);
}
