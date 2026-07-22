import { toORPCError } from "@orpc/client";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { OwnerAnalyticsPage } from "@/components/owner/owner-analytics-page";
import { useOwnerAnalyticsMessages } from "@/components/owner/use-owner-analytics-messages";
import { StaffShell } from "@/components/staff/staff-shell";
import { useStaffMessages } from "@/hooks/use-staff-messages";
import { client } from "@/utils/orpc";

export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		try {
			await client.admin.session();
			return { adminAccess: "allowed" as const };
		} catch (error) {
			const status = toORPCError(error).status;
			if (status === 401) throw redirect({ to: "/login", replace: true });
			if (status === 403) return { adminAccess: "forbidden" as const };
			throw error;
		}
	},
	component: AdminRoute,
});

function AdminRoute() {
	const { adminAccess } = Route.useRouteContext();
	const messages = useStaffMessages();
	const ownerMessages = useOwnerAnalyticsMessages();

	return (
		<StaffShell active="admin" showAdminLink={adminAccess === "allowed"}>
			<main id="operations-main" className="operations-main" tabIndex={-1}>
				<header className="operations-page-heading">
					<p>
						{adminAccess === "allowed"
							? ownerMessages.eyebrow
							: messages.admin.eyebrow}
					</p>
					<h1>
						{adminAccess === "allowed"
							? ownerMessages.title
							: messages.admin.title}
					</h1>
					<span>
						{adminAccess === "allowed"
							? ownerMessages.description
							: messages.admin.description}
					</span>
				</header>
				{adminAccess === "forbidden" ? (
					<section className="admin-state admin-state--forbidden" role="alert">
						<ShieldCheck aria-hidden="true" />
						<h2>{messages.admin.wrongRoleTitle}</h2>
						<p>{messages.admin.wrongRoleDescription}</p>
						<Link className="admin-state__action" to="/staff">
							{messages.admin.backToOperations}
						</Link>
					</section>
				) : (
					<OwnerAnalyticsPage />
				)}
			</main>
		</StaffShell>
	);
}
