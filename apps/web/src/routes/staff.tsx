import { toORPCError } from "@orpc/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { StaffCommandsPanel } from "@/components/staff/commands/staff-commands-panel";
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
	const redirectToLogin = useCallback(
		() => void navigate({ to: "/login", replace: true }),
		[navigate],
	);

	useEffect(() => {
		if (unauthorized) redirectToLogin();
	}, [redirectToLogin, unauthorized]);

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
		<StaffShell active="staff" showAdminLink={session.role === "owner"}>
			<main id="operations-main" className="operations-main" tabIndex={-1}>
				<header className="operations-page-heading">
					<p>{messages.staff.eyebrow}</p>
					<h1>{messages.staff.title}</h1>
					<span>{messages.staff.description}</span>
				</header>
				<div className={snapshot.data ? "command-page-layout" : undefined}>
					{content}
					{snapshot.data ? (
						<StaffCommandsPanel
							snapshot={snapshot.data}
							onRefresh={async () => {
								await snapshot.refetch();
							}}
							onSessionExpired={redirectToLogin}
						/>
					) : null}
				</div>
			</main>
		</StaffShell>
	);
}
