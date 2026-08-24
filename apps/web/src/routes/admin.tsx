import { toORPCError } from "@orpc/client";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { OwnerAccessSection } from "@/components/owner/access/owner-access-section";
import { OwnerAuditSection } from "@/components/owner/audit/owner-audit-section";
import { OwnerHealthSection } from "@/components/owner/health/owner-health-section";
import { OwnerAnalyticsPage } from "@/components/owner/owner-analytics-page";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OwnerAnalyticsModeSwitch } from "@/components/owner/reporting/owner-analytics-mode-switch";
import { OwnerReportingSection } from "@/components/owner/reporting/owner-reporting-section";
import { useOwnerAnalyticsMessages } from "@/components/owner/use-owner-analytics-messages";
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
		<OwnerShell>
			<main
				id="operations-main"
				className="owner-main operations-main"
				tabIndex={-1}
			>
				{adminAccess === "forbidden" ? (
					<>
						<header className="operations-page-heading">
							<p>{messages.admin.eyebrow}</p>
							<h1>{messages.admin.title}</h1>
							<span>{messages.admin.description}</span>
						</header>
						<section
							className="admin-state admin-state--forbidden"
							role="alert"
						>
							<ShieldCheck aria-hidden="true" />
							<h2>{messages.admin.wrongRoleTitle}</h2>
							<p>{messages.admin.wrongRoleDescription}</p>
							<Link className="admin-state__action" to="/staff">
								{messages.admin.backToOperations}
							</Link>
						</section>
					</>
				) : (
					<OwnerAnalyticsModeSwitch
						heading={
							<>
								<p>{ownerMessages.eyebrow}</p>
								<h1>{ownerMessages.title}</h1>
								<span>{ownerMessages.description}</span>
							</>
						}
						daily={
							<>
								<OwnerAnalyticsPage />
								<OwnerAuditSection />
								<OwnerHealthSection />
								<OwnerAccessSection enabled />
							</>
						}
						history={(prerequisite) => (
							<OwnerReportingSection prerequisite={prerequisite} />
						)}
					/>
				)}
			</main>
		</OwnerShell>
	);
}
